/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  EFFECTS.JS — Thư viện hiệu ứng cho thiệp cưới              ║
 * ║                                                                ║
 * ║  Cách dùng:                                                    ║
 * ║    Effects.start('snow')      // bật hiệu ứng tự chạy         ║
 * ║    Effects.stop()             // dừng hiệu ứng đang chạy      ║
 * ║    Effects.trigger('firework') // kích hoạt 1 lần              ║
 * ║                                                                ║
 * ║  ════════════ MENU HIỆU ỨNG ════════════                      ║
 * ║                                                                ║
 * ║  ── HIỆU ỨNG TỰ CHẠY (auto-loop) ──                           ║
 * ║    snow         🌨️  Tuyết rơi                                  ║
 * ║    hearts       💕  Tim rơi                                    ║
 * ║    rain         🌧️  Mưa rơi                                    ║
 * ║    stars        ⭐  Sao rơi                                    ║
 * ║    petals       🌸  Cánh hoa rơi                               ║
 * ║    bubbles      🫧  Bong bóng bay lên                          ║
 * ║    fireflies    ✨  Đom đóm bay                                ║
 * ║    butterflies  🦋  Bướm bay                                   ║
 * ║    leaves       🍂  Lá rơi                                     ║
 * ║    confetti     🎊  Kim tuyến rơi                              ║
 * ║    sparkles     ✨  Lấp lánh                                   ║
 * ║    musicNotes   🎵  Nốt nhạc bay                               ║
 * ║    starSprite   🌟  Ngôi sao rơi (ảnh)                         ║
 * ║                                                                ║
 * ║  ── HIỆU ỨNG KÍCH HOẠT (one-shot) ──                          ║
 * ║    firework     🎆  Pháo hoa nổ                                ║
 * ║    heartBurst   💖  Tim nổ                                     ║
 * ║    confettiBurst🎉  Pháo giấy nổ                              ║
 * ║    starBurst    🌟  Sao nổ                                     ║
 * ║    ringPulse    💍  Nhẫn lan toả                               ║
 * ║                                                                ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

