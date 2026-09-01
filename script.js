/* Minimal interactions: scroll reveal + header border on scroll. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.reveal');

  /* --- Scroll reveal --- */
  if (reduced || !('IntersectionObserver' in window)) {
    for (var i = 0; i < items.length; i++) items[i].classList.add('is-visible');
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(function (el, index) {
      var group = el.parentElement;
      var siblings = group ? group.querySelectorAll(':scope > .reveal') : [];
      var position = Array.prototype.indexOf.call(siblings, el);
      el.style.setProperty('--d', Math.min(position < 0 ? index : position, 4) * 70 + 'ms');
      observer.observe(el);
    });
  }

  /* --- Header hairline once the page is scrolled --- */
  var header = document.querySelector('.site-header');
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    });
  }

  if (header) {
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
