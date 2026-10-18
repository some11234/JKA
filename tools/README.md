# tools/

## build-gallery.py

Regenerates `assets/gallery/web/` and prints the data used by
`js/gallery-data.js`, reading from `assets/gallery/Originals/`.

**It never writes inside `Originals/`** — that folder is read-only input, and is
gitignored so its 135 MB never reaches GitHub Pages.

    python3 tools/build-gallery.py <cache-dir>

For each photo it applies EXIF orientation, converts wide-gamut (Display P3)
masters to sRGB, writes a 900px `-thumb.webp`, a 1400px `-mid.webp` and a 2000px
`-large.webp`, and reads out the real camera settings and GPS. Place
names come from a one-time reverse geocode cached in `<cache-dir>/geocache.json`
— rerunning with the cache present makes no network calls.

To add a collection, add its folder to `ORDER` at the top of the script and
create `gallery/<slug>/index.html` from any existing one.

## build-travel-map.js

Writes `assets/travel/countries.json`, the world map the travel page's globe is
drawn from. **Adding a country to the page never needs this** — that's an edit
to `js/travel-data.js`. Rerun it only to change how much coastline detail the
globe carries.

    npm install --no-save world-atlas@2 topojson-client@3 topojson-simplify@3 \
                          d3-geo@3 i18n-iso-countries@7
    node tools/build-travel-map.js

It starts from world-atlas's 50m map (the smaller 110m one leaves out the
Vatican, Monaco, Malta and 61 other places) and thins it to about a third of the
size, keeping every small country at full detail so none of them vanish. It also
bakes a two-letter ISO code into each country, which is how `js/travel-data.js`
refers to them. The output is deterministic — rerunning with the same settings
gives a byte-identical file. `node_modules/` from the install is gitignored.

Map data: Natural Earth (public domain), via world-atlas (ISC). The globe itself
uses d3-array, d3-geo and topojson-client (all ISC), vendored in `js/vendor/`.

## The travel page

`/travel/` is live but **unlisted**: it isn't in the nav on any page, and it
carries `<meta name="robots" content="noindex">`. To launch it, delete that tag
from `travel/index.html` and add `<a href="/travel/">Travel</a>` to `.site-nav`
on every page. Its content — countries, cities, photos, links — all lives in
`js/travel-data.js`.

## build-passport.py

Regenerates the cover, the data page's eagle, and the stamp images in
`assets/passport/web/` from the masters in `assets/passport/` (the uploaded
PNGs, never modified).

    pip install pillow numpy
    python3 tools/build-passport.py            # everything
    python3 tools/build-passport.py stamps     # or one part: cover, front, stamps

The `front` part also needs cairosvg, and cairo from Homebrew:

    pip install cairosvg
    DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib python3 tools/build-passport.py front

It re-prints and pads the cover, makes the foil mask that limits the cover's
glint to the gold, and a leather-grain tile. Its geometry constants are
mirrored in `CONFIG.BOOK` in `js/passport.js` — change one, change both.

The `front` part makes `eagle.webp`, the eagle on its stars-and-stripes
shield in the data page's seal (see "The front spread" below). Its master is
`assets/passport/eagle-and-shield.svg`, an engraving from the *Yellowstone
Monitor* of 1911 traced by johnny_automatic for
[Openclipart](https://openclipart.org/detail/188847/eagle-and-shield) (public
domain). It is deliberately not the Great Seal. It's alpha only; the page
inks it in its blue.

