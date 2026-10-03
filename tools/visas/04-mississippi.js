/* Visa pages 7–8 — the Mississippi, heart of America.
   A wide golden-hour river runs across both pages, the sun low on the far
   bluffs just right of the spine, its glitter path running down the water.
   Left: the near bank — a big cottonwood, a red gambrel barn and a blue silo,
   round hay bales and rolling fields of gold and green. Right: a white
   sternwheel steamboat, the hero — three "wedding cake" decks of railings and
   gingerbread trim, a pilothouse, two tall black stacks with feathered crowns
   puffing soft smoke, and a big red paddlewheel churning the water. Purple
   coneflowers and black-eyed Susans frame the bottom corners. Light comes
   from the sun: left-page things are lit on their right, the boat on its
   left (bow). Quote (live text, see js/passport-data.js): Eisenhower,
   "Whatever America hopes to bring to pass in the world must first come to
   pass in the heart of America." */

'use strict';

module.exports = {
  pages: [7, 8],
  svg(k) {
    const { C, n, rng } = k;
    const parts = [];

    // Catmull-Rom through points → cubic Béziers (open path, no Z).
    function smooth(p) {
      let d = `M${n(p[0][0])} ${n(p[0][1])}`;
      for (let i = 0; i < p.length - 1; i++) {
        const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
        d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
      }
      return d;
    }
    // A band from a smooth top edge down past the bottom of the spread.
    function band(top) { return smooth(top) + `L${n(top[top.length - 1][0])} ${k.H + 20}L${n(top[0][0])} ${k.H + 20}Z`; }

    const HZ = 905;                     // far edge of the river
    const SX = 1236, SY = 836;          // the sun, low on the bluffs
    const WL = 1236;                    // the boat's waterline

    // ---- sky, security print, glory ------------------------------------------------
    parts.push(k.sky([[0, '#DCD6F0'], [0.2, '#E6D5EA'], [0.38, '#F4D6D2'], [0.5, '#F9D5BC'], [0.575, '#FBDDB2'], [1, '#F7D9BA']]));
    parts.push(k.microtext('Heartland', { y0: 40, y1: 900, opacity: 0.055 }));
    parts.push(k.guilloche({ y0: 120, y1: 840, lines: 22, opacity: 0.065, amp: 15, period: 720, phase: 2.1 }));

    {
      const glory = k.id('glory'), warm = k.id('warm');
      parts.push({
        defs: k.radial(glory, '50%', '50%', '50%', [[0, '#FFF7E4', 1], [0.35, '#FDE8CC', 0.75], [1, '#F8D9BF', 0]]) +
          k.radial(warm, '50%', '50%', '50%', [[0, '#FFD9A0', 0.55], [1, '#FFD9A0', 0]]),
        svg: `<circle cx="${SX}" cy="${SY}" r="760" fill="url(#${glory})"/>` +
          k.sunburst(SX, SY, 150, 1000, 52, '#FFFFFF', 0.18) +
          k.rosette(SX, SY, 300, { opacity: 0.08, rings: 8, lobes: 34 }) +
          `<ellipse cx="${SX}" cy="${HZ - 10}" rx="620" ry="170" fill="url(#${warm})"/>`,
      });
    }

    // Golden-hour clouds: long lavender streaks lit apricot from below.
    function streak(x, y, w, h, o) {
      const g = k.id('streak');
      return {
        defs: k.linear(g, 90, [[0, '#E9DDF0', 0.0], [0.35, '#E6D6EC', 0.85], [0.75, '#F9D9C4', 0.9], [1, '#FFE6C8', 0.95]]),
        svg: `<path d="M${n(x - w / 2)} ${n(y + h / 2)}C${n(x - w * 0.38)} ${n(y - h * 0.2)} ${n(x - w * 0.1)} ${n(y - h * 0.7)} ${n(x + w * 0.05)} ${n(y - h * 0.35)}C${n(x + w * 0.18)} ${n(y - h * 0.8)} ${n(x + w * 0.36)} ${n(y - h * 0.2)} ${n(x + w / 2)} ${n(y + h / 2)}Z" fill="url(#${g})" fill-opacity="${o || 1}"/>`,
      };
    }
    parts.push(streak(330, 520, 520, 46, 0.9));
    parts.push(streak(640, 600, 380, 34, 0.8));
    parts.push(streak(1800, 640, 420, 36, 0.75));
    parts.push(streak(1560, 720, 300, 26, 0.6));
    parts.push({ svg: k.bird(820, 470, 17, '#6E67B0') + k.bird(872, 440, 12, '#6E67B0') + k.bird(1960, 560, 14, '#6E67B0') + k.bird(1150, 620, 11, '#6E67B0') });

    // The sun disc, just above the far bluffs.
    {
      const sd = k.id('sun');
      parts.push({
        defs: k.radial(sd, '50%', '40%', '60%', [[0, '#FFFBEF'], [0.6, '#FFF0CF'], [1, '#FFDDA0']]),
        svg: `<circle cx="${SX}" cy="${SY}" r="96" fill="#FFF3DA" fill-opacity="0.45"/><circle cx="${SX}" cy="${SY}" r="70" fill="url(#${sd})"/>`,
      });
    }

    // ---- far bluffs and the far shore -----------------------------------------------
    {
      const far = k.id('far'), mid = k.id('mid');
      parts.push({
        defs: k.linear(far, 90, [[0, '#C8B3D8'], [1, '#EBCFD3']]) + k.linear(mid, 90, [[0, '#B2A3D2'], [1, '#D7C0D6']]),
        svg: `<path d="${k.ridge({ y: 900, amp: 10, seed: 14, step: 30, bottom: 960, peaks: [[300, 120, 420, 1.2], [760, 60, 260], [1680, 100, 380, 1.2], [2040, 130, 300]] })}" fill="url(#${far})"/>`,
      });
      parts.push(k.haze(820, 120, '#FCE3C9', 0.75));
      // Far-bank tree line: a row of soft round crowns.
      const r = rng(77);
      let d = '';
      for (let x = -20; x < k.W + 30; x += 14 + r() * 16) {
        const rad = 9 + r() * 12 + (Math.abs(x - SX) < 140 ? -6 : 0);
        d += `M${n(x - rad)} ${HZ + 2}a${n(rad)} ${n(rad)} 0 0 1 ${n(rad * 2)} 0Z`;
      }
      parts.push({ svg: `<path d="M-20 ${HZ + 4}V${HZ - 6}H${k.W + 20}V${HZ + 4}Z" fill="url(#${mid})"/><path d="${d}" transform="translate(0 -6)" fill="url(#${mid})"/>` });
    }

    // ---- the river -------------------------------------------------------------------
    {
      const river = k.id('river'), path = k.id('glit');
      parts.push({
        defs: k.linear(river, 90, [[0, '#CBB9DE'], [0.12, '#ABA4DE'], [0.4, '#8186D8'], [0.75, '#5C63C8'], [1, '#474FB4']]) +
          k.radial(path, '50%', '0%', '100%', [[0, '#FFE3AE', 0.95], [0.35, '#F8C894', 0.55], [1, '#F2B58A', 0]]),
        svg: `<rect x="-20" y="${HZ - 2}" width="${k.W + 40}" height="${k.H - HZ + 30}" fill="url(#${river})"/>` +
          // Warm reflected light: a widening wedge below the sun.
          `<path d="M${SX - 40} ${HZ}L${SX + 40} ${HZ}L${SX + 330} ${k.H + 10}L${SX - 330} ${k.H + 10}Z" fill="url(#${path})"/>`,
      });
      // Ripples: soft lighter dashes everywhere, and gold glitter in the path.
      const r = rng(4242);
      let rip = '', glit = '', deep = '';
      for (let i = 0; i < 520; i++) {
        const t = r();
        const y = HZ + 8 + (k.H - HZ) * t * t;
        const x = -20 + r() * (k.W + 40);
        const L = 10 + 70 * t + r() * 30 * t;
        const th = 1.2 + 3.6 * t;
        (r() < 0.55 ? rip : deep) !== null;
        if (r() < 0.6) rip += `M${n(x)} ${n(y)}h${n(L)}`;
        else deep += `M${n(x)} ${n(y)}h${n(L * 0.8)}`;
        void th;
      }
      for (let i = 0; i < 260; i++) {
        const t = r();
        const y = HZ + 6 + (k.H - HZ) * t * t;
        const half = 30 + 300 * t * t + 20;
        const x = SX + (r() - 0.5) * 2 * half * (0.4 + 0.6 * r());
        const L = 8 + 60 * t * (0.4 + r());
        glit += `M${n(x - L / 2)} ${n(y)}h${n(L)}`;
      }
      parts.push({
        svg: `<path d="${rip}" stroke="#D9D3F4" stroke-width="3" stroke-opacity="0.35" stroke-linecap="round"/>` +
          `<path d="${deep}" stroke="#3E46A6" stroke-width="3" stroke-opacity="0.28" stroke-linecap="round"/>` +
          `<path d="${glit}" stroke="#FFE9BE" stroke-width="3.5" stroke-opacity="0.8" stroke-linecap="round"/>`,
      });
    }

    // ---- left page: the near bank ----------------------------------------------------
    const shore = [[-20, 1000], [180, 994], [400, 1000], [600, 1014], [780, 1040], [880, 1080], [950, 1160], [990, 1300], [1010, 1460], [1016, 1600]];
    const land = k.id('land');
    {
      const lg = k.id('lg'), mud = k.id('mud');
      parts.push({
        defs: `<clipPath id="${land}"><path d="${band(shore)}"/></clipPath>` +
          k.linear(lg, 90, [[0, '#D9D59A'], [1, '#B9C98C']]) +
          k.linear(mud, 0, [[0, '#E6C9A6'], [1, '#C9A98E']]),
        svg: `<path d="${band(shore.map((p) => [p[0], p[1] - 6]))}" fill="url(#${mud})"/>` +
          `<path d="${band(shore)}" fill="url(#${lg})"/>`,
      });
    }

    // Fields, clipped to the land.
    const F2 = [[-20, 1060], [200, 1046], [420, 1066], [640, 1098], [860, 1140], [1040, 1200]];
    const F3 = [[-20, 1214], [240, 1184], [520, 1206], [780, 1262], [1040, 1340]];
    const F4 = [[-20, 1390], [300, 1360], [640, 1398], [1040, 1490]];
    {
      const g2 = k.id('f2'), g3 = k.id('f3'), g4 = k.id('f4');
      let s = `<g clip-path="url(#${land})">`;
      // F2 — a mown hay field, gold, mowing stripes following the contour.
      s += `<path d="${band(F2)}" fill="url(#${g2})"/>`;
      let rows = '';
      for (let i = 1; i < 9; i++) {
        const off = i * i * 3.2 + i * 7;
        rows += smooth(F2.map((p) => [p[0], p[1] + off]));
      }
      s += `<path d="${rows}" fill="none" stroke="#D7A04E" stroke-width="5" stroke-opacity="0.35"/>`;
      // F3 — green crop rows radiating from a vanishing point beyond the bank.
      s += `<path d="${band(F3)}" fill="url(#${g3})"/>`;
      let cr = '';
      const VPx = 1500, VPy = 1060;
      for (let i = -40; i < 40; i++) {
        const bx = -400 + i * 46 + 1840;
        cr += `M${VPx} ${VPy}L${n(bx - 1500)} ${k.H + 20}`;
      }
      s += `<clipPath id="${g3}c"><path d="${band(F3)}"/></clipPath>`;
      s += `<path clip-path="url(#${g3}c)" d="${cr}" fill="none" stroke="#7FA36A" stroke-width="7" stroke-opacity="0.45"/>`;
      // F4 — the near wheat: gold with fine stalk strokes.
      s += `<path d="${band(F4)}" fill="url(#${g4})"/>`;
      const r = rng(818);
      let st = '';
      for (let i = 0; i < 420; i++) {
        const x = -20 + r() * 1060, y = 1370 + r() * 210;
        const L = 16 + r() * 22;
        st += `M${n(x)} ${n(y)}q${n(2 - r() * 4)} ${n(-L / 2)} ${n(3 - r() * 6)} ${n(-L)}`;
      }
      s += `<path d="${st}" fill="none" stroke="#C98E3E" stroke-width="2.6" stroke-opacity="0.5" stroke-linecap="round"/>`;
      s += `</g>`;
      parts.push({
        defs: k.linear(g2, 90, [[0, '#F6D88E'], [1, '#EDBE6A']]) +
          k.linear(g3, 90, [[0, '#C3D08A'], [1, '#9DBB7A']]) +
          k.linear(g4, 90, [[0, '#F4C977'], [1, '#E7A85D']]),
        svg: s,
      });
    }

    // Small far-bank trees along the near shore, right of the barn.
    function roundTree(x, y, r, dark, light, seed) {
      const rr = rng(seed);
      let s = `<path d="M${n(x)} ${n(y)}V${n(y - r * 1.1)}" stroke="#6E5A7A" stroke-width="${n(r * 0.16)}" stroke-linecap="round"/>`;
      const blobs = [[0, -1.5, 1], [-0.6, -1.15, 0.75], [0.6, -1.1, 0.78], [0.1, -2.15, 0.7]];
      for (const b of blobs) s += `<circle cx="${n(x + b[0] * r)}" cy="${n(y + b[1] * r)}" r="${n(b[2] * r)}" fill="${dark}"/>`;
      for (const b of blobs) s += `<circle cx="${n(x + b[0] * r + r * 0.18)}" cy="${n(y + b[1] * r - r * 0.12)}" r="${n(b[2] * r * 0.72)}" fill="${light}" fill-opacity="${n(0.55 + rr() * 0.2)}"/>`;
      return s;
    }
    parts.push({ svg: roundTree(880, 1050, 26, '#6F8A6E', '#B7C08A', 3) + roundTree(930, 1078, 20, '#6F8A6E', '#B7C08A', 4) + roundTree(840, 1040, 18, '#7C9478', '#C3C690', 5) });

    // ---- the cottonwood, framing the left edge -------------------------------------
    {
      const bark = k.id('bark'), leafD = k.id('leafd'), leafL = k.id('leafl');
      const tx = 170, ty = 1092;
      let s = '';
      // Trunk and forked boughs (one fat stroke path, then a lit edge).
      const boughs = [
        [[tx - 10, ty + 10], [tx - 6, ty - 120], [tx - 30, ty - 260], [tx - 110, ty - 420]],
        [[tx + 4, ty - 150], [tx + 50, ty - 300], [tx + 130, ty - 440], [tx + 200, ty - 520]],
        [[tx - 22, ty - 230], [tx - 10, ty - 380], [tx + 20, ty - 520], [tx + 10, ty - 640]],
        [[tx - 50, ty - 330], [tx - 140, ty - 420], [tx - 210, ty - 470]],
      ];
      const widths = [58, 34, 30, 22];
      boughs.forEach((b, i) => {
        s += `<path d="${smooth(b)}" fill="none" stroke="url(#${bark})" stroke-width="${widths[i]}" stroke-linecap="round"/>`;
      });
      s += `<path d="${smooth([[tx + 16, ty + 6], [tx + 18, ty - 120], [tx + 2, ty - 240]])}" fill="none" stroke="#F3C79A" stroke-width="7" stroke-opacity="0.55" stroke-linecap="round"/>`;
      s += `<path d="M${tx - 30} ${ty - 40}q6 -40 0 -80M${tx - 12} ${ty - 10}q-4 -50 4 -110M${tx + 2} ${ty - 60}q4 -30 -2 -70" fill="none" stroke="#4E3F6C" stroke-width="3" stroke-opacity="0.45" stroke-linecap="round"/>`;
      // Crown: loose clumps, dark underneath, lit apricot-gold on the sun side.
      const clumps = [
        [-90, -470, 150], [60, -560, 170], [200, -520, 120], [-170, -560, 120], [-20, -700, 150], [150, -720, 110],
        [-140, -720, 100], [260, -620, 90], [-230, -420, 90], [70, -400, 110], [-40, -850, 90], [90, -860, 80],
      ];
      const rr = rng(1903);
      let dark = '', mid = '', lite = '', dabs = '';
      for (const c of clumps) {
        const x = tx + c[0], y = ty + c[1], R = c[2];
        dark += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(R)}"/>`;
        mid += `<circle cx="${n(x + R * 0.12)}" cy="${n(y - R * 0.1)}" r="${n(R * 0.86)}"/>`;
        lite += `<circle cx="${n(x + R * 0.32)}" cy="${n(y - R * 0.28)}" r="${n(R * 0.52)}"/>`;
        // Leaf dabs: small triangles (cottonwood leaves) scattered on the lit side.
        for (let j = 0; j < 26; j++) {
          const a = -1.6 + rr() * 2.4, d = R * (0.4 + rr() * 0.6);
          const lx = x + Math.cos(a) * d, ly = y + Math.sin(a) * d * 0.9;
          const s2 = 7 + rr() * 6, rot = rr() * 6.28;
          dabs += `M${n(lx + Math.cos(rot) * s2)} ${n(ly + Math.sin(rot) * s2)}L${n(lx + Math.cos(rot + 2.2) * s2)} ${n(ly + Math.sin(rot + 2.2) * s2)}L${n(lx + Math.cos(rot + 4.2) * s2)} ${n(ly + Math.sin(rot + 4.2) * s2)}Z`;
        }
      }
      s += `<g fill="url(#${leafD})">${dark}</g><g fill="#5E8E6A" fill-opacity="0.9">${mid}</g><g fill="url(#${leafL})" fill-opacity="0.85">${lite}</g>`;
      s += `<path d="${dabs}" fill="#E3D58E" fill-opacity="0.55"/>`;
      // A few twigs and gaps showing sky through the crown.
      s += `<path d="${smooth([[tx + 120, ty - 460], [tx + 190, ty - 500], [tx + 240, ty - 560]])}" fill="none" stroke="#5B4A72" stroke-width="7" stroke-linecap="round"/>`;
      parts.push({
        defs: k.linear(bark, 0, [[0, '#5D4C78'], [0.6, '#8D7896'], [1, '#C9A08A']]) +
          k.linear(leafD, 90, [[0, '#3F7766'], [1, '#2C5A58']]) +
          k.linear(leafL, 30, [[0, '#9EBF7E'], [1, '#E7D48C']]),
        svg: s,
      });
    }

    // ---- silo and barn -------------------------------------------------------------
    {
      const siloG = k.id('silo'), domeG = k.id('dome'), redF = k.id('redf'), redS = k.id('reds'), roofF = k.id('rooff'), roofS = k.id('roofs');
      let s = '';
      // Yard and lane.
      s += `<ellipse cx="610" cy="1116" rx="300" ry="34" fill="#B5C98A"/>`;
      s += `<path d="M560 1118C540 1180 470 1240 430 1300C390 1360 370 1420 360 1600L470 1600C470 1430 500 1350 540 1290C580 1230 600 1170 600 1118Z" fill="#E9CCA4" fill-opacity="0.9"/>`;
      // Shadows cast to the left, away from the sun.
      s += `<path d="M440 1112L300 1132L330 1150L700 1140L700 1112Z" fill="#6E5A9A" fill-opacity="0.18"/>`;
      // Silo (behind-left of the barn): a blue cylinder with a pale dome.
      const sx0 = 360, sx1 = 444, stop = 724, sb = 1108;
      s += `<rect x="${sx0}" y="${stop}" width="${sx1 - sx0}" height="${sb - stop}" fill="url(#${siloG})"/>`;
      let ribs = '';
      for (let y = stop + 34; y < sb; y += 34) ribs += `M${sx0} ${y}q${(sx1 - sx0) / 2} 7 ${sx1 - sx0} 0`;
      s += `<path d="${ribs}" fill="none" stroke="#1E2A82" stroke-width="2.5" stroke-opacity="0.5"/>`;
      s += `<path d="M${sx1 - 18} ${stop + 8}V${sb - 6}" stroke="#A9B6FF" stroke-width="6" stroke-opacity="0.5"/>`;
      s += `<path d="M${sx0 - 3} ${stop}Q${(sx0 + sx1) / 2} ${stop - 64} ${sx1 + 3} ${stop}Z" fill="url(#${domeG})"/>`;
      s += `<rect x="${(sx0 + sx1) / 2 - 7}" y="${stop - 60}" width="14" height="10" rx="3" fill="#8F95C9"/>`;
      // Barn: gable end facing us, the long side receding right into the light.
      const L = 452, R = 708, base = 1114, eave = 966, brk = 884, peak = 828, bx = 24;
      const cx = (L + R) / 2;
      const gable = `M${L} ${base}V${eave}L${L + bx} ${brk}L${cx} ${peak}L${R - bx} ${brk}L${R} ${eave}V${base}Z`;
      // Side wall and roof planes (receding to x≈850).
      const SR = 852, sEave = 984, sBase = 1104, sBrk = 912, sPeak = 860;
      s += `<path d="M${R} ${eave}L${SR} ${sEave}L${SR} ${sBase}L${R} ${base}Z" fill="url(#${redS})"/>`;
      // Side windows, catching the sun.
      for (let i = 0; i < 3; i++) {
        const wx = R + 26 + i * 42, wy = eave + 46 + i * 2.5;
        s += `<path d="M${wx} ${wy}l22 3v26l-22 -3Z" fill="#FFE2B0"/><path d="M${wx} ${wy}l22 3v26l-22 -3Z" fill="none" stroke="#FFF6EA" stroke-width="3"/>`;
      }
      s += `<path d="M${R} ${base - 52}L${SR} ${sBase - 46}" stroke="#FFF6EA" stroke-width="3" stroke-opacity="0.5"/>`;
      s += `<path d="M${R} ${eave}L${R - bx} ${brk}L${SR - 22} ${sBrk}L${SR + 6} ${sEave + 2}Z" fill="url(#${roofS})"/>`;
      s += `<path d="M${R - bx} ${brk}L${cx} ${peak}L${SR - 120} ${sPeak}L${SR - 22} ${sBrk}Z" fill="url(#${roofS})" fill-opacity="0.85"/>`;
      s += `<path d="M${R - bx} ${brk}L${SR - 22} ${sBrk}" stroke="#2F3586" stroke-width="3" stroke-opacity="0.4"/>`;
      s += `<path d="M${cx} ${peak}L${SR - 120} ${sPeak}" stroke="#FFE3C0" stroke-width="4" stroke-opacity="0.7"/>`;
      // Vertical siding on the side.
      let sid = '';
      for (let x = R + 14; x < SR; x += 14) sid += `M${x} ${n(eave + (x - R) * (sEave - eave) / (SR - R))}V${n(base - (x - R) * (base - sBase) / (SR - R))}`;
      s += `<path d="${sid}" stroke="#B0414E" stroke-width="2" stroke-opacity="0.35"/>`;
      // Gable front.
      s += `<path d="${gable}" fill="url(#${redF})"/>`;
      let fsid = '';
      for (let x = L + 13; x < R; x += 13) fsid += `M${x} ${base}V${n(Math.max(peak + 4, x < cx ? brk - (x - L - bx) * (brk - peak) / (cx - L - bx) : brk - (R - bx - x) * (brk - peak) / (R - bx - cx)))}`;
      s += `<path d="${fsid}" stroke="#8E3048" stroke-width="2" stroke-opacity="0.3" clip-path="url(#${redF}c)"/>`;
      s += `<clipPath id="${redF}c"><path d="${gable}"/></clipPath>`;
      // Roof edge seen at the gable (thin dark fascia) and white trim.
      s += `<path d="M${L - 10} ${eave + 6}L${L + bx - 2} ${brk - 2}L${cx} ${peak - 8}L${R - bx + 2} ${brk - 2}L${R + 10} ${eave + 6}" fill="none" stroke="url(#${roofF})" stroke-width="16" stroke-linejoin="round"/>`;
      s += `<path d="M${L} ${eave + 14}L${L + bx + 4} ${brk + 6}L${cx} ${peak + 6}L${R - bx - 4} ${brk + 6}L${R} ${eave + 14}" fill="none" stroke="#FFF6EE" stroke-width="5" stroke-linejoin="round"/>`;
      s += `<path d="M${L + 2} ${eave + 14}V${base}M${R - 2} ${eave + 14}V${base}" stroke="#FFF6EE" stroke-width="5"/>`;
      // Big doors with white X-bracing; hayloft door above.
      const dL = cx - 64, dR = cx + 64, dT = 990;
      s += `<rect x="${dL}" y="${dT}" width="${dR - dL}" height="${base - dT}" fill="#B23F4B"/>`;
      s += `<path d="M${dL} ${dT}H${dR}V${base}H${dL}ZM${cx} ${dT}V${base}M${dL} ${dT}L${cx} ${base}M${cx} ${dT}L${dL} ${base}M${cx} ${dT}L${dR} ${base}M${dR} ${dT}L${cx} ${base}" fill="none" stroke="#FFF6EE" stroke-width="5"/>`;
      s += `<path d="M${dL - 8} ${dT - 8}H${dR + 8}" stroke="#4B4F9E" stroke-width="5" stroke-linecap="round"/>`;
      const hL = cx - 26, hR = cx + 26, hT = 888, hB = 948;
      s += `<rect x="${hL}" y="${hT}" width="52" height="${hB - hT}" fill="#7A2C47"/>`;
      s += `<path d="M${hL} ${hT}H${hR}V${hB}H${hL}ZM${hL} ${hT}L${hR} ${hB}M${hR} ${hT}L${hL} ${hB}" fill="none" stroke="#FFF6EE" stroke-width="4"/>`;
      // Hay hood at the peak.
      s += `<path d="M${cx - 30} ${peak + 34}L${cx} ${peak + 4}L${cx + 30} ${peak + 34}L${cx + 30} ${peak + 44}L${cx} ${peak + 16}L${cx - 30} ${peak + 44}Z" fill="#3E4392"/>`;
      // Cupola on the ridge, with a weathervane.
      const cpx = cx + 66, cpy = peak + 6;
      s += `<path d="M${cpx - 18} ${cpy}V${cpy - 34}H${cpx + 22}V${cpy + 4}Z" fill="#F5E9E4"/><path d="M${cpx - 4} ${cpy - 30}h12v18h-12Z" fill="#7A6AA6"/>`;
      s += `<path d="M${cpx - 26} ${cpy - 32}L${cpx + 2} ${cpy - 54}L${cpx + 30} ${cpy - 32}Z" fill="#3E4392"/>`;
      s += `<path d="M${cpx + 2} ${cpy - 54}V${cpy - 86}M${cpx - 14} ${cpy - 76}h30" stroke="#2A2F6E" stroke-width="3"/><path d="M${cpx + 16} ${cpy - 76}l-8 -6v12Z" fill="#2A2F6E"/>`;
      // Sun-catching edge on the gable's right side.
      s += `<path d="M${R - 3} ${eave + 16}V${base}" stroke="#FFB08A" stroke-width="5" stroke-opacity="0.6"/>`;
      parts.push({
        defs: k.linear(siloG, 0, [[0, '#26318E'], [0.55, '#3C4CC0'], [0.82, '#6C7EE6'], [1, '#3F4FC0']]) +
          k.linear(domeG, 0, [[0, '#B7B8DF'], [0.7, '#F4F2FB'], [1, '#D9D7F0']]) +
          k.linear(redF, 90, [[0, '#C84A55'], [0.7, '#D45A55'], [1, '#B6434F']]) +
          k.linear(redS, 0, [[0, '#E76B5B'], [1, '#F59A72']]) +
          k.linear(roofF, 0, [[0, '#2E3488'], [1, '#4B52B0']]) +
          k.linear(roofS, 90, [[0, '#5E66C4'], [1, '#8C8FD8']]),
        svg: s,
      });
    }

    // Round hay bales in the gold field, lit on the right, shadows to the left.
    {
      const hb = k.id('hb'), face = k.id('face');
      let s = '';
      const bales = [[110, 1110, 26], [200, 1128, 30], [800, 1160, 30], [890, 1190, 34], [700, 1176, 28]];
      for (const [x, y, r] of bales) {
        s += `<ellipse cx="${x - r * 0.8}" cy="${y + r * 0.95}" rx="${r * 1.5}" ry="${r * 0.28}" fill="#7A5E8E" fill-opacity="0.25"/>`;
        s += `<path d="M${x - r * 0.9} ${y + r}V${y - r * 0.6}Q${x - r * 0.9} ${y - r * 1.02} ${x - r * 0.3} ${y - r}H${x + r * 0.5}V${y + r}Z" fill="url(#${hb})"/>`;
        s += `<ellipse cx="${x + r * 0.5}" cy="${y}" rx="${r * 0.6}" ry="${r}" fill="url(#${face})"/>`;
        s += `<path d="M${x + r * 0.5} ${y}m0 -${r * 0.55}a${r * 0.32} ${r * 0.55} 0 1 1 -1 0M${x + r * 0.5} ${y}m0 -${r * 0.25}a${r * 0.15} ${r * 0.25} 0 1 1 -1 0" fill="none" stroke="#C88A3C" stroke-width="2" stroke-opacity="0.6"/>`;
      }
      parts.push({
        defs: k.linear(hb, 90, [[0, '#E9B866'], [1, '#C48A45']]) + k.radial(face, '45%', '45%', '60%', [[0, '#FFE6A8'], [1, '#EDB863']]),
        svg: s,
      });
    }

    // ---- right page: the steamboat --------------------------------------------------
    const BOW = 1172, STERN = 1810;
    const WX = 1924, WY = 1146, WR = 128;      // paddlewheel
    const ST1 = 1296, ST2 = 1350, STOP = 452;  // stacks

    // Reflection of the boat in the water, broken by ripples.
    {
      const r = rng(66);
      let lite = '', warm = '', dark = '';
      for (let y = WL + 6; y < WL + 220; y += 7) {
        const t = (y - WL) / 220;
        for (let x = BOW + 30; x < STERN + 10; x += 30 + r() * 60) {
          const L = 20 + r() * 60;
          if (t < 0.32) lite += `M${n(x)} ${n(y)}h${n(L)}`;
          else if (t < 0.7 && r() < 0.7) warm += `M${n(x)} ${n(y)}h${n(L * 0.8)}`;
        }
        if (t > 0.38) {
          for (const sx of [ST1, ST2]) if (r() < 0.75) dark += `M${n(sx - 16 + (r() - 0.5) * 10)} ${n(y)}h${n(22 + r() * 18)}`;
        }
      }
      for (let y = WL + 4; y < WL + 120; y += 7) {
        if (r() < 0.8) dark += `M${n(WX - WR * 0.8 + r() * 40)} ${n(y)}h${n(60 + r() * 80)}`;
      }
      parts.push({
        svg: `<path d="${lite}" stroke="#F4EEFF" stroke-width="5" stroke-opacity="0.55" stroke-linecap="round"/>` +
          `<path d="${warm}" stroke="#F6D7C6" stroke-width="4" stroke-opacity="0.38" stroke-linecap="round"/>` +
          `<path d="${dark}" stroke="#7A2C5A" stroke-width="4" stroke-opacity="0.3" stroke-linecap="round"/>`,
      });
    }

    const B = { defs: '', svg: '' };
    {
      const hullG = k.id('hull'), wallG = k.id('wall'), slabG = k.id('slab'), inG = k.id('inner'), stackG = k.id('stack'),
        winG = k.id('win'), bucketG = k.id('bucket'), wheelSh = k.id('wsh'), pilotG = k.id('pilot'), smokeG = k.id('smoke'), goldG = k.id('gold');
      B.defs += k.linear(hullG, 90, [[0, '#FFFFFF'], [1, '#DCD6F0']]) +
        k.linear(wallG, 0, [[0, '#FFF6EA'], [0.5, '#F7F1F6'], [1, '#D9D3EE']]) +
        k.linear(slabG, 90, [[0, '#FFFDF8'], [0.55, '#F2ECF6'], [1, '#C7C0E4']]) +
        k.linear(inG, 90, [[0, '#4C4794'], [1, '#7C73B8']]) +
        k.linear(stackG, 0, [[0, '#4A4F9E'], [0.18, '#7C7FCB'], [0.36, '#2A2F78'], [1, '#141A4E']]) +
        k.linear(winG, 90, [[0, '#3C3F8E'], [1, '#6D6AB4']]) +
        k.linear(bucketG, 0, [[0, '#F2735F'], [1, '#C93B45']]) +
        k.radial(wheelSh, '30%', '30%', '85%', [[0.4, '#1A1650', 0], [1, '#1A1650', 0.45]]) +
        k.linear(pilotG, 0, [[0, '#FFF6EA'], [1, '#E2DCF2']]) +
        k.linear(goldG, 0, [[0, '#FFE08A'], [1, '#D99A33']]) +
        k.radial(smokeG, '35%', '35%', '70%', [[0, '#FFF1E2'], [0.55, '#E3D9EE'], [1, '#B8AED6']]);
      let s = '';
      const balusters = (x0, x1, y0, y1, step) => { let d = ''; for (let x = x0; x <= x1; x += step) d += `M${n(x)} ${y0}V${y1}`; return d; };

      // --- paddlewheel, behind the stern ---
      let wheel = '';
      wheel += `<circle cx="${WX}" cy="${WY}" r="${WR}" fill="#3B2A62" fill-opacity="0.35"/>`;
      const NB = 16;
      for (let i = 0; i < NB; i++) {
        const a = (i / NB) * 360 + 6;
        wheel += `<g transform="translate(${WX} ${WY}) rotate(${n(a)})"><path d="M0 0L${WR - 6} 0" stroke="#8E2B3A" stroke-width="5"/>` +
          `<rect x="${n(WR * 0.56)}" y="-9" width="${n(WR * 0.46)}" height="18" rx="2" fill="url(#${bucketG})"/>` +
          `<path d="M${n(WR * 0.56)} -9H${n(WR * 1.02)}" stroke="#FFB59A" stroke-width="3" stroke-opacity="0.7"/></g>`;
      }
      wheel += `<circle cx="${WX}" cy="${WY}" r="${n(WR * 0.58)}" fill="none" stroke="#9A2E3E" stroke-width="7"/>`;
      wheel += `<circle cx="${WX}" cy="${WY}" r="${n(WR * 0.98)}" fill="none" stroke="#9A2E3E" stroke-width="6"/>`;
      wheel += `<circle cx="${WX}" cy="${WY}" r="${n(WR * 0.78)}" fill="none" stroke="#9A2E3E" stroke-width="3" stroke-opacity="0.7"/>`;
      wheel += `<circle cx="${WX}" cy="${WY}" r="${WR + 4}" fill="url(#${wheelSh})"/>`;
      wheel += `<circle cx="${WX}" cy="${WY}" r="20" fill="#2A2766"/><circle cx="${WX}" cy="${WY}" r="9" fill="${C.gold}"/>`;
      // Cylinder timbers from the stern to the wheel shaft, and the pitman arm.
      wheel = `<path d="M${STERN - 20} ${WY - 34}H${WX + 8}M${STERN - 20} ${WY + 8}H${WX - 24}" stroke="#E8E2F4" stroke-width="12"/>` + wheel;
      wheel += `<path d="M${STERN - 30} ${WY - 18}L${WX - 22} ${WY - 6}" stroke="#2A2766" stroke-width="9" stroke-linecap="round"/>`;
      // Splash guard arching over the wheel.
      wheel += `<path d="M${WX - WR - 14} ${WY - 30}Q${WX - WR + 10} ${WY - WR - 24} ${WX} ${WY - WR - 22}Q${WX + WR - 10} ${WY - WR - 24} ${WX + WR + 14} ${WY - 30}" fill="none" stroke="#F4EFFA" stroke-width="10" stroke-linecap="round"/>`;
      wheel += `<path d="M${WX - WR - 14} ${WY - 30}Q${WX - WR + 10} ${WY - WR - 24} ${WX} ${WY - WR - 22}" fill="none" stroke="#FFD9B0" stroke-width="4" stroke-opacity="0.7" stroke-linecap="round"/>`;
      s += wheel;

      // --- hull ---
      const hull = `M${BOW} ${WL - 70}Q${BOW + 60} ${WL - 52} ${BOW + 140} ${WL - 50}H${STERN}V${WL}H${BOW + 34}Q${BOW + 14} ${WL - 30} ${BOW} ${WL - 70}Z`;
      s += `<path d="${hull}" fill="url(#${hullG})"/>`;
      s += `<path d="M${BOW + 10} ${WL - 52}Q${BOW + 70} ${WL - 36} ${BOW + 150} ${WL - 36}H${STERN}" fill="none" stroke="#D9524B" stroke-width="7"/>`;
      s += `<path d="M${BOW + 30} ${WL - 6}H${STERN}V${WL + 2}H${BOW + 34}Z" fill="#2A2F7A"/>`;
      s += `<path d="M${BOW + 20} ${WL - 14}H${STERN}" stroke="#2A2F7A" stroke-width="10"/>`;

      // --- main deck (open forward with cotton bales; cabin aft) ---
      const MD = WL - 52, MC = 1086;  // main deck floor, its ceiling
      s += `<rect x="${BOW + 54}" y="${MC}" width="${STERN - BOW - 54}" height="${MD - MC}" fill="url(#${inG})"/>`;
      // Aft cabin wall with windows.
      s += `<rect x="1540" y="${MC + 8}" width="${STERN - 1540}" height="${MD - MC - 8}" fill="url(#${wallG})"/>`;
      for (let x = 1556; x < STERN - 20; x += 34) s += `<rect x="${x}" y="${MC + 30}" width="16" height="40" rx="3" fill="url(#${winG})"/>`;
      // Cotton bales stacked forward.
      const rb = rng(1850);
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 6 - row; i++) {
          const bx = 1262 + i * 44 + row * 22, by = MD - 38 - row * 36;
          s += `<rect x="${bx}" y="${by}" width="40" height="34" rx="7" fill="${rb() < 0.5 ? '#FBF3E6' : '#F1E6DA'}"/><path d="M${bx + 12} ${by}v34M${bx + 28} ${by}v34" stroke="#B9A0B8" stroke-width="2.5"/>`;
        }
      }
      // Grand staircase at the bow.
      let stair = '';
      for (let i = 0; i < 7; i++) stair += `M${BOW + 70 + i * 8} ${MD - i * 14}h22`;
      s += `<path d="${stair}" stroke="#F4EFFA" stroke-width="5"/><path d="M${BOW + 64} ${MD}L${BOW + 130} ${MD - 104}" stroke="#F4EFFA" stroke-width="6"/>`;
      // Posts and gingerbread scallops.
      let posts = '', scal = '';
      for (let x = BOW + 70; x <= STERN; x += 54) {
        posts += `<rect x="${x - 3}" y="${MC}" width="6" height="${MD - MC}" fill="#FFFDF8"/>`;
        if (x + 54 <= STERN + 2) scal += `M${x} ${MC + 4}Q${x + 27} ${MC + 26} ${x + 54} ${MC + 4}`;
      }
      s += posts + `<path d="${scal}" fill="none" stroke="#FFFDF8" stroke-width="4"/>`;
      // Guard rail along the main deck.
      s += `<path d="M${BOW + 60} ${MD - 24}H${STERN}" stroke="#FFFDF8" stroke-width="4"/><path d="${balusters(BOW + 64, STERN, MD - 24, MD, 9)}" stroke="#FFFDF8" stroke-width="2"/>`;

      // --- boiler deck ---
      const BD = MC, BC = 984;
      s += `<rect x="${BOW + 34}" y="${BD - 4}" width="${STERN - BOW - 20}" height="16" fill="url(#${slabG})"/>`;
      s += `<rect x="${BOW + 34}" y="${BD + 12}" width="${STERN - BOW - 20}" height="5" fill="#3B3682" fill-opacity="0.35"/>`;
      s += `<rect x="1244" y="${BC}" width="${STERN - 1244}" height="${BD - BC}" fill="url(#${wallG})"/>`;
      for (let x = 1258; x < STERN - 14; x += 30) {
        s += `<path d="M${x} ${BD - 10}V${BC + 26}A8 8 0 0 1 ${x + 16} ${BC + 26}V${BD - 10}Z" fill="url(#${winG})"/>`;
      }
      // Sun glints on the forward windows.
      for (let x = 1258; x < 1460; x += 30) s += `<path d="M${x + 3} ${BC + 30}h4v26h-4Z" fill="#FFD9A6" fill-opacity="0.7"/>`;
      // Balustrade, posts and brackets.
      s += `<path d="M${BOW + 50} ${BD - 34}H${STERN + 4}" stroke="#FFFDF8" stroke-width="5"/>`;
      s += `<path d="${balusters(BOW + 52, STERN, BD - 34, BD - 4, 7)}" stroke="#FFFDF8" stroke-width="2.4"/>`;
      let bp = '', br = '';
      for (let x = BOW + 50; x <= STERN + 4; x += 64) {
        bp += `<rect x="${x - 3}" y="${BC - 6}" width="6" height="${BD - BC + 4}" fill="#FFFDF8"/>`;
        br += `M${x - 22} ${BC + 6}Q${x - 4} ${BC + 6} ${x - 3} ${BC + 26}M${x + 22} ${BC + 6}Q${x + 4} ${BC + 6} ${x + 3} ${BC + 26}`;
      }
      s += bp + `<path d="${br}" fill="none" stroke="#FFFDF8" stroke-width="3.5"/>`;

      // --- hurricane deck slab ---
      const HD = BC;
      s += `<rect x="${BOW + 50}" y="${HD - 14}" width="${STERN - BOW - 34}" height="16" fill="url(#${slabG})"/>`;
      s += `<rect x="${BOW + 50}" y="${HD + 2}" width="${STERN - BOW - 34}" height="5" fill="#3B3682" fill-opacity="0.3"/>`;
      s += `<path d="M${BOW + 50} ${HD - 14}H${STERN + 16}" stroke="#FFE2C2" stroke-width="3" stroke-opacity="0.8"/>`;

      // --- texas deck ---
      const TX0 = 1388, TX1 = 1748, TD = HD - 14, TC = 904;
      s += `<rect x="${TX0}" y="${TC}" width="${TX1 - TX0}" height="${TD - TC}" fill="url(#${wallG})"/>`;
      for (let x = TX0 + 14; x < TX1 - 14; x += 28) s += `<rect x="${x}" y="${TC + 18}" width="14" height="28" rx="2" fill="url(#${winG})"/>`;
      s += `<path d="M${TX0 - 20} ${TD - 26}H${TX1 + 20}" stroke="#FFFDF8" stroke-width="4"/><path d="${balusters(TX0 - 18, TX1 + 18, TD - 26, TD, 7)}" stroke="#FFFDF8" stroke-width="2.2"/>`;
      s += `<rect x="${TX0 - 26}" y="${TC - 12}" width="${TX1 - TX0 + 52}" height="13" fill="url(#${slabG})"/>`;
      s += `<path d="M${TX0 - 26} ${TC - 12}H${TX1 + 26}" stroke="#FFE2C2" stroke-width="3" stroke-opacity="0.8"/>`;

      // --- pilothouse ---
      const P0 = 1428, P1 = 1528, PT = 820, PB = TC - 12;
      s += `<rect x="${P0}" y="${PT}" width="${P1 - P0}" height="${PB - PT}" fill="url(#${pilotG})"/>`;
      for (let i = 0; i < 3; i++) s += `<rect x="${P0 + 10 + i * 28}" y="${PT + 14}" width="22" height="40" rx="2" fill="#FFD9A0"/><rect x="${P0 + 10 + i * 28}" y="${PT + 14}" width="22" height="40" rx="2" fill="#7B6FB8" fill-opacity="${0.15 + i * 0.25}"/>`;
      s += `<path d="M${P0 - 16} ${PT + 2}Q${(P0 + P1) / 2} ${PT - 22} ${P1 + 16} ${PT + 2}V${PT + 10}H${P0 - 16}Z" fill="#FFFDF8"/>`;
      s += `<path d="M${P0 - 16} ${PT + 10}H${P1 + 16}" stroke="#3B3682" stroke-width="3" stroke-opacity="0.35"/>`;
      // Gilded finial / spread eagle in silhouette above the pilothouse.
      const fx = (P0 + P1) / 2;
      s += `<path d="M${fx} ${PT - 12}V${PT - 36}" stroke="url(#${goldG})" stroke-width="4"/>`;
      s += `<path d="M${fx - 26} ${PT - 46}Q${fx - 10} ${PT - 40} ${fx} ${PT - 34}Q${fx + 10} ${PT - 40} ${fx + 26} ${PT - 46}Q${fx + 14} ${PT - 30} ${fx} ${PT - 26}Q${fx - 14} ${PT - 30} ${fx - 26} ${PT - 46}Z" fill="url(#${goldG})"/>`;
      s += `<circle cx="${fx}" cy="${PT - 40}" r="6" fill="url(#${goldG})"/>`;

      // --- stacks with feathered crowns ---
      function stack(x, top, w, far) {
        let g = '';
        const bot = HD - 14;
        g += `<rect x="${x - w / 2}" y="${top + 40}" width="${w}" height="${bot - top - 40}" fill="url(#${stackG})"${far ? ' fill-opacity="0.92"' : ''}/>`;
        // Crown: a flared collar cut into feathers.
        let cr = `M${x - w / 2} ${top + 46}`;
        const cw = w * 1.9, pts = 7;
        cr += `L${x - cw / 2} ${top + 8}`;
        for (let i = 0; i < pts; i++) {
          const x0 = x - cw / 2 + (cw * i) / pts, x1 = x0 + cw / pts;
          cr += `L${n((x0 + x1) / 2)} ${top - 12}L${n(x1)} ${top + 8}`;
        }
        cr += `L${x + w / 2} ${top + 46}Z`;
        g += `<path d="${cr}" fill="url(#${stackG})"/>`;
        g += `<path d="M${x - cw / 2} ${top + 8}H${x + cw / 2}" stroke="url(#${goldG})" stroke-width="5"/>`;
        g += `<rect x="${x - w / 2 - 3}" y="${top + 44}" width="${w + 6}" height="8" fill="url(#${goldG})"/>`;
        g += `<rect x="${x - w / 2 - 2}" y="${bot - 70}" width="${w + 4}" height="7" fill="url(#${goldG})"/>`;
        g += `<path d="M${x - w / 2 + 6} ${top + 60}V${bot - 80}" stroke="#B7B9F2" stroke-width="4" stroke-opacity="0.45"/>`;
        return g;
      }
      const sw = 36;
      // Spreader bar between them, with a gilded star.
      s += stack(ST2, STOP + 8, sw, true);
      s += stack(ST1, STOP, sw, false);
      s += `<path d="M${ST1} 572H${ST2}" stroke="#1E2460" stroke-width="5"/>`;
      s += k.star((ST1 + ST2) / 2, 572, 16, '#E9B44C');

      // --- jackstaff and stern flag ---
      s += `<path d="M${BOW + 8} ${WL - 66}L${BOW + 2} ${WL - 170}" stroke="#2A2F6E" stroke-width="4" stroke-linecap="round"/>`;
      s += `<path d="M${BOW + 2} ${WL - 168}L${BOW + 46} ${WL - 160}L${BOW + 4} ${WL - 148}Z" fill="#D9524B"/>`;
      const fpx = TX1 + 10, fpy = TC - 12;
      s += `<path d="M${fpx} ${fpy}V${fpy - 110}" stroke="#2A2F6E" stroke-width="4"/>`;
      let stripes = '';
      for (let i = 0; i < 7; i++) stripes += `<path d="M${fpx} ${fpy - 108 + i * 6}q16 6 32 0t32 0" stroke="${i % 2 ? '#FFFFFF' : '#D9524B'}" stroke-width="6" fill="none"/>`;
      s += stripes + `<path d="M${fpx} ${fpy - 111}q14 5 28 1v22q-14 4 -28 -1Z" fill="#2E3A9C"/>`;

      // --- hog chains: the iron truss arcing over the decks ---
      s += `<path d="M${BOW + 70} ${MC + 4}Q1430 ${BC - 40} ${STERN - 20} ${MC + 4}" fill="none" stroke="#3A3A7A" stroke-width="3" stroke-opacity="0.35"/>`;

      // Rim light on the bow side of every deck (the sun is to the left).
      s += `<path d="M${BOW + 54} ${MC + 2}V${MD - 2}" stroke="#FFD2A6" stroke-width="5" stroke-opacity="0.7"/>`;
      s += `<path d="M1246 ${BC + 2}V${BD - 2}M${TX0 + 2} ${TC + 2}V${TD - 2}M${P0 + 2} ${PT + 12}V${PB}" stroke="#FFD2A6" stroke-width="4" stroke-opacity="0.75"/>`;

      // --- smoke drifting aft from the crowns ---
      const puffs = [[1300, 410, 26], [1344, 392, 34], [1400, 376, 42], [1470, 366, 48], [1550, 362, 52], [1636, 368, 52], [1722, 380, 48], [1800, 394, 42], [1868, 406, 34]];
      let sm = '';
      puffs.forEach(([x, y, r], i) => {
        const o = 0.92 - i * 0.075;
        sm += `<g fill-opacity="${n(o * 100) / 100}"><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${smokeG})"/><circle cx="${n(x + r * 0.7)}" cy="${n(y + r * 0.25)}" r="${n(r * 0.7)}" fill="url(#${smokeG})"/><circle cx="${n(x - r * 0.6)}" cy="${n(y + r * 0.3)}" r="${n(r * 0.6)}" fill="url(#${smokeG})"/></g>`;
      });
      s += sm;

      // --- water: bow wave, wheel churn and spray ---
      const r = rng(909);
      let foam = '';
      foam += `<path d="M${BOW + 20} ${WL - 4}Q${BOW - 20} ${WL + 6} ${BOW - 70} ${WL + 26}Q${BOW - 10} ${WL + 18} ${BOW + 60} ${WL + 8}Z" fill="#FFFFFF" fill-opacity="0.85"/>`;
      let wake = '';
      for (let i = 0; i < 4; i++) wake += `M${BOW + 40 + i * 60} ${WL + 14 + i * 6}Q${BOW - 40 + i * 30} ${WL + 50 + i * 14} ${BOW - 120 + i * 40} ${WL + 70 + i * 22}`;
      foam += `<path d="${wake}" fill="none" stroke="#F4F0FF" stroke-width="4" stroke-opacity="0.55" stroke-linecap="round"/>`;
      for (let i = 0; i < 46; i++) {
        const x = WX - WR - 10 + r() * (WR * 2 + 160), y = WL - 6 + r() * 26;
        foam += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(8 + r() * 16)}" fill="#FFFFFF" fill-opacity="${n(0.5 + r() * 0.45)}"/>`;
      }
      for (let i = 0; i < 26; i++) {
        const a = -0.2 - r() * 1.2, d = WR + 6 + r() * 50;
        foam += `<circle cx="${n(WX + Math.cos(a) * d)}" cy="${n(WY + Math.sin(a) * d * 0.9)}" r="${n(2 + r() * 4.5)}" fill="#FFFFFF" fill-opacity="${n(0.55 + r() * 0.4)}"/>`;
      }
      let trail = '';
      for (let i = 0; i < 18; i++) {
        const y = WL + 18 + i * 9, x = WX - 40 + r() * 80;
        trail += `M${n(x)} ${n(y)}h${n(60 + r() * 120)}`;
      }
      foam += `<path d="${trail}" stroke="#F4F0FF" stroke-width="5" stroke-opacity="0.5" stroke-linecap="round"/>`;
      s += foam;
      B.svg = s;
    }
    parts.push(B);

    // ---- right page: a grassy bank and cattails at the bottom-right ------------------
    {
      const bg = k.id('bank');
      const top = [[1500, 1600], [1640, 1500], [1800, 1446], [1960, 1418], [2110, 1404]];
      let s = `<path d="${smooth(top)}L2110 1600Z" fill="url(#${bg})"/>`;
      s += `<path d="${smooth(top.map((p) => [p[0], p[1] - 4]))}" fill="none" stroke="#E9CCA4" stroke-width="8"/>`;
      // Cattails.
      const r = rng(5150);
      for (let i = 0; i < 9; i++) {
        const x = 1640 + i * 26 + r() * 10, y = 1500 - i * 6, h = 150 + r() * 90;
        const lean = (r() - 0.6) * 30;
        s += `<path d="M${n(x)} ${n(y)}Q${n(x + lean * 0.3)} ${n(y - h * 0.5)} ${n(x + lean)} ${n(y - h)}" stroke="#4E7A5E" stroke-width="4" fill="none"/>`;
        s += `<rect x="${n(x + lean * 0.8 - 7)}" y="${n(y - h * 0.84)}" width="14" height="${n(h * 0.22)}" rx="7" fill="#7A4A52" transform="rotate(${n(lean * 0.25)} ${n(x + lean * 0.8)} ${n(y - h * 0.73)})"/>`;
        s += `<path d="M${n(x)} ${n(y)}q${n(-20 + r() * 40)} ${n(-h * 0.4)} ${n(-30 + r() * 60)} ${n(-h * 0.7)}" stroke="#6F9A6A" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      }
      parts.push({ defs: k.linear(bg, 90, [[0, '#B9CC8A'], [1, '#8FB27E']]), svg: s });
    }

    // ---- foreground: coneflowers and black-eyed Susans ------------------------------
    function cone(x, y, R, seed) {
      const rr = rng(seed);
      const pg = k.id('pet'), cg = k.id('cone');
      const defs = k.linear(pg, 90, [[0, '#8A4FB0'], [0.45, '#C47CCB'], [1, '#E9B2DA']]) +
        k.radial(cg, '40%', '30%', '70%', [[0, '#F2A35A'], [0.6, '#C4632E'], [1, '#7A3A2E']]);
      let back = '', front = '';
      const P = 13;
      for (let i = 0; i < P; i++) {
        const a = (i / P) * Math.PI * 2 + rr() * 0.2;
        const bx = x + Math.cos(a) * R * 0.32, by = y + Math.sin(a) * R * 0.14;
        // Petals droop: the tip goes outward and down.
        const L = R * (0.95 + rr() * 0.15);
        const tx = bx + Math.cos(a) * L * 0.78, ty = by + Math.sin(a) * L * 0.3 + L * 0.62;
        const px = -(ty - by), py = tx - bx, pl = Math.hypot(px, py) || 1;
        const w = R * 0.16;
        const ux = (px / pl) * w, uy = (py / pl) * w;
        const d = `M${n(bx - ux * 0.5)} ${n(by - uy * 0.5)}Q${n((bx + tx) / 2 - ux)} ${n((by + ty) / 2 - uy)} ${n(tx - ux * 0.35)} ${n(ty - uy * 0.35)}L${n(tx)} ${n(ty + 3)}L${n(tx + ux * 0.35)} ${n(ty + uy * 0.35)}Q${n((bx + tx) / 2 + ux)} ${n((by + ty) / 2 + uy)} ${n(bx + ux * 0.5)} ${n(by + uy * 0.5)}Z`;
        const p = `<path d="${d}" fill="url(#${pg})"/>`;
        if (Math.sin(a) < 0) back += p; else front += p;
      }
      let c = `<path d="M${n(x - R * 0.36)} ${n(y + R * 0.05)}Q${n(x - R * 0.36)} ${n(y - R * 0.52)} ${n(x)} ${n(y - R * 0.52)}Q${n(x + R * 0.36)} ${n(y - R * 0.52)} ${n(x + R * 0.36)} ${n(y + R * 0.05)}Q${n(x)} ${n(y + R * 0.2)} ${n(x - R * 0.36)} ${n(y + R * 0.05)}Z" fill="url(#${cg})"/>`;
      let spikes = '';
      for (let i = 0; i < 30; i++) {
        const u = rr() * 2 - 1, v = rr();
        spikes += `<circle cx="${n(x + u * R * 0.3 * (1 - v * 0.4))}" cy="${n(y - R * 0.45 * v + R * 0.04)}" r="${n(R * 0.035)}" fill="${rr() < 0.5 ? '#FFC67A' : '#5A2A2A'}" fill-opacity="0.75"/>`;
      }
      return { defs, svg: back + front + c + spikes };
    }
    function susan(x, y, R, seed) {
      const rr = rng(seed);
      const pg = k.id('sus'), cg = k.id('eye');
      const defs = k.linear(pg, 90, [[0, '#E39A2B'], [0.5, '#F6BE3E'], [1, '#FFDD72']]) +
        k.radial(cg, '35%', '30%', '70%', [[0, '#7A4A62'], [1, '#2A1A36']]);
      let s = '';
      const P = 13;
      for (let i = 0; i < P; i++) {
        const a = (i / P) * Math.PI * 2 + rr() * 0.15;
        const L = R * (0.9 + rr() * 0.15);
        const tx = x + Math.cos(a) * L, ty = y + Math.sin(a) * L * 0.62 + L * 0.18;
        const ang = Math.atan2(ty - y, tx - x) * 57.3;
        const len = Math.hypot(tx - x, ty - y);
        s += `<path transform="translate(${n(x)} ${n(y)}) rotate(${n(ang)})" d="M0 -${n(R * 0.1)}Q${n(len * 0.55)} -${n(R * 0.2)} ${n(len)} -${n(R * 0.05)}L${n(len - 4)} 0L${n(len)} ${n(R * 0.06)}Q${n(len * 0.55)} ${n(R * 0.2)} 0 ${n(R * 0.1)}Z" fill="url(#${pg})"/>`;
      }
      s += `<ellipse cx="${n(x)}" cy="${n(y - R * 0.06)}" rx="${n(R * 0.3)}" ry="${n(R * 0.26)}" fill="url(#${cg})"/>`;
      s += `<ellipse cx="${n(x - R * 0.08)}" cy="${n(y - R * 0.14)}" rx="${n(R * 0.1)}" ry="${n(R * 0.06)}" fill="#C98AA8" fill-opacity="0.45"/>`;
      return { defs, svg: s };
    }
    function leafBlade(x, y, L, ang, fill) {
      return `<path transform="translate(${n(x)} ${n(y)}) rotate(${n(ang)})" d="M0 0Q${n(L * 0.45)} -${n(L * 0.16)} ${n(L)} 0Q${n(L * 0.45)} ${n(L * 0.16)} 0 0Z" fill="${fill}"/><path transform="translate(${n(x)} ${n(y)}) rotate(${n(ang)})" d="M2 0L${n(L * 0.9)} 0" stroke="#1E4A44" stroke-width="2" stroke-opacity="0.45"/>`;
    }
    function meadowCorner(corner, seed) {
      const rr = rng(seed);
      const left = corner === 'bl';
      const X = (x) => (left ? x : k.W - x);
      let defs = '', back = '', blooms = '';
      // Grass and leaves.
      let grass = '';
      for (let i = 0; i < 70; i++) {
        const x = X(-20 + rr() * 520), h = 90 + rr() * 260 * Math.max(0.2, 1 - (left ? X(x) : k.W - x) / 600);
        grass += `M${n(x)} ${k.H + 10}q${n((rr() - 0.5) * 40)} ${n(-h * 0.6)} ${n((rr() - 0.3) * 60 * (left ? 1 : -1))} ${n(-h)}`;
      }
      back += `<path d="${grass}" fill="none" stroke="#4E8A66" stroke-width="5" stroke-linecap="round" stroke-opacity="0.85"/>`;
      for (let i = 0; i < 22; i++) {
        const x = X(-10 + rr() * 460), y = k.H + 10 - rr() * 260;
        back += leafBlade(x, y, 70 + rr() * 60, (left ? -60 : 240) + (rr() - 0.5) * 90, rr() < 0.5 ? '#2F6E5E' : '#4E8C6E');
      }
      const spots = left
        ? [[120, 1300, 70, 'c'], [300, 1390, 62, 's'], [40, 1450, 58, 's'], [230, 1500, 74, 'c'], [420, 1490, 52, 's'], [380, 1270, 46, 'c'], [180, 1200, 44, 's'], [520, 1560, 50, 'c']]
        : [[110, 1330, 64, 'c'], [280, 1420, 56, 's'], [60, 1470, 62, 's'], [210, 1520, 72, 'c'], [400, 1520, 50, 's'], [330, 1290, 44, 'c'], [160, 1210, 46, 's']];
      spots.forEach((p, i) => {
        const x = X(p[0]), y = p[1];
        back += `<path d="M${n(x)} ${n(y + 10)}Q${n(x + (rr() - 0.5) * 30)} ${n((y + k.H) / 2)} ${n(x + (rr() - 0.5) * 50)} ${k.H + 20}" stroke="#2F6E5E" stroke-width="6" fill="none"/>`;
        const f = p[3] === 'c' ? cone(x, y, p[2], seed + i * 7) : susan(x, y, p[2], seed + i * 7);
        defs += f.defs;
        blooms += f.svg;
      });
      return { defs, svg: back + blooms };
    }
    parts.push(meadowCorner('bl', 61));
    parts.push(meadowCorner('br', 97));

    return k.spread(parts, { grain: 0.6 });
  },
};
