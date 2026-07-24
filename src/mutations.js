// mutations.js - the signature mechanic. Two families of run modifiers that
// bend Pokémon's own rules into a build-crafting sandbox:
//
//   • Mutations  - grafted onto a single Pokémon (extra type, stat spikes,
//                  pseudo-abilities, lifesteal, adaptive STAB). This is how you
//                  make monsters impossible in canon: a Fire/Dragon Charizard
//                  with Levitate.
//   • Sigils     - run-wide relics whose effects aggregate into one normalized
//                  object the battle engine reads (weather locks, entry hazards,
//                  Trick Room, crit ramps, lifesteal, and so on).
//
// Everything here is pure data + pure functions so the same code validates and
// simulates on the authoritative server.

export const RARITY = { common: "common", uncommon: "uncommon", rare: "rare", legendary: "legendary" };
export const RARITY_WEIGHT = { common: 100, uncommon: 55, rare: 22, legendary: 6 };
export const RARITY_COLOR = { common: "#b7c4d8", uncommon: "#5fd08a", rare: "#4db6ff", legendary: "#ffc23f" };

// ---- mutation helpers (operate on a live mon) --------------------------

function addType(mon, t) {
  if (!mon.types.includes(t)) {
    // Keep to a dual-type max; a graft replaces the secondary slot if full.
    if (mon.types.length >= 2) mon.types[1] = t;
    else mon.types.push(t);
  }
}
function scaleStats(mon, factors) {
  for (const [k, f] of Object.entries(factors)) {
    if (mon.stats[k] == null) continue;
    mon.stats[k] = Math.max(1, Math.floor(mon.stats[k] * f));
  }
  if (factors.maxHp) {
    mon.stats.hp = Math.min(mon.stats.hp, mon.stats.maxHp); // keep hp in range
  }
}
function addAbility(mon, tag) {
  if (!mon.abilities) mon.abilities = [];
  if (!mon.abilities.includes(tag)) mon.abilities.push(tag);
}

