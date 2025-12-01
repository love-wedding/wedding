// Hàm xử lý dữ liệu và hiển thị MessageBox
function Handle_MessageBox(
  sheetId,
  range,
  nameCol,
  messageCol,
  filterCol,
  filterValue
) {
  // URL để lấy dữ liệu từ Google Sheets
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${range}&range=A1:O1000`;

  fetch(url)
    .then((res) => res.text())
    .then((data) => {
      // Dữ liệu trả về của Google Sheets có phần thừa ở đầu/cuối => cắt đi
      const jsonText = data.substr(47).slice(0, -2);
      const parsed = JSON.parse(jsonText);

      const container = document.getElementById("MessageBox");
      const rows = parsed.table.rows.length;

      // Duyệt qua các dòng dữ liệu từ dưới lên
      for (let i = rows - 1; i > 0; i--) {
        try {
          const row = parsed.table.rows[i].c;

          // Lọc dữ liệu theo cột filterCol (nếu có)
          if (row[filterCol].v == filterValue || filterValue === "NULL") {
            // Tạo khung chứa message item
            const item = document.createElement("div");
            item.classList.add("MessageBox-item");

            // Tên (h2)
            const name = document.createElement("h2");
            name.classList.add("MessageBox-item-name");
            name.appendChild(document.createTextNode(row[nameCol].v));

            // Nội dung message (p)
            const message = document.createElement("p");
            message.classList.add("MessageBox-item-message");
            message.appendChild(document.createTextNode(row[messageCol].v));

            // Gắn vào item
            item.append(name, message);

            // Thêm vào container
            container.appendChild(item);
          }
        } catch (e) {
          continue; // bỏ qua lỗi nếu có dòng trống
        }
      }
    });
}

// Hàm lắng nghe click và refresh messagebox
function Refesh_MessageBox(
  triggerSelector,
  sheetId,
  range,
  nameCol,
  messageCol,
  filterCol,
  filterValue
) {
  $(document).ready(function () {
    $(triggerSelector).click(function () {
      // Refresh 3 lần với khoảng cách thời gian khác nhau
      setTimeout(function () {
        $("#MessageBox").text(location.href + " #MessageBox>*", "");
        Handle_MessageBox(
          sheetId,
          range,
          nameCol,
          messageCol,
          filterCol,
          filterValue
        );
      }, 2000);

      setTimeout(function () {
        $("#MessageBox").text(location.href + " #MessageBox>*", "");
        Handle_MessageBox(
          sheetId,
          range,
          nameCol,
          messageCol,
          filterCol,
          filterValue
        );
      }, 5000);

      setTimeout(function () {
        $("#MessageBox").text(location.href + " #MessageBox>*", "");
        Handle_MessageBox(
          sheetId,
          range,
          nameCol,
          messageCol,
          filterCol,
          filterValue
        );
      }, 10000);
    });
  });
}

// Hàm chạy MessageBox (kết hợp refresh và load ban đầu)
function run_MessageBox(
  triggerSelector,
  sheetId,
  range,
  nameCol,
  messageCol,
  filterCol,
  filterValue
) {
  Refesh_MessageBox(
    triggerSelector,
    sheetId,
    range,
    nameCol,
    messageCol,
    filterCol,
    filterValue
  );
  Handle_MessageBox(
    sheetId,
    range,
    nameCol,
    messageCol,
    filterCol,
    filterValue
  );
}
