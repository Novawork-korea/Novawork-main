(() => {
  "use strict";

  const root = document.documentElement;
  if (root.dataset.nwRevealController === "v43") return;
  root.dataset.nwRevealController = "v43";

  const isIndexLoaderPage = document.body && (document.body.classList.contains("home") || document.querySelector(".nw-logo-scroll"));
  const routeEntering = root.classList.contains("nw-route-entering") || window.__NW_ROUTE_ENTERING === true;

  if (!isIndexLoaderPage) {
    root.classList.remove("site-is-loading", "site-is-revealing");
    root.classList.add("site-is-ready", "site-reveal-done");
    const staleLoader = document.querySelector(".site-loader");
    if (staleLoader) staleLoader.setAttribute("hidden", "");
    return;
  }

  const MIN_LOADER_MS = 900;
  const REVEAL_DURATION_MS = 520;
  const HARD_FALLBACK_MS = 3000;
  let revealStarted = false;
  let introDispatched = false;
  let fallbackTimer = null;

  const dispatchIntro = () => {
    if (introDispatched) return;
    introDispatched = true;
    window.__NW_REVEAL_DONE = true;
    try { document.dispatchEvent(new CustomEvent("novawork:logo-intro-start", { detail: { source: "site-reveal-v43" } })); } catch (error) {}
    try { window.dispatchEvent(new CustomEvent("novawork:logo-intro-start", { detail: { source: "site-reveal-v43" } })); } catch (error) {}
  };

  const loader = () => document.querySelector(".site-loader");
  const clearFailsafe = () => {
    if (window.__NW_REVEAL_FAILSAFE) { window.clearTimeout(window.__NW_REVEAL_FAILSAFE); window.__NW_REVEAL_FAILSAFE = null; }
    if (fallbackTimer) { window.clearTimeout(fallbackTimer); fallbackTimer = null; }
  };

  const decodeImportantImages = () => {
    Array.prototype.forEach.call(document.images || [], (img) => {
      if (!img || !img.src || typeof img.decode !== "function") return;
      if (img.closest(".site-loader") || img.closest(".nw-logo-scroll") || img.loading === "eager" || img.getAttribute("fetchpriority") === "high") {
        img.decode().catch(() => {});
      }
    });
  };

  let heroInitRequested = false;
  const prewarmHero = () => {
    if (heroInitRequested) return;
    heroInitRequested = true;
    try { if (typeof window.initLogoScrollHero === "function") window.initLogoScrollHero(); } catch (error) {}
  };

  const prewarm = () => {
    decodeImportantImages();
    prewarmHero();
  };

  const finish = () => {
    root.classList.remove("site-is-revealing");
    root.classList.add("site-reveal-done");
    const currentLoader = loader();
    if (currentLoader) currentLoader.setAttribute("hidden", "");
    root.style.removeProperty("overflow");
    if (document.body) document.body.style.removeProperty("overflow");
  };

  if (routeEntering) {
    clearFailsafe();
    root.classList.remove("site-is-loading", "site-is-revealing");
    root.classList.add("site-is-ready", "site-reveal-done");
    const currentLoader = loader();
    if (currentLoader) currentLoader.setAttribute("hidden", "");
    prewarm();
    const routeDone = () => dispatchIntro();
    document.addEventListener("novawork:route-enter-done", routeDone, { once: true });
    window.addEventListener("novawork:route-enter-done", routeDone, { once: true });
    fallbackTimer = window.setTimeout(routeDone, 2400);
    return;
  }

  const startReveal = () => {
    if (revealStarted) return;
    revealStarted = true;
    clearFailsafe();
    root.classList.add("site-is-loading");
    root.classList.remove("site-is-ready", "site-is-revealing", "site-reveal-done");
    prewarm();

    window.setTimeout(() => {
      root.classList.add("site-is-revealing");
      void root.offsetHeight;
      if (document.body) void document.body.offsetHeight;
      window.requestAnimationFrame(() => {
        root.classList.add("site-is-ready");
        root.classList.remove("site-is-loading");
        dispatchIntro();
        window.setTimeout(finish, REVEAL_DURATION_MS + 180);
      });
    }, MIN_LOADER_MS);
  };

  const forceRelease = () => {
    if (revealStarted) return;
    revealStarted = true;
    root.classList.add("site-is-ready", "site-reveal-done");
    root.classList.remove("site-is-loading", "site-is-revealing");
    const currentLoader = loader();
    if (currentLoader) currentLoader.setAttribute("hidden", "");
    dispatchIntro();
  };

  root.classList.add("site-is-loading");
  root.classList.remove("site-is-ready", "site-is-revealing", "site-reveal-done");
  prewarm();

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startReveal, { once: true });
  else startReveal();

  window.addEventListener("load", prewarm, { once: true });
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    clearFailsafe();
    root.classList.remove("site-is-loading", "site-is-revealing");
    root.classList.add("site-is-ready", "site-reveal-done");
    const currentLoader = loader();
    if (currentLoader) currentLoader.setAttribute("hidden", "");
    dispatchIntro();
  });

  fallbackTimer = window.setTimeout(forceRelease, HARD_FALLBACK_MS);
})();
