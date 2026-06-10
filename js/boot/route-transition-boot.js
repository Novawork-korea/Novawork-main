(function () {
  "use strict";
  var VERSION = "v54-enhance-v10";
  var KEY = "novawork:route-transition";
  var root = document.documentElement;
  var leaving = false;
  var entering = false;
  var enterFinished = false;
  var enterTimer = 0;
  var coverTimer = 0;
  var reduceMotion = false;
  try { reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (error) {}

  var COVER_MS = reduceMotion ? 660 : 1640;
  var REVEAL_MS = reduceMotion ? 760 : 1780;
  var CONTENT_MS = reduceMotion ? 580 : 1120;
  var EASE_COVER = "cubic-bezier(0.76, 0, 0.24, 1)";

  function storageGet() {
    try { return window.sessionStorage ? window.sessionStorage.getItem(KEY) : null; } catch (error) { return null; }
  }
  function storageSet(value) {
    try { if (window.sessionStorage) window.sessionStorage.setItem(KEY, value); } catch (error) {}
  }
  function storageRemove() {
    try { if (window.sessionStorage) window.sessionStorage.removeItem(KEY); } catch (error) {}
  }
  function now() {
    return Date.now ? Date.now() : new Date().getTime();
  }
  function getFreshEntry() {
    var raw = storageGet();
    if (!raw) return null;
    try {
      var data = JSON.parse(raw);
      if (!data || !data.t || now() - Number(data.t) > 45000) {
        storageRemove();
        return null;
      }
      return data;
    } catch (error) {
      storageRemove();
      return null;
    }
  }

  if (getFreshEntry()) {
    window.__NW_ROUTE_ENTERING = true;
    root.classList.add("nw-route-transitioning", "nw-route-entering");
    root.classList.remove("nw-route-leaving", "nw-route-ready");
  }

  function sameDocumentHashOnly(url) {
    return url.protocol === window.location.protocol &&
      url.host === window.location.host &&
      url.pathname === window.location.pathname &&
      url.search === window.location.search &&
      !!url.hash;
  }
  function isInternalUrl(url) {
    var loc = window.location;
    if (url.protocol === "file:" && loc.protocol === "file:") return true;
    if (url.origin && loc.origin && url.origin !== "null" && loc.origin !== "null") return url.origin === loc.origin;
    return url.protocol === loc.protocol && url.host === loc.host;
  }
  function isHtmlRoute(url) {
    var path = url.pathname || "/";
    return path === "/" || /(?:\.html|\/)$/i.test(path);
  }
  function getTransitionUrl(link, event) {
    if (!link || leaving) return null;
    if (event) {
      if (event.defaultPrevented) return null;
      if (typeof event.button === "number" && event.button !== 0) return null;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
    }
    if (link.hasAttribute("download") || link.closest("[data-no-transition]")) return null;
    var target = (link.getAttribute("target") || "").toLowerCase();
    if (target && target !== "_self") return null;
    var href = link.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#") return null;
    if (/^(tel:|mailto:|sms:|javascript:|data:|blob:)/i.test(href)) return null;
    var url;
    try { url = new URL(href, window.location.href); } catch (error) { return null; }
    if (!isInternalUrl(url)) return null;
    if (sameDocumentHashOnly(url)) return null;
    if (url.href === window.location.href) return null;
    if (!isHtmlRoute(url)) return null;
    return url;
  }

  function setBaseStyle(el, styles) {
    Object.keys(styles).forEach(function (key) { el.style[key] = styles[key]; });
  }
  function applyRouteText(el) {
    if (!el || el.dataset.nwRouteLetters === "true") return;
    var letters = "N O V A W O R K".split(" ");
    el.textContent = "";
    el.setAttribute("data-route-label", "N O V A W O R K");
    for (var i = 0; i < letters.length; i += 1) {
      var span = document.createElement("span");
      span.textContent = letters[i];
      el.appendChild(span);
    }
    el.dataset.nwRouteLetters = "true";
  }
  function ensureCurtain(state) {
    if (!document.body) return null;
    var curtain = document.querySelector(".nw-route-curtain");
    if (!curtain) {
      curtain = document.createElement("div");
      curtain.className = "nw-route-curtain";
      curtain.setAttribute("aria-hidden", "true");
      var panel = document.createElement("div");
      panel.className = "nw-route-curtain__panel";
      var text = document.createElement("div");
      text.className = "nw-route-curtain__text";
      applyRouteText(text);
      panel.appendChild(text);
      curtain.appendChild(panel);
      document.body.appendChild(curtain);
    }
    curtain.dataset.state = state || "leave";
    setBaseStyle(curtain, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      overflow: "hidden",
      pointerEvents: "auto",
      contain: "layout paint style",
      background: "transparent"
    });
    var panelEl = curtain.querySelector(".nw-route-curtain__panel");
    if (panelEl) {
      setBaseStyle(panelEl, {
        position: "absolute",
        left: "0",
        right: "0",
        top: "-1px",
        bottom: "-1px",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        background: "#000",
        transform: state === "enter" ? "translate3d(0, 0, 0)" : "translate3d(0, 100%, 0)",
        willChange: "transform",
        backfaceVisibility: "hidden"
      });
      var textEl = panelEl.querySelector(".nw-route-curtain__text");
      if (!textEl) {
        textEl = document.createElement("div");
        textEl.className = "nw-route-curtain__text";
        applyRouteText(textEl);
        panelEl.appendChild(textEl);
      }
      applyRouteText(textEl);
    }
    return curtain;
  }
  function removeCurtain() {
    var curtain = document.querySelector(".nw-route-curtain");
    if (curtain && curtain.parentNode) curtain.parentNode.removeChild(curtain);
  }
  function animateElement(el, frames, options, done) {
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      if (frames && frames.length && frames[frames.length - 1].transform) el.style.transform = frames[frames.length - 1].transform;
      if (typeof done === "function") done();
    }
    if (el && typeof el.animate === "function") {
      try {
        var animation = el.animate(frames, options);
        animation.onfinish = finish;
        animation.oncancel = finish;
        return animation;
      } catch (error) {}
    }
    window.setTimeout(finish, Math.max(0, Number(options && options.duration) || 0));
    return null;
  }
  function dispatch(name, detail) {
    try { document.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); } catch (error) {}
    try { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); } catch (error) {}
  }
  function closeOpenUi() {
    if (!document.body) return;
    document.body.classList.remove("menu-open", "nw-floating-actions-visible");
    root.classList.remove("menu-open");
    var menu = document.querySelector(".mobile-menu");
    var toggle = document.querySelector(".menu-toggle");
    if (menu) {
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      menu.dataset.state = "closed";
    }
    if (toggle) {
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  }
  function focusMainAfterRoute() {
    var main = document.querySelector("main");
    if (!main) return;
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    try { main.focus({ preventScroll: true }); }
    catch (error) { try { main.focus(); } catch (innerError) {} }
  }
  function startLeave(url) {
    if (!url || leaving) return false;
    leaving = true;
    storageSet(JSON.stringify({ v: VERSION, t: now(), to: url.href, from: window.location.href }));
    closeOpenUi();
    root.classList.remove("nw-route-entering", "nw-route-ready");
    root.classList.add("nw-route-transitioning", "nw-route-leaving", "nw-route-overlay-ready");
    var curtain = ensureCurtain("leave");
    var panel = curtain ? curtain.querySelector(".nw-route-curtain__panel") : null;
    dispatch("novawork:route-leave-start", { to: url.href, source: "route-" + VERSION });
    var navigated = false;
    function go() {
      if (navigated) return;
      navigated = true;
      window.location.assign(url.href);
    }
    window.clearTimeout(coverTimer);
    coverTimer = window.setTimeout(go, COVER_MS + 320);
    if (!panel) {
      window.setTimeout(go, 40);
      return true;
    }
    panel.getBoundingClientRect();
    window.requestAnimationFrame(function () {
      animateElement(panel, [
        { transform: "translate3d(0, 100%, 0)" },
        { transform: "translate3d(0, 0, 0)" }
      ], { duration: COVER_MS, easing: EASE_COVER, fill: "forwards" }, go);
    });
    return true;
  }
  function finishEnter() {
    if (enterFinished) return;
    enterFinished = true;
    window.clearTimeout(enterTimer);
    root.classList.remove("nw-route-transitioning", "nw-route-entering", "nw-route-leaving", "nw-route-ready", "nw-route-overlay-ready");
    window.__NW_ROUTE_ENTERING = false;
    entering = false;
    removeCurtain();
    focusMainAfterRoute();
    dispatch("novawork:route-enter-done", { source: "route-" + VERSION });
  }
  function startEnter() {
    if (entering || enterFinished) return;
    var entry = getFreshEntry();
    var shouldEnter = !!entry || root.classList.contains("nw-route-entering") || window.__NW_ROUTE_ENTERING === true;
    if (!shouldEnter) return;
    entering = true;
    storageRemove();
    window.__NW_ROUTE_ENTERING = true;
    root.classList.add("nw-route-transitioning", "nw-route-entering");
    root.classList.remove("nw-route-leaving", "nw-route-ready");
    var curtain = ensureCurtain("enter");
    var panel = curtain ? curtain.querySelector(".nw-route-curtain__panel") : null;
    root.classList.add("nw-route-overlay-ready");
    if (curtain) curtain.getBoundingClientRect();
    dispatch("novawork:route-enter-start", { from: entry && entry.from, source: "route-" + VERSION });
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        root.classList.add("nw-route-ready");
        window.clearTimeout(enterTimer);
        enterTimer = window.setTimeout(finishEnter, Math.max(REVEAL_MS + CONTENT_MS, 1500));
        if (!panel) return;
        animateElement(panel, [
          { transform: "translate3d(0, 0, 0)" },
          { transform: "translate3d(0, -100%, 0)" }
        ], { duration: REVEAL_MS, easing: EASE_COVER, fill: "forwards", delay: 120 }, finishEnter);
      });
    });
  }

  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var link = target.closest("a[href]");
    var url = getTransitionUrl(link, event);
    if (!url) return;
    event.preventDefault();
    startLeave(url);
  }, true);

  document.addEventListener("DOMContentLoaded", startEnter, { once: true });
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      leaving = false;
      entering = false;
      enterFinished = false;
      storageRemove();
      root.classList.remove("nw-route-transitioning", "nw-route-entering", "nw-route-leaving", "nw-route-ready", "nw-route-overlay-ready");
      removeCurtain();
      window.__NW_ROUTE_ENTERING = false;
      return;
    }
    startEnter();
  }, { passive: true });
  if (document.readyState !== "loading") startEnter();

  window.NOVAWORKRouteTransition = {
    version: VERSION,
    start: function (href) {
      var url;
      try { url = new URL(href, window.location.href); } catch (error) { return false; }
      return startLeave(url);
    }
  };
})();