The cover is **re-coloured**, not just copied: the script reads how much of
each pixel of `Passport Cover.png` is foil (by where its colour falls between
the master's flat navy and flat yellow, `SRC_NAVY` / `SRC_FOIL`), then prints
it again on a deeper navy with the foil as metal — a gold ramp lit from the
upper left, pressed into the leather, carrying a faint copy of the grain. A
new master has to stay two flat colours; if its colours change, re-sample
those two constants. Everything else that sets the look (`COVER_NAVY`,
`GOLD_RAMP`, the `FOIL_*`, `DEBOSS*` and `GRAIN_*` values) is at the top of
the script, and is seeded, so rebuilds are identical. Two values live in two
places: `COVER_NAVY` is `--navy` in `css/passport.css`, and `GRAIN_TILE` is
`--grain` in `js/passport.js`. The rest of the lighting — the key light, the
leather's sheen, the moving glint on the foil, the falloff toward the edges —
is CSS over the image (the `.pp-cover` rules), so it can be tuned without a
rebuild.

### Stamps

The visa pages carry Joe's American Express travel stamps. Every master named
`<Country> <Year>.png` in `assets/passport/` is one: the script trims it to
its perforated edge and writes `stamp-<country>-<year>.webp` (lowercased,
spaces to hyphens — `United Kingdom 2026.png` → `stamp-united-kingdom-2026.webp`).
On the way it ages each one slightly, to sit on the weathered pages: inks a
little faded, whites yellowed to cream, blacks worn to brown-black, a soft
uneven toning, grime in the perforations and a speck or two of foxing. How
much of each is `STAMP_AGE` at the top of the script; it's seeded per stamp,
so rebuilds are byte-identical. The masters are never touched.

Where each one sits is `PASSPORT_STAMPS` in `js/passport-data.js`: the page
(from 1; odd on the left, even on the right), the stamp's centre as a
percentage of the page, and a small tilt, so they look stuck in by hand. Under
each, the country and year are rubber-stamped in blue ink, from the same
`name` and `year`; where a neighbouring stamp would cover the middle of that
mark, `ink: 'left'` (or `'right'`) lines it up with one edge instead.
They're listed in the order Joe went, front of the book to back, like a real
passport, four to a page: two rows of two, one in each quarter the page's
guide marks show (the comment above the list gives the numbers). To add one,
drop in the PNG, run `python3 tools/build-passport.py stamps`, and add a line
to that list, in the next free quarter. To move
one, change its line — no rebuild. If it goes on a page past the last one
there is, the book grows to reach it: rerun `build-visa-paper.py` (below) so
the new pages have paper.

Each stamp is its own element inside its page, so it turns with the leaf and
takes its lighting. With a mouse, a stamp lifts a little off the page under
the pointer; a click on it still turns the page. That's why the page-turn
buttons (`.pp-tap`) sit under the book in `css/passport.css`: the book lets
the pointer through to them everywhere except the stamps.

## build-visa-paper.py

Makes the visa pages' paper, and the front spread's: plain and weathered,
kept quiet — the stamps are the point. Each page is the same cream stock aged a little
differently: blotchy tone, fibres and a fine grain, browning in from the three
outer edges (not the spine side), and a scatter of foxing. Page 2 also has a
dried water stain and page 3 a flattened dog-ear; the rest stay unmarked.

    pip install pillow numpy
    python3 tools/build-visa-paper.py            # as many pages as the stamps fill
    python3 tools/build-visa-paper.py --pages 6  # or a set number
    python3 tools/build-visa-paper.py front      # only the front spread's paper

It writes `assets/passport/web/visa-01.webp` … one per page, and deletes any
higher-numbered ones, so the folder only holds the pages the book shows. It
also writes the front spread's two sheets, `front-bio.webp` (the data page,
narrower: its cover shows a wider navy rim) and `front-visited.webp`: the
same stock, seeded on their own, with no stain or dog-ear. `front` writes
only those two, which is the way to remake them without touching anything
the visa pages use.

The ink and wear tiles below are byte-identical only for the same numpy and
Pillow: a run on a different setup rewrites `ink.webp` and `print-wear.webp`
slightly differently. Commit them only when they're meant to change. How
many: the book has **no blank visa pages** — it has exactly as many as the
stamps fill, rounded up to a whole spread (at most nine spreads, like a real
passport). The script reads the highest `page:` in `js/passport-data.js` to
match, and `js/passport.js` counts them the same way. The randomness is
seeded by page number, so rebuilds are byte-identical; how strong each layer
is lives at the top of the script.

None of the blue ink is in the images. The printing on every page — a
double-rule frame with stars in three corners and the page number in a ring
in the fourth, the VISAS heading between rules, four faint guide marks that
quarter the page (as a real visa page has), and a line of microprint along
the foot — and the rubber-stamped country and year under each stamp are live
type and SVG, built in `js/passport.js` and styled in `css/passport.css`
(`.pp-print`, `.pp-ink`). Both are laid on with multiply, so the paper's
grain and foxing show through the ink. The script also writes two seamless
tiles that age the ink, each masked at a different spot per page or mark:
`print-wear.webp`, what's left of the printing after years in a pocket
(broad faded patches, a few rubbed streaks, flecks where it lifted), and
`ink.webp`, the uneven coverage of a hand-inked rubber stamp. The shadow
down into the spine is CSS too (`.pp-gutter`).

Earlier versions of the visa pages — nine public-domain American paintings
(`tools/build-visas.js`) and Gabe Classon's CC0 scans of a real passport
(`tools/build-visa-scans.js`) — are in the git history. The
`2026-10-03 at …@2x.png` screenshots in `assets/passport/` were the style
references for the paintings; the page never loads them.

## build-globes.py

Draws the two globes on the "Countries visited" page,
`assets/passport/web/globe-west.svg` and `globe-east.svg`, from the travel
page's map (`assets/travel/countries.json`). No dependencies.

    python3 tools/build-globes.py

