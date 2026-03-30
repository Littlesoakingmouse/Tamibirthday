/* ═══════════════════════════════════════════════════════════════
   GHOST LOGIC
═══════════════════════════════════════════════════════════════ */

function spawnGhosts() {
  return GHOST_DEF.map((def, i) => ({
    ...def,
    col: def.hx, row: def.hy,
    px: tilePx(def.hx), py: tilePx(def.hy),
    dir: (i % 2 === 0) ? LEFT : RIGHT,
    speed: 1.6 + (G.level - 1) * 0.2,
    phase: 'house',
    houseT: 0,
    houseDelay: 3000 + i * 2500,
    bounceDir: (i % 2 === 0) ? UP : DOWN,
  }));
}

function updateGhosts(dt) {
  if (G.pac.dead) return;

  G.frightTimer = Math.max(0, G.frightTimer - dt);
  if (G.frightTimer === 0) {
    G.ghosts.forEach(g => { if (g.phase === 'fright') g.phase = 'roam'; });
  }

  G.ghosts.forEach((g, i) => {
    switch (g.phase) {

      case 'house': {
        g.houseT += dt;
        if (g.houseT >= g.houseDelay) {
          g.phase = 'exit';
          g.col = 10; g.row = 9;
          g.px = tilePx(10); g.py = tilePx(9);
          g.dir = UP;
        }
        break;
      }

      case 'exit': {
        const spd = g.speed * (dt / 16.67);
        g.py -= spd;
        if (g.py <= tilePx(8)) {
          g.py = tilePx(8);
          g.row = 8; g.col = 10;
          g.px = tilePx(10);
          g.phase = 'roam';
          g.dir = LEFT;
        }
        break;
      }

      case 'roam':
      case 'fright': {
        moveGhostTile(g, dt);
        break;
      }

      case 'eaten': {
        const tx = tilePx(g.hx), ty = tilePx(g.hy);
        const ddx = tx - g.px, ddy = ty - g.py;
        const d = Math.sqrt(ddx * ddx + ddy * ddy);
        const spd = g.speed * 2.5 * (dt / 16.67);
        if (d <= spd) {
          g.px = tx; g.py = ty;
          g.col = g.hx; g.row = g.hy;
          g.phase = 'house';
          g.houseT = g.houseDelay - 500;
          g.dir = UP;
        } else {
          g.px += (ddx / d) * spd;
          g.py += (ddy / d) * spd;
        }
        break;
      }
    }

    // Collision
    const pac = G.pac;
    if (!pac.dead && G.graceTimer <= 0 && g.phase !== 'house' && g.phase !== 'exit') {
      const cd = Math.hypot(g.px - pac.px, g.py - pac.py);
      if (cd < CELL * 0.72) {
        if (g.phase === 'fright') {
          g.phase = 'eaten';
          addScore(200);
          popup(g.px, g.py, '+200!');
        } else if (g.phase === 'roam') {
          pac.dead = true;
          pac.deathT = 0;
        }
      }
    }
  });
}

function moveGhostTile(g, dt) {
  const spd = (g.phase === 'fright' ? g.speed * 0.55 : g.speed) * (dt / 16.67);
  const tcx = tilePx(g.col);
  const tcy = tilePx(g.row);
  const toX = tcx - g.px;
  const toY = tcy - g.py;
  const dist = Math.sqrt(toX * toX + toY * toY);

  if (dist <= spd + SNAP) {
    g.px = tcx; g.py = tcy;

    const candidates = [UP, DOWN, LEFT, RIGHT].filter(d => {
      if (d.x === -g.dir.x && d.y === -g.dir.y) return false;
      return passableNoHouse(g.col + d.x, g.row + d.y);
    });

    let chosen;
    if (candidates.length === 0) {
      chosen = { x: -g.dir.x, y: -g.dir.y };
    } else if (g.phase === 'fright') {
      chosen = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
      let best = null, bestD = Infinity;
      candidates.forEach(d => {
        const nc = g.col + d.x, nr = g.row + d.y;
        const dd = Math.hypot(nc - G.pac.col, nr - G.pac.row);
        if (dd < bestD) { bestD = dd; best = d; }
      });
      chosen = best || candidates[0];
    }

    g.dir = chosen;
    g.col += chosen.x;
    g.row += chosen.y;

    if (g.col < 0)    g.col = COLS - 1;
    if (g.col >= COLS) g.col = 0;
  } else {
    g.px += (toX / dist) * spd;
    g.py += (toY / dist) * spd;
  }
}
