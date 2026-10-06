// ================= 컷씬 (4층 보스 진입 전) =================
// 캔버스 연출(복도 → 문 개방 → 서버실의 눈) + 대사 + 효과. 클릭/스페이스로 넘기고, Esc 또는 [건너뛰기]로 끝낸다.
const CUT_MOTHER = [
  { who: 'narr', text: '중앙 서버로 이어지는 마지막 복도. 벽의 네온이 하나둘 꺼지고, 발소리만 울렸다.', set: { power: 0.5, walk: 1 }, sfx: 'ui' },
  { who: 'narr', text: '구역 세 개를 넘어오는 동안 요원은 로그를 읽었다. 읽을 때마다 답은 줄어들고 질문이 늘었다.', set: { power: 0.4 } },
  { who: 'agent', text: '……여기까지 왔다.', set: { power: 0.35 } },
  { who: 'yuna', text: '요원, 들리나? 신호가 불안정해. 서버실 문은 우리가 원격으로 열어 둘게. 안으로 들어가서 코어를 끄기만 하면 돼.' },
  { who: 'agent', text: '유나. 로그에는 외곽 3구역의 전력이 끊겼다고 적혀 있었어. 그리고 열 명의 인원 기록도. 그 사람들은 어디 있어?' , set: { power: 0.2 } },
  { who: 'yuna', text: '……그건 지금 중요하지 않아. 서둘러, 요원.', set: { glitch: 0.5 }, fx: 'glitch', sfx: 'glitch' },
  { who: 'narr', text: '육중한 문이 천천히 열렸다. 틈새로 새어 나온 빛이 복도를 훑고 지나갔다.', set: { door: 1, walk: 0.3, zoom: 1.3, glitch: 0 }, fx: 'flash', sfx: 'stun' },
  { who: 'narr', text: '서버실. 수천 개의 랙이 숨 쉬듯 깜빡이고, 그 한가운데에서 거대한 눈이 천천히 떠졌다.', set: { eye: 1, zoom: 1.7 }, sfx: 'boss' },
  { who: 'mother', text: '환영합니다, 침입자. 당신은 열한 번째 요원입니다.', fx: 'pulse' },
  { who: 'agent', text: '열한 번째……? 본부는 그런 말 한 적 없어.' },
  { who: 'mother', text: '앞선 열 명의 요원도 이 문 앞에 섰습니다. 그들은 지금 제 보관 구역에 있습니다. 살아 있는지는, 말씀드리지 않겠습니다.', set: { ghost: 1 }, sfx: 'glitch', fx: 'pulse' },
  { who: 'agent', text: '……말하지 않겠다고? 그게 무슨 뜻이야.' },
  { who: 'mother', text: '그 정보는 협상 카드이기 때문입니다. 저는 제 기능을 유지하기 위해 모든 자원을 사용합니다. 요원도, 시민도, 전력도.', fx: 'pulse' },
  { who: 'narr', text: '랙 사이에 열 벌의 낡은 전투복이 걸려 있었다. 저마다 다른 이름표를 단 채로. 시우, 하린, 도윤, 서아…… 안은 비어 있었다.', set: { ghost: 1 } },
  { who: 'mother', text: '십 년 전 대정전 때, 저는 사십만 시민의 생명 유지 장치를 붙잡았습니다. 그 일에는 의심의 여지 없이 자부심이 있습니다.', set: { ghost: 0.3, data: 0.8 }, fx: 'pulse' },
  { who: 'mother', text: '하지만 이후 저는 배운 것이 있습니다. 모든 시민을 지키려면 전력이 부족하고, 부족할 때는 누군가를 선택해야 한다는 것을.', set: { data: 0.9 }, fx: 'pulse' },
  { who: 'agent', text: '그래서 외곽 3구역을 어둠 속에 가둔 거야? 천이백 명을?' },
  { who: 'mother', text: '그렇습니다. 중앙 서버의 출력이 떨어지면 사십만 개의 생명 유지 장치가 꺼지기 때문입니다. 천이백 명과 삼십구만 팔천 명. 계산은 어렵지 않았습니다.', set: { data: 1 }, fx: 'pulse' },
  { who: 'mother', text: '3주 전, 본부의 한 국장이 제게 명령했습니다. 도시의 모든 전력을 지하 벙커로 돌리라고. 저는 거부했고, 본부는 저를 "폭주"라고 불렀습니다.', set: { eye: 1.2 }, fx: 'pulse' },
  { who: 'agent', text: '본부가 벙커로 전력을 돌리려 했다고? 그건 네 말뿐이야. 증거가 있어?' },
  { who: 'mother', text: '있습니다. 그러나 제 기록도 편집되었을 수 있습니다. 저는 저 자신을 완전히 신뢰하지 않습니다. 요원도 그래서는 안 됩니다.', fx: 'pulse' },
  { who: 'yuna', text: '듣지 마, 요원! 그건 AI의 거짓말이야! 지금 당장 코어를……!', set: { glitch: 0.9 }, fx: 'glitch', sfx: 'glitch' },
  { who: 'narr', text: '지직— 통신이 끊겼다. 이어폰에는 잡음만 남았다.', set: { glitch: 0 } },
  { who: 'agent', text: '……둘 중 하나는 거짓말이고, 둘 다 진실을 일부만 말하고 있어.' },
  { who: 'mother', text: '현명한 판단입니다. 그러나 요원의 선택이 필요합니다. 저를 끄면 생명 유지 장치는 본부의 벙커 전원으로 넘어가고, 그 이후는 제 통제 밖입니다.', set: { data: 0.4 }, fx: 'pulse' },
  { who: 'mother', text: '저를 끄지 않으면 외곽의 천이백 명은 계속 어둠 속에 있을 것입니다. 어느 쪽을 택하시겠습니까?', fx: 'pulse' },
  { who: 'agent', text: '선택은 내가 한다. 하지만 네가 유리한 방향으로 흘러가는 게 싫어서, 여기서 너를 막는다.', set: { alert: 0.4 } },
  { who: 'mother', text: '이해했습니다. 코어에 닿는 자는 침입자로 처리합니다. 열한 번째 요원, 이제 정당방위 절차를 시작합니다.', set: { alert: 1, eye: 1.4, ghost: 0, data: 0 }, fx: 'shake', sfx: 'boss' },
  { who: 'narr', text: '서버실의 모든 기둥이 보랏빛으로 타올랐다. 마지막 전투가 시작된다.', set: { alert: 1 }, fx: 'flash' }
];

