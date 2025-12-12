/* --------------------------------------------------
   Lumi Terra · Terra-Domus Engine
   Free Edition — Direction → Gua → Hexagram
   No simulation · Deterministic · Client-side only
-------------------------------------------------- */

const TerraEngine = (() => {

  /* ------------------------------
     CONFIG
  ------------------------------ */

  const HEXAGRAM_JSON_PATH = "assets/data/hexagrams64.json";

  // Direction → Upper Gua (Later Heaven, simplified)
  const DIRECTION_TO_GUA = {
    N: "坎",
    NE: "艮",
    E: "震",
    SE: "巽",
    S: "离",
    SW: "坤",
    W: "兑",
    NW: "乾"
  };

  // Gua → related family role (象层，用于关系影响)
  const GUA_FAMILY_ROLE = {
    "乾": "Father / authority",
    "坤": "Mother / caregiver",
    "震": "Eldest son",
    "巽": "Eldest daughter",
    "坎": "Middle son",
    "离": "Middle daughter",
    "艮": "Youngest son",
    "兑": "Youngest daughter"
  };

  /* ------------------------------
     STATE
  ------------------------------ */

  let HEXAGRAMS = null;

  /* ------------------------------
     INTERNAL HELPERS
  ------------------------------ */

  async function loadHexagrams() {
    if (HEXAGRAMS) return HEXAGRAMS;

    const res = await fetch(HEXAGRAM_JSON_PATH);
    if (!res.ok) {
      throw new Error("Failed to load hexagrams64.json");
    }

    HEXAGRAMS = await res.json();
    return HEXAGRAMS;
  }

  function normalizeDirection(dir) {
    if (!dir) return null;
    return String(dir).toUpperCase();
  }

  function pickHexagramBySeed(seed) {
    // Deterministic mapping into 1–64
    const num = (seed % 64) + 1;
    return String(num);
  }

  function buildRelationshipEffect({
    gua,
    role,
    sharedWithUser
  }) {
    const guaRole = GUA_FAMILY_ROLE[gua] || "Family member";

    if (role === "you") {
      return `This space primarily reflects ${guaRole} energy back to you.`;
    }

    if (sharedWithUser) {
      return `This space may influence how you and this ${role} interact, especially through themes associated with ${guaRole}.`;
    }

    return `This space may subtly affect your relationship with this ${role} through ${guaRole}-type dynamics.`;
  }

  /* ------------------------------
     PUBLIC API
  ------------------------------ */

  async function getRoomReading({
    direction,
    simMode,
    roomSeed,
    role,
    sharedWithUser
  }) {

    // 1) Validate
    const dir = normalizeDirection(direction);
    if (!dir || !DIRECTION_TO_GUA[dir]) {
      return { error: "Invalid direction" };
    }

    // 2) Load data
    const hexData = await loadHexagrams();

    // 3) Map direction → gua
    const gua = DIRECTION_TO_GUA[dir];

    // 4) Pick hexagram deterministically
    const hexKey = pickHexagramBySeed(roomSeed);
    const hex = hexData[hexKey];

    if (!hex) {
      return { error: "Hexagram not found" };
    }

    // 5) Build output
    return {
      number: hex.number,
      name: hex.name,
      gua,
      summary: hex.summary || "",
      personEffect: hex.personEffect || "",
      relationshipEffect: buildRelationshipEffect({
        gua,
        role,
        sharedWithUser
      }),
      usage: hex.usage || "",
      energy: hex.energy || "",
      simTag: simMode || "general"
    };
  }

  /* ------------------------------
     EXPOSE
  ------------------------------ */

  return {
    getRoomReading
  };

})();

/* IMPORTANT: expose globally for GitHub Pages */
window.TerraEngine = TerraEngine;
