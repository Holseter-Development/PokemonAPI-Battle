// Head-less battle-engine tests. Bundled with esbuild (platform=node) and run
// with `npm test`. Exercises the pure engine with a seeded RNG so results are
// deterministic and full battles can be simulated without a browser.

import assert from "node:assert";
import {
  typeEffect, calcDamage, useMove, applyAilment, canAct, endOfTurn,
  firstMover, effectiveStat, chooseAIMove, bestMoveIndex, catchSuccess,
  rollHit, switchOutHeal, applyEntryStatus, applyWeatherChip, applyDefeatHeal,
} from "../src/battle.js";
import { selectMoves, spriteSet } from "../src/api.js";
import { buildMove, GYMS, CHAMPION } from "../src/data.js";
import { aggregateSigils, applyStartingBallBonus } from "../src/mutations.js";
import { snapshotMon, buildRoster, validateRoster, rosterPower, carryIdentity } from "../src/roster.js";

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  ✓ " + name);
  } catch (e) {
    console.error("  ✗ " + name + "\n    " + e.message);
    process.exitCode = 1;
  }
}

// Deterministic LCG so tests are reproducible.
function makeRng(seed = 12345) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function mon(over = {}) {
  return {
    id: over.id || 1,
    name: over.name || "Test",
    level: over.level || 20,
    isShiny: !!over.isShiny,
    types: over.types || ["normal"],
    stats: Object.assign({ maxHp: 80, hp: 80, atk: 60, def: 60, spa: 60, spd: 60, spe: 60 }, over.stats),
    stages: Object.assign({ atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 }, over.stages),
    status: over.status || { cond: "none", turns: 0, toxic: 0 },
    moves: over.moves || [dmgMove()],
    capture_rate: over.capture_rate || 45,
  };
}
function dmgMove(over = {}) {
  return Object.assign({
    name: "Tackle", key: "tackle", power: 40, accuracy: 100, type: "normal",
    damage_class: "physical", pp: 35, ppLeft: 35, priority: 0, category: "damage",
    drain: 0, healing: 0, minHits: 1, maxHits: 1, statChanges: [], statChance: 0,
    flinchChance: 0, ailment: "none", ailmentChance: 0, highCrit: false, selfTarget: false,
  }, over);
}

console.log("engine tests");

test("type chart: fire→grass is 2x, water→fire 2x, normal→ghost 0", () => {
  assert.strictEqual(typeEffect("fire", ["grass"]), 2);
  assert.strictEqual(typeEffect("water", ["fire"]), 2);
  assert.strictEqual(typeEffect("normal", ["ghost"]), 0);
  assert.strictEqual(typeEffect("electric", ["water", "flying"]), 4);
});

test("damage: neutral hit is >=1, immunity is 0", () => {
  const rng = makeRng();
  const a = mon(), d = mon();
  const { dmg } = calcDamage(a, d, dmgMove(), rng);
  assert.ok(dmg >= 1, "neutral dmg should be >=1");
  const ghost = mon({ types: ["ghost"] });
  const { dmg: d0, eff } = calcDamage(a, ghost, dmgMove(), rng);
  assert.strictEqual(eff, 0);
  assert.strictEqual(d0, 0);
});

test("STAB gives ~1.5x more than non-STAB (avg roll)", () => {
  const stab = mon({ types: ["normal"] });
  const noStab = mon({ types: ["water"] });
  const d = mon({ types: ["bug"] }); // normal neutral vs bug
  const s = calcDamage(stab, d, dmgMove(), makeRng(), { avg: true, forceCrit: false });
  const n = calcDamage(noStab, d, dmgMove(), makeRng(), { avg: true, forceCrit: false });
  assert.ok(s.dmg > n.dmg, "STAB should out-damage non-STAB");
});

test("stat stages raise damage output", () => {
  const base = mon();
  const boosted = mon({ stages: { atk: 2 } });
  const d = mon();
  const b = calcDamage(base, d, dmgMove(), makeRng(), { avg: true });
  const u = calcDamage(boosted, d, dmgMove(), makeRng(), { avg: true });
  assert.ok(u.dmg > b.dmg, "+2 atk should increase damage");
});

test("effectiveStat: paralysis quarters speed", () => {
  const par = mon({ status: { cond: "par", turns: 0, toxic: 0 } });
  const norm = mon();
  assert.ok(effectiveStat(par, "spe") < effectiveStat(norm, "spe"));
});

