// ================= 런 시작 =================
function newRun(mode, charId, oc, seed) {
  const hpBonus = ['hp1', 'hp2', 'hp3'].filter(k => SAVE.unlocks[k]).length * 10;
  run = {
    mode, char: charId, oc: oc || 0, seed: seed || (Math.random() * 1e9) | 0, zone: 0, row: -1, col: -1, map: null,
    hp: 1, baseMaxHp: CHARS[charId].hp + hpBonus, maxHp: 0, coins: 0, coinsEarned: 0, weapons: [], cur: 0, bag: [], ups: {}, curses: {}, tags: {},
    kills: 0, combo: 0, comboT: 0, maxCombo: 0, bossesKilled: 0, vampCount: 0, berserk: 0, shotCounter: 0, lastWeapon: null,
    dodged: 0, reactions: 0, time: 0, helped: -1, allyNext: false, sealedNext: false, alarmNext: false, zonesCleared: 0, events: [], shop: null, arenaWave: 0
  };
  reseed(run.seed);
  recomputeBuild();
  run.hp = run.maxHp;
  run.weapons = [makeWeapon(CHARS[charId].weapon, 0)];
  codex('weapon', CHARS[charId].weapon);
  SAVE.stats.runs++; saveGame();
}
function startCampaign(charId, oc, mode, seed) {
  newRun(mode || 'campaign', charId, oc, seed);
  G.mode = run.mode;
  run.map = genMap(0);
  const go = () => { showMap(); radio(RADIO[0], () => { }); };
  if (SAVE.unlocks.qol_start) { reseed(run.seed + 17); openUpgradePick({ count: 3, title: '출격 준비: 시작 강화' }, go); }
  else go();
}

// ================= 경로 지도 생성 =================
function genMap(zone) {
  reseed(run.seed + zone * 7919 + 1);
  const rows = [];
  for (let r = 0; r < 6; r++) {
    const n = ri(2, 3), row = [];
    for (let i = 0; i < n; i++) row.push({ r, i, type: null, x: (i + 1) / (n + 1) + rr(-0.05, 0.05), next: [], obj: null, visited: false });
    rows.push(row);
  }
  const objs = ['exterminate', 'survive', 'defend', 'escort', 'collect', 'bounty'];
  for (const row of rows) for (const n of row) {
    if (n.r === 0) n.type = 'combat';
    else if (n.r === 5) n.type = rp(['rest', 'shop', 'rest', 'workshop']);
    else n.type = rweighted([
      ['combat', 44], ['elite', n.r >= 1 ? 14 : 0], ['shop', n.r >= 2 ? 11 : 0], ['workshop', 10], ['event', 13], ['rest', n.r >= 2 ? 8 : 0]
    ], x => x[1])[0];
  }
  // 상점/정비소 최소 1개 보장
  for (const need of ['shop', 'workshop']) {
    if (!rows.some(row => row.some(n => n.type === need))) { const row = rows[ri(2, 4)]; rp(row).type = need; }
  }
  for (const row of rows) for (const n of row) {
    if (n.type === 'combat') n.obj = zone === 0 && n.r === 0 ? 'exterminate' : rp(objs);
  }
  for (let r = 0; r < 5; r++) {
    const A = rows[r], B = rows[r + 1];
    for (const a of A) {
      let best = 0;
      for (let j = 1; j < B.length; j++) if (Math.abs(B[j].x - a.x) < Math.abs(B[best].x - a.x)) best = j;
      a.next = [best];
      const nb = best + (RNG() < 0.5 ? -1 : 1);
      if (B[nb] && RNG() < 0.55) a.next.push(nb);
    }
    B.forEach((b, j) => {
      if (!A.some(a => a.next.includes(j))) {
        let best = A[0];
        for (const a of A) if (Math.abs(a.x - b.x) < Math.abs(best.x - b.x)) best = a;
        best.next.push(j);
      }
    });
  }
  rows.push([{ r: 6, i: 0, type: 'boss', x: 0.5, next: [], visited: false }]);
  for (const n of rows[5]) n.next = [0];
  return rows;
}

