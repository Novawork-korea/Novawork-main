/* Visible, native-scroll previews. The completed HTML is the no-script state.
 * Each scene starts on its first entry, then pauses offscreen or while hidden.
 * OS motion preferences do not disable the owner's authored sequence.
 */
(function () {
  'use strict';

  function init() {
    const elements = Array.from(document.querySelectorAll('[data-home-scene]'));
    if (!elements.length || document.body.dataset.homeMotionReady === 'true') return;
    document.body.dataset.homeMotionReady = 'true';
    const duration = 7800;
    let frame = 0;
    let pageActive = true;
    const scenes = elements.map((element) => ({ element, animations: [], started: false, failed: false, playing: false }));
    const number = (element, key, fallback) => {
      const parsed = Number.parseFloat(element.dataset[key]);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    function addAnimation(scene, element, keyframes) {
      const animation = element.animate(keyframes, { duration, iterations: Infinity, easing: 'linear', fill: 'both' });
      animation.pause();
      animation.currentTime = 0;
      scene.animations.push(animation);
    }

    function build(scene) {
      scene.started = true;
      if (typeof scene.element.animate !== 'function') {
        scene.failed = true;
        scene.element.dataset.motionState = 'static';
        return;
      }
      try {
        const parts = Array.from(scene.element.querySelectorAll('[data-home-part]'));
        const compact = window.innerWidth <= 760;
        const travelScale = compact ? .67 : 1;
        // Read each resting transform before creating animations. Decorative
        // website planes retain their authored angles in the assembled state.
        const rest = parts.map((element) => {
          const transform = window.getComputedStyle(element).transform;
          return transform === 'none' ? '' : transform;
        });
        parts.forEach((element, index) => {
          const order = Math.max(0, Math.min(7, number(element, 'order', 0)));
          const start = .015 + order * .021;
          const arrive = .23 + order * .026;
          const from = 'translate3d(' + number(element, 'x', 0) * travelScale + 'px,' + number(element, 'y', 0) * travelScale + 'px,' + number(element, 'z', 0) * travelScale + 'px) rotateX(' + number(element, 'rx', 0) + 'deg) rotateY(' + number(element, 'ry', 0) + 'deg) scale(.9) ' + rest[index];
          const to = rest[index] || 'translate3d(0,0,0)';
          addAnimation(scene, element, [
            { opacity: 0, transform: from, offset: 0 },
            { opacity: 0, transform: from, offset: start, easing: 'cubic-bezier(.2,.75,.25,1)' },
            { opacity: 1, transform: to, offset: arrive },
            { opacity: 1, transform: to, offset: .88, easing: 'ease-in' },
            { opacity: 0, transform: to, offset: .965 },
            { opacity: 0, transform: from, offset: 1 }
          ]);
        });
        scene.element.querySelectorAll('[data-home-bar]').forEach((element, index) => {
          addAnimation(scene, element, [
            { transform: 'scaleY(.1)', offset: 0 },
            { transform: 'scaleY(.1)', offset: .3 + index * .015, easing: 'cubic-bezier(.2,.75,.25,1)' },
            { transform: 'scaleY(1)', offset: .47 + index * .015 },
            { transform: 'scaleY(1)', offset: .6 },
            { transform: 'scaleY(.7)', offset: .7 },
            { transform: 'scaleY(1)', offset: .8 },
            { transform: 'scaleY(1)', offset: 1 }
          ]);
        });
        scene.element.querySelectorAll('[data-home-progress]').forEach((element) => {
          addAnimation(scene, element, [
            { transform: 'scaleX(0)', offset: 0 },
            { transform: 'scaleX(0)', offset: .3, easing: 'ease-in-out' },
            { transform: 'scaleX(.5)', offset: .43, easing: 'ease-in-out' },
            { transform: 'scaleX(1)', offset: .56 },
            { transform: 'scaleX(1)', offset: 1 }
          ]);
        });
      } catch (_) {
        scene.animations.forEach((animation) => { try { animation.cancel(); } catch (_) {} });
        scene.animations = [];
        scene.failed = true;
        scene.element.dataset.motionState = 'static';
      }
    }

    function update() {
      frame = 0;
      const height = window.innerHeight || document.documentElement.clientHeight;
      // Read all bounds together before changing animation states.
      const visible = scenes.map((scene) => {
        const rect = scene.element.getBoundingClientRect();
        const amount = Math.min(rect.bottom, height) - Math.max(rect.top, 0);
        return amount > Math.min(rect.height * .12, height * .12);
      });
      scenes.forEach((scene, index) => {
        const shouldPlay = pageActive && !document.hidden && visible[index];
        if (shouldPlay && !scene.started) build(scene);
        if (scene.failed || !scene.started || scene.playing === shouldPlay) return;
        scene.playing = shouldPlay;
        scene.animations.forEach((animation) => { if (shouldPlay) animation.play(); else animation.pause(); });
        scene.element.dataset.motionState = shouldPlay ? 'playing' : 'paused';
      });
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    document.addEventListener('visibilitychange', update);
    window.addEventListener('pagehide', () => { pageActive = false; update(); });
    window.addEventListener('pageshow', () => { pageActive = true; schedule(); });
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
