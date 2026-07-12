(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const hero = document.querySelector(".nw-logo-scroll");
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  if (
    !body ||
    !body.classList.contains("home") ||
    !hero ||
    !gsap ||
    !ScrollTrigger
  ) {
    return;
  }

  if (root.dataset.nwHomeMotion === "ready") return;
  root.dataset.nwHomeMotion = "ready";
  root.classList.add("has-gsap");
  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const lightMode = reduceMotion;
  root.classList.toggle("nw-light-motion", lightMode);
  root.classList.toggle("nw-motion-full", !lightMode);
  root.dataset.nwMotionProfile = reduceMotion ? "reduced-fade" : "full";

  const motionProfile = reduceMotion
    ? {
        introTravel: 0,
        introY: 4,
        introDuration: 0.24,
        introStagger: 0.012,
        copyDuration: 0.2,
        revealY: 4,
        revealDuration: 0.22,
        revealStagger: 0.02,
      }
    : {
        introTravel: 0.72,
        introY: 24,
        introDuration: 0.92,
        introStagger: 0.028,
        copyDuration: 0.5,
        revealY: 42,
        revealDuration: 0.78,
        revealStagger: 0.08,
      };
  const routeEntering =
    root.classList.contains("nw-route-entering") ||
    window.__NW_ROUTE_ENTERING === true;

  const pieces = gsap.utils.toArray(".nw-logo-piece");
  const stageCopy = document.querySelector(".nw-stage-copy");
  const logoLockup = document.querySelector(".nw-logo-lockup");
  const brandCopy = document.querySelector(".nw-brand-copy");
  const heroActions = document.querySelector(".nw-hero-actions");
  const heroProgress = document.querySelector(".nw-hero-progress");
  const heroProgressValue =
    heroProgress && heroProgress.querySelector(".nw-hero-progress__value");
  const heroProgressFill =
    heroProgress && heroProgress.querySelector(".nw-hero-progress__track b");
  let heroIntroTimeline = null;
  let motionInitialized = false;
  let bootStarted = false;

  const numberData = (element, key, fallback) => {
    const value = Number(element.dataset[key]);
    return Number.isFinite(value) ? value : fallback;
  };

  const setHeroProgress = (progress) => {
    const value = Math.max(0, Math.min(1, progress));
    const percent = Math.round(value * 100);
    if (heroProgressFill) gsap.set(heroProgressFill, { scaleX: value });
    if (heroProgressValue) heroProgressValue.textContent = `${percent}%`;
    if (heroProgress)
      heroProgress.setAttribute("aria-valuenow", String(percent));
  };

  const dispatchHeroReady = () => {
    hero.classList.add("is-intro-complete");
    setHeroProgress(1);
    try {
      document.dispatchEvent(new CustomEvent("novawork:hero-intro-done"));
      window.dispatchEvent(new CustomEvent("novawork:hero-intro-done"));
    } catch (error) {}
  };

  const showHeroFinal = () => {
    gsap.set(pieces, {
      autoAlpha: 1,
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      clearProps: "willChange",
    });
    gsap.set([stageCopy, brandCopy, heroActions], {
      autoAlpha: 1,
      y: 0,
      clearProps: "willChange",
    });
    dispatchHeroReady();
  };

  const playHeroIntro = (onReady) => {
    const ready = () => {
      if (typeof onReady === "function") onReady();
    };
    const shouldSkip = window.scrollY > 24 || Boolean(window.location.hash);

    if (shouldSkip) {
      showHeroFinal();
      ready();
      return;
    }

    hero.classList.add("is-intro-playing");
    setHeroProgress(0);
    gsap.set(pieces, {
      autoAlpha: 0,
      x: (index, element) =>
        numberData(element, "x", 0) * motionProfile.introTravel,
      y: (index, element) =>
        numberData(element, "y", 0) * motionProfile.introTravel,
      rotation: (index, element) =>
        reduceMotion ? 0 : numberData(element, "r", 0),
      scale: (index, element) =>
        reduceMotion ? 1 : numberData(element, "s", 0.9),
      willChange: "transform,opacity",
    });
    gsap.set(stageCopy, {
      autoAlpha: 0,
      y: motionProfile.introY,
      willChange: "transform,opacity",
    });
    gsap.set([brandCopy, heroActions], {
      autoAlpha: 0,
      y: reduceMotion ? 4 : 18,
      willChange: "transform,opacity",
    });

    try {
      document.dispatchEvent(new CustomEvent("novawork:hero-intro-start"));
      window.dispatchEvent(new CustomEvent("novawork:hero-intro-start"));
    } catch (error) {}

    const timeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      onUpdate: () => setHeroProgress(timeline.progress()),
      onComplete: () => {
        heroIntroTimeline = null;
        hero.classList.remove("is-intro-playing");
        gsap.set([...pieces, stageCopy, brandCopy, heroActions], {
          clearProps: "willChange",
        });
        dispatchHeroReady();
        ready();
      },
    });
    heroIntroTimeline = timeline;

    timeline
      .to(pieces, {
        autoAlpha: 1,
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: motionProfile.introDuration,
        stagger: { each: motionProfile.introStagger, from: "start" },
      })
      .to(
        stageCopy,
        { autoAlpha: 1, y: 0, duration: motionProfile.copyDuration },
        reduceMotion ? 0.06 : 0.38,
      )
      .to(
        brandCopy,
        { autoAlpha: 1, y: 0, duration: motionProfile.copyDuration },
        reduceMotion ? 0.1 : 0.82,
      )
      .to(
        heroActions,
        { autoAlpha: 1, y: 0, duration: motionProfile.copyDuration },
        reduceMotion ? 0.14 : 0.94,
      );
  };

  const initHeroScroll = (compact = false) => {
    if (reduceMotion || !logoLockup) return;
    gsap
      .timeline({
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: compact ? 0.82 : 0.65,
          invalidateOnRefresh: true,
        },
      })
      .to(
        logoLockup,
        {
          yPercent: compact ? -7 : -18,
          scale: compact ? 0.92 : 0.76,
          autoAlpha: compact ? 0.58 : 0.22,
          ease: "none",
        },
        0,
      )
      .to(stageCopy, { y: compact ? -24 : -70, autoAlpha: 0, ease: "none" }, 0)
      .to(
        heroActions,
        { y: compact ? 14 : 34, autoAlpha: 0, ease: "none" },
        0.08,
      );
  };

  const setCapabilityActive = (index) => {
    document
      .querySelectorAll(".nw-capability-index span")
      .forEach((item, itemIndex) => {
        item.classList.toggle("is-active", itemIndex === index);
      });
    document
      .querySelectorAll(".nw-capability-panel")
      .forEach((panel, panelIndex) => {
        panel.classList.toggle("is-active", panelIndex === index);
      });
  };

  const initCapabilities = () => {
    const section = document.querySelector(".nw-capabilities");
    const panels = gsap.utils.toArray(".nw-capability-panel");
    const progress = document.querySelector(".nw-capability-progress i");
    if (!section || panels.length < 2 || reduceMotion) return;

    gsap.set(panels, { autoAlpha: 0, yPercent: 7 });
    gsap.set(panels[0], { autoAlpha: 1, yPercent: 0 });
    setCapabilityActive(0);

    const timeline = gsap.timeline({
      paused: true,
      defaults: { ease: "none", duration: 1 },
    });
    for (let index = 1; index < panels.length; index += 1) {
      timeline
        .to(panels[index - 1], { autoAlpha: 0, yPercent: -6 }, index - 1)
        .fromTo(
          panels[index],
          { autoAlpha: 0, yPercent: 8 },
          { autoAlpha: 1, yPercent: 0 },
          index - 0.78,
        );
    }

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.55,
      animation: timeline,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const index = Math.min(
          panels.length - 1,
          Math.round(self.progress * (panels.length - 1)),
        );
        setCapabilityActive(index);
        if (progress) gsap.set(progress, { scaleX: self.progress });
      },
    });
  };

  const initServicePreview = () => {
    const links = [
      ...document.querySelectorAll(".nw-service-list a[data-service-preview]"),
    ];
    const preview = document.querySelector(".nw-service-preview");
    const image = preview && preview.querySelector("img");
    const number =
      preview && preview.querySelector(".nw-service-preview-meta span");
    const type = preview && preview.querySelector(".nw-service-preview-meta b");
    if (!links.length || !image) return;

    const fineHover = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    if (fineHover) {
      links.forEach((link) => {
        const preload = new Image();
        preload.src = link.dataset.servicePreview;
      });
    }

    const activate = (link) => {
      if (!link || link.classList.contains("is-active")) return;
      links.forEach((item) =>
        item.classList.toggle("is-active", item === link),
      );
      const updatePreview = () => {
        image.src = link.dataset.servicePreview;
        image.alt = link.dataset.serviceAlt || "NOVAWORK 서비스 화면";
        if (number) number.textContent = link.dataset.serviceNumber || "";
        if (type) type.textContent = link.dataset.serviceType || "";
      };

      gsap.killTweensOf(image);
      gsap.to(image, {
        autoAlpha: 0,
        scale: reduceMotion ? 1 : 0.975,
        duration: reduceMotion ? 0.1 : 0.18,
        ease: "power1.out",
        onComplete: () => {
          updatePreview();
          gsap.fromTo(
            image,
            { autoAlpha: 0, scale: reduceMotion ? 1 : 1.025 },
            {
              autoAlpha: 1,
              scale: 1,
              duration: reduceMotion ? 0.18 : 0.58,
              ease: "power3.out",
            },
          );
        },
      });
    };

    links.forEach((link) => {
      link.addEventListener("pointerenter", () => activate(link), {
        passive: true,
      });
      link.addEventListener("focus", () => activate(link), { passive: true });
    });
  };

  const initSectionMotion = () => {
    const revealTargets = [
      ".nw-selected-work .nw-section-intro",
      ".nw-featured-screen",
      ".nw-featured-copy",
      ".nw-services-lab .nw-section-intro",
      ".nw-services-stage",
      ".nw-secondary-services",
      ".nw-process .nw-section-intro",
      ".nw-process-list li",
      ".nw-principles .nw-section-intro",
      ".nw-principle-grid article",
    ];

    revealTargets.forEach((selector) => {
      gsap.utils.toArray(selector).forEach((element) => {
        gsap.from(element, {
          y: motionProfile.revealY,
          autoAlpha: 0,
          duration: motionProfile.revealDuration,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 88%", once: true },
        });
      });
    });

    gsap.from(".nw-home-cta .container > *", {
      y: reduceMotion ? 4 : 44,
      autoAlpha: 0,
      duration: reduceMotion ? 0.22 : 0.82,
      stagger: motionProfile.revealStagger,
      ease: "power3.out",
      scrollTrigger: { trigger: ".nw-home-cta", start: "top 72%", once: true },
    });
  };

  const initCapabilityReveals = () => {
    gsap.utils.toArray(".nw-capability-panel").forEach((panel) => {
      gsap.from(panel, {
        y: motionProfile.revealY,
        autoAlpha: 0,
        duration: motionProfile.revealDuration,
        ease: "power3.out",
        scrollTrigger: {
          trigger: panel,
          start: "top 88%",
          once: true,
        },
      });
    });
  };

  const initScrollMotion = (compact = false) => {
    if (reduceMotion) return;

    const workImage = document.querySelector(".nw-live-browser figure > img");
    if (workImage) {
      gsap.fromTo(
        workImage,
        { yPercent: compact ? -1.5 : -4, scale: compact ? 1.035 : 1.08 },
        {
          yPercent: compact ? 1.5 : 4,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: workImage,
            start: "top bottom",
            end: "bottom top",
            scrub: compact ? 0.85 : 0.7,
          },
        },
      );
    }

    const processProgress = document.querySelector(".nw-process-progress i");
    if (processProgress) {
      gsap.to(processProgress, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".nw-process-list",
          start: "top 78%",
          end: "bottom 58%",
          scrub: 0.5,
        },
      });
    }

    const marquee = document.querySelector(".nw-principles-marquee div");
    if (marquee) {
      gsap.fromTo(
        marquee,
        { xPercent: compact ? -4 : -8 },
        {
          xPercent: compact ? -18 : -38,
          ease: "none",
          scrollTrigger: {
            trigger: ".nw-principles",
            start: "top bottom",
            end: "bottom top",
            scrub: compact ? 0.9 : 0.7,
          },
        },
      );
    }
  };

  const initMotion = () => {
    if (motionInitialized) return;
    motionInitialized = true;

    gsap.context(() => {
      const media = gsap.matchMedia();

      media.add("(min-width: 901px)", () => {
        if (reduceMotion) return;
        initHeroScroll(false);
        initScrollMotion(false);
      });

      media.add("(max-width: 900px)", () => {
        if (reduceMotion) return;
        initHeroScroll(true);
        initScrollMotion(true);
      });

      media.add("(max-width: 1160px)", initCapabilityReveals);

      media.add("(min-width: 1161px)", () => {
        if (reduceMotion) initCapabilityReveals();
        else initCapabilities();
      });

      initServicePreview();
      initSectionMotion();
    }, body);

    const refresh = () => ScrollTrigger.refresh(true);
    if (document.fonts && document.fonts.ready)
      document.fonts.ready.then(refresh).catch(() => {});
    if (document.readyState === "complete")
      window.requestAnimationFrame(refresh);
    else
      window.addEventListener("load", refresh, { once: true, passive: true });
  };

  const start = () => {
    playHeroIntro(initMotion);
  };

  const startOnce = () => {
    if (bootStarted) return;
    bootStarted = true;
    start();
  };

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
      if (heroIntroTimeline) {
        heroIntroTimeline.kill();
        heroIntroTimeline = null;
      }
      hero.classList.remove("is-intro-playing");
      if (motionInitialized) {
        ScrollTrigger.refresh();
        ScrollTrigger.update();
        return;
      }
      showHeroFinal();
      initMotion();
    },
    { passive: true },
  );
})();
