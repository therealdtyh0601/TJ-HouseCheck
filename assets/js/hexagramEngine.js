/* ---------------------------------------------------------
   LUMI TERRA ENGINE v3
   Direction → Palace → Hexagram → Interpretation
   Uses: hexagrams64.json (clean 1–64)
--------------------------------------------------------- */

export const TerraEngine = {

  /* -------------------------------------------
     1) Cardinal Directions → Palace Mapping
     (You can adjust this later if you refine
     Tian–Di–Ren or seasonal logic.)
  ------------------------------------------- */
  directionToPalace(direction) {
    const map = {
      "N": "坎",
      "NE": "艮",
      "E": "震",
      "SE": "巽",
      "S": "離",
      "SW": "坤",
      "W": "兌",
      "NW": "乾"
    };
    return map[direction] || null;
  },

  /* -------------------------------------------
     2) Palace → Hexagram Pool (Lumi Terra Logic)
     Each palace contains 8 hexagrams.
     Uses clean 1–64 set we built.
  ------------------------------------------- */
  palaceToHexagrams(palace) {
    const pools = {
      "乾": [1, 43, 14, 34, 9, 5, 26, 11],
      "兌": [58, 17, 47, 28, 41, 61, 60, 38],
      "離": [30, 56, 50, 38, 55, 49, 13, 37],
      "震": [51, 21, 17, 25, 42, 3, 27, 24],
      "巽": [57, 37, 53, 48, 18, 46, 5, 28],
      "坎": [29, 60, 63, 48, 39, 8, 7, 46],
      "艮": [52, 15, 39, 53, 62, 56, 31, 33],
      "坤": [2, 23, 8, 20, 16, 35, 45, 12]
    };
    return pools[palace] || [];
  },

  /* -------------------------------------------
     3) SIM Mode → Result Modifier
     (Free tier = NO modification, just tag)
     Later for Pro-tier we can implement
     weighting, deeper mapping, etc.
  ------------------------------------------- */
  applySIMTag(result, simMode) {
    return {
      ...result,
      simTag: simMode || "general"
    };
  },

  /* -------------------------------------------
     4) Pick Hexagram
     Deterministic: Use roomIndex for repeatability
  ------------------------------------------- */
  pickHexagram(hexList, roomIndex) {
    if (!hexList.length) return null;
    const i = roomIndex % hexList.length;
    return hexList[i];
  },

  /* -------------------------------------------
     5) Fetch Hexagram JSON
  ------------------------------------------- */
  async loadHexagrams() {
    const res = await fetch("assets/data/hexagrams64.json");
    return await res.json();
  },

  /* -------------------------------------------
     6) MAIN ENGINE
     direction = "N" | "SE" | "SW" etc.
     simMode   = "clarity" | "rest" | "persona" etc.
     roomIndex = numerical anchor (0–999)
  ------------------------------------------- */
  async getReading(direction, simMode, roomIndex = 0) {
    const palace = this.directionToPalace(direction);
    if (!palace) {
      return { error: "Invalid direction" };
    }

    const pool = this.palaceToHexagrams(palace);
    const hexNum = this.pickHexagram(pool, roomIndex);

    const allHex = await this.loadHexagrams();
    const data = allHex.find(h => h.number === hexNum);

    if (!data) {
      return { error: "Hexagram data missing" };
    }

    return this.applySIMTag(data, simMode);
  }
};
