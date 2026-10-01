// ================= 상점 =================
function priceMult() { return (1 + 0.15 * run.zone) * (run.char === 'momo' ? 0.85 : 1) * (run.oc >= 3 ? 1.2 : 1); }
function genShop() {
  const pm = priceMult();
  const items = [];
  for (let i = 0; i < 2; i++) { const w = makeWeapon(randomWeaponId(), rollGrade([55, 35, 10])); items.push({ kind: 'weapon', w, price: Math.round([45, 80, 130][w.grade] * pm) }); }
  const mods = rshuffle(MOD_IDS.slice()).slice(0, 2);
  for (const m of mods) items.push({ kind: 'mod', id: m, price: Math.round(45 * pm) });
  items.push({ kind: 'heal', amt: 30, price: Math.round(35 * pm) });
  const ups = upgradePool().filter(u => (run.ups[u.id] || 0) < (u.max || 1));
  if (ups.length) items.push({ kind: 'upgrade', id: rp(ups).id, price: Math.round(80 * pm) });
  return items;
}
function showShop() {
  menuMode();
  const key = `${run.zone}-${run.row}-${run.col}`;
  if (!run.shop || run.shop.key !== key) run.shop = { key, items: genShop(), rerolled: false };
  const sh = run.shop;
  const buy = it => {
    if (run.coins < it.price || it.sold) return;
    run.coins -= it.price; it.sold = true; SFX.play('coin');
    if (it.kind === 'weapon') offerWeapon(it.w, showShop);
    else if (it.kind === 'mod') offerMod(it.id, showShop);
    else if (it.kind === 'heal') { healRun(it.amt); showShop(); }
    else if (it.kind === 'upgrade') { addUpgrade(it.id); showShop(); }
  };
  const cards = sh.items.map(it => {
    let body = '';
    if (it.kind === 'weapon') body = `<span class="rib" style="color:${GRADES[it.w.grade].color}">${GRADES[it.w.grade].name}</span><h3 style="color:${GRADES[it.w.grade].color}">${esc(it.w.grade === 2 ? LEGEND[it.w.id].name : WEAPONS[it.w.id].name)}</h3><p>${tagHTML(WEAPONS[it.w.id].tag)} ${WEAPONS[it.w.id].desc}</p>${it.w.bonus ? `<p style="color:#4db8ff">${RARE_BONUS[it.w.bonus]}</p>` : ''}${it.w.grade === 2 ? `<p style="color:#ffb52e">${LEGEND[it.w.id].desc}</p>` : ''}`;
    if (it.kind === 'mod') body = `<span class="rib" style="color:#29f0ff">개조 부품</span><h3>${MODS[it.id].name}</h3><p>${MODS[it.id].desc}</p>`;
    if (it.kind === 'heal') body = `<span class="rib" style="color:#6dff8a">회복</span><h3>수리 키트</h3><p>체력 ${it.amt} 회복${BS.noHeal ? '<br><span style="color:#ff4d6d">광전사: 회복 불가</span>' : ''}</p>`;
    if (it.kind === 'upgrade') { const u = UPG[it.id]; body = `<span class="rib" style="color:#c77dff">강화</span><div>${tagHTML(u.tag)}</div><h3 style="margin-top:4px">${u.name}</h3><p>${u.desc}</p>`; }
    const can = !it.sold && run.coins >= it.price && !(it.kind === 'heal' && (BS.noHeal || run.hp >= run.maxHp));
    return `<div class="card ${it.kind === 'weapon' && it.w.grade === 2 ? 'legend' : it.kind === 'weapon' && it.w.grade === 1 ? 'rare' : ''} ${it.sold ? 'locked' : ''}" style="cursor:default">${body}
      <button class="btn sm ye" style="width:100%;margin:10px 0 0" ${can ? '' : 'disabled'} onclick="${cb(() => buy(it))}">${it.sold ? '판매 완료' : `◆ ${it.price}`}</button></div>`;
  }).join('');
  const reroll = SAVE.unlocks.qol_reroll && !sh.rerolled ? `<button class="btn sm mg" onclick="${cb(() => { sh.items = genShop(); sh.rerolled = true; showShop(); })}">새로고침 (무료 1회)</button>` : '';
  scr(`${topbar()}<h2>상점</h2><div class="sub">"뭐든 코인만 있으면 되지." ${run.char === 'momo' ? '<span style="color:#ffd23d">(모모 할인 -15%)</span>' : ''}</div>
    <div class="row">${cards}</div>
    <div class="row" style="margin-top:12px">${reroll}<button class="btn" onclick="${cb(showMap)}">떠나기</button></div>`, 'top');
}

