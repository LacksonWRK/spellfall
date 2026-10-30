#!/usr/bin/env node
/* Math audit: generates many problems per skill and checks what a child sees and hears.
   Run: node test/math-audit.js    Exit 0 = clean, 1 = something reads wrong. No dependencies. */
'use strict';
global.window = {};
require('../js/content.js');
const C = window.HubContent, N = 5000, fails = [];
const GRADES = ['K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const bad = (id, why, text) => { if (fails.filter(f => f.id === id && f.why === why).length < 3) fails.push({ id, why, text }); };

// every character the app may show. Andika (rocks) has all of these except the ones in FALLBACK.
const ALLOWED = /^[0-9A-Za-z +−×÷=?(),./%:²³¹⁰⁴⁵⁶⁷⁸⁹√]*$/;
const FALLBACK = /[⁰⁴⁵⁶⁷⁸⁹√]/g; // drawn by a system font on the rocks; the drills use real superscripts
const SUP = s => s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, c => C.SUPERS.indexOf(c));
const plain = s => s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '').replace(/(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, b, e) => `(${b}**${SUP(e)})`).replace(/³√(\d+)/g, 'Math.round(Math.cbrt($1))').replace(/√(\d+)/g, 'Math.sqrt($1)');
const calc = s => { const e = plain(s); if (!/^[0-9+\-*/(). Mathsqrcbound]+$/.test(e)) throw new Error('not arithmetic: ' + e); return Function(`return (${e})`)(); };
const gcd = (a, b) => b ? gcd(b, a % b) : a;
function truth(id, p) { // recompute the answer from the text the child reads, not from the generator
  const q = p.q, n = q.match(/−?\d[\d,]*/g).map(x => +x.replace(/,/g, '').replace('−', '-'));
  switch (id) {
    case 'missing': return n[1] - n[0];
    case 'skip': return n[2] + (n[2] - n[1]);
    case 'tens': return n[0] * 10 + n[1];
    case 'fracof': return n[2] / n[1];
    case 'round': return Math.round(n[0] / 10) * 10;
    case 'pct': return n[0] * n[1] / 100;
    case 'rate': return n[0] / n[1];
    case 'gcf': return gcd(n[0], n[1]);
    case 'lcm': return n[0] * n[1] / gcd(n[0], n[1]);
    case 'eq1': return /^x/.test(q) ? n[1] - n[0] : n[1] / n[0];
    case 'eq2': return (n[2] - n[1]) / n[0];
    case 'prop': return n[0] * n[2] / n[1];
    case 'slope': return (n[3] - n[1]) / (n[2] - n[0]);
    case 'pyth': return Math.hypot(n[0], n[1]);
    case 'sci': return Math.log10(n[0] / n[1]);
    default: return calc(q);
  }
}
const rows = [];
for (const [id, s] of Object.entries(C.SKILLS)) {
  const seen = new Set(), wide = { q: 0 }; let falls = C.skillFalls(s);
  if (!s.label || /\s\s/.test(s.label)) bad(id, 'label', s.label);
  for (let i = 0; i < N; i++) {
    const p = s.gen(), q = p.q, dt = C.problemText(p), st = C.solvedText(p), sy = C.sayText(p);
    seen.add(q); wide.q = Math.max(wide.q, q.length);
    if (!Number.isInteger(p.a) || Object.is(p.a, -0)) bad(id, 'answer is not a whole number', `${q} -> ${p.a}`);
    if (Math.round(truth(id, p) * 1e9) / 1e9 !== p.a) bad(id, 'answer is wrong', `${q} -> ${p.a}, expected ${truth(id, p)}`);
    if (!ALLOWED.test(q.replace('^?', ''))) bad(id, 'odd character', q);
    if (/-/.test(q)) bad(id, 'hyphen instead of a minus sign', q);
    if (/\s\s|^\s|\s$/.test(q)) bad(id, 'odd spacing', q);
    if (/undefined|NaN|null|Infinity/.test(q + st + sy)) bad(id, 'broken text', q + ' | ' + st + ' | ' + sy);
    if (/\b1 (tens|ones)\b/.test(q + ' ' + sy)) bad(id, 'grammar', q);
    if (/= *=|==/.test(dt)) bad(id, 'doubled = on the drill line', dt);
    if (/= *=|==|=.*=.*=/.test(st) || / = .* = /.test(st) && !/x = /.test(st)) bad(id, 'doubled = in the worked answer', st);
    if (/\?/.test(st)) bad(id, 'worked answer still has a ?', st);
    if ((/[+−×÷]\s*$/.test(dt))) bad(id, 'ends on an operator', dt);
    if (/[+−×÷] −/.test(q)) bad(id, 'two operators in a row, needs parentheses', q);
    if (/[×÷−²³√^]/.test(sy)) bad(id, 'symbol in the read-aloud text', sy);
    if (/\bone over\b/.test(sy)) bad(id, 'read-aloud says "one over 3"', sy);
    if (falls && (q.length > 14 || /[=?a-z]/i.test(q))) bad(id, 'falls but is not clean math', q);
  }
  const offgrade = s.grades.filter(g => !GRADES.includes(g));
  if (offgrade.length) bad(id, 'unknown grade', offgrade.join());
  rows.push([id.padEnd(8), s.label.padEnd(34), String(seen.size).padStart(5) + ' distinct', (falls ? 'falls ' : 'drills').padEnd(6), `e.g. ${C.problemText(s.gen())}`, ` -> ${C.solvedText(s.gen())}`].join('  '));
}

