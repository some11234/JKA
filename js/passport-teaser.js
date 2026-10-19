/* ==========================================================================
   passport-teaser.js — the Passport section on the home page.

   Lays Joe's travel stamps (PASSPORT_STAMPS, js/passport-data.js) out in a
   fan to the right of the closed passport, in the order he went, and slides
   them out from under its cover the first time the section comes into view.

   Every position is a share of the stamps' box, worked out once for each of
   the two layouts css/styles.css switches between (--x-d/--y-d beside the
   book on wide screens, --x-m/--y-m below it on phones), so nothing here runs
   on resize.
   ========================================================================== */

(function () {
  'use strict';

  var box = document.querySelector('[data-ppt-stamps]');
  var STAMPS = window.PASSPORT_STAMPS || [];
  if (!box || !STAMPS.length) return;

  // A small, steady number from a string, so each stamp lands the same way
  // on every visit (the same hash js/passport.js uses).
  function hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h;
  }
  function jitter(h, shift, span) { return (((h >>> shift) % 1000) / 1000 - 0.5) * span; }
  function bare(name) { return String(name || '').replace(/^the\s+/i, ''); }
  function pct(v) { return v.toFixed(2) + '%'; }

  var n = STAMPS.length;
  // Two staggered rows in both layouts, the stamps zig-zagging between them
  // so the years run left to right. Column c (bottom row: c + 0.5) sits at
  // a share t of the way across, eased so they bunch near the book.
  //   Wide:   box 2.4 : 1, a stamp 15.5% of its width (37.2% of its height).
  //   Phones: box 1.55 : 1, a stamp 25% of its width (38.8% of its height).
  var cols = Math.ceil(n / 2);
  function across(c) { return cols > 1 ? Math.pow(c / (cols - 0.5), 1.15) : 0; }

  STAMPS.forEach(function (st, i) {
    var h = hash(st.stamp || st.name || String(i));
    var el = document.createElement('span');
    el.className = 'ppt__stamp';
    el.setAttribute('data-label', bare(st.name).toUpperCase() + (st.year ? ' · ' + st.year : ''));

    var top = i % 2 === 0;
    var t = across(Math.floor(i / 2) + (top ? 0 : 0.5));
    var xd = 9 + 82 * t + jitter(h, 3, 3);
    var yd = (top ? 30 : 69) + jitter(h, 11, 16);
    var xm = 13 + 74 * t + jitter(h, 5, 2);
    var ym = (top ? 31 : 68) + jitter(h, 13, 10);
    var rot = (((h >>> 17) % 100) / 100 - 0.5) * 22;

    el.style.setProperty('--x-d', pct(xd));
    el.style.setProperty('--y-d', pct(yd));
    el.style.setProperty('--x-m', pct(xm));
    el.style.setProperty('--y-m', pct(ym));
    el.style.setProperty('--rot', rot.toFixed(2) + 'deg');
    // How far each slides: from under the cover (10% left of the box) or,
    // on phones, from under the book's foot (15% above it) — in its own
    // width or height, which is what translate's percentages measure.
    el.style.setProperty('--fx-d', pct((xd + 10) / 15.5 * 100));
    el.style.setProperty('--fy-m', pct((ym + 20) / 38.8 * 100));
    el.style.setProperty('--delay', (120 + i * 70) + 'ms');

    var img = document.createElement('img');
    img.alt = '';
    img.width = 420;
    img.height = 420;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    // The unaged set: the aged stamps are made for the passport's worn
    // pages, and look dull on the dark page.
    img.src = '/assets/passport/web/stamp-' + st.stamp + '-clean.webp';
    img.addEventListener('error', function () { el.style.display = 'none'; });
    el.appendChild(img);
    box.appendChild(el);
  });

  // The caption and the words a screen reader gets in place of the fan.
  var countries = (window.PASSPORT_COUNTRIES || []).length;
  var since = STAMPS.reduce(function (m, st) { return st.year && st.year < m ? st.year : m; }, Infinity);
  var caption = document.querySelector('[data-ppt-caption]');
  if (caption && countries && since < Infinity) caption.textContent = countries + ' countries · since ' + since;
  var list = document.querySelector('[data-ppt-list]');
  if (list) {
    list.textContent = 'Travel stamps in the passport: ' +
      STAMPS.map(function (st) { return bare(st.name) + ', ' + st.year; }).join('; ') + '.';
  }

  // Out from under the cover, once; then the hover lift takes over.
  var settleAfter = 120 + n * 70 + 1100;
  function slideOut() {
    box.classList.add('is-in');
    setTimeout(function () { box.classList.add('is-settled'); }, settleAfter);
  }
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !('IntersectionObserver' in window)) {
    box.classList.add('is-in', 'is-settled');
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    if (!entries.some(function (e) { return e.isIntersecting; })) return;
    io.disconnect();
    slideOut();
  }, { threshold: 0.35 });
  io.observe(box);
}());
