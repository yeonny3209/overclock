// ================= 파티클 / 연출 =================
const PARTS = [], PPOOL = [];
function PFX() { return [0.3, 0.6, 1][SAVE.settings.particles]; }
function maxParts() { return [250, 650, 1400][SAVE.settings.particles]; }
function part(o) {
  if (PARTS.length >= maxParts()) return;
  const p = PPOOL.pop() || {};
  p.x = o.x; p.y = o.y; p.vx = o.vx || 0; p.vy = o.vy || 0; p.life = p.max = o.life || 0.5; p.size = o.size || 3;
  p.color = o.color || '#fff'; p.kind = o.kind || 'dot'; p.rot = o.rot || 0; p.vr = (p.kind === 'shell' || p.kind === 'debris') ? rand(-12, 12) : 0;
  PARTS.push(p);
}
function burst(x, y, color, n, spd, life, size) {
  n = Math.ceil(n * PFX());
  for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(0.25, 1) * spd; part({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * rand(0.6, 1.2), size: size * rand(0.6, 1.3), color, kind: 'dot' }); }
}
function smoke(x, y, n, r) {
  n = Math.ceil(n * PFX());
  for (let i = 0; i < n; i++) part({ x: x + rand(-r / 3, r / 3), y: y + rand(-r / 3, r / 3), vx: rand(-30, 30), vy: rand(-50, -10), life: rand(0.6, 1.2), size: rand(r * 0.2, r * 0.4), color: 'rgba(70,60,60,0.45)', kind: 'smoke' });
}
function fxExplosion(x, y, r) {
  part({ x, y, life: 0.35, size: r, color: '#ffb347', kind: 'ring' });
  part({ x, y, life: 0.12, size: r * 0.8, color: '#fff2c0', kind: 'flash' });
  burst(x, y, '#ff8a2a', 20, r * 3, 0.5, 4); burst(x, y, '#ffe14d', 10, r * 2.2, 0.35, 3); smoke(x, y, 6, r);
  shake(r / 10); SFX.play('explode');
}
function updateParticles(dt) {
  for (let i = PARTS.length - 1; i >= 0; i--) {
    const p = PARTS[i];
    p.life -= dt;
    if (p.life <= 0) { PARTS[i] = PARTS[PARTS.length - 1]; PARTS.pop(); PPOOL.push(p); continue; }
    switch (p.kind) {
      case 'dot': p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(0.08, dt); p.vy *= Math.pow(0.08, dt); break;
      case 'shell': case 'debris': p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(0.005, dt); p.vy *= Math.pow(0.005, dt); p.rot += p.vr * dt * (Math.abs(p.vx) + Math.abs(p.vy)) / 100; break;
      case 'smoke': p.x += p.vx * dt; p.y += p.vy * dt; p.size += 12 * dt; break;
    }
  }
}
function addBolt(x1, y1, x2, y2, color, life = 0.12) {
  const d = dist(x1, y1, x2, y2), n = Math.max(2, Math.floor(d / 18)), a = angTo(x1, y1, x2, y2);
  const nx = -Math.sin(a), ny = Math.cos(a), pts = [x1, y1];
  for (let i = 1; i < n; i++) { const k = i / n, o = rand(-12, 12); pts.push(lerp(x1, x2, k) + nx * o, lerp(y1, y2, k) + ny * o); }
  pts.push(x2, y2);
  G.bolts.push({ pts, t: life, max: life, color });
  if (G.bolts.length > 60) G.bolts.shift();
}
function floatText(x, y, text, color, size = 14) {
  G.texts.push({ x, y, text: String(text), color, size, t: 0.9, max: 0.9, vy: -60 });
  if (G.texts.length > 90) G.texts.shift();
}
function addDecal(x, y, r, kind) { if (!room) return; room.decals.push({ x, y, r, kind, a: rand(0, TAU) }); if (room.decals.length > 50) room.decals.shift(); }
function shake(a) { if (SAVE.settings.shake) G.shakeAmt = Math.min(26, Math.max(G.shakeAmt, a)); }
function hitstop(t) { G.hitstop = Math.min(0.09, Math.max(G.hitstop, t)); }
function onScreen(x, y, m = 50) { return x > cam.x - m && x < cam.x + VW + m && y > cam.y - m && y < cam.y + VH + m; }
function resetFx() {
  while (PARTS.length) PPOOL.push(PARTS.pop());
  clearBullets();
  G.texts = []; G.bolts = []; G.reactTexts = []; G.banner = null; G.glitchT = 0; G.glitchWarn = 0; G.glitchVis = 0;
  G.bossIntro = null; G.slowmo = 0; G.hitstop = 0; G.shakeAmt = 0; G.flash = 0;
}
let toastTimer = 0;
function toast(html) {
  const t = $('toast'); t.innerHTML = html; t.style.opacity = 1;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.style.opacity = 0, 2600);
}

