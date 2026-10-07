// ================= 컷씬 연출 2: 장면 · 카메라 · 초상화 =================
// 대사마다 scene(장면)을 바꿀 수 있다. 장면이 바뀌면 암전 전환, 화자는 좌우 초상화로 등장한다.
CUT_WHO.log = { name: () => '복구된 기록', color: '#6dff8a' };
const CUT_RIGHT = new Set(['han', 'mother', 'sentinel', 'siwoo', 'lightless']); // 오른쪽에 서는 인물

function srand(seed) { let s = (seed >>> 0) || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const SCN_CACHE = {};
function scnLayout(name, fn) { if (!SCN_CACHE[name]) { let h = 7; for (const ch of name) h = h * 31 + ch.charCodeAt(0); SCN_CACHE[name] = fn(srand(h)); } return SCN_CACHE[name]; }
function glowDot(x, px, py, r, col, a) { if (!(r > 0) || !isFinite(r + px + py)) return; const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); }
function bigEye(x, cx, cy, r, t, c) {
  const red = clamp(c.redeye || 0, 0, 1), col = red > 0.5 ? '255,61,106' : '255,61,240', k = Math.min(1, c.eye);
  x.save(); x.globalCompositeOperation = 'lighter';
  glowDot(x, cx, cy, r * 2.6, `rgba(${col},A)`, 0.28 * k);
  for (let i = 0; i < 4; i++) { x.strokeStyle = `rgba(${col},${(0.6 - i * 0.1) * k})`; x.lineWidth = 4 - i * 0.6; x.beginPath(); x.ellipse(cx, cy, r * (1 - i * 0.16), r * (0.5 - i * 0.07) * k + 1, 0, 0, TAU); x.stroke(); }
  const pr = r * 0.26 * (1 + (c.pulse || 0) * 0.15);
  x.fillStyle = `rgba(255,255,255,${0.9 * k})`; x.beginPath(); x.ellipse(cx + Math.sin(t * 0.7) * r * 0.08, cy, red > 0.5 ? pr * 0.35 : pr, pr * 0.85 * k + 0.5, 0, 0, TAU); x.fill();
  x.restore();
}

