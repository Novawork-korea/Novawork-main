(function () {
  var hasRun = false;
  var activeItems = [];
  var observer = null;
  var REVEAL_TRANSITION_MS = 780;

  /*
   * PC에서 Windows/브라우저의 "동작 줄이기" 설정이 켜져 있으면
   * matchMedia("(prefers-reduced-motion: reduce)")가 true가 됩니다.
   * 기존 코드는 이 경우 init을 return 해서 PC에서 스크롤 리빌이 아예 등록되지 않았습니다.
   * NOVAWORK 사이트에서는 PC/모바일 모두 동일하게 리빌 효과가 보이도록 false로 둡니다.
   * 접근성 정책상 모션을 완전히 끄고 싶으면 true로 바꾸면 됩니다.
   */
  var RESPECT_REDUCED_MOTION = false;

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
      (body && body.classList.contains("contact-static-page")) ||
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
    element.dataset.revealDelay = String(delay);
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

  function getRevealDelay(element) {
    var delay = Number(element && element.dataset ? element.dataset.revealDelay : 0);
    return Number.isFinite(delay) ? delay : 0;
  }

  function releaseRevealLock(element) {
    var delay = getRevealDelay(element);

    window.setTimeout(function () {
      if (!element) {
        return;
      }

      element.classList.remove("is-revealing");
      element.classList.add("reveal-complete");
    }, delay + REVEAL_TRANSITION_MS + 120);
  }

  function revealElement(element) {
    if (!element || element.classList.contains("is-visible")) {
      return;
    }

    /*
     * PC 전용 hover transform(.info-card:hover 등)이 reveal transform을 덮어쓰지 않도록
     * 애니메이션 중에는 is-revealing으로 transform을 잠깁니다.
     * 애니메이션 종료 후에는 잠금을 풀어 기존 hover 인터랙션이 다시 동작합니다.
     */
    element.classList.add("is-visible", "is-revealing");
    releaseRevealLock(element);

    if (observer) {
      observer.unobserve(element);
    }
  }

  function revealAllImmediately() {
    activeItems.forEach(function (element) {
      if (!element) {
        return;
      }

      element.classList.add("is-visible", "reveal-complete");
      element.classList.remove("is-revealing");
    });
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
    if (hasRun || !document.body || isContactPage()) {
      return;
    }

    hasRun = true;
    activeItems = collectRevealItems();

    if (!activeItems.length) {
      return;
    }

    document.body.classList.add("scroll-reveal-ready");

    if (RESPECT_REDUCED_MOTION && prefersReducedMotion()) {
      revealAllImmediately();
      return;
    }

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