// ================= 월드 그리기 =================
function render() {
  const Z = ZONES[room.zone];
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#030208'; ctx.fillRect(0, 0, VW, VH);
  let sx = 0, sy = 0;
  if (G.shakeAmt > 0.3) { sx = rand(-1, 1) * G.shakeAmt; sy = rand(-1, 1) * G.shakeAmt; }
  ctx.save();
  ctx.translate(Math.round(-cam.x + sx), Math.round(-cam.y + sy));
  drawFloor(Z);
  drawHazards();
  for (const d of room.decals) { ctx.fillStyle = 'rgba(0,0,0,0.28)'; circlePath(d.x, d.y, d.r); ctx.fill(); }
  drawParticles(true);
  drawWalls(Z);
  drawPickups();
  drawProps();
  for (const v of room.vortices) drawVortex(v);
  for (const a of room.allies) drawAlly(a);
  for (const e of room.enemies) if (!e.boss) drawEnemy(e);
  for (const e of room.enemies) if (e.boss) drawEnemy(e);
  drawPlayer();
  drawBullets();
  ctx.globalCompositeOperation = 'lighter';
  for (const b of G.bolts) {
    ctx.beginPath(); ctx.moveTo(b.pts[0], b.pts[1]);
    for (let i = 2; i < b.pts.length; i += 2) ctx.lineTo(b.pts[i], b.pts[i + 1]);
    const k = b.t / b.max;
    ctx.strokeStyle = b.color; ctx.globalAlpha = 0.35 * k; ctx.lineWidth = 7; ctx.stroke();
    ctx.globalAlpha = k; ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  drawParticles(false);
  for (const t of G.texts) {
    const k = t.t / t.max;
    ctx.globalAlpha = Math.min(1, k * 2);
    ctx.font = `${t.size}px ${FONT}`; ctx.textAlign = 'center';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText(t.text, t.x, t.y);
    ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  drawScreenFx();
  drawHUD();
}

function drawFloor(Z) {
  const x0 = Math.max(0, cam.x - 10), y0 = Math.max(0, cam.y - 10), x1 = Math.min(room.w, cam.x + VW + 10), y1 = Math.min(room.h, cam.y + VH + 10);
  ctx.fillStyle = Z.bg; ctx.fillRect(0, 0, room.w, room.h);
  ctx.strokeStyle = Z.grid; ctx.lineWidth = 1; ctx.beginPath();
  const gs = 64;
  for (let x = Math.floor(x0 / gs) * gs; x <= x1; x += gs) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
  for (let y = Math.floor(y0 / gs) * gs; y <= y1; y += gs) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
  ctx.stroke();
  ctx.fillStyle = Z.grid;
  for (let x = Math.floor(x0 / gs) * gs; x <= x1; x += gs) for (let y = Math.floor(y0 / gs) * gs; y <= y1; y += gs) ctx.fillRect(x - 2, y - 2, 4, 4);
  // 경계
  ctx.strokeStyle = Z.edge; ctx.globalAlpha = 0.25; ctx.lineWidth = 14; ctx.strokeRect(-7, -7, room.w + 14, room.h + 14);
  ctx.globalAlpha = 1; ctx.lineWidth = 3; ctx.strokeRect(-2, -2, room.w + 4, room.h + 4);
}

function drawWalls(Z) {
  for (const w of room.walls) {
    if (!onScreen(w.x + w.w / 2, w.y + w.h / 2, Math.max(w.w, w.h))) continue;
    ctx.beginPath(); ctx.rect(w.x, w.y, w.w, w.h);
    if (w.kind === 'debris') {
      neonShape(w.flash > 0 ? '#fff' : '#c08050', 2, 'rgba(60,38,22,0.95)');
      ctx.strokeStyle = 'rgba(255,160,90,0.35)'; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(w.x + w.w * 0.2, w.y); ctx.lineTo(w.x + w.w * 0.5, w.y + w.h * 0.6); ctx.lineTo(w.x + w.w * 0.8, w.y + w.h); ctx.stroke();
      if (w.hp < w.maxHp) { ctx.fillStyle = '#ff9a4a'; ctx.fillRect(w.x, w.y - 6, w.w * w.hp / w.maxHp, 3); }
    } else {
      neonShape(Z.edge, 2, Z.wall);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let k = 12; k < w.w + w.h; k += 16) { ctx.moveTo(w.x + Math.min(k, w.w), w.y + Math.max(0, k - w.w)); ctx.lineTo(w.x + Math.max(0, k - w.h), w.y + Math.min(k, w.h)); }
      ctx.stroke();
    }
  }
}

function drawHazards() {
  for (const h of room.hazards) {
    const cx = h.shape === 'r' ? h.x + h.w / 2 : h.x, cy = h.shape === 'r' ? h.y + h.h / 2 : h.y;
    if (!onScreen(cx, cy, (h.r || Math.max(h.w, h.h)) + 20)) continue;
    const fade = h.life !== Infinity ? Math.min(1, h.life) : 1;
    ctx.globalAlpha = fade;
    switch (h.type) {
      case 'oil':
        circlePath(h.x, h.y, h.r); ctx.fillStyle = 'rgba(18,12,6,0.88)'; ctx.fill();
        ctx.strokeStyle = 'rgba(160,110,50,0.45)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(180,140,255,0.08)'; circlePath(h.x - h.r * 0.3, h.y - h.r * 0.3, h.r * 0.35); ctx.fill();
        break;
      case 'water': {
        circlePath(h.x, h.y, h.r);
        const el = h.elecT > 0;
        ctx.fillStyle = el ? `rgba(255,240,80,${0.25 + Math.random() * 0.2})` : 'rgba(40,120,220,0.3)'; ctx.fill();
        ctx.strokeStyle = el ? '#fff04d' : 'rgba(120,200,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();
        const rp = (G.time * 0.6 + h.x) % 1;
        circlePath(h.x, h.y, h.r * rp); ctx.strokeStyle = `rgba(160,220,255,${0.3 * (1 - rp)})`; ctx.lineWidth = 1; ctx.stroke();
        if (el && Math.random() < 0.5) addBolt(h.x + rand(-h.r, h.r) * 0.7, h.y + rand(-h.r, h.r) * 0.7, h.x + rand(-h.r, h.r) * 0.7, h.y + rand(-h.r, h.r) * 0.7, '#fff04d', 0.06);
        break;
      }
      case 'slick':
        circlePath(h.x, h.y, h.r); ctx.fillStyle = 'rgba(190,235,255,0.12)'; ctx.fill();
        ctx.strokeStyle = 'rgba(210,245,255,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(h.x - h.r * 0.5 + i * 12, h.y - h.r * 0.3 + i * 8); ctx.lineTo(h.x + h.r * 0.2 + i * 12, h.y + h.r * 0.1 + i * 8); } ctx.stroke();
        break;
      case 'frost':
        circlePath(h.x, h.y, h.r); ctx.fillStyle = h.boss ? 'rgba(170,225,255,0.35)' : 'rgba(170,225,255,0.22)'; ctx.fill();
        ctx.strokeStyle = h.boss ? 'rgba(220,245,255,0.8)' : 'rgba(200,240,255,0.45)'; ctx.lineWidth = 2; ctx.stroke();
        if (h.boss) { polyPath(h.x, h.y, h.r * 0.5, 6, h.t * 0.3); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke(); }
        break;
      case 'frostfloor':
        circlePath(h.x, h.y, h.r); ctx.fillStyle = 'rgba(120,220,255,0.18)'; ctx.fill();
        break;
      case 'fire':
        circlePath(h.x, h.y, h.r); ctx.fillStyle = `rgba(255,${80 + Math.sin(G.time * 20 + h.x) * 30},20,0.3)`; ctx.fill();
        ctx.strokeStyle = 'rgba(255,160,60,0.6)'; ctx.lineWidth = 2; ctx.stroke();
        break;
      case 'toxic':
        circlePath(h.x, h.y, h.r); ctx.fillStyle = 'rgba(120,255,60,0.2)'; ctx.fill();
        ctx.strokeStyle = 'rgba(150,255,90,0.4)'; ctx.lineWidth = 1; ctx.stroke();
        break;
      case 'steam':
        circlePath(h.x, h.y, 18); ctx.fillStyle = '#1a2a3a'; ctx.fill(); ctx.strokeStyle = '#8fd0ff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); for (let i = -1; i <= 1; i++) { ctx.moveTo(h.x - 12, h.y + i * 6); ctx.lineTo(h.x + 12, h.y + i * 6); } ctx.stroke();
        if (h.state === 'warn') { circlePath(h.x, h.y, h.r); ctx.setLineDash([6, 6]); ctx.strokeStyle = `rgba(180,230,255,${0.4 + Math.sin(G.time * 30) * 0.3})`; ctx.stroke(); ctx.setLineDash([]); }
        if (h.state === 'on') { circlePath(h.x, h.y, h.r); ctx.fillStyle = 'rgba(220,240,255,0.2)'; ctx.fill(); }
        break;
      case 'elecfloor': {
        ctx.beginPath(); ctx.rect(h.x, h.y, h.w, h.h);
        const on = h.state === 'on', warn = h.state === 'warn';
        ctx.fillStyle = on ? `rgba(255,230,60,${0.3 + Math.random() * 0.15})` : 'rgba(40,36,10,0.6)'; ctx.fill();
        ctx.strokeStyle = on ? '#fff04d' : warn && Math.sin(G.time * 30) > 0 ? '#fff04d' : 'rgba(255,224,58,0.35)';
        ctx.lineWidth = 2; ctx.setLineDash([12, 8]); ctx.stroke(); ctx.setLineDash([]);
        if (on && Math.random() < 0.6) addBolt(h.x + rand(0, h.w), h.y + rand(0, h.h), h.x + rand(0, h.w), h.y + rand(0, h.h), '#fff04d', 0.07);
        if (room.powerOff) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(h.x, h.y, h.w, h.h); }
        break;
      }
      case 'conveyor': {
        ctx.fillStyle = 'rgba(20,20,20,0.7)'; ctx.fillRect(h.x, h.y, h.w, h.h);
        ctx.strokeStyle = 'rgba(255,224,58,0.35)'; ctx.lineWidth = 2; ctx.strokeRect(h.x, h.y, h.w, h.h);
        ctx.save(); ctx.beginPath(); ctx.rect(h.x, h.y, h.w, h.h); ctx.clip();
        const off = (G.time * 140) % 40, a = Math.atan2(h.dy, h.dx);
        ctx.strokeStyle = 'rgba(255,224,58,0.5)'; ctx.lineWidth = 3;
        const L = Math.max(h.w, h.h);
        for (let k = -40; k < L + 40; k += 40) {
          const px = h.dx ? (h.dx > 0 ? h.x + k + off : h.x + h.w - k - off) : h.x + h.w / 2;
          const py = h.dy ? (h.dy > 0 ? h.y + k + off : h.y + h.h - k - off) : h.y + h.h / 2;
          ctx.beginPath(); ctx.moveTo(px - Math.cos(a - 0.7) * 14, py - Math.sin(a - 0.7) * 14); ctx.lineTo(px, py); ctx.lineTo(px - Math.cos(a + 0.7) * 14, py - Math.sin(a + 0.7) * 14); ctx.stroke();
        }
        ctx.restore();
        break;
      }
      case 'laser': {
        const on = h.state === 'on', warn = h.state === 'warn';
        const horiz = h.w > h.h;
        const x1 = h.x, y1 = h.y + h.h / 2, x2 = horiz ? h.x + h.w : h.x, y2 = horiz ? h.y + h.h / 2 : h.y + h.h;
        const lx1 = horiz ? x1 : h.x + h.w / 2, ly1 = horiz ? y1 : h.y, lx2 = horiz ? x2 : h.x + h.w / 2, ly2 = horiz ? y2 : h.y + h.h;
        ctx.fillStyle = '#3a1a4a'; ctx.fillRect(lx1 - 7, ly1 - 7, 14, 14); ctx.fillRect(lx2 - 7, ly2 - 7, 14, 14);
        if (on) { neonLine(lx1, ly1, lx2, ly2, '#ff3df0', 6); neonLine(lx1, ly1, lx2, ly2, '#ffffff', 2); }
        else if (warn) { ctx.beginPath(); ctx.moveTo(lx1, ly1); ctx.lineTo(lx2, ly2); ctx.strokeStyle = Math.sin(G.time * 40) > 0 ? 'rgba(255,61,240,0.8)' : 'rgba(255,61,240,0.2)'; ctx.lineWidth = 1.5; ctx.stroke(); }
        else { ctx.beginPath(); ctx.moveTo(lx1, ly1); ctx.lineTo(lx2, ly2); ctx.strokeStyle = 'rgba(255,61,240,0.12)'; ctx.lineWidth = 1; ctx.stroke(); }
        break;
      }
    }
    ctx.globalAlpha = 1;
  }
}

