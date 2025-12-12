// ---------------------------------------------------------
// Lumi BGM — simple floaty 30s-ish synth loop using Web Audio
// ---------------------------------------------------------
(function () {
  let audioCtx = null;
  let isPlaying = false;
  let mainGain, osc1, osc2, filter;

  function createPad() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    osc1 = audioCtx.createOscillator();
    osc2 = audioCtx.createOscillator();
    filter = audioCtx.createBiquadFilter();
    mainGain = audioCtx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    osc1.frequency.value = 220; // A3
    osc2.frequency.value = 330; // E4

    filter.type = "lowpass";
    filter.frequency.value = 1200;

    mainGain.gain.value = 0.0; // fade in

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(audioCtx.destination);

    osc1.start();
    osc2.start();

    // gentle random drift every few seconds
    function drift() {
      if (!isPlaying) return;
      const now = audioCtx.currentTime;
      const f1 = 200 + Math.random() * 40;
      const f2 = 320 + Math.random() * 40;
      osc1.frequency.linearRampToValueAtTime(f1, now + 4);
      osc2.frequency.linearRampToValueAtTime(f2, now + 4);
      setTimeout(drift, 4000);
    }
    drift();

    // Fade in over ~4s
    mainGain.gain.linearRampToValueAtTime(0.16, audioCtx.currentTime + 4);
  }

  function stopPad() {
    if (!audioCtx || !isPlaying) return;
    const now = audioCtx.currentTime;
    mainGain.gain.linearRampToValueAtTime(0.0, now + 2);
    setTimeout(() => {
      osc1.stop();
      osc2.stop();
      audioCtx.close();
      audioCtx = null;
    }, 2200);
  }

  const btn = document.getElementById("bgmToggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (!isPlaying) {
      if (!audioCtx) createPad();
      isPlaying = true;
      btn.textContent = "Pause BGM";
    } else {
      isPlaying = false;
      stopPad();
      btn.textContent = "Play BGM";
    }
  });
})();
