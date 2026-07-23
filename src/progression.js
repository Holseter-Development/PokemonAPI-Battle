// progression.js — pure account-level progression rules and save migration.
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

export const UPGRADE_CATALOG = [
  { id: "field_kit_1", name: "Field Kit I", cost: 75, desc: "Start each run with 1 extra Potion." },
  { id: "ball_satchel_1", name: "Ball Satchel I", cost: 100, desc: "Start each run with 1 extra Poké Ball." },
  { id: "travel_fund_1", name: "Travel Fund I", cost: 150, desc: "Start each run with 50 extra gold." },
  { id: "field_kit_2", name: "Field Kit II", cost: 225, requires: "field_kit_1", desc: "Upgrade the extra Potion to a Super Potion." },
  { id: "ball_satchel_2", name: "Ball Satchel II", cost: 300, requires: "ball_satchel_1", desc: "Start with a second extra Poké Ball." },
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

export function progressionEffects(profile) {
  const normalized = normalizeProgression(profile);
  const unlocks = normalized.unlocks;
  const upgrades = normalized.upgrades;
  const fieldKit2 = !!upgrades.field_kit_2;
  return {
    startingGold: (unlocks.explorer_grant ? 40 : 0) + (upgrades.travel_fund_1 ? 50 : 0),
    startingBalls: (unlocks.ball_belt ? 1 : 0) +
      (upgrades.ball_satchel_1 ? 1 : 0) +
      (upgrades.ball_satchel_2 ? 1 : 0),
    startingPotions: upgrades.field_kit_1 && !fieldKit2 ? 1 : 0,
    startingSuperPotions: fieldKit2 ? 1 : 0,
    catchChanceMult: unlocks.catching_insight ? 1.05 : 1,
    goldMult: unlocks.merchant_license ? 1.1 : 1,
    starterIds: BONUS_STARTERS.filter((s) => unlocks[s.unlockId]).map((s) => s.id),
    masterResearcher: !!unlocks.master_researcher,
  };
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
