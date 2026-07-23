// run.js — the roguelike Expedition: a seeded, branching node map, the run
// state that travels it, and the pure reward/event pickers each node draws
// from. No DOM, no network, no battle logic — the controller resolves nodes
// and the engine fights battles; this module owns *structure* and *rolls*.

import { makeRng, hashSeed, randRange, pick, shuffle, sampleDistinct } from "./rng.js";
import { mutationList, sigilList, rarityWeightOf } from "./mutations.js";

export const NODE = {
  BATTLE: "battle", // wild encounter (catchable)
  ELITE: "elite",   // Gym-Leader boss
  CHAMPION: "champion",
  SHOP: "shop",
  REST: "rest",
  MYSTERY: "mystery",
};

export const RUN_CONFIG = { regions: 3, rowsPerRegion: 5, width: 4, paths: 6 };

// ---- map generation ----------------------------------------------------

// A layered, branching DAG à la Slay the Spire. Paths fork and merge between
// rows; each region ends in a single boss node (Elite → … → Champion), with a
// guaranteed Rest immediately before every boss.
export function generateMap(rng, cfg = RUN_CONFIG) {
  const { regions, rowsPerRegion, width, paths } = cfg;
  const totalRows = regions * rowsPerRegion;
  const nodes = {};
  const key = (r, c) => `${r}-${c}`;
  const regionOf = (r) => Math.floor(r / rowsPerRegion);
  const isBossRow = (r) => (r + 1) % rowsPerRegion === 0;

  const ensure = (r, c) => {
    const id = key(r, c);
    if (!nodes[id]) nodes[id] = { id, row: r, col: c, region: regionOf(r), type: null, edges: [] };
    return nodes[id];
  };
  const link = (a, b) => { if (!a.edges.includes(b.id)) a.edges.push(b.id); };

  // Random walks bottom → top.
  for (let p = 0; p < paths; p++) {
    let col = Math.floor(rng() * width);
    ensure(0, col);
    for (let r = 0; r < totalRows - 1; r++) {
      const opts = [col - 1, col, col + 1].filter((c) => c >= 0 && c < width);
      const nc = pick(rng, opts);
      link(ensure(r, col), ensure(r + 1, nc));
      col = nc;
    }
  }

  // Collapse every boss row to a single node and rewire the neighbours.
  const centerCol = Math.floor(width / 2);
  for (let R = rowsPerRegion - 1; R < totalRows; R += rowsPerRegion) {
    const rowNodes = Object.values(nodes).filter((n) => n.row === R);
    const outward = new Set();
    rowNodes.forEach((n) => n.edges.forEach((e) => outward.add(e)));
    rowNodes.forEach((n) => delete nodes[n.id]);
    const boss = { id: `${R}-boss`, row: R, col: centerCol, region: regionOf(R),
      type: R === totalRows - 1 ? NODE.CHAMPION : NODE.ELITE, edges: [...outward] };
    nodes[boss.id] = boss;
    // Everything in the previous row funnels into the boss.
    Object.values(nodes).filter((n) => n.row === R - 1).forEach((n) => { n.edges = [boss.id]; });
  }

  // Type the remaining nodes deterministically (stable row/col order).
  const preBoss = (r) => isBossRow(r + 1);
  const rest = Object.values(nodes)
    .filter((n) => !n.type)
    .sort((a, b) => (a.row - b.row) || (a.col - b.col));
  for (const n of rest) {
    if (n.row === 0) { n.type = NODE.BATTLE; continue; }          // gentle start
    if (preBoss(n.row)) { n.type = NODE.REST; continue; }         // heal before boss
    const local = n.row % rowsPerRegion;
    // Weighted pool; no shops/rests in the first two rows of a region.
    const pool = local <= 1
      ? [{ item: NODE.BATTLE, weight: 78 }, { item: NODE.MYSTERY, weight: 22 }]
      : [{ item: NODE.BATTLE, weight: 58 }, { item: NODE.MYSTERY, weight: 24 },
         { item: NODE.SHOP, weight: 10 }, { item: NODE.REST, weight: 8 }];
    let t = rng() * pool.reduce((s, e) => s + e.weight, 0);
    for (const e of pool) { t -= e.weight; if (t < 0) { n.type = e.item; break; } }
    if (!n.type) n.type = NODE.BATTLE;
  }

  // Guarantee at least one shop per region (quality-of-life).
  for (let reg = 0; reg < regions; reg++) {
    const inReg = Object.values(nodes).filter((n) => n.region === reg && n.type !== NODE.CHAMPION && n.type !== NODE.ELITE);
    if (!inReg.some((n) => n.type === NODE.SHOP)) {
      const cand = inReg.filter((n) => n.type === NODE.BATTLE && !preBoss(n.row) && n.row % rowsPerRegion !== 0);
      if (cand.length) pick(rng, cand).type = NODE.SHOP;
    }
  }

  const rows = [];
  for (let r = 0; r < totalRows; r++) {
    rows.push(Object.values(nodes).filter((n) => n.row === r).sort((a, b) => a.col - b.col).map((n) => n.id));
  }
  return { nodes, rows, totalRows, regions, rowsPerRegion, width };
}

