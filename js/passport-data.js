/* ==========================================================================
   passport-data.js — what's printed on the passport's visa pages.

   One entry per SPREAD (two facing visa pages), in book order. The nine
   follow the visa pages of the current US passport (the Next Generation
   book, 2021–, pages 8–25): the same quotations, word for word and in the
   same order, each over a public-domain American painting of that page's
   subject. The paintings are listed in tools/visas/spreads.js and rendered
   by tools/build-visas.js into assets/passport/web/visa-NN.webp; everything
   here is live text laid over them by js/passport.js, so it can be edited
   without rebuilding the art.

     title   Big caption, bottom-left of the left page (the Wallet-ID "name").
     sub     Small line under it.
     quote   Runs across the top of the spread, as in the real passport.
     by      Attribution under the quote, as the passport prints it.
     credit  The painting, up the outer edge of the right page.
     alt     What the painting shows, for screen readers.
   ========================================================================== */

window.PASSPORT_VISAS = [
  {
    title: 'Philadelphia',
    sub: 'Independence Hall',
    quote: 'We have a great dream. It started way back in 1776, and God grant that America will be true to her dream.',
    by: 'Martin Luther King, Jr.',
    credit: 'Ferdinand Richardt · Independence Hall in Philadelphia · 1858–63 · The White House',
    alt: 'A painting of Independence Hall’s white clock tower and the red-brick Congress Hall beside it, with crowds, carriages and children on Chestnut Street under a cloudy sky.',
  },
  {
    title: 'Penobscot Bay',
    sub: 'Owl’s Head Light · Maine',
    quote: 'Let every nation know, whether it wishes us well or ill, that we shall pay any price, bear any burden, meet any hardship, support any friend, oppose any foe, in order to assure the survival and the success of liberty.',
    by: 'John F. Kennedy',
    credit: 'Fitz Henry Lane · Owl’s Head, Penobscot Bay, Maine · 1862 · Museum of Fine Arts, Boston',
    alt: 'A painting of a square-rigged ship riding at anchor on a glassy bay at dawn, beside a wooded island with a white lighthouse and keeper’s house, a man standing on the rocky shore in front.',
  },
  {
    title: 'The Ohio River',
    sub: 'Near Wheeling',
    quote: 'This is a new nation, based on a mighty continent, of boundless possibilities.',
    by: 'Theodore Roosevelt',
    credit: 'Lefevre James Cranstone · The Ohio River near Wheeling, West Virginia · 1859–60 · The Metropolitan Museum of Art',
    alt: 'A watercolor of a broad river winding between hazy hills, a white twin-stacked steamboat trailing smoke along the right bank.',
  },
  {
    title: 'Washington',
    sub: 'Crossing the Delaware · 1776',
    quote: 'Let us raise a standard to which the wise and honest can repair…',
    by: 'George Washington',
    credit: 'Emanuel Leutze · Washington Crossing the Delaware · 1851 · The Metropolitan Museum of Art',
    alt: 'A painting of George Washington standing in the bow of a crowded rowboat, soldiers poling it through the ice of the Delaware at dawn as the flag streams behind him.',
  },
  {
    title: 'Sierra Nevada',
    sub: 'California',
    quote: 'The principle of free governments adheres to the American soil. It is bedded in it, immovable as its mountains.',
    by: 'Daniel Webster',
    credit: 'Albert Bierstadt · Among the Sierra Nevada, California · 1868 · Smithsonian American Art Museum',
    alt: 'A painting of snowy peaks breaking through storm clouds above a still mountain lake, a waterfall pouring down a granite cliff on the left and deer at the water’s edge.',
  },
  {
    title: 'Delaware Valley',
    sub: 'Harvest',
    quote: 'Whatever America hopes to bring to pass in the world must first come to pass in the heart of America.',
    by: 'Dwight D. Eisenhower',
    credit: 'George Inness · Harvest Scene in the Delaware Valley · 1867 · National Gallery of Art',
    alt: 'A painting of sunbeams breaking through clouds over a wide valley, a stand of trees and a farmhouse beyond fields where harvested grain stands in shocks.',
  },
  {
    title: 'The Plains',
    sub: 'Texas longhorns',
    quote: 'For this is what America is all about. It is the uncrossed desert and the unclimbed ridge. It is the star that is not reached and the harvest sleeping in the unplowed ground. Is our world gone? We say ‘Farewell.’ Is a new world coming? We welcome it—and we will bend it to the hopes of man.',
    by: 'Lyndon B. Johnson',
    credit: 'Frank Reaugh · The Approaching Herd · 1902 · Panhandle–Plains Historical Museum',
    alt: 'A painting of longhorn cattle walking toward the viewer through tall dry prairie grass, a white steer in the lead, under a pale hazy sky.',
  },
  {
    title: 'Waikīkī',
    sub: 'Diamond Head · Oʻahu',
    quote: 'Every generation has the obligation to free men’s minds for a look at new worlds… to look out from a higher plateau than the last generation.',
    by: 'Ellison S. Onizuka',
    credit: 'Gideon Jacques Denny · Diamond Head from Waikiki · 1882 · Bishop Museum',
    alt: 'A painting of tall coconut palms on the flats of Waikīkī, the long ridge of Diamond Head beyond a grove and a sliver of surf, under a soft grey sky.',
  },
  {
    title: 'Starrucca Viaduct',
    sub: 'Susquehanna Valley · Pennsylvania',
    quote: 'May God continue the unity of our country as this railroad unites the two great oceans of the world.',
    by: 'Inscribed on the Golden Spike, Promontory, Utah, 1869',
    credit: 'Jasper Francis Cropsey · Starrucca Viaduct, Pennsylvania · 1865 · Toledo Museum of Art',
    alt: 'A painting of an autumn valley seen from a rocky outcrop, a steam train crossing a long stone viaduct below wooded hills, a lake and village in the valley.',
  },
];
