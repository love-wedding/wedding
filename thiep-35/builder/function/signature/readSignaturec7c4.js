/* ── readSignature.js — Load & render saved signatures ────── */
(function () {
    'use strict';

    var BASE  = (typeof window._wbSigBase     !== 'undefined') ? window._wbSigBase     : '';
    var UTAG  = (typeof defaultUserTag         !== 'undefined') ? defaultUserTag         : '';
    var AKEY  = (typeof window._wbSigAdminKey  !== 'undefined') ? window._wbSigAdminKey  : '';
    var getS  = function () { return (typeof sizeSignature !== 'undefined') ? +sizeSignature : 15; };

    var urlP    = new URLSearchParams(window.location.search);
    var isAdmin = AKEY !== '' && urlP.get('sigAdmin') === AKEY;

    var dispIn = document.getElementById('wb-sig-display-inner');
    var dispEl = document.getElementById('wb-sig-display');
    if (!dispIn) return;

    /* ── Idle shimmer ─────────────────────────────────────── */
    var _shimmerTimer = null;

    function _stopShimmer() {
        if (_shimmerTimer) { clearTimeout(_shimmerTimer); _shimmerTimer = null; }
    }

    function _scheduleShimmer(arr) {
        var wait = 1200 + Math.random() * 1800; /* 1.2–3s giữa các lượt */
        _shimmerTimer = setTimeout(function () {
            var live = arr.filter(function (el) { return el.isConnected && !el.classList.contains('wb-sig-idle-pop'); });
            if (!live.length) { _scheduleShimmer(arr); return; }
            /* Pick 2–3 random items */
            var picks = live.slice().sort(function () { return Math.random() - .5; })
                            .slice(0, 2 + Math.floor(Math.random() * 2));
            picks.forEach(function (item) {
                item.classList.remove('wb-sig-idle-pop');
                void item.offsetWidth; /* reflow */
                item.classList.add('wb-sig-idle-pop');
                item.addEventListener('animationend', function h() {
                    item.classList.remove('wb-sig-idle-pop');
                    item.removeEventListener('animationend', h);
                });
            });
            _scheduleShimmer(arr.filter(function (el) { return el.isConnected; }));
        }, wait);
    }

    /* ── Render list ──────────────────────────────────────── */
    function render(list) {
        _stopShimmer();
        dispIn.querySelectorAll('.wb-sig-item:not(.pending)').forEach(function (el) { el.remove(); });
        if (!list || !list.length) return;

        /* Identify newly saved signature (set by kyTen.js after save) */
        var newSigId = window._wbNewSigId ? String(window._wbNewSigId) : null;
        if (newSigId) { window._wbNewSigId = null; } /* consume flag */

        /* Distribute reveal delays in [1.0, 3.0]s window with slight jitter */
        var n = list.length;
        list.forEach(function (sig, i) {
            var isNew   = newSigId && String(sig.id) === newSigId;
            var spread  = n > 1 ? i / (n - 1) : 0;
            var jitter  = (Math.random() - 0.5) * 0.3;
            var delay   = isNew ? 0.2 : Math.max(1.0, Math.min(3.0, 1.0 + spread * 2.0 + jitter));

            var item = document.createElement('div');
            item.className     = 'wb-sig-item' + (isAdmin ? ' admin-mode' : '');
            item.dataset.id    = sig.id;
            item.dataset.delay = delay.toFixed(2);
            if (isNew) item.dataset.grand = '1';
            item.style.cssText =
                'width:13%;' +
                'left:' + (sig.pos_x != null ? +sig.pos_x : 35) + '%;' +
                'top:'  + (sig.pos_y != null ? +sig.pos_y : 35) + '%;';

            var img = document.createElement('img');
            img.src = sig.image_path || '';
            item.appendChild(img);

            if (isAdmin) {
                var del = document.createElement('button');
                del.className   = 'wb-sig-del-btn';
                del.title       = 'Xóa chữ ký';
                if (typeof window.wbSigIcon === 'function') del.innerHTML = window.wbSigIcon('x'); else del.textContent = '✕';
                del.addEventListener('click', function (e) {
                    e.stopPropagation();
                    wbSig2Confirm('Xóa chữ ký này?', function () { _del(sig.id, item); });
                });
                item.appendChild(del);
                _initAdminDrag(item, sig);
            }

            dispIn.appendChild(item);
        });

        _initScrollReveal();
    }

    /* ── Scroll-reveal via IntersectionObserver ───────────── */
    var _revealDone = false;
    var _revealIO   = null;

    function _initScrollReveal() {
        var rect   = dispEl.getBoundingClientRect();
        var inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (_revealDone || inView) { _revealAll(); return; }
        if (typeof IntersectionObserver === 'undefined') { _revealAll(); return; }
        if (_revealIO) return;
        _revealIO = new IntersectionObserver(function (entries) {
            if (!entries[0].isIntersecting) return;
            _revealIO.disconnect();
            _revealIO   = null;
            _revealDone = true;
            _revealAll();
        }, { threshold: 0.15 });
        _revealIO.observe(dispEl);
    }

    function _bakeState(item, animName) {
        item.addEventListener('animationend', function h(e) {
            if (e.animationName !== animName) return;
            item.removeEventListener('animationend', h);
            item.classList.remove('wb-sig-firework', 'wb-sig-grand');
            item.style.animationDelay = '';
            item.style.opacity = '1';
            item.style.filter  = 'drop-shadow(0 2px 8px rgba(0,0,0,.18))';
        });
    }

    /* ── Grand splash: bloom + sparkle particles ─────────────── */
    function _grandSplash(item) {
        var delayMs = (parseFloat(item.style.animationDelay) || 0.2) * 1000;
        /* Fire at firework peak (~12% of 2s animation after delay) */
        setTimeout(function () {
            if (!item.isConnected) return;

            var diR = dispIn.getBoundingClientRect();
            var itR = item.getBoundingClientRect();
            var cx  = itR.left - diR.left + itR.width  / 2;  /* px from dispIn left */
            var cy  = itR.top  - diR.top  + itR.height / 2;  /* px from dispIn top  */
            var imgSrc = item.querySelector('img').src;

            /* Bloom rings */
            ['b1', 'b2'].forEach(function (cls, bi) {
                var bloom = document.createElement('div');
                bloom.className = 'wb-sig-bloom ' + cls;
                bloom.style.cssText =
                    'left:'  + item.style.left  + ';' +
                    'top:'   + item.style.top   + ';' +
                    'width:' + item.style.width + ';';
                var bi2 = document.createElement('img');
                bi2.src = imgSrc;
                bloom.appendChild(bi2);
                bloom.addEventListener('animationend', function () { bloom.remove(); });
                dispIn.insertBefore(bloom, item);
            });

            /* Sparkle particles */
            var colors = ['#ffe066','#fff5a0','#ffd700','#ffffff','#ffb830','#fffacd','#ffc844'];
            var count = 20;
            for (var i = 0; i < count; i++) {
                (function (idx) {
                    var spark = document.createElement('div');
                    var angle = (idx / count) * Math.PI * 2 + Math.random() * 0.3;
                    var dist  = 50 + Math.random() * 80;
                    var dx    = Math.cos(angle) * dist;
                    var dy    = Math.sin(angle) * dist;
                    var dur   = 700 + Math.random() * 600;
                    var size  = 5 + Math.floor(Math.random() * 9);
                    var col   = colors[idx % colors.length];
                    spark.style.cssText =
                        'position:absolute;' +
                        'left:' + cx + 'px;top:' + cy + 'px;' +
                        'width:' + size + 'px;height:' + size + 'px;' +
                        'border-radius:50%;background:' + col + ';' +
                        'box-shadow:0 0 8px 3px ' + col + ';' +
                        'pointer-events:none;z-index:30;';
                    dispIn.appendChild(spark);
                    if (spark.animate) {
                        spark.animate([
                            { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
                            { transform: 'translate(calc(-50% + ' + dx + 'px),calc(-50% + ' + dy + 'px)) scale(0)', opacity: 0 }
                        ], { duration: dur, easing: 'ease-out', fill: 'forwards', delay: Math.random() * 120 })
                        .addEventListener('finish', function () { spark.remove(); });
                    } else {
                        setTimeout(function () { spark.remove(); }, dur + 150);
                    }
                })(i);
            }
        }, delayMs + 240);
    }

    function _revealAll() {
        var items = Array.from(dispIn.querySelectorAll('.wb-sig-item:not(.pending)'));
        var maxDelay = 0;
        items.forEach(function (item) {
            var d       = parseFloat(item.dataset.delay) || 1;
            var isGrand = item.dataset.grand === '1';
            if (d > maxDelay) maxDelay = d;
            item.style.animationDelay = d + 's';
            if (isGrand) {
                item.classList.add('wb-sig-grand');
                _bakeState(item, 'wbSigGrand');
                _grandSplash(item);
            } else {
                item.classList.add('wb-sig-firework');
                _bakeState(item, 'wbSigFirework');
            }
        });
        /* Start idle shimmer after all firework animations finish */
        if (items.length) {
            _stopShimmer();
            _shimmerTimer = setTimeout(function () {
                _scheduleShimmer(items);
            }, (maxDelay + 1.1) * 1000);
        }
    }

    /* ── Admin drag ───────────────────────────────────────── */
    function _initAdminDrag(el, sig) {
        var grabX, grabY, active = false;
        el.addEventListener('pointerdown', function (e) {
            if (e.target.classList.contains('wb-sig-del-btn')) return;
            e.preventDefault();
            active = true;
            el.setPointerCapture(e.pointerId);
            el.classList.add('dragging');
            var elRect = el.getBoundingClientRect();
            grabX = e.clientX - elRect.left;
            grabY = e.clientY - elRect.top;
        });
        el.addEventListener('pointermove', function (e) {
            if (!active) return;
            var dr   = dispEl.getBoundingClientRect();
            var maxX = 100 - el.offsetWidth  / dr.width  * 100;
            var maxY = 100 - el.offsetHeight / dr.height * 100;
            sig.pos_x = Math.max(0, Math.min(maxX, (e.clientX - dr.left - grabX) / dr.width  * 100));
            sig.pos_y = Math.max(0, Math.min(maxY, (e.clientY - dr.top  - grabY) / dr.height * 100));
            el.style.left = sig.pos_x + '%';
            el.style.top  = sig.pos_y + '%';
        });
        el.addEventListener('pointerup', function () {
            if (!active) return;
            active = false;
            el.classList.remove('dragging');
            _savePos(sig.id, sig.pos_x, sig.pos_y);
        });
        el.addEventListener('pointercancel', function () {
            active = false;
            el.classList.remove('dragging');
        });
    }

    /* ── API ──────────────────────────────────────────────── */
    function _savePos(id, x, y) {
        fetch(BASE + 'save_signature.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ update_position: true, id: id, pos_x: +(+x).toFixed(1), pos_y: +(+y).toFixed(1), adminKey: AKEY })
        }).then(function (r) { return r.json(); })
          .then(function (res) { if (!res.success) wbSig2Alert('Không thể lưu vị trí.', 'error'); })
          .catch(function () { wbSig2Alert('Lỗi kết nối.', 'error'); });
    }

    function _del(id, el) {
        fetch(BASE + 'delete_signature.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ id: id, adminKey: AKEY })
        }).then(function (r) { return r.json(); })
          .then(function (res) {
              if (res.success) {
                  el.style.transition = 'opacity .3s,transform .3s';
                  el.style.opacity    = '0';
                  el.style.transform  = 'scale(.5)';
                  setTimeout(function () { el.remove(); }, 320);
                  wbSig2Alert('Đã xóa chữ ký.', 'success');
              } else { wbSig2Alert(res.error || 'Không thể xóa.', 'error'); }
          })
          .catch(function () { wbSig2Alert('Lỗi kết nối.', 'error'); });
    }

    /* ── Load ─────────────────────────────────────────────── */
    function loadSignatures() {
        if (!UTAG) return;
        fetch(BASE + 'get_signatures.php?userCard=' + encodeURIComponent(UTAG))
            .then(function (r) { return r.json(); })
            .then(function (d) { if (Array.isArray(d)) render(d); })
            .catch(function () {});
    }

    window.loadSignatures = loadSignatures;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            loadSignatures();
            if (isAdmin) _showAdminNotice();
        });
    } else {
        loadSignatures();
        if (isAdmin) _showAdminNotice();
    }

    function _showAdminNotice() {
        setTimeout(function () {
            if (typeof wbSig2Alert === 'function') {
                wbSig2Alert('Bạn đang ở chế độ chỉnh sửa. Kéo thả chữ ký để thay đổi vị trí, nhấn ✕ để xóa chữ ký.', 'info');
            }
        }, 600);
    }

})();
