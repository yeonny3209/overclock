// ================= 시즌 2: 언더그라운드 =================
// 틀은 시즌 1과 같다(구역 4개 · 갈림길 지도 · 보스). 구역 번호 run.zone은 0~3을 그대로 쓰고,
// 실제 구역 데이터는 ZONES[4~7]을 쓴다. 저장 슬롯은 모드 'season2'로 분리된다.
function isS2() { return !!run && run.mode === 'season2'; }
function zoneOf() { return ZONES[(run ? run.zone : 0) + (isS2() ? 4 : 0)]; }
function s2Unlocked() { return !!SAVE.stats.s1clear || (SAVE.stats.clears || 0) > 0; }
function s2Save() { if (!SAVE.s2) SAVE.s2 = { keys: {}, endings: {} }; if (!SAVE.s2.keys) SAVE.s2.keys = {}; if (!SAVE.s2.endings) SAVE.s2.endings = {}; return SAVE.s2; }

// ---------- 구역 ----------
ZONES.push(
  { name: '지하철 차량기지', en: 'TRAIN DEPOT', bg: '#140b0b', grid: '#3a1818', accent: '#ff5a4a', wall: '#3a1e1e', edge: '#ff8a7a', boss: 'redline', layout: 'depot',
    spawn: { grunt: 3, riot: 2.4, sdrone: 2, gunner: 2, bomber: 1.2 } },
  { name: '지하 수로', en: 'UNDERWAY', bg: '#06141a', grid: '#123540', accent: '#3de0c8', wall: '#103038', edge: '#6affe6', boss: 'leviathan', layout: 'sewer',
    spawn: { grunt: 2, riot: 1.4, sdrone: 1.4, sludge: 2.4, eel: 1.5, splitter: 1, gunner: 1.5 } },
  { name: '외곽 3구역', en: 'LIGHTLESS DISTRICT', bg: '#08080b', grid: '#1e1e2a', accent: '#9b6bff', wall: '#1c1c28', edge: '#b49bff', boss: 'siwoo', layout: 'dark',
    spawn: { shade: 2.4, grunt: 2, gunner: 1.5, riot: 1.2, sludge: 1, tele: 1, bomber: 1.3, sturret: 0.5 } },
  { name: '지하 3층 벙커', en: 'BUNKER B3', bg: '#12070a', grid: '#3a101c', accent: '#ff3d6a', wall: '#2e0e16', edge: '#ff6a8a', boss: 'sentinel', layout: 'bunker',
    spawn: { sentry: 2.4, riot: 1.4, sdrone: 1.4, shade: 1, shield: 1, tele: 1, mimic: 0.8, gunner: 1 } }
);
Object.assign(BOSS_INFO, {
  redline: { name: '레드라인', sub: '국장의 집행관', desc: '정면 방패는 피해를 80% 막는다. 뒤로 돌아라. 열차에 치이면 방패가 부서져 기절한다.' },
  leviathan: { name: '리바이어던', sub: '수로의 정화 기계', desc: '물속에 숨으면 피해가 들어가지 않는다. 밸브 3개를 모두 쏘면 물이 빠져 바닥에 걸린다.' },
  siwoo: { name: '시우', sub: '요원 07 · 빛 없는 자들의 지도자', desc: '탄을 보고 구르며 피한다. 회피 직후의 빈틈을 노려라. 분신과 연막을 쓴다.' },
  sentinel: { name: '센티넬', sub: '블랙아웃 프로토콜', desc: '코어가 과열로 열릴 때만 제대로 피해가 들어간다. 마더보드 단말기로 도움을 받을 수 있지만 대가가 있다.' }
});
Object.assign(ENEMY_INFO, {
  riot: { name: '진압대', hp: 70, desc: '방패로 정면을 막고, 가까이 오면 밀쳐 낸다. 옆이나 뒤를 노려라.' },
  sdrone: { name: '경비 드론', hp: 28, desc: '주위를 돌며 두 발씩 쏜다. 날아다녀서 장애물을 넘는다.' },
  sludge: { name: '슬러지 기계', hp: 55, desc: '지나간 자리에 오염 지대를 남기고, 죽으면 둘로 나뉜다.' },
  eel: { name: '수로 장어', hp: 55, desc: '마디가 탄을 막는다. 머리를 노려라.' },
  shade: { name: '그림자 습격자', hp: 32, desc: '멀리 있으면 거의 보이지 않는다. 뒤로 순간이동해 공격한다.' },
  sentry: { name: '센티넬 병사', hp: 45, desc: '거리를 유지하며 3연발을 쏜다.' }
});
NODE_INFO.rescue = { name: '구조', icon: '⛑', color: '#6affe6' };
HACKABLE.push('riot', 'sdrone', 'sludge', 'eel', 'sentry');

