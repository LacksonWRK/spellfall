/* Spell-a-Rocket: every word spelled right adds fuel (core.js). 25 fuel is one tank and tanks stack; a
   launch needs one full tank and burns everything saved, so saving up flies higher.
   The flight is a little arcade game: steer with a finger or the arrow keys, catch small rockets for
   more fuel, and get bumped slower by what lives up there. Nothing ever ends a run early. Height is
   the score and the best one is the record.
   step() is the game with no drawing, so simulate() can fly it without a screen (reduced motion uses
   that). Everything after it is drawing. World units: a screen is about 1000 tall, s is the distance
   climbed, and LADDER turns s into real metres. hub.js routes #/kid/<id>/rocket here. */
(function () {
  'use strict';

  const TANK = window.Hub.ROCKET_TANK, MAX_TANKS = window.Hub.ROCKET_MAX / TANK;
  const BURN = 18, CRUISE = 600, GRAVITY = 330;  // seconds of thrust per tank, units/s, units/s²
  const CATCH_FUEL = 1.2, BUMP_SPEED = .55, BUMP_FUEL = .7; // seconds gained, speed kept, seconds lost
  const CATCH_R = 105, PULL_R = 190;             // generous on purpose: a 6-year-old has to land these
  const PAIRS = [92, 150, 208];                  // booster pairs: every extra tank straps one more pair onto the rocket
  const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const TAU = Math.PI * 2, R = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* the climb: distance to real height. Between two stops height grows by a steady ratio. */
  const LADDER = [
    { s: 0, m: 0 },
    { s: 900, m: 150, name: 'Over the treetops' },
    { s: 2600, m: 2000, name: 'In the clouds', fact: 'Clouds float about 2 km up' },
    { s: 6000, m: 11000, name: 'Jet planes', fact: 'Airliners cruise near 11 km' },
    { s: 11000, m: 5e4, name: 'The sky turns dark', fact: 'The air is getting very thin' },
    { s: 15000, m: 1e5, name: 'Edge of space!', fact: '100 km up. You are an astronaut!' },
    { s: 22000, m: 4e5, name: 'Space station', fact: 'It circles Earth 400 km up' },
    { s: 32000, m: 3.6e7, name: 'Satellite height', fact: 'Weather satellites ride 36,000 km up' },
    { s: 46000, m: 3.844e8, name: 'The Moon!', fact: '384,400 km from home' },
    { s: 70000, m: 2.25e11, name: 'Mars!', fact: 'The red planet' },
    { s: 100000, m: 7.78e11, name: 'Jupiter!', fact: 'The biggest planet of all' },
    { s: 135000, m: 1.43e12, name: 'Saturn!', fact: 'Its rings are ice and rock' },
    { s: 175000, m: 4.5e12, name: 'Neptune!', fact: 'The farthest planet from the Sun' },
    { s: 240000, m: 5.9e12, name: 'Past Pluto!', fact: 'Almost nothing from Earth has come this far' },
    { s: 300000, m: 2.5e13, name: 'Deep space', fact: 'Voyager 1 is out here somewhere' }
  ];
  const END_RATE = 1e8; // metres per unit past the last stop
  function heightAt(s) {
    for (let i = 1; i < LADDER.length; i++) {
      const a = LADDER[i - 1], b = LADDER[i];
      if (s < b.s) { const t = (s - a.s) / (b.s - a.s); return a.m ? a.m * (b.m / a.m) ** t : b.m * t; }
    }
    const z = LADDER[LADDER.length - 1]; return z.m + (s - z.s) * END_RATE;
  }
  function distAt(m) {
    for (let i = 1; i < LADDER.length; i++) {
      const a = LADDER[i - 1], b = LADDER[i];
      if (m < b.m) return a.s + (b.s - a.s) * (a.m ? Math.log(m / a.m) / Math.log(b.m / a.m) : m / b.m);
    }
    const z = LADDER[LADDER.length - 1]; return z.s + (m - z.m) / END_RATE;
  }
  function fmt(m) {
    m = Math.max(0, Math.round(m));
    const n = (v, d) => v.toLocaleString('en-US', { maximumFractionDigits: d });
    if (m < 1000) return n(m, 0) + ' m';
    if (m < 1e5) return n(m / 1000, 1) + ' km';
    if (m < 1e9) return n(m / 1000, 0) + ' km';
    if (m < 1e12) return n(m / 1e9, 1) + ' million km';
    return n(m / 1e12, 1) + ' billion km';
  }

  /* what is up there. r is the bump radius, a little smaller than the drawing so near misses are misses. */
  const HAZ = {
    bird: { from: 300, to: 7500, r: 44, vx: 210, say: 'Tweet!' },
    cloud: { from: 2600, to: 12000, r: 64, vx: 40, say: 'Poof!' },
    plane: { from: 5800, to: 14000, r: 48, vx: 400, say: 'Beep!' },
    sat: { from: 14000, to: 48000, r: 52, vx: 70, spin: .7, say: 'Bonk!' },
    rock: { from: 19000, to: Infinity, r: 50, vx: 170, spin: 1.6, drop: 130, say: 'Bonk!' },
    ufo: { from: 44000, to: Infinity, r: 52, vx: 240, say: 'Hello!' }
  };

  /* ---------- the game, no drawing ---------- */
  function flight(fuel, power, best) {
    const tanks = Math.max(1, fuel / TANK), burn = BURN * tanks ** .8 + 3 * (power - .6) / .4, cruise = CRUISE * tanks ** .12;
    return { tanks, burn, top: burn, perTank: burn / tanks, cruise, v: cruise * power * 1.25, s: 0, x: 0, tx: 0, t: 0, ahead: 760, px: 340, items: [],
      nextFuel: 1100, nextHaz: 1500, kick: 0, safe: 0, wob: 0, boosters: Math.min(3, Math.floor(tanks) - 1), mile: 0, caught: 0, bumps: 0, power,
      bestS: best ? distAt(best) : 0, beat: !best, warned: false, rescued: false, over: false, peak: 0 };
  }
  function addHazard(f, s) {
    const names = Object.keys(HAZ).filter(n => s >= HAZ[n].from && s < HAZ[n].to); if (!names.length) return;
    const t = names[Math.floor(Math.random() * names.length)], h = HAZ[t], dir = Math.random() < .5 ? -1 : 1, vx = dir * R(h.vx * .7, h.vx);
    const land = Math.random() < .15 ? f.x + R(-60, 60) : R(-.86, .86) * f.px, lead = (s - f.s) / Math.max(200, f.v); // where it crosses the rocket's height
    f.items.push({ t, s, x: land - vx * lead, vx, ph: R(0, TAU), spin: h.spin ? R(-1, 1) * h.spin : 0, rot: 0, hit: 0 });
  }
  function step(f, dt, fx) {
    const on = fx || (() => {}); f.t += dt;
    f.safe = Math.max(0, f.safe - dt); f.wob = Math.max(0, f.wob - dt * 1.6); f.kick *= Math.exp(-dt * .8);
    if (f.burn > 0) {
      f.v += (f.cruise + f.kick - f.v) * (1 - Math.exp(-dt * (f.safe ? 1 : 1.8)));
      f.burn = Math.max(0, f.burn - dt);
      if (f.burn === 0) {
        on('empty');
        if (!f.rescued) { f.rescued = true; f.items.push({ t: 'fuel', s: f.s + Math.min(400, f.v * .7), x: clamp(f.x + (f.x > 0 ? -1 : 1) * R(120, 240), -f.px, f.px), vx: 0, ph: 0, rot: 0, hit: 0 }); } // one last-second save per flight
      }
    } else f.v -= GRAVITY * dt;
    if (f.burn < 3.5 && f.burn > 0 && !f.warned) { f.warned = true; on('low'); } else if (f.burn > 6) f.warned = false;
    const left = Math.min(f.boosters, Math.max(0, Math.ceil(f.burn / f.perTank) - 1));
    if (left < f.boosters) { f.boosters = left; f.kick = Math.min(320, f.kick + 140); on('stage'); }
    f.s += Math.max(0, f.v) * dt;
    f.x += (f.tx - f.x) * (1 - Math.exp(-dt * 11));

    while (f.s + f.ahead >= f.nextFuel) { f.items.push({ t: 'fuel', s: f.nextFuel, x: R(-.86, .86) * f.px, vx: 0, ph: R(0, TAU), rot: 0, hit: 0 }); f.nextFuel += f.cruise * R(2.4, 3); }
    while (f.s + f.ahead >= f.nextHaz) { addHazard(f, f.nextHaz); f.nextHaz += f.cruise * R(.95, 1.45); }

    for (let i = f.items.length - 1; i >= 0; i--) {
      const it = f.items[i], h = HAZ[it.t];
      it.x += it.vx * dt; if (it.spin) it.rot += it.spin * dt;
      if (it.hit) { it.hit += dt; it.s += Math.max(0, f.v) * .75 * dt; if (it.hit > 1.5) f.items.splice(i, 1); continue; } // it wanders off rather than breaking
      if (h && h.drop) it.s -= h.drop * dt;
      const dx = it.x - f.x, dy = it.s - (f.s + 30), d = Math.hypot(dx, dy);
      if (it.t === 'fuel') {
        const wide = f.boosters ? PAIRS[f.boosters - 1] * .6 : 0;
        if (d < PULL_R + wide) { const p = 1 - Math.exp(-dt * 7); it.x -= dx * p; it.s -= dy * p; }
        if (d < CATCH_R + wide) {
          f.items.splice(i, 1); f.caught++; f.burn += CATCH_FUEL; f.top = Math.max(f.top, f.burn); f.v += 60; f.kick = Math.min(320, f.kick + 90);
          on('catch', it); continue;
        }
      } else if (!f.safe && d < h.r + 26) {
        f.bumps++; f.v *= BUMP_SPEED; f.burn = Math.max(0, f.burn - BUMP_FUEL); f.safe = 1.3; f.wob = 1; f.kick = 0;
        it.hit = .001; it.vx = (dx < 0 ? -1 : 1) * R(320, 440); it.spin = (it.spin || 0) + R(-2, 2);
        on('bump', it); continue;
      }
      if (it.s < f.s - 900) f.items.splice(i, 1);
    }
    while (LADDER[f.mile + 1] && f.s >= LADDER[f.mile + 1].s) { f.mile++; on('mile', LADDER[f.mile]); }
    if (!f.beat && f.s >= f.bestS) { f.beat = true; on('record'); }
    if (f.burn <= 0 && f.v <= 0) { f.over = true; f.peak = f.s; f.v = 0; }
  }
  /* a pretend player for simulate(): notices each thing with chance `skill`, goes for fuel, dodges the rest */
  function autopilot(f, skill) {
    let go = null, near = 1e9, dodge = null;
    for (const it of f.items) {
      const d = it.s - f.s; if (it.hit || d < -40 || d > 800) continue;
      if (it.ai === undefined) it.ai = Math.random() < skill;
      if (!it.ai) continue;
      if (it.t === 'fuel') { if (d < near) { near = d; go = it; } } else if (d < 320 && Math.abs(it.x - f.x) < 150) dodge = it;
    }
    if (dodge) f.tx = clamp(dodge.x + (dodge.x > f.x ? -200 : 200), -f.px, f.px); else if (go) f.tx = go.x;
  }
  function simulate(fuel, power = .9, skill = .6, best = 0, dt = 1 / 60) {
    const f = flight(fuel, power, best);
    while (!f.over && f.t < 1200) { autopilot(f, skill); step(f, dt); }
    return { f, height: heightAt(f.s), secs: f.t, caught: f.caught, bumps: f.bumps };
  }

  /* ---------- small sounds: quiet, and only after a tap has woken the audio ---------- */
  const snd = {
    ctx: null,
    init() { try { if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) this.ctx = new AC(); } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); } catch {} },
    tone(f0, f1, secs, type = 'triangle', vol = .045, at = 0) {
      const a = this.ctx; if (!a || a.state !== 'running') return;
      try {
        const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + at;
        o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + secs);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0005, t + secs);
        o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + secs + .02);
      } catch {}
    },
    tune(notes, gap = .1) { notes.forEach((n, i) => this.tone(n, n, .22, 'triangle', .04, i * gap)); }
  };

  /* ---------- screen state ---------- */
  let X = null, raf = 0, F = null;
  const V = { c: null, g: null, w: 0, h: 0, k: 1, sharp: 2, slow: 0, board: null, vw: 750, vh: 1000, ry: 640, px: 340, spr: {}, t: 0, last: 0, parts: [], dust: null, keys: {}, color: '#93CBEA', avatar: '🚀' };
  const INK = 'rgba(24,40,32,.82)', CHALK = '#F3F1E7', YELLOW = '#F6D365', PINK = '#F4A3A8', BLUE = '#93CBEA', ORANGE = '#F7B267', GREEN = '#A3E4A8', LILAC = '#C9B6F2';
  const DISPLAY = '"Cabin Sketch","Chalkboard SE","Marker Felt",cursive', BODY = 'Andika,"Avenir Next",system-ui,sans-serif';
  const COLORS = { yellow: YELLOW, blue: BLUE, pink: PINK, green: GREEN, orange: ORANGE, lilac: LILAC };

  function stop() {
    cancelAnimationFrame(raf); raf = 0;
    if (F) bank();
    F = null; V.c = null; V.parts = []; V.keys = {};
  }
  function bank() { // keeps the height flown so far if the child leaves mid-flight
    const f = F && F.fl; if (!f) return;
    const h = Math.round(heightAt(f.peak || f.s)), k = X.store.kid(F.kidId);
    if (k && h > (k.rocket.best || 0)) X.store.updateKid(k.id, kk => { kk.rocket = { ...kk.rocket, best: h }; });
  }

  /* ---------- launch screen ---------- */
  function render(ctx, k) {
    X = ctx; stop();
    const r = { fuel: 0, launches: 0, best: 0, ...(k.rocket || {}) }, tanks = Math.floor(r.fuel / TANK), left = r.fuel % TANK, need = TANK - left, ready = tanks >= 1, full = tanks >= MAX_TANKS;
    const cells = Array.from({ length: Math.max(1, full ? tanks : tanks + 1) }, (_, i) => `<b class="rk-cell"><i style="width:${i < tanks ? 100 : left / TANK * 100}%"></i></b>`).join('');
    const label = !ready ? `${r.fuel} / ${TANK} fuel` : `${tanks} full tank${tanks === 1 ? '' : 's'}${left ? ` + ${left} / ${TANK}` : ''}`;
    const note = full ? 'Every tank is full! Time to launch.' : ready ? `${tanks === 1 ? 'Tank full!' : `${tanks} tanks!`} More tanks fly higher. Launch now, or spell ${need} more for tank ${tanks + 1}.` : `Every word you spell right adds fuel. Spell ${need} more word${need === 1 ? '' : 's'} to fill the tank.`;
    X.app.innerHTML = `<div class="rk-stage">
      <canvas id="rk-sky" class="rk-sky" role="img" aria-label="A rocket on its launch pad"></canvas>
      <a class="btn small rk-back" href="#/kid/${k.id}">← ${X.esc(k.name)}</a>
      <button class="rk-pause" data-rk="pause" aria-label="Pause" hidden><i></i><i></i></button>
      <div class="rk-panel">
        <h1 class="h1">Spell-a-Rocket</h1>
        <div class="rk-gauge" role="img" aria-label="${label}">${cells}<span>⛽ ${label}</span></div>
        <p class="muted">${note}</p>
        <p class="fine">${r.launches ? `Launches: ${r.launches} · Record: ${fmt(r.best)}` : 'No launches yet.'}</p>
      </div>
      <div class="rk-bot">
        ${ready ? `${RM ? '' : '<div class="rk-meter" aria-hidden="true"><i id="rk-needle"></i></div>'}
          <div class="row rk-go"><button class="btn primary big" data-rk="launch">🚀 Launch${tanks > 1 ? ` ${tanks} tanks` : ''}!</button>${full ? '' : `<a class="btn small rk-more" href="${X.spellHref(k)}">✏️ Spell more</a>`}</div>`
        : `<div class="row rk-go"><a class="btn primary big" href="${X.spellHref(k)}">✏️ Go spell</a></div>`}
      </div>
      <div class="rk-over" id="rk-over" hidden></div>
    </div>`;
    V.c = document.getElementById('rk-sky'); V.g = V.c.getContext('2d', { alpha: false }); V.w = V.h = 0; V.spr = {}; V.board = null; V.parts = []; V.t = 0; V.slow = 0; V.last = performance.now();
    V.color = COLORS[k.color] || BLUE; V.avatar = k.avatar || '🚀';
    F = { kidId: k.id, phase: ready ? 'aim' : 'idle', needle: .5, pt: 0, shake: 0, banner: null, hint: r.launches < 3, chain: 0, pairs: Math.min(3, Math.max(0, tanks - 1)), fl: null, paused: false };
    V.c.addEventListener('pointerdown', steer); V.c.addEventListener('pointermove', steer);
    if (document.fonts && document.fonts.load) { document.fonts.load(`700 40px ${DISPLAY}`).catch(() => {}); document.fonts.load(`700 24px ${BODY}`).catch(() => {}); }
    fit();
    if (RM) draw(); else raf = requestAnimationFrame(tick);
  }
  function steer(e) {
    if (!F || !F.fl || F.phase !== 'fly') return;
    const b = V.c.getBoundingClientRect();
    F.fl.tx = clamp((e.clientX - b.left) / b.width * V.vw - V.vw / 2, -V.px, V.px);
  }
  function fit() {
    const c = V.c; if (!c) return;
    const w = c.clientWidth, h = c.clientHeight, dpr = Math.min(V.sharp, window.devicePixelRatio || 1); if (!w || !h) return;
    if (w === V.w && h === V.h) return;
    V.w = w; V.h = h; c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const css = Math.min(h / 1000, w / 640); // a phone held upright sees a taller stretch of sky, not tinier things
    V.k = css * dpr; V.vw = w / css; V.vh = h / css; V.ry = V.vh * .64; V.px = Math.min(V.vw, 1400) / 2 - 70; V.spr = {};
    const f = F && F.fl; if (f) { f.ahead = V.ry + 120; f.px = V.px; f.tx = clamp(f.tx, -V.px, V.px); f.x = clamp(f.x, -V.px, V.px); }
    if (!raf && F) draw();
  }
  window.addEventListener('resize', fit);

  function launch() {
    if (!F || F.phase !== 'aim') return;
    snd.init();
    const off = Math.abs(F.needle - .5) * 2, power = RM || off < .3 ? 1 : 1 - .4 * (off - .3) / .7; // anywhere in the green is a perfect launch
    const k = X.store.kid(F.kidId), fuel = k.rocket.fuel || 0, best = k.rocket.best || 0;
    X.store.updateKid(k.id, kk => { kk.rocket = { ...kk.rocket, fuel: 0, launches: (kk.rocket.launches || 0) + 1 }; });
    document.querySelectorAll('.rk-panel,.rk-bot,.rk-back').forEach(el => el.remove());
    F.prev = best; F.tanksUsed = fuel / TANK;
    if (RM) { const sim = simulate(fuel, power, .6, best); F.fl = sim.f; F.phase = 'done'; land(); F.phase = 'done'; showResult(); draw(); return; }
    F.fl = flight(fuel, power, best); F.fl.ahead = V.ry + 120; F.fl.px = V.px; F.phase = 'ignite'; F.pt = 0;
    document.querySelector('.rk-pause').hidden = false;
    snd.tone(70, 260, 1.1, 'sawtooth', .03);
    F.banner = power >= 1 ? { title: 'Perfect launch!', fact: 'Right in the green', t: 0, life: 1.7 } : { title: 'Liftoff!', t: 0, life: 1.4 };
  }
  function land() {
    const f = F.fl; F.h = Math.round(heightAt(f.peak)); bank();
    F.isBest = F.h > F.prev; F.phase = 'chute'; F.pt = 0; F.dur = 2.6 + Math.min(1.6, f.peak / 40000); f.items = [];
    document.querySelector('.rk-pause').hidden = true;
    F.banner = { title: fmt(F.h), fact: 'Your rocket went this high!', t: 0, life: 2.4 };
    snd.tone(500, 220, .5);
  }
  function showResult() {
    F.phase = 'done';
    const k = X.store.kid(F.kidId), f = F.fl, m = LADDER[f.mile], over = document.getElementById('rk-over');
    const launchNote = f.power >= 1 ? 'Perfect launch, right in the green!' : f.power > .8 ? 'Strong launch.' : 'Tap when the needle is in the green for a stronger start.';
    const used = F.tanksUsed, usedText = (Math.round(used * 10) / 10).toLocaleString('en-US');
    over.hidden = false;
    over.innerHTML = `<div class="card rk-card">
      <p class="h2 center">${F.isBest ? 'New record!' : 'Touchdown!'}</p>
      <p class="rk-height center">${fmt(F.h)}</p>
      <p class="muted center">${m.name ? `You reached: <b>${X.esc(m.name.replace(/!$/, ''))}</b>` : 'A short hop! Catch more little rockets next time.'}</p>
      <div class="rk-stats">
        <div><b>${f.caught}</b><span>rocket${f.caught === 1 ? '' : 's'} caught</span></div>
        <div><b>${f.bumps}</b><span>bump${f.bumps === 1 ? '' : 's'}</span></div>
        <div><b>${usedText}</b><span>tank${used === 1 ? '' : 's'} burned</span></div>
      </div>
      <p class="fine center">${launchNote} ${F.isBest ? (F.prev ? `Old record: ${fmt(F.prev)}.` : '') : `Record: ${fmt(k.rocket.best)}.`}</p>
      <div class="row rk-go"><a class="btn primary" href="${X.spellHref(k)}">✏️ Spell to refuel</a><a class="btn ghost" href="#/kid/${k.id}">Done</a></div>
    </div>`;
    if (F.isBest) { X.confetti(); snd.tune([523, 659, 784, 1047]); }
  }
  function setPaused(on) {
    if (!F || !F.fl || (F.phase !== 'fly' && F.phase !== 'ignite') || F.paused === on) return;
    F.paused = on; const over = document.getElementById('rk-over');
    over.hidden = !on;
    over.innerHTML = on ? `<div class="card rk-card"><p class="h2 center">Paused</p><div class="row rk-go"><button class="btn primary big" data-rk="resume">▶ Keep flying</button><button class="btn ghost" data-rk="land">🪂 Land now</button></div></div>` : '';
    V.last = performance.now();
  }

  /* ---------- the loop ---------- */
  function tick(now) {
    raf = 0; if (!F) return;
    const dt = Math.min(.05, Math.max(0, now - V.last) / 1000); V.last = now;
    if (!F.paused) { V.t += dt; update(dt); }
    if (!F) return;
    V.slow = dt > .024 ? V.slow + 1 : Math.max(0, V.slow - 1);
    if (V.slow > 45 && V.sharp > 1.25) { V.sharp = 1.25; V.w = 0; fit(); } // a slower device gets a softer picture, not a stutter
    draw();
    if (F.phase !== 'done') raf = requestAnimationFrame(tick);
  }
  function update(dt) {
    const f = F.fl;
    F.shake = Math.max(0, F.shake - dt * 2.4);
    if (F.banner && (F.banner.t += dt) > F.banner.life) F.banner = null;
    for (let i = V.parts.length - 1; i >= 0; i--) {
      const p = V.parts[i]; p.age += dt; if (p.age > p.life) { V.parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += (p.vy + (f ? Math.max(0, f.v) * (p.w || 0) : 0)) * dt; p.vy += (p.g || 0) * dt; if (p.spin) p.rot += p.spin * dt;
    }
    if (F.phase === 'aim') {
      F.pt += dt; F.needle = .5 + .5 * Math.sin(F.pt * 2.2);
      const n = document.getElementById('rk-needle'); if (n) n.style.left = (F.needle * 100) + '%';
    }
    if (F.phase === 'aim' || F.phase === 'idle') { if (Math.random() < dt * 3) puff(V.vw / 2 + R(-60, 60), V.ry + 116, .5); return; }
    if (F.phase === 'ignite') {
      F.pt += dt; F.shake = Math.max(F.shake, .35 + F.pt * .5);
      for (let i = 0; i < 3; i++) puff(V.vw / 2 + R(-50, 50), V.ry + 120, 1 + F.pt);
      if (F.pt >= .85) F.phase = 'fly';
      return;
    }
    if (F.phase === 'fly') {
      const dir = (V.keys.r ? 1 : 0) - (V.keys.l ? 1 : 0);
      if (dir) f.tx = clamp(f.tx + dir * 1100 * dt, -V.px, V.px);
      step(f, dt, onFx);
      if (f.burn > 0 && Math.random() < dt * 40) exhaust(f);
      if (f.over) land();
      return;
    }
    if (F.phase === 'chute') {
      F.pt += dt; const u = Math.min(1, F.pt / F.dur);
      f.s = f.peak * (1 - u) ** 3; f.x -= f.x * Math.min(1, dt * 1.6);
      if (u >= 1) { f.s = 0; F.phase = 'down'; F.pt = 0; for (let i = 0; i < 14; i++) puff(V.vw / 2 + f.x + R(-90, 90), V.ry + 118, 1.2); snd.tone(180, 90, .25, 'sine', .05); }
      return;
    }
    if (F.phase === 'down' && (F.pt += dt) > .6) showResult();
  }
  function onFx(name, it) {
    const f = F.fl, sx = it ? V.vw / 2 + it.x : 0, sy = it ? V.ry - (it.s - f.s) : 0;
    if (name === 'catch') {
      F.chain++; for (let i = 0; i < 12; i++) spark(sx, sy, i % 2 ? YELLOW : ORANGE);
      say(sx, sy - 50, F.chain > 2 ? `${F.chain} in a row!` : '+ fuel', YELLOW, 40);
      snd.tone(620 + Math.min(F.chain, 8) * 70, 900 + Math.min(F.chain, 8) * 70, .13);
    } else if (name === 'bump') {
      F.chain = 0; F.shake = .5; const n = it.t;
      say(sx, sy - 60, HAZ[n].say, CHALK, 44);
      if (n === 'bird') for (let i = 0; i < 3; i++) V.parts.push({ img: 'feather', x: sx, y: sy, vx: R(-110, 110), vy: R(-120, -20), g: 90, w: .3, rot: R(0, TAU), spin: R(-3, 3), age: 0, life: 1.8, s: R(.8, 1.2) });
      else if (n === 'cloud') for (let i = 0; i < 8; i++) puff(sx + R(-60, 60), sy + R(-30, 30), 1.1);
      else for (let i = 0; i < 8; i++) spark(sx, sy, CHALK);
      snd.tone(n === 'bird' ? 900 : 240, n === 'bird' ? 1300 : 130, .14, 'sine', .05);
    } else if (name === 'mile') {
      if (!F.banner || F.banner.rec !== 1 || F.banner.t > 1.4) F.banner = { title: it.name, fact: it.fact, t: 0, life: 2.6 };
      snd.tune([660, 880], .09);
    } else if (name === 'record') {
      F.banner = { title: 'New record!', fact: 'Higher than ever. Keep going!', t: 0, life: 2.6, rec: 1 };
      for (let i = 0; i < 30; i++) spark(V.vw / 2 + R(-260, 260), V.ry - 250 + R(-40, 40), [YELLOW, PINK, BLUE, GREEN][i % 4]);
      snd.tune([659, 784, 988]);
    } else if (name === 'stage') {
      for (const side of [-1, 1]) V.parts.push({ img: 'booster', x: V.vw / 2 + f.x + PAIRS[f.boosters] * side, y: V.ry + 36, vx: side * 110, vy: 60, g: 160, w: .5, rot: 0, spin: side * 1.1, age: 0, life: 2.4, s: 1 });
      say(V.vw / 2 + f.x, V.ry - 170, 'Next tank!', ORANGE, 42);
      snd.tone(160, 420, .25, 'sawtooth', .025);
    } else if (name === 'low') { say(V.vw / 2 + f.x, V.ry - 170, 'Low fuel! Catch a rocket!', PINK, 40);
    } else if (name === 'empty') { say(V.vw / 2 + f.x, V.ry - 170, 'Out of fuel!', PINK, 42); }
  }
  const addPart = p => { if (V.parts.length < 170) V.parts.push({ age: 0, vx: 0, vy: 0, ...p }); };
  const puff = (x, y, s) => addPart({ x, y, vx: R(-70, 70), vy: R(-50, 20), r: R(14, 30) * s, life: R(.6, 1.2), col: CHALK, a: .4 });
  const spark = (x, y, col) => { const a = R(0, TAU), v = R(80, 300); addPart({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: .4, r: R(3, 7), life: R(.35, .7), col, a: 1 }); };
  const say = (x, y, text, col, size) => addPart({ x: clamp(x, 170, V.vw - 170), y, vy: -70, text, col, size, life: 1.1, a: 1 });
  const exhaust = f => addPart({ x: V.vw / 2 + f.x + R(-16, 16), y: V.ry + 130, vx: R(-40, 40), vy: R(120, 220), w: .35, r: R(7, 18), life: R(.3, .7), col: [ORANGE, YELLOW, CHALK][Math.floor(R(0, 3))], a: .6 });

  /* ---------- chalk art: drawn once to small canvases, then dust is rubbed out of each ---------- */
  function dustTiles() {
    if (V.dust) return V.dust;
    const mk = (n, a0, a1, r) => {
      const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
      for (let i = 0; i < n; i++) { g.fillStyle = `rgba(255,255,255,${R(a0, a1)})`; g.fillRect(R(0, 256), R(0, 256), R(1, r), R(1, r)); }
      return c;
    };
    V.dust = { rub: mk(1100, .12, .5, 3), board: mk(900, .02, .08, 3) };
    return V.dust;
  }
  function sketch(g, path, fill, line, lw = 5) {
    if (fill) { g.fillStyle = fill; g.beginPath(); path(); g.fill(); }
    if (line) {
      g.strokeStyle = line; g.lineWidth = lw;
      for (let i = 0; i < 2; i++) { g.save(); g.translate(R(-1.5, 1.5), R(-1.5, 1.5)); g.globalAlpha = i ? .5 : 1; g.beginPath(); path(); g.stroke(); g.restore(); }
    }
  }
  const dot = (g, x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  function hull(g) { g.moveTo(0, -120); g.bezierCurveTo(52, -72, 48, 30, 34, 84); g.lineTo(-34, 84); g.bezierCurveTo(-48, 30, -52, -72, 0, -120); g.closePath(); }
  function shipArt(g, body, trim, nose) {
    for (const d of [-1, 1]) sketch(g, () => { g.moveTo(d * 32, 12); g.quadraticCurveTo(d * 82, 54, d * 74, 114); g.lineTo(d * 28, 84); g.closePath(); }, trim, INK);
    sketch(g, () => { g.moveTo(-24, 84); g.lineTo(-30, 106); g.lineTo(30, 106); g.lineTo(24, 84); g.closePath(); }, '#5F6B77', INK);
    sketch(g, () => hull(g), body, INK);
    g.save(); g.beginPath(); hull(g); g.clip();
    g.fillStyle = nose; g.fillRect(-60, -130, 120, 62);
    g.fillStyle = trim; g.fillRect(-60, 42, 120, 16);
    g.strokeStyle = 'rgba(38,48,58,.14)'; g.lineWidth = 3; for (let y = -60; y < 90; y += 13) { g.beginPath(); g.moveTo(14, y + 14); g.lineTo(44, y); g.stroke(); }
    g.restore();
    sketch(g, () => g.arc(0, -22, 29, 0, TAU), '#23372E', INK, 6);
    sketch(g, () => g.arc(0, -22, 29, 0, TAU), null, ORANGE, 4);
  }
  function puffs(g, list, fill, rim) {
    const path = () => list.forEach(([x, y, r]) => { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); });
    g.strokeStyle = rim; g.lineWidth = 9; g.beginPath(); path(); g.stroke();
    g.fillStyle = fill; g.beginPath(); path(); g.fill();
  }
  function planet(g, r, base, inside) {
    const disc = () => g.arc(0, 0, r, 0, TAU);
    g.save(); g.beginPath(); disc(); g.fillStyle = base; g.fill(); g.clip(); inside();
    g.fillStyle = 'rgba(8,10,22,.32)'; g.beginPath(); g.arc(r * .34, r * .3, r * 1.06, 0, TAU); g.rect(r * 2, -r * 2, -r * 4, r * 4); g.fill('evenodd');
    g.restore(); sketch(g, disc, null, 'rgba(243,241,231,.75)', 5);
  }
  const ART = {
    ship: [220, 290, g => shipArt(g, CHALK, V.color, '#D8434B'), g => {
      g.font = '38px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(V.avatar, 0, -20);
    }],
    booster: [90, 220, g => {
      const body = () => { g.moveTo(0, -96); g.bezierCurveTo(30, -66, 26, 40, 24, 88); g.lineTo(-24, 88); g.bezierCurveTo(-26, 40, -30, -66, 0, -96); g.closePath(); };
      sketch(g, body, '#E8E4D6', INK); g.save(); g.beginPath(); body(); g.clip(); g.fillStyle = YELLOW; g.fillRect(-40, -110, 80, 44); g.fillStyle = V.color; g.fillRect(-40, 20, 80, 16); g.restore();
      sketch(g, () => { g.moveTo(-16, 88); g.lineTo(-20, 102); g.lineTo(20, 102); g.lineTo(16, 88); g.closePath(); }, '#5F6B77', INK, 4);
    }],
    chute: [340, 200, g => {
      const dome = () => { g.moveTo(-140, 60); g.bezierCurveTo(-130, -110, 130, -110, 140, 60); g.quadraticCurveTo(70, 26, 0, 60); g.quadraticCurveTo(-70, 26, -140, 60); g.closePath(); };
      sketch(g, dome, PINK, INK, 5); g.save(); g.beginPath(); dome(); g.clip(); g.fillStyle = YELLOW; g.beginPath(); g.moveTo(-30, -100); g.lineTo(30, -100); g.lineTo(70, 70); g.lineTo(-70, 70); g.fill(); g.restore();
    }],
    fuel: [170, 170, g => {
      const glow = g.createRadialGradient(0, 0, 10, 0, 0, 82); glow.addColorStop(0, 'rgba(246,211,101,.55)'); glow.addColorStop(1, 'rgba(246,211,101,0)'); g.fillStyle = glow; g.fillRect(-85, -85, 170, 170);
      g.save(); g.rotate(.5); g.scale(.46, .46); shipArt(g, YELLOW, ORANGE, '#D8434B'); dot(g, 0, -22, 18, BLUE); g.restore();
    }],
    bird0: [170, 130, g => birdArt(g, 1)], bird1: [170, 130, g => birdArt(g, 0)],
    cloud: [270, 190, g => {
      puffs(g, [[-66, 16, 44], [-18, -14, 58], [40, -4, 52], [84, 22, 34], [10, 30, 46]], '#A9B9C9', 'rgba(243,241,231,.8)');
      g.strokeStyle = '#3F5062'; g.lineWidth = 5; g.lineCap = 'round';
      for (const x of [-28, 22]) { g.beginPath(); g.arc(x, 0, 11, .2, Math.PI - .2); g.stroke(); }
      g.beginPath(); g.arc(-3, 28, 8, 0, Math.PI); g.stroke();
    }],
    plane: [260, 130, g => {
      sketch(g, () => { g.moveTo(-96, -6); g.lineTo(-122, -52); g.lineTo(-92, -50); g.lineTo(-58, -8); g.closePath(); }, YELLOW, INK);
      const body = () => { g.moveTo(-112, -8); g.quadraticCurveTo(-20, -30, 74, -22); g.quadraticCurveTo(122, -16, 124, 4); g.quadraticCurveTo(100, 24, 50, 24); g.lineTo(-70, 20); g.closePath(); };
      sketch(g, body, CHALK, INK); g.save(); g.beginPath(); body(); g.clip(); g.fillStyle = BLUE; g.fillRect(-130, 6, 270, 12); g.restore();
      for (let i = 0; i < 6; i++) dot(g, -30 + i * 20, -8, 5, '#3F5062');
      sketch(g, () => { g.arc(100, -6, 9, 0, TAU); }, BLUE, INK, 3);
      sketch(g, () => { g.moveTo(-10, 8); g.lineTo(-50, 56); g.lineTo(-18, 56); g.lineTo(34, 10); g.closePath(); }, YELLOW, INK);
    }],
    sat: [270, 130, g => {
      for (const d of [-1, 1]) {
        sketch(g, () => g.rect(d > 0 ? 44 : -130, -32, 86, 64), '#3F7FB5', CHALK, 4);
        g.strokeStyle = 'rgba(243,241,231,.6)'; g.lineWidth = 2; g.beginPath();
        for (let i = 1; i < 4; i++) { const x = (d > 0 ? 44 : -130) + i * 21.5; g.moveTo(x, -32); g.lineTo(x, 32); } g.moveTo(d > 0 ? 44 : -130, 0); g.lineTo(d > 0 ? 130 : -44, 0); g.stroke();
      }
      sketch(g, () => g.rect(-34, -40, 68, 80), YELLOW, INK);
      sketch(g, () => { g.moveTo(-20, -40); g.quadraticCurveTo(0, -18, 20, -40); g.lineTo(0, -62); g.closePath(); }, CHALK, INK, 4);
      dot(g, 0, 0, 9, '#3F5062');
    }],
    rock: [170, 160, g => {
      const pts = [[-64, -10], [-40, -52], [8, -62], [52, -40], [68, 6], [40, 50], [-6, 60], [-52, 40]];
      sketch(g, () => { pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); }, '#8C8378', CHALK, 5);
      for (const [x, y, r] of [[-22, -18, 15], [24, -24, 10], [16, 22, 18], [-28, 26, 8]]) { dot(g, x, y, r, '#6E665C'); dot(g, x + 3, y - 3, r * .7, '#7C7469'); }
    }],
    ufo: [220, 150, g => {
      sketch(g, () => g.arc(0, -8, 42, Math.PI, 0), 'rgba(147,203,234,.55)', CHALK, 4);
      dot(g, 0, -20, 19, GREEN); dot(g, -7, -24, 5, '#26303A'); dot(g, 7, -24, 5, '#26303A');
      g.strokeStyle = '#26303A'; g.lineWidth = 3; g.beginPath(); g.arc(0, -16, 7, .3, Math.PI - .3); g.stroke();
      sketch(g, () => g.ellipse(0, 12, 92, 26, 0, 0, TAU), LILAC, CHALK, 5);
      for (const x of [-56, -20, 20, 56]) dot(g, x, 16, 7, YELLOW);
    }],
    feather: [60, 26, g => {
      sketch(g, () => { g.moveTo(-26, 0); g.quadraticCurveTo(0, -16, 26, 0); g.quadraticCurveTo(0, 12, -26, 0); }, '#F7C5C9', '#D8434B', 2);
    }],
    puffA: [340, 160, g => { puffs(g, [[-90, 26, 44], [-30, 0, 62], [40, 12, 54], [104, 32, 34]], 'rgba(243,241,231,.82)', 'rgba(243,241,231,.3)'); }],
    puffB: [300, 130, g => { puffs(g, [[-70, 22, 34], [-10, 4, 48], [56, 20, 38]], 'rgba(243,241,231,.7)', 'rgba(243,241,231,.26)'); }],
    station: [420, 220, g => {
      g.strokeStyle = CHALK; g.lineWidth = 8; g.beginPath(); g.moveTo(-190, 0); g.lineTo(190, 0); g.stroke();
      for (const x of [-170, -110, 110, 170]) for (const d of [-1, 1]) sketch(g, () => g.rect(x - 22, d > 0 ? 8 : -96, 44, 88), '#3F7FB5', CHALK, 3);
      sketch(g, () => g.rect(-64, -22, 128, 44), '#D8D4C6', INK); sketch(g, () => g.rect(-18, -44, 36, 88), '#E8E4D6', INK); dot(g, 40, 0, 7, ORANGE);
    }],
    moon: [480, 480, g => planet(g, 225, '#DDD8C8', () => {
      for (const [x, y, r] of [[-90, -70, 44], [50, -110, 26], [110, 20, 60], [-30, 70, 34], [-130, 80, 22], [40, 150, 30], [-10, -10, 18]]) { dot(g, x, y, r + 5, '#EFEBDD'); dot(g, x, y, r, '#B9B3A2'); dot(g, x + r * .2, y + r * .2, r * .7, '#C8C2B1'); }
    })],
    mars: [400, 400, g => planet(g, 185, '#D1683C', () => {
      for (const [x, y, w, h] of [[-50, 20, 120, 34], [70, -50, 80, 26], [40, 80, 96, 22], [-90, -80, 56, 20]]) { g.fillStyle = '#A84C2A'; g.beginPath(); g.ellipse(x, y, w, h, -.3, 0, TAU); g.fill(); }
      g.fillStyle = CHALK; g.beginPath(); g.ellipse(0, -176, 70, 20, 0, 0, TAU); g.fill();
    })],
    jupiter: [540, 540, g => planet(g, 255, '#D9B98E', () => {
      [['#A9713F', -190, 34], ['#E8D6B8', -130, 40], ['#B9834F', -60, 44], ['#EADCC2', 10, 34], ['#A9713F', 60, 52], ['#E0C49C', 130, 34], ['#B9834F', 190, 30]].forEach(([c, y, h]) => { g.fillStyle = c; g.fillRect(-260, y, 520, h); });
      g.fillStyle = '#C8553D'; g.beginPath(); g.ellipse(90, 86, 62, 30, 0, 0, TAU); g.fill();
    })],
    saturn: [720, 380, g => {
      const ring = (a, b) => { for (const [rx, ry, col, w] of [[320, 74, '#E8D6B8', 20], [272, 62, '#C9B28C', 14]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.ellipse(0, 0, rx, ry, -.16, a, b); g.stroke(); } };
      ring(Math.PI, TAU); planet(g, 165, '#E2C98F', () => { [['#C9A566', -90, 30], ['#EFE0B8', -30, 24], ['#C9A566', 30, 34], ['#EFE0B8', 90, 24]].forEach(([c, y, h]) => { g.fillStyle = c; g.fillRect(-170, y, 340, h); }); }); ring(0, Math.PI);
    }],
    neptune: [400, 400, g => planet(g, 185, '#3F6FD0', () => {
      g.strokeStyle = 'rgba(243,241,231,.7)'; g.lineWidth = 7; g.lineCap = 'round';
      for (const [x, y, l] of [[-70, -60, 110], [20, 10, 150], [-40, 90, 90]]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 12, x + l, y); g.stroke(); }
      g.fillStyle = '#2A4FA6'; g.beginPath(); g.ellipse(-60, 40, 54, 26, 0, 0, TAU); g.fill();
    })],
    pluto: [230, 230, g => planet(g, 100, '#C4A98C', () => {
      g.fillStyle = '#EFE3D0'; g.beginPath(); g.moveTo(10, 60); g.bezierCurveTo(-70, 10, -30, -46, 12, -14); g.bezierCurveTo(50, -46, 86, 10, 10, 60); g.fill();
    })],
    stars: () => [V.vw, V.vh, g => {
      for (let i = 0; i < 170; i++) {
        const x = R(-V.vw / 2, V.vw / 2), y = R(-V.vh / 2, V.vh / 2), c = [CHALK, CHALK, BLUE, YELLOW][i % 4];
        if (i % 11 === 0) { g.strokeStyle = c; g.lineWidth = 3; const r = R(8, 14); g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.moveTo(x, y - r); g.lineTo(x, y + r); g.stroke(); } else dot(g, x, y, R(1.2, 3), c);
      }
    }],
    wash: () => [V.vw, V.vh, g => {
      g.lineCap = 'round';
      for (let i = 0; i < 90; i++) { const x = R(-V.vw * .7, V.vw * .7), y = R(-V.vh * .6, V.vh * .6), l = R(160, 520); g.strokeStyle = `rgba(255,255,255,${R(.012, .04)})`; g.lineWidth = R(16, 52); g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y - l * .34); g.stroke(); }
    }],
    ground: () => [V.vw + 60, V.vh - V.ry + 340, g => groundArt(g, V.vw + 60, V.vh - V.ry + 340), null, 'whole']
  };
  function birdArt(g, up) {
    sketch(g, () => { g.moveTo(-34, -2); g.lineTo(-70, -16); g.lineTo(-60, 12); g.closePath(); }, '#E2838B', INK, 4);
    sketch(g, () => g.ellipse(0, 0, 44, 32, 0, 0, TAU), PINK, INK, 4);
    g.fillStyle = '#FCEFE6'; g.beginPath(); g.ellipse(10, 12, 26, 15, 0, 0, TAU); g.fill();
    sketch(g, () => { g.moveTo(40, -8); g.lineTo(68, 2); g.lineTo(40, 11); g.closePath(); }, ORANGE, INK, 3);
    dot(g, 24, -9, 6, '#26303A'); dot(g, 26, -11, 2, '#fff');
    if (up) sketch(g, () => { g.moveTo(-18, -8); g.quadraticCurveTo(-26, -58, -2, -62); g.quadraticCurveTo(14, -40, 12, -8); g.closePath(); }, '#F9D2D5', INK, 4);
    else sketch(g, () => { g.moveTo(-18, 2); g.quadraticCurveTo(-26, 46, -4, 52); g.quadraticCurveTo(14, 34, 12, 2); g.closePath(); }, '#F9D2D5', INK, 4);
  }
  function groundArt(g, w, h) {
    const L = -h / 2 + 300, T = L + 118, E = w / 2; // L = the rocket's line, T = top of the pad
    const tree = (x, y, r) => { g.fillStyle = '#6B4A33'; g.fillRect(x - 5, y, 10, r); sketch(g, () => g.arc(x, y - r * .3, r, 0, TAU), '#3F7A5A', 'rgba(243,241,231,.6)', 4); };
    sketch(g, () => { g.moveTo(-E, T - 70); g.bezierCurveTo(-E * .5, T - 170, -E * .1, T - 20, E * .3, T - 90); g.bezierCurveTo(E * .6, T - 150, E * .8, T - 90, E, T - 120); g.lineTo(E, h / 2); g.lineTo(-E, h / 2); g.closePath(); }, '#3C6A58', 'rgba(243,241,231,.45)', 4);
    for (const [x, r] of [[-.9, 34], [-.74, 44], [-.56, 30], [.74, 34], [.9, 44]]) tree(E * x, T - 40, r);
    sketch(g, () => { g.moveTo(-E, T + 16); g.quadraticCurveTo(-E * .4, T - 26, 0, T); g.quadraticCurveTo(E * .4, T - 22, E, T + 12); g.lineTo(E, h / 2); g.lineTo(-E, h / 2); g.closePath(); }, '#2C4539', 'rgba(243,241,231,.7)', 5);
    g.strokeStyle = 'rgba(243,241,231,.1)'; g.lineWidth = 3; for (let i = 0; i < 70; i++) { const x = R(-E, E), y = R(T + 30, h / 2); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 14, y - 12); g.stroke(); }
    sketch(g, () => g.rect(-250, T - 4, 500, 24), '#7A4E33', 'rgba(243,241,231,.7)', 4); // pad
    g.fillStyle = YELLOW; for (let x = -240; x < 226; x += 44) { g.beginPath(); g.moveTo(x, T + 20); g.lineTo(x + 12, T - 4); g.lineTo(x + 24, T - 4); g.lineTo(x + 12, T + 20); g.fill(); }
    const tw = 272; g.strokeStyle = ORANGE; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); // gantry
    for (const x of [tw, tw + 46]) { g.moveTo(x, T); g.lineTo(x, L - 210); }
    for (let y = T, i = 0; y > L - 200; y -= 54, i++) { g.moveTo(tw, y); g.lineTo(tw + 46, y); g.moveTo(i % 2 ? tw : tw + 46, y); g.lineTo(i % 2 ? tw + 46 : tw, y - 54); }
    g.moveTo(tw, L - 110); g.lineTo(tw - 64, L - 110); g.stroke();
    dot(g, tw + 23, L - 222, 10, PINK);
  }
  function spr(name) {
    if (V.spr[name]) return V.spr[name];
    const def = typeof ART[name] === 'function' ? ART[name]() : ART[name], [w, h, paint, after, whole] = def, c = document.createElement('canvas');
    c.width = Math.ceil(w * V.k); c.height = Math.ceil(h * V.k);
    const g = c.getContext('2d'), base = () => g.setTransform(V.k, 0, 0, V.k, w * V.k / 2, h * V.k / 2);
    base(); g.lineCap = g.lineJoin = 'round'; paint(g);
    if (!whole) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out'; g.fillStyle = g.createPattern(dustTiles().rub, 'repeat'); g.fillRect(0, 0, c.width, c.height); }
    g.globalCompositeOperation = 'source-over'; if (after) { base(); after(g); }
    return V.spr[name] = { c, w, h };
  }
  function put(g, name, x, y, rot = 0, sx = 1, alpha = 1, scale = 1) {
    const a = spr(name); g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.scale(sx * scale, scale); if (alpha < 1) g.globalAlpha = alpha;
    g.drawImage(a.c, -a.w / 2, -a.h / 2, a.w, a.h); g.restore();
  }
  function wrapped(g, name, off, alpha) {
    const a = spr(name), y = ((off % V.vh) + V.vh) % V.vh; g.globalAlpha = alpha;
    g.drawImage(a.c, 0, y - V.vh, V.vw, V.vh); g.drawImage(a.c, 0, y, V.vw, V.vh); g.globalAlpha = 1;
  }

  /* ---------- the sky ---------- */
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const SKY = [[0, '#3F89BC', '#A4DFF2'], [2600, '#3A7DB8', '#9FD6F0'], [6000, '#2C5BA6', '#93A8E6'], [11000, '#1E2C78', '#9A73C4'], [15000, '#101A52', '#3D4AA0'], [22000, '#0B1230', '#172248'],
    [46000, '#0D1024', '#1A1836'], [70000, '#1E0F1E', '#31182A'], [100000, '#1A1420', '#332432'], [135000, '#15121F', '#2B2433'], [175000, '#0A1630', '#12284A'], [300000, '#0C0A18', '#181030']].map(([s, a, b]) => [s, hex(a), hex(b)]);
  function skyAt(s) {
    let i = 0; while (i < SKY.length - 2 && s >= SKY[i + 1][0]) i++;
    const a = SKY[i], b = SKY[i + 1], t = clamp((s - a[0]) / (b[0] - a[0]), 0, 1), mix = (p, q) => `rgb(${p.map((v, j) => Math.round(v + (q[j] - v) * t)).join(',')})`;
    return [mix(a[1], b[1]), mix(a[2], b[2])];
  }
  const LANDMARKS = [['station', 22000, .55], ['moon', 46000, -.5], ['mars', 70000, .5], ['jupiter', 100000, -.55], ['saturn', 135000, .45], ['neptune', 175000, -.5], ['pluto', 240000, .5]];
  const noise = i => { const n = Math.sin(i * 12.9898) * 43758.5453; return n - Math.floor(n); };
  function earth(g, s) {
    if (s < 10500 || s > 76000) return;
    const u = clamp((s - 10500) / 34000, 0, 1), r = 2600 * (110 / 2600) ** u, top = V.vh + 60 - 340 * Math.min(1, u * 6), cx = V.vw / 2, cy = top + r;
    g.save(); g.globalAlpha = clamp((76000 - s) / 16000, 0, 1);
    g.fillStyle = 'rgba(147,203,234,.22)'; g.beginPath(); g.arc(cx, cy, r + 26, 0, TAU); g.fill();
    g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fillStyle = '#2F6FB0'; g.fill(); g.clip();
    g.fillStyle = '#5FAE7A'; for (const [a, d, w, h] of [[-2, .55, .22, .15], [-1.76, .42, .15, .2], [-2.24, .38, .13, .1], [-1, .72, .2, .11], [-.8, .52, .11, .19], [-1.2, .47, .1, .12], [-2.7, .76, .15, .19], [-.35, .42, .14, .08], [-1.72, .975, .085, .016], [-1.47, .965, .12, .022], [-1.27, .98, .06, .012], [-1.9, .955, .07, .02]]) { g.beginPath(); g.ellipse(cx + Math.cos(a) * r * d, cy + Math.sin(a) * r * d, r * w, r * h, a + 1.57, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(243,241,231,.5)'; for (const [a, d, w] of [[-1.5, .88, .26], [-2.1, .7, .2], [-1, .55, .16]]) { g.beginPath(); g.ellipse(cx + Math.cos(a) * r * d, cy + Math.sin(a) * r * d, r * w, r * .03, a + 1.57, 0, TAU); g.fill(); }
    g.restore(); g.save(); g.globalAlpha = clamp((76000 - s) / 16000, 0, 1); g.strokeStyle = 'rgba(243,241,231,.7)'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); g.restore();
  }
  function label(g, text, x, y, size, col, font = DISPLAY, alpha = 1) {
    g.font = `700 ${size}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.globalAlpha = alpha;
    g.strokeStyle = 'rgba(12,20,16,.72)'; g.lineWidth = size * .2; g.strokeText(text, x, y); g.fillStyle = col; g.fillText(text, x, y); g.globalAlpha = 1;
  }
  function plate(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function flame(g, x, y, w, len) {
    for (const [cw, cl, col] of [[1, 1, ORANGE], [.66, .72, YELLOW], [.32, .44, '#FBFAF3']]) {
      g.fillStyle = col; g.beginPath(); g.moveTo(x - w * cw, y); const n = 5, L = len * cl;
      for (let i = 1; i < n; i++) g.lineTo(x - w * cw * (1 - i / n) * R(.7, 1.25), y + L * i / n);
      g.lineTo(x + R(-5, 5), y + L * R(.92, 1.08));
      for (let i = n - 1; i > 0; i--) g.lineTo(x + w * cw * (1 - i / n) * R(.7, 1.25), y + L * i / n);
      g.lineTo(x + w * cw, y); g.closePath(); g.fill();
    }
  }
  function drawShip(g, f) {
    const x = V.vw / 2 + (f ? f.x : 0), ry = V.ry, phase = F.phase, firing = phase === 'ignite' || (f && phase === 'fly' && f.burn > 0);
    const lean = f ? clamp((f.tx - f.x) * .0016, -.32, .32) + Math.sin(V.t * 26) * f.wob * .16 : 0, boosters = f ? f.boosters : F.pairs;
    const a = f && f.safe ? .78 + .22 * Math.sin(V.t * 22) : 1, chute = phase === 'chute' || phase === 'down' || (phase === 'done' && f);
    g.save(); g.translate(x, ry); g.rotate(lean); g.globalAlpha = a;
    if (chute) {
      g.strokeStyle = CHALK; g.lineWidth = 3; g.beginPath(); for (const d of [-130, -60, 60, 130]) { g.moveTo(d, -224); g.lineTo(d * .16, -100); } g.stroke();
      put(g, 'chute', 0, -280, Math.sin(V.t * 2) * .05);
    }
    const len = firing ? 110 + 60 * Math.min(1, (f ? f.kick : 200) / 200) : 0;
    for (let i = boosters - 1; i >= 0; i--) for (const side of [-1, 1]) {
      if (firing) flame(g, PAIRS[i] * side, 136, 16, len * .6);
      put(g, 'booster', PAIRS[i] * side, 36);
    }
    if (firing) flame(g, 0, 108, 30, len);
    put(g, 'ship', 0, 0);
    g.restore();
  }
  function hud(g, f) {
    const cx = V.vw / 2, w = Math.min(560, V.vw - 170), left = cx - w / 2, safeTop = 16;
    label(g, fmt(heightAt(f.s)), cx, safeTop + 50, 76, YELLOW);
    if (F.phase === 'chute' || F.phase === 'down') return;
    const y = safeTop + 98, h = 30, frac = clamp(f.burn / f.top, 0, 1), low = f.burn < 3.5;
    g.fillStyle = 'rgba(12,20,16,.6)'; plate(g, left, y, w, h, 15); g.fill();
    g.fillStyle = low ? (Math.sin(V.t * 12) > 0 ? PINK : '#D8434B') : ORANGE; if (frac > 0) { plate(g, left + 3, y + 3, Math.max(24, (w - 6) * frac), h - 6, 12); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.28)'; if (frac > 0) { plate(g, left + 8, y + 6, Math.max(14, (w - 16) * frac), 7, 3); g.fill(); }
    g.strokeStyle = 'rgba(243,241,231,.75)'; g.lineWidth = 3; plate(g, left, y, w, h, 15); g.stroke();
    if (f.tanks >= 2) { g.lineWidth = 2; g.beginPath(); for (let i = 1; i * f.perTank < f.top; i++) { const tx = left + w * (i * f.perTank / f.top); g.moveTo(tx, y + 4); g.lineTo(tx, y + h - 4); } g.stroke(); }
    g.font = `26px "Apple Color Emoji","Segoe UI Emoji",sans-serif`; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('⛽', left - 8, y + h / 2);
    if (f.bestS && !f.beat) label(g, `★ Record ${fmt(heightAt(f.bestS))}`, cx, y + h + 26, 25, CHALK, BODY, .92);
  }
  function drawBanner(g) {
    const b = F.banner, a = Math.min(1, b.t * 6, (b.life - b.t) * 3), pop = 1 + .28 * Math.max(0, 1 - b.t * 6), hasFact = !!b.fact;
    g.font = `700 70px ${DISPLAY}`; const tw = Math.max(g.measureText(b.title).width, (b.fact || '').length * 15) + 90, w = Math.min(tw, V.vw - 40), cx = V.vw / 2, y = F.phase === 'chute' ? 182 : 268, h = hasFact ? 142 : 100, fit = Math.min(1, (V.vw - 80) / (tw - 60));
    g.save(); g.translate(cx, y); g.scale(pop, pop); g.globalAlpha = a;
    g.fillStyle = 'rgba(24,40,32,.86)'; plate(g, -w / 2, -h / 2, w, h, 26); g.fill();
    g.strokeStyle = YELLOW; g.lineWidth = 4; g.setLineDash([16, 12]); plate(g, -w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 20); g.stroke(); g.setLineDash([]);
    g.restore(); g.save(); g.translate(cx, y); g.scale(pop, pop);
    label(g, b.title, 0, hasFact ? -22 : 0, 70 * fit, YELLOW, DISPLAY, a);
    if (hasFact) label(g, b.fact, 0, 38, 28 * fit, CHALK, BODY, a);
    g.restore();
  }
  function draw() {
    if (!F || !V.c) return;
    const g = V.g, f = F.fl, s = f ? f.s : 0, vw = V.vw, vh = V.vh, cx = vw / 2, ry = V.ry, t = V.t, [top, bot] = skyAt(s);
    g.setTransform(V.k, 0, 0, V.k, 0, 0); g.lineCap = 'round';
    const sky = g.createLinearGradient(0, 0, 0, vh); sky.addColorStop(0, top); sky.addColorStop(1, bot); g.fillStyle = sky; g.fillRect(-20, -20, vw + 40, vh + 40);
    if (F.shake > 0 && !F.paused) g.translate(R(-1, 1) * F.shake * 7, R(-1, 1) * F.shake * 7);
    wrapped(g, 'wash', s * .16, 1);
    const stars = clamp((s - 7000) / 9000, 0, 1);
    if (stars) { wrapped(g, 'stars', s * .05, stars); wrapped(g, 'stars', s * .11 + 400, stars * .55); }
    for (const [name, at, side] of LANDMARKS) { const y = ry * .55 - (at - s) * .5; if (y > -500 && y < vh + 500) put(g, name, cx + side * Math.min(vw, 1200), y, name === 'station' ? -.2 : 0); }
    earth(g, s);
    if (s < 13500) { // drifting clouds behind everything
      const fade = clamp(s / 900, .35, 1) * clamp((13500 - s) / 2500, 0, 1), par = .5, gap = 480, base = Math.floor(s * par / gap);
      for (let i = base - 2; i <= base + Math.ceil(vh / gap) + 1; i++) { const n = noise(i + 40); put(g, i % 2 ? 'puffA' : 'puffB', ((n * vw * 1.2 + t * 14) % (vw + 340)) - 170, ry - (i * gap - s * par), 0, noise(i) > .5 ? 1 : -1, fade); }
    }
    if (f && f.v > 300 && F.phase === 'fly') { // speed lines
      g.strokeStyle = 'rgba(243,241,231,.32)'; g.lineWidth = 4; g.beginPath(); const len = (f.v - 200) * .22;
      for (let i = 0; i < 12; i++) { const x = noise(i) * vw, y = ((noise(i + 9) * 1600 + s * 1.5) % (vh + 200)) - 100; g.moveTo(x, y); g.lineTo(x, y + len); }
      g.stroke();
    }
    if (s < vh + 360) { const a = spr('ground'); g.drawImage(a.c, -30, ry - 300 + s, a.w, a.h); }
    if (f && f.bestS && !f.beat) { // the record, chalked across the sky
      const y = ry - (f.bestS - f.s);
      if (y > -40 && y < vh) { g.strokeStyle = YELLOW; g.lineWidth = 5; g.setLineDash([26, 18]); g.beginPath(); g.moveTo(0, y); g.lineTo(vw, y); g.stroke(); g.setLineDash([]); label(g, `★ Your record ${fmt(heightAt(f.bestS))}`, cx, y - 34, 38, YELLOW); }
    }
    if (f) for (const it of f.items) {
      const y = ry - (it.s - f.s), x = cx + it.x; if (y < -260 || y > vh + 260 || x < -300 || x > vw + 300) continue;
      const dir = it.vx < 0 ? -1 : 1, fade = it.hit ? clamp(1.6 - it.hit, 0, 1) : 1;
      if (it.t === 'fuel') {
        const pulse = 1 + .08 * Math.sin(t * 6 + it.ph);
        put(g, 'fuel', x, y, Math.sin(t * 3 + it.ph) * .14, 1, 1, pulse);
        g.strokeStyle = YELLOW; g.lineWidth = 5; g.setLineDash([14, 14]); g.lineDashOffset = -t * 40; g.beginPath(); g.arc(x, y, 72 * pulse, 0, TAU); g.stroke(); g.setLineDash([]); g.lineDashOffset = 0;
      } else if (it.t === 'bird') put(g, Math.floor(t * (it.hit ? 18 : 7) + it.ph) % 2 ? 'bird0' : 'bird1', x, y + Math.sin(t * 5 + it.ph) * 16, it.hit ? -.5 * dir : 0, dir, fade);
      else if (it.t === 'plane') put(g, 'plane', x, y, it.hit ? -.3 * dir : 0, dir, fade);
      else if (it.t === 'ufo') put(g, 'ufo', x, y + Math.sin(t * 3 + it.ph) * 12, it.hit ? .3 : 0, 1, fade);
      else put(g, it.t, x, y, it.rot || 0, 1, fade);
    }
    drawShip(g, f);
    for (const p of V.parts) {
      const u = p.age / p.life;
      if (p.text) label(g, p.text, p.x, p.y, p.size, p.col, DISPLAY, Math.min(1, (1 - u) * 2.5));
      else if (p.img) put(g, p.img, p.x, p.y, p.rot, 1, Math.min(1, (1 - u) * 2), p.s);
      else { g.globalAlpha = p.a * (1 - u); g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, p.r * (1 + u), 0, TAU); g.fill(); g.globalAlpha = 1; }
    }
    if (f && F.phase !== 'done') hud(g, f);
    if (F.banner) drawBanner(g);
    if (F.hint && f && F.phase === 'fly') {
      if (f.t < 4) label(g, '← Slide your finger to steer →', cx, Math.min(vh - 60, ry + 250), 36, CHALK, BODY, Math.min(1, (4 - f.t) * 2));
      else if (f.t < 8) label(g, 'Catch the little rockets for more fuel!', cx, Math.min(vh - 60, ry + 250), 32, YELLOW, BODY, Math.min(1, (8 - f.t) * 2));
    }
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = V.board || (V.board = g.createPattern(dustTiles().board, 'repeat')); g.fillRect(0, 0, V.c.width, V.c.height); // chalk dust on the board
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-rk]'); if (!b || !F) return;
    const a = b.dataset.rk;
    if (a === 'launch') launch();
    else if (a === 'pause') setPaused(true);
    else if (a === 'resume') setPaused(false);
    else if (a === 'land') { const f = F.fl; setPaused(false); f.burn = 0; f.v = 0; f.over = true; f.peak = f.s; land(); }
  });
  const KEYS = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r' };
  document.addEventListener('keydown', e => {
    if (!F) return;
    if (KEYS[e.key]) { V.keys[KEYS[e.key]] = 1; if (F.fl) e.preventDefault(); }
    else if (e.key === ' ' && F.phase === 'aim') { e.preventDefault(); launch(); }
    else if (e.key === 'Escape' && F.fl) setPaused(!F.paused);
  });
  document.addEventListener('keyup', e => { if (KEYS[e.key]) V.keys[KEYS[e.key]] = 0; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && F && F.fl) { bank(); setPaused(true); } }); // the app can be closed from here

  window.HubRocket = { render, stop, simulate, fmt, state: () => F, view: () => V };
})();
