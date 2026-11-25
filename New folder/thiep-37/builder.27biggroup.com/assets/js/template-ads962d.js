/**
 * template-ads.js — Inject quảng cáo vào template (SEC-End, SEC-Album)
 * Đọc window.WB_AD_SLUG và window.WB_AD_BASE được set bởi view.php
 */
(function () {
  var slug    = window.WB_AD_SLUG || '';
  var base    = window.WB_AD_BASE || '';
  var showAds = window.WB_AD_SHOW !== 0; // 0 = tắt quảng cáo cho link này
  if (!slug || !base || !showAds) return;

  var positions = [
    { cls: 'SEC-End',   pos: 'sec_end' },
    { cls: 'SEC-Album', pos: 'sec_album' }
  ];

  /**
   * Lấy background của section từ .ladi-section-background
   * Trả về object { color, img } — cả hai có thể rỗng.
   *
   * LadiPage thêm class .ladi-lazyload vào các section ngoài viewport,
   * và CSS tĩnh ".ladi-lazyload { background-image: none !important }" ngăn
   * getComputedStyle() đọc đúng giá trị. Class này chỉ mất khi user scroll.
   * → Tạm thời remove class trước khi đọc, restore sau. getComputedStyle()
   *   force recalculation ngay lập tức nên đọc đúng giá trị.
   */
  function getSectionBg(el) {
    var bgEl = el.querySelector('.ladi-section-background') || el;

    // Tạm thời remove ladi-lazyload để getComputedStyle trả về đúng background
    var lazyEls = [];
    [el, bgEl].forEach(function (e) {
      if (e && e.classList && e.classList.contains('ladi-lazyload')) {
        e.classList.remove('ladi-lazyload');
        lazyEls.push(e);
      }
    });

    var inlineColor = bgEl.style.backgroundColor;
    var inlineImg   = bgEl.style.backgroundImage;
    var cs = window.getComputedStyle(bgEl); // force style recalculation
    var color = (inlineColor && inlineColor !== 'transparent') ? inlineColor : cs.backgroundColor;
    var img   = (inlineImg   && inlineImg   !== 'none')        ? inlineImg   : cs.backgroundImage;

    // Restore class
    lazyEls.forEach(function (e) { e.classList.add('ladi-lazyload'); });

    return {
      color: (color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') ? color : '',
      img:   (img   && img   !== 'none') ? img : ''
    };
  }

  /** Chuyển kết quả getSectionBg → chuỗi CSS để gán vào style */
  function bgToCss(bg) {
    var s = '';
    if (bg.color) s += 'background-color:' + bg.color + ';';
    if (bg.img)   s += 'background-image:' + bg.img + ';background-size:cover;background-position:center;';
    return s;
  }

  /** Xây dựng widget slideshow từ mảng items [{type, url, link}] */
  function buildWidget(items, containerId) {
    var wrap = document.createElement('div');
    wrap.className = 'wb-ad-widget';
    wrap.id = containerId;
    wrap.style.cssText = 'position:relative;padding:10px 0 6px;max-width:480px;margin:0 auto;box-sizing:border-box';

    // Nút ẩn
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.title = 'Ẩn quảng cáo';
    closeBtn.style.cssText = [
      'position:absolute;top:6px;right:8px;z-index:10',
      'background:rgba(0,0,0,.28);color:#fff;border:none;border-radius:50%',
      'width:22px;height:22px;font-size:11px;cursor:pointer;line-height:1',
      'display:flex;align-items:center;justify-content:center',
      'transition:background .15s'
    ].join(';');
    closeBtn.addEventListener('click', function () {
      wrap.parentNode && (wrap.parentNode.style.display = 'none');
    });
    wrap.appendChild(closeBtn);

    var label = document.createElement('div');
    label.style.cssText = 'font-size:10px;color:rgba(100,100,100,.7);text-align:right;padding:0 32px 4px 4px;letter-spacing:.04em';
    label.textContent = 'Quảng cáo';
    wrap.appendChild(label);

    var slideWrap = document.createElement('div');
    slideWrap.style.cssText = 'position:relative;overflow:hidden;border-radius:12px;line-height:0;margin:0 8px';

    var slidesEl = document.createElement('div');
    slidesEl.style.cssText = 'display:flex;transition:transform .5s ease;will-change:transform';

    var dotsEl = document.createElement('div');
    dotsEl.style.cssText = 'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:5px;z-index:2';

    var btnPrev = document.createElement('button');
    btnPrev.innerHTML = '&#8249;';
    btnPrev.style.cssText = 'position:absolute;left:6px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.35);color:#fff;border:none;border-radius:50%;width:28px;height:28px;font-size:16px;cursor:pointer;display:none;align-items:center;justify-content:center;z-index:2;line-height:1';

    var btnNext = document.createElement('button');
    btnNext.innerHTML = '&#8250;';
    btnNext.style.cssText = 'position:absolute;right:6px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.35);color:#fff;border:none;border-radius:50%;width:28px;height:28px;font-size:16px;cursor:pointer;display:none;align-items:center;justify-content:center;z-index:2;line-height:1';

    items.forEach(function (item, i) {
      var slide = document.createElement('div');
      slide.style.cssText = 'flex-shrink:0;width:100%;line-height:0';

      if (item.type === 'video') {
        var ytMatch = item.url.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([\w-]{11})/);
        var ytId = ytMatch ? ytMatch[1] : '';
        if (ytId) {
          var iWrap = document.createElement('div');
          // padding-top:56.25% = tỉ lệ 16:9 — thay aspect-ratio (không hỗ trợ iOS WebView cũ)
          iWrap.style.cssText = 'position:relative;width:100%;padding-top:56.25%';
          var iframe = document.createElement('iframe');
          // Round 582 — youtube-nocookie: quảng cáo của 27BigGroup trên thiệp khách không để YouTube đặt cookie theo dõi khách mời
          iframe.src = 'https://www.youtube-nocookie.com/embed/' + ytId +
            '?autoplay=1&mute=1&loop=1&playlist=' + ytId + '&controls=0&rel=0&playsinline=1';
          iframe.allow = 'autoplay;encrypted-media';
          iframe.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;border:none;border-radius:12px';
          iWrap.appendChild(iframe);
          slide.appendChild(iWrap);
        } else {
          var vWrap = document.createElement('div');
          vWrap.style.cssText = 'position:relative;width:100%;padding-top:56.25%;background:#111;border-radius:12px;overflow:hidden';
          var vid = document.createElement('video');
          vid.loop = true;
          vid.setAttribute('playsinline', '');
          vid.setAttribute('webkit-playsinline', 'true');
          vid.setAttribute('x5-playsinline', 'true');
          vid.setAttribute('x5-video-player-type', 'h5');
          vid.setAttribute('x5-video-player-fullscreen', 'false');
          vid.setAttribute('muted', '');
          vid.muted = true;
          vid.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;object-fit:cover;display:block';
          var _fm = item.url.match(/[?&]f=([^&]+)/);
          var _fp = _fm ? decodeURIComponent(_fm[1]) : item.url.split('?')[0];
          var _fe = _fp.split('.').pop().toLowerCase();
          var vSrc = document.createElement('source');
          vSrc.type = (_fe === 'webm') ? 'video/webm' : 'video/mp4';
          vSrc.src  = item.url;
          vid.appendChild(vSrc);
          vid.setAttribute('controls', '');
          vWrap.appendChild(vid);
          slide.appendChild(vWrap);
          vid.setAttribute('preload', 'auto');
          vid.load();
          vid.addEventListener('playing', function () {
            // autoplay thành công (desktop/browser) → ẩn controls, video tự chạy muted
            vid.removeAttribute('controls');
          });
          vid.addEventListener('canplay', function () { vid.play().catch(function () {}); });
        }
      } else {
        var img = document.createElement('img');
        img.src = item.url; img.alt = '';
        img.loading = 'lazy';
        img.style.cssText = 'width:100%;display:block;border-radius:12px;cursor:' + (item.link ? 'pointer' : 'default');
        if (item.link) {
          img.addEventListener('click', (function (link) {
            return function () { window.open(link, '_blank', 'noopener'); };
          })(item.link));
        }
        slide.appendChild(img);
      }

      slidesEl.appendChild(slide);

      if (items.length > 1) {
        var dot = document.createElement('span');
        dot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:' +
          (i === 0 ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.45)') +
          ';cursor:pointer;transition:background .3s;flex-shrink:0';
        dot.addEventListener('click', (function (n) { return function () { go(n); }; })(i));
        dotsEl.appendChild(dot);
      }
    });

    slideWrap.appendChild(slidesEl);
    slideWrap.appendChild(dotsEl);
    slideWrap.appendChild(btnPrev);
    slideWrap.appendChild(btnNext);
    wrap.appendChild(slideWrap);

    var cur = 0, timer = null;

    function go(n) {
      cur = n;
      slidesEl.style.transform = 'translateX(-' + (n * 100) + '%)';
      dotsEl.querySelectorAll('span').forEach(function (d, i) {
        d.style.background = i === n ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.45)';
      });
      resetTimer();
    }

    function resetTimer() {
      clearInterval(timer);
      if (items.length > 1) {
        timer = setInterval(function () { go((cur + 1) % items.length); }, 4000);
      }
    }

    if (items.length > 1) {
      btnPrev.style.display = btnNext.style.display = 'flex';
      btnPrev.addEventListener('click', function () { go((cur - 1 + items.length) % items.length); });
      btnNext.addEventListener('click', function () { go((cur + 1) % items.length); });
    }

    resetTimer();
    return wrap;
  }

  /** Chuyển URL relative → absolute dùng base (builder.27biggroup.com) */
  function toAbsUrl(url) {
    if (!url) return url;
    return (url.charAt(0) === '/') ? base + url : url;
  }

  /** Chuyển đổi ads JSON → mảng items */
  function adsToItems(ads) {
    var items = [];
    ads.forEach(function (ad) {
      if (ad.type === 'video') {
        items.push({ type: 'video', url: toAbsUrl(ad.video_url || ''), link: ad.link_url || '' });
      } else if (ad.type === 'slideshow' && ad.images && ad.images.length) {
        ad.images.forEach(function (img) {
          items.push({ type: 'image', url: toAbsUrl(img), link: ad.link_url || '' });
        });
      } else if (ad.images && ad.images[0]) {
        items.push({ type: 'image', url: toAbsUrl(ad.images[0]), link: ad.link_url || '' });
      }
    });
    return items;
  }

  function loadAndInject(cfg) {
    var el = document.querySelector('.' + cfg.cls);
    if (!el) return;

    var cid = 'wb-ad-tpl-' + cfg.pos;
    // Guard: tránh inject 2 lần nếu init được gọi nhiều lần
    if (document.getElementById(cid)) return;

    // Lấy background của section — đọc tại thời điểm này (LadiPage đã xong)
    var bg = getSectionBg(el);

    var url = base + '/php/api/get_ads.php?slug=' + encodeURIComponent(slug) + '&position=' + cfg.pos;
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ads || !data.ads.length) return;
        var items = adsToItems(data.ads);
        if (!items.length) return;
        // Guard lần 2: phòng 2 fetch song song cùng resolve
        if (document.getElementById(cid)) return;
        var widget = buildWidget(items, cid);
        var outerWrap = document.createElement('div');
        outerWrap.style.cssText = 'width:100%;' + bgToCss(bg) + 'box-sizing:border-box';
        outerWrap.appendChild(widget);
        // Insert AFTER the section element
        if (el.nextSibling) {
          el.parentNode.insertBefore(outerWrap, el.nextSibling);
        } else {
          el.parentNode.appendChild(outerWrap);
        }
        // canplay listener và fallback timeout đã xử lý autoplay/show-overlay bên trong buildWidget
      })
      .catch(function () {});
  }

  function init() {
    positions.forEach(loadAndInject);
  }

  // Dùng window.load thay vì DOMContentLoaded:
  // LadiPage load bằng async/defer từ CDN → chưa chắc xong lúc DOMContentLoaded.
  // window.load fires SAU KHI tất cả scripts (kể cả async) đã tải và chạy xong
  // → đảm bảo LadiPage đã apply màu nền trước khi getSectionBg() đọc.
  if (document.readyState === 'complete') {
    // Script chạy sau khi page đã load xong (ví dụ inject động)
    setTimeout(init, 300);
  } else {
    window.addEventListener('load', function () { setTimeout(init, 300); });
  }
})();
