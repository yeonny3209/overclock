// ================= 게임 데이터 =================
// 속성(태그) 체계: 원소 8종은 각자 고유한 상태 이상을 가진다. 폭발/탄환/생존은 원소가 아닌 전투 스타일 태그.
const TAG_NAME = { fire: '불', elec: '전기', ice: '얼음', metal: '금속', light: '빛', dark: '어둠', wind: '바람', water: '물', poison: '독', time: '시간', sonic: '음파', exp: '폭발', bullet: '탄환', surv: '생존', none: '없음' };
const TAG_COLOR = { fire: '#ff7a2a', elec: '#ffe14d', ice: '#8fe8ff', metal: '#a9b8cc', light: '#fffbe6', dark: '#9b6bff', wind: '#7dffb8', water: '#3d8bff', poison: '#b6ff3d', time: '#d8c8ff', sonic: '#e03dff', exp: '#ff4d6d', bullet: '#e6c78a', surv: '#ff8fd0', none: '#b0a8d0' };
const ELEM_TAGS = ['fire', 'elec', 'ice', 'metal', 'light', 'dark', 'wind', 'water', 'poison', 'time', 'sonic'];
const SET_TAGS = ['fire', 'elec', 'ice', 'metal', 'light', 'dark', 'wind', 'water', 'poison', 'time', 'sonic', 'exp', 'bullet', 'surv'];
function tagHTML(t) { return `<span class="tag" style="background:${TAG_COLOR[t] || '#888'}">${TAG_NAME[t] || t}</span>`; }

// 원소별 고유 상태 이상 (서로 겹치는 동작이 없도록 설계)
const STATUS_INFO = {
  fire: { name: '화상', core: '지속 피해. 시간이 지나며 체력을 태운다.' },
  elec: { name: '감전', core: '연쇄. 맞은 적 주변으로 번개가 옮겨 붙는다.' },
  ice: { name: '빙결', core: '군중 제어. 둔화가 쌓이면 완전히 얼어붙는다.' },
  metal: { name: '파쇄', core: '방어 붕괴. 중첩마다 받는 모든 피해가 늘어난다. 보스에게도 통한다.' },
  light: { name: '실명', core: '무력화. 실명된 적은 공격하지 못하고 헤맨다. 보스는 공격이 느려진다.' },
  dark: { name: '침식', core: '처형. 중첩에 비례한 체력 이하가 되면 즉시 죽는다.' },
  wind: { name: '돌풍', core: '밀어내기. 밀려난 적이 벽에 부딪히면 충돌 피해를 받는다.' },
  water: { name: '젖음', core: '촉매. 젖은 적에게 거는 다른 상태 이상이 증폭된다.' },
  poison: { name: '중독', core: '쇠약. 최대 체력 비례 피해를 입히고, 중독된 적이 주는 피해가 줄어든다.' },
  time: { name: '메아리', core: '지연 반복. 표식 동안 받은 피해의 일부가 잠시 뒤 한 번 더 들어간다.' },
  sonic: { name: '공명', core: '울림. 공명하는 적이 받은 피해가 같은 종류의 적들에게 퍼진다.' },
  exp: { name: '폭발', core: '범위 피해. 폭발 계열 효과는 이 태그만 가진다.' },
  bullet: { name: '탄환', core: '총기 성능. 피해, 연사, 관통, 치명타.' },
  surv: { name: '생존', core: '체력, 보호막, 회복, 피해 감소.' }
};

