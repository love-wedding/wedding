# HƯỚNG DẪN CHIẾU SLIDE CƯỚI MÀN HÌNH LED 16:9

Dự án slide cưới cao cấp được thiết kế và lập trình bằng **HTML5 / CSS3 / JavaScript**, tái tạo chuẩn 100% phong cách, hiệu ứng ánh sáng, chuyển động và font chữ nghệ thuật từ video mẫu `Download.mp4`, đồng thời sử dụng hoàn toàn **ảnh gốc độ nét cao từ thư mục `images/`** của bạn.

---

## 1. Cách Mở Trình Chiếu

Bạn có thể mở slide theo 2 cách:

### Cách 1: Mở trực tiếp bằng file (Offline 100% - Khuyên dùng)
- Vào thư mục `slide-cuoi-1`, nhấp đúp trực tiếp vào file **`index.html`** để mở bằng bất kỳ trình duyệt nào (Chrome, Edge, Cốc Cốc, Safari, Firefox,...).
- Bấm vào thanh thông báo hoặc bất kỳ đâu trên màn hình để bật nhạc nền và bắt đầu trình chiếu.
- Nhấn phím **`F`** để phóng to **Toàn màn hình 16:9 tràn viền LED sân khấu**.

### Cách 2: Mở qua máy chủ nội bộ (Local Server)
- File `server.js` đang chạy nền sẵn tại địa chỉ:
  👉 **`http://localhost:8899/`**

---

## 2. Các Phím Tắt Sân Khấu (Kỹ Thuật Viên / MC)

| Phím Tắt | Chức Năng |
| :--- | :--- |
| **`F`** hoặc **`F11`** | **Bật / Tắt Toàn Màn Hình (Fullscreen)** chuẩn 16:9 tràn viền LED |
| **`Space`** (Phím cách) | **Dừng (Pause) / Tiếp tục (Play)** chuyển slide và nhạc nền |
| **`→`** / **`←`** | Chuyển ngay sang **Slide kế tiếp** hoặc quay lại **Slide trước** |
| **`M`** | **Tắt / Bật tiếng** nhạc nền nhanh |
| **`S`** | **Mở bảng Cài Đặt (Settings)**: Đổi tên Cô Dâu - Chú Rể, Ngày cưới, Chọn ảnh nền Slide 1 |
| **`R`** | Khởi động lại về **Slide 1 (Intro)** kèm hiệu ứng lóe sáng ban đầu |
| **`Esc`** | Đóng bảng cài đặt / Thoát toàn màn hình |

> **Tự động ẩn chuột & thanh điều khiển**: Sau 3 giây không chạm chuột, thanh điều khiển và con trỏ chuột sẽ tự động ẩn hoàn toàn để màn hình LED luôn sạch đẹp và tinh tế như một thước phim điện ảnh.

---

## 3. Chi Tiết Thiết Kế & Hiệu Ứng Slide 1 Chuẩn Video Mẫu

- **Hiệu ứng lóe sáng trắng ban đầu (White Flash)**: Khi bắt đầu chiếu, một luồng ánh sáng trắng tinh khiết mở ra (1.5s) để hé lộ cô dâu chú rể và chữ nghệ thuật.
- **Cột sáng hào quang trung tâm (Volumetric Light Beam)**: Cột ánh sáng vàng champagne lung linh ở giữa màn hình kết hợp các hạt bụi sáng bokeh lấp lánh (Canvas particles) trôi nhẹ nhàng.
- **Bố cục khung hình 16:9**: Tận dụng ảnh nét trong `images/` (ảnh cặp đôi đi dạo trên thảm cỏ xanh `7a6ec418...`), với chú rể ở bên trái, cô dâu ở bên phải, và khoảng không gian ở giữa được chiếu sáng bởi cột hào quang.
- **Font chữ nghệ thuật & Cấu trúc chữ đối xứng**:
  - Dòng 1: `WE'RE GETTING MARRIED` (chữ in hoa giãn nét tinh tế)
  - Dòng 2: `Save the Date` (thư pháp uốn lượn phong cách sang trọng)
  - Dòng 3, 4, 5: `ANH TÚ` & `DIỆU NHI` (font serif cổ điển, dấu & ở giữa riêng biệt)
  - Dòng 6: `06.06.2026`
  - Màu chữ: Màu than chì đậm (`#1a221b` / `#222822`) sắc nét, tương phản hoàn hảo trên nền luồng sáng vàng champagne.
- **Chuyển động Ken Burns 60fps**: Zoom chậm mượt mà, chuyển cảnh hòa tan (cross-dissolve) sang các slide tiếp theo.