test("useMove: multi-hit lands 2-5 hits", () => {
  const a = mon();
  const d = mon({ stats: { maxHp: 500, hp: 500 } });
  const move = dmgMove({ name: "Fury", key: "fury-swipes", minHits: 2, maxHits: 5 });
  const res = useMove(a, d, move, makeRng(7));
  assert.ok(res.hits.length >= 2 && res.hits.length <= 5, "hits " + res.hits.length);
});

test("useMove: recoil damages attacker, drain heals", () => {
  const a = mon({ stats: { maxHp: 200, hp: 100 } });
  const d = mon({ stats: { maxHp: 300, hp: 300 } });
  useMove(a, d, dmgMove({ key: "double-edge", drain: -25 }), makeRng(3));
  assert.ok(a.stats.hp < 100, "recoil should hurt attacker");

  const a2 = mon({ stats: { maxHp: 200, hp: 50 } });
  const d2 = mon({ stats: { maxHp: 300, hp: 300 } });
  useMove(a2, d2, dmgMove({ key: "absorb", drain: 50 }), makeRng(3));
  assert.ok(a2.stats.hp > 50, "drain should heal attacker");
});

test("useMove: healing move restores HP", () => {
  const a = mon({ stats: { maxHp: 200, hp: 50 } });
  const d = mon();
  const res = useMove(a, d, dmgMove({ key: "recover", power: 0, damage_class: "status", category: "heal", healing: 50 }), makeRng());
  assert.ok(a.stats.hp > 50 && res.healed > 0);
});

test("useMove: pure status move applies ailment reliably", () => {
  const a = mon();
  const d = mon({ types: ["water"] });
  const twave = dmgMove({ key: "thunder-wave", power: 0, damage_class: "status", category: "ailment", ailment: "paralysis", ailmentChance: 0, accuracy: 100 });
  const res = useMove(a, d, twave, makeRng());
  assert.strictEqual(d.status.cond, "par");
  assert.ok(res.ailment && res.ailment.cond === "par");
});

test("useMove: self-target setup raises own stat", () => {
  const a = mon();
  const d = mon();
  const sd = dmgMove({ key: "swords-dance", power: 0, damage_class: "status", category: "net-good-stats", selfTarget: true, statChanges: [{ stat: "atk", change: 2 }], accuracy: null });
  useMove(a, d, sd, makeRng());
  assert.strictEqual(a.stages.atk, 2);
});

test("ailment: fire immune to burn, already-statused blocked", () => {
  const fire = mon({ types: ["fire"] });
  assert.strictEqual(applyAilment(fire, "burn", makeRng()).applied, false);
  const m = mon({ status: { cond: "psn", turns: 0, toxic: 0 } });
  assert.strictEqual(applyAilment(m, "paralysis", makeRng()).applied, false);
});

test("endOfTurn: burn/poison chip damage, toxic escalates", () => {
  const m = mon({ status: { cond: "brn", turns: 0, toxic: 0 } });
  const r = endOfTurn(m);
  assert.ok(r.dmg >= 1 && m.stats.hp < m.stats.maxHp);
  const t = mon({ status: { cond: "tox", turns: 0, toxic: 1 } });
  const r1 = endOfTurn(t), r2 = endOfTurn(t);
  assert.ok(r2.dmg > r1.dmg, "toxic should escalate");
});

test("firstMover: priority beats speed; speed breaks ties", () => {
  const fast = mon({ stats: { spe: 100 } });
  const slow = mon({ stats: { spe: 40 } });
  assert.strictEqual(firstMover(slow, dmgMove({ priority: 1 }), fast, dmgMove(), makeRng()), "a");
  assert.strictEqual(firstMover(fast, dmgMove(), slow, dmgMove(), makeRng()), "a");
});

test("chooseAIMove & bestMoveIndex return valid indices", () => {
  const a = mon({ moves: [dmgMove({ type: "water" }), dmgMove({ type: "grass" })] });
  const d = mon({ types: ["fire"] });
  const ai = chooseAIMove(a, d, makeRng());
  assert.ok(ai >= 0 && ai < 2);
  const best = bestMoveIndex(a, d);
  assert.strictEqual(best, 0, "water should be chosen vs fire");
});

