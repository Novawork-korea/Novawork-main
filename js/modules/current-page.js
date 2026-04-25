window.initCurrentPage = function initCurrentPage() {
  const navLinks = document.querySelectorAll(".nav-link, .mobile-menu-list a, .footer-nav a");

  const normalizePath = function (path) {
    const cleanPath = (path || "")
      .replace(window.location.origin, "")
      .replace(/^\.\//, "")
      .split("#")[0]
      .split("?")[0]
      .replace(/\/$/, "");

    if (!cleanPath || cleanPath === "/") {
      return "index.html";
    }

    return cleanPath.split("/").pop() || "index.html";
  };

  const currentFile = normalizePath(window.location.pathname);

  navLinks.forEach(function (link) {
    const href = link.getAttribute("href") || "";

    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }

    const hrefFile = normalizePath(href);

    if (hrefFile === currentFile) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};
