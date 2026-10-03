#!/usr/bin/env python3
"""
build-passport.py — regenerates assets/passport/web/ from the masters in
assets/passport/ (the uploaded PNGs, which are never modified).

    pip install pillow
    python3 tools/build-passport.py

What it makes, and why each one exists:

  cover.webp            The cover, flattened onto its own navy and padded to
                        COVER_RATIO (see below). The rounded corners are left
                        square — CSS rounds them, so they always match the
                        3D edge facets exactly.
  cover-foil.webp       White with alpha = "how gold is this pixel". The page
                        masks a moving highlight with it, so the glint only
                        ever lands on the foil, never on the navy.
  grain.webp            A seamless leather-grain tile laid over the cover.
  flighty-<v>-map.webp  The Flighty passport, folded: the half ABOVE Flighty's
  flighty-<v>-data.webp own dashed line becomes the page glued inside the front
                        cover (map), the half below becomes the first page of
                        the book (stats + MRZ). Each is rotated 90° CCW,
                        because the book opens with its spine upright and then
                        turns a quarter clockwise to be read — the same way you
                        turn a real passport to read its data page.
  flighty-<v>.webp      The whole screenshot, flat — the no-JS fallback.

The geometry constants are mirrored in js/passport.js (CONFIG.BOOK). Change
one, change both: the page images are cut to exactly the shape the 3D pages are
built at, so a mismatch shows up as a stretched or cropped page.
"""

import os
import random
import sys

from PIL import Image, ImageFilter

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SRC = os.path.join(ROOT, 'assets', 'passport')
OUT = os.path.join(SRC, 'web')

# ---------------------------------------------------------------- geometry --
# All in units of the cover's height (H = 1). Mirrored in js/passport.js.
#
# A real passport cover is 88 × 125 mm (0.704). Flighty draws its pages wider
# and shorter than that (1.60:1 against a real page's 1.42:1), so its art
# cannot fill true-to-life pages. Rather than crop any of it, the difference is
# split three ways:
#   - the book is a touch taller than life (0.66);
#   - the page glued inside the front cover sits in a Flighty-style navy rim
#     that is wider along its outer edge (it's printed on the cover, so its
#     margin is free to be whatever looks right);
#   - what is left becomes a narrow band at the fold, which the page shading
#     turns into a gutter.
# The page block itself sits almost flush with the boards, like a real
# passport's — that's what lets its cream edges show when the book is closed.
COVER_RATIO = 0.66       # cover width / height
PAGE_INSET_HT = 0.006    # board showing above the pages' head and below their tail
DATA_INSET_FORE = 0.006  # board showing past the page block's outer (fore) edge
MAP_INSET_FORE = 0.022   # navy showing past the inside-cover page's outer edge

PAGE_H = 1 - 2 * PAGE_INSET_HT            # head → tail, both pages
DATA_W = COVER_RATIO - DATA_INSET_FORE    # spine → fore-edge, the first page
MAP_W = COVER_RATIO - MAP_INSET_FORE      # spine → fore-edge, the inside-cover page

# ------------------------------------------------------ the Flighty masters --
# Measured from the 1179 × 1572 screenshots (both variants share the layout):
#   rows   0–20    navy cover rim
#   rows  21–53    drawn "page stack" edges — dropped; the 3D book has real ones
#   rows  54–790   top page (map)
#   rows 791–793   the dashed fold line — dropped; it is redrawn as the
#                  passport's stitching, exactly on the 3D fold
#   rows 794–1532  bottom page (stats + MRZ)
#   rows 1533+     navy cover rim
MAP_ROWS = (54, 791)
DATA_ROWS = (794, 1533)
VARIANTS = {
    'blacklight': 'Flighty Dark.PNG',   # the UV / "black light" version
    'light': 'Flighty Light.PNG',
}
FADE_ROWS = 18   # how far into the art the gutter band feathers
BAND_BLUR = 22   # horizontal blur that keeps the band free of streaks

COVER_SRC = 'Passport Cover.png'
COVER_H = 2000             # output height of cover.webp
COVER_NAVY = (17, 26, 52)   # #111A34, sampled from the cover's flat ground


