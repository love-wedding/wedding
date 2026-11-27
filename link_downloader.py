"""
File Downloader - tải hàng loạt link trực tiếp (ảnh, nhạc, video, zip, pdf, ...)

Cài đặt:
    pip install customtkinter requests pillow

Chạy:
    python downloader.py
"""

import io
import mimetypes
import os
import re
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import unquote, urlparse

import customtkinter as ctk
import requests
from PIL import Image
from tkinter import filedialog, messagebox

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# ---------- Màu sắc ----------
BG = "#0b0d14"
PANEL = "#141824"
CARD = "#1b2030"
CARD_HOVER = "#232940"
BORDER = "#2a3150"
ACCENT = "#7c5cff"
ACCENT_HOVER = "#6844ff"
SUCCESS = "#22c55e"
ERROR = "#ef4444"
MUTED = "#8b93a7"

THUMB = (88, 88)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"}
MAX_PREVIEW_BYTES = 15 * 1024 * 1024  # chỉ tải ảnh xem trước nếu < 15MB

TYPE_STYLE = {
    "image": ("#0ea5e9", "IMG"),
    "audio": ("#ec4899", "♪"),
    "video": ("#f97316", "▶"),
    "pdf": ("#ef4444", "PDF"),
    "archive": ("#eab308", "ZIP"),
    "other": ("#64748b", "FILE"),
}


# ---------- Helpers ----------
def human_size(n):
    if not n:
        return "Không rõ dung lượng"
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def classify(content_type, filename):
    ct = (content_type or "").lower()
    ext = os.path.splitext(filename)[1].lower()
    if ct.startswith("image/") or ext in (".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"):
        return "image"
    if ct.startswith("audio/") or ext in (".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aac"):
        return "audio"
    if ct.startswith("video/") or ext in (".mp4", ".mkv", ".mov", ".avi", ".webm"):
        return "video"
    if "pdf" in ct or ext == ".pdf":
        return "pdf"
    if ext in (".zip", ".rar", ".7z", ".tar", ".gz") or "zip" in ct:
        return "archive"
    return "other"


def guess_filename(url, headers):
    name = None
    cd = headers.get("Content-Disposition", "")
    m = re.search(r"filename\*=(?:UTF-8'')?([^;]+)", cd, re.I)
    if m:
        name = unquote(m.group(1).strip().strip('"'))
    else:
        m = re.search(r'filename="?([^";]+)"?', cd, re.I)
        if m:
            name = m.group(1).strip()
    if not name:
        name = unquote(os.path.basename(urlparse(url).path)) or "file"
    name = re.sub(r'[\\/:*?"<>|]', "_", name)
    if not os.path.splitext(name)[1]:
        ext = mimetypes.guess_extension((headers.get("Content-Type") or "").split(";")[0].strip())
        if ext:
            name += ext
    return name


def unique_path(folder, name, lock, reserved):
    with lock:
        base, ext = os.path.splitext(name)
        path, i = os.path.join(folder, name), 1
        while os.path.exists(path) or path in reserved:
            path = os.path.join(folder, f"{base} ({i}){ext}")
            i += 1
        reserved.add(path)
        return path


def make_placeholder(kind, size=THUMB):
    color = TYPE_STYLE[kind][0]
    img = Image.new("RGB", size, color)
    return ctk.CTkImage(img, size=size)


def cover_crop(img, size):
    tw, th = size[0] * 2, size[1] * 2  # nét hơn trên màn hình HiDPI
    ratio = max(tw / img.width, th / img.height)
    img = img.resize((max(1, int(img.width * ratio)), max(1, int(img.height * ratio))), Image.LANCZOS)
    l, t = (img.width - tw) // 2, (img.height - th) // 2
    return img.crop((l, t, l + tw, t + th))


