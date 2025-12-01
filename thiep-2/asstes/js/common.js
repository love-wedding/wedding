import PhotoSwipeLightbox from '../../asstes/js/photoswipe-lightbox.esm.min.js';

const initAudio = () => {
    const audio = document.getElementById('bgAudio');
    const button = document.getElementById('audioToggleBtn');
    if (!audio || !button) return;

    audio.volume = 0.3;
    let started = false;

    if (!document.getElementById('guest-popup')) {
        const startAudio = () => {
            if (started) return;
            started = true;

            audio.play().catch(err => {
                console.warn("Autoplay blocked:", err);
            });

            // Remove listeners after first start
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
            document.removeEventListener('touchstart', startAudio);
            document.removeEventListener('scroll', startAudio);
        };
        // Must wait for gesture to start playback
        ['click', 'keydown', 'touchstart'].forEach(ev =>
            document.addEventListener(ev, startAudio)
        );
    }

    button.addEventListener('click', async () => {
        try {
            if (audio.paused) {
                await audio.play();
            } else {
                audio.pause();
            }
        } catch (e) {
            console.warn("Audio playback error:", e);
        }
    });

    audio.addEventListener('play', () => button.classList.add('playing'));
    audio.addEventListener('pause', () => button.classList.remove('playing'));
    audio.addEventListener('ended', () => button.classList.remove('playing'));
};

const initPhotoSwipe = () => {
    const lightbox = new PhotoSwipeLightbox({
        gallery: '#photo-gallery',
        children: 'a',
        pswpModule: () => import('/assets/plugins/photoswipe/dist/photoswipe.esm.min.js')
    });
    lightbox.init();
};

const initPhotoGalleryGrid = () => {
    const gallery = document.querySelector('#photo-gallery');
    if (!gallery) return;

    imagesLoaded(gallery, () => {
        document.querySelectorAll('#photo-gallery a').forEach(link => {
            const img = new Image();
            img.src = link.href;
            img.onload = () => {
                link.dataset.pswpWidth = img.naturalWidth;
                link.dataset.pswpHeight = img.naturalHeight;
            };
        });

        if (gallery.hasAttribute("data-masonry")) {
            new Masonry(gallery, {
                itemSelector: '.photo',
                columnWidth: '.photo',
                percentPosition: true
            });
        }
    });
};

const initCountdown = () => {
    const countdownEl = document.getElementById("countdown");
    if (!countdownEl) return;

    let endDate = new Date("2025-07-20T10:30:00");
    const dateString = countdownEl.getAttribute('data-date');
    const timeString = countdownEl.getAttribute('data-time');

    if (dateString && timeString) {
        const [day, month, year] = dateString.split('-').map(Number);
        const [hours, minutes] = timeString.split(':').map(Number);
        endDate = new Date(year, month - 1, day, hours, minutes);
    }

    const twoDigits = countdownEl.hasAttribute("twodigits");

    const updateCountdown = () => {
        const now = new Date();
        const time = countdown(now, endDate,
            countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS
        );

        const setText = (sel, val) => {
            const el = document.querySelector(sel);
            if (el) el.textContent = twoDigits ? String(val).padStart(2, '0') : val;
        };

        setText('[data-countdown="days"]', time.days);
        setText('[data-countdown="hours"]', time.hours);
        setText('[data-countdown="minutes"]', time.minutes);
        setText('[data-countdown="seconds"]', time.seconds);
    };

    updateCountdown();
    setInterval(updateCountdown, 1000);
};

const renderMiniCalendar = (container) => {

    const dateStr = container.getAttribute("data-date"); // format: DD-MM-YYYY
    if (!dateStr) return;
    const hideCaption = container.getAttribute("hideCaption") || false;
    const todayIcon = container.getAttribute("data-today-icon") || "bi-heart-fill";
    const [day, month, year] = dateStr.split("-").map(Number);
    const highlightDate = new Date(year, month - 1, day);
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();

    let html = "";

    if (hideCaption) {
        html += `<table>
        <tbody>
        <tr>
          <th>MON</th><th>TUE</th><th>WED</th>
          <th>THU</th><th>FRI</th><th>SAT</th><th>SUN</th>
        </tr>`;
    }
    else {
        html += `<table>
        <caption class="calendar-month">Tháng ${month} / ${year}</caption>
        <tbody>
        <tr>
          <th>Thứ 2</th><th>Thứ 3</th><th>Thứ 4</th>
          <th>Thứ 5</th><th>Thứ 6</th><th>Thứ 7</th><th>CN</th>
        </tr>`;
    }

    let currentDay = 1;
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday=0

    while (currentDay <= daysInMonth) {
        html += "<tr>";
        for (let col = 0; col < 7; col++) {
            if ((currentDay === 1 && col < startOffset) || currentDay > daysInMonth) {
                html += "<td>&nbsp;</td>";
            } else {
                const isHighlight = (
                    highlightDate.getFullYear() === year &&
                    highlightDate.getMonth() === month - 1 &&
                    highlightDate.getDate() === currentDay
                );

                if (isHighlight) {
                    html += `<td>
                        <div class="today">
                            <span data-wow-iteration="1000" class="heart wow animate__animated animate__heartBeat">
                                <i class="today-heart bi ${todayIcon} wow animate__animated animate__fadeIn"></i>
                            </span>
                            <span class="day">${currentDay}</span>
                        </div>
                    </td>`;
                } else {
                    html += `<td>${currentDay}</td>`;
                }
                currentDay++;
            }
        }
        html += "</tr>";
    }

    html += "</tbody></table>";
    container.innerHTML = html;
};

const wowObject = new WOW({
    callback: (el) => {
        if (el.classList.contains('today-heart')) {
            const t = document.querySelector('.heart');
            if (t && !t.classList.contains('started')) {
                setTimeout(() => {
                    t.classList.add('started');
                }, 2000);
            }
        }
    }
});

const initGuestPopup = (opening_card) => {
    const popup = document.getElementById("guest-popup");

    if (!popup) {
        return null;
    }
    const inner = document.querySelector(".guest-popup-inner");
    const button = document.querySelector(".guest-open-button");

    // Show popup after load
    if (!opening_card) {
        popup.classList.add("show");
        document.body.classList.add("no-scroll");
    }

    // Close when click outside the inner box
    popup.addEventListener("click", (e) => {
        if (!inner.contains(e.target)) closePopup();
    });

    // Close when click the button
    button.addEventListener("click", closePopup);

    function closePopup() {
        popup.classList.add("closing");
        document.body.classList.remove("no-scroll"); // ✅ restore scroll
        // Remove from DOM after animation ends
        setTimeout(() => {
            popup.style.display = "none";
            document.getElementById('audioToggleBtn').click();
        }, 500); // match fadeOut duration
    }

    return popup;
}

// Init after DOM ready
window.addEventListener('DOMContentLoaded', () => {
    initAudio();
    initCountdown();
    const miniCalendar = document.querySelector('#mini-calendar');
    if (miniCalendar) renderMiniCalendar(miniCalendar);

    initPhotoGalleryGrid();
});

// Full load
window.addEventListener('load', () => {
    const opening_card = document.getElementById("card-opening-sides");
    initPhotoSwipe();
    wowObject.init();

    var guestPopup = initGuestPopup(opening_card);

    if (opening_card) {
        opening_card.classList.add("_animating");
        setTimeout(() => {
            opening_card.remove();
            if (guestPopup) {
                guestPopup.classList.add("show");
                document.body.classList.add("no-scroll");
            }
        }, 4500);
    }
});
