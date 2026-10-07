// ================= 시즌 2: 적 · 보스 · 지형 =================

// ---------- 일반 적 ----------
EN.riot = Object.assign({}, EN.shield, {
  hp: 70, r: 17, spd: 85, color: '#ff5050', contact: 12, coin: 3,
  update(e, dt) {
    EN.shield.update(e, dt);
    e.shoveT = (e.shoveT === undefined ? rand(2, 4) : e.shoveT) - dt;
    const t = eTarget(e);
    if (e.shoveT <= 0 && d2(e.x, e.y, t.x, t.y) < 240 * 240) { e.shoveT = rand(3, 5); const a = angTo(e.x, e.y, t.x, t.y); e.kx += Math.cos(a) * 420; e.ky += Math.sin(a) * 420; SFX.play('roll', 0.6); }
  }
});
EN.sdrone = {
  hp: 28, r: 11, spd: 170, color: '#ff8a8a', contact: 6, coin: 2, flying: true,
  init(e) { e.orb = rand(0, TAU); e.dir = Math.random() < 0.5 ? 1 : -1; e.cd = rand(1.2, 2.2); },
  update(e, dt) {
    e.orb += dt * 0.9 * e.dir;
    const t = eTarget(e);
    moveToward(e, t.x + Math.cos(e.orb) * 230, t.y + Math.sin(e.orb) * 230, e.spd * e.sm, dt);
    e.ang = angTo(e.x, e.y, t.x, t.y);
    e.cd -= dt * e.atkMult;
    if (e.cd <= 0) {
      e.cd = 2.4; eShoot(e, e.ang, 260, 9, { color: '#ff8a8a' });
      room.timers.push({ t: 0.18, fn: () => { if (!e.dead) { const tt = eTarget(e); eShoot(e, angTo(e.x, e.y, tt.x, tt.y), 260, 9, { color: '#ff8a8a' }); } } });
    }
  },
  draw(e, c, f) { polyPath(e.x, e.y, e.r, 3, G.time * 3); neonShape(c, 2, f); circlePath(e.x, e.y, e.r + 6); ctx.strokeStyle = 'rgba(255,138,138,0.35)'; ctx.lineWidth = 1.5; ctx.stroke(); }
};
EN.sludge = {
  hp: 55, r: 17, spd: 60, color: '#8dff3d', contact: 12, coin: 2,
  init(e) { e.dropT = 0.6; },
  update(e, dt) {
    const t = eTarget(e); moveToward(e, t.x, t.y, e.spd * e.sm, dt);
    e.dropT -= dt;
    if (e.dropT <= 0 && !e.ally) { e.dropT = 0.8; if (room.hazards.length < 110) addHazard({ type: 'toxic', x: e.x, y: e.y, r: 22, life: 3.5 }); }
  },
  death(e) { if (e.clone || e.ally) return; for (const k of [-1, 1]) { const m = spawnEnemy('mini', e.x + k * 10, e.y, { instant: true }); m.kx = k * 200; m.ky = rand(-80, 80); } },
  draw(e, c, f) { const w = Math.sin(G.time * 5 + e.x) * 2; ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r + w, e.r - w, 0, 0, TAU); neonShape(c, 2.2, f); circlePath(e.x, e.y, 4); ctx.fillStyle = c; ctx.fill(); }
};
EN.eel = Object.assign({}, EN.snake, { hp: 55, color: '#3de0c8', coin: 3 });
EN.shade = Object.assign({}, EN.tele, {
  hp: 32, color: '#9b6bff', coin: 2,
  draw(e, c, f) { const d = dist(e.x, e.y, P.x, P.y); ctx.globalAlpha = clamp(1.25 - d / 420, 0.12, 1); EN.tele.draw(e, c, f); ctx.globalAlpha = 1; }
});
EN.sentry = Object.assign({}, EN.gunner, {
  hp: 45, color: '#ff3d6a', coin: 3,
  update(e, dt) {
    const before = e.cd;
    EN.gunner.update(e, dt);
    if (e.cd > before + 1) for (const k of [1, 2]) room.timers.push({ t: 0.15 * k, fn: () => { if (!e.dead) { const tg = eTarget(e); eShoot(e, angTo(e.x, e.y, tg.x, tg.y), 250, 9, { color: '#ff3d6a' }); } } });
  }
});
function drawAgent(e, c, f, rr) {
  const r = rr || e.r;
  circlePath(e.x, e.y, r); neonShape(c, 2.4, f);
  const a = e.ang || 0;
  ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * (r + 8), e.y + Math.sin(a) * (r + 8));
  ctx.lineTo(e.x + Math.cos(a + 0.5) * r, e.y + Math.sin(a + 0.5) * r); ctx.lineTo(e.x + Math.cos(a - 0.5) * r, e.y + Math.sin(a - 0.5) * r); ctx.closePath();
  ctx.fillStyle = c; ctx.fill();
}
EN.siwoo_clone = {
  hp: 45, r: 14, spd: 150, color: '#b49bff', contact: 0, coin: 0,
  init(e) { e.life = 8; e.cd = rand(0.8, 1.4); },
  update(e, dt) {
    e.life -= dt;
    if (e.life <= 0) { e.noReward = true; killEnemy(e, {}); return; }
    const d = dist(e.x, e.y, P.x, P.y); e.ang = angTo(e.x, e.y, P.x, P.y);
    const a = d > 300 ? e.ang : e.ang + Math.PI / 2;
    moveToward(e, e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40, e.spd * e.sm, dt);
    e.cd -= dt; if (e.cd <= 0) { e.cd = 1.7; eShoot(e, e.ang, 300, 8, { color: '#b49bff' }); }
  },
  draw(e, c, f) { ctx.globalAlpha = 0.55; drawAgent(e, c, f); ctx.globalAlpha = 1; }
};

