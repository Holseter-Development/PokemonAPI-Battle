// rng.js - deterministic, serializable pseudo-random number generation.
// The whole roguelike (map layout, reward rolls, encounters) and - crucially -
// the future authoritative multiplayer server run off seeds, so runs are
// reproducible (daily challenges, replays) and battles are provably fair.
//
// mulberry32: tiny, fast, good-enough distribution, single-uint32 state that
// serialises cleanly into a save file.

export function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  const fn = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  fn.getState = () => a >>> 0;
  fn.setState = (s) => { a = (s >>> 0) || 1; };
  return fn;
}

// Turn any string (e.g. a date, a run name) into a 32-bit seed. FNV-1a.
export function hashSeed(str) {
  let h = 0x811c9dc5;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// A fresh, human-shareable seed string (e.g. "R-8F3K2Q").
export function randomSeedString() {
  const alph = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alph[Math.floor(Math.random() * alph.length)];
  return "R-" + s;
}

// ---- helpers (all take an rng function) --------------------------------

export function randInt(rng, nExclusive) {
  return Math.floor(rng() * nExclusive);
}
export function randRange(rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}
export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}
export function chance(rng, p) {
  return rng() < p;
}
// Fisher–Yates, returns a new array (does not mutate input).
export function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// Weighted pick. entries: [{ item, weight }]. Returns an item.
export function weightedPick(rng, entries) {
  let total = 0;
  for (const e of entries) total += e.weight;
  let r = rng() * total;
  for (const e of entries) {
    r -= e.weight;
    if (r < 0) return e.item;
  }
  return entries[entries.length - 1]?.item;
}
// Pick `n` distinct items from `pool`, weighted by `weightOf`.
export function sampleDistinct(rng, pool, n, weightOf = () => 1) {
  const remaining = pool.slice();
  const out = [];
  while (out.length < n && remaining.length) {
    const entries = remaining.map((item) => ({ item, weight: Math.max(0.0001, weightOf(item)) }));
    const chosen = weightedPick(rng, entries);
    out.push(chosen);
    remaining.splice(remaining.indexOf(chosen), 1);
  }
  return out;
}
