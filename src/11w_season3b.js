// ================= 시즌 3: 적 · 보스 · 지형 =================
const _S3_FAKE = e => ({ x: e.x, y: e.y, dead: false, ally: false });

// ---------- 일반 적 ----------
EN.scav = {
  hp: 30, r: 12, spd: 150, color: '#e8a840', contact: 4, coin: 2,
  init(e) { e.st = 'chase'; e.stolen = 0; e.fleeT = 7; },
  update(e, dt) {
    if (e.st === 'flee') {
      e.fleeT -= dt; const a = angTo(P.x, P.y, e.x, e.y);
      moveToward(e, e.x + Math.cos(a) * 80, e.y + Math.sin(a) * 80, e.spd * 1.3 * e.sm, dt);
      if (e.fleeT <= 0) { floatText(e.x, e.y - 20, '도주!', '#ff9a4a', 16); e.stolen = 0; e.noReward = true; killEnemy(e, {}); }
      return;
    }
    const t = eTarget(e); moveToward(e, t.x, t.y, e.spd * e.sm, dt);
    if (!e.ally && !P.dead && P.iframe <= 0 && d2(e.x, e.y, P.x, P.y) < (e.r + P.r + 6) ** 2) {
      const n = Math.min(run.coins, 20 + 5 * run.zone);
      if (n > 0) { run.coins -= n; e.stolen = n; e.st = 'flee'; floatText(P.x, P.y - 40, `코인 -${n}`, '#ff9a4a', 18); SFX.play('hit'); }
    }
  },
  death(e) {
    if (!e.stolen) return;
    const v = Math.round(e.stolen * (1 + (BS.coinMult > 1.19 ? 1 : 0)));
    for (let i = 0; i < 3; i++) { const a = rand(0, TAU), s = rand(60, 160); room.pickups.push({ type: 'coin', x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, val: Math.max(1, Math.round(v / 3)), t: G.coinLife, max: G.coinLife }); }
    floatText(e.x, e.y - 24, '되찾았다!', '#ffe14d', 16);
  },
  draw(e, c, f) {
    polyPath(e.x, e.y, e.r * 1.1, 5, e.mang || 0); neonShape(c, 2.2, f);
    if (e.stolen) { circlePath(e.x, e.y - e.r - 8, 5); ctx.fillStyle = '#ffe14d'; ctx.fill(); }
  }
};
EN.biker = {
  hp: 40, r: 14, spd: 140, color: '#ff7a3a', contact: 0, coin: 2,
  init(e) { e.st = 'circle'; e.t = rand(1.2, 2.2); e.orb = rand(0, TAU); e.dir = Math.random() < 0.5 ? 1 : -1; },
  update(e, dt) {
    const t = eTarget(e); e.ang = angTo(e.x, e.y, t.x, t.y); e.t -= dt * e.atkMult;
    if (e.st === 'circle') {
      e.orb += dt * 0.8 * e.dir;
      moveToward(e, t.x + Math.cos(e.orb) * 300, t.y + Math.sin(e.orb) * 300, e.spd * e.sm, dt);
      if (e.t <= 0) { e.st = 'aim'; e.t = 0.75; e.lockA = e.ang; SFX.play('warn'); }
    } else if (e.st === 'aim') {
      e.lockA += clamp(angDiff(e.lockA, e.ang), -1.2 * dt, 1.2 * dt);
      if (e.t <= 0) { e.st = 'dash'; e.t = 0.55; e.contact = 14; }
    } else {
      moveDir(e, e.lockA, 620 * e.sm, dt);
      if (wallAt(e.x + Math.cos(e.lockA) * 24, e.y + Math.sin(e.lockA) * 24) || e.t <= 0) { e.st = 'circle'; e.t = rand(1.6, 2.6); e.contact = 0; }
    }
  },
  draw(e, c, f) {
    if (e.st === 'aim') { ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.lockA) * 520, e.y + Math.sin(e.lockA) * 520); ctx.strokeStyle = `rgba(255,120,60,${0.3 + Math.sin(G.time * 40) * 0.2})`; ctx.lineWidth = 8; ctx.stroke(); }
    const a = e.st === 'dash' ? e.lockA : e.ang; ctx.beginPath();
    ctx.moveTo(e.x + Math.cos(a) * e.r * 1.5, e.y + Math.sin(a) * e.r * 1.5); ctx.lineTo(e.x + Math.cos(a + 2.5) * e.r, e.y + Math.sin(a + 2.5) * e.r); ctx.lineTo(e.x + Math.cos(a - 2.5) * e.r, e.y + Math.sin(a - 2.5) * e.r); ctx.closePath(); neonShape(c, 2.2, f);
  }
};
EN.burrower = {
  hp: 50, r: 15, spd: 70, color: '#c89a54', contact: 8, coin: 3,
  init(e) { e.st = 'walk'; e.t = rand(2.5, 4); },
  update(e, dt) {
    const t = eTarget(e); e.t -= dt * e.atkMult;
    if (e.st === 'walk') { moveToward(e, t.x, t.y, e.spd * e.sm, dt); if (e.t <= 0) { e.st = 'dig'; e.t = 1.6; e.invuln = true; e.contact = 0; SFX.play('roll', 0.5); } }
    else if (e.st === 'dig') { moveToward(e, t.x, t.y, 230 * e.sm, dt); if (e.t <= 0) { e.st = 'rise'; e.t = 0.5; } }
    else if (e.st === 'rise') {
      if (e.t <= 0) { e.invuln = false; e.contact = 8; e.st = 'walk'; e.t = rand(3, 4.5); eRing(e, 8, 190, 8, rand(0, TAU), { color: '#e8c070' }); burst(e.x, e.y, '#c89a54', 16, 220, 0.5, 3); shake(4); }
    }
  },
  draw(e, c, f) {
    if (e.st === 'dig' || e.st === 'rise') {
      ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.ellipse(e.x, e.y + 4, e.r * 1.5, e.r * 0.8, 0, 0, TAU); ctx.fillStyle = '#5a4020'; ctx.fill(); ctx.globalAlpha = 1;
      for (let i = 0; i < 4; i++) { const a = G.time * 6 + i * 1.57; circlePath(e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r * 0.5, 2.4); ctx.fillStyle = '#e8c070'; ctx.fill(); }
      return;
    }
    circlePath(e.x, e.y, e.r); neonShape(c, 2.4, f); circlePath(e.x, e.y, e.r * 0.45); ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.stroke();
  }
};
EN.orb = {
  hp: 35, r: 12, spd: 90, color: '#40e4ff', contact: 6, coin: 3, flying: true,
  init(e) { e.cd = rand(1, 2); e.wob = rand(0, TAU); },
  update(e, dt) {
    const t = eTarget(e); e.wob += dt * 2.4;
    const a = angTo(e.x, e.y, t.x, t.y) + Math.sin(e.wob) * 1.3, d = dist(e.x, e.y, t.x, t.y);
    moveToward(e, e.x + Math.cos(d > 300 ? a : a + Math.PI) * 50, e.y + Math.sin(d > 300 ? a : a + Math.PI) * 50, e.spd * e.sm, dt);
    e.cd -= dt * e.atkMult;
    if (e.cd <= 0 && d < 560) { e.cd = 2.2; eShoot(e, angTo(e.x, e.y, t.x, t.y), 330, 9, { color: '#88f4ff' }); }
  },
  death(e) { if (e.ally) return; addHazard({ type: 'static', x: e.x, y: e.y, r: 46, life: 4 }); },
  draw(e, c, f) {
    circlePath(e.x, e.y, e.r); neonShape(c, 2, f);
    for (let i = 0; i < 3; i++) { const a = G.time * 7 + i * 2.1; neonLine(e.x, e.y, e.x + Math.cos(a) * (e.r + 7), e.y + Math.sin(a) * (e.r + 7), '#ffffff', 1.5); }
  }
};
EN.mender = {
  hp: 45, r: 12, spd: 95, color: '#6aff9a', contact: 0, coin: 3,
  init(e) { e.healT = 0.6; e.beam = null; },
  update(e, dt) {
    const t = eTarget(e), d = dist(e.x, e.y, t.x, t.y);
    const a = d < 380 ? angTo(t.x, t.y, e.x, e.y) : angTo(e.x, e.y, t.x, t.y) + Math.PI / 2;
    moveToward(e, e.x + Math.cos(a) * 60, e.y + Math.sin(a) * 60, e.spd * e.sm, dt);
    e.healT -= dt; e.beam = null;
    if (e.healT <= 0 && !e.ally) {
      let best = null, bd = 280 * 280;
      for (const o of room.enemies) { if (o === e || o.dead || o.spawning || o.boss || o.hp >= o.maxHp) continue; const dd = d2(o.x, o.y, e.x, e.y); if (dd < bd) { bd = dd; best = o; } }
      if (best) { best.hp = Math.min(best.maxHp, best.hp + best.maxHp * 0.05); e.beam = best; e.healT = 0.6; if (Math.random() < 0.3) floatText(best.x, best.y - best.r - 8, '+', '#6aff9a', 14); }
      else e.healT = 0.3;
    }
  },
  draw(e, c, f) {
    if (e.beam && !e.beam.dead) neonLine(e.x, e.y, e.beam.x, e.beam.y, 'rgba(106,255,154,0.8)', 2);
    circlePath(e.x, e.y, e.r); neonShape(c, 2.2, f);
    ctx.fillStyle = c; ctx.fillRect(e.x - 2, e.y - 6, 4, 12); ctx.fillRect(e.x - 6, e.y - 2, 12, 4);
  }
};
EN.relay_echo = {
  hp: 1, r: 15, spd: 0, color: '#40e4ff', contact: 0, coin: 0, heavy: true,
  init(e, o) { e.invuln = true; e.noReward = true; e.mode = o.mode || 0; e.cd = 0.4; e.x = room.w - P.x; e.y = room.h - P.y; },
  update(e, dt) {
    const tx = clamp(room.w - P.x, 30, room.w - 30), ty = e.mode === 1 ? clamp(P.y, 30, room.h - 30) : clamp(room.h - P.y, 30, room.h - 30);
    e.x = lerp(e.x, tx, Math.min(1, 9 * dt)); e.y = lerp(e.y, ty, Math.min(1, 9 * dt));
    e.ang = angTo(e.x, e.y, P.x, P.y); e.cd -= dt;
    if (e.cd <= 0 && (Input.mb[0] || Input.touchFire || Input.touchAuto) && !P.dead) { e.cd = e.mode === 1 ? 0.55 : 0.32; eShoot(e, e.ang, 400, 7, { color: '#88f4ff' }); }
  },
  draw(e, c, f) { ctx.globalAlpha = 0.6; drawAgent(e, c, f, e.r); ctx.globalAlpha = 1; ctx.fillStyle = '#88f4ff'; ctx.font = `bold 10px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('ECHO', e.x, e.y - e.r - 8); }
};

// ---------- 보스 방 준비 ----------
function bossRoomS3() {
  const W = room.w, H = room.h;
  if (room.zid === 8) for (const [x, y] of [[0.25, 0.62], [0.75, 0.62], [0.5, 0.72]]) room.walls.push({ x: W * x - 55, y: H * y - 28, w: 110, h: 56, hp: 320, maxHp: 320, kind: 'debris' });
  if (room.zid === 9) room.storm = { state: 'off', t: 5, dx: 1 };
  if (room.zid === 10) for (const [x, y] of [[0.12, 0.2], [0.88, 0.2], [0.12, 0.8], [0.88, 0.8]]) room.props.push({ type: 'rod', x: W * x, y: H * y, r: 14 });
}
function setupBossS3(id) {
  const cx = room.w / 2, cy = room.h / 2;
  if (id === 'warden') spawnEnemy('boss_warden', cx, 200, { instant: true });
  else if (id === 'roadreaper') spawnEnemy('boss_roadreaper', cx, 170, { instant: true });
  else if (id === 'relay') { spawnEnemy('boss_relay', cx, cy - 120, { instant: true }); room.echo1 = spawnEnemy('relay_echo', room.w - P.x, room.h - P.y, { instant: true }); }
  else if (id === 'council') for (let i = 0; i < 3; i++) spawnEnemy('boss_council', cx + Math.cos(i * TAU / 3) * 200, cy - 60 + Math.sin(i * TAU / 3) * 150, { instant: true, idx: i });
}

// ---------- 보스 1: 워든 (엄폐 저격수) ----------
EN.boss_warden = {
  boss: true, hp: 1, r: 36, spd: 0, color: '#7fb0d0', contact: 12, heavy: true,
  init(e) { e.hp = e.maxHp = 2900 * G.bossHp; e.bossId = 'warden'; e.name = '워든'; e.st = 'move'; e.t = 1.4; e.post = 0; e.pat = 0; e.lockA = 0; },
  update(e, dt) {
    const W = room.w, H = room.h, posts = [[0.2, 0.2], [0.5, 0.14], [0.8, 0.2], [0.5, 0.32]];
    const ph2 = e.hp < e.maxHp * 0.5, toP = angTo(e.x, e.y, P.x, P.y);
    if (ph2 && !e.ph2) { e.ph2 = true; G.banner = { text: '방벽 가동', sub: '워든이 지원을 요청했다', t: 1.6, color: '#7fb0d0' }; SFX.play('boss'); spawnEnemy('riot', e.x, e.y + 90, {}); }
    e.t -= dt * (ph2 ? 1.25 : 1); e.ang = toP;
    if (e.st === 'move') {
      const [px, py] = posts[e.post]; e.x = lerp(e.x, px * W, Math.min(1, 2.4 * dt)); e.y = lerp(e.y, py * H, Math.min(1, 2.4 * dt));
      if (e.t <= 0) {
        const pats = ph2 ? ['snipe', 'barrage', 'strike', 'snipe', 'strike'] : ['snipe', 'barrage', 'snipe', 'strike'], p = pats[e.pat++ % pats.length];
        if (p === 'snipe') { e.st = 'aim'; e.t = 1.3; e.lockA = toP; SFX.play('warn'); return; }
        if (p === 'barrage') eFan(e, toP, ph2 ? 6 : 4, 0.7, 290, 9, { color: '#a8d4ee' });
        else { floatText(e.x, e.y - 60, '포격 요청', '#a8d4ee', 18); SFX.play('warn'); for (let i = 0; i < (ph2 ? 4 : 3); i++) lob(e, clamp(P.x + (i ? rand(-200, 200) : 0), 40, W - 40), clamp(P.y + (i ? rand(-200, 200) : 0), 40, H - 40), 1.3 + i * 0.25, 62, 12, false); }
        e.post = (e.post + 1 + Math.floor(Math.random() * 3)) % 4; e.t = 1.6;
      }
    } else if (e.st === 'aim') {
      if (e.t > 0.35) e.lockA += clamp(angDiff(e.lockA, toP), -2.2 * dt, 2.2 * dt);
      if (e.t <= 0) {
        eShoot(e, e.lockA, 950, 18, { color: '#ffffff' }); SFX.play('sniper'); shake(5);
        if (ph2) room.timers.push({ t: 0.3, fn: () => { if (!e.dead) eShoot(e, e.lockA + rand(-0.1, 0.1), 950, 15, { color: '#ffffff' }); } });
        e.post = (e.post + 1 + Math.floor(Math.random() * 3)) % 4; e.st = 'move'; e.t = 1.4;
      }
    }
  },
  draw(e, c, f) {
    if (e.st === 'aim') { ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.lockA) * 1400, e.y + Math.sin(e.lockA) * 1400); ctx.strokeStyle = e.t < 0.35 ? '#ff2020' : 'rgba(255,60,60,0.5)'; ctx.lineWidth = e.t < 0.35 ? 4 : 2; ctx.stroke(); }
    bossDraw(e, c, f, () => { polyPath(e.x, e.y, e.r, 4, Math.PI / 4); neonShape(c, 3.2, f); gunBarrel(e, 30, 9, '#a8d4ee', e.ang); circlePath(e.x, e.y, 9); ctx.fillStyle = '#ff4040'; ctx.fill(); });
  }
};

// ---------- 보스 2: 로드 리퍼 (차선 질주) ----------
function layMine(x, y) { if (room.hazards.filter(h => h.type === 'mine').length < 10) addHazard({ type: 'mine', x, y, r: 18, life: 30, armT: 1 }); }
EN.boss_roadreaper = {
  boss: true, hp: 1, r: 38, spd: 0, color: '#e8a840', contact: 14, heavy: true,
  init(e) { e.hp = e.maxHp = 3800 * G.bossHp; e.bossId = 'roadreaper'; e.name = '로드 리퍼'; e.st = 'cruise'; e.t = 2.2; e.pat = 0; e.mineT = 2; e.dir = 1; e.lanes = []; e.li = 0; },
  update(e, dt) {
    const W = room.w, H = room.h, ph2 = e.hp < e.maxHp * 0.5, toP = angTo(e.x, e.y, P.x, P.y);
    e.t -= dt * (ph2 ? 1.2 : 1);
    if (e.st === 'cruise') {
      e.contact = 14; e.dmgTakenMult = 1; e.flying = false; e.ang = toP;
      e.x += e.dir * 170 * dt; if (e.x > W - 130) e.dir = -1; if (e.x < 130) e.dir = 1; e.y = lerp(e.y, 170, Math.min(1, 3 * dt));
      e.mineT -= dt; if (e.mineT <= 0) { e.mineT = 2.2; layMine(clamp(P.x + rand(-220, 220), 50, W - 50), clamp(P.y + rand(-220, 220), 50, H - 50)); }
      if (e.t <= 0) {
        const p = ['fan', 'lane', 'ring', 'lane'][e.pat++ % 4];
        if (p === 'fan') { eFan(e, toP, ph2 ? 7 : 5, 0.8, 300, 10, { color: '#ffc866' }); e.t = 1.7; }
        else if (p === 'ring') { eRing(e, 14, 200, 10, rand(0, TAU), { color: '#ffc866' }); e.t = 1.7; }
        else { e.lanes = [clamp(P.y, 90, H - 90)]; if (ph2) e.lanes.push(clamp(H - P.y + rand(-80, 80), 90, H - 90)); e.st = 'warn'; e.t = 1.2; SFX.play('warn'); floatText(e.x, e.y - 60, '차선 경고', '#ff8a4a', 18); }
      }
    } else if (e.st === 'warn') {
      if (e.t <= 0) { e.st = 'sweep'; e.li = 0; e.sdir = Math.random() < 0.5 ? 1 : -1; e.flying = true; e.y = e.lanes[0]; e.x = e.sdir > 0 ? e.r : W - e.r; SFX.play('roll'); }
    } else if (e.st === 'sweep') {
      e.contact = 26; e.x += e.sdir * 1450 * dt; e.ang = e.sdir > 0 ? 0 : Math.PI; if (Math.random() < 0.6) shake(2);
      if ((e.sdir > 0 && e.x >= W - e.r - 4) || (e.sdir < 0 && e.x <= e.r + 4)) {
        if (e.li + 1 < e.lanes.length) { e.li++; e.sdir *= -1; e.y = e.lanes[e.li]; }
        else { e.st = 'overheat'; e.t = 2.6; e.flying = false; e.contact = 0; G.banner = { text: '과열!', sub: '지금이 기회 — 받는 피해 2배', t: 1.2, color: '#ffc866' }; SFX.play('stun'); }
      }
    } else if (e.st === 'overheat') {
      e.dmgTakenMult = 2.2; e.contact = 0; if (Math.random() < 0.5) part({ x: e.x + rand(-20, 20), y: e.y - 10, vx: rand(-20, 20), vy: -rand(40, 90), life: 0.6, size: rand(8, 14), color: 'rgba(200,200,200,0.3)', kind: 'smoke' });
      if (e.t <= 0) { e.st = 'cruise'; e.t = 1.6; }
    }
  },
  draw(e, c, f) {
    if (e.st === 'warn') for (const ly of e.lanes) { ctx.fillStyle = Math.sin(G.time * 30) > 0 ? 'rgba(255,90,40,0.35)' : 'rgba(255,90,40,0.12)'; ctx.fillRect(0, ly - 38, room.w, 76); }
    bossDraw(e, e.st === 'overheat' ? '#887766' : c, f, () => {
      ctx.beginPath(); ctx.rect(e.x - e.r * 1.3, e.y - e.r * 0.7, e.r * 2.6, e.r * 1.4); neonShape(e.st === 'overheat' ? '#887766' : c, 3.2, f);
      for (const s of [-1, 1]) for (const k of [-0.8, 0.8]) { ctx.fillStyle = '#1a1208'; ctx.fillRect(e.x + k * e.r - 8, e.y + s * e.r * 0.7 - 5, 16, 10); }
      circlePath(e.x + (e.dir >= 0 ? 1 : -1) * e.r * 0.8, e.y, 8); ctx.fillStyle = '#ffc866'; ctx.fill();
    });
    if (e.st === 'overheat') { ctx.font = `bold 16px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe14d'; ctx.fillText('과열', e.x, e.y - e.r - 14); }
  }
};

