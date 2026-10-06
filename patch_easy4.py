import os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))

def sub(p, pairs):
    s = open(p, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (p, a[:100])
        s = s.replace(a, b, 1)
    open(p, 'w', encoding='utf-8').write(s)

# ---------- 공통: 마더보드의 탄 수 -45%, 탄속 -15% ----------
sub('03_combat.js', [
    ("function eShoot(e, a, spd, dmg, o = {}) {\n  SFX.play('eshoot', 0.8);",
     "function isMom(e, o) { const s = (o && o.owner) || e; return !!(s && s.bossId === 'mother'); }\nfunction eShoot(e, a, spd, dmg, o = {}) {\n  SFX.play('eshoot', 0.8);\n  if (isMom(e, o)) spd *= 0.85; // 마더보드의 탄은 15% 느리다"),
    ("function eRing(e, n, spd, dmg, off = 0, o = {}) { for (let i = 0; i < n; i++)",
     "function eRing(e, n, spd, dmg, off = 0, o = {}) { if (isMom(e, o)) n = Math.max(8, Math.round(n * 0.55)); for (let i = 0; i < n; i++)"),
    ("function eFan(e, a, n, spread, spd, dmg, o = {}) { for (let i = 0; i < n; i++)",
     "function eFan(e, a, n, spread, spd, dmg, o = {}) { if (isMom(e, o)) n = Math.max(1, Math.round(n * 0.6)); for (let i = 0; i < n; i++)"),
])

sub('06_bosses.js', [
    # 속도·분노
    ("const spd = (e.phase === 3 ? 1.6 : e.phase === 2 ? 1.3 : 1.1) * (e.enraged ? 1.25 : 1);", "const spd = (e.phase === 3 ? 1.2 : e.phase === 2 ? 1.05 : 0.95) * (e.enraged ? 1.1 : 1);"),
    # 기둥 사격
    ("p.shootT = rand(1.6, 2.4); eFan(p, angTo(p.x, p.y, P.x, P.y), e.phase === 3 ? 3 : 1, 0.3, 280, 12,", "p.shootT = rand(3, 4.2); eFan(p, angTo(p.x, p.y, P.x, P.y), e.phase === 3 ? 2 : 1, 0.3, 260, 12,"),
    # 회전 레이저: 2줄기, 느리게, 경고 길게, 쉬는 시간 길게
    ("if (e.beamT <= -4) e.beamT = e.phase === 3 ? 3 : 4.5;", "if (e.beamT <= -2.6) e.beamT = e.phase === 3 ? 7 : 9;"),
    ("e.beamA += dt * (e.phase === 3 ? 1.25 : 0.95);\n        const nb = e.phase === 3 ? 3 : 2; e.nb = nb;", "e.beamA += dt * (e.phase === 3 ? 0.6 : 0.5);\n        const nb = 2; e.nb = nb;"),
    ("L = e.beamT > -0.8 ? 0 : 900;", "L = e.beamT > -1.4 ? 0 : 900;"),
    # 소환 줄이기
    ("e.summonT = 8; for (const t of ['tele', 'mimic', 'tele'])", "e.summonT = 16; for (const t of ['tele', 'mimic'])"),
    ("e.sumT2 = 13; for (const t of ['shield', 'gunner', 'gunner'])", "e.sumT2 = 22; for (const t of ['shield', 'gunner'])"),
    ("room.enemies.filter(m => !m.dead && !m.boss).length < 8) { e.summonT", "room.enemies.filter(m => !m.dead && !m.boss).length < 4) { e.summonT"),
    # 돌진
    ("if (p === 'dash') { e.st = 'windup'; e.t = 0.55;", "if (p === 'dash') { e.st = 'windup'; e.t = 0.9;"),
    ("e.dashLeft = 2; e.st = 'windup'; e.t = 0.5;", "e.dashLeft = 1; e.st = 'windup'; e.t = 0.8;"),
    ("e.dashLeft--; e.st = 'windup'; e.t = 0.45;", "e.dashLeft--; e.st = 'windup'; e.t = 0.8;"),
    ("Math.cos(e.lockA) * 860 * dt, ny = e.y + Math.sin(e.lockA) * 860 * dt;", "Math.cos(e.lockA) * 680 * dt, ny = e.y + Math.sin(e.lockA) * 680 * dt;"),
    # 눈보라, 복제 패턴
    ("for (let i = 0; i < 18; i++) spawnBullet({ x: rand(0, room.w), y: 5, vx: rand(-30, 30), vy: rand(170, 250), team: 'e', dmg: 10, r: 7, life: 7, color: '#bff4ff', chill: true, noWall: true, owner: e });",
     "for (let i = 0; i < 7; i++) spawnBullet({ x: rand(0, room.w), y: 5, vx: rand(-30, 30), vy: rand(130, 190), team: 'e', dmg: 10, r: 7, life: 7, color: '#bff4ff', chill: true, noWall: true, owner: e });"),
    ("for (let i = 0; i < 6; i++) lob(e, clamp(P.x + (i ? rand(-220, 220) : 0), 40, room.w - 40), clamp(P.y + (i ? rand(-220, 220) : 0), 40, room.h - 40), 1.0 + i * 0.13, 70, 20, false);\n            for (let k = 0; k < 3; k++) room.timers.push({ t: 0.25 + k * 0.3, fn: () => { if (!e.dead) eFan(e, angTo(e.x, e.y, P.x, P.y), 7, 0.9, 340, 12, { color: '#ffee40' }); } });",
     "for (let i = 0; i < 3; i++) lob(e, clamp(P.x + (i ? rand(-220, 220) : 0), 40, room.w - 40), clamp(P.y + (i ? rand(-220, 220) : 0), 40, room.h - 40), 1.3 + i * 0.25, 70, 20, false);\n            for (let k = 0; k < 2; k++) room.timers.push({ t: 0.4 + k * 0.5, fn: () => { if (!e.dead) eFan(e, angTo(e.x, e.y, P.x, P.y), 7, 0.9, 340, 12, { color: '#ffee40' }); } });"),
    # 레이저 격자: 2+2줄, 경고 길게, 켜진 시간 짧게
    ("for (let k = 0; k < 3; k++) {\n              const vx = clamp(P.x + (k - 1) * 170 + rand(-40, 40), 40, room.w - 40), hy = clamp(P.y + (k - 1) * 150 + rand(-40, 40), 40, room.h - 40);",
     "for (let k = 0; k < 2; k++) {\n              const vx = clamp(P.x + (k - 0.5) * 300 + rand(-40, 40), 40, room.w - 40), hy = clamp(P.y + (k - 0.5) * 260 + rand(-40, 40), 40, room.h - 40);"),
    ("w: 14, h: room.h, cycle: [0.01, 1.0, 1.3], state: 'off', ct: 0.01, life: 2.45, boss: true });", "w: 14, h: room.h, cycle: [0.01, 1.5, 0.8], state: 'off', ct: 0.01, life: 2.35, boss: true });"),
    ("w: room.w, h: 14, cycle: [0.01, 1.0, 1.3], state: 'off', ct: 0.01, life: 2.45, boss: true });", "w: room.w, h: 14, cycle: [0.01, 1.5, 0.8], state: 'off', ct: 0.01, life: 2.35, boss: true });"),
    # 포탄/벽/나선
    ("for (let i = 0; i < 6; i++) lob(e, clamp(P.x + rand(-170, 170), 30, room.w - 30), clamp(P.y + rand(-170, 170), 30, room.h - 30), 1 + i * 0.1, 62, 16, true); e.t = 1.7; }",
     "for (let i = 0; i < 3; i++) lob(e, clamp(P.x + rand(-170, 170), 30, room.w - 30), clamp(P.y + rand(-170, 170), 30, room.h - 30), 1.2 + i * 0.2, 62, 16, true); e.t = 2.2; }"),
    ("for (let x = 20; x < room.w; x += 40) if (Math.abs(x - gap) > 70) spawnBullet({ x, y: 5, vx: 0, vy: 230,", "for (let x = 20; x < room.w; x += 64) if (Math.abs(x - gap) > 110) spawnBullet({ x, y: 5, vx: 0, vy: 170,"),
    ("if (e.fireT <= 0) { e.fireT = 0.09; for (let k = 0; k < 5; k++) eShoot(e, G.time * 2.4 + k * TAU / 5, 215, 11, { color: '#bff4ff', chill: true }); }",
     "if (e.fireT <= 0) { e.fireT = 0.2; for (let k = 0; k < 3; k++) eShoot(e, G.time * 1.6 + k * TAU / 3, 200, 11, { color: '#bff4ff', chill: true }); }"),
    ("e.st = 'spiral'; e.st2 = 2.4; e.fireT = 0; }", "e.st = 'spiral'; e.st2 = 1.8; e.fireT = 0; }"),
    # 패턴 사이 간격 늘림 (idle 대기)
    ("if (e.t <= 0) { e.st = 'idle'; e.t = 1.2; }\n        break;\n      case 'spiral':", "if (e.t <= 0) { e.st = 'idle'; e.t = 2.2; }\n        break;\n      case 'spiral':"),
    ("if (e.st2 <= 0) { e.st = 'idle'; e.t = 1.2; }", "if (e.st2 <= 0) { e.st = 'idle'; e.t = 2.2; }"),
])
print('ok')
