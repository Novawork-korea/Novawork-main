(function () {
  "use strict";

  var hasInitialized = false;

  window.initLogoScrollHero = function initLogoScrollHero() {
    if (hasInitialized) {
      return;
    }

    var section = document.querySelector(".nw-logo-scroll");
    var pieces = Array.prototype.slice.call(document.querySelectorAll(".nw-logo-piece"));

    if (!section || pieces.length === 0) {
      return;
    }

    hasInitialized = true;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    var docEl = document.documentElement;
    var body = document.body;
    var header = document.querySelector(".header");
    var stage = document.querySelector(".nw-sticky-stage");
    var stageCopy = document.querySelector(".nw-stage-copy");
    var brandCopy = document.querySelector(".nw-brand-copy");
    var heroActions = document.querySelector(".nw-hero-actions");
    var logoLockup = document.querySelector(".nw-logo-lockup");
    var logoSvg = logoLockup
      ? logoLockup.querySelector(".nw-logo-svg")
      : document.querySelector(".nw-logo-svg");

    var heroActionLinks = heroActions
      ? Array.prototype.slice.call(heroActions.querySelectorAll("a"))
      : [];

    var progressBar = document.querySelector(".nw-progress__bar");
    var progressText = document.querySelector(".nw-progress__text");
    var aura = document.querySelector(".nw-logo-aura");
    var scrollHint = document.querySelector(".nw-scroll-hint");
    var progressWrap = document.querySelector(".nw-progress");
    var nextSection = section.nextElementSibling;

    var reducedMotionQuery = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

    /*
      기준값:
      레퍼런스 script.js의 관성감에 맞춤.
      smooth 0.055 / complete 0.82 계열.
    */
    var COMPLETE_AT = 0.82;

    /*
      마우스 휠 한 번당 로고 조립 진행률.
      0.03 = 휠 1신호당 약 3% 조립.
    */
    var MOUSE_WHEEL_ASSEMBLY_STEP = 0.03;

    /*
      트랙패드 구분 기준.
      트랙패드는 delta가 작게 자주 들어오므로 비례 감쇠한다.
    */
    var TRACKPAD_DELTA_LIMIT = 45;

    /*
      휠 스크롤 자체는 거의 바로 목표 위치로 이동시킨다.
      관성 느낌은 아래 SMOOTH_FACTOR로 로고 조립 progress에만 준다.
      이렇게 해야 답답하지 않고 묵직하게 따라온다.
    */
    var WHEEL_INERTIA_EASE = 1;
    var WHEEL_SETTLE_EPSILON = 0.35;

    /*
      로고 조립 보간값.
      낮을수록 모바일 관성처럼 천천히 따라온다.
    */
    var SMOOTH_FACTOR = 0.055;
    var LOW_POWER_SMOOTH_FACTOR = 0.075;

    /*
      데스크톱은 거의 매 프레임 렌더.
      모바일/저사양만 살짝 제한해서 렉을 줄인다.
    */
    var DESKTOP_FRAME_INTERVAL = 16;
    var LOW_POWER_FRAME_INTERVAL = 22;

    var SNAP_EPSILON = 0.0008;
    var RENDER_EPSILON = 0.001;

    var actionsAreActive = false;
    var animationLayerActive = false;
    var wheelListenerActive = false;

    var animationFrameId = 0;
    var resizeFrameId = 0;
    var wheelFrameId = 0;

    var forceAssemblyRender = false;
    var forceUiRender = false;

    var targetAssemblyProgress = 0;
    var targetUiOut = 0;

    var currentAssemblyProgress = 0;
    var currentUiOut = 0;

    var lastRenderedAssemblyProgress = -1;
    var lastRenderedUiOut = -1;

    var hasRenderedAssembly = false;
    var hasRenderedUi = false;

    var lastFrameTime = 0;
    var lastRenderTime = 0;
    var lastProgressPercent = -1;

    var wheelControlActive = false;
    var wheelCurrentScrollTop = 0;
    var wheelTargetScrollTop = 0;
    var wheelLastFrameTime = 0;
    var wheelPreviousScrollBehavior = "";

    /*
      First-load intro:
      Instead of replacing the existing scroll animation, we drive the real hero
      scroll position from 0% to the logo-complete point. This keeps the original
      scroll interaction alive after the intro finishes.
    */
    var INTRO_DURATION = 3000;
    var INTRO_START_DELAY = 200;
    var INTRO_FINISH_DELAY = 120;
    var introPlaying = false;
    var introHasCompleted = false;
    var introFrameId = 0;
    var introStartTimerId = 0;
    var introFinishTimerId = 0;
    var introStartTime = null;
    var introLastRawProgress = 0;
    var introPreviousScrollBehavior = "";

    var metrics = {
      width: window.innerWidth || 1,
      height: window.innerHeight || 1,
      headerOffset: 0,
      stageHeight: 1,
      sectionTop: 0,
      sectionHeight: 1,
      maxScroll: 1,
      nextSectionTop: 0,
      lowPower: false,
      frameInterval: DESKTOP_FRAME_INTERVAL
    };

    var styleCache = typeof WeakMap !== "undefined" ? new WeakMap() : null;

    var getStyleCache = function (element) {
      if (!element) {
        return {};
      }

      if (styleCache) {
        var cached = styleCache.get(element);

        if (!cached) {
          cached = {};
          styleCache.set(element, cached);
        }

        return cached;
      }

      if (!element.__nwStyleCache) {
        element.__nwStyleCache = {};
      }

      return element.__nwStyleCache;
    };

    var setStyle = function (element, property, value) {
      if (!element) {
        return;
      }

      var cache = getStyleCache(element);

      if (cache[property] === value) {
        return;
      }

      element.style[property] = value;
      cache[property] = value;
    };

    var setCssVar = function (element, property, value) {
      if (!element) {
        return;
      }

      var cache = getStyleCache(element);
      var key = "cssvar:" + property;

      if (cache[key] === value) {
        return;
      }

      element.style.setProperty(property, value);
      cache[key] = value;
    };

    var clamp = function (value, min, max) {
      var lower = typeof min === "number" ? min : 0;
      var upper = typeof max === "number" ? max : 1;

      return Math.min(upper, Math.max(lower, value));
    };

    var easeOutCubic = function (t) {
      return 1 - Math.pow(1 - t, 3);
    };

    var easeInOutCubic = function (t) {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    var smoothstep = function (t) {
      return t * t * (3 - 2 * t);
    };

    var isBoundary = function (value) {
      return value === 0 || value === 1;
    };

    var setAnimationLayersActive = function (active) {
      if (animationLayerActive === active) {
        return;
      }

      animationLayerActive = active;
      section.classList.toggle("is-animating", active);
    };

    var isHeroNearViewport = function (scrollTop) {
      var currentScrollTop = typeof scrollTop === "number" ? scrollTop : getScrollTop();
      var before = metrics.height * 0.85;
      var after = metrics.height * 0.85;

      return (
        currentScrollTop >= metrics.sectionTop - before &&
        currentScrollTop <= metrics.nextSectionTop + after
      );
    };

    var getViewportSize = function () {
      var visualViewport = window.visualViewport;

      return {
        width: visualViewport && visualViewport.width
          ? visualViewport.width
          : window.innerWidth,
        height: visualViewport && visualViewport.height
          ? visualViewport.height
          : window.innerHeight
      };
    };

    var getHeaderOffset = function () {
      if (!header) {
        header = document.querySelector(".header");
      }

      return header ? header.getBoundingClientRect().height || 0 : 0;
    };

    var getScrollTop = function () {
      return (
        window.pageYOffset ||
        docEl.scrollTop ||
        document.body.scrollTop ||
        0
      );
    };

    var isLowPowerEnvironment = function (viewport) {
      var smallScreen = viewport.width <= 780 || viewport.height <= 560;

      var lowCpu =
        typeof navigator.hardwareConcurrency === "number" &&
        navigator.hardwareConcurrency > 0 &&
        navigator.hardwareConcurrency <= 4;

      var lowMemory =
        typeof navigator.deviceMemory === "number" &&
        navigator.deviceMemory > 0 &&
        navigator.deviceMemory <= 4;

      var reducedMotion =
        reducedMotionQuery &&
        reducedMotionQuery.matches;

      return Boolean(smallScreen || lowCpu || lowMemory || reducedMotion);
    };

    var getTranslateY = function (element) {
      if (!element) {
        return 0;
      }

      var transform = window.getComputedStyle(element).transform;

      if (!transform || transform === "none") {
        return 0;
      }

      var match = transform.match(/matrix(3d)?\((.+)\)/);

      if (!match) {
        return 0;
      }

      var values = match[2].split(",").map(parseFloat);

      return match[1] === "3d" ? values[13] || 0 : values[5] || 0;
    };

    var getHeroScrollBounds = function () {
      var start = Math.max(0, metrics.sectionTop - metrics.headerOffset);
      var end = Math.max(start, start + metrics.maxScroll);

      return {
        start: start,
        end: end
      };
    };

    var clampWheelStateToHero = function () {
      var bounds = getHeroScrollBounds();
      var currentScrollTop = getScrollTop();

      wheelCurrentScrollTop = clamp(
        wheelCurrentScrollTop || currentScrollTop,
        bounds.start,
        bounds.end
      );

      wheelTargetScrollTop = clamp(
        wheelTargetScrollTop || currentScrollTop,
        bounds.start,
        bounds.end
      );
    };

    var updateLockupBalance = function () {
      if (!logoLockup || !heroActions || !stage || !logoSvg) {
        return;
      }

      setCssVar(logoLockup, "--nw-balance-y", "0px");

      var stageRect = stage.getBoundingClientRect();
      var logoRect = logoSvg.getBoundingClientRect();
      var actionsRect = heroActions.getBoundingClientRect();

      var logoTopLineRatio = 21 / 610;
      var actionTranslateY = getTranslateY(heroActions);

      var logoTopLineY = logoRect.top + logoRect.height * logoTopLineRatio;
      var buttonBottomY = actionsRect.bottom - actionTranslateY;

      var topGap = logoTopLineY - stageRect.top;
      var bottomGap = stageRect.bottom - buttonBottomY;

      var balanceY = (bottomGap - topGap) / 2;
      var maxShift = Math.max(18, stageRect.height * 0.16);

      balanceY = clamp(balanceY, -maxShift, maxShift);

      setCssVar(logoLockup, "--nw-balance-y", balanceY.toFixed(2) + "px");
    };

    var updateResponsiveFit = function () {
      if (!logoLockup) {
        return;
      }

      var stageWidth = Math.max(1, metrics.width);
      var stageHeight = Math.max(1, metrics.stageHeight);
      var viewportHeight = Math.max(1, metrics.height);
      var aspect = 730 / 610;

      var horizontalSafe;
      var verticalSafe;
      var belowReserve;
      var fitByWidth;
      var fitByHeight;
      var maxWidth;
      var minWidth;
      var targetWidth;

      if (stageHeight <= 420) {
        horizontalSafe = 32;
        verticalSafe = 26;
        belowReserve = 72;

        fitByWidth = Math.max(
          190,
          Math.min(stageWidth - horizontalSafe, stageWidth * 0.52)
        );

        fitByHeight = Math.max(
          180,
          (stageHeight - verticalSafe - belowReserve) * aspect
        );

        maxWidth = 320;
        minWidth = 190;

        targetWidth = Math.min(fitByWidth, fitByHeight, maxWidth);

        targetWidth = clamp(
          targetWidth,
          Math.min(minWidth, fitByWidth, maxWidth),
          Math.min(fitByWidth, maxWidth)
        );
      } else if (stageWidth > 780) {
        belowReserve =
          stageHeight <= 640 ? 96 :
          stageHeight <= 760 ? 118 :
          132;

        fitByWidth = stageWidth * 0.345;
        fitByHeight = viewportHeight * 0.72;
        maxWidth = 820;
        minWidth = stageWidth >= 1180 ? 420 : 360;

        targetWidth = Math.min(
          fitByWidth,
          fitByHeight,
          Math.max(260, (stageHeight - belowReserve) * aspect),
          maxWidth
        );

        targetWidth = clamp(
          targetWidth,
          Math.min(minWidth, fitByWidth, fitByHeight, maxWidth),
          Math.min(fitByWidth, fitByHeight, maxWidth)
        );
      } else {
        horizontalSafe = stageWidth <= 560 ? 24 : 36;

        if (stageWidth <= 560 && stageHeight <= 500) {
          verticalSafe = 28;
          belowReserve = 128;
          minWidth = 220;
        } else if (stageWidth <= 560 && stageHeight <= 620) {
          verticalSafe = 36;
          belowReserve = 140;
          minWidth = 248;
        } else {
          verticalSafe = stageWidth <= 560 ? 52 : 58;
          belowReserve = stageWidth <= 560 ? 166 : 154;
          minWidth = stageWidth <= 560 ? 280 : 420;
        }

        fitByWidth = Math.max(220, stageWidth - horizontalSafe);

        fitByHeight = Math.max(
          200,
          (stageHeight - verticalSafe - belowReserve) * aspect
        );

        maxWidth = stageWidth <= 560 ? 520 : 650;
        targetWidth = Math.min(fitByWidth, fitByHeight, maxWidth);

        targetWidth = clamp(
          targetWidth,
          Math.min(minWidth, fitByWidth, maxWidth),
          Math.min(fitByWidth, maxWidth)
        );
      }

      setCssVar(logoLockup, "--nw-lockup-width", targetWidth.toFixed(2) + "px");
      setCssVar(logoLockup, "--nw-hero-fit-scale", "1");

      updateLockupBalance();
    };

    var updateMetrics = function () {
      var viewport = getViewportSize();

      metrics.width = Math.max(1, viewport.width || window.innerWidth || 1);
      metrics.height = Math.max(1, viewport.height || window.innerHeight || 1);
      metrics.headerOffset = getHeaderOffset();
      metrics.stageHeight = Math.max(1, metrics.height - metrics.headerOffset);
      metrics.sectionTop = section.offsetTop || 0;
      metrics.sectionHeight = section.offsetHeight || 1;
      metrics.maxScroll = Math.max(1, metrics.sectionHeight - metrics.stageHeight);
      metrics.nextSectionTop = nextSection
        ? nextSection.offsetTop || 0
        : metrics.sectionTop + metrics.sectionHeight;

      metrics.lowPower = isLowPowerEnvironment(viewport);
      metrics.frameInterval = metrics.lowPower
        ? LOW_POWER_FRAME_INTERVAL
        : DESKTOP_FRAME_INTERVAL;

      updateResponsiveFit();
      clampWheelStateToHero();
    };

    var computeRawProgress = function (scrollTop) {
      return clamp(
        (scrollTop - metrics.sectionTop + metrics.headerOffset) / metrics.maxScroll
      );
    };

    var computeUiOut = function (scrollTop) {
      var nextTop = metrics.nextSectionTop - scrollTop;
      var fadeStart = metrics.height * 0.92;
      var fadeEnd = metrics.height * 0.72;

      return smoothstep(
        clamp((fadeStart - nextTop) / Math.max(1, fadeStart - fadeEnd))
      );
    };

    var updateTargets = function (scrollTop) {
      var top = typeof scrollTop === "number" ? scrollTop : getScrollTop();
      var rawProgress = computeRawProgress(top);

      targetAssemblyProgress = clamp(rawProgress / COMPLETE_AT);
      targetUiOut = computeUiOut(top);
    };

    var jumpToTopWithoutSmoothScroll = function () {
      var previousBehavior = docEl.style.scrollBehavior;

      docEl.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      docEl.style.scrollBehavior = previousBehavior;
    };

    var resetRestoredHeroScroll = function () {
      var scrollTop = getScrollTop();
      var heroEnd = section.offsetTop + section.offsetHeight - metrics.headerOffset;

      if (window.location.hash || scrollTop <= 0 || scrollTop >= heroEnd) {
        return false;
      }

      jumpToTopWithoutSmoothScroll();
      return true;
    };

    var setScrollTopWithoutSmoothScroll = function (scrollTop) {
      var previousBehavior = docEl.style.scrollBehavior;

      docEl.style.scrollBehavior = "auto";
      window.scrollTo(0, scrollTop);
      docEl.style.scrollBehavior = previousBehavior;
    };

    var getIntroCompleteScrollTop = function () {
      var bounds = getHeroScrollBounds();
      var completeTop = bounds.start + metrics.maxScroll * COMPLETE_AT;

      return clamp(completeTop, bounds.start, bounds.end);
    };

    var shouldRunIntroOnLoad = function () {
      if (window.location.hash || introHasCompleted) {
        return false;
      }

      var scrollTop = getScrollTop();
      var bounds = getHeroScrollBounds();

      return scrollTop <= bounds.end + 4;
    };

    var lockIntroInput = function () {
      introPreviousScrollBehavior = docEl.style.scrollBehavior;
      docEl.style.scrollBehavior = "auto";

      introPlaying = true;
      section.classList.add("is-intro-playing");
      section.classList.remove("is-intro-complete");
      docEl.classList.add("nw-intro-lock");

      if (body) {
        body.classList.add("nw-intro-lock");
      }

      setWheelListenerActive(false);
      setActionsActive(false);
    };

    var unlockIntroInput = function () {
      section.classList.remove("is-intro-playing");
      section.classList.add("is-intro-complete");
      docEl.classList.remove("nw-intro-lock");
      docEl.style.scrollBehavior = introPreviousScrollBehavior || "";
      introPreviousScrollBehavior = "";

      if (body) {
        body.classList.remove("nw-intro-lock");
      }
    };

    var finishIntro = function () {
      if (introFrameId) {
        window.cancelAnimationFrame(introFrameId);
        introFrameId = 0;
      }

      if (introStartTimerId) {
        window.clearTimeout(introStartTimerId);
        introStartTimerId = 0;
      }

      if (introFinishTimerId) {
        window.clearTimeout(introFinishTimerId);
        introFinishTimerId = 0;
      }

      var completeTop = getIntroCompleteScrollTop();

      window.scrollTo(0, completeTop);
      updateMetrics();
      syncWheelStateToCurrentScroll();
      updateTargets(completeTop);

      targetAssemblyProgress = 1;
      currentAssemblyProgress = 1;
      currentUiOut = targetUiOut;

      renderAssembly(currentAssemblyProgress, true);
      renderScrollUi(currentUiOut, true);

      lastRenderedAssemblyProgress = currentAssemblyProgress;
      lastRenderedUiOut = currentUiOut;
      hasRenderedAssembly = true;
      hasRenderedUi = true;

      setActionsActive(true);
      introPlaying = false;
      introHasCompleted = true;
      introStartTime = null;
      introLastRawProgress = 1;

      unlockIntroInput();
      updateWheelListenerState(completeTop);
      requestRender(true);
    };

    var scheduleIntroFinish = function () {
      if (introFinishTimerId) {
        return;
      }

      introFinishTimerId = window.setTimeout(finishIntro, INTRO_FINISH_DELAY);
    };

    var playIntroFrame = function (timestamp) {
      introFrameId = 0;

      if (!introPlaying || document.hidden) {
        return;
      }

      if (introStartTime === null) {
        introStartTime = timestamp;
      }

      var rawProgress = clamp((timestamp - introStartTime) / INTRO_DURATION);
      var easedProgress = easeOutCubic(rawProgress);
      var bounds = getHeroScrollBounds();
      var completeTop = getIntroCompleteScrollTop();
      var introScrollTop = bounds.start + (completeTop - bounds.start) * easedProgress;

      introLastRawProgress = rawProgress;
      window.scrollTo(0, introScrollTop);

      syncWheelStateToCurrentScroll();
      updateTargets(introScrollTop);
      requestRender(false);

      if (rawProgress < 1) {
        introFrameId = window.requestAnimationFrame(playIntroFrame);
        return;
      }

      scheduleIntroFinish();
    };

    var startIntro = function () {
      if (introPlaying || introHasCompleted) {
        return;
      }

      updateMetrics();
      lockIntroInput();

      var bounds = getHeroScrollBounds();

      setScrollTopWithoutSmoothScroll(bounds.start);
      syncWheelStateToCurrentScroll();
      updateTargets(bounds.start);

      targetAssemblyProgress = 0;
      targetUiOut = 0;
      currentAssemblyProgress = 0;
      currentUiOut = 0;
      introStartTime = null;
      introLastRawProgress = 0;
      lastRenderTime = 0;
      lastFrameTime = 0;

      renderAssembly(0, true);
      renderScrollUi(0, true);
      setActionsActive(false);

      if (introStartTimerId) {
        window.clearTimeout(introStartTimerId);
      }

      introStartTimerId = window.setTimeout(function () {
        introStartTimerId = 0;

        if (!introPlaying || introFrameId) {
          return;
        }

        introFrameId = window.requestAnimationFrame(playIntroFrame);
      }, INTRO_START_DELAY);
    };

    var preventIntroScroll = function (event) {
      if (!introPlaying) {
        return;
      }

      event.preventDefault();
    };

    var preventIntroKeyScroll = function (event) {
      if (!introPlaying) {
        return;
      }

      var scrollKeys = {
        ArrowDown: true,
        ArrowUp: true,
        PageDown: true,
        PageUp: true,
        Home: true,
        End: true,
        " ": true
      };

      if (scrollKeys[event.key]) {
        event.preventDefault();
      }
    };

    var syncWheelStateToCurrentScroll = function () {
      var scrollTop = getScrollTop();

      wheelCurrentScrollTop = scrollTop;
      wheelTargetScrollTop = scrollTop;
    };

    var beginWheelControl = function () {
      if (wheelControlActive) {
        return;
      }

      wheelControlActive = true;
      wheelPreviousScrollBehavior = docEl.style.scrollBehavior;
      docEl.style.scrollBehavior = "auto";

      syncWheelStateToCurrentScroll();
      wheelLastFrameTime = 0;
    };

    var endWheelControl = function () {
      if (!wheelControlActive) {
        return;
      }

      wheelControlActive = false;
      docEl.style.scrollBehavior = wheelPreviousScrollBehavior || "";
      wheelPreviousScrollBehavior = "";
      wheelLastFrameTime = 0;
      syncWheelStateToCurrentScroll();
    };

    var normalizeWheelDelta = function (event) {
      var delta = event.deltaY || 0;

      if (event.deltaMode === 1) {
        delta *= 16;
      } else if (event.deltaMode === 2) {
        delta *= metrics.height;
      }

      return delta;
    };

    var shouldControlWheel = function (event, normalizedDelta) {
      if (!normalizedDelta || event.ctrlKey) {
        return false;
      }

      var scrollTop = getScrollTop();
      var bounds = getHeroScrollBounds();
      var direction = normalizedDelta > 0 ? 1 : -1;

      var insideHeroScroll =
        scrollTop >= bounds.start - 2 &&
        scrollTop <= bounds.end + 2;

      if (!insideHeroScroll) {
        return false;
      }

      if (direction < 0 && scrollTop <= bounds.start + 1) {
        return false;
      }

      if (direction > 0 && scrollTop >= bounds.end - 1) {
        return false;
      }

      return true;
    };

    var getWheelStepPx = function (normalizedDelta) {
      var direction = normalizedDelta > 0 ? 1 : -1;
      var amount = Math.abs(normalizedDelta);

      /*
        목표:
        마우스 휠 1번 = assemblyProgress 약 3%.

        assemblyProgress = rawProgress / COMPLETE_AT
        그러므로 rawProgress 변화량은 COMPLETE_AT * 0.03.
      */
      var baseStepPx =
        metrics.maxScroll * COMPLETE_AT * MOUSE_WHEEL_ASSEMBLY_STEP;

      /*
        일반 마우스 휠:
        delta 크기와 상관없이 한 번에 3%.

        트랙패드:
        작은 delta가 자주 들어오므로 비례 감쇠.
      */
      var multiplier =
        amount < TRACKPAD_DELTA_LIMIT
          ? clamp(amount / TRACKPAD_DELTA_LIMIT, 0.08, 0.55)
          : 1;

      return direction * baseStepPx * multiplier;
    };

    var getWheelInertiaEase = function (timestamp) {
      var delta = wheelLastFrameTime ? timestamp - wheelLastFrameTime : 16.67;

      wheelLastFrameTime = timestamp;
      delta = clamp(delta, 8, 80);

      return 1 - Math.pow(1 - WHEEL_INERTIA_EASE, delta / 16.67);
    };

    var applyWheelScrollTop = function (scrollTop) {
      window.scrollTo(0, scrollTop);
    };

    var runWheelInertia = function (timestamp) {
      wheelFrameId = 0;

      if (document.hidden) {
        endWheelControl();
        return;
      }

      var diff = wheelTargetScrollTop - wheelCurrentScrollTop;

      if (Math.abs(diff) <= WHEEL_SETTLE_EPSILON) {
        wheelCurrentScrollTop = wheelTargetScrollTop;
        applyWheelScrollTop(wheelCurrentScrollTop);
        updateTargets(wheelCurrentScrollTop);
        requestRender(false);
        endWheelControl();
        return;
      }

      wheelCurrentScrollTop += diff * getWheelInertiaEase(timestamp);
      applyWheelScrollTop(wheelCurrentScrollTop);

      updateTargets(wheelCurrentScrollTop);
      requestRender(false);

      wheelFrameId = window.requestAnimationFrame(runWheelInertia);
    };

    var requestWheelInertia = function () {
      if (wheelFrameId) {
        return;
      }

      wheelFrameId = window.requestAnimationFrame(runWheelInertia);
    };

    var handleWheel = function (event) {
      if (introPlaying) {
        event.preventDefault();
        return;
      }

      var normalizedDelta = normalizeWheelDelta(event);

      if (!shouldControlWheel(event, normalizedDelta)) {
        return;
      }

      event.preventDefault();

      var bounds = getHeroScrollBounds();
      var stepPx = getWheelStepPx(normalizedDelta);

      beginWheelControl();

      wheelTargetScrollTop = clamp(
        wheelTargetScrollTop + stepPx,
        bounds.start,
        bounds.end
      );

      requestWheelInertia();
      requestRender(false);
    };

    var setWheelListenerActive = function (active) {
      if (wheelListenerActive === active) {
        return;
      }

      wheelListenerActive = active;

      if (active) {
        window.addEventListener("wheel", handleWheel, { passive: false });
      } else {
        window.removeEventListener("wheel", handleWheel);
        endWheelControl();
      }
    };

    var updateWheelListenerState = function (scrollTop) {
      if (introPlaying) {
        setWheelListenerActive(false);
        return;
      }

      var currentScrollTop = typeof scrollTop === "number" ? scrollTop : getScrollTop();
      var bounds = getHeroScrollBounds();
      var buffer = Math.max(160, metrics.height * 0.7);
      var shouldBeActive =
        currentScrollTop >= bounds.start - buffer &&
        currentScrollTop <= bounds.end + buffer;

      setWheelListenerActive(shouldBeActive);
    };

    var pieceStates = pieces.map(function (piece) {
      var box = piece.getBBox();

      return {
        element: piece,
        start: Number(piece.dataset.start || 0),
        end: Number(piece.dataset.end || 1),
        x: Number(piece.dataset.x || 0),
        y: Number(piece.dataset.y || 0),
        r: Number(piece.dataset.r || 0),
        s: Number(piece.dataset.s || 1),
        cx: box.x + box.width / 2,
        cy: box.y + box.height / 2,
        lastOpacity: "",
        lastTransform: "",
        lockState: ""
      };
    });

    var animatePiece = function (state, progress, force) {
      var duration = Math.max(0.001, state.end - state.start);
      var rawLocal = (progress - state.start) / duration;
      var lockState = "";

      if (rawLocal <= 0) {
        if (!force && state.lockState === "before") {
          return;
        }

        rawLocal = 0;
        lockState = "before";
      } else if (rawLocal >= 1) {
        if (!force && state.lockState === "after") {
          return;
        }

        rawLocal = 1;
        lockState = "after";
      } else {
        state.lockState = "";
      }

      var local = clamp(rawLocal);
      var eased = easeOutCubic(local);
      var remain = 1 - eased;

      var currentX = state.x * remain;
      var currentY = state.y * remain;
      var currentR = state.r * remain;
      var currentScale = state.s + (1 - state.s) * eased;
      var opacity = local <= 0 ? 0 : smoothstep(local);

      var opacityValue = opacity.toFixed(2);

      var transformValue =
        "translate(" + currentX.toFixed(1) + " " + currentY.toFixed(1) + ") " +
        "translate(" + state.cx.toFixed(1) + " " + state.cy.toFixed(1) + ") " +
        "rotate(" + currentR.toFixed(1) + ") " +
        "scale(" + currentScale.toFixed(3) + ") " +
        "translate(" + (-state.cx).toFixed(1) + " " + (-state.cy).toFixed(1) + ")";

      if (force || state.lastOpacity !== opacityValue) {
        state.element.style.opacity = opacityValue;
        state.lastOpacity = opacityValue;
      }

      if (force || state.lastTransform !== transformValue) {
        state.element.setAttribute("transform", transformValue);
        state.lastTransform = transformValue;
      }

      if (lockState) {
        state.lockState = lockState;
      }
    };

    var revealElement = function (element, amount, move) {
      if (!element) {
        return;
      }

      setStyle(element, "opacity", amount.toFixed(3));
      setStyle(
        element,
        "transform",
        "translateY(" + ((1 - amount) * move).toFixed(2) + "px)"
      );
    };

    var setActionsActive = function (active) {
      if (!heroActions || actionsAreActive === active) {
        return;
      }

      actionsAreActive = active;
      heroActions.classList.toggle("is-visible", active);

      heroActionLinks.forEach(function (link) {
        if (active) {
          link.removeAttribute("tabindex");
        } else {
          link.setAttribute("tabindex", "-1");
        }
      });
    };

    var renderAssembly = function (assemblyProgress, force) {
      pieceStates.forEach(function (state) {
        animatePiece(state, assemblyProgress, force);
      });

      if (stageCopy) {
        var introOut = smoothstep(clamp((assemblyProgress - 0.06) / 0.2));

        setStyle(stageCopy, "opacity", (1 - introOut).toFixed(3));
        setStyle(
          stageCopy,
          "transform",
          "translateY(" + (-18 * introOut).toFixed(2) + "px)"
        );
      }

      var copyIn = smoothstep(clamp((assemblyProgress - 0.78) / 0.22));

      revealElement(brandCopy, copyIn, 18);
      revealElement(heroActions, copyIn, 18);
      setActionsActive(copyIn > 0.75);

      if (aura) {
        setStyle(aura, "opacity", (0.18 + assemblyProgress * 0.28).toFixed(3));
        setStyle(
          aura,
          "transform",
          "translate(-50%, -54%) scale(" +
            (0.94 + assemblyProgress * 0.08).toFixed(3) +
            ")"
        );
      }

      if (progressBar) {
        setStyle(
          progressBar,
          "transform",
          "scaleX(" + assemblyProgress.toFixed(3) + ")"
        );
      }

      if (progressText) {
        var progressPercent = Math.round(assemblyProgress * 100);

        if (force || progressPercent !== lastProgressPercent) {
          progressText.textContent =
            String(progressPercent).padStart(2, "0") + "%";
          lastProgressPercent = progressPercent;
        }
      }
    };

    var renderScrollUi = function (uiOut, force) {
      var uiOpacity = 1 - uiOut;
      var uiMove = 10 * uiOut;

      if (scrollHint) {
        setStyle(scrollHint, "opacity", uiOpacity.toFixed(3));
        setStyle(
          scrollHint,
          "transform",
          "translateY(" + uiMove.toFixed(2) + "px)"
        );
      }

      if (progressWrap) {
        setStyle(progressWrap, "opacity", uiOpacity.toFixed(3));
        setStyle(
          progressWrap,
          "transform",
          "translateY(" + uiMove.toFixed(2) + "px)"
        );
      }
    };

    var getFrameSmoothing = function (timestamp) {
      var delta = lastFrameTime ? timestamp - lastFrameTime : 16.67;

      lastFrameTime = timestamp;
      delta = clamp(delta, 8, 80);

      var base = metrics.lowPower
        ? LOW_POWER_SMOOTH_FACTOR
        : SMOOTH_FACTOR;

      return 1 - Math.pow(1 - base, delta / 16.67);
    };

    var snapIfClose = function (current, target) {
      return Math.abs(target - current) < SNAP_EPSILON ? target : current;
    };

    var shouldSkipRequest = function () {
      if (!hasRenderedAssembly || !hasRenderedUi) {
        return false;
      }

      if (animationFrameId) {
        return false;
      }

      var assemblySettled =
        Math.abs(targetAssemblyProgress - currentAssemblyProgress) < SNAP_EPSILON;

      var uiSettled =
        Math.abs(targetUiOut - currentUiOut) < SNAP_EPSILON;

      if (!assemblySettled || !uiSettled) {
        return false;
      }

      var assemblyChangedEnough =
        Math.abs(targetAssemblyProgress - lastRenderedAssemblyProgress) >= RENDER_EPSILON;

      var uiChangedEnough =
        Math.abs(targetUiOut - lastRenderedUiOut) >= RENDER_EPSILON;

      return !assemblyChangedEnough && !uiChangedEnough;
    };

    var renderFrame = function (timestamp) {
      var shouldForceAssembly = forceAssemblyRender || !hasRenderedAssembly;
      var shouldForceUi = forceUiRender || !hasRenderedUi;

      animationFrameId = 0;

      if (document.hidden) {
        lastFrameTime = 0;
        return;
      }

      updateTargets();

      /*
        레퍼런스 느낌을 살리기 위해 데스크톱에서는 거의 매 프레임 렌더.
        모바일/저사양에서만 frameInterval 제한을 적용한다.
      */
      if (
        metrics.lowPower &&
        !shouldForceAssembly &&
        !shouldForceUi &&
        lastRenderTime &&
        timestamp - lastRenderTime < metrics.frameInterval
      ) {
        animationFrameId = window.requestAnimationFrame(renderFrame);
        return;
      }

      lastRenderTime = timestamp;

      if (shouldForceAssembly) {
        currentAssemblyProgress = targetAssemblyProgress;
      }

      if (shouldForceUi) {
        currentUiOut = targetUiOut;
      }

      if (!shouldForceAssembly || !shouldForceUi) {
        var smoothing = getFrameSmoothing(timestamp);

        if (!shouldForceAssembly) {
          currentAssemblyProgress +=
            (targetAssemblyProgress - currentAssemblyProgress) * smoothing;
        }

        if (!shouldForceUi) {
          currentUiOut +=
            (targetUiOut - currentUiOut) * smoothing;
        }
      } else {
        lastFrameTime = timestamp;
      }

      currentAssemblyProgress = snapIfClose(
        currentAssemblyProgress,
        targetAssemblyProgress
      );

      currentUiOut = snapIfClose(currentUiOut, targetUiOut);

      var assemblyDelta =
        Math.abs(currentAssemblyProgress - lastRenderedAssemblyProgress);

      var uiDelta =
        Math.abs(currentUiOut - lastRenderedUiOut);

      var needsAssemblyRender =
        shouldForceAssembly ||
        assemblyDelta >= RENDER_EPSILON ||
        (
          isBoundary(currentAssemblyProgress) &&
          currentAssemblyProgress !== lastRenderedAssemblyProgress
        );

      var needsUiRender =
        shouldForceUi ||
        uiDelta >= RENDER_EPSILON ||
        (
          isBoundary(currentUiOut) &&
          currentUiOut !== lastRenderedUiOut
        );

      if (needsAssemblyRender) {
        renderAssembly(currentAssemblyProgress, shouldForceAssembly);
        lastRenderedAssemblyProgress = currentAssemblyProgress;
        hasRenderedAssembly = true;
      }

      if (needsUiRender) {
        renderScrollUi(currentUiOut, shouldForceUi);
        lastRenderedUiOut = currentUiOut;
        hasRenderedUi = true;
      }

      forceAssemblyRender = false;
      forceUiRender = false;

      var needsNextFrame =
        Math.abs(targetAssemblyProgress - currentAssemblyProgress) >= SNAP_EPSILON ||
        Math.abs(targetUiOut - currentUiOut) >= SNAP_EPSILON;

      if (needsNextFrame) {
        animationFrameId = window.requestAnimationFrame(renderFrame);
      } else {
        lastFrameTime = 0;
        setAnimationLayersActive(false);
      }
    };

    var requestRender = function (force) {
      updateTargets();

      if (force) {
        forceAssemblyRender = true;
        forceUiRender = true;
        lastRenderTime = 0;
      } else if (shouldSkipRequest()) {
        return;
      }

      if (animationFrameId) {
        return;
      }

      setAnimationLayersActive(true);
      animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    var handleScroll = function () {
      var scrollTop = getScrollTop();

      updateWheelListenerState(scrollTop);

      if (!wheelControlActive) {
        wheelCurrentScrollTop = scrollTop;
        wheelTargetScrollTop = scrollTop;
      }

      if (!isHeroNearViewport(scrollTop) && hasRenderedAssembly && hasRenderedUi) {
        return;
      }

      requestRender(false);
    };

    var handleResize = function () {
      if (resizeFrameId) {
        return;
      }

      resizeFrameId = window.requestAnimationFrame(function () {
        resizeFrameId = 0;
        lastRenderTime = 0;

        updateMetrics();

        if (introPlaying) {
          syncWheelStateToCurrentScroll();
          requestRender(true);
          return;
        }

        updateWheelListenerState();
        requestRender(true);
      });
    };

    var handleVisibilityChange = function () {
      if (document.hidden) {
        if (animationFrameId) {
          window.cancelAnimationFrame(animationFrameId);
          animationFrameId = 0;
        }

        if (wheelFrameId) {
          window.cancelAnimationFrame(wheelFrameId);
          wheelFrameId = 0;
        }

        if (introFrameId) {
          window.cancelAnimationFrame(introFrameId);
          introFrameId = 0;
        }

        if (introStartTimerId) {
          window.clearTimeout(introStartTimerId);
          introStartTimerId = 0;
        }

        lastFrameTime = 0;
        endWheelControl();
        return;
      }

      updateMetrics();

      if (introPlaying) {
        introStartTime = window.performance && window.performance.now
          ? window.performance.now() - introLastRawProgress * INTRO_DURATION
          : null;

        if (!introFrameId) {
          introFrameId = window.requestAnimationFrame(playIntroFrame);
        }

        requestRender(true);
        return;
      }

      requestRender(true);
    };

    updateMetrics();
    updateWheelListenerState();
    setActionsActive(false);

    resetRestoredHeroScroll();

    updateMetrics();
    syncWheelStateToCurrentScroll();
    updateTargets();

    currentAssemblyProgress = targetAssemblyProgress;
    currentUiOut = targetUiOut;

    requestRender(true);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("load", handleResize, { once: true });
    window.addEventListener("wheel", preventIntroScroll, { passive: false });
    window.addEventListener("touchmove", preventIntroScroll, { passive: false });

    document.addEventListener("keydown", preventIntroKeyScroll);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (shouldRunIntroOnLoad()) {
      startIntro();
    }

    window.setTimeout(function () {
      updateMetrics();

      if (introPlaying) {
        syncWheelStateToCurrentScroll();
        requestRender(true);
        return;
      }

      if (resetRestoredHeroScroll()) {
        updateMetrics();
      }

      syncWheelStateToCurrentScroll();
      updateWheelListenerState();
      requestRender(true);
    }, 80);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize, {
        passive: true
      });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready
        .then(handleResize)
        .catch(function () {});
    }

    if (reducedMotionQuery && reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener("change", handleResize);
    } else if (reducedMotionQuery && reducedMotionQuery.addListener) {
      reducedMotionQuery.addListener(handleResize);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.initLogoScrollHero, {
      once: true
    });
  } else {
    window.initLogoScrollHero();
  }
})();