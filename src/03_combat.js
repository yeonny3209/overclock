// ================= 전역 상태 =================
const G = {
  screen: 'title', paused: false, time: 0, hitstop: 0, slowmo: 0, shakeAmt: 0, flash: 0, flashColor: '255,40,60',
  reactTexts: [], lastReact: {}, bossIntro: null, glitchT: 0, glitchWarn: 0, mode: 'campaign', texts: [], bolts: [], banner: null
};
let run = null;   // 한 판의 상태
let room = null;  // 현재 전투 방
let P = null;     // 플레이어 개체
let BS = null;    // 빌드 수치 (강화/저주/세트로부터 계산)
const cam = { x: 0, y: 0 };

// ================= 빌드 계산 =================
function recomputeBuild() {
  const u = id => (run && run.ups[id]) || 0;
  const c = run ? run.curses : {};
  const tags = { fire: 0, elec: 0, ice: 0, exp: 0, bullet: 0, surv: 0 };
  if (run) for (const id in run.ups) { const up = UPG[id]; if (up && tags[up.tag] !== undefined) tags[up.tag] += run.ups[id]; }
  if (run) run.tags = tags;
  const set = (t, n) => tags[t] >= n;
  const tot = SET_TAGS.reduce((a, t) => a + tags[t], 0), kinds = SET_TAGS.filter(t => tags[t] > 0).length;
  const prism = tot >= 9 && kinds >= 4;
  if (run) run.prism = prism;
  BS = {
    prism,
    tags,
    dmgMult: (1 + 0.15 * u('sharp')) * (u('bigcal') ? 1.1 : 1) * (c.glass ? 1.5 : 1) * (set('bullet', 3) ? 1.1 : 1) * (set('bullet', 7) ? 1.25 : 1) * (prism ? 1.8 : 1),
    rateMult: (1 + 0.15 * u('rapid')) * (c.frenzy ? 1.4 : 1),
    reloadMult: 1 / (1 + 0.3 * u('quickhand')),
    crit: 0.1 * u('critup') + (prism ? 0.15 : 0), pierce: u('pierce') + (set('bullet', 7) ? 2 : 0),
    bulletSpd: set('bullet', 3) ? 1.6 : 1, bulletSize: u('bigcal') ? 1.4 : 1,
    spreadMult: c.frenzy ? 2.5 : 1, spreadAdd: c.frenzy ? 0.08 : 0, twin: u('twin') > 0,
    burnChance: 0.2 * u('ignite'), shockChance: 0.15 * u('conductor'), chillChance: 0.2 * u('frosttip'), burstChance: 0.1 * u('burst'),
    burnDmg: (1 + 0.5 * u('kindling')) * (set('fire', 7) ? 2 : 1), burnDur: 3 + 2 * u('heat'), incinerate: 0.2 * u('incinerate'),
    spreadfire: u('spreadfire') > 0, firetrail: u('firetrail') > 0, flamearmor: u('flamearmor') > 0,
    static: u('static') > 0, transfer: 0.5 + 0.3 * u('highvolt'), chargecoil: u('chargecoil'), overcurrent: 0.15 * u('overcurrent'),
    thunder: u('thunder') > 0, discharge: u('discharge') > 0,
    chillDur: 1 + 0.5 * u('frostbite'), chillSlow: 0.3 + 0.15 * u('chill'), shards: u('shards') > 0, permafrost: u('permafrost'), frostarmor: u('frostarmor') > 0,
    chaindet: u('chaindet'), expDmg: (1 + 0.3 * u('hiexp')) * (set('exp', 7) ? 1.5 : 1), expRadius: (1 + 0.15 * u('shockwave')) * (set('exp', 3) ? 1.45 : 1) * (prism ? 1.3 : 1),
    expKnock: 1 + 0.5 * u('shockwave'), blastroll: u('blastroll') > 0, safety: u('safety') > 0,
    vamp: u('vamp'), regen: 8 * u('regen'), evasion: u('evasion') ? 1.5 : 1, medkit: u('medkit') > 0, plating: 0.1 * u('plating'),
    magnet: u('magnet') ? 2 : 1, afterimage: u('afterimage') > 0, cdMult: Math.pow(0.8, u('cooldown')), moveMult: (1 + 0.1 * u('swift')) * (prism ? 1.15 : 1),
    comboTime: 3 + 2 * u('combokeep'), invest: 8 * u('invest'), lucky: 0.2 * u('lucky'),
    coinMult: c.avarice ? 2 : 1, enemyMult: c.avarice ? 1.25 : 1, berserk: !!c.berserk, noHeal: !!c.berserk,
    fire3: set('fire', 3), fire5: set('fire', 5), elec3: set('elec', 3), elec5: set('elec', 5), ice3: set('ice', 3), ice5: set('ice', 5),
    exp3: set('exp', 3), exp5: set('exp', 5), bullet3: set('bullet', 3), bullet5: set('bullet', 5), surv3: set('surv', 3), surv5: set('surv', 5),
    fire7: set('fire', 7), elec7: set('elec', 7), ice7: set('ice', 7), exp7: set('exp', 7), bullet7: set('bullet', 7), surv7: set('surv', 7)
  };
  if (run) {
    const old = run.maxHp || 0;
    let mh = run.baseMaxHp + 15 * u('armor') + (BS.surv3 ? 40 : 0);
    if (c.glass) mh *= 0.7;
    if (run.oc >= 9) mh *= 0.85;
    run.maxHp = Math.max(10, Math.round(mh));
    if (old && run.maxHp > old) run.hp += run.maxHp - old;
    run.hp = Math.min(run.hp, run.maxHp);
  }
}
function changeMaxHp(d) { run.baseMaxHp = Math.max(30, run.baseMaxHp + d); recomputeBuild(); run.hp = Math.min(run.hp, run.maxHp); }
function healRun(n, silent) {
  if (!run || BS.noHeal) { if (!silent && run) toast('광전사: 회복 불가'); return 0; }
  const before = run.hp; run.hp = Math.min(run.maxHp, run.hp + n);
  const h = run.hp - before;
  if (h > 0 && P && G.screen === 'combat') { floatText(P.x, P.y - 26, '+' + Math.round(h), '#6dff8a', 18); SFX.play('heal'); }
  return h;
}
function hurtRun(n) { run.hp = Math.max(1, run.hp - n); }
function addUpgrade(id) { run.ups[id] = (run.ups[id] || 0) + 1; recomputeBuild(); }
function applyCurse(id) { run.curses[id] = 1; recomputeBuild(); }

