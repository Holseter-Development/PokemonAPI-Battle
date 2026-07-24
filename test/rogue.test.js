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
  rollMysteryEvent, rollMysteryEncounter, pickTrainerReward, TRAINER_REWARDS,
  MYSTERY_TRAINER_CHANCE, rollGold, encounterLevel, bossMemberLevel, RUN_CONFIG,
  eventGoldCost, resolveCoinflip, resolveWishingWell, resolveShrineScar,
  SHRINE_SCAR_STATS, rollWildShiny,
} from "../src/run.js";
import { WANDERING_TRAINERS, GEN1_MAX_ID } from "../src/data.js";

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
    assert.strictEqual(rowsPerRegion, 7, "each region has five route nodes, a Rest, and a boss");
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
    // The opening row always leaves at least one Wild encounter available so a
    // fresh run can start by catching a Pokémon; early rows otherwise vary.
    assert.ok(
      map.rows[0].length > 0 && map.rows[0].some((id) => map.nodes[id].type === NODE.BATTLE),
      `opening row should offer a Wild battle (${seed})`,
    );
    // Early rows lean on battles but are no longer exclusively battles: shops,
    // rests, and mysteries may seed in (rarer than deeper rows).
    for (const id of map.rows[0].concat(map.rows[1])) {
      assert.ok(
        [NODE.BATTLE, NODE.MYSTERY, NODE.SHOP, NODE.REST].includes(map.nodes[id].type),
        `early node ${id} should be a route node (${seed})`,
      );
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

test("wandering trainers are valid, non-legendary, and reference real sprites", () => {
  assert.ok(WANDERING_TRAINERS.length >= 4, "there is a pool of wandering trainers");
  for (const t of WANDERING_TRAINERS) {
    assert.ok(t.leader && t.type && t.intro, `${t.leader} has identity + intro copy`);
    assert.match(t.sprite, /^assets\/sprites\/.+\.png$/, `${t.leader} points at a real sprite asset`);
    assert.ok(Array.isArray(t.team) && t.team.length >= 1, `${t.leader} has a team`);
    for (const id of t.team) {
      assert.ok(Number.isInteger(id) && id >= 1 && id <= GEN1_MAX_ID, `${t.leader} team id ${id} is Gen 1`);
      assert.ok(id < 144 || id > 151, `${t.leader} team id ${id} is not a legendary`);
    }
  }
});

test("trainer reward table is well-formed and picks are valid, bounded rewards", () => {
  const allowedItems = new Set(["poke-ball", "great-ball", "potion", "super-potion"]);
  for (const entry of TRAINER_REWARDS) {
    assert.ok(entry.weight > 0, "every reward carries a positive weight");
    const r = entry.reward;
    assert.ok(["gold", "item", "egg"].includes(r.kind), "reward kinds are recognised");
    if (r.kind === "item") assert.ok(allowedItems.has(r.id), `${r.id} is a real run item`);
    if (r.kind === "gold") assert.ok(r.max >= r.min && r.min > 0, "gold reward has a sane range");
  }
  // Sweep the rng so every branch of the picker is exercised.
  const rng = makeRng(4242);
  const kinds = new Set();
  for (let i = 0; i < 400; i++) {
    const reward = pickTrainerReward(rng);
    kinds.add(reward.kind);
    assert.ok(reward.label, "every reward is player-describable");
    if (reward.kind === "gold") {
      assert.ok(reward.amount >= 40 && reward.amount <= 90, "gold amount stays inside the table range");
      assert.strictEqual(reward.min, undefined, "resolved gold reward drops its range fields");
    }
    if (reward.kind === "item") assert.ok(reward.amount >= 1, "item rewards grant at least one");
  }
  assert.ok(kinds.has("gold") && kinds.has("item") && kinds.has("egg"), "all reward kinds are reachable");
});

test("mystery encounter is deterministic and yields both trainers and events", () => {
  // Same seed + state reproduces the same encounter (and reward).
  const a = rollMysteryEncounter(clone(createRun("MYST")));
  const b = rollMysteryEncounter(clone(createRun("MYST")));
  assert.deepStrictEqual(a, b, "a fixed seed reproduces the encounter");

  // Across many seeds we see both branches; trainer encounters carry a reward.
  let trainers = 0, events = 0;
  for (let i = 0; i < 200; i++) {
    const enc = rollMysteryEncounter(createRun("SEED" + i));
    if (enc.kind === "trainer") {
      trainers++;
      assert.ok(enc.trainer && enc.trainer.team, "trainer encounter includes a trainer");
      assert.ok(enc.reward && enc.reward.kind, "trainer encounter pre-rolls a reward");
    } else {
      events++;
      assert.ok(enc.event && enc.event.choices.length >= 1, "event encounter includes a classic event");
    }
  }
  assert.ok(trainers > 0 && events > 0, "both trainer and event mysteries occur");
  assert.ok(MYSTERY_TRAINER_CHANCE > 0 && MYSTERY_TRAINER_CHANCE < 1, "trainer chance is a proper probability");
});

test("encounters and Elite bosses stay near an under-levelled living party", () => {
  const run = {
    visited: new Array(4),
    ascension: 0,
    team: [{ level: 5, stats: { hp: 18 } }],
  };
  assert.strictEqual(encounterLevel(run), 6, "route cannot race far beyond a level 5 partner");
  // The Elite lead sits at parity with your strongest Pokémon (5), not the
  // encounter level (6) — so a level-spread team is not out-levelled by the boss.
  assert.strictEqual(bossMemberLevel(run, 0, false), 5, "first Elite member fights at parity with your best");
  assert.strictEqual(bossMemberLevel(run, 2, false), 6, "boss team ramps gradually");
  // A stronger best raises the boss one-for-one (still parity, never above).
  const stronger = { visited: new Array(6), ascension: 0, team: [{ level: 9, stats: { hp: 20 } }, { level: 6, stats: { hp: 10 } }] };
  assert.strictEqual(bossMemberLevel(stronger, 0, false), 9, "Elite lead matches the strongest living mon");
});

test("paid Mystery costs stay affordable and never exceed the flavor amount", () => {
  // Flat broke → no charge (choice is disabled in the UI).
  assert.strictEqual(eventGoldCost({ visited: [], gold: 0 }, 100), 0, "broke players are charged nothing");
  // Poor but not broke → spend exactly what you have ("all your money").
  assert.strictEqual(eventGoldCost({ visited: [], gold: 15 }, 100), 15, "cost clamps to gold on hand");
  // Rich + shallow → discounted well below the nominal amount.
  const early = eventGoldCost({ visited: [], gold: 9999 }, 100);
  assert.ok(early < 100 && early >= 10, `early cost is discounted (${early})`);
  // Deeper runs ask for more, but never above the flavor amount.
  const deep = eventGoldCost({ visited: new Array(30), gold: 9999 }, 100);
  assert.ok(deep > early && deep <= 100, `cost grows with depth but is capped (${deep})`);
});

test("fainted high-level reserves do not inflate encounters", () => {
  const run = {
    visited: new Array(8),
    ascension: 0,
    team: [
      { level: 5, stats: { hp: 12 } },
      { level: 40, stats: { hp: 0 } },
    ],
  };
  assert.strictEqual(encounterLevel(run), 6);
  // Boss level keys off the strongest *living* mon (5), not the fainted level-40
  // reserve. Champion keeps its two-level cushion above that parity: 5 + 2 = 7.
  assert.strictEqual(bossMemberLevel(run, 0, true), 7, "Champion keeps a bounded two-level step over your best");
});

// ---- P2.2: deterministic Mystery outcome rolls ----
const scarRun = (seed) => {
  const run = createRun(seed);
  run.team = [
    { name: "A", stats: { atk: 100, def: 100, spa: 100, spd: 100, spe: 100 } },
    { name: "B", stats: { atk: 100, def: 100, spa: 100, spd: 100, spe: 100 } },
    { name: "C", stats: { atk: 100, def: 100, spa: 100, spd: 100, spe: 100 } },
  ];
  return run;
};

test("resolveCoinflip: deterministic per rng state and signs the stake", () => {
  const a = createRun("COIN"), b = clone(a);
  const ra = resolveCoinflip(a, 60), rb = resolveCoinflip(b, 60);
  assert.deepStrictEqual(ra, rb, "same seed + state reproduces the flip");
  assert.strictEqual(ra.delta, ra.won ? 60 : -60, "delta is the signed stake");
  // Advancing the run's rng between flips can change the outcome (it is a roll).
  const run = createRun("COIN2");
  const first = resolveCoinflip(run, 10);
  const second = resolveCoinflip(run, 10);
  assert.ok(typeof first.won === "boolean" && typeof second.won === "boolean");
});

test("resolveCoinflip: both wins and losses occur across seeds", () => {
  let wins = 0, losses = 0;
  for (let i = 0; i < 60; i++) (resolveCoinflip(createRun("CF" + i), 10).won ? wins++ : losses++);
  assert.ok(wins > 0 && losses > 0, `saw wins (${wins}) and losses (${losses})`);
});

test("resolveWishingWell: deterministic, all outcomes reachable, gold in range", () => {
  const a = createRun("WELL"), b = clone(a);
  assert.deepStrictEqual(resolveWishingWell(a), resolveWishingWell(b), "same seed reproduces the well");
  const seen = new Set();
  for (let i = 0; i < 300; i++) {
    const r = resolveWishingWell(createRun("WW" + i));
    seen.add(r.outcome);
    if (r.outcome === "gold") assert.ok(r.gold >= 80 && r.gold <= 159, `gold in range (${r.gold})`);
    else assert.strictEqual(r.gold, undefined, "non-gold outcomes carry no gold");
  }
  for (const o of ["gold", "mutation", "nothing"]) assert.ok(seen.has(o), `well can roll "${o}"`);
});

test("resolveShrineScar: deterministic; victim index and stat stay in range", () => {
  const a = scarRun("SCAR"), b = clone(a);
  assert.deepStrictEqual(resolveShrineScar(a), resolveShrineScar(b), "same seed reproduces the scar");
  const stats = new Set(SHRINE_SCAR_STATS);
  for (let i = 0; i < 60; i++) {
    const r = resolveShrineScar(scarRun("SC" + i));
    assert.ok(r.victimIndex >= 0 && r.victimIndex < 3, `victim in team (${r.victimIndex})`);
    assert.ok(stats.has(r.stat), `stat is real (${r.stat})`);
  }
  // An empty team yields no victim so the controller can skip the scar safely.
  const empty = createRun("EMPTY"); empty.team = [];
  assert.strictEqual(resolveShrineScar(empty).victimIndex, -1, "empty team has no victim");
});

test("mystery rolls: restoring rng state does not reroll a pending outcome", () => {
  // Simulates save → reload before the player confirms: the same result stands.
  const run = createRun("SAVE");
  const before = run.rngState;
  const first = resolveWishingWell(run);
  run.rngState = before;
  assert.deepStrictEqual(resolveWishingWell(run), first, "reload reproduces the pending well");

  const coinRun = createRun("SAVE2");
  const coinState = coinRun.rngState;
  const flip = resolveCoinflip(coinRun, 40);
  coinRun.rngState = coinState;
  assert.deepStrictEqual(resolveCoinflip(coinRun, 40), flip, "reload reproduces the pending flip");
});

// ---- P2.3: deterministic wild shiny roll ----
test("rollWildShiny: forced odds always/never shine, base odds are rare", () => {
  // 1-in-1 always yields a shiny; a huge denominator effectively never does.
  assert.strictEqual(rollWildShiny(createRun("SHINY"), 1), true, "1-in-1 is guaranteed");
  assert.strictEqual(rollWildShiny(createRun("SHINY"), 1e9), false, "astronomical odds never shine");
  // Invalid odds fall back to the base 1/512 rather than throwing/NaN.
  assert.strictEqual(typeof rollWildShiny(createRun("SHINY"), undefined), "boolean");

  // Both outcomes occur across seeds, but shinies stay rare at base odds.
  let shinies = 0;
  const N = 3000;
  for (let i = 0; i < N; i++) if (rollWildShiny(createRun("SH" + i), 512)) shinies++;
  assert.ok(shinies > 0, "some shinies appear over many seeds");
  assert.ok(shinies / N < 0.02, `shinies stay rare at base odds (${shinies}/${N})`);
});

test("rollWildShiny: deterministic per rng state and reload-safe", () => {
  const a = createRun("REPRO"), b = clone(a);
  assert.strictEqual(rollWildShiny(a, 4), rollWildShiny(b, 4), "same seed reproduces the roll");
  // Restoring the pre-roll state reproduces the pending encounter's shininess.
  const run = createRun("PENDING");
  const before = run.rngState;
  const first = rollWildShiny(run, 8);
  run.rngState = before;
  assert.strictEqual(rollWildShiny(run, 8), first, "reload does not reroll shininess");
});

console.log(`\n${passed} checks passed`);
