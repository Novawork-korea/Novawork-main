/* ==================== EnhanceV7: force-enabled PC smooth scroll ==================== */
(() => {
  "use strict";

  const root = document.documentElement;

  /*
   * V7 deliberately keeps PC smooth scrolling independent from prefers-reduced-motion.
   * Native form/menu/overflow safety gates remain intact.
   */
  root.dataset.nwSmoothWheel = "EnhanceV5";
  root.dataset.nwSmoothWheelV6 = "superseded-v7";

  if (root.dataset.nwInteractionV7 === "ready") return;
  root.dataset.nwInteractionV6 = "patched-by-v7";
  root.dataset.nwInteractionV7 = "ready";
  window.__NW_INTERACTION_PATCH = "EnhanceV7";

  const raf = window.requestAnimationFrame || ((fn) => window.setTimeout(fn, 16));
  const caf = window.cancelAnimationFrame || window.clearTimeout;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const ready = (fn) => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  };

  const initDesktopSmoothScrollV7 = () => {
    if (root.dataset.nwSmoothWheelV7 === "ready") return;
    root.dataset.nwSmoothWheelV7 = "ready";

    if (!window.requestAnimationFrame) {
      root.dataset.nwSmoothWheelV7 = "no-raf";
      return;
    }

    const finePointerQuery = window.matchMedia ? window.matchMedia("(hover: hover) and (pointer: fine)") : null;
    const desktopQuery = window.matchMedia ? window.matchMedia("(min-width: 769px)") : null;
    const isFinePointer = () => !finePointerQuery || finePointerQuery.matches;
    const isDesktop = () => !desktopQuery || desktopQuery.matches;
    const enabled = () => isDesktop() && isFinePointer();
    const scroller = () => document.scrollingElement || document.documentElement;
    const currentY = () => window.pageYOffset || scroller().scrollTop || document.documentElement.scrollTop || 0;
    const maxScroll = () => Math.max(0, scroller().scrollHeight - window.innerHeight);

    const blockedSelector = [
      "input",
      "textarea",
      "select",
      "option",
      "button",
      "iframe",
      "summary",
      "details",
      ".modal",
      ".mobile-menu",
      ".mobile-menu-panel",
      ".contact-form",
      ".inquiry-form",
      ".pricing-table-wrap",
      ".service-pricing-table",
      "[contenteditable]",
      "[role='textbox']",
      "[data-native-scroll]",
      "[data-scroll-native]"
    ].join(",");

    const isBlockedTarget = (target) => Boolean(target && target.closest && target.closest(blockedSelector));

    const hasScrollableAncestor = (target, deltaY) => {
      let el = target instanceof Element ? target : null;
      while (el && el !== document.body && el !== document.documentElement) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY || style.overflow || "";
        const canScrollY = /(auto|scroll|overlay)/i.test(overflowY) && el.scrollHeight > el.clientHeight + 2;
        if (canScrollY) {
          const atTop = el.scrollTop <= 1;
          const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
          if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) return true;
        }
        el = el.parentElement;
      }
      return false;
    };

    const normalizeWheel = (event) => {
      const unit = event.deltaMode === 1 ? 48 : event.deltaMode === 2 ? window.innerHeight * 0.86 : 1;
      return event.deltaY * unit;
    };

    const isSuppressed = () => !enabled() ||
      document.body.classList.contains("menu-open") ||
      document.body.classList.contains("nw-intro-lock") ||
      root.classList.contains("menu-open") ||
      root.classList.contains("nw-intro-lock") ||
      root.classList.contains("nw-route-transitioning") ||
      root.classList.contains("nw-route-entering") ||
      root.classList.contains("nw-route-leaving");

    let current = currentY();
    let target = current;
    let frame = 0;
    let active = false;
    let programmatic = false;
    let lastInputAt = 0;
    let savedRootBehavior = "";
    let savedBodyBehavior = "";
    let behaviorLocked = false;

    const lockScrollBehavior = () => {
      if (behaviorLocked) return;
      behaviorLocked = true;
      savedRootBehavior = root.style.scrollBehavior || "";
      savedBodyBehavior = document.body.style.scrollBehavior || "";
      root.style.scrollBehavior = "auto";
      document.body.style.scrollBehavior = "auto";
      root.classList.add("nw-smooth-wheel-v7-ready");
    };

    const unlockScrollBehavior = () => {
      if (!behaviorLocked) return;
      behaviorLocked = false;
      root.style.scrollBehavior = savedRootBehavior;
      document.body.style.scrollBehavior = savedBodyBehavior;
      savedRootBehavior = "";
      savedBodyBehavior = "";
      root.classList.remove("nw-smooth-wheel-v7-active");
    };

    const applyScroll = (value) => {
      programmatic = true;
      window.scrollTo(0, Math.round(value));
      programmatic = false;
    };

    const stop = () => {
      if (frame) caf(frame);
      frame = 0;
      active = false;
      current = target = currentY();
      unlockScrollBehavior();
    };

    const step = () => {
      if (isSuppressed()) {
        stop();
        return;
      }

      const limit = maxScroll();
      target = clamp(target, 0, limit);
      const distance = target - current;
      const absDistance = Math.abs(distance);

      if (absDistance < 0.55) {
        current = target;
        applyScroll(current);
        frame = 0;
        active = false;
        window.setTimeout(unlockScrollBehavior, 80);
        return;
      }

      const elapsed = (window.performance && window.performance.now ? window.performance.now() : Date.now()) - lastInputAt;
      const burst = elapsed < 180;
      const ease = absDistance > 1100 ? 0.18 : burst ? 0.205 : 0.155;
      current += distance * ease;
      applyScroll(current);
      frame = raf(step);
    };

    const onWheel = (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || isSuppressed()) return;
      if (Math.abs(event.deltaX || 0) > Math.abs(event.deltaY || 0) * 0.72) return;

      const targetEl = event.target instanceof Element ? event.target : null;
      if (!targetEl || isBlockedTarget(targetEl)) return;

      const deltaY = normalizeWheel(event);
      if (!Number.isFinite(deltaY) || Math.abs(deltaY) < 1.2) return;
      if (hasScrollableAncestor(targetEl, deltaY)) return;

      const y = currentY();
      const limit = maxScroll();
      if ((deltaY < 0 && y <= 0 && target <= 0) || (deltaY > 0 && y >= limit - 1 && target >= limit - 1)) return;

      event.preventDefault();
      const now = window.performance && window.performance.now ? window.performance.now() : Date.now();
      const continuing = active && now - lastInputAt < 320;
      lastInputAt = now;
      lockScrollBehavior();
      root.classList.add("nw-smooth-wheel-v7-active");

      const absRaw = Math.abs(event.deltaY || 0);
      const trackpadLike = event.deltaMode === 0 && absRaw < 80;
      const impulseScale = trackpadLike ? 1.04 : 1.26;
      const impulseLimit = trackpadLike ? 700 : 1320;
      current = continuing ? current : y;
      const base = continuing ? target : y;
      target = clamp(base + clamp(deltaY * impulseScale, -impulseLimit, impulseLimit), 0, limit);
      active = true;
      if (!frame) frame = raf(step);
    };

    root.classList.add("nw-smooth-wheel-v7-ready");
    document.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("scroll", () => {
      if (programmatic || active || frame) return;
      current = target = currentY();
    }, { passive: true });
    ["keydown", "resize", "pageshow", "pagehide", "blur", "touchstart"].forEach((type) => {
      window.addEventListener(type, stop, { passive: true });
    });
    window.addEventListener("mousedown", (event) => {
      if (event.button === 1) stop();
    }, { passive: true });
    if (finePointerQuery && typeof finePointerQuery.addEventListener === "function") finePointerQuery.addEventListener("change", stop);
    if (desktopQuery && typeof desktopQuery.addEventListener === "function") desktopQuery.addEventListener("change", stop);
  };

ready(() => {
    initDesktopSmoothScrollV7();
  });
})();