(function (window) {
    'use strict';

    // ── CONFIG ────────────────────────────────────────────────────────
    const Z_EFFECT = 90000040; // dưới context box editor (~9999999) nhưng trên template
    const CANVAS_ID = '__effect_canvas__';

    // ── STATE ─────────────────────────────────────────────────────────
    let canvas = null;
    let ctx = null;
    let particles = [];
    let animationId = null;
    let currentEffect = null;
    let lastSpawn = 0;
    let lastFrameTime = 0; // dùng để tính delta-time, tránh tốc độ hiệu ứng phụ thuộc tần số quét màn hình
    let speed = 1; // hệ số tốc độ (0.2 - 3)
    let density = 1; // hệ số mật độ (0.2 - 3)
    let sizeScale = 1; // hệ số kích thước (0.1 - 5)

    // ── UTILS ─────────────────────────────────────────────────────────
    const rand = (min, max) => Math.random() * (max - min) + min;
    const randI = (min, max) => Math.floor(rand(min, max + 1));

    // Dùng clientWidth/clientHeight thay vì window.innerWidth/innerHeight
    // để tránh bị ảnh hưởng bởi Object.defineProperty override trong chế độ mob=1
    const _vw = () => document.documentElement.clientWidth  || document.body.clientWidth  || 800;
    const _vh = () => document.documentElement.clientHeight || document.body.clientHeight || 600;

    function ensureCanvas() {
        if (canvas) return canvas;
        canvas = document.createElement('canvas');
        canvas.id = CANVAS_ID;
        canvas.style.cssText = `
            position: fixed; top: 0; left: 0;
            pointer-events: none;
            z-index: ${Z_EFFECT};
        `;
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
        return canvas;
    }

    function resize() {
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const w = _vw();
        const h = _vh();
        // Đặt kích thước CSS bằng đúng px đo được (thay vì 100vw/100vh) để tránh
        // lệch với thanh cuộn — 100vw luôn tính cả bề rộng scrollbar còn clientWidth
        // (dùng để tính bộ đệm vẽ bên dưới) thì không, khiến trình duyệt phải kéo
        // giãn canvas và gây rách/nhoè hình ở viền phải & viền dưới.
        canvas.style.width  = w + 'px';
        canvas.style.height = h + 'px';
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
    }

    function clearCanvas() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // ═══════════════════════════════════════════════════════════════════
    // ▓▓▓ HIỆU ỨNG TỰ CHẠY (LOOP) ▓▓▓
    // ═══════════════════════════════════════════════════════════════════

    const effects = {

        // ── 1. TUYẾT RƠI ──────────────────────────────────────────────
        snow: {
            spawn() {
                particles.push({
                    x: rand(0, _vw()),
                    y: -10,
                    r: rand(2, 5),
                    vy: rand(0.5, 1.8),
                    vx: rand(-0.5, 0.5),
                    opacity: rand(0.5, 1),
                });
            },
            update(p) {
                p.y += p.vy;
                p.x += p.vx + Math.sin(p.y * 0.01) * 0.5;
                return p.y < _vh() + 10;
            },
            draw(p) {
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            },
            interval: 80,
        },

        // ── 2. TIM RƠI ────────────────────────────────────────────────
        hearts: {
            spawn() {
                particles.push({
                    x: rand(0, _vw()),
                    y: -20,
                    size: rand(15, 28),
                    vy: rand(1, 2.5),
                    vx: rand(-0.8, 0.8),
                    rot: rand(-0.3, 0.3),
                    opacity: rand(0.6, 1),
                    color: ['#ff5a5f', '#ff8fa3', '#ff4081', '#e91e63'][randI(0, 3)],
                });
            },
            update(p) {
                p.y += p.vy;
                p.x += p.vx + Math.sin(p.y * 0.02) * 0.7;
                return p.y < _vh() + 30;
            },
            draw(p) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                drawHeart(0, 0, p.size);
                ctx.restore();
            },
            interval: 200,
        },

        // ── 3. MƯA RƠI ────────────────────────────────────────────────
        rain: {
            spawn() {
                particles.push({
                    x: rand(-50, _vw()),
                    y: -10,
                    len: rand(10, 20),
                    vy: rand(8, 14),
                    vx: rand(2, 4),
                    opacity: rand(0.3, 0.6),
                });
            },
            update(p) {
                p.y += p.vy;
                p.x += p.vx;
                return p.y < _vh() + 20;
            },
            draw(p) {
                ctx.globalAlpha = p.opacity;
                ctx.strokeStyle = '#a0c4ff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.vx, p.y + p.len);
                ctx.stroke();
            },
            interval: 30,
        },

        // ── 4. SAO RƠI ────────────────────────────────────────────────
        stars: {
            spawn() {
                particles.push({
                    x: rand(0, _vw()),
                    y: -10,
                    size: rand(8, 16),
                    vy: rand(0.8, 2),
                    vx: rand(-0.3, 0.3),
                    rot: 0,
                    rotSpeed: rand(-0.05, 0.05),
                    opacity: rand(0.6, 1),
                    color: ['#ffd700', '#fff5b1', '#ffeaa7', '#fff'][randI(0, 3)],
                });
            },
            update(p) {
                p.y += p.vy;
                p.x += p.vx;
                p.rot += p.rotSpeed;
                p.opacity = 0.5 + Math.abs(Math.sin(p.y * 0.05)) * 0.5;
                return p.y < _vh() + 20;
            },
            draw(p) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;
                drawStar(0, 0, 5, p.size, p.size / 2);
                ctx.restore();
            },
            interval: 150,
        },

        // ── 5. CÁNH HOA RƠI ───────────────────────────────────────────
        petals: {
            spawn() {
                particles.push({
                    x: rand(0, _vw()),
                    y: -20,
                    size: rand(8, 16),
                    vy: rand(1, 2),
                    vx: rand(-1, 1),
                    rot: rand(0, Math.PI * 2),
                    rotSpeed: rand(-0.05, 0.05),
                    opacity: rand(0.7, 1),
                    color: ['#ffb6c1', '#ffc0cb', '#ffd1dc', '#fff0f5', '#f8bbd0'][randI(0, 4)],
                });
            },
            update(p) {
                p.y += p.vy;
                p.x += p.vx + Math.sin(p.y * 0.02) * 1.2;
                p.rot += p.rotSpeed;
                return p.y < _vh() + 30;
            },
            draw(p) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            },
            interval: 180,
        },

        // ── 6. BONG BÓNG BAY LÊN ──────────────────────────────────────
        bubbles: {
            spawn() {
                particles.push({
                    x: rand(0, _vw()),
                    y: _vh() + 20,
                    r: rand(8, 22),
                    vy: rand(-2, -0.8),
                    vx: rand(-0.4, 0.4),
                    opacity: rand(0.3, 0.7),
                });
            },
            update(p) {
                p.y += p.vy;
                p.x += p.vx + Math.sin(p.y * 0.02) * 0.8;
                return p.y > -30;
            },
            draw(p) {
                ctx.globalAlpha = p.opacity;
                ctx.strokeStyle = 'rgba(180, 220, 255, 0.9)';
                ctx.lineWidth = 1.5;
                ctx.fillStyle = 'rgba(200, 230, 255, 0.2)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                // Highlight
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.beginPath();
                ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.2, 0, Math.PI * 2);
                ctx.fill();
            },
            interval: 250,
        },

        // ── 7. ĐOM ĐÓM BAY ───────────────────────────────────────────
        fireflies: {
            spawn() {
                const maxCount = Math.max(8, Math.floor(22 * density));
                if (particles.length >= maxCount) return;
                const colors = ['#c8ff78', '#aeff60', '#d4ff8a', '#ffef78', '#b8ff90'];
                particles.push({
                    x:          rand(0, _vw()),
                    y:          rand(_vh() * 0.08, _vh() * 0.95),
                    r:          rand(1.6, 2.8) * sizeScale,
                    angle:      rand(0, Math.PI * 2),
                    spd:        rand(0.25, 0.70),
                    turnRate:   rand(0.008, 0.028),
                    turnDir:    Math.random() < 0.5 ? 1 : -1,
                    phase:      rand(0, Math.PI * 2),
                    blinkSpd:   rand(0.004, 0.010),
                    color:      colors[randI(0, colors.length - 1)],
                });
            },
            update(p) {
                // Bay theo cung cong tự nhiên, thỉnh thoảng đổi hướng quẹo
                p.angle += p.turnRate * p.turnDir;
                if (Math.random() < 0.004) p.turnDir *= -1;
                p.x += Math.cos(p.angle) * p.spd * speed;
                p.y += Math.sin(p.angle) * p.spd * speed;
                // Dội nhẹ ở biên, đổi hướng bay vào trong
                if (p.x < 10)                      { p.angle = rand(-0.4, 0.4);              p.x = 10; }
                if (p.x > _vw()  - 10) { p.angle = Math.PI + rand(-0.4, 0.4);   p.x = _vw()  - 10; }
                if (p.y < 10)                      { p.angle = rand(0.1, Math.PI - 0.1);     p.y = 10; }
                if (p.y > _vh() - 10) { p.angle = rand(-Math.PI + 0.1, -0.1);  p.y = _vh() - 10; }
                p.phase += p.blinkSpd;
                return true;
            },
            draw(p) {
                // Nhấp nháy: sin^3 → tối lâu, sáng chớp nhanh (giống đom đóm thật)
                const pulse = Math.pow(Math.max(0, Math.sin(p.phase)), 3);
                if (pulse < 0.015) return; // đang tắt, bỏ qua

                const glowR = p.r * (4 + pulse * 6);

                // Vầng sáng lan toả
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
                grad.addColorStop(0,   `rgba(200,255,100,${(pulse * 0.60).toFixed(2)})`);
                grad.addColorStop(0.4, `rgba(170,255, 60,${(pulse * 0.22).toFixed(2)})`);
                grad.addColorStop(1,   'rgba(80,180,20,0)');
                ctx.globalAlpha = 1;
                ctx.fillStyle   = grad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
                ctx.fill();

                // Lõi sáng trắng
                ctx.shadowColor = p.color;
                ctx.shadowBlur  = 10 * pulse;
                ctx.globalAlpha = 0.55 + pulse * 0.45;
                ctx.fillStyle   = `rgba(255,255,230,${pulse.toFixed(2)})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * (0.4 + pulse * 0.6), 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur  = 0;
                ctx.globalAlpha = 1;
            },
            interval: 120,
        },

        // ── 8. BƯỚM BAY ───────────────────────────────────────────────
        butterflies: {
            spawn() {
                const maxCount = Math.max(4, Math.floor(10 * density));
                if (particles.length >= maxCount) return;
                const palettes = [
                    { wing: '#f4b8d0', spot: '#d97fab', inner: '#fff5fa' },
                    { wing: '#c5b4e3', spot: '#9078c8', inner: '#f7f4ff' },
                    { wing: '#f9d8a0', spot: '#d4943a', inner: '#fffef5' },
                    { wing: '#a8d8ea', spot: '#5b9fb8', inner: '#f0faff' },
                    { wing: '#f7c5a0', spot: '#d47840', inner: '#fff8f2' },
                    { wing: '#b8e0c8', spot: '#5a9870', inner: '#f0fff6' },
                ];
                const pal = palettes[randI(0, palettes.length - 1)];
                particles.push({
                    x: rand(-20, _vw() + 20),
                    y: rand(_vh() * 0.05, _vh() * 0.92),
                    size: rand(14, 24) * sizeScale,
                    angle: rand(0, Math.PI * 2),
                    spd: rand(0.5, 1.2),
                    flapPhase: rand(0, Math.PI * 2),
                    flapSpeed: rand(0.07, 0.13),
                    wobble: rand(0, Math.PI * 2),
                    wobbleAmp: rand(0.25, 0.55),
                    wingColor: pal.wing,
                    spotColor: pal.spot,
                    innerColor: pal.inner,
                });
            },
            update(p) {
                p.wobble    += 0.03;
                p.angle     += rand(-0.03, 0.03);
                p.flapPhase += p.flapSpeed;
                p.x += Math.cos(p.angle) * p.spd * speed;
                p.y += Math.sin(p.angle) * p.spd * speed + Math.sin(p.wobble) * p.wobbleAmp;
                if (p.x < -60) p.x = _vw()  + 50;
                if (p.x > _vw()  + 60) p.x = -50;
                if (p.y < -60) p.y = _vh() + 50;
                if (p.y > _vh() + 60) p.y = -50;
                return true;
            },
            draw(p) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(Math.sin(p.wobble * 0.35) * 0.15);

                const sz   = p.size;
                // cos² cho hiệu ứng vỗ cánh mềm mại, tự nhiên hơn
                const flap = 0.22 + 0.78 * Math.pow(Math.cos(p.flapPhase), 2);

                for (const side of [-1, 1]) {
                    ctx.save();
                    ctx.scale(side * flap, 1);

                    // Cánh trên — rộng, tam giác bo tròn như 🦋
                    ctx.beginPath();
                    ctx.moveTo(1, -sz*0.06);
                    ctx.bezierCurveTo(sz*0.55, -sz*0.04, sz*1.08, -sz*0.32, sz*0.88, -sz*0.78);
                    ctx.bezierCurveTo(sz*0.68, -sz*1.02, sz*0.18, -sz*0.96, 1, -sz*0.06);
                    const gu = ctx.createRadialGradient(sz*0.5, -sz*0.46, sz*0.03, sz*0.5, -sz*0.46, sz*0.78);
                    gu.addColorStop(0,    p.innerColor);
                    gu.addColorStop(0.48, p.wingColor);
                    gu.addColorStop(1,    p.spotColor);
                    ctx.fillStyle   = gu;
                    ctx.globalAlpha = 0.90;
                    ctx.fill();
                    ctx.strokeStyle = p.spotColor;
                    ctx.lineWidth   = 0.7;
                    ctx.globalAlpha = 0.32;
                    ctx.stroke();

                    // Cánh dưới — nhỏ, tròn, hình quạt như 🦋
                    ctx.beginPath();
                    ctx.moveTo(1, sz*0.05);
                    ctx.bezierCurveTo(sz*0.5, sz*0.03, sz*0.90, sz*0.46, sz*0.54, sz*0.80);
                    ctx.bezierCurveTo(sz*0.24, sz*0.94, sz*0.04, sz*0.46, 1, sz*0.05);
                    const gl = ctx.createRadialGradient(sz*0.38, sz*0.42, sz*0.03, sz*0.38, sz*0.42, sz*0.60);
                    gl.addColorStop(0,    p.innerColor);
                    gl.addColorStop(0.55, p.wingColor);
                    gl.addColorStop(1,    p.spotColor);
                    ctx.fillStyle   = gl;
                    ctx.globalAlpha = 0.84;
                    ctx.fill();
                    ctx.strokeStyle = p.spotColor;
                    ctx.globalAlpha = 0.26;
                    ctx.stroke();

                    // Đốm trang trí
                    ctx.fillStyle   = p.spotColor;
                    ctx.globalAlpha = 0.38;
                    ctx.beginPath();
                    ctx.arc(sz*0.54, -sz*0.44, sz*0.09, 0, Math.PI*2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(sz*0.38, sz*0.42, sz*0.07, 0, Math.PI*2);
                    ctx.fill();

                    ctx.restore();
                }

                // Thân — ngắn, thon
                ctx.globalAlpha = 1;
                const bg = ctx.createLinearGradient(0, -sz*0.30, 0, sz*0.20);
                bg.addColorStop(0, '#6a4060');
                bg.addColorStop(1, '#2a1830');
                ctx.fillStyle = bg;
                ctx.beginPath();
                ctx.ellipse(0, -sz*0.04, sz*0.06, sz*0.22, 0, 0, Math.PI*2);
                ctx.fill();

                // Đầu
                ctx.beginPath();
                ctx.arc(0, -sz*0.30, sz*0.08, 0, Math.PI*2);
                ctx.fillStyle = '#4a2a50';
                ctx.fill();

                // Râu — cong nhẹ ra ngoài, ngắn gọn
                ctx.strokeStyle = '#3a1a40';
                ctx.lineWidth   = sz * 0.036;
                ctx.globalAlpha = 0.88;
                ctx.lineCap     = 'round';
                ctx.beginPath();
                ctx.moveTo(-sz*0.05, -sz*0.37);
                ctx.quadraticCurveTo(-sz*0.24, -sz*0.56, -sz*0.12, -sz*0.68);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(sz*0.05, -sz*0.37);
                ctx.quadraticCurveTo(sz*0.24, -sz*0.56, sz*0.12, -sz*0.68);
                ctx.stroke();
                // Đầu râu (club tròn)
                ctx.globalAlpha = 1;
                ctx.fillStyle   = '#3a1a40';
                ctx.beginPath();
                ctx.arc(-sz*0.12, -sz*0.68, sz*0.055, 0, Math.PI*2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(sz*0.12, -sz*0.68, sz*0.055, 0, Math.PI*2);
                ctx.fill();

                ctx.restore();
            },
            interval: 700,
        },

        // ── 9. LÁ RƠI ─────────────────────────────────────────────────
        leaves: {
            spawn() {
                particles.push({
                    x: rand(0, _vw()),
                    y: -20,
                    size: rand(10, 20),
                    vy: rand(1, 2),
                    vx: rand(-1, 1),
                    rot: rand(0, Math.PI * 2),
                    rotSpeed: rand(-0.06, 0.06),
                    color: ['#d4a574', '#c08552', '#a0522d', '#cd853f', '#daa520'][randI(0, 4)],
                });
            },
            update(p) {
                p.y += p.vy;
                p.x += p.vx + Math.sin(p.y * 0.025) * 1.5;
                p.rot += p.rotSpeed;
                return p.y < _vh() + 30;
            },
            draw(p) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.moveTo(0, -p.size);
                ctx.bezierCurveTo(p.size * 0.6, -p.size * 0.5, p.size * 0.6, p.size * 0.5, 0, p.size);
                ctx.bezierCurveTo(-p.size * 0.6, p.size * 0.5, -p.size * 0.6, -p.size * 0.5, 0, -p.size);
                ctx.fill();
                // Gân lá
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, -p.size);
                ctx.lineTo(0, p.size);
                ctx.stroke();
                ctx.restore();
            },
            interval: 200,
        },

        // ── 10. KIM TUYẾN RƠI ─────────────────────────────────────────
        confetti: {
            spawn() {
                particles.push({
                    x: rand(0, _vw()),
                    y: -10,
                    w: rand(6, 12),
                    h: rand(3, 6),
                    vy: rand(2, 4),
                    vx: rand(-1, 1),
                    rot: rand(0, Math.PI * 2),
                    rotSpeed: rand(-0.2, 0.2),
                    color: ['#ff5a5f', '#ffd700', '#7afcff', '#ff7eb9', '#a0e7e5', '#ffaaa5'][randI(0, 5)],
                });
            },
            update(p) {
                p.y += p.vy;
                p.x += p.vx;
                p.rot += p.rotSpeed;
                return p.y < _vh() + 20;
            },
            draw(p) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            },
            interval: 80,
        },

        // ── 11. LẤP LÁNH ──────────────────────────────────────────────
        sparkles: {
            spawn() {
                particles.push({
                    x: rand(0, _vw()),
                    y: rand(0, _vh()),
                    size: rand(3, 8),
                    life: 0,
                    maxLife: rand(40, 80),
                    color: ['#fff', '#ffd700', '#fff5b1', '#ffe1f0'][randI(0, 3)],
                });
            },
            update(p) {
                p.life++;
                return p.life < p.maxLife;
            },
            draw(p) {
                const t = p.life / p.maxLife;
                const opacity = Math.sin(t * Math.PI);
                ctx.globalAlpha = opacity;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 10;
                drawSparkle(p.x, p.y, p.size);
                ctx.shadowBlur = 0;
            },
            interval: 100,
        },

        // ── 12. NỐT NHẠC BAY ──────────────────────────────────────────
        musicNotes: {
            spawn() {
                particles.push({
                    x: rand(0, _vw()),
                    y: _vh() + 20,
                    size: rand(16, 24),
                    vy: rand(-1.5, -0.8),
                    vx: rand(-0.3, 0.3),
                    rot: 0,
                    rotSpeed: rand(-0.03, 0.03),
                    opacity: rand(0.5, 0.9),
                    note: ['♪', '♫', '♬', '♩'][randI(0, 3)],
                    color: ['#ff5a5f', '#7e57c2', '#26c6da', '#ffa726'][randI(0, 3)],
                });
            },
            update(p) {
                p.y += p.vy;
                p.x += p.vx + Math.sin(p.y * 0.02) * 0.6;
                p.rot += p.rotSpeed;
                return p.y > -30;
            },
            draw(p) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.font = `bold ${p.size}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(p.note, 0, 0);
                ctx.restore();
            },
            interval: 400,
        },

        // ── 13. NGÔI SAO RƠI (ẢNH) ────────────────────────────────────
        starSprite: {
            _img: null,
            _img2: null,
            _ready: false,
            _loadStarted: false,
            spawn() {
                if (!this._loadStarted) {
                    this._loadStarted = true;
                    const img = new Image();
                    img.onload = () => { this._img = img; if (this._img2) this._ready = true; };
                    img.src = 'assets/image/effect/start-effect.webp';
                    const img2 = new Image();
                    img2.onload = () => { this._img2 = img2; if (this._img) this._ready = true; };
                    img2.src = 'assets/image/effect/start-effect-2.webp';
                }
                if (!this._ready) return;
                const imgs = [this._img, this._img2].filter(Boolean);
                particles.push({
                    x: rand(0, _vw()),
                    y: -50,
                    size: rand(24, 52),
                    vy: rand(0.8, 2.2),
                    vx: rand(-0.8, 0.8),
                    rot: rand(0, Math.PI * 2),
                    rotSpeed: rand(-0.04, 0.04),
                    opacity: rand(0.7, 1),
                    img: imgs[randI(0, imgs.length - 1)],
                });
            },
            update(p) {
                p.y += p.vy;
                p.x += p.vx + Math.sin(p.y * 0.02) * 0.8;
                p.rot += p.rotSpeed;
                return p.y < _vh() + 60;
            },
            draw(p) {
                if (!p.img) return;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.globalAlpha = p.opacity;
                ctx.drawImage(p.img, -p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            },
            interval: 300,
        },
    };

    // ═══════════════════════════════════════════════════════════════════
    // ▓▓▓ HIỆU ỨNG KÍCH HOẠT (ONE-SHOT) ▓▓▓
    // ═══════════════════════════════════════════════════════════════════

    const triggers = {

        // ── PHÁO HOA NỔ ───────────────────────────────────────────────
        firework(x, y) {
            x = x ?? rand(_vw() * 0.2, _vw() * 0.8);
            y = y ?? rand(_vh() * 0.2, _vh() * 0.5);
            const colors = ['#ff5a5f', '#ffd700', '#7afcff', '#ff7eb9', '#a0e7e5'];
            const color = colors[randI(0, colors.length - 1)];
            const count = 60;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count;
                const speed = rand(2, 6);
                particles.push({
                    _trigger: true,
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    r: rand(2, 4),
                    life: 0,
                    maxLife: rand(50, 90),
                    color,
                    gravity: 0.08,
                });
            }
            ensureRunning();
        },

        // ── TIM NỔ ────────────────────────────────────────────────────
        heartBurst(x, y) {
            x = x ?? _vw() / 2;
            y = y ?? _vh() / 2;
            const count = 25;
            for (let i = 0; i < count; i++) {
                const angle = rand(0, Math.PI * 2);
                const speed = rand(2, 5);
                particles.push({
                    _trigger: true,
                    _heart: true,
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 1,
                    size: rand(10, 18),
                    rot: rand(0, Math.PI * 2),
                    life: 0,
                    maxLife: 80,
                    color: ['#ff5a5f', '#ff8fa3', '#ff4081'][randI(0, 2)],
                    gravity: 0.12,
                });
            }
            ensureRunning();
        },

        // ── PHÁO GIẤY NỔ ──────────────────────────────────────────────
        confettiBurst(x, y) {
            x = x ?? _vw() / 2;
            y = y ?? _vh() / 2;
            const colors = ['#ff5a5f', '#ffd700', '#7afcff', '#ff7eb9', '#a0e7e5', '#ffaaa5'];
            const count = 80;
            for (let i = 0; i < count; i++) {
                const angle = rand(0, Math.PI * 2);
                const speed = rand(3, 8);
                particles.push({
                    _trigger: true,
                    _confetti: true,
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2,
                    w: rand(6, 12),
                    h: rand(3, 6),
                    rot: rand(0, Math.PI * 2),
                    rotSpeed: rand(-0.3, 0.3),
                    life: 0,
                    maxLife: 100,
                    color: colors[randI(0, colors.length - 1)],
                    gravity: 0.15,
                });
            }
            ensureRunning();
        },

        // ── SAO NỔ ────────────────────────────────────────────────────
        starBurst(x, y) {
            x = x ?? _vw() / 2;
            y = y ?? _vh() / 2;
            const count = 30;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count;
                const speed = rand(2, 5);
                particles.push({
                    _trigger: true,
                    _star: true,
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: rand(6, 12),
                    rot: 0,
                    rotSpeed: rand(-0.1, 0.1),
                    life: 0,
                    maxLife: 70,
                    color: '#ffd700',
                    gravity: 0.05,
                });
            }
            ensureRunning();
        },

        // ── NHẪN LAN TOẢ ──────────────────────────────────────────────
        ringPulse(x, y) {
            x = x ?? _vw() / 2;
            y = y ?? _vh() / 2;
            for (let i = 0; i < 3; i++) {
                particles.push({
                    _trigger: true,
                    _ring: true,
                    x, y,
                    r: 10,
                    life: -i * 15, // delay từng vòng
                    maxLife: 80,
                    color: ['#ff5a5f', '#ffd700', '#fff'][i],
                });
            }
            ensureRunning();
        },
    };

    // ═══════════════════════════════════════════════════════════════════
    // ▓▓▓ DRAW HELPERS ▓▓▓
    // ═══════════════════════════════════════════════════════════════════

    function drawHeart(x, y, size) {
        ctx.beginPath();
        const s = size / 30;
        ctx.moveTo(x, y + 5 * s);
        ctx.bezierCurveTo(x, y, x - 15 * s, y, x - 15 * s, y - 7 * s);
        ctx.bezierCurveTo(x - 15 * s, y - 15 * s, x, y - 15 * s, x, y - 5 * s);
        ctx.bezierCurveTo(x, y - 15 * s, x + 15 * s, y - 15 * s, x + 15 * s, y - 7 * s);
        ctx.bezierCurveTo(x + 15 * s, y, x, y, x, y + 5 * s);
        ctx.fill();
    }

    function drawStar(cx, cy, spikes, outerR, innerR) {
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerR);
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerR);
        ctx.closePath();
        ctx.fill();
    }

    function drawSparkle(x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.2, y - size * 0.2);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + size * 0.2, y + size * 0.2);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size * 0.2, y + size * 0.2);
        ctx.lineTo(x - size, y);
        ctx.lineTo(x - size * 0.2, y - size * 0.2);
        ctx.closePath();
        ctx.fill();
    }

    // ═══════════════════════════════════════════════════════════════════
    // ▓▓▓ ANIMATION LOOP ▓▓▓
    // ═══════════════════════════════════════════════════════════════════

    function ensureRunning() {
        ensureCanvas();
        if (animationId == null) loop();
    }

    function loop() {
        clearCanvas();
        const now = performance.now();

        // Delta-time chuẩn hoá theo mốc 60fps — nếu không, tốc độ hiệu ứng (p.y += p.vy mỗi
        // lần requestAnimationFrame chạy) sẽ phụ thuộc tần số quét màn hình thực tế của thiết bị
        // (điện thoại thường 60Hz, máy tính có thể 120/144Hz...), khiến hiệu ứng rơi nhanh/chậm
        // khác nhau giữa các máy dù cùng 1 đoạn code. Giới hạn tối đa 3 để tránh giật hình khi
        // tab bị treo/chuyển nền rồi quay lại (khoảng cách giữa 2 frame quá lớn).
        const dt = lastFrameTime ? Math.min((now - lastFrameTime) / (1000 / 60), 3) : 1;
        lastFrameTime = now;

        // Spawn particles cho hiệu ứng tự chạy — interval chia density (density cao = spawn nhanh hơn)
        if (currentEffect && effects[currentEffect]) {
            const eff = effects[currentEffect];
            const adjustedInterval = eff.interval / Math.max(0.1, density);
            if (now - lastSpawn > adjustedInterval) {
                eff.spawn();
                lastSpawn = now;
            }
        }

        // Update + draw
        particles = particles.filter(p => {
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;

            if (p._trigger) {
                // Particle one-shot
                p.life += dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                if (p.gravity) p.vy += p.gravity * dt;
                if (p.rotSpeed) p.rot += p.rotSpeed * dt;

                const t = p.life / p.maxLife;
                ctx.globalAlpha = Math.max(0, 1 - t);

                if (p._heart) {
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rot);
                    ctx.fillStyle = p.color;
                    drawHeart(0, 0, p.size);
                    ctx.restore();
                } else if (p._confetti) {
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rot);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                    ctx.restore();
                } else if (p._star) {
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rot);
                    ctx.fillStyle = p.color;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 8;
                    drawStar(0, 0, 5, p.size, p.size / 2);
                    ctx.restore();
                } else if (p._ring) {
                    if (p.life < 0) return true;
                    p.r += 4 * dt;
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 3 * (1 - t);
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    // pháo hoa cơ bản
                    ctx.fillStyle = p.color;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();
                }
                return p.life < p.maxLife;
            } else {
                // Particle loop — áp dụng speed bằng cách scale chuyển động
                const eff = effects[currentEffect];
                if (!eff) return false;

                // Lưu lại vận tốc gốc lần đầu, sau đó scale theo speed mỗi frame
                if (p._origVy === undefined) {
                    p._origVy = p.vy ?? 0;
                    p._origVx = p.vx ?? 0;
                }
                p.vy = p._origVy * speed * dt;
                p.vx = p._origVx * speed * dt;

                const alive = eff.update(p);
                if (alive) {
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.scale(sizeScale, sizeScale);
                    ctx.translate(-p.x, -p.y);
                    eff.draw(p);
                    ctx.restore();
                }
                return alive;
            }
        });

        // Tiếp tục loop nếu còn hiệu ứng đang chạy hoặc còn particle
        if (currentEffect || particles.length > 0) {
            animationId = requestAnimationFrame(loop);
        } else {
            animationId = null;
            clearCanvas();
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ▓▓▓ PUBLIC API ▓▓▓
    // ═══════════════════════════════════════════════════════════════════

    const Effects = {
        // Bắt đầu hiệu ứng tự chạy
        start(name) {
            if (!effects[name]) {
                console.warn('Effect không tồn tại:', name);
                return;
            }
            this.stop();
            currentEffect = name;
            lastSpawn = 0;
            ensureRunning();
        },

        // Dừng hiệu ứng đang chạy
        stop() {
            currentEffect = null;
            // Particles tự chạy sẽ biến mất, các particle one-shot tiếp tục đến hết life
            particles = particles.filter(p => p._trigger);
        },

        // Dừng hoàn toàn, xoá luôn one-shot
        clear() {
            currentEffect = null;
            particles = [];
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            lastFrameTime = 0;
            clearCanvas();
        },

        // Kích hoạt hiệu ứng one-shot
        trigger(name, x, y) {
            if (!triggers[name]) {
                console.warn('Trigger không tồn tại:', name);
                return;
            }
            triggers[name](x, y);
        },

        // Lấy danh sách hiệu ứng
        listAuto() {
            return Object.keys(effects);
        },
        listTrigger() {
            return Object.keys(triggers);
        },

        // Hiệu ứng hiện tại
        getCurrent() {
            return currentEffect;
        },

        // Điều chỉnh tốc độ (0.2 - 3, mặc định 1)
        setSpeed(v) {
            speed = Math.max(0.1, Math.min(5, parseFloat(v) || 1));
        },

        // Điều chỉnh mật độ (0.2 - 3, mặc định 1)
        setDensity(v) {
            density = Math.max(0.1, Math.min(5, parseFloat(v) || 1));
        },

        // Điều chỉnh kích thước (0.1 - 5, mặc định 1)
        setSize(v) {
            sizeScale = Math.max(0.1, Math.min(5, parseFloat(v) || 1));
        },

        getSpeed() { return speed; },
        getDensity() { return density; },
        getSize() { return sizeScale; },
    };

    window.Effects = Effects;

})(window);