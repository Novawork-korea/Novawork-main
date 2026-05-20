(function () {
  "use strict";

  function safeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, 80);
  }

  function storeTrackingParams() {
    var params = new URLSearchParams(window.location.search);
    var names = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

    names.forEach(function (name) {
      var value = params.get(name);

      if (!value) {
        return;
      }

      try {
        window.sessionStorage.setItem("novawork_" + name, safeText(value));
      } catch (error) {
        // sessionStorage를 사용할 수 없는 환경에서는 저장하지 않습니다.
      }
    });
  }

  function sendEvent(eventName, params) {
    var payload = Object.assign({
      event_category: "novawork_engagement",
      page_path: window.location.pathname || "/"
    }, params || {});

    // GA4 이벤트는 사이트 코드에서 직접 gtag로 보내지 않고,
    // dataLayer → GTM → GA4 Event Tag 흐름으로만 전송합니다.
    // 이렇게 해야 직접 gtag 전송과 GTM 전송의 중복 수집을 피할 수 있습니다.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, payload));
  }

  function getLinkLabel(link) {
    return safeText(link.getAttribute("aria-label") || link.textContent || "");
  }

  function getLinkArea(link) {
    if (link.closest(".mobile-menu")) {
      return "mobile_menu";
    }

    if (link.closest(".header")) {
      return "header";
    }

    if (link.closest(".footer")) {
      return "footer";
    }

    if (link.closest(".quick-contact")) {
      return "quick_contact";
    }

    if (link.closest(".hero")) {
      return "hero";
    }

    if (link.closest("main")) {
      return "content";
    }

    return "unknown";
  }

  function getCtaDestination(href) {
    if (href.indexOf("#inquiry-form") !== -1) {
      return "inquiry_form";
    }

    if (href.indexOf("contact.html") !== -1) {
      return "contact_page";
    }

    return "other";
  }

  function trackLinkClick(link) {
    var href = link.getAttribute("href") || "";
    var label = getLinkLabel(link);
    var area = getLinkArea(link);

    if (href.indexOf("tel:") === 0) {
      // 전화번호 자체는 GA4로 보내지 않습니다. 클릭 행동만 측정합니다.
      sendEvent("click_phone", {
        method: "phone",
        link_area: area
      });
      return;
    }

    if (href.indexOf("mailto:") === 0) {
      // 이메일 주소 자체는 GA4로 보내지 않습니다. 클릭 행동만 측정합니다.
      sendEvent("click_email", {
        method: "email",
        link_area: area
      });
      return;
    }

    if (href.indexOf("pf.kakao.com") !== -1) {
      sendEvent("click_kakao", {
        method: "kakao",
        link_text: label || "kakao_channel",
        link_area: area
      });
      return;
    }

    if (href.indexOf("contact.html") !== -1 || href.indexOf("#inquiry-form") !== -1) {
      sendEvent("cta_click", {
        link_text: label,
        link_area: area,
        destination: getCtaDestination(href)
      });
    }
  }

  function bindClickTracking() {
    if (document.documentElement.dataset.novaworkClickTrackingReady === "true") {
      return;
    }

    document.documentElement.dataset.novaworkClickTrackingReady = "true";

    document.addEventListener("click", function (event) {
      var link = event.target && event.target.closest
        ? event.target.closest("a[href]")
        : null;

      if (!link) {
        return;
      }

      trackLinkClick(link);
    }, { passive: true });
  }

  function bindFormStartTracking() {
    var form = document.querySelector(".inquiry-form");
    var hasStarted = false;

    if (!form) {
      return;
    }

    form.addEventListener("input", function () {
      if (hasStarted) {
        return;
      }

      hasStarted = true;
      sendEvent("contact_form_start", {
        form_id: form.id || "inquiry-form"
      });
    }, { passive: true });
  }

  window.NOVAWORKTrack = {
    event: sendEvent,
    generateLead: function (params) {
      sendEvent("generate_lead", Object.assign({
        lead_source: "contact_form",
        method: "contact_form"
      }, params || {}));
    }
  };

  storeTrackingParams();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bindClickTracking();
      bindFormStartTracking();
    }, { once: true });
  } else {
    bindClickTracking();
    bindFormStartTracking();
  }
})();
