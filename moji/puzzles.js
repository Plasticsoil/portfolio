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

  /* ── Day 22 ───────────────────────────────────────────── */
  [
    {
      clue: "A glowing insect in the summer dark: 🔥🪰",
      answer: "FIREFLY",
      type: "charade",
      explain: "def: a glowing summer insect · 🔥 = FIRE · 🪰 = FLY → FIRE+FLY",
    },
    {
      clue: "A 🦌 reshuffled into a marsh plant.",
      answer: "REED",
      type: "anagram",
      explain: "def: a marsh plant · 🦌 = DEER · 'reshuffled' = anagram → REED",
    },
    {
      clue: "A 🔑 needs a 🕳️ to do its job.",
      answer: "KEYHOLE",
      type: "charade",
      explain: "def: where the key goes · 🔑 = KEY · 🕳️ = HOLE → KEY+HOLE",
    },
  ],

  /* ── Day 23 ───────────────────────────────────────────── */
  [
    {
      clue: "A blade-nosed swimmer: 🗡️🐟",
      answer: "SWORDFISH",
      type: "charade",
      explain: "def: a blade-nosed swimmer · 🗡️ = SWORD · 🐟 = FISH → SWORD+FISH",
    },
    {
      clue: "A 🥄 stirred up starts to pry.",
      answer: "SNOOP",
      type: "anagram",
      explain: "def: to pry · 🥄 = SPOON · 'stirred up' = anagram → SNOOP",
    },
    {
      clue: "A 🍯 store shaped by the bees, neat as a 🪮.",
      answer: "HONEYCOMB",
      type: "charade",
      explain: "def: the bees' waxy store · 🍯 = HONEY · 🪮 = COMB → HONEY+COMB",
    },
  ],

  /* ── Day 24 ───────────────────────────────────────────── */
  [
    {
      clue: "A faint glow from far across the sky: ⭐💡",
      answer: "STARLIGHT",
      type: "charade",
      explain: "def: a faint glow from the sky · ⭐ = STAR · 💡 = LIGHT → STAR+LIGHT",
    },
    {
      clue: "A 🍞 kneaded about into facial hair.",
      answer: "BEARD",
      type: "anagram",
      explain: "def: facial hair · 🍞 = BREAD · 'kneaded about' = anagram → BEARD",
    },
    {
      clue: "Too long under the ☀️ and you 🔥 red.",
      answer: "SUNBURN",
      type: "charade",
      explain: "def: what too much beach leaves on your skin · ☀️ = SUN · 🔥 = BURN → SUN+BURN",
    },
  ],

  /* ── Day 25 ───────────────────────────────────────────── */
  [
    {
      clue: "Shades for a bright day: ☀️👓",
      answer: "SUNGLASSES",
      type: "charade",
      explain: "def: shades for a bright day · ☀️ = SUN · 👓 = GLASSES → SUN+GLASSES",
    },
    {
      clue: "A 🐎 galloping all over the place reaches the coast.",
      answer: "SHORE",
      type: "anagram",
      explain: "def: the coast · 🐎 = HORSE · 'all over the place' = anagram → SHORE",
    },
    {
      clue: "Liquor brewed by the 🌙 with a guilty ✨.",
      answer: "MOONSHINE",
      type: "charade",
      explain: "def: illicit homemade liquor · 🌙 = MOON · ✨ = SHINE → MOON+SHINE",
    },
  ],

  /* ── Day 26 ───────────────────────────────────────────── */
  [
    {
      clue: "What keeps you dry in a downpour: 🌧️🧥",
      answer: "RAINCOAT",
      type: "charade",
      explain: "def: what keeps you dry in a downpour · 🌧️ = RAIN · 🧥 = COAT → RAIN+COAT",
    },
    {
      clue: "A 🧂 knocked about into a thin strip of wood.",
      answer: "SLAT",
      type: "anagram",
      explain: "def: a thin strip of wood · 🧂 = SALT · 'knocked about' = anagram → SLAT",
    },
    {
      clue: "A 🎀 worn as a 👔 to the gala.",
      answer: "BOWTIE",
      type: "charade",
      explain: "def: formal neckwear · 🎀 = BOW · 👔 = TIE → BOW+TIE",
    },
  ],

  /* ── Day 27 ───────────────────────────────────────────── */
  [
    {
      clue: "A sticky trap strung in the corner: 🕷️🕸️",
      answer: "SPIDERWEB",
      type: "charade",
      explain: "def: a sticky corner trap · 🕷️ = SPIDER · 🕸️ = WEB → SPIDER+WEB",
    },
    {
      clue: "A 🐺 turned about becomes a barnyard bird.",
      answer: "FOWL",
      type: "anagram",
      explain: "def: a barnyard bird · 🐺 = WOLF · 'turned about' = anagram → FOWL",
    },
    {
      clue: "A 🐶 wears one; a soldier's 🏷️ of identity.",
      answer: "DOGTAG",
      type: "charade",
      explain: "def: a soldier's metal ID · 🐶 = DOG · 🏷️ = TAG → DOG+TAG",
    },
  ],

  /* ── Day 28 ───────────────────────────────────────────── */
  [
    {
      clue: "A beacon that warns the ships: 💡🏠",
      answer: "LIGHTHOUSE",
      type: "charade",
      explain: "def: a beacon that warns ships · 💡 = LIGHT · 🏠 = HOUSE → LIGHT+HOUSE",
    },
    {
      clue: "A ⭐ turned right around reveals the vermin.",
      answer: "RATS",
      type: "reversal",
      explain: "def: vermin · ⭐ = STAR · 'turned right around' = reversal → RATS",
    },
    {
      clue: "Tuck a 🚗 between S and F for a winter neck-wrap.",
      answer: "SCARF",
      type: "container",
      explain: "def: a winter neck-wrap · 🚗 = CAR · placed inside S_F → S(CAR)F",
    },
  ],

  /* ── Day 29 ───────────────────────────────────────────── */
  [
    {
      clue: "Flat and flipped for breakfast: 🍳🍰",
      answer: "PANCAKE",
      type: "charade",
      explain: "def: a flat breakfast flip · 🍳 = PAN · 🍰 = CAKE → PAN+CAKE",
    },
    {
      clue: "A 🚪 rebuilt gives off a smell.",
      answer: "ODOR",
      type: "anagram",
      explain: "def: a smell · 🚪 = DOOR · 'rebuilt' = anagram → ODOR",
    },
    {
      clue: "Box a 🐀 between C and E for a wooden crate.",
      answer: "CRATE",
      type: "container",
      explain: "def: a wooden box · 🐀 = RAT · placed inside C_E → C(RAT)E",
    },
  ],

  /* ── Day 30 ───────────────────────────────────────────── */
  [
    {
      clue: "Where the hammer and nails live: 🛠️📦",
      answer: "TOOLBOX",
      type: "charade",
      explain: "def: where the hammer lives · 🛠️ = TOOL · 📦 = BOX → TOOL+BOX",
    },
    {
      clue: "A 🐐 shuffled about into a Roman robe.",
      answer: "TOGA",
      type: "anagram",
      explain: "def: a Roman robe · 🐐 = GOAT · 'shuffled about' = anagram → TOGA",
    },
    {
      clue: "Slip a 🐀 inside a pie to raise the Jolly Roger.",
      answer: "PIRATE",
      type: "container",
      explain: "def: one who raises the Jolly Roger · 🐀 = RAT · inside PIE → PI(RAT)E",
    },
  ],

  /* ── Day 31 ───────────────────────────────────────────── */
  [
    {
      clue: "A purse on your arm: ✋👜",
      answer: "HANDBAG",
      type: "charade",
      explain: "def: a purse on the arm · ✋ = HAND · 👜 = BAG → HAND+BAG",
    },
    {
      clue: "A 🍐 reshuffled, you start to trim.",
      answer: "PARE",
      type: "anagram",
      explain: "def: to trim · 🍐 = PEAR · 'reshuffled' = anagram → PARE",
    },
    {
      clue: "A 🪐 that loses its tail takes to the air.",
      answer: "PLANE",
      type: "deletion",
      explain: "def: an aircraft · 🪐 = PLANET · 'loses its tail' = drop last letter → PLANE",
    },
  ],

  /* ── Day 32 ───────────────────────────────────────────── */
  [
    {
      clue: "Twice-a-day tool for your smile: 🦷🖌️",
      answer: "TOOTHBRUSH",
      type: "charade",
      explain: "def: a twice-a-day tool for the smile · 🦷 = TOOTH · 🖌️ = BRUSH → TOOTH+BRUSH",
    },
    {
      clue: "A 🌹 rearranged leaves you aching.",
      answer: "SORE",
      type: "anagram",
      explain: "def: aching · 🌹 = ROSE · 'rearranged' = anagram → SORE",
    },
    {
      clue: "A 🪨 that loses its head turns into a musical pitch.",
      answer: "TONE",
      type: "deletion",
      explain: "def: a musical pitch · 🪨 = STONE · 'loses its head' = drop first letter → TONE",
    },
  ],

  /* ── Day 33 ───────────────────────────────────────────── */
  [
    {
      clue: "What you ride down a wave: 🏄🛹",
      answer: "SURFBOARD",
      type: "charade",
      explain: "def: what you ride down a wave · 🏄 = SURF · 🛹 = BOARD → SURF+BOARD",
    },
    {
      clue: "A plate of 🍝 all jumbled into Spanish nibbles.",
      answer: "TAPAS",
      type: "anagram",
      explain: "def: Spanish small plates · 🍝 = PASTA · 'all jumbled' = anagram → TAPAS",
    },
    {
      clue: "A 🔥 that loses its head leaves you feeble.",
      answer: "LAME",
      type: "deletion",
      explain: "def: feeble · 🔥 = FLAME · 'loses its head' = drop first letter → LAME",
    },
  ],

  /* ── Day 34 ───────────────────────────────────────────── */
  [
    {
      clue: "A spiral souvenir from the beach: 🌊🐚",
      answer: "SEASHELL",
      type: "charade",
      explain: "def: a spiral beach souvenir · 🌊 = SEA · 🐚 = SHELL → SEA+SHELL",
    },
    {
      clue: "A cut of 🥩 mixed up into a side that plays together.",
      answer: "TEAM",
      type: "anagram",
      explain: "def: a side that plays together · 🥩 = MEAT · 'mixed up' = anagram → TEAM",
    },
    {
      clue: "Behead a 🍞 and settle down to peruse a book.",
      answer: "READ",
      type: "deletion",
      explain: "def: to peruse · 🍞 = BREAD · 'behead' = drop first letter → READ",
    },
  ],

  /* ── Day 35 ───────────────────────────────────────────── */
  [
    {
      clue: "Logs split for the hearth: 🔥🪵",
      answer: "FIREWOOD",
      type: "charade",
      explain: "def: logs for the hearth · 🔥 = FIRE · 🪵 = WOOD → FIRE+WOOD",
    },
    {
      clue: "A pot of 🍲 stirred up points the compass.",
      answer: "WEST",
      type: "anagram",
      explain: "def: a compass point · 🍲 = STEW · 'stirred up' = anagram → WEST",
    },
    {
      clue: "Behead a 🦈 and listen!",
      answer: "HARK",
      type: "deletion",
      explain: "def: listen! · 🦈 = SHARK · 'behead' = drop first letter → HARK",
    },
  ],

  /* ── Day 36 ───────────────────────────────────────────── */
  [
    {
      clue: "Where the models strut: 🐱🚶",
      answer: "CATWALK",
      type: "charade",
      explain: "def: where the models strut · 🐱 = CAT · 🚶 = WALK → CAT+WALK",
    },
    {
      clue: "A 🐌 muddled up hammers them home.",
      answer: "NAILS",
      type: "anagram",
      explain: "def: what the carpenter hammers home · 🐌 = SNAIL · 'muddled up' = anagram → NAILS",
    },
    {
      clue: "A ☀️, by the sound of it, is a male child.",
      answer: "SON",
      type: "homophone",
      explain: "def: a male child · ☀️ = SUN · 'by the sound of it' = homophone → SON",
    },
  ],

  /* ── Day 37 ───────────────────────────────────────────── */
  [
    {
      clue: "Press it and someone answers: 🚪🔔",
      answer: "DOORBELL",
      type: "charade",
      explain: "def: press it and someone answers · 🚪 = DOOR · 🔔 = BELL → DOOR+BELL",
    },
    {
      clue: "A 🍇 reshuffled into an old-school beeper.",
      answer: "PAGER",
      type: "anagram",
      explain: "def: an old-school beeper · 🍇 = GRAPE · 'reshuffled' = anagram → PAGER",
    },
    {
      clue: "A 🌊, by the sound of it, is to look.",
      answer: "SEE",
      type: "homophone",
      explain: "def: to look · 🌊 = SEA · 'by the sound of it' = homophone → SEE",
    },
  ],

  /* ── Day 38 ───────────────────────────────────────────── */
  [
    {
      clue: "A guard with a loud bark: ⌚🐶",
      answer: "WATCHDOG",
      type: "charade",
      explain: "def: a guard with a loud bark · ⌚ = WATCH · 🐶 = DOG → WATCH+DOG",
    },
    {
      clue: "A 🪨 reshaped into a bottle stopper.",
      answer: "CORK",
      type: "anagram",
      explain: "def: a bottle stopper · 🪨 = ROCK · 'reshaped' = anagram → CORK",
    },
    {
      clue: "A 🐇, by the sound of it, is what grows on your head.",
      answer: "HAIR",
      type: "homophone",
      explain: "def: what grows on your head · 🐇 = HARE · 'by the sound of it' = homophone → HAIR",
    },
  ],

  /* ── Day 39 ───────────────────────────────────────────── */
  [
    {
      clue: "What fills the ocean, not the tap: 🧂💧",
      answer: "SALTWATER",
      type: "charade",
      explain: "def: what fills the ocean · 🧂 = SALT · 💧 = WATER → SALT+WATER",
    },
    {
      clue: "A 🍳 flipped over for a short sleep.",
      answer: "NAP",
      type: "reversal",
      explain: "def: a short sleep · 🍳 = PAN · 'flipped over' = reversal → NAP",
    },
    {
      clue: "A 🌸, by the sound of it, is a baking essential.",
      answer: "FLOUR",
      type: "homophone",
      explain: "def: a baking essential · 🌸 = FLOWER · 'by the sound of it' = homophone → FLOUR",
    },
  ],

  /* ── Day 40 ───────────────────────────────────────────── */
  [
    {
      clue: "Where you jot your ideas: 🎵📖",
      answer: "NOTEBOOK",
      type: "charade",
      explain: "def: where you jot ideas · 🎵 = NOTE · 📖 = BOOK → NOTE+BOOK",
    },
    {
      clue: "A 🌮 all wrapped up turns into a jacket.",
      answer: "COAT",
      type: "anagram",
      explain: "def: a jacket · 🌮 = TACO · 'all wrapped up' = anagram → COAT",
    },
    {
      clue: "A 😈 turned back to front simply existed.",
      answer: "LIVED",
      type: "reversal",
      explain: "def: existed · 😈 = DEVIL · 'turned back to front' = reversal → LIVED",
    },
  ],

  /* ── Day 41 ───────────────────────────────────────────── */
  [
    {
      clue: "A river leaping off a cliff: 💧🍂",
      answer: "WATERFALL",
      type: "charade",
      explain: "def: a river leaping off a cliff · 💧 = WATER · 🍂 = FALL → WATER+FALL",
    },
    {
      clue: "A 🐊 thrashed about into the thieves' slang.",
      answer: "ARGOT",
      type: "anagram",
      explain: "def: thieves' slang · 🐊 = GATOR · 'thrashed about' = anagram → ARGOT",
    },
    {
      clue: "An 🐘's nose, or the boot of your car.",
      answer: "TRUNK",
      type: "double-definition",
      explain: "def 1: an elephant's nose · def 2: the car's boot · 🐘 hints both → TRUNK",
    },
  ],

  /* ── Day 42 ───────────────────────────────────────────── */
  [
    {
      clue: "Pull it for luck and make a wish: 🌠🦴",
      answer: "WISHBONE",
      type: "charade",
      explain: "def: pull it for luck · 🌠 = WISH · 🦴 = BONE → WISH+BONE",
    },
    {
      clue: "A 🛏️ flipped over reveals the season's debutante.",
      answer: "DEB",
      type: "reversal",
      explain: "def: a society debutante · 🛏️ = BED · 'flipped over' = reversal → DEB",
    },
    {
      clue: "A 🦭, or to shut something tight.",
      answer: "SEAL",
      type: "double-definition",
      explain: "def 1: the flippered animal · def 2: to shut tight · 🦭 hints both → SEAL",
    },
  ],
];
