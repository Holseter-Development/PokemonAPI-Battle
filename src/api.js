// api.js — PokéAPI access, response caching, sprite selection and moveset
// construction. Network-facing, but the pure move-selection logic is factored
// so it can be unit-tested with fixture data.

import {
  VERSION_GROUPS_GEN1,
  buildMove,
  PRIORITY_STATUS_MOVES,
} from "./data.js";

export const API = "https://pokeapi.co/api/v2";
export const GEN1_MAX_ID = 151;
export const MOVE_CACHE = new Map();
export const GROWTH_CACHE = new Map();
export const EVO_CACHE = new Map();

const JSON_TTL = 1000 * 60 * 60 * 24 * 7;

export async function fetchCachedJSON(url) {
  try {
    const now = Date.now();
    const hit = localStorage.getItem("cache:" + url);
    if (hit) {
      const { t, v } = JSON.parse(hit);
      if (now - t < JSON_TTL) return v;
    }
    const r = await fetch(url, { cache: "force-cache" });
    if (!r.ok) throw new Error("net");
    const v = await r.json();
    try {
      localStorage.setItem("cache:" + url, JSON.stringify({ t: now, v }));
    } catch (_) {
      /* storage full — non-fatal */
    }
    return v;
  } catch (e) {
    const r = await fetch(url);
    if (!r.ok) throw new Error("net");
    return r.json();
  }
}

export function fetchPokemon(idOrName) {
  return fetchCachedJSON(`${API}/pokemon/${idOrName}`);
}
export function fetchSpecies(id) {
  return fetchCachedJSON(`${API}/pokemon-species/${id}`);
}
export function fetchGrowth(url) {
  if (!GROWTH_CACHE.has(url)) GROWTH_CACHE.set(url, fetchCachedJSON(url));
  return GROWTH_CACHE.get(url);
}
export function fetchEvo(url) {
  if (!EVO_CACHE.has(url)) EVO_CACHE.set(url, fetchCachedJSON(url));
  return EVO_CACHE.get(url);
}

// Pick the best available sprites: prefer Gen-V animated (crisp, in-motion),
// fall back to Gen-1 stills and finally the hi-res artwork. Returns direct
// image URLs so we no longer need the fragile canvas/CORS-proxy trimming.
//
// When `shiny` is set, the shiny variants are preferred at every tier and then
// fall back to the corresponding normal sprite, so a species with missing shiny
// art still renders (P2.3: "missing shiny sprite data falls back safely").
export function spriteSet(data, shiny = false) {
  const s = data.sprites || {};
  const bw = s.versions?.["generation-v"]?.["black-white"]?.animated || {};
  const artwork = s.other?.["official-artwork"]?.front_default || null;
  const home = s.other?.home?.front_default || null;
  if (shiny) {
    const bwSF = bw.front_shiny, bwSB = bw.back_shiny;
    const artworkS = s.other?.["official-artwork"]?.front_shiny || null;
    const homeS = s.other?.home?.front_shiny || null;
    const front = bwSF || s.front_shiny || artworkS || homeS ||
      bw.front_default || s.front_default || artwork || home || "";
    const back = bwSB || s.back_shiny || bwSF || s.front_shiny ||
      bw.back_default || s.back_default || front || "";
    return {
      front,
      back,
      artwork: artworkS || s.front_shiny || artwork || s.front_default || "",
      animated: !!bwSF,
      shiny: true,
    };
  }
  return {
    front: bw.front_default || s.front_default || artwork || home || "",
    back: bw.back_default || s.back_default || bw.front_default || s.front_default || "",
    artwork: artwork || s.front_default || "",
    animated: !!bw.front_default,
    shiny: false,
  };
}

// Build a level-appropriate Gen-1 moveset. Prefers strong damaging moves but
// guarantees a utility/status move when the species learns a notable one, for
// deeper battles. Always returns at least one damaging move.
export async function fetchMoveset(poke, level) {
  const seen = new Set();
  const entries = [];
  for (const m of poke.moves) {
    for (const vg of m.version_group_details) {
      if (!VERSION_GROUPS_GEN1.includes(vg.version_group.name)) continue;
      if (vg.move_learn_method?.name !== "level-up") continue;
      const learnLv = vg.level_learned_at ?? 0;
      if (learnLv <= level && !seen.has(m.move.url)) {
        seen.add(m.move.url);
        if (!MOVE_CACHE.has(m.move.url)) MOVE_CACHE.set(m.move.url, fetchCachedJSON(m.move.url));
        entries.push({ url: m.move.url, level: learnLv });
      }
    }
  }
  const moveDatas = await Promise.all(entries.map((x) => MOVE_CACHE.get(x.url)));
  const gen1 = moveDatas
    .map((md, i) => ({ md, level: entries[i].level }))
    .filter((x) => x.md && x.md.generation?.name === "generation-i");

  return selectMoves(gen1);
}

// Pure selection — separated so tests can feed fixtures. Input: array of
// { md (raw move json), level }. Output: up to 4 game-move objects.
export function selectMoves(gen1) {
  const damaging = [];
  const status = [];
  const nameSeen = new Set();
  const sorted = gen1.slice().sort((a, b) => b.level - a.level); // newest first
  for (const { md } of sorted) {
    if (nameSeen.has(md.name)) continue;
    nameSeen.add(md.name);
    const dmgClass = md.damage_class?.name;
    if ((dmgClass === "physical" || dmgClass === "special") && md.power) {
      damaging.push(buildMove(md));
    } else if (dmgClass === "status") {
      status.push({ move: buildMove(md), priority: PRIORITY_STATUS_MOVES.has(md.name) });
    }
  }
  // Best damaging moves first (power × accuracy).
  damaging.sort((a, b) => b.power * b.accuracy - a.power * a.accuracy);
  // Prefer curated status moves, else any status move.
  status.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));

  const out = [];
  const utility = status.find((s) => s.priority) || status[0];
  // Reserve one slot for a good utility move when we have several damaging ones.
  const dmgSlots = utility && damaging.length >= 3 ? 3 : 4;
  for (const m of damaging.slice(0, dmgSlots)) out.push(m);
  if (utility && out.length < 4) out.push(utility.move);
  // Backfill from remaining damaging if we came up short.
  for (const m of damaging.slice(dmgSlots)) {
    if (out.length >= 4) break;
    out.push(m);
  }
  return out.slice(0, 4);
}