// The mutation catalogue. `apply(mon)` mutates the mon in place.
export const MUTATIONS = {
  // --- type grafts (uncommon): reshape offense (STAB) & defensive profile ---
  draconic:  { name: "Draconic",  rarity: "uncommon", desc: "Grafts the Dragon type.",   apply: (m) => addType(m, "dragon") },
  infernal:  { name: "Infernal",  rarity: "uncommon", desc: "Grafts the Fire type.",     apply: (m) => addType(m, "fire") },
  tidal:     { name: "Tidal",     rarity: "uncommon", desc: "Grafts the Water type.",    apply: (m) => addType(m, "water") },
  verdant:   { name: "Verdant",   rarity: "uncommon", desc: "Grafts the Grass type.",    apply: (m) => addType(m, "grass") },
  voltaic:   { name: "Voltaic",   rarity: "uncommon", desc: "Grafts the Electric type.", apply: (m) => addType(m, "electric") },
  spectral:  { name: "Spectral",  rarity: "uncommon", desc: "Grafts the Ghost type.",    apply: (m) => addType(m, "ghost") },
  toxic:     { name: "Toxic",     rarity: "uncommon", desc: "Grafts the Poison type.",   apply: (m) => addType(m, "poison") },
  frostbite: { name: "Frostbitten", rarity: "uncommon", desc: "Grafts the Ice type.",    apply: (m) => addType(m, "ice") },
  tectonic:  { name: "Tectonic",  rarity: "uncommon", desc: "Grafts the Ground type.",   apply: (m) => addType(m, "ground") },

  // --- stat grafts ---
  titan:   { name: "Titan",   rarity: "uncommon", desc: "+25% max HP, +20% Attack.",      apply: (m) => scaleStats(m, { maxHp: 1.25, atk: 1.2 }) },
  bulwark: { name: "Bulwark", rarity: "uncommon", desc: "+30% Defense & Sp. Defense.",    apply: (m) => scaleStats(m, { def: 1.3, spd: 1.3 }) },
  sprinter:{ name: "Sprinter",rarity: "uncommon", desc: "+35% Speed.",                     apply: (m) => scaleStats(m, { spe: 1.35 }) },
  mystic:  { name: "Mystic",  rarity: "uncommon", desc: "+30% Sp. Attack.",                apply: (m) => scaleStats(m, { spa: 1.3 }) },
  glasscannon: { name: "Glass Cannon", rarity: "rare", desc: "+40% Atk & Sp.Atk, −30% defenses.",
    apply: (m) => scaleStats(m, { atk: 1.4, spa: 1.4, def: 0.7, spd: 0.7 }) },

  // --- pseudo-abilities (rare): read by the battle engine in phase 2 ---
  levitator:  { name: "Levitator",  rarity: "rare", desc: "Levitate: immune to Ground moves.", apply: (m) => addAbility(m, "levitate") },
  regenerator:{ name: "Regenerator",rarity: "rare", desc: "Heals 1/3 HP when switched out.",    apply: (m) => addAbility(m, "regenerator") },
  berserker:  { name: "Berserker",  rarity: "rare", desc: "Guts: +50% Attack while statused.",  apply: (m) => addAbility(m, "guts") },
  multiscale: { name: "Aegis",      rarity: "rare", desc: "Takes half damage while at full HP.", apply: (m) => addAbility(m, "multiscale") },
  vampiric:   { name: "Vampiric",   rarity: "rare", desc: "Damaging moves drain 25% of damage.", apply: (m) => { m.lifesteal = Math.max(m.lifesteal || 0, 0.25); } },
  sharpshooter:{ name: "Sharpshooter", rarity: "rare", desc: "This Pokémon's moves never miss.",  apply: (m) => { m.trueStrike = true; } },
  adaptive:   { name: "Adaptive",   rarity: "rare", desc: "STAB is doubled (2× instead of 1.5×).", apply: (m) => { m.adaptive = true; } },

  // --- legendary chase ---
  primeval: { name: "Primeval", rarity: "legendary", desc: "+15% to every stat and Adaptive STAB.",
    apply: (m) => { scaleStats(m, { maxHp: 1.15, atk: 1.15, def: 1.15, spa: 1.15, spd: 1.15, spe: 1.15 }); m.adaptive = true; } },
};

// Apply a mutation to a mon (idempotent per id). Returns true if newly applied.
export function applyMutation(mon, id) {
  const mut = MUTATIONS[id];
  if (!mut) return false;
  if (!mon.mutations) mon.mutations = [];
  if (mon.mutations.includes(id)) return false;
  mut.apply(mon);
  mon.mutations.push(id);
  return true;
}

// ---- sigils (run-wide) --------------------------------------------------

// Each sigil contributes a partial of the normalized effect object below.
export const SIGILS = {
  solar_core:  { name: "Solar Core",   rarity: "uncommon", desc: "Harsh sunlight: your Fire moves +30%, Water −30%.",
    effects: { weather: "sun", typeMult: { fire: 1.3, water: 0.7 } } },
  monsoon:     { name: "Monsoon",      rarity: "uncommon", desc: "Rain: your Water moves +30%, Fire −30%.",
    effects: { weather: "rain", typeMult: { water: 1.3, fire: 0.7 } } },
  permafrost:  { name: "Permafrost",   rarity: "uncommon", desc: "Hail: your Ice moves +30%.",
    effects: { weather: "hail", typeMult: { ice: 1.3 } } },
  sand_totem:  { name: "Sand Totem",   rarity: "uncommon", desc: "Sandstorm: your Rock & Ground moves surge.",
    effects: { weather: "sand", typeMult: { rock: 1.3, ground: 1.15 } } },
  toxic_spikes:{ name: "Toxic Spikes", rarity: "uncommon", desc: "Foes are poisoned when they enter battle.",
    effects: { enemyEntryStatus: "psn" } },
  trick_lens:  { name: "Trick Lens",   rarity: "rare", desc: "Trick Room: slower Pokémon move first.",
    effects: { trickRoom: true } },
  momentum:    { name: "Momentum Engine", rarity: "rare", desc: "+8% crit each turn you don't switch.",
    effects: { critRampPerTurn: 0.08 } },
  vampire_pact:{ name: "Vampire Pact", rarity: "rare", desc: "Your moves heal 12% of the damage they deal.",
    effects: { lifesteal: 0.12 } },
  glass_armory:{ name: "Glass Armory", rarity: "rare", desc: "ALL damage dealt (yours and foes') +30%.",
    effects: { globalDamageMult: 1.3 } },
  second_wind: { name: "Second Wind",  rarity: "rare", desc: "Once per battle, a lethal hit leaves you at 1 HP.",
    effects: { endureOnce: true } },
  sturdy_banner:{ name: "Sturdy Banner", rarity: "uncommon", desc: "At full HP, no single hit takes more than half.",
    effects: { sturdyAtFull: true } },
  lucky_egg:   { name: "Lucky Egg",    rarity: "common", desc: "+50% XP from battles.",
    effects: { xpMult: 1.5 } },
  merchants_charm:{ name: "Merchant's Charm", rarity: "common", desc: "+50% gold from battles.",
    effects: { goldMult: 1.5 } },
  ball_cache:  { name: "Ball Cache",   rarity: "common", desc: "Start the run with 2 extra Poké Balls.",
    effects: { startingBalls: 2 } },
  apex:        { name: "Apex Predator", rarity: "legendary", desc: "Your damage +10%, and KOs heal 25% HP.",
    effects: { yourDamageMult: 1.1, healOnKill: 0.25 } },
};

