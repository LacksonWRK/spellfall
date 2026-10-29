/* Spell-a-Rocket: every word spelled right in a spelling or hidden-words round adds fuel (core.js).
   A full tank unlocks a launch: tap Launch while the power needle is near the middle for more thrust
   and a straighter flight. The flight is simulated (thrust, gravity, air drag), and the peak height is
   the child's record to beat. hub.js routes #/kid/<id>/rocket here and passes its helpers in ctx. */
(function () {
  'use strict';

  const G0 = 9.8, THRUST = 34, BURN = 5, DRAG = 0.0009; // m/s², s, 1/m
  const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  let X = null, raf = 0, F = null;
  const fmtM = m => Math.max(0, Math.round(m)).toLocaleString('en-US') + ' m';

  function stop() { cancelAnimationFrame(raf); raf = 0; F = null; }

  /* Simulate the whole flight up front: returns sampled path and the apogee. */
  function simulate(power, tiltDeg) {
    const th = (90 - tiltDeg) * Math.PI / 180, dt = 1 / 60, path = [];
    let x = 0, y = 0, vx = 0, vy = 0, t = 0, top = 0, chute = false;
    while (t < 90) {
      const v = Math.hypot(vx, vy), burning = t < BURN;
      let ax = -DRAG * v * vx, ay = -G0 - DRAG * v * vy;
      if (burning) { ax += THRUST * power * Math.cos(th); ay += THRUST * power * Math.sin(th); }
      if (chute) { ax = -0.6 * vx; ay = -G0 - 0.9 * vy; } // parachute: settles at about 11 m/s
      vx += ax * dt; vy += ay * dt; x += vx * dt; y += vy * dt; t += dt;
      if (y > top) top = y;
      if (!burning && !chute && vy < 0) chute = true;
      path.push({ x, y, t, burning, chute });
      if (y <= 0 && t > 1) break;
    }
    return { path, top };
  }

  function render(ctx, k) {
    X = ctx; stop();
    const r = { fuel: 0, launches: 0, best: 0, ...(k.rocket || {}) }, tank = X.TANK, full = r.fuel >= tank;
    X.app.innerHTML = `<div class="wrap narrow">
      <a class="btn ghost small back" href="#/kid/${k.id}">← ${X.esc(k.name)}</a>
      <h1 class="h1">Spell-a-Rocket</h1>
      <div class="rk-gauge" aria-label="Fuel ${r.fuel} of ${tank}"><i style="width:${Math.min(100, r.fuel / tank * 100)}%"></i><span>⛽ ${Math.min(r.fuel, tank)} / ${tank} fuel</span></div>
      <p class="muted">${full ? 'Tank full! Watch the needle and tap <b>Launch</b> when it’s in the green.' : `Every word you spell right adds fuel. Spell ${tank - r.fuel} more word${tank - r.fuel === 1 ? '' : 's'} to fill the tank.`}</p>
      <canvas id="rk-sky" class="rk-sky" width="640" height="720" aria-label="Launch pad"></canvas>
      ${full ? `<div class="rk-meter" aria-hidden="true"><b class="rk-green"></b><i id="rk-needle"></i></div>
        <div class="row" style="justify-content:center"><button class="btn primary big" data-rk="launch">🚀 Launch!</button></div>`
        : `<div class="row" style="justify-content:center"><a class="btn primary big" href="${X.spellHref(k)}">✏️ Go spell</a></div>`}
      <p class="fine center">${r.launches ? `Launches: ${r.launches} · Record: ${fmtM(r.best)}` : 'No launches yet.'}</p>
    </div>`;
    F = { kidId: k.id, phase: full ? 'aim' : 'idle', t0: performance.now(), needle: .5 };
    drawPad(); if (full) aim();
  }

  function aim() {
    if (!F || F.phase !== 'aim') return;
    F.needle = .5 + .5 * Math.sin((performance.now() - F.t0) / 1000 * 2.4); // about one swing per 1.3 s
    const n = document.getElementById('rk-needle'); if (n) n.style.left = (F.needle * 100) + '%';
    raf = requestAnimationFrame(aim);
  }

  function sky(c, alt) {
    const g = c.getContext('2d'), w = c.width, h = c.height, s = Math.min(1, alt / 700);
    const top = `rgb(${Math.round(70 - 62 * s)},${Math.round(130 - 118 * s)},${Math.round(190 - 160 * s)})`;
    const grad = g.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, top); grad.addColorStop(1, s > .8 ? '#14243a' : '#9fd0ea');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    if (s > .3) { g.fillStyle = `rgba(255,255,255,${(s - .3) * 1.2})`; for (let i = 0; i < 40; i++) g.fillRect((i * 157) % w, (i * 97 + alt * .05) % h, 2, 2); }
    return g;
  }
  function rocket(g, x, y, ang, flame, chute) {
    g.save(); g.translate(x, y); g.rotate(ang);
    if (chute) { g.fillStyle = '#F4A3A8'; g.beginPath(); g.arc(0, -70, 34, Math.PI, 0); g.fill(); g.strokeStyle = '#eee'; g.beginPath(); g.moveTo(-34, -70); g.lineTo(-6, -24); g.moveTo(34, -70); g.lineTo(6, -24); g.stroke(); }
    if (flame) { g.fillStyle = '#F7B267'; g.beginPath(); g.moveTo(-8, 22); g.lineTo(0, 22 + 18 + Math.random() * 22); g.lineTo(8, 22); g.fill(); }
    g.fillStyle = '#F3F1E7'; g.beginPath(); g.moveTo(0, -26); g.quadraticCurveTo(12, -8, 10, 22); g.lineTo(-10, 22); g.quadraticCurveTo(-12, -8, 0, -26); g.fill();
    g.fillStyle = '#D8434B'; g.beginPath(); g.moveTo(-10, 10); g.lineTo(-18, 26); g.lineTo(-10, 22); g.moveTo(10, 10); g.lineTo(18, 26); g.lineTo(10, 22); g.fill();
    g.fillStyle = '#93CBEA'; g.beginPath(); g.arc(0, -4, 5, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  function drawPad() {
    const c = document.getElementById('rk-sky'); if (!c) return;
    const g = sky(c, 0); g.fillStyle = '#2C4539'; g.fillRect(0, c.height - 70, c.width, 70);
    g.fillStyle = '#7A4E33'; g.fillRect(c.width / 2 - 40, c.height - 78, 80, 10);
    rocket(g, c.width / 2, c.height - 104, 0, false, false);
  }

  function launch() {
    if (!F || F.phase !== 'aim') return;
    cancelAnimationFrame(raf);
    const off = F.needle - .5, power = .62 + .38 * (1 - Math.abs(off) * 2), tilt = off * 36;
    const sim = simulate(power, tilt), k = X.store.kid(F.kidId);
    const prev = (k.rocket || {}).best || 0, isBest = sim.top > prev;
    X.store.updateKid(k.id, kk => { const r = kk.rocket || {}; kk.rocket = { fuel: 0, launches: (r.launches || 0) + 1, best: Math.max(r.best || 0, Math.round(sim.top)) }; });
    F.phase = 'fly'; F.sim = sim; F.isBest = isBest; F.power = power;
    const btn = document.querySelector('[data-rk=launch]'); if (btn) btn.disabled = true;
    if (RM) return done();
    const c = document.getElementById('rk-sky'); let idx = 0, last = performance.now();
    const step = now => {
      if (!F || F.phase !== 'fly') return;
      const cur = sim.path[Math.floor(idx)]; idx = Math.min(sim.path.length - 1, idx + (now - last) / 1000 * 60 * (cur.chute ? 15 : 3)); last = now; // climb at 3x, parachute at 15x
      const p = sim.path[Math.floor(idx)];
      const g = sky(c, p.y), groundY = c.height - 70 + p.y * 0.35;
      if (groundY < c.height) { g.fillStyle = '#2C4539'; g.fillRect(0, groundY, c.width, c.height); }
      const camY = c.height * .55, lean = p.chute ? 0 : Math.atan2(p.x, Math.max(1, p.y)); // tilt with the flight path
      rocket(g, c.width / 2 + Math.max(-260, Math.min(260, p.x * 0.35)), Math.max(camY, c.height - 104 - p.y * 0.35), lean, p.burning, p.chute);
      g.fillStyle = '#fff'; g.font = '700 30px Andika, sans-serif'; g.fillText('⬆ ' + fmtM(p.y), 18, 44);
      if (p === sim.path[sim.path.length - 1]) return done();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function done() {
    if (!F) return;
    F.phase = 'done';
    const k = X.store.kid(F.kidId), r = k.rocket;
    const box = document.createElement('div'); box.className = 'card rk-result';
    box.innerHTML = `<p class="h2 center">${F.isBest ? 'New record!' : 'Splashdown!'}</p>
      <p class="rk-height center">${fmtM(F.sim.top)}</p>
      <p class="muted center">${F.power > .95 ? 'Perfect launch, right in the green!' : F.power > .8 ? 'Strong launch.' : 'Try tapping closer to the middle for more power.'} Record: ${fmtM(r.best)}.</p>
      <div class="row" style="justify-content:center"><a class="btn primary" href="${X.spellHref(k)}">✏️ Spell to refuel</a><a class="btn ghost" href="#/kid/${k.id}">Done</a></div>`;
    const c = document.getElementById('rk-sky'); if (c) c.after(box);
    document.querySelectorAll('.rk-meter,[data-rk=launch]').forEach(el => el.remove());
    const gauge = document.querySelector('.rk-gauge'); if (gauge) { gauge.querySelector('i').style.width = '0%'; gauge.querySelector('span').textContent = `⛽ 0 / ${X.TANK} fuel`; }
    const note = document.querySelector('.wrap > .muted'); if (note) note.textContent = 'The launch used the whole tank. Spell more words to refuel.';
    if (F.isBest) X.confetti();
  }

  document.addEventListener('click', e => { if (e.target.closest('[data-rk=launch]')) launch(); });

  window.HubRocket = { render, stop, simulate };
})();