test("selectMoves: <=4 moves, at least one damaging, unique", () => {
  const fx = (name, cls, power, extra = {}) => ({
    md: Object.assign({ name, damage_class: { name: cls }, power, accuracy: 100, pp: 20,
      type: { name: "normal" }, generation: { name: "generation-i" }, meta: {} }, extra), level: 1 });
  const set = selectMoves([
    fx("tackle", "physical", 40), fx("scratch", "physical", 40),
    fx("swords-dance", "status", 0), fx("growl", "status", 0),
    fx("body-slam", "physical", 85), fx("tackle", "physical", 40),
  ]);
  assert.ok(set.length <= 4 && set.length >= 1);
  assert.ok(set.some((m) => m.power > 0), "needs a damaging move");
  const names = set.map((m) => m.key);
  assert.strictEqual(new Set(names).size, names.length, "no dupes");
});

test("spriteSet prefers animated Gen-V, falls back cleanly", () => {
  const data = { sprites: {
    front_default: "front.png", back_default: "back.png",
    versions: { "generation-v": { "black-white": { animated: { front_default: "af.gif", back_default: "ab.gif" } } } },
    other: { "official-artwork": { front_default: "art.png" } },
  } };
  const s = spriteSet(data);
  assert.strictEqual(s.front, "af.gif");
  assert.strictEqual(s.back, "ab.gif");
  assert.ok(s.animated);
  const bare = spriteSet({ sprites: { front_default: "f.png" } });
  assert.strictEqual(bare.front, "f.png");
  assert.strictEqual(bare.animated, false);
});

test("spriteSet: shiny prefers shiny art and falls back to normal safely", () => {
  const full = { sprites: {
    front_default: "front.png", back_default: "back.png",
    front_shiny: "front_s.png", back_shiny: "back_s.png",
    versions: { "generation-v": { "black-white": { animated: {
      front_default: "af.gif", back_default: "ab.gif",
      front_shiny: "af_s.gif", back_shiny: "ab_s.gif",
    } } } },
    other: { "official-artwork": { front_default: "art.png", front_shiny: "art_s.png" } },
  } };
  const s = spriteSet(full, true);
  assert.strictEqual(s.front, "af_s.gif", "prefers animated shiny front");
  assert.strictEqual(s.back, "ab_s.gif", "prefers animated shiny back");
  assert.strictEqual(s.shiny, true);
  assert.ok(s.animated);

  // No shiny data anywhere → shiny request falls back to the normal sprites.
  const noShiny = { sprites: { front_default: "f.png", back_default: "b.png" } };
  const fb = spriteSet(noShiny, true);
  assert.strictEqual(fb.front, "f.png", "missing shiny front falls back");
  assert.strictEqual(fb.back, "b.png", "missing shiny back falls back");
  assert.strictEqual(fb.shiny, true, "still flagged shiny");
});

test("catchSuccess: weakened + statused catches more than full HP", () => {
  const rng = makeRng();
  let weak = 0, full = 0;
  for (let i = 0; i < 2000; i++) {
    if (catchSuccess(mon({ stats: { maxHp: 80, hp: 4 }, status: { cond: "slp", turns: 2, toxic: 0 } }), 1, rng)) weak++;
    if (catchSuccess(mon({ stats: { maxHp: 80, hp: 80 } }), 1, rng)) full++;
  }
  assert.ok(weak > full, `weak ${weak} vs full ${full}`);
});

