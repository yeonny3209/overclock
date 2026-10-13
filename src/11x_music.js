// ================= 시즌별 배경음악 (Web Audio 합성) =================
// 시즌 1 네온 시티(신스웨이브), 시즌 2 언더그라운드(어둡고 금속적인 맥박), 시즌 3 황무지(바람과 하나의 선율).
// 장면마다 분위기가 바뀐다: 타이틀 · 지도(calm) · 전투(fight) · 보스(boss).
const MUSIC = {
  gain: null, timer: null, sched: null, key: '', want: '', nextT: 0, step: 0, bar: 0, cfg: null, level: 'calm', seed: 1,
  mid: m => 440 * Math.pow(2, (m - 69) / 12),
  // 코드: [근음 MIDI, 종류]. minor = 단3도, major = 장3도, sus = 4도
  CFG: {
    title: { bpm: { calm: 70 }, chords: [[57, 'm'], [53, 'M'], [48, 'M'], [55, 'M']], pad: 0.5, arp: 'soft', drums: 0, bass: 0 },
    1: { bpm: { calm: 92, fight: 116, boss: 132 }, chords: [[57, 'm'], [53, 'M'], [48, 'M'], [55, 'M']], pad: 0.35, arp: 'synth', drums: 1, bass: 1 },
    2: { bpm: { calm: 70, fight: 88, boss: 104 }, chords: [[50, 'm'], [46, 'M'], [43, 'm'], [45, 'M']], pad: 0.5, arp: 'sparse', drums: 2, bass: 2 },
    3: { bpm: { calm: 66, fight: 84, boss: 102 }, chords: [[50, 's'], [48, 'M'], [43, 'M'], [45, 's']], pad: 0.55, arp: 'pluck', drums: 3, bass: 3 }
  },
  rnd() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; },
  vol() { const m = SAVE.settings.music === undefined ? 0.5 : SAVE.settings.music; return 0.38 * m * (G.paused ? 0.35 : 1); },
  pick() {
    if (!SFX.ctx) return '';
    if (!run || run.ended) return 'title';
    const s = isS3() ? 3 : isS2() ? 2 : 1;
    if (G.screen === 'combat') return s + (room && room.kind === 'boss' ? ':boss' : ':fight');
    return s + ':calm';
  },
  start() {
    if (this.timer || !SFX.ctx) return;
    this.gain = SFX.ctx.createGain(); this.gain.gain.value = 0; this.gain.connect(SFX.master);
    this.timer = setInterval(() => this.tick(), 120);
  },
  tick() {
    if (!SFX.ctx) return;
    const c = SFX.ctx, now = c.currentTime, m = this.vol();
    if (m <= 0.001) { this.gain.gain.setTargetAtTime(0, now, 0.15); return; }
    const k = this.pick();
    if (k !== this.want) { this.want = k; this.gain.gain.setTargetAtTime(0, now, 0.18); this.switchAt = performance.now() + 700; return; }
    if (this.key !== this.want) {
      if (performance.now() < (this.switchAt || 0)) return;
      const [s, lv] = String(k).split(':'); this.cfg = this.CFG[s === 'title' ? 'title' : s]; this.level = lv || 'calm'; if (k === 'title') this.level = 'calm';
      this.key = k; this.step = 0; this.bar = 0; this.nextT = now + 0.12; this.seed = 7 + (this.cfg === this.CFG[3] ? 3 : 0);
    }
    this.gain.gain.setTargetAtTime(m, now, 0.25);
    const bpm = this.cfg.bpm[this.level] || this.cfg.bpm.calm, sd = 60 / bpm / 4;
    while (this.nextT < now + 0.45) { this.play(this.nextT, this.step, this.bar, sd); this.nextT += sd; if (++this.step >= 16) { this.step = 0; this.bar = (this.bar + 1) % 4; } }
  },
  // 하나의 소리: 파형, 주파수, 길이, 음량, (필터), 시작/끝 어택
  note(type, f, t, dur, vol, lp, atk = 0.01) {
    const c = SFX.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f; let out = o;
    if (lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); out = fl; }
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(g); g.connect(this.gain); o.start(t); o.stop(t + dur + 0.05);
  },
  hit(kind, t, vol) {
    const c = SFX.ctx;
    if (kind === 'kick') { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g); g.connect(this.gain); o.start(t); o.stop(t + 0.22); return; }
    if (!SFX.noiseBuf) return;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = SFX.noiseBuf;
    const [ft, fq, dur] = kind === 'hat' ? ['highpass', 7500, 0.04] : kind === 'snare' ? ['bandpass', 1900, 0.13] : kind === 'tick' ? ['bandpass', 4200, 0.03] : ['lowpass', 700, 0.25];
    f.type = ft; f.frequency.value = fq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.gain); s.start(t, this.rnd() * 0.5); s.stop(t + dur + 0.02);
  },
  play(t, st, bar, sd) {
    const C = this.cfg, ch = C.chords[bar], root = ch[0], q = ch[1], lv = this.level, hard = lv === 'fight' ? 1 : lv === 'boss' ? 2 : 0;
    const tones = [0, q === 'm' ? 3 : q === 's' ? 5 : 4, 7, 12];
    // 패드: 한 마디에 한 번
    if (st === 0) {
      const len = sd * 16;
      for (const iv of tones.slice(0, 3)) {
        this.note('sawtooth', this.mid(root + 12 + iv), t, len * 1.05, 0.05 * C.pad, 900 + hard * 300, len * 0.35);
        this.note('triangle', this.mid(root + iv - 12 + 12), t, len * 1.05, 0.06 * C.pad, 600, len * 0.3);
      }
      if (C.bass === 3) this.hit('wind', t, 0.05 + 0.03 * Math.sin(bar));
    }
    // 베이스
    if (C.bass === 1 && st % 2 === 0 && lv !== 'calm') this.note('square', this.mid(root - 12), t, sd * 1.7, 0.07, 420 + (st % 8 === 0 ? 400 : 0));
    if (C.bass === 2 && (st === 0 || (hard && st === 8) || (hard === 2 && st % 4 === 2))) this.note('sawtooth', this.mid(root - 24), t, sd * (st === 0 ? 7 : 3), 0.09, 260, 0.02);
    if (C.bass === 3 && (st === 0 || st === 8)) this.note('triangle', this.mid(root - 12), t, sd * 6, 0.11, 500, 0.03);
    // 드럼
    if (C.drums === 1 && lv !== 'calm') {
      if (st % 4 === 0) this.hit('kick', t, 0.34); if (st === 4 || st === 12) this.hit('snare', t, 0.12); if (st % 4 === 2) this.hit('hat', t, 0.05); if (lv === 'boss' && st % 2 === 1) this.hit('hat', t, 0.03);
    }
    if (C.drums === 2) {
      if (lv !== 'calm' && st % 4 === 2) this.hit('tick', t, 0.07); if (hard && (st === 0 || st === 10)) this.hit('kick', t, 0.3); if (lv === 'boss' && st % 4 === 0) this.hit('snare', t, 0.1);
    }
    if (C.drums === 3) {
      if (lv !== 'calm' && (st === 0 || st === 8)) this.hit('kick', t, 0.3); if (hard && st === 12) this.hit('tick', t, 0.08); if (lv === 'boss' && (st === 4 || st === 14)) this.hit('snare', t, 0.1);
    }
    // 선율
    const A = C.arp;
    if (A === 'synth' && lv !== 'calm') { if (st % 2 === 0) this.note('sawtooth', this.mid(root + 24 + tones[(st / 2 + bar) % 4]), t, sd * 1.4, 0.035, 2400); }
    else if (A === 'synth') { if (st % 4 === 0) this.note('triangle', this.mid(root + 24 + tones[(st / 4 + bar) % 4]), t, sd * 3, 0.04, 2000); }
    else if (A === 'soft') { if (st % 4 === 0) this.note('sine', this.mid(root + 24 + tones[(st / 4) % 3]), t, sd * 6, 0.05, 0, 0.03); }
    else if (A === 'sparse') { if ((st === 0 && bar % 2 === 0) || (hard && st % 8 === 6)) this.note('sine', this.mid(root + 36), t, sd * 5, 0.05, 0, 0.02); if (hard === 2 && st % 2 === 0) this.note('square', this.mid(root + 12 + tones[(st / 2) % 3]), t, sd * 1.2, 0.03, 900); }
    else if (A === 'pluck') {
      const pent = [0, 2, 4, 7, 9]; if (st % 2 === 0 && this.rnd() < (lv === 'calm' ? 0.28 : 0.45)) { const d = pent[Math.floor(this.rnd() * 5)] + 12 * (this.rnd() < 0.35 ? 2 : 1); this.note('triangle', this.mid(root + 12 + d), t, sd * 4, 0.07, 1800, 0.004); }
    }
  }
};
setInterval(() => { try { MUSIC.start(); } catch (e) { } }, 500);
