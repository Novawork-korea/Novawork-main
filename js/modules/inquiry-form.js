window.initInquiryForm = function initInquiryForm() {
  const form = document.querySelector(".inquiry-form");

  if (!form) {
    return;
  }

  const DETAILS_MIN_LENGTH = 20;
  const TRACKING_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  const MESSAGE_SOURCE = "novawork-inquiry";
  const CONTACT_EMAIL = "contact@novawork.kr";
  const KAKAO_URL = "https://pf.kakao.com/_xhDLjX";
  const SERVICE_PREP_GUIDES = {
    "homepage-landing": {
      value: "홈페이지·랜딩페이지 제작",
      title: "홈페이지·랜딩페이지 제작 문의 준비자료",
      desc: "대표 링크와 문의 동선을 만들기 위해 필요한 기본 자료입니다.",
      items: ["브랜드명/서비스명", "기본 소개 문구", "서비스·상품 설명", "로고와 대표 이미지", "전화·이메일·카카오톡·SNS 링크", "참고 사이트 1~3개"]
    },
    "react-firebase-admin": {
      value: "React·Firebase 관리자 웹시스템",
      title: "React·Firebase 웹시스템 문의 준비자료",
      desc: "저장할 데이터와 관리자가 처리할 흐름을 먼저 확인합니다.",
      items: ["시스템 목적", "사용자 유형", "저장해야 할 데이터 항목", "필요한 화면 목록", "로그인·권한 필요 여부", "파일 업로드·알림·결제 필요 여부"]
    },
    "homepage-fix": {
      value: "홈페이지 오류 수정·기능 추가",
      title: "홈페이지 수정 문의 준비자료",
      desc: "오류 위치와 접근 권한이 명확할수록 빠르게 진단할 수 있습니다.",
      items: ["수정할 사이트 URL", "오류 캡처", "발생 기기·브라우저", "소스코드/GitHub/FTP 권한", "수정할 문구·이미지·링크", "운영 서버 반영 필요 여부"]
    },
    "ga4-gtm": {
      value: "GA4/GTM 전환 추적 세팅",
      title: "GA4·GTM 세팅 문의 준비자료",
      desc: "추적하려는 행동과 계정 권한을 먼저 확인합니다.",
      items: ["홈페이지 URL", "GA4/GTM 계정 여부", "사이트 관리자 또는 소스 접근 권한", "추적할 버튼 목록", "전화·카카오톡·문의폼 위치", "광고 계정 연동 필요 여부"]
    },
    "gpt-ai-chatbot": {
      value: "맞춤형 GPT·AI 챗봇",
      title: "GPT·AI 챗봇 문의 준비자료",
      desc: "AI가 답변할 범위와 답변하면 안 되는 범위를 분리합니다.",
      items: ["자주 받는 질문", "서비스 소개서/가격표", "답변 톤 예시", "금지 답변 또는 주의 문구", "홈페이지 삽입 필요 여부", "API 연동 필요 여부"]
    },
    "web-crawling": {
      value: "웹 데이터 크롤링·엑셀 수집",
      title: "웹 데이터 수집 문의 준비자료",
      desc: "수집 가능 여부를 먼저 확인한 뒤 컬럼 구조를 정리합니다.",
      items: ["수집 대상 URL", "수집할 항목 목록", "원하는 엑셀 컬럼 예시", "페이지 수 또는 데이터 건수", "1회/반복 수집 여부", "제외할 데이터 기준"]
    }
  };

  const PACKAGE_PREP_GUIDES = {
    "launch-basic": {
      name: "Launch Basic",
      title: "Launch Basic 패키지 문의 준비자료",
      desc: "대표 링크와 문의 측정을 함께 시작하기 위한 조합입니다.",
      services: ["홈페이지·랜딩페이지 제작", "GA4/GTM 전환 추적 세팅"],
      items: ["브랜드명/서비스명", "홈페이지에 넣을 기본 소개 자료", "문의 연결 링크", "추적하고 싶은 버튼", "GA4/GTM 계정 여부", "희망 오픈 일정"]
    },
    "site-upgrade": {
      name: "Site Upgrade",
      title: "Site Upgrade 패키지 문의 준비자료",
      desc: "기존 사이트 수정과 문의 행동 측정을 함께 정리하는 조합입니다.",
      services: ["홈페이지 오류 수정·기능 추가", "GA4/GTM 전환 추적 세팅"],
      items: ["현재 사이트 URL", "수정할 오류 캡처", "소스코드/호스팅 접근 권한", "추적할 전화·카톡·문의 버튼", "수정 우선순위", "희망 반영 일정"]
    },
    "operation-core": {
      name: "Operation Core",
      title: "Operation Core 패키지 문의 준비자료",
      desc: "신청·예약 데이터를 저장하고 관리자 화면에서 처리하는 운영형 조합입니다.",
      services: ["React·Firebase 관리자 웹시스템", "GA4/GTM 전환 추적 세팅"],
      items: ["시스템 목적", "저장해야 할 데이터 항목", "사용자/관리자 유형", "필요한 화면 목록", "로그인·파일 업로드 필요 여부", "측정하고 싶은 주요 행동"]
    },
    "ai-support": {
      name: "AI Support",
      title: "AI Support 패키지 문의 준비자료",
      desc: "홈페이지 상담 흐름과 GPT·AI 챗봇 응답 기준을 함께 설계하는 조합입니다.",
      services: ["홈페이지·랜딩페이지 제작", "맞춤형 GPT·AI 챗봇", "GA4/GTM 전환 추적 세팅"],
      items: ["자주 받는 질문", "서비스 소개서/가격표", "답변하면 안 되는 내용", "챗봇 삽입이 필요한 사이트", "사람 상담 연결 기준", "추적할 챗봇/문의 행동"]
    },
    "data-pipeline": {
      name: "Data Pipeline",
      title: "Data Pipeline 패키지 문의 준비자료",
      desc: "공개 웹 데이터 수집 결과를 업무에 쓰기 좋게 정리하는 조합입니다.",
      services: ["웹 데이터 크롤링·엑셀 수집", "React·Firebase 관리자 웹시스템"],
      items: ["수집 대상 URL", "수집할 항목 목록", "원하는 결과 컬럼", "1회/반복 수집 여부", "관리 화면 필요 여부", "제외해야 할 데이터 기준"]
    },
    "custom-fit": {
      name: "Custom Fit",
      title: "맞춤 패키지 문의 준비자료",
      desc: "서비스가 여러 개 섞여 있거나 아직 방향이 명확하지 않을 때 범위를 먼저 정리합니다.",
      services: [],
      items: ["현재 가장 불편한 문제", "새로 만들 것인지 기존 것을 고칠 것인지", "필요한 기능 또는 데이터", "참고 사이트/문서", "희망 일정", "예상 예산 또는 우선순위"]
    }
  };

  let activePackageGuide = null;

  const submitButton = form.querySelector('button[type="submit"]');
  const detailsField = form.querySelector("#details");
  const detailsCounter = form.querySelector("[data-details-count]");
  const emailField = form.querySelector("#email");
  const phoneField = form.querySelector("#phone");
  const nameField = form.querySelector("#name");
  const privacyField = form.querySelector('input[name="privacy"]');
  const honeypotField = form.querySelector('input[name="website"]');
  const serviceFields = form.querySelectorAll('input[name="service"]');
  const packageField = form.querySelector("#package-name");
  const serviceOtherCheck = form.querySelector("#service-other-check");
  const serviceOtherField = form.querySelector("#service-other");
  const serviceOtherWrap = form.querySelector("[data-service-other-field]");
  const servicePrep = form.querySelector("[data-service-prep]");
  const servicePrepTitle = form.querySelector("[data-service-prep-title]");
  const servicePrepDesc = form.querySelector("[data-service-prep-desc]");
  const servicePrepList = form.querySelector("[data-service-prep-list]");
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

  const getGuideByValue = function (value) {
    return Object.values(SERVICE_PREP_GUIDES).find(function (guide) {
      return guide.value === value;
    }) || null;
  };

  const updateServicePrepGuide = function () {
    if (!servicePrep || !servicePrepTitle || !servicePrepDesc || !servicePrepList) {
      return;
    }

    const checkedServices = Array.from(serviceFields).filter(function (field) {
      return field.checked && field.value !== "기타";
    });

    const guide = activePackageGuide || (checkedServices.length ? getGuideByValue(checkedServices[0].value) : null);

    if (!guide) {
      servicePrep.hidden = true;
      servicePrepList.innerHTML = "";
      return;
    }

    servicePrepTitle.textContent = guide.title;
    servicePrepDesc.textContent = guide.desc;
    servicePrepList.innerHTML = guide.items.map(function (item) {
      return "<li>" + item + "</li>";
    }).join("");
    servicePrep.hidden = false;
  };

  const applyPackageParam = function () {
    const params = new URLSearchParams(window.location.search);
    const packageKey = params.get("package");
    const guide = packageKey ? PACKAGE_PREP_GUIDES[packageKey] : null;

    if (!guide) {
      return;
    }

    activePackageGuide = guide;

    if (packageField) {
      packageField.value = guide.name;
    }

    if (Array.isArray(guide.services) && guide.services.length) {
      Array.from(serviceFields).forEach(function (field) {
        if (guide.services.includes(field.value)) {
          field.checked = true;
        }
      });
    } else if (serviceOtherCheck) {
      serviceOtherCheck.checked = true;
      if (serviceOtherField) {
        serviceOtherField.value = "패키지 맞춤 조합 상담";
      }
    }

    if (detailsField && !detailsField.value.trim()) {
      detailsField.placeholder = "예) [" + guide.name + " 패키지 문의] 현재 상황, 필요한 결과물, 준비된 자료, 원하는 일정과 예산 범위를 적어주세요.";
    }
  };

  const applyServiceParam = function () {
    const params = new URLSearchParams(window.location.search);
    const serviceKey = params.get("service");
    const guide = serviceKey ? SERVICE_PREP_GUIDES[serviceKey] : null;

    if (!guide) {
      return;
    }

    Array.from(serviceFields).some(function (field) {
      if (field.value === guide.value) {
        field.checked = true;
        return true;
      }
      return false;
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
      updateServicePrepGuide();
      populateTrackingFields();
    }
  };

  const buildInquirySummary = function () {
    const data = new FormData(form);
    const services = data.getAll("service").filter(Boolean).join(", ");
    const lines = [
      "NOVAWORK 프로젝트 문의",
      "",
      "이름: " + (data.get("name") || ""),
      "회사/상호: " + (data.get("company") || ""),
      "연락처: " + (data.get("phone") || ""),
      "이메일: " + (data.get("email") || ""),
      "홈페이지: " + (data.get("homepage") || ""),
      "서비스: " + services,
      "기타 서비스: " + (data.get("service_other") || ""),
      "예산: " + (data.get("budget") || ""),
      "일정: " + (data.get("schedule") || ""),
      "상담 방식: " + (data.get("consulting") || ""),
      "참고 자료: " + (data.get("reference") || ""),
      "",
      "상세 내용:",
      data.get("details") || "",
      "",
      "페이지: " + (data.get("page_url") || window.location.href)
    ];
    return lines.join("\n");
  };

  const buildMailtoHref = function () {
    const subject = encodeURIComponent("NOVAWORK 프로젝트 문의");
    const body = encodeURIComponent(buildInquirySummary());
    return "mailto:" + CONTACT_EMAIL + "?subject=" + subject + "&body=" + body;
  };

  const saveDraft = function () {
    try {
      window.sessionStorage.setItem("novawork_inquiry_draft", buildInquirySummary());
    } catch (error) {}
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

    saveDraft();
    statusBox.className = "form-status is-error form-status-with-actions";
    statusBox.textContent = "";

    const displayMessage = message && message.indexOf("서버 저장") !== -1
      ? "현재 Google Apps Script 저장 응답이 실패했습니다. 입력 내용은 지우지 않았습니다. 아래 이메일 또는 카카오톡으로 바로 보내주세요."
      : (message || "서버 접수 응답이 정상으로 확인되지 않았습니다. 입력 내용은 지우지 않았습니다. 아래 이메일 또는 카카오톡으로 바로 보내주세요.");
    const text = document.createElement("p");
    text.textContent = displayMessage;

    const actions = document.createElement("div");
    actions.className = "form-status-actions";

    const mail = document.createElement("a");
    mail.href = buildMailtoHref();
    mail.textContent = "이메일로 보내기";

    const kakao = document.createElement("a");
    kakao.href = KAKAO_URL;
    kakao.target = "_blank";
    kakao.rel = "noopener noreferrer";
    kakao.textContent = "카카오톡 문의";

    actions.appendChild(mail);
    actions.appendChild(kakao);
    statusBox.appendChild(text);
    statusBox.appendChild(actions);
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
        finishError("전송 확인이 지연되고 있습니다. 중복 제출하지 마시고, 24시간 내 답변이 없으면 contact@novawork.kr 또는 카카오톡으로 확인해 주세요.");
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

    finishError(data.message || "서버 접수 응답이 실패했습니다. 입력 내용은 유지됩니다. contact@novawork.kr 또는 카카오톡으로 보내주세요.");
  });

  if (iframe) {
    iframe.addEventListener("load", function () {
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
      updateServicePrepGuide();
    });
  });

  applyPackageParam();
  applyServiceParam();
  populateTrackingFields();
  updateCounter();
  syncChoiceState();
  syncConditionalFields();
  updateServicePrepGuide();
};
