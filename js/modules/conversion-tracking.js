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
      event_category: "novawork_engagement"
    }, params || {});

    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, payload);
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, payload));
  }

  function getLinkLabel(link) {
    return safeText(link.getAttribute("aria-label") || link.textContent || link.getAttribute("href"));
  }

  function bindClickTracking() {
    document.querySelectorAll('a[href]').forEach(function (link) {
      var href = link.getAttribute("href") || "";

      if (href.indexOf("tel:") === 0) {
        link.addEventListener("click", function () {
          sendEvent("click_phone", { link_text: getLinkLabel(link) });
        });
        return;
      }

      if (href.indexOf("mailto:") === 0) {
        link.addEventListener("click", function () {
          sendEvent("click_email", { link_text: getLinkLabel(link) });
        });
        return;
      }

      if (href.indexOf("contact.html") !== -1 || href.indexOf("#inquiry-form") !== -1) {
        link.addEventListener("click", function () {
          sendEvent("cta_click", {
            link_text: getLinkLabel(link),
            link_url: href
          });
        });
      }
    });
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
