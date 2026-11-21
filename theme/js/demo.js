/*
 * Demo interactions for the static theme pages.
 * Each block maps to React state in the real app — comments say where.
 */
(function () {
  const bn = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

  /* Feed: love toggle per story  →  useState<boolean> in <StoryCard> */
  document.querySelectorAll('.tb-love[data-count]').forEach((btn) => {
    const base = Number(btn.dataset.count);
    const count = btn.querySelector('.tb-love__count');
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      count.textContent = bn(base + (on ? 1 : 0));
    });
  });

  /* Story: tap to love, up to MAX  →  useState<number> in <StoryPage> */
  const loveBtns = document.querySelectorAll('[data-love]');
  if (loveBtns.length) {
    const MAX = 10, BASE = 24;
    let mine = 0;
    const plus = document.getElementById('tb-love-plus');
    const hint = document.getElementById('tb-love-hint');
    const big = document.querySelector('.tb-love-big');
    const render = () => {
      document.querySelectorAll('[data-love-total]').forEach((el) => (el.textContent = bn(BASE + mine)));
      loveBtns.forEach((b) => b.querySelector('svg').setAttribute('fill', mine ? '#C0501D' : 'none'));
      if (big) big.style.background = mine ? 'var(--tb-accent-soft)' : '';
      if (plus) { plus.hidden = !mine; plus.textContent = '+' + bn(mine); }
      if (hint) hint.textContent = mine >= MAX ? 'অনেক ভালোবাসা দিয়ে ফেলেছ!' : 'যতবার খুশি চাপো';
    };
    loveBtns.forEach((b) => b.addEventListener('click', () => { mine = Math.min(MAX, mine + 1); render(); }));
  }

  /* School: filter suggestions  →  useState<string> in <SchoolSheet> */
  const schoolInput = document.getElementById('tb-school');
  if (schoolInput) {
    const all = ['রূপনগর হাই স্কুল', 'রূপনগর সরকারি কলেজ', 'শান্তিনগর গার্লস স্কুল', 'রূপনগর সরকারি বালিকা বিদ্যালয়', 'মতিঝিল মডেল স্কুল অ্যান্ড কলেজ'];
    const list = document.getElementById('tb-school-list');
    const hint = document.getElementById('tb-school-hint');
    const icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B6660" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10l9-6 9 6"/><path d="M5 10v9h14v-9"/></svg>';
    const render = () => {
      const q = schoolInput.value.trim();
      const found = q ? all.filter((n) => n.includes(q)) : all.slice(0, 3);
      hint.textContent = q
        ? (found.length ? 'এটা কি তোমার স্কুল বা কলেজ?' : 'নতুন নাম হিসেবে যোগ হয়ে যাবে')
        : 'বন্ধুরা এই স্কুল-কলেজগুলো লিখেছে';
      list.innerHTML = '';
      found.forEach((name) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tb-suggest';
        b.setAttribute('role', 'option');
        b.setAttribute('aria-selected', String(name === q));
        b.innerHTML = icon;
        b.append(name);
        b.addEventListener('click', () => { schoolInput.value = name; render(); });
        list.append(b);
      });
    };
    schoolInput.addEventListener('input', render);
    render();
  }

  /* Write: word count + rotating prompt  →  useState in <WritePage> */
  const body = document.getElementById('tb-body');
  if (body) {
    const prompts = [
      'স্কুলের প্রথম দিনটা কেমন ছিল? কার হাত ধরে গেট পেরিয়েছিলে?',
      'টিফিনের ঘণ্টা বাজলেই কী কী করতে? কার বক্সে হানা দিতে?',
      'কার সাথে সবচেয়ে বেশি সময় কাটত?',
      'সবচেয়ে বেশি ঝগড়া হতো কার সাথে? এখনো কি কথা হয়?',
      'কোন স্যার বা ম্যাডামের কথা আজও মনে পড়ে?',
      'কোনো ক্লাসমেট বা স্কুলের এমন কোনো কথা, যা ভোলা যায় না?',
      'স্কুলের শেষ দিনে কাকে কী বলা হয়নি?'
    ];
    let idx = 0;
    const box = document.getElementById('tb-prompt');
    const text = document.getElementById('tb-prompt-text');
    const words = document.getElementById('tb-words');
    const render = () => {
      const t = body.value.trim();
      const n = t ? t.split(/\s+/).length : 0;
      words.textContent = bn(n);
      box.hidden = n >= 8;
      text.textContent = prompts[idx % prompts.length];
    };
    body.addEventListener('input', render);
    document.getElementById('tb-next-prompt').addEventListener('click', () => { idx++; render(); });
    document.getElementById('tb-use-prompt').addEventListener('click', () => {
      body.value = prompts[idx % prompts.length] + '\n\n' + body.value;
      body.focus();
      render();
    });
    render();
  }
})();
