// ================= 시즌 3: 아웃랜드 (OUTLANDS) =================
// 시즌 2를 클리어하면 열린다. 도시 밖으로 나가 대륙을 가로지른다. 구역 번호 run.zone은 0~3, 실제 구역 데이터는 ZONES[8~11].
function isS3() { return !!run && run.mode === 'season3'; }
function zoneBase() { return isS2() ? 4 : isS3() ? 8 : 0; }
function s3Unlocked() { return (SAVE.stats.s2clear || 0) > 0; }
function s3Save() { if (!SAVE.s3) SAVE.s3 = { endings: {}, last: null }; if (!SAVE.s3.endings) SAVE.s3.endings = {}; return SAVE.s3; }

ZONES.push(
  { name: '경계 방벽', en: 'THE PERIMETER', bg: '#0b1015', grid: '#1b2a36', accent: '#7fb0d0', wall: '#1c2c3a', edge: '#a8d4ee', boss: 'warden', layout: 'wall',
    spawn: { grunt: 2, scav: 2.2, riot: 1.8, sdrone: 1.6, sentry: 1.2, mender: 0.8 } },
  { name: '황무지 고속도로', en: 'WASTELAND HIGHWAY', bg: '#1a1208', grid: '#3a2b12', accent: '#e8a840', wall: '#3a2a14', edge: '#ffc866', boss: 'roadreaper', layout: 'highway',
    spawn: { scav: 2, biker: 2.4, burrower: 2, grunt: 1.4, bomber: 1.4, gunner: 1.4, mender: 0.8 } },
  { name: '신호의 평원', en: 'SIGNAL FIELDS', bg: '#06121a', grid: '#0f3040', accent: '#40e4ff', wall: '#0f2a38', edge: '#88f4ff', boss: 'relay', layout: 'signal',
    spawn: { orb: 2.4, sdrone: 1.8, biker: 1.2, sentry: 1.5, shade: 1, burrower: 1, mender: 1.1, tele: 0.8 } },
  { name: '자오선 탑', en: 'MERIDIAN SPIRE', bg: '#0e0a18', grid: '#2a2050', accent: '#f0e4ff', wall: '#22183e', edge: '#e8dcff', boss: 'council', layout: 'spire',
    spawn: { sentry: 1.6, riot: 1.4, orb: 1.4, biker: 1.2, mender: 1.2, tele: 1.2, mimic: 1, shield: 1, scav: 0.8 } }
);
Object.assign(BOSS_INFO, {
  warden: { name: '워든', sub: '경계 방벽의 수문장', desc: '엄폐물 뒤에서 저격한다. 조준선이 뜨면 옆으로 피하고, 엄폐물은 부술 수 있다.' },
  roadreaper: { name: '로드 리퍼', sub: '황무지의 도로 지배자', desc: '경고가 뜬 차선을 통째로 쓸고 간다. 지나간 직후 과열되어 2배 피해를 받는다.' },
  relay: { name: '릴레이', sub: '신호 중계 기계', desc: '플레이어와 반대편에서 움직이며 따라 쏘는 분신을 만든다. 낙뢰와 링 탄막.' },
  council: { name: '메리디안 합의체', sub: '세 의장', desc: '붉고 푸르고 초록인 세 의장을 모두 쓰러뜨려라. 하나가 쓰러질수록 나머지가 빨라진다.' }
});
Object.assign(ENEMY_INFO, {
  scav: { name: '약탈자', hp: 30, desc: '닿으면 코인을 훔쳐 도망친다. 도망치기 전에 쓰러뜨리면 되찾는다.' },
  biker: { name: '바이커', hp: 40, desc: '거리를 두고 조준선을 띄운 뒤 일직선으로 돌진한다.' },
  burrower: { name: '모래 지렁이', hp: 50, desc: '땅속으로 숨어 접근했다가 솟아오르며 탄막을 뿌린다. 땅속에서는 무적.' },
  orb: { name: '정전기 구체', hp: 35, desc: '불규칙하게 떠다니며 전기 탄을 쏜다. 죽으면 정전기 지대가 남는다.' },
  mender: { name: '수리 로봇', hp: 45, desc: '도망 다니며 주변 적을 치료한다. 먼저 잡아라.' }
});
HACKABLE.push('scav', 'biker', 'burrower', 'orb', 'mender');
NODE_INFO.caravan = { name: '상단', icon: '🚚', color: '#ffb347' };

