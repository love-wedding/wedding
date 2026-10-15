/**
 * CARD BRIDGE SCRIPT - LOVE WEDDING
 * Hệ thống cầu nối (Bridge) dùng chung cho tất cả các mẫu thiệp (thiep-4, thiep-20, ...).
 * 
 * Tính năng chính:
 * 1. Đồng bộ thời gian thực 2 chiều giữa Studio Editor cha và Iframe thiệp qua window.postMessage.
 * 2. Tự động nhận diện template đang mở (thiep-4, thiep-20, v.v.) qua URL hoặc DOM ID.
 * 3. Hỗ trợ thay thế/tạo mới Lịch Động (Dynamic Calendar Grid) khớp chuẩn thứ - ngày theo lịch cưới.
 * 4. Cho phép click vào ảnh cưới trên giao diện để mở modal căn chỉnh phóng to/thu nhỏ, thay ảnh trực quan.
 * 5. Tự động nối form RSVP / Gửi lời chúc vào Google Sheet Web App (.exec).
 * 
 * CÁCH THÊM THIỆP MỚI:
 * - Bước 1: Thêm `<script src="../card-bridge.js"></script>` trước thẻ đóng `</body>` trong `index.html` của thiệp đó.
 * - Bước 2: Khai báo các ID selector của thiệp đó vào biến `TEMPLATE_REGISTRY` bên dưới.
 */
