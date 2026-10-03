// ================= 게임 데이터 =================
const TAG_NAME = { fire: '불', elec: '전기', ice: '얼음', exp: '폭발', bullet: '탄환', surv: '생존', none: '없음', special: '특수' };
const TAG_COLOR = { fire: '#ff7a2a', elec: '#ffe14d', ice: '#8fe8ff', exp: '#ff4d6d', bullet: '#d8dcf0', surv: '#6dff8a', none: '#b0a8d0', special: '#c77dff' };
const SET_TAGS = ['fire', 'elec', 'ice', 'exp', 'bullet', 'surv'];
function tagHTML(t) { return `<span class="tag" style="background:${TAG_COLOR[t]}">${TAG_NAME[t]}</span>`; }

// ---------- 캐릭터 ----------
const CHARS = {
  rain: { name: '레인', role: '돌격', color: '#ff5a5a', hp: 150, weapon: 'smg', skill: '과충전', skillDesc: '5초간 연사 속도 2배, 재장전 불필요', cd: 14, passive: '체력 30% 이하일 때 피해 +25%', unlock: null },
  momo: { name: '모모', role: '기술자', color: '#ffd23d', hp: 150, weapon: 'pistol', skill: '포탑 설치', skillDesc: '20초간 자동 사격 포탑 설치 (최대 2개)', cd: 9, passive: '상점 가격 -15%', unlock: { cond: '구역 2 클리어', chips: 40, check: () => SAVE.stats.zone2 } },
  kai: { name: '카이', role: '기동', color: '#3dffb0', hp: 150, weapon: 'shotgun', skill: '반사 베기', skillDesc: '앞쪽 부채꼴을 베고 적 탄환을 되돌려 보냄', cd: 4.5, passive: '구르기 2회 충전', unlock: { cond: '구르기로 탄환 500발 회피', chips: 60, check: () => SAVE.stats.dodged >= 500 } },
  sera: { name: '세라', role: '저격', color: '#b48cff', hp: 150, weapon: 'sniper', skill: '시간 감속', skillDesc: '3초간 주변 시간 70% 감속', cd: 13, passive: '재장전 직후 첫 발 피해 +100%', unlock: { cond: '저격총으로 보스 처치', chips: 80, check: () => SAVE.stats.sniperBoss } }
};
const CHAR_IDS = ['rain', 'momo', 'kai', 'sera'];
function charUnlocked(id) { const c = CHARS[id]; return !c.unlock || !!SAVE.unlocks['char_' + id] || c.unlock.check(); }