// ---------- 캐릭터 ----------
const CHARS = {
  rain: { name: '레인', role: '돌격', color: '#ff5a5a', hp: 150, weapon: 'smg', startGrade: 1, skill: '과충전', skillDesc: '5초간 연사 속도 2배 + 피해 +20%, 재장전 불필요', cd: 14, passive: '연사 속도 +15%, 체력 30% 이하일 때 피해 +25%', unlock: null },
  momo: { name: '모모', role: '기술자', color: '#ffd23d', hp: 160, weapon: 'pistol', startGrade: 1, skill: '포탑 설치', skillDesc: '25초간 자동 사격 포탑 설치 (최대 3개). 포탑은 내 무기 속성을 쏜다.', cd: 7, passive: '상점 가격 -25%, 전투 시작 시 포탑 1개 자동 배치', unlock: { cond: '구역 2 클리어', chips: 40, check: () => SAVE.stats.zone2 } },
  kai: { name: '카이', role: '기동', color: '#3dffb0', hp: 155, weapon: 'shotgun', startGrade: 1, skill: '반사 베기', skillDesc: '넓은 부채꼴을 강하게 베고 적 탄환을 3배 위력으로 되돌림. 베는 순간 무적.', cd: 4, passive: '구르기 2회 충전, 구르기 후 1.5초간 피해 +40%', unlock: { cond: '구르기로 탄환 500발 회피', chips: 60, check: () => SAVE.stats.dodged >= 500 } },
  sera: { name: '세라', role: '저격', color: '#b48cff', hp: 150, weapon: 'sniper', startGrade: 1, skill: '시간 감속', skillDesc: '5초간 주변 시간 70% 감속, 감속 중 내 피해 +30%', cd: 11, passive: '재장전 직후 첫 발 피해 +150%, 치명타 확률 +20%', unlock: { cond: '저격총으로 보스 처치', chips: 80, check: () => SAVE.stats.sniperBoss } }
};
// 캐릭터 5~10
Object.assign(CHARS, {
  blaze: { name: '블레이즈', role: '화염술사', color: '#ff7a2a', hp: 160, weapon: 'flamer', startGrade: 1, skill: '용암 분출', skillDesc: '주변에 불길 고리를 깔고 가까운 적에게 화상 2중첩', cd: 10, passive: '화상 최대 중첩 +2, 화상 피해 +25%', unlock: { cond: '불 7세트 달성', chips: 50, check: () => SAVE.stats.set7_fire } },
  volt: { name: '볼트', role: '전격술사', color: '#ffe14d', hp: 145, weapon: 'tesla', startGrade: 1, skill: '천둥 폭풍', skillDesc: '4초간 주변 적에게 낙뢰가 쏟아짐', cd: 12, passive: '감전 연쇄 대상 +1', unlock: { cond: '속성 반응 100회 발동', chips: 50, check: () => SAVE.stats.reactions >= 100 } },
  nova: { name: '노바', role: '성기사', color: '#fff4b0', hp: 175, weapon: 'lightbeam', startGrade: 1, skill: '빛의 장막', skillDesc: '3초간 무적, 주변 적 실명, 체력 15 회복', cd: 13, passive: '받는 피해 -10%, 실명된 적에게 주는 피해 +20%', unlock: { cond: '보스 5회 처치', chips: 60, check: () => (SAVE.stats.bossKills || 0) >= 5 } },
  grim: { name: '그림', role: '처형자', color: '#9b6bff', hp: 140, weapon: 'pistol', startGrade: 1, startMods: ['conv_dark'], skill: '그림자 걸음', skillDesc: '조준 방향으로 순간이동하며 지나친 적에게 피해와 침식 3중첩', cd: 6, passive: '피해 +20%, 처형 기준 +5%, 처형할 때 체력 2 회복', unlock: { cond: '처형 50회', chips: 70, check: () => (SAVE.stats.execs || 0) >= 50 } },
  marin: { name: '마린', role: '조류술사', color: '#3d8bff', hp: 160, weapon: 'hydro', startGrade: 1, skill: '해일', skillDesc: '앞쪽으로 파도를 일으켜 피해와 젖음, 지나간 자리에 물웅덩이', cd: 10, passive: '피해 +10%, 젖은 적 상태 이상 증폭 +25%, 물웅덩이 위에서 이동 속도 +25%', unlock: { cond: '구역 3 도달', chips: 50, check: () => SAVE.stats.bestZone >= 2 } },
  iron: { name: '아이언', role: '중장갑', color: '#a9b8cc', hp: 220, weapon: 'smg', startGrade: 1, startMods: ['conv_metal'], skill: '강철 요새', skillDesc: '4초간 받는 피해 -80%, 때린 적에게 파쇄 3중첩', cd: 12, passive: '체력이 높고 연사 +20%, 이동 속도 -10%, 보스·엘리트 피해 +15%', unlock: { cond: '누적 처치 1500', chips: 70, check: () => SAVE.stats.kills >= 1500 } }
});
const CHAR_IDS = ['rain', 'momo', 'kai', 'sera', 'blaze', 'volt', 'nova', 'grim', 'marin', 'iron'];
function charUnlocked(id) { const c = CHARS[id]; return !c.unlock || !!SAVE.unlocks['char_' + id] || c.unlock.check(); }