// ---- full battle simulation: it must always terminate & stay in-bounds ----
test("simulated battles terminate and keep HP in range", () => {
  const rng = makeRng(99);
  for (let b = 0; b < 300; b++) {
    const A = mon({ name: "A", types: ["fire"], moves: [
      dmgMove({ type: "fire", key: "ember", ailment: "burn", ailmentChance: 10 }),
      dmgMove({ key: "swords-dance", power: 0, damage_class: "status", category: "net-good-stats", selfTarget: true, statChanges: [{ stat: "atk", change: 2 }], accuracy: null }),
    ] });
    const B = mon({ name: "B", types: ["grass"], moves: [
      dmgMove({ type: "grass", key: "vine-whip" }),
      dmgMove({ type: "normal", key: "quick-attack", priority: 1 }),
    ] });
    let turns = 0;
    while (A.stats.hp > 0 && B.stats.hp > 0 && turns < 300) {
      turns++;
      const aMove = A.moves[chooseAIMove(A, B, rng)];
      const bMove = B.moves[chooseAIMove(B, A, rng)];
      const order = firstMover(A, aMove, B, bMove, rng) === "a" ? [[A, B, aMove], [B, A, bMove]] : [[B, A, bMove], [A, B, aMove]];
      for (const [att, def, mv] of order) {
        if (att.stats.hp <= 0 || def.stats.hp <= 0) continue;
        const act = canAct(att, rng);
        if (!act.canAct) continue;
        useMove(att, def, mv, rng);
      }
      for (const m of [A, B]) if (m.stats.hp > 0) endOfTurn(m);
      for (const m of [A, B]) {
        assert.ok(m.stats.hp >= 0 && m.stats.hp <= m.stats.maxHp, "hp out of range: " + m.stats.hp);
        assert.ok(m.stages.atk >= -6 && m.stages.atk <= 6, "stage out of range");
      }
    }
    assert.ok(turns < 300, "battle failed to terminate");
  }
});

// ---- mutation / ability hooks ----
test("adaptive mutation doubles STAB", () => {
  const base = mon({ types: ["normal"] });
  const adap = mon({ types: ["normal"], stats: {} }); adap.adaptive = true;
  const d = mon({ types: ["bug"] });
  const b = calcDamage(base, d, dmgMove(), makeRng(), { avg: true });
  const a = calcDamage(adap, d, dmgMove(), makeRng(), { avg: true });
  assert.ok(a.dmg > b.dmg, "adaptive should out-damage normal STAB");
});

test("levitate mutation grants Ground immunity", () => {
  const a = mon();
  const lev = mon({ stats: { def: 60 } }); lev.abilities = ["levitate"];
  const { dmg, eff } = calcDamage(a, lev, dmgMove({ type: "ground", power: 80 }), makeRng());
  assert.strictEqual(eff, 0);
  assert.strictEqual(dmg, 0);
});

test("guts ignores burn drop and boosts Attack; trueStrike never misses", () => {
  const burned = mon({ status: { cond: "brn", turns: 0, toxic: 0 } }); burned.abilities = ["guts"];
  const plain = mon({ status: { cond: "brn", turns: 0, toxic: 0 } });
  const d = mon();
  const g = calcDamage(burned, d, dmgMove(), makeRng(), { avg: true });
  const p = calcDamage(plain, d, dmgMove(), makeRng(), { avg: true });
  assert.ok(g.dmg > p.dmg, "guts should hit harder while burned");
  const sniper = mon(); sniper.trueStrike = true;
  let hits = 0;
  const rng = makeRng(5);
  for (let i = 0; i < 50; i++) if (rollHit(dmgMove({ accuracy: 30 }), sniper, mon(), rng)) hits++;
  assert.strictEqual(hits, 50, "trueStrike always hits");
});

test("multiscale halves damage at full HP; vampiric heals; regen on switch", () => {
  const atk = mon();
  const full = mon({ stats: { maxHp: 100, hp: 100, def: 60 } }); full.abilities = ["multiscale"];
  const hurt = mon({ stats: { maxHp: 100, hp: 60, def: 60 } }); hurt.abilities = ["multiscale"];
  const dFull = calcDamage(atk, full, dmgMove({ power: 80 }), makeRng(), { avg: true, forceCrit: false });
  const dHurt = calcDamage(atk, hurt, dmgMove({ power: 80 }), makeRng(), { avg: true, forceCrit: false });
  assert.ok(dFull.dmg < dHurt.dmg, "multiscale reduces damage at full HP");

  const vamp = mon({ stats: { maxHp: 200, hp: 50 } }); vamp.lifesteal = 0.25;
  const prey = mon({ stats: { maxHp: 300, hp: 300 } });
  useMove(vamp, prey, dmgMove({ power: 60 }), makeRng(3));
  assert.ok(vamp.stats.hp > 50, "vampiric heals attacker");

  const regen = mon({ stats: { maxHp: 90, hp: 30 } }); regen.abilities = ["regenerator"];
  const healed = switchOutHeal(regen);
  assert.ok(healed > 0 && regen.stats.hp === 60);
});

