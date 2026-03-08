let initialized = false;

function clamp01(n: number) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function updateRangeFill(el: HTMLInputElement) {
  if (el.type !== 'range') return;

  const min = Number.parseFloat(el.min || '0');
  const max = Number.parseFloat(el.max || '100');
  const value = Number.parseFloat(el.value || '0');

  const span = max - min;
  const ratio =
    Number.isFinite(span) && span > 0 && Number.isFinite(value)
      ? clamp01((value - min) / span)
      : 0;

  el.style.setProperty('--range-pct', `${(ratio * 100).toFixed(4)}%`);
}

function isRangeInput(target: EventTarget | null): target is HTMLInputElement {
  return (
    !!target &&
    (target as any).tagName === 'INPUT' &&
    (target as HTMLInputElement).type === 'range'
  );
}

function initExistingRanges(root: ParentNode = document) {
  root.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach((el) =>
    updateRangeFill(el),
  );
}

export function initRangeFill() {
  if (initialized) return;
  initialized = true;

  // Initial paint for any already-mounted sliders.
  initExistingRanges();

  // Keep filled track in sync while interacting.
  const onInput = (e: Event) => {
    if (!isRangeInput(e.target)) return;
    updateRangeFill(e.target);
  };
  document.addEventListener('input', onInput, true);
  document.addEventListener('change', onInput, true);

  // Handle sliders that mount later (route changes, modals, etc.).
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches('input[type="range"]')) updateRangeFill(node as any);
        node
          .querySelectorAll?.<HTMLInputElement>('input[type="range"]')
          .forEach((el) => updateRangeFill(el));
      }
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
}

