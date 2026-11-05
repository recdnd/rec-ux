/**
 * Rec UX — load data/boards.json + data/cards.json, render rail(按板塊分組) + display.
 * Stable video flow: reset -> set src -> loadedmetadata (ratio) -> canplay (play).
 * 卡片的 media.type: "video"(預設, movies/<id>.mp4)或 "image"(media.src).
 */

(function () {
  "use strict";

  const DATA_URL = "data/cards.json";
  const BOARDS_URL = "data/boards.json";
  const THEME_KEY = "uxrec-theme";

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  /* 板塊順序照 boards.json; 沒登記板塊的卡排最後 */
  function normalizeCards(raw, boards) {
    if (!Array.isArray(raw)) return [];
    var rank = {};
    boards.forEach(function (b, i) {
      rank[b.id] = i;
    });
    function boardRank(c) {
      return c.board in rank ? rank[c.board] : 999;
    }
    return raw
      .filter(function (c) {
        return c && c.featured === true && c.id;
      })
      .sort(function (a, b) {
        var ba = boardRank(a);
        var bb = boardRank(b);
        if (ba !== bb) return ba - bb;
        var oa = typeof a.order === "number" ? a.order : 999;
        var ob = typeof b.order === "number" ? b.order : 999;
        return oa - ob;
      })
      .map(function (item) {
        var media = item.media && typeof item.media === "object" ? item.media : {};
        var isImage = media.type === "image" && media.src;
        /* media.v = 檔案內容的雜湊(record.mjs 重錄時寫入). 同一個檔名換了內容, 瀏覽器才不會播快取裡的舊片 */
        var ver = media.v ? "?v=" + encodeURIComponent(String(media.v)) : "";
        return Object.assign({}, item, {
          resolvedMedia: {
            type: isImage ? "image" : "video",
            src: (isImage ? String(media.src) : "movies/" + String(item.id) + ".mp4") + ver,
            poster: media.poster ? String(media.poster) + ver : "",
            alt: media.alt ? String(media.alt) : String(item.title || "Preview"),
          },
        });
      });
  }

  function rolesLine(item) {
    if (!Array.isArray(item.role) || item.role.length === 0) return "";
    return item.role
      .map(function (r) {
        return esc(r);
      })
      .join('<span class="rec-card__role-gap"> · </span>');
  }

  function productYearLine(item) {
    var p = item.product ? String(item.product) : "";
    var y = item.year ? String(item.year) : "";
    if (!p && !y) return "";
    if (p && y) return esc(p) + " · " + esc(y);
    return esc(p || y);
  }

  function buildDetailInner(item) {
    var d = item.detail;
    if (!d || typeof d !== "object") {
      return "";
    }
    var rows = [
      { label: "Problem", text: d.problem },
      { label: "Design move", text: d.designMove },
      { label: "Outcome", text: d.outcome },
    ];
    return rows
      .map(function (row) {
        if (!row.text) return "";
        return (
          '<section class="rec-card__detail-sect">' +
          '<h3 class="rec-card__detail-label">' +
          esc(row.label) +
          "</h3>" +
          '<p class="rec-card__detail-text">' +
          esc(row.text) +
          "</p>" +
          "</section>"
        );
      })
      .join("");
  }

  function resetMonitorShape(displayEl) {
    displayEl.removeAttribute("data-orientation");
    displayEl.style.setProperty("--rec-monitor-ratio", "16 / 10");
    displayEl.style.setProperty("--rec-monitor-max-width", "100%");
  }

  function applyMonitorRatio(videoEl, displayEl) {
    var w = videoEl.videoWidth;
    var h = videoEl.videoHeight;
    if (!w || !h) return;
    var ratio = w / h;
    displayEl.style.setProperty("--rec-monitor-ratio", w + " / " + h);
    if (ratio < 1) {
      displayEl.setAttribute("data-orientation", "portrait");
      displayEl.style.setProperty("--rec-monitor-max-width", "420px");
    } else {
      displayEl.setAttribute("data-orientation", "landscape");
      displayEl.style.setProperty("--rec-monitor-max-width", "100%");
    }
    console.log("[video metadata]", w, h);
  }

  function prepareVideoElement(videoEl) {
    videoEl.muted = true;
    videoEl.defaultMuted = true;
    videoEl.playsInline = true;
    videoEl.autoplay = true;
    videoEl.loop = true;
    videoEl.setAttribute("muted", "");
    videoEl.setAttribute("playsinline", "");
    videoEl.setAttribute("webkit-playsinline", "");
    videoEl.setAttribute("autoplay", "");
    videoEl.setAttribute("loop", "");
  }

  function applyTheme(theme, btn) {
    var isDark = theme === "dark";
    document.body.setAttribute("data-theme", isDark ? "dark" : "light");
    if (btn) {
      btn.setAttribute("aria-pressed", isDark ? "true" : "false");
      btn.textContent = isDark ? "🌕" : "🌑";
      btn.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );
    }
  }

  function initDockedPreview(dock, syncDockFloat) {
    if (!dock) return;
    var backdrop = dock.querySelector(".rec-dock__backdrop");
    if (!backdrop) return;

    var mq =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(max-width: 1139px)")
        : null;

    function setExpanded(on) {
      if (dock.getAttribute("data-dock-float") !== "true") {
        dock.setAttribute("data-expanded", "false");
        return;
      }
      dock.setAttribute("data-expanded", on ? "true" : "false");
    }

    backdrop.addEventListener("click", function (e) {
      e.stopPropagation();
      setExpanded(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (dock.getAttribute("data-dock-float") !== "true") return;
      if (dock.getAttribute("data-expanded") !== "true") return;
      setExpanded(false);
    });

    function onMqChange() {
      if (typeof syncDockFloat === "function") syncDockFloat();
    }

    if (mq) {
      if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", onMqChange);
      } else if (typeof mq.addListener === "function") {
        mq.addListener(onMqChange);
      }
    }
  }

  function initThemeToggle() {
    var btn = document.getElementById("rec-invert-toggle");
    var saved = "";
    try {
      saved = localStorage.getItem(THEME_KEY) || "";
    } catch (_) {}
    var initial = saved === "dark" ? "dark" : "light";
    applyTheme(initial, btn);

    if (!btn) return;
    btn.addEventListener("click", function () {
      var current = document.body.getAttribute("data-theme") === "dark" ? "dark" : "light";
      var next = current === "dark" ? "light" : "dark";
      applyTheme(next, btn);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (_) {}
    });
  }

  function renderCards(cases, rail, display, boards) {
    rail.textContent = "";
    var videoEl = display.querySelector(".rec-display__video");
    var imageEl = display.querySelector(".rec-display__image");
    var placeholderEl = display.querySelector(".rec-display__placeholder");
    var placeholderText = placeholderEl.querySelector(".rec-display__placeholder-text");
    var captionEl = display.querySelector(".rec-display__caption");

    var currentIndex = -1;
    var videoLoadGeneration = 0;
    var isVideoPaused = false;
    var isVideoPowerOff = false;

    function isMobileViewport() {
      return (
        typeof window.matchMedia === "function" &&
        window.matchMedia("(max-width: 1139px)").matches
      );
    }

    function syncDockFloat() {
      var dock = document.getElementById("rec-dock");
      if (!dock) return;
      var mobile = isMobileViewport();
      var portrait = display.getAttribute("data-orientation") === "portrait";
      var idle = display.getAttribute("data-idle") === "true";
      var on = mobile && portrait && !idle;
      if (on) {
        dock.setAttribute("data-dock-float", "true");
      } else {
        dock.removeAttribute("data-dock-float");
        dock.setAttribute("data-expanded", "false");
      }
    }

    function hideAllMedia() {
      videoEl.pause();
      videoEl.hidden = true;
      videoEl.removeAttribute("src");
      videoEl.removeAttribute("poster");
      videoEl.removeAttribute("aria-label");
      videoEl.removeAttribute("title");
      videoEl.removeAttribute("autoplay");
      videoEl.removeAttribute("loop");
      imageEl.hidden = true;
      imageEl.removeAttribute("src");
      imageEl.alt = "";
      placeholderEl.hidden = true;
      if (placeholderText) placeholderText.textContent = "";
    }

    function setIdleMonitor() {
      currentIndex = -1;
      isVideoPaused = false;
      isVideoPowerOff = false;
      hideAllMedia();
      resetMonitorShape(display);
      display.removeAttribute("data-power-off");
      placeholderEl.hidden = false;
      if (placeholderText) {
        placeholderText.textContent = "Preview monitor idle.";
      }
      captionEl.textContent = "SELECT A CASE";
      display.setAttribute("data-idle", "true");
      display.setAttribute(
        "aria-label",
        "Preview monitor."
      );
      setPlayingIndex(-1);
      updatePlayButtonStates();
      updateSignalButton();
      syncDockFloat();
    }

    function setPlayingIndex(playingIndex) {
      rail.querySelectorAll(".rec-card").forEach(function (el) {
        var idx = parseInt(el.getAttribute("data-case-index"), 10);
        var on = playingIndex >= 0 && idx === playingIndex;
        el.setAttribute("data-playing", on ? "true" : "false");
      });
    }

    /* ▶ / ⏸︎ 只看「是否當前 case + 實際是否在播」，與從卡片或按鈕進入無關 */
    function updatePlayButtonStates() {
      rail.querySelectorAll(".rec-card").forEach(function (card) {
        var idx = parseInt(card.getAttribute("data-case-index"), 10);
        var btn = card.querySelector(".rec-card__play");
        if (!btn) return;
        var item = cases[idx];
        var title = item && item.title ? String(item.title) : "case";
        var isActive = idx === currentIndex;
        var playingNow =
          isActive &&
          !isVideoPowerOff &&
          !videoEl.paused &&
          !videoEl.hasAttribute("hidden");
        if (playingNow) {
          btn.textContent = "\u23F8\uFE0E";
          btn.setAttribute("aria-label", "Pause " + title);
          btn.setAttribute("title", "Pause");
        } else {
          btn.textContent = "\u25B6";
          var canResume =
            isActive && !isVideoPowerOff && (videoEl.paused || videoEl.hasAttribute("hidden"));
          btn.setAttribute(
            "aria-label",
            (canResume ? "Resume " : "Play ") + title
          );
          btn.setAttribute("title", canResume ? "Resume" : "Play");
        }
      });
    }

    function updateSignalButton() {
      var signalBtn = display.querySelector(".rec-display__signal");
      if (!signalBtn) return;
      if (currentIndex < 0) {
        signalBtn.disabled = true;
        signalBtn.setAttribute("aria-label", "Video signal (no case selected)");
        signalBtn.removeAttribute("title");
        return;
      }
      signalBtn.disabled = false;
      if (isVideoPowerOff) {
        signalBtn.setAttribute("aria-label", "Turn video on");
        signalBtn.setAttribute("title", "Turn video on");
      } else {
        signalBtn.setAttribute("aria-label", "Turn video off");
        signalBtn.setAttribute("title", "Turn video off");
      }
    }

    function syncPauseStateFromVideo() {
      if (isVideoPowerOff) {
        updatePlayButtonStates();
        return;
      }
      isVideoPaused = videoEl.paused;
      updatePlayButtonStates();
    }

    function pauseCurrentVideo() {
      if (currentIndex < 0 || isVideoPowerOff) return;
      if (currentIsImage()) return;
      if (videoEl.hasAttribute("hidden")) return;
      videoEl.pause();
    }

    function resumeCurrentVideo() {
      if (currentIndex < 0 || isVideoPowerOff) return;
      if (currentIsImage()) return;
      videoEl.hidden = false;
      videoEl.removeAttribute("hidden");
      videoEl.play().catch(function () {});
    }

    function powerOffVideo() {
      if (currentIndex < 0 || isVideoPowerOff) return;
      isVideoPowerOff = true;
      isVideoPaused = false;
      videoEl.pause();
      videoEl.setAttribute("hidden", "");
      imageEl.hidden = true;
      placeholderEl.hidden = false;
      if (placeholderText) {
        placeholderText.textContent = "SIGNAL OFF";
      }
      captionEl.textContent = "SIGNAL OFF";
      display.setAttribute("data-power-off", "true");
      updatePlayButtonStates();
      updateSignalButton();
    }

    function powerOnVideo() {
      if (currentIndex < 0 || !isVideoPowerOff) return;
      isVideoPowerOff = false;
      isVideoPaused = false;
      placeholderEl.hidden = true;
      if (placeholderText) {
        placeholderText.textContent = "";
      }
      var item = cases[currentIndex];
      captionEl.textContent = item && item.title ? String(item.title) : "\u2014";
      display.removeAttribute("data-power-off");
      if (currentIsImage()) {
        imageEl.hidden = false;
      } else {
        videoEl.hidden = false;
        videoEl.removeAttribute("hidden");
        videoEl.play().catch(function () {});
      }
      updatePlayButtonStates();
      updateSignalButton();
    }

    function showVideoMedia(videoEl, displayEl, media, captionText) {
      var gen = ++videoLoadGeneration;
      resetMonitorShape(displayEl);
      syncDockFloat();

      videoEl.pause();
      videoEl.removeAttribute("src");
      videoEl.load();

      hideAllMedia();
      prepareVideoElement(videoEl);
      videoEl.hidden = false;
      videoEl.setAttribute("aria-label", media.alt || "Preview");
      if (media.poster) {
        videoEl.setAttribute("poster", media.poster);
      } else {
        videoEl.removeAttribute("poster");
      }

      var handleMetadata = function () {
        if (gen !== videoLoadGeneration) return;
        applyMonitorRatio(videoEl, displayEl);
        syncDockFloat();
      };
      var handleCanPlay = function () {
        if (gen !== videoLoadGeneration) return;
        videoEl.play().catch(function (err) {
          console.warn("Video play failed:", media.src, err);
        });
      };
      var handleError = function () {
        if (gen !== videoLoadGeneration) return;
        console.error("Video load failed:", media.src);
      };

      videoEl.addEventListener("loadedmetadata", handleMetadata, { once: true });
      videoEl.addEventListener("canplay", handleCanPlay, { once: true });
      videoEl.addEventListener("error", handleError, { once: true });

      videoEl.src = media.src;
      videoEl.load();

      captionEl.textContent = captionText || "—";
      displayEl.setAttribute("data-idle", "false");
      displayEl.setAttribute("aria-label", "Preview monitor. Click for next case.");
    }

    function showImageMedia(displayEl, media, captionText) {
      ++videoLoadGeneration;
      resetMonitorShape(displayEl);
      hideAllMedia();
      imageEl.onload = function () {
        var w = imageEl.naturalWidth;
        var h = imageEl.naturalHeight;
        if (!w || !h) return;
        displayEl.style.setProperty("--rec-monitor-ratio", w + " / " + h);
        displayEl.setAttribute("data-orientation", w / h < 1 ? "portrait" : "landscape");
        displayEl.style.setProperty("--rec-monitor-max-width", w / h < 1 ? "420px" : "100%");
        syncDockFloat();
      };
      imageEl.alt = media.alt || "";
      imageEl.src = media.src;
      imageEl.hidden = false;
      captionEl.textContent = captionText || "\u2014";
      displayEl.setAttribute("data-idle", "false");
      displayEl.setAttribute("aria-label", "Preview monitor. Click for next case.");
      syncDockFloat();
    }

    function currentIsImage() {
      var item = cases[currentIndex];
      return !!(item && item.resolvedMedia && item.resolvedMedia.type === "image");
    }

    videoEl.addEventListener("error", function () {
      if (videoEl.hasAttribute("hidden")) return;
      var err = videoEl.error;
      var code = err ? err.code : 0;
      var line =
        "Expected file at this URL (serve site over HTTP, not file://).";
      var cap = "VIDEO ERROR";
      if (code === 2) {
        cap = "NETWORK — 404 OR PATH";
        line =
          "Confirm movies/*.mp4 exists next to index.html and URL is correct.";
      } else if (code === 3) {
        cap = "DECODE ERROR";
        line = "File may be corrupt or truncated.";
      } else if (code === 4) {
        cap = "CODEC NOT SUPPORTED";
        line =
          "Use MP4 with H.264 video + AAC audio (e.g. ffmpeg -c:v libx264 -c:a aac).";
      }
      console.warn("[rec-display] video error", code, videoEl.currentSrc || videoEl.src);
      captionEl.textContent = cap;
      placeholderEl.hidden = false;
      if (placeholderText) {
        placeholderText.textContent = line;
      }
      videoEl.setAttribute("hidden", "");
      videoEl.pause();
      isVideoPowerOff = false;
      updatePlayButtonStates();
      updateSignalButton();
    });

    videoEl.addEventListener("play", syncPauseStateFromVideo);
    videoEl.addEventListener("pause", syncPauseStateFromVideo);

    function scrollCardIntoView(caseId, railEl) {
      if (!caseId || !railEl) return;
      var card = railEl.querySelector(
        '.rec-card[data-case-id="' + String(caseId).replace(/"/g, '\\"') + '"]'
      );
      if (!card) return;

      var cardRect = card.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight || 0;
      var margin = 12;
      var fullyVisible =
        cardRect.top >= margin &&
        cardRect.bottom <= vh - margin;

      if (fullyVisible) return;

      card.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }

    function playCaseByIndex(index) {
      if (index < 0 || index >= cases.length) return;
      currentIndex = index;
      isVideoPowerOff = false;
      isVideoPaused = false;
      display.removeAttribute("data-power-off");
      var item = cases[index];
      var media = item.resolvedMedia || {};
      writeAt({ caseId: item.id });
      console.log("[playCaseByIndex]", index, item.id, media.src);

      if (media.type === "image") {
        showImageMedia(display, media, item.title ? String(item.title) : "\u2014");
      } else {
        showVideoMedia(videoEl, display, media, item.title ? String(item.title) : "\u2014");
      }
      setPlayingIndex(index);
      updatePlayButtonStates();
      updateSignalButton();
      scrollCardIntoView(item.id, rail);
    }

    function boardIndices(board) {
      var out = [];
      cases.forEach(function (c, i) {
        if (!board || c.board === board) out.push(i);
      });
      return out;
    }

    function nextChannel() {
      if (cases.length === 0) return;
      if (currentIndex < 0) return;
      if (isVideoPowerOff) return;
      var list = boardIndices(currentBoard);
      var at = list.indexOf(currentIndex);
      playCaseByIndex(list[(at + 1) % list.length]);
    }

    function handlePlayButtonClick(index) {
      if (index !== currentIndex) {
        playCaseByIndex(index);
        return;
      }
      if (isVideoPowerOff) {
        powerOnVideo();
        return;
      }
      if (videoEl.paused) {
        resumeCurrentVideo();
      } else {
        pauseCurrentVideo();
      }
    }

    function handleCardBodyClick(index) {
      if (index !== currentIndex) {
        playCaseByIndex(index);
        return;
      }
      if (isVideoPowerOff) {
        powerOnVideo();
        return;
      }
      if (videoEl.paused) {
        resumeCurrentVideo();
      }
    }

    function onMonitorActivate(e) {
      if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
      if (e.type === "keydown") e.preventDefault();
      var dock = document.getElementById("rec-dock");
      var floatOn = dock && dock.getAttribute("data-dock-float") === "true";
      if (dock && floatOn && dock.getAttribute("data-expanded") !== "true") {
        dock.setAttribute("data-expanded", "true");
        return;
      }
      if (isMobileViewport()) return;
      if (currentIndex < 0) return;
      if (isVideoPowerOff) return;
      nextChannel();
    }

    display.addEventListener("click", function (e) {
      if (e.target.closest("a, button")) return;
      var dock = document.getElementById("rec-dock");
      var floatOn = dock && dock.getAttribute("data-dock-float") === "true";
      if (dock && floatOn && dock.getAttribute("data-expanded") !== "true") {
        e.preventDefault();
        e.stopPropagation();
        dock.setAttribute("data-expanded", "true");
        return;
      }
      if (isMobileViewport()) return;
      if (currentIndex < 0) return;
      if (isVideoPowerOff) return;
      nextChannel();
    });

    display.addEventListener("keydown", onMonitorActivate);

    var boardById = {};
    boards.forEach(function (b) {
      boardById[b.id] = b;
    });
    var shownBoards = [];
    cases.forEach(function (c) {
      if (c.board && shownBoards.indexOf(c.board) < 0) shownBoards.push(c.board);
    });

    /* 板塊導覽: 一次只看一個專案的事例(主筆 10-20「一長條行裡面應該就是一個專案的不同 case」). 點了切換, 不是捲動 */
    var currentBoard = null;
    var nav = null;
    if (shownBoards.length > 1) {
      nav = document.createElement("nav");
      nav.className = "rec-boardnav";
      nav.setAttribute("aria-label", "Projects");
      shownBoards.forEach(function (id) {
        var b = boardById[id] || { name: id };
        var a = document.createElement("a");
        a.className = "rec-boardnav__item";
        a.href = "#" + id;
        a.setAttribute("data-board", id);
        a.textContent = b.name;
        a.addEventListener("click", function (e) {
          e.preventDefault();
          selectBoard(id, true);
        });
        nav.appendChild(a);
      });
      rail.appendChild(nav);
    }

    var lastBoard = null;
    cases.forEach(function (item, index) {
      if (item.board && item.board !== lastBoard) {
        lastBoard = item.board;
        var b = boardById[item.board] || { name: item.board, line: "" };
        var head = document.createElement("header");
        head.className = "rec-board";
        head.id = "board-" + item.board;
        head.setAttribute("data-board", item.board);
        head.innerHTML =
          '<h2 class="rec-board__name">' +
          (b.url
            ? '<a href="' + esc(b.url) + '" target="_blank" rel="noopener">' + esc(b.name) + "</a>"
            : esc(b.name)) +
          "</h2>" +
          (b.line ? '<p class="rec-board__line">' + esc(b.line) + "</p>" : "");
        rail.appendChild(head);
      }
      var card = document.createElement("article");
      card.className = "rec-card";
      card.setAttribute("role", "listitem");
      card.setAttribute("data-case-id", item.id);
      card.setAttribute("data-case-index", String(index));
      card.setAttribute("data-playing", "false");
      card.setAttribute("data-collapsed", "false");
      if (item.board) card.setAttribute("data-board", item.board);

      var ctx = productYearLine(item);
      var rolesHtml = rolesLine(item);
      var detailInner = buildDetailInner(item);

      var metaHtml = "";
      if (rolesHtml || ctx) {
        metaHtml =
          '<div class="rec-card__meta">' +
          (rolesHtml ? '<p class="rec-card__roles">' + rolesHtml + "</p>" : "") +
          (ctx ? '<p class="rec-card__ctx">' + ctx + "</p>" : "") +
          "</div>";
      }

      var stackHtml =
        '<div class="rec-card__stack">' +
        '<p class="rec-card__statement">' +
        esc(item.statement || "") +
        "</p>" +
        (item.summary
          ? '<p class="rec-card__summary">' + esc(item.summary) + "</p>"
          : "") +
        (detailInner
          ? '<div class="rec-card__detail">' + detailInner + "</div>"
          : "") +
        metaHtml +
        "</div>";

      card.innerHTML =
        '<h2 class="rec-card__title">' +
        esc(item.title) +
        "</h2>" +
        stackHtml +
        '<div class="rec-card__controls">' +
        '<button type="button" class="rec-card__toggle" aria-expanded="true" aria-label="Collapse panel">−</button>' +
        '<button type="button" class="rec-card__play">▶</button>' +
        "</div>";

      var toggleBtn = card.querySelector(".rec-card__toggle");
      var playBtn = card.querySelector(".rec-card__play");
      playBtn.setAttribute("aria-label", "Play " + String(item.title || "case"));
      playBtn.setAttribute("title", "Play");

      function setCollapsed(collapsed) {
        card.setAttribute("data-collapsed", collapsed ? "true" : "false");
        toggleBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
        toggleBtn.textContent = collapsed ? "+" : "−";
        toggleBtn.setAttribute(
          "aria-label",
          collapsed ? "Expand panel" : "Collapse panel"
        );
      }

      toggleBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var collapsed = card.getAttribute("data-collapsed") === "true";
        setCollapsed(!collapsed);
      });

      playBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        handlePlayButtonClick(index);
      });

      card.addEventListener("click", function (e) {
        if (e.target.closest(".rec-card__toggle") || e.target.closest(".rec-card__play")) return;
        handleCardBodyClick(index);
      });

      rail.appendChild(card);
    });

    /* 條 20: 硬重整回到上次的專案 / 事例 / 捲動位置(每個瀏覽者自己的方便, 存 localStorage). 網址 #<板塊> 優先 */
    var AT_KEY = "uxrec.at.v1";
    function readAt() {
      try {
        return JSON.parse(localStorage.getItem(AT_KEY) || "null") || {};
      } catch (e) {
        return {};
      }
    }
    function writeAt(patch) {
      try {
        localStorage.setItem(AT_KEY, JSON.stringify(Object.assign(readAt(), patch)));
      } catch (e) {}
    }

    function selectBoard(board, playFirst) {
      currentBoard = board;
      rail.querySelectorAll("[data-board]").forEach(function (el) {
        if (el.classList.contains("rec-boardnav__item")) {
          el.setAttribute("aria-current", el.getAttribute("data-board") === board ? "true" : "false");
        } else {
          el.hidden = el.getAttribute("data-board") !== board;
        }
      });
      writeAt({ board: board });
      try {
        history.replaceState(null, "", "#" + board);
      } catch (e) {}
      if (playFirst) {
        var list = boardIndices(board);
        if (list.length) playCaseByIndex(list[0]);
        window.scrollTo(0, 0);
      }
    }

    var at = readAt();
    var hashBoard = decodeURIComponent((location.hash || "").replace(/^#/, ""));
    var startBoard = shownBoards.indexOf(hashBoard) >= 0 ? hashBoard : shownBoards.indexOf(at.board) >= 0 ? at.board : shownBoards[0] || null;
    var startIndex = -1;
    if (startBoard) {
      var inBoard = boardIndices(startBoard);
      var saved = at.caseId ? cases.findIndex(function (c) { return c.id === at.caseId; }) : -1;
      startIndex = inBoard.indexOf(saved) >= 0 ? saved : inBoard.length ? inBoard[0] : -1;
      selectBoard(startBoard, false);
    } else if (cases.length) {
      startIndex = 0;
    }
    var signalBtn = display.querySelector(".rec-display__signal");
    if (signalBtn) {
      signalBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (currentIndex < 0) return;
        if (isVideoPowerOff) {
          powerOnVideo();
        } else {
          powerOffVideo();
        }
      });
    }

    if (startIndex >= 0) {
      playCaseByIndex(startIndex);
      if (at.scrollY && !hashBoard) window.scrollTo(0, at.scrollY);
      var scrollTimer = 0;
      window.addEventListener("scroll", function () {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {
          writeAt({ scrollY: Math.round(window.scrollY) });
        }, 200);
      });
    } else {
      setIdleMonitor();
    }

    initDockedPreview(document.getElementById("rec-dock"), syncDockFloat);
  }

  function init() {
    initThemeToggle();
    var rail = document.getElementById("rec-rail");
    var display = document.getElementById("rec-display");
    if (!rail || !display) return;

    var boardsReq = fetch(BOARDS_URL, { cache: "no-cache" })
      .then(function (r) {
        return r.ok ? r.json() : [];
      })
      .catch(function () {
        return [];
      });
    var cardsReq = fetch(DATA_URL, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
    Promise.all([cardsReq, boardsReq])
      .then(function (both) {
        var raw = both[0];
        var boards = Array.isArray(both[1]) ? both[1] : [];
        var cases = normalizeCards(raw, boards);
        if (cases.length === 0) {
          rail.innerHTML =
            '<p class="rec-empty">No featured cards in data/cards.json.</p>';
          return;
        }
        renderCards(cases, rail, display, boards);
      })
      .catch(function () {
        rail.innerHTML =
          '<p class="rec-empty">Could not load data/cards.json. Serve this folder over HTTP (e.g. python3 -m http.server).</p>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
