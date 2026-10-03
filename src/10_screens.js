// ================= DOM UI 보조 =================
let CBID = 0; const CBS = {};
function cb(fn) { const id = ++CBID; CBS[id] = fn; return `CBrun(${id})`; }
function CBrun(id) { SFX.init(); SFX.play('ui'); const f = CBS[id]; if (f) f(); }
function UI(html) {
  for (const k in CBS) if (+k < CBID - 800) delete CBS[k];
  if (radioState) { clearInterval(radioState.timer); radioState = null; } // 화면이 바뀌면 무전은 닫는다
  $('ui').innerHTML = html;
}
function scr(html, cls = '') { UI(`<div class="scr ${cls}">${html}</div>`); }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function menuMode() { G.screen = 'menu'; G.paused = false; }

// ================= 타이틀 =================
function showTitle() {
  menuMode(); room = null; run = null; recomputeBuild();
  scr(`
    <div class="logo">오버클럭</div>
    <div class="logo-en">OVERCLOCK</div>
    <div class="col">
      ${(() => { const r = peekRun('campaign'); return r ? `<button class="btn big ye" onclick="${cb(() => resumeRun('campaign'))}">▶ 이어하기 <span class="muted small">${CHARS[r.char].name} · 구역 ${r.zone + 1}${r.oc ? ' · OC' + r.oc : ''}</span></button>` : ''; })()}
      <button class="btn big" onclick="${cb(() => showCharSelect('campaign'))}">${peekRun('campaign') ? '새 캠페인' : '▶ 캠페인'}</button>
      <button class="btn" onclick="${cb(() => showCharSelect('arena'))}">무한 아레나 <span class="muted small">최고 ${SAVE.arenaBest}웨이브</span></button>
      <button class="btn" onclick="${cb(showDaily)}">일일 도전</button>
      <div class="row" style="gap:0">
        <button class="btn mg sm" style="min-width:108px" onclick="${cb(showUnlocks)}">해금 <span class="coin">◈${SAVE.chips}</span></button>
        <button class="btn mg sm" style="min-width:108px" onclick="${cb(() => showCodex('element'))}">도감</button>
        <button class="btn mg sm" style="min-width:108px" onclick="${cb(() => showSettings(showTitle))}">설정</button>
        <button class="btn mg sm" style="min-width:108px" onclick="${cb(() => showHelp(showTitle))}">도움말</button>
      </div>
    </div>
    <div class="hint">WASD 이동 · 마우스 조준 · 좌클릭 사격 · 우클릭 스킬 · 스페이스 구르기<br>R 재장전 · Q/휠 무기 교체 · E 상호작용 · ESC 일시정지 · 게임패드 지원</div>
    <div class="hint small">도시 관리 AI "마더보드"가 폭주했다. 네 개 구역을 돌파해 중앙 서버를 꺼라.</div>
    ${/^https?:/.test(location.protocol) ? `<div class="hint small"><a href="overclock.apk" download style="color:#29f0ff">안드로이드 앱(APK) 받기</a> · 아이폰/아이패드는 Safari 공유 → 홈 화면에 추가</div>` : ''}
  `);
}