// ---------- 보스 방 준비 ----------
function bossRoomS2() {
  const W = room.w, H = room.h;
  if (room.zid === 4) addHazard({ type: 'train', shape: 'r', x: 0, y: H * 0.47 - 36, w: W, h: 72, cycle: [9, 1.8, 0.8], state: 'off', ct: 6 });
  if (room.zid === 5) { room.flood = { state: 'off', t: 9 }; for (const [x, y] of [[0.3, 0.3], [0.7, 0.3], [0.5, 0.65]]) addHazard({ type: 'water', x: W * x, y: H * y, r: 80 }); }
  if (room.zid === 6) for (const [x, y] of [[0.22, 0.32], [0.78, 0.32], [0.22, 0.7], [0.78, 0.7]]) room.walls.push({ x: W * x - 40, y: H * y - 30, w: 80, h: 60, hp: Infinity, kind: 'block' });
  if (room.zid === 7) { room.ctrl = 'sentinel'; room.ctrlT = 14; }
}
function spawnValves() {
  for (const [x, y] of [[0.08, 0.45], [0.92, 0.45], [0.5, 0.08]]) room.props.push({ type: 'valve', x: room.w * x, y: room.h * y, r: 20, hp: 45, maxHp: 45, shootable: true });
}
function setupBossS2(id) {
  const cx = room.w / 2, cy = room.h / 2;
  if (id === 'redline') spawnEnemy('boss_redline', cx, cy - 250, { instant: true });
  else if (id === 'leviathan') { spawnValves(); spawnEnemy('boss_leviathan', cx, cy - 120, { instant: true }); }
  else if (id === 'siwoo') spawnEnemy('boss_siwoo', cx, cy - 250, { instant: true });
  else if (id === 'sentinel') spawnEnemy('boss_sentinel', cx, 250, { instant: true });
}

