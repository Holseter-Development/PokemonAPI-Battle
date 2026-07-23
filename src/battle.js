// battle.js — the pure, DOM-free battle engine. Everything here operates on
// plain "mon" objects and an injectable rng so it can be exercised head-less
// by the test harness. The controller (main.js) drives animation from the
// structured results these functions return.

import { CHART, AILMENT_MAP, STAT_KEY, STATUS_LABEL } from "./data.js";

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

const STAT_NAMES = {
  atk: "Attack", def: "Defense", spa: "Special Attack",
  spd: "Special Defense", spe: "Speed", acc: "accuracy", eva: "evasiveness",
};

// ---- type & stat maths -------------------------------------------------

export function typeEffect(moveType, targetTypes) {
  let mult = 1;
  const row = CHART[moveType] || {};
  for (const t of targetTypes) mult *= row[t] ?? 1;
  return mult;
}

function stage(mon, key) {
  return (mon.stages && mon.stages[key]) || 0;
}

// Multiplier for a battle stat given its stage (-6..+6).
function statMult(s) {
  s = clamp(s, -6, 6);
  return s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
}
// Accuracy / evasion use thirds.
function accMult(s) {
  s = clamp(s, -6, 6);
  return s >= 0 ? (3 + s) / 3 : 3 / (3 - s);
}

export function effectiveStat(mon, key) {
  const base = mon.stats[key] || 1;
  let v = base * statMult(stage(mon, key));
  if (key === "spe" && mon.status && mon.status.cond === "par") v *= 0.25;
  return Math.max(1, Math.floor(v));
}

// ---- accuracy & crits --------------------------------------------------

export function rollHit(move, attacker, defender, rng = Math.random) {
  if (move.accuracy == null) return true;
  const net = clamp(stage(attacker, "acc") - stage(defender, "eva"), -6, 6);
  const chance = move.accuracy * accMult(net);
  return rng() * 100 < chance;
}

export function rollCrit(attacker, move, rng = Math.random) {
  let base = clamp((attacker.stats.spe || attacker.stats.spd || 40) / 512, 0.02, 0.25);
  if (move.highCrit) base = clamp(base * 2, 0.02, 0.4);
  return rng() < base;
}

// Core damage roll. `opts.avg` forces the average random factor (used by AI
// look-ahead) and `opts.forceCrit` is for tests.
export function calcDamage(attacker, defender, move, rng = Math.random, opts = {}) {
  const level = attacker.level;
  const special = move.damage_class === "special";
  let atkStat = special ? effectiveStat(attacker, "spa") : effectiveStat(attacker, "atk");
  const defStat = special ? effectiveStat(defender, "spd") : effectiveStat(defender, "def");
  if (!special && attacker.status && attacker.status.cond === "brn") {
    atkStat = Math.max(1, Math.floor(atkStat * 0.5));
  }
  const eff = typeEffect(move.type, defender.types);
  if (eff === 0) return { dmg: 0, eff: 0, crit: false };

  const base = Math.floor(
    Math.floor(
      (Math.floor((2 * level) / 5 + 2) * move.power * (atkStat / Math.max(1, defStat))) / 50
    ) + 2
  );
  const randFactor = opts.avg ? 0.925 : 0.85 + rng() * 0.15;
  const stab = attacker.types.includes(move.type) ? 1.5 : 1.0;
  let dmg = Math.max(1, Math.floor(base * randFactor * stab * eff));
  const crit = opts.forceCrit || rollCrit(attacker, move, rng);
  if (crit) dmg = Math.floor(dmg * 1.8);
  return { dmg, eff, crit };
}

// ---- status handling ---------------------------------------------------

export function applyAilment(target, ailmentName, rng = Math.random, force = false) {
  const cond = AILMENT_MAP[ailmentName];
  if (!cond) return { applied: false };
  if (target.status && target.status.cond !== "none") {
    return { applied: false, reason: "already" };
  }
  // Type immunities (Gen-1 flavoured).
  if ((cond === "brn") && target.types.includes("fire")) return { applied: false, reason: "immune" };
  if ((cond === "frz") && target.types.includes("ice")) return { applied: false, reason: "immune" };
  if ((cond === "psn" || cond === "tox") && (target.types.includes("poison") || target.types.includes("steel"))) {
    return { applied: false, reason: "immune" };
  }
  target.status = { cond, turns: 0, toxic: cond === "tox" ? 1 : 0 };
  if (cond === "slp") target.status.turns = 1 + Math.floor(rng() * 3);
  return { applied: true, cond };
}

