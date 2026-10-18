#!/usr/bin/env python3
"""
build-globes.py — the two globes on the passport's "Countries visited" page.

    python3 tools/build-globes.py

Writes assets/passport/web/globe-west.svg and globe-east.svg from the travel
page's map (assets/travel/countries.json: Natural Earth, public domain, via
world-atlas). No dependencies: it reads the TopoJSON itself.

**Adding a country to the page never needs this** — that's a line in
PASSPORT_COUNTRIES (js/passport-data.js). Rerun it only to change the art.

Each globe is Lambert's azimuthal equal-area projection, the one atlases use
for hemisphere maps — small countries near the rim keep their size instead of
thinning to a sliver — seen through an elliptical window (RX × RY) wider than
it is tall: it reaches a little past a hemisphere east and west, so Europe
shows on both globes, and stops short of the poles. js/passport.js flattens it
a touch more when it lays the globe on the page.

The output is what js/passport.js expects: a 1200 × 923 viewBox, an
<ellipse id="frame"> for the rim, and a <g id="countries"> of one <path> per
country, its id the two-letter ISO code. Paths use only absolute M, L and Z,
so the page can find each country's mainland without a path parser. Land
outside the window is pulled onto its rim, so a country it cuts ends there.

Deterministic: the same map gives byte-identical files.
"""

import json
import math
import os

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
MAP = os.path.join(ROOT, 'assets', 'travel', 'countries.json')
OUT = os.path.join(ROOT, 'assets', 'passport', 'web')

VIEW_W, VIEW_H = 1200, 923
RX, RY = 592, 455.4        # the window: an ellipse, as the page's design has it

# Where each globe looks — the (longitude, latitude) of its centre — and how
# big the earth is drawn behind the window, in px per earth radius (a
# hemisphere's rim is 1.414 radii out).
GLOBES = {
    'west': (-90, 12, 380),
    'east': (62, 14, 375),
}

# Countries whose map outline carries islands an ocean away. Joe visiting the
# Netherlands is not Joe visiting Bonaire, so only the parts inside the box —
# (west, east, south, north), in degrees — carry the country's id and get
# stamped; the rest are drawn as plain land.
HOME = {
    'NL': (-6, 12, 49, 56),
    'FR': (-6, 10, 41, 52),
}


def load_map():
    with open(MAP, encoding='utf-8') as f:
        topo = json.load(f)
    (sx, sy), (tx, ty) = topo['transform']['scale'], topo['transform']['translate']
    arcs = []
    for arc in topo['arcs']:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)

    def ring(indexes):
        out = []
        for i in indexes:
            a = arcs[i] if i >= 0 else arcs[~i][::-1]
            out.extend(a if not out else a[1:])
        return out

    countries = []
    for g in topo['objects']['countries']['geometries']:
        props = g.get('properties') or {}
        code = props.get('a2')
        if not code or g['type'] not in ('Polygon', 'MultiPolygon'):
            continue
        polys = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
        rings = [ring(r) for poly in polys for r in poly]
        countries.append((code, props.get('name', code), rings))
    countries.sort()
    return countries


def project(lon, lat, lon0, lat0):
    """Lambert azimuthal equal-area, in earth radii, north up."""
    l, p, p0 = math.radians(lon - lon0), math.radians(lat), math.radians(lat0)
    cos_c = math.sin(p0) * math.sin(p) + math.cos(p0) * math.cos(p) * math.cos(l)
    cos_c = max(-1.0, min(1.0, cos_c))
    k = math.sqrt(2 / (1 + cos_c)) if cos_c > -0.999999 else 0.0
    x = k * math.cos(p) * math.sin(l)
    y = k * (math.cos(p0) * math.sin(p) - math.sin(p0) * math.cos(p) * math.cos(l))
    return x, y


def draw_ring(pts, lon0, lat0, scale):
    out, inside = [], 0
    for lon, lat in pts:
        x, y = project(lon, lat, lon0, lat0)
        x, y = x * scale, -y * scale          # SVG's y runs down
        e = math.hypot(x / RX, y / RY)
        if e > 1:
            # Outside the window: onto its rim, along the same bearing.
            x, y = x / e, y / e
        else:
            inside += 1
        out.append((VIEW_W / 2 + x, VIEW_H / 2 + y))
    if not inside:
        return None
    # Drop points that land on the one before at this resolution.
    kept = []
    for x, y in out:
        p = (round(x, 1), round(y, 1))
        if not kept or p != kept[-1]:
            kept.append(p)
    # A ring ends where it began; Z closes it.
    if len(kept) > 1 and kept[-1] == kept[0]:
        kept.pop()
    if len(kept) < 3:
        return None
    return 'M' + 'L'.join('%g,%g' % p for p in kept) + 'Z'


def build(name, lon0, lat0, scale, countries):
    lines = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d">' % (VIEW_W, VIEW_H, VIEW_W, VIEW_H),
        ' <title>%s Hemisphere</title>' % {'west': 'Western', 'east': 'Eastern'}[name],
        ' <g id="countries" fill="none" stroke="#2b2b2b" stroke-width="0.8" stroke-linejoin="round">',
    ]
    for code, label, rings in countries:
        name = label.replace('&', '&amp;').replace('"', '&quot;')
        home, away = rings, []
        if code in HOME:
            w, e, s, n = HOME[code]
            mid = lambda r: (sum(p[0] for p in r) / len(r), sum(p[1] for p in r) / len(r))
            home = [r for r in rings if w <= mid(r)[0] <= e and s <= mid(r)[1] <= n]
            away = [r for r in rings if r not in home]
        d = ''.join(filter(None, (draw_ring(r, lon0, lat0, scale) for r in home)))
        if d:
            lines.append('  <path id="%s" data-name="%s" d="%s"/>' % (code, name, d))
        d = ''.join(filter(None, (draw_ring(r, lon0, lat0, scale) for r in away)))
        if d:
            lines.append('  <path data-part-of="%s" d="%s"/>' % (code, d))
    lines.append(' </g>')
    lines.append(' <ellipse id="frame" cx="%g" cy="%g" rx="%g" ry="%g" fill="none" stroke="#2b2b2b" stroke-width="1.6"/>'
                 % (VIEW_W / 2, VIEW_H / 2, RX, RY))
    lines.append('</svg>')
    return '\n'.join(lines) + '\n'


def main():
    countries = load_map()
    os.makedirs(OUT, exist_ok=True)
    for name, (lon0, lat0, scale) in GLOBES.items():
        path = os.path.join(OUT, 'globe-%s.svg' % name)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(build(name, lon0, lat0, scale, countries))
        print('  globe-%s.svg  %4d KB' % (name, os.path.getsize(path) // 1024))


if __name__ == '__main__':
    main()
