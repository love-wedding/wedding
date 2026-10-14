/**
 * LOVE WEDDING - LUXURY WEDDING SHOWCASE
 * Features:
 * - Dynamic data fetch & filter from data.json
 * - Category tabs & Sub-tags filter (All, Best Seller, New)
 * - Real-time keyword search with instant clear
 * - Video lightbox modal (MP4 & YouTube support)
 * - URL parameter guest name personalization
 * - Romantic canvas falling petals effect (with toggle)
 * - Navbar sticky & back-to-top scroll logic
 */

// Global State
const state = {
    data: {
        weddingCards: [],
        invitationCards: [],
        weddingVideos: [],
        birthdayCards: []
    },
    activeCategory: 'weddingCards',
    activeTag: 'all',
    searchQuery: '',
    guestName: '',
    petalsEnabled: true
};

const ZALO_PHONE = '0326677811';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    checkGuestUrlParam();
    initPetalsCanvas();
    fetchCatalogData();
    setupEventListeners();
    setupScrollEffects();
});

/* ==========================================================================
   1. GUEST NAME URL PARAMETER PERSONALIZATION
   ========================================================================== */
function checkGuestUrlParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const guestParam = urlParams.get('u') || 
                       urlParams.get('to') || 
                       urlParams.get('name') || 
                       urlParams.get('guest') ||
                       urlParams.get('khach');

    if (guestParam && guestParam.trim() !== '') {
        state.guestName = guestParam.trim();
        const greetingBar = document.getElementById('guestGreetingBar');
        const guestNameEl = document.getElementById('guestGreetingName');
        
        if (greetingBar && guestNameEl) {
            guestNameEl.textContent = state.guestName;
            greetingBar.classList.add('show');
        }
    }
}

/**
 * Append guest name to demo URL if available
 */
function getPersonalizedUrl(originalUrl) {
    if (!originalUrl || !state.guestName) return originalUrl;
    try {
        const url = new URL(originalUrl, window.location.origin);
        url.searchParams.set('u', state.guestName);
        return url.toString();
    } catch (e) {
        // Fallback for relative or static URLs
        const separator = originalUrl.includes('?') ? '&' : '?';
        return `${originalUrl}${separator}u=${encodeURIComponent(state.guestName)}`;
    }
}

/* ==========================================================================
   2. DATA FETCH & STATE MANAGEMENT
   ========================================================================== */
async function fetchCatalogData() {
    try {
        const res = await fetch('./data.json');
        if (!res.ok) throw new Error('Không thể tải file data.json');
        const json = await res.json();

        state.data.weddingCards = json.weddingCards || [];
        state.data.invitationCards = json.invitationCards || [];
        state.data.weddingVideos = json.weddingVideos || [];
        state.data.birthdayCards = json.birthdayCards || [];

        updateTabCounters();
        renderCatalog();
    } catch (err) {
        console.error('Lỗi nạp dữ liệu:', err);
        const container = document.getElementById('catalogCardsGrid');
        if (container) {
            container.innerHTML = `
                <div class="catalog-empty-box">
                    <div class="empty-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <h3 class="empty-title">Không thể tải dữ liệu mẫu thiệp</h3>
                    <p class="empty-desc">Vui lòng kiểm tra lại kết nối hoặc file data.json.</p>
                </div>
            `;
        }
    }
}

function updateTabCounters() {
    const counts = {
        weddingCards: state.data.weddingCards.length,
        invitationCards: state.data.invitationCards.length,
        weddingVideos: state.data.weddingVideos.length,
        birthdayCards: state.data.birthdayCards.length
    };

    document.querySelectorAll('.tab-btn').forEach(btn => {
        const tab = btn.dataset.tab;
        const countBadge = btn.querySelector('.tab-count');
        if (countBadge && counts[tab] !== undefined) {
            countBadge.textContent = counts[tab];
        }
    });
}

/* ==========================================================================
   3. CATALOG RENDERING & FILTERING
   ========================================================================== */
