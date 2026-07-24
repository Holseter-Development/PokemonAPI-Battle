// progression.js - pure account-level progression rules and save migration.
// Keep this module DOM- and storage-free so profile behavior is easy to test
// and can later be shared with other clients.

export const PROGRESSION_VERSION = 2;
export const GEN1_DEX_SIZE = 151;

const DEX_FIELDS = new Set(["seen", "caught", "shinyCaught"]);

export const BONUS_STARTERS = [
  { id: 25, name: "Pikachu", type: "electric", unlockId: "starter_pikachu" },
  { id: 133, name: "Eevee", type: "normal", unlockId: "starter_eevee" },
];

export const POKEDEX_MILESTONES = [
  { id: "explorer_grant", field: "seen", threshold: 25, name: "Explorer Grant", desc: "Start each Expedition with 40 gold." },
  { id: "ball_belt", field: "caught", threshold: 10, name: "Ball Belt", desc: "Start with 1 extra Poké Ball." },
  { id: "starter_pikachu", field: "caught", threshold: 25, name: "Pikachu License", desc: "Unlock Pikachu as a starter." },
  { id: "catching_insight", field: "caught", threshold: 50, name: "Catching Insight", desc: "Improve catch chance by 5%." },
  { id: "starter_eevee", field: "caught", threshold: 75, name: "Eevee License", desc: "Unlock Eevee as a starter." },
  { id: "merchant_license", field: "caught", threshold: 100, name: "Merchant License", desc: "Earn 10% more gold from battles." },
  { id: "master_researcher", field: "caught", threshold: 151, name: "Master Researcher", desc: "Earn the Master Researcher badge and upgraded Shiny Charm." },
];

// The Fragment Lab is a branching skill tree. Each branch is a themed vertical
// of tiered nodes; a node unlocks once its `requires` prerequisite is owned and
// its Fragment cost is paid. Every gameplay consequence lives in the declarative
// `effect` descriptor so the controller, previews, and tests all read from one
// source of truth (no logic in button handlers). The five original upgrade ids
// (field_kit_1/2, ball_satchel_1/2, travel_fund_1) are preserved so existing
// purchases keep working after the tree expansion.
//
// effect shape:
//   add:          { gold, balls, greatBalls, potions, superPotions, hyperPotions }
//   mult:         { catch, gold, xp, alphaGold }   (multiplicative, stacks by product)
//   shopDiscount: fraction off Poké Mart prices (additive, capped downstream)
//   shinyStep:    steps up the shiny-odds ladder (additive with charm/dex tiers)
export const UPGRADE_BRANCHES = [
  { id: "provisions", name: "Provisions", icon: "🎒", color: "#5fbd58",
    blurb: "Field supplies that stock every fresh Expedition." },
  { id: "fortune", name: "Fortune", icon: "💰", color: "#f5c451",
    blurb: "Gold in your pocket and a lighter shopping bill." },
  { id: "expertise", name: "Expertise", icon: "🔬", color: "#4d90d5",
    blurb: "Sharper catching, brighter shinies, and faster growth." },
];

