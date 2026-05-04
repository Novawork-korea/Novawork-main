window.initHeaderScroll = function initHeaderScroll() {
  const header = document.querySelector(".header");

  if (!header || header.dataset.headerScrollReady === "true") {
    return;
  }

  header.dataset.headerScrollReady = "true";

  let ticking = false;
  let lastScrolledState = null;

  const applyHeaderState = function () {
    ticking = false;

    const isScrolled = window.scrollY > 8;

    if (isScrolled === lastScrolledState) {
      return;
    }

    lastScrolledState = isScrolled;
    header.classList.toggle("is-scrolled", isScrolled);
  };

  const requestHeaderState = function () {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(applyHeaderState);
  };

  applyHeaderState();
  window.addEventListener("scroll", requestHeaderState, { passive: true });
};