function renderCatalog() {
    const grid = document.getElementById('catalogCardsGrid');
    const resultsSummary = document.getElementById('resultsSummary');
    if (!grid) return;

    const currentList = state.data[state.activeCategory] || [];
    const isVideo = state.activeCategory === 'weddingVideos';
    const isInvitation = state.activeCategory === 'invitationCards';
    const isBirthday = state.activeCategory === 'birthdayCards';

    // Adjust grid classes for different layouts
    grid.className = 'cards-grid';
    if (isVideo) {
        grid.classList.add('grid-video');
    } else if (isInvitation) {
        grid.classList.add('grid-invitation');
    } else if (isBirthday) {
        grid.classList.add('grid-birthday');
    }

    // Filter items based on sub-tag and search query
    const filtered = currentList.filter(item => {
        // Tag filter
        if (state.activeTag !== 'all') {
            if (item.tag !== state.activeTag) return false;
        }

        // Search filter
        if (state.searchQuery.trim() !== '') {
            const query = state.searchQuery.toLowerCase().trim();
            const nameMatch = (item.name || '').toLowerCase().includes(query);
            const titleMatch = (item.title || '').toLowerCase().includes(query);
            const idMatch = (item.id || '').toLowerCase().includes(query);
            if (!nameMatch && !idMatch && !titleMatch) return false;
        }

        return true;
    });

    // Update Summary Text
    if (resultsSummary) {
        resultsSummary.textContent = `Hiển thị ${filtered.length} mẫu thiết kế phù hợp`;
    }

    // Render Empty State if no items found
    if (filtered.length === 0) {
        let emptyDesc = 'Hiện chưa có mẫu nào trong danh mục này hoặc không khớp với từ khóa tìm kiếm.';
        if (state.activeCategory === 'birthdayCards') {
            emptyDesc = 'Mẫu thiệp sinh nhật & sự kiện đang được cập nhật thiết kế mới. Vui lòng liên hệ Zalo để được thiết kế riêng!';
        }

        grid.innerHTML = `
            <div class="catalog-empty-box">
                <div class="empty-icon"><i class="fa-regular fa-folder-open"></i></div>
                <h3 class="empty-title">Không tìm thấy mẫu phù hợp</h3>
                <p class="empty-desc">${emptyDesc}</p>
            </div>
        `;
        return;
    }

    // Render cards
    grid.innerHTML = filtered.map((item, idx) => {
        const badgeHtml = getBadgeHtml(item.tag);
        const itemUrl = getPersonalizedUrl(item.url || '#');
        const encodedItemName = encodeURIComponent(item.name || 'Mẫu thiệp');
        const zaloOrderUrl = `https://zalo.me/${ZALO_PHONE}?text=${encodeURIComponent('Xin chào, mình muốn tư vấn và đặt mẫu: ' + item.name + ' (' + (item.price || '') + ')')}`;

        if (isVideo) {
            return `
                <div class="wedding-card video-card" data-index="${idx}">
                    <div class="card-media" onclick="openVideoModal('${encodeURIComponent(JSON.stringify(item))}')">
                        ${badgeHtml}
                        <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='./images/video-1.png'">
                        <div class="video-play-indicator">
                            <i class="fa-solid fa-play"></i>
                        </div>
                    </div>
                    <div class="card-details">
                        <div class="card-title-row">
                            <h3 class="card-name">${item.name}</h3>
                            <span class="card-price-pill">${item.price || 'Liên hệ'}</span>
                        </div>
                        <div class="card-actions-row">
                            <button class="btn-card-view" onclick="openVideoModal('${encodeURIComponent(JSON.stringify(item))}')">
                                <i class="fa-solid fa-play"></i> Xem video
                            </button>
                            <a class="btn-card-order" href="${zaloOrderUrl}" target="_blank" rel="noopener noreferrer" title="Đặt video này qua Zalo">
                                <i class="fa-solid fa-comment-dots"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }

        const fallbackImg = isBirthday ? './images/happy-1.png' : (isInvitation ? './images/thiep-14.png' : './images/thiep-20.png');

        return `
            <div class="wedding-card" data-index="${idx}">
                <div class="card-media">
                    ${badgeHtml}
                    <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='${fallbackImg}'">
                    <div class="card-media-overlay">
                        <a href="${itemUrl}" target="_blank" rel="noopener noreferrer" class="btn-preview-circle" title="Xem demo trực tiếp">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    </div>
                </div>
                <div class="card-details">
                    <div class="card-title-row">
                        <h3 class="card-name">${item.name}</h3>
                        <span class="card-price-pill">${item.price || '139.000đ'}</span>
                    </div>
                    <div class="card-actions-row">
                        <a href="${itemUrl}" target="_blank" rel="noopener noreferrer" class="btn-card-view">
                            <i class="fa-regular fa-eye"></i> Xem demo
                        </a>
                        <a class="btn-card-order" href="${zaloOrderUrl}" target="_blank" rel="noopener noreferrer" title="Đặt mẫu này qua Zalo">
                            <i class="fa-solid fa-comment-dots"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getBadgeHtml(tag) {
    if (!tag) return '';
    if (tag === 'best') {
        return `<span class="card-badge best"><i class="fa-solid fa-fire"></i> Best Seller</span>`;
    }
    if (tag === 'new') {
        return `<span class="card-badge new"><i class="fa-solid fa-sparkles"></i> Mẫu Mới</span>`;
    }
    return `<span class="card-badge new">${tag.toUpperCase()}</span>`;
}

/* ==========================================================================
   4. EVENT LISTENERS SETUP
   ========================================================================== */
function setupEventListeners() {
    // Category Tabs Switching
    // document.querySelectorAll('.tab-btn').forEach(btn => {
    //     btn.addEventListener('click', () => {
    //         document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    //         btn.classList.add('active');
    //         state.activeCategory = btn.dataset.tab;
    //         renderCatalog();
    //     });
    // });
        // Category Tabs Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activeCategory = btn.dataset.tab;
            renderCatalog();

            // Cuộn ngang để tab vừa chọn nằm giữa (chỉ tác động thanh tab, không cuộn cả trang)
            const wrap = btn.closest('.main-tabs-wrap');
            if (wrap && wrap.scrollWidth > wrap.clientWidth) {
                const target = btn.offsetLeft - (wrap.clientWidth - btn.offsetWidth) / 2;
                wrap.scrollTo({ left: target, behavior: 'smooth' });
            }
        });
    });

    // Sub-tag Filter Pills (All, Best Seller, New)
    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activeTag = btn.dataset.tag;
            renderCatalog();
        });
    });

    // Search Input Handling
    const searchInput = document.getElementById('catalogSearchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            if (searchClearBtn) {
                if (state.searchQuery.length > 0) {
                    searchClearBtn.classList.add('visible');
                } else {
                    searchClearBtn.classList.remove('visible');
                }
            }
            renderCatalog();
        });
    }

    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                state.searchQuery = '';
                searchClearBtn.classList.remove('visible');
                renderCatalog();
                searchInput.focus();
            }
        });
    }

    // Mobile Navbar Menu Toggle
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-xmark');
            }
        });

        // Close mobile nav when clicking a link
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                const icon = mobileToggle.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-xmark');
                }
            });
        });
    }

    // Modal close events
    const modal = document.getElementById('videoModalOverlay');
    const closeBtn = document.getElementById('modalCloseBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeVideoModal);
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeVideoModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeVideoModal();
    });

    // Petals effect toggle button
    const petalsToggle = document.getElementById('petalsToggleBtn');
    if (petalsToggle) {
        petalsToggle.addEventListener('click', () => {
            state.petalsEnabled = !state.petalsEnabled;
            const canvas = document.getElementById('petalsCanvas');
            if (canvas) {
                canvas.style.display = state.petalsEnabled ? 'block' : 'none';
            }
            petalsToggle.title = state.petalsEnabled ? 'Tắt hiệu ứng hoa rơi' : 'Bật hiệu ứng hoa rơi';
            petalsToggle.innerHTML = state.petalsEnabled 
                ? '<i class="fa-solid fa-leaf"></i>' 
                : '<i class="fa-solid fa-eye-slash"></i>';
        });
    }

    // Back to top button
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

