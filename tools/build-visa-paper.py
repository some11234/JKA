#!/usr/bin/env python3
"""
build-visa-paper.py — the passport's visa pages: plain, weathered paper.

    pip install pillow numpy
    python3 tools/build-visa-paper.py            # as many pages as the stamps fill
    python3 tools/build-visa-paper.py --pages 6  # or a set number (rounded up to spreads)

Writes assets/passport/web/visa-01.webp … visa-NN.webp (920 × 1391, a page's
proportions), and deletes any higher-numbered visa pages left from before, so
the folder only ever holds the pages the book shows.

How many: the book has exactly as many visa pages as Joe's stamps fill. The
script reads the highest `page:` in PASSPORT_STAMPS (js/passport-data.js) and
rounds up to a whole spread, nine spreads at most like a real passport —
js/passport.js counts them the same way.

Each page is the same stock aged a little differently: no artwork, no print,
just paper that's been carried around. From the bottom up:

  stock    A warm cream, slightly blotchy: a few octaves of soft noise
           move its tone a few percent, darker patches going a touch browner,
           the way old paper yellows unevenly.
  tooth    The paper's own cloudy formation, a fine grain at two sizes, and
           short, faint fibres, lighter and darker.
  edges    Browning creeping in from the three outer edges (fore-edge, head,
           tail) — not the spine side, which the binding keeps clean — at an
           uneven depth, deepest at the two outer corners a thumb wears.
  foxing   Soft, ragged rust blotches, some with a darker speck at the
           heart, and a few loose specks — mostly toward the edges.
  marks    Page 2 also has a faint stain where a splash of water dried, and
           page 3 a flattened dog-ear at its top outer corner (MARKS below).

Everything is kept low-contrast on purpose — the stamps are the point.
Each page is seeded by its number, so a rebuild is byte-identical (for the
same numpy and Pillow).

Odd pages are left-hand pages (fore-edge on the left), even pages right-hand.
The shadow down the spine is not in the image: CSS draws it (.pp-gutter), so
it stays put whatever the art.
"""

import math
import os
import re
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
OUT = os.path.join(ROOT, 'assets', 'passport', 'web')
DATA = os.path.join(ROOT, 'js', 'passport-data.js')

W, H = 920, 1391          # one page, at 1040:1572 like the book's pages
QUALITY = 84              # WebP; the grain below is strong enough to survive it

# ------------------------------------------------------------------- look --
STOCK = (241, 231, 209)    # the cream itself, before any ageing
BROWN = (196, 162, 112)    # what ageing pulls the edges toward
RUST = (160, 104, 56)      # foxing
TONE = 0.04                # blotchiness: ± this share of brightness
CLOUD = 0.013              # the paper's own cloudy formation, finer than that
GRAIN = 0.0085             # fine grain: a tooth you see up close, not sand
FIBRES = 0.05              # how strongly the fibres show
EDGE = (0.36, 38)          # edge browning: strength, depth in px
EDGE_WIDE = (0.08, 230)    # ... and a broader, fainter yellowing behind it
FOX = (5, 11)              # min, max foxing blotches per page
SPECKS = (6, 14)           # ... and loose specks

# Extra marks, by page number: the rest stay unmarked so the set reads as
# one book, not a catalogue of damage.
MARKS = {
    2: ['tide'],
    3: ['dogear'],
}


def pages_needed():
    """Highest stamp page in js/passport-data.js, rounded up to a spread."""
    with open(DATA, encoding='utf-8') as f:
        src = f.read()
    block = src.split('PASSPORT_STAMPS', 1)[-1]
    pages = [int(n) for n in re.findall(r'\bpage:\s*(\d+)', block)]
    if not pages:
        sys.exit('no stamps with a `page:` in %s — nothing to make pages for' % DATA)
    # Nine spreads at most, as in a real passport (and js/passport.js).
    return min(18, 2 * math.ceil(max(pages) / 2))


def soft_noise(rng, scale):
    """Smooth noise in about [-1, 1], with features about `scale` px across."""
    gw, gh = int(W / scale) + 4, int(H / scale) + 4
    grid = rng.standard_normal((gh, gw)).astype(np.float32)
    big = Image.fromarray(grid, 'F').resize((int(gw * scale), int(gh * scale)), Image.BICUBIC)
    # Crop off the first cell, where bicubic has nothing to its left to work with.
    ox, oy = int(scale), int(scale)
    return np.asarray(big, dtype=np.float32)[oy:oy + H, ox:ox + W] / 1.4


def fbm(rng, scales):
    """A few octaves of soft noise, each half as strong as the one before."""
    total, norm = np.zeros((H, W), np.float32), 0.0
    for i, s in enumerate(scales):
        w = 0.55 ** i
        total += w * soft_noise(rng, s)
        norm += w
    return total / norm


