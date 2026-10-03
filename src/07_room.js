// ================= 벽 / 충돌 =================
function wallAt(x, y) {
  if (x < 0 || y < 0 || x > room.w || y > room.h) return 'bound';
  for (const w of room.walls) if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) return w;
  return null;
}
function circleRect(cx, cy, r, w) { const nx = clamp(cx, w.x, w.x + w.w), ny = clamp(cy, w.y, w.y + w.h); return d2(cx, cy, nx, ny) < r * r; }
function wallCircle(x, y, r) { for (const w of room.walls) if (circleRect(x, y, r, w)) return w; return null; }
function pushOutWalls(o) {
  for (const w of room.walls) {
    const nx = clamp(o.x, w.x, w.x + w.w), ny = clamp(o.y, w.y, w.y + w.h);
    const dx = o.x - nx, dy = o.y - ny, dd = dx * dx + dy * dy;
    if (dd >= o.r * o.r) continue;
    if (dd > 0.0001) { const d = Math.sqrt(dd); o.x = nx + dx / d * o.r; o.y = ny + dy / d * o.r; }
    else {
      const l = o.x - w.x, r = w.x + w.w - o.x, t = o.y - w.y, b = w.y + w.h - o.y, m = Math.min(l, r, t, b);
      if (m === l) o.x = w.x - o.r; else if (m === r) o.x = w.x + w.w + o.r; else if (m === t) o.y = w.y - o.r; else o.y = w.y + w.h + o.r;
    }
  }
}
function rayWalls(x, y, dx, dy, maxL) {
  const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
  let best = maxL;
  // 방 경계
  if (dx > 0) best = Math.min(best, (room.w - x) / dx); else if (dx < 0) best = Math.min(best, -x / dx);
  if (dy > 0) best = Math.min(best, (room.h - y) / dy); else if (dy < 0) best = Math.min(best, -y / dy);
  for (const w of room.walls) {
    let t0 = 0, t1 = best;
    for (const [p, d, lo, hi] of [[x, dx, w.x, w.x + w.w], [y, dy, w.y, w.y + w.h]]) {
      if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) { t0 = 1; t1 = 0; } }
      else { let a = (lo - p) / d, b = (hi - p) / d; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); }
    }
    if (t0 <= t1 && t0 > 0) best = Math.min(best, t0);
  }
  return Math.max(0, best);
}
function damageWall(w, dmg) {
  if (w.hp === Infinity) return;
  w.hp -= dmg; w.flash = 0.08;
  if (w.hp <= 0) {
    const i = room.walls.indexOf(w); if (i >= 0) room.walls.splice(i, 1);
    for (let k = 0; k < 18; k++) part({ x: w.x + rand(0, w.w), y: w.y + rand(0, w.h), vx: rand(-200, 200), vy: rand(-200, 200), life: rand(0.8, 1.6), size: rand(3, 7), color: ZONES[room.zone].edge, kind: 'debris', rot: rand(0, TAU) });
    SFX.play('smallexp'); shake(5);
  }
}

