/**
 * LOVE WEDDING - STUDIO CUSTOMIZER ENGINE
 * Hoàn toàn bằng JavaScript thuần (Vanilla JS)
 * Đồng bộ thời gian thực 2 chiều giữa Form và Card Iframe qua window.postMessage
 */

// Danh sách ngân hàng phổ biến tại Việt Nam hỗ trợ VietQR
const POPULAR_BANKS = [
    { code: 'MB', name: 'MBBank (Quân Đội)' },
    { code: 'VCB', name: 'Vietcombank (Ngoại Thương)' },
    { code: 'TCB', name: 'Techcombank (Kỹ Thương)' },
    { code: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)' },
    { code: 'ACB', name: 'ACB (Á Châu)' },
    { code: 'ICB', name: 'VietinBank (Công Thương)' },
    { code: 'BIDV', name: 'BIDV (Đầu Tư & Phát Triển)' },
    { code: 'TPB', name: 'TPBank (Tiên Phong)' },
    { code: 'STB', name: 'Sacombank (Sài Gòn Thương Tín)' },
    { code: 'VIB', name: 'VIB (Quốc Tế)' },
    { code: 'MSB', name: 'MSB (Hàng Hải)' },
    { code: 'OCB', name: 'OCB (Phương Đông)' }
];

// Dữ liệu mẫu chuẩn mặc định
const DEFAULT_WEDDING_DATA = {
    groomNameShort: 'Anh Tú',
    groomNameFull: 'Nguyễn Anh Tú',
    brideNameShort: 'Diệu Nhi',
    brideNameFull: 'Trần Diệu Nhi',
    weddingDateHero: '31.03<br>2025',
    groomParents: 'ÔNG CẤN VĂN AN\nBÀ NGUYỄN THỊ HẢI',
    groomParentsCity: 'Quận 8, Hồ Chí Minh',
    brideParents: 'ÔNG TRẦN VĂN HÙNG\nBÀ LÊ THỊ MAI',
    brideParentsCity: 'Quận 1, Hồ Chí Minh',
    ceremonyTitle: 'Trân Trọng Báo Tin Lễ Thành Hôn Của',
    partyTitle: 'TIỆC MỪNG LỄ THÀNH HÔN',
    partyTime: 'Vào Lúc 10h00 | Thứ 6',
    partyDay: '30',
    partyMonth: '03',
    partyYear: '2025',
    partyLunar: 'Ngày 02 Tháng 03 Năm Ất Tỵ',
    venueName: 'The ADORA Center',
    venueAddress: '431 Hoàng Văn Thụ, Phường 4, Quận Tân Bình, TP. Hồ Chí Minh',
    mapUrl: 'https://maps.app.goo.gl/PP57rDnyXbgNEVbM8',
    mapEmbedUrl: '',
    googleSheetExecUrl: '',
    bankCode: 'MB',
    bankAccount: '0326677811',
    bankAccountName: 'NGUYEN TAN DAT',
    bankInfoText: 'MBBANK - NGUYEN TAN DAT\n0326677811',
    bankQrImage: 'https://img.vietqr.io/image/MB-0326677811-compact2.png?accountName=NGUYEN%20TAN%20DAT',
    coverPhoto: '',
    albumPhotos: [],
    audioUrl: ''
};

// Global Studio State
const editorState = {
    templateId: 'thiep-4',
    templateName: 'Thiệp 04 - Phong Thư Hoàng Gia',
    templateUrl: '../thiep-4/index.html',
    data: JSON.parse(JSON.stringify(DEFAULT_WEDDING_DATA)),
    syncTimer: null,
    iframeReady: false
};

// DOM Elements cache
let studioElements = {};

// Khởi tạo Studio khi trang tải xong
document.addEventListener('DOMContentLoaded', () => {
    initStudioElements();
    populateBankSelect();
    bindStudioEvents();
    listenIframeBridge();
});

function initStudioElements() {
    studioElements = {
        overlay: document.getElementById('weddingStudioModal'),
        iframe: document.getElementById('studioCardIframe'),
        templateNameLabel: document.getElementById('studioTemplateNameLabel'),
        statusIndicator: document.getElementById('studioStatusText'),
        bankSelect: document.getElementById('studio_bankCode')
    };
}

// Đổ danh sách ngân hàng vào dropdown
function populateBankSelect() {
    const sel = document.getElementById('studio_bankCode');
    if (!sel) return;
    sel.innerHTML = POPULAR_BANKS.map(b => `<option value="${b.code}">${b.name}</option>`).join('');
}

