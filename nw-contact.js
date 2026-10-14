/* NOVAWORK contact. Keeps the existing Apps Script endpoint and field contract. */
(() => {
  'use strict';
  const form = document.querySelector('[data-contact-form]');
  if (!form || form.dataset.contactReady === 'true') return;

  const fields = {
    name: form.querySelector('#contact-name'),
    reply: form.querySelector('#contact-reply'),
    service: form.querySelector('#contact-service'),
    message: form.querySelector('#contact-message'),
    privacy: form.querySelector('#contact-privacy'),
  };
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('[data-contact-status]');
  if (Object.values(fields).some(field => !field) || !button || !status) return;
  form.dataset.contactReady = 'true';

  const allowedOrigins = new Set([
    'https://script.google.com',
    'https://script.googleusercontent.com',
  ]);
  function isAllowedResponseOrigin(origin) {
    return allowedOrigins.has(origin) ||
      /^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/.test(origin);
  }

  function isResponseFrameSource(source, expectedFrame) {
    // Apps Script HtmlService runs inside Google's nested sandbox iframe.
    // Cross-origin Window.parent is readable; DOM/location access is unnecessary.
    // Require the sender to be the current response frame or one of its children.
    try {
      for (let depth = 0; source && depth < 12; depth += 1) {
        if (source === expectedFrame) return true;
        const parent = source.parent;
        if (!parent || parent === source) return false;
        source = parent;
      }
    } catch (_) { /* A detached/inaccessible frame cannot prove a response's origin. */ }
    return false;
  }

  const serviceAliases = {
    homepage: '방문자가 내용을 이해하고 문의하는 흐름을 만들고 싶어요.',
    system: '흩어진 업무와 처리 상태를 한곳에서 확인하고 싶어요.',
    automation: '반복해서 확인하고 옮기는 일을 줄이고 싶어요.',
    ai: '업무 자료를 찾고 반복 질문에 답하는 과정을 정리하고 싶어요.',
    analytics: '고객이 들어온 경로와 이후 행동을 확인하고 싶어요.',
    care: '운영 중인 화면이나 기능의 불편한 부분을 수정하고 싶어요.',
    'homepage-landing': '방문자가 내용을 이해하고 문의하는 흐름을 만들고 싶어요.',
    'react-firebase-admin': '흩어진 업무와 처리 상태를 한곳에서 확인하고 싶어요.',
    'homepage-fix': '운영 중인 화면이나 기능의 불편한 부분을 수정하고 싶어요.',
    'ga4-gtm': '고객이 들어온 경로와 이후 행동을 확인하고 싶어요.',
    'gpt-ai-chatbot': '업무 자료를 찾고 반복 질문에 답하는 과정을 정리하고 싶어요.',
    'web-crawling': '반복해서 확인하고 옮기는 일을 줄이고 싶어요.',
  };
  let activeRequest = null;
  let lastSentValues = '';
  let lastResult = null;
  let sequence = 0;

  // Discard drafts created by the old form. The new form never stores inquiry PII.
  try {
    sessionStorage.removeItem('novawork_inquiry_draft');
    sessionStorage.removeItem('novawork_inquiry_draft_v43');
  } catch (_) { /* Storage may be blocked; the form still works. */ }

  const params = new URLSearchParams(location.search);
  const isPreviewRequest = params.get('intent') === 'preview';
  const serviceParam = params.get('service');
  const selectedContext = Object.prototype.hasOwnProperty.call(serviceAliases, serviceParam)
    ? serviceAliases[serviceParam] : '';
  // Keep old incoming links meaningful without restoring the product catalogue.
  // Do not overwrite a value restored by the browser or already entered by a visitor.
  if (selectedContext && !fields.service.value.trim()) {
    fields.service.value = selectedContext;
  }
  if (isPreviewRequest) {
    const heading = document.querySelector('#contact-heading');
    const intro = document.querySelector('#contact-intro');
    const intent = document.querySelector('#contact-intent');
    if (heading) heading.textContent = '만들 화면을 먼저 이야기해요.';
    if (intro) intro.textContent = '현재 업무, 원하는 결과, 참고 화면이나 링크를 알려주세요. 무료 시안으로 확인할 화면과 범위를 함께 정리합니다.';
    if (intent) intent.hidden = false;
    document.title = '무료 시안 상담 | NOVAWORK';
  }

  function valuesFingerprint() {
    return JSON.stringify([
      fields.name.value.trim(), fields.reply.value.trim(), fields.service.value,
      fields.message.value.trim(), fields.privacy.checked,
    ]);
  }

  function setStatus(message, kind = '') {
    status.textContent = message;
    status.className = 'form-status' + (kind ? ' is-' + kind : '');
  }

  function syncButton() {
    const unchanged = Boolean(lastSentValues && valuesFingerprint() === lastSentValues);
    button.disabled = Boolean(activeRequest) || unchanged;
    const sentLabel = lastResult && lastResult.kind === 'success'
      ? '접수 완료 ✓' : '접수 확인 대기';
    button.textContent = activeRequest ? '문의 전송 중…' : unchanged ? sentLabel : '문의 접수하기 ↗';
    form.setAttribute('aria-busy', activeRequest ? 'true' : 'false');
  }

  function setError(field, message) {
    const error = form.querySelector('#' + field.id + '-error');
    if (!error) return;
    error.textContent = message;
    error.hidden = !message;
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    const ids = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== error.id);
    if (message) ids.push(error.id);
    if (ids.length) field.setAttribute('aria-describedby', ids.join(' '));
    else field.removeAttribute('aria-describedby');
  }

  function replyType(value) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
    const digits = value.replace(/\D/g, '');
    if (/^\+?[\d\s().-]+$/.test(value) && digits.length >= 8 && digits.length <= 15) return 'phone';
    return '';
  }

  function validate() {
    const errors = [
      [fields.name, fields.name.value.trim() ? '' : '이름을 입력해 주세요.'],
      [fields.reply, replyType(fields.reply.value.trim()) ? '' : '이메일 또는 전화번호를 확인해 주세요.'],
      [fields.message, fields.message.value.trim().length >= 20 ? '' : '문의 내용을 20자 이상 작성해 주세요.'],
      [fields.privacy, fields.privacy.checked ? '' : '개인정보 수집·이용에 동의해 주세요.'],
    ];
    errors.forEach(([field, message]) => setError(field, message));
    const firstError = errors.find(([, message]) => message);
    if (firstError) {
      setStatus('입력한 내용을 확인해 주세요.', 'error');
      firstError[0].focus();
      return false;
    }
    return true;
  }

  function hidden(name, value) {
    const field = form.querySelector('input[type="hidden"][name="' + name + '"]');
    if (field) field.value = value;
  }

  function finish(request, kind, message) {
    if (activeRequest !== request) return;
    clearTimeout(request.softTimeout);
    clearTimeout(request.hardTimeout);
    activeRequest = null;
    lastResult = { kind, message };
    // Leave every input untouched, even if it changed while the request was pending.
    setStatus(message, kind);
    syncButton();
    request.frame.remove();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (activeRequest || (lastSentValues && valuesFingerprint() === lastSentValues)) return;
    if (!validate()) return;
    const honeypot = form.querySelector('[name="website"]');
    if (honeypot && honeypot.value.trim()) {
      setStatus('양식으로 전송할 수 없습니다. 카카오톡 또는 이메일로 문의해 주세요.', 'error');
      return;
    }

    const reply = fields.reply.value.trim();
    const kind = replyType(reply);
    hidden('email', kind === 'email' ? reply : '');
    hidden('phone', kind === 'phone' ? reply : '');
    // The existing backend receives its established "other" category, with the
    // optional situation and preview intent in the existing free-text field.
    hidden('service', '기타');
    const context = fields.service.value.trim();
    hidden('service_other', [isPreviewRequest ? '무료 시안 요청' : '', context].filter(Boolean).join(' · ') || '상담 후 결정');
    hidden('page_url', location.origin + location.pathname);
    hidden('page_title', document.title);
    hidden('page_origin', location.origin);
    const now = new Date().toISOString();
    hidden('submitted_at', now);
    hidden('submitted_at_client', now);

    // A fresh frame per submission prevents an old response matching a new request.
    const frame = document.createElement('iframe');
    frame.name = 'novawork-contact-response-' + (++sequence);
    frame.title = '문의 전송 결과';
    frame.hidden = true;
    // The response needs scripts and its real origin for postMessage verification,
    // but must not open windows or navigate the visitor's top-level page.
    frame.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin');
    frame.referrerPolicy = 'no-referrer';
    document.body.appendChild(frame);
    form.target = frame.name;
    const request = { frame, source: frame.contentWindow, values: valuesFingerprint() };
    activeRequest = request;
    lastSentValues = request.values;
    lastResult = null;
    setStatus('문의를 전송하고 있습니다. 접수 확인까지 잠시 기다려 주세요.');
    syncButton();

    request.softTimeout = setTimeout(() => {
      if (activeRequest !== request) return;
      setStatus('접수 확인이 지연되고 있습니다. 중복 접수를 방지하기 위해 잠시 기다려 주세요.', 'pending');
    }, 30000);
    request.hardTimeout = setTimeout(() => {
      finish(request, 'pending', '접수 여부를 확인하지 못했습니다. 이미 전달되었을 수 있으므로 카카오톡 또는 이메일로 접수 여부를 확인해 주세요. 입력 내용은 유지됩니다.');
    }, 90000);

    try {
      HTMLFormElement.prototype.submit.call(form);
    } catch (_) {
      lastSentValues = '';
      finish(request, 'error', '전송을 시작하지 못했습니다. 카카오톡 또는 이메일로 문의해 주세요.');
    }
  });

  window.addEventListener('message', event => {
    const request = activeRequest;
    if (!request || !isAllowedResponseOrigin(event.origin) ||
        !isResponseFrameSource(event.source, request.source)) return;
    let data = event.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (_) { return; }
    }
    if (!data || typeof data !== 'object' || Array.isArray(data) || data.source !== 'novawork-inquiry') return;
    if (data.status === 'success') {
      const changed = valuesFingerprint() !== request.values;
      finish(request, 'success', changed
        ? '이전 문의는 접수되었습니다. 수정한 내용은 아직 전송되지 않았습니다.'
        : '문의가 접수되었습니다. 입력하신 연락처로 답변드리겠습니다.');
    } else if (data.status === 'error') {
      // Server diagnostics are not displayed to visitors and never imply delivery.
      finish(request, 'error', '접수를 확인하지 못했습니다. 입력 내용은 유지됩니다. 카카오톡 또는 이메일로 문의해 주세요.');
    }
    // Iframe load, unknown payloads, null origins and unrelated frames never prove delivery.
  });

  function syncEditedResult() {
    if (!activeRequest && lastSentValues && lastResult) {
      const changed = valuesFingerprint() !== lastSentValues;
      if (lastResult.kind === 'success') {
        setStatus(changed
          ? '이전 문의는 접수되었습니다. 수정한 내용은 아직 전송되지 않았습니다.'
          : '문의가 접수되었습니다. 입력하신 연락처로 답변드리겠습니다.', 'success');
      } else {
        setStatus(changed
          ? '내용이 변경되었습니다. 이전 문의의 접수 여부를 카카오톡 또는 이메일로 먼저 확인해 주세요.'
          : lastResult.message, lastResult.kind);
      }
    }
    syncButton();
  }

  form.addEventListener('input', event => {
    if (event.target && event.target.id) setError(event.target, '');
    syncEditedResult();
  });
  form.addEventListener('change', syncEditedResult);
  window.addEventListener('pageshow', () => {
    // A restored page must not silently unlock the same request for duplicate sending.
    syncButton();
  });
  syncButton();
})();