// ================= 무기 인스턴스 =================
function makeWeapon(id, grade = 0) {
  const w = { id, grade, mods: new Array(GRADES[grade].slots).fill(null), bonus: null, ammo: 0, cd: 0, reloadT: 0, shots: 0, first: false };
  if (grade >= 1) w.bonus = rp(Object.keys(RARE_BONUS));
  w.ammo = wStats(w).mag;
  return w;
}
function gradeUp(w) {
  if (w.grade >= 2) return false;
  w.grade++; w.mods.push(null);
  if (!w.bonus) w.bonus = rp(Object.keys(RARE_BONUS));
  w.ammo = wStats(w).mag;
  return true;
}
function weaponName(w) { return w.grade === 2 ? `${LEGEND[w.id].name}(${WEAPONS[w.id].name})` : `${GRADES[w.grade].name} ${WEAPONS[w.id].name}`; }
function randomWeaponId(exclude) { const pool = weaponPool().filter(id => id !== exclude); return rp(pool); }
function rollGrade(w = [60, 32, 8]) { const r = RNG() * (w[0] + w[1] + w[2]); return r < w[0] ? 0 : r < w[0] + w[1] ? 1 : 2; }
function curW() { return run.weapons[run.cur]; }

function wStats(w) {
  const b = WEAPONS[w.id]; const s = Object.assign({}, b);
  for (const m of w.mods) if (m && MODS[m].conv) s.tag = MODS[m].conv;
  let dm = 1, rm = 1, mm = 1, rl = 1, sp = 1, crit = 0.05;
  switch (w.bonus) {
    case 'dmg': dm *= 1.15; break; case 'rate': rm *= 1.15; break; case 'mag': mm *= 1.4; break;
    case 'reload': rl *= 0.7; break; case 'crit': crit += 0.1; break; case 'spd': sp *= 1.25; break;
  }
  dm *= [1, 1.12, 1.25][w.grade];
  if (w.mods.includes('extmag')) mm *= 1.5;
  if (w.mods.includes('silencer')) dm *= 0.9;
  dm *= BS.dmgMult; rm *= BS.rateMult; rl *= BS.reloadMult; crit += BS.crit; sp *= BS.bulletSpd;
  s.dmg = b.dmg * dm; s.rate = b.rate * rm;
  s.mag = b.mag === Infinity ? Infinity : Math.max(1, Math.round(b.mag * mm));
  s.reload = b.reload * rl; s.crit = crit; s.spd = b.spd * sp; s.pierce = b.pierce + BS.pierce;
  s.r = b.r * BS.bulletSize; s.spread = b.spread * BS.spreadMult + (b.type === 'tesla' ? 0 : BS.spreadAdd);
  s.legend = w.grade === 2; s.critMult = 2;
  s.ric = w.mods.includes('ricochet') ? 1 : 0; s.split = w.mods.includes('split'); s.homing = w.mods.includes('homing'); s.silencer = w.mods.includes('silencer');
  if (s.legend) {
    if (w.id === 'pistol') { s.crit += 0.25; s.critMult = 3; }
    if (w.id === 'shotgun') { s.pellets += 3; s.knock += 200; }
    if (w.id === 'tesla') s.chain += 3;
  }
  return s;
}
function dynDmg() {
  let m = 1;
  if (run.char === 'rain' && run.hp <= run.maxHp * 0.3) m *= 1.25;
  if (BS.berserk) m *= 1 + Math.min(0.9, 0.03 * run.berserk);
  return m;
}
function mouseWorld() {
  if (Input.usingPad) return { x: P.x + Math.cos(P.ang) * 280, y: P.y + Math.sin(P.ang) * 280 };
  return { x: Input.mx + cam.x, y: Input.my + cam.y };
}

// ================= 탄환 (오브젝트 풀) =================
const BULLETS = [], BPOOL = [];
function spawnBullet(o) {
  const b = BPOOL.pop() || { hit: new Set() };
  b.hit.clear();
  b.x = o.x; b.y = o.y; b.px = o.x; b.py = o.y; b.vx = o.vx || 0; b.vy = o.vy || 0; b.r = o.r || 4; b.dmg = o.dmg || 0;
  b.team = o.team || 'p'; b.life = b.maxLife = o.life || 1; b.pierce = o.pierce || 0; b.tag = o.tag || 'bullet';
  b.crit = !!o.crit; b.color = o.color || '#fff'; b.knock = o.knock || 0; b.type = o.type || 'n'; b.ric = o.ric || 0;
  b.split = !!o.split; b.homing = !!o.homing; b.explosive = !!o.explosive; b.owner = o.owner || null; b.wid = o.wid || null;
  b.t = 0; b.dodged = false; b.dead = false; b.returning = false; b.aoe = o.aoe || 0; b.legend = !!o.legend;
  b.chill = !!o.chill; b.status = o.status || null; b.pierced = 0; b.small = !!o.small; b.big = !!o.big;
  b.tx = o.tx || 0; b.ty = o.ty || 0; b.sx = o.x; b.sy = o.y; b.debris = !!o.debris; b.noWall = !!o.noWall; b.accel = o.accel || 0;
  BULLETS.push(b);
  return b;
}
function clearBullets() { while (BULLETS.length) BPOOL.push(BULLETS.pop()); }
function eShoot(e, a, spd, dmg, o = {}) {
  SFX.play('eshoot', 0.8);
  return spawnBullet(Object.assign({ x: e.x + Math.cos(a) * (e.r + 4), y: e.y + Math.sin(a) * (e.r + 4), vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: 6, dmg: dmg, team: 'e', life: 4, color: '#ff3b3b', owner: e }, o));
}
function eRing(e, n, spd, dmg, off = 0, o = {}) { for (let i = 0; i < n; i++) eShoot(e, off + i / n * TAU, spd, dmg, o); }
function eFan(e, a, n, spread, spd, dmg, o = {}) { for (let i = 0; i < n; i++) eShoot(e, a + (n > 1 ? (i / (n - 1) - 0.5) * spread : 0), spd, dmg, o); }

