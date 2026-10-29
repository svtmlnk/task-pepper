// Музыка (mp3) + 8/16-битные звуковые эффекты, синтезированные через Web Audio
const SFX = {
  paddle: { type: "square", from: 392, to: 392, duration: 0.06 },
  wall: { type: "square", from: 196, to: 196, duration: 0.04 },
  brick: { type: "square", from: 880, to: 660, duration: 0.07 },
  hard: { type: "triangle", from: 1568, to: 1568, duration: 0.1 },
  launch: { type: "square", from: 330, to: 660, duration: 0.1 },
  start: { type: "square", from: 523, to: 1046, duration: 0.25 },
  lose: { type: "sawtooth", from: 440, to: 55, duration: 0.8 },
  spawn: { type: "triangle", from: 220, to: 880, duration: 0.35 },
};

export class AudioManager {
  constructor() {
    this.muted = false;
    this.ctx = null;
    this.unlocked = false;
    this.wanted = null;
    this.current = null;

    this.tracks = {
      main: new Audio("assets/music/main.mp3"),
      gameover: new Audio("assets/music/gameover.mp3"),
    };
    this.tracks.main.loop = true;
    this.tracks.main.volume = 0.4;
    this.tracks.gameover.volume = 0.5;
  }

  // Браузер разрешает звук только после действия игрока
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    this.ctx = new AudioContext();
    if (this.wanted) this.playMusic(this.wanted);
  }

  playMusic(name) {
    this.wanted = name;
    if (!this.unlocked) return;
    const track = this.tracks[name];
    if (this.current === track && !track.paused) return;

    this.stopMusic();
    this.wanted = name;
    this.current = track;
    track.currentTime = 0;
    track.muted = this.muted;
    track.play().catch(() => {});
  }

  stopMusic() {
    this.wanted = null;
    if (this.current) this.current.pause();
    this.current = null;
  }

  toggleMute() {
    this.muted = !this.muted;
    for (const track of Object.values(this.tracks)) track.muted = this.muted;
  }

  sfx(name) {
    if (!this.ctx || this.muted) return;
    const { type, from, to, duration } = SFX[name];
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(to, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  destroy() {
    this.stopMusic();
    this.ctx?.close();
  }
}
