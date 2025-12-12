// ---------------------------------------------------------
// LUMI TERRA ENGINE — single global engine
// Depends on: assets/data/hexagrams64.json
// ---------------------------------------------------------
(function (global) {
  const TerraEngine = {
    _cache: null,

    async loadHexagrams() {
      if (this._cache) return this._cache;
      const res = await fetch("assets/data/hexagrams64.json");
      this._cache = await res.json();
      return this._cache;
    },

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

    palaceToHexagrams(palace) {
      const pools = {
        "乾": [1, 43, 14, 34, 9, 5, 26, 11],
        "兌": [58, 17, 47, 28, 41, 61, 60, 38],
        "離": [30, 56, 50, 55, 49, 13, 37, 22],
        "震": [51, 21, 25, 42, 3, 27, 24, 17],
        "巽": [57, 53, 48, 18, 46, 20, 37, 59],
        "坎": [29, 60, 63, 39, 8, 7, 47, 41],
        "艮": [52, 15, 39, 53, 62, 31, 33, 56],
        "坤": [2, 23, 8, 20, 16, 35, 45, 12]
      };
      return pools[palace] || [];
    },

    pickHexagram(hexList, roomIndex) {
      if (!hexList.length) return null;
      const i = Math.abs(roomIndex) % hexList.length;
      return hexList[i];
    },

    applySIMTag(result, simMode) {
      return { ...result, simTag: simMode || "general" };
    },

    async getReading(direction, simMode, roomIndex = 0) {
      const palace = this.directionToPalace(direction);
      if (!palace) return { error: "Invalid direction" };

      const pool = this.palaceToHexagrams(palace);
      const number = this.pickHexagram(pool, roomIndex);
      if (!number) return { error: "No hexagram mapping" };

      const all = await this.loadHexagrams();
      const data = all.find(h => h.number === number);
      if (!data) return { error: "Hexagram not found in dataset" };

      return this.applySIMTag(data, simMode);
    }
  };

  global.TerraEngine = TerraEngine;
})(window);
