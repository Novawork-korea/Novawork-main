/* Native-scroll production story. Complete, readable HTML is the fallback.
 * No wheel/touch interception, preference gate, dependency or network request. */
(function () {
  'use strict';
  function init() {
    const root = document.querySelector('[data-build-story]');
    if (!root || root.dataset.storyReady) return;
    const chapters = Array.from(root.querySelectorAll('[data-build-chapter]'));
    if (!chapters.length) return;
    const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
    const phase = (p, start, end) => clamp((p - start) / (end - start));
    const ease = (n) => 1 - Math.pow(1 - n, 3);
    const num = (el, key, fallback) => {
      const n = parseFloat(el.dataset[key]);
      return Number.isFinite(n) ? n : fallback;
    };
    const header = document.querySelector('.site-header');
    let frame = 0;
    let stopped = false;
    let headerHeight = 81;
    let resizePending = true;
    const states = chapters.map((chapter) => ({
      chapter,
      pin: chapter.querySelector('.build-sticky'),
      camera: chapter.querySelector('.build-camera'),
      meter: chapter.querySelector('.build-meter i'),
      phases: Array.from(chapter.querySelectorAll('[data-build-phase]')),
      signalDesktop: chapter.querySelector('.connection-path-desktop .connection-signal'),
      signalMobile: chapter.querySelector('.connection-path-mobile .connection-signal'),
      parts: Array.from(chapter.querySelectorAll('[data-build-part]')).map((el) => ({
        el, x: num(el, 'x', 0), y: num(el, 'y', 0), z: num(el, 'z', 200),
        r: num(el, 'r', 0), start: num(el, 'start', .1), end: num(el, 'end', .65)
      })),
      p: -1,
      active: false
    }));

    function reset() {
      stopped = true;
      window.cancelAnimationFrame(frame);
      root.classList.remove('story-ready');
      states.forEach(({ chapter, camera, parts, meter, phases, signalDesktop, signalMobile }) => {
        chapter.classList.remove('is-active', 'is-complete');
        chapter.style.removeProperty('--build-progress');
        chapter.style.removeProperty('--build-signal');
        chapter.style.removeProperty('--build-spread');
        if (camera) camera.style.removeProperty('transform');
        if (meter) meter.style.removeProperty('transform');
        phases.forEach((el) => el.classList.remove('is-current'));
        if (signalDesktop) signalDesktop.setAttribute('cx', '610');
        if (signalMobile) { signalMobile.setAttribute('cx', '215'); signalMobile.setAttribute('cy', '250'); }
        parts.forEach(({ el }) => {
          el.style.removeProperty('transform');
          el.style.removeProperty('opacity');
        });
      });
    }

    function render(state, p, active, mobile) {
      if (active !== state.active) {
        state.chapter.classList.toggle('is-active', active);
        state.active = active;
      }
      if (Math.abs(state.p - p) < .0001) return;
      state.p = p;
      const cameraProgress = ease(phase(p, .18, .74));
      const spread = 1 - cameraProgress;
      const distanceScale = mobile ? .48 : 1;
      if (state.camera) {
        state.camera.style.transform = 'rotateX(' + (spread * 13).toFixed(3) + 'deg) rotateY(' + (spread * -17).toFixed(3) + 'deg) rotateZ(' + (spread * -3).toFixed(3) + 'deg) scale(' + (1 - spread * .07).toFixed(4) + ')';
      }
      state.parts.forEach((part) => {
        const t = phase(p, part.start, part.end);
        const rest = 1 - ease(t);
        part.el.style.opacity = (.08 + .92 * phase(t, 0, .45)).toFixed(3);
        part.el.style.transform = 'translate3d(' + (part.x * rest * distanceScale).toFixed(2) + 'px,' + (part.y * rest * distanceScale).toFixed(2) + 'px,' + (part.z * rest * distanceScale).toFixed(2) + 'px) rotateZ(' + (part.r * rest).toFixed(2) + 'deg)';
      });
      const signal = phase(p, .7, .86);
      if (state.signalDesktop) state.signalDesktop.setAttribute('cx', (390 + 220 * signal).toFixed(2));
      if (state.signalMobile) {
        const travel = signal * 200;
        const x = travel < 60 ? 130 : travel < 145 ? 130 + travel - 60 : 215;
        const y = travel < 60 ? 135 + travel : travel < 145 ? 195 : 195 + travel - 145;
        state.signalMobile.setAttribute('cx', x.toFixed(2));
        state.signalMobile.setAttribute('cy', y.toFixed(2));
      }
      state.chapter.style.setProperty('--build-progress', p.toFixed(4));
      state.chapter.style.setProperty('--build-signal', signal.toFixed(4));
      state.chapter.style.setProperty('--build-spread', spread.toFixed(4));
      state.chapter.classList.toggle('is-complete', p >= .7);
      if (state.meter) state.meter.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      const currentPhase = p < .22 ? 0 : p < .7 ? 1 : 2;
      state.phases.forEach((el, index) => el.classList.toggle('is-current', currentPhase === index));
    }

    function update() {
      frame = 0;
      if (stopped) return;
      try {
        // Read geometry together; render only after the layout reads finish.
        if (resizePending) {
          headerHeight = header ? header.getBoundingClientRect().height : 0;
          root.style.setProperty('--story-header', headerHeight + 'px');
          resizePending = false;
        }
        const viewportHeight = window.innerHeight;
        const mobile = window.innerWidth <= 760;
        const geometry = states.map((state) => {
          const box = state.chapter.getBoundingClientRect();
          const pinHeight = state.pin.getBoundingClientRect().height;
          const distance = box.height - pinHeight;
          // Short landscape layouts use an ordinary document section. They
          // still assemble as it enters, without pinning a too-tall screen.
          const p = distance > 1 ? clamp((headerHeight - box.top) / distance)
            : clamp((viewportHeight - box.top) / (viewportHeight + box.height * .35));
          return { p, active: !document.hidden && box.bottom > headerHeight && box.top < viewportHeight };
        });
        geometry.forEach((g, index) => render(states[index], g.p, g.active, mobile));
      } catch (_) { reset(); }
    }
    function schedule() {
      if (!frame && !stopped) frame = window.requestAnimationFrame(update);
    }
    function resize() {
      resizePending = true;
      states.forEach((state) => { state.p = -1; });
      schedule();
    }
    try {
      root.classList.add('story-ready');
      root.dataset.storyReady = 'true';
      update();
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', resize, { passive: true });
      window.addEventListener('pageshow', resize);
      document.addEventListener('visibilitychange', schedule);
      window.addEventListener('pagehide', () => {
        window.cancelAnimationFrame(frame); frame = 0;
        states.forEach((state) => {
          state.chapter.classList.remove('is-active'); state.active = false;
        });
      });
      if (typeof ResizeObserver === 'function' && header) new ResizeObserver(resize).observe(header);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize).catch(() => {});
    } catch (_) { reset(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
