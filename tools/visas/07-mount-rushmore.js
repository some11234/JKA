/* Visa pages 13–14 — the Black Hills, South Dakota.
   Left: the Needles of the Black Hills — the Cathedral Spires and the slotted
   Needle's Eye, granite fingers stacked block on block and lit warm from the
   left — rising out of a ponderosa pine forest, with Black Elk Peak and its
   stone fire lookout far off and a creek winding down over granite boulders.
   Right: Mount Rushmore — Washington, Jefferson, Theodore Roosevelt and
   Lincoln carved in the pale granite, lit from the left, the talus of blasted
   rock below and ponderosas climbing the ridge. Pasqueflowers (South Dakota's
   flower) frame the bottom corners. Quote (live text, see
   js/passport-data.js): John F. Kennedy, "...pay any price, bear any burden,
   meet any hardship...". */

'use strict';

module.exports = {
  pages: [13, 14],
  svg(k) {
    const { n, rng } = k;
    const parts = [];

    // ---- helpers -----------------------------------------------------------------------
    // userSpaceOnUse gradients (coordinates in the referencing element's space).
    function stopsOf(stops) {
      return stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('');
    }
    function lgU(gid, x1, y1, x2, y2, stops) {
      return `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stopsOf(stops)}</linearGradient>`;
    }
    function rgU(gid, cx, cy, r, stops) {
      return `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}">${stopsOf(stops)}</radialGradient>`;
    }
    // objectBoundingBox gradients: fill any shape with a soft blob or a ramp.
    function lgB(gid, x1, y1, x2, y2, stops) {
      return `<linearGradient id="${gid}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stopsOf(stops)}</linearGradient>`;
    }
    function rgB(gid, stops) {
      return `<radialGradient id="${gid}" cx="0.5" cy="0.5" r="0.5">${stopsOf(stops)}</radialGradient>`;
    }
    function poly(pts) { return 'M' + pts.map((p) => n(p[0]) + ' ' + n(p[1])).join('L') + 'Z'; }
    // Smooth Catmull-Rom curve through points.
    function curve(pts, closed) {
      const N = pts.length;
      let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
      const at = (i) => (closed ? pts[(i + N) % N] : pts[Math.max(0, Math.min(N - 1, i))]);
      for (let i = 0; i < (closed ? N : N - 1); i++) {
        const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
        d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
      }
      return d + (closed ? 'Z' : '');
    }
    const P = (d, fill, op) => `<path d="${d}" fill="${fill}"${op != null && op !== 1 ? ` fill-opacity="${op}"` : ''}/>`;
    const S = (d, col, w, op) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}"${op != null && op !== 1 ? ` stroke-opacity="${op}"` : ''} stroke-linecap="round" stroke-linejoin="round"/>`;
    const E = (cx, cy, rx, ry, fill, op, rot) => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}"${op != null && op !== 1 ? ` fill-opacity="${op}"` : ''}${rot ? ` transform="rotate(${n(rot)} ${n(cx)} ${n(cy)})"` : ''}/>`;
    // A wobbly blob (rocks, foliage).
    function blob(cx, cy, rx, ry, seed, wob, m) {
      const r = rng(seed);
      const pts = [];
      const cnt = m || 9;
      const w = wob == null ? 0.15 : wob;
      for (let i = 0; i < cnt; i++) {
        const a = (i / cnt) * Math.PI * 2;
        const rr = 1 - w + r() * w * 2;
        pts.push([cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr]);
      }
      return curve(pts, true);
    }

    // Granite, lit from the left: warm cream planes, lavender-grey body,
    // violet shadows and blue-violet clefts.
    const G = {
      L0: '#FFF2E6', L1: '#F7DECC', L2: '#ECD3C9', M1: '#DACCDD', M2: '#C4B7D5',
      S1: '#A69BCA', S2: '#837AB8', S3: '#5F58A2', S4: '#433F88', RIM: '#FFD6AE',
    };
    // soft volumes: shaded and lit blobs, side ramps (stippled by the grain)
    const softS = k.id('softS'), softL = k.id('softL'), softW = k.id('softW'), softD = k.id('softD');
    const rampR = k.id('rampR'), rampD = k.id('rampD'), rampL = k.id('rampL');
    parts.push({
      defs:
        rgB(softS, [[0, G.S2, 0.7], [0.55, G.S2, 0.38], [1, G.S2, 0]]) +
        rgB(softD, [[0, G.S4, 0.8], [0.5, G.S3, 0.45], [1, G.S3, 0]]) +
        rgB(softL, [[0, G.L0, 0.95], [0.55, G.L0, 0.45], [1, G.L0, 0]]) +
        rgB(softW, [[0, '#FFD9B8', 0.8], [0.55, '#FFE0C4', 0.35], [1, '#FFE0C4', 0]]) +
        lgB(rampR, 0, 0, 1, 0, [[0, G.S2, 0], [0.45, G.S2, 0.35], [1, G.S3, 0.75]]) +
        lgB(rampL, 0, 0, 1, 0, [[0, G.L0, 0.85], [0.6, G.L0, 0.3], [1, G.L0, 0]]) +
        lgB(rampD, 0, 0, 0, 1, [[0, G.S3, 0.75], [0.5, G.S2, 0.3], [1, G.S2, 0]]),
    });
    const shade = (cx, cy, rx, ry, op, rot) => E(cx, cy, rx, ry, `url(#${softS})`, op, rot);
    const deep = (cx, cy, rx, ry, op, rot) => E(cx, cy, rx, ry, `url(#${softD})`, op, rot);
    const light = (cx, cy, rx, ry, op, rot) => E(cx, cy, rx, ry, `url(#${softL})`, op, rot);
    const warm = (cx, cy, rx, ry, op, rot) => E(cx, cy, rx, ry, `url(#${softW})`, op, rot);

    // ---- sky, security print -----------------------------------------------------------
    const SKY = [[0, '#B6C8EE'], [0.2, '#C3D0F2'], [0.4, '#D5D9F3'], [0.54, '#E4DDF1'], [0.66, '#F1E1E6'], [1, '#F7E4DA']];
    parts.push(k.sky(SKY));
    {
      // warm morning light pouring in from the left
      const wg = k.id('warm');
      parts.push({
        defs: rgU(wg, -160, 700, 1100, [[0, '#FFE6CC', 0.9], [0.4, '#FCE0D0', 0.4], [1, '#F8DDD6', 0]]),
        svg: `<rect width="${k.W}" height="${k.H}" fill="url(#${wg})"/>`,
      });
    }
    parts.push(k.microtext('Black Hills', { y0: 30, y1: 960, opacity: 0.05 }));
    parts.push(k.guilloche({ y0: 110, y1: 860, lines: 22, opacity: 0.06, amp: 16, period: 700, phase: 2.1 }));

    // Glory and rosette behind the carving.
    const GX = 1610, GY = 600;
    {
      const gg = k.id('glory');
      parts.push({
        defs: k.radial(gg, '50%', '50%', '50%', [[0, '#FFFFFF', 0.7], [0.4, '#F4F1FB', 0.4], [1, '#E8E6F6', 0]]),
        svg: `<circle cx="${GX}" cy="${GY}" r="640" fill="url(#${gg})"/>` +
          k.sunburst(GX, GY, 300, 900, 48, '#FFFFFF', 0.14) +
          k.rosette(GX, GY, 430, { opacity: 0.07, rings: 9, lobes: 32 }),
      });
    }

    // Clouds and birds.
    parts.push({
      svg: k.cloud(150, 600, 30, '#FFFFFF', 0.5) + k.cloud(300, 640, 20, '#FFF8F2', 0.45) +
        k.cloud(880, 470, 24, '#FFFFFF', 0.45) + k.cloud(2010, 660, 22, '#FFFFFF', 0.4) +
        k.bird(800, 560, 15, '#6E67B0') + k.bird(846, 538, 11, '#6E67B0') + k.bird(1170, 380, 12, '#6E67B0') +
        k.bird(1210, 400, 9, '#6E67B0'),
    });

    // ---- distant hills -------------------------------------------------------------------
    // A forested ridge edge: a hill line with a fringe of rounded pine tips;
    // optional lit left edges on the tips.
    function forestRidge(o) {
      const r = rng(o.seed);
      let d = `M${o.x0} ${k.H + 20}L${o.x0} ${n(o.base(o.x0))}`;
      let hl = '';
      for (let x = o.x0; x <= o.x1; x += o.step * (0.55 + r() * 0.7)) {
        const b = o.base(x);
        const th = o.h * (0.45 + r() * 0.75);
        const w = o.step * (0.8 + r() * 0.4);
        d += `L${n(x - w / 2)} ${n(b - th * 0.15)}L${n(x - w * 0.24)} ${n(b - th * 0.72)}Q${n(x)} ${n(b - th * 1.1)} ${n(x + w * 0.24)} ${n(b - th * 0.72)}L${n(x + w / 2)} ${n(b - th * 0.15)}`;
        if (o.hl) hl += `M${n(x - w * 0.06)} ${n(b - th * 0.95)}Q${n(x - w * 0.22)} ${n(b - th * 0.75)} ${n(x - w * 0.36)} ${n(b - th * 0.3)}`;
      }
      d += `L${o.x1} ${n(o.base(o.x1))}L${o.x1} ${k.H + 20}Z`;
      return o.hl ? { d, hl } : d;
    }
    const hill = (peaks, y0, wob) => (x) => {
      let y = y0;
      for (const p of peaks) {
        const dx = (x - p[0]) / p[2];
        y -= p[1] * Math.max(0, 1 - dx * dx) ** 1.2;
      }
      return y + (wob == null ? 1 : wob) * (6 * Math.sin(x / 37) + 4 * Math.sin(x / 13));
    };

    // Far range with Black Elk Peak and its stone fire lookout (left page).
    {
      const far = k.id('far'), far2 = k.id('far2');
      const b1 = hill([[160, 110, 380], [760, 120, 300], [1100, 80, 260], [1960, 110, 420]], 960);
      const b2 = hill([[60, 60, 260], [460, 80, 300], [900, 70, 260], [1500, 60, 400], [2000, 70, 300]], 1012);
      const PX = 812, PY = 760;
      let pk = '';
      pk += `<path d="M${PX - 110} 880C${PX - 80} 830 ${PX - 44} ${PY + 16} ${PX - 14} ${PY + 4}L${PX + 16} ${PY + 2}C${PX + 48} ${PY + 14} ${PX + 86} 830 ${PX + 120} 890Z" fill="#C3BCE0"/>`;
      pk += `<path d="M${PX - 14} ${PY + 4}C${PX - 36} ${PY + 30} ${PX - 56} ${PY + 62} ${PX - 76} 880L${PX - 110} 880C${PX - 80} 830 ${PX - 44} ${PY + 16} ${PX - 14} ${PY + 4}Z" fill="#EAD9DE" fill-opacity="0.9"/>`;
      pk += `<path d="M${PX + 16} ${PY + 2}C${PX + 26} ${PY + 30} ${PX + 30} ${PY + 60} ${PX + 22} 880L${PX + 120} 890C${PX + 86} 830 ${PX + 48} ${PY + 14} ${PX + 16} ${PY + 2}Z" fill="#AFA7D6" fill-opacity="0.7"/>`;
      // the lookout: a little stone tower with a hipped cap
      pk += `<rect x="${PX - 8}" y="${PY - 18}" width="16" height="22" fill="#B3AAD5"/><rect x="${PX - 8}" y="${PY - 18}" width="7" height="22" fill="#F0DFE0"/>`;
      pk += `<path d="M${PX - 11} ${PY - 18}L${PX} ${PY - 27}L${PX + 11} ${PY - 18}Z" fill="#9D93C6"/><rect x="${PX - 3}" y="${PY - 13}" width="5" height="6" fill="#857CBB"/>`;
      parts.push({
        defs: k.linear(far, 90, [[0, '#BDB9E2'], [1, '#D8D0EB']]) + k.linear(far2, 90, [[0, '#A8A9DC'], [1, '#C6C2E6']]),
        svg: pk +
          `<path d="${forestRidge({ x0: -20, x1: k.W + 20, base: b1, h: 16, step: 11, seed: 11 })}" fill="url(#${far})"/>` +
          `<path d="${forestRidge({ x0: -20, x1: k.W + 20, base: b2, h: 22, step: 14, seed: 12 })}" fill="url(#${far2})"/>`,
      });
    }
    parts.push(k.haze(930, 170, '#F7E6E6', 0.5));

    // ---- Mount Rushmore: the massif -----------------------------------------------------------
    const MT = [[1060, 1100], [1078, 960], [1094, 860], [1108, 780], [1124, 708], [1144, 640], [1164, 580], [1184, 530],
      [1206, 488], [1232, 452], [1258, 426], [1288, 408], [1324, 398], [1362, 392], [1398, 380], [1434, 362],
      [1470, 346], [1512, 334], [1556, 326], [1600, 322], [1644, 324], [1688, 332], [1726, 344], [1760, 360],
      [1792, 378], [1826, 392], [1866, 402], [1910, 410], [1956, 422], [2000, 438], [2044, 452], [2100, 466], [2100, 1100]];
    const mtD = curve(MT.slice(0, -1), false) + 'L2100 1100Z';
    const mtClip = k.id('mtclip');
    {
      const rockG = k.id('rock'), rockV = k.id('rockv');
      let m = P(mtD, `url(#${rockG})`) + P(mtD, `url(#${rockV})`);
      // the sunlit left flank, falling away in vertical fins
      m += P('M1060 1100L1078 960L1094 860L1108 780L1124 708L1144 640L1164 580L1184 530L1206 488L1232 452L1258 426C1226 478 1204 548 1190 630C1176 720 1166 840 1160 1100Z', G.L1, 0.85);
      m += P('M1078 960L1094 860L1108 780L1124 708L1144 640L1164 580L1184 530L1206 488L1232 452C1210 500 1190 560 1176 630C1160 720 1148 840 1140 1100L1060 1100Z', G.L0, 0.6);
      const rf = rng(321);
      let fins = '', finsL = '';
      for (let i = 0; i < 9; i++) {
        const x = 1100 + i * 13 + rf() * 6, y = 640 + i * 26 + rf() * 40;
        fins += `M${n(x + 8)} ${n(y)}C${n(x + 4)} ${n(y + 120)} ${n(x + 2)} ${n(y + 240)} ${n(x - 4)} 1100`;
        finsL += `M${n(x + 2)} ${n(y + 10)}C${n(x - 2)} ${n(y + 120)} ${n(x - 4)} ${n(y + 240)} ${n(x - 10)} 1100`;
      }
      m += S(fins, G.S1, 3, 0.45) + S(finsL, G.L0, 2.4, 0.6);
      // blocky summit outcrops catching the light
      const tops = [[1452, 352, 60, 24], [1530, 330, 74, 22], [1612, 326, 70, 20], [1690, 338, 56, 22], [1350, 396, 50, 16]];
      for (const [x, y, w, h] of tops) {
        m += P(`M${x - w / 2} ${y + h}C${x - w / 2} ${y + h * 0.2} ${x - w * 0.3} ${y - 2} ${x} ${y - 2}C${x + w * 0.35} ${y - 2} ${x + w / 2} ${y + h * 0.3} ${x + w / 2} ${y + h}Z`, G.M1, 0.9);
        m += P(`M${x - w / 2} ${y + h}C${x - w / 2} ${y + h * 0.2} ${x - w * 0.3} ${y - 2} ${x} ${y - 2}C${x - w * 0.12} ${y + h * 0.3} ${x - w * 0.2} ${y + h * 0.6} ${x - w * 0.1} ${y + h}Z`, G.L1, 0.9);
        m += S(`M${x - w / 2} ${y + h + 2}H${x + w / 2}`, G.S2, 3, 0.4);
      }
      // vertical joints and sheeting all over the rock (behind the heads)
      const rj = rng(4040);
      let cracks = '', cl = '';
      for (let i = 0; i < 40; i++) {
        const x = 1150 + rj() * 940, y = 380 + rj() * 640, L = 50 + rj() * 160;
        const dx = (rj() - 0.5) * 24;
        cracks += `M${n(x)} ${n(y)}q${n(dx * 0.4)} ${n(L * 0.5)} ${n(dx)} ${n(L)}`;
        cl += `M${n(x - 3)} ${n(y + 4)}q${n(dx * 0.4)} ${n(L * 0.5)} ${n(dx)} ${n(L - 6)}`;
      }
      m += `<g clip-path="url(#${mtClip})">${S(cracks, G.S2, 2.4, 0.35)}${S(cl, G.L0, 1.8, 0.35)}</g>`;
      // granite speckle
      const rs = rng(5150);
      let sp = '', sl = '';
      for (let i = 0; i < 1600; i++) {
        const x = 1060 + rs() * 1040, y = 320 + rs() * 780;
        const rr = 0.9 + rs() * 1.6;
        if (rs() < 0.6) sp += `M${n(x)} ${n(y)}h${n(rr)}v${n(rr)}h${n(-rr)}Z`;
        else sl += `M${n(x)} ${n(y)}h${n(rr)}v${n(rr)}h${n(-rr)}Z`;
      }
      m += `<g clip-path="url(#${mtClip})">${P(sp, G.S3, 0.25)}${P(sl, '#FFFFFF', 0.4)}</g>`;
      parts.push({
        defs: lgU(rockG, 1080, 0, 2080, 0, [[0, '#E8D5D3'], [0.2, '#D6CADC'], [0.55, '#C7BCD8'], [1, '#B0A7D1']]) +
          lgU(rockV, 0, 320, 0, 1100, [[0, '#FFF4EA', 0.4], [0.35, '#FFFFFF', 0], [0.8, '#8E86C0', 0.12], [1, '#8E86C0', 0.3]]) +
          `<clipPath id="${mtClip}"><path d="${mtD}"/></clipPath>`,
        svg: m,
      });
    }

    // ---- the four faces ---------------------------------------------------------------------
    // Each head is drawn in its own frame: origin between the eyes, y down,
    // eye-line to chin ≈ 170 units. Each is one granite silhouette, modelled
    // with soft stippled volumes (the grain turns every soft blob into
    // stipple) and a few crisp carved accents.
    const headG = k.id('head'), headR = k.id('headR'), hairG = k.id('hair'), hairR = k.id('hairR'), neckG = k.id('neck');
    parts.push({
      defs:
        lgU(headG, -110, 0, 150, 0, [[0, G.L1], [0.28, G.L2], [0.6, G.M1], [0.85, G.M2], [1, G.S1]]) +
        lgU(headR, -110, 0, 150, 0, [[0, '#E9D3D0'], [0.35, '#D5C8DB'], [0.7, '#BDB2D3'], [1, '#9D93C6']]) +
        lgU(hairG, -110, 0, 150, 0, [[0, '#E4D1D3'], [0.4, '#D1C5DA'], [0.8, '#B9AFD3'], [1, '#A097C8']]) +
        lgU(hairR, -110, 0, 150, 0, [[0, '#D8C8D5'], [0.5, '#BEB3D3'], [1, '#958CC2']]) +
        lgU(neckG, -80, 0, 80, 0, [[0, G.M1], [0.5, G.S1], [1, G.S2]]),
    });

    // An eye as Borglum carved it: a lit eyeball under a shadowed lid, and a
    // pupil cut as a hollow with a granite peg left in it to catch the light.
    function eye(cx, cy, w, h, o) {
      o = Object.assign({ sock: 0.9, ball: G.L2, lid: G.S4, look: -0.1, dark: false }, o || {});
      let s = '';
      s += shade(cx + w * 0.04, cy - h * 0.2, w * 0.95, h * 2.1, o.sock);
      const up = `M${n(cx - w / 2)} ${n(cy)}Q${n(cx - w * 0.05)} ${n(cy - h * 1.05)} ${n(cx + w / 2)} ${n(cy - h * 0.05)}`;
      s += P(`${up}Q${n(cx)} ${n(cy + h * 0.75)} ${n(cx - w / 2)} ${n(cy)}Z`, o.ball);
      s += P(`${up}Q${n(cx)} ${n(cy - h * 0.35)} ${n(cx - w / 2)} ${n(cy)}Z`, G.S2, 0.7);
      const px = cx + o.look * w, py = cy - h * 0.12, pr = h * 0.42;
      s += `<circle cx="${n(px)}" cy="${n(py)}" r="${n(pr)}" fill="${G.S3}" fill-opacity="0.9"/>`;
      s += `<circle cx="${n(px - pr * 0.2)}" cy="${n(py - pr * 0.15)}" r="${n(pr * 0.42)}" fill="${o.dark ? G.M1 : G.L0}"/>`;
      s += S(up, o.lid, Math.max(2.4, h * 0.26), 0.95);
      s += S(`M${n(cx - w * 0.42)} ${n(cy - h * 0.62)}Q${n(cx)} ${n(cy - h * 1.6)} ${n(cx + w * 0.48)} ${n(cy - h * 0.5)}`, G.S2, 2.2, 0.5);
      s += S(`M${n(cx - w * 0.36)} ${n(cy + h * 0.5)}Q${n(cx)} ${n(cy + h * 0.95)} ${n(cx + w * 0.36)} ${n(cy + h * 0.45)}`, o.dark ? G.M1 : G.L0, 2.2, 0.7);
      return s;
    }
    // Hair or wig grooves: a dark cut with a lit lip just above-left of it.
    function grooves(d, op) {
      return S(d, G.S2, 3.2, 0.42 * (op || 1)) + `<g transform="translate(-2.5 -2.5)">${S(d, G.L0, 2, 0.45 * (op || 1))}</g>`;
    }

    // WASHINGTON — foremost and largest, near-frontal, a touch to the left;
    // the wig swept back into rolls over the ears; coat collar and lapels
    // roughed out below.
    function washington() {
      let s = '';
      // neck and coat
      s += P('M-72 150C-76 196 -74 232 -80 266L66 266C64 230 62 196 60 150Z', `url(#${neckG})`);
      s += deep(-8, 186, 72, 26, 0.95);
      s += P('M-76 224C-120 228 -172 256 -216 306C-206 336 -190 358 -170 378C-144 336 -112 298 -78 268Z', G.L1);
      s += P('M-78 268C-112 298 -144 336 -170 378C-134 396 -92 406 -48 410C-54 364 -64 316 -78 268Z', G.M1);
      s += S('M-76 224C-120 228 -172 256 -216 306', G.RIM, 4, 0.85);
      s += S('M-78 268C-112 298 -144 336 -170 378', G.S2, 4, 0.55);
      s += P('M-50 254C-26 272 10 272 38 254L48 334C16 356 -18 356 -50 334Z', G.L2, 0.95);
      s += S('M-40 284C-16 296 16 296 40 284M-44 314C-16 326 18 326 44 312', G.S1, 2.6, 0.55);
      s += shade(0, 262, 60, 16, 0.8);
      s += P('M62 224C102 230 148 260 180 306C170 336 154 360 138 378C120 338 92 300 64 268Z', G.S1);
      s += P('M64 268C92 300 120 338 138 378C106 398 76 406 46 410C50 362 56 316 64 268Z', G.S2, 0.85);
      // head silhouette
      const head = 'M-80 250L-84 172C-98 142 -106 110 -108 76C-112 36 -114 -4 -110 -44C-106 -102 -80 -150 -28 -170C24 -188 84 -176 120 -140C144 -112 154 -60 152 -8C150 42 140 92 120 132C104 162 86 196 76 250Z';
      s += P(head, `url(#${headG})`);
      // wig: swept back over the crown and down the right side into rolls
      const wig = 'M-110 -44C-106 -102 -80 -150 -28 -170C24 -188 84 -176 120 -140C144 -112 154 -60 152 -8C150 42 140 92 120 132L98 126C102 90 100 50 94 18C90 -14 88 -50 82 -76C68 -108 32 -126 -10 -126C-52 -124 -86 -98 -98 -58C-102 -52 -106 -48 -110 -44Z';
      s += P(wig, `url(#${hairG})`);
      s += grooves('M-80 -112C-48 -150 6 -166 58 -152M-96 -76C-88 -124 -48 -156 4 -164M-30 -140C16 -156 76 -142 108 -104M34 -132C78 -124 112 -94 128 -50M70 -98C102 -84 126 -50 134 -10');
      s += S('M-104 -60C-96 -110 -64 -150 -14 -166', G.RIM, 3.5, 0.8);
      // the hairline casts a soft shadow onto the forehead
      s += S('M-96 -56C-84 -96 -50 -122 -10 -124C30 -124 66 -106 80 -76', G.S2, 6, 0.25);
      // rolls of the wig over the ear
      for (const [y, sc] of [[-34, 1], [6, 1.05], [48, 1]]) {
        const d = `M${94} ${y}C${108} ${y - 16 * sc} ${138} ${y - 16 * sc} ${150} ${y - 2}C${146} ${y + 16 * sc} ${114} ${y + 22 * sc} ${94} ${y + 10}Z`;
        s += P(d, G.M2);
        s += S(`M${100} ${y - 4}C${112} ${y - 14} ${130} ${y - 14} ${142} ${y - 6}`, G.L1, 3, 0.8);
        s += S(`M${98} ${y + 12}C${116} ${y + 20} ${138} ${y + 16} ${148} ${y + 4}`, G.S3, 3, 0.6);
      }
      s += shade(96, 30, 18, 70, 0.7);
      // forehead and temples
      s += light(-34, -72, 74, 44, 0.95, -8);
      s += warm(-70, -40, 40, 50, 0.6);
      s += shade(80, -40, 26, 50, 0.55);
      // brow ridges and the eye sockets
      s += P('M-86 -26C-70 -42 -36 -44 -14 -30C-36 -34 -64 -30 -86 -20Z', G.L0, 0.95);
      s += P('M0 -30C22 -44 58 -42 76 -24C56 -32 26 -34 0 -26Z', G.L1, 0.75);
      s += shade(-6, -10, 12, 18, 0.55);
      s += eye(-44, 6, 42, 15);
      s += eye(32, 7, 44, 15, { ball: G.M1, sock: 1, dark: true });
      // nose: lit left plane, shaded right plane, cast shadow on the cheek
      s += P('M2 0C14 30 26 58 34 86C26 94 16 96 8 94C16 68 10 38 -2 0Z', G.S2, 0.3);
      s += P('M-8 -16C-4 14 4 44 14 72C8 82 -2 86 -14 84C-12 52 -10 18 -14 -16Z', `url(#${rampR})`);
      s += P('M-16 -18C-20 10 -24 40 -30 72L-16 78C-12 50 -10 18 -8 -18Z', G.L0, 0.9);
      s += E(-14, 76, 15, 11, G.L1);
      s += E(-19, 71, 6, 4, G.L0);
      s += P('M-36 72C-46 78 -44 92 -32 92C-36 86 -36 80 -36 72Z', G.L2);
      s += P('M10 70C24 72 26 88 12 92C14 84 14 78 10 70Z', G.S2, 0.85);
      s += P('M-34 90C-20 98 2 98 14 90C6 104 -22 106 -34 90Z', G.S3, 0.85);
      s += E(-24, 92, 6, 2.6, G.S4, 0.8) + E(2, 92, 6, 2.6, G.S4, 0.8);
      // cheeks and the folds beside the mouth
      s += light(-76, 40, 24, 42, 0.8);
      s += shade(64, 56, 42, 66, 0.65);
      s += shade(-66, 90, 18, 26, 0.35);
      s += S('M-38 90C-52 102 -56 120 -50 136', G.S2, 3, 0.45);
      s += S('M18 92C34 106 40 122 34 138', G.S3, 3, 0.45);
      s += shade(-10, 104, 12, 8, 0.5);
      // mouth: the set, determined line
      s += P('M-48 116C-30 106 -12 108 -6 110C2 108 20 106 34 116C12 118 -24 118 -48 116Z', G.S2, 0.7);
      s += S('M-50 118C-28 121 12 121 36 117', G.S4, 4, 0.9);
      s += S('M-50 118l-5 6M36 117l5 6', G.S3, 2.6, 0.6);
      s += P('M-40 122C-20 132 10 132 28 122C10 127 -20 127 -40 122Z', G.L0, 0.9);
      s += shade(-6, 138, 34, 9, 0.85);
      // the chin, and the jaw turning into shadow
      s += light(-12, 156, 34, 17, 0.9);
      s += S('M-44 172C-22 180 10 180 32 168', G.S3, 4, 0.45);
      s += P('M92 64C88 112 70 150 42 174C74 162 100 122 108 72Z', G.S2, 0.55);
      s += S('M-106 70C-112 30 -114 -10 -110 -44', G.RIM, 3.5, 0.8);
      s += S('M-104 80C-100 120 -92 150 -80 172', G.RIM, 3, 0.6);
      return s;
    }

    // JEFFERSON — set back to the right of Washington, turned three-quarters
    // to the left and lifting his gaze; hair swept back into the rock.
    function jefferson() {
      let s = '';
      s += P('M-74 140C-78 190 -76 220 -82 250L60 250C58 210 56 170 52 130Z', `url(#${neckG})`);
      s += deep(-20, 170, 70, 24, 0.9);
      const head = 'M-76 250L-80 172C-90 162 -96 148 -94 134C-100 126 -98 118 -94 112C-98 106 -98 100 -94 94C-98 90 -104 86 -108 78C-112 70 -108 60 -104 48C-100 34 -96 22 -94 10C-98 2 -102 -8 -104 -20C-106 -62 -92 -112 -52 -142C-10 -170 62 -172 108 -142C140 -118 156 -64 152 -6C148 54 134 104 112 146C94 178 76 212 68 250Z';
      s += P(head, `url(#${headG})`);
      const hair = 'M-104 -20C-106 -62 -92 -112 -52 -142C-10 -170 62 -172 108 -142C140 -118 156 -64 152 -6C148 54 134 104 112 146L84 140C80 100 76 60 72 24C68 -16 64 -56 52 -86C34 -112 0 -124 -40 -120C-66 -112 -84 -90 -94 -60C-98 -44 -102 -30 -104 -20Z';
      s += P(hair, `url(#${hairG})`);
      s += grooves('M-60 -128C-20 -152 40 -156 88 -134M-84 -86C-60 -128 -10 -146 40 -146M0 -126C50 -132 100 -104 124 -62M48 -100C92 -88 126 -46 134 4M70 -40C100 -16 116 30 116 80M86 30C100 60 104 100 98 130');
      s += S('M-100 -40C-96 -90 -72 -126 -34 -144', G.RIM, 3.5, 0.75);
      s += S('M-94 -60C-84 -90 -66 -112 -40 -120C0 -124 34 -112 52 -86', G.S2, 6, 0.22);
      s += shade(84, 40, 22, 90, 0.6);
      s += light(-46, -74, 54, 40, 0.95, -10);
      s += warm(-90, -30, 26, 44, 0.6);
      // brow, eyes
      s += P('M-104 -24C-92 -38 -70 -40 -56 -30C-72 -32 -90 -28 -104 -18Z', G.L0, 0.95);
      s += P('M-40 -32C-18 -44 18 -42 34 -26C14 -34 -12 -34 -40 -28Z', G.L1, 0.75);
      s += eye(-74, 6, 24, 11, { look: -0.15 });
      s += eye(-6, 6, 40, 14, { ball: G.M1, sock: 1, dark: true, look: -0.18 });
      // nose, angled toward the left
      s += P('M-48 -6C-60 22 -76 50 -90 74L-74 88C-62 84 -50 84 -42 90C-40 62 -42 28 -44 -6Z', `url(#${rampR})`);
      s += P('M-40 0C-30 28 -24 56 -24 86C-32 92 -40 92 -44 90C-42 62 -42 30 -44 0Z', G.S2, 0.3);
      s += P('M-56 -10C-68 18 -84 46 -100 70L-90 76C-76 52 -62 22 -50 -8Z', G.L0, 0.9);
      s += E(-92, 76, 14, 10, G.L1);
      s += E(-96, 72, 5, 4, G.L0);
      s += P('M-62 76C-48 78 -46 92 -60 94C-58 88 -58 82 -62 76Z', G.S2, 0.85);
      s += P('M-102 86C-88 96 -66 96 -56 88C-64 102 -90 104 -102 86Z', G.S3, 0.85);
      // cheek, mouth, chin
      s += light(-36, 36, 30, 28, 0.6);
      s += shade(30, 52, 50, 70, 0.6);
      s += S('M-52 92C-38 106 -34 122 -40 138', G.S2, 3, 0.5);
      s += P('M-96 108C-80 100 -64 102 -58 104C-50 102 -36 102 -26 108C-46 110 -76 110 -96 108Z', G.S2, 0.7);
      s += S('M-96 110C-78 112 -46 112 -24 109', G.S4, 3.6, 0.9);
      s += P('M-90 114C-74 122 -50 122 -38 114C-50 119 -72 119 -90 114Z', G.L0, 0.9);
      s += shade(-64, 128, 30, 8, 0.85);
      s += light(-70, 146, 28, 16, 0.9);
      s += S('M-90 164C-70 172 -40 172 -16 160', G.S3, 4, 0.45);
      s += P('M70 70C62 116 36 150 0 168C40 162 72 128 84 80Z', G.S2, 0.5);
      s += S('M-94 134C-96 148 -90 160 -80 170', G.RIM, 3, 0.6);
      return s;
    }

    // ROOSEVELT — deep in the recess between Jefferson and Lincoln, turned to
    // the left, in shadow: spectacles and the heavy moustache.
    function roosevelt() {
      let s = '';
      s += P('M-70 140C-74 190 -72 220 -78 250L62 250C60 210 58 170 54 130Z', `url(#${neckG})`);
      const head = 'M-74 250L-76 166C-88 156 -98 138 -100 118C-102 104 -106 92 -110 82C-106 74 -100 70 -98 66C-102 54 -100 42 -96 30C-92 20 -90 12 -92 2C-96 -12 -100 -24 -98 -40C-96 -92 -70 -134 -20 -152C30 -168 92 -152 120 -112C142 -80 148 -30 142 20C136 80 118 130 92 170C82 190 76 220 72 250Z';
      s += P(head, `url(#${headR})`);
      const hair = 'M-98 -40C-96 -92 -70 -134 -20 -152C30 -168 92 -152 120 -112C142 -80 148 -30 142 20C138 56 130 90 118 120L90 112C92 70 90 30 84 0C80 -36 72 -70 54 -92C30 -114 -10 -122 -48 -112C-72 -100 -88 -76 -96 -52C-97 -48 -98 -44 -98 -40Z';
      s += P(hair, `url(#${hairR})`);
      s += grooves('M-70 -116C-30 -144 30 -150 76 -132M-84 -80C-60 -124 0 -140 50 -136M20 -142C70 -136 108 -100 120 -60M70 -92C104 -66 124 -20 124 30', 0.8);
      s += S('M-40 -138C-46 -116 -60 -96 -80 -82', G.S3, 3, 0.4);
      s += shade(96, 30, 24, 90, 0.7);
      s += light(-40, -76, 44, 30, 0.75, -10);
      s += warm(-86, -30, 22, 40, 0.45);
      s += P('M-98 -30C-86 -42 -66 -42 -54 -32C-70 -34 -86 -30 -98 -24Z', G.L1, 0.9);
      s += P('M-36 -34C-14 -46 20 -44 36 -28C16 -36 -10 -36 -36 -30Z', G.M1, 0.75);
      s += eye(-68, 6, 26, 11, { look: -0.15 });
      s += eye(0, 7, 40, 14, { ball: G.M1, sock: 1, dark: true, look: -0.18 });
      // spectacles: rims and bridge, raised in the granite
      s += `<ellipse cx="-68" cy="6" rx="20" ry="17" fill="none" stroke="${G.L1}" stroke-width="4.5" stroke-opacity="0.9" transform="rotate(-8 -68 6)"/>`;
      s += `<ellipse cx="0" cy="7" rx="30" ry="21" fill="none" stroke="${G.M1}" stroke-width="5" stroke-opacity="0.85"/>`;
      s += S('M-72 23Q-56 26 -48 18M-10 28Q14 32 28 20', G.S3, 2.6, 0.55);
      s += S('M-48 2Q-40 -6 -30 2', G.L1, 5, 0.9);
      // nose
      s += P('M-44 -2C-54 24 -66 48 -80 66L-66 78C-56 76 -46 76 -38 80C-38 54 -40 26 -40 -2Z', `url(#${rampR})`);
      s += P('M-52 -6C-62 20 -76 44 -92 64L-82 70C-70 48 -58 20 -48 -4Z', G.L1, 0.9);
      s += E(-84, 68, 13, 9, G.L2);
      s += E(-88, 64, 4.5, 3.5, G.L0, 0.9);
      // the moustache, drooping over the mouth
      const mo = 'M-110 84C-100 74 -78 70 -66 76C-56 70 -24 72 -10 86C-4 96 -2 108 -8 116C-18 104 -36 100 -54 100C-74 100 -92 104 -106 112C-112 104 -112 94 -110 84Z';
      s += P(mo, G.M2);
      s += P('M-110 84C-100 74 -78 70 -66 76C-80 80 -96 86 -106 100C-110 96 -111 90 -110 84Z', G.L1, 0.9);
      s += S('M-100 82l-6 12M-90 78l-6 14M-78 76l-4 14M-66 78v14M-54 78l2 14M-40 80l4 14M-26 86l4 12', G.S2, 2.2, 0.55);
      s += P('M-106 112C-92 104 -72 100 -54 100C-36 100 -18 104 -8 116C-28 112 -84 112 -106 112Z', G.S3, 0.85);
      s += P('M-94 120C-80 126 -58 126 -46 120C-56 130 -82 130 -94 120Z', G.L2, 0.8);
      s += shade(-70, 134, 28, 8, 0.8);
      s += light(-74, 148, 24, 12, 0.6);
      s += shade(36, 60, 50, 70, 0.6);
      s += light(-44, 40, 24, 22, 0.45);
      s += P('M76 70C66 116 40 150 4 166C44 160 76 126 88 78Z', G.S2, 0.5);
      return s;
    }

    // LINCOLN — at the right, near-frontal and a touch to the left; deep-set
    // eyes under a heavy brow, hollow cheeks and the chin-curtain beard.
    function lincoln() {
      let s = '';
      s += P('M-78 170C-82 210 -80 240 -86 270L74 270C72 236 70 206 66 170Z', `url(#${neckG})`);
      const head = 'M-86 260L-88 196C-102 166 -110 122 -110 72C-112 22 -112 -20 -106 -60C-98 -120 -62 -160 -6 -168C50 -172 100 -146 120 -96C134 -56 134 -6 128 40C124 100 110 152 84 194C74 214 70 236 70 260Z';
      s += P(head, `url(#${headG})`);
      const hair = 'M-106 -60C-98 -120 -62 -160 -6 -168C50 -172 100 -146 120 -96C134 -56 134 -6 128 40L102 36C100 0 96 -36 88 -64C76 -96 46 -116 4 -118C-40 -118 -74 -100 -92 -70C-98 -66 -102 -62 -106 -60Z';
      s += P(hair, `url(#${hairG})`);
      s += grooves('M-80 -126C-40 -156 24 -160 72 -140M-96 -90C-70 -134 -16 -152 34 -152M30 -150C76 -138 108 -106 120 -64M84 -104C112 -76 124 -36 124 6');
      s += S('M-102 -70C-92 -120 -60 -152 -14 -164', G.RIM, 3.5, 0.75);
      s += S('M-92 -70C-74 -100 -40 -118 4 -118C46 -116 76 -96 88 -64', G.S2, 6, 0.22);
      // the beard: a chin curtain from the ears down around the jaw
      const beard = 'M-108 20C-112 70 -104 124 -84 166C-62 206 -22 222 14 216C56 206 92 162 112 104C122 74 128 40 128 20L104 26C102 66 92 104 70 128C52 146 28 154 6 150C-14 154 -40 148 -58 132C-80 110 -92 70 -94 24Z';
      s += P(beard, `url(#${hairG})`);
      const rb = rng(1865);
      let bs = '';
      for (let i = 0; i < 30; i++) {
        const t = i / 29;
        const a = Math.PI * (0.03 + 0.94 * t);
        const cx = 8 - Math.cos(a) * 104, cy = 60 + Math.sin(a) * 130;
        bs += `M${n(cx)} ${n(cy - 30)}q${n((rb() - 0.5) * 8)} ${n(16)} ${n((rb() - 0.5) * 6)} ${n(32 + rb() * 12)}`;
      }
      s += grooves(bs, 0.9);
      s += P('M84 90C70 140 40 190 0 214C50 210 92 166 112 104C120 80 126 50 128 20L104 26C102 50 96 70 84 90Z', G.S2, 0.65);
      s += S('M-106 30C-110 80 -100 130 -80 168', G.RIM, 3, 0.7);
      // forehead, temples
      s += light(-30, -76, 70, 40, 0.95, -6);
      s += warm(-80, -30, 30, 46, 0.6);
      s += shade(92, -20, 22, 56, 0.6);
      // the heavy brow and the deep sockets
      s += P('M-88 -18C-70 -40 -32 -42 -10 -24C-34 -30 -64 -26 -88 -12Z', G.L0, 0.95);
      s += P('M4 -24C26 -42 64 -40 84 -18C62 -28 30 -30 4 -20Z', G.L1, 0.75);
      s += shade(-4, -8, 14, 20, 0.6);
      s += eye(-44, 8, 40, 14, { sock: 1.05 });
      s += eye(36, 8, 42, 14, { ball: G.M1, sock: 1.1, dark: true });
      // nose: long, with a strong tip
      s += P('M2 -6C12 24 22 50 30 78C24 88 12 92 0 88C2 58 0 26 -6 -6Z', `url(#${rampR})`);
      s += P('M10 4C24 34 34 60 40 90C32 98 22 100 14 98C24 70 18 40 6 4Z', G.S2, 0.3);
      s += P('M-12 -12C-16 18 -20 48 -26 76L-10 82C-8 54 -6 22 -4 -12Z', G.L0, 0.9);
      s += E(-6, 80, 16, 12, G.L1);
      s += E(-11, 75, 6, 4, G.L0);
      s += P('M-30 78C-42 82 -40 98 -26 98C-30 92 -30 86 -30 78Z', G.L2);
      s += P('M18 76C34 78 36 94 20 98C22 90 22 84 18 76Z', G.S2, 0.85);
      s += P('M-28 96C-14 104 8 104 20 96C12 110 -16 112 -28 96Z', G.S3, 0.85);
      // high cheekbones over hollow cheeks
      s += light(-70, 26, 24, 16, 0.85, -20);
      s += shade(-70, 74, 20, 34, 0.55);
      s += shade(60, 60, 34, 56, 0.7);
      s += S('M-34 100C-46 112 -48 126 -44 138', G.S2, 3, 0.5);
      s += S('M28 98C40 110 44 124 40 138', G.S3, 3, 0.5);
      // mouth
      s += P('M-38 120C-22 112 -6 114 0 116C6 114 22 112 32 120C12 122 -18 122 -38 120Z', G.S2, 0.7);
      s += S('M-40 122C-20 124 12 124 34 121', G.S4, 3.6, 0.9);
      s += P('M-30 126C-14 134 8 134 22 126C8 131 -16 131 -30 126Z', G.L0, 0.9);
      s += shade(-4, 140, 30, 8, 0.7);
      return s;
    }

    // The heads' placement on the mountain.
    const HW = { x: 1272, y: 578, s: 0.95, r: 0 };
    const HJ = { x: 1514, y: 548, s: 0.86, r: 10 };
    const HR = { x: 1700, y: 622, s: 0.76, r: 2 };
    const HL = { x: 1886, y: 602, s: 0.9, r: 0 };
    const place = (h, body) => `<g transform="translate(${h.x} ${h.y}) rotate(${h.r}) scale(${h.s})">${body}</g>`;

    {
      let m = '';
      // the carved recesses and clefts that set each head off
      // behind Washington's wig, down to Jefferson's chin
      m += P('M1404 460C1426 520 1432 600 1426 680C1422 740 1410 790 1390 840L1470 860C1480 780 1482 700 1476 620C1470 556 1456 500 1434 452Z', `url(#${rampR})`);
      // Roosevelt's niche, cut deep between Jefferson and Lincoln
      m += P('M1606 460C1650 440 1716 434 1770 452C1806 470 1820 540 1814 620C1810 700 1800 780 1786 850L1620 850C1606 780 1596 700 1596 620C1596 550 1598 500 1606 460Z', G.S2, 0.7);
      m += deep(1700, 470, 120, 40, 0.8);
      m += deep(1640, 600, 50, 160, 0.5);
      // the deep cleft between Roosevelt and Lincoln
      m += P('M1782 470C1800 520 1806 600 1800 680C1796 740 1788 800 1778 870L1816 870C1822 790 1826 710 1822 630C1818 560 1808 506 1796 462Z', G.S4, 0.75);
      m += deep(1800, 640, 34, 200, 0.6);
      // shadow down the far side of Lincoln and the rock beyond
      m += P('M2000 500C2022 570 2026 660 2014 750C2006 800 1994 840 1980 880L2060 890C2070 800 2070 700 2062 620C2054 560 2036 520 2018 490Z', `url(#${rampR})`);
      parts.push({ svg: `<g clip-path="url(#${mtClip})">${m}</g>` });
    }
    parts.push({ svg: place(HR, roosevelt()) + place(HJ, jefferson()) + place(HW, washington()) + place(HL, lincoln()) });

    // ---- rough rock below the faces, talus ------------------------------------------------
    {
      // rough-hewn rock below the chins: vertical fins catching the light
      const rr = rng(808);
      let fins = '', finL = '';
      for (let i = 0; i < 34; i++) {
        const x = 1130 + i * 28 + rr() * 14, y = 800 + rr() * 80, L = 120 + rr() * 140;
        fins += `M${n(x)} ${n(y)}q${n(-3 + rr() * 6)} ${n(L * 0.5)} ${n(-6 + rr() * 6)} ${n(L)}`;
        finL += `M${n(x - 5)} ${n(y + 8)}q${n(-3 + rr() * 6)} ${n(L * 0.5)} ${n(-6 + rr() * 6)} ${n(L - 10)}`;
      }
      parts.push({ svg: `<g clip-path="url(#${mtClip})">${S(fins, G.S2, 3, 0.35)}${S(finL, G.L0, 2.2, 0.35)}</g>` });
    }
    // Talus: the fan of rock blasted from the carving, spilling into the pines.
    {
      const talG = k.id('talus');
      const T = [[1120, 1150], [1150, 1010], [1196, 942], [1250, 916], [1320, 934], [1390, 906], [1460, 922], [1530, 900], [1600, 928], [1660, 914], [1730, 944], [1800, 930], [1870, 960], [1940, 950], [2020, 990], [2100, 1010], [2100, 1160]];
      const tD = curve(T.slice(0, -1), false) + 'L2100 1160Z';
      let t = P(tD, `url(#${talG})`);
      const rt = rng(777);
      let lit = '', sh = '', mid = '', gaps = '';
      for (let i = 0; i < 560; i++) {
        const x = 1130 + rt() * 970;
        const y = 905 + Math.pow(rt(), 0.85) * 250;
        const s = 3 + rt() * 7 + (y - 900) * 0.025;
        const pts = [[x - s, y], [x - s * 0.5, y - s * 0.7], [x + s * 0.6, y - s * 0.8], [x + s, y - s * 0.1], [x + s * 0.5, y + s * 0.4], [x - s * 0.6, y + s * 0.4]];
        mid += poly(pts);
        lit += poly([[x - s, y], [x - s * 0.5, y - s * 0.7], [x + s * 0.6, y - s * 0.8], [x + s * 0.1, y - s * 0.1]]);
        sh += poly([[x + s * 0.1, y - s * 0.1], [x + s, y - s * 0.1], [x + s * 0.5, y + s * 0.4], [x - s * 0.6, y + s * 0.4]]);
        if (rt() < 0.3) gaps += `<ellipse cx="${n(x + s * 0.2)}" cy="${n(y + s * 0.6)}" rx="${n(s * 1.1)}" ry="${n(s * 0.3)}"/>`;
      }
      t += `<g fill="${G.S2}" fill-opacity="0.35">${gaps}</g>`;
      t += P(mid, '#CFC4DA', 0.85) + P(lit, '#F2E2DA', 0.8) + P(sh, '#9A90C3', 0.6);
      // shadow pooling where the talus meets the cliff
      t += S(curve(T.slice(1, -1), false), G.S2, 8, 0.3);
      parts.push({
        defs: lgU(talG, 0, 900, 0, 1160, [[0, '#E2D6E0'], [0.5, '#D2C7DD'], [1, '#B9AFD6']]),
        svg: `<g clip-path="url(#${mtClip})">${t}</g>`,
      });
    }

    // ---- ponderosa pines ----------------------------------------------------------------------
    // Tall straight cinnamon trunks; an open crown of needle clumps at the
    // ends of short, upturned branches; lit from the left.
    const barkG = k.id('bark');
    parts.push({ defs: lgB(barkG, 0, 0, 1, 0, [[0, '#F4AA82'], [0.4, '#D88468'], [0.75, '#A5617A'], [1, '#7C4D74']]) });
    const PAL = {
      near: { dark: '#24504F', mid: '#3A7466', light: '#78AB86', tip: '#C3DCA0', branch: '#4A3A60' },
      mid: { dark: '#2E5B66', mid: '#467F7A', light: '#86B39A', tip: '#C9DDB0', branch: '#4C4068' },
      far: { dark: '#4E6A90', mid: '#6884A2', light: '#9DB6BA', tip: '#C9D6CC', branch: '#5A5384' },
    };
    function ponderosa(x, y, h, o) {
      o = Object.assign({ seed: 1, pal: PAL.near, tw: 0.035, crown: 0.55, width: 0.4, detail: 1, trunk: true }, o || {});
      const r = rng(o.seed);
      const c = o.pal;
      const top = y - h;
      const tw = h * o.tw;
      let s = '';
      if (o.trunk) {
        s += `<path d="M${n(x - tw)} ${n(y)}C${n(x - tw * 0.8)} ${n(y - h * 0.4)} ${n(x - tw * 0.5)} ${n(top + h * 0.3)} ${n(x - tw * 0.25)} ${n(top + h * 0.05)}L${n(x + tw * 0.25)} ${n(top + h * 0.05)}C${n(x + tw * 0.5)} ${n(top + h * 0.3)} ${n(x + tw * 0.8)} ${n(y - h * 0.4)} ${n(x + tw)} ${n(y)}Z" fill="url(#${barkG})"/>`;
        if (o.detail >= 0.6) {
          // jigsaw bark plates: dark fissures with a lit plate edge
          let fis = '', lit = '';
          for (let yy = y - 6; yy > top + h * 0.35; yy -= 8 + r() * 12) {
            const f = (y - yy) / h;
            const w = tw * (1 - f * 0.7);
            const x0 = x - w * 0.85 + r() * w * 0.5;
            const len = w * (0.35 + r() * 0.6);
            fis += `M${n(x0)} ${n(yy)}h${n(len)}l${n(w * 0.1)} ${n(-4 - r() * 5)}`;
            if (r() < 0.6) lit += `M${n(x0)} ${n(yy - 2)}h${n(len * 0.6)}`;
          }
          s += S(fis, '#52345A', Math.max(1.2, tw * 0.13), 0.6) + S(lit, '#FFD2B4', Math.max(1, tw * 0.08), 0.5);
        }
      }
      // branches and clumps
      const cBot = top + h * o.crown, cW = h * o.width;
      const clumps = [];
      const levels = Math.max(4, Math.round(4 + o.detail * 4));
      let side = r() < 0.5 ? -1 : 1;
      for (let i = 0; i < levels; i++) {
        const t = i / (levels - 1);
        const yy = top + h * 0.05 + (cBot - top - h * 0.05) * t;
        const reach = cW / 2 * (0.3 + 0.7 * Math.sin(Math.PI * (0.12 + 0.62 * t))) * (0.75 + r() * 0.4);
        const both = r() < 0.4;
        for (const sd of both ? [-1, 1] : [side]) {
          const tipx = x + sd * reach, tipy = yy - h * 0.02;
          const sz = h * (0.055 + r() * 0.03) * (0.8 + 0.4 * t);
          clumps.push({ x: tipx, y: tipy, sz, bx: x, by: yy + sz * 0.6, sd });
        }
        side = -side;
      }
      clumps.unshift({ x: x + (r() - 0.5) * tw, y: top + h * 0.04, sz: h * 0.06, bx: x, by: top + h * 0.12, sd: 0 });
      let br = '';
      for (const q of clumps) br += `M${n(q.bx)} ${n(q.by)}Q${n((q.bx + q.x) / 2)} ${n(q.by + q.sz * 0.3)} ${n(q.x - q.sd * q.sz * 0.3)} ${n(q.y + q.sz * 0.2)}`;
      s += S(br, c.branch, Math.max(1.4, tw * 0.32), 0.9);
      let dk = '', md = '', lt = '', tp = '', nd = '';
      clumps.forEach((q, i) => {
        const sd = o.seed * 97 + i * 7;
        const sub = o.detail >= 0.6 ? 3 : 1;
        for (let j = 0; j < sub; j++) {
          const ox = sub > 1 ? (j - 1) * q.sz * 0.7 : 0;
          const oy = sub > 1 ? (j === 1 ? -q.sz * 0.3 : q.sz * 0.1) : 0;
          const rx = q.sz * (sub > 1 ? 0.75 : 1.2), ry = rx * 0.66;
          dk += blob(q.x + ox + rx * 0.1, q.y + oy + ry * 0.2, rx, ry, sd + j, 0.22, 10);
          md += blob(q.x + ox - rx * 0.06, q.y + oy - ry * 0.12, rx * 0.84, ry * 0.76, sd + j + 3, 0.22, 10);
          lt += blob(q.x + ox - rx * 0.3, q.y + oy - ry * 0.36, rx * 0.5, ry * 0.42, sd + j + 5, 0.25, 8);
          if (o.detail >= 0.6) tp += blob(q.x + ox - rx * 0.44, q.y + oy - ry * 0.5, rx * 0.22, ry * 0.18, sd + j + 9, 0.3, 7);
          if (o.detail >= 0.9) {
            // needle bundles bristling along the top edge
            for (let m = 0; m < 9; m++) {
              const a = Math.PI * (1.05 + m * 0.11);
              const ex = q.x + ox + Math.cos(a) * rx * 0.95, ey = q.y + oy + Math.sin(a) * ry * 0.95;
              nd += `M${n(ex)} ${n(ey)}l${n(Math.cos(a) * rx * 0.28)} ${n(Math.sin(a) * rx * 0.28)}`;
            }
          }
        }
      });
      s += P(dk, c.dark) + P(md, c.mid) + P(lt, c.light, 0.9);
      if (tp) s += P(tp, c.tip, 0.85);
      if (nd) s += S(nd, c.mid, Math.max(1.2, h * 0.003), 0.9);
      return s;
    }

    // Pines along the Rushmore ridge, small with distance.
    const ridgeY = (x) => {
      for (let i = 0; i < MT.length - 2; i++) {
        if (x >= MT[i][0] && x <= MT[i + 1][0]) {
          const t = (x - MT[i][0]) / (MT[i + 1][0] - MT[i][0]);
          return MT[i][1] + (MT[i + 1][1] - MT[i][1]) * t;
        }
      }
      return 470;
    };
    {
      let s = '';
      const rp = rng(909);
      for (let i = 0; i < 30; i++) {
        const x = 1820 + i * 9 + rp() * 8;
        if (x > 2090) break;
        const h = 34 + rp() * 40 + (x - 1820) * 0.12;
        s += ponderosa(x, ridgeY(x) + 16 + rp() * 6, h, { seed: 50 + i, pal: PAL.far, tw: 0.035, detail: 0.2, width: 0.48, crown: 0.7 });
      }
      for (let i = 0; i < 7; i++) {
        const x = 1092 + i * 17 + rp() * 6;
        const h = 34 + rp() * 30;
        s += ponderosa(x, ridgeY(x + 14) + 40 + i * 10, h, { seed: 80 + i, pal: PAL.far, tw: 0.035, detail: 0.2, width: 0.48, crown: 0.7 });
      }
      parts.push({ svg: s });
    }

    // ---- the Needles (left page) -------------------------------------------------------------
    // Granite spires built as stacks of rounded blocks, narrowing upward —
    // each block lit warm on the left, violet on the right, with a dark joint
    // under it and a bright lip on top.
    const spLit = k.id('split'), spSh = k.id('spsh'), skyU = k.id('skyu');
    parts.push({
      defs: lgU(spLit, 0, 380, 0, 1120, [[0, '#FFF0E2'], [0.45, '#F6DCCC'], [1, '#DCC4CC']]) +
        lgU(spSh, 0, 380, 0, 1120, [[0, '#B9AED5'], [0.6, '#A097C9'], [1, '#857CB8']]) +
        lgU(skyU, 0, 0, 0, k.H, SKY),
    });
    function spire(x, base, w, h, seed, o) {
      o = Object.assign({ haze: 0, slot: false, cap: 'dome', crest: 0.48 }, o || {});
      const r = rng(seed);
      const top = base - h;
      let y = base, cx = x;
      const blocks = [];
      while (y > top + h * 0.12) {
        const t = (base - y) / h;
        const bh = h * (0.07 + r() * 0.07);
        const bw = w * (1 - 0.5 * Math.pow(t, 1.15)) * (0.9 + r() * 0.18);
        cx += (r() - 0.5) * w * 0.08 + (o.lean || 0) * bh;
        blocks.push({ y0: y, y1: y - bh, x: cx, w: bw });
        y -= bh;
      }
      // the cap
      const lastW = blocks[blocks.length - 1].w;
      let s = '';
      const capH = y - top;
      const capD = o.cap === 'point'
        ? `M${n(cx - lastW / 2)} ${n(y + 4)}C${n(cx - lastW * 0.45)} ${n(y - capH * 0.5)} ${n(cx - lastW * 0.15)} ${n(top + capH * 0.15)} ${n(cx + lastW * 0.05)} ${n(top)}C${n(cx + lastW * 0.25)} ${n(top + capH * 0.3)} ${n(cx + lastW * 0.5)} ${n(y - capH * 0.4)} ${n(cx + lastW / 2)} ${n(y + 4)}Z`
        : `M${n(cx - lastW / 2)} ${n(y + 4)}C${n(cx - lastW / 2)} ${n(top + capH * 0.2)} ${n(cx - lastW * 0.2)} ${n(top)} ${n(cx)} ${n(top)}C${n(cx + lastW * 0.3)} ${n(top)} ${n(cx + lastW / 2)} ${n(top + capH * 0.3)} ${n(cx + lastW / 2)} ${n(y + 4)}Z`;
      let outline = '', litD = '', joints = '', lips = '', cracks = '';
      for (const b of blocks) {
        const rad = Math.min(b.w, b.y0 - b.y1) * 0.32;
        const L = b.x - b.w / 2, R = b.x + b.w / 2;
        const d = `M${n(L)} ${n(b.y0 + 2)}L${n(L)} ${n(b.y1 + rad)}Q${n(L)} ${n(b.y1)} ${n(L + rad)} ${n(b.y1)}L${n(R - rad)} ${n(b.y1)}Q${n(R)} ${n(b.y1)} ${n(R)} ${n(b.y1 + rad)}L${n(R)} ${n(b.y0 + 2)}Z`;
        outline += d;
        const cr = L + b.w * (o.crest + (r() - 0.5) * 0.12);
        litD += `M${n(L)} ${n(b.y0 + 2)}L${n(L)} ${n(b.y1 + rad)}Q${n(L)} ${n(b.y1)} ${n(L + rad)} ${n(b.y1)}L${n(cr)} ${n(b.y1)}L${n(cr + (r() - 0.5) * 6)} ${n(b.y0 + 2)}Z`;
        joints += `M${n(L + 2)} ${n(b.y1 + 2.5)}Q${n(b.x)} ${n(b.y1 + 6)} ${n(R - 2)} ${n(b.y1 + 2.5)}`;
        lips += `M${n(L + rad * 0.6)} ${n(b.y1 + 0.5)}L${n(cr - 2)} ${n(b.y1 + 0.5)}`;
        if (r() < 0.55) {
          const fx = L + b.w * (0.6 + r() * 0.3);
          cracks += `M${n(fx)} ${n(b.y1 + 4)}l${n((r() - 0.5) * 4)} ${n(b.y0 - b.y1 - 4)}`;
        }
      }
      s += P(outline + capD, `url(#${spSh})`);
      const crCap = cx + lastW * (o.crest - 0.5);
      const capLit = o.cap === 'point'
        ? `M${n(cx - lastW / 2)} ${n(y + 4)}C${n(cx - lastW * 0.45)} ${n(y - capH * 0.5)} ${n(cx - lastW * 0.15)} ${n(top + capH * 0.15)} ${n(cx + lastW * 0.05)} ${n(top)}L${n(crCap)} ${n(y + 4)}Z`
        : `M${n(cx - lastW / 2)} ${n(y + 4)}C${n(cx - lastW / 2)} ${n(top + capH * 0.2)} ${n(cx - lastW * 0.2)} ${n(top)} ${n(cx)} ${n(top)}C${n(crCap)} ${n(top + capH * 0.2)} ${n(crCap)} ${n(top + capH * 0.5)} ${n(crCap)} ${n(y + 4)}Z`;
      s += P(litD + capLit, `url(#${spLit})`);
      s += S(joints, '#5F57A0', 3, 0.6) + S(lips, '#FFF6EC', 2.2, 0.8) + S(cracks, '#6F66A8', 2, 0.45);
      // warm rim along the lit edges
      let rim = '';
      for (const b of blocks) rim += `M${n(b.x - b.w / 2 + 1)} ${n(b.y0)}L${n(b.x - b.w / 2 + 1)} ${n(b.y1 + 6)}`;
      s += S(rim, G.RIM, 3, 0.75);
      if (o.slot) {
        // the Needle's Eye: a narrow slot through the head of the spire
        const sy = top + capH * 0.2, sh = (base - top) * 0.2;
        s += `<path d="M${n(cx - 2)} ${n(sy + sh)}C${n(cx - 8)} ${n(sy + sh * 0.6)} ${n(cx - 6)} ${n(sy + sh * 0.2)} ${n(cx)} ${n(sy)}C${n(cx + 6)} ${n(sy + sh * 0.25)} ${n(cx + 7)} ${n(sy + sh * 0.6)} ${n(cx + 3)} ${n(sy + sh)}Z" fill="url(#${skyU})"/>`;
        s += S(`M${n(cx + 3)} ${n(sy + sh)}C${n(cx + 7)} ${n(sy + sh * 0.6)} ${n(cx + 6)} ${n(sy + sh * 0.25)} ${n(cx)} ${n(sy)}`, '#FFF0E4', 2, 0.85);
      }
      if (o.haze) s += P(outline + capD, '#E4DEF1', o.haze);
      return s;
    }
    {
      let s = '';
      // back row, hazier
      s += spire(286, 1050, 84, 430, 3, { haze: 0.42 });
      s += spire(540, 1050, 92, 500, 5, { haze: 0.42, cap: 'point' });
      s += spire(650, 1060, 70, 360, 7, { haze: 0.45 });
      s += spire(430, 1060, 80, 330, 9, { haze: 0.45 });
      s += spire(760, 1070, 60, 250, 10, { haze: 0.5 });
      // front row
      s += spire(232, 1090, 112, 500, 13);
      s += spire(366, 1092, 142, 690, 17, { cap: 'point' });
      s += spire(486, 1096, 116, 590, 19);
      s += spire(594, 1102, 92, 450, 23, { cap: 'point' });
      s += spire(708, 1112, 58, 420, 29, { slot: true, lean: 0.03 });
      parts.push({ svg: s });
    }

    // ---- the forest across both pages -----------------------------------------------------------
    {
      const f1 = hill([[200, 30, 300], [700, 40, 400], [1300, 20, 300], [1900, 30, 400]], 1076);
      const fr = forestRidge({ x0: -20, x1: k.W + 20, base: f1, h: 58, step: 20, seed: 31, hl: true });
      parts.push({ svg: P(fr.d, '#6E78B2') + S(fr.hl, '#A7ACDA', 2.4, 0.7) });
      // two rows of ponderosa crowns, back (bluer) then front
      let s = '';
      const rp = rng(2020);
      for (let x = -30; x < k.W + 40; x += 34 + rp() * 26) {
        const y = 1150 + Math.sin(x / 170) * 14 + rp() * 16;
        s += ponderosa(x, y, 120 + rp() * 70, { seed: 400 + Math.round(x), pal: PAL.mid, detail: 0.45, width: 0.5, crown: 0.72, tw: 0.04 });
      }
      for (let x = -20; x < k.W + 40; x += 48 + rp() * 40) {
        if (x > 470 && x < 760) continue; // the creek's opening
        const y = 1215 + Math.sin(x / 130) * 16 + rp() * 20;
        s += ponderosa(x, y, 150 + rp() * 80, { seed: 700 + Math.round(x), pal: PAL.near, detail: 0.6, width: 0.48, crown: 0.66, tw: 0.04 });
      }
      parts.push({ svg: s });
    }

    // ---- meadow, the creek (left page) and the ground (right page) ----------------------------------
    {
      const mg = k.id('meadow');
      const mD = curve([[-20, 1222], [200, 1214], [420, 1200], [620, 1196], [820, 1214], [1040, 1236], [1300, 1250], [1600, 1240], [1900, 1236], [2100, 1244]], false) + 'L2100 1600L-20 1600Z';
      parts.push({
        defs: lgU(mg, 0, 1190, 0, 1572, [[0, '#C9D69D'], [0.45, '#BCCB8E'], [1, '#A8BD84']]),
        svg: P(mD, `url(#${mg})`),
      });
      // the creek, from the forest down toward us over granite
      const cl = [[628, 1192], [592, 1212], [552, 1240], [560, 1278], [624, 1316], [700, 1356], [724, 1410], [690, 1468], [650, 1530], [640, 1600]];
      const wd = (i) => 10 + 290 * Math.pow(i / (cl.length - 1), 1.7);
      const Lb = [], Rb = [];
      for (let i = 0; i < cl.length; i++) {
        const a = cl[Math.max(0, i - 1)], b = cl[Math.min(cl.length - 1, i + 1)];
        let dx = b[0] - a[0], dy = b[1] - a[1];
        const len = Math.hypot(dx, dy) || 1;
        dx /= len; dy /= len;
        const w = wd(i) / 2;
        Lb.push([cl[i][0] + dy * w, cl[i][1] - dx * w]);
        Rb.push([cl[i][0] - dy * w, cl[i][1] + dx * w]);
      }
      const cD = curve(Lb, false) + 'L' + curve(Rb.slice().reverse(), false).slice(1) + 'Z';
      const wg = k.id('water'), wr = k.id('wrefl');
      let w = '';
      // earthy bank under the water's edge
      w += `<g transform="translate(0 8)">${P(cD, '#8F86B8', 0.5)}</g>`;
      w += P(cD, `url(#${wg})`);
      w += P(cD, `url(#${wr})`);
      const rw = rng(616);
      let rip = '', ripD = '';
      for (let i = 0; i < 110; i++) {
        const t = rw();
        const fi = t * (cl.length - 1);
        const idx = Math.min(cl.length - 2, Math.floor(fi));
        const f = fi - idx;
        const cx = cl[idx][0] + (cl[idx + 1][0] - cl[idx][0]) * f;
        const cy = cl[idx][1] + (cl[idx + 1][1] - cl[idx][1]) * f;
        const ww = wd(fi);
        const x = cx + (rw() - 0.5) * ww * 0.75;
        const L = 6 + ww * (0.08 + rw() * 0.14);
        if (rw() < 0.6) rip += `M${n(x - L / 2)} ${n(cy)}q${n(L / 2)} ${n(-2 - ww * 0.01)} ${n(L)} 0`;
        else ripD += `M${n(x - L / 2)} ${n(cy)}q${n(L / 2)} ${n(2 + ww * 0.01)} ${n(L)} 0`;
      }
      w += S(rip, '#FFFFFF', 2.6, 0.6) + S(ripD, '#5E62B4', 2.4, 0.3);
      // banks: a shadowed far edge, a lit near lip
      w += S(curve(Lb, false), '#6C64AA', 5, 0.55) + S(curve(Rb, false), '#FFF3E6', 4, 0.75);
      // granite boulders in and along the creek
      const rocks = [[520, 1250, 30], [492, 1236, 18], [604, 1292, 16], [800, 1372, 42], [842, 1404, 26], [770, 1418, 18],
        [540, 1446, 30], [880, 1488, 48], [500, 1538, 40], [452, 1500, 22], [796, 1556, 30], [668, 1400, 12]];
      for (const [x, y, s] of rocks) {
        const sd = x * 3 + y;
        w += E(x + s * 0.2, y + s * 0.5, s * 1.15, s * 0.28, '#5E62B4', 0.25);
        w += P(blob(x, y, s, s * 0.66, sd, 0.18), G.S1) + P(blob(x - s * 0.14, y - s * 0.14, s * 0.82, s * 0.5, sd + 1, 0.15), G.M1) +
          P(blob(x - s * 0.34, y - s * 0.3, s * 0.42, s * 0.24, sd + 2, 0.15), G.L1) + P(blob(x - s * 0.42, y - s * 0.36, s * 0.16, s * 0.1, sd + 3, 0.15), G.L0);
        w += S(`M${n(x - s * 0.9)} ${n(y + s * 0.42)}q${n(s * 0.9)} ${n(s * 0.2)} ${n(s * 1.8)} 0`, '#FFFFFF', 2.4, 0.55);
      }
      parts.push({
        defs: lgU(wg, 0, 1190, 0, 1572, [[0, '#F2E2E2'], [0.25, '#D4D3F1'], [0.6, '#B3B8EA'], [1, '#8E97DC']]) +
          lgU(wr, 0, 0, 1, 0, [[0, '#FFE6D2', 0.4], [0.5, '#FFE6D2', 0], [1, '#FFFFFF', 0]]).replace('gradientUnits="userSpaceOnUse" ', ''),
        svg: w,
      });
      // grass strokes
      const rg = rng(57);
      let a = '', b = '';
      for (let i = 0; i < 300; i++) {
        const x = rg() * k.W, y = 1236 + rg() * 336, L = 14 + rg() * 30;
        const seg = `M${n(x)} ${n(y)}q${n(4 - rg() * 8)} ${n(-L * 0.5)} ${n(6 - rg() * 12)} ${n(-L)}`;
        if (rg() < 0.55) a += seg; else b += seg;
      }
      parts.push({ svg: S(a, '#8FA466', 3, 0.55) + S(b, '#9C8BC4', 3, 0.4) });
    }

    // ---- foreground ponderosas framing the outer edges -------------------------------------------
    parts.push({
      svg: ponderosa(96, 1470, 1080, { seed: 4, tw: 0.03, crown: 0.46, width: 0.3, detail: 1 }) +
        ponderosa(-6, 1420, 760, { seed: 6, tw: 0.03, crown: 0.5, width: 0.34, detail: 1 }),
    });

    // ---- pasqueflowers ----------------------------------------------------------------------------
    // Pulsatilla: pale violet goblets of silky sepals around a golden boss,
    // feathery involucres on furry stems, finely cut leaves, silky seed heads.
    const pasP = k.id('pasP'), pasB = k.id('pasB'), pasO = k.id('pasO');
    parts.push({
      defs: lgB(pasP, 0, 1, 0, 0, [[0, '#5B48B4'], [0.4, '#9B86DC'], [1, '#EAE0FA']]) +
        lgB(pasB, 0, 1, 0, 0, [[0, '#4A3B9C'], [0.5, '#7C69C6'], [1, '#C2B3EC']]) +
        lgB(pasO, 0, 1, 0, 0, [[0, '#6A55C0'], [0.35, '#A28EE0'], [1, '#F0E8FC']]),
    });
    function sepal(len, wid, ang, fill, veins) {
      let s = `<g transform="rotate(${n(ang)})"><path d="M0 0C${n(-wid)} ${n(-len * 0.22)} ${n(-wid * 0.95)} ${n(-len * 0.82)} 0 ${n(-len)}C${n(wid * 0.95)} ${n(-len * 0.82)} ${n(wid)} ${n(-len * 0.22)} 0 0Z" fill="${fill}"/>`;
      if (veins) {
        s += `<path d="M0 ${n(-len * 0.08)}V${n(-len * 0.85)}M${n(-wid * 0.3)} ${n(-len * 0.2)}Q${n(-wid * 0.5)} ${n(-len * 0.55)} ${n(-wid * 0.25)} ${n(-len * 0.88)}M${n(wid * 0.3)} ${n(-len * 0.2)}Q${n(wid * 0.5)} ${n(-len * 0.55)} ${n(wid * 0.25)} ${n(-len * 0.88)}" stroke="#4E3C9E" stroke-opacity="0.28" stroke-width="1.6" fill="none"/>`;
        // silky hairs fringing the outside of the sepal
        let d = '';
        for (let i = 1; i < 9; i++) {
          const t = i / 9;
          const yy = -len * (0.1 + 0.85 * t), xx = wid * 0.95 * Math.sin(Math.PI * (0.15 + 0.8 * t));
          d += `M${n(-xx)} ${n(yy)}l${n(-5)} ${n(-2)}M${n(xx)} ${n(yy)}l5 -2`;
        }
        s += `<path d="${d}" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="1.5" stroke-linecap="round"/>`;
        s += `<path d="M${n(-wid * 0.55)} ${n(-len * 0.3)}Q${n(-wid * 0.7)} ${n(-len * 0.6)} ${n(-wid * 0.3)} ${n(-len * 0.86)}" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      }
      return s + '</g>';
    }
    function pasque(x, y, r, rot, seed) {
      // a goblet seen from the side: three sepals behind, three in front, the
      // golden boss of stamens showing in the throat
      const rr = rng(seed);
      let s = `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)})">`;
      for (const a of [-44, -12, 22]) s += sepal(r * 1.3, r * 0.52, a + (rr() - 0.5) * 8, `url(#${pasB})`, false);
      s += E(0, -r * 1.02, r * 0.58, r * 0.22, '#F5C64F');
      let dots = '';
      for (let i = 0; i < 22; i++) dots += `<circle cx="${n((rr() - 0.5) * r * 1.0)}" cy="${n(-r * 1.0 - rr() * r * 0.28)}" r="${n(r * 0.055)}"/>`;
      s += `<g fill="#E39A2F">${dots}</g>`;
      s += `<path d="M${n(-r * 0.04)} ${n(-r * 1.02)}v${n(-r * 0.3)}M${n(r * 0.08)} ${n(-r * 1.0)}l${n(r * 0.05)} ${n(-r * 0.28)}M${n(-r * 0.14)} ${n(-r * 1.0)}l${n(-r * 0.04)} ${n(-r * 0.26)}" stroke="#8C76CF" stroke-width="2.2" stroke-linecap="round"/>`;
      for (const a of [-28, 4, 34]) s += sepal(r * 1.16, r * 0.54, a + (rr() - 0.5) * 8, `url(#${pasP})`, true);
      s += '</g>';
      return s;
    }
    function pasqueOpen(x, y, r, rot, seed) {
      const rr = rng(seed);
      let s = `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(1 0.8)">`;
      for (let i = 0; i < 6; i++) s += sepal(r, r * 0.44, i * 60 + rr() * 10, `url(#${pasO})`, true);
      s += `<circle r="${n(r * 0.3)}" fill="#F5C64F"/>`;
      let dots = '';
      for (let i = 0; i < 26; i++) {
        const a = rr() * Math.PI * 2, d = r * (0.1 + rr() * 0.2);
        dots += `<circle cx="${n(Math.cos(a) * d)}" cy="${n(Math.sin(a) * d)}" r="${n(r * 0.04)}"/>`;
      }
      s += `<g fill="#DE8C2A">${dots}</g><circle r="${n(r * 0.11)}" fill="#8C7BC8"/><circle cx="${n(-r * 0.03)}" cy="${n(-r * 0.03)}" r="${n(r * 0.04)}" fill="#D9CFF4"/>`;
      s += '</g>';
      return s;
    }
    function featheryLeaf(x, y, L, ang, col, seed) {
      // finely cut basal leaf: a midrib with forked linear lobes
      const r = rng(seed);
      const a = (ang * Math.PI) / 180;
      const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
      let d = `M${n(x)} ${n(y)}Q${n((x + ex) / 2 + 10)} ${n((y + ey) / 2)} ${n(ex)} ${n(ey)}`;
      for (let i = 1; i <= 5; i++) {
        const t = i / 6;
        const px = x + (ex - x) * t, py = y + (ey - y) * t;
        for (const side of [-1, 1]) {
          const b = a + side * (0.7 + r() * 0.3);
          const ll = L * (0.3 - t * 0.12);
          const qx = px + Math.cos(b) * ll, qy = py + Math.sin(b) * ll;
          d += `M${n(px)} ${n(py)}L${n(qx)} ${n(qy)}l${n(Math.cos(b - 0.45) * ll * 0.45)} ${n(Math.sin(b - 0.45) * ll * 0.45)}M${n(qx)} ${n(qy)}l${n(Math.cos(b + 0.45) * ll * 0.45)} ${n(Math.sin(b + 0.45) * ll * 0.45)}`;
        }
      }
      return S(d, col, 3.4, 0.95);
    }
    function pasqueCluster(corner, seed, spots) {
      const r = rng(seed);
      const left = corner === 'bl';
      const X = (v) => (left ? v : k.W - v);
      let back = '', front = '';
      // basal mound of feathery leaves
      for (let i = 0; i < 34; i++) {
        const x = X(-20 + r() * 440), y = k.H + 10 - r() * 70;
        const ang = left ? -30 - r() * 120 : -150 + r() * 120;
        back += featheryLeaf(x, y, 90 + r() * 110, ang, r() < 0.5 ? '#4F806A' : '#86A97E', seed + i);
      }
      const heads = [];
      spots.forEach((p, i) => {
        const x = X(p[0]), y = p[1];
        const bx = X(p[0] + (r() - 0.5) * 40);
        const stem = `M${n(bx)} ${k.H + 20}Q${n((bx + x) / 2)} ${n((k.H + y) / 2)} ${n(x)} ${n(y + 20)}`;
        back += S(stem, '#6F8F7C', 6, 1) + S(stem, '#EEF2EA', 1.6, 0.65);
        // feathery involucre a little below the flower
        let inv = '';
        for (let j = 0; j < 9; j++) {
          const a = -Math.PI * (0.05 + 0.9 * (j / 8));
          const L = 26 + r() * 16;
          inv += `M${n(x)} ${n(y + 46)}q${n(Math.cos(a) * L * 0.5)} ${n(Math.sin(a) * L * 0.3 + 6)} ${n(Math.cos(a) * L)} ${n(Math.sin(a) * L * 0.55 + 6)}`;
        }
        back += S(inv, '#6F9A7A', 2.6, 0.95) + S(inv, '#E4EEDF', 0.9, 0.6);
        heads.push([x, y, p[2], i, p[3]]);
      });
      heads.forEach(([x, y, rad, i, open]) => {
        front += open ? pasqueOpen(x, y, rad, r() * 30, seed + 100 + i) : pasque(x, y + rad * 0.4, rad * 0.72, (left ? 1 : -1) * (r() * 20 - 6), seed + 100 + i);
      });
      // silky seed heads
      for (const [px, py] of left ? [[330, 1290], [420, 1420]] : [[350, 1260], [430, 1400]]) {
        const x = X(px), y = py;
        back += S(`M${n(x)} ${k.H + 20}Q${n(x + 12)} ${n((k.H + y) / 2)} ${n(x)} ${n(y)}`, '#8FA88E', 4, 1);
        let plume = '';
        for (let j = 0; j < 26; j++) {
          const a = -Math.PI / 2 + (r() - 0.5) * 2.6;
          const L = 30 + r() * 30;
          plume += `M${n(x)} ${n(y)}q${n(Math.cos(a) * L * 0.5 + 8)} ${n(Math.sin(a) * L * 0.5)} ${n(Math.cos(a) * L)} ${n(Math.sin(a) * L)}`;
        }
        front += S(plume, '#F6EEFA', 2, 0.8) + S(plume, '#B8A6DA', 0.8, 0.5) + `<circle cx="${n(x)}" cy="${n(y)}" r="6" fill="#B8A3D6"/>`;
      }
      return back + front;
    }
    parts.push({
      svg: pasqueCluster('bl', 71, [[40, 1320, 78, 0], [160, 1250, 92, 0], [262, 1350, 74, 1], [96, 1440, 70, 1], [350, 1460, 60, 0], [210, 1490, 66, 0], [20, 1530, 60, 0], [400, 1540, 52, 1]]) +
        pasqueCluster('br', 72, [[50, 1300, 84, 0], [170, 1240, 70, 1], [270, 1340, 80, 0], [110, 1430, 76, 1], [360, 1450, 62, 0], [230, 1500, 64, 1], [30, 1520, 58, 0], [420, 1530, 50, 0]]),
    });

    return k.spread(parts, { grain: 0.6 });
  },
};
