(() => {
  "use strict";

  const root = document.documentElement;
  if (root.dataset.nwCore === "v43") return;
  root.dataset.nwCore = "v43";

  const raf = window.requestAnimationFrame || ((fn) => window.setTimeout(fn, 16));
  const ready = (fn) => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  };
  const safeText = (value, limit = 90) => String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);

  const sendEvent = (eventName, params) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({
      event: eventName,
      event_category: "novawork_engagement",
      page_path: window.location.pathname || "/"
    }, params || {}));
  };

  window.NOVAWORKTrack = {
    event: sendEvent,
    generateLead: (params) => sendEvent("generate_lead", Object.assign({
      lead_source: "contact_form",
      method: "contact_form"
    }, params || {}))
  };

  const storeTrackingParams = () => {
    if (!window.URLSearchParams) return;
    const params = new URLSearchParams(window.location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((name) => {
      const value = params.get(name);
      if (!value) return;
      try { window.sessionStorage.setItem("novawork_" + name, safeText(value)); } catch (error) {}
    });
  };

  const normalizePath = (value) => {
    let path = "";
    try { path = new URL(value || "index.html", window.location.href).pathname; }
    catch (error) { path = String(value || ""); }
    const clean = path.replace(/^\.\//, "").split("#")[0].split("?")[0].replace(/\/$/, "");
    if (!clean || clean === "/") return "index.html";
    return clean.split("/").pop() || "index.html";
  };

  const initCurrentPage = () => {
    const currentRaw = normalizePath(window.location.href);
    const current = currentRaw.startsWith("service-") ? "services.html" : currentRaw;
    document.querySelectorAll(".nav-link, .mobile-menu-list a, .mobile-menu-shortcut-grid a, .footer-nav a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      link.toggleAttribute("aria-current", normalizePath(href) === current);
    });
  };

  const initHeaderScroll = () => {
    const header = document.querySelector(".header");
    if (!header || header.dataset.headerScrollReady === "true") return;
    header.dataset.headerScrollReady = "true";

    let ticking = false;
    let lastScrolled = null;
    const apply = () => {
      ticking = false;
      const scrolled = window.scrollY > 8;
      if (scrolled === lastScrolled) return;
      lastScrolled = scrolled;
      header.classList.toggle("is-scrolled", scrolled);
    };
    const request = () => {
      if (ticking) return;
      ticking = true;
      raf(apply);
    };

    apply();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("pageshow", request, { passive: true });
  };

  const initMobileMenu = () => {
    const body = document.body;
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.querySelector(".mobile-menu");
    const panel = menu ? menu.querySelector(".mobile-menu-panel") : null;
    if (!toggle || !menu || menu.dataset.mobileReady === "true") return;
    menu.dataset.mobileReady = "true";

    if (!menu.id) menu.id = "mobile-menu";
    toggle.setAttribute("aria-controls", menu.id);
    toggle.setAttribute("aria-expanded", "false");
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-modal", "true");
    menu.setAttribute("aria-label", "모바일 메뉴");
    menu.setAttribute("aria-hidden", "true");
    menu.dataset.state = "closed";

    let lastFocused = null;
    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const isOpen = () => menu.classList.contains("is-open");
    const focusable = () => Array.from(menu.querySelectorAll(focusableSelector)).filter((el) => {
      return el instanceof HTMLElement && !el.hasAttribute("disabled") && el.offsetParent !== null;
    });
    const shouldMoveFocus = () => window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const setOpen = (nextOpen, options = {}) => {
      if (nextOpen === isOpen()) return;
      const restoreFocus = options.restoreFocus !== false;

      if (nextOpen) {
        lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        menu.scrollTop = 0;
      }

      body.classList.toggle("menu-open", nextOpen);
      toggle.classList.toggle("is-open", nextOpen);
      menu.classList.toggle("is-open", nextOpen);
      toggle.setAttribute("aria-expanded", nextOpen ? "true" : "false");
      toggle.setAttribute("aria-label", nextOpen ? "모바일 메뉴 닫기" : "모바일 메뉴 열기");
      menu.setAttribute("aria-hidden", nextOpen ? "false" : "true");
      menu.dataset.state = nextOpen ? "open" : "closed";

      if (nextOpen && shouldMoveFocus()) {
        window.setTimeout(() => {
          const first = focusable()[0];
          if (first) first.focus({ preventScroll: true });
        }, 0);
      } else if (!nextOpen && restoreFocus && lastFocused && lastFocused.isConnected) {
        window.setTimeout(() => lastFocused.focus({ preventScroll: true }), 0);
      }
    };

    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setOpen(!isOpen());
    });

    menu.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("a[href]")) {
        setOpen(false, { restoreFocus: false });
        return;
      }
      if (target === menu || (panel && !panel.contains(target))) setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (!isOpen()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    });

    const closeForWideLayout = () => {
      if (window.innerWidth > 768) setOpen(false, { restoreFocus: false });
    };
    window.addEventListener("resize", closeForWideLayout, { passive: true });
    window.addEventListener("orientationchange", closeForWideLayout, { passive: true });
    window.addEventListener("pageshow", () => setOpen(false, { restoreFocus: false }), { passive: true });
  };

  const initTracking = () => {
    if (root.dataset.nwClickTrackingReady === "true") return;
    root.dataset.nwClickTrackingReady = "true";

    const linkArea = (link) => {
      if (link.closest(".mobile-quick-cta")) return "mobile_quick_cta";
      if (link.closest(".mobile-menu")) return "mobile_menu";
      if (link.closest(".header")) return "header";
      if (link.closest(".footer")) return "footer";
      if (link.closest(".quick-contact")) return "quick_contact";
      if (link.closest(".hero, .nw-logo-scroll")) return "hero";
      if (link.closest("main")) return "content";
      return "unknown";
    };

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      const area = linkArea(link);
      const label = safeText(link.getAttribute("aria-label") || link.textContent || "");
      if (href.startsWith("tel:")) return sendEvent("click_phone", { method: "phone", link_area: area });
      if (href.startsWith("mailto:")) return sendEvent("click_email", { method: "email", link_area: area });
      if (href.includes("pf.kakao.com")) return sendEvent("click_kakao", { method: "kakao", link_text: label || "kakao_channel", link_area: area });
      if (href.includes("contact.html") || href.includes("#inquiry-form")) {
        sendEvent("cta_click", {
          link_text: label,
          link_area: area,
          destination: href.includes("#inquiry-form") ? "inquiry_form" : "contact_page"
        });
      }
    });

    const form = document.querySelector(".inquiry-form");
    if (!form) return;
    let started = false;
    form.addEventListener("input", () => {
      if (started) return;
      started = true;
      sendEvent("contact_form_start", { form_id: form.id || "inquiry-form" });
    }, { passive: true });
  };

  const initMobileQuickCta = () => {
    const cta = document.querySelector(".mobile-quick-cta");
    if (!cta || cta.dataset.mobileCtaReady === "true") return;
    cta.dataset.mobileCtaReady = "true";

    const contactLink = cta.querySelector('[data-mobile-cta="contact"]');
    const pageSpecificContact = document.querySelector(
      '.service-detail-actions a[href*="contact.html?service="], .detail-sidebar-box a[href*="contact.html?service="], .service-detail-cta a[href*="contact.html?service="]'
    );
    if (contactLink && pageSpecificContact) {
      contactLink.setAttribute("href", pageSpecificContact.getAttribute("href") || "contact.html");
    }

    const mq = window.matchMedia ? window.matchMedia("(max-width: 768px)") : null;
    const isMobile = () => !mq || mq.matches;
    const threshold = () => {
      if (document.body.classList.contains("home")) return Math.min(320, Math.max(160, window.innerHeight * 0.28));
      if (document.body.classList.contains("service-detail-page")) return 84;
      return 72;
    };

    let ticking = false;
    let lastVisible = null;
    const apply = () => {
      ticking = false;
      const visible = isMobile() && window.scrollY > threshold() && !document.body.classList.contains("menu-open");
      if (visible === lastVisible) return;
      lastVisible = visible;
      document.body.classList.toggle("mobile-quick-cta-visible", visible);
    };
    const request = () => {
      if (ticking) return;
      ticking = true;
      raf(apply);
    };

    apply();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    window.addEventListener("orientationchange", request, { passive: true });
    window.addEventListener("pageshow", request, { passive: true });
    if (mq && typeof mq.addEventListener === "function") mq.addEventListener("change", request);
  };

  const initScrollReveal = () => {
    if (root.dataset.nwScrollReveal === "v43") return;
    root.dataset.nwScrollReveal = "v43";

    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touchLayout = window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (reduceMotion || touchLayout || !("IntersectionObserver" in window)) return;

    const selector = [
      "main .page-hero .section-head",
      "main .page-hero-visual",
      "main .section-head",
      "main .service-mini-card",
      "main .service-index-card",
      "main .detail-panel",
      "main .package-card",
      "main .contact-panel",
      "main .form-section",
      "main .value-card",
      "main .deliverable-card",
      "main .home-signal",
      "main .decision-row",
      "main .home-process-step",
      "main .faq-item",
      "main .about-route-card",
      "main .about-method-list article",
      "main .about-boundary-card"
    ].join(",");

    const blockedParents = ".nw-logo-scroll, .site-loader, .header, .footer, .mobile-menu, script, style";
    const schedule = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 90));

    schedule(() => {
      const items = Array.from(document.querySelectorAll(selector)).filter((el) => {
        return el instanceof HTMLElement && !el.closest(blockedParents) && el.dataset.nwReveal !== "skip";
      }).slice(0, 90);
      if (!items.length) return;

      document.body.classList.add("scroll-reveal-ready", "nw-scroll-reveal-active");
      const siblingCounts = new WeakMap();
      const complete = (el) => {
        el.dataset.nwRevealComplete = "true";
        el.removeAttribute("data-nw-reveal");
        el.style.removeProperty("--reveal-delay");
      };
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          observer.unobserve(el);
          el.dataset.nwReveal = "visible";
          window.setTimeout(() => complete(el), 760);
        });
      }, { threshold: 0.01, rootMargin: "0px 0px -8% 0px" });

      items.forEach((el) => {
        const parent = el.parentElement || document.body;
        const index = siblingCounts.get(parent) || 0;
        siblingCounts.set(parent, index + 1);
        el.style.setProperty("--reveal-delay", Math.min(index * 45, 180) + "ms");
        el.dataset.nwReveal = "pending";
        observer.observe(el);
      });
    }, { timeout: 1200 });
  };


  // v43: page transitions are handled by the early head boot script.

  storeTrackingParams();
  ready(() => {
    initCurrentPage();
    initHeaderScroll();
    initMobileMenu();
    initMobileQuickCta();
    initTracking();
    if (typeof window.initInquiryForm === "function") window.initInquiryForm();
    initScrollReveal();
  });
})();
