// ================= 보스 =================
function bossDraw(e, c, f, fn) {
  if (SAVE.settings.particles > 0) { ctx.shadowColor = e.color; ctx.shadowBlur = 20; }
  fn();
  ctx.shadowBlur = 0;
}
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  const t = l2 ? clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1) : 0;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

// 보스 방 준비: 사물 배치 + 보스 생성
function setupBoss(id) {
  const cx = room.w / 2, cy = room.h / 2;
  room.bossId = id;
  codex('boss', id);
  if (id === 'crusher') {
    spawnEnemy('boss_crusher', cx, cy - 150, { instant: true });
  } else if (id === 'frost') {
    const hx = Math.min(room.w * 0.36, 520), hy = Math.min(room.h * 0.36, 330);
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) room.props.push({ type: 'heater', x: cx + sx * hx, y: cy + sy * hy, r: 22, hp: 45, maxHp: 45, shootable: true, on: false });
    spawnEnemy('boss_frost', cx, cy, { instant: true });
  } else if (id === 'twins') {
    room.twins = [spawnEnemy('boss_twins', cx - 250, cy, { instant: true, idx: 0 }), spawnEnemy('boss_twins', cx + 250, cy, { instant: true, idx: 1 })];
    room.twinAng = Math.PI; room.twinR = 250; room.twinDir = 1; room.twinRT = 5;
  } else if (id === 'mother') {
    spawnEnemy('boss_mother', cx, 240, { instant: true });
  }
  const info = BOSS_INFO[id];
  G.bossIntro = { t: 2.6, max: 2.6, name: info.name, sub: info.sub };
  SFX.play('boss');
}

function spawnPillars(n) {
  const cx = room.w / 2, cy = room.h / 2 + 60;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i + 0.5) / n * TAU + 0.3;
    const x = clamp(cx + Math.cos(a) * 360, 80, room.w - 80), y = clamp(cy + Math.sin(a) * 280, 80, room.h - 80);
    room.props.push({ type: 'spillar', x, y, r: 26, hp: 170 * G.bossHp, maxHp: 170 * G.bossHp, shootable: true, shootT: rand(1.5, 3) });
    burst(x, y, '#c86bff', 20, 250, 0.5, 3);
  }
}

function onBossKilled(e) {
  if (room.enemies.some(b => b.boss && !b.dead && b !== e)) return;
  run.bossesKilled++;
  G.slowmo = 1.4; shake(24); SFX.play('explode');
  for (let i = 0; i < 8; i++) room.timers.push({ t: i * 0.15, fn: () => fxExplosion(e.x + rand(-70, 70), e.y + rand(-70, 70), 80) });
  for (const m of room.enemies) if (!m.dead && !m.boss) { m.noReward = true; killEnemy(m, {}); }
  for (const b of BULLETS) if (b.team === 'e') b.dead = true;
  room.props = room.props.filter(p => p.type !== 'spillar' && p.type !== 'heater');
  room.bossDead = true;
}