// ---------- 보스 1: 레드라인 ----------
EN.boss_redline = {
  boss: true, hp: 1, r: 42, spd: 85, color: '#ff4d4d', contact: 16, heavy: true,
  init(e) { e.hp = e.maxHp = 2600 * G.bossHp; e.bossId = 'redline'; e.name = '레드라인'; e.st = 'walk'; e.t = 2; e.ang = Math.PI / 2; e.pat = 0; e.stunT = 0; },
  update(e, dt) {
    const ph2 = e.hp < e.maxHp * 0.5, toP = angTo(e.x, e.y, P.x, P.y);
    if (e.stunT > 0) { e.stunT -= dt; e.dmgTakenMult = 2; e.contact = 0; if (e.stunT <= 0) { e.st = 'walk'; e.t = 1; } return; }
    e.contact = e.st === 'charge' ? 18 : 14;
    const front = Math.abs(angDiff(e.ang, toP)) < 1.15;
    e.dmgTakenMult = front ? 0.2 : 1.4; // 정면 방패
    if (e.st !== 'charge') e.ang += clamp(angDiff(e.ang, toP), -(ph2 ? 1.2 : 0.8) * dt, (ph2 ? 1.2 : 0.8) * dt);
    e.t -= dt;
    switch (e.st) {
      case 'walk':
        if (d2(e.x, e.y, P.x, P.y) > 200 * 200) moveToward(e, P.x, P.y, e.spd * e.sm, dt);
        if (e.t <= 0) {
          const pats = ph2 ? ['volley', 'shove', 'drones', 'stomp', 'shove', 'volley'] : ['volley', 'shove', 'stomp', 'volley', 'drones'];
          const p = pats[e.pat++ % pats.length];
          if (p === 'volley') { eFan(e, e.ang, ph2 ? 6 : 5, 0.75, 280, 10, { color: '#ff6a4a' }); e.t = 1.8; }
          else if (p === 'stomp') { eRing(e, 12, 200, 10, rand(0, TAU), { color: '#ff6a4a' }); shake(6); e.t = 1.8; }
          else if (p === 'drones') { if (room.enemies.filter(m => !m.dead && m.type === 'sdrone').length < 3) for (const k of [-1, 1]) spawnEnemy('sdrone', e.x + k * 70, e.y, {}); floatText(e.x, e.y - 70, '지원 요청', '#ff8a8a', 16); e.t = 1.6; }
          else { e.st = 'windup'; e.t = 0.85; e.lockA = toP; SFX.play('warn'); }
        }
        break;
      case 'windup':
        e.lockA += clamp(angDiff(e.lockA, toP), -0.6 * dt, 0.6 * dt); e.ang = e.lockA;
        if (e.t <= 0) { e.st = 'charge'; e.t = 1.1; SFX.play('roll'); }
        break;
      case 'charge': {
        const nx = e.x + Math.cos(e.lockA) * 560 * dt, ny = e.y + Math.sin(e.lockA) * 560 * dt;
        if (nx < e.r || nx > room.w - e.r || ny < e.r || ny > room.h - e.r || e.t <= 0) { e.st = 'walk'; e.t = 1.4; shake(8); eRing(e, 10, 190, 10, 0, { color: '#ff6a4a' }); }
        else { e.x = nx; e.y = ny; }
        break;
      }
    }
  },
  draw(e, c, f) {
    if (e.st === 'windup') { ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.lockA) * 900, e.y + Math.sin(e.lockA) * 900); ctx.strokeStyle = `rgba(255,70,70,${0.25 + Math.sin(G.time * 40) * 0.15})`; ctx.lineWidth = e.r * 2; ctx.stroke(); }
    bossDraw(e, c, f, () => {
      polyPath(e.x, e.y, e.r, 6, e.ang); neonShape(e.stunT > 0 ? '#888' : c, 3.2, f);
      circlePath(e.x, e.y, 10); ctx.fillStyle = e.stunT > 0 ? '#444' : '#ff3030'; ctx.fill();
    });
    if (e.stunT <= 0) { ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 12, e.ang - 1.15, e.ang + 1.15); ctx.strokeStyle = '#ffd0c0'; ctx.lineWidth = 8; ctx.stroke(); ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 3; ctx.stroke(); }
    else { ctx.font = `bold 16px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe14d'; ctx.fillText('방패 파손!', e.x, e.y - e.r - 16); }
  }
};
function trainHitEnemy(e, tick) {
  if (e.bossId === 'redline') {
    if (!(e.stunT > 0)) {
      e.stunT = 3.5; e.st = 'walk'; e.dmgTakenMult = 2;
      damageEnemy(e, e.maxHp * 0.06, { noProc: true });
      floatText(e.x, e.y - 60, '열차 충돌! 방패 파손', '#ffe14d', 22); shake(18); SFX.play('stun'); hitstop(0.08, true);
    }
    return;
  }
  if (e.boss) return;
  if (tick) { damageEnemy(e, 80, { quiet: true }); if (!e.heavy) e.kx += (Math.random() < 0.5 ? -1 : 1) * 500; }
}

// ---------- 보스 2: 리바이어던 ----------
EN.boss_leviathan = {
  boss: true, hp: 1, r: 36, spd: 60, color: '#3de0c8', contact: 14, heavy: true,
  init(e) { e.hp = e.maxHp = 3000 * G.bossHp; e.bossId = 'leviathan'; e.name = '리바이어던'; e.st = 'surface'; e.t = 5; e.atk = 1.2; e.trail = []; e.pat = 0; },
  update(e, dt) {
    const ph2 = e.hp < e.maxHp * 0.5;
    const valves = room.props.filter(p => p.type === 'valve');
    if (e.st !== 'stranded' && valves.length && valves.every(p => p.dead)) {
      e.st = 'stranded'; e.t = 6; e.invuln = false; e.flying = false;
      G.banner = { text: '배수 완료', sub: '리바이어던이 바닥에 걸렸다 — 받는 피해 2배', t: 1.8, color: '#3de0c8' };
      SFX.play('stun'); shake(12); for (const b of BULLETS) if (b.team === 'e') b.dead = true;
    }
    e.trail.push({ x: e.x, y: e.y }); if (e.trail.length > 40) e.trail.shift();
    e.t -= dt;
    switch (e.st) {
      case 'stranded':
        e.dmgTakenMult = 2; e.contact = 0;
        if (e.t <= 0) { e.dmgTakenMult = 1; room.props = room.props.filter(p => p.type !== 'valve'); spawnValves(); floatText(e.x, e.y - 60, '밸브 재가동', '#3de0c8', 18); e.st = 'dive'; e.t = 2.2; e.invuln = true; e.flying = true; }
        break;
      case 'surface': {
        e.invuln = false; e.flying = false; e.contact = 14; e.dmgTakenMult = 1;
        e.ang = angTo(e.x, e.y, P.x, P.y);
        moveToward(e, P.x, P.y, e.spd * e.sm, dt);
        e.atk -= dt;
        if (e.atk <= 0) {
          const p = ['ring', 'fan', 'spit'][e.pat++ % 3];
          if (p === 'ring') eRing(e, ph2 ? 13 : 10, 190, 9, rand(0, TAU), { color: '#6affe6' });
          else if (p === 'fan') eFan(e, e.ang, 4, 0.6, 270, 9, { color: '#6affe6' });
          else for (let i = 0; i < 3; i++) lob(e, clamp(P.x + rand(-140, 140), 30, room.w - 30), clamp(P.y + rand(-140, 140), 30, room.h - 30), 1.2 + i * 0.25, 60, 10, false);
          e.atk = 2.2;
        }
        if (e.t <= 0) { e.st = 'dive'; e.t = 2.4; e.invuln = true; e.flying = true; SFX.play('water'); burst(e.x, e.y, '#3de0c8', 20, 200, 0.5, 3); }
        break;
      }
      case 'dive': {
        e.contact = 0;
        const sp = 170 * (room.floodOn ? 1.4 : 1);
        const a = angTo(e.x, e.y, P.x, P.y);
        if (d2(e.x, e.y, P.x, P.y) > 20 * 20) moveDir(e, a, sp, dt);
        e.x = clamp(e.x, 60, room.w - 60); e.y = clamp(e.y, 60, room.h - 60);
        if (e.t <= 0) { e.st = 'rise'; e.t = 0.9; SFX.play('warn'); }
        break;
      }
      case 'rise':
        if (e.t <= 0) {
          e.st = 'surface'; e.t = ph2 ? 4 : 5; e.atk = 1; e.invuln = false; e.flying = false;
          if (d2(e.x, e.y, P.x, P.y) < 110 * 110) damagePlayer(16, e);
          eRing(e, 12, 200, 10, rand(0, TAU), { color: '#6affe6' }); shake(10); SFX.play('explode');
          burst(e.x, e.y, '#6affe6', 30, 320, 0.6, 4);
          if (room.hazards.length < 100) addHazard({ type: 'water', x: e.x, y: e.y, r: 70, life: 8 });
        }
        break;
    }
  },
  draw(e, c, f) {
    if (e.st === 'dive' || e.st === 'rise') {
      ctx.globalAlpha = 0.35 + (e.st === 'rise' ? Math.sin(G.time * 30) * 0.2 : 0);
      ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * 1.4, e.r * 0.9, G.time, 0, TAU); ctx.fillStyle = '#04262a'; ctx.fill();
      ctx.globalAlpha = 1;
      const k = (G.time * 1.2) % 1; circlePath(e.x, e.y, e.r + k * 40); ctx.strokeStyle = `rgba(106,255,230,${0.4 * (1 - k)})`; ctx.lineWidth = 2; ctx.stroke();
      if (e.st === 'rise') { circlePath(e.x, e.y, 110); ctx.strokeStyle = Math.sin(G.time * 30) > 0 ? 'rgba(255,80,80,0.8)' : 'rgba(255,80,80,0.3)'; ctx.lineWidth = 3; ctx.stroke(); }
      return;
    }
    const tr = e.trail;
    for (let i = 0; i < tr.length; i += 5) { const k = i / tr.length; circlePath(tr[i].x, tr[i].y, e.r * (0.4 + k * 0.5)); neonShape(e.st === 'stranded' ? '#668' : c, 2, f); }
    bossDraw(e, c, f, () => { circlePath(e.x, e.y, e.r); neonShape(e.st === 'stranded' ? '#888' : c, 3.2, f); });
    for (const s of [-1, 1]) { const a = e.ang + s * 0.5; circlePath(e.x + Math.cos(a) * e.r * 0.55, e.y + Math.sin(a) * e.r * 0.55, 5); ctx.fillStyle = e.st === 'stranded' ? '#555' : '#fff'; ctx.fill(); }
    if (e.st === 'stranded') { ctx.font = `bold 16px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe14d'; ctx.fillText(`좌초 ${Math.ceil(e.t)}`, e.x, e.y - e.r - 16); }
  }
};

