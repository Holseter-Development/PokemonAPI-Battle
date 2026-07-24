// encounters.js — pure, data-driven wild-encounter tables per biome/region.
//
// Wild species are drawn from a biome table keyed by the map region a battle
// node sits in, so the three regions produce visibly different pools instead of
// one flat 1–151 roll. Everything here is pure and seedable: the controller
// feeds a run's RNG into `pickEncounter`, so a saved seed + path reproduces the
// same species. No DOM, no network, no battle logic.

import { GEN1_MAX_ID } from "./data.js";
import { weightedPick } from "./rng.js";

// Gen 1 legendaries / mythicals kept out of ordinary wild pools. The pseudo-
// legendary Dratini line is intentionally NOT here — Dratini is an authored
// rare on the Indigo Summit table.
export const LEGENDARY_IDS = new Set([144, 145, 146, 150, 151]);

// Relative encounter weights. Commons dominate; rares are a treat.
const C = 20; // common
const U = 12; // uncommon
const R = 4;  // rare

// Biome tables keyed by 0-based region index. Each entry:
//   id       — National Dex number (1..151)
//   weight   — relative encounter weight (higher = more common)
//   minDepth — earliest run depth (visited node count) it can appear (default 0)
//   maxDepth — latest run depth, inclusive (default: no cap)
//   tags     — freeform labels for future rules (rarity, biome flavor)
export const BIOMES = {
  0: {
    region: 0,
    name: "Viridian Wilds",
    entries: [
      { id: 10, weight: C, minDepth: 0, tags: ["common", "bug"] },      // Caterpie
      { id: 13, weight: C, minDepth: 0, tags: ["common", "bug"] },      // Weedle
      { id: 16, weight: C, minDepth: 0, tags: ["common", "flying"] },   // Pidgey
      { id: 19, weight: C, minDepth: 0, tags: ["common", "normal"] },   // Rattata
      { id: 29, weight: U, minDepth: 0, tags: ["common", "poison"] },   // Nidoran♀
      { id: 32, weight: U, minDepth: 0, tags: ["common", "poison"] },   // Nidoran♂
      { id: 25, weight: R, minDepth: 1, tags: ["rare", "electric"] },   // Pikachu
      { id: 1,  weight: R, minDepth: 1, tags: ["rare", "grass"] },      // Bulbasaur
    ],
  },
  1: {
    region: 1,
    name: "Crimson Highlands",
    entries: [
      { id: 74,  weight: C, minDepth: 0, tags: ["common", "rock"] },     // Geodude
      { id: 66,  weight: C, minDepth: 0, tags: ["common", "fighting"] }, // Machop
      { id: 58,  weight: U, minDepth: 0, tags: ["common", "fire"] },     // Growlithe
      { id: 77,  weight: U, minDepth: 0, tags: ["common", "fire"] },     // Ponyta
      { id: 104, weight: C, minDepth: 0, tags: ["common", "ground"] },   // Cubone
      { id: 95,  weight: R, minDepth: 0, tags: ["rare", "rock"] },       // Onix
      { id: 4,   weight: R, minDepth: 0, tags: ["rare", "fire"] },       // Charmander
    ],
  },
  2: {
    region: 2,
    name: "Indigo Summit",
    entries: [
      { id: 92,  weight: C, minDepth: 0, tags: ["common", "ghost"] },     // Gastly
      { id: 81,  weight: C, minDepth: 0, tags: ["common", "electric"] },  // Magnemite
      { id: 111, weight: U, minDepth: 0, tags: ["common", "ground"] },    // Rhyhorn
      { id: 86,  weight: C, minDepth: 0, tags: ["common", "water"] },     // Seel
      { id: 147, weight: R, minDepth: 0, tags: ["rare", "dragon"] },      // Dratini
      { id: 131, weight: R, minDepth: 0, tags: ["rare", "water"] },       // Lapras
      { id: 133, weight: R, minDepth: 0, tags: ["rare", "normal"] },      // Eevee
    ],
  },
};

const REGION_COUNT = Object.keys(BIOMES).length;

function clampRegion(r) {
  return Math.max(0, Math.min(REGION_COUNT - 1, r | 0));
}

// Which region a wild pick should use: prefer the node's own region, fall back
// to the run's current node, then to the first biome. Keeps hatched-egg and
// recruit encounters (which have no explicit node) sane.
function regionFor(node, run) {
  if (node && Number.isInteger(node.region)) return clampRegion(node.region);
  const pos = run && run.position && run.map && run.map.nodes ? run.map.nodes[run.position] : null;
  if (pos && Number.isInteger(pos.region)) return clampRegion(pos.region);
  return 0;
}

// The biome table for a battle node (or the run's current region).
export function encounterTableFor(node, run) {
  return BIOMES[regionFor(node, run)] || BIOMES[0];
}

// Entries whose [minDepth, maxDepth] window contains `depth`. Falls back to the
// whole table if nothing matches, so a route always has something to fight.
export function eligibleEntries(table, depth = 0) {
  const inWindow = table.entries.filter(
    (e) => depth >= (e.minDepth ?? 0) && depth <= (e.maxDepth ?? Infinity),
  );
  return inWindow.length ? inWindow : table.entries;
}

// Weighted, seeded pick of one encounter entry from a biome table.
export function pickEncounter(rng, table, depth = 0) {
  const pool = eligibleEntries(table, depth);
  return weightedPick(rng, pool.map((e) => ({ item: e, weight: e.weight })));
}

// A safe default species when no node/table context is available.
export function defaultSpeciesId() {
  return BIOMES[0].entries[0].id;
}

// Structural validation of the biome tables. Returns an array of error strings
// (empty when everything is well-formed). Checked by tests, not at runtime.
export function validateBiomes(biomes = BIOMES) {
  const errors = [];
  for (const key of Object.keys(biomes)) {
    const table = biomes[key];
    if (!table || !Array.isArray(table.entries) || table.entries.length === 0) {
      errors.push(`region ${key}: no entries`);
      continue;
    }
    for (const e of table.entries) {
      if (!Number.isInteger(e.id) || e.id < 1 || e.id > GEN1_MAX_ID)
        errors.push(`region ${key}: id ${e.id} out of 1..${GEN1_MAX_ID}`);
      if (LEGENDARY_IDS.has(e.id))
        errors.push(`region ${key}: legendary id ${e.id} not allowed in wild pool`);
      if (!(typeof e.weight === "number" && e.weight > 0))
        errors.push(`region ${key}: id ${e.id} weight must be > 0`);
      const min = e.minDepth ?? 0;
      const max = e.maxDepth ?? Infinity;
      if (min < 0) errors.push(`region ${key}: id ${e.id} negative minDepth`);
      if (min > max) errors.push(`region ${key}: id ${e.id} minDepth > maxDepth`);
    }
    // At least one entry must be genuinely valid at the region's opening depth,
    // so every route always offers a reachable encounter.
    const reachable = table.entries.some(
      (e) => (e.minDepth ?? 0) <= 0 && 0 <= (e.maxDepth ?? Infinity),
    );
    if (!reachable) errors.push(`region ${key}: no encounter reachable at depth 0`);
  }
  return errors;
}