// ---------- 장면들 ----------
const CUT_SCENES = {
  city(x, W, H, t, c) {
    const L = scnLayout('city', R => [0, 1, 2].map(d => { const arr = []; let px = -0.3; while (px < 1.3) { const w = 0.04 + R() * 0.07; arr.push({ x: px, w, h: 0.18 + R() * (0.3 + d * 0.12), win: Array.from({ length: 40 }, () => R()), sign: R() < 0.18 ? ['#ff3df0', '#29f0ff', '#ffe14d'][Math.floor(R() * 3)] : null }); px += w + 0.004; } return arr; }));
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05030e'); g.addColorStop(0.6, `rgb(${30 + c.power * 30},10,${50 + c.power * 20})`); g.addColorStop(1, '#090410');
    x.fillStyle = g; x.fillRect(-W, -H, W * 3, H * 3);
    glowDot(x, W * 0.72, H * 0.22, H * 0.3, 'rgba(255,90,200,A)', 0.18);
    for (let s = 0; s < 3; s++) { // 서치라이트
      const a = -Math.PI / 2 + Math.sin(t * 0.4 + s * 2) * 0.5, bx = W * (0.2 + s * 0.3);
      x.fillStyle = c.alert > 0.5 ? 'rgba(255,60,80,0.06)' : 'rgba(180,220,255,0.05)';
      x.beginPath(); x.moveTo(bx, H * 0.8); x.lineTo(bx + Math.cos(a - 0.06) * H, H * 0.8 + Math.sin(a - 0.06) * H); x.lineTo(bx + Math.cos(a + 0.06) * H, H * 0.8 + Math.sin(a + 0.06) * H); x.fill();
    }
    L.forEach((layer, d) => {
      const base = H * (0.72 + d * 0.08), par = (d + 1) * 6 * Math.sin(t * 0.05);
      for (const b of layer) {
        const bx = b.x * W + par, bw = b.w * W, bh = b.h * H;
        x.fillStyle = ['#120a22', '#0c0618', '#07040e'][d]; x.fillRect(bx, base - bh, bw, bh + H);
        const cols = Math.max(1, Math.floor(bw / 9)), rows = Math.floor(bh / 12);
        for (let i = 0; i < Math.min(40, cols * rows); i++) {
          if (b.win[i] > c.power * 0.55 + (d === 2 ? 0.05 : 0)) continue;
          const wx = bx + 3 + (i % cols) * 9, wy = base - bh + 6 + Math.floor(i / cols) * 12;
          x.fillStyle = (Math.sin(t * 3 + i * 7 + b.x * 50) > 0.97) ? '#fff' : ['rgba(255,214,120,0.5)', 'rgba(120,220,255,0.45)', 'rgba(255,140,220,0.4)'][i % 3]; x.fillRect(wx, wy, 4, 5);
        }
        if (b.sign && c.power > 0.3) { x.fillStyle = b.sign; x.globalAlpha = 0.6 + Math.sin(t * 5 + b.x * 30) * 0.3; x.fillRect(bx + bw * 0.2, base - bh + 10, bw * 0.6, 4); x.globalAlpha = 1; }
      }
    });
    x.fillStyle = 'rgba(255,61,240,0.06)'; x.fillRect(-W, H * 0.92, W * 3, H);
    x.strokeStyle = 'rgba(180,200,255,0.18)'; x.lineWidth = 1; x.beginPath(); // 비
    for (let i = 0; i < 90; i++) { const rx = ((i * 97 + t * 900) % (W + 200)) - 100, ry = ((i * 53 + t * 1400) % (H + 100)) - 50; x.moveTo(rx, ry); x.lineTo(rx - 6, ry + 22); }
    x.stroke();
  },
  junkyard(x, W, H, t, c) {
    const L = scnLayout('junk', R => ({ piles: Array.from({ length: 9 }, (_, i) => ({ x: i / 8, w: 0.12 + R() * 0.1, h: 0.12 + R() * 0.2, cars: Array.from({ length: 4 }, () => [R(), R()]) })), embers: Array.from({ length: 50 }, () => [R(), R(), 0.3 + R()]) }));
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120806'); g.addColorStop(0.65, '#5a2a10'); g.addColorStop(1, '#140a06');
    x.fillStyle = g; x.fillRect(-W, -H, W * 3, H * 3);
    glowDot(x, W * 0.3, H * 0.62, H * 0.5, 'rgba(255,120,40,A)', 0.25);
    x.save(); x.translate(W * 0.75, H * 0.08); x.strokeStyle = '#1a0c06'; x.lineWidth = 14; // 크레인
    x.beginPath(); x.moveTo(0, H); x.lineTo(0, 0); x.lineTo(-W * 0.4, H * 0.05); x.stroke();
    const sw = Math.sin(t * 0.8) * 0.08; x.lineWidth = 2; x.beginPath(); x.moveTo(-W * 0.3, H * 0.04); x.lineTo(-W * 0.3 + Math.sin(sw) * H * 0.35, H * 0.39); x.stroke(); x.restore();
    for (const p of L.piles) {
      const px = p.x * W, base = H * 0.86;
      x.fillStyle = '#0d0604'; x.beginPath(); x.moveTo(px - p.w * W, base); x.quadraticCurveTo(px, base - p.h * H * 1.6, px + p.w * W, base); x.fill();
      for (const [a, b] of p.cars) { x.strokeStyle = 'rgba(255,140,60,0.25)'; x.lineWidth = 2; x.strokeRect(px + (a - 0.5) * p.w * W, base - b * p.h * H - 20, 40, 16); }
    }
    x.fillStyle = '#0a0503'; x.fillRect(-W, H * 0.86, W * 3, H);
    for (const [ex, ey, v] of L.embers) { const yy = (ey * H - t * 40 * v) % H; glowDot(x, ex * W + Math.sin(t + ex * 9) * 10, yy < 0 ? yy + H : yy, 4, 'rgba(255,150,60,A)', 0.8); }
  },
  cryo(x, W, H, t, c) {
    const L = scnLayout('cryo', R => ({ ice: Array.from({ length: 12 }, () => [R(), 0.2 + R() * 0.4, 0.02 + R() * 0.03]), snow: Array.from({ length: 80 }, () => [R(), R(), 0.3 + R()]) }));
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#04101c'); g.addColorStop(0.7, '#123a58'); g.addColorStop(1, '#061420');
    x.fillStyle = g; x.fillRect(-W, -H, W * 3, H * 3);
    for (const k of [0.25, 0.75]) { x.fillStyle = '#081a2a'; x.beginPath(); x.moveTo(W * k - 90, H); x.lineTo(W * k - 60, H * 0.2); x.lineTo(W * k + 60, H * 0.2); x.lineTo(W * k + 90, H); x.fill(); x.strokeStyle = 'rgba(160,230,255,0.3)'; x.stroke(); }
    for (const [ix, ih, iw] of L.ice) { x.fillStyle = 'rgba(160,230,255,0.18)'; x.strokeStyle = 'rgba(200,245,255,0.5)'; x.beginPath(); x.moveTo(ix * W - iw * W, H * 0.9); x.lineTo(ix * W, H * (0.9 - ih)); x.lineTo(ix * W + iw * W, H * 0.9); x.closePath(); x.fill(); x.stroke(); }
    for (let i = 0; i < 6; i++) { const sx = ((i * 0.21 + t * 0.02) % 1.2) * W, sy = H * (0.4 + (i % 3) * 0.15); glowDot(x, sx, sy, H * 0.18, 'rgba(220,240,255,A)', 0.08); }
    x.fillStyle = '#040e18'; x.fillRect(-W, H * 0.9, W * 3, H);
    x.fillStyle = 'rgba(230,245,255,0.7)'; for (const [sx, sy, v] of L.snow) x.fillRect((sx * W + Math.sin(t + sy * 10) * 20) % W, (sy * H + t * 30 * v) % H, 2, 2);
  },
  plant(x, W, H, t, c) {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0c0a02'); g.addColorStop(0.7, '#3a3008'); g.addColorStop(1, '#0c0a02');
    x.fillStyle = g; x.fillRect(-W, -H, W * 3, H * 3);
    const tops = [];
    for (let i = 0; i < 4; i++) {
      const cx = W * (0.15 + i * 0.23), top = H * (0.32 + (i % 2) * 0.08);
      x.fillStyle = '#141004'; x.fillRect(cx - 14, top, 28, H); for (let k = 0; k < 6; k++) { x.strokeStyle = 'rgba(255,224,58,0.35)'; x.beginPath(); x.ellipse(cx, top + 20 + k * 22, 30, 7, 0, 0, TAU); x.stroke(); }
      glowDot(x, cx, top, 40, 'rgba(255,230,90,A)', 0.5 + Math.sin(t * 9 + i) * 0.2); tops.push([cx, top]);
    }
    if (Math.sin(t * 7) > 0.2) for (let i = 0; i < 3; i++) { const [a, b] = [tops[i], tops[i + 1]]; x.strokeStyle = 'rgba(255,250,180,0.85)'; x.lineWidth = 2; x.beginPath(); x.moveTo(a[0], a[1]); for (let k = 1; k < 8; k++) x.lineTo(lerp(a[0], b[0], k / 8) + (Math.random() - 0.5) * 30, lerp(a[1], b[1], k / 8) + (Math.random() - 0.5) * 30); x.lineTo(b[0], b[1]); x.stroke(); }
    x.fillStyle = '#080600'; x.fillRect(-W, H * 0.88, W * 3, H);
  },
  tracks(x, W, H, t, c) {
    const vx = W / 2, vy = H * 0.45;
    x.fillStyle = '#07040a'; x.fillRect(-W, -H, W * 3, H * 3);
    for (let i = 14; i >= 0; i--) { // 터널 고리
      const d = ((i + (t * 0.6) % 1) / 14), s = Math.pow(d, 1.8) * 2 + 0.03;
      const lamp = c.power * (0.6 + 0.4 * Math.sin(t * 9 + i * 3));
      x.strokeStyle = `rgba(${c.alert > 0.5 ? '255,70,70' : '255,130,110'},${0.35 * (1 - d * 0.5) * lamp})`; x.lineWidth = 2 + (1 - d) * 4;
      x.beginPath(); x.ellipse(vx, vy, W * 0.45 * s + 20, H * 0.48 * s + 14, 0, Math.PI, TAU); x.stroke();
      glowDot(x, vx - W * 0.42 * s, vy - H * 0.1 * s, 6 + 30 * s, 'rgba(255,160,120,A)', 0.4 * lamp);
    }
    x.strokeStyle = 'rgba(200,170,160,0.5)'; x.lineWidth = 3; x.beginPath(); // 선로
    for (const k of [-1, 1]) { x.moveTo(vx + k * 6, vy); x.lineTo(vx + k * W * 0.35, H * 1.1); }
    x.stroke();
    for (let i = 0; i < 12; i++) { const d = ((i + t * 2) % 12) / 12, y = vy + Math.pow(d, 2) * H * 0.7, w = 8 + Math.pow(d, 2) * W * 0.7; x.fillStyle = 'rgba(120,80,70,0.4)'; x.fillRect(vx - w / 2, y, w, 2 + d * 8); }
    const tr = (t * 0.25) % 1; if (tr > 0.75) { const k = (tr - 0.75) / 0.25; glowDot(x, vx - 30 * k, vy + 5, 20 + k * 120, 'rgba(255,250,220,A)', 0.8 * k); glowDot(x, vx + 30 * k, vy + 5, 20 + k * 120, 'rgba(255,250,220,A)', 0.8 * k); }
  },
  command(x, W, H, t, c) {
    const red = clamp(c.alert, 0, 1);
    x.fillStyle = `rgb(${8 + red * 20},8,${16})`; x.fillRect(-W, -H, W * 3, H * 3);
    for (let i = 0; i < 5; i++) { // 벽 화면
      const sx = W * (0.08 + i * 0.18), sy = H * 0.12, sw = W * 0.15, sh = H * 0.2;
      x.fillStyle = 'rgba(10,24,40,0.95)'; x.fillRect(sx, sy, sw, sh); glowDot(x, sx + sw / 2, sy + sh / 2, sw * 0.7, red > 0.5 ? 'rgba(255,60,80,A)' : 'rgba(41,240,255,A)', 0.08 * c.power + 0.02);
      x.strokeStyle = `rgba(${red > 0.5 ? '255,80,80' : '41,240,255'},${0.5 * c.power + 0.1})`; x.lineWidth = 1.5; x.strokeRect(sx, sy, sw, sh);
      x.beginPath(); for (let k = 0; k <= 20; k++) { const px = sx + k * sw / 20, py = sy + sh * (0.6 + Math.sin(t * 2 + k * 0.7 + i) * 0.25); k ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
    }
    const cx = W / 2, cy = H * 0.66; // 홀로그램 지도 탁자
    x.fillStyle = '#0a0a14'; x.beginPath(); x.ellipse(cx, cy + 40, W * 0.3, H * 0.08, 0, 0, TAU); x.fill();
    x.save(); x.translate(cx, cy - 20); x.scale(1, 0.4); x.rotate(t * 0.15);
    x.strokeStyle = `rgba(41,240,255,${0.6 * c.power + 0.05})`; x.lineWidth = 1.4;
    for (let i = -6; i <= 6; i++) { x.beginPath(); x.moveTo(i * 30, -180); x.lineTo(i * 30, 180); x.moveTo(-180, i * 30); x.lineTo(180, i * 30); x.stroke(); }
    for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 0.6; glowDot(x, Math.cos(a) * 110, Math.sin(a) * 110, 40, ['rgba(255,138,42,A)', 'rgba(127,220,255,A)', 'rgba(255,224,58,A)', 'rgba(200,107,255,A)'][i], 0.8 * c.power); }
    x.restore();
    for (let i = 0; i < 4; i++) { const sx = W * (0.15 + i * 0.23), sy = H * 0.86; x.fillStyle = '#030306'; x.beginPath(); x.arc(sx, sy - 70, 16, 0, TAU); x.fill(); x.fillRect(sx - 26, sy - 54, 52, 80); }
    if (red > 0.1) { const a = t * 4; for (const k of [0.1, 0.9]) { x.fillStyle = `rgba(255,30,60,${0.12 * red})`; x.beginPath(); x.moveTo(W * k, 20); x.lineTo(W * k + Math.cos(a) * W, 20 + Math.sin(a) * H); x.lineTo(W * k + Math.cos(a + 0.4) * W, 20 + Math.sin(a + 0.4) * H); x.fill(); } }
  },
  sewer(x, W, H, t, c) {
    const vx = W / 2, vy = H * 0.42;
    x.fillStyle = '#031014'; x.fillRect(-W, -H, W * 3, H * 3);
    for (let i = 10; i >= 0; i--) { const d = i / 10, s = Math.pow(d, 1.6) * 1.8 + 0.04; x.strokeStyle = `rgba(61,224,200,${0.25 * (1 - d * 0.6)})`; x.lineWidth = 2 + (1 - d) * 5; x.beginPath(); x.arc(vx, vy, Math.min(W, H) * 0.55 * s + 10, Math.PI, TAU); x.stroke(); }
    for (const k of [-1, 1]) { x.strokeStyle = '#0c2a2a'; x.lineWidth = 18; x.beginPath(); x.moveTo(vx + k * W * 0.6, H * 0.15); x.lineTo(vx + k * 40, vy - 10); x.stroke(); }
    const wy = H * 0.62; const g = x.createLinearGradient(0, wy, 0, H); g.addColorStop(0, '#0a3a3a'); g.addColorStop(1, '#021010');
    x.fillStyle = g; x.fillRect(-W, wy, W * 3, H);
    x.strokeStyle = 'rgba(106,255,230,0.25)'; x.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) { const y = wy + 10 + i * i * 2.4; x.beginPath(); for (let k = 0; k <= 30; k++) { const px = -20 + k * (W + 40) / 30; const py = y + Math.sin(t * 2 + k * 0.6 + i) * (1 + i * 0.4); k ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
    for (let i = 0; i < 6; i++) { const dx = W * (0.15 + i * 0.14), dy = ((t * 0.7 + i * 0.37) % 1) * (wy - H * 0.15) + H * 0.15; x.fillStyle = 'rgba(160,255,240,0.6)'; x.fillRect(dx, dy, 2, 6); }
  },
  market(x, W, H, t, c) {
    const L = scnLayout('market', R => ({ candles: Array.from({ length: 46 }, () => [R(), 0.62 + R() * 0.3, R()]), crowd: Array.from({ length: 16 }, () => [R(), 0.85 + R() * 0.1, 0.7 + R() * 0.5]), stalls: Array.from({ length: 7 }, (_, i) => [i / 6, 0.15 + R() * 0.1]) }));
    x.fillStyle = '#050407'; x.fillRect(-W, -H, W * 3, H * 3);
    x.strokeStyle = 'rgba(160,140,200,0.18)'; x.lineWidth = 1; x.beginPath(); x.moveTo(-W, H * 0.12); x.quadraticCurveTo(W / 2, H * 0.28, W * 2, H * 0.12); x.stroke(); // 꺼진 전구 줄
    for (let i = 0; i < 16; i++) { const lx = W * i / 15, ly = H * 0.12 + Math.sin(i / 15 * Math.PI) * H * 0.08; glowDot(x, lx, ly + 6, 6, 'rgba(200,180,255,A)', 0.15); }
    for (const [sx, sh] of L.stalls) { x.fillStyle = '#0b0910'; x.fillRect(sx * W - 70, H * (0.75 - sh), 140, H); x.fillStyle = '#100c18'; x.beginPath(); x.moveTo(sx * W - 85, H * (0.75 - sh)); x.lineTo(sx * W, H * (0.68 - sh)); x.lineTo(sx * W + 85, H * (0.75 - sh)); x.fill(); }
    const on = clamp(c.power * 4, 0, 1);
    x.save(); x.globalCompositeOperation = 'lighter';
    for (const [cx, cy, ph] of L.candles) { const fl = 0.7 + Math.sin(t * 13 + ph * 40) * 0.2 + Math.sin(t * 7.3 + ph * 9) * 0.1; glowDot(x, cx * W, cy * H, 26 * fl, 'rgba(255,170,70,A)', 0.55 * on); x.fillStyle = `rgba(255,240,200,${on})`; x.fillRect(cx * W - 1, cy * H - 4, 2, 4); }
    x.restore();
    for (const [px, py, s] of L.crowd) { const a = 0.35 + c.ghost * 0.5; x.fillStyle = `rgba(14,10,22,${a + 0.3})`; x.beginPath(); x.arc(px * W, py * H - 60 * s, 13 * s, 0, TAU); x.fill(); x.beginPath(); x.moveTo(px * W - 24 * s, py * H + 30); x.lineTo(px * W - 14 * s, py * H - 46 * s); x.lineTo(px * W + 14 * s, py * H - 46 * s); x.lineTo(px * W + 24 * s, py * H + 30); x.fill(); }
  },
  bunker(x, W, H, t, c) {
    const red = clamp(0.5 + c.alert * 0.5, 0, 1);
    const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, `rgba(${90 * red + 20},8,20,1)`); g.addColorStop(0.5, '#0a0610'); g.addColorStop(1, '#2a0c3a');
    x.fillStyle = g; x.fillRect(-W, -H, W * 3, H * 3);
    const cx = W / 2, cy = H * 0.42, R0 = Math.min(W, H) * 0.32, open = c.door;
    for (let i = 0; i < 6; i++) { x.strokeStyle = i % 2 ? 'rgba(255,90,110,0.35)' : 'rgba(200,120,255,0.35)'; x.lineWidth = 6 - i * 0.6; x.beginPath(); x.arc(cx, cy, R0 * (1 - i * 0.12), 0, TAU); x.stroke(); }
    x.save(); x.translate(cx, cy); x.rotate(t * 0.05 + open * 2);
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; x.fillStyle = '#2a1a30'; x.fillRect(Math.cos(a) * R0 * 0.9 - 6, Math.sin(a) * R0 * 0.9 - 6, 12, 12); }
    x.restore();
    if (open > 0.05) glowDot(x, cx, cy, R0 * 0.9 * open, 'rgba(255,240,255,A)', 0.5 * open);
    if (c.eye > 0.02) bigEye(x, cx, cy, R0 * 0.45, t, c);
    x.fillStyle = '#08060c'; x.fillRect(-W, H * 0.8, W * 3, H);
    for (let i = -10; i < 20; i++) { x.fillStyle = 'rgba(255,200,40,0.25)'; x.beginPath(); x.moveTo(i * 60 + (t * 20) % 60, H * 0.8); x.lineTo(i * 60 + 30 + (t * 20) % 60, H * 0.8); x.lineTo(i * 60 + 10 + (t * 20) % 60, H * 0.84); x.lineTo(i * 60 - 20 + (t * 20) % 60, H * 0.84); x.fill(); }
  },
  server(x, W, H, t, c) {
    const vx = W / 2, vy = H * 0.45, red = clamp(c.redeye || 0, 0, 1);
    x.fillStyle = red > 0.5 ? '#12040a' : '#0a0614'; x.fillRect(-W, -H, W * 3, H * 3);
    for (let side = -1; side <= 1; side += 2) for (let r = 0; r < 9; r++) {
      const d = (r + 1) / 10, s = Math.pow(d, 1.8) * 1.6 + 0.05, px = vx + side * (60 + s * W * 0.32), w = 20 + s * 120, h = H * (0.15 + s * 0.5);
      x.fillStyle = '#140a22'; x.fillRect(px - w / 2, vy + H * 0.22 - h, w, h);
      x.strokeStyle = red > 0.5 ? 'rgba(255,61,106,0.4)' : 'rgba(200,107,255,0.45)'; x.lineWidth = 1.5; x.strokeRect(px - w / 2, vy + H * 0.22 - h, w, h);
      for (let l = 0; l < 8; l++) { x.fillStyle = Math.sin(t * (2 + l) + r * 3 + side) > 0 ? (red > 0.5 ? 'rgba(255,70,110,0.9)' : 'rgba(90,255,220,0.9)') : 'rgba(80,40,120,0.5)'; x.fillRect(px - w / 2 + 4, vy + H * 0.22 - h + 6 + l * (h - 10) / 8, w * 0.2, 3); }
    }
    x.strokeStyle = 'rgba(120,80,180,0.2)'; x.lineWidth = 2; x.beginPath(); for (let i = 0; i < 8; i++) { x.moveTo(-50 + i * W / 7, -10); x.quadraticCurveTo(vx, vy - H * 0.1, vx + (i - 3.5) * 20, vy - H * 0.2); } x.stroke();
    if (c.eye > 0.02) bigEye(x, vx, vy - H * 0.06, 50 + c.eye * 70, t, c);
    x.fillStyle = '#05030a'; x.fillRect(-W, vy + H * 0.22, W * 3, H);
  },
  log(x, W, H, t, c) {
    x.fillStyle = '#020a05'; x.fillRect(-W, -H, W * 3, H * 3);
    const pw = Math.min(W * 0.8, 900), ph = H * 0.5, px = (W - pw) / 2, py = H * 0.16;
    x.fillStyle = 'rgba(4,22,10,0.95)'; x.fillRect(px, py, pw, ph);
    x.strokeStyle = '#2cff7a'; x.lineWidth = 2; x.strokeRect(px, py, pw, ph);
    x.fillStyle = '#2cff7a'; x.font = `bold 14px Orbitron, monospace`; x.textAlign = 'left'; x.fillText('ARCHIVE // 복구된 기록', px + 16, py + 26);
    x.fillStyle = 'rgba(44,255,122,0.4)'; x.fillRect(px + 16, py + 34, pw - 32, 1);
    const l = cut.lines[cut.i]; const full = l ? l.text : ''; const txt = cut.typing ? full.slice(0, cut.ch) : full;
    x.font = `${Math.max(15, Math.min(22, W / 48))}px 'Noto Sans KR', monospace`; x.fillStyle = '#b8ffd0';
    const maxW = pw - 40; let line = '', y = py + 70; const lh = Math.max(24, Math.min(32, W / 34));
    for (const ch of txt) { if (x.measureText(line + ch).width > maxW) { x.fillText(line, px + 20, y); line = ''; y += lh; } line += ch; }
    x.fillText(line + (Math.sin(t * 8) > 0 ? '▌' : ''), px + 20, y);
    x.fillStyle = 'rgba(44,255,122,0.05)'; for (let i = 0; i < ph; i += 3) x.fillRect(px, py + i, pw, 1);
  },
  broadcast(x, W, H, t, c) {
    x.fillStyle = '#060410'; x.fillRect(-W, -H, W * 3, H * 3);
    const cols = 8, rows = 5, gw = W * 0.9 / cols, gh = H * 0.6 / rows;
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const sx = W * 0.05 + k * gw, sy = H * 0.06 + r * gh, hot = (k * 7 + r * 3 + Math.floor(t * 2)) % 11 === 0;
      x.fillStyle = hot ? 'rgba(255,61,240,0.35)' : 'rgba(20,16,40,0.9)'; x.fillRect(sx + 3, sy + 3, gw - 6, gh - 6);
      x.strokeStyle = 'rgba(41,240,255,0.35)'; x.strokeRect(sx + 3, sy + 3, gw - 6, gh - 6);
      x.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 6; i++) x.fillRect(sx + 6 + Math.random() * (gw - 14), sy + 6 + Math.random() * (gh - 14), 6, 1);
      x.fillStyle = 'rgba(232,236,255,0.75)'; x.font = `bold ${Math.max(10, gh * 0.3)}px 'Noto Sans KR'`; x.textAlign = 'center'; x.fillText(hot ? '?' : (r + k) % 3 === 0 ? 'LIVE' : '', sx + gw / 2, sy + gh * 0.6);
    }
    x.fillStyle = '#030208'; x.fillRect(-W, H * 0.72, W * 3, H);
    for (let i = 0; i < 30; i++) { x.fillStyle = '#0c0818'; x.beginPath(); x.arc(W * (i / 29), H * 0.78, 12, 0, TAU); x.fill(); x.fillRect(W * (i / 29) - 16, H * 0.78 + 8, 32, 60); }
  }
};