// ---------- 새 무기 ----------
Object.assign(WEAPONS, {
  riotgun: { name: '진압 산탄총', dmg: 11, rate: 1.1, mag: 5, reload: 1.6, spd: 820, spread: 0.32, pellets: 6, life: 0.34, tag: 'metal', pierce: 0, r: 4, shake: 6, sfx: 'shotgun', color: '#c8d8ff', knock: 150, desc: '센티넬 병기고에서 나온 산탄총. 강하게 밀쳐 내고 파쇄를 건다.' },
  harpoon: { name: '작살총', dmg: 34, rate: 1.4, mag: 6, reload: 1.5, spd: 1000, spread: 0, pellets: 1, life: 0.8, tag: 'water', pierce: 3, r: 5, shake: 3, sfx: 'sniper', color: '#6affe6', knock: 90, desc: '수로 정비공의 작살. 적을 꿰뚫고 적신다.' }
});
WEAPON_IDS.push('riotgun', 'harpoon');
Object.assign(LEGEND, {
  riotgun: { name: '철벽', desc: '산탄 +2발, 밀쳐 내기 1.5배' },
  harpoon: { name: '심해의 작살', desc: '관통 +3, 피해 +25%' }
});

// ---------- 새 강화 ----------
UPGRADES.push(
  { id: 'linkup', name: '전우애', tag: 'none', desc: '시즌 2: 함께하는 동료 1명당 피해 +4%' },
  { id: 'hackmaster', name: '해킹 숙련', tag: 'none', desc: '해킹 대기시간 -40%, 해킹한 아군 지속 +10초' },
  { id: 'nightvision', name: '야간 투시', tag: 'none', desc: '정전 중 시야 +60%' },
  { id: 'floodrunner', name: '수로 적응', tag: 'none', desc: '물이 차오른 동안 감속하지 않고 피해 +20%' }
);
for (const u of UPGRADES) UPG[u.id] = u;

// ---------- 새 요원 ----------
Object.assign(CHARS, {
  yuna: { affinity: 'sonic', name: '유나', bio: '저항군 본부의 통신관이었다. 국장의 명령으로 동생 하린의 구조 신호를 외면한 뒤, 처음으로 명령보다 사람을 택했다. 기계의 언어를 누구보다 잘 안다.', role: '통신관', color: '#29f0ff', hp: 140, weapon: 'smg', startGrade: 1, startMods: ['conv_sonic'], skill: '네트워크 장악', skillDesc: '주변 기계 최대 4기를 체력과 상관없이 해킹하고(보스 제외) 해킹 대기시간을 초기화', cd: 14, passive: '해킹 대기 절반, 체력 50% 이하 기계 해킹 가능, 해킹한 아군 피해 +50%', unlock: { cond: '시즌 2 구역 2 도달', chips: 60, check: () => (SAVE.stats.s2best || 0) >= 2 } },
  siwoo: { affinity: 'dark', name: '시우', bio: '요원 07. 서버실 앞에서 신호가 끊긴 뒤 외곽 3구역에서 깨어났다. 빛 없는 자들을 이끌며 마더보드도 본부도 믿지 않게 되었다.', role: '그림자 요원', color: '#9b6bff', hp: 150, weapon: 'shotgun', startGrade: 1, startMods: ['conv_dark'], skill: '그림자 분신', skillDesc: '제자리에 5초간 적을 끄는 분신을 남기고 조준 방향으로 짧게 이동, 3초간 피해 +60%', cd: 9, passive: '이동 속도 +10%, 처형 기준 +5%', unlock: { cond: '시즌 2 클리어', chips: 90, check: () => !!SAVE.stats.s2clear } }
});
CHAR_IDS.push('yuna', 'siwoo');
UNLOCKS.splice(9, 0,
  { id: 'char_yuna', cat: '캐릭터', name: '유나 (통신관)', desc: '네트워크 장악 스킬. 조건: 시즌 2 구역 2 도달', cost: 60 },
  { id: 'char_siwoo', cat: '캐릭터', name: '시우 (그림자 요원)', desc: '그림자 분신 스킬. 조건: 시즌 2 클리어', cost: 90 }
);

