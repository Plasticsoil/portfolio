/* ============================================================
   moji — game logic
   One cryptic clue per day. Come in, solve it, land on the
   leaderboard. The puzzle rotates by calendar day so everyone
   gets the same clue on the same date.

   Input uses a custom on-screen QWERTY bank (not the native
   keyboard) so nothing shifts the screen while typing.
   ============================================================ */
(function () {
  'use strict';

  const PUZZLES = window.MOJI_PUZZLES || [];
  const LB_KEY = 'moji_leaderboard_v1';   // history of daily solves
  const DAILY_KEY = 'moji_daily_v1';      // today's locked-in result
  const STREAK_KEY = 'moji_streak_v1';    // consecutive-day streak
  const EXPLOSION_EMOJIS = ['🎉', '🎊', '🎈', '🥳', '🏆', '🎁', '🪅', '✨', '💫', '⭐', '🌟', '💥', '🎆', '🎇', '👑', '🤩'];
  const KB_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  const NAME_MAX = 14;

  // ── State ────────────────────────────────────────────────
  let startTime = 0;
  let elapsed = 0;
  let rafId = null;
  let lastBeepSec = 0;
  let lastEntry = null;       // the score we just submitted, to highlight it
  let mode = null;            // 'game' | 'name' | null — where typed keys go
  let guess = [];             // letters entered for the puzzle
  let letterCells = [];       // the answer cell elements (letters only)
  let currentTarget = '';     // today's answer, upper-cased, no spaces
  let answerLocked = false;   // true once solved, until we move on
  let nameBuf = '';           // name being typed on the end screen

  // ── Sound — synthesized juice, no asset files, works offline ──
  const Sound = (function () {
    let ctx;
    const ac = () => {
      if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
      return ctx;
    };
    function tone(freq, delay, dur, type, gain) {
      const c = ac(); if (!c) return;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      o.connect(g); g.connect(c.destination);
      const t = c.currentTime + (delay || 0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain || 0.2, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.2));
      o.start(t); o.stop(t + (dur || 0.2) + 0.03);
    }
    const seq = (notes, step, dur, type, gain) =>
      notes.forEach((f, i) => tone(f, i * step, dur, type, gain));
    return {
      resume() { const c = ac(); if (c && c.state === 'suspended') c.resume(); },
      start()   { seq([523, 659, 784, 1047], 0.06, 0.20, 'triangle', 0.20); },
      tick()    { tone(990, 0, 0.05, 'square', 0.05); },
      key()     { tone(660, 0, 0.04, 'sine', 0.06); },
      correct() { seq([659, 784, 988, 1319], 0.075, 0.22, 'triangle', 0.22); },
      wrong()   { tone(150, 0, 0.20, 'sawtooth', 0.14); },
      publish() { seq([784, 1047, 1319, 1568, 2093], 0.07, 0.26, 'triangle', 0.24); },
      note(f)   { tone(f, 0, 0.14, 'triangle', 0.18); },
    };
  })();

  // Haptics — tiny taps of dopamine on devices that support it.
  function buzz(p) { if (navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } }
  // Restart a quick "pop" animation on a cell.
  function bump(cell) { if (!cell) return; cell.classList.remove('pop'); void cell.offsetWidth; cell.classList.add('pop'); }

  // ── Element refs ─────────────────────────────────────────
  const $ = (s) => document.querySelector(s);
  const screens = {
    start: $('#screen-start'),
    game: $('#screen-game'),
    end: $('#screen-end'),
    board: $('#screen-board'),
    about: $('#screen-about'),
  };
  const els = {
    startBtn: $('#start-btn'),
    particles: $('#particles'),
    timer: $('#timer-val'),
    gameBody: $('#screen-game .game-body'),
    clue: $('#puzzle-clue'),
    answer: $('#answer'),
    endTime: $('#end-time'),
    streak: $('#streak'),
    nameRow: $('#name-row'),
    nameDisplay: $('#name-display'),
    saveBtn: $('#save-btn'),
    keyboard: $('#keyboard'),
    boardCallout: $('#board-callout'),
    boardList: $('#board-list'),
    boardDate: $('#board-date'),
    boardNote: $('#board-note'),
  };

  // ── Daily helpers ────────────────────────────────────────
  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function dayIndex() {
    const d = new Date();
    const epochDay = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
    return ((epochDay % PUZZLES.length) + PUZZLES.length) % PUZZLES.length;
  }
  function prettyDate() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }
  function loadDaily() {
    try { return JSON.parse(localStorage.getItem(DAILY_KEY)); } catch (e) { return null; }
  }
  function solvedToday() {
    const d = loadDaily();
    return d && d.date === todayStr() ? d : null;
  }

  // ── Screen switching (also drives the keyboard + input mode) ──
  function show(name) {
    Object.values(screens).forEach((s) => s.classList.remove('is-active'));
    screens[name].classList.add('is-active');
    // The keyboard lives in the flow, right under the content that needs it.
    if (name === 'game') { mode = 'game'; els.gameBody.appendChild(els.keyboard); els.keyboard.classList.add('is-visible'); }
    else if (name === 'end') { mode = 'name'; screens.end.appendChild(els.keyboard); els.keyboard.classList.add('is-visible'); }
    else { mode = null; els.keyboard.classList.remove('is-visible'); }
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
    const sec = Math.floor(elapsed / 1000);
    if (sec > 0 && sec % 10 === 0 && sec !== lastBeepSec) {
      lastBeepSec = sec;
      Sound.tick();
    }
    rafId = requestAnimationFrame(tick);
  }
  function startTimer() {
    startTime = Date.now();
    lastBeepSec = 0;
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

  // ── On-screen keyboard ───────────────────────────────────
  function buildKeyboard() {
    els.keyboard.innerHTML = '';
    KB_ROWS.forEach((row, ri) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      row.split('').forEach((ch) => {
        const k = document.createElement('button');
        k.className = 'kb-key';
        k.type = 'button';
        k.textContent = ch;
        k.addEventListener('click', () => { typeLetter(ch); k.blur(); });
        rowEl.appendChild(k);
      });
      if (ri === KB_ROWS.length - 1) {
        const back = document.createElement('button');
        back.className = 'kb-key kb-back';
        back.type = 'button';
        back.textContent = '⌫';
        back.setAttribute('aria-label', 'delete');
        back.addEventListener('click', () => { backspace(); back.blur(); });
        rowEl.appendChild(back);
      }
      els.keyboard.appendChild(rowEl);
    });
  }

  function typeLetter(ch) {
    ch = (ch || '').toUpperCase();
    if (!/^[A-Z]$/.test(ch)) return;
    if (mode === 'game') {
      if (answerLocked || guess.length >= letterCells.length) return;
      guess.push(ch);
      Sound.key();
      buzz(8);
      renderCells();
      bump(letterCells[guess.length - 1]);
      if (guess.length === letterCells.length) attemptCheck();
    } else if (mode === 'name') {
      if (nameBuf.length >= NAME_MAX) return;
      nameBuf += ch;
      Sound.key();
      renderName();
    }
  }
  function backspace() {
    if (mode === 'game') {
      if (answerLocked || !guess.length) return;
      guess.pop();
      els.answer.classList.remove('is-bad');
      renderCells();
    } else if (mode === 'name') {
      nameBuf = nameBuf.slice(0, -1);
      renderName();
    }
  }

  // ── Render today's puzzle ────────────────────────────────
  function renderPuzzle() {
    const p = PUZZLES[dayIndex()];
    currentTarget = p.answer.replace(/\s+/g, '').toUpperCase();
    guess = [];
    letterCells = [];
    answerLocked = false;

    els.clue.innerHTML = p.clue;
    els.answer.className = 'answer';
    els.answer.innerHTML = '';
    p.answer.split('').forEach((ch) => {
      if (ch === ' ') {
        const gap = document.createElement('span');
        gap.className = 'word-gap';
        els.answer.appendChild(gap);
        return;
      }
      const cell = document.createElement('div');
      cell.className = 'box';
      els.answer.appendChild(cell);
      letterCells.push(cell);
    });

    renderCells();
  }

  function renderCells() {
    letterCells.forEach((cell, i) => {
      cell.textContent = guess[i] || '';
      cell.classList.toggle('is-active', !answerLocked && i === guess.length);
    });
  }

  function attemptCheck() {
    if (guess.length < currentTarget.length) return;
    if (guess.join('') === currentTarget) {
      answerLocked = true;
      renderCells();                 // drop the active-cell highlight
      // Green wave — each letter turns, pops and pings in sequence.
      const step = 90;
      letterCells.forEach((cell, i) => {
        setTimeout(() => {
          cell.classList.add('is-correct');
          bump(cell);
          Sound.note(523 + i * 90);
          buzz(12);
        }, i * step);
      });
      const done = letterCells.length * step;
      setTimeout(() => {
        Sound.correct();
        buzz([0, 30, 40, 70]);
        explode(els.answer, 30, screens.game);
      }, done);
      setTimeout(finishGame, done + 780);
    } else {
      // Wrong — colour, shake and sound say it all; no words.
      els.answer.classList.add('is-bad');
      Sound.wrong();
      buzz(70);
      setTimeout(() => {
        els.answer.classList.remove('is-bad');
        guess = [];
        renderCells();
      }, 700);
    }
  }

  // ── Name (typed via the same keyboard) ───────────────────
  function renderName() {
    if (nameBuf) {
      els.nameDisplay.textContent = nameBuf;
      els.nameDisplay.classList.remove('is-empty');
    } else {
      els.nameDisplay.textContent = 'Your name';
      els.nameDisplay.classList.add('is-empty');
    }
  }

  // ── Flow ─────────────────────────────────────────────────
  function beginGame() {
    const done = solvedToday();
    Sound.resume();
    Sound.start();
    els.startBtn.classList.add('is-detonating');
    explode(els.startBtn, 48);
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

  // ── Streak (consecutive days solved) ─────────────────────
  function fmtDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function bumpStreak() {
    const today = todayStr();
    let s;
    try { s = JSON.parse(localStorage.getItem(STREAK_KEY)); } catch (e) { s = null; }
    if (s && s.date === today) return s.streak;           // already counted today
    const y = new Date(); y.setDate(y.getDate() - 1);
    const streak = (s && s.date === fmtDate(y)) ? s.streak + 1 : 1;
    try { localStorage.setItem(STREAK_KEY, JSON.stringify({ date: today, streak })); } catch (e) {}
    return streak;
  }

  // Animate a time value counting up into an element.
  function countUp(el, ms) {
    const dur = 650, t0 = performance.now();
    (function frame(now) {
      const k = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(Math.round(ms * eased));
      if (k < 1) requestAnimationFrame(frame);
    })(t0);
  }

  function finishGame() {
    stopTimer();
    const streak = bumpStreak();
    nameBuf = '';
    renderName();
    els.nameRow.style.display = '';
    if (els.streak) els.streak.textContent = streak > 1 ? `🔥 ${streak} day streak` : '🔥 first solve';
    show('end');
    countUp(els.endTime, elapsed);
    buzz([0, 40, 40, 90]);
    explode(els.endTime, 42, screens.end);
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
    const name = (nameBuf || 'Anon').trim().slice(0, NAME_MAX) || 'Anon';
    const dateStr = todayStr();
    const entry = { name, ms: elapsed, dateStr, ts: Date.now() };

    try { localStorage.setItem(DAILY_KEY, JSON.stringify({ date: dateStr, ms: elapsed, name, ts: entry.ts })); } catch (e) {}
    const list = loadBoard();
    list.push(entry);
    list.sort((a, b) => a.ms - b.ms);
    saveBoard(list);

    lastEntry = entry;
    Sound.publish();
    buzz([0, 30, 40, 30, 40, 70]);
    showBoard(false);
  }

  function currentRank() {
    if (!lastEntry) return 0;
    const today = todayStr();
    const list = loadBoard().filter((r) => r.dateStr === today).sort((a, b) => a.ms - b.ms);
    const i = list.findIndex((r) => r.ts === lastEntry.ts);
    return i >= 0 ? i + 1 : 0;
  }

  function showBoard(alreadyDone) {
    renderBoard();
    const rank = currentRank();
    if (els.boardCallout) {
      els.boardCallout.textContent = rank
        ? (alreadyDone ? `Today you're #${rank}` : `You're #${rank} today!`)
        : '';
      els.boardCallout.style.display = rank ? '' : 'none';
    }
    els.boardNote.textContent = alreadyDone
      ? "You've already solved today's moji — come back tomorrow for a new one."
      : 'Solved! Come back tomorrow for a fresh clue.';
    show('board');
  }

  function renderBoard() {
    // Daily board: only today's runs (same clue), fastest first.
    const today = todayStr();
    const list = loadBoard()
      .filter((r) => r.dateStr === today)
      .sort((a, b) => a.ms - b.ms)
      .slice(0, 25);

    els.boardDate.textContent = prettyDate();
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
      li.innerHTML =
        `<span class="rank">${i + 1}</span>` +
        `<span class="who"></span>` +
        `<span class="ms">${fmt(row.ms)}</span>`;
      li.querySelector('.who').textContent = row.name;
      els.boardList.appendChild(li);
    });
  }

  // ── Wire it up ───────────────────────────────────────────
  buildKeyboard();
  els.startBtn.addEventListener('click', beginGame);
  els.saveBtn.addEventListener('click', submitScore);

  const aboutBtn = document.getElementById('about-btn');
  const aboutClose = document.getElementById('about-close');
  if (aboutBtn) aboutBtn.addEventListener('click', () => show('about'));
  if (aboutClose) aboutClose.addEventListener('click', () => show('start'));

  // Physical keyboard works too (desktop), routed by mode.
  document.addEventListener('keydown', (e) => {
    if (!mode) return;
    if (e.key === 'Backspace') { backspace(); e.preventDefault(); }
    else if (e.key === 'Enter') { if (mode === 'name') submitScore(); }
    else if (/^[a-zA-Z]$/.test(e.key)) { typeLetter(e.key); }
  });

  // QA-ONLY: clear today's lock so the daily can be replayed. Remove before release.
  const qaBtn = document.getElementById('qa-restart');
  if (qaBtn) qaBtn.addEventListener('click', () => {
    try { localStorage.removeItem(DAILY_KEY); } catch (e) {}
    lastEntry = null;
    show('start');
  });

  // ── Boot ─────────────────────────────────────────────────
  show('start');
})();
