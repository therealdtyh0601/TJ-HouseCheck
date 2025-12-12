/* -------------------------------------------------------------
   ui.js — Lumi Terra UI Controller
   Handles:
   - Direction selection
   - Calling the hexagram engine
   - Displaying modal results
   - BGM toggle integration
------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {

  /* ------------------------------
     ELEMENT REFERENCES
  ------------------------------ */
  const directionSelect = document.getElementById("directionSelect");
  const analyzeBtn = document.getElementById("analyzeBtn");

  const modal = document.getElementById("resultModal");
  const closeModalBtn = document.getElementById("closeModal");

  const titleEl = document.getElementById("hexagramTitle");
  const summaryEl = document.getElementById("hexagramSummary");
  const impactEl = document.getElementById("impact");
  const adjustmentsEl = document.getElementById("adjustments");
  const energyEl = document.getElementById("energy");

  const bgmBtn = document.getElementById("bgmBtn");


  /* ------------------------------
     BGM TOGGLE
  ------------------------------ */
  let bgmPlaying = false;

  if (bgmBtn) {
    bgmBtn.addEventListener("click", () => {
      if (!bgmPlaying) {
        window.BgmEngine.start();
        bgmPlaying = true;
        bgmBtn.textContent = "🔊 BGM On";
      } else {
        window.BgmEngine.stop();
        bgmPlaying = false;
        bgmBtn.textContent = "🔈 BGM Off";
      }
    });
  }


  /* ------------------------------
     SHOW MODAL
  ------------------------------ */
  function openModal() {
    modal.classList.remove("hidden");
    modal.classList.add("show");
  }

  /* ------------------------------
     HIDE MODAL
  ------------------------------ */
  function closeModal() {
    modal.classList.remove("show");
    modal.classList.add("hidden");
  }

  closeModalBtn?.addEventListener("click", closeModal);

  // Clicking outside modal
  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });


  /* ------------------------------
     READ & ANALYZE FLOW
  ------------------------------ */
  analyzeBtn.addEventListener("click", () => {
    const direction = directionSelect.value;

    if (!direction) {
      alert("Please select your house direction first.");
      return;
    }

    // Call your engine (JSON-based)
    // Expecting: HexagramEngine.getResult(direction)
    const result = HexagramEngine.getResult(direction);

    if (!result) {
      alert("No data available for this direction.");
      return;
    }

    // Fill modal
    titleEl.textContent = `${result.hexagramName} (${result.hexagramNumber})`;
    summaryEl.textContent = result.summary || "—";
    impactEl.textContent = result.impact || "—";
    adjustmentsEl.textContent = result.adjustments || "—";
    energyEl.textContent = result.energy || "—";

    // Open modal
    openModal();
  });

});