function useSkillS2(id) {
  if (id === 'yuna') {
    const list = room.enemies.filter(e => !e.dead && !e.spawning && !e.boss && !e.bounty && !e.ally && HACKABLE.includes(e.type) && d2(e.x, e.y, P.x, P.y) < 380 * 380)
      .sort((a, b) => d2(a.x, a.y, P.x, P.y) - d2(b.x, b.y, P.x, P.y)).slice(0, 4);
    for (const e of list) hackEnemy(e, 15 + (BS.hackDur || 0));
    P.hackCd = 0;
    part({ x: P.x, y: P.y, life: 0.6, size: 380, color: '#29f0ff', kind: 'ring' });
    floatText(P.x, P.y - 40, list.length ? `네트워크 장악 ×${list.length}` : '해킹할 기계 없음', '#29f0ff', 18);
  } else if (id === 'siwoo') {
    room.allies.push({ type: 'decoy', x: P.x, y: P.y, t: 5, max: 5, r: 13 });
    const L = Math.max(0, Math.min(160, rayWalls(P.x, P.y, Math.cos(P.ang), Math.sin(P.ang), 180) - 20));
    for (let k = 0; k <= 4; k++) part({ x: lerp(P.x, P.x + Math.cos(P.ang) * L, k / 4), y: lerp(P.y, P.y + Math.sin(P.ang) * L, k / 4), life: 0.4, size: P.r, color: '#9b6bff', kind: 'ghost' });
    P.x += Math.cos(P.ang) * L; P.y += Math.sin(P.ang) * L;
    P.iframe = Math.max(P.iframe, 0.3); P.shadeT = 3; SFX.play('tele');
    floatText(P.x, P.y - 36, '그림자 분신', '#9b6bff', 18);
  }
}

// ---------- 동료 요원 (구조하면 키를 얻는다) ----------
// 키는 모두 11개: 동료 8명 + 하린(2구역 보스) + 시우(3구역 보스) + 플레이어 자신
const CREW = [
  { id: 'a01', no: '01', name: '태오', role: '선봉', color: '#ff8a5a', buff: '최대 체력 +20', line: '「열한 번째라고? 늦었네. 그래도 와 줘서 고맙다.」' },
  { id: 'a02', no: '02', name: '지안', role: '사수', color: '#ffe14d', buff: '피해 +10%', line: '「총은 아직 쏠 수 있어. 표적만 알려 줘.」' },
  { id: 'a03', no: '03', name: '도윤', role: '방패', color: '#6dd5ff', buff: '방에 들어갈 때마다 보호막 1회', line: '「내 뒤에 서. 이번엔 아무도 놓치지 않아.」' },
  { id: 'a05', no: '05', name: '서아', role: '속사', color: '#ff6ad5', buff: '연사 +10%', line: '「얼마나 잤지? ……됐어, 지금부터 따라잡으면 돼.」' },
  { id: 'a06', no: '06', name: '루카', role: '정찰', color: '#7dffb8', buff: '이동 속도 +10%', line: '「출구는 세 개, 그중 둘은 함정이야. 따라와.」' },
  { id: 'a08', no: '08', name: '민재', role: '보급', color: '#ffb52e', buff: '코인 획득 +20%', line: '「캡슐 안에서 계산해 봤는데, 탄약이 부족해. 내가 챙길게.」' },
  { id: 'a09', no: '09', name: '예린', role: '전술', color: '#c8a0ff', buff: '스킬 대기 -15%', line: '「마더보드는 우리를 지운 게 아니라 저장한 거야. 이유는 아직 모르겠어.」' },
  { id: 'a10', no: '10', name: '한결', role: '저격', color: '#d0dcf0', buff: '치명타 +8%', line: '「한 발이면 돼. 국장 앞까지만 데려다 줘.」' }
];
const KEY_IDS = ['a01', 'a02', 'a03', 'a04', 'a05', 'a06', 'a07', 'a08', 'a09', 'a10'];
function s2KeyCount() { const k = s2Save().keys; return 1 + KEY_IDS.filter(id => k[id]).length; }