// ---------- 보스 3: 릴레이 (거울 분신) ----------
EN.boss_relay = {
  boss: true, hp: 1, r: 30, spd: 0, color: '#40e4ff', contact: 12, heavy: true,
  init(e) { e.hp = e.maxHp = 3400 * G.bossHp; e.bossId = 'relay'; e.name = '릴레이'; e.t = 2; e.a = rand(0, TAU); e.pat = 0; },
  update(e, dt) {
    const W = room.w, H = room.h, ph2 = e.hp < e.maxHp * 0.5, toP = angTo(e.x, e.y, P.x, P.y);
    if (ph2 && !e.ph2) { e.ph2 = true; room.echo2 = spawnEnemy('relay_echo', room.w - P.x, P.y, { instant: true, mode: 1 }); G.banner = { text: '신호 증폭', sub: '두 번째 분신이 나타났다', t: 1.6, color: '#40e4ff' }; SFX.play('boss'); }
    e.a += dt * (ph2 ? 0.7 : 0.5); e.ang = toP;
    e.x = lerp(e.x, W / 2 + Math.cos(e.a) * 230, Math.min(1, 2 * dt)); e.y = lerp(e.y, H * 0.4 + Math.sin(e.a) * 130, Math.min(1, 2 * dt));
    e.t -= dt * (ph2 ? 1.25 : 1);
    if (e.t <= 0) {
      const p = ['ring', 'bolt', 'fan', 'bolt'][e.pat++ % 4];
      if (p === 'ring') eRing(e, ph2 ? 16 : 12, 190, 10, rand(0, TAU), { color: '#88f4ff' });
      else if (p === 'fan') eFan(e, toP, ph2 ? 7 : 5, 0.8, 300, 10, { color: '#88f4ff' });
      else { floatText(e.x, e.y - 50, '낙뢰 경고', '#88f4ff', 18); SFX.play('warn'); for (let i = 0; i < (ph2 ? 5 : 4); i++) lob(e, clamp(P.x + (i ? rand(-200, 200) : 0), 40, W - 40), clamp(P.y + (i ? rand(-200, 200) : 0), 40, H - 40), 1.3 + i * 0.22, 60, 13, false); }
      e.t = 2.0;
    }
  },
  draw(e, c, f) {
    for (const k of [room.echo1, room.echo2]) if (k && !k.dead) { ctx.setLineDash([4, 8]); neonLine(e.x, e.y, k.x, k.y, 'rgba(64,228,255,0.25)', 1); ctx.setLineDash([]); }
    bossDraw(e, c, f, () => {
      polyPath(e.x, e.y, e.r, 6, G.time); neonShape(c, 3.2, f);
      for (let i = 0; i < 3; i++) { const a = G.time * 2 + i * TAU / 3; circlePath(e.x + Math.cos(a) * (e.r + 12), e.y + Math.sin(a) * (e.r + 12), 5); ctx.fillStyle = '#88f4ff'; ctx.fill(); }
      circlePath(e.x, e.y, 9); ctx.fillStyle = '#ffffff'; ctx.fill();
    });
  }
};

