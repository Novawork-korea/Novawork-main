/* NOVAWORK page reveals and FAQ search/category controls. */
(() => {
  "use strict";

  const root = document.documentElement;
  if (root.dataset.nwPageInteractions === "ready") return;
  root.dataset.nwPageInteractions = "ready";

  const raf =
    window.requestAnimationFrame || ((fn) => window.setTimeout(fn, 16));
  const ready = (fn) => {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  };

  const normalizeText = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim();

  const initFaqSearchV8 = () => {
    if (root.dataset.nwFaqSearch === "ready") return;
    const body = document.body;
    if (!body || !body.classList.contains("faq-static-page")) return;
    const section = document.querySelector(".faq-section");
    const container = section
      ? section.querySelector(":scope > .container")
      : null;
    if (!container) return;
    root.dataset.nwFaqSearch = "ready";

    const pairs = [];
    const children = Array.from(container.children);
    for (let i = 0; i < children.length; i += 1) {
      const head = children[i];
      if (
        !(head instanceof HTMLElement) ||
        !head.classList.contains("faq-category-head")
      )
        continue;
      const list = children[i + 1];
      if (
        !(list instanceof HTMLElement) ||
        !list.classList.contains("faq-list")
      )
        continue;
      const title = head.querySelector(".faq-category-title");
      const label =
        normalizeText(title ? title.textContent : head.textContent) || "faq";
      const id = "faq-cat-" + String(pairs.length + 1).padStart(2, "0");
      head.dataset.faqCategory = id;
      list.dataset.faqCategory = id;
      pairs.push({
        id,
        label,
        head,
        list,
        title: title ? title.textContent.trim() : label,
      });
    }
    if (!pairs.length) return;

    const tools = document.createElement("div");
    tools.className = "faq-tools";
    tools.setAttribute("role", "search");
    tools.innerHTML = [
      '<div class="faq-search-box">',
      '  <label class="visually-hidden" for="faq-search-input">FAQ 검색</label>',
      '  <span class="faq-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><circle cx="11" cy="11" r="6.25"></circle><path d="m15.8 15.8 4.4 4.4"></path></svg></span>',
      '  <input id="faq-search-input" class="faq-search-input" type="search" autocomplete="off" placeholder="궁금한 내용을 검색하세요" aria-describedby="faq-search-status">',
      '  <button class="faq-search-clear" type="button" aria-label="FAQ 검색어 지우기">지우기</button>',
      "</div>",
      '<div class="faq-category-tabs" aria-label="FAQ 카테고리 필터"></div>',
      '<p class="faq-search-status" id="faq-search-status" aria-live="polite"></p>',
    ].join("");

    const tabs = tools.querySelector(".faq-category-tabs");
    const makeButton = (id, label, active = false) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "faq-category-tab";
      button.dataset.faqFilter = id;
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.textContent = label;
      return button;
    };
    tabs.appendChild(makeButton("all", "전체", true));
    pairs.forEach((pair) => tabs.appendChild(makeButton(pair.id, pair.title)));
    container.insertBefore(tools, pairs[0].head);

    const empty = document.createElement("div");
    empty.className = "faq-empty";
    empty.hidden = true;
    empty.innerHTML =
      "<strong>검색 결과가 없습니다.</strong><p>다른 키워드로 검색하거나 전체 카테고리에서 다시 확인해 주세요.</p>";
    container.insertBefore(empty, pairs[pairs.length - 1].list.nextSibling);

    const input = tools.querySelector(".faq-search-input");
    const clear = tools.querySelector(".faq-search-clear");
    const status = tools.querySelector(".faq-search-status");
    const buttons = Array.from(tools.querySelectorAll(".faq-category-tab"));
    let activeCategory = "all";

    const items = [];
    pairs.forEach((pair) => {
      Array.from(pair.list.querySelectorAll(".faq-item")).forEach((item) => {
        if (!(item instanceof HTMLElement)) return;
        const summary = item.querySelector("summary");
        const answer = Array.from(item.querySelectorAll("p, li"))
          .map((node) => node.textContent || "")
          .join(" ");
        const text = normalizeText(
          [pair.title, summary ? summary.textContent : "", answer].join(" "),
        );
        item.dataset.faqCategory = pair.id;
        item.dataset.faqText = text;
        items.push({ item, pair, text, wasOpen: item.hasAttribute("open") });
      });
    });

    const setButtonState = () => {
      buttons.forEach((button) => {
        const active = button.dataset.faqFilter === activeCategory;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    };

    const applyFilter = () => {
      const query = normalizeText(input.value);
      let visibleCount = 0;
      const visibleByCategory = new Map(pairs.map((pair) => [pair.id, 0]));

      items.forEach(({ item, pair, text, wasOpen }) => {
        const categoryMatch =
          activeCategory === "all" || pair.id === activeCategory;
        const textMatch = !query || text.includes(query);
        const visible = categoryMatch && textMatch;
        item.hidden = !visible;
        item.classList.toggle("is-faq-hidden", !visible);
        if (visible) {
          visibleCount += 1;
          visibleByCategory.set(
            pair.id,
            (visibleByCategory.get(pair.id) || 0) + 1,
          );
          if (query.length >= 2) item.setAttribute("open", "");
          else if (!wasOpen) item.removeAttribute("open");
        } else {
          item.removeAttribute("open");
        }
      });

      pairs.forEach((pair) => {
        const categoryVisible = (visibleByCategory.get(pair.id) || 0) > 0;
        pair.head.hidden = !categoryVisible;
        pair.list.hidden = !categoryVisible;
        pair.head.classList.toggle("is-faq-hidden", !categoryVisible);
        pair.list.classList.toggle("is-faq-hidden", !categoryVisible);
      });

      const total = items.length;
      empty.hidden = visibleCount > 0;
      clear.classList.toggle("is-visible", query.length > 0);
      status.textContent =
        query || activeCategory !== "all"
          ? `총 ${total}개 FAQ 중 ${visibleCount}개를 표시 중입니다.`
          : `총 ${total}개 FAQ가 카테고리별로 정리되어 있습니다.`;
      setButtonState();
    };

    input.addEventListener("input", applyFilter, { passive: true });
    clear.addEventListener("click", () => {
      input.value = "";
      input.focus();
      applyFilter();
    });
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.faqFilter || "all";
        applyFilter();
      });
    });

    applyFilter();
  };

  const initDirectionalRevealV8 = () => {
    if (root.dataset.nwScrollReveal === "ready") return;
    const body = document.body;
    if (!body) return;
    if (body.classList.contains("home")) return;
    if (body.classList.contains("nw-subpage-v2")) return;
    const pathname = window.location.pathname || "";
    const isContact =
      body.classList.contains("contact-static-page") ||
      /(?:^|\/)contact\.html(?:$|[?#])/i.test(window.location.href) ||
      /(?:^|\/)contact\.html$/i.test(pathname);
    if (isContact) return;
    root.dataset.nwScrollReveal = "ready";

    const skipSelector = [
      ".nw-logo-scroll",
      ".header",
      ".footer",
      ".mobile-menu",
      ".mobile-menu-panel",
      ".nw-floating-actions",
      ".nw-route-curtain",
      ".contact-intake-section",
      ".contact-form",
      ".inquiry-form",
      "script",
      "style",
      "noscript",
      "template",
    ].join(",");

    const selectors = [
      ".page-hero .page-hero-grid > *",
      ".page-hero .page-hero-points > *",
      "main > section:not(.nw-logo-scroll):not(.contact-intake-section) > .container > .section-head",
      "main > section:not(.nw-logo-scroll):not(.contact-intake-section) > .container > .section-header",
      ".section-actions",
      ".home-intro-card",
      ".home-intro-visual",
      ".home-signal",
      ".service-mini-card",
      ".decision-row",
      ".package-preview-band",
      ".package-preview-mini-grid > *",
      ".home-preview-collage",
      ".home-preview-list > li",
      ".process-visual-strip",
      ".home-process-step",
      ".home-final-cta-visual",
      ".service-index-card",
      ".service-map-box",
      ".package-principle-card",
      ".package-card",
      ".package-route-row",
      ".package-process-card",
      ".about-manifesto",
      ".about-stat-stack > *",
      ".about-wide-visual",
      ".about-route-card",
      ".about-method-list > article",
      ".about-lane-list > a",
      ".about-boundary-card",
      ".about-stack-table > div",
      ".kakao-channel-box",
      ".kakao-search-card",
      ".kakao-qr-card",
      ".privacy-card",
      ".not-found-card",
      ".service-detail-hero .service-detail-copy > *",
      ".service-detail-hero .service-detail-visual",
      ".detail-mobile-jump > a",
      ".service-story-card",
      ".detail-panel",
      ".detail-sidebar-box",
      ".contact-box.cta-band",
      ".faq-tools",
      ".faq-category-tabs",
      ".faq-category-head",
      ".faq-item",
    ];

    const rejectClassPart =
      /(grid|list|head|body|copy|title|desc|label|actions|nav|menu|footer|header|field|input|toggle|shortcut|business|note|meta|flow)$/i;
    const atomicClass = (el) =>
      Array.from(el.classList || []).some((name) => {
        if (rejectClassPart.test(name)) return false;
        return /(^|-)card$|(^|-)box$|(^|-)panel$|(^|-)row$|(^|-)step$|(^|-)signal$|(^|-)item$|(^|-)visual$|(^|-)band$/i.test(
          name,
        );
      });

    const candidates = [];
    const seen = new WeakSet();
    const add = (el) => {
      if (!(el instanceof HTMLElement) || seen.has(el)) return;
      if (el.closest(skipSelector)) return;
      if (el.dataset.nwReveal === "skip" || el.dataset.nwRevealState === "skip")
        return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 3 || rect.height < 3) return;
      seen.add(el);
      candidates.push(el);
    };

    document.querySelectorAll(selectors.join(",")).forEach(add);
    document.querySelectorAll("main *").forEach((el) => {
      if (atomicClass(el)) add(el);
    });

    const items = candidates.slice(0, 520);
    if (!items.length) return;

    const directions = ["bottom", "left", "right"];
    const hashText = (text) => {
      let hash = 0;
      for (let i = 0; i < text.length; i += 1)
        hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
      return Math.abs(hash);
    };
    const vh = () =>
      window.innerHeight || document.documentElement.clientHeight || 800;
    const isInFirstView = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.top < vh() * 0.9 && rect.bottom > 0;
    };

    const siblingCounts = new WeakMap();
    items.forEach((el, index) => {
      const parent = el.parentElement || body;
      const siblingIndex = siblingCounts.get(parent) || 0;
      siblingCounts.set(parent, siblingIndex + 1);
      const seed = hashText(
        [el.tagName, el.className, el.textContent.slice(0, 64), index].join(
          "|",
        ),
      );
      const direction = directions[seed % directions.length];
      el.dataset.nwRevealDirection = direction;
      el.style.setProperty(
        "--nw-reveal-delay",
        Math.min(siblingIndex * 44, 176) + "ms",
      );
      el.dataset.nwRevealState = isInFirstView(el) ? "visible" : "pending";
      if (el.dataset.nwRevealState === "visible")
        el.dataset.nwRevealComplete = "true";
    });

    body.classList.add("nw-scroll-reveal");

    const markVisible = (el) => {
      if (
        !(el instanceof HTMLElement) ||
        el.dataset.nwRevealState === "visible"
      )
        return;
      el.dataset.nwRevealState = "visible";
      window.setTimeout(() => {
        if (el.dataset.nwRevealState === "visible") {
          el.dataset.nwRevealComplete = "true";
          el.style.removeProperty("--nw-reveal-delay");
        }
      }, 980);
    };

    const refresh = () => {
      const height = vh();
      items.forEach((el) => {
        if (
          !(el instanceof HTMLElement) ||
          el.dataset.nwRevealState === "visible" ||
          el.hidden
        )
          return;
        const rect = el.getBoundingClientRect();
        if (rect.top < height * 0.9 && rect.bottom > 0) markVisible(el);
      });
    };

    if (!("IntersectionObserver" in window)) {
      items.forEach(markVisible);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          markVisible(entry.target);
        });
      },
      {
        threshold: 0.07,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    const observePending = () => {
      items.forEach((el) => {
        if (
          !(el instanceof HTMLElement) ||
          el.dataset.nwRevealState === "visible"
        )
          return;
        observer.observe(el);
      });
      refresh();
    };

    raf(() => raf(observePending));
    document.addEventListener(
      "novawork:route-enter-done",
      () => raf(observePending),
      { passive: true },
    );
    window.addEventListener("pageshow", () => raf(observePending), {
      passive: true,
    });
    window.addEventListener("resize", () => raf(refresh), { passive: true });
    window.addEventListener("scroll", () => raf(refresh), { passive: true });
    document.addEventListener(
      "input",
      (event) => {
        if (
          event.target &&
          event.target.closest &&
          event.target.closest(".faq-tools")
        )
          raf(refresh);
      },
      { passive: true },
    );
  };

  ready(() => {
    initFaqSearchV8();
    initDirectionalRevealV8();
  });
})();
