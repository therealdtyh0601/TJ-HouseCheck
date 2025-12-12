/* -------------------------------------------------------------
   hexagramEngine.js — Lumi Terra 64 Hexagram Engine
   Loads JSON → maps direction → returns formatted result.
   Direction logic is intentionally simple for now (Free Tier).
------------------------------------------------------------- */

const HexagramEngine = (() => {
  let hexData = null;

  /* ---------------------------------------------
     LOAD JSON (auto-load once on start)
  --------------------------------------------- */
  async function loadHexagramJSON() {
    if (hexData) return hexData; // already loaded

    try {
      const response = await fetch("assets/data/hexagrams64.json");
      hexData = await response.json();
      return hexData;
    } catch (err) {
      console.error("Failed to load hexagram JSON:", err);
      return null;
    }
  }

  /* ---------------------------------------------
     MAPPING (simple version for Free Tier)
     🔮 You can change this mapping anytime.
     Right now: 8 directions → 8 hexagrams.
     Pro/Elite later can use 64 logic.
  --------------------------------------------- */
  const directionToHexagram = {
    N: 2,   // 坤
    NE: 24, // 复
    E: 11,  // 泰
    SE: 32, // 恒
    S: 1,   // 乾
    SW: 46, // 升
    W: 12,  // 否
    NW: 33  // 遁
  };

  /* ---------------------------------------------
     GET HEXAGRAM RESULT
     Return a unified formatted object for UI.
  --------------------------------------------- */
  async function getResult(direction) {
    await loadHexagramJSON();

    if (!hexData) return null;

    const hexNumber = directionToHexagram[direction];
    if (!hexNumber) return null;

    const hex = hexData.find(h => h.number === hexNumber);
    if (!hex) return null;

    return {
      hexagramNumber: hex.number || "",
      hexagramName: hex.name || "",
      summary: hex.summary || "",
      impact: hex.homeImpact || hex.impact || "",
      adjustments: hex.adjustments || hex.recommendations || "",
      energy: hex.energy || hex.focus || ""
    };
  }

  return { getResult };
})();
