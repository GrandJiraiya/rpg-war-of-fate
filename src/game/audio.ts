export type AudioBus = ReturnType<typeof createAudio>;

export function createAudio() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let unlocked = false;
  let volume = 0.75;

  function context() {
    if (ctx) {
      if (ctx.state === "suspended") void ctx.resume();
      return ctx;
    }
    const legacy = window as Window & { webkitAudioContext?: typeof AudioContext };
    const Ctor = window.AudioContext ?? legacy.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = "sine";
    drone.frequency.value = 55;
    droneGain.gain.value = 0.012;
    drone.connect(droneGain);
    droneGain.connect(master);
    drone.start();
    const over = ctx.createOscillator();
    const overGain = ctx.createGain();
    over.type = "triangle";
    over.frequency.value = 82;
    overGain.gain.value = 0.008;
    over.connect(overGain);
    overGain.connect(master);
    over.start();
    return ctx;
  }

  function tone(freq: number, dur: number, type: OscillatorType, gain: number, sweep = 0) {
    if (!unlocked) return;
    const audio = context();
    if (!audio || !master) return;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audio.currentTime);
    if (sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + sweep), audio.currentTime + dur);
    amp.gain.setValueAtTime(Math.max(1e-4, gain), audio.currentTime);
    amp.gain.exponentialRampToValueAtTime(1e-4, audio.currentTime + dur);
    osc.connect(amp);
    amp.connect(master);
    osc.start();
    osc.stop(audio.currentTime + dur + 0.03);
  }

  function noise(dur: number, gain: number, cutoff = 900) {
    if (!unlocked) return;
    const audio = context();
    if (!audio || !master) return;
    const length = Math.max(1, Math.floor(audio.sampleRate * dur));
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = audio.createBufferSource();
    source.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    const amp = audio.createGain();
    amp.gain.value = gain;
    source.connect(filter);
    filter.connect(amp);
    amp.connect(master);
    source.start();
  }

  return {
    unlock() {
      unlocked = true;
      context();
    },
    setVolume(value: number) {
      volume = value;
      if (master) master.gain.value = value;
    },
    swing() {
      noise(0.05, 0.05, 1200);
    },
    hit() {
      tone(160 + Math.random() * 50, 0.09, "square", 0.06, -50);
      noise(0.05, 0.08, 700);
    },
    hurt() {
      tone(96, 0.16, "sawtooth", 0.05, -40);
    },
    dodge() {
      noise(0.08, 0.045, 500);
    },
    skill() {
      tone(210, 0.18, "triangle", 0.05, 160);
    },
    shrine() {
      tone(392, 0.16, "sine", 0.04);
      tone(523, 0.26, "sine", 0.035);
    },
    die() {
      tone(98, 0.55, "sawtooth", 0.07, -60);
    },
    pickup() {
      tone(620, 0.09, "sine", 0.04, 180);
    },
    whistle() {
      tone(780, 0.14, "sine", 0.035);
    },
    orin() {
      tone(46, 0.7, "sine", 0.09);
    },
    boss() {
      tone(70, 0.35, "triangle", 0.06, -20);
    },
  };
}