// ---------- 무기 ----------
const WEAPONS = {
  pistol: { name: '권총', dmg: 12, rate: 3, mag: Infinity, reload: 0, spd: 950, spread: 0.02, pellets: 1, life: 0.85, tag: 'bullet', pierce: 0, r: 4, shake: 1.5, sfx: 'pistol', color: '#fff3a0', knock: 30, desc: '정확하지만 약하다. 탄창 무한.' },
  smg: { name: '기관단총', dmg: 7, rate: 10, mag: 30, reload: 1.3, spd: 900, spread: 0.13, pellets: 1, life: 0.7, tag: 'bullet', pierce: 0, r: 3.5, shake: 1, sfx: 'smg', color: '#ffe38a', knock: 15, desc: '빠른 연사, 탄 퍼짐.' },
  shotgun: { name: '산탄총', dmg: 8, rate: 1.2, mag: 6, reload: 1.6, spd: 850, spread: 0.38, pellets: 6, life: 0.36, tag: 'bullet', pierce: 0, r: 3.5, shake: 5, sfx: 'shotgun', color: '#ffc27a', knock: 90, desc: '근거리 특화. 6발 동시 발사.' },
  sniper: { name: '저격총', dmg: 60, rate: 0.8, mag: 5, reload: 1.9, spd: 1900, spread: 0, pellets: 1, life: 0.8, tag: 'bullet', pierce: 99, r: 4, shake: 6, sfx: 'sniper', color: '#e0d0ff', knock: 60, desc: '적을 관통하는 강력한 한 발.' },
  grenade: { name: '유탄발사기', dmg: 35, rate: 1, mag: 4, reload: 1.8, spd: 540, spread: 0.03, pellets: 1, life: 1.1, tag: 'exp', pierce: 0, r: 7, shake: 3, sfx: 'grenade', color: '#ff9b3d', type: 'grenade', aoe: 85, knock: 0, desc: '범위 폭발. 자신도 피해를 입을 수 있다.' },
  flamer: { name: '화염방사기', dmg: 3, rate: 20, mag: 100, reload: 2, spd: 430, spread: 0.2, pellets: 1, life: 0.42, tag: 'fire', pierce: 99, r: 9, shake: 0.3, sfx: 'flame', color: '#ff7a2a', type: 'flame', knock: 0, desc: '짧은 사거리. 화상 부여.' },
  tesla: { name: '테슬라 코일', dmg: 15, rate: 2, mag: 12, reload: 1.5, spd: 0, spread: 0, pellets: 1, life: 0, tag: 'elec', pierce: 0, r: 0, shake: 2, sfx: 'tesla', color: '#fff04d', type: 'tesla', range: 400, chain: 3, knock: 0, desc: '가까운 적 3명에게 연쇄 번개.' },
  cryo: { name: '냉각포', dmg: 9, rate: 5, mag: 20, reload: 1.4, spd: 720, spread: 0.05, pellets: 1, life: 0.8, tag: 'ice', pierce: 0, r: 5, shake: 1, sfx: 'cryo', color: '#8fe8ff', knock: 10, desc: '둔화를 부여하는 냉기탄.' },
  boomerang: { name: '부메랑 원반', dmg: 20, rate: 1.5, mag: Infinity, reload: 0, spd: 720, spread: 0, pellets: 1, life: 0.5, tag: 'bullet', pierce: 99, r: 11, shake: 1.5, sfx: 'boomer', color: '#7dffea', type: 'boomerang', knock: 40, desc: '날아갔다 돌아오며 두 번 타격.', locked: true },
  blackhole: { name: '블랙홀 발사기', dmg: 5, rate: 0.3, mag: 2, reload: 2.5, spd: 400, spread: 0, pellets: 1, life: 0.9, tag: 'special', pierce: 0, r: 9, shake: 4, sfx: 'bhole', color: '#c77dff', type: 'blackhole', knock: 0, desc: '적을 한곳으로 빨아들이는 중력장.', locked: true }
};
const WEAPON_IDS = Object.keys(WEAPONS);
function weaponPool() { return WEAPON_IDS.filter(id => !WEAPONS[id].locked || SAVE.unlocks['wpn_' + id]); }

const GRADES = [
  { name: '일반', color: '#cfd6e6', slots: 0 },
  { name: '희귀', color: '#4db8ff', slots: 1 },
  { name: '전설', color: '#ffb52e', slots: 2 }
];
const RARE_BONUS = {
  dmg: '피해 +15%', rate: '연사 +15%', mag: '탄창 +40%', reload: '재장전 시간 -30%', crit: '치명타 확률 +10%', spd: '탄속 +25%'
};
const LEGEND = {
  pistol: { name: '골든 이글', desc: '치명타 확률 +25%, 치명타 피해 3배' },
  smg: { name: '폭풍', desc: '10발째마다 폭발탄' },
  shotgun: { name: '파쇄기', desc: '펠릿 +3, 강력한 넉백' },
  sniper: { name: '심판', desc: '처치 시 탄 1발 회복, 관통할수록 피해 +25%' },
  grenade: { name: '집속탄', desc: '폭발 후 소형 폭탄 3개 분산' },
  flamer: { name: '용의 숨결', desc: '화상 걸린 적 처치 시 불꽃 폭발' },
  tesla: { name: '뇌신', desc: '연쇄 대상 +3' },
  cryo: { name: '절대영도', desc: '빙결된 적 명중 시 얼음 파편 확산' },
  boomerang: { name: '삼중륜', desc: '원반 3개를 부채꼴로 투척' },
  blackhole: { name: '사건의 지평선', desc: '블랙홀 소멸 시 대폭발' }
};

// ---------- 개조 부품 ----------
const MODS = {
  extmag: { name: '확장 탄창', desc: '탄창 +50%' },
  ricochet: { name: '도탄 모듈', desc: '탄이 벽에 한 번 튕김' },
  split: { name: '분열 탄두', desc: '적에게 맞으면 작은 탄 2개로 갈라짐' },
  conv_fire: { name: '속성 변환기: 불', desc: '무기 태그를 불로 변경', conv: 'fire' },
  conv_elec: { name: '속성 변환기: 전기', desc: '무기 태그를 전기로 변경', conv: 'elec' },
  conv_ice: { name: '속성 변환기: 얼음', desc: '무기 태그를 얼음으로 변경', conv: 'ice' },
  homing: { name: '유도 칩', desc: '탄이 가까운 적 쪽으로 약하게 휘어짐' },
  silencer: { name: '소음기', desc: '피해 -10%, 적이 플레이어를 늦게 알아챔' }
};
const MOD_IDS = Object.keys(MODS);