// ---- run-wide Sigil battle context hooks ----
test("weather Sigils change their player move types", () => {
  const cases = [
    ["solar_core", "fire", ">"], ["solar_core", "water", "<"],
    ["monsoon", "water", ">"], ["monsoon", "fire", "<"],
    ["permafrost", "ice", ">"], ["sand_totem", "rock", ">"], ["sand_totem", "ground", ">"],
  ];
  for (const [sigil, type, direction] of cases) {
    const attacker = mon({ types: [type] });
    const defender = mon({ types: ["normal"] });
    const move = dmgMove({ type });
    const plain = calcDamage(attacker, defender, move, () => 0.99, { avg: true });
    const changed = calcDamage(attacker, defender, move, () => 0.99, { avg: true }, {
      playerFx: aggregateSigils([sigil]), attackerIsPlayer: true,
    });
    assert.ok(direction === ">" ? changed.dmg > plain.dmg : changed.dmg < plain.dmg, `${sigil} ${type}`);
  }
});

test("Glass Armory boosts both sides; Apex damage only boosts the player", () => {
  const attacker = mon(), defender = mon({ types: ["bug"] }), move = dmgMove();
  const plain = calcDamage(attacker, defender, move, () => 0.99, { avg: true });
  const glassFx = aggregateSigils(["glass_armory"]);
  const glassPlayer = calcDamage(attacker, defender, move, () => 0.99, { avg: true }, {
    playerFx: glassFx, attackerIsPlayer: true,
  });
  const glassEnemy = calcDamage(attacker, defender, move, () => 0.99, { avg: true }, {
    playerFx: glassFx, attackerIsPlayer: false,
  });
  assert.ok(glassPlayer.dmg > plain.dmg && glassEnemy.dmg > plain.dmg);

  const apexFx = aggregateSigils(["apex"]);
  const apexPlayer = calcDamage(attacker, defender, move, () => 0.99, { avg: true }, {
    playerFx: apexFx, attackerIsPlayer: true,
  });
  const apexEnemy = calcDamage(attacker, defender, move, () => 0.99, { avg: true }, {
    playerFx: apexFx, attackerIsPlayer: false,
  });
  assert.ok(apexPlayer.dmg > plain.dmg);
  assert.strictEqual(apexEnemy.dmg, plain.dmg);
});

test("Momentum Engine adds crit chance for unswitched player turns only", () => {
  const attacker = mon(), defender = mon(), move = dmgMove();
  const fx = aggregateSigils(["momentum"]);
  const plain = calcDamage(attacker, defender, move, () => 0.3, { avg: true }, {
    playerFx: fx, attackerIsPlayer: true, noSwitchTurns: 0,
  });
  const ramped = calcDamage(attacker, defender, move, () => 0.3, { avg: true }, {
    playerFx: fx, attackerIsPlayer: true, noSwitchTurns: 3,
  });
  const enemy = calcDamage(attacker, defender, move, () => 0.3, { avg: true }, {
    playerFx: fx, attackerIsPlayer: false, noSwitchTurns: 3,
  });
  assert.strictEqual(plain.crit, false);
  assert.strictEqual(ramped.crit, true);
  assert.strictEqual(enemy.crit, false);
});

test("Sturdy Banner caps a full-HP hit; Second Wind is consumed once", () => {
  const attacker = mon({ stats: { atk: 180 } });
  const sturdy = mon({ stats: { maxHp: 100, hp: 100, def: 20 } });
  const sturdyFx = aggregateSigils(["sturdy_banner"]);
  const hit = calcDamage(attacker, sturdy, dmgMove({ power: 200 }), () => 0.99, { avg: true }, {
    playerFx: sturdyFx, defenderIsPlayer: true,
  });
  assert.ok(hit.dmg <= 50, `Sturdy damage was ${hit.dmg}`);

  const defender = mon({ stats: { maxHp: 80, hp: 30, def: 20 } });
  const flag = { used: false };
  const ctx = { playerFx: aggregateSigils(["second_wind"]), defenderIsPlayer: true, endureUsed: flag };
  const first = useMove(attacker, defender, dmgMove({ power: 200 }), () => 0.99, ctx);
  assert.strictEqual(defender.stats.hp, 1);
  assert.ok(first.endured && flag.used);
  const second = useMove(attacker, defender, dmgMove({ power: 200 }), () => 0.99, ctx);
  assert.strictEqual(defender.stats.hp, 0);
  assert.ok(second.targetFainted);
});