// ---- run state ---------------------------------------------------------

let RUN_ID = 0;

export function createRun(seedString, opts = {}) {
  const seed = hashSeed(seedString);
  const rng = makeRng(seed);
  const cfg = { ...RUN_CONFIG, ...(opts.config || {}) };
  const map = generateMap(rng, cfg);
  return {
    id: ++RUN_ID,
    seed: seedString,
    seedNum: seed,
    rngState: rng.getState(), // continue the same stream for reward rolls
    config: cfg,
    ascension: opts.ascension || 0,
    map,
    position: null,          // current node id; null = choosing a row-0 node
    resolved: false,         // has the current node been completed?
    visited: [],             // node ids, in order
    team: [],                // filled in by the controller
    box: [],
    gold: opts.gold || 0,
    balls: opts.balls != null ? opts.balls : 3,
    sigils: [],              // owned sigil ids
    fragments: 0,            // meta-currency earned this run
    over: false,
    won: false,
  };
}

// Recreate the run's rng, run `fn(rng)`, persist the advanced state.
export function withRng(run, fn) {
  const rng = makeRng(run.seedNum);
  rng.setState(run.rngState);
  const result = fn(rng);
  run.rngState = rng.getState();
  return result;
}

export function nodeById(run, id) {
  return run.map.nodes[id] || null;
}
export function currentNode(run) {
  return run.position ? nodeById(run, run.position) : null;
}

// Which nodes the player may move to next.
export function availableNext(run) {
  if (run.over) return [];
  if (run.position == null) return run.map.rows[0].map((id) => run.map.nodes[id]);
  if (!run.resolved) return []; // must finish the current node first
  const node = nodeById(run, run.position);
  return (node.edges || []).map((id) => run.map.nodes[id]);
}

// Move onto a node (must be in availableNext). Returns the node to resolve.
export function travelTo(run, nodeId) {
  const options = availableNext(run);
  const target = options.find((n) => n.id === nodeId);
  if (!target) return null;
  if (run.position != null) run.visited.push(run.position);
  run.position = target.id;
  run.resolved = false;
  return target;
}

// Called by the controller once a node's content is done.
export function markResolved(run, outcome = {}) {
  run.resolved = true;
  const node = currentNode(run);
  if (node && node.type === NODE.CHAMPION && outcome.won) {
    run.over = true;
    run.won = true;
  }
  return run;
}

export function isRunOver(run) {
  return !!run.over;
}
// Whole-team wipe ends the run.
export function checkWipe(run) {
  const alive = (run.team || []).some((m) => m && m.stats && m.stats.hp > 0);
  if (!alive) { run.over = true; run.won = false; }
  return run.over && !run.won;
}

// ---- reward & event rolls (seeded, deterministic) ----------------------

// Base gold for a node kind (controller applies any Merchant's-Charm multiplier).
export function rollGold(run, kind) {
  return withRng(run, (rng) => {
    switch (kind) {
      case NODE.BATTLE: return randRange(rng, 12, 26) + run.ascension * 3;
      case NODE.ELITE: return randRange(rng, 55, 90) + run.ascension * 10;
      case NODE.CHAMPION: return 220 + run.ascension * 25;
      default: return 0;
    }
  });
}

// Offer `n` distinct sigils the player doesn't already own, weighted by rarity.
export function offerSigils(run, n = 3) {
  return withRng(run, (rng) => {
    const pool = sigilList().filter((s) => !run.sigils.includes(s.id));
    return sampleDistinct(rng, pool, Math.min(n, pool.length), rarityWeightOf);
  });
}
// Offer `n` distinct mutations, weighted by rarity.
export function offerMutations(run, n = 3) {
  return withRng(run, (rng) => {
    const pool = mutationList();
    return sampleDistinct(rng, pool, Math.min(n, pool.length), rarityWeightOf);
  });
}