export const UPGRADE_CATALOG = [
  // ---- Provisions ------------------------------------------------------
  { id: "field_kit_1", name: "Field Kit I", cost: 75, branch: "provisions", tier: 1,
    effect: { add: { potions: 1 } }, desc: "Start each run with 1 extra Potion." },
  { id: "field_kit_2", name: "Field Kit II", cost: 225, branch: "provisions", tier: 2, requires: "field_kit_1",
    effect: { add: { potions: -1, superPotions: 1 } }, desc: "Upgrade the extra Potion to a Super Potion." },
  { id: "field_kit_3", name: "Field Kit III", cost: 420, branch: "provisions", tier: 3, requires: "field_kit_2",
    effect: { add: { superPotions: -1, hyperPotions: 1 } }, desc: "Upgrade the Super Potion to a Hyper Potion." },
  { id: "ball_satchel_1", name: "Ball Satchel I", cost: 100, branch: "provisions", tier: 1,
    effect: { add: { balls: 1 } }, desc: "Start each run with 1 extra Poké Ball." },
  { id: "ball_satchel_2", name: "Ball Satchel II", cost: 300, branch: "provisions", tier: 2, requires: "ball_satchel_1",
    effect: { add: { balls: 1 } }, desc: "Start with a second extra Poké Ball." },
  { id: "ball_satchel_3", name: "Ball Satchel III", cost: 520, branch: "provisions", tier: 3, requires: "ball_satchel_2",
    effect: { add: { greatBalls: 1 } }, desc: "Start with a Great Ball as well." },

  // ---- Fortune ---------------------------------------------------------
  { id: "travel_fund_1", name: "Travel Fund I", cost: 150, branch: "fortune", tier: 1,
    effect: { add: { gold: 50 } }, desc: "Start each run with 50 extra gold." },
  { id: "travel_fund_2", name: "Travel Fund II", cost: 320, branch: "fortune", tier: 2, requires: "travel_fund_1",
    effect: { add: { gold: 75 } }, desc: "Start with a further 75 gold (125 total)." },
  { id: "merchants_cut", name: "Merchant's Cut", cost: 260, branch: "fortune", tier: 2, requires: "travel_fund_1",
    effect: { mult: { gold: 1.1 } }, desc: "Earn 10% more gold from every battle." },
  { id: "hagglers_tongue", name: "Haggler's Tongue", cost: 360, branch: "fortune", tier: 3, requires: "merchants_cut",
    effect: { shopDiscount: 0.15 }, desc: "Poké Mart prices are 15% cheaper." },

  // ---- Expertise -------------------------------------------------------
  { id: "catchers_eye", name: "Catcher's Eye", cost: 200, branch: "expertise", tier: 1,
    effect: { mult: { catch: 1.08 } }, desc: "Improve catch chance by 8%." },
  { id: "deft_hands", name: "Deft Hands", cost: 380, branch: "expertise", tier: 2, requires: "catchers_eye",
    effect: { mult: { catch: 1.08 } }, desc: "Improve catch chance by a further 8%." },
  { id: "alpha_hunter", name: "Alpha Hunter", cost: 360, branch: "expertise", tier: 2, requires: "catchers_eye",
    effect: { mult: { alphaGold: 1.5 } }, desc: "Alpha bounties pay 50% more gold." },
  { id: "keen_eye", name: "Keen Eye", cost: 300, branch: "expertise", tier: 1,
    effect: { shinyStep: 1 }, desc: "Improve wild shiny odds by one tier." },
  { id: "scholars_focus", name: "Scholar's Focus", cost: 280, branch: "expertise", tier: 1,
    effect: { mult: { xp: 1.1 } }, desc: "Your party earns 10% more XP." },
  { id: "veterans_study", name: "Veteran's Study", cost: 460, branch: "expertise", tier: 2, requires: "scholars_focus",
    effect: { mult: { xp: 1.15 } }, desc: "Your party earns a further 15% XP." },
];

function nonNegativeInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function cleanDexIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map(Number)
    .filter((id) => Number.isInteger(id) && id >= 1 && id <= GEN1_DEX_SIZE))]
    .sort((a, b) => a - b);
}

function cleanRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, entry]) =>
    typeof entry === "boolean" ||
    typeof entry === "string" ||
    (typeof entry === "number" && Number.isFinite(entry))
  ));
}

export function defaultProgression() {
  return {
    version: PROGRESSION_VERSION,
    fragments: 0,
    expeditionsStarted: 0,
    expeditionsWon: 0,
    bestDepth: 0,
    bestWinStreak: 0,
    currentWinStreak: 0,
    playTimeMs: 0,
    seen: [],
    caught: [],
    shinyCaught: [],
    unlocks: {},
    upgrades: {},
  };
}