EN.boss_crusher = {
  boss: true, hp: 1, r: 44, spd: 70, color: '#ff8a2a', contact: 18, heavy: true,
  init(e) { e.hp = e.maxHp = 1500 * G.bossHp; e.st = 'walk'; e.t = 1.6; e.dmgTakenMult = 0.35; e.charges = 0; e.bossId = 'crusher'; e.name = '크러셔'; },
  update(e, dt) {
    const ph2 = e.hp < e.maxHp * 0.5, oc5 = run.oc >= 5;
    e.t -= dt;
    e.contact = e.st === 'charge' ? 26 : 18;
    switch (e.st) {
      case 'walk':
        moveToward(e, P.x, P.y, e.spd * e.sm, dt); e.ang = angTo(e.x, e.y, P.x, P.y);
        if (e.t <= 0) {
          const r = Math.random();
          if (r < 0.55) { e.st = 'windup'; e.t = 0.8; e.lockA = angTo(e.x, e.y, P.x, P.y); SFX.play('warn'); }
          else if (r < 0.82 || !oc5) { e.st = 'throw'; e.t = 0.6; }
          else { e.st = 'quake'; e.t = 0.7; }
        }
        break;
      case 'windup':
        e.lockA += clamp(angDiff(e.lockA, angTo(e.x, e.y, P.x, P.y)), -0.8 * dt, 0.8 * dt);
        e.ang = e.lockA;
        if (e.t <= 0) { e.st = 'charge'; e.t = 2.5; SFX.play('roll'); }
        break;
      case 'charge': {
        const sp = ph2 ? 760 : 660;
        const nx = e.x + Math.cos(e.lockA) * sp * dt, ny = e.y + Math.sin(e.lockA) * sp * dt;
        const w = wallCircle(nx, ny, e.r);
        const out = nx < e.r || nx > room.w - e.r || ny < e.r || ny > room.h - e.r;
        if (w && w !== 'bound' && w.hp < Infinity) { damageWall(w, 9999); }
        if (out || (w && (w === 'bound' || w.hp === Infinity))) {
          e.st = 'stun'; e.t = 3; e.dmgTakenMult = 2.2; e.charges = 0;
          shake(20); SFX.play('stun'); hitstop(0.08);
          burst(e.x + Math.cos(e.lockA) * e.r, e.y + Math.sin(e.lockA) * e.r, '#ffb347', 30, 400, 0.6, 4);
          floatText(e.x, e.y - 70, '기절! 약점 노출', '#ffe14d', 22);
          for (let i = 0; i < 3; i++) lob(e, clamp(e.x + rand(-300, 300), 40, room.w - 40), clamp(e.y + rand(-300, 300), 40, room.h - 40), 1.1, 55, 10, false);
        } else if (e.t <= 0) {
          e.st = 'walk'; e.t = 1.2;
        } else {
          e.x = nx; e.y = ny;
          if (Math.random() < 0.6) part({ x: e.x - Math.cos(e.lockA) * e.r, y: e.y - Math.sin(e.lockA) * e.r, vx: rand(-40, 40), vy: rand(-40, 40), life: 0.5, size: rand(6, 12), color: 'rgba(200,150,100,0.5)', kind: 'smoke' });
        }
        if (e.st === 'walk' && ph2 && e.charges < 1) { e.charges++; e.st = 'windup'; e.t = 0.45; e.lockA = angTo(e.x, e.y, P.x, P.y); SFX.play('warn'); }
        break;
      }
      case 'stun':
        if (Math.random() < 0.2) part({ x: e.x + rand(-30, 30), y: e.y - e.r - 10, vx: 0, vy: -40, life: 0.5, size: 3, color: '#ffe14d', kind: 'dot' });
        if (e.t <= 0) { e.st = 'walk'; e.t = 1.6; e.dmgTakenMult = 0.35; }
        break;
      case 'throw':
        if (e.t <= 0) {
          const n = ph2 ? 5 : 3;
          for (let i = 0; i < n; i++) lob(e, clamp(P.x + (i ? rand(-160, 160) : 0), 30, room.w - 30), clamp(P.y + (i ? rand(-160, 160) : 0), 30, room.h - 30), 1.0 + i * 0.1, 65, 14, true);
          e.st = 'walk'; e.t = 1.6;
        }
        break;
      case 'quake':
        if (e.t <= 0) { eRing(e, 26, 230, 10, rand(0, TAU)); shake(12); SFX.play('explode'); e.st = 'walk'; e.t = 1.5; }
        break;
    }
  },
  draw(e, c, f) {
    if (e.st === 'windup') {
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.lockA) * 1400, e.y + Math.sin(e.lockA) * 1400);
      ctx.strokeStyle = `rgba(255,80,40,${0.3 + Math.sin(G.time * 40) * 0.2})`; ctx.lineWidth = e.r * 2; ctx.stroke();
    }
    bossDraw(e, c, f, () => {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.ang || 0);
      const s = e.r;
      ctx.beginPath(); ctx.rect(-s, -s * 0.85, s * 2, s * 1.7); neonShape(c, 3.5, f);
      // 압착 턱
      const jaw = e.st === 'charge' ? 6 : e.st === 'windup' ? 10 + Math.sin(G.time * 30) * 4 : 14;
      ctx.fillStyle = c; ctx.fillRect(s * 0.7, -s * 0.85, s * 0.5, s * 0.85 - jaw / 2); ctx.fillRect(s * 0.7, jaw / 2, s * 0.5, s * 0.85 - jaw / 2);
      // 약점 (등 뒤)
      circlePath(-s * 0.55, 0, s * 0.3);
      ctx.fillStyle = e.st === 'stun' ? (Math.sin(G.time * 20) > 0 ? '#ffe14d' : '#fff') : '#4a3020'; ctx.fill();
      ctx.restore();
    });
    if (e.st === 'stun') { ctx.font = `bold 16px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe14d'; ctx.fillText('★ 약점 노출 ★', e.x, e.y - e.r - 16); }
  }
};

EN.boss_frost = {
  boss: true, hp: 1, r: 52, spd: 0, color: '#7fdcff', contact: 15, heavy: true,
  init(e) { e.hp = e.maxHp = 1700 * G.bossHp; e.invuln = true; e.shieldT = 0; e.pat = 0; e.t = 2; e.spin = 0; e.frostT = 2; e.bossId = 'frost'; e.name = '프로스트 코어'; },
  update(e, dt) {
    const ph2 = e.hp < e.maxHp * 0.45, sp = ph2 ? 1.35 : 1;
    const heaters = room.props.filter(p => p.type === 'heater');
    const on = heaters.filter(h => h.on).length;
    if (e.shieldT > 0) {
      e.shieldT -= dt;
      if (e.shieldT <= 0) { e.invuln = true; for (const h of heaters) { h.on = false; h.hp = h.maxHp; } SFX.play('shield'); floatText(e.x, e.y - 70, '보호막 재가동', '#7fdcff', 20); }
    } else if (on >= heaters.length && heaters.length) {
      e.invuln = false; e.shieldT = 7; SFX.play('explode'); shake(12);
      burst(e.x, e.y, '#bff4ff', 40, 400, 0.7, 4);
      G.banner = { text: '보호막 해제!', sub: '7초간 공격 가능', t: 1.4, color: '#7fdcff' };
    }
    // 바닥 얼리기
    e.frostT -= dt;
    if (e.frostT <= 0) {
      e.frostT = ph2 ? 2.4 : 3.4;
      const cnt = room.hazards.filter(h => h.boss).length;
      if (cnt < 18) {
        for (let k = 0; k < 10; k++) {
          const x = rand(80, room.w - 80), y = rand(80, room.h - 80);
          if (d2(x, y, e.x, e.y) < 150 * 150) continue;
          if (heaters.some(h => h.on && d2(h.x, h.y, x, y) < 230 * 230)) continue;
          addHazard({ type: 'frost', x, y, r: rand(50, 80), life: Infinity, dmg: 4, boss: true, grow: 5 });
          break;
        }
      }
    }
    e.spin += dt;
    if (e.st === 'spiral') {
      e.st2 -= dt; e.fireT -= dt;
      if (e.fireT <= 0) { e.fireT = 0.1; for (let k = 0; k < 3; k++) eShoot(e, e.spin * 2.2 + k * TAU / 3, 190, 9, { chill: true, color: '#9fe8ff' }); }
      if (e.st2 <= 0) e.st = '';
      return;
    }
    if (e.ring2 > 0) { e.ring2 -= dt; if (e.ring2 <= 0) eRing(e, 22, 170, 10, rand(0, TAU), { chill: true, color: '#9fe8ff' }); }
    e.t -= dt * sp;
    if (e.t <= 0) {
      const pats = run.oc >= 5 ? 4 : 3;
      e.pat = (e.pat + 1) % pats;
      switch (e.pat) {
        case 0: eRing(e, 22, 190, 10, rand(0, TAU), { chill: true, color: '#9fe8ff' }); if (ph2) e.ring2 = 0.45; break;
        case 1: e.st = 'spiral'; e.st2 = 2.6; e.fireT = 0; break;
        case 2: eFan(e, angTo(e.x, e.y, P.x, P.y), 7, 0.7, 300, 10, { chill: true, color: '#bff4ff' }); break;
        case 3: for (let i = 0; i < 16; i++) spawnBullet({ x: rand(0, room.w), y: 5, vx: rand(-30, 30), vy: rand(150, 230), team: 'e', dmg: 9, r: 7, life: 7, color: '#bff4ff', chill: true, noWall: true, owner: e }); floatText(room.w / 2, 60, '눈보라!', '#bff4ff', 22); break;
      }
      e.t = 2.3;
    }
  },
  draw(e, c, f) {
    bossDraw(e, c, f, () => {
      for (let i = 0; i < 6; i++) {
        const a = e.spin * 0.8 + i * TAU / 6;
        polyPath(e.x + Math.cos(a) * (e.r + 18), e.y + Math.sin(a) * (e.r + 18), 10, 3, a); neonShape('#bff4ff', 1.5);
      }
      polyPath(e.x, e.y, e.r, 6, e.spin * 0.3); neonShape(c, 3.5, f);
      polyPath(e.x, e.y, e.r * 0.5, 6, -e.spin); ctx.fillStyle = e.invuln ? '#3a6a8a' : (Math.sin(G.time * 12) > 0 ? '#ffffff' : '#7fdcff'); ctx.fill();
    });
    if (e.invuln) {
      circlePath(e.x, e.y, e.r + 30); ctx.fillStyle = 'rgba(120,200,255,0.12)'; ctx.fill();
      ctx.strokeStyle = 'rgba(180,230,255,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -G.time * 30; ctx.stroke(); ctx.setLineDash([]);
    } else {
      ctx.font = `bold 15px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe14d'; ctx.fillText(`보호막 해제 ${Math.ceil(e.shieldT)}`, e.x, e.y - e.r - 34);
    }
  }
};