// ================= 캐릭터 선택 =================
function showCharSelect(mode) {
  menuMode();
  let sel = CHAR_IDS.find(charUnlocked) || 'rain';
  let oc = Math.min(SAVE.ocMax, SAVE.lastOc || 0);
  let hard = !!SAVE.lastHard;
  const render = () => {
    const cards = CHAR_IDS.map(id => {
      const c = CHARS[id], ok = charUnlocked(id);
      return `<div class="card charcard ${ok ? '' : 'locked'} ${sel === id ? 'sel' : ''}" onclick="${ok ? cb(() => { sel = id; render(); }) : ''}">
        <div class="av" style="color:${c.color};background:${c.color}22"></div>
        <h3 style="color:${c.color}">${c.name} <span class="muted small">${c.role}</span></h3>
        <p><b>스킬 · ${c.skill}</b><br>${c.skillDesc}<br><span class="muted small">대기 ${c.cd}초</span></p>
        <p style="margin-top:6px"><b>패시브</b><br>${c.passive}</p>
        <p style="margin-top:6px" class="muted">시작 무기: ${GRADES[c.startGrade || 0].name} ${WEAPONS[c.weapon].name}${c.startMods ? ' (' + c.startMods.map(m => MODS[m].name.replace('속성 변환기: ', '') + ' 변환').join(', ') + ')' : ''} · 체력 ${c.hp}</p>
        ${ok ? '' : `<p style="margin-top:8px;color:#ff4d6d"><b>잠김</b> — ${c.unlock.cond}<br>또는 코어 칩 ◈${c.unlock.chips}로 해금</p>`}
      </div>`;
    }).join('');
    const hardHtml = `<div class="ocsel"><button class="btn sm ${hard ? 'rd on' : 'rd'}" style="${hard ? 'background:#ff2d55;color:#fff' : ''}" onclick="${cb(() => { hard = !hard; render(); })}">하드 모드: ${hard ? '켜짐' : '꺼짐'}</button><span class="small muted">적 체력 +60% · 적 피해 +40% · 엘리트 증가 · 회복 감소 · 보스 추가 패턴 · 코어 칩 2배</span></div>`;
    const ocHtml = mode === 'campaign' ? `
      <div class="ocsel">
        <span>오버클럭 레벨</span>
        <button class="btn sm" onclick="${cb(() => { oc = Math.max(0, oc - 1); render(); })}">◀</button>
        <b>${oc}</b>
        <button class="btn sm" onclick="${cb(() => { oc = Math.min(SAVE.ocMax, oc + 1); render(); })}">▶</button>
        <span class="muted small">최대 ${SAVE.ocMax}</span>
      </div>
      <div class="small muted" style="max-width:640px;text-align:center;min-height:36px">${oc ? OC_LEVELS.slice(1, oc + 1).map((t, i) => `<span style="color:#ff3df0">${i + 1}</span> ${t}`).join(' · ') : '기본 난이도. 클리어하면 다음 오버클럭 레벨이 열린다.'}</div>` : `<div class="sub">한 경기장에서 끝없이 몰려오는 웨이브. 3웨이브마다 강화, 5웨이브마다 무기 상자, 10웨이브마다 보스.</div>`;
    scr(`<h2>${mode === 'campaign' ? '요원 선택' : '무한 아레나'}</h2>
      <div class="row">${cards}</div>
      ${ocHtml}
      ${hardHtml}
      <div class="row" style="margin-top:10px">
        <button class="btn" onclick="${cb(showTitle)}">뒤로</button>
        <button class="btn ye" onclick="${cb(() => { SAVE.lastOc = oc; SAVE.lastHard = hard; saveGame(); mode === 'campaign' ? startCampaign(sel, oc, 'campaign', 0, hard) : startArena(sel, hard); })}">출격 ▶</button>
      </div>`, 'top');
  };
  render();
}

// ================= 무전 =================
let radioState = null;
function radio(lines, done) {
  if (SAVE.settings.skipRadio) { if (done) setTimeout(done, 0); return; }
  const el = document.createElement('div');
  el.className = 'radio';
  $('ui').appendChild(el);
  radioState = { lines, i: 0, ch: 0, el, done, timer: null };
  const typeLine = () => {
    const st = radioState; if (!st) return;
    st.ch = 0; clearInterval(st.timer);
    const txt = st.lines[st.i];
    st.timer = setInterval(() => {
      st.ch += 2; st.el.innerHTML = esc(txt.slice(0, st.ch)).replace(/^(\[[^\]]+\])/, '<b style="color:#29f0ff">$1</b>');
      if (st.ch % 6 === 0) SFX.play('ui', 0.3);
      if (st.ch >= txt.length) clearInterval(st.timer);
    }, 22);
  };
  radioState.type = typeLine;
  el.onclick = advanceRadio;
  typeLine();
}
function advanceRadio() {
  const st = radioState; if (!st) return;
  const txt = st.lines[st.i];
  if (st.ch < txt.length) { st.ch = txt.length; clearInterval(st.timer); st.el.innerHTML = esc(txt).replace(/^(\[[^\]]+\])/, '<b style="color:#29f0ff">$1</b>'); return; }
  st.i++;
  if (st.i >= st.lines.length) { clearInterval(st.timer); st.el.remove(); radioState = null; if (st.done) st.done(); return; }
  st.type();
}