// ---------- 무기 ----------
const WEAPONS = {
  pistol: { name: '권총', dmg: 13, rate: 3.2, mag: Infinity, reload: 0, spd: 950, spread: 0.02, pellets: 1, life: 0.85, tag: 'bullet', pierce: 0, r: 4, shake: 1.5, sfx: 'pistol', color: '#fff3a0', knock: 30, desc: '정확하지만 약하다. 탄창 무한.' },
  smg: { name: '기관단총', dmg: 7, rate: 10, mag: 30, reload: 1.3, spd: 900, spread: 0.13, pellets: 1, life: 0.7, tag: 'bullet', pierce: 0, r: 3.5, shake: 1, sfx: 'smg', color: '#ffe38a', knock: 15, desc: '빠른 연사, 탄 퍼짐.' },
  shotgun: { name: '산탄총', dmg: 9, rate: 1.3, mag: 6, reload: 1.5, spd: 850, spread: 0.38, pellets: 6, life: 0.36, tag: 'bullet', pierce: 0, r: 3.5, shake: 5, sfx: 'shotgun', color: '#ffc27a', knock: 70, desc: '근거리 특화. 6발 동시 발사.' },
  sniper: { name: '저격총', dmg: 70, rate: 1.0, mag: 5, reload: 1.8, spd: 1900, spread: 0, pellets: 1, life: 0.8, tag: 'metal', pierce: 99, r: 4, shake: 6, sfx: 'sniper', color: '#d0dcf0', knock: 40, desc: '적을 관통하는 철갑탄. 파쇄 부여.' },
  grenade: { name: '유탄발사기', dmg: 35, rate: 1, mag: 4, reload: 1.8, spd: 540, spread: 0.03, pellets: 1, life: 1.1, tag: 'exp', pierce: 0, r: 7, shake: 3, sfx: 'grenade', color: '#ff9b3d', type: 'grenade', aoe: 85, knock: 0, desc: '범위 폭발. 자신도 피해를 입을 수 있다.' },
  flamer: { name: '화염방사기', dmg: 3, rate: 20, mag: 100, reload: 2, spd: 430, spread: 0.2, pellets: 1, life: 0.42, tag: 'fire', pierce: 99, r: 9, shake: 0.3, sfx: 'flame', color: '#ff7a2a', type: 'flame', knock: 0, desc: '짧은 사거리. 화상 부여.' },
  tesla: { name: '테슬라 코일', dmg: 15, rate: 2, mag: 12, reload: 1.5, spd: 0, spread: 0, pellets: 1, life: 0, tag: 'elec', pierce: 0, r: 0, shake: 2, sfx: 'tesla', color: '#fff04d', type: 'tesla', range: 400, chain: 3, knock: 0, desc: '가까운 적 3명에게 연쇄 번개.' },
  cryo: { name: '냉각포', dmg: 9, rate: 5, mag: 20, reload: 1.4, spd: 720, spread: 0.05, pellets: 1, life: 0.8, tag: 'ice', pierce: 0, r: 5, shake: 1, sfx: 'cryo', color: '#8fe8ff', knock: 10, desc: '둔화를 부여하는 냉기탄.' },
  lightbeam: { name: '광선총', dmg: 16, rate: 2.5, mag: 15, reload: 1.6, spd: 0, spread: 0, pellets: 1, life: 0, tag: 'light', pierce: 99, r: 0, shake: 2, sfx: 'laser', color: '#fffbe6', type: 'beam', range: 900, knock: 0, desc: '벽까지 닿는 관통 광선. 실명 부여.' },
  needler: { name: '독침총', dmg: 6, rate: 8, mag: 40, reload: 1.4, spd: 1000, spread: 0.05, pellets: 1, life: 0.6, tag: 'poison', pierce: 0, r: 3, shake: 0.6, sfx: 'smg', color: '#b6ff3d', knock: 0, desc: '빠른 독침 연사. 중독 부여.' },
  chrono: { name: '시간포', dmg: 24, rate: 1.6, mag: 8, reload: 1.6, spd: 520, spread: 0, pellets: 1, life: 1.2, tag: 'time', pierce: 1, r: 7, shake: 2, sfx: 'cryo', color: '#d8c8ff', knock: 0, desc: '느리고 묵직한 시간탄. 메아리 표식.' },
  sonicgun: { name: '음파포', dmg: 7, rate: 2.2, mag: 12, reload: 1.5, spd: 700, spread: 0.55, pellets: 5, life: 0.4, tag: 'sonic', pierce: 99, r: 6, shake: 3, sfx: 'shotgun', color: '#e03dff', knock: 0, desc: '적을 꿰뚫는 음파 부채꼴. 공명 부여.' },
  hydro: { name: '물대포', dmg: 4, rate: 14, mag: 80, reload: 1.8, spd: 620, spread: 0.12, pellets: 1, life: 0.55, tag: 'water', pierce: 2, r: 6, shake: 0.4, sfx: 'water', color: '#5aa0ff', type: 'stream', knock: 0, desc: '물줄기로 적을 적신다. 젖음 부여.' },
  boomerang: { name: '부메랑 원반', dmg: 20, rate: 1.5, mag: Infinity, reload: 0, spd: 720, spread: 0, pellets: 1, life: 0.5, tag: 'wind', pierce: 99, r: 11, shake: 1.5, sfx: 'boomer', color: '#7dffb8', type: 'boomerang', knock: 0, desc: '날아갔다 돌아오며 두 번 타격. 돌풍 부여.', locked: true },
  blackhole: { name: '블랙홀 발사기', dmg: 5, rate: 0.3, mag: 2, reload: 2.5, spd: 400, spread: 0, pellets: 1, life: 0.9, tag: 'dark', pierce: 0, r: 9, shake: 4, sfx: 'bhole', color: '#9b6bff', type: 'blackhole', knock: 0, desc: '적을 빨아들이는 중력장. 침식 부여.', locked: true }
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
  smg: { name: '폭풍', desc: '계속 쏠수록 연사 속도 증가 (최대 +60%)' },
  shotgun: { name: '파쇄기', desc: '펠릿 +3, 가까운 적(150 이내)에게 피해 +40%' },
  sniper: { name: '심판', desc: '처치 시 탄 1발 회복, 관통할수록 피해 +25%' },
  grenade: { name: '집속탄', desc: '폭발 후 소형 폭탄 3개 분산' },
  flamer: { name: '용의 숨결', desc: '사거리 +50%, 명중 시 화상 2중첩' },
  tesla: { name: '뇌신', desc: '연쇄 대상 +3' },
  cryo: { name: '절대영도', desc: '빙결된 적 명중 시 얼음 파편 확산' },
  lightbeam: { name: '여명의 창', desc: '광선 3줄기 동시 발사' },
  hydro: { name: '해일포', desc: '관통 +3, 젖음 지속시간 2배' },
  needler: { name: '맹독', desc: '명중 시 중독 2중첩' },
  chrono: { name: '영원의 시계', desc: '관통 +3, 탄이 2배 오래 남음' },
  sonicgun: { name: '파쇄음', desc: '음파 +3갈래' },
  boomerang: { name: '삼중륜', desc: '원반 3개를 부채꼴로 투척' },
  blackhole: { name: '사건의 지평선', desc: '중력장 지속 2배, 빨려든 적의 침식 중첩 증가' }
};

