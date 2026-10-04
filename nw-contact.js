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
  const serviceAliases = {
    homepage: '홈페이지·랜딩페이지 제작',
    system: 'React·Firebase 관리자 웹시스템',
    automation: '웹 데이터 크롤링·엑셀 수집',
    ai: '맞춤형 GPT·AI 챗봇',
    analytics: 'GA4/GTM 전환 추적 세팅',
    care: '홈페이지 오류 수정·기능 추가',
    'homepage-landing': '홈페이지·랜딩페이지 제작',
    'react-firebase-admin': 'React·Firebase 관리자 웹시스템',
    'homepage-fix': '홈페이지 오류 수정·기능 추가',
    'ga4-gtm': 'GA4/GTM 전환 추적 세팅',
    'gpt-ai-chatbot': '맞춤형 GPT·AI 챗봇',
    'web-crawling': '웹 데이터 크롤링·엑셀 수집',
  };
  let activeRequest = null;
  let lastSentValues = '';
  let sequence = 0;

  // Discard drafts created by the old form. The new form never stores inquiry PII.
  try {
    sessionStorage.removeItem('novawork_inquiry_draft');
    sessionStorage.removeItem('novawork_inquiry_draft_v43');
  } catch (_) { /* Storage may be blocked; the form still works. */ }

  const selectedService = serviceAliases[new URLSearchParams(location.search).get('service')];
  if (selectedService && Array.from(fields.service.options).some(option => option.value === selectedService)) {
    fields.service.value = selectedService;
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
    button.textContent = activeRequest ? '보내는 중…' : unchanged ? '전송한 내용' : '이야기 보내기 ↗';
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
      [fields.message, fields.message.value.trim().length >= 20 ? '' : '문의 내용을 20자 이상 적어주세요.'],
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
    hidden('service', fields.service.value || '기타');
    hidden('service_other', fields.service.value ? '' : '상담 후 결정');
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
    document.body.appendChild(frame);
    form.target = frame.name;
    const request = { frame, source: frame.contentWindow, values: valuesFingerprint() };
    activeRequest = request;
    lastSentValues = request.values;
    setStatus('문의 내용을 보내고 있습니다. 접수 확인까지 잠시 기다려 주세요.');
    syncButton();

    request.softTimeout = setTimeout(() => {
      if (activeRequest !== request) return;
      setStatus('접수 확인이 지연되고 있습니다. 중복 전송하지 말고 잠시 기다려 주세요.', 'pending');
    }, 30000);
    request.hardTimeout = setTimeout(() => {
      finish(request, 'pending', '접수 여부를 확인하지 못했습니다. 이미 전달됐을 수 있으니 카카오톡 또는 이메일로 접수 여부를 확인해 주세요. 입력한 내용은 그대로 남아 있습니다.');
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
    if (!request || event.source !== request.source || !allowedOrigins.has(event.origin)) return;
    let data = event.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (_) { return; }
    }
    if (!data || typeof data !== 'object' || Array.isArray(data) || data.source !== 'novawork-inquiry') return;
    if (data.status === 'success') {
      const changed = valuesFingerprint() !== request.values;
      finish(request, 'success', changed
        ? '전송한 문의가 접수되었습니다. 전송 후 수정한 내용은 아직 보내지 않았습니다.'
        : '문의가 접수되었습니다. 남겨주신 연락처로 답변드리겠습니다.');
    } else if (data.status === 'error') {
      // Server diagnostics are not displayed to visitors and never imply delivery.
      finish(request, 'error', '접수를 확인하지 못했습니다. 입력 내용은 유지됩니다. 카카오톡 또는 이메일로 문의해 주세요.');
    }
    // Iframe load, unknown payloads, null origins and nested-frame messages are not proof of delivery.
  });

  form.addEventListener('input', event => {
    if (event.target && event.target.id) setError(event.target, '');
    if (!activeRequest && lastSentValues && valuesFingerprint() !== lastSentValues) {
      setStatus('내용이 변경되었습니다. 앞서 보낸 내용의 접수 여부가 불확실하다면 먼저 확인해 주세요.');
    }
    syncButton();
  });
  form.addEventListener('change', syncButton);
  window.addEventListener('pageshow', () => {
    // A restored page must not silently unlock the same request for duplicate sending.
    syncButton();
  });
  syncButton();
})();
