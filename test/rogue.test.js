// Head-less tests for the roguelike core: seeded RNG, map generation,
// run state, reward pickers, and the mutation/sigil model.

import assert from "node:assert";
import {
  makeRng, hashSeed, shuffle, weightedPick, sampleDistinct, randInt,
} from "../src/rng.js";
import {
  MUTATIONS, SIGILS, applyMutation, aggregateSigils, emptyEffects,
  mutationList, sigilList,
} from "../src/mutations.js";
import {
  NODE, generateMap, createRun, availableNext, travelTo, markResolved,
  currentNode, checkWipe, offerSigils, offerMutations, rollShop,
  rollMysteryEvent, rollGold, encounterLevel, RUN_CONFIG,
} from "../src/run.js";

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { console.error("  ✗ " + name + "\n    " + e.message); process.exitCode = 1; }
}
const clone = (o) => JSON.parse(JSON.stringify(o));

console.log("roguelike core tests");

// ---- rng ----
test("rng: same seed reproduces the exact sequence", () => {
  const a = makeRng(12345), b = makeRng(12345);
  for (let i = 0; i < 100; i++) assert.strictEqual(a(), b());
  const c = makeRng(99999);
  assert.notStrictEqual(makeRng(1)(), c());
});

test("rng: state save/restore continues the stream", () => {
  const r = makeRng(7);
  for (let i = 0; i < 10; i++) r();
  const s = r.getState();
  const next = r();
  const r2 = makeRng(7); r2.setState(s);
  assert.strictEqual(r2(), next);
});

test("hashSeed is stable & deterministic", () => {
  assert.strictEqual(hashSeed("hello"), hashSeed("hello"));
  assert.notStrictEqual(hashSeed("hello"), hashSeed("world"));
});

test("shuffle preserves all elements, sampleDistinct is distinct", () => {
  const rng = makeRng(3);
  const arr = [1, 2, 3, 4, 5, 6];
  const sh = shuffle(rng, arr);
  assert.deepStrictEqual([...sh].sort((a, b) => a - b), arr);
  assert.strictEqual(arr.length, 6, "input not mutated");
  const s = sampleDistinct(rng, arr, 3);
  assert.strictEqual(new Set(s).size, 3);
});

test("weightedPick honours weights (heavy item dominates)", () => {
  const rng = makeRng(42);
  let heavy = 0;
  for (let i = 0; i < 2000; i++) {
    if (weightedPick(rng, [{ item: "H", weight: 9 }, { item: "L", weight: 1 }]) === "H") heavy++;
  }
  assert.ok(heavy > 1600, "heavy chosen ~90%: " + heavy);
});

// ---- mutations ----
function tmon(over = {}) {
  return {
    types: over.types || ["normal"],
    stats: Object.assign({ maxHp: 80, hp: 80, atk: 60, def: 60, spa: 60, spd: 60, spe: 60 }, over.stats),
  };
}

test("mutation catalogue is well-formed", () => {
  for (const [id, m] of Object.entries(MUTATIONS)) {
    assert.ok(m.name && m.rarity && typeof m.apply === "function", id + " malformed");
  }
});

test("applyMutation: type graft adds a type, idempotent", () => {
  const m = tmon();
  assert.ok(applyMutation(m, "draconic"));
  assert.ok(m.types.includes("dragon"));
  assert.ok(!applyMutation(m, "draconic"), "second apply is a no-op");
  assert.deepStrictEqual(m.mutations, ["draconic"]);
});

test("applyMutation: stat graft scales, ability graft tags", () => {
  const m = tmon();
  applyMutation(m, "titan");
  assert.ok(m.stats.maxHp > 80 && m.stats.atk > 60);
  applyMutation(m, "levitator");
  assert.ok(m.abilities.includes("levitate"));
  const v = tmon(); applyMutation(v, "vampiric");
  assert.ok(v.lifesteal >= 0.25);
  const a = tmon(); applyMutation(a, "adaptive");
  assert.strictEqual(a.adaptive, true);
});

test("aggregateSigils: merges weather, type mults, flags & sums", () => {
  const e0 = aggregateSigils([]);
  assert.deepStrictEqual(e0, emptyEffects());
  const e = aggregateSigils(["solar_core", "vampire_pact", "glass_armory", "ball_cache", "trick_lens"]);
  assert.strictEqual(e.weather, "sun");
  assert.ok(Math.abs(e.typeMult.fire - 1.3) < 1e-9);
  assert.ok(e.lifesteal >= 0.12);
  assert.ok(Math.abs(e.globalDamageMult - 1.3) < 1e-9);
  assert.strictEqual(e.startingBalls, 2);
  assert.strictEqual(e.trickRoom, true);
});

test("every sigil contributes a valid effect key", () => {
  const valid = new Set(Object.keys(emptyEffects()));
  for (const [id, s] of Object.entries(SIGILS)) {
    assert.ok(s.effects && Object.keys(s.effects).length, id + " has no effects");
    for (const k of Object.keys(s.effects)) assert.ok(valid.has(k), `${id}: unknown effect ${k}`);
  }
});

// ---- map generation ----
function bfsReaches(map, startIds, targetId) {
  const seen = new Set(startIds);
  const q = [...startIds];
  while (q.length) {
    const n = map.nodes[q.shift()];
    if (n.id === targetId) return true;
    for (const e of n.edges) if (!seen.has(e)) { seen.add(e); q.push(e); }
  }
  return false;
}