// ================= 상단 정보 바 =================
function topbar() {
  const ws = run.weapons.map(w => `<span style="color:${GRADES[w.grade].color}">${esc(weaponName(w))}</span>`).join(' / ');
  const tags = SET_TAGS.filter(t => run.tags[t]).map(t => `<span class="tag" style="background:${TAG_COLOR[t]}">${TAG_NAME[t]} ${run.tags[t]}</span>`).join('');
  return `<div class="topbar">
    <div><b>${CHARS[run.char].name}</b> <span class="hpbar"><i style="width:${run.hp / run.maxHp * 100}%"></i></span> ${Math.ceil(run.hp)}/${run.maxHp}
      &nbsp; <span class="coin">◆ ${run.coins}</span> ${run.oc ? `&nbsp;<span style="color:#ff3df0">OC ${run.oc}</span>` : ''}${run.hard ? '&nbsp;<b style="color:#ff2d55">HARD</b>' : ''}</div>
    <div class="small">${ws}</div>
    <div>${tags} ${Object.keys(run.curses).map(c => `<span class="tag" style="background:#ff2d55;color:#fff">${CURSE[c].name}</span>`).join('')}</div>
  </div>`;
}

// ================= 경로 지도 =================
function availableNodes() {
  if (run.row < 0) return run.map[0].map((_, i) => i);
  const cur = run.map[run.row][run.col];
  return cur ? cur.next : [];
}
function showMap() {
  menuMode(); room = null;
  saveRun(); saveGame();
  const Z = ZONES[run.zone];
  const avail = availableNodes();
  const nextRow = run.row + 1;
  const pos = n => ({ x: 8 + n.x * 84, y: 6 + n.r / 6 * 86 });
  let lines = '', nodes = '';
  run.map.forEach((row, r) => row.forEach((n, i) => {
    const a = pos(n);
    for (const j of n.next) {
      const b = pos(run.map[r + 1][j]);
      const taken = n.visited && run.map[r + 1][j].visited;
      const hot = r === run.row && i === run.col;
      lines += `<line x1="${a.x}%" y1="${a.y}%" x2="${b.x}%" y2="${b.y}%" stroke="${taken ? Z.accent : hot ? '#29f0ff' : '#3a3660'}" stroke-width="${taken || hot ? 3 : 2}" ${taken || hot ? '' : 'stroke-dasharray="6 6"'}/>`;
    }
    const info = NODE_INFO[n.type];
    const isAvail = r === nextRow && avail.includes(i);
    const cls = ['node', n.type === 'boss' ? 'boss' : '', isAvail ? 'avail' : '', n.visited ? 'done' : '', r === run.row && i === run.col ? 'cur' : ''].join(' ');
    const label = n.type === 'combat' && n.obj ? OBJECTIVES[n.obj].name : n.type === 'boss' ? BOSS_INFO[Z.boss].name : info.name;
    nodes += `<div class="${cls}" style="left:${a.x}%;top:${a.y}%;color:${info.color};border-color:${isAvail ? info.color : ''}" ${isAvail ? `onclick="${cb(() => enterNode(r, i))}"` : ''} title="${label}">${info.icon}<span class="nl">${label}</span></div>`;
  }));
  scr(`${topbar()}
    <h2 style="margin-top:6px">구역 ${run.zone + 1} · ${Z.name} <span class="muted" style="font-size:16px;font-family:Orbitron">${Z.en}</span></h2>
    <div class="small muted">${Object.values(NODE_INFO).map(n => `<span style="color:${n.color}">${n.icon}</span> ${n.name}`).join(' &nbsp; ')}</div>
    <div class="map"><svg>${lines}</svg>${nodes}</div>
    <div class="row" style="margin-top:4px">
      <button class="btn sm" onclick="${cb(() => showLoadout(showMap))}">장비 / 빌드 보기</button>
      <button class="btn sm" onclick="${cb(() => showSettings(showMap))}">설정</button>
      <button class="btn sm" onclick="${cb(() => showHelp(showMap))}">도움말</button>
      <button class="btn sm rd" onclick="${cb(() => confirmBox('이번 판을 포기할까요?', () => endRun(false), showMap))}">포기</button>
    </div>`, 'top');
}
function confirmBox(msg, yes, no) {
  scr(`<div class="panel evbox"><h2>${msg}</h2><div class="row" style="margin-top:14px">
    <button class="btn rd" onclick="${cb(yes)}">예</button><button class="btn" onclick="${cb(no)}">아니오</button></div></div>`);
}