// ---------- 강화 ----------
// pack: 'A' / 'B' 는 해금 트리에서 열어야 등장
const UPGRADES = [
  // 불
  { id: 'ignite', name: '점화 탄두', tag: 'fire', desc: '탄환이 20% 확률로 화상 부여', max: 2 },
  { id: 'kindling', name: '불쏘시개', tag: 'fire', desc: '화상 피해 +50%', max: 2 },
  { id: 'spreadfire', name: '연소 확산', tag: 'fire', desc: '화상 걸린 적이 죽으면 주변 적에게 화상', rare: 1 },
  { id: 'firetrail', name: '발화 구르기', tag: 'fire', desc: '구르기 경로에 불길을 남김' },
  { id: 'heat', name: '열기', tag: 'fire', desc: '화상 지속시간 +2초' },
  { id: 'incinerate', name: '소각로', tag: 'fire', desc: '화상 걸린 적에게 주는 피해 +20%', max: 2 },
  { id: 'flamearmor', name: '화염 갑옷', tag: 'fire', desc: '피격 시 주변 적에게 화상', pack: 'A' },
  // 전기
  { id: 'static', name: '정전기', tag: 'elec', desc: '구르기 후 다음 3발이 감전 부여' },
  { id: 'conductor', name: '도체 탄두', tag: 'elec', desc: '탄환이 15% 확률로 감전 부여', max: 2 },
  { id: 'highvolt', name: '고전압', tag: 'elec', desc: '감전 전이 피해 50% → 80% (2중첩 110%)', max: 2 },
  { id: 'chargecoil', name: '충전 코일', tag: 'elec', desc: '재장전 시 주변 적 감전 + 피해 12 (중첩 시 피해 증가)', max: 2 },
  { id: 'overcurrent', name: '과전류', tag: 'elec', desc: '감전된 적이 받는 피해 +15%', max: 2 },
  { id: 'thunder', name: '번개 강타', tag: 'elec', desc: '치명타 시 대상에게 낙뢰 (피해 20)', rare: 1, pack: 'B' },
  { id: 'discharge', name: '방전', tag: 'elec', desc: '스킬 사용 시 주변 적 5명에게 번개', pack: 'A' },
  // 얼음
  { id: 'frostbite', name: '동상', tag: 'ice', desc: '빙결 지속시간 +50%', max: 2 },
  { id: 'frosttip', name: '서리 탄두', tag: 'ice', desc: '탄환이 20% 확률로 빙결 1중첩', max: 2 },
  { id: 'chill', name: '한기', tag: 'ice', desc: '빙결 둔화 30% → 45% (2중첩 60%)', max: 2 },
  { id: 'shards', name: '얼음 파편', tag: 'ice', desc: '얼어붙은 적이 죽으면 파편 6개가 튐', rare: 1 },
  { id: 'permafrost', name: '영구 동토', tag: 'ice', desc: '얼어붙음 지속시간 +1초', max: 2 },
  { id: 'frostarmor', name: '냉각 갑옷', tag: 'ice', desc: '피격 시 주변 적 빙결 2중첩', pack: 'B' },
  // 폭발
  { id: 'chaindet', name: '연쇄 기폭', tag: 'exp', desc: '폭발에 맞은 적이 죽으면 다시 폭발 (2중첩 시 더 크게)', rare: 1, max: 2 },
  { id: 'hiexp', name: '고폭 화약', tag: 'exp', desc: '폭발 피해 +30%', max: 2 },
  { id: 'burst', name: '파열탄', tag: 'exp', desc: '탄환이 10% 확률로 소형 폭발', max: 2 },
  { id: 'blastroll', name: '폭발 구르기', tag: 'exp', desc: '구르기가 끝날 때 폭발 (자신은 피해 없음)' },
  { id: 'shockwave', name: '충격파', tag: 'exp', desc: '폭발 범위 +15%, 넉백 +50%', max: 2 },
  { id: 'safety', name: '안전 장치', tag: 'exp', desc: '자신의 폭발에 피해를 입지 않음', pack: 'B' },
  // 탄환
  { id: 'twin', name: '쌍발', tag: 'bullet', desc: '탄 2발 발사, 각 탄 피해 -35%', rare: 1 },
  { id: 'sharp', name: '날카로운 탄', tag: 'bullet', desc: '피해 +15%', max: 3 },
  { id: 'rapid', name: '속사', tag: 'bullet', desc: '연사 속도 +15%', max: 3 },
  { id: 'pierce', name: '관통', tag: 'bullet', desc: '탄 관통 +1', max: 2 },
  { id: 'critup', name: '치명', tag: 'bullet', desc: '치명타 확률 +10%', max: 3 },
  { id: 'quickhand', name: '빠른 손', tag: 'bullet', desc: '재장전 속도 +30%', max: 2 },
  { id: 'bigcal', name: '대구경', tag: 'bullet', desc: '탄 크기 +40%, 피해 +10%', pack: 'A' },
  // 생존
  { id: 'vamp', name: '흡혈 회로', tag: 'surv', desc: '적 30명 처치마다 체력 5 회복', max: 2 },
  { id: 'armor', name: '강화 장갑', tag: 'surv', desc: '최대 체력 +15', max: 3 },
  { id: 'regen', name: '재생', tag: 'surv', desc: '전투가 끝날 때 체력 8 회복', max: 2 },
  { id: 'evasion', name: '회피 본능', tag: 'surv', desc: '구르기 무적 시간 +50%' },
  { id: 'medkit', name: '응급 키트', tag: 'surv', desc: '전투마다 1회, 체력 30% 이하가 되면 25 회복', rare: 1 },
  { id: 'plating', name: '방탄판', tag: 'surv', desc: '받는 피해 -10%', max: 2, pack: 'B' },
  // 태그 없음
  { id: 'magnet', name: '자석', tag: 'none', desc: '코인 흡수 범위 2배' },
  { id: 'afterimage', name: '잔상', tag: 'none', desc: '구르기 자리에 1초간 분신이 남아 적을 유인' },
  { id: 'cooldown', name: '냉각 회로', tag: 'none', desc: '스킬 대기시간 -20%', max: 2 },
  { id: 'swift', name: '신속', tag: 'none', desc: '이동 속도 +10%', max: 2 },
  { id: 'combokeep', name: '집중', tag: 'none', desc: '콤보 유지 시간 +2초', pack: 'A' },
  { id: 'invest', name: '투자', tag: 'none', desc: '전투 시작 시 코인 +8', max: 2, pack: 'A' },
  { id: 'lucky', name: '행운', tag: 'none', desc: '전투 후 무기 상자 등장 확률 +20%', pack: 'B' }
];
const UPG = {}; UPGRADES.forEach(u => UPG[u.id] = u);
function upgradePool() { return UPGRADES.filter(u => !u.pack || SAVE.unlocks['upg_' + u.pack]); }

