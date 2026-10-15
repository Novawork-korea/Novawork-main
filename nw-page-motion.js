/* Page-specific motion over native document flow. No scroll interception,
 * preference gate, live data, or required animation before navigation. */
(function () {
  'use strict';
  function init() {
    const main = document.querySelector('.sp-main');
    if (!main || main.dataset.motionReady === 'true') return;
    main.dataset.motionReady = 'true';
    const header = document.querySelector('.site-header');
    const process = main.querySelector('.sp-process');
    const steps = Array.from(main.querySelectorAll('.sp-step'));
    const panels = Array.from(main.querySelectorAll('[data-process-panel]'));
    const principles = Array.from(main.querySelectorAll('[data-principle]'));
    const surface = main.querySelector('.sp-principles');
    const clamp = (n) => Math.max(0, Math.min(1, n));
    let frame = 0;
    let currentStep = -1;
    const cases = Array.from(main.querySelectorAll('[data-case-motion]')).map((element) => ({
      element, results: Array.from(element.querySelectorAll('[data-case-result]')),
      state: 'waiting', animations: []
    }));
    function finish(item) {
      item.state = 'complete';
      item.element.dataset.motionState = 'complete';
      item.animations.forEach((animation) => { try { animation.finish(); } catch (_) {} });
      item.results.forEach((result) => { result.style.opacity = '1'; result.style.transform = 'none'; });
    }
    function animate(item, element, frames, duration, delay) {
      if (!element || !element.animate) return;
      item.animations.push(element.animate(frames, { duration, delay, fill: 'both', easing: 'cubic-bezier(.22,.68,.2,1)' }));
    }
    function play(item) {
      item.state = 'playing';
      item.element.dataset.motionState = 'playing';
      const el = item.element;
      try {
        const inputs = Array.from(el.querySelectorAll('.sp-extension dd, .sp-admin dl>div, .sp-channels>span'));
        inputs.forEach((input, i) => animate(item, input, [
          { backgroundColor: '#f4f5f600' }, { backgroundColor: '#f1d7c9', offset: .35 }, { backgroundColor: '#f4f5f600' }
        ], 1250, i * 140));
        animate(item, el.querySelector('.sp-flow-arrow, .sp-route-line'), [
          { opacity: .15, scale: '.7' }, { opacity: 1, scale: '1.25', offset: .55 }, { opacity: 1, scale: '1' }
        ], 1100, 400);
        animate(item, el.querySelector('.sp-drawing-shape'), [
          { borderColor: '#626973', backgroundColor: 'transparent' },
          { borderColor: '#D5673A', backgroundColor: '#d5673a28', offset: .55 },
          { borderColor: '#626973', backgroundColor: 'transparent' }
        ], 1500, 0);
        item.results.forEach((result, i) => animate(item, result, [
          { opacity: 0, transform: 'translateY(28px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], 700, 950 + i * 260));
        animate(item, el.querySelector('.sp-window-bar'), [
          { borderBottomColor: '#D9DDE2' }, { borderBottomColor: '#D5673A', offset: .55 }, { borderBottomColor: '#D9DDE2' }
        ], 2650, 0);
        if (!item.animations.length) finish(item);
        else Promise.all(item.animations.map((a) => a.finished.catch(() => null))).then(() => finish(item));
      } catch (_) { finish(item); }
    }
    function render() {
      frame = 0;
      const height = window.innerHeight;
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const readingLine = headerHeight + (height - headerHeight) * .36;
      if (!document.hidden) {
        cases.forEach((item) => {
          const rect = item.element.getBoundingClientRect();
          const visible = Math.min(rect.bottom, height) - Math.max(rect.top, headerHeight);
          if (rect.bottom <= headerHeight) { if (item.state !== 'complete') finish(item); return; }
          if (item.state === 'waiting' && visible >= Math.min(rect.height * .22, (height - headerHeight) * .32)) play(item);
          if (item.state === 'playing') item.animations.forEach((animation) => {
            if (visible <= 0 && animation.playState === 'running') animation.pause();
            else if (visible > 0 && animation.playState === 'paused') animation.play();
          });
        });
      } else cases.forEach((item) => item.animations.forEach((a) => { if (a.playState === 'running') a.pause(); }));
      if (steps.length) {
        let next = 0;
        steps.forEach((step, i) => { if (step.getBoundingClientRect().top <= readingLine) next = i; });
        if (next !== currentStep) {
          currentStep = next;
          process.dataset.currentStep = String(next + 1);
          steps.forEach((step, i) => step.classList.toggle('is-active', i === next));
          panels.forEach((panel, i) => panel.classList.toggle('is-current', i === next));
        }
        const first = steps[0].getBoundingClientRect().top;
        const last = steps[steps.length - 1].getBoundingClientRect().bottom;
        process.style.setProperty('--process-progress', String(clamp((readingLine - first) / Math.max(1, last - first))));
      }
      principles.forEach((principle) => {
        const rect = principle.getBoundingClientRect();
        const p = clamp((height * .85 - rect.top) / Math.max(160, height * .55));
        principle.style.setProperty('--principle-progress', String(p));
        principle.classList.toggle('is-active', rect.top < height * .65 && rect.bottom > headerHeight);
      });
      if (surface) {
        const rect = surface.getBoundingClientRect();
        surface.style.setProperty('--surface-progress', String(clamp((height - rect.top) / (height + rect.height))));
      }
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(render); }
    // A failed enhancement leaves the complete HTML illustration readable.
    if (Element.prototype.animate) cases.forEach((item) => item.results.forEach((result) => {
      result.style.opacity = '0'; result.style.transform = 'translateY(28px)';
    }));
    else cases.forEach(finish);
    main.classList.add('sp-motion-ready');
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    window.addEventListener('load', schedule, { once: true });
    document.addEventListener('visibilitychange', schedule);
    document.addEventListener('focusin', (event) => {
      cases.forEach((item) => { if (item.element.contains(event.target)) finish(item); });
    });
    if (document.fonts) document.fonts.ready.then(schedule);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