function enterNode(r, i) {
  const node = run.map[r][i];
  run.row = r; run.col = i; node.visited = true;
  reseed(run.seed ^ (run.zone * 100003 + r * 1013 + i * 37 + 5));
  switch (node.type) {
    case 'combat': startRoom({ kind: 'combat', zone: run.zone, objective: node.obj, row: r }); break;
    case 'elite': startRoom({ kind: 'elite', zone: run.zone, objective: 'exterminate', row: r }); break;
    case 'boss': startRoom({ kind: 'boss', zone: run.zone, row: 6 }); break;
    case 'shop': showShop(); break;
    case 'workshop': showWorkshop(); break;
    case 'event': showEvent(); break;
    case 'rest': showRest(); break;
  }
  if (G.screen === 'combat') UI('');
}

function afterCombat(success, kind) {
  menuMode();
  const r = room; room = null;
  resetFx();
  for (const w of run.weapons) { w.reloadT = 0; const s = wStats(w); if (s.mag !== Infinity) w.ammo = s.mag; }
  run.combo = 0; run.comboT = 0;
  if (kind === 'boss') {
    run.zonesCleared++;
    if (run.zone === 1 && run.mode !== 'arena') SAVE.stats.zone2 = true;
    SAVE.stats.bestZone = Math.max(SAVE.stats.bestZone, run.zone + 1);
    saveGame();
    const heal = healRun(Math.round(run.maxHp * 0.25), true);
    if (heal) toast(`구역 돌파 보급: 체력 ${Math.round(heal)} 회복`);
    openUpgradePick({ count: 3, rare: true, title: `${ZONES[run.zone].name} 돌파! 보스 보상` }, nextZone);
    return;
  }
  void r;
  if (success) openUpgradePick({ count: 3, rare: kind === 'elite' }, showMap);
  else showMap();
}
function nextZone() {
  if (run.zone >= 3) { UI(''); radio(RADIO_END, () => endRun(true)); return; }
  run.zone++; run.map = genMap(run.zone); run.row = -1; run.col = -1;
  showMap();
  radio(RADIO[run.zone], () => { });
}

// ================= 런 종료 =================
function endRun(victory) {
  if (!run) return;
  if (radioState) { clearInterval(radioState.timer); radioState = null; }
  let chips, extra = '';
  if (run.mode === 'arena') {
    const wv = run.arenaWave || 0;
    chips = Math.max(1, Math.floor(wv * 1.5));
    const best = wv > SAVE.arenaBest; if (best) SAVE.arenaBest = wv;
    extra = `<span>아레나 최고</span><span>${SAVE.arenaBest}웨이브${best ? ' <b style="color:#ffe14d">NEW!</b>' : ''}</span>`;
  } else {
    chips = Math.max(1, run.zonesCleared * 8 + run.bossesKilled * 6 + Math.floor(run.kills / 25) + (victory ? 20 + run.oc * 5 : 0));
    if (victory) {
      SAVE.stats.clears++;
      if (run.mode === 'campaign' && run.oc >= SAVE.ocMax && SAVE.ocMax < 10) { SAVE.ocMax = run.oc + 1; extra += `<span>오버클럭</span><span style="color:#ff3df0">레벨 ${SAVE.ocMax} 해금!</span>`; }
    }
    if (run.mode === 'daily') {
      const score = run.zonesCleared * 2000 + run.kills * 10 + run.maxCombo * 20 + run.bossesKilled * 1000 + (victory ? 10000 : 0);
      const ds = todayStr(); const nb = !SAVE.daily[ds] || score > SAVE.daily[ds];
      if (nb) SAVE.daily[ds] = score;
      extra += `<span>일일 점수</span><span class="coin">${fmt(score)}${nb ? ' <b>NEW!</b>' : ''}</span>`;
    }
  }
  SAVE.chips += chips; SAVE.totalChips += chips;
  saveGame();
  SFX.play(victory ? 'win' : 'lose');
  const newly = CHAR_IDS.filter(id => CHARS[id].unlock && CHARS[id].unlock.check() && !SAVE.unlocks['char_' + id]);
  for (const id of newly) { SAVE.unlocks['char_' + id] = 1; extra += `<span>새 요원</span><span style="color:${CHARS[id].color}">${CHARS[id].name} 해금!</span>`; }
  saveGame();
  room = null; resetFx();
  showResults(victory, chips, extra);
}