// ================= 장비 / 빌드 =================
function weaponCard(w, extra = '') {
  const s = wStats(w), b = WEAPONS[w.id];
  const cls = w.grade === 2 ? 'legend' : w.grade === 1 ? 'rare' : '';
  const mods = w.mods.length ? w.mods.map(m => m ? `<span class="tag" style="background:#29f0ff">${MODS[m].name}</span>` : '<span class="tag" style="background:#2a3050;color:#8a90b0">빈 슬롯</span>').join('') : '<span class="muted small">개조 슬롯 없음</span>';
  const dmg = b.pellets > 1 ? `${s.dmg.toFixed(1)}×${s.pellets}` : s.dmg.toFixed(1);
  return `<div class="card nohover ${cls}" style="cursor:default">
    <span class="rib" style="color:${GRADES[w.grade].color}">${GRADES[w.grade].name}</span>
    <h3 style="color:${GRADES[w.grade].color}">${esc(w.grade === 2 ? LEGEND[w.id].name : b.name)}</h3>
    <p class="muted small">${b.name} · ${b.desc}</p>
    <p>${tagHTML(s.tag)} 피해 ${dmg} · 연사 ${s.rate.toFixed(1)}/초 · 탄창 ${s.mag === Infinity ? '∞' : s.mag}</p>
    ${w.bonus ? `<p style="color:#4db8ff">보너스: ${RARE_BONUS[w.bonus]}</p>` : ''}
    ${w.grade === 2 ? `<p style="color:#ffb52e">고유: ${LEGEND[w.id].desc}</p>` : ''}
    <p style="margin-top:6px">${mods}</p>${extra}
  </div>`;
}
function buildSummaryHTML() {
  const ups = Object.keys(run.ups).map(id => `<span class="tag" style="background:${TAG_COLOR[UPG[id].tag]}">${UPG[id].name}${run.ups[id] > 1 ? ' ×' + run.ups[id] : ''}</span>`).join('') || '<span class="muted">없음</span>';
  const sets = SET_TAGS.map(t => {
    const n = run.tags[t] || 0;
    if (!n) return '';
    const col = k => n >= k ? TAG_COLOR[t] : '#5a6080';
    return `<tr><td style="white-space:nowrap">${tagHTML(t)} ${n}</td><td style="color:${col(3)}">3: ${SETS[t][0]}</td><td style="color:${col(5)}">5: ${SETS[t][1]}</td><td style="color:${col(7)}">7: ${SETS[t][2]}</td><td style="color:${n >= 9 ? '#ff3df0' : '#5a6080'}">9: ${SETS[t][3]}</td></tr>`;
  }).join('') || '<tr><td class="muted">아직 태그가 있는 강화가 없다</td></tr>';
  const curses = Object.keys(run.curses).map(c => `<span class="tag" style="background:#ff2d55;color:#fff">${CURSE[c].name}: ${CURSE[c].gain} / ${CURSE[c].cost}</span>`).join('');
  return `<div class="panel" style="width:min(900px,94vw)">${statsHTML()}<b>강화</b><div style="margin:6px 0">${ups}</div>${curses ? `<b>저주</b><div style="margin:6px 0">${curses}</div>` : ''}
    <b>세트 효과</b> <span class="muted small">${PRISM}</span><div style="overflow-x:auto"><table class="tb" style="margin-top:6px">${sets}</table></div>
    ${run.bag.length ? `<div style="margin-top:8px"><b>가방 속 부품</b> ${run.bag.map(m => `<span class="tag" style="background:#29f0ff">${MODS[m].name}</span>`).join('')} <span class="muted small">(정비소에서 장착/교체)</span></div>` : ''}</div>`;
}
function showLoadout(back) {
  scr(`${topbar()}<h2>장비 / 빌드</h2>
    <div class="row">${run.weapons.map(w => weaponCard(w)).join('')}</div>
    ${buildSummaryHTML()}
    <button class="btn" onclick="${cb(back)}">닫기</button>`, 'top');
}

