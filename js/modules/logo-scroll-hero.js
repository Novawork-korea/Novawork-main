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

    var stageCopy = document.querySelector(".nw-stage-copy");
    var brandCopy = document.querySelector(".nw-brand-copy");
    var heroActions = document.querySelector(".nw-hero-actions");
    var logoLockup = document.querySelector(".nw-logo-lockup");
    var heroActionLinks = heroActions ? Array.prototype.slice.call(heroActions.querySelectorAll("a")) : [];
    var progressBar = document.querySelector(".nw-progress__bar");
    var progressText = document.querySelector(".nw-progress__text");
    var aura = document.querySelector(".nw-logo-aura");
    var scrollHint = document.querySelector(".nw-scroll-hint");
    var progressWrap = document.querySelector(".nw-progress");
    var nextSection = section.nextElementSibling;


    var actionsAreActive = false;
    var animationFrameId = 0;
    var forceRender = false;

    var targetAssemblyProgress = 0;
    var targetRawProgress = 0;
    var currentAssemblyProgress = 0;
    var currentRawProgress = 0;

    var lastRenderedAssemblyProgress = -1;
    var lastRenderedRawProgress = -1;
    var hasRendered = false;
    var lastFrameTime = 0;
    var lastProgressPercent = -1;
    var lastRenderTime = 0;

    var metrics = {
      width: window.innerWidth || 1,
      height: window.innerHeight || 1,
      headerOffset: 0,
      stageHeight: 1,
      sectionTop: 0,
      sectionHeight: 1,
      maxScroll: 1,
      nextSectionTop: 0
    };

    var clamp = function (value, min, max) {
      var lower = typeof min === "number" ? min : 0;
      var upper = typeof max === "number" ? max : 1;

      return Math.min(upper, Math.max(lower, value));
    };

    var easeOutCubic = function (t) {
      return 1 - Math.pow(1 - t, 3);
    };

    var smoothstep = function (t) {
      return t * t * (3 - 2 * t);
    };

    var getHeaderOffset = function () {
      var header = document.querySelector(".header");

      if (!header) {
        return 0;
      }

      return header.getBoundingClientRect().height || 0;
    };

    var getViewportSize = function () {
      var visualViewport = window.visualViewport;

      return {
        width: visualViewport && visualViewport.width ? visualViewport.width : window.innerWidth,
        height: visualViewport && visualViewport.height ? visualViewport.height : window.innerHeight
      };
    };

    var getScrollTop = function () {
      return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    };

    var getTranslateY = function (element) {
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

    var updateLockupBalance = function () {
      if (!logoLockup || !heroActions) {
        return;
      }

      var stage = document.querySelector(".nw-sticky-stage");
      var logoSvg = logoLockup.querySelector(".nw-logo-svg");

      if (!stage || !logoSvg) {
        return;
      }

      logoLockup.style.setProperty("--nw-balance-y", "0px");

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

      logoLockup.style.setProperty("--nw-balance-y", balanceY.toFixed(2) + "px");
    };

    var jumpToTopWithoutSmoothScroll = function () {
      var html = document.documentElement;
      var previousBehavior = html.style.scrollBehavior;

      html.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      html.style.scrollBehavior = previousBehavior;
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

    var updateResponsiveFit = function () {
      if (!logoLockup) {
        return;
      }

      var viewport = getViewportSize();
      var headerOffset = getHeaderOffset();
      var stageWidth = Math.max(1, viewport.width);
      var stageHeight = Math.max(1, viewport.height - headerOffset);
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
        fitByWidth = Math.max(190, Math.min(stageWidth - horizontalSafe, stageWidth * 0.52));
        fitByHeight = Math.max(180, (stageHeight - verticalSafe - belowReserve) * aspect);
        maxWidth = 320;
        minWidth = 190;
        targetWidth = Math.min(fitByWidth, fitByHeight, maxWidth);

        targetWidth = clamp(
          targetWidth,
          Math.min(minWidth, fitByWidth, maxWidth),
          Math.min(fitByWidth, maxWidth)
        );
      } else if (stageWidth > 780) {
        belowReserve = stageHeight <= 640 ? 96 : stageHeight <= 760 ? 118 : 132;
        fitByWidth = stageWidth * 0.345;
        fitByHeight = viewport.height * 0.72;
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
        fitByHeight = Math.max(200, (stageHeight - verticalSafe - belowReserve) * aspect);
        maxWidth = stageWidth <= 560 ? 520 : 650;
        targetWidth = Math.min(fitByWidth, fitByHeight, maxWidth);

        targetWidth = clamp(
          targetWidth,
          Math.min(minWidth, fitByWidth, maxWidth),
          Math.min(fitByWidth, maxWidth)
        );
      }

      logoLockup.style.setProperty("--nw-lockup-width", targetWidth.toFixed(2) + "px");
      logoLockup.style.setProperty("--nw-hero-fit-scale", "1");

      updateLockupBalance();
    };

    var updateMetrics = function () {
      var viewport = getViewportSize();

      metrics.width = Math.max(1, viewport.width);
      metrics.height = Math.max(1, viewport.height);
      metrics.headerOffset = getHeaderOffset();
      metrics.stageHeight = Math.max(1, metrics.height - metrics.headerOffset);
      metrics.sectionTop = section.offsetTop || 0;
      metrics.sectionHeight = section.offsetHeight || 1;
      metrics.maxScroll = Math.max(1, metrics.sectionHeight - metrics.stageHeight);
      metrics.nextSectionTop = nextSection
        ? nextSection.offsetTop || 0
        : metrics.sectionTop + metrics.sectionHeight;

      updateResponsiveFit();
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

    var COMPLETE_AT = 0.65;

    var SMOOTH_FACTOR = 0.12;
    var SNAP_EPSILON = 0.003;
    var RENDER_EPSILON = 0.002;
    var FRAME_INTERVAL = 22;

    var getRawScrollProgress = function () {
      var scrollTop = getScrollTop();

      return clamp((scrollTop - metrics.sectionTop + metrics.headerOffset) / metrics.maxScroll);
    };

    var animatePiece = function (state, progress) {
      var duration = Math.max(0.001, state.end - state.start);
      var rawLocal = (progress - state.start) / duration;
      var lockState = "";

      if (rawLocal <= 0) {
        if (state.lockState === "before") {
          return;
        }

        rawLocal = 0;
        lockState = "before";
      } else if (rawLocal >= 1) {
        if (state.lockState === "after") {
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

      if (state.lastOpacity !== opacityValue) {
        state.element.style.opacity = opacityValue;
        state.lastOpacity = opacityValue;
      }

      if (state.lastTransform !== transformValue) {
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

      element.style.opacity = amount.toFixed(3);
      element.style.transform = "translateY(" + ((1 - amount) * move).toFixed(2) + "px)";
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

    var render = function (assemblyProgress) {
      pieceStates.forEach(function (state) {
        animatePiece(state, assemblyProgress);
      });

      if (stageCopy) {
        var introOut = smoothstep(clamp((assemblyProgress - 0.06) / 0.2));
        stageCopy.style.opacity = (1 - introOut).toFixed(3);
        stageCopy.style.transform = "translateY(" + (-18 * introOut).toFixed(2) + "px)";
      }

      var copyIn = smoothstep(clamp((assemblyProgress - 0.78) / 0.22));

      revealElement(brandCopy, copyIn, 18);
      revealElement(heroActions, copyIn, 18);
      setActionsActive(copyIn > 0.75);

      if (aura) {
        aura.style.opacity = (0.18 + assemblyProgress * 0.28).toFixed(3);
        aura.style.transform =
          "translate(-50%, -54%) scale(" + (0.94 + assemblyProgress * 0.08).toFixed(3) + ")";
      }

      if (progressBar) {
        progressBar.style.transform = "scaleX(" + assemblyProgress.toFixed(3) + ")";
      }

      if (progressText) {
        var progressPercent = Math.round(assemblyProgress * 100);

        if (progressPercent !== lastProgressPercent) {
          progressText.textContent = String(progressPercent).padStart(2, "0") + "%";
          lastProgressPercent = progressPercent;
        }
      }

      var nextTop = metrics.nextSectionTop - getScrollTop();
      var fadeStart = metrics.height * 0.92;
      var fadeEnd = metrics.height * 0.72;
      var uiOut = smoothstep(clamp((fadeStart - nextTop) / Math.max(1, fadeStart - fadeEnd)));
      var uiOpacity = 1 - uiOut;
      var uiMove = 10 * uiOut;

      if (scrollHint) {
        scrollHint.style.opacity = uiOpacity.toFixed(3);
        scrollHint.style.transform = "translateY(" + uiMove.toFixed(2) + "px)";
      }

      if (progressWrap) {
        progressWrap.style.opacity = uiOpacity.toFixed(3);
        progressWrap.style.transform = "translateY(" + uiMove.toFixed(2) + "px)";
      }
    };

    var updateTargets = function () {
      targetRawProgress = getRawScrollProgress();
      targetAssemblyProgress = clamp(targetRawProgress / COMPLETE_AT);
    };

    var getFrameSmoothing = function (timestamp) {
      lastFrameTime = timestamp;
      return SMOOTH_FACTOR;
    };

    var renderFrame = function (timestamp) {
      var shouldForce = forceRender || !hasRendered;
      var smoothing;
      var diffAssembly;
      var diffRaw;
      var needsNextFrame;

      animationFrameId = 0;
      updateTargets();

      if (!shouldForce && lastRenderTime && timestamp - lastRenderTime < FRAME_INTERVAL) {
        animationFrameId = window.requestAnimationFrame(renderFrame);
        return;
      }

      lastRenderTime = timestamp;

      if (shouldForce) {
        currentAssemblyProgress = targetAssemblyProgress;
        currentRawProgress = targetRawProgress;
        lastFrameTime = timestamp;
      } else {
        smoothing = getFrameSmoothing(timestamp);
        currentAssemblyProgress += (targetAssemblyProgress - currentAssemblyProgress) * smoothing;
        currentRawProgress += (targetRawProgress - currentRawProgress) * smoothing;
      }

      diffAssembly = Math.abs(targetAssemblyProgress - currentAssemblyProgress);
      diffRaw = Math.abs(targetRawProgress - currentRawProgress);

      if (diffAssembly < SNAP_EPSILON) {
        currentAssemblyProgress = targetAssemblyProgress;
      }

      if (diffRaw < SNAP_EPSILON) {
        currentRawProgress = targetRawProgress;
      }

      if (
        shouldForce ||
        Math.abs(currentAssemblyProgress - lastRenderedAssemblyProgress) >= RENDER_EPSILON ||
        Math.abs(currentRawProgress - lastRenderedRawProgress) >= RENDER_EPSILON
      ) {
        render(currentAssemblyProgress);
        lastRenderedAssemblyProgress = currentAssemblyProgress;
        lastRenderedRawProgress = currentRawProgress;
      }

      hasRendered = true;
      forceRender = false;

      needsNextFrame =
        Math.abs(targetAssemblyProgress - currentAssemblyProgress) >= SNAP_EPSILON ||
        Math.abs(targetRawProgress - currentRawProgress) >= SNAP_EPSILON;

      if (needsNextFrame) {
        animationFrameId = window.requestAnimationFrame(renderFrame);
      } else {
        lastFrameTime = 0;
      }
    };

    var requestRender = function (force) {
      forceRender = forceRender || Boolean(force);
      updateTargets();

      if (animationFrameId) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    var handleResize = function () {
      lastRenderTime = 0;
      updateMetrics();
      requestRender(true);
    };

    updateMetrics();
    setActionsActive(false);
    resetRestoredHeroScroll();
    updateMetrics();
    requestRender(true);

    window.setTimeout(function () {
      updateMetrics();

      if (resetRestoredHeroScroll()) {
        updateMetrics();
      }

      requestRender(true);
    }, 80);

    window.addEventListener("scroll", function () {
      requestRender(false);
    }, { passive: true });

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("load", handleResize, { once: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize, { passive: true });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(handleResize).catch(function () {});
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.initLogoScrollHero, { once: true });
  } else {
    window.initLogoScrollHero();
  }
})();