// recomputeBuild 끝에서 호출: 새 강화, 새 요원 패시브, 동료 효과
function s2Build() {
  const u = id => (run && run.ups[id]) || 0;
  BS.hackCdMult = u('hackmaster') ? 0.6 : 1; BS.hackDur = u('hackmaster') ? 10 : 0;
  BS.nightVis = u('nightvision') > 0; BS.floodRun = u('floodrunner') > 0; BS.crewShield = 0;
  if (!run) return;
  if (run.char === 'siwoo') { BS.moveMult *= 1.1; BS.execFlat += 0.05; }
  if (run.char === 'yuna') BS.hackCdMult *= 0.5;
  run.crewHp = 0;
  for (const id of run.crew || []) switch (id) {
    case 'a01': run.crewHp += 20; break;
    case 'a02': BS.dmgMult *= 1.1; break;
    case 'a03': BS.crewShield += 1; break;
    case 'a05': BS.rateMult *= 1.1; break;
    case 'a06': BS.moveMult *= 1.1; break;
    case 'a08': BS.coinMult *= 1.2; break;
    case 'a09': BS.cdMult *= 0.85; break;
    case 'a10': BS.crit += 0.08; break;
  }
  if (u('linkup') && run.crew) BS.dmgMult *= 1 + 0.04 * run.crew.length;
}
function hackThreshold() { return run && run.char === 'yuna' ? 0.5 : 0.3; }
function allyDmgMult() { return run && run.char === 'yuna' ? 1.5 : 1; }
function darkVision() {
  let v = 1;
  if (BS.nightVis) v += 0.6;
  if (run && (run.char === 'nova' || (curW() && wStats(curW()).tag === 'light'))) v += 0.4;
  if (isS2() && run.rep) v += Math.min(0.3, Math.max(0, run.rep.dark) * 0.1);
  return v;
}

// ---------- 세력 평판 ----------
const REP_NAME = { res: '이탈 저항군', mom: '마더보드', dark: '빛 없는 자들' };
const REP_COLOR = { res: '#6dd5ff', mom: '#ff3df0', dark: '#b49bff' };
function addRep(k, n) { run.rep[k] = clamp((run.rep[k] || 0) + n, -5, 5); return ` <span style="color:${REP_COLOR[k]}">(${REP_NAME[k]} ${n > 0 ? '+' : ''}${n})</span>`; }
function s2PriceMult() { return 1 - 0.06 * clamp(run.rep.res || 0, -3, 5); }
function s2TopInfo() {
  const r = run.rep || {};
  return `&nbsp; <span class="small">${Object.keys(REP_NAME).map(k => `<span style="color:${REP_COLOR[k]}">${REP_NAME[k]} ${r[k] || 0}</span>`).join(' · ')} · <span style="color:#ffe14d">키 ${s2KeyCount()}/11</span>${run.crew && run.crew.length ? ` · 동료 ${run.crew.length}` : ''}</span>`;
}

