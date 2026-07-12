window.initInquiryForm = function initInquiryForm() {
  const form = document.querySelector(".inquiry-form");

  if (!form) {
    return;
  }

  const DETAILS_MIN_LENGTH = 20;
  const TRACKING_FIELDS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];
  const MESSAGE_SOURCE = "novawork-inquiry";
  const CONTACT_EMAIL = "contact@novawork.kr";
  const KAKAO_URL = "https://pf.kakao.com/_xhDLjX";
  const SERVICE_PREP_GUIDES = {
    "homepage-landing": {
      value: "홈페이지·랜딩페이지 제작",
      title: "홈페이지·랜딩페이지 제작 문의 준비자료",
      desc: "대표 링크와 문의 동선을 만들기 위해 필요한 기본 자료입니다.",
      items: [
        "브랜드명/서비스명",
        "기본 소개 문구",
        "서비스·상품 설명",
        "로고와 대표 이미지",
        "전화·이메일·카카오톡·SNS 링크",
        "참고 사이트 1~3개",
      ],
    },
    "react-firebase-admin": {
      value: "React·Firebase 관리자 웹시스템",
      title: "React·Firebase 웹시스템 문의 준비자료",
      desc: "저장할 데이터와 관리자가 처리할 흐름을 먼저 확인합니다.",
      items: [
        "시스템 목적",
        "사용자 유형",
        "저장해야 할 데이터 항목",
        "필요한 화면 목록",
        "로그인·권한 필요 여부",
        "파일 업로드·알림·결제 필요 여부",
      ],
    },
    "homepage-fix": {
      value: "홈페이지 오류 수정·기능 추가",
      title: "홈페이지 수정 문의 준비자료",
      desc: "오류 위치와 접근 권한이 명확할수록 빠르게 진단할 수 있습니다.",
      items: [
        "수정할 사이트 URL",
        "오류 캡처",
        "발생 기기·브라우저",
        "소스코드/GitHub/FTP 권한",
        "수정할 문구·이미지·링크",
        "운영 서버 반영 필요 여부",
      ],
    },
    "ga4-gtm": {
      value: "GA4/GTM 전환 추적 세팅",
      title: "GA4·GTM 세팅 문의 준비자료",
      desc: "추적하려는 행동과 계정 권한을 먼저 확인합니다.",
      items: [
        "홈페이지 URL",
        "GA4/GTM 계정 여부",
        "사이트 관리자 또는 소스 접근 권한",
        "추적할 버튼 목록",
        "전화·카카오톡·문의폼 위치",
        "광고 계정 연동 필요 여부",
      ],
    },
    "gpt-ai-chatbot": {
      value: "맞춤형 GPT·AI 챗봇",
      title: "GPT·AI 챗봇 문의 준비자료",
      desc: "AI가 답변할 범위와 답변하면 안 되는 범위를 분리합니다.",
      items: [
        "자주 받는 질문",
        "서비스 소개서/가격표",
        "답변 톤 예시",
        "금지 답변 또는 주의 문구",
        "홈페이지 삽입 필요 여부",
        "API 연동 필요 여부",
      ],
    },
    "web-crawling": {
      value: "웹 데이터 크롤링·엑셀 수집",
      title: "웹 데이터 수집 문의 준비자료",
      desc: "수집 가능 여부를 먼저 확인한 뒤 컬럼 구조를 정리합니다.",
      items: [
        "수집 대상 URL",
        "수집할 항목 목록",
        "원하는 엑셀 컬럼 예시",
        "페이지 수 또는 데이터 건수",
        "1회/반복 수집 여부",
        "제외할 데이터 기준",
      ],
    },
  };

  const PACKAGE_PREP_GUIDES = {
    "launch-basic": {
      name: "Launch Basic",
      title: "Launch Basic 패키지 문의 준비자료",
      desc: "대표 링크와 문의 측정을 함께 시작하기 위한 조합입니다.",
      services: ["홈페이지·랜딩페이지 제작", "GA4/GTM 전환 추적 세팅"],
      items: [
        "브랜드명/서비스명",
        "홈페이지에 넣을 기본 소개 자료",
        "문의 연결 링크",
        "추적하고 싶은 버튼",
        "GA4/GTM 계정 여부",
        "희망 오픈 일정",
      ],
    },
    "site-upgrade": {
      name: "Site Upgrade",
      title: "Site Upgrade 패키지 문의 준비자료",
      desc: "기존 사이트 수정과 문의 행동 측정을 함께 정리하는 조합입니다.",
      services: ["홈페이지 오류 수정·기능 추가", "GA4/GTM 전환 추적 세팅"],
      items: [
        "현재 사이트 URL",
        "수정할 오류 캡처",
        "소스코드/호스팅 접근 권한",
        "추적할 전화·카톡·문의 버튼",
        "수정 우선순위",
        "희망 반영 일정",
      ],
    },
    "operation-core": {
      name: "Operation Core",
      title: "Operation Core 패키지 문의 준비자료",
      desc: "신청·예약 데이터를 저장하고 관리자 화면에서 처리하는 운영형 조합입니다.",
      services: ["React·Firebase 관리자 웹시스템", "GA4/GTM 전환 추적 세팅"],
      items: [
        "시스템 목적",
        "저장해야 할 데이터 항목",
        "사용자/관리자 유형",
        "필요한 화면 목록",
        "로그인·파일 업로드 필요 여부",
        "측정하고 싶은 주요 행동",
      ],
    },
    "ai-support": {
      name: "AI Support",
      title: "AI Support 패키지 문의 준비자료",
      desc: "홈페이지 상담 흐름과 GPT·AI 챗봇 응답 기준을 함께 설계하는 조합입니다.",
      services: [
        "홈페이지·랜딩페이지 제작",
        "맞춤형 GPT·AI 챗봇",
        "GA4/GTM 전환 추적 세팅",
      ],
      items: [
        "자주 받는 질문",
        "서비스 소개서/가격표",
        "답변하면 안 되는 내용",
        "챗봇 삽입이 필요한 사이트",
        "사람 상담 연결 기준",
        "추적할 챗봇/문의 행동",
      ],
    },
    "data-pipeline": {
      name: "Data Pipeline",
      title: "Data Pipeline 패키지 문의 준비자료",
      desc: "공개 웹 데이터 수집 결과를 업무에 쓰기 좋게 정리하는 조합입니다.",
      services: [
        "웹 데이터 크롤링·엑셀 수집",
        "React·Firebase 관리자 웹시스템",
      ],
      items: [
        "수집 대상 URL",
        "수집할 항목 목록",
        "원하는 결과 컬럼",
        "1회/반복 수집 여부",
        "관리 화면 필요 여부",
        "제외해야 할 데이터 기준",
      ],
    },
    "custom-fit": {
      name: "Custom Fit",
      title: "맞춤 패키지 문의 준비자료",
      desc: "서비스가 여러 개 섞여 있거나 아직 방향이 명확하지 않을 때 범위를 먼저 정리합니다.",
      services: [],
      items: [
        "현재 가장 불편한 문제",
        "새로 만들 것인지 기존 것을 고칠 것인지",
        "필요한 기능 또는 데이터",
        "참고 사이트/문서",
        "희망 일정",
        "예상 예산 또는 우선순위",
      ],
    },
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
    document.querySelector(
      'iframe[name="' + form.getAttribute("target") + '"]',
    ) || document.querySelector("#form-response-frame");

  let isSubmitting = false;
  let fallbackTimer = null;
  let hardFallbackTimer = null;
  let serverMessageReceived = false;
  let lateResponseWindowUntil = 0;
  const SOFT_RESPONSE_TIMEOUT = 30000;
  const HARD_RESPONSE_TIMEOUT = 90000;
  const LATE_RESPONSE_WINDOW = 5 * 60 * 1000;
  const defaultButtonText = submitButton
    ? submitButton.textContent
    : "문의 접수하기";

  const DRAFT_KEY = "novawork_inquiry_draft_v43";
  const LEGACY_DRAFT_KEY = "novawork_inquiry_draft";
  let draftTimer = null;
  let formStepper = null;

  const isDraftField = function (field) {
    if (!field || !field.name || field.type === "hidden") return false;
    if (field.name === "website" || field.name === "privacy") return false;
    return true;
  };

  const collectDraftFields = function () {
    const fields = {};

    Array.from(form.elements).forEach(function (field) {
      if (!isDraftField(field)) return;

      if (field.type === "checkbox") {
        if (!Array.isArray(fields[field.name])) fields[field.name] = [];
        if (field.checked) fields[field.name].push(field.value);
        return;
      }

      if (field.type === "radio") {
        if (!(field.name in fields)) fields[field.name] = "";
        if (field.checked) fields[field.name] = field.value;
        return;
      }

      fields[field.name] = field.value || "";
    });

    return fields;
  };

  const hasDraftContent = function (fields) {
    return Object.keys(fields || {}).some(function (key) {
      const value = fields[key];
      if (Array.isArray(value)) return value.length > 0;
      return String(value || "").trim().length > 0;
    });
  };

  const writeDraft = function () {
    try {
      const fields = collectDraftFields();
      if (!hasDraftContent(fields)) {
        window.sessionStorage.removeItem(DRAFT_KEY);
        return;
      }

      window.sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          version: "2026.07-cleanup",
          saved_at: new Date().toISOString(),
          fields: fields,
        }),
      );
    } catch (error) {}
  };

  const scheduleDraftSave = function () {
    if (draftTimer) window.clearTimeout(draftTimer);
    draftTimer = window.setTimeout(writeDraft, 220);
  };

  const clearDraft = function () {
    if (draftTimer) {
      window.clearTimeout(draftTimer);
      draftTimer = null;
    }

    try {
      window.sessionStorage.removeItem(DRAFT_KEY);
      window.sessionStorage.removeItem(LEGACY_DRAFT_KEY);
    } catch (error) {}
  };

  const restoreDraft = function () {
    let raw = null;

    try {
      raw = window.sessionStorage.getItem(DRAFT_KEY);
    } catch (error) {
      raw = null;
    }

    if (!raw) return false;

    let saved = null;
    try {
      saved = JSON.parse(raw);
    } catch (error) {
      return false;
    }

    const fields = saved && saved.fields ? saved.fields : null;
    if (!fields || !hasDraftContent(fields)) return false;

    let restored = false;
    Array.from(form.elements).forEach(function (field) {
      if (!isDraftField(field)) return;
      if (!(field.name in fields)) return;

      const value = fields[field.name];
      if (field.type === "checkbox") {
        field.checked = Array.isArray(value) && value.includes(field.value);
        restored = true;
        return;
      }

      if (field.type === "radio") {
        field.checked = String(value || "") === field.value;
        restored = true;
        return;
      }

      field.value = String(value || "");
      restored = true;
    });

    return restored;
  };

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
    detailsCounter.textContent =
      length + "자 / 최소 " + DETAILS_MIN_LENGTH + "자";
  };

  const syncChoiceState = function () {
    form
      .querySelectorAll(".check-grid label, .radio-group label, .consent-item")
      .forEach(function (label) {
        const input = label.querySelector(
          'input[type="checkbox"], input[type="radio"]',
        );
        label.classList.toggle("is-checked", Boolean(input && input.checked));
      });
  };

  const getGuideByValue = function (value) {
    return (
      Object.values(SERVICE_PREP_GUIDES).find(function (guide) {
        return guide.value === value;
      }) || null
    );
  };

  const updateServicePrepGuide = function () {
    if (
      !servicePrep ||
      !servicePrepTitle ||
      !servicePrepDesc ||
      !servicePrepList
    ) {
      return;
    }

    const checkedServices = Array.from(serviceFields).filter(function (field) {
      return field.checked && field.value !== "기타";
    });

    const guide =
      activePackageGuide ||
      (checkedServices.length
        ? getGuideByValue(checkedServices[0].value)
        : null);

    if (!guide) {
      servicePrep.hidden = true;
      servicePrepList.innerHTML = "";
      return;
    }

    servicePrepTitle.textContent = guide.title;
    servicePrepDesc.textContent = guide.desc;
    servicePrepList.innerHTML = guide.items
      .map(function (item) {
        return "<li>" + item + "</li>";
      })
      .join("");
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
      detailsField.placeholder =
        "예) [" +
        guide.name +
        " 패키지 문의] 현재 상황, 필요한 결과물, 준비된 자료, 원하는 일정과 예산 범위를 적어주세요.";
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
    const showServiceOther = Boolean(
      serviceOtherCheck && serviceOtherCheck.checked,
    );

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

    const firstField = container.querySelector("input, textarea, select");
    const error = document.createElement("p");
    const errorId = firstField
      ? getErrorId(firstField)
      : "group-error-" + Math.random().toString(36).slice(2);

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

    if (
      firstErrorField &&
      formStepper &&
      typeof formStepper.goToField === "function"
    ) {
      formStepper.goToField(firstErrorField);
    }

    if (firstErrorField && typeof firstErrorField.focus === "function") {
      window.setTimeout(function () {
        try {
          firstErrorField.focus({ preventScroll: true });
        } catch (error) {
          firstErrorField.focus();
        }
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 40);
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

    const submittedAt = new Date().toISOString();
    setHiddenValue("#page-url", window.location.href);
    setHiddenValue("#page-title", document.title || "");
    setHiddenValue("#page-origin", window.location.origin);
    setHiddenValue("#user-agent", window.navigator.userAgent);
    setHiddenValue("#submitted-at", submittedAt);
    setHiddenValue("#submitted-at-client", submittedAt);
  };

  const finishSuccess = function (message, resetForm, force) {
    if (!isSubmitting && !force) {
      return;
    }

    const statusBox = createStatusBox();
    isSubmitting = false;
    lateResponseWindowUntil = 0;

    if (fallbackTimer) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }

    if (hardFallbackTimer) {
      window.clearTimeout(hardFallbackTimer);
      hardFallbackTimer = null;
    }

    statusBox.className = "form-status is-success";
    statusBox.textContent = message;
    setSubmitting(false);

    if (
      resetForm &&
      window.NOVAWORKTrack &&
      typeof window.NOVAWORKTrack.generateLead === "function"
    ) {
      const selectedServices = Array.from(serviceFields).filter(
        function (field) {
          return field.checked;
        },
      );

      window.NOVAWORKTrack.generateLead({
        form_id: form.id || "inquiry-form",
        service_count: selectedServices.length,
        service_type: selectedServices[0]
          ? selectedServices[0].value
          : "미선택",
      });
    }

    if (resetForm) {
      clearDraft();
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
      "페이지: " + (data.get("page_url") || window.location.href),
    ];
    return lines.join("\n");
  };

  const buildMailtoHref = function () {
    const subject = encodeURIComponent("NOVAWORK 프로젝트 문의");
    const body = encodeURIComponent(buildInquirySummary());
    return "mailto:" + CONTACT_EMAIL + "?subject=" + subject + "&body=" + body;
  };

  const saveDraft = function () {
    writeDraft();
    try {
      window.sessionStorage.setItem(LEGACY_DRAFT_KEY, buildInquirySummary());
    } catch (error) {}
  };

  const finishError = function (message, options) {
    const allowWhenNotSubmitting = Boolean(
      options && options.allowWhenNotSubmitting,
    );

    if (!isSubmitting && !allowWhenNotSubmitting) {
      return;
    }

    const statusBox = createStatusBox();
    isSubmitting = false;

    if (fallbackTimer) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }

    if (hardFallbackTimer) {
      window.clearTimeout(hardFallbackTimer);
      hardFallbackTimer = null;
    }

    saveDraft();
    statusBox.className = "form-status is-error form-status-with-actions";
    statusBox.textContent = "";

    const displayMessage =
      message && message.indexOf("서버 저장") !== -1
        ? "Google Apps Script 또는 Google Sheet 연결이 실패했습니다. SHEET_ID, 시트 권한, 웹앱 재배포 URL을 확인해 주세요. 입력 내용은 지우지 않았습니다. 아래 이메일 또는 카카오톡으로 바로 보내주세요."
        : message ||
          "서버 접수 응답이 정상으로 확인되지 않았습니다. 입력 내용은 지우지 않았습니다. 아래 이메일 또는 카카오톡으로 바로 보내주세요.";
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

  const showPendingResponseDelay = function () {
    if (!isSubmitting || serverMessageReceived) return;

    const statusBox = createStatusBox();
    statusBox.className = "form-status is-pending form-status-with-actions";
    statusBox.textContent = "";

    const text = document.createElement("p");
    text.textContent =
      "접수 처리는 진행 중입니다. Google Apps Script 응답이 늦어지고 있어 확인을 계속 기다리고 있습니다. 중복 제출하지 마세요.";

    const actions = document.createElement("div");
    actions.className = "form-status-actions";

    const mail = document.createElement("a");
    mail.href = buildMailtoHref();
    mail.textContent = "이메일 백업 열기";

    const kakao = document.createElement("a");
    kakao.href = KAKAO_URL;
    kakao.target = "_blank";
    kakao.rel = "noopener noreferrer";
    kakao.textContent = "카카오톡 문의";

    actions.appendChild(mail);
    actions.appendChild(kakao);
    statusBox.appendChild(text);
    statusBox.appendChild(actions);

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "접수 확인 대기 중...";
    }
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
      showFieldError(
        phoneField || emailField,
        "연락처 또는 이메일 중 하나는 입력해 주세요.",
      );
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
      appendErrorToGroup(
        serviceFields[0].closest(".check-grid"),
        "필요한 서비스를 하나 이상 선택해 주세요.",
      );
      valid = false;
    }

    if (
      serviceOtherCheck &&
      serviceOtherCheck.checked &&
      serviceOtherField &&
      !serviceOtherField.value.trim()
    ) {
      showFieldError(serviceOtherField, "기타 서비스 내용을 입력해 주세요.");
      valid = false;
    }

    if (detailsField && detailsField.value.trim().length < DETAILS_MIN_LENGTH) {
      showFieldError(
        detailsField,
        "프로젝트 내용을 최소 " + DETAILS_MIN_LENGTH + "자 이상 입력해 주세요.",
      );
      valid = false;
    }

    if (
      sourceField &&
      sourceField.value === "기타" &&
      sourceDetailField &&
      !sourceDetailField.value.trim()
    ) {
      showFieldError(sourceDetailField, "기타 유입 경로를 입력해 주세요.");
      valid = false;
    }

    if (privacyField && !privacyField.checked) {
      showFieldError(privacyField, "개인정보 수집 및 이용 동의는 필수입니다.");
      valid = false;
    }

    return valid;
  };

  const validateStepperStep = function (stepIndex) {
    let valid = true;
    clearErrors();
    syncConditionalFields();

    if (stepIndex === 0) {
      if (nameField && !nameField.value.trim()) {
        showFieldError(nameField, "담당자 이름을 입력해 주세요.");
        valid = false;
      }

      const hasPhone = Boolean(phoneField && phoneField.value.trim());
      const hasEmail = Boolean(emailField && emailField.value.trim());

      if (!hasPhone && !hasEmail) {
        showFieldError(
          phoneField || emailField,
          "연락처 또는 이메일 중 하나는 입력해 주세요.",
        );
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
    }

    if (stepIndex === 1) {
      if (serviceFields.length > 0 && !hasCheckedService()) {
        appendErrorToGroup(
          serviceFields[0].closest(".check-grid"),
          "필요한 서비스를 하나 이상 선택해 주세요.",
        );
        valid = false;
      }

      if (
        serviceOtherCheck &&
        serviceOtherCheck.checked &&
        serviceOtherField &&
        !serviceOtherField.value.trim()
      ) {
        showFieldError(serviceOtherField, "기타 서비스 내용을 입력해 주세요.");
        valid = false;
      }

      if (
        detailsField &&
        detailsField.value.trim().length < DETAILS_MIN_LENGTH
      ) {
        showFieldError(
          detailsField,
          "프로젝트 내용을 최소 " +
            DETAILS_MIN_LENGTH +
            "자 이상 입력해 주세요.",
        );
        valid = false;
      }
    }

    if (stepIndex === 2) {
      if (
        sourceField &&
        sourceField.value === "기타" &&
        sourceDetailField &&
        !sourceDetailField.value.trim()
      ) {
        showFieldError(sourceDetailField, "기타 유입 경로를 입력해 주세요.");
        valid = false;
      }

      if (privacyField && !privacyField.checked) {
        showFieldError(
          privacyField,
          "개인정보 수집 및 이용 동의는 필수입니다.",
        );
        valid = false;
      }
    }

    if (!valid) {
      const statusBox = createStatusBox();
      statusBox.className = "form-status is-error";
      statusBox.textContent = "현재 단계의 입력 내용을 다시 확인해 주세요.";
      focusFirstError();
    }

    return valid;
  };

  const initContactFormStepper = function () {
    if (
      !document.body ||
      !document.body.classList.contains("contact-static-page")
    )
      return null;
    if (form.dataset.nwFormStepper === "ready") return formStepper;

    const sections = Array.from(form.children).filter(function (child) {
      return (
        child instanceof HTMLElement && child.classList.contains("form-section")
      );
    });

    if (sections.length < 5) return null;

    form.dataset.nwFormStepper = "ready";
    form.classList.add("nw-stepped-form");

    const steps = [
      {
        title: "기본 정보",
        desc: "연락 가능한 정보를 입력합니다.",
        sections: [sections[0]],
      },
      {
        title: "서비스·내용",
        desc: "필요한 서비스와 작업 내용을 정리합니다.",
        sections: [sections[1], sections[2]],
      },
      {
        title: "확인·접수",
        desc: "상담 방식과 동의 후 접수합니다.",
        sections: [sections[3], sections[4]],
      },
    ];

    const stepper = document.createElement("div");
    stepper.className = "nw-form-stepper";
    stepper.setAttribute("aria-label", "접수 단계");

    const progress = document.createElement("div");
    progress.className = "nw-form-stepper-progress";
    progress.setAttribute("aria-hidden", "true");
    progress.innerHTML = '<span class="nw-form-stepper-progress-bar"></span>';

    const tabs = document.createElement("div");
    tabs.className = "nw-form-stepper-tabs";

    steps.forEach(function (step, index) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "nw-form-stepper-tab";
      tab.dataset.stepIndex = String(index);
      tab.innerHTML =
        "<span>0" +
        (index + 1) +
        "</span><strong>" +
        step.title +
        "</strong><em>" +
        step.desc +
        "</em>";
      tabs.appendChild(tab);
    });

    stepper.appendChild(progress);
    stepper.appendChild(tabs);
    form.insertBefore(stepper, sections[0]);

    const actions = document.createElement("div");
    actions.className = "nw-form-step-actions";
    const prevButton = document.createElement("button");
    prevButton.type = "button";
    prevButton.className = "btn btn-secondary nw-form-step-prev";
    prevButton.textContent = "이전";
    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "btn btn-primary nw-form-step-next";
    nextButton.textContent = "다음";
    actions.appendChild(prevButton);
    actions.appendChild(nextButton);
    form.appendChild(actions);

    let activeStep = 0;
    const tabButtons = Array.from(tabs.querySelectorAll("button"));
    const progressBar = progress.querySelector(".nw-form-stepper-progress-bar");

    steps.forEach(function (step, index) {
      step.sections.forEach(function (section) {
        section.dataset.nwStepIndex = String(index);
      });
    });

    const setStep = function (index, options) {
      const nextIndex = Math.max(0, Math.min(steps.length - 1, index));
      activeStep = nextIndex;
      form.dataset.nwActiveStep = String(activeStep + 1);

      steps.forEach(function (step, stepIndex) {
        const active = stepIndex === activeStep;
        step.sections.forEach(function (section) {
          section.classList.toggle("is-step-active", active);
          section.hidden = !active;
          section.setAttribute("aria-hidden", active ? "false" : "true");
        });
      });

      tabButtons.forEach(function (button, buttonIndex) {
        const active = buttonIndex === activeStep;
        button.classList.toggle("is-active", active);
        button.classList.toggle("is-complete", buttonIndex < activeStep);
        button.setAttribute("aria-current", active ? "step" : "false");
      });

      prevButton.hidden = activeStep === 0;
      nextButton.hidden = activeStep === steps.length - 1;
      if (progressBar)
        progressBar.style.width = ((activeStep + 1) / steps.length) * 100 + "%";

      if (!options || !options.silent) {
        const isOnePageContact =
          document.body &&
          document.body.classList.contains("contact-static-page") &&
          !document.body.classList.contains("nw-subpage-v2");
        if (!isOnePageContact) {
          const shell = form.closest(".form-shell") || form;
          try {
            shell.scrollIntoView({ behavior: "smooth", block: "start" });
          } catch (error) {
            shell.scrollIntoView();
          }
        }
      }
    };

    const fieldToStep = function (field) {
      const section =
        field && field.closest ? field.closest(".form-section") : null;
      if (!section || typeof section.dataset.nwStepIndex === "undefined")
        return -1;
      return Number(section.dataset.nwStepIndex);
    };

    prevButton.addEventListener("click", function () {
      clearStatus();
      setStep(activeStep - 1);
    });

    nextButton.addEventListener("click", function () {
      if (!validateStepperStep(activeStep)) return;
      setStep(activeStep + 1);
    });

    tabButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const target = Number(button.dataset.stepIndex || "0");
        if (target <= activeStep) {
          clearStatus();
          setStep(target);
          return;
        }

        for (let step = activeStep; step < target; step += 1) {
          if (!validateStepperStep(step)) return;
        }
        setStep(target);
      });
    });

    const api = {
      setStep: setStep,
      goToField: function (field) {
        const step = fieldToStep(field);
        if (step >= 0) setStep(step, { silent: true });
      },
    };

    formStepper = api;
    setStep(0, { silent: true });
    return api;
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

    writeDraft();
    isSubmitting = true;
    serverMessageReceived = false;
    lateResponseWindowUntil = Date.now() + LATE_RESPONSE_WINDOW;
    setSubmitting(true);
    statusBox.className = "form-status";
    statusBox.textContent = "문의 내용을 전송하고 있습니다.";

    if (fallbackTimer) {
      window.clearTimeout(fallbackTimer);
    }

    if (hardFallbackTimer) {
      window.clearTimeout(hardFallbackTimer);
    }

    fallbackTimer = window.setTimeout(function () {
      if (!serverMessageReceived) {
        showPendingResponseDelay();
      }
    }, SOFT_RESPONSE_TIMEOUT);

    hardFallbackTimer = window.setTimeout(function () {
      if (!serverMessageReceived) {
        finishError(
          "전송 확인이 오래 지연되고 있습니다. 실제 접수가 완료됐을 수 있으니 중복 제출하지 마시고, 24시간 내 답변이 없으면 contact@novawork.kr 또는 카카오톡으로 확인해 주세요.",
        );
      }
    }, HARD_RESPONSE_TIMEOUT);
  });

  const isAllowedMessageOrigin = function (origin) {
    if (!origin || origin === "null") return true;

    try {
      const url = new URL(origin);
      const host = url.hostname;
      return (
        host === "script.google.com" ||
        host === "script.googleusercontent.com" ||
        host.endsWith(".googleusercontent.com")
      );
    } catch (error) {
      return false;
    }
  };

  const isTrustedFormMessage = function (event, data) {
    if (!data || data.source !== MESSAGE_SOURCE) return false;

    const originAllowed = isAllowedMessageOrigin(event.origin);
    const directFrameSource = Boolean(
      iframe && event.source && event.source === iframe.contentWindow,
    );

    // Google Apps Script HtmlService can postMessage from a nested googleusercontent sandbox,
    // so event.source is not always the same object as hidden_iframe.contentWindow.
    // Accept the response when the signed source value and Google/null origin match.
    if (originAllowed) return true;
    if (directFrameSource) return true;

    return false;
  };

  const parseMessageData = function (value) {
    if (!value) return {};
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (error) {
        return {};
      }
    }
    return value;
  };

  const serverErrorMessage = function (data) {
    const code = data && data.error_code ? String(data.error_code) : "";

    if (code === "SHEET_ID_NOT_SET") {
      return "Google Apps Script의 SHEET_ID가 아직 실제 Google Sheet ID로 설정되지 않았습니다. ZIP 안의 GOOGLE-APPS-SCRIPT-INQUIRY.txt로 스크립트를 교체하고 새 /exec URL을 contact.html form action에 넣어주세요.";
    }

    if (code === "SHEET_OPEN_FAILED") {
      return "Google Apps Script가 Google Sheet를 열지 못했습니다. SHEET_ID, 시트 접근 권한, 웹앱 실행 계정을 확인해 주세요.";
    }

    if (code === "SHEET_WRITE_FAILED") {
      return "Google Sheet 행 저장에 실패했습니다. Apps Script 실행 로그에서 권한 승인, 시트 보호, 할당량을 확인해 주세요.";
    }

    if (code === "VALIDATION_FAILED") {
      return (
        data.message ||
        "서버에서 필수 입력값이 누락된 것으로 판단했습니다. 입력 내용을 다시 확인해 주세요."
      );
    }

    return (
      data.message ||
      "서버 접수 응답이 실패했습니다. 입력 내용은 유지됩니다. contact@novawork.kr 또는 카카오톡으로 보내주세요."
    );
  };

  window.addEventListener("message", function (event) {
    const data = parseMessageData(event.data);

    if (!isTrustedFormMessage(event, data)) {
      return;
    }

    const canAcceptResponse =
      isSubmitting || Date.now() <= lateResponseWindowUntil;

    if (!canAcceptResponse) {
      return;
    }

    serverMessageReceived = true;

    if (data.status === "success") {
      finishSuccess(
        data.message ||
          "문의가 접수되었습니다. 24시간 내 1차 답변을 드리겠습니다.",
        true,
        true,
      );
      return;
    }

    finishError(serverErrorMessage(data), { allowWhenNotSubmitting: true });
  });

  if (iframe) {
    iframe.addEventListener("load", function () {
      // iframe load 자체만으로 성공/실패를 판단하면 정상 접수 중에도 오류가 표시될 수 있으므로,
      // 최종 판단은 postMessage 또는 단계별 fallbackTimer에 맡깁니다.
    });
  }

  form.querySelectorAll("input, textarea, select").forEach(function (field) {
    const eventName =
      field.type === "checkbox" ||
      field.type === "radio" ||
      field.tagName === "SELECT"
        ? "change"
        : "input";

    field.addEventListener(eventName, function () {
      if (field.classList.contains("is-invalid")) {
        field.classList.remove("is-invalid");
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
      }

      const fieldWrap =
        field.closest(".field") || field.closest(".consent-item");
      const fieldError = fieldWrap
        ? fieldWrap.querySelector(".field-error")
        : null;
      const groupError =
        (field.closest(".check-grid") &&
          field.closest(".check-grid").querySelector(".form-group-error")) ||
        (field.closest(".radio-group") &&
          field.closest(".radio-group").querySelector(".form-group-error"));

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
      scheduleDraftSave();
    });
  });

  applyPackageParam();
  applyServiceParam();
  restoreDraft();
  populateTrackingFields();
  updateCounter();
  syncChoiceState();
  syncConditionalFields();
  updateServicePrepGuide();
  initContactFormStepper();
  window.addEventListener("beforeunload", writeDraft);
};
