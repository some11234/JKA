/* ==========================================================================
   spreads.js — the painting behind each visa spread, in book order.

   The nine spreads follow the visa pages of the current US passport (the
   Next Generation book, 2021–), pages 8–25: each real spread's subject is
   recreated with a public-domain American painting of it, or of the nearest
   thing where no painting exists. One entry per spread, matched by position
   with js/passport-data.js (which holds the quote, caption and credit):

     slug     names the cached master: tools/visas/.masters/<slug>.<ext>
     sources  download URLs, tried in order (Wikimedia Commons serves its
              standard 3840 px thumbnail more reliably than an original)
     crop     { inset, w, x, y } — see cropBox() in grade.js
     grade    overrides for any default at the top of grade.js
   ========================================================================== */

'use strict';

const commons = (path, width) => {
  const file = path.split('/').pop();
  return width
    ? `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${width}px-${file}`
    : `https://upload.wikimedia.org/wikipedia/commons/${path}`;
};
const nga = (id) => `https://api.nga.gov/iiif/${id}/full/!4096,4096/0/default.jpg`;

module.exports = [
  {
    // pp. 8–9, the Liberty Bell and Independence Hall.
    slug: 'richardt-independence-hall',
    sources: [
      commons('c/cf/Ferdinand_Richardt_-_Independence_Hall_in_Philadelphia_-_Google_Art_Project.jpg', 3840),
      commons('c/cf/Ferdinand_Richardt_-_Independence_Hall_in_Philadelphia_-_Google_Art_Project.jpg'),
    ],
    crop: { inset: 0.01, x: 0.68 },
  },
  {
    // pp. 10–11, a ship under sail and a lighthouse.
    slug: 'lane-owls-head',
    sources: [
      commons('8/88/Fitz_Henry_Lane_-_Owl%27s_Head%2C_Penobscot_Bay%2C_Maine_-_Google_Art_Project.jpg', 3840),
      commons('8/88/Fitz_Henry_Lane_-_Owl%27s_Head%2C_Penobscot_Bay%2C_Maine_-_Google_Art_Project.jpg'),
    ],
    crop: { inset: 0.01, w: 0.633, x: 0.583, y: 0.55 },
  },
  {
    // pp. 12–13, a steamboat on a broad river below hills.
    slug: 'cranstone-ohio-river',
    sources: ['https://images.metmuseum.org/CRDImages/ad/original/APS1663.jpg'],
    crop: { inset: 0.03, w: 0.76, x: 0, y: 0.3 },
  },
  {
    // pp. 14–15, Mount Rushmore, with Washington's words: no painting of the
    // carving can be old enough, so Washington himself.
    slug: 'leutze-washington-crossing',
    sources: [
      commons('9/95/Washington_Crossing_the_Delaware_by_Emanuel_Leutze%2C_MMA-NYC%2C_1851.jpg', 3840),
      commons('9/95/Washington_Crossing_the_Delaware_by_Emanuel_Leutze%2C_MMA-NYC%2C_1851.jpg'),
      'https://images.metmuseum.org/CRDImages/ad/original/DP215410.jpg',
    ],
    crop: { inset: 0.008, x: 0.02 },
  },
  {
    // pp. 16–17, jagged peaks mirrored in a mountain lake.
    slug: 'bierstadt-sierra-nevada',
    sources: ['https://ids.si.edu/ids/download?id=SAAM-1977.107.1_2.jpg'],
    crop: { inset: 0.01, x: 0.5 },
  },
  {
    // pp. 18–19, wheat, a plough team and a farmstead.
    slug: 'inness-harvest',
    sources: [nga('11dc7010-58a3-465a-8134-7a08a563294a')],
    crop: { inset: 0.02, x: 0.5 },
  },
  {
    // pp. 20–21, a longhorn cattle drive.
    slug: 'reaugh-approaching-herd',
    sources: [
      commons('3/3e/Frank_Reaugh_-_The_Approaching_Herd_%281902%29.jpg', 3840),
    ],
    crop: { inset: 0.01, x: 0.74 },
  },
  {
    // pp. 22–23, palms and Diamond Head.
    slug: 'denny-diamond-head',
    sources: [
      commons('3/39/%27Diamond_Head_from_Waikiki%27%2C_oil_on_canvas_painting_by_Gideon_Jacques_Denny%2C_1882%2C_Bishop_Museum.JPG', 3840),
      commons('3/39/%27Diamond_Head_from_Waikiki%27%2C_oil_on_canvas_painting_by_Gideon_Jacques_Denny%2C_1882%2C_Bishop_Museum.JPG'),
    ],
    crop: { inset: 0.005, x: 0 },
  },
  {
    // pp. 24–25, a steam train crossing a trestle in wooded hills.
    slug: 'cropsey-starrucca-viaduct',
    sources: [
      commons('a/a0/Jasper_Francis_Cropsey_-_Starrucca_Viaduct%2C_Pennsylvania_-_Google_Art_Project.jpg', 3840),
      commons('a/a0/Jasper_Francis_Cropsey_-_Starrucca_Viaduct%2C_Pennsylvania_-_Google_Art_Project.jpg'),
    ],
    crop: { inset: 0.008, x: 0 },
  },
];
