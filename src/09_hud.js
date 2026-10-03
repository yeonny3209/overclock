// ================= 화면 효과 =================
function drawScreenFx() {
  // 정전 구간
  if (room.darkOn && !P.dead) {
    const px = P.x - cam.x, py = P.y - cam.y;
    const g = ctx.createRadialGradient(px, py, 120, px, py, 300);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(2,0,8,0.97)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  } else if (room.dark && room.darkT < 1 && !room.darkOn && Math.sin(G.time * 40) > 0.3) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, VW, VH);
  }
  // 글리치
  if (G.glitchT > 0 || G.glitchVis > 0) {
    G.glitchVis = Math.max(0, (G.glitchVis || 0) - 0.016);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < 7; i++) {
      const y = rand(0, canvas.height), h = rand(4, 40) * DPR;
      try { ctx.drawImage(canvas, 0, y, canvas.width, h, rand(-40, 40) * DPR, y, canvas.width, h); } catch (e) { }
    }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = `rgba(${Math.random() < 0.5 ? '255,0,120' : '0,255,240'},0.08)`; ctx.fillRect(0, 0, VW, VH);
  }
  if (G.flash > 0) { ctx.fillStyle = `rgba(${G.flashColor},${Math.min(0.45, G.flash)})`; ctx.fillRect(0, 0, VW, VH); }
  // 저체력 비네트
  if (run.hp < run.maxHp * 0.3 && !P.dead) {
    const a = 0.25 + Math.sin(G.time * 5) * 0.12;
    const g = ctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.35, VW / 2, VH / 2, Math.max(VW, VH) * 0.7);
    g.addColorStop(0, 'rgba(255,0,40,0)'); g.addColorStop(1, `rgba(255,0,40,${a})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  }
  // S 콤보: 화면 테두리 발광
  if (run.combo >= 100) {
    const hue = (G.time * 200) % 360;
    ctx.strokeStyle = `hsla(${hue},100%,60%,0.8)`; ctx.lineWidth = 8; ctx.strokeRect(4, 4, VW - 8, VH - 8);
    ctx.strokeStyle = `hsla(${hue},100%,60%,0.25)`; ctx.lineWidth = 24; ctx.strokeRect(12, 12, VW - 24, VH - 24);
  }
  if (P.slowT > 0) { ctx.fillStyle = 'rgba(120,80,200,0.08)'; ctx.fillRect(0, 0, VW, VH); }
  if (G.slowmo > 0 && !G.bossIntro) { ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(0, 0, VW, VH); }
}

// ================= HUD =================
function hudText(t, x, y, size, color, align = 'left', font = FONT) {
  ctx.font = `${size}px ${font}`; ctx.textAlign = align;
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.strokeText(t, x, y);
  ctx.fillStyle = color; ctx.fillText(t, x, y);
}
function panel(x, y, w, h, border = 'rgba(41,240,255,0.35)') {
  ctx.fillStyle = 'rgba(6,5,16,0.72)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
function drawHUD() {
  const pad = 16;
  // 체력
  panel(pad, pad, 290, 74);
  const hpF = run.hp / run.maxHp;
  ctx.fillStyle = '#300b18'; ctx.fillRect(pad + 10, pad + 10, 270, 18);
  const g = ctx.createLinearGradient(pad + 10, 0, pad + 280, 0); g.addColorStop(0, '#ff2d55'); g.addColorStop(1, '#ff8a9a');
  ctx.fillStyle = g; ctx.fillRect(pad + 10, pad + 10, 270 * clamp(hpF, 0, 1), 18);
  hudText(`${Math.ceil(run.hp)} / ${run.maxHp}`, pad + 145, pad + 24, 14, '#fff', 'center');
  for (let i = 0; i < P.shield; i++) { ctx.fillStyle = '#6dff8a'; ctx.fillRect(pad + 10 + i * 14, pad + 31, 10, 4); }
  // 스킬
  const c = CHARS[run.char];
  const sx = pad + 10, sy = pad + 38, sz = 30;
  ctx.fillStyle = '#0d0a1c'; ctx.fillRect(sx, sy, sz, sz);
  ctx.strokeStyle = c.color; ctx.lineWidth = 2; ctx.strokeRect(sx, sy, sz, sz);
  if (P.skillCd > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.beginPath(); ctx.moveTo(sx + sz / 2, sy + sz / 2);
    ctx.arc(sx + sz / 2, sy + sz / 2, sz * 0.72, -Math.PI / 2, -Math.PI / 2 + TAU * (P.skillCd / P.skillMax)); ctx.closePath();
    ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sz, sz); ctx.clip(); ctx.fill(); ctx.restore();
    hudText(Math.ceil(P.skillCd), sx + sz / 2, sy + 21, 14, '#fff', 'center');
  } else hudText('RMB', sx + sz / 2, sy + 20, 11, c.color, 'center');
  hudText(c.skill, sx + sz + 8, sy + 13, 13, c.color);
  const act = P.overT > 0 ? `과충전 ${P.overT.toFixed(1)}s` : P.slowT > 0 ? `감속 ${P.slowT.toFixed(1)}s` : '';
  hudText(act || '구르기', sx + sz + 8, sy + 28, 11, act ? '#fff' : '#8a90b0');
  for (let i = 0; i < rollMax(); i++) {
    const on = i < P.rollCharges;
    ctx.fillStyle = on ? '#29f0ff' : '#2a3050'; ctx.fillRect(sx + sz + 60 + i * 16, sy + 20, 12, 8);
  }
  // 저주 / 상태 표시
  let cx = pad + 190;
  for (const id in run.curses) { hudText(CURSE[id].name, cx, sy + 28, 11, '#ff4d6d'); cx += 56; if (cx > pad + 280) break; }
  if (BS.berserk && run.berserk) hudText(`광전사 +${Math.min(90, run.berserk * 3)}%`, pad + 190, sy + 13, 11, '#ff4d6d');

  // 목표
  drawObjectiveHUD();

  // 우상단: 코인, 위치, 콤보
  const rx = VW - pad;
  panel(rx - 200, pad, 200, 74);
  hudText(`◆ ${run.coins}`, rx - 14, pad + 26, 22, '#ffe14d', 'right');
  const loc = G.mode === 'arena' ? `아레나 웨이브 ${room.obj.wave || 0}` : `${ZONES[run.zone].name} · ${Math.min(6, run.row + 1)}/7`;
  hudText(loc, rx - 188, pad + 26, 12, '#8a90b0');
  if (run.combo > 0) {
    const gr = comboGrade(run.combo);
    hudText(`${run.combo} 콤보`, rx - 188, pad + 56, 16, '#fff');
    if (gr) hudText(gr, rx - 16, pad + 62, 30, gr === 'S' ? `hsl(${(G.time * 200) % 360},100%,65%)` : '#ffe14d', 'right');
    ctx.fillStyle = '#2a3050'; ctx.fillRect(rx - 188, pad + 62, 130, 4);
    ctx.fillStyle = '#29f0ff'; ctx.fillRect(rx - 188, pad + 62, 130 * clamp(run.comboT / BS.comboTime, 0, 1), 4);
  } else hudText('콤보 없음', rx - 188, pad + 56, 12, '#5a6080');

  // 무기 슬롯 (우하단)
  for (let i = 0; i < 2; i++) {
    const w = run.weapons[i];
    const bw = 210, bh = 58, bx = VW - pad - bw, by = VH - pad - bh - (1 - i) * 0 - (i === 0 ? bh + 8 : 0);
    const cur = i === run.cur;
    panel(bx, by, bw, bh, cur ? '#29f0ff' : 'rgba(80,80,120,0.5)');
    if (!w) { hudText('빈 슬롯', bx + 12, by + 34, 13, '#5a6080'); continue; }
    const s = wStats(w);
    ctx.globalAlpha = cur ? 1 : 0.55;
    hudText(w.grade === 2 ? LEGEND[w.id].name : WEAPONS[w.id].name, bx + 12, by + 22, 16, GRADES[w.grade].color);
    ctx.fillStyle = TAG_COLOR[s.tag]; ctx.fillRect(bx + 12, by + 30, 30, 4);
    hudText(TAG_NAME[s.tag], bx + 46, by + 35, 10, TAG_COLOR[s.tag]);
    for (let m = 0; m < w.mods.length; m++) { ctx.fillStyle = w.mods[m] ? '#29f0ff' : '#2a3050'; ctx.fillRect(bx + 12 + m * 12, by + 42, 9, 9); }
    const ammo = s.mag === Infinity ? '∞' : w.reloadT > 0 ? '재장전' : `${w.ammo}/${s.mag}`;
    hudText(ammo, bx + bw - 12, by + 42, w.reloadT > 0 ? 15 : 22, w.ammo <= 0 && s.mag !== Infinity ? '#ff4d6d' : '#fff', 'right');
    if (cur && w.reloadT > 0) { ctx.fillStyle = '#29f0ff'; ctx.fillRect(bx, by + bh - 3, bw * (1 - w.reloadT / (w.reloadMax || 1)), 3); }
    hudText(i === run.cur ? '' : 'Q', bx + bw - 12, by + 18, 11, '#8a90b0', 'right');
    ctx.globalAlpha = 1;
  }
  // 태그 (좌하단)
  let tx = pad, ty = VH - pad - 6;
  for (const t of SET_TAGS) {
    const n = run.tags[t]; if (!n) continue;
    const lbl = `${TAG_NAME[t]} ${n}${n >= 7 ? ' ★★★' : n >= 5 ? ' ★★' : n >= 3 ? ' ★' : ''}`;
    ctx.font = `12px ${FONT}`; const w = ctx.measureText(lbl).width + 14;
    ctx.fillStyle = 'rgba(6,5,16,0.8)'; ctx.fillRect(tx, ty - 18, w, 22);
    ctx.fillStyle = TAG_COLOR[t]; ctx.fillRect(tx, ty - 18, 3, 22);
    hudText(lbl, tx + 8, ty - 2, 12, n >= 3 ? TAG_COLOR[t] : '#c5cae6');
    tx += w + 6;
  }
  if (run.prism) hudText(`◆ 프리즘 폭발 ${Math.ceil(Math.max(0, run.prismT || 0))}초`, pad, VH - pad - 52, 13, `hsl(${(G.time * 120) % 360},100%,70%)`);
  hudText('ESC 일시정지', pad, VH - pad - 32, 11, '#5a6080');

  drawBossBar();
  drawOffscreenArrows();

  // 배너
  if (G.objBanner && G.objBanner.t > 0 && room.obj && OBJECTIVES[room.obj.type]) {
    const k = Math.min(1, G.objBanner.t, (2.6 - G.objBanner.t) * 4);
    ctx.globalAlpha = k;
    const O = OBJECTIVES[room.obj.type];
    ctx.fillStyle = 'rgba(6,5,16,0.8)'; ctx.fillRect(0, VH * 0.3 - 40, VW, 80);
    hudText(room.kind === 'elite' ? `☠ 엘리트 전투 · ${O.name}` : `목표: ${O.name}`, VW / 2, VH * 0.3, 34, room.kind === 'elite' ? '#ff3d6a' : '#29f0ff', 'center');
    hudText(O.desc, VW / 2, VH * 0.3 + 28, 15, '#e8ecff', 'center', FONT2);
    ctx.globalAlpha = 1;
  }
  if (G.banner && G.banner.t > 0) {
    const k = Math.min(1, G.banner.t * 3);
    ctx.globalAlpha = k;
    hudText(G.banner.text, VW / 2, VH * 0.22, 40, G.banner.color || '#fff', 'center');
    if (G.banner.sub) hudText(G.banner.sub, VW / 2, VH * 0.22 + 28, 15, '#e8ecff', 'center', FONT2);
    ctx.globalAlpha = 1;
  }
  // 반응 텍스트
  let ry = VH * 0.38;
  for (const r of G.reactTexts) {
    const k = r.t / 1.2, sc = 1 + Math.max(0, (k - 0.8)) * 3;
    ctx.globalAlpha = Math.min(1, k * 2.5);
    ctx.save(); ctx.translate(VW / 2, ry); ctx.scale(sc, sc);
    hudText(r.text + '!', 0, 0, 44, r.color, 'center');
    ctx.restore();
    ry += 48;
  }
  ctx.globalAlpha = 1;
  if (G.glitchWarn > 0) hudText('⚠ GLITCH — 조작 반전 임박', VW / 2, VH * 0.62, 26, '#ff3df0', 'center');
  if (G.glitchT > 0) hudText(`조작 좌우 반전 ${G.glitchT.toFixed(1)}`, VW / 2, VH * 0.62, 22, '#ff3df0', 'center');
  // 보스 등장 카드
  if (G.bossIntro) {
    const b = G.bossIntro, k = b.t / b.max;
    const a = Math.min(1, (1 - k) * 5, k * 4);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, VH / 2 - 70, VW, 140);
    ctx.fillStyle = '#ff3df0'; ctx.fillRect(0, VH / 2 - 70, VW, 3); ctx.fillRect(0, VH / 2 + 67, VW, 3);
    const off = (1 - k) * 40;
    hudText(b.sub, VW / 2 - 20 + off, VH / 2 - 22, 18, '#ff3df0', 'center', FONT2);
    hudText(b.name, VW / 2 + 20 - off, VH / 2 + 32, 64, '#ffffff', 'center');
    ctx.globalAlpha = 1;
  }
  if (P.dead) hudText('요원 신호 소실...', VW / 2, VH / 2, 40, '#ff4d6d', 'center');
  drawCrosshair();
}

function drawObjectiveHUD() {
  const ob = room.obj; if (!ob) return;
  let t = '', col = '#29f0ff', bar = null;
  if (room.done) { t = room.success ? '목표 달성 — 출구로 이동 ▶' : '목표 실패 — 출구로 이동 ▶'; col = room.success ? '#6dff8a' : '#ff4d6d'; }
  else switch (ob.type) {
    case 'exterminate': t = `섬멸 — 웨이브 ${ob.wave}/${ob.waves} · 남은 적 ${aliveEnemies()}`; break;
    case 'survive': t = `생존 — ${Math.ceil(ob.time)}초`; bar = [1 - ob.time / 60, '#29f0ff']; break;
    case 'defend': t = `거점 사수 — ${Math.ceil(ob.time)}초`; bar = [room.objProp.hp / room.objProp.maxHp, '#6dff8a']; break;
    case 'escort': { const p = room.objProp; t = `호위 — 진행 ${Math.floor(clamp((p.x - 130) / (room.w - 260), 0, 1) * 100)}%${p.blocked ? ' · 적이 길을 막고 있다!' : ''}`; bar = [p.hp / p.maxHp, '#29f0ff']; break; }
    case 'collect': t = `수집 — 데이터칩 ${ob.got}/5`; break;
    case 'bounty': t = `현상금 — 표적 처치까지 ${Math.ceil(ob.time)}초`; col = '#ff3df0'; break;
    case 'boss': t = BOSS_INFO[room.bossId].desc; col = '#ff3df0'; break;
    case 'arena': t = ob.state === 'break' ? `다음 웨이브 ${Math.ceil(ob.bt)}초` : `무한 아레나 — 웨이브 ${ob.wave} · 남은 적 ${aliveEnemies() + (ob.left || 0)}`; break;
  }
  ctx.font = `15px ${FONT}`; const w = Math.max(260, ctx.measureText(t).width + 40);
  panel(VW / 2 - w / 2, 16, w, bar ? 44 : 34, col);
  hudText(t, VW / 2, 39, 15, col, 'center');
  if (bar) { ctx.fillStyle = '#1a1830'; ctx.fillRect(VW / 2 - w / 2 + 10, 50, w - 20, 5); ctx.fillStyle = bar[1]; ctx.fillRect(VW / 2 - w / 2 + 10, 50, (w - 20) * clamp(bar[0], 0, 1), 5); }
}

function drawBossBar() {
  const bosses = room.enemies.filter(e => e.boss && !e.dead);
  if (!bosses.length || G.bossIntro) return;
  const n = bosses.length, bw = Math.min(560, VW - 80) / n - (n > 1 ? 10 : 0);
  bosses.forEach((b, i) => {
    const x = VW / 2 - (bw * n + (n - 1) * 10) / 2 + i * (bw + 10), y = 72;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(x - 2, y - 2, bw + 4, 16);
    ctx.fillStyle = b.invuln ? '#555a70' : b.color; ctx.fillRect(x, y, bw * clamp(b.hp / b.maxHp, 0, 1), 12);
    if (b.bossId === 'mother') for (let k = 1; k < 3; k++) { ctx.fillStyle = '#000'; ctx.fillRect(x + bw * k / 3 - 1, y, 2, 12); }
    hudText(b.name + (b.invuln ? ' (무적)' : b.dmgTakenMult > 1 ? ' (약점!)' : ''), x + bw / 2, y + 30, 13, '#fff', 'center');
  });
}

function drawOffscreenArrows() {
  const tg = [];
  const ob = room.obj;
  if (ob && ob.type === 'bounty' && ob.target && !ob.target.dead) tg.push([ob.target, '#ff3df0']);
  for (const p of room.props) {
    if (p.type === 'chip' && !p.dead) tg.push([p, '#29f0ff']);
    if (p.type === 'exit') tg.push([p, '#6dff8a']);
    if ((p.type === 'drone' || p.type === 'objgen') && !p.dead) tg.push([p, '#6dff8a']);
    if (p.type === 'heater' && !p.on) tg.push([p, '#ff8a2a']);
    if (p.type === 'spillar' && !p.dead) tg.push([p, '#c86bff']);
    if (p.type === 'chest') tg.push([p, '#ffb52e']);
  }
  for (const [o, c] of tg) {
    const sx = o.x - cam.x, sy = o.y - cam.y;
    if (sx > 20 && sx < VW - 20 && sy > 20 && sy < VH - 20) continue;
    const a = Math.atan2(sy - VH / 2, sx - VW / 2);
    const m = 40, ex = clamp(sx, m, VW - m), ey = clamp(sy, m + 50, VH - m);
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-4, 0); ctx.lineTo(-8, 9); ctx.closePath();
    ctx.fillStyle = c; ctx.fill();
    ctx.restore();
  }
}

function drawCrosshair() {
  if (Input.usingPad) return;
  const x = Input.mx, y = Input.my, w = curW();
  const s = wStats(w);
  const spread = 8 + s.spread * 60;
  ctx.strokeStyle = '#29f0ff'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - spread - 6, y); ctx.lineTo(x - spread, y); ctx.moveTo(x + spread, y); ctx.lineTo(x + spread + 6, y);
  ctx.moveTo(x, y - spread - 6); ctx.lineTo(x, y - spread); ctx.moveTo(x, y + spread); ctx.lineTo(x, y + spread + 6);
  ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 1, 2, 2);
  if (w.reloadT > 0) { ctx.beginPath(); ctx.arc(x, y, spread + 12, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - w.reloadT / (w.reloadMax || 1))); ctx.strokeStyle = '#ffe14d'; ctx.stroke(); }
  if (s.mag !== Infinity && w.ammo <= Math.ceil(s.mag * 0.2) && w.reloadT <= 0) hudText(w.ammo <= 0 ? 'R 재장전' : '탄약 부족', x, y + spread + 24, 11, '#ff4d6d', 'center');
}

// ================= 메뉴 배경 =================
let menuT = 0;
const menuStars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 2 + 0.5, v: Math.random() * 0.02 + 0.005 }));
function renderMenuBG(dt) {
  menuT += dt;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#07040f'); g.addColorStop(0.55, '#150828'); g.addColorStop(1, '#05030a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  const hz = VH * 0.58;
  // 해
  const sg = ctx.createLinearGradient(0, hz - 220, 0, hz);
  sg.addColorStop(0, '#ff3df0'); sg.addColorStop(1, '#ff8a2a');
  ctx.save(); ctx.beginPath(); ctx.arc(VW / 2, hz, 170, Math.PI, TAU); ctx.clip();
  ctx.fillStyle = sg; ctx.fillRect(VW / 2 - 170, hz - 170, 340, 170);
  ctx.fillStyle = '#150828';
  for (let i = 0; i < 7; i++) { const yy = hz - 12 - i * 18; ctx.fillRect(VW / 2 - 170, yy, 340, 3 + i * 0.6); }
  ctx.restore();
  // 도시 실루엣
  ctx.fillStyle = '#0a0514';
  let bx = 0; let seed = 7;
  while (bx < VW) { seed = (seed * 9301 + 49297) % 233280; const bw = 30 + (seed % 70), bh = 40 + (seed % 140); ctx.fillRect(bx, hz - bh, bw, bh); bx += bw + 4; }
  // 격자 바닥
  ctx.strokeStyle = 'rgba(255,61,240,0.55)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -20; i <= 20; i++) { ctx.moveTo(VW / 2 + i * 40, hz); ctx.lineTo(VW / 2 + i * 260, VH); }
  const off = (menuT * 0.6) % 1;
  for (let i = 0; i < 14; i++) { const k = Math.pow((i + off) / 14, 2.2); const y = hz + k * (VH - hz); ctx.moveTo(0, y); ctx.lineTo(VW, y); }
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  for (const s of menuStars) { s.y -= s.v * dt * 0.5; if (s.y < 0) s.y = 0.55; ctx.globalAlpha = 0.5 + Math.sin(menuT * 3 + s.x * 10) * 0.3; ctx.fillRect(s.x * VW, s.y * hz, s.s, s.s); }
  ctx.globalAlpha = 1;
}
