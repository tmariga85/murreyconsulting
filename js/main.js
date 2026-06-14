/* ===== Murrey Consulting — interactions (page-safe across the multi-page site) ===== */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---- Year ---- */
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- Sticky / transparent nav ---- */
  const nav = $('#nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Mobile menu ---- */
  const toggle = $('#navToggle');
  const links = $('#navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    $$('#navLinks a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ---- Scroll reveal ---- */
  const reveals = $$('.reveal');
  if (reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  }

  /* ---- Animated stat counters ---- */
  const statHost = $('#heroStats');
  if (statHost) {
    const statObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        $$('.stat-num', e.target).forEach(el => {
          const target = +el.dataset.count, suffix = el.dataset.suffix || '';
          const dur = 1400, start = performance.now();
          const tick = (now) => {
            const p = Math.min((now - start) / dur, 1);
            el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
        statObs.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    statObs.observe(statHost);
  }

  /* ===== Tabs (tools) ===== */
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach(b => b.classList.remove('active'));
      $$('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = $('#tab-' + btn.dataset.tab);
      if (panel) panel.classList.add('active');
    });
  });

  /* ===== Tax & Payroll calculator (2025/2026 SARS tables) ===== */
  const calcBtn = $('#calcBtn');
  if (calcBtn) {
    const fmt = (n) => 'R' + Math.round(n).toLocaleString('en-ZA');
    const pct = (n) => n.toFixed(1) + '%';
    const brackets = [
      [0, 0, 0.18, 0],
      [237100, 42678, 0.26, 237100],
      [370500, 77362, 0.31, 370500],
      [512800, 121475, 0.36, 512800],
      [673000, 179147, 0.39, 673000],
      [857900, 251258, 0.41, 857900],
      [1817000, 644489, 0.45, 1817000],
    ];
    const rebates = { under65: 17235, '65to74': 17235 + 9444, '75plus': 17235 + 9444 + 3145 };
    function incomeTax(annual, age) {
      let base = 0, rate = 0.18, over = 0;
      for (const b of brackets) { if (annual >= b[0]) { base = b[1]; rate = b[2]; over = b[3]; } }
      return Math.max(0, base + (annual - over) * rate - rebates[age]);
    }
    const modeBtns = $$('.seg-btn');
    let calcMode = 'income';
    modeBtns.forEach(b => b.addEventListener('click', () => {
      modeBtns.forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      calcMode = b.dataset.mode;
      $('#mode-income').classList.toggle('hidden', calcMode !== 'income');
      $('#mode-payroll').classList.toggle('hidden', calcMode !== 'payroll');
    }));
    const row = (label, value, hl) =>
      `<div class="res-row${hl ? ' highlight' : ''}"><span class="rl">${label}</span><span class="rv">${value}</span></div>`;
    calcBtn.addEventListener('click', () => {
      const out = $('#calcResults');
      if (calcMode === 'income') {
        const annual = +$('#incomeAmount').value;
        const age = $('#ageGroup').value;
        if (!annual || annual <= 0) { out.innerHTML = '<div class="calc-empty">Please enter a valid annual income.</div>'; return; }
        const tax = incomeTax(annual, age);
        const eff = annual ? (tax / annual) * 100 : 0;
        out.innerHTML =
          row('Annual taxable income', fmt(annual)) +
          row('Tax rebate applied', '−' + fmt(rebates[age])) +
          row('Effective tax rate', pct(eff)) +
          row('Take-home (after tax)', fmt(annual - tax)) +
          row('Annual tax payable', fmt(tax), true);
      } else {
        const gross = +$('#grossSalary').value;
        const age = $('#ageGroupPay').value;
        if (!gross || gross <= 0) { out.innerHTML = '<div class="calc-empty">Please enter a valid monthly salary.</div>'; return; }
        const paye = incomeTax(gross * 12, age) / 12;
        const uifEmployee = Math.min(gross, 17712) * 0.01;
        const deductions = paye + uifEmployee;
        out.innerHTML =
          row('Gross monthly salary', fmt(gross)) +
          row('PAYE (employees’ tax)', '−' + fmt(paye)) +
          row('UIF — employee (1%)', '−' + fmt(uifEmployee)) +
          row('Total deductions', '−' + fmt(deductions)) +
          row('Net pay (take-home)', fmt(gross - deductions), true);
      }
    });
  }

  /* ===== Deadline tracker ===== */
  const dlList = $('#dlList');
  if (dlList) {
    const deadlines = [
      { d: '7', m: 'Mon', cat: 'Payroll', title: 'PAYE / SDL / UIF Monthly Payment', desc: 'Submit EMP201 and pay PAYE, SDL and UIF for the prior month.' },
      { d: '25', m: 'Bi-mo', cat: 'VAT', title: 'VAT Return — Category B', desc: 'Bi-monthly VAT201 submission and payment via eFiling.' },
      { d: '31', m: 'Aug', cat: 'Tax', title: '1st Provisional Tax Payment', desc: 'First period provisional tax — 6 months from start of the assessment year.' },
      { d: '28', m: 'Feb', cat: 'Tax', title: '2nd Provisional Tax Payment', desc: 'Second period provisional tax — due at the end of the assessment year.' },
      { d: '01', m: 'Jul', cat: 'Tax', title: 'Individual Tax Season Opens', desc: 'Filing opens for individual taxpayers (auto-assessment or manual filing).' },
      { d: '21', m: 'Oct', cat: 'Tax', title: 'Individual Tax Returns Close', desc: 'Deadline for non-provisional individual income tax returns via eFiling.' },
      { d: '30', m: 'Days', cat: 'CIPC', title: 'CIPC Annual Return', desc: 'File within 30 business days of the company anniversary. Fee based on turnover.' },
      { d: '31', m: 'May', cat: 'Payroll', title: 'Employer Annual Reconciliation', desc: 'EMP501 reconciliation of PAYE declarations for the tax year.' },
    ];
    const render = (cat) => {
      dlList.innerHTML = deadlines
        .filter(x => cat === 'all' || x.cat === cat)
        .map(x => `
          <div class="dl-item">
            <div class="dl-date"><span class="d">${x.d}</span><span class="m">${x.m}</span></div>
            <div class="dl-body"><h4>${x.title}</h4><p>${x.desc}</p></div>
            <span class="dl-tag">${x.cat}</span>
          </div>`).join('');
    };
    render('all');
    $$('.dl-filter .chip').forEach(c => c.addEventListener('click', () => {
      $$('.dl-filter .chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      render(c.dataset.cat);
    }));
  }

  /* ===== Contact form (mailto fallback) ===== */
  const form = $('#contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = $('#formNote');
      const name = $('#cf-name').value.trim();
      const email = $('#cf-email').value.trim();
      const service = $('#cf-service').value;
      if (!name || !email || !service) {
        note.hidden = false;
        note.style.background = 'rgba(220,38,38,.08)';
        note.style.color = '#dc2626';
        note.textContent = 'Please complete your name, email and service interest.';
        return;
      }
      const subject = encodeURIComponent(`Website enquiry — ${service}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nPhone: ${$('#cf-phone').value}\nService: ${service}\n\n${$('#cf-msg').value}`
      );
      window.location.href = `mailto:t@murreyconsulting.co.za?subject=${subject}&body=${body}`;
      note.hidden = false;
      note.style.background = '';
      note.style.color = '';
      note.textContent = 'Thanks, ' + name + '! Your email client is opening — or reach us directly at t@murreyconsulting.co.za.';
      form.reset();
    });
  }

  /* ===== Shared money/row helpers (for portal calculators) ===== */
  const ZAR = (n) => 'R' + Math.round(n).toLocaleString('en-ZA');
  const resRow = (label, value, hl, seg) =>
    `<div class="res-row${hl ? ' highlight' : ''}${seg ? ' seg' : ''}"><span class="rl">${label}</span><span class="rv">${value}</span></div>`;

  /* ===== Shared SARS rate schedule (Interest Rates Table 3) — used by the
     Official Interest and SARB Prime Rate calculators ===== */
  const INT_SCHED = [
    ['1985-03-01', 0.18], ['1985-12-01', 0.15], ['1987-01-01', 0.13], ['1989-06-01', 0.16],
    ['1990-05-01', 0.19], ['1992-08-01', 0.17], ['1993-01-01', 0.15], ['1994-02-01', 0.14],
    ['1995-09-01', 0.16], ['1998-12-01', 0.19], ['1999-05-01', 0.16], ['1999-09-01', 0.145],
    ['2000-03-01', 0.13], ['2001-10-01', 0.105], ['2002-03-01', 0.115], ['2002-09-01', 0.135],
    ['2003-03-01', 0.145], ['2003-07-01', 0.13], ['2003-09-01', 0.12], ['2003-12-01', 0.095],
    ['2004-03-01', 0.09], ['2004-09-01', 0.085], ['2005-09-01', 0.08], ['2006-09-01', 0.09],
    ['2007-03-01', 0.10], ['2007-09-01', 0.11], ['2008-03-01', 0.12], ['2008-09-01', 0.13],
    ['2009-03-01', 0.115], ['2009-06-01', 0.095], ['2009-07-01', 0.085], ['2009-09-01', 0.08],
    ['2010-10-01', 0.07], ['2011-03-01', 0.065], ['2012-08-01', 0.06], ['2014-02-01', 0.065],
    ['2014-08-01', 0.0675], ['2015-08-01', 0.07], ['2015-12-01', 0.0725], ['2016-02-01', 0.0775],
    ['2016-04-01', 0.08], ['2017-08-01', 0.0775], ['2018-04-01', 0.075], ['2018-12-01', 0.0775],
    ['2019-08-01', 0.075], ['2020-02-01', 0.0725], ['2020-04-01', 0.0625], ['2020-05-01', 0.0525],
    ['2020-06-01', 0.0475], ['2020-08-01', 0.045], ['2021-12-01', 0.0475], ['2022-02-01', 0.05],
    ['2022-04-01', 0.0525], ['2022-06-01', 0.0575], ['2022-08-01', 0.065], ['2022-10-01', 0.0725],
    ['2022-12-01', 0.08], ['2023-02-01', 0.0825], ['2023-04-01', 0.0875], ['2023-06-01', 0.0925],
    ['2024-10-01', 0.09], ['2024-12-01', 0.0875], ['2025-02-01', 0.085], ['2025-06-01', 0.0825],
    ['2025-09-01', 0.08], ['2025-12-01', 0.0775], ['2026-06-01', 0.08],
  ];
  const INT_DAY = 86400000;
  const isoD = (s) => new Date(s + 'T00:00:00');
  const fmtD = (dt) => dt.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  const INT_SEGS = INT_SCHED.map((x, i) => ({
    from: isoD(x[0]), rate: x[1],
    to: i < INT_SCHED.length - 1 ? isoD(INT_SCHED[i + 1][0]) : isoD('2100-01-01'),
  }));
  // daily interest at (segment rate + addRate) across [start,end] → { total, days, rows }
  function computeInterest(P, start, end, addRate) {
    let total = 0, days = 0, rows = '';
    INT_SEGS.forEach((seg) => {
      const a = new Date(Math.max(seg.from.getTime(), start.getTime()));
      const b = new Date(Math.min(seg.to.getTime(), end.getTime()));
      if (b > a) {
        const dd = Math.round((b - a) / INT_DAY);
        const rate = seg.rate + (addRate || 0);
        const interest = P * rate * dd / 365;
        total += interest; days += dd;
        rows += resRow(fmtD(a) + ' – ' + fmtD(new Date(b - INT_DAY)) + ' @ ' + (rate * 100).toFixed(2) + '%', dd + ' days · ' + ZAR(interest), false, true);
      }
    });
    return { total: total, days: days, rows: rows };
  }

  /* ===== Official rate of interest calculator ===== */
  const intBtn = $('#intBtn');
  if (intBtn) {
    intBtn.addEventListener('click', () => {
      const out = $('#intResults');
      const P = +$('#intPrincipal').value;
      const sV = $('#intStart').value, eV = $('#intEnd').value;
      if (!P || P <= 0 || !sV || !eV) { out.innerHTML = '<div class="calc-empty">Enter an amount and both dates.</div>'; return; }
      const start = isoD(sV), end = isoD(eV);
      if (end <= start) { out.innerHTML = '<div class="calc-empty">The end date must be after the start date.</div>'; return; }
      const r = computeInterest(P, start, end, 0);
      out.innerHTML =
        resRow('Principal amount', ZAR(P)) +
        resRow('Period', fmtD(start) + ' → ' + fmtD(end)) +
        resRow('Total days', r.days + ' days') +
        r.rows +
        resRow('Total interest at official rate', ZAR(r.total), true);
    });
  }

  /* ===== SARB prime lending rate calculator (prime = repo + 3.5% = official rate + 2.5%) ===== */
  const primeBtn = $('#primeBtn');
  if (primeBtn) {
    primeBtn.addEventListener('click', () => {
      const out = $('#primeResults');
      const P = +$('#primePrincipal').value;
      const sV = $('#primeStart').value, eV = $('#primeEnd').value;
      const margin = (+$('#primeMargin').value || 0) / 100;
      if (!P || P <= 0 || !sV || !eV) { out.innerHTML = '<div class="calc-empty">Enter an amount and both dates.</div>'; return; }
      const start = isoD(sV), end = isoD(eV);
      if (end <= start) { out.innerHTML = '<div class="calc-empty">The end date must be after the start date.</div>'; return; }
      const r = computeInterest(P, start, end, 0.025 + margin);
      const basis = 'Prime' + (margin ? (margin > 0 ? ' + ' : ' − ') + Math.abs(margin * 100).toFixed(2) + '%' : '');
      out.innerHTML =
        resRow('Principal amount', ZAR(P)) +
        resRow('Rate basis', basis) +
        resRow('Period', fmtD(start) + ' → ' + fmtD(end)) +
        resRow('Total days', r.days + ' days') +
        r.rows +
        resRow('Total interest at ' + basis, ZAR(r.total), true);
    });
  }

  /* ===== Provisional tax calculator (Company / Trust / SBC) ===== */
  const ptBtn = $('#ptBtn');
  if (ptBtn) {
    // SBC sliding scale — years of assessment ending Mar 2025 – Mar 2026
    function sbcTax(t) {
      if (t <= 95750) return 0;
      if (t <= 365000) return (t - 95750) * 0.07;
      if (t <= 550000) return 18848 + (t - 365000) * 0.21;
      return 57698 + (t - 550000) * 0.27;
    }
    ptBtn.addEventListener('click', () => {
      const out = $('#ptResults');
      const type = $('#ptType').value;
      const inc = +$('#ptIncome').value;
      const paid = +$('#ptPaid').value || 0;
      if (!inc || inc <= 0) { out.innerHTML = '<div class="calc-empty">Enter an estimated annual taxable income.</div>'; return; }
      let tax, label;
      if (type === 'company') { tax = inc * 0.27; label = 'Company income tax (27%)'; }
      else if (type === 'trust') { tax = inc * 0.45; label = 'Trust income tax (45%)'; }
      else { tax = sbcTax(inc); label = 'SBC income tax (sliding scale)'; }
      const balance = tax - paid;
      const eff = inc ? (tax / inc) * 100 : 0;
      out.innerHTML =
        resRow('Estimated taxable income', ZAR(inc)) +
        resRow(label, ZAR(tax)) +
        resRow('Effective tax rate', eff.toFixed(1) + '%') +
        resRow('Provisional tax already paid', '−' + ZAR(paid)) +
        resRow(balance >= 0 ? 'Balance still payable' : 'Estimated overpayment / refund', ZAR(Math.abs(balance)), true);
    });
  }

  /* ===== Vehicle finance calculator (instalment with optional deposit & balloon) ===== */
  const vfBtn = $('#vfBtn');
  if (vfBtn) {
    vfBtn.addEventListener('click', () => {
      const out = $('#vfResults');
      const price = +$('#vfPrice').value;
      const deposit = +$('#vfDeposit').value || 0;
      const rate = (+$('#vfRate').value || 0) / 100;
      const months = +$('#vfTerm').value;
      const balloonPct = (+$('#vfBalloon').value || 0) / 100;
      if (!price || price <= 0 || !months || months <= 0) { out.innerHTML = '<div class="calc-empty">Enter a vehicle price and a loan term.</div>'; return; }
      const financed = Math.max(0, price - deposit);
      const balloon = price * balloonPct;
      const i = rate / 12;
      let monthly;
      if (i === 0) { monthly = (financed - balloon) / months; }
      else { const f = Math.pow(1 + i, -months); monthly = (financed - balloon * f) * i / (1 - f); }
      const totalRepay = monthly * months + balloon;
      const totalInterest = totalRepay - financed;
      out.innerHTML =
        resRow('Vehicle price', ZAR(price)) +
        resRow('Less deposit', '−' + ZAR(deposit)) +
        resRow('Amount financed', ZAR(financed)) +
        (balloon > 0 ? resRow('Balloon / residual (' + (balloonPct * 100).toFixed(0) + '%)', ZAR(balloon)) : '') +
        resRow('Total interest', ZAR(totalInterest)) +
        resRow('Total to repay', ZAR(totalRepay)) +
        resRow('Monthly instalment × ' + months, ZAR(monthly), true);
    });
  }

  /* ===== Hero image carousel (crossfade) ===== */
  const bhSlides = $$('.bh-slide');
  if (bhSlides.length > 1) {
    const dotsHost = $('#bhDots');
    let hi = 0, htimer;
    if (dotsHost) {
      bhSlides.forEach((_, i) => {
        const b = document.createElement('button');
        b.setAttribute('aria-label', 'Show slide ' + (i + 1));
        if (i === 0) b.classList.add('active');
        b.addEventListener('click', () => goHero(i, true));
        dotsHost.appendChild(b);
      });
    }
    const dots = dotsHost ? Array.from(dotsHost.children) : [];
    function goHero(n, manual) {
      bhSlides[hi].classList.remove('active');
      if (dots[hi]) dots[hi].classList.remove('active');
      hi = (n + bhSlides.length) % bhSlides.length;
      bhSlides[hi].classList.add('active');
      if (dots[hi]) dots[hi].classList.add('active');
      if (manual) restartHero();
    }
    function restartHero() { clearInterval(htimer); htimer = setInterval(() => goHero(hi + 1), 5500); }
    restartHero();
  }

  /* ===== Testimonials carousel (shows up to 3 at a time, responsive) ===== */
  const tcar = $('#tcar');
  if (tcar) {
    const track = $('.tcar-track', tcar);
    const slides = $$('.tcar-slide', tcar);
    const dotsHost = $('.tcar-dots', tcar);
    const prev = $('.tcar-prev', tcar), next = $('.tcar-next', tcar);
    let ti = 0, ttimer, visible = 3, maxIndex = 0;

    const calcVisible = () => (window.innerWidth <= 640 ? 1 : window.innerWidth <= 960 ? 2 : 3);
    function buildDots() {
      dotsHost.innerHTML = '';
      for (let i = 0; i <= maxIndex; i++) {
        const b = document.createElement('button');
        b.setAttribute('aria-label', 'Go to position ' + (i + 1));
        b.addEventListener('click', () => goT(i, true));
        dotsHost.appendChild(b);
      }
    }
    function apply() {
      track.style.transform = 'translateX(-' + (ti * (100 / visible)) + '%)';
      Array.from(dotsHost.children).forEach((d, i) => d.classList.toggle('active', i === ti));
    }
    function goT(n, manual) {
      if (n > maxIndex) n = 0;
      if (n < 0) n = maxIndex;
      ti = n; apply();
      if (manual) restartT();
    }
    function layout() {
      visible = calcVisible();
      maxIndex = Math.max(0, slides.length - visible);
      if (ti > maxIndex) ti = maxIndex;
      buildDots(); apply();
    }
    function restartT() { clearInterval(ttimer); ttimer = setInterval(() => goT(ti + 1), 6000); }
    if (prev) prev.addEventListener('click', () => goT(ti - 1, true));
    if (next) next.addEventListener('click', () => goT(ti + 1, true));
    let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(layout, 150); });
    // pause auto-advance while hovering a testimonial
    tcar.addEventListener('mouseenter', () => clearInterval(ttimer));
    tcar.addEventListener('mouseleave', () => restartT());
    layout();
    restartT();
  }

  /* ===== Services: particle field that lights up on large-particle collisions ===== */
  const svcCanvas = document.getElementById('svcParticles');
  if (svcCanvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const ctx = svcCanvas.getContext('2d');
    const host = svcCanvas.closest('.svc-section') || svcCanvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const LINK = 130;
    let W = 0, H = 0, small = [], large = [], flashes = [], raf = 0;
    const rnd = (a, b) => a + Math.random() * (b - a);

    function initParticles() {
      const area = W * H;
      const nSmall = Math.max(24, Math.min(90, Math.round(area / 13000)));
      const nLarge = Math.max(5, Math.min(10, Math.round(area / 110000)));
      small = []; large = [];
      for (let i = 0; i < nSmall; i++) small.push({ x: rnd(0, W), y: rnd(0, H), vx: rnd(-0.35, 0.35), vy: rnd(-0.35, 0.35), r: rnd(1, 2.4) });
      for (let i = 0; i < nLarge; i++) large.push({ x: rnd(0, W), y: rnd(0, H), vx: rnd(-0.6, 0.6), vy: rnd(-0.6, 0.6), r: rnd(7, 12), glow: 0 });
    }
    function size() {
      const r = host.getBoundingClientRect();
      W = Math.round(r.width); H = Math.round(r.height);
      svcCanvas.width = W * dpr; svcCanvas.height = H * dpr;
      svcCanvas.style.width = W + 'px'; svcCanvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    }
    function move(p) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < p.r) { p.x = p.r; p.vx *= -1; } else if (p.x > W - p.r) { p.x = W - p.r; p.vx *= -1; }
      if (p.y < p.r) { p.y = p.r; p.vy *= -1; } else if (p.y > H - p.r) { p.y = H - p.r; p.vy *= -1; }
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      const all = large.concat(small);
      // connecting lines
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          const a = all[i], b = all[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.strokeStyle = 'rgba(109,193,46,' + (1 - d / LINK) * 0.16 + ')';
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      // move + collide large particles
      large.forEach(move);
      for (let i = 0; i < large.length; i++) {
        for (let j = i + 1; j < large.length; j++) {
          const a = large[i], b = large[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = a.r + b.r;
          if (d < min && d > 0) {
            const nx = dx / d, ny = dy / d, ov = (min - d) / 2;
            a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
            const av = a.vx * nx + a.vy * ny, bv = b.vx * nx + b.vy * ny;
            a.vx += (bv - av) * nx; a.vy += (bv - av) * ny; b.vx += (av - bv) * nx; b.vy += (av - bv) * ny;
            a.glow = 1; b.glow = 1;
            flashes.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t: 1 });
          }
        }
      }
      small.forEach(move);
      // draw small
      ctx.fillStyle = 'rgba(45,122,45,0.5)';
      small.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); });
      // draw large (with glow when recently collided)
      large.forEach(p => {
        if (p.glow > 0) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          g.addColorStop(0, 'rgba(163,230,53,' + 0.55 * p.glow + ')');
          g.addColorStop(1, 'rgba(163,230,53,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 7); ctx.fill();
          p.glow *= 0.92; if (p.glow < 0.02) p.glow = 0;
        }
        ctx.fillStyle = p.glow > 0 ? 'rgba(190,242,120,0.95)' : 'rgba(109,193,46,0.7)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      });
      // collision flashes
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i], rad = (1 - f.t) * 60 + 12;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad);
        g.addColorStop(0, 'rgba(216,255,150,' + 0.65 * f.t + ')');
        g.addColorStop(0.5, 'rgba(109,193,46,' + 0.35 * f.t + ')');
        g.addColorStop(1, 'rgba(109,193,46,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, rad, 0, 7); ctx.fill();
        f.t -= 0.04; if (f.t <= 0) flashes.splice(i, 1);
      }
      raf = requestAnimationFrame(frame);
    }
    size();
    frame();
    let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(size, 200); });
  }
})();
