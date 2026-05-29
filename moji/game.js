/* ============================================================
   moji — game logic
   Start → explosion → timed emoji puzzles → name → leaderboard
   ============================================================ */
(function () {
  'use strict';

  const PUZZLES = window.MOJI_PUZZLES || [];
  const LB_KEY = 'moji_leaderboard_v1';
  const EXPLOSION_EMOJIS = ['🎉', '✨', '💥', '🟡', '🟣', '🔵', '🐝', '🍂', '⭐', '🔥', '🎊', '💫'];

  // ── State ────────────────────────────────────────────────
  let current = 0;
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
    progress: $('#progress'),
    emojis: $('#puzzle-emojis'),
    hint: $('#puzzle-hint'),
    answer: $('#answer'),
    feedback: $('#feedback'),
    nextBtn: $('#next-btn'),
    endTime: $('#end-time'),
    nameInput: $('#name-input'),
    saveBtn: $('#save-btn'),
    boardList: $('#board-list'),
    boardBtnStart: $('#board-btn-start'),
    againBtn: $('#again-btn'),
    boardBackBtn: $('#board-back-btn'),
  };

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
    const d = Math.floor((t % 1000) / 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${d}`;
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

  // ── Render a puzzle ──────────────────────────────────────
  function renderPuzzle() {
    const p = PUZZLES[current];
    els.progress.textContent = `${current + 1} / ${PUZZLES.length}`;

    // emojis joined with a faint "+"
    els.emojis.innerHTML = p.emojis
      .map((e) => `<span class="e">${e}</span>`)
      .join('<span class="op">+</span>');

    const letters = p.answer.replace(/\s+/g, '').length;
    els.hint.innerHTML = `${p.hint} <span class="len">(${letters})</span>`;

    // build answer boxes, with gaps between words
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
    els.nextBtn.style.display = 'none';

    wireInputs(inputs, p);
    setTimeout(() => inputs[0] && inputs[0].focus(), 350);
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
      const last = current === PUZZLES.length - 1;
      els.feedback.className = 'feedback show is-explain';
      els.feedback.innerHTML = puzzle.explain || 'nice';
      els.nextBtn.textContent = last ? 'finish →' : 'next →';
      els.nextBtn.style.display = 'inline-block';
    } else {
      els.answer.classList.add('is-bad');
      els.feedback.className = 'feedback show';
      els.feedback.style.color = 'var(--color-bad)';
      els.feedback.textContent = 'not quite — try again';
      setTimeout(() => {
        els.answer.classList.remove('is-bad');
        inputs.forEach((x) => (x.value = ''));
        inputs[0].focus();
        els.feedback.classList.remove('show');
        els.feedback.style.color = '';
      }, 700);
    }
  }

  function nextPuzzle() {
    if (current === PUZZLES.length - 1) {
      finishGame();
    } else {
      current++;
      renderPuzzle();
    }
  }

  // ── Flow ─────────────────────────────────────────────────
  function beginGame() {
    els.startBtn.classList.add('is-detonating');
    explode(els.startBtn, 34);
    setTimeout(() => {
      els.startBtn.classList.remove('is-detonating');
      current = 0;
      show('game');
      renderPuzzle();
      startTimer();
    }, 520);
  }

  function finishGame() {
    stopTimer();
    els.endTime.textContent = fmt(elapsed);
    els.nameInput.value = '';
    show('end');
    setTimeout(() => els.nameInput.focus(), 350);
    explode(els.endTime, 28, screens.end);
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
    const entry = { name, ms: elapsed, date: Date.now() };
    const list = loadBoard();
    list.push(entry);
    list.sort((a, b) => a.ms - b.ms);
    saveBoard(list);
    lastEntry = entry;
    renderBoard();
    show('board');
  }
  function renderBoard() {
    const list = loadBoard().slice(0, 25);
    els.boardList.innerHTML = '';
    if (!list.length) {
      const li = document.createElement('li');
      li.className = 'board-empty';
      li.textContent = 'no scores yet — be the first';
      els.boardList.appendChild(li);
      return;
    }
    list.forEach((row, i) => {
      const li = document.createElement('li');
      li.className = 'board-row';
      if (lastEntry && row.date === lastEntry.date && row.name === lastEntry.name) {
        li.classList.add('is-me');
      }
      li.innerHTML =
        `<span class="rank">${i + 1}</span>` +
        `<span class="who"></span>` +
        `<span class="ms">${fmt(row.ms)}</span>`;
      li.querySelector('.who').textContent = row.name;
      els.boardList.appendChild(li);
    });
  }

  // ── Wire global buttons ──────────────────────────────────
  els.startBtn.addEventListener('click', beginGame);
  els.nextBtn.addEventListener('click', nextPuzzle);
  els.saveBtn.addEventListener('click', submitScore);
  els.nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitScore(); });
  els.boardBtnStart.addEventListener('click', () => { lastEntry = null; renderBoard(); show('board'); });
  els.againBtn.addEventListener('click', beginGame);
  els.boardBackBtn.addEventListener('click', () => show('start'));

  // ── Boot ─────────────────────────────────────────────────
  show('start');
})();
