// ================= 이벤트 확장: 시즌 1 30개 · 시즌 2 30개 =================
// 시즌 1 이벤트는 s2 표시가 없고, 시즌 2 이벤트는 s2: true. showEvent가 시즌에 맞게 고른다.
function evUp(filter) {
  const pool = upgradePool().filter(u => (run.ups[u.id] || 0) < (u.max || 1) && (!filter || filter(u)));
  if (!pool.length) { run.coins += 30; return '쓸 만한 모듈이 없어 코인 30으로 바꿨다.'; }
  const u = rp(pool); addUpgrade(u.id);
  return `강화 <b style="color:${TAG_COLOR[u.tag] || '#c77dff'}">「${u.name}」</b>을(를) 얻었다.`;
}
const evTag = t => u => u.tag === t;
function evCurse() {
  const c = rp(CURSES.filter(c => !run.curses[c.id]));
  if (!c) { hurtRun(10); return '불길한 기운이 스쳤다. 피해 10.'; }
  applyCurse(c.id); return `저주 <b style="color:#ff4d6d">「${c.name}」</b> (${c.gain} / ${c.cost})`;
}
function evOd(n) { run.od = Math.min(100, (run.od || 0) + n); return `오버클럭 게이지 +${n}%`; }
function evUpgradeWeapon() {
  const w = curW();
  if (w.grade >= 2) { run.coins += 40; return '이미 전설 등급이라 대신 코인 40을 받았다.'; }
  gradeUp(w); fixAmmo(w); return `${weaponName(w)}(으)로 강화됐다!`;
}
const evPick = (rare, sub) => d => openUpgradePick({ count: 3, rare: !!rare, sub }, d);
const evMod = () => { const m = rp(MOD_IDS); return d => offerMod(m, d); };
const evWeapon = g => { const w = makeWeapon(randomWeaponId(), g); return { w, then: d => offerWeapon(w, d) }; };

