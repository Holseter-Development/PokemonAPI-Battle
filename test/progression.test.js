import assert from "node:assert";
import {
  PROGRESSION_VERSION,
  defaultProgression,
  normalizeProgression,
  registerSpeciesId,
  progressionCounts,
  recordExpeditionStart,
  recordBestDepth,
  recordRunResult,
} from "../src/progression.js";

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { console.error("  ✗ " + name + "\n    " + e.message); process.exitCode = 1; }
}

console.log("progression tests");

test("fresh progression has the complete v2 schema", () => {
  assert.deepStrictEqual(defaultProgression(), {
    version: 2,
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
  });
});

test("legacy meta migrates without losing currency, wins, or unknown fields", () => {
  const migrated = normalizeProgression({
    fragments: 275,
    expeditionsWon: 3,
    startingSigils: ["ball_cache"],
  });
  assert.strictEqual(migrated.version, PROGRESSION_VERSION);
  assert.strictEqual(migrated.fragments, 275);
  assert.strictEqual(migrated.expeditionsWon, 3);
  assert.strictEqual(migrated.expeditionsStarted, 3, "started cannot be below wins");
  assert.deepStrictEqual(migrated.startingSigils, ["ball_cache"]);
});

test("normalization repairs malformed counters, records, and Pokédex IDs", () => {
  const normalized = normalizeProgression({
    version: 99,
    fragments: -4,
    expeditionsStarted: "2",
    expeditionsWon: 4.9,
    bestDepth: "12",
    currentWinStreak: 3,
    bestWinStreak: 1,
    playTimeMs: Infinity,
    seen: [25, "1", 25, 0, 152, 2.5, "bad"],
    caught: null,
    shinyCaught: [151, 3, 151],
    unlocks: { pikachu: true, broken: {}, alsoBroken: null },
    upgrades: ["not", "a", "record"],
  });
  assert.strictEqual(normalized.version, 2);
  assert.strictEqual(normalized.fragments, 0);
  assert.strictEqual(normalized.expeditionsWon, 4);
  assert.strictEqual(normalized.expeditionsStarted, 4);
  assert.strictEqual(normalized.bestDepth, 12);
  assert.strictEqual(normalized.currentWinStreak, 3);
  assert.strictEqual(normalized.bestWinStreak, 3);
  assert.strictEqual(normalized.playTimeMs, 0);
  assert.deepStrictEqual(normalized.seen, [1, 3, 25, 151]);
  assert.deepStrictEqual(normalized.caught, [3, 151]);
  assert.deepStrictEqual(normalized.shinyCaught, [3, 151]);
  assert.deepStrictEqual(normalized.unlocks, { pikachu: true });
  assert.deepStrictEqual(normalized.upgrades, {});
});

test("species registration is sorted, unique, bounded, and respects implications", () => {
  const profile = defaultProgression();
  assert.strictEqual(registerSpeciesId(profile, "seen", 25), true);
  assert.strictEqual(registerSpeciesId(profile, "seen", 25), false);
  assert.strictEqual(registerSpeciesId(profile, "caught", "4"), true);
  assert.strictEqual(registerSpeciesId(profile, "shinyCaught", 151), true);
  assert.strictEqual(registerSpeciesId(profile, "seen", 0), false);
  assert.strictEqual(registerSpeciesId(profile, "unknown", 7), false);
  assert.deepStrictEqual(profile.seen, [4, 25, 151]);
  assert.deepStrictEqual(profile.caught, [4, 151]);
  assert.deepStrictEqual(profile.shinyCaught, [151]);
  assert.deepStrictEqual(progressionCounts(profile), { seen: 3, caught: 2, shinyCaught: 1 });
});

test("start, depth, and result helpers maintain profile invariants", () => {
  const profile = defaultProgression();
  assert.strictEqual(recordExpeditionStart(profile), 1);
  assert.strictEqual(recordBestDepth(profile, 5), 5);
  assert.strictEqual(recordBestDepth(profile, 3), 5, "best depth never regresses");

  recordRunResult(profile, true);
  recordExpeditionStart(profile);
  recordRunResult(profile, true);
  assert.strictEqual(profile.expeditionsStarted, 2);
  assert.strictEqual(profile.expeditionsWon, 2);
  assert.strictEqual(profile.currentWinStreak, 2);
  assert.strictEqual(profile.bestWinStreak, 2);

  recordExpeditionStart(profile);
  recordRunResult(profile, false);
  assert.strictEqual(profile.expeditionsStarted, 3);
  assert.strictEqual(profile.expeditionsWon, 2);
  assert.strictEqual(profile.currentWinStreak, 0);
  assert.strictEqual(profile.bestWinStreak, 2);
});

test("normalized progression round-trips through JSON", () => {
  const before = normalizeProgression({
    fragments: 7,
    seen: [9, 1, 9],
    unlocks: { demo: true },
    futureField: { retained: "as JSON data" },
  });
  const after = normalizeProgression(JSON.parse(JSON.stringify(before)));
  assert.deepStrictEqual(after, before);
});

console.log(`\n${passed} checks passed`);
