#!/usr/bin/env python3
"""
build-passport.py — regenerates assets/passport/web/ from the masters in
assets/passport/ (the uploaded PNGs, which are never modified).

    pip install pillow numpy
    python3 tools/build-passport.py            # everything
    python3 tools/build-passport.py stamps     # just one part: cover, flighty, stamps

What it makes, and why each one exists:

  cover.webp            The cover, re-printed from the master's two flat
                        colours: a deep navy ground, and the foil as metal —
                        shaded gold, pressed into the leather, carrying a
                        faint copy of the grain — padded to COVER_RATIO (see
                        below). The rounded corners are left square — CSS
                        rounds them, so they always match the 3D edge facets
                        exactly. The light and sheen on the leather are CSS.
  cover-foil.webp       White with alpha = "how gold is this pixel". The page
                        masks a moving highlight with it, so the glint only
                        ever lands on the foil, never on the navy — and keeps
                        the leather's grain and sheen off the foil.
  grain.webp            A seamless tile of lit leather pebbles, laid over the
                        boards.
  flighty-<v>-map.webp  The Flighty passport, folded: the half ABOVE Flighty's
  flighty-<v>-data.webp own dashed line becomes the page glued inside the front
                        cover (map), the half below becomes the first page of
                        the book (stats + MRZ). Each is rotated 90° CCW,
                        because the book opens with its spine upright and then
                        turns a quarter clockwise to be read — the same way you
                        turn a real passport to read its data page.
  flighty-<v>.webp      The whole screenshot, flat — the no-JS fallback.
  stamp-<slug>.webp     Each Amex travel stamp ("<Country> <Year>.png"),
                        trimmed to its perforated edge so the image's box is
                        the stamp's box, and kept transparent outside it — the
                        page stands them on the visa pages at a tilt and casts
                        their shadow from that edge. Each is aged a little to
                        sit on the weathered pages (see age_stamp()). Where
                        each one goes is PASSPORT_STAMPS in js/passport-data.js.

The geometry constants are mirrored in js/passport.js (CONFIG.BOOK). Change
one, change both: the page images are cut to exactly the shape the 3D pages are
built at, so a mismatch shows up as a stretched or cropped page.
"""

import os
import re
import sys
import zlib

import numpy as np
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

# The master is two flat colours, anti-aliased into each other: a navy ground
# and one pale yellow for all the foil. Sampled, and used only to work out how
# much of each pixel is foil — the cover is then re-coloured from scratch.
SRC_NAVY = (17, 26, 52)      # #111A34
SRC_FOIL = (247, 244, 154)   # #F7F49A

# The leather. Flat in the image on purpose: the light falling across it and
# its sheen are CSS overlays (.pp-key, .pp-sheen, .pp-relief), and the back
# cover — plain CSS navy — gets the same key light and relief, so the two
# boards match. Keep in step with --navy in css/passport.css.
COVER_NAVY = (12, 23, 58)    # #0C173A

# The foil, as hot-stamped metal rather than paint: every foil pixel gets a
# "how much light is it catching" level, which picks its colour off this ramp
# — dark bronze where it faces away, warm gold through the middle, pale
# champagne where it catches the light. The page's moving glint does the rest.
GOLD_RAMP = (
    (0.00, (60, 38, 12)),
    (0.30, (130, 88, 30)),
    (0.50, (190, 142, 58)),
    (0.66, (222, 180, 92)),
    (0.80, (240, 208, 134)),
    (1.00, (255, 244, 206)),
)
FOIL_LEVEL = 0.64      # the ramp level the foil sits at, before the light below
FOIL_GLOW = 0.16       # how much brighter it gets in the band facing the light
FOIL_FALL = 0.10       # how much darker toward the lower right
FOIL_MOTTLE = 0.03     # broad unevenness, so it's foil, not a gradient
DEBOSS_BLUR = 2.0      # px at COVER_H: how soft the pressed-in edge is
DEBOSS = 1.5           # how deep it looks
HAIRLINE_LIFT = 0.12   # extra ramp level for the eagle's fine lines ...
HAIRLINE_SAT = 0.6     # ... and extra saturation, against the navy they blur into
LIGHT_DIR = (-0.58, -0.81)  # toward the light in the image plane: up and left,
                            # like CONFIG.LIGHT in js/passport.js

# The leather grain tile, laid over the boards by css/passport.css.
GRAIN_PEBBLE = 1.4     # px in the tile: the pebbles' blur — ~1.5 CSS px across on a laptop
GRAIN_CONTRAST = 0.11  # its spread around mid-grey
GRAIN_TILE = 0.16      # the tile's size, a share of the cover's height (--grain in js/passport.js)
FOIL_GRAIN = 0.14      # how strongly the foil takes the grain (the leather: 0.38, in CSS)

