// progression.js — pure account-level progression rules and save migration.
// Keep this module DOM- and storage-free so profile behavior is easy to test
// and can later be shared with other clients.

export const PROGRESSION_VERSION = 2;
export const GEN1_DEX_SIZE = 151;

const DEX_FIELDS = new Set(["seen", "caught", "shinyCaught"]);

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

export function recordExpeditionStart(profile) {
  profile.expeditionsStarted = nonNegativeInt(profile.expeditionsStarted) + 1;
  return profile.expeditionsStarted;
}

export function recordBestDepth(profile, depth) {
  profile.bestDepth = Math.max(nonNegativeInt(profile.bestDepth), nonNegativeInt(depth));
  return profile.bestDepth;
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
