window.initInquiryForm = function initInquiryForm() {
  const form = document.querySelector(".inquiry-form");

  if (!form) {
    return;
  }

  const DETAILS_MIN_LENGTH = 20;
  const TRACKING_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  const MESSAGE_SOURCE = "novawork-inquiry";

  const submitButton = form.querySelector('button[type="submit"]');
  const detailsField = form.querySelector("#details");
  const detailsCounter = form.querySelector("[data-details-count]");
  const emailField = form.querySelector("#email");
  const phoneField = form.querySelector("#phone");
  const nameField = form.querySelector("#name");
  const privacyField = form.querySelector('input[name="privacy"]');
  const honeypotField = form.querySelector('input[name="website"]');
  const serviceFields = form.querySelectorAll('input[name="service"]');
  const serviceOtherCheck = form.querySelector("#service-other-check");
  const serviceOtherField = form.querySelector("#service-other");
  const serviceOtherWrap = form.querySelector("[data-service-other-field]");
  const sourceField = form.querySelector("#source");
  const sourceDetailField = form.querySelector("#source-detail");
  const sourceDetailWrap = form.querySelector("[data-source-detail-field]");
  const iframe =
    document.querySelector('iframe[name="' + form.getAttribute("target") + '"]') ||
    document.querySelector("#form-response-frame");

  let isSubmitting = false;
  let fallbackTimer = null;
  let serverMessageReceived = false;
  const defaultButtonText = submitButton ? submitButton.textContent : "문의 접수하기";

  const createStatusBox = function () {
    let statusBox = form.querySelector(".form-status");

    if (!statusBox) {
      statusBox = document.createElement("div");
      statusBox.className = "form-status";
      statusBox.setAttribute("aria-live", "polite");
      form.appendChild(statusBox);
    }

    return statusBox;
  };

  const updateCounter = function () {
    if (!detailsField || !detailsCounter) {
      return;
    }

    const length = detailsField.value.trim().length;
    detailsCounter.textContent = length + "자 / 최소 " + DETAILS_MIN_LENGTH + "자";
  };

  const syncChoiceState = function () {
    form.querySelectorAll(".check-grid label, .radio-group label, .consent-item").forEach(function (label) {
      const input = label.querySelector('input[type="checkbox"], input[type="radio"]');
      label.classList.toggle("is-checked", Boolean(input && input.checked));
    });
  };

  const syncConditionalFields = function () {
    const showServiceOther = Boolean(serviceOtherCheck && serviceOtherCheck.checked);

    if (serviceOtherWrap) {
      serviceOtherWrap.hidden = !showServiceOther;
    }

    if (!showServiceOther && serviceOtherField) {
      serviceOtherField.value = "";
      serviceOtherField.classList.remove("is-invalid");
      serviceOtherField.removeAttribute("aria-invalid");
      serviceOtherField.removeAttribute("aria-describedby");
    }

    const sourceValue = sourceField ? sourceField.value : "";
    const showSourceDetail = ["SNS", "지인 소개", "기타"].includes(sourceValue);

    if (sourceDetailWrap) {
      sourceDetailWrap.hidden = !showSourceDetail;
    }

    if (!showSourceDetail && sourceDetailField) {
      sourceDetailField.value = "";
      sourceDetailField.classList.remove("is-invalid");
      sourceDetailField.removeAttribute("aria-invalid");
      sourceDetailField.removeAttribute("aria-describedby");
    }
  };

  const clearStatus = function () {
    const statusBox = form.querySelector(".form-status");

    if (statusBox) {
      statusBox.className = "form-status";
      statusBox.textContent = "";
    }
  };

  const clearErrors = function () {
    form.querySelectorAll(".field-error").forEach(function (node) {
      node.remove();
    });

    form.querySelectorAll(".is-invalid").forEach(function (field) {
      field.classList.remove("is-invalid");
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
    });

    clearStatus();
  };

  const getErrorId = function (field) {
    if (!field.id) {
      field.id = "field-" + Math.random().toString(36).slice(2);
    }

    return field.id + "-error";
  };

  const appendErrorToGroup = function (container, message) {
    if (!container) {
      return;
    }

    const firstField = container.querySelector('input, textarea, select');
    const error = document.createElement("p");
    const errorId = firstField ? getErrorId(firstField) : "group-error-" + Math.random().toString(36).slice(2);

    error.id = errorId;
    error.className = "field-error form-group-error";
    error.textContent = message;
    container.appendChild(error);

    if (firstField) {
      firstField.classList.add("is-invalid");
      firstField.setAttribute("aria-invalid", "true");
      firstField.setAttribute("aria-describedby", errorId);
    }
  };

  const showFieldError = function (field, message) {
    if (!field) {
      return;
    }

    const errorId = getErrorId(field);
    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", errorId);

    const error = document.createElement("p");
    error.id = errorId;
    error.className = "field-error";
    error.textContent = message;

    const targetWrap =
      field.closest(".field") ||
      field.closest(".consent-item") ||
      field.closest(".check-grid") ||
      field.closest(".radio-group") ||
      field.closest(".form-section") ||
      field.parentElement;

    targetWrap.appendChild(error);
  };

  const isValidEmail = function (value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const isValidPhone = function (value) {
    return /^[0-9+\-\s()]{8,20}$/.test(value.trim());
  };

  const hasCheckedService = function () {
    return Array.from(serviceFields).some(function (field) {
      return field.checked;
    });
  };

  const focusFirstError = function () {
    const firstErrorField = form.querySelector(".is-invalid");

    if (firstErrorField && typeof firstErrorField.focus === "function") {
      firstErrorField.focus();
      firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const setSubmitting = function (submitting) {
    if (!submitButton) {
      return;
    }

    submitButton.disabled = submitting;
    submitButton.textContent = submitting ? "전송 중..." : defaultButtonText;
  };

  const setHiddenValue = function (selector, value) {
    const field = form.querySelector(selector);

    if (field) {
      field.value = value || "";
    }
  };

  const readStoredTrackingValue = function (name) {
    try {
      return window.sessionStorage.getItem("novawork_" + name) || "";
    } catch (error) {
      return "";
    }
  };

  const writeStoredTrackingValue = function (name, value) {
    if (!value) {
      return;
    }

    try {
      window.sessionStorage.setItem("novawork_" + name, value);
    } catch (error) {
      // sessionStorage를 사용할 수 없는 환경에서는 현재 URL 값만 사용합니다.
    }
  };

  const populateTrackingFields = function () {
    const params = new URLSearchParams(window.location.search);

    TRACKING_FIELDS.forEach(function (name) {
      const value = params.get(name) || readStoredTrackingValue(name);
      writeStoredTrackingValue(name, value);
      setHiddenValue("#" + name.replace(/_/g, "-"), value);
    });

    setHiddenValue("#page-url", window.location.href);
    setHiddenValue("#page-origin", window.location.origin);
    setHiddenValue("#user-agent", window.navigator.userAgent);
    setHiddenValue("#submitted-at-client", new Date().toISOString());
  };

  const finishSuccess = function (message, resetForm) {
    if (!isSubmitting) {
      return;
    }

    const statusBox = createStatusBox();
    isSubmitting = false;

    if (fallbackTimer) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }

    statusBox.className = "form-status is-success";
    statusBox.textContent = message;
    setSubmitting(false);

    if (resetForm && window.NOVAWORKTrack && typeof window.NOVAWORKTrack.generateLead === "function") {
      const selectedServices = Array.from(serviceFields).filter(function (field) {
        return field.checked;
      });

      window.NOVAWORKTrack.generateLead({
        form_id: form.id || "inquiry-form",
        service_count: selectedServices.length,
        service_type: selectedServices[0] ? selectedServices[0].value : "미선택"
      });
    }

    if (resetForm) {
      form.reset();
      updateCounter();
      syncChoiceState();
      syncConditionalFields();
      populateTrackingFields();
    }
  };

  const finishError = function (message) {
    if (!isSubmitting) {
      return;
    }

    const statusBox = createStatusBox();
    isSubmitting = false;

    if (fallbackTimer) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }

    statusBox.className = "form-status is-error";
    statusBox.textContent = message || "전송 중 오류가 발생했습니다. 전화 또는 이메일로 문의해 주세요.";
    setSubmitting(false);
  };

  const handleSpamSubmission = function (event) {
    const statusBox = createStatusBox();

    event.preventDefault();
    form.reset();
    updateCounter();
    syncChoiceState();
    syncConditionalFields();
    populateTrackingFields();

    statusBox.className = "form-status is-success";
    statusBox.textContent = "문의가 접수되었습니다.";
  };

  const validate = function () {
    let valid = true;

    clearErrors();
    syncConditionalFields();

    if (nameField && !nameField.value.trim()) {
      showFieldError(nameField, "담당자 이름을 입력해 주세요.");
      valid = false;
    }

    const hasPhone = Boolean(phoneField && phoneField.value.trim());
    const hasEmail = Boolean(emailField && emailField.value.trim());

    if (!hasPhone && !hasEmail) {
      showFieldError(phoneField || emailField, "연락처 또는 이메일 중 하나는 입력해 주세요.");
      valid = false;
    }

    if (phoneField && hasPhone && !isValidPhone(phoneField.value)) {
      showFieldError(phoneField, "연락처 형식을 다시 확인해 주세요.");
      valid = false;
    }

    if (emailField && hasEmail && !isValidEmail(emailField.value)) {
      showFieldError(emailField, "올바른 이메일 형식을 입력해 주세요.");
      valid = false;
    }

    if (serviceFields.length > 0 && !hasCheckedService()) {
      appendErrorToGroup(serviceFields[0].closest(".check-grid"), "필요한 서비스를 하나 이상 선택해 주세요.");
      valid = false;
    }

    if (serviceOtherCheck && serviceOtherCheck.checked && serviceOtherField && !serviceOtherField.value.trim()) {
      showFieldError(serviceOtherField, "기타 서비스 내용을 입력해 주세요.");
      valid = false;
    }

    if (detailsField && detailsField.value.trim().length < DETAILS_MIN_LENGTH) {
      showFieldError(detailsField, "프로젝트 내용을 최소 " + DETAILS_MIN_LENGTH + "자 이상 입력해 주세요.");
      valid = false;
    }

    if (sourceField && sourceField.value === "기타" && sourceDetailField && !sourceDetailField.value.trim()) {
      showFieldError(sourceDetailField, "기타 유입 경로를 입력해 주세요.");
      valid = false;
    }

    if (privacyField && !privacyField.checked) {
      showFieldError(privacyField, "개인정보 수집 및 이용 동의는 필수입니다.");
      valid = false;
    }

    return valid;
  };

  form.addEventListener("submit", function (event) {
    const statusBox = createStatusBox();

    populateTrackingFields();

    if (honeypotField && honeypotField.value.trim()) {
      handleSpamSubmission(event);
      return;
    }

    if (!validate()) {
      event.preventDefault();
      statusBox.className = "form-status is-error";
      statusBox.textContent = "입력한 내용을 다시 확인해 주세요.";
      focusFirstError();
      return;
    }

    isSubmitting = true;
    serverMessageReceived = false;
    setSubmitting(true);
    statusBox.className = "form-status";
    statusBox.textContent = "문의 내용을 전송하고 있습니다.";

    if (fallbackTimer) {
      window.clearTimeout(fallbackTimer);
    }

    fallbackTimer = window.setTimeout(function () {
      if (!serverMessageReceived) {
        finishError("전송 확인이 지연되고 있습니다. 중복 제출하지 마시고, 24시간 내 답변이 없으면 전화 또는 이메일로 확인해 주세요.");
      }
    }, 15000);
  });

  window.addEventListener("message", function (event) {
    const data = event.data || {};

    if (!data || data.source !== MESSAGE_SOURCE || !isSubmitting) {
      return;
    }

    serverMessageReceived = true;

    if (data.status === "success") {
      finishSuccess(data.message || "문의가 접수되었습니다. 24시간 내 1차 답변을 드리겠습니다.", true);
      return;
    }

    finishError(data.message || "전송 중 오류가 발생했습니다. 전화 또는 이메일로 문의해 주세요.");
  });

  if (iframe) {
    iframe.addEventListener("load", function () {
      // Google Apps Script는 중간 프레임을 먼저 로드한 뒤 실제 HtmlService 응답을 실행할 수 있습니다.
      // iframe load 자체만으로 성공/실패를 판단하면 정상 접수 중에도 오류가 표시될 수 있으므로,
      // 최종 판단은 postMessage 또는 15초 fallbackTimer에 맡깁니다.
    });
  }

  form.querySelectorAll("input, textarea, select").forEach(function (field) {
    const eventName = field.type === "checkbox" || field.type === "radio" || field.tagName === "SELECT" ? "change" : "input";

    field.addEventListener(eventName, function () {
      if (field.classList.contains("is-invalid")) {
        field.classList.remove("is-invalid");
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
      }

      const fieldWrap = field.closest(".field") || field.closest(".consent-item");
      const fieldError = fieldWrap ? fieldWrap.querySelector(".field-error") : null;
      const groupError =
        (field.closest(".check-grid") && field.closest(".check-grid").querySelector(".form-group-error")) ||
        (field.closest(".radio-group") && field.closest(".radio-group").querySelector(".form-group-error"));

      if (fieldError) {
        fieldError.remove();
      }

      if (groupError) {
        groupError.remove();
      }

      clearStatus();
      updateCounter();
      syncChoiceState();
      syncConditionalFields();
    });
  });

  populateTrackingFields();
  updateCounter();
  syncChoiceState();
  syncConditionalFields();
};