# ------------------------------------------------------------- the stamps --
# Any master named "<Country> <Year>.png" is a stamp. They're shown at about
# 36% of a page's width — ~170 CSS px on a laptop, ~340 device px at 2× — so
# 560 leaves room for big screens and the hover lift.
STAMP_RE = re.compile(r'^(.+) (\d{4})\.png$', re.IGNORECASE)
STAMP_PX = 560

# How the stamps are aged: only slightly — carried around for a while, not
# found in an attic. Each is a share of the effect, 0 → none.
STAMP_AGE = {
    'desat': 0.13,             # colour that's faded out of the inks
    'fade': 0.04,              # contrast lost toward a warm mid-tone
    'black': (0.13, 0.10, 0.08),  # blacks worn up to a warm, brown-black ink
    'warm': (1.0, 0.972, 0.905),  # whites yellowed toward old cream
    'mottle': 0.035,           # uneven toning, soft and broad
    'grain': 0.014,            # the stamp paper's tooth
    'grime': 0.13,             # dirt gathered in the perforations
    'specks': (1, 4),          # min, max foxing specks
}


def webp(img, name, **kw):
    path = os.path.join(OUT, name)
    img.save(path, 'WEBP', method=6, **kw)
    print('  %-28s %4d×%-4d %4d KB' % (name, img.width, img.height, os.path.getsize(path) // 1024))


def blur(a, sigma, wrap=False):
    """Gaussian blur of a 2-D float array, separable, edges reflected (or wrapped)."""
    r = max(1, int(sigma * 3 + 0.5))
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k = (k / k.sum()).astype(np.float32)
    a = np.asarray(a, np.float32)
    mode = 'wrap' if wrap else 'reflect'
    for axis in (0, 1):
        p = np.pad(a, [(r, r) if i == axis else (0, 0) for i in (0, 1)], mode=mode)
        n = a.shape[axis]
        a = sum(k[i] * (p[i:i + n] if axis == 0 else p[:, i:i + n]) for i in range(2 * r + 1))
    return a


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def build_cover():
    src = Image.open(os.path.join(SRC, COVER_SRC)).convert('RGBA')
    w, h = src.size
    target_h = round(w / COVER_RATIO)
    pad = target_h - h
    if pad < 0:
        sys.exit('%s is taller than 1:%.2f — it would be cropped; raise COVER_RATIO' % (COVER_SRC, COVER_RATIO))

    # How much of each pixel is foil: its colour's position on the line from
    # the master's navy to its yellow (0 navy, 1 foil), and nothing where the
    # master is transparent (its rounded corners).
    a = np.asarray(src, dtype=np.float32) / 255
    navy, gold = np.array(SRC_NAVY) / 255, np.array(SRC_FOIL) / 255
    d = gold - navy
    t = np.clip(((a[..., :3] - navy) @ d) / (d @ d), 0, 1) * a[..., 3]

    # Pad top and bottom to COVER_RATIO, then scale: it's never shown taller
    # than ~1,930 device pixels (a 2560×1440 screen at 2×), so there's no point
    # decoding more than 2,000.
    t = np.pad(t, ((pad // 2, pad - pad // 2), (0, 0)))
    size = (round(COVER_H * COVER_RATIO), COVER_H)
    m = np.asarray(Image.fromarray(t.astype(np.float32), 'F').resize(size, Image.LANCZOS))
    m = np.clip(m, 0, 1)
    H, W = m.shape
    v, u = np.mgrid[0:H, 0:W].astype(np.float32)
    u, v = u / W, v / H

    # The foil's light level. Metal shows its surroundings rather than its own
    # colour, so even sitting still it isn't one flat gold: a broad band runs
    # diagonally across the upper left where it faces the (imagined) light —
    # through the left of PASSPORT and the top of the eagle — and it dims
    # toward the lower right. A little seeded unevenness on top, at the scale
    # of a letter or two, keeps it from reading as a gradient.
    along = 0.75 * u + 0.66 * v                  # 0 at the top left, ~1.4 at the bottom right
    level = (FOIL_LEVEL
             + FOIL_GLOW * np.exp(-((along - 0.42) / 0.22) ** 2)
             - FOIL_FALL * smoothstep(0.55, 1.25, along))
    rnd = np.random.default_rng(2006)
    lo = rnd.standard_normal((H // 40 + 3, W // 40 + 3)).astype(np.float32)
    lo = blur(lo, 1.4)
    lo = np.asarray(Image.fromarray(lo, 'F').resize((W + 80, H + 80), Image.BICUBIC))[40:40 + H, 40:40 + W]
    level += FOIL_MOTTLE * lo / max(1e-6, lo.std())

    # Pressed in. Hot foil is stamped INTO the cover, so each letter sits in a
    # shallow dip: treat the (softened) foil mask as depth and light it from
    # the upper left — the edge facing the light falls into shadow, the edge
    # facing away catches a rim of light. Hairlines in the eagle get less of
    # it than the big letters: a hairline is pressed as shallow as it is wide.
    soft = blur(m, DEBOSS_BLUR)
    gy, gx = np.gradient(soft)
    relief = (LIGHT_DIR[0] * gx + LIGHT_DIR[1] * gy) * DEBOSS_BLUR * 2.5  # about ±1 at a big letter's edge
    thick = np.clip(blur(m, 3.0) * 1.8, 0, 1)      # ~1 in a letter, ~0.5 on a hairline
    relief *= 0.12 + 0.88 * smoothstep(0.5, 0.95, thick)
    # Hairlines are mostly anti-aliased edge: on screen they're half navy, so
    # at the letters' colour they'd read as a dim grey-beige. Lift them a
    # little and saturate them (below), so the mix still reads gold.
    level += HAIRLINE_LIFT * (1 - thick)

    ramp_at = np.array([s for s, _ in GOLD_RAMP])
    foil = np.stack([np.interp(level, ramp_at, [c[i] for _, c in GOLD_RAMP]) for i in range(3)], -1) / 255
    grey = foil.mean(-1, keepdims=True)
    foil = np.clip(grey + (foil - grey) * (1 + HAIRLINE_SAT * (1 - thick))[..., None], 0, 1)

    # The foil is stamped onto the grain, so it carries the pebbling too, but
    # faintly — it's smoother than the leather. The page keeps its own grain
    # overlay off the foil: at full strength it turns mid-tone gold to
    # sandpaper. Same tile, same size, same overlay blend as the page's.
    tpx = round(GRAIN_TILE * H)
    tile = np.tile(grain_tile(), (3, 3)).astype(np.float32)
    tile = np.asarray(Image.fromarray(tile, 'F').resize((3 * tpx, 3 * tpx), Image.BICUBIC))[tpx:2 * tpx, tpx:2 * tpx]
    tile = np.tile(tile, (H // tpx + 1, W // tpx + 1))[:H, :W, None]
    over = np.where(foil < 0.5, 2 * foil * tile, 1 - 2 * (1 - foil) * (1 - tile))
    foil += (over - foil) * FOIL_GRAIN
    ground = np.broadcast_to(np.array(COVER_NAVY, np.float32) / 255, foil.shape)
    rgb = ground + (foil - ground) * m[..., None]
    # Now light the dip: the shadowed wall darkens, the lit one lifts toward
    # white — more gently, or it turns into an outline.
    shade = (DEBOSS * relief)[..., None]
    rgb = np.where(shade < 0, rgb * (1 + shade * 0.55), rgb + (1 - rgb) * shade * 0.22)
    cover = Image.fromarray((np.clip(rgb, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGB')
    webp(cover, 'cover.webp', quality=88)

    # The foil mask, at half size — it only has to place a soft highlight.
    lum = Image.fromarray((m * 255 + 0.5).astype(np.uint8), 'L')
    lum = lum.resize((W // 2, H // 2), Image.LANCZOS)
    mask = Image.new('RGBA', lum.size, (255, 255, 255, 0))
    mask.putalpha(lum)
    webp(mask, 'cover-foil.webp', quality=80, alpha_quality=70)


def grain_tile(size=256):
    # Pebbled leather rather than plain noise: blobs of blurred noise are the
    # pebbles, and lighting them from the upper left (the same light the page
    # uses) gives each a bright side and a dark side, so it reads as a surface
    # with bumps in it instead of as speckle. Seamless: every blur and slope
    # wraps around the tile's edges.
    rnd = np.random.default_rng(1746)
    h = blur(rnd.standard_normal((size, size)), GRAIN_PEBBLE, wrap=True)
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) / 2
    gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) / 2
    lit = -(LIGHT_DIR[0] * gx + LIGHT_DIR[1] * gy)   # a bump's slope facing the light
    g = 0.35 * h / h.std() + lit / lit.std()
    # Centred on mid-grey, which the page's overlay blend leaves alone.
    return np.clip(0.5 + GRAIN_CONTRAST * g / g.std(), 0, 1)


def build_grain():
    # Lossy is fine for texture shown at low opacity — and a third of the PNG.
    g = grain_tile()
    webp(Image.fromarray((g * 255 + 0.5).astype(np.uint8), 'L'), 'grain.webp', quality=70)


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


def stamp_slug(name):
    """'United States of America 2006.png' → 'united-states-of-america-2006'."""
    return re.sub(r'[^a-z0-9]+', '-', os.path.splitext(name)[0].lower()).strip('-')


def age_stamp(stamp, seed):
    """A stamp, slightly aged: inks faded and a little desaturated, whites
    yellowed to cream, blacks worn to brown-black, a soft uneven toning and a
    fine grain, a little grime caught in the perforations and a speck or two
    of foxing. Seeded per stamp, so every rebuild is the same."""
    A = STAMP_AGE
    rng = np.random.default_rng(seed)
    a = np.asarray(stamp, np.float32) / 255
    rgb, alpha = a[..., :3], a[..., 3]
    h, w = alpha.shape

    lum = (rgb @ np.array([0.299, 0.587, 0.114], np.float32))[..., None]
    rgb = rgb + (lum - rgb) * A['desat']
    rgb = rgb * (1 - A['fade']) + np.array([0.62, 0.56, 0.47], np.float32) * A['fade']
    black = np.array(A['black'], np.float32)
    rgb = black + rgb * (1 - black)
    rgb = rgb * np.array(A['warm'], np.float32)

    # Uneven toning: a few blotches, a few percent, from upscaled noise.
    g = 9
    coarse = Image.fromarray(rng.standard_normal((g, g)).astype(np.float32), 'F')
    mottle = np.array(coarse.resize((w, h), Image.BICUBIC), np.float32)
    mottle /= max(1e-6, float(np.abs(mottle).max()))
    rgb = rgb * (1 + A['mottle'] * mottle)[..., None]
    grain = blur(rng.standard_normal((h, w)).astype(np.float32), 0.6)
    rgb = rgb * (1 + A['grain'] * grain / grain.std())[..., None]

    # Grime in the perforations: darker just inside the stamp's edge, by
    # more in some places than others.
    edge = np.clip((1 - blur(alpha, 5)) * 2.2, 0, 1) * alpha
    rgb = rgb * (1 - A['grime'] * edge * np.clip(0.6 + 0.6 * mottle, 0, 1))[..., None]

    # Foxing: a speck or two, soft-edged, rust.
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    rust = np.array([0.55, 0.36, 0.2], np.float32)
    for _ in range(int(rng.integers(A['specks'][0], A['specks'][1] + 1))):
        # Mostly on the white border, where they show — toward an edge.
        side = rng.integers(0, 4)
        t, d = rng.uniform(0.08, 0.92), rng.uniform(0.03, 0.11)
        x, y = [(t, d), (t, 1 - d), (d, t), (1 - d, t)][side]
        r = rng.uniform(1.2, 3.2)
        k = rng.uniform(0.18, 0.4) * np.exp(-((xx - x * w) ** 2 + (yy - y * h) ** 2) / (2 * r * r))
        rgb = rgb * (1 - k[..., None]) + rust * k[..., None]

    out = np.dstack([np.clip(rgb, 0, 1), alpha])
    return Image.fromarray((out * 255 + 0.5).astype(np.uint8), 'RGBA')


def build_stamps():
    names = sorted(n for n in os.listdir(SRC) if STAMP_RE.match(n))
    if not names:
        sys.exit('no stamps in %s — they are named "<Country> <Year>.png"' % SRC)
    for name in names:
        src = Image.open(os.path.join(SRC, name)).convert('RGBA')
        # Trim the transparent margin, so the box CSS places is the stamp.
        box = src.getchannel('A').getbbox()
        stamp = src.crop(box)
        if abs(stamp.width - stamp.height) > 0.02 * stamp.width:
            sys.exit('%s is %d×%d once trimmed — the page lays stamps out as squares'
                     % (name, stamp.width, stamp.height))
        stamp = stamp.resize((STAMP_PX, STAMP_PX), Image.LANCZOS)
        slug = stamp_slug(name)
        stamp = age_stamp(stamp, zlib.crc32(slug.encode()))
        webp(stamp, 'stamp-%s.webp' % slug, quality=90, alpha_quality=90)


PARTS = ('cover', 'flighty', 'stamps')


def main():
    os.makedirs(OUT, exist_ok=True)
    parts = sys.argv[1:] or PARTS
    for part in parts:
        if part not in PARTS:
            sys.exit('unknown part %r — choose from: %s' % (part, ', '.join(PARTS)))
    if 'cover' in parts:
        build_cover()
        build_grain()
    if 'flighty' in parts:
        print('pages: map %.4f, data %.4f × %.4f of the cover height' % (MAP_W, DATA_W, PAGE_H))
        for variant, filename in VARIANTS.items():
            build_flighty(variant, filename)
    if 'stamps' in parts:
        build_stamps()


if __name__ == '__main__':
    main()