function inSlowField(x, y) { return P && P.slowT > 0 && d2(x, y, P.x, P.y) < 520 * 520; }

function updateBullets(dt) {
  const ens = room.enemies;
  for (let i = BULLETS.length - 1; i >= 0; i--) {
    const b = BULLETS[i];
    let bdt = dt;
    if (b.team === 'e' && inSlowField(b.x, b.y)) bdt *= 0.3;
    b.t += bdt; b.life -= bdt; b.px = b.x; b.py = b.y;

    if (b.type === 'lob') { // 포물선 투척 (보스 잔해, 적 유탄)
      const k = clamp(b.t / b.maxLife, 0, 1);
      b.x = lerp(b.sx, b.tx, k); b.y = lerp(b.sy, b.ty, k);
      if (k >= 1) {
        explode(b.x, b.y, b.aoe || 60, b.dmg, { team: 'e', owner: b.owner, pdmg: b.dmg });
        if (b.debris) for (let j = 0; j < 6; j++) { const a = j / 6 * TAU + rand(0, 0.5); spawnBullet({ x: b.x, y: b.y, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, r: 6, dmg: 8, team: 'e', life: 2, color: '#ff7a3b', owner: b.owner }); }
        b.dead = true;
      }
      if (b.dead) { BULLETS[i] = BULLETS[BULLETS.length - 1]; BULLETS.pop(); BPOOL.push(b); }
      continue;
    }
    if (b.type === 'boomerang') {
      if (!b.returning && b.t >= b.maxLife) { b.returning = true; b.hit.clear(); }
      if (b.returning) {
        const home = b.team === 'p' ? P : b.owner;
        if (!home || home.dead) b.dead = true;
        else {
          const a = angTo(b.x, b.y, home.x, home.y);
          b.vx = lerp(b.vx, Math.cos(a) * 950, 0.14); b.vy = lerp(b.vy, Math.sin(a) * 950, 0.14);
          b.life = 1;
          if (d2(b.x, b.y, home.x, home.y) < 26 * 26 || b.t > 4) b.dead = true;
        }
      }
    } else if (b.type === 'flame') { b.r += 38 * bdt; b.vx *= 0.97; b.vy *= 0.97; }
    if (b.accel) { b.vx *= 1 + b.accel * bdt; b.vy *= 1 + b.accel * bdt; }
    if (b.homing && b.team === 'p') {
      let best = null, bd = 260 * 260;
      for (const e of ens) { if (e.dead || e.invuln) continue; const dd = d2(b.x, b.y, e.x, e.y); if (dd < bd) { bd = dd; best = e; } }
      if (best) {
        const sp = Math.hypot(b.vx, b.vy), a = Math.atan2(b.vy, b.vx), ta = angTo(b.x, b.y, best.x, best.y);
        const na = a + clamp(angDiff(a, ta), -3.2 * bdt, 3.2 * bdt);
        b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
      }
    }
    b.x += b.vx * bdt; b.y += b.vy * bdt;

    // 환경 반응: 불탄이 기름을, 전기탄이 물을 지나갈 때
    if (b.team === 'p' && (b.tag === 'fire' || b.tag === 'elec') && (b.t * 60 | 0) % 3 === 0) {
      const h = hazardAt(b.x, b.y, b.tag === 'fire' ? 'oil' : 'water');
      if (h) { if (b.tag === 'fire') ignite(h, true); else electrify(h, true); }
    }

    // 벽 충돌
    if (!b.noWall) {
      const w = wallAt(b.x, b.y);
      if (w) {
        if (w !== 'bound' && w.hp < Infinity && b.team === 'p') damageWall(w, b.dmg * 0.5);
        if (b.ric > 0 && b.type !== 'grenade') {
          b.ric--;
          const outX = w === 'bound' ? (b.x < 0 || b.x > room.w) : (b.px < w.x || b.px > w.x + w.w);
          if (outX) b.vx *= -1; else b.vy *= -1;
          b.x = b.px; b.y = b.py; b.hit.clear();
        } else if (b.type === 'boomerang') {
          if (!b.returning) { b.returning = true; b.hit.clear(); b.x = b.px; b.y = b.py; }
        } else {
          if (b.type === 'grenade') explodeGrenade(b);
          else if (b.type === 'bh') spawnVortex(b);
          else burst(b.px, b.py, b.team === 'e' ? '#ff5050' : b.color, 3, 120, 0.2, 2);
          b.dead = true;
        }
      }
    }

    if (!b.dead) {
      if (b.team === 'p') {
        for (let j = 0; j < ens.length; j++) {
          const e = ens[j];
          if (e.dead || b.hit.has(e) || e.spawning) continue;
          // 전기 뱀 마디는 탄을 막는다
          if (e.segs) {
            let blocked = false;
            for (const s of e.segs) if (d2(b.x, b.y, s.x, s.y) < (s.r + b.r) * (s.r + b.r)) { blocked = true; break; }
            if (blocked && b.pierce < 99) { burst(b.x, b.y, '#fff04d', 4, 150, 0.2, 2); SFX.play('block'); b.dead = true; break; }
          }
          const rr = e.r + b.r;
          if (d2(b.x, b.y, e.x, e.y) > rr * rr) continue;
          const def = EN[e.type];
          if (e.reflectOn && !e.boss) { // 반사 엘리트
            b.team = 'e'; b.vx *= -1; b.vy *= -1; b.dmg = 8; b.color = '#ff3b3b'; b.hit.clear(); b.owner = e; b.life = 2; b.type = 'n'; b.homing = false;
            SFX.play('block'); break;
          }
          if (def.blocks && def.blocks(e, b)) { burst(b.x, b.y, '#9fd0ff', 5, 160, 0.2, 2); SFX.play('block'); b.hit.add(e); if (b.pierce < 99) { b.dead = true; break; } continue; }
          bulletHitEnemy(b, e);
          if (b.dead) break;
        }
        if (!b.dead) for (const p of room.props) {
          if (!p.shootable || p.dead || b.hit.has(p)) continue;
          if (d2(b.x, b.y, p.x, p.y) < (p.r + b.r) * (p.r + b.r)) {
            hitProp(p, b.dmg, b); b.hit.add(p);
            if (b.type === 'grenade') { explodeGrenade(b); b.dead = true; break; }
            if (b.pierce < 99) { b.dead = true; break; }
          }
        }
      } else {
        const pr = P.r + b.r;
        if (!P.dead && d2(b.x, b.y, P.x, P.y) < pr * pr) {
          if (P.rollT > 0) {
            if (!b.dodged) { b.dodged = true; run.dodged++; SAVE.stats.dodged++; }
          } else if (P.iframe <= 0) {
            damagePlayer(b.dmg, b.owner);
            if (b.chill) P.chillT = 1.6;
            b.dead = true;
          }
        }
        if (!b.dead) for (const p of room.props) {
          if (!p.ally || p.dead) continue;
          if (d2(b.x, b.y, p.x, p.y) < (p.r + b.r) * (p.r + b.r)) { hitAllyProp(p, b.dmg); b.dead = true; break; }
        }
      }
    }
    if (!b.dead && b.life <= 0) {
      if (b.type === 'grenade') explodeGrenade(b);
      else if (b.type === 'bh') spawnVortex(b);
      b.dead = true;
    }
    if (!b.dead && (b.x < -200 || b.y < -200 || b.x > room.w + 200 || b.y > room.h + 200)) b.dead = true;
    if (b.dead) { BULLETS[i] = BULLETS[BULLETS.length - 1]; BULLETS.pop(); BPOOL.push(b); }
  }
}

