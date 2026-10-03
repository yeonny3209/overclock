// ================= 플레이어 =================
function rollMax() { return run.char === 'kai' ? 2 : 1; }
function createPlayer(x, y) {
  P = {
    x, y, vx: 0, vy: 0, kx: 0, ky: 0, r: 13, ang: -Math.PI / 2, rollT: 0, rollDx: 1, rollDy: 0, rollCharges: rollMax(), rollRe: 0,
    iframe: 1, hurtT: 0, skillCd: 0, skillMax: 1, overT: 0, slowT: 0, shield: BS.surv5 ? 2 : 0, dead: false, staticShots: 0,
    chillT: 0, trailT: 0, stepT: 0, prompt: null, swapT: 0, pullT: 0, momT: 0, reaperShots: 0, bladeA: 0, odT: 0, hackCd: 0
  };
  for (const w of run.weapons) w.first = true;
}

function updatePlayer(dt) {
  if (P.dead) return;
  P.iframe -= dt; P.hurtT -= dt; P.overT -= dt; P.slowT -= dt; P.chillT -= dt; P.skillCd -= dt; P.swapT -= dt; P.momT -= dt; P.odT -= dt; P.hackCd -= dt;
  const rm = rollMax();
  if (P.rollCharges < rm) { P.rollRe -= dt; if (P.rollRe <= 0) { P.rollCharges++; P.rollRe = 0.75 * BS.rollCdMult; } }
  const gp = Input.gp;
  // 이동 입력
  let mx = 0, my = 0;
  if (Input.keys.KeyW || Input.keys.ArrowUp) my -= 1;
  if (Input.keys.KeyS || Input.keys.ArrowDown) my += 1;
  if (Input.keys.KeyA || Input.keys.ArrowLeft) mx -= 1;
  if (Input.keys.KeyD || Input.keys.ArrowRight) mx += 1;
  if (gp) { mx += gp.lx; my += gp.ly; }
  if (G.glitchT > 0) mx = -mx; // 마더보드 글리치: 좌우 반전
  const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
  // 조준
  if (Input.usingPad && gp) {
    if (gp.rx || gp.ry) P.ang = Math.atan2(gp.ry, gp.rx);
    else if (ml > 0.2) P.ang = Math.atan2(my, mx);
  } else { const mw = mouseWorld(); P.ang = angTo(P.x, P.y, mw.x, mw.y); }

  const hz = playerHazards();
  // 구르기
  if ((Input.pressed.Space || (gp && gp.roll)) && P.rollT <= 0 && P.rollCharges > 0) doRoll(mx, my);
  if (P.rollT > 0) {
    P.rollT -= dt;
    P.vx = P.rollDx * 560; P.vy = P.rollDy * 560;
    P.trailT -= dt;
    if (P.trailT <= 0) {
      P.trailT = 0.045;
      part({ x: P.x, y: P.y, vx: 0, vy: 0, life: 0.25, size: P.r, color: CHARS[run.char].color, kind: 'ghost' });
      if (BS.firetrail) addHazard({ type: 'fire', x: P.x, y: P.y, r: 26, life: 2.5, player: true });
      if (BS.ice5) addHazard({ type: 'frostfloor', x: P.x, y: P.y, r: 30, life: 4 });
      if (BS.spray && room.hazards.length < 140) addHazard({ type: 'water', x: P.x, y: P.y, r: 30, life: 5, player: true });
    }
    if (BS.umbra) for (const e of room.enemies) if (!e.dead && !e.spawning && (e.umbraT || 0) < G.time && d2(e.x, e.y, P.x, P.y) < (e.r + 40) ** 2) { e.umbraT = G.time + 0.5; applyStatus(e, 'dark', { stacks: 2 }); }
    if (P.rollT <= 0) {
      if (BS.evasion > 1) P.iframe = Math.max(P.iframe, 0.15);
      if (BS.blastroll) explode(P.x, P.y, 90, 28, { noSelf: true });
      if (BS.updraft) { for (const e of room.enemies) if (!e.dead && !e.spawning && d2(e.x, e.y, P.x, P.y) < 150 * 150) applyStatus(e, 'wind', { ang: angTo(P.x, P.y, e.x, e.y), dmg: 15 }); part({ x: P.x, y: P.y, life: 0.3, size: 150, color: TAG_COLOR.wind, kind: 'ring' }); }
      if (BS.static) P.staticShots = 3;
      if (run.char === 'kai') P.momT = 1.5;
    }
  } else {
    const spd = 235 * BS.moveMult * (P.chillT > 0 ? 0.7 : 1) * hz.slow * (P.odT > 0 ? 1.25 : 1);
    const acc = hz.slick ? 2.5 : 14;
    P.vx = lerp(P.vx, mx * spd, Math.min(1, acc * dt));
    P.vy = lerp(P.vy, my * spd, Math.min(1, acc * dt));
    if (ml > 0.1) { P.stepT -= dt; if (P.stepT <= 0) { P.stepT = 0.12; part({ x: P.x - mx * 8, y: P.y - my * 8 + 6, vx: rand(-10, 10), vy: rand(-10, 10), life: 0.3, size: 3, color: 'rgba(255,255,255,0.25)', kind: 'smoke' }); } }
  }
  P.x += (P.vx + hz.px + P.kx) * dt;
  P.y += (P.vy + hz.py + P.ky) * dt;
  P.kx -= P.kx * Math.min(1, 10 * dt); P.ky -= P.ky * Math.min(1, 10 * dt);
  pushOutWalls(P);
  P.x = clamp(P.x, P.r, room.w - P.r); P.y = clamp(P.y, P.r, room.h - P.r);

  // 무기
  const w = curW(), s = wStats(w);
  if (w.reloadT > 0) { w.reloadT -= dt; if (w.reloadT <= 0) { w.reloadT = 0; w.ammo = s.mag; w.first = true; SFX.play('reloaded'); } }
  const freeAmmo = BS.infAmmo || P.odT > 0;
  if ((P.overT > 0 || freeAmmo) && w.reloadT > 0) { w.reloadT = 0; w.ammo = s.mag; }
  if (w.cd > 0) w.cd -= dt;
  const firing = !G.bossIntro && (Input.mb[0] || (gp && gp.fire) || Input.touchFire) && P.swapT <= 0;
  if (!firing && w.spin > 0) w.spin = Math.max(0, w.spin - dt * 0.8);
  if (firing && w.cd <= 0 && w.reloadT <= 0) {
    if (s.mag !== Infinity && w.ammo <= 0 && P.overT <= 0 && !freeAmmo) { startReload(w); }
    else {
      shoot(w);
      w.cd = (w.cd < -0.05 ? 0 : w.cd) + 1 / (s.rate * (P.overT > 0 ? 2 : 1) * (P.odT > 0 ? 1.6 : 1));
      if (P.overT <= 0 && !freeAmmo && s.mag !== Infinity) { w.ammo--; if (w.ammo <= 0) startReload(w); }
    }
  }
  if (Input.pressed.KeyR || (gp && gp.reload)) startReload(w);
  if ((Input.pressed.KeyQ || Input.wheel !== 0 || (gp && gp.swap)) && run.weapons.length > 1) {
    curW().reloadT = 0; run.cur = 1 - run.cur; P.swapT = 0.15; SFX.play('ui');
    const nw = curW(); if (wStats(nw).mag !== Infinity && nw.ammo <= 0) startReload(nw);
  }
  // 스킬
  if ((Input.mp[2] || (gp && gp.skill)) && !G.bossIntro) useSkill();
  if ((Input.pressed.KeyF || (gp && gp.od)) && !G.bossIntro) activateOverdrive();
  // 전기 5세트: 2.5초마다 낙뢰
  if (BS.elec5) {
    run.boltT = (run.boltT || 0) - dt;
    if (run.boltT <= 0) {
      run.boltT = 2.5;
      const ts = room.enemies.filter(e => !e.dead && !e.spawning && !e.invuln).sort((a, b) => d2(a.x, a.y, P.x, P.y) - d2(b.x, b.y, P.x, P.y)).slice(0, 3);
      for (const t of ts) { strike(t.x, t.y); damageEnemy(t, 30 * dynDmg(), { tag: 'elec' }); }
    }
  }
  if (BS.awakened.length) updateAwaken(dt);
  if (BS.surv7) { run.regenAcc = (run.regenAcc || 0) + dt; if (run.regenAcc >= 2) { run.regenAcc = 0; if (run.hp < run.maxHp) healRun(3, true); } }
  // 상호작용
  P.prompt = null;
  const it = findInteract();
  if (it) {
    P.prompt = it.label;
    if (Input.pressed.KeyE || (gp && gp.interact)) it.act();
  }
  // 콤보 타이머
  if (run.comboT > 0) { run.comboT -= dt; if (run.comboT <= 0) { if (run.combo >= 10) floatText(P.x, P.y - 40, '콤보 종료', '#9aa0c0', 14); run.combo = 0; } }
}

