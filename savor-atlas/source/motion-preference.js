// Keep motion enabled on both the homepage and the standalone/embedded kitchen.
// Legacy saved preferences and OS settings must not disable this experience.
(() => {
  const changes = new EventTarget();
  document.documentElement.dataset.motion = 'full';
  window.SavorAtlasMotion = {
    get matches() { return false; },
    addEventListener(...args) { changes.addEventListener(...args); },
    removeEventListener(...args) { changes.removeEventListener(...args); }
  };
})();