export function normalizeProgression(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const wins = nonNegativeInt(source.expeditionsWon);
  const currentStreak = nonNegativeInt(source.currentWinStreak);
  const shinyCaught = cleanDexIds(source.shinyCaught);
  const caught = cleanDexIds([...(Array.isArray(source.caught) ? source.caught : []), ...shinyCaught]);
  const seen = cleanDexIds([...(Array.isArray(source.seen) ? source.seen : []), ...caught]);

  // Preserve unknown JSON fields so already-written forward-compatible data
  // is not silently discarded, then overwrite every field this version owns.
  return {
    ...source,
    version: PROGRESSION_VERSION,
    fragments: nonNegativeInt(source.fragments),
    expeditionsStarted: Math.max(nonNegativeInt(source.expeditionsStarted), wins),
    expeditionsWon: wins,
    bestDepth: nonNegativeInt(source.bestDepth),
    bestWinStreak: Math.max(nonNegativeInt(source.bestWinStreak), currentStreak),
    currentWinStreak: currentStreak,
    playTimeMs: nonNegativeInt(source.playTimeMs),
    seen,
    caught,
    shinyCaught,
    unlocks: cleanRecord(source.unlocks),
    upgrades: cleanRecord(source.upgrades),
  };
}

// Register one Gen-1 species. Ownership states imply the states below them:
// shiny caught → caught → seen. Returns true only when the requested field was
// newly updated.
export function registerSpeciesId(profile, field, value) {
  if (!profile || !DEX_FIELDS.has(field)) return false;
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1 || id > GEN1_DEX_SIZE) return false;

  const add = (key) => {
    const ids = cleanDexIds(profile[key]);
    if (ids.includes(id)) {
      profile[key] = ids;
      return false;
    }
    ids.push(id);
    ids.sort((a, b) => a - b);
    profile[key] = ids;
    return true;
  };

  const added = add(field);
  if (field === "caught" || field === "shinyCaught") add("seen");
  if (field === "shinyCaught") add("caught");
  return added;
}

export function progressionCounts(profile) {
  const normalized = normalizeProgression(profile);
  return {
    seen: normalized.seen.length,
    caught: normalized.caught.length,
    shinyCaught: normalized.shinyCaught.length,
  };
}

export function reconcileProgressionUnlocks(profile) {
  if (!profile) return [];
  profile.unlocks = cleanRecord(profile.unlocks);
  const counts = progressionCounts(profile);
  const unlocked = [];
  for (const milestone of POKEDEX_MILESTONES) {
    if (counts[milestone.field] < milestone.threshold || profile.unlocks[milestone.id]) continue;
    profile.unlocks[milestone.id] = true;
    unlocked.push(milestone);
  }
  return unlocked;
}

// Wild shiny odds as a 1-in-N denominator (P2.3). The roguelite's shorter
// format uses a base of 1/512; the Champion's Shiny Charm improves it to 1/256
// and completing the Pokédex (Master Researcher) upgrades it further to 1/128.
// The Fragment Lab's Keen Eye node steps one further rung down the ladder.
export const SHINY_BASE_ONE_IN = 512;
export const SHINY_CHARM_ONE_IN = 256;
export const SHINY_MASTER_ONE_IN = 128;
export const SHINY_LADDER = [SHINY_BASE_ONE_IN, SHINY_CHARM_ONE_IN, SHINY_MASTER_ONE_IN, 64];
export const SHOP_DISCOUNT_CAP = 0.5;

