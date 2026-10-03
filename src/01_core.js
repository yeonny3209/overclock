'use strict';
// ================= 기본 유틸 =================
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const d2 = (ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; };
const angTo = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
const $ = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString();

// ================= 시드 난수 (경로/보상용) =================
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
let RNG = mulberry32(Date.now() & 0x7fffffff);
function reseed(s) { RNG = mulberry32(s | 0); }
const rr = (a, b) => a + RNG() * (b - a);
const ri = (a, b) => Math.floor(a + RNG() * (b - a + 1));
const rp = a => a[Math.floor(RNG() * a.length)];
function rshuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(RNG() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function rweighted(items, wf) {
  let t = 0; for (const it of items) t += wf(it);
  let r = RNG() * t;
  for (const it of items) { r -= wf(it); if (r <= 0) return it; }
  return items[items.length - 1];
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// ================= 저장 =================
const SAVE_KEY = 'overclock_save_v1';
function defaultSave() {
  return {
    chips: 0, totalChips: 0, unlocks: {},
    stats: { dodged: 0, runs: 0, clears: 0, zone2: false, sniperBoss: false, kills: 0, bestZone: 0, reactions: 0 },
    codex: { weapon: {}, enemy: {}, boss: {}, reaction: {}, event: {} },
    ocMax: 0, arenaBest: 0, daily: {},
    settings: { shake: !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), particles: 2, vol: 0.5, dmgNum: true, aimAssist: false, autoFire: false, autoCoin: true, skipRadio: false, minimap: true, touchAutoFire: true }
  };
}
let SAVE = defaultSave();
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s) {
      const d = defaultSave();
      SAVE = Object.assign({}, d, s, {
        stats: Object.assign({}, d.stats, s.stats || {}),
        codex: Object.assign({}, d.codex, s.codex || {}),
        settings: Object.assign({}, d.settings, s.settings || {}),
        unlocks: Object.assign({}, s.unlocks || {}),
        daily: Object.assign({}, s.daily || {})
      });
      for (const k in d.codex) if (!SAVE.codex[k]) SAVE.codex[k] = {};
    }
  } catch (e) { SAVE = defaultSave(); }
}
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) { } }
function codex(cat, id) {
  if (!SAVE.codex[cat][id]) { SAVE.codex[cat][id] = 1; saveGame(); return true; }
  return false;
}

// ================= 캔버스 =================
const canvas = $('cv');
const ctx = canvas.getContext('2d');
let VW = 1280, VH = 720, DPR = 1;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  VW = window.innerWidth; VH = window.innerHeight;
  canvas.width = Math.floor(VW * DPR); canvas.height = Math.floor(VH * DPR);
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();
const FONT = "'Black Han Sans','Noto Sans KR','Malgun Gothic',sans-serif";
const FONT2 = "'Noto Sans KR','Malgun Gothic',sans-serif";

// ================= 입력 =================
const Input = {
  keys: {}, pressed: {}, mx: VW / 2, my: VH / 2, mb: [0, 0, 0], mp: [0, 0, 0], wheel: 0,
  gp: null, gpPrev: [], usingPad: false
};
function initInput() {
  addEventListener('keydown', e => {
    if (!Input.keys[e.code]) Input.pressed[e.code] = 1;
    Input.keys[e.code] = 1;
    if (G.screen === 'combat' && ['Space', 'Tab', 'KeyQ', 'KeyE', 'KeyR'].includes(e.code)) e.preventDefault();
    if (e.code === 'Space' && G.screen !== 'combat' && document.activeElement && document.activeElement.tagName === 'BUTTON') e.preventDefault();
    Input.usingPad = false;
    onGlobalKey(e);
  });
  addEventListener('keyup', e => { Input.keys[e.code] = 0; });
  addEventListener('mousemove', e => { Input.mx = e.clientX; Input.my = e.clientY; Input.usingPad = false; if (!(e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents)) Input.touch = false; });
  addEventListener('mousedown', e => { Input.mb[e.button] = 1; Input.mp[e.button] = 1; SFX.init(); });
  addEventListener('mouseup', e => { Input.mb[e.button] = 0; });
  addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('wheel', e => { Input.wheel += Math.sign(e.deltaY); }, { passive: true });
  addEventListener('blur', () => { Input.keys = {}; Input.mb = [0, 0, 0]; });
}
function endInputFrame() { Input.pressed = {}; Input.mp = [0, 0, 0]; Input.wheel = 0; }
// 게임패드: 왼쪽 스틱 이동, 오른쪽 스틱 조준, RT 사격, LT 스킬, A 구르기, X 재장전, Y 교체, B 상호작용, START 일시정지
function pollGamepad() {
  Input.gp = null;
  if (!navigator.getGamepads) return;
  const pads = navigator.getGamepads();
  const p = pads && (pads[0] || pads[1]);
  if (!p) return;
  const dz = v => Math.abs(v) < 0.18 ? 0 : v;
  const btn = i => p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.4);
  const cur = [];
  for (let i = 0; i < p.buttons.length; i++) cur[i] = btn(i);
  const pr = i => cur[i] && !Input.gpPrev[i];
  const g = {
    lx: dz(p.axes[0] || 0), ly: dz(p.axes[1] || 0), rx: dz(p.axes[2] || 0), ry: dz(p.axes[3] || 0),
    fire: cur[7], skill: pr(6), roll: pr(0), reload: pr(2), swap: pr(3), interact: pr(1), pause: pr(9), od: pr(4)
  };
  Input.gpPrev = cur;
  if (g.lx || g.ly || g.rx || g.ry || cur.some(Boolean)) Input.usingPad = true;
  Input.gp = g;
}