const CURSES = [
  { id: 'glass', name: '유리 대포', gain: '모든 피해 +50%', cost: '최대 체력 -30%' },
  { id: 'frenzy', name: '폭주', gain: '연사 속도 +40%', cost: '탄 퍼짐 크게 증가' },
  { id: 'avarice', name: '탐욕', gain: '코인 획득 2배', cost: '적 수 +25%' },
  { id: 'berserk', name: '광전사', gain: '적 처치 시 피해 +3% 누적 (최대 +90%)', cost: '피격 시 누적 초기화, 회복 불가' }
];
const CURSE = {}; CURSES.forEach(c => CURSE[c.id] = c);

const SETS = {
  fire: ['화상으로 죽은 적이 불씨를 퍼뜨림 (범위 150)', '화상 피해 중첩 (최대 5중첩)', '화상 피해 2배, 화상으로 죽은 적이 폭발'],
  elec: ['감전 전이 대상 +2', '2.5초마다 가까운 적 3명에게 번개', '모든 명중이 25% 확률로 낙뢰 (피해 25)'],
  ice: ['얼어붙은 적이 받는 피해 +50%', '구르기 경로에 얼음 바닥 생성', '2중첩으로 빙결, 빙결 시 얼음 파편 발사'],
  exp: ['폭발 범위 +45%', '적 처치 시 35% 확률로 소형 폭발', '폭발 피해 +50%, 폭발마다 연쇄 소폭발 3개'],
  bullet: ['탄 속도 +60%, 피해 +10%', '3발마다 관통탄', '모든 탄 관통 +2, 피해 +25%'],
  surv: ['최대 체력 +40', '방에 입장할 때마다 보호막 2회', '받는 피해 -15%, 2초마다 체력 3 회복']
};
const PRISM = '프리즘 (같은 속성 강화 9개): 모든 피해 +80%, 치명타 +15%, 이동 +15%, 폭발 범위 +30%, 명중 시 50% 확률로 무작위 속성(불/전기/얼음) 부여, 조각 3개(불=화상+불길 / 전기=연쇄 번개 / 얼음=빙결)가 몸 주위를 돌며 적 탄을 지움, 8초마다 프리즘 폭발: 불=화상 링·기름 점화, 전기=번개 8줄기·물 감전, 얼음=범위 빙결, 폭발=무작위 4곳 폭발, 탄환=관통 탄막 16발, 생존=체력 10 회복+보호막';