test("Vampire Pact stacks additively with the Vampiric mutation", () => {
  const attacker = mon({ stats: { maxHp: 200, hp: 20 } });
  attacker.lifesteal = 0.25;
  const defender = mon({ stats: { maxHp: 300, hp: 300 } });
  const res = useMove(attacker, defender, dmgMove({ power: 80 }), () => 0.99, {
    playerFx: aggregateSigils(["vampire_pact"]), attackerIsPlayer: true,
  });
  assert.strictEqual(res.drain, Math.max(1, Math.floor(res.totalDmg * 0.37)));
  assert.strictEqual(attacker.stats.hp, 20 + res.drain);
});

test("Trick Lens reverses speed order without reversing priority", () => {
  const fast = mon({ stats: { spe: 100 } });
  const slow = mon({ stats: { spe: 40 } });
  const ctx = { playerFx: aggregateSigils(["trick_lens"]) };
  assert.strictEqual(firstMover(fast, dmgMove(), slow, dmgMove(), makeRng(), ctx), "b");
  assert.strictEqual(firstMover(fast, dmgMove({ priority: 1 }), slow, dmgMove(), makeRng(), ctx), "a");
});

test("Toxic Spikes poisons eligible entrants and respects type immunity", () => {
  const fx = aggregateSigils(["toxic_spikes"]);
  const foe = mon({ types: ["normal"] });
  const steel = mon({ types: ["steel"] });
  assert.ok(applyEntryStatus(foe, fx.enemyEntryStatus).applied);
  assert.strictEqual(foe.status.cond, "psn");
  assert.strictEqual(applyEntryStatus(steel, fx.enemyEntryStatus).applied, false);
});

test("hail and sand chip non-immune combatants", () => {
  const normal = mon();
  const hail = applyWeatherChip(normal, aggregateSigils(["permafrost"]).weather);
  assert.ok(hail.dmg > 0 && normal.stats.hp === 80 - hail.dmg);
  assert.strictEqual(applyWeatherChip(mon({ types: ["ice"] }), "hail"), null);

  const sandTarget = mon({ types: ["water"] });
  const sand = applyWeatherChip(sandTarget, aggregateSigils(["sand_totem"]).weather);
  assert.ok(sand.dmg > 0);
  for (const type of ["rock", "ground", "steel"]) {
    assert.strictEqual(applyWeatherChip(mon({ types: [type] }), "sand"), null, `${type} should be immune`);
  }
});

test("Apex Predator heals after a KO and Ball Cache augments starting items", () => {
  const apexFx = aggregateSigils(["apex"]);
  const winner = mon({ stats: { maxHp: 80, hp: 20 } });
  assert.strictEqual(applyDefeatHeal(winner, apexFx.healOnKill), 20);
  assert.strictEqual(winner.stats.hp, 40);

  const items = { "poke-ball": 3 };
  const added = applyStartingBallBonus(items, aggregateSigils(["ball_cache"]));
  assert.strictEqual(added, 2);
  assert.strictEqual(items["poke-ball"], 5);
});

// ---- roster (multiplayer bridge) ----
test("snapshotMon heals fully and clears status/stages", () => {
  const m = mon({ stats: { maxHp: 80, hp: 12 }, status: { cond: "brn", turns: 0, toxic: 3 }, stages: { atk: 4 } });
  const s = snapshotMon(m);
  assert.strictEqual(s.stats.hp, s.stats.maxHp);
  assert.strictEqual(s.status.cond, "none");
  assert.strictEqual(s.stages.atk, 0);
  assert.strictEqual(s.moves[0].ppLeft, s.moves[0].pp);
});

test("snapshotMon preserves shiny identity through Vault serialization", () => {
  assert.strictEqual(snapshotMon(mon({ isShiny: true })).isShiny, true, "shiny survives the snapshot");
  assert.strictEqual(snapshotMon(mon()).isShiny, false, "non-shiny stays false");
});