// ================= 무한 아레나 =================
function startArena(charId) {
  newRun('arena', charId, 0);
  G.mode = 'arena';
  newRoom('arena', 0, 1700, 1150);
  setScaling(0, 1);
  resetFx();
  room.sx = room.w / 2; room.sy = room.h / 2 + 160;
  const W = room.w, H = room.h;
  for (const [x, y] of [[0.25, 0.28], [0.75, 0.28], [0.25, 0.72], [0.75, 0.72]]) room.walls.push({ x: W * x - 55, y: H * y - 40, w: 110, h: 80, hp: Infinity, kind: 'block' });
  for (const [x, y] of [[0.5, 0.2], [0.12, 0.5], [0.88, 0.5]]) addHazard({ type: 'oil', x: W * x, y: H * y, r: 70 });
  for (const [x, y] of [[0.38, 0.5], [0.62, 0.5]]) addHazard({ type: 'water', x: W * x, y: H * y, r: 65 });
  addHazard({ type: 'slick', x: W * 0.5, y: H * 0.82, r: 120 });
  arenaBarrels();
  createPlayer(room.sx, room.sy);
  setupObjective('arena');
  G.screen = 'combat'; G.paused = false; UI('');
  updateCamera(0, true);
}
function arenaBarrels() {
  room.props = room.props.filter(p => p.type !== 'barrel');
  for (const [x, y] of [[0.1, 0.12], [0.9, 0.12], [0.1, 0.88], [0.9, 0.88], [0.5, 0.35], [0.5, 0.65]]) room.props.push({ type: 'barrel', x: room.w * x, y: room.h * y, r: 15, hp: 20, shootable: true });
}
function arenaSpawnTable() { return ZONES[Math.min(3, Math.floor(((room.obj && room.obj.wave) || 1) / 4))].spawn; }
function startArenaWave() {
  const ob = room.obj;
  ob.wave++; run.row = ob.wave;
  const z = Math.min(3, Math.floor((ob.wave - 1) / 5));
  room.zone = z; run.zone = z;
  setScaling(z, ob.wave);
  room.eliteChance = Math.min(0.35, 0.02 * ob.wave);
  room.muts2 = ob.wave >= 25;
  if (ob.wave % 10 === 0) {
    ob.boss = true; room.bossDead = false; room.twins = null;
    const ids = ['crusher', 'frost', 'twins', 'mother'];
    setupBoss(ids[(ob.wave / 10 - 1) % 4]);
  } else {
    ob.boss = false; ob.left = Math.round((6 + ob.wave * 2) * BS.enemyMult); ob.spawnT = 0;
    G.banner = { text: `웨이브 ${ob.wave}`, t: 1.2, color: '#29f0ff' };
  }
  ob.state = 'fight';
}
function updateArena(dt, alive) {
  const ob = room.obj;
  if (ob.state === 'break') { ob.bt -= dt; if (ob.bt <= 0) startArenaWave(); return; }
  if (ob.boss) { if (room.bossDead) arenaWaveCleared(); return; }
  ob.spawnT -= dt;
  if (ob.left > 0 && ob.spawnT <= 0 && alive < 30) {
    ob.spawnT = 0.55;
    const n = Math.min(ob.left, randi(1, 3));
    for (let i = 0; i < n; i++) spawnOne();
    ob.left -= n;
  }
  if (ob.left <= 0 && alive === 0) arenaWaveCleared();
}
function arenaWaveCleared() {
  const ob = room.obj;
  ob.state = 'break'; ob.bt = 3; room.bossDead = false; ob.boss = false;
  run.arenaWave = ob.wave;
  SFX.play('objective');
  G.banner = { text: `웨이브 ${ob.wave} 클리어`, t: 1.4, color: '#6dff8a' };
  for (const b of BULLETS) if (b.team === 'e') b.dead = true;
  if (BS.regen) healRun(BS.regen, true);
  healRun(15);
  if (ob.wave % 5 === 0) {
    const s = freeSpot(18, 0, 60, (x, y) => d2(x, y, P.x, P.y) < 300 * 300) || { x: P.x + 60, y: P.y };
    room.props.push({ type: 'chest', x: s.x, y: s.y, r: 18, interact: '[E] 무기 상자 열기' });
    arenaBarrels();
  }
  if (ob.wave % 3 === 0) openUpgradePick({ count: 3, rare: ob.wave % 9 === 0, title: `웨이브 ${ob.wave} 보상` }, () => { });
}