// Bắt sự kiện bàn phím & controls
function bindStudioEvents() {
    // 1. Chuyển tab trong form
    document.querySelectorAll('.studio-tab-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchStudioTab(tabId);
        });
    });

    // 2. Tự động lắng nghe tất cả các input có data-field
    document.querySelectorAll('[data-field]').forEach(input => {
        const field = input.dataset.field;
        const eventType = input.tagName === 'SELECT' ? 'change' : 'input';

        input.addEventListener(eventType, (e) => {
            editorState.data[field] = e.target.value;

            // Xử lý tự động VietQR nếu đổi thông tin ngân hàng
            if (field === 'bankCode' || field === 'bankAccount' || field === 'bankAccountName') {
                updateAutoVietQR();
            }

            // Xử lý tự động ghép ngày hero nếu đổi partyDay/partyMonth/partyYear
            if (field === 'partyDay' || field === 'partyMonth' || field === 'partyYear') {
                const day = editorState.data.partyDay || '30';
                const month = editorState.data.partyMonth || '03';
                const year = editorState.data.partyYear || '2025';
                editorState.data.weddingDateHero = `${day}.${month}<br>${year}`;
            }

            scheduleSyncToIframe();
            saveDraftToStorage();
        });
    });

    // 3. Phím Esc đóng modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && studioElements.overlay && studioElements.overlay.classList.contains('active')) {
            closeWeddingEditor();
        }
    });
}

// Đổi tab trong sidebar
function switchStudioTab(tabId) {
    document.querySelectorAll('.studio-tab-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.studio-tab-panel').forEach(p => p.classList.remove('active'));

    const activeBtn = document.querySelector(`.studio-tab-item[data-tab="${tabId}"]`);
    const activePanel = document.getElementById(`tab-panel-${tabId}`);

    if (activeBtn) activeBtn.classList.add('active');
    if (activePanel) activePanel.classList.add('active');
}

// Lắng nghe tín hiệu từ Iframe card-bridge
function listenIframeBridge() {
    window.addEventListener('message', (event) => {
        if (!event.data || typeof event.data !== 'object') return;
        if (event.data.type === 'CARD_BRIDGE_READY') {
            console.log('[Editor] Iframe Bridge is READY, sending current state...');
            editorState.iframeReady = true;
            syncDataToIframe();
        } else if (event.data.type === 'REQUEST_IMAGE_EDIT') {
            openImageAdjustModal(event.data.payload);
        }
    });
}

/**
 * MỞ STUDIO EDITOR CHO MỘT MẪU THIỆP
 * @param {string} templateId - ID mẫu (ví dụ: 'thiep-4', 'thiep-20')
 * @param {string} templateName - Tên hiển thị
 * @param {string} templateUrl - Đường dẫn demo
 */