// ================= 강화 선택 =================
function genUpgradeChoices(count, rare) {
  let pool = upgradePool().filter(u => (run.ups[u.id] || 0) < (u.max || 1));
  const out = [];
  const take = list => { if (!list.length) return null; const u = rweighted(list, x => x.rare ? 0.55 : 1); pool = pool.filter(p => p !== u); out.push(u); return u; };
  let guaranteed = null;
  if (rare) guaranteed = take(pool.filter(u => u.rare));
  // 현재 빌드와 같은 태그 보정: 1개 보장, 3개 이상 모았으면 50% 확률로 1개 더
  const top = SET_TAGS.filter(t => run.tags[t]).sort((a, b) => run.tags[b] - run.tags[a])[0];
  if (top && !out.some(u => u.tag === top)) take(pool.filter(u => u.tag === top));
  if (top && run.tags[top] >= 3 && out.length < count && RNG() < 0.5) take(pool.filter(u => u.tag === top));
  while (out.length < count && pool.length) take(pool);
  rshuffle(out);
  const choices = out.map(u => ({ kind: 'up', u }));
  const curses = CURSES.filter(c => !run.curses[c.id]);
  if (choices.length >= 3 && curses.length && RNG() < 0.2) {
    const idx = choices.findIndex(ch => ch.u !== guaranteed && (!top || ch.u.tag !== top));
    if (idx >= 0) choices[idx] = { kind: 'curse', c: rp(curses) };
  }
  return choices;
}
function openUpgradePick(opts, done) {
  const prevScreen = opts._prev || G.screen;
  if (G.screen === 'combat') G.screen = 'overlay';
  const choices = genUpgradeChoices(opts.count || 3, opts.rare);
  const finish = () => { if (prevScreen === 'combat') { G.screen = 'combat'; UI(''); } done && done(); };
  if (!choices.length) { finish(); return; }
  const cards = choices.map(ch => {
    if (ch.kind === 'curse') {
      const c = ch.c;
      return `<div class="card curse" onclick="${cb(() => { applyCurse(c.id); SFX.play('glitch'); finish(); })}">
        <span class="rib" style="color:#ff2d55">저주</span><h3 style="color:#ff4d6d">${c.name}</h3>
        <p style="color:#6dff8a">▲ ${c.gain}</p><p style="color:#ff4d6d">▼ ${c.cost}</p></div>`;
    }
    const u = ch.u, have = run.ups[u.id] || 0, n = (run.tags[u.tag] || 0) + 1;
    const setHint = SETS[u.tag] ? (n === 3 ? `<p style="color:${TAG_COLOR[u.tag]};margin-top:6px">★ 3세트 발동: ${SETS[u.tag][0]}</p>` : n === 5 ? `<p style="color:${TAG_COLOR[u.tag]};margin-top:6px">★★ 5세트 발동: ${SETS[u.tag][1]}</p>` : n === 7 ? `<p style="color:${TAG_COLOR[u.tag]};margin-top:6px">★★★ 7세트 발동: ${SETS[u.tag][2]}</p>` : n === 9 ? `<p style="color:#ff3df0;margin-top:6px">◆ 프리즘 각성: ${SETS[u.tag][3]}</p>` : `<p class="muted small" style="margin-top:6px">${TAG_NAME[u.tag]} 태그 ${n}개째</p>`) : '';
    return `<div class="card ${u.rare ? 'legend' : ''}" onclick="${cb(() => { addUpgrade(u.id); SFX.play('pick'); finish(); })}">
      ${u.rare ? '<span class="rib" style="color:#ffb52e">희귀</span>' : ''}
      <div>${tagHTML(u.tag)}</div><h3 style="margin-top:6px">${u.name}</h3><p>${u.desc}</p>
      ${u.max > 1 ? `<p class="muted small">보유 ${have}/${u.max}</p>` : ''}${setHint}</div>`;
  }).join('');
  scr(`${topbar()}<h2>${opts.title || '강화 선택'}</h2><div class="sub">${opts.sub || (opts.rare ? '희귀 강화 포함' : '하나를 골라 빌드를 완성하라')}</div>
    <div class="row">${cards}</div>
    <div class="row" style="margin-top:16px">
      <button class="btn sm mg" ${opts.rerolled || run.coins < rerollCost() ? 'disabled' : ''} onclick="${cb(() => { if (run.coins < rerollCost()) return; run.coins -= rerollCost(); SFX.play('coin'); openUpgradePick(Object.assign({}, opts, { rerolled: true, _prev: prevScreen }), done); })}">다시 뽑기 ◆${rerollCost()}${opts.rerolled ? ' (사용함)' : ''}</button>
      <button class="btn sm" onclick="${cb(finish)}">건너뛰기</button>
    </div>`, prevScreen === 'combat' ? 'clear' : '');
}