// ================= 효과음 (Web Audio 합성) =================
const SFX = {
  ctx: null, master: null, noiseBuf: null, last: {},
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = SAVE.settings.vol;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp); comp.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = b;
    } catch (e) { this.ctx = null; }
  },
  setVol(v) { if (this.master) this.master.gain.value = v; },
  tone(type, f0, f1, dur, vol, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol, f0, f1, ftype = 'lowpass', delay = 0) {
    const c = this.ctx, t = c.currentTime + delay;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = ftype;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  play(n, v = 1) {
    if (!this.ctx || SAVE.settings.vol <= 0) return;
    const now = this.ctx.currentTime;
    const gap = { water: 0.06, flame: 0.06, smg: 0.04, hit: 0.035, eshoot: 0.05, coin: 0.04, kill: 0.03 }[n] || 0.025;
    if (this.last[n] && now - this.last[n] < gap) return;
    this.last[n] = now;
    const p = rand(0.92, 1.08);
    try {
      switch (n) {
        case 'pistol': this.tone('square', 760 * p, 180, 0.09, 0.14 * v); this.noise(0.06, 0.12 * v, 4000, 800); break;
        case 'smg': this.tone('square', 900 * p, 260, 0.05, 0.08 * v); this.noise(0.04, 0.09 * v, 5000, 1200); break;
        case 'shotgun': this.noise(0.28, 0.45 * v, 3200, 200); this.tone('sawtooth', 160, 45, 0.18, 0.2 * v); break;
        case 'sniper': this.tone('sawtooth', 1500 * p, 70, 0.32, 0.22 * v); this.noise(0.35, 0.35 * v, 6000, 150); break;
        case 'grenade': this.tone('sine', 320 * p, 140, 0.14, 0.2 * v); this.noise(0.08, 0.12 * v, 1500, 300); break;
        case 'flame': this.noise(0.12, 0.1 * v, 900, 400, 'bandpass'); break;
        case 'water': this.noise(0.1, 0.09 * v, 2600, 1200, 'bandpass'); this.tone('sine', 700 * p, 400, 0.06, 0.03 * v); break;
        case 'tesla': this.tone('sawtooth', 1700 * p, 300, 0.16, 0.12 * v); this.tone('square', 2600, 900, 0.1, 0.06 * v); this.noise(0.12, 0.1 * v, 8000, 3000, 'highpass'); break;
        case 'cryo': this.tone('triangle', 1900 * p, 800, 0.12, 0.13 * v); break;
        case 'boomer': this.tone('triangle', 420 * p, 950, 0.16, 0.13 * v); break;
        case 'bhole': this.tone('sine', 140, 38, 0.7, 0.35 * v); this.tone('sawtooth', 70, 30, 0.6, 0.08 * v); break;
        case 'hit': this.tone('square', 320 * p, 140, 0.04, 0.06 * v); break;
        case 'crit': this.tone('square', 1300 * p, 500, 0.07, 0.1 * v); break;
        case 'block': this.tone('triangle', 2200 * p, 1400, 0.05, 0.08 * v); break;
        case 'kill': this.noise(0.12, 0.16 * v, 2500, 300); this.tone('square', 240 * p, 60, 0.12, 0.08 * v); break;
        case 'explode': this.noise(0.55, 0.55 * v, 2200, 80); this.tone('sine', 130 * p, 28, 0.45, 0.45 * v); break;
        case 'smallexp': this.noise(0.25, 0.3 * v, 2600, 150); this.tone('sine', 180, 40, 0.2, 0.2 * v); break;
        case 'hurt': this.tone('sawtooth', 220, 55, 0.25, 0.3 * v); this.noise(0.15, 0.2 * v, 1200, 200); break;
        case 'roll': this.noise(0.16, 0.13 * v, 900, 3500, 'highpass'); break;
        case 'reload': this.tone('square', 380, 380, 0.03, 0.07 * v); this.tone('square', 620, 620, 0.04, 0.07 * v, 0.12); break;
        case 'reloaded': this.tone('square', 900, 900, 0.03, 0.07 * v); break;
        case 'empty': this.tone('square', 1500, 1500, 0.02, 0.05 * v); break;
        case 'coin': this.tone('sine', 1250 * p, 1900, 0.07, 0.08 * v); this.tone('sine', 1900 * p, 2500, 0.08, 0.06 * v, 0.05); break;
        case 'skill': this.tone('sawtooth', 180, 1300, 0.3, 0.16 * v); this.tone('sine', 400, 1600, 0.35, 0.12 * v); break;
        case 'slash': this.noise(0.18, 0.25 * v, 7000, 900, 'bandpass'); this.tone('sawtooth', 900, 200, 0.14, 0.1 * v); break;
        case 'reaction': this.tone('square', 420, 1700, 0.22, 0.13 * v); this.tone('triangle', 630, 2500, 0.3, 0.1 * v, 0.05); break;
        case 'eshoot': this.tone('triangle', 520 * p, 260, 0.09, 0.07 * v); break;
        case 'laser': this.tone('sawtooth', 2400, 600, 0.25, 0.15 * v); this.noise(0.2, 0.15 * v, 9000, 2000, 'highpass'); break;
        case 'warn': this.tone('square', 880, 880, 0.07, 0.08 * v); this.tone('square', 880, 880, 0.07, 0.08 * v, 0.12); break;
        case 'tele': this.tone('sine', 300, 1800, 0.18, 0.12 * v); break;
        case 'spawn': this.tone('sine', 200, 600, 0.25, 0.05 * v); break;
        case 'boss': this.tone('sawtooth', 70, 40, 1.4, 0.35 * v); this.noise(1.2, 0.2 * v, 400, 60); this.tone('square', 140, 70, 1.2, 0.1 * v, 0.2); break;
        case 'ui': this.tone('sine', 880, 1180, 0.06, 0.1 * v); break;
        case 'pick': this.tone('sine', 600, 1300, 0.13, 0.15 * v); this.tone('sine', 900, 1800, 0.13, 0.1 * v, 0.08); break;
        case 'combo': this.tone('square', 600 * v, 1200 * v, 0.12, 0.08); break;
        case 'shield': this.tone('sine', 900, 350, 0.25, 0.2 * v); break;
        case 'freeze': this.tone('triangle', 2400, 1100, 0.18, 0.13 * v); this.noise(0.15, 0.1 * v, 9000, 5000, 'highpass'); break;
        case 'zap': this.noise(0.08, 0.12 * v, 7000, 3000, 'highpass'); this.tone('square', 1800, 600, 0.06, 0.05 * v); break;
        case 'ignite': this.noise(0.4, 0.3 * v, 600, 2400, 'bandpass'); break;
        case 'glitch': for (let i = 0; i < 6; i++) this.tone('square', rand(100, 2000), rand(100, 2000), 0.05, 0.08 * v, i * 0.06); break;
        case 'stun': this.tone('sawtooth', 300, 60, 0.5, 0.25 * v); this.noise(0.5, 0.4 * v, 1500, 100); break;
        case 'heal': this.tone('sine', 500, 1000, 0.3, 0.14 * v); this.tone('sine', 750, 1500, 0.3, 0.1 * v, 0.1); break;
        case 'hack': for (let i = 0; i < 4; i++) this.tone('square', 700 + i * 250, 700 + i * 250, 0.05, 0.06 * v, i * 0.07); break;
        case 'win': [523, 659, 784, 1046].forEach((f, i) => this.tone('square', f, f, 0.18, 0.1 * v, i * 0.12)); break;
        case 'lose': [400, 300, 220, 140].forEach((f, i) => this.tone('sawtooth', f, f * 0.9, 0.3, 0.12 * v, i * 0.2)); break;
        case 'objective': [660, 880, 1320].forEach((f, i) => this.tone('triangle', f, f, 0.14, 0.12 * v, i * 0.09)); break;
      }
    } catch (e) { }
  }
};

// ================= 진행 중인 판 자동 저장 (모드별 슬롯) =================
const RUN_KEY = 'overclock_run_v1';
function runKey(mode) { return RUN_KEY + '_' + (mode || 'campaign'); }
function saveRun() {
  try { if (run && run.mode !== 'arena' && run.map && !run.ended) localStorage.setItem(runKey(run.mode), JSON.stringify(run)); } catch (e) { }
}
function clearRun(mode) { try { localStorage.removeItem(runKey(mode)); if ((mode || 'campaign') === 'campaign') localStorage.removeItem(RUN_KEY); } catch (e) { } }
function clearAllRuns() { for (const m of ['campaign', 'daily']) clearRun(m); }
function peekRun(mode = 'campaign') {
  try {
    let r = JSON.parse(localStorage.getItem(runKey(mode)));
    if (!r) { const old = JSON.parse(localStorage.getItem(RUN_KEY)); if (old && (old.mode || 'campaign') === mode) r = old; }
    return r && r.map && r.weapons && CHARS[r.char] ? r : null;
  } catch (e) { return null; }
}
