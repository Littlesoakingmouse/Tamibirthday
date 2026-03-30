/* ═══════════════════════════════════════════════════════════════
   MAIN – game loop, init, input
═══════════════════════════════════════════════════════════════ */

// Global game state object
const G = {
  canvas: null, ctx: null,
  map: null, pac: null, ghosts: null,
  score: 0, best: 0, lives: 3, level: 1,
  frightTimer: 0, graceTimer: 0,
  state: 'start',
  raf: null, lastT: 0,
};

/* ── Canvas setup ── */
window.addEventListener('DOMContentLoaded', () => {
  G.canvas = document.getElementById('gc');
  G.ctx    = G.canvas.getContext('2d');
  G.canvas.width  = COLS * CELL;
  G.canvas.height = ROWS * CELL;

  // Stars
  initStars();

  // Input
  initInput();

  // Buttons
  initButtons();

  // Letter/birthday interaction
  initLetterLogic();

  // Boot
  G.best  = parseInt(localStorage.getItem('pmBest') || '0');
  G.level = 1; G.lives = 3; G.score = 0;
  G.map   = BASE_MAP.map(r => [...r]);
  G.pac   = spawnPac();
  G.ghosts = spawnGhosts();
  draw();
  refreshUI();
  document.getElementById('bestEl').textContent = G.best;
});

/* ── Stars ── */
function initStars() {
  const c = document.getElementById('stars');
  for (let i = 0; i < 100; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() * 1.8 + 0.4;
    s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${sz}px;height:${sz}px;--dur:${(Math.random()*3+1).toFixed(1)}s;animation-delay:${(Math.random()*3).toFixed(1)}s`;
    c.appendChild(s);
  }
}

/* ── Input ── */
const KEY_DIR = {
  ArrowUp: UP, w: UP, W: UP,
  ArrowDown: DOWN, s: DOWN, S: DOWN,
  ArrowLeft: LEFT, a: LEFT, A: LEFT,
  ArrowRight: RIGHT, d: RIGHT, D: RIGHT,
};

function initInput() {
  document.addEventListener('keydown', e => {
    if (KEY_DIR[e.key]) {
      e.preventDefault();
      if (G.state === 'playing') G.pac.nextDir = KEY_DIR[e.key];
    }
    if ((e.key === 'p' || e.key === 'P') && (G.state === 'playing' || G.state === 'paused'))
      togglePause();
  });

  // Mobile
  ['mbU','mbD','mbL','mbR'].forEach(id => {
    const m = { mbU:UP, mbD:DOWN, mbL:LEFT, mbR:RIGHT };
    const el = document.getElementById(id);
    el.addEventListener('touchstart', e => { e.preventDefault(); if (G.state==='playing') G.pac.nextDir=m[id]; }, { passive:false });
    el.addEventListener('mousedown',  e => { e.preventDefault(); if (G.state==='playing') G.pac.nextDir=m[id]; });
  });
}

/* ── Buttons ── */
function initButtons() {
  document.getElementById('btnStart').addEventListener('click', () => { initFull(); setState('playing'); });
  document.getElementById('btnRestart').addEventListener('click', () => {
    // If game over → restart (no birthday from here since already triggered)
    hideBirthdayIfNeeded();
    initFull();
    setState('playing');
  });
  document.getElementById('btnNext').addEventListener('click', () => { G.level++; startLevel(); setState('playing'); });
  document.getElementById('btnResume').addEventListener('click', () => { togglePause(); });
}

function hideBirthdayIfNeeded() {
  document.getElementById('birthday-screen').classList.remove('active');
  document.getElementById('transition-screen').classList.remove('active');
  birthdayTriggered = false;
}

/* ── Init / Reset ── */
function initFull() {
  G.level = 1; G.lives = 3; G.score = 0;
  G.best = parseInt(localStorage.getItem('pmBest') || '0');
  refreshUI();
  startLevel();
}

function startLevel() {
  G.frightTimer = 0;
  G.graceTimer  = GRACE_DUR;
  G.map   = BASE_MAP.map(r => [...r]);
  G.pac   = spawnPac();
  G.ghosts = spawnGhosts();
  refreshUI();
}

/* ── Game Loop ── */
function loop(t) {
  if (G.state !== 'playing') return;
  const dt = Math.min(t - G.lastT, 50);
  G.lastT = t;

  updatePac(dt);
  updateGhosts(dt);
  draw();

  G.raf = requestAnimationFrame(loop);
}