// ---------- 보스 4: 메리디안 합의체 (세 의장) ----------
EN.boss_council = {
  boss: true, hp: 1, r: 30, spd: 0, color: '#e8dcff', contact: 14, heavy: true,
  init(e, o) { e.idx = o.idx || 0; e.hp = e.maxHp = 1700 * G.bossHp; e.color = ['#ff5a6a', '#6aff9a', '#6ab4ff'][e.idx]; e.bossId = 'council'; e.name = ['붉은 의장', '초록 의장', '푸른 의장'][e.idx]; e.t = rand(1.6, 2.6); e.base = e.idx * TAU / 3; e.aimT = 0; e.pat = 0; },
  update(e, dt) {
    const down = room.councilDown || 0, sp = 1 + 0.35 * down, cx = room.w / 2, cy = room.h / 2 - 40, toP = angTo(e.x, e.y, P.x, P.y);
    const a = e.base + G.time * 0.3 * sp; e.x = lerp(e.x, cx + Math.cos(a) * 250, Math.min(1, 2 * dt)); e.y = lerp(e.y, cy + Math.sin(a) * 160, Math.min(1, 2 * dt)); e.ang = toP;
    if (e.aimT > 0) {
      e.aimT -= dt; if (e.aimT > 0.3) e.lockA += clamp(angDiff(e.lockA, toP), -2 * dt, 2 * dt);
      if (e.aimT <= 0) { eShoot(e, e.lockA, 900, 16, { color: '#9ad0ff' }); SFX.play('sniper'); }
      return;
    }
    e.t -= dt * sp;
    if (e.t <= 0) {
      if (e.idx === 0) { for (let k = 0; k < 3; k++) room.timers.push({ t: k * 0.22, fn: () => { if (!e.dead) eFan(e, angTo(e.x, e.y, P.x, P.y), 3, 0.3, 320, 9, { color: '#ff8a9a' }); } }); e.t = 2.2; }
      else if (e.idx === 1) { eRing(e, 12, 190, 10, rand(0, TAU), { color: '#9affbe' }); for (let i = 0; i < 2; i++) lob(e, clamp(P.x + rand(-160, 160), 40, room.w - 40), clamp(P.y + rand(-160, 160), 40, room.h - 40), 1.3 + i * 0.25, 58, 14, false); e.t = 2.4; }
      else { e.aimT = 0.95; e.lockA = toP; SFX.play('warn'); e.t = 2.8; if (e.pat++ % 3 === 2) { const vx = clamp(P.x + rand(-50, 50), 40, room.w - 40); addHazard({ type: 'laser', shape: 'r', x: vx - 7, y: 0, w: 14, h: room.h, cycle: [0.01, 1.5, 0.8], state: 'off', ct: 0.01, life: 2.35, boss: true }); } }
    }
  },
  death(e) { room.councilDown = (room.councilDown || 0) + 1; G.banner = { text: `${e.name} 정지`, sub: room.councilDown < 3 ? '남은 의장이 빨라진다' : '합의체 정지', t: 1.6, color: e.color }; },
  draw(e, c, f) {
    if (e.aimT > 0) { ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.lockA) * 1300, e.y + Math.sin(e.lockA) * 1300); ctx.strokeStyle = e.aimT < 0.3 ? '#ff2020' : 'rgba(110,180,255,0.6)'; ctx.lineWidth = e.aimT < 0.3 ? 4 : 2; ctx.stroke(); }
    bossDraw(e, c, f, () => {
      polyPath(e.x, e.y, e.r, e.idx === 0 ? 3 : e.idx === 1 ? 4 : 6, G.time * (e.idx ? 1 : -1)); neonShape(c, 3.2, f);
      ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * 0.6, e.r * 0.28, 0, 0, TAU); ctx.fillStyle = c; ctx.fill(); circlePath(e.x, e.y, 4); ctx.fillStyle = '#fff'; ctx.fill();
    });
  }
};

