// ================= 전역 상태 =================
const G = {
  screen: 'title', paused: false, time: 0, hitstop: 0, hsCd: 0, slowmo: 0, shakeAmt: 0, flash: 0, flashColor: '255,40,60',
  reactTexts: [], lastReact: {}, bossIntro: null, glitchT: 0, glitchWarn: 0, mode: 'campaign', texts: [], bolts: [], beams: [], banner: null
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
  const tags = {}; for (const t of SET_TAGS) tags[t] = 0;
  if (run) for (const id in run.ups) { const up = UPG[id]; if (up && tags[up.tag] !== undefined) tags[up.tag] += run.ups[id]; }
  const set = (t, n) => tags[t] >= n;
  const aw = {}; for (const t of SET_TAGS) aw[t] = set(t, 9);
  const awakened = SET_TAGS.filter(t => aw[t]);
  if (run) { run.tags = tags; run.awaken = awakened; }
  const surv7 = set('surv', 7);
  BS = {
    tags, aw, awakened, awakenElems: awakened.filter(t => ELEM_TAGS.includes(t)),
    dmgMult: (1 + 0.15 * u('sharp')) * (u('bigcal') ? 1.1 : 1) * (c.glass ? 1.5 : 1) * (set('bullet', 3) ? 1.1 : 1) * (set('bullet', 7) ? 1.25 : 1) * (awakened.length ? 1.5 : 1),
    rateMult: (1 + 0.15 * u('rapid')) * (c.frenzy ? 1.4 : 1),
    reloadMult: 1 / (1 + 0.3 * u('quickhand')),
    crit: 0.1 * u('critup') + (aw.bullet ? 0.25 : 0),
    pierce: u('pierce') + (set('bullet', 7) ? 2 : 0),
    bulletSpd: (set('bullet', 3) ? 1.6 : 1) * (1 + 0.1 * u('tailwind')),
    bulletSize: u('bigcal') ? 1.4 : 1,
    spreadMult: c.frenzy ? 2.5 : 1, spreadAdd: c.frenzy ? 0.08 : 0, twin: u('twin') > 0,
    extraShots: aw.bullet, infAmmo: aw.bullet, pierceEvery: set('bullet', 5) ? 3 : 0,
    onHit: { fire: 0.2 * u('ignite'), elec: 0.15 * u('conductor'), ice: 0.2 * u('frosttip'), metal: 0.25 * u('shrapnel'), light: 0.15 * u('flashround'), dark: 0.2 * u('hex'), wind: 0.2 * u('gale'), water: 0.25 * u('splash') },
    burstChance: 0.1 * u('burst'),
    // 불
    burnDmg: (1 + 0.5 * u('kindling')) * (set('fire', 7) ? 2 : 1), burnDur: 3 + 2 * u('heat'), burnTick: u('spreadfire') ? 0.35 : 0.5,
    burnMax: aw.fire ? 10 : set('fire', 5) ? 5 : 1, incinerate: 0.2 * u('incinerate'), firetrail: u('firetrail') > 0, flamearmor: u('flamearmor') > 0,
    fire3: set('fire', 3), fire7: set('fire', 7),
    // 전기
    static: u('static') > 0, transfer: set('elec', 7) ? Math.max(1, 0.5 + 0.3 * u('highvolt')) : 0.5 + 0.3 * u('highvolt'),
    chargecoil: u('chargecoil'), overcurrent: 0.15 * u('overcurrent'), thunder: u('thunder') > 0, discharge: u('discharge') > 0,
    chainN: 1 + (set('elec', 3) ? 2 : 0), rechain: set('elec', 7), elec5: set('elec', 5),
    // 얼음
    chillDur: 1 + 0.5 * u('frostbite'), chillSlow: 0.3 + 0.15 * u('chill'), shards: u('shards') > 0, frostarmor: u('frostarmor') > 0,
    permafrost: u('permafrost') + (set('ice', 7) ? 1 : 0), freezeAt: set('ice', 7) ? 2 : 3, frozenBonus: set('ice', 3) ? 0.5 : 0, ice5: set('ice', 5),
    // 금속
    shredPer: (set('metal', 7) ? 0.08 : 0.05) + 0.02 * u('hardened'), shredMax: set('metal', 3) ? 10 : 5, shredDur: 6 + 4 * u('grind'),
    bigSlayer: 0.15 * u('heavy') + (set('metal', 5) ? 0.25 : 0), ironskin: u('ironskin') > 0, anvil: u('anvil') > 0,
    // 빛
    blindDur: 1.5 + 0.7 * u('glare') + (set('light', 3) ? 1 : 0), halo: 0.25 * u('halo'), lens: u('lens') > 0, dawn: u('dawn') > 0, refract: u('refract') > 0,
    blindCrit: set('light', 5), beamEvery: set('light', 7) ? 4 : 0,
    // 어둠
    execPer: (set('dark', 5) ? 0.06 : 0.03) + 0.01 * u('decay'), execCap: aw.dark ? 0.4 : 0.3, corrodeMax: 5 + 2 * u('nightfall') + (aw.dark ? 5 : 0),
    reaper: u('reaper') > 0, curseblood: u('curseblood') > 0, umbra: u('umbra') > 0, souls: set('dark', 3), cdRefund: set('dark', 7),
    // 바람
    gust: 230 * (1 + 0.4 * u('crosswind')), slamMult: (1 + 0.5 * u('impact')) * (set('wind', 3) ? 2 : 1), updraft: u('updraft') > 0, cyclone: u('cyclone') > 0,
    crash: set('wind', 7), rollCdMult: set('wind', 5) ? 0.6 : 1,
    // 물
    soakDur: 4 + 2 * u('deluge'), soakAmp: (set('water', 5) ? 2 : 1.5) + 0.25 * u('catalyst'), spray: u('spray') > 0, pressure: u('pressure') > 0, riptide: u('riptide') > 0,
    puddleOnDeath: set('water', 3), reactAmp: set('water', 7) ? 2 : 1,
    // 폭발
    chaindet: u('chaindet'), expDmg: (1 + 0.3 * u('hiexp')) * (set('exp', 7) ? 1.5 : 1), expRadius: (1 + 0.15 * u('shockwave')) * (set('exp', 3) ? 1.45 : 1),
    blastroll: u('blastroll') > 0, safety: u('safety') > 0 || aw.exp, exp5: set('exp', 5), exp7: set('exp', 7),
    // 생존
    vamp: u('vamp'), regen: 8 * u('regen'), evasion: u('evasion') ? 1.5 : 1, medkit: u('medkit') > 0, surv3: set('surv', 3), surv5: set('surv', 5), surv7,
    takenMult: (1 - 0.1 * u('plating')) * (surv7 ? 0.85 : 1) * (aw.surv ? 0.75 : 1), revive: aw.surv,
    // 기타
    magnet: u('magnet') ? 2 : 1, afterimage: u('afterimage') > 0, cdMult: Math.pow(0.8, u('cooldown')),
    moveMult: (1 + 0.1 * u('swift')) * (1 + 0.08 * u('tailwind')) * (set('wind', 5) ? 1.2 : 1),
    comboTime: 3 + 2 * u('combokeep'), invest: 8 * u('invest'), lucky: 0.2 * u('lucky'),
    coinMult: c.avarice ? 2 : 1, enemyMult: c.avarice ? 1.25 : 1, berserk: !!c.berserk, noHeal: !!c.berserk
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
  if (h > 0 && P && room && G.screen === 'combat') { floatText(P.x, P.y - 26, '+' + Math.round(h), '#6dff8a', 18); SFX.play('heal'); }
  return h;
}
function hurtRun(n) { run.hp = Math.max(1, run.hp - n); }
function addUpgrade(id) { if (!UPG[id]) return; run.ups[id] = Math.min(UPG[id].max || 1, (run.ups[id] || 0) + 1); recomputeBuild(); }
function applyCurse(id) { run.curses[id] = 1; recomputeBuild(); }

// ================= 무기 인스턴스 =================
function makeWeapon(id, grade = 0) {
  const w = { id, grade, mods: new Array(GRADES[grade].slots).fill(null), bonus: null, ammo: 0, cd: 0, reloadT: 0, shots: 0, first: true, spin: 0 };
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
function weaponName(w) { const n = w.grade === 2 ? `${LEGEND[w.id].name}(${WEAPONS[w.id].name})` : `${GRADES[w.grade].name} ${WEAPONS[w.id].name}`; return w.fuse ? `${n}+${TAG_NAME[w.fuse]}` : n; }
function randomWeaponId(exclude) { const pool = weaponPool().filter(id => id !== exclude); return rp(pool); }
function rollGrade(w = [60, 32, 8]) { const r = RNG() * (w[0] + w[1] + w[2]); return r < w[0] ? 0 : r < w[0] + w[1] ? 1 : 2; }
function curW() { return run.weapons[run.cur] || run.weapons[0]; }

function wStats(w) {
  const b = WEAPONS[w.id]; const s = Object.assign({}, b);
  for (const m of w.mods) if (m && MODS[m] && MODS[m].conv) s.tag = MODS[m].conv;
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
  s.r = b.r * BS.bulletSize; s.spread = b.spread * BS.spreadMult + (b.type === 'tesla' || b.type === 'beam' ? 0 : BS.spreadAdd);
  s.legend = w.grade === 2; s.critMult = 2; s.stacks = 1;
  s.ric = w.mods.includes('ricochet') ? 1 : 0; s.split = w.mods.includes('split'); s.homing = w.mods.includes('homing'); s.silencer = w.mods.includes('silencer');
  if (s.legend) {
    if (w.id === 'pistol') { s.crit += 0.25; s.critMult = 3; }
    if (w.id === 'shotgun') s.pellets += 3;
    if (w.id === 'tesla') s.chain += 3;
    if (w.id === 'smg') s.rate *= 1 + 0.6 * (w.spin || 0);
    if (w.id === 'flamer') { s.life *= 1.5; s.stacks = 2; }
    if (w.id === 'hydro') s.pierce += 3;
  }
  if (run && run.char === 'sera') s.crit += 0.2;
  if (w.fuse) { s.tag2 = w.fuse; s.dmg *= 1.15; }
  return s;
}
function dynDmg() {
  let m = 1;
  if (run.char === 'rain' && run.hp <= run.maxHp * 0.3) m *= 1.25;
  if (run.char === 'kai' && P && P.momT > 0) m *= 1.4;
  if (run.char === 'sera' && P && P.slowT > 0) m *= 1.3;
  if (run.char === 'rain' && P && P.overT > 0) m *= 1.2;
  if (P && P.odT > 0) m *= 1.5;
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
  b.split = !!o.split; b.homing = !!o.homing; b.owner = o.owner || null; b.wid = o.wid || null;
  b.t = 0; b.dodged = false; b.dead = false; b.returning = false; b.aoe = o.aoe || 0; b.legend = !!o.legend;
  b.chill = !!o.chill; b.status = o.status || null; b.tag2 = o.tag2 || null; b.pierced = 0; b.small = !!o.small; b.big = !!o.big; b.stacks = o.stacks || 1;
  b.tx = o.tx || 0; b.ty = o.ty || 0; b.sx = o.x; b.sy = o.y; b.debris = !!o.debris; b.noWall = !!o.noWall; b.accel = o.accel || 0;
  BULLETS.push(b);
  return b;
}
function clearBullets() { while (BULLETS.length) BPOOL.push(BULLETS.pop()); }
function eShoot(e, a, spd, dmg, o = {}) {
  SFX.play('eshoot', 0.8);
  if (e.ally) return spawnBullet(Object.assign({ x: e.x + Math.cos(a) * (e.r + 4), y: e.y + Math.sin(a) * (e.r + 4), vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: 5, dmg: dmg * 1.5 * BS.dmgMult, team: 'p', life: 3, color: '#29f0ff', small: true }, o, { team: 'p', color: '#29f0ff', chill: false, owner: null, type: o.type === 'boomerang' ? 'n' : (o.type || 'n') }));
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
    if (b.team === 'e' && P && P.odT > 0) bdt *= 0.6;
    b.t += bdt; b.life -= bdt; b.px = b.x; b.py = b.y;

    if (b.type === 'lob') { // 포물선 투척 (보스 잔해, 적 유탄)
      const k = clamp(b.t / b.maxLife, 0, 1);
      b.x = lerp(b.sx, b.tx, k); b.y = lerp(b.sy, b.ty, k);
      if (k >= 1) {
        if (b.team === 'p') explode(b.x, b.y, b.aoe || 60, b.dmg, { noSelf: true });
        else explode(b.x, b.y, b.aoe || 60, b.dmg, { team: 'e', owner: b.owner, pdmg: b.dmg });
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
    else if (b.type === 'stream') { b.r += 9 * bdt; b.vx *= 0.985; b.vy *= 0.985; }
    if (b.accel) { b.vx *= 1 + b.accel * bdt; b.vy *= 1 + b.accel * bdt; }
    if (b.homing && b.team === 'p') {
      let best = null, bd = (b.wid === 'soul' ? 600 : 260) ** 2;
      for (const e of ens) { if (e.dead || e.invuln || e.spawning || b.hit.has(e)) continue; const dd = d2(b.x, b.y, e.x, e.y); if (dd < bd) { bd = dd; best = e; } }
      if (best) {
        const sp = Math.hypot(b.vx, b.vy), a = Math.atan2(b.vy, b.vx), ta = angTo(b.x, b.y, best.x, best.y);
        const turn = b.wid === 'soul' ? 8 : 3.2;
        const na = a + clamp(angDiff(a, ta), -turn * bdt, turn * bdt);
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
  if (b.type === 'grenade') { explodeGrenade(b); b.dead = true; return; }
  if (b.type === 'bh') { spawnVortex(b); b.dead = true; return; }
  let dmg = b.dmg;
  if (b.legend && b.wid === 'sniper') dmg *= 1 + 0.25 * b.pierced;
  if (b.legend && b.wid === 'shotgun' && P && d2(P.x, P.y, e.x, e.y) < 150 * 150) dmg *= 1.4;
  const wasFrozen = e.frozenT > 0;
  const ang = Math.atan2(b.vy, b.vx);
  damageEnemy(e, dmg, { tag: b.tag, crit: b.crit, knock: b.knock, ang, wid: b.wid, statusDmg: dmg, stacks: b.stacks, long: b.legend && b.wid === 'hydro' });
  if (b.status) applyStatus(e, b.status, { dmg, ang });
  onHitProcs(e, dmg, b.tag, { crit: b.crit, ang, x: b.x, y: b.y, small: b.small, wid: b.wid, tag2: b.tag2 });
  if (b.split && !b.small) for (const s of [-0.55, 0.55]) {
    const a = ang + s, sp = Math.hypot(b.vx, b.vy) * 0.8;
    const nb = spawnBullet({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: b.r * 0.7, dmg: b.dmg * 0.4, team: 'p', life: 0.35, tag: b.tag, color: b.color, small: true, wid: b.wid });
    nb.hit.add(e);
  }
  if (b.legend && b.wid === 'cryo' && wasFrozen) spawnShards(e.x, e.y, 6, 10, e);
  b.hit.add(e); b.pierced++;
  if (b.pierce > 0) b.pierce--; else b.dead = true;
}
// 명중 시 공통 추가 효과 (확률 상태 이상, 각성, 치명타 효과 등)
function onHitProcs(e, dmg, srcTag, o) {
  if (o.tag2 && !e.dead) {
    if (ELEM_TAGS.includes(o.tag2) && o.tag2 !== srcTag) applyStatus(e, o.tag2, { dmg, ang: o.ang });
    else if (o.tag2 === 'exp' && G.time - (G.fuseExpT || 0) > 0.08) { G.fuseExpT = G.time; explode(o.x, o.y, 45, dmg * 0.4 + 5, { small: true, noSelf: true }); }
  }
  for (const t of ELEM_TAGS) {
    const c = BS.onHit[t];
    if (c && t !== srcTag && !e.dead && Math.random() < c) applyStatus(e, t, { dmg, ang: o.ang });
  }
  for (const t of BS.awakenElems) if (t !== srcTag && !e.dead) applyStatus(e, t, { dmg, ang: o.ang, stacks: (t === 'metal' || t === 'dark') ? 2 : 1 });
  if (BS.lens && o.crit && !e.dead) applyStatus(e, 'light', {});
  if (BS.thunder && o.crit && !e.dead) { strike(e.x, e.y); damageEnemy(e, 20, { tag: 'elec', noChain: true }); }
  if (BS.burstChance && Math.random() < BS.burstChance) explode(o.x, o.y, 55, 12, { small: true, noSelf: true });
  if (BS.aw.exp && !o.small && G.time - (G.expProcT || 0) > 0.05) { G.expProcT = G.time; explode(o.x, o.y, 48, dmg * 0.35 + 6, { small: true, noSelf: true }); }
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
  if (run.char === 'sera' && w.first) { dmg *= 2.5; burst(mx, my, '#b48cff', 8, 200, 0.25, 3); }
  w.first = false;
  if (P.reaperShots > 0) { dmg *= 1.6; P.reaperShots--; }
  const crit = Math.random() < s.crit;
  if (crit) dmg *= s.critMult;
  run.lastWeapon = w.id; w.shots++;
  if (s.legend && w.id === 'smg') w.spin = Math.min(1, (w.spin || 0) + 0.04);
  let pierceBonus = 0;
  run.shotCounter++;
  if (BS.pierceEvery && run.shotCounter % BS.pierceEvery === 0) pierceBonus = 3;
  let status = null;
  if (P.staticShots > 0) { P.staticShots--; status = 'elec'; }
  let offs = BS.twin ? [-0.07, 0.07] : [0];
  if (BS.extraShots) offs = offs.concat([-0.2, 0.2]);
  const dm = BS.twin ? 0.65 : 1;
  const common = { team: 'p', tag: s.tag, tag2: s.tag2, crit, color: s.tag !== WEAPONS[w.id].tag ? TAG_COLOR[s.tag] : s.color, knock: s.knock, ric: s.ric, split: s.split, homing: s.homing, wid: w.id, legend: s.legend, status, stacks: s.stacks };
  const mw = mouseWorld();
  const aimD = dist(P.x, P.y, mw.x, mw.y);
  switch (s.type) {
    case 'tesla': for (const o of offs) teslaFire(s, dmg * dm, crit, a + o, status); break;
    case 'beam': {
      const n = s.legend ? 3 : 1;
      for (const o of offs) for (let i = 0; i < n; i++) fireBeam(a + o + (n > 1 ? (i - 1) * 0.12 : 0), dmg * dm, crit, s.tag, { wid: w.id, range: s.range, tag2: s.tag2 });
      break;
    }
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
    case 'flame': case 'stream':
      for (const o of offs) {
        const aa = a + o + rand(-s.spread, s.spread), sp = s.spd * rand(0.85, 1.15);
        spawnBullet(Object.assign({}, common, { x: mx, y: my, vx: Math.cos(aa) * sp + P.vx * 0.5, vy: Math.sin(aa) * sp + P.vy * 0.5, r: s.r, dmg: dmg * dm, life: s.life * rand(0.85, 1.1), type: s.type, pierce: s.type === 'flame' ? 99 : s.pierce, ric: 0 }));
      }
      break;
    default:
      for (const o of offs) for (let i = 0; i < s.pellets; i++) {
        const aa = a + o + (s.pellets > 1 ? ((i + 0.5) / s.pellets - 0.5) * s.spread * 2 + rand(-0.04, 0.04) : rand(-s.spread, s.spread));
        const sp = s.spd * (s.pellets > 1 ? rand(0.85, 1.1) : 1);
        spawnBullet(Object.assign({}, common, { x: mx, y: my, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, r: s.r, dmg: dmg * dm, life: s.life, pierce: s.pierce + pierceBonus, big: w.id === 'sniper' }));
      }
  }
  // 빛 7세트: 4번째 공격마다 관통 광선
  if (BS.beamEvery && run.shotCounter % BS.beamEvery === 0 && s.type !== 'beam') fireBeam(a, Math.max(14, dmg * 0.8), crit, 'light', { wid: 'beam7', w: 3 });
  // 연출
  part({ x: mx, y: my, vx: 0, vy: 0, life: 0.06, size: 10 + s.shake * 2, color: common.color, kind: 'flash' });
  if (['pistol', 'smg', 'shotgun', 'sniper'].includes(w.id)) {
    const pa = a + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
    part({ x: P.x, y: P.y, vx: Math.cos(pa) * rand(60, 120), vy: Math.sin(pa) * rand(60, 120), life: rand(1.5, 2.5), size: 3, color: '#e6c15a', kind: 'shell', rot: rand(0, TAU) });
  }
  shake(s.shake * 0.6);
  P.kx -= ca * s.shake * 10; P.ky -= sa * s.shake * 10;
  SFX.play(s.sfx);
}

// 관통 광선 (광선총, 빛 7세트, 빛 굴절)
function fireBeam(a, dmg, crit, tag, o = {}) {
  const sx = (o.x != null ? o.x : P.x + Math.cos(a) * 20), sy = (o.y != null ? o.y : P.y + Math.sin(a) * 20);
  const L = rayWalls(sx, sy, Math.cos(a), Math.sin(a), o.range || 900);
  const ex = sx + Math.cos(a) * L, ey = sy + Math.sin(a) * L;
  G.beams.push({ x1: sx, y1: sy, x2: ex, y2: ey, t: 0.14, max: 0.14, color: TAG_COLOR[tag] || '#fff', w: o.w || 5 });
  if (G.beams.length > 40) G.beams.shift();
  for (const e of room.enemies.slice()) {
    if (e.dead || e.spawning) continue;
    if (segDist(e.x, e.y, sx, sy, ex, ey) < e.r + 6) {
      damageEnemy(e, dmg, { tag, crit, wid: o.wid, ang: a, statusDmg: dmg });
      if (!o.noProc) onHitProcs(e, dmg, tag, { crit, ang: a, x: e.x, y: e.y, wid: o.wid, tag2: o.tag2 });
    }
  }
  for (const p of room.props) if (p.shootable && !p.dead && segDist(p.x, p.y, sx, sy, ex, ey) < p.r + 6) hitProp(p, dmg, null);
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
  addBolt(sx, sy, best.x, best.y, TAG_COLOR[s.tag] || s.color);
  const zap = t => {
    damageEnemy(t, dmg, { tag: s.tag, crit, wid: 'tesla', statusDmg: dmg, ang: angTo(P.x, P.y, t.x, t.y) });
    if (status) applyStatus(t, status, { dmg });
    onHitProcs(t, dmg, s.tag, { crit, ang: angTo(P.x, P.y, t.x, t.y), x: t.x, y: t.y, wid: 'tesla', tag2: s.tag2 });
    if (s.tag === 'elec') { const h = hazardAt(t.x, t.y, 'water'); if (h) electrify(h, true); }
  };
  zap(best);
  for (let k = 1; k < s.chain; k++) {
    let n = null, nd = 240 * 240;
    for (const e of cands) { if (e.dead || hit.has(e)) continue; const dd = d2(cur.x, cur.y, e.x, e.y); if (dd < nd) { nd = dd; n = e; } }
    if (!n) break;
    addBolt(cur.x, cur.y, n.x, n.y, TAG_COLOR[s.tag] || s.color);
    hit.add(n); zap(n); cur = n;
  }
}

function startReload(w) {
  const s = wStats(w);
  if (s.mag === Infinity || w.reloadT > 0 || w.ammo >= s.mag || BS.infAmmo) return;
  w.reloadT = s.reload; w.reloadMax = s.reload;
  SFX.play('reload');
  if (BS.chargecoil && room) {
    for (const e of room.enemies) if (!e.dead && !e.spawning && d2(e.x, e.y, P.x, P.y) < 180 * 180) { addBolt(P.x, P.y, e.x, e.y, '#fff04d'); damageEnemy(e, 12 * BS.chargecoil, { tag: 'elec' }); }
    burst(P.x, P.y, '#fff04d', 12, 250, 0.3, 2);
  }
}

// ================= 중력장 (블랙홀 / 어둠 각성 균열) =================
function spawnVortex(b) {
  const legend = b.legend && b.wid === 'blackhole';
  room.vortices.push({ x: b.x, y: b.y, t: legend ? 6 : 3, max: legend ? 6 : 3, r: 220, dmg: b.dmg, tick: 0, tag: b.tag, stacks: legend ? 2 : 1 });
  SFX.play('bhole');
  shake(5);
}
function updateVortices(dt) {
  for (let i = room.vortices.length - 1; i >= 0; i--) {
    const v = room.vortices[i];
    v.t -= dt; v.tick -= dt;
    for (const e of room.enemies) {
      if (e.dead || e.boss || e.heavy || e.spawning) continue;
      const d = dist(v.x, v.y, e.x, e.y);
      if (d < v.r && d > 4) { const f = (260 * (1 - d / v.r) + 70) * dt; e.x += (v.x - e.x) / d * f; e.y += (v.y - e.y) / d * f; }
    }
    if (v.tick <= 0) {
      v.tick = 0.25;
      for (const e of room.enemies) if (!e.dead && !e.spawning && d2(v.x, v.y, e.x, e.y) < (v.r * 0.6) ** 2) damageEnemy(e, v.dmg * dynDmg(), { tag: ELEM_TAGS.includes(v.tag) ? v.tag : null, quiet: true, dot: true, stacks: v.stacks });
    }
    if (Math.random() < 0.6) { const a = rand(0, TAU); part({ x: v.x + Math.cos(a) * v.r, y: v.y + Math.sin(a) * v.r, vx: -Math.cos(a) * v.r * 2, vy: -Math.sin(a) * v.r * 2, life: 0.45, size: 2.5, color: '#9b6bff', kind: 'dot' }); }
    if (v.t <= 0) room.vortices.splice(i, 1);
  }
}

// ================= 폭발 (폭발 태그 전용) =================
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
      if (mult > 0) damageEnemy(e, dmg * f * mult, { tag: o.tag && ELEM_TAGS.includes(o.tag) ? o.tag : null, isExp: true, knock: 60, ang: angTo(x, y, e.x, e.y), wid: o.wid, quiet: o.small, dot: o.small });
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
  burst(x, y, '#ff8a2a', big ? 26 : 10, r * 3.2, 0.5, 4);
  burst(x, y, '#ffe14d', big ? 14 : 5, r * 2.4, 0.35, 3);
  smoke(x, y, big ? 8 : 3, r);
  if (big) addDecal(x, y, r * 0.8, 'scorch');
  shake(big ? r / 9 : r / 18);
  if (big) hitstop(0.035);
  SFX.play(big ? 'explode' : 'smallexp');
}

// ================= 피해 =================
function damageEnemy(e, dmg, o = {}) {
  if (e.dead || e.spawning) return 0;
  if (e.invuln) {
    if (!e.immT || G.time - e.immT > 0.4) { e.immT = G.time; floatText(e.x, e.y - e.r - 10, '면역', '#9aa0c0', 13); SFX.play('block'); }
    return 0;
  }
  e.alert = 0;
  let crit = !!o.crit;
  if (e.frozenT > 0) dmg *= 1 + BS.frozenBonus;
  if (e.shockT > 0) dmg *= 1 + BS.overcurrent;
  if (e.burnT > 0) dmg *= 1 + BS.incinerate;
  if (e.shred > 0) dmg *= 1 + e.shred * BS.shredPer;
  if (e.blindT > 0) {
    dmg *= 1 + BS.halo;
    if (BS.blindCrit && !crit && !o.dot) { dmg *= 2; crit = true; }
  }
  if ((e.boss || e.muts) && BS.bigSlayer) dmg *= 1 + BS.bigSlayer;
  if (BS.anvil && e.shred >= 5 && !o.dot && Math.random() < 0.1) { dmg *= 3; floatText(e.x, e.y - e.r - 24, '분쇄!', TAG_COLOR.metal, 18); }
  if (o.reaction) dmg *= BS.reactAmp * (e.soakT > 0 && BS.pressure ? 1.5 : 1);
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
  if (!o.dot) addOd(Math.min(1.5, dmg / 90));
  if (SAVE.settings.dmgNum && !(o.quiet && Math.random() < 0.6)) {
    const big = crit || dmg >= 50;
    floatText(e.x + rand(-8, 8), e.y - e.r - 6, Math.max(1, Math.round(dmg)) + (crit ? '!' : ''), crit ? '#ffe14d' : big ? '#ffd0a0' : '#ffffff', crit ? 22 : big ? 18 : 13);
  }
  if (o.knock && !e.heavy && !e.boss) { const k = o.knock * (e.muts ? 0.5 : 1); e.kx += Math.cos(o.ang) * k; e.ky += Math.sin(o.ang) * k; }
  if (!o.dot) { if (crit) { hitstop(0.02); SFX.play('crit'); } else SFX.play('hit'); }
  if (dmg >= 60 && !o.dot) hitstop(0.04);
  // 이안류: 젖은 적끼리 피해 공유
  if (BS.riptide && e.soakT > 0 && !o.riptide && !o.dot) {
    for (const t of room.enemies) if (t !== e && !t.dead && !t.spawning && t.soakT > 0 && d2(t.x, t.y, e.x, e.y) < 300 * 300) damageEnemy(t, dmg * 0.2, { riptide: true, quiet: true, dot: true });
  }
  if (o.tag && ELEM_TAGS.includes(o.tag) && !o.noStatus && !e.dead) applyStatus(e, o.tag, { dmg: o.statusDmg || dmg, noChain: o.noChain, ang: o.ang, stacks: o.stacks, long: o.long });
  if (e.dead) return dmg;
  if (e.hp <= 0) {
    const def = EN[e.type];
    if (def.onZero && def.onZero(e, o)) return dmg;
    killEnemy(e, o);
    return dmg;
  }
  checkExecute(e, o);
  return dmg;
}

// ================= 상태 이상 (원소마다 고유 동작) =================
function applyStatus(e, tag, o = {}) {
  if (e.dead || e.spawning) return;
  const amp = (e.soakT > 0 && tag !== 'water') ? BS.soakAmp : 1;
  const st = (o.stacks || 1) + (amp > 1 ? Math.round(amp - 1) : 0);
  switch (tag) {
    case 'fire': // 화상: 지속 피해
      if (e.frozenT > 0 || e.chill > 0) { thermal(e); return; }
      if (e.soakT > 0) scald(e);
      e.burnT = BS.burnDur * (amp > 1 ? 1.5 : 1);
      e.burnStacks = Math.min(BS.burnMax, (e.burnStacks || 0) + st);
      e.burnDps = 5 * BS.burnDmg * amp;
      if (e.gustT > 0) tornado(e);
      { const h = hazardAt(e.x, e.y, 'oil'); if (h) ignite(h, true); }
      break;
    case 'elec': // 감전: 연쇄
      e.shockT = 2 * amp;
      if (!o.noChain) {
        if (e.soakT > 0) conduct(e, o.dmg);
        if (e.shred >= 3) magnetize(e);
        chainLightning(e, o.dmg || 10, BS.chainN + (amp > 1 ? 1 : 0), BS.rechain);
      }
      { const h = hazardAt(e.x, e.y, 'water'); if (h) electrify(h, true); }
      break;
    case 'ice': // 빙결: 둔화 → 얼어붙음
      if (e.burnT > 0) { thermal(e); return; }
      e.chillT = 3 * BS.chillDur * (amp > 1 ? 1.5 : 1);
      if (e.frozenT <= 0) {
        e.chill = (e.chill || 0) + st;
        if (e.chill >= BS.freezeAt) {
          e.chill = 0;
          if (!e.boss) freezeNow(e);
          else { e.chill = BS.freezeAt - 1; e.chillT = 3; }
        }
      }
      break;
    case 'metal': // 파쇄: 받는 피해 증가 중첩
      if (e.soakT > 0) rust(e);
      e.shred = Math.min(BS.shredMax, (e.shred || 0) + st);
      e.shredT = BS.shredDur;
      break;
    case 'light': // 실명: 공격 불가
      if (e.corrode > 0) { eclipse(e); return; }
      if (e.boss) e.dazzleT = 2.5 * amp;
      else e.blindT = Math.max(e.blindT || 0, BS.blindDur * amp);
      break;
    case 'dark': // 침식: 처형 기준 누적
      if (e.blindT > 0 || e.dazzleT > 0) { eclipse(e); return; }
      e.corrode = Math.min(BS.corrodeMax, (e.corrode || 0) + st);
      e.corrodeT = 6;
      checkExecute(e, o);
      break;
    case 'wind': { // 돌풍: 밀어내기 + 충돌
      if (e.burnT > 0) tornado(e);
      if (!e.heavy && !e.boss) {
        const a = o.ang != null ? o.ang : angTo(P.x, P.y, e.x, e.y);
        const k = BS.gust * amp * (e.muts ? 0.6 : 1);
        e.kx += Math.cos(a) * k; e.ky += Math.sin(a) * k;
        e.gustT = 0.45; e.gustDmg = Math.max(10, o.dmg || 10); e.crashed = false;
      }
      break;
    }
    case 'water': // 젖음: 다른 상태 이상 증폭
      e.soakT = BS.soakDur * (o.long ? 2 : 1);
      break;
  }
}
function freezeNow(e) {
  e.chill = 0;
  e.frozenT = 1.5 * BS.chillDur + BS.permafrost;
  SFX.play('freeze'); burst(e.x, e.y, '#bff4ff', 10, 160, 0.4, 3);
}
function chainLightning(e, dmg, n, rechain) {
  const tgts = room.enemies.filter(t => t !== e && !t.dead && !t.spawning && d2(t.x, t.y, e.x, e.y) < 170 * 170).sort((a, b) => d2(a.x, a.y, e.x, e.y) - d2(b.x, b.y, e.x, e.y)).slice(0, n);
  for (const t of tgts) {
    addBolt(e.x, e.y, t.x, t.y, '#fff04d', 0.15);
    damageEnemy(t, Math.max(3, dmg * BS.transfer), { tag: 'elec', noChain: true, quiet: true });
    if (rechain && !t.dead) {
      const t2 = room.enemies.find(q => q !== t && q !== e && !q.dead && !q.spawning && !tgts.includes(q) && d2(q.x, q.y, t.x, t.y) < 170 * 170);
      if (t2) { addBolt(t.x, t.y, t2.x, t2.y, '#fff04d', 0.15); damageEnemy(t2, Math.max(3, dmg * BS.transfer), { tag: 'elec', noChain: true, quiet: true }); }
    }
  }
}
function checkExecute(e, o = {}) {
  if (e.dead || e.boss || !(e.corrode > 0) || e.hp <= 0) return false;
  const thr = Math.min(BS.execCap, BS.execPer * e.corrode);
  if (e.hp > e.maxHp * thr) return false;
  // 처형
  floatText(e.x, e.y - e.r - 20, '처형', TAG_COLOR.dark, 18);
  part({ x: e.x, y: e.y, life: 0.25, size: e.r * 2.2, color: '#9b6bff', kind: 'ring' });
  addBolt(e.x - 20, e.y - 20, e.x + 20, e.y + 20, '#9b6bff', 0.12); addBolt(e.x + 20, e.y - 20, e.x - 20, e.y + 20, '#9b6bff', 0.12);
  SFX.play('slash');
  killEnemy(e, Object.assign({}, o, { exec: true }));
  return true;
}
// 충돌 피해 (바람)
function slamEnemy(e, mult = 1) {
  if (e.dead) return;
  const dmg = (e.gustDmg * 0.5 + 12) * BS.slamMult * mult * dynDmg();
  e.gustT = 0;
  floatText(e.x, e.y - e.r - 20, '충돌!', TAG_COLOR.wind, 15);
  burst(e.x, e.y, TAG_COLOR.wind, 8, 200, 0.3, 3); shake(3); SFX.play('stun', 0.5);
  if (BS.cyclone) for (const t of room.enemies) if (t !== e && !t.dead && !t.spawning && d2(t.x, t.y, e.x, e.y) < 130 * 130 && !t.heavy && !t.boss) { const a = angTo(e.x, e.y, t.x, t.y); t.kx += Math.cos(a) * 260; t.ky += Math.sin(a) * 260; t.gustT = 0.4; t.gustDmg = e.gustDmg * 0.6; }
  damageEnemy(e, dmg, { noStatus: true });
}

// ================= 속성 반응 =================
function reactDmg(base) { return base * (1 + 0.15 * (run ? run.zone : 0)) * dynDmg(); }
function thermal(e) {
  e.burnT = 0; e.burnStacks = 0; e.chill = 0; e.chillT = 0; e.frozenT = 0;
  reaction('thermal', e.x, e.y);
  part({ x: e.x, y: e.y, vx: 0, vy: 0, life: 0.3, size: e.r * 2.5, color: '#ff8ad5', kind: 'ring' });
  damageEnemy(e, reactDmg(35), { noStatus: true, reaction: true });
}
function scald(e) {
  e.soakT = 0;
  reaction('scald', e.x, e.y);
  if (room.hazards.length < 140) addHazard({ type: 'scald', x: e.x, y: e.y, r: 90, life: 2.5, dmg: reactDmg(8) * BS.reactAmp });
}
function conduct(e, dmg) {
  e.soakT = 0;
  let n = 0;
  for (const t of room.enemies) {
    if (t === e || t.dead || t.spawning || !(t.soakT > 0) || d2(t.x, t.y, e.x, e.y) > 350 * 350) continue;
    addBolt(e.x, e.y, t.x, t.y, '#7fd0ff', 0.18); n++;
    damageEnemy(t, (dmg || 10) * 0.8 + reactDmg(8), { tag: 'elec', noChain: true, reaction: true, quiet: true });
  }
  if (n) reaction('conduct', e.x, e.y);
}
function magnetize(e) {
  if ((e.magCd || 0) > G.time) return;
  e.magCd = G.time + 1;
  reaction('magnet', e.x, e.y);
  for (const t of room.enemies) {
    if (t === e || t.dead || t.spawning || t.heavy || t.boss) continue;
    const d = dist(t.x, t.y, e.x, e.y);
    if (d < 230 && d > 1) { t.kx += (e.x - t.x) / d * 420; t.ky += (e.y - t.y) / d * 420; }
  }
  part({ x: e.x, y: e.y, life: 0.35, size: 230, color: '#c8d8ff', kind: 'ring' });
  damageEnemy(e, reactDmg(4 * e.shred), { noStatus: true, reaction: true });
}
function rust(e) {
  e.soakT = 0;
  e.shred = Math.min(BS.shredMax, (e.shred || 0) + 3); e.shredT = BS.shredDur;
  reaction('rust', e.x, e.y);
  damageEnemy(e, reactDmg(10), { noStatus: true, reaction: true });
}
function eclipse(e) {
  e.blindT = 0; e.dazzleT = 0; e.corrode = 0;
  reaction('eclipse', e.x, e.y);
  part({ x: e.x, y: e.y, life: 0.4, size: e.r * 3, color: '#d9b8ff', kind: 'ring' });
  damageEnemy(e, e.maxHp * (e.boss ? 0.04 : 0.2) + reactDmg(10), { noStatus: true, reaction: true });
}
let inTornado = false;
function tornado(e) {
  if (inTornado || (e.tornCd || 0) > G.time) return;
  inTornado = true; e.tornCd = G.time + 0.8;
  reaction('tornado', e.x, e.y);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; part({ x: e.x + Math.cos(a) * 30, y: e.y + Math.sin(a) * 30, vx: -Math.sin(a) * 200, vy: Math.cos(a) * 200, life: 0.5, size: 4, color: pick(['#ff7a2a', '#ffb86b']), kind: 'dot' }); }
  for (const t of room.enemies) if (t !== e && !t.dead && !t.spawning && d2(t.x, t.y, e.x, e.y) < 150 * 150) { applyStatus(t, 'fire', {}); damageEnemy(t, reactDmg(6), { noStatus: true, reaction: true, quiet: true }); }
  inTornado = false;
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
  for (const e of room.enemies) if (!e.dead && !e.spawning && pointInHazard(h, e.x, e.y)) { applyStatus(e, 'elec', { noChain: true }); damageEnemy(e, 15, { quiet: true, reaction: true }); }
  if (pointInHazard(h, P.x, P.y)) damagePlayer(8, null);
}
function strike(x, y) {
  addBolt(x + rand(-30, 30), y - 400, x, y, '#fff04d', 0.2);
  burst(x, y, '#fff04d', 10, 220, 0.3, 3);
  SFX.play('zap');
}
function reaction(id, x, y) {
  const R = REACTIONS[id];
  if (!R) return;
  if (!G.lastReact[id] || G.time - G.lastReact[id] > 0.6) {
    G.reactTexts.push({ text: R.name, color: R.color, t: 1.2 });
    if (G.reactTexts.length > 3) G.reactTexts.shift();
    G.lastReact[id] = G.time;
    SFX.play('reaction');
    floatText(x, y - 24, R.name, R.color, 18);
  }
  if (codex('reaction', id)) toast(`새 속성 반응 발견: <b style="color:${R.color}">${R.name}</b>`);
  if (run) run.reactions++;
  SAVE.stats.reactions++;
  addOd(2);
}

// ================= 처치 =================
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
  addOd(e.muts ? 10 : 2.5);
  if (o.exec) SAVE.stats.execs = (SAVE.stats.execs || 0) + 1;
  // 코인
  let coins = (def.coin || 1) * (e.muts ? 4 : 1) * comboMult() * BS.coinMult;
  coins = Math.floor(coins) + (Math.random() < coins % 1 ? 1 : 0);
  if (e.heldCoins) coins += e.heldCoins;
  dropCoins(e.x, e.y, coins);
  // 원소별 처치 효과 (서로 겹치지 않음)
  const near = (r) => room.enemies.filter(t => t !== e && !t.dead && !t.spawning && d2(t.x, t.y, e.x, e.y) < r * r);
  if (e.burnT > 0 && BS.fire3) { for (const t of near(150)) applyStatus(t, 'fire', {}); burst(e.x, e.y, '#ff7a2a', 12, 200, 0.5, 3); }
  if (e.frozenT > 0) {
    if (BS.shards) spawnShards(e.x, e.y, 6, 12, e);
    if (BS.aw.ice) for (const t of near(150)) if (!t.boss) freezeNow(t);
  }
  if (e.soakT > 0 && BS.puddleOnDeath && room.hazards.length < 130) addHazard({ type: 'water', x: e.x, y: e.y, r: 52, life: 8 });
  if (e.corrode > 0 && BS.curseblood && room.hazards.length < 130) addHazard({ type: 'shadow', x: e.x, y: e.y, r: 60, life: 5 });
  if (e.blindT > 0 && BS.refract) {
    for (const t of near(320).slice(0, 2)) fireBeam(angTo(e.x, e.y, t.x, t.y), 20 * BS.dmgMult, false, 'light', { x: e.x, y: e.y, range: dist(e.x, e.y, t.x, t.y) + 20, w: 3, noProc: true });
  }
  if (o.exec) {
    if (BS.souls) {
      const t = near(600).sort((a, b) => d2(a.x, a.y, e.x, e.y) - d2(b.x, b.y, e.x, e.y))[0];
      const a = t ? angTo(e.x, e.y, t.x, t.y) : rand(0, TAU);
      spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, r: 7, dmg: 15 * BS.dmgMult, team: 'p', life: 2.2, tag: 'dark', stacks: 2, homing: true, color: '#b58cff', wid: 'soul', noWall: true });
    }
    if (BS.reaper) P.reaperShots = 3;
    if (BS.cdRefund) P.skillCd = Math.max(0, P.skillCd - 1);
    if (BS.aw.dark) room.vortices.push({ x: e.x, y: e.y, t: 1.5, max: 1.5, r: 170, dmg: 6 * BS.dmgMult, tick: 0, tag: 'dark', stacks: 1 });
  }
  if (o.isExp && BS.chaindet) explode(e.x, e.y, 65 + 20 * (BS.chaindet - 1), 18 * BS.chaindet, { small: true, noSelf: true });
  else if (BS.exp5 && Math.random() < 0.35) explode(e.x, e.y, 55, 14, { small: true, noSelf: true });
  if (o.wid === 'sniper') { const w = run.weapons.find(w => w.id === 'sniper' && w.grade === 2); if (w) w.ammo = Math.min(wStats(w).mag, w.ammo + 1); }
  if (BS.vamp) { run.vampCount++; if (run.vampCount >= 30) { run.vampCount = 0; healRun(5 * BS.vamp, true); } }
  if (BS.berserk) run.berserk++;
}

function damagePlayer(dmg, src) {
  if (!P || P.dead || !room || room.over) return;
  if (P.rollT > 0 || P.iframe > 0) return;
  if (P.shield > 0) {
    P.shield--; P.iframe = 0.6; SFX.play('shield');
    part({ x: P.x, y: P.y, vx: 0, vy: 0, life: 0.3, size: 40, color: '#6dff8a', kind: 'ring' });
    return;
  }
  dmg *= G.eDmgMult * BS.takenMult;
  run.hp -= dmg; P.iframe = 0.75; P.hurtT = 0.25;
  breakCombo();
  if (BS.berserk) run.berserk = 0;
  shake(10); G.flash = 0.3; G.flashColor = '255,40,60'; hitstop(0.06, true); SFX.play('hurt');
  floatText(P.x, P.y - 24, '-' + Math.round(dmg), '#ff4d6d', 20);
  if (src && src.muts && src.muts.includes('vamp') && !src.dead) { src.hp = Math.min(src.maxHp, src.hp + src.maxHp * 0.25); floatText(src.x, src.y - src.r - 8, '흡혈', '#e0306a', 14); }
  const near = r => room.enemies.filter(e => !e.dead && !e.spawning && d2(e.x, e.y, P.x, P.y) < r * r);
  if (BS.flamearmor) for (const e of near(150)) applyStatus(e, 'fire', {});
  if (BS.frostarmor) for (const e of near(150)) applyStatus(e, 'ice', { stacks: 2 });
  if (BS.ironskin) for (const e of near(150)) applyStatus(e, 'metal', { stacks: 3 });
  if (run.hp > 0 && BS.medkit && !room.medkitUsed && run.hp <= run.maxHp * 0.3) { room.medkitUsed = true; healRun(25, true); floatText(P.x, P.y - 44, '응급 키트!', '#6dff8a', 16); }
  if (run.hp <= 0) {
    if (BS.revive && !room.revived) {
      room.revived = true; run.hp = Math.max(1, Math.round(run.maxHp * 0.5)); P.iframe = 2.5;
      floatText(P.x, P.y - 50, '불사!', TAG_COLOR.surv, 24); burst(P.x, P.y, TAG_COLOR.surv, 40, 360, 0.7, 4);
      part({ x: P.x, y: P.y, life: 0.6, size: 160, color: TAG_COLOR.surv, kind: 'ring' }); SFX.play('heal');
      return;
    }
    run.hp = 0; playerDie();
  }
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

// ================= 오버클럭 모드 (게이지가 가득 차면 F로 발동) =================
function addOd(n) {
  if (!run || !P || P.odT > 0) return;
  const before = run.od || 0;
  run.od = Math.min(100, before + n);
  if (before < 100 && run.od >= 100) { SFX.play('objective'); floatText(P.x, P.y - 50, '오버클럭 준비! [F]', '#ff3df0', 18); }
}
function activateOverdrive() {
  if (!run || (run.od || 0) < 100 || P.odT > 0 || P.dead) return;
  run.od = 0; P.odT = 8;
  G.banner = { text: 'OVERCLOCK!', sub: '8초간 연사 +60% · 피해 +50% · 적 감속', t: 1.4, color: '#ff3df0' };
  G.flash = 0.35; G.flashColor = '255,61,240'; shake(14); hitstop(0.06, true);
  SFX.play('skill'); SFX.play('reaction');
  for (const b of BULLETS) if (b.team === 'e' && d2(b.x, b.y, P.x, P.y) < 260 * 260) b.dead = true;
  for (const e of room.enemies) if (!e.dead && !e.spawning && !e.heavy && !e.boss && d2(e.x, e.y, P.x, P.y) < 220 * 220) { const a = angTo(P.x, P.y, e.x, e.y); e.kx += Math.cos(a) * 380; e.ky += Math.sin(a) * 380; }
  for (let i = 0; i < 3; i++) part({ x: P.x, y: P.y, life: 0.5 + i * 0.12, size: 120 + i * 90, color: '#ff3df0', kind: 'ring' });
  SAVE.stats.overdrives = (SAVE.stats.overdrives || 0) + 1;
}

// ================= 해킹: 약해진 적을 아군으로 =================
const HACKABLE = ['grunt', 'gunner', 'bomber', 'tank', 'splitter', 'mini', 'frostdrone', 'shield', 'snake', 'mimic'];
function canHack(e) { return !e.dead && !e.spawning && !e.boss && !e.bounty && !e.ally && HACKABLE.includes(e.type) && e.hp <= e.maxHp * 0.3; }
function hackEnemy(e, dur = 15) {
  const i = room.enemies.indexOf(e); if (i < 0) return;
  room.enemies.splice(i, 1);
  e.ally = true; e.allyT = dur; e.allyMax = dur; e.noReward = true; e.objTarget = false;
  e.hp = Math.max(e.hp, e.maxHp * 0.6); e.origColor = e.origColor || e.color; e.color = '#29f0ff';
  e.burnT = e.shockT = e.chillT = e.frozenT = e.blindT = e.soakT = e.corrodeT = e.shredT = 0; e.shred = e.corrode = e.chill = 0;
  e.contactCd = 0;
  room.hacked.push(e);
  SFX.play('hack'); burst(e.x, e.y, '#29f0ff', 24, 260, 0.5, 3);
  floatText(e.x, e.y - e.r - 16, '해킹 성공', '#29f0ff', 18);
  addCombo(); addOd(5);
  SAVE.stats.hacks = (SAVE.stats.hacks || 0) + 1;
}
