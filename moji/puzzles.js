/* ============================================================
   moji — puzzle bank
   ------------------------------------------------------------
   The day is a LADDER of three clues that get harder:

     Stage 1 — easy : two emoji glued into one word (a charade
                      you can almost see).
     Stage 2 — mid  : a tiny 3-letter cryptic, usually a simple
                      anagram or reversal, seeded by an emoji.
     Stage 3 — hard : a fuller cryptic (container, deletion,
                      homophone, reversal or a combo).

   Every stage carries at least one emoji that does real work.

   How to write these → see CRYPTIC-GUIDE.md in this folder.

   Each stage object:
     clue    : the clue, written as a normal sentence
     answer  : the solution (the cells show its length)
     type    : which cryptic device it uses (drives the tag)
     explain : the wiring — reference only, never shown to players

   MOJI_PUZZLES is an array of DAYS; each day is [s1, s2, s3].
   ============================================================ */

window.MOJI_PUZZLES = [
  /* ── Day 1 ────────────────────────────────────────────── */
  [
    {
      clue: "Clinging to the rocks at low tide: ⭐🐟",
      answer: "STARFISH",
      type: "charade",
      explain: "def: clinging to the rocks · ⭐ = STAR · 🐟 = FISH → STAR+FISH",
    },
    {
      clue: "A 🐀 thrashing about turns into an old sailor.",
      answer: "TAR",
      type: "anagram",
      explain: "def: old sailor · 🐀 = RAT · 'thrashing about' = anagram → TAR",
    },
    {
      clue: "A 🚗 beside the family 🐶 ends up covering the floor.",
      answer: "CARPET",
      type: "charade",
      explain: "def: covering the floor · 🚗 = CAR · family 🐶 = PET → CAR+PET",
    },
  ],

  /* ── Day 2 ────────────────────────────────────────────── */
  [
    {
      clue: "An arc that follows the storm: 🌧️🎀",
      answer: "RAINBOW",
      type: "charade",
      explain: "def: arc that follows the storm · 🌧️ = RAIN · 🎀 = BOW → RAIN+BOW",
    },
    {
      clue: "A 🦉 in a flap ends up feeling down.",
      answer: "LOW",
      type: "anagram",
      explain: "def: feeling down · 🦉 = OWL · 'in a flap' = anagram → LOW",
    },
    {
      clue: "A 🚗 boxed into the southeast gives you a fright.",
      answer: "SCARE",
      type: "container",
      explain: "def: a fright · SE = southeast · 🚗 = CAR placed inside → S(CAR)E",
    },
  ],

  /* ── Day 3 ────────────────────────────────────────────── */
  [
    {
      clue: "Tall bloom that turns to face the light: ☀️🌸",
      answer: "SUNFLOWER",
      type: "charade",
      explain: "def: tall bloom that faces the light · ☀️ = SUN · 🌸 = FLOWER → SUN+FLOWER",
    },
    {
      clue: "A 🚗 written off as a gentle curve.",
      answer: "ARC",
      type: "anagram",
      explain: "def: gentle curve · 🚗 = CAR · 'written off' = anagram → ARC",
    },
    {
      clue: "A 🔁 sent into reverse becomes a place to swim.",
      answer: "POOL",
      type: "reversal",
      explain: "def: place to swim · 🔁 = LOOP · 'into reverse' = reversal → POOL",
    },
  ],

  /* ── Day 4 ────────────────────────────────────────────── */
  [
    {
      clue: "The beautiful game, played on grass: 🦶⚽",
      answer: "FOOTBALL",
      type: "charade",
      explain: "def: the beautiful game · 🦶 = FOOT · ⚽ = BALL → FOOT+BALL",
    },
    {
      clue: "A loyal 🐕 turning round to face the almighty.",
      answer: "GOD",
      type: "reversal",
      explain: "def: the almighty · 🐕 = DOG · 'turning round' = reversal → GOD",
    },
    {
      clue: "Lose the tail of your ❤️ and simply listen.",
      answer: "HEAR",
      type: "deletion",
      explain: "def: listen · ❤️ = HEART · 'lose the tail' = drop last letter → HEAR",
    },
  ],

  /* ── Day 5 ────────────────────────────────────────────── */
  [
    {
      clue: "It flutters across the garden: 🧈🪰",
      answer: "BUTTERFLY",
      type: "charade",
      explain: "def: it flutters across the garden · 🧈 = BUTTER · 🪰 = FLY → BUTTER+FLY",
    },
    {
      clue: "Sit down to 🍽️, all mixed up, for a nice brew.",
      answer: "TEA",
      type: "anagram",
      explain: "def: a nice brew · 🍽️ = EAT · 'all mixed up' = anagram → TEA",
    },
    {
      clue: "A 🕊️ sounds just like a single slice.",
      answer: "PEACE",
      type: "homophone",
      explain: "def: 🕊️ (calm) · 'sounds just like' = homophone of PIECE (a slice) → PEACE",
    },
  ],

  /* ── Day 6 ────────────────────────────────────────────── */
  [
    {
      clue: "A whiskered lurker down on the riverbed: 🐱🐟",
      answer: "CATFISH",
      type: "charade",
      explain: "def: whiskered lurker on the riverbed · 🐱 = CAT · 🐟 = FISH → CAT+FISH",
    },
    {
      clue: "An 👂 twisted out of shape marks an age.",
      answer: "ERA",
      type: "anagram",
      explain: "def: an age · 👂 = EAR · 'twisted out of shape' = anagram → ERA",
    },
    {
      clue: "A 🐀 grabs one, then nothing, fixing the proportion.",
      answer: "RATIO",
      type: "complex",
      explain: "def: the proportion · 🐀 = RAT · one = I · nothing = O → RAT+I+O",
    },
  ],

  /* ── Day 7 ────────────────────────────────────────────── */
  [
    {
      clue: "A curl-tailed swimmer that bobs upright: 🌊🐴",
      answer: "SEAHORSE",
      type: "charade",
      explain: "def: a curl-tailed swimmer · 🌊 = SEA · 🐴 = HORSE → SEA+HORSE",
    },
    {
      clue: "A 🚌 driven backwards dives like a warship.",
      answer: "SUB",
      type: "reversal",
      explain: "def: warship (submarine) · 🚌 = BUS · 'driven backwards' = reversal → SUB",
    },
    {
      clue: "A 🐕 with mum clings to one firm belief.",
      answer: "DOGMA",
      type: "charade",
      explain: "def: one firm belief · 🐕 = DOG · mum = MA → DOG+MA",
    },
  ],
];