def webp(img, name, **kw):
    path = os.path.join(OUT, name)
    img.save(path, 'WEBP', method=6, **kw)
    print('  %-28s %4d×%-4d %4d KB' % (name, img.width, img.height, os.path.getsize(path) // 1024))


def build_cover():
    src = Image.open(os.path.join(SRC, COVER_SRC)).convert('RGBA')
    w, h = src.size
    flat = Image.new('RGB', (w, h), COVER_NAVY)
    flat.paste(src, mask=src.getchannel('A'))

    # Pad top and bottom with the same navy to reach COVER_RATIO.
    target_h = round(w / COVER_RATIO)
    pad = target_h - h
    if pad < 0:
        sys.exit('%s is taller than 1:%.2f — it would be cropped; raise COVER_RATIO' % (COVER_SRC, COVER_RATIO))
    cover = Image.new('RGB', (w, target_h), COVER_NAVY)
    cover.paste(flat, (0, pad // 2))
    # It's never shown taller than ~1,930 device pixels (a 2560×1440 screen at
    # 2×), so there's no point decoding more than 2,000.
    cover = cover.resize((round(COVER_H * COVER_RATIO), COVER_H), Image.LANCZOS)
    webp(cover, 'cover.webp', quality=88)

    # Foil mask: navy has a luminance of ~25, the foil ~230. Ramp between.
    lum = cover.convert('L').point(lambda v: max(0, min(255, (v - 60) * 255 // 140)))
    lum = lum.resize((cover.width // 2, cover.height // 2), Image.LANCZOS)
    foil = Image.new('RGBA', lum.size, (255, 255, 255, 0))
    foil.putalpha(lum)
    webp(foil, 'cover-foil.webp', quality=80, alpha_quality=70)


def build_grain(size=256):
    # Seamless: blur a 3×3 tiling of the noise and keep the middle tile, so the
    # blur wraps around the edges instead of fading at them.
    rnd = random.Random(1746)
    noise = Image.new('L', (size, size))
    noise.putdata([rnd.randint(0, 255) for _ in range(size * size)])
    tiled = Image.new('L', (size * 3, size * 3))
    for i in range(3):
        for j in range(3):
            tiled.paste(noise, (i * size, j * size))
    pebble = tiled.filter(ImageFilter.GaussianBlur(1.1)).crop((size, size, size * 2, size * 2))
    # Stretch the contrast back out around mid-grey: the blur flattens it.
    lo, hi = pebble.getextrema()
    pebble = pebble.point(lambda v: (v - lo) * 255 // max(1, hi - lo))
    # Lossy is fine for noise shown at low opacity — and a third of the PNG.
    webp(pebble, 'grain.webp', quality=70)


def gutter_fill(art, edge_y, height):
    """A band the colour of the art's rows nearest the fold, blurred sideways."""
    w = art.width
    strip = art.crop((0, max(0, edge_y - 4), w, min(art.height, edge_y + 4)))
    row = strip.resize((w, 1), Image.BOX)
    # Blur the single row, THEN stretch it: blurring the stretched band would
    # also pull its top and bottom rows toward the canvas edge.
    row = row.resize((w, 1 + 2 * BAND_BLUR * 3), Image.NEAREST).filter(
        ImageFilter.GaussianBlur(BAND_BLUR)).crop((0, BAND_BLUR * 3, w, BAND_BLUR * 3 + 1))
    return row.resize((w, height), Image.NEAREST)


def ramp(w, h, up):
    """L-mode mask, 0 → 255 down the rows (or 255 → 0 if not `up`), smoothstep."""
    m = Image.new('L', (w, h))
    px = []
    for y in range(h):
        t = (y + 0.5) / h
        t = t * t * (3 - 2 * t)
        v = round(255 * (t if up else 1 - t))
        px.extend([v] * w)
    m.putdata(px)
    return m


def build_flighty(variant, filename):
    src = Image.open(os.path.join(SRC, filename)).convert('RGB')
    if src.size != (1179, 1572):
        # MAP_ROWS / DATA_ROWS are pixel rows measured on a 1179×1572 export.
        sys.exit('%s is %d×%d, not 1179×1572: re-measure MAP_ROWS and DATA_ROWS, '
                 'then update ART_W in js/passport.js and the <img> sizes in '
                 'passport/index.html' % (filename, src.width, src.height))
    w = src.width
    # Page heights in art pixels: the art's width spans the page head to tail.
    map_px = round(w * MAP_W / PAGE_H)
    data_px = round(w * DATA_W / PAGE_H)

    # Map page: art on top, gutter band below it.
    art = src.crop((0, MAP_ROWS[0], w, MAP_ROWS[1]))
    band_h = map_px - art.height
    if band_h < 0:
        sys.exit('map art is taller than its page — lower MAP_INSET_FORE or raise COVER_RATIO')
    page = Image.new('RGB', (w, map_px))
    page.paste(art, (0, 0))
    fill = gutter_fill(art, art.height - 1, FADE_ROWS + band_h)
    mask = Image.new('L', fill.size, 255)
    mask.paste(ramp(w, FADE_ROWS, up=True), (0, 0))
    page.paste(fill, (0, art.height - FADE_ROWS), mask)
    webp(page.transpose(Image.Transpose.ROTATE_90), 'flighty-%s-map.webp' % variant, quality=90)
    map_band = band_h

    # Data page: gutter band on top, art below it.
    art = src.crop((0, DATA_ROWS[0], w, DATA_ROWS[1]))
    band_h = data_px - art.height
    if band_h < 0:
        sys.exit('data art is taller than its page — raise COVER_RATIO')
    page = Image.new('RGB', (w, data_px))
    page.paste(art, (0, band_h))
    fill = gutter_fill(art, 0, band_h + FADE_ROWS)
    mask = Image.new('L', fill.size, 255)
    mask.paste(ramp(w, FADE_ROWS, up=False), (0, band_h))
    page.paste(fill, (0, 0), mask)
    webp(page.transpose(Image.Transpose.ROTATE_90), 'flighty-%s-data.webp' % variant, quality=90)

    webp(src, 'flighty-%s.webp' % variant, quality=86)
    print('    gutter bands: map %dpx, data %dpx (pages %d and %d art px)'
          % (map_band, band_h, map_px, data_px))


def main():
    os.makedirs(OUT, exist_ok=True)
    print('pages: map %.4f, data %.4f × %.4f of the cover height' % (MAP_W, DATA_W, PAGE_H))
    build_cover()
    build_grain()
    for variant, filename in VARIANTS.items():
        build_flighty(variant, filename)


if __name__ == '__main__':
    main()
