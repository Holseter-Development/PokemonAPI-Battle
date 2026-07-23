import assert from "node:assert";
import {
  PROGRESSION_VERSION,
  POKEDEX_MILESTONES,
  UPGRADE_CATALOG,
  defaultProgression,
  normalizeProgression,
  registerSpeciesId,
  progressionCounts,
  reconcileProgressionUnlocks,
  progressionEffects,
  upgradePurchaseState,
  purchaseUpgrade,
  recordExpeditionStart,
  recordBestDepth,
  recordRunResult,
} from "../src/progression.js";
import {
  GEN1_NAMES,
  dexName,
  dexNumber,
  dexSpriteUrl,
  dexEntryState,
  filteredDexIds,
} from "../src/pokedex.js";

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

test("local Pokédex index covers all 151 species and stable sprite URLs", () => {
  assert.strictEqual(GEN1_NAMES.length, 151);
  assert.strictEqual(dexName(1), "Bulbasaur");
  assert.strictEqual(dexName(25), "Pikachu");
  assert.strictEqual(dexName(151), "Mew");
  assert.strictEqual(dexNumber(7), "#007");
  assert.match(dexSpriteUrl(25), /sprites\/pokemon\/25\.png$/);
  assert.match(dexSpriteUrl(25, true), /sprites\/pokemon\/shiny\/25\.png$/);
});

test("Pokédex entry states and collection filters distinguish seen, caught, and shiny", () => {
  const profile = normalizeProgression({
    seen: [1, 25],
    caught: [25],
    shinyCaught: [25],
  });
  assert.deepStrictEqual(dexEntryState(profile, 1), {
    id: 1, name: "Bulbasaur", seen: true, caught: false, shiny: false,
  });
  assert.deepStrictEqual(dexEntryState(profile, 25), {
    id: 25, name: "Pikachu", seen: true, caught: true, shiny: true,
  });
  assert.strictEqual(filteredDexIds(profile, "all").length, 151);
  assert.deepStrictEqual(filteredDexIds(profile, "seen"), [1, 25]);
  assert.deepStrictEqual(filteredDexIds(profile, "caught"), [25]);
  assert.strictEqual(filteredDexIds(profile, "missing").length, 150);
  assert.deepStrictEqual(filteredDexIds(profile, "shiny"), [25]);
  assert.strictEqual(filteredDexIds(profile, "invalid").length, 151);
});

test("every Pokédex milestone unlocks at its threshold, not before, and only once", () => {
  const idsThrough = (count) => Array.from({ length: Math.min(151, count) }, (_, index) => index + 1);
  for (const milestone of POKEDEX_MILESTONES) {
    const below = defaultProgression();
    below[milestone.field] = idsThrough(milestone.threshold - 1);
    assert.ok(
      !reconcileProgressionUnlocks(below).some((entry) => entry.id === milestone.id),
      `${milestone.id} stays locked below ${milestone.threshold}`,
    );

    const at = defaultProgression();
    at[milestone.field] = idsThrough(milestone.threshold);
    assert.ok(
      reconcileProgressionUnlocks(at).some((entry) => entry.id === milestone.id),
      `${milestone.id} unlocks at ${milestone.threshold}`,
    );
    assert.ok(at.unlocks[milestone.id], `${milestone.id} persists on the profile`);
    assert.ok(
      !reconcileProgressionUnlocks(at).some((entry) => entry.id === milestone.id),
      `${milestone.id} is not announced twice`,
    );

    const above = defaultProgression();
    above[milestone.field] = idsThrough(milestone.threshold + 1);
    assert.ok(
      reconcileProgressionUnlocks(above).some((entry) => entry.id === milestone.id),
      `${milestone.id} also unlocks when an old save is already above its threshold`,
    );
  }
});

test("milestones and purchased upgrades combine into exact run effects", () => {
  const profile = defaultProgression();
  profile.unlocks = Object.fromEntries(POKEDEX_MILESTONES.map((entry) => [entry.id, true]));
  profile.upgrades = Object.fromEntries(UPGRADE_CATALOG.map((entry) => [entry.id, true]));
  assert.deepStrictEqual(progressionEffects(profile), {
    startingGold: 90,
    startingBalls: 3,
    startingPotions: 0,
    startingSuperPotions: 1,
    catchChanceMult: 1.05,
    goldMult: 1.1,
    starterIds: [25, 133],
    masterResearcher: true,
  });
});

test("Fragment Lab purchases enforce prerequisites, funds, permanence, and exact costs", () => {
  const profile = defaultProgression();
  profile.fragments = 1000;
  assert.strictEqual(upgradePurchaseState(profile, "field_kit_2").reason, "requires");
  assert.strictEqual(upgradePurchaseState(profile, "unknown").reason, "unknown");

  const first = purchaseUpgrade(profile, "field_kit_1");
  assert.ok(first.ok);
  assert.strictEqual(profile.fragments, 925);
  assert.strictEqual(profile.upgrades.field_kit_1, true);

  const repeat = purchaseUpgrade(profile, "field_kit_1");
  assert.strictEqual(repeat.reason, "owned");
  assert.strictEqual(profile.fragments, 925, "owned upgrades cannot charge twice");

  const second = purchaseUpgrade(profile, "field_kit_2");
  assert.ok(second.ok);
  assert.strictEqual(profile.fragments, 700);
  assert.strictEqual(progressionEffects(profile).startingSuperPotions, 1);

  const poor = defaultProgression();
  poor.fragments = 74;
  assert.strictEqual(purchaseUpgrade(poor, "field_kit_1").reason, "funds");
  assert.strictEqual(poor.fragments, 74);
});

console.log(`\n${passed} checks passed`);
