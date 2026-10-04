/* Original NOVAWORK SVG assembly, progressively enhanced.
 * Original path geometry, piece order and directional metadata are unchanged.
 * Never changes scrolling, focus, body styles, navigation or form state.
 */
(function () {
  'use strict';

  function init() {
    const stage = document.querySelector('[data-nw-logo-intro]');
    if (!stage || stage.dataset.nwIntroReady === 'true') return;
    stage.dataset.nwIntroReady = 'true';

    const pieces = Array.from(stage.querySelectorAll('.nw-intro-piece'));
    const control = stage.querySelector('[data-nw-intro-control]');
    const controlLabel = stage.querySelector('[data-nw-intro-label]');
    const controlMark = stage.querySelector('[data-nw-intro-mark]');
    const progress = stage.querySelector('.nw-intro-progress > span');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const duration = 2400;
    let animations = [];
    let timer = 0;
    let playing = false;
    let played = false;
    let visibilityObserver = null;
    let run = 0;

    function reducedMotion() {
      if (document.body.classList.contains('motion-paused')) return true;
      if (document.documentElement.classList.contains('motion-full')) return false;
      try {
        const value = window.localStorage.getItem('novawork.motion.preference');
        if (value === 'reduced') return true;
        if (value === 'full') return false;
      } catch (_) { /* The OS setting remains available. */ }
      return motionQuery.matches;
    }

    function syncControl() {
      if (!control) return;
      control.hidden = reducedMotion() || !pieces.length || typeof pieces[0].animate !== 'function';
      const text = playing ? '건너뛰기' : '다시 보기';
      if (controlLabel) controlLabel.textContent = text;
      if (controlMark) controlMark.textContent = playing ? '→' : '↻';
      control.setAttribute('aria-label', playing ? '로고 조립 애니메이션 건너뛰기' : '로고 조립 애니메이션 다시 보기');
    }

    function finish() {
      run += 1;
      window.clearTimeout(timer);
      timer = 0;
      playing = false;
      // Native animations own temporary styles. Cancelling always returns to
      // the complete, visible logo supplied by the unenhanced document.
      animations.forEach((animation) => {
        try { animation.cancel(); } catch (_) { /* A detached frame is harmless. */ }
      });
      animations = [];
      stage.classList.remove('is-assembling');
      stage.classList.add('is-assembled');
      syncControl();
    }

    function animate(element, keyframes, options) {
      const animation = element.animate(keyframes, options);
      animations.push(animation);
      return animation;
    }

    function play() {
      if (playing || document.hidden || reducedMotion() || !pieces.length || typeof pieces[0].animate !== 'function') {
        syncControl();
        return;
      }
      played = true;
      playing = true;
      const currentRun = ++run;
      stage.classList.remove('is-assembled');
      stage.classList.add('is-assembling');
      syncControl();
      try {
        pieces.forEach((piece) => {
          const number = (key, fallback) => {
            const value = Number.parseFloat(piece.dataset[key]);
            return Number.isFinite(value) ? value : fallback;
          };
          const start = Math.max(0, Math.min(1, number('start', 0)));
          const end = Math.max(start + .01, Math.min(1, number('end', 1)));
          const from = 'translate3d(' + number('x', 0) + 'px,' + number('y', 0) + 'px,0) rotate(' + number('r', 0) + 'deg) scale(' + number('s', 1) + ')';
          animate(piece, [
            { opacity: 0, transform: from },
            { opacity: 1, transform: 'translate3d(0,0,0) rotate(0deg) scale(1)' }
          ], {
            delay: start * duration,
            duration: (end - start) * duration,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'both'
          });
        });
        if (progress) animate(progress, [
          { transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }
        ], { duration: duration, easing: 'linear', fill: 'both' });
        // A bounded timer also clears animations if a finished promise is not
        // delivered by a browser. The logo never depends on fill-forwards.
        timer = window.setTimeout(() => {
          if (currentRun === run) finish();
        }, duration + 60);
      } catch (_) {
        finish();
      }
    }

    function startWhenVisible() {
      if (played || document.hidden) return;
      const box = stage.getBoundingClientRect();
      const visible = box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight;
      if (!visible) return;
      if (reducedMotion()) {
        syncControl();
        return;
      }
      play();
      if (played && visibilityObserver) visibilityObserver.disconnect();
    }

    if (control) control.addEventListener('click', () => playing ? finish() : play());

    function handlePreference() {
      if (reducedMotion() && playing) finish();
      syncControl();
      if (!played) startWhenVisible();
    }
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', handlePreference);
    else if (motionQuery.addListener) motionQuery.addListener(handlePreference);
    // The existing footer toggle changes these classes; observe only that
    // preference signal, without touching the menu's body state or attributes.
    if ('MutationObserver' in window) {
      const preferenceObserver = new MutationObserver(handlePreference);
      preferenceObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      preferenceObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    window.addEventListener('storage', (event) => {
      if (event.key === 'novawork.motion.preference') handlePreference();
    });

    if ('IntersectionObserver' in window) {
      try {
        visibilityObserver = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0)) startWhenVisible();
        }, { threshold: [0, .1, .25] });
        visibilityObserver.observe(stage);
      } catch (_) { visibilityObserver = null; }
    }
    if (!visibilityObserver) {
      // Old-browser fallback is passive and is removed after first playback.
      const check = () => {
        startWhenVisible();
        if (played) {
          window.removeEventListener('scroll', check);
          window.removeEventListener('resize', check);
        }
      };
      window.addEventListener('scroll', check, { passive: true });
      window.addEventListener('resize', check, { passive: true });
      check();
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && playing) finish();
      else if (!document.hidden) startWhenVisible();
    });
    // A restored page shows a complete logo, without restarting a background
    // animation or altering the browser's restored scroll position.
    window.addEventListener('pagehide', finish);
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) { played = true; finish(); }
    });
    syncControl();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