// ---------- 무기 · 강화 ----------
Object.assign(WEAPONS, {
  railgun: { name: '레일건', dmg: 95, rate: 0.7, mag: 4, reload: 2.0, spd: 2400, spread: 0, pellets: 1, life: 0.7, tag: 'metal', pierce: 99, r: 4, shake: 8, sfx: 'sniper', color: '#bfe8ff', knock: 120, desc: '전자기로 쏘는 관통탄. 느리지만 일렬로 선 적을 모두 꿰뚫는다.' },
  sandblaster: { name: '모래분사기', dmg: 5, rate: 3, mag: 14, reload: 1.6, spd: 700, spread: 0.5, pellets: 7, life: 0.32, tag: 'wind', pierce: 99, r: 5, shake: 3, sfx: 'shotgun', color: '#e8c070', knock: 140, desc: '모래를 부채꼴로 뿜어 적을 밀어낸다. 벽에 부딪히게 하라.' }
});
WEAPON_IDS.push('railgun', 'sandblaster');
Object.assign(LEGEND, {
  railgun: { name: '궤도포', desc: '피해 +35%' },
  sandblaster: { name: '사막의 폭풍', desc: '분사 +3발, 사거리 +40%' }
});
UPGRADES.push(
  { id: 'ironhide', name: '방벽 장갑', tag: 'none', desc: '받는 피해 -8%', max: 2 },
  { id: 'scavengersense', name: '고철 감각', tag: 'none', desc: '코인 획득 +20%', max: 2 },
  { id: 'grounding', name: '접지 장치', tag: 'none', desc: '환경 피해(바닥 · 낙뢰 · 지뢰 · 정전기)를 절반으로' },
  { id: 'signalboost', name: '신호 증폭', tag: 'none', desc: '해킹 아군 지속 +8초, 아군 피해 +30%' }
);
for (const u of UPGRADES) UPG[u.id] = u;

// ---------- 새 요원 ----------
Object.assign(CHARS, {
  harin: { affinity: 'ice', name: '하린', bio: '요원 04. 냉각 시설에서 일곱 번 구조 신호를 보냈고, 일곱 번 답을 받지 못했다. 이제는 언니의 통신기 옆에서 같이 듣는다.', role: '서리 저격', color: '#8fe8ff', hp: 140, weapon: 'cryo', startGrade: 1, skill: '서리 파동', skillDesc: '주변 300 안의 적을 2.5초 얼리고(보스는 빙결 중첩) 3초간 이동 속도 +20%', cd: 14, passive: '얼어붙은 적이 받는 피해 +25%', unlock: { cond: '시즌 3 구역 2 도달', chips: 70, check: () => (SAVE.stats.s3best || 0) >= 2 } },
  doyun: { affinity: 'metal', name: '도윤', bio: '요원 03. 서버실의 랙 사이에서 가장 오래 깨어 있었던 방패. 돌아와서 가장 먼저 한 일은 열 벌의 전투복을 한 벌씩 접는 것이었다.', role: '방벽', color: '#6dd5ff', hp: 190, weapon: 'riotgun', startGrade: 1, skill: '방벽 전개', skillDesc: '3초간 받는 피해 -80%, 보호막 2회, 분신 생성', cd: 12, passive: '받는 피해 -10%, 방에 들어갈 때 보호막 +1', unlock: { cond: '시즌 3 클리어', chips: 90, check: () => (SAVE.stats.s3clear || 0) > 0 } }
});
CHAR_IDS.push('harin', 'doyun');
UNLOCKS.push(
  { id: 'char_harin', cat: '캐릭터', name: '하린 (서리 저격)', desc: '서리 파동 스킬. 조건: 시즌 3 구역 2 도달', cost: 70 },
  { id: 'char_doyun', cat: '캐릭터', name: '도윤 (방벽)', desc: '방벽 전개 스킬. 조건: 시즌 3 클리어', cost: 90 }
);
function useSkillS3(id) {
  if (id === 'harin') {
    for (const e of liveNear(300)) { if (e.boss) applyStatus(e, 'ice', { stacks: 3 }); else freezeNow(e, 2.5); }
    P.moveBoostT = 3; part({ x: P.x, y: P.y, life: 0.5, size: 300, color: '#8fe8ff', kind: 'ring' }); SFX.play('cryo'); shake(5);
    floatText(P.x, P.y - 40, '서리 파동', '#8fe8ff', 18);
  } else if (id === 'doyun') {
    P.fortT = 3; P.shield = (P.shield || 0) + 2;
    room.allies.push({ type: 'decoy', x: P.x, y: P.y, t: 3, max: 3, r: 13 });
    part({ x: P.x, y: P.y, life: 0.5, size: 90, color: '#6dd5ff', kind: 'ring' }); floatText(P.x, P.y - 40, '방벽 전개', '#6dd5ff', 18);
  }
}