function doRoll(mx, my) {
  let dx = mx, dy = my;
  if (Math.hypot(dx, dy) < 0.1) { dx = Math.cos(P.ang); dy = Math.sin(P.ang); }
  const l = Math.hypot(dx, dy); dx /= l; dy /= l;
  P.rollDx = dx; P.rollDy = dy; P.rollT = 0.28 * (BS.evasion > 1 ? 1.15 : 1);
  if (P.rollCharges === rollMax()) P.rollRe = 0.75 * BS.rollCdMult;
  P.rollCharges--;
  if (BS.afterimage) room.allies.push({ type: 'decoy', x: P.x, y: P.y, t: 1, max: 1, r: 13 });
  SFX.play('roll');
}

function placeTurret(x, y) {
  if (wallAt(x, y)) { x = P.x; y = P.y; }
  const turrets = room.allies.filter(a => a.type === 'turret' && a.t > 0);
  if (turrets.length >= 3) turrets[0].t = 0;
  room.allies.push({ type: 'turret', x, y, t: 25, max: 25, cd: 0.3, ang: P.ang, r: 14 });
  burst(x, y, '#ffd23d', 14, 200, 0.4, 3);
}
function useSkill() {
  if (P.skillCd > 0) { SFX.play('empty'); return; }
  const c = CHARS[run.char];
  P.skillCd = P.skillMax = c.cd * BS.cdMult;
  SFX.play('skill');
  switch (run.char) {
    case 'rain': {
      P.overT = 5; const w = curW(); if (w.reloadT > 0) { w.reloadT = 0; w.ammo = wStats(w).mag; }
      floatText(P.x, P.y - 36, '과충전!', '#ff5a5a', 20);
      part({ x: P.x, y: P.y, vx: 0, vy: 0, life: 0.4, size: 60, color: '#ff5a5a', kind: 'ring' });
      break;
    }
    case 'momo': placeTurret(P.x + Math.cos(P.ang) * 44, P.y + Math.sin(P.ang) * 44); break;
    case 'kai': kaiSlash(); break;
    case 'sera':
      P.slowT = 5; G.flash = 0.2; G.flashColor = '180,140,255';
      part({ x: P.x, y: P.y, vx: 0, vy: 0, life: 0.6, size: 520, color: '#b48cff', kind: 'ring' });
      break;
  }
  if (BS.discharge) {
    const ts = room.enemies.filter(e => !e.dead && !e.spawning).sort((a, b) => d2(a.x, a.y, P.x, P.y) - d2(b.x, b.y, P.x, P.y)).slice(0, 5);
    for (const e of ts) { addBolt(P.x, P.y, e.x, e.y, '#fff04d'); damageEnemy(e, 25 * dynDmg(), { tag: 'elec' }); }
  }
  if (BS.dawn) {
    for (const e of room.enemies) if (!e.dead && !e.spawning && d2(e.x, e.y, P.x, P.y) < 420 * 420) applyStatus(e, 'light', {});
    part({ x: P.x, y: P.y, life: 0.4, size: 420, color: TAG_COLOR.light, kind: 'ring' });
  }
}