// ================= 환경 위험 요소 =================
function addHazard(o) { const h = Object.assign({ t: 0, life: Infinity, shape: 'c', elecT: 0, tick: 0 }, o); room.hazards.push(h); return h; }
function pointInHazard(h, x, y) { if (h.shape === 'r') return x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h; return d2(x, y, h.x, h.y) < h.r * h.r; }
function hazardAt(x, y, type) { for (const h of room.hazards) if (h.type === type && pointInHazard(h, x, y)) return h; return null; }
function hazardOverlapCircle(h, x, y, r) { if (h.shape === 'r') return circleRect(x, y, r, h); return d2(x, y, h.x, h.y) < (h.r + r) ** 2; }
function updateHazards(dt) {
  for (let i = room.hazards.length - 1; i >= 0; i--) {
    const h = room.hazards[i];
    h.t += dt;
    if (h.life !== Infinity) { h.life -= dt; if (h.life <= 0) { room.hazards.splice(i, 1); continue; } }
    if (h.elecT > 0) h.elecT -= dt;
    if (h.grow && h.r < 140) h.r += h.grow * dt;
    if (h.cycle) {
      h.ct -= dt;
      if (h.ct <= 0) {
        if (h.state === 'off') { h.state = 'warn'; h.ct = h.cycle[1]; }
        else if (h.state === 'warn') { h.state = 'on'; h.ct = h.cycle[2]; if (h.type === 'laser' && onScreen(h.x + (h.w || 0) / 2, h.y + (h.h || 0) / 2, 300)) SFX.play('laser', 0.5); }
        else { h.state = 'off'; h.ct = h.cycle[0]; }
      }
      if (h.type === 'elecfloor' && room.powerOff) h.state = 'off';
      h.on = h.state === 'on';
    }
    if (h.type === 'fire' && Math.random() < (h.r > 40 ? 0.7 : 0.2) * PFX()) {
      const a = rand(0, TAU), d = rand(0, h.r);
      part({ x: h.x + Math.cos(a) * d, y: h.y + Math.sin(a) * d, vx: rand(-10, 10), vy: -rand(40, 100), life: rand(0.3, 0.7), size: rand(3, 6), color: pick(['#ff6a1a', '#ffb347', '#ffe14d']), kind: 'dot' });
    }
    if (h.type === 'steam' && h.state === 'on' && Math.random() < 0.8 * PFX()) {
      const a = rand(0, TAU), d = rand(0, h.r);
      part({ x: h.x + Math.cos(a) * d * 0.4, y: h.y + Math.sin(a) * d * 0.4, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 30, life: 0.8, size: rand(12, 22), color: 'rgba(220,240,255,0.25)', kind: 'smoke' });
    }
  }
}

