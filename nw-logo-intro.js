/* Original NOVAWORK SVG assembly: one automatic sequence per page visit.
 * All 17 paths, their direction metadata and assembly order are preserved.
 * No visibility, viewport, device, preference, navigation or scroll gating.
 */
(function () {
  'use strict';

  function init() {
    const stage = document.querySelector('[data-nw-logo-intro]');
    if (!stage || stage.dataset.nwIntroReady === 'true') return;
    stage.dataset.nwIntroReady = 'true';
    const pieces = Array.from(stage.querySelectorAll('.nw-intro-piece'));
    const duration = 2400;
    let animations = [];
    let timer = 0;

    const states = pieces.map((piece) => {
      const number = (key, fallback) => {
        const value = Number.parseFloat(piece.dataset[key]);
        return Number.isFinite(value) ? value : fallback;
      };
      const start = Math.max(0, Math.min(1, number('start', 0)));
      const end = Math.max(start + .01, Math.min(1, number('end', 1)));
      return {
        element: piece,
        from: 'translate3d(' + number('x', 0) + 'px,' + number('y', 0) + 'px,0) rotate(' + number('r', 0) + 'deg) scale(' + number('s', 1) + ')',
        delay: start * duration,
        duration: (end - start) * duration
      };
    });

    function clearAnimations() {
      animations.forEach((animation) => {
        try { animation.cancel(); } catch (_) { /* Detached frames are harmless. */ }
      });
      animations = [];
      pieces.forEach((piece) => {
        piece.style.removeProperty('animation');
        piece.style.removeProperty('animation-play-state');
        piece.style.removeProperty('--nw-intro-from');
      });
    }

    function finish() {
      window.clearTimeout(timer);
      timer = 0;
      clearAnimations();
      stage.classList.remove('is-assembling');
      stage.classList.add('is-assembled');
    }

    function cssFallback() {
      clearAnimations();
      states.forEach((state) => {
        state.element.style.setProperty('--nw-intro-from', state.from);
        // The inline finite sequence remains active even when an unrelated
        // global stylesheet applies animation preferences to every element.
        state.element.style.setProperty('animation', 'nw-intro-piece-in ' + state.duration + 'ms cubic-bezier(0.16, 1, 0.3, 1) ' + state.delay + 'ms 1 normal both running', 'important');
        state.element.style.setProperty('animation-play-state', 'running', 'important');
      });
    }

    function play() {
      finish();
      stage.classList.remove('is-assembled');
      stage.classList.add('is-assembling');
      try {
        if (pieces.length && typeof pieces[0].animate === 'function') {
          try {
            states.forEach((state) => {
              animations.push(state.element.animate([
                { opacity: 0, transform: state.from },
                { opacity: 1, transform: 'translate3d(0,0,0) rotate(0deg) scale(1)' }
              ], {
                delay: state.delay,
                duration: state.duration,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                fill: 'both'
              }));
            });
          } catch (_) { cssFallback(); }
        } else {
          cssFallback();
        }
        timer = window.setTimeout(finish, duration + 60);
      } catch (_) {
        // Unsupported animation engines retain the complete, visible logo.
        finish();
      }
    }

    // Initial page display begins immediately after the document is ready.
    play();
    window.addEventListener('pagehide', finish);
    window.addEventListener('pageshow', (event) => {
      // Initial pageshow must not start the sequence twice. A browser-history
      // restoration is a fresh visit and receives one new assembly sequence.
      if (event.persisted) play();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
