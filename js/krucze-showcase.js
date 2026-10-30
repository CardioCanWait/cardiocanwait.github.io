(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let updatePlayback = () => {};
  const demos = [...document.querySelectorAll('[data-demo]')].map((device) => {
    const video = device.querySelector('video');
    const scroller = device.querySelector('.demo-scroll, .video-scroll');
    const button = device.querySelector('.device-control');
    const name = device.parentElement.querySelector('figcaption').textContent.trim();
    const state = { device, video, scroller, button, name, visible: false, userPaused: reducedMotion.matches, interacting: false, timer: null, animating: false, direction: 1, frame: null, lastTime: null };
    button.hidden = false;
    function syncControl() {
      const playing = video ? !video.paused : state.animating;
      button.dataset.playing = String(playing);
      button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${name}`);
      button.querySelector('span').textContent = playing ? 'Ⅱ' : '▶';
    }
    function stopScroll() {
      state.animating = false;
      if (state.frame !== null) cancelAnimationFrame(state.frame);
      state.frame = null;
      state.lastTime = null;
      syncControl();
    }
    function startScroll() {
      if (state.animating) return;
      state.animating = true;
      state.scrollPosition = scroller.scrollTop;
      function tick(time) {
        if (!state.animating) return;
        const max = scroller.scrollHeight - scroller.clientHeight;
        if (state.lastTime !== null && max > 0) {
          const next = state.scrollPosition + state.direction * Math.min(time - state.lastTime, 50) * 0.035;
          if (next >= max) { state.scrollPosition = max; state.direction = -1; }
          else if (next <= 0) { state.scrollPosition = 0; state.direction = 1; }
          else state.scrollPosition = next;
          scroller.scrollTop = state.scrollPosition;
        }
        state.lastTime = time;
        state.frame = requestAnimationFrame(tick);
      }
      state.frame = requestAnimationFrame(tick);
      syncControl();
    }
    state.start = () => { if (video) video.play().catch(syncControl); else startScroll(); };
    state.stop = () => { if (video) video.pause(); else stopScroll(); };
    function alignScrollToVideo() {
      if (video && !video.paused && Number.isFinite(video.duration) && video.duration) {
        const max = scroller.scrollHeight - scroller.clientHeight;
        scroller.scrollTop = max * video.currentTime / video.duration;
      }
    }
    function scheduleResume() {
      clearTimeout(state.timer);
      state.timer = setTimeout(() => { state.interacting = false; updatePlayback(state); }, 1800);
    }
    function beginInteraction() {
      if (!state.interacting) alignScrollToVideo();
      state.interacting = true;
      state.stop();
      scheduleResume();
    }
    button.addEventListener('click', () => {
      const playing = video ? !video.paused : state.animating;
      clearTimeout(state.timer);
      state.interacting = false;
      if (playing) { alignScrollToVideo(); state.userPaused = true; state.stop(); }
      else { state.userPaused = false; state.start(); }
      syncControl();
    });
    if (video) {
      video.controls = false;
      video.addEventListener('play', syncControl);
      video.addEventListener('pause', syncControl);
    }
    scroller.addEventListener('scroll', () => {
      if (state.interacting) scheduleResume();
      const max = scroller.scrollHeight - scroller.clientHeight;
      if (video && (state.userPaused || state.interacting) && max > 0 && Number.isFinite(video.duration) && video.duration) {
        video.currentTime = Math.min(video.duration - 0.01, video.duration * scroller.scrollTop / max);
      }
    }, { passive: true });
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach((type) => scroller.addEventListener(type, beginInteraction, { passive: true }));
    ['touchmove', 'pointermove'].forEach((type) => scroller.addEventListener(type, () => { if (state.interacting) scheduleResume(); }, { passive: true }));
    syncControl();
    return state;
  });
  updatePlayback = (state) => {
    if (state.visible && !state.userPaused && !state.interacting && !document.hidden) state.start(); else state.stop();
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const state = demos.find((demo) => demo.device === entry.target);
        if (state) { state.visible = entry.isIntersecting; updatePlayback(state); }
      }
    }, { threshold: 0.25 });
    demos.forEach((state) => observer.observe(state.device));
  } else demos.forEach((state) => { state.visible = true; updatePlayback(state); });
  document.addEventListener('visibilitychange', () => demos.forEach(updatePlayback));
  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) demos.forEach((state) => { state.userPaused = true; updatePlayback(state); });
  });
})();
