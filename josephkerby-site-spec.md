# josephkerby.com — Build Spec

**For:** Claude Code
**Source of truth:** Joe's brain doc + Figma storyboard frames (this spec translates both). Where this spec gives a concrete value for something the brain doc left open, it's a tunable default — implement it, don't agonize over it.
**Prime directive:** This is a scroll-driven, image-forward personal site in the spirit of Apple product pages, with playful DIY energy. The animation choreography in §7 **is the product**. Everything else exists to support it.

---

## 1. What we're building

A static multi-page site for Joseph Kerby Anderson (Joe): a homepage that plays a continuous scroll story (hero → annotated photo → gallery strip reveal → falling headshot → about section), plus two stub pages (`/gallery/`, `/resources/`) that will be specced later. Dark mode only. Hosted on GitHub Pages at the custom domain `josephkerby.com`.

Mood: techy, nerdy side-project energy — "my little corner of the internet." Colors and type stay restrained so photography carries the visual weight. Playfulness lives in the *motion*, not in decoration.

## 2. Hard constraints (do not violate)

1. **Asset convention.** Every image/logo/graphic is referenced by real file path into `assets/` (exact filenames in §9) **as if the file already exists**. Joe uploads the actual files afterward. Do **not** generate placeholder shapes, inline placeholder SVGs, or data-URI stand-ins. A missing file should just 404 like a normal broken image — that's the expected dev state.
2. **Nothing may break when assets 404.** All layout and animation logic must run with every image missing: reserve space with `aspect-ratio` / explicit dimensions, never gate a timeline or trigger on an image `load` event, zero console errors from missing files (the browser's own 404 noise is fine).
3. **The logo is an `<img src="assets/logo.svg">`**, never styled text. Do not recreate the multicolor wordmark in HTML/CSS — the asset is TBD on Joe's side.
4. **No build step, no frameworks.** Hand-editable HTML/CSS/JS. Joe will keep tinkering with this himself.
5. **Static hosting.** Must work on GitHub Pages and when served locally with `python3 -m http.server` (also degrade sanely when opened via `file://` — hence classic `<script defer>` tags, not ES modules).
6. **Multi-page:** `/gallery/` and `/resources/` are real pages. **`About` is not** — it's the in-page `#about` section on the homepage; the nav link is `/#about` from every page.
7. **Animation approach:** discrete DOM elements moved with transforms (already decided — no video scrubbing, no canvas frame sequences, no image-sequence pipeline).
8. Accent color used **very sparingly** — the Email pill is the only filled-accent element. "View the collection" is an outlined white pill, per the mockups.

## 3. Stack

- **HTML + CSS + vanilla JS**, plus **GSAP core + ScrollTrigger**, vendored into the repo (`js/vendor/gsap.min.js`, `js/vendor/ScrollTrigger.min.js` — grab from npm or cdnjs and commit the files; don't hotlink a CDN). GSAP has been fully free for all uses since Webflow acquired it in 2025, and ScrollTrigger's `pin` + `scrub` primitives map one-to-one onto this storyboard (pinned stage, scroll-scrubbed timeline, one-shot triggered tweens, `invalidateOnRefresh` for resize). Only these two files — no other GSAP plugins.
- **Why not native CSS scroll-driven animations:** support is still uneven outside Chromium, and the coordinated multi-element choreography here (shared pinned timeline, runtime-computed scale, one-shot triggers, hash-jump state recovery) would need heavy JS orchestration anyway. Revisit someday; not for this build.
- **Two animation driver classes** — keep this distinction sacred throughout §7:
  - **Scrubbed:** progress bound directly to scroll position (reversible, no own duration). Used for: annotation wipe, image shrink, card pop-out, title slides, headshot "coming loose" peek.
  - **Triggered:** plays once on crossing a threshold, on its own clock (time-based easing). Used for: secondary fade-ins after the strip, the headshot fall, the About reveal stagger. These consume **zero scroll distance** — Joe explicitly doesn't want scrolling to feel tedious, and the fall must accelerate like gravity, which only works on a time axis.

## 4. Repo structure

```
/
├── index.html
├── gallery/
│   └── index.html          # stub, §6.3
├── resources/
│   └── index.html          # stub, §6.3
├── css/
│   └── styles.css
├── js/
│   ├── vendor/gsap.min.js
│   ├── vendor/ScrollTrigger.min.js
│   ├── media-data.js       # Joe-editable carousel content, §8.4
│   ├── coverflow.js        # reusable component, §8
│   └── main.js             # config object + all choreography
├── assets/                 # Joe supplies everything here — manifest in §9
│   ├── fonts/
│   ├── album art/          # dropped in unchanged from the old site
│   └── movies/
└── CNAME                   # "josephkerby.com" (skip if repo already has one)
```

Use **root-relative URLs** (`/assets/…`, `/gallery/`) — the site lives at the domain root. Load order in every page: `gsap` → `ScrollTrigger` → `media-data` → `coverflow` → `main`, all `defer`.

Put every magic number in one `CONFIG` object at the top of `main.js` (scroll lengths, transform origin, annotation position, card aspect, emphasis scale, fall duration/variant, autoplay timings…). Joe tunes by editing that object only.

## 5. Design tokens

```css
:root {
  --bg: #0B0B0B;                       /* near-black, never pure black */
  --ink-100: #FFFFFF;                  /* primary text */
  --ink-70: rgba(255, 255, 255, 0.72); /* body / secondary */
  --ink-45: rgba(255, 255, 255, 0.45); /* captions, faint labels */
  --line: rgba(255, 255, 255, 0.22);   /* hairline dividers, outlined pills */
  --accent: #00FFB0;                   /* Email pill ONLY */
  --accent-ink: #06231A;               /* dark text on accent */

  --font-sans: 'Satoshi Variable', 'Satoshi', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  --font-display-edinburgh: 'Grenze Gotisch', serif;   /* placeholder pick, §7.5 */
  --font-display-london: 'Playfair Display', serif;    /* placeholder pick */
  --font-display-brussels: 'Michroma', sans-serif;     /* placeholder pick */

  --radius-card: 28px;
  --radius-pill: 999px;
  --header-h: 80px;
}
```

Hierarchy comes from **white opacity steps, not new colors**. Accent appears exactly once per viewport-ful, at most.

**Type roles**
- H1 (hero): Satoshi, weight 850–900, `clamp(3rem, 7vw, 6.25rem)`, line-height 1.02, letter-spacing −0.02em.
- Section headings ("Gallery", "More about me", "Mixtape", "Movies"): Satoshi 700, `clamp(1.75rem, 3.5vw, 3rem)`, `--ink-100`.
- Sans body: Satoshi 400–500, 1rem/1.6.
- Mono accents (hero intro paragraph, captions, badge text, pill labels, cf-meta sub-line): JetBrains Mono 400–700, 0.85–0.95rem, used *sparingly and intentionally* — if a stretch of UI is turning all-mono, pull back.
- City display titles: per-city font vars above; sizing in §7.5.

**Buttons**
- `.pill--accent` (Email only): accent fill, `--accent-ink` text, Satoshi 600, radius pill, padding ~10px 22px. Hover: brightness(1.06) + `scale(1.03)`, 150ms.
- `.pill--ghost` ("View the collection"): transparent fill, 1px `--line` border, `--ink-100` **mono** label (per mockup). Hover: border → `--ink-70`, subtle bg `rgba(255,255,255,.06)`.
- Focus-visible everywhere: 2px `--accent` outline, 3px offset.

## 6. Global chrome

### 6.1 Header (identical on all pages)

- `position: fixed; top: 0; inset-inline: 0; z-index: 100`. Content row height `--header-h`; layout: logo left · centered nav links (`About` `Gallery` `Resources`, Satoshi 500, `--ink-70` → `--ink-100` on hover/current) · `Email` pill far right.
- **Backdrop:** a gradient of the page bg fading to transparent — `linear-gradient(to bottom, rgba(11,11,11,1) 0%, rgba(11,11,11,0) 100%)` — but extending well *below* the content row (total ~160–180px tall, per the mockups' soft falloff) so photos slide under a long fade rather than a hard edge. Implement the tall gradient as a `pointer-events: none` layer (e.g., `header::before`) with the interactive row (`pointer-events: auto`) on top. No blur, no solid bar.
- Logo: `<img src="/assets/logo.svg" alt="Joseph Kerby — home">`, height ~40px, wrapped in a link to `/`.
- `Email` → `mailto:hello@josephkerby.com` (address carried over from the old site — **Joe: confirm**, §14).
- `About` → `/#about`. On the homepage, smooth-scroll (`scroll-behavior: smooth` on `html` is enough); from other pages it's a normal navigation with hash. See §12.3 for the arrive-mid-page state rule this creates.

### 6.2 Footer (homepage; reuse on stubs)

Hairline `--line` top border, centered mono `--ink-45` small text:
`© Joseph Kerby Anderson, <span data-year>2026</span>. All Rights Reserved.`
One line of JS sets `data-year` to the current year; the static text is the no-JS fallback.

### 6.3 Stub pages (`/gallery/`, `/resources/`)

Same header + footer. Each: an h1 (`Gallery` / `Resources`) in the standard heading style plus one short mono line — Gallery: `Full collection coming soon.` · Resources: `Coming soon.` Vertically centered in the viewport, nothing else. These get their own specs later; the only job now is that no nav link or "View the collection" click 404s.

---

## 7. Homepage choreography (the core)

DOM order: `header` → `#hero` → `#journey` (pinned sequence) → `#about` (divider + drop + about content) → `footer`.

### 7.1 Hero (storyboard Frame 1)

- 100vh section. Background: `assets/hero.jpg` as a full-bleed `<img>` (`object-fit: cover`), **not** a CSS background — we want natural 404 behavior and `fetchpriority="high"`.
- Legibility overlay: gradient coming **from the right** (`linear-gradient(to left, rgba(11,11,11,.82), rgba(11,11,11,.35) 45%, transparent 70%)`), tuned so the right third is calm enough for copy. A faint left-edge vignette like the mockup is fine but optional.
- Copy block, right side, vertically centered:
  - H1: `Hey, I'm Joe!`
  - Intro paragraph in **mono**, `--ink-100` at ~0.95rem/1.7, max-width ~46ch (verbatim copy in §10).
- Scroll cue, bottom center: mono `--ink-70` text `Scroll ↓` with a slow 2.5s ease-in-out float loop (±6px). Fades out (0.3s) permanently after the first meaningful scroll (>40px). Treatment is explicitly "not married to" territory — keep it this simple.
- The hero is **not pinned**; it scrolls away normally into the journey.

### 7.2 The journey — one pinned, scrubbed sequence (Frames 2–4)

**Structure.** `#journey` is a wrapper whose scroll length is `CONFIG.JOURNEY_SCROLL_VH = 350` (i.e., the pin lasts ~3.5 viewport-heights of scrolling — long enough to breathe, short enough to never feel like a treadmill). Inside it, a 100vh **stage** that ScrollTrigger pins (`pin: stage, start: 'top top', end: '+=' + vh(350), scrub: 0.6, anticipatePin: 1`). One master GSAP timeline is scrubbed across the whole pin. The stage has `overflow: hidden`.

**Stage contents** (all present in markup from the start):

```
.stage
├── .strip-heading        ("Gallery" — hidden until reveal)
├── .strip                (3-column card row, centered, max-width min(92vw, 1280px))
│   ├── .card.card--edinburgh
│   ├── .card.card--london   ← the hero of the sequence
│   └── .card.card--brussels
├── .strip-captions       (Edinburgh / London / Brussels — hidden until reveal)
└── .strip-cta            ("View the collection" ghost pill — hidden until reveal)
```

Each `.card`: `aspect-ratio: 2/3`, `border-radius` animates 0 → `--radius-card` (London) / fixed radius (sides), `overflow: hidden`, and internally stacks (bottom → top):

1. `img.card-full` — the photograph, `object-fit: cover`, fills the card.
2. `.card-title` — the city display text (§7.5).
3. `img.card-cutout` — transparent-background foreground duplicate, **absolutely positioned `inset: 0` with identical `object-fit`/`object-position` to `.card-full`** so the two register pixel-perfectly at any scale. `aria-hidden="true"`, `pointer-events: none`. Loaded via `data-src` swap when the journey trigger first enters (§12.4) — never needed before the pop-out.

**Z-order rule that makes reverse-scrolling free:** London's card wrapper sits above the side cards, which sit above heading/captions/CTA. When London is scaled up full-bleed it therefore covers *everything* in the stage, so scrubbing backward re-covers the revealed text without any un-reveal logic.

**Beat 1 — full-bleed London sky (Frame 2).**
At timeline start, the London card is scaled up so its photo covers the viewport: `S0 = max(vw / cardW, vh / cardH) * 1.02`, computed in a `ScrollTrigger` `invalidateOnRefresh` context, `transform-origin: 50% CONFIG.ORIGIN_Y` with `ORIGIN_Y = '38%'` as the starting guess. Because the full-bleed "sky" view is *the same photo cropped in* — no separate asset, no panning — the entire beat is pure `scale`, and `ORIGIN_Y` is the one knob that decides which band of the photo (the sky/flag/plane) shows at S0. Tune it once the real `london-full.jpg` exists; leave a comment saying exactly that.

The annotation (`assets/annotation-ba266.svg`, label + curved arrow as one combined SVG) lives **inside the London card**, absolutely positioned at `CONFIG.ANNOTATION = { left: '58%', top: '16%', width: '30%' }` (percent of card box, so it scales in lockstep with the photo and stays glued to the plane; it only ever displays at S0, so size it to look right full-bleed). Visible from the moment the pin starts.

**Beat 2 — the erase (Frame 2→3 transition).**
Scrubbed wipe, *not* a fade: animate the annotation's `clip-path` from `inset(0 0 0 0)` to `inset(0 0 0 100%)` — a left-to-right erase so the text disappears first and the arrowhead last, matching the mockup's mid-state. Keep it this simple; no literal eraser theatrics. The annotation must be **fully gone before any shrinking begins**.

**Beat 3 — shrink + pop-out (Frame 3).**
- London: `scale S0 → 1`, `border-radius 0 → var(--radius-card)`, ease `power2.inOut` across its scrub segment. No translation.
- Edinburgh & Brussels start stacked behind London (`x: 0`, `scale: 0.92`, lower z), then translate to their grid slots — Edinburgh left, Brussels right — with `scale → 1` and ease `back.out(1.2)`: a small overshoot that reads as the mockups' "pop out," and reverses playfully when scrubbed backward. Their motion starts partway into London's shrink (overlap ≈ 40%) so the reveal feels caused by the shrink.
- End state: three cards side by side; **London keeps `scale: CONFIG.CENTER_EMPHASIS = 1.04`** — the "slightly emphasized, traces its original position" note. Sides at 1.0.
- Implementation note: build the strip as a real 3-column grid/flex layout at rest, and animate the cards *from* transformed states (GSAP `from`-style values on the master timeline). The resting layout is the source of truth; the animation is an offset from it.

**Beat 4 — title slides (Frame 4).**
Each `.card-title` is scrubbed in, staggered (Edinburgh begins first, Brussels last, ~40% overlap), each with ease `power3.out`:
- Edinburgh: whole two-line block slides in **from the left** (`xPercent: -110 → 0`).
- London: two independent parts — `LONDON` from the **left**, `ENGLAND` from the **right**.
- Brussels: two-line block from the **right** (`xPercent: 110 → 0`).

**Containment is non-negotiable:** titles are clipped by their own card (`overflow: hidden` on the card) and must never be visible over the background or a neighboring card at any scrub position. The cutout layer sits *above* the title, so buildings appear in front of the sliding text — the pseudo-3D depth effect. Nothing special to do beyond the z-stack; it works because the cutout registers over the full photo.

**Beat 5 — secondary reveal (end of Frame 4).**
When the scrub crosses `CONFIG.REVEAL_AT = 0.9` of the master timeline, fire a **one-shot triggered** stagger (this is deliberately *not* scrubbed — it must cost no scroll distance): `.strip-heading`, then the three captions, then the CTA — fade from 0 + rise 14px, 0.5s each, 0.12s stagger, `power2.out`. Once played, it never un-plays; reverse-scrubbing is handled by the z-order rule above. Guard with a `played` flag.

Shortly after (timeline end), the pin releases and the completed gallery preview scrolls away as normal content.

### 7.3 Divider + the falling headshot (Frame 5)

Right after the journey, inside the top of `#about`:

- A hairline divider (`--line`, ~92% width, centered). Its whole job is to be the physical thing the headshot falls out from behind.
- `#about` has `overflow: clip`. The headshot `img` (`assets/headshot.jpg`, radius `--radius-card`) lives **in its real About-grid slot** (§7.4) — the fall is a GSAP `from`-offset back up to a start point tucked behind the divider (mostly above `#about`'s top edge, hence clipped). Computing the offset from real layout (`slotRect` vs. a point just under the divider) keeps the markup semantic and guarantees the fall lands *exactly* in the layout slot at any viewport size. Start point is **slightly off-center on purpose** (`CONFIG.DROP_START_X = '46vw'` — a touch left of center), initial rotation ≈ −6°, ~92% hidden.
- **Phase 1 — coming loose (scrubbed).** ScrollTrigger on the divider (`start: 'top 75%'`, `end: 'top 55%'`, scrub): rotation −6° → −11°, y down ~8% of its height — one corner slips out and pivots, reading as a stuck object working free, *not* a uniform scroll-reveal.
- **Phase 2 — the fall (triggered, one-shot).** Crossing `'top 55%'` fires a time-based tween, `CONFIG.FALL_DURATION = 1.25s`, keyframed:
  - 0 → 55%: gravity. Mostly vertical, `power2.in` (accelerating — this is the whole point), rotation swinging −11° → +7°, slight leftward drift beginning.
  - 55 → 100%: **Variant B — the "magic pull" (default).** The photo gets redirected mid-fall: curves left and grows (`scale → ~1.16` relative to its start size — in practice, just arrive at the natural slot size), rotation settles to 0, `power3.out` deceleration into its resting place. One continuous motion; no impact.
  - *Variant A (implement behind `CONFIG.FALL_VARIANT = 'A' | 'B'`, default `'B'`):* replace the second keyframe with an impact settle — overshoot the resting y by ~14px, one small rebound, rotation wobbling ±2° before zeroing. Joe hasn't decided between these; make switching a one-character change.
- Fall is one-shot per page load; scrolling back up leaves it settled (reversing gravity looks wrong).
- `onComplete` of the fall → the About reveal (§7.4).

### 7.4 "More about me" — the About section (Frame 6)

This **is** the About page (nav anchor target `id="about"`), not a teaser.

Layout: `h2` "More about me", then a two-column grid (`minmax(340px, 420px) 1fr`, gap ~64px):

- **Left column:** the settled headshot; beneath it a centered mono caption `Joseph K. Anderson`; beneath that, three credential badges — each a row of icon (~44px) + bold mono title + one short mono `--ink-45` description line:
  1. `UVM Student` — icon `assets/badge-uvm.png` — description `TODO(JOE)`
  2. `Licensed EMT` — icon `assets/badge-emt.png` — description `TODO(JOE)`
  3. Third badge — icon `assets/badge-3.png` — title + description `TODO(JOE)` (content undecided; ship the slot with obvious placeholder text)
- **Right column:** two stacked modules, each an h3 (`Mixtape`, `Movies`) + a coverflow instance (§8). Mixtape: square covers. Movies: 2/3 poster covers.
- **Reveal:** everything except the headshot starts at opacity 0 and plays a **triggered** stagger on the fall's `onComplete`: heading → name caption → badges (in order) → Mixtape module → Movies module. 0.5s each, 0.12s stagger, rise 14px, `power2.out`. Not scrubbed.

Footer follows (§6.2).

### 7.5 City display titles — treatment

Large display text overlaid on the upper area of each card, e.g. `font-size: clamp(1.9rem, 3.4vw, 3.6rem)`, line-height 0.95, `--ink-100` (the cutout layer and photo contrast do the rest; add a faint `text-shadow: 0 2px 24px rgba(0,0,0,.35)` only if legibility demands it).

Render them as **live HTML text** for now, one distinct typeface per city (this section is where the site's "unique/custom typefaces" live — the one place the type gets loud):

| Card | Lines | Enters from | Face (placeholder pick — Joe may swap) |
|---|---|---|---|
| Edinburgh | `EDINBURGH` / `SCOTLAND` | left | `Grenze Gotisch` (ornate blackletter energy, per mockup) |
| London | `LONDON` / `ENGLAND` | left / right | `Playfair Display` (high-contrast Didone, per mockup) |
| Brussels | `BRUSSELS` / `BELGIUM` | right | `Michroma` (wide squared techno, per mockup) |

Load these three from Google Fonts for now (`display=swap`). Structure each title as its own element with a per-city font var so swapping a face — or replacing the whole title with an SVG asset later, which Joe is still considering — touches one line. Exact styling is explicitly "vibe only, open to iteration."

---

## 8. Coverflow component (replaces the old iTunes slider)

The old site's cover flow (in the old `index.html`) had the right *look*; we're keeping its proven transform math and replacing the implementation with one small reusable component. What changes and why:

- **One factory, two instances.** The old code was a single-purpose IIFE hard-wired to the mixtape. New: `createCoverflow(rootEl, options)` in `js/coverflow.js`, instantiated once for Mixtape (square) and once for Movies (posters).
- **Cross-browser reflections.** Old: `-webkit-box-reflect` (WebKit/Blink only — no Firefox). New: each cover is a small stack — the image plus a mirrored copy (`transform: scaleY(-1)`, `aria-hidden`, `mask-image: linear-gradient(to top, rgba(0,0,0,.28), transparent 45%)`) sitting directly beneath it. Same iTunes look, works everywhere.
- **Wheel handling that respects the page.** Old: any vertical wheel delta over the widget flipped covers *while the page also scrolled*. New: only react when horizontal delta dominates (`|deltaX| > |deltaY|`); vertical scrolling passes through untouched. Never `preventDefault` page scroll.
- **Keyboard + a11y.** Root: `role="region"`, `aria-roledescription="carousel"`, `aria-label`, `tabindex="0"`; ←/→ step covers when focused; autoplay pauses while hovered *or focused*; meta text lives in an `aria-live="polite"` element (the old site had this — keep it).
- **Reduced motion:** no autoplay, transitions cut to 0.15s (§12.2).
- **No new dependencies** — this stays ~120 lines of vanilla JS + CSS transitions; GSAP is not needed here.

### 8.1 Options

`{ items, aspect: '1/1' | '2/3', coverHeight: 220, autoMs: 4000, resumeMs: 6000 }`
(Old site used 2800/3200 — felt rushed; these are the new defaults, in `CONFIG`.)

### 8.2 Layout math (carried over from the old site — it worked)

For each item at signed offset `o` from the centered index:
`translateX(o * spread)` · `translateZ(-min(|o| * 120, 600))` · `rotateY(sign(o) * min(|o| * 36, 60)deg)` · `scale(max(1 - |o| * .08, .7))`, `z-index: 1000 - |o|`, with `spread ≈ 0.82 × coverWidth`. Transition `transform .6s ease, opacity .6s ease`. **Improvement:** opacity falls to **0** by `|o| ≥ 4` (the old floor of 0.45 left ghost covers loitering at the clip edge).

Behaviors carried over: click a side cover to center it; drag with 60px paging threshold (pointer events, mouse + touch); autoplay advances one cover per tick, pauses on interaction, resumes after `resumeMs`. Below the stage: the meta block — title (Satoshi 600, `--ink-100`) over sub-line (mono, `--ink-45`) — cross-fading on change.

### 8.3 Container

`perspective: 1400px`, `overflow: clip`, `contain: layout paint`, height ≈ `coverHeight + reflection allowance` (~360px desktop / 300px mobile for the mixtape; taller for 2/3 posters).

### 8.4 Content — `js/media-data.js` (the whole "CMS")

Two plain arrays of `{ src, title, sub }` that Joe edits by hand. Apply `encodeURI(src)` when setting `img.src` — the album-art filenames contain spaces and apostrophes, and that's fine.

**MIXTAPE — seed with Joe's existing curation from the old site, verbatim.** His current `assets/album art/` folder drops into the new repo unchanged and everything just works:

```js
const MIXTAPE = [
  { src: "/assets/album art/Hold The Girl.jpg", title: "This Hell", sub: "Rina Sawayama • Hold The Girl" },
  { src: "/assets/album art/Love Songs.png", title: "Let’s Stay Together", sub: "Tina Turner • Love Songs" },
  { src: "/assets/album art/Taking the Long Way.jpg", title: "Not Ready to Make Nice", sub: "The Chicks • Taking the Long Way" },
  { src: "/assets/album art/Version 2.0 (20th Anniversary Deluxe Edition).jpg", title: "I Think I’m Paranoid", sub: "Garbage • Version 2.0" },
  { src: "/assets/album art/Andor_ Season 2 - Vol. 1 (Episodes 1-3) [Original Score].jpg", title: "Brasso", sub: "Brandon Roberts • Andor Season 2" },
  { src: "/assets/album art/Rumours.jpg", title: "Silver Springs", sub: "Fleetwood Mac • Rumors" },
  { src: "/assets/album art/Sing to the Moon.jpg", title: "Green Garden", sub: "Laura Mvula • Sing to the Moon" },
  { src: "/assets/album art/The Rise and Fall of a Midwest Princess.jpg", title: "Naked in Manhattan", sub: "Chappell Roan • The Rise and Fall of a Midwest Princess" },
  { src: "/assets/album art/Speak Now (Taylor's Version).jpg", title: "Mine", sub: "Taylor Swift • Speak Now (Taylor’s Version)" },
  { src: "/assets/album art/Writer's Block.jpg", title: "Young Folks", sub: "Peter Bjorn and John • Writer’s Block" },
  { src: "/assets/album art/Celebration (Deluxe Version).jpg", title: "Vogue", sub: "Madonna • Celebration" },
  { src: "/assets/album art/Greatest Hits - Chapter One.jpg", title: "Catch My Breath", sub: "Kelly Clarkson • Greatest Hits Chapter One" },
  { src: "/assets/album art/It's Not Me, It's You (Deluxe Version).jpg", title: "The Fear", sub: "Lily Allen • It’s Not Me, It’s You" },
  { src: "/assets/album art/Smile.jpg", title: "Never Really Over", sub: "Katy Perry • Smile" },
  { src: "/assets/album art/reputation.jpg", title: "Dress", sub: "Taylor Swift • Reputation" },
  { src: "/assets/album art/Tapestry.jpg", title: "I Feel the Earth Move", sub: "Carole King • Tapestry" },
  { src: "/assets/album art/Some-Girls.png", title: "Before They Make Me Run", sub: "The Rolling Stones • Some Girls" },
  { src: "/assets/album art/Bob-Dylan.png", title: "Hurricane", sub: "Bob Dylan • Desire" },
  { src: "/assets/album art/Neon Moon.png", title: "Neon Moon", sub: "Brooks & Dunn • Brand New Man" },
  { src: "/assets/album art/London Calling (Expanded Edition).jpg", title: "Lost in the Supermarket", sub: "The Clash • London Calling" }
];
```

**MOVIES — new; Joe hasn't curated yet.** Ship three template rows he can extend (clean numeric filenames, since these assets don't exist yet):

```js
const MOVIES = [
  { src: "/assets/movies/01.jpg", title: "TODO(JOE): Movie title", sub: "TODO(JOE): e.g. 1999 • Director" },
  { src: "/assets/movies/02.jpg", title: "TODO(JOE)", sub: "TODO(JOE)" },
  { src: "/assets/movies/03.jpg", title: "TODO(JOE)", sub: "TODO(JOE)" }
];
```

The sub-line format is free-text on purpose — a streamlined content backend is explicitly out of scope for now.

---

## 9. Asset manifest

Everything below is *referenced by the code from day one* and supplied by Joe afterward. Recommended sizes keep GitHub Pages snappy without a build pipeline.

| Path | What | Recommended | Notes / alt text |
|---|---|---|---|
| `/assets/logo.svg` | Header wordmark | ~200×56 viewBox | `alt="Joseph Kerby — home"`. Never recreated in code. |
| `/assets/hero.jpg` | Hero background | ≥2400px wide, landscape, ≤450KB | `alt="Joe standing against a stone wall in Edinburgh"`. Right third should stay calm for copy — note this in a code comment for Joe. `fetchpriority="high"`, eager. |
| `/assets/annotation-ba266.svg` | "British Airways Flight 266" label + curved arrow, one combined SVG, transparent | ~600×420 viewBox | Decorative: `alt=""` / `aria-hidden`. Text is baked into the asset — no HTML text. |
| `/assets/london-full.jpg` | Center card photo (Whitehall building, flag, plane) | 1400×2100 (2:3), ≤400KB | `alt="Government building in London with a Union Jack and a plane overhead"`. Eager load (it's on screen at pin start). |
| `/assets/london-cutout.png` | Foreground-only duplicate (sky removed) | **Exactly 1400×2100 — same canvas/crop as the full** | `aria-hidden`. Lazy via `data-src` (§12.4). |
| `/assets/edinburgh-full.jpg` | Left card (Victoria Street cobblestones) | 1400×2100 | `alt="Colorful shopfronts on a cobblestone street in Edinburgh"` |
| `/assets/edinburgh-cutout.png` | Foreground-only duplicate | Same canvas as full | `aria-hidden`, lazy |
| `/assets/brussels-full.jpg` | Right card (Town Hall spire, flags) | 1400×2100 | `alt="Gothic spire of Brussels Town Hall with EU and Belgian flags"` |
| `/assets/brussels-cutout.png` | Foreground-only duplicate | Same canvas as full | `aria-hidden`, lazy |
| `/assets/headshot.jpg` | About headshot | 1200×1200 (1:1) | `alt="Portrait of Joe"` |
| `/assets/badge-uvm.png` | Badge icon 1 | ~240×240, transparent | `alt=""` (decorative; title text carries meaning) |
| `/assets/badge-emt.png` | Badge icon 2 | ~240×240, transparent | `alt=""` |
| `/assets/badge-3.png` | Badge icon 3 (TBD) | ~240×240, transparent | `alt=""` |
| `/assets/album art/…` | Mixtape covers | as-is | **Copied unchanged from the old site** — filenames already match §8.4 |
| `/assets/movies/01.jpg …` | Movie posters | 800×1200 (2:3) | Joe adds as he curates |
| `/assets/fonts/Satoshi-Variable.woff2` | Primary face | — | Download from Fontshare (free license covers self-hosted web use); `@font-face`, `font-display: swap`, weight range 300–900 |
| `/assets/fonts/JetBrainsMono-Variable.woff2` | Mono face | — | OFL; self-host, `swap` |
| `/assets/favicon.svg` | Favicon | — | Optional but wire the `<link>` now |
| `/assets/og.jpg` | Social share card | 1200×630 | Optional; wire the meta tags now |

**Registration warning (repeat it as a code comment):** every `-cutout.png` must be exported at the *identical* pixel dimensions and crop as its `-full.jpg`. The depth effect works by absolute overlay; a 1px crop difference reads as a glitch at card scale.

City display fonts (`Grenze Gotisch`, `Playfair Display`, `Michroma`) come from Google Fonts for now rather than `assets/fonts/` — they're placeholder picks Joe is likely to swap (§7.5).

---

## 10. Copy deck (verbatim — treat as content, not suggestions)

| Location | Copy |
|---|---|
| Hero H1 | `Hey, I'm Joe!` |
| Hero intro (mono) | `I'm a junior at the University of Vermont's Grossman School of Business. Concentrating in marketing with a minor in Emergency Medical Services (EMS). Welcome to my personal website, I hope you enjoy it!` |
| Scroll cue | `Scroll ↓` |
| Nav | `About` · `Gallery` · `Resources` · button `Email` |
| Card titles | `EDINBURGH` / `SCOTLAND` — `LONDON` / `ENGLAND` — `BRUSSELS` / `BELGIUM` |
| Strip heading | `Gallery` — *copy TBD; Joe is open to an alternative treatment here and it need not be an H1-weight moment. Mark with `TODO(JOE)` comment.* |
| Card captions (mono) | `Edinburgh` · `London` · `Brussels` |
| Strip CTA (ghost pill, mono) | `View the collection` → `/gallery/` |
| About heading | `More about me` |
| Name caption (mono) | `Joseph K. Anderson` |
| Badges | `UVM Student` / `Licensed EMT` / third `TODO(JOE)` — all description lines `TODO(JOE)` |
| Module headings | `Mixtape` · `Movies` |
| Footer | `© Joseph Kerby Anderson, 2026. All Rights Reserved.` (year auto-updates) |
| Stub pages | Gallery: `Full collection coming soon.` · Resources: `Coming soon.` |

Mark every `TODO(JOE)` in HTML comments so they're greppable.

## 11. Responsive behavior — ⚠ flagged assumption

The storyboard is desktop-only; everything in this section is Fable's proposal, not Joe's mockups. Implement it, but treat it as the most likely area of revision. Breakpoint: **820px**.

- **Header:** tighter padding, logo ~32px, nav links 13–14px — all three still fit inline; **no hamburger** (keep it DIY-simple). Email pill shrinks accordingly.
- **Hero:** legibility gradient comes **from the bottom** instead of the right; copy block sits lower-left; type clamps already handle scale.
- **Journey:** run the same pinned sequence — beat 1's full-bleed sky crop actually suits portrait screens. Adaptation: at rest, cards are ~78vw wide in a horizontal **scroll-snap row** (order unchanged), London centered with Edinburgh/Brussels peeking ~10% at the edges during the pin; the pop-out translates the side cards to those peek positions. Titles still slide inside their cards. After the pin releases, the row is swipeable. Heading, captions (attached beneath each card), and CTA stack in flow below.
- **Drop + About:** identical beats; fall distance in `vh` so it scales naturally. About collapses to one column: headshot → name → badges → Mixtape → Movies. Coverflow: stage ~300px, covers ~180px (square) with the poster instance scaled proportionally.
- If any pinned-sequence element fights small screens in practice, prefer simplifying motion over breaking layout — but don't silently drop the sequence on mobile without flagging it.

## 12. Robustness, accessibility, performance

1. **No-JS = final state.** `<html class="no-js">`, swapped to `js` by a one-line inline script in `<head>`. Every pre-animation state (hidden titles, offset cards, transparent About content, scaled-up London, tucked-away headshot) is applied **only under `.js`** (CSS initial states + GSAP sets). With JS off, the page renders as the completed layout, fully readable.
2. **`prefers-reduced-motion: reduce`:** don't create the ScrollTriggers or the fall — render the final layout statically; scroll cue static; coverflows: no autoplay, transitions 0.15s, manual controls still work. Simple opacity fades may remain.
3. **Load-mid-page correctness.** Arriving at `/#about` from another page, or refreshing mid-scroll, must show correct state: scrubbed animations recover automatically from scroll position (that's what scrub means); the two **one-shots** (secondary reveal, fall + About reveal) must check on init whether their trigger point is already above the viewport and, if so, `gsap.set` their end states instantly instead of animating. Never let a hash-jump land on an invisible About section.
4. **Cutout preloading:** cutouts use `data-src`; swap to `src` on the journey ScrollTrigger's first `onEnter` so they're decoded before the pop-out — early enough to be ready, late enough to keep them out of the initial load, per the brain doc.
5. **Loading strategy:** `hero.jpg` and `london-full.jpg` eager (`fetchpriority="high"` on hero); every other image `loading="lazy"`; reflections `aria-hidden` + lazy. All `<img>` get `width`/`height` or a CSS `aspect-ratio` — zero CLS with or without assets present.
6. **Animation hygiene:** transforms + opacity only (no layout/filter animation); `will-change` on journey cards and the falling headshot, removed after settle; `ScrollTrigger` with `invalidateOnRefresh: true` and recomputed `S0`; call `ScrollTrigger.refresh()` after `document.fonts.ready` so pin distances aren't measured against fallback fonts. If iOS address-bar resizing causes pin jitter, `ScrollTrigger.normalizeScroll(true)` is the known fix — leave it off by default with a comment.
7. **Never hijack scroll.** Scrub only; no wheel/touch interception at page level (coverflow rule in §8).
8. **Semantics:** `header/nav/main/section/footer` landmarks; one `h1` (hero); `h2` for strip heading + About; `h3` for Mixtape/Movies; alt text per §9; visible focus everywhere (§5).
9. **Meta:** `<title>Joseph Kerby Anderson</title>`, description, OG/Twitter tags pointing at `/assets/og.jpg`, favicon link, `<meta name="theme-color" content="#0B0B0B">`.

## 13. Acceptance checklist (verify before calling it done)

- [ ] With **every** asset 404ing: layout intact, all animations run, no JS console errors.
- [ ] Annotation is fully erased **before** the London image begins shrinking, at any scroll speed, forward or reverse.
- [ ] The shrink is pure scale — no panning/repositioning of the London photo.
- [ ] Side cards visibly emerge **from behind** the center card with a playful eased pop, and land in a clean 3-across strip with the center slightly emphasized.
- [ ] No title glyph is ever visible outside its own card's bounds at any scrub position.
- [ ] Cutout layers sit above title text and register perfectly over their full photos.
- [ ] Heading / captions / "View the collection" fade in on their own clock after titles finish — they consume no scroll distance, and scrubbing backward doesn't glitch them.
- [ ] Headshot: peek reads as "stuck object coming loose" (corner first), fall visibly **accelerates**, drifts left, grows, settles exactly into the About grid slot; one-shot; `FALL_VARIANT` toggles A/B cleanly.
- [ ] About content staggers in after the fall; direct `/#about` navigation (from `/gallery/` and cold load) shows the completed section.
- [ ] Both coverflows share one component; autoplay pauses on hover/focus/interaction and resumes; reflections render in Firefox; vertical scrolling over a coverflow scrolls the page.
- [ ] `Email` opens `mailto:`; every nav link works from every page; no route 404s.
- [ ] `prefers-reduced-motion` yields a calm, complete, static site; no-JS renders final state.
- [ ] Footer year auto-updates; falls back to static text without JS.
- [ ] Resize mid-pin (including DevTools device toggle) doesn't wedge the sequence — states recompute.
- [ ] Lighthouse: no CLS from image slots; total JS ≲ 100KB gzipped (GSAP core + ScrollTrigger + ~three small files).

## 14. Decisions made on open TBDs (defaults Joe can veto) + open items

**Defaults chosen by this spec** — each is one knob/comment away from changing:
1. Fall ending: **Variant B** ("magic pull" redirect) default; Variant A (impact settle) behind `CONFIG.FALL_VARIANT`.
2. Scroll cue: minimal mono + slow float, permanent fade after first scroll.
3. Annotation erase direction: left → right (text first, arrowhead last).
4. Center-card emphasis: `scale 1.04`.
5. Strip heading: keep `Gallery` as an h2-weight heading for now.
6. City titles: **live text** with three named placeholder faces (§7.5); structured so a later swap to SVG assets is trivial.
7. Email address: `hello@josephkerby.com`, carried over from the old site.
8. Mixtape: seeded verbatim with the old site's 20-track curation and its existing `album art/` folder.
9. Movies sub-line: free-text (`Year • Director` suggested), matching the music pattern.
10. Coverflow pacing: 4s per cover / 6s resume (old site's 2.8s/3.2s felt rushed).
11. Mobile plan: §11 in full — the one section with no mockups behind it.
12. Accent: `#00FFB0` kept, as a single `--accent` token. (Since Joe isn't married to it: swapping is a one-line edit, worth auditioning a couple of alternatives once real photos are in — neon-green-on-near-black is a common pairing, and the photography + city type are what make this site distinctive.)

**Open items for Joe** (site works fine before these land):
- Supply every file in §9 (cutouts at identical canvas size — see warning).
- Confirm `hello@josephkerby.com` is still the address.
- Badge 3 content + all three badge description lines; strip-heading copy if not "Gallery".
- Curate `MOVIES` in `js/media-data.js`.
- Review §11 (mobile) — the one wholly proposed section.
- Later: dedicated Gallery + Resources page specs.