/* ==========================================================================
   5. VIDEO MODAL LIGHTBOX
   ========================================================================== */
window.openVideoModal = function (itemString) {
    let item;
    try {
        item = JSON.parse(decodeURIComponent(itemString));
    } catch (e) {
        console.error('Lỗi phân tích video object:', e);
        return;
    }

    const modal = document.getElementById('videoModalOverlay');
    const titleEl = document.getElementById('modalVideoTitle');
    const priceEl = document.getElementById('modalVideoPrice');
    const orderBtn = document.getElementById('modalVideoOrderBtn');
    const videoPlayer = document.getElementById('modalVideoPlayer');
    const youtubePlayer = document.getElementById('modalYoutubePlayer');

    if (!modal) return;

    if (titleEl) titleEl.textContent = item.name || 'Video Cưới';
    if (priceEl) priceEl.textContent = item.price || '';
    if (orderBtn) {
        const orderUrl = `https://zalo.me/${ZALO_PHONE}?text=${encodeURIComponent('Xin chào, mình muốn đặt ' + item.name + ' (' + item.price + ')')}`;
        orderBtn.href = orderUrl;
    }

    // Reset media
    videoPlayer.pause();
    videoPlayer.src = '';
    videoPlayer.style.display = 'none';
    youtubePlayer.src = '';
    youtubePlayer.style.display = 'none';

    if (item.type === 'mp4') {
        videoPlayer.src = item.video;
        videoPlayer.style.display = 'block';
        videoPlayer.play().catch(e => console.log('Autoplay prevented:', e));
    } else if (item.type === 'youtube') {
        youtubePlayer.src = item.video.includes('?') ? `${item.video}&autoplay=1` : `${item.video}?autoplay=1`;
        youtubePlayer.style.display = 'block';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeVideoModal = function () {
    const modal = document.getElementById('videoModalOverlay');
    const videoPlayer = document.getElementById('modalVideoPlayer');
    const youtubePlayer = document.getElementById('modalYoutubePlayer');

    if (modal) modal.classList.remove('active');
    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.src = '';
    }
    if (youtubePlayer) {
        youtubePlayer.src = '';
    }
    document.body.style.overflow = '';
};

/* ==========================================================================
   6. SCROLL EFFECTS & NAVBAR
   ========================================================================== */
function setupScrollEffects() {
    const navbar = document.querySelector('.navbar');
    const backToTopBtn = document.getElementById('backToTopBtn');

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY > 40;
        if (navbar) {
            if (scrolled) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        }

        if (backToTopBtn) {
            if (window.scrollY > 400) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }
    }, { passive: true });
}

