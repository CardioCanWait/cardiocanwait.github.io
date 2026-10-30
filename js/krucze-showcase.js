(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const demos = [...document.querySelectorAll('[data-demo]')].map((device) => {
    const video = device.querySelector('video');
    const scroller = device.querySelector('.demo-scroll');
    const button = device.querySelector('.device-control');
    const name = device.parentElement.querySelector('figcaption').textContent.trim();
    const state = { device, video, scroller, button, name, visible: false, userPaused: reducedMotion.matches, animating: false, direction: 1, frame: null, lastTime: null };
    button.hidden = false;
    function syncControl() {
      const playing = video ? !video.paused : state.animating;
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
    state.start = () => {
      if (video) video.play().catch(syncControl);
      else startScroll();
    };
    state.stop = () => {
      if (video) video.pause();
      else stopScroll();
    };
    function pauseForInteraction() { state.userPaused = true; state.stop(); }
    button.addEventListener('click', () => {
      const playing = video ? !video.paused : state.animating;
      state.userPaused = playing;
      if (playing) state.stop(); else state.start();
      syncControl();
    });
    if (video) {
      video.controls = false;
      video.tabIndex = 0;
      video.addEventListener('play', syncControl);
      video.addEventListener('pause', syncControl);
      function seek(delta) {
        if (!Number.isFinite(video.duration) || !video.duration) return;
        pauseForInteraction();
        video.currentTime = Math.min(video.duration - 0.01, Math.max(0, video.currentTime + delta));
      }
      video.addEventListener('wheel', (event) => { if (Number.isFinite(video.duration)) { event.preventDefault(); seek(event.deltaY * 0.012); } }, { passive: false });
      let lastTouch = null;
      video.addEventListener('touchstart', (event) => { const touch = event.touches[0]; lastTouch = touch ? { x: touch.clientX, y: touch.clientY } : null; }, { passive: true });
      video.addEventListener('touchmove', (event) => {
        if (!lastTouch || !event.touches.length) return;
        const touch = event.touches[0];
        const dx = touch.clientX - lastTouch.x;
        const dy = touch.clientY - lastTouch.y;
        if (Math.abs(dy) > Math.abs(dx)) { event.preventDefault(); seek(-dy * 0.04); }
        lastTouch = { x: touch.clientX, y: touch.clientY };
      }, { passive: false });
      video.addEventListener('touchend', () => { lastTouch = null; });
      video.addEventListener('keydown', (event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); seek(event.key === 'ArrowDown' ? 1 : -1); } });
    } else {
      ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach((type) => scroller.addEventListener(type, pauseForInteraction, { passive: true }));
    }
    syncControl();
    return state;
  });
  function updatePlayback(state) {
    if (state.visible && !state.userPaused && !document.hidden) state.start(); else state.stop();
  }
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
})();