// ================= 사물 =================
function hitProp(p, dmg, b, isExp) {
  if (p.dead) return;
  switch (p.type) {
    case 'barrel':
      p.hp -= dmg; p.flash = 0.08;
      if (p.hp <= 0) { p.dead = true; explode(p.x, p.y, 110, 45, {}); }
      break;
    case 'heater':
      if (p.on) return;
      p.hp -= dmg; p.flash = 0.08;
      if (p.hp <= 0) { p.on = true; SFX.play('ignite'); burst(p.x, p.y, '#ff8a2a', 20, 250, 0.5, 3); floatText(p.x, p.y - 34, '히터 가동', '#ffb347', 16); }
      break;
    case 'spillar':
      p.hp -= dmg; p.flash = 0.08;
      if (SAVE.settings.dmgNum && Math.random() < 0.5) floatText(p.x, p.y - 30, Math.round(dmg), '#e0c0ff', 12);
      if (p.hp <= 0) { p.dead = true; fxExplosion(p.x, p.y, 90); floatText(p.x, p.y - 40, '서버 기둥 파괴', '#c86bff', 18); }
      break;
    case 'pgen':
      p.hp -= dmg; p.flash = 0.08;
      if (p.hp <= 0) {
        p.dead = true; fxExplosion(p.x, p.y, 90);
        if (!room.props.some(q => q.type === 'pgen' && !q.dead)) { room.powerOff = true; G.banner = { text: '전력 차단', sub: '전기 바닥 정지', t: 1.4, color: '#ffe03a' }; }
      }
      break;
  }
}
function hitAllyProp(p, dmg) {
  if (p.dead) return;
  p.hp -= dmg * G.eDmgMult; p.flash = 0.1;
  if (Math.random() < 0.3) SFX.play('hit');
  if (p.hp <= 0) { p.hp = 0; p.dead = true; fxExplosion(p.x, p.y, 100); }
}
function interactProp(p) {
  if (p.type === 'chest') {
    p.dead = true;
    const g = room.kind === 'boss' ? rollGrade([0, 60, 40]) : rollGrade(room.kind === 'elite' ? [35, 45, 20] : [60, 32, 8]);
    const w = makeWeapon(randomWeaponId(), g);
    room.pickups.push({ type: 'weapon', x: p.x, y: p.y + 6, w, t: 0 });
    burst(p.x, p.y, GRADES[g].color, 30, 300, 0.6, 3); SFX.play('pick');
  } else if (p.type === 'hturret') {
    p.hacked = true; p.interact = null; SFX.play('hack');
    floatText(p.x, p.y - 30, '해킹 성공!', '#29f0ff', 18); burst(p.x, p.y, '#29f0ff', 20, 200, 0.5, 3);
  }
}
function updateProps(dt) {
  for (const p of room.props) {
    if (p.dead) continue;
    p.flash = (p.flash || 0) - dt;
    switch (p.type) {
      case 'hturret': {
        p.cd -= dt;
        let tgt = null;
        if (p.hacked) {
          let bd = 520 * 520;
          for (const e of room.enemies) { if (e.dead || e.spawning || e.invuln) continue; const dd = d2(p.x, p.y, e.x, e.y); if (dd < bd) { bd = dd; tgt = e; } }
        } else if (!P.dead && d2(p.x, p.y, P.x, P.y) < 560 * 560) tgt = P;
        if (tgt && rayWalls(p.x, p.y, tgt.x - p.x, tgt.y - p.y, 600) >= dist(p.x, p.y, tgt.x, tgt.y) - 4) {
          const ta = angTo(p.x, p.y, tgt.x, tgt.y);
          p.ang += clamp(angDiff(p.ang, ta), -3 * dt, 3 * dt);
          if (p.cd <= 0 && Math.abs(angDiff(p.ang, ta)) < 0.2) {
            if (p.hacked) { p.cd = 0.3; spawnBullet({ x: p.x + Math.cos(p.ang) * 18, y: p.y + Math.sin(p.ang) * 18, vx: Math.cos(p.ang) * 800, vy: Math.sin(p.ang) * 800, r: 4, dmg: 11 * BS.dmgMult, team: 'p', life: 0.8, color: '#29f0ff' }); SFX.play('smg', 0.4); }
            else { p.cd = 1.5; eShoot(p, p.ang, 260, 9, { color: '#ff3b3b' }); }
          }
        }
        break;
      }
      case 'heater':
        if (p.on) {
          if (d2(p.x, p.y, P.x, P.y) < 150 * 150) P.chillT = 0;
          for (const h of room.hazards) if (h.boss && d2(h.x, h.y, p.x, p.y) < 240 * 240) { h.r -= 60 * dt; if (h.r < 8) h.life = 0.01; }
          if (Math.random() < 0.3) part({ x: p.x + rand(-12, 12), y: p.y, vx: 0, vy: -rand(40, 80), life: 0.6, size: rand(3, 5), color: '#ff8a2a', kind: 'dot' });
        }
        break;
      case 'drone': {
        const ob = room.obj;
        const blocked = room.enemies.some(e => !e.dead && !e.spawning && d2(e.x, e.y, p.x, p.y) < 110 * 110);
        p.blocked = blocked;
        if (!blocked && !room.done) {
          p.x += 42 * dt;
          p.y = room.h / 2 + Math.sin(p.x / 140) * 40;
        }
        if (p.x >= room.w - 130 && !room.done) completeRoom(true);
        void ob;
        break;
      }
      case 'chip':
        p.t = (p.t || 0) + dt;
        if (!P.dead && d2(p.x, p.y, P.x, P.y) < (p.r + P.r + 6) ** 2) {
          p.dead = true; room.obj.got++; SFX.play('pick'); burst(p.x, p.y, '#29f0ff', 16, 200, 0.4, 3);
          floatText(p.x, p.y - 20, `데이터칩 ${room.obj.got}/5`, '#29f0ff', 16);
        }
        break;
      case 'exit':
        p.t = (p.t || 0) + dt;
        if (!P.dead && room.done && d2(p.x, p.y, P.x, P.y) < (p.r + 4) ** 2) leaveRoom();
        break;
    }
  }
  if (room.props.some(p => p.dead && p.type !== 'objgen' && p.type !== 'drone')) room.props = room.props.filter(p => !p.dead || p.type === 'objgen' || p.type === 'drone');
}

