/* ==========================================================================
   FOCUS — interactions
   - Nav scroll state
   - Hero counter animation (attention tax ticker)
   - Live ROI calculator
   - Scroll-reveal
   - Demo form handling
   ========================================================================== */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------- Format helpers ---------------------------------------------- */
  function formatMoney(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }
  function formatInt(n) {
    return Math.round(n).toLocaleString('en-US');
  }

  /* -------- Nav scroll state -------------------------------------------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 8) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* -------- Hero counters ------------------------------------------------ */
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-target'));
    var prefix = el.getAttribute('data-prefix') || '';
    if (prefersReduced) {
      el.textContent = prefix + (target >= 1000 ? formatInt(target) : target);
      return;
    }
    var duration = 1800;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = prefix + (target >= 1000 ? formatInt(val) : Math.round(val));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + (target >= 1000 ? formatInt(target) : target);
    }
    requestAnimationFrame(step);
  }

  // Ambient ticker: slowly increment the dollar counter after the initial animation
  function startAmbientTicker() {
    var counter = document.getElementById('tax-counter');
    if (!counter) return;
    var base = parseFloat(counter.getAttribute('data-target'));
    var startTime = Date.now();
    // $216,000 / year ≈ $0.0069 per second; speed up so the change is visible
    var perSecond = 0.42;
    setInterval(function () {
      if (prefersReduced) return;
      var elapsed = (Date.now() - startTime) / 1000;
      var current = base + elapsed * perSecond;
      counter.textContent = '$' + formatInt(current);
    }, 220);
  }

  document.querySelectorAll('[data-target]').forEach(animateCounter);
  // Delay the ambient ticker until the initial animation has played
  setTimeout(startAmbientTicker, 2000);

  /* -------- ROI calculator ---------------------------------------------- */
  (function roi() {
    var teamEl = document.getElementById('roi-team');
    var rateEl = document.getElementById('roi-rate');
    if (!teamEl || !rateEl) return;

    var teamVal = document.getElementById('roi-team-val');
    var rateVal = document.getElementById('roi-rate-val');
    var eqTeam = document.getElementById('eq-team');
    var eqRate = document.getElementById('eq-rate');
    var eqTotal = document.getElementById('eq-total');
    var lostEl = document.getElementById('roi-lost');
    var savedEl = document.getElementById('roi-saved');
    var taxNote = document.getElementById('tax-team-note');

    var WORKDAYS = 240;
    var HOURS_LOST = 1.5; // industry average hours lost per day
    var RECOVER_MIN = 20; // minutes recovered per employee per day

    function recompute() {
      var team = parseInt(teamEl.value, 10);
      var rate = parseInt(rateEl.value, 10);

      teamVal.textContent = formatInt(team);
      rateVal.textContent = '$' + rate;

      eqTeam.textContent = formatInt(team);
      eqRate.textContent = '$' + rate;

      var lost = team * HOURS_LOST * WORKDAYS * rate;
      var saved = team * (RECOVER_MIN / 60) * WORKDAYS * rate;

      eqTotal.textContent = formatMoney(lost);
      lostEl.textContent = formatMoney(lost);
      savedEl.textContent = formatMoney(saved);

      if (taxNote) taxNote.textContent = '— based on a ' + team + '-person team';
    }

    [teamEl, rateEl].forEach(function (el) {
      el.addEventListener('input', recompute);
    });
    recompute();
  })();

  /* -------- Scroll reveal ----------------------------------------------- */
  (function reveal() {
    if (prefersReduced) return;
    var targets = document.querySelectorAll(
      '.section__intro, .feature, .finding, .conclusion, .roi, .plan, .cta__copy, .form'
    );
    targets.forEach(function (el) { el.classList.add('reveal'); });

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  })();

  /* -------- Demo form --------------------------------------------------- */
  (function form() {
    var f = document.getElementById('demo-form');
    var status = document.getElementById('form-status');
    if (!f) return;

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(f);
      var required = ['firstname', 'email', 'company', 'teamsize', 'challenge'];
      var missing = required.filter(function (name) {
        var v = (data.get(name) || '').toString().trim();
        return !v;
      });
      if (missing.length) {
        status.textContent = 'Please complete every field so we can prepare your demo.';
        status.classList.add('is-error');
        return;
      }
      var email = data.get('email').toString().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.textContent = 'That email doesn’t look right. Use a work email address.';
        status.classList.add('is-error');
        return;
      }
      status.classList.remove('is-error');
      status.textContent = 'Thanks — your demo is scheduled. We’ll reach out within one business day.';
      f.reset();
    });
  })();

})();