def blur(a, sigma):
    """A small Gaussian blur, in float (Pillow's only takes 8-bit images)."""
    r = max(1, int(3 * sigma + 0.5))
    k = np.exp(-np.arange(-r, r + 1, dtype=np.float32) ** 2 / (2 * sigma * sigma))
    k /= k.sum()
    for axis in (0, 1):
        p = np.pad(a, [(r, r) if i == axis else (0, 0) for i in (0, 1)], mode='reflect')
        n = a.shape[axis]
        a = sum(w * (p[i:i + n] if axis == 0 else p[:, i:i + n]) for i, w in enumerate(k))
    return a.astype(np.float32)


def fibres(rng):
    """Short, faint strands — drawn at 2× and brought down, so they're soft."""
    s = 2
    light = Image.new('L', (W * s, H * s), 0)
    dark = Image.new('L', (W * s, H * s), 0)
    dl, dd = ImageDraw.Draw(light), ImageDraw.Draw(dark)
    for _ in range(1400):
        x, y = rng.uniform(0, W * s), rng.uniform(0, H * s)
        ang = rng.uniform(0, math.pi)
        bend = rng.normal(0, 0.35)
        n = int(rng.integers(3, 7))
        step = rng.uniform(4, 13) * s
        pts = [(x, y)]
        for _ in range(n):
            ang += bend * rng.uniform(0.2, 1.0)
            x += math.cos(ang) * step
            y += math.sin(ang) * step
            pts.append((x, y))
        v = int(rng.integers(60, 200))
        (dl if rng.random() < 0.55 else dd).line(pts, fill=v, width=1)
    out = []
    for layer in (light, dark):
        layer = layer.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.5))
        out.append(np.asarray(layer, dtype=np.float32) / 255)
    return out[0] - out[1]


def edge_wear(rng, recto):
    """0 → 1 toward the fore-edge, head and tail, at a ragged depth."""
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    fore = (W - 1 - x) if recto else x
    head, tail = y, H - 1 - y
    # The depth wanders along each edge, so the browning isn't a ruled band.
    wander = 1 + 0.55 * fbm(rng, (140, 60, 24))
    depth = EDGE[1] * np.clip(wander, 0.35, 2.2)
    a = np.exp(-fore / depth) + np.exp(-head / depth) + np.exp(-tail / depth)
    near = np.clip(a, 0, 1.4) / 1.4
    wide = np.exp(-fore / EDGE_WIDE[1]) + 0.6 * (np.exp(-head / EDGE_WIDE[1]) + np.exp(-tail / EDGE_WIDE[1]))
    return near, np.clip(wide, 0, 1)


def near_edge(rng, recto):
    """A point toward the outer edges more often than not."""
    if rng.random() < 0.7:
        side = rng.integers(0, 3)
        if side == 0:
            fx = rng.uniform(0, 0.16)
            return ((1 - fx) * W if recto else fx * W), rng.uniform(0, H)
        x = rng.uniform(0.3, 1) * W if recto else rng.uniform(0, 0.7) * W
        return x, (rng.uniform(0, 0.1) if side == 1 else rng.uniform(0.9, 1)) * H
    return rng.uniform(0.1, 0.9) * W, rng.uniform(0.08, 0.92) * H


def foxing(rng, recto):
    """Foxing: soft, irregular rust blotches, often with a darker speck or
    two at the heart, plus a few loose specks — mostly near the edges."""
    a = np.zeros((H, W), np.float32)
    # One shared field of ragged noise gives every blotch an uneven outline.
    rag = 0.5 + 0.5 * fbm(rng, (9, 4))

    def dab(x, y, r, k, ragged):
        R = int(r * 3.2) + 2
        x0, x1 = max(0, int(x) - R), min(W, int(x) + R + 1)
        y0, y1 = max(0, int(y) - R), min(H, int(y) + R + 1)
        if x0 >= x1 or y0 >= y1:
            return
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        g = np.exp(-((xx - x) ** 2 + (yy - y) ** 2) / (2 * r * r))
        if ragged:
            g = np.clip(g * (0.4 + 1.2 * rag[y0:y1, x0:x1]) - 0.08, 0, 1)
        a[y0:y1, x0:x1] = np.maximum(a[y0:y1, x0:x1], k * g)

    for _ in range(int(rng.integers(FOX[0], FOX[1] + 1))):
        x, y = near_edge(rng, recto)
        dab(x, y, rng.uniform(3, 11), rng.uniform(0.12, 0.26), True)
        for _ in range(int(rng.integers(0, 3))):
            dab(x + rng.normal(0, 3), y + rng.normal(0, 3), rng.uniform(0.7, 1.6), rng.uniform(0.25, 0.5), False)
    for _ in range(int(rng.integers(SPECKS[0], SPECKS[1] + 1))):
        x, y = near_edge(rng, recto)
        dab(x, y, rng.uniform(0.6, 1.5), rng.uniform(0.18, 0.4), False)
    return np.clip(a, 0, 0.5)


