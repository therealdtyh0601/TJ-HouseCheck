// -------------------------------------------------------------
// BgmEngine — Star Rail Dreamscape Style (Original, 30s Loop)
// Generates soft pads + shimmer using Web Audio API.
// Exposed globally as window.BgmEngine
// -------------------------------------------------------------
(function () {
  let audioCtx = null;
  let masterGain = null;
  let isPlaying = false;
  let loopTimer = null;

  const LOOP_LENGTH = 30; // seconds

  function createContext() {
    if (audioCtx) return;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.0; // fade in later
    masterGain.connect(audioCtx.destination);
  }

  function midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  // 30s one-pass harmonic + texture arc
  // Times in seconds from loop start
  const chordTimeline = [
    // 0–5s  | Fmaj-ish pad (arrival)
    { start: 0, duration: 5, notes: [53, 60, 65] },   // F3, C4, F4

    // 5–12s | F → Am → Dm flow
    { start: 5, duration: 3, notes: [53, 60, 69] },   // Fmaj7-ish
    { start: 8, duration: 3, notes: [57, 60, 67] },   // Am7-ish
    { start: 11, duration: 4, notes: [50, 62, 69] },  // Dm9-ish

    // 12–18s | G → Em → F dreamy swell
    { start: 15, duration: 2.5, notes: [55, 62, 67] }, // Gadd9-ish
    { start: 17.5, duration: 2.5, notes: [52, 59, 64] }, // Em7-ish
    { start: 20, duration: 3, notes: [53, 60, 67] },     // F6add9-ish

    // 18–26s | Dm → Am → G calm descent
    { start: 23, duration: 3, notes: [50, 62, 69] },  // Dm9-ish
    { start: 26, duration: 3, notes: [57, 60, 67] },  // Am7-ish
    { start: 29, duration: 3, notes: [55, 62, 67] },  // Gsus2-ish

    // 26–30s effectively overlap into Fmaj landing again
    // but we return to F at the loop boundary harmonically.
  ];

  // A few one-shot shimmer notes (no micro-looping)
  const sparkleTimeline = [
    { time: 6, midi: 81 },  // A5
    { time: 13.5, midi: 79 }, // G5
    { time: 19.2, midi: 84 }, // C6
    { time: 24.7, midi: 83 }  // B5
  ];

  function schedulePadChord(baseTime, chord) {
    const { start, duration, notes } = chord;
    const chordStart = baseTime + start;
    const chordEnd = chordStart + duration + 1.5; // extra tail

    notes.forEach((midi, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.value = midiToFreq(midi) * (1 + (i - 1) * 0.003); // tiny detune

      gain.gain.setValueAtTime(0.0, chordStart);
      gain.gain.linearRampToValueAtTime(0.2, chordStart + 1.5); // slow fade in
      gain.gain.linearRampToValueAtTime(0.15, chordStart + duration);
      gain.gain.linearRampToValueAtTime(0.0, chordEnd);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(chordStart);
      osc.stop(chordEnd + 0.1);
    });
  }

  function scheduleSparkle(baseTime, sparkle) {
    const { time, midi } = sparkle;
    const noteStart = baseTime + time;
    const noteEnd = noteStart + 1.8;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(midiToFreq(midi), noteStart);

    gain.gain.setValueAtTime(0.0, noteStart);
    gain.gain.linearRampToValueAtTime(0.12, noteStart + 0.4);
    gain.gain.linearRampToValueAtTime(0.0, noteEnd);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(noteStart);
    osc.stop(noteEnd + 0.1);
  }

  function scheduleNoiseBed(baseTime) {
    const bufferSize = audioCtx.sampleRate * LOOP_LENGTH;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    // Gentle high-passed noise as space ambience
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.06;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 6000;

    const gain = audioCtx.createGain();
    gain.gain.value = 0.25;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noise.start(baseTime);
    noise.stop(baseTime + LOOP_LENGTH + 0.5);
  }

  function scheduleLoop() {
    if (!audioCtx) return;

    const baseTime = audioCtx.currentTime + 0.05;

    // Fade master in for the first loop
    masterGain.gain.cancelScheduledValues(baseTime);
    if (!isPlaying) {
      masterGain.gain.setValueAtTime(0.0, baseTime);
      masterGain.gain.linearRampToValueAtTime(0.6, baseTime + 4.0);
    }

    chordTimeline.forEach(chord => schedulePadChord(baseTime, chord));
    sparkleTimeline.forEach(sp => scheduleSparkle(baseTime, sp));
    scheduleNoiseBed(baseTime);

    // Schedule next loop re-plan
    loopTimer = setTimeout(() => {
      if (isPlaying) scheduleLoop();
    }, LOOP_LENGTH * 1000);
  }

  function start() {
    createContext();

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    if (isPlaying) return;
    isPlaying = true;

    scheduleLoop();
  }

  function stop() {
    if (!audioCtx || !isPlaying) return;

    isPlaying = false;
    if (loopTimer) {
      clearTimeout(loopTimer);
      loopTimer = null;
    }

    const t = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(t);
    masterGain.gain.setValueAtTime(masterGain.gain.value, t);
    masterGain.gain.linearRampToValueAtTime(0.0, t + 2.5);
  }

  window.BgmEngine = { start, stop };
})();
