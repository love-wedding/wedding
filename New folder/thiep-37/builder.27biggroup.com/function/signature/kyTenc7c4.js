/* ── kyTen.js — Signature pad, positioning & save ────────── */
(function () {
    'use strict';

    /* ── Icon nét: cùng bộ Lucide với trang soạn / code.27biggroup.com (assets/js/wb-ui-icons.js).
       Bảng chữ ký nằm TRONG thiệp (cả trang xem) nên không dùng được wb-ui-icons.js → chép path cần dùng.
       Nhãn nút vẫn đổi được ở trang soạn; ký hiệu/emoji đầu nhãn (kể cả nhãn đã lưu kiểu cũ "📍 Chỉnh vị trí")
       bị bỏ đi và thay bằng icon. ── */
    var IC_P = {
        'signature': '<path d="m21 17-2.156-1.868A.5.5 0 0 0 18 15.5v.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1c0-2.545-3.991-3.97-8.5-4a1 1 0 0 0 0 5c4.153 0 4.745-11.295 5.708-13.5a2.5 2.5 0 1 1 3.31 3.284"/><path d="M3 21h18"/>',
        'pencil': '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
        'trash-2': '<path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        'move': '<path d="M12 2v20"/><path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/><path d="M2 12h20"/><path d="m5 9-3 3 3 3"/><path d="m9 5 3-3 3 3"/>',
        'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
        'rotate-ccw': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
        'save': '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
        'hourglass': '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
        'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
        'circle-x': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
        'triangle-alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
        'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
        'circle-help': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
        'message-circle': '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>'
    };
    function icSvg(n) {
        var d = IC_P[n];
        return d ? '<svg class="wb-sig-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + d + '</svg>' : '';
    }
    var BO_KH;
    try { BO_KH = new RegExp('^(?:[\\p{Extended_Pictographic}\\p{So}\\p{Sm}' + String.fromCharCode(0xFE0F, 0x200D) + ']\\s*)+', 'u'); }
    catch (e) { BO_KH = /^[^0-9A-Za-zÀ-ỹ]+/; }
    function boKyHieu(t) { return String(t == null ? '' : t).replace(BO_KH, '').trim(); }
    function ganNhan(el, ic, txt) {
        if (!el) return;
        var sp = document.createElement('span');
        sp.textContent = boKyHieu(txt);
        el.innerHTML = icSvg(ic);
        el.appendChild(sp);
    }
    window.wbSigIcon = icSvg;
    window.wbSigBoKyHieu = boKyHieu;
    (function () {
        if (document.getElementById('wb-sig-ic-css')) return;
        var st = document.createElement('style'); st.id = 'wb-sig-ic-css';
        st.textContent = '.wb-sig-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px}' +
            '.wb-sig-pad-title{display:flex;align-items:center;justify-content:center;gap:7px}' +
            '.wb-sig-ic{width:1.15em;height:1.15em;flex:none;display:inline-block}' +
            '.wb-sig-del-btn{display:none;align-items:center;justify-content:center;padding:0}.wb-sig-item.admin-mode .wb-sig-del-btn{display:flex}.wb-sig-del-btn .wb-sig-ic{width:12px;height:12px}' +
            '.wbSig2-icon{display:flex;justify-content:center;color:#8b6914}.wbSig2-icon .wb-sig-ic{width:46px;height:46px;stroke-width:1.8}' +
            '.wbSig2-icon.t-success{color:#2e9e5b}.wbSig2-icon.t-error{color:#d64545}.wbSig2-icon.t-warning{color:#e09b1b}.wbSig2-icon.t-info{color:#2274b5}';
        (document.head || document.documentElement).appendChild(st);
    })();

    /* ── Custom popup ─────────────────────────────────────── */
    var _ov = null;
    function _ens() {
        if (_ov) return _ov;
        _ov = document.createElement('div');
        _ov.id = 'wbSig2Overlay';
        _ov.innerHTML =
            '<div class="wbSig2-box">' +
            '<div class="wbSig2-icon" id="wbSig2Icon"></div>' +
            '<div class="wbSig2-msg"  id="wbSig2Msg"></div>' +
            '<div class="wbSig2-btns" id="wbSig2Btns"></div>' +
            '</div>';
        document.body.appendChild(_ov);
        return _ov;
    }
    function _pop(msg, type, btns) {
        _ens();
        var ic = { success: 'circle-check', error: 'circle-x', warning: 'triangle-alert', info: 'info', confirm: 'circle-help' };
        var icEl = document.getElementById('wbSig2Icon');
        icEl.className = 'wbSig2-icon t-' + (type || 'info');
        icEl.innerHTML = icSvg(ic[type] || 'message-circle');
        document.getElementById('wbSig2Msg').textContent  = msg;
        var c = document.getElementById('wbSig2Btns');
        c.innerHTML = '';
        btns.forEach(function (b) {
            var el = document.createElement('button');
            el.className  = 'wbSig2-btn ' + (b.cls || 'wbSig2-btn-ok');
            el.textContent = b.label;
            el.onclick = function () { _ov.classList.remove('visible'); if (b.cb) b.cb(); };
            c.appendChild(el);
        });
        _ov.classList.add('visible');
    }
    window.wbSig2Alert   = function (m, t) { _pop(m, t || 'info', [{ label: 'OK', cls: 'wbSig2-btn-ok' }]); };
    window.wbSig2Confirm = function (m, ok, cancel) {
        _pop(m, 'confirm', [
            { label: T.confirmYes, cls: 'wbSig2-btn-ok',     cb: ok },
            { label: T.confirmNo,  cls: 'wbSig2-btn-cancel', cb: cancel }
        ]);
    };

    /* ── Text config (đổi được qua editor: ấn giữ 2s vào khung ký tên) ──
       window.__WB_SIG_TEXT__ do PHP bơm sẵn giá trị đã lưu (edit.php/view.php);
       window.setSignatureTexts()/getSignatureTexts() cho editor đọc/ghi runtime. */
    var T = Object.assign({
        openBtn: 'Ký tên của bạn',
        padTitle: 'Ký tên của bạn',
        clearBtn: 'Xóa',
        posBtn: 'Chỉnh vị trí',
        cancelBtn: 'Hủy',
        backBtn: 'Ký lại',
        saveBtn: 'Lưu chữ ký',
        savingBtn: 'Đang lưu…',
        dragHint: 'Kéo thả để đổi vị trí',
        confirmCancelMsg: 'Hủy ký tên?',
        confirmSaveMsg: 'Lưu chữ ký tại vị trí này?',
        confirmYes: 'Xác nhận',
        confirmNo: 'Hủy',
        alertNoSig: 'Bạn chưa ký tên!',
        alertProcessFail: 'Không thể xử lý chữ ký.',
        alertSaveFail: 'Có lỗi xảy ra.',
        alertServerFail: 'Không thể kết nối máy chủ.'
    }, (typeof window.__WB_SIG_TEXT__ === 'object' && window.__WB_SIG_TEXT__) || {});

    /* ── Config ───────────────────────────────────────────── */
    var BASE  = (typeof _WB_SIG_BASE          !== 'undefined') ? _WB_SIG_BASE          : '';
    var UTAG  = (typeof defaultUserTag         !== 'undefined') ? defaultUserTag         : '';
    var getC  = function () { return (typeof colorSignature !== 'undefined') ? colorSignature : '#1a1a2e'; };
    var getBg = function () { return (typeof bgSignature    !== 'undefined') ? bgSignature    : '#fdf8f2'; };
    var getS  = function () { return (typeof sizeSignature  !== 'undefined') ? +sizeSignature : 15; };

    window._wbSigBase     = BASE;
    window._wbSigAdminKey = (typeof managerSignatureKey !== 'undefined') ? managerSignatureKey : '';

    /* ── Elements ─────────────────────────────────────────── */
    var root      = document.getElementById('wb-sig-root');
    var dispEl    = document.getElementById('wb-sig-display');
    var dispIn    = document.getElementById('wb-sig-display-inner');
    var spacerEl  = document.getElementById('wb-sig-spacer');
    var openBtn   = document.getElementById('wb-sig-open-btn');
    var pad       = document.getElementById('wb-sig-pad');
    var canvas    = document.getElementById('wb-sig-canvas');
    var btnClr    = document.getElementById('wb-sig-btn-clear');
    var btnPos    = document.getElementById('wb-sig-btn-pos');
    var btnCnl    = document.getElementById('wb-sig-btn-cancel');
    var posBtns   = document.getElementById('wb-sig-pos-btns');
    var btnBack   = document.getElementById('wb-sig-btn-back');
    var btnSave   = document.getElementById('wb-sig-btn-save');

    if (!root || !canvas) return;

    /* ── Áp dụng chữ (buttons + tiêu đề khung ký) ─────────────
       Không đụng btnSave khi đang ở trạng thái "Đang lưu…" (disabled) để tránh
       ghi đè text tạm thời của _doSave() giữa lúc request đang chạy. */
    function applyTexts() {
        ganNhan(openBtn, 'signature', T.openBtn);
        var padTitleEl = pad ? pad.querySelector('.wb-sig-pad-title') : null;
        ganNhan(padTitleEl, 'signature', T.padTitle);
        ganNhan(btnClr, 'trash-2', T.clearBtn);
        ganNhan(btnPos, 'move', T.posBtn);
        ganNhan(btnCnl, 'x', T.cancelBtn);
        ganNhan(btnBack, 'rotate-ccw', T.backBtn);
        if (btnSave && !btnSave.disabled) ganNhan(btnSave, 'save', T.saveBtn);
    }
    applyTexts();

    /* editor gọi để preview live khi gõ chữ trong modal, và để áp lại config đã lưu */
    window.setSignatureTexts = function (cfg) {
        Object.assign(T, cfg || {});
        applyTexts();
    };
    window.getSignatureTexts = function () { return Object.assign({}, T); };

    /* Spacer height = edit_signature height → btn-row & pad appear below container */
    function _updateSpacer() {
        var hc = hcEl();
        if (spacerEl && hc) spacerEl.style.height = hc.offsetHeight + 'px';
    }

    /* ── Canvas setup ─────────────────────────────────────── */
    var ctx     = canvas.getContext('2d');
    var dpr     = window.devicePixelRatio || 1;
    var drawing = false;
    var lastPt  = null;
    var lastMid = null;

    /* Tỉ lệ canvas cố định = 5:3 (rộng:cao) để nhất quán mọi màn hình */
    var CANVAS_RATIO = 5 / 3;

    function setupCanvas() {
        var w = canvas.offsetWidth;
        var h = Math.round(w / CANVAS_RATIO);
        canvas.width              = w * dpr;
        canvas.height             = h * dpr;
        canvas.style.height       = h + 'px';
        canvas.style.background = getBg();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.strokeStyle = getC();
        ctx.lineWidth   = Math.max(0.5, getS() * 0.1);
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
    }

    function gp(e) {
        var r = canvas.getBoundingClientRect();
        var t = (e.touches && e.touches.length) ? e.touches[0] : e;
        return { x: t.clientX - r.left, y: t.clientY - r.top };
    }

    /* ── Smooth Bezier drawing ────────────────────────────── */
    canvas.addEventListener('pointerdown', function (e) {
        drawing = true;
        canvas.setPointerCapture(e.pointerId);
        ctx.strokeStyle = getC();
        ctx.lineWidth   = Math.max(1, getS() * 0.2);
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        var p = gp(e);
        lastPt = p; lastMid = null;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
    });
    canvas.addEventListener('pointermove', function (e) {
        if (!drawing) return;
        var p = gp(e);
        var mid = { x: (lastPt.x + p.x) / 2, y: (lastPt.y + p.y) / 2 };
        if (lastMid) {
            ctx.quadraticCurveTo(lastPt.x, lastPt.y, mid.x, mid.y);
        } else {
            ctx.lineTo(mid.x, mid.y);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mid.x, mid.y);
        lastPt = p; lastMid = mid;
    });
    canvas.addEventListener('pointerup',    function () { drawing = false; });
    canvas.addEventListener('pointercancel',function () { drawing = false; });

    btnClr.addEventListener('click', function () {
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        lastPt = null; lastMid = null;
    });

    /* ── Section expansion ────────────────────────────────── */
    function _up(from, test) {
        var el = from; while (el) { if (test(el)) return el; el = el.parentElement; } return null;
    }
    function secEl() { return _up(root, function (e) { return (e.classList && e.classList.contains('ladi-section')) || e.id === 'SECTION10'; }); }
    function hcEl()  { return _up(root, function (e) { return (e.classList && e.classList.contains('ladi-html-code')) || e.id === 'HTML_CODE8'; }); }

    var _idleSecH = null, _hcRef = null;
    function expandSec(extra) {
        _hcRef = hcEl(); var sec = secEl();
        if (_hcRef) { _hcRef.style.overflow = 'visible'; } /* KHÔNG đổi height — display sẽ bị dài */
        if (sec) {
            var base = _idleSecH ? parseInt(_idleSecH) : sec.offsetHeight;
            sec.style.height   = (base + extra) + 'px';
            sec.style.overflow = 'visible';
        }
    }
    function collapseSec() {
        if (_hcRef) { _hcRef.style.overflow = 'visible'; }
        var sec = secEl();
        if (sec && _idleSecH) {
            sec.style.height   = _idleSecH;
            sec.style.overflow = 'visible';
        }
    }

    /* Đọc height trực tiếp từ @media(max-width:767px) trong CSS rules — không cần đo DOM.
       Dùng khi ở chế độ mob-edit: LadiPage dùng screen.width (vật lý) để set inline style
       desktop dù viewport đã được đổi thành 420px, nên offsetHeight không tin cậy. */
    function _getMobHFromCSS(elemId) {
        if (!elemId) return 0;
        var sel = '#' + elemId, h = 0;
        var sheets = document.styleSheets;
        for (var i = 0; i < sheets.length && !h; i++) {
            var rules;
            try { rules = sheets[i].cssRules || sheets[i].rules; } catch (e) { continue; }
            if (!rules) continue;
            for (var j = 0; j < rules.length && !h; j++) {
                var r = rules[j];
                if ((r.type || 0) !== 4) continue; /* 4 = CSSRule.MEDIA_RULE */
                var cond = r.conditionText || (r.media && r.media.mediaText) || '';
                if (cond.indexOf('max-width') < 0 || cond.indexOf('767') < 0) continue;
                var inner = r.cssRules || [];
                for (var k = 0; k < inner.length; k++) {
                    if (inner[k].selectorText === sel && inner[k].style && inner[k].style.height) {
                        var v = parseFloat(inner[k].style.height);
                        if (v > 0) { h = v; break; }
                    }
                }
            }
        }
        return h;
    }

    function _refreshDisplayHeight() {
        var hc = hcEl();
        if (!hc || !dispEl) return;
        var par = hc.parentElement; /* ladi-element, e.g. #HTML_CODE30 */
        /* Mob-edit mode (?mob=1): dùng chiều cao mobile do PHP trích từ CSS template
           (window.__WB_SIG_MOB_H__), fallback sang đọc CSS rule trực tiếp.
           Không dùng offsetHeight: LadiPage set inline desktop height dựa trên
           screen.width vật lý (1920px) bất kể viewport đã bị overrode thành 420px. */
        if (document.documentElement.classList.contains('wb-mob-edit')) {
            var mobH = (typeof window.__WB_SIG_MOB_H__ !== 'undefined' && window.__WB_SIG_MOB_H__ > 0)
                        ? window.__WB_SIG_MOB_H__
                        : _getMobHFromCSS(par && par.id ? par.id : '');
            if (mobH > 0) {
                dispEl.style.height = mobH + 'px';
                _updateSpacer();
                return;
            }
        }
        /* Fallback (mobile thật / desktop): xóa inline LadiPage rồi đo */
        if (par) par.style.height = '';
        hc.style.height = '';
        var h = hc.offsetHeight;
        if (h > 0) dispEl.style.height = h + 'px';
        _updateSpacer();
    }

    /* Set chiều cao ban đầu */
    _refreshDisplayHeight();

    /* DOMContentLoaded: chạy lại sau khi _injectMobileMediaCSS() của edit.js đã xong */
    document.addEventListener('DOMContentLoaded', function () {
        _refreshDisplayHeight();
    });

    /* Resize: _doMobReapply dispatch resize ở 500ms và 1500ms sau window.load */
    window.addEventListener('resize', function () {
        setTimeout(function () {
            requestAnimationFrame(_refreshDisplayHeight);
        }, 60);
    });

    /* Mở rộng section vừa đủ để nút "Ký tên" bên dưới edit_signature luôn thấy.
       Được gọi lại từ edit.js sau mỗi _clearMobInlineHeights() qua window._wbSigReexpandSec. */
    function _expandSecForBtn() {
        _hcRef = hcEl(); var sec = secEl();
        if (_hcRef) { _hcRef.style.overflow = 'visible'; }
        if (sec) {
            var btnRow = document.getElementById('wb-sig-btn-row');
            var btnH = (btnRow ? btnRow.offsetHeight : 40) + 24;
            _idleSecH = (sec.offsetHeight + btnH) + 'px';
            sec.style.height   = _idleSecH;
            sec.style.overflow = 'visible';
        }
    }
    _expandSecForBtn();

    /* edit.js gọi hàm này (qua requestAnimationFrame) sau _clearMobInlineHeights()
       để tái mở rộng section về mobile_height + button_height */
    window._wbSigReexpandSec = _expandSecForBtn;

    /* ── State machine ────────────────────────────────────── */
    var _pendImg  = null;
    var _pendItem = null;
    var _px = 5, _py = 5;

    function _fadeIn(el, displayVal) {
        el.style.display = displayVal;
        el.classList.remove('wb-sig-fadein');
        void el.offsetWidth;
        el.classList.add('wb-sig-fadein');
    }

    function setState(s) {
        if (s === 'idle') {
            _fadeIn(openBtn.parentElement, 'flex');
            pad.style.display    = 'none';
            posBtns.style.display = 'none';
        } else if (s === 'drawing') {
            openBtn.parentElement.style.display = 'none';
            _fadeIn(pad, 'block');
            posBtns.style.display = 'none';
        } else if (s === 'positioning') {
            openBtn.parentElement.style.display = 'none';
            pad.style.display = 'none';
            _fadeIn(posBtns, 'flex');
            btnSave.classList.add('wb-sig-btn-bounce');
        }
        if (s === 'idle' || s === 'drawing') {
            btnSave.classList.remove('wb-sig-btn-bounce');
        }
        if (s === 'idle' || s === 'positioning') collapseSec();
    }

    /* ── Open pad ─────────────────────────────────────────── */
    openBtn.addEventListener('click', function () {
        setState('drawing');
        setupCanvas();
        setTimeout(function () { expandSec(pad.scrollHeight + 60); }, 10);
    });

    /* ── Cancel ───────────────────────────────────────────── */
    btnCnl.addEventListener('click', function () {
        wbSig2Confirm(T.confirmCancelMsg, function () {
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            _rmPend();
            setState('idle');
        });
    });

    /* ── Go to positioning ────────────────────────────────── */
    btnPos.addEventListener('click', function () {
        if (_isBlank()) { wbSig2Alert(T.alertNoSig, 'warning'); return; }
        _pendImg = _trimURL();
        if (!_pendImg) { wbSig2Alert(T.alertProcessFail, 'error'); return; }
        _showPend();
        setState('positioning');
        setTimeout(function () {
            dispEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 60);
    });

    /* ── Back to drawing ──────────────────────────────────── */
    btnBack.addEventListener('click', function () {
        _rmPend();
        setState('drawing');
        setTimeout(function () { expandSec(pad.scrollHeight + 60); }, 10);
    });

    /* ── Save ─────────────────────────────────────────────── */
    btnSave.addEventListener('click', function () {
        if (!_pendImg) return;
        wbSig2Confirm(T.confirmSaveMsg, function () { _doSave(); });
    });

    /* ── Helpers ──────────────────────────────────────────── */
    function _isBlank() {
        var d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        for (var i = 3; i < d.length; i += 4) if (d[i] > 10) return false;
        return true;
    }

    function _trimURL() {
        /* Xuất toàn bộ canvas — tỷ lệ khung ô ký luôn nhất quán */
        var url = canvas.toDataURL('image/webp', 0.82);
        if (url.indexOf('image/webp') < 0) url = canvas.toDataURL('image/png');
        return url;
    }

    function _sigWidth() {
        return 13;
    }

    function _showPend() {
        _rmPend();
        var w    = _sigWidth();
        var item = document.createElement('div');
        item.className = 'wb-sig-item pending';
        item.style.cssText = 'width:' + w + '%;left:' + _px + '%;top:' + _py + '%;';

        var img = document.createElement('img');
        img.src = _pendImg;
        item.appendChild(img);

        /* Hint đi theo chữ ký — biến mất 3 s sau khi bắt đầu kéo */
        var hint = document.createElement('div');
        hint.className   = 'wb-sig-drag-hint';
        hint.textContent = T.dragHint;
        item.appendChild(hint);

        dispIn.appendChild(item);
        _pendItem = item;
        _initDrag(item, hint);
    }

    function _rmPend() {
        if (_pendItem) { _pendItem.remove(); _pendItem = null; }
    }

    /* ── Drag (pending) ───────────────────────────────────── */
    function _initDrag(el, hintEl) {
        var grabX, grabY, active = false, hintGone = false, hintTimer = null;

        function _hideHint() {
            if (hintGone || !hintEl) return;
            hintGone = true;
            hintEl.classList.add('wb-sig-drag-hint-out');
            setTimeout(function () { if (hintEl && hintEl.parentNode) hintEl.parentNode.removeChild(hintEl); }, 380);
        }

        el.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            active = true;
            el.setPointerCapture(e.pointerId);
            var elRect = el.getBoundingClientRect();
            grabX = e.clientX - elRect.left;
            grabY = e.clientY - elRect.top;
            if (!hintGone && !hintTimer) {
                hintTimer = setTimeout(_hideHint, 3000);
            }
        });
        el.addEventListener('pointermove', function (e) {
            if (!active) return;
            var dr   = dispEl.getBoundingClientRect();
            var maxX = 100 - el.offsetWidth  / dr.width  * 100;
            var maxY = 100 - el.offsetHeight / dr.height * 100;
            _px = Math.max(0, Math.min(maxX, (e.clientX - dr.left - grabX) / dr.width  * 100));
            _py = Math.max(0, Math.min(maxY, (e.clientY - dr.top  - grabY) / dr.height * 100));
            el.style.left = _px + '%';
            el.style.top  = _py + '%';
        });
        el.addEventListener('pointerup', function (e) {
            active = false;
            el.releasePointerCapture(e.pointerId);
        });
        el.addEventListener('pointercancel', function () { active = false; });
    }

    function _doSave() {
        btnSave.disabled    = true;
        ganNhan(btnSave, 'hourglass', T.savingBtn);
        fetch(BASE + 'save_signature.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                signature: _pendImg, userCard: UTAG,
                pos_x: +(_px.toFixed(1)), pos_y: +(_py.toFixed(1))
            })
        })
        .then(function (r) { return r.json(); })
        .then(function (res) {
            btnSave.disabled    = false;
            ganNhan(btnSave, 'save', T.saveBtn);
            if (res.success) {
                _rmPend();
                ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
                _pendImg = null; _px = 5; _py = 5;
                setState('idle');
                if (res.id) window._wbNewSigId = String(res.id);
                if (typeof window.loadSignatures === 'function') window.loadSignatures();
                setTimeout(function () {
                    dispEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 80);
            } else { wbSig2Alert(res.error || T.alertSaveFail, 'error'); }
        })
        .catch(function () {
            btnSave.disabled    = false;
            ganNhan(btnSave, 'save', T.saveBtn);
            wbSig2Alert(T.alertServerFail, 'error');
        });
    }

})();
