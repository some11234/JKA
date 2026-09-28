/* ==========================================================================
   build-travel-map.js — writes assets/travel/countries.json, the one map file
   the travel page draws its globe from.

   You should almost never need to run this. The file it makes is committed,
   and adding a country to the page is an edit to js/travel-data.js, not a
   rebuild. Rerun it only to change how much coastline detail the globe has.

     npm install --no-save world-atlas@2 topojson-client@3 topojson-simplify@3 \
                           d3-geo@3 i18n-iso-countries@7
     node tools/build-travel-map.js

   WHY NOT JUST SHIP A WORLD-ATLAS FILE AS-IS
   world-atlas comes in two sizes and neither fits:

     countries-110m   38KB gzipped, but it leaves out 64 places — the Vatican,
                      Monaco, Malta, Liechtenstein, Andorra, San Marino,
                      Singapore, Hong Kong, most of the Caribbean. From a
                      semester in Brussels, those are exactly the trips most
                      likely to happen next.
     countries-50m    has all of them, but it is 80,000 points and 230KB
                      gzipped — too heavy to redraw sixty times a second while
                      the globe spins, especially on a phone.

   So this takes 50m and thins it, with two guards:

     1. Small countries are protected. A global threshold removes points by
        how little area they carry, which for a country the size of the
        Vatican means every point it has — it collapses to nothing. Any
        country under PROTECT_SR keeps its full 50m outline.
     2. Rings the thinning did collapse (slivers of coast on big countries,
        never a whole country) are dropped, since they draw nothing anyway.

   It also bakes an ISO alpha-2 code into every country (a2: 'FR'), so the
   data file can say code: 'FR' instead of the numeric ids the atlas uses.
   ========================================================================== */

'use strict';

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var topojson = Object.assign({}, require('topojson-client'), require('topojson-simplify'));
var d3 = require('d3-geo');
var iso = require('i18n-iso-countries');

/* Points carrying less spherical area than this (in steradians) are removed.
   2e-6 keeps coastlines crisp when the globe zooms into a small country like
   Belgium; raising it makes the file smaller and the outlines blockier. */
var MIN_WEIGHT = 2e-6;

/* Countries smaller than this keep every point. 5e-5 sr is about 2,000 km² —
   a little under Luxembourg — so every microstate and small island nation is
   covered, and nothing big enough to matter for file size is. */
var PROTECT_SR = 5e-5;

/* Coordinate grid. 3e4 steps round the world is ~1.3km, finer than a pixel at
   the globe's closest zoom. */
var QUANTIZE = 3e4;

/* The atlas has no ISO number for these, so the lookup cannot find them. XK is
   the user-assigned code in common use for Kosovo. The rest stay code-less:
   they still draw and still show their names on hover. */
var EXTRA_CODES = { 'Kosovo': 'XK' };

var OUT = path.join(__dirname, '..', 'assets', 'travel', 'countries.json');

var src = require('world-atlas/countries-50m.json');

/* ---------------------------------------------------------------- thin --- */

var pre = topojson.presimplify(src, topojson.sphericalTriangleArea);

// Pin every point of every small country so simplify() can't touch them.
var original = topojson.feature(src, src.objects.countries).features;
src.objects.countries.geometries.forEach(function (geom, i) {
  if (d3.geoArea(original[i]) >= PROTECT_SR) return;
  arcsOf(geom).forEach(function (index) {
    pre.arcs[index < 0 ? ~index : index].forEach(function (point) { point[2] = Infinity; });
  });
});

var topo = topojson.simplify(pre, MIN_WEIGHT);

// A ring needs three distinct corners to enclose anything; fewer means
// simplify() flattened it into a line or a dot. filter() hands over each ring
// as a list of ARC INDEXES, not points, so it has to be resolved first —
// counting the indexes instead silently drops every country bordered by fewer
// than a handful of arcs.
topo = topojson.filter(topo, function (ring) {
  var points = topojson.feature(topo, { type: 'Polygon', arcs: [ring] }).geometry.coordinates[0];
  var distinct = {};
  points.forEach(function (p) { distinct[p[0] + ',' + p[1]] = true; });
  return Object.keys(distinct).length >= 3;
});

topo = topojson.quantize(topo, QUANTIZE);

/* --------------------------------------------------------------- codes --- */

var features = topojson.feature(topo, topo.objects.countries).features;

// A few ISO numbers are shared (Australia with Ashmore and Cartier Islands).
// The code goes to the larger of the two — the one anyone means by it.
var owner = {};
topo.objects.countries.geometries.forEach(function (geom, i) {
  var a2 = EXTRA_CODES[geom.properties.name] ||
           (geom.id != null ? iso.numericToAlpha2(geom.id) : null);
  if (!a2) return;
  var area = d3.geoArea(features[i]);
  if (!owner[a2] || area > owner[a2].area) owner[a2] = { index: i, area: area };
});

topo.objects.countries.geometries.forEach(function (geom, i) {
  geom.properties = { name: geom.properties.name };
  for (var a2 in owner) if (owner[a2].index === i) geom.properties.a2 = a2;
  delete geom.id;   // the page only ever looks countries up by a2
});

/* -------------------------------------------------------------- checks --- */

// d3 decides which side of a ring is "inside" by its winding. If thinning ever
// flipped one, that country would fill the entire globe except itself — so
// refuse to write a file with any polygon bigger than a hemisphere.
topojson.feature(topo, topo.objects.countries).features.forEach(function (f) {
  if (f.geometry && d3.geoArea(f) > 2 * Math.PI) {
    throw new Error(f.properties.name + ' came out inside-out; lower MIN_WEIGHT.');
  }
});

/* --------------------------------------------------------------- write --- */

var json = JSON.stringify(topo);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, json);

var points = topo.arcs.reduce(function (n, arc) { return n + arc.length; }, 0);
console.log('wrote ' + path.relative(process.cwd(), OUT) + ': ' +
  topo.objects.countries.geometries.length + ' countries, ' +
  Object.keys(owner).length + ' with codes, ' + points + ' points, ' +
  Math.round(json.length / 1024) + 'KB (' +
  Math.round(zlib.gzipSync(json, { level: 9 }).length / 1024) + 'KB gzipped)');

/* ------------------------------------------------------------- helpers --- */

function arcsOf(geom) {
  var out = [];
  (function walk(a) {
    if (typeof a === 'number') out.push(a);
    else if (a) a.forEach(walk);
  }(geom.arcs));
  return out;
}
