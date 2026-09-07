/* ==========================================================================
   main.js — every magic number, then all the choreography.

   Two driver classes, kept strictly separate:

     SCRUBBED  progress bound to scroll position, reversible, no own duration.
               → annotation wipe, London shrink, card pop-out, title slides,
                 the headshot "coming loose" peek.

     TRIGGERED plays once on crossing a threshold, on its own clock. Consumes
               ZERO scroll distance.
               → strip secondary reveal, the fall, the About stagger.
   ========================================================================== */

/* --------------------------------------------------------------- CONFIG ---
   Tune the site by editing this object. Nothing below needs touching.
   -------------------------------------------------------------------------- */

var CONFIG = {

  /* -- the pinned journey ------------------------------------------------ */
  /* Sized to the beats, with no slack. Every fraction in T below is a fraction
     of THIS, so the two must be retuned together: the beats' real scroll cost
     is fraction x JOURNEY_SCROLL_VH. */
  JOURNEY_SCROLL_VH: 118,   // how many viewport-heights the pin lasts
  SCRUB: 0.6,               // scrub smoothing, in seconds of catch-up

  /* Which band of london-full.webp shows at full-bleed. This is THE knob for
     beat 1 — the sky / flag / plane framing. Re-tune it once the real
     london-full.webp exists; nothing else about beat 1 needs to change. */
  ORIGIN_Y: 0.38,
  S0_OVERSHOOT: 1.02,       // safety margin on the full-bleed scale

  /* THE ARROW POINTS AT THE PLANE'S RIGHT WINGTIP, and these three numbers are
     what aim it, so they are derived rather than eyeballed.

     THE ARROWHEAD POINTS STRAIGHT DOWN. Measured off a 2880x1148 render by
     fitting the centroid of its taper over the last 6% of its height: the
     centroid holds at x 0.957 while y descends, giving 90.9 degrees below
     horizontal — a slope of -0.015 x per y. So "aim at X" means put the tip
     DIRECTLY ABOVE X with a small vertical gap. It does NOT mean sitting the
     tip beside X, which is how this was first set up for the left wingtip; a
     sideways standoff aims the arrow down past the plane into open sky.

       - the plane spans x 76.95-81.54%, y 38.36-39.56% of the frame. Measured,
         not guessed: london-plane.webp minus a 24px blur of itself isolates it
         from the sky gradient, and the crop box maps to the frame through
         .card-plane's own left/top/width/height. Its RIGHTMOST point is the
         wingtip at x 81.54%, whose upper edge sits at y 38.95%;
       - inside annotation-ba266.svg the tip is at (0.9569, 0.9791) of the
         720x287 artwork box — the rightmost ink on its lowest row;
       - the card is 2:3, so a box W% of the card's WIDTH is W x 287/720 / 1.5
         = W x 0.2657 of its HEIGHT.

     Which gives  tipX = left + 0.9569W   and   tipY = top + 0.2602W.
     Solving those for a tip directly over the wingtip and 0.30% of card height
     clear of it, at (81.54%, 38.65%), with the artwork 21% wide:

       left = 81.54 - 0.9569(21) = 61.45   top = 38.65 - 0.2602(21) = 33.19

     Re-aim by changing the target above and redoing that sum. The box's right
     edge (82.45%) overlaps the plane's crop box, which is fine and intended —
     only the arrowhead's own pixels are opaque out there, and .annotation sits
     above .card-plane in the z-order. Nothing else in the artwork reaches low
     enough to touch the plane: below y 0.92 of the box the only ink is the
     arrowhead, between x 0.94 and 0.98, which clears the tail fin entirely. */
  ANNOTATION: { left: '61.45%', top: '33.19%', width: '21%' },  // % of the card box

  SIDE_START_SCALE: 0.92,   // side cards while stacked behind London
  CENTER_EMPHASIS: 1.04,    // London's resting scale — "traces its original position"

  /* Master timeline positions, 0–1 across the whole pin. */
  T: {
    /* The erase starts on the pin's first pixel — a lead-in here is scroll
       where the screen is frozen and nothing has begun. */
    annoStart: 0.00, annoDur: 0.26,     // erase ends at 0.26 …
    shrinkStart: 0.29, shrinkDur: 0.43, // … so nothing shrinks before it's gone
    /* The SCRUBBED part of the pop-out only. It ends at 0.92, which is the
       handoff: from there the cards are unlinked from scroll entirely. */
    sideStart: 0.66, sideDur: 0.26,
    /* The only remaining dead scroll, and it earns its place: it keeps the
       strip pinned for a beat while the triggered titles start, instead of
       whipping away the instant the handoff fires. Long enough to register,
       short enough not to feel like a stall — the animation carries on by
       itself as the section scrolls up anyway. It also makes the timeline
       exactly 1.0 long, so every number here reads directly as a fraction
       of the pin. */
    holdTail: 0.08
  },

  /* THE HANDOFF. The side cards are scrubbed out from behind London until only
     a sliver is still tucked behind it — SIDE_SCRUB_FRACTION of their travel —
     and at that instant they are RELEASED. The last of the movement, its
     overshoot, and all four titles then run on their own clock, completely
     unlinked from scroll. Scrolling further does not drive them; they finish
     whether you keep scrolling or stop dead.

     Raise SIDE_SCRUB_FRACTION toward 1 to hand off later (less scrubbing left,
     tighter sliver), lower it to hand off earlier. finishDur is how long the
     released travel takes, in real seconds. */
  SIDE_SCRUB_FRACTION: 0.85,
  /* clearMargin: a little past the card edge, so rounding and antialiasing
     can never leave a sliver of a letter showing before the slide. */
  FINALE: { finishDur: 0.55, titleDur: 0.62, titleStagger: 0.10, clearMargin: 1.05 },

  REVEAL_AT: 0.90,          // only used when arriving mid-page (syncOneShots);
                            // in normal scrolling the reveal chains off the
                            // titles finishing.
  REVEAL: { dur: 0.5, stagger: 0.12, rise: 14 },

  /* -- the falling headshot --------------------------------------------- */
  DROP_START_X: '46vw',     // deliberately off-centre, for an imperfect feel
  DROP_HIDDEN: 0.92,        // fraction tucked above the divider at rest
  DROP_START_SCALE: 0.86,   // grows to 1.0 (≈1.16×) as it's pulled in
  DROP_START_ROT: -6,
  DROP_LOOSE_ROT: -11,
  DROP_LOOSE_Y: 0.08,       // peek distance, as a fraction of its own height
  FALL_DURATION: 1.25,
  FALL_VARIANT: 'B',        // 'B' = magic pull (default) · 'A' = impact settle

  /* -- coverflows -------------------------------------------------------- */
  COVERFLOW: {
    autoMs: 4000,           // old site used 2800 — felt rushed
    resumeMs: 6000,
    mixtapeCoverH: 220, mixtapeCoverHSm: 180,
    moviesCoverH: 300, moviesCoverHSm: 240
  }
};