// ================= 방 생성 =================
function freeSpot(r, minFromSpawn = 260, tries = 60, extraCheck) {
  for (let k = 0; k < tries; k++) {
    const x = rand(r + 40, room.w - r - 40), y = rand(r + 40, room.h - r - 40);
    if (d2(x, y, room.sx, room.sy) < minFromSpawn * minFromSpawn) continue;
    if (wallCircle(x, y, r + 10)) continue;
    if (room.props.some(p => d2(p.x, p.y, x, y) < (p.r + r + 20) ** 2)) continue;
    if (extraCheck && !extraCheck(x, y)) continue;
    return { x, y };
  }
  return null;
}
function newRoom(kind, zone, w, h) {
  room = {
    kind, zone, w, h, walls: [], hazards: [], props: [], enemies: [], pickups: [], allies: [], vortices: [], decals: [], timers: [],
    obj: null, objProp: null, kills: 0, over: false, done: false, success: false, t: 0, dark: false, darkOn: false, darkT: 7,
    eliteChance: 0, muts2: false, extra: 1, medkitUsed: false, powerOff: false, sx: w / 2, sy: h - 130, bossDead: false
  };
  return room;
}
function setScaling(zone, arenaWave) {
  const oc = run.oc;
  let hp = (1 + 0.22 * zone) * ocHpMult(oc);
  if (arenaWave) hp = (1 + 0.09 * arenaWave) * ocHpMult(oc);
  G.eHp = hp;
  G.bossHp = ocHpMult(oc) * (arenaWave ? 1 + 0.05 * arenaWave : 1);
  G.eDmgMult = (1 + 0.12 * (arenaWave ? Math.min(4, arenaWave / 6) : zone)) * (oc >= 6 ? 1.25 : 1);
  G.eSpd = oc >= 7 ? 1.1 : 1;
  G.coinLife = oc >= 8 ? 3.5 : 5;
}

function genLayout(objType) {
  const z = room.zone, W = room.w, H = room.h;
  const band = objType === 'escort';
  const avoidCenter = objType === 'defend';
  const blocks = randi(5, 8);
  for (let i = 0; i < blocks; i++) {
    for (let k = 0; k < 30; k++) {
      const w = rand(50, 170), h = rand(40, 130);
      const x = rand(100, W - 100 - w), y = rand(90, H - 90 - h);
      const cx = x + w / 2, cy = y + h / 2;
      if (d2(cx, cy, room.sx, room.sy) < 260 * 260) continue;
      if (band && Math.abs(cy - H / 2) < h / 2 + 100) continue;
      if (avoidCenter && d2(cx, cy, W / 2, H / 2) < 220 * 220) continue;
      if (room.walls.some(o => x < o.x + o.w + 70 && x + w + 70 > o.x && y < o.y + o.h + 70 && y + h + 70 > o.y)) continue;
      const debris = z === 0 && Math.random() < 0.45;
      room.walls.push({ x, y, w, h, hp: debris ? 80 : Infinity, maxHp: 80, kind: debris ? 'debris' : 'block' });
      break;
    }
  }
  const spot = (r, d) => freeSpot(r, d || 240, 60, band ? (x, y) => Math.abs(y - H / 2) > r + 60 : null);
  const puddle = (type, n, r0, r1) => { for (let i = 0; i < n; i++) { const r = rand(r0, r1); const s = freeSpot(r, 200, 40); if (s) addHazard({ type, x: s.x, y: s.y, r }); } };
  if (z === 0) {
    puddle('oil', randi(3, 5), 55, 95);
    puddle('water', 1, 50, 80);
    for (let i = 0; i < randi(5, 7); i++) { const s = spot(16); if (s) room.props.push({ type: 'barrel', x: s.x, y: s.y, r: 15, hp: 20, shootable: true }); }
  } else if (z === 1) {
    puddle('slick', randi(3, 4), 110, 180);
    puddle('water', randi(3, 4), 60, 100);
    puddle('oil', 1, 50, 80);
    for (let i = 0; i < 3; i++) { const s = freeSpot(80, 280, 40); if (s) addHazard({ type: 'steam', x: s.x, y: s.y, r: 80, cycle: [rand(2.5, 4), 0.8, 1.3], state: 'off', ct: rand(0, 3) }); }
    for (let i = 0; i < 2; i++) { const s = spot(16); if (s) room.props.push({ type: 'barrel', x: s.x, y: s.y, r: 15, hp: 20, shootable: true }); }
  } else if (z === 2) {
    for (let i = 0; i < randi(3, 5); i++) {
      for (let k = 0; k < 30; k++) {
        const w = rand(140, 230), h = rand(140, 230), x = rand(60, W - 60 - w), y = rand(60, H - 60 - h);
        if (circleRect(room.sx, room.sy, 180, { x, y, w, h })) continue;
        if (room.hazards.some(o => o.shape === 'r' && x < o.x + o.w && x + w > o.x && y < o.y + o.h && y + h > o.y)) continue;
        addHazard({ type: 'elecfloor', shape: 'r', x, y, w, h, cycle: [rand(2.5, 3.5), 0.9, 1.6], state: 'off', ct: rand(0, 3) });
        break;
      }
    }
    for (let i = 0; i < randi(1, 2); i++) { const s = spot(22, 300); if (s) room.props.push({ type: 'pgen', x: s.x, y: s.y, r: 22, hp: 60, shootable: true }); }
    for (let i = 0; i < randi(2, 3); i++) {
      const horiz = Math.random() < 0.5, w = horiz ? rand(240, 340) : 70, h = horiz ? 70 : rand(240, 340);
      const x = rand(60, W - 60 - w), y = rand(60, H - 60 - h);
      if (circleRect(room.sx, room.sy, 150, { x, y, w, h })) continue;
      const s = Math.random() < 0.5 ? 1 : -1;
      addHazard({ type: 'conveyor', shape: 'r', x, y, w, h, dx: horiz ? s : 0, dy: horiz ? 0 : s });
    }
    puddle('water', 2, 60, 90);
    puddle('oil', 1, 50, 80);
  } else {
    room.dark = Math.random() < 0.45;
    for (let i = 0; i < randi(2, 3); i++) {
      const horiz = Math.random() < 0.5, L = rand(320, 520);
      const w = horiz ? L : 12, h = horiz ? 12 : L;
      const x = rand(80, W - 80 - w), y = rand(80, H - 80 - h);
      if (circleRect(room.sx, room.sy, 150, { x, y, w, h })) continue;
      addHazard({ type: 'laser', shape: 'r', x, y, w, h, cycle: [rand(1.8, 2.8), 0.7, 1.5], state: 'off', ct: rand(0, 2.5) });
    }
    for (let i = 0; i < 2; i++) { const s = spot(16, 300); if (s) room.props.push({ type: 'hturret', x: s.x, y: s.y, r: 16, ang: 0, cd: 1.5, hacked: false, interact: '[E] 포탑 해킹' }); }
    puddle('water', 2, 60, 90);
    puddle('oil', 2, 50, 80);
    for (let i = 0; i < 2; i++) { const s = spot(16); if (s) room.props.push({ type: 'barrel', x: s.x, y: s.y, r: 15, hp: 20, shootable: true }); }
  }
}