// ---------- 공통 덧그림 (경보, 데이터 비, 비네트, 글리치) ----------
function cutOverlays(x, W, H, t, c) {
  const red = clamp(c.alert, 0, 1);
  if (c.data > 0.02) {
    x.font = '14px monospace'; x.textAlign = 'center';
    for (const r of cut.rain) { r.y += r.v / 60; if (r.y > 1.1) { r.y = -0.1; r.x = Math.random(); } x.fillStyle = `rgba(140,255,200,${0.45 * c.data})`; x.fillText(r.c, r.x * W, r.y * H); }
  }
  if (c.ghost > 0.02 && cut.scene !== 'market') {
    for (let i = 0; i < 10; i++) { const gx = W / 2 + (i - 4.5) * W * 0.07, gy = H * 0.7 + (i % 2) * 14, fl = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.3); x.globalAlpha = c.ghost * (0.2 + 0.25 * fl); x.fillStyle = '#8cf6ff'; x.beginPath(); x.arc(gx, gy - 38, 7, 0, TAU); x.fill(); x.fillRect(gx - 10, gy - 30, 20, 30); }
    x.globalAlpha = 1;
  }
  if (red > 0.02) { x.fillStyle = `rgba(255,30,80,${0.1 * red * (0.7 + 0.3 * Math.sin(t * 6))})`; x.fillRect(0, 0, W, H); }
  const vg = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.7)');
  x.fillStyle = vg; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = 0; y < H; y += 4) x.fillRect(0, y, W, 1);
  if (c.glitch > 0.05) {
    const cvv = x.canvas, d = cvv.width / W;
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < 8 * c.glitch; i++) { const y = Math.random() * cvv.height, h = (4 + Math.random() * 40) * d; try { x.drawImage(cvv, 0, y, cvv.width, h, (Math.random() - 0.5) * 80 * c.glitch * d, y, cvv.width, h); } catch (e) { } }
    x.restore();
  }
}

