/* ======================================================
   iPod mini player — forlong music
   ------------------------------------------------------
   HOW TO USE
   - Drag the iPod anywhere by its body or screen.
   - MENU opens the song list. Spin the wheel to scroll,
     press the center button to play the highlighted song.
   - On Now Playing, spinning the wheel changes the volume.
   - |<< and >>| skip songs. >|| plays and pauses.

   TO ADD OR CHANGE SONGS: edit the SONGS list below.
   One { ... } block per song. "audio" is the link to an
   mp3 file. "album" is optional and isn't shown on screen.
   ====================================================== */

const SONGS = [
  {
    name: "Dandelion",
    artist: "forlong",
    album: "dandelion",
    audio: "https://cdn.jsdelivr.net/gh/forlongmusic/forlongmusic.com@main/public/audio/Dandelion.m4a"
  }
];


/* ------------------------------------------------------
   Everything below runs the player. No need to edit.
   ------------------------------------------------------ */
(function () {
  "use strict";

  const STORE_KEY = "forlong-ipod-pos";
  const ICONS = {
    play: '<svg width="7" height="8" viewBox="0 0 7 8"><path d="M0 0v8l7-4z"/></svg>',
    pause: '<svg width="7" height="8" viewBox="0 0 7 8"><rect width="2.5" height="8"/><rect x="4.5" width="2.5" height="8"/></svg>',
    repeat: '<svg width="9" height="7" viewBox="0 0 9 7"><path d="M1 3V2h6V0l2 2-2 2V3H2v1H1zM8 4v1H2v2L0 5l2-2v1h5V4z"/></svg>',
    battery: '<svg width="14" height="7" viewBox="0 0 14 7"><path d="M0 0h12v7H0zM1 1v5h10V1zM12.5 2H14v3h-1.5z"/><rect x="2" y="2" width="8" height="3"/></svg>',
    prev: '<svg width="17" height="8" viewBox="0 0 17 8"><rect width="1.6" height="8"/><path d="M8.5 0v8L2 4zM15.5 0v8L9 4z"/></svg>',
    next: '<svg width="17" height="8" viewBox="0 0 17 8"><path d="M1.5 0v8L8 4zM8.5 0v8L15 4z"/><rect x="15.4" width="1.6" height="8"/></svg>',
    playpause: '<svg width="17" height="8" viewBox="0 0 17 8"><path d="M0 0v8l6.5-4z"/><rect x="9.5" width="2.4" height="8"/><rect x="13.6" width="2.4" height="8"/></svg>',
    spkLo: '<svg width="6" height="7" viewBox="0 0 6 7"><path d="M0 2h2l3-2v7L2 5H0z"/></svg>',
    spkHi: '<svg width="9" height="7" viewBox="0 0 9 7"><path d="M0 2h2l3-2v7L2 5H0zM6 1.5c1.3.9 1.3 3.1 0 4l.5.5c1.8-1.2 1.8-3.8 0-5zM7 0c2.4 1.6 2.4 5.4 0 7l.5.5C10.3 5.6 10.3 1.4 7.5-.5z"/></svg>'
  };

  /* ---------- build the iPod ---------- */
  const root = document.createElement("div");
  root.className = "ipm";
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", "Music player. Drag to move.");
  root.innerHTML = `
    <div class="ipm-body"></div>

    <div class="ipm-bezel">
      <div class="ipm-lcd" aria-live="polite">
        <div class="ipm-titlebar">
          <span class="ipm-state">${ICONS.pause}</span>
          <span class="ipm-title">Now Playing</span>
          <span class="ipm-battery">${ICONS.battery}</span>
        </div>

        <div class="ipm-view ipm-now ipm-on">
          <div class="ipm-count"><span class="ipm-count-text">1 of ${SONGS.length}</span>${ICONS.repeat}</div>
          <div class="ipm-line ipm-song"><span></span></div>
          <div class="ipm-line ipm-artist"><span></span></div>
          <div class="ipm-meter">
            <div class="ipm-progress">
              <div class="ipm-bar"><div class="ipm-fill ipm-time-fill"></div></div>
              <div class="ipm-times"><span class="ipm-elapsed">0:00</span><span class="ipm-remain">-0:00</span></div>
            </div>
            <div class="ipm-vol">
              ${ICONS.spkLo}
              <div class="ipm-bar"><div class="ipm-fill ipm-vol-fill"></div></div>
              ${ICONS.spkHi}
            </div>
          </div>
        </div>

        <div class="ipm-view ipm-menu">
          <ul class="ipm-list"></ul>
        </div>
      </div>
    </div>

    <div class="ipm-wheel">
      <button type="button" class="ipm-key ipm-menu-key" data-key="menu" aria-label="Menu">MENU</button>
      <button type="button" class="ipm-key ipm-prev-key" data-key="prev" aria-label="Previous song">${ICONS.prev}</button>
      <button type="button" class="ipm-key ipm-next-key" data-key="next" aria-label="Next song">${ICONS.next}</button>
      <button type="button" class="ipm-key ipm-play-key" data-key="play" aria-label="Play or pause">${ICONS.playpause}</button>
      <button type="button" class="ipm-center" data-key="select" aria-label="Select"></button>
    </div>
  `;

  const $ = (sel) => root.querySelector(sel);
  const el = {
    state: $(".ipm-state"),
    title: $(".ipm-title"),
    nowView: $(".ipm-now"),
    menuView: $(".ipm-menu"),
    count: $(".ipm-count-text"),
    song: $(".ipm-song"),
    artist: $(".ipm-artist"),
    timeFill: $(".ipm-time-fill"),
    elapsed: $(".ipm-elapsed"),
    remain: $(".ipm-remain"),
    volFill: $(".ipm-vol-fill"),
    list: $(".ipm-list"),
    wheel: $(".ipm-wheel"),
    lcd: $(".ipm-lcd")
  };

  const audio = new Audio();
  audio.preload = "metadata";
  audio.volume = 0.7;

  let index = 0;
  let view = "now";
  let selected = 0;
  let listTop = 0;

  /* ---------- helpers ---------- */
  const fmt = (t) => {
    if (!isFinite(t) || t < 0) t = 0;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  };

  function setLine(line, text) {
    const span = line.firstElementChild;
    span.textContent = text || "";
    line.classList.remove("ipm-marquee");
    requestAnimationFrame(() => {
      const overflow = span.offsetWidth - (line.clientWidth - 10);
      if (overflow > 0) {
        line.style.setProperty("--ipm-shift", -overflow + "px");
        line.classList.add("ipm-marquee");
      }
    });
  }

  // Backlight comes on with any touch and fades after a few seconds
  let lightTimer;
  function wake() {
    root.classList.add("ipm-lit");
    clearTimeout(lightTimer);
    lightTimer = setTimeout(() => root.classList.remove("ipm-lit"), 6000);
  }

  // The little click-wheel "tick"
  let ctx;
  function tick() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 1800;
      gain.gain.setValueAtTime(0.025, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.015);
    } catch (e) { /* no sound support, that's fine */ }
  }

  /* ---------- screens ---------- */
  function renderNow() {
    const song = SONGS[index];
    el.count.textContent = index + 1 + " of " + SONGS.length;
    setLine(el.song, song.name);
    setLine(el.artist, song.artist);
    renderTime();
  }

  function renderTime() {
    const d = audio.duration;
    const c = audio.currentTime;
    el.timeFill.style.width = (isFinite(d) && d > 0 ? (c / d) * 100 : 0) + "%";
    el.elapsed.textContent = fmt(c);
    el.remain.textContent = "-" + fmt((isFinite(d) ? d : 0) - c);
  }

  function renderState() {
    el.state.innerHTML = audio.paused ? ICONS.pause : ICONS.play;
  }

  function renderMenu() {
    el.list.innerHTML = "";
    SONGS.forEach((song, i) => {
      const li = document.createElement("li");
      li.innerHTML = "<span></span><b>&rsaquo;</b>";
      li.firstChild.textContent = song.name;
      if (i === selected) li.className = "ipm-sel";
      el.list.appendChild(li);
    });
    // keep the highlighted row in view, scrolling only when needed
    const rowH = 13;
    const visible = Math.max(1, Math.floor((el.lcd.clientHeight - 14) / rowH));
    if (selected < listTop) listTop = selected;
    if (selected >= listTop + visible) listTop = selected - visible + 1;
    el.list.style.transform = "translateY(" + -listTop * rowH + "px)";
  }

  function showView(name) {
    view = name;
    el.nowView.classList.toggle("ipm-on", name === "now");
    el.menuView.classList.toggle("ipm-on", name === "menu");
    el.title.textContent = name === "now" ? "Now Playing" : "Songs";
    if (name === "menu") {
      selected = index;
      renderMenu();
    } else {
      renderNow();
    }
  }

  /* ---------- playback ---------- */
  function load(i, autoplay) {
    index = (i + SONGS.length) % SONGS.length;
    audio.src = SONGS[index].audio;
    renderNow();
    if (autoplay) play();
  }

  function play() {
    const p = audio.play();
    if (p && p.catch) p.catch(() => {});
  }

  function togglePlay() {
    if (audio.paused) play();
    else audio.pause();
  }

  function prev() {
    // like a real iPod: restart the song if it's past the first few seconds
    if (audio.currentTime > 3) audio.currentTime = 0;
    else load(index - 1, !audio.paused);
  }

  function next(forcePlay) {
    load(index + 1, forcePlay === true || !audio.paused);
  }

  let volTimer;
  function changeVolume(dir) {
    audio.volume = Math.min(1, Math.max(0, Math.round((audio.volume + dir * 0.05) * 100) / 100));
    el.volFill.style.width = audio.volume * 100 + "%";
    root.classList.add("ipm-show-vol");
    clearTimeout(volTimer);
    volTimer = setTimeout(() => root.classList.remove("ipm-show-vol"), 1500);
  }

  audio.addEventListener("timeupdate", renderTime);
  audio.addEventListener("loadedmetadata", renderTime);
  audio.addEventListener("play", renderState);
  audio.addEventListener("pause", renderState);
  audio.addEventListener("ended", () => next(true));

  /* ---------- buttons ---------- */
  let suppressClick = false;

  function press(key) {
    wake();
    tick();
    if (key === "menu") showView(view === "now" ? "menu" : "now");
    else if (key === "prev") prev();
    else if (key === "next") next();
    else if (key === "play") togglePlay();
    else if (key === "select") {
      if (view === "menu") {
        load(selected, true);
        showView("now");
      } else {
        togglePlay();
      }
    }
  }

  el.wheel.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-key]");
    if (!btn || suppressClick) return;
    press(btn.dataset.key);
  });

  /* ---------- spinning the wheel ---------- */
  const STEP = (Math.PI * 2) / 20; // one tick every 18 degrees

  el.wheel.addEventListener("pointerdown", (e) => {
    e.stopPropagation(); // the wheel never drags the iPod
    if (e.target.closest(".ipm-center")) return;

    const r = el.wheel.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const angle = (ev) => Math.atan2(ev.clientY - cy, ev.clientX - cx);
    let last = angle(e);
    let acc = 0;
    let moved = false;

    function move(ev) {
      if (ev.pointerId !== e.pointerId) return;
      const a = angle(ev);
      let d = a - last;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      last = a;
      acc += d;
      while (Math.abs(acc) >= STEP) {
        const dir = acc > 0 ? 1 : -1;
        acc -= dir * STEP;
        moved = true;
        scroll(dir);
      }
    }

    function up(ev) {
      if (ev.pointerId !== e.pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (moved) {
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 0);
      }
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  });

  function scroll(dir) {
    wake();
    tick();
    if (view === "menu") {
      const n = Math.min(SONGS.length - 1, Math.max(0, selected + dir));
      if (n !== selected) {
        selected = n;
        renderMenu();
      }
    } else {
      changeVolume(dir);
    }
  }

  // mouse wheel / trackpad over the click wheel also scrolls
  el.wheel.addEventListener("wheel", (e) => {
    e.preventDefault();
    scroll(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  /* ---------- dragging the iPod around ---------- */
  function clampAndPlace(x, y) {
    const r = root.getBoundingClientRect();
    const maxX = window.innerWidth - r.width;
    const maxY = window.innerHeight - r.height;
    x = Math.min(Math.max(0, x), Math.max(0, maxX));
    y = Math.min(Math.max(0, y), Math.max(0, maxY));
    root.style.left = x + "px";
    root.style.top = y + "px";
    return { x, y };
  }

  function savePos() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        x: parseFloat(root.style.left),
        y: parseFloat(root.style.top)
      }));
    } catch (e) { /* storage blocked, fine */ }
  }

  root.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if (e.target.closest(".ipm-wheel")) return;
    e.preventDefault();
    wake();

    const r = root.getBoundingClientRect();
    const offX = e.clientX - r.left;
    const offY = e.clientY - r.top;
    root.classList.add("ipm-dragging");

    function move(ev) {
      if (ev.pointerId !== e.pointerId) return;
      clampAndPlace(ev.clientX - offX, ev.clientY - offY);
    }

    function up(ev) {
      if (ev.pointerId !== e.pointerId) return;
      root.classList.remove("ipm-dragging");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      savePos();
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  });

  window.addEventListener("resize", () => {
    clampAndPlace(parseFloat(root.style.left) || 0, parseFloat(root.style.top) || 0);
  });

  /* ---------- start ---------- */
  function start() {
    document.body.appendChild(root);

    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { saved = null; }

    const r = root.getBoundingClientRect();
    if (saved && isFinite(saved.x) && isFinite(saved.y)) {
      clampAndPlace(saved.x, saved.y);
    } else {
      // first visit: bottom-right corner
      clampAndPlace(window.innerWidth - r.width - 20, window.innerHeight - r.height - 20);
    }

    el.volFill.style.width = audio.volume * 100 + "%";
    load(0, false);
    renderState();
    root.classList.add("ipm-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
