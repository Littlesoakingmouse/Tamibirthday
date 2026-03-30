/* ═══════════════════════════════════════════════════════════════
   DRAW – renders maze, dots, pac-man, ghosts
═══════════════════════════════════════════════════════════════ */

function draw() {
  const ctx = G.ctx;
  ctx.fillStyle = '#000008';
  ctx.fillRect(0, 0, G.canvas.width, G.canvas.height);

  drawMaze();
  drawDots();
  if (!G.pac.dead || G.pac.deathT < 1) drawPac();
  drawGhosts();
}

/* ── Maze ── */
function drawMaze() {
  const ctx = G.ctx;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (BASE_MAP[r][c] === WALL) {
        const x = c * CELL, y = r * CELL;
        ctx.fillStyle = '#000022';
        ctx.fillRect(x, y, CELL, CELL);

        ctx.save();
        ctx.shadowColor = '#5566ff';
        ctx.shadowBlur = 7;
        ctx.strokeStyle = '#2233ee';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const T = BASE_MAP[r - 1]?.[c] === WALL;
        const B = BASE_MAP[r + 1]?.[c] === WALL;
        const L = BASE_MAP[r]?.[c - 1] === WALL;
        const R = BASE_MAP[r]?.[c + 1] === WALL;
        const m = 2;
        if (!T) { ctx.moveTo(x + m, y + m);        ctx.lineTo(x + CELL - m, y + m); }
        if (!B) { ctx.moveTo(x + m, y + CELL - m); ctx.lineTo(x + CELL - m, y + CELL - m); }
        if (!L) { ctx.moveTo(x + m, y + m);        ctx.lineTo(x + m, y + CELL - m); }
        if (!R) { ctx.moveTo(x + CELL - m, y + m); ctx.lineTo(x + CELL - m, y + CELL - m); }
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

/* ── Dots ── */
function drawDots() {
  const ctx = G.ctx;
  const now = Date.now();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cx_ = c * CELL + HALF, cy_ = r * CELL + HALF;
      if (G.map[r][c] === DOT) {
        ctx.beginPath();
        ctx.arc(cx_, cy_, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffcc77';
        ctx.shadowColor = '#ffaa44'; ctx.shadowBlur = 4;
        ctx.fill(); ctx.shadowBlur = 0;
      } else if (G.map[r][c] === PPEL) {
        const pulse = Math.sin(now / 190) * 2 + 7;
        ctx.beginPath();
        ctx.arc(cx_, cy_, pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#FFE000';
        ctx.shadowColor = '#FFE000'; ctx.shadowBlur = 18;
        ctx.fill(); ctx.shadowBlur = 0;
      }
    }
  }
}

/* ── Pac-Man ── */
function drawPac() {
  const ctx = G.ctx;
  const pac = G.pac;
  const px = pac.px, py = pac.py;
  const r = HALF - 1.5;

  // Death animation
  if (pac.dead) {
    const t = pac.deathT;
    const a = Math.min(t * Math.PI, Math.PI);
    ctx.save();
    ctx.translate(px, py);
    ctx.shadowColor = '#FFE000'; ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * (1 - t * 0.55), a, Math.PI * 2 - a);
    ctx.closePath();
    ctx.fillStyle = `rgba(255,224,0,${1 - t})`;
    ctx.fill();
    ctx.restore();
    return;
  }

  // Blink during grace period
  const blink = G.graceTimer > 0 && Math.floor(Date.now() / 120) % 2 === 0;
  if (blink) return;

  let rot = 0;
  if (pac.dir === UP)         rot = -Math.PI / 2;
  else if (pac.dir === DOWN)  rot =  Math.PI / 2;
  else if (pac.dir === LEFT)  rot =  Math.PI;

  const mouth = pac.mouthAngle * Math.PI;

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(rot);
  ctx.shadowColor = '#FFE000'; ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r, mouth, Math.PI * 2 - mouth);
  ctx.closePath();
  ctx.fillStyle = '#FFE000';
  ctx.fill();
  /* eye */
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(r * 0.18, -r * 0.42, r * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.restore();
}

/* ── Ghosts ── */
function drawGhosts() {
  G.ghosts.forEach(g => drawGhost(g));
}

function drawGhost(g) {
  if (g.phase === 'house') return;

  const ctx = G.ctx;
  const px = g.px, py = g.py;
  const r = HALF - 1;

  const flash   = G.frightTimer < FRIGHT_FLASH && Math.floor(Date.now() / 260) % 2 === 0;
  const isFright = g.phase === 'fright';
  const isEaten  = g.phase === 'eaten';

  let bodyColor;
  if (isEaten)              bodyColor = null;
  else if (isFright && flash) bodyColor = '#ffffff';
  else if (isFright)          bodyColor = '#2222cc';
  else                        bodyColor = g.color;

  ctx.save();
  ctx.translate(px, py);

  if (!isEaten) {
    ctx.shadowColor = isFright ? '#0033ff' : g.color;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(0, -r * 0.15, r, Math.PI, 0);
    const ww = (r * 2) / 3;
    for (let i = 0; i < 3; i++) {
      const wx = r - i * ww;
      ctx.quadraticCurveTo(wx - ww / 2, r * 0.6 + r * 0.3 * (i % 2 === 0 ? 1 : -1), wx - ww, r * 0.6);
    }
    ctx.lineTo(-r, -r * 0.15);
    ctx.fillStyle = bodyColor;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (!isFright) {
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.ellipse(-r * .3, -r * .3, r * .22, r * .3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse( r * .3, -r * .3, r * .22, r * .3, 0, 0, Math.PI * 2); ctx.fill();
      const pdx = g.dir.x * 3, pdy = g.dir.y * 3;
      ctx.fillStyle = '#0044ff';
      ctx.beginPath(); ctx.arc(-r * .3 + pdx, -r * .3 + pdy, r * .11, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc( r * .3 + pdx, -r * .3 + pdy, r * .11, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#88aaff';
      ctx.beginPath(); ctx.arc(-r * .3, -r * .2, r * .1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc( r * .3, -r * .2, r * .1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-r * .38, r * .08);
      for (let i = 0; i < 4; i++) {
        ctx.quadraticCurveTo(
          -r * .38 + r * .19 * i + r * .1,
          r * .08 + (i % 2 === 0 ? r * .12 : -r * .04),
          -r * .38 + r * .19 * (i + 1), r * .08
        );
      }
      ctx.strokeStyle = '#88aaff'; ctx.lineWidth = 1.4; ctx.stroke();
    }
  } else {
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.ellipse(-r * .3, -r * .1, r * .18, r * .25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( r * .3, -r * .1, r * .18, r * .25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0044ff';
    ctx.beginPath(); ctx.arc(-r * .3, -r * .1, r * .09, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( r * .3, -r * .1, r * .09, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}
