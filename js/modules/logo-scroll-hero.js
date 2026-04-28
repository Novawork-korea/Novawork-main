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
    var isTicking = false;
    var forceRender = false;
    var lastAssemblyProgress = -1;
    var lastRawProgress = -1;

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

      /*
        데스크톱 비율 기준:
        사용자가 올린 1900x911 화면에서 로고 SVG 폭은 약 655px 수준입니다.
        그래서 PC에서는 단순히 "안 잘리게 축소"하지 않고,
        화면 폭 34.5% / 화면 높이 72% / 실제 남은 세로 공간을 함께 보며
        같은 구도 비율을 유지합니다. 모바일 분기는 기존 값을 유지합니다.
      */
      if (stageWidth > 780) {
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
        verticalSafe = stageWidth <= 560 ? 52 : 58;
        belowReserve = stageWidth <= 560 ? 166 : 154;
        fitByWidth = Math.max(220, stageWidth - horizontalSafe);
        fitByHeight = Math.max(220, (stageHeight - verticalSafe - belowReserve) * aspect);
        maxWidth = stageWidth <= 560 ? 520 : 650;
        minWidth = stageWidth <= 560 ? 280 : 420;
        targetWidth = Math.min(fitByWidth, fitByHeight, maxWidth);
        targetWidth = clamp(targetWidth, Math.min(minWidth, fitByWidth, maxWidth), Math.min(fitByWidth, maxWidth));
      }

      logoLockup.style.setProperty("--nw-lockup-width", targetWidth.toFixed(2) + "px");
      logoLockup.style.setProperty("--nw-hero-fit-scale", "1");
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
      metrics.nextSectionTop = nextSection ? nextSection.offsetTop || 0 : metrics.sectionTop + metrics.sectionHeight;

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
        lastTransform: ""
      };
    });

    /*
      로고 조립 완료 지점.
      0.65 지점에서 완성되게 맞춰서, 너무 즉시 끝나지 않으면서도
      한 번의 스크롤 안에서 조립 흐름이 확실히 보이도록 조정했습니다.
    */
    var COMPLETE_AT = 0.65;

    var getRawScrollProgress = function () {
      var scrollTop = getScrollTop();
      return clamp((scrollTop - metrics.sectionTop + metrics.headerOffset) / metrics.maxScroll);
    };

    var animatePiece = function (state, progress) {
      var local = clamp((progress - state.start) / Math.max(0.001, state.end - state.start));
      var eased = easeOutCubic(local);
      var remain = 1 - eased;
      var currentX = state.x * remain;
      var currentY = state.y * remain;
      var currentR = state.r * remain;
      var currentScale = state.s + (1 - state.s) * eased;
      var opacity = local <= 0 ? 0 : smoothstep(local);
      var opacityValue = opacity.toFixed(3);
      var transformValue =
        "translate(" + currentX.toFixed(2) + " " + currentY.toFixed(2) + ") " +
        "translate(" + state.cx.toFixed(2) + " " + state.cy.toFixed(2) + ") " +
        "rotate(" + currentR.toFixed(2) + ") " +
        "scale(" + currentScale.toFixed(4) + ") " +
        "translate(" + (-state.cx).toFixed(2) + " " + (-state.cy).toFixed(2) + ")";

      if (state.lastOpacity !== opacityValue) {
        state.element.style.opacity = opacityValue;
        state.lastOpacity = opacityValue;
      }

      if (state.lastTransform !== transformValue) {
        state.element.setAttribute("transform", transformValue);
        state.lastTransform = transformValue;
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

    var render = function (assemblyProgress, rawProgress) {
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
        aura.style.transform = "translate(-50%, -54%) scale(" + (0.94 + assemblyProgress * 0.08).toFixed(3) + ")";
      }

      if (progressBar) {
        progressBar.style.transform = "scaleX(" + assemblyProgress.toFixed(4) + ")";
      }

      if (progressText) {
        progressText.textContent = String(Math.round(assemblyProgress * 100)).padStart(2, "0") + "%";
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

    var requestRender = function (force) {
      forceRender = forceRender || Boolean(force);

      if (isTicking) {
        return;
      }

      isTicking = true;

      window.requestAnimationFrame(function () {
        var rawProgress;
        var assemblyProgress;

        isTicking = false;
        rawProgress = getRawScrollProgress();
        assemblyProgress = clamp(rawProgress / COMPLETE_AT);

        if (!forceRender && Math.abs(assemblyProgress - lastAssemblyProgress) < 0.001 && Math.abs(rawProgress - lastRawProgress) < 0.001) {
          return;
        }

        render(assemblyProgress, rawProgress);
        lastAssemblyProgress = assemblyProgress;
        lastRawProgress = rawProgress;
        forceRender = false;
      });
    };

    var handleResize = function () {
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