// ================= 정비소 =================
function showWorkshop() {
  menuMode();
  const ups = run.weapons.map((w, i) => w.grade < 2 ? `<button class="btn ye" onclick="${cb(() => { gradeUp(w); SFX.play('pick'); toast(`${esc(weaponName(w))}(으)로 강화!`); showMap(); })}">${esc(weaponName(w))} → ${GRADES[w.grade + 1].name}</button>` : `<button class="btn" disabled>${esc(weaponName(w))} (최고 등급)</button>`).join('');
  scr(`${topbar()}<h2>정비소</h2><div class="sub">둘 중 하나만 할 수 있다.</div>
    <div class="row">${run.weapons.map(w => weaponCard(w)).join('')}</div>
    <div class="panel evbox"><h3>무기 강화</h3><p class="small muted">한 단계 등급 상승. 희귀: 개조 슬롯 1 + 무작위 보너스 · 전설: 슬롯 2 + 고유 효과</p><div class="row" style="margin-top:8px">${ups}</div></div>
    <div class="panel evbox"><h3>부품 교체</h3><p class="small muted">무작위 부품 1개를 받고, 모든 부품을 자유롭게 장착/교체한다.</p>
      <button class="btn mg" onclick="${cb(() => { run.bag.push(rp(MOD_IDS)); showModManager(showMap); })}">부품 교체 시작</button></div>`, 'top');
}

// ================= 이벤트 =================
function showEvent() {
  menuMode();
  let pool = EVENTS.filter(e => !e.special && !run.events.includes(e.id));
  if (!pool.length) pool = EVENTS.filter(e => !e.special);
  let ev = rp(pool);
  if (run.helped >= 0 && run.zone > run.helped && RNG() < 0.7) ev = EVENTS.find(e => e.id === 'payback');
  run.events.push(ev.id);
  codex('event', ev.id);
  const choose = ch => {
    const r = ch.act() || {};
    scr(`${topbar()}<div class="panel evbox"><div style="font-size:48px">${ev.icon}</div><h2>${ev.name}</h2><div class="desc">${r.text || ''}</div>
      <button class="btn ye" onclick="${cb(() => r.then ? r.then(showMap) : showMap())}">계속</button></div>`);
  };
  scr(`${topbar()}<div class="panel evbox"><div style="font-size:48px">${ev.icon}</div><h2>${ev.name}</h2><div class="desc">${ev.desc}</div>
    <div class="col">${ev.choices.map(ch => { const ok = !ch.can || ch.can(); return `<button class="btn" style="min-width:min(420px,86vw)" ${ok ? '' : 'disabled'} onclick="${cb(() => choose(ch))}">${ch.t}</button>`; }).join('')}</div></div>`);
}

// ================= 휴식 =================
function showRest() {
  menuMode();
  const pct = run.oc >= 4 ? 0.2 : 0.3;
  const amt = Math.round(run.maxHp * pct);
  scr(`${topbar()}<div class="panel evbox"><div style="font-size:48px">⛺</div><h2>휴식</h2><div class="desc">버려진 정비 기지. 잠시 숨을 돌릴 수 있다.</div>
    <div class="row">
      <div class="card ${BS.noHeal ? 'locked' : ''}" onclick="${BS.noHeal ? '' : cb(() => { healRun(amt); showMap(); })}"><h3 style="color:#6dff8a">체력 회복</h3><p>최대 체력의 ${pct * 100}% (${amt}) 회복${BS.noHeal ? '<br><span style="color:#ff4d6d">광전사: 회복 불가</span>' : ''}</p></div>
      <div class="card" onclick="${cb(() => openUpgradePick({ count: 3 }, showMap))}"><h3 style="color:#c77dff">강화 1개</h3><p>강화 3개 중 1개 선택</p></div>
    </div></div>`);
}

