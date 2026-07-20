/* ==========================================================================
   FOCUS — interactions
   - Nav scroll state
   - Hero counter animation (attention tax ticker)
   - Live ROI calculator
   - Scroll-reveal
   - Demo form handling
   ========================================================================== */

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const formatMoney = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
const formatInt = (n) => Math.round(n).toLocaleString('en-US');

/* -------- Nav scroll state -------------------------------------------- */
const nav = document.getElementById('nav');

const onScroll = () => {
  nav?.classList.toggle('is-scrolled', window.scrollY > 8);
};

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* -------- Hero counters ------------------------------------------------ */
const animateCounter = (el) => {
  const target = parseFloat(el.dataset.target);
  const prefix = el.dataset.prefix || '';

  if (prefersReduced) {
    el.textContent = prefix + (target >= 1000 ? formatInt(target) : target);
    return;
  }

  const duration = 1800;
  let start = null;

  const step = (ts) => {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    const eased = 1 - (1 - p) ** 3;
    const val = target * eased;
    el.textContent = prefix + (target >= 1000 ? formatInt(val) : Math.round(val));
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = prefix + (target >= 1000 ? formatInt(target) : target);
  };

  requestAnimationFrame(step);
};

const startAmbientTicker = () => {
  const counter = document.getElementById('tax-counter');
  if (!counter) return;

  const base = parseFloat(counter.dataset.target);
  const startTime = Date.now();
  // $216,000 / year ≈ $0.0069 per second; speed up so the change is visible
  const perSecond = 0.42;

  setInterval(() => {
    if (prefersReduced) return;
    const elapsed = (Date.now() - startTime) / 1000;
    const current = base + elapsed * perSecond;
    counter.textContent = `$${formatInt(current)}`;
  }, 220);
};

document.querySelectorAll('[data-target]').forEach(animateCounter);
setTimeout(startAmbientTicker, 2000);

/* -------- ROI calculator ---------------------------------------------- */
const initRoi = () => {
  const teamEl = document.getElementById('roi-team');
  const rateEl = document.getElementById('roi-rate');
  if (!teamEl || !rateEl) return;

  const teamVal = document.getElementById('roi-team-val');
  const rateVal = document.getElementById('roi-rate-val');
  const eqTeam = document.getElementById('eq-team');
  const eqRate = document.getElementById('eq-rate');
  const eqTotal = document.getElementById('eq-total');
  const lostEl = document.getElementById('roi-lost');
  const savedEl = document.getElementById('roi-saved');
  const taxNote = document.getElementById('tax-team-note');

  const WORKDAYS = 240;
  const HOURS_LOST = 1.5;
  const RECOVER_MIN = 20;

  const recompute = () => {
    const team = Number.parseInt(teamEl.value, 10);
    const rate = Number.parseInt(rateEl.value, 10);

    teamVal.textContent = formatInt(team);
    rateVal.textContent = `$${rate}`;
    eqTeam.textContent = formatInt(team);
    eqRate.textContent = `$${rate}`;

    const lost = team * HOURS_LOST * WORKDAYS * rate;
    const saved = team * (RECOVER_MIN / 60) * WORKDAYS * rate;

    eqTotal.textContent = formatMoney(lost);
    lostEl.textContent = formatMoney(lost);
    savedEl.textContent = formatMoney(saved);

    if (taxNote) taxNote.textContent = `— based on a ${team}-person team`;
  };

  for (const el of [teamEl, rateEl]) {
    el.addEventListener('input', recompute);
  }
  recompute();
};

initRoi();

/* -------- Scroll reveal ----------------------------------------------- */
const initReveal = () => {
  if (prefersReduced) return;

  const targets = document.querySelectorAll(
    '.section__intro, .feature, .finding, .conclusion, .roi, .plan, .cta__copy, .form'
  );

  for (const el of targets) el.classList.add('reveal');

  if (!('IntersectionObserver' in window)) {
    for (const el of targets) el.classList.add('is-in');
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  for (const el of targets) io.observe(el);
};

initReveal();

/* -------- Demo form --------------------------------------------------- */
const initForm = () => {
  const form = document.getElementById('demo-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const required = ['firstname', 'email', 'company', 'teamsize', 'challenge'];
    const missing = required.filter((name) => {
      const v = (data.get(name) || '').toString().trim();
      return !v;
    });

    if (missing.length) {
      status.textContent = 'Please complete every field so we can prepare your demo.';
      status.classList.add('is-error');
      return;
    }

    const email = data.get('email').toString().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.textContent = 'That email doesn’t look right. Use a work email address.';
      status.classList.add('is-error');
      return;
    }

    status.classList.remove('is-error');
    status.textContent = 'Thanks — your demo is scheduled. We’ll reach out within one business day.';
    form.reset();
  });
};

initForm();