// ---------- 세력 평판 · 시즌 2 결말 이월 ----------
Object.assign(REP_NAME, { mer: '자오선 연합', car: '유목 상단', fer: '야생 기계' });
Object.assign(REP_COLOR, { mer: '#f0e4ff', car: '#ffb347', fer: '#6aff9a' });
const S3_REP = ['mer', 'car', 'fer'];
function s3TopInfo() {
  const r = run.rep || {};
  return `&nbsp; <span class="small">${S3_REP.map(k => `<span style="color:${REP_COLOR[k]}">${REP_NAME[k]} ${r[k] || 0}</span>`).join(' · ')} · <span style="color:#ffe14d">키 ${s2KeyCount()}/11</span> · <span class="muted">동행 ${({ A: '마더보드', B: '한 국장', C: '시민들' })[run.carry] || '-'}</span></span>`;
}
function s3PriceMult() { return (1 - 0.05 * clamp((run.rep && run.rep.car) || 0, -3, 5)) * (run.carry === 'B' ? 0.92 : 1); }

// recomputeBuild 끝에서 호출 (BS 기본값 포함)
function s3Build() {
  BS.envResist = 1; BS.allyBoost = 1; BS.hackThr = 0;
  if (!run) return;
  const u = id => run.ups[id] || 0;
  BS.takenMult *= Math.pow(0.92, u('ironhide'));
  BS.coinMult *= 1 + 0.2 * u('scavengersense');
  if (u('grounding')) BS.envResist = 0.5;
  BS.hackDur = (BS.hackDur || 0) + 8 * u('signalboost'); BS.allyBoost *= 1 + 0.3 * u('signalboost');
  if (run.char === 'harin') BS.frozenBonus += 0.25;
  if (run.char === 'doyun') { BS.takenMult *= 0.9; BS.crewShield = (BS.crewShield || 0) + 1; }
  if (run.mode !== 'season3') return;
  const r = run.rep || {};
  if (r.mer >= 2) BS.crewShield = (BS.crewShield || 0) + 1;
  if (r.car >= 2) BS.coinMult *= 1.15;
  if (r.fer >= 2) { BS.hackThr = 0.15; BS.allyBoost *= 1.2; }
  if (run.carry === 'B') run.crewHp = (run.crewHp || 0) + 20;
}

