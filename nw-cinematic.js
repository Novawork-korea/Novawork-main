/* Large, local illustrative motion. Native scrolling remains the only page input. */
(function () {
  'use strict';
  function init() {
    const main = document.querySelector('.sp-main');
    if (!main || main.dataset.cinematicReady) return;
    const clamp = (v) => Math.max(0, Math.min(1, v));
    const ease = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
    const range = (p, a, b) => ease((p - a) / (b - a));
    const header = document.querySelector('.site-header');
    const hero = main.querySelector('.cm-brand-intro');
    const story = main.querySelector('.cm-story');
    const chapters = Array.from(main.querySelectorAll('[data-chapter]'));
    const camera = main.querySelector('.cm-camera');
    const cases = Array.from(main.querySelectorAll('[data-case-motion]')).map(el => ({
      el, stage: el.querySelector('.cm-viewport'), input: el.querySelector('.cm-input'),
      output: el.querySelector('.cm-output'), token: el.querySelector('.cm-transfer'),
      trace: el.querySelector('.cm-trace'), results: Array.from(el.querySelectorAll('[data-case-result]')),
      elapsed: 0, state: 'waiting', last: 0
    }));
    let frame = 0, copyOffset = 0;
    function finish(item) { item.elapsed = 4400; item.state = 'complete'; item.last = 0; }
    function caseFrame(item, p, mobile) {
      const move = range(p, .20, .60), arrive = range(p, .25, .62);
      item.input.style.transform = mobile
        ? `translateY(${(1 - move) * 85}px) scale(${1 - move * .18})`
        : `translate(${(1 - move) * 56}%, -50%) scale(${1 - move * .22})`;
      item.output.style.transform = mobile
        ? `translateY(${(1 - arrive) * 260}px)`
        : `translate(${(1 - arrive) * 112}%, -50%) rotateY(${(1 - arrive) * -12}deg)`;
      item.output.style.opacity = String(range(p, .25, .37));
      const travel = range(p, .32, .67);
      item.token.style.transform = mobile ? `translateY(${travel * 110}px)` : `translateX(${travel * item.stage.clientWidth * .24}px)`;
      item.token.style.opacity = String(range(p, .29, .39) * (1 - range(p, .62, .73)));
      item.results.forEach((el, i) => {
        const reveal = range(p, .51 + i * .075, .72 + i * .075);
        el.style.clipPath = `inset(0 ${(1 - reveal) * 100}% 0 0)`;
      });
      const drawing = item.el.querySelector('.cm-part');
      if (drawing) drawing.style.transform = `rotate(${-12 + range(p, 0, .4) * 12}deg) scale(${1 + Math.sin(range(p, 0, .65) * Math.PI) * .3})`;
      item.trace.style.transform = `scaleX(${p})`;
      item.el.dataset.motionState = item.state;
      item.el.dataset.motionProgress = p.toFixed(4);
    }
    function studioFrame(el, p, inline) {
      if (!el) return;
      const screen = el.querySelector('.cm-studio-screen'), guide = el.querySelector('.cm-studio-guide');
      const front = range(p, 0, .75), focus = range(p, .85, 1.45), leave = range(p, 1.6, 2.4);
      const scale = .84 + front * .16 + focus * .1 - leave * .32;
      screen.style.transform = `translate(${leave * -10}%,${(1-front)*45}px) rotateY(${(1-front)*-18}deg) rotateX(${(1-front)*10}deg) scale(${scale})`;
      screen.style.transformOrigin = leave > .01 ? 'left center' : 'center';
      const focusBand = el.querySelector('.cm-screen-focus');
      focusBand.style.transform = `translateY(${focus * 150}%)`;
      guide.style.transform = `translate(${(1-leave)*18}%,${(1-leave)*95}px)`;
      guide.style.opacity = String(leave);
      if (inline) el.dataset.viewProgress = p.toFixed(4);
    }
    function render(now) {
      frame = 0;
      if (document.hidden) { cases.forEach(i => { i.last = 0; }); return; }
      const h = innerHeight, hh = header ? header.getBoundingClientRect().height : 0;
      const mobile = innerWidth <= 640;
      let running = false;
      cases.forEach(item => {
        const rect = item.stage.getBoundingClientRect();
        const visible = Math.min(h, rect.bottom) - Math.max(hh, rect.top);
        if (rect.bottom <= hh) finish(item);
        if (item.state === 'waiting' && visible >= Math.min(rect.height * .35, (h-hh) * .5)) item.state = 'playing';
        if (item.state === 'playing' && visible > 0) {
          if (item.last) item.elapsed += Math.min(250, now - item.last);
          item.last = now;
          if (item.elapsed >= 4400) finish(item); else running = true;
        } else item.last = 0;
        caseFrame(item, clamp(item.elapsed / 4400), mobile);
      });
      if (hero) {
        const r = hero.getBoundingClientRect(), logo = hero.querySelector('.sp-brand-logo');
        const p = clamp((hh-r.top) / Math.max(1,r.height*.65));
        logo.style.transform = `translateY(${-p*50}px) scale(${1-p*.16})`;
        const copy = hero.querySelector(':scope > div');
        const c = clamp((h-copy.getBoundingClientRect().top+copyOffset)/(h*.6));
        copyOffset = (1-c)*55;
        copy.style.transform = `translateY(${copyOffset}px)`;
      }
      if (story) {
        story.style.setProperty('--cm-header', `${hh}px`);
        const sr = story.getBoundingClientRect();
        story.style.setProperty('--cm-curtain', String(range((h-sr.top)/h,0,1)));
        const line = hh+(h-hh)*.48;
        let phase = 0;
        chapters.forEach((el,i) => {
          const rect = el.getBoundingClientRect();
          const p = clamp((line-rect.top)/Math.max(1,rect.height));
          if (rect.top <= line) phase = i+p;
          el.classList.toggle('is-active', rect.top < h*.72 && rect.bottom > hh);
          const local = range((h-rect.top)/Math.max(h,rect.height),0,1);
          studioFrame(el.querySelector('.cm-inline-visual'), i + local*(i === 1 ? .48 : .8), true);
        });
        studioFrame(camera, phase, false);
        story.dataset.storyPhase = String(Math.min(3,Math.floor(phase)+1));
        story.dataset.storyProgress = phase.toFixed(4);
      }
      if (running) frame = requestAnimationFrame(render);
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(render); }
    main.classList.add('sp-motion-ready','cm-enabled');
    main.dataset.cinematicReady = 'true';
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('pageshow',schedule);
    window.addEventListener('load',schedule,{once:true});
    document.addEventListener('visibilitychange',()=>{cases.forEach(i=>{i.last=0;});schedule();});
    document.addEventListener('focusin',event=>{ cases.forEach(i=>{if(i.el.contains(event.target))finish(i);}); schedule(); });
    if (document.fonts) document.fonts.ready.then(schedule);
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
