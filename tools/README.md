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

## assets/ layout

    core/       logo, hero, favicon, og image — site furniture
    about/      badge icons, headshot, album-art/, movies/
    journey/    the pinned home-page sequence (city cards, title SVGs, annotation)
    gallery/    Originals/ (masters, gitignored) + web/ (generated derivatives)
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
