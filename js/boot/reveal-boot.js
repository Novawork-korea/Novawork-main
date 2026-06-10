(function () {
  var root = document.documentElement;
  var routeEntering = root.classList.contains('nw-route-entering') || window.__NW_ROUTE_ENTERING === true;
  window.__NW_REVEAL_BOOT = (window.performance && performance.now) ? performance.now() : Date.now();

  if (routeEntering) {
    root.classList.remove('site-is-loading', 'site-is-revealing');
    root.classList.add('site-is-ready', 'site-reveal-done');
    window.__NW_REVEAL_DONE = false;
    return;
  }

  root.classList.add('site-is-loading');
  root.classList.remove('site-is-ready', 'site-is-revealing', 'site-reveal-done');
  window.__NW_REVEAL_FAILSAFE = window.setTimeout(function () {
    root.classList.remove('site-is-loading', 'site-is-revealing');
    root.classList.add('site-is-ready', 'site-reveal-done');
    window.__NW_REVEAL_DONE = true;
    var loader = document.querySelector('.site-loader');
    if (loader) loader.setAttribute('hidden', '');
    try {
      document.dispatchEvent(new CustomEvent('novawork:logo-intro-start'));
      window.dispatchEvent(new CustomEvent('novawork:logo-intro-start'));
    } catch (error) {}
  }, 3000);
})();
