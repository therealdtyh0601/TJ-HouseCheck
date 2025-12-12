/* -------------------------------------------------------------
   ui.js — Lumi Terra UI Controller (WITH SIM)
   Handles:
   - Direction selection
   - SIM (Space Intention Model) selection
   - Calling Free 8-gua or Pro 64-gua engine
   - Modal display
   - BGM toggle
------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {

  /* ------------------------------
     ELEMENT REFERENCES
  ------------------------------ */
  const directionSelect = document.getElementById("directionSelect");
  const simCards = document.querySelectorAll(".sim-card");
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
     VARIABLES
  ------------------------------ */
  let selectedSIM = null; // user intention key
  let bgmPlaying = false;


  /* ------------------------------
     BGM TOGGLE
  ------------------------------ */
  bgmBtn?.addEventListener("click", () => {
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


  /* ------------------------------
     SIM CARD SELECTION
  ------------------------------ */
  simCards.forEach(card => {
    card.addEventListener("click", () => {
      // clear previous selection
      simCards.forEach(c => c.classList.remove("selected"));

      // highlight clicked one
      card.classList.add("selected");

      // store key
      selectedSIM = card.dataset.sim;
      console.log("SIM selected =", selectedSIM);
    });
  });


  /* ------------------------------
     MODAL CONTROL
  ------------------------------ */
  function openModal() {
    modal.classList.remove("hidden");
    modal.classList.add("show");
  }

  function closeModal() {
    modal.classList.remove("show");
    modal.classList.add("hidden");
  }

  closeModalBtn?.addEventListener("click", closeModal);

  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });


  /* ------------------------------
     ANALYZE BUTTON — MAIN LOGIC
  ------------------------------ */
  analyzeBtn.addEventListener("click", async () => {

    const direction = directionSelect.value;

    if (!direction) {
      alert("Please select your house direction first.");
      return;
    }

    // FREE MODE: No SIM selected
    if (!selectedSIM) {
      console.log("Running Free Mode → 8-gua logic");

      const result = await HexagramEngine.getResult(direction);

      if (!result) {
        alert("No data available for this direction.");
        return;
      }

      populateModal(result);
      openModal();
      return;
    }

    // PRO MODE: 64 GUA
    console.log("Running PRO Mode → 64-gua logic");
    const result = await HexagramEngine.getProResult(direction, selectedSIM);

    if (!result) {
      alert("No data found for this configuration.");
      return;
    }

    populateModal(result);
    openModal();
  });


  /* ------------------------------
     POPULATE MODAL
  ------------------------------ */
  function populateModal(res) {
    titleEl.textContent = `${res.hexagramName} (${res.hexagramNumber})`;
    summaryEl.textContent = res.summary || "—";
    impactEl.textContent = res.impact || "—";
    adjustmentsEl.textContent = res.adjustments || "—";
    energyEl.textContent = res.energy || "—";
  }

});