(function () {
    console.log('[CardBridge] Initialized in card iframe');

    // Báo cho cửa sổ cha biết là bridge đã sẵn sàng
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'CARD_BRIDGE_READY' }, '*');
    }

    // Biến lưu trữ dữ liệu hiện tại
    let currentWeddingData = {
        partyDay: '30',
        partyMonth: '03',
        partyYear: '2025',
        googleSheetExecUrl: ''
    };

    /**
     * BẢNG ĐĂNG KÝ CẤU HÌNH SELECTOR CHO TỪNG MẪU THIỆP (TEMPLATE REGISTRY)
     * Khi cần hỗ trợ thiệp mới (ví dụ thiep-1, thiep-2,...), chỉ cần thêm 1 key mới ở đây.
     */
    const TEMPLATE_REGISTRY = {
        'thiep-4': {
            name: 'Mẫu 04 - Phong Thư Hoàng Gia',
            groomNameShort: ['#w-lfeb0egb .text-block h4', '#w-lfeb0egb h4'],
            groomNameFull: ['#w-6i7xa1kt .text-block h1', '#w-6i7xa1kt h1'],
            brideNameShort: ['#w-wkuu9jg6 .text-block h4', '#w-wkuu9jg6 h4'],
            brideNameFull: ['#w-giudke9b .text-block h1', '#w-giudke9b h1'],
            weddingDateHero: ['#w-19tqxf4g .text-block h3', '#w-19tqxf4g h3'],
            groomParents: ['#w-ig5jcswu .text-block p', '#w-ig5jcswu p'],
            groomParentsCity: ['#w-91jxhp0m .text-block p', '#w-91jxhp0m p'],
            brideParents: ['#w-bv74resi .text-block p', '#w-bv74resi p'],
            brideParentsCity: ['#w-2hyi8ra3 .text-block p', '#w-2hyi8ra3 p'],
            ceremonyTitle: ['#w-32etj2r3 .text-block h2', '#w-32etj2r3 h2'],
            partyTitle: ['#w-6amly90s .text-block p', '#w-6amly90s p'],
            partyTime: ['#w-rvjhix10 .text-block p', '#w-rvjhix10 p'],
            partyDay: ['#w-0m3cmvaa .text-block p', '#w-0m3cmvaa p'],
            partyMonth: ['#w-k8kl83qy .text-block p', '#w-k8kl83qy p'],
            partyYear: ['#w-kbgnz2rp .text-block p', '#w-kbgnz2rp p'],
            partyLunar: ['#w-trta43bz .text-block p', '#w-trta43bz p'],
            venueName: ['#w-pdl931a6 .text-block p', '#w-pdl931a6 p', '#w-8799m2jd .text-block p', '#w-8799m2jd p'],
            venueAddress: ['#w-b8ao84la .text-block p', '#w-b8ao84la p'],
            mapLinks: ['#w-i7ym6cbi', 'a[href*="maps"]'],
            mapIframe: '#w-m1kk35d9 iframe, iframe[src*="google.com/maps"]',
            bankText: ['#w-k0vu3e5e .text-block h4', '#w-k0vu3e5e h4'],
            bankQr: '#w-p8etkpq1 .image-background, #w-p8etkpq1',
            coverPhoto: '#w-4aeii491',
            calendarType: 'custom_grid',
            calendarContainer: '#w-3m9ley3f',
            calendarOldHeart: '#w-q5ac8dqm',
            rsvpForm: '#hl53suyf',
            rsvpInputs: {
                name: '#wi-unj9ai75',
                relation: '#wi-m1wmtbcv',
                wishes: '#wi-9du0r7g4',
                attendance: 'select[name="select_1"]'
            },
            editableImages: [
                '#w-4aeii491', '#w-hs9njuu7', '#w-2z4vbngp', '#w-xd4gq2s2', '#w-p4gatvnw',
                '#w-i9mk0qdo', '#w-6m7phoby', '#w-7m08afme', '#w-gfr8kgrk', '#w-6klqgubq',
                '#w-07ds8l4t', '#w-atvsanei', '#w-6zk6tjag', '#w-qg9pg53z', '#w-3i6z5fev', '#w-sj86rf1m'
            ]
        },
        'thiep-20': {
            name: 'Mẫu 20 - Trắng Voan Thanh Lịch',
            groomNameShort: ['#w-s6hijpma .text-block p', '#w-s6hijpma p', '#w-s6hijpma'],
            groomNameFull: ['#w-k9bo7dm5 .text-block h1', '#w-k9bo7dm5 h1', '#w-k9bo7dm5'],
            brideNameShort: ['#w-akom77q4 .text-block p', '#w-akom77q4 p', '#w-akom77q4'],
            brideNameFull: ['#w-xxwo5xrh .text-block h1', '#w-xxwo5xrh h1', '#w-xxwo5xrh'],
            weddingDateHero: ['#lt-opening-date'],
            groomFamilyTitle: ['#w-k79j6b43 .text-block p', '#w-k79j6b43 p', '#w-k79j6b43'],
            groomParents: ['#w-lcrdnebu .text-block p', '#w-lcrdnebu p', '#w-lcrdnebu'],
            brideFamilyTitle: ['#w-behog2cs .text-block p', '#w-behog2cs p', '#w-behog2cs'],
            brideParents: ['#w-cyvgdyfd .text-block p', '#w-cyvgdyfd p', '#w-cyvgdyfd'],
            ceremonyTitle: ['#w-pc5kb9m8 .text-block p', '#w-pc5kb9m8 p', '#w-pc5kb9m8', '#w-uddbd1gp'],
            ceremonyTime: ['#w-b6jlvm4e .text-block p', '#w-b6jlvm4e p', '#w-b6jlvm4e'],
            ceremonyDayOfWeek: ['#w-kkx9mo7x .text-block p', '#w-kkx9mo7x p', '#w-kkx9mo7x'],
            ceremonyDate: ['#w-b0waho0s .text-block p', '#w-b0waho0s p', '#w-b0waho0s'],
            ceremonyLunar: ['#w-fpliygu8 .text-block p', '#w-fpliygu8 p', '#w-fpliygu8'],
            ceremonyVenue: ['#w-gm2mzdpu .text-block p', '#w-gm2mzdpu p', '#w-gm2mzdpu'],
            partyTitle: ['#w-ns2uo8pn .text-block p', '#w-ns2uo8pn p', '#w-ns2uo8pn'],
            partyTime: ['#w-kbq246re .text-block p', '#w-kbq246re p', '#w-kbq246re'],
            partyDateCombined: ['#w-6aggsnkk .text-block p', '#w-6aggsnkk p', '#w-6aggsnkk'],
            partyLunar: ['#w-88qs6zxz .text-block p', '#w-88qs6zxz p', '#w-88qs6zxz'],
            venueName: ['#w-o6d2ydjc .text-block p', '#w-o6d2ydjc p', '#w-o6d2ydjc'],
            venueAddress: ['#w-5isml8v2 .text-block p', '#w-5isml8v2 p', '#w-5isml8v2'],
            mapLinks: ['#w-j3el75fm', 'a[href*="maps"]', 'a[href*="goo.gl"]'],
            mapIframe: '#w-xo6pgmit iframe, iframe[src*="google.com/maps"]',
            bankText: ['#w-3czbcjos .text-block h4', '#w-3czbcjos h4', '#w-3czbcjos'],
            bankQr: '#w-100f8xsm .image-background, #w-100f8xsm',
            coverPhoto: '#w-6mmsm2b5',
            calendarType: 'wc_target',
            calendarTitle: '#wc-cal-title',
            calendarTarget: '#wc-cal-target',
            rsvpForm: '#qm643fs2',
            rsvpInputs: {
                name: '#wi-3qro6g59',
                relation: '#wi-qrqc6qty',
                wishes: '#wi-urmw44f2',
                attendance: 'select[name="select_1"]'
            },
            editableImages: [
                '#w-6mmsm2b5', '#w-wsmhzrfe', '#w-ix5a63f6', '#w-7et62aik',
                '#w-04gqaks8', '#w-ufqelzat', '#w-a2ztgd1i', '#w-zgwcijs5', '#w-1fhs4mal'
            ]
        }
    };

    /**
     * Tự động nhận diện ID mẫu thiệp hiện tại
     */
    function detectCurrentTemplateId() {
        const path = window.location.pathname.toLowerCase();
        for (const tid of Object.keys(TEMPLATE_REGISTRY)) {
            if (path.includes(tid)) return tid;
        }

        // Kiểm tra dựa trên đặc điểm DOM duy nhất
        if (document.getElementById('qm643fs2') || document.getElementById('w-s6hijpma')) return 'thiep-20';
        if (document.getElementById('hl53suyf') || document.getElementById('w-lfeb0egb')) return 'thiep-4';

        // Mặc định fallback về thiep-4 nếu không nhận diện được
        return 'thiep-4';
    }

    const currentTemplateId = detectCurrentTemplateId();
    const currentConfig = TEMPLATE_REGISTRY[currentTemplateId] || TEMPLATE_REGISTRY['thiep-4'];
    console.log(`[CardBridge] Active template detected: ${currentTemplateId} (${currentConfig.name})`);

    // Danh sách tất cả các selector ảnh có thể chỉnh sửa gộp chung
    const ALL_EDITABLE_IMAGE_SELECTORS = Array.from(new Set([
        ...(TEMPLATE_REGISTRY['thiep-4'].editableImages || []),
        ...(TEMPLATE_REGISTRY['thiep-20'].editableImages || [])
    ]));

    // Chèn CSS cho Dynamic Calendar và Interactive Image Edit
    function injectBridgeStyles() {
        if (document.getElementById('cardBridgeStyles')) return;
        const style = document.createElement('style');
        style.id = 'cardBridgeStyles';
        style.textContent = `
            /* Interactive Image Hover in Customizer (Bảo toàn tuyệt đối position: absolute của Webcake) */
            .bridge-editable-image {
                cursor: pointer !important;
                transition: outline 0.2s ease, filter 0.2s ease;
            }
            .bridge-editable-image:hover {
                outline: 3px dashed #d4af37 !important;
                outline-offset: -3px;
                filter: brightness(1.08);
                box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
            }

            /* Dynamic Wedding Calendar Grid cho các mẫu không có sẵn JS lịch */
            .dynamic-calendar-wrap {
                width: 100%;
                height: 100%;
                background: #fff;
                padding: 18px 16px;
                border: 1.5px solid #a82020;
                border-radius: 8px;
                box-sizing: border-box;
                font-family: 'Times New Roman', Times, serif;
                color: #222;
                display: flex;
                flex-direction: column;
                justify-content: center;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            }
            .calendar-weekdays-row {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                text-align: center;
                font-weight: 800;
                font-size: 14px;
                color: #111;
                border-bottom: 1.5px solid #a82020;
                padding-bottom: 8px;
                margin-bottom: 8px;
            }
            .calendar-days-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                grid-gap: 6px 2px;
                text-align: center;
            }
            .calendar-day-cell {
                height: 38px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 15px;
                font-weight: 600;
                color: #333;
                position: relative;
            }
            .calendar-day-cell.empty {
                pointer-events: none;
            }
            /* Trái tim bao quanh ngày cưới */
            .calendar-day-cell.wedding-day-heart {
                color: #a82020;
                font-weight: 900;
                font-size: 17px;
            }
            .calendar-day-cell.wedding-day-heart::before {
                content: "";
                position: absolute;
                width: 38px;
                height: 36px;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a82020' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'%3E%3C/path%3E%3C/svg%3E");
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                animation: heartPulse 1.8s infinite ease-in-out;
                z-index: 0;
            }
            .calendar-day-cell.wedding-day-heart span {
                position: relative;
                z-index: 1;
            }
            @keyframes heartPulse {
                0%, 100% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.18); }
            }

            /* Ẩn thanh cuộn của thiệp */
            html,
            body {
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
            }

            html::-webkit-scrollbar,
            body::-webkit-scrollbar,
            *::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Thiết lập tính năng click vào ảnh để mở popup chỉnh sửa trên Editor
    function setupEditableImages() {
        const selectorsToBind = currentConfig.editableImages || ALL_EDITABLE_IMAGE_SELECTORS;
        selectorsToBind.forEach(sel => {
            const el = document.querySelector(sel);
            if (!el || el.dataset.bridgeImageBound) return;
            el.dataset.bridgeImageBound = 'true';

            el.classList.add('bridge-editable-image');
            el.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();

                // Lấy ảnh hiện tại từ background-image hoặc img src
                let currentBg = '';
                const imgEl = el.querySelector('img');
                if (imgEl && imgEl.src) {
                    currentBg = imgEl.src;
                } else {
                    const bgEl = el.querySelector('.image-background') || el;
                    if (bgEl) {
                        const bgStyle = window.getComputedStyle(bgEl).backgroundImage;
                        if (bgStyle && bgStyle !== 'none') {
                            const match = bgStyle.match(/url\(['"]?(.*?)['"]?\)/);
                            if (match) currentBg = match[1];
                        }
                    }
                }

                // Gửi yêu cầu sửa ảnh sang Studio Editor cha
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                        type: 'REQUEST_IMAGE_EDIT',
                        payload: {
                            selector: sel,
                            currentImage: currentBg,
                            currentScale: el.dataset.scale || '100',
                            currentPosX: el.dataset.posX || '50',
                            currentPosY: el.dataset.posY || '50'
                        }
                    }, '*');
                }
            });
        });
    }

    // Render bảng Lịch Thông Minh dựa theo ngày/tháng/năm
    function renderDynamicCalendar(dayStr, monthStr, yearStr) {
        const day = parseInt(dayStr, 10) || 30;
        const month = parseInt(monthStr, 10) || 3;
        const year = parseInt(yearStr, 10) || 2025;

        // 1. Nếu là thiệp có sẵn cấu trúc calendar webcake (như thiep-20 với #wc-cal-target)
        const wcTarget = document.getElementById('wc-cal-target');
        const wcTitle = document.getElementById('wc-cal-title');
        if (wcTarget) {
            if (wcTitle) {
                wcTitle.textContent = `Tháng ${month} - ${year}`;
            }
            const gridEl = wcTarget.querySelector('[data-cal-grid]');
            const dowEl = wcTarget.querySelector('[data-cal-dow]');
            if (gridEl) {
                const firstDayObj = new Date(year, month - 1, 1);
                const firstDayOfWeek = firstDayObj.getDay();
                const startOffset = (firstDayOfWeek + 6) % 7; // Thứ 2 = 0
                const daysInMonth = new Date(year, month, 0).getDate();

                gridEl.innerHTML = '';
                // Ô trống đầu tháng
                for (let i = 0; i < startOffset; i++) {
                    const empty = document.createElement('div');
                    empty.className = 'wc-cal-day wc-cal-empty';
                    gridEl.appendChild(empty);
                }
                // Các ngày trong tháng
                for (let d = 1; d <= daysInMonth; d++) {
                    const cell = document.createElement('div');
                    cell.className = 'wc-cal-day';
                    const col = (startOffset + d - 1) % 7;
                    if (col === 6) cell.classList.add('wc-cal-day--sun');

                    const span = document.createElement('span');
                    span.className = 'wc-cal-day-span';
                    span.textContent = d;
                    cell.appendChild(span);

                    if (d === day) {
                        cell.classList.add('wc-cal-day--selected');
                        const img = document.createElement('img');
                        img.src = 'https://content.pancake.vn/1/59/9d/0d/23/829a2a25903e5b03a029f62911ad0300b2c875df84e143b3258f9633-w:3600-h:3600-l:165926-t:image/png.png';
                        img.className = 'wc-cal-heart';
                        cell.appendChild(img);
                    }
                    gridEl.appendChild(cell);
                }
                return;
            }
        }

        // 2. Mẫu thiep-4 hoặc mẫu khác sử dụng container lịch động
        const calendarContainer = document.getElementById('w-3m9ley3f');
        if (!calendarContainer) return;

        // Ẩn ảnh nền gốc của block 3m9ley3f
        const oldBg = calendarContainer.querySelector('.image-background');
        if (oldBg) oldBg.style.display = 'none';

        // Ẩn khối trái tim cũ q5ac8dqm
        const oldHeart = document.getElementById('w-q5ac8dqm');
        if (oldHeart) oldHeart.style.display = 'none';

        const firstDayObj = new Date(year, month - 1, 1);
        const firstDayOfWeek = firstDayObj.getDay();
        const startOffset = (firstDayOfWeek + 6) % 7;
        const daysInMonth = new Date(year, month, 0).getDate();

        let daysHtml = '';
        for (let i = 0; i < startOffset; i++) {
            daysHtml += `<div class="calendar-day-cell empty"></div>`;
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const isWeddingDay = (d === day);
            const heartClass = isWeddingDay ? 'wedding-day-heart' : '';
            daysHtml += `
                <div class="calendar-day-cell ${heartClass}">
                    <span>${d}</span>
                </div>
            `;
        }

        let dynamicCalendarEl = document.getElementById('bridgeDynamicCalendar');
        if (!dynamicCalendarEl) {
            dynamicCalendarEl = document.createElement('div');
            dynamicCalendarEl.id = 'bridgeDynamicCalendar';
            dynamicCalendarEl.className = 'dynamic-calendar-wrap';
            calendarContainer.appendChild(dynamicCalendarEl);
        }

        dynamicCalendarEl.innerHTML = `
            <div class="calendar-weekdays-row">
                <span>T2</span>
                <span>T3</span>
                <span>T4</span>
                <span>T5</span>
                <span>T6</span>
                <span>T7</span>
                <span>CN</span>
            </div>
            <div class="calendar-days-grid">
                ${daysHtml}
            </div>
        `;
    }

    // Tích hợp gửi form RSVP về Google Sheet
    function setupGoogleSheetRSVP(execUrl) {
        if (execUrl) currentWeddingData.googleSheetExecUrl = execUrl;

        // Tìm form của thiep-4 (#hl53suyf), thiep-20 (#qm643fs2), hoặc form bất kỳ
        const rsvpForm = document.getElementById('hl53suyf') ||
            document.getElementById('qm643fs2') ||
            document.querySelector(currentConfig.rsvpForm || 'form');
        if (!rsvpForm || rsvpForm.dataset.boundGoogleSheet) return;

        rsvpForm.dataset.boundGoogleSheet = 'true';
        rsvpForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Tìm input theo selector của thiep-4, thiep-20 hoặc generic
            const nameInput = document.getElementById('wi-unj9ai75') ||
                document.getElementById('wi-3qro6g59') ||
                rsvpForm.querySelector('input[name*="name"], input[placeholder*="tên"], input[placeholder*="Quý Khách"]');

            const relationInput = document.getElementById('wi-m1wmtbcv') ||
                document.getElementById('wi-qrqc6qty') ||
                rsvpForm.querySelector('input[name*="text_input_1"], input[placeholder*="gì của"]');

            const wishInput = document.getElementById('wi-9du0r7g4') ||
                document.getElementById('wi-urmw44f2') ||
                rsvpForm.querySelector('input[name*="text_input_2"], textarea, input[placeholder*="lời chúc"]');

            const attendanceSelect = rsvpForm.querySelector('select[name="select_1"]') ||
                rsvpForm.querySelector('select');

            const payload = {
                fullName: nameInput ? nameInput.value : '',
                relation: relationInput ? relationInput.value : '',
                wishes: wishInput ? wishInput.value : '',
                attendance: attendanceSelect ? attendanceSelect.value : '',
                timestamp: new Date().toLocaleString('vi-VN')
            };

            const targetUrl = currentWeddingData.googleSheetExecUrl;
            if (!targetUrl || targetUrl.trim() === '') {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Đã gửi lời chúc!',
                        text: 'Cảm ơn bạn đã gửi lời chúc tốt đẹp tới Cô dâu & Chú rể!',
                        confirmButtonColor: '#d4af37'
                    });
                } else {
                    alert('Cảm ơn bạn đã gửi lời chúc tốt đẹp tới Cô dâu & Chú rể!');
                }
                rsvpForm.reset();
                return;
            }

            // Gửi qua Google Apps Script Web App
            const formData = new FormData();
            formData.append('Họ tên', payload.fullName);
            formData.append('Mối quan hệ', payload.relation);
            formData.append('Lời chúc', payload.wishes);
            formData.append('Tham dự', payload.attendance);
            formData.append('Thời gian', payload.timestamp);

            fetch(targetUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            }).then(() => {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Gửi thành công!',
                        text: 'Lời chúc và phản hồi của bạn đã được ghi nhận vào sổ mừng cưới!',
                        confirmButtonColor: '#d4af37'
                    });
                } else {
                    alert('Lời chúc của bạn đã được gửi thành công!');
                }
                rsvpForm.reset();
            }).catch(err => {
                console.warn('Google Sheet submit error:', err);
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Đã ghi nhận lời chúc!',
                        text: 'Cảm ơn bạn rất nhiều!',
                        confirmButtonColor: '#d4af37'
                    });
                } else {
                    alert('Lời chúc của bạn đã được ghi nhận!');
                }
            });
        });
    }

    /**
     * Cập nhật text sạch sẽ, xoá bỏ hoàn toàn text cũ, bảo toàn định dạng Webcake
     */
    function setTextPreserve(el, newText) {
        if (!el || newText === undefined || newText === null) return;
        const tag = el.tagName ? el.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea') {
            el.value = newText;
            return;
        }

        if (typeof newText === 'string' && newText.includes('\n')) {
            const ws = (el instanceof Element) ? window.getComputedStyle(el).whiteSpace : 'normal';
            if (ws === 'normal') el.style.whiteSpace = 'pre-line';
        }

        // Tìm đối tượng chứa text chính (.text-block-css hoặc chính nó)
        const textTarget = el.querySelector('.text-block-css') || el;

        // Nếu chuỗi chứa html hoặc br
        if (typeof newText === 'string' && (newText.includes('<br') || newText.includes('\n'))) {
            textTarget.innerHTML = newText.replace(/\n/g, '<br>');
            return;
        }

        // Thay thế toàn bộ nội dung text để triệt để loại bỏ text cũ
        textTarget.textContent = newText;
    }

    // Helper cập nhật text theo selector
    function updateElementText(selectors, text, asHtml = false) {
        if (!selectors || text === undefined || text === null) return;
        const selectorList = Array.isArray(selectors) ? selectors : [selectors];
        selectorList.forEach(sel => {
            const els = document.querySelectorAll(sel);
            els.forEach(el => {
                if (asHtml) {
                    const textTarget = el.querySelector('.text-block-css') || el;
                    textTarget.innerHTML = text;
                } else {
                    setTextPreserve(el, text);
                }
            });
        });
    }

    // Helper cập nhật ảnh & căn chỉnh zoom/position
    function updateElementImageAdvanced(selector, imageUrl, scale = 100, posX = 50, posY = 50) {
        if (!selector) return;
        const els = document.querySelectorAll(selector);
        els.forEach(el => {
            el.dataset.scale = scale;
            el.dataset.posX = posX;
            el.dataset.posY = posY;

            // Xử lý nếu el có thẻ img con
            const imgEl = el.querySelector('img');
            if (imgEl && imageUrl) {
                imgEl.src = imageUrl;
                imgEl.style.objectFit = 'cover';
                imgEl.style.objectPosition = `${posX}% ${posY}%`;
                imgEl.style.transform = `scale(${scale / 100})`;
            }

            // Xử lý nền background-image chuẩn Webcake
            const bgEl = el.querySelector('.image-background') || el;
            if (bgEl) {
                if (imageUrl) {
                    bgEl.style.backgroundImage = `url("${imageUrl}")`;
                }
                bgEl.style.backgroundRepeat = 'no-repeat';
                bgEl.style.backgroundPosition = `${posX}% ${posY}%`;
                bgEl.style.backgroundSize = `${scale}%`;
            }
        });
    }

    // Áp dụng dữ liệu cưới
    function applyWeddingData(data) {
        if (!data) return;
        currentWeddingData = Object.assign(currentWeddingData, data);
        const cfg = currentConfig;

        // Nếu có màn hình intro trong thiep-20 và đang mở trong Studio Editor:
        if (window.parent && window.parent !== window) {
            const openingScreen = document.getElementById('lt-opening-screen');
            if (openingScreen) {
                openingScreen.style.display = 'none';
                openingScreen.remove();
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
                document.body.style.touchAction = '';
            }
        }

        // 1. Chú rể
        if (data.groomNameShort && cfg.groomNameShort) updateElementText(cfg.groomNameShort, data.groomNameShort);
        if (data.groomNameFull && cfg.groomNameFull) updateElementText(cfg.groomNameFull, data.groomNameFull);

        // 2. Cô dâu
        if (data.brideNameShort && cfg.brideNameShort) updateElementText(cfg.brideNameShort, data.brideNameShort);
        if (data.brideNameFull && cfg.brideNameFull) updateElementText(cfg.brideNameFull, data.brideNameFull);

        // 3. Bìa thiệp ngày / Intro Screen
        if (cfg.weddingDateHero) {
            const combinedDate = `${data.partyDay}.${data.partyMonth}.${data.partyYear}`;
            window.LT_WEDDING_DATE = combinedDate;
            if (currentTemplateId === 'thiep-20') {
                updateElementText(cfg.weddingDateHero, combinedDate);
            } else if (data.weddingDateHero) {
                updateElementText(cfg.weddingDateHero, data.weddingDateHero, true);
            }
        }

        // 4. Gia đình 2 bên
        if (data.groomParents && cfg.groomParents) {
            updateElementText(cfg.groomParents, data.groomParents.replace(/\n/g, '<br>'), true);
        }
        if (data.groomParentsCity && cfg.groomParentsCity) {
            updateElementText(cfg.groomParentsCity, data.groomParentsCity);
        }
        if (data.brideParents && cfg.brideParents) {
            updateElementText(cfg.brideParents, data.brideParents.replace(/\n/g, '<br>'), true);
        }
        if (data.brideParentsCity && cfg.brideParentsCity) {
            updateElementText(cfg.brideParentsCity, data.brideParentsCity);
        }

        // 5. Tiêu đề nghi thức & tiệc
        if (data.ceremonyTitle && cfg.ceremonyTitle) {
            updateElementText(cfg.ceremonyTitle, data.ceremonyTitle);
        }
        if (data.partyTitle && cfg.partyTitle) {
            if (currentTemplateId === 'thiep-20') {
                updateElementText(cfg.partyTitle, data.partyTitle);
            } else {
                updateElementText(cfg.partyTitle, `<span style="font-weight: bold;">${data.partyTitle}</span>`, true);
            }
        }

        // 6. Thời gian tiệc cưới & Lễ cưới
        if (currentTemplateId === 'thiep-20') {
            // Mẫu 20 có cả Lễ thành hôn và Tiệc mừng riêng
            if (cfg.ceremonyTime) updateElementText(cfg.ceremonyTime, data.partyTime || '10 Giờ 00');
            if (cfg.ceremonyDate) updateElementText(cfg.ceremonyDate, `${data.partyDay}.${data.partyMonth}.${data.partyYear}`);
            if (cfg.ceremonyLunar && data.partyLunar) updateElementText(cfg.ceremonyLunar, `(Tức ${data.partyLunar})`);

            if (cfg.partyTime) updateElementText(cfg.partyTime, `VÀO LÚC ${data.partyTime || '11:00'}`);
            if (cfg.partyDateCombined) updateElementText(cfg.partyDateCombined, `${data.partyDay} | ${data.partyMonth} | ${data.partyYear}`);
            if (cfg.partyLunar && data.partyLunar) updateElementText(cfg.partyLunar, `(Tức ${data.partyLunar})`);
        } else {
            // Mẫu 4
            if (data.partyTime && cfg.partyTime) updateElementText(cfg.partyTime, data.partyTime);
            if (data.partyDay && cfg.partyDay) updateElementText(cfg.partyDay, data.partyDay);
            if (data.partyMonth && cfg.partyMonth) updateElementText(cfg.partyMonth, `<span style="font-weight: bold;">Tháng ${data.partyMonth}</span>`, true);
            if (data.partyYear && cfg.partyYear) updateElementText(cfg.partyYear, data.partyYear);
            if (data.partyLunar && cfg.partyLunar) updateElementText(cfg.partyLunar, `(Tức ${data.partyLunar})`);
        }

        // 7. Render Lịch Thông Minh
        renderDynamicCalendar(data.partyDay, data.partyMonth, data.partyYear);

        // 8. Địa điểm & Bản đồ Google Maps
        if (data.venueName && cfg.venueName) {
            if (currentTemplateId === 'thiep-20') {
                updateElementText(cfg.venueName, `TẠI ${data.venueName.toUpperCase()}`);
            } else {
                updateElementText(cfg.venueName, data.venueName);
            }
        }
        if (data.venueAddress && cfg.venueAddress) {
            updateElementText(cfg.venueAddress, data.venueAddress.replace(/\n/g, '<br>'), true);
        }

        // Nút mở Google Maps app
        if (data.mapUrl && cfg.mapLinks) {
            const selectorList = Array.isArray(cfg.mapLinks) ? cfg.mapLinks : [cfg.mapLinks];
            selectorList.forEach(sel => {
                const mapBtns = document.querySelectorAll(sel);
                mapBtns.forEach(btn => {
                    btn.setAttribute('href', data.mapUrl);
                    btn.setAttribute('target', '_blank');
                });
            });
        }

        // Iframe Google Maps nhúng
        if (data.mapEmbedUrl && cfg.mapIframe) {
            let embedSrc = data.mapEmbedUrl.trim();
            const srcMatch = embedSrc.match(/src=["'](.*?)["']/);
            if (srcMatch) embedSrc = srcMatch[1];

            const iframes = document.querySelectorAll(cfg.mapIframe);
            iframes.forEach(iframe => {
                iframe.src = embedSrc;
            });
        }

        // 9. Tài khoản ngân hàng & QR
        if (data.bankInfoText && cfg.bankText) {
            updateElementText(cfg.bankText, data.bankInfoText.replace(/\n/g, '<br>'), true);
        }
        if (data.bankQrImage && cfg.bankQr) {
            const qrBg = document.querySelector(cfg.bankQr);
            if (qrBg) {
                qrBg.style.backgroundImage = `url("${data.bankQrImage}")`;
                qrBg.style.backgroundSize = 'contain';
                qrBg.style.backgroundPosition = 'center';
                qrBg.style.backgroundRepeat = 'no-repeat';
            }
        }

        // 10. Ảnh bìa
        if (data.coverPhoto && cfg.coverPhoto) {
            updateElementImageAdvanced(cfg.coverPhoto, data.coverPhoto);
        }

        // 11. Google Sheet RSVP
        if (data.googleSheetExecUrl) {
            setupGoogleSheetRSVP(data.googleSheetExecUrl);
        }

        console.log(`[CardBridge] Applied wedding data to ${currentTemplateId} successfully`);
    }

    function dismissIntroScreenInEditor() {
        if (window.parent && window.parent !== window) {
            const openingScreen = document.getElementById('lt-opening-screen');
            if (openingScreen) {
                openingScreen.style.display = 'none';
                openingScreen.remove();
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
                document.body.style.touchAction = '';
            }
        }
    }

    // Khởi tạo
    document.addEventListener('DOMContentLoaded', () => {
        dismissIntroScreenInEditor();
        injectBridgeStyles();
        setupEditableImages();
        setupGoogleSheetRSVP('');
    });

    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        dismissIntroScreenInEditor();
        injectBridgeStyles();
        setupEditableImages();
        setupGoogleSheetRSVP('');
    }

    // Lắng nghe postMessage
    window.addEventListener('message', function (event) {
        if (!event.data || typeof event.data !== 'object') return;

        if (event.data.type === 'UPDATE_WEDDING_DATA') {
            applyWeddingData(event.data.payload);
        } else if (event.data.type === 'APPLY_IMAGE_ADJUSTMENT') {
            const { selector, imageUrl, scale, posX, posY } = event.data.payload;
            updateElementImageAdvanced(selector, imageUrl, scale, posX, posY);
        }
    });

    // Nhận dữ liệu từ URL params nếu có
    const urlParams = new URLSearchParams(window.location.search);
    const encodedPayload = urlParams.get('data');
    if (encodedPayload) {
        try {
            const parsedData = JSON.parse(decodeURIComponent(encodedPayload));
            applyWeddingData(parsedData);
        } catch (e) {
            console.warn('[CardBridge] Could not parse URL data parameter', e);
        }
    }
})();
