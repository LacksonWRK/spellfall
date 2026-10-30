# Spellfall Homeschool

A small learning hub for homeschool kids, built around **Spellfall**, a falling-words spelling and typing game. It started as a teaching tool for two brothers (1st and 4th grade) and is meant to grow into something other homeschool families can use, alongside whatever curriculum they follow.

It's a plain static website, with no accounts, no server, and no build step. Everything is saved in the browser on the device you use.

## What's in v1

| For kids | What it does |
|---|---|
| **Today** | A daily checklist per child. Linked items check themselves off when a session finishes. |
| **Spelling** (Spellfall) | Falling-words game with 3 worlds and 3 modes (visible, show-then-fade, listen-only), plus hidden-words spell-from-memory. |
| **Typing** | 24 lessons from home row to sentences, with a finger guide. |
| **Flashcards** | Fill-in-the-blank cards. Kids "climb the tower": 🪨 Stones (new), 🪜 Stairs (getting it), ⭐ Stars (learned). Includes hints, read-aloud, and retry. |
| **Math** | 20-problem fact drills. Each right answer uncovers part of a hidden picture, and spelling the picture early earns a bonus. Parents choose each child's skills in Parents → Math; Falling Facts uses the same picks. |
| **Phonics** | K–2nd games: Sound Sort, Blend Builder and the Magic-e Door. |
| **Spell-a-Rocket** | Words spelled right fuel a rocket, and tanks stack. Steer the flight, catch little rockets for fuel, dodge what slows you down, and beat your height record. |
| **Falling Facts** | Math problems or flashcard answers fall in the Spellfall game. |
| **Family goal** | Both kids fill one shared weekly meter. There is no leaderboard and no comparing siblings. |

| For parents | |
|---|---|
| **Photo → flashcards** | Snap a quiz or study sheet (multi-page OK). Claude turns it into cards, and you check every card before it saves. Answers Claude had to guess are flagged. |
| **Photo → spelling list** | Scan the weekly school list in Spellfall's grown-ups panel. |
| **Built-in spelling lists** | Original grade-based lists for weeks without a school list (K–8): phonics patterns for K–4, spelling patterns, Greek and Latin roots, and subject words for 5th–8th. Parents pick their curriculum in Settings; no publisher's lists are included. |
| **Progress** | Days active, sessions, tricky flashcards, math pictures, and Spellfall's own score and tricky-word history. |
| **Welcome** | Three steps for a new family: add kids, pick this week's words and curriculum, then practice the Parents button and set an optional PIN. |
| **Help** | A How do I list and a short guide for every section, from the kid picker footer or Parents → Help. Content lives in `js/help.js`. |
| **Printable page** | One page per child: the week's words on handwriting lines and a Monday–Friday checklist. |
| **Parent PIN** | Press-and-hold, then a 4-digit PIN. It's a kid deterrent, not real security. |
| **Backup / restore** | Download a JSON file, or restore from one. |

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

**GitHub Pages:** go to Settings → Pages → Deploy from branch → `main` / root. The site will be at `https://<user>.github.io/spellfall/`.

> Data lives in the browser (localStorage) for whichever address you open it from. Pick one URL per device and stick with it, and download a backup now and then.

## Photo scanning (optional)

Scanning uses **your own Anthropic API key**, called straight from the browser.

1. Create a key at <https://console.anthropic.com/settings/keys>.
2. Set a low monthly spend limit. A scanned page costs a few cents at most.
3. In the hub, go to **Parents → Settings** and paste the key.

Where things go:

- The key is stored only in that browser. It is never included in backups, and it is only sent to `api.anthropic.com`.
- Only the photo is sent to Claude, downscaled with location metadata removed. Kids' names and progress never leave the device.
- Everything else works without a key: you can type lists and cards by hand.
- The full plain-language privacy notice is `privacy.html` (linked from the kid picker, setup and Settings).
- The model defaults to `claude-sonnet-5-5`, and you can change it in Settings.

## Layout

```
index.html            hub shell
css/hub.css           chalkboard theme
css/fonts.css         Andika + Cabin Sketch, shipped in fonts/ (SIL Open Font License); no Google requests
js/core.js            storage (versioned, one family per browser), AI client, speech, PIN
js/content.js         built-in spelling lists and math skill generators by grade
js/hub.js             screens: kids, Today, flashcards, math, parent mode
js/help.js            parent help: How do I list + one guide per section
js/phonics.js         Sound Sort, Blend Builder, Magic-e Door
js/rocket.js          Spell-a-Rocket flight game
test/                 math audit (node test/math-audit.js) and a sample backup for testing
privacy.html          plain-language privacy notice
apps/spellfall/       the Spellfall game, reading kid profiles from the hub
```

Data model: `hub:v1:<familyId>` holds the family. Each kid has `spellfall`, `flashcards`, `math`, and an append-only `log` that feeds Today and the family meter. The schema is versioned in `core.js` with a migrations list.

## Roadmap (from the brainstorm)

- **Phonics:** read-aloud passages.
- **Math:** coin market, clock shop, fraction pizza.
- **Spelling:** auto weekly list from recent misses.
- **Science:** Newton's crash lab, rocket thrust, magnet maze.
- **Later:** offline mode, multiple families, an optional hosted "no key needed" scan.

## Feedback

Email spellfallsupport@gmail.com, or use **Send feedback** in the app (it fills in the version).

## Not affiliated

Spellfall Homeschool is an independent project. It is not affiliated with or endorsed by Abeka, BJU Press, The Good and the Beautiful, Sonlight, or any other curriculum publisher.

## License

MIT
