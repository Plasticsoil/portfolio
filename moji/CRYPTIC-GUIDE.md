# moji — Cryptic Clue Guide

Our personal rulebook for writing the puzzles. Open it anytime.
The live bank lives in `puzzles.js` (same folder).

---

## The one rule

Every clue has **two parts that point to the same answer**:

1. a **DEFINITION** — a plain synonym of the answer, and
2. a **WORDPLAY** hint — a recipe that builds the answer.

The definition sits at the **start or the end** (never the middle), and the
whole thing is written as **one natural sentence**, usually with no
punctuation marking the split. The fun is hiding which part is which.

---

## The 8 devices (our full menu)

**1. Double definition** — two meanings, side by side.
- *Trim a tree (6)* → SPRUCE (to spruce up / a spruce tree)

**2. Anagram** — the letters, rearranged.
- signals: *mixed, broken, wild, confused, cooked, fractured, aimless, drunk, scrambled, out*
- *Wild West dish (4)* → STEW (anagram of WEST)

**3. Hidden** — answer concealed in consecutive letters.
- signals: *some of, part of, in, buried in, caught in, housed by*
- *Karen always displays a ring? (5)* → ARENA (k‑ARENA‑lways)

**4. Homophone** — sounds like.
- signals: *we hear, said, out loud, reportedly, orally, by the sound of it*
- *Animal is naked, we hear (4)* → BEAR (sounds like "bare")

**5. Charade** — pieces in order, A + B + C.
- *Agriculture in remote Chinese dynasty (7)* → FAR + MING = FARMING
- **Ours:** MONET = MO + NET

**6. Container** — one part placed inside another.
- signals: *holds, contains, grips, swallows, eaten by, around* — or from the inside: *in, inside, split by, cut through*
- *Mr. Crosby keeps it sharp (6)* → B(IT)ING
- **Ours:** BMW = B(M)W

**7. Reversal** — backwards.
- signals: *back, returning, reflected, reversed, up (in a down clue)*
- *Keen — railway cars in reverse (5)* → SMART (TRAMS reversed)

**8. Deletion** — drop a letter.
- signals: *headless / beheaded* (first), *endless / no tail* (last), *heartless* (middle)
- *Horse with no tail, damage (3)* → MAR (MARE minus its tail)

*(+ Complex = two or more of these combined.)*

---

## Building blocks (one‑step abbreviations)

A solver should turn a word into letters in **one hop**. Handy ones:

| Means | Letter(s) |
|---|---|
| north / south / east / west | N S E W |
| black / white / red | B W R |
| left / right | L R |
| love, nothing, ring, zero | O |
| one | I or A |
| a / an | A / AN |
| the Queen | ER or R · king K · queen Q |
| doctor | DR or MO |
| a moment / a month | MO |
| motorway / thousand | M |
| fifty / hundred / five / ten | L C V X |
| about | C (circa) or RE · say = RE |
| new | N |

> **Indirect abbreviations** (word → synonym → letter, two hops) are normally
> *against the rules*. We only use them **on purpose**, as "hard mode" — e.g.
> our **greyscale → black&white → BW**.

---

## moji house rules

1. Write the clue as a **natural sentence**. No em‑dash splitting it.
2. **Definition on an edge** (start or end).
3. **Every word has a job** — definition, wordplay, or a tiny link word. No filler.
4. **Never write the fodder word itself** — clue "range" as *shooting gallery*.
5. Prefer **one‑step** abbreviations; indirect ones only as deliberate hard mode.
6. **Watch for wrong signals** — e.g. "in" accidentally implying a container when it's really a charade.
7. **Question mark** = a stretchy definition or a pun.
8. **Emoji are optional** — add them later as a building block (a word, a sound, or letters): 🌊 = C (sea), 🐝 = B (bee), 🍵 = T (tea), 👁️ = I (eye), 👑 = Q (queen), 4️⃣ = "for/four".
9. The cells show the length, so we **don't print the (n)**.

---

## Checklist before banking a clue

- [ ] Clear **definition** at one end?
- [ ] Wordplay builds the **exact spelling** (count the letters!)?
- [ ] It's one of the **8 devices**, with a **fair indicator**?
- [ ] Reads like a **real sentence**?
- [ ] **No accidental wrong‑signal** (the "in" trap)?

---

## The day is a ladder of three

Each day in `puzzles.js` is `[stage1, stage2, stage3]`, getting harder as
you climb. The timer runs across all three; the day is done at the top.

| Stage | Feel | Shape | Example |
|---|---|---|---|
| **1** | easy | two emoji glued into one word (charade) | STARFISH = ⭐🐟 |
| **2** | mid | a 3-letter cryptic, simple anagram or reversal | TAR ← 🐀 (RAT) thrashing about |
| **3** | hard | a fuller cryptic (container, deletion, homophone, reversal, combo) | SCARE = 🚗 (CAR) inside SE |

Every stage carries at least one emoji that does real work.
The live bank (42 days, 126 clues) lives in `puzzles.js` with full wiring in each `explain`.

### Two ways an emoji can work in a clue
1. **Surface flavour** — the emoji just *pictures* a word, and the letters still come from text. e.g. 🕷️ = "spider" in MONET; the fodder is still the word **net**.
2. **Fodder** — the emoji itself supplies the letters/sound the wordplay needs:
   🌊 = C (sea) · 🐝 = B (bee) · 🍵 = T (tea) · 👁️ = I (eye) · 👑 = Q (queen) · 4️⃣ = "for/four" · 🥅 = NET.
   *(Goal for harder clues: let the emoji do real work, not just decorate.)*

---

## Parking lot (words to clue next)

Drafts in progress — answers we want clues for:

- cheese · sandbox · mountain · arrow · orange
- _(add more here as ideas come)_
