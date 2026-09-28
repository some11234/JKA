/* ==========================================================================
   travel.js — builds the travel page from TRAVEL (travel-data.js): the counts
   at the top, one card per country, and the globe.

   THE GLOBE
   An orthographic projection drawn onto a <canvas> with d3-geo, from a world
   map in assets/travel/countries.json (see tools/build-travel-map.js). Canvas
   rather than SVG because the globe redraws every frame while it turns, and
   rewriting two hundred <path> elements sixty times a second is exactly what
   SVG is bad at. City pins are the exception: they are a handful of HTML dots
   laid over the canvas, so the "here now" ping can be a plain CSS animation.

   WHAT MOVES IT — three things, in order of precedence:
     1. You. Drag (or arrow keys when it's focused) and it goes where you put
        it. A flick carries on with a little inertia.
     2. The list. As each card crosses a line on screen (the middle on wide
        screens, lower on phones), the globe flies to that country and zooms
        in if it's small. Scroll back above the first card and it lets go.
     3. Nothing. With no card in play it drifts slowly westward, the way the
        Earth turns. The drift pauses while the pointer is over it, and for a
        few seconds after a drag.

   Reduced motion: no drift, no inertia, and flights become cuts.
   If the map fails to load, the globe still draws — as a wireframe with its
   pins — and if the drawing libraries themselves are missing, the cards
   render on their own and the globe's column folds away.
   ========================================================================== */