test("map: deterministic per seed", () => {
  const m1 = generateMap(makeRng(hashSeed("ABC")));
  const m2 = generateMap(makeRng(hashSeed("ABC")));
  assert.strictEqual(JSON.stringify(m1), JSON.stringify(m2));
  const m3 = generateMap(makeRng(hashSeed("XYZ")));
  assert.notStrictEqual(JSON.stringify(m1), JSON.stringify(m3));
});

test("map: bosses single-node, champion last, fully connected", () => {
  for (const seed of ["one", "two", "three", "seedD", "seedE"]) {
    const map = generateMap(makeRng(hashSeed(seed)));
    const { rowsPerRegion, totalRows, regions } = map;
    // boss rows have exactly one node
    for (let R = rowsPerRegion - 1; R < totalRows; R += rowsPerRegion) {
      const inRow = map.rows[R];
      assert.strictEqual(inRow.length, 1, `boss row ${R} should be single (${seed})`);
    }
    // champion is the final node
    const champId = map.rows[totalRows - 1][0];
    assert.strictEqual(map.nodes[champId].type, NODE.CHAMPION);
    // every non-final node has an outgoing edge, and reaches the champion
    for (const n of Object.values(map.nodes)) {
      if (n.type === NODE.CHAMPION) continue;
      assert.ok(n.edges.length >= 1, `${n.id} has no edge (${seed})`);
    }
    assert.ok(bfsReaches(map, map.rows[0], champId), `champion unreachable (${seed})`);
    // pre-boss rows are Rests
    for (let R = rowsPerRegion - 2; R < totalRows; R += rowsPerRegion) {
      for (const id of map.rows[R]) assert.strictEqual(map.nodes[id].type, NODE.REST, `pre-boss should rest (${seed})`);
    }
    // one shop per region
    for (let reg = 0; reg < regions; reg++) {
      const hasShop = Object.values(map.nodes).some((n) => n.region === reg && n.type === NODE.SHOP);
      assert.ok(hasShop, `region ${reg} needs a shop (${seed})`);
    }
  }
});

// ---- run state ----
test("createRun: deterministic map, starts choosing row-0 nodes", () => {
  const a = createRun("SEED-1"), b = createRun("SEED-1");
  assert.strictEqual(JSON.stringify(a.map), JSON.stringify(b.map));
  const first = availableNext(a);
  assert.ok(first.length >= 1 && first.every((n) => n.row === 0));
});

test("createRun accepts starting Sigils for controller initialization", () => {
  const run = createRun("STARTING-SIGILS", { sigils: ["ball_cache", "permafrost"] });
  assert.deepStrictEqual(run.sigils, ["ball_cache", "permafrost"]);
});

test("run: travel + resolve advances along edges", () => {
  const run = createRun("PATH-TEST");
  const start = availableNext(run)[0];
  travelTo(run, start.id);
  assert.strictEqual(run.position, start.id);
  assert.deepStrictEqual(availableNext(run), []); // must resolve first
  markResolved(run, {});
  const nexts = availableNext(run);
  assert.ok(nexts.length >= 1 && nexts.every((n) => n.row === 1));
  assert.ok(travelTo(run, nexts[0].id));
});

test("run: champion win ends the run; wipe ends it as a loss", () => {
  const run = createRun("END-TEST");
  const champId = run.map.rows[run.map.totalRows - 1][0];
  run.position = champId; run.resolved = false;
  markResolved(run, { won: true });
  assert.ok(run.over && run.won);
  const run2 = createRun("WIPE");
  run2.team = [{ stats: { hp: 0, maxHp: 10 } }];
  assert.ok(checkWipe(run2));
  assert.ok(run2.over && !run2.won);
});

// ---- reward pickers ----
test("offers are distinct, rarity-weighted, and exclude owned sigils", () => {
  const run = createRun("REWARDS");
  run.sigils = ["solar_core"];
  const sig = offerSigils(clone(run), 3);
  assert.strictEqual(new Set(sig.map((s) => s.id)).size, sig.length);
  assert.ok(!sig.some((s) => s.id === "solar_core"), "owned excluded");
  const muts = offerMutations(clone(run), 3);
  assert.strictEqual(muts.length, 3);
});

test("reward rolls are deterministic for identical run state", () => {
  const base = createRun("DET");
  const a = offerMutations(clone(base), 3).map((m) => m.id);
  const b = offerMutations(clone(base), 3).map((m) => m.id);
  assert.deepStrictEqual(a, b);
});

test("shop stock & mystery events are valid; gold/level scale", () => {
  const run = createRun("SHOP");
  const stock = rollShop(clone(run));
  assert.ok(stock.length >= 4 && stock.every((s) => s.price > 0 && s.kind));
  const ev = rollMysteryEvent(clone(run));
  assert.ok(ev.id && ev.choices.length >= 1);
  assert.ok(rollGold(clone(run), NODE.ELITE) > rollGold(clone(run), NODE.BATTLE));
  assert.ok(encounterLevel({ visited: new Array(10), ascension: 0 }) > encounterLevel({ visited: [], ascension: 0 }));
});

console.log(`\n${passed} checks passed`);