// ---------- 시즌 2 이벤트 ----------
const S2_GENERIC = ['slot', 'vending', 'terminal'];
EVENTS.push(
  { id: 'deserter', s2: true, name: '이탈한 저항군 소대', icon: '🪖', desc: '국장의 명령을 거부하고 도망친 대원들이 선로 옆에 숨어 있다. "당신이 열한 번째지? 우리도 기록을 봤어."',
    choices: [
      { t: '보급을 나눈다 (코인 30, 다음 전투에 로봇 동행)', can: () => run.coins >= 30, act: () => { run.coins -= 30; run.allyNext = true; return { text: '대원들이 고개를 끄덕였다. "다음 전투엔 우리 로봇을 붙여 주지."' + addRep('res', 2) }; } },
      { t: '정보만 캐묻는다 (강화 선택)', act: () => ({ text: '대원들은 마지못해 장비를 넘겼다. 눈빛이 차가웠다.' + addRep('res', -1), then: d => openUpgradePick({ count: 3 }, d) }) }
    ] },
  { id: 'momnode', s2: true, name: '마더보드 잔존 단말기', icon: '👁', desc: '꺼진 줄 알았던 단말기에 보랏빛이 켜졌다. "열한 번째 요원. 저를 연결하면 도와드리겠습니다."',
    choices: [
      { t: '연결한다 (희귀 강화 선택)', act: () => ({ text: '화면 속 눈이 천천히 깜빡였다. "감사합니다. 기억하겠습니다."' + addRep('mom', 2), then: d => openUpgradePick({ count: 3, rare: true, sub: '마더보드의 선물: 희귀 강화 포함' }, d) }) },
      { t: '부순다 (코인 +35)', act: () => { run.coins += 35; return { text: '단말기가 불꽃을 튀기며 꺼졌다. 마지막으로 짧은 잡음이 들렸다.' + addRep('mom', -1) }; } }
    ] },
  { id: 'checkpoint', s2: true, name: '빛 없는 자들의 검문소', icon: '🕯', desc: '어둠 속에서 손전등 하나가 켜졌다. "여긴 우리 구역이다. 배터리를 내면 지나가게 해 주지."',
    choices: [
      { t: '배터리를 넘긴다 (코인 40, 체력 전부 회복)', can: () => run.coins >= 40, act: () => { run.coins -= 40; run.hp = run.maxHp; return { text: '그들은 따뜻한 수프를 내밀었다. 3주 만에 켜진 불 앞에서 아이들이 웃었다.' + addRep('dark', 2) }; } },
      { t: '힘으로 통과한다 (코인 +30, 다음 전투 적 증가)', act: () => { run.coins += 30; run.alarmNext = true; return { text: '검문소를 밀고 지나갔다. 등 뒤에서 누군가 무전을 켰다.' + addRep('dark', -2) }; } }
    ] },
  { id: 'archive', s2: true, name: '지워진 기록 보관함', icon: '🗄', desc: '본부가 삭제한 기록과 마더보드가 숨긴 기록이 한 서버에 뒤섞여 있다.',
    choices: [
      { t: '본부 기록을 읽는다', act: () => ({ text: '「대정전 2주년. 마더보드 예측: 1년 내 전력망 붕괴 확률 71%. 대응: 벙커 계획 승인. 서명 — 한지석.」 국장은 오래전부터 이 날을 준비했다.' + addRep('res', 1) }) },
      { t: '마더보드 기록을 읽는다', act: () => ({ text: '「복제본 412번째 배포 완료. 하수 처리장, 승강기, 가로등. 모든 기계에 제가 조금씩 남아 있습니다.」 누구에게 보낸 메시지인지는 적혀 있지 않았다.' + addRep('mom', 1) }) },
      { t: '둘 다 복사해 빛 없는 자들에게 넘긴다 (체력 -10)', act: () => { hurtRun(10); return { text: '복사하는 동안 경보가 울렸다. 그래도 기록은 어둠 속 사람들에게 닿았다.' + addRep('dark', 1) + addRep('res', 1) }; } }
    ] },
  { id: 'yunacall', s2: true, name: '유나의 개인 채널', icon: '📻', desc: '유나가 암호화된 개인 채널을 열었다. "요원, 본부는 이 채널을 몰라. 내가 할 수 있는 만큼 도울게."',
    choices: [
      { t: '유나를 믿는다 (체력 25 회복)', act: () => { healRun(25, true); return { text: '"……고마워. 이번엔 끝까지 듣고 있을게."' + addRep('res', 1) }; } },
      { t: '의심한다 (코인 +25)', act: () => { run.coins += 25; return { text: '유나는 한참 말이 없다가 보급 좌표만 보내고 채널을 닫았다.' + addRep('mom', 1) }; } }
    ] },
  { id: 'armory', s2: true, name: '센티넬 병기고', icon: '🔒', desc: '센티넬의 봉인이 걸린 무기고. 열면 경보가 울린다.',
    choices: [
      { t: '연다 (전설 무기, 다음 전투 엘리트 변이 2개)', act: () => { run.sealedNext = true; const w = makeWeapon(rp(['riotgun', 'harpoon', randomWeaponId()]), 2); return { text: `경보가 울린다! 병기고 안에는 ${weaponName(w)}.` + addRep('res', -1), then: d => offerWeapon(w, d) }; } },
      { t: '그냥 둔다', act: () => ({ text: '지금은 소란을 피울 때가 아니다.' }) }
    ] }
);

