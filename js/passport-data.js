/* ==========================================================================
   passport-data.js — what's printed on the passport's visa pages.

   One entry per SPREAD (two facing visa pages), in book order. The art for
   each spread is drawn by tools/visas/NN-*.js and rendered by
   tools/build-visas.js into assets/passport/web/visa-NN.webp; everything
   here is live text laid over it by js/passport.js, so it can be edited
   without rebuilding the art.

     title  Big caption, bottom-left of the left page (the Wallet-ID "name").
     sub    Small line under it.
     quote  Runs across the top of the spread, like the quotations printed in
            a real US passport.
     by     Attribution under the quote.
     alt    What the art shows, for screen readers.

   The landmarks follow the "American Icons" theme of real US passport visa
   pages; the page order and pairings here are this passport's own.
   ========================================================================== */

window.PASSPORT_VISAS = [
  {
    title: 'The Constitution',
    sub: 'Philadelphia, 1787',
    quote: 'We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility … do ordain and establish this Constitution for the United States of America.',
    by: 'Preamble to the Constitution',
    alt: 'The first page of the Constitution with “We the People” in calligraphy, a quill in an inkwell, and a bald eagle soaring in front of a pale sunburst, framed by roses.',
  },
  {
    title: 'Philadelphia',
    sub: 'Independence Hall · the Liberty Bell',
    quote: 'Let us raise a standard to which the wise and honest can repair. The event is in the hand of God.',
    by: 'George Washington',
    alt: 'The Liberty Bell, crack and all, hanging from its wooden yoke, beside the brick facade and white clock tower of Independence Hall, with mountain laurel in the corners.',
  },
  {
    title: 'New York Harbor',
    sub: 'Statue of Liberty · Ellis Island',
    quote: 'The cause of freedom is not the cause of a race or a sect, a party or a class—it is the cause of human kind, the very birthright of humanity.',
    by: 'Anna Julia Cooper',
    alt: 'The Statue of Liberty raising her torch over New York Harbor at sunrise, with a ferry on the water and Ellis Island in the distance.',
  },
  {
    title: 'The Mississippi',
    sub: 'Heart of America',
    quote: 'Whatever America hopes to bring to pass in the world must first come to pass in the heart of America.',
    by: 'Dwight D. Eisenhower',
    alt: 'A white paddlewheel steamboat with twin smokestacks on the Mississippi at golden hour, farmland, a red barn and cottonwoods on the far bank, coneflowers in the corners.',
  },
  {
    title: 'The Great Plains',
    sub: 'American bison',
    quote: 'We have a great dream. It started way back in 1776, and God grant that America will be true to her dream.',
    by: 'Martin Luther King Jr.',
    alt: 'A great shaggy bison standing in tall prairie grass, a distant herd and a winding creek behind it, and a bald eagle soaring small in the big sky.',
  },
  {
    title: 'The Frontier',
    sub: 'Monument Valley',
    quote: 'This country will not be a permanently good place for any of us to live in unless we make it a reasonably good place for all of us to live in.',
    by: 'Theodore Roosevelt',
    alt: 'A cowboy on horseback swinging a lasso behind a few Texas longhorns, red sandstone buttes and saguaro cacti under a sunset sky, prickly pear blooming in the corners.',
  },
  {
    title: 'Mount Rushmore',
    sub: 'Black Hills, South Dakota',
    quote: 'Let every nation know, whether it wishes us well or ill, that we shall pay any price, bear any burden, meet any hardship, support any friend, oppose any foe, in order to assure the survival and the success of liberty.',
    by: 'John F. Kennedy',
    alt: 'The four granite faces of Mount Rushmore above ponderosa pines in the Black Hills, pasqueflowers in the corners.',
  },
  {
    title: 'The Rockies',
    sub: 'Transcontinental Railroad, 1869',
    quote: '…that this nation, under God, shall have a new birth of freedom—and that government of the people, by the people, for the people, shall not perish from the earth.',
    by: 'Abraham Lincoln',
    alt: 'A steam locomotive billowing steam as it crosses a wooden trestle, its cars trailing back past snow-capped Rocky Mountain peaks, columbines in the corners.',
  },
  {
    title: 'Tranquility Base',
    sub: 'The Moon · July 20, 1969',
    quote: 'That’s one small step for man, one giant leap for mankind.',
    by: 'Neil Armstrong',
    alt: 'The Apollo lunar module and an American flag on the Moon’s surface, a bootprint in the dust, and Earth rising in a deep violet sky.',
  },
];
