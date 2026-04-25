(function () {
  var hasRun = false;
  var activeItems = [];
  var observer = null;

  var GROUPS = [
    { selector: ".hero-content, .page-hero .section-head", direction: "left", step: 0 },
    { selector: ".hero-visual, .page-hero-visual", direction: "right", step: 90 },
    { selector: ".section > .container > .section-head", direction: "bottom", step: 60 },
    { selector: ".split-content, .portfolio-content, .showcase-body", direction: "left", step: 60 },
    { selector: ".split-section > .image-card, .home-wide-visual", direction: "right", step: 70 },
    { selector: ".info-card, .service-card, .portfolio-card, .process-card, .lead-card, .value-card, .method-card, .scope-card, .package-card, .deliverable-card, .privacy-card, .home-feature-card, .showcase-card, .image-card, .faq-item, .cta-band", direction: "auto", step: 70 }
  ];

  var AUTO_DIRECTIONS = ["bottom", "left", "right", "bottom", "right", "left"];

  function isContactPage() {
    var body = document.body;
    var path = (window.location.pathname || "").toLowerCase();

    return Boolean(
      body && body.classList.contains("contact-static-page") ||
      path.indexOf("contact.html") !== -1
    );
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function chooseDirection(groupDirection, index) {
    if (groupDirection === "auto") {
      return AUTO_DIRECTIONS[index % AUTO_DIRECTIONS.length];
    }

    return groupDirection || "bottom";
  }

  function register(items, element, direction, delay) {
    if (!element || element.dataset.revealRegistered === "true") {
      return;
    }

    element.dataset.revealRegistered = "true";
    element.dataset.reveal = direction;
    element.style.setProperty("--reveal-delay", delay + "ms");
    element.classList.add("reveal");
    items.push(element);
  }

  function collectRevealItems() {
    var items = [];

    GROUPS.forEach(function (group, groupIndex) {
      var nodes = Array.prototype.slice.call(document.querySelectorAll(group.selector));

      nodes.forEach(function (node, nodeIndex) {
        var direction = chooseDirection(group.direction, nodeIndex + groupIndex);
        var delay = Math.min((nodeIndex % 4) * group.step, 240);
        register(items, node, direction, delay);
      });
    });

    return items;
  }

  function isInRevealRange(element) {
    var rect = element.getBoundingClientRect();
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    var viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    return (
      rect.top <= viewportHeight * 0.9 &&
      rect.bottom >= viewportHeight * 0.04 &&
      rect.left <= viewportWidth &&
      rect.right >= 0
    );
  }

  function revealElement(element) {
    if (!element || element.classList.contains("is-visible")) {
      return;
    }

    element.classList.add("is-visible");

    if (observer) {
      observer.unobserve(element);
    }
  }

  function revealVisibleItems() {
    activeItems.forEach(function (element) {
      if (isInRevealRange(element)) {
        revealElement(element);
      }
    });
  }

  function throttleFrame(fn) {
    var ticking = false;

    return function () {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        fn();
      });
    };
  }

  function observeItems() {
    if (!("IntersectionObserver" in window)) {
      revealVisibleItems();
      return;
    }

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          revealElement(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: "0px 0px -6% 0px"
    });

    activeItems.forEach(function (element) {
      observer.observe(element);
    });
  }

  function initScrollReveal() {
    if (hasRun) {
      return;
    }

    hasRun = true;

    if (!document.body || isContactPage()) {
      return;
    }

    if (prefersReducedMotion()) {
      return;
    }

    activeItems = collectRevealItems();

    if (!activeItems.length) {
      return;
    }

    document.body.classList.add("scroll-reveal-ready");
    observeItems();

    var throttledReveal = throttleFrame(revealVisibleItems);

    window.addEventListener("scroll", throttledReveal, { passive: true });
    window.addEventListener("resize", throttledReveal, { passive: true });
    window.addEventListener("load", throttledReveal, { once: true });

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(revealVisibleItems);
    });
  }

  window.initScrollReveal = initScrollReveal;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollReveal, { once: true });
  } else {
    initScrollReveal();
  }
})();
