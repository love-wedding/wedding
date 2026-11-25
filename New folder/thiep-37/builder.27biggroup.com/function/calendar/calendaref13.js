(function () {

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDates = new Set();
    let selectionMode = 'multiple';

    // LƯU MÀU GLOBAL (QUAN TRỌNG)
    let calendarColors = {
        textColor: '#F1F3F400',
        textHeader: '#F1F3F400',
        wrapperBg: '#F1F3F400',
        dayBg: '#F1F3F400',
        headerBg: '#F1F3F400',
        selectedBg: '#F1F3F400'
    };

    // Icon cho từng ngày được chọn: key = dateStr, value = { svg, color }
    let selectedIcons = {};

    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstDayOfMonth(year, month) {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    }

    function formatDate(y, m, d) {
        return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }

    // ===== MAIN RENDER =====
    function renderCalendar(colors = calendarColors) {

        // SAVE COLORS
        calendarColors = colors;

        const body = document.getElementById('calendar-body');
        const wrapper = document.getElementById('calendar-wrapper');
        const header = document.querySelector('.calendar-header');
        const headerItems = document.querySelectorAll('.calendar-header div');

        // APPLY COLOR
        wrapper.style.backgroundColor = colors.wrapperBg;
        header.style.backgroundColor = colors.headerBg;
        headerItems.forEach(el => el.style.color = colors.textHeader);
        body.innerHTML = '';

        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

        // ==== PREVIOUS ====
        const prevDays = getDaysInMonth(currentYear, currentMonth - 1);
        for (let i = firstDay - 1; i >= 0; i--) {
            let cell = document.createElement('div');
            cell.className = 'calendar-day empty';
            cell.textContent = prevDays - i;
            cell.style.background = colors.dayBg;
            cell.style.color = colors.textColor;
            body.appendChild(cell);
        }

        // ==== CURRENT ====
        let today = new Date();

        for (let d = 1; d <= daysInMonth; d++) {
            let cell = document.createElement('div');
            let dateStr = formatDate(currentYear, currentMonth, d);

            cell.className = 'calendar-day';
            cell.style.background = colors.dayBg;
            cell.style.color = colors.textColor;

            if (
                d === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear()
            ) {
                cell.classList.add('today');
            }

            if (selectedDates.has(dateStr)) {
                cell.classList.add('selected');
                cell.style.background = colors.selectedBg;

                const ico = selectedIcons[dateStr];
                if (ico && ico.svg) {
                    // Icon trải full ô — số ngày nổi chính giữa
                    cell.style.position = 'relative';
                    cell.style.display = 'flex';
                    cell.style.alignItems = 'center';
                    cell.style.justifyContent = 'center';

                    const icoEl = document.createElement('span');
                    icoEl.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${ico.color || '#fff'};pointer-events:none;`;
                    icoEl.innerHTML = ico.svg;
                    const svgEl = icoEl.querySelector('svg');
                    if (svgEl) svgEl.style.cssText = 'width:1.5em;height:1.5em;display:block;';

                    const numEl = document.createElement('span');
                    numEl.textContent = d;
                    numEl.style.cssText = 'position:relative;z-index:1;font-size:0.5em;line-height:1;';

                    cell.appendChild(icoEl);
                    cell.appendChild(numEl);
                } else {
                    cell.textContent = d;
                }
            } else {
                cell.textContent = d;
            }

            body.appendChild(cell);
        }

        // ==== NEXT ====
        let total = firstDay + daysInMonth;
        let remain = 35 - total;
        if (remain < 0) remain += 7;

        for (let i = 1; i <= remain; i++) {
            let cell = document.createElement('div');
            cell.className = 'calendar-day empty';
            cell.textContent = i;
            cell.style.background = colors.dayBg;
            cell.style.color = colors.textColor;
            body.appendChild(cell);
        }
    }

    // ===== API =====
    window.setCalendarDate = function (y, m, d, mode) {
        currentYear = y;
        currentMonth = m - 1;
        if (mode) selectionMode = mode;

        if (d) {
            let dateStr = formatDate(y, currentMonth, d);
            selectedDates.add(dateStr);
        }

        renderCalendar();
    };

    window.setCalendarColors = function (colors) {
        renderCalendar({ ...calendarColors, ...colors });
    };

    window.clearCalendarDates = function () {
        selectedDates.clear();
        renderCalendar();
    };

    // Đặt icon cho một ngày cụ thể (dateStr dạng "2026-06-17")
    window.setCalendarDateIcon = function (dateStr, svg, color) {
        if (svg) {
            selectedIcons[dateStr] = { svg, color: color || '#ffffff' };
        } else {
            delete selectedIcons[dateStr];
        }
        renderCalendar();
    };

    // Xoá toàn bộ icon
    window.clearCalendarIcons = function () {
        selectedIcons = {};
        renderCalendar();
    };

    // Nhãn thứ trong tuần (7 phần tử, đúng thứ tự .calendar-header div: T2..CN mặc định)
    // — đổi được qua editor (ấn giữ 2s vào .edit_Calendar), vd sang Mon/Tue/Wed cho khách nước ngoài.
    window.setCalendarHeaderLabels = function (labels) {
        if (!labels || !labels.length) return;
        const headerItems = document.querySelectorAll('.calendar-header div');
        headerItems.forEach((el, i) => {
            if (labels[i] != null && labels[i] !== '') el.textContent = labels[i];
        });
    };

    window.getCalendarHeaderLabels = function () {
        return Array.from(document.querySelectorAll('.calendar-header div')).map(el => el.textContent);
    };

    // ===== INIT =====
    renderCalendar();

})();