function kaiSlash() {
  const a = P.ang, R = 175, ARC = 1.25;
  const tag = wStats(curW()).tag;
  const dmg = 75 * BS.dmgMult * dynDmg();
  P.iframe = Math.max(P.iframe, 0.4);
  for (const e of room.enemies.slice()) {
    if (e.dead || e.spawning) continue;
    const d = dist(P.x, P.y, e.x, e.y);
    if (d < R + e.r && Math.abs(angDiff(a, angTo(P.x, P.y, e.x, e.y))) < ARC) {
      const ang = angTo(P.x, P.y, e.x, e.y);
      damageEnemy(e, dmg, { knock: 260, ang, tag: ELEM_TAGS.includes(tag) ? tag : null });
      if (!e.dead) onHitProcs(e, dmg, tag, { ang, x: e.x, y: e.y });
    }
  }
  let n = 0;
  for (const b of BULLETS) {
    if (b.team !== 'e' || b.type === 'lob') continue;
    if (d2(b.x, b.y, P.x, P.y) < 220 * 220 && Math.abs(angDiff(a, angTo(P.x, P.y, b.x, b.y))) < 1.4) {
      const sp = Math.max(700, Math.hypot(b.vx, b.vy) * 1.8), ta = a + rand(-0.15, 0.15);
      b.team = 'p'; b.vx = Math.cos(ta) * sp; b.vy = Math.sin(ta) * sp; b.dmg = Math.max(25, b.dmg * 3) * BS.dmgMult;
      b.color = '#3dffb0'; b.hit.clear(); b.pierce = 2; b.life = b.maxLife = 1.2; b.owner = null; b.tag = ELEM_TAGS.includes(tag) ? tag : 'bullet'; b.status = null; b.chill = false; b.type = 'n'; n++;
    }
  }
  for (const p of room.props) if (p.shootable && !p.dead && dist(P.x, P.y, p.x, p.y) < R + p.r && Math.abs(angDiff(a, angTo(P.x, P.y, p.x, p.y))) < ARC) hitProp(p, dmg, null);
  if (n) floatText(P.x, P.y - 40, `반사 ×${n}`, '#3dffb0', 16);
  part({ x: P.x, y: P.y, vx: 0, vy: 0, life: 0.22, size: R, color: '#3dffb0', kind: 'arc', rot: a });
  SFX.play('slash'); shake(4);
}