// ================= 메인 루프 =================
function update(dt, rdt) {
  G.time += rdt;
  run.time += dt;
  if (G.bossIntro) { G.bossIntro.t -= rdt; if (G.bossIntro.t <= 0) G.bossIntro = null; }
  if (G.objBanner) G.objBanner.t -= rdt;
  if (G.banner) { G.banner.t -= rdt; if (G.banner.t <= 0) G.banner = null; }
  updatePlayer(dt);
  updateAllies(dt);
  if (!G.bossIntro) updateEnemies(dt);
  updateBullets(dt);
  updateVortices(dt);
  updateHazards(dt);
  updateProps(dt);
  updatePickups(dt);
  updateRoom(dt);
  if (room.leaving) { afterCombat(room.success, room.kind); return; }
  if (room.ending) { endRun(false); return; }
  updateParticles(dt);
  for (let i = G.texts.length - 1; i >= 0; i--) { const t = G.texts[i]; t.t -= rdt; t.y += t.vy * rdt; t.vy *= 0.94; if (t.t <= 0) G.texts.splice(i, 1); }
  for (let i = G.bolts.length - 1; i >= 0; i--) { G.bolts[i].t -= rdt; if (G.bolts[i].t <= 0) G.bolts.splice(i, 1); }
  for (let i = G.reactTexts.length - 1; i >= 0; i--) { G.reactTexts[i].t -= rdt; if (G.reactTexts[i].t <= 0) G.reactTexts.splice(i, 1); }
  G.flash = Math.max(0, G.flash - rdt * 1.5);
  G.shakeAmt = Math.max(0, G.shakeAmt - rdt * 40);
  updateCamera(rdt);
}

let lastT = performance.now();
function frame(now) {
  const rdt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  pollGamepad();
  if (Input.gp && Input.gp.pause) { if (G.paused) resumeGame(); else pauseGame(); }
  try {
    if (G.screen === 'combat' && !G.paused && room) {
      let dt = rdt;
      if (G.hitstop > 0) { G.hitstop -= rdt; dt = 0; }
      else if (G.bossIntro) dt = rdt * 0.2;
      else if (G.slowmo > 0) { G.slowmo -= rdt; dt = rdt * 0.3; }
      update(dt, rdt);
      if (room && (G.screen === 'combat' || G.screen === 'overlay')) render();
      else renderMenuBG(rdt);
    } else if (room && P && (G.screen === 'overlay' || G.paused)) {
      render();
    } else renderMenuBG(rdt);
  } catch (err) {
    console.error(err);
  }
  endInputFrame();
  requestAnimationFrame(frame);
}

function onGlobalKey(e) {
  SFX.init();
  if (e.code === 'Escape') {
    if (G.paused) resumeGame();
    else if (G.screen === 'combat') pauseGame();
  }
  if ((e.code === 'Space' || e.code === 'Enter') && radioState) { e.preventDefault(); advanceRadio(); }
}
addEventListener('blur', () => { if (G.screen === 'combat' && !G.paused) pauseGame(); });

// ================= 시작 =================
loadSave();
recomputeBuild();
initInput();
showTitle();
requestAnimationFrame(frame);
