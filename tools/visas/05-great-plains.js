/* Visa pages 9–10 — the Great Plains.
   Left: the open prairie rolling away under a huge evening sky — the sun
   setting on the horizon, a creek winding toward us out of its glare between
   cottonwoods, a distant bison herd grazing on the swells, and a small bald
   eagle soaring. Right: one big American bison bull standing in the tall
   grass, three-quarter view facing left: the shaggy shoulder hump and cape,
   woolly forehead, short curved horns and beard, his coat lit gold along every
   edge that faces the low sun and falling into violet shadow behind. Blazing
   star (purple spikes) and prairie coneflowers frame the bottom corners.
   Quote (live text, see js/passport-data.js): Martin Luther King Jr., "We have
   a great dream. It started way back in 1776...". */

'use strict';

module.exports = {
  pages: [9, 10],
  svg(k) {
    const { n, rng, mix } = k;
    const parts = [];
    const HZ = 1000;            // horizon
    const SX = 610, SY = HZ;    // the setting sun, half down behind the land

    // ---- helpers ------------------------------------------------------------------
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    function stopsOf(st) {
      return st.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('');
    }
    // userSpaceOnUse gradients (coordinates in the referencing element's space)
    function lgU(gid, x1, y1, x2, y2, st) {
      return `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">${stopsOf(st)}</linearGradient>`;
    }
    function rgU(gid, cx, cy, r, st, fx, fy) {
      return `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"${fx != null ? ` fx="${n(fx)}" fy="${n(fy)}"` : ''}>${stopsOf(st)}</radialGradient>`;
    }
    // Colour ramp: stops [[t, colour], ...]
    function ramp(st, t) {
      t = clamp(t, 0, 1);
      for (let i = 0; i < st.length - 1; i++) {
        if (t <= st[i + 1][0]) return mix(st[i][1], st[i + 1][1], (t - st[i][0]) / (st[i + 1][0] - st[i][0]));
      }
      return st[st.length - 1][1];
    }
    // Smooth closed (or open) path through points (Catmull-Rom). A third value
    // on a point scales its tangents: 0 makes a sharp corner (a tuft tip).
    function smooth(pts, closed) {
      if (closed === undefined) closed = true;
      const N = pts.length;
      const P = (i) => (closed ? pts[(i + N) % N] : pts[clamp(i, 0, N - 1)]);
      let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
      const last = closed ? N : N - 1;
      for (let i = 0; i < last; i++) {
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        const t1 = p1[2] == null ? 1 : p1[2], t2 = p2[2] == null ? 1 : p2[2];
        const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * t1, p1[1] + ((p2[1] - p0[1]) / 6) * t1];
        const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * t2, p2[1] - ((p3[1] - p1[1]) / 6) * t2];
        d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
      }
      return closed ? d + 'Z' : d;
    }
    // Sample a Catmull-Rom curve through pts into ~N points per span.
    function spline(pts, per) {
      const out = [];
      const P = (i) => pts[clamp(i, 0, pts.length - 1)];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        for (let j = 0; j < per; j++) {
          const t = j / per, t2 = t * t, t3 = t2 * t;
          const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
          out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
        }
      }
      out.push(pts[pts.length - 1].slice(0, 2));
      return out;
    }
    function inside(poly, x, y) {
      let c = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    }
    // A shaggy edge from a to b: valleys on the line, tuft tips pushed out
    // along dir by ~len. Tips are sharp (tension 0.2).
    function fringe(a, b, m, len, dir, seed, vari, tip) {
      const r = rng(seed);
      const pts = [];
      for (let i = 0; i < m; i++) {
        const u0 = i / m, u1 = (i + 0.5 + (r() - 0.5) * 0.45) / m;
        const dv = r() < 0.3 ? 0.35 : 0.05;     // some valleys bite deeper
        pts.push([a[0] + (b[0] - a[0]) * u0 + dir[0] * len * dv, a[1] + (b[1] - a[1]) * u0 + dir[1] * len * dv]);
        const L = len * (1 - vari / 2 + r() * vari);
        pts.push([a[0] + (b[0] - a[0]) * u1 + (dir[0] + (r() - 0.5) * 0.4) * L, a[1] + (b[1] - a[1]) * u1 + dir[1] * L, tip == null ? 0.45 : tip]);
      }
      return pts;
    }
    // Woolly edge: resample a polyline every ~step and nudge points outward
    // (left of the direction of travel) in small irregular bumps.
    function woolly(pts, step, amp, seed) {
      const r = rng(seed);
      const out = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const nx = (b[1] - a[1]) / L, ny = -(b[0] - a[0]) / L;
        const m = Math.max(1, Math.round(L / step));
        for (let j = 0; j < m; j++) {
          const u = j / m, bump = (out.length % 2 ? 1 : -0.4) * amp * (0.6 + r() * 0.8);
          out.push([a[0] + (b[0] - a[0]) * u + nx * bump, a[1] + (b[1] - a[1]) * u + ny * bump]);
        }
      }
      out.push(pts[pts.length - 1]);
      return out;
    }
    // A scalloped blob (canopies): bumps around an ellipse.
    function lumpy(cx, cy, rx, ry, lobes, depth, seed) {
      const r = rng(seed);
      const pts = [];
      for (let i = 0; i < lobes; i++) {
        const a = (i / lobes) * Math.PI * 2;
        const j = 1 + (r() - 0.5) * 0.2;
        pts.push([cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j]);
      }
      let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
      for (let i = 0; i < lobes; i++) {
        const p = pts[i], q = pts[(i + 1) % lobes];
        const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
        d += `Q${n(mx + (mx - cx) * depth)} ${n(my + (my - cy) * depth)} ${n(q[0])} ${n(q[1])}`;
      }
      return d + 'Z';
    }
    // A lock of hair: rounded root at (x, y), hanging `l` long in direction
    // `ang` (degrees from straight down, + = toward +x), tip curling by `bend`.
    function lock(x, y, w, l, ang, bend) {
      const a = (ang * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
      const T = (px, py) => `${n(x + px * ca - py * sa)} ${n(y + px * sa + py * ca)}`;
      const b = bend * l;
      return `M${T(-w / 2, 0)}C${T(-w / 2, -w * 0.55)} ${T(w / 2, -w * 0.55)} ${T(w / 2, 0)}` +
        `C${T(w * 0.5, l * 0.45)} ${T(w * 0.2 + b, l * 0.8)} ${T(b, l)}` +
        `C${T(-w * 0.2 + b * 0.6, l * 0.74)} ${T(-w * 0.55, l * 0.42)} ${T(-w / 2, 0)}Z`;
    }
    // A woolly curl: a dark ring, a sunlit crescent on its upper left.
    function curl(x, y, r, c0, c1, c2) {
      return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${c0}"/>` +
        `<circle cx="${n(x - r * 0.18)}" cy="${n(y - r * 0.2)}" r="${n(r * 0.76)}" fill="${c1}"/>` +
        `<circle cx="${n(x + r * 0.04)}" cy="${n(y + r * 0.02)}" r="${n(r * 0.46)}" fill="${c2}"/>`;
    }
    // Lambert light from the low sun, which sits far off to the left.
    const LV = (() => { const v = [-0.84, -0.4, 0.36]; const m = Math.hypot(...v); return v.map((c) => c / m); })();
    function domeLight(x, y, c) {
      let nx = (x - c[0]) / c[2], ny = (y - c[1]) / c[3];
      let d = nx * nx + ny * ny;
      if (d > 0.98) { const m = Math.sqrt(d / 0.98); nx /= m; ny /= m; d = 0.98; }
      const nz = Math.sqrt(1 - d);
      return { lam: Math.max(0, nx * LV[0] + ny * LV[1] + nz * LV[2]), up: Math.max(0, -ny) };
    }

    // ---- sky, security print -------------------------------------------------------
    parts.push(k.sky([[0, '#D4CFEE'], [0.22, '#DDD3EF'], [0.42, '#EBD5E8'], [0.55, '#F5D8DA'], [0.635, '#FBDDC9'], [1, '#FCE2C6']]));
    parts.push(k.microtext('Great Plains', { y0: 40, y1: 960, opacity: 0.05 }));
    parts.push(k.guilloche({ y0: 120, y1: 900, lines: 22, opacity: 0.06, amp: 18, period: 760, phase: 2.1 }));

    // The sun's glow, and long faint rays fanning across the whole sky.
    {
      const glow = k.id('glow'), rays = k.id('rays'), disc = k.id('disc'), halo = k.id('halo');
      parts.push({
        defs: rgU(glow, SX, SY, 780, [[0, '#FFF6E2', 1], [0.2, '#FEE7CC', 0.78], [0.55, '#F9D6CF', 0.3], [1, '#F2D0D8', 0]]) +
          rgU(rays, SX, SY, 1500, [[0, '#FFFFFF', 0.24], [0.4, '#FFFFFF', 0.1], [0.8, '#FFFFFF', 0.03], [1, '#FFFFFF', 0]]) +
          k.linear(disc, 90, [[0, '#FFFBF0'], [0.6, '#FFF0D6'], [1, '#FDDDB4']]) +
          rgU(halo, 1560, 840, 600, [[0, '#FFF3E4', 0.7], [0.5, '#FBE3D6', 0.32], [1, '#F6DCDD', 0]]),
        svg: `<circle cx="${SX}" cy="${SY}" r="780" fill="url(#${glow})"/>` +
          k.sunburst(SX, SY, 190, 1800, 44, `url(#${rays})`, 1) +
          `<circle cx="1560" cy="840" r="600" fill="url(#${halo})"/>` +
          k.rosette(1560, 800, 400, { opacity: 0.075, rings: 9, lobes: 30 }) +
          `<circle cx="${SX}" cy="${SY}" r="126" fill="url(#${disc})"/>` +
          `<circle cx="${SX}" cy="${SY}" r="146" fill="none" stroke="#FFF4E2" stroke-width="3" stroke-opacity="0.5"/>` +
          `<circle cx="${SX}" cy="${SY}" r="170" fill="none" stroke="#FFF4E2" stroke-width="2" stroke-opacity="0.3"/>`,
      });
    }

    // Long evening cloud streaks, lit peach from below by the low sun.
    {
      const rc = rng(505);
      let s = '';
      const bands = [
        [40, 700, 430, 24], [300, 742, 300, 16], [700, 640, 300, 18], [90, 860, 380, 16], [820, 820, 220, 12],
        [1200, 470, 260, 16], [1740, 560, 320, 22], [1890, 630, 190, 12], [1260, 930, 200, 10], [1840, 930, 240, 12],
      ];
      for (const [x, y, w, h] of bands) {
        s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#FBEAE6" fill-opacity="${n(0.55 + rc() * 0.25)}"/>`;
        s += `<rect x="${n(x + w * 0.1)}" y="${n(y + h * 0.55)}" width="${n(w * 0.75)}" height="${n(h * 0.5)}" rx="${n(h * 0.25)}" fill="#FFE2C4" fill-opacity="0.7"/>`;
        s += `<rect x="${n(x + w * 0.2)}" y="${n(y - h * 0.15)}" width="${n(w * 0.5)}" height="${n(h * 0.4)}" rx="${n(h * 0.2)}" fill="#DCD0EE" fill-opacity="0.45"/>`;
      }
      s += k.cloud(240, 470, 30, '#FBF1F0', 0.6) + k.cloud(860, 420, 24, '#FBF1F0', 0.5) + k.cloud(1990, 420, 28, '#FBF1F0', 0.5);
      parts.push({ svg: s });
    }

    // ---- the land -------------------------------------------------------------------------
    function hill(o) {
      const r = rng(o.seed || 1);
      const pts = [];
      let wob = 0;
      for (let x = -40; x <= k.W + 40; x += 24) {
        let y = o.y;
        for (const p of o.peaks || []) {
          const u = Math.abs(x - p[0]) / p[2];
          if (u < 1) y -= p[1] * 0.5 * (1 + Math.cos(Math.PI * u));
        }
        wob = wob * 0.7 + (r() - 0.5) * (o.rough || 3);
        pts.push([x, y + wob]);
      }
      const line = smooth(pts, false);
      const area = line + `L${n(pts[pts.length - 1][0])} ${k.H + 20}L${n(pts[0][0])} ${k.H + 20}Z`;
      return { pts, line, area };
    }
    function crestY(h, x) {
      const p = h.pts;
      for (let i = 0; i < p.length - 1; i++) if (x >= p[i][0] && x <= p[i + 1][0]) return p[i][1] + (p[i + 1][1] - p[i][1]) * (x - p[i][0]) / (p[i + 1][0] - p[i][0]);
      return p[0][1];
    }
    // Far buttes on the horizon, flat-topped, hazy violet.
    {
      const bg = k.id('butte');
      function butte(x, w, h) {
        const t = w * 0.16;
        return `M${x} ${HZ + 4}L${n(x + t * 0.6)} ${n(HZ - h * 0.55)}L${n(x + t)} ${n(HZ - h * 0.62)}L${n(x + t * 1.3)} ${HZ - h}L${n(x + w - t * 1.5)} ${HZ - h}L${n(x + w - t * 1.1)} ${n(HZ - h * 0.7)}L${n(x + w - t * 0.5)} ${n(HZ - h * 0.6)}L${x + w} ${HZ + 4}Z`;
      }
      const d = butte(40, 230, 56) + butte(230, 120, 34) + butte(1880, 260, 70) + butte(1720, 150, 38) + butte(880, 110, 26);
      const far = hill({ y: HZ, peaks: [[300, 10, 300], [1400, 14, 420], [2000, 10, 200]], seed: 3, rough: 1.5 });
      parts.push({
        defs: k.linear(bg, 90, [[0, '#BFAFD9'], [1, '#D9C9E0']]),
        svg: `<path d="${d}" fill="url(#${bg})" fill-opacity="0.8"/><path d="${far.area}" fill="#CEC0DC"/>`,
      });
    }
    parts.push(k.haze(HZ - 70, 120, '#FCE6D6', 0.7));

    // The swells, back to front: lit golden-green crests falling into violet
    // hollows, each with a thin line of light along its crest.
    function swell(h, top, bottom, y0, y1, rim) {
      const g = k.id('swell');
      return {
        defs: lgU(g, 0, y0, 0, y1, [[0, top], [0.55, mix(top, bottom, 0.55)], [1, bottom]]),
        svg: `<path d="${h.area}" fill="url(#${g})"/>` +
          (rim ? `<path d="${h.line}" fill="none" stroke="${rim}" stroke-width="3" stroke-opacity="0.65"/>` : ''),
      };
    }
    const hA = hill({ y: 1030, peaks: [[160, 12, 240], [560, 8, 220], [1300, 16, 340], [1900, 14, 300]], seed: 21, rough: 2 });
    const hB = hill({ y: 1078, peaks: [[120, 18, 280], [400, 10, 200], [880, 16, 260], [1500, 26, 420], [2040, 20, 260]], seed: 34, rough: 2 });
    const hC = hill({ y: 1160, peaks: [[250, 34, 340], [760, 30, 300], [1600, 50, 520]], seed: 44, rough: 2.5 });
    const hD = hill({ y: 1300, peaks: [[140, 50, 380], [1500, 80, 560], [2080, 40, 300]], seed: 55, rough: 3 });
    parts.push(swell(hA, '#DCD6B2', '#C6B8D4', 1010, 1080, '#FBEBC8'));

    // ---- the distant herd -------------------------------------------------------------------
    // Little bison, 100 × 60 box facing left, feet on y = 60.
    function minibison(x, y, s, flip, grazing, tone, warm) {
      const head = grazing ? 'M10 58C6 56 4 50 6 44C8 36 12 28 18 24' : 'M6 36C4 30 6 24 10 20C12 14 18 10 24 8';
      const tail = grazing ? 'C26 48 22 52 18 56C16 58 12 60 10 58Z' : 'C26 48 22 50 18 52C16 48 14 44 12 42C9 41 7 39 6 36Z';
      const body = head + 'C30 3 38 0 44 1C54 3 66 8 78 12C88 14 96 16 98 24C100 32 98 40 94 44' +
        'L94 60L89 60L88 48L84 48L82 58L78 58L78 46C70 44 58 44 50 46L48 60L43 60L42 50L38 50L36 58L32 58L31 48' + tail;
      const cape = 'M18 24C22 14 30 4 42 1C50 2 56 6 58 10C60 20 58 32 56 44L30 50C24 44 20 34 18 24Z';
      const rim = grazing ? 'M8 46C10 34 22 12 42 2' : 'M8 28C12 16 26 4 42 2';
      return `<g transform="translate(${n(x)} ${n(y - 60 * s)}) scale(${flip ? -s : s} ${s})${flip ? ' translate(-100 0)' : ''}">` +
        `<path d="${body}" fill="${tone}"/><path d="${cape}" fill="${warm}" fill-opacity="0.55"/>` +
        `<path d="${rim}" fill="none" stroke="#F7CB94" stroke-width="${n(2.2 / s)}" stroke-opacity="0.75" stroke-linecap="round"/></g>`;
    }
    function herd(list, tone, warm) {
      let s = '';
      for (const [x, y, sc, f, g] of list) s += minibison(x, y, sc, f, g, tone, warm);
      return s;
    }
    parts.push({
      svg: herd([
        [70, 1036, 0.2, 0, 1], [104, 1034, 0.18, 0, 0], [140, 1038, 0.21, 1, 1], [262, 1030, 0.17, 0, 1], [300, 1034, 0.19, 0, 1],
        [786, 1026, 0.17, 0, 1], [820, 1029, 0.18, 1, 0], [858, 1024, 0.16, 0, 1],
      ], '#8E7CAE', '#C49A8E'),
    });
    parts.push(swell(hB, '#D9D69E', '#B9AACB', 1050, 1140, '#FBEBC4'));
    parts.push({
      svg: herd([
        [40, 1084, 0.34, 0, 1], [96, 1080, 0.3, 0, 1], [150, 1090, 0.38, 1, 1], [206, 1082, 0.32, 0, 0], [250, 1094, 0.4, 0, 1],
        [310, 1086, 0.33, 1, 1], [360, 1098, 0.36, 0, 1], [176, 1104, 0.42, 0, 1], [420, 1090, 0.3, 0, 0],
        [790, 1074, 0.3, 0, 1], [834, 1070, 0.27, 1, 1], [880, 1078, 0.32, 0, 0], [736, 1080, 0.28, 0, 1],
      ], '#6B5A90', '#B07A70'),
    });

    // ---- the creek ---------------------------------------------------------------------------
    // It runs out of the sun's glare on the horizon, slips behind the near swell,
    // and comes on toward us, widening, to leave the page bottom-centre.
    const creek = spline([
      [618, 1004], [646, 1012], [640, 1026], [596, 1044], [548, 1068], [528, 1096], [556, 1132], [640, 1176], [738, 1228],
      [792, 1290], [778, 1360], [712, 1440], [654, 1520], [630, 1610],
    ], 12).map((p) => {
      const t = clamp((p[1] - 1004) / (1610 - 1004), 0, 1);
      const wob = 1 + 0.22 * Math.sin(t * 31 + 0.6) + 0.12 * Math.sin(t * 83 + 2.1);
      return [p[0], p[1], (3 + 300 * Math.pow(t, 1.45)) * wob, t];
    });
    function drawCreek(t0, t1) {
      const seg = creek.filter((p) => p[3] >= t0 && p[3] <= t1);
      const rn = rng(Math.round(t0 * 1000) + 5);
      let jl = 0, jr = 0;
      const L = seg.map((p) => { jl = jl * 0.6 + (rn() - 0.5) * p[2] * 0.08; return [p[0] - p[2] / 2 + jl, p[1]]; });
      const R = seg.map((p) => { jr = jr * 0.6 + (rn() - 0.5) * p[2] * 0.08; return [p[0] + p[2] / 2 + jr, p[1]]; });
      const poly = L.concat(R.slice().reverse());
      const d = 'M' + poly.map((p) => `${n(p[0])} ${n(p[1])}`).join('L') + 'Z';
      const bank = 'M' + L.concat(R.slice().reverse()).map((p, i, a) => {
        const q = i < L.length ? seg[i] : seg[a.length - 1 - i];
        return `${n(p[0])} ${n(p[1] - 2 - q[3] * 12)}`;
      }).join('L') + 'Z';
      const water = k.id('water'), wclip = k.id('wclip');
      let s = `<path d="${bank}" fill="#8A78A8"/><path d="${d}" fill="url(#${water})"/>`;
      let inner = '';
      const rr = rng(Math.round(t0 * 1000) + 71);
      let glit = '', lite = '', dark = '';
      for (const p of seg) {
        const th = 1.6 + p[3] * 4;
        for (let j = 0; j < 2; j++) {
          if (rr() < (p[3] < 0.3 ? 0.4 : 0.62)) continue;
          const w = p[2] * (0.08 + rr() * 0.3);
          const x = p[0] - p[2] / 2 + rr() * (p[2] - w);
          const y = p[1] + (rr() - 0.5) * th * 3;
          if (p[3] < 0.3) glit += `M${n(x)} ${n(y)}h${n(w)}`;
          else if (rr() < 0.6) lite += `M${n(x)} ${n(y)}h${n(w)}`;
          else dark += `M${n(x)} ${n(y)}h${n(w)}`;
        }
      }
      inner += `<path d="${glit}" stroke="#FFFBF0" stroke-width="2.2" stroke-opacity="0.8" stroke-linecap="round"/>`;
      inner += `<path d="${lite}" stroke="#F4EEFC" stroke-width="${n(1.8 + t1 * 1.6)}" stroke-opacity="0.35" stroke-linecap="round"/>`;
      inner += `<path d="${dark}" stroke="#6E6CBC" stroke-width="${n(1.8 + t1 * 1.6)}" stroke-opacity="0.22" stroke-linecap="round"/>`;
      // the reflected far bank: a violet band under every upper edge
      inner += `<path d="${d}" transform="translate(0 ${n(-6 - t1 * 18)})" fill="none" stroke="#6A5FA8" stroke-width="${n(8 + t1 * 26)}" stroke-opacity="0.32"/>`;
      s += `<g clip-path="url(#${wclip})">${inner}</g>`;
      // grass leaning over the edges
      let blades = '';
      const rb = rng(Math.round(t0 * 1000) + 99);
      for (const p of seg) {
        if (p[3] < 0.45) continue;
        for (const side of [-1, 1]) {
          if (rb() < 0.3) continue;
          const bx = p[0] + side * p[2] / 2 + (rb() - 0.5) * 8, by = p[1] + 4;
          const hgt = 14 + p[3] * 40 * rb(), lean = -side * (4 + rb() * 10);
          blades += `M${n(bx - 2.5)} ${n(by)}Q${n(bx + lean * 0.4)} ${n(by - hgt * 0.6)} ${n(bx + lean)} ${n(by - hgt)}Q${n(bx + lean * 0.3 + 1)} ${n(by - hgt * 0.5)} ${n(bx + 2.5)} ${n(by)}Z`;
        }
      }
      s += `<path d="${blades}" fill="#A3AC62" fill-opacity="0.9"/>`;
      return {
        defs: lgU(water, 0, HZ, 0, k.H, [[0, '#FFF3DE'], [0.06, '#FCE0C8'], [0.2, '#EED3DC'], [0.45, '#C9C2EA'], [0.75, '#A4A8E4'], [1, '#9097DA']]) +
          `<clipPath id="${wclip}"><path d="${d}"/></clipPath>`,
        svg: s,
      };
    }
    parts.push(drawCreek(0, 0.3));

    // Cottonwoods in the creek bottom: broad, clumpy crowns lit on the sun side.
    function cottonwood(x, y, s, seed) {
      const r = rng(seed);
      let t = `<ellipse cx="${n(x + s * 0.55)}" cy="${n(y + 2)}" rx="${n(s * 0.75)}" ry="${n(s * 0.07)}" fill="#8E80BA" fill-opacity="0.45"/>`;
      // a short trunk forking into limbs that disappear into the crown
      t += `<path d="M${n(x - s * 0.07)} ${n(y)}C${n(x - s * 0.04)} ${n(y - s * 0.3)} ${n(x - s * 0.2)} ${n(y - s * 0.5)} ${n(x - s * 0.3)} ${n(y - s * 0.66)}L${n(x - s * 0.24)} ${n(y - s * 0.68)}` +
        `C${n(x - s * 0.1)} ${n(y - s * 0.54)} ${n(x)} ${n(y - s * 0.44)} ${n(x + s * 0.02)} ${n(y - s * 0.42)}C${n(x + s * 0.08)} ${n(y - s * 0.56)} ${n(x + s * 0.18)} ${n(y - s * 0.64)} ${n(x + s * 0.28)} ${n(y - s * 0.72)}` +
        `L${n(x + s * 0.32)} ${n(y - s * 0.68)}C${n(x + s * 0.16)} ${n(y - s * 0.52)} ${n(x + s * 0.08)} ${n(y - s * 0.3)} ${n(x + s * 0.08)} ${n(y)}Z" fill="#5E5482"/>`;
      // the crown: several clumps, each shaded violet below and lit gold-green above-left
      const clumps = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI + Math.PI + (r() - 0.5) * 0.4;
        clumps.push([x + Math.cos(a) * s * 0.42 + s * 0.04, y - s * 0.86 + Math.sin(a) * s * 0.26 + s * 0.12, s * (0.24 + r() * 0.08)]);
      }
      clumps.push([x + s * 0.02, y - s * 0.98, s * 0.3], [x - s * 0.18, y - s * 0.74, s * 0.24], [x + s * 0.26, y - s * 0.76, s * 0.24]);
      let sh = '', mid = '', hi = '', top = '';
      clumps.forEach(([cx, cy, rr], i) => {
        sh += `<path d="${lumpy(cx + rr * 0.1, cy + rr * 0.1, rr, rr * 0.86, 9, 0.2, seed * 10 + i)}"/>`;
        mid += `<path d="${lumpy(cx - rr * 0.08, cy - rr * 0.1, rr * 0.82, rr * 0.7, 9, 0.2, seed * 10 + i + 50)}"/>`;
        hi += `<path d="${lumpy(cx - rr * 0.3, cy - rr * 0.32, rr * 0.48, rr * 0.4, 7, 0.22, seed * 10 + i + 90)}"/>`;
        top += `<circle cx="${n(cx - rr * 0.42)}" cy="${n(cy - rr * 0.46)}" r="${n(rr * 0.16)}"/>`;
      });
      t += `<g fill="#6D6A9E">${sh}</g><g fill="#7F9C80">${mid}</g><g fill="#B5C98E">${hi}</g><g fill="#E6E4A8" fill-opacity="0.85">${top}</g>`;
      return t;
    }

    parts.push(swell(hC, '#D5D68C', '#AE9FC6', 1100, 1230, '#FCEBBE'));
    parts.push({
      svg: cottonwood(430, crestY(hC, 430) + 34, 96, 3) + cottonwood(500, crestY(hC, 500) + 30, 74, 8) +
        cottonwood(872, crestY(hC, 872) + 26, 70, 12) + cottonwood(930, crestY(hC, 930) + 24, 52, 15),
    });
    parts.push(swell(hD, '#CFD282', '#B1A2C8', 1200, 1440, '#FCEDBE'));

    // Meadow texture: grass strokes, violet shadow streaks, flower specks.
    {
      const rg = rng(57);
      let a = '', b = '', c = '', specksP = '', specksC = '';
      for (let i = 0; i < 520; i++) {
        const x = rg() * k.W, y = 1180 + Math.pow(rg(), 0.8) * 400;
        if (y < crestY(hD, x) + 10) continue;
        const L = 8 + (y - 1180) * 0.08 + rg() * 14;
        const seg = `M${n(x)} ${n(y)}q${n(3 - rg() * 6)} ${n(-L * 0.5)} ${n(5 - rg() * 10)} ${n(-L)}`;
        const p = rg();
        if (p < 0.45) a += seg; else if (p < 0.8) b += seg; else c += seg;
      }
      for (let i = 0; i < 160; i++) {
        const x = rg() * k.W, y = 1120 + rg() * 420;
        if (!(y > crestY(hD, x) + 6 || (y > crestY(hC, x) + 4 && y < crestY(hD, x)))) continue;
        const r0 = 1.8 + (y - 1100) * 0.006;
        if (rg() < 0.6) specksP += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r0)}"/>`;
        else specksC += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r0)}"/>`;
      }
      let streak = '';
      const rs = rng(58);
      for (let i = 0; i < 16; i++) {
        const x = rs() * k.W, y = 1320 + rs() * 240, w = 120 + rs() * 260;
        streak += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(w)}" ry="${n(5 + rs() * 8)}"/>`;
      }
      parts.push({
        svg: `<g fill="#9F8FC6" fill-opacity="0.22">${streak}</g>` +
          `<path d="${a}" stroke="#A2AC5E" stroke-width="3" stroke-linecap="round" fill="none" stroke-opacity="0.55"/>` +
          `<path d="${b}" stroke="#9A88C4" stroke-width="3" stroke-linecap="round" fill="none" stroke-opacity="0.42"/>` +
          `<path d="${c}" stroke="#F1DE9A" stroke-width="2.6" stroke-linecap="round" fill="none" stroke-opacity="0.6"/>` +
          `<g fill="#8E62D0" fill-opacity="0.7">${specksP}</g><g fill="#F08A6E" fill-opacity="0.7">${specksC}</g>`,
      });
    }
    {
      let t0 = 0.3;
      for (const p of creek) { if (p[3] > 0.1 && p[1] > crestY(hC, p[0]) + 6) { t0 = p[3]; break; } }
      parts.push(drawCreek(t0, 1));
    }

    // ---- the eagle, small and high -------------------------------------------------------------
    {
      const ex = 360, ey = 560, S = 0.95;
      const ew = k.id('ewing'), eb = k.id('ebody');
      const wing = (sg) => {
        const X = (v) => n(sg * v);
        return `M${X(8)} -6C${X(40)} -22 ${X(80)} -27 ${X(110)} -22` +
          `L${X(128)} -32L${X(124)} -21L${X(142)} -26L${X(133)} -15L${X(148)} -15L${X(135)} -7L${X(146)} -2L${X(131)} 1L${X(138)} 8L${X(120)} 7` +
          `C${X(98)} 15 ${X(62)} 23 ${X(32)} 22C${X(20)} 21 ${X(12)} 15 ${X(8)} 8Z`;
      };
      let e = '';
      e += `<path d="${wing(1)}" fill="url(#${ew})"/><path d="${wing(-1)}" fill="url(#${ew})"/>`;
      e += `<path d="M-10 -8C-40 -22 -80 -27 -110 -22M10 -8C40 -22 80 -27 110 -22" stroke="#F6C08C" stroke-width="3.5" fill="none" stroke-opacity="0.8" stroke-linecap="round"/>`;
      e += `<path d="M-12 2C-40 -8 -78 -12 -104 -10C-80 -4 -44 6 -14 10ZM12 2C40 -8 78 -12 104 -10C80 -4 44 6 14 10Z" fill="#5B4F8C" fill-opacity="0.65"/>`;
      e += `<path d="M-8 22C-14 34 -18 46 -16 54C-6 58 6 58 16 54C18 46 14 34 8 22Z" fill="#FBF8FF"/><path d="M-16 54C-6 58 6 58 16 54L14 50C4 53 -4 53 -14 50Z" fill="#D8D2F0"/>`;
      e += `<path d="M-13 -10C-16 6 -12 22 -5 30L5 30C12 22 16 6 13 -10Z" fill="url(#${eb})"/>`;
      e += `<path d="M-9 -8C-11 -20 -5 -30 2 -30C9 -30 12 -20 9 -8Z" fill="#FFFFFF"/><path d="M4 -30C9 -28 11 -20 9 -8L5 -8C7 -18 6 -26 4 -30Z" fill="#DCD6F2"/>`;
      e += `<path d="M-3 -30L1 -40L5 -30Z" fill="${k.C.gold}"/>`;
      e += `<path d="M-6 24L-8 30M6 24L8 30" stroke="${k.C.gold}" stroke-width="3" stroke-linecap="round"/>`;
      parts.push({
        defs: k.linear(ew, 90, [[0, '#3F3A86'], [1, '#262257']]) + k.linear(eb, 0, [[0, '#4A3F7E'], [1, '#2A2458']]),
        svg: `<g transform="translate(${ex} ${ey}) rotate(-7) scale(${S})">${e}</g>` +
          k.bird(900, 470, 11, '#7A71B4') + k.bird(936, 494, 8, '#7A71B4') + k.bird(1890, 480, 10, '#7A71B4'),
      });
    }

    // ---- the bison ------------------------------------------------------------------------------
    // Bison space: ground at y = 0 (hooves), muzzle side on the left, the top of
    // the hump at y ≈ -700. Body in near-profile, head turned toward us.
    const BX = 1166, BY = 1362, BS = 1;
    {
      const gid = (p) => k.id('b' + p);
      const blur = gid('blur'), blur2 = gid('blur2');
      const cCape = gid('ccape'), cHind = gid('chind'), cFace = gid('cface'), cBon = gid('cbon'), cBeard = gid('cbeard');
      let defs = '';
      let b = '';

      // Colour ramps (0 = deepest shadow, 1 = sunlit tip)
      const capeR = [[0, '#1F1939'], [0.16, '#2F2349'], [0.3, '#47304F'], [0.42, '#64404C'], [0.54, '#87533F'], [0.66, '#AE6C3F'], [0.78, '#D38F52'], [0.9, '#EFB878'], [1, '#FFE0AA']];
      const darkR = [[0, '#16112A'], [0.22, '#231A3C'], [0.42, '#382747'], [0.6, '#583848'], [0.74, '#83503F'], [0.88, '#C27E4F'], [1, '#F2C08A']];
      const hindR = [[0, '#1A1530'], [0.3, '#282042'], [0.5, '#3A2A4A'], [0.68, '#583A4C'], [0.82, '#8A584A'], [0.92, '#C88B5A'], [1, '#F0BE86']];

      // ---- outlines
      const capeTop = woolly([[182, -456], [204, -520], [230, -574], [262, -620], [298, -660], [336, -688], [374, -702], [412, -700], [448, -688], [480, -668], [508, -642], [532, -612]], 15, 3.2, 41);
      const capeP = capeTop
        .concat(fringe([532, -612], [594, -252], 11, 24, [0.8, 0.45], 42, 1.1))
        .concat(fringe([594, -252], [444, -228], 6, 28, [0.08, 1], 43, 1))
        .concat(fringe([444, -228], [244, -198], 8, 44, [-0.02, 1], 44, 0.9))
        .concat([[240, -206], [228, -250], [212, -310], [196, -372], [186, -420]]);
      const hindP = [
        [470, -664], [540, -628], [600, -602], [660, -585], [720, -573], [770, -562], [806, -546], [828, -516], [838, -474], [836, -424], [828, -374],
        [816, -326], [806, -282], [800, -240], [803, -200, 0.4], [792, -156], [786, -106], [784, -58], [787, -30], [748, -30], [747, -62], [744, -112],
        [738, -160], [728, -200], [714, -228], [694, -240], [666, -244], [634, -240], [604, -236], [580, -234], [560, -300], [520, -420], [480, -560],
      ];
      const farHindP = [[676, -250], [664, -220], [668, -196], [674, -150], [678, -96], [680, -44], [708, -44], [708, -98], [710, -156], [716, -210], [722, -240], [716, -256]];
      const farFrontP = [[226, -190], [232, -150], [236, -100], [238, -46], [266, -46], [266, -102], [270, -150], [274, -190]];
      const farChapP = [[180, -330], [270, -330], [282, -250]].concat(fringe([280, -214], [196, -214], 4, 36, [0, 1], 45, 0.8)).concat([[192, -260]]);
      const nearFrontP = [[280, -210], [281, -156], [289, -114], [295, -64], [299, -40], [301, -28], [336, -28], [337, -46], [336, -84], [339, -130], [347, -172], [350, -210]];

      const capeD = smooth(capeP), hindD = smooth(hindP);
      defs += `<clipPath id="${cCape}"><path d="${capeD}"/></clipPath><clipPath id="${cHind}"><path d="${hindD}"/></clipPath>`;
      defs += `<filter id="${blur}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>`;
      defs += `<filter id="${blur2}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>`;

      // ---- cast shadow (long, to the right, away from the low sun)
      const shG = gid('shadow');
      defs += lgU(shG, 180, 0, 1100, 0, [[0, '#3E2F6E', 0.42], [0.6, '#5B4A8C', 0.26], [1, '#6E5E9E', 0]]);
      b += `<path d="M210 -4C380 -18 760 -22 1000 -10C1060 -6 1060 10 980 14C760 26 380 24 230 12C190 8 190 0 210 -4Z" fill="url(#${shG})" filter="url(#${blur2})"/>`;

      // ---- far legs (deep shadow)
      const farG = gid('far'), hoofG = gid('hoof');
      defs += lgU(farG, 0, -300, 0, 0, [[0, '#2A2042'], [1, '#1A1530']]);
      defs += k.linear(hoofG, 0, [[0, '#3C4AB8'], [0.35, '#232A78'], [1, '#121540']]);
      b += `<path d="${smooth(farHindP)}" fill="url(#${farG})"/><path d="M676 -48h36l6 30h-48z" fill="#141233"/>`;
      b += `<path d="${smooth(farFrontP)}" fill="url(#${farG})"/><path d="M234 -50h36l6 32h-48z" fill="#141233"/>`;
      b += `<path d="${smooth(farChapP)}" fill="#2C2140"/>`;

      // ---- tail
      b += `<path d="M818 -512C840 -490 848 -440 846 -384" fill="none" stroke="#2A2042" stroke-width="11" stroke-linecap="round"/>`;
      b += `<path d="${smooth([[838, -400], [856, -380], [862, -330], [852, -284, 0.3], [846, -310], [838, -282, 0.3], [832, -330], [832, -380]])}" fill="#251C3C"/>`;

      // ---- hindquarters: short dark coat, sky light along the back
      const hindG = gid('hind');
      defs += lgU(hindG, 0, -600, 0, -260, [[0, ramp(hindR, 0.56)], [0.35, ramp(hindR, 0.42)], [0.75, ramp(hindR, 0.24)], [1, ramp(hindR, 0.12)]]);
      b += `<path d="${hindD}" fill="url(#${hindG})"/>`;
      {
        let s = '';
        s += `<path d="M500 -640C600 -600 700 -578 800 -556C820 -540 830 -510 832 -470" fill="none" stroke="#A494D0" stroke-width="44" stroke-opacity="0.38" filter="url(#${blur})"/>`;
        s += `<path d="M540 -626C620 -596 700 -578 790 -561" fill="none" stroke="#F3B983" stroke-width="8" stroke-opacity="0.45" filter="url(#${blur2})"/>`;
        // the thigh: a rounded muscle mass with its own shadow line and sheen
        s += `<path d="M708 -470C760 -480 812 -440 822 -380C828 -320 806 -262 790 -226C760 -240 730 -262 716 -290C700 -340 690 -420 708 -470Z" fill="#120E26" fill-opacity="0.3"/>`;
        s += `<path d="M716 -456C704 -410 706 -350 726 -300" fill="none" stroke="#A07070" stroke-width="12" stroke-opacity="0.4" filter="url(#${blur2})"/>`;
        s += `<path d="M640 -560C700 -540 760 -520 790 -470" fill="none" stroke="#8A6C9C" stroke-width="22" stroke-opacity="0.35" filter="url(#${blur})"/>`;
        const r = rng(611);
        let hl = '', dk = '';
        for (let i = 0; i < 420; i++) {
          const x = 560 + r() * 280, y = -600 + r() * 360;
          if (!inside(hindP, x, y)) continue;
          const L = 7 + r() * 9, a = (100 + (x - 700) * 0.08 + (r() - 0.5) * 30) * Math.PI / 180;
          const seg = `M${n(x)} ${n(y)}q${n(Math.cos(a) * L * 0.5 + 2)} ${n(Math.sin(a) * L * 0.5)} ${n(Math.cos(a) * L)} ${n(Math.sin(a) * L)}`;
          if (y < -500 + (x - 560) * 0.12 && r() < 0.75) hl += seg; else dk += seg;
        }
        s += `<path d="${hl}" fill="none" stroke="#B9849A" stroke-width="2.4" stroke-opacity="0.45" stroke-linecap="round"/>`;
        s += `<path d="${dk}" fill="none" stroke="#120E26" stroke-width="2.4" stroke-opacity="0.35" stroke-linecap="round"/>`;
        const occ = gid('occ');
        defs += lgU(occ, 0, -380, 0, -250, [[0, '#120E24', 0], [1, '#120E24', 0.55]]);
        s += `<rect x="540" y="-400" width="320" height="180" fill="url(#${occ})"/>`;
        // the cape's shadow falling on the flank
        s += `<path d="M560 -630C600 -540 590 -420 616 -280" fill="none" stroke="#120E24" stroke-width="44" stroke-opacity="0.55" filter="url(#${blur})"/>`;
        b += `<g clip-path="url(#${cHind})">${s}</g>`;
      }
      b += `<path d="M746 -34h38l8 34h-54z" fill="url(#${hoofG})"/><path d="M766 -30v28" stroke="#0E0C22" stroke-width="2.4"/>`;

      // ---- near front leg (below the chaps)
      const legG = gid('leg');
      defs += lgU(legG, 284, 0, 344, 0, [[0, '#7A4C4E'], [0.3, '#3E2A48'], [1, '#1C1734']]);
      b += `<path d="${smooth(nearFrontP)}" fill="url(#${legG})"/>`;
      b += `<path d="M287 -160C285 -120 292 -80 297 -44" fill="none" stroke="#F0B078" stroke-width="3.4" stroke-opacity="0.65" stroke-linecap="round"/>`;
      b += `<path d="M298 -32h40l9 32h-58z" fill="url(#${hoofG})"/><path d="M318 -30v28" stroke="#0E0C22" stroke-width="2.4"/>`;
      b += `<path d="M300 -26l-6 22" stroke="#8C98F0" stroke-width="2.6" stroke-opacity="0.6" stroke-linecap="round"/>`;

      // ---- the cape: hump, shoulders, chaps — shaggy locks lit by the low sun
      const capeDome = [330, -470, 290, 300];
      const capeT = (x, y) => {
        const L = domeLight(x, y, capeDome);
        const occ = clamp((y + 330) / 200, 0, 1) * 0.2;
        return clamp(0.24 + L.lam * 0.8 + L.up * 0.04 - occ, 0, 1);
      };
      {
        const capeG = gid('cape');
        defs += rgU(capeG, 250, -600, 520, [[0, ramp(capeR, 0.72)], [0.3, ramp(capeR, 0.52)], [0.62, ramp(capeR, 0.32)], [1, ramp(capeR, 0.16)]], 200, -640);
        b += `<path d="${capeD}" fill="url(#${capeG})"/>`;
        let s = '';
        const r = rng(907);
        const locks = [];
        for (let y = -140; y > -730; y -= 21) {
          for (let x = 170 + (Math.round(y / 21) % 2 ? 15 : 0); x < 620; x += 29) {
            const px = x + (r() - 0.5) * 18, py = y + (r() - 0.5) * 12;
            if (!inside(capeP, px, py + 10)) continue;
            locks.push([px, py, r(), r(), r()]);
          }
        }
        locks.sort((a, c) => c[1] - a[1]);   // lower rows first; locks above hang over them
        for (const [px, py, r1, r2, r3] of locks) {
          const t = capeT(px, py);
          const chap = py > -320 && px < 450;
          const w = (chap ? 22 : 28) + r1 * 14;
          const l = (chap ? 66 : 46) + r2 * (chap ? 36 : 28);
          const ang = chap ? 4 + (r3 - 0.5) * 14 : -14 + clamp((px - 200) / 380, 0, 1) * 36 + (r3 - 0.5) * 24;
          s += `<path d="${lock(px, py, w, l, ang, 0.1 + r1 * 0.12)}" fill="${ramp(capeR, t - 0.05)}"/>`;
          s += `<path d="${lock(px - w * 0.14, py + 3, w * 0.5, l * 0.72, ang + 4, 0.16)}" fill="${ramp(capeR, t + 0.1)}" fill-opacity="0.9"/>`;
          if (t > 0.55 && r2 < 0.5) s += `<path d="${lock(px - w * 0.22, py + 6, w * 0.18, l * 0.5, ang + 6, 0.2)}" fill="${ramp(capeR, t + 0.24)}" fill-opacity="0.85"/>`;
        }
        // cool sky light on the shaded top of the hump; warm glow on the sun side
        s += `<path d="M390 -700C460 -690 520 -640 560 -560" fill="none" stroke="#A796D6" stroke-width="46" stroke-opacity="0.32" filter="url(#${blur})"/>`;
        s += `<path d="M196 -470C224 -560 284 -650 372 -700" fill="none" stroke="#FFD49A" stroke-width="26" stroke-opacity="0.45" filter="url(#${blur})"/>`;
        s += `<path d="${smooth(capeTop, false)}" fill="none" stroke="#FFE2B0" stroke-width="7" stroke-opacity="0.55" filter="url(#${blur2})"/>`;
        const occ = gid('occc');
        defs += lgU(occ, 0, -380, 0, -150, [[0, '#120E24', 0], [1, '#120E24', 0.55]]);
        s += `<rect x="150" y="-400" width="480" height="260" fill="url(#${occ})"/>`;
        b += `<g clip-path="url(#${cCape})">${s}</g>`;
      }

      // ---- the head (turned toward us), in head space scaled into bison space
      const HX = 150, HY = -426, HS = 0.85;
      const headDome = [-20, 70, 170, 200];
      const headT = (x, y) => clamp(0.12 + domeLight(x, y, headDome).lam * 0.86, 0, 1);
      const beardP = [[-84, 230], [-100, 282]].concat(fringe([-98, 320], [74, 330], 7, 56, [0.04, 1], 46, 1)).concat([[80, 282], [82, 236], [40, 226]]);
      const faceP = [[-104, 4]].concat(fringe([-112, 40], [-106, 186], 5, 15, [-0.85, 0.5], 47, 1))
        .concat([[-104, 200], [-106, 222], [-94, 244], [-64, 258], [-26, 262], [10, 258], [40, 246], [58, 222], [64, 200]])
        .concat(fringe([72, 176], [124, 44], 5, 16, [0.85, 0.5], 48, 1))
        .concat([[124, 30], [118, -12], [0, -24]]);
      const bonP = (() => {
        const r = rng(1777);
        const pts = [];
        const M = 34;
        for (let i = 0; i < M; i++) {
          const a = (i / M) * Math.PI * 2;
          const down = Math.sin(a) > 0;
          const rx = 128;
          const ry = down ? 74 + 52 * Math.exp(-(((a - Math.PI / 2 - 0.3) / 0.42) ** 2)) : 100;
          const bump = i % 2 ? 1 + 0.06 + r() * 0.06 : 0.98;
          pts.push([6 + Math.cos(a) * rx * bump, -14 + Math.sin(a) * ry * bump, i % 2 ? 0.7 : 1]);
        }
        return pts;
      })();
      {
        let h = '';
        // beard: long dark locks hanging from the chin and throat
        defs += `<clipPath id="${cBeard}"><path d="${smooth(beardP)}"/></clipPath>`;
        h += `<path d="${smooth(beardP)}" fill="${ramp(darkR, 0.14)}"/>`;
        {
          let s = '';
          const r = rng(1301);
          const ls = [];
          for (let y = 400; y > 210; y -= 22) for (let x = -104; x < 90; x += 20) {
            const px = x + (r() - 0.5) * 12, py = y + (r() - 0.5) * 10;
            if (inside(beardP, px, py + 16)) ls.push([px, py, r(), r()]);
          }
          ls.sort((a, c) => c[1] - a[1]);
          for (const [px, py, r1, r2] of ls) {
            const t = clamp(headT(px, py) * 0.9 + (px < -60 ? 0.12 : 0) - (py - 240) * 0.0009, 0, 1);
            const w = 18 + r1 * 10, l = 60 + r2 * 46;
            s += `<path d="${lock(px, py, w, l, (r1 - 0.5) * 14 + (px < -40 ? -4 : 4), 0.08)}" fill="${ramp(darkR, t)}"/>`;
            s += `<path d="${lock(px - w * 0.14, py + 4, w * 0.45, l * 0.7, (r1 - 0.5) * 14, 0.1)}" fill="${ramp(darkR, t + 0.12)}" fill-opacity="0.85"/>`;
          }
          h += `<g clip-path="url(#${cBeard})">${s}</g>`;
        }

        // horns: tapered crescents along a cubic, deep blue-violet with a gloss
        function horn(P, w0, far) {
          const bz = (t, i) => (1 - t) ** 3 * P[0][i] + 3 * (1 - t) ** 2 * t * P[1][i] + 3 * (1 - t) * t * t * P[2][i] + t ** 3 * P[3][i];
          const A = [], B = [], mid = [];
          const N = 24;
          for (let i = 0; i <= N; i++) {
            const t = i / N;
            const x = bz(t, 0), y = bz(t, 1);
            const x2 = bz(Math.min(1, t + 0.01), 0), y2 = bz(Math.min(1, t + 0.01), 1);
            const x1 = bz(Math.max(0, t - 0.01), 0), y1 = bz(Math.max(0, t - 0.01), 1);
            let tx = x2 - x1, ty = y2 - y1; const m = Math.hypot(tx, ty); tx /= m; ty /= m;
            const w = (w0 / 2) * Math.pow(1 - t, 0.7) + 0.6;
            A.push([x - ty * w, y + tx * w]); B.push([x + ty * w, y - tx * w]); mid.push([x, y]);
          }
          const d = 'M' + A.concat(B.reverse()).map((p) => `${n(p[0])} ${n(p[1])}`).join('L') + 'Z';
          const g = k.id('horn');
          defs += lgU(g, P[0][0], P[0][1], P[3][0], P[3][1], far
            ? [[0, '#2A3088'], [0.5, '#1E2468'], [1, '#141840']]
            : [[0, '#3B48BE'], [0.45, '#27308A'], [1, '#141842']]);
          let s = `<path d="${d}" fill="url(#${g})"/>`;
          s += `<path d="${smooth(mid.slice(3, 21).map((p) => [p[0] - 4, p[1] - 4]), false)}" fill="none" stroke="#9AA6FF" stroke-width="${far ? 3 : 4.5}" stroke-opacity="0.7" stroke-linecap="round"/>`;
          s += `<path d="${smooth(mid.slice(6, 12).map((p) => [p[0] - 5, p[1] - 5]), false)}" fill="none" stroke="#F4F2FF" stroke-width="2.4" stroke-opacity="0.75" stroke-linecap="round"/>`;
          // a ridged base where the horn leaves the wool
          s += `<path d="${smooth(mid.slice(1, 5), false)}" fill="none" stroke="#141840" stroke-width="${n(w0 * 0.9)}" stroke-opacity="0.35"/>`;
          return s;
        }
        h += horn([[-96, -10], [-150, -8], [-188, -42], [-172, -116]], 40, true);
        h += horn([[100, -4], [158, 2], [202, -34], [190, -114]], 46, false);

        // face: short dark hair, lit on the far (sunward) side
        const faceG = gid('face');
        defs += `<clipPath id="${cFace}"><path d="${smooth(faceP)}"/></clipPath>`;
        defs += rgU(faceG, -90, 80, 240, [[0, ramp(darkR, 0.6)], [0.45, ramp(darkR, 0.36)], [1, ramp(darkR, 0.14)]], -110, 70);
        h += `<path d="${smooth(faceP)}" fill="url(#${faceG})"/>`;
        // muzzle: a broad dark nose, its top catching the sky (face hair hangs over it)
        const muzG = gid('muz');
        defs += rgU(muzG, -50, 200, 120, [[0, '#453C66'], [0.55, '#2A2246'], [1, '#17122A']], -70, 196);
        const muzP = [[-104, 206], [-96, 186], [-62, 176], [-20, 174], [24, 178], [54, 192], [64, 216], [54, 240], [24, 254], [-20, 260], [-66, 256], [-96, 240]];
        h += `<path d="${smooth(muzP)}" fill="url(#${muzG})"/>`;
        h += `<path d="M-90 204C-70 194 -36 191 0 194" fill="none" stroke="#BDB6EE" stroke-width="5" stroke-opacity="0.32" stroke-linecap="round"/>`;
        {
          let s = '';
          const r = rng(1409);
          const ls = [];
          for (let y = 10; y < 210; y += 15) for (let x = -130; x < 140; x += 16) {
            const px = x + (r() - 0.5) * 10, py = y + (r() - 0.5) * 8;
            if (inside(faceP, px, py + 6) && py < 186) ls.push([px, py, r(), r()]);
          }
          ls.sort((a, c) => a[1] - c[1]);
          for (const [px, py, r1, r2] of ls) {
            const side = Math.abs(px + 20) / 110;     // 0 on the nose bridge, 1 at the cheeks
            const t = clamp(headT(px, py) - 0.04 + (r1 - 0.5) * 0.06, 0, 1);
            const w = 14 + r1 * 8 + side * 6, l = 16 + side * 26 + r2 * 10;
            const ang = clamp((px + 20) * 0.3, -40, 40);
            s += `<path d="${lock(px, py, w, l, ang, 0.1)}" fill="${ramp(darkR, t)}"/>`;
            s += `<path d="${lock(px - w * 0.15, py + 2, w * 0.45, l * 0.66, ang, 0.1)}" fill="${ramp(darkR, t + 0.1)}" fill-opacity="0.8"/>`;
          }
          // planes of the face: the sunward cheek, the shadowed near cheek
          s += `<path d="M-118 30C-122 100 -114 160 -102 200" fill="none" stroke="#F4BE84" stroke-width="14" stroke-opacity="0.5" filter="url(#${blur2})"/>`;
          s += `<path d="M118 40C104 110 84 170 62 220" fill="none" stroke="#120E24" stroke-width="44" stroke-opacity="0.45" filter="url(#${blur})"/>`;
          h += `<g clip-path="url(#${cFace})">${s}</g>`;
        }
        h += `<path d="M-62 206C-50 202 -36 202 -26 204" fill="none" stroke="#F2EEFF" stroke-width="3" stroke-opacity="0.4" stroke-linecap="round"/>`;
        h += `<path d="${smooth([[-98, 214], [-84, 208], [-72, 214], [-74, 226], [-86, 240, 0.4], [-92, 228]])}" fill="#0B0820"/>`;
        h += `<path d="${smooth([[20, 212], [36, 208], [52, 216], [54, 228], [48, 242, 0.4], [34, 230]])}" fill="#0B0820"/>`;
        h += `<path d="M-24 230V248" stroke="#0B0820" stroke-width="3" stroke-opacity="0.5" stroke-linecap="round"/>`;
        h += `<path d="M-82 252Q-24 268 38 248" fill="none" stroke="#0B0820" stroke-width="5" stroke-opacity="0.6" stroke-linecap="round"/>`;
        // eyes, set at the sides under the forelock
        function eye(x, y, s, rot) {
          return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">` +
            `<path d="M-24 2C-14 -14 14 -15 24 -2C14 11 -12 12 -24 2Z" fill="#2A1E3A"/>` +
            `<path d="M-19 1C-11 -10 11 -11 19 -2C11 8 -10 9 -19 1Z" fill="#E9B27A"/>` +
            `<circle cx="1" cy="-1" r="8.5" fill="#1A1028"/>` +
            `<circle cx="-3" cy="-4" r="3.2" fill="#FFFFFF" fill-opacity="0.95"/>` +
            `<path d="M-24 -4C-12 -18 14 -18 26 -4" fill="none" stroke="#120D24" stroke-width="5" stroke-linecap="round"/></g>`;
        }
        h += eye(72, 100, 1, 16) + eye(-96, 92, 0.7, -12);

        // the bonnet: a big woolly crown over the forehead, horn bases buried in it
        const bonG = gid('bon');
        defs += `<clipPath id="${cBon}"><path d="${smooth(bonP)}"/></clipPath>`;
        defs += rgU(bonG, -60, -60, 240, [[0, ramp(capeR, 0.66)], [0.4, ramp(capeR, 0.44)], [1, ramp(capeR, 0.18)]], -80, -80);
        h += `<path d="${smooth(bonP)}" fill="url(#${bonG})"/>`;
        {
          let s = '';
          const r = rng(2203);
          const curls = [];
          for (let i = 0; i < 420; i++) {
            const px = -130 + r() * 270, py = -120 + r() * 250;
            if (inside(bonP, px, py)) curls.push([px, py, r(), r()]);
          }
          curls.sort((a, c) => a[1] - c[1]);
          for (const [px, py, r1, r2] of curls) {
            const L = domeLight(px, py, [-10, -14, 150, 125]);
            const t = clamp(0.16 + L.lam * 0.88 - clamp((py - 30) / 90, 0, 1) * 0.16 + (r2 - 0.5) * 0.08, 0, 1);
            const rad = 9 + r1 * 8;
            s += curl(px, py, rad, ramp(capeR, t - 0.12), ramp(capeR, t + 0.08), ramp(capeR, t - 0.04));
          }
          s += `<path d="M-124 -20C-112 -76 -60 -114 14 -112" fill="none" stroke="#FFE0AA" stroke-width="16" stroke-opacity="0.5" filter="url(#${blur2})"/>`;
          s += `<path d="M30 90C84 66 124 24 134 -30" fill="none" stroke="#120E24" stroke-width="40" stroke-opacity="0.35" filter="url(#${blur})"/>`;
          h += `<g clip-path="url(#${cBon})">${s}</g>`;
        }
        b += `<g transform="translate(${HX} ${HY}) scale(${HS})">${h}</g>`;
      }

      // ---- backlit fur: fine bright wisps along every edge that faces the sun
      {
        const r = rng(3301);
        let wisp = '', wisp2 = '';
        const edge = (pts, tf, strength, every) => {
          for (let i = 0; i < pts.length - 1; i++) {
            const a = tf(pts[i][0], pts[i][1]), c = tf(pts[i + 1][0], pts[i + 1][1]);
            const L = Math.hypot(c[0] - a[0], c[1] - a[1]);
            if (L < 0.5) continue;
            const nx = (c[1] - a[1]) / L, ny = -(c[0] - a[0]) / L;   // left of travel = outward
            const facing = -(nx * 0.9 + ny * 0.44);
            if (facing < 0.2 || ny > 0.5) continue;
            const m = Math.max(1, Math.round(L / every));
            for (let j = 0; j < m; j++) {
              if (r() < 0.2) continue;
              const u = (j + r()) / m;
              const X = a[0] + (c[0] - a[0]) * u, Y = a[1] + (c[1] - a[1]) * u;
              const len = (7 + r() * 12) * strength * (0.6 + facing * 0.6);
              const ang = Math.atan2(ny, nx) + (r() - 0.35) * 0.9;
              const ex = X + Math.cos(ang) * len, ey = Y + Math.sin(ang) * len + len * 0.25;
              const seg = `M${n(X - nx * 5)} ${n(Y - ny * 5)}Q${n(X + Math.cos(ang) * len * 0.55 + nx)} ${n(Y + Math.sin(ang) * len * 0.5)} ${n(ex)} ${n(ey)}`;
              if (r() < 0.6) wisp += seg; else wisp2 += seg;
            }
          }
        };
        const id = (x, y) => [x, y];
        const headTf = (x, y) => [HX + x * HS, HY + y * HS];
        edge(capeTop, id, 1, 6);
        // chaps front (travel upward along the chest front)
        edge([[240, -206], [228, -250], [212, -310]], id, 0.8, 7);
                edge(bonP.concat([bonP[0]]), headTf, 0.8, 6);
        edge([[-84, 230], [-100, 282], [-98, 320]].reverse(), headTf, 0.8, 7);
        b += `<path d="${wisp}" fill="none" stroke="#FFE6BC" stroke-width="2.2" stroke-opacity="0.9" stroke-linecap="round"/>`;
        b += `<path d="${wisp2}" fill="none" stroke="#F6BC82" stroke-width="2.2" stroke-opacity="0.85" stroke-linecap="round"/>`;
      }

      parts.push({ defs, svg: `<g transform="translate(${BX} ${BY}) scale(${BS})">${b}</g>` });
    }

    // ---- foreground grass: fountain clumps, violet at the root, gold at the tips ---------------
    function grassBand(o) {
      const rg = rng(o.seed);
      const gs = {};
      for (let i = 0; i < o.count; i++) {
        const x = o.x0 + rg() * (o.x1 - o.x0);
        const y = o.y + rg() * (o.dy || 0);
        const h = o.h(x) * (0.55 + rg() * 0.6);
        if (h < 6) continue;
        const blades = 4 + Math.floor(rg() * 5);
        const key = rg() < 0.22 ? 'v' : rg() < 0.5 ? 'g' : 'y';
        let d = '';
        for (let j = 0; j < blades; j++) {
          const a = ((j / (blades - 1)) - 0.5) * 1.1 + (rg() - 0.5) * 0.3;
          const L = h * (0.6 + rg() * 0.45);
          const w = 2.5 + rg() * 3;
          const tx = x + Math.sin(a) * L * 0.75, ty = y - Math.cos(a) * L;
          const bend = a * L * 0.35;
          d += `M${n(x - w)} ${n(y)}Q${n(x + (tx - x) * 0.3)} ${n(y - L * 0.55)} ${n(tx + bend)} ${n(ty)}Q${n(x + (tx - x) * 0.3 + w * 0.5)} ${n(y - L * 0.5)} ${n(x + w)} ${n(y)}Z`;
        }
        gs[key] = (gs[key] || '') + d;
      }
      return gs;
    }
    {
      const gv = k.id('gv'), gg = k.id('gg'), gy = k.id('gy');
      const defs = k.linear(gv, 90, [[0, '#C8B8EA'], [0.5, '#9C8CCB'], [1, '#6E62A4']]) +
        k.linear(gg, 90, [[0, '#E2DC92'], [0.45, '#AEB766'], [1, '#776FA6']]) +
        k.linear(gy, 90, [[0, '#F6E2A0'], [0.4, '#CBC273'], [1, '#867BAE']]);
      const fill = (gs) => (gs.v ? `<path d="${gs.v}" fill="url(#${gv})"/>` : '') + (gs.g ? `<path d="${gs.g}" fill="url(#${gg})"/>` : '') + (gs.y ? `<path d="${gs.y}" fill="url(#${gy})"/>` : '');
      // grass round the bison's hooves, then the full foreground band
      const hooves = grassBand({ seed: 92, count: 70, x0: 1300, x1: 2060, y: BY + 4, dy: 34, h: () => 46 });
      const front = grassBand({
        seed: 91, count: 260, x0: -20, x1: k.W + 20, y: k.H + 14, dy: 0,
        h: (x) => (x < 470 ? 250 : x < 900 ? 120 : x < 1140 ? 170 : x > 1700 ? 240 : 200),
      });
      let seeds = '';
      const rg = rng(93);
      for (let i = 0; i < 10; i++) {
        const x = rg() < 0.55 ? 40 + rg() * 420 : 1740 + rg() * 300;
        const y = k.H - 230 - rg() * 120;
        const lean = (rg() - 0.5) * 30;
        seeds += `M${n(x)} ${k.H + 10}Q${n(x + lean * 0.3)} ${n(y + 120)} ${n(x + lean)} ${n(y)}`;
        seeds += `M${n(x + lean)} ${n(y)}q-8 -12 -12 -30M${n(x + lean)} ${n(y)}q1 -16 -1 -34M${n(x + lean)} ${n(y)}q8 -12 13 -28`;
      }
      parts.push({
        defs,
        svg: fill(hooves) + fill(front) +
          `<path d="${seeds}" fill="none" stroke="#B9875A" stroke-width="2.6" stroke-linecap="round" stroke-opacity="0.7"/>`,
      });
    }

    // ---- foreground flowers: blazing star and prairie coneflower ----------------------------
    function blazingStar(x, y, h, seed, lean, sc) {
      const r = rng(seed);
      sc = sc || 1;
      const tx = x + h * lean, ty = y - h;
      const at = (u) => [x + (tx - x) * u, y - h * u];
      let s = `<path d="M${n(x)} ${n(y)}L${n(tx)} ${n(ty)}" fill="none" stroke="#4E7A5A" stroke-width="${n(5 * sc)}" stroke-linecap="round"/>`;
      let lv = '', lv2 = '';
      for (let i = 0; i < 10; i++) {
        const u = 0.03 + i * 0.05;
        const [lx, ly] = at(u);
        const side = i % 2 ? 1 : -1;
        const L = (140 - i * 10) * sc;
        const d = `M${n(lx)} ${n(ly)}Q${n(lx + side * L * 0.22)} ${n(ly - L * 0.6)} ${n(lx + side * L * 0.5)} ${n(ly - L)}Q${n(lx + side * L * 0.16)} ${n(ly - L * 0.5)} ${n(lx + side * 4)} ${n(ly + 2)}Z`;
        if (i % 2) lv += d; else lv2 += d;
      }
      s += `<path d="${lv}" fill="#709D6C"/><path d="${lv2}" fill="#4C7658"/>`;
      const u0 = 0.56;
      const wAt = (u) => (u > 0.92 ? 9 + ((1 - u) / 0.08) * 6 : 15) * sc;
      const coreL = [], coreR = [];
      for (let i = 0; i <= 10; i++) {
        const u = u0 + (1 - u0) * (i / 10);
        const [px, py] = at(u);
        coreL.push([px - wAt(u) * 0.6, py]); coreR.push([px + wAt(u) * 0.6, py]);
      }
      s += `<path d="${smooth(coreL.concat(coreR.reverse()))}" fill="#4A2280"/>`;
      const fl = [];
      for (let i = 0; i < 80; i++) fl.push([u0 - 0.02 + (1.02 - u0) * Math.pow(r(), 0.85), r(), r(), r()]);
      fl.sort((a, c) => a[0] - c[0]);
      const pal = ['#56288F', '#6E35B0', '#8746C6', '#9E5CD8', '#B77DE8', '#D2ABF4'];
      for (const [u, r1, r2, r3] of fl) {
        const [px0, py] = at(Math.min(1, u));
        const side = r1 - 0.5;
        const px = px0 + side * wAt(u) * 1.3;
        const lit = clamp(0.45 - side * 1.0 + (u - u0) * 0.9 + (r2 - 0.5) * 0.35, 0, 0.999);
        const col = pal[Math.floor(lit * pal.length)];
        let d = '';
        const fan = 6;
        for (let j = 0; j < fan; j++) {
          const a = (-90 + side * 80 + (j - (fan - 1) / 2) * 24 + (r3 - 0.5) * 20) * Math.PI / 180;
          const L = (11 + r2 * 8) * sc;
          d += `M${n(px)} ${n(py)}q${n(Math.cos(a) * L * 0.4)} ${n(Math.sin(a) * L * 0.7)} ${n(Math.cos(a) * L)} ${n(Math.sin(a) * L)}`;
        }
        s += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(3 * sc)}" stroke-linecap="round"/>`;
      }
      return s;
    }
    // Prairie coneflower (Mexican hat): a tall column cone over a skirt of
    // drooping petals, red-brown edged with yellow (or all yellow).
    function coneflower(x, y, h, seed, lean, sc, yellow) {
      const r = rng(seed);
      const tx = x + h * lean, ty = y - h;
      sc = sc || 1;
      const cone = k.id('cone'), pet = k.id('pet'), petB = k.id('petb');
      let s = `<path d="M${n(x)} ${n(y)}Q${n(x + h * lean * 0.2)} ${n(y - h * 0.5)} ${n(tx)} ${n(ty)}" fill="none" stroke="#557E5C" stroke-width="${n(4.5 * sc)}" stroke-linecap="round"/>`;
      for (let i = 0; i < 3; i++) {
        const t = 0.12 + i * 0.13, lx = x + (tx - x) * t, ly = y - h * t, side = i % 2 ? 1 : -1;
        s += `<path d="M${n(lx)} ${n(ly)}q${n(side * 26 * sc)} ${n(-20 * sc)} ${n(side * 50 * sc)} ${n(-12 * sc)}M${n(lx + side * 18 * sc)} ${n(ly - 12 * sc)}l${n(side * 6 * sc)} ${n(-18 * sc)}M${n(lx + side * 32 * sc)} ${n(ly - 15 * sc)}l${n(side * 9 * sc)} ${n(-14 * sc)}M${n(lx + side * 24 * sc)} ${n(ly - 10 * sc)}l${n(side * 4 * sc)} ${n(12 * sc)}` +
          `" fill="none" stroke="#6E9A6A" stroke-width="${n(4 * sc)}" stroke-linecap="round"/>`;
      }
      function petal(theta, back) {
        const sx = Math.sin(theta), front = Math.cos(theta);
        const L = (50 + front * 4) * sc, w = 13 * sc;
        const bx = tx + sx * 9 * sc, by = ty + 2 * sc;
        const dx = sx * L * 0.62, dy = L * (0.78 + 0.1 * front);
        const m = Math.hypot(dx, dy), ux = dx / m, uy = dy / m, px = -uy, py = ux;
        const P = (along, across) => `${n(bx + ux * along * m + px * across * w)} ${n(by + uy * along * m + py * across * w)}`;
        return `<path d="M${P(0, -0.25)}C${P(0.3, -0.75)} ${P(0.85, -0.62)} ${P(1, -0.45)}L${P(0.94, -0.18)}L${P(1.02, 0)}L${P(0.94, 0.18)}L${P(1, 0.45)}C${P(0.85, 0.62)} ${P(0.3, 0.75)} ${P(0, 0.25)}Z" fill="url(#${back ? petB : pet})"/>`;
      }
      const np = 5 + Math.floor(r() * 2), th0 = r() * 1;
      const thetas = [];
      for (let i = 0; i < np; i++) thetas.push(th0 + (i / np) * Math.PI * 2 + (r() - 0.5) * 0.3);
      const back = thetas.filter((t) => Math.cos(t) < 0), frontP = thetas.filter((t) => Math.cos(t) >= 0);
      for (const t of back) s += petal(t, true);
      s += `<path d="M${n(tx - 11 * sc)} ${n(ty + 6 * sc)}C${n(tx - 13 * sc)} ${n(ty - 26 * sc)} ${n(tx - 9 * sc)} ${n(ty - 46 * sc)} ${n(tx)} ${n(ty - 48 * sc)}C${n(tx + 9 * sc)} ${n(ty - 46 * sc)} ${n(tx + 13 * sc)} ${n(ty - 26 * sc)} ${n(tx + 11 * sc)} ${n(ty + 6 * sc)}Z" fill="url(#${cone})"/>`;
      let dots = '';
      for (let i = 0; i < 14; i++) dots += `M${n(tx - 10 * sc + r() * 20 * sc)} ${n(ty - 4 * sc - r() * 12 * sc)}h0.1`;
      s += `<path d="${dots}" stroke="#F6D06A" stroke-width="${n(3.2 * sc)}" stroke-linecap="round" stroke-opacity="0.9"/>`;
      s += `<path d="M${n(tx - 5 * sc)} ${n(ty - 40 * sc)}Q${n(tx - 8 * sc)} ${n(ty - 26 * sc)} ${n(tx - 7 * sc)} ${n(ty - 16 * sc)}" stroke="#C49478" stroke-width="${n(2.6 * sc)}" stroke-opacity="0.75" fill="none" stroke-linecap="round"/>`;
      for (const t of frontP) s += petal(t, false);
      return {
        defs: k.linear(cone, 0, [[0, '#7A5048'], [0.45, '#4A2E3C'], [1, '#2C1C30']]) +
          k.linear(pet, 90, yellow ? [[0, '#E9A23B'], [0.45, '#F4C54E'], [1, '#FBE28A']] : [[0, '#8E2238'], [0.45, '#D2423E'], [0.78, '#EC7D48'], [1, '#F7D063']]) +
          k.linear(petB, 90, yellow ? [[0, '#C98A3A'], [1, '#E7C26A']] : [[0, '#6E1E36'], [0.6, '#A8343C'], [1, '#D6A04E']]),
        svg: s,
      };
    }
    function corner(left, seed) {
      const r = rng(seed);
      const X = (x) => (left ? x : k.W - x);
      let svg = '', defs = '';
      const spikes = left
        ? [[24, 560, 1.05], [100, 470, 1], [182, 610, 1.1], [266, 420, 0.95], [346, 330, 0.85], [430, 250, 0.75]]
        : [[22, 600, 1.1], [80, 470, 1], [150, 300, 0.9], [230, 220, 0.8]];
      const cones = left
        ? [[58, 300, 1.5, 0], [222, 250, 1.4, 1], [140, 180, 1.3, 0], [388, 170, 1.15, 0], [300, 130, 1.05, 1]]
        : [[60, 300, 1.45, 0], [140, 200, 1.3, 1], [250, 150, 1.15, 0], [340, 120, 1, 0]];
      spikes.forEach((p, i) => { svg += blazingStar(X(p[0]), k.H + 20, p[1], seed + i * 7, (left ? 1 : -1) * (0.01 + r() * 0.05), p[2]); });
      cones.forEach((p, i) => {
        const c = coneflower(X(p[0]), k.H + 20, p[1], seed + 40 + i, (left ? 1 : -1) * (0.02 + r() * 0.06), p[2], p[3]);
        defs += c.defs; svg += c.svg;
      });
      return { defs, svg };
    }
    parts.push(corner(true, 101));
    parts.push(corner(false, 203));

    return k.spread(parts, { grain: 0.6 });
  },
};