// Fold every purchased skill-tree node into one accumulator of numeric bonuses.
// Pure and data-driven: reads `effect` descriptors from UPGRADE_CATALOG so the
// tree can grow without touching this reducer or the controller.
export function upgradeEffectTotals(upgrades) {
  const owned = cleanRecord(upgrades);
  const acc = {
    gold: 0, balls: 0, greatBalls: 0, potions: 0, superPotions: 0, hyperPotions: 0,
    catchMult: 1, goldMult: 1, xpMult: 1, alphaGoldMult: 1, shopDiscount: 0, shinyStep: 0,
  };
  for (const upgrade of UPGRADE_CATALOG) {
    if (!owned[upgrade.id]) continue;
    const e = upgrade.effect || {};
    if (e.add) for (const [k, v] of Object.entries(e.add)) acc[k] = (acc[k] || 0) + v;
    if (e.mult) {
      if (e.mult.catch) acc.catchMult *= e.mult.catch;
      if (e.mult.gold) acc.goldMult *= e.mult.gold;
      if (e.mult.xp) acc.xpMult *= e.mult.xp;
      if (e.mult.alphaGold) acc.alphaGoldMult *= e.mult.alphaGold;
    }
    if (e.shopDiscount) acc.shopDiscount += e.shopDiscount;
    if (e.shinyStep) acc.shinyStep += e.shinyStep;
  }
  // Potion upgrades convert rather than stack, so clamp the "consumed" tiers.
  acc.potions = Math.max(0, acc.potions);
  acc.superPotions = Math.max(0, acc.superPotions);
  acc.shopDiscount = Math.min(SHOP_DISCOUNT_CAP, Math.max(0, acc.shopDiscount));
  return acc;
}

function shinyBaseIndex(unlocks) {
  if (unlocks.master_researcher) return 2;
  if (unlocks.shiny_charm) return 1;
  return 0;
}

export function shinyOdds(profile) {
  const normalized = normalizeProgression(profile);
  const steps = upgradeEffectTotals(normalized.upgrades).shinyStep;
  const idx = Math.min(SHINY_LADDER.length - 1, shinyBaseIndex(normalized.unlocks) + steps);
  return SHINY_LADDER[idx];
}

export function progressionEffects(profile) {
  const normalized = normalizeProgression(profile);
  const unlocks = normalized.unlocks;
  const t = upgradeEffectTotals(normalized.upgrades);
  return {
    startingGold: (unlocks.explorer_grant ? 40 : 0) + t.gold,
    startingBalls: (unlocks.ball_belt ? 1 : 0) + t.balls,
    startingGreatBalls: t.greatBalls,
    startingPotions: t.potions,
    startingSuperPotions: t.superPotions,
    startingHyperPotions: t.hyperPotions,
    catchChanceMult: (unlocks.catching_insight ? 1.05 : 1) * t.catchMult,
    goldMult: (unlocks.merchant_license ? 1.1 : 1) * t.goldMult,
    xpMult: t.xpMult,
    alphaGoldMult: t.alphaGoldMult,
    shopDiscount: t.shopDiscount,
    starterIds: BONUS_STARTERS.filter((s) => unlocks[s.unlockId]).map((s) => s.id),
    masterResearcher: !!unlocks.master_researcher,
    shinyCharm: !!unlocks.shiny_charm,
    shinyOneIn: shinyOdds(normalized),
  };
}

// Grant the Champion's Shiny Charm. Permanent and idempotent; returns true only
// the first time it is earned so the controller can announce it once.
export function grantShinyCharm(profile) {
  if (!profile) return false;
  profile.unlocks = cleanRecord(profile.unlocks);
  if (profile.unlocks.shiny_charm) return false;
  profile.unlocks.shiny_charm = true;
  return true;
}

export function upgradePurchaseState(profile, upgradeId) {
  const upgrade = UPGRADE_CATALOG.find((entry) => entry.id === upgradeId);
  if (!upgrade) return { ok: false, reason: "unknown", upgrade: null };
  const normalized = normalizeProgression(profile);
  if (normalized.upgrades[upgrade.id]) return { ok: false, reason: "owned", upgrade };
  if (upgrade.requires && !normalized.upgrades[upgrade.requires]) {
    return { ok: false, reason: "requires", upgrade };
  }
  if (normalized.fragments < upgrade.cost) return { ok: false, reason: "funds", upgrade };
  return { ok: true, reason: null, upgrade };
}

