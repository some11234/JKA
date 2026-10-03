/* Visa pages 3–4 — Philadelphia, 1776.
   Left: the Liberty Bell hanging from its elm yoke — crack, lip band and
   clapper — bronze in warm apricot with violet shadows. Right: Independence
   Hall from the State House Yard: the red-brick facade, white trim, rows of
   sash windows, and Strickland's white clock tower and steeple. Mountain
   laurel (Pennsylvania's flower) frames the bottom corners. Morning light
   from the left (east). Quote (live text, see js/passport-data.js):
   Washington, "Let us raise a standard to which the wise and honest can
   repair...". */

'use strict';

module.exports = {
  pages: [3, 4],
  svg(k) {
    const { C, n, rng } = k;
    const parts = [];

    // ---- sky, security print -------------------------------------------------------
    parts.push(k.sky([[0, '#C9D9F1'], [0.3, '#D9E0F3'], [0.55, '#EEDDE3'], [0.74, '#FBE4D6'], [1, '#F8DCC6']]));
    parts.push(k.microtext('Proclaim Liberty', { y0: 40, y1: 920, opacity: 0.055 }));
    parts.push(k.guilloche({ y0: 110, y1: 860, lines: 22, opacity: 0.065, amp: 15, period: 680, phase: 1.3 }));

    // Glory behind the bell.
    const BX = 480, BY = 1082;          // bell: centre of the lip ellipse
    const glory = k.id('glory');
    parts.push({
      defs: k.radial(glory, '50%', '50%', '50%', [[0, '#FFF8EC', 1], [0.45, '#FCEBDC', 0.7], [1, '#F6DCCB', 0]]),
      svg: `<circle cx="${BX}" cy="760" r="560" fill="url(#${glory})"/>` +
        k.sunburst(BX, 760, 240, 760, 48, '#FFFFFF', 0.2) +
        k.rosette(BX, 760, 380, { opacity: 0.085, rings: 8, lobes: 36 }),
    });

    // A softer morning glow behind the steeple, answering the bell's glory.
    {
      const sg = k.id('sglow');
      parts.push({
        defs: k.radial(sg, '50%', '50%', '50%', [[0, '#FFF6EC', 0.85], [0.5, '#FCE6DC', 0.45], [1, '#F6DCCB', 0]]),
        svg: `<circle cx="1590" cy="660" r="470" fill="url(#${sg})"/>`,
      });
    }
    // A ring of the bell's inscription behind the steeple, like the motto
    // circling the Iowa capitol.
    const TX = 1590;                    // tower axis
    const ringP = k.id('ringp');
    const ringR = 318, ringCY = 640;
    parts.push({
      defs: `<path id="${ringP}" d="M${TX} ${ringCY + ringR}A${ringR} ${ringR} 0 1 1 ${TX} ${ringCY - ringR}A${ringR} ${ringR} 0 1 1 ${TX} ${ringCY + ringR}"/>`,
      svg: `<circle cx="${TX}" cy="${ringCY}" r="${ringR + 22}" fill="none" stroke="${C.ink}" stroke-opacity="0.13" stroke-width="1.6"/>` +
        `<circle cx="${TX}" cy="${ringCY}" r="${ringR - 30}" fill="none" stroke="${C.ink}" stroke-opacity="0.13" stroke-width="1.6"/>` +
        `<text font-family="Libre Caslon Text" font-size="23" letter-spacing="5.4" fill="${C.ink}" fill-opacity="0.26"><textPath href="#${ringP}">PROCLAIM LIBERTY THROUGHOUT ALL THE LAND UNTO ALL THE INHABITANTS THEREOF · LEV. XXV. X. · </textPath></text>`,
    });

    // Clouds and birds.
    parts.push({
      svg: k.cloud(880, 520, 34, '#FFFFFF', 0.5) + k.cloud(1180, 610, 26, '#FFFFFF', 0.45) +
        k.cloud(1990, 470, 30, '#FFFFFF', 0.5) + k.cloud(140, 330, 22, '#FFFFFF', 0.35) +
        k.bird(1300, 420, 16, '#6E67B0') + k.bird(1352, 392, 12, '#6E67B0') + k.bird(1880, 360, 14, '#6E67B0') +
        k.bird(900, 380, 13, '#6E67B0'),
    });

    // ---- land: far ridge, the old city in the haze, tree line, lawn ---------------
    const far = k.id('far'), mid = k.id('mid'), lawn = k.id('lawn');
    parts.push({
      defs: k.linear(far, 90, [[0, '#C3B8DE'], [1, '#E3D5E6']]) +
        k.linear(mid, 90, [[0, '#A9B6DE'], [1, '#CBCDE8']]) +
        k.linear(lawn, 90, [[0, '#C9D79B'], [0.45, '#D6DC9D'], [1, '#B4C98D']]),
      svg: `<path d="${k.ridge({ y: 1170, amp: 20, seed: 6, peaks: [[300, 90, 460], [1150, 60, 420], [1900, 110, 420]] })}" fill="url(#${far})"/>`,
    });
    // Colonial Philadelphia, faint: row-house gables and a few steeples
    // (Christ Church's among them) far off behind the bell.
    {
      const r = rng(1776);
      let d = '';
      let x = -10;
      while (x < k.W + 10) {
        const w = 26 + r() * 30, h = 26 + r() * 30, base = 1205;
        d += `M${n(x)} ${base}V${n(base - h)}L${n(x + w / 2)} ${n(base - h - 12 - r() * 8)}L${n(x + w)} ${n(base - h)}V${base}Z`;
        x += w + r() * 4;
      }
      const spire = (sx, sh) => `M${sx - 9} 1205V${1205 - sh}L${sx - 6} ${1205 - sh - 22}H${sx + 6}L${sx + 9} ${1205 - sh}V1205ZM${sx - 4} ${1205 - sh - 22}L${sx} ${1205 - sh - 92}L${sx + 4} ${1205 - sh - 22}Z`;
      d += spire(120, 70) + spire(820, 52) + spire(1230, 46);
      parts.push({ svg: `<path d="${d}" fill="#B6AFD8" fill-opacity="0.55"/>` });
    }
    parts.push(k.haze(1080, 220, '#FBEADC', 0.75));
    // Tree line of rounded deciduous crowns.
    {
      const r = rng(88);
      let d = '';
      for (let x = -40; x < k.W + 40; x += 28 + r() * 22) {
        const rr = 26 + r() * 26, y = 1222 - r() * 22;
        d += `M${n(x - rr)} ${n(y)}a${n(rr)} ${n(rr * 0.9)} 0 1 1 ${n(rr * 2)} 0Z`;
      }
      parts.push({ svg: `<path d="${d}" fill="url(#${mid})" fill-opacity="0.9"/><rect x="0" y="1218" width="${k.W}" height="60" fill="url(#${mid})" fill-opacity="0.9"/>` });
    }
    {
      let s = `<path d="${k.ridge({ y: 1262, amp: 8, seed: 21, step: 60, peaks: [[420, 26, 600], [1600, 12, 700]] })}" fill="url(#${lawn})"/>`;
      parts.push({ svg: s });
    }

    // ---- left page: the Liberty Bell -------------------------------------------------
    // Drawn in its own space: origin at the centre of the lip ellipse, the
    // bell's top 505 above. Seen from a little below, so the front lip is an
    // arch (∩) and the dark mouth and clapper show beneath it.
    const LR = 320, LRY = 50, BH = 505;
    const g = {
      bronze: k.id('bronze'), shade: k.id('bshade'), lipU: k.id('lipu'), mouth: k.id('mouth'),
      spec: k.id('spec'), wood: k.id('wood'), woodEnd: k.id('woodend'), iron: k.id('iron'), post: k.id('post'),
      crown: k.id('crown'), clap: k.id('clap'),
    };
    const bellDefs =
      k.linear(g.bronze, 0, [[0, '#5A4088'], [0.05, '#9C6080'], [0.13, '#E8966E'], [0.22, '#FFD2A2'], [0.3, '#F8B07C'],
        [0.45, '#E48E60'], [0.6, '#BE6862'], [0.74, '#8A4F74'], [0.88, '#4E3A7E'], [0.955, '#644A8C'], [1, '#F49A82']]) +
      k.linear(g.shade, 90, [[0, '#3C2A5E', 0.55], [0.16, '#3C2A5E', 0.12], [0.3, '#3C2A5E', 0], [0.82, '#FFD7A8', 0], [0.95, '#FFD7A8', 0.28], [1, '#6E4A86', 0.2]]) +
      k.linear(g.lipU, 0, [[0, '#7A4E78'], [0.25, '#E7A06C'], [0.6, '#B56A5A'], [1, '#5A3E7C']]) +
      k.radial(g.mouth, '50%', '20%', '80%', [[0, '#1E1434'], [0.7, '#2E1E48'], [1, '#4A2F5E']]) +
      k.linear(g.spec, 90, [[0, '#FFFFFF', 0], [0.2, '#FFF8EC', 0.85], [0.7, '#FFF6E6', 0.6], [1, '#FFFFFF', 0]]) +
      k.linear(g.wood, 90, [[0, '#86668A'], [0.08, '#5C3F62'], [0.6, '#41294C'], [1, '#2A1C3A']]) +
      k.linear(g.woodEnd, 0, [[0, '#2A1C3A'], [1, '#4E3558']]) +
      k.linear(g.iron, 0, [[0, '#2A2448'], [0.35, '#5D5890'], [0.6, '#34305A'], [1, '#1E1A38']]) +
      k.linear(g.post, 0, [[0, '#6D5078'], [0.3, '#4F3659'], [1, '#2B1D3B']]) +
      k.linear(g.crown, 0, [[0, '#7A5088'], [0.3, '#F2B07A'], [0.6, '#C27458'], [1, '#56397A']]) +
      k.linear(g.clap, 0, [[0, '#2A2244'], [0.4, '#6A5F9C'], [1, '#1E1834']]);

    // The right half of the bell's profile, top to lip, as cubic segments;
    // sampled so bands and highlights can follow the real outline.
    const SEGS = [
      [[0, -BH], [95, -BH], [150, -BH + 2], [182, -BH + 17]],
      [[182, -BH + 17], [206, -BH + 29], [211, -BH + 53], [211, -BH + 80]],
      [[211, -BH + 80], [212, -330], [220, -235], [237, -172]],
      [[237, -172], [254, -110], [282, -52], [322, -10]],
    ];
    const prof = [];
    for (const sg of SEGS) {
      for (let i = 0; i <= 40; i++) {
        const t = i / 40, u = 1 - t;
        const bx = u * u * u * sg[0][0] + 3 * u * u * t * sg[1][0] + 3 * u * t * t * sg[2][0] + t * t * t * sg[3][0];
        const by = u * u * u * sg[0][1] + 3 * u * u * t * sg[1][1] + 3 * u * t * t * sg[2][1] + t * t * t * sg[3][1];
        prof.push([bx, by]);
      }
    }
    function halfW(h) {
      const y = -h;
      if (y >= -10) return LR;
      for (let i = 1; i < prof.length; i++) {
        const a = prof[i - 1], b = prof[i];
        if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]);
      }
      return 0;
    }
    const segD = (sgs) => sgs.map((sg) => `C${sg[1].join(' ')} ${sg[2].join(' ')} ${sg[3].join(' ')}`).join('');
    const mirror = SEGS.slice().reverse().map((sg) => [sg[3], sg[2], sg[1], sg[0]].map((p) => [-p[0], p[1]]));
    const bodyD = `M0 ${-BH}${segD(SEGS)}L320 4A${LR} ${LRY} 0 0 0 -320 4L-322 -10${segD(mirror)}Z`;
    // A band (∩ arc) across the bell at height h: front of a horizontal circle.
    function bandD(h, inset) {
      const w = halfW(h) - (inset || 0);
      const sag = w * (0.135 + 0.03 * (h / BH));
      return `M${n(-w)} ${n(-h + 4)}Q0 ${n(-h + 4 - sag * 2)} ${n(w)} ${n(-h + 4)}`;
    }
    function rib(h, wid, light, dark) {
      // A raised moulding: a dark line below a light one.
      return `<path d="${bandD(h - wid * 0.5)}" fill="none" stroke="${dark}" stroke-width="${wid}" stroke-opacity="0.55"/>` +
        `<path d="${bandD(h + wid * 0.5)}" fill="none" stroke="${light}" stroke-width="${wid}" stroke-opacity="0.5"/>`;
    }

    let bell = '';
    const clipB = k.id('clipb');
    let bdefs = `<clipPath id="${clipB}"><path d="${bodyD}"/></clipPath>`;
    // Mouth: the lip's underside ring, the dark inside, and the clapper.
    bell += `<ellipse cx="0" cy="4" rx="${LR}" ry="${LRY}" fill="url(#${g.lipU})"/>`;
    bell += `<ellipse cx="0" cy="8" rx="${LR - 22}" ry="${LRY - 6}" fill="url(#${g.mouth})"/>`;
    // Clapper: iron rod from the dark crown, ball near the lip, flight below.
    bell += `<path d="M-9 -60H9L11 22H-11Z" fill="url(#${g.clap})"/>`;
    bell += `<ellipse cx="0" cy="44" rx="30" ry="36" fill="url(#${g.clap})"/>`;
    bell += `<path d="M-14 72Q0 86 14 72L9 112Q0 120 -9 112Z" fill="url(#${g.clap})"/>`;
    bell += `<path d="M-16 30Q-14 18 -6 14" fill="none" stroke="#B4B0EA" stroke-width="5" stroke-linecap="round" stroke-opacity="0.6"/>`;
    // Back rim catching a little light inside.
    bell += `<path d="M-290 18A${LR - 26} ${LRY - 8} 0 0 0 290 18" fill="none" stroke="#F0B58A" stroke-width="3" stroke-opacity="0.35"/>`;
    // Body.
    bell += `<path d="${bodyD}" fill="url(#${g.bronze})"/>`;
    let inner = '';
    inner += `<rect x="-330" y="${-BH - 10}" width="660" height="${BH + 60}" fill="url(#${g.shade})"/>`;
    // Shadow cast by the yoke across the shoulder.
    inner += `<path d="M-240 ${-BH - 10}H240V${-BH + 40}Q0 ${-BH + 70} -240 ${-BH + 40}Z" fill="#2E1E48" fill-opacity="0.35"/>`;
    // Specular streaks following the profile, light from the upper left.
    {
      let L = '', R = '';
      for (let h = BH - 30; h >= 30; h -= 15) {
        const w = halfW(h);
        L += `${L ? 'L' : 'M'}${n(-w * 0.6)} ${n(-h + 4 - w * 0.6 * 0.02)}`;
        R = `L${n(-w * 0.43)} ${n(-h + 4)}` + R;
      }
      inner += `<path d="${L}${R}Z" fill="url(#${g.spec})"/>`;
      let T = '';
      for (let h = BH - 60; h >= 50; h -= 15) T += `${T ? 'L' : 'M'}${n(-halfW(h) * 0.28)} ${n(-h + 4)}`;
      inner += `<path d="${T}" fill="none" stroke="#FFF3E0" stroke-width="7" stroke-opacity="0.32" stroke-linecap="round"/>`;
      // Warm bounce light along the right edge (rim light).
      let E = '';
      for (let h = BH - 70; h >= 10; h -= 15) E += `${E ? 'L' : 'M'}${n(halfW(h) * 0.93)} ${n(-h + 4)}`;
      inner += `<path d="${E}" fill="none" stroke="#F4A27C" stroke-width="10" stroke-opacity="0.45" stroke-linecap="round"/>`;
    }
    // The flare faces up into the light: a soft bright band above the lip.
    inner += `<path d="${bandD(110)}" fill="none" stroke="#FFDDB4" stroke-width="46" stroke-opacity="0.18"/>`;
    inner += `<path d="${bandD(96)}" fill="none" stroke="#FFE9CC" stroke-width="14" stroke-opacity="0.16"/>`;
    // Stipple: fine dots gathering into the shadow side (the Wallet grain,
    // drawn by hand), and a sparser light stipple on the lit flank.
    {
      const r = rng(1752);
      let dark = '', light = '';
      const dot = (x, y, rr) => `M${n(x - rr)} ${n(y)}a${n(rr)} ${n(rr)} 0 1 0 ${n(rr * 2)} 0a${n(rr)} ${n(rr)} 0 1 0 ${n(-rr * 2)} 0Z`;
      for (let i = 0; i < 7000; i++) {
        const h = 6 + r() * (BH - 12), f = -1 + r() * 2, w = halfW(h);
        const x = f * w, y = -h + 4 - w * 0.14 * (1 - f * f) * 2 * 0.5;
        if (f > 0.1 && r() < Math.pow((f - 0.1) / 0.9, 1.6)) dark += dot(x, y, 0.8 + r() * 1.0);
        else if (f < -0.25 && f > -0.85 && r() < 0.1) light += dot(x, y, 0.9 + r());
      }
      inner += `<path d="${dark}" fill="#2E1E52" fill-opacity="0.32"/><path d="${light}" fill="#FFF0DA" fill-opacity="0.35"/>`;
    }
    // Lip band: the sound bow's mouldings.
    inner += rib(30, 5, '#FFE3B8', '#4A2F60') + rib(52, 4, '#FFE3B8', '#4A2F60') + rib(66, 3, '#FFE3B8', '#4A2F60');
    // Shoulder and inscription band.
    inner += rib(400, 4, '#FFE3B8', '#4A2F60') + rib(410, 3, '#FFE3B8', '#4A2F60') +
      rib(328, 3, '#FFE3B8', '#4A2F60') + rib(318, 4, '#FFE3B8', '#4A2F60') + rib(462, 4, '#FFE3B8', '#4A2F60');
    // Inscription: two raised lines of caps, following the band's curve.
    const ins1 = k.id('ins'), ins2 = k.id('ins');
    bdefs += `<path id="${ins1}" d="${bandD(376, 8)}"/><path id="${ins2}" d="${bandD(342, 8)}"/>`;
    // Letters fade toward the sides, where the band turns away.
    const fadeL = k.id('fadel'), fadeD = k.id('faded');
    bdefs += k.linear(fadeL, 0, [[0, '#FFE6C0', 0], [0.25, '#FFE6C0', 0.6], [0.75, '#FFE6C0', 0.6], [1, '#FFE6C0', 0]]) +
      k.linear(fadeD, 0, [[0, '#3E2756', 0.05], [0.22, '#3E2756', 0.7], [0.78, '#3E2756', 0.7], [1, '#3E2756', 0.05]]);
    const insText = (pid, t, size, ls) =>
      `<text font-family="Libre Caslon Text" font-size="${size}" letter-spacing="${ls}" text-anchor="middle" fill="url(#${fadeL})" transform="translate(1.2 1.8)"><textPath href="#${pid}" startOffset="50%">${t}</textPath></text>` +
      `<text font-family="Libre Caslon Text" font-size="${size}" letter-spacing="${ls}" text-anchor="middle" fill="url(#${fadeD})"><textPath href="#${pid}" startOffset="50%">${t}</textPath></text>`;
    inner += insText(ins1, 'PROCLAIM LIBERTY THROUGHOUT ALL THE LAND', 13.5, 0.3);
    inner += insText(ins2, 'BY ORDER OF THE ASSEMBLY OF THE PROVINCE', 11.5, 0.3);
    // Founders' mark on the waist.
    inner += `<g font-family="Libre Caslon Text" font-size="15" letter-spacing="1.5" text-anchor="middle" fill="#3E2756" fill-opacity="0.45">` +
      `<text x="-62" y="-226">PASS AND STOW</text><text x="-62" y="-204">PHILAD<tspan dy="-6" font-size="10">A</tspan></text><text x="-62" y="-182">MDCCLIII</text></g>`;
    // The crack: widened (drilled) from the lip, running up and to the right,
    // then a hairline continuing on.
    {
      const L = [[30, -34], [27, -66], [36, -96], [31, -128], [44, -160], [41, -194], [53, -224], [52, -252], [62, -282], [66, -300]];
      const R = [[70, -298], [66, -276], [64, -252], [60, -222], [56, -192], [57, -160], [46, -128], [52, -98], [44, -66], [48, -34]];
      const pts = L.concat(R);
      const d = 'M' + pts.map((p) => p.join(' ')).join('L') + 'Z';
      inner += `<path d="${d}" fill="#24163A"/>`;
      inner += `<path d="M${R.map((p) => `${p[0] + 3} ${p[1]}`).join('L')}" fill="none" stroke="#FFD8A6" stroke-width="3" stroke-opacity="0.75" stroke-linejoin="round"/>`;
      inner += `<path d="M${L.map((p) => `${p[0] - 2} ${p[1]}`).join('L')}" fill="none" stroke="#3A2556" stroke-width="3" stroke-opacity="0.6" stroke-linejoin="round"/>`;
      inner += `<path d="M68 -300L76 -322L72 -340L84 -364L82 -382L92 -402" fill="none" stroke="#24163A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
      // Stop-drill rivets either side of the crack.
      for (const p of [[22, -110], [76, -150], [28, -200], [80, -240]]) {
        inner += `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#3A2556" fill-opacity="0.6"/><circle cx="${p[0] - 1.2}" cy="${p[1] - 1.5}" r="2" fill="#FFE0B0" fill-opacity="0.6"/>`;
      }
    }
    bell += `<g clip-path="url(#${clipB})">${inner}</g>`;
    // Lip edge highlight along the front arch.
    bell += `<path d="M-316 0A${LR} ${LRY} 0 0 1 316 0" fill="none" stroke="#FFE2B6" stroke-width="4" stroke-opacity="0.55"/>`;
    // Crown (head) and canons where the bell meets the yoke straps.
    bell += `<path d="M-66 ${-BH + 4}V${-BH - 26}Q-66 ${-BH - 40} -52 ${-BH - 40}H52Q66 ${-BH - 40} 66 ${-BH - 26}V${-BH + 4}Z" fill="url(#${g.crown})"/>`;
    bell += `<path d="M-66 ${-BH - 14}H66" stroke="#3E2756" stroke-width="3" stroke-opacity="0.5"/>`;

    // Yoke: a long elm beam, deepest in the middle, tapering to its ends,
    // with iron straps over it holding the crown.
    const YT = -BH - 150;               // yoke top
    const YL = 404;                     // yoke half-length
    const YE = 76;                      // thickness at the ends
    const YC = 124;                     // thickness at the middle
    let yoke = '';
    const yokeD = `M${-YL} ${YT + 12}Q${-YL} ${YT} ${-YL + 12} ${YT}H${YL - 12}Q${YL} ${YT} ${YL} ${YT + 12}V${YT + YE}` +
      `C${YL - 70} ${YT + YE + 4} 230 ${YT + YC} 100 ${YT + YC}H-100C-230 ${YT + YC} ${-YL + 70} ${YT + YE + 4} ${-YL} ${YT + YE}Z`;
    yoke += `<path d="${yokeD}" fill="url(#${g.wood})"/>`;
    // Underside shadow along the curved bottom edge.
    yoke += `<path d="M${-YL} ${YT + YE}C${-YL + 70} ${YT + YE + 4} -230 ${YT + YC} -100 ${YT + YC}H100C230 ${YT + YC} ${YL - 70} ${YT + YE + 4} ${YL} ${YT + YE}" fill="none" stroke="#1C1230" stroke-width="10" stroke-opacity="0.45"/>`;
    // Grain following the beam's taper, and a lit top arris.
    {
      let d = '';
      const r = rng(1753);
      for (let i = 1; i < 8; i++) {
        const t = i / 8;
        const yE = YT + 6 + t * (YE - 12), yC = YT + 8 + t * (YC - 16);
        const j = (r() - 0.5) * 6;
        d += `M${-YL + 10} ${n(yE)}C${-YL + 90} ${n(yE + 3 + j)} -240 ${n(yC + j)} -30 ${n(yC)}` +
          `M30 ${n(yC)}C240 ${n(yC - j)} ${YL - 90} ${n(yE + 3 - j)} ${YL - 10} ${n(yE)}`;
      }
      yoke += `<path d="${d}" fill="none" stroke="#B898B8" stroke-width="2" stroke-opacity="0.2"/>`;
      // Knots.
      yoke += `<ellipse cx="-250" cy="${YT + 40}" rx="16" ry="6" fill="none" stroke="#B898B8" stroke-width="2" stroke-opacity="0.25"/>`;
      yoke += `<ellipse cx="300" cy="${YT + 34}" rx="12" ry="5" fill="none" stroke="#B898B8" stroke-width="2" stroke-opacity="0.22"/>`;
      yoke += `<path d="M${-YL + 8} ${YT + 3}H${YL - 8}" stroke="#E4C2CF" stroke-width="4" stroke-opacity="0.6" stroke-linecap="round"/>`;
      yoke += `<path d="M${-YL + 2} ${YT + 12}V${YT + YE - 2}" stroke="#A68AAE" stroke-width="3" stroke-opacity="0.5"/>`;
      yoke += `<path d="M${YL - 2} ${YT + 12}V${YT + YE - 2}" stroke="#1C1230" stroke-width="4" stroke-opacity="0.5"/>`;
    }
    // Iron straps over the beam, bolted through, gripping the crown.
    for (const sx of [-46, 46]) {
      yoke += `<path d="M${sx - 11} ${YT - 8}H${sx + 11}V${-BH - 26}H${sx - 11}Z" fill="url(#${g.iron})"/>`;
      yoke += `<path d="M${sx - 7} ${YT - 4}V${-BH - 30}" stroke="#A9A4E4" stroke-width="2.5" stroke-opacity="0.45"/>`;
      for (const by of [YT + 24, YT + 64, YT + 104]) {
        yoke += `<circle cx="${sx}" cy="${by}" r="7" fill="#1E1A38"/><circle cx="${sx - 1.6}" cy="${by - 2.2}" r="2.6" fill="#C4C0F2" fill-opacity="0.75"/>`;
      }
    }
    yoke += `<rect x="-66" y="${YT - 16}" width="132" height="16" rx="5" fill="url(#${g.iron})"/>`;
    // Iron bands and trunnion pins at the beam's ends.
    for (const side of [-1, 1]) {
      const ex = side * (YL - 40);
      yoke += `<rect x="${ex - 9}" y="${YT - 3}" width="18" height="${YE + 6}" rx="3" fill="url(#${g.iron})"/>`;
      yoke += `<circle cx="${side * YL}" cy="${YT + YE / 2}" r="15" fill="url(#${g.iron})"/><circle cx="${side * YL - 3}" cy="${YT + YE / 2 - 4}" r="5" fill="#C4C0F2" fill-opacity="0.6"/>`;
    }
    for (const bx of [-50, 50]) yoke += `<path d="M${bx - 11} ${YT - 16}V${YT - 30}L${bx - 6} ${YT - 34}H${bx + 6}L${bx + 11} ${YT - 30}V${YT - 16}Z" fill="#2A2448"/><path d="M${bx - 7} ${YT - 30}H${bx + 2}" stroke="#A9A4E4" stroke-width="2" stroke-opacity="0.5"/>`;

    parts.push({
      defs: bellDefs + bdefs,
      svg: `<g transform="translate(${BX} ${BY}) scale(1.08)">` + bell + yoke + `</g>`,
    });

    // ---- right page: Independence Hall ------------------------------------------------
    const GY = 1246;                    // ground line
    const HX0 = 1272, HX1 = 1908;       // main building
    const TW0 = TX - 86, TW1 = TX + 86; // tower
    const hd = {
      brick: k.id('brick'), brickT: k.id('brickt'), brickS: k.id('bricks'), roof: k.id('roof'), glass: k.id('glass'),
      white: k.id('white'), whiteS: k.id('whites'), door: k.id('door'), dome: k.id('dome'), oct: k.id('oct'),
      wing: k.id('wing'), hall: k.id('hall'),
    };
    let hdefs =
      k.linear(hd.brick, 0, [[0, '#E2806A'], [0.5, '#D06A5A'], [1, '#B65553']]) +
      k.linear(hd.brickT, 0, [[0, '#E98A70'], [0.5, '#D8705C'], [1, '#C45E56']]) +
      k.linear(hd.brickS, 0, [[0, '#9A4558'], [1, '#7C3A58']]) +
      k.linear(hd.roof, 90, [[0, '#8A8CC6'], [1, '#55579A']]) +
      k.linear(hd.glass, 70, [[0, '#2E3C8E'], [0.5, '#4A5DC4'], [0.62, '#93A3EC'], [0.7, '#4A5DC4'], [1, '#2A3684']]) +
      k.linear(hd.white, 0, [[0, '#FFFFFF'], [0.6, '#FBF5EE'], [1, '#E2DBEE']]) +
      k.linear(hd.whiteS, 0, [[0, '#D8D0EA'], [1, '#B4ABD6']]) +
      k.linear(hd.door, 90, [[0, '#3A3F8E'], [1, '#262A66']]) +
      k.linear(hd.dome, 0, [[0, '#FFFFFF'], [0.45, '#F4EEF6'], [1, '#B9B0DA']]) +
      k.linear(hd.oct, 0, [[0, '#FFFFFF'], [0.3, '#FBF6F0'], [0.36, '#FFFFFF'], [0.64, '#F2ECF4'], [0.7, '#C9C1E2'], [1, '#B3AAD6']]) +
      k.linear(hd.wing, 0, [[0, '#DC9A8C'], [1, '#C98478']]);
    let hall = '';

    // Brick coursing, very faint, over a facade rectangle.
    function courses(x0, y0, x1, y1) {
      let d = '';
      for (let y = y0 + 7; y < y1; y += 8) d += `M${x0} ${y}H${x1}`;
      let v = '';
      let row = 0;
      for (let y = y0; y < y1 - 8; y += 8, row++) {
        for (let x = x0 + (row % 2 ? 9 : 0); x < x1; x += 18) v += `M${x} ${y}v8`;
      }
      return `<path d="${d}" stroke="#6E2E44" stroke-width="1.2" stroke-opacity="0.13"/><path d="${v}" stroke="#6E2E44" stroke-width="1" stroke-opacity="0.07"/>`;
    }

    // A sash window with white frame, flat brick arch + keystone and a sill.
    function sash(x, y, w, h, o) {
      o = o || {};
      const cols = 3, rowsTop = o.rows || 4;
      let s = '';
      s += `<rect x="${x - 7}" y="${y - 7}" width="${w + 14}" height="${h + 12}" fill="#B9506A" fill-opacity="0.35"/>`; // reveal shadow
      s += `<rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" fill="url(#${hd.white})"/>`;
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${hd.glass})"/>`;
      // Shade from the head of the opening.
      s += `<rect x="${x}" y="${y}" width="${w}" height="${n(h * 0.18)}" fill="#1C2266" fill-opacity="0.35"/>`;
      let m = '';
      for (let i = 1; i < cols; i++) m += `M${n(x + (w * i) / cols)} ${y}V${y + h}`;
      for (let i = 1; i < rowsTop * 2; i++) m += `M${x} ${n(y + (h * i) / (rowsTop * 2))}H${x + w}`;
      s += `<path d="${m}" stroke="#FBF5EE" stroke-width="2.2"/>`;
      s += `<path d="M${x} ${n(y + h / 2)}H${x + w}" stroke="#FBF5EE" stroke-width="4"/>`;
      if (!o.noHead) {
        // Flat arch of rubbed brick and a white keystone.
        s += `<path d="M${x - 9} ${y - 5}L${x - 13} ${y - 21}H${x + w + 13}L${x + w + 9} ${y - 5}Z" fill="#C05A52"/>`;
        s += `<path d="M${n(x + w / 2 - 7)} ${y - 5}L${n(x + w / 2 - 9)} ${y - 23}H${n(x + w / 2 + 9)}L${n(x + w / 2 + 7)} ${y - 5}Z" fill="url(#${hd.white})"/>`;
      }
      s += `<rect x="${x - 9}" y="${y + h + 4}" width="${w + 18}" height="6" fill="url(#${hd.white})"/>`;
      s += `<rect x="${x - 9}" y="${y + h + 10}" width="${w + 18}" height="4" fill="#7C3A58" fill-opacity="0.35"/>`;
      return s;
    }

    // Back wings (hazier) at either side, half hidden by the trees.
    for (const wx of [[1124, 1290], [1890, 2084]]) {
      hall += `<rect x="${wx[0]}" y="1096" width="${wx[1] - wx[0]}" height="${GY - 1096}" fill="url(#${hd.wing})"/>`;
      hall += `<path d="M${wx[0] - 6} 1096L${wx[0] + 12} 1068H${wx[1] - 12}L${wx[1] + 6} 1096Z" fill="#9DA0D0"/>`;
      hall += `<rect x="${wx[0] - 6}" y="1092" width="${wx[1] - wx[0] + 12}" height="8" fill="#F6F0F2"/>`;
      for (let x = wx[0] + 22; x < wx[1] - 30; x += 52) {
        hall += `<rect x="${x}" y="1124" width="26" height="42" fill="#F4ECEE"/><rect x="${x + 3}" y="1127" width="20" height="36" fill="#6F7CC4"/>`;
        hall += `<rect x="${x}" y="1186" width="26" height="46" fill="#F4ECEE"/><rect x="${x + 3}" y="1189" width="20" height="40" fill="#6F7CC4"/>`;
      }
      hall += `<rect x="${wx[0]}" y="1068" width="${wx[1] - wx[0]}" height="${GY - 1068}" fill="#F3DCD2" fill-opacity="0.35"/>`;
    }

    // Main block: roof, gable-end chimneys, ridge balustrade.
    const EAVE = 996, RIDGE = 918;
    // Paired chimneys joined by an arch at each gable end.
    for (const cx of [HX0 + 30, HX1 - 30]) {
      hall += `<path d="M${cx - 34} ${RIDGE + 30}V842H${cx - 12}V862Q${cx} 848 ${cx + 12} 862V842H${cx + 34}V${RIDGE + 30}Z" fill="url(#${hd.brickT})"/>`;
      hall += `<rect x="${cx - 38}" y="832" width="76" height="12" fill="url(#${hd.white})"/>`;
      hall += `<rect x="${cx + 18}" y="844" width="16" height="${RIDGE + 30 - 844}" fill="#7C3A58" fill-opacity="0.3"/>`;
    }
    hall += `<path d="M${HX0 - 6} ${EAVE}L${HX0 + 8} ${RIDGE}H${HX1 - 8}L${HX1 + 6} ${EAVE}Z" fill="url(#${hd.roof})"/>`;
    {
      // Slate courses.
      let d = '';
      for (let y = RIDGE + 10; y < EAVE; y += 10) d += `M${HX0} ${y}H${HX1}`;
      hall += `<path d="${d}" stroke="#3E3F80" stroke-width="1.4" stroke-opacity="0.25"/>`;
      hall += `<path d="M${HX0 + 8} ${RIDGE + 2}H${HX1 - 8}" stroke="#C9CCF2" stroke-width="3" stroke-opacity="0.6"/>`;
      // Ridge balustrade.
      const b0 = HX0 + 120, b1 = HX1 - 120;
      let bal = `<rect x="${b0}" y="${RIDGE - 26}" width="${b1 - b0}" height="5" fill="url(#${hd.white})"/><rect x="${b0}" y="${RIDGE - 4}" width="${b1 - b0}" height="5" fill="#E7E0F0"/>`;
      let bd = '';
      for (let x = b0 + 6; x < b1 - 4; x += 11) bd += `M${x} ${RIDGE - 21}v17`;
      bal += `<path d="${bd}" stroke="#F6F0F6" stroke-width="4"/>`;
      for (let x = b0; x <= b1; x += (b1 - b0) / 4) bal += `<rect x="${n(x - 4)}" y="${RIDGE - 30}" width="8" height="30" fill="#FFFFFF"/>`;
      hall += bal;
    }
    hall += `<path d="M${TW1} ${RIDGE + 6}H${TW1 + 34}L${TW1 + 44} ${EAVE}H${TW1}Z" fill="#2E2E6E" fill-opacity="0.3"/>`;
    // Facade.
    hall += `<rect x="${HX0}" y="${EAVE}" width="${HX1 - HX0}" height="${GY - EAVE}" fill="url(#${hd.brick})"/>`;
    hall += courses(HX0, EAVE + 20, HX1, GY);
    // Cornice with modillions.
    hall += `<rect x="${HX0 - 10}" y="${EAVE - 4}" width="${HX1 - HX0 + 20}" height="16" fill="url(#${hd.white})"/>`;
    hall += `<rect x="${HX0 - 6}" y="${EAVE + 12}" width="${HX1 - HX0 + 12}" height="10" fill="#EEE7F2"/>`;
    {
      let d = '';
      for (let x = HX0; x < HX1; x += 12) d += `M${x} ${EAVE + 22}h6v6h-6Z`;
      hall += `<path d="${d}" fill="#FFFFFF"/><rect x="${HX0 - 6}" y="${EAVE + 28}" width="${HX1 - HX0 + 12}" height="6" fill="#7C3A58" fill-opacity="0.35"/>`;
    }
    // Belt course and water table.
    hall += `<rect x="${HX0}" y="1130" width="${HX1 - HX0}" height="9" fill="url(#${hd.white})"/>`;
    hall += `<rect x="${HX0}" y="1139" width="${HX1 - HX0}" height="4" fill="#7C3A58" fill-opacity="0.3"/>`;
    hall += `<rect x="${HX0}" y="${GY - 18}" width="${HX1 - HX0}" height="18" fill="#B25A5A"/>`;
    hall += `<rect x="${HX0}" y="${GY - 18}" width="${HX1 - HX0}" height="4" fill="#F0D6CF" fill-opacity="0.6"/>`;
    // Windows: four bays either side of the tower, two storeys.
    const bays = [];
    for (let i = 0; i < 4; i++) {
      bays.push(HX0 + 26 + i * 56);
      bays.push(TW1 + 28 + i * 56);
    }
    for (const bx of bays) {
      hall += sash(bx, 1054, 34, 60, { rows: 3 });
      hall += sash(bx, 1158, 34, 62, { rows: 3 });
    }
    // Shadow the tower throws on the facade to its right (sun from the left).
    hall += `<path d="M${TW1} ${EAVE + 34}H${TW1 + 26}L${TW1 + 20} ${GY}H${TW1}Z" fill="#5E2A50" fill-opacity="0.28"/>`;

    // Tower: brick shaft from the ground to above the roof.
    const TT = 806;                      // top of the brick
    hall += `<rect x="${TW0 - 12}" y="${TT}" width="12" height="${GY - TT}" fill="url(#${hd.brickT})" fill-opacity="0.9"/>`; // lit side face
    hall += `<rect x="${TW0}" y="${TT}" width="${TW1 - TW0}" height="${GY - TT}" fill="url(#${hd.brickT})"/>`;
    hall += courses(TW0, TT + 20, TW1, GY);
    hall += `<rect x="${TW1 - 6}" y="${TT}" width="6" height="${GY - TT}" fill="#7C3A58" fill-opacity="0.35"/>`;
    {
      const r = rng(1732);
      let d = '';
      for (let i = 0; i < 900; i++) {
        const t = r(), x = TW0 + (TW1 - TW0) * (0.55 + 0.45 * Math.sqrt(t)), y = TT + r() * (GY - TT);
        d += `M${n(x)} ${n(y)}h1.8v1.8h-1.8Z`;
      }
      hall += `<path d="${d}" fill="#5A2248" fill-opacity="0.3"/>`;
    }
    // Cornice line carried round the tower, belt and water table.
    hall += `<rect x="${TW0 - 16}" y="${EAVE - 4}" width="${TW1 - TW0 + 24}" height="16" fill="url(#${hd.white})"/><rect x="${TW0 - 16}" y="${EAVE + 12}" width="${TW1 - TW0 + 24}" height="6" fill="#7C3A58" fill-opacity="0.3"/>`;
    hall += `<rect x="${TW0 - 12}" y="1130" width="${TW1 - TW0 + 12}" height="9" fill="url(#${hd.white})"/>`;
    hall += `<rect x="${TW0 - 12}" y="${GY - 18}" width="${TW1 - TW0 + 12}" height="18" fill="#B85E5C"/>`;
    // Doorway: arched, white surround, fanlight, panelled doors.
    {
      const dx0 = TX - 34, dx1 = TX + 34, top = 1172;
      hall += `<path d="M${dx0 - 14} ${GY - 4}V${top}A${48} ${48} 0 0 1 ${dx1 + 14} ${top}V${GY - 4}Z" fill="url(#${hd.white})"/>`;
      hall += `<path d="M${dx0} ${GY - 4}V${top}A34 34 0 0 1 ${dx1} ${top}V${GY - 4}Z" fill="url(#${hd.door})"/>`;
      // Fanlight.
      let f = `<path d="M${dx0} ${top}A34 34 0 0 1 ${dx1} ${top}Z" fill="url(#${hd.glass})"/>`;
      let sp = '';
      for (let i = 1; i < 6; i++) {
        const a = Math.PI + (i * Math.PI) / 6;
        sp += `M${TX} ${top}L${n(TX + 34 * Math.cos(a))} ${n(top + 34 * Math.sin(a))}`;
      }
      f += `<path d="${sp}" stroke="#FBF5EE" stroke-width="2"/><path d="M${dx0} ${top}H${dx1}" stroke="#FBF5EE" stroke-width="4"/>`;
      hall += f;
      hall += `<path d="M${TX} ${top + 2}V${GY - 4}" stroke="#1C1F55" stroke-width="3"/>`;
      for (const px of [dx0 + 7, TX + 6]) {
        hall += `<rect x="${px}" y="${top + 10}" width="21" height="26" rx="2" fill="none" stroke="#6A72C8" stroke-width="2" stroke-opacity="0.6"/>`;
        hall += `<rect x="${px}" y="${top + 44}" width="21" height="22" rx="2" fill="none" stroke="#6A72C8" stroke-width="2" stroke-opacity="0.6"/>`;
      }
      hall += `<path d="M${TX - 8} ${top - 48}L${TX - 10} ${top - 36}H${TX + 10}L${TX + 8} ${top - 48}Z" fill="#FFFFFF"/>`;
      hall += `<rect x="${dx0 - 22}" y="${GY - 6}" width="${dx1 - dx0 + 44}" height="8" fill="#EDE5EE"/>`;
    }
    // Palladian window on the stair landing.
    {
      const y1 = 1112, cw = 38;
      hall += `<rect x="${TX - 70}" y="1050" width="140" height="${y1 - 1050 + 10}" fill="#B9506A" fill-opacity="0.3"/>`;
      hall += `<path d="M${TX - cw / 2 - 6} ${y1 + 4}V1066A${cw / 2 + 6} ${cw / 2 + 6} 0 0 1 ${TX + cw / 2 + 6} 1066V${y1 + 4}Z" fill="url(#${hd.white})"/>`;
      hall += `<path d="M${TX - cw / 2} ${y1}V1066A${cw / 2} ${cw / 2} 0 0 1 ${TX + cw / 2} 1066V${y1}Z" fill="url(#${hd.glass})"/>`;
      hall += `<path d="M${TX} 1047V${y1}M${TX - cw / 2} 1078H${TX + cw / 2}M${TX - cw / 2} 1095H${TX + cw / 2}" stroke="#FBF5EE" stroke-width="2.2"/>`;
      for (const sx of [TX - 62, TX + 34]) {
        hall += `<rect x="${sx - 4}" y="1070" width="36" height="${y1 - 1070 + 4}" fill="url(#${hd.white})"/>`;
        hall += `<rect x="${sx}" y="1074" width="28" height="${y1 - 1074}" fill="url(#${hd.glass})"/>`;
        hall += `<path d="M${sx + 14} 1074V${y1}M${sx} 1093H${sx + 28}" stroke="#FBF5EE" stroke-width="2"/>`;
        hall += `<rect x="${sx - 6}" y="1064" width="40" height="7" fill="#FFFFFF"/>`;
      }
      hall += `<rect x="${TX - 72}" y="${y1 + 2}" width="144" height="7" fill="url(#${hd.white})"/>`;
    }
    // Upper tower: arched louvred opening and a round window.
    {
      hall += `<path d="M${TX - 26} 958V900A26 26 0 0 1 ${TX + 26} 900V958Z" fill="url(#${hd.white})"/>`;
      hall += `<path d="M${TX - 19} 954V900A19 19 0 0 1 ${TX + 19} 900V954Z" fill="#2E2A66"/>`;
      let l = '';
      for (let y = 896; y < 954; y += 8) l += `M${TX - 19} ${y}H${TX + 19}`;
      hall += `<path d="${l}" stroke="#7A7FC8" stroke-width="3" stroke-opacity="0.6"/>`;
      hall += `<rect x="${TX - 34}" y="958" width="68" height="7" fill="#FFFFFF"/>`;
      hall += `<circle cx="${TX}" cy="848" r="18" fill="url(#${hd.white})"/><circle cx="${TX}" cy="848" r="12" fill="url(#${hd.glass})"/>`;
      hall += `<path d="M${TX - 12} 848H${TX + 12}M${TX} 836V860" stroke="#FBF5EE" stroke-width="2"/>`;
    }
    // Top of the brick: cornice, balustrade and corner urns.
    function urn(x, y, s) {
      return `<path d="M${n(x - 6 * s)} ${y}H${n(x + 6 * s)}L${n(x + 4 * s)} ${n(y - 4 * s)}Q${n(x + 10 * s)} ${n(y - 12 * s)} ${n(x + 4 * s)} ${n(y - 20 * s)}H${n(x - 4 * s)}Q${n(x - 10 * s)} ${n(y - 12 * s)} ${n(x - 4 * s)} ${n(y - 4 * s)}Z" fill="url(#${hd.white})"/>` +
        `<path d="M${x} ${n(y - 20 * s)}q${n(4 * s)} ${n(-6 * s)} 0 ${n(-11 * s)}q${n(-4 * s)} ${n(5 * s)} 0 ${n(11 * s)}Z" fill="#FFFFFF"/>`;
    }
    hall += `<rect x="${TW0 - 12}" y="${TT - 14}" width="${TW1 - TW0 + 24}" height="16" fill="url(#${hd.white})"/>`;
    hall += `<rect x="${TW0 - 8}" y="${TT + 2}" width="${TW1 - TW0 + 16}" height="6" fill="#7C3A58" fill-opacity="0.3"/>`;
    {
      let bd = '';
      for (let x = TW0 - 4; x <= TW1 + 4; x += 10) bd += `M${x} ${TT - 34}v20`;
      hall += `<rect x="${TW0 - 8}" y="${TT - 38}" width="${TW1 - TW0 + 16}" height="5" fill="#FFFFFF"/><path d="${bd}" stroke="#F4EEF4" stroke-width="4"/>`;
      hall += urn(TW0 - 4, TT - 14, 1.3) + urn(TW1 + 4, TT - 14, 1.3);
    }
    // Clock stage: square, white, with pilasters and the clock face.
    const CK0 = TT - 38, CK1 = 690;       // stage spans y CK1..CK0
    {
      const x0 = TX - 64, x1 = TX + 64;
      hall += `<rect x="${x0}" y="${CK1}" width="${x1 - x0}" height="${CK0 - CK1}" fill="url(#${hd.white})"/>`;
      hall += `<rect x="${x1 - 14}" y="${CK1}" width="14" height="${CK0 - CK1}" fill="url(#${hd.whiteS})"/>`;
      hall += `<rect x="${x0}" y="${CK1}" width="12" height="${CK0 - CK1}" fill="#FFFFFF"/>`;
      hall += `<path d="M${x0 + 12} ${CK1}V${CK0}M${x1 - 14} ${CK1}V${CK0}" stroke="#C4BCDF" stroke-width="2"/>`;
      // Clock.
      const cy = (CK0 + CK1) / 2 + 2, cr = 36;
      hall += `<rect x="${TX - cr - 8}" y="${cy - cr - 8}" width="${2 * cr + 16}" height="${2 * cr + 16}" fill="#EFE9F4"/>`;
      hall += `<circle cx="${TX}" cy="${cy}" r="${cr + 4}" fill="#2B2E78"/><circle cx="${TX}" cy="${cy}" r="${cr}" fill="#FFFCF6"/>`;
      hall += `<circle cx="${TX}" cy="${cy}" r="${cr}" fill="none" stroke="#C9C1E2" stroke-width="6" stroke-opacity="0.6"/>`;
      let tk = '';
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const r0 = i % 3 ? cr - 8 : cr - 12;
        tk += `M${n(TX + Math.cos(a) * r0)} ${n(cy + Math.sin(a) * r0)}L${n(TX + Math.cos(a) * (cr - 3))} ${n(cy + Math.sin(a) * (cr - 3))}`;
      }
      hall += `<path d="${tk}" stroke="#2B2E78" stroke-width="3"/>`;
      // 4:10, as on the old hundred-dollar note.
      const ha = (-90 + 4 * 30 + 5) * Math.PI / 180, ma = (-90 + 60) * Math.PI / 180;
      hall += `<path d="M${TX} ${cy}L${n(TX + Math.cos(ha) * 19)} ${n(cy + Math.sin(ha) * 19)}" stroke="#1F2E86" stroke-width="5" stroke-linecap="round"/>`;
      hall += `<path d="M${TX} ${cy}L${n(TX + Math.cos(ma) * 28)} ${n(cy + Math.sin(ma) * 28)}" stroke="#1F2E86" stroke-width="3.2" stroke-linecap="round"/>`;
      hall += `<circle cx="${TX}" cy="${cy}" r="4" fill="#1F2E86"/>`;
      // Cornice and urns.
      hall += `<rect x="${x0 - 10}" y="${CK1 - 12}" width="${x1 - x0 + 20}" height="14" fill="url(#${hd.white})"/>`;
      hall += `<rect x="${x0 - 6}" y="${CK1 + 2}" width="${x1 - x0 + 12}" height="5" fill="#9C93C6" fill-opacity="0.45"/>`;
      hall += urn(x0 - 2, CK1 - 12, 1.15) + urn(x1 + 2, CK1 - 12, 1.15);
    }
    // Octagonal belfry: front face plus two angled faces, columns at the
    // corners, round-arched louvred openings.
    function octStage(y0, y1, hw, o) {
      o = o || {};
      const f = hw * Math.tan(Math.PI / 8);   // half the front face
      let s = '';
      s += `<path d="M${TX - hw} ${y1}V${y0}H${TX + hw}V${y1}Z" fill="url(#${hd.oct})"/>`;
      // Faces' shading.
      s += `<path d="M${TX + f} ${y1}V${y0}H${TX + hw}V${y1}Z" fill="#9C93C6" fill-opacity="0.35"/>`;
      if (o.arch) {
        const aw = f * 0.62, top = y0 + (y1 - y0) * 0.16 + aw, bot = y1 - (y1 - y0) * 0.12;
        const opening = (cx, w, shade) => {
          let a = `<path d="M${n(cx - w)} ${n(bot)}V${n(top)}A${n(w)} ${n(w)} 0 0 1 ${n(cx + w)} ${n(top)}V${n(bot)}Z" fill="${shade}"/>`;
          let l = '';
          for (let y = top - w * 0.6; y < bot; y += 7) l += `M${n(cx - w)} ${n(y)}H${n(cx + w)}`;
          return a + `<path d="${l}" stroke="#8A8FD6" stroke-width="2.4" stroke-opacity="0.5"/>`;
        };
        s += opening(TX, aw, '#2E2A66');
        s += `<g transform="translate(${n(TX - (hw + f) / 2)} 0) scale(0.55 1) translate(${-TX} 0)">${opening(TX, aw * 1.15, '#3A3474')}</g>`;
        s += `<g transform="translate(${n(TX + (hw + f) / 2)} 0) scale(0.55 1) translate(${-TX} 0)">${opening(TX, aw * 1.15, '#262258')}</g>`;
      }
      if (o.oval) {
        s += `<ellipse cx="${TX}" cy="${n((y0 + y1) / 2)}" rx="${n(f * 0.5)}" ry="${n((y1 - y0) * 0.26)}" fill="#FFFFFF"/>`;
        s += `<ellipse cx="${TX}" cy="${n((y0 + y1) / 2)}" rx="${n(f * 0.36)}" ry="${n((y1 - y0) * 0.19)}" fill="url(#${hd.glass})"/>`;
        for (const sd of [-1, 1]) {
          s += `<ellipse cx="${n(TX + sd * (hw + f) / 2)}" cy="${n((y0 + y1) / 2)}" rx="${n(f * 0.18)}" ry="${n((y1 - y0) * 0.19)}" fill="${sd < 0 ? '#3E4A9C' : '#2A3070'}"/>`;
        }
      }
      // Corner columns.
      for (const cx of [TX - hw, TX - f, TX + f, TX + hw]) {
        s += `<rect x="${n(cx - 3.5)}" y="${y0}" width="7" height="${y1 - y0}" fill="${cx > TX + f ? '#B9B0DA' : '#FFFFFF'}"/>`;
        s += `<path d="M${n(cx + 3.5)} ${y0}V${y1}" stroke="#A79ED0" stroke-width="1.6" stroke-opacity="0.7"/>`;
      }
      // Plinth and cornice.
      s += `<rect x="${TX - hw - 5}" y="${y1 - 6}" width="${2 * hw + 10}" height="8" fill="url(#${hd.oct})"/>`;
      s += `<rect x="${TX - hw - 9}" y="${y0 - 10}" width="${2 * hw + 18}" height="12" fill="url(#${hd.oct})"/>`;
      s += `<rect x="${TX - hw - 6}" y="${y0 + 2}" width="${2 * hw + 12}" height="4" fill="#8F86C0" fill-opacity="0.45"/>`;
      return s;
    }
    hall += octStage(560, CK1 - 12, 58, { arch: true });
    {
      // Small balustrade over the belfry.
      let bd = '';
      for (let x = TX - 52; x <= TX + 52; x += 9) bd += `M${x} 532v18`;
      hall += `<rect x="${TX - 56}" y="528" width="112" height="5" fill="#FFFFFF"/><path d="${bd}" stroke="#EFE9F4" stroke-width="3.6"/>`;
      hall += `<rect x="${TX + 26}" y="533" width="30" height="17" fill="#9C93C6" fill-opacity="0.25"/>`;
    }
    hall += octStage(470, 528, 38, { oval: true });
    // Bell-shaped dome, ball, spire and weathervane.
    hall += `<path d="M${TX - 40} 462C${TX - 40} 434 ${TX - 14} 430 ${TX - 8} 404L${TX} 390L${TX + 8} 404C${TX + 14} 430 ${TX + 40} 434 ${TX + 40} 462Z" fill="url(#${hd.dome})"/>`;
    hall += `<path d="M${TX - 30} 456C${TX - 30} 438 ${TX - 12} 432 ${TX - 6} 410" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>`;
    hall += `<rect x="${TX - 44}" y="458" width="88" height="8" fill="url(#${hd.oct})"/>`;
    hall += `<path d="M${TX} 392V318" stroke="#3A3A86" stroke-width="3.4"/>`;
    hall += `<circle cx="${TX}" cy="390" r="7" fill="${C.gold}"/><circle cx="${TX - 2}" cy="388" r="2.5" fill="#FFF3C8"/>`;
    hall += `<circle cx="${TX}" cy="350" r="5" fill="${C.gold}"/>`;
    hall += `<path d="M${TX - 22} 330H${TX + 18}M${TX + 18} 330l-8 -5M${TX + 18} 330l-8 5M${TX - 22} 330l-6 -6M${TX - 22} 330l-6 6" stroke="#3A3A86" stroke-width="3" stroke-linecap="round" fill="none"/>`;
    hall += `<path d="M${TX - 8} 340H${TX + 8}" stroke="#3A3A86" stroke-width="2.4"/>`;

    parts.push({ defs: hdefs, svg: hall });

    // Hedges along the foundation, and the brick walk to the tower door.
    {
      const r = rng(55);
      const hed = k.id('hedge');
      let d = '';
      let hedgeHi = '';
      for (let x = HX0 - 10; x < HX1 + 10; x += 22 + r() * 10) {
        if (x > TX - 60 && x < TX + 40) continue;
        const rr = 18 + r() * 8;
        d += `M${n(x - rr)} ${GY + 6}a${n(rr)} ${n(rr * 1.05)} 0 1 1 ${n(rr * 2)} 0Z`;
        hedgeHi += `<ellipse cx="${n(x - rr * 0.3)}" cy="${n(GY + 6 - rr * 0.6)}" rx="${n(rr * 0.45)}" ry="${n(rr * 0.3)}" fill="#9CC79A" fill-opacity="0.45"/>`;
      }
      const walk = k.id('walk');
      parts.push({
        defs: k.linear(hed, 90, [[0, '#4E8C6E'], [1, '#24564C']]) + k.linear(walk, 90, [[0, '#F2D2C2'], [1, '#E9B7A2']]),
        svg: `<path d="M${TX - 44} ${GY}H${TX + 44}L${TX + 170} ${k.H}H${TX - 170}Z" fill="url(#${walk})"/>` +
          `<path d="M${TX - 44} ${GY}L${TX - 170} ${k.H}M${TX + 44} ${GY}L${TX + 170} ${k.H}" stroke="#C98C82" stroke-width="3" stroke-opacity="0.6"/>` +
          (() => {
            let b = '';
            for (let i = 1; i < 14; i++) {
              const t = Math.pow(i / 14, 1.6), y = GY + (k.H - GY) * t, hw = 44 + 126 * t;
              b += `M${n(TX - hw)} ${n(y)}H${n(TX + hw)}`;
            }
            return `<path d="${b}" stroke="#C98C82" stroke-width="1.6" stroke-opacity="0.35"/>`;
          })() +
          `<path d="${d}" fill="url(#${hed})"/>` + hedgeHi,
      });
    }

    // Soft mown bands across the lawn, and the bell's faint shadow on it.
    {
      const bs = k.id('bshadow');
      let d = '';
      for (let i = 0; i < 6; i++) {
        const y = 1300 + i * 48 + i * i * 4;
        d += `M-20 ${y}C600 ${y - 14} 1400 ${y + 10} ${k.W + 20} ${y - 6}V${y + 16 + i * 4}C1400 ${y + 26 + i * 4} 600 ${y + 2 + i * 4} -20 ${y + 16 + i * 4}Z`;
      }
      parts.push({
        defs: k.radial(bs, '50%', '50%', '50%', [[0, '#5E5296', 0.22], [1, '#5E5296', 0]]),
        svg: `<path d="${d}" fill="#E8EBAE" fill-opacity="0.22"/>` + `<ellipse cx="560" cy="1336" rx="330" ry="30" fill="url(#${bs})"/>`,
      });
    }
    // Grass streaks and tiny wildflowers across the lawn.
    {
      const rg = rng(303);
      let streaks = '', dots = '';
      for (let i = 0; i < 150; i++) {
        const x = rg() * k.W, y = 1270 + rg() * 300, L = 16 + rg() * 26;
        if (Math.abs(x - TX) < 60 + (y - GY) * 0.4) continue;
        streaks += `M${n(x)} ${n(y)}q${n(4 - rg() * 8)} ${n(-L * 0.5)} ${n(6 - rg() * 12)} ${n(-L)}`;
      }
      for (let i = 0; i < 70; i++) {
        const x = 160 + rg() * (k.W - 320), y = 1290 + rg() * 260;
        if (Math.abs(x - TX) < 60 + (y - GY) * 0.4) continue;
        dots += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(3 + rg() * 3)}" fill="${rg() < 0.5 ? '#F7D6E0' : '#E98AA8'}" fill-opacity="0.85"/>`;
      }
      parts.push({ svg: `<path d="${streaks}" stroke="#8FAE72" stroke-width="3" stroke-linecap="round" fill="none" stroke-opacity="0.6"/>${dots}` });
    }

    // Trees of the State House Yard, framing the hall.
    function tree(x, base, w, h, seed) {
      const r = rng(seed);
      const tg = k.id('crown'), hi = k.id('chi'), sh = k.id('csh');
      let defs = k.radial(tg, '34%', '28%', '80%', [[0, '#79AC84'], [0.5, '#3F7C68'], [1, '#1E4A4C']]) +
        k.radial(hi, '50%', '50%', '50%', [[0, '#D2E4A6', 0.8], [1, '#D2E4A6', 0]]) +
        k.linear(sh, 90, [[0, '#2A3E62', 0], [1, '#2A3E62', 0.5]]);
      let s = '';
      const cy = base - h * 0.64;
      // Trunk and limbs.
      s += `<path d="M${x - 15} ${base}C${x - 10} ${base - h * 0.25} ${x - 8} ${base - h * 0.4} ${x - 26} ${base - h * 0.56}L${x - 15} ${base - h * 0.58}C${x} ${base - h * 0.45} ${x + 4} ${base - h * 0.45} ${x + 18} ${base - h * 0.62}L${x + 26} ${base - h * 0.57}C${x + 10} ${base - h * 0.4} ${x + 12} ${base - h * 0.25} ${x + 17} ${base}Z" fill="#4A3352"/>`;
      s += `<path d="M${x - 11} ${base}C${x - 6} ${base - h * 0.25} ${x - 4} ${base - h * 0.4} ${x - 19} ${base - h * 0.55}" stroke="#A58AB0" stroke-width="3" stroke-opacity="0.45" fill="none"/>`;
      // Crown: a dark silhouette, then lobes back to front, then light.
      const lobes = [];
      for (let i = 0; i < 24; i++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r());
        lobes.push([x + Math.cos(a) * d * w * 0.38, cy + Math.sin(a) * d * h * 0.22 * (Math.sin(a) > 0 ? 0.8 : 1.1), w * (0.12 + r() * 0.08)]);
      }
      lobes.sort((p, q) => p[1] - q[1]);
      const circ = (cx, cy2, rr) => `M${n(cx - rr)} ${n(cy2)}a${n(rr)} ${n(rr)} 0 1 0 ${n(rr * 2)} 0a${n(rr)} ${n(rr)} 0 1 0 ${n(-rr * 2)} 0Z`;
      let sil = '', mass = '';
      for (const L of lobes) { sil += circ(L[0] + 4, L[1] + 7, L[2] * 1.06); mass += circ(L[0], L[1], L[2]); }
      const clip = k.id('cclip'), body = k.id('cbody');
      defs += `<clipPath id="${clip}"><path d="${mass}"/></clipPath>` +
        k.linear(body, 60, [[0, '#6A9E7C'], [0.45, '#3C7666'], [1, '#1F4A4C']]);
      s += `<path d="${sil}" fill="#1B3A46"/>`;
      s += `<path d="${mass}" fill="url(#${body})"/>`;
      s += `<g clip-path="url(#${clip})">`;
      // Each lobe: a darker lower rim where it overlaps the one below.
      for (const L of lobes) s += `<path d="M${n(L[0] - L[2])} ${n(L[1])}A${n(L[2])} ${n(L[2])} 0 0 0 ${n(L[0] + L[2])} ${n(L[1])}" fill="none" stroke="#1E4448" stroke-width="5" stroke-opacity="0.35"/>`;
      // Leaf scallops along each lobe's lit rim.
      let sc = '';
      for (const L of lobes) {
        for (let j = 0; j < 4; j++) {
          const a = Math.PI * (1.05 + j * 0.16);
          const px = L[0] + Math.cos(a) * L[2] * 0.82, py = L[1] + Math.sin(a) * L[2] * 0.82;
          sc += `M${n(px - 7)} ${n(py)}q7 -7 14 0`;
        }
      }
      for (const L of lobes) s += `<circle cx="${n(L[0] - L[2] * 0.32)}" cy="${n(L[1] - L[2] * 0.36)}" r="${n(L[2] * 0.55)}" fill="url(#${hi})"/>`;
      s += `<path d="${sc}" fill="none" stroke="#C2DCA0" stroke-width="2.6" stroke-linecap="round" stroke-opacity="0.35"/>`;
      // Cool shade over the crown's underside.
      s += `<ellipse cx="${x + w * 0.08}" cy="${n(cy + h * 0.16)}" rx="${n(w * 0.55)}" ry="${n(h * 0.2)}" fill="url(#${sh})"/>`;
      s += `</g>`;
      return { defs, svg: s };
    }
    parts.push(tree(1212, GY + 6, 320, 480, 12));
    parts.push(tree(1996, GY + 8, 320, 470, 27));

    // ---- foreground mountain laurel, framing the bottom corners -----------------------
    function blossom(x, y, r, rot, tilt, seed) {
      const bg = k.id('bl');
      const defs = k.radial(bg, '50%', '50%', '50%', [[0, '#F0A2BC'], [0.35, '#F9D3DF'], [0.75, '#FFF2F5'], [1, '#FFFFFF']]);
      let lobes = '';
      for (let i = 0; i < 5; i++) {
        const a0 = ((i - 0.5) * 72) * Math.PI / 180, a1 = ((i + 0.5) * 72) * Math.PI / 180, am = (i * 72) * Math.PI / 180;
        if (!i) lobes += `M${n(Math.cos(a0) * r * 0.82)} ${n(Math.sin(a0) * r * 0.82)}`;
        lobes += `Q${n(Math.cos(am - 0.3) * r * 1.1)} ${n(Math.sin(am - 0.3) * r * 1.1)} ${n(Math.cos(am) * r)} ${n(Math.sin(am) * r)}` +
          `Q${n(Math.cos(am + 0.3) * r * 1.1)} ${n(Math.sin(am + 0.3) * r * 1.1)} ${n(Math.cos(a1) * r * 0.82)} ${n(Math.sin(a1) * r * 0.82)}`;
      }
      let s = `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(1 ${n(tilt)})">`;
      s += `<path d="${lobes}Z" fill="url(#${bg})" stroke="#F3B8C8" stroke-width="${n(r * 0.04)}"/>`;
      // Creases from the centre to each lobe tip, and the ring of anther pockets.
      let cr = '', st = '', dots = '';
      for (let i = 0; i < 5; i++) {
        const am = (i * 72) * Math.PI / 180;
        cr += `M0 0L${n(Math.cos(am) * r * 0.9)} ${n(Math.sin(am) * r * 0.9)}`;
      }
      for (let i = 0; i < 10; i++) {
        const a = (i * 36 + 18) * Math.PI / 180;
        const px = Math.cos(a) * r * 0.6, py = Math.sin(a) * r * 0.6;
        dots += `<circle cx="${n(px)}" cy="${n(py)}" r="${n(r * 0.075)}" fill="#B42E66"/>`;
        st += `M${n(px)} ${n(py)}Q${n(px * 0.3 + py * 0.25)} ${n(py * 0.3 - px * 0.25)} 0 0`;
      }
      s += `<path d="${cr}" stroke="#E79AB3" stroke-width="${n(r * 0.035)}" stroke-opacity="0.7"/>`;
      s += `<path d="${st}" fill="none" stroke="#D0628C" stroke-width="${n(r * 0.035)}" stroke-opacity="0.85"/>`;
      s += dots;
      s += `<circle r="${n(r * 0.11)}" fill="#A6C47E"/><circle r="${n(r * 0.05)}" fill="#6E8E52"/>`;
      s += `</g>`;
      return { defs, svg: s };
    }
    function bud(x, y, r) {
      return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="#E25C8C"/>` +
        `<path d="${[0, 1, 2, 3, 4].map((i) => { const a = (i * 72 - 90) * Math.PI / 180; return `M${n(x)} ${n(y)}L${n(x + Math.cos(a) * r * 0.78)} ${n(y + Math.sin(a) * r * 0.78)}`; }).join('')}" stroke="#B83A6E" stroke-width="${n(r * 0.12)}" stroke-linecap="round" stroke-opacity="0.55"/>` +
        `<circle cx="${n(x - r * 0.35)}" cy="${n(y - r * 0.35)}" r="${n(r * 0.25)}" fill="#FFD0DE" fill-opacity="0.7"/>`;
    }
    function laurelLeaf(x, y, L, ang, fill) {
      const W2 = L * 0.24;
      const t = `translate(${n(x)} ${n(y)}) rotate(${n(ang)})`;
      return `<g transform="${t}"><path d="M0 0C${n(L * 0.25)} ${n(-W2)} ${n(L * 0.7)} ${n(-W2)} ${n(L)} 0C${n(L * 0.7)} ${n(W2)} ${n(L * 0.25)} ${n(W2)} 0 0Z" fill="${fill}"/>` +
        `<path d="M${n(L * 0.06)} 0L${n(L * 0.92)} 0" stroke="#A7CDA0" stroke-width="2.4" stroke-opacity="0.55"/>` +
        `<path d="M${n(L * 0.2)} ${n(-W2 * 0.45)}Q${n(L * 0.5)} ${n(-W2 * 0.8)} ${n(L * 0.78)} ${n(-W2 * 0.4)}" stroke="#D8F0D0" stroke-width="3" stroke-opacity="0.35" fill="none" stroke-linecap="round"/></g>`;
    }
    function laurel(corner, seed) {
      const r = rng(seed);
      const left = corner === 'bl';
      const X = (x) => (left ? x : k.W - x);
      const lf = [k.id('lf'), k.id('lf'), k.id('lf')];
      let defs = k.linear(lf[0], 30, [[0, '#2F6E5E'], [1, '#173F3A']]) + k.linear(lf[1], 30, [[0, '#3E8A70'], [1, '#215248']]) +
        k.linear(lf[2], 30, [[0, '#285F55'], [1, '#12332F']]);
      let leaves = '', blooms = '';
      const clusters = left
        ? [[150, 1420, 1.15], [380, 1520, 0.95], [40, 1250, 0.9], [270, 1300, 0.7], [520, 1590, 0.8]]
        : [[150, 1400, 1.1], [370, 1520, 0.92], [50, 1240, 0.85], [280, 1290, 0.68], [540, 1595, 0.75]];
      // Leaves first: whorls radiating under each cluster, plus filler.
      for (const c of clusters) {
        const cnt = 9;
        for (let i = 0; i < cnt; i++) {
          const a = (i / cnt) * 360 + r() * 30;
          const L = (110 + r() * 50) * c[2];
          leaves += laurelLeaf(X(c[0]), c[1] + 10, L, left ? a : 180 - a, `url(#${lf[(i + Math.floor(r() * 3)) % 3]})`);
        }
      }
      for (let i = 0; i < 14; i++) {
        const x = -20 + r() * 480, y = k.H + 20 - r() * 380 * Math.max(0.2, 1 - x / 520);
        leaves += laurelLeaf(X(x), y, 100 + r() * 60, (left ? -60 : 240) + (r() - 0.5) * 140, `url(#${lf[i % 3]})`);
      }
      // Blossom clusters: a dome of cupped flowers, back ones first, buds round the edge.
      clusters.forEach((c, ci) => {
        const fs = [];
        const R = 112 * c[2];
        for (let i = 0; i < 16; i++) {
          const a = r() * Math.PI * 2, d = Math.sqrt(r());
          fs.push([X(c[0]) + Math.cos(a) * d * R, c[1] - 30 * c[2] + Math.sin(a) * d * R * 0.78, d]);
        }
        fs.sort((p, q) => p[1] - q[1]);
        for (let i = 0; i < 6; i++) {
          const a = -Math.PI * (0.1 + r() * 0.8);
          blooms += bud(X(c[0]) + Math.cos(a) * R * 1.05, c[1] - 30 * c[2] + Math.sin(a) * R * 0.85, (10 + r() * 5) * c[2]);
        }
        for (const f of fs) {
          const b = blossom(f[0], f[1], (30 + r() * 8) * c[2], r() * 72, 0.95 - f[2] * 0.3, seed + ci);
          defs += b.defs;
          blooms += b.svg;
        }
      });
      return { defs, svg: leaves + blooms };
    }
    parts.push(laurel('bl', 61));
    parts.push(laurel('br', 94));

    return k.spread(parts, { grain: 0.6 });
  },
};