// ---------- 보스 3: 시우 ----------
EN.boss_siwoo = {
  boss: true, hp: 1, r: 18, spd: 230, color: '#9b6bff', contact: 12, heavy: true,
  init(e) { e.hp = e.maxHp = 3400 * G.bossHp; e.bossId = 'siwoo'; e.name = '시우 (요원 07)'; e.st = 'move'; e.t = 1.6; e.dodgeCd = 0; e.dodgeT = 0; e.strafe = 1; e.pat = 0; },
  update(e, dt) {
    const ph2 = e.hp < e.maxHp * 0.5;
    if (room.smokeT > 0) { room.smokeT -= dt; if (room.smokeT <= 0) room.darkOn = false; }
    if (e.dodgeT > 0) {
      e.dodgeT -= dt; moveDir(e, e.dodgeA, 620, dt);
      e.x = clamp(e.x, 30, room.w - 30); e.y = clamp(e.y, 30, room.h - 30);
      if (Math.random() < 0.5) part({ x: e.x, y: e.y, life: 0.3, size: e.r, color: '#9b6bff', kind: 'ghost' });
      if (e.dodgeT <= 0) e.invuln = false;
      return;
    }
    e.dodgeCd -= dt;
    if (e.dodgeCd <= 0 && (e.st === 'move' || e.st === 'aim')) for (const b of BULLETS) {
      if (b.team !== 'p' || b.dead || d2(b.x, b.y, e.x, e.y) > 85 * 85) continue;
      e.dodgeA = Math.atan2(b.vy, b.vx) + (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
      e.dodgeT = 0.22; e.invuln = true; e.dodgeCd = ph2 ? 1.6 : 2.2;
      floatText(e.x, e.y - 30, '회피', '#b49bff', 14); SFX.play('roll', 0.6);
      if (e.st === 'aim') { e.st = 'move'; e.t = 0.6; }
      return;
    }
    const toP = angTo(e.x, e.y, P.x, P.y), d = dist(e.x, e.y, P.x, P.y);
    e.t -= dt;
    switch (e.st) {
      case 'move': {
        e.ang = toP;
        const a = d > 340 ? toP : d < 220 ? toP + Math.PI : toP + Math.PI / 2 * e.strafe;
        moveToward(e, e.x + Math.cos(a) * 50, e.y + Math.sin(a) * 50, e.spd * e.sm * 0.7, dt);
        if (Math.random() < dt * 0.5) e.strafe *= -1;
        if (e.t <= 0) {
          const pats = ph2 ? ['burst', 'blink', 'clones', 'slash', 'smoke', 'burst'] : ['burst', 'slash', 'burst', 'clones'];
          const p = pats[e.pat++ % pats.length];
          if (p === 'burst') { for (let k = 0; k < 3; k++) room.timers.push({ t: k * 0.18, fn: () => { if (!e.dead) eFan(e, angTo(e.x, e.y, P.x, P.y), 3, 0.25, 400, 11, { color: '#b49bff' }); } }); e.t = 1.3; }
          else if (p === 'slash') { e.st = 'aim'; e.t = 0.6; e.lockA = toP; SFX.play('warn'); }
          else if (p === 'clones') { if (room.enemies.filter(m => !m.dead && m.type === 'siwoo_clone').length < 2) for (const k of [-1, 1]) spawnEnemy('siwoo_clone', clamp(e.x + k * 90, 40, room.w - 40), e.y, { instant: true }); floatText(e.x, e.y - 40, '그림자 분신', '#b49bff', 16); e.t = 1.4; }
          else if (p === 'blink') { e.st = 'mark'; e.t = 0.85; e.mx = clamp(P.x - Math.cos(P.ang) * 90, 40, room.w - 40); e.my = clamp(P.y - Math.sin(P.ang) * 90, 40, room.h - 40); SFX.play('warn'); }
          else { room.darkOn = true; room.smokeT = 4; floatText(e.x, e.y - 40, '연막', '#b49bff', 18); SFX.play('glitch'); e.t = 1.2; }
        }
        break;
      }
      case 'aim':
        e.lockA += clamp(angDiff(e.lockA, toP), -1 * dt, 1 * dt); e.ang = e.lockA;
        if (e.t <= 0) { e.st = 'dash'; e.t = 0.4; e.contact = 20; SFX.play('slash'); }
        break;
      case 'dash': {
        const nx = e.x + Math.cos(e.lockA) * 720 * dt, ny = e.y + Math.sin(e.lockA) * 720 * dt;
        if (nx < e.r || nx > room.w - e.r || ny < e.r || ny > room.h - e.r || wallAt(nx, ny) || e.t <= 0) { e.st = 'move'; e.t = 1.3; e.contact = 12; }
        else { e.x = nx; e.y = ny; part({ x: e.x, y: e.y, life: 0.25, size: e.r, color: '#9b6bff', kind: 'ghost' }); }
        break;
      }
      case 'mark':
        if (e.t <= 0) {
          e.x = e.mx; e.y = e.my; SFX.play('tele');
          eRing(e, 10, 230, 10, rand(0, TAU), { color: '#b49bff' });
          burst(e.x, e.y, '#9b6bff', 20, 260, 0.5, 3);
          e.st = 'move'; e.t = 1.4;
        }
        break;
    }
  },
  draw(e, c, f) {
    if (e.st === 'aim') { ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.lockA) * 700, e.y + Math.sin(e.lockA) * 700); ctx.strokeStyle = `rgba(180,155,255,${0.35 + Math.sin(G.time * 40) * 0.2})`; ctx.lineWidth = 10; ctx.stroke(); }
    if (e.st === 'mark') { circlePath(e.mx, e.my, 26 + Math.sin(G.time * 30) * 4); ctx.strokeStyle = '#ff3df0'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#ff3df0'; ctx.font = `bold 14px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('!', e.mx, e.my + 5); }
    ctx.globalAlpha = e.dodgeT > 0 ? 0.4 : 1;
    bossDraw(e, c, f, () => drawAgent(e, c, f, e.r));
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#d8c8ff'; ctx.font = `bold 11px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('07', e.x, e.y + 4);
  }
};

