// Head-less tests for the biome encounter catalog (P2.1): table validity,
// region-specific pools, depth eligibility, and seeded reproducibility.

import assert from "node:assert";
import { makeRng } from "../src/rng.js";
import {
  BIOMES, LEGENDARY_IDS, encounterTableFor, eligibleEntries, pickEncounter,
  defaultSpeciesId, validateBiomes,
} from "../src/encounters.js";
import { generateMap } from "../src/run.js";
import { GEN1_MAX_ID } from "../src/data.js";

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { console.error("  ✗ " + name + "\n    " + e.message); process.exitCode = 1; }
}

console.log("biome encounter tests");

test("biome tables are structurally valid", () => {
  const errors = validateBiomes();
  assert.deepStrictEqual(errors, [], "expected no validation errors, got: " + errors.join("; "));
});

test("every entry is a real, non-legendary Gen 1 id with a positive weight", () => {
  for (const key of Object.keys(BIOMES)) {
    for (const e of BIOMES[key].entries) {
      assert.ok(Number.isInteger(e.id) && e.id >= 1 && e.id <= GEN1_MAX_ID, `bad id ${e.id}`);
      assert.ok(!LEGENDARY_IDS.has(e.id), `legendary ${e.id} leaked into region ${key}`);
      assert.ok(e.weight > 0, `non-positive weight for ${e.id}`);
    }
  }
});

test("the three regions produce measurably different pools", () => {
  const idsOf = (r) => new Set(BIOMES[r].entries.map((e) => e.id));
  const a = idsOf(0), b = idsOf(1), c = idsOf(2);
  const overlap = (x, y) => [...x].filter((id) => y.has(id));
  assert.deepStrictEqual(overlap(a, b), [], "region 0 and 1 share species");
  assert.deepStrictEqual(overlap(b, c), [], "region 1 and 2 share species");
  assert.deepStrictEqual(overlap(a, c), [], "region 0 and 2 share species");
});

test("encounterTableFor selects by node region and falls back safely", () => {
  assert.strictEqual(encounterTableFor({ region: 0 }, null), BIOMES[0]);
  assert.strictEqual(encounterTableFor({ region: 2 }, null), BIOMES[2]);
  // Out-of-range region clamps into the valid table set.
  assert.strictEqual(encounterTableFor({ region: 9 }, null), BIOMES[2]);
  // No node → fall back to the run's current node region, else region 0.
  const run = { position: "n", map: { nodes: { n: { region: 1 } } } };
  assert.strictEqual(encounterTableFor(null, run), BIOMES[1]);
  assert.strictEqual(encounterTableFor(null, {}), BIOMES[0]);
});

test("depth gating hides rares early but always leaves a valid encounter", () => {
  const table = BIOMES[0];
  const atZero = eligibleEntries(table, 0).map((e) => e.id);
  assert.ok(!atZero.includes(25), "Pikachu (minDepth 1) should not appear at depth 0");
  assert.ok(!atZero.includes(1), "Bulbasaur (minDepth 1) should not appear at depth 0");
  assert.ok(atZero.length > 0, "depth 0 still offers commons");
  const atOne = eligibleEntries(table, 1).map((e) => e.id);
  assert.ok(atOne.includes(25) && atOne.includes(1), "rares unlock from depth 1");
  // Every region yields at least one encounter across a wide depth range.
  for (const key of Object.keys(BIOMES)) {
    for (let d = 0; d <= 20; d++) {
      assert.ok(eligibleEntries(BIOMES[key], d).length > 0, `region ${key} empty at depth ${d}`);
    }
  }
});

test("pickEncounter is seeded: same seed reproduces the same species", () => {
  const table = BIOMES[1];
  const seq1 = [], seq2 = [];
  const r1 = makeRng(4242), r2 = makeRng(4242);
  for (let i = 0; i < 25; i++) {
    seq1.push(pickEncounter(r1, table, 5).id);
    seq2.push(pickEncounter(r2, table, 5).id);
  }
  assert.deepStrictEqual(seq1, seq2, "identical seeds should reproduce the sequence");
  // Different seed diverges (extremely unlikely to match across 25 draws).
  const r3 = makeRng(99);
  const seq3 = Array.from({ length: 25 }, () => pickEncounter(r3, table, 5).id);
  assert.notDeepStrictEqual(seq1, seq3);
});

test("picks only ever come from the selected region's table", () => {
  const rng = makeRng(7);
  const ids = new Set(BIOMES[2].entries.map((e) => e.id));
  for (let i = 0; i < 200; i++) {
    assert.ok(ids.has(pickEncounter(rng, BIOMES[2], 10).id), "pick escaped the region table");
  }
});

test("commons are weighted above rares over many draws", () => {
  const rng = makeRng(123);
  let common = 0, rare = 0;
  const rares = new Set(BIOMES[0].entries.filter((e) => e.tags.includes("rare")).map((e) => e.id));
  for (let i = 0; i < 4000; i++) {
    const id = pickEncounter(rng, BIOMES[0], 5).id;
    if (rares.has(id)) rare++; else common++;
  }
  assert.ok(common > rare * 3, `commons (${common}) should dominate rares (${rare})`);
});

test("generated maps only reference regions that have a biome table", () => {
  const map = generateMap(makeRng(2026));
  for (const node of Object.values(map.nodes)) {
    assert.ok(BIOMES[node.region], `region ${node.region} has no biome table`);
    assert.ok(eligibleEntries(encounterTableFor(node, null), 0).length > 0, `no encounter for node ${node.id}`);
  }
});

test("defaultSpeciesId is a valid, non-legendary common", () => {
  const id = defaultSpeciesId();
  assert.ok(Number.isInteger(id) && id >= 1 && id <= GEN1_MAX_ID);
  assert.ok(!LEGENDARY_IDS.has(id));
});

console.log(`\n${passed} checks passed`);