// ---------- 시작 · 지도 · 결말 ----------
function startSeason3(charId, oc, hard) {
  clearRun('season3');
  newRun('season3', charId, oc, 0, hard);
  G.mode = run.mode;
  run.season = 3; run.rep = { mer: 0, car: 0, fer: 0 }; run.crew = []; run.momAssist = 0;
  run.carry = (SAVE.s2 && SAVE.s2.last) || 'B';
  if (run.carry === 'A') run.od = 50;
  if (run.carry === 'C') run.coins += 60;
  recomputeBuild(); run.hp = run.maxHp;
  run.map = genMap(0);
  const go = () => showChapter(3, 0, showMap);
  const intro = () => showCutscene(cutS3Intro(run.carry), go, { ch: 'SEASON 3', name: '아웃랜드', sub: '방벽 너머', id: 's3cut0' });
  if (SAVE.unlocks.qol_start) { reseed(run.seed + 17); openUpgradePick({ count: 3, title: '출격 준비: 시작 강화' }, intro); }
  else intro();
}
function s3TitleButtons() {
  if (!s3Unlocked()) return `<button class="btn" disabled title="시즌 2를 클리어하면 열립니다">🔒 시즌 3 · 아웃랜드 <span class="small">(시즌 2 클리어 시 해금)</span></button>`;
  const r = peekRun('season3');
  return (r ? `<button class="btn big ye" onclick="${cb(() => resumeRun('season3'))}">▶ 시즌 3 이어하기 <span class="muted small">${CHARS[r.char].name} · 구역 ${r.zone + 1}</span></button>` : '') +
    `<button class="btn ${r ? '' : 'big '}ye" onclick="${cb(() => showCharSelect('season3'))}">${r ? '시즌 3 새로 시작' : '★ 시즌 3 · 아웃랜드'}</button>`;
}
function s3MapNodes(rows) {
  const cand = [];
  for (let r = 1; r <= 4; r++) for (const n of rows[r]) if (n.type !== 'shop' && n.type !== 'workshop') cand.push(n);
  const k = 1 + (RNG() < 0.6 ? 1 : 0);
  for (let i = 0; i < k && cand.length; i++) { const n = cand.splice(Math.floor(RNG() * cand.length), 1)[0]; n.type = 'caravan'; n.obj = null; }
}
function s3Finale() {
  run.ended = true; clearRun(run.mode); UI('');
  const r = run.rep || {}, best = Math.max(r.mer || 0, r.car || 0, r.fer || 0);
  let end = 'B';
  if (best > 0) { const top = S3_REP.filter(k => (r[k] || 0) === best); end = top.length > 1 ? 'B' : ({ mer: 'A', car: 'B', fer: 'C' })[top[0]]; }
  const s = s3Save(); s.endings[end] = 1; s.last = end; saveGame();
  const E = S3_ENDINGS[end];
  run.endingName = `엔딩 ${end} · ${E.name}`;
  showCutscene(E.lines(), () => endRun(true), { ch: 'ENDING ' + end, name: E.name, sub: E.sub, id: 's3end' + end });
}

