// Reads messages from local user JSON API instead of Google Sheets
(function () {
    // Giữ XUỐNG DÒNG khách gõ trong lời chúc / phản hồi (2026-10-20): nội dung gán bằng textContent nên ký tự 

    // còn nguyên, nhưng white-space mặc định gộp nó thành dấu cách → mọi mẫu hiện lời chúc viết liền một dòng.
    (function () {
        if (document.getElementById('wb-msg-xuong-dong')) return;
        var st = document.createElement('style');
        st.id = 'wb-msg-xuong-dong';
        st.textContent = '.MessageBox-item-message,.MessageBox-item-reply-content{white-space:pre-line!important;overflow-wrap:anywhere}';
        (document.head || document.documentElement).appendChild(st);
    })();

    let _msgMap = new Map();
    let _isFirstLoad = true;

    // Chữ tuỳ biến (đổi được qua editor: ấn giữ 2s vào .edit_sendMessage) — mặc định rỗng
    // nghĩa là giữ nguyên chữ gốc do template tự khai báo (placeholder trong HTML, titleReply
    // trong WB_MSG_BOX_CONFIG). USER_DATA.messageConfig.boxPlaceholder/boxReplyTitle ghi đè khi có.
    let _boxTexts = { placeholder: '', replyTitle: '' };
    let _cfgTitleReply = '';
    let _origPlaceholderHTML = null; // chữ gốc do template tự khai báo — dùng khi bỏ tuỳ biến

    function _escHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function _getReplyTitle() {
        return _boxTexts.replyTitle || _cfgTitleReply || '';
    }

    // Idempotent: gọi lại bất cứ lúc nào cũng phản ánh đúng _boxTexts.placeholder hiện tại
    // (chuỗi rỗng → khôi phục đúng chữ gốc, không phải "giữ nguyên chữ cũ trên DOM").
    function _applyPlaceholder() {
        let ph = document.getElementById('MessageBox-placeholder');
        if (!ph) return;
        if (_origPlaceholderHTML === null) _origPlaceholderHTML = ph.innerHTML;
        ph.innerHTML = _boxTexts.placeholder
            ? _escHtml(_boxTexts.placeholder).replace(/\n/g, '<br>')
            : _origPlaceholderHTML;
    }

    function _applyReplyTitleToExisting() {
        let t = _getReplyTitle();
        document.querySelectorAll('.MessageBox-item-reply-title').forEach(function (el) {
            el.textContent = t;
        });
    }

    // editor gọi để preview live khi gõ chữ trong modal, và để áp lại config đã lưu.
    // Truyền '' (không phải null/undefined) để chủ động khôi phục về chữ gốc của template.
    window.setMessageBoxTexts = function (cfg) {
        if (!cfg) return;
        if (cfg.placeholder != null) _boxTexts.placeholder = cfg.placeholder;
        if (cfg.replyTitle != null) _boxTexts.replyTitle = cfg.replyTitle;
        _applyPlaceholder();
        _applyReplyTitleToExisting();
    };
    window.getMessageBoxTexts = function () {
        return { placeholder: _boxTexts.placeholder, replyTitle: _getReplyTitle() };
    };

    // Inject animation CSS once
    (function injectStyles() {
        if (document.getElementById('wb-msgbox-css')) return;
        const s = document.createElement('style');
        s.id = 'wb-msgbox-css';
        s.textContent = `
@keyframes wbMsgAppear {
    0%   { opacity: 0; transform: translateY(-18px) scale(.97); }
    60%  { opacity: 1; transform: translateY(4px) scale(1.01); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes wbMsgFirst {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
}
.wb-msg-enter {
    animation: wbMsgAppear .55s cubic-bezier(.22,1,.36,1) both;
}
.wb-msg-first {
    animation: wbMsgFirst .45s ease both;
}`;
        document.head.appendChild(s);
    })();

    function renderMessages(messages) {
        let box = document.getElementById('MessageBox');
        if (!box) return;

        let titleReply = _getReplyTitle();
        let newIDs = new Set();

        let newMsgCount = 0;
        // Lần đầu: hiệu ứng lần lượt tính từ lời MỚI NHẤT (nằm trên cùng — box.prepend) và chỉ cho vài lời đầu.
        // Trước đây trễ tính từ lời CŨ nhất (i × 80ms): thiệp 200 lời chúc thì lời trên cùng đợi ~16 giây mới hiện,
        // phía trên trống còn lời cũ ở cuối đã hiện (user báo 2026-10-26).
        const FIRST_ANIM_MAX = 10;
        let firstTotal = 0;
        if (_isFirstLoad) messages.forEach(function (m) {
            if (String(m.name || '').trim() && String(m.message || '').trim()) firstTotal++;
        });

        messages.forEach(function (msg, i) {
            let rowId    = 'msg_' + i;
            let nameVal  = String(msg.name    || '').trim();
            let msgVal   = String(msg.message || '').trim();
            let replyVal = String(msg.reply   || '');

            if (!nameVal || !msgVal) return;
            newIDs.add(rowId);

            if (_msgMap.has(rowId)) {
                let obj = _msgMap.get(rowId);
                if (obj.nameEl.textContent !== nameVal) obj.nameEl.textContent = nameVal;
                if (obj.msgEl.textContent  !== msgVal)  obj.msgEl.textContent  = msgVal;
                if (obj.replyContentEl && obj.replyContentEl.textContent !== replyVal)
                    obj.replyContentEl.textContent = replyVal;
                if (obj.replyBox)
                    obj.replyBox.style.display = replyVal ? 'block' : 'none';
            } else {
                let div = document.createElement('div');
                div.classList.add('MessageBox-item');
                div.setAttribute('data-id', rowId);

                // Animation: stagger fade khi load lần đầu, bounce khi có tin mới
                if (_isFirstLoad) {
                    let fromTop = firstTotal - 1 - newMsgCount;   // 0 = lời mới nhất, trên cùng
                    if (fromTop < FIRST_ANIM_MAX) {
                        div.classList.add('wb-msg-first');
                        div.style.animationDelay = (fromTop * 60) + 'ms';
                    }
                } else {
                    div.classList.add('wb-msg-enter');
                }
                newMsgCount++;

                let h2 = document.createElement('h2');
                h2.classList.add('MessageBox-item-name');
                h2.textContent = nameVal;

                let p = document.createElement('p');
                p.classList.add('MessageBox-item-message');
                p.textContent = msgVal;

                let replyBox = document.createElement('div');
                replyBox.classList.add('MessageBox-item-reply');

                let replyTitle = document.createElement('div');
                replyTitle.classList.add('MessageBox-item-reply-title');
                replyTitle.textContent = titleReply;

                let replyContent = document.createElement('div');
                replyContent.classList.add('MessageBox-item-reply-content');
                replyContent.textContent = replyVal;

                replyBox.append(replyTitle, replyContent);
                if (!replyVal) replyBox.style.display = 'none';

                div.append(h2, p, replyBox);
                box.prepend(div);

                _msgMap.set(rowId, {
                    dom: div, nameEl: h2, msgEl: p,
                    replyBox: replyBox, replyContentEl: replyContent,
                });
            }
        });

        _isFirstLoad = false;

        // Xóa các message đã bị xóa khỏi dữ liệu
        for (let [rowId, obj] of _msgMap.entries()) {
            if (!newIDs.has(rowId)) {
                obj.dom.remove();
                _msgMap.delete(rowId);
            }
        }
    }

    function fetchAndRender(slug, bp) {
        if (!slug) {
            // Chế độ preview / edit: lấy từ USER_DATA nếu có
            let msgs    = (window.USER_DATA && window.USER_DATA.messages) || [];
            let visible = msgs.filter(function (m) { return (m.visibility || 'all') === 'all'; });
            renderMessages(visible);
            return;
        }
        fetch(bp + '/php/get-messages.php?slug=' + encodeURIComponent(slug))
            .then(function (res) { return res.json(); })
            .then(function (data) { renderMessages(data.messages || []); })
            .catch(function (err) { console.error('MessageBox error:', err); });
    }

    document.addEventListener('DOMContentLoaded', function () {
        let cfg = window.WB_MSG_BOX_CONFIG;
        if (!cfg) return;

        let slug        = window.INVITE_SLUG || '';
        let bp          = window.BASE_PATH   || '';
        _cfgTitleReply  = cfg.titleReply  || '';
        let buttonClass = cfg.buttonClass || '';
        let interval    = cfg.interval    || 5000;

        // Áp chữ đã lưu (nếu có) trước khi render lần đầu
        let mc = (window.USER_DATA && window.USER_DATA.messageConfig) || {};
        if (mc.boxPlaceholder) _boxTexts.placeholder = mc.boxPlaceholder;
        if (mc.boxReplyTitle)  _boxTexts.replyTitle  = mc.boxReplyTitle;
        _applyPlaceholder();

        fetchAndRender(slug, bp);

        if (buttonClass) {
            document.addEventListener('click', function (e) {
                if (e.target.closest(buttonClass)) fetchAndRender(slug, bp);
            });
        }

        if (interval > 0) {
            setInterval(function () { fetchAndRender(slug, bp); }, interval);
        }
    });
})();