// The neutral baseline every battle starts from.
export function emptyEffects() {
  return {
    weather: null,
    typeMult: {},
    globalDamageMult: 1,
    yourDamageMult: 1,
    lifesteal: 0,
    enemyEntryStatus: null,
    trickRoom: false,
    critRampPerTurn: 0,
    xpMult: 1,
    goldMult: 1,
    startingBalls: 0,
    endureOnce: false,
    sturdyAtFull: false,
    healOnKill: 0,
  };
}

// Merge a list of owned sigil ids into a single normalized effect object.
export function aggregateSigils(ids) {
  const out = emptyEffects();
  for (const id of ids || []) {
    const s = SIGILS[id];
    if (!s) continue;
    const e = s.effects;
    if (e.weather) out.weather = e.weather; // last weather wins
    if (e.typeMult) for (const [t, m] of Object.entries(e.typeMult)) out.typeMult[t] = (out.typeMult[t] || 1) * m;
    if (e.globalDamageMult) out.globalDamageMult *= e.globalDamageMult;
    if (e.yourDamageMult) out.yourDamageMult *= e.yourDamageMult;
    if (e.lifesteal) out.lifesteal += e.lifesteal;
    if (e.enemyEntryStatus) out.enemyEntryStatus = e.enemyEntryStatus;
    if (e.trickRoom) out.trickRoom = true;
    if (e.critRampPerTurn) out.critRampPerTurn += e.critRampPerTurn;
    if (e.xpMult) out.xpMult *= e.xpMult;
    if (e.goldMult) out.goldMult *= e.goldMult;
    if (e.startingBalls) out.startingBalls += e.startingBalls;
    if (e.endureOnce) out.endureOnce = true;
    if (e.sturdyAtFull) out.sturdyAtFull = true;
    if (e.healOnKill) out.healOnKill = Math.max(out.healOnKill, e.healOnKill);
  }
  return out;
}

// Apply Ball Cache to the controller-owned item bag when an Expedition starts.
export function applyStartingBallBonus(items, effects) {
  if (!items) return 0;
  const amount = Math.max(0, Math.floor(effects?.startingBalls || 0));
  items["poke-ball"] = (items["poke-ball"] || 0) + amount;
  return amount;
}

// ---- catalogue helpers (for reward pools / UI) -------------------------

export function mutationList() {
  return Object.keys(MUTATIONS).map((id) => ({ id, ...MUTATIONS[id] }));
}
export function sigilList() {
  return Object.keys(SIGILS).map((id) => ({ id, ...SIGILS[id] }));
}
export function rarityWeightOf(def) {
  return RARITY_WEIGHT[def.rarity] || 1;
}
