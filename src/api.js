export const API = "https://pokeapi.co/api/v2";
export const GEN1_MAX_ID = 151;
export const VERSION_GROUPS_GEN1 = ["red-blue", "yellow"];
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
    localStorage.setItem("cache:" + url, JSON.stringify({ t: now, v }));
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
