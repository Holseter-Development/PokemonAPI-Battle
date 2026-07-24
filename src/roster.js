// roster.js - the portable bridge between singleplayer and the PvP "Arena".
// A roster is the serializable, battle-ready snapshot of a player's team that
// gets sent to the matchmaker. Kept pure and DOM-free so the *same* code can
// validate rosters on the authoritative server (see the multiplayer plan).

export const ROSTER_MAX = 6;
export const ROSTER_MIN = 1;
export const ARENA_LEVEL_CAP = 100;

// The parts of a Pokémon that make it *this* Pokémon rather than a fresh catch
// of the same species. Base stats are always recomputed from species + level, so
// they are deliberately absent here; everything below must survive leveling,
// evolution, and serialization. `mutations` is the source of truth for grafted
// stats/types/abilities (re-derived via applyMutationEffects); the rest are
// standalone identity. `heldItemId`, `nature`, and `training` are forward-compat
// slots for later P3 chunks and simply pass through when present.
export const IDENTITY_FIELDS = [
  "isShiny", "mutations", "abilities", "lifesteal", "trueStrike", "adaptive",
  "alpha", "heldItemId", "nature", "training",
];

function cloneField(v) {
  if (Array.isArray(v)) return v.map(cloneField);
  if (v && typeof v === "object") return JSON.parse(JSON.stringify(v));
  return v;
}

// Copy preserved identity from one mon onto another - used when a fresh mon is
// built for an evolution so it keeps the pre-evolution build. Arrays and objects
// are deep-cloned so the two mons never share mutable state.
export function carryIdentity(from, to) {
  if (!from || !to) return to;
  for (const key of IDENTITY_FIELDS) {
    const val = from[key];
    if (val === undefined || val === null) continue;
    to[key] = cloneField(val);
  }
  return to;
}

// Reduce a live battle mon to a clean, fully-healed transport snapshot.
export function snapshotMon(mon) {
  const snap = {
    id: mon.id,
    name: mon.name,
    level: mon.level,
    isShiny: !!mon.isShiny,
    types: mon.types.slice(),
    stats: {
      maxHp: mon.stats.maxHp,
      hp: mon.stats.maxHp, // enter the Arena at full health
      atk: mon.stats.atk,
      def: mon.stats.def,
      spa: mon.stats.spa,
      spd: mon.stats.spd,
      spe: mon.stats.spe,
    },
    base_exp: mon.base_exp,
    capture_rate: mon.capture_rate,
    spriteFront: mon.spriteFront,
    spriteBack: mon.spriteBack,
    artwork: mon.artwork,
    moves: (mon.moves || []).map((m) => ({
      name: m.name, key: m.key, power: m.power, accuracy: m.accuracy,
      type: m.type, damage_class: m.damage_class, pp: m.pp, ppLeft: m.pp,
      priority: m.priority || 0, category: m.category, drain: m.drain || 0,
      healing: m.healing || 0, minHits: m.minHits || 1, maxHits: m.maxHits || 1,
      statChanges: m.statChanges || [], statChance: m.statChance || 0,
      flinchChance: m.flinchChance || 0, ailment: m.ailment || "none",
      ailmentChance: m.ailmentChance || 0, highCrit: !!m.highCrit,
      selfTarget: !!m.selfTarget, isOHKO: !!m.isOHKO,
    })),
    // Battles start clean.
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 },
    status: { cond: "none", turns: 0, toxic: 0 },
  };
  // Preserve build identity (mutations, pseudo-abilities, held item, capture
  // metadata) so Vault/Arena mons keep their build across serialization. Only
  // present fields are copied so a plain-vanilla mon stays free of noise.
  carryIdentity(mon, snap);
  return snap;
}

// Build a roster from a party, keeping only healthy, valid members.
export function buildRoster(party) {
  return (party || [])
    .filter((m) => m && m.stats && m.moves && m.moves.length)
    .slice(0, ROSTER_MAX)
    .map(snapshotMon);
}

// Structural / fairness validation. The authoritative server runs the same
// checks (plus stat recomputation from base stats) to reject tampered teams.
export function validateRoster(roster, opts = {}) {
  const max = opts.max || ROSTER_MAX;
  const min = opts.min || ROSTER_MIN;
  const levelCap = opts.levelCap || ARENA_LEVEL_CAP;
  if (!Array.isArray(roster)) return { ok: false, reason: "Roster must be a list." };
  if (roster.length < min) return { ok: false, reason: "You need at least one Pokémon." };
  if (roster.length > max) return { ok: false, reason: `A team can have at most ${max}.` };
  for (const mon of roster) {
    if (!mon || typeof mon.id !== "number") return { ok: false, reason: "Malformed Pokémon in roster." };
    if (!(mon.level >= 1 && mon.level <= levelCap)) return { ok: false, reason: `${mon.name || "A Pokémon"} exceeds the level cap.` };
    if (!mon.stats || !(mon.stats.maxHp > 0)) return { ok: false, reason: `${mon.name || "A Pokémon"} has invalid stats.` };
    if (mon.stats.hp !== mon.stats.maxHp) return { ok: false, reason: `${mon.name} must enter at full HP.` };
    if (!Array.isArray(mon.moves) || !mon.moves.length) return { ok: false, reason: `${mon.name} has no moves.` };
    if (!mon.moves.some((m) => m.power > 0)) return { ok: false, reason: `${mon.name} needs at least one damaging move.` };
    if (!Array.isArray(mon.types) || !mon.types.length) return { ok: false, reason: `${mon.name} has no type.` };
  }
  return { ok: true, count: roster.length };
}

// A short, human-readable power rating used for display and (later) as a hint
// for skill-based matchmaking. Not authoritative.
export function rosterPower(roster) {
  if (!roster || !roster.length) return 0;
  let sum = 0;
  for (const m of roster) {
    const bst = m.stats.maxHp + m.stats.atk + m.stats.def + m.stats.spa + m.stats.spd + m.stats.spe;
    sum += m.level * 4 + bst;
  }
  return Math.round(sum / roster.length);
}