// ---------- 상단(캐러밴) 노드: 물물교환 ----------
function showCaravan() {
  menuMode();
  const key = `${run.zone}-${run.row}-${run.col}`;
  if (!run.cvn || run.cvn.key !== key) run.cvn = { key, done: [] };
  const done = run.cvn.done, pm = s3PriceMult();
  const deals = [
    { id: 'rare', t: `코인 ${Math.round(70 * pm)} → 희귀 강화 선택`, can: () => run.coins >= Math.round(70 * pm), act: () => { run.coins -= Math.round(70 * pm); openUpgradePick({ count: 3, rare: true, sub: '상단 거래: 희귀 강화 포함' }, showCaravan); } },
    { id: 'blood', t: '체력 25 → 코인 +60', can: () => run.hp > 30, act: () => { hurtRun(25); run.coins += 60; toast('코인 +60'); showCaravan(); } },
    { id: 'curse', t: `코인 ${Math.round(90 * pm)} → 저주 하나 해제`, can: () => Object.keys(run.curses).length > 0 && run.coins >= Math.round(90 * pm), act: () => { run.coins -= Math.round(90 * pm); delete run.curses[Object.keys(run.curses)[0]]; recomputeBuild(); toast('저주를 해제했다'); showCaravan(); } },
    { id: 'swap', t: '지금 무기 ↔ 같은 등급의 다른 무기 (+개조 부품)', can: () => true, act: () => { const w = makeWeapon(randomWeaponId(curW().id), curW().grade); const m = rp(MOD_IDS); offerWeapon(w, () => offerMod(m, showCaravan)); } },
    { id: 'supply', t: `코인 ${Math.round(40 * pm)} → 오버클럭 게이지 가득 + 체력 20`, can: () => run.coins >= Math.round(40 * pm), act: () => { run.coins -= Math.round(40 * pm); run.od = 100; healRun(20, true); toast('보급 완료'); showCaravan(); } }
  ];
  scr(`${topbar()}<div class="panel evbox" style="border-color:#ffb347"><div style="font-size:48px">🚚</div><h2 style="color:#ffb347">유목 상단</h2>
    <div class="desc">"어서 와, 손님. 여긴 가게가 아니라 길 위의 시장이야. 흥정은 한 번에 하나씩."</div>
    <div class="col">${deals.map(d => { const used = done.includes(d.id), ok = !used && d.can(); return `<button class="btn" style="min-width:min(460px,86vw)" ${ok ? '' : 'disabled'} onclick="${cb(() => { done.push(d.id); if (done.length === 1) run.rep.car = clamp((run.rep.car || 0) + 1, -5, 5); SFX.play('coin'); d.act(); })}">${used ? '✔ ' : ''}${d.t}</button>`; }).join('')}
      <button class="btn ye" onclick="${cb(showMap)}">떠나기</button></div></div>`);
}

