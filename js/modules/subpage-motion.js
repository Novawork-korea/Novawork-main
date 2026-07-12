(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  if (!body || !body.classList.contains("nw-subpage-v2")) return;
  if (root.dataset.nwSubpageMotion === "ready") return;
  root.dataset.nwSubpageMotion = "ready";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const lightMode = reduceMotion;
  root.classList.toggle("nw-light-motion", lightMode);
  root.classList.toggle("nw-motion-full", !lightMode);
  root.dataset.nwMotionProfile = reduceMotion ? "reduced-fade" : "full";

  const motionProfile = reduceMotion
    ? {
        introY: 4,
        introDuration: 0.22,
        introStagger: 0.018,
        visualY: 4,
        visualScale: 1,
        visualDuration: 0.24,
        revealY: 4,
        revealDuration: 0.22,
        revealStagger: 0.018,
      }
    : {
        introY: 30,
        introDuration: 0.72,
        introStagger: 0.055,
        visualY: 34,
        visualScale: 0.975,
        visualDuration: 0.9,
        revealY: 38,
        revealDuration: 0.78,
        revealStagger: 0.06,
      };

  const setCurrentNavigation = () => {
    const currentFile = (
      window.location.pathname.split("/").pop() || "index.html"
    )
      .split("?")[0]
      .split("#")[0];
    const current = currentFile.startsWith("service-")
      ? "services.html"
      : currentFile;
    document
      .querySelectorAll(".nav-link[href], .mobile-menu a[href]")
      .forEach((link) => {
        const href = (link.getAttribute("href") || "")
          .split("?")[0]
          .split("#")[0];
        const active = href === current || href === currentFile;
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
  };

  const createPageProgress = () => {
    const progress = document.createElement("div");
    progress.className = "nw-page-progress";
    progress.setAttribute("aria-hidden", "true");
    progress.innerHTML = "<i></i>";
    body.appendChild(progress);
    const fill = progress.querySelector("i");
    let ticking = false;

    const update = () => {
      ticking = false;
      const distance = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const value = Math.max(0, Math.min(1, window.scrollY / distance));
      fill.style.transform = `scaleX(${value})`;
    };

    const request = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    window.addEventListener("pageshow", request, { passive: true });
    update();
  };

  setCurrentNavigation();
  createPageProgress();

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) {
    root.classList.add("nw-subpage-static");
    return;
  }

  root.classList.add("has-subpage-gsap");
  gsap.registerPlugin(ScrollTrigger);

  let initialized = false;
  let bootStarted = false;
  let introTimeline = null;

  const getHero = () =>
    document.querySelector(
      ".page-hero, .service-detail-hero, .nw-subpage-hero, .not-found-section",
    );

  const playHeroIntro = (onComplete) => {
    const hero = getHero();
    if (!hero || window.scrollY > 24 || window.location.hash) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    const copyTargets = [
      ...hero.querySelectorAll(
        ".breadcrumb, .section-label, h1, .section-desc, .page-hero-desc, .nw-proof-note, .service-detail-lead, .service-detail-summary, .page-hero-points, .service-detail-actions, .not-found-actions, .not-found-card > p, .nw-contact-hero-grid > div:first-child > p:last-child",
      ),
    ];
    const visual = hero.querySelector(
      ".page-hero-visual, .abstract-hero-card, .hero-service-mosaic, .service-detail-visual, .nw-contact-hero-art",
    );

    gsap.set(copyTargets, {
      autoAlpha: 0,
      y: motionProfile.introY,
      willChange: "transform,opacity",
    });
    if (visual) {
      gsap.set(visual, {
        autoAlpha: 0,
        y: motionProfile.visualY,
        scale: motionProfile.visualScale,
        willChange: "transform,opacity",
      });
    }

    introTimeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => {
        introTimeline = null;
        gsap.set([...copyTargets, visual].filter(Boolean), {
          clearProps: "willChange",
        });
        if (typeof onComplete === "function") onComplete();
      },
    });

    introTimeline.to(copyTargets, {
      autoAlpha: 1,
      y: 0,
      duration: motionProfile.introDuration,
      stagger: motionProfile.introStagger,
    });
    if (visual) {
      introTimeline.to(
        visual,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: motionProfile.visualDuration,
        },
        reduceMotion ? 0.04 : 0.1,
      );
    }
  };

  const initReveals = () => {
    const singleTargets = gsap.utils.toArray(
      [
        "main > .section > .container > .section-head",
        ".about-manifesto-main",
        ".about-wide-visual",
        ".about-method-copy",
        ".about-process-copy",
        ".service-story-card",
        ".service-map-box",
        ".package-process-card",
        ".nw-compare-table-wrap",
        ".pricing-table-wrap",
        ".contact-box",
        ".kakao-channel-box",
        ".contact-form",
        ".faq-tools",
      ].join(","),
    );

    singleTargets.forEach((element) => {
      gsap.from(element, {
        y: motionProfile.revealY,
        autoAlpha: 0,
        duration: motionProfile.revealDuration,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          once: true,
        },
      });
    });

    const batchTargets = gsap.utils.toArray(
      [
        ".about-route-card",
        ".about-stat-stack > article",
        ".about-method-list > article",
        ".about-lane-list > a",
        ".about-boundary-card",
        ".about-stack-table > div",
        ".nw-situation-card",
        ".service-index-card",
        ".package-principle-card",
        ".package-card",
        ".package-route-row",
        ".nw-aftercare-card",
        ".nw-portfolio-card",
        ".detail-panel",
        ".nw-fit-card",
        ".nw-checklist-card",
        ".nw-deliverable-card",
        ".nw-estimate-card",
        ".privacy-card",
        ".faq-category-head",
        ".faq-list",
      ].join(","),
    );

    ScrollTrigger.batch(batchTargets, {
      start: "top 91%",
      once: true,
      interval: 0.08,
      batchMax: 4,
      onEnter: (batch) => {
        gsap.from(batch, {
          y: reduceMotion ? 4 : 30,
          autoAlpha: 0,
          duration: reduceMotion ? 0.22 : 0.68,
          stagger: motionProfile.revealStagger,
          ease: "power3.out",
          overwrite: true,
        });
      },
    });
  };

  const initParallax = ({ distance, scale, scrub }) => {
    if (reduceMotion) return;
    const images = gsap.utils.toArray(
      ".page-hero-visual img, .hero-service-mosaic img, .service-detail-visual img, .about-wide-visual img, .service-story-visual img",
    );
    images.forEach((image) => {
      gsap.fromTo(
        image,
        { yPercent: -distance, scale },
        {
          yPercent: distance,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: image,
            start: "top bottom",
            end: "bottom top",
            scrub,
          },
        },
      );
    });
  };

  const initMotion = () => {
    if (initialized) return;
    initialized = true;

    gsap.context(() => {
      initReveals();
      const media = gsap.matchMedia();
      media.add("(min-width: 901px)", () =>
        initParallax({ distance: 3, scale: 1.045, scrub: 0.65 }),
      );
      media.add("(max-width: 900px)", () =>
        initParallax({ distance: 1.25, scale: 1.018, scrub: 0.85 }),
      );
    }, body);

    const refresh = () => ScrollTrigger.refresh(true);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refresh).catch(() => {});
    }
    if (document.readyState === "complete") {
      window.requestAnimationFrame(refresh);
    } else {
      window.addEventListener("load", refresh, { once: true, passive: true });
    }
  };

  const startOnce = () => {
    if (bootStarted) return;
    bootStarted = true;
    playHeroIntro(initMotion);
  };

  const routeEntering =
    root.classList.contains("nw-route-entering") ||
    window.__NW_ROUTE_ENTERING === true;

  if (routeEntering) {
    document.addEventListener("novawork:route-enter-done", startOnce, {
      once: true,
    });
    window.setTimeout(startOnce, 900);
  } else {
    startOnce();
  }

  window.addEventListener(
    "pageshow",
    (event) => {
      if (!event.persisted) return;
      bootStarted = true;
      if (introTimeline) {
        introTimeline.kill();
        introTimeline = null;
        const hero = getHero();
        if (hero) {
          const targets = hero.querySelectorAll(
            ".breadcrumb, .section-label, h1, .section-desc, .page-hero-desc, .nw-proof-note, .service-detail-lead, .service-detail-summary, .page-hero-points, .service-detail-actions, .not-found-actions, .not-found-card > p, .nw-contact-hero-grid > div:first-child > p:last-child, .page-hero-visual, .abstract-hero-card, .hero-service-mosaic, .service-detail-visual, .nw-contact-hero-art",
          );
          gsap.set(targets, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            clearProps: "willChange",
          });
        }
      }
      if (initialized) {
        ScrollTrigger.refresh();
        ScrollTrigger.update();
      } else {
        initMotion();
      }
    },
    { passive: true },
  );
})();
