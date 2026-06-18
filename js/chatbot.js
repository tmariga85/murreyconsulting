/* ===== Murrey Assistant — rule-based chatbot (no API, works offline) ===== */
(function () {
  'use strict';

  /* ---------- Knowledge base ----------
     Each intent: trigger keywords (phrases score higher) + an answer.
     Answers are general guidance for a SA accounting/tax firm. */
  const KB = [
    {
      id: 'greeting',
      kw: ['hi', 'hello', 'hey', 'good morning', 'good day', 'good afternoon', 'howzit', 'greetings'],
      a: "Hello! 👋 I'm the Murrey Assistant. I can help with questions about tax, VAT, PAYE, CIPC, company registration and our services. What would you like to know?"
    },
    {
      id: 'who',
      kw: ['who are you', 'what are you', 'what can you do', 'help me', 'what do you do'],
      a: "I'm Murrey Consulting's virtual assistant. Ask me about SARS tax returns, VAT, PAYE/payroll, provisional tax, CIPC annual returns, registering a company, or our services and fees. For anything specific to your situation, I can connect you to our team."
    },
    {
      id: 'services',
      kw: ['services', 'what do you offer', 'what you offer', 'help with', 'do you do', 'offer'],
      a: "We offer four core services:\n• Accounting — bookkeeping, financial statements, management reporting\n• Taxation — income tax, VAT, provisional tax, SARS disputes\n• Company Secretarial — registration, annual returns, statutory compliance\n• Business Consulting — transaction advice, systems & internal controls\n\nWhich one can I tell you more about?"
    },
    {
      id: 'income_tax',
      kw: ['income tax', 'tax return', 'tax returns', 'itr12', 'file my tax', 'submit tax', 'sars return', 'efiling', 'file return'],
      a: "Yes — we prepare and submit individual and corporate income tax returns and handle the full SARS process for you, including queries, disputes and penalty negotiations. Want help with a personal (ITR12) or a company (ITR14) return?"
    },
    {
      id: 'vat_register',
      kw: ['register for vat', 'vat registration', 'register vat', 'vat threshold', 'must i register for vat', 'do i need vat'],
      a: "VAT registration is compulsory once your taxable turnover exceeds R2.3 million in any 12-month period (the threshold increased from R1 million on 1 April 2026), and voluntary once you exceed R50,000. We handle the SARS application, set up your reporting category, and keep your VAT201 filings compliant."
    },
    {
      id: 'vat_returns',
      kw: ['vat return', 'vat201', 'vat filing', 'how often vat', 'vat period', 'submit vat'],
      a: "Most businesses file VAT every two months (Category A or B), while larger ones file monthly. Returns and payments are generally due by the 25th (or the last business day for eFiling). We can manage your VAT submissions end-to-end."
    },
    {
      id: 'paye',
      kw: ['paye', 'payroll', 'employees tax', 'emp201', 'staff tax', 'salary tax', 'deduct tax', 'pay employees'],
      a: "PAYE (employees' tax) must be withheld from salaries and paid to SARS by the 7th of each month via an EMP201. We run payroll, calculate PAYE, UIF and SDL, and handle the monthly and bi-annual (EMP501) submissions. You can also estimate net pay with our Salary Calculator under Tools."
    },
    {
      id: 'uif',
      kw: ['uif', 'unemployment insurance', 'ui-19', 'uif contribution'],
      a: "UIF is 2% of an employee's remuneration in total — 1% withheld from the employee and 1% paid by the employer — capped at a monthly remuneration ceiling. We handle UIF registration and the monthly declarations as part of payroll."
    },
    {
      id: 'provisional',
      kw: ['provisional tax', 'irp6', 'provisional', 'provisional taxpayer', 'two payments'],
      a: "Provisional taxpayers make two IRP6 payments a year — the first by end-August and the second by end-February — with an optional third 'top-up'. Under-estimating can attract penalties of up to 20% plus interest, so we help you estimate accurately and file on time."
    },
    {
      id: 'penalties',
      kw: ['penalty', 'penalties', 'late', 'fine', 'interest', 'late submission'],
      a: "SARS penalties apply for late returns, late payments and under-estimated provisional tax (up to 20% plus interest). The good news is many penalties can be reduced or remitted with the right grounds — we handle penalty disputes and remission requests on your behalf."
    },
    {
      id: 'cipc',
      kw: ['cipc annual return', 'cipc return', 'annual return', 'cipc', 'company return', 'cipc compliance'],
      a: "Every company and close corporation must file a CIPC annual return within 30 business days of its incorporation anniversary, with the fee based on annual turnover. Missing it can lead to deregistration. We track the date and file it for you."
    },
    {
      id: 'register_company',
      kw: ['register a company', 'register company', 'start a company', 'pty', 'open a company', 'incorporate', 'company registration', 'register my business', 'new company'],
      a: "Yes — we register companies (Pty) Ltd with CIPC, including name reservation, MOI and director setup, and we get you set up with SARS and a tax number. Most registrations are completed within a few business days. Want us to start the process?"
    },
    {
      id: 'tax_number',
      kw: ['tax number', 'register for tax', 'tax reference', 'get a tax number', 'sars registration', 'income tax number'],
      a: "We can register you or your company for an income tax number with SARS, and for VAT, PAYE and other tax types as needed. Once registered, we set you up on eFiling so everything is managed in one place."
    },
    {
      id: 'tax_clearance',
      kw: ['tax clearance', 'tax compliance status', 'tcs', 'clearance certificate', 'good standing'],
      a: "We arrange your Tax Compliance Status (TCS) / tax clearance — often needed for tenders, contracts or foreign investment — and help you clear any outstanding returns or balances first so the application goes through cleanly."
    },
    {
      id: 'bookkeeping',
      kw: ['bookkeeping', 'bookkeeper', 'accounting', 'financial statements', 'books', 'record keeping', 'management accounts', 'afs'],
      a: "We handle bookkeeping, monthly management accounts and annual financial statements compliant with South African standards — so your records are always accurate, current and ready for SARS, banks or investors."
    },
    {
      id: 'consulting',
      kw: ['consulting', 'advisory', 'internal controls', 'systems', 'transaction', 'business advice', 'restructure'],
      a: "Our business consulting helps with complex transactions (negotiation and structuring), designing financial and operational systems, and building internal controls to reduce risk and fraud. Tell me a bit about your situation and I'll point you the right way."
    },
    {
      id: 'deadlines',
      kw: ['deadline', 'deadlines', 'when is', 'due date', 'tax season', 'when do i', 'key dates'],
      a: "Key SA dates: PAYE by the 7th monthly, VAT around the 25th, provisional tax end-Aug and end-Feb, individual tax season opens in July (closing ~late October), and CIPC annual returns within 30 business days of your company anniversary. See the live Deadline Tracker under Tools."
    },
    {
      id: 'pricing',
      kw: ['price', 'pricing', 'cost', 'fees', 'how much', 'quote', 'rates', 'charge', 'afford', 'monthly fee'],
      a: "Fees depend on the size of your business and the services you need, so we tailor a quote rather than a one-size-fits-all price. Tell me roughly what you need (e.g. monthly accounting + tax for a small Pty) or request a quote and we'll come back with a clear figure."
    },
    {
      id: 'small_business',
      kw: ['small business', 'startup', 'sole proprietor', 'freelancer', 'just started', 'new business', 'side business'],
      a: "We work with a lot of small businesses and startups. A typical setup is monthly bookkeeping, payroll if you have staff, and annual tax + CIPC returns — all bundled so you stay compliant without the admin. Want a starter quote?"
    },
    {
      id: 'get_started',
      kw: ['get started', 'sign up', 'become a client', 'how do i start', 'onboard', 'work with you', 'switch accountant', 'move to you'],
      a: "Getting started is easy: tell us your business type and what you need, we send a quick proposal, and once you're happy we handle the SARS/CIPC handover from your current provider. Shall I take your details, or would you prefer to use the contact form?"
    },
    {
      id: 'contact',
      kw: ['contact', 'phone', 'call', 'email', 'address', 'location', 'where are you', 'office', 'speak to', 'human', 'hours', 'reach you'],
      a: "You can reach us at:\n📧 t@murreyconsulting.co.za\n📞 +27 81 357 4817\n📍 27A 1st Street, Abbotsford, Johannesburg, 2192, Gauteng\n\nOr drop your details in the contact form below and we'll come back to you."
    },
    {
      id: 'thanks',
      kw: ['thank', 'thanks', 'cheers', 'appreciate', 'awesome', 'great'],
      a: "You're welcome! 😊 Anything else I can help with — tax, VAT, PAYE, CIPC or our services?"
    },
    {
      id: 'bye',
      kw: ['bye', 'goodbye', 'see you', 'that is all', 'no thanks', 'nothing else'],
      a: "Thanks for chatting! When you're ready, reach us at t@murreyconsulting.co.za or +27 81 357 4817. Have a great day. 👋"
    }
  ];

  const STARTERS = [
    'Do you help with SARS tax returns?',
    'How do I register for VAT?',
    'What are the CIPC annual return requirements?',
    'How much do your services cost?',
    'How do I register a company?'
  ];

  const FALLBACK = "Good question — that one's best answered for your specific situation. You can reach our team at t@murreyconsulting.co.za or +27 81 357 4817, or use the contact form below. In the meantime, try asking about tax returns, VAT, PAYE, provisional tax, CIPC or company registration.";

  function norm(s) {
    return ' ' + s.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  }

  function answer(query) {
    const q = norm(query);
    let best = null, bestScore = 0;
    for (const intent of KB) {
      let score = 0;
      for (const k of intent.kw) {
        const phrase = ' ' + k + ' ';
        if (q.includes(phrase)) score += k.includes(' ') ? 4 : 1.5;
        else if (q.includes(k)) score += k.includes(' ') ? 2.5 : 0.6;
      }
      if (score > bestScore) { bestScore = score; best = intent; }
    }
    return bestScore >= 1 ? best.a : FALLBACK;
  }

  /* ---------- Build the widget ---------- */
  const onSubpage = /(privacy|terms)\.html$/i.test(location.pathname);
  const contactHref = onSubpage ? 'index.html#contact' : '#contact';

  const fab = document.createElement('button');
  fab.className = 'cb-fab';
  fab.id = 'cbFab';
  fab.setAttribute('aria-label', 'Open Murrey Assistant');
  fab.innerHTML =
    '<svg viewBox="0 0 24 24" class="cb-ic-open"><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><circle cx="8.5" cy="11" r="1.1"/><circle cx="12" cy="11" r="1.1"/><circle cx="15.5" cy="11" r="1.1"/></svg>' +
    '<span class="cb-fab-label">Ask us</span>';

  const panel = document.createElement('div');
  panel.className = 'cb-panel';
  panel.id = 'cbPanel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Murrey Assistant');
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML =
    '<div class="cb-head">' +
      '<div class="cb-head-id">' +
        '<span class="cb-avatar"><img src="assets/logo.png" alt="" /></span>' +
        '<div><strong>Murrey Assistant</strong><span class="cb-status"><i></i> Online · replies instantly</span></div>' +
      '</div>' +
      '<button class="cb-close" id="cbClose" aria-label="Close chat">&times;</button>' +
    '</div>' +
    '<div class="cb-body" id="cbBody"></div>' +
    '<div class="cb-quick" id="cbQuick"></div>' +
    '<form class="cb-input" id="cbForm">' +
      '<input id="cbText" type="text" placeholder="Ask about tax, VAT, CIPC…" autocomplete="off" />' +
      '<button type="submit" aria-label="Send message"><svg viewBox="0 0 24 24"><path d="M3 11l18-8-8 18-2-7-8-3z"/></svg></button>' +
    '</form>' +
    '<div class="cb-foot">Guidance only — not professional advice. <a href="' + contactHref + '">Talk to a human →</a></div>';

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  const body = panel.querySelector('#cbBody');
  const quick = panel.querySelector('#cbQuick');
  const form = panel.querySelector('#cbForm');
  const input = panel.querySelector('#cbText');

  let greeted = false;

  function addMsg(text, who) {
    const m = document.createElement('div');
    m.className = 'cb-msg ' + who;
    m.innerHTML = text.replace(/\n/g, '<br>');
    body.appendChild(m);
    body.scrollTop = body.scrollHeight;
    return m;
  }

  function renderStarters() {
    quick.innerHTML = '';
    STARTERS.forEach(s => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = s;
      b.addEventListener('click', () => send(s));
      quick.appendChild(b);
    });
  }

  function send(text) {
    addMsg(text, 'user');
    quick.innerHTML = '';
    const typing = addMsg('<span class="cb-dots"><i></i><i></i><i></i></span>', 'bot typing');
    setTimeout(() => {
      typing.classList.remove('typing');
      typing.innerHTML = answer(text).replace(/\n/g, '<br>');
      body.scrollTop = body.scrollHeight;
      renderStarters();
    }, 600 + Math.random() * 400);
  }

  function openPanel() {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    fab.classList.add('hidden');
    if (!greeted) {
      greeted = true;
      addMsg("Hi there! 👋 I'm the Murrey Assistant. Ask me anything about tax, VAT, PAYE, CIPC or our services — or pick a question below.", 'bot');
      renderStarters();
    }
    setTimeout(() => input.focus(), 250);
  }
  function closePanel() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    fab.classList.remove('hidden');
  }

  fab.addEventListener('click', openPanel);
  panel.querySelector('#cbClose').addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    send(v);
    input.value = '';
  });
})();
