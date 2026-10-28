/* Built-in content. Word lists are original, grouped by the phonics patterns and spelling
   rules that Abeka's published scope & sequence lists for each grade (not copied from Abeka). */
(function () {
  'use strict';

  const LISTS = {
    K: [
      { title: 'Short a', pattern: 'short a, CVC', words: ['cat', 'bat', 'hat', 'map', 'can', 'pan', 'sad', 'mad'] },
      { title: 'Short i', pattern: 'short i, CVC', words: ['pig', 'big', 'dig', 'sit', 'hit', 'pin', 'win', 'lip'] },
      { title: 'Short o', pattern: 'short o, CVC', words: ['dog', 'log', 'hop', 'top', 'pot', 'hot', 'box', 'fox'] }
    ],
    '1st': [
      { title: 'Short a and i', pattern: 'short vowels, CVC', words: ['cat', 'hat', 'map', 'bag', 'pig', 'sit', 'win', 'lip', 'the', 'a'] },
      { title: 'Short o, u, e', pattern: 'short vowels, CVC', words: ['dog', 'hop', 'box', 'sun', 'cup', 'bus', 'bed', 'pen', 'is', 'to'] },
      { title: 'Ending blends', pattern: 'consonant blends at the end', words: ['hand', 'sand', 'best', 'nest', 'jump', 'lamp', 'milk', 'tent', 'was', 'said'] },
      { title: 'Beginning blends', pattern: 'consonant blends at the start', words: ['frog', 'drum', 'stop', 'step', 'clap', 'flag', 'swim', 'trip', 'of', 'you'] },
      { title: 'sh, ch, th', pattern: 'special sounds sh ch th', words: ['ship', 'shop', 'fish', 'chin', 'chop', 'much', 'this', 'that', 'bath', 'with'] },
      { title: '-ck words', pattern: 'ck after a short vowel', words: ['back', 'duck', 'sock', 'kick', 'neck', 'pack', 'rock', 'luck', 'they', 'are'] },
      { title: 'Silent e (a, i)', pattern: 'two-vowel words, silent e', words: ['cake', 'make', 'game', 'name', 'bike', 'kite', 'ride', 'time', 'come', 'some'] },
      { title: 'Silent e (o, u)', pattern: 'two-vowel words, silent e', words: ['home', 'bone', 'rope', 'nose', 'cute', 'mule', 'tune', 'rule', 'have', 'give'] },
      { title: 'ee and ea', pattern: 'two vowels together', words: ['see', 'tree', 'feet', 'keep', 'eat', 'read', 'sea', 'leaf', 'what', 'where'] },
      { title: 'ai and ay', pattern: 'two vowels together', words: ['rain', 'tail', 'paint', 'wait', 'day', 'play', 'say', 'stay', 'were', 'there'] },
      { title: 'oa and ow', pattern: 'long o teams', words: ['boat', 'coat', 'road', 'soap', 'snow', 'grow', 'show', 'slow', 'could', 'would'] },
      { title: 'Adding -ing and -ed', pattern: 'suffixes on roots', words: ['jumping', 'playing', 'helped', 'looked', 'singing', 'rested', 'reading', 'kicked', 'going', 'wanted'] }
    ],
    '2nd': [
      { title: 'ar and or', pattern: 'r-controlled vowels', words: ['car', 'star', 'park', 'farm', 'horn', 'fork', 'corn', 'storm', 'because', 'very'] },
      { title: 'er, ir, ur', pattern: 'r-controlled vowels', words: ['her', 'fern', 'bird', 'girl', 'first', 'turn', 'burn', 'nurse', 'their', 'again'] },
      { title: 'Doubling before -ing', pattern: 'double the last consonant', words: ['running', 'sitting', 'hopping', 'swimming', 'stopped', 'clapped', 'planned', 'shopping', 'every', 'many'] },
      { title: 'oi, oy, ou, ow', pattern: 'diphthongs', words: ['coin', 'boil', 'toy', 'boy', 'out', 'cloud', 'cow', 'town', 'other', 'about'] }
    ],
    '3rd': [
      { title: 'Silent letters', pattern: 'kn, wr, mb', words: ['knee', 'knock', 'know', 'write', 'wrong', 'wrap', 'lamb', 'climb', 'thumb', 'answer'] },
      { title: 'Changing y to i', pattern: 'y to i before -es, -ed', words: ['cries', 'tried', 'babies', 'pennies', 'cities', 'carried', 'hurried', 'stories', 'families', 'copied'] },
      { title: 'Compound words', pattern: 'two words joined', words: ['sunshine', 'baseball', 'rainbow', 'cupcake', 'homework', 'something', 'everyone', 'birthday', 'outside', 'football'] },
      { title: 'Prefixes un- and re-', pattern: 'prefixes', words: ['unhappy', 'unlock', 'unfair', 'untie', 'redo', 'reread', 'refill', 'rebuild', 'unkind', 'return'] }
    ],
    '4th': [
      { title: 'Long a spellings', pattern: 'a_e, ai, ay, eigh', words: ['brave', 'escape', 'chain', 'explain', 'display', 'holiday', 'neighbor', 'weight', 'eight', 'freight', 'remain', 'stale'] },
      { title: 'Long e spellings', pattern: 'ee, ea, ie, ei, y', words: ['freeze', 'agree', 'season', 'eager', 'field', 'piece', 'believe', 'receive', 'ceiling', 'family', 'easily', 'between'] },
      { title: 'i before e', pattern: 'i before e except after c', words: ['chief', 'thief', 'shield', 'niece', 'yield', 'receipt', 'deceive', 'conceit', 'their', 'weird', 'height', 'either'] },
      { title: 'Doubling rule', pattern: 'double the final consonant', words: ['beginning', 'forgotten', 'admitted', 'stopping', 'planning', 'occurred', 'preferred', 'regretted', 'committed', 'controlled', 'shipped', 'wrapping'] },
      { title: 'Dropping silent e', pattern: 'drop e before a vowel suffix', words: ['hoping', 'making', 'loving', 'arriving', 'surprised', 'decided', 'writing', 'saving', 'amazing', 'noticed', 'excited', 'closing'] },
      { title: 'Y to i', pattern: 'change y to i', words: ['happiness', 'easier', 'busiest', 'replied', 'studied', 'supplies', 'emptiness', 'heavier', 'worried', 'cozier', 'library', 'luckily'] },
      { title: 'Suffixes -ful, -less, -ness', pattern: 'suffixes', words: ['careful', 'thankful', 'powerful', 'helpless', 'careless', 'endless', 'kindness', 'darkness', 'sadness', 'fearless', 'peaceful', 'weakness'] },
      { title: 'Prefixes dis-, mis-, pre-', pattern: 'prefixes', words: ['disagree', 'disappear', 'dishonest', 'misspell', 'mistake', 'misplace', 'preview', 'prepare', 'prefix', 'preheat', 'dislike', 'misbehave'] },
      { title: 'Plurals', pattern: '-s, -es, -ves, irregular', words: ['wolves', 'halves', 'shelves', 'leaves', 'boxes', 'churches', 'potatoes', 'heroes', 'children', 'teeth', 'mice', 'geese'] },
      { title: 'Homophones', pattern: 'sound the same, spelled differently', words: ['their', 'there', 'they\'re', 'your', 'you\'re', 'its', 'it\'s', 'whose', 'who\'s', 'weather', 'whether', 'principal'] },
      { title: 'Science words: forces', pattern: 'content vocabulary', words: ['force', 'motion', 'friction', 'gravity', 'inertia', 'magnet', 'balanced', 'collision', 'energy', 'object', 'speed', 'direction'] },
      { title: 'Tricky -tion and -sion', pattern: 'endings', words: ['action', 'station', 'question', 'nation', 'mention', 'vacation', 'vision', 'decision', 'television', 'division', 'invention', 'direction'] }
    ]
  };
  ['5th', '6th', '7th', '8th'].forEach(g => { LISTS[g] = LISTS['4th']; });

  function listsFor(grade) { return LISTS[grade] || LISTS['1st']; }

  /* ---------- math generators: pure functions returning {q, a, say} ---------- */
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const SKILLS = {
    add10: { label: 'Adding to 10', grades: ['K', '1st'], gen() { const a = ri(0, 10), b = ri(0, 10 - a); return { q: `${a} + ${b}`, a: a + b }; } },
    sub10: { label: 'Taking away from 10', grades: ['K', '1st'], gen() { const a = ri(1, 10), b = ri(0, a); return { q: `${a} − ${b}`, a: a - b }; } },
    add18: { label: 'Adding to 18', grades: ['1st', '2nd'], gen() { const a = ri(2, 9), b = ri(2, 9); return { q: `${a} + ${b}`, a: a + b }; } },
    sub18: { label: 'Subtracting from 18', grades: ['1st', '2nd'], gen() { const b = ri(2, 9), c = ri(2, 9); return { q: `${b + c} − ${b}`, a: c }; } },
    missing: { label: 'Missing number', grades: ['1st', '2nd'], gen() { const a = ri(1, 9), b = ri(1, 9); return { q: `${a} + ? = ${a + b}`, a: b, say: `${a} plus what equals ${a + b}` }; } },
    skip: { label: 'Skip counting', grades: ['1st', '2nd'], gen() { const s = pick([2, 5, 10]), k = ri(1, 8); return { q: `${s * k}, ${s * (k + 1)}, ${s * (k + 2)}, ?`, a: s * (k + 3), say: `count by ${s}s. ${s * k}, ${s * (k + 1)}, ${s * (k + 2)}, what comes next` }; } },
    tens: { label: 'Tens and ones', grades: ['1st', '2nd'], gen() { const t = ri(1, 9), o = ri(0, 9); return { q: `${t} tens ${o} ones`, a: t * 10 + o, say: `${t} tens and ${o} ones` }; } },
    add2d: { label: 'Two-digit adding', grades: ['2nd', '3rd'], gen() { const a = ri(10, 89), b = ri(10, 99 - a); return { q: `${a} + ${b}`, a: a + b }; } },
    mul5: { label: 'Times tables 0–5', grades: ['2nd', '3rd', '4th'], gen() { const a = ri(0, 5), b = ri(0, 10); return { q: `${a} × ${b}`, a: a * b }; } },
    mul12: { label: 'Times tables to 12', grades: ['3rd', '4th', '5th'], gen() { const a = ri(2, 12), b = ri(2, 12); return { q: `${a} × ${b}`, a: a * b }; } },
    div12: { label: 'Division facts', grades: ['3rd', '4th', '5th'], gen() { const a = ri(2, 12), b = ri(2, 12); return { q: `${a * b} ÷ ${a}`, a: b }; } },
    mul2x1: { label: 'Two-digit × one-digit', grades: ['4th', '5th'], gen() { const a = ri(12, 99), b = ri(2, 9); return { q: `${a} × ${b}`, a: a * b }; } },
    mul10: { label: 'Multiply by 10, 100, 1000', grades: ['4th', '5th'], gen() { const a = ri(2, 99), b = pick([10, 100, 1000]); return { q: `${a} × ${b}`, a: a * b }; } },
    fracof: { label: 'Fraction of a number', grades: ['4th', '5th'], gen() { const d = pick([2, 3, 4, 5, 6, 8, 10]), k = ri(2, 9); return { q: `1/${d} of ${d * k}`, a: k, say: `one ${d === 2 ? 'half' : d === 4 ? 'fourth' : 'over ' + d} of ${d * k}` }; } },
    round: { label: 'Rounding to tens', grades: ['3rd', '4th'], gen() { let n = ri(11, 989); if (n % 10 === 5) n++; return { q: `Round ${n} to the nearest ten`, a: Math.round(n / 10) * 10, say: `round ${n} to the nearest ten` }; } }
  };
  function skillsFor(grade) { return Object.entries(SKILLS).filter(([, s]) => s.grades.includes(grade)).map(([id, s]) => ({ id, ...s })); }

  /* hidden pictures revealed tile by tile in math (emoji keeps them light and offline) */
  const PICTURES = ['🚀', '🦖', '🐙', '🦈', '🐉', '🌋', '🦉', '🐢', '🛸', '🏰', '🦁', '🐳', '🦕', '⚽', '🏎️', '🌈'];

  window.HubContent = { LISTS, listsFor, SKILLS, skillsFor, PICTURES };
})();