function bulletHitEnemy(b, e) {
  let dmg = b.dmg;
  if (b.legend && b.wid === 'sniper') dmg *= 1 + 0.25 * b.pierced;
  const wasFrozen = e.frozenT > 0;
  const ang = Math.atan2(b.vy, b.vx);
  if (b.type === 'grenade') { explodeGrenade(b); b.dead = true; return; }
  if (b.type === 'bh') { spawnVortex(b); b.dead = true; return; }
  damageEnemy(e, dmg, { tag: b.tag, crit: b.crit, knock: b.knock, ang, wid: b.wid, statusDmg: dmg });
  if (b.status) applyStatus(e, b.status, { dmg });
  if (b.team === 'p' && b.tag !== 'fire' && BS.burnChance && Math.random() < BS.burnChance) applyStatus(e, 'fire', { dmg });
  if (BS.shockChance && b.tag !== 'elec' && Math.random() < BS.shockChance) applyStatus(e, 'elec', { dmg });
  if (BS.chillChance && b.tag !== 'ice' && Math.random() < BS.chillChance) applyStatus(e, 'ice', { dmg });
  if (BS.burstChance && Math.random() < BS.burstChance) explode(b.x, b.y, 55, 12, { small: true });
  if (BS.elec7 && Math.random() < 0.25 && !e.dead) { strike(e.x, e.y); damageEnemy(e, 25 * dynDmg(), { tag: 'elec', noChain: true, quiet: true }); }
  if (BS.prism && Math.random() < 0.5 && !e.dead) applyStatus(e, pick(['fire', 'elec', 'ice']), { dmg });
  if (b.explosive) explode(b.x, b.y, 65, 22, { small: true, wid: b.wid });
  if (b.split && !b.small) for (const s of [-0.55, 0.55]) {
    const a = ang + s, sp = Math.hypot(b.vx, b.vy) * 0.8;
    const nb = spawnBullet({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: b.r * 0.7, dmg: b.dmg * 0.4, team: 'p', life: 0.35, tag: b.tag, color: b.color, small: true, wid: b.wid });
    nb.hit.add(e);
  }
  if (b.legend && b.wid === 'cryo' && wasFrozen) spawnShards(e.x, e.y, 6, 10, e);
  if (BS.thunder && b.crit && !e.dead) { strike(e.x, e.y); damageEnemy(e, 20, { tag: 'elec' }); }
  b.hit.add(e); b.pierced++;
  if (b.pierce > 0) b.pierce--; else b.dead = true;
}
function spawnShards(x, y, n, dmg, skip) {
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + rand(0, 0.4);
    const nb = spawnBullet({ x, y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 4, dmg, team: 'p', life: 0.4, tag: 'ice', color: '#bff4ff', small: true, pierce: 1 });
    if (skip) nb.hit.add(skip);
  }
}
function explodeGrenade(b) {
  explode(b.x, b.y, b.aoe || 80, b.dmg, { tag: b.tag, wid: b.wid });
  if (b.legend && b.wid === 'grenade' && !b.small) for (let i = 0; i < 3; i++) {
    const a = rand(0, TAU), d = rand(60, 110);
    spawnBullet({ x: b.x, y: b.y, vx: Math.cos(a) * d / 0.45, vy: Math.sin(a) * d / 0.45, r: 5, dmg: b.dmg * 0.45, team: 'p', life: 0.45, type: 'grenade', aoe: 55, tag: b.tag, color: b.color, small: true, wid: b.wid });
  }
}

