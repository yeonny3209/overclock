// ================= 그리기 보조 =================
function circlePath(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
function polyPath(x, y, r, n, rot) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) { const a = rot + i / n * TAU; if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.closePath();
}
function neonShape(c, lw = 2.2, fill = 'rgba(12,8,22,0.9)') {
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = c; ctx.globalAlpha = 0.28; ctx.lineWidth = lw * 3.4; ctx.stroke();
  ctx.globalAlpha = 1; ctx.lineWidth = lw; ctx.stroke();
}
function neonLine(x1, y1, x2, y2, c, lw = 2) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = c; ctx.globalAlpha = 0.3; ctx.lineWidth = lw * 3; ctx.stroke();
  ctx.globalAlpha = 1; ctx.lineWidth = lw; ctx.stroke();
}
function gunBarrel(e, len, w, c, a = e.ang) {
  ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(a);
  ctx.fillStyle = c; ctx.fillRect(e.r * 0.4, -w / 2, len, w);
  ctx.restore();
}

// ================= 적 이동 보조 =================
function moveDir(e, a, spd, dt) { e.x += Math.cos(a) * spd * dt; e.y += Math.sin(a) * spd * dt; }
function moveToward(e, tx, ty, spd, dt) {
  let a = angTo(e.x, e.y, tx, ty);
  const look = e.r + 16;
  if (wallAt(e.x + Math.cos(a) * look, e.y + Math.sin(a) * look)) {
    if (!e.avoid) e.avoid = Math.random() < 0.5 ? 1 : -1;
    for (const k of [0.8, 1.6, 2.4]) { const na = a + k * e.avoid; if (!wallAt(e.x + Math.cos(na) * look, e.y + Math.sin(na) * look)) { a = na; break; } }
    e.avoidT = 0.5;
  } else if (e.avoidT > 0) e.avoidT -= dt; else e.avoid = 0;
  moveDir(e, a, spd, dt);
  e.mang = a;
}
function eTarget(e) {
  for (const a of room.allies) if (a.type === 'decoy' && d2(a.x, a.y, e.x, e.y) < 520 * 520) return a;
  if (e.objTarget && room.objProp && !room.objProp.dead) return room.objProp;
  return P;
}
function lob(e, tx, ty, time, aoe, dmg, debris) {
  spawnBullet({ x: e.x, y: e.y, team: 'e', type: 'lob', tx, ty, life: time, aoe, dmg, r: 9, color: '#ff7a3b', owner: e, noWall: true, debris });
}
function rollMuts(n) { return rshuffleM(ELITE_IDS.slice()).slice(0, n); }
function rshuffleM(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ================= 적 정의 =================
const EN = {
  grunt: {
    hp: 20, r: 13, spd: 115, color: '#ff5a3a', contact: 10, coin: 1,
    update(e, dt) { const t = eTarget(e); moveToward(e, t.x, t.y, e.spd * e.sm, dt); },
    draw(e, c, f) {
      const a = e.mang || 0; ctx.beginPath();
      ctx.moveTo(e.x + Math.cos(a) * e.r * 1.35, e.y + Math.sin(a) * e.r * 1.35);
      ctx.lineTo(e.x + Math.cos(a + 2.45) * e.r, e.y + Math.sin(a + 2.45) * e.r);
      ctx.lineTo(e.x + Math.cos(a - 2.45) * e.r, e.y + Math.sin(a - 2.45) * e.r);
      ctx.closePath(); neonShape(c, 2.2, f);
    }
  },
  gunner: {
    hp: 25, r: 13, spd: 65, color: '#ff9a3a', contact: 6, coin: 2,
    init(e) { e.strafe = Math.random() < 0.5 ? 1 : -1; e.strafeT = rand(1, 2); e.cd = rand(1, 2.2); },
    update(e, dt) {
      const t = eTarget(e), d = dist(e.x, e.y, t.x, t.y);
      e.ang = angTo(e.x, e.y, t.x, t.y);
      const a = d > 360 ? e.ang : d < 230 ? e.ang + Math.PI : e.ang + Math.PI / 2 * e.strafe;
      moveToward(e, e.x + Math.cos(a) * 50, e.y + Math.sin(a) * 50, e.spd * e.sm, dt);
      e.strafeT -= dt; if (e.strafeT <= 0) { e.strafe *= -1; e.strafeT = rand(1, 2.5); }
      e.cd -= dt * e.atkMult;
      if (e.cd <= 0 && d < 650) { e.cd = 2.3; if (run.zone >= 2) eFan(e, e.ang, 3, 0.35, 230, 10); else eShoot(e, e.ang, 230, 10); }
    },
    draw(e, c, f) {
      gunBarrel(e, 14, 5, c);
      polyPath(e.x, e.y, e.r * 1.1, 4, e.ang + Math.PI / 4); neonShape(c, 2.2, f);
      if (e.cd < 0.4) { circlePath(e.x, e.y, 4); ctx.fillStyle = '#ffdd88'; ctx.fill(); }
    }
  },
  bomber: {
    hp: 15, r: 12, spd: 185, color: '#ff3b6b', contact: 0, coin: 1,
    update(e, dt) {
      if (e.st === 'fuse') { e.t -= dt; if (e.t <= 0) { e.noReward = true; killEnemy(e, { self: true }); } return; }
      const t = eTarget(e); moveToward(e, t.x, t.y, e.spd * e.sm, dt);
      if (d2(e.x, e.y, t.x, t.y) < 62 * 62) { e.st = 'fuse'; e.t = 0.55; SFX.play('warn'); }
    },
    death(e, o) {
      if (o.self) explode(e.x, e.y, 85, 22, { team: 'e', friendly: 0.6, owner: e });
      else explode(e.x, e.y, 75, 20, {});
    },
    draw(e, c, f) {
      const fuse = e.st === 'fuse', bl = fuse ? (Math.sin(G.time * 50) > 0) : (Math.sin(G.time * 8) > 0);
      circlePath(e.x, e.y, e.r * (fuse ? 1 + (0.55 - e.t) * 0.8 : 1)); neonShape(c, 2.2, f);
      circlePath(e.x, e.y, e.r * 0.45); ctx.fillStyle = bl ? '#fff' : c; ctx.fill();
      if (fuse) { circlePath(e.x, e.y, 85); ctx.strokeStyle = 'rgba(255,60,90,0.35)'; ctx.lineWidth = 2; ctx.stroke(); }
    }
  },
  tank: {
    hp: 150, r: 26, spd: 38, color: '#e0904a', contact: 15, coin: 4, heavy: true,
    update(e, dt) {
      let cx = 0, cy = 0, n = 0;
      for (const o of room.enemies) { if (o === e || o.dead || o.type === 'tank' || o.spawning) continue; if (d2(o.x, o.y, e.x, e.y) < 600 * 600) { cx += o.x; cy += o.y; n++; } }
      let tx = P.x, ty = P.y;
      if (n > 0) { cx /= n; cy /= n; const a = angTo(cx, cy, P.x, P.y); tx = cx + Math.cos(a) * 110; ty = cy + Math.sin(a) * 110; }
      const t = eTarget(e); if (t !== P) { tx = t.x; ty = t.y; }
      const far = d2(e.x, e.y, tx, ty) > 200 * 200;
      moveToward(e, tx, ty, e.spd * e.sm * (n > 0 && far ? 2 : 1), dt);
      e.ang = angTo(e.x, e.y, P.x, P.y);
    },
    draw(e, c, f) {
      polyPath(e.x, e.y, e.r, 6, e.ang); neonShape(c, 3.2, f);
      polyPath(e.x, e.y, e.r * 0.55, 6, e.ang); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke();
    }
  },
  splitter: {
    hp: 40, r: 16, spd: 90, color: '#7cff6a', contact: 10, coin: 2,
    update(e, dt) { e.t += dt; const t = eTarget(e); const a = angTo(e.x, e.y, t.x, t.y) + Math.sin(e.t * 3) * 0.5; moveToward(e, e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40, e.spd * e.sm, dt); },
    death(e) { if (e.clone) return; for (const k of [-1, 1]) { const m = spawnEnemy('mini', e.x + k * 10, e.y, { instant: true }); m.kx = k * 220; m.ky = rand(-100, 100); } },
    draw(e, c, f) {
      const w = Math.sin(G.time * 6 + e.x) * 2;
      circlePath(e.x, e.y, e.r + w); neonShape(c, 2.2, f);
      circlePath(e.x - 5, e.y, 5); circlePath(e.x - 5, e.y, 5); ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.stroke();
      circlePath(e.x + 5, e.y, 5); ctx.stroke();
    }
  },
  mini: {
    hp: 12, r: 9, spd: 145, color: '#b0ff9a', contact: 6, coin: 0.5,
    update(e, dt) { const t = eTarget(e); moveToward(e, t.x, t.y, e.spd * e.sm, dt); },
    draw(e, c, f) { circlePath(e.x, e.y, e.r); neonShape(c, 2, f); }
  },
  frostdrone: {
    hp: 30, r: 12, spd: 165, color: '#7fe8ff', contact: 8, coin: 2, flying: true,
    init(e) { e.orb = rand(0, TAU); e.dir = Math.random() < 0.5 ? 1 : -1; e.dropT = 0.5; },
    update(e, dt) {
      e.orb += dt * 1.1 * e.dir;
      const t = eTarget(e);
      moveToward(e, t.x + Math.cos(e.orb) * 170, t.y + Math.sin(e.orb) * 170, e.spd * e.sm, dt);
      e.dropT -= dt;
      if (e.dropT <= 0) { e.dropT = 0.55; if (room.hazards.length < 110) addHazard({ type: 'frost', x: e.x, y: e.y, r: 32, life: 5 }); }
    },
    draw(e, c, f) {
      polyPath(e.x, e.y, e.r * 1.2, 4, 0); neonShape(c, 2, f);
      for (let i = 0; i < 4; i++) { const a = G.time * 14 + i * Math.PI / 2; neonLine(e.x, e.y, e.x + Math.cos(a) * e.r * 1.6, e.y + Math.sin(a) * e.r * 1.6, c, 1.2); }
    }
  },
  summoner: {
    hp: 50, r: 15, spd: 50, color: '#c86bff', contact: 6, coin: 3,
    init(e) { e.cd = 2.5; e.summons = []; },
    update(e, dt) {
      const d = dist(e.x, e.y, P.x, P.y), a = angTo(e.x, e.y, P.x, P.y);
      if (e.st === 'cast') {
        e.t -= dt;
        if (e.t <= 0) {
          e.st = '';
          for (let i = 0; i < 2; i++) {
            const sx = clamp(e.x + rand(-80, 80), 30, room.w - 30), sy = clamp(e.y + rand(-80, 80), 30, room.h - 30);
            if (!wallAt(sx, sy)) e.summons.push(spawnEnemy('grunt', sx, sy, {}));
          }
        }
        return;
      }
      const ma = d < 380 ? a + Math.PI : d > 520 ? a : a + Math.PI / 2;
      moveToward(e, e.x + Math.cos(ma) * 50, e.y + Math.sin(ma) * 50, e.spd * e.sm, dt);
      e.summons = e.summons.filter(s => !s.dead);
      e.cd -= dt * e.atkMult;
      if (e.cd <= 0 && e.summons.length < 4) { e.cd = 4.5; e.st = 'cast'; e.t = 0.8; }
    },
    draw(e, c, f) {
      polyPath(e.x, e.y, e.r * 1.2, 3, -Math.PI / 2); neonShape(c, 2.2, f);
      for (let i = 0; i < 3; i++) { const a = G.time * 3 + i * TAU / 3; circlePath(e.x + Math.cos(a) * 22, e.y + Math.sin(a) * 22, 3); ctx.fillStyle = c; ctx.fill(); }
      if (e.st === 'cast') { circlePath(e.x, e.y, 30 + (0.8 - e.t) * 30); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke(); }
    }
  },
  shield: {
    hp: 80, r: 17, spd: 55, color: '#6aa8ff', contact: 14, coin: 3,
    init(e) { e.ang = angTo(e.x, e.y, P.x, P.y); e.cd = 2; },
    update(e, dt) {
      const t = eTarget(e), ta = angTo(e.x, e.y, t.x, t.y);
      if (e.dashT > 0) { e.dashT -= dt; moveDir(e, e.ang, 420, dt); return; }
      e.ang += clamp(angDiff(e.ang, ta), -2.1 * dt * e.sm, 2.1 * dt * e.sm);
      moveToward(e, t.x, t.y, e.spd * e.sm, dt);
      e.cd -= dt * e.atkMult;
      if (e.cd <= 0 && d2(e.x, e.y, t.x, t.y) < 160 * 160) { e.cd = 2.6; e.dashT = 0.35; SFX.play('warn'); }
    },
    blocks(e, b) { return Math.abs(angDiff(e.ang, angTo(e.x, e.y, b.x, b.y))) < 1.0; },
    draw(e, c, f) {
      circlePath(e.x, e.y, e.r * 0.85); neonShape(c, 2, f);
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 6, e.ang - 1.0, e.ang + 1.0);
      ctx.strokeStyle = '#bfe0ff'; ctx.globalAlpha = 0.35; ctx.lineWidth = 12; ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 5; ctx.stroke();
    }
  },
  snake: {
    hp: 60, r: 13, spd: 125, color: '#ffe14d', contact: 12, coin: 4,
    init(e) { e.trail = []; e.segs = []; for (let i = 0; i < 7; i++) e.segs.push({ x: e.x, y: e.y, r: 10 }); },
    update(e, dt) { e.t += dt; const t = eTarget(e); const a = angTo(e.x, e.y, t.x, t.y) + Math.sin(e.t * 4) * 0.7; moveToward(e, e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40, e.spd * e.sm, dt); },
    post(e) {
      const last = e.trail[0];
      if (!last || d2(last.x, last.y, e.x, e.y) > 36) { e.trail.unshift({ x: e.x, y: e.y }); if (e.trail.length > 30) e.trail.pop(); }
      for (let i = 0; i < e.segs.length; i++) {
        const p = e.trail[Math.min(e.trail.length - 1, (i + 1) * 3)] || e;
        const s = e.segs[i]; s.x = p.x; s.y = p.y;
        if (!P.dead && d2(s.x, s.y, P.x, P.y) < (s.r + P.r) ** 2) damagePlayer(10, e);
      }
    },
    death(e) { for (const s of e.segs) burst(s.x, s.y, '#ffe14d', 6, 150, 0.4, 2); },
    draw(e, c, f) {
      for (let i = e.segs.length - 1; i >= 0; i--) { const s = e.segs[i]; circlePath(s.x, s.y, s.r); neonShape('#c9a820', 1.8, 'rgba(40,34,8,0.9)'); }
      const a = e.mang || 0;
      polyPath(e.x, e.y, e.r * 1.2, 3, a); neonShape(c, 2.4, f);
      if (Math.random() < 0.2) addBolt(e.x, e.y, e.segs[0].x, e.segs[0].y, '#fff04d', 0.05);
    }
  },
  tele: {
    hp: 35, r: 13, spd: 70, color: '#ff3df0', contact: 8, coin: 3,
    init(e) { e.st = 'idle'; e.t = rand(1, 2); },
    update(e, dt) {
      e.t -= dt * e.atkMult;
      if (e.st === 'idle') {
        moveToward(e, P.x, P.y, e.spd * e.sm, dt);
        if (e.t <= 0) {
          let dx = clamp(P.x - Math.cos(P.ang) * 130, 30, room.w - 30), dy = clamp(P.y - Math.sin(P.ang) * 130, 30, room.h - 30);
          if (wallAt(dx, dy)) { dx = clamp(P.x + rand(-130, 130), 30, room.w - 30); dy = clamp(P.y + rand(-130, 130), 30, room.h - 30); }
          if (wallAt(dx, dy)) { e.t = 1; return; }
          e.dx = dx; e.dy = dy; e.st = 'warn'; e.t = 0.55; SFX.play('warn');
        }
      } else if (e.st === 'warn') {
        if (e.t <= 0) { burst(e.x, e.y, e.color, 12, 200, 0.3, 3); e.x = e.dx; e.y = e.dy; burst(e.x, e.y, e.color, 12, 200, 0.3, 3); SFX.play('tele'); e.st = 'strike'; e.t = 0.35; }
      } else if (e.st === 'strike') {
        e.ang = angTo(e.x, e.y, P.x, P.y);
        if (e.t <= 0) { eFan(e, e.ang, 5, 0.8, 280, 10); e.st = 'idle'; e.t = 2.4; }
      }
    },
    draw(e, c, f) {
      const fl = e.st === 'strike' ? 1.3 : 1;
      polyPath(e.x, e.y, e.r * 1.25 * fl, 4, G.time * 3); neonShape(c, 2.2, f);
      polyPath(e.x, e.y, e.r * 0.6, 4, -G.time * 3); ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.stroke();
      if (e.st === 'warn') {
        const k = 1 - e.t / 0.55;
        circlePath(e.dx, e.dy, 26 - k * 10); ctx.strokeStyle = `rgba(255,61,240,${0.4 + k * 0.6})`; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = 'rgba(255,61,240,0.2)'; ctx.fill();
        ctx.font = `bold 20px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ff3df0'; ctx.fillText('!', e.dx, e.dy + 7);
      }
    }
  },
  sturret: {
    hp: 70, r: 17, spd: 0, color: '#ff4040', contact: 0, coin: 3, heavy: true,
    init(e) { e.st = 'aim'; e.t = 1.6; e.ang = angTo(e.x, e.y, P.x, P.y); e.laser = 0; },
    update(e, dt) {
      e.t -= dt * e.atkMult;
      const ta = angTo(e.x, e.y, P.x, P.y);
      if (e.st === 'aim') { e.ang += clamp(angDiff(e.ang, ta), -1.6 * dt * e.sm, 1.6 * dt * e.sm); if (e.t <= 0) { e.st = 'lock'; e.t = 0.45; SFX.play('warn'); } }
      else if (e.st === 'lock') { if (e.t <= 0) { eShoot(e, e.ang, 1150, 22, { r: 7, color: '#ff2020' }); SFX.play('laser'); e.st = 'cool'; e.t = 1.3; } }
      else if (e.st === 'cool') { if (e.t <= 0) { e.st = 'aim'; e.t = 1.6; } }
      e.laser = rayWalls(e.x, e.y, Math.cos(e.ang), Math.sin(e.ang), 1600);
    },
    draw(e, c, f) {
      if (e.st !== 'cool') {
        const lk = e.st === 'lock';
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.ang) * e.laser, e.y + Math.sin(e.ang) * e.laser);
        ctx.strokeStyle = lk ? (Math.sin(G.time * 60) > 0 ? '#ff2020' : '#ffffff') : 'rgba(255,40,40,0.45)'; ctx.lineWidth = lk ? 3 : 1; ctx.stroke();
      }
      polyPath(e.x, e.y, e.r, 8, 0); neonShape(c, 2.4, f);
      gunBarrel(e, 20, 7, c);
    }
  },
  mimic: {
    hp: 60, r: 13, spd: 95, color: '#b48cff', contact: 8, coin: 4,
    init(e) { e.wid = run.lastWeapon || CHARS[run.char].weapon; e.cd = 1.2; e.laser = 0; },
    update(e, dt) {
      const t = eTarget(e), d = dist(e.x, e.y, t.x, t.y);
      e.ang = angTo(e.x, e.y, t.x, t.y);
      if (e.aimT > 0) {
        e.aimT -= dt; e.laser = rayWalls(e.x, e.y, Math.cos(e.lockA), Math.sin(e.lockA), 1600);
        if (e.aimT <= 0) { eShoot(e, e.lockA, 1000, 20, { r: 6 }); SFX.play('laser'); }
        return;
      }
      const pref = { flamer: 130, shotgun: 170, sniper: 450, tesla: 260, grenade: 320 }[e.wid] || 280;
      const a = d > pref + 40 ? e.ang : d < pref - 40 ? e.ang + Math.PI : e.ang + Math.PI / 2;
      moveToward(e, e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40, e.spd * e.sm, dt);
      if (e.burst > 0) { e.burstT -= dt; if (e.burstT <= 0) { e.burst--; e.burstT = 0.08; eShoot(e, e.ang + rand(-0.12, 0.12), 380, 6); } }
      if (e.pullT > 0) {
        e.pullT -= dt; const dd = Math.max(1, d);
        if (dd < 520) { P.kx += (e.x - P.x) / dd * 1100 * dt; P.ky += (e.y - P.y) / dd * 1100 * dt; }
        if (Math.random() < 0.5) { const pa = rand(0, TAU); part({ x: e.x + Math.cos(pa) * 150, y: e.y + Math.sin(pa) * 150, vx: -Math.cos(pa) * 300, vy: -Math.sin(pa) * 300, life: 0.45, size: 2.5, color: '#c77dff', kind: 'dot' }); }
      }
      e.cd -= dt * e.atkMult;
      if (e.cd > 0) return;
      switch (e.wid) {
        case 'pistol': e.cd = 1.0; eShoot(e, e.ang, 380, 9); break;
        case 'smg': e.cd = 1.9; e.burst = 5; e.burstT = 0; break;
        case 'shotgun': e.cd = 1.9; if (d < 400) eFan(e, e.ang, 5, 0.6, 330, 7); break;
        case 'sniper': e.cd = 2.8; e.aimT = 0.8; e.lockA = e.ang; SFX.play('warn'); break;
        case 'grenade': e.cd = 2.3; lob(e, t.x, t.y, 0.9, 70, 16); break;
        case 'flamer': if (d < 220) { e.cd = 0.07; eShoot(e, e.ang + rand(-0.2, 0.2), 260, 3, { r: 7, life: 0.55, color: '#ff5a2a' }); } else e.cd = 0.3; break;
        case 'tesla': e.cd = 2; eShoot(e, e.ang, 170, 12, { r: 10, color: '#ffee40', life: 4 }); break;
        case 'cryo': e.cd = 0.9; eShoot(e, e.ang, 300, 7, { chill: true, color: '#8fe8ff' }); break;
        case 'boomerang': e.cd = 2; eShoot(e, e.ang, 500, 10, { type: 'boomerang', life: 0.55, r: 9, color: '#ff6a8a' }); break;
        case 'blackhole': e.cd = 4.5; e.pullT = 1.6; SFX.play('bhole'); break;
        default: e.cd = 1; eShoot(e, e.ang, 380, 9);
      }
    },
    draw(e, c, f) {
      if (e.aimT > 0) { ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.lockA) * e.laser, e.y + Math.sin(e.lockA) * e.laser); ctx.strokeStyle = Math.sin(G.time * 50) > 0 ? '#ff2020' : 'rgba(255,40,40,0.4)'; ctx.lineWidth = 2; ctx.stroke(); }
      gunBarrel(e, 16, 5, c);
      circlePath(e.x, e.y, e.r); neonShape(c, 2.2, f);
      ctx.font = `bold 12px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = c; ctx.fillText('?', e.x, e.y + 4);
      ctx.font = `10px ${FONT2}`; ctx.fillStyle = 'rgba(200,180,255,0.8)'; ctx.fillText(WEAPONS[e.wid] ? WEAPONS[e.wid].name : '', e.x, e.y + e.r + 22);
    }
  }
};

// ================= 적 생성 =================
function spawnEnemy(type, x, y, o = {}) {
  const def = EN[type];
  const e = {
    type, x, y, vx: 0, vy: 0, kx: 0, ky: 0, r: def.r, hp: def.hp * G.eHp * (o.hpMult || 1), maxHp: 0, spd: def.spd * G.eSpd, color: def.color,
    contact: def.contact || 0, t: 0, st: '', cd: rand(0.8, 1.8), ang: 0, mang: 0, flash: 0, dead: false, muts: null, elite: null,
    burnT: 0, burnDps: 0, burnStacks: 0, burnTick: 0, shockT: 0, chill: 0, chillT: 0, frozenT: 0,
    alert: 0, heavy: !!def.heavy, boss: !!def.boss, spawning: !o.instant, spawnT: o.instant ? 0 : 0.75,
    atkMult: 1, sm: 1, heldCoins: 0, noReward: !!o.noReward, hzT: 0, objHitT: 0, clone: !!o.clone, objTarget: !!o.objTarget, flying: !!def.flying
  };
  e.maxHp = e.hp;
  if (o.muts && o.muts.length) {
    e.muts = o.muts; e.elite = o.muts[0];
    e.r *= 1.35; e.hp *= 2.6; e.maxHp = e.hp; e.contact *= 1.3;
    if (e.muts.includes('barrier')) e.barrier = e.maxHp * 0.5;
    e.cloneT = 5; e.refT = 3; e.toxT = 0; e.clones = 0;
  }
  if (run && run.weapons.length && curW().mods.includes('silencer')) e.alert = 2.5;
  if (def.init) def.init(e, o);
  room.enemies.push(e);
  if (!o.instant && (type === 'tele' || type === 'mimic')) SFX.play('warn');
  if (!e.boss) codex('enemy', type);
  return e;
}

// ================= 적 갱신 =================
function updateEnemies(dt) {
  const ens = room.enemies;
  for (let i = 0; i < ens.length; i++) {
    const e = ens[i];
    if (e.dead) continue;
    if (e.spawning) { e.spawnT -= dt; if (e.spawnT <= 0) e.spawning = false; continue; }
    let edt = dt;
    if (inSlowField(e.x, e.y)) edt *= 0.3;
    e.flash -= dt;
    // 상태 이상
    if (e.burnT > 0) {
      e.burnT -= edt; e.burnTick -= edt;
      if (e.burnTick <= 0) { e.burnTick = 0.5; damageEnemy(e, e.burnDps * 0.5 * (e.burnStacks || 1), { quiet: true }); if (e.dead) continue; }
      if (Math.random() < 0.3) part({ x: e.x + rand(-e.r, e.r), y: e.y + rand(-e.r, e.r) * 0.5, vx: 0, vy: -rand(30, 70), life: 0.4, size: rand(2, 4), color: pick(['#ff6a1a', '#ffb347']), kind: 'dot' });
    }
    if (e.shockT > 0) { e.shockT -= edt; if (Math.random() < 0.08) addBolt(e.x + rand(-e.r, e.r), e.y + rand(-e.r, e.r), e.x + rand(-e.r, e.r), e.y + rand(-e.r, e.r), '#fff04d', 0.06); }
    if (e.chillT > 0) { e.chillT -= edt; if (e.chillT <= 0) e.chill = 0; }
    const hzSlow = e.boss ? 1 : enemyHazards(e, edt);
    if (e.dead) continue;
    e.sm = ((e.chill > 0 || e.chillT > 0) ? 1 - BS.chillSlow : 1) * hzSlow;
    if (e.muts) { if (e.muts.includes('haste')) e.sm *= 2; updateElite(e, edt); }
    e.atkMult = e.muts && e.muts.includes('rage') && e.hp < e.maxHp * 0.5 ? 2 : 1;
    if (e.frozenT > 0) {
      e.frozenT -= edt;
    } else if (e.alert > 0) {
      e.alert -= edt;
      if (d2(e.x, e.y, P.x, P.y) < 220 * 220) e.alert = 0;
      e.t += edt; moveDir(e, Math.sin(e.t * 0.7 + e.x) * TAU, e.spd * 0.25, edt);
    } else {
      if (e.bounty) bountyAI(e, edt); else EN[e.type].update(e, edt);
      if (e.dead) continue;
    }
    // 넉백
    e.x += e.kx * edt; e.y += e.ky * edt;
    e.kx -= e.kx * Math.min(1, 9 * edt); e.ky -= e.ky * Math.min(1, 9 * edt);
    if (!e.flying) pushOutWalls(e);
    e.x = clamp(e.x, e.r, room.w - e.r); e.y = clamp(e.y, e.r, room.h - e.r);
    if (EN[e.type].post) EN[e.type].post(e, edt);
    // 접촉 피해
    if (e.contact && !P.dead && e.frozenT <= 0 && d2(e.x, e.y, P.x, P.y) < (e.r + P.r - 2) ** 2) damagePlayer(e.contact, e);
    if (room.objProp && !room.objProp.dead && e.contact && d2(e.x, e.y, room.objProp.x, room.objProp.y) < (e.r + room.objProp.r) ** 2) {
      e.objHitT -= edt; if (e.objHitT <= 0) { e.objHitT = 0.6; hitAllyProp(room.objProp, e.contact); }
    }
  }
  // 겹침 밀어내기
  for (let i = 0; i < ens.length; i++) {
    const a = ens[i]; if (a.dead || a.spawning) continue;
    for (let j = i + 1; j < ens.length; j++) {
      const b = ens[j]; if (b.dead || b.spawning) continue;
      const dx = b.x - a.x, dy = b.y - a.y, mr = a.r + b.r, dd = dx * dx + dy * dy;
      if (dd < mr * mr && dd > 0.01) {
        const d = Math.sqrt(dd), push = (mr - d) / 2, nx = dx / d, ny = dy / d;
        const aw = a.heavy || a.boss ? 0 : 1, bw = b.heavy || b.boss ? 0 : 1, tw = aw + bw;
        if (tw === 0) continue;
        a.x -= nx * push * 2 * aw / tw; a.y -= ny * push * 2 * aw / tw;
        b.x += nx * push * 2 * bw / tw; b.y += ny * push * 2 * bw / tw;
      }
    }
  }
  for (let i = ens.length - 1; i >= 0; i--) if (ens[i].dead) ens.splice(i, 1);
}

function updateElite(e, dt) {
  const m = e.muts;
  if (m.includes('clone') && !e.clone) {
    e.cloneT -= dt;
    if (e.cloneT <= 0) {
      e.cloneT = 5;
      if (e.clones < 4 && room.enemies.length < 90) {
        const c = spawnEnemy(e.type, clamp(e.x + rand(-30, 30), 20, room.w - 20), clamp(e.y + rand(-30, 30), 20, room.h - 20), { clone: true, noReward: true, hpMult: 0.3 });
        e.clones++; c.color = '#9dff80';
      }
    }
  }
  if (m.includes('reflect')) { e.refT -= dt; if (e.refT <= 0) e.refT = 3; e.reflectOn = e.refT < 1; }
  if (m.includes('toxic')) { e.toxT -= dt; if (e.toxT <= 0) { e.toxT = 0.35; if (room.hazards.length < 120) addHazard({ type: 'toxic', x: e.x, y: e.y, r: 24, life: 4 }); } }
}

function enemyHazards(e, dt) {
  e.hzT -= dt;
  let slow = 1;
  const tick = e.hzT <= 0;
  for (const h of room.hazards) {
    if (h.type === 'slick' || h.type === 'frost' || h.type === 'toxic') continue;
    if (!pointInHazard(h, e.x, e.y)) continue;
    switch (h.type) {
      case 'fire': if (tick) applyStatus(e, 'fire', {}); break;
      case 'water': if (h.elecT > 0 && tick) { applyStatus(e, 'elec', { noChain: true }); damageEnemy(e, 6, { quiet: true }); } break;
      case 'elecfloor': if (h.state === 'on' && tick) { damageEnemy(e, 15, { quiet: true }); applyStatus(e, 'elec', { noChain: true }); } break;
      case 'laser': if (h.state === 'on' && tick) damageEnemy(e, 20, { quiet: true }); break;
      case 'steam': if (h.on && tick) applyStatus(e, 'ice', {}); break;
      case 'frostfloor': if (tick) applyStatus(e, 'ice', {}); break;
      case 'conveyor': if (!e.heavy) { e.x += h.dx * 140 * dt; e.y += h.dy * 140 * dt; } break;
      case 'oil': slow = 0.85; break;
    }
    if (e.dead) return 1;
  }
  if (tick) e.hzT = 0.5;
  return slow;
}
