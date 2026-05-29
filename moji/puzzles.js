/* ============================================================
   moji — puzzle data
   ------------------------------------------------------------
   Each puzzle is an emoji rebus in the spirit of a cryptic clue:
   the EMOJIS are the wordplay, the HINT is the definition, and
   the ANSWER drops into the letter boxes.

   The trick: read the emojis out loud and smush the sounds
   together — the answer is rarely the literal picture.
     🐝 (bee) + 🍃 (leaf)  →  "bee-leaf"  →  BELIEF

   Fields:
     emojis  : array of emoji strings, joined with a "+" operator
     hint    : the definition, shown in serif (the cryptic "meaning")
     answer  : solution. Use spaces for multi-word answers.
     explain : the "aha" line revealed after a correct solve
   Add / reorder freely — the game reads this list top to bottom.
   ============================================================ */

window.MOJI_PUZZLES = [
  {
    emojis: ['🐝', '🍃'],
    hint: 'A firm conviction',
    answer: 'BELIEF',
    explain: '🐝 bee + 🍃 leaf → "bee-leaf" → BELIEF',
  },
  {
    emojis: ['👨‍🍳', '🧆'],
    hint: 'He rolls the meatballs',
    answer: 'COOK',
    explain: '👨‍🍳 the one rolling the 🧆 meatballs is a COOK',
  },
  {
    emojis: ['🧈', '🪰'],
    hint: 'It flutters through the garden',
    answer: 'BUTTERFLY',
    explain: '🧈 butter + 🪰 fly → BUTTERFLY (not a butterfly!)',
  },
  {
    emojis: ['👂', '💍'],
    hint: 'Dangles from a lobe',
    answer: 'EARRING',
    explain: '👂 ear + 💍 ring → EARRING',
  },
  {
    emojis: ['🚗', '🐶'],
    hint: 'It ties the room together',
    answer: 'CARPET',
    explain: '🚗 car + 🐶 pet → CARPET',
  },
  {
    emojis: ['🧠', '⛈️'],
    hint: 'A sudden flurry of ideas',
    answer: 'BRAINSTORM',
    explain: '🧠 brain + ⛈️ storm → BRAINSTORM',
  },
  {
    emojis: ['🌧️', '🎀'],
    hint: 'An arc of colour after the rain',
    answer: 'RAINBOW',
    explain: '🌧️ rain + 🎀 bow → RAINBOW',
  },
];