// ================= 발사 =================
function shoot(w) {
  const s = wStats(w);
  const a = P.ang, ca = Math.cos(a), sa = Math.sin(a);
  const mx = P.x + ca * 22, my = P.y + sa * 22;
  let dmg = s.dmg * dynDmg();
  if (run.char === 'sera' && w.first) { dmg *= 2; w.first = false; burst(mx, my, '#b48cff', 8, 200, 0.25, 3); }
  const crit = Math.random() < s.crit;
  if (crit) dmg *= s.critMult;
  run.lastWeapon = w.id; w.shots++;
  let pierceBonus = 0;
  if (BS.bullet5) { run.shotCounter++; if (run.shotCounter % 3 === 0) pierceBonus = 3; }
  let status = null;
  if (P.staticShots > 0) { P.staticShots--; status = 'elec'; }
  const offs = BS.twin ? [-0.07, 0.07] : [0];
  const dm = BS.twin ? 0.65 : 1;
  const common = { team: 'p', tag: s.tag, crit, color: BS.prism ? `hsl(${(G.time * 360) % 360},100%,70%)` : s.color, knock: s.knock, ric: s.ric, split: s.split, homing: s.homing, wid: w.id, legend: s.legend, status };
  const mw = mouseWorld();
  const aimD = dist(P.x, P.y, mw.x, mw.y);
  switch (s.type) {
    case 'tesla': for (const o of offs) teslaFire(s, dmg * dm, crit, a + o, status); break;
    case 'grenade': case 'blackhole': {
      const maxD = s.spd * s.life, d = clamp(aimD, 60, maxD);
      for (const o of offs) {
        const aa = a + o + rand(-s.spread, s.spread);
        spawnBullet(Object.assign({}, common, { x: mx, y: my, vx: Math.cos(aa) * s.spd, vy: Math.sin(aa) * s.spd, r: s.r, dmg: dmg * dm, life: d / s.spd, type: s.type === 'grenade' ? 'grenade' : 'bh', aoe: s.aoe, pierce: 0 }));
      }
      break;
    }
    case 'boomerang': {
      const n = s.legend ? 3 : 1;
      for (const o of offs) for (let i = 0; i < n; i++) {
        const aa = a + o + (n > 1 ? (i - 1) * 0.32 : 0);
        spawnBullet(Object.assign({}, common, { x: mx, y: my, vx: Math.cos(aa) * s.spd, vy: Math.sin(aa) * s.spd, r: s.r, dmg: dmg * dm, life: s.life, type: 'boomerang', pierce: 99, ric: 0 }));
      }
      break;
    }
    case 'flame':
      for (const o of offs) {
        const aa = a + o + rand(-s.spread, s.spread), sp = s.spd * rand(0.85, 1.15);
        spawnBullet(Object.assign({}, common, { x: mx, y: my, vx: Math.cos(aa) * sp + P.vx * 0.5, vy: Math.sin(aa) * sp + P.vy * 0.5, r: s.r, dmg: dmg * dm, life: s.life * rand(0.85, 1.1), type: 'flame', pierce: 99, ric: 0 }));
      }
      break;
    default:
      for (const o of offs) for (let i = 0; i < s.pellets; i++) {
        const aa = a + o + (s.pellets > 1 ? ((i + 0.5) / s.pellets - 0.5) * s.spread * 2 + rand(-0.04, 0.04) : rand(-s.spread, s.spread));
        const sp = s.spd * (s.pellets > 1 ? rand(0.85, 1.1) : 1);
        const explosive = s.legend && w.id === 'smg' && w.shots % 10 === 0;
        spawnBullet(Object.assign({}, common, { x: mx, y: my, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, r: explosive ? s.r * 1.8 : s.r, dmg: dmg * dm, life: s.life, pierce: s.pierce + pierceBonus, explosive, big: w.id === 'sniper' }));
      }
  }
  // 연출
  part({ x: mx, y: my, vx: 0, vy: 0, life: 0.06, size: 10 + s.shake * 2, color: s.color, kind: 'flash' });
  if (['pistol', 'smg', 'shotgun', 'sniper'].includes(w.id)) {
    const pa = a + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
    part({ x: P.x, y: P.y, vx: Math.cos(pa) * rand(60, 120), vy: Math.sin(pa) * rand(60, 120), life: rand(1.5, 2.5), size: 3, color: '#e6c15a', kind: 'shell', rot: rand(0, TAU) });
  }
  shake(s.shake * 0.6);
  P.kx -= ca * s.shake * 10; P.ky -= sa * s.shake * 10;
  SFX.play(s.sfx);
}

function teslaFire(s, dmg, crit, a, status) {
  const sx = P.x + Math.cos(a) * 22, sy = P.y + Math.sin(a) * 22;
  let best = null, bs = 1e9;
  const cands = room.enemies.filter(e => !e.dead && !e.spawning);
  for (const e of cands) {
    const d = dist(P.x, P.y, e.x, e.y); if (d > s.range) continue;
    const ad = Math.abs(angDiff(a, angTo(P.x, P.y, e.x, e.y))); if (ad > 0.65) continue;
    const score = d * (1 + ad * 2) * (e.invuln ? 5 : 1);
    if (score < bs) { bs = score; best = e; }
  }
  if (!best) { // 사물 (히터, 드럼통 등)
    for (const p of room.props) {
      if (!p.shootable || p.dead) continue;
      const d = dist(P.x, P.y, p.x, p.y); if (d > s.range) continue;
      if (Math.abs(angDiff(a, angTo(P.x, P.y, p.x, p.y))) > 0.5) continue;
      addBolt(sx, sy, p.x, p.y, s.color); hitProp(p, dmg, null); return;
    }
    const L = rayWalls(sx, sy, Math.cos(a), Math.sin(a), s.range * 0.6);
    const ex = sx + Math.cos(a) * L, ey = sy + Math.sin(a) * L;
    addBolt(sx, sy, ex, ey, s.color);
    if (s.tag === 'elec') { const h = hazardAt(ex, ey, 'water'); if (h) electrify(h, true); }
    return;
  }
  const hit = new Set([best]);
  let cur = best;
  addBolt(sx, sy, best.x, best.y, s.color);
  const zap = t => {
    damageEnemy(t, dmg, { tag: s.tag, crit, wid: 'tesla', statusDmg: dmg });
    if (status) applyStatus(t, status, { dmg });
    if (BS.burnChance && Math.random() < BS.burnChance) applyStatus(t, 'fire', { dmg });
    if (BS.chillChance && Math.random() < BS.chillChance) applyStatus(t, 'ice', { dmg });
    if (s.tag === 'elec') { const h = hazardAt(t.x, t.y, 'water'); if (h) electrify(h, true); }
  };
  zap(best);
  for (let k = 1; k < s.chain; k++) {
    let n = null, nd = 240 * 240;
    for (const e of cands) { if (e.dead || hit.has(e)) continue; const dd = d2(cur.x, cur.y, e.x, e.y); if (dd < nd) { nd = dd; n = e; } }
    if (!n) break;
    addBolt(cur.x, cur.y, n.x, n.y, s.color);
    hit.add(n); zap(n); cur = n;
  }
}

function startReload(w) {
  const s = wStats(w);
  if (s.mag === Infinity || w.reloadT > 0 || w.ammo >= s.mag) return;
  w.reloadT = s.reload; w.reloadMax = s.reload;
  SFX.play('reload');
  if (BS.chargecoil) {
    for (const e of room.enemies) if (!e.dead && d2(e.x, e.y, P.x, P.y) < 180 * 180) { addBolt(P.x, P.y, e.x, e.y, '#fff04d'); damageEnemy(e, 12 * BS.chargecoil, { tag: 'elec' }); }
    burst(P.x, P.y, '#fff04d', 12, 250, 0.3, 2);
  }
}

