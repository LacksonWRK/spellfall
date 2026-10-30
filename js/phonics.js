/* Phonics: three short games for K-2nd. Sound Sort (tap the bin a word's sound belongs in),
   Blend Builder (hear a word, tap letter tiles to build it), Magic-e Door (cap + e = cape).
   Words are original, grouped by the same patterns as the built-in spelling lists.
   hub.js routes #/kid/<id>/phonics[/<game>] here and passes its helpers in ctx. */
(function () {
  'use strict';

  const SORTS = [
    { title: 'ee or ea?', tip: 'Both spell the long e sound.', bins: ['ee', 'ea'], words: { ee: ['tree', 'feet', 'seed', 'sheep', 'green', 'sleep', 'queen', 'bee'], ea: ['seat', 'leaf', 'team', 'beach', 'meat', 'peach', 'read', 'clean'] } },
    { title: 'ai or ay?', tip: 'Both spell the long a sound.', bins: ['ai', 'ay'], words: { ai: ['rain', 'tail', 'paint', 'snail', 'train', 'mail', 'wait', 'chain'], ay: ['day', 'play', 'tray', 'stay', 'clay', 'gray', 'hay', 'spray'] } },
    { title: 'oa or ow?', tip: 'Both spell the long o sound.', bins: ['oa', 'ow'], words: { oa: ['boat', 'coat', 'road', 'soap', 'goat', 'toad', 'loaf', 'float'], ow: ['snow', 'grow', 'show', 'slow', 'bowl', 'throw', 'crow', 'blow'] } },
    { title: 'sh, ch or th?', tip: 'Two letters, one sound.', bins: ['sh', 'ch', 'th'], words: { sh: ['ship', 'shop', 'fish', 'dish', 'shell', 'wash'], ch: ['chin', 'chop', 'much', 'lunch', 'chip', 'bench'], th: ['this', 'that', 'bath', 'with', 'thin', 'moth'] } },
    { title: 'ar or or?', tip: 'The r changes the vowel sound.', bins: ['ar', 'or'], words: { ar: ['car', 'star', 'park', 'farm', 'barn', 'shark', 'jar', 'yard'], or: ['horn', 'fork', 'corn', 'storm', 'port', 'short', 'sport', 'north'] } },
    { title: 'Short a or long a?', tip: 'Listen: c-a-t or c-a-ke?', bins: ['short a', 'long a'], words: { 'short a': ['cat', 'map', 'bag', 'hand', 'clap', 'flag', 'ram', 'pan'], 'long a': ['cake', 'game', 'name', 'rain', 'day', 'plate', 'snake', 'wave'] } }
  ];
  const BLENDS = {
    cvc: ['cat', 'dog', 'sun', 'pig', 'bed', 'hop', 'map', 'cup', 'fan', 'web', 'log', 'hut'],
    blend: ['frog', 'stop', 'ship', 'chin', 'hand', 'jump', 'drum', 'flag', 'swim', 'duck', 'milk', 'crab'],
    long: ['storm', 'train', 'shark', 'cloud', 'plant', 'spring', 'brush', 'sheep', 'snail', 'thumb', 'crown', 'beach']
  };
  const MAGIC = [['cap', 'cape'], ['kit', 'kite'], ['hop', 'hope'], ['cut', 'cute'], ['tap', 'tape'], ['pin', 'pine'], ['not', 'note'], ['tub', 'tube'], ['rob', 'robe'], ['mad', 'made'], ['hid', 'hide'], ['cub', 'cube'], ['bit', 'bite'], ['rid', 'ride'], ['can', 'cane'], ['dim', 'dime']];
  const GAMES = [
    { id: 'sort', icon: '🗑️', name: 'Sound Sort', sub: 'Drop each word in the right sound bin' },
    { id: 'blend', icon: '🧱', name: 'Blend Builder', sub: 'Hear a word, build it with letter tiles' },
    { id: 'magic', icon: '🚪', name: 'Magic-e Door', sub: 'Add an e and the word changes' }
  ];
  const ROUND = 8, RIGHT_MS = 1000, SHOWN_MS = 1800; // how long the Correct stamp, or a shown answer, stays up
  const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = a => a[Math.floor(Math.random() * a.length)];

  let G = null, X = null, timer = 0; // G = current round state, X = hub helpers

  function stop() { clearTimeout(timer); G = null; }

  function render(ctx, k, game) {
    X = ctx;
    if (!game || !GAMES.some(g => g.id === game)) { stop(); return menu(k); }
    if (!G || G.kidId !== k.id || G.game !== game) start(k, game);
    draw();
  }

  function menu(k) {
    const best = (k.phonics || {}).best || {};
    X.app.innerHTML = `<div class="wrap narrow">
      <a class="btn ghost small back" href="#/kid/${k.id}">← ${X.esc(k.name)}</a>
      <h1 class="h1">Phonics</h1>
      <p class="muted">Pick a game. Each one is ${ROUND} words.</p>
      <div class="ph-menu">${GAMES.map(g => `<a class="gcard ph-game" href="#/kid/${k.id}/phonics/${g.id}"><span class="ic" aria-hidden="true">${g.icon}</span><span><b>${g.name}</b><small>${g.sub}${best[g.id] ? ` · best ${best[g.id]}/${ROUND}` : ''}</small></span></a>`).join('')}</div>
    </div>`;
  }

  function start(k, game) {
    clearTimeout(timer);
    G = { kidId: k.id, game, i: 0, right: 0, tries: 0, done: false, items: [] };
    if (game === 'sort') {
      const s = pick(SORTS); G.sort = s;
      G.items = shuffle(s.bins.flatMap(b => s.words[b].map(w => ({ w, bin: b })))).slice(0, ROUND);
    } else if (game === 'blend') {
      const lvl = k.grade === 'K' ? 'cvc' : k.grade === '1st' ? 'blend' : 'long';
      G.items = shuffle(BLENDS[lvl].slice()).slice(0, ROUND).map(w => ({ w, tiles: tilesFor(w), built: [] }));
    } else {
      G.items = shuffle(MAGIC.slice()).slice(0, ROUND).map(([a, b]) => ({ a, b, opened: false, ask: Math.random() < .5 ? a : b }));
    }
  }
  function tilesFor(w) {
    const letters = 'abcdefghijklmnoprstuvwy'.split('').filter(c => !w.includes(c));
    return shuffle([...w.split(''), pick(letters), pick(letters)].map((c, i) => ({ c, id: i, used: false })));
  }

  function header(k, title) {
    return `<div class="spread"><a class="btn ghost small" href="#/kid/${k.id}/phonics">← Phonics</a><span class="fine">${title} · ${Math.min(G.i + 1, ROUND)} of ${ROUND}</span></div>
      <div class="pbar"><i style="width:${Math.round(G.i / ROUND * 100)}%"></i></div>`;
  }

  function draw() {
    const k = X.store.kid(G.kidId); if (!k) return;
    if (G.done) return finish(k);
    const it = G.items[G.i];
    if (G.game === 'sort') {
      X.app.innerHTML = `<div class="wrap narrow">${header(k, 'Sound Sort')}
        <h1 class="h2 center">${X.esc(G.sort.title)}</h1><p class="muted center">${X.esc(G.sort.tip)} Tap the word to hear it, then tap its bin.</p>
        <div class="ph-stage"><button class="ph-word ${RM ? '' : 'falling'}" data-ph="hear" aria-label="${X.esc(it.w)}. Tap to hear it.">${X.esc(it.w)}</button></div>
        <div class="ph-bins">${G.sort.bins.map(b => `<button class="ph-bin" data-ph="bin" data-v="${X.esc(b)}">${X.esc(b)}</button>`).join('')}</div>
        <p class="fine center" id="ph-msg" aria-live="polite">${G.tries ? 'Not that one. Listen again and try another bin.' : ''}</p>
      </div>`;
      if (!G.spoke) { G.spoke = true; X.speech.say(it.w); }
    } else if (G.game === 'blend') {
      const slots = it.w.split('').map((_, n) => it.built[n] ? `<button class="ph-slot full" data-ph="unslot" data-n="${n}">${X.esc(it.built[n].c)}</button>` : '<span class="ph-slot"></span>').join('');
      X.app.innerHTML = `<div class="wrap narrow">${header(k, 'Blend Builder')}
        <h1 class="h2 center">Build the word you hear</h1>
        <div class="row" style="justify-content:center"><button class="btn primary" data-ph="hear">🔊 Hear it</button></div>
        <div class="ph-slots" aria-label="Your word">${slots}</div>
        <div class="ph-tiles">${it.tiles.map(t => `<button class="ph-tile" data-ph="tile" data-id="${t.id}" ${t.used ? 'disabled' : ''}>${X.esc(t.c)}</button>`).join('')}</div>
        <p class="fine center" id="ph-msg" aria-live="polite">${G.tries ? 'Almost! Tap a letter in the word to take it back.' : 'Tap the letters in order.'}</p>
      </div>`;
      if (!G.spoke) { G.spoke = true; X.speech.say(it.w); }
    } else {
      X.app.innerHTML = `<div class="wrap narrow">${header(k, 'Magic-e Door')}
        ${!it.opened ? `<h1 class="h2 center">Add the magic e</h1>
          <div class="ph-door"><span class="ph-doorword">${X.esc(it.a)}<span class="ph-e" aria-hidden="true">_</span></span></div>
          <div class="row" style="justify-content:center"><button class="btn primary big" data-ph="open">+ e</button></div>
          <p class="fine center">The e is silent, but it makes the vowel say its name.</p>`
        : `<h1 class="h2 center">${X.esc(it.a)} → ${X.esc(it.b)}</h1>
          <p class="muted center">Which word did you hear?</p>
          <div class="row" style="justify-content:center"><button class="btn" data-ph="hear">🔊 Hear it again</button></div>
          <div class="ph-bins">${shuffle([it.a, it.b]).map(w => `<button class="ph-bin" data-ph="pickw" data-v="${X.esc(w)}">${X.esc(w)}</button>`).join('')}</div>
          <p class="fine center" id="ph-msg" aria-live="polite">${G.tries ? 'Listen again: does the vowel say its name?' : ''}</p>`}
      </div>`;
    }
  }

  function next(firstTry, wait) {
    if (firstTry) G.right++;
    G.i++; G.tries = 0; G.spoke = false; G.busy = true;
    if (G.i >= G.items.length) G.done = true;
    timer = setTimeout(() => { G.busy = false; draw(); }, wait);
  }
  function correct(host, firstTry) { window.Hub.stamp(host, RIGHT_MS); next(firstTry, RIGHT_MS); }
  function msg(t) { const m = document.getElementById('ph-msg'); if (m) m.textContent = t; }

  function finish(k) {
    const stars = G.right >= ROUND ? 3 : G.right >= ROUND - 2 ? 2 : 1, name = GAMES.find(g => g.id === G.game).name;
    if (!G.logged) {
      G.logged = true;
      X.store.updateKid(k.id, kk => { kk.phonics = kk.phonics || { best: {} }; kk.phonics.best = kk.phonics.best || {}; kk.phonics.best[G.game] = Math.max(kk.phonics.best[G.game] || 0, G.right); });
      X.store.log(k.id, { subject: 'phonics', game: G.game, score: G.right, total: ROUND, points: Math.min(10, G.right + 2) });
      if (stars === 3) X.confetti();
    }
    X.app.innerHTML = `<div class="wrap narrow">
      <h1 class="h1 center">${stars === 3 ? `Every word, ${X.esc(k.name)}!` : `Nice work, ${X.esc(k.name)}!`}</h1>
      <div class="stars-big">${X.starRow(stars)}</div>
      <p class="muted center">${name}: ${G.right} of ${ROUND} right on the first try</p>
      <div class="row" style="justify-content:center"><button class="btn primary big" data-ph="again">Again</button><a class="btn ghost" href="#/kid/${k.id}/phonics">Other games</a><a class="btn ghost" href="#/kid/${k.id}">Done</a></div>
    </div>`;
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-ph]'); if (!b || !G || G.busy || G.done && b.dataset.ph !== 'again') return;
    const it = G.items[G.i], a = b.dataset.ph;
    if (a === 'again') { const k = X.store.kid(G.kidId); start(k, G.game); return draw(); }
    if (a === 'hear') return X.speech.say(G.game === 'magic' ? it.ask : it.w);
    if (a === 'bin') {
      if (b.dataset.v === it.bin) { b.classList.add('ok'); X.speech.say(it.w); msg(it.w + ' goes with ' + it.bin + '.'); $$('[data-ph=bin]').forEach(x => { x.disabled = true; }); return correct(document.querySelector('.ph-stage'), G.tries === 0); }
      G.tries++; b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad');
      if (G.tries >= 2) { msg(`${it.w} goes with ${it.bin}.`); $$('[data-ph=bin]').forEach(x => { x.disabled = true; if (x.dataset.v === it.bin) x.classList.add('ok'); }); return next(false, SHOWN_MS); }
      return msg('Not that one. Listen again and try another bin.');
    }
    if (a === 'tile') {
      const t = it.tiles.find(x => x.id === +b.dataset.id); if (!t || t.used || it.built.length >= it.w.length) return;
      t.used = true; it.built.push(t); draw();
      if (it.built.length === it.w.length) {
        if (it.built.map(x => x.c).join('') === it.w) { X.speech.say(it.w); msg('You built ' + it.w + '.'); $$('.ph-slot').forEach(s => s.classList.add('ok')); return correct(document.querySelector('.ph-slots'), G.tries === 0); }
        G.tries++; msg(G.tries >= 2 ? `It's ${it.w.split('').join('-')}. Tap a letter to take it back.` : 'Almost! Tap a letter in the word to take it back.');
        $$('.ph-slot.full').forEach(s => { s.classList.remove('bad'); void s.offsetWidth; s.classList.add('bad'); });
      }
      return;
    }
    if (a === 'unslot') { const n = +b.dataset.n, t = it.built[n]; if (!t) return; it.built.splice(n, 1); t.used = false; return draw(); }
    if (a === 'open') { it.opened = true; X.speech.say(`${it.a}. Add the magic e. ${it.b}.`, { rate: .8 }); draw(); setTimeout(() => { if (G && G.items[G.i] === it) X.speech.say(it.ask, { rate: .85 }); }, 3200); return; }
    if (a === 'pickw') {
      if (b.dataset.v === it.ask) { b.classList.add('ok'); msg('It was ' + it.ask + '.'); $$('[data-ph=pickw]').forEach(x => { x.disabled = true; }); return correct(document.querySelector('.ph-bins'), G.tries === 0); }
      G.tries++; b.classList.add('bad'); X.speech.say(it.ask, { rate: .8 });
      if (G.tries >= 2) { msg(`It was ${it.ask}.`); $$('[data-ph=pickw]').forEach(x => { x.disabled = true; if (x.dataset.v === it.ask) x.classList.add('ok'); }); return next(false, SHOWN_MS); }
      return msg('Listen again: does the vowel say its name?');
    }
  });
  const $$ = s => [...document.querySelectorAll(s)];

  window.HubPhonics = { render, stop, GAMES };
})();