// grades, groups, defaults
const grouped = C.MATH_GROUPS.flatMap(([, ids]) => ids);
for (const id of Object.keys(C.SKILLS)) if (grouped.filter(x => x === id).length !== 1) bad(id, 'should be in exactly one Parents group', '');
for (const id of grouped) if (!C.SKILLS[id]) bad(id, 'group names an unknown skill', '');
const expect = { K: ['add10'], '1st': ['add10', 'add18'] };
for (const [g, ids] of Object.entries(expect)) if (C.defaultMathOn(g).join() !== ids.join()) bad(g, 'default skills', C.defaultMathOn(g).join());
if (C.defaultMathOn('2nd').some(id => id.startsWith('mul'))) bad('2nd', 'multiplying must be off by default', C.defaultMathOn('2nd').join());
console.log('Falling Facts by grade (usual picks, every label is digits and symbols):');
for (const g of GRADES) {
  const kid = { grade: g }, all = C.skillsForKid(kid), fall = C.fallingFor(kid);
  if (!all.length || !fall.length) bad(g, 'grade has no math, or no falling math, by default', '');
  const off = all.filter(s => !fall.includes(s)).filter(s => !fall.some(f => f.id === s.id)).map(s => s.id);
  console.log(`  ${g.padEnd(4)} drills: ${all.map(s => s.id).join(' ')}\n       falls:  ${fall.map(s => s.id).join(' ')}${off.length ? `\n       drills only: ${off.join(' ')}` : ''}`);
}
if (C.fallingFor({ grade: '1st', math: { on: ['tens'] } }).length) bad('tens', 'must never fall', '');
if (C.skillsForKid({ grade: '1st', math: { on: [] } }).length) bad('1st', 'all off must mean nothing', '');
if (C.skillsForKid({ grade: '1st', math: { on: ['nope', 'mul5'] } }).map(s => s.id).join() !== 'mul5') bad('1st', 'unknown saved ids must be ignored', '');

// pictures
const names = new Set(), art = new Set();
for (const p of C.PICTURES) {
  if (names.has(p.name) || art.has(p.art)) bad(p.name, 'duplicate picture', p.art);
  names.add(p.name); art.add(p.art);
  if (!C.pictureMatches(p, p.name) || !C.pictureMatches(p, ` The ${p.name.toUpperCase()} `)) bad(p.name, 'its own name must count', '');
  if (p.ok.some(w => w !== C.guessKey(w))) bad(p.name, 'accepted spelling is not normalized', p.ok.join());
  if (C.pictureMatches(p, 'zzz')) bad(p.name, 'accepts nonsense', '');
}
for (const g of GRADES) if (C.picturesFor(g).length < 12) bad(g, 'too few pictures', '');

console.log(`\n${Object.keys(C.SKILLS).length} skills, ${N} problems each:\n` + rows.map(r => '  ' + r).join('\n'));
const fb = new Set(); for (const [, s] of Object.entries(C.SKILLS)) if (C.skillFalls(s)) for (let i = 0; i < 500; i++) (s.gen().q.match(FALLBACK) || []).forEach(c => fb.add(c));
console.log(`\nOn the rocks these come from a system font, not Andika: ${[...fb].sort().join(' ') || 'none'}`);
if (fails.length) { console.log(`\nFAILED ${fails.length}:`); for (const f of fails) console.log(`  ${f.id}: ${f.why}: ${f.text}`); process.exit(1); }
console.log('\nPASS: every problem reads clean and every answer checks out.');
