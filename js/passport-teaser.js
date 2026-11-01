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

  // Each stamp waits under the cover until its image is in and decoded, so
  // on a slow line none is ever seen blank or half drawn; see slideOut().
  var tiles = [], left = n, inAt = 0, held = false, settleAt = 0;
  var SMALL = 320;   // px: the phone copies' size (see below)
  function whole(t) {
    if (t.whole) return;
    t.whole = true;
    left--;
    // Coming out late, it keeps its place in the order if it still can.
    var d = Math.max(0, slot(t.i) - (Date.now() - inAt));
    if (inAt) t.el.style.setProperty('--delay', d + 'ms');
    t.el.classList.remove('is-waiting');
    if (inAt) settleLater(d + 1100);
    else if (held && !left) dealOut();
  }

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
    var t = { el: el, img: img, i: i, full: '/assets/passport/web/stamp-' + st.stamp + '-clean.webp' };
    t.small = t.full.replace(/\.webp$/, '-' + SMALL + '.webp');
    img.addEventListener('load', function () {
      var shown = function () { whole(t); };
      if (img.decode) img.decode().then(shown, shown);
      else shown();
    });
    img.addEventListener('error', function () {
      // No phone copy (a stamp newer than the build): the full one, then nothing.
      if (img.getAttribute('src') === t.small) { img.src = t.full; return; }
      el.style.display = 'none';
      whole(t);
    });
    el.classList.add('is-waiting');
    el.appendChild(img);
    box.appendChild(el);
    tiles.push(t);
  });

  // Phones get the 320 px copies (tools/build-passport.py) when that's all
  // the screen can show of a stamp, at its size here, its hover lift, the
  // pixel ratio and any pinch zoom; everything else gets the full 420s.
  // Grow past that (a wider window, a zoom) and the full ones are swapped
  // in, each once it's decoded, so nothing blinks.
  var lift = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches ? 1.1 : 1;
  function sharpEnough() {
    var zoom = window.visualViewport ? window.visualViewport.scale : 1;
    var w = tiles.reduce(function (m, t) { return Math.max(m, t.el.offsetWidth); }, 0);
    return w * (window.devicePixelRatio || 1) * lift * Math.max(1, zoom) <= SMALL;
  }
  var small = sharpEnough();
  tiles.forEach(function (t) { t.img.src = small ? t.small : t.full; });
  function sharpen() {
    if (!small || sharpEnough()) return;
    small = false;
    tiles.forEach(function (t) {
      if (t.img.getAttribute('src') !== t.small) return;
      var full = new Image();
      full.onload = function () {
        var swap = function () { t.img.src = t.full; };
        if (full.decode) full.decode().then(swap, swap);
        else swap();
      };
      full.src = t.full;
    });
  }
  window.addEventListener('resize', sharpen);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', sharpen);

  // The caption and the words a screen reader gets in place of the fan.
  var countries = (window.PASSPORT_COUNTRIES || []).length;
  // The years run from the first stamp to this year (Joe, 2026-11-01: "2006-[current year]").
  var first = STAMPS.reduce(function (m, st) { return st.year && st.year < m ? st.year : m; }, Infinity);
  var now = new Date().getFullYear();
  var caption = document.querySelector('[data-ppt-caption]');
  if (caption && countries) {
    caption.textContent = countries + ' countries' +
      (first < Infinity ? ' · ' + (first < now ? first + '–' + now : first) : '');
  }
  var list = document.querySelector('[data-ppt-list]');
  if (list) {
    list.textContent = 'Travel stamps in the passport: ' +
      STAMPS.map(function (st) { return bare(st.name) + ', ' + st.year; }).join('; ') + '.';
  }

  // Out from under the cover, once; then the hover lift takes over. If the
  // stamps aren't all in when the section comes into view, the fan waits
  // for them, up to HOLD ms, then deals the ones that are; each of the rest
  // comes out on its own once it's whole.
  var HOLD = 2500;
  var settleAfter = 120 + n * 70 + 1100;
  // After a wait they come out briskly: the visitor has waited enough.
  function slot(i) { return held ? i * 40 : 120 + i * 70; }
  function settleLater(ms) {
    settleAt = Math.max(settleAt, Date.now() + ms);
    setTimeout(function () {
      if (!left && Date.now() >= settleAt - 20) box.classList.add('is-settled');
    }, settleAt - Date.now());
  }
  function dealOut() {
    if (inAt) return;
    inAt = Date.now();
    if (held) tiles.forEach(function (t) { t.el.style.setProperty('--delay', slot(t.i) + 'ms'); });
    box.classList.add('is-in');
    settleLater(held ? slot(n) + 1100 : settleAfter);
  }
  function slideOut() {
    if (!left) return dealOut();
    held = true;
    setTimeout(dealOut, HOLD);
  }
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !('IntersectionObserver' in window)) {
    inAt = Date.now();
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
