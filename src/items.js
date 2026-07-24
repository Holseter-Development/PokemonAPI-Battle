// items.js - held items: one equippable item per Pokémon that bends battle
// rules. Pure data + pure helpers so the same normalized effects run on the
// authoritative server. Mirrors the mutations/sigils pattern: a catalogue of
// definitions plus a single normalized effect object the battle engine reads,
// derived from a mon's `heldItemId`. Because every hook reads the effect off the
// mon itself (never a player-only context), enemy-held items on bosses work
// through the exact same code path.

// The held-item catalogue. Each entry contributes a partial of the normalized
// effect object from `emptyHeldEffects()`.
export const HELD_ITEMS = {
  leftovers: {
    name: "Leftovers", rarity: "uncommon",
    desc: "Restores 1/16 max HP at the end of each turn.",
    effects: { endTurnHealFrac: 1 / 16 },
  },
  charcoal: {
    name: "Charcoal", rarity: "uncommon",
    desc: "Boosts the holder's Fire-type moves by 20%.",
    effects: { damageTypeMult: { fire: 1.2 } },
  },
  "mystic-water": {
    name: "Mystic Water", rarity: "uncommon",
    desc: "Boosts the holder's Water-type moves by 20%.",
    effects: { damageTypeMult: { water: 1.2 } },
  },
  "miracle-seed": {
    name: "Miracle Seed", rarity: "uncommon",
    desc: "Boosts the holder's Grass-type moves by 20%.",
    effects: { damageTypeMult: { grass: 1.2 } },
  },
  "focus-band": {
    name: "Focus Band", rarity: "rare",
    desc: "Small chance to survive a lethal hit at 1 HP.",
    effects: { surviveLethalChance: 0.1 },
  },
  "quick-claw": {
    name: "Quick Claw", rarity: "rare",
    desc: "Small chance to move first within the same priority bracket.",
    effects: { quickClawChance: 0.2 },
  },
};

// The neutral baseline: a mon with no item (or an unknown id) reads as this.
export function emptyHeldEffects() {
  return {
    endTurnHealFrac: 0,
    damageTypeMult: {},
    surviveLethalChance: 0,
    quickClawChance: 0,
  };
}

// Normalized effects for a mon's currently-held item. Pure: never mutates the
// mon, always returns a fresh object, and is a safe no-op for a mon with no
// item. This is the one helper the engine calls to derive item behavior.
export function heldItemEffects(mon) {
  const out = emptyHeldEffects();
  const def = mon && mon.heldItemId ? HELD_ITEMS[mon.heldItemId] : null;
  if (!def) return out;
  const e = def.effects;
  if (e.endTurnHealFrac) out.endTurnHealFrac = e.endTurnHealFrac;
  if (e.damageTypeMult) {
    for (const [t, m] of Object.entries(e.damageTypeMult)) {
      out.damageTypeMult[t] = (out.damageTypeMult[t] || 1) * m;
    }
  }
  if (e.surviveLethalChance) out.surviveLethalChance = e.surviveLethalChance;
  if (e.quickClawChance) out.quickClawChance = e.quickClawChance;
  return out;
}

// ---- catalogue helpers (for UI / reward pools) -------------------------

export function isHeldItem(id) {
  return !!HELD_ITEMS[id];
}
export function heldItemName(id) {
  return HELD_ITEMS[id]?.name || null;
}
export function heldItemDef(id) {
  return HELD_ITEMS[id] || null;
}
export function heldItemList() {
  return Object.keys(HELD_ITEMS).map((id) => ({ id, ...HELD_ITEMS[id] }));
}