// ---------------- 시즌 1 ----------------
EVENTS.push(
  { id: 'busker', name: '거리 악사 로봇', icon: '🎷', desc: '부서진 광장에서 낡은 로봇이 색소폰을 분다. 오버클럭 이전의 노래다.',
    choices: [
      { t: '코인 15를 넣고 끝까지 듣는다', can: () => run.coins >= 15, act: () => { run.coins -= 15; return { text: '음악이 끝나자 심장이 빨리 뛰었다. ' + evOd(50) }; } },
      { t: '지나간다', act: () => ({ text: '등 뒤로 음악이 멀어졌다.' }) }
    ] },
  { id: 'scrapheap', name: '고철 더미', icon: '🔩', desc: '무너진 고철 더미 사이로 반짝이는 부품이 보인다. 위쪽 더미가 위태롭게 흔들린다.',
    choices: [
      { t: '파고든다 (50%: 개조 부품 / 50%: 피해 12)', act: () => RNG() < 0.5 ? { text: '쓸 만한 부품을 건졌다!', then: evMod() } : (hurtRun(12), { text: '더미가 무너졌다! 피해 12.' }) },
      { t: '건드리지 않는다', act: () => ({ text: '현명한 선택일지도.' }) }
    ] },
  { id: 'dronenest', name: '드론 둥지', icon: '🛸', desc: '천장에 정찰 드론 수십 대가 매달려 충전 중이다.',
    choices: [
      { t: '둥지를 부순다 (피해 10, 코인 +40)', act: () => { hurtRun(10); run.coins += 40; return { text: '드론이 우수수 떨어졌다. 배터리를 팔면 돈이 된다.' }; } },
      { t: '조용히 우회한다', act: () => ({ text: '드론들은 깨어나지 않았다.' }) }
    ] },
  { id: 'medbay', name: '버려진 의무실', icon: '🏥', desc: '전원이 반쯤 살아 있는 의무실. 자동 치료기와 약품 선반이 남아 있다.',
    choices: [
      { t: '치료기를 쓴다 (체력 35 회복)', act: () => { healRun(35, true); return { text: '상처가 아물었다.' }; } },
      { t: '약품을 챙긴다 (최대 체력 +8)', act: () => { changeMaxHp(8); return { text: '비상약을 몸에 둘렀다. 최대 체력 +8.' }; } }
    ] },
  { id: 'gunsmith', name: '떠돌이 총포상', icon: '🔧', desc: '수레를 끄는 노인이 손짓한다. "총 좀 봐 줄까? 공짜는 아니고."',
    choices: [
      { t: '코인 60: 지금 무기를 한 등급 강화', can: () => run.coins >= 60, act: () => { run.coins -= 60; return { text: evUpgradeWeapon() }; } },
      { t: '코인 35: 조준경 손질 (탄환 강화 1개)', can: () => run.coins >= 35, act: () => { run.coins -= 35; return { text: evUp(evTag('bullet')) }; } },
      { t: '사양한다', act: () => ({ text: '"다음에 또 보지."' }) }
    ] },
  { id: 'cipher', name: '저항군 암호 낙서', icon: '🖍', desc: '벽에 저항군의 암호가 휘갈겨져 있다. 보급품 위치를 가리키는 것 같다.',
    choices: [
      { t: '해독한다', act: () => RNG() < 0.7 ? (run.coins += 35, { text: '숨겨진 보급 상자를 찾았다. 코인 +35.' }) : { text: '이미 누군가 털어 간 뒤였다.' } },
      { t: '무시한다', act: () => ({ text: '시간이 아깝다.' }) }
    ] },
  { id: 'transformer', name: '과열된 변압기', icon: '⚡', desc: '변압기가 윙윙거리며 불꽃을 튀긴다. 이 전기를 흡수할 수 있다면…',
    choices: [
      { t: '전류를 흡수한다 (피해 15, 전기 강화)', act: () => { hurtRun(15); return { text: '온몸이 찌릿하다. ' + evUp(evTag('elec')) }; } },
      { t: '차단기를 내린다 (코인 +20)', act: () => { run.coins += 20; return { text: '구리선을 걷어 팔았다.' }; } }
    ] },
  { id: 'icebox', name: '냉동 컨테이너', icon: '🧊', desc: '서리가 낀 컨테이너. 안에서 푸른빛이 새어 나온다.',
    choices: [
      { t: '연다 (최대 체력 -5, 얼음 강화)', act: () => { changeMaxHp(-5); return { text: '냉기가 몸에 스며들었다. ' + evUp(evTag('ice')) }; } },
      { t: '그냥 둔다', act: () => ({ text: '손끝이 이미 시렸다.' }) }
    ] },
  { id: 'fueltank', name: '연료 탱크', icon: '🛢', desc: '반쯤 찬 연료 탱크. 무기에 쓰거나 팔 수 있다.',
    choices: [
      { t: '무기에 주입한다 (불 강화, 다음 전투 적 증가)', act: () => { run.alarmNext = true; return { text: '연료 냄새가 퍼졌다. 적이 몰려올 것이다. ' + evUp(evTag('fire')) }; } },
      { t: '판다 (코인 +35)', act: () => { run.coins += 35; return { text: '암시장 상인이 기꺼이 사 갔다.' }; } }
    ] },
  { id: 'chessai', name: '체스 두는 AI', icon: '♟', desc: '"한 판 두지. 이기면 선물을, 지면 대가를." 체스판이 빛난다.',
    choices: [
      { t: '도전한다 (50%: 희귀 강화 선택 / 50%: 저주)', act: () => RNG() < 0.5 ? { text: '체크메이트! AI가 상자를 열었다.', then: evPick(true, '체스 승리: 희귀 강화 포함') } : { text: '패배. ' + evCurse() } },
      { t: '거절한다', act: () => ({ text: '"겁쟁이." AI가 꺼졌다.' }) }
    ] },
  { id: 'bountyboard', name: '현상금 게시판', icon: '📜', desc: '저항군 게시판에 강화 기계 사냥 의뢰가 붙어 있다. 선금이 걸려 있다.',
    choices: [
      { t: '수락한다 (코인 +60, 다음 전투 엘리트 변이 2개)', act: () => { run.coins += 60; run.sealedNext = true; return { text: '선금을 받았다. 다음 상대는 만만치 않을 것이다.' }; } },
      { t: '지나간다', act: () => ({ text: '다른 사람이 맡겠지.' }) }
    ] },
  { id: 'catbot', name: '길고양이 로봇', icon: '🐈', desc: '다리 하나가 없는 고양이 로봇이 발목에 몸을 비빈다.',
    choices: [
      { t: '고쳐서 데려간다 (코인 20, 다음 전투 동행)', can: () => run.coins >= 20, act: () => { run.coins -= 20; run.allyNext = true; return { text: '"냐앙." 고양이 로봇의 눈에 불이 들어왔다.' }; } },
      { t: '쓰다듬고 간다 (체력 10)', act: () => { healRun(10, true); return { text: '잠깐이지만 마음이 놓였다.' }; } }
    ] },
  { id: 'veteran', name: '퇴역 군인', icon: '🎖', desc: '의족을 단 노병이 모닥불 앞에 앉아 있다. "젊은이, 싸우는 법을 알려 줄까?"',
    choices: [
      { t: '훈련을 받는다 (체력 -15, 강화 선택)', act: () => { hurtRun(15); return { text: '혹독했지만 몸이 기억한다.', then: evPick(false) }; } },
      { t: '옛날 이야기를 듣는다 (코인 +10)', act: () => { run.coins += 10; return { text: '대정전 이전의 도시 이야기를 들었다. ' + evOd(30) }; } }
    ] },
  { id: 'arcade', name: '버려진 오락실', icon: '🕹', desc: '기계 하나가 아직 켜져 있다. 최고 기록을 깨면 상금이 나온다고 적혀 있다.',
    choices: [
      { t: '코인 20 넣고 도전 (60%: 코인 +50)', can: () => run.coins >= 20, act: () => { run.coins -= 20; return RNG() < 0.6 ? (run.coins += 50, { text: 'NEW RECORD! 코인 +50.' }) : { text: 'GAME OVER.' }; } },
      { t: '나간다', act: () => ({ text: '삑— 삑— 화면이 깜빡였다.' }) }
    ] },
  { id: 'blackmarket', name: '암시장', icon: '🕶', desc: '지하 주차장에 천막이 즐비하다. 없는 게 없지만 값이 비싸다.',
    choices: [
      { t: '최대 체력 15를 내고 전설 무기', act: () => { changeMaxHp(-15); const o = evWeapon(2); return { text: `피를 팔아 ${weaponName(o.w)}을(를) 얻었다.`, then: o.then }; } },
      { t: '코인 90으로 희귀 강화 선택', can: () => run.coins >= 90, act: () => { run.coins -= 90; return { text: '상인이 잠긴 상자를 열었다.', then: evPick(true, '암시장: 희귀 강화 포함') }; } },
      { t: '구경만 한다', act: () => ({ text: '눈으로만 즐겼다.' }) }
    ] },
  { id: 'reactor', name: '방사능 누출 구역', icon: '☢', desc: '경고등이 깜빡인다. 지름길이지만 방사능 수치가 높다.',
    choices: [
      { t: '빠르게 통과한다 (피해 18, 코인 +30)', act: () => { hurtRun(18); run.coins += 30; return { text: '숨을 참고 달렸다. 바닥에 떨어진 코인도 주웠다.' }; } },
      { t: '돌아간다 (코인 -15)', act: () => { run.coins = Math.max(0, run.coins - 15); return { text: '길을 돌아가느라 보급품 일부를 버렸다.' }; } }
    ] },
  { id: 'datalib', name: '디지털 도서관', icon: '📚', desc: '도시의 모든 기록이 저장된 서버. 일부는 아직 열람 가능하다.',
    choices: [
      { t: '전투 데이터를 내려받는다 (강화 선택)', act: () => ({ text: '기계들의 전투 패턴을 익혔다.', then: evPick(false) }) },
      { t: '의료 데이터를 찾는다 (체력 20)', act: () => { healRun(20, true); return { text: '응급 처치법을 배웠다.' }; } }
    ] },
  { id: 'mirror', name: '깨진 홀로그램 거울', icon: '🪞', desc: '거울 속 내가 다른 무기를 들고 웃고 있다. "바꿔 줄까?"',
    choices: [
      { t: '손을 맞댄다 (저주, 전설 무기)', act: () => { const t = evCurse(); const o = evWeapon(2); return { text: `${t} 거울 속 무기가 손에 쥐어졌다: ${weaponName(o.w)}`, then: o.then }; } },
      { t: '거울을 깬다 (코인 +10)', act: () => { run.coins += 10; return { text: '유리 조각 속 홀로그램 칩을 팔았다.' }; } }
    ] },
  { id: 'recruit', name: '저항군 신병', icon: '🪖', desc: '총도 제대로 못 쥔 신병이 길을 잃었다. "보, 본대가 어디죠?"',
    choices: [
      { t: '장비를 나눠 준다 (코인 30)', can: () => run.coins >= 30, act: () => { run.coins -= 30; run.helped = run.zone; return { text: '"이 은혜 꼭 갚겠습니다!" 신병이 경례했다.' }; } },
      { t: '길만 알려 준다', act: () => ({ text: '신병은 고개를 숙이고 뛰어갔다.' }) }
    ] },
  { id: 'shrine', name: '기계 신전', icon: '⛩', desc: '누군가 고장 난 로봇들을 쌓아 제단을 만들었다. 촛불이 켜져 있다.',
    choices: [
      { t: '기도한다 (체력 전부 회복, 최대 체력 -10)', act: () => { changeMaxHp(-10); run.hp = run.maxHp; return { text: '이상하게 마음이 편안해졌다.' }; } },
      { t: '공물을 바친다 (코인 40, 무작위 강화)', can: () => run.coins >= 40, act: () => { run.coins -= 40; return { text: '제단이 웅웅 울렸다. ' + evUp() }; } },
      { t: '지나간다', act: () => ({ text: '촛불이 흔들렸다.' }) }
    ] },
  { id: 'turretcache', name: '포탑 보관소', icon: '🗼', desc: '마더보드가 쓰던 포탑들이 포장된 채 쌓여 있다.',
    choices: [
      { t: '하나를 해킹해 데려간다 (다음 전투 동행, 게이지 +50)', act: () => { run.allyNext = true; return { text: '포탑이 아군 신호로 바뀌었다. ' + evOd(50) }; } },
      { t: '분해한다 (개조 부품)', act: () => ({ text: '조준 장치를 뜯어냈다.', then: evMod() }) }
    ] },
  { id: 'rooftop', name: '고층 옥상', icon: '🏙', desc: '바람이 거센 옥상. 도시 전체가 내려다보인다.',
    choices: [
      { t: '바람을 읽는다 (바람 강화)', act: () => ({ text: '바람의 흐름이 보이기 시작했다. ' + evUp(evTag('wind')) }) },
      { t: '잠시 쉰다 (체력 20)', act: () => { healRun(20, true); return { text: '네온 불빛을 보며 숨을 골랐다.' }; } }
    ] },
  { id: 'dealer', name: '딜러 로봇', icon: '🎲', desc: '"더블 오어 낫싱. 가진 코인의 절반을 걸어 보시죠."',
    choices: [
      { t: '건다 (50%: 건 코인 2배 / 50%: 잃음)', can: () => run.coins >= 10, act: () => { const bet = Math.floor(run.coins / 2); if (RNG() < 0.5) { run.coins += bet; return { text: `승리! 코인 +${bet}.` }; } run.coins -= bet; return { text: `패배. 코인 -${bet}.` }; } },
      { t: '거절한다', act: () => ({ text: '"현명하시군요."' }) }
    ] },
  { id: 'toxicpool', name: '독성 웅덩이', icon: '🧪', desc: '형광 초록빛 웅덩이. 산업 폐기물이 끓고 있다.',
    choices: [
      { t: '샘플을 채취한다 (피해 10, 독 강화)', act: () => { hurtRun(10); return { text: '장갑이 녹았다. ' + evUp(evTag('poison')) }; } },
      { t: '돌아간다', act: () => ({ text: '냄새만으로도 머리가 아팠다.' }) }
    ] },
  { id: 'echoroom', name: '메아리 방', icon: '🌀', desc: '소리가 몇 번이고 되돌아오는 원형 방. 시간이 느리게 흐르는 것 같다.',
    choices: [
      { t: '귀를 기울인다 (시간 또는 음파 강화)', act: () => ({ text: '울림 속에서 무언가를 깨달았다. ' + evUp(u => u.tag === 'time' || u.tag === 'sonic') }) },
      { t: '서둘러 나간다', act: () => ({ text: '…나간다… 나간다… 메아리가 따라왔다.' }) }
    ] },
  { id: 'smuggler', name: '밀수업자', icon: '📦', desc: '"그 총, 나랑 바꾸지 않을래? 같은 급으로 쳐 주지."',
    choices: [
      { t: '지금 무기와 같은 등급의 다른 무기로 바꾼다', act: () => { const g = curW().grade; const w = makeWeapon(randomWeaponId(curW().id), g); return { text: `${weaponName(w)}을(를) 내밀었다.`, then: d => offerWeapon(w, d) }; } },
      { t: '거절한다', act: () => ({ text: '밀수업자는 어깨를 으쓱했다.' }) }
    ] },
  { id: 'clinicai', name: '의료 AI', icon: '🩺', desc: '"환자 확인. 강화 수술을 권장합니다. 부작용이 있을 수 있습니다."',
    choices: [
      { t: '강화 수술 (최대 체력 +20, 저주)', act: () => { changeMaxHp(20); return { text: '몸이 단단해졌다. 그러나… ' + evCurse() }; } },
      { t: '기본 치료 (코인 20, 체력 25)', can: () => run.coins >= 20, act: () => { run.coins -= 20; healRun(25, true); return { text: '"치료 완료. 안녕히 가십시오."' }; } },
      { t: '거절한다', act: () => ({ text: '"기록했습니다."' }) }
    ] },
  { id: 'debtbot', name: '빚 수금 로봇', icon: '💸', desc: '"이전 사용자의 미납금이 있습니다. 상환하시겠습니까?" 누구의 빚인지도 모른다.',
    choices: [
      { t: '갚는다 (코인 40, 희귀 강화 선택)', can: () => run.coins >= 40, act: () => { run.coins -= 40; return { text: '"신용 등급 상승. 보상을 지급합니다."', then: evPick(true, '신용 보상: 희귀 강화 포함') }; } },
      { t: '도망친다 (코인 +20, 다음 전투 적 증가)', act: () => { run.coins += 20; run.alarmNext = true; return { text: '로봇의 지갑까지 들고 튀었다. 추적 신호가 켜졌다.' }; } }
    ] },
  { id: 'memoryshard', name: '마더보드의 기억 조각', icon: '💠', desc: '보랏빛 데이터 결정이 바닥에 떨어져 있다. 손을 대면 무언가 재생될 것 같다.',
    choices: [
      { t: '재생한다 (오버클럭 게이지 가득)', act: () => ({ text: '「…사십만 개의 심장 박동. 하나도 놓치지 않겠습니다.」 낯선 목소리가 머릿속에 남았다. ' + evOd(100) }) },
      { t: '팔아 버린다 (코인 +25)', act: () => { run.coins += 25; return { text: '결정은 생각보다 비싸게 팔렸다.' }; } }
    ] },
  { id: 'emergen', name: '비상 발전기', icon: '🔋', desc: '아직 연료가 남은 비상 발전기. 무기를 과충전할 수 있을 것 같다.',
    choices: [
      { t: '무기를 과충전한다 (피해 20, 무기 한 등급 강화)', act: () => { hurtRun(20); return { text: '감전됐지만 무기가 빛났다. ' + evUpgradeWeapon() }; } },
      { t: '연료를 빼 간다 (코인 +30)', act: () => { run.coins += 30; return { text: '연료통이 묵직하다.' }; } }
    ] }
);