// ---------- 적 ----------
const ENEMY_INFO = {
  grunt: { name: '돌격병', hp: 20, desc: '직진 돌격. 기본 사격으로 처리.' },
  gunner: { name: '사수', hp: 25, desc: '거리를 유지하며 느린 탄을 쏜다. 회피하라.' },
  bomber: { name: '자폭병', hp: 15, desc: '빠르게 접근해 폭발한다. 구르기 타이밍이 중요.' },
  tank: { name: '탱커', hp: 150, desc: '다른 적 앞을 막아선다. 우회하거나 관통 무기로.' },
  splitter: { name: '분열체', hp: 40, desc: '죽으면 작은 개체 2마리로 분열. 범위 공격 추천.' },
  frostdrone: { name: '빙결 드론', hp: 30, desc: '바닥에 얼음 지대를 남긴다. 동선 관리.' },
  summoner: { name: '소환사', hp: 50, desc: '멀리서 돌격병을 소환한다. 우선 처치 대상.' },
  shield: { name: '방패병', hp: 80, desc: '정면 탄을 막는다. 옆이나 뒤로 돌아라.' },
  snake: { name: '전기 뱀', hp: 60, desc: '마디가 탄을 막는다. 머리를 노려라.' },
  tele: { name: '순간이동자', hp: 35, desc: '플레이어 뒤로 이동 후 공격. 바닥 표식에 주의.' },
  sturret: { name: '저격 포탑', hp: 70, desc: '조준선 표시 후 강한 한 발. 조준선을 보고 피하라.' },
  mimic: { name: '모방체', hp: 60, desc: '플레이어가 마지막으로 쓴 무기를 복사한다.' }
};
const ELITES = {
  haste: { name: '가속', color: '#ffea00', desc: '이동 속도 2배' },
  barrier: { name: '방어막', color: '#4dd2ff', desc: '일정 피해를 흡수하는 보호막' },
  rage: { name: '분노', color: '#ff3030', desc: '체력 50% 이하일 때 공격 속도 2배' },
  vamp: { name: '흡혈', color: '#e0306a', desc: '플레이어에게 피해를 주면 회복' },
  clone: { name: '증식', color: '#7cff4d', desc: '5초마다 약한 복제 생성' },
  reflect: { name: '반사', color: '#f0f0ff', desc: '3초마다 1초간 탄 반사' },
  magnet: { name: '자석', color: '#ffc400', desc: '주변 코인을 빨아들여 처치 전까지 못 먹게 함' },
  toxic: { name: '오염', color: '#8dff3d', desc: '이동 경로에 독 지대를 남김' }
};
const ELITE_IDS = Object.keys(ELITES);

// ---------- 구역 ----------
const ZONES = [
  { name: '폐차장', en: 'JUNKYARD', bg: '#1b120b', grid: '#3b2716', accent: '#ff8a2a', wall: '#4a3222', edge: '#ff9a4a', boss: 'crusher',
    spawn: { grunt: 5, gunner: 3, bomber: 2 } },
  { name: '냉각 시설', en: 'CRYO FACILITY', bg: '#0a1522', grid: '#173450', accent: '#7fdcff', wall: '#1d3a55', edge: '#bff0ff', boss: 'frost',
    spawn: { grunt: 3, gunner: 2, bomber: 1.5, tank: 1, splitter: 2, frostdrone: 2 } },
  { name: '발전소', en: 'POWER PLANT', bg: '#14130a', grid: '#35300f', accent: '#ffe03a', wall: '#2e2a12', edge: '#ffe95a', boss: 'twins',
    spawn: { grunt: 2, gunner: 2, bomber: 1.2, tank: 1, splitter: 1.2, frostdrone: 1, summoner: 1.2, shield: 2, snake: 1.6 } },
  { name: '중앙 서버', en: 'CENTRAL SERVER', bg: '#0f0a1c', grid: '#2c1848', accent: '#c86bff', wall: '#241640', edge: '#e28bff', boss: 'mother',
    spawn: { grunt: 1.5, gunner: 1.5, bomber: 1, tank: 0.8, splitter: 1, frostdrone: 0.8, summoner: 0.8, shield: 1.3, snake: 1.2, tele: 2, sturret: 1, mimic: 1.6 } }
];
const BOSS_INFO = {
  crusher: { name: '크러셔', sub: '폐차장의 압착기', desc: '돌진 후 벽에 부딪히면 3초 기절, 약점이 노출된다.' },
  frost: { name: '프로스트 코어', sub: '냉각 시설 중추', desc: '맵의 히터 4개를 쏴서 켜면 보호막이 해제된다.' },
  twins: { name: '볼트 트윈스', sub: '발전소 쌍둥이 관리자', desc: '한쪽만 죽이면 5초 뒤 부활. 둘을 비슷하게 깎아라.' },
  mother: { name: '마더보드', sub: '도시 관리 AI', desc: '서버 기둥을 파괴해야 본체에 피해가 들어간다. 3페이즈.' }
};