// 전투 방 시작
function startRoom(o) {
  const zone = o.zone;
  const kind = o.kind;
  const boss = kind === 'boss';
  const W = boss ? 1500 : Math.round(rand(1500, 1800)), H = boss ? 1000 : Math.round(rand(1000, 1200));
  newRoom(kind, zone, W, H);
  setScaling(zone, 0);
  resetFx();
  const objType = boss ? 'boss' : o.objective;
  if (objType === 'escort') { room.sx = 160; room.sy = H / 2 + 70; }
  if (boss) {
    room.sy = H - 120;
    if (zone === 0) { // 크러셔: 부딪힐 기둥
      for (const [x, y] of [[W * 0.25, H * 0.3], [W * 0.75, H * 0.3], [W * 0.25, H * 0.68], [W * 0.75, H * 0.68]]) room.walls.push({ x: x - 45, y: y - 35, w: 90, h: 70, hp: Infinity, kind: 'block' });
    }
    if (zone === 2) { for (let i = 0; i < 2; i++) addHazard({ type: 'water', x: W * (0.2 + i * 0.6), y: H * 0.5, r: 80 }); }
    if (zone === 0) for (let i = 0; i < 2; i++) addHazard({ type: 'oil', x: W * (0.35 + i * 0.3), y: H * 0.82, r: 70 });
  } else genLayout(objType);
  createPlayer(room.sx, room.sy);
  if (run.char === 'momo') placeTurret(P.x + 40, P.y - 30);
  room.eliteChance = kind === 'elite' ? 0.22 : zone === 0 ? 0 : 0.03 + 0.035 * zone + ((o.row || 0) >= 4 ? 0.03 : 0);
  if (run.oc >= 2) room.eliteChance += 0.06;
  room.muts2 = run.sealedNext || run.oc >= 10; run.sealedNext = false;
  room.extra = (run.alarmNext ? 1.3 : 1) * BS.enemyMult; run.alarmNext = false;
  room.row = o.row || 0;
  if (BS.invest) { run.coins += BS.invest; }
  if (run.allyNext) { room.allies.push({ type: 'robot', x: room.sx + 40, y: room.sy, t: Infinity, cd: 0, ang: -Math.PI / 2, r: 12 }); run.allyNext = false; }
  setupObjective(objType);
  G.screen = 'combat'; G.paused = false; UI('');
  G.objBanner = { t: 2.6 };
  updateCamera(0, true);
}