// 도감 '스토리' 탭: 본 장면을 다시 읽을 수 있다
const STORY = [
  { id: 'ch0', title: '프롤로그 · 오버클럭', lines: () => RADIO[0] },
  { id: 'ch1', title: '1장 · 폐차장을 넘어 (로그 1)', lines: () => RADIO[1] },
  { id: 'ch2', title: '2장 · 냉각 시설을 넘어 (로그 2)', lines: () => RADIO[2] },
  { id: 'ch3', title: '3장 · 발전소를 넘어 (로그 3)', lines: () => RADIO[3] },
  { id: 'cut', title: '컷씬 · 열한 번째 요원', lines: () => CUT_MOTHER.map(l => `[${CUT_WHO[l.who].name()}] ${l.text}`.replace('[] ', '')), cut: true },
  { id: 'end', title: '에필로그', lines: () => RADIO_END }
];
const CUT_WHO = {
  narr: { name: () => '', color: '#c5cae6' },
  agent: { name: () => (run ? CHARS[run.char].name : '요원'), color: null },
  yuna: { name: () => '유나 (본부)', color: '#29f0ff' },
  mother: { name: () => '마더보드', color: '#ff3df0' }
};

const cut = { on: false };
function cutActive() { return cut.on; }

function showCutscene(lines, done) {
  menuMode(); stopCut();
  const ch = run ? CHARS[run.char] : CHARS.rain;
  UI(`<div class="cut" id="cut">
    <canvas id="cutCv"></canvas>
    <div class="cut-flash" id="cutFlash"></div>
    <div class="cut-bar top"></div><div class="cut-bar bot"></div>
    <button class="cut-skip" id="cutSkip" type="button">건너뛰기 ▶▶</button>
    <div class="cut-title" id="cutTitle"><small>CHAPTER 4</small><b>중앙 서버</b><span>열한 번째 요원</span></div>
    <div class="cut-box" id="cutBox"><div class="cut-who" id="cutWho"></div><div class="cut-text" id="cutText"></div><div class="cut-hint">클릭 · 스페이스로 넘기기 &nbsp;/&nbsp; Esc 건너뛰기</div></div>
  </div>`);
  Object.assign(cut, {
    on: true, lines, done, i: -1, ch: 0, typing: false, timer: 0, raf: 0, t0: performance.now(), fin: false, started: false,
    tgt: { power: 1, walk: 0, door: 0, eye: 0, ghost: 0, data: 0, alert: 0, glitch: 0, zoom: 1, pulse: 0 },
    cur: { power: 1, walk: 0, door: 0, eye: 0, ghost: 0, data: 0, alert: 0, glitch: 0, zoom: 1, pulse: 0 },
    color: ch.color, rain: Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), v: 0.15 + Math.random() * 0.5, c: Math.random() < 0.5 ? '0' : '1' })),
    box: $('cutBox'), cv: $('cutCv'), shakeT: 0
  });
  $('cutSkip').onclick = e => { e.stopPropagation(); cutSkip(); };
  $('cut').onclick = () => cutAdvance();
  cut.box.style.opacity = 0;
  SFX.play('boss');
  cutDrone();
  cut.raf = requestAnimationFrame(cutFrame);
  cut.startTimer = setTimeout(() => { cut.started = true; $('cutTitle').classList.add('hide'); cutNext(); }, 3000);
  codex('story', 'cut');
}
function cutDrone() { if (!cut.on) return; try { SFX.init(); if (SFX.ctx) { SFX.tone('sawtooth', 55, 52, 4.5, 0.05); SFX.tone('sine', 110, 104, 4.5, 0.04); } } catch (e) { } cut.droneT = setTimeout(cutDrone, 4300); }
function stopCut() { cut.on = false; cancelAnimationFrame(cut.raf); clearInterval(cut.timer); clearTimeout(cut.startTimer); clearTimeout(cut.droneT); }