// ---------- 초상화 ----------
function drawBust(x, who, cx, base, h, t, active, talk) {
  const s = h / 300, col = (CUT_WHO[who] && CUT_WHO[who].color) || cut.color;
  const breathe = Math.sin(t * 1.6 + cx) * 2 * s;
  x.save();
  x.globalAlpha = active ? 1 : 0.4;
  x.translate(cx, base + breathe);
  const glow = active ? 14 + (talk ? Math.sin(t * 18) * 6 + 6 : 0) : 4;
  x.shadowColor = col; x.shadowBlur = glow;
  const fill = x.createLinearGradient(0, -h, 0, 0); fill.addColorStop(0, '#120e22'); fill.addColorStop(1, '#05030a');
  if (who === 'mother' || who === 'sentinel') { // 기계: 프레임 속 눈
    const red = who === 'sentinel';
    x.fillStyle = fill; x.strokeStyle = col; x.lineWidth = 3;
    x.beginPath(); const n = red ? 3 : 6, rr = 110 * s;
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * TAU / n + (red ? 0 : Math.PI / 6); const px = Math.cos(a) * rr, py = -150 * s + Math.sin(a) * rr; i ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.closePath(); x.fill(); x.stroke();
    x.beginPath(); x.ellipse(0, -150 * s, 60 * s, (red ? 14 : 28) * s * (talk ? 1 + Math.sin(t * 16) * 0.15 : 1), 0, 0, TAU); x.stroke();
    x.fillStyle = col; x.beginPath(); x.arc(0, -150 * s, (red ? 9 : 14) * s, 0, TAU); x.fill();
    x.restore(); return;
  }
  // 어깨와 몸
  x.fillStyle = fill; x.strokeStyle = col; x.lineWidth = 2.5;
  x.beginPath(); x.moveTo(-125 * s, 0); x.quadraticCurveTo(-118 * s, -95 * s, -55 * s, -110 * s); x.lineTo(-24 * s, -128 * s); x.lineTo(24 * s, -128 * s); x.lineTo(55 * s, -110 * s); x.quadraticCurveTo(118 * s, -95 * s, 125 * s, 0); x.closePath(); x.fill(); x.stroke();
  // 머리
  x.beginPath(); x.ellipse(0, -180 * s, 40 * s, 50 * s, 0, 0, TAU); x.fill(); x.stroke();
  x.shadowBlur = 0;
  switch (who) {
    case 'agent': // 헬멧 바이저
      x.fillStyle = col; x.globalAlpha *= 0.9; x.fillRect(-34 * s, -192 * s, 68 * s, 12 * s);
      x.strokeStyle = col; x.beginPath(); x.moveTo(-90 * s, -95 * s); x.lineTo(-55 * s, -112 * s); x.moveTo(90 * s, -95 * s); x.lineTo(55 * s, -112 * s); x.stroke();
      break;
    case 'yuna': // 헤드셋, 단발
      x.fillStyle = '#0a1a24'; x.beginPath(); x.moveTo(-44 * s, -170 * s); x.quadraticCurveTo(-46 * s, -235 * s, 0, -234 * s); x.quadraticCurveTo(46 * s, -235 * s, 44 * s, -170 * s); x.lineTo(44 * s, -140 * s); x.lineTo(30 * s, -160 * s); x.lineTo(-30 * s, -160 * s); x.lineTo(-44 * s, -140 * s); x.closePath(); x.fill(); x.stroke();
      x.lineWidth = 4; x.beginPath(); x.arc(0, -185 * s, 50 * s, Math.PI * 1.05, Math.PI * 1.95); x.stroke();
      x.fillStyle = col; x.fillRect(-56 * s, -192 * s, 12 * s, 22 * s); x.lineWidth = 2; x.beginPath(); x.moveTo(-50 * s, -175 * s); x.quadraticCurveTo(-46 * s, -160 * s, -34 * s, -158 * s); x.stroke(); x.fillStyle = col; x.beginPath(); x.arc(-32 * s, -158 * s, 3 * s, 0, TAU); x.fill();
      for (const e of [-1, 1]) { x.fillStyle = col; x.fillRect(e * 14 * s - 4 * s, -184 * s, 8 * s, 3 * s); }
      break;
    case 'han': // 넘긴 머리, 안경, 높은 깃
      x.fillStyle = '#1a1210'; x.beginPath(); x.moveTo(-40 * s, -192 * s); x.quadraticCurveTo(-30 * s, -238 * s, 10 * s, -232 * s); x.quadraticCurveTo(44 * s, -226 * s, 40 * s, -192 * s); x.closePath(); x.fill(); x.stroke();
      x.strokeStyle = col; x.lineWidth = 2; for (const e of [-1, 1]) x.strokeRect(e * 16 * s - 11 * s, -188 * s, 22 * s, 12 * s); x.beginPath(); x.moveTo(-5 * s, -182 * s); x.lineTo(5 * s, -182 * s); x.stroke();
      x.beginPath(); x.moveTo(-50 * s, -110 * s); x.lineTo(-30 * s, -150 * s); x.lineTo(-10 * s, -112 * s); x.moveTo(50 * s, -110 * s); x.lineTo(30 * s, -150 * s); x.lineTo(10 * s, -112 * s); x.stroke();
      x.fillStyle = '#ffb08a'; x.fillRect(-60 * s, -80 * s, 22 * s, 6 * s);
      break;
    case 'siwoo': case 'lightless': // 후드
      x.fillStyle = '#0c0816'; x.beginPath(); x.moveTo(-62 * s, -120 * s); x.quadraticCurveTo(-66 * s, -230 * s, 0, -250 * s); x.quadraticCurveTo(66 * s, -230 * s, 62 * s, -120 * s); x.quadraticCurveTo(0, -150 * s, -62 * s, -120 * s); x.fill(); x.stroke();
      if (who === 'siwoo') { x.fillStyle = '#1a1028'; x.fillRect(-30 * s, -172 * s, 60 * s, 26 * s); for (const e of [-1, 1]) { x.fillStyle = col; x.fillRect(e * 15 * s - 6 * s, -192 * s, 12 * s, 3 * s); } x.fillStyle = col; x.font = `bold ${22 * s}px Orbitron`; x.textAlign = 'center'; x.fillText('07', 0, -60 * s); }
      else glowDot(x, 0, -95 * s, 40 * s, 'rgba(255,170,70,A)', 0.7);
      break;
    case 'seohyun': // 홀로그램
      x.fillStyle = 'rgba(255,244,176,0.12)'; x.beginPath(); x.moveTo(-42 * s, -200 * s); x.quadraticCurveTo(0, -250 * s, 42 * s, -200 * s); x.lineTo(50 * s, -110 * s); x.lineTo(-50 * s, -110 * s); x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,244,176,0.15)'; for (let i = 0; i < 300; i += 6) x.fillRect(-130 * s, -i * s, 260 * s, 1.5);
      break;
  }
  x.restore();
}
function cutPortraitFor(who) {
  if (!cut.por) cut.por = { L: null, R: null };
  if (who === 'narr' || who === 'log' || !CUT_WHO[who]) { cut.por.active = null; return; }
  const side = CUT_RIGHT.has(who) ? 'R' : 'L';
  if (!cut.por[side] || cut.por[side].who !== who) cut.por[side] = { who, t0: performance.now() };
  cut.por.active = side;
}
function drawPortraits(x, W, H, t) {
  const p = cut.por; if (!p) return;
  const h = Math.min(H * 0.42, 300), base = H - H * 0.11 - Math.min(150, H * 0.2);
  for (const side of ['L', 'R']) {
    const q = p[side]; if (!q || cut.scene === 'log') continue;
    const k = clamp((performance.now() - q.t0) / 350, 0, 1), ease = 1 - Math.pow(1 - k, 3);
    const cx = side === 'L' ? W * 0.13 - (1 - ease) * 200 : W * 0.87 + (1 - ease) * 200;
    const active = p.active === side;
    drawBust(x, q.who, cx, base, h * (active ? 1 : 0.92), t, active, active && cut.typing);
  }
}

