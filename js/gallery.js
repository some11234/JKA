/* ==========================================================================
   gallery.js — builds all three gallery views from GALLERY (gallery-data.js).

   The markup is generated rather than hand-written so adding a photo is a
   one-line data edit. Each page tells this file what to build with a single
   data attribute on <main>:

     <main class="gal" data-gallery="overview">
     <main class="gal" data-gallery="collection" data-city="london">

   The lightbox is shared by both and is created once, lazily, the first time
   a photo is opened.
   ========================================================================== */

(function () {
  'use strict';

  if (typeof GALLERY === 'undefined') return;

  var root = document.documentElement;
  var main = document.querySelector('[data-gallery]');
  if (!main) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Photos are addressed by id, not by path, so the two derivative sizes stay
     an implementation detail of this one place. */
  /* Derivatives live under web/ so assets/gallery/Originals stays untouched. */
  function thumbSrc(p) { return '/assets/gallery/web/' + p.file + '-thumb.webp'; }
  function midSrc(p)   { return '/assets/gallery/web/' + p.file + '-mid.webp'; }
  function largeSrc(p) { return '/assets/gallery/web/' + p.file + '-large.webp'; }

  /* Not every collection is a city — "Nature & Creatures" and "Nighttime" are
     themes — so nothing here assumes a place. */
  function bySlug(slug) {
    for (var i = 0; i < GALLERY.collections.length; i++) {
      if (GALLERY.collections[i].slug === slug) return GALLERY.collections[i];
    }
    return null;
  }

  var GLASS_SVG =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<circle cx="10.5" cy="10.5" r="6.75" stroke="#fff" stroke-width="1.6"/>' +
    '<path d="M15.4 15.4 21 21" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>' +
    '</svg>';

  /* ------------------------------------------------------------- tiles --- */

  /* A tile is a <button>, not a link: it opens an overlay rather than
     navigating, so it must be a button for keyboards and screen readers. */
  function buildTile(photo, city, index, withCaption, fitViewport) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gal-tile';
    btn.dataset.city = city.slug;
    btn.dataset.index = index;

    var label = photo.caption && !photo.placeholder
      ? photo.caption + ' — ' + city.name
      : 'Photo ' + (index + 1) + ' — ' + city.name;
    btn.setAttribute('aria-label', 'Open ' + label);

    var frame = document.createElement('span');
    frame.className = 'gal-tile__frame';

    /* Collection pages keep each photo's real shape — the mix of portrait and
       landscape is what gives those pages their variance, and the masonry
       columns are built to pack it.

       The landing rows do NOT: there every tile is the same portrait box (set
       in gallery.css) and a landscape photo is cropped to fill it, so one wide
       frame cannot break the run of a row. Either way the lightbox shows the
       photo whole, at its true proportions. */
    if (fitViewport) frame.style.aspectRatio = photo.w + ' / ' + photo.h;



    var img = document.createElement('img');
    img.src = thumbSrc(photo);
    /* Collection frames render far larger than overview tiles, so let the
       browser pick: the 900px file for a row tile, the 2000px one full-bleed. */
    img.srcset = thumbSrc(photo) + ' 900w, ' + midSrc(photo) + ' 1400w, ' +
                 largeSrc(photo) + ' 2000w';
    /* Collection tiles are a column of a 2-3 wide grid, so roughly a third of
       the container; overview tiles are the fixed --gal-tile-w. Getting these
       right is what stops the grid pulling 2000px files it cannot show. */
    img.sizes = fitViewport
      ? '(max-width: 620px) 92vw, (max-width: 1100px) 46vw, min(31vw, 540px)'
      : '(max-width: 620px) 74vw, clamp(220px, 24vw, 340px)';
    img.alt = photo.alt || '';
    img.width = photo.w;
    img.height = photo.h;
    img.loading = 'lazy';
    img.decoding = 'async';

    var glass = document.createElement('span');
    glass.className = 'gal-tile__glass';
    glass.innerHTML = GLASS_SVG;

    frame.appendChild(img);
    frame.appendChild(glass);
    btn.appendChild(frame);

    if (withCaption) {
      var cap = document.createElement('span');
      cap.className = 'gal-tile__cap';
      cap.textContent = photo.caption || '';
      btn.appendChild(cap);
    }
    return btn;
  }

  /* ---------------------------------------------------------- overview --- */

  function buildOverview() {
    var frag = document.createDocumentFragment();

    GALLERY.collections.forEach(function (city) {
      var section = document.createElement('section');
      section.className = 'gal-row';
      section.setAttribute('aria-labelledby', 'row-' + city.slug);

      var head = document.createElement('div');
      head.className = 'gal-row__head';

      var link = document.createElement('a');
      link.className = 'gal-row__link';
      link.id = 'row-' + city.slug;
      link.href = '/gallery/' + city.slug + '/';
      link.innerHTML = city.name + ' <span class="chev" aria-hidden="true">&rsaquo;</span>';
      head.appendChild(link);

      var count = document.createElement('span');
      count.className = 'gal-row__count';
      count.textContent = city.photos.length + (city.photos.length === 1 ? ' photo' : ' photos');
      head.appendChild(count);

      var scroller = document.createElement('div');
      scroller.className = 'gal-scroller';
      scroller.setAttribute('role', 'group');
      scroller.setAttribute('aria-label', city.name + ' photos');
      /* Deliberately NOT tabbable. It used to carry tabindex="0" so keyboards
         could scroll it, but every tile inside is already a <button>, so tabbing
         reaches all of them and the browser scrolls each into view — the
         tabindex bought nothing and cost a bug: focusing a full-bleed scroller
         drew the global accent focus ring, whose left and right edges fall off
         screen, leaving two green lines across the page. */

      city.photos.forEach(function (p, i) {
        scroller.appendChild(buildTile(p, city, i, true));
      });

      section.appendChild(head);
      section.appendChild(scroller);
      frag.appendChild(section);
    });

    main.appendChild(frag);
  }

  /* -------------------------------------------------------- collection --- */

  function buildCollection(city) {
    var stack = document.createElement('div');
    stack.className = 'gal-stack';
    city.photos.forEach(function (p, i) {
      stack.appendChild(buildTile(p, city, i, false, true)); // no captions, fits the screen
    });
    main.querySelector('.gal-collection').appendChild(stack);
  }

  /* ---------------------------------------------------------- lightbox --- */

  var lb = null, lbState = { city: null, index: 0, lastFocus: null, coord: null };

  function buildLightbox() {
    lb = document.createElement('div');
    lb.className = 'gal-lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Photo viewer');
    lb.hidden = true;

    lb.innerHTML =
      '<div class="gal-lb__bg" data-lb-bg aria-hidden="true"></div>' +
      '<div class="gal-lb__veil" aria-hidden="true"></div>' +

      '<button class="gal-lb__btn gal-lb__close" type="button" data-lb-close>' +
        'Close</button>' +

      /* The nav buttons live INSIDE the stage so they flank the photo rather
         than the window — against the window they landed on the EXIF panel. */
      '<div class="gal-lb__stage">' +
        '<button class="gal-lb__btn gal-lb__nav gal-lb__nav--prev" type="button" ' +
          'data-lb-prev aria-label="Previous photo">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5 8 12l7 7" ' +
          'stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<img class="gal-lb__img" data-lb-img alt="">' +
        '<button class="gal-lb__btn gal-lb__nav gal-lb__nav--next" type="button" ' +
          'data-lb-next aria-label="Next photo">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" ' +
          'stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
      '</div>' +

      '<div class="gal-lb__side">' +
        '<div class="gal-panel">' +
          '<p class="gal-lb__title" data-lb-title></p>' +
          '<p class="gal-lb__place" data-lb-city></p>' +
        '</div>' +
        '<div class="gal-panel" data-lb-exif-panel>' +
          '<p class="gal-panel__label">Camera</p>' +
          '<dl class="gal-exif" data-lb-exif></dl>' +
        '</div>' +
        '<a class="gal-panel gal-map" data-lb-map target="_blank" rel="noopener">' +
          '<span class="gal-map__canvas">' +
            '<span class="gal-map__tiles" data-lb-tiles></span>' +
            '<span class="gal-map__pin"></span>' +
            '<span class="gal-map__attr">&copy; OpenStreetMap</span>' +
          '</span>' +
          '<span class="gal-map__foot">' +
            '<span class="gal-map__place" data-lb-map-place></span>' +
            '<span class="gal-map__coord" data-lb-map-coord></span>' +
          '</span>' +
        '</a>' +
      '</div>' +

      '<p class="gal-lb__counter" data-lb-counter></p>';

    document.body.appendChild(lb);

    lb.querySelector('[data-lb-close]').addEventListener('click', closeLb);
    lb.querySelector('[data-lb-prev]').addEventListener('click', function () { step(-1); });
    lb.querySelector('[data-lb-next]').addEventListener('click', function () { step(1); });

    /* Click the backdrop (but not the photo or the panels) to dismiss. */
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('gal-lb__veil') ||
          e.target.classList.contains('gal-lb__bg') ||
          e.target.classList.contains('gal-lb__stage')) closeLb();
    });
  }

  /* ---------------------------------------------------------- the map ---
     A real OpenStreetMap view, drawn as plain <img> tiles rather than by
     pulling in Leaflet — this is one pin in a small panel, and a 55KB mapping
     library plus its CSS is a poor trade for pan/zoom nobody asked for. The
     panel links out to openstreetmap.org for that.

     Tiles come straight from openstreetmap.org. CARTO's ready-made dark style
     was the obvious choice but they now stamp "API KEY REQUIRED" across every
     unkeyed tile, so the standard basemap is inverted to dark here instead (see
     the filter in gallery.css). Attribution is required and is printed in the
     corner. */
  /* Tiles are fetched one zoom level in and drawn at half size, which doubles
     the effective pixel density — openstreetmap.org serves 256px tiles only,
     and at 1:1 they look soft on a retina screen. Same map area either way. */
  var TILE = 128, MAP_ZOOM = 16;

  function lonToX(lon, z) { return (lon + 180) / 360 * Math.pow(2, z); }
  function latToY(lat, z) {
    var r = lat * Math.PI / 180;
    return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z);
  }

  function drawMap(host, lat, lon) {
    host.innerHTML = '';
    var box = host.getBoundingClientRect();
    var w = Math.round(box.width) || 300, h = Math.round(box.height) || 156;

    var cx = lonToX(lon, MAP_ZOOM), cy = latToY(lat, MAP_ZOOM);
    /* Pixel position of the centre within its own tile, so the pin lands on the
       exact coordinate rather than on a tile boundary. */
    var offX = (cx - Math.floor(cx)) * TILE, offY = (cy - Math.floor(cy)) * TILE;
    var cols = Math.ceil(w / TILE) + 2, rows = Math.ceil(h / TILE) + 2;
    var startX = Math.floor(cx) - Math.floor(cols / 2);
    var startY = Math.floor(cy) - Math.floor(rows / 2);
    var left = w / 2 - offX - Math.floor(cols / 2) * TILE;
    var top  = h / 2 - offY - Math.floor(rows / 2) * TILE;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var img = document.createElement('img');
        img.className = 'gal-map__tile';
        img.src = 'https://tile.openstreetmap.org/' + MAP_ZOOM + '/' +
                  (startX + c) + '/' + (startY + r) + '.png';
        img.alt = '';
        /* Deliberately NOT lazy: there are a dozen small tiles and they are
           wanted the instant the panel appears. Inside the side strip, which
           scrolls horizontally on narrow screens, lazy tiles never load at all. */
        img.decoding = 'async';
        img.style.left = (left + c * TILE) + 'px';
        img.style.top  = (top + r * TILE) + 'px';
        host.appendChild(img);
      }
    }
  }

  function render() {
    var city = lbState.city;
    var photo = city.photos[lbState.index];
    var q = function (sel) { return lb.querySelector(sel); };

    var src = largeSrc(photo);
    var img = q('[data-lb-img]');
    img.src = src;
    img.alt = photo.alt || photo.caption || '';
    q('[data-lb-bg]').style.backgroundImage = 'url("' + src + '")';

    q('[data-lb-title]').textContent = photo.caption || city.name;
    /* The collection, not the place — the place is already the caption above
       and the label on the map panel below, and printing it three times reads
       like a bug. */
    q('[data-lb-city]').textContent = city.name;

    /* EXIF is optional — a placeholder tile has none, so hide the panel
       rather than showing a box of blank rows. */
    var dl = q('[data-lb-exif]');
    var panel = q('[data-lb-exif-panel]');
    dl.innerHTML = '';
    var ex = photo.exif;
    if (ex) {
      panel.hidden = false;
      [['Camera', ex.camera], ['Lens', ex.lens], ['Focal length', ex.focal],
       ['Aperture', ex.aperture], ['Shutter', ex.shutter], ['ISO', ex.iso],
       ['Taken', ex.date]].forEach(function (row) {
        if (!row[1]) return;
        var dt = document.createElement('dt'); dt.textContent = row[0];
        var dd = document.createElement('dd'); dd.textContent = row[1];
        dl.appendChild(dt); dl.appendChild(dd);
      });
    } else {
      panel.hidden = true;
    }

    /* Per-photo coords win; otherwise the city's. */
    var c = photo.coords || city.coords;   /* real GPS from the file */
    var map = q('[data-lb-map]');
    if (c) {
      map.hidden = false;
      map.href = 'https://www.openstreetmap.org/?mlat=' + c.lat +
                 '&mlon=' + c.lon + '#map=16/' + c.lat + '/' + c.lon;
      q('[data-lb-map-place]').textContent = c.place || city.name;
      q('[data-lb-map-coord]').textContent =
        Math.abs(c.lat).toFixed(4) + (c.lat >= 0 ? '°N ' : '°S ') +
        Math.abs(c.lon).toFixed(4) + (c.lon >= 0 ? '°E' : '°W');
      map.setAttribute('aria-label',
        'Open ' + (c.place || city.name) + ' in OpenStreetMap');
      /* Drawn now with a sane fallback size, then redrawn by openLb once the
         panel is actually on screen and can be measured. Deferring this to
         requestAnimationFrame alone was fragile: render() runs while the
         overlay is still hidden, and a backgrounded tab never fires the frame. */
      lbState.coord = c;
      drawMap(q('[data-lb-tiles]'), c.lat, c.lon);
    } else {
      map.hidden = true;
      lbState.coord = null;
    }

    q('[data-lb-counter]').textContent =
      (lbState.index + 1) + ' / ' + city.photos.length;

    /* On a phone the info panel scrolls. Stepping to the next photo while it is
       scrolled down would otherwise open that photo half way through its EXIF. */
    var side = q('.gal-lb__side');
    if (side) side.scrollTop = 0;

    /* Single-photo collections shouldn't offer navigation. */
    var only = city.photos.length < 2;
    q('[data-lb-prev]').disabled = only;
    q('[data-lb-next]').disabled = only;

    preload(lbState.index + 1);
    preload(lbState.index - 1);
  }

  function preload(i) {
    var list = lbState.city.photos;
    var p = list[(i + list.length) % list.length];
    if (p) { var im = new Image(); im.src = largeSrc(p); }
  }

  function step(dir) {
    var n = lbState.city.photos.length;
    lbState.index = (lbState.index + dir + n) % n;   /* wraps both ways */
    render();
  }

  function openLb(citySlug, index) {
    var city = bySlug(citySlug);
    if (!city) return;
    if (!lb) buildLightbox();

    lbState.city = city;
    lbState.index = index;
    lbState.lastFocus = document.activeElement;

    render();
    lb.hidden = false;
    /* Now that it has a box, redraw the map at its true size. */
    if (lbState.coord) {
      drawMap(lb.querySelector('[data-lb-tiles]'), lbState.coord.lat, lbState.coord.lon);
    }
    /* One frame between unhiding and the class so the opacity transition runs. */
    requestAnimationFrame(function () { lb.classList.add('is-open'); });
    root.classList.add('gal-lb-open');
    document.addEventListener('keydown', onKey);
    lb.querySelector('[data-lb-close]').focus({ preventScroll: true });
  }

  function closeLb() {
    if (!lb) return;
    lb.classList.remove('is-open');
    root.classList.remove('gal-lb-open');
    document.removeEventListener('keydown', onKey);

    var done = function () { lb.hidden = true; };
    if (reduced) done();
    else setTimeout(done, 260);            /* matches the CSS transition */

    if (lbState.lastFocus && lbState.lastFocus.focus) {
      lbState.lastFocus.focus({ preventScroll: true });
    }
  }

  function onKey(e) {
    if (e.key === 'Escape')     { e.preventDefault(); closeLb(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1); }
    else if (e.key === 'Home')  { e.preventDefault(); lbState.index = 0; render(); }
    else if (e.key === 'End')   { e.preventDefault(); lbState.index = lbState.city.photos.length - 1; render(); }
    else if (e.key === 'Tab')   { trapFocus(e); }
  }

  /* An aria-modal dialog must not leak focus to the page behind it. */
  function trapFocus(e) {
    var f = lb.querySelectorAll('button:not([disabled]), a[href]');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* One delegated listener covers every tile on either page. */
  main.addEventListener('click', function (e) {
    var tile = e.target.closest ? e.target.closest('.gal-tile') : null;
    if (!tile) return;
    openLb(tile.dataset.city, parseInt(tile.dataset.index, 10) || 0);
  });

  /* ------------------------------------------------------------- init --- */

  /* Copy lives in the data file so there is exactly one place to write it.
     A string is one paragraph; an array is several. textContent, never
     innerHTML — this is prose and must not be able to inject markup. */
  function fill(sel, copy) {
    var el = document.querySelector(sel);
    if (!el || !copy) return;
    var paras = Object.prototype.toString.call(copy) === '[object Array]' ? copy : [copy];
    el.innerHTML = '';
    paras.forEach(function (text) {
      if (!text) return;
      var para = document.createElement('p');
      para.textContent = text;
      el.appendChild(para);
    });
  }

  if (main.dataset.gallery === 'overview') {
    fill('[data-gallery-intro]', GALLERY.intro);
    buildOverview();
  } else if (main.dataset.gallery === 'collection') {
    var city = bySlug(main.dataset.city);
    if (city) {
      fill('[data-gallery-blurb]', city.blurb);
      buildCollection(city);
    }
  }
}());