// ---------- 보스 4: 센티넬 ----------
EN.boss_sentinel = {
  boss: true, hp: 1, r: 50, spd: 0, color: '#ff3d6a', contact: 18, heavy: true,
  init(e) {
    e.hp = e.maxHp = 4500 * G.bossHp; e.bossId = 'sentinel'; e.name = '센티넬';
    e.st = 'idle'; e.t = 2.5; e.ventT = 6; e.openT = 0; e.beamT = 6; e.beamA = 0; e.pat = 0; e.termIdx = 0; e.assistT = 0; e.home = { x: room.w / 2, y: 250 };
  },
  update(e, dt) {
    const ph2 = e.hp < e.maxHp * 0.5;
    if (ph2 && !e.ph2) { e.ph2 = true; G.banner = { text: '블랙아웃', sub: '벙커의 불이 꺼진다', t: 1.8, color: '#ff3d6a' }; room.dark = true; room.darkOn = true; room.darkT = 5; SFX.play('glitch'); shake(12); }
    // 마더보드 단말기 (체력 75%, 40%)
    const th = [0.75, 0.4];
    if (e.termIdx < 2 && e.hp < e.maxHp * th[e.termIdx]) {
      e.termIdx++;
      const s = freeSpot(22, 260, 80) || { x: room.w * 0.5, y: room.h * 0.8 };
      room.props.push({ type: 'mterm', x: s.x, y: s.y, r: 22, life: 15, interact: '[E] 마더보드 연결' });
      G.banner = { text: '마더보드 단말기', sub: '[E] 연결하면 강력한 지원. 하지만 마더보드에게 문을 여는 일이다', t: 2.6, color: '#ff3df0' };
      SFX.play('glitch');
    }
    if (e.assistT > 0) { e.assistT -= dt; e.dmgTakenMult = 1.5; e.contact = 0; return; }
    e.contact = 18;
    const spd = (ph2 ? 1.15 : 1) * (room.ctrl === 'mother' ? 0.7 : 1);
    // 코어 과열 배출: 열린 동안만 제대로 피해가 들어간다
    if (e.openT > 0) { e.openT -= dt; e.dmgTakenMult = 1.2; }
    else { e.dmgTakenMult = 0.45; e.ventT -= dt; if (e.ventT <= 0) { e.openT = 5; e.ventT = 7; floatText(e.x, e.y - 80, '코어 과열 배출!', '#ffe14d', 22); SFX.play('stun'); } }
    // 회전 레이저
    e.beamT -= dt;
    if (e.beamT <= -4) e.beamT = 9;
    if (e.beamT < 0) {
      e.beamA += dt * 0.45 * spd;
      const nb = ph2 ? 2 : 1; e.nb = nb;
      for (let k = 0; k < nb; k++) {
        const a = e.beamA + k * Math.PI, L = e.beamT > -1.4 ? 0 : 900;
        e['beamL' + k] = L;
        if (L && segDist(P.x, P.y, e.x, e.y, e.x + Math.cos(a) * L, e.y + Math.sin(a) * L) < P.r + 7) damagePlayer(14, e);
      }
    }
    e.t -= dt * spd;
    e.x = lerp(e.x, e.home.x + Math.sin(G.time * 0.6) * 160, Math.min(1, 1.5 * dt)); e.y = lerp(e.y, e.home.y, Math.min(1, 1.5 * dt));
    if (e.t <= 0) {
      const pats = ph2 ? ['ring', 'grid', 'fan', 'drones', 'lob', 'ring'] : ['ring', 'fan', 'drones', 'grid', 'lob'];
      const p = pats[e.pat++ % pats.length];
      if (p === 'ring') eRing(e, 16, 210, 11, rand(0, TAU), { color: '#ff6a8a' });
      else if (p === 'fan') eFan(e, angTo(e.x, e.y, P.x, P.y), 7, 0.9, 300, 11, { color: '#ff6a8a' });
      else if (p === 'drones') { if (room.enemies.filter(m => !m.dead && m.type === 'sentry').length < 2) for (const k of [-1, 1]) spawnEnemy('sentry', clamp(e.x + k * 160, 40, room.w - 40), e.y + 90, {}); }
      else if (p === 'lob') for (let i = 0; i < 3; i++) lob(e, clamp(P.x + rand(-160, 160), 30, room.w - 30), clamp(P.y + rand(-160, 160), 30, room.h - 30), 1.2 + i * 0.2, 62, 14, true);
      else {
        floatText(e.x, e.y - 80, '레이저 격자', '#ff3d6a', 18); SFX.play('warn');
        const vx = clamp(P.x + rand(-60, 60), 40, room.w - 40), hy = clamp(P.y + rand(-60, 60), 40, room.h - 40);
        addHazard({ type: 'laser', shape: 'r', x: vx - 7, y: 0, w: 14, h: room.h, cycle: [0.01, 1.5, 0.8], state: 'off', ct: 0.01, life: 2.35, boss: true });
        addHazard({ type: 'laser', shape: 'r', x: 0, y: hy - 7, w: room.w, h: 14, cycle: [0.01, 1.5, 0.8], state: 'off', ct: 0.01, life: 2.35, boss: true });
      }
      e.t = 2.1;
    }
  },
  draw(e, c, f) {
    if (e.beamT < 0) for (let k = 0; k < (e.nb || 1); k++) {
      const a = e.beamA + k * Math.PI, L = e['beamL' + k] || 0;
      if (L) { neonLine(e.x, e.y, e.x + Math.cos(a) * L, e.y + Math.sin(a) * L, '#ff3d6a', 6); neonLine(e.x, e.y, e.x + Math.cos(a) * L, e.y + Math.sin(a) * L, '#fff', 2); }
      else { ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(a) * 900, e.y + Math.sin(a) * 900); ctx.strokeStyle = `rgba(255,61,106,${0.25 + Math.sin(G.time * 30) * 0.15})`; ctx.lineWidth = 2; ctx.stroke(); }
    }
    const open = e.openT > 0, gap = open ? 16 : 0;
    bossDraw(e, c, f, () => {
      for (let i = 0; i < 4; i++) {
        const a = G.time * 0.8 + i * Math.PI / 2;
        ctx.beginPath(); ctx.arc(e.x + Math.cos(a + 0.4) * gap, e.y + Math.sin(a + 0.4) * gap, e.r, a, a + 1.25);
        ctx.strokeStyle = e.assistT > 0 ? '#c86bff' : c; ctx.lineWidth = 9; ctx.stroke();
      }
      circlePath(e.x, e.y, e.r * 0.55); neonShape(open ? '#ffe14d' : c, 3, f);
      circlePath(e.x, e.y, 12 + (open ? Math.sin(G.time * 20) * 4 : 0)); ctx.fillStyle = open ? '#fff' : '#ff3d6a'; ctx.fill();
    });
    if (open) { ctx.font = `bold 15px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe14d'; ctx.fillText(`코어 노출 ${e.openT.toFixed(1)}`, e.x, e.y + e.r + 26); }
    if (e.assistT > 0) { circlePath(e.x, e.y, e.r + 20 + Math.sin(G.time * 12) * 4); ctx.strokeStyle = 'rgba(200,107,255,0.8)'; ctx.lineWidth = 3; ctx.stroke(); }
  }
};

// ---------- 일반 방 지형 ----------
function genLayoutS2() {
  const W = room.w, H = room.h, z = room.zid;
  const spot = (r, d) => freeSpot(r, d || 240, 60);
  const puddle = (type, n, r0, r1) => { for (let i = 0; i < n; i++) { const r = rand(r0, r1); const s = freeSpot(r, 200, 40); if (s) addHazard({ type, x: s.x, y: s.y, r }); } };
  const barrels = n => { for (let i = 0; i < n; i++) { const s = spot(16); if (s) room.props.push({ type: 'barrel', x: s.x, y: s.y, r: 15, hp: 20, shootable: true }); } };
  if (z === 4) { // 차량기지: 선로와 열차
    const n = randi(1, 2), ys = [];
    for (let i = 0; i < n * 10 && ys.length < n; i++) {
      const y = rand(140, H - 220);
      if (Math.abs(y - room.sy) < 160 || ys.some(o => Math.abs(o - y) < 200)) continue;
      ys.push(y);
    }
    for (const y of ys) addHazard({ type: 'train', shape: 'r', x: 0, y: y - 36, w: W, h: 72, cycle: [rand(6, 9), 1.8, 0.8], state: 'off', ct: rand(2, 6) });
    puddle('oil', randi(2, 3), 50, 80);
    barrels(randi(3, 5));
    const s = spot(16, 300); if (s) room.props.push({ type: 'hturret', x: s.x, y: s.y, r: 16, ang: 0, cd: 1.5, hacked: false, interact: '[E] 포탑 해킹' });
  } else if (z === 5) { // 수로: 물웅덩이와 수위 변화
    puddle('water', randi(5, 7), 60, 110);
    puddle('slick', 1, 90, 130);
    room.flood = { state: 'off', t: rand(6, 9) };
    barrels(2);
  } else if (z === 6) { // 외곽 3구역: 긴 정전
    room.dark = true; room.darkOn = false; room.darkT = 2.5;
    puddle('oil', 2, 50, 80); puddle('water', 1, 60, 90);
    barrels(randi(2, 4));
  } else { // 벙커: 센티넬과 마더보드가 번갈아 장악
    room.ctrl = 'sentinel'; room.ctrlT = 12;
    for (let i = 0; i < randi(2, 3); i++) {
      const horiz = Math.random() < 0.5, L = rand(320, 520);
      const w = horiz ? L : 12, h = horiz ? 12 : L;
      const x = rand(80, W - 80 - w), y = rand(80, H - 80 - h);
      if (circleRect(room.sx, room.sy, 150, { x, y, w, h })) continue;
      addHazard({ type: 'laser', shape: 'r', x, y, w, h, cycle: [rand(1.8, 2.8), 0.9, 1.3], state: 'off', ct: rand(0, 2.5), ctrl: true });
    }
    for (let i = 0; i < 2; i++) { const s = spot(16, 300); if (s) room.props.push({ type: 'hturret', x: s.x, y: s.y, r: 16, ang: 0, cd: 1.5, hacked: false, interact: '[E] 포탑 해킹' }); }
    barrels(2);
  }
}

// ---------- 방 갱신 (수위 · 장악 · 열차 소리 · 단말기) ----------
function updateS2Room(dt) {
  // 수위 변화
  const fl = room.flood;
  if (fl) {
    fl.t -= dt;
    if (fl.t <= 0) {
      if (fl.state === 'off') { fl.state = 'warn'; fl.t = 2; floatText(P.x, P.y - 50, '수위 상승!', '#3de0c8', 20); SFX.play('warn'); }
      else if (fl.state === 'warn') { fl.state = 'on'; fl.t = 6; SFX.play('water'); }
      else { fl.state = 'off'; fl.t = rand(9, 12); }
    }
    room.floodOn = fl.state === 'on';
    if (room.floodOn) {
      fl.soakT = (fl.soakT || 0) - dt;
      if (fl.soakT <= 0) { fl.soakT = 1; for (const e of room.enemies) if (!e.dead && !e.spawning && !e.flying && !(e.soakT > 0)) applyStatus(e, 'water', {}); }
    }
  }
  // 벙커 장악 교대
  if (room.ctrl) {
    room.ctrlT -= dt;
    if (room.ctrlT <= 0) {
      room.ctrl = room.ctrl === 'sentinel' ? 'mother' : 'sentinel'; room.ctrlT = 14;
      G.banner = room.ctrl === 'mother'
        ? { text: '마더보드 장악', sub: '레이저 정지 · 해킹 빨라짐 · 센티넬 감속', t: 1.4, color: '#c86bff' }
        : { text: '센티넬 장악', sub: '레이저 격자 가동', t: 1.4, color: '#ff3d6a' };
      SFX.play('glitch');
    }
    if (room.ctrl === 'mother') {
      P.hackCd -= dt;
      for (const h of room.hazards) if (h.ctrl) { h.state = 'off'; h.on = false; h.ct = Math.max(h.ct, 0.5); }
    }
  }
  // 외곽 3구역: 어둠이 길고 빛은 짧다
  if (room.zid === 6 && room.dark && !room.darkOn && room.darkT > 4) room.darkT = 4;
  // 열차 소리
  for (const h of room.hazards) if (h.type === 'train') {
    if (h.state !== h.prev) { if (h.state === 'warn') SFX.play('warn'); if (h.state === 'on') { SFX.play('roll'); shake(6); } h.prev = h.state; }
  }
  // 단말기
  for (const p of room.props) if (p.type === 'mterm' && !p.dead) { p.life -= dt; if (p.life <= 0) { p.dead = true; floatText(p.x, p.y - 30, '연결이 끊겼다', '#c86bff', 16); } }
}
function hitPropS2(p, dmg) {
  if (p.type !== 'valve') return false;
  p.hp -= dmg; p.flash = 0.08;
  if (p.hp <= 0) { p.dead = true; burst(p.x, p.y, '#3de0c8', 20, 250, 0.5, 3); floatText(p.x, p.y - 30, '밸브 개방', '#3de0c8', 16); SFX.play('water'); }
  return true;
}
function interactPropS2(p) {
  if (p.type !== 'mterm') return;
  p.dead = true; p.interact = null;
  run.momAssist = (run.momAssist || 0) + 1; if (run.rep) run.rep.mom = clamp((run.rep.mom || 0) + 1, -5, 5);
  const s = room.enemies.find(e => e.bossId === 'sentinel' && !e.dead);
  if (s) { s.hp = Math.max(1, s.hp - s.maxHp * 0.09); s.assistT = 4; s.openT = 6; }
  room.ctrl = 'mother'; room.ctrlT = 14;
  G.glitchVis = 0.8; G.flash = 0.4; G.flashColor = '200,107,255'; shake(12); SFX.play('glitch');
  G.banner = { text: `마더보드 연결 ${run.momAssist}/2`, sub: '「감사합니다. 기억하겠습니다.」', t: 2, color: '#c86bff' };
  for (let i = 0; i < 3; i++) part({ x: P.x, y: P.y, life: 0.6 + i * 0.15, size: 200 + i * 120, color: '#c86bff', kind: 'ring' });
}

// ---------- 그리기 ----------
function drawHazardsS2() {
  for (const h of room.hazards) {
    if (h.type !== 'train') continue;
    if (!onScreen(h.x + h.w / 2, h.y + h.h / 2, Math.max(h.w, h.h))) continue;
    ctx.fillStyle = 'rgba(40,20,20,0.5)'; ctx.fillRect(h.x, h.y, h.w, h.h);
    ctx.strokeStyle = 'rgba(255,140,120,0.35)'; ctx.lineWidth = 3;
    for (const yy of [h.y + 14, h.y + h.h - 14]) { ctx.beginPath(); ctx.moveTo(h.x, yy); ctx.lineTo(h.x + h.w, yy); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,140,120,0.15)'; for (let x = h.x; x < h.x + h.w; x += 40) ctx.fillRect(x, h.y + 10, 8, h.h - 20);
    if (h.state === 'warn') {
      ctx.fillStyle = Math.sin(G.time * 30) > 0 ? 'rgba(255,40,40,0.35)' : 'rgba(255,40,40,0.1)'; ctx.fillRect(h.x, h.y, h.w, h.h);
      ctx.fillStyle = '#ff6a5a'; ctx.font = `bold 16px ${FONT}`; ctx.textAlign = 'center';
      ctx.fillText('⚠ 열차 접근', clamp(P.x, h.x + 100, h.x + h.w - 100), h.y + h.h / 2 + 6);
    } else if (h.state === 'on') {
      ctx.fillStyle = 'rgba(255,230,200,0.85)'; ctx.fillRect(h.x, h.y + 6, h.w, h.h - 12);
      ctx.fillStyle = 'rgba(255,80,60,0.9)';
      for (let x = (G.time * 2400) % 120 - 120; x < h.w; x += 120) ctx.fillRect(h.x + x, h.y + 10, 70, h.h - 20);
    }
  }
}
function drawPropsS2() {
  for (const p of room.props) {
    if (p.dead || !onScreen(p.x, p.y, 80)) continue;
    if (p.type === 'valve') {
      circlePath(p.x, p.y, p.r); neonShape(p.flash > 0 ? '#fff' : '#3de0c8', 2.6, '#06222a');
      for (let i = 0; i < 4; i++) { const a = G.time * 2 + i * Math.PI / 2; neonLine(p.x, p.y, p.x + Math.cos(a) * 14, p.y + Math.sin(a) * 14, '#3de0c8', 2); }
      hpBar(p.x, p.y - p.r - 10, 44, p.hp / p.maxHp, '#3de0c8');
      ctx.fillStyle = '#6affe6'; ctx.font = `11px ${FONT2}`; ctx.textAlign = 'center'; ctx.fillText('밸브', p.x, p.y + p.r + 16);
    } else if (p.type === 'mterm') {
      const k = Math.sin(G.time * 6) * 0.5 + 0.5;
      ctx.beginPath(); ctx.rect(p.x - 18, p.y - 22, 36, 44); neonShape('#ff3df0', 2.6, '#1e0a26');
      circlePath(p.x, p.y - 4, 8 + k * 3); ctx.fillStyle = '#ff3df0'; ctx.fill();
      circlePath(p.x, p.y, 40 + k * 12); ctx.strokeStyle = `rgba(255,61,240,${0.5 - k * 0.3})`; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ffb0f5'; ctx.font = `bold 12px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(`마더보드 ${Math.ceil(p.life)}`, p.x, p.y + 38);
    } else if (p.type === 'objgen' && room.rescue) {
      ctx.fillStyle = '#6affe6'; ctx.font = `bold 13px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('구조 캡슐', p.x, p.y + p.r + 20);
    }
  }
}
function drawS2Screen() {
  const fl = room.flood;
  if (fl && fl.state !== 'off') {
    const k = fl.state === 'on' ? 0.16 : 0.05 + Math.sin(G.time * 12) * 0.03;
    ctx.fillStyle = `rgba(30,170,190,${k})`; ctx.fillRect(0, 0, VW, VH);
    if (fl.state === 'on') { ctx.fillStyle = 'rgba(160,255,240,0.08)'; for (let i = 0; i < 6; i++) ctx.fillRect(0, (G.time * 40 + i * VH / 6) % VH, VW, 2); }
  }
  if (room.ctrl) { ctx.fillStyle = room.ctrl === 'mother' ? 'rgba(200,107,255,0.07)' : 'rgba(255,40,80,0.05)'; ctx.fillRect(0, 0, VW, VH); }
}
