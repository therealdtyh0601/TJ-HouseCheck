/* ---------------------------------------------------------
   LUMI TERRA APP CONTROLLER
   Connects UI → TerraEngine → Modal Output
--------------------------------------------------------- */

import { TerraEngine } from "./engine.js";

/* ------------------------------
   Button click → generate reading
------------------------------ */
document.getElementById("analyseBtn").addEventListener("click", async () => {

  // 1) Get user input
  const direction = document.getElementById("directionSelect").value;
  const simMode = document.getElementById("simSelect").value || "general";
  const roomIndex = Number(document.getElementById("roomIndex")?.value) || 0;

  // 2) Engine call
  const reading = await TerraEngine.getReading(direction, simMode, roomIndex);

  if (reading.error) {
    alert("Error: " + reading.error);
    return;
  }

  // 3) Insert into modal
  document.getElementById("reading-title").innerText =
    `${reading.number}｜${reading.name}`;

  document.getElementById("reading-summary").innerText =
    reading.summary;

  document.getElementById("reading-impact").innerText =
    reading.homeImpact;

  document.getElementById("reading-usage").innerText =
    reading.usage;

  document.getElementById("reading-energy").innerText =
    reading.energy;

  document.getElementById("reading-sim").innerText =
    reading.simTag;

  // 4) Show modal
  document.getElementById("readingModal").classList.add("show");
});
