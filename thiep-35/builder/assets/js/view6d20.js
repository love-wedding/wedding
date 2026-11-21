// c:\xampp\htdocs\builder_27biggroup\assets\js\view.js

// Ẩn phần tử có class visible_mode_hide — chạy trước DOMContentLoaded để LP không kịp hiện
(function () {
    function hideVisibleModeElements() {
        document.querySelectorAll('.visible_mode_hide').forEach(el => {
            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('opacity', '0', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
            el.style.setProperty('z-index', '-9999', 'important');
        });
    }
    hideVisibleModeElements();
    // Theo dõi LP re-init và giữ trạng thái ẩn
    const obs = new MutationObserver(hideVisibleModeElements);
    obs.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });
    // Ngắt observer sau 5 giây (LP đã init xong)
    setTimeout(() => obs.disconnect(), 5000);
})();

// ── DEBUG: bật bằng localStorage.setItem('wb_debug_load','1') rồi reload để log
// tiến trình từng khối trong view.js ra console — dùng để tìm đoạn nào khiến
// window 'load' không bao giờ bắn ra (icon tab xoay vĩnh viễn dù nội dung đã hiện).
const _WB_DEBUG_LOAD = (function () {
    try { return localStorage.getItem('wb_debug_load') === '1'; } catch (e) { return false; }
})();
function _wbMark(label) {
    if (!_WB_DEBUG_LOAD) return;
    console.log('[wb-debug]', label, performance.now().toFixed(1) + 'ms');
}
if (_WB_DEBUG_LOAD) {
    console.log('[wb-debug] readyState at script parse:', document.readyState, performance.now().toFixed(1) + 'ms');
    window.addEventListener('load', () => console.log('[wb-debug] *** window load fired ***', performance.now().toFixed(1) + 'ms'));
    window.addEventListener('DOMContentLoaded', () => console.log('[wb-debug] DOMContentLoaded fired', performance.now().toFixed(1) + 'ms'));

    // Poll mỗi giây trong 20s: in ra readyState + mọi resource chưa hoàn tất (responseEnd===0)
    // theo Resource Timing API — giúp phát hiện resource bị "treo" ngay trong console, không
    // cần mở tab Network riêng.
    let _wbPollN = 0;
    const _wbPollIv = setInterval(() => {
        _wbPollN++;
        const pending = performance.getEntriesByType('resource')
            .filter(r => r.responseEnd === 0)
            .map(r => r.name.replace(location.origin, ''));
        console.log('[wb-debug] poll#' + _wbPollN, 'readyState=' + document.readyState,
            'pendingResources=' + JSON.stringify(pending));
        if (document.readyState === 'complete' || _wbPollN >= 20) clearInterval(_wbPollIv);
    }, 1000);
}