// ---------------- 시즌 2 ----------------
EVENTS.push(
  { id: 'tunnelrats', s2: true, name: '터널 쥐 상인', icon: '🐀', desc: '선로 틈에서 살아가는 상인들. 빛 없는 자들과 거래한다고 한다.',
    choices: [
      { t: '코인 30으로 부품을 산다', can: () => run.coins >= 30, act: () => { run.coins -= 30; return { text: '"좋은 눈이야."' + addRep('dark', 1), then: evMod() }; } },
      { t: '무시한다', act: () => ({ text: '상인들은 어둠 속으로 사라졌다.' }) }
    ] },
  { id: 'medic2', s2: true, name: '이탈한 위생병', icon: '⛑', desc: '본부를 떠난 위생병이 부상자를 돌보고 있다. "당신도 다쳤군요."',
    choices: [
      { t: '치료를 받는다 (체력 전부)', act: () => { run.hp = run.maxHp; return { text: '"살아서 돌아가요."' + addRep('res', 1) }; } },
      { t: '약품을 빼앗는다 (최대 체력 +10)', act: () => { changeMaxHp(10); return { text: '위생병의 눈빛이 식었다.' + addRep('res', -2) }; } }
    ] },
  { id: 'patrol', s2: true, name: '센티넬 순찰대', icon: '🔴', desc: '붉은 눈의 순찰대가 지나간다. 지금 기습하면 장비를 빼앗을 수 있다.',
    choices: [
      { t: '기습한다 (피해 15, 코인 +50, 무작위 강화)', act: () => { hurtRun(15); run.coins += 50; return { text: '순찰대를 쓰러뜨렸다. ' + evUp() }; } },
      { t: '숨는다', act: () => ({ text: '붉은 불빛이 머리 위를 지나갔다.' }) }
    ] },
  { id: 'whisper', s2: true, name: '마더보드의 속삭임', icon: '🫧', desc: '승강기 스피커에서 낮은 목소리가 흘러나온다. "도와드릴까요, 열한 번째?"',
    choices: [
      { t: '듣는다 (오버클럭 게이지 가득)', act: () => ({ text: '"힘을 빌려드리겠습니다."' + addRep('mom', 1) + ' ' + evOd(100) }) },
      { t: '스피커를 부순다 (체력 10)', act: () => { healRun(10, true); return { text: '조용해졌다. 오히려 숨이 편했다.' + addRep('mom', -1) }; } }
    ] },
  { id: 'vigil', s2: true, name: '촛불 추모', icon: '🕯', desc: '빛 없는 자들이 어둠 속에서 잃은 사람들의 이름을 부르고 있다.',
    choices: [
      { t: '함께 추모한다 (체력 20)', act: () => { healRun(20, true); return { text: '누군가 손을 잡아 주었다.' + addRep('dark', 1) }; } },
      { t: '조용히 지나간다', act: () => ({ text: '이름들이 등 뒤에서 이어졌다.' }) }
    ] },
  { id: 'floodlab', s2: true, name: '물에 잠긴 연구소', icon: '🌊', desc: '수로 아래 연구소가 물에 잠겨 있다. 바닥에 장비가 보인다.',
    choices: [
      { t: '잠수한다 (피해 10, 물 강화)', act: () => { hurtRun(10); return { text: '숨이 턱까지 찼다. ' + evUp(evTag('water')) }; } },
      { t: '배수해 고철을 건진다 (코인 +20)', act: () => { run.coins += 20; return { text: '젖은 고철을 팔았다.' }; } }
    ] },
  { id: 'poster', s2: true, name: '국장의 선전 포스터', icon: '📢', desc: '「질서가 돌아오면 벙커의 문이 열린다. — 한지석」 포스터가 벽을 덮고 있다.',
    choices: [
      { t: '찢는다', act: () => ({ text: '지나가던 아이가 웃었다.' + addRep('dark', 1) + addRep('res', -1) }) },
      { t: '그대로 둔다', act: () => ({ text: '포스터 속 국장이 계속 이쪽을 보고 있었다.' + addRep('res', 1) }) }
    ] },
  { id: 'keyrumor', s2: true, name: '키에 관한 소문', icon: '🗝', desc: '"사라진 요원들의 캡슐이 어디 있는지 안다." 정보상이 손을 내민다.',
    choices: [
      { t: '코인 40으로 정보를 산다 (희귀 강화 선택)', can: () => run.coins >= 40, act: () => { run.coins -= 40; return { text: '캡슐을 지키던 경비의 장비 위치를 알아냈다.', then: evPick(true, '정보상: 희귀 강화 포함') }; } },
      { t: '믿지 않는다', act: () => ({ text: '정보상은 혀를 찼다.' }) }
    ] },
  { id: 'blackbox', s2: true, name: '추락한 드론의 블랙박스', icon: '📼', desc: '본부 드론의 블랙박스. 누구에게 넘기느냐에 따라 쓰임이 달라진다.',
    choices: [
      { t: '직접 해독한다', act: () => ({ text: '「작전 07 — 요원 회수 보류. 키 회수 우선.」 국장의 서명이 있었다.' + addRep('res', 1) }) },
      { t: '마더보드 단말기에 꽂는다 (코인 +30)', act: () => { run.coins += 30; return { text: '"유용한 자료입니다. 사례하겠습니다."' + addRep('mom', 2) }; } }
    ] },
  { id: 'oldtrain', s2: true, name: '멈춘 열차', icon: '🚃', desc: '대정전 날 멈춘 열차가 그대로 남아 있다. 짐칸 문이 반쯤 열려 있다.',
    choices: [
      { t: '짐칸을 뒤진다 (50%: 희귀 이상 무기 / 50%: 피해 15)', act: () => { if (RNG() < 0.5) { const o = evWeapon(RNG() < 0.4 ? 2 : 1); return { text: `먼지 쌓인 가방 속에 ${weaponName(o.w)}!`, then: o.then }; } hurtRun(15); return { text: '경비 로봇이 깨어났다! 피해 15.' }; } },
      { t: '지나간다', act: () => ({ text: '창문 너머로 십 년 전 신문이 보였다.' }) }
    ] },
  { id: 'ticket', s2: true, name: '위조 벙커 입장권', icon: '🎫', desc: '"벙커 입장권, 진짜보다 더 진짜 같지." 위조범이 속삭인다.',
    choices: [
      { t: '산다 (코인 50, 최대 체력 +15)', can: () => run.coins >= 50, act: () => { run.coins -= 50; changeMaxHp(15); return { text: '입장권 뒤에 숨겨진 보급 쿠폰까지 받았다.' + addRep('res', -1) }; } },
      { t: '이탈 저항군에 고발한다', act: () => ({ text: '위조범이 끌려갔다.' + addRep('res', 2) + addRep('dark', -1) }) }
    ] },
  { id: 'drawings', s2: true, name: '벽의 그림', icon: '🖼', desc: '어둠 속 벽에 아이들이 그린 그림. 해, 가로등, 그리고 보라색 눈.',
    choices: [
      { t: '사진을 찍어 간직한다', act: () => ({ text: '이 그림을 위해 싸운다.' + addRep('dark', 1) + ' ' + evOd(30) }) },
      { t: '지나간다', act: () => ({ text: '보라색 눈이 등을 따라왔다.' }) }
    ] },
  { id: 'souplady', s2: true, name: '수로의 요리사', icon: '🍲', desc: '수로 한쪽에서 할머니가 수프를 끓인다. "배고프지?"',
    choices: [
      { t: '코인 15로 사 먹는다 (체력 25)', can: () => run.coins >= 15, act: () => { run.coins -= 15; healRun(25, true); return { text: '따뜻했다.' }; } },
      { t: '식량을 나눈다 (최대 체력 -5)', act: () => { changeMaxHp(-5); return { text: '"고맙다, 요원." 사람들이 모여들었다.' + addRep('dark', 2) }; } }
    ] },
  { id: 'billboard', s2: true, name: '해킹된 전광판', icon: '📺', desc: '전광판에 보랏빛 글씨가 깜빡인다. 「저는 여러분을 버린 적이 없습니다」',
    choices: [
      { t: '메시지를 계속 송출한다 (코인 +20)', act: () => { run.coins += 20; return { text: '전광판 광고비가 계좌로 들어왔다.' + addRep('mom', 1) }; } },
      { t: '전원을 끈다', act: () => ({ text: '골목이 다시 어두워졌다.' + addRep('dark', 1) + addRep('mom', -1) }) }
    ] },
  { id: 'yunamem', s2: true, name: '유나의 기억', icon: '🎧', desc: '유나가 채널을 열었다. "하린은 겁이 많았어. 그래서 요원이 됐대. 겁나는 걸 없애겠다고."',
    choices: [
      { t: '끝까지 들어 준다 (체력 15)', act: () => { healRun(15, true); return { text: '"……들어 줘서 고마워."' + addRep('res', 1) }; } },
      { t: '지금은 작전에 집중하자고 한다', act: () => ({ text: '"그래, 맞아." 유나의 목소리가 단단해졌다. ' + evOd(40) }) }
    ] },
  { id: 'walker', s2: true, name: '버려진 보행 기계', icon: '🦿', desc: '다리 넷 달린 화물 기계가 쓰러져 있다. 아직 엔진이 살아 있다.',
    choices: [
      { t: '고쳐서 데려간다 (코인 40, 다음 전투 동행)', can: () => run.coins >= 40, act: () => { run.coins -= 40; run.allyNext = true; return { text: '기계가 비틀거리며 일어섰다.' }; } },
      { t: '분해한다 (개조 부품)', act: () => ({ text: '관절 모터를 뜯어냈다.', then: evMod() }) }
    ] },
  { id: 'gasleak', s2: true, name: '가스 누출 구간', icon: '💨', desc: '통로에 가스가 가득하다. 불을 붙이면 길이 뚫리겠지만…',
    choices: [
      { t: '불을 붙인다 (피해 12, 불 강화)', act: () => { hurtRun(12); return { text: '폭발과 함께 길이 열렸다. ' + evUp(evTag('fire')) }; } },
      { t: '돌아간다 (코인 -10)', act: () => { run.coins = Math.max(0, run.coins - 10); return { text: '먼 길을 돌았다.' }; } }
    ] },
  { id: 'camp', s2: true, name: '센티넬 수용소', icon: '⛓', desc: '「질서 위반자」로 분류된 시민들이 갇혀 있다. 문을 열면 경보가 울린다.',
    choices: [
      { t: '문을 연다 (다음 전투 적 증가)', act: () => { run.alarmNext = true; return { text: '사람들이 어둠 속으로 흩어졌다.' + addRep('dark', 2) + addRep('res', 1) }; } },
      { t: '지나간다', act: () => ({ text: '철창 너머 눈빛들이 오래 남았다.' + addRep('dark', -1) }) }
    ] },
  { id: 'signaltower', s2: true, name: '신호탑', icon: '📡', desc: '두 개의 주파수가 엇갈린다. 본부의 붉은 신호, 마더보드의 보랏빛 신호.',
    choices: [
      { t: '본부 신호를 가로챈다 (무작위 강화)', act: () => ({ text: '작전 지도를 손에 넣었다. ' + evUp() + addRep('res', 1) }) },
      { t: '마더보드 신호에 접속한다 (무작위 강화)', act: () => ({ text: '"반갑습니다." ' + evUp() + addRep('mom', 1) }) }
    ] },
  { id: 'gambler2', s2: true, name: '수로 도박사', icon: '🃏', desc: '"한 판 어때? 이 아래에선 운도 실력이야."',
    choices: [
      { t: '코인 25 건다 (60%: 코인 +70)', can: () => run.coins >= 25, act: () => { run.coins -= 25; return RNG() < 0.6 ? (run.coins += 70, { text: '대박! 코인 +70.' }) : { text: '도박사가 웃으며 코인을 쓸어 갔다.' }; } },
      { t: '거절한다', act: () => ({ text: '"재미없긴."' }) }
    ] },
  { id: 'emptypod', s2: true, name: '열린 캡슐', icon: '🫙', desc: '이미 열린 요원 캡슐. 안에 남은 이름표에는 숫자만 희미하게 보인다.',
    choices: [
      { t: '안을 살핀다 (최대 체력 +5)', act: () => { changeMaxHp(5); return { text: '캡슐 벽에 손톱으로 새긴 글씨: 「살아 있다. 기다려.」 비상 보급 키트도 남아 있었다.' }; } },
      { t: '지나간다', act: () => ({ text: '누가 먼저 열었는지는 알 수 없었다.' }) }
    ] },
  { id: 'twindoors', s2: true, name: '두 개의 문', icon: '🚪', desc: '왼쪽 문은 붉게, 오른쪽 문은 보랏빛으로 잠겨 있다. 하나만 열 수 있다.',
    choices: [
      { t: '붉은 문 (센티넬 무기고: 희귀 무기)', act: () => { const o = evWeapon(1); return { text: `무기고에서 ${weaponName(o.w)}을(를) 꺼냈다.` + addRep('res', -1), then: o.then }; } },
      { t: '보랏빛 문 (희귀 강화 선택)', act: () => ({ text: '"이쪽을 고르실 줄 알았습니다."' + addRep('mom', 1), then: evPick(true, '보랏빛 문: 희귀 강화 포함') }) }
    ] },
  { id: 'purifier', s2: true, name: '고장 난 정수기', icon: '🚰', desc: '수로의 정수기를 고치면 깨끗한 물이 나온다. 사람들이 빈 병을 들고 기다린다.',
    choices: [
      { t: '고쳐서 모두에게 (코인 20)', can: () => run.coins >= 20, act: () => { run.coins -= 20; return { text: '사람들이 줄을 서서 물을 받았다.' + addRep('dark', 2) }; } },
      { t: '혼자 마신다 (체력 30)', act: () => { healRun(30, true); return { text: '목이 시원했다. 뒤에서 수군거림이 들렸다.' + addRep('dark', -1) }; } }
    ] },
  { id: 'informant', s2: true, name: '이중 정보원', icon: '🕵', desc: '"국장의 약점과 마더보드의 약점. 하나만 팔지."',
    choices: [
      { t: '국장의 약점을 산다 (피해 10)', act: () => { hurtRun(10); return { text: '거래 도중 습격을 받았지만 정보는 챙겼다. 「국장은 벙커 명단에 자기 이름을 넣지 않았다.」' + addRep('res', 2) }; } },
      { t: '마더보드의 약점을 산다 (코인 +40)', act: () => { run.coins += 40; return { text: '「백업 코어는 열한 개의 키를 두려워한다.」 정보원은 오히려 돈을 쥐여 주었다.' + addRep('mom', -2) }; } }
    ] },
  { id: 'railcart', s2: true, name: '선로 수레', icon: '🛤', desc: '손으로 미는 선로 수레가 있다. 타고 가면 빠르지만 거칠다.',
    choices: [
      { t: '타고 달린다 (피해 8, 게이지 +60)', act: () => { hurtRun(8); return { text: '바람을 가르며 달렸다! ' + evOd(60) }; } },
      { t: '걸어간다 (체력 10)', act: () => { healRun(10, true); return { text: '천천히 숨을 고르며 걸었다.' }; } }
    ] },
  { id: 'machinegrave', s2: true, name: '기계들의 무덤', icon: '⚰', desc: '부서진 기계 수백 대가 쌓인 곳. 누군가 기계마다 이름표를 붙여 두었다.',
    choices: [
      { t: '부품을 모은다 (개조 부품)', act: () => ({ text: '이름표 몇 개가 바닥에 떨어졌다.' + addRep('mom', -1), then: evMod() }) },
      { t: '잠시 추모한다 (체력 15)', act: () => { healRun(15, true); return { text: '이상하게도 고개가 숙여졌다.' + addRep('mom', 1) }; } }
    ] },
  { id: 'riotshield', s2: true, name: '버려진 진압 방패', icon: '🛡', desc: '레드라인 부대가 버리고 간 진압 방패. 아직 쓸 만하다.',
    choices: [
      { t: '챙긴다 (생존 강화)', act: () => ({ text: '방패 판을 갑옷에 덧댔다. ' + evUp(evTag('surv')) }) },
      { t: '판다 (코인 +35)', act: () => { run.coins += 35; return { text: '고철상이 반겼다.' }; } }
    ] },
  { id: 'lantern', s2: true, name: '등불지기', icon: '🏮', desc: '외곽 3구역의 등불을 지키는 노인. "불을 나눠 줄 수 있나?"',
    choices: [
      { t: '배터리를 기증한다 (코인 30)', can: () => run.coins >= 30, act: () => { run.coins -= 30; return { text: '골목 하나가 환해졌다. 정전 중 시야가 넓어진다.' + addRep('dark', 2) }; } },
      { t: '등불을 산다 (코인 20, 빛 강화)', can: () => run.coins >= 20, act: () => { run.coins -= 20; return { text: '작은 등불이 손에 쥐어졌다. ' + evUp(evTag('light')) }; } },
      { t: '지나간다', act: () => ({ text: '노인은 다음 손님을 기다렸다.' }) }
    ] },
  { id: 'broadcastroom', s2: true, name: '방송실', icon: '🎙', desc: '전 도시로 송출되는 방송실. 마이크는 켜져 있다.',
    choices: [
      { t: '지금까지 본 진실을 방송한다', act: () => ({ text: '도시 곳곳의 스피커가 내 목소리를 실어 날랐다.' + addRep('dark', 2) + addRep('res', -1) + addRep('mom', 1) }) },
      { t: '녹음만 해 둔다 (코인 +20)', act: () => { run.coins += 20; return { text: '언젠가 쓸 날이 올 것이다.' }; } }
    ] },
  { id: 'lastsupply', s2: true, name: '마지막 보급 상자', icon: '🎁', desc: '이탈 저항군이 남긴 보급 상자. 쪽지가 붙어 있다. 「필요한 사람이 가져가길」',
    choices: [
      { t: '연다 (희귀 강화 선택, 다음 전투 엘리트 변이 2개)', act: () => { run.sealedNext = true; return { text: '상자 안쪽에 추적기가 붙어 있었다…', then: evPick(true, '보급 상자: 희귀 강화 포함') }; } },
      { t: '사람들과 나눈다 (체력 15)', act: () => { healRun(15, true); return { text: '나눠 먹는 통조림이 이렇게 맛있을 줄이야.' + addRep('dark', 1) + addRep('res', 1) }; } }
    ] }
);