export function purchaseUpgrade(profile, upgradeId) {
  const state = upgradePurchaseState(profile, upgradeId);
  if (!state.ok) return state;
  profile.fragments = nonNegativeInt(profile.fragments) - state.upgrade.cost;
  profile.upgrades = cleanRecord(profile.upgrades);
  profile.upgrades[state.upgrade.id] = true;
  return { ok: true, reason: null, upgrade: state.upgrade };
}

export function recordExpeditionStart(profile) {
  profile.expeditionsStarted = nonNegativeInt(profile.expeditionsStarted) + 1;
  return profile.expeditionsStarted;
}

export function recordBestDepth(profile, depth) {
  profile.bestDepth = Math.max(nonNegativeInt(profile.bestDepth), nonNegativeInt(depth));
  return profile.bestDepth;
}

// Cap a single playtime flush so a suspended or throttled background tab that
// wakes after a long gap cannot inject hours of phantom "active" playtime.
export const PLAYTIME_MAX_CHUNK_MS = 60000;

// Add one bounded slice of active foreground time. `elapsedMs` is the real gap
// since the last flush; anything above `maxChunkMs` is treated as background
// suspension and clamped away. Returns the new total.
export function accumulatePlayTime(profile, elapsedMs, maxChunkMs = PLAYTIME_MAX_CHUNK_MS) {
  if (!profile) return 0;
  const cap = Number.isFinite(maxChunkMs) && maxChunkMs > 0 ? maxChunkMs : PLAYTIME_MAX_CHUNK_MS;
  const raw = Math.floor(Number(elapsedMs));
  const delta = Number.isFinite(raw) ? Math.min(Math.max(0, raw), cap) : 0;
  profile.playTimeMs = nonNegativeInt(profile.playTimeMs) + delta;
  return profile.playTimeMs;
}

// Human-readable playtime. Legacy/zero profiles render as "0m".
export function formatPlayTime(ms) {
  const totalSeconds = Math.floor(nonNegativeInt(ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

// Pure account snapshot for the Trainer Profile screen. Derives win rate,
// completion, and the earned upgrade/badge lists so the UI stays presentational
// and legacy saves fall back to sensible zero/default values.
export function profileSummary(profile, vaultSize = 0) {
  const p = normalizeProgression(profile);
  const counts = progressionCounts(p);
  const started = Math.max(p.expeditionsStarted, p.expeditionsWon);
  const winRate = started > 0 ? p.expeditionsWon / started : 0;
  return {
    expeditionsStarted: started,
    expeditionsWon: p.expeditionsWon,
    winRate,
    winRatePct: Math.round(winRate * 100),
    currentWinStreak: p.currentWinStreak,
    bestWinStreak: p.bestWinStreak,
    bestDepth: p.bestDepth,
    playTimeMs: p.playTimeMs,
    playTime: formatPlayTime(p.playTimeMs),
    seen: counts.seen,
    caught: counts.caught,
    shinyCaught: counts.shinyCaught,
    dexTotal: GEN1_DEX_SIZE,
    vaultSize: nonNegativeInt(vaultSize),
    purchasedUpgrades: UPGRADE_CATALOG.filter((upgrade) => p.upgrades[upgrade.id]),
    milestoneUnlocks: POKEDEX_MILESTONES.filter((milestone) => p.unlocks[milestone.id]),
    masterResearcher: !!p.unlocks.master_researcher,
  };
}

export function recordRunResult(profile, won) {
  if (won) {
    profile.expeditionsWon = nonNegativeInt(profile.expeditionsWon) + 1;
    profile.currentWinStreak = nonNegativeInt(profile.currentWinStreak) + 1;
    profile.bestWinStreak = Math.max(
      nonNegativeInt(profile.bestWinStreak),
      profile.currentWinStreak,
    );
    // Defensive invariant for profiles created before start tracking existed.
    profile.expeditionsStarted = Math.max(
      nonNegativeInt(profile.expeditionsStarted),
      profile.expeditionsWon,
    );
  } else {
    profile.currentWinStreak = 0;
  }
  return profile;
}
