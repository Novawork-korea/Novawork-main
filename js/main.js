document.addEventListener("DOMContentLoaded", function () {
  if (typeof window.initCurrentPage === "function") {
    window.initCurrentPage();
  }

  if (typeof window.initHeaderScroll === "function") {
    window.initHeaderScroll();
  }

  if (typeof window.initLogoScrollHero === "function") {
    window.initLogoScrollHero();
  }

  if (typeof window.initMobileMenu === "function") {
    window.initMobileMenu();
  }

  if (typeof window.initInquiryForm === "function") {
    window.initInquiryForm();
  }

  if (typeof window.initScrollReveal === "function") {
    window.initScrollReveal();
  }
});