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

  /* ── Day 8 ────────────────────────────────────────────── */
  [
    {
      clue: "What lights your path home after dark: 🌙💡",
      answer: "MOONLIGHT",
      type: "charade",
      explain: "def: what lights your path after dark · 🌙 = MOON · 💡 = LIGHT → MOON+LIGHT",
    },
    {
      clue: "A ⭐ rearranged into a Russian ruler.",
      answer: "TSAR",
      type: "anagram",
      explain: "def: a Russian ruler · ⭐ = STAR · 'rearranged' = anagram → TSAR",
    },
    {
      clue: "A 👻 that loses its head ends up throwing the party.",
      answer: "HOST",
      type: "deletion",
      explain: "def: one who throws the party · 👻 = GHOST · 'loses its head' = drop first letter → HOST",
    },
  ],

  /* ── Day 9 ────────────────────────────────────────────── */
  [
    {
      clue: "A spiky sweet treat from the tropics: 🌲🍎",
      answer: "PINEAPPLE",
      type: "charade",
      explain: "def: a spiky tropical treat · 🌲 = PINE · 🍎 = APPLE → PINE+APPLE",
    },
    {
      clue: "A 🍋 all muddled up swells into a bigger fruit.",
      answer: "MELON",
      type: "anagram",
      explain: "def: a bigger fruit · 🍋 = LEMON · 'muddled up' = anagram → MELON",
    },
    {
      clue: "A broken ❤️ turns out to be the whole world.",
      answer: "EARTH",
      type: "anagram",
      explain: "def: the whole world · ❤️ = HEART · 'broken' = anagram → EARTH",
    },
  ],

  /* ── Day 10 ───────────────────────────────────────────── */
  [
    {
      clue: "A little hoop for your lobe: 👂💍",
      answer: "EARRING",
      type: "charade",
      explain: "def: a little hoop for the lobe · 👂 = EAR · 💍 = RING → EAR+RING",
    },
    {
      clue: "A 🥅 turned around makes a perfect score.",
      answer: "TEN",
      type: "reversal",
      explain: "def: a perfect score · 🥅 = NET · 'turned around' = reversal → TEN",
    },
    {
      clue: "A 🚗 told to move becomes the ship's load.",
      answer: "CARGO",
      type: "charade",
      explain: "def: the ship's load · 🚗 = CAR · 'told to move' = GO → CAR+GO",
    },
  ],

  /* ── Day 11 ───────────────────────────────────────────── */
  [
    {
      clue: "Best thing to throw in winter: ❄️⚽",
      answer: "SNOWBALL",
      type: "charade",
      explain: "def: a thing to throw in winter · ❄️ = SNOW · ⚽ = BALL → SNOW+BALL",
    },
    {
      clue: "A 🐻 shuffled about ends up completely naked.",
      answer: "BARE",
      type: "anagram",
      explain: "def: completely naked · 🐻 = BEAR · 'shuffled about' = anagram → BARE",
    },
    {
      clue: "A 🧤 with its head off is all you need to adore.",
      answer: "LOVE",
      type: "deletion",
      explain: "def: to adore · 🧤 = GLOVE · 'head off' = drop first letter → LOVE",
    },
  ],

  /* ── Day 12 ───────────────────────────────────────────── */
  [
    {
      clue: "Where the anchor comes to rest: 🌊🛏️",
      answer: "SEABED",
      type: "charade",
      explain: "def: where the anchor rests · 🌊 = SEA · 🛏️ = BED → SEA+BED",
    },
    {
      clue: "A 🪙 reshaped into a sacred image.",
      answer: "ICON",
      type: "anagram",
      explain: "def: a sacred image · 🪙 = COIN · 'reshaped' = anagram → ICON",
    },
    {
      clue: "A 🚗 left to decay becomes a vegetable.",
      answer: "CARROT",
      type: "charade",
      explain: "def: a vegetable · 🚗 = CAR · 'left to decay' = ROT → CAR+ROT",
    },
  ],

  /* ── Day 13 ───────────────────────────────────────────── */
  [
    {
      clue: "An eager, page-turning reader: 📖🐛",
      answer: "BOOKWORM",
      type: "charade",
      explain: "def: an eager reader · 📖 = BOOK · 🐛 = WORM → BOOK+WORM",
    },
    {
      clue: "A 🌰 tipped backwards into a great cask.",
      answer: "TUN",
      type: "reversal",
      explain: "def: a great cask · 🌰 = NUT · 'tipped backwards' = reversal → TUN",
    },
    {
      clue: "A 🧠 going headless brings the wet weather.",
      answer: "RAIN",
      type: "deletion",
      explain: "def: the wet weather · 🧠 = BRAIN · 'going headless' = drop first letter → RAIN",
    },
  ],

  /* ── Day 14 ───────────────────────────────────────────── */
  [
    {
      clue: "Lucky iron nailed to a hoof: 🐴👞",
      answer: "HORSESHOE",
      type: "charade",
      explain: "def: lucky iron on a hoof · 🐴 = HORSE · 👞 = SHOE → HORSE+SHOE",
    },
    {
      clue: "A 🌹 rearranged reveals the god of love.",
      answer: "EROS",
      type: "anagram",
      explain: "def: the god of love · 🌹 = ROSE · 'rearranged' = anagram → EROS",
    },
    {
      clue: "A 🦊 slipping on a 🧤 grows into a garden flower.",
      answer: "FOXGLOVE",
      type: "charade",
      explain: "def: a garden flower · 🦊 = FOX · 🧤 = GLOVE → FOX+GLOVE",
    },
  ],

  /* ── Day 15 ───────────────────────────────────────────── */
  [
    {
      clue: "Summer's juiciest slice: 💧🍈",
      answer: "WATERMELON",
      type: "charade",
      explain: "def: summer's juiciest slice · 💧 = WATER · 🍈 = MELON → WATER+MELON",
    },
    {
      clue: "A 🐀 scrambling about ends up in the gallery.",
      answer: "ART",
      type: "anagram",
      explain: "def: what hangs in the gallery · 🐀 = RAT · 'scrambling about' = anagram → ART",
    },
    {
      clue: "A headless 🗡️ leaves a single spoken term.",
      answer: "WORD",
      type: "deletion",
      explain: "def: a single spoken term · 🗡️ = SWORD · 'headless' = drop first letter → WORD",
    },
  ],

  /* ── Day 16 ───────────────────────────────────────────── */
  [
    {
      clue: "The sweet getaway after the wedding: 🍯🌙",
      answer: "HONEYMOON",
      type: "charade",
      explain: "def: the sweet getaway after the wedding · 🍯 = HONEY · 🌙 = MOON → HONEY+MOON",
    },
    {
      clue: "An 🐜 wriggling about leaves you sun-kissed.",
      answer: "TAN",
      type: "anagram",
      explain: "def: a sun-kissed colour · 🐜 = ANT · 'wriggling about' = anagram → TAN",
    },
    {
      clue: "A 🍐, by the sound of it, makes a couple.",
      answer: "PAIR",
      type: "homophone",
      explain: "def: a couple · 🍐 = PEAR · 'by the sound of it' = homophone → PAIR",
    },
  ],

  /* ── Day 17 ───────────────────────────────────────────── */
  [
    {
      clue: "A small stirrer for your brew: 🍵🥄",
      answer: "TEASPOON",
      type: "charade",
      explain: "def: a small stirrer · 🍵 = TEA · 🥄 = SPOON → TEA+SPOON",
    },
    {
      clue: "A 🐱 jumbled up takes to the stage.",
      answer: "ACT",
      type: "anagram",
      explain: "def: a turn on the stage · 🐱 = CAT · 'jumbled up' = anagram → ACT",
    },
    {
      clue: "A 🦶 beside a 🎵 ends up as the small print.",
      answer: "FOOTNOTE",
      type: "charade",
      explain: "def: the small print at the bottom · 🦶 = FOOT · 🎵 = NOTE → FOOT+NOTE",
    },
  ],

  /* ── Day 18 ───────────────────────────────────────────── */
  [
    {
      clue: "A glossy purple vegetable: 🥚🪴",
      answer: "EGGPLANT",
      type: "charade",
      explain: "def: a glossy purple vegetable · 🥚 = EGG · 🪴 = PLANT → EGG+PLANT",
    },
    {
      clue: "A 🌴 all mixed up lights the room.",
      answer: "LAMP",
      type: "anagram",
      explain: "def: it lights the room · 🌴 = PALM · 'all mixed up' = anagram → LAMP",
    },
    {
      clue: "The 🌾 loses its head and gives off warmth.",
      answer: "HEAT",
      type: "deletion",
      explain: "def: warmth · 🌾 = WHEAT · 'loses its head' = drop first letter → HEAT",
    },
  ],

  /* ── Day 19 ───────────────────────────────────────────── */
  [
    {
      clue: "The headline speech of the conference: 🔑🎵",
      answer: "KEYNOTE",
      type: "charade",
      explain: "def: the headline speech · 🔑 = KEY · 🎵 = NOTE → KEY+NOTE",
    },
    {
      clue: "A 🧂 all stirred up finishes dead last.",
      answer: "LAST",
      type: "anagram",
      explain: "def: dead last · 🧂 = SALT · 'all stirred up' = anagram → LAST",
    },
    {
      clue: "A ✨ beheaded becomes a green space.",
      answer: "PARK",
      type: "deletion",
      explain: "def: a green space · ✨ = SPARK · 'beheaded' = drop first letter → PARK",
    },
  ],

  /* ── Day 20 ───────────────────────────────────────────── */
  [
    {
      clue: "A folded-down corner marking your page: 🐶👂",
      answer: "DOGEAR",
      type: "charade",
      explain: "def: a folded-down page corner · 🐶 = DOG · 👂 = EAR → DOG+EAR",
    },
    {
      clue: "A 🐺 turned about begins to stream.",
      answer: "FLOW",
      type: "anagram",
      explain: "def: to stream · 🐺 = WOLF · 'turned about' = anagram → FLOW",
    },
    {
      clue: "A 🌊 beside a boy marks the time of year.",
      answer: "SEASON",
      type: "charade",
      explain: "def: the time of year · 🌊 = SEA · 'a boy' = SON → SEA+SON",
    },
  ],

  /* ── Day 21 ───────────────────────────────────────────── */
  [
    {
      clue: "Built by the shore, gone by the tide: 🏖️🏰",
      answer: "SANDCASTLE",
      type: "charade",
      explain: "def: built by the shore · 🏖️ = SAND · 🏰 = CASTLE → SAND+CASTLE",
    },
    {
      clue: "A 🐍 all coiled up learns to creep.",
      answer: "SNEAK",
      type: "anagram",
      explain: "def: to creep · 🐍 = SNAKE · 'all coiled up' = anagram → SNEAK",
    },
    {
      clue: "A 😱 with its head removed tops the dessert.",
      answer: "CREAM",
      type: "deletion",
      explain: "def: the dessert topping · 😱 = SCREAM · 'head removed' = drop first letter → CREAM",
    },
  ],
];