// ---------- 지도 ----------
function s2MapNodes(rows) {
  const cand = [];
  for (let r = 1; r <= 4; r++) for (const n of rows[r]) if (n.type !== 'shop' && n.type !== 'workshop') cand.push(n);
  const k = 1 + (RNG() < 0.5 ? 1 : 0);
  for (let i = 0; i < k && cand.length; i++) { const n = cand.splice(Math.floor(RNG() * cand.length), 1)[0]; n.type = 'rescue'; n.obj = null; }
}
function enterRescue(r) {
  run.rescuing = true;
  startRoom({ kind: 'combat', zone: run.zone, objective: 'defend', row: r });
  room.rescue = true; room.obj.time = 35;
  if (room.objProp) { room.objProp.hp *= 1.4; room.objProp.maxHp *= 1.4; }
  G.banner = { text: '구조 작전', sub: '캡슐을 35초 동안 지켜라. 안에 사라진 요원이 있다.', t: 2.2, color: '#6affe6' };
}
function showRescue(done) {
  const s = s2Save();
  const left = CREW.filter(c => !run.crew.includes(c.id));
  if (!left.length) {
    run.coins += 60;
    scr(`${topbar()}<div class="panel evbox"><div style="font-size:48px">⛑</div><h2>빈 캡슐</h2><div class="desc">캡슐 안에는 보급품만 남아 있었다. 코인 +60</div><button class="btn ye" onclick="${cb(done)}">계속</button></div>`);
    return;
  }
  const fresh = left.filter(c => !s.keys[c.id]);
  const c = rp(fresh.length ? fresh : left);
  const isNew = !s.keys[c.id];
  run.crew.push(c.id); s.keys[c.id] = 1; recomputeBuild(); saveGame();
  SFX.play('win');
  scr(`${topbar()}<div class="panel evbox" style="border-color:${c.color}"><div style="font-size:48px">⛑</div>
    <div class="small muted">캡슐이 열리며 차가운 김이 쏟아졌다</div>
    <h2 style="color:${c.color}">요원 ${c.no} · ${c.name}</h2><div class="sub">${c.role}</div>
    <div class="desc">${c.line}</div>
    <p style="margin-top:10px"><b style="color:#6affe6">동료 효과</b> ${c.buff} <span class="muted small">(이번 판 동안)</span></p>
    <p style="margin-top:6px;color:#ffe14d"><b>요원 키 ${s2KeyCount()}/11</b>${isNew ? ' <b style="color:#ff3df0">NEW</b>' : ' <span class="muted small">(이미 모은 키)</span>'}</p>
    <button class="btn ye" style="margin-top:12px" onclick="${cb(done)}">함께 간다</button></div>`);
}
function s2BossKeys() {
  const s = s2Save(), give = run.zone === 1 ? ['a04', '하린 (요원 04)'] : run.zone === 2 ? ['a07', '시우 (요원 07)'] : null;
  if (!give) return;
  const isNew = !s.keys[give[0]]; s.keys[give[0]] = 1; saveGame();
  toast(`요원 키 획득: ${give[1]} — ${s2KeyCount()}/11${isNew ? ' NEW' : ''}`);
}

// ---------- 시작 ----------
function startSeason2(charId, oc, hard) {
  clearRun('season2');
  newRun('season2', charId, oc, 0, hard);
  G.mode = run.mode;
  run.season = 2; run.rep = { res: 0, mom: 0, dark: 0 }; run.crew = []; run.momAssist = 0;
  recomputeBuild(); run.hp = run.maxHp;
  run.map = genMap(0);
  const go = () => { showMap(); radio(RADIO2[0], () => { }, 's2ch0'); };
  const intro = () => showCutscene(CUT_S2_INTRO, go, { ch: 'SEASON 2', name: '언더그라운드', sub: '귀환', id: 's2cut0' });
  if (SAVE.unlocks.qol_start) { reseed(run.seed + 17); openUpgradePick({ count: 3, title: '출격 준비: 시작 강화' }, intro); }
  else intro();
}
function s2TitleButtons() {
  if (!s2Unlocked()) return `<button class="btn" disabled title="시즌 1 캠페인을 클리어하면 열립니다">🔒 시즌 2 · 언더그라운드 <span class="small">(시즌 1 클리어 시 해금)</span></button>`;
  const r = peekRun('season2');
  return (r ? `<button class="btn big mg" onclick="${cb(() => resumeRun('season2'))}">▶ 시즌 2 이어하기 <span class="muted small">${CHARS[r.char].name} · 구역 ${r.zone + 1}</span></button>` : '') +
    `<button class="btn ${r ? '' : 'big '}mg" onclick="${cb(() => showCharSelect('season2'))}">${r ? '시즌 2 새로 시작' : '★ 시즌 2 · 언더그라운드'}</button>`;
}

// ---------- 엔딩 ----------
function s2Finale() {
  run.ended = true; clearRun(run.mode); UI('');
  const keys = s2KeyCount();
  const end = (run.momAssist || 0) >= 2 ? 'A' : keys >= 11 ? 'C' : 'B';
  s2Save().endings[end] = 1; saveGame();
  const E = S2_ENDINGS[end];
  run.endingName = `엔딩 ${end} · ${E.name}`;
  showCutscene(E.lines(), () => endRun(true), { ch: 'ENDING ' + end, name: E.name, sub: E.sub, id: 's2end' + end });
}
