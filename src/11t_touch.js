// ================= 터치 조작 (휴대폰 / 태블릿) =================
// 왼쪽: 이동 스틱 · 오른쪽: 조준 스틱(당기면 사격) · 화면 버튼: 구르기, 스킬, 오버클럭, 교체, 상호작용, 재장전, 일시정지
// 조준 스틱을 놓고 있으면 가장 가까운 적을 자동 조준하고 자동 사격한다 (설정에서 끌 수 있음).
const TouchCtl = { move: null, aim: null, held: {} };
Input.tmx = 0; Input.tmy = 0; Input.touch = false; Input.touchFire = false; Input.touchAuto = false;

function touchButtons() {
  const R = clamp(Math.min(VW, VH) * 0.085, 30, 52);
  const rx = VW - R * 1.35 - 8, by = VH - R * 1.35 - 8;
  return [
    { id: 'skill', label: '스킬', x: rx, y: by, r: R * 1.1, mp: 2 },
    { id: 'roll', label: '구르기', x: rx - R * 2.6, y: by + R * 0.15, r: R, key: 'Space' },
    { id: 'use', label: 'E', x: rx - R * 4.7, y: by + R * 0.35, r: R * 0.72, key: 'KeyE' },
    // 발사 버튼: 누르고 있으면 자동 조준해서 계속 쏜다 (적이 없으면 히터·서버 기둥 같은 부술 수 있는 사물을 조준)
    { id: 'fire', label: '발사', x: rx - R * 1.1, y: by - R * 2.4, r: R * 1.25 },
    { id: 'od', label: 'OC', x: rx - R * 3.5, y: by - R * 2.5, r: R * 0.8, key: 'KeyF' },
    { id: 'swap', label: '교체', x: rx - R * 5.3, y: by - R * 1.6, r: R * 0.7, key: 'KeyQ' },
    { id: 'reload', label: 'R', x: rx - R * 6.4, y: by - R * 0.3, r: R * 0.6, key: 'KeyR' },
    { id: 'pause', label: 'Ⅱ', x: 330, y: 30, r: 22 }
  ];
}
function touchHit(x, y) { return touchButtons().find(b => d2(x, y, b.x, b.y) < (b.r + 6) ** 2); }
function touchActive() { return G.screen === 'combat' && !G.paused && room && P; }

function initTouch() {
  const opts = { passive: false };
  canvas.addEventListener('touchstart', e => {
    SFX.init();
    Input.touch = true; Input.usingPad = false;
    if (!touchActive()) return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      const x = t.clientX, y = t.clientY, b = touchHit(x, y);
      if (b) {
        TouchCtl.held[t.identifier] = b.id;
        if (b.id === 'pause') { pauseGame(); continue; }
        if (b.key) Input.pressed[b.key] = 1;
        if (b.mp) Input.mp[b.mp] = 1;
        continue;
      }
      if (x < VW * 0.45 && !TouchCtl.move) TouchCtl.move = { id: t.identifier, ox: x, oy: y, x, y };
      else if (!TouchCtl.aim) TouchCtl.aim = { id: t.identifier, ox: x, oy: y, x, y };
    }
  }, opts);
  canvas.addEventListener('touchmove', e => {
    if (!touchActive()) return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (TouchCtl.move && TouchCtl.move.id === t.identifier) { TouchCtl.move.x = t.clientX; TouchCtl.move.y = t.clientY; }
      if (TouchCtl.aim && TouchCtl.aim.id === t.identifier) { TouchCtl.aim.x = t.clientX; TouchCtl.aim.y = t.clientY; }
    }
  }, opts);
  const end = e => {
    for (const t of e.changedTouches) {
      if (TouchCtl.move && TouchCtl.move.id === t.identifier) TouchCtl.move = null;
      if (TouchCtl.aim && TouchCtl.aim.id === t.identifier) TouchCtl.aim = null;
      delete TouchCtl.held[t.identifier];
    }
  };
  canvas.addEventListener('touchend', end, opts);
  canvas.addEventListener('touchcancel', end, opts);
}

