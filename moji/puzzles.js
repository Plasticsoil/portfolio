/* ============================================================
   moji — puzzle bank
   ------------------------------------------------------------
   Each entry is ONE cryptic clue: a single natural-reading
   sentence hiding a DEFINITION (on one edge) + WORDPLAY.

   How to write these → see CRYPTIC-GUIDE.md in this folder
   (the 8 devices, abbreviations, house rules, checklist).

   Fields:
     clue    : the clue, written as a normal sentence
     answer  : the solution (the cells show its length)
     type    : which cryptic device it uses
     explain : the wiring — reference only, not shown to players
   ============================================================ */

window.MOJI_PUZZLES = [
  {
    clue: "A motorway cuts straight through the greyscale car.",
    answer: "BMW",
    type: "container",
    explain: "def: car · motorway = M · greyscale = BW (black & white) · 'cuts through' puts M inside BW → B(M)W",
  },
  {
    clue: "After a mo the 🕷️'s net caught a famous painter.",
    answer: "MONET",
    type: "charade",
    explain: "def: famous painter · a mo = MO · the 🕷️ (spider)'s net = NET → MO·NET",
  },
];
