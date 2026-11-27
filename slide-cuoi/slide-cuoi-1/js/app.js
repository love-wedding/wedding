/**
 * LUXURY WEDDING SLIDE ENGINE - 16:9 WIDESCREEN
 * Recreated 100% faithfully to match Download.mp4
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DEFAULT CONFIGURATION & COUPLE DATA ---
    const config = {
        groom: 'ANH TÚ',
        bride: 'DIỆU NHI',
        date: '06.06.2026',
        title: "WE'RE GETTING MARRIED",
        introBg: 'images/862c74c2-dee6-4810-95a8-19c310ba2b9a.jpg', // High-res couple walking on lawn with perfect left-right framing
        slideDuration: 7000, // 7 seconds per slide (industry standard for wedding LED)
        layoutMode: 'ambient', // 'ambient' or 'cover' for subsequent vertical photos
        autoPlay: true,
        musicVolume: 0.9
    };

    // --- 2. SLIDE DEFINITIONS ---
    const slidesData = [
        {
            id: 'slide-intro',
            type: 'intro',
            bgImage: 'images/7a6ec418-5ce5-45fa-bf08-a3ddde60d4ed.jpg',
            animation: 'ken-burns-in',
            beamLight: true,
            duration: 8000
        },
        {
            id: 'slide-walk',
            type: 'editorial',
            // Walking hand-in-hand smiling on expansive green lawn
            bgImage: 'images/7a6ec418-5ce5-45fa-bf08-a3ddde60d4ed.jpg',
            animation: 'ken-burns-pan-right',
            beamLight: false,
            editorial: {
                position: 'bottom-left',
                title: 'JOURNEY OF LOVE',
                subtitle: 'CHAPTER ONE • THE BEGINNING OF FOREVER',
                tag: 'ANH TÚ & DIỆU NHI • 06.06.2026'
            },
            watermark: 'SEPTEMBER STUDIO • WEDDING PHOTOGRAPHY'
        },
        {
            id: 'slide-horizontal-veil',
            type: 'horizontal',
            // Horizontal wide landscape shot with flowing veil across green nature
            bgImage: 'images/862c74c2-dee6-4810-95a8-19c310ba2b9a.jpg',
            animation: 'ken-burns-pan-left',
            beamLight: false,
            editorial: {
                position: 'bottom-left',
                title: 'NATURAL BREATHING',
                subtitle: 'FIND THE COURAGE TO BE YOURSELF',
                tag: 'WEDDING EDITORIAL • 2026'
            },
            topRightAccent: {
                script: 'Love',
                sub: 'FOREVER & ALWAYS'
            }
        },
        {
            id: 'slide-candid-laugh',
            type: 'editorial',
            // Couple laughing happily outdoors with large flower bouquet
            bgImage: 'images/dbc83d22-1689-4d88-a0f6-46ccfa8940b2.jpg',
            animation: 'ken-burns-out',
            beamLight: false,
            editorial: {
                position: 'bottom-center',
                quote: '“Every love story is beautiful, but ours is my favorite.”',
                sub: 'ANH TÚ & DIỆU NHI'
            }
        },
        {
            id: 'slide-intimate-embrace',
            type: 'editorial',
            // Sweet intimate embrace, eyes closed, pure romantic feeling
            bgImage: 'images/a3ba2929-caf1-489d-9f10-a055afb96839.jpg',
            animation: 'ken-burns-in',
            beamLight: false,
            topRightAccent: {
                script: 'Love Life',
                sub: 'FOREVER'
            },
            watermark: 'MEET HAPPINESS PHOTOGRAPHY STUDIO'
        },
        {
            id: 'slide-duo',
            type: 'duo',
            // Duo editorial layout pairing two vertical shots side-by-side
            leftImage: 'images/b778bc3f-0ffb-4a6f-9c23-2a9d629c9a47.jpg',
            rightImage: 'images/c0ec2833-5f9c-47be-8eca-db402e8fe4e4.jpg',
            bgImage: 'images/b778bc3f-0ffb-4a6f-9c23-2a9d629c9a47.jpg',
            animation: 'ken-burns-pan-right',
            beamLight: false,
            centerText: {
                tag: 'MEMORIES',
                script: 'Together',
                date: '06 • 06 • 2026'
            }
        },
        {
            id: 'slide-studio-portrait',
            type: 'editorial',
            // Classic bright studio wedding portrait
            bgImage: 'images/974a7ccd-4088-42be-ab42-c84c9d7d123c.jpg',
            animation: 'ken-burns-out',
            beamLight: false,
            topRightAccent: {
                script: 'Save the Date',
                sub: 'ANH TÚ & DIỆU NHI'
            },
            editorial: {
                position: 'bottom-left',
                title: 'A PROMISE OF A LIFETIME',
                subtitle: 'FROM THIS DAY FORWARD',
                tag: '06.06.2026'
            }
        },
        {
            id: 'slide-outro',
            type: 'outro',
            // Grand finale reception slide
            bgImage: 'images/070dbca4-20c8-4ca7-a094-69a81bc13caa.jpg',
            animation: 'ken-burns-in',
            beamLight: true,
            duration: 9000
        }
    ];

    // --- 3. DOM ELEMENTS ---
    const stageViewport = document.getElementById('stage-viewport');
    const slidesContainer = document.getElementById('slides-container');
    const lightingBeam = document.getElementById('lighting-beam');
    const progressBar = document.getElementById('progress-bar');
    const audio = document.getElementById('wedding-audio');
    const audioPromptPill = document.getElementById('audio-prompt-pill');
    const btnPillPlay = document.getElementById('btn-pill-play');
    const whiteFlash = document.getElementById('white-flash');
    const stageControls = document.getElementById('stage-controls');
    const btnPlayPause = document.getElementById('btn-play-pause');
    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const slideCounter = document.getElementById('slide-counter');
    const indicatorsWrapper = document.getElementById('indicators-wrapper');
    const btnMute = document.getElementById('btn-mute');
    const iconVolOn = document.getElementById('icon-vol-on');
    const iconVolOff = document.getElementById('icon-vol-off');
    const volumeSlider = document.getElementById('volume-slider');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const iconFsEnter = document.getElementById('icon-fs-enter');
    const iconFsExit = document.getElementById('icon-fs-exit');
    const btnSettings = document.getElementById('btn-settings');
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnSaveSettings = document.getElementById('btn-save-settings');

    // Settings fields
    const cfgGroom = document.getElementById('cfg-groom');
    const cfgBride = document.getElementById('cfg-bride');
    const cfgDate = document.getElementById('cfg-date');
    const cfgTitle = document.getElementById('cfg-title');
    const cfgIntroBg = document.getElementById('cfg-intro-bg');
    const cfgDuration = document.getElementById('cfg-duration');
    const cfgLayoutMode = document.getElementById('cfg-layout-mode');

    // State Variables
    let currentSlideIndex = 0;
    let slideTimer = null;
    let progressInterval = null;
    let progressStartTime = 0;
    let isPlaying = false;
    let idleTimer = null;

    // --- 4. RENDER SLIDES HTML ---
    function renderSlides() {
        slidesContainer.innerHTML = '';
        indicatorsWrapper.innerHTML = '';

        slidesData.forEach((slide, idx) => {
            const slideEl = document.createElement('div');
            slideEl.className = `slide-item ${idx === 0 ? 'active' : ''}`;
            slideEl.id = `slide-${idx}`;

            let innerHTML = '';

            // Slide 1: Exact Intro recreation matching Download.mp4
            if (slide.type === 'intro') {
                const introImage = config.introBg || slide.bgImage;
                innerHTML += `
                    <img src="${introImage}" class="slide-bg-ambient" alt="Background Blur">
                    <div class="slide-main-wrapper mode-intro">
                        <img src="${introImage}" class="slide-main-image ${slide.animation}" alt="Wedding Intro">
                    </div>
                    <div class="intro-light-sheen"></div>
                    <div class="intro-content">
                        <div class="intro-tagline">${config.title}</div>
                        <div class="intro-script-wrapper">
                            <span class="intro-script-save">Save</span>
                            <span class="intro-script-the">the</span>
                            <span class="intro-script-date">Date</span>
                        </div>
                        <div class="intro-couple-names">
                            <div class="name-groom">${config.groom}</div>
                            <div class="name-ampersand">&amp;</div>
                            <div class="name-bride">${config.bride}</div>
                        </div>
                        <div class="intro-date">${config.date}</div>
                    </div>
                `;
            } else if (slide.type === 'duo') {
                innerHTML += `
                    <img src="${slide.bgImage}" class="slide-bg-ambient" alt="Background Blur">
                    <div class="slide-duo-wrapper">
                        <div class="slide-duo-col">
                            <img src="${slide.leftImage}" class="ken-burns-in" alt="Couple Left">
                        </div>
                        <div class="slide-duo-center">
                            <div class="editorial-tag">${slide.centerText.tag}</div>
                            <div class="script-accent" style="font-size: clamp(2rem, 3.5vw, 3.8rem);">${slide.centerText.script}</div>
                            <div class="intro-date" style="color: rgba(255,255,255,0.85);">${slide.centerText.date}</div>
                        </div>
                        <div class="slide-duo-col">
                            <img src="${slide.rightImage}" class="ken-burns-out" alt="Couple Right">
                        </div>
                    </div>
                `;
            } else if (slide.type === 'outro') {
                innerHTML += `
                    <div class="slide-main-wrapper mode-cover">
                        <img src="${slide.bgImage}" class="slide-main-image ${slide.animation}" alt="Wedding Photo">
                    </div>
                    <div class="outro-content">
                        <div class="outro-tag">HÂN HẠNH ĐƯỢC ĐÓN TIẾP QUÝ KHÁCH</div>
                        <div class="outro-thankyou">Thank You!</div>
                        <div class="outro-names">${config.groom} &amp; ${config.bride}</div>
                        <div class="outro-tag">${config.date}</div>
                        <div class="outro-sub">CẢM ƠN QUÝ KHÁCH ĐÃ ĐẾN CHUNG VUI CÙNG GIA ĐÌNH CHÚNG TÔI</div>
                    </div>
                `;
            } else {
                // Editorial or Horizontal
                const wrapperMode = slide.type === 'horizontal' ? 'mode-horizontal' : (config.layoutMode === 'ambient' ? 'mode-ambient' : 'mode-cover');
                if (wrapperMode === 'mode-ambient') {
                    innerHTML += `<img src="${slide.bgImage}" class="slide-bg-ambient" alt="Background Blur">`;
                }
                innerHTML += `
                    <div class="slide-main-wrapper ${wrapperMode}">
                        <img src="${slide.bgImage}" class="slide-main-image ${slide.animation}" alt="Wedding Portrait">
                    </div>
                `;

                // Overlays
                if (slide.editorial && slide.editorial.position === 'bottom-left') {
                    innerHTML += `
                        <div class="editorial-bottom-left">
                            <div class="editorial-title">${slide.editorial.title}</div>
                            <div class="editorial-subtitle">${slide.editorial.subtitle}</div>
                            <div class="editorial-tag">${slide.editorial.tag}</div>
                        </div>
                    `;
                }

                if (slide.editorial && slide.editorial.position === 'bottom-center') {
                    innerHTML += `
                        <div class="quote-bottom-center">
                            <div class="quote-text">${slide.editorial.quote}</div>
                            <div class="quote-sub">${slide.editorial.sub}</div>
                        </div>
                    `;
                }

                if (slide.topRightAccent) {
                    innerHTML += `
                        <div class="editorial-top-right">
                            <div class="script-accent">${slide.topRightAccent.script}</div>
                            <div class="script-sub">${slide.topRightAccent.sub}</div>
                        </div>
                    `;
                }

                if (slide.watermark) {
                    innerHTML += `<div class="studio-watermark">${slide.watermark}</div>`;
                }
            }

            slideEl.innerHTML = innerHTML;
            slidesContainer.appendChild(slideEl);

            // Create indicator dot
            const dot = document.createElement('div');
            dot.className = `indicator-dot ${idx === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => goToSlide(idx));
            indicatorsWrapper.appendChild(dot);
        });

        updateSlideCounter();
    }

    // --- 5. SLIDE NAVIGATION & TIMING ---
    function showSlide(index) {
        const slides = document.querySelectorAll('.slide-item');
        const dots = document.querySelectorAll('.indicator-dot');

        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        // Transition out old slide
        const prevSlide = document.querySelector('.slide-item.active');
        if (prevSlide && prevSlide !== slides[index]) {
            prevSlide.classList.remove('active');
            prevSlide.classList.add('previous');
            setTimeout(() => {
                prevSlide.classList.remove('previous');
            }, 2000);
        }

        // Activate new slide
        currentSlideIndex = index;
        const currentSlide = slides[currentSlideIndex];
        currentSlide.classList.add('active');

        // Restart animation on the active slide's images
        const animatedImgs = currentSlide.querySelectorAll('.slide-main-image, .slide-duo-col img');
        animatedImgs.forEach(img => {
            const animClass = Array.from(img.classList).find(c => c.startsWith('ken-burns'));
            if (animClass) {
                img.classList.remove(animClass);
                void img.offsetWidth; // Reflow
                img.classList.add(animClass);
            }
        });

        // Trigger flash if restarting to slide 0
        if (index === 0 && whiteFlash) {
            whiteFlash.style.animation = 'none';
            void whiteFlash.offsetWidth;
            whiteFlash.style.animation = 'flashFadeOut 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards';
        }

        // Update beam light intensity
        const currentData = slidesData[currentSlideIndex];
        if (currentData.beamLight) {
            lightingBeam.classList.remove('dimmed');
        } else {
            lightingBeam.classList.add('dimmed');
        }

        // Update dots
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === currentSlideIndex);
        });

        updateSlideCounter();
        resetSlideTimer();
    }

    function nextSlide() {
        showSlide(currentSlideIndex + 1);
    }

    function prevSlide() {
        showSlide(currentSlideIndex - 1);
    }

    function goToSlide(index) {
        showSlide(index);
    }

    function updateSlideCounter() {
        const currentStr = String(currentSlideIndex + 1).padStart(2, '0');
        const totalStr = String(slidesData.length).padStart(2, '0');
        slideCounter.textContent = `${currentStr} / ${totalStr}`;
    }

    function resetSlideTimer() {
        clearTimeout(slideTimer);
        clearInterval(progressInterval);

        if (!isPlaying) {
            progressBar.style.width = '0%';
            return;
        }

        const duration = slidesData[currentSlideIndex].duration || config.slideDuration;
        progressStartTime = performance.now();

        progressInterval = setInterval(() => {
            const elapsed = performance.now() - progressStartTime;
            const percent = Math.min(100, (elapsed / duration) * 100);
            progressBar.style.width = `${percent}%`;

            if (percent >= 100) {
                clearInterval(progressInterval);
            }
        }, 30);

        slideTimer = setTimeout(() => {
            nextSlide();
        }, duration);
    }

    function togglePlayPause() {
        isPlaying = !isPlaying;
        iconPlay.classList.toggle('hidden', isPlaying);
        iconPause.classList.toggle('hidden', !isPlaying);

        if (isPlaying) {
            audioPromptPill.classList.add('hidden');
            if (audio.paused) {
                audio.play().catch(e => console.log('Audio autoplay prevented:', e));
            }
            resetSlideTimer();
        } else {
            clearTimeout(slideTimer);
            clearInterval(progressInterval);
        }
    }

    // --- 6. AUDIO CONTROLLER ---
    function setupAudio() {
        audio.volume = config.musicVolume;
        volumeSlider.value = config.musicVolume;

        btnMute.addEventListener('click', () => {
            audio.muted = !audio.muted;
            iconVolOn.classList.toggle('hidden', audio.muted);
            iconVolOff.classList.toggle('hidden', !audio.muted);
        });

        volumeSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            audio.volume = val;
            audio.muted = false;
            iconVolOn.classList.remove('hidden');
            iconVolOff.classList.add('hidden');
        });
    }

    // --- 7. FULLSCREEN HANDLER ---
    function toggleFullscreen() {
        const elem = document.documentElement;
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            }
            iconFsEnter.classList.add('hidden');
            iconFsExit.classList.remove('hidden');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            iconFsEnter.classList.remove('hidden');
            iconFsExit.classList.add('hidden');
        }
    }

    document.addEventListener('fullscreenchange', () => {
        const isFS = !!document.fullscreenElement;
        iconFsEnter.classList.toggle('hidden', isFS);
        iconFsExit.classList.toggle('hidden', !isFS);
    });

    // --- 8. AUTO-HIDE STAGE CONTROLS ON IDLE ---
    function resetControlsTimer() {
        stageControls.classList.add('visible');
        stageViewport.classList.remove('cursor-hidden');
        clearTimeout(idleTimer);

        idleTimer = setTimeout(() => {
            if (!settingsModal.classList.contains('active')) {
                stageControls.classList.remove('visible');
                if (isPlaying) {
                    stageViewport.classList.add('cursor-hidden');
                }
            }
        }, 3200);
    }

    document.addEventListener('mousemove', resetControlsTimer);
    document.addEventListener('click', resetControlsTimer);
    document.addEventListener('keydown', resetControlsTimer);

    // --- 9. KEYBOARD SHORTCUTS ---
    document.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
            return;
        }

        switch (e.key) {
            case ' ':
            case 'k':
                e.preventDefault();
                togglePlayPause();
                break;
            case 'ArrowRight':
            case 'l':
                nextSlide();
                break;
            case 'ArrowLeft':
            case 'j':
                prevSlide();
                break;
            case 'f':
            case 'F':
                toggleFullscreen();
                break;
            case 'm':
            case 'M':
                btnMute.click();
                break;
            case 's':
            case 'S':
                openSettings();
                break;
            case 'r':
            case 'R':
                showSlide(0);
                break;
            case 'Escape':
                closeSettings();
                break;
        }
    });

    // Touch swipe & click navigation
    let touchStartX = 0;
    stageViewport.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    stageViewport.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const diffX = touchEndX - touchStartX;
        if (Math.abs(diffX) > 50) {
            if (diffX < 0) nextSlide();
            else prevSlide();
        }
    }, { passive: true });

    // --- 10. FLOATING BOKEH & SPARKLE DUST ENGINE ---
    function initParticles() {
        const canvas = document.getElementById('particles-canvas');
        const ctx = canvas.getContext('2d');
        let width = canvas.width = canvas.offsetWidth;
        let height = canvas.height = canvas.offsetHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        });

        const particles = [];
        const count = 45;

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2.8 + 0.6,
                baseAlpha: Math.random() * 0.45 + 0.15,
                alpha: 0,
                speedY: -(Math.random() * 0.4 + 0.15),
                speedX: (Math.random() - 0.5) * 0.25,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.02 + 0.01,
                color: Math.random() > 0.4 ? '255, 235, 185' : '255, 255, 255'
            });
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                p.pulse += p.pulseSpeed;

                p.alpha = p.baseAlpha + Math.sin(p.pulse) * 0.2;
                if (p.alpha < 0) p.alpha = 0;

                if (p.y < -10) {
                    p.y = height + 10;
                    p.x = Math.random() * width;
                }
                if (p.x < -10) p.x = width + 10;
                if (p.x > width + 10) p.x = -10;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
                ctx.shadowBlur = p.radius * 3.5;
                ctx.shadowColor = `rgba(${p.color}, 0.8)`;
                ctx.fill();
            });

            requestAnimationFrame(animate);
        }

        animate();
    }

    // --- 11. SETTINGS MODAL & LIVE UPDATES ---
    function openSettings() {
        cfgGroom.value = config.groom;
        cfgBride.value = config.bride;
        cfgDate.value = config.date;
        cfgTitle.value = config.title;
        cfgIntroBg.value = config.introBg;
        cfgDuration.value = config.slideDuration;
        cfgLayoutMode.value = config.layoutMode;

        settingsModal.classList.add('active');
    }

    function closeSettings() {
        settingsModal.classList.remove('active');
    }

    function saveSettings() {
        config.groom = cfgGroom.value.trim().toUpperCase() || 'ANH TÚ';
        config.bride = cfgBride.value.trim().toUpperCase() || 'DIỆU NHI';
        config.date = cfgDate.value.trim() || '06.06.2026';
        config.title = cfgTitle.value.trim().toUpperCase() || "WE'RE GETTING MARRIED";
        config.introBg = cfgIntroBg.value;
        config.slideDuration = parseInt(cfgDuration.value, 10);
        config.layoutMode = cfgLayoutMode.value;

        // Re-render slides
        const currentIndex = currentSlideIndex;
        renderSlides();
        showSlide(currentIndex);
        closeSettings();
    }

    btnSettings.addEventListener('click', openSettings);
    btnCloseModal.addEventListener('click', closeSettings);
    btnSaveSettings.addEventListener('click', saveSettings);

    // --- 12. INITIALIZATION & AUDIO PROMPT ---
    function startPlaying() {
        if (!isPlaying) {
            isPlaying = true;
            iconPlay.classList.add('hidden');
            iconPause.classList.remove('hidden');
            audioPromptPill.classList.add('hidden');
            audio.play().catch(e => console.log('Audio autoplay prevented:', e));
            resetSlideTimer();
        }
    }

    btnPillPlay.addEventListener('click', (e) => {
        e.stopPropagation();
        startPlaying();
    });

    stageViewport.addEventListener('click', (e) => {
        // Only trigger if not clicking buttons or modals
        if (!e.target.closest('.ctrl-btn') && !e.target.closest('.modal-card')) {
            startPlaying();
        }
    });

    btnPlayPause.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlayPause();
    });

    btnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        nextSlide();
    });

    btnPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        prevSlide();
    });

    btnFullscreen.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFullscreen();
    });

    // Initial render & immediate display of Slide 1
    renderSlides();
    setupAudio();
    initParticles();
    showSlide(0);
    resetControlsTimer();
});