// Shop stock: consumables + a couple of mutations, priced by rarity & depth.
export function rollShop(run) {
  return withRng(run, (rng) => {
    const depth = 1 + run.visited.length / 8;
    const priceMut = (r) => Math.round(({ common: 90, uncommon: 150, rare: 260, legendary: 500 }[r] || 120) * depth);
    const muts = sampleDistinct(rng, mutationList(), 2, rarityWeightOf)
      .map((m) => ({ kind: "mutation", id: m.id, name: m.name, rarity: m.rarity, price: priceMut(m.rarity) }));
    const items = [
      { kind: "item", id: "potion", name: "Potion", price: 60 },
      { kind: "item", id: "super-potion", name: "Super Potion", price: 140 },
      { kind: "item", id: "poke-ball", name: "Poké Ball", price: 120 },
      { kind: "item", id: "heal", name: "Full Heal (team)", price: Math.round(180 * depth) },
    ];
    // Occasionally a sigil is for sale.
    const stock = [...items, ...muts];
    if (rng() < 0.5) {
      const s = offerSigilsInline(rng, run, 1)[0];
      if (s) stock.push({ kind: "sigil", id: s.id, name: s.name, rarity: s.rarity, price: Math.round(320 * depth) });
    }
    return stock;
  });
}
function offerSigilsInline(rng, run, n) {
  const pool = sigilList().filter((s) => !run.sigils.includes(s.id));
  return sampleDistinct(rng, pool, Math.min(n, pool.length), rarityWeightOf);
}

// Mystery events. `effect` descriptors are interpreted by the controller.
export const EVENTS = [
  { id: "wishing_well", title: "Wishing Well", weight: 10,
    desc: "A shimmering well hums with promise.",
    choices: [
      { label: "Toss in 40 gold", effect: { kind: "gamble", cost: 40, outcomes: ["gold", "mutation", "nothing"] } },
      { label: "Leave it be", effect: { kind: "none" } },
    ] },
  { id: "berry_grove", title: "Berry Grove", weight: 12,
    desc: "Wild berries grow thick here.",
    choices: [
      { label: "Rest and eat", effect: { kind: "heal", amount: "full" } },
    ] },
  { id: "abandoned_ball", title: "Abandoned Poké Ball", weight: 10,
    desc: "A dented ball lies in the grass.",
    choices: [
      { label: "Pocket it", effect: { kind: "balls", amount: 1 } },
    ] },
  { id: "cursed_shrine", title: "Cursed Shrine", weight: 8,
    desc: "Power radiates — at a price.",
    choices: [
      { label: "Accept the gift", effect: { kind: "mutationThenScar" } },
      { label: "Back away", effect: { kind: "none" } },
    ] },
  { id: "mysterious_egg", title: "Mysterious Egg", weight: 7,
    desc: "A warm egg trembles. Something's inside…",
    choices: [
      { label: "Take the egg", effect: { kind: "recruit" } },
    ] },
  { id: "move_tutor", title: "Move Tutor", weight: 8,
    desc: "An old master offers to teach a move.",
    choices: [
      { label: "Learn (100 gold)", effect: { kind: "tutor", cost: 100 } },
      { label: "Decline", effect: { kind: "none" } },
    ] },
  { id: "gambler", title: "The Gambler", weight: 8,
    desc: "\"Double or nothing on that gold, kid.\"",
    choices: [
      { label: "Bet 60 gold", effect: { kind: "coinflip", stake: 60 } },
      { label: "Walk on", effect: { kind: "none" } },
    ] },
  { id: "sigil_altar", title: "Sigil Altar", weight: 6,
    desc: "An altar hums with run-shaping power.",
    choices: [
      { label: "Attune", effect: { kind: "sigil" } },
    ] },
];

export function rollMysteryEvent(run) {
  return withRng(run, (rng) => {
    const entries = EVENTS.map((e) => ({ item: e, weight: e.weight }));
    let t = rng() * entries.reduce((s, e) => s + e.weight, 0);
    for (const e of entries) { t -= e.weight; if (t < 0) return e.item; }
    return EVENTS[0];
  });
}

// Difficulty scaling for a node's encounter level, given run depth + ascension.
export function encounterLevel(run) {
  const depth = run.visited.length;
  return Math.min(100, 5 + Math.floor(depth * 1.6) + run.ascension * 6);
}
