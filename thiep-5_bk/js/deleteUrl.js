function deleteUrl() {
  // Lấy URL hiện tại
  const url = new URL(window.location.href);

  // Danh sách các query params muốn xóa
  const paramsToRemove = [
    "utm_campaign",
    "utm_medium",
    "utm_source",
    "fbclid",
    "zarsrc",
    "gidzl",
  ];

  // Xóa từng param (nếu có)
  paramsToRemove.forEach((param) => url.searchParams.delete(param));

  // Cập nhật address bar mà không reload trang
  window.history.replaceState(null, null, url.href);
}

// Gọi ngay để dọn URL khi script chạy
deleteUrl();
