# tools/

## build-gallery.py

Regenerates `assets/gallery/web/` and prints the data used by
`js/gallery-data.js`, reading from `assets/gallery/Originals/`.

**It never writes inside `Originals/`** — that folder is read-only input, and is
gitignored so its 135 MB never reaches GitHub Pages.

    python3 tools/build-gallery.py <cache-dir>

For each photo it applies EXIF orientation, writes a 900px `-thumb.webp` and a
2000px `-large.webp`, and reads out the real camera settings and GPS. Place
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

Regenerates `assets/passport/web/` — everything the passport page loads — from
the masters in `assets/passport/` (the uploaded PNGs, never modified).

    pip install pillow
    python3 tools/build-passport.py

It flattens and pads the cover, makes the foil mask that limits the cover's
glint to the gold, and a leather-grain tile. Then it **folds** each Flighty
screenshot along Flighty's own dashed line: the half above it becomes the page
glued inside the front cover (the map), the half below becomes the first page
(stats + MRZ). Both are rotated a quarter turn, because the book opens with
its spine upright and then turns to be read. Its geometry constants are
mirrored in `CONFIG.BOOK` in `js/passport.js` — change one, change both.

To swap in a newer Flighty passport, replace `Flighty Dark.PNG` (and/or
`Flighty Light.PNG`) keeping the name, rerun the script, and update the
screen-reader description in `passport/index.html` (`#pp-desc`). If the new
screenshot's layout moved, re-measure `MAP_ROWS` / `DATA_ROWS` at the top of
the script.

## The passport page

`/passport/` is live but **unlisted**, the same way the travel page is: it
isn't in the nav on any page, and it carries `<meta name="robots"
content="noindex">`. To launch it, delete that tag from `passport/index.html`
and add `<a href="/passport/">Passport</a>` to `.site-nav` on every page.

It shows the black-light Flighty pages. `/passport/?v=light` previews the
daylight version without changing anything for anyone else.

## assets/ layout

    core/       logo, hero, favicon, og image — site furniture
    about/      badge icons, headshot, album-art/, movies/
    journey/    the pinned home-page sequence (city cards, title SVGs, annotation)
    gallery/    Originals/ (masters, gitignored) + web/ (generated derivatives)
    travel/     countries.json, the globe's map (generated, see above)
    passport/   cover + Flighty masters; web/ holds what the page loads (generated)
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