// ================= 무기 / 부품 획득 =================
function offerWeapon(w, done) {
  codex('weapon', w.id);
  if (run.weapons.length < 2) { run.weapons.push(w); toast(`무기 획득: <span style="color:${GRADES[w.grade].color}">${esc(weaponName(w))}</span>`); done(); return; }
  const replace = i => {
    const old = run.weapons[i];
    for (const m of old.mods) if (m) run.bag.push(m);
    run.weapons[i] = w; run.cur = i; done();
  };
  scr(`${topbar()}<h2>새 무기 획득</h2><div class="sub">무기는 최대 2개까지 소지할 수 있다. 교체된 무기의 부품은 가방으로 돌아간다.</div>
    <div class="row">${weaponCard(w, '<p style="color:#ffe14d;margin-top:6px">▲ 새 무기</p>')}</div>
    <div class="row" style="margin-top:10px">${run.weapons.map((o, i) => weaponCard(o, `<button class="btn sm ye" style="margin-top:8px;width:100%" onclick="${cb(() => replace(i))}">이 무기와 교체</button>`)).join('')}</div>
    <button class="btn rd" onclick="${cb(done)}">새 무기를 버린다</button>`, 'top');
}
function offerMod(id, done) {
  run.bag.push(id);
  const slots = [];
  run.weapons.forEach((w, wi) => w.mods.forEach((m, si) => { if (!m) slots.push([wi, si]); }));
  if (!slots.length) { toast(`부품 획득: ${MODS[id].name} (가방에 보관)`); done(); return; }
  const install = (wi, si) => { run.weapons[wi].mods[si] = id; run.bag.splice(run.bag.lastIndexOf(id), 1); fixAmmo(run.weapons[wi]); SFX.play('pick'); done(); };
  scr(`${topbar()}<h2>개조 부품: ${MODS[id].name}</h2><div class="sub">${MODS[id].desc}<br>빈 슬롯에 바로 장착하거나 가방에 보관한다. (교체는 정비소에서)</div>
    <div class="row">${slots.map(([wi, si]) => `<button class="btn ye" onclick="${cb(() => install(wi, si))}">${esc(weaponName(run.weapons[wi]))} · 슬롯 ${si + 1}</button>`).join('')}</div>
    <button class="btn" onclick="${cb(done)}">가방에 보관</button>`);
}
function fixAmmo(w) { const s = wStats(w); if (s.mag !== Infinity) w.ammo = Math.min(w.ammo, s.mag); if (w.ammo <= 0 || !isFinite(w.ammo)) w.ammo = s.mag; }