// ---------- 일반 방 지형 ----------
function genLayoutS3() {
  const W = room.w, H = room.h, z = room.zid;
  const spot = (r, d) => freeSpot(r, d || 240, 60);
  const puddle = (type, n, r0, r1) => { for (let i = 0; i < n; i++) { const r = rand(r0, r1), s = freeSpot(r, 200, 40); if (s) addHazard({ type, x: s.x, y: s.y, r }); } };
  const barrels = n => { for (let i = 0; i < n; i++) { const s = spot(16); if (s) room.props.push({ type: 'barrel', x: s.x, y: s.y, r: 15, hp: 20, shootable: true }); } };
  if (z === 8) { // 방벽: 탐조등
    room.lights = []; for (let i = 0; i < 2; i++) room.lights.push({ x: i ? W - 60 : 60, y: rand(120, H - 160), base: i ? Math.PI : 0, sw: 0.7, sp: rand(0.5, 0.8), ph: rand(0, 6), len: 560, half: 0.3, a: 0 });
    room.spotT = 0; room.spotCd = 0;
    puddle('oil', 2, 50, 80); barrels(randi(3, 4));
    for (let i = 0; i < 2; i++) { const s = spot(16, 300); if (s) room.props.push({ type: 'hturret', x: s.x, y: s.y, r: 16, ang: 0, cd: 1.5, hacked: false, interact: '[E] 포탑 해킹' }); }
  } else if (z === 9) { // 고속도로: 모래폭풍과 지뢰
    room.storm = { state: 'off', t: rand(4, 7), dx: Math.random() < 0.5 ? 1 : -1 };
    for (let i = 0; i < randi(4, 6); i++) { const s = freeSpot(18, 300, 40); if (s) layMine(s.x, s.y); }
    puddle('oil', 2, 50, 80); barrels(randi(2, 4));
  } else if (z === 10) { // 신호의 평원: 낙뢰와 피뢰침
    room.bolt = { state: 'off', t: rand(5, 8), strikes: [] };
    for (let i = 0; i < randi(2, 3); i++) { const s = spot(14, 260); if (s) room.props.push({ type: 'rod', x: s.x, y: s.y, r: 14 }); }
    for (let i = 0; i < 5; i++) { const s = freeSpot(10, 120, 40); if (s) room.props.push({ type: 'antenna', x: s.x, y: s.y, r: 10 }); }
    puddle('water', 2, 60, 90); barrels(2);
  } else { // 자오선 탑: 레이저 · 전기 바닥 교대
    room.ctrl3 = 'laser'; room.ctrl3T = 10;
    for (let i = 0; i < randi(2, 3); i++) {
      const horiz = Math.random() < 0.5, L = rand(320, 520), w = horiz ? L : 12, h = horiz ? 12 : L, x = rand(80, W - 80 - w), y = rand(80, H - 80 - h);
      if (circleRect(room.sx, room.sy, 150, { x, y, w, h })) continue;
      addHazard({ type: 'laser', shape: 'r', x, y, w, h, cycle: [rand(1.6, 2.4), 0.9, 1.2], state: 'off', ct: rand(0, 2), grp: 'laser' });
    }
    for (let i = 0; i < randi(2, 3); i++) {
      const w = rand(140, 220), h = rand(140, 220), x = rand(60, W - 60 - w), y = rand(60, H - 60 - h);
      if (circleRect(room.sx, room.sy, 180, { x, y, w, h })) continue;
      addHazard({ type: 'elecfloor', shape: 'r', x, y, w, h, cycle: [rand(1.8, 2.6), 0.9, 1.4], state: 'off', ct: rand(0, 2), grp: 'elec' });
    }
    barrels(2);
  }
}

