/* ============================================================
   moji — game logic
   One cryptic clue per day. Come in, solve it, land on the
   leaderboard. The puzzle rotates by calendar day so everyone
   gets the same clue on the same date.
   ============================================================ */
(function () {
  'use strict';

  const PUZZLES = window.MOJI_PUZZLES || [];
  const LB_KEY = 'moji_leaderboard_v1';   // history of daily solves
  const DAILY_KEY = 'moji_daily_v1';      // today's locked-in result
  const EXPLOSION_EMOJIS = ['🎉', '✨', '💥', '🟡', '🟣', '🔵', '🐝', '🍃', '⭐', '🔥', '🎊', '💫'];

  // ── State ────────────────────────────────────────────────
  let startTime = 0;
  let elapsed = 0;
  let rafId = null;
  let lastEntry = null; // remembers the score we just submitted, to highlight it

  // ── Element refs ─────────────────────────────────────────
  const $ = (s) => document.querySelector(s);
  const screens = {
    start: $('#screen-start'),
    game: $('#screen-game'),
    end: $('#screen-end'),
    board: $('#screen-board'),
  };
  const els = {
    startBtn: $('#start-btn'),
    particles: $('#particles'),
    timer: $('#timer-val'),
    clue: $('#puzzle-clue'),
    answer: $('#answer'),
    feedback: $('#feedback'),
    endEmoji: $('#end-emoji'),
    endTime: $('#end-time'),
    nameRow: $('#name-row'),
    nameInput: $('#name-input'),
    saveBtn: $('#save-btn'),
    boardList: $('#board-list'),
    boardNote: $('#board-note'),
  };

  // ── Daily helpers ────────────────────────────────────────
  // Local calendar day → same puzzle for everyone that date.
  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function dayIndex() {
    const d = new Date();
    const epochDay = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
    return ((epochDay % PUZZLES.length) + PUZZLES.length) % PUZZLES.length;
  }
  function loadDaily() {
    try { return JSON.parse(localStorage.getItem(DAILY_KEY)); } catch (e) { return null; }
  }
  function solvedToday() {
    const d = loadDaily();
    return d && d.date === todayStr() ? d : null;
  }

  // ── Screen switching ─────────────────────────────────────
  function show(name) {
    Object.values(screens).forEach((s) => s.classList.remove('is-active'));
    screens[name].classList.add('is-active');
  }

  // ── Timer ────────────────────────────────────────────────
  function fmt(ms) {
    const t = Math.max(0, ms);
    const m = Math.floor(t / 60000);
    const s = Math.floor((t % 60000) / 1000);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  function tick() {
    elapsed = Date.now() - startTime;
    els.timer.textContent = fmt(elapsed);
    rafId = requestAnimationFrame(tick);
  }
  function startTimer() {
    startTime = Date.now();
    cancelAnimationFrame(rafId);
    tick();
  }
  function stopTimer() {
    cancelAnimationFrame(rafId);
    elapsed = Date.now() - startTime;
    els.timer.textContent = fmt(elapsed);
  }

  // ── Explosion ────────────────────────────────────────────
  function explode(originEl, count, host) {
    const hostBox = (host || els.particles).getBoundingClientRect();
    const o = originEl.getBoundingClientRect();
    const cx = o.left + o.width / 2 - hostBox.left;
    const cy = o.top + o.height / 2 - hostBox.top;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      p.textContent = EXPLOSION_EMOJIS[(Math.random() * EXPLOSION_EMOJIS.length) | 0];
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.fontSize = 18 + Math.random() * 22 + 'px';
      (host || els.particles).appendChild(p);
      const angle = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 240;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const rot = (Math.random() - 0.5) * 720;
      requestAnimationFrame(() => {
        p.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
        p.style.opacity = '0';
      });
      setTimeout(() => p.remove(), 950);
    }
  }

  // ── Render today's puzzle ────────────────────────────────
  function renderPuzzle() {
    const p = PUZZLES[dayIndex()];

    // one sentence, emoji woven inline — no enumeration
    els.clue.innerHTML = p.clue;

    els.answer.className = 'answer';
    els.answer.innerHTML = '';
    const inputs = [];
    p.answer.split('').forEach((ch) => {
      if (ch === ' ') {
        const gap = document.createElement('span');
        gap.className = 'word-gap';
        els.answer.appendChild(gap);
        return;
      }
      const inp = document.createElement('input');
      inp.className = 'box';
      inp.maxLength = 1;
      inp.type = 'text';
      inp.autocomplete = 'off';
      inp.autocapitalize = 'characters';
      inp.setAttribute('inputmode', 'text');
      inp.setAttribute('aria-label', 'answer letter');
      els.answer.appendChild(inp);
      inputs.push(inp);
    });

    els.feedback.className = 'feedback';
    els.feedback.textContent = '';

    wireInputs(inputs, p);
    // Keyboard stays closed until the player taps a cell themselves.
  }

  function wireInputs(inputs, puzzle) {
    inputs.forEach((inp, i) => {
      inp.addEventListener('input', () => {
        inp.value = inp.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 1);
        els.answer.classList.remove('is-bad');
        if (inp.value && i < inputs.length - 1) inputs[i + 1].focus();
        if (inputs.every((x) => x.value)) checkAnswer(inputs, puzzle);
      });
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !inp.value && i > 0) {
          inputs[i - 1].focus();
          inputs[i - 1].value = '';
          e.preventDefault();
        }
        if (e.key === 'ArrowLeft' && i > 0) inputs[i - 1].focus();
        if (e.key === 'ArrowRight' && i < inputs.length - 1) inputs[i + 1].focus();
        if (e.key === 'Enter') checkAnswer(inputs, puzzle);
      });
      inp.addEventListener('focus', () => inp.select());
    });
  }

  function checkAnswer(inputs, puzzle) {
    const guess = inputs.map((x) => x.value).join('').toUpperCase();
    const target = puzzle.answer.replace(/\s+/g, '').toUpperCase();
    if (guess.length < target.length) return;

    if (guess === target) {
      els.answer.classList.add('is-good');
      inputs.forEach((x) => (x.disabled = true));
      explode(els.answer, 16, screens.game);
      // No explanation — celebrate, then straight on to the leaderboard.
      setTimeout(finishGame, 950);
    } else {
      els.answer.classList.add('is-bad');
      els.feedback.className = 'feedback show';
      els.feedback.style.color = 'var(--color-bad)';
      els.feedback.textContent = 'Not quite — try again';
      setTimeout(() => {
        els.answer.classList.remove('is-bad');
        inputs.forEach((x) => (x.value = ''));
        inputs[0].focus();
        els.feedback.classList.remove('show');
        els.feedback.style.color = '';
      }, 700);
    }
  }

  // ── Flow ─────────────────────────────────────────────────
  function beginGame() {
    // Already cracked today's clue? Don't replay — show the result.
    const done = solvedToday();
    els.startBtn.classList.add('is-detonating');
    explode(els.startBtn, 34);
    setTimeout(() => {
      els.startBtn.classList.remove('is-detonating');
      if (done) {
        lastEntry = { name: done.name, ms: done.ms, dateStr: done.date, ts: done.ts };
        showBoard(true);
      } else {
        show('game');
        renderPuzzle();
        startTimer();
      }
    }, 520);
  }

  function finishGame() {
    stopTimer();
    els.endTime.textContent = fmt(elapsed);
    els.nameInput.value = '';
    els.nameRow.style.display = '';
    show('end');
    setTimeout(() => els.nameInput.focus(), 350);
    explode(els.endEmoji, 30, screens.end);
  }

  // ── Leaderboard (localStorage) ───────────────────────────
  function loadBoard() {
    try { return JSON.parse(localStorage.getItem(LB_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveBoard(list) {
    try { localStorage.setItem(LB_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function submitScore() {
    const name = (els.nameInput.value || 'Anon').trim().slice(0, 14) || 'Anon';
    const dateStr = todayStr();
    const entry = { name, ms: elapsed, dateStr, ts: Date.now() };

    // Lock in today's result and append to the all-time daily history.
    try { localStorage.setItem(DAILY_KEY, JSON.stringify({ date: dateStr, ms: elapsed, name, ts: entry.ts })); } catch (e) {}
    const list = loadBoard();
    list.push(entry);
    list.sort((a, b) => a.ms - b.ms);
    saveBoard(list);

    lastEntry = entry;
    showBoard(false);
  }

  function showBoard(alreadyDone) {
    renderBoard();
    els.boardNote.textContent = alreadyDone
      ? "You've already solved today's moji — come back tomorrow for a new one."
      : 'Solved! Come back tomorrow for a fresh clue.';
    show('board');
  }

  function renderBoard() {
    const list = loadBoard().slice(0, 25);
    els.boardList.innerHTML = '';
    if (!list.length) {
      const li = document.createElement('li');
      li.className = 'board-empty';
      li.textContent = 'No scores yet — be the first';
      els.boardList.appendChild(li);
      return;
    }
    list.forEach((row, i) => {
      const li = document.createElement('li');
      li.className = 'board-row';
      if (lastEntry && row.ts === lastEntry.ts) li.classList.add('is-me');
      const when = row.dateStr
        ? new Date(row.dateStr + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : '';
      li.innerHTML =
        `<span class="rank">${i + 1}</span>` +
        `<span class="who"><span class="who-name"></span><span class="when"></span></span>` +
        `<span class="ms">${fmt(row.ms)}</span>`;
      li.querySelector('.who-name').textContent = row.name;
      li.querySelector('.when').textContent = when ? ` · ${when}` : '';
      els.boardList.appendChild(li);
    });
  }

  // ── Wire buttons ─────────────────────────────────────────
  els.startBtn.addEventListener('click', beginGame);
  els.saveBtn.addEventListener('click', submitScore);
  els.nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitScore(); });

  // ── Boot ─────────────────────────────────────────────────
  show('start');
})();
