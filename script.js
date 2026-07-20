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

/* -------- Custom selects ---------------------------------------------- */
const initSelects = () => {
  const selects = document.querySelectorAll('[data-select]');
  if (!selects.length) return;

  const closeAll = (except) => {
    for (const root of selects) {
      if (root === except) continue;
      closeSelect(root);
    }
  };

  const closeSelect = (root) => {
    const trigger = root.querySelector('.select__trigger');
    const menu = root.querySelector('.select__menu');
    if (!trigger || !menu) return;
    root.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    for (const opt of menu.querySelectorAll('.select__option')) {
      opt.classList.remove('is-active');
    }
  };

  const openSelect = (root) => {
    const trigger = root.querySelector('.select__trigger');
    const menu = root.querySelector('.select__menu');
    if (!trigger || !menu) return;
    closeAll(root);
    root.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    menu.hidden = false;

    const selected = menu.querySelector('.select__option[aria-selected="true"]');
    const first = menu.querySelector('.select__option');
    const active = selected || first;
    if (active) {
      active.classList.add('is-active');
      active.focus();
    }
  };

  const setValue = (root, value, label) => {
    const native = root.querySelector('.select__native');
    const valueEl = root.querySelector('.select__value');
    const menu = root.querySelector('.select__menu');
    if (!native || !valueEl || !menu) return;

    native.value = value;
    native.dispatchEvent(new Event('change', { bubbles: true }));
    valueEl.textContent = label;
    valueEl.classList.remove('is-placeholder');

    for (const opt of menu.querySelectorAll('.select__option')) {
      const selected = opt.dataset.value === value;
      opt.setAttribute('aria-selected', selected ? 'true' : 'false');
    }
  };

  const moveActive = (root, delta) => {
    const menu = root.querySelector('.select__menu');
    if (!menu || menu.hidden) return;
    const options = [...menu.querySelectorAll('.select__option')];
    if (!options.length) return;

    let idx = options.findIndex((opt) => opt.classList.contains('is-active'));
    if (idx < 0) idx = options.findIndex((opt) => opt.getAttribute('aria-selected') === 'true');
    idx = Math.max(0, Math.min(options.length - 1, (idx < 0 ? 0 : idx) + delta));

    for (const opt of options) opt.classList.remove('is-active');
    options[idx].classList.add('is-active');
    options[idx].focus();
  };

  for (const root of selects) {
    const trigger = root.querySelector('.select__trigger');
    const menu = root.querySelector('.select__menu');
    const native = root.querySelector('.select__native');
    if (!trigger || !menu || !native) continue;

    for (const opt of menu.querySelectorAll('.select__option')) {
      opt.setAttribute('aria-selected', 'false');
    }

    trigger.addEventListener('click', () => {
      if (root.classList.contains('is-open')) closeSelect(root);
      else openSelect(root);
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openSelect(root);
      }
    });

    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('.select__option');
      if (!opt) return;
      setValue(root, opt.dataset.value, opt.textContent.trim());
      closeSelect(root);
      trigger.focus();
    });

    menu.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveActive(root, 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveActive(root, -1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const active = menu.querySelector('.select__option.is-active');
        if (!active) return;
        setValue(root, active.dataset.value, active.textContent.trim());
        closeSelect(root);
        trigger.focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeSelect(root);
        trigger.focus();
      } else if (e.key === 'Tab') {
        closeSelect(root);
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-select]')) return;
    closeAll();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
};

initSelects();

/* -------- Demo form --------------------------------------------------- */
const initForm = () => {
  const form = document.getElementById('demo-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;

  const resetCustomSelects = () => {
    for (const root of form.querySelectorAll('[data-select]')) {
      const native = root.querySelector('.select__native');
      const valueEl = root.querySelector('.select__value');
      const menu = root.querySelector('.select__menu');
      const trigger = root.querySelector('.select__trigger');
      if (!native || !valueEl || !menu || !trigger) continue;

      native.selectedIndex = 0;
      const placeholder = native.options[0]?.textContent?.trim() || 'Select';
      valueEl.textContent = placeholder;
      valueEl.classList.add('is-placeholder');
      root.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      menu.hidden = true;

      for (const opt of menu.querySelectorAll('.select__option')) {
        opt.setAttribute('aria-selected', 'false');
        opt.classList.remove('is-active');
      }
    }
  };

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
    resetCustomSelects();
  });
};

initForm();