// ================= 블랙홀 =================
function spawnVortex(b) {
  room.vortices.push({ x: b.x, y: b.y, t: 3, max: 3, r: 220, dmg: b.dmg, tick: 0, legend: b.legend, tag: b.tag });
  SFX.play('bhole');
  shake(5);
}
function updateVortices(dt) {
  for (let i = room.vortices.length - 1; i >= 0; i--) {
    const v = room.vortices[i];
    v.t -= dt; v.tick -= dt;
    for (const e of room.enemies) {
      if (e.dead || e.boss || e.heavy) continue;
      const d = dist(v.x, v.y, e.x, e.y);
      if (d < v.r && d > 4) { const f = (260 * (1 - d / v.r) + 70) * dt; e.x += (v.x - e.x) / d * f; e.y += (v.y - e.y) / d * f; }
    }
    if (v.tick <= 0) {
      v.tick = 0.25;
      for (const e of room.enemies) if (!e.dead && d2(v.x, v.y, e.x, e.y) < (v.r * 0.6) ** 2) damageEnemy(e, v.dmg * dynDmg(), { tag: v.tag === 'special' ? null : v.tag, quiet: true });
    }
    if (Math.random() < 0.6) { const a = rand(0, TAU); part({ x: v.x + Math.cos(a) * v.r, y: v.y + Math.sin(a) * v.r, vx: -Math.cos(a) * v.r * 2, vy: -Math.sin(a) * v.r * 2, life: 0.45, size: 2.5, color: '#c77dff', kind: 'dot' }); }
    if (v.t <= 0) {
      if (v.legend) explode(v.x, v.y, 190, 90, { noSelf: true });
      room.vortices.splice(i, 1);
    }
  }
}

// ================= 폭발 =================
function explode(x, y, r, dmg, o = {}) {
  const team = o.team || 'p';
  if (team === 'p') { r *= BS.expRadius; dmg *= BS.expDmg; }
  if (team === 'p') for (const e of room.enemies) {
    if (!e.dead && e.shockT > 0 && d2(x, y, e.x, e.y) < (r + e.r) ** 2) { r *= 1.5; reaction('overload', x, y); break; }
  }
  for (const h of room.hazards) if (h.type === 'oil' && hazardOverlapCircle(h, x, y, r)) ignite(h, team === 'p');
  for (const e of room.enemies.slice()) {
    if (e.dead || e.spawning) continue;
    const dd = dist(x, y, e.x, e.y);
    if (dd < r + e.r) {
      const f = 1 - 0.4 * clamp(dd / r, 0, 1);
      const mult = team === 'e' ? (o.friendly != null ? o.friendly : 0.5) : 1;
      if (mult > 0) damageEnemy(e, dmg * f * mult, { tag: o.tag && o.tag !== 'exp' ? o.tag : 'exp', isExp: true, knock: 240 * BS.expKnock, ang: angTo(x, y, e.x, e.y), wid: o.wid, quiet: o.small });
    }
  }
  if (!P.dead && dist(x, y, P.x, P.y) < r + P.r) {
    if (team === 'e') damagePlayer(o.pdmg != null ? o.pdmg : dmg, o.owner);
    else if (!BS.safety && !o.noSelf) damagePlayer(Math.min(12, dmg * 0.3), null);
  }
  for (const p of room.props) if (p.shootable && !p.dead && dist(x, y, p.x, p.y) < r + p.r) hitProp(p, dmg * 0.8, null, true);
  if (team === 'e') for (const p of room.props) if (p.ally && !p.dead && dist(x, y, p.x, p.y) < r + p.r) hitAllyProp(p, dmg * 0.6);
  for (const w of room.walls) if (w.hp < Infinity && circleRect(x, y, r, w)) damageWall(w, dmg);
  if (team === 'p' && BS.exp7 && !o.small && !o.noChain) for (let i = 0; i < 3; i++) {
    const a = rand(0, TAU), d = rand(r * 0.5, r * 1.1);
    room.timers.push({ t: 0.12 + i * 0.12, fn: () => explode(x + Math.cos(a) * d, y + Math.sin(a) * d, 55, 14, { small: true, noChain: true, noSelf: true }) });
  }
  // 연출
  const big = r > 70 && !o.small;
  part({ x, y, vx: 0, vy: 0, life: 0.35, size: r, color: team === 'e' ? '#ff5a3a' : '#ffb347', kind: 'ring' });
  part({ x, y, vx: 0, vy: 0, life: 0.12, size: r * 0.8, color: '#fff2c0', kind: 'flash' });
  burst(x, y, '#ff8a2a', big ? 26 : 12, r * 3.2, 0.5, 4);
  burst(x, y, '#ffe14d', big ? 14 : 6, r * 2.4, 0.35, 3);
  smoke(x, y, big ? 8 : 4, r);
  addDecal(x, y, r * 0.8, 'scorch');
  shake(big ? r / 9 : r / 16);
  if (big) hitstop(0.035);
  SFX.play(big ? 'explode' : 'smallexp');
}

