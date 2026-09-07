/* ==========================================================================
   coverflow.js — one reusable iTunes-style cover flow.

   createCoverflow(rootEl, {
     items:        [{ src, title, sub }, …]
     aspect:       '1/1' | '2/3'
     coverHeight:  px (desktop)
     coverHeightSm:px (≤820px)
     autoMs:       ms between autoplay steps
     resumeMs:     ms of quiet before autoplay resumes after interaction
     label:        accessible name
   })

   Transform math is carried over from the old site — it worked. What changed:
   cross-browser reflections (no -webkit-box-reflect), wheel handling that never
   fights the page, keyboard support, and far covers fading fully to 0.

   No dependencies. GSAP is not involved here.
   ========================================================================== */

function createCoverflow(root, options) {
  var opts = options || {};
  var items = opts.items || [];
  if (!root || !items.length) return null;

  var aspect = opts.aspect === '2/3' ? '2/3' : '1/1';
  var autoMs = opts.autoMs || 4000;
  var resumeMs = opts.resumeMs || 6000;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var smallScreen = window.matchMedia('(max-width: 820px)');

  /* ------------------------------------------------------------- markup --- */

  root.classList.add('coverflow');
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carousel');
  root.setAttribute('tabindex', '0');
  if (opts.label && !root.getAttribute('aria-label')) {
    root.setAttribute('aria-label', opts.label);
  }
  root.innerHTML = '';

  var stage = document.createElement('div');
  stage.className = 'cf-stage';

  var nodes = items.map(function (item, i) {
    var el = document.createElement('div');
    el.className = 'cf-item';
    el.dataset.index = String(i);

    var cover = document.createElement('img');
    cover.className = 'cf-cover';
    cover.src = encodeURI(item.src);   // filenames carry spaces and apostrophes
    cover.alt = item.title || '';
    cover.loading = 'lazy';
    cover.decoding = 'async';
    cover.draggable = false;

    var reflect = document.createElement('img');
    reflect.className = 'cf-reflect';
    reflect.src = cover.src;
    reflect.alt = '';
    reflect.setAttribute('aria-hidden', 'true');
    reflect.loading = 'lazy';
    reflect.decoding = 'async';
    reflect.draggable = false;

    el.appendChild(cover);
    el.appendChild(reflect);
    stage.appendChild(el);
    return el;
  });

  var meta = document.createElement('div');
  meta.className = 'cf-meta';
  meta.setAttribute('aria-live', 'polite');
  meta.innerHTML = '<p class="cf-meta__title"></p><p class="cf-meta__sub"></p>';

  root.appendChild(stage);
  root.appendChild(meta);

  var metaTitle = meta.querySelector('.cf-meta__title');
  var metaSub = meta.querySelector('.cf-meta__sub');

  /* ----------------------------------------------------------- geometry --- */

  var coverW = 0;
  var spread = 0;

  function measure() {
    var h = smallScreen.matches
      ? (opts.coverHeightSm || Math.round((opts.coverHeight || 220) * 0.8))
      : (opts.coverHeight || 220);

    coverW = aspect === '2/3' ? Math.round(h * 2 / 3) : h;
    spread = coverW * 0.82;

    var reflectH = Math.round(h * 0.45);
    var stageH = h + reflectH;

    root.style.setProperty('--cf-w', coverW + 'px');
    root.style.setProperty('--cf-aspect', aspect === '2/3' ? '2 / 3' : '1 / 1');
    root.style.setProperty('--cf-reflect-h', reflectH + 'px');
    root.style.setProperty('--cf-stage-h', stageH + 'px');
    root.style.setProperty('--cf-h', (stageH + 56) + 'px');
    root.style.setProperty('--cf-h-sm', (stageH + 56) + 'px');
  }

  /* ------------------------------------------------------------ layout --- */

  var index = 0;

  function layout() {
    for (var i = 0; i < nodes.length; i++) {
      var o = i - index;
      var abs = Math.abs(o);
      var sign = o === 0 ? 0 : (o > 0 ? 1 : -1);

      var tx = o * spread;
      var tz = -Math.min(abs * 120, 600);
      var ry = sign * Math.min(abs * 36, 60);
      var sc = Math.max(1 - abs * 0.08, 0.7);

      nodes[i].style.transform =
        'translateX(' + tx + 'px) translateZ(' + tz + 'px) rotateY(' + ry + 'deg) scale(' + sc + ')';
      nodes[i].style.zIndex = String(1000 - abs);
      /* Old site floored opacity at 0.45, which left ghost covers loitering at
         the clip edge. Fade all the way out instead. */
      nodes[i].style.opacity = abs >= 4 ? '0' : String(Math.max(1 - abs * 0.22, 0));
      nodes[i].setAttribute('aria-hidden', abs === 0 ? 'false' : 'true');
    }
  }

  var metaTimer = null;

  function paintMeta() {
    var item = items[index];
    meta.classList.add('is-swapping');
    clearTimeout(metaTimer);
    metaTimer = setTimeout(function () {
      metaTitle.textContent = item.title || '';
      metaSub.textContent = item.sub || '';
      meta.classList.remove('is-swapping');
    }, reduced ? 0 : 180);
  }

  function go(next, fromUser) {
    var n = items.length;
    index = ((next % n) + n) % n;
    layout();
    paintMeta();
    if (fromUser) markInteraction();
  }

  /* ---------------------------------------------------------- autoplay --- */

  var hovered = false;
  var focused = false;
  var suspended = false;
  var resumeTimer = null;
  var tickTimer = null;

  function markInteraction() {
    suspended = true;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(function () { suspended = false; }, resumeMs);
  }

  function tick() {
    if (hovered || focused || suspended || document.hidden) return;
    go(index + 1);
  }

  if (!reduced) {
    tickTimer = setInterval(tick, autoMs);
    root.addEventListener('pointerenter', function () { hovered = true; });
    root.addEventListener('pointerleave', function () { hovered = false; });
    root.addEventListener('focusin', function () { focused = true; });
    root.addEventListener('focusout', function () { focused = false; });
  }

  /* ------------------------------------------------------ interactions --- */

  /* Click a side cover to center it. */
  stage.addEventListener('click', function (e) {
    if (dragMoved) return;
    var item = e.target.closest ? e.target.closest('.cf-item') : null;
    if (!item) return;
    go(Number(item.dataset.index), true);
  });

  /* Keyboard: ←/→ step covers while the region has focus. */
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { go(index - 1, true); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { go(index + 1, true); e.preventDefault(); }
  });

  /* Wheel: only react when the gesture is genuinely horizontal, and never
     preventDefault — vertical scrolling passes straight through to the page. */
  var wheelLock = false;
  root.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    if (wheelLock) return;
    wheelLock = true;
    setTimeout(function () { wheelLock = false; }, 220);
    go(index + (e.deltaX > 0 ? 1 : -1), true);
  }, { passive: true });

  /* Drag / swipe, 60px per page. touch-action: pan-y leaves vertical to the page. */
  var dragging = false;
  var dragMoved = false;
  var dragStartX = 0;
  var dragAnchor = 0;
  var DRAG_STEP = 60;

  stage.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    dragMoved = false;
    dragStartX = e.clientX;
    dragAnchor = e.clientX;
    stage.classList.add('is-dragging');
  });

  stage.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var delta = e.clientX - dragAnchor;
    if (Math.abs(e.clientX - dragStartX) > 4) dragMoved = true;
    while (Math.abs(delta) >= DRAG_STEP) {
      go(index + (delta > 0 ? -1 : 1), true);
      dragAnchor += delta > 0 ? DRAG_STEP : -DRAG_STEP;
      delta = e.clientX - dragAnchor;
    }
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
    /* Let the click handler see dragMoved, then clear it. */
    setTimeout(function () { dragMoved = false; }, 0);
  }

  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('pointerleave', endDrag);

  /* ------------------------------------------------------------- init --- */

  function refresh() { measure(); layout(); }

  window.addEventListener('resize', refresh);
  if (smallScreen.addEventListener) smallScreen.addEventListener('change', refresh);

  measure();
  layout();
  metaTitle.textContent = items[0].title || '';
  metaSub.textContent = items[0].sub || '';

  return {
    root: root,
    next: function () { go(index + 1, true); },
    prev: function () { go(index - 1, true); },
    goTo: function (i) { go(i, true); },
    refresh: refresh,
    destroy: function () {
      clearInterval(tickTimer);
      clearTimeout(resumeTimer);
      clearTimeout(metaTimer);
      window.removeEventListener('resize', refresh);
    }
  };
}