// ---------- 방 갱신 ----------
function updateS3Room(dt) {
  const z = room.zid, W = room.w, H = room.h;
  // 지뢰
  for (const h of room.hazards) if (h.type === 'mine') {
    if (h.armT > 0) { h.armT -= dt; continue; }
    if (!P.dead && P.iframe <= 0 && d2(h.x, h.y, P.x, P.y) < (h.r + P.r) ** 2) { explode(h.x, h.y, 90, 22 * (BS.envResist || 1), { team: 'e' }); burst(h.x, h.y, '#ffc866', 18, 260, 0.5, 3); SFX.play('explode'); h.life = 0.01; }
  }
  // 탐조등
  if (room.lights && !room.done) {
    let seen = false;
    for (const l of room.lights) {
      l.a = l.base + Math.sin(G.time * l.sp + l.ph) * l.sw;
      const dd = dist(l.x, l.y, P.x, P.y), ad = Math.abs(angDiff(l.a, angTo(l.x, l.y, P.x, P.y)));
      if (dd < l.len && ad < l.half && !P.dead) seen = true;
    }
    room.spotCd -= dt; room.seen = seen;
    room.spotT = seen ? room.spotT + dt : Math.max(0, room.spotT - dt * 0.5);
    if (room.spotT > 0.9 && room.spotCd <= 0) {
      room.spotCd = 9; room.spotT = 0; G.banner = { text: '발각!', sub: '경비병이 몰려온다', t: 1.2, color: '#ff6a4a' }; SFX.play('warn');
      for (let i = 0; i < 2; i++) { const a = rand(0, TAU); spawnEnemy(i ? 'sentry' : 'grunt', clamp(P.x + Math.cos(a) * 340, 40, W - 40), clamp(P.y + Math.sin(a) * 340, 40, H - 40), {}); }
    }
  }
  // 모래폭풍
  const st = room.storm;
  if (st) {
    st.t -= dt;
    if (st.t <= 0) {
      if (st.state === 'off') { st.state = 'warn'; st.t = 2; st.dx = Math.random() < 0.5 ? 1 : -1; floatText(P.x, P.y - 50, '모래폭풍 접근!', '#ffc866', 20); SFX.play('warn'); }
      else if (st.state === 'warn') { st.state = 'on'; st.t = 6; SFX.play('roll'); }
      else { st.state = 'off'; st.t = rand(8, 11); }
    }
    st.on = st.state === 'on';
    if (st.on) for (const e of room.enemies) if (!e.dead && !e.spawning && !e.heavy && !e.flying) e.x += st.dx * 55 * dt;
  }
  // 낙뢰
  const b = room.bolt;
  if (b) {
    b.t -= dt;
    if (b.t <= 0 && b.state === 'off') {
      b.state = 'warn'; b.t = 2.2; floatText(P.x, P.y - 50, '낙뢰 경고!', '#88f4ff', 20); SFX.play('warn');
      b.strikes = [];
      for (let i = 0; i < 6; i++) {
        let sx = clamp(P.x + (i ? rand(-260, 260) : rand(-40, 40)), 50, W - 50), sy = clamp(P.y + (i ? rand(-220, 220) : rand(-40, 40)), 50, H - 50), rod = false;
        for (const p of room.props) if (p.type === 'rod' && d2(p.x, p.y, sx, sy) < 240 * 240) { sx = p.x; sy = p.y; rod = true; break; }
        b.strikes.push({ x: sx, y: sy, rod });
      }
    } else if (b.t <= 0 && b.state === 'warn') {
      for (const s of b.strikes) { addBolt(s.x + rand(-30, 30), s.y - 700, s.x, s.y, '#d8faff', 0.28); if (!s.rod) explode(s.x, s.y, 66, 18, { team: 'e', friendly: 0.6 }); else burst(s.x, s.y, '#88f4ff', 12, 200, 0.4, 3); }
      SFX.play('explode'); shake(8); G.flash = 0.2; G.flashColor = '200,240,255';
      b.state = 'off'; b.t = rand(7, 10); b.strikes = [];
    }
  }
  // 탑: 레이저 · 전기 교대
  if (room.ctrl3) {
    room.ctrl3T -= dt;
    if (room.ctrl3T <= 0) { room.ctrl3 = room.ctrl3 === 'laser' ? 'elec' : room.ctrl3 === 'elec' ? 'calm' : 'laser'; room.ctrl3T = room.ctrl3 === 'calm' ? 5 : 10; G.banner = { text: room.ctrl3 === 'laser' ? '레이저 가동' : room.ctrl3 === 'elec' ? '전기 바닥 가동' : '합의체 휴지기', sub: room.ctrl3 === 'calm' ? '잠시 숨을 돌려라' : '', t: 1.2, color: '#e8dcff' }; SFX.play('glitch'); }
    for (const h of room.hazards) if (h.grp && h.grp !== room.ctrl3) { h.state = 'off'; h.on = false; h.ct = Math.max(h.ct, 0.5); }
  }
}