// ================= 결과 =================
function showResults(victory, chips, extra) {
  menuMode(); room = null;
  const t = Math.floor(run.time), mm = Math.floor(t / 60), ss = String(t % 60).padStart(2, '0');
  const reached = run.mode === 'arena' ? `웨이브 ${run.arenaWave || 0}` : `구역 ${run.zone + 1} · ${ZONES[run.zone].name}`;
  scr(`<h2 style="font-size:46px;color:${victory ? '#6dff8a' : '#ff4d6d'}">${victory ? '서버 정지 — 작전 성공' : '작전 실패'}</h2>
    <div class="sub">${CHARS[run.char].name} · ${run.mode === 'daily' ? '일일 도전' : run.mode === 'arena' ? '무한 아레나' : '캠페인'}${run.oc ? ` · 오버클럭 ${run.oc}` : ''}</div>
    <div class="row">
      <div class="panel"><div class="kv">
        <span>도달</span><span>${reached}</span>
        <span>처치 수</span><span>${run.kills}</span>
        <span>최고 콤보</span><span>${run.maxCombo} ${comboGrade(run.maxCombo)}</span>
        <span>보스 처치</span><span>${run.bossesKilled}</span>
        <span>속성 반응</span><span>${run.reactions}</span>
        <span>획득 코인</span><span class="coin">◆ ${run.coinsEarned}</span>
        <span>플레이 시간</span><span>${mm}:${ss}</span>
        <span>획득 코어 칩</span><span class="coin">◈ ${chips}</span>
        ${extra || ''}
      </div></div>
      <div class="col">${run.weapons.map(w => weaponCard(w)).join('')}</div>
    </div>
    ${buildSummaryHTML()}
    <div class="row">
      <button class="btn ye" onclick="${cb(() => run.mode === 'arena' ? startArena(run.char) : run.mode === 'daily' ? showDaily() : showCharSelect('campaign'))}">다시 하기</button>
      <button class="btn" onclick="${cb(showTitle)}">타이틀로</button>
    </div>`, 'top');
}

// ================= 해금 =================
function showUnlocks() {
  menuMode();
  const cats = [...new Set(UNLOCKS.map(u => u.cat))];
  const buy = u => { if (SAVE.chips < u.cost) return; SAVE.chips -= u.cost; SAVE.unlocks[u.id] = 1; saveGame(); SFX.play('win'); showUnlocks(); };
  const html = cats.map(c => `<h3 style="margin:14px 0 6px;color:#ff3df0">${c}</h3><div class="list">${UNLOCKS.filter(u => u.cat === c).map(u => {
    const owned = !!SAVE.unlocks[u.id];
    const condOk = u.id.startsWith('char_') && CHARS[u.id.slice(5)].unlock.check();
    const reqOk = !u.req || SAVE.unlocks[u.req];
    let btn;
    if (owned || condOk) btn = `<button class="btn sm" disabled>${condOk && !owned ? '조건 달성 — 해금됨' : '해금됨'}</button>`;
    else if (!reqOk) btn = `<button class="btn sm" disabled>이전 단계 필요</button>`;
    else btn = `<button class="btn sm ye" ${SAVE.chips >= u.cost ? '' : 'disabled'} onclick="${cb(() => buy(u))}">◈ ${u.cost}</button>`;
    return `<div class="card nohover ${owned || condOk ? 'rare' : ''}" style="cursor:default"><h3>${u.name}</h3><p>${u.desc}</p><div style="margin-top:8px">${btn}</div></div>`;
  }).join('')}</div>`).join('');
  scr(`<h2>해금 트리</h2><div class="sub">보유 코어 칩 <span class="coin">◈ ${SAVE.chips}</span> · 능력치보다 <b>선택지</b>를 늘리는 해금 위주</div>${html}
    <button class="btn" style="margin-top:14px" onclick="${cb(showTitle)}">뒤로</button>`, 'top');
}