function setupObjective(type) {
  const ob = room.obj = { type, t: 0 };
  const z = room.zone, W = room.w, H = room.h;
  const base = Math.round((4 + z * 2 + room.row * 0.7) * room.extra);
  switch (type) {
    case 'exterminate':
      ob.waves = z === 0 && room.row === 0 ? 2 : 3; ob.wave = 0; ob.per = base; ob.waveT = 0;
      if (room.kind === 'elite') ob.per = Math.round(base * 1.1);
      break;
    case 'survive': ob.time = 60; ob.spawnT = 1; break;
    case 'defend': {
      ob.time = 50; ob.spawnT = 1.5;
      const g = { type: 'objgen', x: W / 2, y: H / 2, r: 30, hp: 300 + z * 60, maxHp: 300 + z * 60, ally: true };
      room.props.push(g); room.objProp = g;
      break;
    }
    case 'escort': {
      ob.spawnT = 2;
      const d = { type: 'drone', x: 130, y: H / 2, r: 20, hp: 240 + z * 50, maxHp: 240 + z * 50, ally: true };
      room.props.push(d); room.objProp = d;
      room.props.push({ type: 'goal', x: W - 110, y: H / 2, r: 40 });
      break;
    }
    case 'collect':
      ob.got = 0; ob.spawnT = 1.5;
      for (let i = 0; i < 5; i++) {
        const s = freeSpot(14, 300, 80, (x, y) => !room.props.some(p => p.type === 'chip' && d2(p.x, p.y, x, y) < 260 * 260));
        const s2 = s || freeSpot(14, 150, 80);
        if (s2) room.props.push({ type: 'chip', x: s2.x, y: s2.y, r: 14 });
        else ob.got++;
      }
      break;
    case 'bounty': {
      ob.time = 45; ob.spawnT = 3;
      const pool = Object.keys(ZONES[z].spawn).filter(t => t !== 'sturret' && t !== 'summoner');
      const s = freeSpot(30, 600) || { x: W / 2, y: 120 };
      const t = spawnEnemy(pick(pool), s.x, s.y, { muts: rollMuts(z >= 2 ? 2 : 1), hpMult: 1.4 });
      t.bounty = true; ob.target = t;
      break;
    }
    case 'boss': setupBoss(ZONES[z].boss); break;
    case 'arena': ob.wave = 0; ob.state = 'break'; ob.bt = 2; break;
  }
}

// ================= 적 소환 =================
function pickEnemyType() {
  const sp = room.kind === 'arena' ? arenaSpawnTable() : ZONES[room.zone].spawn;
  const turrets = room.enemies.filter(e => e.type === 'sturret' && !e.dead).length;
  let keys = Object.keys(sp);
  if (turrets >= 3) keys = keys.filter(k => k !== 'sturret');
  let t = 0; for (const k of keys) t += sp[k];
  let r = Math.random() * t;
  for (const k of keys) { r -= sp[k]; if (r <= 0) return k; }
  return keys[0];
}
function spawnPos(type) {
  if (type === 'sturret') {
    for (let k = 0; k < 30; k++) {
      const side = randi(0, 3);
      const x = side === 0 ? 50 : side === 1 ? room.w - 50 : rand(60, room.w - 60);
      const y = side === 2 ? 50 : side === 3 ? room.h - 50 : rand(60, room.h - 60);
      if (!wallCircle(x, y, 24) && d2(x, y, P.x, P.y) > 300 * 300) return { x, y };
    }
  }
  for (let k = 0; k < 40; k++) {
    const x = rand(60, room.w - 60), y = rand(60, room.h - 60);
    if (d2(x, y, P.x, P.y) < 320 * 320) continue;
    if (wallCircle(x, y, 26)) continue;
    return { x, y };
  }
  return { x: P.x < room.w / 2 ? room.w - 80 : 80, y: P.y < room.h / 2 ? room.h - 80 : 80 };
}
function spawnOne(type, o = {}) {
  type = type || pickEnemyType();
  const pos = spawnPos(type);
  let muts = null;
  if (o.elite || Math.random() < room.eliteChance) muts = rollMuts(room.muts2 ? 2 : 1);
  return spawnEnemy(type, pos.x, pos.y, { muts, objTarget: o.objTarget });
}
function aliveEnemies() { let n = 0; for (const e of room.enemies) if (!e.dead) n++; return n; }

