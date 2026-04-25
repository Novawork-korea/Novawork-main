window.initMobileMenu = function initMobileMenu() {
  const body = document.body;
  const header = document.querySelector(".header");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");

  if (!menuToggle || !mobileMenu) {
    return;
  }

  const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const mobileMenuLinks = mobileMenu.querySelectorAll("a");
  let lastFocusedElement = null;

  if (!mobileMenu.id) {
    mobileMenu.id = "mobile-menu";
  }

  menuToggle.setAttribute("aria-controls", mobileMenu.id);
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "모바일 메뉴 열기");
  mobileMenu.setAttribute("role", "dialog");
  mobileMenu.setAttribute("aria-modal", "true");
  mobileMenu.setAttribute("aria-label", "모바일 메뉴");
  mobileMenu.setAttribute("aria-hidden", "true");

  const closeMenu = function () {
    if (!mobileMenu.classList.contains("is-open")) {
      return;
    }

    body.classList.remove("menu-open");
    menuToggle.classList.remove("is-open");
    mobileMenu.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "모바일 메뉴 열기");
    mobileMenu.setAttribute("aria-hidden", "true");

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  };

  const openMenu = function () {
    lastFocusedElement = document.activeElement;
    body.classList.add("menu-open");
    menuToggle.classList.add("is-open");
    mobileMenu.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "모바일 메뉴 닫기");
    mobileMenu.setAttribute("aria-hidden", "false");

    if (mobileMenuLinks.length > 0) {
      mobileMenuLinks[0].focus();
    }
  };

  const toggleMenu = function () {
    if (mobileMenu.classList.contains("is-open")) {
      closeMenu();
      return;
    }

    openMenu();
  };

  const trapFocus = function (event) {
    if (!mobileMenu.classList.contains("is-open") || event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(mobileMenu.querySelectorAll(focusableSelector));

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  menuToggle.addEventListener("click", toggleMenu);

  mobileMenuLinks.forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeMenu();
      return;
    }

    trapFocus(event);
  });

  document.addEventListener("click", function (event) {
    if (window.innerWidth > 768 || !mobileMenu.classList.contains("is-open")) {
      return;
    }

    if (header && !header.contains(event.target)) {
      closeMenu();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  });
};
