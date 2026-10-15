/**
 * LOVE WEDDING - CLONE CARD GENERATOR
 * Lệnh CLI: node scripts/create-card.js <base-template> <new-folder-name> [custom-data-json]
 * Ví dụ: node scripts/create-card.js thiep-4 thiep-minh-quan-mai-anh
 * Đảm bảo: KHÔNG BAO GIỜ can thiệp hay sửa đè vào thư mục base gốc!
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const baseTemplate = args[0] || 'thiep-4';
const newFolderName = args[1];
const dataJsonPath = args[2];

const ROOT = path.resolve(__dirname, '..');
const sourceDir = path.join(ROOT, baseTemplate);

if (!newFolderName) {
    console.error('❌ Lỗi: Vui lòng cung cấp tên thư mục mới cần tạo!');
    console.log('👉 Cú pháp: node scripts/create-card.js <base-template> <new-folder-name> [data.json]');
    console.log('👉 Ví dụ:   node scripts/create-card.js thiep-4 thiep-duc-linh');
    process.exit(1);
}

const targetDir = path.join(ROOT, newFolderName);

if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Lỗi: Thư mục mẫu gốc "${baseTemplate}" không tồn tại tại: ${sourceDir}`);
    process.exit(1);
}

if (fs.existsSync(targetDir)) {
    console.warn(`⚠️ Cảnh báo: Thư mục "${newFolderName}" đã tồn tại! Hệ thống sẽ cập nhật nội dung.`);
} else {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Hàm copy đệ quy an toàn
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

console.log(`🚀 Đang nhân bản từ mẫu gốc [${baseTemplate}] sang thư mục riêng [${newFolderName}]...`);
copyRecursiveSync(sourceDir, targetDir);

// Đọc dữ liệu tùy biến nếu có
let customData = null;
if (dataJsonPath && fs.existsSync(dataJsonPath)) {
    try {
        customData = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
    } catch (e) {
        console.warn('⚠️ Không thể đọc file dataJson, giữ nguyên mặc định.');
    }
}

// Nếu có customData, inject sẵn dữ liệu vào index.html của thư mục mới
const targetIndexHtml = path.join(targetDir, 'index.html');
if (fs.existsSync(targetIndexHtml) && customData) {
    let html = fs.readFileSync(targetIndexHtml, 'utf8');

    // Chèn script nạp dữ liệu cố định vào trước thẻ đóng </body>
    const payloadScript = `
    <!-- Preloaded Wedding Custom Data -->
    <script>
        window.PRELOADED_WEDDING_DATA = ${JSON.stringify(customData, null, 2)};
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                if (window.postMessage) {
                    window.postMessage({ type: 'UPDATE_WEDDING_DATA', payload: window.PRELOADED_WEDDING_DATA }, '*');
                }
            }, 300);
        });
    </script>
    `;
    html = html.replace('</body>', `${payloadScript}\n</body>`);
    fs.writeFileSync(targetIndexHtml, html, 'utf8');
}

console.log(`✅ HOÀN TẤT! Đã tạo thành công thư mục mới: ${targetDir}`);
console.log(`👉 Link xem trực tiếp: http://localhost:3000/${newFolderName}/index.html`);
console.log(`🔒 Thư mục gốc [${baseTemplate}] được giữ nguyên vẹn 100%!`);