// P3.0: Vault/Arena serialization must keep a Pokémon's full build.
test("snapshotMon preserves mutations, pseudo-abilities, and capture metadata", () => {
  const m = mon({ isShiny: true });
  m.mutations = ["titan", "levitator"]; m.abilities = ["levitate"];
  m.lifesteal = 0.25; m.adaptive = true;
  m.alpha = { id: "storm", name: "Storm", desc: "aura" }; m.heldItemId = "leftovers";
  const s = JSON.parse(JSON.stringify(snapshotMon(m))); // survive a real round-trip
  assert.deepStrictEqual(s.mutations, ["titan", "levitator"]);
  assert.deepStrictEqual(s.abilities, ["levitate"]);
  assert.strictEqual(s.lifesteal, 0.25);
  assert.strictEqual(s.adaptive, true);
  assert.deepStrictEqual(s.alpha, m.alpha);
  assert.strictEqual(s.heldItemId, "leftovers");
  // A plain-vanilla mon carries no undefined identity noise.
  assert.strictEqual("mutations" in snapshotMon(mon()), false);
  assert.strictEqual("alpha" in snapshotMon(mon()), false);
});

test("carryIdentity copies build identity onto an evolution and deep-clones", () => {
  const from = mon({ isShiny: true });
  from.mutations = ["titan"]; from.abilities = ["levitate"]; from.lifesteal = 0.25;
  from.adaptive = true; from.alpha = { id: "a", name: "Aura", desc: "x" }; from.heldItemId = "leftovers";
  const to = carryIdentity(from, mon());
  assert.deepStrictEqual(to.mutations, ["titan"]);
  assert.deepStrictEqual(to.abilities, ["levitate"]);
  assert.strictEqual(to.lifesteal, 0.25);
  assert.strictEqual(to.adaptive, true);
  assert.strictEqual(to.isShiny, true);
  assert.strictEqual(to.heldItemId, "leftovers");
  assert.deepStrictEqual(to.alpha, from.alpha);
  // Mutating the clone must never bleed back into the source mon.
  to.mutations.push("mystic"); to.alpha.name = "changed";
  assert.deepStrictEqual(from.mutations, ["titan"], "arrays deep-cloned");
  assert.strictEqual(from.alpha.name, "Aura", "objects deep-cloned");
});

test("buildRoster caps at 6 and drops invalid members", () => {
  const party = [];
  for (let i = 0; i < 8; i++) party.push(mon({ name: "M" + i }));
  party.push({ name: "broken" }); // no stats/moves
  const r = buildRoster(party);
  assert.ok(r.length === 6, "capped to 6: " + r.length);
});

test("validateRoster accepts a fair team, rejects bad ones", () => {
  const good = buildRoster([mon(), mon({ name: "B" })]);
  assert.ok(validateRoster(good).ok);
  assert.ok(!validateRoster([]).ok, "empty rejected");
  const overLevel = buildRoster([mon({ level: 200 })]);
  assert.ok(!validateRoster(overLevel).ok, "over level cap rejected");
  const noDamage = buildRoster([mon({ moves: [dmgMove({ power: 0, damage_class: "status", category: "net-good-stats" })] })]);
  assert.ok(!validateRoster(noDamage).ok, "no damaging move rejected");
  const notFull = good.map((m) => ({ ...m, stats: { ...m.stats, hp: 1 } }));
  assert.ok(!validateRoster(notFull).ok, "not-full-HP rejected");
});

test("rosterPower is positive and scales with level", () => {
  const low = buildRoster([mon({ level: 5 })]);
  const high = buildRoster([mon({ level: 50 })]);
  assert.ok(rosterPower(high) > rosterPower(low) && rosterPower(low) > 0);
});

// ---- campaign data integrity ----
test("gym ladder is well-formed and scales", () => {
  assert.strictEqual(GYMS.length, 8);
  const badges = new Set();
  let lastFloor = 0;
  for (const g of GYMS) {
    assert.ok(g.leader && g.type && g.badge && g.sprite, "gym fields and trainer sprite present");
    assert.match(g.sprite, /^assets\/sprites\/.+\.png$/, "gym sprite is a local PNG");
    assert.ok(g.team.length >= 1 && g.team.every((id) => id >= 1 && id <= 151), "valid Gen-1 team");
    assert.ok(g.floor > lastFloor, "floor levels increase");
    lastFloor = g.floor;
    badges.add(g.badge);
  }
  assert.strictEqual(badges.size, 8, "unique badges");
  assert.ok(CHAMPION.team.length >= 5 && CHAMPION.floor > lastFloor, "champion is the toughest");
  assert.match(CHAMPION.sprite, /^assets\/sprites\/.+\.png$/, "champion has a local trainer sprite");
});

console.log(`\n${passed} checks passed`);
