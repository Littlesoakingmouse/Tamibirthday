/* ═══════════════════════════════════════════════════════════════
   PACMAN LOGIC
═══════════════════════════════════════════════════════════════ */

function spawnPac() {
  return {
    col: 10, row: 16,
    px: tilePx(10),
    py: tilePx(16),
    dir: NONE,
    nextDir: NONE,
    speed: 1.8 + (G.level - 1) * 0.15,
    mouthAngle: 0.08,
    mouthSpd: 1,
    moving: false,
    dead: false,
    deathT: 0,
  };
}

function updatePac(dt) {
  if (G.graceTimer > 0) G.graceTimer = Math.max(0, G.graceTimer - dt);

  const pac = G.pac;

  if (pac.dead) {
    pac.deathT = Math.min(pac.deathT + dt / 700, 1.5);
    if (pac.deathT >= 1 && !pac.deathHandled) {
      pac.deathHandled = true;
      G.lives--;
      refreshUI();
      G.graceTimer = GRACE_DUR;
      if (G.lives <= 0) {
        document.getElementById('overSc').textContent = 'SCORE: ' + G.score;
        setState('over');
        setTimeout(() => triggerBirthdayTransition(), 600);
      } else {
        G.pac = spawnPac();
        G.ghosts = spawnGhosts();
      }
    }
    return;
  }

  const spd = pac.speed * (dt / 16.67);

  const cx = tilePx(pac.col);
  const cy = tilePx(pac.row);
  const dx = pac.px - cx;
  const dy = pac.py - cy;
  const arrived = Math.abs(dx) <= spd + SNAP && Math.abs(dy) <= spd + SNAP;

  if (arrived) {
    pac.px = cx;
    pac.py = cy;

    eatTile(pac.col, pac.row);

    if (pac.nextDir !== NONE) {
      const nc = pac.col + pac.nextDir.x;
      const nr = pac.row + pac.nextDir.y;
      if (passable(nc, nr)) {
        pac.dir = pac.nextDir;
        pac.nextDir = NONE;
      }
    }

    const fc = pac.col + pac.dir.x;
    const fr = pac.row + pac.dir.y;
    if (pac.dir !== NONE && !passable(fc, fr)) {
      pac.dir = NONE;
    }

    if (pac.dir !== NONE) {
      pac.col += pac.dir.x;
      pac.row += pac.dir.y;
      if (pac.col < 0)    pac.col = COLS - 1;
      if (pac.col >= COLS) pac.col = 0;
    }
  }

  if (pac.dir !== NONE) {
    const tcx = tilePx(pac.col);
    const tcy = tilePx(pac.row);
    const toX = tcx - pac.px;
    const toY = tcy - pac.py;
    const dist = Math.sqrt(toX * toX + toY * toY) || 1;
    if (dist <= spd) {
      pac.px = tcx; pac.py = tcy;
    } else {
      pac.px += (toX / dist) * spd;
      pac.py += (toY / dist) * spd;
    }
    pac.moving = true;

    pac.mouthAngle += pac.mouthSpd * dt / 75;
    if (pac.mouthAngle > 0.34) pac.mouthSpd = -1;
    if (pac.mouthAngle < 0.02) { pac.mouthSpd = 1; pac.mouthAngle = 0.02; }
  } else {
    pac.moving = false;
    pac.mouthAngle = 0.08;
  }

  // Tunnel wrap
  if (pac.px < -HALF) pac.px = G.canvas.width + HALF;
  if (pac.px > G.canvas.width + HALF) pac.px = -HALF;

  // Win check
  if (countDots() === 0) {
    document.getElementById('winSc').textContent = 'SCORE: ' + G.score;
    setState('win');
    // After showing win screen briefly, trigger birthday
    setTimeout(() => {
      setState('over'); // hide win overlay
      document.getElementById('ovOver').classList.add('hide');
      triggerBirthdayTransition();
    }, 2500);
  }
}

function eatTile(c, r) {
  if (G.map[r] && G.map[r][c] === DOT) {
    G.map[r][c] = EMPTY;
    addScore(10);
    popup(G.pac.px, G.pac.py, '+10');
  } else if (G.map[r] && G.map[r][c] === PPEL) {
    G.map[r][c] = EMPTY;
    addScore(50);
    popup(G.pac.px, G.pac.py, '+50');
    G.frightTimer = FRIGHT_DUR;
    G.ghosts.forEach(g => { if (g.phase !== 'eaten') g.phase = 'fright'; });
  }
}

function passable(col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
  return G.map[row][col] !== WALL;
}

function passableNoHouse(col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
  const v = G.map[row][col];
  return v !== WALL && v !== HOUSE;
}

function countDots() {
  let n = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (G.map[r][c] === DOT || G.map[r][c] === PPEL) n++;
  return n;
}