// ================= 방 갱신 / 목표 =================
function updateRoom(dt) {
  room.t += dt;
  for (let i = room.timers.length - 1; i >= 0; i--) { const t = room.timers[i]; t.t -= dt; if (t.t <= 0) { room.timers.splice(i, 1); t.fn(); } }
  // 정전 구간
  if (room.dark) {
    room.darkT -= dt;
    if (room.darkT <= 0) { room.darkOn = !room.darkOn; room.darkT = room.darkOn ? 6 : 7; if (room.darkOn) { SFX.play('glitch'); floatText(P.x, P.y - 50, '정전!', '#c86bff', 18); } }
  }
  if (G.glitchWarn > 0) { G.glitchWarn -= dt; if (G.glitchWarn <= 0) { G.glitchT = 3; SFX.play('glitch'); } }
  if (G.glitchT > 0) G.glitchT -= dt;
  if (room.done || P.dead) return;
  const ob = room.obj;
  ob.t += dt;
  const alive = aliveEnemies();
  const cap = 22 + room.zone * 3;
  switch (ob.type) {
    case 'exterminate': {
      ob.waveT -= dt;
      if (ob.wave < ob.waves && (ob.wave === 0 || alive <= 2 || ob.waveT <= 0)) {
        if (ob.wave > 0) healRun(15, true);
        ob.wave++; ob.waveT = 14;
        const n = ob.per + (ob.wave - 1);
        for (let i = 0; i < n; i++) spawnOne(null, { elite: room.kind === 'elite' && i < (ob.wave === 1 ? 2 : 1) });
        if (ob.wave > 1) G.banner = { text: `웨이브 ${ob.wave}/${ob.waves}`, t: 1, color: '#29f0ff' };
      }
      if (ob.wave >= ob.waves && alive === 0) { healRun(15, true); completeRoom(true); }
      break;
    }
    case 'survive':
    case 'defend': {
      ob.time -= dt; ob.spawnT -= dt;
      const k = clamp(ob.t / 60, 0, 1);
      if (ob.spawnT <= 0 && alive < cap) {
        ob.spawnT = lerp(1.8, 0.85, k) / room.extra * (ob.type === 'defend' ? 1.15 : 1);
        const n = randi(1, 2 + (room.zone >= 2 ? 1 : 0));
        for (let i = 0; i < n; i++) spawnOne(null, { objTarget: ob.type === 'defend' && Math.random() < 0.55 });
      }
      if (ob.type === 'defend' && room.objProp.dead) { completeRoom(false); break; }
      if (ob.time <= 0) completeRoom(true);
      break;
    }
    case 'escort':
    case 'collect': {
      ob.spawnT -= dt;
      if (ob.spawnT <= 0 && alive < cap - 6) {
        ob.spawnT = (ob.type === 'escort' ? 2.1 : 2.4) / room.extra;
        const n = randi(1, 2);
        for (let i = 0; i < n; i++) spawnOne(null, { objTarget: ob.type === 'escort' && Math.random() < 0.45 });
      }
      if (ob.type === 'escort' && room.objProp.dead) { completeRoom(false); break; }
      if (ob.type === 'collect' && ob.got >= 5) completeRoom(true);
      break;
    }
    case 'bounty': {
      ob.time -= dt; ob.spawnT -= dt;
      if (ob.spawnT <= 0 && alive < cap - 8) { ob.spawnT = 3.2 / room.extra; spawnOne(); }
      if (ob.target.dead) completeRoom(true);
      else if (ob.time <= 0) {
        burst(ob.target.x, ob.target.y, '#ff3df0', 30, 300, 0.5, 3);
        ob.target.noReward = true; ob.target.dead = true;
        completeRoom(false);
      }
      break;
    }
    case 'boss':
      if (room.bossDead) completeRoom(true);
      break;
    case 'arena': updateArena(dt, alive); break;
  }
}

