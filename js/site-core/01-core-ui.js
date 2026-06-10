(() => {
  "use strict";

  const root = document.documentElement;
  if (root.dataset.nwCore === "EnhanceV10") return;
  root.dataset.nwCore = "EnhanceV10";

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
    const header = document.querySelector(".header");
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.querySelector(".mobile-menu");
    const panel = menu ? menu.querySelector(".mobile-menu-panel") : null;
    if (!toggle || !menu || menu.dataset.mobileReady === "true") return;
    menu.dataset.mobileReady = "true";

    if (!menu.id) menu.id = "mobile-menu";
    if (menu.parentElement !== body) body.appendChild(menu);

    const syncHeaderHeight = () => {
      const height = header ? Math.round(header.getBoundingClientRect().height || 0) : 0;
      if (height > 0) root.style.setProperty("--header-height", height + "px");
    };

    const syncMenuGeometry = () => {
      const rect = toggle.getBoundingClientRect();
      const left = Math.max(0, Math.round(rect.left));
      const right = Math.max(left + 1, Math.round(rect.right));
      const center = Math.max(0, Math.round(rect.left + rect.width / 2));
      menu.style.setProperty("--nw-menu-rail-left", left + "px");
      menu.style.setProperty("--nw-menu-rail-right", right + "px");
      menu.style.setProperty("--nw-menu-rail-center", center + "px");
      menu.style.setProperty("--nw-menu-toggle-width", Math.max(36, Math.round(rect.width || 42)) + "px");
    };

    const clearRouteStateForMenu = () => {
      const hasRouteState = ["nw-route-transitioning", "nw-route-entering", "nw-route-leaving", "nw-route-ready", "nw-route-overlay-ready"].some((name) => root.classList.contains(name));
      if (!hasRouteState) return;
      root.classList.remove("nw-route-transitioning", "nw-route-entering", "nw-route-leaving", "nw-route-ready", "nw-route-overlay-ready");
      window.__NW_ROUTE_ENTERING = false;
      document.querySelectorAll(".nw-route-curtain").forEach((curtain) => curtain.remove());
    };

    toggle.setAttribute("aria-controls", menu.id);
    toggle.setAttribute("aria-expanded", "false");
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-modal", "true");
    menu.setAttribute("aria-label", "모바일 메뉴");
    menu.setAttribute("aria-hidden", "true");
    menu.dataset.state = "closed";

    let lastFocused = null;
    let menuAnimationTimer = 0;
    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const isOpen = () => menu.classList.contains("is-open");
    const focusable = () => Array.from(menu.querySelectorAll(focusableSelector)).filter((el) => {
      if (!(el instanceof HTMLElement) || el.hasAttribute("disabled")) return false;
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && el.getClientRects().length > 0;
    });
    const shouldMoveFocus = () => window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 769px)").matches;
    const shouldLockBody = () => !window.matchMedia || window.matchMedia("(max-width: 768px)").matches;
    let lockedScrollY = 0;
    let savedBodyInline = null;
    const lockBodyScroll = () => {
      if (!shouldLockBody() || body.dataset.nwMenuScrollLocked === "true") return;
      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      savedBodyInline = {
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
        overflow: body.style.overflow
      };
      body.dataset.nwMenuScrollLocked = "true";
      body.style.position = "fixed";
      body.style.top = "-" + lockedScrollY + "px";
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
    };
    const unlockBodyScroll = () => {
      if (body.dataset.nwMenuScrollLocked !== "true") return;
      delete body.dataset.nwMenuScrollLocked;
      const restoreY = lockedScrollY;
      if (savedBodyInline) {
        body.style.position = savedBodyInline.position || "";
        body.style.top = savedBodyInline.top || "";
        body.style.left = savedBodyInline.left || "";
        body.style.right = savedBodyInline.right || "";
        body.style.width = savedBodyInline.width || "";
        body.style.overflow = savedBodyInline.overflow || "";
      } else {
        ["position", "top", "left", "right", "width", "overflow"].forEach((prop) => body.style.removeProperty(prop));
      }
      savedBodyInline = null;
      if (shouldLockBody()) window.scrollTo(0, restoreY || 0);
    };

    const setOpen = (nextOpen, options = {}) => {
      const staleState = body.classList.contains("menu-open") !== nextOpen || root.classList.contains("menu-open") !== nextOpen;
      if (nextOpen === isOpen() && !staleState) return;
      const restoreFocus = options.restoreFocus !== false;
      syncHeaderHeight();
      syncMenuGeometry();
      window.clearTimeout(menuAnimationTimer);

      if (nextOpen) {
        if (menu.parentElement !== body) body.appendChild(menu);
        clearRouteStateForMenu();
        lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        menu.scrollTop = 0;
      }

      body.classList.toggle("menu-open", nextOpen);
      root.classList.toggle("menu-open", nextOpen);
      if (nextOpen) lockBodyScroll();
      else unlockBodyScroll();
      toggle.classList.toggle("is-open", nextOpen);
      menu.classList.toggle("is-open", nextOpen);
      menu.classList.toggle("is-opening", nextOpen);
      menu.classList.remove(nextOpen ? "is-closing" : "is-opened");
      if (nextOpen) {
        menuAnimationTimer = window.setTimeout(() => {
          menu.classList.remove("is-opening");
          menu.classList.add("is-opened");
        }, 690);
      } else {
        menu.classList.add("is-closing");
        menuAnimationTimer = window.setTimeout(() => menu.classList.remove("is-closing"), 320);
      }
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
      syncHeaderHeight();
      if (window.innerWidth > 768) setOpen(false, { restoreFocus: false });
    };
    syncHeaderHeight();
    syncMenuGeometry();
    window.addEventListener("resize", closeForWideLayout, { passive: true });
    window.addEventListener("orientationchange", closeForWideLayout, { passive: true });
    window.addEventListener("pageshow", () => setOpen(false, { restoreFocus: false }), { passive: true });
  };

  const initTracking = () => {
    if (root.dataset.nwClickTrackingReady === "true") return;
    root.dataset.nwClickTrackingReady = "true";

    const linkArea = (link) => {
      if (link.closest(".nw-floating-actions")) return "floating_actions";
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

  const initFloatingActions = () => {
    if (root.dataset.nwFloatingActions === "EnhanceV5") return;
    root.dataset.nwFloatingActions = "EnhanceV5";

    const body = document.body;
    if (!body) return;
    let nav = document.querySelector(".nw-floating-actions");
    const pageSpecificContact = document.querySelector(
      '.service-detail-actions a[href*="contact.html?service="], .detail-sidebar-box a[href*="contact.html?service="], .service-detail-cta a[href*="contact.html?service="], .package-actions a[href*="contact.html?package="]'
    );
    const contactHref = pageSpecificContact ? (pageSpecificContact.getAttribute("href") || "contact.html") : "contact.html";

    if (!nav) {
      nav = document.createElement("nav");
      nav.className = "nw-floating-actions";
      nav.setAttribute("aria-label", "빠른 문의");
      nav.innerHTML = [
        '<a class="nw-floating-action nw-floating-action--kakao" data-floating-cta="kakao" href="https://pf.kakao.com/_xhDLjX/chat" target="_blank" rel="noopener noreferrer" aria-label="NOVAWORK 카카오톡 채팅 열기"><svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M12 4C6.48 4 2 7.58 2 12c0 2.72 1.7 5.13 4.3 6.58L5.68 21.7a.55.55 0 0 0 .82.57l3.5-2.22c.64.1 1.31.15 2 .15 5.52 0 10-3.58 10-8.2S17.52 4 12 4Zm-4.15 7.4h1.22v4.05h1.12V11.4h1.22v-.96H7.85v.96Zm4.14 4.05h1.1l.3-.78h1.64l.3.78h1.15l-1.68-5.01h-1.13l-1.68 5.01Zm1.73-1.66.48-1.52.48 1.52h-.96Zm3.08 1.66h3.12v-.98h-1.96v-4.03H16.8v5.01Z"/></svg><span class="visually-hidden">카카오톡</span></a>',
        '<a class="nw-floating-action nw-floating-action--contact" data-floating-cta="contact" href="contact.html" aria-label="NOVAWORK 프로젝트 접수하기"><svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M7 3h7.7L19 7.3V21H7V3Zm7 1.9V8h3.1L14 4.9ZM9 10.6v1.2h8v-1.2H9Zm0 3.2V15h8v-1.2H9Zm0 3.2v1.2h5.8V17H9Z"/></svg><span class="visually-hidden">접수하기</span></a>'
      ].join("");
      body.appendChild(nav);
    }

    const contact = nav.querySelector('[data-floating-cta="contact"]');
    if (contact) contact.setAttribute("href", contactHref);

    const isHome = () => body.classList.contains("home");
    let heroReady = !isHome() || Boolean(document.querySelector(".nw-logo-scroll.is-intro-complete"));
    const isSuppressed = () => body.classList.contains("menu-open") ||
      root.classList.contains("site-is-loading") ||
      root.classList.contains("site-is-revealing") ||
      root.classList.contains("nw-route-transitioning") ||
      root.classList.contains("nw-route-entering") ||
      root.classList.contains("nw-route-leaving") ||
      root.classList.contains("nw-intro-lock") ||
      body.classList.contains("nw-intro-lock");

    let ticking = false;
    const apply = () => {
      ticking = false;
      const visible = heroReady && !isSuppressed();
      body.classList.toggle("nw-floating-actions-visible", visible);
    };
    const request = () => {
      if (ticking) return;
      ticking = true;
      raf(apply);
    };
    const onHeroStart = () => {
      heroReady = false;
      body.classList.remove("nw-floating-actions-visible");
    };
    const onHeroDone = () => {
      window.setTimeout(() => {
        heroReady = true;
        request();
      }, 360);
    };

    document.addEventListener("novawork:hero-intro-start", onHeroStart, { passive: true });
    window.addEventListener("novawork:hero-intro-start", onHeroStart, { passive: true });
    document.addEventListener("novawork:hero-intro-done", onHeroDone, { passive: true });
    window.addEventListener("novawork:hero-intro-done", onHeroDone, { passive: true });
    document.addEventListener("novawork:route-enter-done", request, { passive: true });
    window.addEventListener("novawork:route-enter-done", request, { passive: true });
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    window.addEventListener("pageshow", request, { passive: true });
    request();
  };

  const initServiceDetailAccordions = () => {
    if (!document.body.classList.contains("service-detail-page") || root.dataset.nwDetailAccordions === "EnhanceV5") return;
    root.dataset.nwDetailAccordions = "EnhanceV5";

    const panels = Array.from(document.querySelectorAll(".detail-main .detail-panel"));
    if (!panels.length) return;
    const reduceMotion = false;

    const openPanelById = (id, animate = true) => {
      const panel = panels.find((item) => item.id === id);
      if (panel && typeof panel.nwSetAccordionOpen === "function") panel.nwSetAccordionOpen(true, animate);
    };

    panels.forEach((panel, index) => {
      if (!(panel instanceof HTMLElement) || panel.dataset.nwAccordionReady === "true") return;
      panel.dataset.nwAccordionReady = "true";
      panel.classList.add("detail-accordion");
      const head = panel.querySelector(":scope > .detail-section-head");
      if (!head) return;
      const title = head.querySelector("h2");
      const panelId = panel.id || "detail-panel-" + (index + 1);
      if (!panel.id) panel.id = panelId;
      const bodyId = panelId + "-body";
      let content = panel.querySelector(":scope > .detail-panel-body");
      if (!content) {
        content = document.createElement("div");
        content.className = "detail-panel-body";
        content.id = bodyId;
        while (head.nextSibling) content.appendChild(head.nextSibling);
        panel.appendChild(content);
      } else if (!content.id) {
        content.id = bodyId;
      }
      let toggle = head.querySelector(".detail-accordion-toggle");
      if (!toggle) {
        toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "detail-accordion-toggle";
        toggle.innerHTML = '<span class="visually-hidden">내용 펼치기</span><i aria-hidden="true"></i>';
        head.appendChild(toggle);
      }
      toggle.setAttribute("aria-controls", content.id);
      if (title) {
        title.setAttribute("role", "button");
        title.setAttribute("tabindex", "0");
        title.setAttribute("aria-controls", content.id);
      }

      let timer = 0;
      let rafOne = 0;
      let rafTwo = 0;
      const clearMotion = () => {
        window.clearTimeout(timer);
        if (rafOne) window.cancelAnimationFrame(rafOne);
        if (rafTwo) window.cancelAnimationFrame(rafTwo);
        timer = rafOne = rafTwo = 0;
      };
      const setOpen = (open, animate = true) => {
        const next = Boolean(open);
        const currentOpen = panel.dataset.accordionOpen === "true";
        if (currentOpen === next && animate) return;
        clearMotion();
        panel.dataset.accordionOpen = next ? "true" : "false";
        panel.classList.toggle("is-open", next);
        toggle.setAttribute("aria-expanded", next ? "true" : "false");
        toggle.setAttribute("aria-label", next ? "내용 접기" : "내용 펼치기");
        if (title) title.setAttribute("aria-expanded", next ? "true" : "false");

        const shouldAnimate = animate && !reduceMotion;
        if (!shouldAnimate) {
          content.hidden = !next;
          content.style.height = next ? "auto" : "0px";
          content.style.opacity = next ? "1" : "0";
          content.style.transform = next ? "translate3d(0,0,0)" : "translate3d(0,-12px,0)";
          return;
        }

        content.hidden = false;
        content.style.overflow = "hidden";
        const startHeight = next ? 0 : content.getBoundingClientRect().height || content.scrollHeight;
        content.style.height = startHeight + "px";
        content.style.opacity = next ? "0" : "1";
        content.style.transform = next ? "translate3d(0,-12px,0)" : "translate3d(0,0,0)";

        rafOne = window.requestAnimationFrame(() => {
          const endHeight = next ? content.scrollHeight : 0;
          rafTwo = window.requestAnimationFrame(() => {
            content.style.height = endHeight + "px";
            content.style.opacity = next ? "1" : "0";
            content.style.transform = next ? "translate3d(0,0,0)" : "translate3d(0,-12px,0)";
          });
        });

        timer = window.setTimeout(() => {
          if (next) {
            content.hidden = false;
            content.style.height = "auto";
            content.style.opacity = "1";
            content.style.transform = "translate3d(0,0,0)";
          } else {
            content.hidden = true;
            content.style.height = "0px";
            content.style.opacity = "0";
            content.style.transform = "translate3d(0,-12px,0)";
          }
          content.style.overflow = "";
        }, 760);
      };
      panel.nwSetAccordionOpen = setOpen;
      setOpen(window.location.hash && window.location.hash.slice(1) === panel.id, false);

      const toggleNow = (event) => {
        if (event) event.preventDefault();
        setOpen(panel.dataset.accordionOpen !== "true", true);
      };
      toggle.addEventListener("click", toggleNow);
      if (title) {
        title.addEventListener("click", toggleNow);
        title.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") toggleNow(event);
        });
      }
      head.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (target.closest("button, a") || target === title || target.closest("h2")) return;
        toggleNow(event);
      });
    });

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a[href^="#"]');
      if (!link) return;
      const id = (link.getAttribute("href") || "").slice(1);
      if (id) window.setTimeout(() => openPanelById(id, true), 60);
    });
    if (window.location.hash) window.setTimeout(() => openPanelById(window.location.hash.slice(1), true), 120);
  };

  // v43: page transitions are handled by the early head boot script.

  storeTrackingParams();
  ready(() => {
    initCurrentPage();
    initHeaderScroll();
    initMobileMenu();
    initFloatingActions();
    initTracking();
    if (typeof window.initInquiryForm === "function") window.initInquiryForm();
    initServiceDetailAccordions();
  });
})();

