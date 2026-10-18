// A user's explicit choice applies to this site; the default follows the OS.
(() => {
  const key = 'savor-atlas:motion:v1';
  const system = matchMedia('(prefers-reduced-motion: reduce)');
  const changes = new EventTarget();
  const valid = value => ['system', 'full', 'reduced'].includes(value);
  let preference = 'system';
  try { const saved = localStorage.getItem(key); if (valid(saved)) preference = saved; } catch {}

  function syncFrames() {
    const message = {type: 'savor-atlas:motion', preference};
    if (parent !== window) parent.postMessage(message, location.origin);
    document.querySelector('#recipeFrame')?.contentWindow?.postMessage(message, location.origin);
  }
  function updateControls() {
    const full = document.documentElement.dataset.motion === 'full';
    document.querySelectorAll('[data-motion-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(full));
      button.setAttribute('aria-label', full ? 'Reduce effects' : 'Enable effects');
      button.title = full ? 'Effects are on. Select to reduce motion.' : 'Enable rotation and transitions for this website.';
      button.querySelector('[data-motion-label]').textContent = full ? 'Effects: On' : 'Effects: Reduced';
    });
  }
  function apply(sync = true) {
    const reduce = preference === 'reduced' || preference === 'system' && system.matches;
    document.documentElement.dataset.motion = reduce ? 'reduced' : 'full';
    updateControls();
    changes.dispatchEvent(new Event('change'));
    if (sync) syncFrames();
  }
  window.SavorAtlasMotion = {
    get matches() { return document.documentElement.dataset.motion === 'reduced'; },
    addEventListener(...args) { changes.addEventListener(...args); },
    removeEventListener(...args) { changes.removeEventListener(...args); }
  };
  apply(false);
  document.addEventListener('DOMContentLoaded', updateControls, {once: true});
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-motion-toggle]');
    if (!button) return;
    preference = window.SavorAtlasMotion.matches ? 'full' : 'reduced';
    try { localStorage.setItem(key, preference); } catch {}
    apply();
    const menu = button.closest('details');
    if (menu) { menu.open = false; menu.querySelector('summary').focus({preventScroll: true}); }
  });
  system.addEventListener('change', () => { if (preference === 'system') apply(); });
  addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : 'system';
    apply(false);
  });
  addEventListener('message', event => {
    if (event.origin !== location.origin || !event.data || typeof event.data !== 'object') return;
    const child = document.querySelector('#recipeFrame')?.contentWindow;
    if (event.source !== child && !(parent !== window && event.source === parent)) return;
    if (event.data.type === 'savor-atlas:ready') syncFrames();
    else if (event.data.type === 'savor-atlas:motion' && valid(event.data.preference)) {
      preference = event.data.preference;
      apply(false);
    }
  });
})();