const DARK_CACHE = {};
function darken(hex, k = 0.3) {
  const key = hex + k;
  if (!DARK_CACHE[key]) {
    const n = parseInt(hex.slice(1, 7), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    DARK_CACHE[key] = `rgb(${Math.round(r * k + 10 * (1 - k))},${Math.round(g * k + 8 * (1 - k))},${Math.round(b * k + 22 * (1 - k))})`;
  }
  return DARK_CACHE[key];
}
function hpBar(x, y, w, frac, color, h = 4) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = color; ctx.fillRect(x - w / 2, y, w * clamp(frac, 0, 1), h);
}
function drawProps() {
  for (const p of room.props) {
    if (!onScreen(p.x, p.y, 80)) continue;
    const fl = p.flash > 0;
    switch (p.type) {
      case 'barrel':
        ctx.beginPath(); ctx.rect(p.x - 12, p.y - 15, 24, 30); neonShape(fl ? '#fff' : '#ff7a2a', 2, '#4a1a08');
        ctx.fillStyle = '#ffcc33'; ctx.fillRect(p.x - 12, p.y - 6, 24, 3); ctx.fillRect(p.x - 12, p.y + 4, 24, 3);
        break;
      case 'heater':
        ctx.beginPath(); ctx.rect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        neonShape(fl ? '#fff' : p.on ? '#ff8a2a' : '#6a8aa0', 2.4, p.on ? '#4a1a08' : '#141c24');
        if (p.on) { const k = (G.time * 1.5) % 1; circlePath(p.x, p.y, p.r + k * 60); ctx.strokeStyle = `rgba(255,140,40,${0.5 * (1 - k)})`; ctx.lineWidth = 2; ctx.stroke(); }
        else { hpBar(p.x, p.y - p.r - 10, 40, p.hp / p.maxHp, '#ff8a2a'); ctx.fillStyle = '#9ab'; ctx.font = `11px ${FONT2}`; ctx.textAlign = 'center'; ctx.fillText('히터', p.x, p.y + 4); }
        break;
      case 'spillar':
        polyPath(p.x, p.y, p.r, 6, Math.PI / 6); neonShape(fl ? '#fff' : '#e28bff', 2.6, '#1e0f30');
        circlePath(p.x, p.y, 8); ctx.fillStyle = Math.sin(G.time * 8 + p.x) > 0 ? '#ff3df0' : '#c86bff'; ctx.fill();
        hpBar(p.x, p.y - p.r - 12, 50, p.hp / p.maxHp, '#e28bff');
        break;
      case 'pgen':
        ctx.beginPath(); ctx.rect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); neonShape(fl ? '#fff' : '#ffe03a', 2.4, '#2a2608');
        for (let i = 0; i < 3; i++) { const a = G.time * 6 + i * TAU / 3; neonLine(p.x, p.y, p.x + Math.cos(a) * 12, p.y + Math.sin(a) * 12, '#ffe03a', 2); }
        hpBar(p.x, p.y - p.r - 10, 44, p.hp / 60, '#ffe03a');
        ctx.fillStyle = '#ffe03a'; ctx.font = `11px ${FONT2}`; ctx.textAlign = 'center'; ctx.fillText('발전기', p.x, p.y + p.r + 16);
        break;
      case 'hturret': {
        const c = p.hacked ? '#29f0ff' : '#ff4040';
        polyPath(p.x, p.y, p.r, 6, 0); neonShape(c, 2.2);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang); ctx.fillStyle = c; ctx.fillRect(4, -3, 20, 6); ctx.restore();
        break;
      }
      case 'objgen': {
        const dead = p.dead;
        polyPath(p.x, p.y, p.r, 8, G.time * 0.5); neonShape(dead ? '#555' : fl ? '#fff' : '#6dff8a', 3, dead ? '#111' : '#0c2412');
        if (!dead) { circlePath(p.x, p.y, 10 + Math.sin(G.time * 6) * 3); ctx.fillStyle = '#6dff8a'; ctx.fill(); }
        hpBar(p.x, p.y - p.r - 14, 70, p.hp / p.maxHp, '#6dff8a', 6);
        break;
      }
      case 'drone': {
        const dead = p.dead;
        circlePath(p.x, p.y, p.r); neonShape(dead ? '#555' : fl ? '#fff' : '#29f0ff', 2.6, '#081a24');
        for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; circlePath(p.x + Math.cos(a) * 24, p.y + Math.sin(a) * 24, 7); ctx.strokeStyle = '#29f0ff'; ctx.lineWidth = 1.5; ctx.stroke(); }
        hpBar(p.x, p.y - p.r - 16, 60, p.hp / p.maxHp, '#29f0ff', 5);
        if (p.blocked && !dead && !room.done) { ctx.fillStyle = '#ff4d6d'; ctx.font = `bold 13px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('적 차단 중!', p.x, p.y + p.r + 22); }
        break;
      }
      case 'goal':
        circlePath(p.x, p.y, p.r); ctx.setLineDash([8, 8]); ctx.lineDashOffset = G.time * 20; ctx.strokeStyle = '#6dff8a'; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#6dff8a'; ctx.font = `bold 14px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('목적지', p.x, p.y + 5);
        break;
      case 'chip': {
        const s = 1 + Math.sin(p.t * 5) * 0.12;
        polyPath(p.x, p.y, p.r * s, 4, p.t * 2); neonShape('#29f0ff', 2.4, 'rgba(10,40,50,0.9)');
        circlePath(p.x, p.y, 26 + Math.sin(p.t * 3) * 4); ctx.strokeStyle = 'rgba(41,240,255,0.25)'; ctx.lineWidth = 2; ctx.stroke();
        break;
      }
      case 'chest':
        ctx.beginPath(); ctx.rect(p.x - 18, p.y - 13, 36, 26); neonShape('#ffb52e', 2.4, '#2a1a06');
        ctx.fillStyle = '#ffb52e'; ctx.fillRect(p.x - 3, p.y - 5, 6, 8);
        break;
      case 'exit': {
        const k = p.t || 0;
        for (let i = 0; i < 3; i++) { circlePath(p.x, p.y, p.r - i * 9 + Math.sin(k * 4 + i) * 3); ctx.strokeStyle = `rgba(41,240,255,${0.8 - i * 0.2})`; ctx.lineWidth = 3 - i * 0.6; ctx.stroke(); }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 6, k * 3, k * 3 + 1.5); ctx.strokeStyle = '#ff3df0'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = `bold 14px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('출구', p.x, p.y + 5);
        break;
      }
    }
  }
}
function drawPickups() {
  for (const p of room.pickups) {
    if (!onScreen(p.x, p.y, 30)) continue;
    if (p.type === 'coin') {
      if (p.t < 1.5 && Math.floor(p.t * 10) % 2 === 0) continue;
      polyPath(p.x, p.y, 5 + Math.min(4, p.val), 4, G.time * 3);
      ctx.fillStyle = '#ffe14d'; ctx.fill(); ctx.strokeStyle = '#fff6b0'; ctx.lineWidth = 1; ctx.stroke();
    } else if (p.type === 'weapon') {
      const c = GRADES[p.w.grade].color, bob = Math.sin((p.t || 0) * 4) * 3;
      circlePath(p.x, p.y + bob, 20); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = WEAPONS[p.w.id].color; ctx.fillRect(p.x - 12, p.y + bob - 3, 24, 6);
      ctx.fillStyle = c; ctx.font = `bold 12px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(weaponName(p.w), p.x, p.y + bob - 26);
    }
  }
}
function drawVortex(v) {
  const k = v.t / v.max;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.arc(v.x, v.y, v.r * (0.25 + i * 0.22), G.time * (4 - i) + i, G.time * (4 - i) + i + 4);
    ctx.strokeStyle = `rgba(199,125,255,${0.35 * k})`; ctx.lineWidth = 3; ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
  circlePath(v.x, v.y, 22); ctx.fillStyle = '#000'; ctx.fill(); ctx.strokeStyle = '#c77dff'; ctx.lineWidth = 3; ctx.stroke();
}
function drawAlly(a) {
  if (a.type === 'decoy') {
    ctx.globalAlpha = 0.45 * Math.min(1, a.t * 2); circlePath(a.x, a.y, a.r); neonShape(CHARS[run.char].color, 2); ctx.globalAlpha = 1; return;
  }
  const c = a.type === 'robot' ? '#6dd5ff' : '#ffd23d';
  if (a.type === 'turret') { ctx.beginPath(); ctx.arc(a.x, a.y, a.r + 6, -Math.PI / 2, -Math.PI / 2 + TAU * (a.t / a.max)); ctx.strokeStyle = 'rgba(255,210,61,0.5)'; ctx.lineWidth = 2; ctx.stroke(); }
  (a.type === 'robot' ? circlePath(a.x, a.y, a.r) : polyPath(a.x, a.y, a.r, 4, Math.PI / 4)); neonShape(c, 2.2);
  ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.ang); ctx.fillStyle = c; ctx.fillRect(4, -3, 18, 6); ctx.restore();
}