// 매 프레임: 스틱 값을 입력으로 변환 (updatePlayer 전에 호출)
function updateTouchInput() {
  Input.tmx = 0; Input.tmy = 0; Input.touchFire = false; Input.touchAuto = false;
  if (!Input.touch || !touchActive()) { TouchCtl.move = TouchCtl.move && touchActive() ? TouchCtl.move : null; return; }
  const R = 60;
  if (TouchCtl.move) {
    let dx = TouchCtl.move.x - TouchCtl.move.ox, dy = TouchCtl.move.y - TouchCtl.move.oy;
    const l = Math.hypot(dx, dy);
    if (l > R) { TouchCtl.move.ox = TouchCtl.move.x - dx / l * R; TouchCtl.move.oy = TouchCtl.move.y - dy / l * R; dx = dx / l * R; dy = dy / l * R; }
    if (l > 8) { Input.tmx = dx / R; Input.tmy = dy / R; }
  }
  const fireHeld = Object.values(TouchCtl.held).includes('fire');
  if (TouchCtl.aim) {
    const dx = TouchCtl.aim.x - TouchCtl.aim.ox, dy = TouchCtl.aim.y - TouchCtl.aim.oy;
    if (Math.hypot(dx, dy) > 14) { P.ang = Math.atan2(dy, dx); Input.touchFire = true; }
  } else {
    // 자동 조준: 조준 스틱을 쓰지 않으면 가장 가까운 목표 (적, 보스 보호막이 켜져 있으면 히터·서버 기둥)
    const t = touchTarget(fireHeld);
    if (t) {
      P.ang = angTo(P.x, P.y, t.x, t.y);
      // 사물은 발사 버튼을 누를 때만 쏜다 (드럼통을 멋대로 터뜨리지 않도록)
      if (t.isEnemy || fireHeld) Input.touchAuto = SAVE.settings.touchAutoFire !== false;
    } else if (Math.hypot(Input.tmx, Input.tmy) > 0.2) P.ang = Math.atan2(Input.tmy, Input.tmx);
  }
  if (fireHeld) Input.touchFire = true;
}

// 발사 버튼과 자동 조준이 노리는 목표
function nearestShootableProp(filter, range) {
  let best = null, bd = range * range;
  for (const p of room.props) {
    if (!p.shootable || p.dead || !filter(p)) continue;
    const dd = d2(P.x, P.y, p.x, p.y); if (dd > bd) continue;
    if (rayWalls(P.x, P.y, p.x - P.x, p.y - P.y, Math.sqrt(dd)) < Math.sqrt(dd) - p.r - 2) continue; // 벽에 가려짐
    bd = dd; best = p;
  }
  return best;
}
function touchTarget(fireHeld) {
  // 보스가 보호막 때문에 무적이면 먼저 부숴야 하는 사물(히터, 서버 기둥)을 노린다
  const shielded = room.enemies.some(e => e.boss && !e.dead && e.invuln);
  if (shielded) {
    const p = nearestShootableProp(q => (q.type === 'heater' && !q.on) || q.type === 'spillar', 1200);
    if (p) return p;
  }
  const e = assistTarget(P.ang, Math.PI, 700);
  if (e) { e.isEnemy = true; return e; }
  if (fireHeld) return nearestShootableProp(q => !(q.type === 'heater' && q.on), 900);
  return null;
}

function drawTouchControls() {
  if (!Input.touch || !touchActive()) return;
  ctx.save();
  const stick = (s, col) => {
    if (!s) return;
    circlePath(s.ox, s.oy, 60); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill(); ctx.strokeStyle = col; ctx.globalAlpha = 0.5; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
    const dx = s.x - s.ox, dy = s.y - s.oy, l = Math.hypot(dx, dy), k = l > 60 ? 60 / l : 1;
    circlePath(s.ox + dx * k, s.oy + dy * k, 26); ctx.fillStyle = col; ctx.globalAlpha = 0.45; ctx.fill(); ctx.globalAlpha = 1;
  };
  stick(TouchCtl.move, '#29f0ff');
  stick(TouchCtl.aim, '#ff3df0');
  if (!TouchCtl.move) { ctx.globalAlpha = 0.18; circlePath(110, VH - 120, 60); ctx.strokeStyle = '#29f0ff'; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1; hudText('이동', 110, VH - 115, 13, 'rgba(41,240,255,0.5)', 'center'); }
  const held = new Set(Object.values(TouchCtl.held));
  for (const b of touchButtons()) {
    let col = '#29f0ff', ready = true, label = b.label;
    if (b.id === 'skill') { ready = P.skillCd <= 0; col = CHARS[run.char].color; if (!ready) label = Math.ceil(P.skillCd) + ''; }
    if (b.id === 'od') { ready = (run.od || 0) >= 100 || P.odT > 0; col = '#ff3df0'; if (!ready) label = Math.floor(run.od || 0) + '%'; }
    if (b.id === 'roll') ready = P.rollCharges > 0;
    if (b.id === 'use') { ready = !!P.prompt; col = '#ffe14d'; }
    if (b.id === 'swap') ready = run.weapons.length > 1;
    if (b.id === 'fire') col = '#ff4d6d';
    circlePath(b.x, b.y, b.r);
    ctx.fillStyle = held.has(b.id) ? 'rgba(255,255,255,0.28)' : 'rgba(6,5,16,0.55)'; ctx.fill();
    ctx.strokeStyle = col; ctx.globalAlpha = ready ? 0.95 : 0.35; ctx.lineWidth = ready ? 3 : 2; ctx.stroke();
    if (b.id === 'skill' && !ready) { ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + TAU * (P.skillCd / P.skillMax)); ctx.closePath(); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill(); }
    hudText(label, b.x, b.y + 5, Math.max(11, b.r * 0.42), ready ? col : '#8a90b0', 'center');
    ctx.globalAlpha = 1;
  }
  if (VH > VW) hudText('가로 화면을 권장합니다', VW / 2, VH - 20, 12, '#8a90b0', 'center');
  ctx.restore();
}
