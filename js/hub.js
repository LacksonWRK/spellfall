/* Spellfall Homeschool hub: kid picker, Today, Flashcards, Math, Parent mode. */
(function () {
  'use strict';
  const { store, ai, speech, stamp, pin, uid, clone, today, VERSION, FEEDBACK_EMAIL, ROCKET_TANK } = window.Hub;
  const feedbackHref = () => `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(`Spellfall feedback (v${VERSION})`)}&body=${encodeURIComponent(`Version ${VERSION}\nDevice: \n\nWhat happened, or what would help:\n`)}`;
  const C = window.HubContent;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const norm = s => String(s || '').normalize('NFC').replace(/[‘’ʼ`´]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim();
  const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const app = $('#app');

  const AVATARS = ['🚀', '🦖', '🐙', '🦈', '🐉', '🦊', '🐯', '🐼', '🦉', '🐸', '🤖', '👾', '⚽', '🏀', '🦄', '🐢', '🐬', '🌋'];
  const COLORS = { yellow: '#F6D365', blue: '#93CBEA', pink: '#F4A3A8', green: '#A3E4A8', orange: '#F7B267', lilac: '#C9B6F2' };
  const GRADES = ['K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  const gradeLabel = g => g === 'K' ? 'Kindergarten' : `${g} grade`;
  const CURRICULA = [['', 'Not set'], ['abeka', 'Abeka'], ['bju', 'BJU Press'], ['tgtb', 'The Good and the Beautiful'], ['sonlight', 'Sonlight'], ['other', 'Something else, or my own']];
  const NOT_AFFILIATED = 'Spellfall Homeschool is an independent project. It is not affiliated with or endorsed by Abeka, BJU Press, The Good and the Beautiful, Sonlight, or any other curriculum publisher.';
  const young = k => ['K', '1st', '2nd'].includes(k.grade);
  const SUBJECTS = {
    spelling: { label: 'Spelling', icon: '✏️', color: COLORS.yellow },
    flashcards: { label: 'Flashcards', icon: '🃏', color: COLORS.blue },
    math: { label: 'Math', icon: '🧮', color: COLORS.green },
    typing: { label: 'Typing', icon: '⌨️', color: COLORS.lilac },
    phonics: { label: 'Phonics', icon: '🔤', color: COLORS.pink }
  };

  store.load();
  const S = { parentOK: false, parentAt: 0, ptab: 'kids', pkid: null, scan: null, review: null, study: null, drill: null, mathSkill: {}, mathEx: {} };

  /* ---------- small UI helpers ---------- */
  let toastT = 0;
  function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3400); }
  function modal(html, onMount) { $('#modal-box').innerHTML = html; $('#modal').hidden = false; if (onMount) onMount($('#modal-box')); }
  function closeModal() { $('#modal').hidden = true; $('#modal-box').innerHTML = ''; }
  function confirmBox(msg, okLabel, onOk) {
    modal(`<p style="margin:0;font-size:19px">${esc(msg)}</p><div class="row"><button class="btn danger" id="m-ok">${esc(okLabel)}</button><button class="btn ghost" id="m-cancel">Cancel</button></div>`, box => {
      $('#m-ok', box).onclick = () => { closeModal(); onOk(); }; $('#m-cancel', box).onclick = closeModal; $('#m-cancel', box).focus();
    });
  }
  function confetti() { if (RM) return; const cf = $('#confetti'), cols = Object.values(COLORS); cf.innerHTML = Array.from({ length: 60 }, (_, i) => `<i style="left:${(Math.random() * 100).toFixed(1)}%;background:${cols[i % cols.length]};animation-delay:${(Math.random() * .8).toFixed(2)}s"></i>`).join(''); setTimeout(() => { cf.innerHTML = ''; }, 3600); }
  const starRow = n => [0, 1, 2].map(k => `<span class="${k < n ? 'on' : ''}">★</span>`).join('');
  const go = h => { if (location.hash === h) render(); else location.hash = h; };

  /* ---------- Today ---------- */
  function doneToday(k) {
    const t = today(), set = new Set();
    for (const e of k.log || []) if (e.date === t && e.subject) set.add(e.subject);
    const manual = ((store.family.plan.done || {})[k.id] || {})[t] || [];
    manual.forEach(id => set.add('item:' + id));
    return set;
  }
  function planFor(k) {
    const done = doneToday(k);
    return store.family.plan.template.map(it => ({ ...it, done: it.subject ? done.has(it.subject) : done.has('item:' + it.id) }));
  }
  function toggleManual(k, id) {
    const p = store.family.plan, t = today();
    p.done = p.done || {}; const byKid = p.done[k.id] = p.done[k.id] || {};
    for (const d of Object.keys(byKid)) if (d < t.slice(0, 8) + '01' && d !== t) delete byKid[d]; // keep it small
    const arr = byKid[t] = byKid[t] || [];
    const i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); else { arr.push(id); store.bumpMeter(2); }
    store.save();
  }
  function subjectHref(k, subj) {
    if (subj === 'spelling') return `apps/spellfall/index.html?kid=${encodeURIComponent(k.id)}&mode=spell`;
    if (subj === 'typing') return `apps/spellfall/index.html?kid=${encodeURIComponent(k.id)}&mode=type`;
    if (subj === 'flashcards') return `#/kid/${k.id}/flashcards`;
    if (subj === 'math') return `#/kid/${k.id}/math`;
    if (subj === 'phonics') return `#/kid/${k.id}/phonics`;
    return null;
  }

  /* ---------- router ---------- */
  function route() { return (location.hash || '#/').replace(/^#\/?/, '').split('/').filter(Boolean); }
  function render() {
    const r = route();
    if (r[0] === 'help') { if (S.lastRoute && S.lastRoute[0] !== 'help') S.helpFrom = '#/' + S.lastRoute.join('/'); S.lastRoute = r; return renderHelp(r[1]); }
    S.lastRoute = r;
    if (S.parentOK && r[0] !== 'parent') S.parentOK = false; // leaving parent mode locks it (help is the one exception)
    if (!store.kids().length && r[0] !== 'parent' && r[0] !== 'setup') return renderSetup();
    if (r[0] === 'setup') return renderSetup();
    if (r[0] === 'welcome') return S.welcome ? renderWelcome() : go('#/');
    if (r[0] === 'parent') return !S.parentOK ? (go('#/'), null) : r[1] === 'print' ? renderPrint(r[2]) : renderParent();
    if (r[0] === 'kid') {
      const k = store.kid(r[1]); if (!k) return go('#/');
      if (r[2] === 'flashcards') return r[3] ? renderStudy(k, r[3]) : renderDecks(k);
      if (r[2] === 'math') return renderMath(k);
      if (r[2] === 'rocket') return window.HubRocket.render({ app, store, esc, confetti, TANK: ROCKET_TANK, spellHref: kk => subjectHref(kk, 'spelling') }, k);
      if (r[2] === 'phonics') return window.HubPhonics.render({ app, store, speech, esc, starRow, confetti }, k, r[3]);
      return renderKid(k);
    }
    renderHome();
  }
  window.addEventListener('hashchange', () => { stopDrill(); if (route()[2] !== 'phonics') window.HubPhonics.stop(); window.HubRocket.stop(); render(); window.scrollTo(0, 0); });

  /* ---------- help: How do I list + one guide per section (content in js/help.js) ---------- */
  function renderHelp(id) {
    const H = window.HubHelp, t = id && H.TOPICS.find(x => x.id === id);
    const back = `<a class="btn ghost small back" href="${t ? '#/help' : esc(S.helpFrom || '#/')}">← ${t ? 'All help' : 'Back'}</a>`;
    if (t) {
      const i = H.TOPICS.indexOf(t), prev = H.TOPICS[i - 1], next = H.TOPICS[i + 1];
      app.innerHTML = `<div class="wrap narrow">${back}
        <div class="me"><span class="av sm" style="--pc:var(--yellow)" aria-hidden="true">${t.icon}</span><div><h1 class="h1">${esc(t.title)}</h1><small>${esc(t.sub)}</small></div></div>
        <article class="card guide">${t.body}</article>
        <nav class="spread" aria-label="More guides">${prev ? `<a class="btn ghost small" href="#/help/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="btn ghost small" href="#/help/${next.id}">${esc(next.title)} →</a>` : ''}</nav>
      </div>`;
      return;
    }
    app.innerHTML = `<div class="wrap">${back}
      <h1 class="h1">Help</h1>
      <div class="cols">
        <section class="card"><h2 class="h3">How do I…</h2>
          <ul class="howto">${H.HOWTO.map(([q, tid]) => `<li><a href="#/help/${tid}">${esc(q)}</a></li>`).join('')}</ul>
        </section>
        <section class="col" style="gap:14px"><h2 class="h3">Guides</h2>
          <div class="guides">${H.TOPICS.map(x => `<a class="gcard" href="#/help/${x.id}"><span class="ic" aria-hidden="true">${x.icon}</span><span><b>${esc(x.title)}</b><small>${esc(x.sub)}</small></span></a>`).join('')}</div>
          <section class="card"><h2 class="h3">Something not working?</h2><p class="muted">Tell us what happened or what would help, at ${FEEDBACK_EMAIL}. <a href="${feedbackHref()}">Send feedback</a></p></section>
          <p class="fine"><a href="privacy.html">Privacy</a> · Spellfall Homeschool v${VERSION} · not affiliated with any curriculum publisher.</p>
        </section>
      </div>
    </div>`;
  }

  /* ---------- printable weekly page: one sheet per child (words on handwriting lines + Mon-Fri checklist) ---------- */
  function renderPrint(which) {
    const kids = which === 'all' ? store.kids() : [store.kid(which)].filter(Boolean);
    const week = new Date(window.Hub.mondayOf() + 'T12:00'), plan = store.family.plan.template;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    app.innerHTML = `<div class="wrap narrow no-print">
        <div class="spread"><a class="btn ghost small" href="#/parent">← Parents</a><button class="btn primary" data-act="print-now">🖨 Print</button></div>
        <p class="muted">One page per child. On an iPad, tap Print, then pick your printer or <b>Save to Files</b> as a PDF.</p>
      </div>
      ${kids.map(k => { const L = k.spellfall.list, words = L && L.words ? L.words : [];
        return `<section class="pp">
          <header class="pp-head"><div><b>${esc(k.name)}</b><span>${esc(gradeLabel(k.grade))}</span></div><div>Week of ${week.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div></header>
          <h2>Spelling${L ? ` · ${esc(L.title)}` : ''}</h2>
          ${words.length ? `<div class="pp-words">${words.map(w => `<div class="pp-row"><span class="pp-line pp-word">${esc(w)}</span><span class="pp-line"></span><span class="pp-line"></span></div>`).join('')}</div>`
            : '<p class="pp-empty">No spelling list this week. Add one in Parents → Spelling lists.</p>'}
          <h2>This week’s checklist</h2>
          <table class="pp-check"><thead><tr><th></th>${days.map(d => `<th>${d}</th>`).join('')}</tr></thead>
            <tbody>${plan.map(it => `<tr><td>${esc(it.label)}</td>${days.map(() => '<td><span class="pp-box"></span></td>').join('')}</tr>`).join('')}</tbody></table>
          <footer class="pp-foot">Spellfall Homeschool</footer>
        </section>`; }).join('')}`;
  }

  /* ---------- Add to Home Screen (iPad / iPhone) ----------
     Safari can clear a site's saved data after a week without a visit; Home Screen apps keep it.
     The Home Screen app gets its own storage, so families with progress move it over with a backup. */
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isInstalled = () => navigator.standalone === true || !!(window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  function installHTML() {
    if (!isIOS() || isInstalled() || (store.family.settings.installSnoozeUntil || 0) > Date.now()) return '';
    const has = store.kids().length > 0;
    return `<section class="install" aria-labelledby="inst-h">
      <img src="icons/apple-touch-icon.png" alt="" width="64" height="64">
      <div class="col" style="gap:6px;min-width:0;flex:1">
        <h2 class="h3" id="inst-h">Put Spellfall on your Home Screen</h2>
        <p class="muted">Safari can erase saved progress if a website isn't opened for a week. The Home Screen app keeps it.</p>
        <ol class="steps"><li>Tap the <b>Share</b> button <span aria-hidden="true">(square with an arrow, on iPhone it may be under <b>⋯</b>)</span></li><li>Choose <b>Add to Home Screen</b></li><li>Open Spellfall from the new icon</li></ol>
        ${has ? `<p class="note">The Home Screen app starts empty. First download a backup (Parents → Backup), then restore it inside the app.</p>` : ''}
      </div>
      <button class="btn ghost small" data-act="install-later">Not now</button>
    </section>`;
  }

  /* ---------- first run ---------- */
  let setupRows = null;
  function renderSetup() {
    if (!setupRows) setupRows = [{ name: '', grade: '1st', avatar: '🚀', color: 'yellow' }, { name: '', grade: '4th', avatar: '🦖', color: 'blue' }];
    app.innerHTML = `<div class="wrap narrow">
      <div class="logo">Spellfall<small>Homeschool</small></div>
      ${installHTML()}
      ${stepsHTML(1)}
      <h1 class="h1 center">Who's learning?</h1>
      <p class="muted center">Add each child. You can change these later in Parent settings. New here? <a href="#/help/start">See how Spellfall works</a>.</p>
      <div class="col" id="srows">${setupRows.map((r, i) => `
        <div class="card" style="flex-direction:row;flex-wrap:wrap;align-items:flex-end;gap:12px">
          <button class="av sm" data-act="s-av" data-i="${i}" style="--pc:${COLORS[r.color]}" aria-label="Change picture">${r.avatar}</button>
          <div class="field" style="flex:1;min-width:160px"><label class="lbl" for="sn${i}">Name</label><input id="sn${i}" class="inp" data-si="${i}" value="${esc(r.name)}" maxlength="20" placeholder="First name" autocomplete="off"></div>
          <div class="field"><label class="lbl" for="sg${i}">Grade</label><select id="sg${i}" class="inp" data-sg="${i}">${GRADES.map(g => `<option ${g === r.grade ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
          ${setupRows.length > 1 ? `<button class="x" data-act="s-del" data-i="${i}" aria-label="Remove">×</button>` : ''}
        </div>`).join('')}</div>
      <div class="row"><button class="btn ghost small" data-act="s-add">+ Add another child</button></div>
      <div class="row"><button class="btn primary big" data-act="s-go">Next</button></div>
      <p class="fine">Everything is saved on this device only. Make a backup now and then from Parent settings. <a href="privacy.html">Privacy</a></p>
    </div>`;
  }

  /* ---------- welcome: steps 2 and 3 after the kids are added ---------- */
  function stepsHTML(n) {
    return `<ol class="stepper" aria-label="Setup, step ${n} of 3">${['Kids', 'Spelling words', 'Grown-up tools'].map((l, i) => `<li class="${i + 1 === n ? 'on' : i + 1 < n ? 'done' : ''}" ${i + 1 === n ? 'aria-current="step"' : ''}><span>${i + 1 < n ? '✓' : i + 1}</span>${l}</li>`).join('')}</ol>`;
  }
  function renderWelcome() {
    const w = S.welcome, kids = w.kidIds.map(id => store.kid(id)).filter(Boolean);
    if (w.step === 2) {
      app.innerHTML = `<div class="wrap narrow">
        <div class="logo">Spellfall<small>Homeschool</small></div>
        ${stepsHTML(2)}
        <h1 class="h1 center">This week’s spelling words</h1>
        <p class="muted center">Start with a built-in list for each child’s grade. When the school list comes home, type it or scan it in Parents → Spelling lists.</p>
        ${kids.map(k => `<div class="card" style="flex-direction:row;flex-wrap:wrap;align-items:flex-end;gap:12px">
          <span class="av sm" style="--pc:${COLORS[k.color]}">${esc(k.avatar)}</span>
          <div class="field" style="flex:1;min-width:200px"><label class="lbl" for="wl-${k.id}">${esc(k.name)} · ${esc(gradeLabel(k.grade))}</label>
            <select id="wl-${k.id}" class="inp" data-wlist="${k.id}">${C.listsFor(k.grade).map((l, i) => `<option value="${i}">${esc(l.title)} · ${esc(l.words.slice(0, 4).join(', '))}…</option>`).join('')}<option value="">No list yet, I’ll add our own</option></select></div>
        </div>`).join('')}
        <div class="card"><div class="field"><label class="lbl" for="w-curric">Our curriculum (optional)</label><select id="w-curric" class="inp" style="max-width:340px">${CURRICULA.map(([v, l]) => `<option value="${v}" ${v === (store.family.settings.curriculum || '') ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <small class="fine">Spellfall works alongside any curriculum. ${NOT_AFFILIATED}</small></div></div>
        <div class="row" style="justify-content:space-between"><button class="btn ghost" data-act="w-skip">Skip setup</button><button class="btn primary big" data-act="w-lists">Next</button></div>
      </div>`;
      return;
    }
    app.innerHTML = `<div class="wrap narrow">
      <div class="logo">Spellfall<small>Homeschool</small></div>
      ${stepsHTML(3)}
      <h1 class="h1 center">Grown-up tools</h1>
      <section class="card"><h2 class="h3">1. The Parents button</h2>
        <p class="muted">Lists, flashcards and settings live behind the <b>Parents</b> button. Press and hold it for about a second, until the ring fills. A quick tap won’t open it, which keeps little fingers out. Try it here:</p>
        <div class="row"><button class="hold" data-hold="practice"><span class="ring"></span>Parents · press and hold</button><span class="ok" id="w-held" ${w.held ? '' : 'hidden'}>That’s it!</span></div>
      </section>
      <section class="card"><h2 class="h3">2. A PIN (optional)</h2>
        <p class="muted">Adds a 4-digit PIN to the Parents button. It’s a speed bump for kids, not a lock, and there’s no reset, so pick one you’ll remember.</p>
        ${pin.isSet() ? '<p class="ok">PIN set.</p>' : `<div class="row"><input id="w-pin" class="inp" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="off" aria-label="4-digit PIN" style="max-width:160px"><button class="btn small" data-act="w-pin">Set PIN</button></div>`}
      </section>
      <section class="card"><h2 class="h3">3. Good to know</h2>
        <ul class="welcome-list">
          <li>Everything saves on this device only. Make a backup now and then: Parents → Backup.</li>
          <li>Photo scanning (turning a school list or quiz into words or flashcards) is optional and needs your own Anthropic key. <a href="#/help/scanning">How to set it up</a>.</li>
          <li>Stuck? Tap <b>Help</b> at the bottom of the kids screen, or in Parents.</li>
        </ul>
      </section>
      <div class="row" style="justify-content:center"><button class="btn primary big" data-act="w-done">Start learning</button></div>
    </div>`;
  }

  /* ---------- home ---------- */
  function meterHTML() {
    const m = store.meter(), pct = Math.min(100, Math.round(m.count / m.goal * 100));
    return `<div class="meter"><div class="spread"><span><b>Family goal</b> <span class="fine" style="display:inline">· this week, together</span></span><span class="fine">${m.count} / ${m.goal} ${m.count >= m.goal ? '🏆' : '⭐'}</span></div><div class="bar"><i style="width:${pct}%"></i></div>${m.count >= m.goal ? '<p class="fine">You did it as a team! Ask a grown-up about the family reward.</p>' : ''}</div>`;
  }
  /* backup reminder for grown-ups: 14+ days since the last backup (or since setup if there's never been one) */
  function backupNagHTML() {
    const f = store.family, last = f.lastExport, since = Date.now() - (last || f.createdAt || 0);
    if (!store.kids().length || since < 14 * 864e5 || (f.settings.backupSnoozeUntil || 0) > Date.now()) return '';
    const days = Math.floor(since / 864e5);
    return `<section class="nag" aria-labelledby="nag-h">
      <div class="col" style="gap:4px;min-width:0;flex:1">
        <h2 class="h3" id="nag-h">Grown-ups: time for a backup</h2>
        <p class="muted">${last ? `Your last backup was ${days} days ago.` : 'You haven’t made a backup yet.'} Progress lives only on this device. A backup file keeps it safe if the device is lost or its data is cleared.</p>
      </div>
      <div class="row"><button class="btn primary small" data-act="b-export">⬇ Download backup</button><button class="btn ghost small" data-act="backup-later">Later</button></div>
    </section>`;
  }
  function renderHome() {
    app.innerHTML = `<div class="wrap">
      <div class="logo">Spellfall<small>Homeschool</small></div>
      ${installHTML()}
      <h1 class="h1 center">Who's learning?</h1>
      <div class="kids">${store.kids().map(k => {
        const plan = planFor(k), n = plan.filter(x => x.done).length;
        return `<a class="kcard" href="#/kid/${k.id}" style="--pc:${COLORS[k.color] || COLORS.yellow};text-decoration:none;color:inherit">
          <span class="av">${esc(k.avatar)}</span><span class="kname">${esc(k.name)}</span>
          <span class="kmeta">${esc(gradeLabel(k.grade))} · ${n} of ${plan.length} done today</span></a>`;
      }).join('')}</div>
      ${meterHTML()}
      ${backupNagHTML()}
      <div class="spread"><span class="fine">Saved on this device · <a href="#/help">Help</a> · <a href="privacy.html">Privacy</a> · <a href="${feedbackHref()}">Send feedback</a> · v${VERSION}</span><button class="hold" data-hold="1"><span class="ring"></span>Parents · press and hold</button></div>
    </div>`;
  }

  /* ---------- kid home ---------- */
  function renderKid(k) {
    const plan = planFor(k), n = plan.filter(x => x.done).length, pc = COLORS[k.color] || COLORS.yellow;
    const decks = (k.flashcards.decks || []), due = decks.reduce((a, d) => a + d.cards.filter(c => (c.box || 0) < 2).length, 0);
    const list = k.spellfall.list;
    app.innerHTML = `<div class="wrap" style="--pc:${pc}">
      <div class="spread">
        <a class="btn ghost small back" href="#/">← Everyone</a>
        <div class="me"><span class="av sm">${esc(k.avatar)}</span><div><span class="name">${esc(k.name)}</span><small>${esc(gradeLabel(k.grade))}</small></div></div>
        <button class="hold" data-hold="1"><span class="ring"></span>Parents</button>
      </div>
      <div class="grid2">
        <div class="today">
          <h2>Today</h2>
          <p class="prog">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · ${n} of ${plan.length} done</p>
          ${plan.map(it => {
            const href = it.subject ? subjectHref(k, it.subject) : null;
            const inner = `<span class="box">${it.done ? '✓' : ''}</span><span class="t">${esc(it.label)}</span>${href && !it.done ? '<span class="go">Start →</span>' : ''}`;
            return href ? `<a class="titem ${it.done ? 'done' : ''}" href="${href}" style="text-decoration:none">${inner}</a>` : `<button class="titem ${it.done ? 'done' : ''}" data-act="tick" data-id="${esc(it.id)}">${inner}</button>`;
          }).join('')}
          ${n === plan.length && plan.length ? '<div class="allset">All done for today! 🎉</div>' : ''}
        </div>
        <div class="col">
          <div class="subjects">
            <a class="subj" style="--sc:${SUBJECTS.spelling.color}" href="${subjectHref(k, 'spelling')}"><span class="ic">✏️</span><b>Spelling</b><span>${list && list.words ? `${esc(list.title)} · ${list.words.length} words` : 'No list yet'}</span></a>
            <a class="subj" style="--sc:${SUBJECTS.flashcards.color}" href="#/kid/${k.id}/flashcards"><span class="ic">🃏</span><b>Flashcards</b><span>${decks.length ? `${decks.length} deck${decks.length === 1 ? '' : 's'} · ${due} to practice` : 'No decks yet'}</span></a>
            <a class="subj" style="--sc:${SUBJECTS.math.color}" href="#/kid/${k.id}/math"><span class="ic">🧮</span><b>Math</b><span>Fact drills · ${k.math.pics || 0} picture${k.math.pics === 1 ? '' : 's'} found</span></a>
            <a class="subj" style="--sc:${SUBJECTS.typing.color}" href="${subjectHref(k, 'typing')}"><span class="ic">⌨️</span><b>Typing</b><span>${(() => { const n = ((k.spellfall.typing || {}).unlocked || 0) + 1; return `${n} lesson${n === 1 ? '' : 's'} unlocked`; })()}</span></a>
            <a class="subj" style="--sc:${COLORS.orange}" href="apps/spellfall/index.html?kid=${encodeURIComponent(k.id)}&mode=hidden"><span class="ic">🙈</span><b>Hidden words</b><span>Spell from memory</span></a>
            <a class="subj" style="--sc:${COLORS.blue}" href="#/kid/${k.id}/rocket"><span class="ic">🚀</span><b>Rocket</b><span>${(k.rocket.fuel || 0) >= ROCKET_TANK * 2 ? `${Math.floor(k.rocket.fuel / ROCKET_TANK)} tanks ready!` : (k.rocket.fuel || 0) >= ROCKET_TANK ? 'Ready to launch!' : `Fuel ${k.rocket.fuel || 0} / ${ROCKET_TANK}`}${k.rocket.best ? ` · record ${window.HubRocket.fmt(k.rocket.best)}` : ''}</span></a>
            <a class="subj" style="--sc:${SUBJECTS.phonics.color}" href="#/kid/${k.id}/phonics"><span class="ic">🔤</span><b>Phonics</b><span>Sound Sort · Blend Builder · Magic-e</span></a>
          </div>
          ${meterHTML()}
        </div>
      </div>
    </div>`;
  }

  // tapping Check takes focus off the input; taking it back inside the tap keeps the iPad keyboard up for the next problem
  function keepFocus(inp) { try { inp.focus({ preventScroll: true }); } catch {} }

  /* ---------- flashcards: decks ---------- */
  const BOX = [{ ic: '🪨', name: 'Stones', sub: 'new' }, { ic: '🪜', name: 'Stairs', sub: 'getting it' }, { ic: '⭐', name: 'Stars', sub: 'learned' }];
  function towerHTML(cards) {
    const n = [0, 0, 0]; cards.forEach(c => n[Math.min(2, c.box || 0)]++);
    return `<div class="tower">${BOX.map((b, i) => `<div class="tbox ${i === 2 ? 'stars' : ''}"><div class="ic">${b.ic}</div><b>${n[i]}</b><span>${b.name} · ${b.sub}</span></div>`).join('')}</div>`;
  }
  function renderDecks(k) {
    const decks = k.flashcards.decks || [], all = decks.flatMap(d => d.cards);
    app.innerHTML = `<div class="wrap narrow" style="--pc:${COLORS[k.color]}">
      <a class="btn ghost small back" href="#/kid/${k.id}">← ${esc(k.name)}</a>
      <h1 class="h1">Flashcards</h1>
      ${all.length ? `<p class="muted">Climb the tower! Get a card right and it moves up. Stars are cards you know.</p>${towerHTML(all)}<p class="fine">Or play <a href="apps/spellfall/index.html?kid=${encodeURIComponent(k.id)}&mode=flash">☄️ Falling flashcards</a>: read the clue, type the answer before it lands.</p>` : ''}
      ${decks.length ? decks.map(d => {
        const left = d.cards.filter(c => (c.box || 0) < 2).length;
        return `<div class="deckrow"><div><b>${esc(d.title)}</b><small>${d.cards.length} card${d.cards.length === 1 ? '' : 's'} · ${left ? `${left} still climbing` : 'all stars!'}${d.subject ? ' · ' + esc(d.subject) : ''}</small></div><a class="btn primary" href="#/kid/${k.id}/flashcards/${d.id}">${left ? 'Practice' : 'Review'}</a></div>`;
      }).join('') : `<div class="card"><p class="h3">No flashcards yet</p><p class="muted">Ask a grown-up to snap a photo of a quiz or study sheet. Press and hold the Parents button.</p></div>`}
    </div>`;
  }

  /* ---------- flashcards: study ---------- */
  function sessionCards(d) {
    const t = today();
    const stones = d.cards.filter(c => (c.box || 0) === 0);
    const stairs = d.cards.filter(c => c.box === 1 && c.last !== t);
    let pick = shuffle(stones.slice()).concat(shuffle(stairs.slice()));
    if (!pick.length) pick = shuffle(d.cards.slice()); // everything learned: free review
    return pick.slice(0, 12);
  }
  function renderStudy(k, deckId) {
    const d = (k.flashcards.decks || []).find(x => x.id === deckId); if (!d) return go(`#/kid/${k.id}/flashcards`);
    if (!S.study || S.study.deckId !== deckId || S.study.kidId !== k.id) S.study = { kidId: k.id, deckId, queue: sessionCards(d).map(c => c.id), i: 0, tries: 0, right: 0, moved: 0, revealed: false, done: false };
    const st = S.study;
    if (st.done) return renderStudyDone(k, d);
    const c = d.cards.find(x => x.id === st.queue[st.i]); if (!c) { st.done = true; return renderStudy(k, deckId); }
    const parts = String(c.q).split(/_{2,}/), hasBlank = parts.length > 1;
    const blank = `<span class="blank ${st.revealed ? 'right' : ''}">${st.revealed ? esc(c.a) : '&nbsp;'}</span>`;
    const qHTML = hasBlank ? esc(parts[0]) + blank + esc(parts.slice(1).join('___')) : esc(c.q) + '<br>' + blank;
    const hint = st.revealed ? (st.mustType ? 'Here it is. Type it once to remember it.' : '') : st.tries === 1 ? `Not quite. Hint: ${[...c.a].map(ch => /\s/.test(ch) ? '&nbsp;&nbsp;' : '_').join(' ')} (${c.a.replace(/\s/g, '').length} letter${c.a.replace(/\s/g, '').length === 1 ? '' : 's'})` : st.tries === 2 ? `Not quite. Hint: it starts with “${esc(c.a[0])}”` : '';
    const head = `<a class="btn ghost small" href="#/kid/${k.id}/flashcards">← Decks</a><span class="fine">Card ${st.i + 1} of ${st.queue.length} · ${BOX[Math.min(2, c.box || 0)].ic} ${BOX[Math.min(2, c.box || 0)].name}</span>`;
    const card = `<div class="meta"><span>${esc(d.title)}</span><span>${c.ref ? esc(c.ref) : ''}</span></div><p class="q">${qHTML}</p><p class="hint">${hint}</p>`;
    const tools = `<button class="btn small ghost" data-act="fc-hear">🔊 Read it to me</button>${!st.revealed ? '<button class="btn small ghost" data-act="fc-show">Show me</button>' : ''}`;
    const pct = Math.round(st.i / st.queue.length * 100), label = st.revealed && !st.mustType && !st.busy ? 'Next' : 'Check';
    let inp = $('#ans');
    if (inp) { // same screen: keep this input so the iPad keyboard stays up from card to card
      $('#st-head').innerHTML = head; $('.pbar i').style.width = pct + '%'; $('.fcard').innerHTML = card; $('#st-tools').innerHTML = tools; $('#st-go').textContent = label;
      inp.value = ''; inp.classList.remove('bad');
    } else {
      app.innerHTML = `<div class="wrap narrow">
      <div class="spread" id="st-head">${head}</div>
      <div class="pbar"><i style="width:${pct}%"></i></div>
      <div class="study">
        <div class="fcard">${card}</div>
        <form class="answer" id="ansform" autocomplete="off"><input id="ans" class="inp" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Type the answer" aria-label="Your answer"><button class="btn primary" type="submit" id="st-go">${label}</button></form>
        <div class="row" id="st-tools">${tools}</div>
      </div></div>`;
      inp = $('#ans');
    }
    try { inp.focus({ preventScroll: true }); } catch {}
    $('#ansform').onsubmit = e => { e.preventDefault(); keepFocus(inp); checkCard(k, d, c, inp); };
    if (young(k) && st.tries === 0 && !st.revealed && !st.spoke) { st.spoke = true; setTimeout(() => readCard(c), 300); }
  }
  function readCard(c) { speech.say(String(c.q).replace(/_{2,}/g, ' blank '), { rate: .85 }); }
  function moveCard(k, d, c, up) {
    store.updateKid(k.id, kk => {
      const dd = kk.flashcards.decks.find(x => x.id === d.id), cc = dd && dd.cards.find(x => x.id === c.id); if (!cc) return;
      cc.seen = (cc.seen || 0) + 1; cc.last = today();
      if (up) cc.box = Math.min(2, (cc.box || 0) + 1); else { cc.box = 0; cc.miss = (cc.miss || 0) + 1; }
    });
  }
  const CARD_MS = 1200, DRILL_MS = 650; // how long the Correct stamp stays before moving on
  function cardRight(k, d, note) { // stamp it, then the next card comes by itself; no extra press
    const st = S.study; st.busy = true;
    if (note) $('.hint').textContent = note;
    stamp($('.fcard'), CARD_MS);
    setTimeout(() => { st.busy = false; if (S.study === st && route()[3] === d.id) nextCard(k, d); }, CARD_MS);
  }
  function checkCard(k, d, c, inp) {
    const st = S.study, v = norm(inp.value);
    if (st.busy) return;
    if (st.revealed) {
      // after "Show me" or 3 misses, type it once from the shown answer to lock it in
      if (st.mustType && v !== norm(c.a)) { inp.classList.remove('bad'); void inp.offsetWidth; inp.classList.add('bad'); return; }
      if (st.mustType) return cardRight(k, d);
      return nextCard(k, d);
    }
    if (!v) return;
    if (v === norm(c.a)) {
      const firstTry = st.tries === 0, was = c.box || 0;
      if (firstTry) { st.right++; if (was < 2) st.moved++; }
      moveCard(k, d, c, firstTry);
      st.revealed = true; st.mustType = false; st.busy = true;
      renderStudy(k, d.id);
      return cardRight(k, d, !firstTry ? 'It stays on the Stones for a bit more practice.' : was === 2 ? 'Still a star! ⭐' : c.box === 1 ? 'Up to the Stairs! 🪜' : 'Up to the Stars! ⭐');
    }
    st.tries++;
    if (st.tries >= 3) { moveCard(k, d, c, false); st.revealed = true; st.mustType = true; speech.say(`The answer is ${c.a}`, { rate: .85 }); }
    renderStudy(k, d.id);
    if (!st.revealed) { void inp.offsetWidth; inp.classList.add('bad'); }
  }
  function nextCard(k, d) {
    const st = S.study; st.i++; st.tries = 0; st.revealed = false; st.mustType = false; st.spoke = false;
    if (st.i >= st.queue.length) { st.done = true; store.log(k.id, { subject: 'flashcards', deck: d.id, score: st.right, total: st.queue.length, points: Math.min(10, st.right) }); }
    renderStudy(k, d.id);
  }
  function renderStudyDone(k, d) {
    const st = S.study, kk = store.kid(k.id), dd = kk.flashcards.decks.find(x => x.id === d.id);
    const pct = st.queue.length ? st.right / st.queue.length : 0, stars = pct >= 1 ? 3 : pct >= .75 ? 2 : 1;
    app.innerHTML = `<div class="wrap narrow">
      <h1 class="h1 center">${stars === 3 ? `Every card, ${esc(k.name)}!` : `Nice work, ${esc(k.name)}!`}</h1>
      <div class="stars-big">${starRow(stars)}</div>
      <p class="muted center">${st.right} of ${st.queue.length} right on the first try · ${st.moved} card${st.moved === 1 ? '' : 's'} climbed up</p>
      ${towerHTML(dd.cards)}
      <div class="row" style="justify-content:center"><button class="btn primary big" data-act="fc-again">Go again</button><a class="btn ghost" href="#/kid/${k.id}">Done</a></div>
    </div>`;
    window.scrollTo(0, 0);
    if (stars === 3) confetti();
  }

  /* ---------- math ---------- */
  function renderMath(k) {
    if (S.drill && S.drill.kidId === k.id) return renderDrill(k);
    const skills = C.skillsForKid(k), sel = [S.mathSkill[k.id], k.math.last, skills[0] && skills[0].id].find(id => skills.some(s => s.id === id));
    S.mathSkill[k.id] = sel;
    if (!skills.length) {
      app.innerHTML = `<div class="wrap narrow">
        <a class="btn ghost small back" href="#/kid/${k.id}">← ${esc(k.name)}</a>
        <h1 class="h1">Math facts</h1>
        <div class="card"><p class="h3">No math picked yet</p><p class="muted">Ask a grown-up to pick some. Press and hold the Parents button, then choose Math.</p></div>
      </div>`;
      return;
    }
    app.innerHTML = `<div class="wrap narrow">
      <a class="btn ghost small back" href="#/kid/${k.id}">← ${esc(k.name)}</a>
      <h1 class="h1">Math facts</h1>
      <p class="muted">Answer 20 problems. Every right answer uncovers part of a hidden picture. Spot what it is and spell it for a bonus!${C.fallingFor(k).length ? ` Or try <a href="apps/spellfall/index.html?kid=${encodeURIComponent(k.id)}&mode=math">☄️ Falling Facts</a>: problems fall and you type the answer.` : ''}</p>
      <div class="skills">${skills.map(s => { const b = k.math.best[s.id]; return `<button class="skill" data-act="m-skill" data-id="${s.id}" aria-pressed="${s.id === sel}"><b>${esc(s.label)}</b><span>${b ? `Best: ${b.right}/20 in ${b.secs}s` : 'New!'}</span></button>`; }).join('')}</div>
      <div class="row"><button class="btn primary big" data-act="m-go" ${sel ? '' : 'disabled'}>Start</button></div>
    </div>`;
  }
  function startDrill(k) {
    const id = S.mathSkill[k.id], sk = C.SKILLS[id]; if (!sk) return;
    const probs = [], seen = new Set(), pics = C.picturesFor(k.grade);
    for (let i = 0; probs.length < 20 && i < 200; i++) { const p = sk.gen(); if (seen.has(p.q) && i < 150) continue; seen.add(p.q); probs.push(p); }
    S.drill = { kidId: k.id, skill: id, probs, i: 0, right: 0, wrong: 0, miss: [], t0: Date.now(), tries: 0, art: pics[Math.floor(Math.random() * pics.length)], tiles: shuffle([...Array(20).keys()]), shown: 0, done: false, guessAt: 3, guessing: false, guessed: false, tried: false };
    store.updateKid(k.id, kk => { kk.math.last = id; });
    renderDrill(k);
  }
  function stopDrill() { if (S.drill && !S.drill.done) S.drill = null; if (S.drill && S.drill.done && !route().includes('math')) S.drill = null; }
  const PIC_BONUS = 3; // family-goal stars for spelling the hidden picture
  const uncovered = d => new Set(d.guessed ? d.tiles : d.tiles.slice(0, d.shown));
  function picHTML(d) { const off = uncovered(d); return `<div class="pic" aria-label="${d.guessed ? `The picture: ${esc(d.art.name)}` : `Hidden picture, ${off.size} of 20 pieces uncovered`}"><div class="art" aria-hidden="true">${d.art.art}</div>${[...Array(20).keys()].map(i => `<i class="${off.has(i) ? 'off' : ''}"></i>`).join('')}</div>`; }
  function guessRow(d) { // after a wrong guess the button waits for a few more problems
    if (d.guessed) return `<span class="fine">You spelled it: <b>${esc(d.art.name)}</b>! Finish your problems to collect the bonus.</span>`;
    const left = d.guessAt - d.i;
    return `<button class="btn small" data-act="m-guess" ${left > 0 ? 'disabled' : ''}>🔎 I know what it is!</button>${left > 0 ? `<span class="fine">${d.tried ? 'Good try! ' : ''}Solve ${left} more to guess.</span>` : ''}`;
  }
  function renderGuess(k) { // spell the hidden picture; the clock waits
    const d = S.drill, n = esc(d.art.name);
    app.innerHTML = `<div class="wrap narrow">
      <div class="spread"><button class="btn ghost small" data-act="m-guess-x">← Back to my problems</button><span class="fine">${esc(C.SKILLS[d.skill].label)}</span></div>
      ${picHTML(d)}
      ${d.guessed ? `<h1 class="h2 center">It's the ${n}!</h1>
        <p class="muted center">You spelled it! When you finish your problems you get a picture found and ${PIC_BONUS} bonus stars.</p>
        <div class="row" style="justify-content:center"><button class="btn primary big" data-act="m-guess-x">Keep solving</button></div>`
      : `<h1 class="h2 center">What is the picture? Spell it!</h1>
        <form class="answer" id="gform" autocomplete="off"><input id="gans" class="inp" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" maxlength="24" aria-label="Spell the picture" placeholder="Type the word"><button class="btn primary" type="submit">Check</button></form>
        <p class="fine center">Not sure yet? Go back and solve a few more.</p>`}
    </div>`;
    if (d.guessed) return stamp($('.pic'), 1500);
    const inp = $('#gans'); try { inp.focus({ preventScroll: true }); } catch {}
    $('#gform').onsubmit = e => { e.preventDefault(); checkGuess(k, inp); };
  }
  function checkGuess(k, inp) {
    const d = S.drill; if (!C.guessKey(inp.value)) return;
    if (C.pictureMatches(d.art, inp.value)) { d.guessed = true; return renderGuess(k); }
    d.tried = true; d.guessAt = d.i + 3; resumeDrill(k);
  }
  function resumeDrill(k) { const d = S.drill; d.guessing = false; d.t0 += Date.now() - d.pausedAt; renderDrill(k); }
  const mathqClass = t => `mathq ${t.length > 12 ? 'sm' : ''}`;
  // the chalk font has no minus sign or small digits, so draw a dash and real superscripts in it
  const mathHTML = t => esc(t).replace(/−/g, '–').replace(/\^\?/g, '<sup>?</sup>').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, c => `<sup>${C.SUPERS.indexOf(c)}</sup>`);
  function showWorked(p) { const q = $('#mq'), t = C.solvedText(p); q.className = mathqClass(t); q.innerHTML = mathHTML(t); }
  function renderDrill(k) {
    const d = S.drill;
    if (d.done) {
      const secs = Math.round((d.end - d.t0) / 1000), stars = d.right >= 20 ? 3 : d.right >= 16 ? 2 : 1;
      app.innerHTML = `<div class="wrap narrow">
        <h1 class="h1 center">${d.right === 20 || d.guessed ? 'You found the whole picture!' : `Great work, ${esc(k.name)}!`}</h1>
        ${picHTML(d)}
        ${d.guessed ? `<p class="note center">🏆 You spelled it: <b>${esc(d.art.name)}</b>. That's a picture found, plus ${PIC_BONUS} bonus stars!</p>` : d.right === 20 ? `<p class="note center">🏆 It's the ${esc(d.art.name)}. That's a picture found!</p>` : ''}
        <div class="stars-big">${starRow(stars)}</div>
        <div class="res">${d.right}/20</div><p class="muted center">right on the first try · ${secs} seconds${d.isBest ? ' · <b style="color:var(--pink)">new best!</b>' : ''}</p>
        ${d.miss.length ? `<div class="card"><span class="lbl">Practice these</span><div class="wordchips">${d.miss.map(m => `<span class="wchip">${esc(C.solvedText(m))}</span>`).join('')}</div></div>` : ''}
        <div class="row" style="justify-content:center"><button class="btn primary big" data-act="m-again">Again</button><button class="btn ghost" data-act="m-menu">Pick another</button><a class="btn ghost" href="#/kid/${k.id}">Done</a></div>
      </div>`;
      window.scrollTo(0, 0);
      if (stars === 3) confetti();
      return;
    }
    if (d.guessing) return renderGuess(k);
    const p = d.probs[d.i];
    app.innerHTML = `<div class="wrap narrow">
      <div class="spread"><button class="btn ghost small" data-act="m-quit">← Stop</button><span class="fine">${esc(C.SKILLS[d.skill].label)}</span></div>
      <div class="mathbar"><span>Problem <b id="mnum">${d.i + 1}</b> of 20</span><span>✓ <b id="mright">${d.right}</b></span><span id="mclock">${Math.round((Date.now() - d.t0) / 1000)}s</span></div>
      ${picHTML(d)}
      <div class="guessrow" id="mguess">${guessRow(d)}</div>
      <div class="${mathqClass(p.q)}" id="mq">${mathHTML(C.problemText(p))}</div>
      <form class="answer" id="mform" autocomplete="off" novalidate><input id="mans" class="inp" ${C.SKILLS[d.skill].neg ? 'inputmode="text"' : 'inputmode="numeric" pattern="[0-9]*"'} autocomplete="off" aria-label="Answer" placeholder="?"><button class="btn primary" type="submit">Check</button></form>
      <div class="row"><button class="btn small ghost" data-act="m-hear">🔊 Read it to me</button><span class="fine" id="mmsg" aria-live="polite">${d.tries ? 'Not quite. Try once more!' : ''}</span></div>
    </div>`;
    const inp = $('#mans'); try { inp.focus({ preventScroll: true }); } catch {}
    $('#mform').onsubmit = e => { e.preventDefault(); keepFocus(inp); answerDrill(k, inp); };
    tickClock();
  }
  let clockT = 0;
  function tickClock() { clearInterval(clockT); clockT = setInterval(() => { const el = $('#mclock'); if (!el || !S.drill || S.drill.done) return clearInterval(clockT); el.textContent = Math.round((Date.now() - S.drill.t0) / 1000) + 's'; }, 500); }
  function sayProblem(p) { speech.say(C.sayText(p), { rate: .9 }); }
  function syncPic(d) { const off = uncovered(d); $$('.pic i').forEach((el, i) => el.classList.toggle('off', off.has(i))); }
  function stepDrill(k, d) { // the next problem appears in place: replacing the input from a timer would drop the iPad keyboard
    if (S.drill !== d) return;
    d.busy = false;
    if (d.i >= d.probs.length) return finishDrill(k);
    const p = d.probs[d.i], q = $('#mq'), inp = $('#mans'); if (!q || !inp) return renderDrill(k);
    $('#mnum').textContent = d.i + 1; q.className = mathqClass(p.q); q.innerHTML = mathHTML(C.problemText(p));
    inp.value = ''; inp.classList.remove('bad'); $('#mmsg').textContent = ''; $('#mguess').innerHTML = guessRow(d); keepFocus(inp);
  }
  function answerDrill(k, inp) {
    const d = S.drill, p = d.probs[d.i], v = inp.value.replace(/[−–—]/g, '-').replace(/[^0-9-]/g, '');
    if (v === '' || v === '-' || d.busy) return;
    if (+v === p.a) {
      if (d.tries === 0) { d.right++; d.shown++; } else d.miss.push(p);
      d.i++; d.tries = 0; d.busy = true; d.t0 += DRILL_MS; // the stamp's pause doesn't count against their time
      $('#mright').textContent = d.right; syncPic(d); showWorked(p);
      stamp($('#mq'), DRILL_MS);
      setTimeout(() => stepDrill(k, d), DRILL_MS);
    } else {
      d.tries++;
      if (d.tries >= 2) { d.miss.push(p); d.wrong++; d.busy = true; showWorked(p); $('#mmsg').textContent = `It's ${String(p.a).replace('-', '−')}. Let's keep going!`; speech.say(`The answer is ${p.a}`, { rate: .9 }); d.i++; d.tries = 0; setTimeout(() => stepDrill(k, d), 1600); return; }
      inp.value = ''; inp.classList.remove('bad'); void inp.offsetWidth; inp.classList.add('bad'); $('#mmsg').textContent = 'Not quite. Try once more!';
    }
  }
  function finishDrill(k) {
    const d = S.drill; d.done = true; d.end = Date.now(); clearInterval(clockT);
    const secs = Math.round((d.end - d.t0) / 1000);
    store.updateKid(k.id, kk => {
      const b = kk.math.best[d.skill];
      if (!b || d.right > b.right || (d.right === b.right && secs < b.secs)) { kk.math.best[d.skill] = { right: d.right, secs }; d.isBest = !!b; }
      if (d.right === 20 || d.guessed) kk.math.pics = (kk.math.pics || 0) + 1;
    });
    store.log(k.id, { subject: 'math', skill: d.skill, score: d.right, total: 20, secs, points: Math.round(d.right / 2) + (d.guessed ? PIC_BONUS : 0) });
    renderDrill(k);
  }

  /* ---------- parent gate ---------- */
  function openParent() {
    if (!pin.isSet()) { S.parentOK = true; S.parentAt = Date.now(); return go('#/parent'); }
    let entry = '';
    const draw = box => { $('.pindots', box).innerHTML = [0, 1, 2, 3].map(i => `<i class="${i < entry.length ? 'on' : ''}"></i>`).join(''); };
    modal(`<p class="h3 center">Parent PIN</p><div class="pindots"></div><p class="fine center" id="pinmsg"> </p><div class="pinpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(n => n === '' ? '<span></span>' : `<button data-pin="${n}">${n}</button>`).join('')}</div><button class="btn ghost small" id="pin-x">Cancel</button>`, box => {
      draw(box);
      $('#pin-x', box).onclick = closeModal;
      box.onclick = async e => {
        const b = e.target.closest('[data-pin]'); if (!b) return;
        const v = b.dataset.pin;
        if (v === '⌫') entry = entry.slice(0, -1); else if (entry.length < 4) entry += v;
        draw(box);
        if (entry.length === 4) {
          if (await pin.check(entry)) { closeModal(); S.parentOK = true; S.parentAt = Date.now(); go('#/parent'); }
          else { entry = ''; draw(box); $('#pinmsg', box).textContent = 'That PIN didn’t match.'; }
        }
      };
    });
  }
  // auto-lock parent mode after 5 idle minutes
  setInterval(() => { if (S.parentOK && Date.now() - S.parentAt > 5 * 60 * 1000) { S.parentOK = false; if (route()[0] === 'parent') { toast('Parent mode locked after 5 minutes.'); go('#/'); } } }, 15000);
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => { if (S.parentOK) S.parentAt = Date.now(); }, true));

  /* ---------- parent ---------- */
  const PTABS = [['kids', 'Kids & progress'], ['spelling', 'Spelling lists'], ['math', 'Math'], ['flash', 'Flashcards'], ['today', 'Today plan'], ['settings', 'Settings'], ['backup', 'Backup']];
  function pk() { const kids = store.kids(); if (!S.pkid || !kids.some(k => k.id === S.pkid)) S.pkid = kids[0] && kids[0].id; return store.kid(S.pkid); }
  function kidTabs() { return `<div class="tabs" role="group" aria-label="Child">${store.kids().map(k => `<button class="tab" data-act="p-kid" data-id="${k.id}" aria-pressed="${k.id === S.pkid}">${esc(k.avatar)} ${esc(k.name)}</button>`).join('')}</div>`; }
  function renderParent() {
    pk();
    const body = { kids: pKids, spelling: pSpelling, math: pMath, flash: pFlash, today: pToday, settings: pSettings, backup: pBackup }[S.ptab] || pKids;
    app.innerHTML = `<div class="wrap">
      <div class="spread"><h1 class="h1">Parents</h1><div class="row"><a class="btn ghost small" href="#/help">❓ Help</a><a class="btn primary small" href="#/">Done</a></div></div>
      <div class="tabs" role="group" aria-label="Section">${PTABS.map(([id, l]) => `<button class="tab" data-act="p-tab" data-id="${id}" aria-pressed="${S.ptab === id}">${l}</button>`).join('')}</div>
      ${body()}
    </div>`;
  }
  function last7(k) {
    const days = [...Array(7).keys()].map(i => { const d = new Date(); d.setDate(d.getDate() - i); return today(d); });
    const by = {}; for (const e of k.log || []) if (days.includes(e.date)) (by[e.date] = by[e.date] || []).push(e);
    return { days, by };
  }
  function pKids() {
    const kids = store.kids();
    return `<div class="cols">${kids.map(k => {
      const { days, by } = last7(k), active = days.filter(d => by[d]).length, plan = planFor(k);
      const sessions = (k.log || []).filter(e => days.includes(e.date)), missed = [];
      for (const d of k.flashcards.decks || []) for (const c of d.cards) if ((c.miss || 0) > 0 && (c.box || 0) < 2) missed.push(c.a);
      return `<section class="card">
        <div class="spread"><div class="me"><span class="av sm" style="--pc:${COLORS[k.color]}">${esc(k.avatar)}</span><div><b style="font-size:24px">${esc(k.name)}</b><small>${esc(gradeLabel(k.grade))}</small></div></div></div>
        <div class="kpis"><div><b>${plan.filter(x => x.done).length}/${plan.length}</b><span>Today</span></div><div><b>${active}/7</b><span>Days active</span></div><div><b>${sessions.length}</b><span>Sessions this week</span></div><div><b>${k.math.pics || 0}</b><span>Math pictures</span></div></div>
        <div class="field"><span class="lbl">Last 7 days</span><div class="row" style="gap:6px">${days.slice().reverse().map(d => `<span title="${d}" style="width:30px;height:30px;border-radius:8px;display:grid;place-items:center;font-size:13px;background:${by[d] ? 'var(--good)' : 'rgba(255,255,255,.1)'}">${new Date(d + 'T12:00').toLocaleDateString('en-US', { weekday: 'narrow' })}</span>`).join('')}</div></div>
        ${missed.length ? `<div class="field"><span class="lbl">Flashcards still tricky</span><div class="wordchips">${[...new Set(missed)].slice(0, 12).map(w => `<span class="wchip">${esc(w)}</span>`).join('')}</div></div>` : ''}
        <details><summary class="fine" style="cursor:pointer">Edit ${esc(k.name)}</summary><div class="col" style="margin-top:12px">
          <div class="two"><div class="field"><label class="lbl" for="kn-${k.id}">Name</label><input id="kn-${k.id}" class="inp" data-kname="${k.id}" value="${esc(k.name)}" maxlength="20"></div>
          <div class="field"><label class="lbl" for="kg-${k.id}">Grade</label><select id="kg-${k.id}" class="inp" data-kgrade="${k.id}">${GRADES.map(g => `<option ${g === k.grade ? 'selected' : ''}>${g}</option>`).join('')}</select></div></div>
          <div class="chips">${AVATARS.map(a => `<button class="chip" data-act="k-av" data-id="${k.id}" data-v="${a}" aria-pressed="${a === k.avatar}">${a}</button>`).join('')}</div>
          <div class="chips">${Object.entries(COLORS).map(([c, v]) => `<button class="chip" data-act="k-color" data-id="${k.id}" data-v="${c}" aria-pressed="${c === k.color}" style="border-color:${v}">${c}</button>`).join('')}</div>
          <div class="row"><button class="btn small danger" data-act="k-remove" data-id="${k.id}">Remove ${esc(k.name)}</button></div>
        </div></details>
      </section>`;
    }).join('')}
      <section class="card"><h2 class="h3">Add a child</h2>
        <div class="two"><div class="field"><label class="lbl" for="nk-name">Name</label><input id="nk-name" class="inp" maxlength="20" placeholder="First name"></div>
        <div class="field"><label class="lbl" for="nk-grade">Grade</label><select id="nk-grade" class="inp">${GRADES.map(g => `<option ${g === '1st' ? 'selected' : ''}>${g}</option>`).join('')}</select></div></div>
        <div class="row"><button class="btn primary small" data-act="k-add">Add child</button></div></section>
    </div>`;
  }
  function pSpelling() {
    const k = pk(); if (!k) return '';
    const L = k.spellfall.list, lists = C.listsFor(k.grade);
    return `${kidTabs()}<div class="cols">
      <section class="card"><div class="spread"><h2 class="h3">This week · ${esc(k.name)}</h2><a class="btn small ghost" href="#/parent/print/${k.id}">🖨 Print page</a></div>
        ${L && L.words ? `<div><b>${esc(L.title)}</b> <span class="fine" style="display:inline">· ${L.words.length} words</span></div><div class="wordchips">${L.words.map(w => `<span class="wchip">${esc(w)}</span>`).join('')}</div>` : '<p class="muted">No list yet.</p>'}
        <div class="field"><label class="lbl" for="sp-text">Type a list (one word per line)</label><textarea id="sp-text" class="inp" placeholder="cake&#10;lake&#10;because" autocapitalize="off" spellcheck="false"></textarea></div>
        <div class="row"><button class="btn primary small" data-act="sp-save">Save as this week’s list</button><a class="btn small ghost" href="apps/spellfall/index.html?kid=${encodeURIComponent(k.id)}&grown=1">${ai.available() ? '📷 Scan a school list' : 'More list options'}</a></div>
        <p class="fine">Scanning a paper list happens in the Spellfall game's grown-ups panel${ai.available() ? '' : ' and needs your API key in Settings'}.</p>
      </section>
      <section class="card"><h2 class="h3">Built-in lists · ${esc(gradeLabel(k.grade))}</h2>
        ${(() => { const cur = store.family.settings.curriculum, name = (CURRICULA.find(c => c[0] === cur) || CURRICULA[0])[1];
          const upper = !C.ABEKA_GRADES.includes(k.grade), what = upper ? 'spelling patterns and roots' : 'phonics order';
          return `<div class="note spread"><span>📚 ${cur === 'abeka' && !upper ? `<b>Following Abeka’s ${esc(k.grade)}-grade phonics order</b>` : `<b>Typical ${esc(k.grade)}-grade ${what}</b> · Curriculum: ${esc(name)}`}</span><button class="btn small ghost" data-act="p-tab" data-id="settings">Change</button></div>`; })()}
        <p class="fine">For weeks with no school list. Grouped by phonics pattern or spelling rule. ${store.family.settings.curriculum === 'abeka' && C.ABEKA_GRADES.includes(k.grade) ? 'These are original lists, not Abeka’s.' : 'To follow your own curriculum, type or scan its list instead.'}</p>
        <ul class="list">${lists.map((l, i) => `<li><div><b>${esc(l.title)}</b><small>${esc(l.pattern)} · ${esc(l.words.slice(0, 6).join(', '))}…</small></div><button class="btn small ghost" data-act="sp-use" data-i="${i}">Use this week</button></li>`).join('')}</ul>
      </section></div>`;
  }
  function setSpellingList(k, title, words) {
    store.updateKid(k.id, kk => {
      const sf = kk.spellfall;
      if (sf.list) sf.pastLists = [sf.list, ...(sf.pastLists || [])].slice(0, 12);
      sf.list = { id: uid('l'), title, weekOf: window.Hub.mondayOf(), words, addedAt: Date.now() };
    });
  }
  function parseWords(text) {
    const seen = new Set(), out = [];
    for (let w of String(text || '').split(/[\n,;]+/)) { w = w.replace(/^\s*(\d+\s*[.):-]|[-•*·])\s*/, '').replace(/[.!?:"]+$/, '').replace(/\s+/g, ' ').trim(); if (!w || w.length > 32) continue; const kk = w.toLowerCase(); if (seen.has(kk)) continue; seen.add(kk); out.push(w); if (out.length >= 60) break; }
    return out;
  }

  /* --- math (parent): which skills each child practices --- */
  function pMath() {
    const k = pk(); if (!k) return '';
    const on = new Set(C.mathOnIds(k)), custom = Array.isArray(k.math.on), n = esc(k.name), falling = C.fallingFor(k).length;
    const grades = s => s.grades.length > 1 ? `${s.grades[0]}–${s.grades[s.grades.length - 1]}` : s.grades[0];
    const sample = id => S.mathEx[id] || (S.mathEx[id] = C.SKILLS[id].gen().q);
    return `${kidTabs()}<section class="card">
        <div class="spread"><h2 class="h3">Math for ${n}</h2><span class="fine">${on.size} skill${on.size === 1 ? '' : 's'} on</span></div>
        <p class="muted">Turn on what ${n} should practice. This sets both Math facts and Falling Facts. Any skill can be on, even from another grade, so you can move ${n} up or down.</p>
        ${custom ? `<div class="note spread"><span>These are your choices for ${n}. They stay the same if the grade changes.</span><button class="btn small ghost" data-act="mp-reset">Use the ${esc(gradeLabel(k.grade))} picks</button></div>` : `<p class="fine">Showing the usual picks for ${esc(gradeLabel(k.grade))}. They follow the grade until you change a switch.</p>`}
        ${!on.size ? `<p class="err">Nothing is on, so ${n}’s math screen will ask for a grown-up. Turn on at least one skill.</p>` : !falling ? `<p class="note">Falling Facts needs a skill that can fall, like adding or times tables. Skills marked “Math facts only” are too wordy for a falling rock.</p>` : ''}
      </section>
      <div class="cols">${C.MATH_GROUPS.map(([name, ids]) => `<section class="card"><h3 class="h3">${esc(name)}</h3>${ids.map(id => { const s = C.SKILLS[id]; return `<button class="msw" role="switch" aria-checked="${on.has(id)}" data-act="mp-sw" data-id="${id}"><span class="sw" aria-hidden="true"></span><span class="mt"><b>${esc(s.label)}</b><small>Like ${esc(sample(id))} · ${esc(grades(s))}${C.skillFalls(s) ? '' : ' · Math facts only'}</small></span></button>`; }).join('')}</section>`).join('')}</div>`;
  }
  function setMathOn(k, ids) { // matching the grade's defaults saves nothing, so a later grade change still follows along
    const def = C.defaultMathOn(k.grade);
    store.updateKid(k.id, kk => { if (ids && !(ids.length === def.length && def.every(id => ids.includes(id)))) kk.math.on = ids; else delete kk.math.on; });
  }

  /* --- flashcards (parent): scan, review, decks --- */
  function pFlash() {
    const k = pk(); if (!k) return '';
    const decks = k.flashcards.decks || [];
    if (S.review && S.review.kidId === k.id) return kidTabs() + reviewHTML(k);
    const sc = S.scan && S.scan.kidId === k.id ? S.scan : null;
    return `${kidTabs()}<div class="cols">
      <section class="card"><h2 class="h3">Make flashcards · ${esc(k.name)}</h2>
        <p class="muted">Snap the quiz or study sheet. Claude finds each fill-in-the-blank sentence and its answer. You check every card before anything is saved.</p>
        ${sc && sc.state === 'reading' ? `<div class="scanbox">${(sc.urls || []).map(u => `<img src="${u}" alt="Page being read">`).join('')}<div class="spin" aria-hidden="true"></div><span>Reading ${sc.urls.length > 1 ? sc.urls.length + ' pages' : 'the page'}… up to a minute.</span><button class="btn small ghost" data-act="f-stop">Stop</button></div>` : ''}
        ${sc && sc.state === 'error' ? `<p class="err">${esc(sc.msg)}</p>` : ''}
        <div class="row">${ai.available() ? `<label class="btn primary" for="file">📷 Scan pages</label>` : `<button class="btn" data-act="p-tab" data-id="settings">Add API key to scan</button>`}<button class="btn ghost" data-act="f-manual">✏️ Type cards</button></div>
        <p class="fine">You can pick several photos at once for a multi-page quiz. Only the photo goes to Claude, never your kids' names.</p>
      </section>
      <section class="card"><h2 class="h3">Decks</h2>
        ${decks.length ? `<ul class="list">${decks.map(d => { const n = [0, 0, 0]; d.cards.forEach(c => n[Math.min(2, c.box || 0)]++); return `<li><div><b>${esc(d.title)}</b><small>${d.cards.length} cards · 🪨 ${n[0]} · 🪜 ${n[1]} · ⭐ ${n[2]}</small></div><div class="row" style="gap:8px"><button class="btn small ghost" data-act="f-edit" data-id="${d.id}">Edit</button><button class="btn small ghost" data-act="f-reset" data-id="${d.id}">Restart</button><button class="btn small danger" data-act="f-del" data-id="${d.id}">Delete</button></div></li>`; }).join('')}</ul>` : '<p class="muted">No decks yet.</p>'}
      </section></div>`;
  }
  function reviewHTML(k) {
    const r = S.review;
    return `<section class="card"><div class="spread"><h2 class="h3">${r.deckId ? 'Edit deck' : 'Check the cards'}</h2><span class="fine">${r.cards.length} cards</span></div>
      ${r.note ? `<p class="note">${esc(r.note)}</p>` : ''}
      <div class="two"><div class="field"><label class="lbl" for="rv-title">Deck name</label><input id="rv-title" class="inp" value="${esc(r.title)}" maxlength="50"></div>
      <div class="field"><label class="lbl" for="rv-subj">Subject</label><input id="rv-subj" class="inp" value="${esc(r.subject || '')}" maxlength="24" placeholder="Science"></div></div>
      <p class="fine">Use ___ (three underscores) where the blank goes. Cards marked in orange need a look.</p>
      <div class="review">${r.cards.map((c, i) => `<div class="rcard ${c.flag ? 'flag' : ''}">
        <textarea class="inp" data-rq="${i}" aria-label="Sentence ${i + 1}">${esc(c.q)}</textarea>
        <input class="inp ans" data-ra="${i}" value="${esc(c.a)}" aria-label="Answer ${i + 1}" placeholder="answer">
        <button class="x" data-act="r-del" data-i="${i}" aria-label="Remove card ${i + 1}">×</button>
        ${c.flag ? `<p class="flagtxt">${esc(c.flag)}</p>` : ''}</div>`).join('')}</div>
      <div class="row"><button class="btn small ghost" data-act="r-add">+ Add a card</button></div>
      <div class="field"><label class="lbl" for="rv-bulk">Or paste cards, one per line: sentence with ___ | answer</label><textarea id="rv-bulk" class="inp" style="min-height:90px" placeholder="A force is the push or ___ on an object. | pull"></textarea><div class="row"><button class="btn small ghost" data-act="r-bulk">Add pasted cards</button></div></div>
      <div class="row"><button class="btn primary" data-act="r-save">${r.deckId ? 'Save changes' : `Save deck for ${esc(k.name)}`}</button><button class="btn ghost" data-act="r-cancel">Cancel</button></div>
    </section>`;
  }
  function syncReview() {
    const r = S.review; if (!r) return;
    $$('[data-rq]').forEach(t => { const c = r.cards[+t.dataset.rq]; if (c) c.q = t.value; });
    $$('[data-ra]').forEach(t => { const c = r.cards[+t.dataset.ra]; if (c) c.a = t.value; });
    const ti = $('#rv-title'); if (ti) r.title = ti.value; const su = $('#rv-subj'); if (su) r.subject = su.value;
  }
  function flagCard(c) {
    if (!c.a.trim()) return 'No answer yet. Type the missing word.';
    if (!/_{2,}/.test(c.q)) return 'No blank found. Add ___ where the answer goes.';
    if (c.guessed) return 'The answer wasn’t written on the page. Claude guessed it, so please check.';
    return '';
  }
  async function scanFiles(files) {
    const k = pk(); if (!k || !files.length) return;
    const ctl = new AbortController(), urls = files.map(f => URL.createObjectURL(f));
    S.scan = { kidId: k.id, state: 'reading', urls, ctl }; render();
    const prompt = `These photos show a ${gradeLabel(k.grade).toLowerCase()} student's school quiz or study sheet${files.length > 1 ? ' (several pages, in order)' : ''}.
Turn every fill-in-the-blank, matching, or short-answer question into a flashcard with ONE missing word or short phrase.
- Rewrite each item as a full sentence with the missing part replaced by ___ (three underscores).
- "a" is the missing word or phrase exactly as it should be spelled.
- If the answer is written or printed on the page (filled in, circled, answer key, word bank), use it and set "guessed": false.
- If no answer is shown, give the most likely answer from the sentence and the subject, and set "guessed": true.
- For multiple-choice items, use the sentence with ___ and the correct choice as the answer.
- Keep any page number or question number in "ref" (for example "Q3 · Pg. 90"), or "".
- Skip directions, names, dates, and scores.
JSON shape: {"title": "short deck title, for example \\"Science Quiz 3: Forces\\"", "subject": "Science, Spelling, History, etc.", "cards": [{"q": "...___...", "a": "...", "guessed": false, "ref": ""}]}`;
    try {
      const res = await ai.json(prompt, { images: files, signal: ctl.signal, maxTokens: 4000 });
      if (S.scan && S.scan.ctl !== ctl) return;
      const cards = (Array.isArray(res && res.cards) ? res.cards : []).map(c => ({ q: String(c.q || '').replace(/_{2,}/g, '___').trim(), a: String(c.a || '').trim(), guessed: !!c.guessed, ref: String(c.ref || '').slice(0, 30) })).filter(c => c.q);
      if (!cards.length) { S.scan = { kidId: k.id, state: 'error', msg: 'I couldn’t find fill-in-the-blank questions in that photo. Try a closer, brighter photo, or type the cards.' }; }
      else {
        S.scan = null;
        cards.forEach(c => { c.flag = flagCard(c); });
        S.review = { kidId: k.id, title: String(res.title || 'Quiz flashcards').slice(0, 50), subject: String(res.subject || '').slice(0, 24), cards, note: `Found ${cards.length} cards. ${cards.filter(c => c.flag).length ? 'Check the orange ones.' : 'Give them a quick look, then save.'}` };
      }
    } catch (e) {
      if (S.scan && S.scan.ctl !== ctl) return;
      S.scan = e && e.code === 'cancelled' ? null : { kidId: k.id, state: 'error', msg: ai.errorText(e) };
    } finally { urls.forEach(u => setTimeout(() => URL.revokeObjectURL(u), 1000)); }
    if (route()[0] === 'parent') render();
  }
  function saveReview() {
    syncReview();
    const r = S.review, k = store.kid(r.kidId); if (!k) return;
    const cards = r.cards.map(c => ({ ...c, q: c.q.trim(), a: c.a.trim() })).filter(c => c.q && c.a);
    if (!cards.length) return toast('Add at least one card with an answer.');
    const bad = cards.filter(c => !/_{2,}/.test(c.q)).length;
    store.updateKid(k.id, kk => {
      const decks = kk.flashcards.decks = kk.flashcards.decks || [];
      const old = r.deckId ? decks.find(d => d.id === r.deckId) : null;
      const prev = new Map((old ? old.cards : []).map(c => [c.id, c]));
      const out = cards.map(c => { const o = c.id && prev.get(c.id); const keep = o && norm(o.a) === norm(c.a); return { id: c.id || uid('c'), q: c.q, a: c.a, ref: c.ref || '', box: keep ? o.box || 0 : 0, seen: keep ? o.seen || 0 : 0, miss: keep ? o.miss || 0 : 0, last: keep ? o.last || null : null }; });
      if (old) { old.title = r.title.trim() || old.title; old.subject = r.subject; old.cards = out; }
      else decks.unshift({ id: uid('d'), title: r.title.trim() || 'Flashcards', subject: r.subject, createdAt: Date.now(), cards: out });
    });
    S.review = null; render();
    toast(`Saved ${cards.length} cards for ${k.name}.${bad ? ` ${bad} have no blank and will show as questions.` : ''}`);
  }

  function pToday() {
    const p = store.family.plan;
    return `<section class="card"><div class="spread"><h2 class="h3">Daily checklist</h2><a class="btn small ghost" href="#/parent/print/all">🖨 Print weekly pages</a></div>
      <p class="muted">Every child sees this list on their Today page. Items linked to a subject check themselves off when a session is finished. Others the child taps when done.</p>
      <div class="col" style="gap:10px">${p.template.map((it, i) => `<div class="two" style="grid-template-columns:minmax(0,1fr) 180px 44px;align-items:center">
        <input class="inp" data-plabel="${i}" value="${esc(it.label)}" maxlength="40" aria-label="Item ${i + 1}">
        <select class="inp" data-psubj="${i}" aria-label="Links to"><option value="">Tick by hand</option>${Object.entries(SUBJECTS).map(([id, s]) => `<option value="${id}" ${it.subject === id ? 'selected' : ''}>${s.icon} ${s.label}</option>`).join('')}</select>
        <button class="x" data-act="pl-del" data-i="${i}" aria-label="Remove item">×</button></div>`).join('')}</div>
      <div class="row"><button class="btn small ghost" data-act="pl-add">+ Add item</button></div>
      <div class="field"><label class="lbl" for="mgoal">Family goal per week (stars)</label><input id="mgoal" class="inp" type="number" min="10" max="500" value="${store.family.settings.meterGoal || 60}" style="max-width:160px"><small class="fine">Both kids fill one shared meter, so a brother's win is everyone's win. About 10 stars is one full day for one child.</small></div>
    </section>`;
  }
  function pSettings() {
    const s = store.secret();
    return `<div class="cols">
      <section class="card"><h2 class="h3">Claude photo scanning</h2>
        <p class="muted">Photo scanning uses your own Anthropic API key. It is saved only in this browser, is never included in backups, and is only sent to Anthropic. <a href="privacy.html">Privacy details</a></p>
        <ol class="fine" style="padding-left:20px;margin:0;display:flex;flex-direction:column;gap:4px"><li>Make a key at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>.</li><li>Set a low monthly spend limit for safety. A scanned page costs a few cents at most.</li><li>Paste it below.</li></ol>
        <div class="field"><label class="lbl" for="api-key">API key</label><input id="api-key" class="inp" type="password" autocomplete="off" placeholder="${s.apiKey ? 'Saved · paste a new key to replace it' : 'sk-ant-…'}"></div>
        <div class="field"><label class="lbl" for="api-model">Model</label><input id="api-model" class="inp" value="${esc(s.model)}" autocomplete="off"><small class="fine">Default: claude-sonnet-5-5. Change it only if Anthropic retires this model.</small></div>
        <div class="row"><button class="btn primary small" data-act="api-save">Save</button>${s.apiKey ? '<button class="btn small ghost" data-act="api-test">Test</button><button class="btn small danger" data-act="api-clear">Remove key</button>' : ''}</div>
        <p class="fine" id="api-msg">${s.apiKey ? '✓ A key is saved.' : 'No key saved. Everything else works without one.'}</p>
      </section>
      <section class="card"><h2 class="h3">Your curriculum</h2>
        <p class="muted">Spellfall works alongside any curriculum. This only changes how the built-in spelling lists are described.</p>
        <div class="field"><label class="lbl" for="curric">We use</label><select id="curric" class="inp" style="max-width:340px">${CURRICULA.map(([v, l]) => `<option value="${v}" ${v === (store.family.settings.curriculum || '') ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <p class="fine">${NOT_AFFILIATED}</p>
      </section>
      <section class="card"><h2 class="h3">Parent PIN</h2>
        <p class="muted">Keeps kids out of these settings. It's a speed bump, not a lock: anyone with this device could still clear it.</p>
        <div class="field"><label class="lbl" for="pin-new">${pin.isSet() ? 'New 4-digit PIN' : '4-digit PIN'}</label><input id="pin-new" class="inp" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="off" style="max-width:160px"></div>
        <div class="row"><button class="btn primary small" data-act="pin-save">${pin.isSet() ? 'Change PIN' : 'Set PIN'}</button>${pin.isSet() ? '<button class="btn small ghost" data-act="pin-clear">Remove PIN</button>' : ''}</div>
      </section></div>`;
  }
  function pBackup() {
    const last = store.family.lastExport;
    const stale = !last || Date.now() - last > 14 * 864e5;
    return `<section class="card"><h2 class="h3">Backup</h2>
      <p class="muted">Everything lives in this browser. If the browser's data is cleared, it's gone. A backup file lets you restore it, or move to another device.</p>
      ${stale ? `<p class="note">${last ? 'Your last backup was more than two weeks ago.' : 'You haven’t made a backup yet.'}</p>` : `<p class="ok">Last backup: ${new Date(last).toLocaleDateString()}</p>`}
      <div class="row"><button class="btn primary" data-act="b-export">⬇ Download backup</button><label class="btn ghost" for="importfile">⬆ Restore from a file</label></div>
      <p class="fine">Backups include kids, lists, flashcards, and progress. They never include your API key.</p>
    </section>`;
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const a = el.dataset.act, k0 = () => store.kid(route()[1]);
    switch (a) {
      case 's-av': { const r = setupRows[+el.dataset.i]; r.avatar = AVATARS[(AVATARS.indexOf(r.avatar) + 1) % AVATARS.length]; el.textContent = r.avatar; break; }
      case 's-add': { const ks = Object.keys(COLORS), i = setupRows.length; setupRows.push({ name: '', grade: '1st', avatar: AVATARS[(i * 3 + 2) % AVATARS.length], color: ks[i % ks.length] }); renderSetup(); break; }
      case 'print-now': window.print(); break;
      case 'backup-later': store.family.settings.backupSnoozeUntil = Date.now() + 3 * 864e5; store.save(); render(); break;
      case 'install-later': store.family.settings.installSnoozeUntil = Date.now() + 7 * 864e5; store.save(); render(); break;
      case 's-del': setupRows.splice(+el.dataset.i, 1); renderSetup(); break;
      case 's-go': { const rows = setupRows.filter(r => r.name.trim()); if (!rows.length) return toast('Type at least one name.'); const ids = rows.map(r => store.addKid(r.name.trim().slice(0, 20), r.grade, r.avatar, r.color).id); setupRows = null; S.welcome = { step: 2, kidIds: ids }; go('#/welcome'); break; }
      case 'w-lists': { $$('[data-wlist]').forEach(sel => { const k = store.kid(sel.dataset.wlist); if (!k || sel.value === '') return; const l = C.listsFor(k.grade)[+sel.value]; setSpellingList(k, l.title, l.words.slice()); }); store.family.settings.curriculum = $('#w-curric').value; store.save(); S.welcome.step = 3; renderWelcome(); window.scrollTo(0, 0); break; }
      case 'w-pin': { const v = $('#w-pin').value; if (!/^\d{4}$/.test(v)) return toast('Use exactly 4 digits.'); pin.set(v).then(() => { renderWelcome(); toast('PIN saved.'); }); break; }
      case 'w-skip': case 'w-done': { const n = S.welcome ? S.welcome.kidIds.length : 0; S.welcome = null; go('#/'); toast(a === 'w-done' ? `All set! ${n > 1 ? 'Each child taps their card' : 'Tap your child’s card'} to start.` : 'You can change anything later in Parents.'); break; }
      case 'tick': { const k = k0(); if (k) { toggleManual(k, el.dataset.id); renderKid(k); } break; }
      case 'fc-hear': { const k = k0(), st = S.study; if (!k || !st) return; const d = k.flashcards.decks.find(x => x.id === st.deckId), c = d && d.cards.find(x => x.id === st.queue[st.i]); if (c) readCard(c); try { $('#ans').focus(); } catch {} break; }
      case 'fc-show': { const k = k0(), st = S.study; if (!k || !st) return; const d = k.flashcards.decks.find(x => x.id === st.deckId), c = d.cards.find(x => x.id === st.queue[st.i]); moveCard(k, d, c, false); st.revealed = true; st.mustType = true; st.tries = Math.max(1, st.tries); speech.say(c.a, { rate: .85 }); renderStudy(k, d.id); break; }
      case 'fc-again': { const k = k0(); S.study = null; if (k) renderStudy(k, route()[3]); break; }
      case 'm-skill': { const k = k0(); S.mathSkill[k.id] = el.dataset.id; renderMath(k); break; }
      case 'm-go': case 'm-again': { const k = k0(); S.drill = null; startDrill(k); break; }
      case 'm-menu': { const k = k0(); S.drill = null; renderMath(k); break; }
      case 'm-quit': { const k = k0(); clearInterval(clockT); S.drill = null; renderMath(k); break; }
      case 'm-guess': { const d = S.drill, k = k0(); if (!d || d.busy || !k) return; d.guessing = true; d.pausedAt = Date.now(); renderDrill(k); break; }
      case 'm-guess-x': { const k = k0(); if (k && S.drill) resumeDrill(k); break; }
      case 'm-hear': { const d = S.drill; if (d) sayProblem(d.probs[d.i]); try { $('#mans').focus(); } catch {} break; }
      case 'p-tab': S.ptab = el.dataset.id; S.review = null; render(); break;
      case 'p-kid': S.pkid = el.dataset.id; S.review = null; render(); break;
      case 'k-av': store.updateKid(el.dataset.id, k => { k.avatar = el.dataset.v; }); render(); break;
      case 'k-color': store.updateKid(el.dataset.id, k => { k.color = el.dataset.v; }); render(); break;
      case 'k-remove': { const k = store.kid(el.dataset.id); confirmBox(`Remove ${k.name}? Their lists, flashcards, and progress will be deleted. This can't be undone.`, `Remove ${k.name}`, () => { store.removeKid(k.id); render(); toast(`Removed ${k.name}.`); }); break; }
      case 'k-add': { const n = ($('#nk-name').value || '').trim().slice(0, 20); if (!n) return toast('Type a name first.'); const ks = Object.keys(COLORS), i = store.kids().length; store.addKid(n, $('#nk-grade').value, AVATARS[(i * 5 + 4) % AVATARS.length], ks[i % ks.length]); render(); toast(`Added ${n}.`); break; }
      case 'sp-save': { const k = pk(), w = parseWords($('#sp-text').value); if (!w.length) return toast('Type at least one word.'); setSpellingList(k, 'Week of ' + new Date(window.Hub.mondayOf() + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), w); render(); toast(`Saved ${w.length} words for ${k.name}.`); break; }
      case 'sp-use': { const k = pk(), l = C.listsFor(k.grade)[+el.dataset.i]; setSpellingList(k, l.title, l.words.slice()); render(); toast(`“${l.title}” is ${k.name}'s list this week.`); break; }
      case 'mp-sw': { const k = pk(), on = new Set(C.mathOnIds(k)), id = el.dataset.id; if (on.has(id)) on.delete(id); else on.add(id); setMathOn(k, [...on]); render(); $(`[data-act="mp-sw"][data-id="${id}"]`).focus({ preventScroll: true }); break; }
      case 'mp-reset': { const k = pk(); setMathOn(k, null); render(); toast(`${k.name} is back to the usual picks for ${gradeLabel(k.grade)}.`); break; }
      case 'f-stop': if (S.scan && S.scan.ctl) S.scan.ctl.abort(); S.scan = null; render(); break;
      case 'f-manual': S.scan = null; S.review = { kidId: pk().id, title: 'My flashcards', subject: '', cards: [{ q: '', a: '' }, { q: '', a: '' }, { q: '', a: '' }] }; render(); break;
      case 'f-edit': { const k = pk(), d = k.flashcards.decks.find(x => x.id === el.dataset.id); S.review = { kidId: k.id, deckId: d.id, title: d.title, subject: d.subject, cards: d.cards.map(c => ({ ...c })) }; render(); break; }
      case 'f-reset': { const k = pk(); confirmBox('Move every card in this deck back to the Stones to start over?', 'Restart deck', () => { store.updateKid(k.id, kk => { const d = kk.flashcards.decks.find(x => x.id === el.dataset.id); d.cards.forEach(c => { c.box = 0; c.last = null; }); }); render(); }); break; }
      case 'f-del': { const k = pk(); confirmBox('Delete this deck and its progress?', 'Delete deck', () => { store.updateKid(k.id, kk => { kk.flashcards.decks = kk.flashcards.decks.filter(d => d.id !== el.dataset.id); }); render(); }); break; }
      case 'r-del': syncReview(); S.review.cards.splice(+el.dataset.i, 1); render(); break;
      case 'r-add': syncReview(); S.review.cards.push({ q: '', a: '' }); render(); break;
      case 'r-bulk': { syncReview(); const lines = ($('#rv-bulk').value || '').split('\n').map(l => l.split('|')).filter(p => p[0] && p[0].trim()); lines.forEach(([q, ans]) => S.review.cards.push({ q: q.trim(), a: (ans || '').trim() })); S.review.cards = S.review.cards.filter(c => c.q.trim() || c.a.trim()); S.review.cards.forEach(c => { c.flag = flagCard(c); }); render(); break; }
      case 'r-save': saveReview(); break;
      case 'r-cancel': S.review = null; render(); break;
      case 'pl-add': store.family.plan.template.push({ id: uid('t'), label: 'New item', subject: null }); store.save(); render(); break;
      case 'pl-del': store.family.plan.template.splice(+el.dataset.i, 1); store.save(); render(); break;
      case 'api-save': { const key = $('#api-key').value.trim(), model = $('#api-model').value.trim() || 'claude-sonnet-5-5'; store.setSecret(key ? { apiKey: key, model } : { model }); render(); toast(key ? 'Key saved on this device.' : 'Saved.'); break; }
      case 'api-test': { const m = $('#api-msg'); m.textContent = 'Testing…'; ai.json('Reply with {"ok": true}', { maxTokens: 20 }).then(() => { m.textContent = '✓ The key works.'; }).catch(err => { m.textContent = ai.errorText(err); }); break; }
      case 'api-clear': confirmBox('Remove the API key from this device? Photo scanning will stop working.', 'Remove key', () => { store.clearSecret(); render(); }); break;
      case 'pin-save': { const v = $('#pin-new').value; if (!/^\d{4}$/.test(v)) return toast('Use exactly 4 digits.'); pin.set(v).then(() => { render(); toast('PIN saved.'); }); break; }
      case 'pin-clear': pin.clear(); render(); toast('PIN removed.'); break;
      case 'b-export': {
        store.family.lastExport = Date.now(); store.save();
        const blob = new Blob([store.exportJSON()], { type: 'application/json' }), u = URL.createObjectURL(blob), aEl = document.createElement('a');
        aEl.href = u; aEl.download = `spellfall-homeschool-backup-${today()}.json`; document.body.appendChild(aEl); aEl.click(); aEl.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000);
        render(); toast('Backup downloaded.'); break;
      }
    }
  });
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.si !== undefined && setupRows) setupRows[+t.dataset.si].name = t.value;
    else if (t.dataset.plabel !== undefined) { store.family.plan.template[+t.dataset.plabel].label = t.value; store.save(); }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.sg !== undefined && setupRows) setupRows[+t.dataset.sg].grade = t.value;
    else if (t.dataset.kname) { const v = t.value.trim().slice(0, 20); if (v) store.updateKid(t.dataset.kname, k => { k.name = v; }); }
    else if (t.dataset.kgrade) { const k = store.updateKid(t.dataset.kgrade, kk => { kk.grade = t.value; }); render(); if (Array.isArray(k.math.on)) toast(`${k.name}’s math stays as you set it. Change it in Parents → Math.`); }
    else if (t.dataset.psubj !== undefined) { store.family.plan.template[+t.dataset.psubj].subject = t.value || null; store.save(); }
    else if (t.id === 'curric') { store.family.settings.curriculum = t.value; store.save(); toast('Saved.'); }
    else if (t.id === 'mgoal') { store.family.settings.meterGoal = Math.max(10, Math.min(500, +t.value || 60)); store.save(); }
    else if (t.id === 'file') { const files = [...(t.files || [])].slice(0, 6); t.value = ''; if (files.length) scanFiles(files); }
    else if (t.id === 'importfile') {
      const f = t.files && t.files[0]; t.value = ''; if (!f) return;
      f.text().then(text => {
        let j; try { j = JSON.parse(text); } catch { return toast('That file isn’t a backup.'); }
        const fam = j && (j.family || j); if (!fam || !Array.isArray(fam.kids)) return toast('That file isn’t a Spellfall Homeschool backup.');
        const cards = fam.kids.reduce((a, k) => a + ((k.flashcards && k.flashcards.decks) || []).reduce((b, d) => b + d.cards.length, 0), 0);
        confirmBox(`Restore this backup? It has ${fam.kids.length} child${fam.kids.length === 1 ? '' : 'ren'} (${fam.kids.map(k => k.name).join(', ')}) and ${cards} flashcards. It replaces everything on this device.`, 'Restore', () => { try { store.importJSON(text); toast('Backup restored.'); go('#/'); } catch (err) { toast(err.message); } });
      });
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

  /* press-and-hold to open parent mode */
  let hold = null;
  function endHold() { if (!hold) return; cancelAnimationFrame(hold.raf); hold.b.style.setProperty('--p', 0); hold = null; }
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('[data-hold]'); if (!b) return;
    e.preventDefault(); endHold(); const t0 = performance.now();
    const step = () => { const k = Math.min(1, (performance.now() - t0) / 1100); b.style.setProperty('--p', k); if (k >= 1) { endHold(); b.dataset.opened = '1'; if (b.dataset.hold === 'practice') { S.welcome.held = true; const m = $('#w-held'); if (m) m.hidden = false; } else openParent(); } else if (hold) hold.raf = requestAnimationFrame(step); };
    hold = { b, raf: requestAnimationFrame(step) };
  });
  ['pointerup', 'pointercancel'].forEach(ev => document.addEventListener(ev, endHold, true));
  document.addEventListener('click', e => { const b = e.target.closest('[data-hold]'); if (!b) return; if (b.dataset.opened) { delete b.dataset.opened; return; } toast('Parents: press and hold for a second.'); });

  window.__hub = { S, store }; // handy for debugging from the browser console
  render();
})();