// Returns { canAct, message, thawed, woke }.
export function canAct(mon, rng = Math.random) {
  const s = mon.status || (mon.status = { cond: "none", turns: 0, toxic: 0 });
  if (s.cond === "slp") {
    if (s.turns > 0) {
      s.turns--;
      return { canAct: false, message: `${mon.name} is fast asleep...` };
    }
    s.cond = "none";
    return { canAct: true, message: `${mon.name} woke up!` };
  }
  if (s.cond === "frz") {
    if (rng() < 0.2) {
      s.cond = "none";
      return { canAct: true, message: `${mon.name} thawed out!` };
    }
    return { canAct: false, message: `${mon.name} is frozen solid!` };
  }
  if (s.cond === "par" && rng() < 0.25) {
    return { canAct: false, message: `${mon.name} is paralyzed! It can't move!` };
  }
  return { canAct: true, message: null };
}

// End-of-turn residual damage (burn / poison / toxic). Mutates hp.
export function endOfTurn(mon) {
  const s = mon.status;
  if (!s) return null;
  if (s.cond === "brn" || s.cond === "psn") {
    const dmg = Math.max(1, Math.floor(mon.stats.maxHp / 16));
    mon.stats.hp = clamp(mon.stats.hp - dmg, 0, mon.stats.maxHp);
    return { dmg, kind: s.cond, fainted: mon.stats.hp <= 0 };
  }
  if (s.cond === "tox") {
    const n = s.toxic || 1;
    const dmg = Math.max(1, Math.floor((mon.stats.maxHp * n) / 16));
    s.toxic = n + 1;
    mon.stats.hp = clamp(mon.stats.hp - dmg, 0, mon.stats.maxHp);
    return { dmg, kind: "tox", fainted: mon.stats.hp <= 0 };
  }
  return null;
}

// ---- the main move resolver -------------------------------------------

// Resolve a single use of `move` by `attacker` against `defender`.
// Mutates both mons and returns a structured, message-carrying result the
// controller animates from.
export function useMove(attacker, defender, move, rng = Math.random) {
  const res = {
    move,
    missed: false,
    immune: false,
    hits: [],
    totalDmg: 0,
    targetFainted: false,
    ailment: null, // { who, cond }
    statEvents: [], // { who, stat, change, applied }
    drain: 0,
    recoil: 0,
    healed: 0,
    flinch: false,
    log: [],
  };

  // OHKO moves (horn drill, fissure, guillotine).
  if (move.isOHKO) {
    if (attacker.level < defender.level || rng() >= 0.3) {
      res.missed = true;
      res.log.push("But it failed!");
      return res;
    }
    const dmg = defender.stats.hp;
    defender.stats.hp = 0;
    res.hits.push({ dmg, crit: false, eff: 1 });
    res.totalDmg = dmg;
    res.targetFainted = true;
    res.log.push("It's a one-hit KO!");
    return res;
  }

  if (!rollHit(move, attacker, defender, rng)) {
    res.missed = true;
    res.log.push(`${attacker.name}'s attack missed!`);
    return res;
  }

  const isDamaging = move.power > 0 &&
    move.category !== "net-good-stats" &&
    move.category !== "ailment" &&
    move.category !== "heal";

  if (isDamaging) {
    const eff = typeEffect(move.type, defender.types);
    if (eff === 0) {
      res.immune = true;
      res.log.push(`It doesn't affect ${defender.name}...`);
      return res;
    }
    // Multi-hit resolution.
    let hitCount = 1;
    if (move.maxHits > 1) {
      if (move.maxHits === move.minHits) hitCount = move.maxHits;
      else {
        const r = rng();
        hitCount = r < 0.375 ? 2 : r < 0.75 ? 3 : r < 0.875 ? 4 : 5;
      }
    }
    for (let i = 0; i < hitCount; i++) {
      if (defender.stats.hp <= 0) break;
      const { dmg, crit } = calcDamage(attacker, defender, move, rng);
      defender.stats.hp = clamp(defender.stats.hp - dmg, 0, defender.stats.maxHp);
      res.hits.push({ dmg, crit, eff });
      res.totalDmg += dmg;
    }
    if (hitCount > 1) res.log.push(`Hit ${res.hits.length} time(s)!`);
    res.effMult = eff;

    // Drain / recoil, proportional to damage dealt.
    if (move.drain > 0) {
      res.drain = Math.max(1, Math.floor((res.totalDmg * move.drain) / 100));
      attacker.stats.hp = clamp(attacker.stats.hp + res.drain, 0, attacker.stats.maxHp);
      res.log.push(`${attacker.name} drained energy!`);
    } else if (move.drain < 0) {
      res.recoil = Math.max(1, Math.floor((res.totalDmg * -move.drain) / 100));
      attacker.stats.hp = clamp(attacker.stats.hp - res.recoil, 0, attacker.stats.maxHp);
      res.log.push(`${attacker.name} is hit with recoil!`);
    }
    res.targetFainted = defender.stats.hp <= 0;
  }

  // Healing moves (recover, soft-boiled, rest).
  if (move.healing > 0 || move.key === "rest") {
    const before = attacker.stats.hp;
    if (move.key === "rest") {
      attacker.stats.hp = attacker.stats.maxHp;
      attacker.status = { cond: "slp", turns: 2, toxic: 0 };
      res.log.push(`${attacker.name} slept and became healthy!`);
    } else {
      const heal = Math.floor((attacker.stats.maxHp * move.healing) / 100);
      attacker.stats.hp = clamp(attacker.stats.hp + heal, 0, attacker.stats.maxHp);
      res.log.push(`${attacker.name} regained health!`);
    }
    res.healed = attacker.stats.hp - before;
  }

  // Ailment (either primary for a status move, or secondary chance on a hit).
  if (!res.targetFainted && move.ailment && move.ailment !== "none") {
    const guaranteed = !isDamaging; // pure status moves always attempt
    const roll = guaranteed || rng() * 100 < (move.ailmentChance || 0);
    if (roll) {
      const target = move.selfTarget ? attacker : defender;
      const out = applyAilment(target, move.ailment, rng);
      if (out.applied) {
        res.ailment = { who: move.selfTarget ? "self" : "target", cond: out.cond };
        res.log.push(`${target.name} was ${statusVerb(out.cond)}!`);
      } else if (guaranteed) {
        res.log.push("But it failed!");
      }
    }
  }

  // Stat-stage changes.
  if (!res.targetFainted && move.statChanges && move.statChanges.length) {
    const guaranteed = !isDamaging || move.statChance === 0;
    const roll = guaranteed || rng() * 100 < move.statChance;
    if (roll) {
      const target = move.selfTarget ? attacker : defender;
      const who = move.selfTarget ? "self" : "target";
      for (const sc of move.statChanges) {
        const applied = changeStage(target, sc.stat, sc.change);
        res.statEvents.push({ who, stat: sc.stat, change: sc.change, applied });
        if (applied) {
          res.log.push(statChangeMessage(target.name, sc.stat, sc.change));
        } else {
          res.log.push(`${target.name}'s ${STAT_NAMES[sc.stat] || sc.stat} won't go ${sc.change > 0 ? "higher" : "lower"}!`);
        }
      }
    }
  }

  // Flinch (secondary).
  if (!res.targetFainted && isDamaging && move.flinchChance > 0) {
    if (rng() * 100 < move.flinchChance) res.flinch = true;
  }

  return res;
}