// ---------- 그리기 ----------
function drawHazardsS3() {
  for (const h of room.hazards) {
    if (!onScreen(h.x, h.y, 80)) continue;
    if (h.type === 'mine') { const arm = h.armT > 0; circlePath(h.x, h.y, h.r - 4); ctx.fillStyle = '#2a1a0a'; ctx.fill(); ctx.strokeStyle = arm ? '#887766' : '#ff5a3a'; ctx.lineWidth = 2; ctx.stroke(); circlePath(h.x, h.y, 3); ctx.fillStyle = !arm && Math.sin(G.time * 8 + h.x) > 0 ? '#ff3a2a' : '#442211'; ctx.fill(); }
    else if (h.type === 'static') { circlePath(h.x, h.y, h.r); ctx.fillStyle = `rgba(64,228,255,${0.1 + Math.sin(G.time * 12 + h.x) * 0.05})`; ctx.fill(); ctx.setLineDash([4, 5]); ctx.strokeStyle = 'rgba(160,250,255,0.6)'; ctx.stroke(); ctx.setLineDash([]); }
  }
  if (room.lights) for (const l of room.lights) { // 탐조등 광선
    ctx.fillStyle = room.seen ? 'rgba(255,80,60,0.16)' : 'rgba(210,235,255,0.13)';
    ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.arc(l.x, l.y, l.len, l.a - l.half, l.a + l.half); ctx.closePath(); ctx.fill();
    circlePath(l.x, l.y, 10); ctx.fillStyle = '#9ac8e8'; ctx.fill();
  }
  const b = room.bolt;
  if (b && b.state === 'warn') for (const s of b.strikes) { const k = (G.time * 3) % 1; circlePath(s.x, s.y, 66); ctx.strokeStyle = s.rod ? 'rgba(120,255,180,0.7)' : `rgba(136,244,255,${0.5 + Math.sin(G.time * 30) * 0.3})`; ctx.lineWidth = 2; ctx.stroke(); circlePath(s.x, s.y, 66 * k); ctx.strokeStyle = 'rgba(136,244,255,0.25)'; ctx.stroke(); }
  if (room.zid === 9 && room.kind === 'boss') for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(255,200,100,0.05)'; ctx.fillRect(0, room.h * (0.2 + i * 0.2) - 1, room.w, 2); }
}
function drawPropsS3() {
  for (const p of room.props) {
    if (!onScreen(p.x, p.y, 80)) continue;
    if (p.type === 'rod') { ctx.strokeStyle = '#6aff9a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x, p.y + 14); ctx.lineTo(p.x, p.y - 22); ctx.stroke(); circlePath(p.x, p.y - 24, 5); ctx.fillStyle = Math.sin(G.time * 6 + p.x) > 0 ? '#6aff9a' : '#2a6a42'; ctx.fill(); circlePath(p.x, p.y, 36); ctx.setLineDash([3, 6]); ctx.strokeStyle = 'rgba(106,255,154,0.3)'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]); }
    else if (p.type === 'antenna') { ctx.strokeStyle = 'rgba(120,200,230,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y + 10); ctx.lineTo(p.x, p.y - 30); ctx.moveTo(p.x - 8, p.y - 18); ctx.lineTo(p.x + 8, p.y - 18); ctx.stroke(); circlePath(p.x, p.y - 31, 3); ctx.fillStyle = Math.sin(G.time * 3 + p.x) > 0.3 ? '#ff4040' : '#401010'; ctx.fill(); }
  }
}
function drawS3Screen() {
  const st = room.storm;
  if (st && st.state !== 'off') {
    const k = st.state === 'on' ? 0.3 : 0.08 + Math.sin(G.time * 12) * 0.04;
    ctx.fillStyle = `rgba(200,150,70,${k})`; ctx.fillRect(0, 0, VW, VH);
    if (st.on) { ctx.strokeStyle = 'rgba(255,220,150,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i < 40; i++) { const sx = ((i * 97 + G.time * 900 * st.dx) % (VW + 200) + VW + 200) % (VW + 200) - 100, sy = (i * 53) % VH; ctx.moveTo(sx, sy); ctx.lineTo(sx + st.dx * 60, sy + 4); } ctx.stroke(); const g = ctx.createRadialGradient(VW / 2, VH / 2, 160, VW / 2, VH / 2, Math.max(VW, VH) * 0.7); g.addColorStop(0, 'rgba(120,80,30,0)'); g.addColorStop(1, 'rgba(120,80,30,0.45)'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH); }
  }
  if (room.bolt && room.bolt.state === 'warn') { ctx.fillStyle = `rgba(20,40,80,${0.12 + Math.sin(G.time * 10) * 0.05})`; ctx.fillRect(0, 0, VW, VH); }
  if (room.ctrl3) { ctx.fillStyle = room.ctrl3 === 'laser' ? 'rgba(255,60,120,0.05)' : room.ctrl3 === 'elec' ? 'rgba(255,230,80,0.05)' : 'rgba(180,200,255,0.04)'; ctx.fillRect(0, 0, VW, VH); }
  if (room.seen) { ctx.strokeStyle = `rgba(255,70,50,${0.4 + Math.sin(G.time * 14) * 0.25})`; ctx.lineWidth = 6; ctx.strokeRect(3, 3, VW - 6, VH - 6); }
}
