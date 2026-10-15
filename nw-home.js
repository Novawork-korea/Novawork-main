/* One page-sized sequence driven only by native scroll position.
 * No animation clock, replay, preference gate or wheel/touch interception.
 * Progress is calculated from current geometry, including restored scroll.
 */
(function () {
  'use strict';
  function init() {
    const sequence = document.querySelector('[data-nw-sequence]');
    if (!sequence || sequence.dataset.sequenceReady === 'true') return;
    sequence.dataset.sequenceReady = 'true';
    const pin = sequence.querySelector('.nw-sequence-pin');
    const header = document.querySelector('.site-header');
    const heading = sequence.querySelector('.nw-sequence-heading');
    const website = sequence.querySelector('.nw-site-composition');
    const program = sequence.querySelector('.nw-program-composition');
    const receipt = sequence.querySelector('.nw-program-receipt');
    const connections = Array.from(sequence.querySelectorAll('.nw-connection'));
    const draws = Array.from(sequence.querySelectorAll('.nw-connection-draw'));
    const meter = sequence.querySelector('.nw-sequence-meter i');
    const label = sequence.querySelector('[data-sequence-label]');
    const cue = sequence.querySelector('.nw-sequence-cue');
    const grid = sequence.querySelector('.nw-sequence-grid');
    const parts = Array.from(sequence.querySelectorAll('[data-sequence-part]'));
    let frame = 0;
    let needsMeasure = true;
    let mobile = false;
    let short = false;
    let vh = 0;
    let vw = 0;
    let headerHeight = 0;
    const clamp = (n) => Math.min(1, Math.max(0, n));
    const range = (p, start, end) => clamp((p - start) / (end - start));
    const ease = (t) => t * t * (3 - 2 * t);
    const progress = (p, start, end) => ease(range(p, start, end));
    const set = (element, opacity, transform) => {
      element.style.opacity = String(opacity);
      if (transform !== undefined) element.style.transform = transform;
    };
    const poses = {
      guide: [0, .17, 0, 12, -200, 35, 0],
      nav: [0, .18, 0, -18, 140, -20, 0],
      type: [.025, .28, -18, 10, 200, 0, 18],
      art: [.20, .37, 65, -12, 350, -18, -38],
      action: [.24, .39, -25, 60, 180, 45, 0],
      baseline: [.26, .41, 30, 65, -100, 0, 12],
      'program-title': [.46, .60, 50, -25, 220, -12, -28],
      'row-one': [.49, .63, 55, 15, 300, 10, -22],
      'row-two': [.52, .67, 65, 25, 350, 15, -30],
      'row-three': [.56, .71, 75, 40, 400, 20, -38]
    };
    function measure() {
      vh = Math.max(1, window.innerHeight);
      vw = Math.max(1, document.documentElement.clientWidth);
      headerHeight = header ? Math.round(header.getBoundingClientRect().height) : 0;
      mobile = vw <= 760;
      short = vh - headerHeight < (mobile ? 530 : 470);
      sequence.style.setProperty('--nw-header', headerHeight + 'px');
      sequence.style.setProperty('--nw-vh', vh + 'px');
      sequence.classList.toggle('is-short', short);
      needsMeasure = false;
    }
    function render() {
      frame = 0;
      if (needsMeasure) measure();
      const rect = sequence.getBoundingClientRect();
      const distance = Math.max(1, rect.height - pin.getBoundingClientRect().height);
      // Begin while the stage enters. Pinning never introduces a blank hold.
      const entrance = Math.min(vh * .34, 300);
      const p = short ? 1 : clamp((headerHeight + entrance - rect.top) / (distance + entrance));
      sequence.dataset.progress = p.toFixed(4);
      sequence.dataset.layout = short ? 'flow' : mobile ? 'portrait' : 'wide';
      const pullback = progress(p, .42, .61);
      const join = progress(p, .72, .87);
      set(heading, progress(p, .48, .64), 'translate3d(0,' + (1 - progress(p, .48, .64)) * 45 + 'px,0)');
      const scale = 1 - pullback * (mobile ? .18 : .49);
      const x = mobile ? 0 : -24 * pullback;
      const y = mobile ? 3 * pullback : 7 * pullback;
      website.style.transform = 'translate3d(' + x + 'vw,' + y + 'vh,0) rotateY(' + (mobile ? 0 : Math.sin(pullback * Math.PI) * -15) + 'deg) scale(' + scale + ')';
      set(program, progress(p, .45, .56));
      website.querySelector('.nw-site-type p').style.opacity = String(mobile ? 1 - pullback : 1);
      parts.forEach((part) => {
        const key = part.dataset.sequencePart;
        const pose = poses[key];
        const assembled = progress(p, pose[0], pose[1]);
        const remaining = 1 - assembled;
        let opacity = key === 'guide' ? range(p, 0, .06) * (1 - progress(p, .29, .40)) * .8 : range(p, pose[0], pose[0] + .045);
        // Portrait composition keeps a large website headline above the workflow.
        // Peripheral art and controls leave the stage as the camera reveals the work.
        if (mobile && ['art', 'action', 'baseline'].includes(key)) opacity *= 1 - pullback;
        const movementScale = mobile ? .72 : 1;
        set(part, opacity, 'translate3d(' + pose[2] * remaining * movementScale + 'vw,' + pose[3] * remaining * movementScale + 'vh,' + pose[4] * remaining + 'px) rotateX(' + pose[5] * remaining + 'deg) rotateY(' + pose[6] * remaining + 'deg)');
      });
      connections.forEach((connection) => set(connection, progress(p, .69, .74)));
      draws.forEach((draw) => { draw.style.strokeDashoffset = String(1 - join); });
      set(receipt, progress(p, .85, .91), 'translateY(' + ((1 - progress(p, .85, .91)) * 10) + 'px)');
      grid.style.opacity = String(.6 - progress(p, .25, .7) * .45);
      grid.style.transform = 'perspective(1000px) rotateX(' + (25 - progress(p, .05, .38) * 25) + 'deg) scale(' + (1.2 - progress(p, .05, .38) * .2) + ')';
      meter.style.transform = 'scaleX(' + p + ')';
      const phase = p < .16 ? '01 — STRUCTURE' : p < .46 ? '02 — WEBSITE' : p < .73 ? '03 — WORKFLOW' : '04 — CONNECTED';
      if (label.textContent !== phase) label.textContent = phase;
      const nextCue = p >= .91 ? 'MADE TO WORK TOGETHER' : 'SCROLL TO CONNECT ↓';
      if (cue.textContent !== nextCue) cue.textContent = nextCue;
    }
    function schedule() { if (!frame) frame = window.requestAnimationFrame(render); }
    function resize() { needsMeasure = true; schedule(); }
    sequence.classList.add('is-enhanced');
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pageshow', resize);
    window.addEventListener('load', resize, { once: true });
    document.addEventListener('visibilitychange', schedule);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize, { passive: true });
    if ('ResizeObserver' in window && header) new ResizeObserver(resize).observe(header);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