// 현상금 표적 AI (도망)
function bountyAI(e, dt) {
  const d = dist(e.x, e.y, P.x, P.y), a = angTo(e.x, e.y, P.x, P.y);
  if (d < 340) {
    let fa = a + Math.PI + Math.sin(G.time * 2 + e.x * 0.01) * 0.6;
    const nx = e.x + Math.cos(fa) * 60, ny = e.y + Math.sin(fa) * 60;
    if (nx < 60 || nx > room.w - 60 || ny < 60 || ny > room.h - 60) fa = a + Math.PI / 2 * (e.x > room.w / 2 ? 1 : -1);
    moveToward(e, e.x + Math.cos(fa) * 60, e.y + Math.sin(fa) * 60, e.spd * e.sm * 1.35, dt);
  } else {
    e.t += dt; moveToward(e, e.x + Math.cos(e.t) * 50, e.y + Math.sin(e.t * 0.7) * 50, e.spd * e.sm * 0.6, dt);
  }
  e.ang = a;
  e.cd -= dt * e.atkMult;
  if (e.cd <= 0 && d < 600) { e.cd = 1.8; eFan(e, a, 3, 0.4, 260, 10); }
}

function completeRoom(success) {
  if (room.done) return;
  room.done = true; room.success = success;
  for (const e of room.enemies) if (!e.dead) {
    if (!success) e.noReward = true;
    if (!e.boss) killEnemy(e, {});
  }
  for (const b of BULLETS) if (b.team === 'e') b.dead = true;
  for (const h of room.hazards) if (h.cycle) { h.cycle = null; h.state = 'off'; h.on = false; }
  if (success) {
    G.slowmo = Math.max(G.slowmo, 0.5);
    SFX.play('objective');
    G.banner = { text: '목표 달성!', sub: room.kind === 'arena' ? '' : '출구로 이동하세요', t: 2, color: '#6dff8a' };
    if (BS.regen) healRun(BS.regen, true);
    const chestChance = room.kind === 'boss' ? 1 : room.kind === 'elite' ? 0.5 : 0.22 + BS.lucky;
    if (Math.random() < chestChance) {
      const s = freeSpot(18, 0, 60, (x, y) => d2(x, y, P.x, P.y) < 400 * 400 && d2(x, y, P.x, P.y) > 80 * 80) || { x: clamp(P.x + 80, 40, room.w - 40), y: P.y };
      room.props.push({ type: 'chest', x: s.x, y: s.y, r: 18, interact: '[E] 무기 상자 열기' });
    }
  } else {
    SFX.play('lose');
    G.banner = { text: '목표 실패', sub: '보상 없음 · 피해 10', t: 2.2, color: '#ff4d6d' };
    hurtRun(10);
  }
  let ex = room.w / 2, ey = room.h / 2;
  if (wallCircle(ex, ey, 40) || room.props.some(p => d2(p.x, p.y, ex, ey) < 60 * 60)) { const s = freeSpot(36, 0, 80) || { x: P.x, y: P.y }; ex = s.x; ey = s.y; }
  if (room.obj.type === 'escort') { ex = room.w - 110; ey = room.h / 2; }
  room.props.push({ type: 'exit', x: ex, y: ey, r: 36, t: 0 });
}

function leaveRoom() {
  if (room.left) return;
  room.left = true;
  SFX.play('ui');
  room.leaving = true; // 프레임 끝에서 처리

}

function playerDie() {
  if (P.dead) return;
  P.dead = true;
  burst(P.x, P.y, CHARS[run.char].color, 50, 350, 0.9, 4);
  G.slowmo = 1.5; shake(20); SFX.play('lose');
  room.over = true;
  room.timers.push({ t: 1.6, fn: () => { room.ending = true; } });
}