// ---------- 반응 ----------
const REACTIONS = {
  shatter: { name: '산산조각', color: '#bff4ff', desc: '얼어붙은 적 + 폭발: 폭발 피해 2배, 파편이 튄다.' },
  firestorm: { name: '화염 폭풍', color: '#ff6a1a', desc: '화상 + 기름 웅덩이: 웅덩이 전체가 불타는 지대가 된다.' },
  current: { name: '전류 확산', color: '#fff04d', desc: '감전 + 물웅덩이: 웅덩이 위 모든 적 감전.' },
  thermal: { name: '열충격', color: '#ff8ad5', desc: '화상 + 빙결: 두 상태가 해제되며 큰 단일 피해.' },
  overload: { name: '과부하', color: '#ffd23d', desc: '감전 + 폭발: 폭발 범위 +50%.' }
};

// ---------- 전투 목표 ----------
const OBJECTIVES = {
  exterminate: { name: '섬멸', desc: '모든 적 처치' },
  survive: { name: '생존', desc: '60초 동안 버티기' },
  defend: { name: '거점 사수', desc: '발전기를 지켜라' },
  escort: { name: '호위', desc: '아군 드론을 출구까지 보호' },
  collect: { name: '수집', desc: '데이터칩 5개를 모아 탈출' },
  bounty: { name: '현상금', desc: '제한 시간 안에 표적 처치' }
};

// ---------- 노드 ----------
const NODE_INFO = {
  combat: { name: '전투', icon: '⚔', color: '#29f0ff' },
  elite: { name: '엘리트', icon: '☠', color: '#ff3d6a' },
  shop: { name: '상점', icon: '$', color: '#ffe14d' },
  workshop: { name: '정비소', icon: '⚙', color: '#7dffb0' },
  event: { name: '이벤트', icon: '?', color: '#c77dff' },
  rest: { name: '휴식', icon: '✚', color: '#6dff8a' },
  boss: { name: '보스', icon: '♛', color: '#ff3df0' }
};

// ---------- 오버클럭 레벨 ----------
const OC_LEVELS = [
  '', '적 체력 +15%', '엘리트 등장 빈도 증가', '상점 가격 +20%', '휴식 회복량 30% → 20%', '보스에게 새 패턴 추가',
  '적 피해 +25%', '적 이동 속도 +10%', '코인 소멸 시간 5초 → 3.5초', '최대 체력 -15%', '적 체력 +25% 추가, 엘리트 변이 2개'
];
function ocHpMult(oc) { return (oc >= 1 ? 1.15 : 1) * (oc >= 10 ? 1.25 : 1); }

