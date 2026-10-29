/* Homeschool Hub core: shared by the hub (index.html) and the Spellfall game (apps/spellfall).
   Classic script on purpose so the single-file Spellfall game can use it without modules.
   Everything here lives on window.Hub. All storage goes through Hub.store. */
(function () {
  'use strict';
  const VERSION = '0.9.0'; // shown in the footer; becomes 1.0.0 at the public release tag
  const FEEDBACK_EMAIL = 'spellfallsupport@gmail.com';
  const SCHEMA = 1;
  const META_KEY = 'hub:meta';
  const SECRET_KEY = 'hub:secret';
  const OLD_SPELLFALL_KEY = 'spellfall.players.v1';

  const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const clone = x => JSON.parse(JSON.stringify(x));
  const today = (d = new Date()) => { const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0, 10); };
  const mondayOf = (d = new Date()) => { const m = new Date(d); m.setHours(0, 0, 0, 0); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return today(m); };
  // the test copy at /spellfall-preview/ shares the live site's origin, so it keeps its data under its own names
  const NS = /\/spellfall-preview\//.test(location.pathname) ? 'preview:' : '';
  const read = k => { try { return JSON.parse(localStorage.getItem(NS + k) || 'null'); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(NS + k, JSON.stringify(v)); return true; } catch { return false; } };

  const DEFAULT_PLAN = [
    { id: 'spelling', label: 'Spelling game', subject: 'spelling' },
    { id: 'flashcards', label: 'Flashcards', subject: 'flashcards' },
    { id: 'math', label: 'Math facts', subject: 'math' },
    { id: 'typing', label: 'Typing lesson', subject: 'typing' },
    { id: 'reading', label: 'Read aloud 15 minutes', subject: null }
  ];

  function blankFamily() {
    return { id: uid('f'), schema: SCHEMA, name: 'Our family', createdAt: Date.now(),
      settings: { pinHash: null, pinSalt: null, meterGoal: 60 },
      plan: { template: clone(DEFAULT_PLAN), done: {} },
      kids: [] };
  }

  /* migrations: index i upgrades schema i -> i+1 */
  const MIGRATIONS = [];

  const listeners = new Set();
  const store = {
    family: null,
    load() {
      let meta = read(META_KEY);
      let fam = meta && meta.familyId ? read('hub:v1:' + meta.familyId) : null;
      if (!fam) {
        fam = blankFamily();
        // bring over kids from the original single-file Spellfall if this browser had it
        const old = read(OLD_SPELLFALL_KEY);
        if (Array.isArray(old)) old.forEach((p, i) => fam.kids.push(kidFromSpellfall(p, i)));
        meta = { familyId: fam.id, schema: SCHEMA };
        write(META_KEY, meta);
        write('hub:v1:' + fam.id, fam);
      }
      while ((fam.schema || 0) < SCHEMA) { const m = MIGRATIONS[fam.schema || 0]; if (m) m(fam); fam.schema = (fam.schema || 0) + 1; }
      fam.kids = (fam.kids || []).map(normalizeKid);
      fam.plan = fam.plan || { template: clone(DEFAULT_PLAN), done: {} };
      fam.settings = { meterGoal: 60, ...(fam.settings || {}) };
      this.family = fam;
      try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch {}
      return fam;
    },
    save() {
      const f = this.family; if (!f) return false;
      f.updatedAt = Date.now();
      const ok = write('hub:v1:' + f.id, f);
      listeners.forEach(fn => { try { fn(f); } catch {} });
      return ok;
    },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    kids() { return (this.family.kids || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.createdAt || 0) - (b.createdAt || 0)); },
    kid(id) { return this.family.kids.find(k => k.id === id) || null; },
    addKid(name, grade, avatar, color) {
      const order = this.family.kids.reduce((m, k) => Math.max(m, (k.order ?? 0) + 1), 0);
      const k = normalizeKid({ id: uid('p'), name, grade, avatar, color, order, createdAt: Date.now() });
      this.family.kids.push(k); this.save(); return k;
    },
    removeKid(id) { this.family.kids = this.family.kids.filter(k => k.id !== id); this.save(); },
    updateKid(id, fn) { const k = this.kid(id); if (!k) return null; fn(k); this.save(); return k; },
    /* activity log: append-only, capped, feeds Today and the dashboard */
    log(kidId, entry) {
      const k = this.kid(kidId); if (!k) return;
      k.log = [{ at: Date.now(), date: today(), ...entry }, ...(k.log || [])].slice(0, 400);
      this.bumpMeter(entry.points || 0);
      this.save();
    },
    bumpMeter(n) {
      const f = this.family, wk = mondayOf();
      if (!f.meter || f.meter.week !== wk) f.meter = { week: wk, count: 0 };
      f.meter.count += Math.max(0, Math.round(n));
    },
    meter() { const f = this.family, wk = mondayOf(); return { count: f.meter && f.meter.week === wk ? f.meter.count : 0, goal: f.settings.meterGoal || 60 }; },
    exportJSON() { return JSON.stringify({ app: 'homeschool-hub', exportedAt: new Date().toISOString(), family: this.family }, null, 2); },
    importJSON(text) {
      const j = JSON.parse(text), f = j && (j.family || j);
      if (!f || !Array.isArray(f.kids)) throw new Error('That file is not a Homeschool Hub backup.');
      f.id = f.id || uid('f'); f.schema = f.schema || 1;
      write(META_KEY, { familyId: f.id, schema: SCHEMA }); write('hub:v1:' + f.id, f);
      this.load(); this.save(); return this.family;
    },
    secret() { return { apiKey: '', model: 'claude-sonnet-5-5', ...(read(SECRET_KEY) || {}) }; },
    setSecret(s) { write(SECRET_KEY, { ...this.secret(), ...s }); },
    clearSecret() { try { localStorage.removeItem(NS + SECRET_KEY); } catch {} }
  };

  const ID_FIELDS = ['id', 'name', 'grade', 'avatar', 'color', 'order', 'createdAt'];
  function kidFromSpellfall(p, i) {
    const k = { spellfall: {} };
    for (const [key, v] of Object.entries(p || {})) { if (ID_FIELDS.includes(key)) k[key] = v; else k.spellfall[key] = v; }
    k.order = k.order ?? i;
    return normalizeKid(k);
  }
  function normalizeKid(k) {
    return { id: k.id || uid('p'), name: k.name || 'Learner', grade: k.grade || '1st', avatar: k.avatar || '🚀', color: k.color || 'yellow',
      order: k.order ?? 0, createdAt: k.createdAt || Date.now(),
      spellfall: k.spellfall || {}, flashcards: { decks: [], ...(k.flashcards || {}) },
      math: { skills: {}, best: {}, pics: 0, ...(k.math || {}) }, phonics: { best: {}, ...(k.phonics || {}) }, log: k.log || [] };
  }
  /* Spellfall adapter: Spellfall keeps its own "player" shape; we store it under kid.spellfall */
  store.spellfallPlayers = function () { return this.kids().map(k => ({ ...clone(k.spellfall || {}), id: k.id, name: k.name, grade: k.grade, avatar: k.avatar, color: k.color, order: k.order, createdAt: k.createdAt })); };
  store.saveSpellfallPlayers = function (players) {
    const fam = this.family;
    for (const p of players) {
      let k = fam.kids.find(x => x.id === p.id);
      const before = k ? (k.spellfall.games || []).length : 0;
      if (!k) { k = kidFromSpellfall(p, fam.kids.length); fam.kids.push(k); }
      const rest = {}; for (const [key, v] of Object.entries(p)) { if (ID_FIELDS.includes(key)) k[key] = v; else rest[key] = v; }
      k.spellfall = rest;
      // a new game was recorded: log it for Today + the family meter
      const games = rest.games || [];
      if (games.length > before || (games[0] && games[0].at > ((k.log.find(e => e.src === 'spellfall') || {}).at || 0))) {
        const g = games[0];
        if (g && !k.log.some(e => e.src === 'spellfall' && e.gameAt === g.at)) {
          k.log = [{ at: Date.now(), date: today(), src: 'spellfall', gameAt: g.at, subject: g.mode === 'type' ? 'typing' : 'spelling', score: g.score, points: g.mode === 'type' ? 3 : Math.min(10, (g.words || 0)), detail: g.mode }, ...k.log].slice(0, 400);
          store.bumpMeter(g.mode === 'type' ? 3 : Math.min(10, g.words || 0));
        }
      }
    }
    this.save();
  };

  /* ---------- AI (bring your own Anthropic key, called straight from the browser) ---------- */
  const ai = {
    available() { return !!store.secret().apiKey; },
    async toImageBlock(file) {
      // downscale on a canvas: cheaper, faster, and strips location metadata from phone photos
      const bmp = await createImageBitmap(file);
      const s = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      const data = c.toDataURL('image/jpeg', 0.85).split(',')[1];
      return { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } };
    },
    /* returns parsed JSON from the model. images: File|Blob or array of them */
    async json(prompt, { images, signal, maxTokens = 2000 } = {}) {
      const { apiKey, model } = store.secret();
      if (!apiKey) { const e = new Error('No API key set'); e.code = 'no_key'; throw e; }
      const list = images ? (Array.isArray(images) ? images : [images]) : [];
      const content = [];
      for (const f of list) content.push(await this.toImageBlock(f));
      content.push({ type: 'text', text: prompt + '\n\nReply with only the JSON, no other text.' });
      let res;
      try {
        res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', signal,
          headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({ model: model || 'claude-sonnet-5-5', max_tokens: maxTokens, messages: [{ role: 'user', content }] })
        });
      } catch (e) { if (e && e.name === 'AbortError') { const x = new Error('cancelled'); x.code = 'cancelled'; throw x; } const x = new Error('network'); x.code = 'network'; throw x; }
      if (!res.ok) {
        let msg = ''; try { const j = await res.json(); msg = (j.error && j.error.message) || ''; } catch {}
        const e = new Error(msg || ('HTTP ' + res.status));
        e.code = res.status === 401 ? 'bad_key' : res.status === 429 ? 'rate_limited' : res.status === 529 ? 'overloaded' : res.status === 404 ? 'bad_model' : res.status === 400 ? 'bad_request' : 'http_' + res.status;
        throw e;
      }
      const j = await res.json();
      const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
      const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!m) { const e = new Error('No JSON in reply'); e.code = 'invalid_json'; throw e; }
      try { return JSON.parse(m[0]); } catch { const e = new Error('Bad JSON'); e.code = 'invalid_json'; throw e; }
    },
    errorText(e) {
      const c = e && e.code;
      return ({
        no_key: 'Add your Claude API key in Parent settings to scan photos.',
        bad_key: 'The API key was rejected. Check it in Parent settings.',
        rate_limited: 'Too many requests right now. Wait a minute and try again.',
        overloaded: 'Claude is busy right now. Try again in a minute.',
        bad_model: 'The model name in Parent settings was not found. Try the default.',
        bad_request: 'That photo could not be sent. Try a smaller or clearer picture.',
        invalid_json: 'The answer came back garbled. Try the scan again.',
        network: 'Could not reach Claude. Check the internet connection.',
        cancelled: 'Stopped.'
      })[c] || ('Something went wrong reading the photo' + (e && e.message ? ': ' + e.message : '.'));
    }
  };

  /* ---------- speech ---------- */
  const speech = {
    ok: typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined',
    voice: null,
    pick() { if (!this.ok) return; try { const vs = speechSynthesis.getVoices() || []; const us = vs.filter(v => /^en[-_]US/i.test(v.lang)); this.voice = us.find(v => /Samantha|Ava|Allison|Susan|Google US English/i.test(v.name)) || us[0] || vs.find(v => /^en/i.test(v.lang)) || null; } catch {} },
    say(text, { rate = 0.9 } = {}) {
      if (!this.ok || !text) return;
      try { speechSynthesis.cancel(); if (!this.voice) this.pick(); const u = new SpeechSynthesisUtterance(text); if (this.voice) u.voice = this.voice; u.lang = this.voice ? this.voice.lang : 'en-US'; u.rate = rate; u.pitch = 1.05; speechSynthesis.speak(u); } catch {}
    }
  };
  if (speech.ok) { try { speechSynthesis.onvoiceschanged = () => speech.pick(); speech.pick(); } catch {} }

  /* ---------- PIN (a kid deterrent, not real security) ---------- */
  async function sha(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  const pin = {
    isSet() { return !!store.family.settings.pinHash; },
    async set(p) { const salt = uid('s'); store.family.settings.pinSalt = salt; store.family.settings.pinHash = await sha(salt + p); store.save(); },
    async check(p) { const s = store.family.settings; if (!s.pinHash) return true; return (await sha(s.pinSalt + p)) === s.pinHash; },
    clear() { store.family.settings.pinHash = null; store.family.settings.pinSalt = null; store.save(); }
  };

  window.Hub = { store, ai, speech, pin, uid, clone, today, mondayOf, VERSION, FEEDBACK_EMAIL };
})();
