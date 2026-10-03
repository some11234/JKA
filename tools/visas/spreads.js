/* ==========================================================================
   spreads.js — the painting behind each visa spread, in book order.

   One entry per spread, matched by position with js/passport-data.js:

     slug     names the cached master: tools/visas/.masters/<slug>.<ext>
     sources  download URLs, tried in order (museum open-access first,
              Wikimedia Commons as a fallback)
     crop     { inset, w, x, y } — see cropBox() in grade.js
     grade    overrides for any default at the top of grade.js

   WIP: the nine paintings are being chosen; until they're listed here the
   pages in assets/passport/web/ are the earlier drafts.
   ========================================================================== */

'use strict';

module.exports = [];
