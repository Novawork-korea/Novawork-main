/* NOVAWORK: optional motion and small, progressively enhanced interactions.
 * No route interception, remote dependencies, or personal data are used here.
 */
(function () {
  'use strict';

  function init() {
    const body = document.body;
    if (!body || body.dataset.nwMotionReady === 'true') return;
    body.dataset.nwMotionReady = 'true';

    const query = (selector) => document.querySelector(selector);
    const all = (selector) => Array.from(document.querySelectorAll(selector));
    const clamp = (number, minimum, maximum) => Math.min(maximum, Math.max(minimum, number));
    const systemMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const preferenceKey = 'novawork.motion.preference';
    const motionButtons = all('.motion-toggle');
    const header = query('.site-header');
    const progress = query('.scroll-progress');
    const parallaxItems = all('[data-parallax]');
    const visualCards = all('.visual-card');
    const revealItems = all('[data-reveal]');
    let preference = null;
    let paused = false;
    let scrollFrame = 0;
    let tiltFrame = 0;
    let pendingTilt = null;
    let observer = null;
    let revealFallback = 0;

    // Storage may be unavailable in private browsing. The site still works.
    try {
      const stored = window.localStorage.getItem(preferenceKey);
      if (stored === 'reduced' || stored === 'full') preference = stored;
    } catch (_) { /* The OS preference remains the default. */ }

    function showAllContent() {
      if (observer) observer.disconnect();
      observer = null;
      window.clearTimeout(revealFallback);
      revealItems.forEach((element) => {
        element.classList.remove('reveal-ready');
        element.classList.add('revealed');
      });
    }

    function resetTilt() {
      if (tiltFrame) window.cancelAnimationFrame(tiltFrame);
      tiltFrame = 0;
      pendingTilt = null;
      visualCards.forEach((element) => {
        element.style.setProperty('--tilt-x', '0deg');
        element.style.setProperty('--tilt-y', '0deg');
      });
    }

    function updateScroll() {
      scrollFrame = 0;
      if (document.hidden) return;
      const top = Math.max(0, window.scrollY || 0);
      if (header) header.classList.toggle('is-scrolled', top > 16);
      if (progress) {
        const range = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = 'scaleX(' + (range > 0 ? clamp(top / range, 0, 1) : 0) + ')';
      }
      parallaxItems.forEach((element) => {
        let offset = 0;
        if (!paused) {
          const rect = element.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < window.innerHeight) {
            offset = clamp((window.innerHeight / 2 - rect.top - rect.height / 2) * 0.065, -22, 22);
          }
        }
        element.style.setProperty('--parallax-y', offset.toFixed(2) + 'px');
      });
    }

    function scheduleScroll() {
      // One frame per input burst; there is no perpetual animation loop.
      if (!scrollFrame && !document.hidden) scrollFrame = window.requestAnimationFrame(updateScroll);
    }

    function applyMotionPreference() {
      // An explicit visitor choice takes precedence over the OS default.
      paused = preference ? preference === 'reduced' : systemMotion.matches;
      document.documentElement.classList.toggle('motion-full', preference === 'full');
      body.classList.toggle('motion-paused', paused);
      motionButtons.forEach((button) => {
        button.setAttribute('aria-pressed', String(paused));
        const label = paused ? '동작 켜기' : '동작 줄이기';
        const labelElement = button.querySelector('[data-motion-label]');
        if (labelElement) labelElement.textContent = label;
        else button.textContent = label;
        button.setAttribute('aria-label', label);
      });
      if (paused) {
        showAllContent();
        resetTilt();
      }
      scheduleScroll();
    }

    motionButtons.forEach((button) => {
      button.addEventListener('click', () => {
        preference = paused ? 'full' : 'reduced';
        try { window.localStorage.setItem(preferenceKey, preference); } catch (_) { /* Optional preference. */ }
        applyMotionPreference();
      });
    });
    if (systemMotion.addEventListener) systemMotion.addEventListener('change', applyMotionPreference);
    else systemMotion.addListener(applyMotionPreference);

    // Nothing is hidden unless an observer was successfully created. A finite
    // fallback releases every item, even if observer delivery stops unexpectedly.
    applyMotionPreference();
    if (!paused && 'IntersectionObserver' in window && revealItems.length) {
      try {
        observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('revealed');
            if (observer) observer.unobserve(entry.target);
          });
        }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
        revealItems.forEach((element) => {
          const parsedDelay = Number.parseInt(element.dataset.delay || '0', 10);
          element.style.setProperty('--reveal-delay', clamp(Number.isFinite(parsedDelay) ? parsedDelay : 0, 0, 500) + 'ms');
          element.classList.add('reveal-ready');
          observer.observe(element);
        });
        revealFallback = window.setTimeout(showAllContent, 15000);
      } catch (_) { showAllContent(); }
    } else {
      showAllContent();
    }

    // Keyboard focus always reveals its containing section immediately.
    document.addEventListener('focusin', (event) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest('[data-reveal]');
      if (element) element.classList.add('revealed');
    });

    visualCards.forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        if (paused || document.hidden || !finePointer.matches || event.pointerType === 'touch') return;
        pendingTilt = { element: element, x: event.clientX, y: event.clientY };
        if (tiltFrame) return;
        tiltFrame = window.requestAnimationFrame(() => {
          tiltFrame = 0;
          if (!pendingTilt || paused || document.hidden) return;
          const item = pendingTilt;
          pendingTilt = null;
          const rect = item.element.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          item.element.style.setProperty('--tilt-x', (-clamp((item.y - rect.top) / rect.height - 0.5, -0.5, 0.5) * 5).toFixed(2) + 'deg');
          item.element.style.setProperty('--tilt-y', (clamp((item.x - rect.left) / rect.width - 0.5, -0.5, 0.5) * 6).toFixed(2) + 'deg');
        });
      }, { passive: true });
      element.addEventListener('pointerleave', resetTilt, { passive: true });
      element.addEventListener('pointercancel', resetTilt, { passive: true });
    });
    if (finePointer.addEventListener) finePointer.addEventListener('change', resetTilt);

    const menuButton = query('.menu-toggle');
    const mobileNav = query('#mobile-nav');
    const mobileLayout = window.matchMedia('(max-width: 760px)');
    let menuOpen = false;
    let savedOverflow = null;
    let inertElements = [];
    let menuBackdrop = null;
    let menuViewportFrame = 0;
    let lastMenuTouch = null;

    function focusWithoutScroll(element) {
      if (!element) return;
      try { element.focus({ preventScroll: true }); }
      catch (_) { element.focus(); }
    }

    function syncMenuViewport() {
      menuViewportFrame = 0;
      if (!menuOpen || !mobileNav) return;
      // The keyboard/address bar can resize only the visual viewport on iOS.
      const viewport = window.visualViewport;
      const viewportHeight = viewport ? viewport.height : window.innerHeight;
      const visibleBottom = (viewport ? viewport.offsetTop : 0) + viewportHeight;
      const available = clamp(visibleBottom - mobileNav.getBoundingClientRect().top, 0, viewportHeight);
      mobileNav.style.setProperty('--menu-available-height', Math.floor(available) + 'px');
    }

    function scheduleMenuViewport() {
      if (menuOpen && !menuViewportFrame) menuViewportFrame = window.requestAnimationFrame(syncMenuViewport);
    }

    function restoreScroll() {
      if (!savedOverflow) return;
      savedOverflow.forEach((saved) => {
        if (saved.value) saved.element.style.setProperty(saved.property, saved.value, saved.priority);
        else saved.element.style.removeProperty(saved.property);
      });
      savedOverflow = null;
    }

    function onMenuTouchStart(event) {
      lastMenuTouch = event.touches.length === 1
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
    }

    function onMenuTouchMove(event) {
      // Keep pinch zoom available. Only a single-finger background/edge drag
      // is canceled; normal movement inside a scrollable menu remains native.
      if (!menuOpen || event.touches.length !== 1 || !lastMenuTouch) return;
      const touch = event.touches[0];
      const deltaX = touch.clientX - lastMenuTouch.x;
      const deltaY = touch.clientY - lastMenuTouch.y;
      lastMenuTouch = { x: touch.clientX, y: touch.clientY };
      const inside = event.target instanceof Element && mobileNav.contains(event.target);
      const maximum = Math.max(0, mobileNav.scrollHeight - mobileNav.clientHeight);
      const canScroll = inside && maximum > 1 && Math.abs(deltaY) > Math.abs(deltaX)
        && ((deltaY > 0 && mobileNav.scrollTop > 0)
          || (deltaY < 0 && mobileNav.scrollTop < maximum - 1));
      if (!canScroll && event.cancelable) event.preventDefault();
    }

    function clearMenuTouch() { lastMenuTouch = null; }

    function closeMenu(returnFocus) {
      // Release our locks unconditionally, including pagehide/bfcache recovery.
      menuOpen = false;
      document.removeEventListener('touchstart', onMenuTouchStart, true);
      document.removeEventListener('touchmove', onMenuTouchMove, true);
      document.removeEventListener('touchend', clearMenuTouch, true);
      document.removeEventListener('touchcancel', clearMenuTouch, true);
      clearMenuTouch();
      if (menuViewportFrame) window.cancelAnimationFrame(menuViewportFrame);
      menuViewportFrame = 0;
      restoreScroll();
      body.classList.remove('menu-open');
      inertElements.forEach((saved) => {
        if (!saved.hadInert) saved.element.removeAttribute('inert');
      });
      inertElements = [];
      if (mobileNav) {
        mobileNav.hidden = true;
        mobileNav.style.removeProperty('--menu-available-height');
      }
      if (menuBackdrop) menuBackdrop.hidden = true;
      if (menuButton) {
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', '메뉴 열기');
        if (returnFocus && menuButton.getClientRects().length) focusWithoutScroll(menuButton);
      }
    }

    function menuFocusables() {
      if (!mobileNav || !menuButton) return [];
      return [menuButton].concat(Array.from(mobileNav.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')))
        .filter((element) => element.getClientRects().length && element.getAttribute('aria-hidden') !== 'true');
    }

    function openMenu(fromKeyboard) {
      if (!mobileNav || !menuButton || menuOpen || !mobileLayout.matches || !menuButton.getClientRects().length) return;
      menuOpen = true;
      mobileNav.hidden = false;
      if (menuBackdrop) menuBackdrop.hidden = false;
      menuButton.setAttribute('aria-expanded', 'true');
      menuButton.setAttribute('aria-label', '메뉴 닫기');
      body.classList.add('menu-open');
      // Lock only the root scrollport. Setting body overflow creates a new
      // scrolling ancestor and pulls the sticky header offscreen on long pages.
      // Preserve each root longhand and leave body layout/overflow untouched.
      const root = document.documentElement;
      savedOverflow = ['overflow-x', 'overflow-y'].map((property) => ({
        element: root, property: property,
        value: root.style.getPropertyValue(property),
        priority: root.style.getPropertyPriority(property)
      }));
      savedOverflow.forEach((saved) => saved.element.style.setProperty(saved.property, 'hidden'));
      inertElements = all('main, footer').filter((element) => !element.contains(mobileNav) && !element.contains(menuButton))
        .map((element) => ({ element: element, hadInert: element.hasAttribute('inert') }));
      inertElements.forEach((saved) => saved.element.setAttribute('inert', ''));
      // Overflow locking alone has Safari edge-drag gaps; attach a scoped
      // non-passive guard only while the menu is open, never during page use.
      document.addEventListener('touchstart', onMenuTouchStart, { capture: true, passive: true });
      document.addEventListener('touchmove', onMenuTouchMove, { capture: true, passive: false });
      document.addEventListener('touchend', clearMenuTouch, { capture: true, passive: true });
      document.addEventListener('touchcancel', clearMenuTouch, { capture: true, passive: true });
      const firstLink = menuFocusables().find((element) => element !== menuButton);
      // Pointer activation keeps focus on the toggle and dismisses a form
      // keyboard without jumping to a distant link in the menu.
      focusWithoutScroll(fromKeyboard && firstLink ? firstLink : menuButton);
      syncMenuViewport();
      scheduleMenuViewport();
    }

    if (menuButton && mobileNav) {
      // A box-shadow cannot receive an outside tap. Use a real, non-focusable
      // backdrop under the header instead; the header's close control remains available.
      menuBackdrop = query('.menu-backdrop');
      if (!menuBackdrop) {
        menuBackdrop = document.createElement('div');
        menuBackdrop.className = 'menu-backdrop';
        menuBackdrop.setAttribute('aria-hidden', 'true');
        menuBackdrop.hidden = true;
        body.appendChild(menuBackdrop);
      }
      closeMenu(false);
      menuButton.addEventListener('click', (event) => {
        if (menuOpen) closeMenu(true);
        else openMenu(event.detail === 0);
      });
      menuBackdrop.addEventListener('click', () => closeMenu(true));
      mobileNav.addEventListener('click', (event) => {
        if (event.target instanceof Element && event.target.closest('a[href]')) closeMenu(false);
      });
      document.addEventListener('keydown', (event) => {
        if (!menuOpen) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          closeMenu(true);
          return;
        }
        if (event.key !== 'Tab') return;
        const focusables = menuFocusables();
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const outside = !focusables.includes(document.activeElement);
        if (event.shiftKey && (document.activeElement === first || outside)) {
          event.preventDefault();
          focusWithoutScroll(last);
        } else if (!event.shiftKey && (document.activeElement === last || outside)) {
          event.preventDefault();
          focusWithoutScroll(first);
        }
      });
      const onLayoutChange = () => {
        if (!mobileLayout.matches) closeMenu(false);
        else scheduleMenuViewport();
      };
      if (mobileLayout.addEventListener) mobileLayout.addEventListener('change', onLayoutChange);
      else mobileLayout.addListener(onLayoutChange);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', scheduleMenuViewport, { passive: true });
        window.visualViewport.addEventListener('scroll', scheduleMenuViewport, { passive: true });
      }
      window.addEventListener('pagehide', () => closeMenu(false));
      window.addEventListener('pageshow', (event) => {
        // Initial pageshow can arrive AFTER a visitor's first tap on a slow
        // connection. Only restored documents need a forced state reset.
        if (event.persisted) closeMenu(false);
        scheduleScroll();
      });
    }

    window.addEventListener('scroll', scheduleScroll, { passive: true });
    window.addEventListener('resize', () => {
      if (menuOpen && !mobileLayout.matches) closeMenu(false);
      else scheduleMenuViewport();
      resetTilt();
      scheduleScroll();
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      body.classList.toggle('page-inactive', document.hidden);
      if (document.hidden) {
        if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
        scrollFrame = 0;
        resetTilt();
      } else scheduleScroll();
    });

    const filterButtons = all('[data-filter]');
    const filterCards = all('[data-category]');
    const filterStatus = query('#filter-status');
    const allowedFilters = new Set(['all', 'web', 'system', 'data']);
    if (filterStatus && !filterStatus.hasAttribute('aria-live')) filterStatus.setAttribute('aria-live', 'polite');
    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        if (!allowedFilters.has(filter)) return;
        filterButtons.forEach((item) => {
          const selected = item === button;
          item.setAttribute('aria-pressed', String(selected));
          item.classList.toggle('is-active', selected);
        });
        let visible = 0;
        filterCards.forEach((card) => {
          const categories = (card.dataset.category || '').split(/[\s,]+/);
          const show = filter === 'all' || categories.includes(filter);
          card.hidden = !show;
          if (show) { visible += 1; card.classList.add('revealed'); }
        });
        if (filterStatus) filterStatus.textContent = visible + '개의 서비스를 보고 있어요.';
        scheduleScroll();
      });
    });

    // Push fixed, non-personal labels only. Never push URLs, form text, phone
    // numbers, email addresses, or the visitor's query string to analytics.
    const serviceLabels = {
      'service-homepage-landing.html': 'homepage_landing',
      'service-react-firebase-admin.html': 'web_system',
      'service-homepage-fix.html': 'website_improvement',
      'service-ga4-gtm.html': 'analytics',
      'service-gpt-ai-chatbot.html': 'ai_chatbot',
      'service-web-crawling.html': 'data_automation'
    };
    const navLabels = {
      'index.html': 'home', '': 'home', 'services.html': 'services',
      'portfolio.html': 'work', 'about.html': 'about', 'faq.html': 'faq'
    };
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest('a[href]');
      if (!link) return;
      let parsed;
      try { parsed = new URL(link.href, window.location.href); } catch (_) { return; }
      const name = parsed.pathname.split('/').pop();
      let eventName;
      let label;
      if (parsed.protocol === 'mailto:') {
        eventName = 'contact_click'; label = 'email';
      } else if (parsed.hostname === 'kmong.com' || parsed.hostname.endsWith('.kmong.com')) {
        eventName = 'contact_click'; label = 'kmong';
      } else if (parsed.origin === window.location.origin) {
        if (name === 'contact.html' || parsed.hash === '#contact') {
          eventName = 'contact_click'; label = 'project_consultation';
        } else if (serviceLabels[name]) {
          eventName = 'service_click'; label = serviceLabels[name];
        } else if (Object.prototype.hasOwnProperty.call(navLabels, name)) {
          eventName = 'nav_click'; label = parsed.hash === '#services' ? 'services' : navLabels[name];
        }
      }
      if (!eventName) return;
      const location = link.closest('header') ? 'header' : link.closest('footer') ? 'footer' : 'content';
      try {
        window.dataLayer = window.dataLayer || [];
        if (typeof window.dataLayer.push === 'function') window.dataLayer.push({ event: eventName, label: label, location: location });
      } catch (_) { /* Analytics never blocks navigation. */ }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
