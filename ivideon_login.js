(function() {
  function log(msg) {
    try { console.debug('[ivideon_login]', msg); } catch (_) {}
  }

  function isOnLoginPage() {
    var href = location.href;
    if (/ivideon\.com\/login/i.test(href)) return true;
    // Some flows show login in an embedded form or sso
    return Boolean(document.querySelector('form[action*="/login"], input[name="email"], input[type="email"][name], input[type="password"][name]'));
  }

  function tryFillAndSubmit(creds) {
    if (!creds || !creds.ivideonEmail || !creds.ivideonPassword) {
      return;
    }

    var emailSel = [
      'input[type="email"][name="email"]',
      'input[name="email"]',
      '#email',
      'input[type="text"][name="email"]',
      'input[type="email"]'
    ];
    var passSel = [
      'input[type="password"][name="password"]',
      '#password',
      'input[type="password"]'
    ];
    var submitSel = [
      'button[type="submit"]',
      'button[name="submit"]',
      'input[type="submit"]'
    ];

    var email = null;
    for (var i = 0; i < emailSel.length && !email; i++) email = document.querySelector(emailSel[i]);
    var pass = null;
    for (var j = 0; j < passSel.length && !pass; j++) pass = document.querySelector(passSel[j]);
    if (!email || !pass) {
      log('email/pass fields not found yet');
      return;
    }

    // Only fill if empty to avoid fighting user
    if (!email.value) email.value = creds.ivideonEmail;
    if (!pass.value) pass.value = creds.ivideonPassword;

    // Dispatch input events so sites notice programmatic fill
    email.dispatchEvent(new Event('input', { bubbles: true }));
    pass.dispatchEvent(new Event('input', { bubbles: true }));

    if (creds.ivideonAutoLogin) {
      var btn = null;
      for (var k = 0; k < submitSel.length && !btn; k++) btn = document.querySelector(submitSel[k]);
      if (btn) {
        setTimeout(function() { btn.click(); }, 200);
      }
    }
  }

  function init() {
    if (!/ivideon\.com|extcam\.com/i.test(location.hostname)) return;

    chrome.storage.local.get(['ivideonEmail', 'ivideonPassword', 'ivideonAutoLogin'], function(data) {
      if (!data || (!data.ivideonEmail && !data.ivideonPassword)) return;

      if (isOnLoginPage()) {
        tryFillAndSubmit(data);
      }

      // Observe SPA or delayed renders
      var obs = new MutationObserver(function() {
        if (isOnLoginPage()) {
          tryFillAndSubmit(data);
        }
      });
      try {
        obs.observe(document.documentElement || document.body, { childList: true, subtree: true });
      } catch (_) {}
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