# ---------- Một dòng trong danh sách ----------
class FileRow(ctk.CTkFrame):
    def __init__(self, master, url, on_toggle):
        super().__init__(master, fg_color=CARD, corner_radius=14, border_width=1, border_color=BORDER)
        self.url = url
        self.ready = False
        self.failed_fetch = False
        self.filename = None
        self.kind = "other"
        self.error_text = ""
        self.on_toggle = on_toggle
        self.var = ctk.BooleanVar(value=True)
        self.grid_columnconfigure(2, weight=1)

        self.check = ctk.CTkCheckBox(
            self, text="", variable=self.var, width=24, checkbox_width=22, checkbox_height=22,
            corner_radius=7, fg_color=ACCENT, hover_color=ACCENT_HOVER, border_color=BORDER,
            command=on_toggle, state="disabled",
        )
        self.check.grid(row=0, column=0, rowspan=2, padx=(16, 4), pady=12)

        self._img = make_placeholder("other")
        self.thumb = ctk.CTkLabel(
            self, text="...", image=self._img, compound="center", width=THUMB[0], height=THUMB[1],
            corner_radius=10, font=ctk.CTkFont(size=18, weight="bold"), text_color="white",
        )
        self.thumb.grid(row=0, column=1, rowspan=2, padx=10, pady=10)

        self.title = ctk.CTkLabel(
            self, text="Đang đọc thông tin...", anchor="w",
            font=ctk.CTkFont(size=14, weight="bold"), wraplength=460, justify="left",
        )
        self.title.grid(row=0, column=2, sticky="sw", padx=6, pady=(14, 0))

        self.meta = ctk.CTkLabel(self, text=url[:80], anchor="w", text_color=MUTED,
                                 font=ctk.CTkFont(size=12))
        self.meta.grid(row=1, column=2, sticky="nw", padx=6, pady=(0, 14))

        right = ctk.CTkFrame(self, fg_color="transparent")
        right.grid(row=0, column=3, rowspan=2, padx=(8, 18))
        self.status = ctk.CTkLabel(right, text="Chờ", text_color=MUTED, width=170, anchor="e",
                                   font=ctk.CTkFont(size=12))
        self.status.pack(anchor="e")
        self.progress = ctk.CTkProgressBar(right, width=170, height=6, corner_radius=3,
                                           progress_color=ACCENT, fg_color=BORDER)
        self.progress.set(0)
        self.progress.pack(anchor="e", pady=(6, 0))

        self.btn_copy = ctk.CTkButton(
            right, text="📋 Copy lỗi", width=100, height=24, corner_radius=8,
            fg_color=BORDER, hover_color="#3a4270", font=ctk.CTkFont(size=11),
            command=self.copy_error)

        # chuột phải vào dòng lỗi cũng copy được
        self.meta.bind("<Button-3>", lambda e: self.copy_error())
        self.title.bind("<Button-3>", lambda e: self.copy_error())

        for w in (self, self.thumb, self.title, self.meta):
            w.bind("<Enter>", lambda e: self.configure(fg_color=CARD_HOVER))
            w.bind("<Leave>", lambda e: self.configure(fg_color=CARD))

    def copy_error(self):
        if not self.error_text:
            return
        self.clipboard_clear()
        self.clipboard_append(f"{self.url}\n{self.error_text}")
        self.btn_copy.configure(text="✓ Đã copy")
        self.after(1500, lambda: self.btn_copy.configure(text="📋 Copy lỗi"))

    def _show_error(self, msg):
        self.error_text = msg
        self.btn_copy.pack(anchor="e", pady=(6, 0))

    def set_info(self, filename, kind, size, pil_img):
        self.ready = True
        self.filename, self.kind = filename, kind
        self.title.configure(text=filename)
        self.meta.configure(text=f"{kind.upper()}  •  {human_size(size)}", text_color=MUTED)
        if pil_img is not None:
            self._img = ctk.CTkImage(pil_img, size=THUMB)
            self.thumb.configure(image=self._img, text="")
        else:
            self._img = make_placeholder(kind)
            self.thumb.configure(image=self._img, text=TYPE_STYLE[kind][1])
        self.check.configure(state="normal")
        self.status.configure(text="Sẵn sàng", text_color=MUTED)

    def set_error(self, msg):
        self.ready = False
        self.title.configure(text="Không đọc được link")
        self.meta.configure(text=msg[:90], text_color=ERROR)
        self._show_error(msg)
        self.failed_fetch = True
        self.thumb.configure(text="✗")
        self.status.configure(text="Lỗi", text_color=ERROR)
        self.var.set(False)
        self.on_toggle()

    def set_progress(self, v, text):
        self.progress.set(v)
        self.status.configure(text=text, text_color=ACCENT)

    def set_done(self):
        self.progress.set(1)
        self.progress.configure(progress_color=SUCCESS)
        self.status.configure(text="✓ Hoàn tất", text_color=SUCCESS)

    def set_fail(self, msg):
        self.progress.configure(progress_color=ERROR)
        self.status.configure(text="✗ " + msg[:28], text_color=ERROR)
        self._show_error(msg)

    def reset(self):
        self.error_text = ""
        self.btn_copy.pack_forget()
        self.progress.set(0)
        self.progress.configure(progress_color=ACCENT)
        self.status.configure(text="Chờ tải...", text_color=MUTED)


