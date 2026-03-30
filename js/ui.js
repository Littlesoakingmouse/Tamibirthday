/* ═══════════════════════════════════════════════════════════════
   UI – score, lives, popups, overlays, transition, birthday
═══════════════════════════════════════════════════════════════ */

function addScore(n) {
  G.score += n;
  if (G.score > G.best) {
    G.best = G.score;
    localStorage.setItem('pmBest', G.best);
  }
  refreshUI();
}

function refreshUI() {
  document.getElementById('scoreEl').textContent  = G.score;
  document.getElementById('bestEl').textContent   = G.best;
  document.getElementById('levelEl').textContent  = G.level;
  for (let i = 0; i < 3; i++)
    document.getElementById('ld' + i).classList.toggle('lost', i >= G.lives);
}

function popup(px, py, txt) {
  const el = document.createElement('div');
  el.className = 'sp';
  el.textContent = txt;
  el.style.left = px + 'px';
  el.style.top  = (py - 10) + 'px';
  document.getElementById('cw').appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

/* ─── Game state ─────────────────────────────────────────── */
function setState(s) {
  G.state = s;
  document.getElementById('ovStart').classList.toggle('hide', s !== 'start');
  document.getElementById('ovOver').classList.toggle('hide', s !== 'over');
  document.getElementById('ovWin').classList.toggle('hide', s !== 'win');
  document.getElementById('ovPause').classList.toggle('hide', s !== 'paused');

  if (s === 'playing') {
    G.lastT = performance.now();
    if (G.raf) cancelAnimationFrame(G.raf);
    G.raf = requestAnimationFrame(loop);
  } else {
    if (G.raf) cancelAnimationFrame(G.raf);
  }
}

function togglePause() {
  if (G.state === 'playing') setState('paused');
  else if (G.state === 'paused') setState('playing');
}

/* ─── Transition → Birthday ─────────────────────────────── */
let birthdayTriggered = false;

function triggerBirthdayTransition() {
  if (birthdayTriggered) return;
  birthdayTriggered = true;
  // Hide game overlay first
  const ts = document.getElementById('transition-screen');
  ts.classList.add('active');

  // Spawn particles
  spawnTransitionParticles();

  // Show text after a moment
  setTimeout(() => {
    document.getElementById('ts-line1').style.display = 'block';
    document.getElementById('ts-line2').style.display = 'block';
  }, 300);

  // Go to birthday after 3.5s
  setTimeout(() => {
    ts.classList.remove('active');
    showBirthdayScreen();
  }, 3500);
}

function spawnTransitionParticles() {
  const field = document.getElementById('trans-particles');
  field.innerHTML = '';
  const colors = ['#FF4DA6','#FFE000','#00FFEE','#CC55FF','#FF6EEC','#FFB3E8'];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement('div');
    el.className = 't-particle';
    const size = Math.random() * 12 + 4;
    const angle = Math.random() * Math.PI * 2;
    const dist  = 200 + Math.random() * 350;
    el.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      --tx:${Math.cos(angle)*dist}px;
      --ty:${Math.sin(angle)*dist}px;
      --dur:${(Math.random()*1.5+0.8).toFixed(2)}s;
      animation-delay:${(Math.random()*0.8).toFixed(2)}s;
    `;
    field.appendChild(el);
  }
}

/* ─── Birthday Screen ────────────────────────────────────── */
function showBirthdayScreen() {
  const bd = document.getElementById('birthday-screen');
  bd.classList.add('active');
  spawnConfetti();
  spawnHearts();
  spawnShootingStars();
}

function spawnConfetti() {
  const field = document.getElementById('confetti-field');
  field.innerHTML = '';
  const shapes = ['border-radius:50%', 'border-radius:2px', 'clip-path:polygon(50% 0%,100% 100%,0% 100%)'];
  const colors = ['#FF4DA6','#FFE000','#00FFEE','#CC55FF','#FF6EEC','#FFB3E8','#44FFAA','#FF8844'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const size = Math.random() * 10 + 6;
    el.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      ${shapes[Math.floor(Math.random()*shapes.length)]};
      --cDur:${(Math.random()*3+2).toFixed(1)}s;
      --cDelay:${(Math.random()*4).toFixed(1)}s;
    `;
    field.appendChild(el);
  }
}