// ---------- 개조 부품 ----------
const MODS = {
  extmag: { name: '확장 탄창', desc: '탄창 +50%' },
  ricochet: { name: '도탄 모듈', desc: '탄이 벽에 한 번 튕김' },
  split: { name: '분열 탄두', desc: '적에게 맞으면 작은 탄 2개로 갈라짐' },
  homing: { name: '유도 칩', desc: '탄이 가까운 적 쪽으로 약하게 휘어짐' },
  silencer: { name: '소음기', desc: '피해 -10%, 적이 플레이어를 늦게 알아챔' },
  conv_fire: { name: '속성 변환기: 불', desc: '무기 속성을 불로 변경', conv: 'fire' },
  conv_elec: { name: '속성 변환기: 전기', desc: '무기 속성을 전기로 변경', conv: 'elec' },
  conv_ice: { name: '속성 변환기: 얼음', desc: '무기 속성을 얼음으로 변경', conv: 'ice' },
  conv_metal: { name: '속성 변환기: 금속', desc: '무기 속성을 금속으로 변경', conv: 'metal' },
  conv_light: { name: '속성 변환기: 빛', desc: '무기 속성을 빛으로 변경', conv: 'light' },
  conv_dark: { name: '속성 변환기: 어둠', desc: '무기 속성을 어둠으로 변경', conv: 'dark' },
  conv_wind: { name: '속성 변환기: 바람', desc: '무기 속성을 바람으로 변경', conv: 'wind' },
  conv_water: { name: '속성 변환기: 물', desc: '무기 속성을 물로 변경', conv: 'water' },
  conv_poison: { name: '속성 변환기: 독', desc: '무기 속성을 독으로 변경', conv: 'poison' },
  conv_time: { name: '속성 변환기: 시간', desc: '무기 속성을 시간으로 변경', conv: 'time' },
  conv_sonic: { name: '속성 변환기: 음파', desc: '무기 속성을 음파로 변경', conv: 'sonic' }
};
const MOD_IDS = Object.keys(MODS);