// ================= 피해 / 상태 이상 / 반응 =================
function damageEnemy(e, dmg, o = {}) {
  if (e.dead || e.spawning) return 0;
  if (e.invuln) {
    if (!e.immT || G.time - e.immT > 0.4) { e.immT = G.time; floatText(e.x, e.y - e.r - 10, '면역', '#9aa0c0', 13); SFX.play('block'); }
    return 0;
  }
  e.alert = 0;
  if (e.frozenT > 0 && BS.ice3) dmg *= 1.5;
  if (e.shockT > 0) dmg *= 1 + BS.overcurrent;
  if (e.burnT > 0) dmg *= 1 + BS.incinerate;
  if (e.dmgTakenMult) dmg *= e.dmgTakenMult;
  if (o.isExp && e.frozenT > 0) {
    dmg *= 2; e.frozenT = 0; e.chill = 0;
    reaction('shatter', e.x, e.y);
    spawnShards(e.x, e.y, 6, 12, e);
  }
  if (e.barrier > 0) {
    const a = Math.min(e.barrier, dmg); e.barrier -= a; dmg -= a;
    if (e.barrier <= 0) { burst(e.x, e.y, '#4dd2ff', 16, 260, 0.4, 3); SFX.play('shield'); }
    if (dmg <= 0) { e.flash = 0.05; return 0; }
  }
  e.hp -= dmg; e.flash = 0.07; e.lastHit = G.time;
  if (SAVE.settings.dmgNum && !(o.quiet && Math.random() < 0.6)) {
    const big = o.crit || dmg >= 50;
    floatText(e.x + rand(-8, 8), e.y - e.r - 6, Math.max(1, Math.round(dmg)) + (o.crit ? '!' : ''), o.crit ? '#ffe14d' : big ? '#ffd0a0' : '#ffffff', o.crit ? 22 : big ? 18 : 13);
  }
  if (o.knock && !e.heavy && !e.boss) { const k = o.knock * (e.elite ? 0.5 : 1); e.kx += Math.cos(o.ang) * k; e.ky += Math.sin(o.ang) * k; }
  if (o.crit) { hitstop(0.02); SFX.play('crit'); } else SFX.play('hit');
  if (dmg >= 45) hitstop(0.05);
  if (o.tag && o.tag !== 'bullet' && o.tag !== 'special' && !o.noStatus) applyStatus(e, o.tag, { dmg: o.statusDmg || dmg, noChain: o.noChain, isExp: o.isExp });
  if (e.hp <= 0 && !e.dead) {
    const def = EN[e.type];
    if (def.onZero && def.onZero(e, o)) return dmg;
    killEnemy(e, o);
  }
  return dmg;
}

function applyStatus(e, tag, o = {}) {
  if (e.dead) return;
  if (tag === 'fire') {
    if (e.frozenT > 0 || e.chill > 0) { thermal(e); return; }
    e.burnT = BS.burnDur;
    e.burnStacks = BS.fire5 ? Math.min(5, (e.burnStacks || 0) + 1) : 1;
    e.burnDps = 5 * BS.burnDmg;
    const h = hazardAt(e.x, e.y, 'oil'); if (h) ignite(h, true);
  } else if (tag === 'elec') {
    e.shockT = 2;
    if (!o.noChain) {
      const n = 1 + (BS.elec3 ? 2 : 0);
      const tgts = room.enemies.filter(t => t !== e && !t.dead && !t.spawning && d2(t.x, t.y, e.x, e.y) < 170 * 170).sort((a, b) => d2(a.x, a.y, e.x, e.y) - d2(b.x, b.y, e.x, e.y)).slice(0, n);
      for (const t of tgts) { addBolt(e.x, e.y, t.x, t.y, '#fff04d', 0.15); damageEnemy(t, Math.max(3, (o.dmg || 10) * BS.transfer), { tag: 'elec', noChain: true, quiet: true }); }
    }
    const h = hazardAt(e.x, e.y, 'water'); if (h) electrify(h, true);
  } else if (tag === 'ice') {
    if (e.burnT > 0) { thermal(e); return; }
    e.chillT = 3 * BS.chillDur;
    if (e.frozenT <= 0) {
      e.chill = (e.chill || 0) + 1;
      if (e.chill >= (BS.ice7 ? 2 : 3)) {
        e.chill = 0;
        if (!e.boss) { e.frozenT = 1.5 * BS.chillDur + BS.permafrost; SFX.play('freeze'); burst(e.x, e.y, '#bff4ff', 10, 160, 0.4, 3); if (BS.ice7) spawnShards(e.x, e.y, 6, 12, e); }
        else { e.chill = 2; e.chillT = 3; }
      }
    }
  }
}
function thermal(e) {
  e.burnT = 0; e.burnStacks = 0; e.chill = 0; e.chillT = 0; e.frozenT = 0;
  reaction('thermal', e.x, e.y);
  part({ x: e.x, y: e.y, vx: 0, vy: 0, life: 0.3, size: e.r * 2.5, color: '#ff8ad5', kind: 'ring' });
  damageEnemy(e, (35 + 15 * (run ? run.zone : 0)) * dynDmg(), { noStatus: true });
}
function ignite(h, byPlayer) {
  if (h.type !== 'oil') return;
  h.type = 'fire'; h.life = 6; h.t = 0; h.tick = 0;
  if (byPlayer) reaction('firestorm', h.x, h.y);
  SFX.play('ignite');
  for (let i = 0; i < 20; i++) { const a = rand(0, TAU), d = rand(0, h.r); part({ x: h.x + Math.cos(a) * d, y: h.y + Math.sin(a) * d, vx: 0, vy: -rand(30, 90), life: rand(0.4, 0.9), size: rand(3, 7), color: pick(['#ff6a1a', '#ffb347', '#ffe14d']), kind: 'dot' }); }
}
function electrify(h, byPlayer) {
  if (h.type !== 'water' || h.elecT > 0) return;
  h.elecT = 2.5;
  if (byPlayer) reaction('current', h.x, h.y);
  SFX.play('zap');
  for (const e of room.enemies) if (!e.dead && pointInHazard(h, e.x, e.y)) { applyStatus(e, 'elec', { noChain: true }); damageEnemy(e, 15, { quiet: true }); }
  if (pointInHazard(h, P.x, P.y)) damagePlayer(8, null);
}
function strike(x, y) {
  addBolt(x + rand(-30, 30), y - 400, x, y, '#fff04d', 0.2);
  burst(x, y, '#fff04d', 10, 220, 0.3, 3);
  SFX.play('zap');
}
function reaction(id, x, y) {
  const R = REACTIONS[id];
  if (!G.lastReact[id] || G.time - G.lastReact[id] > 0.6) {
    G.reactTexts.push({ text: R.name, color: R.color, t: 1.2 });
    if (G.reactTexts.length > 3) G.reactTexts.shift();
    G.lastReact[id] = G.time;
    SFX.play('reaction');
  }
  floatText(x, y - 24, R.name, R.color, 18);
  if (codex('reaction', id)) toast(`새 속성 반응 발견: <b style="color:${R.color}">${R.name}</b>`);
  if (run) run.reactions++;
  SAVE.stats.reactions++;
}

