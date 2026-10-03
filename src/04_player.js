// ================= 플레이어 =================
function rollMax() { return run.char === 'kai' ? 2 : 1; }
function createPlayer(x, y) {
  P = {
    x, y, vx: 0, vy: 0, kx: 0, ky: 0, r: 13, ang: -Math.PI / 2, rollT: 0, rollDx: 1, rollDy: 0, rollCharges: rollMax(), rollRe: 0,
    iframe: 1, hurtT: 0, skillCd: 0, skillMax: 1, overT: 0, slowT: 0, shield: BS.surv5 ? 2 : 0, dead: false, staticShots: 0,
    chillT: 0, trailT: 0, stepT: 0, prompt: null, swapT: 0, pullT: 0
  };
}

function updatePlayer(dt) {
  if (P.dead) return;
  P.iframe -= dt; P.hurtT -= dt; P.overT -= dt; P.slowT -= dt; P.chillT -= dt; P.skillCd -= dt; P.swapT -= dt;
  const rm = rollMax();
  if (P.rollCharges < rm) { P.rollRe -= dt; if (P.rollRe <= 0) { P.rollCharges++; P.rollRe = 0.75; } }
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
    }
    if (P.rollT <= 0) {
      if (BS.evasion > 1) P.iframe = Math.max(P.iframe, 0.15);
      if (BS.blastroll) explode(P.x, P.y, 90, 28, { noSelf: true });
      if (BS.static) P.staticShots = 3;
    }
  } else {
    const spd = 235 * BS.moveMult * (P.chillT > 0 ? 0.7 : 1) * hz.slow;
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
  if (P.overT > 0 && w.reloadT > 0) { w.reloadT = 0; w.ammo = s.mag; }
  if (w.cd > 0) w.cd -= dt;
  const firing = !G.bossIntro && (Input.mb[0] || (gp && gp.fire)) && P.swapT <= 0;
  if (firing && w.cd <= 0 && w.reloadT <= 0) {
    if (s.mag !== Infinity && w.ammo <= 0 && P.overT <= 0) { startReload(w); }
    else {
      shoot(w);
      w.cd = (w.cd < -0.05 ? 0 : w.cd) + 1 / (s.rate * (P.overT > 0 ? 2 : 1));
      if (P.overT <= 0 && s.mag !== Infinity) { w.ammo--; if (w.ammo <= 0) startReload(w); }
    }
  }
  if (Input.pressed.KeyR || (gp && gp.reload)) startReload(w);
  if ((Input.pressed.KeyQ || Input.wheel !== 0 || (gp && gp.swap)) && run.weapons.length > 1) {
    curW().reloadT = 0; run.cur = 1 - run.cur; P.swapT = 0.15; SFX.play('ui');
    const nw = curW(); if (wStats(nw).mag !== Infinity && nw.ammo <= 0) startReload(nw);
  }
  // 스킬
  if ((Input.mp[2] || (gp && gp.skill)) && !G.bossIntro) useSkill();
  // 전기 5세트: 5초마다 번개
  if (BS.elec5) {
    run.boltT = (run.boltT || 0) - dt;
    if (run.boltT <= 0) {
      run.boltT = 2.5;
      const ts = room.enemies.filter(e => !e.dead && !e.spawning && !e.invuln).sort((a, b) => d2(a.x, a.y, P.x, P.y) - d2(b.x, b.y, P.x, P.y)).slice(0, 3);
      for (const t of ts) { strike(t.x, t.y); damageEnemy(t, 30 * dynDmg(), { tag: 'elec' }); }
    }
  }
  if (BS.prism) updatePrism(dt);
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
  if (P.rollCharges === rollMax()) P.rollRe = 0.75;
  P.rollCharges--;
  if (BS.afterimage) room.allies.push({ type: 'decoy', x: P.x, y: P.y, t: 1, max: 1, r: 13 });
  SFX.play('roll');
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
    case 'momo': {
      let tx = P.x + Math.cos(P.ang) * 44, ty = P.y + Math.sin(P.ang) * 44;
      if (wallAt(tx, ty)) { tx = P.x; ty = P.y; }
      const turrets = room.allies.filter(a => a.type === 'turret');
      if (turrets.length >= 2) { const old = turrets[0]; old.t = 0; }
      room.allies.push({ type: 'turret', x: tx, y: ty, t: 20, max: 20, cd: 0.3, ang: P.ang, r: 14 });
      burst(tx, ty, '#ffd23d', 14, 200, 0.4, 3);
      break;
    }
    case 'kai': kaiSlash(); break;
    case 'sera':
      P.slowT = 3; G.flash = 0.2; G.flashColor = '180,140,255';
      part({ x: P.x, y: P.y, vx: 0, vy: 0, life: 0.6, size: 520, color: '#b48cff', kind: 'ring' });
      break;
  }
  if (BS.discharge) {
    const ts = room.enemies.filter(e => !e.dead && !e.spawning).sort((a, b) => d2(a.x, a.y, P.x, P.y) - d2(b.x, b.y, P.x, P.y)).slice(0, 5);
    for (const e of ts) { addBolt(P.x, P.y, e.x, e.y, '#fff04d'); damageEnemy(e, 25 * dynDmg(), { tag: 'elec' }); }
  }
}