// ================= 프리즘 각성 (태그별 9세트) =================
function metalBlades() {
  const out = [];
  for (let i = 0; i < 4; i++) { const a = P.bladeA + i * TAU / 4; out.push({ x: P.x + Math.cos(a) * 85, y: P.y + Math.sin(a) * 85, a }); }
  return out;
}
function awTimer(key, dt, every) {
  run.awT = run.awT || {};
  run.awT[key] = (run.awT[key] === undefined ? every * 0.5 : run.awT[key]) - dt;
  if (run.awT[key] <= 0) { run.awT[key] = every; return true; }
  return false;
}
function liveNear(r) { return room.enemies.filter(e => !e.dead && !e.spawning && d2(e.x, e.y, P.x, P.y) < r * r); }
function updateAwaken(dt) {
  const aw = BS.aw;
  if (aw.fire && awTimer('fire', dt, 0.5)) {
    for (const e of liveNear(170)) applyStatus(e, 'fire', {});
    for (let i = 0; i < 6; i++) { const a = rand(0, TAU); part({ x: P.x + Math.cos(a) * 170, y: P.y + Math.sin(a) * 170, vx: 0, vy: -50, life: 0.5, size: 4, color: '#ff7a2a', kind: 'dot' }); }
  }
  if (aw.elec && awTimer('elec', dt, 1)) {
    const vis = room.enemies.filter(e => !e.dead && !e.spawning && !e.invuln && onScreen(e.x, e.y, 0));
    if (vis.length) { const t = pick(vis); strike(t.x, t.y); damageEnemy(t, 40 * BS.dmgMult * dynDmg(), { tag: 'elec' }); }
  }
  if (aw.ice && awTimer('ice', dt, 0.6)) {
    for (const e of liveNear(200)) applyStatus(e, 'ice', {});
    part({ x: P.x, y: P.y, life: 0.4, size: 200, color: TAG_COLOR.ice, kind: 'ring' });
  }
  if (aw.metal) {
    P.bladeA += dt * 4;
    for (const bl of metalBlades()) {
      for (const e of room.enemies) {
        if (e.dead || e.spawning || e.invuln) continue;
        if (d2(bl.x, bl.y, e.x, e.y) < (e.r + 14) ** 2 && (e.bladeCd || 0) <= G.time) {
          e.bladeCd = G.time + 0.35;
          damageEnemy(e, 20 * BS.dmgMult * dynDmg(), { tag: 'metal', stacks: 2, quiet: true });
          burst(e.x, e.y, TAG_COLOR.metal, 5, 160, 0.25, 2);
        }
      }
    }
  }
  if (aw.light && awTimer('light', dt, 6)) {
    G.flash = 0.35; G.flashColor = '255,250,220'; SFX.play('reaction');
    floatText(P.x, P.y - 50, '성광!', TAG_COLOR.light, 24);
    for (const e of room.enemies) if (!e.dead && !e.spawning && onScreen(e.x, e.y, 60)) { applyStatus(e, 'light', {}); applyStatus(e, 'light', {}); damageEnemy(e, 40 * BS.dmgMult * dynDmg(), { noStatus: true, quiet: true }); }
    for (const b of BULLETS) if (b.team === 'e' && onScreen(b.x, b.y, 60)) b.dead = true;
  }
  if (aw.wind) {
    for (const b of BULLETS) {
      if (b.team !== 'e' || b.type === 'lob' || b.dead) continue;
      if (d2(b.x, b.y, P.x, P.y) < 95 * 95) {
        const a = angTo(P.x, P.y, b.x, b.y), sp = Math.max(600, Math.hypot(b.vx, b.vy) * 1.5);
        b.team = 'p'; b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; b.dmg = Math.max(15, b.dmg * 2) * BS.dmgMult;
        b.color = TAG_COLOR.wind; b.hit.clear(); b.pierce = 1; b.life = b.maxLife = 1; b.owner = null; b.tag = 'wind'; b.type = 'n'; b.chill = false;
      }
    }
    if (awTimer('wind', dt, 3)) {
      for (const e of liveNear(240)) applyStatus(e, 'wind', { ang: angTo(P.x, P.y, e.x, e.y), dmg: 25 });
      part({ x: P.x, y: P.y, life: 0.35, size: 240, color: TAG_COLOR.wind, kind: 'ring' }); SFX.play('roll');
    }
  }
  if (aw.water && awTimer('water', dt, 5)) {
    floatText(P.x, P.y - 50, '해일!', TAG_COLOR.water, 22);
    for (let i = 0; i < 3; i++) part({ x: P.x, y: P.y, life: 0.6 + i * 0.15, size: 420 * (0.6 + i * 0.2), color: TAG_COLOR.water, kind: 'ring' });
    SFX.play('water'); shake(6);
    for (const e of liveNear(420)) {
      applyStatus(e, 'water', {});
      if (e.burnT > 0) e.burnT = BS.burnDur;
      if (e.shockT > 0) e.shockT = 2;
      if (e.chillT > 0) e.chillT = 3 * BS.chillDur;
      if (e.shredT > 0) e.shredT = BS.shredDur;
      if (e.corrodeT > 0) e.corrodeT = 6;
      if (e.blindT > 0) e.blindT = BS.blindDur;
      damageEnemy(e, 30 * BS.dmgMult * dynDmg(), { noStatus: true, quiet: true });
    }
  }
}