// ---------- 강화 ----------
// pack: 'A' / 'B' 는 해금 트리에서 열어야 등장. 각 태그는 팩 없이도 9개 이상 모을 수 있다.
const UPGRADES = [
  // 불: 지속 피해
  { id: 'ignite', name: '점화 탄두', tag: 'fire', desc: '탄환이 20% 확률로 화상 부여', max: 2 },
  { id: 'kindling', name: '불쏘시개', tag: 'fire', desc: '화상 피해 +50%', max: 2 },
  { id: 'spreadfire', name: '연소 가속', tag: 'fire', desc: '화상 피해 간격 0.5초 → 0.35초', rare: 1 },
  { id: 'firetrail', name: '발화 구르기', tag: 'fire', desc: '구르기 경로에 불길을 남김' },
  { id: 'heat', name: '열기', tag: 'fire', desc: '화상 지속시간 +2초' },
  { id: 'incinerate', name: '소각로', tag: 'fire', desc: '화상 걸린 적에게 주는 피해 +20%', max: 2 },
  { id: 'flamearmor', name: '화염 갑옷', tag: 'fire', desc: '피격 시 주변 적에게 화상', pack: 'A' },
  // 전기: 연쇄
  { id: 'static', name: '정전기', tag: 'elec', desc: '구르기 후 다음 3발이 감전 부여' },
  { id: 'conductor', name: '도체 탄두', tag: 'elec', desc: '탄환이 15% 확률로 감전 부여', max: 2 },
  { id: 'highvolt', name: '고전압', tag: 'elec', desc: '감전 전이 피해 50% → 80% (2중첩 110%)', max: 2 },
  { id: 'chargecoil', name: '충전 코일', tag: 'elec', desc: '재장전 시 주변 적 감전 + 피해 12 (중첩 시 증가)', max: 2 },
  { id: 'overcurrent', name: '과전류', tag: 'elec', desc: '감전된 적이 받는 피해 +15%', max: 2 },
  { id: 'thunder', name: '번개 강타', tag: 'elec', desc: '치명타 시 대상에게 낙뢰 (피해 20)', rare: 1, pack: 'B' },
  { id: 'discharge', name: '방전', tag: 'elec', desc: '스킬 사용 시 주변 적 5명에게 번개', pack: 'A' },
  // 얼음: 둔화와 빙결
  { id: 'frostbite', name: '동상', tag: 'ice', desc: '둔화 지속시간 +50%', max: 2 },
  { id: 'frosttip', name: '서리 탄두', tag: 'ice', desc: '탄환이 20% 확률로 빙결 1중첩', max: 2 },
  { id: 'chill', name: '한기', tag: 'ice', desc: '둔화 30% → 45% (2중첩 60%)', max: 2 },
  { id: 'shards', name: '얼음 파편', tag: 'ice', desc: '얼어붙은 적이 죽으면 파편 6개가 튐', rare: 1 },
  { id: 'permafrost', name: '영구 동토', tag: 'ice', desc: '얼어붙음 지속시간 +1초', max: 2 },
  { id: 'frostarmor', name: '냉각 갑옷', tag: 'ice', desc: '피격 시 주변 적 빙결 2중첩', pack: 'B' },
  // 금속: 파쇄 (받는 피해 증가 중첩)
  { id: 'shrapnel', name: '파편 탄두', tag: 'metal', desc: '탄환이 25% 확률로 파쇄 1중첩', max: 2 },
  { id: 'hardened', name: '경화', tag: 'metal', desc: '파쇄 1중첩당 받는 피해 +2% 추가', max: 2 },
  { id: 'heavy', name: '중량탄', tag: 'metal', desc: '보스·엘리트에게 주는 피해 +15%', max: 2 },
  { id: 'ironskin', name: '강철 가시', tag: 'metal', desc: '피격 시 주변 적에게 파쇄 3중첩' },
  { id: 'anvil', name: '모루', tag: 'metal', desc: '파쇄 5중첩 이상인 적 명중 시 10% 확률로 피해 3배', rare: 1 },
  { id: 'grind', name: '연마', tag: 'metal', desc: '파쇄 지속시간 +4초' },
  // 빛: 실명 (공격 불가)
  { id: 'flashround', name: '섬광탄', tag: 'light', desc: '탄환이 15% 확률로 실명 부여', max: 2 },
  { id: 'glare', name: '눈부심', tag: 'light', desc: '실명 지속시간 +0.7초', max: 2 },
  { id: 'halo', name: '후광', tag: 'light', desc: '실명된 적에게 주는 피해 +25%', max: 2 },
  { id: 'lens', name: '집광 렌즈', tag: 'light', desc: '치명타가 실명을 부여' },
  { id: 'dawn', name: '여명', tag: 'light', desc: '스킬 사용 시 주변 적 전부 실명' },
  { id: 'refract', name: '빛 굴절', tag: 'light', desc: '실명된 적이 죽으면 가까운 적 2명에게 빛줄기', rare: 1 },
  // 어둠: 침식 (처형)
  { id: 'hex', name: '저주탄', tag: 'dark', desc: '탄환이 20% 확률로 침식 1중첩', max: 2 },
  { id: 'decay', name: '부패', tag: 'dark', desc: '침식 1중첩당 처형 기준 +1%', max: 2 },
  { id: 'reaper', name: '수확자', tag: 'dark', desc: '처형할 때마다 다음 3발 피해 +60%' },
  { id: 'nightfall', name: '땅거미', tag: 'dark', desc: '침식 최대 중첩 +2', max: 2 },
  { id: 'curseblood', name: '피의 저주', tag: 'dark', desc: '침식된 적이 죽으면 그 자리에 침식 웅덩이', rare: 1 },
  { id: 'umbra', name: '그늘 구르기', tag: 'dark', desc: '구르며 스친 적에게 침식 2중첩' },
  // 바람: 돌풍 (밀어내기 + 충돌)
  { id: 'gale', name: '질풍탄', tag: 'wind', desc: '탄환이 20% 확률로 돌풍 부여', max: 2 },
  { id: 'impact', name: '충돌', tag: 'wind', desc: '벽 충돌 피해 +50%', max: 2 },
  { id: 'tailwind', name: '순풍', tag: 'wind', desc: '이동 속도 +8%, 탄속 +10%', max: 2 },
  { id: 'updraft', name: '상승기류', tag: 'wind', desc: '구르기가 끝날 때 주변 적을 밀쳐냄' },
  { id: 'crosswind', name: '횡풍', tag: 'wind', desc: '돌풍 밀어내기 거리 +40%' },
  { id: 'cyclone', name: '소용돌이', tag: 'wind', desc: '벽에 부딪힌 적 주변의 적도 밀려남', rare: 1 },
  // 물: 젖음 (상태 이상 증폭)
  { id: 'splash', name: '물총탄', tag: 'water', desc: '탄환이 25% 확률로 젖음 부여', max: 2 },
  { id: 'deluge', name: '홍수', tag: 'water', desc: '젖음 지속시간 +2초', max: 2 },
  { id: 'catalyst', name: '촉매', tag: 'water', desc: '젖은 적에게 거는 상태 이상 증폭 +25%', max: 2 },
  { id: 'spray', name: '물보라 구르기', tag: 'water', desc: '구르기 경로에 물웅덩이를 남김' },
  { id: 'pressure', name: '수압', tag: 'water', desc: '젖은 적이 받는 반응 피해 +50%' },
  { id: 'riptide', name: '이안류', tag: 'water', desc: '젖은 적이 피해를 받으면 다른 젖은 적도 20% 피해', rare: 1 },
  // 독: 중독 (최대 체력 비례 피해 + 쇠약)
  { id: 'venomtip', name: '독침 탄두', tag: 'poison', desc: '탄환이 25% 확률로 중독 1중첩', max: 2 },
  { id: 'toxin', name: '독소 농축', tag: 'poison', desc: '중독 피해 +50%', max: 2 },
  { id: 'wither', name: '쇠약', tag: 'poison', desc: '중독된 적이 주는 피해 감소 25% → 40% (2중첩 55%)', max: 2 },
  { id: 'plague', name: '역병 구름', tag: 'poison', desc: '중독된 적이 죽으면 독 구름이 남음', rare: 1 },
  { id: 'neurotoxin', name: '신경독', tag: 'poison', desc: '중독된 적의 공격 속도 -30%' },
  { id: 'virulence', name: '독성', tag: 'poison', desc: '중독 지속시간 +3초' },
  // 시간: 메아리 (지연 반복 피해)
  { id: 'chronotip', name: '시간 탄두', tag: 'time', desc: '탄환이 20% 확률로 메아리 표식', max: 2 },
  { id: 'echoamp', name: '메아리 증폭', tag: 'time', desc: '메아리 피해 +20%', max: 2 },
  { id: 'quickecho', name: '단축', tag: 'time', desc: '메아리 대기 2초 → 1.4초' },
  { id: 'stasis', name: '정지장', tag: 'time', desc: '메아리가 울리면 적이 0.6초 멈춤' },
  { id: 'paradox', name: '역설', tag: 'time', desc: '메아리 피해의 50%가 주변 적에게도 들어감', rare: 1 },
  { id: 'accelerate', name: '시간 가속', tag: 'time', desc: '연사 속도 +8%', max: 2 },
  // 음파: 공명 (같은 종류에게 피해 전파)
  { id: 'sonictip', name: '음파 탄두', tag: 'sonic', desc: '탄환이 20% 확률로 공명 부여', max: 2 },
  { id: 'amplify', name: '증폭기', tag: 'sonic', desc: '공명 전달 피해 +10%', max: 2 },
  { id: 'chorus', name: '합창', tag: 'sonic', desc: '공명 범위 +200' },
  { id: 'stagger', name: '경직', tag: 'sonic', desc: '공명이 걸린 적의 공격 준비가 0.5초 늦어짐' },
  { id: 'bassdrop', name: '저음 충격', tag: 'sonic', desc: '구르기가 끝날 때 주변 적에게 음파 (공명 + 피해 20)' },
  { id: 'feedback', name: '피드백', tag: 'sonic', desc: '공명 피해가 다른 종류의 가까운 적 1명에게도 튐', rare: 1 },
  { id: 'tempo', name: '템포', tag: 'sonic', desc: '공명 지속시간 +2초' },
  // 폭발: 범위
  { id: 'chaindet', name: '연쇄 기폭', tag: 'exp', desc: '폭발에 맞은 적이 죽으면 다시 폭발 (2중첩 시 더 크게)', rare: 1, max: 2 },
  { id: 'hiexp', name: '고폭 화약', tag: 'exp', desc: '폭발 피해 +30%', max: 2 },
  { id: 'burst', name: '파열탄', tag: 'exp', desc: '탄환이 10% 확률로 소형 폭발', max: 2 },
  { id: 'blastroll', name: '폭발 구르기', tag: 'exp', desc: '구르기가 끝날 때 폭발 (자신은 피해 없음)' },
  { id: 'shockwave', name: '충격파', tag: 'exp', desc: '폭발 범위 +15%', max: 2 },
  { id: 'safety', name: '안전 장치', tag: 'exp', desc: '자신의 폭발에 피해를 입지 않음', pack: 'B' },
  // 탄환: 총기 성능
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

// 세트 효과: [3세트, 5세트, 7세트, 9세트(프리즘 각성)]. 태그마다 효과의 종류가 다르다.
const SETS = {
  fire: ['화상으로 죽은 적의 불이 주변(150)으로 옮겨 붙음', '화상 최대 5중첩', '화상 피해 2배, 화상 피해가 들어갈 때마다 10% 확률로 가까운 적에게 번짐', '태양 코어: 모든 공격이 화상, 최대 10중첩, 몸 주위 170 안의 적이 계속 불탐'],
  elec: ['감전 연쇄 대상 +2', '2.5초마다 가까운 적 3명에게 낙뢰', '연쇄된 번개가 한 번 더 튀고, 전이 피해 100%', '뇌신 강림: 모든 공격이 감전, 1초마다 화면 안의 적에게 낙뢰'],
  ice: ['얼어붙은 적이 받는 피해 +50%', '구르기 경로에 얼음 바닥 생성', '2중첩으로 빙결, 얼어붙음 +1초', '절대영도: 모든 공격이 빙결, 몸 주위 200 안의 적이 계속 얼어감, 얼어붙은 적이 죽으면 주변이 즉시 얼어붙음'],
  metal: ['파쇄 최대 10중첩', '보스·엘리트에게 주는 피해 +25%', '파쇄 1중첩당 받는 피해 5% → 8%', '강철 폭풍: 모든 공격이 파쇄 2중첩, 강철 칼날 4개가 몸 주위를 돌며 적을 벰'],
  light: ['실명 지속시간 +1초', '실명된 적에게 주는 피해는 항상 치명타', '4번 공격할 때마다 관통 광선 발사', '성광: 모든 공격이 실명, 6초마다 섬광이 터져 화면 안의 적 실명 + 적 탄 소멸'],
  dark: ['처형된 적의 영혼이 다른 적을 쫓아가 침식', '처형 기준 2배 (중첩당 3% → 6%)', '처형할 때마다 스킬 대기시간 1초 감소', '공허: 모든 공격이 침식 2중첩, 침식 최대 +5, 처형한 자리에 공허 균열이 생겨 적을 빨아들임'],
  wind: ['벽 충돌 피해 2배', '이동 속도 +20%, 구르기 충전 40% 빨라짐', '밀려난 적이 다른 적과 부딪히면 둘 다 충돌 피해', '폭풍의 눈: 모든 공격이 돌풍, 몸 주위 바람 장벽이 적 탄을 되돌려 보냄, 3초마다 주변 적을 날려버림'],
  poison: ['중독 최대 8중첩', '보스·엘리트에게도 중독 피해 감소 없음', '중독된 적이 죽으면 중독이 가장 가까운 적에게 옮겨감', '역병: 모든 공격이 중독, 몸 주위 220 안의 적이 계속 중독, 중독 피해 2배'],
  time: ['메아리 피해 40% → 60%', '메아리가 두 번 울림 (두 번째는 절반)', '메아리 피해가 치명타로 들어감', '시간 붕괴: 모든 공격이 메아리 표식, 메아리 +40%, 6초마다 화면 안의 적 1.5초 정지'],
  sonic: ['공명이 다른 종류의 적에게도 절반만큼 전해짐', '공명 전달 대상 최대 6 → 12', '공명 전달 피해 2배', '대공명: 모든 공격이 공명, 4초마다 화면 안의 적에게 음파 폭풍'],
  water: ['젖은 적이 죽으면 물웅덩이가 생김 (웅덩이는 적을 적심)', '젖은 적에게 거는 상태 이상 증폭 1.5배 → 2배', '모든 속성 반응 피해 2배', '해일: 모든 공격이 젖음, 5초마다 해일이 퍼져 주변 적을 적시고 모든 상태 이상 지속시간을 초기화'],
  exp: ['폭발 범위 +45%', '적 처치 시 35% 확률로 소형 폭발', '폭발 피해 +50%, 폭발마다 연쇄 소폭발 3개', '핵융합: 모든 명중이 소형 폭발, 자신의 폭발에 피해 없음'],
  bullet: ['탄 속도 +60%, 피해 +10%', '3발마다 관통탄', '모든 탄 관통 +2, 피해 +25%', '탄막: 탄 2발 추가 발사, 치명타 +25%, 재장전 없음'],
  surv: ['최대 체력 +40', '방에 입장할 때마다 보호막 2회', '받는 피해 -15%, 2초마다 체력 3 회복', '불사: 전투마다 1회 쓰러지면 체력 50%로 부활, 받는 피해 -25%']
};
const PRISM = '프리즘 각성 (같은 태그 강화 9개): 모든 피해 +50% + 태그마다 다른 각성 효과';

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

// ---------- 속성 반응 ----------
const REACTIONS = {
  thermal: { name: '열충격', color: '#ff8ad5', desc: '화상 + 빙결: 두 상태가 해제되며 큰 단일 피해.' },
  shatter: { name: '산산조각', color: '#bff4ff', desc: '얼어붙은 적 + 폭발: 폭발 피해 2배, 파편이 튄다.' },
  overload: { name: '과부하', color: '#ffd23d', desc: '감전 + 폭발: 폭발 범위 +50%.' },
  firestorm: { name: '화염 폭풍', color: '#ff6a1a', desc: '화상 + 기름 웅덩이: 웅덩이 전체가 불타는 지대가 된다.' },
  current: { name: '전류 확산', color: '#fff04d', desc: '감전 + 물웅덩이: 웅덩이 위 모든 적 감전.' },
  scald: { name: '증기 화상', color: '#ffc2a0', desc: '젖음 + 화상: 젖음이 증발하며 뜨거운 증기 구름이 남아 주변 적을 데운다.' },
  conduct: { name: '전도', color: '#7fd0ff', desc: '젖음 + 감전: 범위 안의 모든 젖은 적에게 번개가 흐른다.' },
  magnet: { name: '전자석', color: '#c8d8ff', desc: '파쇄 3중첩 이상 + 감전: 주변 적을 대상 쪽으로 끌어당기고 파쇄 중첩만큼 피해.' },
  rust: { name: '부식', color: '#d08a50', desc: '젖음 + 파쇄: 젖음이 사라지며 파쇄 3중첩 추가.' },
  eclipse: { name: '일식', color: '#d9b8ff', desc: '실명 + 침식: 두 상태가 사라지며 최대 체력 비례 피해 (보스는 감소).' },
  venomburn: { name: '독소 연소', color: '#d8ff6a', desc: '중독 + 화상: 남은 중독이 한꺼번에 타올라 큰 피해.' },
  eternity: { name: '영겁', color: '#e8dcff', desc: '메아리 + 둔화: 메아리가 울릴 때 적이 그대로 얼어붙는다.' },
  sonicshatter: { name: '공명 파쇄', color: '#ff9cf5', desc: '공명 + 얼어붙음: 얼음이 울려 깨지며 주변에 음파 피해.' },
  tornado: { name: '불꽃 회오리', color: '#ffb86b', desc: '화상 + 돌풍: 회오리가 불을 감아올려 주변 적에게 화상을 퍼뜨린다.' }
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
  { id: 'char_blaze', cat: '캐릭터', name: '블레이즈 (화염술사)', desc: '용암 분출 스킬. 조건: 불 7세트 달성', cost: 50 },
  { id: 'char_volt', cat: '캐릭터', name: '볼트 (전격술사)', desc: '천둥 폭풍 스킬. 조건: 속성 반응 100회', cost: 50 },
  { id: 'char_nova', cat: '캐릭터', name: '노바 (성기사)', desc: '빛의 장막 스킬. 조건: 보스 5회 처치', cost: 60 },
  { id: 'char_grim', cat: '캐릭터', name: '그림 (처형자)', desc: '그림자 걸음 스킬. 조건: 처형 50회', cost: 70 },
  { id: 'char_marin', cat: '캐릭터', name: '마린 (조류술사)', desc: '해일 스킬. 조건: 구역 3 도달', cost: 50 },
  { id: 'char_iron', cat: '캐릭터', name: '아이언 (중장갑)', desc: '강철 요새 스킬. 조건: 누적 처치 1500', cost: 70 },
  { id: 'wpn_boomerang', cat: '무기 풀', name: '부메랑 원반', desc: '상점과 상자에 부메랑 원반(바람) 등장', cost: 25 },
  { id: 'wpn_blackhole', cat: '무기 풀', name: '블랙홀 발사기', desc: '상점과 상자에 블랙홀 발사기(어둠) 등장', cost: 35 },
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
      { t: '장비를 받는다 (희귀 이상 강화 선택)', act: () => { run.helped = -99; return { text: '대원이 아껴둔 강화 모듈을 건넸다.', then: d => openUpgradePick({ count: 3, rare: true, sub: '저항군의 선물: 희귀 강화 포함' }, d) }; } }
    ] }
];
