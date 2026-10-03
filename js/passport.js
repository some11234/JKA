/* ==========================================================================
   passport.js — /passport/: a passport you can open and leaf through.

   A closed US passport, built in CSS 3D: two cover boards and a page block
   with real edges. Tap it (or drag the cover sideways) and it swings open on
   its spine, then turns a quarter clockwise so the Flighty passport inside —
   folded across the two pages along its own dashed line — reads the right
   way up, the way you turn a real passport to read its data page. Turn the
   page and the book stands back upright for the visa pages; turn past the
   last one and the back cover closes and the book turns over, ready again.

   Everything is driven by ONE number, `pos`, moving along a path:

       0       closed
       1       open on the Flighty pages, turned a quarter
       2 … 10  visa spreads 1–2 … 17–18, upright
       11      closed from the back and turned over — identical to 0

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
   tools/build-passport.py, which cuts the page images to the same shape.
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
      MAP_INSET_FORE: 0.022, // navy rim past the outer edge of the page inside the cover
      THICK: 0.04,           // closed thickness, boards included (~5 mm on 125)
      BOARD: 0.0045,         // one cover board
      COVER_RADIUS: 0.0378,  // the cover art's rounded corners (100px on 1746)
      PAGE_RADIUS: 0.0365,   // Flighty's page corners (~42px on 1179), a hair over
      ART_W: 1179            // Flighty art width in px: the page's head-to-tail length
    },
    FACETS: 5,               // flat segments per rounded corner of a page stack
    FACETS_BOARD: 3,         // ... of a cover board

    // The legs of the path. ms is the time for the whole leg at normal speed.
    OPEN: { ms: 2700, back: 2100, flipEnd: 0.62, turnStart: 0.34 },  // 0 → 1
    TO_VISAS: { ms: 1500, turnEnd: 0.6, leafStart: 0.2 },             // 1 → 2
    PAGE: { ms: 950 },                                               // k → k+1
    CLOSE_BACK: { ms: 2600, closeEnd: 0.46, flipStart: 0.4 },         // last → closed
    RIFFLE: 6,               // speed-up when riffling back to the cover (Esc)
    OPEN_ANGLE: 178,         // degrees; an open cover never lies dead flat

    // Pose, in degrees. Closed shows off the page block and fore-edge; open is
    // nearly face-on, so the pages read crisply.
    POSE: {
      closed: { tx: 16, ty: -25 },
      mid: { tx: 10, ty: -7 },
      flighty: { tx: 2, ty: 0 },
      read: { tx: 2, ty: 0 },
      turning: { tx: 6, ty: -9 } // mid-way through the back cover closing
    },
    FILL: { closed: 0.62, flighty: 0.95, read: 0.95 }, // share of the stage
    FIT_MARGIN: 0.97,        // mid-move, the outline never gets closer to the edge than this
    PERSPECTIVE: 3.4,        // × the book's largest on-screen height
    MAX_DPR: 2,              // lay out at up to 2× so 3D layers raster sharp

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

  var VISAS = (window.PASSPORT_VISAS || []).slice(0, 9);
  var SPREADS = VISAS.length;
  var LEAVES = SPREADS + 1;   // leaf 0: Flighty page / visa 1
  var END = SPREADS + 2;      // "closed from the back"

  var $ = function (sel) { return root.querySelector(sel); };
  var stage = $('[data-pp-stage]');
  var scene = $('[data-pp-scene]');
  var book = $('[data-pp-book]');
  var flap = $('[data-pp-flap]');
  var coverFace = $('[data-pp-cover]');
  var coverImg = $('[data-pp-cover-img]');
  var insideFace = $('[data-pp-inside]');
  var mapPage = $('[data-pp-map]');
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

  var variant = 'blacklight';
  try {
    if (new URLSearchParams(location.search).get('v') === 'light') variant = 'light';
  } catch (e) { /* no URLSearchParams: stay on the default */ }
  if (variant !== 'blacklight') root.setAttribute('data-variant', variant);

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
  function rotZ(v, a) { var c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]; }

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
  sheets.data = $('[data-sheet="data"]');

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // An engraved seal for the right-hand page, the way each Wallet ID carries
  // its state seal — this one invented, not any real seal.
  var SEAL_SVG = '<svg viewBox="0 0 200 200" aria-hidden="true">' +
    '<defs><path id="pp-seal-arc" d="M100 100m-78 0a78 78 0 1 1 156 0a78 78 0 1 1 -156 0"/></defs>' +
    '<circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
    '<circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    '<circle cx="100" cy="100" r="58" fill="none" stroke="currentColor" stroke-width="0.8" stroke-dasharray="2 3"/>' +
    '<text font-size="17" letter-spacing="3.2" fill="currentColor"><textPath href="#pp-seal-arc">UNITED STATES OF AMERICA · VISAS ·</textPath></text>' +
    '<path d="M100 60l4.3 13.2h13.9l-11.2 8.2 4.3 13.2-11.3-8.2-11.3 8.2 4.3-13.2-11.2-8.2h13.9z" fill="currentColor"/>' +
    '<path d="M62 116c14-6 24-6 38 2c14-8 24-8 38-2M66 128c12-5 22-5 34 2c12-7 22-7 34-2M72 140c10-4 18-4 28 2c10-6 18-6 28-2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '</svg>';

  function buildVisaSheets() {
    VISAS.forEach(function (v, i) {
      [0, 1].forEach(function (side) {
        var page = i * 2 + 1 + side;
        var s = el('span', 'pp-sheet pp-visa ' + (side ? 'pp-sheet--recto pp-visa--recto' : 'pp-sheet--verso pp-visa--verso'));
        s.setAttribute('data-sheet', 'v' + page);
        var img = el('img');
        img.alt = '';
        img.decoding = 'async';
        img.width = 920;
        img.height = 1391;
        img.draggable = false;
        img.setAttribute('data-src', '/assets/passport/web/visa-' + (page < 10 ? '0' : '') + page + '.webp');
        // A page whose art is missing shows its paper, not a broken-image icon.
        img.addEventListener('error', function () { img.style.visibility = 'hidden'; });
        s.appendChild(img);
        s.appendChild(el('span', 'pp-gutter'));
        // The quote is one box spanning the whole spread, present on both
        // pages and offset so each shows its own half; across the fold it
        // reads as one line of type.
        var q = el('span', 'pp-visa__quote' + (v.quote.length > 170 ? ' pp-visa__quote--long' : ''));
        q.appendChild(el('span', 'pp-visa__q', '“' + v.quote + '”'));
        q.appendChild(el('span', 'pp-visa__by', v.by));
        s.appendChild(q);
        s.appendChild(el('span', 'pp-visa__num mono', String(page)));
        if (!side) {
          var cap = el('span', 'pp-visa__cap');
          cap.appendChild(el('span', 'pp-visa__title', v.title));
          cap.appendChild(el('span', 'pp-visa__sub', v.sub));
          s.appendChild(cap);
        } else {
          var seal = el('span', 'pp-visa__seal');
          seal.innerHTML = SEAL_SVG;
          s.appendChild(seal);
        }
        sheets['v' + page] = s;
        sheetBox.appendChild(s);
      });
    });
    var blank = el('span', 'pp-sheet pp-sheet--verso pp-visa pp-visa--blank');
    sheets.blank = blank;
    sheetBox.appendChild(blank);
  }

  function leafFrontId(j) { return j === 0 ? 'data' : 'v' + (j * 2); }
  function leafBackId(j) { return j === LEAVES - 1 ? 'blank' : 'v' + (j * 2 + 1); }

  function mount(face, id) {
    if (face._sheet === id) return;
    var slot = face.querySelector('.pp-slot');
    if (face._sheet && sheets[face._sheet] && sheets[face._sheet].parentNode === slot) sheetBox.appendChild(sheets[face._sheet]);
    face._sheet = id || null;
    if (id && sheets[id]) slot.appendChild(sheets[id]);
  }

  // Images load lazily, nearest first, once the cover is up.
  var queue = [];
  function loadImg(img) {
    if (!img || img.getAttribute('src') || !img.getAttribute('data-src')) return;
    var src = img.getAttribute('data-src');
    if (img.hasAttribute('data-variant-src')) src = src.replace('-blacklight-', '-' + variant + '-');
    img.src = src;
  }
  function sheetImg(id) { return sheets[id] ? sheets[id].querySelector('img') : null; }
  function preloadAround(p) {
    // The pages within a spread of where the book is (or is heading).
    var ids = [];
    var nL = clamp(Math.round(p) - 1, 0, LEAVES - 1);
    for (var j = Math.max(0, nL - 1); j <= Math.min(LEAVES - 1, nL + 2); j++) ids.push(leafFrontId(j), leafBackId(j));
    ids.forEach(function (id) { loadImg(sheetImg(id)); });
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
  var K = 1;                 // device pixels per CSS pixel the layout is built at
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
    var ov = 0.5 * K;
    zTop += 0.5 * K;
    depth += 1 * K;
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
      eps: 0.6 * K             // how far a turning leaf floats above the stacks
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
    mapPage.style.left = px(B.MAP_INSET_FORE * U);
    mapPage.style.top = px(py);
    mapPage.style.width = px((B.RATIO - B.MAP_INSET_FORE) * U);
    mapPage.style.height = px(ph);

    // Back cover: inside face on top (z = 0 of its group), outside face below.
    place(backIn, W, H, t3(0, 0, 0));
    place(backOut, W, H, t3(W, 0, -tb) + ' rotateY(180deg)');

    // The two top pages and the turning leaf, all page-sized.
    place(rTop, pw, ph, t3(0, py, 0));
    place(lTop, pw, ph, t3(-pw, py, 0));
    place(leafFront, pw, ph, t3(0, py, 0.3 * K));
    place(leafBack, pw, ph, t3(pw, py, -0.3 * K) + ' rotateY(180deg)');

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
      flap: 0, leaf: -1, leafA: 0, nL: 0, back: 0, flip: 0, turn: 0,
      pose: [P.closed, P.closed, 0], fill: ['closed', 'closed', 0],
      closed: 1, leg: -1
    };
    var open = rewind || !SPREADS ? (SPREADS ? 'read' : 'flighty') : 'flighty';
    if (p <= 0 || p >= END) return S;

    if (p < 1) {                                   // opening (or closing) the cover
      var O = CONFIG.OPEN;
      a = ease(span(p, 0, O.flipEnd));
      b = ease(span(p, O.turnStart, 1));
      S.flap = CONFIG.OPEN_ANGLE * a;
      S.turn = rewind ? 0 : 90 * b;
      S.pose = [lerpPose(P.closed, P.mid, a), P[open], b];
      S.fill = ['closed', open, b];
      S.closed = 1 - a;
      S.leg = 0;
    } else if (p === 1) {                          // resting on the Flighty pages
      S.flap = CONFIG.OPEN_ANGLE;
      S.turn = 90;
      S.pose = [P.flighty, P.flighty, 0];
      S.fill = ['flighty', 'flighty', 0];
      S.closed = 0;
    } else if (p < 2 && SPREADS) {                 // Flighty → first visa spread
      var V = CONFIG.TO_VISAS;
      f = p - 1;
      a = ease(span(f, 0, V.turnEnd));
      b = (rewind ? easeSine : ease)(span(f, V.leafStart, 1));
      // The cover rests a touch lifted (178°) on its own, but flat once pages
      // pile onto it — otherwise its rising surface pokes through them.
      S.flap = lerp(CONFIG.OPEN_ANGLE, 180, b);
      S.turn = rewind ? 0 : 90 * (1 - a);
      S.leaf = 0;
      S.leafA = 180 * b;
      S.nL = b;
      S.pose = [P[open], P.read, a];
      S.fill = [open, 'read', a];
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
      S.turn = SPREADS ? 0 : 90 * (1 - a);
      S.pose = [lerpPose(P.read, P.turning, a), P.closed, b];
      S.fill = [SPREADS ? 'read' : 'flighty', 'closed', b];
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
    if (leg === 1) return CONFIG.TO_VISAS.ms;
    return CONFIG.PAGE.ms;
  }

  // ------------------------------------------------------------- framing ---
  var view = { w: 0, h: 0, left: 0, top: 0 };
  var PREF = { closed: 1, flighty: 1, read: 1 };
  var Dcss = 1000;            // perspective, in CSS px

  function flapHinge(S) {
    // Closed or showing the Flighty pages, the cover hinges at the top of the
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
    var fl = S.flip * DEG, tr = S.turn * DEG, ty = pose.ty * DEG, tx = pose.tx * DEG;
    var ox = view.w / 2, oy = view.h / 2;
    for (var i = 0; i < pts.length; i++) {
      var q = [pts[i][0] - piv[0], pts[i][1] - piv[1], pts[i][2] - piv[2]];
      q = rotZ(rotY(q, fl), tr);
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
    K = Math.min(window.devicePixelRatio || 1, CONFIG.MAX_DPR);
    build(100);
    Dcss = 1e7;   // measure flat; the per-frame fit handles perspective, shrink-only
    var hcss = {};
    [['closed', 0], ['flighty', 1], ['read', 2]].forEach(function (r) {
      if (r[0] === 'read' && !SPREADS) { hcss.read = hcss.flighty; return; }
      var S = evaluate(r[1]), pts = outline(S), piv = pivotOf(pts);
      // Start well oversize (about four stages tall) and let the fit shrink it.
      var F = fit(pts, piv, S, S.pose[1], 4 * Math.max(view.w, view.h) / 100, 1);
      hcss[r[0]] = F.s * 100 * CONFIG.FILL[r[0]];      // CSS px tall at this fill
    });
    var Hcss = Math.max(hcss.closed, hcss.flighty, hcss.read);
    // Lay out at device resolution: Chrome rasterises perspective-transformed
    // layers at about one texel per LAYOUT pixel whatever the screen's DPR, so
    // a book laid out in CSS px goes soft on a retina screen. The scale then
    // brings it back down to size.
    var U = Math.ceil(Hcss * K);
    build(U);
    Dcss = CONFIG.PERSPECTIVE * U / K;
    scene.style.perspective = px(Dcss);
    PREF.closed = hcss.closed / U;
    PREF.flighty = hcss.flighty / U;
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
    n = rotZ(rotY(n, S.flip * DEG), S.turn * DEG);
    return rotX(rotY(n, S._ty), S._tx);
  }

  function render(now) {
    if (!G.U) return;
    var p = state.pos;
    var S = evaluate(p, state.rewind);
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
      ' rotateZ(' + S.turn.toFixed(3) + 'deg) rotateY(' + S.flip.toFixed(3) + 'deg)' +
      ' translate3d(' + px(-piv[0]) + ',' + px(-piv[1]) + ',0)';

    // The parts.
    var zT = G.zTop, t1 = G.leaf, nL = S.nL, nR = LEAVES - nL;
    var bh = backHinge();
    flap.style.transform = 'translate3d(0,0,' + px(flapHinge(S)) + ') rotateY(' + (-S.flap).toFixed(3) + 'deg)';
    backGroup.style.transform = 'translate3d(0,0,' + px(bh) + ') rotateY(' + (-S.back).toFixed(3) + 'deg) translate3d(0,0,' + px(-bh) + ')';
    backBoard.style.transform = 'translate3d(0,0,' + px(zT - nR * t1 - 0.4 * K) + ')';
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
    var off = rotZ([G.U * 0.03, G.U * 0.045, 0], -S.turn * DEG);
    floor.style.transform = t3(piv[3] + off[0], off[1], -G.T / 2 - G.T * 2.2) + ' scale(' + ((piv[4] - piv[3]) / G.W).toFixed(4) + ',1)';
    floor.style.opacity = (0.85 * (1 - Math.sin(S.flip * DEG))).toFixed(3);

    // Hit areas: the open button over the closed book; once open, a tap on
    // either page turns toward it (left/top = back, right/bottom = forward).
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
    if (p === 1) return 'Flighty';
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
    else if (p === 1) msg = 'Open on the Flighty passport. ' + ((document.getElementById('pp-desc') || {}).textContent || '').trim();
    else if (VISAS[p - 2]) {
      var v = VISAS[p - 2];
      msg = labelFor(p) + ': ' + v.title + '. ' + v.alt + ' “' + v.quote + '” — ' + v.by + '.';
    }
    if (live) live.textContent = msg;
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
      // Only a sideways pull on a closed, unturned book becomes a drag.
      if (!motionOK() || state.target !== 0 || state.pos > CONFIG.OPEN.turnStart || state.rewind ||
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
    state.pos = clamp(drag.p0 - dx / drag.span * CONFIG.OPEN.flipEnd, 0, CONFIG.OPEN.turnStart);
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
  // turn; nor is the second click of a double-click.
  [[tapPrev, -1], [tapNext, 1]].forEach(function (pair) {
    var down = null;
    pair[0].addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; });
    pair[0].addEventListener('click', function (e) {
      if (e.detail > 1) return;
      if (down && Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > CONFIG.TAP_SLOP * 1.5) return;
      if (pair[1] > 0) next(); else prev();
    });
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
    if (k === 'ArrowRight' || k === 'PageDown' || (k === 'ArrowDown' && state.target === 1)) { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || (k === 'ArrowUp' && state.target === 1)) { e.preventDefault(); prev(); }
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
    // Now the cover is up, fetch the inside: the Flighty pages first, then
    // the visa pages nearest the front, then the rest while idle.
    loadImg(sheetImg('data'));
    loadImg(mapPage.querySelector('img'));
    preloadAround(1);
    Object.keys(sheets).forEach(function (id) { var im = sheetImg(id); if (im && !im.getAttribute('src')) queue.push(im); });
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