// ================= 아군 (포탑, 로봇, 분신) =================
function updateAllies(dt) {
  for (let i = room.allies.length - 1; i >= 0; i--) {
    const a = room.allies[i];
    a.t -= dt;
    if (a.type === 'turret' || a.type === 'robot') {
      if (a.type === 'robot') {
        const tx = P.x - Math.cos(P.ang) * 50 + 30, ty = P.y - Math.sin(P.ang) * 50;
        a.x = lerp(a.x, tx, Math.min(1, 3 * dt)); a.y = lerp(a.y, ty, Math.min(1, 3 * dt));
      }
      a.cd -= dt;
      const range = a.type === 'turret' ? 560 : 480;
      let best = null, bd = range * range;
      for (const e of room.enemies) {
        if (e.dead || e.spawning || e.invuln) continue;
        const dd = d2(a.x, a.y, e.x, e.y);
        if (dd < bd && rayWalls(a.x, a.y, e.x - a.x, e.y - a.y, Math.sqrt(dd)) >= Math.sqrt(dd) - 2) { bd = dd; best = e; }
      }
      if (best) {
        const ta = angTo(a.x, a.y, best.x, best.y);
        a.ang += clamp(angDiff(a.ang, ta), -10 * dt, 10 * dt);
        if (a.cd <= 0 && Math.abs(angDiff(a.ang, ta)) < 0.3) {
          a.cd = a.type === 'robot' ? 0.4 : 0.2;
          const tag = wStats(curW()).tag;
          spawnBullet({ x: a.x + Math.cos(a.ang) * 16, y: a.y + Math.sin(a.ang) * 16, vx: Math.cos(a.ang) * 860, vy: Math.sin(a.ang) * 860, r: 3.5, dmg: 11 * BS.dmgMult * dynDmg(), team: 'p', life: 0.75, tag: tag === 'exp' ? 'bullet' : tag, pierce: a.type === 'turret' ? 1 : 0, color: a.type === 'robot' ? '#6dd5ff' : (TAG_COLOR[tag] || '#ffd23d'), wid: 'turret', small: true });
          SFX.play('smg', 0.4);
        }
      }
    }
    if (a.t <= 0) { burst(a.x, a.y, '#aaa', 10, 150, 0.4, 2); room.allies.splice(i, 1); }
  }
}

