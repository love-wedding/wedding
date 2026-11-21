/*
 * wb-icon-o.js — Ô ICON đổi được ở MỌI mẫu viết tay (create_old / create_AI), nạp ở cả trang soạn (php/edit.php)
 * lẫn trang xem (php/view.php). Làm ở tầng dùng chung, không sửa từng tệp mẫu.
 *
 *  1. Nhận diện ô icon theo selector chung (NHOM bên dưới): icon mốc lịch trình (.bieu-moc, .w1-moc .cham), tim của
 *     ô nghi lễ ([data-tmx-nl] .tim), ghim bản đồ (.ghim). Icon nghi lễ (.bieu-tuong trong [data-tmx-nl]) đã do script
 *     chung của mẫu (core.py → USER_DATA.tmxIconNL) lo — ở đây chỉ vá màu cho icon đó (mục 3).
 *  2. Lựa chọn lưu ở USER_DATA.wbIconO = { "<nhóm>:<SECTION_id>:<thứ tự trong phần>": {id, svg} | {id:'emoji', emoji}
 *     | {id:'img:<tệp>', img} } — dữ liệu RIÊNG của mẫu (TEMPLATE_SPECIFIC_FIELDS / WB_TEMPLATE_SPECIFIC_FIELDS).
 *     Khoá theo phần (SECTION_*) để không lệch khi khách đổi thứ tự các phần.
 *  3. SVG chèn vào giữ màu bằng thuộc tính của chính nó (currentColor → theo màu chữ của mẫu); CSS của mẫu kiểu
 *     ".bieu-moc svg { fill:none; stroke:currentColor }" thắng thuộc tính → icon đặc thành rỗng. Vá bằng style nội tuyến.
 *  Trang soạn: bấm ô → bảng chọn icon dùng chung window.WB_ICON_PICKER (edit_funtion.js; có kho icon gom từ các mẫu).
 */