def tide_line(rng):
    """Where a splash of water dried: a faint, ragged, slightly darker rim
    around a patch a hair warmer than the paper round it."""
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy = rng.uniform(0.45, 0.7) * W, rng.uniform(0.7, 0.86) * H
    rx, ry = rng.uniform(110, 150), rng.uniform(80, 110)
    d = np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
    d += 0.18 * fbm(rng, (110, 45))
    # Inside, the tint fades in from the middle: the water pushed what it
    # picked up outward as it dried, and left it at the edge.
    inside = np.clip(1 - d, 0, 1) ** 0.6 * np.clip(d * 1.6, 0, 1)
    # A rim that's sharp on the outside and bleeds back in, and fades out
    # here and there like a real one.
    rim = np.where(d < 1, np.exp(-((d - 1) / 0.11) ** 2), np.exp(-((d - 1) / 0.025) ** 2))
    rim *= np.clip(0.75 + 0.6 * fbm(rng, (80, 30)), 0.2, 1)
    return rim, inside


def dogear(recto):
    """A corner once folded over and pressed flat again: a faint crease
    across the top outer corner, the folded-over triangle a shade lighter
    (it was turned away from the light and dirt) with a darker line at the
    fold."""
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    fx = (W - 1 - x) if recto else x
    s = 150.0                                  # how far along each edge it reached
    d = (fx + y - s) / math.sqrt(2)            # signed distance to the crease
    line = np.exp(-(d / 1.3) ** 2)
    lip = np.exp(-((d + 2.4) / 1.6) ** 2)      # a hair of highlight beside it
    tri = np.clip(-d / 3, 0, 1)
    return line, lip, tri


def make_page(page):
    rng = np.random.default_rng(7340 + page)
    recto = page % 2 == 0

    stock = np.array(STOCK, np.float32) / 255
    brown = np.array(BROWN, np.float32) / 255
    rust = np.array(RUST, np.float32) / 255

    tone = fbm(rng, (420, 190, 80, 34))
    img = np.ones((H, W, 3), np.float32) * stock
    # Blotchy: lighter and darker, the darker going browner.
    img *= (1 + TONE * tone)[..., None]
    warm = np.clip(-tone, 0, 1)[..., None] * 0.18
    img = img * (1 - warm) + brown * warm

    near, wide = edge_wear(rng, recto)
    img = img * (1 - EDGE_WIDE[0] * wide[..., None]) + brown * EDGE_WIDE[0] * wide[..., None]
    k = (EDGE[0] * near)[..., None]
    img = img * (1 - k) + (brown * 0.92) * k

    # The paper's tooth: its cloudy formation, then grain at two sizes, then
    # the fibres.
    img *= (1 + CLOUD * fbm(rng, (34, 15)))[..., None]
    fine = blur(rng.standard_normal((H, W)).astype(np.float32), 0.55)
    coarse = blur(rng.standard_normal((H, W)).astype(np.float32), 1.4)
    img *= (1 + GRAIN * (fine / fine.std() + 0.6 * coarse / coarse.std()))[..., None]
    img *= (1 + FIBRES * fibres(rng))[..., None]

    for mark in MARKS.get(page, []):
        if mark == 'tide':
            rim, inside = tide_line(rng)
            a = (0.11 * rim + 0.035 * inside)[..., None]
            img = img * (1 - a) + brown * 0.8 * a
        elif mark == 'dogear':
            line, lip, tri = dogear(recto)
            img *= (1 + 0.012 * tri - 0.07 * line + 0.03 * lip)[..., None]

    fox = foxing(rng, recto)[..., None]
    img = img * (1 - fox) + rust * fox

    img = np.clip(img * 255 + 0.5, 0, 255).astype(np.uint8)
    return Image.fromarray(img, 'RGB')


def main():
    args = sys.argv[1:]
    if args[:1] == ['--pages'] and len(args) == 2 and args[1].isdigit() and int(args[1]) > 0:
        count = 2 * math.ceil(int(args[1]) / 2)
    elif not args:
        count = pages_needed()
    else:
        sys.exit('usage: build-visa-paper.py [--pages N]')

    os.makedirs(OUT, exist_ok=True)
    for page in range(1, count + 1):
        name = 'visa-%02d.webp' % page
        path = os.path.join(OUT, name)
        make_page(page).save(path, 'WEBP', quality=QUALITY, method=6)
        print('  %-16s %d×%d %4d KB  (%s page)' % (name, W, H, os.path.getsize(path) // 1024,
                                                  'right' if page % 2 == 0 else 'left'))
    # Anything past the last page is from a longer book: it would never be
    # shown, so it goes.
    for name in sorted(os.listdir(OUT)):
        m = re.match(r'^visa-(\d+)\.webp$', name)
        if m and int(m.group(1)) > count:
            os.remove(os.path.join(OUT, name))
            print('  removed %s' % name)


if __name__ == '__main__':
    main()
