/* ==========================================================================
   site.js — the handful of things every page needs, with no dependencies.

   The home page loads main.js, which carries GSAP and ScrollTrigger for the
   journey. Pages without the journey should not pay 160KB for a copyright
   year, so they load this instead.
   ========================================================================== */

(function () {
  'use strict';

  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}());
