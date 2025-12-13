const TerraEngine = {
  async loadHexagrams() {
    if (this.hexagrams) return this.hexagrams;
    const res = await fetch("assets/data/hexagrams64.json");
    this.hexagrams = await res.json();
    return this.hexagrams;
  },

  directionToKey(dir) {
    const map = {
      N: 1, NE: 2, E: 3, SE: 4,
      S: 5, SW: 6, W: 7, NW: 8,
      C: 1
    };
    return map[dir] || 1;
  },

  async getRoomReading({ direction, roomSeed, role, relation, shared }) {
    const hexagrams = await this.loadHexagrams();
    const base = this.directionToKey(direction);
    const hexNum = ((base + roomSeed - 1) % 64) + 1;

    const hex = hexagrams.find(h => h.number === hexNum);

    return {
      summary: hex.summary,
      homeImpact: hex.homeImpact,
      relationshipImpact: shared
        ? `Because this space is shared, the influence may more directly shape interactions with your ${relation}.`
        : `Even if not shared, this space may subtly affect how this person relates to the ${relation}.`
    };
  }
};

window.TerraEngine = TerraEngine;