function kaiSlash() {
  const a = P.ang, R = 150;
  const tag = wStats(curW()).tag;
  const dmg = 40 * BS.dmgMult * dynDmg();
  for (const e of room.enemies.slice()) {
    if (e.dead || e.spawning) continue;
    const d = dist(P.x, P.y, e.x, e.y);
    if (d < R + e.r && Math.abs(angDiff(a, angTo(P.x, P.y, e.x, e.y))) < 1.05) damageEnemy(e, dmg, { knock: 280, ang: angTo(P.x, P.y, e.x, e.y), tag: tag === 'bullet' ? null : tag });
  }
  let n = 0;
  for (const b of BULLETS) {
    if (b.team !== 'e' || b.type === 'lob') continue;
    if (d2(b.x, b.y, P.x, P.y) < 200 * 200 && Math.abs(angDiff(a, angTo(P.x, P.y, b.x, b.y))) < 1.3) {
      const sp = Math.max(650, Math.hypot(b.vx, b.vy) * 1.8), ta = a + rand(-0.15, 0.15);
      b.team = 'p'; b.vx = Math.cos(ta) * sp; b.vy = Math.sin(ta) * sp; b.dmg = Math.max(18, b.dmg * 2.5) * BS.dmgMult;
      b.color = '#3dffb0'; b.hit.clear(); b.pierce = 1; b.life = b.maxLife = 1.2; b.owner = null; b.tag = 'bullet'; b.status = null; b.chill = false; b.type = 'n'; n++;
    }
  }
  for (const p of room.props) if (p.shootable && !p.dead && dist(P.x, P.y, p.x, p.y) < R + p.r && Math.abs(angDiff(a, angTo(P.x, P.y, p.x, p.y))) < 1.05) hitProp(p, dmg, null);
  if (n) floatText(P.x, P.y - 40, `반사 ×${n}`, '#3dffb0', 16);
  part({ x: P.x, y: P.y, vx: 0, vy: 0, life: 0.22, size: R, color: '#3dffb0', kind: 'arc', rot: a });
  SFX.play('slash'); shake(4);
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
      let best = null, bd = 480 * 480;
      for (const e of room.enemies) {
        if (e.dead || e.spawning || e.invuln) continue;
        const dd = d2(a.x, a.y, e.x, e.y);
        if (dd < bd && rayWalls(a.x, a.y, e.x - a.x, e.y - a.y, Math.sqrt(dd)) >= Math.sqrt(dd) - 2) { bd = dd; best = e; }
      }
      if (best) {
        const ta = angTo(a.x, a.y, best.x, best.y);
        a.ang += clamp(angDiff(a.ang, ta), -8 * dt, 8 * dt);
        if (a.cd <= 0 && Math.abs(angDiff(a.ang, ta)) < 0.3) {
          a.cd = a.type === 'robot' ? 0.4 : 0.26;
          const tag = wStats(curW()).tag;
          spawnBullet({ x: a.x + Math.cos(a.ang) * 16, y: a.y + Math.sin(a.ang) * 16, vx: Math.cos(a.ang) * 820, vy: Math.sin(a.ang) * 820, r: 3.5, dmg: (a.type === 'robot' ? 11 : 9) * BS.dmgMult * dynDmg(), team: 'p', life: 0.7, tag: tag === 'exp' ? 'bullet' : tag, color: a.type === 'robot' ? '#6dd5ff' : '#ffd23d' });
          SFX.play('smg', 0.4);
        }
      }
    }
    if (a.t <= 0) { burst(a.x, a.y, '#aaa', 10, 150, 0.4, 2); room.allies.splice(i, 1); }
  }
}