// ================= 부품 관리 (정비소) =================
function showModManager(done) {
  let sel = null; // 가방 인덱스
  const render = () => {
    const bag = run.bag.map((m, i) => `<button class="btn sm ${sel === i ? 'on' : ''}" onclick="${cb(() => { sel = sel === i ? null : i; render(); })}">${MODS[m].name}</button>`).join('') || '<span class="muted">가방이 비어 있다</span>';
    const ws = run.weapons.map((w, wi) => {
      const slots = w.mods.map((m, si) => `<button class="btn sm ${m ? 'ye' : ''}" style="min-width:150px" onclick="${cb(() => {
        if (sel !== null) { const nm = run.bag[sel]; run.bag.splice(sel, 1); if (m) run.bag.push(m); w.mods[si] = nm; sel = null; }
        else if (m) { run.bag.push(m); w.mods[si] = null; }
        fixAmmo(w); render();
      })}">${m ? MODS[m].name + ' ✕' : (sel !== null ? '여기에 장착' : '빈 슬롯')}</button>`).join('') || '<span class="muted small">개조 슬롯 없음 (정비소에서 등급을 올리면 생긴다)</span>';
      return `<div class="panel" style="width:min(640px,94vw)"><b style="color:${GRADES[w.grade].color}">${esc(weaponName(w))}</b> <span class="muted small">${tagHTML(wStats(w).tag)}</span><div style="margin-top:6px">${slots}</div></div>`;
    }).join('');
    scr(`${topbar()}<h2>부품 교체</h2><div class="sub">가방의 부품을 고른 뒤 슬롯을 누르면 장착. 장착된 부품을 누르면 가방으로.</div>
      ${ws}<div class="panel" style="width:min(640px,94vw)"><b>가방</b><div style="margin-top:6px">${bag}</div>
      <p class="small muted" style="margin-top:6px">${sel !== null ? MODS[run.bag[sel]].desc : ''}</p></div>
      <button class="btn ye" onclick="${cb(done)}">완료</button>`, 'top');
  };
  render();
}

function rerollCost() { return 10 + 5 * (run ? run.zone : 0); }
// 현재 빌드 수치 요약
function statsHTML() {
  const w = curW(), s = wStats(w);
  const pct = v => `${v >= 1 ? '+' : ''}${Math.round((v - 1) * 100)}%`;
  const rows = [
    ['피해', pct(BS.dmgMult * dynDmg())], ['연사', pct(BS.rateMult)], ['치명타', Math.round(s.crit * 100) + '%'],
    ['이동 속도', pct(BS.moveMult)], ['받는 피해', pct(BS.takenMult)], ['재장전', pct(BS.reloadMult)], ['관통', '+' + BS.pierce],
    ['최대 체력', run.maxHp], ['오버클럭', Math.round(run.od || 0) + '%']
  ];
  return `<div class="kv" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr));margin-bottom:10px">${rows.map(r => `<span><span class="muted small">${r[0]}</span> <b>${r[1]}</b></span>`).join('')}</div>`;
}
// 도움말
function showHelp(back) {
  scr(`<h2>도움말</h2>
    <div class="panel" style="width:min(820px,94vw);line-height:1.8;font-size:14px">
      <b style="color:#29f0ff">조작</b><br>
      WASD 이동 · 마우스 조준 · 좌클릭 사격 · 우클릭 스킬 · 스페이스 구르기(무적) · R 재장전 · Q/휠 무기 교체 · E 상호작용/해킹 · F 오버클럭 · ESC 일시정지<br>
      게임패드: 왼쪽 스틱 이동 · 오른쪽 스틱 조준 · RT 사격 · LT 스킬 · A 구르기 · X 재장전 · Y 교체 · B 상호작용 · LB 오버클럭<br>
      터치: 왼쪽 아래 스틱 이동 · 오른쪽 스틱 조준과 사격 · 화면 버튼으로 구르기, 스킬, 오버클럭, 교체, 상호작용<br><br>
      <b style="color:#29f0ff">진행</b><br>
      구역마다 갈림길 지도를 내려가 보스를 쓰러뜨린다. 전투에서 이기면 강화 3개 중 1개를 고른다. 같은 태그를 3·5·7개 모으면 세트 효과, 9개면 프리즘 각성.<br><br>
      <b style="color:#ff3df0">오버클럭 모드</b> — 처치와 반응으로 게이지를 채우고 F를 누르면 8초간 폭주한다.<br>
      <b style="color:#29f0ff">해킹</b> — 체력 30% 이하의 기계(점선 원 표시) 옆에서 E. 15초간 아군으로 싸우다 자폭한다. 대기 8초.<br>
      <b style="color:#ffb52e">무기 융합</b> — 정비소에서 두 무기를 합쳐 두 번째 속성을 새긴다.<br><br>
      <b style="color:#29f0ff">속성</b> — 원소마다 상태 이상이 다르다. 자세한 내용은 도감의 '속성' 탭.<br>
      ${SET_TAGS.map(t => `${tagHTML(t)} ${STATUS_INFO[t].name}: ${STATUS_INFO[t].core}`).join('<br>')}
    </div>
    <button class="btn" onclick="${cb(back)}">돌아가기</button>`, 'top');
}
