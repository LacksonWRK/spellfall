/* Parent help: the "How do I" list and one guide per section. Plain data; hub.js renders it at #/help.
   Keep every step true to the screens: when a screen changes, change its guide here too. */
(function () {
  'use strict';

  const HOWTO = [
    ['Set up Spellfall for the first time', 'start'],
    ['Put Spellfall on the iPad Home Screen', 'install'],
    ['Open the grown-ups settings', 'parents'],
    ['Add another child', 'parents'],
    ['Change a child’s name, grade or picture', 'parents'],
    ['Set this week’s spelling words', 'lists'],
    ['Print this week’s words and checklist', 'lists'],
    ['Scan the spelling list from school', 'lists'],
    ['Turn a quiz or study sheet into flashcards', 'flashcards'],
    ['Give a spelling test out loud', 'spelling'],
    ['Choose which math each child practices', 'math'],
    ['Practice phonics sounds (K–2nd)', 'phonics'],
    ['Launch the spelling rocket', 'rocket'],
    ['Make the spelling game easier or harder', 'spelling'],
    ['Change the daily checklist', 'today'],
    ['Change the weekly family goal', 'goal'],
    ['See how each child is doing', 'progress'],
    ['Keep the kids out of the settings', 'parents'],
    ['Back up, or move to a new iPad', 'backup'],
    ['Set up photo scanning', 'scanning']
  ];

  const TOPICS = [
    { id: 'start', icon: '👋', title: 'Getting started', sub: 'How Spellfall is laid out', body: `
      <p>Spellfall has two sides. <b>Kids</b> tap their own card on “Who’s learning?” and work through their <b>Today</b> list. <b>Grown-ups</b> press and hold the <b>Parents</b> button to set up lists, flashcards and settings.</p>
      <h3>Your first ten minutes</h3>
      <ol>
        <li>Add each child with their name and grade.</li>
        <li>Pick this week’s spelling words for each child: a built-in list for their grade, your own typed list, or a photo of the school list.</li>
        <li>Learn the Parents button: press and hold it for about a second until the ring fills.</li>
        <li>On an iPad or iPhone, add Spellfall to the Home Screen so its saved progress is kept.</li>
      </ol>
      <h3>A typical day</h3>
      <p>Your child taps their card, then works down the Today list: spelling game, flashcards, math facts, a typing lesson, reading. Each one checks itself off when it’s finished. Everything they do also fills the family goal for the week.</p>
      <p class="fine">Everything is saved on this device only. See <a href="#/help/backup">Backups</a>.</p>` },

    { id: 'install', icon: '📲', title: 'Home Screen app', sub: 'Keep progress safe on iPad and iPhone', body: `
      <p>Safari can erase a website’s saved progress if it isn’t opened for about a week. An app on the Home Screen keeps it, and it opens full screen without the address bar.</p>
      <ol>
        <li>Open Spellfall in <b>Safari</b>.</li>
        <li>Tap the <b>Share</b> button (a square with an arrow). On some iPhones it’s under the <b>⋯</b> button.</li>
        <li>Tap <b>Add to Home Screen</b>, then <b>Add</b>.</li>
        <li>From now on, open Spellfall from its icon.</li>
      </ol>
      <p class="note">The Home Screen app keeps its own storage, separate from Safari. If you already used Spellfall in Safari, download a backup there first, then restore it inside the app. See <a href="#/help/backup">Backups</a>.</p>` },

    { id: 'parents', icon: '🔑', title: 'Grown-ups settings and PIN', sub: 'Parents button, PIN, adding kids', body: `
      <h3>Open the settings</h3>
      <p>Press and hold the <b>Parents</b> button for about a second, until its ring fills. A quick tap only shows a reminder, which keeps little fingers out.</p>
      <p>Settings lock again on their own after 5 minutes without a tap. Tap <b>Done</b> to leave sooner.</p>
      <h3>Add a child</h3>
      <p><b>Parents → Kids &amp; progress → Add a child</b>. Type a first name, pick the grade, tap <b>Add child</b>.</p>
      <h3>Change a name, grade, picture or color</h3>
      <p><b>Parents → Kids &amp; progress</b>, then <b>Edit</b> under that child. Changes save as you make them. <b>Remove</b> deletes the child and all their progress.</p>
      <h3>Set a PIN</h3>
      <p><b>Parents → Settings → Parent PIN</b>. Type 4 digits and tap <b>Set PIN</b>. From then on the Parents button asks for it.</p>
      <p class="note">The PIN is a speed bump for kids, not a lock. Pick one you’ll remember: there is no PIN reset yet.</p>` },

    { id: 'today', icon: '✅', title: 'Today checklist', sub: 'The daily list each child sees', body: `
      <p>Every child sees the same checklist on their Today page, and it starts fresh each day.</p>
      <ul>
        <li>Items linked to a subject (spelling, flashcards, math, typing) check themselves off when your child finishes a session.</li>
        <li>Other items, like “Read aloud 15 minutes”, your child taps when done.</li>
      </ul>
      <h3>Change the list</h3>
      <p><b>Parents → Today plan</b>. Rename any item, choose what it links to (or <b>Tick by hand</b>), remove it with <b>×</b>, or tap <b>+ Add item</b>.</p>` },

    { id: 'spelling', icon: '✏️', title: 'Spelling game', sub: 'Falling words, worlds and modes', body: `
      <p>Your child’s spelling words fall from the sky in one of three worlds: <b>Space Meteors</b>, <b>Dino Volcano</b> or <b>Ocean Bubbles</b>. They type each word before it lands.</p>
      <h3>Three ways to play</h3>
      <ul>
        <li><b>Always visible</b>: the word stays on screen and wrong letters bounce off. Best for new spellers.</li>
        <li><b>Show, then fade</b>: the word shows for about 2 seconds, then turns to blanks. They spell it from memory.</li>
        <li><b>Listen only</b>: the word is read aloud and never shown, like a real spelling test.</li>
      </ul>
      <h3>Change the game</h3>
      <p>In the game, press and hold <b>Grown-ups</b>. Under <b>Game settings</b> you can choose the mode, how many misses end the game, the starting speed (Turtle, Bunny, Cheetah), how fast it speeds up, read-aloud and sound effects.</p>
      <p class="fine">Words your child misses show up as <b>Tricky words this week</b> in the game’s Progress card. See also <a href="#/help/hidden">Hidden words</a>.</p>` },

    { id: 'hidden', icon: '🙈', title: 'Hidden words', sub: 'Spell from memory', body: `
      <p>Each word shows for a moment, then gets covered. Your child spells it from memory and taps <b>Check</b>.</p>
      <ul>
        <li><b>Hear it</b> reads the word aloud. <b>Peek</b> shows it again.</li>
        <li>Kids can also spell out loud: tap the microphone on the iPad keyboard and say each letter slowly.</li>
      </ul>
      <p>Set how long each word shows in the game’s <b>Grown-ups → Game settings → Hidden words: look time</b>: from 2 seconds to “until they’re ready”.</p>` },

    { id: 'typing', icon: '⌨️', title: 'Typing', sub: '24 lessons, home row to sentences', body: `
      <p>Typing practice starts at the home row (F and J) and builds up through the top row, bottom row, Shift and numbers: 24 lessons. Passing a lesson earns stars and unlocks the next one.</p>
      <p>A keyboard guide shows which finger to use. By default it fades out as your child learns, so they stop looking down.</p>
      <h3>Change it</h3>
      <p>In the game, press and hold <b>Grown-ups</b>, then <b>Typing practice</b>. You can unlock lessons ahead, move back to review, change the keyboard guide, and see trouble keys.</p>
      <p class="fine">Typing works best with a keyboard attached to the iPad.</p>` },

    { id: 'phonics', icon: '🔤', title: 'Phonics', sub: 'Three sound games for K–2nd', body: `
      <p>Tap <b>Phonics</b> on your child’s page and pick a game. Each game is 8 words, and every word is read aloud.</p>
      <ul>
        <li><b>Sound Sort</b>: a word drifts down and your child taps the bin it belongs in, like <b>ee</b> or <b>ea</b>, <b>ai</b> or <b>ay</b>, <b>sh / ch / th</b>, or short a vs. long a. Tap the word to hear it again.</li>
        <li><b>Blend Builder</b>: your child hears a word and taps letter tiles in order to build it. Tap a letter in the word to take it back. Kindergarten gets short words like <i>cat</i>, 1st grade gets blends like <i>frog</i>, 2nd grade and up get longer words like <i>storm</i>.</li>
        <li><b>Magic-e Door</b>: tap <b>+ e</b> and hear the word change, like <i>cap</i> to <i>cape</i>. Then your child picks which of the two words they heard.</li>
      </ul>
      <p>A first-try answer counts toward the stars. A finished game checks off a Today item linked to <b>Phonics</b>. To add one, see <a href="#/help/today">Today checklist</a>.</p>` },

    { id: 'rocket', icon: '🚀', title: 'Spell-a-Rocket', sub: 'Spelling fuels a launch', body: `
      <p>Every word your child spells right in the spelling game or hidden words adds one unit of fuel. The results screen shows how much they earned. The tank holds 25.</p>
      <p>When the tank is full, the <b>Rocket</b> tile on their page says <b>Ready to launch!</b> A needle swings across a power meter. Tapping <b>Launch</b> while it’s in the green gives the most thrust and the straightest flight.</p>
      <p>The flight uses real thrust, gravity and air drag. Its highest point is the score, and the best one is your child’s record to beat. A launch uses the whole tank, so it’s back to spelling to refuel.</p>` },

    { id: 'lists', icon: '📝', title: 'Spelling lists', sub: 'Typed, built-in, or scanned', body: `
      <p>Each child has one list for the week. Setting a new one moves the old list to <b>Past weeks</b>, with its scores.</p>
      <h3>Type a list</h3>
      <p><b>Parents → Spelling lists</b>, choose the child, type one word per line, tap <b>Save as this week’s list</b>.</p>
      <h3>Use a built-in list</h3>
      <p>Same screen, under <b>Built-in lists</b>: original lists for each grade, grouped by phonics pattern. Tap <b>Use this week</b>. Pick your curriculum in <b>Parents → Settings</b> so the lists are described the right way.</p>
      <h3>Scan the list from school</h3>
      <ol>
        <li>Set up <a href="#/help/scanning">photo scanning</a> first.</li>
        <li><b>Parents → Spelling lists → Scan a school list</b>. That opens the game’s grown-ups page.</li>
        <li>Tap <b>Scan a photo</b> (or <b>Scan next week’s list</b>) and take a picture of the list.</li>
        <li>Check the words. Any that were hard to read are pointed out. Then save.</li>
      </ol>
      <h3>Print the week</h3>
      <p><b>Parents → Spelling lists → Print page</b> prints one child’s page: this week’s words on handwriting lines with two practice spaces each, and the Today checklist as a Monday–Friday grid for the fridge. <b>Parents → Today plan → Print weekly pages</b> prints a page for every child. On an iPad, choose your printer or <b>Save to Files</b> to keep a PDF.</p>` },

    { id: 'flashcards', icon: '🃏', title: 'Flashcards', sub: 'Climb the tower', body: `
      <p>Flashcards are fill-in-the-blank sentences. Cards climb a tower as your child learns them: <b>🪨 Stones</b> (new), <b>🪜 Stairs</b> (getting it), <b>⭐ Stars</b> (learned).</p>
      <ul>
        <li>Right on the first try moves a card up. A miss sends it back to the Stones.</li>
        <li>After a miss your child gets a hint (the letter count, then the first letter). After three misses, or <b>Show me</b>, the answer appears and they type it once.</li>
        <li><b>Read it to me</b> reads the card aloud. Cards read themselves for K–2nd grade.</li>
        <li>Each practice is up to 12 cards: the new ones and the ones still climbing.</li>
      </ul>
      <h3>Make a deck from a photo</h3>
      <ol>
        <li>Set up <a href="#/help/scanning">photo scanning</a> first.</li>
        <li><b>Parents → Flashcards</b>, choose the child, tap <b>Scan pages</b>. You can pick several photos for a multi-page quiz.</li>
        <li>Check every card. Answers Claude had to guess are flagged. Fix or remove any, then save.</li>
      </ol>
      <p><b>Falling flashcards</b>: on the Flashcards screen tap <b>Falling flashcards</b>, or choose <b>Flashcards</b> in the spelling game. A clue shows at the top and its answer falls as blanks; your child types it before it lands. It’s for practice and doesn’t move cards up the tower.</p>
      <p>No scanning? Tap <b>Type cards</b> to make them by hand. Each deck can be edited, restarted from the Stones, or deleted.</p>` },

    { id: 'math', icon: '➗', title: 'Math facts', sub: '20-problem drills with a hidden picture', body: `
      <p>Your child picks a skill and answers 20 problems. Each right answer uncovers part of a hidden picture.</p>
      <ul>
        <li>A wrong answer gets one more try. After that the answer is shown and the drill moves on.</li>
        <li>The end screen shows the score, time, a new best, and a <b>Practice these</b> list of misses.</li>
        <li><b>Read it to me</b> reads the problem aloud.</li>
      </ul>
      <h3>Guess the hidden picture</h3>
      <p>After a few problems your child can tap <b>I know what it is!</b> and spell the picture. Spelling it right shows the whole picture and earns a picture found plus 3 bonus stars for the family goal when they finish their 20 problems. So nobody skips the math.</p>
      <p>A wrong guess costs nothing. They just solve 3 more problems before guessing again. Getting all 20 right on the first try also counts as a picture found. Kindergarten to 2nd grade get easier pictures to spell, like <i>car</i> and <i>fish</i>.</p>
      <p><b>Falling Facts</b>: tap <b>Falling Facts</b> on the Math screen, or choose <b>Math facts</b> in the spelling game. The math you’ve turned on falls from the sky and they type each answer before it lands. Same worlds, speed and miss settings as the spelling game.</p>
      <h3>Choose the math</h3>
      <p><b>Parents → Math</b>, then pick the child. Each skill has an on/off switch, grouped as Adding, Subtracting, Multiplying, Dividing and so on. What you turn on is exactly what shows up in Math facts and Falling Facts, for that child only. Any skill can be on, even from another grade, so you can move a child up or down.</p>
      <ul>
        <li>Until you change a switch, each child gets the usual picks for their grade and they follow the grade. Kindergarten starts with adding to 10, 1st grade with adding only, 2nd grade with adding, subtracting and number skills but no multiplying yet, and 3rd grade and up with everything for their grade.</li>
        <li>Once you change a switch, your choices stay put if the grade changes. <b>Use the grade’s picks</b> goes back to the usual ones.</li>
        <li>Skills marked <b>Math facts only</b>, like Tens and ones, use words, so they stay in Math facts and don’t fall in Falling Facts.</li>
      </ul>
      <p class="fine">For negative answers, type a minus sign first, like -3.</p>` },

    { id: 'goal', icon: '🏆', title: 'Family goal', sub: 'One shared weekly meter', body: `
      <p>All your kids fill one meter together each week, so a brother’s win is everyone’s win. There’s no leaderboard and no comparing.</p>
      <p>Finished sessions and ticked items add stars. The meter starts over every Monday. When it’s full, the kids see a note to ask a grown-up about the family reward. You choose the reward.</p>
      <h3>Change the goal</h3>
      <p><b>Parents → Today plan → Family goal per week</b>. About 10 stars is one full day for one child.</p>` },

    { id: 'progress', icon: '📈', title: 'Progress', sub: 'See how each child is doing', body: `
      <p><b>Parents → Kids &amp; progress</b> shows each child’s Today count, days active this week, sessions, math pictures, and flashcards that are still tricky.</p>
      <p>For spelling and typing detail, open the game’s <b>Grown-ups</b> page: best score, words spelled, tricky words this week, recent games, typing stars and trouble keys.</p>` },

    { id: 'scanning', icon: '📷', title: 'Photo scanning', sub: 'Optional, with your own key', body: `
      <p>Scanning turns a photo of a spelling list or quiz into words or flashcards. It uses Claude, made by Anthropic, with <b>your own Anthropic API key</b>. Everything else in Spellfall works without it.</p>
      <ol>
        <li>Go to <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>, sign up, and add a small amount of credit.</li>
        <li>Set a low monthly spend limit. A scanned page costs a few cents at most.</li>
        <li>Create an API key and copy it.</li>
        <li>In Spellfall: <b>Parents → Settings → Claude photo scanning</b>. Paste the key, tap <b>Save</b>, then <b>Test</b>.</li>
      </ol>
      <p>Only the photo is sent, shrunk and with location data removed. Kids’ names and progress never leave the device. The key stays on this device and is never put in backups. <a href="privacy.html">Privacy details</a></p>` },

    { id: 'backup', icon: '💾', title: 'Backups and moving devices', sub: 'Don’t lose progress', body: `
      <p>Everything is saved on this device only. If the device is lost, or its website data is cleared, the progress is gone unless you have a backup file. Spellfall reminds you after two weeks.</p>
      <h3>Make a backup</h3>
      <p><b>Parents → Backup → Download backup</b>. Keep the file somewhere safe, like Files or iCloud Drive.</p>
      <h3>Move to a new iPad, or into the Home Screen app</h3>
      <ol>
        <li>On the old device (or in Safari), download a backup.</li>
        <li>On the new device (or in the Home Screen app), open <b>Parents → Backup → Restore from a file</b>.</li>
        <li>Pick the backup file and tap <b>Restore</b>.</li>
      </ol>
      <p class="note">Restoring replaces everything on that device. Backups include kids, lists, flashcards and progress, but never your API key.</p>` }
  ];

  window.HubHelp = { HOWTO, TOPICS };
})();