function changeStage(mon, key, change) {
  if (!mon.stages) mon.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
  const cur = mon.stages[key] || 0;
  const next = clamp(cur + change, -6, 6);
  if (next === cur) return false;
  mon.stages[key] = next;
  return true;
}

function statChangeMessage(name, stat, change) {
  const label = STAT_NAMES[stat] || stat;
  const mag = Math.abs(change);
  const dir = change > 0
    ? mag >= 2 ? "sharply rose" : "rose"
    : mag >= 2 ? "harshly fell" : "fell";
  return `${name}'s ${label} ${dir}!`;
}

function statusVerb(cond) {
  return {
    brn: "burned", par: "paralyzed", psn: "poisoned",
    tox: "badly poisoned", slp: "put to sleep", frz: "frozen solid",
  }[cond] || "afflicted";
}

// ---- turn order --------------------------------------------------------

// Returns "a" or "b": which combatant moves first this round.
export function firstMover(a, aMove, b, bMove, rng = Math.random) {
  const pa = aMove ? aMove.priority || 0 : 0;
  const pb = bMove ? bMove.priority || 0 : 0;
  if (pa !== pb) return pa > pb ? "a" : "b";
  const sa = effectiveStat(a, "spe");
  const sb = effectiveStat(b, "spe");
  if (sa !== sb) return sa > sb ? "a" : "b";
  return rng() < 0.5 ? "a" : "b";
}

// ---- capture -----------------------------------------------------------

export function catchSuccess(mon, ballBonus = 1, rng = Math.random) {
  const maxHP = mon.stats.maxHp, curHP = mon.stats.hp, rate = mon.capture_rate || 45;
  let a = (((3 * maxHP - 2 * curHP) * rate) / (3 * maxHP)) * ballBonus;
  const s = mon.status ? mon.status.cond : "none";
  if (s === "slp" || s === "frz") a *= 2.0;
  else if (s === "par" || s === "psn" || s === "brn" || s === "tox") a *= 1.5;
  return rng() < a / 256;
}

