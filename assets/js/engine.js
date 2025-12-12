// ---------------------------------------------------------
// LUMI TERRA ENGINE — 64 Hex + Relationship Layer
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

    // Direction → Palace
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

    // Palace → 8 hexagram numbers (can tweak later)
    palaceToHexagrams(palace) {
      const pools = {
        "乾": [1, 43, 14, 34, 9, 5, 26, 11],
        "兌": [58, 17, 47, 28, 41, 61, 60, 38],
        "離": [30, 56, 50, 55, 49, 13, 37, 22],
        "震": [51, 21, 25, 42, 3, 27, 24, 17],
        "巽": [57, 53, 48, 18, 46, 20, 37, 59],
        "坎": [29, 60, 63, 39, 8, 7, 47, 41],
        "艮": [52, 15, 39, 62, 31, 33, 56, 53],
        "坤": [2, 23, 8, 20, 16, 35, 45, 12]
      };
      return pools[palace] || [];
    },

    pickHexagram(hexList, roomSeed) {
      if (!hexList.length) return null;
      const i = Math.abs(roomSeed) % hexList.length;
      return hexList[i];
    },

    // Relationship text based on Palace + role + shared
    getRelationshipLayer(palace, role, sharedWithUser) {
      // normalize role
      const r = (role || "you").toLowerCase();

      const baseMap = {
        "乾": {
          self: "This space increases a sense of responsibility, drive and inner pressure to perform.",
          relation: "Between you and this person, it highlights roles, expectations and who takes the lead."
        },
        "兌": {
          self: "This space invites more playfulness, expression and social energy.",
          relation: "Between you and this person, it encourages light-hearted bonding and shared enjoyment."
        },
        "離": {
          self: "This space sharpens awareness and emotional sensitivity, making feelings more visible.",
          relation: "Between you and this person, it exposes unspoken topics and asks for honest conversations."
        },
        "震": {
          self: "This space activates movement, change and emotional reactions.",
          relation: "Between you and this person, it can trigger sudden shifts, wake-ups or small clashes that push growth."
        },
        "巽": {
          self: "This space supports thinking things through, planning and subtle emotional adjustments.",
          relation: "Between you and this person, it favours gentle conversations and soft negotiation instead of confrontations."
        },
        "坎": {
          self: "This space deepens emotion and inner reflection, sometimes bringing hidden worries to the surface.",
          relation: "Between you and this person, it can deepen emotional connection, but also reveal unprocessed feelings."
        },
        "艮": {
          self: "This space invites stillness, boundaries and a clearer sense of where you stop and others begin.",
          relation: "Between you and this person, it can bring calm and stability, but may also highlight distance or silence."
        },
        "坤": {
          self: "This space supports care, patience and a quieter, more receptive state of mind.",
          relation: "Between you and this person, it strengthens support, shared routines and a sense of being on the same team."
        }
      };

      const palaceText = baseMap[palace] || baseMap["坤"];

      // tweak based on role
      let roleLabel;
      switch (r) {
        case "partner":
          roleLabel = "your partner";
          break;
        case "child":
          roleLabel = "your child";
          break;
        case "parent":
          roleLabel = "your parent";
          break;
        case "elder":
          roleLabel = "an elder in the family";
          break;
        case "other":
          roleLabel = "this person";
          break;
        case "you":
        default:
          roleLabel = "you";
      }

      let personEffect = palaceText.self;
      let relationshipEffect;

      if (!sharedWithUser || r === "you") {
        // Only that person uses it (or it's your private room)
        relationshipEffect =
          r === "you"
            ? "This room mainly shapes your internal state first. Its effects on family show indirectly through how you show up in shared spaces."
            : `This room primarily shapes ${roleLabel}'s inner state. Its effect on your relationship shows indirectly through their mood and behaviour in common areas.`;
      } else {
        // Shared with user → relationship gets stronger effect
        relationshipEffect =
          palaceText.relation.replace("this person", roleLabel);
      }

      return { personEffect, relationshipEffect };
    },

    applySIMTag(result, simMode) {
      return { ...result, simTag: simMode || "general" };
    },

    // MAIN call for UI: one room reading
    async getRoomReading({ direction, simMode = "general", roomSeed = 0, role = "you", sharedWithUser = false }) {
      const palace = this.directionToPalace(direction);
      if (!palace) return { error: "Invalid direction" };

      const pool = this.palaceToHexagrams(palace);
      const hexNum = this.pickHexagram(pool, roomSeed);
      if (!hexNum) return { error: "No hexagram mapping" };

      const all = await this.loadHexagrams();
      const hex = all.find(h => Number(h.number) === Number(hexNum));
      if (!hex) return { error: "Hexagram not found in dataset" };

      const rel = this.getRelationshipLayer(palace, role, sharedWithUser);

      return {
        ...hex,
        palace,
        role,
        sharedWithUser,
        personEffect: rel.personEffect,
        relationshipEffect: rel.relationshipEffect,
        simTag: simMode
      };
    }
  };

  global.TerraEngine = TerraEngine;
})(window);
