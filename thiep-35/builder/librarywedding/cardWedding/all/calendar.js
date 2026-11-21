(function () {

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDates = new Set();
    let selectionMode = 'multiple';

    let calendarColors = {
        textColor: '#F1F3F400',
        textHeader: '#F1F3F400',
        wrapperBg: '#F1F3F400',
        dayBg: '#F1F3F400',
        headerBg: '#F1F3F400',
        selectedBg: '#F1F3F400'
    };

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

    function renderCalendar(colors = calendarColors) {
        calendarColors = colors;

        const body = document.getElementById('calendar-body');
        const wrapper = document.getElementById('calendar-wrapper');
        const header = document.querySelector('.calendar-header');
        const headerItems = document.querySelectorAll('.calendar-header div');

        wrapper.style.backgroundColor = colors.wrapperBg;
        header.style.backgroundColor = colors.headerBg;
        headerItems.forEach(el => el.style.color = colors.textHeader);
        body.innerHTML = '';

        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

        const prevDays = getDaysInMonth(currentYear, currentMonth - 1);
        for (let i = firstDay - 1; i >= 0; i--) {
            let cell = document.createElement('div');
            cell.className = 'calendar-day empty';
            cell.textContent = prevDays - i;
            cell.style.background = colors.dayBg;
            cell.style.color = colors.textColor;
            body.appendChild(cell);
        }

        let today = new Date();

        for (let d = 1; d <= daysInMonth; d++) {
            let cell = document.createElement('div');
            let dateStr = formatDate(currentYear, currentMonth, d);

            cell.className = 'calendar-day';
            cell.textContent = d;
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
            }

            body.appendChild(cell);
        }

        let total = firstDay + daysInMonth;
        // Chỉ thêm đủ để lấp đầy hàng cuối (Thứ 2 → CN), không tạo hàng thừa
        let remain = (7 - (total % 7)) % 7;

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

    // Xóa tất cả ngày đã chọn — hàm này bị thiếu trong phiên bản gốc
    window.clearCalendarDates = function () {
        selectedDates.clear();
        renderCalendar();
    };

    renderCalendar();

})();
