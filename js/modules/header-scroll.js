window.initHeaderScroll = function initHeaderScroll() {
  const header = document.querySelector(".header");

  if (!header) {
    return;
  }

  const updateHeaderState = function () {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
};