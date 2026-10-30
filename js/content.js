/* Built-in content. Word lists are original. K-4 are grouped by the phonics patterns and spelling
   rules that Abeka's published scope & sequence lists for each grade (not copied from Abeka);
   5th-8th follow common upper-grade spelling patterns, Greek and Latin roots, and subject vocabulary. */
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
    ],
    '5th': [
      { title: 'Roots port and tract', pattern: 'Latin roots: carry, pull', words: ['transport', 'portable', 'import', 'export', 'report', 'support', 'tractor', 'attract', 'subtract', 'distract', 'extract', 'contract'] },
      { title: '-able and -ible', pattern: 'suffixes', words: ['comfortable', 'valuable', 'reasonable', 'breakable', 'enjoyable', 'available', 'possible', 'terrible', 'visible', 'flexible', 'horrible', 'invisible'] },
      { title: '-ant and -ent', pattern: 'suffixes', words: ['important', 'distant', 'elegant', 'pleasant', 'assistant', 'constant', 'different', 'excellent', 'patient', 'silent', 'student', 'frequent'] },
      { title: '-ous endings', pattern: 'suffix -ous', words: ['famous', 'nervous', 'dangerous', 'enormous', 'generous', 'curious', 'furious', 'various', 'obvious', 'gorgeous', 'courageous', 'mysterious'] },
      { title: 'Prefixes in-, im-, il-, ir-', pattern: 'prefixes meaning not', words: ['inactive', 'incomplete', 'independent', 'impossible', 'impatient', 'imperfect', 'immature', 'illegal', 'illogical', 'irregular', 'irresponsible', 'irrelevant'] },
      { title: '-ture and -sure', pattern: 'endings', words: ['picture', 'nature', 'future', 'adventure', 'furniture', 'creature', 'temperature', 'measure', 'treasure', 'pleasure', 'pressure', 'enclosure'] },
      { title: 'Silent letters', pattern: 'g, s, t, h, b, n you don’t hear', words: ['design', 'foreign', 'island', 'listen', 'castle', 'whistle', 'honest', 'rhyme', 'ghost', 'autumn', 'column', 'doubt'] },
      { title: '-ment and -ity', pattern: 'noun suffixes', words: ['agreement', 'equipment', 'excitement', 'government', 'environment', 'measurement', 'activity', 'electricity', 'community', 'curiosity', 'ability', 'majority'] },
      { title: 'Science words: space', pattern: 'content vocabulary', words: ['atmosphere', 'satellite', 'orbit', 'galaxy', 'telescope', 'eclipse', 'meteor', 'planet', 'universe', 'crater', 'rotation', 'gravity'] }
    ],
    '6th': [
      { title: 'Roots spect, struct, rupt', pattern: 'Latin roots: look, build, break', words: ['inspect', 'spectator', 'respect', 'spectacle', 'construct', 'structure', 'destruction', 'instruct', 'erupt', 'interrupt', 'bankrupt', 'disrupt'] },
      { title: 'Roots graph, phon, tele', pattern: 'Greek roots: write, sound, far', words: ['autograph', 'paragraph', 'photograph', 'biography', 'telephone', 'symphony', 'microphone', 'phonics', 'television', 'telescope', 'telegraph', 'saxophone'] },
      { title: '-ance and -ence', pattern: 'noun suffixes', words: ['appearance', 'attendance', 'importance', 'allowance', 'ignorance', 'tolerance', 'confidence', 'difference', 'evidence', 'audience', 'existence', 'independence'] },
      { title: '-cian, -tion, -sion', pattern: 'endings that sound like shun', words: ['musician', 'magician', 'electrician', 'physician', 'politician', 'pollution', 'attention', 'population', 'explosion', 'confusion', 'permission', 'expression'] },
      { title: 'Easily confused words', pattern: 'look or sound alike', words: ['affect', 'effect', 'accept', 'except', 'advice', 'advise', 'loose', 'lose', 'desert', 'dessert', 'quiet', 'quite'] },
      { title: 'Prefixes sub-, inter-, trans-, super-', pattern: 'prefixes', words: ['submarine', 'submerge', 'subtitle', 'international', 'interview', 'intersection', 'transform', 'translate', 'transparent', 'superior', 'supervise', 'supermarket'] },
      { title: 'Often misspelled', pattern: 'words to memorize', words: ['necessary', 'separate', 'definitely', 'probably', 'especially', 'restaurant', 'February', 'Wednesday', 'schedule', 'sincerely', 'business', 'recommend'] },
      { title: 'Math words', pattern: 'content vocabulary', words: ['numerator', 'denominator', 'equation', 'variable', 'expression', 'perimeter', 'diameter', 'circumference', 'percent', 'ratio', 'integer', 'probability'] }
    ],
    '7th': [
      { title: 'Roots ject, vert, dict', pattern: 'Latin roots: throw, turn, say', words: ['project', 'reject', 'inject', 'objection', 'convert', 'reverse', 'vertical', 'advertise', 'predict', 'dictionary', 'contradict', 'verdict'] },
      { title: 'Roots bio, geo, chron, therm', pattern: 'Greek roots: life, earth, time, heat', words: ['biology', 'biome', 'antibiotic', 'geography', 'geology', 'geometry', 'chronic', 'chronological', 'synchronize', 'thermometer', 'thermal', 'thermostat'] },
      { title: 'Doubling and stress', pattern: 'double when the stress is on the last syllable', words: ['occurrence', 'referral', 'transferred', 'permitted', 'forbidden', 'compelling', 'equipped', 'omitted', 'beginner', 'benefited', 'traveled', 'offering'] },
      { title: '-ary, -ery, -ory', pattern: 'endings', words: ['vocabulary', 'ordinary', 'imaginary', 'temporary', 'military', 'cemetery', 'stationery', 'scenery', 'laboratory', 'territory', 'inventory', 'mandatory'] },
      { title: 'ph, ps, rh', pattern: 'Greek spellings', words: ['physical', 'phrase', 'sphere', 'pharmacy', 'emphasis', 'triumph', 'catastrophe', 'phenomenon', 'psychology', 'rhythm', 'rhinoceros', 'rhetoric'] },
      { title: 'Often misspelled', pattern: 'words to memorize', words: ['conscious', 'guarantee', 'judgment', 'knowledge', 'maintenance', 'occasionally', 'privilege', 'recognize', 'tomorrow', 'until', 'achievement', 'argument'] },
      { title: '-ize, -ify, -ate', pattern: 'verb suffixes', words: ['organize', 'memorize', 'apologize', 'criticize', 'classify', 'identify', 'simplify', 'justify', 'celebrate', 'communicate', 'demonstrate', 'illustrate'] },
      { title: 'Life science words', pattern: 'content vocabulary', words: ['photosynthesis', 'chlorophyll', 'organism', 'membrane', 'nucleus', 'bacteria', 'ecosystem', 'habitat', 'adaptation', 'species', 'vertebrate', 'cell'] }
    ],
    '8th': [
      { title: '-cede, -ceed, -sede', pattern: 'go, yield', words: ['precede', 'recede', 'concede', 'intercede', 'secede', 'succeed', 'proceed', 'exceed', 'supersede', 'procedure', 'excessive', 'succession'] },
      { title: 'Roots bene, mal, cred, voc', pattern: 'Latin roots: good, bad, believe, voice', words: ['benefit', 'beneficial', 'benevolent', 'malfunction', 'malicious', 'malnutrition', 'credible', 'incredible', 'credit', 'vocal', 'advocate', 'provoke'] },
      { title: 'Roots crat, path, psych, auto', pattern: 'Greek roots: rule, feeling, mind, self', words: ['democracy', 'aristocrat', 'bureaucracy', 'sympathy', 'empathy', 'pathetic', 'psychiatrist', 'psyche', 'automatic', 'autonomy', 'autobiography', 'automobile'] },
      { title: 'Tricky double letters', pattern: 'words to memorize', words: ['accommodate', 'embarrass', 'harass', 'millennium', 'committee', 'possession', 'occasion', 'parallel', 'address', 'aggressive', 'broccoli', 'questionnaire'] },
      { title: '-ible and -able, harder', pattern: 'suffixes', words: ['irresistible', 'responsible', 'accessible', 'permissible', 'compatible', 'indispensable', 'noticeable', 'manageable', 'knowledgeable', 'changeable', 'dependable', 'inevitable'] },
      { title: 'Easily confused words', pattern: 'look or sound alike', words: ['complement', 'compliment', 'principle', 'stationary', 'capital', 'capitol', 'council', 'counsel', 'elicit', 'illicit', 'emigrate', 'immigrate'] },
      { title: 'Hidden vowels', pattern: 'unstressed and silent vowels', words: ['conscience', 'conscientious', 'mischievous', 'pronunciation', 'definite', 'desperate', 'miniature', 'temperament', 'category', 'sophomore', 'liaison', 'hygiene'] },
      { title: 'Government words', pattern: 'content vocabulary', words: ['constitution', 'amendment', 'legislature', 'judicial', 'executive', 'citizenship', 'republic', 'ratify', 'federal', 'sovereignty', 'colonial', 'abolition'] }
    ]
  };
  // K-4 lists follow Abeka's published order of patterns; 5th-8th are general upper-grade patterns
  const ABEKA_GRADES = ['K', '1st', '2nd', '3rd', '4th'];

  function listsFor(grade) { return LISTS[grade] || LISTS['1st']; }

  /* ---------- math generators: pure functions returning {q, a, say} ---------- */
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
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
    round: { label: 'Rounding to tens', grades: ['3rd', '4th'], gen() { let n = ri(11, 989); if (n % 10 === 5) n++; return { q: `Round ${n} to the nearest ten`, a: Math.round(n / 10) * 10, say: `round ${n} to the nearest ten` }; } },
    pct: { label: 'Percent of a number', grades: ['6th', '7th'], gen() { const p = pick([10, 20, 25, 50, 75]), n = pick([20, 40, 60, 80, 100, 120, 200, 400]); return { q: `${p}% of ${n}`, a: p * n / 100, say: `${p} percent of ${n}` }; } },
    rate: { label: 'Unit rates', grades: ['6th', '7th'], gen() { const u = ri(2, 12), t = ri(2, 9); return { q: `${u * t} miles in ${t} hours: miles per hour?`, a: u }; } },
    ops: { label: 'Order of operations', grades: ['6th', '7th'], gen() { const a = ri(2, 20), b = ri(2, 9), c = ri(2, 9); return pick([{ q: `${a} + ${b} × ${c}`, a: a + b * c, say: `${a} plus ${b} times ${c}` }, { q: `(${a} + ${b}) × ${c}`, a: (a + b) * c, say: `${a} plus ${b}, in parentheses, times ${c}` }]); } },
    sq: { label: 'Squares and exponents', grades: ['6th', '7th', '8th'], gen() { return pick([() => { const n = ri(2, 15); return { q: `${n}²`, a: n * n, say: `${n} squared` }; }, () => { const n = ri(1, 9); return { q: `2${'⁰¹²³⁴⁵⁶⁷⁸⁹'[n]}`, a: 2 ** n, say: `2 to the power of ${n}` }; }, () => { const n = ri(2, 5); return { q: `${n}³`, a: n ** 3, say: `${n} cubed` }; }])(); } },
    gcf: { label: 'Greatest common factor', grades: ['6th'], gen() { const g = ri(2, 12); let a = ri(1, 6), b = ri(1, 6); while (gcd(a, b) !== 1 || a === b) { a = ri(1, 6); b = ri(1, 6); } return { q: `GCF of ${g * a} and ${g * b}?`, a: g, say: `greatest common factor of ${g * a} and ${g * b}` }; } },
    lcm: { label: 'Least common multiple', grades: ['6th'], gen() { let a = ri(2, 12), b = ri(2, 12); while (a === b) b = ri(2, 12); return { q: `LCM of ${a} and ${b}?`, a: a * b / gcd(a, b), say: `least common multiple of ${a} and ${b}` }; } },
    intadd: { label: 'Adding and subtracting integers', grades: ['7th', '8th'], neg: true, gen() { const a = ri(-15, 15), b = ri(-15, 15), add = Math.random() < .5; return { q: `${a} ${add ? '+' : '−'} ${b < 0 ? `(${b})` : b}`.replace(/-/g, '−'), a: add ? a + b : a - b, say: `${a} ${add ? 'plus' : 'minus'} ${b}`.replace(/-/g, 'negative ') }; } },
    intmul: { label: 'Multiplying and dividing integers', grades: ['7th', '8th'], neg: true, gen() { const a = ri(-12, 12) || 3, b = ri(-12, 12) || -4; return pick([{ q: `${a} × ${b < 0 ? `(${b})` : b}`.replace(/-/g, '−'), a: a * b, say: `${a} times ${b}`.replace(/-/g, 'negative ') }, { q: `${a * b} ÷ ${b < 0 ? `(${b})` : b}`.replace(/-/g, '−'), a: a, say: `${a * b} divided by ${b}`.replace(/-/g, 'negative ') }]); } },
    eq1: { label: 'One-step equations', grades: ['7th'], neg: true, gen() { const x = ri(-9, 15), k = ri(2, 12); return pick([{ q: `x + ${k} = ${x + k}`.replace(/-/g, '−'), a: x, say: `x plus ${k} equals ${x + k}. What is x?`.replace(/-/g, 'negative ') }, { q: `${k}x = ${k * x}`.replace(/-/g, '−'), a: x, say: `${k} x equals ${k * x}. What is x?`.replace(/-/g, 'negative ') }]); } },
    prop: { label: 'Proportions', grades: ['7th'], gen() { const a = ri(1, 9), b = ri(a + 1, 12), m = ri(2, 8); return { q: `${a}/${b} = x/${b * m}`, a: a * m, say: `${a} over ${b} equals x over ${b * m}. What is x?` }; } },
    eq2: { label: 'Two-step equations', grades: ['8th'], neg: true, gen() { const x = ri(-9, 12), k = ri(2, 9), c = ri(1, 20); return { q: `${k}x + ${c} = ${k * x + c}`.replace(/-/g, '−'), a: x, say: `${k} x plus ${c} equals ${k * x + c}. What is x?`.replace(/-/g, 'negative ') }; } },
    roots: { label: 'Square and cube roots', grades: ['8th'], gen() { return Math.random() < .7 ? (n => ({ q: `√${n * n}`, a: n, say: `the square root of ${n * n}` }))(ri(2, 15)) : (n => ({ q: `∛${n ** 3}`, a: n, say: `the cube root of ${n ** 3}` }))(ri(2, 6)); } },
    slope: { label: 'Slope from two points', grades: ['8th'], neg: true, gen() { const m = pick([-4, -3, -2, -1, 1, 2, 3, 4, 5]), x1 = ri(-5, 5), y1 = ri(-5, 5), dx = ri(1, 4); return { q: `Slope through (${x1}, ${y1}) and (${x1 + dx}, ${y1 + m * dx})?`.replace(/-/g, '−'), a: m, say: `slope of the line through ${x1} comma ${y1} and ${x1 + dx} comma ${y1 + m * dx}`.replace(/-/g, 'negative ') }; } },
    pyth: { label: 'Pythagorean theorem', grades: ['8th'], gen() { const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]), k = pick([1, 1, 2, 3]); return { q: `Legs ${a * k} and ${b * k}: hypotenuse?`, a: c * k, say: `a right triangle has legs ${a * k} and ${b * k}. How long is the hypotenuse?` }; } },
    sci: { label: 'Powers of ten', grades: ['8th'], gen() { const n = ri(2, 9), e = ri(3, 8); return { q: `${(n * 10 ** e).toLocaleString('en-US')} = ${n} × 10^?`, a: e, say: `${n * 10 ** e} equals ${n} times 10 to what power?` }; } },
  };
  function skillsFor(grade) { return Object.entries(SKILLS).filter(([, s]) => s.grades.includes(grade)).map(([id, s]) => ({ id, ...s })); }

  /* Which skills a child practices. kid.math.on (skill ids) is the parent's choice; with none saved the
     grade's defaults apply, so a grade change follows along. skillsForKid drives the drill screen and
     Falling Facts both, so the two can't disagree. */
  const DEFAULT_ON = { K: ['add10'], '1st': ['add10', 'add18'], '2nd': ['add18', 'sub18', 'missing', 'skip', 'tens', 'add2d'] };
  const defaultMathOn = grade => DEFAULT_ON[grade] || skillsFor(grade).map(s => s.id);
  function mathOnIds(kid) { const saved = kid.math && kid.math.on, on = Array.isArray(saved) ? saved : defaultMathOn(kid.grade); return Object.keys(SKILLS).filter(id => on.includes(id)); }
  const skillsForKid = kid => mathOnIds(kid).map(id => ({ id, ...SKILLS[id] }));
  const MATH_GROUPS = [
    ['Adding', ['add10', 'add18', 'add2d']],
    ['Subtracting', ['sub10', 'sub18']],
    ['Multiplying', ['mul5', 'mul12', 'mul2x1', 'mul10']],
    ['Dividing', ['div12']],
    ['Numbers and place value', ['missing', 'skip', 'tens', 'round']],
    ['Fractions and percents', ['fracof', 'pct', 'rate', 'prop']],
    ['Factors, powers and roots', ['ops', 'gcf', 'lcm', 'sq', 'roots', 'sci']],
    ['Negative numbers', ['intadd', 'intmul']],
    ['Equations and geometry', ['eq1', 'eq2', 'slope', 'pyth']]
  ];
  /* Falling Facts: a rock has room for a short problem, and it should read as clean math */
  const fallsOnARock = q => q.length <= 14 && !/[=?a-z]/i.test(q);
  const skillFalls = sk => { for (let i = 0; i < 8; i++) if (!fallsOnARock(sk.gen().q)) return false; return true; };
  const fallingFor = kid => skillsForKid(kid).filter(skillFalls);

  /* hidden pictures revealed tile by tile in math (emoji keeps them light and offline). A child can
     guess one by spelling it: `ok` is every spelling that counts. age: K-2nd get 'young' + 'all', 3rd and up get 'older' + 'all'. */
  const PICTURES = [
    { art: '🚗', name: 'car', ok: ['car', 'racecar', 'automobile'], age: 'young' },
    { art: '🚌', name: 'bus', ok: ['bus', 'schoolbus'], age: 'young' },
    { art: '🐱', name: 'cat', ok: ['cat', 'kitty', 'kitten'], age: 'young' },
    { art: '🐶', name: 'dog', ok: ['dog', 'puppy', 'pup', 'doggy'], age: 'young' },
    { art: '🐷', name: 'pig', ok: ['pig', 'piggy', 'hog'], age: 'young' },
    { art: '🐮', name: 'cow', ok: ['cow'], age: 'young' },
    { art: '🐟', name: 'fish', ok: ['fish'], age: 'young' },
    { art: '🐸', name: 'frog', ok: ['frog'], age: 'young' },
    { art: '🦆', name: 'duck', ok: ['duck', 'duckling'], age: 'young' },
    { art: '🐝', name: 'bee', ok: ['bee', 'honeybee', 'bumblebee'], age: 'young' },
    { art: '🌳', name: 'tree', ok: ['tree'], age: 'young' },
    { art: '⭐', name: 'star', ok: ['star'], age: 'young' },
    { art: '🌙', name: 'moon', ok: ['moon'], age: 'young' },
    { art: '⛵', name: 'boat', ok: ['boat', 'sailboat', 'ship'], age: 'young' },
    { art: '🎂', name: 'cake', ok: ['cake', 'birthdaycake'], age: 'young' },
    { art: '🍎', name: 'apple', ok: ['apple'], age: 'young' },
    { art: '🚀', name: 'rocket', ok: ['rocket', 'rocketship', 'spaceship'], age: 'all' },
    { art: '🦖', name: 'dinosaur', ok: ['dinosaur', 'dino', 'trex', 'tyrannosaurus', 'tyrannosaurusrex'], age: 'all' },
    { art: '🦈', name: 'shark', ok: ['shark'], age: 'all' },
    { art: '🦉', name: 'owl', ok: ['owl'], age: 'all' },
    { art: '🦁', name: 'lion', ok: ['lion'], age: 'all' },
    { art: '🐳', name: 'whale', ok: ['whale'], age: 'all' },
    { art: '🐙', name: 'octopus', ok: ['octopus'], age: 'older' },
    { art: '🐉', name: 'dragon', ok: ['dragon'], age: 'older' },
    { art: '🌋', name: 'volcano', ok: ['volcano'], age: 'older' },
    { art: '🐢', name: 'turtle', ok: ['turtle', 'tortoise'], age: 'older' },
    { art: '🏰', name: 'castle', ok: ['castle'], age: 'older' },
    { art: '🌈', name: 'rainbow', ok: ['rainbow'], age: 'older' },
    { art: '🤖', name: 'robot', ok: ['robot'], age: 'older' },
    { art: '🐧', name: 'penguin', ok: ['penguin'], age: 'older' },
    { art: '🦋', name: 'butterfly', ok: ['butterfly'], age: 'older' },
    { art: '🐘', name: 'elephant', ok: ['elephant'], age: 'older' }
  ];
  const picturesFor = grade => PICTURES.filter(p => p.age === 'all' || p.age === (['K', '1st', '2nd'].includes(grade) ? 'young' : 'older'));
  const guessKey = s => String(s || '').toLowerCase().replace(/^\s*(a|an|the)\s+/, '').replace(/[^a-z]/g, ''); // "a Race car" -> racecar
  const pictureMatches = (pic, text) => pic.ok.includes(guessKey(text));

  window.HubContent = { LISTS, listsFor, ABEKA_GRADES, SKILLS, skillsFor, defaultMathOn, mathOnIds, skillsForKid, MATH_GROUPS, skillFalls, fallingFor, PICTURES, picturesFor, pictureMatches, guessKey };
})();