// ---- AI & auto-play heuristics -----------------------------------------

// Estimate the value of using `move` from attacker against defender.
function moveScore(attacker, defender, move) {
  if (move.ppLeft <= 0) return -1;
  const isDamaging = move.power > 0 && move.category !== "net-good-stats";
  if (isDamaging) {
    const { dmg, eff } = calcDamage(attacker, defender, move, Math.random, { avg: true });
    // Value as fraction of the target's remaining HP, capped so overkill
    // isn't over-rewarded, plus a small bonus for landing a status.
    const frac = Math.min(1.2, dmg / Math.max(1, defender.stats.hp));
    let bonus = 0;
    if (move.ailment !== "none" && defender.status && defender.status.cond === "none") {
      bonus += 0.15 * (move.ailmentChance / 100);
    }
    return frac * (move.accuracy / 100) + bonus + eff * 0.001;
  }
  // Status / setup move heuristics.
  let s = 0;
  const hpFrac = attacker.stats.hp / attacker.stats.maxHp;
  if ((move.healing > 0 || move.key === "rest") && hpFrac < 0.6) s += (0.6 - hpFrac) * 1.2;
  if (move.ailment !== "none" && defender.status && defender.status.cond === "none") {
    s += 0.35 * ((move.accuracy || 100) / 100);
  }
  if (move.statChanges && move.statChanges.length && move.selfTarget && hpFrac > 0.5) {
    s += 0.2;
  }
  if (move.statChanges && move.statChanges.length && !move.selfTarget) s += 0.15;
  return s;
}

export function chooseAIMove(attacker, defender, rng = Math.random) {
  const usable = attacker.moves.filter((m) => m.ppLeft > 0);
  if (!usable.length) return -1;
  let bestIdx = -1, best = -Infinity;
  attacker.moves.forEach((m, i) => {
    if (m.ppLeft <= 0) return;
    let sc = moveScore(attacker, defender, m);
    sc += rng() * 0.05; // small noise so the AI isn't perfectly predictable
    if (sc > best) { best = sc; bestIdx = i; }
  });
  return bestIdx;
}

export function bestMoveIndex(attacker, defender) {
  let pick = -1, score = -Infinity;
  attacker.moves.forEach((m, i) => {
    if (m.ppLeft <= 0) return;
    const sc = moveScore(attacker, defender, m);
    if (sc > score) { score = sc; pick = i; }
  });
  return pick >= 0 ? pick : null;
}

// Overall matchup score for a party member vs the current enemy.
export function battleScore(mon, enemy) {
  let bestOff = 0, totalPP = 0, totalLeft = 0, hasDamage = false;
  mon.moves.forEach((m) => {
    totalPP += m.pp || 0;
    totalLeft += m.ppLeft || 0;
    if (m.ppLeft <= 0 || !(m.power > 0)) return;
    hasDamage = true;
    const eff = typeEffect(m.type, enemy.types);
    const stab = mon.types.includes(m.type) ? 1.5 : 1;
    const sc = ((m.power || 0) * eff * stab * (m.accuracy || 100)) / 100;
    if (sc > bestOff) bestOff = sc;
  });
  if (!hasDamage) return 0;
  const ppFactor = totalPP > 0 ? totalLeft / totalPP : 0;

  let defScore = 0, count = 0;
  enemy.moves.forEach((em) => {
    if (em.ppLeft <= 0 || !(em.power > 0)) return;
    defScore += typeEffect(em.type, mon.types);
    count++;
  });
  defScore = count > 0 ? defScore / count : 1;
  const defFactor = 1 / Math.max(0.25, defScore);
  const hpFactor = mon.stats.hp / mon.stats.maxHp;
  const levelFactor = enemy.level ? clamp(mon.level / enemy.level, 0.5, 2) : 1;
  return bestOff * defFactor * hpFactor * (0.5 + 0.5 * ppFactor) * levelFactor;
}

export function bestSwitch(party, activeIdx, enemy, currentScore, threshold = 1.5) {
  let bestIdx = null;
  let bestScore = currentScore * threshold;
  party.forEach((mon, idx) => {
    if (mon.stats.hp <= 0 || idx === activeIdx) return;
    const score = battleScore(mon, enemy);
    if (score > bestScore) { bestScore = score; bestIdx = idx; }
  });
  return bestIdx;
}

export function effText(mult) {
  if (mult === 0) return "It doesn't affect the foe...";
  if (mult >= 2) return "It's super effective!";
  if (mult <= 0.5) return "It's not very effective...";
  return "";
}
