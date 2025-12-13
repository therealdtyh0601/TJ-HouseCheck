/* ---------------------------------------------------------
   TerraEngine — Free Tier Spatial Reflection Engine
   Feng Shui app (internally true)
   Tian Ji logic engine (structurally intact)
   Descriptive, non-prescriptive output
--------------------------------------------------------- */

const TerraEngine = {

  /* ------------------------------
     Load Hexagram Data (64)
  ------------------------------ */
  async loadHexagrams() {
    if (this.hexagrams) return this.hexagrams;

    const res = await fetch("assets/data/hexagrams64.json");
    this.hexagrams = await res.json();
    return this.hexagrams;
  },

  /* ------------------------------
     Direction → Base Gua Key
     (Internal structural mapping)
  ------------------------------ */
  directionToKey(direction) {
    const map = {
      N: 1,   // 坎
      NE: 2,  // 艮
      E: 3,   // 震
      SE: 4,  // 巽
      S: 5,   // 離
      SW: 6,  // 坤
      W: 7,   // 兌
      NW: 8,  // 乾
      C: 1    // fallback / centre
    };
    return map[direction] || 1;
  },

  /* ------------------------------
     Room Type Feng Shui Lens
     (Cliché + advice-in-disguise)
  ------------------------------ */
  roomTypeLens(roomType) {
    const lens = {
      "Bedroom":
        "As a bedroom, this influence often shows up through sleep quality, ease of rest, and how easily the body and mind can truly settle here.",

      "Living Room":
        "As a living room, this influence tends to appear through conversation flow, emotional tone, and how people naturally interact in this space.",

      "Study / Office":
        "As a study or work space, this influence often affects focus, mental pressure, productivity, and how sustained effort feels here.",

      "Kitchen":
        "As a kitchen, this influence commonly appears through activity level, emotional tension, appetite, and the pace of daily routines.",

      "Other":
        "In this type of space, the influence tends to surface subtly through habits, background mood, and day-to-day experience."
    };

    return lens[roomType] || lens["Other"];
  },

  /* ------------------------------
     Relationship Spillover Lens
  ------------------------------ */
  relationshipLens(shared, relation) {
    if (shared) {
      return `Because this space is shared, the influence is more likely to directly shape day-to-day interactions with your ${relation}.`;
    }
    return `Even if not shared, this space may still subtly affect how this person relates to your ${relation} through indirect emotional carryover.`;
  },

  /* ------------------------------
     MAIN ENTRY — Get Room Reading
  ------------------------------ */
  async getRoomReading({
    direction,
    roomSeed = 1,
    roomType = "Other",
    role = "you",
    relation = "family",
    shared = false
  }) {

    const hexagrams = await this.loadHexagrams();

    /* ------------------------------
       Hexagram Selection Logic
       (Stable, Free-tier safe)
    ------------------------------ */
    const baseKey = this.directionToKey(direction);
    const hexNumber = ((baseKey + roomSeed - 1) % 64) + 1;
    const hex = hexagrams.find(h => h.number === hexNumber);

    if (!hex) {
      return {
        summary: "This space carries a mixed and unclear influence.",
        homeImpact: "The influence here is subtle and difficult to define clearly.",
        relationshipImpact: "Relationship effects are present but indistinct."
      };
    }

    /* ------------------------------
       Compose Final Output
    ------------------------------ */
    const roomLensText = this.roomTypeLens(roomType);
    const relationshipText = this.relationshipLens(shared, relation);

    return {
      summary: hex.summary,
      homeImpact: `${hex.homeImpact} ${roomLensText}`,
      relationshipImpact: relationshipText,
      meta: {
        hexagram: hex.number,
        energy: hex.energy
      }
    };
  }
};

/* ------------------------------
   Expose Engine Globally
------------------------------ */
window.TerraEngine = TerraEngine;
