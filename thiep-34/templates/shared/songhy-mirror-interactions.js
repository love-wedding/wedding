(function () {
  "use strict";
  var root = document.querySelector('[data-testid$="-template"]');
  if (!root) return;
  var nameTails = Array.from(root.querySelectorAll("[data-songhy-name-tail]"));
  var originalSizes = nameTails.map(function (element) { return element.style.fontSize; });
  function fitNameTails() {
    var canvas = document.createElement("canvas"), context = canvas.getContext("2d");
    if (!context) return;
    nameTails.forEach(function (element, index) {
      element.style.fontSize = originalSizes[index];
      var style = getComputedStyle(element), parentStyle = getComputedStyle(element.parentElement);
      var available = element.parentElement.clientWidth - parseFloat(parentStyle.paddingLeft || 0) - parseFloat(parentStyle.paddingRight || 0);
      var text = element.textContent || "";
      if (style.textTransform === "uppercase") text = text.toLocaleUpperCase("vi");
      context.font = style.fontWeight + " " + style.fontSize + " " + style.fontFamily;
      var width = context.measureText(text).width + Math.max(0,parseFloat(style.letterSpacing) || 0)*text.length;
      if (available > 0 && width > available) element.style.fontSize = Math.max(8,parseFloat(style.fontSize)*(available/width)*0.98)+"px";
    });
  }
  document.fonts.ready.then(fitNameTails);
  window.addEventListener("resize", fitNameTails);
  var animated = Array.from(root.querySelectorAll('[class*="-wow"]'));
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var element = entry.target;
      var prefix = Array.from(element.classList).find(function (name) { return name.endsWith("-wow"); }).slice(0, -4);
      element.setAttribute("data-" + prefix + "-state", "run");
      element.addEventListener("animationend", function done(event) {
        if (event.target !== element) return;
        element.setAttribute("data-" + prefix + "-state", "done");
        element.removeEventListener("animationend", done);
      });
      observer.unobserve(element);
    });
  });
  animated.forEach(function (element) {
    var prefix = Array.from(element.classList).find(function (name) { return name.endsWith("-wow"); });
    if (!prefix) return;
    if (reducedMotion) element.setAttribute("data-" + prefix.slice(0, -4) + "-state", "done");
    else observer.observe(element);
  });
  // Other captured designs fade sections in by a flag their own app set on
  // scroll: ".pst-reveal[data-pst-shown]" (Ngọc Trai Ngà),
  // ".kx-reveal-piece.kx-is-visible" (Sinh Nhật Khát Vọng Xanh)… Nothing
  // else sets those flags here, so every such block stayed transparent. The
  // stylesheets say which classes wait for which flag; set it as each one
  // scrolls into view.
  var waiting = {};
  var flagSelector = /\.([\w-]+)(?:\.[\w-]+)*?(?:\.([a-z0-9]+-is-visible)\b|\[data-([a-z0-9]+)-shown\])/g;
  function collectFlags(rules) {
    Array.from(rules || []).forEach(function (rule) {
      if (!rule.selectorText) { if (rule.cssRules) collectFlags(rule.cssRules); return; }
      var match;
      flagSelector.lastIndex = 0;
      while ((match = flagSelector.exec(rule.selectorText))) {
        waiting[match[1]] = match[2] ? { className: match[2] } : { attribute: "data-" + match[3] + "-shown" };
      }
    });
  }
  Array.from(document.styleSheets).forEach(function (sheet) {
    try { collectFlags(sheet.cssRules); } catch (_) { /* cross-origin sheet */ }
  });
  function showFlagged(element) {
    Object.keys(waiting).forEach(function (base) {
      if (!element.classList.contains(base)) return;
      if (waiting[base].className) element.classList.add(waiting[base].className);
      else element.setAttribute(waiting[base].attribute, "");
    });
  }
  var flagObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      showFlagged(entry.target);
      flagObserver.unobserve(entry.target);
      // A piece that starts shifted outside its section is clipped by the
      // section's overflow and never intersects; it shows with its section.
      Object.keys(waiting).forEach(function (base) {
        Array.from(entry.target.getElementsByClassName(base)).forEach(function (child) {
          showFlagged(child);
          flagObserver.unobserve(child);
        });
      });
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  Object.keys(waiting).forEach(function (base) {
    Array.from(root.getElementsByClassName(base)).forEach(function (element) {
      if (reducedMotion) showFlagged(element);
      else flagObserver.observe(element);
    });
  });
  // Hoàng Cung Đỏ opens its palace gate as the guest scrolls through the
  // hero; the source drove it with scroll-linked motion values that are not
  // part of the capture, so the hero sat on its first frame and the names
  // card inside the gate never showed. Keyframes read off the live demo:
  // clouds part, lanterns lift, the gate zooms through and fades, the card
  // fades in and grows, the "scroll" hint goes.
  var palaceGate = root.matches('[data-testid="royal-crimson-red-template"]')
    ? root.querySelector('[style*="transform-origin:50% 67%"]') : null;
  var palaceStage = palaceGate && palaceGate.closest(".sticky");
  if (palaceStage && palaceStage.children.length >= 6 && palaceStage.children[2] === palaceGate) {
    var palaceLayers = Array.from(palaceStage.children);
    var clamp01 = function (value) { return Math.max(0, Math.min(1, value)); };
    var openPalace = function () {
      var box = palaceStage.parentElement.getBoundingClientRect();
      var p = clamp01(-box.top / Math.max(1, box.height - window.innerHeight));
      var zoom = clamp01(p / 0.95);
      palaceLayers[0].style.transform = "translateX(" + (-40 * p) + "cqw)";
      palaceLayers[1].style.transform = "translateX(" + (40 * p) + "cqw)";
      palaceGate.style.transform = "translateX(-50%) scale(" + (1 + 2.8 * zoom * zoom * (3 - 2 * zoom)) + ")";
      palaceGate.style.opacity = String(1 - clamp01((p - 0.42) / 0.38));
      palaceGate.style.visibility = p >= 0.8 ? "hidden" : "";
      palaceLayers[3].style.transform = "translateY(" + (-55 * clamp01(p / 0.74)) + "vh)";
      palaceLayers[4].style.opacity = String(clamp01((p - 0.15) / 0.22));
      palaceLayers[4].style.transform = "scale(" + (0.9 + 0.1 * p) + ")";
      palaceLayers[5].style.opacity = String(1 - clamp01(p / 0.15));
    };
    window.addEventListener("scroll", openPalace, { passive: true });
    window.addEventListener("resize", openPalace);
    openPalace();
  }
  var slider = root.querySelector(".dyv-slider");
  if (slider) {
    var mainPhoto = slider.querySelector(".dyv-slider-photo img");
    var slides = Array.from(slider.querySelectorAll(".dyv-thumb"));
    var slideIndex = 0;
    function selectSlide(next) {
      if (!slides.length || !mainPhoto) return;
      slideIndex = (next + slides.length) % slides.length;
      mainPhoto.src = slides[slideIndex].querySelector("img").src;
      mainPhoto.alt = "Wedding photo " + (slideIndex + 1);
      slides.forEach(function (slide, index) { slide.classList.toggle("dyv-active", index === slideIndex); });
    }
    slides.forEach(function (slide, index) { slide.addEventListener("click", function () { selectSlide(index); }); });
    var slidePrev = slider.querySelector(".dyv-prev"), slideNext = slider.querySelector(".dyv-next");
    if (slidePrev) slidePrev.addEventListener("click", function () { selectSlide(slideIndex - 1); });
    if (slideNext) slideNext.addEventListener("click", function () { selectSlide(slideIndex + 1); });
  }
  // Keep the source lightbox and its thumbnail rail. Sources are populated by
  // the importer because the archived React lightbox initially has no src.
  var dialog = root.querySelector("dialog.modal");
  if (dialog) {
    var thumbnails = Array.from(dialog.querySelectorAll('button[aria-label*="View image"]'));
    var image = dialog.querySelector('img[alt^="Ảnh cưới"]');
    var count = dialog.querySelector("div.absolute.left-2.top-2");
    var index = 0;
    var scale = 1, tx = 0, ty = 0;
    function transform() { if (image) image.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + scale + ")"; }
    function show(next) {
      if (!thumbnails.length || !image) return;
      index = (next + thumbnails.length) % thumbnails.length;
      scale = 1; tx = 0; ty = 0; transform();
      var source = thumbnails[index].querySelector("img");
      if (source) { image.src = source.src; image.alt = "Ảnh cưới " + (index + 1); }
      if (count) count.textContent = (index + 1) + " / " + thumbnails.length;
      thumbnails.forEach(function (button, i) { button.style.outline = i === index ? "2px solid currentColor" : "none"; });
    }
    var prev = dialog.querySelector('[aria-label="Previous image"]');
    var next = dialog.querySelector('[aria-label="Next image"]');
    if (prev) prev.addEventListener("click", function (event) { event.stopPropagation(); show(index - 1); });
    if (next) next.addEventListener("click", function (event) { event.stopPropagation(); show(index + 1); });
    thumbnails.forEach(function (button, i) { button.addEventListener("click", function (event) { event.stopPropagation(); show(i); }); });
    var triggers = Array.from(root.querySelectorAll('img[data-native-photo-slot]')).filter(function (img) { return !img.closest("dialog"); });
    triggers.forEach(function (img) {
      if (!/Wedding photo|Ảnh album/i.test(img.alt)) return;
      img.addEventListener("click", function () {
        var position = thumbnails.findIndex(function (button) { return button.querySelector("img").src === img.src; });
        show(Math.max(0, position)); dialog.showModal();
      });
    });
    dialog.addEventListener("click", function (event) { if (event.target === dialog || event.target.closest('[aria-label="Close lightbox"]')) dialog.close(); });
    document.addEventListener("keydown", function (event) { if (!dialog.open) return; if (event.key === "ArrowRight") show(index + 1); if (event.key === "ArrowLeft") show(index - 1); });
    if (image) {
      image.addEventListener("dblclick", function (event) { event.stopPropagation(); scale = scale > 1 ? 1 : 2.5; tx = 0; ty = 0; transform(); });
      var startX = 0, startY = 0, startTx = 0, startTy = 0, distance = 0, startScale = 1;
      image.addEventListener("touchstart", function (event) {
        if (!event.touches.length) return;
        startX = event.touches[0].clientX; startY = event.touches[0].clientY; startTx = tx; startTy = ty; startScale = scale;
        distance = event.touches.length > 1 ? Math.hypot(event.touches[0].clientX-event.touches[1].clientX,event.touches[0].clientY-event.touches[1].clientY) : 0;
      }, { passive: true });
      image.addEventListener("touchmove", function (event) {
        if (event.touches.length > 1 && distance) {
          event.preventDefault(); scale = Math.max(1,Math.min(6,startScale*Math.hypot(event.touches[0].clientX-event.touches[1].clientX,event.touches[0].clientY-event.touches[1].clientY)/distance)); transform();
        } else if (event.touches.length && scale > 1) {
          event.preventDefault(); tx = startTx+event.touches[0].clientX-startX; ty = startTy+event.touches[0].clientY-startY; transform();
        }
      }, { passive: false });
      image.addEventListener("touchend", function (event) {
        if (!distance && scale === 1 && event.changedTouches.length) {
          var delta = event.changedTouches[0].clientX-startX;
          if (Math.abs(delta)>50) show(index+(delta<0?1:-1));
        }
        if (scale === 1) { tx = 0; ty = 0; transform(); }
      });
    }
  }
  // FAQ controls in the newer story templates use React state in the source.
  root.querySelectorAll('button[aria-expanded]').forEach(function (button) {
    var answer = button.nextElementSibling;
    if (!answer) return;
    button.addEventListener("click", function () {
      var open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open)); answer.hidden = !open;
    });
  });
})();
