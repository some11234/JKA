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

Regenerates the cover, Flighty and stamp images in `assets/passport/web/` from
the masters in `assets/passport/` (the uploaded PNGs, never modified).

    pip install pillow
    python3 tools/build-passport.py            # everything
    python3 tools/build-passport.py stamps     # or one part: cover, flighty, stamps

It flattens and pads the cover, makes the foil mask that limits the cover's
glint to the gold, and a leather-grain tile. Then it **folds** each Flighty
screenshot along Flighty's own dashed line: the half above it becomes the page
glued inside the front cover (the map), the half below becomes the first page
(stats + MRZ). Both are rotated a quarter turn, because the book opens with
its spine upright and then turns to be read. Its geometry constants are
mirrored in `CONFIG.BOOK` in `js/passport.js` — change one, change both.

To swap in a newer Flighty passport, replace `Flighty Dark.PNG` (and/or
`Flighty Light.PNG`) keeping the name and rerun the script. Then update the
stats in the three places they're written out in `passport/index.html`: the
`#pp-desc` description and the `alt` of both flat fallback images. The script
stops if the new screenshot isn't 1179×1572 — a different size means
re-measuring `MAP_ROWS` / `DATA_ROWS` at the top of the script.

### Stamps

The visa pages carry Joe's American Express travel stamps. Every master named
`<Country> <Year>.png` in `assets/passport/` is one: the script trims it to
its perforated edge and writes `stamp-<country>-<year>.webp` (lowercased,
spaces to hyphens — `United Kingdom 2026.png` → `stamp-united-kingdom-2026.webp`).

Where each one sits is `PASSPORT_STAMPS` in `js/passport-data.js`: the page
(from 1; odd on the left, even on the right), the stamp's centre as a
percentage of the page, and a small tilt, so they look stuck in by hand.
They're listed in the order Joe went, front of the book to back, like a real
passport. To add one, drop in the PNG, run
`python3 tools/build-passport.py stamps`, and add a line to that list. To move
one, change its line — no rebuild. If it goes on a page past the last one
there is, the book grows to reach it: rerun `build-visa-paper.py` (below) so
the new pages have paper.

Each stamp is its own element inside its page, so it turns with the leaf and
takes its lighting. With a mouse, a stamp lifts a little off the page under
the pointer; a click on it still turns the page. That's why the page-turn
buttons (`.pp-tap`) sit under the book in `css/passport.css`: the book lets
the pointer through to them everywhere except the stamps.

## build-visa-paper.py

Makes the visa pages: plain, weathered paper, nothing printed on it — the
stamps are the point. Each page is the same cream stock aged a little
differently: blotchy tone, fibres and a fine grain, browning in from the three
outer edges (not the spine side), and a scatter of foxing. Page 2 also has a
dried water stain and page 3 a flattened dog-ear; the rest stay unmarked.

    pip install pillow numpy
    python3 tools/build-visa-paper.py            # as many pages as the stamps fill
    python3 tools/build-visa-paper.py --pages 6  # or a set number

It writes `assets/passport/web/visa-01.webp` … one per page, and deletes any
higher-numbered ones, so the folder only holds the pages the book shows. How
many: the book has **no blank visa pages** — it has exactly as many as the
stamps fill, rounded up to a whole spread (at most nine spreads, like a real
passport). The script reads the highest `page:` in `js/passport-data.js` to
match, and `js/passport.js` counts them the same way. The randomness is
seeded by page number, so rebuilds are byte-identical; how strong each layer
is lives at the top of the script.

The only print on a page is its number, small in the top outer corner, and
that's live text (`.pp-visa__num` in `css/passport.css`), not in the image.
The shadow down into the spine is CSS too (`.pp-gutter`).

Earlier versions of the visa pages — nine public-domain American paintings
(`tools/build-visas.js`) and Gabe Classon's CC0 scans of a real passport
(`tools/build-visa-scans.js`) — are in the git history. The
`2026-10-03 at …@2x.png` screenshots in `assets/passport/` were the style
references for the paintings; the page never loads them.

## The passport page

`/passport/` is live but **unlisted**, the same way the travel page is: it
isn't in the nav on any page, and it carries `<meta name="robots"
content="noindex">`. To launch it, delete that tag from `passport/index.html`
and add `<a href="/passport/">Passport</a>` to `.site-nav` on every page.

Tap the closed passport (or drag its cover) to open it on the Flighty pages,
turned sideways to read. From there, tap the right-hand page, the › button or
→ to turn forward — the book stands back upright for the visa pages — and the
left-hand page, ‹ or ← to go back. Esc riffles back to the cover. Turning past
the last visa page closes the back cover and turns the book over.

It shows the black-light Flighty pages. `/passport/?v=light` previews the
daylight version without changing anything for anyone else.

## assets/ layout

    core/       logo, hero, favicon, og image — site furniture
    about/      badge icons, headshot, album-art/, movies/
    journey/    the pinned home-page sequence (city cards, title SVGs, annotation)
    gallery/    Originals/ (masters, gitignored) + web/ (generated derivatives)
    travel/     countries.json, the globe's map (generated, see above)
    passport/   cover, Flighty, stamp and Wallet-reference masters; web/ holds
                what the page loads (generated by build-passport.py and
                build-visa-paper.py)
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