**Adding a country never needs this.** Rerun it only to change the art:
where each globe looks and how big it draws the earth (`GLOBES`), or which
far-off islands don't count as the country (`HOME`: the Netherlands'
Caribbean islands and France's overseas regions are drawn as plain land, so
a visit to Amsterdam doesn't stamp Bonaire). Each globe is Lambert's
azimuthal equal-area projection seen through an elliptical window, one path
per country with its ISO code as its id. The output is deterministic.

## The passport page

`/passport/` is live but **unlisted**, the same way the travel page is: it
isn't in the nav on any page, and it carries `<meta name="robots"
content="noindex">`. To launch it, delete that tag from `passport/index.html`
and add `<a href="/passport/">Passport</a>` to `.site-nav` on every page.

Tap the closed passport (or drag its cover) to open it on the front spread.
From there, tap the right-hand page, the › button or → to turn forward, and
the left-hand page, ‹ or ← to go back. Esc riffles back to the cover.
Turning past the last visa page closes the back cover and turns the book
over.

### The front spread

The book opens on two pages printed the way the visa pages are: the **data
page**, glued inside the front cover, and **Countries visited** facing it.
Both are the visa pages' paper and carry the visa pages' own printing — the
frame, the heading between rules and the microprint, from the same `.pp-print`
classes (`frontPrint()` in `js/passport.js`) — worn with the same
`print-wear.webp`. Over that sit live type and SVG (`.pp-front` in
`css/passport.css`, laid out in page units: 1u is 1/704 of the page's width):
on the data page the MRZ, the request every US passport opens with ("The
Secretary of State of the United States of America hereby requests…"), one
seal stamped in `ink.webp`'s uneven ink, the signature and the bearer's
details; facing it, the globes and flags.

- **The bearer's details** are written out in `passport/index.html`, inside
  `data-pp-bio`. The passport number there (8675309, the one in the MRZ; not
  a real passport's) is also punched through the facing page, which reads it
  from there. The MRZ is fixed character for character.
- **The countries** are `PASSPORT_COUNTRIES` in `js/passport-data.js`. To
  add one, add its line and its flag, `assets/passport/flags/<code>.svg`: the
  1x1 file from [flag-icons](https://github.com/lipis/flag-icons) (MIT,
  `LICENSE-flag-icons.txt` beside them). Its flag goes under the globe its
  country sits nearest the centre of, unless `globe:` says otherwise. Each
  globe's flags sit in one row, overlapping a little; a flag shows its
  country's name only when it's hovered.
- **The fonts** are self-hosted in `assets/passport/fonts/`: Archivo (SIL
  OFL) and OCR-B (free; subset to ASCII as `ocrb-ascii.woff2`), with their
  licences. The headings and the request use the visa pages' Cormorant
  Garamond, from Google Fonts.
- **The flat fallback**, `assets/passport/web/spread.webp`, is a picture of
  the open spread for when the script can't run. It doesn't redraw itself:
  after changing the bearer or the countries, retake it — open the spread in
  a 1600 × 1100 window at 2× with reduced motion on, crop to the book with a
  little margin, scale to 1600 wide and save as WebP at quality 82 — and
  update its `height` in `passport/index.html` if it changed.

## assets/ layout

    core/       logo, hero, favicon, og image — site furniture
    about/      badge icons, headshot, album-art/, movies/
    journey/    the pinned home-page sequence (city cards, title SVGs, annotation)
    gallery/    Originals/ (masters, gitignored) + web/ (generated derivatives)
    travel/     countries.json, the globe's map (generated, see above)
    passport/   cover, stamp, eagle and Wallet-reference masters, and the
                Flighty screenshots the first spread used to show; fonts/ and
                flags/ for the front spread; web/ holds what the page loads
                (generated by build-passport.py, build-visa-paper.py and
                build-globes.py)
    _originals/ masters for everything outside the gallery (gitignored)

`album art` was renamed `album-art` — a space in a path means `%20` in every URL
that ever references it.

## Resources page assets

Deck previews are the first page of each PDF, rendered at build time — the page
shows a 280KB image instead of embedding 23.5MB of slides:

    gs -sDEVICE=png16m -dFirstPage=1 -dLastPage=1 -r150 -dNOPAUSE -dQUIET \
       -dBATCH -sOutputFile=p1.png assets/resources/<deck>.pdf
    cwebp -q 84 -m 6 -sharp_yuv -metadata none p1.png \
       -o assets/resources/thumbs/<deck>.webp

Brand marks in assets/resources/logos/ are Simple Icons (CC0) for Figma,
Unsplash, Phosphor and Apple; Coolors, Fontshare, Canva and MockuPhone are not
in that set, so those are lettermark SVGs. Three of the Simple Icons marks ship
in near-black brand colours and were recoloured for contrast on the dark ground.