function drawEnemy(e) {
  if (e.spawning) {
    const k = 1 - e.spawnT / 0.75;
    const warnC = (e.type === 'tele' || e.type === 'mimic') ? '255,61,240' : '255,60,60';
    circlePath(e.x, e.y, e.r + 16 - k * 10); ctx.strokeStyle = `rgba(${warnC},${0.4 + k * 0.6})`; ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); ctx.lineDashOffset = G.time * 40; ctx.stroke(); ctx.setLineDash([]);
    circlePath(e.x, e.y, e.r * k); ctx.fillStyle = `rgba(${warnC},0.25)`; ctx.fill();
    if (e.type === 'tele' || e.type === 'mimic' || e.muts) { ctx.fillStyle = `rgb(${warnC})`; ctx.font = `bold 16px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('!', e.x, e.y + 6); }
    return;
  }
  if (!e.boss && !onScreen(e.x, e.y, e.r + 120)) return;
  const c = e.flash > 0 ? '#ffffff' : e.color, f = e.flash > 0 ? '#ffffff' : darken(e.color);
  if (e.muts) {
    for (let i = 0; i < e.muts.length; i++) {
      circlePath(e.x, e.y, e.r + 6 + i * 5); ctx.strokeStyle = ELITES[e.muts[i]].color; ctx.globalAlpha = 0.5 + Math.sin(G.time * 6 + i) * 0.3; ctx.lineWidth = 2.5; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  if (e.bounty) { circlePath(e.x, e.y, e.r + 18); ctx.strokeStyle = '#ff3df0'; ctx.setLineDash([4, 6]); ctx.lineDashOffset = -G.time * 30; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); }
  EN[e.type].draw(e, c, f);
  if (e.frozenT > 0) {
    polyPath(e.x, e.y, e.r * 1.35, 6, 0.3); ctx.fillStyle = 'rgba(180,240,255,0.45)'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
  } else if (e.chill > 0 || e.chillT > 0) {
    circlePath(e.x, e.y, e.r + 2); ctx.fillStyle = 'rgba(140,220,255,0.22)'; ctx.fill();
    for (let i = 0; i < (e.chill || 0); i++) { ctx.fillStyle = '#8fe8ff'; ctx.fillRect(e.x - 8 + i * 6, e.y + e.r + 4, 4, 4); }
  }
  if (e.burnT > 0) { circlePath(e.x, e.y, e.r + 3); ctx.strokeStyle = `rgba(255,120,30,${0.5 + Math.random() * 0.4})`; ctx.lineWidth = 2; ctx.stroke(); }
  if (e.shockT > 0 && Math.random() < 0.5) { circlePath(e.x, e.y, e.r + 4); ctx.strokeStyle = '#fff04d'; ctx.lineWidth = 1; ctx.stroke(); }
  if (e.barrier > 0) { circlePath(e.x, e.y, e.r + 10); ctx.fillStyle = 'rgba(77,210,255,0.15)'; ctx.fill(); ctx.strokeStyle = '#4dd2ff'; ctx.lineWidth = 2; ctx.stroke(); }
  if (e.reflectOn) { polyPath(e.x, e.y, e.r + 12, 6, G.time * 2); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke(); }
  if (!e.boss && (e.muts || e.bounty || G.time - (e.lastHit || -9) < 2.5) && e.hp < e.maxHp) hpBar(e.x, e.y - e.r - 12, Math.max(30, e.r * 2.2), e.hp / e.maxHp, e.muts ? ELITES[e.muts[0]].color : '#ff4d6d');
  if (e.muts) {
    ctx.font = `bold 11px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = ELITES[e.muts[0]].color;
    ctx.fillText(e.muts.map(m => ELITES[m].name).join('·') + (e.bounty ? ' · 현상금' : ''), e.x, e.y - e.r - 18);
  } else if (e.bounty) { ctx.font = `bold 11px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ff3df0'; ctx.fillText('현상금', e.x, e.y - e.r - 18); }
}

function drawPlayer() {
  if (P.dead) return;
  const c = CHARS[run.char].color;
  if (P.slowT > 0) { circlePath(P.x, P.y, 520); ctx.fillStyle = 'rgba(180,140,255,0.06)'; ctx.fill(); ctx.strokeStyle = 'rgba(180,140,255,0.35)'; ctx.lineWidth = 2; ctx.stroke(); }
  if (P.overT > 0 && Math.random() < 0.5) part({ x: P.x + rand(-10, 10), y: P.y + rand(-10, 10), vx: 0, vy: -60, life: 0.3, size: 3, color: '#ff5a5a', kind: 'dot' });
  const blink = P.iframe > 0 && P.rollT <= 0 && Math.floor(G.time * 20) % 2 === 0;
  ctx.globalAlpha = blink ? 0.35 : 1;
  const w = curW();
  ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(P.ang);
  ctx.fillStyle = WEAPONS[w.id].color; ctx.fillRect(6, -3.5, 20 + (w.id === 'sniper' ? 8 : 0), 7);
  ctx.fillStyle = GRADES[w.grade].color; ctx.fillRect(6, -3.5, 5, 7);
  ctx.restore();
  if (SAVE.settings.particles > 0) { ctx.shadowColor = c; ctx.shadowBlur = 16; }
  circlePath(P.x, P.y, P.r); neonShape(P.hurtT > 0 ? '#ffffff' : c, 2.6, P.rollT > 0 ? 'rgba(255,255,255,0.3)' : '#0d0a1c');
  ctx.shadowBlur = 0;
  circlePath(P.x + Math.cos(P.ang) * 5, P.y + Math.sin(P.ang) * 5, 4); ctx.fillStyle = c; ctx.fill();
  ctx.globalAlpha = 1;
  if (BS.prism) {
    ctx.globalCompositeOperation = 'lighter';
    for (const o of prismOrbs()) {
      circlePath(o.x, o.y, 17); ctx.globalAlpha = 0.28; ctx.fillStyle = o.color; ctx.fill(); ctx.globalAlpha = 1;
      if (o.tag === 'fire') circlePath(o.x, o.y, 8 + Math.sin(G.time * 20) * 2); else if (o.tag === 'elec') polyPath(o.x, o.y, 11, 3, G.time * 9); else polyPath(o.x, o.y, 10, 6, G.time * 3);
      ctx.fillStyle = o.color; ctx.fill();
    }
    circlePath(P.x, P.y, P.r + 12 + Math.sin(G.time * 6) * 2); ctx.strokeStyle = `hsla(${(G.time * 200) % 360},100%,65%,0.6)`; ctx.lineWidth = 2; ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }
  if (P.shield > 0) { circlePath(P.x, P.y, P.r + 8); ctx.strokeStyle = 'rgba(109,255,138,0.7)'; ctx.lineWidth = 2; ctx.stroke(); }
  if (w.reloadT > 0) { hpBar(P.x, P.y + P.r + 8, 34, 1 - w.reloadT / (w.reloadMax || 1), '#29f0ff', 3); }
  if (P.prompt) {
    ctx.font = `bold 14px ${FONT}`; ctx.textAlign = 'center';
    const tw = ctx.measureText(P.prompt).width;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(P.x - tw / 2 - 8, P.y - 56, tw + 16, 22);
    ctx.fillStyle = '#29f0ff'; ctx.fillText(P.prompt, P.x, P.y - 40);
  }
}

function drawBullets() {
  ctx.globalCompositeOperation = 'lighter';
  for (const b of BULLETS) {
    if (b.team !== 'p' || !onScreen(b.x, b.y, 40)) continue;
    switch (b.type) {
      case 'flame': {
        const k = b.life / b.maxLife;
        circlePath(b.x, b.y, b.r); ctx.fillStyle = `rgba(255,${Math.floor(80 + 120 * k)},30,${0.35 * k + 0.05})`; ctx.fill();
        break;
      }
      case 'boomerang':
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.t * 20);
        circlePath(0, 0, b.r); ctx.strokeStyle = b.color; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = b.color; ctx.fillRect(-b.r, -1.5, b.r * 2, 3); ctx.restore();
        break;
      case 'grenade': case 'bh':
        circlePath(b.x, b.y, b.r * 2); ctx.fillStyle = b.color; ctx.globalAlpha = 0.25; ctx.fill(); ctx.globalAlpha = 1;
        circlePath(b.x, b.y, b.r); ctx.fillStyle = b.color; ctx.fill();
        break;
      default: {
        const sp = Math.hypot(b.vx, b.vy) || 1, tl = Math.min(b.big ? 60 : 22, sp * 0.03);
        ctx.beginPath(); ctx.moveTo(b.x - b.vx / sp * tl, b.y - b.vy / sp * tl); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = b.color; ctx.globalAlpha = 0.5; ctx.lineWidth = b.r * 1.6; ctx.stroke(); ctx.globalAlpha = 1;
        circlePath(b.x, b.y, b.r * (b.crit ? 1.4 : 1)); ctx.fillStyle = b.crit ? '#ffffff' : b.color; ctx.fill();
      }
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  // 적 탄: 항상 붉은색 + 흰 테두리 (가독성)
  for (const b of BULLETS) {
    if (b.team !== 'e') continue;
    if (b.type === 'lob') {
      const k = clamp(b.t / b.maxLife, 0, 1);
      circlePath(b.tx, b.ty, b.aoe || 60); ctx.fillStyle = `rgba(255,50,50,${0.08 + k * 0.15})`; ctx.fill();
      ctx.strokeStyle = 'rgba(255,80,80,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
      circlePath(b.tx, b.ty, (b.aoe || 60) * k); ctx.strokeStyle = 'rgba(255,80,80,0.5)'; ctx.stroke();
      const hgt = Math.sin(k * Math.PI) * 140;
      circlePath(b.x, b.y - hgt, b.r); ctx.fillStyle = b.debris ? '#8a6040' : '#ff5a3a'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      continue;
    }
    if (!onScreen(b.x, b.y, 30)) continue;
    circlePath(b.x, b.y, b.r + 2); ctx.fillStyle = '#ffffff'; ctx.fill();
    circlePath(b.x, b.y, b.r); ctx.fillStyle = '#ff2d4a'; ctx.fill();
    if (b.color !== '#ff3b3b') { circlePath(b.x, b.y, b.r * 0.45); ctx.fillStyle = b.color; ctx.fill(); }
  }
}

function drawParticles(ground) {
  for (const p of PARTS) {
    const g = p.kind === 'shell' || p.kind === 'debris';
    if (g !== ground) continue;
    const k = p.life / p.max;
    switch (p.kind) {
      case 'dot':
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, k * 1.5);
        ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        break;
      case 'smoke':
        ctx.globalAlpha = k * 0.8; circlePath(p.x, p.y, p.size); ctx.fillStyle = p.color; ctx.fill();
        break;
      case 'shell': case 'debris':
        ctx.globalAlpha = Math.min(1, k * 3);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
        if (p.kind === 'shell') ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size); else ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
        break;
      case 'flash':
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k;
        circlePath(p.x, p.y, p.size); ctx.fillStyle = p.color; ctx.fill();
        break;
      case 'ring':
        ctx.globalAlpha = k; circlePath(p.x, p.y, p.size * (0.3 + 0.7 * (1 - k)));
        ctx.strokeStyle = p.color; ctx.lineWidth = 2 + 4 * k; ctx.stroke();
        break;
      case 'ghost':
        ctx.globalAlpha = k * 0.4; circlePath(p.x, p.y, p.size); ctx.fillStyle = p.color; ctx.fill();
        break;
      case 'arc':
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.7 + 0.3 * (1 - k)), p.rot - 1.05, p.rot + 1.05);
        ctx.strokeStyle = p.color; ctx.lineWidth = 18 * k + 2; ctx.stroke();
        break;
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
}