/* ==========================================================================
   7. ROMANTIC FALLING PETALS CANVAS EFFECT
   ========================================================================== */
function initPetalsCanvas() {
    const canvas = document.getElementById('petalsCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const petalCount = window.innerWidth < 768 ? 16 : 28;
    const petals = [];

    // Create realistic petal palette (soft rose, blush, gold sparkle)
    const colors = [
        'rgba(247, 182, 196, 0.7)',
        'rgba(255, 209, 220, 0.65)',
        'rgba(242, 155, 175, 0.55)',
        'rgba(235, 198, 118, 0.5)'
    ];

    class Petal {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * -height * 0.5;
            this.size = Math.random() * 9 + 7;
            this.speedX = Math.random() * 1.5 - 0.75;
            this.speedY = Math.random() * 1.2 + 0.8;
            this.rotation = Math.random() * 360;
            this.rotSpeed = (Math.random() - 0.5) * 1.5;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.swing = Math.random() * 0.02 + 0.01;
            this.swingStep = Math.random() * Math.PI * 2;
        }

        update() {
            this.swingStep += this.swing;
            this.x += Math.sin(this.swingStep) * 0.8 + this.speedX;
            this.y += this.speedY;
            this.rotation += this.rotSpeed;

            if (this.y > height + 20 || this.x < -30 || this.x > width + 30) {
                this.reset();
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(this.size / 2, -this.size / 2, this.size, 0, 0, this.size);
            ctx.bezierCurveTo(-this.size, 0, -this.size / 2, -this.size / 2, 0, 0);
            ctx.fillStyle = this.color;
            ctx.fill();

            ctx.restore();
        }
    }

    for (let i = 0; i < petalCount; i++) {
        petals.push(new Petal());
    }

    function animate() {
        if (state.petalsEnabled) {
            ctx.clearRect(0, 0, width, height);
            for (let i = 0; i < petals.length; i++) {
                petals[i].update();
                petals[i].draw();
            }
        }
        requestAnimationFrame(animate);
    }

    animate();
}