// ---------- 해금 ----------
const UNLOCKS = [
  { id: 'char_momo', cat: '캐릭터', name: '모모 (기술자)', desc: '포탑 설치 스킬. 조건: 구역 2 클리어', cost: 40 },
  { id: 'char_kai', cat: '캐릭터', name: '카이 (기동)', desc: '반사 베기 스킬. 조건: 구르기로 탄환 500발 회피', cost: 60 },
  { id: 'char_sera', cat: '캐릭터', name: '세라 (저격)', desc: '시간 감속 스킬. 조건: 저격총으로 보스 처치', cost: 80 },
  { id: 'wpn_boomerang', cat: '무기 풀', name: '부메랑 원반', desc: '상점과 상자에 부메랑 원반 등장', cost: 25 },
  { id: 'wpn_blackhole', cat: '무기 풀', name: '블랙홀 발사기', desc: '상점과 상자에 블랙홀 발사기 등장', cost: 35 },
  { id: 'upg_A', cat: '강화 풀', name: '강화 팩 A', desc: '화염 갑옷, 방전, 대구경, 집중, 투자 추가', cost: 30 },
  { id: 'upg_B', cat: '강화 풀', name: '강화 팩 B', desc: '번개 강타, 냉각 갑옷, 안전 장치, 방탄판, 행운 추가', cost: 45 },
  { id: 'qol_start', cat: '편의', name: '출격 준비', desc: '런 시작 시 강화 1개 선택', cost: 40 },
  { id: 'qol_reroll', cat: '편의', name: '상점 연줄', desc: '상점마다 새로고침 1회 무료', cost: 30 },
  { id: 'hp1', cat: '능력치', name: '체력 강화 I', desc: '최대 체력 +10', cost: 20 },
  { id: 'hp2', cat: '능력치', name: '체력 강화 II', desc: '최대 체력 +10', cost: 40, req: 'hp1' },
  { id: 'hp3', cat: '능력치', name: '체력 강화 III', desc: '최대 체력 +10', cost: 60, req: 'hp2' }
];

// ---------- 무전 대사 ----------
const RADIO = [
  ['[본부] 요원, 들리나? 저항군 본부다.', '도시 관리 AI "마더보드"가 폭주해 모든 기계를 장악했다.', '중앙 서버를 끄는 것만이 유일한 방법이다. 먼저 외곽 폐차장을 돌파해.', '크러셔라는 압착기가 길을 막고 있다. 벽에 들이받게 만들면 약점이 드러날 거다.'],
  ['[본부] 폐차장 돌파 확인. 좋은 솜씨군.', '다음은 냉각 시설이다. 바닥이 미끄러우니 발밑을 조심해.', '프로스트 코어... 주변 히터를 가동하면 보호막을 녹일 수 있을 거다.'],
  ['[본부] 냉각 시설 무력화. 도시 온도가 올라가고 있다.', '발전소는 마더보드의 심장이다. 전기 바닥은 발전기를 부수면 꺼진다.', '볼트 트윈스는 서로를 되살린다. 둘을 동시에 쓰러뜨려야 해.'],
  ['[본부] 발전소 정지! 서버 전력이 불안정해졌다.', '지금이 기회다. 중앙 서버로 진입해.', '[마더보드] ...침입자 확인. 제거 프로토콜을 실행합니다.']
];
const RADIO_END = ['[마더보드] 치명적 오류... 시스템... 종료...', '[본부] 서버 신호 소실... 해냈어, 요원!', '[본부] 도시의 불이 다시 켜지고 있다. 이번엔 우리 손으로.'];

