/* ============================================================
   moji — puzzle data
   ------------------------------------------------------------
   Real CRYPTIC CLUES with an emoji twist. Every clue offers two
   routes to ONE answer:
     • a DEFINITION (a plain synonym, at the start or end)
     • WORDPLAY built from the emoji (a sound, some letters, or
       a word the emoji stands for)

   The devices used below:
     • CONTAINER   — one part placed inside another
     • CHARADE     — pieces joined in order (A + B + C)
     • ANAGRAM     — letters rearranged ("shattered / strangely")
     • REVERSAL    — a word turned backwards
     • HIDDEN      — answer concealed in consecutive letters
     • HOMOPHONE   — "by the sound of it"
     • DOUBLE DEF  — two meanings of the same word

   Flagship example (COOK, a container):
     "The special 🧑‍🍳 tucks his 🧆 inside his Calvin Klein 🩲"
       def      → 🧑‍🍳 chef = COOK
       wordplay → 🧆 meatballs = OO, inside CK (Calvin Klein) → C(OO)K

   Fields:  clue · answer · explain (the "aha", shown after solving)
   ============================================================ */

window.MOJI_PUZZLES = [
  {
    // CONTAINER
    clue: 'The special 🧑‍🍳 tucks his 🧆 inside his Calvin Klein 🩲',
    answer: 'COOK',
    explain: '🧑‍🍳 chef = the answer · 🧆 meatballs = OO, slipped inside CK (Calvin Klein) → C·OO·K',
  },
  {
    // CHARADE — CAT + A + LOG
    clue: '🐱 dragging a 🪵 around makes one tidy list',
    answer: 'CATALOG',
    explain: '🐱 CAT + a + 🪵 LOG → CATALOG · def: a tidy list',
  },
  {
    // ANAGRAM — HEART → EARTH
    clue: 'A shattered ❤️ somehow ends up as the whole 🌍',
    answer: 'EARTH',
    explain: 'def: the whole 🌍 · “shattered” = anagram of ❤️ HEART → EARTH',
  },
  {
    // CHARADE — HONEY + MOON
    clue: '🍯 beside a full 🌙 — the getaway after the wedding',
    answer: 'HONEYMOON',
    explain: '🍯 HONEY + 🌙 MOON → HONEYMOON · def: the getaway after the wedding',
  },
  {
    // REVERSAL — DOG → GOD
    clue: 'The 🐶, sent right back, becomes someone you 🙏 to',
    answer: 'GOD',
    explain: 'def: one you 🙏 to · 🐶 DOG reversed → GOD',
  },
  {
    // DOUBLE DEFINITION
    clue: 'A 🐻 — or simply to put up with something',
    answer: 'BEAR',
    explain: 'two meanings at once: the animal 🐻, and to BEAR (endure)',
  },
  {
    // HIDDEN — concealed in "Spain"
    clue: 'Some of Spain 🇪🇸 turns out to be a real 🤕',
    answer: 'PAIN',
    explain: 'def: 🤕 ache · hidden in “s·PAIN” (some of Spain) → PAIN',
  },
  {
    // ANAGRAM — STAR → RATS
    clue: 'A 🌟, strangely, scatters into vermin',
    answer: 'RATS',
    explain: 'def: vermin · “strangely” = anagram of 🌟 STAR → RATS',
  },
  {
    // CHARADE — BUTTER + FLY
    clue: '🧈 with a 🪰 attached flits across the garden',
    answer: 'BUTTERFLY',
    explain: '🧈 BUTTER + 🪰 FLY → BUTTERFLY · def: it flits across the garden',
  },
  {
    // CHARADE — EAR + RING
    clue: 'An 👂 fitted with a 💍 dangles from the lobe',
    answer: 'EARRING',
    explain: '👂 EAR + 💍 RING → EARRING · def: it dangles from the lobe',
  },
  {
    // HOMOPHONE — "bee-leaf"
    clue: 'A 🐝 on a 🍃 — by the sound of it, pure faith',
    answer: 'BELIEF',
    explain: 'def: faith · 🐝 bee + 🍃 leaf sound like “belief” → BELIEF',
  },
  {
    // REVERSAL — LIVE → EVIL
    clue: 'Held up to the 🪞, the way we live comes out 😈',
    answer: 'EVIL',
    explain: 'def: 😈 wicked · 🪞 reflects “LIVE” backwards → EVIL',
  },
  {
    // CHARADE — O (owner's opening) + RANGE (shooting gallery)
    clue: "Drink the owner's opening at the shooting gallery",
    answer: 'ORANGE',
    explain: 'def: Drink (orange squash) · owner’s opening = O + shooting gallery = RANGE → O·RANGE',
  },
  {
    // CHARADE — SAND + BOX
    clue: 'Beach grit, then a bout of fisticuffs — the kids’ play pit',
    answer: 'SANDBOX',
    explain: 'def: kids’ play pit · beach grit = SAND + a bout of fisticuffs = BOX → SAND·BOX',
  },
  {
    // CHARADE — MOUNT + A + IN
    clue: 'Climb aboard, find a point of entry, and face the great peak',
    answer: 'MOUNTAIN',
    explain: 'def: the great peak · climb aboard = MOUNT + a + point of entry = IN → MOUNT·A·IN',
  },
  {
    // DELETION — beheaded NARROW
    clue: "Behead the narrow lane and you've a pointer",
    answer: 'ARROW',
    explain: 'def: a pointer · NARROW beheaded (drop the first letter) → ARROW',
  },
];
