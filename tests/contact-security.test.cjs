const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'nw-contact.js'), 'utf8');

// A network-free DOM boundary: the native submit method only records calls.
// Timers are advanced explicitly so timeout and late-response races are repeatable.
function setup({ search = '', service = '' } = {}) {
  class Element {
    constructor(id = '') {
      this.id = id;
      this.dataset = {};
      this.attributes = {};
      this.listeners = {};
      this.value = '';
      this.checked = false;
      this.hidden = false;
      this.disabled = false;
      this.textContent = '';
    }
    set value(value) { this._value = String(value); }
    get value() { return this._value; }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    getAttribute(name) { return this.attributes[name] ?? null; }
    removeAttribute(name) { delete this.attributes[name]; }
    addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
    dispatch(type, values = {}) {
      const event = { target: this, preventDefault() {}, ...values };
      for (const listener of this.listeners[type] || []) listener(event);
    }
    focus() { this.focused = true; }
    remove() { this.removed = true; }
  }
  const window = new Element();
  window.parent = window;
  const form = new Element('inquiry-form');
  const fields = Object.fromEntries(['name', 'reply', 'service', 'message', 'privacy']
    .map(name => [name, new Element('contact-' + name)]));
  fields.name.value = 'Synthetic visitor';
  fields.reply.value = 'synthetic@example.invalid';
  fields.service.value = service;
  fields.message.value = 'This synthetic enquiry is never sent to any server.';
  fields.privacy.checked = true;
  const errors = Object.fromEntries(Object.values(fields)
    .map(field => [field.id + '-error', new Element(field.id + '-error')]));
  const hidden = Object.fromEntries(['email', 'phone', 'service', 'service_other',
    'page_url', 'page_title', 'page_origin', 'submitted_at', 'submitted_at_client']
    .map(name => [name, new Element(name)]));
  const honeypot = new Element('contact-website');
  const button = new Element();
  button.disabled = true;
  const status = new Element();
  const selectors = {
    'button[type="submit"]': button,
    '[data-contact-status]': status,
    '[name="website"]': honeypot,
  };
  for (const element of [...Object.values(fields), ...Object.values(errors)]) {
    selectors['#' + element.id] = element;
  }
  for (const [name, element] of Object.entries(hidden)) {
    selectors['input[type="hidden"][name="' + name + '"]'] = element;
  }
  form.querySelector = selector => selectors[selector] || null;
  const frames = [];
  const document = {
    title: '프로젝트 상담 | NOVAWORK',
    querySelector: selector => selector === '[data-contact-form]' ? form : null,
    createElement: tag => {
      assert.equal(tag, 'iframe');
      const frame = new Element();
      frame.contentWindow = { parent: window };
      return frame;
    },
    body: { appendChild(frame) { frames.push(frame); } },
  };
  const timers = new Map();
  let timerSequence = 0;
  let submitFailure = false;
  let submissions = 0;
  const storageRemovals = [];
  const context = {
    window, document, URLSearchParams,
    location: { origin: 'https://novawork.example', pathname: '/contact.html', search },
    sessionStorage: { removeItem(key) { storageRemovals.push(key); } },
    setTimeout(fn, delay) {
      const id = ++timerSequence;
      timers.set(id, { fn, delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    HTMLFormElement: { prototype: { submit() {
      assert.equal(this, form);
      if (submitFailure) throw new Error('Synthetic blocked navigation');
      submissions++;
    } } },
  };
  vm.runInNewContext(source, context, { filename: 'nw-contact.js' });
  return {
    window, form, fields, hidden, honeypot, button, status, frames, timers, storageRemovals,
    get submissions() { return submissions; },
    set submitFailure(value) { submitFailure = value; },
    submit() { form.dispatch('submit'); },
    reply(data = { source: 'novawork-inquiry', status: 'success' }, options = {}) {
      window.dispatch('message', {
        source: frames.at(-1)?.contentWindow,
        origin: 'https://script.google.com', data, ...options,
      });
    },
    tick(delay) {
      for (const [id, timer] of timers) {
        if (timer.delay === delay) {
          timers.delete(id);
          timer.fn();
        }
      }
    },
  };
}

test('only declared service aliases populate empty fields', () => {
  for (const name of ['__proto__', 'constructor', 'toString', 'valueOf', 'hasOwnProperty']) {
    assert.equal(setup({ search: '?service=' + name }).fields.service.value, '');
  }
  assert.match(setup({ search: '?service=automation' }).fields.service.value, /반복/);
  assert.equal(setup({ search: '?service=automation', service: 'Restored text' }).fields.service.value, 'Restored text');
});

test('response frames retain scripts and true origins while denying top navigation and popups', () => {
  const page = setup();
  page.submit();
  assert.equal(page.submissions, 1);
  assert.equal(page.frames[0].getAttribute('sandbox'), 'allow-forms allow-scripts allow-same-origin');
  assert.equal(page.frames[0].referrerPolicy, 'no-referrer');
});

test('foreign and null origins cannot acknowledge a request, even from its response frame', () => {
  const page = setup();
  page.submit();
  for (const origin of ['null', '', 'http://script.google.com', 'https://attacker.example',
    'https://script.google.com.attacker.example', 'https://anything.googleusercontent.com',
    'https://x-script.googleusercontent.com.attacker.example']) {
    page.reply(undefined, { origin });
    assert.equal(page.form.getAttribute('aria-busy'), 'true', origin);
  }
  page.reply();
  assert.equal(page.form.getAttribute('aria-busy'), 'false');
  assert.match(page.status.textContent, /문의가 접수되었습니다/);
});

test('allowed Google origins must also belong to the current response frame tree', () => {
  const page = setup();
  page.submit();
  const unrelated = {};
  unrelated.parent = unrelated;
  for (const source of [null, page.window, unrelated, { parent: page.window },
    { get parent() { throw new Error('Detached source'); } }]) {
    page.reply(undefined, { source });
    assert.equal(page.form.getAttribute('aria-busy'), 'true');
  }
  const child = { parent: { parent: page.frames[0].contentWindow } };
  page.reply(JSON.stringify({ source: 'novawork-inquiry', status: 'success' }), {
    origin: 'https://valid-script.googleusercontent.com', source: child,
  });
  assert.match(page.status.textContent, /문의가 접수되었습니다/);
});

test('loads, malformed payloads and unknown statuses never prove receipt', () => {
  const page = setup();
  page.submit();
  page.frames[0].dispatch('load');
  for (const data of [null, 'invalid json', [], {}, { source: 'other', status: 'success' },
    { source: 'novawork-inquiry', status: 'pending' }, { status: 'success' }]) {
    page.reply(data);
    assert.equal(page.form.getAttribute('aria-busy'), 'true');
  }
  page.reply({ source: 'novawork-inquiry', status: 'error', message: '<img onerror=alert(1)> Private backend error' });
  assert.match(page.status.textContent, /접수를 확인하지 못했습니다/);
  assert.doesNotMatch(page.status.textContent, /Private|onerror/);
});

test('timeouts preserve drafts, avoid success claims and lock unchanged duplicate submissions', () => {
  const page = setup();
  const details = page.fields.message.value;
  page.submit();
  page.tick(30000);
  assert.match(page.status.textContent, /지연/);
  assert.equal(page.form.getAttribute('aria-busy'), 'true');
  page.tick(90000);
  assert.match(page.status.textContent, /접수 여부를 확인하지 못했습니다/);
  assert.equal(page.fields.message.value, details);
  assert.equal(page.frames[0].removed, true);
  assert.equal(page.button.disabled, true);
  page.window.dispatch('pageshow');
  page.submit();
  assert.equal(page.submissions, 1);
});

test('late replies from previous frames cannot acknowledge a newer request', () => {
  const page = setup();
  page.submit();
  const previousSource = page.frames[0].contentWindow;
  page.tick(90000);
  page.fields.message.value += ' Additional synthetic details.';
  page.form.dispatch('input', { target: page.fields.message });
  page.submit();
  assert.equal(page.submissions, 2);
  assert.notEqual(page.frames[0].name, page.frames[1].name);
  page.reply(undefined, { source: previousSource });
  assert.equal(page.form.getAttribute('aria-busy'), 'true');
  page.reply();
  assert.equal(page.form.getAttribute('aria-busy'), 'false');
});

test('success refers to submitted values and preserves edits made while waiting', () => {
  const page = setup();
  page.submit();
  const edited = page.fields.message.value + ' An unsent change.';
  page.fields.message.value = edited;
  page.form.dispatch('input', { target: page.fields.message });
  page.reply();
  assert.equal(page.fields.message.value, edited);
  assert.match(page.status.textContent, /수정한 내용은 아직 전송되지 않았습니다/);
  assert.equal(page.button.disabled, false);
  assert.equal(page.timers.size, 0);
});

test('a synchronous submission failure clears the request and permits a retry', () => {
  const page = setup();
  page.submitFailure = true;
  page.submit();
  assert.equal(page.submissions, 0);
  assert.equal(page.button.disabled, false);
  assert.equal(page.timers.size, 0);
  assert.equal(page.frames[0].removed, true);
  assert.match(page.status.textContent, /전송을 시작하지 못했습니다/);
  page.submitFailure = false;
  page.submit();
  assert.equal(page.submissions, 1);
});

test('consent, essential fields and honeypot validation prevent submission', () => {
  for (const [name, value] of [['name', ' '], ['reply', 'invalid'], ['message', 'too short'], ['privacy', false]]) {
    const page = setup();
    if (name === 'privacy') page.fields[name].checked = value;
    else page.fields[name].value = value;
    page.submit();
    assert.equal(page.submissions, 0, name);
    assert.equal(page.fields[name].focused, true, name);
  }
  const page = setup();
  page.honeypot.value = 'automated field';
  page.submit();
  assert.equal(page.submissions, 0);
});

test('PII is not persisted and tracking fields omit query strings and fragments', () => {
  const page = setup({ search: '?email=private@example.invalid&token=secret&intent=preview' });
  page.submit();
  assert.deepEqual(page.storageRemovals, ['novawork_inquiry_draft', 'novawork_inquiry_draft_v43']);
  assert.equal(page.hidden.page_url.value, 'https://novawork.example/contact.html');
  assert.equal(page.hidden.email.value, 'synthetic@example.invalid');
  assert.equal(page.hidden.phone.value, '');
  assert.equal(page.hidden.service.value, '기타');
  assert.match(page.hidden.service_other.value, /무료 시안 요청/);
  const phone = setup();
  phone.fields.reply.value = '+82 10-1234-5678';
  phone.submit();
  assert.equal(phone.hidden.email.value, '');
  assert.equal(phone.hidden.phone.value, '+82 10-1234-5678');
});
test('case context is allowlisted and preserves the existing enquiry contract', () => {
  const cases = {
    'naver-rank': '네이버 순위 확인 사례처럼 반복 확인과 기록을 줄이고 싶어요.',
    'customer-portal': '고객 포털 사례처럼 계정별로 업무 도구를 제공하고 싶어요.',
    'order-demo': '도면·발주 시안처럼 파일 검토와 진행 현황을 정리하고 싶어요.',
    'inflow-demo': '유입 경로 시안처럼 채널별 이동과 결과를 확인하고 싶어요.',
  };
  for (const [slug, context] of Object.entries(cases)) {
    const page = setup({ search: '?case=' + slug });
    assert.equal(page.fields.service.value, context);
    assert.equal(page.fields.message.value, 'This synthetic enquiry is never sent to any server.');
    page.submit();
    assert.equal(page.hidden.service.value, '기타');
    assert.equal(page.hidden.service_other.value, context);
  }
  for (const slug of ['unknown', '__proto__', 'constructor', 'toString', '<svg/onload=alert(1)>']) {
    assert.equal(setup({ search: '?case=' + encodeURIComponent(slug) }).fields.service.value, '');
  }
});

test('case links preserve restored input and coexist with service and preview links', () => {
  assert.equal(setup({ search: '?case=naver-rank', service: 'Restored text' }).fields.service.value, 'Restored text');
  assert.equal(setup({ search: '?service=automation&case=naver-rank' }).fields.service.value,
    setup({ search: '?service=automation' }).fields.service.value);
  const page = setup({ search: '?intent=preview&case=order-demo' });
  page.submit();
  assert.match(page.hidden.service_other.value, /^무료 시안 요청 · 도면·발주 시안처럼/);
});