# ---------- App ----------
class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("File Downloader")
        self.geometry("1100x780")
        self.minsize(920, 620)
        self.configure(fg_color=BG)

        self.rows = []
        self.seen = set()
        self.save_dir = ctk.StringVar(value=os.path.join(os.path.expanduser("~"), "Downloads"))
        self.pool = ThreadPoolExecutor(max_workers=6)
        self.downloading = False
        self.name_lock = threading.Lock()
        self.reserved = set()
        self.filter_key = "all"
        self.seg_labels = []
        self._view_job = None
        self._build()

    def _build(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(2, weight=1)

        # Header
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.grid(row=0, column=0, sticky="ew", padx=28, pady=(24, 6))
        ctk.CTkLabel(header, text="⬇  File Downloader",
                     font=ctk.CTkFont(size=28, weight="bold")).pack(side="left")
        ctk.CTkLabel(header, text="Ảnh • Nhạc • Video • PDF • ZIP ... bất kỳ link trực tiếp nào",
                     text_color=MUTED).pack(side="left", padx=16, pady=(10, 0))

        # Input
        panel = ctk.CTkFrame(self, fg_color=PANEL, corner_radius=18, border_width=1, border_color=BORDER)
        panel.grid(row=1, column=0, sticky="ew", padx=28, pady=8)
        panel.grid_columnconfigure(0, weight=1)

        self.textbox = ctk.CTkTextbox(panel, height=96, fg_color=CARD, corner_radius=12,
                                      font=ctk.CTkFont(size=13), border_width=1, border_color=BORDER)
        self.textbox.grid(row=0, column=0, sticky="ew", padx=(16, 8), pady=16)

        btns = ctk.CTkFrame(panel, fg_color="transparent")
        btns.grid(row=0, column=1, padx=(8, 16), pady=16)
        self.btn_load = ctk.CTkButton(
            btns, text="🔍  Thêm vào danh sách", width=190, height=44, corner_radius=12,
            fg_color=ACCENT, hover_color=ACCENT_HOVER,
            font=ctk.CTkFont(size=14, weight="bold"), command=self.load_links)
        self.btn_load.pack(pady=(0, 8))
        ctk.CTkButton(btns, text="🗑  Xoá hết", width=190, height=40, corner_radius=12,
                      fg_color=BORDER, hover_color="#343c60", command=self.clear_all).pack()

        ctk.CTkLabel(panel, text="Dán nhiều link, mỗi dòng 1 link (hoặc cách nhau bằng khoảng trắng / dấu phẩy)",
                     text_color=MUTED, font=ctk.CTkFont(size=11)
                     ).grid(row=1, column=0, columnspan=2, sticky="w", padx=20, pady=(0, 12))

        # List
        wrap = ctk.CTkFrame(self, fg_color=PANEL, corner_radius=18, border_width=1, border_color=BORDER)
        wrap.grid(row=2, column=0, sticky="nsew", padx=28, pady=8)
        wrap.grid_columnconfigure(0, weight=1)
        wrap.grid_rowconfigure(1, weight=1)

        bar = ctk.CTkFrame(wrap, fg_color="transparent")
        bar.grid(row=0, column=0, sticky="ew", padx=18, pady=(14, 4))
        self.master_var = ctk.BooleanVar(value=False)
        ctk.CTkCheckBox(bar, text="Chọn tất cả", variable=self.master_var, fg_color=ACCENT,
                        hover_color=ACCENT_HOVER, border_color=BORDER, corner_radius=7,
                        command=self.toggle_all).pack(side="left")
        self.seg = ctk.CTkSegmentedButton(
            bar, values=["Tất cả (0)", "Hợp lệ (0)", "Lỗi (0)"], height=30,
            fg_color=CARD, selected_color=ACCENT, selected_hover_color=ACCENT_HOVER,
            unselected_color=CARD, unselected_hover_color=BORDER,
            font=ctk.CTkFont(size=12, weight="bold"), command=self._on_filter)
        self.seg.pack(side="left", padx=22)
        self.seg_labels = ["Tất cả (0)", "Hợp lệ (0)", "Lỗi (0)"]
        self.seg.set(self.seg_labels[0])
        self.count_label = ctk.CTkLabel(bar, text="0 / 0 đã chọn", text_color=MUTED)
        self.count_label.pack(side="right")
        ctk.CTkButton(bar, text="🧹 Xoá link lỗi", width=110, height=28, corner_radius=8,
                      fg_color=BORDER, hover_color="#3a4270", font=ctk.CTkFont(size=12),
                      command=self.remove_failed).pack(side="right", padx=(0, 14))
        self.btn_copy_all = ctk.CTkButton(
            bar, text="📋 Copy link lỗi", width=120, height=28, corner_radius=8,
            fg_color=BORDER, hover_color="#3a4270", font=ctk.CTkFont(size=12),
            command=self.copy_failed)
        self.btn_copy_all.pack(side="right", padx=(0, 8))

        self.list_frame = ctk.CTkScrollableFrame(
            wrap, fg_color="transparent", scrollbar_button_color=BORDER,
            scrollbar_button_hover_color="#3a4270")
        self.list_frame.grid(row=1, column=0, sticky="nsew", padx=8, pady=(0, 10))
        self.list_frame.grid_columnconfigure(0, weight=1)

        self.empty = ctk.CTkLabel(
            self.list_frame,
            text="📂\n\nChưa có link nào\nDán link vào ô phía trên rồi bấm “Thêm vào danh sách”",
            text_color=MUTED, font=ctk.CTkFont(size=14))
        self.empty.grid(row=0, column=0, pady=70)

        # Footer
        footer = ctk.CTkFrame(self, fg_color=PANEL, corner_radius=18, border_width=1, border_color=BORDER)
        footer.grid(row=3, column=0, sticky="ew", padx=28, pady=(8, 24))
        footer.grid_columnconfigure(0, weight=1)

        folder = ctk.CTkFrame(footer, fg_color="transparent")
        folder.grid(row=0, column=0, sticky="ew", padx=(16, 8), pady=14)
        folder.grid_columnconfigure(0, weight=1)
        ctk.CTkEntry(folder, textvariable=self.save_dir, height=38, fg_color=CARD,
                     border_color=BORDER).grid(row=0, column=0, sticky="ew", padx=(0, 6))
        ctk.CTkButton(folder, text="📁", width=42, height=38, fg_color=BORDER, hover_color="#343c60",
                      command=self.choose_folder).grid(row=0, column=1, padx=(0, 4))
        ctk.CTkButton(folder, text="Mở", width=52, height=38, fg_color=BORDER, hover_color="#343c60",
                      command=self.open_folder).grid(row=0, column=2)

        ctk.CTkLabel(footer, text="Song song", text_color=MUTED).grid(row=0, column=1, padx=(8, 4))
        self.workers = ctk.CTkOptionMenu(footer, values=["1", "2", "3", "4", "6"], width=64,
                                         fg_color=CARD, button_color=BORDER, button_hover_color="#343c60")
        self.workers.set("3")
        self.workers.grid(row=0, column=2, padx=(0, 12))

        self.btn_dl = ctk.CTkButton(
            footer, text="⬇  Tải về", width=170, height=46, corner_radius=12,
            fg_color=SUCCESS, hover_color="#16a34a", text_color="#05210f",
            font=ctk.CTkFont(size=15, weight="bold"), command=self.start_download)
        self.btn_dl.grid(row=0, column=3, padx=(0, 16), pady=14)

    # ----- danh sách -----
    def choose_folder(self):
        d = filedialog.askdirectory(initialdir=self.save_dir.get())
        if d:
            self.save_dir.set(d)

    def open_folder(self):
        p = self.save_dir.get()
        os.makedirs(p, exist_ok=True)
        if sys.platform.startswith("win"):
            os.startfile(p)
        elif sys.platform == "darwin":
            subprocess.Popen(["open", p])
        else:
            subprocess.Popen(["xdg-open", p])

    def clear_all(self):
        if self.downloading:
            return
        for r in self.rows:
            r.destroy()
        self.rows.clear()
        self.seen.clear()
        self.update_count()
        self.refresh_view()

    def update_count(self):
        ready = [r for r in self.rows if r.ready]
        sel = [r for r in ready if r.var.get()]
        self.count_label.configure(text=f"{len(sel)} / {len(ready)} đã chọn")
        self.master_var.set(bool(ready) and len(sel) == len(ready))

    def toggle_all(self):
        for r in self.rows:
            if r.ready and self._match(r):
                r.var.set(self.master_var.get())
        self.update_count()

    def _match(self, r, key=None):
        key = key or self.filter_key
        if key == "ok":
            return r.ready
        if key == "err":
            return r.failed_fetch or bool(r.error_text)
        return True

    def refresh_view(self):
        """Cập nhật số đếm trên bộ lọc rồi vẽ lại danh sách (gộp nhiều lần gọi)."""
        total = len(self.rows)
        ok = sum(1 for r in self.rows if r.ready)
        err = sum(1 for r in self.rows if self._match(r, "err"))
        self.seg_labels = [f"Tất cả ({total})", f"Hợp lệ ({ok})", f"Lỗi ({err})"]
        self.seg.configure(values=self.seg_labels)
        self.seg.set(self.seg_labels[["all", "ok", "err"].index(self.filter_key)])
        if self._view_job is None:
            self._view_job = self.after(60, self.apply_filter)

    def apply_filter(self):
        self._view_job = None
        i = 0
        for r in self.rows:
            if self._match(r):
                r.grid(row=i, column=0, sticky="ew", padx=6, pady=5)
                i += 1
            else:
                r.grid_forget()
        if i == 0:
            if self.rows:
                txt = "🔎\n\nKhông có link nào trong mục này"
            else:
                txt = "📂\n\nChưa có link nào\nDán link vào ô phía trên rồi bấm “Thêm vào danh sách”"
            self.empty.configure(text=txt)
            self.empty.grid(row=0, column=0, pady=70)
        else:
            self.empty.grid_forget()

    def _on_filter(self, value):
        self.filter_key = ["all", "ok", "err"][self.seg_labels.index(value)]
        self.apply_filter()
        try:
            self.list_frame._parent_canvas.yview_moveto(0)
        except Exception:
            pass

    def copy_failed(self):
        failed = [r for r in self.rows if r.error_text]
        if not failed:
            messagebox.showinfo("Thông báo", "Không có link lỗi nào.")
            return
        text = "\n".join(f"{r.url}\t{r.error_text}" for r in failed)
        self.clipboard_clear()
        self.clipboard_append(text)
        self.btn_copy_all.configure(text=f"✓ Đã copy {len(failed)}")
        self.after(1800, lambda: self.btn_copy_all.configure(text="📋 Copy link lỗi"))

    def remove_failed(self):
        if self.downloading:
            return
        keep = []
        for r in self.rows:
            if r.failed_fetch:
                self.seen.discard(r.url)
                r.destroy()
            else:
                keep.append(r)
        self.rows = keep
        self.update_count()
        self.refresh_view()

    def load_links(self):
        text = self.textbox.get("1.0", "end")
        urls = re.findall(r"https?://[^\s,;\"'<>]+", text)
        urls = [u for u in dict.fromkeys(urls) if u not in self.seen]
        if not urls:
            messagebox.showinfo("Thông báo", "Không có link mới hợp lệ (phải bắt đầu bằng http/https).")
            return
        self.empty.grid_forget()
        for u in urls:
            self.seen.add(u)
            row = FileRow(self.list_frame, u, self.update_count)
            self.rows.append(row)
            self.pool.submit(self._fetch_info, row)
        self.textbox.delete("1.0", "end")
        self.update_count()
        self.refresh_view()

    def _fetch_info(self, row):
        try:
            headers, size = {}, 0
            try:
                r = requests.head(row.url, headers=UA, allow_redirects=True, timeout=15)
                if r.status_code >= 400:
                    raise requests.RequestException()
                headers = r.headers
            except requests.RequestException:
                r = requests.get(row.url, headers=UA, stream=True, timeout=15)
                r.raise_for_status()
                headers = r.headers
                r.close()
            size = int(headers.get("Content-Length", 0) or 0)
            name = guess_filename(row.url, headers)
            kind = classify(headers.get("Content-Type"), name)

            img = None
            if kind == "image" and 0 <= size <= MAX_PREVIEW_BYTES:
                try:
                    data = requests.get(row.url, headers=UA, timeout=20).content
                    img = cover_crop(Image.open(io.BytesIO(data)).convert("RGB"), THUMB)
                except Exception:
                    img = None
            self.after(0, lambda: (row.set_info(name, kind, size, img), self.update_count(), self.refresh_view()))
        except Exception as e:
            msg = str(e)
            self.after(0, lambda: (row.set_error(msg), self.refresh_view()))

    # ----- tải về -----
    def start_download(self):
        if self.downloading:
            return
        selected = [r for r in self.rows if r.ready and r.var.get()]
        if not selected:
            messagebox.showwarning("Chưa chọn", "Hãy chọn ít nhất 1 file để tải.")
            return
        folder = self.save_dir.get()
        os.makedirs(folder, exist_ok=True)
        self.downloading = True
        self.btn_dl.configure(state="disabled", text="Đang tải...")
        self.btn_load.configure(state="disabled")
        for r in selected:
            r.reset()
            r.check.configure(state="disabled")
        self.refresh_view()
        n = int(self.workers.get())

        def run():
            with ThreadPoolExecutor(max_workers=n) as ex:
                list(ex.map(lambda r: self._download_one(r, folder), selected))
            self.after(0, self._finish, selected)

        threading.Thread(target=run, daemon=True).start()

    def _finish(self, selected):
        self.downloading = False
        self.btn_dl.configure(state="normal", text="⬇  Tải về")
        self.btn_load.configure(state="normal")
        for r in selected:
            r.check.configure(state="normal")
        if messagebox.askyesno("Xong", f"Đã xử lý {len(selected)} file.\nMở thư mục lưu?"):
            self.open_folder()

    def _download_one(self, row, folder):
        path = unique_path(folder, row.filename, self.name_lock, self.reserved)
        part = path + ".part"
        try:
            with requests.get(row.url, headers=UA, stream=True, timeout=30) as r:
                r.raise_for_status()
                total = int(r.headers.get("Content-Length", 0) or 0)
                done, t0, last = 0, time.time(), 0
                with open(part, "wb") as f:
                    for chunk in r.iter_content(chunk_size=64 * 1024):
                        if not chunk:
                            continue
                        f.write(chunk)
                        done += len(chunk)
                        now = time.time()
                        if now - last > 0.1:
                            last = now
                            speed = done / max(now - t0, 0.001)
                            pct = done / total if total else 0
                            label = (f"{pct * 100:.0f}% • {speed / 1048576:.1f} MB/s" if total
                                     else f"{human_size(done)} • {speed / 1048576:.1f} MB/s")
                            self.after(0, lambda p=pct, l=label: row.set_progress(p, l))
            os.replace(part, path)
            self.after(0, row.set_done)
        except Exception as e:
            if os.path.exists(part):
                try:
                    os.remove(part)
                except OSError:
                    pass
            msg = str(e)
            self.after(0, lambda: (row.set_fail(msg), self.refresh_view()))


if __name__ == "__main__":
    App().mainloop()