// ---------- 이벤트 ----------
// act()는 {text, then(done)} 반환. then이 없으면 결과 확인 후 지도로.
const EVENTS = [
  { id: 'merchant', name: '수상한 상인', icon: '🧥', desc: '후드를 깊게 눌러쓴 상인이 반짝이는 무기를 내민다. "값은... 피로 받지."',
    choices: [
      { t: '체력 25를 내고 전설 무기 받기', can: () => run.hp > 25, act: () => { hurtRun(25); const w = makeWeapon(randomWeaponId(), 2); return { text: `상인이 사라지고 손에 ${weaponName(w)}이(가) 남았다.`, then: d => offerWeapon(w, d) }; } },
      { t: '무시한다', act: () => ({ text: '상인은 어둠 속으로 사라졌다.' }) }
    ] },
  { id: 'robot', name: '고장난 아군 로봇', icon: '🤖', desc: '저항군 표식이 새겨진 전투 로봇이 쓰러져 있다. 아직 동력이 살아 있다.',
    choices: [
      { t: '코인 50으로 수리한다 (다음 전투 동행)', can: () => run.coins >= 50, act: () => { run.coins -= 50; run.allyNext = true; return { text: '로봇의 눈에 푸른 불이 들어왔다. "지원 개시."' }; } },
      { t: '부품만 뜯어낸다 (개조 부품 1개)', act: () => { const m = rp(MOD_IDS); return { text: `${MODS[m].name}을(를) 얻었다.`, then: d => offerMod(m, d) }; } }
    ] },
  { id: 'slot', name: '슬롯머신', icon: '🎰', desc: '폐허 한가운데 슬롯머신이 요란하게 빛나고 있다. 누군가 개조한 것 같다.',
    choices: [
      { t: '코인 30 걸기', can: () => run.coins >= 30, act: () => {
        run.coins -= 30; const r = RNG();
        if (r < 0.25) return { text: '꽝! 기계가 코인을 삼켰다.' };
        if (r < 0.5) { run.coins += 60; return { text: '잭팟! 코인 60을 얻었다.' }; }
        if (r < 0.75) return { text: '강화 모듈이 튀어나왔다!', then: d => openUpgradePick({ count: 3 }, d) };
        const c = rp(CURSES.filter(c => !run.curses[c.id]));
        if (!c) { run.coins += 30; return { text: '기계가 고장나 코인이 쏟아졌다. (+30)' }; }
        applyCurse(c.id); return { text: `붉은 불빛... 저주 강화 "${c.name}"이(가) 강제로 적용되었다. (${c.gain} / ${c.cost})` };
      } },
      { t: '떠난다', act: () => ({ text: '도박은 다음에.' }) }
    ] },
  { id: 'sealed', name: '봉인된 상자', icon: '📦', desc: '마더보드의 봉인이 걸린 상자. 열면 경보가 울릴 것이다.',
    choices: [
      { t: '연다 (전설 무기, 다음 전투 엘리트 변이 2개)', act: () => { run.sealedNext = true; const w = makeWeapon(randomWeaponId(), 2); return { text: `경보가 울린다! 상자 안에는 ${weaponName(w)}.`, then: d => offerWeapon(w, d) }; } },
      { t: '그냥 둔다', act: () => ({ text: '위험은 피하는 게 상책이다.' }) }
    ] },
  { id: 'wounded', name: '부상당한 저항군', icon: '🩹', desc: '다리를 다친 저항군 대원이 벽에 기대 있다. "혹시... 치료제 좀 있나?"',
    choices: [
      { t: '회복 아이템을 나눈다 (최대 체력 -10)', act: () => { changeMaxHp(-10); run.helped = run.zone; return { text: '"고맙다, 동지. 이 은혜는 꼭 갚지."' }; } },
      { t: '지나친다', act: () => ({ text: '뒤에서 한숨 소리가 들렸다.' }) }
    ] },
  { id: 'terminal', name: '해킹 터미널', icon: '💻', desc: '마더보드 네트워크에 연결된 단말기. 코인 계좌에 접근할 수 있을지도.',
    choices: [
      { t: '해킹 시도 (50%: 코인 +45 / 50%: 체력 -15, 경보)', act: () => {
        if (RNG() < 0.5) { run.coins += 45; return { text: '해킹 성공! 코인 45를 빼돌렸다.' }; }
        hurtRun(15); run.alarmNext = true; return { text: '역추적 당했다! 감전 피해 15, 다음 전투의 적이 늘어난다.' };
      } },
      { t: '떠난다', act: () => ({ text: '괜한 흔적은 남기지 않는다.' }) }
    ] },
  { id: 'vending', name: '고장난 자판기', icon: '🥫', desc: '아직 전원이 들어오는 자판기. 발로 차면 뭔가 나올 것 같다.',
    choices: [
      { t: '발로 찬다', act: () => {
        const r = RNG();
        if (r < 0.4) { healRun(20); return { text: '회복 음료가 나왔다! 체력 20 회복.' }; }
        if (r < 0.75) { run.coins += 20; return { text: '거스름돈이 쏟아졌다. 코인 +20.' }; }
        hurtRun(10); return { text: '자판기가 넘어졌다! 피해 10.' };
      } },
      { t: '조용히 지나간다', act: () => ({ text: '...' }) }
    ] },
  { id: 'payback', name: '저항군의 보답', icon: '🤝', special: true, desc: '예전에 도와준 저항군 대원이 동료들과 함께 나타났다. "약속대로 보답하러 왔다!"',
    choices: [
      { t: '보급품을 받는다 (체력 전부 회복, 최대 체력 +15, 코인 +40)', act: () => { changeMaxHp(15); run.hp = run.maxHp; run.coins += 40; run.helped = -99; return { text: '동료들의 응원을 받으며 다시 출발한다.' }; } },
      { t: '장비를 받는다 (희귀 이상 강화 선택)', act: () => { run.helped = -99; return { text: '대원이 아껴둔 강화 모듈을 건넸다.', then: d => openUpgradePick({ count: 3, rare: true }, d) }; } }
    ] }
];
