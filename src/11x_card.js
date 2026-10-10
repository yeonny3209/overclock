// ================= 기록 카드 (이벤트 인증용) =================
// 결과 화면의 [기록 카드 저장]: 기록을 이미지로 만들고, 기록 값에서 계산한 인증 코드를 함께 새긴다.
function cardHash(str, seed) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}
function cardCode(data) {
  const a = cardHash(data + '|overclock-card', 2166136261).toString(16).toUpperCase().padStart(8, '0');
  const b = cardHash(data + '|signal', 40503).toString(16).toUpperCase().padStart(8, '0');
  return `OC-${a.slice(0, 4)}-${a.slice(4)}-${b.slice(0, 4)}`;
}
// 운영자용: 카드에 적힌 데이터 문자열과 코드가 맞는지 확인한다. (콘솔에서 verifyCard('데이터','코드'))
function verifyCard(data, code) { return cardCode(data) === code; }

function saveRecordCard() {
  if (!run) return;
  const d = new Date(), p2 = n => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
  const sec = Math.floor(run.time), tm = `${Math.floor(sec / 60)}:${p2(sec % 60)}`;
  const modeName = run.mode === 'arena' ? '무한 아레나' : run.mode === 'daily' ? '일일 도전' : run.mode === 'season3' ? '시즌 3' : run.mode === 'season2' ? '시즌 2' : '캠페인';
  const wave = run.arenaWave || 0;
  const main = run.mode === 'arena' ? { big: String(wave), unit: 'WAVE', label: '돌파한 웨이브' } : { big: String(run.zone + 1), unit: 'ZONE', label: '도달한 구역' };
  const data = [run.mode, wave, sec, run.kills, run.maxCombo, run.char, run.hard ? 1 : 0, run.oc || 0, stamp.slice(0, 10)].join('|');
  const code = cardCode(data);
  const W = 900, H = 1200, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const F = "'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif";
  const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0b0718'); bg.addColorStop(0.55, '#1a0f33'); bg.addColorStop(1, '#07050f');
  x.fillStyle = bg; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(41,240,255,0.10)'; x.lineWidth = 1;
  for (let i = 0; i <= W; i += 45) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
  for (let j = 0; j <= H; j += 45) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); }
  const glow = (cx, cy, r, c) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); };
  glow(W * 0.8, 150, 380, 'rgba(255,61,240,0.25)'); glow(W * 0.15, 520, 380, 'rgba(41,240,255,0.16)');
  x.strokeStyle = '#29f0ff'; x.lineWidth = 4; x.shadowColor = '#29f0ff'; x.shadowBlur = 18; x.strokeRect(24, 24, W - 48, H - 48); x.shadowBlur = 0;
  x.strokeStyle = '#ff3df0'; x.lineWidth = 1.5; x.strokeRect(40, 40, W - 80, H - 80);
  const text = (s, px, py, size, color, weight = '700', align = 'left', glowC) => { x.font = `${weight} ${size}px ${F}`; x.textAlign = align; x.fillStyle = color; if (glowC) { x.shadowColor = glowC; x.shadowBlur = 20; } x.fillText(s, px, py); x.shadowBlur = 0; };
  text('OVERCLOCK', W / 2, 120, 64, '#ffffff', '900', 'center', '#29f0ff');
  text('기록 카드 · RECORD CARD', W / 2, 168, 26, '#ff3df0', '700', 'center');
  text(`${modeName}${run.hard ? ' · 하드' : ''}${run.oc ? ` · 오버클럭 ${run.oc}` : ''}`, W / 2, 226, 30, '#cfd6ff', '700', 'center');
  x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(80, 258, W - 160, 300); x.strokeStyle = 'rgba(255,225,77,0.5)'; x.lineWidth = 2; x.strokeRect(80, 258, W - 160, 300);
  text(main.label, W / 2, 304, 28, '#ffe14d', '700', 'center');
  text(main.big, W / 2, 484, main.big.length > 3 ? 150 : 190, '#ffe14d', '900', 'center', '#ff9f1a');
  text(main.unit, W / 2, 536, 30, '#ffffff', '700', 'center');
  const rows = [['요원', CHARS[run.char].name], ['플레이 시간', tm], ['처치 수', String(run.kills)], ['최고 콤보', String(run.maxCombo)], ['보스 처치', String(run.bossesKilled)], ['속성 반응', String(run.reactions)]];
  let y = 628;
  for (const [k, v] of rows) { text(k, 100, y, 30, '#8a90b0', '500'); text(v, W - 100, y, 34, '#ffffff', '700', 'right'); x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(100, y + 14, W - 200, 1); y += 62; }
  const names = run.weapons.map(w => (WEAPONS[w.id] ? WEAPONS[w.id].name : w.id) + (w.grade === 2 ? '★' : w.grade === 1 ? '+' : ''));
  text('장비', 100, y + 4, 30, '#8a90b0', '500');
  let wy = y + 4; const maxW = W - 330; let line = '';
  const lines = []; for (const n of names) { const t = line ? line + ' · ' + n : n; x.font = `700 28px ${F}`; if (x.measureText(t).width > maxW && line) { lines.push(line); line = n; } else line = t; } if (line) lines.push(line);
  for (const l of lines.slice(0, 2)) { text(l, W - 100, wy, 28, '#29f0ff', '700', 'right'); wy += 38; }
  text(stamp, W / 2, 1036, 26, '#8a90b0', '500', 'center');
  x.fillStyle = 'rgba(41,240,255,0.08)'; x.fillRect(80, 1056, W - 160, 70); x.strokeStyle = 'rgba(41,240,255,0.6)'; x.lineWidth = 1.5; x.strokeRect(80, 1056, W - 160, 70);
  text('인증 코드', 104, 1100, 22, '#8a90b0', '500');
  text(code, W - 104, 1102, 34, '#6dff8a', '900', 'right', '#6dff8a');
  text(data, W / 2, 1150, 16, '#5a5f80', '400', 'center');
  text('yeonny3209.github.io/overclock', W / 2, 1172, 18, '#5a5f80', '500', 'center');

  const url = cv.toDataURL('image/png');
  const old = document.getElementById('cardOv'); if (old) old.remove();
  const ov = document.createElement('div'); ov.id = 'cardOv';
  ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(4,2,10,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:12px;overflow:auto';
  const fname = `overclock-record-${stamp.slice(0, 10)}-${code.slice(3, 7)}.png`;
  ov.innerHTML = `<img src="${url}" alt="기록 카드" style="max-width:min(92vw,520px);max-height:72vh;border-radius:8px;box-shadow:0 0 30px #29f0ff66">
    <div style="color:#cfd6ff;font:14px sans-serif;text-align:center">이미지를 길게 눌러 저장하거나 아래 버튼을 누르세요.</div>
    <div style="display:flex;gap:10px"><a class="btn ye" id="cardDl" download="${fname}" href="${url}" style="text-decoration:none">이미지 저장</a><button class="btn" id="cardCl">닫기</button></div>`;
  document.body.appendChild(ov);
  ov.querySelector('#cardCl').onclick = () => ov.remove();
  return code;
}
