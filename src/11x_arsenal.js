// ================= 신규 무기 5종 · 강화 8종 =================
// 기존 탄 종류(관통탄 · 유탄 · 산탄 · 연쇄 번개 · 분무)를 그대로 쓰되, 속성과 손맛을 바꿨다.
Object.assign(WEAPONS, {
  crossbow: { name: '석궁', dmg: 38, rate: 1.7, mag: 8, reload: 1.4, spd: 1600, spread: 0.01, pellets: 1, life: 0.8, tag: 'bullet', pierce: 2, r: 4, shake: 2.5, sfx: 'sniper', color: '#d9c7a0', knock: 55, desc: '조용하고 빠른 화살. 적 두 명까지 꿰뚫는다.' },
  napalm: { name: '소이탄 발사기', dmg: 24, rate: 1.1, mag: 5, reload: 1.9, spd: 560, spread: 0.03, pellets: 1, life: 1.0, tag: 'fire', pierce: 0, r: 7, shake: 3, sfx: 'grenade', color: '#ff7a2a', type: 'grenade', aoe: 72, knock: 0, desc: '터지는 자리에 불을 붙이는 소이탄. 화상 부여.' },
  icicle: { name: '고드름 산탄총', dmg: 6, rate: 1.5, mag: 6, reload: 1.5, spd: 880, spread: 0.42, pellets: 8, life: 0.38, tag: 'ice', pierce: 0, r: 3.5, shake: 4, sfx: 'shotgun', color: '#bff4ff', knock: 45, desc: '얼음 파편 8발. 맞은 적을 느리게 만든다.' },
  arcgauntlet: { name: '아크 건틀릿', dmg: 11, rate: 3, mag: 18, reload: 1.4, spd: 0, spread: 0, pellets: 1, life: 0, tag: 'elec', pierce: 0, r: 0, shake: 1.5, sfx: 'tesla', color: '#9ff2ff', type: 'tesla', range: 320, chain: 5, knock: 0, desc: '사거리는 짧지만 번개가 5명까지 튄다.' },
  toxinspray: { name: '독안개 분무기', dmg: 3, rate: 12, mag: 70, reload: 1.7, spd: 560, spread: 0.16, pellets: 1, life: 0.5, tag: 'poison', pierce: 2, r: 7, shake: 0.3, sfx: 'water', color: '#9bff5a', type: 'stream', knock: 0, desc: '녹색 안개를 뿜어 중독을 쌓는다.' }
});
WEAPON_IDS.push('crossbow', 'napalm', 'icicle', 'arcgauntlet', 'toxinspray');
Object.assign(LEGEND, {
  crossbow: { name: '관통의 화살비', desc: '관통 +2, 피해 +20%' },
  napalm: { name: '불바다', desc: '폭발 범위 +30%, 피해 +20%' },
  icicle: { name: '빙하 폭풍', desc: '파편 +3발' },
  arcgauntlet: { name: '천둥의 손', desc: '연쇄 +2명' },
  toxinspray: { name: '맹독 구름', desc: '피해 +40%, 분사 거리 +30%' }
});
UPGRADES.push(
  { id: 'steadyhand', name: '안정 조준', tag: 'none', desc: '탄 퍼짐 -25%', max: 2 },
  { id: 'longbarrel', name: '긴 총열', tag: 'none', desc: '탄속 +15%, 피해 +5%', max: 2 },
  { id: 'rollplate', name: '구르기 정비', tag: 'none', desc: '구르기 재사용 시간 -15%', max: 2 },
  { id: 'lightarmor', name: '경량 장갑', tag: 'none', desc: '이동속도 +6%, 받는 피해 -3%', max: 3 },
  { id: 'grit', name: '근성', tag: 'none', desc: '최대 체력 +25', max: 3 },
  { id: 'fastmag', name: '속전 탄창', tag: 'none', desc: '재장전 시간 -15%', max: 2 },
  { id: 'tactician', name: '전술 분석', tag: 'none', desc: '스킬 재사용 -10%, 콤보 유지 +1초', max: 2 },
  { id: 'bounty', name: '현상금 감각', tag: 'none', desc: '코인 획득 +15%, 행운 +10%', max: 2 }
);
UPGRADES.forEach(u => UPG[u.id] = u);
function arsenalBuild() {
  const u = id => (run && run.ups[id]) || 0;
  BS.spreadMult *= Math.pow(0.75, u('steadyhand'));
  BS.bulletSpd *= Math.pow(1.15, u('longbarrel')); BS.dmgMult *= Math.pow(1.05, u('longbarrel'));
  BS.rollCdMult *= Math.pow(0.85, u('rollplate'));
  BS.moveMult *= Math.pow(1.06, u('lightarmor')); BS.takenMult *= Math.pow(0.97, u('lightarmor'));
  BS.hpAdd = 25 * u('grit');
  BS.reloadMult *= Math.pow(0.85, u('fastmag'));
  BS.cdMult *= Math.pow(0.9, u('tactician')); BS.comboTime += u('tactician');
  BS.coinMult *= Math.pow(1.15, u('bounty')); BS.lucky += 0.1 * u('bounty');
}