function killEnemy(e, o = {}) {
  if (e.dead) return;
  e.dead = true; e.hp = 0;
  const def = EN[e.type];
  if (def.death) def.death(e, o);
  burst(e.x, e.y, e.color, e.boss ? 60 : 16, 260, 0.6, 3);
  part({ x: e.x, y: e.y, vx: 0, vy: 0, life: 0.2, size: e.r * 2, color: '#ffffff', kind: 'ring' });
  if (e.boss) { if (o.wid === 'sniper') { SAVE.stats.sniperBoss = true; saveGame(); } onBossKilled(e, o); return; }
  SFX.play('kill');
  shake(2);
  if (e.noReward) return;
  run.kills++; room.kills++; SAVE.stats.kills++;
  addCombo();
  // 코인
  let coins = (def.coin || 1) * (e.elite ? 4 : 1) * comboMult() * BS.coinMult;
  coins = Math.floor(coins) + (Math.random() < coins % 1 ? 1 : 0);
  if (e.heldCoins) coins += e.heldCoins;
  dropCoins(e.x, e.y, coins);
  // 강화/세트 효과
  if (e.burnT > 0) {
    if (BS.spreadfire || BS.fire3) {
      for (const t of room.enemies) if (!t.dead && t !== e && d2(t.x, t.y, e.x, e.y) < 150 * 150) applyStatus(t, 'fire', {});
      burst(e.x, e.y, '#ff7a2a', 12, 200, 0.5, 3);
    }
    if (BS.fire7 && !o.isExp) explode(e.x, e.y, 80, 30, { tag: 'fire', small: true, noSelf: true });
    if (o.wid === 'flamer' && curW() && curW().id === 'flamer' && curW().grade === 2) explode(e.x, e.y, 70, 25, { tag: 'fire', small: true, noSelf: true });
  }
  if (e.frozenT > 0 && BS.shards) spawnShards(e.x, e.y, 6, 12, e);
  if (o.isExp && BS.chaindet) explode(e.x, e.y, 65 + 20 * (BS.chaindet - 1), 18 * BS.chaindet, { small: true, noSelf: true });
  else if (BS.exp5 && Math.random() < 0.35) explode(e.x, e.y, 55, 14, { small: true, noSelf: true });
  if (o.wid === 'sniper') { const w = run.weapons.find(w => w.id === 'sniper' && w.grade === 2); if (w) w.ammo = Math.min(wStats(w).mag, w.ammo + 1); }
  if (BS.vamp) { run.vampCount++; if (run.vampCount >= 30) { run.vampCount = 0; healRun(5 * BS.vamp, true); } }
  if (BS.berserk) run.berserk++;
  if (room.onKill) room.onKill(e);
}

function damagePlayer(dmg, src) {
  if (!P || P.dead || room.over) return;
  if (P.rollT > 0 || P.iframe > 0) return;
  if (P.shield > 0) {
    P.shield--; P.iframe = 0.6; SFX.play('shield');
    part({ x: P.x, y: P.y, vx: 0, vy: 0, life: 0.3, size: 40, color: '#6dff8a', kind: 'ring' });
    return;
  }
  dmg *= G.eDmgMult * (1 - BS.plating) * (BS.surv7 ? 0.85 : 1);
  run.hp -= dmg; P.iframe = 0.75; P.hurtT = 0.25;
  breakCombo();
  if (BS.berserk) run.berserk = 0;
  shake(10); G.flash = 0.3; G.flashColor = '255,40,60'; hitstop(0.06); SFX.play('hurt');
  floatText(P.x, P.y - 24, '-' + Math.round(dmg), '#ff4d6d', 20);
  if (src && src.muts && src.muts.includes('vamp') && !src.dead) { src.hp = Math.min(src.maxHp, src.hp + src.maxHp * 0.25); floatText(src.x, src.y - src.r - 8, '흡혈', '#e0306a', 14); }
  if (BS.flamearmor) for (const e of room.enemies) if (!e.dead && d2(e.x, e.y, P.x, P.y) < 150 * 150) applyStatus(e, 'fire', {});
  if (BS.frostarmor) for (const e of room.enemies) if (!e.dead && d2(e.x, e.y, P.x, P.y) < 150 * 150) { applyStatus(e, 'ice', {}); applyStatus(e, 'ice', {}); }
  if (run.hp > 0 && BS.medkit && !room.medkitUsed && run.hp <= run.maxHp * 0.3) { room.medkitUsed = true; healRun(25, true); floatText(P.x, P.y - 44, '응급 키트!', '#6dff8a', 16); }
  if (run.hp <= 0) { run.hp = 0; playerDie(); }
}

// ================= 코인 / 콤보 =================
function dropCoins(x, y, n) {
  n = Math.min(n, 40);
  const pieces = Math.min(n, 8);
  for (let i = 0; i < pieces; i++) {
    const v = Math.floor(n / pieces) + (i < n % pieces ? 1 : 0);
    if (v <= 0) continue;
    const a = rand(0, TAU), s = rand(60, 180);
    room.pickups.push({ type: 'coin', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, val: v, t: G.coinLife, max: G.coinLife });
  }
}
function comboMult() { const c = run.combo; return c >= 100 ? 3 : c >= 50 ? 2 : c >= 25 ? 1.5 : c >= 10 ? 1.2 : 1; }
function comboGrade(c) { return c >= 100 ? 'S' : c >= 50 ? 'A' : c >= 25 ? 'B' : c >= 10 ? 'C' : ''; }
function addCombo() {
  const before = comboGrade(run.combo);
  run.combo++; run.comboT = BS.comboTime;
  run.maxCombo = Math.max(run.maxCombo, run.combo);
  const after = comboGrade(run.combo);
  if (after !== before) { G.banner = { text: `콤보 ${after}`, sub: `코인 ×${comboMult()}`, t: 1.2, color: after === 'S' ? '#ff3df0' : '#ffe14d' }; SFX.play('combo', 1 + 'CBAS'.indexOf(after) * 0.25); }
}
function breakCombo() {
  if (run.combo >= 10) floatText(P.x, P.y - 40, '콤보 끊김', '#9aa0c0', 14);
  run.combo = 0; run.comboT = 0;
}
