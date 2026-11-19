(function () {
  "use strict";

  var BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

  function toBengaliDigits(value) {
    return String(value).replace(/\d/g, function (d) {
      return BENGALI_DIGITS[Number(d)];
    });
  }

  function formatBengaliTwoDigit(num) {
    var safe = Math.max(0, Number(num) || 0);
    var padded = safe < 10 ? "0" + safe : String(safe);
    return toBengaliDigits(padded);
  }

  function prefersReducedMotion() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function createSvg(paths, width, height) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.9");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");

    paths.forEach(function (d) {
      var path = document.createElementNS(ns, "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    });
    return svg;
  }

  function createPhotoFallback(label) {
    var box = document.createElement("div");
    box.className = "photo-fallback";

    var iconWrap = document.createElement("div");
    iconWrap.className = "photo-fallback-icon";
    iconWrap.appendChild(
      createSvg(
        [
          "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z",
          "M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        ],
        22,
        22
      )
    );

    var title = document.createElement("span");
    title.className = "photo-fallback-title";
    title.textContent = label || "প্রমাণের ছবি";

    var sub = document.createElement("span");
    sub.className = "photo-fallback-sub";
    sub.textContent = "ছবি এখনো যুক্ত করা হয়নি";

    box.appendChild(iconWrap);
    box.appendChild(title);
    box.appendChild(sub);
    return box;
  }

  function mountImage(container, src, altText, imgClass, fallbackLabel) {
    container.innerHTML = "";
    var cleanSrc = typeof src === "string" ? src.trim() : "";

    if (!cleanSrc) {
      container.appendChild(createPhotoFallback(fallbackLabel));
      return null;
    }

    var img = document.createElement("img");
    img.className = imgClass;
    img.src = cleanSrc;
    img.alt = altText;
    img.loading = "eager";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";

    img.addEventListener("error", function () {
      container.innerHTML = "";
      container.appendChild(createPhotoFallback(fallbackLabel));
    });

    container.appendChild(img);
    return img;
  }

  var profile = window.PROFILE_DATA || {
    alias: "[ALIAS]",
    name: "তারিফ চৌধুরী",
    age: "১৮",
    status: "সম্পূর্ণ উন্মোচিত",
    caseNumber: "০১",
    photos: []
  };

  var photos = Array.isArray(profile.photos)
    ? profile.photos.filter(Boolean)
    : [];

  var heroCaseTagEl = document.getElementById("hero-case-tag");
  var heroAliasEl = document.getElementById("hero-alias");
  var heroSubtitleEl = document.getElementById("hero-subtitle");
  var infoNameEl = document.getElementById("info-name");
  var infoAliasEl = document.getElementById("info-alias");
  var infoAgeEl = document.getElementById("info-age");
  var infoStatusEl = document.getElementById("info-status");
  var photoCountEl = document.getElementById("photo-count");
  var photoGridEl = document.getElementById("photo-grid");

  var lightboxEl = document.getElementById("lightbox");
  var lightboxCounterEl = document.getElementById("lightbox-counter");
  var lightboxZoomBtn = document.getElementById("lightbox-zoom-btn");
  var lightboxCloseBtn = document.getElementById("lightbox-close-btn");
  var lightboxPrevBtn = document.getElementById("lightbox-prev-btn");
  var lightboxNextBtn = document.getElementById("lightbox-next-btn");
  var lightboxMediaMountEl = document.getElementById("lightbox-media-mount");
  var lightboxCaptionEl = document.getElementById("lightbox-caption");

  var activeIdx = 0;
  var lastFocusedEl = null;
  var lightboxCloseTimer = null;
  var isZoomed = false;

  function renderProfileInfo() {
    var caseNum = toBengaliDigits(profile.caseNumber || "০১");
    var alias = profile.alias || "[ALIAS]";
    var name = profile.name || "তারিফ চৌধুরী";
    var age = toBengaliDigits(profile.age || "১৮");
    var status = profile.status || "সম্পূর্ণ উন্মোচিত";

    if (heroCaseTagEl) {
      heroCaseTagEl.textContent = "ফাইল নং: #" + caseNum + " • বিশেষ পরিচিতি";
    }
    if (heroAliasEl) heroAliasEl.textContent = alias;
    if (heroSubtitleEl) heroSubtitleEl.textContent = "ওরফে " + name;
    if (infoNameEl) infoNameEl.textContent = name;
    if (infoAliasEl) infoAliasEl.textContent = alias;
    if (infoAgeEl) infoAgeEl.textContent = age + " বছর";
    if (infoStatusEl) infoStatusEl.textContent = status;
    if (photoCountEl) {
      photoCountEl.textContent = formatBengaliTwoDigit(photos.length);
    }
  }

  function renderGallery() {
    if (!photoGridEl) return;
    photoGridEl.innerHTML = "";
    photoGridEl.setAttribute("data-count", String(photos.length));

    var fragment = document.createDocumentFragment();

    photos.forEach(function (item, idx) {
      var serialLabel = "প্রমাণ " + formatBengaliTwoDigit(idx + 1);
      var captionText =
        typeof item.caption === "string" ? item.caption.trim() : "";

      var card = document.createElement("button");
      card.type = "button";
      card.className = "photo-card";
      card.style.setProperty("--delay", Math.min(idx * 65, 320) + "ms");
      card.setAttribute(
        "aria-label",
        (captionText || serialLabel) + " — বড় করে দেখুন"
      );

      var frame = document.createElement("div");
      frame.className = "photo-frame";

      var mount = document.createElement("div");
      mount.className = "photo-mount";
      mountImage(
        mount,
        item.src,
        (profile.name || "প্রোফাইল") + " — " + (captionText || serialLabel),
        "photo-img",
        serialLabel
      );

      var tag = document.createElement("span");
      tag.className = "photo-tag";
      tag.textContent = serialLabel;

      var zoomCue = document.createElement("span");
      zoomCue.className = "photo-zoom-cue";
      zoomCue.setAttribute("aria-hidden", "true");
      zoomCue.appendChild(
        createSvg(
          [
            "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
            "m21 21-4.35-4.35",
            "M11 8v6",
            "M8 11h6"
          ],
          14,
          14
        )
      );
      var cueLabel = document.createElement("span");
      cueLabel.textContent = "বড় করে দেখুন";
      zoomCue.appendChild(cueLabel);

      frame.appendChild(mount);
      frame.appendChild(tag);
      frame.appendChild(zoomCue);
      card.appendChild(frame);

      if (captionText) {
        var cap = document.createElement("p");
        cap.className = "photo-caption";
        cap.textContent = captionText;
        card.appendChild(cap);
      }

      card.addEventListener("click", function () {
        openLightbox(idx, card);
      });

      fragment.appendChild(card);
    });

    photoGridEl.appendChild(fragment);
  }

  function updateZoomLabel() {
    if (!lightboxZoomBtn) return;
    lightboxZoomBtn.textContent = isZoomed ? "স্বাভাবিক আকার" : "জুম করুন";
  }

  function toggleZoom() {
    if (!lightboxMediaMountEl) return;
    var img = lightboxMediaMountEl.querySelector(".lightbox-img");
    if (!img) return;
    isZoomed = !isZoomed;
    img.classList.toggle("is-zoomed", isZoomed);
    updateZoomLabel();
  }

  function renderLightboxPhoto() {
    if (!lightboxMediaMountEl || photos.length === 0) return;

    if (activeIdx < 0) activeIdx = photos.length - 1;
    if (activeIdx >= photos.length) activeIdx = 0;

    var item = photos[activeIdx];
    var serialLabel = "প্রমাণ " + formatBengaliTwoDigit(activeIdx + 1);
    var captionText =
      typeof item.caption === "string" && item.caption.trim()
        ? item.caption.trim()
        : serialLabel;

    isZoomed = false;
    updateZoomLabel();

    var img = mountImage(
      lightboxMediaMountEl,
      item.src,
      (profile.name || "প্রোফাইল") + " — " + captionText,
      "lightbox-img",
      serialLabel
    );

    if (img) {
      img.addEventListener("click", toggleZoom);
    }

    if (lightboxZoomBtn) {
      lightboxZoomBtn.disabled = !img;
    }

    if (lightboxCounterEl) {
      lightboxCounterEl.textContent =
        formatBengaliTwoDigit(activeIdx + 1) +
        " / " +
        formatBengaliTwoDigit(photos.length);
    }

    if (lightboxCaptionEl) {
      lightboxCaptionEl.textContent = captionText;
    }

    var single = photos.length <= 1;
    if (lightboxPrevBtn) lightboxPrevBtn.disabled = single;
    if (lightboxNextBtn) lightboxNextBtn.disabled = single;
  }

  function openLightbox(index, triggerEl) {
    if (!lightboxEl || photos.length === 0) return;

    if (lightboxCloseTimer) {
      window.clearTimeout(lightboxCloseTimer);
      lightboxCloseTimer = null;
    }

    lastFocusedEl = triggerEl || document.activeElement;
    activeIdx = index;
    renderLightboxPhoto();

    lightboxEl.classList.remove("closing");
    lightboxEl.hidden = false;
    void lightboxEl.offsetWidth;

    window.requestAnimationFrame(function () {
      lightboxEl.classList.add("open");
    });
    document.body.classList.add("lightbox-open");

    if (lightboxCloseBtn) {
      lightboxCloseBtn.focus();
    }
  }

  function closeLightbox() {
    if (!lightboxEl || !lightboxEl.classList.contains("open")) return;

    lightboxEl.classList.remove("open");
    lightboxEl.classList.add("closing");
    document.body.classList.remove("lightbox-open");
    isZoomed = false;
    updateZoomLabel();

    var finish = function () {
      if (!lightboxEl.classList.contains("open")) {
        lightboxEl.hidden = true;
        lightboxEl.classList.remove("closing");
      }
      lightboxCloseTimer = null;
    };

    if (prefersReducedMotion()) {
      finish();
    } else {
      lightboxCloseTimer = window.setTimeout(finish, 190);
    }

    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      lastFocusedEl.focus();
    }
  }

  function stepPhoto(delta) {
    if (photos.length <= 1) return;
    activeIdx = (activeIdx + delta + photos.length) % photos.length;
    renderLightboxPhoto();
  }

  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener("click", closeLightbox);
  }
  if (lightboxZoomBtn) {
    lightboxZoomBtn.addEventListener("click", toggleZoom);
  }
  if (lightboxPrevBtn) {
    lightboxPrevBtn.addEventListener("click", function () {
      stepPhoto(-1);
    });
  }
  if (lightboxNextBtn) {
    lightboxNextBtn.addEventListener("click", function () {
      stepPhoto(1);
    });
  }
  if (lightboxEl) {
    lightboxEl.addEventListener("click", function (event) {
      if (
        event.target === lightboxEl ||
        event.target.classList.contains("lightbox-stage")
      ) {
        closeLightbox();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (!lightboxEl || !lightboxEl.classList.contains("open")) return;
    if (event.key === "Escape") {
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      stepPhoto(-1);
    } else if (event.key === "ArrowRight") {
      stepPhoto(1);
    } else if (event.key === "+" || event.key === "=") {
      if (!isZoomed) toggleZoom();
    } else if (event.key === "-") {
      if (isZoomed) toggleZoom();
    }
  });

  renderProfileInfo();
  renderGallery();
})();