// ---------- 프레임 ----------
function cutSceneTo(name) { if (!cut.scene) { cut.scene = name; return; } if (name === cut.scene && !cut.pending) return; cut.pending = name; cut.fadeT = cut.fadeMax = name === 'log' || cut.scene === 'log' ? 0.5 : 0.9; }
function drawCutFrame(x, W, H, t, c) {
  const sc = cut.scene || 'corridor';
  if (sc === 'corridor' || !CUT_SCENES[sc]) drawCut(x, W, H, t, c);
  else {
    const z = c.zoom * (1.03 + Math.sin(t * 0.13) * 0.015);
    x.save(); x.translate(W / 2, H / 2); x.scale(z, z); x.translate(-W / 2 + Math.sin(t * 0.11) * 8, -H / 2 + Math.cos(t * 0.09) * 5);
    CUT_SCENES[sc](x, W, H, t, c);
    x.restore();
    cutOverlays(x, W, H, t, c);
  }
  drawPortraits(x, W, H, t);
  if (cut.fadeT > 0) {
    cut.fadeT -= 1 / 60;
    const half = cut.fadeMax / 2;
    if (cut.fadeT <= half && cut.pending) { cut.scene = cut.pending; cut.pending = null; }
    x.fillStyle = `rgba(0,0,0,${clamp(1 - Math.abs(cut.fadeT - half) / half, 0, 1)})`; x.fillRect(0, 0, W, H);
  }
}

