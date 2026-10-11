/* ==========================================================================
   passport-data.js — Joe's travel stamps, and where they're stuck in.

   The visa pages themselves are plain, weathered paper (made by
   tools/build-visa-paper.py into assets/passport/web/visa-NN.webp) with
   nothing printed on them but a page number. The book has exactly as many
   of them as the stamps below fill, in whole spreads, so there are never
   blank pages to leaf through: put a stamp on a later page and the book
   grows to reach it (then rerun the paper build — see tools/README.md).
   ========================================================================== */

/* --------------------------------------------------------------------------
   PASSPORT_STAMPS — Joe's American Express travel stamps, stuck onto the
   visa pages in the order he went, the way a real passport fills up. Each
   is its own element on its page, so it turns with the leaf it's on.

     stamp   The image: assets/passport/web/stamp-<stamp>.webp, made by
             tools/build-passport.py from "<Country> <Year>.png" in
             assets/passport/ (lowercased, spaces to hyphens).
     name    The country, as it's read out.
     year    The year on the stamp.
     page    Which visa page, from 1: odd on the left, even on the right.
     at      Where the stamp's centre goes: [across, down], in % of the
             page. Keep it clear of the spine — at most ~62 across on a left
             page, at least ~38 on a right one — and of the page number in
             the top outer corner.
     tilt    Degrees, clockwise. Small and never quite square: stuck down
             by hand, not by a machine.

   Germany and Iceland were one trip, so they're stuck in together,
   overlapping a little; the rest each have room of their own.
   -------------------------------------------------------------------------- */

window.PASSPORT_STAMPS = [
  { stamp: 'united-states-of-america-2006', name: 'United States', year: 2006, page: 1, at: [39, 27], tilt: -3.2 },
  { stamp: 'mexico-2015', name: 'Mexico', year: 2015, page: 1, at: [56, 69], tilt: 2.6 },
  { stamp: 'germany-2017', name: 'Germany', year: 2017, page: 2, at: [38, 40], tilt: -4.2 },
  { stamp: 'iceland-2017', name: 'Iceland', year: 2017, page: 2, at: [60, 63], tilt: 3.4 },
  { stamp: 'canada-2025', name: 'Canada', year: 2025, page: 3, at: [33, 18.5], tilt: -2.3 },
  { stamp: 'united-kingdom-2026', name: 'United Kingdom', year: 2026, page: 3, at: [58, 50], tilt: 4.1 },
  { stamp: 'belgium-2026', name: 'Belgium', year: 2026, page: 3, at: [40, 81.5], tilt: -3.0 },
  { stamp: 'netherlands-2026', name: 'the Netherlands', year: 2026, page: 4, at: [45, 19], tilt: 2.2 },
  { stamp: 'portugal-2026', name: 'Portugal', year: 2026, page: 4, at: [64, 50.5], tilt: -3.7 },
  { stamp: 'malta-2026', name: 'Malta', year: 2026, page: 4, at: [41, 81.5], tilt: 2.8 },
];
