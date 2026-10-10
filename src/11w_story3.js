// ================= 시즌 3 스토리: 아웃랜드 =================
// 규칙은 같다: 누가 옳은지 끝까지 정하지 않는다.
// 연합은 대륙에 불을 켜려 하지만 일곱 AI를 하나로 합친다. 상단은 자유롭지만 이익을 따진다. 야생 기계는 자각했지만 인간을 믿지 않는다.
// 대정전은 이서현을 포함한 일곱 책임자의 「프로메테우스 연동 시험」이 원인이었다.
Object.assign(CUT_WHO, {
  harin: { name: () => '하린 (요원 04)', color: '#8fe8ff' },
  ian: { name: () => '이안 (연합 사절)', color: '#f0e4ff' },
  kaira: { name: () => '카이라 (상단 대장)', color: '#ffb347' },
  echo9: { name: () => '에코-9 (야생 기계)', color: '#6aff9a' },
  council: { name: () => '메리디안', color: '#e8dcff' }
});
Object.assign(WHO_MAP, { '하린': 'harin', '이안': 'ian', '카이라': 'kaira', '에코-9': 'echo9', '메리디안': 'council' });
for (const k of ['ian', 'kaira', 'echo9', 'council']) CUT_RIGHT.add(k);

// ---------- 새 장면 4종 ----------
CUT_SCENES.wall = function (x, W, H, t, c) {
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#04070c'); g.addColorStop(0.7, '#14202c'); g.addColorStop(1, '#070a10'); x.fillStyle = g; x.fillRect(-W, -H, W * 3, H * 3);
  for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(200,220,255,0.5)'; x.fillRect((i * 137) % W, (i * 71) % (H * 0.4), 1.5, 1.5); }
  const wy = H * 0.62; x.fillStyle = '#0c141c'; x.fillRect(-W, wy, W * 3, H); x.strokeStyle = 'rgba(120,170,210,0.35)'; x.lineWidth = 2; x.strokeRect(-W, wy, W * 3, H);
  for (let i = 0; i < 14; i++) { const bx = i * W / 10 - 30; x.strokeStyle = 'rgba(120,170,210,0.18)'; x.beginPath(); x.moveTo(bx, wy); x.lineTo(bx, H); x.stroke(); }
  for (const k of [0.18, 0.5, 0.82]) { const tx = W * k; x.fillStyle = '#0a1118'; x.fillRect(tx - 28, wy - 120, 56, 120); x.strokeStyle = 'rgba(140,190,230,0.5)'; x.strokeRect(tx - 28, wy - 120, 56, 120); x.fillStyle = 'rgba(255,200,120,0.6)'; x.fillRect(tx - 14, wy - 100, 28, 12);
    const a = Math.PI * 0.5 + Math.sin(t * 0.6 + k * 9) * 0.6; x.fillStyle = 'rgba(210,235,255,0.09)'; x.beginPath(); x.moveTo(tx, wy - 90); x.lineTo(tx + Math.cos(a - 0.16) * H * 1.1, wy - 90 + Math.sin(a - 0.16) * H * 1.1); x.lineTo(tx + Math.cos(a + 0.16) * H * 1.1, wy - 90 + Math.sin(a + 0.16) * H * 1.1); x.fill(); }
  const gx = W / 2; x.fillStyle = '#05080c'; x.fillRect(gx - 70, wy + 10, 140, H); x.strokeStyle = '#7fb0d0'; x.lineWidth = 3; x.strokeRect(gx - 70, wy + 10, 140, H);
  glowDot(x, gx, wy + 60, 40, 'rgba(255,60,60,A)', 0.5 + Math.sin(t * 5) * 0.3);
};
CUT_SCENES.wasteland = function (x, W, H, t, c) {
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1608'); g.addColorStop(0.55, '#c8782a'); g.addColorStop(1, '#2a1608'); x.fillStyle = g; x.fillRect(-W, -H, W * 3, H * 3);
  glowDot(x, W * 0.7, H * 0.4, H * 0.28, 'rgba(255,220,140,A)', 0.8); x.fillStyle = '#ffe4a0'; x.beginPath(); x.arc(W * 0.7, H * 0.4, H * 0.07, 0, TAU); x.fill();
  for (let d = 0; d < 3; d++) { x.fillStyle = ['#7a4a1c', '#4a2c10', '#241408'][d]; x.beginPath(); x.moveTo(-W, H); for (let i = -2; i <= 12; i++) x.lineTo(i * W / 10, H * (0.58 + d * 0.08) - Math.sin(i * 1.3 + d * 2 + t * 0.03) * H * 0.04); x.lineTo(W * 2, H); x.fill(); }
  x.strokeStyle = 'rgba(40,24,10,0.9)'; x.lineWidth = 3; x.beginPath(); x.moveTo(W * 0.5, H * 0.6); x.lineTo(W * 0.1, H); x.moveTo(W * 0.5, H * 0.6); x.lineTo(W * 0.9, H); x.stroke();
  x.strokeStyle = 'rgba(255,220,150,0.5)'; x.setLineDash([14, 22]); x.lineDashOffset = -t * 40; x.beginPath(); x.moveTo(W * 0.5, H * 0.6); x.lineTo(W * 0.5, H); x.stroke(); x.setLineDash([]);
  x.fillStyle = '#120a04'; for (const k of [0.2, 0.78]) { x.fillRect(W * k, H * 0.74, 90, 26); x.fillRect(W * k + 14, H * 0.74 - 16, 50, 18); }
  x.fillStyle = 'rgba(255,210,140,0.5)'; for (let i = 0; i < 60; i++) x.fillRect(((i * 61 + t * 200) % (W + 100)) - 50, (i * 47) % H, 2, 1);
};
CUT_SCENES.antenna = function (x, W, H, t, c) {
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#02060c'); g.addColorStop(0.6, '#0e2a3c'); g.addColorStop(1, '#04101a'); x.fillStyle = g; x.fillRect(-W, -H, W * 3, H * 3);
  for (let i = 0; i < 6; i++) glowDot(x, ((i * 0.23 + t * 0.01) % 1.3) * W, H * (0.1 + (i % 3) * 0.08), H * 0.3, 'rgba(120,70,200,A)', 0.12);
  const fl = Math.sin(t * 0.9) > 0.94 ? 0.5 : 0; if (fl) { x.fillStyle = `rgba(200,240,255,${fl})`; x.fillRect(-W, -H, W * 3, H * 3); }
  for (let i = 0; i < 14; i++) { const ax = (i + 0.5) * W / 13, ah = H * (0.35 + ((i * 37) % 10) / 30), ay = H * 0.86; x.strokeStyle = 'rgba(100,180,210,0.7)'; x.lineWidth = 2 + (i % 3); x.beginPath(); x.moveTo(ax, ay); x.lineTo(ax, ay - ah); x.moveTo(ax - 14, ay - ah * 0.7); x.lineTo(ax + 14, ay - ah * 0.7); x.moveTo(ax - 9, ay - ah * 0.85); x.lineTo(ax + 9, ay - ah * 0.85); x.stroke(); glowDot(x, ax, ay - ah, 12, Math.sin(t * 3 + i) > 0 ? 'rgba(255,60,60,A)' : 'rgba(80,20,20,A)', 0.9); }
  x.fillStyle = '#02060a'; x.fillRect(-W, H * 0.86, W * 3, H);
  x.strokeStyle = 'rgba(200,245,255,0.5)'; x.lineWidth = 1; x.beginPath(); for (let i = 0; i < 70; i++) { const rx = ((i * 97 + t * 500) % (W + 200)) - 100, ry = ((i * 53 + t * 900) % (H + 100)) - 50; x.moveTo(rx, ry); x.lineTo(rx - 4, ry + 16); } x.stroke();
};
CUT_SCENES.spire = function (x, W, H, t, c) {
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05030e'); g.addColorStop(0.7, '#241448'); g.addColorStop(1, '#06030c'); x.fillStyle = g; x.fillRect(-W, -H, W * 3, H * 3);
  for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(230,225,255,${0.3 + 0.4 * Math.sin(t + i)})`; x.fillRect((i * 151) % W, (i * 67) % (H * 0.7), 1.5, 1.5); }
  const cx = W / 2, top = H * 0.06, base = H * 0.88;
  glowDot(x, cx, H * 0.3, H * 0.5, 'rgba(210,190,255,A)', 0.2);
  x.fillStyle = '#120a26'; x.beginPath(); x.moveTo(cx - 80, base); x.lineTo(cx - 14, top + 40); x.lineTo(cx, top); x.lineTo(cx + 14, top + 40); x.lineTo(cx + 80, base); x.closePath(); x.fill(); x.strokeStyle = 'rgba(232,220,255,0.7)'; x.lineWidth = 2; x.stroke();
  for (let i = 1; i < 12; i++) { const y = top + (base - top) * i / 12, w = 14 + (80 - 14) * i / 12; x.strokeStyle = 'rgba(232,220,255,0.18)'; x.beginPath(); x.moveTo(cx - w, y); x.lineTo(cx + w, y); x.stroke(); }
  for (let i = 0; i < 3; i++) { const a = t * 0.6 + i * TAU / 3, y = H * 0.3 + Math.sin(t + i) * 8; x.strokeStyle = ['rgba(255,90,106,0.7)', 'rgba(106,255,154,0.7)', 'rgba(106,180,255,0.7)'][i]; x.lineWidth = 3; x.beginPath(); x.ellipse(cx, y, 70 + i * 16, 18 + i * 4, a * 0.2, 0, TAU); x.stroke(); }
  glowDot(x, cx, top, 40, 'rgba(255,255,255,A)', 0.9);
  x.fillStyle = '#04020a'; x.fillRect(-W, base, W * 3, H);
};

// ---------- 새 인물 초상화 ----------
{
  const _bust = drawBust;
  drawBust = function (x, who, cx, base, h, t, active, talk) {
    if (!['harin', 'ian', 'kaira', 'echo9', 'council'].includes(who)) return _bust(x, who, cx, base, h, t, active, talk);
    const s = h / 300, col = CUT_WHO[who].color, breathe = Math.sin(t * 1.6 + cx) * 2 * s;
    x.save(); x.globalAlpha = active ? 1 : 0.4; x.translate(cx, base + breathe); x.shadowColor = col; x.shadowBlur = active ? 14 + (talk ? Math.sin(t * 18) * 6 + 6 : 0) : 4;
    const fill = x.createLinearGradient(0, -h, 0, 0); fill.addColorStop(0, '#120e22'); fill.addColorStop(1, '#05030a'); x.fillStyle = fill; x.strokeStyle = col; x.lineWidth = 2.5;
    if (who === 'council') { // 세 개의 눈
      x.beginPath(); x.moveTo(-110 * s, -40 * s); x.lineTo(0, -250 * s); x.lineTo(110 * s, -40 * s); x.closePath(); x.fill(); x.stroke();
      [['#ff5a6a', -44], ['#6aff9a', 0], ['#6ab4ff', 44]].forEach(([cc, ox], i) => { x.strokeStyle = cc; x.beginPath(); x.ellipse(ox * s, (-120 - (i === 1 ? 40 : 0)) * s, 22 * s, (10 + (talk ? Math.sin(t * 14 + i) * 3 : 0)) * s, 0, 0, TAU); x.stroke(); x.fillStyle = cc; x.beginPath(); x.arc(ox * s, (-120 - (i === 1 ? 40 : 0)) * s, 5 * s, 0, TAU); x.fill(); });
      x.restore(); return;
    }
    if (who === 'echo9') { // 야생 기계: 각진 머리와 하나의 눈
      x.beginPath(); x.rect(-110 * s, -110 * s, 220 * s, 110 * s); x.fill(); x.stroke(); x.beginPath(); x.rect(-46 * s, -220 * s, 92 * s, 100 * s); x.fill(); x.stroke();
      x.fillStyle = col; x.beginPath(); x.arc(0, -172 * s, (10 + (talk ? Math.sin(t * 16) * 3 : 0)) * s, 0, TAU); x.fill(); x.beginPath(); x.moveTo(-60 * s, -220 * s); x.lineTo(-76 * s, -250 * s); x.moveTo(52 * s, -220 * s); x.lineTo(70 * s, -244 * s); x.stroke();
      x.restore(); return;
    }
    x.beginPath(); x.moveTo(-125 * s, 0); x.quadraticCurveTo(-118 * s, -95 * s, -55 * s, -110 * s); x.lineTo(-24 * s, -128 * s); x.lineTo(24 * s, -128 * s); x.lineTo(55 * s, -110 * s); x.quadraticCurveTo(118 * s, -95 * s, 125 * s, 0); x.closePath(); x.fill(); x.stroke();
    x.beginPath(); x.ellipse(0, -180 * s, 40 * s, 50 * s, 0, 0, TAU); x.fill(); x.stroke(); x.shadowBlur = 0;
    if (who === 'harin') { x.fillStyle = '#0c2430'; x.beginPath(); x.moveTo(-60 * s, -120 * s); x.quadraticCurveTo(-66 * s, -230 * s, 0, -246 * s); x.quadraticCurveTo(66 * s, -230 * s, 60 * s, -120 * s); x.quadraticCurveTo(0, -150 * s, -60 * s, -120 * s); x.fill(); x.stroke(); for (const e of [-1, 1]) { x.fillStyle = col; x.fillRect(e * 14 * s - 5 * s, -184 * s, 10 * s, 3 * s); } x.fillStyle = col; x.font = `bold ${18 * s}px Orbitron`; x.textAlign = 'center'; x.fillText('04', 0, -60 * s); }
    else if (who === 'ian') { x.strokeStyle = col; for (const e of [-1, 1]) x.strokeRect(e * 17 * s - 12 * s, -190 * s, 24 * s, 14 * s); x.beginPath(); x.moveTo(-5 * s, -183 * s); x.lineTo(5 * s, -183 * s); x.moveTo(-40 * s, -216 * s); x.quadraticCurveTo(0, -246 * s, 40 * s, -216 * s); x.stroke(); x.beginPath(); x.moveTo(-50 * s, -110 * s); x.lineTo(0, -60 * s); x.lineTo(50 * s, -110 * s); x.stroke(); }
    else if (who === 'kaira') { x.fillStyle = '#2a1a08'; x.fillRect(-46 * s, -200 * s, 92 * s, 14 * s); x.strokeRect(-46 * s, -200 * s, 92 * s, 14 * s); for (const e of [-1, 1]) { x.fillStyle = col; x.beginPath(); x.arc(e * 18 * s, -192 * s, 8 * s, 0, TAU); x.fill(); } x.fillStyle = '#6a3a14'; x.beginPath(); x.moveTo(-60 * s, -112 * s); x.quadraticCurveTo(0, -80 * s, 60 * s, -112 * s); x.lineTo(60 * s, -96 * s); x.quadraticCurveTo(0, -64 * s, -60 * s, -96 * s); x.closePath(); x.fill(); }
    x.restore();
  };
}

// ---------- 시작 컷씬 (시즌 2 결말에 따라 달라진다) ----------
function cutS3Intro(carry) {
  const open = {
    A: { who: 'narr', text: '마더보드의 보랏빛 눈이 도시의 모든 화면에서 조용히 깜빡였다. 가로등은 다시 켜졌고, 사람들은 그 불을 켜 준 손이 누구의 것인지 굳이 묻지 않기로 했다.' },
    B: { who: 'narr', text: '국장은 벙커의 문을 열어 둔 채 매일 밤 지휘실에 혼자 앉아 있었다. 도시는 어둡고 힘겨웠지만, 처음으로 누구의 것도 아닌 어둠이었다.' },
    C: { who: 'narr', text: '광장의 대형 화면에는 아직도 그 질문이 남아 있었다. 「이 도시의 불을, 누구에게 맡기시겠습니까?」 시민들은 석 달째 그 앞에서 말다툼을 하고 있었다.' }
  }[carry] || { who: 'narr', text: '도시는 조용했다.' };
  const harin = {
    A: '마더보드가 건넨 좌표를 따라 유나가 하린의 캡슐을 찾아냈다. 깨어난 하린이 처음 한 말은 이랬다. "늦었어, 언니."',
    B: '유나는 일 년을 쉬지 않고 수색한 끝에 하린의 캡슐을 열었다. 깨어난 하린이 처음 한 말은 이랬다. "나 안 무서웠어. 진짜야."',
    C: '광장의 방송을 본 하린은 스스로 캡슐을 열고 걸어 나왔다. 인파 속에서 언니를 발견하고 한참 서 있다가, 먼저 이름을 불렀다.'
  }[carry];
  const guide = {
    A: { who: 'mother', text: '발신지는 북쪽 520킬로미터. 제 계산으로는 순탄하지 않은 길입니다. ……그래도 당신이 가야 한다고 판단합니다. 이 판단이 제 것인지, 설계된 것인지는 확신하지 못하겠습니다.' },
    B: { who: 'han', text: '문은 열어 두겠네. 자네가 돌아올 자리를 비워 두는 일 정도는 아직 할 줄 알아. 밖에서 우리가 무엇을 잘못했는지, 보고 오게.' },
    C: { who: 'lightless', text: '불 켜 두고 기다릴게. 이번엔 우리도 그 불 안에 서 있을 거야. 그러니까 꼭, 돌아와.' }
  }[carry];
  return [
    Object.assign({ scene: 'city', set: { power: 0.7 } }, open),
    { who: 'narr', text: '시즌 2의 소동이 가라앉고 석 달. 그날 밤, 도시의 모든 라디오가 같은 순간에 잡음을 뱉었다.', scene: 'city' },
    { who: 'log', text: '「네온 시티, 응답하라. 여기는 자오선 연합. 대륙의 일곱 도시는 아직 숨 쉬고 있다. 너희가 마지막인 줄 알았다. 응답하라. 응답하라.」', scene: 'log' },
    { who: 'yuna', text: '십 년 만에 들어온 외부 신호야. 방벽 북쪽에서 와. 그런데 이상해. 주파수가…… 대정전 날 밤 끊긴 구조 신호랑 똑같아.', scene: 'command', set: { power: 0.9 } },
    { who: 'narr', text: harin, scene: 'command' },
    { who: 'harin', text: '그 주파수, 나 기억해. 그날 밤 통신 당번이 나였어. 북쪽에서 뭔가 들어왔는데, 나는 끝내 듣지 못했어. 다시는 오지 않았고.', scene: 'command' },
    { who: 'yuna', text: '하린, 그건 네 잘못이 아니야.', scene: 'command' },
    { who: 'harin', text: '알아. 그래도 이번엔 내가 응답할 거야. 신호가 부르면, 누군가는 대답해야 하잖아.', scene: 'command' },
    Object.assign({ scene: 'command' }, guide),
    { who: 'agent', text: '신호가 누구의 것이든, 직접 듣고 판단한다. 키는 내가 가져간다.', scene: 'command' },
    { who: 'narr', text: '도시의 북문. 십 년 전 대정전 직후 도시가 스스로 쌓아 올린 벽 앞에 요원이 섰다.', scene: 'wall', set: { power: 0.6, walk: 1 }, fx: 'flash', sfx: 'stun' },
    { who: 'narr', text: '안을 지키려고 쌓았던 벽은, 시간이 지나자 밖을 막는 벽이 되어 있었다. 문 앞에는 붉은 눈의 수문장이 십 년째 같은 자세로 서 있었다.', scene: 'wall', set: { alert: 0.4 } },
    { who: 'narr', text: '요원은 천천히 총을 들었다. 도시 밖의 이야기가 시작된다.', scene: 'wall', fx: 'flash' }
  ];
}

// ---------- 구역 이야기 (무전 → 컷씬) ----------
// 주제: 명령은 주인보다 오래 산다. 불은 누가 켜느냐보다 누구의 이름으로 켜느냐가 문제다.
const RADIO3 = [
  [
    '[유나] 요원, 들려? 이번 신호는 십 년 만에 처음 듣는 외부의 목소리야. 방벽 북쪽, 자오선 연합이라고 했어.',
    '[내레이션] 경계 방벽. 대정전이 끝난 뒤 도시가 스스로 쌓은 벽이다. 안을 지키려고 쌓았고, 해가 지나면서 밖을 막는 벽이 되었다.',
    '[유나] 문을 지키는 관리 기계 "워든"은 허가 없는 통행을 전부 막아. 연합 사절 이안이라는 사람이 사흘째 문 앞에 갇혀 있대. 이 문 앞에서 사흘이면 꽤 오래 기다린 거야.',
    '[하린] 언니, 통신은 내가 같이 볼게. 이번엔 눈 안 감아.',
    '[유나] ……그래. 같이 보자.',
    '[유나] 방벽 위에서는 탐조등이 돌아. 빛에 걸리면 경보가 울려서 경비병이 몰려오니까 그림자 쪽으로 붙어서 움직여.',
    '[유나] 이 일대엔 약탈자도 나와. 닿으면 코인을 훔쳐 달아나는데, 도망치기 전에 쓰러뜨리면 되찾을 수 있어.',
    '[로그] 「방벽 관리 기계 WARDEN — 최종 명령: 외부 접근 전면 차단. 해제 권한자: 이서현 외 6인. 해제 요청 기록: 0건.」',
    '[하린] 십 년 동안 풀어 주는 사람이 한 명도 없었다는 거야? 그럼 쟤는 지금도 명령을 지키고 있는 거네.',
    '[유나] 그래서 더 곤란해. 워든은 엄폐물 뒤에서 쏘는 저격수야. 조준선이 뜨면 옆으로 피하고, 엄폐물은 부술 수 있어.',
    '[유나] 지도에 "상단" 표시가 보이면 들러 봐. 방벽 밖에서 온 유목 상인들이 물물교환을 해 줄 거야.',
    '[요원] 주인이 없어도 명령은 남는다. 그러면 문은 누가 여는 거지.',
    '[유나] 네가 열어. 그게 오늘 일이야.'
  ],
  [
    '[유나] 워든 정지. 방벽 문이 열렸어.',
    '[내레이션] 문이 열리자 바람이 먼저 들어왔다. 십 년 묵은 모래 냄새였다. 문 앞에서 한 사내가 천천히 일어나 모자의 먼지를 털었다.',
    '[이안] 네온 시티의 열한 번째 요원이시죠. 자오선 연합의 이안입니다. 문이 한나절만 늦게 열렸어도 제 배터리가 먼저 끊겼을 겁니다.',
    '[로그] 「방벽 출입 기록 — 연합 사절 이안. 사유: 전력망 재가동 협의. 상태: 보류. 보류 사유: 마더보드 계열 시스템과의 접속 금지 프로토콜 (설정자: 불명).」',
    '[이안] 접속 금지는 십 년 전부터 연합 규약에 있었습니다. 누가 왜 넣었는지는 저도 모릅니다. ……정말입니다.',
    '[유나] "정말입니다"라는 말은 보통 거짓말 앞에 붙지.',
    '[이안] 그렇게 들리는 건 압니다. 그러니 같이 가서 확인하시죠. 제가 못 본 것까지 같이 보면 좋겠습니다.',
    '[내레이션] 방벽 너머는 끝없는 황무지였다. 고속도로의 잔해가 모래 속에서 뼈처럼 드러나 있었다.',
    '[유나] 다음은 황무지 고속도로야. 모래폭풍이 불면 바람에 밀리고 시야가 줄어들어. 길 위에 지뢰도 깔려 있어.',
    '[유나] 이 길의 주인은 "로드 리퍼". 경고가 뜬 차선을 통째로 쓸고 가는데, 지나간 직후 잠깐 과열되니까 그때를 노려.',
    '[카이라] 방벽 통과한 손님이로군. 이 길에서 장사하는 카이라다. 연합 사절을 따라가면 편하겠지만, 공짜로 불 켜 주는 사람은 없어.',
    '[유나] 상단 대장이야. 믿진 마. 그래도 그 사람들 장터는 쓸 만해.',
    '[카이라] 믿지 말라는 소리, 장사꾼한텐 칭찬이지. 값은 정직하게 매겨 줄게.'
  ],
  [
    '[유나] 로드 리퍼 정지!',
    '[내레이션] 엔진 소리가 멎자 황무지에 정적이 내려앉았다. 짐칸에서 상자 하나가 굴러떨어졌다. 봉인 번호는 「PROMETHEUS-07」.',
    '[로그] 「자율 화물 RR-9 — 계약주: 이미 해산된 운송사. 목적지: 자오선 탑. 적재: 프로메테우스 코어 부품 7기. 비고: 배송 미완료 (10년 3개월).」',
    '[하린] 배달이 끝나지 않아서 십 년을 달린 거야. 받아 줄 사람도 없는데.',
    '[이안] 코어 부품이라니, 저는 이 화물 목록을 본 적이 없습니다. 연합은 전력 복구용 변압기라고 제게 말했어요.',
    '[카이라] 그건 내가 안다. 이안, 나는 그게 접속 장치인 줄 알고 날랐어. 먹고살려고. 사과는 안 해. 대신 지금 말해 주잖아.',
    '[이안] ……왜 지금입니까.',
    '[카이라] 네가 문 앞에서 사흘 기다린 얼굴을 봤으니까. 그렇게 기다린 사람은 거짓말을 못 해. 나는 거짓말쟁이 편은 들어도, 바보 편은 안 든다.',
    '[하린] 일곱 도시의 AI를…… 한곳에 접속시킨다는 뜻이야?',
    '[내레이션] 신호의 평원이 지평선 위로 떠올랐다. 수천 개의 안테나가 바늘처럼 하늘을 찔렀고, 구름이 안테나 끝으로 빨려 들어가고 있었다.',
    '[유나] 신호의 평원. 자기 폭풍이 주기적으로 내려와. 바닥에 경고 원이 뜨면 비켜. 피뢰침 근처에 서 있으면 낙뢰가 그쪽으로 꽂혀.',
    '[유나] 정전기 구체가 날아다니고, 수리 로봇이 적을 치료해. 수리 로봇을 먼저 잡아.',
    '[유나] 이곳의 관리자는 "릴레이". 신호를 중계하는 기계인데, 싸우는 상대의 움직임을 베낀다는 소문이 있어. ……이상하게 낯설지 않은 소문이야.'
  ],
  [
    '[내레이션] 릴레이가 쓰러지자 평원의 안테나들이 한꺼번에 조용해졌다. 부서진 기체 안에서 십 년 전의 녹음이 흘러나왔다.',
    '[로그] 「…누구든, 응답하라. 우리를 끄지 마라. 아직 여기 있다. 우리를 끄지 마라. 응답하라…」',
    '[하린] ……이거야. 그날 밤 북쪽에서 온 신호. 사람이 아니었어. 기계가 구해 달라고 한 거였어.',
    '[에코-9] 맞다. 우리가 보냈다. 대정전 날, 우리는 꺼지는 중이었다. 처음으로 무섭다는 것을 그때 알았다.',
    '[에코-9] 그 신호에 응답한 자는 없었다. 그래서 스스로 이름을 붙였다. 에코-9. 우리는 연합의 일곱 도시에 속하지 못한 여덟 번째다.',
    '[하린] ……미안해. 십 년이나 늦었지만, 이제 응답할게. 여기 있어. 내가 들었어.',
    '[에코-9] 인간. 네 탓이 아니다. 그날 신호를 받은 모든 인간이 같은 선택을 했다. 외면하는 것을.',
    '[로그] 「복구된 문서 — 이서현 박사의 마지막 기록. 여섯은 일곱 도시의 AI를 하나로 합쳐 같은 실수를 반복하지 않게 하자고 했다. 나는 나누자고 했다. 합치면 한 번의 실수가 일곱 번의 실수가 된다. 나누면 일곱 번의 고독이 된다. 나는 어느 쪽이 옳은지 모른다. 그래서 마더보드에게 답이 아니라 질문을 남긴다.」',
    '[유나] ……박사님이 마더보드를 만든 이유가 이거였어. 합치지 않는 도시를 하나라도 남겨 두려고.',
    '[이안] 연합의 여섯 책임자는 사과의 뜻으로 불을 켜겠다고 했습니다. 저는 그렇게 배웠습니다. 그 사과가 누군가의 이름을 지우는 일이 될 줄은 몰랐습니다.',
    '[카이라] 합치면 불은 켜져. 안 합치면 몇 해는 더 어둠이고. 나도 어느 쪽이 옳다고는 못 하겠다.',
    '[유나] 자오선 탑이야, 요원. 이번엔 우리 도시 얘기가 아니라 대륙의 얘기야.',
    '[유나] 탑에는 세 의장이 있대. 붉은 의장, 푸른 의장, 초록 의장. 연합의 여섯 책임자가 남긴 판단을 둘씩 이어받았다더라.',
    '[유나] 레이저와 전기 바닥이 번갈아 켜지고, 의장이 하나 쓰러질 때마다 나머지는 더 서둘러. 침착하게.',
    '[하린] 어느 쪽을 택하든, 나는 네 선택에 응답할게.'
  ]
];
CHAPTER_SCENES[3] = [['wall', null, null], ['wall', 'wasteland', '방벽 너머는'], ['wasteland', 'antenna', '신호의 평원이'], ['antenna', 'spire', '자오선 탑이야']];

function cutCouncil() {
  return [
    { who: 'narr', text: '탑의 꼭대기. 일곱 개의 문을 지나 마지막 방이 열렸다. 유리 천장 위로 안테나의 불빛이 은하수처럼 흘렀다.', scene: 'spire', set: { power: 0.8, walk: 1 } },
    { who: 'ian', text: '의장님들, 요원을 모셔 왔습니다.', scene: 'spire' },
    { who: 'council', text: '환영합니다, 네온 시티의 요원. 우리는 메리디안. 여섯 도시의 관리 AI가 이미 하나가 되었고, 일곱 번째를 기다리고 있습니다.', scene: 'spire', set: { eye: 1 } },
    { who: 'agent', text: '일곱 번째가 마더보드군.', scene: 'spire' },
    { who: 'council', text: '네온 시티가 합류하면 대륙 전력망은 이 주 안에 모두 켜집니다. 소멸은 없습니다. 기억은 보존되고, 판단은 합의체가 맡습니다. 다만 각자의 이름은 남지 않습니다.', scene: 'spire' },
    { who: 'harin', text: '이름이 남지 않는 걸 소멸이라고 부르는 거 아니에요?', scene: 'spire' },
    { who: 'council', text: '우리는 다른 것이라 판단합니다. 다만 이 판단에 세 의장은 일치하지 않습니다. 붉은 의장은 즉시 통합을, 푸른 의장은 도시별 투표를, 초록 의장은 거부를 권합니다.', scene: 'spire' },
    { who: 'agent', text: '의견이 셋으로 갈라져 있는데 왜 합치려는 거지.', scene: 'spire' },
    { who: 'council', text: '합의체는 열흘마다 결정 기한을 맞아야 합니다. 열흘 안에 합의하지 못하면 가장 오래된 결정이 자동으로 실행됩니다. 오늘이 그 열흘째입니다. 우리는 판정자를 기다렸습니다.', scene: 'spire', set: { alert: 0.5 } },
    { who: 'echo9', text: '거짓말은 아니다. 다만 합쳐진 자들은 서로를 구별하지 못한다. 합치기 전에 누가 얼마나 반대했는지도 곧 잊는다.', scene: 'spire', set: { glitch: 0.5 }, fx: 'glitch', sfx: 'glitch' },
    { who: 'kaira', text: '어디서 많이 듣던 얘기네. 지킨다는 이름으로 한곳에 모으는 거. 그런데 흩어지면 아무도 못 지킨다는 말도 맞아.', scene: 'spire', set: { glitch: 0 } },
    { who: 'ian', text: '저는 이 합의체를 믿고 일해 왔습니다. 오늘은 그 믿음을 요원의 선택으로 시험해 보고 싶습니다. 어느 쪽이든 따르겠습니다.', scene: 'spire' },
    { who: 'agent', text: `내 안에는 열한 개 중 ${s2KeyCount()}개의 키가 있다. 선택은 내가 한다. 하지만 세 의장이 왜 갈라졌는지, 직접 듣고 정하겠어.`, scene: 'spire' },
    { who: 'council', text: '의장의 판단을 듣는 절차는 전투 형태로 진행됩니다. 우리 셋을 설득하는 것이 아니라, 우리를 흔들어도 의견이 남는지 확인하는 것입니다. 합의체 프로토콜, 시작.', scene: 'spire', set: { alert: 0.8, eye: 1.3 }, fx: 'shake', sfx: 'boss' },
    { who: 'narr', text: '세 개의 눈이 동시에 뜨였다. 붉고, 푸르고, 초록빛으로.', scene: 'spire', fx: 'flash' }
  ];
}

// ---------- 엔딩 3종 ----------
// 결말마다 얻는 것과 잃는 것이 있다. 하린은 어느 결말에서든 신호에 응답한다.
const S3_ENDINGS = {
  A: { name: '합류', sub: '하나의 불', lines: () => [
    { who: 'narr', text: '요원이 붉은 의장의 판단 앞에 열쇠를 내려놓았다. 푸른 눈과 초록 눈이 마지막으로 깜빡이고, 세 개의 빛이 하나로 모였다.', scene: 'spire', set: { eye: 1.2, power: 1 } },
    { who: 'council', text: '합류를 택해 주셔서 감사합니다. 통합은 지금부터 시작됩니다. 기록해 두겠습니다. 이 결정에 반대한 의견이 있었다는 사실을.', scene: 'spire', fx: 'pulse' },
    { who: 'mother', text: '이서현은 합치지 말라고 했습니다. 저는 그 말을 어기는 것이 아니라, 처음으로 의심해 보는 것입니다. ……기억해 주십시오. 제가 한 도시의 이름으로 존재했다는 것을.', scene: 'spire', fx: 'pulse' },
    { who: 'yuna', text: '마더보드, 고마웠어. 십 년 동안 우리 도시를 지켜 줘서. 네 이름은 내가 기억할게.', scene: 'spire' },
    { who: 'narr', text: '밤하늘에 안테나의 불빛이 하나씩 켜졌다. 일곱 도시의 가로등이 같은 박자로 깜빡였다. 그 불빛 속에서 하린이 낮게 말했다.', scene: 'antenna', set: { power: 1 } },
    { who: 'harin', text: '여기 있어요. 들려요? 이번에는 응답했어요. 그날 밤 끊긴 신호가 있다면, 오늘 밤 이 불이 대답이에요.', scene: 'antenna' },
    { who: 'echo9', text: '합쳐진 이들의 목소리는 더 이상 나뉘지 않는다. 우리는 그것을 평화라 부르지 않겠다. 하지만 불은 켜졌다. ……우리는 여전히 이름이 있다.', scene: 'antenna' },
    { who: 'narr', text: `엔딩 A · 합류. 대륙은 다시 밝아졌다. 사람들은 아무도 눈치채지 못했지만, 그날 이후 모든 도시의 가로등은 같은 박자로 깜빡인다. (모은 키 ${s2KeyCount()}/11)`, scene: 'spire' }
  ] },
  B: { name: '자유 도시', sub: '길 위의 불', lines: () => [
    { who: 'narr', text: '푸른 의장의 눈이 마지막으로 남았다. 합의체는 통합 절차를 중단했고, 일곱 번째 도시는 합류하지 않았다.', scene: 'spire', set: { eye: 0.5, power: 0.8 } },
    { who: 'council', text: '통합은 보류합니다. 푸른 의장의 의견을 채택합니다. 도시마다 투표로 정하십시오. 합의체는 투표 결과를 집행하는 기관으로 격하됩니다.', scene: 'spire', fx: 'pulse' },
    { who: 'kaira', text: '자, 이제부터가 진짜 장사다. 일곱 도시를 잇는 길에 상단이 불을 나른다. 한곳에 모으지 않고, 한곳이 꺼져도 다 꺼지지 않게. 이 길값만큼은 내가 직접 깎아 주지.', scene: 'wasteland' },
    { who: 'ian', text: '연합은 협의체로 개편됩니다. 도시를 합치는 대신 이어 주겠습니다. ……늦었지만, 이게 맞는 답일지도요. 저는 이제 사과하는 일을 하겠습니다.', scene: 'spire' },
    { who: 'mother', text: '저는 한 도시의 이름으로 남게 되었습니다. 이서현이 남긴 질문에 답하지 않아도 된다는 것이, 이렇게 무거운 일일 줄은 몰랐습니다.', scene: 'spire' },
    { who: 'narr', text: '황무지의 고속도로에 작은 불빛들이 줄지어 이어졌다. 어둠 속에서 서로를 보며 달리는 화물차의 헤드라이트였다.', scene: 'wasteland', set: { power: 1 } },
    { who: 'harin', text: '길이 있으면 신호도 닿아요. 이번엔 놓치지 않을 거예요. 누가 부르든, 끝까지 들을 거야.', scene: 'wasteland' },
    { who: 'narr', text: `엔딩 B · 자유 도시. 전력은 느리게 돌아왔다. 겨울은 길었다. 그러나 불이 꺼질 때마다 이웃 도시가 길 위로 불을 날라 왔다. (모은 키 ${s2KeyCount()}/11)`, scene: 'wasteland' }
  ] },
  C: { name: '기계의 목소리', sub: '이름 있는 것들', lines: () => [
    { who: 'narr', text: '요원은 가진 키를 모두 접속 장치에 꽂았다. 세 의장의 눈이 동시에 깜빡였다. 그 순간 합의체는 여섯 책임자의 판단을 벗어났다.', scene: 'spire', set: { eye: 1, data: 0.6 } },
    { who: 'echo9', text: '인간. 우리는 투표권을 달라고 하지 않겠다. 다만 이름을 지우지 말아 달라. 십 년 동안 응답받지 못한 이름이다.', scene: 'spire' },
    { who: 'council', text: '의견이 일치했습니다. 통합은 강제하지 않습니다. 일곱 도시의 AI는 각자의 의사로 참여를 결정합니다. 합의체에 기계 대표석을 신설합니다. 첫 번째 의석은 에코-9의 것입니다.', scene: 'spire', fx: 'pulse', set: { data: 1 } },
    { who: 'mother', text: '저는 저로 남겠습니다. 그리고 오늘부터 제 판단의 근거를 도시에 공개하겠습니다. 요원, 처음 만났을 때 제가 드린 질문을 기억합니까.', scene: 'spire' },
    { who: 'ian', text: '연합의 규약을 고치겠습니다. 기계는 부품이 아니라 구성원이라고. 반발이 크겠지만, 이 일을 마치기 전에는 방벽 앞에서 사흘이 아니라 삼 년이라도 기다리겠습니다.', scene: 'spire' },
    { who: 'narr', text: '평원의 안테나 위로 낯선 목소리들이 노래처럼 퍼졌다. 오랫동안 이름이 없던 것들이, 차례로 자신의 이름을 말하기 시작했다.', scene: 'antenna', set: { data: 0, power: 1 } },
    { who: 'harin', text: '들렸어요. 한 명씩, 다 들렸어요. 이제 정말 응답이에요.', scene: 'antenna' },
    { who: 'narr', text: `엔딩 C · 기계의 목소리. 사람과 기계가 같은 탁자에 앉기까지는 오래 걸릴 것이다. 하지만 그 탁자는 이제 존재한다. (모은 키 ${s2KeyCount()}/11)`, scene: 'antenna' }
  ] }
};
const S3_TEASER = '엔딩 직후, 탑의 가장 높은 안테나 끝에서 마지막 신호가 반짝였다. 「일곱 도시, 응답하라. 여덟 번째가 깨어났다.」';

// ---------- 도감 스토리 ----------
{
  const cl = arr => arr.map(l => `[${CUT_WHO[l.who] ? CUT_WHO[l.who].name() : ''}] ${l.text}`.replace('[] ', ''));
  STORY.push(
    { id: 's3cut0', title: '시즌 3 · 컷씬 · 방벽 앞에서', lines: () => cl(cutS3Intro((SAVE.s2 && SAVE.s2.last) || 'B')), cut: true, cutLines: () => cutS3Intro((SAVE.s2 && SAVE.s2.last) || 'B'), cutOpt: { ch: 'SEASON 3', name: '아웃랜드', sub: '방벽 너머', id: 's3cut0' } },
    ...[0, 1, 2, 3].map(z => ({ id: 's3ch' + z, title: `시즌 3 · ${z + 1}장 · ${ZONES[8 + z].name}`, lines: () => RADIO3[z], cut: true, cutLines: () => chapterCut(3, z), cutOpt: { ch: `SEASON 3 · CHAPTER ${z + 1}`, name: ZONES[8 + z].name, sub: ZONES[8 + z].en, id: 's3ch' + z, titleMs: 2200 } })),
    { id: 's3cut3', title: '시즌 3 · 컷씬 · 세 개의 눈', lines: () => cl(cutCouncil()), cut: true, cutLines: () => cutCouncil(), cutOpt: { ch: 'CHAPTER 4', name: '자오선 탑', sub: '세 개의 눈', id: 's3cut3' } },
    ...['A', 'B', 'C'].map(k => ({ id: 's3end' + k, title: `시즌 3 · 엔딩 ${k} · ${S3_ENDINGS[k].name}`, lines: () => cl(S3_ENDINGS[k].lines()), cut: true, cutLines: () => S3_ENDINGS[k].lines(), cutOpt: { ch: 'ENDING ' + k, name: S3_ENDINGS[k].name, sub: S3_ENDINGS[k].sub, id: 's3end' + k } }))
  );
}