// ---------- 무전 대사를 컷씬 대사로 ----------
const WHO_MAP = { '유나': 'yuna', '내레이션': 'narr', '로그': 'log', '마더보드': 'mother', '요원': 'agent', '시우': 'siwoo', '한지석': 'han', '빛 없는 자들': 'lightless', '이서현': 'seohyun' };
function radioToCut(lines, from, to, key, extra) {
  let scene = from, switched = false;
  return lines.map((s, i) => {
    const m = s.match(/^\[([^\]]+)\]\s*(.*)$/);
    const who = m ? (WHO_MAP[m[1]] || 'narr') : 'narr', text = m ? m[2] : s;
    if (!switched && to && key && i > 0 && text.includes(key)) { scene = to; switched = true; }
    const o = { who, text, scene: who === 'log' ? 'log' : (who === 'han' && text.startsWith('「') ? 'broadcast' : scene) };
    if (who === 'mother') { o.fx = 'pulse'; o.set = { eye: 1 }; }
    if (extra && extra[i]) Object.assign(o, extra[i]);
    return o;
  });
}
// 구역 이야기: [시작 장면, 다음 장면, 장면을 바꿀 문구]
const CHAPTER_SCENES = {
  1: [['city', 'junkyard', '압착기'], ['junkyard', 'cryo', '하얀 김'], ['cryo', 'plant', '전력의 심장'], ['plant', 'corridor', '보랏빛 네온']],
  2: [['tracks', null, null], ['tracks', 'sewer', '지하 수로야'], ['sewer', 'market', '다음은 외곽 3구역'], ['market', 'bunker', '벙커는 두 시스템']]
};
function chapterCut(season, zone) {
  const src = season === 2 ? RADIO2 : RADIO, m = CHAPTER_SCENES[season][zone];
  return radioToCut(src[zone], m[0], m[1], m[2]);
}
function showChapter(season, zone, done) {
  const Z = ZONES[zone + (season === 2 ? 4 : 0)];
  showCutscene(chapterCut(season, zone), done, { ch: `${season === 2 ? 'SEASON 2 · ' : ''}CHAPTER ${zone + 1}`, name: Z.name, sub: Z.en, id: (season === 2 ? 's2ch' : 'ch') + zone, titleMs: 2200 });
}
function showS1Ending(done) {
  showCutscene(radioToCut(RADIO_END, 'server', 'city', '가로등', { 0: { set: { eye: 1 } }, 1: { set: { eye: 0.2 } } }), done, { ch: 'EPILOGUE', name: '오버클럭', sub: '서버 정지', id: 'end', titleMs: 2200 });
}