(function () {
    'use strict';
    var NHOM = [
        { k: 'moc', sel: '.bieu-moc' },
        { k: 'cham', sel: '.w1-moc .cham' },
        { k: 'tim', sel: '[data-tmx-nl] .tim' },
        { k: 'ghim', sel: '.ghim' }
    ];
    function UD() { try { return USER_DATA; } catch (e) { return window.USER_DATA; } }
    function laSoan() { return typeof window.saveLocal === 'function' && !!window.WB_ICON_PICKER; }
    function bang() {
        var u = UD(); if (!u) return {};
        if (!u.wbIconO || typeof u.wbIconO !== 'object' || Array.isArray(u.wbIconO)) return {};
        return u.wbIconO;
    }

    var THE = ['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'defs', 'lineargradient', 'radialgradient', 'stop', 'clippath'];
    var TT = /^(viewbox|fill|fill-rule|fill-opacity|clip-rule|stroke|stroke-width|stroke-linecap|stroke-linejoin|stroke-miterlimit|stroke-dasharray|stroke-opacity|opacity|d|cx|cy|r|rx|ry|x|y|x1|y1|x2|y2|width|height|points|transform|offset|stop-color|stop-opacity|gradientunits|gradienttransform|id)$/;
    function locSvg(chuoi) {
        if (typeof window.tmxLocSvg === 'function') return window.tmxLocSvg(chuoi);
        if (typeof chuoi !== 'string' || chuoi.length > 60000) return null;
        var doc; try { doc = new DOMParser().parseFromString(chuoi, 'image/svg+xml'); } catch (e) { return null; }
        var goc = doc && doc.documentElement;
        if (!goc || goc.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) return null;
        var NS = 'http://www.w3.org/2000/svg';
        function chep(n) {
            if (THE.indexOf(n.nodeName.toLowerCase()) < 0) return null;
            var m = document.createElementNS(NS, n.nodeName);
            Array.prototype.forEach.call(n.attributes, function (a) {
                var k = a.name.toLowerCase();
                if (!TT.test(k) || /url\s*\(\s*['"]?\s*[^#'"\s]|javascript:|expression/i.test(a.value)) return;
                m.setAttribute(a.name, a.value);
            });
            Array.prototype.forEach.call(n.childNodes, function (c) { if (c.nodeType === 1) { var x = chep(c); if (x) m.appendChild(x); } });
            return m;
        }
        var kq = chep(goc);
        if (kq) { kq.removeAttribute('width'); kq.removeAttribute('height'); kq.setAttribute('aria-hidden', 'true'); }
        return kq;
    }
    // CSS của mẫu (".x svg {fill:none;stroke:…}") thắng thuộc tính SVG → ghi lại màu của chính icon thành style nội tuyến
    function giuMau(svg) {
        if (!svg || svg.getAttribute('data-wb-giu-mau')) return;
        var f = svg.getAttribute('fill'), s = svg.getAttribute('stroke'), w = svg.getAttribute('stroke-width');
        svg.style.setProperty('fill', f || 'currentColor', 'important');
        svg.style.setProperty('stroke', s || 'none', 'important');
        if (w) svg.style.setProperty('stroke-width', w, 'important');
        ['stroke-linecap', 'stroke-linejoin'].forEach(function (k) { var v = svg.getAttribute(k); if (v) svg.style.setProperty(k, v, 'important'); });
        svg.setAttribute('data-wb-giu-mau', '1');
    }
    function anhHopLe(u) { return typeof u === 'string' && /^(https?:\/\/[^\/\s"'<>]+)?(\/[^\s"'<>]*)?\/assets\/timeline-icons\/[^\/\s"'<>]+$/.test(u); }

    var cacO = [];   // { el, khoa, goc, w, h }
    function dungKhoa() {
        cacO = [];
        var dem = {};
        NHOM.forEach(function (n) {
            Array.prototype.forEach.call(document.querySelectorAll(n.sel), function (el) {
                if (el.closest('#wbIconPicker') || el.__wbIconO) return;
                if (el.closest('[data-tmx-nl] .bieu-tuong')) return;   // icon nghi lễ: script của mẫu lo
                if (!el.querySelector('svg, img, i')) return;           // ô chỉ là hình CSS (chấm/ghim vẽ bằng CSS) — không phải icon
                var sec = el.closest('[id^="SECTION_"]') || el.closest('section[id]');
                var g = n.k + ':' + (sec ? sec.id : '_');
                dem[g] = (dem[g] || 0) + 1;
                var r = (el.querySelector('svg, img, i') || el).getBoundingClientRect();
                var o = { el: el, khoa: g + ':' + dem[g], goc: el.innerHTML, w: Math.round(r.width) || 0, h: Math.round(r.height) || 0 };
                el.__wbIconO = o;
                cacO.push(o);
            });
        });
    }
    function ve(o) {
        var muc = bang()[o.khoa], el = o.el, nut = null;
        if (muc && typeof muc.emoji === 'string' && muc.emoji.trim() && muc.emoji.length <= 16) {
            nut = document.createElement('span'); nut.className = 'wb-io-emoji'; nut.textContent = muc.emoji;
            nut.style.cssText = 'display:inline-block;line-height:1;font-size:' + Math.max(14, Math.round((o.h || 22) * 0.9)) + 'px;font-family:"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
        } else if (muc && anhHopLe(muc.img)) {
            nut = document.createElement('img'); nut.className = 'wb-io-anh'; nut.alt = ''; nut.src = muc.img;
            nut.style.cssText = 'display:block;object-fit:contain;width:' + (o.w || 24) + 'px;height:' + (o.h || 24) + 'px';
        } else if (muc && muc.svg) {
            nut = locSvg(muc.svg);
            if (nut) { if (o.w && o.h) { nut.style.width = o.w + 'px'; nut.style.height = o.h + 'px'; } giuMau(nut); }
        }
        if (nut) { el.innerHTML = ''; el.appendChild(nut); el.setAttribute('data-wb-icon', muc.id || ''); }
        else if (el.hasAttribute('data-wb-icon')) { el.innerHTML = o.goc; el.removeAttribute('data-wb-icon'); }
    }
    function luu(o, muc) {
        var u = UD(); if (!u) return;
        var b = bang(), moi = {};
        Object.keys(b).forEach(function (k) { moi[k] = b[k]; });
        if (muc) moi[o.khoa] = muc; else delete moi[o.khoa];
        u.wbIconO = moi;
        try { window.saveLocal(); } catch (e) { }
        try { window.saveGalleryToServer && window.saveGalleryToServer(); } catch (e) { }
        ve(o);
    }
    function mauHex(el) {
        var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(el).color || '');
        if (!m) return '#c8954a';
        return '#' + [m[1], m[2], m[3]].map(function (x) { return ('0' + (+x).toString(16)).slice(-2); }).join('');
    }
    function moBang(o) {
        var m0 = bang()[o.khoa];
        window.WB_ICON_PICKER.open({
            title: 'Chọn icon',
            current: m0 ? (m0.emoji || m0.id || '') : '',
            accent: mauHex(o.el),
            onPick: function (sel) {
                if (sel.type === 'emoji') luu(o, { id: 'emoji', emoji: sel.value });
                else if (sel.type === 'img') luu(o, { id: 'img:' + sel.file, img: new URL(sel.url, location.href).href });
                else luu(o, { id: sel.id, svg: sel.svg });
            },
            onReset: function () { luu(o, null); },
            resetLabel: 'Dùng icon gốc của mẫu'
        });
    }
    function ganSoan(o) {
        var el = o.el;
        el.classList.add('tmx-doi-icon', 'wb-io-sua');
        el.removeAttribute('aria-hidden');
        el.title = 'Bấm để đổi icon';
        el.style.setProperty('pointer-events', 'auto', 'important');
        el.style.setProperty('cursor', 'pointer', 'important');
        // đường kẻ dọc của lịch trình (::before của khung) hay nằm đè lên icon mốc → nâng ô lên trên để bấm trúng
        if (getComputedStyle(el).position === 'static') el.style.setProperty('position', 'relative');
        el.style.setProperty('z-index', '6', 'important');
        el.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); moBang(o); }, true);
    }
    // Nhiều mẫu khoá phần trang trí (".xx-tt, .xx-tt * { pointer-events:none !important }" + giuTrangTri() ghi lại mỗi 1,5s),
    // mà icon mốc lịch trình mang lớp -tt → cú bấm rơi xuống phần tử bên dưới. Bắt ở document theo TOẠ ĐỘ: điểm bấm nằm
    // trong khung ô icon (cùng phần SECTION) thì mở bảng chọn. Bỏ qua khi bấm trên giao diện trình soạn.
    function bamToaDo(ev) {
        if (!cacO.length || document.getElementById('wbIconPicker')) return;
        var t = ev.target;
        if (!t || !t.closest || t.closest('#editorTopbar, #editorSidebar, #wbIconPicker, [role="dialog"], .modal, #saveLoginModal, #wbTourWelcome')) return;
        var x = ev.clientX, y = ev.clientY;
        for (var i = 0; i < cacO.length; i++) {
            var o = cacO[i], el = o.el;
            if (!el.getClientRects().length) continue;
            var a = el.getBoundingClientRect();
            if (x < a.left - 3 || x > a.right + 3 || y < a.top - 3 || y > a.bottom + 3) continue;
            var sec = el.closest('[id^="SECTION_"]');
            if (sec && !sec.contains(t)) continue;      // điểm bấm thuộc lớp khác (màn bìa…) đè lên
            ev.preventDefault(); ev.stopPropagation();
            moBang(o);
            return;
        }
    }
    // Vá màu icon nghi lễ do script của mẫu chèn (.bieu-tuong[data-tmx-icon] > svg)
    function vaIconNghiLe(goc) {
        Array.prototype.forEach.call((goc || document).querySelectorAll('[data-tmx-icon] > svg'), giuMau);
    }
    function chay() {
        dungKhoa();
        cacO.forEach(ve);
        if (laSoan()) { cacO.forEach(ganSoan); document.addEventListener('click', bamToaDo, true); }
        vaIconNghiLe();
        try {
            new MutationObserver(function (ds) {
                ds.forEach(function (d) { if (d.target && d.target.nodeType === 1 && d.target.hasAttribute('data-tmx-icon')) vaIconNghiLe(d.target.parentNode || d.target); });
            }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-tmx-icon'] });
        } catch (e) { }
    }
    // Chạy SAU script của mẫu (DOMContentLoaded của mẫu dựng nghi lễ, sắp thứ tự phần…)
    function henChay() { setTimeout(chay, 0); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', henChay); else henChay();
    window.WB_ICON_O = { nhom: NHOM, cacO: function () { return cacO; } };
})();
