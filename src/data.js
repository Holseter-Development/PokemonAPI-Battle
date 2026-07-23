// data.js — static game data: type chart, colours, trainers, and the
// generic PokéAPI-move → game-move translator. Kept DOM-free and importable
// from both the browser bundle and the headless test harness.

export const GEN1_MAX_ID = 151;
export const VERSION_GROUPS_GEN1 = ["red-blue", "yellow"];

// Gen-1 type effectiveness chart (attacker → defender multipliers).
export const CHART = {
  normal: { rock: 0.5, ghost: 0 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: {
    fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2,
    flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5,
  },
  ice: { fire: 0.5, water: 0.5, ice: 0.5, grass: 2, ground: 2, flying: 2, dragon: 2 },
  fighting: {
    normal: 2, ice: 2, rock: 2, poison: 0.5, flying: 0.5,
    psychic: 0.5, bug: 0.5, ghost: 0,
  },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5 },
  ground: { fire: 2, electric: 2, poison: 2, rock: 2, bug: 0.5, flying: 0 },
  flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5 },
  bug: {
    grass: 2, psychic: 2, fire: 0.5, fighting: 0.5,
    poison: 0.5, flying: 0.5, ghost: 0.5,
  },
  rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5 },
  ghost: { ghost: 2, normal: 0, psychic: 0 },
  dragon: { dragon: 2 },
};

export const TYPES = Object.keys(CHART);

// Vivid accent colour per type — used for badges, sparks and HUD glow.
export const TYPE_COLOR = {
  normal: "#a8a878",
  fire: "#f0803c",
  water: "#4d90d5",
  grass: "#5fbd58",
  electric: "#f6c744",
  ice: "#74cec0",
  fighting: "#d3425f",
  poison: "#b763cf",
  ground: "#dd7748",
  flying: "#8cadf0",
  psychic: "#f65888",
  bug: "#93b900",
  rock: "#c2ae6e",
  ghost: "#6c5a94",
  dragon: "#7266d8",
};

// Two-stop background gradient per type for the arena backdrop.
export const TYPE_BG = {
  normal: ["#3a4152", "#20252f"],
  fire: ["#6b2116", "#2a1410"],
  water: ["#173a63", "#0d1c33"],
  grass: ["#1f5230", "#0e2417"],
  electric: ["#5a4a10", "#241d08"],
  ice: ["#1e4a5c", "#0d2029"],
  fighting: ["#5a2230", "#241016"],
  poison: ["#4a2159", "#1f0e26"],
  ground: ["#5a4322", "#241a0e"],
  flying: ["#26386b", "#0e1730"],
  psychic: ["#5c2145", "#26101d"],
  bug: ["#3f4d10", "#1a2008"],
  rock: ["#4a4436", "#201d16"],
  ghost: ["#2a2149", "#120e21"],
  dragon: ["#26316b", "#0e1330"],
};

export const STATUS_LABEL = {
  brn: "BRN", par: "PAR", psn: "PSN", tox: "TOX", slp: "SLP", frz: "FRZ",
};
export const STATUS_COLOR = {
  brn: "#f08030", par: "#f8d030", psn: "#a040a0",
  tox: "#a040a0", slp: "#8898a8", frz: "#98d8d8",
};

// PokéAPI ailment name → internal status code.
export const AILMENT_MAP = {
  burn: "brn", paralysis: "par", poison: "psn",
  "bad-poison": "tox", sleep: "slp", freeze: "frz",
};

// PokéAPI stat name → internal stage key.
export const STAT_KEY = {
  attack: "atk",
  defense: "def",
  "special-attack": "spa",
  "special-defense": "spd",
  "special": "spa", // Gen-1 lumps special together; map to spa
  speed: "spe",
  accuracy: "acc",
  evasion: "eva",
};

// Status/support moves worth teaching an AI-controlled or player mon, ranked.
// Used to guarantee at least one utility move in a learned set when available.
export const PRIORITY_STATUS_MOVES = new Set([
  "swords-dance", "amnesia", "growth", "sharpen", "meditate", "agility",
  "recover", "soft-boiled", "rest",
  "thunder-wave", "toxic", "sleep-powder", "spore", "stun-spore",
  "hypnosis", "sing", "lovely-kiss", "glare", "confuse-ray",
  "double-team", "minimize", "reflect", "light-screen", "leech-seed",
]);