(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  /* ------------------------------------------------------------ footer --- */

  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* --------------------------------------------------------- coverflows --- */

  buildCoverflows();

  function buildCoverflows() {
    if (typeof createCoverflow !== 'function') return;
    var cf = CONFIG.COVERFLOW;

    var mixEl = document.querySelector('[data-coverflow="mixtape"]');
    if (mixEl && typeof MIXTAPE !== 'undefined') {
      createCoverflow(mixEl, {
        items: MIXTAPE, aspect: '1/1', label: 'Mixtape',
        coverHeight: cf.mixtapeCoverH, coverHeightSm: cf.mixtapeCoverHSm,
        autoMs: cf.autoMs, resumeMs: cf.resumeMs
      });
    }

    var movEl = document.querySelector('[data-coverflow="movies"]');
    if (movEl && typeof MOVIES !== 'undefined') {
      createCoverflow(movEl, {
        items: MOVIES, aspect: '2/3', label: 'Movies & TV',
        coverHeight: cf.moviesCoverH, coverHeightSm: cf.moviesCoverHSm,
        autoMs: cf.autoMs, resumeMs: cf.resumeMs
      });
    }
  }

  /* ------------------------------------------------- annotation position --- */

  root.style.setProperty('--anno-left', CONFIG.ANNOTATION.left);
  root.style.setProperty('--anno-top', CONFIG.ANNOTATION.top);
  root.style.setProperty('--anno-width', CONFIG.ANNOTATION.width);

  /* ----------------------------------------------------------- elements --- */

  var stage = document.querySelector('.stage');
  var strip = document.querySelector('.strip');
  var journey = document.getElementById('journey');
  var cards = {
    edinburgh: document.querySelector('.card--edinburgh'),
    london: document.querySelector('.card--london'),
    brussels: document.querySelector('.card--brussels')
  };
  var londonSlot = document.querySelector('.slot--london');
  var annotation = document.querySelector('.annotation');
  var cue = document.querySelector('.hero__cue');

  var divider = document.querySelector('.about__divider');
  var headshot = document.querySelector('.headshot');

  var revealTargets = [].concat(
    [document.querySelector('.strip-heading')],
    [].slice.call(document.querySelectorAll('.strip-caption')),
    [document.querySelector('.strip-cta')]
  ).filter(Boolean);

  var aboutTargets = [].concat(
    [document.querySelector('.about__heading'), document.querySelector('.about__name')],
    [].slice.call(document.querySelectorAll('.badge')),
    [].slice.call(document.querySelectorAll('.module'))
  ).filter(Boolean);

  /* -------------------------------------------------- static-render path --- */

  /* No GSAP (missing file, or opened via file:// with a blocked fetch) and
     reduced-motion both land here: the completed layout, no triggers created. */
  if (!hasGsap || reduced) {
    loadCutouts();
    root.classList.add('is-static');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* --------------------------------------------------------- hero cue ----- */

  if (cue) {
    gsap.set(cue, { xPercent: -50, x: 0 });   // reproduces the CSS centering
    var cueFloat = gsap.to(cue, {
      y: -6, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: -1
    });
    var cueGone = false;
    var dismissCue = function () {
      if (cueGone) return;
      cueGone = true;
      cueFloat.kill();
      gsap.to(cue, { opacity: 0, duration: 0.3, ease: 'power1.out' });
    };
    if (window.scrollY > 40) { cueFloat.kill(); gsap.set(cue, { opacity: 0 }); cueGone = true; }
    window.addEventListener('scroll', function () {
      if (window.scrollY > 40) dismissCue();
    }, { passive: true });
  }

  /* ============================================ the journey (Frames 2–4) === */

  var S0 = 4;               // full-bleed scale for London, recomputed on refresh
  var dxEdinburgh = 0;      // offset that parks a side card behind London
  var dxBrussels = 0;
  var revealed = false;
  var released = false;         // handoff done: cards + titles are off scroll
  var cutoutsLoaded = false;
  var journeyTl = null;
  var titlesTl = null;
  var popTl = null;
  var scrubbedBeats = [];   // the journey tweens that stop writing once released

  if (stage && cards.london) buildJourney();
  if (stage) stage.classList.add('is-ready');   // never leave the stage hidden

  function measureJourney() {
    /* Measure the layout at rest — transforms off — and work in stage-relative
       coordinates. While pinned the stage's box IS the viewport, so these
       numbers stay correct no matter where the page is scrolled during a
       refresh. */
    var list = [cards.edinburgh, cards.london, cards.brussels].filter(Boolean);
    var saved = list.map(function (el) { return el.style.transform; });
    list.forEach(function (el) { el.style.transform = 'none'; });

    var sRect = stage.getBoundingClientRect();
    var vw = stage.clientWidth;
    var vh = stage.clientHeight;
    var lon = cards.london.getBoundingClientRect();

    var w = lon.width;
    var h = lon.height;
    var oy = CONFIG.ORIGIN_Y;

    var ox = (lon.left - sRect.left) + w / 2;
    var oyPx = (lon.top - sRect.top) + h * oy;

    /* Smallest scale about (ox, oyPx) that still covers every viewport edge.
       (The spec's max(vw/w, vh/h) is the centred special case of this; the
       general form is what lets ORIGIN_Y move freely.) */
    S0 = Math.max(
      ox / (w * 0.5),
      (vw - ox) / (w * 0.5),
      oyPx / (h * oy),
      (vh - oyPx) / (h * (1 - oy))
    ) * CONFIG.S0_OVERSHOOT;

    if (!isFinite(S0) || S0 < 1) S0 = 1;

    var lonCx = lon.left + w / 2;
    if (cards.edinburgh) {
      var e = cards.edinburgh.getBoundingClientRect();
      dxEdinburgh = lonCx - (e.left + e.width / 2);
    }
    if (cards.brussels) {
      var b = cards.brussels.getBoundingClientRect();
      dxBrussels = lonCx - (b.left + b.width / 2);
    }

    list.forEach(function (el, i) { el.style.transform = saved[i] || ''; });
  }

  function buildJourney() {
    var T = CONFIG.T;
    var radius = getComputedStyle(root).getPropertyValue('--radius-card').trim() || '28px';

    measureJourney();

    /* NO will-change ON LONDON, deliberately — it was making the card blurry.

       will-change: transform promotes the element to its own compositor layer,
       and the browser sizes that layer's backing store to the element's
       UNTRANSFORMED box. Everything is painted once into a ~380px-wide texture
       and the GPU then stretches that texture 5.5x to fill the screen. No
       amount of source resolution survives it: the photo, the cutout and the
       annotation are all flattened before the scale is applied.

       The giveaway was the annotation. It is an SVG — vector art cannot go soft
       for want of pixels — and it was blurring exactly like the photograph.
       That rules out resolution as the cause and points at rasterisation.

       Chrome re-rasterises a scaled layer as it goes, which is why it always
       looked fine there; Safari picks a scale when the layer is created and
       keeps it. Without the hint, Safari makes the layer only once the
       transform is applied, at the scale it is actually being shown at.

       The side cards keep the hint: they only ever scale 0.92 -> 1.0, so there
       is nothing for a stretched texture to lose, and they stay smooth. */
    gsap.set(cards.london, {
      transformOrigin: '50% ' + (CONFIG.ORIGIN_Y * 100) + '%'
    });
    gsap.set([cards.edinburgh, cards.brussels].filter(Boolean), { willChange: 'transform' });

    /* titlesTl and popTl are both built before the journey timeline on
       purpose: creating that timeline creates its ScrollTrigger, whose initial
       refresh can call release() synchronously — before these would exist. */
    /* Beat 4 — TRIGGERED. Paused until the handoff, then plays on its own
       clock and chains into beat 5. Costs zero scroll distance. */
    titlesTl = gsap.timeline({
      paused: true,
      onComplete: function () { playReveal(false); }
    });
    slideTitle('.card-title--edinburgh .card-title__art', -1, 0);
    slideTitle('.card-title__art--london', -1, 1);
    slideTitle('.card-title__art--england',  1, 2);
    slideTitle('.card-title--brussels .card-title__art', 1, 3);

    function slideTitle(selector, dir, order) {
      var els = document.querySelectorAll(selector);
      if (!els.length) return;
      [].forEach.call(els, function (el) {
        var from = clearingPercent(el, dir);
        /* Park it now, while the stage is still visibility:hidden, so the
           timeline's from-value and what's on screen can never disagree. */
        gsap.set(el, { xPercent: from, x: 0 });
        titlesTl.fromTo(el,
          /* x:0 IS LOAD-BEARING — do not drop it. The CSS pre-slide is a
             translateX percentage, and the only way GSAP can read an existing
             transform is getComputedStyle(), which hands back a matrix already
             resolved to PIXELS. GSAP therefore records x:-323px / xPercent:0,
             and tweening xPercent alone rides on top of that stuck pixel
             offset — the title slides but never arrives, which looks exactly
             like "the titles never appear". Pinning x to 0 at both ends makes
             xPercent the only thing moving them.

             immediateRender:false — the paused timeline must not stamp its
             from-state at build time; the gsap.set above already did. */
          { xPercent: from, x: 0 },
          { xPercent: 0, x: 0, duration: CONFIG.FINALE.titleDur,
            ease: 'power3.out', immediateRender: false },
          order * CONFIG.FINALE.titleStagger);
      });
    }

    /* How far this title must travel, as a % of its OWN width, to sit fully
       outside its card. This was a flat ±110%, which only held while the
       titles were flush against the card edges. Once they were centred and
       narrowed, 110% of a narrow element stopped clearing a wide card and the
       end letters sat visible in frame before the slide — LONDON's right edge
       was still 9.8% inside, Brussels' left edge 68% inside. Measured, so it
       stays correct whatever the widths and alignment become.

       The result is a ratio of card width to element width, and both are sized
       in cqw, so it survives resize and every breakpoint without recomputing. */
    function clearingPercent(el, dir) {
      var card = el.closest('.card');
      if (!card) return dir * 200;
      var saved = el.style.transform;
      el.style.transform = 'none';          // measure the resting position
      var c = card.getBoundingClientRect();
      var r = el.getBoundingClientRect();
      el.style.transform = saved;
      if (!r.width) return dir * 200;
      var left = r.left - c.left;
      var pct = dir < 0 ? -(left + r.width) / r.width
                        :  (c.width - left) / r.width;
      return pct * 100 * CONFIG.FINALE.clearMargin;
    }

    /* Beat 3 — the pop-out, in two phases with a handoff between them.

       The whole travel lives on popTl, which is PAUSED and therefore owns the
       cards' transform outright — nothing else writes x/scale on them. Phase A
       (linear, so scrub progress maps 1:1 onto distance travelled) carries them
       from parked behind London to SIDE_SCRUB_FRACTION of the way out. Phase B
       carries them the rest of the way with the back.out overshoot.

       Scroll does not animate the cards directly. It drives popTl's PLAYHEAD,
       via the proxy tween further down, and only across phase A. At the handoff
       we stop driving it and call play(): phase B then runs on its own clock,
       fully unlinked. Keep scrolling, stop dead, scroll back — it finishes
       either way. Two separate tweens because one tween cannot carry two eases,
       and the linear/overshoot split is the entire point. */
    var frac = CONFIG.SIDE_SCRUB_FRACTION;
    var midScale = CONFIG.SIDE_START_SCALE + (1 - CONFIG.SIDE_START_SCALE) * frac;

    popTl = gsap.timeline({ paused: true });
    addPopOut(cards.edinburgh, function () { return dxEdinburgh; });
    addPopOut(cards.brussels, function () { return dxBrussels; });

    /* PARK THEM FOR REAL — not just in popTl's from-values.

       popTl is paused, and a paused timeline never renders, so the fromTo's
       immediateRender never fired and { x: dx, scale: 0.92 } was never written
       to the cards. They sat at their resting positions, in full view, from
       page load until the pop-out first drove the timeline — at which point the
       first real render snapped them behind London and they came out again.

       That is the whole "the gallery looks pre-built" complaint: nothing was
       wrong with the sequence, the side cards were simply never hidden behind
       London to begin with. It reads worst on a wide viewport, where London
       stops covering their resting positions early in the shrink.

       The titles have exactly this hazard and already park themselves with a
       gsap.set for exactly this reason (see slideTitle above). This is the same
       fix, routed through renderPop so the refresh path gets it too. */
    renderPop(0);

    function addPopOut(card, dx) {
      if (!card) return;
      popTl.fromTo(card,
        { x: dx, scale: CONFIG.SIDE_START_SCALE },
        { x: function () { return dx() * (1 - frac); }, scale: midScale,
          duration: 1, ease: 'none' },
        0);
      popTl.to(card,
        { x: 0, scale: 1, duration: CONFIG.FINALE.finishDur, ease: 'back.out(1.6)' },
        1);
    }

    journeyTl = gsap.timeline({
      defaults: { ease: 'none' },

      /* THE HANDOFF IS KEYED TO THIS TIMELINE'S OWN PLAYHEAD, not to the
         ScrollTrigger's progress — and that distinction is the whole point.

         With scrub, self.progress is the raw scroll position, while what's on
         screen is the eased playhead trailing it by up to CONFIG.SCRUB seconds.
         Scroll quickly and the two diverge hard: self.progress would reach the
         handoff while the shrink was still visibly mid-flight, release() would
         fire, and its journeyTl.progress(1) would snap the gallery straight to
         its finished framing — the built-out cards appearing before they had
         come out at all.

         The playhead IS what's rendered, so keyed here the two can't disagree,
         and progress(1) becomes a no-op: at 0.92 every scrubbed beat has
         already reached its end value, and only the hold lies beyond. */
      onUpdate: function () {
        /* `this` is the timeline under GSAP's default callbackScope; falling
           back to the closure keeps a silent no-handoff impossible either way. */
        var tl = (this && this.progress) ? this : journeyTl;
        if (!released && tl && tl.progress() >= T.sideStart + T.sideDur) release(false);
      },

      scrollTrigger: {
        trigger: journey,
        start: 'top top',
        end: function () { return '+=' + (window.innerHeight * CONFIG.JOURNEY_SCROLL_VH / 100); },
        pin: stage,
        pinSpacing: true,
        scrub: CONFIG.SCRUB,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefreshInit: measureJourney,
        /* popTl lives outside journeyTl, so invalidateOnRefresh doesn't reach
           it. Its parked-position values are function-based and go stale on
           resize, hence re-reading them here — but only while it's still
           scroll-driven; re-rendering a released timeline would undo it. */
        onRefresh: function () {
          /* invalidate() alone re-reads nothing until something renders, and
             progress(same) is treated as a no-op — so this used to leave the
             cards on stale parked offsets after a resize. renderPop forces it. */
          if (!released && popTl) { popTl.invalidate(); renderPop(popTl.progress()); }
        },
        onEnter: loadCutouts,
        onEnterBack: function () {
          strip.classList.remove('is-swipeable');
        },
        onLeave: function () {
          makeSwipeable();

          /* NOTHING IS FORCED HERE, deliberately. onLeave is keyed to raw
             scroll, so under scrub it fires up to CONFIG.SCRUB seconds before
             the screen has caught up — and the stage is still fully on screen
             at that instant, because the pin has only just let go. Snapping the
             finished state here is what still made the built-out gallery appear
             while the sequence was visibly mid-flight.

             The playhead is already travelling toward 1, so the handoff on the
             timeline fires on its own a moment later, in step with what's
             rendered. This only steps in if that somehow hasn't happened, and
             only while we're STILL past the end — so scrolling back up in the
             meantime can never trigger it. */
          gsap.delayedCall(CONFIG.SCRUB + 0.2, function () {
            var st = journeyTl && journeyTl.scrollTrigger;
            if (!released && st && st.progress >= 1) release(true);
          });
        },
        /* No onUpdate here on purpose. The handoff lives on the timeline above
           so it stays in step with what's rendered, and the reveal chains off
           the titles finishing. A scroll-keyed reveal check used to sit here
           and had the same lead as the handoff did — on a fast scroll it fired
           the captions in before the titles arrived. Loading mid-page and hash
           jumps are covered by syncOneShots() and onLeave. */
      }
    });

    /* Beat 2 — the erase. A left-to-right wipe, so the label goes first and the
       arrowhead last. It finishes at annoStart + annoDur = 0.24; nothing starts
       shrinking until 0.26. */
    if (annotation) {
      journeyTl.fromTo(annotation,
        { clipPath: 'inset(0 0 0 0%)' },
        { clipPath: 'inset(0 0 0 100%)', duration: T.annoDur },
        T.annoStart);
    }

    /* Beat 1→3 — pure scale, no translation. Lands directly on the emphasis
       scale rather than passing through 1 and nudging back up. */
    journeyTl.fromTo(cards.london,
      { scale: function () { return S0; }, borderRadius: '0px' },
      { scale: CONFIG.CENTER_EMPHASIS, borderRadius: radius,
        duration: T.shrinkDur, ease: 'power2.inOut',
        /* force3D:false is a lock, not a fix. A 3D transform is its own
           compositor-layer trigger, and a layer is what was blurring this
           card (see the note by cards.london). Measured on this tween, GSAP
           already writes a plain `scale()` under its default force3D:'auto' —
           so this pins existing behaviour rather than changing it, and stops a
           future GSAP version, or a translation added to this tween later,
           from quietly reintroducing matrix3d and the blur with it. */
        force3D: false },
      T.shrinkStart);

    /* THE LONDON CUTOUT IS HELD BACK UNTIL THE CARD IS SMALL.

       The cutout exists for one reason: it sits above the sliding titles so the
       buildings appear in front of the text. That only happens once the titles
       arrive, long after the handoff, with the card at its resting size — where
       1400px is far more than enough.

       At full-bleed it earns nothing. It is the same photograph as the layer
       underneath, so it adds no detail — but it is opaque over about a quarter
       of what is on screen there, and at that scale it is a 3.0x upscale
       painting over the base's 1.5x. The blurriest copy was winning.

       Fading it in across the shrink means full-bleed shows the base alone, and
       the cutout is fully back well before the titles need it. */
    var londonCutout = cards.london &&
                       cards.london.querySelector('.card-cutout');
    if (londonCutout) {
      journeyTl.fromTo(londonCutout,
        { opacity: 0 },
        { opacity: 1, duration: T.shrinkDur * 0.35, ease: 'power1.inOut' },
        T.shrinkStart + T.shrinkDur * 0.45);
    }

    /* Phase A's scroll driver. It tweens a plain number and pushes it into
       popTl's playhead — so scrolling scrubs the pop-out without ever owning
       the cards. scrubEnd is where phase A ends as a fraction of popTl's whole
       duration (1 + finishDur). Once released, the guard stops this writing,
       which is what keeps scroll from yanking a released card backwards. */
    var scrubEnd = 1 / (1 + CONFIG.FINALE.finishDur);
    var popDriver = { p: 0 };
    journeyTl.fromTo(popDriver, { p: 0 },
      { p: scrubEnd, duration: T.sideDur, ease: 'none',
        onUpdate: function () { if (!released) popTl.progress(popDriver.p); } },
      T.sideStart);

    /* Everything scroll-driven has now been added. Capture those tweens so the
       handoff can switch them off — deliberately BEFORE the hold below, which
       must survive so the timeline keeps its full duration. */
    scrubbedBeats = journeyTl.getChildren(false, true, false).slice();

    /* Beat 4b — the hold. An empty tween: it animates nothing and only buys
       scroll distance, keeping the strip pinned while the triggered titles and
       reveal play out. */
    journeyTl.to({}, { duration: T.holdTail }, T.sideStart + T.sideDur);

    stage.classList.add('is-ready');
  }

  /* Render popTl at `p`, guaranteeing the render actually happens.

     GSAP skips a render when the playhead does not move, so both
     progress(0) on a never-rendered timeline and progress(same) after an
     invalidate() are silent no-ops — which is precisely how the cards ended up
     unparked, and how they stayed on stale offsets across a resize. Stepping
     off the value and back forces one real render, which re-reads the
     function-based dx values. The nudge is 1/10000th of the timeline, so
     nothing is visible even if it lands on screen. */
  function renderPop(p) {
    if (!popTl) return;
    popTl.progress(p === 0 ? 0.0001 : 0).progress(p);
  }

  /* THE HANDOFF — fired from the pin's onUpdate, once. Releases the side cards
     and the titles from scroll: everything from here runs on its own clock.
     Reverse-scrubbing needs no undo for the same reason beat 5 doesn't — London
     scaling back up re-covers the whole strip (the z-order rule in the CSS). */
  function release(instant) {
    if (released) return;
    if (!popTl || !titlesTl) return;   // not built yet — never latch on nulls
    released = true;

    /* Freeze the scrubbed half of the journey, so scrolling back up can't undo
       what's been built: the sketch stays erased, London stays at its resting
       scale, the side cards stay out.

       The pin has to stay alive to do it — disabling the ScrollTrigger would
       drop its spacer mid-pin and jerk the scroll by the remaining distance —
       so instead we run the timeline to its end state and then kill the tweens
       that would drag it back. journeyTl carries on scrubbing; it simply
       doesn't own anything any more. The hold is left alive so the timeline
       keeps its duration and the pin still ends where it always did. */
    if (journeyTl) journeyTl.progress(1, true);
    scrubbedBeats.forEach(function (t) { t.kill(); });
    scrubbedBeats.length = 0;

    if (instant) {
      popTl.progress(1, true);
      titlesTl.progress(1, true);
      playReveal(true);
      return;
    }
    popTl.play();
    titlesTl.play();
  }

  /* Beat 5 — TRIGGERED. Deliberately not scrubbed: it must cost no scroll
     distance. Reverse-scrubbing needs no un-reveal logic, because London
     scaling back up re-covers all of it (see the z-order rule in the CSS). */
  function playReveal(instant) {
    if (revealed) return;
    revealed = true;
    if (!revealTargets.length) { goLive(); return; }
    if (instant) {
      gsap.set(revealTargets, { opacity: 1, y: 0 });
      goLive();
      return;
    }
    gsap.fromTo(revealTargets,
      { opacity: 0, y: CONFIG.REVEAL.rise },
      { opacity: 1, y: 0, duration: CONFIG.REVEAL.dur,
        stagger: CONFIG.REVEAL.stagger, ease: 'power2.out',
        onComplete: goLive });
  }

  /* THE STRIP GOES INTERACTIVE ONLY WHEN THE REVEAL HAS FINISHED.

     The cards are links, and .is-live is what grants them pointer-events —
     which gates the hover scrim and magnifier as much as the click, since
     pointer-events:none suppresses :hover too. Both are held back for the same
     reason: while the strip is still assembling itself, a cursor resting over
     it would darken a card and float a magnifier over artwork that is visibly
     mid-build, and on the way in London still covers the viewport, so a stray
     click would navigate instead of scroll.

     Hanging it off the reveal tween's onComplete rather than the handoff means
     the trigger is the thing the reader actually sees settle — the heading and
     the captions under the cards reaching full opacity — instead of an internal
     milestone that lands a beat earlier. stagger'd tweens fire onComplete once,
     after the LAST target lands, which is exactly the moment wanted.

     Every path into the strip goes through playReveal(), including the instant
     one syncOneShots() takes when the page is loaded partway down, so there is
     no route that leaves the cards permanently dead. The no-JS and
     reduced-motion paths never call it at all and are covered separately by
     `.js.is-static .strip .card` in the CSS. */
  function goLive() {
    if (strip) strip.classList.add('is-live');
  }

  function loadCutouts() {
    if (cutoutsLoaded) return;
    cutoutsLoaded = true;
    [].forEach.call(document.querySelectorAll('.card-cutout[data-src]'), function (img) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }

  /* Mobile only (the CSS rule lives inside the 820px query): once the pin
     releases, the strip becomes a real snap scrollport. */
  function makeSwipeable() {
    if (!strip || !londonSlot) return;
    strip.classList.add('is-swipeable');
    var sRect = strip.getBoundingClientRect();
    var lRect = londonSlot.getBoundingClientRect();
    strip.scrollLeft += (lRect.left + lRect.width / 2) - (sRect.left + strip.clientWidth / 2);
  }

  /* ==================================== the drop + About (Frames 5–6) ====== */

  var dropX = 0, dropY = 0, looseY = 0;
  var fallen = false;
  var aboutRevealed = false;
  var looseST = null;
  var fallST = null;

  if (headshot && divider) buildDrop();
  if (headshot) headshot.classList.add('is-placed');   // never leave it hidden

  function measureDrop() {
    var saved = headshot.style.transform;
    headshot.style.transform = 'none';

    var r = headshot.getBoundingClientRect();
    var d = divider.getBoundingClientRect();

    var restCx = r.left + r.width / 2;
    var startCx = vwUnits(CONFIG.DROP_START_X);
    /* Tucked above the divider line — #about has overflow: clip, so the hidden
       part really is clipped rather than just covered. */
    var startTop = d.top - r.height * CONFIG.DROP_HIDDEN;

    dropX = startCx - restCx;
    dropY = startTop - r.top;
    looseY = r.height * CONFIG.DROP_LOOSE_Y;

    headshot.style.transform = saved || '';
  }

  function vwUnits(value) {
    var n = parseFloat(value);
    if (/vw\s*$/.test(String(value))) return window.innerWidth * n / 100;
    return n;
  }

  function buildDrop() {
    measureDrop();

    gsap.set(headshot, {
      x: dropX, y: dropY,
      rotation: CONFIG.DROP_START_ROT,
      scale: CONFIG.DROP_START_SCALE,
      transformOrigin: '50% 50%',
      willChange: 'transform'
    });
    headshot.classList.add('is-placed');

    /* Phase 1 — coming loose. SCRUBBED. One corner slips out and pivots; this
       must not read as a uniform scroll-reveal. */
    var loose = gsap.timeline({
      scrollTrigger: {
        trigger: divider,
        start: 'top 75%',
        end: 'top 55%',
        scrub: true,
        invalidateOnRefresh: true,
        onRefreshInit: function () { if (!fallen) measureDrop(); }
      }
    });
    looseST = loose.scrollTrigger;

    loose.fromTo(headshot,
      { rotation: CONFIG.DROP_START_ROT, y: function () { return dropY; } },
      { rotation: CONFIG.DROP_LOOSE_ROT, y: function () { return dropY + looseY; },
        ease: 'none', duration: 1 });

    /* Phase 2 — the fall. TRIGGERED, one-shot, on its own clock: gravity only
       reads as gravity on a time axis, and Joe doesn't want this to cost scroll. */
    fallST = ScrollTrigger.create({
      trigger: divider,
      start: 'top 55%',
      onEnter: function () { fall(false); }
    });
  }

  function fall(instant) {
    if (fallen) return;
    fallen = true;

    /* SNAPSHOT THE PEEK BEFORE KILLING ANYTHING.

       ScrollTrigger.kill() reverts the timeline it owns back to progress 0. So
       the moment the fall was triggered, the loose phase was silently undone —
       the corner that had just slipped out snapped back flush, and only then
       did the fall begin, from the un-peeked position. Measured at the handoff:
       rotation -11 -> -6 and y -272.6 -> -284.3 in a single frame, which is
       exactly the "drops a corner, clips back, then falls" that gave this away.

       The fall reads as one continuous motion only if it starts from wherever
       the peek actually left off, so the transform is captured first and put
       back after the triggers are gone. Reading it back rather than assuming
       it: the loose phase writes only rotation and y, but x and scale are read
       too, so this stays correct if that ever changes.

       Deliberately NOT solved by passing kill()'s revert/allowAnimation flags.
       That would trade one dependency on GSAP's internal kill semantics for
       another, and those semantics are precisely what broke this. */
    var resume = null;
    if (!instant) {
      resume = {
        x: gsap.getProperty(headshot, 'x'),
        y: gsap.getProperty(headshot, 'y'),
        rotation: gsap.getProperty(headshot, 'rotation'),
        scale: gsap.getProperty(headshot, 'scale')
      };
    }

    if (looseST) { looseST.kill(); looseST = null; }
    if (fallST) { fallST.kill(); fallST = null; }

    if (instant) {
      gsap.set(headshot, { x: 0, y: 0, rotation: 0, scale: 1, willChange: 'auto' });
      revealAbout(true);
      return;
    }

    gsap.set(headshot, resume);          // undo the revert kill() just did

    var D = CONFIG.FALL_DURATION;
    var tl = gsap.timeline({
      onComplete: function () {
        gsap.set(headshot, { willChange: 'auto' });
        revealAbout(false);
      }
    });

    /* 0 → 55%: gravity. Mostly vertical, accelerating, rotation swinging
       through, with the leftward drift only just beginning. */
    tl.to(headshot, {
      x: dropX * 0.78,
      y: dropY * 0.45,
      rotation: 7,
      scale: (CONFIG.DROP_START_SCALE + 1) / 2,
      duration: D * 0.55,
      ease: 'power2.in'
    });

    if (CONFIG.FALL_VARIANT === 'A') {
      /* Variant A — impact settle: overshoot, one small rebound, wobble to rest. */
      tl.to(headshot, { x: 0, y: 14, rotation: 2, scale: 1, duration: D * 0.28, ease: 'power2.in' })
        .to(headshot, { y: -6, rotation: -2, duration: D * 0.09, ease: 'power2.out' })
        .to(headshot, { y: 0, rotation: 0, duration: D * 0.08, ease: 'power2.out' });
    } else {
      /* Variant B (default) — the magic pull: redirected mid-fall, curving left
         and growing into the slot as one continuous motion. No impact. */
      tl.to(headshot, {
        x: 0, y: 0, rotation: 0, scale: 1,
        duration: D * 0.45, ease: 'power3.out'
      });
    }
  }

  function revealAbout(instant) {
    if (aboutRevealed) return;
    aboutRevealed = true;
    if (!aboutTargets.length) return;
    if (instant) {
      gsap.set(aboutTargets, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(aboutTargets,
      { opacity: 0, y: CONFIG.REVEAL.rise },
      { opacity: 1, y: 0, duration: CONFIG.REVEAL.dur,
        stagger: CONFIG.REVEAL.stagger, ease: 'power2.out' });
  }

  /* ===================================== retiring the pin ================== */

  /* The pin's spacer is real layout — a screen and a bit of document whose only
     job was to give the scrubbed beats somewhere to happen. Once the journey is
     frozen it has no job left, but it still has to be scrolled back up through,
     with a static gallery on screen the whole way. So we take it out.

     Removing it shortens the document ABOVE the reader, so the same distance
     comes off the scroll position in the same task. No paint happens between
     the two, so the rendered frame is identical — the content moves up by
     exactly as much as the scroll does — and afterwards the section is simply
     its own height again.

     Two things this has to respect:
       - Never mid-gesture. Rewriting scrollTop during momentum cancels it dead
         on both Safari and Chrome, which would feel far worse than the ghost
         scroll being removed. It waits for a gap in scrolling.
       - Never while the stage is still pinned, i.e. while the reader is inside
         the pin's range. There the stage is fixed, and un-pinning it would
         drop it back into flow somewhere else on screen. */

  var pinRetired = false;
  var idleTimer = null;

  function retirePin() {
    if (pinRetired || !released || !journeyTl) return;
    var st = journeyTl.scrollTrigger;
    if (!st || !st.pin) return;

    var y = window.scrollY;
    var spacer = st.end - st.start;
    if (spacer <= 0) return;

    var below = y > st.end;
    if (!below && y > st.start) return;      // inside the pin — not safe yet

    pinRetired = true;

    var docBefore = document.documentElement.scrollHeight;
    st.kill(true, true);                     // revert the pinning, keep the timeline
    /* Collapse the stage to its content in the SAME task. It was 100svh only so
       the full-bleed card had a viewport to fill; with the journey frozen that
       leaves a band of dead black around the strip. Doing it here means its
       reflow is absorbed by the one scroll correction below rather than
       needing a second one. */
    stage.classList.add('is-unpinned');
    var removed = docBefore - document.documentElement.scrollHeight;

    if (below && removed > 0) {
      /* Measured rather than assumed: the document lost the pin's spacer AND
         the stage's slack, and all of it sits above the reader. This has to
         land in one frame or the reader sees the whole correction sweep past.
         The root no longer declares scroll-behavior (see the note in the CSS),
         so this is already instant — forcing 'auto' is insurance in case a
         smooth rule is ever reintroduced above us. */
      var prev = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, y - removed);
      root.style.scrollBehavior = prev;
    }

    ScrollTrigger.refresh();                 // everything below just moved up
  }

  window.addEventListener('scroll', function () {
    if (pinRetired || !released) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(retirePin, 120);
  }, { passive: true });

  /* ============================== load-mid-page / hash-jump correctness ==== */

  /* Scrubbed animations recover from scroll position on their own — that's what
     scrub means. The two one-shots can't, so on init (and after every refresh)
     they check whether their trigger is already behind us and, if so, snap
     straight to the end state. A hash-jump must never land on an invisible
     About section. */
  function syncOneShots() {
    if (!revealed && !pinRetired && journeyTl && journeyTl.scrollTrigger &&
        journeyTl.scrollTrigger.progress >= CONFIG.REVEAL_AT) {
      playReveal(true);
    }
    if (!fallen && fallST && fallST.scroll() >= fallST.start) {
      fall(true);
    }
  }

  ScrollTrigger.addEventListener('refresh', syncOneShots);
  syncOneShots();

  /* Pin spacing is inserted after the browser has already honoured a #hash, so
     re-aim at the target once the real geometry exists. Instant on purpose:
     this is a correction to a jump that already happened, not a journey the
     reader asked to watch. */
  function reAimHash() {
    var hash = window.location.hash;
    if (!/^#[A-Za-z][\w-]*$/.test(hash)) return;
    var target = document.querySelector(hash);
    if (!target) return;
    var prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    target.scrollIntoView();
    root.style.scrollBehavior = prev;
    ScrollTrigger.refresh();
  }

  /* ---------------------------------------------- smooth in-page anchors ---
     This is the replacement for `html { scroll-behavior: smooth }`, which had
     to go: it made ScrollTrigger's internal measuring scrolls animate too, and
     that silently destroyed the journey on every refresh (the CSS carries the
     full account). Asking for smooth per click affects only that one scroll,
     so ScrollTrigger keeps measuring instantly.

     Only same-document links qualify — "/#about" from the home page. The same
     href on /gallery/ is a real navigation and is left alone. */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey ||
        e.shiftKey || e.altKey) return;

    var link = e.target.closest && e.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

    var url;
    try { url = new URL(link.href, window.location.href); } catch (err) { return; }
    if (url.origin !== window.location.origin ||
        url.pathname !== window.location.pathname || !url.hash) return;

    if (!/^#[A-Za-z][\w-]*$/.test(url.hash)) return;
    var target = document.querySelector(url.hash);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    /* Keep the address bar honest without letting the browser jump us there
       itself — replaceState moves no scroll. */
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', url.hash);
    }
  });

  /* Measure against the real faces, not the fallbacks — pin distances and S0
     both depend on final layout. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      ScrollTrigger.refresh();
      reAimHash();
    });
  } else {
    window.addEventListener('load', function () {
      ScrollTrigger.refresh();
      reAimHash();
    });
  }

  /* If iOS address-bar resizing ever causes pin jitter, this is the known fix.
     Left off by default — it takes over scrolling, which we'd rather not do.
     ScrollTrigger.normalizeScroll(true); */

}());