// ================= 획득물 =================
function updatePickups(dt) {
  const rad = 44 * BS.magnet;
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
          p.x += (m.x - p.x) / d * 260 * dt; p.y += (m.y - p.y) / d * 260 * dt;
          if (d < m.r) { m.heldCoins += p.val; room.pickups.splice(i, 1); grabbed = true; }
          break;
        }
      }
      if (grabbed) continue;
      const d = dist(p.x, p.y, P.x, P.y);
      if (d < rad * 2.2 && !P.dead) {
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
      case 'water': if (h.elecT > 0) damagePlayer(8, null); break;
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
  if (!Input.usingPad) { tx += (Input.mx - VW / 2) * 0.18; ty += (Input.my - VH / 2) * 0.18; }
  else { tx += Math.cos(P.ang) * 60; ty += Math.sin(P.ang) * 60; }
  const m = 80;
  if (room.w + m * 2 <= VW) tx = room.w / 2 - VW / 2; else tx = clamp(tx, -m, room.w + m - VW);
  if (room.h + m * 2 <= VH) ty = room.h / 2 - VH / 2; else ty = clamp(ty, -m, room.h + m - VH);
  if (snap) { cam.x = tx; cam.y = ty; }
  else { cam.x = lerp(cam.x, tx, Math.min(1, 8 * dt)); cam.y = lerp(cam.y, ty, Math.min(1, 8 * dt)); }
}

// ================= 프리즘 세트 =================
const PRISM_TAGS = ['fire', 'elec', 'ice'];
function prismOrbs() {
  const out = [];
  for (let i = 0; i < 3; i++) { const a = P.prismA + i * TAU / 3; out.push({ x: P.x + Math.cos(a) * 72, y: P.y + Math.sin(a) * 72, hue: (G.time * 120 + i * 120) % 360 }); }
  return out;
}
function updatePrism(dt) {
  P.prismA = (P.prismA || 0) + dt * 3.2;
  if (run.prismT === undefined || run.prismT === null) run.prismT = 3;
  // 회전 조각: 적 베기 + 적 탄 지우기
  const orbs = prismOrbs();
  for (const o of orbs) {
    for (const e of room.enemies) {
      if (e.dead || e.spawning || e.invuln) continue;
      if (d2(o.x, o.y, e.x, e.y) < (e.r + 12) ** 2 && (e.prismCd || 0) <= G.time) {
        e.prismCd = G.time + 0.3;
        damageEnemy(e, 22 * dynDmg() * BS.dmgMult, { tag: pick(PRISM_TAGS), knock: 120, ang: angTo(P.x, P.y, e.x, e.y), quiet: true });
        burst(e.x, e.y, `hsl(${o.hue},100%,65%)`, 5, 160, 0.3, 3);
      }
    }
    for (const b of BULLETS) {
      if (b.team !== 'e' || b.type === 'lob' || b.dead) continue;
      if (d2(o.x, o.y, b.x, b.y) < (b.r + 14) ** 2) { b.dead = true; burst(b.x, b.y, `hsl(${o.hue},100%,65%)`, 4, 120, 0.25, 2); }
    }
  }
  // 프리즘 폭발
  run.prismT -= dt;
  if (run.prismT <= 0 && room.enemies.some(e => !e.dead && !e.spawning)) {
    run.prismT = 6;
    prismNova();
  }
}
function prismNova() {
  const R = 380 * BS.expRadius / 1.3;
  SFX.play('reaction'); SFX.play('explode', 0.6);
  floatText(P.x, P.y - 50, '프리즘 폭발!', `hsl(${(G.time * 300) % 360},100%,70%)`, 24);
  for (let i = 0; i < 4; i++) part({ x: P.x, y: P.y, life: 0.5 + i * 0.1, size: R * (0.6 + i * 0.13), color: `hsl(${i * 90 + (G.time * 200) % 360},100%,65%)`, kind: 'ring' });
  burst(P.x, P.y, '#ffffff', 30, 520, 0.6, 4);
  shake(10); G.flash = 0.25; G.flashColor = '255,255,255';
  for (const e of room.enemies.slice()) {
    if (e.dead || e.spawning || e.invuln) continue;
    if (dist(P.x, P.y, e.x, e.y) < R + e.r) {
      const tg = pick(PRISM_TAGS);
      damageEnemy(e, 80 * BS.dmgMult / 1.8 * 1.8 * dynDmg(), { tag: tg, knock: 260, ang: angTo(P.x, P.y, e.x, e.y), statusDmg: 40 });
      if (!e.dead) applyStatus(e, pick(PRISM_TAGS), { dmg: 40 });
    }
  }
  for (const b of BULLETS) if (b.team === 'e' && b.type !== 'lob' && d2(P.x, P.y, b.x, b.y) < R * R) b.dead = true;
}