// ================= 도감 =================
function showCodex(tab) {
  menuMode();
  const tabs = { weapon: '무기', enemy: '적', boss: '보스', reaction: '속성 반응', event: '이벤트', elite: '엘리트 변이' };
  const cx = SAVE.codex;
  let items = [];
  const unk = `<div class="card nohover"><h3 class="muted">???</h3><p class="muted">아직 발견하지 못했다.</p></div>`;
  if (tab === 'weapon') items = WEAPON_IDS.map(id => cx.weapon[id] ? `<div class="card nohover"><h3>${WEAPONS[id].name}</h3><p>${tagHTML(WEAPONS[id].tag)} ${WEAPONS[id].desc}</p><p class="small muted">피해 ${WEAPONS[id].dmg}${WEAPONS[id].pellets > 1 ? '×' + WEAPONS[id].pellets : ''} · 연사 ${WEAPONS[id].rate}/초 · 탄창 ${WEAPONS[id].mag === Infinity ? '∞' : WEAPONS[id].mag}</p><p class="small" style="color:#ffb52e">전설 「${LEGEND[id].name}」: ${LEGEND[id].desc}</p></div>` : unk);
  if (tab === 'enemy') items = Object.keys(ENEMY_INFO).map(id => cx.enemy[id] ? `<div class="card nohover"><h3 style="color:${EN[id].color}">${ENEMY_INFO[id].name}</h3><p>${ENEMY_INFO[id].desc}</p><p class="small muted">기본 체력 ${ENEMY_INFO[id].hp}</p></div>` : unk);
  if (tab === 'boss') items = Object.keys(BOSS_INFO).map(id => cx.boss[id] ? `<div class="card nohover legend"><h3>${BOSS_INFO[id].name}</h3><p class="muted small">${BOSS_INFO[id].sub}</p><p>${BOSS_INFO[id].desc}</p></div>` : unk);
  if (tab === 'reaction') items = Object.keys(REACTIONS).map(id => cx.reaction[id] ? `<div class="card nohover"><h3 style="color:${REACTIONS[id].color}">${REACTIONS[id].name}</h3><p>${REACTIONS[id].desc}</p></div>` : `<div class="card nohover"><h3 class="muted">???</h3><p class="muted">속성을 조합해 발견하라.</p></div>`);
  if (tab === 'event') items = EVENTS.map(e => cx.event[e.id] ? `<div class="card nohover"><h3>${e.icon} ${e.name}</h3><p>${e.desc}</p></div>` : unk);
  if (tab === 'elite') items = ELITE_IDS.map(id => `<div class="card nohover"><h3 style="color:${ELITES[id].color}">${ELITES[id].name}</h3><p>${ELITES[id].desc}</p></div>`);
  const cnt = k => Object.keys(cx[k] || {}).length;
  const totals = { weapon: WEAPON_IDS.length, enemy: Object.keys(ENEMY_INFO).length, boss: 4, reaction: 5, event: EVENTS.length };
  scr(`<h2>도감</h2>
    <div class="tabs">${Object.keys(tabs).map(k => `<button class="btn ${k === tab ? 'on' : ''}" onclick="${cb(() => showCodex(k))}">${tabs[k]}${totals[k] ? ` ${cnt(k)}/${totals[k]}` : ''}</button>`).join('')}</div>
    <div class="list">${items.join('')}</div>
    <button class="btn" style="margin-top:14px" onclick="${cb(showTitle)}">뒤로</button>`, 'top');
}