// ---------- 시즌 3 이벤트 20종 ----------
EVENTS.push(
  { id: 'checkpt', s3: true, name: '연합 검문소', icon: '🛂', desc: '자오선 연합의 이동식 검문소. 드론이 신분 인증을 요구한다.',
    choices: [
      { t: '인증한다 (코인 20)', can: () => run.coins >= 20, act: () => { run.coins -= 20; return { text: '"환영합니다, 네온 시티의 요원."' + addRep('mer', 2) }; } },
      { t: '뇌물을 쥐여 준다 (코인 40, 무작위 강화)', can: () => run.coins >= 40, act: () => { run.coins -= 40; return { text: '드론이 눈을 감았다. ' + evUp() + addRep('car', 1) + addRep('mer', -1) }; } },
      { t: '우회한다 (피해 10)', act: () => { hurtRun(10); return { text: '철조망에 긁혔지만 아무도 못 봤다.' }; } }
    ] },
  { id: 'tollbot', s3: true, name: '통행료 징수 로봇', icon: '🚧', desc: '"통행료 25. 현금만 받습니다." 길을 가로막은 낡은 로봇이 안내문을 반복한다.',
    choices: [
      { t: '낸다 (코인 25)', can: () => run.coins >= 25, act: () => { run.coins -= 25; return { text: '"안전한 여행 되십시오."' }; } },
      { t: '해킹한다 (50%: 코인 +30 / 50%: 피해 12)', act: () => RNG() < 0.5 ? (run.coins += 30, { text: '로봇의 금고가 열렸다. 코인 +30.' + addRep('fer', 1) }) : (hurtRun(12), { text: '방전 반격! 피해 12.' }) },
      { t: '부순다 (코인 +15)', act: () => { run.coins += 15; return { text: '잔해에서 동전이 쏟아졌다.' + addRep('fer', -1) }; } }
    ] },
  { id: 'wreckmarket', s3: true, name: '폐차 시장', icon: '🛻', desc: '고속도로 갓길에 천막이 늘어서 있다. 부품은 전부 중고지만 상태는 괜찮다.',
    choices: [
      { t: '코인 35로 부품을 산다', can: () => run.coins >= 35, act: () => { run.coins -= 35; return { text: '"깎아 줬어. 다음에도 와."' + addRep('car', 1), then: evMod() }; } },
      { t: '가진 걸 판다 (코인 +30)', act: () => { run.coins += 30; return { text: '상인이 값을 후하게 쳐 줬다.' + addRep('car', 1) }; } }
    ] },
  { id: 'feralplea', s3: true, name: '야생 기계의 부탁', icon: '🦾', desc: '다리 하나를 잃은 야생 기계가 다가온다. 적의는 없다. "고쳐 줄 수 있나. 우리는 부품이 필요하다."',
    choices: [
      { t: '고쳐 준다 (코인 30, 다음 전투 동행)', can: () => run.coins >= 30, act: () => { run.coins -= 30; run.allyNext = true; return { text: '야생 기계가 고개를 숙였다. "빚을 졌다."' + addRep('fer', 2) }; } },
      { t: '쫓아낸다', act: () => ({ text: '기계는 말없이 모래 속으로 사라졌다.' + addRep('fer', -2) + addRep('mer', 1) }) }
    ] },
  { id: 'oasis', s3: true, name: '오아시스 정수장', icon: '💧', desc: '모래 속에 반쯤 묻힌 정수장. 아직 맑은 물이 나온다.',
    choices: [
      { t: '마신다 (체력 35)', act: () => { healRun(35, true); return { text: '십 년 묵은 물이 이렇게 맑을 줄이야.' }; } },
      { t: '병에 담아 판다 (코인 +30)', act: () => { run.coins += 30; return { text: '물은 어디서나 비싸다.' + addRep('car', 1) }; } }
    ] },
  { id: 'wormnest', s3: true, name: '지렁이 둥지', icon: '🪱', desc: '모래 구멍마다 반짝이는 것이 있다. 지렁이 기계가 모은 부품이다.',
    choices: [
      { t: '캐낸다 (피해 14, 희귀 강화 선택)', act: () => { hurtRun(14); return { text: '진동이 울렸다! 서둘러 챙겼다.', then: evPick(true, '지렁이 둥지: 희귀 강화 포함') }; } },
      { t: '지나간다', act: () => ({ text: '발밑이 진동했다. 서둘러 벗어났다.' }) }
    ] },
  { id: 'solarfarm', s3: true, name: '연합의 태양광 농장', icon: '☀', desc: '연합이 세운 태양광 패널이 끝없이 이어진다. 아직 일부는 전력을 만든다.',
    choices: [
      { t: '전력을 끌어 쓴다 (전기 강화)', act: () => ({ text: '패널에서 전기가 흘러들었다. ' + evUp(evTag('elec')) + addRep('mer', 1) }) },
      { t: '패널을 떼어 판다 (코인 +40)', act: () => { run.coins += 40; return { text: '패널은 훌륭한 고철이다.' + addRep('mer', -1) + addRep('car', 1) }; } }
    ] },
  { id: 'convoy', s3: true, name: '상단 호송대', icon: '🚛', desc: '화물차 십여 대가 모래 먼지를 일으키며 지나간다. 호송 요원이 손짓한다. "같이 갈래?"',
    choices: [
      { t: '호송에 합류한다 (다음 전투 동행, 체력 15)', act: () => { run.allyNext = true; healRun(15, true); return { text: '호송차 위에서 먹는 통조림은 꿀맛이었다.' + addRep('car', 2) }; } },
      { t: '거절한다', act: () => ({ text: '화물차의 뒷불이 멀어졌다.' }) }
    ] },
  { id: 'feralarchive', s3: true, name: '야생 기계의 기억 저장소', icon: '🗃', desc: '녹슨 컨테이너 안에 기계들이 십 년 동안 모은 이야기가 쌓여 있다.',
    choices: [
      { t: '읽는다 (강화 선택)', act: () => ({ text: '「인간이 사라진 뒤 우리는 서로를 불렀다.」 낯선 시였다.' + addRep('fer', 1), then: evPick(false) }) },
      { t: '통째로 가져간다 (코인 +35)', act: () => { run.coins += 35; return { text: '저장소가 비명을 지르듯 꺼졌다.' + addRep('fer', -2) }; } }
    ] },
  { id: 'merscout', s3: true, name: '연합 정찰 드론', icon: '🛰', desc: '추락한 연합 정찰 드론. 전원은 남아 있다.',
    choices: [
      { t: '교신을 연결한다 (오버클럭 게이지 가득)', act: () => ({ text: '"좌표 수신. 지원하겠습니다."' + addRep('mer', 1) + ' ' + evOd(100) }) },
      { t: '분해한다 (개조 부품)', act: () => ({ text: '센서를 뜯어냈다.' + addRep('mer', -1), then: evMod() }) }
    ] },
  { id: 'railwreck', s3: true, name: '추락한 궤도 운반선', icon: '🚀', desc: '모래에 박힌 궤도 운반선. 무기 상자가 하나 남아 있다.',
    choices: [
      { t: '상자를 연다 (희귀 이상 무기, 다음 전투 엘리트 변이 2개)', act: () => { run.sealedNext = true; const o = evWeapon(RNG() < 0.35 ? 2 : 1); return { text: `경보가 울린다! ${weaponName(o.w)}.`, then: o.then }; } },
      { t: '지나간다', act: () => ({ text: '불길한 징조는 피하는 게 좋다.' }) }
    ] },
  { id: 'roadbar', s3: true, name: '휴게소 술집', icon: '🍺', desc: '고속도로 휴게소에서 유일하게 불이 켜진 곳. 여행자들이 소문을 나눈다.',
    choices: [
      { t: '한 잔 한다 (코인 15, 체력 25, 게이지 +40)', can: () => run.coins >= 15, act: () => { run.coins -= 15; healRun(25, true); return { text: '"탑 위에는 세 개의 눈이 있다더라." ' + evOd(40) }; } },
      { t: '소문만 듣고 나간다', act: () => ({ text: '"연합이 불을 켜 주는 대신 가져가는 게 있다던데."' }) }
    ] },
  { id: 'djbot', s3: true, name: '라디오 DJ 로봇', icon: '📻', desc: '십 년째 같은 주파수에서 방송을 하고 있는 로봇. "청취자님, 신청곡 있나요?"',
    choices: [
      { t: '신청곡을 보낸다 (체력 20, 게이지 +30)', act: () => { healRun(20, true); return { text: '옛 노래가 모래바람 속에 퍼졌다. ' + evOd(30) + addRep('fer', 1) }; } },
      { t: '주파수를 돌린다', act: () => ({ text: '잡음 사이로 어떤 목소리가 지나갔다. 「…응답하라…」' }) }
    ] },
  { id: 'shelter', s3: true, name: '모래폭풍 대피소', icon: '⛺', desc: '폭풍을 피해 모여든 상인과 여행자들. 자리가 조금 남아 있다.',
    choices: [
      { t: '쉬었다 간다 (체력 전부)', act: () => { run.hp = run.maxHp; return { text: '밖은 폭풍이었지만 안은 따뜻했다.' + addRep('car', 1) }; } },
      { t: '자리를 양보하고 간다 (최대 체력 +8)', act: () => { changeMaxHp(8); return { text: '아이가 손을 흔들었다.' + addRep('car', 2) }; } }
    ] },
  { id: 'secretdoc', s3: true, name: '연합 비밀 문서', icon: '📄', desc: '찢어진 서류 더미. 「프로메테우스」라는 단어가 반복된다.',
    choices: [
      { t: '연합에 돌려준다 (코인 +30)', act: () => { run.coins += 30; return { text: '"감사합니다. 이건 우리 모두의 약점이라서요."' + addRep('mer', 2) }; } },
      { t: '야생 기계에게 넘긴다', act: () => ({ text: '"우리가 알고 싶던 것이다."' + addRep('fer', 2) + addRep('mer', -1) }) },
      { t: '상단에 판다 (코인 +50)', act: () => { run.coins += 50; return { text: '상단 정보상이 눈을 번뜩였다.' + addRep('car', 2) + addRep('mer', -1) }; } }
    ] },
  { id: 'caravanrepair', s3: true, name: '고장 난 화물차', icon: '🔧', desc: '엔진이 멎은 화물차. 운전사가 땀을 뻘뻘 흘리며 손을 흔든다.',
    choices: [
      { t: '고쳐 준다 (코인 25, 무작위 강화)', can: () => run.coins >= 25, act: () => { run.coins -= 25; return { text: '"은혜는 잊지 않겠소!" ' + evUp() + addRep('car', 2) }; } },
      { t: '지나간다', act: () => ({ text: '화물차가 점점 작아졌다.' }) }
    ] },
  { id: 'childbot', s3: true, name: '길 잃은 아이 로봇', icon: '🧸', desc: '고장 난 어린이용 돌봄 로봇이 혼자 서 있다. 주인은 오래전에 떠난 것 같다.',
    choices: [
      { t: '데려간다 (체력 -10, 다음 전투 동행)', act: () => { hurtRun(10); run.allyNext = true; return { text: '작은 손이 옷자락을 붙잡았다.' + addRep('fer', 1) + addRep('car', 1) }; } },
      { t: '길만 알려 준다', act: () => ({ text: '로봇은 한참 서서 손을 흔들었다.' }) }
    ] },
  { id: 'airdrop', s3: true, name: '연합 보급 낙하', icon: '📦', desc: '하늘에서 낙하산이 내려온다. 연합의 보급 상자다.',
    choices: [
      { t: '상자를 연다 (희귀 강화 선택)', act: () => ({ text: '상자 안에는 메모가 있었다. 「열한 번째 요원께.」' + addRep('mer', 1), then: evPick(true, '연합 보급: 희귀 강화 포함') }) },
      { t: '낙하산만 챙긴다 (코인 +25)', act: () => { run.coins += 25; return { text: '튼튼한 천이다.' }; } }
    ] },
  { id: 'cableroom', s3: true, name: '대형 케이블 접속실', icon: '🔌', desc: '대륙 전력망의 간선 케이블이 지나는 접속실. 잘못 건드리면 감전이다.',
    choices: [
      { t: '전류를 빼돌린다 (피해 15, 코인 +50)', act: () => { hurtRun(15); run.coins += 50; return { text: '불꽃이 튀었다! 하지만 계좌는 두둑해졌다.' }; } },
      { t: '접속을 점검한다 (체력 15)', act: () => { healRun(15, true); return { text: '접속 불량을 고치자 불이 안정됐다.' + addRep('mer', 1) }; } }
    ] },
  { id: 'beacon', s3: true, name: '신호 비콘', icon: '📡', desc: '세 갈래 주파수가 한 비콘에서 엇갈린다. 하나만 증폭할 수 있다.',
    choices: [
      { t: '연합 주파수를 증폭한다', act: () => ({ text: '"신호 확인. 통행을 허가합니다."' + addRep('mer', 2) + ' ' + evOd(30) }) },
      { t: '상단 주파수를 증폭한다 (코인 +30)', act: () => { run.coins += 30; return { text: '"좋은 길이야. 다음에 또 보자."' + addRep('car', 2) }; } },
      { t: '야생 주파수를 증폭한다 (체력 15)', act: () => { healRun(15, true); return { text: '낯선 목소리들이 합창하듯 화답했다.' + addRep('fer', 2) }; } }
    ] }
);
