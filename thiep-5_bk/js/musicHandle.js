// Lấy phần tử audio và các nút bật/tắt loa
const audio_music = document.getElementById("audio_music");
const on_speaker = $(".on_speaker");
const off_speaker = $(".off_speaker");

// Kiểm tra chế độ iframe (nếu URL có "iframeMode=true")
let urlWedding = window.location.href;
let isIframeMode = urlWedding.includes("iframeMode=true");

// Nếu KHÔNG ở iframe mode thì mới bật chức năng nhạc
if (!isIframeMode) {
  // Mặc định: hiển thị nút "loa đang bật", ẩn "loa tắt"
  on_speaker.hide();
  off_speaker.hide();

  // Hàm cập nhật giao diện theo trạng thái nhạc
  function checkSpeaker() {
    if (!audio_music.paused) {
      // Nếu nhạc đang phát → hiện icon "loa bật"
      off_speaker.hide();
      on_speaker.show();
    } else {
      // Nếu nhạc tạm dừng → hiện icon "loa tắt"
      off_speaker.show();
      on_speaker.hide();
    }
  }

  // Khi trang load lại check trạng thái nhạc
  $(window).on("load", function () {
    checkSpeaker();
  });

  let checkCurrentMusic = false;

  // Khi click nút loa tắt → bật nhạc
  off_speaker.click(function () {
    if ("timeMusic" in window) {
      if (checkCurrentMusic === false) {
        // Bắt đầu phát nhạc, sau đó set lại thời gian bắt đầu
        audio_music
          .play()
          .then(() => {
            audio_music.pause();
            audio_music.currentTime = timeMusic;
            audio_music.play();
            checkCurrentMusic = true;
          })
          .catch((error) => {
            console.error("Không thể phát nhạc:", error);
          });
      } else {
        audio_music.play();
      }
    } else {
      audio_music.play();
    }

    checkSpeaker();
  });

  // Khi click nút loa bật → tắt nhạc
  on_speaker.click(function () {
    audio_music.pause();
    checkSpeaker();
  });
} else {
  // Nếu đang trong iframe → tắt nhạc luôn
  audio_music.pause();
}