// ================= 획득물 =================
function updatePickups(dt) {
  const rad = 44 * BS.magnet * (SAVE.settings.autoCoin ? 1.6 : 1);
  const magnets = room.enemies.filter(e => !e.dead && e.muts && e.muts.includes('magnet'));
  for (let i = room.pickups.length - 1; i >= 0; i--) {
    const p = room.pickups[i];
    if (p.type === 'coin') {
      p.t -= dt;
      if (p.t <= 0) { room.pickups.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(0.02, dt); p.vy *= Math.pow(0.02, dt);
      let grabbed = false;
      for (const m of magnets) {
        const d = dist(p.x, p.y, m.x, m.y);
        if (d < 280) {
          p.x += (m.x - p.x) / Math.max(1, d) * 260 * dt; p.y += (m.y - p.y) / Math.max(1, d) * 260 * dt;
          if (d < m.r) { m.heldCoins += p.val; room.pickups.splice(i, 1); grabbed = true; }
          break;
        }
      }
      if (grabbed) continue;
      const d = dist(p.x, p.y, P.x, P.y);
      if (d < rad * 2.2 && !P.dead && d > 0.5) {
        const pull = (1 - d / (rad * 2.2)) * 900 + 100;
        p.x += (P.x - p.x) / d * pull * dt; p.y += (P.y - p.y) / d * pull * dt;
      }
      if (d < P.r + 10) {
        run.coins += p.val; run.coinsEarned += p.val; SFX.play('coin');
        floatText(p.x, p.y - 10, '+' + p.val, '#ffe14d', 12);
        room.pickups.splice(i, 1);
      }
    } else if (p.type === 'weapon') {
      p.t = (p.t || 0) + dt;
    }
  }
}

function findInteract() {
  let best = null, bd = 64 * 64;
  if (P.hackCd <= 0) {
    let hb = null, hd = 90 * 90;
    for (const e of room.enemies) { if (!canHack(e)) continue; const dd = d2(e.x, e.y, P.x, P.y); if (dd < hd) { hd = dd; hb = e; } }
    if (hb) return { label: `[E] 해킹: ${(ENEMY_INFO[hb.type] || { name: '분열 조각' }).name}`, act: () => { hackEnemy(hb); P.hackCd = 8; } };
  }
  for (const p of room.pickups) {
    if (p.type !== 'weapon') continue;
    const dd = d2(p.x, p.y, P.x, P.y);
    if (dd < bd) { bd = dd; best = { label: `[E] 줍기: ${weaponName(p.w)}`, act: () => pickupWeapon(p) }; }
  }
  for (const p of room.props) {
    if (p.dead || !p.interact) continue;
    const dd = d2(p.x, p.y, P.x, P.y);
    if (dd < (bd) && dd < (p.r + 50) ** 2) { bd = dd; best = { label: p.interact, act: () => interactProp(p) }; }
  }
  return best;
}
function pickupWeapon(p) {
  const idx = room.pickups.indexOf(p); if (idx < 0) return;
  room.pickups.splice(idx, 1);
  codex('weapon', p.w.id);
  if (run.weapons.length < 2) { run.weapons.push(p.w); run.cur = run.weapons.length - 1; }
  else {
    const old = run.weapons[run.cur];
    old.reloadT = 0;
    run.weapons[run.cur] = p.w;
    room.pickups.push({ type: 'weapon', x: P.x, y: P.y + 20, w: old, t: 0 });
  }
  p.w.first = true;
  SFX.play('pick');
  floatText(P.x, P.y - 36, weaponName(p.w), GRADES[p.w.grade].color, 16);
}

// ================= 플레이어가 밟은 환경 =================
function playerHazards() {
  const r = { slick: false, slow: 1, px: 0, py: 0 };
  for (const h of room.hazards) {
    if (!pointInHazard(h, P.x, P.y)) continue;
    switch (h.type) {
      case 'slick': r.slick = true; break;
      case 'frost': r.slick = true; P.chillT = Math.max(P.chillT, 0.3); if (h.dmg) damagePlayer(h.dmg, null); break;
      case 'oil': r.slow = Math.min(r.slow, 0.85); break;
      case 'fire': if (!h.player) damagePlayer(6, null); break;
      case 'toxic': damagePlayer(5, null); break;
      case 'water': if (h.elecT > 0 && !h.player) damagePlayer(8, null); break;
      case 'steam': if (h.on) { P.chillT = Math.max(P.chillT, 1); damagePlayer(4, null); } break;
      case 'elecfloor': if (h.state === 'on') damagePlayer(10, null); break;
      case 'laser': if (h.state === 'on') damagePlayer(15, null); break;
      case 'conveyor': r.px += h.dx * 140; r.py += h.dy * 140; break;
    }
  }
  return r;
}

// ================= 카메라 =================
function updateCamera(dt, snap) {
  let tx = P.x - VW / 2, ty = P.y - VH / 2;
  if (!Input.usingPad && !Input.touch) { tx += (Input.mx - VW / 2) * 0.18; ty += (Input.my - VH / 2) * 0.18; }
  else { tx += Math.cos(P.ang) * 60; ty += Math.sin(P.ang) * 60; }
  const m = 80;
  if (room.w + m * 2 <= VW) tx = room.w / 2 - VW / 2; else tx = clamp(tx, -m, room.w + m - VW);
  if (room.h + m * 2 <= VH) ty = room.h / 2 - VH / 2; else ty = clamp(ty, -m, room.h + m - VH);
  if (snap) { cam.x = tx; cam.y = ty; }
  else { cam.x = lerp(cam.x, tx, Math.min(1, 8 * dt)); cam.y = lerp(cam.y, ty, Math.min(1, 8 * dt)); }
}