// ---------- 기존 컷씬에 장면 지정 ----------
function applyScenes(arr, map) { for (const k in map) { const v = map[k], l = arr[+k]; if (!l) continue; if (typeof v === 'string') l.scene = v; else { if (v.scene) l.scene = v.scene; if (v.set) l.set = Object.assign({}, l.set || {}, v.set); } } return arr; }
applyScenes(CUT_MOTHER, { 0: 'corridor', 8: 'server' });
applyScenes(CUT_S2_INTRO, { 0: 'tracks', 3: 'command', 11: 'tracks', 14: 'broadcast', 15: { scene: 'server', set: { redeye: 1 } }, 17: { scene: 'tracks', set: { redeye: 0, alert: 0.4 } } });
applyScenes(CUT_SIWOO, { 0: 'market' });
{
  const base = cutSentinel;
  cutSentinel = function () { return applyScenes(base(), { 0: 'bunker', 9: { scene: 'bunker', set: { eye: 1, redeye: 0 } }, 13: { scene: 'bunker', set: { redeye: 1 } } }); };
  const EM = {
    A: { 0: { scene: 'server', set: { eye: 1, redeye: 0 } }, 2: { scene: 'city', set: { power: 1 } }, 6: { scene: 'server', set: { eye: 1.4 } }, 7: { scene: 'city', set: { power: 1, eye: 0 } } },
    B: { 0: 'bunker', 2: { scene: 'bunker', set: { eye: 0 } }, 4: { scene: 'market', set: { power: 0.3 } }, 6: { scene: 'city', set: { power: 0.08, alert: 0 } } },
    C: { 0: 'bunker', 1: { scene: 'server', set: { data: 1, eye: 0.3 } }, 2: 'broadcast', 4: 'bunker', 5: { scene: 'server', set: { eye: 1 } }, 7: 'broadcast', 8: { scene: 'city', set: { power: 0.7, data: 0 } } }
  };
  for (const k in S2_ENDINGS) { const f = S2_ENDINGS[k].lines; S2_ENDINGS[k].lines = () => applyScenes(f(), EM[k]); }
}