EN.boss_twins = {
  boss: true, hp: 1, r: 34, spd: 0, color: '#ffe14d', contact: 14, heavy: true,
  init(e, o) { e.hp = e.maxHp = 850 * G.bossHp; e.idx = o.idx || 0; e.color = e.idx ? '#4dd2ff' : '#ffe14d'; e.t = rand(1.5, 2.5); e.down = false; e.bossId = 'twins'; e.name = e.idx ? '볼트 트윈스 B' : '볼트 트윈스 A'; e.burstN = 0; },
  update(e, dt) {
    const tw = room.twins, other = tw[1 - e.idx];
    if (e.down) {
      e.downT -= dt;
      if (e.downT <= 0) { e.down = false; e.invuln = false; e.hp = e.maxHp * 0.5; SFX.play('skill'); floatText(e.x, e.y - 50, '부활!', e.color, 22); burst(e.x, e.y, e.color, 30, 300, 0.5, 4); }
      return;
    }
    const cx = room.w / 2, cy = room.h / 2;
    if (e.idx === 0) {
      const fast = e.hp < e.maxHp * 0.5 || other.down || other.hp < other.maxHp * 0.5;
      room.twinAng += dt * (fast ? 0.75 : 0.45) * room.twinDir;
      room.twinRT -= dt;
      if (room.twinRT <= 0) { room.twinRT = rand(4, 7); room.twinR = rand(170, Math.min(340, room.h / 2 - 60)); if (Math.random() < 0.5) room.twinDir *= -1; }
      // 레이저 선 피해
      if (!other.down && !other.dead) {
        if (segDist(P.x, P.y, e.x, e.y, other.x, other.y) < P.r + 6) damagePlayer(12, e);
        if (run.oc >= 5) { room.sparkT = (room.sparkT || 0) - dt; if (room.sparkT <= 0) { room.sparkT = 0.6; const k = Math.random(); const sx = lerp(e.x, other.x, k), sy = lerp(e.y, other.y, k); const pa = angTo(e.x, e.y, other.x, other.y) + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1); spawnBullet({ x: sx, y: sy, vx: Math.cos(pa) * 200, vy: Math.sin(pa) * 200, r: 5, dmg: 8, team: 'e', life: 3, color: '#fff04d', owner: e }); } }
      }
    }
    const R = room.twinR * (e.idx ? 1 : 1);
    const tx = cx + Math.cos(room.twinAng + e.idx * Math.PI) * R * 1.3, ty = cy + Math.sin(room.twinAng + e.idx * Math.PI) * R;
    e.x = lerp(e.x, tx, Math.min(1, 3 * dt)); e.y = lerp(e.y, ty, Math.min(1, 3 * dt));
    e.ang = angTo(e.x, e.y, P.x, P.y);
    if (e.burstN > 0) { e.burstT -= dt; if (e.burstT <= 0) { e.burstN--; e.burstT = 0.15; eFan(e, e.ang, 3, 0.3, 310, 11, { color: '#ffee40' }); } }
    e.t -= dt * (other.down ? 1.5 : 1);
    if (e.t <= 0) {
      if (e.idx === 0) { e.burstN = 3; e.burstT = 0; }
      else eRing(e, 14, 210, 10, rand(0, TAU), { color: '#6ad8ff' });
      e.t = rand(1.7, 2.4);
    }
  },
  onZero(e, o) {
    const other = room.twins[1 - e.idx];
    if (other.down || other.dead) { if (!other.dead) killEnemy(other, o); return false; }
    e.down = true; e.downT = 5; e.invuln = true; e.hp = 0;
    floatText(e.x, e.y - 50, '다운! 5초 안에 다른 쪽을 처치', '#ffffff', 18);
    SFX.play('stun'); shake(10);
    return true;
  },
  draw(e, c, f) {
    const other = room.twins && room.twins[1 - e.idx];
    if (e.idx === 0 && other && !e.down && !other.down && !other.dead) {
      const fl = 0.6 + Math.sin(G.time * 40) * 0.3;
      neonLine(e.x, e.y, other.x, other.y, `rgba(255,255,160,${fl})`, 4);
      neonLine(e.x, e.y, other.x, other.y, '#ffffff', 1.5);
    }
    bossDraw(e, c, f, () => {
      polyPath(e.x, e.y, e.r, e.idx ? 4 : 3, G.time * (e.idx ? -1.5 : 1.5)); neonShape(e.down ? '#555' : c, 3.2, f);
      circlePath(e.x, e.y, e.r * 0.4); ctx.fillStyle = e.down ? '#333' : c; ctx.fill();
    });
    if (e.down) {
      ctx.font = `bold 22px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText(Math.ceil(e.downT), e.x, e.y + 8);
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 10, -Math.PI / 2, -Math.PI / 2 + TAU * (e.downT / 5)); ctx.strokeStyle = e.color; ctx.lineWidth = 4; ctx.stroke();
    }
  }
};

EN.boss_mother = {
  boss: true, hp: 1, r: 56, spd: 0, color: '#c86bff', contact: 20, heavy: true,
  init(e) {
    e.phase = 1; e.maxHp = 3300 * G.bossHp; e.hp = e.maxHp; e.invuln = true; e.t = 2.5; e.home = { x: room.w / 2, y: 240 };
    e.st = 'idle'; e.glitchT = 9; e.beamA = 0; e.beamT = 0; e.summonT = 12; e.bossId = 'mother'; e.name = '마더보드'; e.pat = 0;
    spawnPillars(2);
  },
  update(e, dt) {
    const pillars = room.props.filter(p => p.type === 'spillar' && !p.dead);
    e.invuln = pillars.length > 0;
    const thr = e.maxHp * (3 - e.phase) / 3;
    if (e.phase < 3 && e.hp <= thr) {
      e.hp = thr; e.phase++;
      spawnPillars(e.phase + 1);
      G.banner = { text: `PHASE ${e.phase}`, sub: '서버 기둥 재가동', t: 1.6, color: '#c86bff' };
      G.glitchVis = 0.6; SFX.play('glitch'); shake(14);
      e.st = 'idle'; e.t = 2;
      for (const b of BULLETS) if (b.team === 'e') b.dead = true;
    }
    const spd = e.phase === 3 ? 1.35 : 1;
    // 기둥 사격 (2페이즈 이상)
    if (e.phase >= 2) for (const p of pillars) { p.shootT -= dt; if (p.shootT <= 0) { p.shootT = rand(2.5, 3.5); eShoot(p, angTo(p.x, p.y, P.x, P.y), 240, 9, { color: '#e28bff', owner: e }); } }
    // 회전 레이저 (2페이즈 이상)
    if (e.phase >= 2) {
      e.beamT -= dt;
      if (e.beamT <= -4) e.beamT = e.phase === 3 ? 4 : 6;
      if (e.beamT < 0) {
        e.beamA += dt * 0.9;
        for (let k = 0; k < 2; k++) {
          const a = e.beamA + k * Math.PI, L = e.beamT > -0.8 ? 0 : 900;
          e['beamL' + k] = L;
          if (L && segDist(P.x, P.y, e.x, e.y, e.x + Math.cos(a) * L, e.y + Math.sin(a) * L) < P.r + 7) damagePlayer(14, e);
        }
      }
    }
    // 글리치 (3페이즈)
    if (e.phase === 3) {
      e.glitchT -= dt;
      if (e.glitchT <= 0) { e.glitchT = 9; G.glitchWarn = 0.9; SFX.play('glitch'); }
      e.summonT -= dt;
      if (e.summonT <= 0) { e.summonT = 12; for (const t of ['tele', 'mimic']) spawnEnemy(t, clamp(P.x + rand(-300, 300), 40, room.w - 40), clamp(P.y + rand(-250, 250), 40, room.h - 40), {}); }
    }
    e.t -= dt * spd;
    switch (e.st) {
      case 'idle':
        e.x = lerp(e.x, e.home.x + Math.sin(G.time * 0.7) * 120, Math.min(1, 2 * dt)); e.y = lerp(e.y, e.home.y, Math.min(1, 2 * dt));
        if (e.t <= 0) {
          const pats = e.phase === 1 ? ['dash', 'ring'] : e.phase === 2 ? ['dash', 'ring', 'spiral', 'fan'] : ['dash', 'ring', 'spiral', 'fan', 'lob'];
          if (run.oc >= 5) pats.push('wall');
          const p = pats[e.pat++ % pats.length];
          if (p === 'dash') { e.st = 'windup'; e.t = 0.7; e.lockA = angTo(e.x, e.y, P.x, P.y); SFX.play('warn'); }
          else if (p === 'ring') { eRing(e, 20 + e.phase * 4, 200, 10, rand(0, TAU), { color: '#e28bff' }); e.t = 1.8; }
          else if (p === 'spiral') { e.st = 'spiral'; e.st2 = 2.4; e.fireT = 0; }
          else if (p === 'fan') { eFan(e, angTo(e.x, e.y, P.x, P.y), 9, 1.0, 290, 10, { chill: true, color: '#9fe8ff' }); e.t = 1.6; }
          else if (p === 'lob') { for (let i = 0; i < 4; i++) lob(e, clamp(P.x + rand(-150, 150), 30, room.w - 30), clamp(P.y + rand(-150, 150), 30, room.h - 30), 1 + i * 0.12, 60, 12, true); e.t = 1.8; }
          else if (p === 'wall') { const gap = rand(100, room.w - 100); for (let x = 20; x < room.w; x += 44) if (Math.abs(x - gap) > 80) spawnBullet({ x, y: 5, vx: 0, vy: 200, team: 'e', dmg: 10, r: 7, life: 7, color: '#e28bff', noWall: true, owner: e }); e.t = 2; }
        }
        break;
      case 'windup':
        e.lockA += clamp(angDiff(e.lockA, angTo(e.x, e.y, P.x, P.y)), -0.8 * dt, 0.8 * dt);
        if (e.t <= 0) { e.st = 'dash'; e.t = 2; }
        break;
      case 'dash': {
        const nx = e.x + Math.cos(e.lockA) * 720 * dt, ny = e.y + Math.sin(e.lockA) * 720 * dt;
        if (nx < e.r || nx > room.w - e.r || ny < e.r || ny > room.h - e.r || e.t <= 0) { e.st = 'return'; e.t = 1.2; shake(10); eRing(e, 12, 180, 9, 0, { color: '#e28bff' }); SFX.play('explode'); }
        else { e.x = nx; e.y = ny; }
        break;
      }
      case 'return':
        e.x = lerp(e.x, e.home.x, Math.min(1, 3 * dt)); e.y = lerp(e.y, e.home.y, Math.min(1, 3 * dt));
        if (e.t <= 0) { e.st = 'idle'; e.t = 1.2; }
        break;
      case 'spiral':
        e.st2 -= dt; e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = 0.1; for (let k = 0; k < 4; k++) eShoot(e, G.time * 2 + k * TAU / 4, 200, 9, { color: '#bff4ff', chill: true }); }
        if (e.st2 <= 0) { e.st = 'idle'; e.t = 1.2; }
        break;
    }
  },
  onZero(e) {
    if (e.phase < 3) { e.hp = e.maxHp * (3 - e.phase) / 3; return true; }
    return false;
  },
  draw(e, c, f) {
    const pillars = room.props.filter(p => p.type === 'spillar' && !p.dead);
    for (const p of pillars) { ctx.setLineDash([10, 8]); ctx.lineDashOffset = -G.time * 60; neonLine(p.x, p.y, e.x, e.y, 'rgba(200,107,255,0.6)', 2); ctx.setLineDash([]); }
    if (e.st === 'windup') { ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.lockA) * 1400, e.y + Math.sin(e.lockA) * 1400); ctx.strokeStyle = `rgba(255,60,200,${0.3 + Math.sin(G.time * 40) * 0.2})`; ctx.lineWidth = e.r * 2; ctx.stroke(); }
    if (e.phase >= 2 && e.beamT < 0) for (let k = 0; k < 2; k++) {
      const a = e.beamA + k * Math.PI, L = e['beamL' + k] || 0;
      if (L) { neonLine(e.x, e.y, e.x + Math.cos(a) * L, e.y + Math.sin(a) * L, '#ff3df0', 6); neonLine(e.x, e.y, e.x + Math.cos(a) * L, e.y + Math.sin(a) * L, '#fff', 2); }
      else { ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(a) * 900, e.y + Math.sin(a) * 900); ctx.strokeStyle = 'rgba(255,61,240,0.3)'; ctx.lineWidth = 1; ctx.stroke(); }
    }
    bossDraw(e, c, f, () => {
      ctx.save(); ctx.translate(e.x, e.y);
      ctx.beginPath(); ctx.rect(-e.r, -e.r, e.r * 2, e.r * 2); neonShape(c, 3.5, f);
      ctx.strokeStyle = c; ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-e.r, i * 18); ctx.lineTo(e.r, i * 18); ctx.stroke(); }
      circlePath(0, 0, 16); ctx.fillStyle = e.invuln ? '#402060' : (Math.sin(G.time * 10) > 0 ? '#ff3df0' : '#fff'); ctx.fill();
      ctx.restore();
    });
    if (e.invuln) { circlePath(e.x, e.y, e.r + 26); ctx.strokeStyle = 'rgba(200,107,255,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.stroke(); ctx.setLineDash([]); }
  }
};