(function () {
  'use strict';

  if (typeof TRAVEL === 'undefined') return;

  /* Every tunable number, in one place. */
  var CONFIG = {
    MAP_URL: '/assets/travel/countries.json',
    RADIUS: 0.44,             // globe radius at rest, as a share of the stage's shorter side
    REST_LAT: 24,             // the tilt it settles back to while drifting (°N)
    SPIN_DEG_PER_S: 5,        // idle drift — a full turn every 72 seconds
    RESUME_MS: 6000,          // drift resumes this long after a drag, like the coverflow's autoplay
    FLY_MS: [650, 1700],      // shortest and longest flight between two countries
    FOCUS_SPAN: 0.26,         // a focused country's outline fills about this share of the globe
    ZOOM_MAX: 4.2,            // …but small countries stop zooming here
    LIFT: 0.3,                // long flights pull back this much mid-way, then come back in
    LINE_WIDE: 0.5,           // where a card takes over the globe, as a share of the
    LINE_NARROW: 0.62,        //   viewport's height from the top
    NARROW: '(max-width: 900px)',
    DPR_MAX: 2
  };

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = window.matchMedia(CONFIG.NARROW);
  var countries = (TRAVEL.countries || []).filter(function (c) { return c && c.code && c.name; });

  var regionNames = null;
  try { regionNames = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) { /* old browser */ }

  /* ----------------------------------------------------------- helpers --- */

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function thumbSrc(stem) { return '/assets/gallery/web/' + stem + '-thumb.webp'; }
  function midSrc(stem)   { return '/assets/gallery/web/' + stem + '-mid.webp'; }

  function pinned(city) { return typeof city.lat === 'number' && typeof city.lon === 'number'; }

  /* ------------------------------------------------------------- intro --- */

  /* Same contract as the gallery: a string is one paragraph, an array is
     several, and it goes in as text — prose must never become markup. */
  (function fillIntro() {
    var host = document.querySelector('[data-travel-intro]');
    var copy = TRAVEL.intro;
    if (!host || !copy) return;
    (Array.isArray(copy) ? copy : [copy]).forEach(function (text) {
      if (text) host.appendChild(el('p', null, text));
    });
  }());

  /* ------------------------------------------------------------- stats --- */

  (function fillStats() {
    var host = document.querySelector('[data-travel-stats]');
    if (!host) return;

    var continents = {}, cities = 0;
    countries.forEach(function (c) {
      if (c.continent) continents[c.continent] = true;
      cities += (c.cities || []).length;
    });

    [['Countries', countries.length],
     ['Continents', Object.keys(continents).length],
     ['Cities', cities]].forEach(function (row) {
      var stat = el('div', 'trv-stat');
      stat.appendChild(el('dt', null, row[0]));
      stat.appendChild(el('dd', null, String(row[1])));
      host.appendChild(stat);
    });
  }());

  /* ------------------------------------------------------------- cards --- */

  var list = document.querySelector('[data-travel-list]');
  var cards = countries.map(buildCard);

  function buildCard(c, index) {
    var li = el('li', 'trv-card' + (c.home ? ' trv-card--home' : ''));
    li.id = 'country-' + c.code.toLowerCase();   // /travel/#country-gb deep-links
    li.dataset.index = index;

    var photos = (c.photos || []).slice(0, 2);
    if (photos.length) {
      var media = el('div', 'trv-card__media');
      photos.forEach(function (p) {
        if (typeof p === 'string') p = { file: p };
        var img = document.createElement('img');
        img.src = thumbSrc(p.file);
        img.srcset = thumbSrc(p.file) + ' 900w, ' + midSrc(p.file) + ' 1400w';
        /* Half the card each when there are two. Getting this right is what
           keeps a phone from pulling the 1400px file for a 180px tile. */
        img.sizes = photos.length > 1
          ? '(max-width: 900px) 46vw, 260px'
          : '(max-width: 900px) 92vw, 520px';
        img.alt = p.alt || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        if (p.pos) img.style.objectPosition = p.pos;
        media.appendChild(img);
      });
      li.appendChild(media);
    }

    var body = el('div', 'trv-card__body');

    var top = el('div', 'trv-card__top');
    var code = el('span', 'trv-code', c.code.toUpperCase());
    code.setAttribute('aria-hidden', 'true');
    top.appendChild(code);
    top.appendChild(el('h3', 'trv-card__title', c.name));

    var here = (c.cities || []).some(function (city) { return city.now; });
    if (here) top.appendChild(el('span', 'trv-chip trv-chip--now', 'Here now'));
    else if (c.home) top.appendChild(el('span', 'trv-chip', 'Home'));
    body.appendChild(top);

    var meta = [c.continent, c.when].filter(Boolean).join(' · ');
    if (meta) body.appendChild(el('p', 'trv-card__meta', meta));
    if (c.note) body.appendChild(el('p', 'trv-card__note', c.note));

    if (c.cities && c.cities.length) {
      var ul = el('ul', 'trv-cities');
      ul.setAttribute('aria-label', 'Cities');
      c.cities.forEach(function (city) { ul.appendChild(el('li', null, city.name)); });
      body.appendChild(ul);
    }

    if (c.links && c.links.length) {
      var links = el('div', 'trv-card__links');
      c.links.forEach(function (l) {
        var a = el('a', 'trv-link', l.label + ' ');
        a.href = l.href;
        a.appendChild(el('span', 'arr', '→')).setAttribute('aria-hidden', 'true');
        links.appendChild(a);
      });
      body.appendChild(links);
    }

    li.appendChild(body);
    if (list) list.appendChild(li);
    return { data: c, li: li };
  }

  /* ------------------------------------------------------------- globe --- */

  var layout = document.querySelector('.trv-layout');
  var box = document.querySelector('[data-globe]');

  if (!box || !window.d3 || !d3.geoOrthographic || !window.topojson) {
    if (layout) layout.classList.add('is-globe-off');
    return;
  }

  var globe = createGlobe(box, pick);

  /* --------------------------------------------------- the scroll sync ---
     A card takes over the globe once its top edge has crossed the line — and
     keeps it until the next card crosses. "Last card over the line" rather
     than "card nearest the line" means the gaps between cards never leave the
     globe without a country, and nothing flickers at a card's edges. */

  var activeIndex = -1;   // what the globe is showing
  var scrollIndex = -1;   // what the scroll position alone would pick
  var following = null;   // a card we're scrolling to on purpose (see pick)
  var followTimer = 0;
  var scrollQueued = false;

  function indexFromScroll() {
    var line = window.innerHeight * (narrow.matches ? CONFIG.LINE_NARROW : CONFIG.LINE_WIDE);
    var index = -1;
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].li.getBoundingClientRect().top <= line) index = i;
      else break;
    }
    /* A short last card may never reach the line before the page runs out.
       Hitting the bottom counts. */
    var doc = document.documentElement;
    if (cards.length && window.scrollY + window.innerHeight >= doc.scrollHeight - 4) {
      index = cards.length - 1;
    }
    return index;
  }

  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(function () {
      scrollQueued = false;
      var index = indexFromScroll();
      if (index === scrollIndex) return;
      scrollIndex = index;
      /* While we're travelling to a card someone picked on the globe, the
         cards scrolling past on the way must not each grab the globe too. */
      if (following !== null) {
        if (index === following) following = null;
        return;
      }
      setActive(index);
    });
  }

  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    cards.forEach(function (card, i) { card.li.classList.toggle('is-active', i === index); });
    if (index < 0) globe.release();
    else globe.focus(cards[index].data);
  }

  /* Clicking a card, or tabbing into one, puts it on the globe straight away.
     It holds until the scroll moves on to a different card. */
  cards.forEach(function (card, i) {
    card.li.addEventListener('click', function () { setActive(i); });
    card.li.addEventListener('focusin', function () { setActive(i); });
  });

  /* Clicking a country on the globe: fly there now, and bring its card into
     view. */
  function pick(code) {
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].data.code.toUpperCase() !== code) continue;
      setActive(i);
      following = i;
      clearTimeout(followTimer);
      followTimer = setTimeout(function () { following = null; }, 1600);
      cards[i].li.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      return;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (narrow.addEventListener) narrow.addEventListener('change', onScroll);
  onScroll();

  /* =================================================================== */

  function createGlobe(box, onPick) {
    var canvas = box.querySelector('canvas');
    var ctx = canvas.getContext('2d');
    var pinLayer = box.querySelector('[data-globe-pins]');
    var tip = box.querySelector('[data-globe-tip]');
    var tipName = box.querySelector('[data-globe-tip-name]');
    var tipSub = box.querySelector('[data-globe-tip-sub]');
    var hint = box.querySelector('[data-globe-hint]');
    var readout = document.querySelector('[data-globe-readout]');
    var legend = document.querySelector('[data-globe-legend]');

    var projection = d3.geoOrthographic().clipAngle(90).precision(0.7);
    var path = d3.geoPath(projection, ctx);
    var SPHERE = { type: 'Sphere' };
    var graticule = d3.geoGraticule10();

    /* Colours come from the CSS tokens, so the globe follows if the accent is
       ever swapped in styles.css. */
    var tokens = getComputedStyle(root);
    var ACCENT = rgb(tokens.getPropertyValue('--accent')) || [0, 255, 176];
    var BG = rgb(tokens.getPropertyValue('--bg')) || [11, 11, 11];
    var WHITE = [255, 255, 255];

    var byCode = {};
    countries.forEach(function (c) { byCode[c.code.toUpperCase()] = c; });

    var view = { lon: 0, lat: CONFIG.REST_LAT, zoom: 1 };
    // The current frame's projection, unpacked for trace() — see setFrame().
    var F = { cx: 0, cy: 0, r: 1, cl: 1, sl: 0, cp: 1, sp: 0, v0: 1, v1: 0, v2: 0 };
    var W = 1, H = 1, R = 1, dpr = 1;
    var world = null;        // the map, once it has loaded
    var fade = 0;            // 0 → 1 as the map fades in over the wireframe
    var active = null;       // the country in focus (a TRAVEL entry)
    var hover = null;        // the map feature under the pointer
    var pointer = null;      // last pointer position over the canvas
    var flight = null;
    var inertia = 0;         // °/ms of longitude, after a flick
    var drag = null;
    var hovered = false, focused = false, visible = true;
    var resumeAt = 0, resumeTimer = 0;
    var raf = 0, last = 0, lastReadout = '';

    box.tabIndex = 0;
    box.setAttribute('role', 'region');
    box.setAttribute('aria-roledescription', 'globe');
    box.setAttribute('aria-label', 'Globe of the countries in the list below. ' +
      'Use the left and right arrow keys to spin it.');

    if (window.matchMedia('(hover: none)').matches && hint) hint.textContent = 'Swipe to spin';

    fillLegend();

    /* Pins: one per city with coordinates. */
    var pins = [];
    countries.forEach(function (c) {
      (c.cities || []).forEach(function (city) {
        if (!pinned(city)) return;
        var pin = el('span', 'trv-pin' + (c.home ? ' trv-pin--home' : '') +
                             (city.now ? ' trv-pin--now' : ''));
        pin.appendChild(el('span', 'trv-pin__label', city.name));
        pinLayer.appendChild(pin);
        pins.push({ el: pin, country: c, at: [city.lon, city.lat], opacity: 0, labelled: false });
      });
    });

    /* Open on the part of the world that has been visited. One vote per
       country, not per pin — five pins across the US would otherwise drag
       the view so far west that Europe starts on the horizon. */
    view.lon = meanLongitude(countries.map(function (c) {
      var at = (c.cities || []).filter(pinned).map(function (city) { return [city.lon, city.lat]; });
      return at.length ? d3.geoCentroid({ type: 'MultiPoint', coordinates: at }) : null;
    }).filter(Boolean));

    /* ------------------------------------------------------- the map --- */

    fetch(CONFIG.MAP_URL)
      .then(function (res) {
        if (!res.ok) throw new Error(res.status + ' ' + CONFIG.MAP_URL);
        return res.json();
      })
      .then(function (topo) {
        var features = topojson.feature(topo, topo.objects.countries).features;
        var codes = {};
        var hit = [];
        features.forEach(function (f) {
          if (f.properties.a2) codes[f.properties.a2] = f;
          hit.push({ f: f, bounds: d3.geoBounds(f), area: d3.geoArea(f) });
        });
        // Smallest first, so the Vatican wins over the Italy around it.
        hit.sort(function (a, b) { return a.area - b.area; });

        var home = [], visited = [], shapes = {};
        countries.forEach(function (c) {
          var code = c.code.toUpperCase(), f = codes[code];
          if (!f) {
            // Loud for Joe, silent for visitors: the card and pins still work.
            if (window.console) console.warn('travel: no country on the map for code "' +
              c.code + '" (' + c.name + '). Check it against ISO 3166-1 alpha-2.');
            return;
          }
          (c.home ? home : visited).push(f);
          shapes[code] = compile(f);   // for the focus glow
        });

        world = {
          land: compile(topojson.feature(topo, topo.objects.land)),
          // Interior borders only, and each one once — drawn as a single path.
          borders: topojson.mesh(topo, topo.objects.countries, function (a, b) { return a !== b; }),
          codes: codes,
          hit: hit,
          shapes: shapes,
          home: compile({ type: 'FeatureCollection', features: home }),
          visited: compile({ type: 'FeatureCollection', features: visited })
        };

        if (reduced) fade = 1;
        // Anything focused before the map arrived was aimed at its pins only.
        if (active) focus(active);
        kick();
      })
      .catch(function (err) {
        box.classList.add('is-map-missing');
        if (window.console) console.warn('travel: map unavailable, drawing the wireframe only.', err);
      });

    /* ---------------------------------------------------------- size --- */

    function resize() {
      var rect = box.getBoundingClientRect();
      W = Math.max(1, Math.round(rect.width));
      H = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, CONFIG.DPR_MAX);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      R = Math.min(W, H) * CONFIG.RADIUS;
      draw();
    }

    if (window.ResizeObserver) new ResizeObserver(resize).observe(box);
    else window.addEventListener('resize', resize);
    resize();

    /* No drawing while the globe is scrolled out of view. */
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible) kick();
      }).observe(box);
    }

    /* ---------------------------------------------------------- draw --- */

    function draw() {
      var r = R * view.zoom, cx = W / 2, cy = H / 2;
      projection.scale(r).translate([cx, cy]).rotate([-view.lon, -view.lat]);
      setFrame(cx, cy, r);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // A faint atmosphere just outside the rim, so the sphere lifts off the page.
      var halo = ctx.createRadialGradient(cx, cy, r * 0.96, cx, cy, r * 1.2);
      halo.addColorStop(0, rgba(WHITE, 0.07));
      halo.addColorStop(1, rgba(WHITE, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.2, 0, 2 * Math.PI);
      ctx.fill();

      // Ocean: the page colour, lit very slightly from the upper left.
      ctx.beginPath();
      path(SPHERE);
      ctx.fillStyle = rgba(BG, 1);
      ctx.fill();
      var sea = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.05, cx, cy, r);
      sea.addColorStop(0, rgba(WHITE, 0.07));
      sea.addColorStop(1, rgba(WHITE, 0.015));
      ctx.fillStyle = sea;
      ctx.fill();

      ctx.beginPath();
      path(graticule);
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = rgba(WHITE, 0.07);
      ctx.stroke();

      if (world && fade > 0) {
        ctx.globalAlpha = fade;

        // Land, with a hairline coast.
        ctx.beginPath();
        trace(world.land);
        ctx.fillStyle = rgba(WHITE, 0.12);
        ctx.fill();
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = rgba(WHITE, 0.2);
        ctx.stroke();

        // Borders cut in the page colour, so countries read as separate tiles.
        ctx.beginPath();
        path(world.borders);
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = rgba(BG, 0.85);
        ctx.stroke();

        fillSet(world.home, WHITE, 0.26, 0.7);
        fillSet(world.visited, ACCENT, 0.26, 0.9);

        // The focused country gets a soft glow: wide faint strokes under a
        // crisp one. Far cheaper than a canvas shadow, which re-blurs the
        // whole outline every frame.
        var focusShape = active && world.shapes[active.code.toUpperCase()];
        if (focusShape) {
          var tint = active.home ? WHITE : ACCENT;
          ctx.beginPath();
          trace(focusShape);
          ctx.fillStyle = rgba(tint, 0.22);
          ctx.fill();
          ctx.lineJoin = 'round';
          ctx.lineWidth = 6;   ctx.strokeStyle = rgba(tint, 0.1);  ctx.stroke();
          ctx.lineWidth = 3;   ctx.strokeStyle = rgba(tint, 0.22); ctx.stroke();
          ctx.lineWidth = 1.2; ctx.strokeStyle = rgba(tint, 1);    ctx.stroke();
        }

        if (hover) {
          ctx.beginPath();
          path(hover);
          ctx.fillStyle = rgba(WHITE, 0.08);
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = rgba(WHITE, 0.85);
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
      }

      // Shade the far edge, so it reads as a ball and not a disc.
      ctx.beginPath();
      path(SPHERE);
      var shade = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.2, cx, cy, r * 1.02);
      shade.addColorStop(0, rgba(BG, 0));
      shade.addColorStop(0.7, rgba(BG, 0.12));
      shade.addColorStop(1, rgba(BG, 0.5));
      ctx.fillStyle = shade;
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(WHITE, 0.22);   // --line
      ctx.stroke();

      placePins();
      updateReadout();
    }

    function fillSet(shape, tint, fill, stroke) {
      if (!shape.length) return;
      ctx.beginPath();
      trace(shape);
      ctx.fillStyle = rgba(tint, fill);
      ctx.fill();
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = rgba(tint, stroke);
      ctx.stroke();
    }

    /* --------------------------------------------- the fast land path ---
       d3 clips every polygon against the horizon on every frame, and that
       clipping — not the drawing — was most of the frame: ~13ms of script per
       frame for the land alone, before a single pixel was filled. But nearly
       every polygon is plainly on one side of the horizon or the other:

         wholly behind   skip it
         wholly in front project it directly — a few multiply-adds a point,
                         no trig, since compile() stored each point as a
                         unit vector
         across the edge hand it to d3, which clips it properly

       One dot product per polygon decides which, against the bounding cap
       compile() measured. Only the handful of polygons actually crossing the
       horizon ever pay for clipping. */

    function setFrame(cx, cy, r) {
      var l = view.lon * RAD, p = view.lat * RAD;
      F.cx = cx; F.cy = cy; F.r = r;
      F.cl = Math.cos(l); F.sl = Math.sin(l);
      F.cp = Math.cos(p); F.sp = Math.sin(p);
      F.v0 = F.cp * F.cl; F.v1 = F.cp * F.sl; F.v2 = F.sp;   // the view direction
    }

    function trace(shape) {
      for (var i = 0; i < shape.length; i++) {
        var poly = shape[i];
        // cos of the angle between the polygon's cap centre and the view.
        var dot = poly.v[0] * F.v0 + poly.v[1] * F.v1 + poly.v[2] * F.v2;
        if (poly.big || (dot > -poly.sinR && dot <= poly.sinR)) { path(poly.geo); continue; }
        if (dot <= -poly.sinR) continue;
        for (var j = 0; j < poly.rings.length; j++) traceRing(poly.rings[j]);
      }
    }

    /* The orthographic projection written out, for points known to be on the
       near side. Same maths as d3's, so the two kinds of polygon meet
       seamlessly:  x = cosφ·sin(λ−λ0),  y = cosφ0·sinφ − sinφ0·cosφ·cos(λ−λ0),
       expanded with the angle-difference identities over the stored vector.

       Deliberately no closePath(). Profiling put 38% of every frame inside
       it — Chrome does real work per closed subpath, and the land has ~1,400
       of them — while the rings already end on their first point and fill()
       closes each subpath by itself. */
    function traceRing(a) {
      for (var k = 0, n = a.length; k < n; k += 3) {
        var X = a[k], Y = a[k + 1], Z = a[k + 2];
        var x = F.cx + F.r * (Y * F.cl - X * F.sl);
        var y = F.cy - F.r * (F.cp * Z - F.sp * (X * F.cl + Y * F.sl));
        if (k) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
    }

    function placePins() {
      var centre = [view.lon, view.lat];
      pins.forEach(function (p) {
        /* Fade out over the last few degrees before the horizon rather than
           popping out of existence at the edge. Independent of the map's own
           fade-in: the pins are drawn before it arrives, and tying them to it
           would blink them off at the moment it does. */
        var opacity = clamp((Math.PI / 2 - d3.geoDistance(p.at, centre)) / 0.12, 0, 1);
        if (opacity > 0) {
          var xy = projection(p.at);
          p.el.style.transform = 'translate3d(' + xy[0].toFixed(1) + 'px,' + xy[1].toFixed(1) + 'px,0)';
        }
        if (opacity !== p.opacity) { p.el.style.opacity = opacity; p.opacity = opacity; }
        var labelled = p.country === active;
        if (labelled !== p.labelled) { p.el.classList.toggle('is-labelled', labelled); p.labelled = labelled; }
      });
    }

    function updateReadout() {
      if (!readout) return;
      var lat = view.lat, lon = wrap(view.lon);
      var text = Math.abs(lat).toFixed(2) + '°' + (lat >= 0 ? 'N' : 'S') + '  ' +
                 Math.abs(lon).toFixed(2) + '°' + (lon >= 0 ? 'E' : 'W');
      if (text !== lastReadout) { readout.textContent = text; lastReadout = text; }
    }

    /* ---------------------------------------------------------- loop ---
       One requestAnimationFrame loop that runs only while something is
       moving, and stops itself as soon as nothing is. */

    function kick() { if (!raf) raf = requestAnimationFrame(tick); }

    function tick(t) {
      raf = 0;
      var dt = last ? Math.min(t - last, 64) : 16;
      last = t;

      if (world && fade < 1) fade = Math.min(1, fade + dt / 450);

      if (flight) {
        stepFlight(t);
      } else if (inertia) {
        view.lon += inertia * dt;
        inertia *= Math.exp(-dt / 420);
        if (Math.abs(inertia) < 0.002) inertia = 0;
      } else if (drifting(t)) {
        view.lon -= CONFIG.SPIN_DEG_PER_S * dt / 1000;
        // Ease back to the resting tilt and size while drifting.
        var k = 1 - Math.exp(-dt / 900);
        view.lat += (CONFIG.REST_LAT - view.lat) * k;
        view.zoom += (1 - view.zoom) * k;
      }
      view.lon = wrap(view.lon);

      draw();
      // The globe may have turned under a still pointer.
      if (pointer && !drag && world) runHover();

      if (moving(t)) kick();
      else last = 0;
    }

    function drifting(t) {
      return !active && !reduced && visible && !drag && !hovered && !focused && t >= resumeAt;
    }

    function moving(t) {
      return (world && fade < 1) || !!flight || !!inertia || drifting(t);
    }

    /* Drift resumes RESUME_MS after the last interaction. */
    function holdDrift() {
      resumeAt = performance.now() + CONFIG.RESUME_MS;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(kick, CONFIG.RESUME_MS + 20);
    }

    /* -------------------------------------------------------- flights --- */

    function flyTo(to, ms) {
      var from = { lon: view.lon, lat: view.lat, zoom: view.zoom };
      var dist = d3.geoDistance([from.lon, from.lat], [to.lon, to.lat]) * 180 / Math.PI;
      var dur = ms != null ? ms : clamp(CONFIG.FLY_MS[0] + dist * 10, CONFIG.FLY_MS[0], CONFIG.FLY_MS[1]);
      if (reduced || !visible) dur = 0;
      flight = {
        from: from, to: to, dist: dist, dur: dur, start: performance.now(),
        path: d3.geoInterpolate([from.lon, from.lat], [to.lon, to.lat])
      };
      inertia = 0;
      kick();
    }

    function stepFlight(t) {
      var f = flight;
      var p = f.dur ? clamp((t - f.start) / f.dur, 0, 1) : 1;
      var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;   // cubic in-out

      // Along the great circle, the way a plane would fly it.
      var at = f.path(e);
      view.lon = at[0];
      view.lat = at[1];

      // Long hops climb out a little and come back down.
      var zoom = f.from.zoom + (f.to.zoom - f.from.zoom) * e;
      var lift = CONFIG.LIFT * Math.min(1, f.dist / 90) * Math.sin(Math.PI * e);
      view.zoom = zoom * (1 - lift);

      if (p >= 1) {
        view.lon = f.to.lon;
        view.lat = f.to.lat;
        view.zoom = f.to.zoom;
        flight = null;
      }
    }

    /* Where to point the globe for a country: the middle of its largest
       landmass (so the USA means the lower 48, not a point dragged north by
       Alaska), nudged toward the cities pinned in it, and zoomed so the
       outline fills about FOCUS_SPAN of the globe. */
    function targetFor(c) {
      var cityPoints = (c.cities || []).filter(pinned).map(function (city) { return [city.lon, city.lat]; });
      var f = world && world.codes[c.code.toUpperCase()];

      if (!f) {
        // No outline (unknown code, or the map isn't here yet): aim at the pins.
        if (!cityPoints.length) return null;
        var mid = d3.geoCentroid({ type: 'MultiPoint', coordinates: cityPoints });
        return { lon: mid[0], lat: mid[1], zoom: CONFIG.ZOOM_MAX * 0.7 };
      }

      var main = largestPolygon(f);
      var centre = d3.geoCentroid(main);
      var points = [centre, centre].concat(cityPoints);   // the land counts double
      var aim = d3.geoCentroid({ type: 'MultiPoint', coordinates: points });

      var reach = 0;
      d3.geoStream(main, {
        point: function (x, y) { reach = Math.max(reach, d3.geoDistance(aim, [x, y])); },
        lineStart: noop, lineEnd: noop, polygonStart: noop, polygonEnd: noop, sphere: noop
      });
      var zoom = clamp(CONFIG.FOCUS_SPAN / Math.sin(Math.min(reach, Math.PI / 2)), 1, CONFIG.ZOOM_MAX);
      return { lon: aim[0], lat: aim[1], zoom: zoom };
    }

    function focus(c) {
      active = c;
      var to = targetFor(c);
      if (to) flyTo(to);
      else kick();
    }

    function release() {
      active = null;
      resumeAt = 0;
      // Settle back to the resting tilt and size, then the drift takes over.
      flyTo({ lon: view.lon, lat: CONFIG.REST_LAT, zoom: 1 }, 900);
    }

    /* -------------------------------------------------------- hovering --- */

    function featureAt(x, y) {
      if (!world) return null;
      var dx = x - W / 2, dy = y - H / 2, r = R * view.zoom;
      if (dx * dx + dy * dy > r * r) return null;
      var p = projection.invert([x, y]);
      if (!p || !isFinite(p[0]) || !isFinite(p[1])) return null;
      for (var i = 0; i < world.hit.length; i++) {
        var h = world.hit[i];
        if (inBounds(h.bounds, p) && d3.geoContains(h.f, p)) return h.f;
      }
      return null;
    }

    function inBounds(b, p) {
      if (p[1] < b[0][1] || p[1] > b[1][1]) return false;
      // Bounds that cross the antimeridian come back with west > east.
      return b[0][0] <= b[1][0]
        ? p[0] >= b[0][0] && p[0] <= b[1][0]
        : p[0] >= b[0][0] || p[0] <= b[1][0];
    }

    function entryFor(f) { return f && f.properties.a2 ? byCode[f.properties.a2] : null; }

    function nameOf(f) {
      var entry = entryFor(f);
      if (entry) return entry.name;
      if (regionNames && f.properties.a2) {
        try { return regionNames.of(f.properties.a2); } catch (e) { /* fall through */ }
      }
      return f.properties.name;
    }

    function runHover() {
      var f = featureAt(pointer.x, pointer.y);
      if (f !== hover) {
        hover = f;
        box.classList.toggle('is-over-place', !!entryFor(f));
        if (!raf) draw();
      }
      showTip(f, pointer.x, pointer.y);
    }

    function showTip(f, x, y) {
      if (!f) { tip.hidden = true; return; }
      var entry = entryFor(f);
      tipName.textContent = nameOf(f);
      if (entry) {
        var names = (entry.cities || []).map(function (c) { return c.name; });
        var shown = names.slice(0, 3).join(', ') + (names.length > 3 ? ' +' + (names.length - 3) : '');
        tipSub.textContent = (entry.home ? 'Home' : 'Visited') + (shown ? ' · ' + shown : '');
        tip.className = 'trv-tip ' + (entry.home ? 'trv-tip--home' : 'trv-tip--visited');
      } else {
        tipSub.textContent = 'Not yet';
        tip.className = 'trv-tip';
      }
      tip.hidden = false;
      var tx = x + 16, ty = y + 18;
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      if (tx + tw > W - 8) tx = x - tw - 12;
      if (ty + th > H - 8) ty = y - th - 14;
      tip.style.transform = 'translate(' + Math.max(8, tx) + 'px,' + Math.max(8, ty) + 'px)';
    }

    /* ------------------------------------------------------- dragging --- */

    function local(e) {
      var rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    canvas.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = {
        id: e.pointerId, x: e.clientX, y: e.clientY,
        lon: view.lon, lat: view.lat, moved: false,
        lastX: e.clientX, lastT: performance.now(), v: 0
      };
    });

    canvas.addEventListener('pointermove', function (e) {
      if (drag && e.pointerId === drag.id) {
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved) {
          if (Math.abs(dx) + Math.abs(dy) < 5) return;   // still a click
          drag.moved = true;
          flight = null;
          inertia = 0;
          try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* already gone */ }
          box.classList.add('is-dragging', 'is-touched');
          tip.hidden = true;
        }
        // Degrees per pixel at the centre of the globe, so the land under the
        // pointer stays under it.
        var k = 180 / Math.PI / (R * view.zoom);
        view.lon = drag.lon - dx * k;
        view.lat = clamp(drag.lat + dy * k, -70, 70);

        var now = performance.now(), step = now - drag.lastT;
        if (step > 0) drag.v = 0.7 * (-(e.clientX - drag.lastX) * k / step) + 0.3 * drag.v;
        drag.lastX = e.clientX;
        drag.lastT = now;

        holdDrift();
        kick();
        return;
      }
      if (e.pointerType === 'mouse') {
        pointer = local(e);
        runHover();
      }
    });

    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag;
      drag = null;
      if (d.moved) {
        box.classList.remove('is-dragging');
        // A flick keeps going; a drag that stopped before letting go doesn't.
        if (!reduced && performance.now() - d.lastT < 80) inertia = clamp(d.v, -0.6, 0.6);
        holdDrift();
        kick();
      } else if (e.type === 'pointerup') {
        tap(local(e), e.pointerType);
      }
    }

    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    canvas.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'mouse') { hovered = true; }
    });

    canvas.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      hovered = false;
      pointer = null;
      tip.hidden = true;
      box.classList.remove('is-over-place');
      if (hover) { hover = null; if (!raf) draw(); }
      kick();
    });

    var tipTimer = 0;
    function tap(at, type) {
      var f = featureAt(at.x, at.y);
      var entry = entryFor(f);
      if (type !== 'mouse') {
        // No hover on touch, so a tap is how you find out what a country is.
        showTip(f, at.x, at.y);
        clearTimeout(tipTimer);
        tipTimer = setTimeout(function () { tip.hidden = true; }, 2200);
      }
      if (entry) onPick(entry.code.toUpperCase());
    }

    /* ------------------------------------------------------- keyboard --- */

    box.addEventListener('keydown', function (e) {
      var step = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, 12], ArrowDown: [0, -12] }[e.key];
      if (!step) return;
      e.preventDefault();
      box.classList.add('is-touched');
      flyTo({ lon: view.lon + step[0], lat: clamp(view.lat + step[1], -70, 70), zoom: view.zoom }, 450);
      holdDrift();
    });

    /* Keyboard focus holds the drift, as it does on the coverflows. A mouse
       click focuses the globe too, but that shouldn't freeze it until the
       next click somewhere else — so only :focus-visible counts. */
    box.addEventListener('focus', function () {
      try { focused = box.matches(':focus-visible'); } catch (e) { focused = false; }
    });
    box.addEventListener('blur', function () {
      if (focused) holdDrift();
      focused = false;
    });

    /* --------------------------------------------------------- legend --- */

    function fillLegend() {
      if (!legend) return;
      var hasHome = countries.some(function (c) { return c.home; });
      var hasVisited = countries.some(function (c) { return !c.home; });
      var hasNow = countries.some(function (c) {
        return (c.cities || []).some(function (city) { return city.now && pinned(city); });
      });
      [[hasVisited, 'visited', 'Visited'], [hasHome, 'home', 'Home'], [hasNow, 'now', 'Here now']]
        .forEach(function (row) {
          if (!row[0]) return;
          var li = el('li');
          li.appendChild(el('span', 'trv-swatch trv-swatch--' + row[1]));
          li.appendChild(document.createTextNode(row[2]));
          legend.appendChild(li);
        });
    }

    kick();
    return { focus: focus, release: release };
  }

  /* ------------------------------------------------------ geo helpers --- */

  var RAD = Math.PI / 180;

  /* Splits any GeoJSON into its polygons and readies each one for trace():
     every point as a unit vector (x, y, z) on the sphere, plus a bounding cap
     — the polygon's centre and how far its furthest point reaches from it. */
  function compile(geo) {
    var polygons = [];
    (function walk(g) {
      if (!g) return;
      if (g.type === 'FeatureCollection') g.features.forEach(walk);
      else if (g.type === 'Feature') walk(g.geometry);
      else if (g.type === 'GeometryCollection') g.geometries.forEach(walk);
      else if (g.type === 'Polygon') polygons.push(g.coordinates);
      else if (g.type === 'MultiPolygon') g.coordinates.forEach(function (c) { polygons.push(c); });
    }(geo));

    return polygons.map(function (coords) {
      var poly = { type: 'Polygon', coordinates: coords };
      var centre = d3.geoCentroid(poly);
      var reach = 0;
      var rings = coords.map(function (ring) {
        var a = new Float32Array(ring.length * 3);
        ring.forEach(function (pt, i) {
          var l = pt[0] * RAD, p = pt[1] * RAD, cp = Math.cos(p);
          a[i * 3] = cp * Math.cos(l);
          a[i * 3 + 1] = cp * Math.sin(l);
          a[i * 3 + 2] = Math.sin(p);
          reach = Math.max(reach, d3.geoDistance(centre, pt));
        });
        return a;
      });
      /* A little slack: an edge between two points can bow slightly further
         out than either end. */
      reach += 0.02;
      var l = centre[0] * RAD, p = centre[1] * RAD;
      return {
        geo: poly,
        rings: rings,
        v: [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)],
        sinR: Math.sin(Math.min(reach, Math.PI / 2)),
        // A cap past a quarter-turn has no clean in-front test; always clip it.
        big: reach >= Math.PI / 2
      };
    });
  }

  function noop() {}

  function wrap(lon) { return ((lon + 540) % 360) - 180; }

  function meanLongitude(points) {
    if (!points.length) return 0;
    var x = 0, y = 0;
    points.forEach(function (p) {
      var l = p[0] * Math.PI / 180;
      x += Math.cos(l);
      y += Math.sin(l);
    });
    return Math.atan2(y, x) * 180 / Math.PI;
  }

  function largestPolygon(f) {
    var g = f.geometry;
    if (!g || g.type !== 'MultiPolygon') return f;
    var best = null, bestArea = -1;
    g.coordinates.forEach(function (coords) {
      var poly = { type: 'Polygon', coordinates: coords };
      var a = d3.geoArea(poly);
      if (a > bestArea) { bestArea = a; best = poly; }
    });
    return best;
  }

  function rgb(hex) {
    hex = (hex || '').trim().replace('#', '');
    if (hex.length === 3) hex = hex.replace(/./g, '$&$&');
    if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
    var n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
}());
