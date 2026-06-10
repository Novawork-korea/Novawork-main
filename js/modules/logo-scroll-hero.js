(function () {
  "use strict";

  var ready = false;

  window.initLogoScrollHero = function initLogoScrollHero() {
    if (ready) return;

    var section = document.querySelector(".nw-logo-scroll");
    var pieces = Array.prototype.slice.call(document.querySelectorAll(".nw-logo-piece"));
    if (!section || !pieces.length) return;

    ready = true;
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";

    var docEl = document.documentElement;
    var body = document.body;
    var header = document.querySelector(".header");
    var stage = document.querySelector(".nw-sticky-stage");
    var stageCopy = document.querySelector(".nw-stage-copy");
    var brandCopy = document.querySelector(".nw-brand-copy");
    var heroActions = document.querySelector(".nw-hero-actions");
    var logoLockup = document.querySelector(".nw-logo-lockup");
    var logoSvg = logoLockup ? logoLockup.querySelector(".nw-logo-svg") : document.querySelector(".nw-logo-svg");
    var aura = document.querySelector(".nw-logo-aura");
    var scrollHint = document.querySelector(".nw-scroll-hint");
    var heroProgress = document.querySelector(".nw-hero-progress");
    var progressFill = heroProgress ? heroProgress.querySelector(".nw-hero-progress__track b") : null;
    var progressValue = heroProgress ? heroProgress.querySelector(".nw-hero-progress__value") : null;
    var actionLinks = heroActions ? Array.prototype.slice.call(heroActions.querySelectorAll("a")) : [];
    var nextSection = section.nextElementSibling;

    var COMPLETE_AT = 0.88;
    var SMOOTH = 0.082;
    var INTRO_DURATION = 3200;
    var INTRO_DELAY = 140;
    var EPS = 0.001;

    var metrics = { width: 1, height: 1, headerOffset: 0, stageHeight: 1, sectionTop: 0, sectionHeight: 1, maxScroll: 1, nextTop: 0, svgScale: 1, lowPower: false };
    var currentAssembly = 0;
    var targetAssembly = 0;
    var currentUiOut = 0;
    var targetUiOut = 0;
    var lastAssembly = -1;
    var lastUiOut = -1;
    var frameId = 0;
    var resizeId = 0;
    var lastFrame = 0;
    var introPlaying = false;
    var introDone = false;
    var introFrame = 0;
    var introStart = 0;
    var introFinishTimer = 0;
    var introAnimations = [];
    var progressFrame = 0;
    var heroPeekTimer = 0;
    var autoPeekCancelled = false;
    var actionsActive = false;
    var actionsArmed = false;
    var fitSignature = "";

    docEl.dataset.nwHeroEngine = "EnhanceV5";

    var clamp = function (value, min, max) {
      var lo = typeof min === "number" ? min : 0;
      var hi = typeof max === "number" ? max : 1;
      return Math.min(hi, Math.max(lo, value));
    };
    var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
    var easeInOutCubic = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var smoothstep = function (t) { return t * t * (3 - 2 * t); };
    var scrollTop = function () { return window.pageYOffset || docEl.scrollTop || body.scrollTop || 0; };
    var setStyle = function (el, prop, value) { if (el && el.style[prop] !== value) el.style[prop] = value; };
    var setVar = function (el, prop, value) { if (el) el.style.setProperty(prop, value); };
    var setHeroProgress = function (value) {
      if (!heroProgress) return;
      var progress = clamp(value);
      var percent = Math.round(progress * 100);
      if (progressFill) progressFill.style.transform = "scaleX(" + progress.toFixed(4) + ")";
      if (progressValue && progressValue.textContent !== percent + "%") progressValue.textContent = percent + "%";
      heroProgress.setAttribute("aria-valuenow", String(percent));
      heroProgress.classList.toggle("is-complete", percent >= 100);
    };

    var getViewport = function () {
      // Use the layout viewport, not visualViewport. Mobile browser UI can change
      // visualViewport height during the intro scroll jump and cause a visible logo snap.
      return { width: window.innerWidth || (window.visualViewport && window.visualViewport.width) || 1, height: window.innerHeight || (window.visualViewport && window.visualViewport.height) || 1 };
    };

    var translateYOf = function (el) {
      if (!el) return 0;
      var transform = window.getComputedStyle(el).transform;
      if (!transform || transform === "none") return 0;
      var match = transform.match(/matrix(3d)?\((.+)\)/);
      if (!match) return 0;
      var values = match[2].split(",").map(parseFloat);
      return match[1] === "3d" ? values[13] || 0 : values[5] || 0;
    };

    var updateBalance = function () {
      if (!logoLockup || !heroActions || !stage || !logoSvg) return;
      setVar(logoLockup, "--nw-balance-y", "0px");
      var stageRect = stage.getBoundingClientRect();
      var logoRect = logoSvg.getBoundingClientRect();
      var actionsRect = heroActions.getBoundingClientRect();
      var logoTopLineY = logoRect.top + logoRect.height * (21 / 610);
      var buttonBottomY = actionsRect.bottom - translateYOf(heroActions);
      var balance = ((stageRect.bottom - buttonBottomY) - (logoTopLineY - stageRect.top)) / 2;
      var maxShift = Math.max(18, stageRect.height * 0.16);
      setVar(logoLockup, "--nw-balance-y", clamp(balance, -maxShift, maxShift).toFixed(2) + "px");
    };

    var updateResponsiveFit = function (force) {
      if (!logoLockup) return;
      var stageWidth = Math.max(1, metrics.width);
      var stageHeight = Math.max(1, metrics.stageHeight);
      var viewportHeight = Math.max(1, metrics.height);
      var aspect = 730 / 610;
      var fitByWidth, fitByHeight, maxWidth, minWidth, targetWidth;

      if (stageHeight <= 420) {
        fitByWidth = Math.max(190, Math.min(stageWidth - 32, stageWidth * 0.52));
        fitByHeight = Math.max(180, (stageHeight - 26 - 72) * aspect);
        maxWidth = 320; minWidth = 190;
      } else if (stageWidth > 780) {
        var reserve = stageHeight <= 640 ? 96 : stageHeight <= 760 ? 118 : 132;
        fitByWidth = stageWidth * 0.345;
        fitByHeight = viewportHeight * 0.72;
        maxWidth = 820; minWidth = stageWidth >= 1180 ? 420 : 360;
        fitByHeight = Math.min(fitByHeight, Math.max(260, (stageHeight - reserve) * aspect));
      } else {
        var safe = stageWidth <= 560 ? 24 : 36;
        var vertical = stageWidth <= 560 ? 52 : 58;
        var reserveMobile = stageWidth <= 560 ? 166 : 154;
        if (stageWidth <= 560 && stageHeight <= 500) { vertical = 28; reserveMobile = 128; minWidth = 220; }
        else if (stageWidth <= 560 && stageHeight <= 620) { vertical = 36; reserveMobile = 140; minWidth = 248; }
        else { minWidth = stageWidth <= 560 ? 280 : 420; }
        fitByWidth = Math.max(220, stageWidth - safe);
        fitByHeight = Math.max(200, (stageHeight - vertical - reserveMobile) * aspect);
        maxWidth = stageWidth <= 560 ? 520 : 650;
      }

      targetWidth = clamp(Math.min(fitByWidth, fitByHeight, maxWidth), Math.min(minWidth, fitByWidth, maxWidth), Math.min(fitByWidth, fitByHeight, maxWidth));
      var nextSignature = [Math.round(stageWidth), Math.round(stageHeight), Math.round(targetWidth)].join(":");
      if (!force && nextSignature === fitSignature) return;
      fitSignature = nextSignature;
      setVar(logoLockup, "--nw-lockup-width", targetWidth.toFixed(2) + "px");
      setVar(logoLockup, "--nw-hero-fit-scale", "1");
      updateBalance();
      section.classList.add("is-fit-ready");
    };

    var updateMetrics = function (forceFit) {
      var viewport = getViewport();
      metrics.width = Math.max(1, viewport.width || 1);
      metrics.height = Math.max(1, viewport.height || 1);
      metrics.headerOffset = header ? header.getBoundingClientRect().height || 0 : 0;
      metrics.stageHeight = Math.max(1, metrics.height - metrics.headerOffset);
      metrics.sectionTop = section.offsetTop || 0;
      metrics.sectionHeight = section.offsetHeight || 1;
      metrics.maxScroll = Math.max(1, metrics.sectionHeight - metrics.stageHeight);
      metrics.nextTop = nextSection ? nextSection.offsetTop || 0 : metrics.sectionTop + metrics.sectionHeight;
      metrics.lowPower = metrics.width <= 780 || metrics.height <= 560 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
      updateResponsiveFit(forceFit === true);
      metrics.svgScale = logoSvg ? Math.max(0.01, logoSvg.getBoundingClientRect().width / 730) : 1;
    };

    var rawProgress = function (top) {
      return clamp((top - metrics.sectionTop + metrics.headerOffset) / metrics.maxScroll);
    };

    var uiOutProgress = function (top) {
      var nextTop = metrics.nextTop - top;
      var fadeStart = metrics.height * 0.92;
      var fadeEnd = metrics.height * 0.72;
      return smoothstep(clamp((fadeStart - nextTop) / Math.max(1, fadeStart - fadeEnd)));
    };

    var updateTargets = function () {
      var top = scrollTop();
      targetAssembly = clamp(rawProgress(top) / COMPLETE_AT);
      targetUiOut = uiOutProgress(top);
    };

    var states = pieces.map(function (piece) {
      return {
        el: piece,
        start: Number(piece.dataset.start || 0), end: Number(piece.dataset.end || 1),
        x: Number(piece.dataset.x || 0), y: Number(piece.dataset.y || 0),
        r: Number(piece.dataset.r || 0), s: Number(piece.dataset.s || 1),
        opacity: "", transform: "", lock: ""
      };
    });

    var pieceStyleAt = function (state, progress) {
      var local = (progress - state.start) / Math.max(0.001, state.end - state.start);
      local = clamp(local);
      var eased = easeOut(local);
      var remain = 1 - eased;
      var opacity = local <= 0 ? "0" : smoothstep(local).toFixed(3);
      var scale = metrics.svgScale;
      var tx = (state.x * remain * scale).toFixed(2);
      var ty = (state.y * remain * scale).toFixed(2);
      var rot = (state.r * remain).toFixed(2);
      var sc = (state.s + (1 - state.s) * eased).toFixed(3);
      return {
        opacity: opacity,
        transform: "translate3d(" + tx + "px," + ty + "px,0) rotate(" + rot + "deg) scale(" + sc + ")"
      };
    };

    var animatePiece = function (state, progress, force) {
      var rawLocal = (progress - state.start) / Math.max(0.001, state.end - state.start);
      var lock = "";
      if (rawLocal <= 0) { if (!force && state.lock === "before") return; lock = "before"; }
      else if (rawLocal >= 1) { if (!force && state.lock === "after") return; lock = "after"; }
      else { state.lock = ""; }
      var next = pieceStyleAt(state, progress);
      if (force || state.opacity !== next.opacity) { state.el.style.opacity = next.opacity; state.opacity = next.opacity; }
      if (force || state.transform !== next.transform) { state.el.style.transform = next.transform; state.transform = next.transform; }
      if (lock) state.lock = lock;
    };

    var reveal = function (el, amount, move) {
      if (!el) return;
      setStyle(el, "opacity", amount.toFixed(3));
      setStyle(el, "transform", "translateY(" + ((1 - amount) * move).toFixed(2) + "px)");
    };

    var setActionsArmed = function (armed) {
      if (!heroActions || actionsArmed === armed) return;
      actionsArmed = armed;
      heroActions.classList.toggle("is-armed", armed);
    };

    var setActionsActive = function (active) {
      if (!heroActions || actionsActive === active) {
        if (active) setActionsArmed(true);
        return;
      }
      if (active) setActionsArmed(true);
      actionsActive = active;
      heroActions.classList.toggle("is-visible", active);
      actionLinks.forEach(function (link) { active ? link.removeAttribute("tabindex") : link.setAttribute("tabindex", "-1"); });
    };

    var renderAssembly = function (progress, force) {
      setHeroProgress(progress);
      states.forEach(function (state) { animatePiece(state, progress, force); });
      if (stageCopy) {
        var introOut = smoothstep(clamp((progress - 0.06) / 0.2));
        setStyle(stageCopy, "opacity", (1 - introOut).toFixed(3));
        setStyle(stageCopy, "transform", "translateY(" + (-18 * introOut).toFixed(2) + "px)");
      }
      var copyIn = smoothstep(clamp((progress - 0.76) / 0.22));
      var actionsIn = smoothstep(clamp((progress - 0.86) / 0.14));
      reveal(brandCopy, copyIn, 18);
      reveal(heroActions, actionsIn, 22);
      setActionsArmed(actionsIn > 0.08);
      setActionsActive(actionsIn > 0.72);
      if (aura) {
        setStyle(aura, "opacity", (0.18 + progress * 0.28).toFixed(3));
        setStyle(aura, "transform", "translate(-50%, -54%) scale(" + (0.94 + progress * 0.08).toFixed(3) + ")");
      }
    };

    var renderUi = function (out) {
      var opacity = (1 - out).toFixed(3);
      var move = (10 * out).toFixed(2);
      if (scrollHint) { setStyle(scrollHint, "opacity", opacity); setStyle(scrollHint, "transform", "translateY(" + move + "px)"); }
      if (heroProgress) { setStyle(heroProgress, "opacity", opacity); setStyle(heroProgress, "transform", "translateY(" + move + "px)"); }
    };

    var render = function (force) {
      var assemblyChanged = force || Math.abs(currentAssembly - lastAssembly) >= EPS || currentAssembly === 0 || currentAssembly === 1;
      var uiChanged = force || Math.abs(currentUiOut - lastUiOut) >= EPS || currentUiOut === 0 || currentUiOut === 1;
      if (assemblyChanged) { renderAssembly(currentAssembly, force); lastAssembly = currentAssembly; }
      if (uiChanged) { renderUi(currentUiOut); lastUiOut = currentUiOut; }
    };

    var frame = function (time) {
      frameId = 0;
      if (document.hidden || introPlaying) return;
      updateTargets();
      var delta = lastFrame ? Math.min(80, Math.max(8, time - lastFrame)) : 16.67;
      lastFrame = time;
      var smooth = 1 - Math.pow(1 - (metrics.lowPower ? 0.095 : SMOOTH), delta / 16.67);
      currentAssembly += (targetAssembly - currentAssembly) * smooth;
      currentUiOut += (targetUiOut - currentUiOut) * smooth;
      if (Math.abs(targetAssembly - currentAssembly) < EPS) currentAssembly = targetAssembly;
      if (Math.abs(targetUiOut - currentUiOut) < EPS) currentUiOut = targetUiOut;
      render(false);
      if (Math.abs(targetAssembly - currentAssembly) >= EPS || Math.abs(targetUiOut - currentUiOut) >= EPS) frameId = window.requestAnimationFrame(frame);
      else { lastFrame = 0; section.classList.remove("is-animating"); }
    };

    var requestRender = function (force) {
      updateTargets();
      if (force) { currentAssembly = targetAssembly; currentUiOut = targetUiOut; render(true); return; }
      section.classList.add("is-animating");
      if (!frameId) frameId = window.requestAnimationFrame(frame);
    };

    var handleScroll = function () {
      if (introPlaying) return;
      var top = scrollTop();
      if (top < metrics.sectionTop - metrics.height * 0.9 || top > metrics.nextTop + metrics.height * 0.8) return;
      requestRender(false);
    };

    var handleResize = function () {
      if (resizeId) return;
      resizeId = window.requestAnimationFrame(function () {
        resizeId = 0;
        if (introPlaying) return;
        updateMetrics(true);
        requestRender(true);
      });
    };

    var getCompleteTop = function () {
      var start = Math.max(0, metrics.sectionTop - metrics.headerOffset);
      return clamp(start + metrics.maxScroll * COMPLETE_AT, start, start + metrics.maxScroll);
    };

    var setScrollInstant = function (top) {
      var previous = docEl.style.scrollBehavior;
      docEl.style.scrollBehavior = "auto";
      window.scrollTo(0, top);
      docEl.style.scrollBehavior = previous;
    };

    var stopProgressLoop = function () {
      if (progressFrame) window.cancelAnimationFrame(progressFrame);
      progressFrame = 0;
    };

    var startProgressLoop = function () {
      stopProgressLoop();
      var perf = window.performance && typeof window.performance.now === "function" ? window.performance : null;
      var startAt = (perf ? perf.now() : Date.now()) + INTRO_DELAY;
      var loop = function (time) {
        if (!introPlaying) { progressFrame = 0; return; }
        var now = typeof time === "number" ? time : (perf ? perf.now() : Date.now());
        var raw = clamp((now - startAt) / INTRO_DURATION);
        setHeroProgress(easeInOutCubic(raw));
        if (raw < 1) progressFrame = window.requestAnimationFrame(loop);
        else progressFrame = 0;
      };
      progressFrame = window.requestAnimationFrame(loop);
    };

    var cancelAutoPeek = function () {
      if (!introDone || introPlaying) return;
      autoPeekCancelled = true;
      if (heroPeekTimer) window.clearTimeout(heroPeekTimer);
      heroPeekTimer = 0;
    };

    var autoPeekNextContent = function () {
      if (window.location.hash || !nextSection || document.hidden || autoPeekCancelled) return;
      window.clearTimeout(heroPeekTimer);
      heroPeekTimer = window.setTimeout(function () {
        if (document.hidden || autoPeekCancelled || docEl.classList.contains("nw-route-transitioning") || body.classList.contains("menu-open")) return;
        var top = scrollTop();
        var minTop = getCompleteTop() - 8;
        var maxTop = metrics.nextTop - Math.max(180, metrics.stageHeight * 0.84);
        var isMobile = metrics.width <= 780;
        var ratio = isMobile ? 0.08 : 0.1;
        var minMove = isMobile ? 64 : 88;
        var maxMove = isMobile ? 112 : 156;
        var nudgeTop = top + Math.min(maxMove, Math.max(minMove, metrics.height * ratio));
        var targetTop = clamp(Math.max(nudgeTop, minTop), 0, Math.max(0, maxTop));
        if (targetTop <= top + 12) return;
        try { window.scrollTo({ top: targetTop, behavior: "smooth" }); }
        catch (error) { window.scrollTo(0, targetTop); }
      }, 520);
    };

    var clearIntroAnimations = function () {
      introAnimations.forEach(function (anim) {
        try { if (anim && typeof anim.commitStyles === "function") anim.commitStyles(); } catch (error) {}
        try { anim.cancel(); } catch (error) {}
      });
      introAnimations = [];
    };

    var finishIntro = function () {
      if (introDone) return;
      if (introFrame) window.cancelAnimationFrame(introFrame);
      if (introFinishTimer) window.clearTimeout(introFinishTimer);
      introFrame = 0;
      introFinishTimer = 0;
      setActionsArmed(true);
      setActionsActive(true);
      stopProgressLoop();
      setHeroProgress(1);
      clearIntroAnimations();
      unlockIntroInput();
      targetAssembly = currentAssembly = 1;
      targetUiOut = currentUiOut = uiOutProgress(scrollTop());
      render(true);
      introPlaying = false;
      introDone = true;
      section.classList.remove("is-intro-playing", "is-native-intro");
      section.classList.add("is-intro-complete");
      docEl.classList.remove("nw-intro-lock");
      body.classList.remove("nw-intro-lock");
      section.classList.remove("is-animating");
      try { document.dispatchEvent(new CustomEvent("novawork:hero-intro-done")); } catch (error) {}
      try { window.dispatchEvent(new CustomEvent("novawork:hero-intro-done")); } catch (error) {}
      requestRender(false);
      autoPeekNextContent();
    };

    var animateNative = function (el, keyframes, options) {
      if (!el || typeof el.animate !== "function") return null;
      var anim = el.animate(keyframes, options);
      introAnimations.push(anim);
      return anim;
    };

    var playIntroNative = function () {
      if (!pieces[0] || typeof pieces[0].animate !== "function") return false;
      section.classList.add("is-native-intro");
      var easing = "cubic-bezier(0.16, 1, 0.3, 1)";

      states.forEach(function (state) {
        var from = pieceStyleAt(state, 0);
        var to = pieceStyleAt(state, 1);
        state.el.style.opacity = from.opacity;
        state.el.style.transform = from.transform;
        state.opacity = from.opacity;
        state.transform = from.transform;
        state.lock = "";
        var start = clamp(state.start);
        var end = clamp(Math.max(state.end, state.start + 0.08));
        var delay = INTRO_DELAY + start * INTRO_DURATION;
        var duration = Math.max(360, (end - start) * INTRO_DURATION * 1.05);
        animateNative(state.el, [
          { opacity: from.opacity, transform: from.transform },
          { opacity: "1", transform: to.transform }
        ], { duration: duration, delay: delay, easing: easing, fill: "both" });
      });

      if (stageCopy) {
        animateNative(stageCopy, [
          { opacity: "1", transform: "translateY(0px)" },
          { opacity: "0", transform: "translateY(-18px)" }
        ], { duration: Math.max(520, INTRO_DURATION * 0.22), delay: INTRO_DELAY + INTRO_DURATION * 0.06, easing: easing, fill: "both" });
      }

      if (brandCopy) {
        animateNative(brandCopy, [
          { opacity: "0", transform: "translateY(18px)" },
          { opacity: "1", transform: "translateY(0px)" }
        ], { duration: Math.max(680, INTRO_DURATION * 0.24), delay: INTRO_DELAY + INTRO_DURATION * 0.75, easing: easing, fill: "both" });
      }

      if (heroActions) {
        animateNative(heroActions, [
          { opacity: "0", transform: "translateY(24px) scale(0.985)" },
          { opacity: "0.001", transform: "translateY(16px) scale(0.992)", offset: 0.18 },
          { opacity: "1", transform: "translateY(0px) scale(1)" }
        ], { duration: Math.max(760, INTRO_DURATION * 0.24), delay: INTRO_DELAY + INTRO_DURATION * 0.82, easing: easing, fill: "both" });
        actionLinks.forEach(function (link, index) {
          link.style.opacity = "0";
          link.style.transform = "translate3d(0, 10px, 0) scale(0.985)";
          animateNative(link, [
            { opacity: "0", transform: "translate3d(0, 10px, 0) scale(0.985)" },
            { opacity: "1", transform: "translate3d(0, 0, 0) scale(1)" }
          ], { duration: 560, delay: INTRO_DELAY + INTRO_DURATION * 0.86 + index * 70, easing: easing, fill: "both" });
        });
      }

      if (aura) {
        animateNative(aura, [
          { opacity: "0.18", transform: "translate(-50%, -54%) scale(0.94)" },
          { opacity: "0.46", transform: "translate(-50%, -54%) scale(1.02)" }
        ], { duration: INTRO_DURATION, delay: INTRO_DELAY, easing: easing, fill: "both" });
      }

      introFinishTimer = window.setTimeout(finishIntro, INTRO_DELAY + INTRO_DURATION + 420);
      return true;
    };

    var playIntro = function (time) {
      if (!introPlaying || document.hidden) return;
      if (!introStart) introStart = time;
      var raw = clamp((time - introStart) / INTRO_DURATION);
      currentAssembly = targetAssembly = easeInOutCubic(raw);
      currentUiOut = targetUiOut = 0;
      render(true);
      if (raw < 1) { introFrame = window.requestAnimationFrame(playIntro); return; }
      introFinishTimer = window.setTimeout(finishIntro, 90);
    };

    var startIntro = function () {
      if (introPlaying || introDone || window.location.hash) return;
      updateMetrics(true);
      var top = scrollTop();
      var start = Math.max(0, metrics.sectionTop - metrics.headerOffset);
      var end = start + metrics.maxScroll;
      var introRestTop = getCompleteTop();
      if (top > end + 4) return;
      introPlaying = true;
      lockIntroInput();
      introStart = 0;
      section.classList.add("is-intro-playing", "is-animating");
      section.classList.remove("is-intro-complete");
      docEl.classList.add("nw-intro-lock");
      body.classList.add("nw-intro-lock");
      setActionsArmed(false);
      setActionsActive(false);
      setScrollInstant(introRestTop);
      updateMetrics(true);
      currentAssembly = targetAssembly = 0;
      currentUiOut = targetUiOut = 0;
      render(true);
      startProgressLoop();
      try { document.dispatchEvent(new CustomEvent("novawork:hero-intro-start")); } catch (error) {}
      try { window.dispatchEvent(new CustomEvent("novawork:hero-intro-start")); } catch (error) {}
      if (!playIntroNative()) {
        window.setTimeout(function () { introFrame = window.requestAnimationFrame(playIntro); }, INTRO_DELAY);
      }
    };

    window.nwLogoHeroPrewarm = function nwLogoHeroPrewarm() {
      return false;
    };

    var introInputLocked = false;
    var preventIntroScroll = function (event) { if (introPlaying) event.preventDefault(); };
    var preventIntroKey = function (event) { if (introPlaying && { ArrowDown:1, ArrowUp:1, PageDown:1, PageUp:1, Home:1, End:1, " ":1 }[event.key]) event.preventDefault(); };
    var lockIntroInput = function () {
      if (introInputLocked) return;
      introInputLocked = true;
      window.addEventListener("wheel", preventIntroScroll, { passive: false });
      window.addEventListener("touchmove", preventIntroScroll, { passive: false });
      document.addEventListener("keydown", preventIntroKey);
    };
    var unlockIntroInput = function () {
      if (!introInputLocked) return;
      introInputLocked = false;
      window.removeEventListener("wheel", preventIntroScroll, { passive: false });
      window.removeEventListener("touchmove", preventIntroScroll, { passive: false });
      document.removeEventListener("keydown", preventIntroKey);
    };

    updateMetrics(true);
    setActionsArmed(false);
    setActionsActive(false);
    if (!window.location.hash && scrollTop() > 0 && scrollTop() < metrics.sectionTop + metrics.sectionHeight - metrics.headerOffset) setScrollInstant(0);
    updateTargets();
    currentAssembly = targetAssembly;
    currentUiOut = targetUiOut;
    render(true);

    window.addEventListener("wheel", cancelAutoPeek, { passive: true });
    window.addEventListener("touchstart", cancelAutoPeek, { passive: true });
    document.addEventListener("keydown", cancelAutoPeek);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("load", handleResize, { once: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && introFrame) { window.cancelAnimationFrame(introFrame); introFrame = 0; return; }
      if (introPlaying && !introFrame && !introAnimations.length) { introStart = 0; introFrame = window.requestAnimationFrame(playIntro); }
      handleResize();
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(handleResize).catch(function () {});

    var queueIntro = function () {
      var run = function () { window.setTimeout(startIntro, 80); };
      if (docEl.classList.contains("nw-route-entering") || docEl.classList.contains("nw-route-transitioning") || window.__NW_ROUTE_ENTERING === true) {
        var routed = false;
        var afterRoute = function () {
          if (routed) return;
          routed = true;
          run();
        };
        document.addEventListener("novawork:route-enter-done", afterRoute, { once: true });
        window.addEventListener("novawork:route-enter-done", afterRoute, { once: true });
        window.setTimeout(afterRoute, 2400);
        return;
      }
      if (window.__NW_REVEAL_DONE || docEl.classList.contains("site-is-ready") || docEl.classList.contains("site-reveal-done")) { startIntro(); return; }
      document.addEventListener("novawork:logo-intro-start", run, { once: true });
      window.addEventListener("novawork:logo-intro-start", run, { once: true });
      window.setTimeout(run, 6000);
    };
    queueIntro();
  };
})();