// 도감 스토리 탭: 구역 이야기도 컷씬으로 다시 보기
for (const st of STORY) {
  let m = st.id.match(/^(s2)?ch(\d)$/);
  if (m) { const season = m[1] ? 2 : 1, z = +m[2], Z = ZONES[z + (season === 2 ? 4 : 0)]; st.cut = true; st.cutLines = () => chapterCut(season, z); st.cutOpt = { ch: `${season === 2 ? 'SEASON 2 · ' : ''}CHAPTER ${z + 1}`, name: Z.name, sub: Z.en, id: st.id, titleMs: 2200 }; }
  else if (st.id === 'end') { st.cut = true; st.cutLines = () => radioToCut(RADIO_END, 'server', 'city', '가로등', { 0: { set: { eye: 1 } }, 1: { set: { eye: 0.2 } } }); st.cutOpt = { ch: 'EPILOGUE', name: '오버클럭', sub: '서버 정지', id: 'end', titleMs: 2200 }; }
  else if (/^s2end/.test(st.id)) { const k = st.id.slice(-1); st.cut = true; st.cutLines = () => S2_ENDINGS[k].lines(); st.cutOpt = { ch: 'ENDING ' + k, name: S2_ENDINGS[k].name, sub: S2_ENDINGS[k].sub, id: st.id }; }
}
