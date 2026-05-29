/* ============================================================
   moji — puzzle data
   ------------------------------------------------------------
   Proper CRYPTIC CLUES (à la British crosswords), written as a
   SINGLE sentence with the emoji woven inline. Every clue has
   two routes to the same answer:
     • a DEFINITION (a straight synonym, hidden in the sentence)
     • WORDPLAY (a recipe that builds the answer letter by letter)

   The flagship example (COOK):
     "The special 🧑‍🍳 tucks his 🧆 inside his Calvin Klein 🩲"
       def      → 🧑‍🍳 chef = COOK
       wordplay → 🧆 meatballs = OO, Calvin Klein = CK,
                  "inside" = put OO within CK → C(OO)K
   The emojis ARE part of the sentence; the cracking happens by
   reading them as words and following the recipe.

   Cryptic devices used below: container, anagram, reversal,
   hidden-word, charade, double-definition, homophone.

   Fields:
     clue    : the full cryptic clue — one sentence, emoji inline
     answer  : solution. The game shows the letter count for you.
     explain : the "aha" breakdown revealed after a correct solve
   ============================================================ */

window.MOJI_PUZZLES = [
  {
    // CONTAINER — meatballs (OO) inside Calvin Klein (CK)
    clue: 'The special 🧑‍🍳 tucks his 🧆 inside his Calvin Klein 🩲',
    answer: 'COOK',
    explain: '🧑‍🍳 chef = the answer · 🧆 meatballs = OO, slipped inside CK (Calvin Klein) → C·OO·K',
  },
  {
    // ANAGRAM — HEART rearranged
    clue: 'A shattered ❤️ somehow ends up as the whole 🌍',
    answer: 'EARTH',
    explain: 'def: the whole 🌍 · “shattered” = anagram of ❤️ HEART → EARTH',
  },
  {
    // REVERSAL — LIVE backwards
    clue: 'Held up to the 🪞, the way we live comes out 😈',
    answer: 'EVIL',
    explain: 'def: 😈 wicked · 🪞 reflects “LIVE” backwards → EVIL',
  },
  {
    // HIDDEN WORD — concealed in "this land"
    clue: 'You can spot some of “this land” ringed by 🌊',
    answer: 'ISLAND',
    explain: 'def: ringed by 🌊 · hidden inside “th‑ISLAND” → ISLAND',
  },
  {
    // CHARADE — I + CON
    clue: 'With one little 🃏 con, I land on your home 🖥️',
    answer: 'ICON',
    explain: 'def: home-🖥️ symbol · I + CON (🃏 to trick) → ICON',
  },
  {
    // DOUBLE DEFINITION
    clue: 'A 🌴, or the very part of your 🤚 that would hold it',
    answer: 'PALM',
    explain: 'two meanings at once: a 🌴 PALM tree, and the PALM of your 🤚',
  },
  {
    // HOMOPHONE — "bee-leaf"
    clue: 'A 🐝 resting on a 🍃 — by the sound of it, pure faith',
    answer: 'BELIEF',
    explain: 'def: faith · 🐝 bee + 🍃 leaf sound like “belief” → BELIEF',
  },
];
