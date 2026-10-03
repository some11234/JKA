/* ==========================================================================
   passport.js — /passport/: a passport you can open.

   A closed US passport, built in CSS 3D: two cover boards and a page block
   with real edges. Tap it (or drag the cover sideways) and the
   cover swings open on its spine; the book then turns a quarter clockwise, so
   the Flighty passport inside — folded across the two pages along its own
   dashed line — reads the right way up. That's how you turn a real passport
   to read its data page.

   Everything is driven by ONE number, `progress`: 0 is closed, 1 is open and
   turned. Each frame derives the cover's angle, the turn, the tilt, the
   lighting and the framing from it, so opening, closing, a half-finished drag
   and a reversal mid-flight are all the same code path.

   Lighting is computed, not painted: every face knows which way it points,
   and each frame its shade comes from the angle between that direction and a
   light up and to the left. As the cover swings and the book turns, the page
   edges, the board edges and the inside of the cover all change shade on
   their own.

   Framing is computed too: each frame the book is scaled and centred so its
   current outline fits the stage, at any viewport size and at every moment —
   it pulls back while the open cover swings wide on a phone, then settles in.

   Geometry is in units of the cover's height, and CONFIG.BOOK mirrors
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
    FACETS: 5,               // flat segments per rounded corner of the page block
    FACETS_BOARD: 3,         // ... of a cover board (they're thin; fewer will do)

    // The timeline, as fractions of progress.
    FLIP_END: 0.62,          // the cover has landed
    TURN_START: 0.34,        // the quarter turn begins (overlapping the flip's end)
    OPEN_ANGLE: 178,         // degrees; an open cover never lies dead flat
    // While the cover swings through this range (degrees open), the page
    // block's edges are out of the scene — see render() for why. They fade
    // out over EDGES_FADE degrees before it and back in after it.
    EDGES_HIDDEN: [88, 172],
    EDGES_FADE: [18, 6],
    DURATION_OPEN: 2700,     // ms for the whole 0 → 1
    DURATION_CLOSE: 2100,

    // Pose, in degrees. Closed shows off the page block and fore-edge; open is
    // nearly face-on, tipped just enough to keep the book's thickness in view.
    POSE_CLOSED: { tx: 16, ty: -25 },
    POSE_MID: { tx: 10, ty: -7 },
    POSE_OPEN: { tx: 8, ty: 0 },

    FILL_CLOSED: 0.62,       // share of the stage the closed passport fills
    FILL_OPEN: 0.95,         // ... and the open one: as large as it fits, to be read
    FIT_MARGIN: 0.97,        // mid-move, the outline never gets closer to the edge than this

    LIGHT: [-0.30, -0.42, 0.86], // toward the light: up, left, in front of the book
    AMBIENT: 0.56,
    DIFFUSE: 0.62,

    TILT: { x: 6, y: 8 },    // pointer parallax at the stage's edge, degrees
    FLOAT: { x: 1.1, y: 1.5, lift: 0.008 }, // idle drift while closed (lift × height)
    PEEK_AFTER: 1800,        // ms after it appears: the cover lifts a little, once
    PEEK_ANGLE: 13,
    PEEK_MS: 1150,
    DRAG_SPAN: 1.25,         // a full flip takes a pull this many cover-widths long
    DRAG_OPEN_AT: 0.14       // let go past this much progress and it opens
  };

  var $ = function (sel) { return root.querySelector(sel); };
  var stage = $('[data-pp-stage]');
  var scene = $('[data-pp-scene]');
  var book = $('[data-pp-book]');
  var flap = $('[data-pp-flap]');
  var coverFace = $('[data-pp-cover]');
  var coverImg = $('[data-pp-cover-img]');
  var insideFace = $('[data-pp-inside]');
  var mapPage = $('[data-pp-map]');
  var dataPage = $('[data-pp-data]');
  var backFace = $('[data-pp-back]');
  var floor = $('[data-pp-floor]');
  var cast = $('[data-pp-cast]');
  var sweep = $('[data-pp-sweep]');
  var sheen = $('[data-pp-sheen]');
  var hit = $('[data-pp-toggle]');
  var hintText = $('[data-pp-hint-text]');

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  function motionOK() { return !mqReduce.matches; }

  // ------------------------------------------------------------- variant ---
  // The black-light pages are the default. /passport/?v=light previews the
  // daylight version without changing anything for anyone else.
  try {
    if (new URLSearchParams(location.search).get('v') === 'light') {
      root.setAttribute('data-variant', 'light');
      Array.prototype.forEach.call(root.querySelectorAll('img[data-variant-src]'), function (img) {
        img.src = img.getAttribute('src').replace('-blacklight-', '-light-');
      });
    }
  } catch (e) { /* no URLSearchParams: stay on the default */ }

  // ---------------------------------------------------------------- math ---
  var DEG = Math.PI / 180;
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { return t * t * t; }

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

  // ------------------------------------------------------------ geometry ---
  // Book space: x from the spine (0) to the fore-edge, y from head (0) to
  // tail, z toward the viewer with the closed book centred on z = 0.

  var G = {};          // measurements at the current layout size, in px
  var faces = [];      // every lit surface: its shade overlay and its normal
  var generated = [];  // edge strips made by build(), cleared on each rebuild

  function register(el, normal, onFlap, isGenerated) {
    var shade = document.createElement('span');
    shade.className = 'pp-shade';
    el.appendChild(shade);
    faces.push({ shade: shade, n: normal, flap: onFlap, gen: !!isGenerated, last: -1 });
  }

  // The outline of a board or the page block: square at the spine, rounded at
  // the two fore-edge corners. Walked along the tail, up the fore-edge and
  // back along the head, so the outward side of each step is on its right.
  function outline(x0, y0, x1, y1, r, n) {
    var pts = [[x0, y1], [x1 - r, y1]];
    var i, a;
    for (i = 1; i <= n; i++) {
      a = Math.PI / 2 * (1 - i / n);
      pts.push([x1 - r + r * Math.cos(a), y1 - r + r * Math.sin(a)]);
    }
    pts.push([x1, y0 + r]);
    for (i = 1; i <= n; i++) {
      a = -Math.PI / 2 * (i / n);
      pts.push([x1 - r + r * Math.cos(a), y0 + r + r * Math.sin(a)]);
    }
    pts.push([x0, y0]);
    return pts;
  }

  // Stand a strip on every step of an outline: `depth` deep, hanging down
  // from z = zTop, facing outward. A strip is laid flat, tipped up on its long
  // edge (rotateX), turned to the step's direction (rotateZ), then moved into
  // place. Each overlaps its neighbours by half a pixel so no seam shows.
  function strips(parent, before, pts, zTop, depth, kind, onFlap) {
    var ov = 0.5;
    // Half a pixel taller at both ends, so the strip tucks under the faces it
    // meets instead of leaving an anti-aliased seam the background shows in.
    zTop += 0.5;
    depth += 1;
    for (var i = 0; i < pts.length - 1; i++) {
      var p = pts[i], q = pts[i + 1];
      var dx = q[0] - p[0], dy = q[1] - p[1];
      var len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.05) continue;
      var th = Math.atan2(dy, dx);
      var el = document.createElement('span');
      el.className = 'pp-strip pp-strip--' + kind;
      place(el, len + 2 * ov, depth,
        t3(p[0], p[1], zTop) + ' rotateZ(' + th.toFixed(5) + 'rad) translateX(' + -ov + 'px) rotateX(-90deg)');
      parent.insertBefore(el, before);
      generated.push(el);
      register(el, [-Math.sin(th), Math.cos(th), 0], onFlap, true);
    }
  }

  function build(U) {
    var B = CONFIG.BOOK;

    generated.forEach(function (el) { el.parentNode.removeChild(el); });
    generated = [];
    faces = faces.filter(function (f) { return !f.gen; });

    var W = B.RATIO * U, H = U;
    var T = B.THICK * U, tb = B.BOARD * U;
    var pw = (B.RATIO - B.INSET_FORE) * U, ph = (1 - 2 * B.INSET_HT) * U, py = B.INSET_HT * U;
    var rc = B.COVER_RADIUS * U, rp = B.PAGE_RADIUS * U;
    G = {
      U: U, W: W, H: H, T: T, tb: tb, rc: rc,
      hinge: T / 2 - tb / 2   // the front cover turns about the middle of its board
    };

    var art = ph / B.ART_W;   // one pixel of Flighty art, in layout px
    var s = book.style;
    s.setProperty('--rc', px(rc));
    s.setProperty('--rp', px(rp));
    s.setProperty('--grain', px(U * 0.16));
    s.setProperty('--floor-blur', px(U * 0.05));
    s.setProperty('--stitch-w', px(3 * art));
    s.setProperty('--stitch-on', px(12 * art));
    s.setProperty('--stitch-period', px(18 * art));

    // Front cover, in the flap's own space (its origin is on the hinge).
    place(coverFace, W, H, t3(0, 0, tb / 2));
    // Mirrored so its content runs fore-edge (left) → spine (right) once open.
    place(insideFace, W, H, t3(W, 0, -tb / 2) + ' rotateY(180deg)');
    mapPage.style.left = px(B.MAP_INSET_FORE * U);
    mapPage.style.top = px(py);
    mapPage.style.width = px((B.RATIO - B.MAP_INSET_FORE) * U);
    mapPage.style.height = px(ph);

    place(dataPage, pw, ph, t3(0, py, T / 2 - tb));
    place(backFace, W, H, t3(0, 0, -T / 2 + tb));
    place(floor, W, H, 'none');

    // DOM order back to front, for any renderer that leans on it.
    //
    // There is deliberately no spine. The closed pose turns it away from the
    // viewer and the open book lies on it, so it would never be seen — and
    // Chrome splits every 3D face along the planes of the others: a rounded
    // spine's tilted facets sliced the inside of the cover a few pixels from
    // the hinge mid-swing, and the slivers were dropped, opening a gap.
    strips(book, dataPage, outline(0, 0, W, H, rc, CONFIG.FACETS_BOARD), -T / 2 + tb, tb, 'board', false);
    strips(book, dataPage, outline(0, py, pw, py + ph, rp, CONFIG.FACETS), T / 2 - tb, T - 2 * tb, 'pages', false);
    strips(flap, coverFace, outline(0, 0, W, H, rc, CONFIG.FACETS_BOARD), tb / 2, tb, 'board', true);

    // Perspective in proportion to the book, so it looks the same at any size.
    scene.style.perspective = px(U * 3.4);
  }

  // ------------------------------------------------------------- framing ---
  var view = { w: 0, h: 0, left: 0, top: 0 };
  var S = { closed: 1, open: 1 }; // preferred scales at the two ends

  function fit(bw, bh) { return Math.min(view.w / bw, view.h / bh); }

  function layout() {
    view.w = scene.clientWidth;
    view.h = scene.clientHeight;
    view.left = scene.offsetLeft;
    view.top = scene.offsetTop;
    if (view.w < 40 || view.h < 40) return false;

    var B = CONFIG.BOOK;
    // Displayed cover height at each end, in px. (Units of cover height here.)
    var closedH = CONFIG.FILL_CLOSED * fit(B.RATIO, 1);
    var openH = CONFIG.FILL_OPEN * fit(1, 2 * B.RATIO);
    // Lay the book out at the larger of the two, so it's only ever scaled
    // down: a 3D layer scaled up past its layout size goes soft.
    var U = Math.ceil(Math.max(closedH, openH));
    build(U);
    S.closed = closedH / U;
    S.open = openH / U;
    return true;
  }

  // --------------------------------------------------------------- state ---
  var state = {
    progress: 0,
    target: 0,
    dragging: false,
    tiltX: 0, tiltY: 0,       // pointer parallax, eased
    aimX: 0, aimY: 0,         // ... and where it's heading
    peekStart: -1
  };
  var interacted = false;
  var hitBox = { x: 0, y: 0, w: 0, h: 0 };
  var edgesHidden = false;
  var edgeAlpha = 1;
  var scaleNow = 1;

  function peekAngle(now) {
    if (state.peekStart < 0) return 0;
    var t = (now - state.peekStart) / CONFIG.PEEK_MS;
    if (t >= 1 || t < 0) return 0;
    var A = CONFIG.PEEK_ANGLE;
    if (t < 0.34) return A * easeOut(t / 0.34);
    if (t < 0.76) return A * (1 - easeIn((t - 0.34) / 0.42));
    return A * 0.1 * Math.sin(Math.PI * (t - 0.76) / 0.24); // the little bounce as it lands
  }

  function render(now) {
    if (!G.U) return; // not laid out yet (a stage with no size)
    var p = state.progress;
    var flipT = easeInOut(clamp(p / CONFIG.FLIP_END, 0, 1));
    var turnT = easeInOut(clamp((p - CONFIG.TURN_START) / (1 - CONFIG.TURN_START), 0, 1));
    var closed = 1 - flipT;

    var angle = -CONFIG.OPEN_ANGLE * flipT - peekAngle(now) * closed; // the cover, degrees
    var turn = 90 * turnT;                                           // the book, degrees

    var C = CONFIG.POSE_CLOSED, M = CONFIG.POSE_MID, O = CONFIG.POSE_OPEN;
    var tx = lerp(lerp(C.tx, M.tx, flipT), O.tx, turnT);
    var ty = lerp(lerp(C.ty, M.ty, flipT), O.ty, turnT);

    var lift = 0;
    if (motionOK()) {
      var t = now / 1000, drift = closed;
      tx += drift * CONFIG.FLOAT.x * Math.sin(t * 0.83);
      ty += drift * CONFIG.FLOAT.y * Math.sin(t * 0.61 + 1.3);
      lift = drift * CONFIG.FLOAT.lift * Math.sin(t * 0.97 + 0.4);
    }
    var parallax = 1 - 0.55 * turnT;
    tx += state.tiltX * parallax;
    ty += state.tiltY * parallax;

    // The book's outline right now, flat in book space: the block, plus the
    // cover wherever it has swung to (its free edge sits at W·cos(angle)).
    var a = angle * DEG, tr = turn * DEG;
    var xMin = Math.min(0, G.W * Math.cos(a));
    var w = G.W - xMin, h = G.H;
    var pivX = (xMin + G.W) / 2, pivY = h / 2;
    var ca = Math.abs(Math.cos(tr)), sa = Math.abs(Math.sin(tr));
    var bw = w * ca + h * sa, bh = w * sa + h * ca;

    // Grow from the closed size to the open size as the book turns, but never
    // past what fits — that's the pull-back while the cover is swinging wide.
    var scale = Math.min(lerp(S.closed, S.open, turnT), CONFIG.FIT_MARGIN * fit(bw, bh));
    scaleNow = scale;
    var cx = view.w / 2, cy = view.h / 2 + lift * G.H * scale;
    var sc = scale.toFixed(5);

    book.style.transform =
      'translate3d(' + px(cx) + ',' + px(cy) + ',0)' +
      ' rotateX(' + tx.toFixed(3) + 'deg) rotateY(' + ty.toFixed(3) + 'deg)' +
      ' scale3d(' + sc + ',' + sc + ',' + sc + ')' +
      ' rotateZ(' + turn.toFixed(3) + 'deg)' +
      ' translate3d(' + px(-pivX) + ',' + px(-pivY) + ',0)';
    flap.style.transform = 'translate3d(0,0,' + px(G.hinge) + ') rotateY(' + angle.toFixed(3) + 'deg)';

    // Chrome bug workaround. Mid-swing, with the page block's side strips in
    // the scene, Chrome's compositor clips the inside of the cover along a
    // vertical line a few dozen pixels short of the hinge, opening a gap
    // between the two pages. Removing the strips from the 3D scene for that
    // stretch avoids it (visibility: hidden takes a layer out of the sort;
    // opacity would not). By then the book is nearly face-on and the strips
    // are 1–2px slivers, so nothing visibly changes.
    var swing = -angle, H0 = CONFIG.EDGES_HIDDEN[0], H1 = CONFIG.EDGES_HIDDEN[1];
    var hide = swing > H0 && swing < H1;
    if (hide !== edgesHidden) {
      edgesHidden = hide;
      book.classList.toggle('is-swinging', hide);
    }
    // ... and a fade either side, so a 3–4px cream edge never just blinks out.
    // (Fading is safe there: the inside of the cover faces away before H0,
    // and the bug is long over by H1.)
    var ea = swing <= H0 ? clamp((H0 - swing) / CONFIG.EDGES_FADE[0], 0, 1)
                         : clamp((swing - H1) / CONFIG.EDGES_FADE[1], 0, 1);
    ea = Math.round(ea * 50) / 50;
    if (ea !== edgeAlpha) {
      edgeAlpha = ea;
      book.style.setProperty('--edge-alpha', ea);
    }

    light(a, tr, tx * DEG, ty * DEG);

    // The cover's shadow on the first page: deep and wide while the cover is
    // still over it, gone by the time it lands.
    var under = clamp(1 + angle / 180, 0, 1);
    cast.style.opacity = (0.66 * Math.pow(under, 0.85)).toFixed(3);
    cast.style.transform = 'scaleX(' + Math.max(0.001, Math.pow(under, 0.6)).toFixed(4) + ')';

    // Foil glint and leather sheen: both follow how squarely the cover faces
    // the light, so tilting it (or the pointer) slides them across.
    var nc = world([0, 0, 1], true, a, tr, tx * DEG, ty * DEG);
    var pos = (nc[0] + 0.33) * 4.2 + (nc[1] + 0.20) * 2.6;
    sweep.style.transform = 'translate3d(' + (clamp(pos, -1.5, 1.5) * 33.333).toFixed(2) + '%,0,0)';
    sheen.style.transform = 'translate3d(' + (clamp(pos * 0.55 - 0.25, -1.5, 1.5) * 33.333).toFixed(2) + '%,0,0)';

    // Shadow on a table just beneath the book. Light from the upper left puts
    // it down and to the right on screen — turned into the book's own frame.
    var off = rotZ([G.U * 0.03, G.U * 0.045, 0], -tr);
    floor.style.transform = t3(xMin + off[0], off[1], -G.T / 2 - G.T * 2.2) + ' scale(' + (w / G.W).toFixed(4) + ',1)';

    // Only the passport is clickable: keep the button over its outline.
    var hw = bw * scale, hh = bh * scale;
    var hx = view.left + cx - hw / 2, hy = view.top + cy - hh / 2;
    if (Math.abs(hx - hitBox.x) + Math.abs(hy - hitBox.y) + Math.abs(hw - hitBox.w) + Math.abs(hh - hitBox.h) > 0.5) {
      hitBox = { x: hx, y: hy, w: hw, h: hh };
      hit.style.transform = 'translate(' + px(hx) + ',' + px(hy) + ')';
      hit.style.width = px(hw);
      hit.style.height = px(hh);
    }
  }

  function world(n, onFlap, flapA, turnA, txA, tyA) {
    if (onFlap) n = rotY(n, flapA);
    return rotX(rotY(rotZ(n, turnA), tyA), txA);
  }

  function light(flapA, turnA, txA, tyA) {
    for (var i = 0; i < faces.length; i++) {
      var f = faces[i];
      var n = world(f.n, f.flap, flapA, turnA, txA, tyA);
      var d = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
      var o = 1 - (CONFIG.AMBIENT + CONFIG.DIFFUSE * (d > 0 ? d : 0));
      o = o < 0 ? 0 : o > 0.88 ? 0.88 : Math.round(o * 200) / 200;
      if (o !== f.last) {
        f.shade.style.opacity = o;
        f.last = o;
      }
    }
  }

  // ---------------------------------------------------------------- loop ---
  var raf = 0, lastNow = 0;

  function wake() {
    if (!raf) {
      lastNow = 0;
      raf = requestAnimationFrame(tick);
    }
  }

  function tick(now) {
    raf = 0;
    var dt = lastNow ? Math.min(64, now - lastNow) : 16;
    lastNow = now;
    step(dt);
    render(now);
    if (busy(now)) raf = requestAnimationFrame(tick);
  }

  function step(dt) {
    if (!state.dragging && state.progress !== state.target) {
      var d = dt / (state.target > state.progress ? CONFIG.DURATION_OPEN : CONFIG.DURATION_CLOSE);
      state.progress = state.target > state.progress
        ? Math.min(state.target, state.progress + d)
        : Math.max(state.target, state.progress - d);
      if (state.progress === state.target) settled(true);
    }
    var k = 1 - Math.exp(-dt / 220);
    state.tiltX += (state.aimX - state.tiltX) * k;
    state.tiltY += (state.aimY - state.tiltY) * k;
  }

  function busy(now) {
    if (state.dragging || state.progress !== state.target) return true;
    if (Math.abs(state.tiltX - state.aimX) > 0.01 || Math.abs(state.tiltY - state.aimY) > 0.01) return true;
    if (state.peekStart >= 0 && now - state.peekStart < CONFIG.PEEK_MS) return true;
    return motionOK() && state.progress < 1; // the idle drift, while not fully open
  }

  // ------------------------------------------------------------ controls ---
  function settled(yes) { root.classList.toggle('is-settled', yes); }

  function labels() {
    var open = state.target === 1;
    hit.setAttribute('aria-label', open ? 'Close the passport' : 'Open the passport');
    hintText.textContent = (mqFine.matches ? 'Click' : 'Tap') + (open ? ' to close' : ' to open');
  }

  var fadeTimer = 0;

  function go(target) {
    interacted = true;
    state.target = target;
    state.peekStart = -1;
    labels();

    if (!motionOK()) {
      // Reduced motion: no flip and no turn — a quick fade to the other state.
      clearTimeout(fadeTimer);
      settled(false);
      root.classList.add('is-fading');
      fadeTimer = setTimeout(function () {
        state.progress = target;
        render(performance.now());
        root.classList.remove('is-fading');
        settled(true);
      }, 170);
      return;
    }
    if (state.progress !== target) settled(false);
    wake();
  }

  // Toggle by where it's HEADING, so a second tap mid-flight reverses it.
  function toggle() { go(state.target === 1 ? 0 : 1); }

  // Drag the cover sideways to open it by hand. A tap is still a tap, and an
  // up/down swipe still scrolls the page (touch-action: pan-y on the button).
  var drag = null, swallowClick = false;

  hit.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, p0: state.progress, on: false,
             lastX: e.clientX, lastT: e.timeStamp, v: 0 };
  });

  hit.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) {
      // Only a sideways pull on a closed (or closing) book becomes a drag.
      if (!motionOK() || state.target !== 0 || Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      drag.on = true;
      drag.x = e.clientX;
      drag.p0 = state.progress;
      state.dragging = true;
      interacted = true;
      state.peekStart = -1;
      try { hit.setPointerCapture(e.pointerId); } catch (err) { /* already released */ }
      root.classList.add('is-dragging');
      settled(false);
      wake();
      dx = 0;
    }
    var span = G.W * scaleNow * CONFIG.DRAG_SPAN;
    state.progress = clamp(drag.p0 - dx / span * CONFIG.FLIP_END, 0, CONFIG.TURN_START);
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
    swallowClick = true;
    setTimeout(function () { swallowClick = false; }, 0);
    // A flick decides on its own; otherwise it's how far the cover got.
    var open = d.v < -0.45 || (d.v <= 0.45 && state.progress > CONFIG.DRAG_OPEN_AT);
    go(open ? 1 : 0);
  }
  hit.addEventListener('pointerup', endDrag);
  hit.addEventListener('pointercancel', endDrag);

  hit.addEventListener('click', function () {
    if (swallowClick) return;
    toggle();
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
  stage.addEventListener('pointerleave', function () {
    state.aimX = 0;
    state.aimY = 0;
    wake();
  });

  function onMotionPref() {
    if (!motionOK()) {
      state.aimX = state.aimY = state.tiltX = state.tiltY = 0;
      state.peekStart = -1;
      if (!state.dragging && state.progress !== state.target) state.progress = state.target;
      settled(true);
    }
    render(performance.now());
    wake();
  }
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', onMotionPref);
  if (mqFine.addEventListener) mqFine.addEventListener('change', labels);

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (layout()) {
        render(performance.now());
        wake();
      }
    }, 100);
  });

  // ------------------------------------------------------------- startup ---
  // Revealed once the cover art has decoded (or after a beat, whichever comes
  // first), so it never appears as an empty navy board.
  var shown = false;
  function show() {
    if (shown) return;
    shown = true;
    root.classList.add('is-ready');
    settled(true);
    wake();
    if (motionOK()) {
      setTimeout(function () {
        if (!interacted && state.target === 0 && state.progress === 0 && motionOK()) {
          state.peekStart = performance.now();
          wake();
        }
      }, CONFIG.PEEK_AFTER);
    }
  }

  // If anything above throws, fall back to the flat screenshot rather than
  // leave an empty stage.
  function broken(err) {
    root.classList.add('is-broken');
    var img = $('[data-pp-fallback]');
    if (img) {
      img.src = img.getAttribute('data-src');
      img.hidden = false;
    }
    if (window.console && err) console.error(err);
  }

  try {
    register(coverFace, [0, 0, 1], true);
    register(insideFace, [0, 0, -1], true);
    register(dataPage, [0, 0, 1], false);
    register(backFace, [0, 0, 1], false);
    labels();
    if (layout()) render(performance.now());

    if (coverImg.complete && coverImg.naturalWidth) show();
    else if (coverImg.decode) coverImg.decode().then(show, show);
    else coverImg.addEventListener('load', show);
    setTimeout(show, 2500);
  } catch (err) {
    broken(err);
  }
}());
