/* ============================================================
   moji — puzzle data
   ------------------------------------------------------------
   Each puzzle is an emoji rebus in the spirit of a cryptic clue:
   the EMOJIS are the wordplay, the HINT is the definition, and
   the ANSWER drops into the letter boxes.

   The trick (like the "minute cryptic" book in the reference):
   read the emojis out loud and smush the sounds together.
     🐝 (bee) + 🍂 (leaf)  →  "bee-leaf"  →  BELIEF

   Fields:
     emojis  : array of emoji strings, joined with a "+" operator
     hint    : the definition, shown in serif (the cryptic "meaning")
     answer  : solution. Use spaces for multi-word answers.
     explain : the "aha" line revealed after a correct solve
   Add / reorder freely — the game reads this list top to bottom.
   ============================================================ */

window.MOJI_PUZZLES = [
  {
    emojis: ['🐝', '🍂'],
    hint: 'A firm conviction',
    answer: 'BELIEF',
    explain: '🐝 bee + 🍂 leaf → "bee-leaf" → BELIEF',
  },
  {
    emojis: ['🐱', '🐟'],
    hint: 'A whiskered swimmer',
    answer: 'CATFISH',
    explain: '🐱 cat + 🐟 fish → CATFISH',
  },
  {
    emojis: ['🔥', '🦊'],
    hint: 'It helps you browse the web',
    answer: 'FIREFOX',
    explain: '🔥 fire + 🦊 fox → FIREFOX',
  },
  {
    emojis: ['🧈', '🪰'],
    hint: 'It flutters through the garden',
    answer: 'BUTTERFLY',
    explain: '🧈 butter + 🪰 fly → BUTTERFLY',
  },
  {
    emojis: ['🌧️', '🎀'],
    hint: 'An arc of colour after the storm',
    answer: 'RAINBOW',
    explain: '🌧️ rain + 🎀 bow → RAINBOW',
  },
  {
    emojis: ['⭐', '🐟'],
    hint: 'Five arms, found in a tide pool',
    answer: 'STARFISH',
    explain: '⭐ star + 🐟 fish → STARFISH',
  },
];