function spawnHearts() {
  const bd = document.getElementById('birthday-screen');
  const positions = [10,20,30,40,50,60,70,80,90];
  positions.forEach((left, i) => {
    const el = document.createElement('div');
    el.className = 'floating-heart';
    el.textContent = ['💕','💗','✨','🌸','💖','⭐','🌺','💝','💫'][i % 9];
    el.style.cssText = `
      left:${left}%;
      bottom:${Math.random()*30+5}%;
      --hSize:${Math.random()*16+14}px;
      --hDur:${(Math.random()*2+2).toFixed(1)}s;
      --hDelay:${(Math.random()*3).toFixed(1)}s;
    `;
    bd.appendChild(el);
  });
}

function spawnShootingStars() {
  const bd = document.getElementById('birthday-screen');
  for (let i = 0; i < 6; i++) {
    const el = document.createElement('div');
    el.className = 'shooting-star';
    el.style.cssText = `
      left:${Math.random()*80}%;
      top:${Math.random()*60}%;
      --sDur:${(Math.random()*2+1.5).toFixed(1)}s;
      --sDelay:${(Math.random()*5).toFixed(1)}s;
      --sTx:${(Math.random()*200+100)}px;
      --sTy:${(Math.random()*100+50)}px;
    `;
    bd.appendChild(el);
  }
}

/* ─── Letter / Question Logic ────────────────────────────── */
function initLetterLogic() {
  const envelopeBtn = document.getElementById('envelope-btn');
  const letterModal = document.getElementById('letter-modal');
  const btnYes      = document.getElementById('btn-yes');
  const btnNo       = document.getElementById('btn-no');
  const questionArea= document.getElementById('question-area');
  const celebration = document.getElementById('yes-celebration');

  // Open letter
  envelopeBtn.addEventListener('click', () => {
    letterModal.classList.add('open');
    positionBtnNo();
  });

  // Close modal on backdrop click
  letterModal.addEventListener('click', (e) => {
    if (e.target === letterModal) letterModal.classList.remove('open');
  });

  // YES button
  btnYes.addEventListener('click', () => {
    questionArea.style.display = 'none';
    celebration.classList.add('show');
    // Extra confetti burst
    spawnConfetti();
  });

  // NO button – always runs away from cursor
  btnNo.addEventListener('mousemove', (e) => runAwayFromMouse(e, btnNo));
  btnNo.addEventListener('mouseenter', (e) => runAwayFromMouse(e, btnNo));
  btnNo.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    runAwayFromMouse({ clientX: touch.clientX, clientY: touch.clientY }, btnNo);
  }, { passive: false });

  // Initial random position for NO button
  positionBtnNo();
}

function positionBtnNo() {
  const btnNo = document.getElementById('btn-no');
  const margin = 80;
  const x = margin + Math.random() * (window.innerWidth  - 2 * margin - 140);
  const y = margin + Math.random() * (window.innerHeight - 2 * margin - 60);
  btnNo.style.left = x + 'px';
  btnNo.style.top  = y + 'px';
}

function runAwayFromMouse(e, btn) {
  const margin = 80;
  const bw = btn.offsetWidth  || 140;
  const bh = btn.offsetHeight || 50;

  const mx = e.clientX;
  const my = e.clientY;

  const rect = btn.getBoundingClientRect();
  const bx   = rect.left + bw / 2;
  const by   = rect.top  + bh / 2;

  // Vector away from mouse
  let dvx = bx - mx;
  let dvy = by - my;
  const dist = Math.sqrt(dvx * dvx + dvy * dvy) || 1;
  dvx = (dvx / dist) * 200;
  dvy = (dvy / dist) * 200;

  let nx = bx + dvx - bw / 2;
  let ny = by + dvy - bh / 2;

  // Clamp to viewport
  nx = Math.max(margin, Math.min(window.innerWidth  - bw  - margin, nx));
  ny = Math.max(margin, Math.min(window.innerHeight - bh  - margin, ny));

  // If it would stay near the mouse, jump somewhere random
  const newRect = { left: nx, top: ny, right: nx + bw, bottom: ny + bh };
  if (Math.abs(newRect.left + bw/2 - mx) < 100 && Math.abs(newRect.top + bh/2 - my) < 60) {
    nx = margin + Math.random() * (window.innerWidth  - 2 * margin - bw);
    ny = margin + Math.random() * (window.innerHeight - 2 * margin - bh);
  }

  btn.style.left = nx + 'px';
  btn.style.top  = ny + 'px';
}