// ================= 설정 =================
function showSettings(back) {
  const s = SAVE.settings;
  const render = () => {
    scr(`<h2>설정</h2><div class="panel" style="width:min(520px,94vw)"><div class="kv" style="align-items:center">
      <span>화면 흔들림</span><span><button class="btn sm ${s.shake ? 'on' : ''}" onclick="${cb(() => { s.shake = !s.shake; saveGame(); render(); })}">${s.shake ? '켜짐' : '꺼짐'}</button></span>
      <span>파티클 양</span><span>${['낮음', '보통', '높음'].map((n, i) => `<button class="btn sm ${s.particles === i ? 'on' : ''}" onclick="${cb(() => { s.particles = i; saveGame(); render(); })}">${n}</button>`).join('')}</span>
      <span>피해 숫자</span><span><button class="btn sm ${s.dmgNum ? 'on' : ''}" onclick="${cb(() => { s.dmgNum = !s.dmgNum; saveGame(); render(); })}">${s.dmgNum ? '켜짐' : '꺼짐'}</button></span>
      <span>음량</span><span><input type="range" min="0" max="1" step="0.05" value="${s.vol}" oninput="SAVE.settings.vol=+this.value;SFX.setVol(+this.value)" onchange="saveGame();SFX.play('coin')"></span>
    </div></div>
    <div class="row"><button class="btn" onclick="${cb(back)}">돌아가기</button>
    <button class="btn rd sm" onclick="${cb(() => confirmBox('모든 진행 상황을 지울까요?', () => { const st = SAVE.settings; SAVE = defaultSave(); SAVE.settings = st; saveGame(); showTitle(); }, render))}">저장 데이터 초기화</button></div>`);
  };
  render();
}

// ================= 일일 도전 =================
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function showDaily() {
  menuMode();
  const ds = todayStr(), seed = hashStr('overclock-' + ds);
  const ch = CHAR_IDS[seed % 4];
  const best = SAVE.daily[ds];
  const hist = Object.keys(SAVE.daily).sort().reverse().slice(0, 7).map(k => `<tr><td>${k}</td><td class="coin">${fmt(SAVE.daily[k])}</td></tr>`).join('') || '<tr><td class="muted">기록 없음</td></tr>';
  scr(`<h2>일일 도전</h2><div class="sub">${ds} · 모두 같은 요원, 같은 경로, 같은 강화 등장 · 오버클럭 1 고정<br>기록은 이 브라우저에만 저장된다.</div>
    <div class="row">
      <div class="card nohover charcard"><div class="av" style="color:${CHARS[ch].color};background:${CHARS[ch].color}22"></div><h3 style="color:${CHARS[ch].color}">오늘의 요원: ${CHARS[ch].name}</h3><p>${CHARS[ch].skill} — ${CHARS[ch].skillDesc}</p><p class="muted small">${CHARS[ch].passive}</p></div>
      <div class="panel"><b>오늘 최고 점수</b><div class="big coin" style="margin:6px 0 12px">${best ? fmt(best) : '-'}</div><b>최근 기록</b><table class="tb" style="margin-top:6px">${hist}</table></div>
    </div>
    <div class="row"><button class="btn" onclick="${cb(showTitle)}">뒤로</button><button class="btn ye" onclick="${cb(() => startCampaign(ch, 1, 'daily', seed))}">도전 시작 ▶</button></div>`);
}

// ================= 일시정지 =================
function pauseGame() {
  if (G.screen !== 'combat' || G.paused || !run) return;
  G.paused = true;
  const w = curW(), s = wStats(w);
  scr(`<h2>일시정지</h2>
    <div class="sub">${room.obj && OBJECTIVES[room.obj.type] ? `목표: ${OBJECTIVES[room.obj.type].name} — ${OBJECTIVES[room.obj.type].desc}` : ''}</div>
    <div class="row">${run.weapons.map(x => weaponCard(x)).join('')}</div>
    ${buildSummaryHTML()}
    <div class="row">
      <button class="btn ye" onclick="${cb(resumeGame)}">계속 (ESC)</button>
      <button class="btn" onclick="${cb(() => showSettings(() => { G.paused = false; pauseGame(); }))}">설정</button>
      <button class="btn rd" onclick="${cb(() => confirmBox('이번 판을 포기할까요?', () => { G.paused = false; endRun(false); }, () => { G.paused = false; pauseGame(); }))}">포기</button>
    </div>`, 'top');
  void s;
}
function resumeGame() { if (!G.paused) return; G.paused = false; UI(''); Input.mb = [0, 0, 0]; }
