/* React Bits adaptations: SpotlightCard and FadeContent.
 * Copyright (c) 2026 David Haz, MIT + Commons Clause.
 * Full license and exact upstream paths: THIRD_PARTY_NOTICES.md.
 * Native DOM/CSS implementation for WildFrame; no React or GSAP runtime.
 */
let revealObserver = null;
const revealedRecipes = new Set();

function refreshLibraryVisuals() {
  if (!revealObserver) return;
  revealObserver.disconnect();
  document.querySelectorAll('.recipe-card').forEach(card => {
    if (!revealedRecipes.has(card.dataset.id)) revealObserver.observe(card);
  });
}

function keepFocusedControlVisible() {
  const control = document.activeElement;
  if (!(control instanceof HTMLElement) || !control.matches('input,select,textarea,button,a,summary')) return;
  const layer = control.closest('.overlay.open');
  if (!layer) return;
  const bar = layer.querySelector('.prompt-actions[id]');
  if (bar?.contains(control)) return;
  const box = control.getBoundingClientRect();
  const top = layer.querySelector('.dialog-top').getBoundingClientRect().bottom + 12;
  const viewport = window.visualViewport;
  const viewportBottom = viewport ? viewport.offsetTop + viewport.height : innerHeight;
  const fixedBar = bar && getComputedStyle(bar).position === 'fixed';
  const bottom = Math.min(viewportBottom - 12, fixedBar ? bar.getBoundingClientRect().top - 12 : viewportBottom - 12);
  if (bottom <= top) return;
  if (box.bottom > bottom) layer.scrollTop += box.bottom - bottom;
  else if (box.top < top) layer.scrollTop -= top - box.top;
}

function initializeVisuals() {
  // FadeContent's once-only entrance and stagger, with native animation and
  // the actual library scroll container instead of document scroll triggers.
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(entries => {
      let stagger = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const card = entry.target;
        revealObserver.unobserve(card);
        if (revealedRecipes.has(card.dataset.id)) continue;
        revealedRecipes.add(card.dataset.id);
        if (reduced.matches || $('#promptSearch').value.trim()) continue;
        card.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], {
          duration: 380, delay: Math.min(stagger++ * 35, 140), easing: 'cubic-bezier(.22,.61,.36,1)'
        });
      }
    }, { root: library, threshold: 0.06 });
  }

  // SpotlightCard's pointer-centred radial light and masked rim. Delegated
  // events avoid a global pointer listener and animation loop for every card.
  const grid = $('#recipeGrid');
  let litCard = null, pending = 0, point = null;
  const clear = () => {
    litCard?.classList.remove('spotlight-active');
    litCard = null; point = null;
    cancelAnimationFrame(pending); pending = 0;
  };
  grid.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reduced.matches) return;
    const card = event.target.closest('.recipe-card');
    if (card !== litCard) { clear(); litCard = card; }
    if (!card) return;
    point = { x: event.clientX, y: event.clientY };
    if (!pending) pending = requestAnimationFrame(() => {
      pending = 0;
      if (!litCard || !point) return;
      const box = litCard.getBoundingClientRect();
      litCard.style.setProperty('--spot-x', `${point.x - box.left}px`);
      litCard.style.setProperty('--spot-y', `${point.y - box.top}px`);
      litCard.classList.add('spotlight-active');
    });
  });
  grid.addEventListener('pointerleave', clear);
  library.addEventListener('scroll', clear, { passive: true });
  reduced.addEventListener('change', () => {
    clear();
    if (reduced.matches) document.getAnimations().forEach(animation => animation.cancel());
  });
  document.addEventListener('focusin', () => requestAnimationFrame(keepFocusedControlVisible));
  window.visualViewport?.addEventListener('resize', () => requestAnimationFrame(keepFocusedControlVisible));
}