function openWeddingEditor(templateId, templateName, templateUrl) {
    editorState.templateId = templateId || 'thiep-4';
    editorState.templateName = templateName || 'Mẫu Thiệp Cưới';
    editorState.templateUrl = templateUrl || `../${templateId}/index.html`;

    // Cập nhật UI tiêu đề
    if (studioElements.templateNameLabel) {
        studioElements.templateNameLabel.textContent = editorState.templateName;
    }

    // Nạp dữ liệu đã lưu nháp hoặc mặc định
    loadDraftFromStorage();

    // Điền dữ liệu vào các ô input form
    fillFormFields();

    // Đặt src cho iframe
    if (studioElements.iframe) {
        editorState.iframeReady = false;
        // Thêm timestamp để tránh cache
        const targetUrl = `../${editorState.templateId}/index.html?v=${Date.now()}`;
        studioElements.iframe.src = targetUrl;
    }

    // Hiển thị modal
    if (studioElements.overlay) {
        studioElements.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Fallback sync sau khi iframe nạp
    setTimeout(() => {
        syncDataToIframe();
    }, 1200);
}

// Đóng modal
function closeWeddingEditor() {
    if (studioElements.overlay) {
        studioElements.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Đổ dữ liệu từ state vào các trường input
function fillFormFields() {
    document.querySelectorAll('[data-field]').forEach(input => {
        const field = input.dataset.field;
        if (editorState.data[field] !== undefined) {
            input.value = editorState.data[field];
        }
    });

    // Update preview ảnh bìa nếu có
    const coverPreview = document.getElementById('coverPhotoPreview');
    const coverBox = document.getElementById('coverPhotoUploadBox');
    if (coverPreview && coverBox) {
        if (editorState.data.coverPhoto) {
            coverPreview.src = editorState.data.coverPhoto;
            coverBox.classList.add('has-image');
        } else {
            coverBox.classList.remove('has-image');
        }
    }
}

// Cập nhật link VietQR tự động
function updateAutoVietQR() {
    const bank = editorState.data.bankCode || 'MB';
    const acc = (editorState.data.bankAccount || '').trim();
    const name = (editorState.data.bankAccountName || '').trim().toUpperCase();

    if (acc) {
        editorState.data.bankQrImage = `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?accountName=${encodeURIComponent(name)}`;
        editorState.data.bankInfoText = `${bank}BANK - ${name}\n${acc}`;
    }
}

// Lên lịch gửi dữ liệu sang iframe với debounce nhẹ
function scheduleSyncToIframe() {
    if (editorState.syncTimer) clearTimeout(editorState.syncTimer);

    if (studioElements.statusIndicator) {
        studioElements.statusIndicator.textContent = 'Đang đồng bộ...';
    }

    editorState.syncTimer = setTimeout(() => {
        syncDataToIframe();
        if (studioElements.statusIndicator) {
            studioElements.statusIndicator.textContent = 'Đã lưu & đồng bộ';
        }
    }, 60);
}

// Gửi dữ liệu qua window.postMessage
function syncDataToIframe() {
    if (!studioElements.iframe || !studioElements.iframe.contentWindow) return;

    studioElements.iframe.contentWindow.postMessage({
        type: 'UPDATE_WEDDING_DATA',
        payload: editorState.data
    }, '*');
}

// Xử lý upload ảnh xem trước qua FileReader (Base64)
function handleCoverImageSelect(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    // Giới hạn dung lượng 5MB
    if (file.size > 5 * 1024 * 1024) {
        alert('Vui lòng chọn ảnh dung lượng dưới 5MB để đảm bảo tốc độ mượt mà!');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64Url = e.target.result;
        editorState.data.coverPhoto = base64Url;

        const coverPreview = document.getElementById('coverPhotoPreview');
        const coverBox = document.getElementById('coverPhotoUploadBox');
        if (coverPreview && coverBox) {
            coverPreview.src = base64Url;
            coverBox.classList.add('has-image');
        }

        scheduleSyncToIframe();
        saveDraftToStorage();
    };
    reader.readAsDataURL(file);
}

// Xóa ảnh bìa
function removeCoverImage(e) {
    if (e) e.stopPropagation();
    editorState.data.coverPhoto = '';
    const coverBox = document.getElementById('coverPhotoUploadBox');
    if (coverBox) coverBox.classList.remove('has-image');
    scheduleSyncToIframe();
    saveDraftToStorage();
}

// Lưu bản nháp vào LocalStorage
function saveDraftToStorage() {
    try {
        const key = `wedding_draft_${editorState.templateId}`;
        localStorage.setItem(key, JSON.stringify(editorState.data));
    } catch (e) {
        console.warn('LocalStorage save failed:', e);
    }
}

// Nạp bản nháp từ LocalStorage
function loadDraftFromStorage() {
    try {
        const key = `wedding_draft_${editorState.templateId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            editorState.data = Object.assign({}, DEFAULT_WEDDING_DATA, JSON.parse(saved));
        } else {
            editorState.data = JSON.parse(JSON.stringify(DEFAULT_WEDDING_DATA));
        }
    } catch (e) {
        editorState.data = JSON.parse(JSON.stringify(DEFAULT_WEDDING_DATA));
    }
}

// Khôi phục về mặc định
function resetStudioDraft() {
    if (confirm('Bạn có chắc muốn khôi phục lại dữ liệu mẫu ban đầu?')) {
        editorState.data = JSON.parse(JSON.stringify(DEFAULT_WEDDING_DATA));
        fillFormFields();
        scheduleSyncToIframe();
        saveDraftToStorage();
    }
}

// Mở xem trước toàn màn hình
function openFullscreenPreview() {
    if (studioElements.iframe) {
        const url = studioElements.iframe.src;
        window.open(url, '_blank');
    }
}

// Gửi thông tin chốt đơn qua Zalo
function orderViaZalo() {
    const d = editorState.data;
    const msg = 
`👰🤵 [YÊU CẦU ĐẶT THIỆP CƯỚI ONLINE]
--------------------------------
Mẫu thiệp: ${editorState.templateName} (${editorState.templateId})
- Chú rể: ${d.groomNameFull || d.groomNameShort}
- Cô dâu: ${d.brideNameFull || d.brideNameShort}
- Nhà Trai: ${d.groomParents} (${d.groomParentsCity})
- Nhà Gái: ${d.brideParents} (${d.brideParentsCity})
--------------------------------
- Lễ cưới: ${d.partyTitle}
- Thời gian: ${d.partyTime} - Ngày ${d.partyDay}/${d.partyMonth}/${d.partyYear}
- Âm lịch: ${d.partyLunar}
- Địa điểm: ${d.venueName}
- Địa chỉ: ${d.venueAddress}
- Bản đồ: ${d.mapUrl}
--------------------------------
- Mừng cưới: ${d.bankInfoText.replace(/\n/g, ' - ')}
--------------------------------
Mình đã tự chỉnh sửa nội dung trên web và muốn đặt làm mẫu thiệp này!`;

    const zaloUrl = `https://zalo.me/0326677811?text=${encodeURIComponent(msg)}`;
    window.open(zaloUrl, '_blank');
}

// Sao chép link chia sẻ bản nháp
function copyShareLink() {
    // Có thể nén nhẹ dữ liệu vào URL params
    const shareData = {
        template: editorState.templateId,
        groom: editorState.data.groomNameShort,
        bride: editorState.data.brideNameShort,
        day: editorState.data.partyDay,
        month: editorState.data.partyMonth,
        year: editorState.data.partyYear
    };

    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('template', editorState.templateId);
    url.searchParams.set('groom', editorState.data.groomNameShort);
    url.searchParams.set('bride', editorState.data.brideNameShort);

    navigator.clipboard.writeText(url.toString()).then(() => {
        alert('Đã sao chép đường dẫn thiệp vào bộ nhớ tạm! Bạn có thể gửi link cho người thân xem thử.');
    }).catch(() => {
        prompt('Sao chép đường dẫn này để chia sẻ:', url.toString());
    });
}

// State quản lý việc căn chỉnh / thay thế ảnh đang chọn
const currentAdjustState = {
    selector: '',
    currentImage: '',
    scale: 100,
    posX: 50,
    posY: 50
};

// Mở modal căn chỉnh ảnh khi người dùng click vào ảnh trong thiệp
function openImageAdjustModal(payload) {
    if (!payload) return;
    currentAdjustState.selector = payload.selector || '';
    currentAdjustState.currentImage = payload.currentImage || '';
    currentAdjustState.scale = parseInt(payload.currentScale, 10) || 100;
    currentAdjustState.posX = parseInt(payload.currentPosX, 10) || 50;
    currentAdjustState.posY = parseInt(payload.currentPosY, 10) || 50;

    const modal = document.getElementById('imageAdjustModal');
    const sliderZoom = document.getElementById('sliderZoom');
    const sliderPosX = document.getElementById('sliderPosX');
    const sliderPosY = document.getElementById('sliderPosY');

    if (sliderZoom) sliderZoom.value = currentAdjustState.scale;
    if (sliderPosX) sliderPosX.value = currentAdjustState.posX;
    if (sliderPosY) sliderPosY.value = currentAdjustState.posY;

    updateAdjustCanvasPreview();

    if (modal) modal.classList.add('active');
}

// Đóng modal căn chỉnh ảnh
function closeImageAdjustModal() {
    const modal = document.getElementById('imageAdjustModal');
    if (modal) modal.classList.remove('active');
}

// Cập nhật canvas xem trước trong modal
function updateAdjustCanvasPreview() {
    const canvas = document.getElementById('adjustPreviewCanvas');
    const valZoom = document.getElementById('valZoom');
    const valPosX = document.getElementById('valPosX');
    const valPosY = document.getElementById('valPosY');

    if (valZoom) valZoom.textContent = `${currentAdjustState.scale}%`;
    if (valPosX) valPosX.textContent = `${currentAdjustState.posX}%`;
    if (valPosY) valPosY.textContent = `${currentAdjustState.posY}%`;

    if (canvas) {
        if (currentAdjustState.currentImage) {
            canvas.style.backgroundImage = `url("${currentAdjustState.currentImage}")`;
        }
        canvas.style.backgroundRepeat = 'no-repeat';
        canvas.style.backgroundSize = `${currentAdjustState.scale}%`;
        canvas.style.backgroundPosition = `${currentAdjustState.posX}% ${currentAdjustState.posY}%`;
    }
}

// Khi kéo thanh trượt căn chỉnh
function onImageAdjustSliderChange() {
    const sliderZoom = document.getElementById('sliderZoom');
    const sliderPosX = document.getElementById('sliderPosX');
    const sliderPosY = document.getElementById('sliderPosY');

    if (sliderZoom) currentAdjustState.scale = parseInt(sliderZoom.value, 10);
    if (sliderPosX) currentAdjustState.posX = parseInt(sliderPosX.value, 10);
    if (sliderPosY) currentAdjustState.posY = parseInt(sliderPosY.value, 10);

    updateAdjustCanvasPreview();

    // Đồng bộ trực tiếp sang iframe để thấy ngay
    if (studioElements.iframe && studioElements.iframe.contentWindow) {
        studioElements.iframe.contentWindow.postMessage({
            type: 'APPLY_IMAGE_ADJUSTMENT',
            payload: currentAdjustState
        }, '*');
    }
}

// Upload ảnh mới trong modal căn chỉnh
function handleModalImageUpload(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    if (file.size > 5 * 1024 * 1024) {
        alert('Vui lòng chọn ảnh dung lượng dưới 5MB để đảm bảo tốc độ mượt mà!');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        currentAdjustState.currentImage = e.target.result;
        updateAdjustCanvasPreview();

        // Gửi sang iframe ngay
        if (studioElements.iframe && studioElements.iframe.contentWindow) {
            studioElements.iframe.contentWindow.postMessage({
                type: 'APPLY_IMAGE_ADJUSTMENT',
                payload: currentAdjustState
            }, '*');
        }
    };
    reader.readAsDataURL(file);
}

// Áp dụng và lưu
function applyImageAdjustment() {
    // Nếu là ảnh bìa chính
    if (currentAdjustState.selector === '#w-4aeii491' && currentAdjustState.currentImage) {
        editorState.data.coverPhoto = currentAdjustState.currentImage;
        const coverPreview = document.getElementById('coverPhotoPreview');
        const coverBox = document.getElementById('coverPhotoUploadBox');
        if (coverPreview && coverBox) {
            coverPreview.src = currentAdjustState.currentImage;
            coverBox.classList.add('has-image');
        }
    }

    saveDraftToStorage();
    closeImageAdjustModal();
}

// Helper bỏ dấu tiếng Việt để tạo tên thư mục
function removeVietnameseTones(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

// Tính năng Tạo Folder Mới (Bảo vệ bản gốc base không bị sửa đè)
function exportToNewFolder() {
    const groom = removeVietnameseTones(editorState.data.groomNameShort || 'chu-re');
    const bride = removeVietnameseTones(editorState.data.brideNameShort || 'co-dau');
    const defaultFolderName = `thiep-${groom}-${bride}`;

    const folderName = prompt(`Nhập tên thư mục mới cần tạo (Bản gốc [${editorState.templateId}] sẽ được bảo vệ nguyên vẹn 100%):`, defaultFolderName);
    if (!folderName || folderName.trim() === '') return;

    const cleanFolder = removeVietnameseTones(folderName.trim());

    // Tạo file JSON cấu hình để xuất bản
    const configData = JSON.stringify(editorState.data, null, 2);
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanFolder}-data.json`;
    a.click();
    URL.revokeObjectURL(url);

    const cliCommand = `node scripts/create-card.js ${editorState.templateId} ${cleanFolder}`;

    alert(`🎉 ĐÃ XUẤT CẤU HÌNH THÀNH CÔNG!

1. File "${cleanFolder}-data.json" đã được tải về.
2. Để nhân bản thư mục riêng biệt ngay lập tức, bạn chỉ cần chạy lệnh sau trong terminal:
👉 ${cliCommand}

🔒 Bản base "${editorState.templateId}" của bạn hoàn toàn KHÔNG bị thay đổi!`);
}

// Export tường minh cho global window
window.openWeddingEditor = openWeddingEditor;
window.closeWeddingEditor = closeWeddingEditor;
window.switchStudioTab = switchStudioTab;
window.handleCoverImageSelect = handleCoverImageSelect;
window.removeCoverImage = removeCoverImage;
window.resetStudioDraft = resetStudioDraft;
window.openFullscreenPreview = openFullscreenPreview;
window.orderViaZalo = orderViaZalo;
window.copyShareLink = copyShareLink;
window.openImageAdjustModal = openImageAdjustModal;
window.closeImageAdjustModal = closeImageAdjustModal;
window.onImageAdjustSliderChange = onImageAdjustSliderChange;
window.handleModalImageUpload = handleModalImageUpload;
window.applyImageAdjustment = applyImageAdjustment;
window.exportToNewFolder = exportToNewFolder;

