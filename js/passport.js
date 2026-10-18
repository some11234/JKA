/* ==========================================================================
   passport.js — /passport/: a passport you can open and leaf through.

   A closed US passport, built in CSS 3D: two cover boards and a page block
   with real edges. Tap it (or drag the cover sideways) and it swings open on
   its spine, onto the data page glued inside the front cover and, facing
   it, the countries Joe has been to, stamped on two globes. Turn the page
   for the visa pages; turn past the last one and the back cover closes and
   the book turns over, ready again.

   Everything is driven by ONE number, `pos`, moving along a path:

       0          closed
       1          open on the front spread: data page, countries visited
       2 … n + 1  the n visa spreads — as many as the stamps fill
       n + 2      closed from the back and turned over — identical to 0

   Each frame derives every angle, the stack heights, the pose, the lighting
   and the framing from it, so opening, closing, a half-done drag, a reversal
   mid-flight and riffling back to the cover are all the same code path.

   Only what can be seen exists in 3D: the top page of each stack and the one
   leaf in the air. Page contents ("sheets") move between those faces as
   leaves turn, and the stacks' heights follow how many leaves each side holds.

   Lighting is computed, not painted: every face knows which way it points,
   and its shade comes from the angle between that and a light up and to the
   left. Framing is computed too: the book's real, perspective-projected
   outline is fitted to the stage every frame, at any viewport size.

   Geometry is in units of the cover's height. CONFIG.BOOK mirrors
   tools/build-passport.py and tools/build-visa-paper.py, which cut the
   cover and the paper to the same shape.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.querySelector('[data-passport]');
  if (!root) return;

  var CONFIG = {
    BOOK: {
      RATIO: 0.66,           // cover width / height (a real one is 0.704 — see the build script)
      INSET_HT: 0.006,       // board showing above and below the pages
      INSET_FORE: 0.006,     // board showing past the page block's outer edge
      MAP_INSET_FORE: 0.022, // navy rim past the outer edge of the data page, inside the cover
      THICK: 0.04,           // closed thickness, boards included (~5 mm on 125)
      BOARD: 0.0045,         // one cover board
      COVER_RADIUS: 0.0378,  // the cover art's rounded corners (100px on 1746)
      PAGE_RADIUS: 0.0365,   // the pages' outer corners (~42 units of ART_W)
      ART_W: 1179            // a page's head-to-tail length, in the units the stitch is
                             // measured in (the art the book was first cut to)
    },
    FACETS: 5,               // flat segments per rounded corner of a page stack
    FACETS_BOARD: 3,         // ... of a cover board

    // The legs of the path. ms is the time for the whole leg at normal speed.
    OPEN: { ms: 2700, back: 2100, flipEnd: 0.62, settleStart: 0.34 }, // 0 → 1
    PAGE: { ms: 950 },                                               // k → k+1
    CLOSE_BACK: { ms: 2600, closeEnd: 0.46, flipStart: 0.4 },         // last → closed
    RIFFLE: 6,               // speed-up when riffling back to the cover (Esc)
    OPEN_ANGLE: 178,         // degrees; an open cover never lies dead flat

    // Pose, in degrees. Closed shows off the page block and fore-edge; open is
    // nearly face-on, so the pages read crisply.
    POSE: {
      closed: { tx: 16, ty: -25 },
      mid: { tx: 10, ty: -7 },
      read: { tx: 2, ty: 0 },
      turning: { tx: 6, ty: -9 } // mid-way through the back cover closing
    },
    FILL: { closed: 0.62, read: 0.95 }, // share of the stage
    FIT_MARGIN: 0.97,        // mid-move, the outline never gets closer to the edge than this
    PERSPECTIVE: 3.4,        // × the book's largest on-screen height

    LIGHT: [-0.30, -0.42, 0.86], // toward the light: up, left, in front
    AMBIENT: 0.56,
    DIFFUSE: 0.62,

    // A face swinging through mid-air takes the edge strips out of the 3D
    // scene (see render()); they fade out over FADE degrees before HIDE[0].
    EDGES: { HIDE: [70, 172], FADE: [18, 6] },

    TILT: { x: 6, y: 8 },    // pointer parallax at the stage's edge, degrees
    FLOAT: { x: 1.1, y: 1.5, lift: 0.008 },
    PEEK_AFTER: 1800,        // ms after it appears: the cover lifts a little, once
    PEEK_ANGLE: 13,
    PEEK_MS: 1150,
    DRAG_SPAN: 1.25,         // a full flip takes a pull this many cover-widths long
    DRAG_OPEN_AT: 0.14,      // let go past this much progress and it opens
    TAP_SLOP: 12,            // px a tap may drift and still count as a tap
    REVERSE_MS: 150          // how quickly a reversal swings the other way
  };

  var STAMPS = window.PASSPORT_STAMPS || [];
  // The visa pages are blank paper, so the book only needs as many as the
  // stamps fill, in whole spreads — none left over to leaf through empty.
  // (A real passport has nine; tools/build-visa-paper.py counts the same way.)
  var SPREADS = Math.min(9, Math.ceil(STAMPS.reduce(function (m, st) {
    return Math.max(m, Math.floor(+st.page) || 0);
  }, 0) / 2));
  var LEAVES = SPREADS + 1;   // leaf 0: countries visited / visa 1
  var END = SPREADS + 2;      // "closed from the back"

  var $ = function (sel) { return root.querySelector(sel); };
  var stage = $('[data-pp-stage]');
  var scene = $('[data-pp-scene]');
  var book = $('[data-pp-book]');
  var flap = $('[data-pp-flap]');
  var coverFace = $('[data-pp-cover]');
  var coverImg = $('[data-pp-cover-img]');
  var insideFace = $('[data-pp-inside]');
  var bioPage = $('[data-pp-bio]');
  var backGroup = $('[data-pp-backgroup]');
  var backBoard = $('[data-pp-backboard]');
  var backIn = $('[data-pp-back]');
  var backOut = $('[data-pp-backout]');
  var rStack = $('[data-pp-rstack]');
  var lStack = $('[data-pp-lstack]');
  var rTop = $('[data-pp-rtop]');
  var lTop = $('[data-pp-ltop]');
  var rCast = $('[data-pp-rcast]');
  var lCast = $('[data-pp-lcast]');
  var leafGroup = $('[data-pp-leaf]');
  var leafFront = $('[data-pp-leaf-front]');
  var leafBack = $('[data-pp-leaf-back]');
  var spine = $('[data-pp-spine]');
  var floor = $('[data-pp-floor]');
  var sweep = $('[data-pp-sweep]');
  var sheen = $('[data-pp-sheen]');
  var hit = $('[data-pp-toggle]');
  var tapPrev = $('[data-pp-tap="prev"]');
  var tapNext = $('[data-pp-tap="next"]');
  var navPrev = $('[data-pp-nav="prev"]');
  var navNext = $('[data-pp-nav="next"]');
  var count = $('[data-pp-count]');
  var live = $('[data-pp-live]');
  var sheetBox = $('[data-pp-sheets]');

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  function motionOK() { return !mqReduce.matches; }

  // ---------------------------------------------------------------- math ---
  var DEG = Math.PI / 180;
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { return t * t * t; }
  function span(f, a, b) { return clamp((f - a) / (b - a), 0, 1); }
  // Inverse of ease() — used to start the open exactly where the peek is.
  function easeInv(y) { return y < 0.5 ? Math.cbrt(y / 4) : 1 - Math.cbrt(2 - 2 * y) / 2; }

  // The same rotations CSS applies (y points down, z toward the viewer).
  function rotX(v, a) { var c = Math.cos(a), s = Math.sin(a); return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c]; }
  function rotY(v, a) { var c = Math.cos(a), s = Math.sin(a); return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c]; }

  var LIGHT = (function (v) {
    var m = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / m, v[1] / m, v[2] / m];
  }(CONFIG.LIGHT));

  function px(v) { return Math.round(v * 100) / 100 + 'px'; }
  function t3(x, y, z) { return 'translate3d(' + px(x) + ',' + px(y) + ',' + px(z) + ')'; }
  function place(el, w, h, transform) {
    el.style.width = px(w);
    el.style.height = px(h);
    el.style.transform = transform;
  }
  function show(el, yes) {
    var v = yes ? '' : 'hidden';
    if (el.style.visibility !== v) el.style.visibility = v;
  }

  // ------------------------------------------------------------- sheets ---
  // The contents of every page, built once. A sheet is mounted into whichever
  // face shows it right now and parked in the hidden box otherwise.
  var sheets = {};
  sheets.visited = $('[data-sheet="visited"]');

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // A small, steady number from a string, so each page's wear and each
  // stamp's ink land the same way on every visit without anyone choosing.
  function hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h;
  }

  // What's printed on every visa page, in the passport's blue: a double-rule
  // frame with a star in three corners, the page number in a ring in the
  // fourth (the top outer one), the VISAS heading between rules, four faint
  // guide marks that quarter the page for the stamps, as a real visa page
  // has, and a line of microprint along the foot. It's live type laid on
  // with multiply (see .pp-print), so the paper shows through — and worn
  // like the paper, through a mask that's at a different spot on each page.
  var STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.2l2.5 5.7 6.2.6-4.7 4.1 1.4 6.1L10 14.6l-5.4 3.1 1.4-6.1-4.7-4.1 6.2-.6z"/></svg>';
  var MICRO = new Array(9).join('UNITED STATES OF AMERICA ★ ');

  function printLayer(page) {
    var p = el('span', 'pp-print');
    var h = hash('visa page ' + page);
    p.style.setProperty('--wear-at', (h % 101) + '% ' + ((h >>> 7) % 101) + '%');
    var outer = page % 2 === 0 ? 'tr' : 'tl';
    var frame = el('span', 'pp-print__frame');
    ['tl', 'tr', 'bl', 'br'].forEach(function (c) {
      if (c === outer) return;
      var star = el('span', 'pp-print__star pp-print__star--' + c);
      star.innerHTML = STAR;
      frame.appendChild(star);
    });
    p.appendChild(frame);
    ['v1', 'v2', 'h1', 'h2'].forEach(function (g) { p.appendChild(el('span', 'pp-print__guide pp-print__guide--' + g)); });
    var head = el('span', 'pp-print__head');
    head.appendChild(el('span', 'pp-print__rule'));
    head.appendChild(el('span', 'pp-print__title', 'Visas'));
    head.appendChild(el('span', 'pp-print__rule'));
    p.appendChild(head);
    var num = el('span', 'pp-print__num');
    num.appendChild(el('span', 'pp-print__digits', String(page)));
    p.appendChild(num);
    p.appendChild(el('span', 'pp-print__micro', MICRO));
    return p;
  }

  // Under each stamp, the country and year rubber-stamped in blue ink, the
  // way an entry stamp records a crossing. It's on the paper, under the
  // sticker — its top edge tucks under the perforations — so it's laid
  // first and stays put when the stamp above it lifts. Its box is the
  // stamp's box, tilted the same, so the mark always sits just below it;
  // the mark itself is a degree or two off again, as a hand-held stamp is.
  function addInk(s, page) {
    STAMPS.forEach(function (st) {
      if (st.page !== page) return;
      var at = st.at || [50, 50], h = hash(st.stamp || st.name || '');
      var box = el('span', 'pp-ink');
      box.style.left = at[0] + '%';
      box.style.top = at[1] + '%';
      box.style.setProperty('--tilt', (+st.tilt || 0) + 'deg');
      var name = String(st.name || '').replace(/^the\s+/i, '').toUpperCase();
      var mark = el('span', 'pp-ink__mark' + (st.ink === 'left' || st.ink === 'right' ? ' pp-ink__mark--' + st.ink : ''),
        name + (st.year ? ' · ' + st.year : ''));
      mark.style.setProperty('--ink-tilt', ((h % 9) - 4) * 0.5 + 'deg');
      // Where on the ink tile this mark falls, so no two are inked alike.
      mark.style.setProperty('--ink-at', (h % 101) + '% ' + ((h >>> 7) % 101) + '%');
      box.appendChild(mark);
      s.appendChild(box);
    });
  }

  // Joe's travel stamps, stuck onto a visa page (js/passport-data.js). Each is
  // its own element in the page's sheet, so it rides the leaf through every
  // turn. The box holds the hand-placed tilt and never moves — it's what the
  // pointer hovers, so a lifting stamp can't slide out from under it and
  // flicker; the image inside does the lifting.
  function addStamps(s, page) {
    STAMPS.forEach(function (st) {
      if (st.page !== page) return;
      var at = st.at || [50, 50], tilt = +st.tilt || 0;
      var box = el('span', 'pp-stamp');
      box.style.left = at[0] + '%';
      box.style.top = at[1] + '%';
      box.style.setProperty('--tilt', tilt + 'deg');
      // Lifted, it straightens a little, as if picked up by a corner.
      box.style.setProperty('--nudge', (tilt > 0 ? -1.5 : 1.5) + 'deg');
      var img = el('img', 'pp-stamp__art');
      img.alt = '';
      img.decoding = 'async';
      img.width = 560;
      img.height = 560;
      img.draggable = false;
      img.setAttribute('data-src', '/assets/passport/web/stamp-' + st.stamp + '.webp');
      img.addEventListener('error', function () { box.style.display = 'none'; });
      box.appendChild(img);
      s.appendChild(box);
    });
  }

  // Each visa page: its sheet of weathered paper (tools/build-visa-paper.py),
  // the shadow into the spine, the blue printing, then the ink marks and the
  // stamps stuck over them.
  function buildVisaSheets() {
    for (var page = 1; page <= SPREADS * 2; page++) {
      var recto = page % 2 === 0;
      var s = el('span', 'pp-sheet pp-visa ' + (recto ? 'pp-sheet--recto pp-visa--recto' : 'pp-sheet--verso pp-visa--verso'));
      s.setAttribute('data-sheet', 'v' + page);
      var img = el('img');
      img.alt = '';
      img.decoding = 'async';
      img.width = 920;
      img.height = 1391;
      img.draggable = false;
      img.setAttribute('data-src', '/assets/passport/web/visa-' + (page < 10 ? '0' : '') + page + '.webp');
      // A page whose paper is missing shows its plain colour, not a
      // broken-image icon.
      img.addEventListener('error', function () { this.style.visibility = 'hidden'; });
      s.appendChild(img);
      s.appendChild(el('span', 'pp-gutter'));
      s.appendChild(printLayer(page));
      // In the order they'd have gone on: print, ink, stickers on top.
      addInk(s, page);
      addStamps(s, page);
      sheets['v' + page] = s;
      sheetBox.appendChild(s);
    }
    var blank = el('span', 'pp-sheet pp-sheet--verso pp-visa pp-visa--blank');
    sheets.blank = blank;
    sheetBox.appendChild(blank);
  }

  // -------------------------------------------------------- front spread ---
  // The data page (inside the front cover) and Countries visited (leaf 0's
  // front). Their print is in the page; what's drawn from numbers is drawn
  // here, once: the guilloche, the stars, the passport number punched
  // through the paper, and the globes with the visits stamped on them and
  // their flags beneath. Each layer of print or ink is worn at its own spot
  // on the same tiles the visa pages use.
  var COUNTRIES = window.PASSPORT_COUNTRIES || [];
  var NS = 'http://www.w3.org/2000/svg';
  var PRINT_INK = '#34498A', PRINT_RED = '#A8423D', VISIT_INK = '#563889';

  function svgEl(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    return n;
  }
  function pathOf(pts, closed) {
    return 'M' + pts.map(function (q) { return q[0].toFixed(2) + ',' + q[1].toFixed(2); }).join('L') + (closed ? 'Z' : '');
  }
  function spotOf(key) {
    var h = hash(key);
    return (h % 101) + '% ' + ((h >>> 7) % 101) + '%';
  }
  function bare(name) { return String(name || '').replace(/^the\s+/i, ''); }

  // Security printing's woven ribbons: bands of waves across the page, each
  // strand a little out of phase with the next. `shift` offsets every
  // strand's phase, so two bands in two inks interleave like a flag's stripes.
  function waveBand(g, o) {
    var amp2 = o.amp2 || 0, wl2 = o.wl2 || 1, shift = o.shift || 0;
    for (var s = 0; s < o.strands; s++) {
      var ph = ((s + shift) / o.strands) * Math.PI * 2;
      var pts = [];
      for (var x = o.x0; x <= o.x1; x += 2) {
        pts.push([x, o.y + o.amp * Math.sin((x / o.wl) * 2 * Math.PI + ph) + amp2 * Math.sin((x / wl2) * 2 * Math.PI - ph)]);
      }
      g.appendChild(svgEl('path', { d: pathOf(pts, false) }));
    }
  }
  function inks(opacity) {
    return [PRINT_INK, PRINT_RED].map(function (c) {
      return svgEl('g', { fill: 'none', stroke: c, 'stroke-opacity': opacity, 'stroke-width': 0.45 });
    });
  }

  // The flag flying behind the photo, engraved the way security print draws
  // a picture: each red stripe and the blue canton a ruling of fine lines,
  // the fifty stars left as bare paper, the whole cloth rippling from the
  // hoist with its folds shaded across it. In the data page's guilloche
  // units (the page less its MRZ band); proportions are the flag's own
  // (1.9 : 1, canton 0.76 × 7/13, stars at 0.054 and 0.063 of the hoist).
  var FLAG = { x: 52, y: 150, h: 268, wave: 2.4, lift: 10 };
  function drawFlag(svg) {
    var F = FLAG, W = F.h * 1.9;
    function at(t, v) {
      // t across the fly, v down the hoist (0 → 1): the cloth's ripple grows
      // away from the pole, and sags a little toward the fly.
      var a = 4 + F.lift * t;
      return [F.x + t * W, F.y + v * F.h + a * Math.sin(2 * Math.PI * F.wave * t - 0.9) + 10 * t * t];
    }
    function rule(v, t0, t1) {
      var pts = [];
      for (var t = t0; t <= t1 + 1e-9; t += 0.008) pts.push(at(t, v));
      return pathOf(pts, false);
    }
    // Folds: light where the cloth faces up, dark where it turns away.
    var defs = svgEl('defs', {});
    [['red', PRINT_RED], ['blue', PRINT_INK]].forEach(function (c) {
      var gr = svgEl('linearGradient', { id: 'pp-flag-' + c[0], gradientUnits: 'userSpaceOnUse', x1: F.x, y1: 0, x2: F.x + W, y2: 0 });
      for (var i = 0; i <= 24; i++) {
        var t = i / 24, shade = 0.5 + 0.5 * Math.cos(2 * Math.PI * F.wave * t - 0.9 + 0.8);
        gr.appendChild(svgEl('stop', { offset: t, 'stop-color': c[1], 'stop-opacity': (0.15 + 0.12 * shade).toFixed(3) }));
      }
      defs.appendChild(gr);
    });
    svg.appendChild(defs);
    var red = svgEl('g', { fill: 'none', stroke: 'url(#pp-flag-red)', 'stroke-width': 0.55 });
    var blue = svgEl('g', { fill: 'none', stroke: 'url(#pp-flag-blue)', 'stroke-width': 0.55 });
    var CANTON = 0.76 / 1.9;
    for (var s = 0; s < 13; s += 2) {
      for (var k = 0; k < 4; k++) {
        var v = (s + (k + 0.5) / 4) / 13;
        red.appendChild(svgEl('path', { d: rule(v, s < 7 ? CANTON : 0, 1) }));
      }
    }
    for (var j = 0; j < 28; j++) blue.appendChild(svgEl('path', { d: rule((j + 0.5) / 28 * 7 / 13, 0, CANTON) }));
    svg.appendChild(red);
    svg.appendChild(blue);
    // Fifty stars, nine rows of six and five, knocked out of the canton.
    var stars = svgEl('g', { fill: '#fff' });
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < (r % 2 ? 5 : 6); c++) {
        var tx = (r % 2 ? 2 * c + 2 : 2 * c + 1) * 0.063 / 1.9, vy = (r + 1) * 0.054;
        var p = at(tx, vy);
        stars.appendChild(svgEl('path', { d: starPath(p[0], p[1], 0.0308 * F.h * 1.15) }));
      }
    }
    svg.appendChild(stars);
  }

  function drawGuilloche() {
    // The data page: the flag behind the photo, ribbons through the data.
    var svg = bioPage.querySelector('[data-pp-guilloche]');
    drawFlag(svg);
    var g = inks(0.13), blue = g[0], red = g[1];
    waveBand(blue, { x0: 0, x1: 626, y: 776, amp: 60, wl: 420, strands: 26, amp2: 9, wl2: 90 });
    waveBand(red, { x0: 0, x1: 626, y: 930, amp: 34, wl: 300, strands: 18, amp2: 6, wl2: 70 });
    svg.appendChild(red);
    svg.appendChild(blue);

    // Countries visited: stripe-waves behind each globe, red and blue
    // strands interleaved, and a band of stars along the foot.
    svg = sheets.visited.querySelector('[data-pp-guilloche]');
    g = inks(0.1);
    [284, 698].forEach(function (y, i) {
      waveBand(g[0], { x0: 0, x1: 704, y: y, amp: 46, wl: 390, strands: 13, amp2: 7, wl2: 84, shift: i * 0.25 });
      waveBand(g[1], { x0: 0, x1: 704, y: y, amp: 46, wl: 390, strands: 13, amp2: 7, wl2: 84, shift: 0.5 + i * 0.25 });
    });
    svg.appendChild(g[1]);
    svg.appendChild(g[0]);
    var stars = svgEl('g', { fill: PRINT_INK, 'fill-opacity': 0.22 });
    for (var i = 0; i < 25; i++) stars.appendChild(svgEl('path', { d: starPath(64 + i * 24, 1040, 3.2) }));
    svg.appendChild(stars);
  }

  // A five-pointed star of outer radius r at (cx, cy), point up.
  function starPath(cx, cy, r) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.4 : r;
      pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
    return pathOf(pts, true);
  }

  function drawStars() {
    // Thirteen in a shallow arc over the title, highest in the middle.
    var svg = bioPage.querySelector('[data-pp-stars]');
    for (var i = 0; i < 13; i++) {
      var dx = (i - 6) * 26;
      svg.appendChild(svgEl('path', { d: starPath(282 + dx, 7 + dx * dx * 0.00058 + 4.2, 4.6) }));
    }
  }

  function drawWaves() {
    // Under the signature: the flag's stripes, as guilloche.
    var svg = bioPage.querySelector('[data-pp-waves]');
    var g = inks(0.24);
    waveBand(g[0], { x0: 0, x1: 626, y: 40, amp: 16, wl: 120, strands: 10, amp2: 4, wl2: 37 });
    waveBand(g[1], { x0: 0, x1: 626, y: 40, amp: 16, wl: 120, strands: 10, amp2: 4, wl2: 37, shift: 0.5 });
    svg.appendChild(g[1]);
    svg.appendChild(g[0]);
  }

  // The passport number, punched through the top of the page as a real one
  // is: dark where the board shows through, with the lit lower lip of each
  // hole.
  var PERF_FONT = {
    '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
    '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
    '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
    '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
    '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100']
  };
  function perforate() {
    var svg = sheets.visited.querySelector('[data-pp-perf]');
    var num = (bioPage.querySelector('[data-pp-number]') || {}).textContent || '';
    var pitch = 2.8, gap = 3.6, r = 0.95, x = 0;
    num.trim().split('').forEach(function (ch) {
      var rows = PERF_FONT[ch];
      if (!rows) return;
      rows.forEach(function (row, ry) {
        row.split('').forEach(function (bit, rx) {
          if (bit !== '1') return;
          var cx = x + rx * pitch + r, cy = ry * pitch + r + 0.5;
          svg.appendChild(svgEl('circle', { cx: cx + 0.28, cy: cy + 0.34, r: r, fill: '#fffaf0', 'fill-opacity': 0.85 }));
          svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: r, fill: '#241b12', 'fill-opacity': 0.72 }));
        });
      });
      x += 4 * pitch + gap + r * 2;
    });
    var w = Math.max(1, x - gap), h = 6 * pitch + 2 * r + 1;
    svg.setAttribute('viewBox', '0 0 ' + w.toFixed(2) + ' ' + h.toFixed(2));
    svg.style.width = 'calc(var(--u) * ' + w.toFixed(2) + ')';
    svg.style.height = 'calc(var(--u) * ' + h.toFixed(2) + ')';
  }

  // ------------------------------------------------------------- globes ---
  // The globe art (tools/build-globes.py) is one <path> per country, its id
  // the ISO code, in absolute M/L/Z only — so each outline is a list of
  // rings, and its mainland is the ring with the largest area.
  function ringsOf(d) {
    return d.split('M').slice(1).map(function (sub) {
      return (sub.match(/-?[\d.]+,-?[\d.]+/g) || []).map(function (q) { return q.split(',').map(Number); });
    }).filter(function (r) { return r.length >= 3; });
  }
  function mainland(d) {
    var best = null;
    ringsOf(d).forEach(function (r) {
      var a = 0, cx = 0, cy = 0, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (var i = 0; i < r.length; i++) {
        var p = r[i], q = r[(i + 1) % r.length], c = p[0] * q[1] - q[0] * p[1];
        a += c; cx += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c;
        x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
      }
      if (Math.abs(a) < 1e-9) return;
      var area = Math.abs(a / 2);
      if (!best || area > best.area) best = { area: area, x: cx / (3 * a), y: cy / (3 * a), w: x1 - x0, h: y1 - y0 };
    });
    return best;
  }

  // Draws one globe: the printed one in its slot, and over it a second
  // drawing of the same art holding only the visits, in stamp ink.
  function drawGlobe(host, text) {
    var key = host.getAttribute('data-pp-globe');
    var src = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
    var frame = src.querySelector('#frame');
    var fcx = +frame.getAttribute('cx'), fcy = +frame.getAttribute('cy');
    var frx = +frame.getAttribute('rx'), fry = +frame.getAttribute('ry');
    var view = src.getAttribute('viewBox');
    var vb = view.split(/[\s,]+/).map(Number);
    var id = 'pp-' + key;
    var ellipse = { cx: fcx, cy: fcy, rx: frx, ry: fry };

    var svg = svgEl('svg', { viewBox: view, preserveAspectRatio: 'none' });
    var defs = svgEl('defs', {});
    var sea = svgEl('pattern', { id: id + '-sea', width: vb[2], height: 7, patternUnits: 'userSpaceOnUse' });
    sea.appendChild(svgEl('rect', { width: vb[2], height: 1.5, fill: PRINT_INK, 'fill-opacity': 0.26 }));
    var shade = svgEl('radialGradient', { id: id + '-shade', cx: 0.42, cy: 0.38, r: 0.66 });
    shade.appendChild(svgEl('stop', { offset: 0.55, 'stop-color': PRINT_INK, 'stop-opacity': 0 }));
    shade.appendChild(svgEl('stop', { offset: 1, 'stop-color': PRINT_INK, 'stop-opacity': 0.16 }));
    var clip = svgEl('clipPath', { id: id + '-clip' });
    clip.appendChild(svgEl('ellipse', ellipse));
    defs.appendChild(sea);
    defs.appendChild(shade);
    defs.appendChild(clip);
    svg.appendChild(defs);
    var body = svgEl('g', { 'clip-path': 'url(#' + id + '-clip)' });
    body.appendChild(svgEl('ellipse', { cx: fcx, cy: fcy, rx: frx, ry: fry, fill: 'rgba(200, 211, 230, 0.3)' }));
    body.appendChild(svgEl('rect', { x: vb[0], y: vb[1], width: vb[2], height: vb[3], fill: 'url(#' + id + '-sea)' }));

    var marks = svgEl('svg', { viewBox: view, preserveAspectRatio: 'none' });
    var mdefs = svgEl('defs', {});
    var hatch = svgEl('pattern', { id: id + '-hatch', width: 13, height: 13, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(-38)' });
    hatch.appendChild(svgEl('rect', { width: 13, height: 13, fill: VISIT_INK, 'fill-opacity': 0.16 }));
    hatch.appendChild(svgEl('rect', { width: 5.4, height: 13, fill: VISIT_INK, 'fill-opacity': 0.82 }));
    var mclip = svgEl('clipPath', { id: id + '-mclip' });
    mclip.appendChild(svgEl('ellipse', ellipse));
    mdefs.appendChild(hatch);
    mdefs.appendChild(mclip);
    marks.appendChild(mdefs);
    var mbody = svgEl('g', { 'clip-path': 'url(#' + id + '-mclip)' });

    var land = svgEl('g', {}), found = {};
    Array.prototype.forEach.call(src.querySelectorAll('#countries path'), function (p) {
      var d = p.getAttribute('d'), code = p.id;
      land.appendChild(svgEl('path', { d: d, 'class': 'pp-visited__land' }));
      if (!code || !COUNTRIES.some(function (c) { return c.code === code; })) return;
      mbody.appendChild(svgEl('path', { d: d, fill: 'url(#' + id + '-hatch)', 'class': 'pp-visited__mark', 'data-code': code }));
      var m = mainland(d);
      if (m) {
        m.dist = Math.sqrt(Math.pow((m.x - fcx) / frx, 2) + Math.pow((m.y - fcy) / fry, 2));
        found[code] = m;
      }
    });
    body.appendChild(land);
    body.appendChild(svgEl('ellipse', { cx: fcx, cy: fcy, rx: frx, ry: fry, fill: 'url(#' + id + '-shade)' }));
    svg.appendChild(body);
    svg.appendChild(svgEl('ellipse', { cx: fcx, cy: fcy, rx: frx, ry: fry, 'class': 'pp-visited__frame' }));
    svg.appendChild(svgEl('ellipse', { cx: fcx, cy: fcy, rx: frx - 9, ry: fry - 9, 'class': 'pp-visited__frame-in' }));
    host.appendChild(svg);
    marks.appendChild(mbody);
    var stamp = el('span', 'pp-visited__marks pp-front__stamp');
    stamp.style.setProperty('--ink-at', spotOf('globe ' + key));
    stamp.appendChild(marks);
    host.parentNode.insertBefore(stamp, host.nextSibling);
    return { key: key, host: host, found: found };
  }

  function flagItem(c, i) {
    var f = el('span', 'pp-visited__flag');
    f.setAttribute('data-code', c.code);
    f.style.setProperty('--d', (i * 170) + 'ms');
    var disc = el('span', 'pp-visited__disc');
    var art = el('span', 'pp-visited__art');
    var img = el('img');
    img.alt = '';
    img.decoding = 'async';
    img.draggable = false;
    img.width = 44;
    img.height = 44;
    img.src = '/assets/passport/flags/' + c.code.toLowerCase() + '.svg';
    art.appendChild(img);
    disc.appendChild(art);
    f.appendChild(disc);
    var name = el('span', 'pp-visited__name');
    bare(c.name).split(/\s+/).forEach(function (word, k) {
      if (k) name.appendChild(document.createElement('br'));
      name.appendChild(document.createTextNode(word));
    });
    f.appendChild(name);
    return f;
  }

  // One visit lit at a time, from its flag or from the globe.
  function setActive(code) {
    var s = sheets.visited;
    if (code) s.setAttribute('data-active', code); else s.removeAttribute('data-active');
    Array.prototype.forEach.call(s.querySelectorAll('[data-code]'), function (n) {
      n.classList.toggle('is-on', !!code && n.getAttribute('data-code') === code);
    });
  }

  function drawGlobes() {
    var hosts = Array.prototype.slice.call(sheets.visited.querySelectorAll('[data-pp-globe]'));
    return Promise.all(hosts.map(function (host) {
      return fetch(host.getAttribute('data-src')).then(function (r) {
        if (!r.ok) throw new Error('passport: ' + r.status + ' for ' + host.getAttribute('data-src'));
        return r.text();
      }).then(function (text) { return drawGlobe(host, text); });
    })).then(function (globes) {
      // Each flag goes under the globe where its country sits nearest the
      // centre, unless the list says which; west to east under each.
      var home = {};
      COUNTRIES.forEach(function (c) {
        var best = null;
        globes.forEach(function (g) {
          var m = g.found[c.code];
          if (!m) return;
          if (c.globe ? g.key === c.globe : (!best || m.dist < best.dist)) best = { key: g.key, dist: m.dist, x: m.x };
        });
        if (best) home[c.code] = best;
      });
      var order = 0;
      globes.forEach(function (g) {
        var mine = COUNTRIES.filter(function (c) { return home[c.code] && home[c.code].key === g.key; })
          .sort(function (a, b) { return home[a.code].x - home[b.code].x; });
        if (!mine.length) return;
        var list = el('span', 'pp-visited__flags pp-visited__flags--' + g.key);
        // Up to six in a row; more go in two even rows.
        list.style.setProperty('--per-row', mine.length <= 6 ? mine.length : Math.ceil(mine.length / 2));
        mine.forEach(function (c) {
          var d = order * 170;
          list.appendChild(flagItem(c, order));
          Array.prototype.forEach.call(sheets.visited.querySelectorAll('.pp-visited__marks [data-code="' + c.code + '"]'), function (n) {
            n.style.setProperty('--d', Math.max(0, d - 120) + 'ms');
          });
          order++;
        });
        sheets.visited.appendChild(list);
      });
      Array.prototype.forEach.call(sheets.visited.querySelectorAll('.pp-visited__flag, .pp-visited__mark'), function (n) {
        n.addEventListener('mouseenter', function () { setActive(n.getAttribute('data-code')); });
        n.addEventListener('mouseleave', function () { setActive(null); });
      });
    });
  }

  // The first time the book opens, the flags are stamped in (see render()).
  // Once they're down, the animation comes off: the sheet moves between
  // faces as leaves turn, and moving it would play the stamping again.
  var stampPending = false;
  function stampIn() {
    stampPending = false;
    sheets.visited.classList.remove('is-unstamped');
    sheets.visited.classList.add('is-stamping');
    setTimeout(function () { sheets.visited.classList.remove('is-stamping'); }, COUNTRIES.length * 170 + 900);
  }

  function buildFront() {
    Array.prototype.forEach.call(root.querySelectorAll('[data-pp-micro]'), function (n) {
      n.textContent = new Array(40).join('UNITED STATES OF AMERICA ★ ');
    });
    bioPage.style.setProperty('--wear-at', spotOf('front bio'));
    sheets.visited.style.setProperty('--wear-at', spotOf('front visited'));
    bioPage.querySelector('.pp-bio__seal').style.setProperty('--ink-at', spotOf('seal'));
    drawGuilloche();
    drawStars();
    drawWaves();
    perforate();
    // Read out with the open button: who's been where.
    var names = COUNTRIES.map(function (c) { return c.name; });
    var list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names.join('');
    var say = document.querySelector('[data-pp-desc-countries]');
    if (say && list) say.textContent = list;
    if (motionOK()) {
      sheets.visited.classList.add('is-unstamped');
      stampPending = true;
    }
    drawGlobes().catch(function (err) {
      // No globes is a plainer page, not a broken book.
      if (window.console) console.error(err);
      stampIn();
    });
  }

  function leafFrontId(j) { return j === 0 ? 'visited' : 'v' + (j * 2); }
  function leafBackId(j) { return j === LEAVES - 1 ? 'blank' : 'v' + (j * 2 + 1); }

  function mount(face, id) {
    var slot = face._slot || (face._slot = face.querySelector('.pp-slot'));
    // Another face can take a sheet while this one is hidden (the top page
    // takes the leaf's back when a turn lands), so check it's still here —
    // or turning straight back shows the leaf blank.
    if (face._sheet === id && (!id || !sheets[id] || sheets[id].parentNode === slot)) return;
    if (face._sheet && sheets[face._sheet] && sheets[face._sheet].parentNode === slot) sheetBox.appendChild(sheets[face._sheet]);
    face._sheet = id || null;
    if (id && sheets[id]) slot.appendChild(sheets[id]);
  }

  // Images load lazily, nearest first, once the cover is up.
  var queue = [];
  function loadImg(img) {
    if (!img || img.getAttribute('src') || !img.getAttribute('data-src')) return;
    img.src = img.getAttribute('data-src');
  }
  // A sheet's images: the page, then any stamps stuck on it.
  function sheetImgs(id) { return sheets[id] ? Array.prototype.slice.call(sheets[id].querySelectorAll('img')) : []; }
  function preloadAround(p) {
    // The pages within a spread of where the book is (or is heading).
    var ids = [];
    var nL = clamp(Math.round(p) - 1, 0, LEAVES - 1);
    for (var j = Math.max(0, nL - 1); j <= Math.min(LEAVES - 1, nL + 2); j++) ids.push(leafFrontId(j), leafBackId(j));
    ids.forEach(function (id) { sheetImgs(id).forEach(loadImg); });
  }
  function drainQueue() {
    // Then everything else, one at a time, while idle.
    var nextImg = queue.shift();
    while (nextImg && nextImg.getAttribute('src')) nextImg = queue.shift();
    if (!nextImg) return;
    loadImg(nextImg);
    var again = function () { (window.requestIdleCallback || setTimeout)(drainQueue); };
    if (nextImg.complete) again();
    else { nextImg.addEventListener('load', again, { once: true }); nextImg.addEventListener('error', again, { once: true }); }
  }

  // ------------------------------------------------------------ geometry ---
  // Book space: x from the spine (0) to the fore-edge, y from head (0) to
  // tail, z toward the viewer, the closed book centred on z = 0.

  var G = {};
  var faces = [];
  var generated = [];

  function register(face, normal, group, isGenerated) {
    var shade = document.createElement('span');
    shade.className = 'pp-shade';
    face.appendChild(shade);
    faces.push({ shade: shade, n: normal, group: group, gen: !!isGenerated, last: -1 });
  }

  // The outline of a board or a page stack on the RIGHT of the spine: square
  // at the spine, rounded at the fore-edge corners. Walked tail → fore-edge →
  // head, so the outward side of every step is on its right.
  function outlineRight(x1, y0, y1, r, n) {
    var pts = [[0, y1], [x1 - r, y1]], i, a;
    for (i = 1; i <= n; i++) { a = Math.PI / 2 * (1 - i / n); pts.push([x1 - r + r * Math.cos(a), y1 - r + r * Math.sin(a)]); }
    pts.push([x1, y0 + r]);
    for (i = 1; i <= n; i++) { a = -Math.PI / 2 * (i / n); pts.push([x1 - r + r * Math.cos(a), y0 + r + r * Math.sin(a)]); }
    pts.push([0, y0]);
    return pts;
  }
  // ... and on the LEFT (fore-edge at -x0): head → fore-edge → tail.
  function outlineLeft(x0, y0, y1, r, n) {
    var pts = [[0, y0], [-x0 + r, y0]], i, a;
    for (i = 1; i <= n; i++) { a = -Math.PI / 2 - Math.PI / 2 * (i / n); pts.push([-x0 + r + r * Math.cos(a), y0 + r + r * Math.sin(a)]); }
    pts.push([-x0, y1 - r]);
    for (i = 1; i <= n; i++) { a = Math.PI - Math.PI / 2 * (i / n); pts.push([-x0 + r + r * Math.cos(a), y1 - r + r * Math.sin(a)]); }
    pts.push([0, y1]);
    return pts;
  }

  // Stand a strip on every step of an outline: `depth` deep, hanging down
  // from z = zTop, facing outward. Laid flat, tipped up on its long edge
  // (rotateX), turned to the step (rotateZ), moved into place. Each overlaps
  // its neighbours and tucks under the faces it meets, so no seam shows.
  function strips(parent, before, pts, zTop, depth, kind, group) {
    var ov = 0.5;
    zTop += 0.5;
    depth += 1;
    for (var i = 0; i < pts.length - 1; i++) {
      var p = pts[i], q = pts[i + 1];
      var dx = q[0] - p[0], dy = q[1] - p[1];
      var len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.05) continue;
      var th = Math.atan2(dy, dx);
      var s = document.createElement('span');
      s.className = 'pp-strip pp-strip--' + kind;
      place(s, len + 2 * ov, depth,
        t3(p[0], p[1], zTop) + ' rotateZ(' + th.toFixed(5) + 'rad) translateX(' + (-ov) + 'px) rotateX(-90deg)');
      parent.insertBefore(s, before || null);
      generated.push(s);
      register(s, [-Math.sin(th), Math.cos(th), 0], group, true);
    }
  }

  function build(U) {
    var B = CONFIG.BOOK;
    generated.forEach(function (s) { s.parentNode.removeChild(s); });
    generated = [];
    faces = faces.filter(function (f) { return !f.gen; });

    var W = B.RATIO * U, H = U;
    var T = B.THICK * U, tb = B.BOARD * U;
    var pw = (B.RATIO - B.INSET_FORE) * U, ph = (1 - 2 * B.INSET_HT) * U, py = B.INSET_HT * U;
    var rc = B.COVER_RADIUS * U, rp = B.PAGE_RADIUS * U;
    var blk = T - 2 * tb;
    G = {
      U: U, W: W, H: H, T: T, tb: tb, pw: pw, ph: ph, py: py,
      zTop: T / 2 - tb,        // the level both open pages lie at
      blk: blk,                // the page block's full thickness
      leaf: blk / LEAVES,      // one leaf
      eps: 0.6                 // how far a turning leaf floats above the stacks
    };

    var art = ph / B.ART_W;
    var s = book.style;
    s.setProperty('--rc', px(rc));
    s.setProperty('--rp', px(rp));
    s.setProperty('--ph', px(ph));
    s.setProperty('--grain', px(U * 0.16));
    s.setProperty('--floor-blur', px(U * 0.05));
    s.setProperty('--stitch-w', px(3 * art));
    s.setProperty('--stitch-on', px(12 * art));
    s.setProperty('--stitch-period', px(18 * art));

    // Front cover, in the flap's own space (origin on the hinge).
    place(coverFace, W, H, t3(0, 0, tb / 2));
    place(insideFace, W, H, t3(W, 0, -tb / 2) + ' rotateY(180deg)'); // content fore-edge → spine once open
    var bw = (B.RATIO - B.MAP_INSET_FORE) * U;
    bioPage.style.left = px(B.MAP_INSET_FORE * U);
    bioPage.style.top = px(py);
    bioPage.style.width = px(bw);
    bioPage.style.height = px(ph);
    // The front spread's print is laid out in page units: 1/704 of the
    // page's width (unrounded, or the layout creeps).
    bioPage.style.setProperty('--u', (bw / 704).toFixed(4) + 'px');
    sheets.visited.style.setProperty('--u', (pw / 704).toFixed(4) + 'px');

    // Back cover: inside face on top (z = 0 of its group), outside face below.
    place(backIn, W, H, t3(0, 0, 0));
    place(backOut, W, H, t3(W, 0, -tb) + ' rotateY(180deg)');

    // The two top pages and the turning leaf, all page-sized.
    place(rTop, pw, ph, t3(0, py, 0));
    place(lTop, pw, ph, t3(-pw, py, 0));
    place(leafFront, pw, ph, t3(0, py, 0.3));
    place(leafBack, pw, ph, t3(pw, py, -0.3) + ' rotateY(180deg)');

    place(floor, W, H, 'none');
    place(spine, 10, H, 'none');

    // Edges. Stacks are built a full block deep and squashed in z to however
    // many leaves each side holds (see render()).
    strips(backBoard, backIn, outlineRight(W, 0, H, rc, CONFIG.FACETS_BOARD), 0, tb, 'board', 'back');
    strips(rStack, null, outlineRight(pw, py, py + ph, rp, CONFIG.FACETS), 0, blk, 'pages', 'back');
    strips(lStack, null, outlineLeft(pw, py, py + ph, rp, CONFIG.FACETS), 0, blk, 'pages', 'book');
    strips(flap, coverFace, outlineRight(W, 0, H, rc, CONFIG.FACETS_BOARD), tb / 2, tb, 'board', 'flap');
  }

  // ---------------------------------------------------------------- path ---
  // Everything the book looks like at position p. Pure: no DOM.
  function evaluate(p, rewind) {
    var P = CONFIG.POSE, f, a, b;
    var S = {
      flap: 0, leaf: -1, leafA: 0, nL: 0, back: 0, flip: 0,
      pose: [P.closed, P.closed, 0], fill: ['closed', 'closed', 0],
      closed: 1, leg: -1
    };
    if (p <= 0 || p >= END) return S;

    if (p < 1) {                                   // opening (or closing) the cover
      var O = CONFIG.OPEN;
      a = ease(span(p, 0, O.flipEnd));
      b = ease(span(p, O.settleStart, 1));
      S.flap = CONFIG.OPEN_ANGLE * a;
      S.pose = [lerpPose(P.closed, P.mid, a), P.read, b];
      S.fill = ['closed', 'read', b];
      S.closed = 1 - a;
      S.leg = 0;
    } else if (p === 1) {                          // resting on the front spread
      S.flap = CONFIG.OPEN_ANGLE;
      S.pose = [P.read, P.read, 0];
      S.fill = ['read', 'read', 0];
      S.closed = 0;
    } else if (p < 2 && SPREADS) {                 // front spread → first visa spread
      b = (rewind ? easeSine : ease)(p - 1);
      // The cover rests a touch lifted (178°) on its own, but flat once pages
      // pile onto it — otherwise its rising surface pokes through them.
      S.flap = lerp(CONFIG.OPEN_ANGLE, 180, b);
      S.leaf = 0;
      S.leafA = 180 * b;
      S.nL = b;
      S.pose = [P.read, P.read, 0];
      S.fill = ['read', 'read', 0];
      S.closed = 0;
      S.leg = 1;
    } else if (p < END - 1) {                      // on, or turning, a visa page
      var k = Math.floor(p);
      f = p - k;
      S.flap = 180;
      S.nL = k - 1;
      if (f > 0) {
        b = (rewind ? easeSine : ease)(f);
        S.leaf = k - 1;
        S.leafA = 180 * b;
        S.nL = (k - 1) + b;
        S.leg = k;
      }
      S.pose = [P.read, P.read, 0];
      S.fill = ['read', 'read', 0];
      S.closed = 0;
    } else {                                       // closing from the back, turning over
      var C = CONFIG.CLOSE_BACK;
      f = p - (END - 1);
      a = ease(span(f, 0, C.closeEnd));
      b = ease(span(f, C.flipStart, 1));
      S.flap = SPREADS ? 180 : lerp(CONFIG.OPEN_ANGLE, 180, a);
      S.nL = LEAVES - 1;
      S.back = 180 * a;
      S.flip = 180 * b;
      S.pose = [lerpPose(P.read, P.turning, a), P.closed, b];
      S.fill = ['read', 'closed', b];
      S.closed = b;
      S.leg = END - 1;
    }
    return S;
  }

  function lerpPose(a, b, t) { return { tx: lerp(a.tx, b.tx, t), ty: lerp(a.ty, b.ty, t) }; }

  // Leg durations, for the speed pos moves at.
  function legMs(leg, forward) {
    if (leg <= 0) return forward ? CONFIG.OPEN.ms : CONFIG.OPEN.back;
    if (leg >= END - 1) return CONFIG.CLOSE_BACK.ms;
    return CONFIG.PAGE.ms;
  }

  // ------------------------------------------------------------- framing ---
  var view = { w: 0, h: 0, left: 0, top: 0 };
  var PREF = { closed: 1, read: 1 };
  var Dcss = 1000;            // perspective, in CSS px

  function flapHinge(S) {
    // Closed or showing the front spread, the cover hinges at the top of the
    // block; as leaves pile onto it, it sinks so they lie level with the
    // right-hand page.
    return G.zTop + G.tb / 2 - Math.min(S.nL, 1) * G.tb - S.nL * G.leaf;
  }
  // The back cover closes over a hinge just above the left-hand stack.
  function backHinge() { return G.zTop + G.leaf * 0.5 + G.tb * 0.25; }

  // Corner points of the book as it stands in S, in book space.
  function outline(S) {
    var W = G.W, H = G.H, zT = G.zTop;
    var pts = [];
    var nR = LEAVES - S.nL;
    var zb = zT - nR * G.leaf - G.tb;               // underside of the back cover
    var bh = backHinge(), ba = -S.back * DEG;
    [[0, 0], [W, 0], [0, H], [W, H]].forEach(function (c) {
      [zT, zb].forEach(function (z) {
        // Right half — swung with the back cover when that's closing.
        var x = c[0], dz = z - bh;
        pts.push([x * Math.cos(ba) + dz * Math.sin(ba), c[1], bh - x * Math.sin(ba) + dz * Math.cos(ba)]);
      });
    });
    var fa = S.flap * DEG, fh = flapHinge(S);
    [0, H].forEach(function (y) {
      pts.push([W * Math.cos(fa), y, fh + W * Math.sin(fa)]);   // the cover's free edge
      pts.push([0, y, fh]);
    });
    if (S.leaf >= 0) {
      var la = S.leafA * DEG;
      [G.py, G.py + G.ph].forEach(function (y) { pts.push([G.pw * Math.cos(la), y, zT + G.eps + G.pw * Math.sin(la)]); });
    }
    return pts;
  }

  // Project points through the book transform and the scene's perspective.
  // Returns the screen box, in scene coordinates.
  function project(pts, piv, S, pose, scale, dx, dy) {
    var box = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
    var fl = S.flip * DEG, ty = pose.ty * DEG, tx = pose.tx * DEG;
    var ox = view.w / 2, oy = view.h / 2;
    for (var i = 0; i < pts.length; i++) {
      var q = [pts[i][0] - piv[0], pts[i][1] - piv[1], pts[i][2] - piv[2]];
      q = rotY(q, fl);
      q = rotX(rotY([q[0] * scale, q[1] * scale, q[2] * scale], ty), tx);
      var k = Dcss / Math.max(1, Dcss - q[2]);
      var X = ox + (dx + q[0]) * k, Y = oy + (dy + q[1]) * k;
      if (X < box.x0) box.x0 = X;
      if (X > box.x1) box.x1 = X;
      if (Y < box.y0) box.y0 = Y;
      if (Y > box.y1) box.y1 = Y;
    }
    return box;
  }

  // Centre of the flat outline (the book turns and scales about it), plus
  // its x extent for the floor shadow.
  function pivotOf(pts) {
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    pts.forEach(function (p) {
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[1] > y1) y1 = p[1];
    });
    return [(x0 + x1) / 2, (y0 + y1) / 2, 0, x0, x1];
  }

  // Shrink-only fit: the largest scale ≤ want at which the projected outline
  // fits within margin of the stage, and the offset that centres it.
  function fit(pts, piv, S, pose, want, margin) {
    var s = want, dx = 0, dy = 0, box;
    for (var it = 0; it < 4; it++) {
      box = project(pts, piv, S, pose, s, dx, dy);
      var k = Math.min(1, margin * Math.min(view.w / (box.x1 - box.x0), view.h / (box.y1 - box.y0)));
      if (!(k > 0)) break;   // degenerate box (nothing to fit): keep what we have
      s *= k;
      dx = (dx - ((box.x0 + box.x1) / 2 - view.w / 2)) * k;
      dy = (dy - ((box.y0 + box.y1) / 2 - view.h / 2)) * k;
    }
    box = project(pts, piv, S, pose, s, dx, dy);
    return { s: s, dx: dx, dy: dy, box: box };
  }

  function layout() {
    measure();
    if (view.w < 40 || view.h < 40) return false;

    // Size the book in units first: how tall can each resting state be?
    build(100);
    Dcss = 1e7;   // measure flat; the per-frame fit handles perspective, shrink-only
    var hcss = {};
    [['closed', 0], ['read', SPREADS ? 2 : 1]].forEach(function (r) {
      var S = evaluate(r[1]), pts = outline(S), piv = pivotOf(pts);
      // Start well oversize (about four stages tall) and let the fit shrink it.
      var F = fit(pts, piv, S, S.pose[1], 4 * Math.max(view.w, view.h) / 100, 1);
      hcss[r[0]] = F.s * 100 * CONFIG.FILL[r[0]];      // CSS px tall at this fill
    });
    // Lay the book out at the largest it's ever shown, so it's only ever
    // scaled down. (In CSS px: on real hi-DPI screens Chrome already
    // rasterises 3D layers at device resolution. Only DevTools/Playwright
    // device emulation draws them at one texel per CSS px and looks soft —
    // laying out at the DPR to "fix" that triples tile memory for nothing.)
    var U = Math.ceil(Math.max(hcss.closed, hcss.read));
    build(U);
    Dcss = CONFIG.PERSPECTIVE * U;
    scene.style.perspective = px(Dcss);
    PREF.closed = hcss.closed / U;
    PREF.read = hcss.read / U;
    return true;
  }

  // The cheap part of a resize — the stage box — so framing tracks every event.
  function measure() {
    view.w = scene.clientWidth;
    view.h = scene.clientHeight;
    view.left = scene.offsetLeft;
    view.top = scene.offsetTop;
  }

  // --------------------------------------------------------------- state ---
  var state = {
    pos: 0, target: 0, vel: 0,
    dragging: false, rewind: false,
    tiltX: 0, tiltY: 0, aimX: 0, aimY: 0,
    peekStart: -1
  };
  var interacted = false;
  var rects = {};
  var scaleNow = 1;
  var edgesHidden = false, edgeAlpha = 1, spineOn = null;

  function peekAngle(now) {
    if (state.peekStart < 0) return 0;
    var t = (now - state.peekStart) / CONFIG.PEEK_MS;
    if (t >= 1 || t < 0) return 0;
    var A = CONFIG.PEEK_ANGLE;
    if (t < 0.34) return A * easeOut(t / 0.34);
    if (t < 0.76) return A * (1 - easeIn((t - 0.34) / 0.42));
    return A * 0.1 * Math.sin(Math.PI * (t - 0.76) / 0.24);
  }

  function world(n, group, S) {
    if (group === 'flap') n = rotY(n, -S.flap * DEG);
    else if (group === 'leaf') n = rotY(n, -S.leafA * DEG);
    else if (group === 'back') n = rotY(n, -S.back * DEG);
    n = rotY(n, S.flip * DEG);
    return rotX(rotY(n, S._ty), S._tx);
  }

  function render(now) {
    if (!G.U) return;
    var p = state.pos;
    var S = evaluate(p, state.rewind);
    // Half-way open, the countries page is in view: stamp the flags in.
    if (stampPending && p >= 0.5) stampIn();
    var peek = p < 1 ? peekAngle(now) * S.closed : 0;
    S.flap += peek;

    // Pose: blend, then the idle drift while closed, then pointer parallax.
    var pose = lerpPose(S.pose[0], S.pose[1], S.pose[2]);
    var lift = 0;
    if (motionOK() && S.closed > 0) {
      var t = now / 1000;
      pose.tx += S.closed * CONFIG.FLOAT.x * Math.sin(t * 0.83);
      pose.ty += S.closed * CONFIG.FLOAT.y * Math.sin(t * 0.61 + 1.3);
      lift = S.closed * CONFIG.FLOAT.lift * Math.sin(t * 0.97 + 0.4);
    }
    var par = 0.3 + 0.7 * S.closed;
    pose.tx += state.tiltX * par;
    pose.ty += state.tiltY * par;
    S._tx = pose.tx * DEG;
    S._ty = pose.ty * DEG;

    // Framing: grow from one resting size to the next, never past what fits —
    // the real, projected outline, mid-swing covers and leaves included.
    var pts = outline(S), piv = pivotOf(pts);
    var want = lerp(PREF[S.fill[0]], PREF[S.fill[1]], S.fill[2]);
    var F = fit(pts, piv, S, pose, want, CONFIG.FIT_MARGIN);
    scaleNow = F.s;
    var liftPx = lift * G.H * F.s;
    var cx = view.w / 2 + F.dx, cy = view.h / 2 + F.dy + liftPx;
    var sc = F.s.toFixed(5);

    book.style.transform =
      'translate3d(' + px(cx) + ',' + px(cy) + ',0)' +
      ' rotateX(' + pose.tx.toFixed(3) + 'deg) rotateY(' + pose.ty.toFixed(3) + 'deg)' +
      ' scale3d(' + sc + ',' + sc + ',' + sc + ')' +
      ' rotateY(' + S.flip.toFixed(3) + 'deg)' +
      ' translate3d(' + px(-piv[0]) + ',' + px(-piv[1]) + ',0)';

    // The parts.
    var zT = G.zTop, t1 = G.leaf, nL = S.nL, nR = LEAVES - nL;
    var bh = backHinge();
    flap.style.transform = 'translate3d(0,0,' + px(flapHinge(S)) + ') rotateY(' + (-S.flap).toFixed(3) + 'deg)';
    backGroup.style.transform = 'translate3d(0,0,' + px(bh) + ') rotateY(' + (-S.back).toFixed(3) + 'deg) translate3d(0,0,' + px(-bh) + ')';
    backBoard.style.transform = 'translate3d(0,0,' + px(zT - nR * t1 - 0.4) + ')';
    rStack.style.transform = 'translate3d(0,0,' + px(zT) + ') scale3d(1,1,' + Math.max(0.02, nR / LEAVES).toFixed(4) + ')';
    lStack.style.transform = 'translate3d(0,0,' + px(zT) + ') scale3d(1,1,' + Math.max(0.02, nL / LEAVES).toFixed(4) + ')';
    show(lStack, nL > 0.02);
    rTop.style.transform = t3(0, G.py, zT);
    lTop.style.transform = t3(-G.pw, G.py, zT);

    // Which sheet shows where.
    var moving = S.leaf;
    var turned = Math.floor(nL + 1e-6);              // leaves wholly on the left
    if (moving >= 0) {
      mount(leafFront, leafFrontId(moving));
      mount(leafBack, leafBackId(moving));
      mount(rTop, moving + 1 < LEAVES ? leafFrontId(moving + 1) : null);
      mount(lTop, moving >= 1 ? leafBackId(moving - 1) : null);
      leafGroup.style.transform = 'translate3d(0,0,' + px(zT + G.eps) + ') rotateY(' + (-S.leafA).toFixed(3) + 'deg)';
    } else {
      mount(rTop, turned < LEAVES ? leafFrontId(turned) : null);
      mount(lTop, turned >= 1 ? leafBackId(turned - 1) : null);
    }
    show(leafGroup, moving >= 0);
    show(rTop, !!rTop._sheet);
    show(lTop, !!lTop._sheet);

    // The spine only matters while the book is shut (and while it turns over).
    var wantSpine = (p === 0 && peek < 1) || S.back > 178;
    if (wantSpine !== spineOn) { spineOn = wantSpine; show(spine, wantSpine); }
    if (wantSpine) {
      var z0 = -G.T / 2, z1 = G.T / 2;
      if (S.back > 178) { z0 = flapHinge(S) - G.tb; z1 = 2 * bh - (zT - nR * t1 - G.tb); }
      spine.style.width = px(Math.max(1, z1 - z0));
      spine.style.transform = t3(0, 0, z0) + ' rotateY(-90deg)';
    }

    // Chrome bug workaround. With a face swinging through mid-air and edge
    // strips in the scene, Chrome's compositor can clip the swinging face
    // along a vertical line short of the hinge, opening a gap at the spine
    // (seen with the page-block strips, the front cover's own board edges,
    // and a rounded spine — since removed). Taking every strip out of the 3D
    // scene for that stretch avoids it: visibility:hidden removes a layer
    // from the sort; opacity would not. Mid-swing the book is nearly face-on
    // and the strips are slivers, so nothing visibly changes — and they fade
    // either side, so a 3–4px edge never just blinks out. The window opens
    // well before 90° because, under perspective, the far side of a face can
    // come into view a few degrees early.
    var H0 = CONFIG.EDGES.HIDE[0], H1 = CONFIG.EDGES.HIDE[1];
    var swinging = [S.flap, S.leafA, S.back].filter(function (a) { return a > 0.01 && a < 179.99; });
    var hide = swinging.some(function (a) { return a > H0 && a < H1; });
    if (hide !== edgesHidden) { edgesHidden = hide; book.classList.toggle('is-swinging', hide); }
    var ea = 1;
    swinging.forEach(function (a) {
      ea = Math.min(ea, a <= H0 ? clamp((H0 - a) / CONFIG.EDGES.FADE[0], 0, 1) : clamp((a - H1) / CONFIG.EDGES.FADE[1], 0, 1));
    });
    ea = Math.round(ea * 50) / 50;
    if (ea !== edgeAlpha) { edgeAlpha = ea; book.style.setProperty('--edge-alpha', ea); }

    light(S);

    // Cast shadows: the cover, then each lifting leaf, over the right page;
    // a landing leaf over the left.
    var under = 0, overL = 0;
    if (p > 0 && p < 1) under = clamp(1 - S.flap / 180, 0, 1);
    if (moving >= 0) { under = clamp(1 - S.leafA / 180, 0, 1); overL = clamp(S.leafA / 180, 0, 1); }
    rCast.style.opacity = (under > 0 && under < 1 ? 0.62 * Math.pow(under, 0.85) : 0).toFixed(3);
    rCast.style.transform = 'scaleX(' + Math.max(0.001, Math.pow(under, 0.6)).toFixed(4) + ')';
    lCast.style.opacity = (moving >= 1 ? 0.5 * Math.pow(overL, 3) : 0).toFixed(3);
    lCast.style.transform = 'scaleX(' + Math.max(0.001, Math.pow(overL, 2)).toFixed(4) + ')';

    // Foil glint and leather sheen follow how squarely the cover faces the
    // light; at rest the band waits just right of the foil, so the peek and
    // the opening sweep it across the eagle and the lettering.
    var nc = world([0, 0, 1], 'flap', S);
    var g = (nc[0] + 0.33) * 4.2 + (nc[1] + 0.20) * 2.6 + 0.72;
    sweep.style.transform = 'translate3d(' + (clamp(g, -1.5, 1.5) * 33.333).toFixed(2) + '%,0,0)';
    sheen.style.transform = 'translate3d(' + (clamp(g * 0.55 - 0.25, -1.5, 1.5) * 33.333).toFixed(2) + '%,0,0)';

    // Shadow on a table just beneath the book; it fades while the book turns
    // over, since it would tip up with it.
    floor.style.transform = t3(piv[3] + G.U * 0.03, G.U * 0.045, -G.T / 2 - G.T * 2.2) + ' scale(' + ((piv[4] - piv[3]) / G.W).toFixed(4) + ',1)';
    floor.style.opacity = (0.85 * (1 - Math.sin(S.flip * DEG))).toFixed(3);

    // Hit areas: the open button over the closed book; once open, a tap on
    // either page turns toward it (left = back, right = forward).
    var dyHit = F.dy + liftPx;
    if (state.target === 0 || state.rewind || S.leg === END - 1) {
      placeHit('hit', hit, state.target === 0 && !state.rewind ? F.box : null);
      placeHit('prev', tapPrev, null);
      placeHit('next', tapNext, null);
    } else {
      placeHit('hit', hit, null);
      placeHit('next', tapNext, project(pts.filter(function (q) { return q[0] >= -0.5; }), piv, S, pose, F.s, F.dx, dyHit));
      placeHit('prev', tapPrev, project(pts.filter(function (q) { return q[0] <= 0.5; }), piv, S, pose, F.s, F.dx, dyHit));
    }
  }

  function placeHit(key, btn, box) {
    var r = box ? { x: view.left + box.x0, y: view.top + box.y0, w: box.x1 - box.x0, h: box.y1 - box.y0 } : null;
    var o = rects[key];
    if (!r) {
      if (o !== null) { btn.hidden = true; rects[key] = null; }
      return;
    }
    if (o && Math.abs(r.x - o.x) + Math.abs(r.y - o.y) + Math.abs(r.w - o.w) + Math.abs(r.h - o.h) < 0.5) return;
    btn.hidden = false;
    rects[key] = r;
    btn.style.transform = 'translate(' + px(r.x) + ',' + px(r.y) + ')';
    btn.style.width = px(r.w);
    btn.style.height = px(r.h);
  }

  function light(S) {
    for (var i = 0; i < faces.length; i++) {
      var f = faces[i];
      var n = world(f.n, f.group, S);
      var d = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
      var o = 1 - (CONFIG.AMBIENT + CONFIG.DIFFUSE * (d > 0 ? d : 0));
      o = o < 0 ? 0 : o > 0.88 ? 0.88 : Math.round(o * 200) / 200;
      if (o !== f.last) { f.shade.style.opacity = o; f.last = o; }
    }
  }

  // ---------------------------------------------------------------- loop ---
  var raf = 0, lastNow = 0;

  function wake() {
    if (!raf) { lastNow = 0; raf = requestAnimationFrame(tick); }
  }

  function tick(now) {
    raf = 0;
    var dt = lastNow ? Math.min(64, now - lastNow) : 16;
    lastNow = now;
    try {
      step(dt);
      render(now);
    } catch (err) {
      broken(err);
      return;
    }
    if (busy(now)) raf = requestAnimationFrame(tick);
  }

  function step(dt) {
    if (!state.dragging && state.pos !== state.target) {
      var fwd = state.target > state.pos;
      var leg = fwd ? Math.floor(state.pos) : Math.ceil(state.pos) - 1;
      var speed = (1000 / legMs(leg, fwd)) * (state.rewind ? CONFIG.RIFFLE : 1);
      var want = fwd ? speed : -speed;
      // Velocity eases toward the wanted speed, so a reversal swings round
      // instead of bouncing off an invisible wall...
      state.vel += (want - state.vel) * (1 - Math.exp(-dt / CONFIG.REVERSE_MS));
      // ... but never carries on into the next leg while it does (that would
      // start lifting a different page for a moment).
      var lo = Math.floor(state.pos), hi = Math.ceil(state.pos);
      if (lo === hi) { if (fwd) hi = lo + 1; else lo = hi - 1; }
      var nextPos = clamp(state.pos + state.vel * dt / 1000, lo, hi);
      if ((fwd && nextPos >= state.target) || (!fwd && nextPos <= state.target)) arrive(state.target);
      else state.pos = nextPos;
    }
    var k = 1 - Math.exp(-dt / 220);
    state.tiltX += (state.aimX - state.tiltX) * k;
    state.tiltY += (state.aimY - state.tiltY) * k;
  }

  function arrive(p) {
    state.vel = 0;
    if (p >= END) p = 0;                 // closed from the back ≡ closed
    state.pos = p;
    state.target = p;
    if (p === 0) state.rewind = false;
    preloadAround(p);
    settled(true);
    labels();
    announce();
  }

  function busy(now) {
    if (state.dragging || state.pos !== state.target) return true;
    if (Math.abs(state.tiltX - state.aimX) > 0.01 || Math.abs(state.tiltY - state.aimY) > 0.01) return true;
    if (state.peekStart >= 0 && now - state.peekStart < CONFIG.PEEK_MS) return true;
    return motionOK() && state.pos === 0; // the idle drift
  }

  // ------------------------------------------------------------ controls ---
  function settled(yes) { root.classList.toggle('is-settled', yes); }

  function labelFor(p) {
    if (p <= 0 || p >= END) return (mqFine.matches ? 'Click' : 'Tap') + ' to open';
    if (p === 1) return 'Data page';
    var a = (p - 2) * 2 + 1;
    return 'Visa pages ' + a + '–' + (a + 1) + ' of ' + (SPREADS * 2);
  }

  function labels() {
    var p = state.target;
    root.classList.toggle('is-open', p >= 1 && p < END);
    count.textContent = labelFor(p);
    navPrev.disabled = !(p >= 1 && p < END);
    navNext.disabled = !(p >= 1 && p < END);
    navPrev.setAttribute('aria-label', p === 1 ? 'Close the passport' : 'Previous pages');
    navNext.setAttribute('aria-label', p >= END - 1 || (p === 1 && !SPREADS) ? 'Close the passport' : 'Next pages');
  }

  function announce() {
    var p = state.pos, msg = '';
    if (p === 0) msg = 'Passport closed.';
    else if (p === 1) msg = ((document.getElementById('pp-desc') || {}).textContent || '').replace(/\s+/g, ' ').trim();
    else if (p >= 2 && p < END) msg = labelFor(p) + '.' + stampsOn(p);
    if (live) live.textContent = msg;
  }

  // " Stamped: Germany, 2017; Iceland, 2017." for the spread at p.
  function stampsOn(p) {
    var a = (p - 2) * 2 + 1;
    var on = STAMPS.filter(function (st) { return st.page === a || st.page === a + 1; });
    if (!on.length) return '';
    return ' Stamped: ' + on.map(function (st) { return st.name + ', ' + st.year; }).join('; ') + '.';
  }

  var fadeTimer = 0;

  function go(target, opts) {
    opts = opts || {};
    if (state.rewind && !opts.force) return;     // a riffle back runs to the end
    target = clamp(target, 0, END);
    if (target === state.target && !opts.force) return;
    interacted = true;
    clearDrag();
    // Opening during the peek: start from where the cover already is.
    if (state.pos === 0 && target > 0 && state.peekStart >= 0) {
      var pa = peekAngle(performance.now());
      if (pa > 0.01) state.pos = CONFIG.OPEN.flipEnd * easeInv(pa / CONFIG.OPEN_ANGLE);
    }
    state.peekStart = -1;
    state.target = target;
    state.rewind = !!opts.rewind;
    labels();
    preloadAround(target);

    if (!motionOK()) {
      // Reduced motion: no flip and no turn — a quick fade to the new state.
      clearTimeout(fadeTimer);
      settled(false);
      root.classList.add('is-fading');
      fadeTimer = setTimeout(function () {
        arrive(target);
        render(performance.now());
        root.classList.remove('is-fading');
      }, 170);
      return;
    }
    settled(state.pos === target);
    wake();
  }

  function next() {
    if (state.target <= 0) go(1);
    else if (state.target < END - 1 && SPREADS) go(state.target + 1);
    else if (SPREADS) go(END);
    else go(0);
  }
  function prev() {
    if (state.target <= 0) return;
    go(state.target - 1);
  }
  function closeAll() {
    if (state.target <= 0) return;
    if (state.target === 1) { go(0); return; }
    go(0, { rewind: true });
  }

  // Drag the cover sideways to open it by hand. A tap is still a tap, a
  // vertical swipe still scrolls, and a pinch still zooms.
  var drag = null, swallowUntil = 0;

  function clearDrag() {
    if (state.dragging) { state.dragging = false; root.classList.remove('is-dragging'); }
    drag = null;
  }

  hit.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || !e.isPrimary || drag) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, p0: state.pos, on: false, lastX: e.clientX, lastT: e.timeStamp, v: 0, moved: 0 };
  });

  hit.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.sqrt(dx * dx + dy * dy));
    if (!drag.on) {
      // Only a sideways pull on a closed book becomes a drag.
      if (!motionOK() || state.target !== 0 || state.pos > CONFIG.OPEN.settleStart || state.rewind ||
          Math.abs(dx) < CONFIG.TAP_SLOP || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      drag.on = true;
      drag.x = e.clientX;
      drag.span = G.W * scaleNow * CONFIG.DRAG_SPAN;
      // Start from where the cover is — mid-peek included.
      var pa = peekAngle(performance.now());
      if (state.pos === 0 && pa > 0.01) state.pos = CONFIG.OPEN.flipEnd * easeInv(pa / CONFIG.OPEN_ANGLE);
      drag.p0 = state.pos;
      state.peekStart = -1;
      state.dragging = true;
      state.vel = 0;
      interacted = true;
      try { hit.setPointerCapture(e.pointerId); } catch (err) { /* already released */ }
      root.classList.add('is-dragging');
      settled(false);
      wake();
      dx = 0;
    }
    state.pos = clamp(drag.p0 - dx / drag.span * CONFIG.OPEN.flipEnd, 0, CONFIG.OPEN.settleStart);
    var dtm = e.timeStamp - drag.lastT;
    if (dtm > 0) {
      drag.v = (e.clientX - drag.lastX) / dtm;
      drag.lastX = e.clientX;
      drag.lastT = e.timeStamp;
    }
  });

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    if (!d.on) return; // a tap — the click handler has it
    state.dragging = false;
    root.classList.remove('is-dragging');
    swallowUntil = performance.now() + 450;
    var open = d.v < -0.45 || (d.v <= 0.45 && state.pos > CONFIG.DRAG_OPEN_AT);
    state.target = open ? 0 : 1;      // so go() sees a change either way
    go(open ? 1 : 0, { force: true });
    if (!open && state.pos === 0) arrive(0);
  }
  hit.addEventListener('pointerup', endDrag);
  hit.addEventListener('pointercancel', endDrag);
  hit.addEventListener('lostpointercapture', endDrag);

  hit.addEventListener('click', function (e) {
    // e.detail > 1: the second click of a double-click would only undo the first.
    if (performance.now() < swallowUntil || e.detail > 1) return;
    go(1);
  });

  // Page halves: a tap that wanders (text selection, a stray drag) is not a
  // turn; nor is the second click of a double-click. The stamps sit above
  // the page halves so they can be hovered (see .pp-stamp), and a click on
  // one turns its page just the same.
  function turnOnTap(target, dirOf) {
    var down = null;
    target.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; });
    target.addEventListener('click', function (e) {
      var dir = dirOf(e);
      if (!dir || e.detail > 1) return;
      if (down && Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > CONFIG.TAP_SLOP * 1.5) return;
      if (dir > 0) next(); else prev();
    });
  }
  turnOnTap(tapPrev, function () { return -1; });
  turnOnTap(tapNext, function () { return 1; });
  // Nothing else in the scene takes the pointer, so these come from stamps.
  turnOnTap(scene, function (e) {
    var face = e.target.closest ? e.target.closest('.pp-face') : null;
    return face === rTop ? 1 : face === lTop ? -1 : 0;
  });
  navPrev.addEventListener('click', prev);
  navNext.addEventListener('click', next);

  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    var tag = (e.target && e.target.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (e.target && e.target.isContentEditable)) return;
    var k = e.key;
    if (state.target < 1) {
      if (k === 'ArrowRight' && !state.rewind) { e.preventDefault(); next(); }
      return;
    }
    if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); prev(); }
    else if (k === 'Escape') { e.preventDefault(); closeAll(); }
  });

  // Pointer parallax: the passport turns its face a little toward the mouse.
  stage.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || !motionOK()) return;
    var r = stage.getBoundingClientRect();
    var nx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1);
    var ny = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1);
    state.aimX = -ny * CONFIG.TILT.x;
    state.aimY = nx * CONFIG.TILT.y;
    wake();
  });
  stage.addEventListener('pointerleave', function () { state.aimX = 0; state.aimY = 0; wake(); });

  function onMotionPref() {
    if (!motionOK()) {
      state.aimX = state.aimY = state.tiltX = state.tiltY = 0;
      state.peekStart = -1;
      clearDrag();
      if (state.pos !== state.target) arrive(state.target);
    }
    render(performance.now());
    wake();
  }
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', onMotionPref);
  else if (mqReduce.addListener) mqReduce.addListener(onMotionPref);
  if (mqFine.addEventListener) mqFine.addEventListener('change', labels);

  // Resizing: re-frame on every event (cheap), rebuild once it settles.
  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    measure();
    render(performance.now());
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (layout()) { render(performance.now()); wake(); }
    }, 120);
  });

  // ------------------------------------------------------------- startup ---
  var shown = false;
  function reveal() {
    if (shown) return;
    shown = true;
    root.classList.add('is-ready');
    settled(true);
    wake();
    // Now the cover is up, fetch the inside: the front spread first, then
    // the visa pages nearest the front, then the rest while idle.
    sheetImgs('visited').forEach(loadImg);
    Array.prototype.forEach.call(bioPage.querySelectorAll('img'), loadImg);
    preloadAround(1);
    Object.keys(sheets).forEach(function (id) {
      sheetImgs(id).forEach(function (im) { if (!im.getAttribute('src')) queue.push(im); });
    });
    setTimeout(drainQueue, 1500);
    if (motionOK()) {
      setTimeout(function () {
        if (!interacted && state.target === 0 && state.pos === 0 && motionOK()) {
          state.peekStart = performance.now();
          wake();
        }
      }, CONFIG.PEEK_AFTER);
    }
  }

  // If anything goes wrong, show the flat screenshot rather than an empty stage.
  function broken(err) {
    root.classList.add('is-broken');
    var img = $('[data-pp-fallback]');
    if (img) { img.src = img.getAttribute('data-src'); img.hidden = false; }
    if (window.console && err) console.error(err);
  }

  try {
    buildFront();
    buildVisaSheets();
    register(coverFace, [0, 0, 1], 'flap');
    register(insideFace, [0, 0, -1], 'flap');
    register(backIn, [0, 0, 1], 'back');
    register(backOut, [0, 0, -1], 'back');
    register(rTop, [0, 0, 1], 'back');
    register(lTop, [0, 0, 1], 'book');
    register(leafFront, [0, 0, 1], 'leaf');
    register(leafBack, [0, 0, -1], 'leaf');
    register(spine, [-1, 0, 0], 'book');
    labels();
    if (!layout()) throw new Error('passport: the stage has no size');
    render(performance.now());

    if (coverImg.complete && coverImg.naturalWidth) reveal();
    else if (coverImg.decode) coverImg.decode().then(reveal, reveal);
    else coverImg.addEventListener('load', reveal);
    setTimeout(reveal, 2500);
  } catch (err) {
    broken(err);
  }
}());