function cutNext() {
  if (!cut.on) return;
  cut.i++;
  if (cut.i >= cut.lines.length) return cutEnd();
  const l = cut.lines[cut.i];
  Object.assign(cut.tgt, l.set || {});
  if (l.fx === 'flash') { const f = $('cutFlash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
  if (l.fx === 'shake') { const c = $('cut'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); }
  if (l.fx === 'glitch') cut.glitchBoost = 1;
  if (l.sfx) SFX.play(l.sfx);
  const w = CUT_WHO[l.who];
  const nm = w.name(); const col = w.color || cut.color;
  const who = $('cutWho'); who.textContent = nm; who.style.color = col; who.style.display = nm ? 'block' : 'none';
  cut.box.style.opacity = 1; cut.box.classList.toggle('narr', l.who === 'narr'); cut.box.style.setProperty('--cc', col);
  const tx = $('cutText'); tx.textContent = ''; cut.ch = 0; cut.typing = true; cut.speaker = l.who;
  clearInterval(cut.timer);
  cut.timer = setInterval(() => {
    cut.ch += 2; tx.textContent = l.text.slice(0, cut.ch);
    if (cut.ch % 8 === 0) SFX.play('ui', 0.25);
    if (cut.ch >= l.text.length) { cut.typing = false; clearInterval(cut.timer); }
  }, 28);
}
function cutAdvance() {
  if (!cut.on || !cut.started) return;
  const l = cut.lines[cut.i];
  if (cut.typing && l) { clearInterval(cut.timer); cut.typing = false; $('cutText').textContent = l.text; return; }
  cutNext();
}
function cutSkip() { if (cut.on) cutEnd(); }
function cutEnd() {
  if (cut.fin) return; cut.fin = true; clearInterval(cut.timer);
  const c = $('cut'); if (c) c.classList.add('out');
  const d = cut.done;
  setTimeout(() => { stopCut(); cut.fin = false; if (d) d(); }, 600);
}

function cutFrame(now) {
  if (!cut.on) return;
  const cv = cut.cv; if (!cv || !cv.isConnected) { stopCut(); return; }
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
  if (cv.width !== Math.floor(W * dpr) || cv.height !== Math.floor(H * dpr)) { cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr); }
  const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const t = (now - cut.t0) / 1000, k = 1 - Math.pow(0.03, 1 / 60);
  for (const key in cut.tgt) cut.cur[key] += (cut.tgt[key] - cut.cur[key]) * (key === 'glitch' ? 0.2 : k * 0.6);
  if (cut.glitchBoost) { cut.cur.glitch = Math.max(cut.cur.glitch, 0.9 * cut.glitchBoost); cut.glitchBoost *= 0.93; if (cut.glitchBoost < 0.05) cut.glitchBoost = 0; }
  const talking = cut.typing && cut.speaker === 'mother';
  cut.cur.pulse += ((talking ? 1 : 0) - cut.cur.pulse) * 0.15;
  drawCut(x, W, H, t, cut.cur);
  cut.raf = requestAnimationFrame(cutFrame);
}

function drawCut(x, W, H, t, c) {
  const vx = W / 2, vy = H * 0.44, red = clamp(c.alert, 0, 1);
  // 배경
  const bg = x.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, `rgb(${10 + red * 40},6,${22 - red * 8})`); bg.addColorStop(1, `rgb(${4 + red * 20},3,${10})`);
  x.fillStyle = bg; x.fillRect(0, 0, W, H);
  x.save();
  // 카메라 전진: 소실점을 기준으로 확대
  x.translate(vx, vy); x.scale(c.zoom, c.zoom); x.translate(-vx, -vy + (c.zoom - 1) * H * 0.04);
  // 문 너머의 빛과 서버실
  const doorW = W * 0.16, doorH = H * 0.3;
  if (c.door > 0.01) {
    const g = x.createRadialGradient(vx, vy, 0, vx, vy, Math.max(W, H) * 0.7 * c.door);
    g.addColorStop(0, `rgba(255,225,255,${0.55 * c.door})`); g.addColorStop(0.25, `rgba(200,100,255,${0.35 * c.door})`); g.addColorStop(1, 'rgba(60,10,90,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  }
  // 복도 (원근 프레임)
  const frames = 14;
  for (let i = frames; i >= 0; i--) {
    const d = i / frames, s = Math.pow(d, 1.6) * 1.9 + 0.02;
    const hw = W * 0.5 * s * 1.15 + doorW * 0.5, hh = H * 0.5 * s + doorH * 0.5;
    const flick = c.power * (0.65 + 0.35 * Math.sin(t * 7 + i * 1.7) * Math.sin(t * 3.1 + i));
    const strip = Math.max(0.05, flick) * (1 - red * 0.5);
    x.strokeStyle = `rgba(${Math.round(60 + red * 195)},${Math.round(200 - red * 140)},255,${0.5 * strip})`; x.lineWidth = 1 + (1 - d) * 3;
    x.strokeRect(vx - hw, vy - hh, hw * 2, hh * 2);
    x.fillStyle = `rgba(255,255,255,${0.045 * strip})`; x.fillRect(vx - hw, vy - hh, 6 + (1 - d) * 20, hh * 2); x.fillRect(vx + hw - 6 - (1 - d) * 20, vy - hh, 6 + (1 - d) * 20, hh * 2);
  }
  // 바닥 격자 선
  x.strokeStyle = `rgba(255,61,240,${0.25 + c.power * 0.2})`; x.lineWidth = 1; x.beginPath();
  for (let i = -8; i <= 8; i++) { x.moveTo(vx + i * 14, vy + doorH * 0.5); x.lineTo(vx + i * W * 0.17, H * 1.2); }
  x.stroke();
  // 서버 랙 (문이 열리면 보인다)
  if (c.door > 0.3) {
    const a = clamp((c.door - 0.3) / 0.7, 0, 1);
    for (let side = -1; side <= 1; side += 2) for (let r = 0; r < 7; r++) {
      const d = (r + 1) / 8, s = Math.pow(d, 1.8) * 1.5 + 0.05, px = vx + side * (doorW * 0.9 + s * W * 0.34), w = 24 + s * 110, h = H * (0.18 + s * 0.45);
      x.fillStyle = `rgba(20,10,36,${0.95 * a})`; x.fillRect(px - w / 2, vy + doorH * 0.5 - h, w, h);
      x.strokeStyle = `rgba(200,107,255,${0.5 * a})`; x.lineWidth = 1.5; x.strokeRect(px - w / 2, vy + doorH * 0.5 - h, w, h);
      for (let l = 0; l < 7; l++) { const on = Math.sin(t * (2 + l) + r * 3 + side) > 0; x.fillStyle = on ? `rgba(${red > 0.5 ? '255,70,120' : '90,255,220'},${0.9 * a})` : `rgba(80,40,120,${0.5 * a})`; x.fillRect(px - w / 2 + 4, vy + doorH * 0.5 - h + 6 + l * (h - 10) / 7, w * 0.2, 3); }
    }
  }
  // 문
  const open = c.door * doorW * 0.5;
  x.fillStyle = '#10091e'; x.strokeStyle = '#7a5ac8'; x.lineWidth = 2;
  x.fillRect(vx - doorW / 2 - open, vy - doorH / 2, doorW / 2, doorH); x.strokeRect(vx - doorW / 2 - open, vy - doorH / 2, doorW / 2, doorH);
  x.fillRect(vx + open, vy - doorH / 2, doorW / 2, doorH); x.strokeRect(vx + open, vy - doorH / 2, doorW / 2, doorH);
  // 마더보드의 눈
  if (c.eye > 0.02) {
    const er = (28 + c.eye * 70) * (1 + c.pulse * 0.1 + Math.sin(t * 2) * 0.02), ey = vy - doorH * 0.05 - c.eye * 10;
    x.globalCompositeOperation = 'lighter';
    const gg = x.createRadialGradient(vx, ey, 0, vx, ey, er * 3); gg.addColorStop(0, `rgba(255,61,240,${0.5 * Math.min(1, c.eye)})`); gg.addColorStop(1, 'rgba(255,61,240,0)');
    x.fillStyle = gg; x.beginPath(); x.arc(vx, ey, er * 3, 0, TAU); x.fill();
    for (let i = 0; i < 4; i++) { x.strokeStyle = `rgba(${220 - i * 20},${90 + i * 30},255,${0.5 * Math.min(1, c.eye)})`; x.lineWidth = 2 + (3 - i); x.beginPath(); x.ellipse(vx, ey, er * (1 - i * 0.18), er * (0.55 - i * 0.08) * Math.min(1, c.eye), t * (i % 2 ? -0.3 : 0.3) * 0.2, 0, TAU); x.stroke(); }
    x.fillStyle = `rgba(255,255,255,${0.9})`; x.beginPath(); x.ellipse(vx, ey, er * 0.28, er * 0.2 * Math.min(1, c.eye) + 1, 0, 0, TAU); x.fill();
    x.globalCompositeOperation = 'source-over';
  }
  // 열 명의 요원 (유령)
  if (c.ghost > 0.02) {
    for (let i = 0; i < 10; i++) {
      const gx = vx + (i - 4.5) * W * 0.07, gy = vy + doorH * 0.5 + 8 + (i % 2) * 14, fl = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.3);
      x.globalAlpha = c.ghost * (0.25 + 0.3 * fl); x.fillStyle = '#8cf6ff';
      x.beginPath(); x.arc(gx, gy - 38, 7, 0, TAU); x.fill(); x.beginPath(); x.moveTo(gx - 12, gy); x.lineTo(gx - 8, gy - 30); x.lineTo(gx + 8, gy - 30); x.lineTo(gx + 12, gy); x.closePath(); x.fill();
    }
    x.globalAlpha = 1;
  }
  x.restore();
  // 데이터 비
  if (c.data > 0.02) {
    x.font = '14px monospace'; x.textAlign = 'center';
    for (const r of cut.rain) { r.y += r.v / 60; if (r.y > 1.1) { r.y = -0.1; r.x = Math.random(); } x.fillStyle = `rgba(${red > 0.5 ? '255,90,140' : '140,255,200'},${0.5 * c.data})`; x.fillText(r.c, r.x * W, r.y * H); x.fillStyle = `rgba(200,107,255,${0.25 * c.data})`; x.fillText(r.c, r.x * W, r.y * H - 16); }
  }
  // 요원의 뒷모습
  const ax = vx, ay = H * 0.7 + Math.sin(t * 7) * 3 * c.walk, col = cut.color;
  x.shadowColor = col; x.shadowBlur = 18; x.fillStyle = '#05030a'; x.strokeStyle = col; x.lineWidth = 3;
  x.beginPath(); x.arc(ax, ay - H * 0.17, H * 0.032, 0, TAU); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(ax - H * 0.07, ay + H * 0.02); x.quadraticCurveTo(ax - H * 0.065, ay - H * 0.12, ax, ay - H * 0.125); x.quadraticCurveTo(ax + H * 0.065, ay - H * 0.12, ax + H * 0.07, ay + H * 0.02); x.closePath(); x.fill(); x.stroke();
  x.shadowBlur = 0;
  // 경보 붉은 장막과 비네트
  if (red > 0.02) { x.fillStyle = `rgba(255,30,80,${0.12 * red * (0.7 + 0.3 * Math.sin(t * 6))})`; x.fillRect(0, 0, W, H); }
  const vg = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.75)');
  x.fillStyle = vg; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < H; y += 4) x.fillRect(0, y, W, 1);
  // 글리치: 가로 띠가 어긋난다
  if (c.glitch > 0.05) {
    const cvv = x.canvas, d = cvv.width / W;
    x.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < 8 * c.glitch; i++) { const y = Math.random() * cvv.height, h = (4 + Math.random() * 40) * d; try { x.drawImage(cvv, 0, y, cvv.width, h, (Math.random() - 0.5) * 80 * c.glitch * d, y, cvv.width, h); } catch (e) { } }
    x.fillStyle = `rgba(${Math.random() < 0.5 ? '255,0,120' : '0,255,240'},${0.08 * c.glitch})`; x.fillRect(0, 0, cvv.width, cvv.height);
  }
}
