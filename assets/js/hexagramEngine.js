/* -------------------------------------------------------------
   hexagramEngine.js — Lumi Terra 64-hexagram Engine (SIM Ready)

   Provides:
   - FreeMode: direction → 8 hexagrams
   - ProMode: direction + SIM → 64 hexagrams
   - JSON-driven output
------------------------------------------------------------- */

const HexagramEngine = (() => {

  let hexData = null; // Stores loaded 64-gua JSON results

  /* ---------------------------------------------------------
     LOAD JSON FILE
  --------------------------------------------------------- */
  async function loadHexagramJSON() {
    if (hexData) return hexData;

    try {
      const res = await fetch("assets/data/hexagrams64.json");
      hexData = await res.json();
      return hexData;
    } catch (err) {
      console.error("Hexagram JSON failed to load:", err);
      return null;
    }
  }

  /* ---------------------------------------------------------
     FREE TIER — 8 DIRECTIONS → 8 HEXAGRAMS
     (Simple, user-friendly mapping)
  --------------------------------------------------------- */
  const freeDirectionMap = {
    N: 2,   // 坤
    NE: 24, // 复
    E: 11,  // 泰
    SE: 32, // 恒
    S: 1,   // 乾
    SW: 46, // 升
    W: 12,  // 否
    NW: 33  // 遁
  };

  /* ---------------------------------------------------------
     SIM → LOWER TRIGRAM
     (Space Intention Model)
  --------------------------------------------------------- */
  const simToTrigram = {
    stability: "坤",
    career: "震",
    health: "巽",
    inner: "坎",
    growth: "艮",
    visibility: "離",
    harmony: "兌",
    purpose: "乾"
  };

  /* ---------------------------------------------------------
     DIRECTION → UPPER TRIGRAM
  --------------------------------------------------------- */
  const directionToTrigram = {
    N: "坎",
    NE: "艮",
    E: "震",
    SE: "巽",
    S: "離",
    SW: "坤",
    W: "兌",
    NW: "乾"
  };

  /* ---------------------------------------------------------
     64-GUA MATRIX (Upper x Lower)
     Correct King Wen 64 Hexagram Grid
  --------------------------------------------------------- */
  const hex64 = {
    "坤": { "坤":2, "震":16, "坎":8, "巽":20, "乾":23, "艮":35, "離":45, "兌":12 },
    "震": { "坤":24,"震":51,"坎":3, "巽":42, "乾":25, "艮":21, "離":17, "兌":27 },
    "坎": { "坤":7, "震":4, "坎":29,"巽":59, "乾":6,  "艮":64, "離":47, "兌":40 },
    "巽": { "坤":46,"震":32,"坎":48,"巽":57, "乾":18, "艮":53,"離":50, "兌":28 },
    "乾": { "坤":15,"震":62,"坎":39,"巽":61, "乾":1,  "艮":33,"離":30, "兌":13 },
    "艮": { "坤":36,"震":52,"坎":60,"巽":56, "乾":26, "艮":22,"離":63, "兌":41 },
    "離": { "坤":3, "震":55,"坎":63,"巽":37, "乾":14,"艮":30,"離":34,"兌":38 },
    "兌": { "坤":45,"震":17,"坎":47,"巽":28, "乾":31,"艮":26,"離":49,"兌":58 }
  };

  /* ---------------------------------------------------------
     FORMAT JSON RESULT → UI
  --------------------------------------------------------- */
  function formatResult(hex) {
    return {
      hexagramNumber: hex.number || "",
      hexagramName: hex.name || "",
      summary: hex.summary || "",
      impact: hex.homeImpact || hex.impact || "",
      adjustments: hex.adjustments || hex.recommendations || "",
      energy: hex.energy || hex.focus || ""
    };
  }

  /* ---------------------------------------------------------
     FREE MODE — get 1 of 8 hexagrams
  --------------------------------------------------------- */
  async function getResult(direction) {
    await loadHexagramJSON();

    const hexNum = freeDirectionMap[direction];
    if (!hexNum) return null;

    const hex = hexData.find(h => h.number === hexNum);
    if (!hex) return null;

    return formatResult(hex);
  }

  /* ---------------------------------------------------------
     PRO MODE — 64-Gua logic
     Direction → Upper Trigram
     SIM → Lower Trigram
     Matrix → Hexagram Number
  --------------------------------------------------------- */
  async function getProResult(direction, simKey) {
    await loadHexagramJSON();

    const upper = directionToTrigram[direction];
    const lower = simToTrigram[simKey];

    if (!upper || !lower) {
      console.warn("Invalid trigram input:", { upper, lower });
      return null;
    }

    const hexNum = hex64[upper][lower];
    if (!hexNum) return null;

    const hex = hexData.find(h => h.number === hexNum);
    if (!hex) return null;

    return formatResult(hex);
  }

  /* ---------------------------------------------------------
     EXPORT
  --------------------------------------------------------- */
  return {
    getResult,
    getProResult
  };

})();
