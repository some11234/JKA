/* Visa pages 15–16 — The transcontinental railroad, 1869.
   Right: a wood-burning 4-4-0 "American" charging toward us across a timber
   trestle — balloon stack trailing sunlit smoke, box headlamp, brass bell and
   domes, red drivers with their side rods, slatted cowcatcher, crimson cab.
   Left: its tender and passenger cars curving away over the trestle, whose
   bents plunge into a misty gorge, under snow-capped Rocky Mountain peaks
   in hazy layers and pine forest. Colorado blue columbines frame the bottom
   corners. The train is modelled in 3-D (a small perspective camera below)
   and shaded facet by facet, so the trestle, wheels and boiler foreshorten
   correctly. Light from the upper left. Quote (live text, see
   js/passport-data.js): Abraham Lincoln, Gettysburg. */

'use strict';

module.exports = {
  pages: [15, 16],
  svg(k) {
    const { C, n, rng } = k;
    const parts = [];
    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;

    // ---- 2-D helpers ----------------------------------------------------------------
    function stopsOf(stops) {
      return stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('');
    }
    function lgU(gid, x1, y1, x2, y2, stops) {
      return `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">${stopsOf(stops)}</linearGradient>`;
    }
    function rgU(gid, cx, cy, r, stops) {
      return `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}">${stopsOf(stops)}</radialGradient>`;
    }
    const pathOf = (pts) => 'M' + pts.map((p) => n(p[0]) + ' ' + n(p[1])).join('L') + 'Z';
    const lineOf = (pts) => 'M' + pts.map((p) => n(p[0]) + ' ' + n(p[1])).join('L');
    // Closed smooth curve through points (Catmull-Rom → cubic Bézier).
    function smooth(pts, closed = true, tension = 1) {
      const m = pts.length;
      const get = (i) => (closed ? pts[(i + m) % m] : pts[Math.max(0, Math.min(m - 1, i))]);
      let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
      const last = closed ? m : m - 1;
      for (let i = 0; i < last; i++) {
        const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
        const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
        const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
        d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
      }
      return d + (closed ? 'Z' : '');
    }
    function ramp(stops, t) {
      t = clamp(t);
      for (let i = 0; i < stops.length - 1; i++) {
        const [t0, c0] = stops[i], [t1, c1] = stops[i + 1];
        if (t <= t1) return k.mix(c0, c1, (t - t0) / Math.max(1e-6, t1 - t0));
      }
      return stops[stops.length - 1][1];
    }

    // ---- 3-D camera ------------------------------------------------------------------------
    // Camera at the origin looking down −Z, Y up; perspective with lens shift.
    // World units are metres. The eye is EYE m above the railhead.
    const F3 = 1500, CX = 1040, CY = 900, EYE = 1.9;
    const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const len = (a) => Math.hypot(a[0], a[1], a[2]);
    const norm = (a) => mul(a, 1 / (len(a) || 1));
    const P = (w) => [CX + (F3 * w[0]) / -w[2], CY - (F3 * w[1]) / -w[2]];
    const cen = (pts) => mul(pts.reduce((s, p) => add(s, p), [0, 0, 0]), 1 / pts.length);
    const LIGHT = norm([-0.62, 0.6, 0.5]);
    const RIM = '#FFD8B4';
    const HAZE = '#D9D2EC';
    const MIST = '#E6E0F2';

    // Track centre line: straight under the engine, then curving away to the
    // left (heading turns toward broadside) so the cars spread over the left page.
    const TR = { phi0: (72 * Math.PI) / 180, Dp: 9.5, pilotX: 1790, s0: 14, R: 90, ds: 0.25, sMin: -8, sMax: 200 };
    const track = (() => {
      const arr = [];
      const Xp = ((TR.pilotX - CX) * TR.Dp) / F3;
      const h0 = [Math.cos(TR.phi0), Math.sin(TR.phi0)];
      for (let s = TR.sMin; s < 0; s += TR.ds) arr.push({ X: Xp - s * h0[0], Z: -TR.Dp - s * h0[1], phi: TR.phi0 });
      let X = Xp, Z = -TR.Dp, phi = TR.phi0;
      for (let s = 0; s <= TR.sMax; s += TR.ds) {
        arr.push({ X, Z, phi });
        if (s > TR.s0) phi -= TR.ds / TR.R;
        X -= Math.cos(phi) * TR.ds; Z -= Math.sin(phi) * TR.ds;
      }
      return arr;
    })();
    function trackAt(s) {
      const f = (s - TR.sMin) / TR.ds, i = Math.max(0, Math.min(track.length - 2, Math.floor(f))), t = f - i;
      const a = track[i], b = track[i + 1];
      return { X: lerp(a.X, b.X, t), Z: lerp(a.Z, b.Z, t), phi: lerp(a.phi, b.phi, t) };
    }
    // A rigid body whose front is at arc length sf and back at sb (sb > sf).
    // Local coords: a forward, b toward the visible (camera) side, c up from railhead.
    function frame(sf, sb) {
      const A = trackAt(sf), B = trackAt(sb);
      const hx = A.X - B.X, hz = A.Z - B.Z, L = Math.hypot(hx, hz);
      const h = [hx / L, 0, hz / L], s = [-hz / L, 0, hx / L];
      const o = [A.X, -EYE, A.Z];
      return {
        h, s,
        W: (a, b, c) => [o[0] + a * h[0] + b * s[0], o[1] + c, o[2] + a * h[2] + b * s[2]],
        dir: (a, b, c) => [a * h[0] + b * s[0], c, a * h[2] + b * s[2]],
      };
    }
    function frameAt(s) { const f = frame(s - 0.5, s + 0.5); const g = frame(s, s + 1); return { h: f.h, s: f.s, W: (a, b, c) => add(g.W(0, 0, 0), add(f.dir(a, b, 0), [0, c, 0])), dir: f.dir }; }

    // ---- shading -----------------------------------------------------------------------------
    // Materials: a colour ramp from deepest shadow to highlight, plus lighting weights.
    const M = {
      blue: { ramp: [[0, '#232C70'], [0.26, '#2F3FA0'], [0.48, '#4559C9'], [0.7, '#6F82DF'], [0.88, '#AFBBF3'], [1, '#EEF1FF']], amb: 0.12, kd: 0.66, sky: 0.14, ks: 0.45, shin: 22, rim: 0.7 },
      iron: { ramp: [[0, '#1E2259'], [0.3, '#2B3274'], [0.55, '#404A92'], [0.78, '#6E77BD'], [0.92, '#B5BAE8'], [1, '#EEF0FF']], amb: 0.1, kd: 0.6, sky: 0.16, ks: 0.5, shin: 20, rim: 0.65 },
      brass: { ramp: [[0, '#6F4321'], [0.25, '#A2652B'], [0.48, '#D49A3F'], [0.7, '#F0C566'], [0.86, '#FBE4A2'], [1, '#FFFAEA']], amb: 0.16, kd: 0.6, sky: 0.1, ks: 0.75, shin: 14, rim: 0.35 },
      red: { ramp: [[0, '#5A1A3E'], [0.28, '#94264B'], [0.52, '#CF3F4F'], [0.76, '#F07163'], [1, '#FFC6AC']], amb: 0.14, kd: 0.68, sky: 0.12, ks: 0.2, shin: 18, rim: 0.6 },
      cab: { ramp: [[0, '#4B1C44'], [0.3, '#792550'], [0.55, '#AE3450'], [0.8, '#DC5F5C'], [1, '#F8AA90']], amb: 0.14, kd: 0.66, sky: 0.12, ks: 0.12, shin: 16, rim: 0.6 },
      steel: { ramp: [[0, '#272B60'], [0.35, '#474E8E'], [0.62, '#8990C6'], [0.85, '#CDD2F0'], [1, '#FFFFFF']], amb: 0.14, kd: 0.6, sky: 0.16, ks: 0.6, shin: 16, rim: 0.5 },
      wood: { ramp: [[0, '#4C4178'], [0.3, '#776290'], [0.52, '#AB8588'], [0.74, '#D6A589'], [1, '#F6D2B0']], amb: 0.14, kd: 0.7, sky: 0.14, ks: 0, rim: 0.4 },
      log: { ramp: [[0, '#5A3F5E'], [0.35, '#8D5E5C'], [0.65, '#C98B68'], [1, '#F2C79E']], amb: 0.16, kd: 0.7, sky: 0.12, ks: 0, rim: 0.3 },
      car: { ramp: [[0, '#56294C'], [0.3, '#884254'], [0.55, '#BF6A5C'], [0.8, '#E69A74'], [1, '#FAD2AA']], amb: 0.14, kd: 0.68, sky: 0.12, ks: 0.05, rim: 0.4 },
      cream: { ramp: [[0, '#7A72A6'], [0.4, '#C6BAD3'], [0.75, '#F1E6DE'], [1, '#FFFBF5']], amb: 0.2, kd: 0.62, sky: 0.16, ks: 0.1, rim: 0.3 },
      dark: { ramp: [[0, '#1B1E50'], [0.5, '#2C3272'], [1, '#5A62A8']], amb: 0.1, kd: 0.5, sky: 0.2, ks: 0.1, rim: 0.2 },
      roof: { ramp: [[0, '#38336A'], [0.5, '#685E96'], [1, '#B7ACD0']], amb: 0.14, kd: 0.6, sky: 0.2, ks: 0.05, rim: 0.3 },
      glass: { ramp: [[0, '#2A2C6E'], [0.5, '#5A5FA8'], [1, '#C9CCF2']], amb: 0.18, kd: 0.3, sky: 0.5, ks: 0.6, shin: 30, rim: 0 },
    };
    // Shade value 0..1 for normal N at world point p; `hp` overrides the
    // specular half-vector (cylinders use the half-vector projected onto
    // their cross-section so every metal barrel gets its streak).
    function shadeV(N, p, m, hp) {
      const V = norm(mul(p, -1));
      const dif = Math.max(0, dot(N, LIGHT));
      const Hh = hp || norm(add(LIGHT, V));
      const spec = Math.pow(Math.max(0, dot(N, Hh)), m.shin || 20);
      const sky = 0.5 + 0.5 * N[1];
      return clamp((m.amb ?? 0.15) + (m.kd ?? 0.65) * dif + (m.sky ?? 0.14) * sky + (m.ks ?? 0) * spec);
    }
    function shadeC(N, p, m, hp, extra) {
      let col = ramp(m.ramp, shadeV(N, p, m, hp) + (extra || 0));
      const V = norm(mul(p, -1));
      const rim = Math.pow(1 - Math.max(0, dot(N, V)), 3) * clamp(dot(N, LIGHT) + 0.3);
      if (m.rim) col = k.mix(col, RIM, clamp(rim * m.rim));
      return col;
    }
    // Atmospheric perspective by distance, and gorge mist by depth below the rail.
    function atmos(col, p) {
      const d = len(p);
      let c = k.mix(col, HAZE, clamp((d - 22) / 160) * 0.62);
      const below = -p[1] - EYE;
      if (below > 2) c = k.mix(c, MIST, clamp((below - 2) / 34) * 0.78);
      return c;
    }
    function face(ptsW, col, sw) {
      const d = pathOf(ptsW.map(P));
      return `<path d="${d}" fill="${col}" stroke="${col}" stroke-width="${sw == null ? 0.7 : sw}" stroke-linejoin="round"/>`;
    }
    const visible = (N, pts) => dot(N, mul(cen(pts), -1)) > 0;

    // Surface of revolution about a local axis. profile: [[t, r], ...] with t
    // increasing; the solid's inside is toward smaller r. Returns facets {z, svg}.
    function revolve(fr, base, ax, e1, e2, profile, seg, m, o) {
      o = o || {};
      const axW = norm(fr.dir(...ax)), e1W = fr.dir(...e1), e2W = fr.dir(...e2);
      const bW = fr.W(...base);
      const th0 = o.th0 || 0, span = o.span || Math.PI * 2;
      const ring = (t, r, th) => add(bW, add(mul(axW, t), add(mul(e1W, r * Math.cos(th)), mul(e2W, r * Math.sin(th)))));
      // half-vector projected onto the cross-section plane
      const Vc = norm(mul(bW, -1));
      const Hh = norm(add(LIGHT, Vc));
      const hp = norm(sub(Hh, mul(axW, dot(Hh, axW))));
      const out = [];
      for (let i = 0; i < profile.length - 1; i++) {
        const [t0, r0] = profile[i], [t1, r1] = profile[i + 1];
        const dt = t1 - t0, dr = r1 - r0, L = Math.hypot(dt, dr) || 1;
        const nt = -dr / L, nr = dt / L;
        for (let j = 0; j < seg; j++) {
          const a0 = th0 + (j / seg) * span, a1 = th0 + ((j + 1) / seg) * span, am = (a0 + a1) / 2;
          const radial = add(mul(e1W, Math.cos(am)), mul(e2W, Math.sin(am)));
          const N = norm(add(mul(axW, nt), mul(radial, nr)));
          const q = [ring(t0, r0, a0), ring(t1, r1, a0), ring(t1, r1, a1), ring(t0, r0, a1)];
          const c = cen(q);
          if (dot(N, mul(c, -1)) <= 0) continue;
          let col = shadeC(N, c, m, Math.abs(nt) < 0.6 ? hp : null, o.lift);
          if (o.atmos) col = atmos(col, c);
          out.push({ z: len(c), svg: face(q, col, o.sw) });
        }
      }
      return out;
    }
    const joinZ = (arr) => arr.sort((a, b) => b.z - a.z).map((e) => e.svg).join('');

    // Box with flat-shaded visible faces.
    function box(fr, a0, a1, b0, b1, c0, c1, m, o) {
      o = o || {};
      const v = fr.W;
      const faces = [
        [fr.dir(1, 0, 0), [v(a1, b0, c0), v(a1, b1, c0), v(a1, b1, c1), v(a1, b0, c1)]],
        [fr.dir(-1, 0, 0), [v(a0, b0, c0), v(a0, b0, c1), v(a0, b1, c1), v(a0, b1, c0)]],
        [fr.dir(0, 1, 0), [v(a0, b1, c0), v(a0, b1, c1), v(a1, b1, c1), v(a1, b1, c0)]],
        [fr.dir(0, -1, 0), [v(a0, b0, c0), v(a1, b0, c0), v(a1, b0, c1), v(a0, b0, c1)]],
        [[0, 1, 0], [v(a0, b0, c1), v(a1, b0, c1), v(a1, b1, c1), v(a0, b1, c1)]],
        [[0, -1, 0], [v(a0, b0, c0), v(a0, b1, c0), v(a1, b1, c0), v(a1, b0, c0)]],
      ];
      let s = '';
      for (const [N, pts] of faces) {
        if (!visible(N, pts)) continue;
        let col = shadeC(N, cen(pts), m, null, o.lift);
        if (o.atmos) col = atmos(col, cen(pts));
        s += face(pts, col, o.sw);
      }
      return s;
    }
    // A timber from world p0 to p1 with a square-ish section; `e1` is one
    // section axis (world). Returns {z, svg}.
    function beam(p0, p1, w1, w2, e1, m, o) {
      o = o || {};
      const ax = norm(sub(p1, p0));
      const u1 = norm(sub(e1, mul(ax, dot(e1, ax))));
      const u2 = norm(cross(ax, u1));
      const c = (p, i, j) => add(p, add(mul(u1, (i * w1) / 2), mul(u2, (j * w2) / 2)));
      const sides = [[1, 0], [0, 1], [-1, 0], [0, -1]];
      let s = '';
      for (const [i, j] of sides) {
        const N = add(mul(u1, i), mul(u2, j));
        const q = i ? [c(p0, i, -1), c(p1, i, -1), c(p1, i, 1), c(p0, i, 1)] : [c(p0, -1, j), c(p1, -1, j), c(p1, 1, j), c(p0, 1, j)];
        if (!visible(N, q)) continue;
        s += face(q, atmos(shadeC(N, cen(q), m), cen(q)), o.sw == null ? 0.5 : o.sw);
      }
      return { z: len(mul(add(p0, p1), 0.5)), svg: s };
    }
    // Flat polygon in a body's local coordinates.
    const polyL = (fr, pts) => pathOf(pts.map((p) => P(fr.W(...p))));
    // A circle lying in the local a–c plane at lateral offset b.
    function discPts(fr, a, b, c, r, N, th0) {
      const pts = [];
      for (let i = 0; i < N; i++) {
        const t = (th0 || 0) + (i / N) * Math.PI * 2;
        pts.push(P(fr.W(a + r * Math.cos(t), b, c + r * Math.sin(t))));
      }
      return pts;
    }

    // ==========================================================================================
    // SKY
    // ==========================================================================================
    parts.push(k.sky([[0, '#CBCBEE'], [0.16, '#D3D1F0'], [0.34, '#E1DAF1'], [0.48, '#EEDDEA'], [0.58, '#F7E1DC'], [0.7, '#F9E7DE'], [1, '#F3E3E6']]));
    {
      // warm light pouring in from the upper left; cooler powder blue on the right
      const g1 = k.id('warm'), g2 = k.id('cool');
      parts.push({
        defs: rgU(g1, 120, 360, 980, [[0, '#FFF3E6', 0.85], [0.45, '#FCE6D8', 0.45], [1, '#F6DCD6', 0]]) +
          lgU(g2, 1040, 0, 2080, 0, [[0, '#BFD0F2', 0], [1, '#BFD0F2', 0.42]]),
        svg: `<rect width="${k.W}" height="980" fill="url(#${g2})"/><circle cx="120" cy="360" r="980" fill="url(#${g1})"/>`,
      });
    }
    parts.push(k.microtext('Westward the Course of Empire Takes Its Way', { y0: 30, y1: 900, opacity: 0.05 }));
    parts.push(k.guilloche({ y0: 110, y1: 820, lines: 22, opacity: 0.06, amp: 16, period: 700, phase: 0.6 }));
    {
      const gl = k.id('glory');
      const GX = 1560, GY = 720;
      parts.push({
        defs: rgU(gl, GX, GY, 620, [[0, '#FFF6EA', 0.95], [0.4, '#FBE8DE', 0.55], [1, '#F2DDE4', 0]]),
        svg: `<circle cx="${GX}" cy="${GY}" r="620" fill="url(#${gl})"/>` +
          k.sunburst(GX, GY, 150, 900, 52, '#FFFFFF', 0.13) +
          k.rosette(GX, GY, 430, { opacity: 0.075, rings: 9, lobes: 34 }),
      });
    }
    // high wisps
    {
      const rc = rng(88);
      let st = '';
      const bands = [[60, 520, 380, 16], [300, 470, 260, 12], [1180, 600, 240, 12], [1820, 470, 300, 15], [1700, 640, 220, 10], [640, 640, 200, 10]];
      for (const [x, y, w, h] of bands) {
        st += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#FFFFFF" fill-opacity="${n(0.4 + rc() * 0.2)}"/>`;
        st += `<rect x="${n(x + w * 0.2)}" y="${n(y + h * 0.6)}" width="${n(w * 0.6)}" height="${n(h * 0.4)}" rx="${n(h * 0.2)}" fill="#C9BFE2" fill-opacity="0.35"/>`;
      }
      parts.push({ svg: st });
    }

    // ==========================================================================================
    // MOUNTAINS — snow-capped peaks, lit faces warm, shadow faces violet
    // ==========================================================================================
    function mountain(o) {
      const r = rng(o.seed);
      const sx = o.x, sy = o.y;
      const ridge = (dir, w, nPts, sub) => {
        const pts = [[sx, sy]];
        for (let i = 1; i <= nPts; i++) {
          const t = i / nPts;
          const yy = sy + (o.base - sy) * (1 - Math.pow(1 - t, o.curve || 1.7));
          const jag = (r() - 0.5) * (o.jag || 26) * Math.sin(Math.PI * t) + (i % 3 === 1 ? -(sub || 14) * Math.sin(Math.PI * t) : 0);
          pts.push([sx + dir * w * t + (r() - 0.5) * 10, yy + jag]);
        }
        return pts;
      };
      const L = ridge(-1, o.wl, o.nl || 9, o.subL), R = ridge(1, o.wr, o.nr || 9, o.subR);
      // spine: from the summit down toward the base, wandering
      const sp = [[sx, sy]];
      const sb = o.spine == null ? 0.25 : o.spine;
      for (let i = 1; i <= 8; i++) {
        const t = i / 8;
        sp.push([sx + sb * o.wr * t + (r() - 0.5) * 22 * t + Math.sin(t * 7 + o.seed) * 14 * t, sy + (o.base - sy) * t]);
      }
      const lit = [...L, ...sp.slice().reverse()];
      const shade = [...sp, ...R.slice().reverse()];
      const gL = k.id('mL'), gS = k.id('mS'), cL = k.id('cL'), cS = k.id('cS');
      let defs = lgU(gL, 0, sy, 0, o.base, [[0, o.lit[0]], [0.55, o.lit[1]], [1, o.lit[2]]]) +
        lgU(gS, 0, sy, 0, o.base, [[0, o.shade[0]], [0.55, o.shade[1]], [1, o.shade[2]]]) +
        `<clipPath id="${cL}"><path d="${pathOf(lit)}"/></clipPath><clipPath id="${cS}"><path d="${pathOf(shade)}"/></clipPath>`;
      let s = `<path d="${pathOf(lit)}" fill="url(#${gL})"/><path d="${pathOf(shade)}" fill="url(#${gS})"/>`;
      // snow cap with a jagged lower edge and long couloir fingers
      if (o.snow) {
        const at = (pts, t) => { const f = t * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)); const u = f - i; return [lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)]; };
        const pl = at(L, o.snow[0]), pr = at(R, o.snow[1]), ps = at(sp, o.snow[2]);
        const capPts = [];
        const nl = Math.max(1, Math.round(o.snow[0] * (L.length - 1)));
        for (let i = 0; i <= nl; i++) capPts.push(at(L, (i / nl) * o.snow[0]));
        const across = (p, q, cnt, deep) => {
          for (let i = 1; i < cnt; i++) {
            const t = i / cnt;
            const x = lerp(p[0], q[0], t), y = lerp(p[1], q[1], t);
            if (i % 2) capPts.push([x + (r() - 0.5) * 8, y + deep * (0.4 + r() * 0.9)]);
            else capPts.push([x + (r() - 0.5) * 8, y - deep * (0.1 + r() * 0.4)]);
          }
        };
        across(pl, ps, o.fingers || 9, o.deep || 40);
        capPts.push(ps);
        across(ps, pr, o.fingers || 9, o.deep || 40);
        const nr = Math.max(1, Math.round(o.snow[1] * (R.length - 1)));
        for (let i = nr; i >= 1; i--) capPts.push(at(R, (i / nr) * o.snow[1]));
        const cap = pathOf(capPts);
        // couloirs: thin streaks of snow running down the faces below the cap
        let streaks = '';
        for (let i = 0; i < (o.streaks || 10); i++) {
          const onLeft = i % 2 === 0;
          const base = onLeft ? at(L, r() * o.snow[0] * 1.3) : at(R, r() * o.snow[1] * 1.3);
          const tx = lerp(base[0], sx + (onLeft ? -1 : 1) * 20, 0.3) + (r() - 0.5) * 40;
          const len2 = (o.base - sy) * (0.15 + r() * 0.25);
          const w = 4 + r() * 7;
          streaks += `M${n(base[0] - w)} ${n(base[1] + 6)}Q${n(tx - w * 0.3)} ${n(base[1] + len2 * 0.5)} ${n(tx + (onLeft ? 10 : -10))} ${n(base[1] + len2)}Q${n(tx + w * 0.5)} ${n(base[1] + len2 * 0.45)} ${n(base[0] + w)} ${n(base[1] + 4)}Z`;
        }
        s += `<g clip-path="url(#${cL})"><path d="${cap}" fill="${o.snowLit}"/><path d="${streaks}" fill="${o.snowLit}" fill-opacity="0.8"/></g>`;
        s += `<g clip-path="url(#${cS})"><path d="${cap}" fill="${o.snowShade}"/><path d="${streaks}" fill="${o.snowShade}" fill-opacity="0.8"/></g>`;
      }
      // rock striations down the faces
      let rs = '';
      for (let i = 0; i < (o.rocks || 14); i++) {
        const onLeft = r() < 0.55;
        const t = 0.15 + r() * 0.6;
        const p = onLeft ? L[Math.max(1, Math.floor(t * (L.length - 1)))] : R[Math.max(1, Math.floor(t * (R.length - 1)))];
        const ex = lerp(p[0], sp[Math.floor(t * 8)][0], 0.3 + r() * 0.4), ey = p[1] + (o.base - sy) * (0.12 + r() * 0.22);
        rs += `M${n(p[0])} ${n(p[1] + 8)}Q${n((p[0] + ex) / 2 + (r() - 0.5) * 20)} ${n((p[1] + ey) / 2)} ${n(ex)} ${n(ey)}`;
      }
      s += `<g clip-path="url(#${cS})"><path d="${rs}" stroke="${o.rockShade}" stroke-width="3" stroke-opacity="0.35" fill="none" stroke-linecap="round"/></g>`;
      s += `<g clip-path="url(#${cL})"><path d="${rs}" stroke="${o.rockLit}" stroke-width="2.6" stroke-opacity="0.35" fill="none" stroke-linecap="round"/></g>`;
      // a warm rim of light along the lit ridge
      s += `<path d="${lineOf(L.slice(0, Math.ceil(L.length * 0.6)))}" stroke="${o.edge || '#FFF4EA'}" stroke-width="3" stroke-opacity="0.7" fill="none" stroke-linejoin="round"/>`;
      return { defs, svg: s };
    }

    // far, palest range across the whole spread
    parts.push({ svg: `<path d="${k.ridge({ y: 800, amp: 16, seed: 31, step: 34, peaks: [[160, 120, 260], [1060, 90, 300], [1420, 150, 260], [1760, 110, 240], [2050, 140, 230]], bottom: 960 })}" fill="#D7CDE8"/>` });
    parts.push(mountain({ x: 1435, y: 590, base: 900, wl: 420, wr: 420, seed: 17, spine: 0.3, snow: [0.45, 0.4, 0.4], deep: 28, fingers: 9,
      lit: ['#F2DCE2', '#E2CCE0', '#D9CBE6'], shade: ['#C3B8E2', '#C2B6DE', '#D2C8E6'], snowLit: '#FFF8F2', snowShade: '#DCDCF6', rockLit: '#C7A8C6', rockShade: '#9C93CC', rocks: 10 }));
    parts.push(mountain({ x: 1910, y: 520, base: 920, wl: 380, wr: 420, seed: 23, spine: 0.22, snow: [0.42, 0.42, 0.42], deep: 34, fingers: 11,
      lit: ['#F4DBDC', '#E0C6DC', '#D6C8E6'], shade: ['#B7AEE0', '#BBB0DC', '#CEC4E4'], snowLit: '#FFF8F0', snowShade: '#D8D9F6', rockLit: '#C6A3BF', rockShade: '#9790CB' }));
    // the great peak of the left page
    parts.push(mountain({ x: 470, y: 392, base: 930, wl: 620, wr: 700, seed: 7, spine: 0.18, curve: 1.9, jag: 34, subL: 22, subR: 30, nl: 11, nr: 12,
      snow: [0.5, 0.42, 0.52], deep: 46, fingers: 13, streaks: 16, rocks: 22,
      lit: ['#F9DCD6', '#E8C3D2', '#D7C3E2'], shade: ['#9D97DC', '#A49CD6', '#C3B8E0'], snowLit: '#FFF9F3', snowShade: '#D2D4F6', rockLit: '#CC9FB8', rockShade: '#7F78C2' }));
    parts.push(mountain({ x: 905, y: 560, base: 930, wl: 300, wr: 330, seed: 41, spine: 0.2, snow: [0.4, 0.3, 0.42], deep: 26, fingers: 9,
      lit: ['#F3D6D8', '#E3C4D6', '#D6C6E4'], shade: ['#ABA3DC', '#B0A7D8', '#C9BFE2'], snowLit: '#FFF7F1', snowShade: '#D6D7F5', rockLit: '#C9A2BC', rockShade: '#8C85C8' }));
    parts.push(k.haze(700, 260, '#F3E3EA', 0.55));

    // ---- forested ridges (layered, hazy) ------------------------------------------------------
    function fir(x, y, h, dark, light, lean) {
      const w = h * 0.34, tiers = 6;
      const L = [], R = [];
      for (let i = 0; i <= tiers; i++) {
        const t = i / tiers;
        const yy = y - h + h * 0.92 * t;
        const hw = (w / 2) * (0.12 + 0.88 * t);
        L.push([x - hw, yy + h * 0.05], [x - hw * 0.42, yy + h * 0.02]);
        R.push([x + hw, yy + h * 0.05], [x + hw * 0.42, yy + h * 0.02]);
      }
      const top = [x + (lean || 0), y - h];
      const full = [top, ...R.slice(1), [x + w * 0.05, y - h * 0.06], [x - w * 0.05, y - h * 0.06], ...L.slice(1).reverse()];
      const litHalf = [top, [x + w * 0.04, y - h * 0.5], [x, y - h * 0.06], ...L.slice(1).reverse()];
      return `<path d="${pathOf(full)}" fill="${dark}"/><path d="${pathOf(litHalf)}" fill="${light}"/>`;
    }
    function forest(o) {
      const r = rng(o.seed);
      let s = '';
      const trees = [];
      for (let i = 0; i < o.count; i++) {
        const x = o.x0 + (o.x1 - o.x0) * r();
        const y = o.yAt(x) + r() * (o.depth || 0);
        trees.push([x, y, o.h * (0.7 + r() * 0.6)]);
      }
      trees.sort((a, b) => a[1] - b[1]);
      for (const [x, y, h] of trees) s += fir(x, y, h, o.dark, o.light);
      return s;
    }
    function ridgeFill(o) {
      const pts = [];
      for (let x = o.x0; x <= o.x1; x += 20) pts.push([x, o.yAt(x)]);
      pts.push([o.x1, o.bottom], [o.x0, o.bottom]);
      return pathOf(pts);
    }
    {
      // mid ridge, blue and hazy, with a fringe of firs
      const y1 = (x) => 846 + 30 * Math.sin(x / 210 + 1.2) + 18 * Math.sin(x / 77) - 50 * Math.exp(-(((x - 1250) / 260) ** 2));
      const g = k.id('rdg1');
      parts.push({
        defs: k.linear(g, 90, [[0, '#B5B4E0'], [1, '#C9C3E4']]),
        svg: `<path d="${ridgeFill({ x0: -20, x1: 2100, yAt: y1, bottom: 1000 })}" fill="url(#${g})"/>` +
          forest({ x0: -20, x1: 2100, yAt: y1, count: 190, h: 34, depth: 30, seed: 3, dark: '#9C9FD3', light: '#B9B7E1' }),
      });
      parts.push(k.haze(860, 120, '#EDE2EE', 0.5));
      const y2 = (x) => 916 + 26 * Math.sin(x / 170 + 0.3) + 14 * Math.sin(x / 61 + 2) + 40 * Math.exp(-(((x - 760) / 300) ** 2));
      const g2 = k.id('rdg2');
      parts.push({
        defs: k.linear(g2, 90, [[0, '#8E9BD0'], [1, '#A7AEDA']]),
        svg: `<path d="${ridgeFill({ x0: -20, x1: 2100, yAt: y2, bottom: 1100 })}" fill="url(#${g2})"/>` +
          forest({ x0: -20, x1: 2100, yAt: y2, count: 230, h: 52, depth: 40, seed: 5, dark: '#6F81BE', light: '#93A2D3' }),
      });
    }

    // ==========================================================================================
    // GORGE — far wall falling to a river in the mist
    // ==========================================================================================
    {
      const wall = (x) => 1000 + 120 * Math.sin(x / 330 + 0.5) + 0.12 * x;
      const g = k.id('gw');
      let s = `<path d="${ridgeFill({ x0: -20, x1: 2100, yAt: wall, bottom: 1580 })}" fill="url(#${g})"/>`;
      s += forest({ x0: -20, x1: 2100, yAt: wall, count: 260, h: 70, depth: 260, seed: 9, dark: '#567FA8', light: '#7FA2C6' });
      // the river far below, winding toward us
      const river = [[200, 1290], [420, 1300], [640, 1318], [820, 1350], [1000, 1394], [1180, 1452], [1300, 1520], [1360, 1580], [1170, 1580], [1060, 1500], [900, 1430], [720, 1376], [520, 1340], [300, 1318], [160, 1302]];
      s += `<path d="${smooth(river)}" fill="#EEE9F7"/>`;
      s += `<path d="${smooth(river)}" fill="none" stroke="#B8B6E0" stroke-width="3" stroke-opacity="0.5"/>`;
      const rr = rng(404);
      let glints = '';
      for (let i = 0; i < 40; i++) {
        const t = rr();
        const x = 260 + t * 1000, y = 1300 + t * t * 220 + rr() * 16;
        glints += `M${n(x)} ${n(y)}h${n(10 + rr() * 30 * (0.5 + t))}`;
      }
      s += `<path d="${glints}" stroke="#FFFFFF" stroke-width="2.5" stroke-opacity="0.7" stroke-linecap="round"/>`;
      parts.push({ defs: k.linear(g, 90, [[0, '#7E97C8'], [0.5, '#9CB0D6'], [1, '#C8CBE6']]), svg: s });
      parts.push(k.haze(1120, 360, '#EFEAF6', 0.75));
    }

    // ==========================================================================================
    // THE TRESTLE
    // ==========================================================================================
    const groundBelow = (s) => 6 + 40 * Math.sin(Math.PI * clamp((s + 14) / 170));
    {
      const items = [];
      const bentS = [];
      for (let s = -6; s <= 148; s += 4.8) bentS.push(s);
      const postAt = (G) => [0.6, 1.95, 1.95 + 0.18 * G];
      for (let bi = 0; bi < bentS.length; bi++) {
        const s = bentS[bi];
        const fr = frameAt(s);
        const G = groundBelow(s);
        const cTop = -1.13, cBot = -G;
        const bOut = (c) => 1.95 + 0.18 * (cTop - c);
        const Wp = (b, c) => fr.W(0, b, c);
        const e = fr.h;
        // cap
        items.push(beam(Wp(-2.4, -0.98), Wp(2.4, -0.98), 0.32, 0.3, e, M.wood));
        // posts: plumb and battered
        for (const sg of [-1, 1]) {
          items.push(beam(Wp(sg * 0.6, cTop), Wp(sg * 0.6, cBot), 0.3, 0.3, e, M.wood));
          items.push(beam(Wp(sg * 1.95, cTop), Wp(sg * bOut(cBot), cBot), 0.3, 0.3, e, M.wood));
        }
        // stories: girts and X braces
        const story = 5.6;
        let c0 = cTop;
        while (c0 - story > cBot - 0.5) {
          const c1 = c0 - story;
          const off = 0.24;
          items.push(beam(Wp(-bOut(c1) - 0.2, c1), Wp(bOut(c1) + 0.2, c1), 0.22, 0.26, e, M.wood));
          items.push(beam(add(Wp(-bOut(c0), c0), mul(e, off)), add(Wp(bOut(c1), c1), mul(e, off)), 0.18, 0.2, e, M.wood));
          items.push(beam(add(Wp(bOut(c0), c0), mul(e, -off)), add(Wp(-bOut(c1), c1), mul(e, -off)), 0.18, 0.2, e, M.wood));
          c0 = c1;
        }
        // longitudinal girts on the near side to the next (farther) bent
        if (bi < bentS.length - 1) {
          const fr2 = frameAt(bentS[bi + 1]);
          const G2 = groundBelow(bentS[bi + 1]);
          for (let c = cTop - story; c > Math.max(cBot, -G2) + 1; c -= story) {
            const p0 = fr.W(0, bOut(c) + 0.25, c), p1 = fr2.W(0, bOut(c) + 0.25, c);
            items.push(beam(p0, p1, 0.2, 0.24, fr.s, M.wood));
          }
          // diagonal sway brace in alternate bays
          if (bi % 2 === 0) {
            const ca = cTop - 0.4, cb = Math.max(cTop - story, Math.max(cBot, -G2) + 0.5);
            items.push(beam(fr.W(0, bOut(ca) + 0.3, ca), fr2.W(0, bOut(cb) + 0.3, cb), 0.16, 0.2, fr.s, M.wood));
          }
        }
      }
      parts.push({ svg: joinZ(items) });
    }
    // mist rising out of the gorge over the trestle's legs
    {
      const g = k.id('mist');
      parts.push({
        defs: k.linear(g, 90, [[0, MIST, 0], [0.35, MIST, 0.45], [0.7, '#F1ECF8', 0.7], [1, '#F4F0FA', 0.55]]),
        svg: `<rect x="0" y="1060" width="${k.W}" height="520" fill="url(#${g})"/>`,
      });
    }
    // ---- the deck: stringers, ties, guard timbers, rails --------------------------------------
    {
      let s = '';
      const S0 = -6, S1 = 150;
      // near-side stringer face, in shaded segments
      for (let s0 = S1; s0 > S0; s0 -= 2) {
        const s1 = Math.max(S0, s0 - 2);
        const fa = frameAt(s0), fb = frameAt(s1);
        const q = [fa.W(0, 1.28, -0.33), fb.W(0, 1.28, -0.33), fb.W(0, 1.28, -0.88), fa.W(0, 1.28, -0.88)];
        s += face(q, atmos(shadeC(fa.s, cen(q), M.wood, null, -0.12), cen(q)), 0.8);
      }
      // ties
      for (let t = S1; t >= S0; t -= 0.62) {
        const fr = frameAt(t);
        s += box(fr, -0.11, 0.11, -1.55, 1.55, -0.33, -0.13, M.wood, { atmos: true, sw: 0.4 });
      }
      // guard timbers and rails as continuous strips
      const strip = (b, c0, c1, m, lift, sw) => {
        let out = '';
        for (let s0 = S1; s0 > S0; s0 -= 1.5) {
          const s1 = Math.max(S0, s0 - 1.5);
          const fa = frameAt(s0), fb = frameAt(s1);
          const side = [fa.W(0, b, c0), fb.W(0, b, c0), fb.W(0, b, c1), fa.W(0, b, c1)];
          out += face(side, atmos(shadeC(fa.s, cen(side), m, null, lift), cen(side)), sw);
        }
        return out;
      };
      const top = (b0, b1, c, m, lift) => {
        let out = '';
        for (let s0 = S1; s0 > S0; s0 -= 1.5) {
          const s1 = Math.max(S0, s0 - 1.5);
          const fa = frameAt(s0), fb = frameAt(s1);
          const q = [fa.W(0, b0, c), fb.W(0, b0, c), fb.W(0, b1, c), fa.W(0, b1, c)];
          out += face(q, atmos(shadeC([0, 1, 0], cen(q), m, null, lift), cen(q)), 0.5);
        }
        return out;
      };
      s += top(1.2, 1.42, -0.02, M.wood, 0.05) + strip(1.42, -0.02, -0.15, M.wood, 0, 0.5);
      s += top(-1.42, -1.2, -0.02, M.wood, 0.05);
      // rails: far rail then near rail (web + bright head)
      for (const b of [-0.72, 0.72]) {
        s += strip(b + 0.04, 0, -0.13, M.steel, -0.25, 0.4);
        s += top(b - 0.035, b + 0.035, 0.0, M.steel, 0.25);
      }
      parts.push({ svg: s });
    }

    // ==========================================================================================
    // SMOKE — the plume streams back over the train, sunlit from the upper left
    // ==========================================================================================
    function billows(list, o) {
      o = o || {};
      let sh = '', mid = '', hi = '', glow = '';
      for (const [x, y, r] of list) {
        glow += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r * 1.12)}"/>`;
        sh += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/>`;
        mid += `<circle cx="${n(x - r * 0.12)}" cy="${n(y - r * 0.15)}" r="${n(r * 0.84)}"/>`;
        hi += `<circle cx="${n(x - r * 0.3)}" cy="${n(y - r * 0.34)}" r="${n(r * 0.52)}"/>`;
      }
      return `<g fill="${o.glow || '#FFFFFF'}" fill-opacity="${o.glowO || 0.25}">${glow}</g>` +
        `<g fill="${o.shade || '#C2BBDD'}" fill-opacity="${o.op || 1}">${sh}</g>` +
        `<g fill="${o.mid || '#F3E6E6'}" fill-opacity="${o.op || 1}">${mid}</g>` +
        `<g fill="${o.hi || '#FFF7EC'}" fill-opacity="${o.op || 1}">${hi}</g>`;
    }
    {
      const r = rng(1869);
      // trailing veil first (thin, fading toward the left page)
      const trail = [];
      for (let i = 0; i < 26; i++) {
        const t = i / 25;
        const x = lerp(1120, 560, t), y = lerp(420, 560, t) + Math.sin(t * 9) * 16;
        trail.push([x + (r() - 0.5) * 30, y + (r() - 0.5) * 20, lerp(62, 26, t) * (0.8 + r() * 0.4)]);
      }
      const head = [];
      const path = [[1548, 520, 34], [1530, 470, 46], [1500, 420, 60], [1450, 380, 72], [1385, 360, 78], [1310, 356, 80], [1236, 372, 76], [1170, 394, 70]];
      for (const [x, y, rad] of path) {
        head.push([x, y, rad]);
        for (let j = 0; j < 3; j++) head.push([x + (r() - 0.5) * rad * 1.1, y + (r() - 0.4) * rad * 0.8, rad * (0.5 + r() * 0.3)]);
      }
      const gT = k.id('trailfade');
      parts.push({
        defs: lgU(gT, 560, 0, 1160, 0, [[0, '#FFFFFF', 0], [0.5, '#FFFFFF', 0.55], [1, '#FFFFFF', 1]]) +
          `<mask id="${gT}m"><rect x="0" y="0" width="${k.W}" height="${k.H}" fill="url(#${gT})"/></mask>`,
        svg: `<g mask="url(#${gT}m)" opacity="0.92">${billows(trail, { shade: '#CFC6E2', mid: '#F1E5E8', hi: '#FFF5EC' })}</g>` +
          billows(head, { shade: '#BDB4DA', mid: '#F2E2E2', hi: '#FFF6EA' }),
      });
    }

    // ==========================================================================================
    // THE TRAIN — passenger cars, tender, engine (far to near)
    // ==========================================================================================
    function truckWheel(fr, a, r, b, m) {
      // a small spoked wheel seen on the near side
      let s = joinZ(revolve(fr, [a, b - 0.1, r], [0, 1, 0], [1, 0, 0], [0, 0, 1], [[0, r * 0.94], [0.02, r], [0.1, r]], 28, M.steel, { atmos: true }));
      const rimO = discPts(fr, a, b, r, r, 32), rimI = discPts(fr, a, b, r, r * 0.8, 32);
      const N = fr.s, p = fr.W(a, b, r);
      s += `<path d="${pathOf(rimO)}${pathOf(rimI.slice().reverse())}" fill="${atmos(shadeC(N, p, M.steel, null, -0.1), p)}" fill-rule="evenodd"/>`;
      s += `<path d="${pathOf(rimI)}" fill="${atmos(shadeC(N, p, m, null, -0.15), p)}"/>`;
      let sp = '';
      for (let i = 0; i < 8; i++) {
        const t = (i / 8) * Math.PI * 2;
        sp += lineOf([P(fr.W(a, b + 0.01, r)), P(fr.W(a + r * 0.8 * Math.cos(t), b + 0.01, r + r * 0.8 * Math.sin(t)))]);
      }
      const d = len(p), sw = Math.max(0.8, (0.05 * F3) / d);
      s += `<path d="${sp}" stroke="${atmos(ramp(M.dark.ramp, 0.25), p)}" stroke-width="${n(sw)}" stroke-opacity="0.55"/>`;
      s += `<path d="${pathOf(discPts(fr, a, b + 0.02, r, r * 0.2, 16))}" fill="${atmos(shadeC(N, p, M.steel), p)}"/>`;
      return s;
    }

    function passengerCar(sf, sb, seed) {
      const fr = frame(sf, sb);
      const r = rng(seed);
      const L = sb - sf;
      const a0 = -L + 0.9, a1 = -0.9; // body
      const B = 1.5, cS = 1.25, cE = 3.45;
      let s = '';
      // trucks and wheels (behind the body's lower edge)
      for (const ta of [-2.7, -L + 2.7]) {
        s += box(fr, ta - 1.3, ta + 1.3, -1.1, 1.0, 0.45, 0.85, M.dark, { atmos: true });
        for (const da of [-0.8, 0.8]) s += truckWheel(fr, ta + da, 0.42, 0.86, M.dark);
      }
      // underframe
      s += box(fr, a0 + 0.4, a1 - 0.4, -1.3, 1.35, 0.95, cS, M.dark, { atmos: true });
      // body
      s += box(fr, a0, a1, -B, B, cS, cE, M.car, { atmos: true });
      const side = (pts, col, op) => `<path d="${polyL(fr, pts)}" fill="${col}"${op != null ? ` fill-opacity="${op}"` : ''}/>`;
      const pMid = fr.W((a0 + a1) / 2, B, 2.3);
      const ac = (col) => atmos(col, pMid);
      // panel lines, window band, letterboard
      s += side([[a0, B + 0.005, 2.12], [a1, B + 0.005, 2.12], [a1, B + 0.005, 2.18], [a0, B + 0.005, 2.18]], ac('#F6D7B4'), 0.85);
      s += side([[a0, B + 0.005, 3.08], [a1, B + 0.005, 3.08], [a1, B + 0.005, 3.36], [a0, B + 0.005, 3.36]], ac('#A24C55'));
      s += side([[a0 + 0.3, B + 0.008, 3.2], [a1 - 0.3, B + 0.008, 3.2], [a1 - 0.3, B + 0.008, 3.24], [a0 + 0.3, B + 0.008, 3.24]], ac('#F3C766'), 0.9);
      // windows: tall, round-headed, in pairs
      const nW = 12, span = a1 - a0 - 1.6;
      let wins = '', glints = '';
      for (let i = 0; i < nW; i++) {
        const wa = a0 + 0.8 + (span * (i + 0.5)) / nW;
        const w = 0.26;
        const pts = [];
        pts.push([wa - w, B + 0.01, 2.3], [wa + w, B + 0.01, 2.3], [wa + w, B + 0.01, 2.86]);
        for (let j = 1; j < 6; j++) { const t = (j / 6) * Math.PI; pts.push([wa + w * Math.cos(t), B + 0.01, 2.86 + w * 0.8 * Math.sin(t)]); }
        pts.push([wa - w, B + 0.01, 2.86]);
        wins += polyL(fr, pts);
        glints += polyL(fr, [[wa - w * 0.6, B + 0.012, 2.5], [wa - w * 0.2, B + 0.012, 2.82], [wa - w * 0.05, B + 0.012, 2.82], [wa - w * 0.45, B + 0.012, 2.5]]);
      }
      s += `<path d="${wins}" fill="${ac('#4A3E86')}"/><path d="${glints}" fill="${ac('#C9C3F0')}" fill-opacity="0.6"/>`;
      // window frames (cream)
      // eaves and clerestory roof
      s += box(fr, a0 - 0.25, a1 + 0.25, -1.62, 1.62, cE, cE + 0.12, M.roof, { atmos: true });
      s += box(fr, a0 + 0.6, a1 - 0.6, -0.98, 0.98, cE + 0.12, cE + 0.52, M.car, { atmos: true, lift: -0.1 });
      let cl = '';
      for (let i = 0; i < 18; i++) {
        const wa = a0 + 1.0 + ((a1 - a0 - 2.0) * (i + 0.5)) / 18;
        cl += polyL(fr, [[wa - 0.14, 0.985, cE + 0.22], [wa + 0.14, 0.985, cE + 0.22], [wa + 0.14, 0.985, cE + 0.42], [wa - 0.14, 0.985, cE + 0.42]]);
      }
      s += `<path d="${cl}" fill="${ac('#5B4E96')}"/>`;
      s += box(fr, a0 + 0.4, a1 - 0.4, -1.1, 1.1, cE + 0.52, cE + 0.62, M.roof, { atmos: true });
      // front platform, railings, steps
      s += box(fr, a1, 0, -1.3, 1.3, 1.1, 1.25, M.dark, { atmos: true });
      const rail = [];
      for (const bb of [1.25]) {
        for (const aa of [a1 + 0.1, -0.15]) rail.push(lineOf([P(fr.W(aa, bb, 1.25)), P(fr.W(aa, bb, 2.25))]));
        rail.push(lineOf([P(fr.W(a1 + 0.1, bb, 2.2)), P(fr.W(-0.15, bb, 2.2))]));
      }
      const d = len(pMid);
      s += `<path d="${rail.join('')}" stroke="${ac('#3A3474')}" stroke-width="${n(Math.max(1, 0.05 * F3 / d))}" fill="none"/>`;
      s += box(fr, a1 - 0.05, a1 + 0.35, 1.3, 1.5, 0.75, 0.9, M.dark, { atmos: true });
      // platform hood
      s += box(fr, a1, -0.05, -1.5, 1.5, cE + 0.05, cE + 0.12, M.roof, { atmos: true });
      return { z: len(fr.W(-L / 2, 0, 2)), svg: s };
    }

    const consist = [[66.8, 82.8, 71], [50.2, 66.2, 72], [33.6, 49.6, 73], [17.0, 33.0, 74]];
    {
      let s = '';
      for (const [sf, sb, seed] of consist) s += passengerCar(sf, sb, seed).svg;
      parts.push({ svg: s });
    }

    // ---- tender -------------------------------------------------------------------------------
    {
      const fr = frame(10.7, 16.3);
      const L = 5.6;
      let s = '';
      for (const ta of [-1.2, -L + 1.2]) {
        s += box(fr, ta - 1.1, ta + 1.1, -1.0, 1.0, 0.4, 0.95, M.dark);
        for (const da of [-0.62, 0.62]) s += truckWheel(fr, ta + da, 0.42, 0.85, M.dark);
      }
      s += box(fr, -L + 0.1, -0.1, -1.3, 1.36, 0.95, 1.25, M.dark);
      // wood piled on the deck, log ends showing over the side
      const r = rng(55);
      let logs = '';
      const items = [];
      for (let row = 0; row < 3; row++) {
        for (let i = 0; i < 10 - row; i++) {
          const a = -L + 0.6 + (i + row * 0.5) * 0.46 + (r() - 0.5) * 0.08;
          const c = 2.5 + row * 0.36 + (r() - 0.5) * 0.05;
          const rr = 0.17 + r() * 0.05;
          items.push({ a, c, rr });
        }
      }
      for (const it of items) {
        const pts = discPts(fr, it.a, 1.05, it.c, it.rr, 14);
        const p = fr.W(it.a, 1.05, it.c);
        logs += `<path d="${pathOf(pts)}" fill="${shadeC(fr.s, p, M.log)}"/>`;
        logs += `<path d="${pathOf(discPts(fr, it.a, 1.06, it.c, it.rr * 0.55, 10))}" fill="none" stroke="#B87A5E" stroke-width="1" stroke-opacity="0.6"/>`;
      }
      s += logs;
      // tank: blue with gold lining
      s += box(fr, -L, -0.3, -1.38, 1.38, 1.25, 2.55, M.blue);
      s += `<path d="${polyL(fr, [[-L + 0.25, 1.39, 1.45], [-0.55, 1.39, 1.45], [-0.55, 1.39, 2.35], [-L + 0.25, 1.39, 2.35]])}" fill="none" stroke="#F3C766" stroke-width="2.4" stroke-opacity="0.85"/>`;
      s += box(fr, -L - 0.05, -0.25, -1.42, 1.42, 2.5, 2.62, M.brass, { lift: -0.1 });
      parts.push({ svg: s });
    }

    // ==========================================================================================
    // THE ENGINE — a 4-4-0 "American"
    // ==========================================================================================
    {
      const fr = frame(0, 10);
      const s = [];
      const push = (svg) => s.push(svg);
      const BC = 2.2, BR = 0.62, SBR = 0.68;           // boiler centre height and radii
      const SB0 = -1.75, SB1 = -3.4, BO1 = -7.9;        // smokebox front/back, boiler end
      const DR = 0.76, DA = [-5.0, -7.15], DB = 0.8;    // drivers
      const TRR = 0.38, TA = [-2.0, -3.62], TB = 0.78;  // truck wheels
      const CR = 0.32, CRANK = -1.05;                   // crank radius, angle
      const CYL = { a0: -2.25, a1: -3.35, b: 1.08, c: 1.2, r: 0.3 };
      const along = [1, 0, 0], lat = [0, 1, 0], up = [0, 0, 1];

      // -- wheels
      function driver(a, c, r, b, far) {
        let out = '';
        const m = far ? { ...M.red, amb: 0.04, kd: 0.25 } : M.red;
        const st = far ? { ...M.steel, amb: 0.06, kd: 0.25, ks: 0.1 } : M.steel;
        if (!far) out += joinZ(revolve(fr, [a, b - 0.14, c], lat, along, up, [[0, r * 0.95], [0.03, r], [0.14, r]], 64, M.steel));
        const N = fr.s, p = fr.W(a, b, c);
        const O = discPts(fr, a, b, c, r, 72), I = discPts(fr, a, b, c, r * 0.86, 72), I2 = discPts(fr, a, b, c, r * 0.79, 72);
        out += `<path d="${pathOf(O)}${pathOf(I.slice().reverse())}" fill="${shadeC(N, p, st, null, -0.05)}" fill-rule="evenodd"/>`;
        out += `<path d="${pathOf(I)}${pathOf(I2.slice().reverse())}" fill="${shadeC(N, p, m)}" fill-rule="evenodd"/>`;
        // spokes, tapering to the rim
        const nS = far ? 12 : 16;
        let sp = '';
        for (let i = 0; i < nS; i++) {
          const t = CRANK + Math.PI / nS + (i / nS) * Math.PI * 2;
          const wh = 0.05 / (r * 0.2), wr = 0.03 / (r * 0.8);
          sp += pathOf([[r * 0.18, t - wh], [r * 0.8, t - wr], [r * 0.8, t + wr], [r * 0.18, t + wh]].map(([rho, th]) => P(fr.W(a + rho * Math.cos(th), b - 0.01, c + rho * Math.sin(th)))));
        }
        out += `<path d="${sp}" fill="${shadeC(N, p, m, null, -0.06)}"/>`;
        // counterweight opposite the crank
        const cw = [];
        const tc = CRANK + Math.PI;
        for (let i = 0; i <= 10; i++) { const t = tc - 0.62 + (i / 10) * 1.24; cw.push(P(fr.W(a + r * 0.8 * Math.cos(t), b - 0.005, c + r * 0.8 * Math.sin(t)))); }
        for (let i = 10; i >= 0; i--) { const t = tc - 0.42 + (i / 10) * 0.84; cw.push(P(fr.W(a + r * 0.36 * Math.cos(t), b - 0.005, c + r * 0.36 * Math.sin(t)))); }
        out += `<path d="${pathOf(cw)}" fill="${shadeC(N, p, m, null, -0.12)}"/>`;
        // hub
        out += `<path d="${pathOf(discPts(fr, a, b, c, r * 0.24, 24))}" fill="${shadeC(N, p, m, null, 0.04)}"/>`;
        out += `<path d="${pathOf(discPts(fr, a, b + 0.02, c, r * 0.12, 18))}" fill="${shadeC(N, p, st, null, 0.1)}"/>`;
        if (!far) {
          // lit arc along the upper-left of the tire, and the tire's bright edge
          const arc = [];
          for (let i = 0; i <= 20; i++) { const t = Math.PI * 0.45 + (i / 20) * Math.PI * 0.75; arc.push(P(fr.W(a + r * 0.97 * Math.cos(t), b + 0.005, c + r * 0.97 * Math.sin(t)))); }
          out += `<path d="${lineOf(arc)}" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
          const arc2 = [];
          for (let i = 0; i <= 20; i++) { const t = Math.PI * 0.5 + (i / 20) * Math.PI * 0.6; arc2.push(P(fr.W(a + r * 0.83 * Math.cos(t), b + 0.005, c + r * 0.83 * Math.sin(t)))); }
          out += `<path d="${lineOf(arc2)}" stroke="#FFC9AE" stroke-opacity="0.7" stroke-width="2" fill="none" stroke-linecap="round"/>`;
        }
        return out;
      }

      // 1. far-side wheels and undercarriage shadow
      for (const a of TA) push(driver(a, TRR, TRR, -TB + 0.14, true));
      for (const a of DA) push(driver(a, DR, DR, -DB + 0.14, true));
      push(`<path d="${polyL(fr, [[-1.9, 0.45, 0.42], [-10.1, 0.45, 0.42], [-10.1, 0.45, 1.62], [-1.9, 0.45, 1.62]])}" fill="#262A62"/>`);
      push(box(fr, -1.9, -10.0, -0.55, 0.55, 0.85, 1.3, M.dark));
      // far cylinder
      push(joinZ(revolve(fr, [CYL.a1, -CYL.b, CYL.c], along, lat, up, [[0, 0], [0.001, CYL.r], [CYL.a0 - CYL.a1, CYL.r], [CYL.a0 - CYL.a1 + 0.001, 0]], 36, M.blue)));

      // 2. cab (behind the boiler)
      const CA0 = -8.0, CA1 = -10.2, CB = 1.35, CC0 = 1.55, CC1 = 3.9;
      push(box(fr, CA1, CA0, -CB, CB, CC0, CC1, M.cab));
      {
        // side windows (dark interior) with cream frames, gold lining on the lower panel
        let w = '', fra = '';
        for (const [wa0, wa1] of [[-8.25, -8.95], [-9.2, -9.95]]) {
          const pts = [[wa0, CB + 0.01, 2.62], [wa1, CB + 0.01, 2.62], [wa1, CB + 0.01, 3.32]];
          for (let j = 1; j < 8; j++) { const t = (j / 8) * Math.PI; pts.push([(wa0 + wa1) / 2 - ((wa0 - wa1) / 2) * Math.cos(t), CB + 0.01, 3.32 + 0.2 * Math.sin(t)]); }
          pts.push([wa0, CB + 0.01, 3.32]);
          fra += polyL(fr, pts.map(([a, b, c]) => [a + (a > (wa0 + wa1) / 2 ? 0.07 : -0.07), b - 0.002, c + (c < 2.7 ? -0.07 : 0.06)]));
          w += polyL(fr, pts);
        }
        push(`<path d="${fra}" fill="#F6E4D6"/><path d="${w}" fill="#2B2560"/>`);
        push(`<path d="${polyL(fr, [[-8.25, CB + 0.012, 2.66], [-8.5, CB + 0.012, 2.66], [-8.32, CB + 0.012, 3.3], [-8.25, CB + 0.012, 3.3]])}" fill="#8F86D0" fill-opacity="0.55"/>`);
        push(`<path d="${polyL(fr, [[-8.18, CB + 0.01, 1.72], [-10.0, CB + 0.01, 1.72], [-10.0, CB + 0.01, 2.42], [-8.18, CB + 0.01, 2.42]])}" fill="none" stroke="#F3C766" stroke-width="2.6"/>`);
        push(`<path d="${polyL(fr, [[-8.3, CB + 0.01, 1.82], [-9.88, CB + 0.01, 1.82], [-9.88, CB + 0.01, 2.32], [-8.3, CB + 0.01, 2.32]])}" fill="none" stroke="#F3C766" stroke-width="1.2" stroke-opacity="0.7"/>`);
        // front spectacle window beside the boiler
        const fw = [[CA0 + 0.01, 0.82, 2.72], [CA0 + 0.01, 1.22, 2.72], [CA0 + 0.01, 1.22, 3.38], [CA0 + 0.01, 0.82, 3.38]];
        push(`<path d="${polyL(fr, fw.map(([a, b, c]) => [a, b + (b > 1 ? 0.06 : -0.06), c + (c < 3 ? -0.06 : 0.06)]))}" fill="#F6E4D6"/><path d="${polyL(fr, fw)}" fill="#3A3474"/>`);
        // roof: overhanging eaves
        push(box(fr, CA1 - 0.25, CA0 + 0.3, -1.58, 1.58, CC1, CC1 + 0.1, M.roof));
        push(box(fr, CA1 - 0.2, CA0 + 0.25, -1.1, 1.1, CC1 + 0.1, CC1 + 0.28, M.roof, { lift: 0.06 }));
        push(box(fr, CA1 - 0.15, CA0 + 0.2, -0.5, 0.5, CC1 + 0.28, CC1 + 0.36, M.roof, { lift: 0.1 }));
      }

      // 3. firebox, boiler and smokebox (one sorted set of facets)
      {
        const f = [];
        f.push(...revolve(fr, [-9.6, 0, BC + 0.02], along, lat, up, [[0, 0.7], [9.6 + BO1 + 0.6, 0.7]], 72, M.blue, { th0: -Math.PI / 2, span: Math.PI }));
        f.push(...revolve(fr, [BO1, 0, BC], along, lat, up, [[0, BR], [BO1 * -1 + SB1, BR]], 72, M.blue));
        f.push(...revolve(fr, [SB1, 0, BC], along, lat, up, [[-0.02, BR], [0.0, SBR], [SB1 * -1 + SB0, SBR]], 72, M.iron));
        push(joinZ(f));
        // boiler bands (brass)
        const bands = [];
        for (const a of [-3.45, -4.55, -5.75, -6.95, -7.85]) bands.push(...revolve(fr, [a - 0.05, 0, BC], along, lat, up, [[0, BR + 0.012], [0.1, BR + 0.012]], 72, M.brass));
        bands.push(...revolve(fr, [SB0 - 0.04, 0, BC], along, lat, up, [[-0.04, SBR + 0.02], [0.04, SBR + 0.02]], 72, M.brass));
        push(joinZ(bands));
      }

      // 4. domes, bell, whistle, stack (sorted together)
      {
        const f = [];
        const domeProf = (h, r) => [[0, r * 1.28], [0.08, r * 1.12], [0.16, r], [h * 0.62, r], [h * 0.7, r * 0.96], [h * 0.8, r * 0.84], [h * 0.9, r * 0.6], [h * 0.97, r * 0.32], [h, 0]];
        const domeAt = (a, h, r) => {
          f.push(...revolve(fr, [a, 0, BC + BR - 0.1], up, along, lat, domeProf(h, r), 48, M.brass));
          f.push(...revolve(fr, [a, 0, BC + BR - 0.1 + h * 0.6], up, along, lat, [[0, r + 0.025], [0.07, r + 0.025]], 48, M.brass, { lift: 0.08 }));
        };
        domeAt(-5.05, 0.78, 0.29);
        domeAt(-6.85, 0.92, 0.33);
        // whistle and safety valve on the steam dome
        f.push(...revolve(fr, [-6.75, 0.08, BC + BR + 0.8], up, along, lat, [[0, 0.05], [0.18, 0.05], [0.2, 0.08], [0.34, 0.08], [0.36, 0.04], [0.4, 0]], 24, M.brass));
        f.push(...revolve(fr, [-6.98, -0.06, BC + BR + 0.8], up, along, lat, [[0, 0.06], [0.22, 0.05], [0.24, 0.07], [0.27, 0]], 24, M.brass));
        // bell in its yoke
        const bA = -4.05, bC = BC + BR - 0.04;
        for (const bb of [-0.24, 0.24]) f.push(...revolve(fr, [bA, bb, bC], up, along, lat, [[0, 0.035], [0.5, 0.035]], 12, M.brass));
        f.push(...revolve(fr, [bA, -0.27, bC + 0.5], lat, along, up, [[0, 0.03], [0.54, 0.03]], 12, M.brass));
        f.push(...revolve(fr, [bA, 0, bC + 0.13], up, along, lat, [[0, 0.21], [0.03, 0.2], [0.1, 0.165], [0.2, 0.14], [0.28, 0.12], [0.33, 0.08], [0.36, 0.0]], 40, M.brass));
        // the balloon stack
        const stackProf = [[0, 0.36], [0.07, 0.36], [0.09, 0.27], [0.12, 0.255], [0.78, 0.245], [0.86, 0.27], [0.96, 0.32], [1.1, 0.41], [1.26, 0.52], [1.42, 0.61], [1.56, 0.665], [1.66, 0.68], [1.7, 0.69], [1.74, 0.66], [1.78, 0.6], [1.84, 0.47], [1.9, 0.27], [1.93, 0]];
        f.push(...revolve(fr, [-2.55, 0, BC + SBR - 0.06], up, along, lat, stackProf, 64, M.iron));
        f.push(...revolve(fr, [-2.55, 0, BC + SBR - 0.06], up, along, lat, [[0.03, 0.375], [0.1, 0.375]], 64, M.brass));
        f.push(...revolve(fr, [-2.55, 0, BC + SBR - 0.06], up, along, lat, [[1.64, 0.7], [1.71, 0.705]], 64, M.brass));
        push(joinZ(f));
      }

      // 5. handrail along the boiler
      {
        const pts = [];
        for (let a = -2.2; a >= -7.8; a -= 0.4) pts.push(P(fr.W(a, 0.7, BC + 0.38)));
        let st = '';
        for (const a of [-2.4, -4.4, -6.4, -7.7]) st += lineOf([P(fr.W(a, 0.6, BC + 0.3)), P(fr.W(a, 0.7, BC + 0.38))]);
        push(`<path d="${st}" stroke="#C99A48" stroke-width="2.4"/><path d="${lineOf(pts)}" stroke="#F4D27C" stroke-width="3.2" fill="none" stroke-linecap="round"/>`);
      }

      // 6. running board with its ornamented valance
      push(box(fr, -8.0, -3.4, 0.55, 1.4, 1.6, 1.68, M.wood, { lift: 0.05 }));
      push(box(fr, -8.0, -3.4, 1.4, 1.44, 1.42, 1.68, M.red, { lift: 0.04 }));
      {
        // gold scallops along the valance
        let sc = '';
        for (let a = -3.5; a > -7.95; a -= 0.36) sc += polyL(fr, [[a, 1.445, 1.64], [a - 0.18, 1.445, 1.5], [a - 0.36, 1.445, 1.64]]);
        push(`<path d="${sc}" fill="none" stroke="#F5CD6E" stroke-width="1.6" stroke-opacity="0.9"/>`);
        push(`<path d="${lineOf([P(fr.W(-3.4, 1.445, 1.66)), P(fr.W(-8.0, 1.445, 1.66))])}" stroke="#FFE7A8" stroke-width="2" />`);
      }

      // 7. near truck wheels, steam chest, cylinder, guides
      for (const a of TA) push(driver(a, TRR, TRR, TB, false));
      push(box(fr, -3.35, -2.3, 0.6, 1.3, 1.45, 1.9, M.iron));
      push(box(fr, -3.3, -2.35, 0.82, 1.32, 1.84, 1.92, M.brass));
      push(joinZ(revolve(fr, [CYL.a1, CYL.b, CYL.c], along, lat, up, [[0, 0], [0.001, CYL.r + 0.03], [0.07, CYL.r + 0.03], [0.08, CYL.r], [CYL.a0 - CYL.a1 - 0.08, CYL.r], [CYL.a0 - CYL.a1 - 0.07, CYL.r + 0.03], [CYL.a0 - CYL.a1, CYL.r + 0.03], [CYL.a0 - CYL.a1 + 0.001, 0]], 48, M.blue)));
      push(`<path d="${pathOf(discPts(fr, CYL.a0 + 0.002, 0, 0, 0, 3))}" fill="none"/>`);
      {
        // front cylinder cover (brass), seen end-on
        const pts = [];
        for (let i = 0; i < 36; i++) { const t = (i / 36) * Math.PI * 2; pts.push(P(fr.W(CYL.a0 + 0.004, CYL.b + 0.3 * Math.cos(t), CYL.c + 0.3 * Math.sin(t)))); }
        const pc = fr.W(CYL.a0, CYL.b, CYL.c);
        push(`<path d="${pathOf(pts)}" fill="${shadeC(fr.h, pc, M.brass, null, 0.05)}"/>`);
        const pts2 = [];
        for (let i = 0; i < 24; i++) { const t = (i / 24) * Math.PI * 2; pts2.push(P(fr.W(CYL.a0 + 0.006, CYL.b + 0.18 * Math.cos(t), CYL.c + 0.18 * Math.sin(t)))); }
        push(`<path d="${pathOf(pts2)}" fill="${shadeC(fr.h, pc, M.brass, null, 0.18)}"/>`);
      }
      // crosshead guides, crosshead
      const pinA = (a) => [a + CR * Math.cos(CRANK), DR + CR * Math.sin(CRANK)];
      const [pa2, pc2] = pinA(DA[1]);
      const rodL = 3.05;
      const xhA = pa2 + Math.sqrt(rodL * rodL - (CYL.c - pc2) ** 2);
      push(box(fr, -4.55, CYL.a1, CYL.b - 0.04, CYL.b + 0.04, CYL.c + 0.12, CYL.c + 0.18, M.steel));
      push(box(fr, -4.55, CYL.a1, CYL.b - 0.04, CYL.b + 0.04, CYL.c - 0.18, CYL.c - 0.12, M.steel));
      push(box(fr, xhA - 0.16, xhA + 0.16, CYL.b - 0.06, CYL.b + 0.08, CYL.c - 0.13, CYL.c + 0.13, M.steel, { lift: 0.08 }));
      push(box(fr, -4.62, -4.5, 0.6, CYL.b + 0.06, CYL.c - 0.3, CYL.c + 0.35, M.dark));

      // 8. near drivers and rods
      for (const a of DA) push(driver(a, DR, DR, DB, false));
      {
        const [p1a, p1c] = pinA(DA[0]);
        const rod = (aA, cA, aB, cB, b, w, m) => {
          const dx = aB - aA, dc = cB - cA, L = Math.hypot(dx, dc), nx = -dc / L * w / 2, nc = dx / L * w / 2;
          const q = [fr.W(aA + nx, b, cA + nc), fr.W(aB + nx, b, cB + nc), fr.W(aB - nx, b, cB - nc), fr.W(aA - nx, b, cA - nc)];
          return face(q, shadeC(fr.s, cen(q), m, null, 0.08)) + face([fr.W(aA + nx, b, cA + nc), fr.W(aB + nx, b, cB + nc), fr.W(aB + nx, b - 0.05, cB + nc), fr.W(aA + nx, b - 0.05, cA + nc)], shadeC([0, 1, 0], cen(q), m, null, 0.15));
        };
        push(rod(p1a, p1c, pa2, pc2, DB + 0.08, 0.1, M.steel));
        for (const [aa, cc] of [[p1a, p1c], [pa2, pc2]]) {
          push(`<path d="${pathOf(discPts(fr, aa, DB + 0.09, cc, 0.1, 20))}" fill="${shadeC(fr.s, fr.W(aa, DB, cc), M.steel, null, 0.05)}"/>`);
        }
        push(rod(xhA, CYL.c, pa2, pc2, DB + 0.16, 0.13, M.steel));
        push(`<path d="${pathOf(discPts(fr, pa2, DB + 0.17, pc2, 0.12, 20))}" fill="${shadeC(fr.s, fr.W(pa2, DB, pc2), M.steel, null, 0.1)}"/>`);
        push(`<path d="${pathOf(discPts(fr, pa2, DB + 0.18, pc2, 0.05, 12))}" fill="#2B3070"/>`);
      }

      // 9. smokebox front: door, hinges, number plate
      {
        const pc = fr.W(SB0, 0, BC);
        const ring = (r, a) => { const pts = []; for (let i = 0; i < 64; i++) { const t = (i / 64) * Math.PI * 2; pts.push(P(fr.W(a, r * Math.cos(t), BC + r * Math.sin(t)))); } return pts; };
        push(`<path d="${pathOf(ring(SBR, SB0))}" fill="${shadeC(fr.h, pc, M.iron, null, -0.02)}"/>`);
        push(`<path d="${pathOf(ring(0.58, SB0 + 0.03))}" fill="${shadeC(fr.h, pc, M.iron, null, 0.06)}"/>`);
        push(`<path d="${pathOf(ring(0.5, SB0 + 0.05))}" fill="${shadeC(fr.h, pc, M.iron, null, 0.12)}"/>`);
        // lit rim on the door's upper left
        const arc = [];
        for (let i = 0; i <= 24; i++) { const t = Math.PI * 0.35 + (i / 24) * Math.PI * 0.8; arc.push(P(fr.W(SB0 + 0.05, 0.56 * Math.cos(t), BC + 0.56 * Math.sin(t)))); }
        push(`<path d="${lineOf(arc)}" stroke="#C9CFF6" stroke-width="3" fill="none" stroke-linecap="round" stroke-opacity="0.85"/>`);
        // hinges
        for (const c of [BC + 0.22, BC - 0.22]) push(`<path d="${polyL(fr, [[SB0 + 0.06, -0.54, c - 0.035], [SB0 + 0.06, 0.15, c - 0.035], [SB0 + 0.06, 0.15, c + 0.035], [SB0 + 0.06, -0.54, c + 0.035]])}" fill="${shadeC(fr.h, pc, M.iron, null, 0.2)}"/>`);
        // number plate and star
        const np = [];
        for (let i = 0; i < 32; i++) { const t = (i / 32) * Math.PI * 2; np.push(P(fr.W(SB0 + 0.07, 0.17 * Math.cos(t), BC + 0.17 * Math.sin(t)))); }
        push(`<path d="${pathOf(np)}" fill="${shadeC(fr.h, pc, M.brass, null, 0.1)}"/>`);
        const st = [];
        for (let i = 0; i < 10; i++) { const rr = i % 2 ? 0.045 : 0.11, t = Math.PI / 2 + (i * Math.PI) / 5; st.push(P(fr.W(SB0 + 0.08, rr * Math.cos(t), BC + rr * Math.sin(t)))); }
        push(`<path d="${pathOf(st)}" fill="#A0572C"/>`);
      }

      // 10. headlamp on its bracket
      {
        const ha0 = -2.28, ha1 = -1.62, hb = 0.3, hc0 = 3.0, hc1 = 3.62;
        push(box(fr, -2.1, -1.8, -0.12, 0.12, BC + SBR - 0.05, hc0, M.iron));
        push(box(fr, ha0, ha1, -hb, hb, hc0, hc1, M.cab, { lift: 0.04 }));
        // panels on its side: gold frame and a painted medallion
        const pan = [[ha0 + 0.07, hb + 0.005, hc0 + 0.08], [ha1 - 0.07, hb + 0.005, hc0 + 0.08], [ha1 - 0.07, hb + 0.005, hc1 - 0.08], [ha0 + 0.07, hb + 0.005, hc1 - 0.08]];
        push(`<path d="${polyL(fr, pan)}" fill="#F4E6DA" fill-opacity="0.9"/><path d="${polyL(fr, pan)}" fill="none" stroke="#E9B44C" stroke-width="2"/>`);
        const md = [];
        for (let i = 0; i < 20; i++) { const t = (i / 20) * Math.PI * 2; md.push(P(fr.W((ha0 + ha1) / 2 + 0.16 * Math.cos(t), hb + 0.008, (hc0 + hc1) / 2 + 0.16 * Math.sin(t)))); }
        push(`<path d="${pathOf(md)}" fill="#5B6FD6"/>`);
        // gabled roof, chimney
        push(`<path d="${polyL(fr, [[ha1 + 0.05, -hb - 0.05, hc1], [ha1 + 0.05, hb + 0.05, hc1], [ha1 + 0.05, 0, hc1 + 0.16]])}" fill="${shadeC(fr.h, fr.W(ha1, 0, hc1), M.brass)}"/>`);
        push(`<path d="${polyL(fr, [[ha0 - 0.05, hb + 0.05, hc1], [ha1 + 0.05, hb + 0.05, hc1], [ha1 + 0.05, 0, hc1 + 0.16], [ha0 - 0.05, 0, hc1 + 0.16]])}" fill="${shadeC(norm(add(fr.s, [0, 1.6, 0])), fr.W(ha1, hb, hc1), M.brass)}"/>`);
        push(joinZ(revolve(fr, [(ha0 + ha1) / 2, 0, hc1 + 0.1], up, along, lat, [[0, 0.06], [0.2, 0.06], [0.22, 0.1], [0.26, 0.1], [0.28, 0]], 20, M.brass)));
        // front face with the lens
        const lc = [ha1 + 0.01, 0, (hc0 + hc1) / 2];
        const ring = (r) => { const pts = []; for (let i = 0; i < 40; i++) { const t = (i / 40) * Math.PI * 2; pts.push(P(fr.W(lc[0], r * Math.cos(t), lc[2] + r * Math.sin(t)))); } return pts; };
        push(`<path d="${pathOf(ring(0.25))}" fill="${shadeC(fr.h, fr.W(...lc), M.brass, null, 0.1)}"/>`);
        const lg = k.id('lens'), hg = k.id('hglow');
        const lp = P(fr.W(...lc));
        parts.push({ defs: rgU(lg, lp[0] - 6, lp[1] - 6, 40, [[0, '#FFFFFF'], [0.35, '#FFF4C8'], [0.75, '#FBD879'], [1, '#EDB24A']]) + rgU(hg, lp[0], lp[1], 190, [[0, '#FFF6D6', 0.85], [0.3, '#FFEFC8', 0.45], [1, '#FFE9C0', 0]]) });
        push(`<path d="${pathOf(ring(0.2))}" fill="url(#${lg})"/>`);
        s.push(`__GLOW__${lp[0]},${lp[1]},${hg}`);
      }

      // 11. buffer beam and the cowcatcher
      {
        push(box(fr, -1.75, -1.45, -1.3, 1.3, 0.9, 1.25, M.red, { lift: 0.05 }));
        push(`<path d="${polyL(fr, [[-1.448, -1.2, 1.18], [-1.448, 1.2, 1.18], [-1.448, 1.2, 1.2], [-1.448, -1.2, 1.2]])}" fill="#F5CD6E"/>`);
        push(`<path d="${polyL(fr, [[-1.448, -1.2, 0.95], [-1.448, 1.2, 0.95], [-1.448, 1.2, 0.97], [-1.448, -1.2, 0.97]])}" fill="#F5CD6E"/>`);
        // dark interior of the wedge
        const T = (t, sg) => [-1.47, sg * 1.25 * t, 0.98], Bt = (t, sg) => [-1.45 * t, sg * 1.25 * t, 0.12];
        push(`<path d="${polyL(fr, [T(0, 1), T(1, 1), Bt(1, 1), Bt(0, 1), Bt(1, -1), T(1, -1)])}" fill="#2A2765"/>`);
        // slats: far face first, then near face
        for (const sg of [-1, 1]) {
          const nW = norm(fr.dir(1.25 * 0.9, sg * 1.45 * 0.9, 0.86 * 0.6));
          let sl = '';
          const nS = 9;
          for (let i = 0; i <= nS; i++) {
            const t = i / nS, w = 0.035;
            const tA = Math.max(0, t - w), tB = Math.min(1, t + w);
            sl += polyL(fr, [T(tA, sg), T(tB, sg), Bt(tB, sg), Bt(tA, sg)]);
          }
          const pm = fr.W(-0.8, sg * 0.6, 0.5);
          push(`<path d="${sl}" fill="${shadeC(nW, pm, M.red, null, sg < 0 ? -0.08 : 0.02)}"/>`);
          // bottom bar and top rail on this face
          push(`<path d="${lineOf([P(fr.W(...Bt(0, sg))), P(fr.W(...Bt(1, sg)))])}" stroke="${shadeC(nW, pm, M.steel, null, -0.1)}" stroke-width="6" stroke-linecap="round"/>`);
        }
        push(`<path d="${lineOf([P(fr.W(...T(1, -1))), P(fr.W(...T(1, 1)))])}" stroke="#F5CD6E" stroke-width="5" stroke-linecap="round"/>`);
        // the nose post and coupler drawhead
        push(`<path d="${lineOf([P(fr.W(-1.47, 0, 0.98)), P(fr.W(0, 0, 0.12))])}" stroke="#FF9F84" stroke-width="5" stroke-linecap="round"/>`);
        push(box(fr, -1.45, -1.2, -0.12, 0.12, 0.95, 1.12, M.iron));
      }
      // flags on the buffer beam corners
      {
        for (const sg of [-1, 1]) {
          const base = fr.W(-1.6, sg * 1.18, 1.25), top = fr.W(-1.6, sg * 1.18, 2.15);
          const pb = P(base), pt = P(top);
          const fw = (0.62 * F3) / len(top), fh = fw * 0.62;
          let fl = `<path d="M${n(pb[0])} ${n(pb[1])}L${n(pt[0])} ${n(pt[1])}" stroke="#3B3F8E" stroke-width="2.6"/>`;
          const x0 = pt[0], y0 = pt[1] + 2, dir = 1;
          const wave = (yy) => `M${n(x0)} ${n(yy)}C${n(x0 + dir * fw * 0.35)} ${n(yy - fh * 0.12)} ${n(x0 + dir * fw * 0.65)} ${n(yy + fh * 0.12)} ${n(x0 + dir * fw)} ${n(yy + fh * 0.02)}`;
          // body of the flag (stripes)
          let stripes = '';
          for (let i = 0; i < 7; i++) {
            const ya = y0 + (fh * i) / 7, yb = y0 + (fh * (i + 0.5)) / 7;
            stripes += `<path d="${wave(ya)}L${n(x0 + dir * fw)} ${n(yb + fh * 0.02)}C${n(x0 + dir * fw * 0.65)} ${n(yb + fh * 0.12)} ${n(x0 + dir * fw * 0.35)} ${n(yb - fh * 0.12)} ${n(x0)} ${n(yb)}Z" fill="#E8505A"/>`;
          }
          fl += `<path d="${wave(y0)}L${n(x0 + dir * fw)} ${n(y0 + fh + fh * 0.02)}C${n(x0 + dir * fw * 0.65)} ${n(y0 + fh + fh * 0.12)} ${n(x0 + dir * fw * 0.35)} ${n(y0 + fh - fh * 0.12)} ${n(x0)} ${n(y0 + fh)}Z" fill="#FFF6EE"/>` + stripes;
          fl += `<rect x="${n(x0)}" y="${n(y0)}" width="${n(fw * 0.42)}" height="${n(fh * 0.54)}" fill="#3A4FC9"/>`;
          push(fl);
        }
      }

      // assemble, inserting the headlamp glow behind the engine
      let body = '', glow = '';
      for (const piece of s) {
        if (piece.startsWith('__GLOW__')) {
          const [x, y, g] = piece.slice(8).split(',');
          glow = `<circle cx="${x}" cy="${y}" r="190" fill="url(#${g})"/>`;
        } else body += piece;
      }
      parts.push({ svg: body + glow });
    }

    // a fresh puff at the stack mouth, and steam from the cylinder cocks
    parts.push({ svg: billows([[1552, 520, 30], [1580, 506, 22], [1528, 500, 24]], { shade: '#C6BEDD', mid: '#F5E8E6', hi: '#FFF8EE' }) });
    {
      const r = rng(77);
      const puffs = [];
      for (let i = 0; i < 14; i++) {
        const t = i / 13;
        puffs.push([1860 + t * 170 + (r() - 0.5) * 40, 1120 - t * 50 + (r() - 0.5) * 30, 26 + t * 34 + r() * 10]);
      }
      parts.push({ svg: `<g opacity="0.92">${billows(puffs, { shade: '#CBC4E2', mid: '#F4ECEE', hi: '#FFFBF4' })}</g>` });
    }

    // ==========================================================================================
    // FOREGROUND — rocky ledges and Colorado blue columbines
    // ==========================================================================================
    function ledge(pts, o) {
      const g = k.id('rock');
      let s = `<path d="${smooth(pts, true, 0.6)}" fill="url(#${g})"/>`;
      // lit top edge
      return { defs: lgU(g, o.x0, o.y0, o.x1, o.y1, [[0, '#E9D4D2'], [0.35, '#B9AED4'], [1, '#8C85BE']]), svg: s };
    }
    function columbine(x, y, R, o) {
      // A flower facing direction (yaw, pitch); orthographic, drawn in 3-D.
      const yaw = o.yaw || 0, pitch = o.pitch || 0, roll = o.roll || 0;
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const nrm = [sy * cp, -sp, cy * cp];      // facing (toward viewer when z>0)
      let u = norm(cross([0, 1, 0], nrm)); if (!isFinite(u[0])) u = [1, 0, 0];
      let v = cross(nrm, u);
      const cr = Math.cos(roll), sr = Math.sin(roll);
      [u, v] = [add(mul(u, cr), mul(v, sr)), add(mul(u, -sr), mul(v, cr))];
      const at = (px, py, pz) => [x + R * (u[0] * px + v[0] * py + nrm[0] * pz), y + R * (u[1] * px + v[1] * py + nrm[1] * pz)];
      const gS = k.id('sep'), gP = k.id('pet'), gSp = k.id('spur');
      const defs = rgU(gS, x, y, R * 1.05, [[0, '#4C4FC0'], [0.45, '#7A82E0'], [0.85, '#AEB6F2'], [1, '#C9CEF8']]) +
        rgU(gP, x, y, R * 0.62, [[0, '#C9C6EE'], [0.5, '#F1EEFB'], [1, '#FFFFFF']]) +
        lgU(gSp, x, y - R, x, y + R, [[0, '#6C70D6'], [1, '#4A4CB8']]);
      let s = '';
      // spurs behind: five slender tails sweeping back
      let spurs = '';
      for (let i = 0; i < 5; i++) {
        const t = (i / 5) * Math.PI * 2 + Math.PI / 5;
        const p0 = at(0.22 * Math.cos(t), 0.22 * Math.sin(t), -0.05);
        const p1 = at(0.38 * Math.cos(t), 0.38 * Math.sin(t), -0.7);
        const p2 = at(0.3 * Math.cos(t), 0.3 * Math.sin(t) - 0.1, -1.25);
        spurs += `M${n(p0[0])} ${n(p0[1])}Q${n(p1[0])} ${n(p1[1])} ${n(p2[0])} ${n(p2[1])}`;
      }
      s += `<path d="${spurs}" stroke="url(#${gSp})" stroke-width="${n(R * 0.09)}" stroke-linecap="round" fill="none"/>`;
      // sepals: five pointed blades, spreading
      for (let i = 0; i < 5; i++) {
        const t = (i / 5) * Math.PI * 2 + (o.twist || 0);
        const ct = Math.cos(t), st = Math.sin(t);
        const pt = (rr, ww, zz) => at(rr * ct - ww * st, rr * st + ww * ct, zz);
        const pts = [pt(0.1, 0, 0), pt(0.4, -0.2, -0.04), pt(0.75, -0.17, -0.1), pt(1.0, 0, -0.16), pt(0.75, 0.17, -0.1), pt(0.4, 0.2, -0.04)];
        s += `<path d="${smooth(pts, true, 0.9)}" fill="url(#${gS})"/>`;
        const mid = [pt(0.15, 0, 0), pt(0.85, 0, -0.12)];
        s += `<path d="${lineOf(mid)}" stroke="#4C4FC0" stroke-opacity="0.35" stroke-width="${n(R * 0.025)}"/>`;
      }
      // petals: a white cup in front, between the sepals
      for (let i = 0; i < 5; i++) {
        const t = (i / 5) * Math.PI * 2 + Math.PI / 5 + (o.twist || 0);
        const ct = Math.cos(t), st = Math.sin(t);
        const pt = (rr, ww, zz) => at(rr * ct - ww * st, rr * st + ww * ct, zz);
        const pts = [pt(0.08, 0, 0.05), pt(0.28, -0.2, 0.16), pt(0.52, -0.16, 0.3), pt(0.58, 0, 0.33), pt(0.52, 0.16, 0.3), pt(0.28, 0.2, 0.16)];
        s += `<path d="${smooth(pts, true, 0.9)}" fill="url(#${gP})" stroke="#BDB8E8" stroke-width="${n(R * 0.012)}" stroke-opacity="0.6"/>`;
      }
      // stamens
      const rr2 = rng(o.seed || 1);
      let dots = '';
      for (let i = 0; i < 16; i++) {
        const a = rr2() * Math.PI * 2, d = rr2() * 0.13;
        const p = at(d * Math.cos(a), d * Math.sin(a), 0.25 + rr2() * 0.12);
        dots += `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="${n(R * 0.035)}"/>`;
      }
      s += `<g fill="#F4C64E">${dots}</g>`;
      const c0 = at(0, 0, 0.3);
      s += `<circle cx="${n(c0[0])}" cy="${n(c0[1])}" r="${n(R * 0.05)}" fill="#E39A32"/>`;
      return { defs, svg: s };
    }
    function leafCluster(x, y, s, rot, col, light) {
      // ternate columbine foliage: three rounded, three-lobed leaflets
      let out = `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})">`;
      const leaflet = (ang, L) => {
        const t = `rotate(${ang})`;
        return `<g transform="${t}"><path d="M0 0L0 ${-L * 0.4}" stroke="${col}" stroke-width="3"/>` +
          `<path d="M0 ${-L * 0.35}C${-L * 0.5} ${-L * 0.45} ${-L * 0.6} ${-L * 0.85} ${-L * 0.3} ${-L * 0.95}C${-L * 0.22} ${-L * 1.1} ${-L * 0.05} ${-L * 1.05} 0 ${-L * 0.98}C${L * 0.05} ${-L * 1.08} ${L * 0.25} ${-L * 1.1} ${L * 0.3} ${-L * 0.95}C${L * 0.6} ${-L * 0.85} ${L * 0.5} ${-L * 0.45} 0 ${-L * 0.35}Z" fill="${col}"/>` +
          `<path d="M0 ${-L * 0.4}L0 ${-L * 0.9}M0 ${-L * 0.55}L${-L * 0.22} ${-L * 0.82}M0 ${-L * 0.55}L${L * 0.22} ${-L * 0.82}" stroke="${light}" stroke-width="1.6" stroke-opacity="0.7"/>` +
          `<path d="M${-L * 0.3} ${-L * 0.93}C${-L * 0.15} ${-L * 1.03} ${-L * 0.05} ${-L * 1.0} 0 ${-L * 0.96}" stroke="${light}" stroke-width="2.2" fill="none" stroke-opacity="0.8"/></g>`;
      };
      out += leaflet(-48, 46) + leaflet(0, 56) + leaflet(48, 46) + '</g>';
      return out;
    }
    function columbinePatch(o) {
      const r = rng(o.seed);
      let defs = '', stems = '', leaves = '', flowers = '';
      for (let i = 0; i < o.leaves; i++) {
        const x = o.x0 + r() * (o.x1 - o.x0), y = o.yAt(x) - r() * o.leafH;
        leaves += leafCluster(x, y, 0.7 + r() * 0.6, (r() - 0.5) * 120, r() < 0.5 ? '#3E7F78' : '#5C968A', '#A9CDBE');
      }
      for (const f of o.flowers) {
        const [fx, fy, R, yaw, pitch, roll] = f;
        const bx = fx + (r() - 0.5) * 60, by = k.H + 20;
        stems += `M${n(bx)} ${n(by)}Q${n((bx + fx) / 2 + (r() - 0.5) * 60)} ${n((by + fy) / 2)} ${n(fx)} ${n(fy + R * 0.2)}`;
        const c = columbine(fx, fy, R, { yaw, pitch, roll, seed: Math.round(fx + fy), twist: r() });
        defs += c.defs; flowers += c.svg;
      }
      // buds
      for (const [bx, by, br] of o.buds || []) {
        stems += `M${n(bx)} ${n(k.H + 20)}Q${n(bx + 20)} ${n((by + k.H) / 2)} ${n(bx)} ${n(by)}`;
        flowers += `<path d="M${n(bx)} ${n(by)}c${n(-br)} ${n(-br * 0.4)} ${n(-br * 0.8)} ${n(-br * 1.6)} 0 ${n(-br * 2.1)}c${n(br * 0.8)} ${n(br * 0.5)} ${n(br)} ${n(br * 1.7)} 0 ${n(br * 2.1)}Z" fill="#6B70D6"/>`;
        flowers += `<path d="M${n(bx)} ${n(by - br * 2.1)}q${n(br * 0.6)} ${n(-br * 0.8)} ${n(br * 0.2)} ${n(-br * 1.6)}" stroke="#5B5FCB" stroke-width="${n(br * 0.3)}" fill="none" stroke-linecap="round"/>`;
      }
      return { defs, svg: `<path d="${stems}" stroke="#3B746C" stroke-width="4" fill="none" stroke-linecap="round"/>${leaves}${flowers}` };
    }
    // left ledge
    {
      const pts = [[-40, 1210], [120, 1250], [300, 1330], [470, 1440], [560, 1600], [-40, 1600]];
      parts.push(ledge(pts, { x0: 0, y0: 1210, x1: 200, y1: 1600 }));
      parts.push({ svg: `<path d="M-40 1210C80 1236 210 1290 300 1330C380 1370 440 1410 470 1440" stroke="#FCEDE4" stroke-width="5" fill="none" stroke-opacity="0.85"/>` });
      parts.push(columbinePatch({
        seed: 15, x0: -20, x1: 430, yAt: (x) => 1300 + x * 0.35, leafH: 160, leaves: 26,
        flowers: [[90, 1150, 74, 0.25, 0.25, 0.1], [250, 1225, 62, -0.3, 0.35, -0.2], [40, 1330, 58, 0.5, 0.1, 0.3], [370, 1330, 52, -0.5, 0.4, 0.1], [180, 1390, 66, 0.1, -0.15, 0.2], [320, 1470, 50, -0.2, 0.2, 0]],
        buds: [[150, 1080, 13], [300, 1170, 11]],
      }));
    }
    // right ledge
    {
      const pts = [[1640, 1620], [1700, 1450], [1820, 1360], [1980, 1300], [2120, 1280], [2120, 1620]];
      parts.push(ledge(pts, { x0: 2080, y0: 1280, x1: 1880, y1: 1620 }));
      parts.push({ svg: `<path d="M1700 1450C1740 1400 1800 1366 1880 1336C1960 1308 2040 1290 2120 1282" stroke="#FCEDE4" stroke-width="5" fill="none" stroke-opacity="0.85"/>` });
      parts.push(columbinePatch({
        seed: 27, x0: 1660, x1: 2100, yAt: (x) => 1500 - (x - 1660) * 0.4, leafH: 150, leaves: 24,
        flowers: [[1990, 1170, 72, -0.3, 0.3, -0.1], [1830, 1260, 60, 0.35, 0.3, 0.2], [2060, 1320, 56, -0.6, 0.15, -0.3], [1730, 1380, 54, 0.4, 0.4, 0.1], [1900, 1420, 64, -0.1, -0.1, 0]],
        buds: [[1930, 1100, 12], [1780, 1190, 11]],
      }));
    }

    return k.spread(parts, { grain: 0.6 });
  },
};