// ── TẮT "MÀN MỞ THIỆP" (USER_DATA.moThiepTat, php/mo_thiep.php) ──
// view.php đã ẩn .UIopenCard bằng CSS ngay trong <head> (html.wb-khong-mo) nên không lộ khung nào; ở đây chỉ chạy
// ĐÚNG ĐƯỜNG "ĐÃ MỞ" của mẫu: window.StartOpenDoor() do chính mẫu gán lúc DOMContentLoaded (gọi moCua/moThu/moThiep:
// gỡ lớp khoá cuộn *-khoa, enableScroll, bật hiệu ứng cuộn, tmxThiepDaMo…). Handler DOMContentLoaded của view.js đăng
// ký SAU script của mẫu (view.js nằm cuối <body>) nên lúc này StartOpenDoor đã là bản của mẫu.
// KHÔNG bấm giả .Btn_opencard: nút đó kiêm phát nhạc, bấm bằng mã thì trình duyệt chặn play() nhưng cờ "đã bắt đầu" vẫn
// bật → nhạc không bao giờ phát. Nhạc do initMusicPlayer() lo (phát ở lần chạm/bấm/gõ phím đầu tiên).
function _wbVaoThang() {
    // Vài mẫu gọi window.scrollTo(0,0) TRỄ trong kịch bản mở (wedding3: 820ms) → khách đã kịp cuộn thì bị kéo về đầu.
    // 6 giây đầu: bỏ qua lệnh "về đầu trang" nếu khách đã tự cuộn/chạm.
    let khachDaCuon = false;
    const danhDau = () => { khachDaCuon = true; };
    ['wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(t => window.addEventListener(t, danhDau, { passive: true, capture: true, once: true }));
    const goc = window.scrollTo;
    const boc = function (x, y) {
        const veDau = (x && typeof x === 'object') ? !(x.top > 0) : (!x && !y);
        if (veDau && khachDaCuon) return;
        return goc.apply(window, arguments);
    };
    try { window.scrollTo = boc; setTimeout(() => { if (window.scrollTo === boc) window.scrollTo = goc; }, 6000); } catch (e) { }
    try {
        if (typeof window.StartOpenDoor === 'function') window.StartOpenDoor();
    } catch (e) { console.warn('[wb-khong-mo] StartOpenDoor', e); }
    if (typeof enableScroll === 'function') { try { enableScroll(); } catch (e) { } }
}

document.addEventListener('DOMContentLoaded', () => {
    _wbMark('view.js DOMContentLoaded handler START');
    if (window.WB_KHONG_MO) _wbVaoThang();
    // console.log('view.js loaded. USER_DATA:', window.USER_DATA);
    // console.log('GUEST_NAME:', window.GUEST_NAME);

    // Bật scroll khi người dùng mở thiệp
    document.querySelectorAll('.Btn_opencard').forEach(el => {
        el.addEventListener('click', () => {
            if (typeof enableScroll === 'function') enableScroll();
        }, { once: true });
    });
    // view.php LUÔN gọi disableScroll() lúc tải (chờ khách bấm "mở thiệp" ở màn bìa). Mẫu KHÔNG có màn bìa — nút
    // .Btn_opencard không có, mẫu cũng không tự gọi StartScroll()/enableScroll() — thì không ai mở lại → trang đứng im
    // (2026-10-18: website đại lý template/create_template_agents/). Mở cuộn ngay cho các mẫu đó; thiệp có màn bìa giữ nguyên.
    if (!document.querySelector('.Btn_opencard')
        && !/StartScroll\s*\(|enableScroll\s*\(/.test(document.documentElement.innerHTML)
        && typeof enableScroll === 'function') {
        enableScroll();
    }

    // Hiệu ứng hiện dần khi cuộn tới cho thiết kế 2/3/4 của SEC-Story (mục Love Story) — tương ứng
    // _storyInitReveal() ở edit_funtion.js. AN TOÀN LÀ TRÊN HẾT: HTML từ SSR đã ở trạng thái hiện
    // đầy đủ + bấm được ngay (mặc định không class phụ = trạng thái cuối, .wbls-door có sẵn class
    // "open" — xem _wbStoryRevealWrap/_wbStoryDoorGroupHtml ở php/story_design.php); đoạn này chỉ
    // THÊM class tạm để giấu đi cho hiệu ứng, rồi tự gỡ khi cuộn tới hoặc sau hạn chót 1.2s.
    // Thiết kế 3 "Tạp chí" (.wbls-door) / 4 "Thẻ nổi" (.wbls-slide): chỉ mờ ra/mở cửa-trượt ảnh khi
    // phần đó CUỘN TỚI GIỮA MÀN HÌNH — dùng rootMargin âm cả trên/dưới để co "vùng nhận biết" của
    // observer lại thành 1 dải mỏng ngay giữa viewport (xem giải thích chi tiết ở _storyInitReveal
    // trong edit_funtion.js). Chỉ 2 thiết kế này có .wbls-door/.wbls-slide trên trang, dùng làm dấu
    // hiệu để áp cùng cách tính cho .wbls-reveal lẻ trong cùng thiết kế; thiết kế 2 "Nhật ký ảnh"
    // giữ nguyên hiện sớm khi vừa chạm mép dưới.
    const _wblsIsDoorDesign = !!document.querySelector('.wbls-door, .wbls-slide');
    const _wblsRevealOpts = _wblsIsDoorDesign
        ? { threshold: 0, rootMargin: '-45% 0px -45% 0px' }
        : { threshold: 0.15, rootMargin: '0px 0px -40px 0px' };

    _wbMark('before wbls-reveal IntersectionObserver');
    (function () {
        const els = Array.from(document.querySelectorAll('.wbls-reveal'));
        if (els.length && typeof IntersectionObserver !== 'undefined') {
            els.forEach(el => el.classList.add('wbls-pre'));
            const clear = el => el.classList.remove('wbls-pre');
            const obs = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    clear(entry.target);
                    obs.unobserve(entry.target);
                });
            }, _wblsRevealOpts);
            els.forEach(el => obs.observe(el));
            setTimeout(() => { els.forEach(clear); obs.disconnect(); }, 1200);
        }
    })();

    // Hiệu ứng "cửa mở" (thiết kế 3, .wbls-door) / "trượt ảnh" (thiết kế 4, .wbls-slide) của
    // SEC-Story (xem _wbStoryDoorInner/_wbStorySlideInner ở php/story_design.php) — theo dõi LIÊN
    // TỤC (không unobserve), mở khi cuộn tới và đóng lại khi cuộn qua khỏi khung hình, khác với
    // .wbls-reveal (chỉ hiện 1 lần) ở trên. Cả 2 đã mở sẵn (class "open") ngay từ SSR nên vẫn an
    // toàn nếu đoạn này không chạy được.
    _wbMark('before wbls-door IntersectionObserver');
    (function () {
        const doorEls = Array.from(document.querySelectorAll('.wbls-door, .wbls-slide'));
        if (!doorEls.length || typeof IntersectionObserver === 'undefined') return;
        const doorObs = new IntersectionObserver(entries => {
            entries.forEach(entry => entry.target.classList.toggle('open', entry.isIntersecting));
        }, { threshold: 0, rootMargin: '-45% 0px -45% 0px' });
        doorEls.forEach(el => doorObs.observe(el));
    })();

    _wbMark('before Apply custom images');
    // --- Apply custom images ---
    // Although view.php injects CSS for images, this client-side logic
    // ensures images are correctly applied, especially if elements are dynamic
    // or if LadiPage's JS overrides initial styles.

    // Cache kích thước gốc ảnh theo URL — tránh load lại nếu nhiều khung dùng chung 1 ảnh.
    const _imgNaturalSizeCache = new Map(); // url -> { w, h }
    const _imgNaturalSizeLoading = new Set();

    // background-size 1 giá trị (VD "150%") chỉ set WIDTH, HEIGHT tự "auto" theo tỉ lệ ảnh gốc —
    // chỉ trùng với "cover" khi tỉ lệ ảnh == tỉ lệ khung. Ảnh có tỉ lệ khác khung (VD ảnh vuông
    // trong khung dọc chữ nhật) sẽ để trống 2 mép trên/dưới thay vì lấp kín. Tính tay theo
    // width/height thật của khung + ảnh rồi set cả 2 chiều bằng px để luôn lấp kín đúng nghĩa cover.
    //
    // QUAN TRỌNG: view.php render sẵn background-size:X%!important trong <style> ở <head> (từ cùng
    // công thức sc*100% cũ — xem $customStyles trong view.php) để có size ngay khi vừa load, trước
    // khi JS này chạy. !important của stylesheet LUÔN thắng inline style KHÔNG !important, nên phải
    // dùng setProperty(...,'important') ở đây — nếu không, giá trị cover tính đúng vẫn bị đè bởi
    // %!important cũ và không có tác dụng gì trên trang khách xem thiệp.
    function _applyCoverBackgroundSize(bgElement, url, scale, reapplyId, reapplyData) {
        const cached = _imgNaturalSizeCache.get(url);
        const cw = bgElement.offsetWidth, ch = bgElement.offsetHeight;

        // ĐÃ biết kích thước gốc ảnh (từng fetch thành công trước đó) — KHÔNG fetch lại dù
        // element hiện đang 0x0 (vd ảnh nằm trong popup/#SECTION_POPUP có display:none mặc định,
        // chỉ hiện khi bấm mở). QUAN TRỌNG: trước đây điều kiện `cached && cw>0 && ch>0` gộp
        // chung khiến mọi lần gọi lại (từ chính img.onload bên dưới) khi element vẫn 0x0 lại rơi
        // xuống nhánh fetch mới → onload lại gọi applyImageStyle() → lại 0x0 → lại fetch mới...
        // tạo vòng lặp new Image() vô hạn, khiến document.readyState/window 'load' không bao giờ
        // hoàn tất dù nội dung đã hiển thị xong (tab trình duyệt xoay loading vĩnh viễn). Xác nhận
        // thực tế: xảy ra với BẤT KỲ ảnh nào có dữ liệu chỉnh vị trí/zoom nằm trong popup (QR mừng
        // cưới, popup xác nhận RSVP/lời chúc...), không liên quan số lượng ảnh trên trang.
        if (cached) {
            if (cw > 0 && ch > 0) {
                const coverScale = Math.max(cw / cached.w, ch / cached.h);
                const wPx = cached.w * coverScale * scale, hPx = cached.h * coverScale * scale;
                bgElement.style.setProperty('background-size', `${wPx}px ${hPx}px`, 'important');
            } else {
                // Element chưa có kích thước thật (vd popup đang đóng) — tạm dùng % cho tới khi
                // thực sự hiển thị; xem _wbResyncPopupImages() theo dõi popup mở để áp lại đúng.
                bgElement.style.setProperty('background-size', `${scale * 100}%`, 'important');
            }
            return;
        }

        // Chưa biết kích thước gốc → tạm dùng % như cũ (khớp với style SSR có sẵn), load xong sẽ
        // tự áp lại đúng qua applyImageStyle(reapplyId, reapplyData) trong img.onload dưới đây.
        bgElement.style.setProperty('background-size', `${scale * 100}%`, 'important');

        if (!_imgNaturalSizeLoading.has(url)) {
            _imgNaturalSizeLoading.add(url);
            const img = new Image();
            img.onload = () => {
                _imgNaturalSizeLoading.delete(url);
                _imgNaturalSizeCache.set(url, { w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
                applyImageStyle(reapplyId, reapplyData);
            };
            img.onerror = () => { _imgNaturalSizeLoading.delete(url); };
            img.src = url;
        }
    }

    function applyImageStyle(id, data) {
        // Ảnh/chữ trong SEC-Story (mục Love Story) được SSR render với ID có tiền tố WBLS_ (chống
        // trùng ID khi copy SEC-Story từ template khác — xem _wbStoryPrefixedId ở
        // php/story_design.php), nhưng key trong USER_DATA.images vẫn là ID GỐC. Thử luôn ID có
        // tiền tố nếu ID gốc không tìm thấy phần tử nào.
        const el = document.getElementById(id) || document.getElementById('WBLS_' + id);
        if (!el || !data || !data.url) return;

        // Target the correct background element within LadiPage structure.
        // Ưu tiên direct child (:scope >) trước — nếu không, với SECTION*, querySelector('.ladi-image-background')
        // không scope sẽ tìm xuống tận các IMAGE* lồng bên trong .ladi-container và áp nhầm ảnh section
        // vào element con cháu đó (chỉ lộ ra ở trang xuất bản vì edit.js đã scope đúng, xem getBgElement()).
        const bgElement = el.querySelector(':scope > .ladi-section-background') ||
            el.querySelector(':scope > .ladi-box') ||
            el.querySelector(':scope > .ladi-image-background') ||
            el.querySelector('.ladi-image > .ladi-image-background') ||
            el.querySelector('.ladi-image-background') ||
            el.querySelector('.ladi-section-background') ||
            el.querySelector('.ladi-box');

        if (bgElement) {
            // Cùng quy ước với USER_DATA.texts phía trên (_isDesktopV) — dùng bộ offset/scale riêng
            // cho desktop nếu admin đã chỉnh riêng, tránh lấy nhầm giá trị mobile áp !important đè
            // lên đúng lúc đang ở màn hình desktop (PHP vốn tách 2 bộ này qua @media, xem view.php).
            const _isDesktopV = window.innerWidth >= 768;
            const pos = (_isDesktopV && data.desktop) ? data.desktop : data;
            const ox = pos.offsetX ?? 0;
            const oy = pos.offsetY ?? 0;
            const sc = pos.scale ?? 1;

            bgElement.style.backgroundImage = `url('${data.url}')`;
            _applyCoverBackgroundSize(bgElement, data.url, sc, id, data);
            bgElement.style.backgroundPosition = `calc(50% + ${ox}px) calc(50% + ${oy}px)`;
            bgElement.style.backgroundRepeat = 'no-repeat';
            // Use !important to override LadiPage's inline styles if necessary
            // For background-image, background-size, background-position, background-repeat
            // the server-side injected CSS already uses !important.
            // This client-side application is more for ensuring the values are set.
        }
    }

    // Áp dụng theo TỪNG ĐỢT NHỎ (6 ảnh/đợt, cách nhau 60ms) thay vì gọi applyImageStyle() cho TẤT
    // CẢ ảnh cùng lúc trong 1 vòng lặp đồng bộ — thiệp có nhiều ảnh (10-20+, rất phổ biến) khiến
    // hàng loạt background-image + new Image() (đo kích thước gốc, xem _applyCoverBackgroundSize)
    // được kích hoạt gần như đồng thời, khiến tab trình duyệt kẹt vĩnh viễn ở trạng thái "đang tải"
    // (document.readyState không bao giờ chuyển "complete", window 'load' không bao giờ bắn ra) dù
    // nội dung đã hiển thị đầy đủ — xác nhận thực tế trên nhiều thiệp khác nhau (18-23 ảnh).
    function _wbApplyImagesStaggered(ids, batchSize, delayMs, onDone) {
        let i = 0;
        function runBatch() {
            const end = Math.min(i + batchSize, ids.length);
            for (; i < end; i++) applyImageStyle(ids[i], window.USER_DATA.images[ids[i]]);
            if (i < ids.length) setTimeout(runBatch, delayMs);
            else if (onDone) onDone();
        }
        runBatch();
    }

    if (window.USER_DATA && window.USER_DATA.images) {
        const _imgIds = Object.keys(window.USER_DATA.images);
        // Áp lại 1 lần nữa sau khi layout đã ổn định hẳn — LadiPage SDK tự gọi lại ladi_viewport()
        // ~0.5s sau khi tải trang (xem ghi chú "Edit-mode viewport patch" ở edit.php), có thể đổi
        // kích thước khung ảnh sau lần applyImageStyle() đầu tiên ở trên. Nếu không tính lại, ảnh
        // nào đã có sẵn trong cache trình duyệt (load gần như ngay lập tức, sớm hơn cả lúc layout
        // ổn định) sẽ bị "kẹt" cover/zoom sai theo kích thước khung TẠM, khác với độ phóng đã canh
        // ở trang edit.
        _wbApplyImagesStaggered(_imgIds, 6, 60, () => {
            setTimeout(() => { _wbApplyImagesStaggered(_imgIds, 6, 60); }, 700);
        });
    }

    // Ảnh nằm trong popup (#SECTION_POPUP, mặc định display:none — vd QR mừng cưới, popup xác
    // nhận RSVP/lời chúc) không có kích thước thật cho tới khi popup thực sự mở, nên
    // _applyCoverBackgroundSize() ở trên chỉ tạm dùng background-size theo % thay vì cover chính
    // xác. LadiPage runtime tự bật popup bằng cách set style hiển thị trên phần tử popup khi bấm
    // — theo dõi thay đổi đó rồi áp lại applyImageStyle() cho các ảnh vừa lộ ra, đúng như cách làm
    // khi layout ổn định lúc tải trang.
    (function _wbResyncPopupImages() {
        const popupSection = document.getElementById('SECTION_POPUP');
        const imgData = window.USER_DATA && window.USER_DATA.images;
        if (!popupSection || !imgData || typeof MutationObserver === 'undefined') return;

        function resync(root) {
            root.querySelectorAll('[id]').forEach(el => {
                const data = imgData[el.id];
                if (data) applyImageStyle(el.id, data);
            });
        }

        const obs = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.target.nodeType === 1 && m.target.offsetWidth > 0) resync(m.target);
            });
        });
        obs.observe(popupSection, { attributes: true, attributeFilter: ['style', 'class'], subtree: true });
    })();

    // Cùng vấn đề còn xảy ra với section/element khác bị ẩn bằng display:none NGOÀI
    // #SECTION_POPUP — vd section bìa thiệp chỉ hiện sau khi bấm nút "Mở thiệp" (action
    // "hidden_show" của LadiPage, xem #SECTION1 trong mẫu wedding25). Ảnh nền của CHÍNH section đó
    // (id trùng khoá USER_DATA.images) không có kích thước thật lúc applyImageStyle() chạy lần đầu
    // → _applyCoverBackgroundSize() tạm dùng % thay vì cover chính xác, và vì không nằm trong
    // #SECTION_POPUP nên không có gì áp lại khi section thực sự hiện ra — ảnh giữ sai vĩnh viễn dù
    // đã lưu đúng scale khi chỉnh (khách xem thiệp thấy ảnh phóng to/lệch khác lúc admin chỉnh).
    // Theo dõi rộng hơn (toàn document.body, KHÔNG giới hạn attribute 'style'/'class' vì không rõ
    // LadiPage runtime minified/obfuscated dùng cơ chế gì để hiện lại phần tử) nhưng chỉ xử lý khi
    // CHÍNH phần tử vừa đổi attribute có id khớp trực tiếp USER_DATA.images — tránh quét
    // querySelectorAll('[id]') trên mọi mutation (rất tốn vì LadiPage toggle class animation liên
    // tục lúc cuộn trang) mà vẫn bắt đúng trường hợp này. Tạm ngắt observer trong lúc
    // applyImageStyle() tự chạy để tránh tự kích hoạt lại chính nó.
    (function _wbResyncHiddenRevealImages() {
        const imgData = window.USER_DATA && window.USER_DATA.images;
        if (!imgData || typeof MutationObserver === 'undefined') return;

        const obs = new MutationObserver(mutations => {
            const toApply = [];
            mutations.forEach(m => {
                const el = m.target;
                if (el.nodeType !== 1 || el.offsetWidth <= 0) return;
                if (imgData[el.id]) toApply.push(el.id);
            });
            if (!toApply.length) return;
            obs.disconnect();
            toApply.forEach(id => applyImageStyle(id, imgData[id]));
            obs.observe(document.body, { attributes: true, subtree: true });
        });
        obs.observe(document.body, { attributes: true, subtree: true });
    })();

    _wbMark('before Apply Google Calendar href');
    // --- Apply Google Calendar href từ USER_DATA.addCalendar ---
    // Ladi-page đọc URL từ JSON config riêng (không phải từ <a> href),
    // nên phải dùng capture listener để chặn ladi trước khi nó xử lý click.
    if (window.USER_DATA && window.USER_DATA.addCalendar) {
        function buildGCalDate(dt) {
            if (!dt) return '';
            const [d, t = '00:00'] = dt.split('T');
            return d.replace(/-/g, '') + 'T' + t.replace(':', '') + '00Z';
        }
        function buildGCalUrl(cfg) {
            const p = new URLSearchParams();
            if (cfg.text) p.set('text', cfg.text);
            if (cfg.details) p.set('details', cfg.details);
            if (cfg.location) p.set('location', cfg.location);
            if (cfg.startDt) {
                p.set('dates', buildGCalDate(cfg.startDt) + '/' + buildGCalDate(cfg.endDt || cfg.startDt));
            }
            const base = 'https://calendar.google.com/calendar/u/0/r/eventedit';
            const qs = p.toString().replace(/%2F/g, '/');
            return qs ? base + '?' + qs : base;
        }
        for (const id in window.USER_DATA.addCalendar) {
            const el = document.getElementById(id);
            if (!el) continue;
            const url = buildGCalUrl(window.USER_DATA.addCalendar[id]);
            el.setAttribute('href', url);
            // capture:true → fires trước ladi-page's bubble handler
            // stopPropagation → ladi không nhận được event → không navigate sang URL cũ
            el.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                window.open(url, '_blank');
            }, true);
        }
    }

    _wbMark('before HIEU UNG CHU setup');
    // ── HIỆU ỨNG CHỮ (ClientEditText/ClientEditTextPress) ──────────────────
    // LƯU Ý: đây là bản sao y hệt các hàm cùng tên trong assets/js/edit-text.js (trang edit.php
    // không dùng chung file này với trang xuất bản). Nếu đổi danh sách hiệu ứng/keyframe thì
    // PHẢI sửa cả 2 nơi, nếu không trang edit và trang xuất bản sẽ hiển thị hiệu ứng khác nhau.
    const TEXT_EFFECT_CLASSES = [
        'wb-tfx-bounce', 'wb-tfx-pulse', 'wb-tfx-blink', 'wb-tfx-shake', 'wb-tfx-scroll-init',
        'wb-tfx-shine', 'wb-tfx-glow', 'wb-tfx-rainbow', 'wb-tfx-letterPop', 'wb-tfx-letterWave',
        'wb-tfx-fadeUp-play', 'wb-tfx-fadeLeft-play', 'wb-tfx-fadeRight-play', 'wb-tfx-zoomIn-play',
    ];
    // Hiệu ứng chạy trên từng chữ cái riêng (cần tách text thành các <span> con).
    const TEXT_EFFECT_CHAR_MODES = ['letterPop', 'letterWave'];

    function injectTextEffectCSS() {
        if (document.getElementById('wb-tfx-styles')) return;
        const style = document.createElement('style');
        style.id = 'wb-tfx-styles';
        style.textContent = `
@keyframes wbTfxBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes wbTfxPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes wbTfxBlink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes wbTfxShake{0%,100%{transform:rotate(0)}25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}}
.wb-tfx-bounce{display:inline-block;animation:wbTfxBounce 1.6s ease-in-out infinite}
.wb-tfx-pulse{display:inline-block;animation:wbTfxPulse 1.6s ease-in-out infinite}
.wb-tfx-blink{animation:wbTfxBlink 1.6s ease-in-out infinite}
.wb-tfx-shake{display:inline-block;animation:wbTfxShake 1.6s ease-in-out infinite}
@keyframes wbTfxFadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes wbTfxFadeLeft{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
@keyframes wbTfxFadeRight{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
@keyframes wbTfxZoomIn{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
.wb-tfx-scroll-init{opacity:0}
.wb-tfx-fadeUp-play{animation:wbTfxFadeUp .7s ease both}
.wb-tfx-fadeLeft-play{animation:wbTfxFadeLeft .7s ease both}
.wb-tfx-fadeRight-play{animation:wbTfxFadeRight .7s ease both}
.wb-tfx-zoomIn-play{animation:wbTfxZoomIn .7s ease both}
@keyframes wbTfxShine{0%{background-position:200% 0}100%{background-position:-200% 0}}
.wb-tfx-shine .ladi-headline,
.wb-tfx-shine .ladi-paragraph,
.wb-tfx-shine .ladi-list-paragraph{
    background-image:linear-gradient(120deg, currentColor 40%, #fff 50%, currentColor 60%);
    background-size:220% 100%;
    -webkit-background-clip:text;
    background-clip:text;
    -webkit-text-fill-color:transparent;
    animation:wbTfxShine 2.6s linear infinite;
}
@keyframes wbTfxGlow{0%,100%{text-shadow:0 0 4px currentColor,0 0 8px currentColor}50%{text-shadow:0 0 14px currentColor,0 0 26px currentColor}}
.wb-tfx-glow{display:inline-block;animation:wbTfxGlow 1.8s ease-in-out infinite}
@keyframes wbTfxRainbow{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}
.wb-tfx-rainbow{display:inline-block;animation:wbTfxRainbow 3.5s linear infinite}
@keyframes wbTfxCharPop{0%,100%{transform:scale(1)}50%{transform:scale(.55)}}
.wb-tfx-letterPop .wb-tfx-char{display:inline-block;animation:wbTfxCharPop 1.2s ease-in-out infinite}
@keyframes wbTfxCharWave{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.wb-tfx-letterWave .wb-tfx-char{display:inline-block;animation:wbTfxCharWave 1.2s ease-in-out infinite}
        `;
        document.head.appendChild(style);
    }

    // Tách text thành các <span class="wb-tfx-char"> để so le animation-delay (chữ chạy sóng).
    // Tách trên .wb-bg-wrap nếu có (giữ nguyên khối Nền/Viền), không thì tách trực tiếp trên inner.
    // Dùng textContent nên luôn tách đúng theo nội dung hiện tại, kể cả khi đã từng tách rồi.
    function _tfxCharTarget(el) {
        const inner = el.querySelector('.ladi-headline, .ladi-paragraph, .ladi-list-paragraph');
        if (!inner) return null;
        return inner.querySelector(':scope > .wb-bg-wrap') || inner;
    }

    function _splitTfxChars(container) {
        const text = container.textContent;
        container.innerHTML = '';
        [...text].forEach((ch, i) => {
            const span = document.createElement('span');
            span.className = 'wb-tfx-char';
            span.style.animationDelay = (i * 0.06) + 's';
            span.textContent = ch;
            container.appendChild(span);
        });
    }

    function _clearLadiAnimationHidden(el) {
        let node = el;
        while (node) {
            if (node.classList && (node.classList.contains('ladi-animation-hidden') || node.classList.contains('ladi-animation'))) {
                node.style.setProperty('opacity', '1', 'important');
                node.style.setProperty('visibility', 'visible', 'important');
                node.style.setProperty('animation-name', 'none', 'important');
                node.style.setProperty('transform', 'none', 'important');
            }
            const tag = node.tagName;
            if (tag === 'SECTION' || tag === 'BODY' || tag === 'HTML') break;
            node = node.parentElement;
        }
    }

    function _applyTextEffectToEl(el, effect) {
        if (!el) return;
        TEXT_EFFECT_CLASSES.forEach(c => el.classList.remove(c));
        if (el._tfxObserver) { el._tfxObserver.disconnect(); el._tfxObserver = null; }
        if (!effect || !effect.mode || !effect.name) return;

        // Bỏ hẳn class hiệu ứng mặc định của mẫu ngay trên chính phần tử (không chỉ ép !important)
        // — vì class đó dùng opacity/animation-name !important, mà !important luôn thắng animation
        // dù đặt sau, nên nếu chỉ ép !important trên el thì hiệu ứng mới thêm vào sẽ không bao giờ
        // chạy được. Tổ tiên (nếu có) vẫn giữ nguyên và chỉ ép hiện rõ qua _clearLadiAnimationHidden.
        el.classList.remove('ladi-animation-hidden', 'ladi-animation');
        _clearLadiAnimationHidden(el);

        if (effect.mode === 'continuous') {
            if (TEXT_EFFECT_CHAR_MODES.includes(effect.name)) {
                const target = _tfxCharTarget(el);
                if (target) _splitTfxChars(target);
            }
            el.classList.add('wb-tfx-' + effect.name);
            return;
        }
        if (effect.mode === 'scroll') {
            if (!('IntersectionObserver' in window)) {
                el.classList.add('wb-tfx-' + effect.name + '-play');
                return;
            }
            el.classList.add('wb-tfx-scroll-init');
            const obs = new IntersectionObserver((entries) => {
                if (!entries[0].isIntersecting) return;
                obs.disconnect();
                el.classList.remove('wb-tfx-scroll-init');
                el.classList.add('wb-tfx-' + effect.name + '-play');
            }, { threshold: 0.15 });
            obs.observe(el);
            el._tfxObserver = obs;
        }
    }

    _wbMark('before Apply custom texts');
    // --- Apply custom texts ---
    if (window.USER_DATA && window.USER_DATA.texts) {
        injectTextEffectCSS();
        // Capture chiều cao gốc của tất cả Height_TargetFollow_N TRƯỚC khi apply text
        const _hfOriginal = new Map(); // id → {targetDefault, followDefaultH: Map<el, defH>}
        document.querySelectorAll('[class*="Height_TargetFollow_"]').forEach(targetEl => {
            const m = targetEl.className.match(/Height_TargetFollow_(\d+)/);
            if (!m) return;
            // Dùng getComputedStyle để lấy height từ CSS — tránh đo sai khi rAF chạy sau renderRSVPForms
            const targetDefault = parseFloat(getComputedStyle(targetEl).height) || 0;
            const n = m[1];
            const followDefaults = new Map();
            document.querySelectorAll(`.Height_Follow_${n}`).forEach(el => {
                followDefaults.set(el, parseFloat(getComputedStyle(el).height) || el.offsetHeight);
            });
            _hfOriginal.set(targetEl.id, { n, targetDefault, followDefaults });
        });

        function hexToRgbaV(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r},${g},${b},${alpha})`;
        }
        for (const id in window.USER_DATA.texts) {
            const d = window.USER_DATA.texts[id];
            // Chữ trong SEC-Story được SSR render với ID có tiền tố WBLS_ (xem giải thích ở
            // applyImageStyle bên trên) — thử luôn ID có tiền tố nếu ID gốc không khớp.
            const el = document.getElementById(id) || document.getElementById('WBLS_' + id);
            if (!el || !d) continue;
            const inner = el.querySelector('.ladi-headline, .ladi-paragraph');
            if (!inner) continue;

            if (d.content !== undefined) inner.innerHTML = d.content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>');
            const _isDesktopV = window.innerWidth >= 768;
            const _fontSize = (_isDesktopV && d.desktop?.fontSize) ? d.desktop.fontSize : d.fontSize;
            if (_fontSize) inner.style.fontSize = _fontSize;
            if (d.fontWeight) inner.style.fontWeight = d.fontWeight;
            if (d.fontStyle) inner.style.fontStyle = d.fontStyle;
            if (d.textDecoration) inner.style.textDecoration = d.textDecoration;
            if (d.textAlign) inner.style.textAlign = d.textAlign;
            if (d.textTransform) inner.style.textTransform = d.textTransform;

            if (d.fontFamily) {
                const fontEntry = (window.EDIT_FONTS || []).find(f => f.id === d.fontFamily);
                if (fontEntry) {
                    const sid = 'vff_' + fontEntry.id;
                    if (!document.getElementById(sid)) {
                        const s = document.createElement('style');
                        s.id = sid;
                        s.textContent = "@font-face{font-family:'" + fontEntry.id + "';src:url('" + fontEntry.url + "');font-display:swap}";
                        document.head.appendChild(s);
                    }
                    inner.style.fontFamily = "'" + d.fontFamily + "', serif";
                }
            }

            if (d.gradient) {
                const g = d.gradient;
                inner.style.backgroundImage = `linear-gradient(${g.angle}deg,${g.from},${g.to})`;
                inner.style.webkitBackgroundClip = 'text';
                inner.style.backgroundClip = 'text';
                inner.style.webkitTextFillColor = 'transparent';
                inner.style.color = 'transparent';
            } else if (d.color) {
                // Ép override rõ ràng: nhiều mẫu định nghĩa -webkit-text-fill-color/background-clip
                // qua CSS class/ID riêng (không phải inline style) cho chữ gradient sẵn có — gán
                // chuỗi rỗng chỉ xoá inline style, để lộ lại CSS gốc khiến chữ vẫn "kẹt" gradient cũ.
                const _ca = d.colorAlpha ?? 100;
                const _colorFull = _ca < 100 ? hexToRgbaV(d.color, _ca / 100) : d.color;
                inner.style.setProperty('background-image', 'none', 'important');
                inner.style.setProperty('-webkit-background-clip', 'border-box', 'important');
                inner.style.setProperty('background-clip', 'border-box', 'important');
                inner.style.setProperty('-webkit-text-fill-color', _colorFull, 'important');
                inner.style.setProperty('color', _colorFull, 'important');
            }

            if (d.bg || d.border) {
                let wrap = inner.querySelector(':scope > .wb-bg-wrap');
                if (!wrap) {
                    wrap = document.createElement('span');
                    wrap.className = 'wb-bg-wrap';
                    while (inner.firstChild) wrap.appendChild(inner.firstChild);
                    inner.appendChild(wrap);
                }
                wrap.style.setProperty('display', 'inline-block', 'important');
                wrap.style.setProperty('border-radius', (d.bg?.radius ?? 0) + 'px', 'important');
                if (d.bg) {
                    wrap.style.setProperty('background-color', hexToRgbaV(d.bg.color || '#ffffff', (d.bg.opacity ?? 80) / 100), 'important');
                    const pV = d.bg.paddingV ?? d.bg.padding ?? 8;
                    const pH = d.bg.paddingH ?? d.bg.padding ?? 8;
                    wrap.style.setProperty('padding', `${pV}px ${pH}px`, 'important');
                    wrap.style.setProperty('box-sizing', 'border-box', 'important');
                }
                if (d.border) {
                    wrap.style.setProperty('border', `${d.border.width ?? 1}px ${d.border.style || 'solid'} ${d.border.color || '#000'}`, 'important');
                }
            }

            _applyTextEffectToEl(el, d.effect);
        }
        // Sync height-follow elements after restoring text content
        requestAnimationFrame(() => {
            _hfOriginal.forEach(({ n, targetDefault, followDefaults }, targetId) => {
                const targetEl = document.getElementById(targetId);
                if (!targetEl) return;
                // Đo chiều cao thực tế hiện tại (sau khi text đã được apply)
                const savedH = targetEl.style.height;
                targetEl.style.height = 'auto';
                const contentH = targetEl.offsetHeight;
                targetEl.style.height = savedH;
                const isTimeline = targetEl.classList.contains('edit_Timeline');
                // edit_Timeline: cho phép co lại nhỏ hơn mẫu gốc, tối thiểu bằng 1 dòng timeline
                // (mẫu gốc có thể có nhiều mốc demo hơn số mốc người dùng thực sự cấu hình).
                let minH = targetDefault;
                if (isTimeline) {
                    const row = targetEl.querySelector('.wb-tl-row');
                    minH = row ? row.offsetHeight : contentH;
                }
                const newH = Math.max(minH, contentH);
                const delta = newH - targetDefault;
                if (delta <= 0 && !isTimeline) return;
                targetEl.style.height = newH + 'px';
                followDefaults.forEach((defH, el) => {
                    const newFollowH = (defH + delta) + 'px';
                    el.style.setProperty('height', newFollowH, 'important');
                    const bg = el.querySelector(':scope > .ladi-section-background');
                    if (bg) bg.style.setProperty('height', newFollowH, 'important');
                });
            });
        });
    }

    _wbMark('before Ap dung ten khach (class_tenKhachMoi)');
    // --- Áp dụng tên khách cho class_tenKhachMoi khi có ?n= trong URL ---
    (function applyGuestNameToElements() {
        // data-wb-guest: PHP nhúng vào <html> khi nhận được ?n=
        const dataGuest = document.documentElement.getAttribute('data-wb-guest') || '';
        const hasExplicit = window.GUEST_NAME_EXPLICIT === true;
        const nParam = new URLSearchParams(window.location.search).get('n');
        // Fallback: đọc #n= từ hash (Facebook/Zalo IAB có thể strip ?n= khỏi query string
        // nhưng hash được preserve — link format: ?n=3#n=3)
        const hashN = window.location.hash ? new URLSearchParams(window.location.hash.slice(1)).get('n') : null;

        // Chủ thiệp đặt tên mặc định riêng ở popup Xuất bản → phải thay chữ trong
        // .class_tenKhachMoi kể cả khi link mở ra không kèm ?n= (window.GUEST_NAME lúc đó chính
        // là tên mặc định đó — xem php/view.php). Bỏ trống thì giữ nguyên chữ của mẫu như cũ.
        const customDefault = window.GUEST_NAME_DEFAULT || '';
        if (!hasExplicit && !dataGuest && !nParam && !hashN && !customDefault) return;

        let guestName = window.GUEST_NAME || dataGuest || customDefault || '';
        // Nếu server không trả được tên (PHP không nhận ?n=, chỉ còn #n=) → hỏi php/guest_name.php đúng 1 tên.
        // Round 582: trang không còn mang cả danh sách khách mời (lộ dữ liệu cá nhân qua "xem nguồn trang").
        if (!guestName) {
            const n = parseInt(nParam || hashN);
            const slug = window.WB_SLUG || '';
            if (n > 0 && slug && !applyGuestNameToElements._hoi) {
                applyGuestNameToElements._hoi = true;
                const bp = window.WB_BASE_PATH || '';
                fetch(bp + '/php/guest_name.php?slug=' + encodeURIComponent(slug) + '&n=' + n, { credentials: 'omit' })
                    .then(r => r.json())
                    .then(d => { if (d && d.name) { window.GUEST_NAME = d.name; applyGuestNameToElements(); } })
                    .catch(() => {});
            }
        }
        if (!guestName) return;

        function setTextSafe(inner, name) {
            // Tìm container (có thể là wb-bg-wrap nếu bg đang bật)
            const container = inner.querySelector(':scope > .wb-bg-wrap') || inner;
            // Tìm <p> bên trong container
            const p = container.querySelector('p');
            const target = p || container;

            // Ưu tiên cập nhật span bên trong (giữ định dạng LadiPage)
            const span = target.querySelector('span');
            if (span) {
                span.textContent = name;
                return;
            }
            // Cập nhật text node trực tiếp để giữ nguyên inline style của target
            let updated = false;
            target.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE && !updated) {
                    node.textContent = name;
                    updated = true;
                }
            });
            if (!updated) target.textContent = name;
        }

        function apply() {
            document.querySelectorAll('.class_tenKhachMoi').forEach(el => {
                const inner = el.querySelector('.ladi-headline, .ladi-paragraph');
                if (inner) setTextSafe(inner, guestName);
            });
        }

        apply();
        setTimeout(apply, 300);
        setTimeout(apply, 1200);
        // LadiPage animation có thể reveal element muộn khi user scroll
        setTimeout(apply, 3000);
    })();

    // Chữ + tên khách đã thay xong → hiện trang (php/view.php ẩn bằng class wb-wait để khách mời không thấy chữ mẫu nháy)
    document.documentElement.classList.remove('wb-wait');

    _wbMark('before postMessage fallback listener');
    // --- postMessage fallback: outer iframe wrapper gửi tên khi Facebook/Zalo IAB strip URL params ---
    window.addEventListener('message', function (e) {
        if (!e.data || e.data.type !== 'wb_guest' || !e.data.name) return;
        const name = String(e.data.name).trim();
        if (!name) return;
        document.querySelectorAll('.class_tenKhachMoi').forEach(function (el) {
            const inner = el.querySelector('.ladi-headline, .ladi-paragraph');
            if (!inner) return;
            const container = inner.querySelector(':scope > .wb-bg-wrap') || inner;
            const p = container.querySelector('p');
            const target = p || container;
            const span = target.querySelector('span');
            if (span) { span.textContent = name; return; }
            let updated = false;
            target.childNodes.forEach(function (node) {
                if (node.nodeType === Node.TEXT_NODE && !updated) {
                    node.textContent = name;
                    updated = true;
                }
            });
            if (!updated) target.textContent = name;
        });
    });

    _wbMark('before Restore music/playlist');
    // --- Restore music / playlist ---
    (function initMusicPlayer() {
        const ud = window.USER_DATA;
        if (!ud) return;

        const playlist = Array.isArray(ud.musicPlaylist) && ud.musicPlaylist.length
            ? ud.musicPlaylist
            : ud.music
                ? [{ url: ud.music, name: '', startTime: 0, endTime: null }]
                : [];

        if (!playlist.length) return;

        // ── Local audio element ──
        let audioEl = document.getElementById('audio_music');
        if (!audioEl) {
            audioEl = document.createElement('audio');
            audioEl.id = 'audio_music';
            audioEl.style.display = 'none';
            document.body.appendChild(audioEl);
        }

        // ── YouTube player state ──
        let ytPlayer = null;
        let ytApiReady = false;
        let ytApiLoading = false;
        let _syncMusicUI = null; // set by initFloatMusicBtn

        function loadYTApi(cb) {
            if (ytApiReady) { cb(); return; }
            const prev = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                ytApiReady = true;
                if (typeof prev === 'function') prev();
                cb();
            };
            if (!ytApiLoading) {
                ytApiLoading = true;
                const s = document.createElement('script');
                s.src = 'https://www.youtube.com/iframe_api';
                document.head.appendChild(s);
            }
        }

        let currentIdx = 0;
        let _stopFn = null;
        let started = false;

        function playTrack(idx) {
            if (_stopFn) { _stopFn(); _stopFn = null; }
            if (idx >= playlist.length) idx = 0;
            currentIdx = idx;
            const track = playlist[idx];
            if (track.url && track.url.startsWith('yt:')) {
                playYTTrack(track);
            } else {
                playLocalTrack(track);
            }
        }

        function playLocalTrack(track) {
            if (ytPlayer) { try { ytPlayer.pauseVideo(); } catch (e) { } }
            const source = audioEl.querySelector('source');
            if (source) { source.src = track.url; }
            else { audioEl.src = track.url; }
            audioEl.load();
            audioEl.addEventListener('loadedmetadata', function onMeta() {
                audioEl.removeEventListener('loadedmetadata', onMeta);
                const start = track.startTime || 0;
                const end = (track.endTime != null && track.endTime > start) ? track.endTime : audioEl.duration;
                audioEl.currentTime = start;
                audioEl.play().catch(() => { });
                function onTime() {
                    if (audioEl.currentTime >= end - 0.3) {
                        audioEl.removeEventListener('timeupdate', onTime);
                        playTrack(currentIdx + 1);
                    }
                }
                audioEl.addEventListener('timeupdate', onTime);
                _stopFn = () => audioEl.removeEventListener('timeupdate', onTime);
            }, { once: true });
        }

        function playYTTrack(track) {
            if (!audioEl.paused) audioEl.pause();
            const videoId = track.url.slice(3);
            const start = track.startTime || 0;
            const end = track.endTime;

            function afterStateChange(e) {
                if (_syncMusicUI) _syncMusicUI();
                if (e.data === 0 /* ENDED */) playTrack(currentIdx + 1);
            }

            function doPlay() {
                let ytWrap = document.getElementById('_wb_yt_wrap');
                if (!ytWrap) {
                    ytWrap = document.createElement('div');
                    ytWrap.id = '_wb_yt_wrap';
                    ytWrap.style.cssText = 'position:fixed;bottom:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;pointer-events:none;z-index:-1';
                    const el = document.createElement('div');
                    el.id = '_wb_yt_el';
                    ytWrap.appendChild(el);
                    document.body.appendChild(ytWrap);
                }
                if (ytPlayer) {
                    ytPlayer.loadVideoById({ videoId, startSeconds: Math.floor(start) });
                } else {
                    ytPlayer = new YT.Player('_wb_yt_el', {
                        width: 1, height: 1, videoId,
                        playerVars: { autoplay: 1, start: Math.floor(start), controls: 0, playsinline: 1, origin: location.origin },
                        events: {
                            onReady: (e) => { e.target.seekTo(start, true); e.target.playVideo(); if (_syncMusicUI) _syncMusicUI(); },
                            onStateChange: afterStateChange
                        }
                    });
                }
                // Handle endTime via polling
                if (end != null && end > start) {
                    const iv = setInterval(() => {
                        if (!ytPlayer) { clearInterval(iv); return; }
                        try {
                            if (ytPlayer.getCurrentTime() >= end - 0.5) { clearInterval(iv); playTrack(currentIdx + 1); }
                        } catch (e) { clearInterval(iv); }
                    }, 500);
                    _stopFn = () => clearInterval(iv);
                }
            }
            loadYTApi(doPlay);
        }

        // Chờ tương tác người dùng (browser policy)
        // Đặt window.MUSIC_AUTOSTART = true trong template để phát nhạc khi click bất kỳ đâu.
        const autostart = window.MUSIC_AUTOSTART === true;

        function startOnInteraction() {
            if (started) return;
            started = true;
            document.removeEventListener('click', startOnInteraction);
            document.removeEventListener('touchstart', startOnInteraction);
            playTrack(0);
        }
        if (autostart && !window.WB_KHONG_MO) {
            document.addEventListener('click', startOnInteraction, { once: true });
            document.addEventListener('touchstart', startOnInteraction, { once: true });
        }
        // Tắt màn mở thiệp → không còn cú bấm "Mở thiệp" để phát nhạc: phát ở lần BẤM / CHẠM-NHẤC / GÕ PHÍM đầu tiên
        // (trình duyệt chỉ cho phát tiếng sau một cử chỉ thật; cuộn KHÔNG tính). Lần đầu bị chặn (vd chạm để vuốt) thì lần
        // sau thử lại, tới khi nhạc thật sự chạy mới gỡ.
        if (window.WB_KHONG_MO) {
            const SK = ['click', 'touchend', 'keydown'];
            const dangPhat = () => {
                if (!audioEl.paused) return true;
                if (ytPlayer) { try { return ytPlayer.getPlayerState() === 1; } catch (e) { } }
                return false;
            };
            const go = () => SK.forEach(t => document.removeEventListener(t, thuPhat, true));
            function thuPhat() {
                if (started && dangPhat()) { go(); return; }
                if (!started) { startOnInteraction(); return; }
                const cur = playlist[currentIdx] || playlist[0];
                if (cur && cur.url && cur.url.startsWith('yt:')) {
                    if (ytPlayer) { try { ytPlayer.playVideo(); } catch (e) { } }
                } else {
                    audioEl.play().catch(() => { });
                }
            }
            SK.forEach(t => document.addEventListener(t, thuPhat, true));
            audioEl.addEventListener('playing', go, { once: true });
        }

        // Wire speaker toggle buttons.
        // - .off_speaker_persist: hành vi bấm giống hệt .off_speaker (phát nhạc) nhưng KHÔNG bị
        //   syncSpeakers() bên dưới ẩn đi khi nhạc đang phát — dùng khi cần đúng hành vi ẩn/hiện
        //   như off_speaker nhưng muốn nút luôn hiển thị.
        // - .Btn_opencard.Btn_openMusic (PHẢI có cả 2 class trên CÙNG 1 phần tử): nút bìa thiệp
        //   kết hợp "mở thiệp" + "phát nhạc" — CHỈ CẦN 2 class này, không cần thêm off_speaker gì
        //   cả. Không dùng ".Btn_openMusic" đơn lẻ vì class đó còn được gắn cho #wb-music-btn (nút
        //   nhạc nổi, tự có click handler riêng ở initFloatMusicBtn() bên dưới) — nếu bind vào đây
        //   sẽ bị gắn listener trùng, bấm nút nổi sẽ chạy nhầm 2 lần. #wb-music-btn không bao giờ
        //   có kèm class Btn_opencard nên compound selector này không đụng tới nó.
        document.querySelectorAll('.off_speaker, .off_speaker_persist, .Btn_opencard.Btn_openMusic').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!started) { startOnInteraction(); return; }
                const cur = playlist[currentIdx] || playlist[0];
                if (cur && cur.url && cur.url.startsWith('yt:')) {
                    if (ytPlayer) { try { ytPlayer.playVideo(); } catch (e) { } }
                } else {
                    audioEl.play().catch(() => { });
                }
            });
        });
        document.querySelectorAll('.on_speaker').forEach(btn => {
            btn.addEventListener('click', () => {
                if (ytPlayer) { try { ytPlayer.pauseVideo(); } catch (e) { } }
                audioEl.pause();
            });
        });

        // ── Floating music button (view-only, no editing) ─────────────────
        (function initFloatMusicBtn() {
            if (window.IS_EDIT_MODE) return;
            const defs = window.WB_MUSIC_BTN_DEFAULTS || {};
            const ud = window.USER_DATA || {};
            const color = ud.musicBtnColor || defs.color || '#8B5E3C';
            const iconKey = ud.musicBtnIcon || defs.icon || 'note';

            const ICONS = {
                note: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
                notes: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
                speaker: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>`,
                headphones: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
                heart: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
                vinyl: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`,
            };
            const ICON_PAUSE = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`;

            const style = document.createElement('style');
            style.textContent = `
#wb-music-btn{position:fixed;bottom:24px;left:16px;width:48px;height:48px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:9999990;box-shadow:0 4px 16px rgba(0,0,0,.35);transition:transform .15s;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;overflow:visible}
#wb-music-btn:active{transform:scale(.9)}
#wb-music-btn.playing::after{content:'';position:absolute;inset:0;border-radius:50%;border:3px solid rgba(255,255,255,.65);animation:wbMusicRipple 1.8s ease-out infinite;pointer-events:none}
@keyframes wbMusicRipple{0%{transform:scale(1);opacity:.65}100%{transform:scale(2.2);opacity:0}}
            `;
            document.head.appendChild(style);

            const btn = document.createElement('div');
            btn.id = 'wb-music-btn';
            btn.className = 'Btn_openMusic';
            btn.style.background = color;
            btn.innerHTML = ICONS[iconKey] || ICONS.note;

            function syncSpeakers(isPlay) {
                document.querySelectorAll('.off_speaker').forEach(el => { el.style.display = isPlay ? 'none' : ''; });
                document.querySelectorAll('.on_speaker').forEach(el => { el.style.display = isPlay ? '' : 'none'; });
            }

            function syncState() {
                let isPlay = !audioEl.paused;
                if (!isPlay && ytPlayer) {
                    try { isPlay = ytPlayer.getPlayerState() === 1 /* PLAYING */; } catch (e) { }
                }
                btn.className = (isPlay ? 'Btn_closeMusic' : 'Btn_openMusic');
                btn.classList.toggle('playing', isPlay);
                btn.id = 'wb-music-btn';
                btn.innerHTML = isPlay ? ICON_PAUSE : (ICONS[iconKey] || ICONS.note);
                syncSpeakers(isPlay);
            }
            _syncMusicUI = syncState; // expose cho YT state change events
            syncState();
            audioEl.addEventListener('play', syncState);
            audioEl.addEventListener('pause', syncState);
            audioEl.addEventListener('ended', syncState);

            btn.addEventListener('click', () => {
                let isPlay = !audioEl.paused;
                if (!isPlay && ytPlayer) { try { isPlay = ytPlayer.getPlayerState() === 1; } catch (e) { } }
                if (isPlay) {
                    if (ytPlayer) { try { ytPlayer.pauseVideo(); } catch (e) { } }
                    audioEl.pause();
                } else {
                    if (!started) { startOnInteraction(); }
                    else {
                        const cur = playlist[currentIdx] || playlist[0];
                        if (cur && cur.url && cur.url.startsWith('yt:')) {
                            if (ytPlayer) { try { ytPlayer.playVideo(); } catch (e) { } }
                        } else {
                            audioEl.play().catch(() => { });
                        }
                    }
                }
                setTimeout(syncState, 150);
            });

            const openCardEls = document.querySelectorAll('.Btn_opencard');
            if (openCardEls.length && !window.WB_KHONG_MO) {   // tắt màn mở thiệp → hiện nút nhạc ngay
                btn.style.display = 'none';
                openCardEls.forEach(el => el.addEventListener('click', () => { btn.style.display = 'flex'; }));
            }

            document.body.appendChild(btn);
        })();
        // ──────────────────────────────────────────────────────────────────
    })();

    _wbMark('before Floating auto-scroll button + after music player');
    // ── Floating auto-scroll button (view-only) ───────────────────────────
    (function initFloatAutoScrollBtn() {
        if (window.IS_EDIT_MODE) return; // edit_funtion.js gestisce il pulsante in modalità editor
        const ud = window.USER_DATA || {};
        if (ud.autoScrollEnabled === false) return;

        const autoDefs = window.WB_AUTOSCROLL_DEFAULTS || window.WB_MUSIC_BTN_DEFAULTS || {};
        const color = ud.autoScrollBtnColor || autoDefs.color || '#ECDBD4';
        const iconKey = ud.autoScrollBtnIcon || autoDefs.icon || 'scroll';
        const speed = ud.autoScrollSpeed != null ? Number(ud.autoScrollSpeed) : (autoDefs.speed || 40);

        // window.AUTOSCROLL_AUTOSTART = true → bắt đầu ngay, không cần mở thiệp
        // ud.autoScrollAutoStart = true    → bắt đầu sau khi Btn_opencard được click
        const templateAutoStart = window.AUTOSCROLL_AUTOSTART === true;
        const userAutoStart = ud.autoScrollAutoStart === true;

        const ICONS = {
            scroll: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="8" y="3" width="8" height="14" rx="4"/><path d="M12 7v4"/><path d="M8 21l4-4 4 4"/></svg>`,
            arrow: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,
            chevrons: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="7 8 12 13 17 8"/><polyline points="7 14 12 19 17 14"/></svg>`,
            touch: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 11V9a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v1"/><path d="M14 10V8a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v2"/><path d="M10 9.5V6a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v8"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`,
            feather: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17" y1="15" x2="9" y2="15"/></svg>`,
        };
        // Hình vuông dừng — khác hoàn toàn với nút nhạc (hai thanh ngang)
        const ICON_STOP = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>`;

        const style = document.createElement('style');
        style.textContent = `
#wb-autoscroll-btn{position:fixed;bottom:24px;right:16px;width:48px;height:48px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:9999990;box-shadow:0 4px 16px rgba(0,0,0,.35);transition:transform .15s;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;overflow:visible}
#wb-autoscroll-btn:active{transform:scale(.9)}
#wb-autoscroll-btn.scrolling::after{content:'';position:absolute;inset:0;border-radius:50%;border:3px solid rgba(255,255,255,.55);animation:wbScrollRipple 2s ease-out infinite;pointer-events:none}
@keyframes wbScrollRipple{0%{transform:scale(1);opacity:.55}100%{transform:scale(2.4);opacity:0}}
        `;
        document.head.appendChild(style);

        const btn = document.createElement('div');
        btn.id = 'wb-autoscroll-btn';
        btn.style.background = color;
        btn.innerHTML = ICONS[iconKey] || ICONS.scroll;

        let isScrolling = false;
        let rafId = null;
        let lastTime = null;
        let _acc = 0; // accumulated fractional pixels

        function doScroll(px) {
            _acc += px;
            const n = Math.floor(_acc);
            if (n >= 1) {
                _acc -= n;
                window.scrollBy(0, n);
            }
        }
        function getScrollY() {
            return window.pageYOffset || document.documentElement.scrollTop || 0;
        }
        function getMaxScroll() {
            return Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
        }

        function scrollStep(ts) {
            if (!isScrolling) return;
            if (lastTime === null) lastTime = ts;
            const dt = Math.min((ts - lastTime) / 1000, 0.1);
            lastTime = ts;
            const maxSc = getMaxScroll();
            if (maxSc > 0 && getScrollY() >= maxSc - 2) { stopScroll(); return; }
            doScroll(speed * dt);
            rafId = requestAnimationFrame(scrollStep);
        }

        function startScroll() {
            // Force overflow-y: auto to unblock scroll on iOS Safari / LadiPage
            document.documentElement.style.setProperty('overflow-y', 'auto', 'important');
            document.body.style.setProperty('overflow-y', 'auto', 'important');
            _acc = 0;
            isScrolling = true;
            lastTime = null;
            btn.classList.add('scrolling');
            btn.innerHTML = ICON_STOP;
            rafId = requestAnimationFrame(scrollStep);
        }

        function stopScroll() {
            isScrolling = false;
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            btn.classList.remove('scrolling');
            btn.innerHTML = ICONS[iconKey] || ICONS.scroll;
        }

        btn.addEventListener('click', () => { if (isScrolling) stopScroll(); else startScroll(); });
        window.addEventListener('wheel', () => { if (isScrolling) stopScroll(); }, { passive: true });
        window.addEventListener('touchmove', () => { if (isScrolling) stopScroll(); }, { passive: true });

        const openCardEls = document.querySelectorAll('.Btn_opencard');

        if (templateAutoStart) {
            // Cấu hình template: lướt ngay khi vào trang, không cần mở thiệp
            document.body.appendChild(btn);
            setTimeout(startScroll, 1200);
        } else if (openCardEls.length && !window.WB_KHONG_MO) {   // tắt màn mở thiệp → như mẫu không có bìa
            // Có nút mở thiệp → ẩn nút cho đến khi người dùng mở thiệp
            btn.style.display = 'none';
            openCardEls.forEach(el => el.addEventListener('click', () => {
                btn.style.display = 'flex';
                if (userAutoStart) setTimeout(startScroll, 800);
            }));
            document.body.appendChild(btn);
        } else {
            // Không có nút mở thiệp → hiện nút ngay, auto-start nếu người dùng bật
            document.body.appendChild(btn);
            if (userAutoStart) setTimeout(startScroll, 1200);
        }
    })();
    // ─────────────────────────────────────────────────────────────────────────

    // Gán background-image theo từng đợt nhỏ thay vì tất cả cùng lúc — dùng chung cho cả Gallery
    // V1 (renderGalleries) và V2 (renderGalleriesV2) bên dưới. Album có nhiều ảnh (nhiều chục ảnh)
    // tạo hàng loạt request gần như đồng thời qua inline style background-image (không có cơ chế
    // lazy tự nhiên như <img loading="lazy">), khiến trình duyệt kẹt ở trạng thái "đang tải" (tab
    // icon xoay vô hạn dù nội dung đã hiển thị xong) — quan sát thực tế: vài ảnh thì không sao,
    // nhiều ảnh thì luôn bị. Batch nhỏ + trễ giữa các đợt tránh dồn hết request cùng lúc mà vẫn
    // hiện gần như ngay lập tức (đợt đầu load đồng bộ).

    // ── Băng chuyền 3D (coverflow) cho album edit_gallery + edit_galleryV2 ──────────────────────
    // Dùng chung cho trang soạn (edit_funtion.js) và trang xem (view.js) — HAI BẢN PHẢI GIỐNG NHAU.
    // Dựa theo "Băng chuyền 3D" của Thư viện khối (builder-html: galFlowStyle) — ảnh giữa nằm thẳng,
    // hai bên nghiêng vào trong. Khung: .wb-cf (con trực tiếp là các ô ảnh .photoBookImage / .wbgv2-item).
    // mount() gọi lại bao nhiêu lần cũng được (đổi cỡ màn → tính lại kích thước, giữ ảnh đang ở giữa).
    // VÒNG KHÉP KÍN (2026-11-08): các ô xếp theo khoảng cách VÒNG (ảnh cuối nằm ngay bên trái ảnh đầu) nên bên nào cũng
    // luôn còn ảnh, chạy vô tận cả hai chiều (tự chạy / mũi tên / vuốt / chấm). Ô nhảy từ mép này sang mép kia thì tắt
    // chuyển động cho riêng ô đó (không lướt ngang qua giữa). Album 2–4 ảnh: nối thêm BẢN SAO (.wb-cf-ban, không id, không
    // nằm trong dữ liệu) cho đủ ≥ 5 ô; trang soạn: bản sao không phải ClientEditImage, bấm vào thì đưa ẢNH GỐC ra giữa rồi
    // mở đúng ảnh gốc để sửa. Bản sao chép lại ảnh nền của ảnh gốc mỗi lần chuyển (ảnh gốc có thể nạp ảnh muộn).
    window.WBCoverflow = window.WBCoverflow || (function () {
        function css() {
            if (document.getElementById('wb-cf-css')) return;
            const s = document.createElement('style');
            s.id = 'wb-cf-css';
            s.textContent =
                '.wb-cf{position:relative!important;display:block!important;column-count:auto!important;perspective:1100px;overflow:hidden!important;padding:0!important;touch-action:pan-y;-webkit-user-select:none;user-select:none}' +
                '.wb-cf>.wb-cf-it{position:absolute!important;left:50%!important;margin:0!important;grid-column:auto!important;transition:transform .65s cubic-bezier(.2,.8,.2,1),opacity .45s ease,filter .65s ease!important;will-change:transform;box-shadow:0 18px 40px rgba(0,0,0,.35)}' +
                '.wb-cf>.wb-cf-it.wb-cf-ben{filter:brightness(.72) saturate(.9)}' +
                '.wb-cf>.wb-cf-it.wb-cf-nhay{transition:none!important}' +
                '.wb-cf-nut{position:absolute;top:var(--cf-giua,45%);z-index:200;width:38px;height:38px;margin-top:-19px;padding:0;border:0;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.88);color:#333;box-shadow:0 4px 14px rgba(0,0,0,.3);transition:transform .2s,background .2s}' +
                '.wb-cf-nut:hover{transform:scale(1.08);background:#fff}.wb-cf-nut svg{width:20px;height:20px}' +
                '.wb-cf-nut.truoc{left:6px}.wb-cf-nut.sau{right:6px}' +
                '.wb-cf-dots{position:absolute;left:0;right:0;bottom:10px;z-index:200;display:flex;justify-content:center;gap:7px}' +
                '.wb-cf-dots button{width:8px;height:8px;padding:0;border:0;border-radius:99px;cursor:pointer;background:rgba(127,127,127,.45);transition:width .3s,background .3s}' +
                '.wb-cf-dots button.on{width:22px;background:currentColor}';
            document.head.appendChild(s);
        }
        function flow(d) {
            const ad = Math.abs(d);
            const rot = d === 0 ? 0 : (d > 0 ? -38 : 38);
            return 'translateX(-50%) translateX(' + (d * 58) + '%) translateZ(' + (-ad * 120) + 'px) rotateY(' + rot + 'deg) scale(' + (d === 0 ? 1 : 0.84) + ')';
        }
        // khoảng cách vòng từ ô k tới ô giữa i trên N ô: -N/2 < d <= N/2
        function vong(k, i, N) { let d = ((k - i) % N + N) % N; if (d > N / 2) d -= N; return d; }
        const MUI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
        function mount(inner, opt) {
            if (!inner) return;
            opt = opt || {};
            css();
            // bản sao cũ bỏ đi, dựng lại theo danh sách ảnh gốc hiện tại
            Array.prototype.forEach.call(inner.querySelectorAll(':scope > .wb-cf-ban'), function (c) { c.remove(); });
            const items = Array.prototype.filter.call(inner.children, function (c) { return c.matches('.photoBookImage, .wbgv2-item'); });
            if (!items.length) return;
            const W = inner.clientWidth || (inner.parentElement && inner.parentElement.clientWidth) || 360;
            const p = String(inner.getAttribute('data-cf-ratio') || '2/3').split('/').map(Number);
            const rw = p[0] || 2, rh = p[1] || 3;
            let itemW = Math.round(Math.min(W * 0.56, 360));
            let itemH = Math.round(itemW * rh / rw);
            if (itemH > 520) { itemH = 520; itemW = Math.round(itemH * rw / rh); }
            const top = 16, H = itemH + top + 44;
            inner.style.setProperty('height', H + 'px', 'important');
            inner.style.setProperty('--cf-giua', (top + itemH / 2) + 'px');
            // ô = ảnh gốc + bản sao (album 2–4 ảnh)
            const L = items.length, o = items.slice(), goc = items.map(function (_, k) { return k; });
            if (L > 1 && L < 5) {
                const lap = Math.ceil(5 / L);
                for (let r = 1; r < lap; r++) items.forEach(function (it, k) {
                    const c = it.cloneNode(true);
                    c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(function (x) { x.removeAttribute('id'); });
                    c.classList.add('wb-cf-ban'); c.setAttribute('aria-hidden', 'true'); c.setAttribute('data-cf-goc', String(k));
                    if (opt.edit) c.classList.remove('ClientEditImage', 'is-selected', 'is-editing');
                    inner.insertBefore(c, inner.querySelector(':scope > .wb-cf-nut'));
                    o.push(c); goc.push(k);
                });
            }
            let st = inner.__wbCf;
            if (!st) {
                st = inner.__wbCf = { i: Math.floor(Math.max(0, items.length - 1) / 2), auto: null, d: [] };
                const truoc = document.createElement('button');
                truoc.type = 'button'; truoc.className = 'wb-cf-nut truoc'; truoc.setAttribute('aria-label', 'Ảnh trước'); truoc.innerHTML = MUI;
                const sau = truoc.cloneNode(true); sau.className = 'wb-cf-nut sau'; sau.setAttribute('aria-label', 'Ảnh sau'); sau.querySelector('svg').style.transform = 'scaleX(-1)';
                const dots = document.createElement('div'); dots.className = 'wb-cf-dots';
                inner.appendChild(truoc); inner.appendChild(sau); inner.appendChild(dots);
                st.dots = dots;
                const tay = function (n) { st.go(n); if (st.auto) { clearInterval(st.auto); st.auto = null; } };
                truoc.addEventListener('click', function (e) { e.stopPropagation(); tay(st.i - 1); });
                sau.addEventListener('click', function (e) { e.stopPropagation(); tay(st.i + 1); });
                // chấm = ảnh gốc thứ k: đưa ô gần nhất đang mang ảnh đó ra giữa
                dots.addEventListener('click', function (e) {
                    const b = e.target.closest('button'); if (!b) return; e.stopPropagation();
                    const k = +b.dataset.k, N = st.items.length; let best = st.i, bd = 1e9;
                    st.goc.forEach(function (g, s) { if (g === k) { const d = Math.abs(vong(s, st.i, N)); if (d < bd) { bd = d; best = s; } } });
                    tay(best);
                });
                // bấm ảnh bên cạnh = đưa ảnh đó ra giữa (chặn ở pha bắt để ảnh không mở lớn / không bị chọn sửa)
                inner.addEventListener('click', function (e) {
                    const it = e.target.closest('.wb-cf-it');
                    if (!it || it.parentElement !== inner) return;
                    const k = st.items.indexOf(it);
                    if (k < 0) return;
                    if (k !== st.i) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); tay(k); return; }
                    // trang soạn: bấm BẢN SAO ở giữa → đưa ảnh gốc ra giữa rồi mở đúng ảnh gốc để sửa
                    if (st.edit && it.classList.contains('wb-cf-ban')) {
                        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
                        const g = st.goc[k]; tay(g);
                        setTimeout(function () { const og = st.items[g]; if (og) og.click(); }, 700);
                    }
                }, true);
                let x0 = null, y0 = 0;
                inner.addEventListener('pointerdown', function (e) { x0 = e.clientX; y0 = e.clientY; }, { passive: true });
                inner.addEventListener('pointerup', function (e) {
                    if (x0 === null) return;
                    const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
                    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) tay(st.i + (dx < 0 ? 1 : -1));
                }, { passive: true });
                st.go = function (n) {
                    const N = st.items.length;
                    st.i = ((n % N) + N) % N;
                    st.items.forEach(function (it, k) {
                        const d = N > 1 ? vong(k, st.i, N) : 0, ad = Math.abs(d), cu = st.d[k];
                        // bản sao: chép lại ảnh nền của ảnh gốc (ảnh gốc có thể vừa nạp xong / vừa được thay)
                        if (it.classList.contains('wb-cf-ban')) {
                            const a = st.items[st.goc[k]], bg1 = a && a.querySelector('.ladi-image-background'), bg2 = it.querySelector('.ladi-image-background');
                            if (bg1 && bg2) { const cs = getComputedStyle(bg1); bg2.style.setProperty('background-image', cs.backgroundImage, 'important'); bg2.style.setProperty('background-size', cs.backgroundSize, 'important'); bg2.style.setProperty('background-position', cs.backgroundPosition, 'important'); }
                        }
                        // ô vòng từ mép này sang mép kia: nhảy thẳng, không lướt ngang qua giữa
                        const nhay = cu !== undefined && Math.abs(d - cu) > 1;
                        if (nhay) it.classList.add('wb-cf-nhay');
                        it.style.setProperty('transform', flow(d), 'important');
                        it.style.setProperty('z-index', String(100 - ad), 'important');
                        it.style.setProperty('opacity', ad > 3 ? '0' : '1', 'important');
                        it.style.setProperty('pointer-events', ad > 3 ? 'none' : 'auto', 'important');
                        it.classList.toggle('wb-cf-ben', d !== 0);
                        if (nhay) { void it.offsetWidth; it.classList.remove('wb-cf-nhay'); }
                        st.d[k] = d;
                    });
                    const gi = st.goc[st.i];
                    Array.prototype.forEach.call(st.dots.children, function (b, k) { b.classList.toggle('on', k === gi); });
                };
                if (!opt.edit && items.length > 1 && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
                    st.auto = setInterval(function () { if (!document.hidden) st.go(st.i + 1); }, 3800);
                }
            }
            st.edit = !!opt.edit;
            st.items = o; st.goc = goc; st.d = [];
            if (st.i > o.length - 1) st.i = o.length - 1;
            st.dots.innerHTML = L > 1 ? items.map(function (_, k) { return '<button type="button" data-k="' + k + '" aria-label="Ảnh ' + (k + 1) + '"></button>'; }).join('') : '';
            inner.querySelectorAll('.wb-cf-nut').forEach(function (b) { b.style.display = L > 1 ? '' : 'none'; });
            o.forEach(function (it) {
                it.classList.add('wb-cf-it');
                it.style.setProperty('width', itemW + 'px', 'important');
                it.style.setProperty('height', itemH + 'px', 'important');
                it.style.setProperty('top', top + 'px', 'important');
                it.style.setProperty('aspect-ratio', 'auto', 'important');
                it.style.setProperty('max-width', 'none', 'important');
            });
            st.go(st.i);
        }
        return { mount: mount };
    })();

    function _wbApplyV2ImagesStaggered(root, imgData, batchSize, delayMs) {
        const items = Array.from(root.querySelectorAll('[data-bg]'));
        let i = 0;
        function applyOne(el) {
            const url = el.getAttribute('data-bg');
            el.removeAttribute('data-bg');
            const adj = imgData && imgData[el.id];
            if (adj) {
                // Ảnh có chỉnh sửa vị trí/zoom từ trang edit — applyImageStyle() tự set
                // background-image kèm offset/scale đúng (cover thật theo kích thước gốc).
                applyImageStyle(el.id, adj);
                return;
            }
            const bg = el.querySelector('.ladi-image-background');
            if (bg && url) bg.style.backgroundImage = 'url(' + JSON.stringify(url) + ')';
        }
        function runBatch() {
            const end = Math.min(i + batchSize, items.length);
            for (; i < end; i++) applyOne(items[i]);
            if (i < items.length) setTimeout(runBatch, delayMs);
        }
        runBatch();
    }

    _wbMark('before Gallery album rendering (after auto-scroll btn)');
    // ─── Gallery album rendering ───────────────────────────────────────────
    (function renderGalleries() {
        const galleryData = window.USER_DATA && window.USER_DATA.albums;
        if (!galleryData) return;

        // Fix mobile horizontal scroll do overflow:visible trên section
        document.documentElement.style.setProperty('overflow-x', 'hidden', 'important');
        document.body.style.setProperty('overflow-x', 'hidden', 'important');

        const existing = document.getElementById('wb-gallery-styles');
        if (existing) existing.remove();
        const s = document.createElement('style');
        s.id = 'wb-gallery-styles';
        s.textContent = `
html,body{overflow-x:hidden!important;max-width:100vw!important}
.wb-gallery{width:100%;max-width:100%;box-sizing:border-box;display:block;height:auto!important}
.wb-gallery .photoBookImage{box-sizing:border-box;display:block;visibility:visible;opacity:1;position:relative;overflow:hidden}
.wb-gallery .photoBookImage .ladi-image{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;overflow:hidden}
.wb-gallery .photoBookImage .ladi-image-background{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;display:block}
.wb-layout-grid2{display:grid;grid-template-columns:1fr 1fr}
.wb-layout-grid2 .photoBookImage{aspect-ratio:2/3;border-radius:0}
.wb-gallery[data-cols="1"]{grid-template-columns:1fr!important;display:grid!important}
.wb-gallery[data-cols="2"]{grid-template-columns:1fr 1fr!important;display:grid!important}
.wb-gallery[data-cols="3"]{grid-template-columns:repeat(3,1fr)!important;display:grid!important}
.wb-gallery[data-cols="4"]{grid-template-columns:repeat(4,1fr)!important;display:grid!important}
.wb-gallery[data-cols="1"] .photoBookImage,.wb-gallery[data-cols="2"] .photoBookImage,.wb-gallery[data-cols="3"] .photoBookImage,.wb-gallery[data-cols="4"] .photoBookImage{aspect-ratio:1!important;grid-column:unset!important;grid-row:unset!important;margin-top:0!important;transform:none!important;width:auto!important;padding:0!important;box-shadow:none!important;background:none!important}`;
        document.head.appendChild(s);

        Object.entries(galleryData).forEach(([id, cfg]) => {
            if (!cfg || !cfg.images || !cfg.images.length) return;
            const el = document.getElementById(id);
            if (!el) return;
            const wrapper = el.querySelector('.ladi-html-code');
            if (!wrapper) return;

            const items = cfg.images.map((url, idx) =>
                `<div id="${id}_IMG_${idx}" class="photoBookImage" data-bg="${String(url).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"><div class="ladi-image"><div class="ladi-image-background"></div></div></div>`
            ).join('');
            const colsAttr = cfg.cols ? ` data-cols="${cfg.cols}"` : '';
            const gapH = cfg.gapH ?? cfg.gap ?? 8;
            const gapV = cfg.gapV ?? cfg.gap ?? 8;
            const gapStyle = ` style="column-gap:${gapH}px;row-gap:${gapV}px;padding:${Math.round(Math.max(gapH, gapV) / 2)}px"`;
            wrapper.innerHTML = cfg.layout === 'coverflow'
                ? `<div class="wb-gallery wb-layout-coverflow wb-cf" data-cf-ratio="2/3">${items}</div>`
                : `<div class="wb-gallery wb-layout-${cfg.layout}"${colsAttr}${gapStyle}>${items}</div>`;

            // Áp dụng background-image + chỉnh sửa vị trí/zoom đã lưu từ edit mode — dùng chung
            // applyImageStyle() (tính background-size theo cover THẬT dựa trên kích thước gốc ảnh,
            // xem _applyCoverBackgroundSize phía trên) — theo TỪNG ĐỢT NHỎ thay vì tất cả cùng lúc,
            // xem giải thích ở _wbApplyV2ImagesStaggered() (album nhiều ảnh gán background-image
            // đồng loạt qua innerHTML từng khiến tab trình duyệt kẹt ở trạng thái "đang tải" mãi mãi
            // dù nội dung đã hiện xong).
            const imgData = window.USER_DATA && window.USER_DATA.images;
            _wbApplyV2ImagesStaggered(wrapper, imgData, 6, 60);
            if (imgData) {
                cfg.images.forEach((url, idx) => {
                    const imgId = `${id}_IMG_${idx}`;
                    const adj = imgData[imgId];
                    if (!adj) return;
                    const item = wrapper.querySelector(`#${imgId}`);
                    if (!item) return;
                    if (adj.bd && Array.isArray(adj.bd.w) && Array.isArray(adj.bd.r)) {   // viền từng cạnh/góc (edit.js applyImgBorder)
                        item.style.setProperty('border-style', 'solid', 'important');
                        item.style.setProperty('border-width', adj.bd.w.map(v => (+v || 0) + 'px').join(' '), 'important');
                        item.style.setProperty('border-color', adj.bd.c || '#fff', 'important');
                        item.style.setProperty('border-radius', adj.bd.r.map(v => (+v || 0) + 'px').join(' '), 'important');
                        item.style.setProperty('overflow', 'hidden', 'important');
                        return;
                    }
                    if (adj.borderRadius > 0) item.style.setProperty('border-radius', adj.borderRadius + 'px', 'important');
                    if (adj.borderWidth > 0) item.style.setProperty('border', `${adj.borderWidth}px solid ${adj.borderColor ?? '#fff'}`, 'important');
                });
            }

            // Apply border-radius & border toàn bộ ảnh từ cấu hình album
            const _br = cfg.borderRadius ?? 6;
            const _bw = cfg.borderWidth ?? 0;
            const _bc = cfg.borderColor || '#ffffff';
            wrapper.querySelectorAll('.photoBookImage').forEach(item => {
                item.style.setProperty('border-radius', _br + 'px', 'important');
                item.style.setProperty('overflow', 'hidden', 'important');
                if (_bw > 0) {
                    item.style.setProperty('border', `${_bw}px solid ${_bc}`, 'important');
                } else {
                    item.style.removeProperty('border');
                }
            });

            if (cfg.bgColor) {
                el.style.setProperty('background-color', cfg.bgColor, 'important');
                el.style.setProperty('padding', '4px', 'important');
            }
            // Chỉ set height:auto trên chính el và wrapper — KHÔNG collapse section/container
            // vì LP dùng position:absolute nên collapse section sẽ phá tọa độ BoundingRect
            [el, wrapper].forEach(n => {
                n.style.setProperty('height', 'auto', 'important');
                n.style.setProperty('min-height', '0', 'important');
                n.style.setProperty('overflow', 'visible', 'important');
            });
            wrapper.style.setProperty('position', 'relative', 'important');

            // Set overflow:visible trên tất cả ancestor nhưng GIỮ height cũ của chúng
            let nodeUp = el.parentElement;
            while (nodeUp && nodeUp !== document.body) {
                nodeUp.style.setProperty('overflow', 'visible', 'important');
                nodeUp = nodeUp.parentElement;
            }

            // Fix desktop overlap: set explicit px heights tính từ container
            function fixHeights() {
                const inner = wrapper.querySelector('.wb-gallery');
                if (!inner) return;
                if (inner.classList.contains('wb-cf')) { window.WBCoverflow.mount(inner); return; }
                const containerW = inner.getBoundingClientRect().width || inner.offsetWidth;
                if (!containerW) return;
                const numCols = inner.dataset.cols ? parseInt(inner.dataset.cols) : 2;
                const colGap = parseFloat(inner.style.columnGap) || 0;
                const colW = (containerW - colGap * (numCols - 1)) / numCols;
                const colH = Math.round(colW * 3 / 2);
                [...inner.querySelectorAll('.photoBookImage')].forEach(item => {
                    item.style.setProperty('position', 'relative', 'important');
                    item.style.setProperty('max-width', '100%', 'important');
                    item.style.setProperty('height', colH + 'px', 'important');
                    const li = item.querySelector('.ladi-image');
                    if (li) {
                        li.style.setProperty('position', 'absolute', 'important');
                        li.style.setProperty('inset', '0', 'important');
                        li.style.setProperty('width', '100%', 'important');
                        li.style.setProperty('height', '100%', 'important');
                    }
                });
            }
            setTimeout(fixHeights, 80);
            setTimeout(fixHeights, 350);

            // Đo và expand section — dùng LP's original positions (không collapse trước)
            function expandSection() {
                const inner = wrapper.querySelector('.wb-gallery');
                if (!inner) return;
                const galleryH = inner.scrollHeight || inner.offsetHeight;
                if (!galleryH) return;

                let secAlbum = null;
                let node = el.parentElement;
                while (node && node !== document.body) {
                    if (node.classList.contains('SEC-Album')) { secAlbum = node; break; }
                    node = node.parentElement;
                }
                const anchor = secAlbum || el.closest('.ladi-section-content');
                if (!anchor) return;

                // Đo offset từ vị trí LP gốc (section chưa bị collapse)
                const anchorRect = anchor.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                const offset = Math.max(0, elRect.top - anchorRect.top);
                const requiredH = offset + galleryH + 20;

                const targets = secAlbum
                    ? [secAlbum, secAlbum.closest('.ladi-section-content'), secAlbum.closest('.ladi-section')]
                    : [anchor, anchor.closest('.ladi-section')];
                targets.forEach(t => {
                    if (!t) return;
                    t.style.setProperty('height', requiredH + 'px', 'important');
                    t.style.setProperty('min-height', requiredH + 'px', 'important');
                    t.style.setProperty('overflow', 'visible', 'important');
                });
            }
            setTimeout(expandSection, 80);
            setTimeout(expandSection, 350);
            setTimeout(expandSection, 800);
        });
    })();
    // ──────────────────────────────────────────────────────────────────────

    _wbMark('before Gallery V2 album rendering (after Gallery v1)');
    // ─── Gallery V2 album rendering ───────────────────────────────────────
    (function renderGalleriesV2() {
        const galleryData = window.USER_DATA && window.USER_DATA.albumsV2;
        if (!galleryData || !Object.keys(galleryData).length) return;

        const sid = 'wb-gallery-v2-styles';
        if (!document.getElementById(sid)) {
            const s = document.createElement('style');
            s.id = sid;
            s.textContent = `
.wbgv2{width:100%;max-width:100%;box-sizing:border-box;height:auto!important}
.wbgv2-item{box-sizing:border-box;visibility:visible!important;opacity:1!important;overflow:hidden!important}
.wbgv2-item .ladi-image{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;overflow:hidden!important;visibility:visible!important;opacity:1!important}
.wbgv2-item .ladi-image-background{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;display:block!important;visibility:visible!important;opacity:1!important}
.edit_galleryV2>.ladi-html-code{animation:none!important;-webkit-animation:none!important;transform:none!important;visibility:visible!important;opacity:1!important}
.wbgv2-sphere-scene{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;user-select:none;touch-action:none;pointer-events:auto!important;cursor:grab;}
.wbgv2-sphere{position:absolute;width:0;height:0;transform-style:preserve-3d;cursor:grab;}
.wbgv2-sphere-item{position:absolute;transform-origin:center center;}
.wbgv2-sphere-item .ladi-image{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;overflow:visible!important;}
.wbgv2-sphere-item .ladi-image-background{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;background-size:cover;background-position:50% 50%;background-repeat:no-repeat;}
.wbgv2-cylinder-scene{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;user-select:none;touch-action:pan-y;pointer-events:auto!important;cursor:grab;}
.wbgv2-cylinder{position:absolute;width:0;height:0;transform-style:preserve-3d;cursor:grab;}
.wbgv2-cylinder-item{position:absolute;transform-origin:center center;will-change:transform;}
.wbgv2-cylinder-item .ladi-image{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;overflow:visible!important;}
.wbgv2-cylinder-item .ladi-image-background{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;background-size:cover;background-position:50% 50%;background-repeat:no-repeat;}
.wbgv2-item-border-frame{position:absolute;inset:0;pointer-events:none;z-index:2;box-sizing:border-box;display:block;}`;
            document.head.appendChild(s);
        }

        const _smV2 = ['none','0 2px 8px rgba(0,0,0,0.12)','0 4px 16px rgba(0,0,0,0.22)','0 8px 32px rgba(0,0,0,0.38)'];

        function _rv2Rand(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

        function _esc(s) {
            return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        }

        function buildV2Html(images, cfg, id) {
            if (!images || !images.length) return '';
            const layout = cfg.layout || 'grid';
            const cols   = Math.max(1, cfg.cols || 2);
            const ratio  = cfg.ratio || '2/3';
            const gapH   = cfg.gapH ?? 8;
            const gapV   = cfg.gapV ?? 8;
            const br     = cfg.borderRadius ?? 8;
            const bw     = cfg.borderWidth  ?? 0;
            const bc     = cfg.borderColor  || '#ffffff';
            const shadow = _smV2[cfg.shadow ?? 0] || 'none';
            const padH   = cfg.paddingH ?? 0;
            const padV   = cfg.paddingV ?? 0;

            if (layout === 'sphere') {
                const its = images.map((url, idx) =>
                    `<div id="${id}_IMG_${idx}" class="ClientEditImage wbgv2-sphere-item" data-idx="${idx}" data-bg="${_esc(url)}" style="pointer-events:auto;cursor:pointer;"><div class="ladi-image"><div class="ladi-image-background" style="background-size:cover;background-position:50% 50%;"></div></div><div class="wbgv2-item-border-frame"></div></div>`
                ).join('');
                return `<div class="wbgv2 wbgv2-layout-sphere" style="width:100%;box-sizing:border-box;padding:${padV}px ${padH}px;"><div class="wbgv2-sphere-scene"><div class="wbgv2-sphere">${its}</div></div></div>`;
            }

            if (layout === 'coverflow') {
                const decorCf = [br>0?`border-radius:${br}px`:'', bw>0?`border:${bw}px solid ${bc}`:''].filter(Boolean).join(';');
                const its = images.map((url, idx) =>
                    `<div id="${id}_IMG_${idx}" class="ClientEditImage photoBookImage wbgv2-item" data-ratio="${ratio}" data-bg="${_esc(url)}" style="position:absolute;${decorCf};cursor:pointer;pointer-events:auto;"><div class="ladi-image"><div class="ladi-image-background"></div></div></div>`
                ).join('');
                return `<div class="wbgv2 wbgv2-layout-coverflow wb-cf" data-cf-ratio="${ratio}">${its}</div>`;
            }

            if (layout === 'cylinder') {
                const its = images.map((url, idx) =>
                    `<div id="${id}_IMG_${idx}" class="wbgv2-cylinder-item" data-idx="${idx}" data-bg="${_esc(url)}" style="pointer-events:auto;cursor:pointer;"><div class="ladi-image"><div class="ladi-image-background" style="background-size:cover;background-position:50% 50%;"></div></div><div class="wbgv2-item-border-frame"></div></div>`
                ).join('');
                return `<div class="wbgv2 wbgv2-layout-cylinder" style="width:100%;box-sizing:border-box;"><div class="wbgv2-cylinder-scene"><div class="wbgv2-cylinder">${its}</div></div></div>`;
            }

            const rndTypes = layout === 'random' ? images.map((_,i) => {
                const r = _rv2Rand(i);
                return r < 0.38 ? ratio : r < 0.68 ? '1/1' : '3/4';
            }) : null;

            const decor = [br>0?`border-radius:${br}px`:'', bw>0?`border:${bw}px solid ${bc}`:'', shadow!=='none'?`box-shadow:${shadow}`:''].filter(Boolean).join(';');

            const its = images.map((url, idx) => {
                let span = '';
                let ir = ratio;
                if (layout === 'highlight' && idx === 0) span = 'grid-column:1/-1;';
                else if (layout === 'random' && rndTypes) ir = rndTypes[idx];
                const iStyle = [`aspect-ratio:${ir}`, 'position:relative', decor].filter(Boolean).join(';');
                return `<div id="${id}_IMG_${idx}" class="ClientEditImage photoBookImage wbgv2-item" data-ratio="${ir}" data-bg="${_esc(url)}" style="${span}${iStyle};cursor:pointer;pointer-events:auto;z-index:50;"><div class="ladi-image"><div class="ladi-image-background"></div></div></div>`;
            }).join('');

            let wrapStyle;
            if (layout === 'random') {
                wrapStyle = `display:block;column-count:2;column-gap:${gapH}px;padding:${padV}px ${padH}px;width:100%;box-sizing:border-box`;
            } else {
                let disp = 'display:grid', grid = '';
                if (layout === 'grid') grid = `grid-template-columns:repeat(${cols},1fr)`;
                else if (layout === 'highlight') grid = 'grid-template-columns:1fr 1fr';
                else disp = 'display:flex;flex-direction:column';
                wrapStyle = [disp, grid, `column-gap:${gapH}px`, `row-gap:${gapV}px`, `padding:${padV}px ${padH}px`, 'width:100%', 'box-sizing:border-box'].filter(Boolean).join(';');
            }
            return `<div class="wbgv2 wbgv2-layout-${layout}" data-cols="${cols}" style="${wrapStyle}">${its}</div>`;
        }

        function initSphereV2(galleryEl) {
            const scene  = galleryEl.querySelector('.wbgv2-sphere-scene');
            const sphere = galleryEl.querySelector('.wbgv2-sphere');
            if (!scene || !sphere) return;
            const cfg   = (window.USER_DATA.albumsV2 || {})[galleryEl.id] || {};
            const items = [...sphere.querySelectorAll('.wbgv2-sphere-item')];
            if (!items.length) return;
            const n = items.length;

            const containerW = scene.offsetWidth || galleryEl.offsetWidth || 320;
            const [_svr, _svh] = (cfg.ratio || '1/1').split('/').map(Number);
            const radius = Math.round(containerW * 0.46);
            const itemW  = Math.round(containerW * 0.22 * (cfg.imageScale ?? 100) / 100);
            const itemH  = Math.round(itemW * (_svh / _svr));
            const sceneH = Math.round(radius * 2 + itemH * 1.2);

            scene.style.setProperty('height',      sceneH + 'px', 'important');
            scene.style.setProperty('perspective', Math.round(radius * 3.5) + 'px', 'important');
            scene.style.setProperty('pointer-events', 'auto', 'important');
            scene.style.setProperty('cursor', 'grab', 'important');

            // Đảm bảo wrapper LP không chặn pointer-events
            const _hw = galleryEl.querySelector('.ladi-html-code');
            if (_hw) _hw.style.setProperty('pointer-events', 'auto', 'important');

            sphere.style.setProperty('top',  (sceneH / 2) + 'px', 'important');
            sphere.style.setProperty('left', (containerW / 2) + 'px', 'important');

            const br     = cfg.borderRadius ?? 8;
            const bw     = cfg.borderWidth  ?? 0;
            const bc     = cfg.borderColor  || '#fff';
            const shadow = _smV2[cfg.shadow ?? 0] || 'none';

            const PHI = (1 + Math.sqrt(5)) / 2;
            const latArr = [], lngArr = [];
            items.forEach((item, i) => {
                const polar   = Math.acos(1 - 2 * (i + 0.5) / n);
                const azimuth = 2 * Math.PI * i / PHI;
                const lat = 90 - polar * 180 / Math.PI;
                const lng = azimuth * 180 / Math.PI;
                latArr.push(lat); lngArr.push(lng);
                item.style.setProperty('width',       itemW + 'px',        'important');
                item.style.setProperty('height',      itemH + 'px',        'important');
                item.style.setProperty('margin-left', (-itemW / 2) + 'px', 'important');
                item.style.setProperty('margin-top',  (-itemH / 2) + 'px', 'important');
                if (br > 0) item.style.setProperty('border-radius', br + 'px', 'important');
                if (shadow !== 'none') item.style.setProperty('box-shadow', shadow, 'important');
                const _bgEl = item.querySelector('.ladi-image-background');
                if (_bgEl) _bgEl.style.setProperty('border-radius', Math.max(0, br - bw) + 'px', 'important');
                const _frame = item.querySelector('.wbgv2-item-border-frame');
                if (_frame) {
                    _frame.style.setProperty('border-radius', br + 'px', 'important');
                    _frame.style.setProperty('border', bw > 0 ? `${bw}px solid ${bc}` : 'none', 'important');
                }
                item.style.setProperty('transform',
                    `rotateY(${lng.toFixed(1)}deg) rotateX(${lat.toFixed(1)}deg) translateZ(${radius}px)`,
                    'important'
                );
            });
            // itemW/itemH (nên bg.offsetWidth/Height) chỉ có giá trị thật TỪ ĐÂY — áp lại cover +
            // zoom chính xác cho đúng dữ liệu đã canh ở trang edit (trước đó applyImageStyle gọi lúc
            // khung còn kích thước 0 nên phải tạm dùng % fallback). Theo TỪNG ĐỢT NHỎ thay vì tất cả
            // cùng lúc — xem giải thích ở _wbApplyV2ImagesStaggered().
            _wbApplyV2ImagesStaggered(sphere, window.USER_DATA.images || {}, 6, 60);

            let rotX = -12, rotY = 15;
            function applyRot() {
                sphere.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
                const rY = rotY * Math.PI / 180, rX = rotX * Math.PI / 180;
                const sY = Math.sin(rY), cY = Math.cos(rY), sX = Math.sin(rX), cX = Math.cos(rX);
                for (let _i = 0; _i < n; _i++) {
                    const _lr = latArr[_i] * Math.PI / 180, _mr = lngArr[_i] * Math.PI / 180;
                    const _px = Math.cos(_lr) * Math.sin(_mr), _py = -Math.sin(_lr), _pz = Math.cos(_lr) * Math.cos(_mr);
                    const _z2 = _py * sX + (-_px * sY + _pz * cY) * cX;
                    items[_i].style.setProperty('z-index', String(Math.round((_z2 + 1) * 50) + 1), 'important');
                }
            }
            applyRot();

            function findFrontItem() {
                let best = 0, bestZ = -Infinity;
                for (let i = 0; i < n; i++) {
                    const latR = latArr[i] * Math.PI / 180, lngR = lngArr[i] * Math.PI / 180;
                    const px = Math.cos(latR) * Math.sin(lngR), py = -Math.sin(latR), pz = Math.cos(latR) * Math.cos(lngR);
                    const rY = rotY * Math.PI / 180, rX = rotX * Math.PI / 180;
                    const pz1 = -px * Math.sin(rY) + pz * Math.cos(rY);
                    const pz2 = py * Math.sin(rX) + pz1 * Math.cos(rX);
                    if (pz2 > bestZ) { bestZ = pz2; best = i; }
                }
                return best;
            }
            function snapToFront() {
                const i = findFrontItem();
                let tX = latArr[i], tY = -lngArr[i];
                while (tY - rotY >  180) tY -= 360;
                while (rotY - tY  >  180) tY += 360;
                tX = Math.max(-82, Math.min(82, tX));
                function snap() {
                    const dX = tX - rotX, dY = tY - rotY;
                    if (Math.abs(dX) < 0.3 && Math.abs(dY) < 0.3) { rotX = tX; rotY = tY; applyRot(); raf = null; return; }
                    rotX += dX * 0.14; rotY += dY * 0.14; applyRot();
                    raf = requestAnimationFrame(snap);
                }
                raf = requestAnimationFrame(snap);
            }

            if (scene._wbSphereInited) return;
            scene._wbSphereInited = true;

            let dragging = false, zooming = false, pendingDrag = false;
            let lx = 0, ly = 0, vx = 0, vy = 0, raf = null;
            let clickStartX = 0, clickStartY = 0, clickDist = 0, clickedTarget = null;

            function startDrag(x, y) {
                if (zooming) return;
                dragging = true; lx = x; ly = y; vx = 0; vy = 0;
                if (raf) { cancelAnimationFrame(raf); raf = null; }
                sphere.style.setProperty('cursor','grabbing','important');
                scene.style.setProperty('cursor','grabbing','important');
            }
            function moveDrag(x, y) {
                if (!dragging) return;
                const dx = x - lx, dy = y - ly;
                vy = dx * 0.38; vx = -dy * 0.38;
                rotY += vy; rotX = Math.max(-82, Math.min(82, rotX + vx));
                lx = x; ly = y; applyRot();
            }
            function endDrag() {
                if (!dragging) return;
                dragging = false;
                sphere.style.setProperty('cursor','grab','important');
                scene.style.setProperty('cursor','grab','important');
                function inertia() {
                    vx *= 0.93; vy *= 0.93;
                    if (Math.abs(vx) < 0.04 && Math.abs(vy) < 0.04) { raf = null; return; }
                    rotX = Math.max(-82, Math.min(82, rotX + vx)); rotY += vy;
                    applyRot(); raf = requestAnimationFrame(inertia);
                }
                raf = requestAnimationFrame(inertia);
            }

            function showZoomedItem(item) {
                if (zooming) return;
                zooming = true;
                const idx = items.indexOf(item);
                function doOverlay() {
                    const bg = item.querySelector('.ladi-image-background');
                    if (!bg) { zooming = false; return; }
                    const imgUrl = bg.style.backgroundImage;
                    const overlay = document.createElement('div');
                    overlay.style.cssText = 'position:absolute;inset:0;z-index:500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);cursor:pointer;';
                    const zW = Math.min(Math.round(containerW * 0.72), 300);
                    const zH = Math.round(zW * 3 / 2);
                    const imgEl = document.createElement('div');
                    imgEl.style.cssText = `width:${zW}px;height:${zH}px;border-radius:14px;background:${imgUrl};background-size:cover;background-position:center;box-shadow:0 8px 48px rgba(0,0,0,.7);transform:scale(0.2);opacity:0;transition:transform .35s cubic-bezier(.34,1.56,.64,1),opacity .25s ease;pointer-events:none;`;
                    overlay.appendChild(imgEl);
                    scene.appendChild(overlay);
                    requestAnimationFrame(() => requestAnimationFrame(() => { imgEl.style.transform = 'scale(1)'; imgEl.style.opacity = '1'; }));
                    let t = setTimeout(close, 3000);
                    function close() {
                        clearTimeout(t);
                        imgEl.style.transform = 'scale(0.2)'; imgEl.style.opacity = '0';
                        setTimeout(() => { overlay.remove(); zooming = false; }, 350);
                    }
                    overlay.addEventListener('pointerdown', e => { e.stopPropagation(); close(); }, { once: true, capture: true });
                }
                if (idx >= 0) {
                    let tX = latArr[idx], tY = -lngArr[idx];
                    while (tY - rotY > 180) tY -= 360; while (rotY - tY > 180) tY += 360;
                    tX = Math.max(-82, Math.min(82, tX));
                    if (raf) cancelAnimationFrame(raf);
                    function snapZoom() {
                        const dX = tX - rotX, dY = tY - rotY;
                        if (Math.abs(dX) < 0.5 && Math.abs(dY) < 0.5) { rotX = tX; rotY = tY; applyRot(); raf = null; doOverlay(); return; }
                        rotX += dX * 0.2; rotY += dY * 0.2; applyRot();
                        raf = requestAnimationFrame(snapZoom);
                    }
                    raf = requestAnimationFrame(snapZoom);
                } else { doOverlay(); }
            }

            const _sphSpeeds = [0, 0.04, 0.1, 0.18, 0.3, 0.46];
            const _sphDeg = _sphSpeeds[cfg.autoSpeed ?? 2] ?? 0.1;
            let autoT = 0;
            (function autoLoop() {
                autoT++;
                if (!dragging && !zooming && raf === null && _sphDeg > 0) {
                    rotY += _sphDeg;
                    rotX += Math.sin(autoT * 0.014) * (_sphDeg * 0.3);
                    applyRot();
                }
                requestAnimationFrame(autoLoop);
            })();

            // window-level capture — fires before document-level LP handlers
            const _pdHandler = e => {
                if (!scene.isConnected) {
                    window.removeEventListener('pointerdown',   _pdHandler, true);
                    window.removeEventListener('pointermove',   _pmHandler, true);
                    window.removeEventListener('pointerup',     _puHandler, true);
                    window.removeEventListener('pointercancel', _pcHandler, true);
                    return;
                }
                if (zooming) return;
                const sr = scene.getBoundingClientRect();
                if (e.clientX < sr.left || e.clientX > sr.right || e.clientY < sr.top || e.clientY > sr.bottom) return;
                pendingDrag = true;
                clickStartX = e.clientX; clickStartY = e.clientY; clickDist = 0;
                clickedTarget = e.target.closest('.wbgv2-sphere-item');
            };
            const _pmHandler = e => {
                if (!pendingDrag) return;
                const ddx = e.clientX - clickStartX, ddy = e.clientY - clickStartY;
                clickDist = Math.max(clickDist, Math.sqrt(ddx * ddx + ddy * ddy));
                if (!dragging && clickDist > 8) {
                    startDrag(e.clientX, e.clientY);
                }
                if (dragging) {
                    e.preventDefault(); e.stopPropagation();
                    moveDrag(e.clientX, e.clientY);
                }
            };
            const _puHandler = e => {
                if (!pendingDrag) return;
                pendingDrag = false;
                if (dragging) {
                    e.stopPropagation();
                    endDrag();
                } else if (clickedTarget) {
                    // Tap: hiện zoom overlay
                    showZoomedItem(clickedTarget);
                }
            };
            const _pcHandler = e => {
                pendingDrag = false;
                if (dragging) {
                    dragging = false;
                    sphere.style.setProperty('cursor','grab','important');
                    scene.style.setProperty('cursor','grab','important');
                }
            };
            window.addEventListener('pointerdown',   _pdHandler, { passive: false, capture: true });
            window.addEventListener('pointermove',   _pmHandler, { passive: false, capture: true });
            window.addEventListener('pointerup',     _puHandler, { capture: true });
            window.addEventListener('pointercancel', _pcHandler, { capture: true });
        }

        function initCylinderV2(galleryEl) {
            const scene    = galleryEl.querySelector('.wbgv2-cylinder-scene');
            const cylinder = galleryEl.querySelector('.wbgv2-cylinder');
            if (!scene || !cylinder) return;
            if (scene._wbCylInited) return;
            scene._wbCylInited = true;

            const cfg   = (window.USER_DATA.albumsV2 || {})[galleryEl.id] || {};
            const items = [...cylinder.querySelectorAll('.wbgv2-cylinder-item')];
            if (!items.length) return;
            const n = items.length;

            const containerW = scene.offsetWidth || galleryEl.offsetWidth || 320;
            const ratio = cfg.ratio || '2/3';
            const [rw, rh] = ratio.split('/').map(Number);
            const itemW  = Math.round(containerW * 0.58 * (cfg.imageScale ?? 100) / 100);
            const itemH  = Math.round(itemW * (rh / rw));
            const theta  = (2 * Math.PI) / n;
            const spread = (cfg.cylSpread ?? 112) / 100;
            const radius = Math.max(Math.round((itemW / 2) / Math.tan(theta / 2) * spread), Math.round(containerW * 0.28));
            const perspFactor = (radius * 3) / (radius * 3 - radius);
            const sceneH = Math.round(itemH * perspFactor) + 24;
            const stepDeg = 360 / n;

            scene.style.setProperty('height',      sceneH + 'px', 'important');
            scene.style.setProperty('perspective', Math.round(radius * 3) + 'px', 'important');
            cylinder.style.setProperty('top',  (sceneH / 2) + 'px', 'important');
            cylinder.style.setProperty('left', (containerW / 2) + 'px', 'important');

            const br     = cfg.borderRadius ?? 8;
            const bw     = cfg.borderWidth  ?? 0;
            const bc     = cfg.borderColor  || '#fff';

            items.forEach((item, i) => {
                const angle = (i * stepDeg).toFixed(1);
                item.style.setProperty('width',       itemW + 'px',        'important');
                item.style.setProperty('height',      itemH + 'px',        'important');
                item.style.setProperty('margin-left', (-itemW / 2) + 'px', 'important');
                item.style.setProperty('margin-top',  (-itemH / 2) + 'px', 'important');
                item.style.setProperty('transform', `rotateY(${angle}deg) translateZ(${radius}px)`, 'important');
                if (br > 0) item.style.setProperty('border-radius', br + 'px', 'important');
                const bgEl = item.querySelector('.ladi-image-background');
                if (bgEl) bgEl.style.setProperty('border-radius', Math.max(0, br - bw) + 'px', 'important');
                const frame = item.querySelector('.wbgv2-item-border-frame');
                if (frame) {
                    frame.style.setProperty('border-radius', br + 'px', 'important');
                    frame.style.setProperty('border', bw > 0 ? `${bw}px solid ${bc}` : 'none', 'important');
                }
            });
            // itemW/itemH chỉ có giá trị thật TỪ ĐÂY — áp lại cover + zoom chính xác, xem giải thích
            // tương tự trong initSphereV2() phía trên. Theo TỪNG ĐỢT NHỎ thay vì tất cả cùng lúc —
            // xem giải thích ở _wbApplyV2ImagesStaggered().
            _wbApplyV2ImagesStaggered(cylinder, window.USER_DATA.images || {}, 6, 60);

            let rotY = 0, raf = null, autoRaf = null;
            let pendingDrag = false, dragging = false;
            let startX = 0, lastX = 0, vx = 0, clickDist = 0, clickedTarget = null;

            function applyRot() {
                cylinder.style.setProperty('transform', `rotateY(${rotY.toFixed(2)}deg)`, 'important');
                for (let i = 0; i < n; i++) {
                    const worldAngle = (i * stepDeg + rotY) * Math.PI / 180;
                    const z = Math.cos(worldAngle);
                    items[i].style.setProperty('z-index', String(Math.round((z + 1) * 50) + 1), 'important');
                }
            }
            applyRot();

            // Xoay liên tục chậm — tạm dừng khi đang drag hoặc đang chạy inertia/snap
            const _cylSpeeds = [0, 0.1, 0.22, 0.38, 0.58, 0.85];
            const _cylDeg = _cylSpeeds[cfg.autoSpeed ?? 2] ?? 0.22;
            (function autoLoop() {
                if (!dragging && raf === null && _cylDeg > 0) {
                    rotY -= _cylDeg;
                    applyRot();
                }
                autoRaf = requestAnimationFrame(autoLoop);
            })();

            // Tap to zoom
            function showZoom(item) {
                const bg = item.querySelector('.ladi-image-background');
                const url = bg ? bg.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '') : '';
                if (!url) return;
                const ov = document.createElement('div');
                ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
                const img = document.createElement('img');
                img.src = url;
                img.style.cssText = 'max-width:92vw;max-height:88vh;border-radius:8px;box-shadow:0 4px 32px #0006;';
                ov.appendChild(img);
                ov.addEventListener('click', () => ov.remove());
                document.body.appendChild(ov);
            }

            const _pdHandler = e => {
                if (!scene.isConnected) {
                    if (autoRaf) cancelAnimationFrame(autoRaf);
                    window.removeEventListener('pointerdown',   _pdHandler, true);
                    window.removeEventListener('pointermove',   _pmHandler, true);
                    window.removeEventListener('pointerup',     _puHandler, true);
                    window.removeEventListener('pointercancel', _pcHandler, true);
                    return;
                }
                const sr = scene.getBoundingClientRect();
                if (e.clientX < sr.left || e.clientX > sr.right || e.clientY < sr.top || e.clientY > sr.bottom) return;
                pendingDrag = true;
                startX = e.clientX; lastX = e.clientX; clickDist = 0;
                clickedTarget = e.target.closest('.wbgv2-cylinder-item');
            };
            const _pmHandler = e => {
                if (!pendingDrag) return;
                const ddx = Math.abs(e.clientX - startX);
                clickDist = Math.max(clickDist, ddx);
                if (!dragging && clickDist > 8) {
                    dragging = true;
                    if (raf) { cancelAnimationFrame(raf); raf = null; }
                }
                if (dragging) {
                    e.preventDefault(); e.stopPropagation();
                    vx = (e.clientX - lastX) * (180 / containerW) * 1.4;
                    rotY += vx; lastX = e.clientX; applyRot();
                }
            };
            const _puHandler = e => {
                if (!pendingDrag) return;
                pendingDrag = false;
                if (dragging) {
                    dragging = false;
                    e.stopPropagation();
                    function inertia() {
                        vx *= 0.88;
                        if (Math.abs(vx) < 0.15) { raf = null; return; }
                        rotY += vx; applyRot();
                        raf = requestAnimationFrame(inertia);
                    }
                    raf = requestAnimationFrame(inertia);
                } else if (clickedTarget) {
                    showZoom(clickedTarget);
                }
            };
            const _pcHandler = () => {
                pendingDrag = false;
                dragging = false;
            };
            window.addEventListener('pointerdown',   _pdHandler, { passive: false, capture: true });
            window.addEventListener('pointermove',   _pmHandler, { passive: false, capture: true });
            window.addEventListener('pointerup',     _puHandler, { capture: true });
            window.addEventListener('pointercancel', _pcHandler, { capture: true });
        }

        function fixV2Heights(galleryEl) {
            const inner = galleryEl.querySelector('.wbgv2');
            if (!inner) return;
            const cfg    = (window.USER_DATA.albumsV2 || {})[galleryEl.id] || {};
            const ratio  = cfg.ratio || '2/3';
            const parts  = ratio.split('/').map(Number);
            const rw = parts[0] || 2, rh = parts[1] || 3;
            const layout = cfg.layout || 'grid';
            const cols   = Math.max(1, cfg.cols || 2);

            if (layout === 'sphere')   { initSphereV2(galleryEl);   return; }
            if (layout === 'cylinder') { initCylinderV2(galleryEl); return; }
            if (layout === 'coverflow') { window.WBCoverflow.mount(inner); return; }

            if (layout === 'grid') {
                inner.style.setProperty('display', 'grid', 'important');
                inner.style.setProperty('grid-template-columns', `repeat(${cols},1fr)`, 'important');
            } else if (layout === 'highlight') {
                inner.style.setProperty('display', 'grid', 'important');
                inner.style.setProperty('grid-template-columns', '1fr 1fr', 'important');
                const first = inner.querySelector('.wbgv2-item');
                if (first) first.style.setProperty('grid-column', '1 / -1', 'important');
            } else if (layout === 'random') {
                inner.style.setProperty('display', 'block', 'important');
                inner.style.setProperty('column-count', '2', 'important');
            } else {
                inner.style.setProperty('display', 'flex', 'important');
                inner.style.setProperty('flex-direction', 'column', 'important');
            }

            const containerW = inner.getBoundingClientRect().width || inner.offsetWidth;
            if (!containerW) return;
            const colGap  = parseFloat(inner.style.columnGap) || 0;
            const numCols = layout === 'rows' ? 1 : (layout === 'highlight' ? 2 : (layout === 'random' ? 2 : cols));
            const colW    = (containerW - colGap * (numCols - 1)) / numCols;
            const colH    = Math.round(colW * rh / rw);
            const gapH2   = cfg.gapH ?? 8;

            [...inner.querySelectorAll('.wbgv2-item')].forEach((item, i) => {
                let itemH;
                if (layout === 'random') {
                    const ip = (item.dataset.ratio || ratio).split('/').map(Number);
                    const irw = ip[0] || 1, irh = ip[1] || 1;
                    const msnColW = (containerW - gapH2) / 2;
                    itemH = Math.round(msnColW * irh / irw);
                    item.style.setProperty('display', 'block', 'important');
                    item.style.setProperty('break-inside', 'avoid', 'important');
                    item.style.setProperty('page-break-inside', 'avoid', 'important');
                    item.style.setProperty('-webkit-column-break-inside', 'avoid', 'important');
                    item.style.setProperty('position', 'relative', 'important');
                    item.style.setProperty('width', '100%', 'important');
                    item.style.setProperty('height', itemH + 'px', 'important');
                    item.style.setProperty('margin-bottom', `${cfg.gapV ?? 8}px`, 'important');
                } else {
                    itemH = (layout === 'highlight' && i === 0) ? Math.round(containerW * rh / rw) : colH;
                    item.style.setProperty('display', 'block', 'important');
                    item.style.setProperty('position', 'relative', 'important');
                    item.style.setProperty('width', '100%', 'important');
                    item.style.setProperty('height', itemH + 'px', 'important');
                }
                const li = item.querySelector('.ladi-image');
                if (li) { li.style.setProperty('position','absolute','important'); li.style.setProperty('inset','0','important'); li.style.setProperty('width','100%','important'); li.style.setProperty('height','100%','important'); }
            });

            // Chiều cao thật của khung (itemH) chỉ vừa được ấn định Ở TRÊN — applyImageStyle() gọi
            // lúc build HTML ban đầu (trước khi fixV2Heights chạy) đã tính cover theo kích thước
            // TẠM (theo aspect-ratio CSS, có thể khác itemH thật sự nếu layout 'highlight' nhân đôi
            // hàng đầu, hoặc containerW ở lần đo đầu chưa ổn định). Áp lại ngay tại đây để cover +
            // zoom luôn khớp với khung thật, tránh ảnh bị hụt/không lấp kín khi xuất bản.
            const imgData = window.USER_DATA && window.USER_DATA.images;
            if (imgData) {
                inner.querySelectorAll('.wbgv2-item[id]').forEach(item => {
                    const adj = imgData[item.id];
                    if (adj) applyImageStyle(item.id, adj);
                });
            }
        }

        function equalizeV2LastRow(galleryEl) {
            const inner = galleryEl.querySelector('.wbgv2');
            if (!inner) return;
            const cfg = (window.USER_DATA.albumsV2 || {})[galleryEl.id] || {};
            if ((cfg.layout || 'grid') !== 'random') return;
            const items = [...inner.querySelectorAll('.wbgv2-item')];
            if (items.length < 2) return;
            const cr = inner.getBoundingClientRect();
            if (!cr.width) return;
            const midX = cr.left + cr.width / 2;
            let c1 = null, c2 = null, b1 = 0, b2 = 0;
            items.forEach(item => {
                const r = item.getBoundingClientRect();
                if (!r.width) return;
                if (r.left < midX) { if (r.bottom > b1) { b1 = r.bottom; c1 = item; } }
                else               { if (r.bottom > b2) { b2 = r.bottom; c2 = item; } }
            });
            if (!c1 || !c2) return;
            const diff = b1 - b2;
            if (Math.abs(diff) < 4) return;
            const shorter = diff > 0 ? c2 : c1;
            shorter.style.setProperty('height', Math.round(shorter.getBoundingClientRect().height + Math.abs(diff)) + 'px', 'important');
            // Chiều cao vừa đổi → tính lại cover cho đúng khung mới, xem giải thích tương tự trong
            // fixV2Heights() phía trên.
            if (shorter.id) {
                const adj = (window.USER_DATA.images || {})[shorter.id];
                if (adj) applyImageStyle(shorter.id, adj);
            }
        }

        function expandV2Section(galleryEl) {
            const inner = galleryEl.querySelector('.wbgv2');
            if (!inner) return;
            const galleryH = inner.scrollHeight || inner.offsetHeight;
            if (!galleryH) return;
            let secAlbum = null;
            let node = galleryEl.parentElement;
            while (node && node !== document.body) {
                if (node.classList.contains('SEC-Album')) { secAlbum = node; break; }
                node = node.parentElement;
            }
            const anchor = secAlbum || galleryEl.closest('.ladi-section-content');
            if (!anchor) return;
            const aRect = anchor.getBoundingClientRect();
            const eRect = galleryEl.getBoundingClientRect();
            const offset = Math.max(0, eRect.top - aRect.top);
            const _v2layout = (window.USER_DATA.albumsV2 || {})[galleryEl.id]?.layout || '';
            const bottomPad = 20 + ((_v2layout === 'sphere' || _v2layout === 'cylinder') ? 40 : 0);
            const reqH = offset + galleryH + bottomPad;
            const targets = secAlbum
                ? [secAlbum, secAlbum.closest('.ladi-section-content'), secAlbum.closest('.ladi-section')]
                : [anchor, anchor.closest('.ladi-section')];
            targets.forEach(t => {
                if (!t) return;
                t.style.setProperty('height', reqH + 'px', 'important');
                t.style.setProperty('min-height', reqH + 'px', 'important');
                t.style.setProperty('overflow', 'visible', 'important');
            });
        }

        Object.entries(galleryData).forEach(([id, cfg]) => {
            if (!cfg || !cfg.images || !cfg.images.length) return;
            const el = document.getElementById(id);
            if (!el || !el.classList.contains('edit_galleryV2')) return;
            const wrapper = el.querySelector('.ladi-html-code');
            if (!wrapper) return;

            wrapper.innerHTML = buildV2Html(cfg.images, cfg, id);

            // Gán background-image (kèm chỉnh sửa vị trí/zoom từ edit mode, nếu có — dùng chung
            // applyImageStyle() để khớp với những gì đã canh ở trang edit, xem giải thích tương tự
            // trong renderGalleries() (Gallery V1) phía trên) theo TỪNG ĐỢT NHỎ thay vì tất cả cùng
            // lúc — xem giải thích ở _wbApplyV2ImagesStaggered().
            // Sphere/cylinder: initSphereV2()/initCylinderV2() tự làm việc này SAU khi đã định vị
            // 3D xong (cần kích thước item chính xác trước khi tính cover) — không gọi ở đây.
            const _v2Layout = cfg.layout || 'grid';
            if (_v2Layout !== 'sphere' && _v2Layout !== 'cylinder') {
                const imgData = window.USER_DATA && window.USER_DATA.images;
                _wbApplyV2ImagesStaggered(wrapper, imgData, 6, 60);
            }

            [el, wrapper].forEach(n => {
                n.style.setProperty('height', 'auto', 'important');
                n.style.setProperty('min-height', '0', 'important');
                n.style.setProperty('overflow', 'visible', 'important');
                n.style.setProperty('visibility', 'visible', 'important');
                n.style.setProperty('opacity', '1', 'important');
                n.style.setProperty('animation', 'none', 'important');
                n.style.setProperty('-webkit-animation', 'none', 'important');
                n.style.setProperty('transform', 'none', 'important');
            });
            wrapper.style.setProperty('position', 'relative', 'important');
            wrapper.style.setProperty('display', 'block', 'important');

            let nodeUp = el.parentElement;
            while (nodeUp && nodeUp !== document.body) { nodeUp.style.setProperty('overflow', 'visible', 'important'); nodeUp = nodeUp.parentElement; }

            if ((cfg.layout || 'grid') === 'sphere') {
                setTimeout(() => { initSphereV2(el); expandV2Section(el); }, 120);
                setTimeout(() => { initSphereV2(el); expandV2Section(el); }, 450);
            } else if ((cfg.layout || 'grid') === 'cylinder') {
                setTimeout(() => { initCylinderV2(el); expandV2Section(el); }, 120);
                setTimeout(() => { initCylinderV2(el); expandV2Section(el); }, 450);
            } else {
                setTimeout(() => { _wbMark('V2 grid setTimeout 80 START:' + id); fixV2Heights(el); _wbMark('V2 grid setTimeout 80 END:' + id); }, 80);
                setTimeout(() => { _wbMark('V2 grid setTimeout 160 START:' + id); equalizeV2LastRow(el); expandV2Section(el); _wbMark('V2 grid setTimeout 160 END:' + id); }, 160);
                setTimeout(() => { _wbMark('V2 grid setTimeout 300 START:' + id); fixV2Heights(el); _wbMark('V2 grid setTimeout 300 END:' + id); }, 300);
                setTimeout(() => { _wbMark('V2 grid setTimeout 380 START:' + id); equalizeV2LastRow(el); expandV2Section(el); _wbMark('V2 grid setTimeout 380 END:' + id); }, 380);
                setTimeout(() => { _wbMark('V2 grid setTimeout 600 START:' + id); fixV2Heights(el); setTimeout(() => { _wbMark('V2 grid setTimeout 600+80 START:' + id); equalizeV2LastRow(el); expandV2Section(el); _wbMark('V2 grid setTimeout 600+80 END:' + id); }, 80); _wbMark('V2 grid setTimeout 600 END:' + id); }, 600);
            }
        });
        _wbMark('renderGalleriesV2 sync forEach done (setTimeouts scheduled)');
    })();
    // ──────────────────────────────────────────────────────────────────────

    _wbMark('before Restore effects (after Gallery V2)');
    // --- Restore effects ---
    // '__mau__' = "Hiệu ứng riêng của mẫu" (mẫu tự chạy hiệu ứng của nó, xem edit.js effectOptions)
    if (window.Effects && window.USER_DATA && window.USER_DATA.effect && window.USER_DATA.effect !== '__mau__') {
        window.Effects.setSpeed(window.USER_DATA.effectSpeed ?? 1);
        window.Effects.setDensity(window.USER_DATA.effectDensity ?? 1);
        window.Effects.setSize(window.USER_DATA.effectSize ?? 1);
        window.Effects.start(window.USER_DATA.effect);
    }

    // Calendar and Timeline are handled by PHP injecting `let` variables and their own JS.
    // No direct action needed in view.js for them unless their JS needs re-triggering.

    // ─────────────────────────────────────────────────────────────────────
    // ▓▓▓ RSVP FORM & MESSAGE FORM ▓▓▓
    // ─────────────────────────────────────────────────────────────────────

    _wbMark('before RSVP/Message form definitions (after Restore effects)');
    const WB_DEFAULT_RSVP = {
        bgColor: '#ffffff', textColor: '#333333', labelColor: '#333333', inputBg: '#f9f5f0',
        borderColor: '#d4b8a0', borderWidth: 1, btnBg: '#8B5E3C',
        btnText: '#ffffff', borderRadius: 12, extraFields: [],
        labelName: 'Tên khách mời', phName: 'Nhập tên của bạn',
        labelGuestOf: 'Bạn là khách của ai?', optBride: 'Cô Dâu', optGroom: 'Chú Rể',
        optBrideColor: '#8B5E3C', optGroomColor: '#8B5E3C',
        labelAttendance: 'Xác nhận tham dự', optAttend: 'Sẽ tham dự', optDecline: 'Tiếc quá',
        optAttendColor: '#8B5E3C', optDeclineColor: '#8B5E3C',
        labelGuestCount: 'Số lượng khách tham dự', btnLabel: 'Xác Nhận',
        successTitle: 'Đã xác nhận tham dự!',
        successDesc: 'Cảm ơn bạn đã xác nhận.<br>Chúng tôi rất vui được đón tiếp bạn trong ngày trọng đại!',
        successBtnLabel: 'Tuyệt vời 🎊',
        successImage: '',
        successImageShape: 'circle',
    };
    // Trần độ dài lời nhắn — khớp với mb_substr(..., 0, 1500) trong php/message.php
    const WB_MSG_MAX = 1500;

    const WB_DEFAULT_MSG = {
        bgColor: '#ffffff', textColor: '#333333', labelColor: '#333333', inputBg: '#f9f5f0',
        borderColor: '#d4b8a0', borderWidth: 1, btnBg: '#8B5E3C',
        btnText: '#ffffff', borderRadius: 12,
        labelName: 'Tên của bạn', phName: 'Nhập tên của bạn',
        labelVisibility: 'Ai sẽ thấy lời nhắn này?', optAll: 'Tất cả mọi người', optPrivate: 'Chỉ cô dâu, chú rể',
        optAllColor: '#8B5E3C', optPrivateColor: '#8B5E3C',
        labelMessage: 'Lời nhắn của bạn', phMessage: 'Viết lời chúc của bạn...', btnLabel: 'Gửi lời chúc',
        successTitle: 'Lời chúc đã được gửi! 💌',
        successDesc: 'Cảm ơn bạn đã dành tặng lời chúc.<br>Chúng tôi trân trọng từng tình cảm của bạn!',
        successBtnLabel: 'Cảm ơn bạn 💝',
        successImage: '',
        successImageShape: 'circle',
    };

    function wbMergeCfg(base, ...overrides) {
        return Object.assign({}, base, ...overrides.filter(Boolean));
    }
    function wbTryJson(s) { try { return s ? JSON.parse(s) : null; } catch { return null; } }
    function wbEsc(s) {
        return String(s ?? '').replace(/[&<>"']/g, c =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    }

    // Báo cho khách mời trước khi gửi: thông tin được lưu cho chủ thiệp (policy/privacy.php mục "Thông tin của khách mời").
    // Nằm trong .wb-feedback — lỗi / thông báo gửi ghi đè textContent thì dòng này tự nhường chỗ.
    function wbPrivacyNote() {
        const bp = window.BASE_PATH || '';
        return `<span class="wb-privacy-note">Thông tin được lưu cho chủ thiệp · <a href="${wbEsc(bp)}/policy/privacy.php#khach-moi" target="_blank" rel="noopener">Bảo mật</a></span>`;
    }

    function wbInjectCSS(id, css) {
        let el = document.getElementById(id);
        if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
        el.textContent = css;
    }

    function wbShowPopup(opts) {
        const ICONS = {
            heart: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32 56S8 40 8 22a14 14 0 0128 0 14 14 0 0128 0C64 40 32 56 32 56z" fill="#AC7134"/><path d="M32 56S8 40 8 22a14 14 0 0128 0 14 14 0 0128 0C64 40 32 56 32 56z" fill="url(#hg)"/><defs><linearGradient id="hg" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse"><stop stop-color="#E6B066"/><stop offset="1" stop-color="#AC7134"/></linearGradient></defs></svg>`,
            check: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="url(#cg)"/><path d="M20 33l9 9 16-18" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><defs><linearGradient id="cg" x1="2" y1="2" x2="62" y2="62" gradientUnits="userSpaceOnUse"><stop stop-color="#E6B066"/><stop offset="1" stop-color="#AC7134"/></linearGradient></defs></svg>`,
        };

        if (!document.getElementById('wb-popup-css')) {
            const s = document.createElement('style');
            s.id = 'wb-popup-css';
            s.textContent = `
#wb-popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:9999999999;display:flex;align-items:center;justify-content:center;animation:wbFadeIn .25s ease both}
#wb-popup-box{background:#fff;border-radius:24px;padding:36px 28px 28px;text-align:center;max-width:300px;width:88%;box-shadow:0 24px 64px rgba(172,113,52,.3);animation:wbPopUp .38s cubic-bezier(.34,1.56,.64,1) both}
#wb-popup-icon{width:72px;height:72px;margin:0 auto 18px;animation:wbBounceIn .5s .15s cubic-bezier(.34,1.56,.64,1) both}
#wb-popup-image{object-fit:cover;margin:0 auto 18px;display:block;box-shadow:0 6px 20px rgba(172,113,52,.35);border:3px solid #fff;animation:wbBounceIn .5s .15s cubic-bezier(.34,1.56,.64,1) both}
#wb-popup-image.wb-shape-circle{width:110px;height:110px;border-radius:50%}
#wb-popup-image.wb-shape-square{width:130px;height:130px;border-radius:16px}
#wb-popup-image.wb-shape-rect{width:100%;height:150px;border-radius:16px}
#wb-popup-title{font-size:19px;font-weight:700;color:#AC7134;margin-bottom:8px;line-height:1.3}
#wb-popup-desc{font-size:14px;color:#9e8e79;line-height:1.65;margin-bottom:22px}
#wb-popup-btn{background:linear-gradient(135deg,#E6B066,#AC7134);color:#fff;border:none;border-radius:100px;padding:11px 36px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;letter-spacing:.3px;box-shadow:0 4px 16px rgba(172,113,52,.35)}
#wb-popup-btn:hover{opacity:.88;transform:translateY(-1px)}
#wb-popup-bar-wrap{height:3px;background:#f1e1dc;border-radius:3px;margin-top:16px;overflow:hidden}
#wb-popup-bar{height:100%;background:linear-gradient(90deg,#E6B066,#AC7134);border-radius:3px;width:100%;transition:width linear}
#wb-popup-overlay.wb-closing{animation:wbFadeIn .2s ease reverse both}
@keyframes wbFadeIn{from{opacity:0}to{opacity:1}}
@keyframes wbPopUp{from{transform:translateY(28px) scale(.9);opacity:0}to{transform:none;opacity:1}}
@keyframes wbBounceIn{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}`;
            document.head.appendChild(s);
        }

        const old = document.getElementById('wb-popup-overlay');
        if (old) old.remove();

        const autoClose = opts.autoClose ?? 4000;
        // Allowlist — tránh imageShape (dữ liệu do chủ thiệp tự nhập) lọt thẳng vào class attribute
        const shape = ['circle', 'square', 'rect'].includes(opts.imageShape) ? opts.imageShape : 'circle';
        const visualHtml = opts.image
            ? `<img id="wb-popup-image" class="wb-shape-${shape}" src="${wbEsc(opts.image)}" alt="">`
            : `<div id="wb-popup-icon">${ICONS[opts.icon] || ICONS.heart}</div>`;
        const overlay = document.createElement('div');
        overlay.id = 'wb-popup-overlay';
        overlay.innerHTML = `<div id="wb-popup-box">
  ${visualHtml}
  <div id="wb-popup-title">${opts.title || ''}</div>
  <div id="wb-popup-desc">${opts.desc || ''}</div>
  <button id="wb-popup-btn">${opts.btnLabel || 'Đóng'}</button>
  <div id="wb-popup-bar-wrap"><div id="wb-popup-bar"></div></div>
</div>`;
        document.body.appendChild(overlay);

        function closePopup() {
            overlay.classList.add('wb-closing');
            setTimeout(() => overlay.remove(), 210);
        }
        overlay.querySelector('#wb-popup-btn').addEventListener('click', closePopup);
        overlay.addEventListener('click', e => { if (e.target === overlay) closePopup(); });

        if (autoClose > 0) {
            const bar = overlay.querySelector('#wb-popup-bar');
            bar.style.transitionDuration = autoClose + 'ms';
            requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = '0%'; }));
            setTimeout(closePopup, autoClose);
        }
    }

    // màu nền ô có ĐẶC không (rỗng / transparent / có độ trong suốt < 1 → không) — dùng cho luật ô tự điền (autofill)
    function wbNenDac(v) {
        v = String(v || '').trim().toLowerCase();
        if (!v || v === 'transparent' || v === 'none') return false;
        let m = v.match(/^#([0-9a-f]{8})$/); if (m) return m[1].slice(6) === 'ff';
        m = v.match(/^#([0-9a-f]{4})$/); if (m) return m[1][3] === 'f';
        m = v.match(/^rgba?\(([^)]*)\)$/);
        if (m) { const p = m[1].split(/[\s,\/]+/).filter(Boolean); if (p.length >= 4) { const a = p[3].endsWith('%') ? parseFloat(p[3]) / 100 : parseFloat(p[3]); return !(a < 1); } }
        return true;
    }
    function wbBuildCSS(scope, c) {
        const bw = c.borderWidth || 1;
        const br = c.borderRadius || 12;
        const lc = c.labelColor || c.textColor; // màu chữ bên ngoài ô nhập
        const tc = c.textColor;                 // màu chữ bên trong ô nhập
        return [
            `${scope}{font-family:inherit;padding:20px;background:${c.bgColor};color:${lc};border-radius:${br}px;width:100%}`,
            `${scope} *{box-sizing:border-box;font-family:inherit}`,
            `${scope} .wb-form-field{margin-bottom:10px}`,
            `${scope} .wb-form-row{display:flex;gap:10px;margin-bottom:10px}`,
            `${scope} .wb-form-row .wb-form-field{flex:1;min-width:0;margin-bottom:0}`,
            `${scope} .wb-form-label{display:block;font-size:14px;font-weight:600;margin-bottom:3px;color:${lc}}`,
            `${scope} .wb-form-input,${scope} .wb-form-textarea{width:100%;padding:10px 14px;background:${c.inputBg};border:${bw}px solid ${c.borderColor};border-radius:${br}px;color:${tc}!important;-webkit-text-fill-color:${tc}!important;font-size:15px;outline:none;-webkit-appearance:none}`,
            `${scope} .wb-form-select{background-image:url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' fill='none' stroke='${tc}' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>`)}");background-repeat:no-repeat;background-position:right 14px center;background-size:12px 8px;padding-right:38px;cursor:pointer}`,
            `${scope} .wb-form-input:focus,${scope} .wb-form-textarea:focus{border-color:${c.btnBg}}`,
            // Ô trình duyệt TỰ ĐIỀN (autofill, 2026-11-11): Chrome ép nền xanh nhạt #E8F0FE (luật !important của trình duyệt) mà chữ vẫn theo
            // màu chữ ô của mẫu (thường là trắng trên mẫu nền tối) → không đọc được. Giữ nền ô của mẫu bằng transition rất dài (lớp transition
            // thắng cả !important của trình duyệt) + phủ bóng trong màu nền ô khi nền ô là màu ĐẶC; chữ + con trỏ theo màu chữ ô.
            `${scope} .wb-form-input:-webkit-autofill,${scope} .wb-form-input:-webkit-autofill:hover,${scope} .wb-form-input:-webkit-autofill:focus,${scope} .wb-form-input:-webkit-autofill:active,${scope} .wb-form-textarea:-webkit-autofill,${scope} .wb-form-textarea:-webkit-autofill:focus{-webkit-text-fill-color:${tc}!important;caret-color:${tc};transition:background-color 600000s 0s,color 600000s 0s${wbNenDac(c.inputBg) ? `;-webkit-box-shadow:0 0 0 1000px ${c.inputBg} inset!important;box-shadow:0 0 0 1000px ${c.inputBg} inset!important` : ''}}`,
            `${scope} .wb-form-input:autofill,${scope} .wb-form-textarea:autofill{-webkit-text-fill-color:${tc}!important;caret-color:${tc};filter:none!important;transition:background-color 600000s 0s,color 600000s 0s}`,
            `${scope} .wb-form-textarea{min-height:100px;resize:vertical}`,
            `${scope} .wb-char-count{text-align:right;font-size:12px;opacity:.7;margin-top:3px;color:${lc}}`,
            `${scope} .wb-char-count.full{color:#d33;opacity:1}`,
            `${scope} .wb-opt-group{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}`,
            `${scope} .wb-opt-label{display:flex;align-items:center;justify-content:center;cursor:pointer;padding:9px 14px;background:${c.inputBg};border:${bw}px solid ${c.borderColor};border-radius:100px;font-size:14px;color:${tc};transition:all .2s;flex:1;min-width:100px;user-select:none;text-align:center}`,
            `${scope} .wb-opt-label.active{background:${c.btnBg};color:${c.btnText};border-color:${c.btnBg}}`,
            ...(c.optBrideColor   ? [`${scope} .wb-opt-label[data-val="bride"].active{background:${c.optBrideColor};border-color:${c.optBrideColor}}`]   : []),
            ...(c.optGroomColor   ? [`${scope} .wb-opt-label[data-val="groom"].active{background:${c.optGroomColor};border-color:${c.optGroomColor}}`]   : []),
            ...(c.optAttendColor  ? [`${scope} .wb-opt-label[data-val="yes"].active{background:${c.optAttendColor};border-color:${c.optAttendColor}}`]   : []),
            ...(c.optDeclineColor ? [`${scope} .wb-opt-label[data-val="no"].active{background:${c.optDeclineColor};border-color:${c.optDeclineColor}}`]  : []),
            ...(c.optAllColor     ? [`${scope} .wb-opt-label[data-val="all"].active{background:${c.optAllColor};border-color:${c.optAllColor}}`]         : []),
            ...(c.optPrivateColor ? [`${scope} .wb-opt-label[data-val="private"].active{background:${c.optPrivateColor};border-color:${c.optPrivateColor}}`] : []),
            `${scope} .wb-counter{display:flex;align-items:center;gap:10px}`,
            `${scope} .wb-counter-btn{width:36px;height:36px;flex-shrink:0;border:${bw}px solid ${c.borderColor};background:${c.inputBg};color:${tc}!important;-webkit-text-fill-color:${tc}!important;border-radius:50%;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;line-height:1}`,
            `${scope} .wb-counter-val{width:54px;text-align:center;padding:8px 4px;background:${c.inputBg};border:${bw}px solid ${c.borderColor};border-radius:${Math.min(br, 8)}px;color:${tc}!important;-webkit-text-fill-color:${tc}!important;font-size:16px;font-weight:600}`,
            `${scope} .wb-submit-btn{width:70%;display:block;margin:8px auto 0;padding:13px;background:${c.btnBg};color:${c.btnText};border:none;border-radius:${br}px;font-size:16px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity .2s;letter-spacing:.5px}`,
            `${scope} .wb-submit-btn:hover{opacity:.85}`,
            `${scope} .wb-submit-btn:disabled{opacity:.6;cursor:not-allowed}`,
            `${scope} .wb-feedback{margin-top:10px;text-align:center;font-size:14px;min-height:18px}`,
            `${scope} .wb-feedback.ok{color:#2e7d32}`,
            `${scope} .wb-feedback.err{color:#c62828}`,
            // Dòng báo quyền riêng tư nằm gọn trong 18px .wb-feedback luôn chừa sẵn → form không cao thêm, thiệp cũ không xô lệch
            `${scope} .wb-privacy-note{display:block;font-size:11px;line-height:18px;color:${lc};opacity:.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`,
            `${scope} .wb-privacy-note a{color:inherit;text-decoration:underline}`,
        ].join('\n');
    }

    // Render 1 ô "extra field" theo type/size đã cấu hình — PHẢI khớp với bản sao
    // buildExtraFieldHtml() ở edit_funtion.js (preview trong trình sửa).
    // radio = chọn một (nút như ô "Tham dự", data-name="extra_i"); select = danh sách thả xuống (2026-10-13).
    // f.options: mảng lựa chọn (trang soạn nhập mỗi dòng một lựa chọn).
    function wbBuildExtraFieldHtml(f, nameAttr) {
        const type = f.type || 'text';
        const sizeCls = f.size === 'half' ? ' wb-form-field--half' : '';
        const ph = wbEsc(f.placeholder || '');
        const opts = (Array.isArray(f.options) ? f.options : []).map(o => String(o).trim()).filter(Boolean);
        const nm = (nameAttr.match(/name="([^"]+)"/) || [])[1] || '';
        let inputHtml;
        if (type === 'radio') {
            inputHtml = `<div class="wb-opt-group wb-opt-extra" data-name="${wbEsc(nm)}">` +
                opts.map(o => `<label class="wb-opt-label" data-val="${wbEsc(o)}">${wbEsc(o)}</label>`).join('') + `</div>`;
        } else if (type === 'select') {
            inputHtml = `<select class="wb-form-input wb-form-select" ${nameAttr}><option value="">${ph || '— Chọn —'}</option>` +
                opts.map(o => `<option value="${wbEsc(o)}">${wbEsc(o)}</option>`).join('') + `</select>`;
        } else if (type === 'textarea') {
            inputHtml = `<textarea class="wb-form-textarea" ${nameAttr} placeholder="${ph}"></textarea>`;
        } else {
            inputHtml = `<input type="${['number', 'tel', 'email', 'date'].includes(type) ? type : 'text'}" class="wb-form-input" ${nameAttr} placeholder="${ph}">`;
        }
        const lbl = f.label ? `<label class="wb-form-label">${wbEsc(f.label)}</label>` : '';
        return `<div class="wb-form-field${sizeCls} wb-extra-${type}">${lbl}${inputHtml}</div>`;
    }

    // Ghép các ô "half" liền kề thành 1 hàng (wb-form-row); ô "full" hoặc ô "half" lẻ
    // (không có cặp) thì hiển thị nguyên hàng như bình thường.
    // top = true: chỉ các ô đặt TRÊN ô họ tên (f.pos === 'top'); false: các ô còn lại (dưới ô tham dự). Tên ô vẫn theo
    // chỉ số GỐC trong mảng (extra_i) để lúc gửi đọc lại đúng ô.
    function wbBuildExtraFieldsHtml(fields, genNameAttr, top) {
        let html = '';
        for (let i = 0; i < fields.length; i++) {
            const f = fields[i];
            if ((f.pos === 'top') !== !!top) continue;
            const nameAttr = genNameAttr(i);
            if (f.size === 'half' && fields[i + 1] && fields[i + 1].size === 'half' && (fields[i + 1].pos === 'top') === !!top) {
                const f2 = fields[i + 1];
                html += `<div class="wb-form-row">${wbBuildExtraFieldHtml(f, nameAttr)}${wbBuildExtraFieldHtml(f2, genNameAttr(i + 1))}</div>`;
                i++;
            } else {
                html += wbBuildExtraFieldHtml(f, nameAttr);
            }
        }
        return html;
    }

    function wbBuildRSVPHtml(cfg, guestName, isPreview) {
        const c = Object.assign({}, WB_DEFAULT_RSVP, cfg);
        const extra = wbBuildExtraFieldsHtml(c.extraFields || [], i => `name="extra_${i}"`, false);
        const extraTop = wbBuildExtraFieldsHtml(c.extraFields || [], i => `name="extra_${i}"`, true);
        const btnLabel = isPreview ? wbEsc(c.btnLabel) + ' (xem trước)' : wbEsc(c.btnLabel);
        return `
<div class="wb-rsvp-form">
  ${extraTop}
  <div class="wb-form-field">
    <label class="wb-form-label">${wbEsc(c.labelName)}</label>
    <input type="text" class="wb-form-input" name="name" placeholder="${wbEsc(c.phName)}" value="${wbEsc(guestName)}">
  </div>
  ${c.hideGuestOf ? '' : `<div class="wb-form-field">
    <label class="wb-form-label">${wbEsc(c.labelGuestOf)}</label>
    <div class="wb-opt-group" data-name="guestOf">
      <label class="wb-opt-label" data-val="bride">${wbEsc(c.optBride)}</label>
      <label class="wb-opt-label" data-val="groom">${wbEsc(c.optGroom)}</label>
    </div>
  </div>`}
  <div class="wb-form-field">
    <label class="wb-form-label">${wbEsc(c.labelAttendance)}</label>
    <div class="wb-opt-group" data-name="attendance">
      <label class="wb-opt-label" data-val="yes">${wbEsc(c.optAttend)}</label>
      <label class="wb-opt-label" data-val="no">${wbEsc(c.optDecline)}</label>
    </div>
  </div>
  ${c.hideGuestCount ? '' : `<div class="wb-form-field wb-guest-count-field" style="display:none">
    <label class="wb-form-label">${wbEsc(c.labelGuestCount)}</label>
    <div class="wb-counter">
      <button type="button" class="wb-counter-btn wb-dec">−</button>
      <input type="text" class="wb-counter-val" value="1" readonly>
      <button type="button" class="wb-counter-btn wb-inc">+</button>
    </div>
  </div>`}
  ${extra}
  <button class="wb-submit-btn" type="button">${btnLabel}</button>
  <div class="wb-feedback">${wbPrivacyNote()}</div>
</div>`.trim();
    }

    function wbBuildMsgHtml(cfg, guestName, isPreview) {
        const c = Object.assign({}, WB_DEFAULT_MSG, cfg);
        const btnLabel = isPreview ? wbEsc(c.btnLabel) + ' (xem trước)' : wbEsc(c.btnLabel);
        const nameVal = guestName ? ` value="${wbEsc(guestName)}"` : '';
        return `
<div class="wb-msg-form">
  <div class="wb-form-field">
    <label class="wb-form-label">${wbEsc(c.labelName)}</label>
    <input type="text" class="wb-form-input" name="name" placeholder="${wbEsc(c.phName)}"${nameVal}>
  </div>
  <div class="wb-form-field">
    <label class="wb-form-label">${wbEsc(c.labelVisibility)}</label>
    <div class="wb-opt-group" data-name="visibility">
      <label class="wb-opt-label active" data-val="all">${wbEsc(c.optAll)}</label>
      <label class="wb-opt-label" data-val="private">${wbEsc(c.optPrivate)}</label>
    </div>
  </div>
  <div class="wb-form-field">
    <label class="wb-form-label">${wbEsc(c.labelMessage)}</label>
    <textarea class="wb-form-textarea" name="message" maxlength="${WB_MSG_MAX}" placeholder="${wbEsc(c.phMessage)}"></textarea>
    <div class="wb-char-count"><span class="wb-char-num">0</span>/${WB_MSG_MAX}</div>
  </div>
  <button class="wb-submit-btn" type="button">${btnLabel}</button>
  <div class="wb-feedback">${wbPrivacyNote()}</div>
</div>`.trim();
    }

    function wbBindOptGroup(group) {
        group.querySelectorAll('[data-val]').forEach(label => {
            label.addEventListener('click', () => {
                group.querySelectorAll('[data-val]').forEach(l => l.classList.remove('active'));
                label.classList.add('active');
            });
        });
    }

    function wbGetOpt(container, name) {
        const el = container.querySelector(`[data-name="${name}"] .active`);
        return el ? el.dataset.val : '';
    }

    function wbBindRSVPEvents(wrapper, cfg, slug, bp) {
        wrapper.querySelectorAll('.wb-opt-group').forEach(wbBindOptGroup);

        const attendanceGroup = wrapper.querySelector('[data-name="attendance"]');
        const countField = wrapper.querySelector('.wb-guest-count-field');
        if (attendanceGroup && countField) {
            attendanceGroup.addEventListener('click', () => {
                countField.style.display = wbGetOpt(wrapper, 'attendance') === 'yes' ? '' : 'none';
            });
        }

        const countInput = wrapper.querySelector('.wb-counter-val');
        wrapper.querySelector('.wb-dec')?.addEventListener('click', () => {
            const v = parseInt(countInput.value) || 1;
            if (v > 1) countInput.value = v - 1;
        });
        wrapper.querySelector('.wb-inc')?.addEventListener('click', () => {
            const v = parseInt(countInput.value) || 1;
            if (v < 20) countInput.value = v + 1;
        });

        if (!slug) return; // Preview mode: no submission

        const btn = wrapper.querySelector('.wb-submit-btn');
        const btnLabel0 = btn.textContent; // nhãn nút do mẫu/khách đặt — trả lại đúng nhãn này sau khi gửi
        const feedback = wrapper.querySelector('.wb-feedback');

        btn.addEventListener('click', async () => {
            const name = wrapper.querySelector('[name=name]').value.trim();
            const guestOf = wbGetOpt(wrapper, 'guestOf');
            const attendance = wbGetOpt(wrapper, 'attendance');
            const guestCount = parseInt(countInput?.value) || 1;

            feedback.className = 'wb-feedback';
            feedback.textContent = '';

            if (!name) { feedback.className = 'wb-feedback err'; feedback.textContent = 'Vui lòng nhập tên'; return; }
            // Mẫu ẩn ô "khách của ai" (cfg.hideGuestOf) → gửi trống, rsvp.php chấp nhận
            if (!guestOf && !cfg.hideGuestOf) { feedback.className = 'wb-feedback err'; feedback.textContent = 'Vui lòng chọn bạn là khách của ai'; return; }
            if (!attendance) { feedback.className = 'wb-feedback err'; feedback.textContent = 'Vui lòng chọn xác nhận tham dự'; return; }

            const extraFields = (cfg.extraFields || []).map((f, i) => ({
                label: f.label || f.placeholder || '',   // ô thả xuống không nhãn → lấy chữ gợi ý cho danh sách khách đọc được
                value: (f.type === 'radio'
                    ? wbGetOpt(wrapper, 'extra_' + i)
                    : (wrapper.querySelector(`[name="extra_${i}"]`)?.value || '')).trim(),
            }));

            btn.disabled = true;
            btn.textContent = 'Đang gửi...';

            try {
                const fd = new FormData();
                fd.append('slug', slug);
                fd.append('name', name);
                fd.append('guestOf', guestOf);
                fd.append('attendance', attendance);
                fd.append('guestCount', guestCount);
                fd.append('extraFields', JSON.stringify(extraFields));

                const res = await fetch(`${bp}/php/rsvp.php`, { method: 'POST', body: fd });
                const json = await res.json();
                if (json.status === 'ok') {
                    btn.textContent = 'Đã xác nhận';
                    wbShowPopup({
                        icon: 'check',
                        image: cfg.successImage || '',
                        imageShape: cfg.successImageShape || 'circle',
                        title: cfg.successTitle || 'Đã xác nhận tham dự!',
                        desc: cfg.successDesc || 'Cảm ơn bạn đã xác nhận.<br>Chúng tôi rất vui được đón tiếp bạn trong ngày trọng đại!',
                        btnLabel: cfg.successBtnLabel || 'Tuyệt vời 🎊',
                        autoClose: 4500,
                    });
                } else {
                    throw new Error(json.error || 'Lỗi không xác định');
                }
            } catch (err) {
                feedback.className = 'wb-feedback err';
                feedback.textContent = err.message || 'Có lỗi xảy ra, vui lòng thử lại';
                btn.disabled = false;
                btn.textContent = btnLabel0;
            }
        });
    }

    function wbBindMsgEvents(wrapper, cfg, slug, bp) {
        wrapper.querySelectorAll('.wb-opt-group').forEach(wbBindOptGroup);

        // Bộ đếm ký tự lời nhắn — chạy cả ở chế độ xem trước (không có slug)
        const msgBox = wrapper.querySelector('[name=message]');
        const charCount = wrapper.querySelector('.wb-char-count');
        const updateCharCount = () => {
            if (!msgBox || !charCount) return;
            const n = msgBox.value.length;
            charCount.querySelector('.wb-char-num').textContent = n;
            charCount.classList.toggle('full', n >= WB_MSG_MAX);
        };
        msgBox?.addEventListener('input', updateCharCount);

        if (!slug) return;

        const btn = wrapper.querySelector('.wb-submit-btn');
        const btnLabel0 = btn.textContent; // nhãn nút do mẫu/khách đặt — trả lại đúng nhãn này sau khi gửi
        const feedback = wrapper.querySelector('.wb-feedback');

        btn.addEventListener('click', async () => {
            const name = wrapper.querySelector('[name=name]').value.trim();
            const visibility = wbGetOpt(wrapper, 'visibility') || 'all';
            const message = wrapper.querySelector('[name=message]').value.trim();

            feedback.className = 'wb-feedback';
            feedback.textContent = '';

            if (!name) { feedback.className = 'wb-feedback err'; feedback.textContent = 'Vui lòng nhập tên'; return; }
            if (!message) { feedback.className = 'wb-feedback err'; feedback.textContent = 'Vui lòng nhập lời nhắn'; return; }

            btn.disabled = true;
            btn.textContent = 'Đang gửi...';

            try {
                const fd = new FormData();
                fd.append('slug', slug);
                fd.append('name', name);
                fd.append('visibility', visibility);
                fd.append('message', message);

                const res = await fetch(`${bp}/php/message.php`, { method: 'POST', body: fd });
                const json = await res.json();
                if (json.status === 'ok') {
                    wrapper.querySelector('[name=name]').value = '';
                    wrapper.querySelector('[name=message]').value = '';
                    updateCharCount();
                    btn.disabled = false;
                    btn.textContent = btnLabel0;
                    wbShowPopup({
                        icon: 'heart',
                        image: cfg.successImage || '',
                        imageShape: cfg.successImageShape || 'circle',
                        title: cfg.successTitle || 'Lời chúc đã được gửi! 💌',
                        desc: cfg.successDesc || 'Cảm ơn bạn đã dành tặng lời chúc.<br>Chúng tôi trân trọng từng tình cảm của bạn!',
                        btnLabel: cfg.successBtnLabel || 'Cảm ơn bạn 💝',
                        autoClose: 4500,
                    });
                } else {
                    throw new Error(json.error || 'Lỗi không xác định');
                }
            } catch (err) {
                feedback.className = 'wb-feedback err';
                feedback.textContent = err.message || 'Có lỗi xảy ra, vui lòng thử lại';
                btn.disabled = false;
                btn.textContent = btnLabel0;
            }
        });
    }

    function wbReadInlineConfig(el) {
        const script = el.querySelector('.wb-form-config');
        return script ? wbTryJson(script.textContent.trim()) : null;
    }

    _wbMark('before renderRSVPForms IIFE call');
    (function renderRSVPForms() {
        const elements = document.querySelectorAll('.edit_RPSV');
        if (!elements.length) return;

        const slug = window.INVITE_SLUG || '';
        const bp = window.BASE_PATH || '';
        const _nParam = new URLSearchParams(window.location.search).get('n');
        const guestName = _nParam ? (window.GUEST_NAME || '') : '';
        const isPreview = !slug;

        elements.forEach(el => {
            const inlineCfg = wbReadInlineConfig(el);
            const cfg = wbMergeCfg(WB_DEFAULT_RSVP, inlineCfg, window.USER_DATA?.rsvpConfig);

            wbInjectCSS('wb-rsvp-css', wbBuildCSS('.wb-rsvp-form', cfg));

            const wrapper = el.querySelector('.ladi-html-code');
            if (!wrapper) return;
            const cfgScript = wrapper.querySelector('.wb-form-config');
            wrapper.innerHTML = wbBuildRSVPHtml(cfg, guestName, isPreview);
            if (cfgScript) wrapper.insertBefore(cfgScript, wrapper.firstChild);
            wbBindRSVPEvents(wrapper, cfg, slug, bp);
        });
    })();

    _wbMark('before renderMessageForms IIFE call');
    (function renderMessageForms() {
        const elements = document.querySelectorAll('.edit_sendMessage');
        if (!elements.length) return;

        const slug = window.INVITE_SLUG || '';
        const bp = window.BASE_PATH || '';
        const isPreview = !slug;
        const _nParam2 = new URLSearchParams(window.location.search).get('n');
        const guestName = _nParam2 ? (window.GUEST_NAME || '') : '';

        elements.forEach(el => {
            const inlineCfg = wbReadInlineConfig(el);
            const cfg = wbMergeCfg(WB_DEFAULT_MSG, inlineCfg, window.USER_DATA?.messageConfig);

            wbInjectCSS('wb-msg-css', wbBuildCSS('.wb-msg-form', cfg));

            const wrapper = el.querySelector('.ladi-html-code');
            if (!wrapper) return;
            const cfgScript = wrapper.querySelector('.wb-form-config');
            wrapper.innerHTML = wbBuildMsgHtml(cfg, guestName, isPreview);
            if (cfgScript) wrapper.insertBefore(cfgScript, wrapper.firstChild);
            wbBindMsgEvents(wrapper, cfg, slug, bp);
        });
    })();

    _wbMark('before Height Follow ResizeObserver (after Message form render)');
    // ── Height Follow — ResizeObserver cho form elements (RSVP/Message load async) ──
    // Lý do: view.js chỉ sync 1 lần trong rAF, nhưng form script ngoài tải async →
    // lúc đó form chưa render → đo height sai → delta=0 → bỏ qua.
    // ResizeObserver theo dõi liên tục và tự sync lại khi form cao lên sau khi load.
    (function initViewHeightFollow() {
        if (typeof ResizeObserver === 'undefined') return;
        document.querySelectorAll('[class*="Height_TargetFollow_"]').forEach(targetEl => {
            // Chỉ áp dụng cho form elements (.ladi-html-code) — text elements được xử lý bởi rAF sync
            if (!targetEl.querySelector('.ladi-html-code')) return;
            const m = targetEl.className.match(/Height_TargetFollow_(\d+)/);
            if (!m) return;
            const n = m[1];
            const targetDefault = parseFloat(getComputedStyle(targetEl).height) || targetEl.offsetHeight;
            const followEls = Array.from(document.querySelectorAll(`.Height_Follow_${n}`)).map(el => ({
                el,
                defaultH: parseFloat(getComputedStyle(el).height) || el.offsetHeight
            }));
            if (!followEls.length) return;

            let _roFireCount = 0;
            const ro = new ResizeObserver(() => {
                _roFireCount++;
                if (_WB_DEBUG_LOAD && _roFireCount <= 5) _wbMark('HeightFollow ResizeObserver fire #' + _roFireCount + ' for n=' + n);
                if (_WB_DEBUG_LOAD && _roFireCount === 50) console.warn('[wb-debug] HeightFollow RO fired 50+ times for n=' + n + ' — possible resize loop');
                const inner = targetEl.querySelector('.ladi-html-code');
                const formEl = inner && inner.querySelector('.wb-rsvp-form, .wb-msg-form, .wb-tl');
                const contentH = formEl ? formEl.offsetHeight : (inner ? inner.scrollHeight : 0);
                if (!contentH) return;
                const isTimeline = targetEl.classList.contains('edit_Timeline');
                // edit_Timeline: cho phép co lại nhỏ hơn mẫu gốc, tối thiểu bằng 1 dòng timeline
                // (mẫu gốc có thể có nhiều mốc demo hơn số mốc người dùng thực sự cấu hình).
                let minH = targetDefault;
                if (isTimeline) {
                    const row = inner && inner.querySelector('.wb-tl-row');
                    minH = row ? row.offsetHeight : contentH;
                }
                const newH = Math.max(minH, contentH);
                const delta = newH - targetDefault;
                if (delta < 0 && !isTimeline) return;
                targetEl.style.height = newH + 'px';
                followEls.forEach(({ el, defaultH }) => {
                    const h = (defaultH + delta) + 'px';
                    el.style.setProperty('height', h, 'important');
                    const bg = el.querySelector(':scope > .ladi-section-background');
                    if (bg) bg.style.setProperty('height', h, 'important');
                });
            });
            ro.observe(targetEl);
            // Also observe the form so height changes (e.g. guest-count field toggling) trigger sync
            const inner = targetEl.querySelector('.ladi-html-code');
            const formEl = inner && inner.querySelector('.wb-rsvp-form, .wb-msg-form, .wb-tl');
            if (formEl) ro.observe(formEl);
        });
    })();

    _wbMark('before Dress code (after Height Follow)');
    // --- Dress code color display (.edit_dressCode) ---
    (function applyDressCodeView() {
        const ud = window.USER_DATA;
        if (!ud) return;

        const DC_DEFAULTS = {
            // mẫu thiệp khai bảng màu riêng bằng window.WB_DC_COLORS
            get colors() { return window.WB_DC_COLORS || [
                { hex: '#f5f0e8', label: 'Trắng Kem' },
                { hex: '#d4c5a9', label: 'Be Cát' },
                { hex: '#c8a882', label: 'Nâu Nude' },
                { hex: '#e8c5a0', label: 'Đào Phấn' },
            ]; },
            get layout() { return window.WB_DC_RIENG ? '__mau__' : 'circle-row'; },   // THIẾT KẾ DRESSCODE RIÊNG CỦA MẪU (2026-11-08): mẫu khai window.WB_DC_RIENG = { name, icon, render(cfg, esc) → HTML } thì có thêm bố cục '__mau__' (mặc định).
            textColor: '#5a4a3a',
            fontSize: 12,
            swatchSize: 52,
            gap: 16,
            bgColor: '',
            mobileSwatchSize: 0,
            mobileFontSize: 0,
        };

        // Inject keyframe + mobile-responsive classes 1 lần
        if (!document.getElementById('dc-anim-styles')) {
            const s = document.createElement('style');
            s.id = 'dc-anim-styles';
            s.textContent = [
                '@keyframes dcSwatchIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}',
                '.dc-sz-el{width:var(--dc-sz,52px);height:var(--dc-sz,52px);}',
                '.dc-fs-el{font-size:var(--dc-fs,12px)!important;}',
                '@media(max-width:768px){.dc-sz-el{width:var(--dc-sz-m,var(--dc-sz,52px))!important;height:var(--dc-sz-m,var(--dc-sz,52px))!important;}.dc-fs-el{font-size:var(--dc-fs-m,var(--dc-fs,12px))!important;}}',
            ].join('');
            document.head.appendChild(s);
        }

        function esc(s) {
            return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        }

        function renderDressCodeHTML(cfg) {
            const colors = (cfg.colors && cfg.colors.length) ? cfg.colors : DC_DEFAULTS.colors;
            let layout = cfg.layout || 'circle-row';
            if (layout === '__mau__' && !(window.WB_DC_RIENG && typeof window.WB_DC_RIENG.render === 'function')) layout = 'circle-row';
            const tc     = cfg.textColor || '#5a4a3a';
            const fs     = cfg.fontSize  || 12;
            const sz     = cfg.swatchSize || 52;
            const gap    = cfg.gap != null ? Number(cfg.gap) : 16;
            const bgColor = cfg.bgColor || '';
            const msz    = cfg.mobileSwatchSize > 0 ? cfg.mobileSwatchSize : sz;
            const mfs    = cfg.mobileFontSize > 0 ? cfg.mobileFontSize : fs;
            const base   = 'font-family:inherit;box-sizing:border-box;';
            const anim   = i => `animation:dcSwatchIn .55s cubic-bezier(.22,.61,.36,1) both;animation-delay:${(i*0.13).toFixed(2)}s;`;
            const wrapStyle = `${base}${bgColor ? 'background:' + bgColor + ';' : ''}--dc-sz:${sz}px;--dc-sz-m:${msz}px;--dc-fs:${fs}px;--dc-fs-m:${mfs}px;`;

            let inner = '';
            if (layout === '__mau__') {
            try { inner = window.WB_DC_RIENG.render(Object.assign({}, cfg, { colors: colors, textColor: tc, fontSize: fs, swatchSize: sz, gap: gap }), esc) || ''; } catch (e) { inner = ''; }
        } else if (layout === 'circle-row') {
                inner = `<div style="${base}display:flex;flex-wrap:wrap;justify-content:center;gap:${gap}px ${Math.round(gap*1.25)}px;padding:6px 0">
                    ${colors.map((c,i) => `<div style="${base}display:flex;flex-direction:column;align-items:center;gap:6px;${anim(i)}">
                        <div class="dc-sz-el" style="border-radius:50%;background:${c.hex};box-shadow:0 2px 10px rgba(0,0,0,.15),inset 0 1px 3px rgba(255,255,255,.45);width:${sz}px;height:${sz}px"></div>
                        <span class="dc-fs-el" style="${base}color:${tc};text-align:center;line-height:1.3;max-width:${sz+20}px;font-size:${fs}px">${esc(c.label)}</span>
                    </div>`).join('')}
                </div>`;
            } else if (layout === 'stagger') {
                const off = Math.max(14, Math.round(sz * 0.38));
                inner = `<div style="${base}display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:${Math.round(gap*0.5)}px ${gap}px;padding:${off}px 0 6px">
                    ${colors.map((c,i) => `<div style="${base}display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:${i%2===0?0:off}px;${anim(i)}">
                        <div class="dc-sz-el" style="border-radius:50%;background:${c.hex};box-shadow:0 2px 10px rgba(0,0,0,.15),inset 0 1px 3px rgba(255,255,255,.45);width:${sz}px;height:${sz}px"></div>
                        <span class="dc-fs-el" style="${base}color:${tc};text-align:center;line-height:1.3;max-width:${sz+20}px;font-size:${fs}px">${esc(c.label)}</span>
                    </div>`).join('')}
                </div>`;
            } else if (layout === 'grid2') {
                const gsz = Math.max(28, Math.round(sz * 0.73));
                inner = `<div style="${base}display:grid;grid-template-columns:1fr 1fr;gap:${gap}px;padding:4px 0">
                    ${colors.map((c,i) => `<div style="${base}display:flex;align-items:center;gap:10px;${anim(i)}">
                        <div class="dc-sz-el" style="border-radius:50%;background:${c.hex};flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.14);width:${gsz}px;height:${gsz}px"></div>
                        <span class="dc-fs-el" style="${base}color:${tc};line-height:1.3;font-size:${fs}px">${esc(c.label)}</span>
                    </div>`).join('')}
                </div>`;
            } else if (layout === 'grid3') {
                const gsz3 = Math.max(24, Math.round(sz * 0.77));
                inner = `<div style="${base}display:grid;grid-template-columns:1fr 1fr 1fr;gap:${gap}px ${Math.round(gap*0.5)}px;padding:4px 0">
                    ${colors.map((c,i) => `<div style="${base}display:flex;flex-direction:column;align-items:center;gap:5px;${anim(i)}">
                        <div class="dc-sz-el" style="border-radius:50%;background:${c.hex};box-shadow:0 2px 8px rgba(0,0,0,.13);width:${gsz3}px;height:${gsz3}px"></div>
                        <span class="dc-fs-el" style="${base}color:${tc};text-align:center;line-height:1.3;font-size:${Math.max(fs-1,9)}px">${esc(c.label)}</span>
                    </div>`).join('')}
                </div>`;
            } else if (layout === 'strip') {
                const sw = Math.max(20, Math.round(sz * 0.69));
                inner = `<div style="${base}display:flex;justify-content:center;gap:${gap}px;padding:4px 0">
                    ${colors.map((c,i) => `<div style="${base}display:flex;flex-direction:column;align-items:center;gap:7px;${anim(i)}">
                        <div class="dc-sz-el" style="width:${sw}px;flex:1;min-height:60px;border-radius:6px;background:${c.hex};box-shadow:0 2px 10px rgba(0,0,0,.13)"></div>
                        <span class="dc-fs-el" style="${base}color:${tc};text-align:center;line-height:1.3;max-width:${sw+16}px;font-size:${Math.max(fs-1,9)}px">${esc(c.label)}</span>
                    </div>`).join('')}
                </div>`;
            } else {
                // palette (default fallback)
                inner = `<div style="${base}display:flex;flex-wrap:wrap;gap:${gap}px;justify-content:center;padding:4px 0">
                    ${colors.map((c,i) => `<div style="${base}display:flex;flex-direction:column;gap:5px;align-items:center;flex:0 0 auto;${anim(i)}">
                        <div class="dc-sz-el" style="border-radius:10px;background:${c.hex};box-shadow:0 2px 10px rgba(0,0,0,.14);width:${sz}px;height:${sz}px"></div>
                        <span class="dc-fs-el" style="${base}color:${tc};text-align:center;line-height:1.3;width:${sz+8}px;font-size:${Math.max(fs-1,9)}px">${esc(c.label)}</span>
                    </div>`).join('')}
                </div>`;
            }

            return `<div class="dc-render-wrap" style="${wrapStyle}">${inner}</div>`;
        }

        // Khối dresscode NẰM TRONG DÒNG CHẢY (mẫu create_AI/create_old viết tay — không .ladi-section, không
        // position:absolute) thì chiều cao tự bám nội dung: KHÔNG ghim height (trước đây ghim = nội dung + 20px
        // → thừa ~20px dưới, và không co lại khi nội dung nhỏ đi). Chỉ khối Ladi định vị tuyệt đối mới cần
        // ghim height + kéo dài section như cũ.
        function dcTrongDong(el) {
            return !el.closest('.ladi-section') && getComputedStyle(el).position !== 'absolute';
        }

        function syncDCHeight() {
            document.querySelectorAll('.edit_dressCode').forEach(function(el) {
                if (dcTrongDong(el)) {
                    if (el.dataset.dcGhimH) { el.style.removeProperty('height'); delete el.dataset.dcGhimH; }
                    return;
                }
                if (!el.dataset.dcDefaultH && el.offsetHeight > 0) {
                    el.dataset.dcDefaultH = String(el.offsetHeight);
                }
                const defaultH = parseInt(el.dataset.dcDefaultH) || 60;
                const inner    = el.querySelector('.ladi-html-code') || el;
                const rendered = inner.firstElementChild;
                if (!rendered) return;
                const contentH = rendered.offsetHeight + 20;
                const newH     = Math.max(defaultH, contentH);
                const delta    = newH - defaultH;
                el.style.setProperty('height', newH + 'px', 'important');
                el.dataset.dcGhimH = '1';
                const section = el.closest('.ladi-section');
                if (!section) return;
                if (!section.dataset.dcDefaultH && section.offsetHeight > 0) {
                    section.dataset.dcDefaultH = String(section.offsetHeight);
                }
                const sDefault = parseInt(section.dataset.dcDefaultH) || 0;
                section.style.height = (sDefault + delta) + 'px';
                const bg = section.querySelector(':scope > .ladi-section-background');
                if (bg) bg.style.height = (sDefault + delta) + 'px';
            });
        }

        function apply() {
            const saved = ud.dressCode || {};
            const cfg = Object.assign({}, DC_DEFAULTS, saved);
            if (!cfg.colors || !cfg.colors.length) cfg.colors = DC_DEFAULTS.colors.map(c => ({...c}));

            document.querySelectorAll('.edit_dressCode').forEach(function(el) {
                // Capture default height trước khi thay đổi
                if (!el.dataset.dcDefaultH && el.offsetHeight > 0) {
                    el.dataset.dcDefaultH = String(el.offsetHeight);
                }
                const section = el.closest('.ladi-section');
                if (section && !section.dataset.dcDefaultH && section.offsetHeight > 0) {
                    section.dataset.dcDefaultH = String(section.offsetHeight);
                }

                const inner = el.querySelector('.ladi-html-code') || el;
                inner.style.setProperty('animation', 'none', 'important');
                inner.style.setProperty('-webkit-animation', 'none', 'important');
                inner.style.setProperty('transform', 'none', 'important');
                inner.style.setProperty('visibility', 'visible', 'important');
                inner.style.setProperty('opacity', '1', 'important');
                inner.style.setProperty('display', 'block', 'important');
                inner.style.setProperty('width', '100%', 'important');
                inner.style.setProperty('height', '100%', 'important');
                // Chỉ thay DOM khi HTML vẽ ra KHÁC lần trước (hoặc nội dung đã bị script khác xoá/thay).
                // Thay innerHTML y hệt = hiệu ứng vào (dcSwatchIn / hiệu ứng của thiết kế riêng) chạy lại
                // ngay trước mắt khách ở giây 1,5 và 3,5.
                const html = renderDressCodeHTML(cfg);
                if (el._dcHtml === html && el._dcNode && el._dcNode.parentNode === inner) return;
                inner.innerHTML = html;
                el._dcHtml = html;
                el._dcNode = inner.firstElementChild;
            });

            requestAnimationFrame(syncDCHeight);
            setTimeout(syncDCHeight, 300);
        }

        _wbMark('DressCode apply() call #1 START');
        apply();
        _wbMark('DressCode apply() call #1 END');
        // Hai lần gọi lại (có từ khi thêm dresscode): ép lại style hiện rõ trên .ladi-html-code sau khi
        // hiệu ứng/scroll-trigger kiểu LadiPage chạy xong, vẽ lại nếu script khác xoá nội dung hoặc mẫu khai
        // WB_DC_COLORS/WB_DC_RIENG muộn, và đo lại chiều cao (phông tải xong). DOM chỉ bị thay khi HTML đổi.
        setTimeout(() => { _wbMark('DressCode apply() @1500 START'); apply(); _wbMark('DressCode apply() @1500 END'); }, 1500);
        setTimeout(() => { _wbMark('DressCode apply() @3500 START'); apply(); _wbMark('DressCode apply() @3500 END'); }, 3500);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { syncDCHeight(); }).catch(function () {});
    })();

    _wbMark('before Timeline scroll-appear anim (after Dress code)');
    // ── Timeline row scroll-appear animation ──────────────────────────────────
    (function initTimelineScrollAnim() {
        if (!('IntersectionObserver' in window)) return;
        const STAGGER = 150;
        if (!document.getElementById('_wb_tl_kf')) {
            const s = document.createElement('style');
            s.id = '_wb_tl_kf';
            s.textContent = '@keyframes wbTlViewIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}';
            document.head.appendChild(s);
        }
        // D1 (.wb-tl-row): code.js already handles scroll reveal via wb-scroll-item.
        // Suppress the immediate wbTlIn CSS animation; restore opacity once that animation ends.
        document.querySelectorAll('.wb-tl .wb-tl-row').forEach(function(row) {
            row.style.animation = 'none';
            row.style.opacity = '0';
            row.addEventListener('animationend', function onEnd() {
                row.style.opacity = '1';
                row.removeEventListener('animationend', onEnd);
            });
        });
        // D2–D5: no code.js handler — use IntersectionObserver + wbTlViewIn
        var COMBOS = [
            ['.wb2-wrap', '.wb2-row'],
            ['.wb3-wrap', '.wb3-row'],
            ['.wb4-wrap', '.wb4-row'],
            ['.wb5-wrap', '.wb5-item'],
        ];
        COMBOS.forEach(function([wrapSel, rowSel]) {
            document.querySelectorAll(wrapSel).forEach(function(wrap) {
                var rows = Array.from(wrap.querySelectorAll(rowSel));
                if (!rows.length) return;
                rows.forEach(function(row) {
                    row.style.animation = 'none';
                    row.style.opacity = '0';
                });
                var obs = new IntersectionObserver(function([entry]) {
                    if (!entry.isIntersecting) return;
                    obs.disconnect();
                    rows.forEach(function(row, i) {
                        setTimeout(function() {
                            row.style.animation = 'wbTlViewIn 0.7s ease-out both';
                            row.style.opacity = '';
                        }, i * STAGGER);
                    });
                }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
                obs.observe(wrap);
            });
        });
    })();
    // ──────────────────────────────────────────────────────────────────────────

    _wbMark('before WbForms expose (after Timeline scroll anim) — LAST BLOCK');
    // Expose builders so edit_funtion.js can reuse them for live preview
    window.WbForms = {
        buildRSVPHtml: wbBuildRSVPHtml,
        buildMsgHtml: wbBuildMsgHtml,
        buildCSS: wbBuildCSS,
        injectCSS: wbInjectCSS,
        mergeCfg: wbMergeCfg,
        tryJson: wbTryJson,
        bindRSVPEvents: wbBindRSVPEvents,
        bindMsgEvents: wbBindMsgEvents,
        bindOptGroup: wbBindOptGroup,
        DEFAULT_RSVP: WB_DEFAULT_RSVP,
        DEFAULT_MSG: WB_DEFAULT_MSG,
    };
    _wbMark('view.js DOMContentLoaded handler END (all sync code finished)');
});

// ── Ẩn phần Album trống khi xem thiệp (áp cho MỌI mẫu, kể cả mẫu LadiPage cũ) ──────────
// Chỉ ẩn khi CẢ HAI cùng trống:
//   1. chức năng Album (.edit_gallery / .edit_galleryV2) không dựng ra ảnh nào, VÀ
//   2. các ô ảnh thiết kế sẵn trong phần (ảnh mẫu hoặc ảnh khách đã thay) cũng không có ảnh.
// Mẫu cũ có ảnh dựng sẵn trong phần Album → không bao giờ bị ẩn. Ô đang chờ LadiPage lazyload
// (.ladi-lazyload gỡ tạm ảnh nền) được tính là CÓ ảnh để khỏi ẩn nhầm.
(function () {
    if (window.IS_EDIT_MODE || document.querySelector('[data-wb-edit-ui]')) return;
    function coAnhNen(bg) {
        if (bg.closest('.ladi-lazyload') || bg.classList.contains('ladi-lazyload')) return true;
        var m = /url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(bg).backgroundImage || '');
        return !!(m && !/^data:/.test(m[1]));
    }
    function anAlbumTrong() {
        document.querySelectorAll('.SEC-Album').forEach(function (sec) {
            if (sec.querySelector('.photoBookImage, .wbgv2-item, .wbgv2-sphere-item, .wbgv2-cylinder-item')) return;
            var coAnh = false;
            sec.querySelectorAll('.ladi-image-background').forEach(function (bg) {
                if (!coAnh && !bg.closest('.edit_gallery, .edit_galleryV2') && coAnhNen(bg)) coAnh = true;
            });
            if (sec.querySelector('img[src]:not([src^="data:"])')) coAnh = true;
            if (!coAnh) sec.style.setProperty('display', 'none', 'important');
        });
    }
    window.addEventListener('load', function () { setTimeout(anAlbumTrong, 1500); });
})();

// ── DẢI NGĂN GIỮA CÁC PHẦN (mẫu viết tay create_AI / birthday_AI — window.TMX_CAU_HINH.vach) ──
// Ẩn 1 phần chỉ ẩn khối section; dải ngăn (vd. .sr-vach) nằm NGOÀI section nên còn lại và dồn đống khi ẩn nhiều phần
// liền nhau. Quy tắc: dải chỉ hiện khi nằm GIỮA 2 phần đang hiện, giữa 2 phần hiện chỉ giữ 1 dải. Dùng chung trang soạn
// (phần ẩn = .sec-edit-hidden, chỉ làm mờ) và trang xem (phần ẩn = display:none). PHẢI GIỐNG bản trong edit.js.
function wbDongBoVach(laSoan) {
    var CH = window.TMX_CAU_HINH;
    if (!CH || !CH.vach) return;
    var cls = String(CH.vach).replace(/^\./, ''), selPhan = CH.phan || 'section';
    var khung = (CH.sapXep && CH.sapXep.khung && document.querySelector(CH.sapXep.khung)) || document.querySelector('.ladi-wraper');
    if (!khung) return;
    if (!document.getElementById('wbVachCss')) {
        var st = document.createElement('style'); st.id = 'wbVachCss';
        st.textContent = laSoan ? '.wb-vach-an{opacity:.18!important}' : '.wb-vach-an{display:none!important}';
        document.head.appendChild(st);
    }
    var an = el => (laSoan && el.classList.contains('sec-edit-hidden')) || getComputedStyle(el).display === 'none';
    var daCoPhan = false, cho = null;
    Array.prototype.forEach.call(khung.children, c => {
        if (c.classList.contains(cls)) { c.classList.add('wb-vach-an'); if (daCoPhan && !cho) cho = c; return; }
        if (!c.matches(selPhan) || an(c)) return;
        if (cho) cho.classList.remove('wb-vach-an');
        daCoPhan = true; cho = null;
    });
}
(function () {
    function chay() { try { wbDongBoVach(false); } catch (e) { } }
    document.addEventListener('DOMContentLoaded', chay);
    // album trống / phần nghi lễ trống được lõi mẫu ẩn muộn hơn → chạy lại
    window.addEventListener('load', function () { chay(); setTimeout(chay, 800); setTimeout(chay, 1800); });
})();