// Trainer roster — milestone battles between wild encounters. Each entry lists
// species ids and a level offset applied on top of the current difficulty.
export const TRAINERS = [
  {
    name: "Youngster Joey",
    title: "Youngster",
    intro: "Youngster Joey wants to battle!",
    team: [16, 19, 21], // Pidgey, Rattata, Spearow
    reward: { money: 200, balls: 2 },
    badge: null,
  },
  {
    name: "Lass Dana",
    title: "Lass",
    intro: "Lass Dana challenges you!",
    team: [43, 69, 63], // Oddish, Bellsprout, Abra
    reward: { money: 320, potions: 2 },
    badge: null,
  },
  {
    name: "Bug Catcher Rick",
    title: "Bug Catcher",
    intro: "Bug Catcher Rick sends out his swarm!",
    team: [13, 48, 123, 127], // Weedle, Venonat, Scyther, Pinsir
    reward: { money: 400, balls: 3 },
    badge: null,
  },
  {
    name: "Hiker Bruno",
    title: "Hiker",
    intro: "Hiker Bruno blocks the path!",
    team: [74, 95, 111, 106], // Geodude, Onix, Rhyhorn, Hitmonlee
    reward: { money: 500, potions: 3 },
    badge: "Boulder",
  },
  {
    name: "Ace Trainer Iris",
    title: "Ace Trainer",
    intro: "Ace Trainer Iris means business!",
    team: [59, 65, 130, 149], // Arcanine, Alakazam, Gyarados, Dragonite
    reward: { money: 900, hyperPotions: 1, balls: 5 },
    badge: "Champion",
  },
];

// Fallback move used when a Pokémon somehow has no valid learnset.
export const STRUGGLE = {
  name: "Struggle",
  key: "struggle",
  power: 50,
  accuracy: 100,
  type: "normal",
  damage_class: "physical",
  pp: 1,
  ppLeft: 1,
  priority: 0,
  category: "damage",
  drain: -25, // recoil
  healing: 0,
  minHits: 1,
  maxHits: 1,
  statChanges: [],
  statChance: 0,
  flinchChance: 0,
  ailment: "none",
  ailmentChance: 0,
  highCrit: false,
  target: "opponent",
};

// Convert a raw PokéAPI move object into the compact game-move shape, capturing
// enough metadata for the engine's generic effect resolver.
export function buildMove(md) {
  const meta = md.meta || {};
  const cat = meta.category?.name || (md.power ? "damage" : "net-good-stats");
  const dmgClass = md.damage_class?.name || "status";
  const statChanges = (md.stat_changes || [])
    .map((s) => ({ stat: STAT_KEY[s.stat.name] || null, change: s.change }))
    .filter((s) => s.stat);
  // Self-targeting utility (setup, heal) vs opponent-targeting.
  const tgt = md.target?.name || "selected-pokemon";
  const selfTarget = tgt === "user" || tgt === "users-field";
  return {
    name: cap(md.name.replace(/-/g, " ")),
    key: md.name,
    power: md.power || 0,
    accuracy: md.accuracy == null ? 100 : md.accuracy,
    type: md.type?.name || "normal",
    damage_class: dmgClass,
    pp: md.pp || 20,
    ppLeft: md.pp || 20,
    priority: md.priority || 0,
    category: cat,
    drain: meta.drain || 0, // + heals attacker, - is recoil
    healing: meta.healing || 0, // % of max hp healed (recover etc.)
    minHits: meta.min_hits || 1,
    maxHits: meta.max_hits || 1,
    statChanges,
    statChance: meta.stat_chance || 0,
    flinchChance: meta.flinch_chance || 0,
    ailment: meta.ailment?.name || "none",
    ailmentChance: meta.ailment_chance || 0,
    highCrit: !!(meta.crit_rate && meta.crit_rate > 0),
    selfTarget,
    isOHKO: cat === "ohko",
  };
}

export function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
