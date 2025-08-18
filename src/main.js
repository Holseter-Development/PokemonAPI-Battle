import {
  API,
  GEN1_MAX_ID,
  VERSION_GROUPS_GEN1,
  MOVE_CACHE,
  GROWTH_CACHE,
  EVO_CACHE,
  fetchCachedJSON,
  fetchPokemon,
  fetchSpecies,
  fetchGrowth,
  fetchEvo,
} from "./api.js";
import { playSfx, initAudio, getCryAudio, playCry, isMuted } from "./audio.js";
import {
  typeEffect,
  rollHit,
  rollCrit,
  calcDamage,
  catchSuccess,
} from "./battle.js";
import { show, text } from "./ui.js";

console.info("Gen1 Battle build v0.8");
const TRIMMED_SPRITE_CACHE = new Map();
let wins = 0;


async function getTrimmedSprite(url) {
  if (!url) return "";
  if (TRIMMED_SPRITE_CACHE.has(url)) {
    return TRIMMED_SPRITE_CACHE.get(url);
  }

  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      let lastY = canvas.height - 1;
      let foundPixelInImage = false;
      for (let y = canvas.height - 1; y >= 0; y--) {
        const pixelData = ctx.getImageData(0, y, canvas.width, 1).data;
        for (let i = 3; i < pixelData.length; i += 4) {
          if (pixelData[i] > 0) {
            lastY = y;
            foundPixelInImage = true;
            break;
          }
        }
        if (foundPixelInImage) break;
      }

      const newHeight = lastY + 1;
      const trimmedCanvas = document.createElement("canvas");
      trimmedCanvas.width = canvas.width;
      trimmedCanvas.height = newHeight;
      const trimmedCtx = trimmedCanvas.getContext("2d");
      trimmedCtx.drawImage(canvas, 0, 0);

      resolve(trimmedCanvas.toDataURL());
    };
    img.onerror = () => resolve(url); // Fallback to original URL on error
    img.src = proxyUrl;
  });

  TRIMMED_SPRITE_CACHE.set(url, promise);
  return promise;
}

const THEMES = [
  "normal",
  "fire",
  "water",
  "grass",
  "electric",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
];
function setThemeByType(types) {
  const t = (types && types[0]) || "normal";
  const el = document.querySelector(".screen");
  if (!el) return;
  THEMES.forEach((x) => el.classList.remove("type-" + x));
  el.classList.add("type-" + t);

  try {
    ThemeFX.set(t);
  } catch (e) {
    console.error("ThemeFX failed to set:", e);
  }
}

const $ = (sel) => document.querySelector(sel);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function hpColor(frac) {
  return frac > 0.5
    ? "var(--hp-green)"
    : frac > 0.2
    ? "var(--hp-yellow)"
    : "var(--hp-red)";
}
function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function el(tag, attrs = {}, text = "") {
  const x = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) x.setAttribute(k, v);
  if (text) x.textContent = text;
  return x;
}
function cssNum(varName, fallback) {
  const v = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(varName)
  );
  return isNaN(v) ? fallback : v;
}




const state = {
  party: [],
  active: 0,
  player: null,
  enemy: null,
  turn: "player",
  busy: false,
  items: {
    "poke-ball": 10,
    potion: 2,
    "super-potion": 0,
    "hyper-potion": 0,
    antidote: 0,
    "parlyz-heal": 0,
    awakening: 0,
    "burn-heal": 0,
    "ice-heal": 0,
  },
  box: [],
  auto: false,
};

function setBusy(v) {
  state.busy = v;
  document.querySelectorAll("button").forEach((b) => (b.disabled = v));
}

const ITEM_ICON = (name) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}.png`;

function makeMon(data, level = 5) {
  const stats = Object.fromEntries(
    data.stats.map((s) => [s.stat.name, s.base_stat])
  );
  const maxHp = Math.floor((stats.hp * 2 * level) / 100 + level + 10);
  const atk = Math.floor((stats.attack * 2 * level) / 100 + 5);
  const def = Math.floor((stats.defense * 2 * level) / 100 + 5);
  const spa = Math.floor((stats["special-attack"] * 2 * level) / 100 + 5);
  const spd = Math.floor((stats["special-defense"] * 2 * level) / 100 + 5);
  return {
    id: data.id,
    name: cap(data.name),
    spriteFront: data.sprites.front_default,
    spriteBack: data.sprites.back_default,
    sprite: data.sprites.front_default,
    level,
    stats: { maxHp, hp: maxHp, atk, def, spa, spd },
    base_exp: data.base_experience || 64,
    moves: [],
    capture_rate: 45,
    types: data.types.map((t) => t.type.name),
    growth: null,
    evoChainUrl: null,
    speciesId: null,
    xp: 0,
    xpNext: 10,
    status: { cond: "none", turns: 0, toxic: false },
  };
}
function setActive(i) {
  state.active = i;
  state.player = state.party[i];
  if (state.player)
    state.player.sprite = state.player.spriteBack || state.player.spriteFront;
  updateHUD();
  playCry(state.player);
}

async function setupGrowthAndEvo(mon, species) {
  mon.speciesId = species.id;
  mon.evoChainUrl = species.evolution_chain?.url || null;
  const g = species.growth_rate;
  if (g) {
    const table = await fetchGrowth(g.url);
    mon.growth = { url: g.url, table: table.levels };
    const cur =
      table.levels.find((x) => x.level === mon.level)?.experience ?? 0;
    const next =
      table.levels.find((x) => x.level === mon.level + 1)?.experience ??
      cur + 10;
    mon.xp = 0;
    mon.xpNext = Math.max(1, next - cur);
  }
}
async function gainXP(mon, amount) {
  if (!mon.growth) return;
  mon.xp += amount;
  while (mon.xp >= mon.xpNext) {
    mon.xp -= mon.xpNext;
    await levelUp(mon);
  }
  updateHUD();
}
async function levelUp(mon) {
  const oldMax = mon.stats.maxHp;
  const frac = mon.stats.hp / Math.max(1, oldMax);
  mon.level++;
  const data = await fetchPokemon(mon.id);
  const tmp = makeMon(data, mon.level);
  mon.stats = tmp.stats;
  mon.stats.hp = Math.max(1, Math.floor(mon.stats.maxHp * frac));
  mon.moves = await getGen1DamageMovesForPokemon(data, mon.level);
  if (mon.growth) {
    const levels = mon.growth.table; // this is already the array of levels
    const cur = levels.find((x) => x.level === mon.level)?.experience ?? 0;
    const next =
      levels.find((x) => x.level === mon.level + 1)?.experience ?? cur + 50;
    mon.xpNext = Math.max(1, next - cur);
  }
  await maybeEvolve(mon);
}
async function maybeEvolve(mon) {
  if (!mon.evoChainUrl) return;
  const chain = await fetchEvo(mon.evoChainUrl);
  function findNode(node) {
    if (node.species.name.toLowerCase() === mon.name.toLowerCase()) return node;
    for (const c of node.evolves_to) {
      const r = findNode(c);
      if (r) return r;
    }
    return null;
  }
  const node = findNode(chain.chain);
  if (!node) return;
  const candidate = node.evolves_to?.find((e) =>
    e.evolution_details?.some((d) => (d.min_level || 0) <= mon.level)
  );
  if (!candidate) return;
  const nextName = candidate.species.name;
  const data = await fetchPokemon(nextName);
  const species = await fetchSpecies(data.id);
  const evolved = makeMon(data, mon.level);
  evolved.moves = await getGen1DamageMovesForPokemon(data, mon.level);
  await setupGrowthAndEvo(evolved, species);
  const frac = mon.stats.hp / mon.stats.maxHp;
  evolved.stats.hp = Math.max(1, Math.floor(evolved.stats.maxHp * frac));
  evolved.xp = mon.xp;
  evolved.xpNext = mon.xpNext;
  evolved.sprite = evolved.spriteBack || evolved.spriteFront;
  const idx = state.party.indexOf(mon);
  if (idx >= 0) {
    state.party[idx] = evolved;
    if (state.active === idx) state.player = evolved;
  }
  text(`${cap(mon.name)} evolved into ${cap(evolved.name)}!`);
  updateHUD();
}

async function getGen1DamageMovesForPokemon(poke, level) {
  const seen = new Set();
  const entries = [];
  for (const m of poke.moves) {
    for (const vg of m.version_group_details) {
      if (!VERSION_GROUPS_GEN1.includes(vg.version_group.name)) continue;
      if (vg.move_learn_method?.name !== "level-up") continue;
      const learnLv = vg.level_learned_at ?? 0;
      if (learnLv <= level) {
        if (!seen.has(m.move.url)) {
          seen.add(m.move.url);
          if (!MOVE_CACHE.has(m.move.url))
            MOVE_CACHE.set(m.move.url, fetchCachedJSON(m.move.url));
          entries.push({ url: m.move.url, level: learnLv });
        }
      }
    }
  }
  const moveDatas = await Promise.all(
    entries.map((x) => MOVE_CACHE.get(x.url))
  );
  const merged = moveDatas.map((md, i) => ({ md, level: entries[i].level }));
  const usable = merged
    .filter(
      (x) =>
        x.md.generation?.name === "generation-i" &&
        (x.md.damage_class?.name === "physical" ||
          x.md.damage_class?.name === "special") &&
        x.md.power
    )
    .sort((a, b) => a.level - b.level);
  const uniqueByName = [];
  const nameSeen = new Set();
  for (const x of usable) {
    const name = x.md.name;
    if (!nameSeen.has(name)) {
      nameSeen.add(name);
      uniqueByName.push(x);
    }
    if (uniqueByName.length >= 4) break;
  }
  return uniqueByName.map(({ md }) => ({
    name: cap(md.name.replace(/-/g, " ")),
    key: md.name,
    power: md.power || 40,
    accuracy: md.accuracy || 100,
    type: md.type?.name || "normal",
    damage_class: md.damage_class?.name || "physical",
    pp: md.pp || 20,
    ppLeft: md.pp || 20,
    highCrit: !!(md.meta && md.meta.crit_rate && md.meta.crit_rate > 0),
    ailment: md.meta?.ailment?.name || "none",
    ailment_chance: md.meta?.ailment_chance || 0,
  }));
}

async function updateHUD() {
  const playerSprite = $("#playerSprite");
  const enemySprite = $("#enemySprite");

  if (state.player) {
    $("#playerName").textContent = state.player.name;
    $("#playerLevel").textContent = state.player.level;
    const pf = state.player.stats.hp / state.player.stats.maxHp;
    $(
      "#playerHpText"
    ).textContent = `${state.player.stats.hp}/${state.player.stats.maxHp}`;
    const pFill = $("#playerHpFill");
    pFill.style.width = `${100 * pf}%`;
    pFill.style.background = hpColor(pf);

    try {
      if (playerSprite.dataset.originalSrc !== state.player.sprite) {
        playerSprite.dataset.originalSrc = state.player.sprite;
        const trimmedSrc = await getTrimmedSprite(state.player.sprite);
        playerSprite.src = trimmedSrc;
      }
    } catch (error) {
      console.error("Failed to trim player sprite, using original:", error);
      playerSprite.src = state.player.sprite;
    }

    if (state.player.xpNext) {
      const xf = clamp(state.player.xp / state.player.xpNext, 0, 1);
      $("#playerXpFill").style.width = `${100 * xf}%`;
    }
  }

  if (state.enemy) {
    $("#enemyName").textContent = state.enemy.name;
    $("#enemyLevel").textContent = state.enemy.level;
    const ef = state.enemy.stats.hp / state.enemy.stats.maxHp;
    $(
      "#enemyHpText"
    ).textContent = `${state.enemy.stats.hp}/${state.enemy.stats.maxHp}`;
    const eFill = $("#enemyHpFill");
    eFill.style.width = `${100 * ef}%`;
    eFill.style.background = hpColor(ef);

    try {
      if (enemySprite.dataset.originalSrc !== state.enemy.sprite) {
        enemySprite.dataset.originalSrc = state.enemy.sprite;
        const trimmedSrc = await getTrimmedSprite(state.enemy.sprite);
        enemySprite.src = trimmedSrc;
      }
    } catch (error) {
      console.error("Failed to trim enemy sprite, using original:", error);
      enemySprite.src = state.enemy.sprite;
    }
  }
}


function floatTextNear(targetSelector, txt, good = false) {
  const host = document.querySelector(".screen");
  const target = document.querySelector(targetSelector);
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const hostRect = host.getBoundingClientRect();
  const x = rect.left - hostRect.left + rect.width * 0.6;
  const y = rect.top - hostRect.top - 10;
  const d = el("div", { class: "float " + (good ? "good" : "bad") }, txt);
  d.style.left = `${x}px`;
  d.style.top = `${y}px`;
  host.appendChild(d);
  requestAnimationFrame(() => d.classList.add("show"));
  setTimeout(() => d.remove(), 900);
}
function flashSprite(selector) {
  const el = $(selector);
  if (!el) return;
  el.animate([{ filter: "brightness(2) saturate(0)" }, { filter: "none" }], {
    duration: 220,
    iterations: 2,
  });
}

function screenShake(kind = "hit") {
  const root = document.querySelector(".screen");
  if (!root) return;
  const cls = kind === "crit" ? "shake-crit" : "shake-hit";
  root.classList.add(cls);
  setTimeout(() => root.classList.remove(cls), kind === "crit" ? 380 : 160);
}

// === v0.9 Visual FX helpers =========================================
function ensureVfx() {
  let host = document.getElementById("vfx");
  if (!host) {
    const s = document.querySelector(".screen");
    host = document.createElement("div");
    host.id = "vfx";
    host.className = "vfx";
    s && s.prepend(host);
  }
  return host;
}

const TYPE_COLOR = {
  normal: "#cfd8e3",
  fire: "#ff8a6b",
  water: "#7ecbff",
  grass: "#9fd99c",
  electric: "#ffe66d",
  ice: "#c7f9ff",
  fighting: "#ff9b85",
  poison: "#e0b3ff",
  ground: "#ffd39b",
  flying: "#d0e6ff",
  psychic: "#ff9aff",
  bug: "#d8f88a",
  rock: "#e8d8b5",
  ghost: "#d5c8ff",
  dragon: "#c0ccff",
};

function spawnSparksAt(selector, type = "normal", count = 10) {
  const host = ensureVfx();
  const tgt = document.querySelector(selector);
  if (!host || !tgt) return;
  const r = tgt.getBoundingClientRect();
  const h = host.getBoundingClientRect();
  const cx = r.left - h.left + r.width * 0.6;
  const cy = r.top - h.top + r.height * 0.45;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "spark";
    el.style.color = TYPE_COLOR[type] || TYPE_COLOR.normal;
    const ang = Math.random() * Math.PI * 2;
    const d0 = 4 + Math.random() * 8;
    const d1 = 24 + Math.random() * 20;
    el.style.left = cx + "px";
    el.style.top = cy + "px";
    el.style.setProperty("--sx", Math.cos(ang) * d0 + "px");
    el.style.setProperty("--sy", Math.sin(ang) * d0 + "px");
    el.style.setProperty("--ex", Math.cos(ang) * d1 + "px");
    el.style.setProperty("--ey", Math.sin(ang) * d1 + "px");
    host.appendChild(el);
    setTimeout(() => el.remove(), 420);
  }
}

function showBadgeNear(selector, text) {
  const host = ensureVfx();
  const tgt = document.querySelector(selector);
  if (!host || !tgt) return;
  const r = tgt.getBoundingClientRect();
  const h = host.getBoundingClientRect();
  const x = r.left - h.left + r.width * 0.5;
  const y = r.top - h.top - 10;
  const el = document.createElement("div");
  el.className = "badge";
  el.textContent = text;
  el.style.left = x + "px";
  el.style.top = y + "px";
  host.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// Sprite hit tilt/flash
function impactSprite(selector, crit = false, towardRight = true) {
  const el = document.querySelector(selector);
  if (!el) return;
  const rot = (towardRight ? -1 : 1) * (crit ? 10 : 6);
  const dx = (towardRight ? 8 : -8) * (crit ? 1.5 : 1);
  const dur = crit ? 380 : 220;
  el.animate(
    [
      {
        transform: "translate(0,0) rotate(0deg) scale(1)",
        filter: "brightness(2) saturate(0)",
      },
      {
        transform: `translate(${dx}px,-2px) rotate(${rot}deg) scale(${
          crit ? 1.06 : 1.02
        })`,
        filter: "brightness(1.3)",
        offset: 0.35,
      },
      { transform: "translate(0,0) rotate(0deg) scale(1)", filter: "none" },
    ],
    { duration: dur, easing: "cubic-bezier(.2,.8,.2,1)" }
  );
}

// Faint to white then vanish
function faintOut(selector) {
  if (selector === "#enemySprite") {
    (window.state || (window.state = {})).enemyHidden = true;
  }
  const el = document.querySelector(selector);
  if (!el) return Promise.resolve();
  return el
    .animate(
      [
        { filter: "none", opacity: 1, transform: "translateY(0) scale(1)" },
        {
          filter: "brightness(2) saturate(0)",
          opacity: 0.9,
          transform: "translateY(2px) scale(.98)",
          offset: 0.4,
        },
        {
          filter: "brightness(2) saturate(0)",
          opacity: 0,
          transform: "translateY(10px) scale(.94)",
        },
      ],
      { duration: 650, easing: "ease-in" }
    )
    .finished.then(() => {
      el.style.opacity = "0";
    });
}

// Capture absorb/release
function captureAbsorb(selector, targetX, targetY) {
  const _el = document.querySelector(selector);
  if (_el) {
    _el.style.transform = "translate(0,0) scale(1)";
    _el.style.opacity = "1";
  }
  const el = document.querySelector(selector);
  if (!el) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2,
    cy = r.top + r.height / 2;
  const dx = targetX - cx,
    dy = targetY - cy;
  el.dataset.capdx = dx;
  el.dataset.capdy = dy;
  (window.state || (window.state = {})).enemyHidden = true;
  el.animate(
    [
      {
        filter: "brightness(2) saturate(0)",
        opacity: 1,
        transform: "translate(0,0) scale(1)",
      },
      {
        filter: "brightness(2.2) saturate(0)",
        opacity: 1,
        transform: `translate(${dx * 0.6}px,${dy * 0.6}px) scale(0.6)`,
        offset: 0.5,
      },
      {
        filter: "brightness(2.5) saturate(0)",
        opacity: 0,
        transform: `translate(${dx}px,${dy}px) scale(0)`,
      },
    ],
    { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" }
  ).addEventListener("finish", () => {
    el.style.opacity = "0";
    el.style.transform = `translate(${dx}px,${dy}px) scale(0)`;
  });
}

function captureRelease(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  const dx = parseFloat(el.dataset.capdx || "0"),
    dy = parseFloat(el.dataset.capdy || "0");
  el.style.opacity = "1";
  (window.state || (window.state = {})).enemyHidden = false;
  el.animate(
    [
      {
        opacity: 1,
        transform: `translate(${dx}px,${dy}px) scale(0)`,
        filter: "brightness(2) saturate(0)",
      },
      {
        opacity: 1,
        transform: "translate(0,0) scale(1.02)",
        filter: "brightness(1.3)",
        offset: 0.6,
      },
      { opacity: 1, transform: "translate(0,0) scale(1)", filter: "none" },
    ],
    { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" }
  );
}


function canAct(mon) {
  const s = mon.status;
  if (s.cond === "slp") {
    if (s.turns > 0) {
      s.turns--;
      text(`${mon.name} is fast asleep...`);
      return false;
    }
    s.cond = "none";
    text(`${mon.name} woke up!`);
  }
  if (s.cond === "frz") {
    if (Math.random() < 0.2) {
      s.cond = "none";
      text(`${mon.name} thawed out!`);
    } else {
      text(`${mon.name} is frozen solid!`);
      return false;
    }
  }
  if (s.cond === "par" && Math.random() < 0.25) {
    text(`${mon.name} is paralyzed! It can't move!`);
    return false;
  }
  return true;
}
function endOfTurn(mon) {
  const s = mon.status;
  if (s.cond === "brn" || s.cond === "psn") {
    const dmg = Math.max(1, Math.floor(mon.stats.maxHp / 16));
    mon.stats.hp = clamp(mon.stats.hp - dmg, 0, mon.stats.maxHp);
    updateHUD();
    floatTextNear(
      mon === state.player ? "#playerSprite" : "#enemySprite",
      `-${dmg}`,
      false
    );
    if (mon.stats.hp <= 0) {
      text(`${mon.name} fainted from ${s.cond === "brn" ? "burn" : "poison"}!`);
    }
  }
}
function applyAilment(target, ail) {
  if (!ail || ail === "none") return;
  const s = target.status;
  if (s.cond !== "none") return;
  const map = {
    burn: "brn",
    paralysis: "par",
    poison: "psn",
    sleep: "slp",
    freeze: "frz",
  };
  const c = map[ail];
  if (!c) return;
  s.cond = c;
  s.turns = c === "slp" ? 2 + Math.floor(Math.random() * 3) : 0;
  text(
    `${target.name} is ${
      c === "par"
        ? "paralyzed"
        : c === "psn"
        ? "poisoned"
        : c === "brn"
        ? "burned"
        : c === "frz"
        ? "frozen"
        : "asleep"
    }!`
  );
}


const fx = (function () {
  const canvas = document.getElementById("fxCanvas");
  const ctx = canvas.getContext("2d");
  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvas.clientWidth * ratio);
    canvas.height = Math.floor(canvas.clientHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();
  function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  let ballImagePromise;
  async function getBallImage() {
    if (ballImagePromise) return ballImagePromise;
    ballImagePromise = (async () => {
      const url = ITEM_ICON("poke-ball");
      try {
        let blobUrl = null;
        if (window.isSecureContext && "caches" in window) {
          const cache = await caches.open("poke-cache");
          let resp = await cache.match(url);
          if (!resp) {
            resp = await fetch(url, { mode: "cors" });
            if (resp.ok) cache.put(url, resp.clone());
          }
          if (resp && resp.ok) {
            const blob = await resp.blob();
            blobUrl = URL.createObjectURL(blob);
          }
        }
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.src = blobUrl || url;
        await new Promise((r) => {
          im.onload = r;
          im.onerror = r;
        });
        return im.width ? im : null;
      } catch (e) {
        return null;
      }
    })();
    return ballImagePromise;
  }
  async function throwAndWobble(startX, startY, targetX, targetY, onHit) {
    if (!isMuted) new Audio("assets/sfx/battle/attack.wav").play();
    const r = 32;
    const arcMin = cssNum("--ball-arc-min", 60),
      arcMax = cssNum("--ball-arc-max", 140);
    const dx = targetX - startX,
      dy = targetY - startY;
    const dist = Math.hypot(dx, dy);
    const arc = clamp(dist * 0.25, arcMin, arcMax);
    const img = await getBallImage();
    for (let t = 0; t <= 1.001; t += 0.02) {
      const ctrlX = (startX + targetX) / 2;
      const ctrlY = Math.max(30, Math.min(startY, targetY) - arc);
      const x =
        (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ctrlX + t * t * targetX;
      const y =
        (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * ctrlY + t * t * targetY;
      clear();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 4);
      if (img) ctx.drawImage(img, -r, -r, r * 2, r * 2);
      ctx.restore();
      await sleep(16);
    }
    if (typeof onHit === "function") onHit();
    async function wobbleOnce() {
      for (let a = 0; a < 1; a += 0.1) {
        clear();
        ctx.save();
        ctx.translate(targetX, targetY);
        ctx.rotate(Math.sin(a * Math.PI * 2) * 0.35);
        if (img) ctx.drawImage(img, -r, -r, r * 2, r * 2);
        ctx.restore();
        await sleep(30);
      }
    }
    await wobbleOnce();
    return {
      async shake(times) {
        for (let i = 0; i < times; i++) {
          await wobbleOnce();
          await sleep(160);
        }
      },
      clear,
    };
  }
  return { throwAndWobble, clear };
})();

// Canvas-based background VFX system
const ThemeFX = (() => {
  const host = document.querySelector(".screen");
  if (!host) return { set: () => {} };
  const canvas = document.createElement("canvas");
  canvas.className = "themefx";
  host.prepend(canvas);
  const ctx = canvas.getContext("2d");

  let w = 0,
    h = 0,
    mode = "normal",
    particles = [];

  function resize() {
    w = canvas.width = host.clientWidth;
    h = canvas.height = host.clientHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const COUNT = { normal: 40, fire: 80, water: 40, psychic: 40 };

  function makeParticle() {
    switch (mode) {
      case "fire":
        return {
          x: Math.random() * w,
          y: h + Math.random() * 40,
          vx: (Math.random() - 0.5) * 0.3,
          vy: 1 + Math.random() * 1.2,
          size: 2 + Math.random() * 3,
          life: 1,
        };
      case "water":
        return {
          x: Math.random() * w,
          y: h + Math.random() * 60,
          vx: (Math.random() - 0.5) * 0.2,
          vy: 0.6 + Math.random() * 0.8,
          size: 3 + Math.random() * 4,
        };
      case "psychic":
        return {
          angle: Math.random() * Math.PI * 2,
          radius: 40 + Math.random() * 120,
          speed: 0.004 + Math.random() * 0.01,
          size: 3 + Math.random() * 5,
          hue: Math.random() * 360,
        };
      default:
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: 2 + Math.random() * 2,
        };
    }
  }

  function resetParticle(p) {
    Object.assign(p, makeParticle());
  }

  function set(type = "normal") {
    mode = type;
    particles = [];
    const n = COUNT[type] || COUNT.normal;
    for (let i = 0; i < n; i++) particles.push(makeParticle());
  }

  function render(t) {
    ctx.clearRect(0, 0, w, h);

    if (mode === "water") {
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = "#fff";
      const step = 40;
      for (let y = 0; y < h; y += step) {
        const off = (t / 20 + y) % step;
        ctx.beginPath();
        ctx.moveTo(0, y + off);
        ctx.lineTo(w, y + off);
        ctx.stroke();
      }
      ctx.restore();
    } else if (mode === "psychic") {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.translate(w / 2, h / 2);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(w, h) / 1.5);
      const hue = (t / 40) % 360;
      grad.addColorStop(0, `hsl(${hue},80%,60%)`);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }

    for (const p of particles) {
      switch (mode) {
        case "fire":
          p.y -= p.vy;
          p.x += p.vx + (Math.random() - 0.5) * 0.2;
          p.life -= 0.015;
          if (p.life <= 0 || p.y < -50) resetParticle(p);
          ctx.save();
          ctx.globalAlpha = p.life;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          g.addColorStop(0, "#ffea00");
          g.addColorStop(1, "#ff3c00");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        case "water":
          p.y -= p.vy;
          p.x += p.vx;
          if (p.y < -20) resetParticle(p);
          ctx.save();
          ctx.strokeStyle = "rgba(200,240,255,0.7)";
          ctx.fillStyle = "rgba(200,240,255,0.1)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          break;
        case "psychic":
          p.angle += p.speed;
          const px = w / 2 + Math.cos(p.angle) * p.radius;
          const py = h / 2 + Math.sin(p.angle) * p.radius;
          ctx.fillStyle = `hsla(${(p.hue + t / 30) % 360},80%,70%,0.8)`;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        default:
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) resetParticle(p);
          ctx.fillStyle = "rgba(255,255,255,0.2)";
          ctx.fillRect(p.x, p.y, 2, 2);
      }
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  set("normal");

  return { set };
})();

function maybeAwardDrops() {
  if (Math.random() < 0.2) {
    const gained = Math.random() < 0.5 ? 1 : 2;
    state.items["poke-ball"] += gained;
    text(`You found ${gained} Poké Ball${gained > 1 ? "s" : ""}!`);
  }
  if (Math.random() < 0.15) {
    const r = Math.random();
    const key = r < 0.6 ? "potion" : r < 0.9 ? "super-potion" : "hyper-potion";
    state.items[key]++;
    text(`You obtained a ${cap(key.replace(/-/g, " "))}!`);
  }
  if (Math.random() < 0.1) {
    const cures = [
      "antidote",
      "parlyz-heal",
      "awakening",
      "burn-heal",
      "ice-heal",
    ];
    const key = cures[Math.floor(Math.random() * cures.length)];
    state.items[key]++;
    text(`You found a ${cap(key.replace(/-/g, " "))}!`);
  }
}

async function startEncounter() {
  show("menu");
  let poke, mon, species;
  for (let tries = 0; tries < 10; tries++) {
    const enemyLevel = clamp(3 + Math.floor(wins / 3), 3, 12);
    const eid = 1 + Math.floor(Math.random() * GEN1_MAX_ID);
    if (eid >= 144 && eid <= 151) continue;
    poke = await fetchPokemon(eid);
    const bst = poke.stats.reduce((a, s) => a + s.base_stat, 0);
    if (bst <= 330) {
      mon = makeMon(poke, enemyLevel);
      species = await fetchSpecies(eid);
      mon.capture_rate = species.capture_rate;
      break;
    }
  }
  if (!mon) {
    const enemyLevel = clamp(3 + Math.floor(wins / 3), 3, 12);
    mon = makeMon(poke, enemyLevel);
    const sp = await fetchSpecies(poke.id);
    mon.capture_rate = sp.capture_rate;
  }
  mon.moves = await getGen1DamageMovesForPokemon(poke, mon.level);
  if (mon.moves.length === 0) {
    mon.moves = [
      {
        name: "Tackle",
        key: "tackle",
        power: 40,
        accuracy: 95,
        type: "normal",
        damage_class: "physical",
        pp: 35,
        ppLeft: 35,
      },
    ];
  }

  // Set the new enemy in the state
  state.enemy = mon;

  // Update the data and sprite source while the sprite remains invisible
  await updateHUD();

  // Now, explicitly make the new sprite visible with a clean fade-in
  const es = $("#enemySprite");
  if (es) {
    // Reset any transformations from previous animations
    es.style.transform = "none";
    delete es.dataset.capdx;
    delete es.dataset.capdy;

    // Fade the new sprite in
    es.style.opacity = 0; // Ensure it starts transparent
    es.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 250,
      easing: "ease-in",
    }).onfinish = () => {
      es.style.opacity = 1;
    };
  }

  setThemeByType(mon.types);
  text("A wild Pokémon appeared!");
  await playCry(mon);
  maybeAuto();
}

async function chooseStarter(id) {
  const poke = await fetchPokemon(id);
  const mon = makeMon(poke, 5);
  const species = await fetchSpecies(id);
  mon.capture_rate = species.capture_rate;
  mon.moves = await getGen1DamageMovesForPokemon(poke, mon.level);
  if (mon.moves.length === 0) {
    mon.moves = [
      {
        name: "Tackle",
        key: "tackle",
        power: 40,
        accuracy: 95,
        type: "normal",
        damage_class: "physical",
        pp: 35,
        ppLeft: 35,
      },
    ];
  }
  await setupGrowthAndEvo(mon, species);
  mon.sprite = mon.spriteBack || mon.spriteFront;
  state.party = [mon];
  setActive(0);
  await startEncounter();
}

function renderMoves() {
  const grid = $("#movesGrid");
  grid.innerHTML = "";
  state.player.moves.forEach((mv, idx) => {
    const disabled = mv.ppLeft <= 0;
    const btn = document.createElement("button");
    btn.className = "move-btn";
    btn.disabled = disabled;
    btn.innerHTML = `<span>${mv.name}</span><span class="small">${cap(
      mv.type
    )} • Pow ${mv.power} • PP ${mv.ppLeft}/${mv.pp}</span>`;
    btn.addEventListener("click", () => useMove(idx));
    grid.appendChild(btn);
  });
}

function renderParty() {
  const list = $("#partyList");
  list.innerHTML = "";
  state.party.forEach((m, idx) => {
    const f = m.stats.hp / m.stats.maxHp;
    const pct = Math.round(100 * f);
    const item = el("div", { class: "party-item" });
    item.innerHTML = `<div>${idx === state.active ? "★ " : ""}${cap(
      m.name
    )} Lv ${m.level} — HP ${m.stats.hp}/${
      m.stats.maxHp
    }</div><div style="width:120px" class="hpbar"><div style="width:${pct}%; height:8px; background:${hpColor(
      f
    )}"></div></div>`;
    const b = el("button", {}, "Switch");
    b.disabled = idx === state.active || m.stats.hp <= 0;
    b.addEventListener("click", () => swapTo(idx));
    item.appendChild(b);
    list.appendChild(item);
  });
}

async function swapTo(idx) {
  if (state.busy) return;
  setBusy(true);
  if (idx === state.active) {
    setBusy(false);
    return;
  }
  const from = state.player;
  const to = state.party[idx];
  text(`${cap(from.name)}, come back! Go, ${cap(to.name)}!`);
  await sleep(500);
  setActive(idx);
  await sleep(400);
  await enemyTurn();
  show("menu");
  setBusy(false);
}

function effText(mult) {
  if (mult === 0) return "It doesn't affect the foe...";
  if (mult >= 2) return "It's super effective!";
  if (mult <= 0.5) return "It's not very effective...";
  return "";
}

async function useMove(i) {
  if (state.busy) return;
  setBusy(true);
  const actor = state.player;
  if (!canAct(actor)) {
    await sleep(600);
    await enemyTurn();
    setBusy(false);
    return;
  }
  const mv = actor.moves[i];
  if (mv.ppLeft <= 0) {
    text("No PP left for that move!");
    setBusy(false);
    return;
  }
  show("menu");
  text(`${actor.name} used ${mv.name}!`);
  await sleep(250);
  mv.ppLeft = Math.max(0, mv.ppLeft - 1);
  renderMoves();
  if (!rollHit(mv.accuracy)) {
    text("But it missed!");
    await sleep(400);
    await enemyTurn();
    setBusy(false);
    return;
  }

  playSfx(mv); // Play the move's sound effect

  const { dmg, eff, crit } = calcDamage(actor, state.enemy, mv);
  impactSprite("#enemySprite", crit, true);
  spawnSparksAt("#enemySprite", mv.type, crit ? 14 : 10);

  state.enemy.stats.hp = clamp(
    state.enemy.stats.hp - dmg,
    0,
    state.enemy.stats.maxHp
  );
  updateHUD();
  let msg = `-${dmg}`;
  if (crit) msg += "!";
  floatTextNear("#enemySprite", msg, false);
  if (eff !== 1) {
    text(effText(eff));
    showBadgeNear("#enemySprite", eff > 1 ? "SUPER!" : eff < 1 ? "WEAK" : "");
    await sleep(350);
  }
  if (
    mv.ailment &&
    mv.ailment !== "none" &&
    Math.random() * 100 < (mv.ailment_chance || 0)
  )
    applyAilment(state.enemy, mv.ailment);
  await sleep(300);
  if (state.enemy.stats.hp <= 0) {
    await playCry(state.enemy);
    await faintOut("#enemySprite");
    text(`The wild ${state.enemy.name} fainted!`);
    const xpGain = Math.max(
      1,
      Math.floor(((state.enemy.base_exp || 64) * state.enemy.level) / 7)
    );
    await gainXP(actor, xpGain);
    maybeAwardDrops();
    wins++;
    await sleep(800);
    await startEncounter();
    setBusy(false);
    return;
  }
  endOfTurn(state.enemy);
  if (state.enemy.stats.hp <= 0) {
    await playCry(state.enemy);
    text(`The wild ${state.enemy.name} fainted!`);
    const xpGain = Math.max(
      1,
      Math.floor(((state.enemy.base_exp || 64) * state.enemy.level) / 7)
    );
    await gainXP(actor, xpGain);
    maybeAwardDrops();
    wins++;
    await sleep(800);
    await startEncounter();
    setBusy(false);
    return;
  }
  await enemyTurn();
  setBusy(false);
}

async function enemyTurn() {
  const actor = state.enemy;
  if (!canAct(actor)) {
    await sleep(500);
    endOfTurn(state.player);
    if (state.player.stats.hp <= 0) {
      await playCry(state.player);
      await faintOut("#playerSprite");
      text(
        `${state.player.name} fainted... Sending you to the Pokémon Center.`
      );
      await sleep(900);
      state.player.stats.hp = state.player.stats.maxHp;
      wins = Math.max(0, wins - 1);
      await startEncounter();
    } else {
      text("What will you do?");
      maybeAuto();
    }
    return;
  }
  const mv = actor.moves[Math.floor(Math.random() * actor.moves.length)];
  text(`Enemy ${actor.name} used ${mv.name}!`);
  await sleep(250);
  if (!rollHit(mv.accuracy)) {
    text("It missed!");
    await sleep(300);
    endOfTurn(state.player);
    if (state.player.stats.hp <= 0) {
      await playCry(state.player);
      text(`${state.player.name} fainted...`);
      await sleep(900);
      state.player.stats.hp = state.player.stats.maxHp;
      wins = Math.max(0, wins - 1);
      await startEncounter();
    } else {
      text("What will you do?");
      maybeAuto();
    }
    return;
  }

  playSfx(mv); // Play enemy move SFX

  const { dmg, eff, crit } = calcDamage(actor, state.player, mv);
  impactSprite("#playerSprite", crit, false);
  spawnSparksAt("#playerSprite", mv.type, crit ? 14 : 10);
  screenShake(crit ? "crit" : "hit");

  state.player.stats.hp = clamp(
    state.player.stats.hp - dmg,
    0,
    state.player.stats.maxHp
  );
  updateHUD();
  let msg = `-${dmg}`;
  if (crit) msg += "!";
  floatTextNear("#playerSprite", msg, true);
  if (eff !== 1) {
    text(effText(eff));
    await sleep(350);
  }
  if (
    mv.ailment &&
    mv.ailment !== "none" &&
    Math.random() * 100 < (mv.ailment_chance || 0)
  )
    applyAilment(state.player, mv.ailment);
  await sleep(300);
  if (state.player.stats.hp <= 0) {
    await playCry(state.player);
    text(`${state.player.name} fainted... Sending you to the Pokémon Center.`);
    await sleep(900);
    state.player.stats.hp = state.player.stats.maxHp;
    wins = Math.max(0, wins - 1);
    await startEncounter();
    return;
  }
  endOfTurn(state.player);
  if (state.player.stats.hp <= 0) {
    await playCry(state.player);
    text(`${state.player.name} fainted... Sending you to the Pokémon Center.`);
    await sleep(900);
    state.player.stats.hp = state.player.stats.maxHp;
    wins = Math.max(0, wins - 1);
    await startEncounter();
    return;
  }
  text("What will you do?");
  maybeAuto();
}

function hasPotion() {
  return (
    state.items["potion"] > 0 ||
    state.items["super-potion"] > 0 ||
    state.items["hyper-potion"] > 0
  );
}
function bestPotion() {
  const need = state.player.stats.maxHp - state.player.stats.hp;
  if (need <= 0) return null;
  const opts = [
    { k: "potion", heal: 20 },
    { k: "super-potion", heal: 50 },
    { k: "hyper-potion", heal: 200 },
  ];
  for (const o of opts) {
    if (state.items[o.k] > 0 && need <= o.heal) return o;
  }
  for (const o of opts.slice().reverse()) {
    if (state.items[o.k] > 0) return o;
  }
  return null;
}
async function usePotionKey(key) {
  if (state.busy) return;
  const map = { potion: 20, "super-potion": 50, "hyper-potion": 200 };
  const heal = map[key];
  if (!heal || state.items[key] <= 0) {
    text("No such potion.");
    await sleep(500);
    await enemyTurn(); // Always end turn
    return;
  }
  if (state.player.stats.hp >= state.player.stats.maxHp) {
    // Changed condition
    text("It won't have any effect...");
    await sleep(500);
    await enemyTurn(); // Always end turn
    return;
  }
  const got = Math.min(heal, state.player.stats.maxHp - state.player.stats.hp);
  state.player.stats.hp += got;
  state.items[key]--;
  updateHUD();
  text(`You used a ${cap(key.replace(/-/g, " "))}! Restored ${got} HP.`);
  floatTextNear("#playerSprite", `+${got}`, true);
  await sleep(500);
  await enemyTurn();
}

function canCure(key) {
  const s = state.player.status.cond;
  if (!s || s === "none") return false;
  const map = {
    antidote: "psn",
    "parlyz-heal": "par",
    awakening: "slp",
    "burn-heal": "brn",
    "ice-heal": "frz",
  };
  return map[key] === s;
}
async function useCureKey(key) {
  if (state.items[key] <= 0) {
    text("None left.");
    await sleep(500);
    await enemyTurn(); // Always end turn
    return;
  }
  if (!canCure(key)) {
    text("It had no effect.");
    await sleep(500);
    await enemyTurn(); // Always end turn
    return;
  }
  state.items[key]--;
  state.player.status = { cond: "none", turns: 0, toxic: false };
  text(`${cap(key.replace(/-/g, " "))} cured the status!`);
  await sleep(400);
  await enemyTurn();
}

function openBag() {
  if (state.busy) return;
  const box = $("#msgBox");
  let view = $("#bagView");
  if (!view) {
    view = el("div", { id: "bagView", class: "hidden" });
    box.appendChild(view);
  }
  view.innerHTML = "";
  const head = el("div", { class: "row between" });
  head.append(el("div", {}, "Bag"));
  const back = el("button", { id: "bagBackBtn", class: "small" }, "Back");
  back.onclick = () => {
    show("menu");
    text("What will you do?");
  };
  head.append(back);
  view.append(head);
  const grid = el("div", {
    id: "bagGrid",
    style:
      "display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;",
  });
  function card(key, label, action) {
    const count = state.items[key] || 0;
    const c = el("div", {
      class: "card",
      style:
        "display:flex;align-items:center;gap:10px;justify-content:space-between;",
    });
    const left = el("div", {});
    const img = el("img", {
      src: ITEM_ICON(key),
      width: 32,
      height: 32,
      alt: key,
    });
    left.append(img);
    left.append(el("div", { class: "small" }, `${label}`));
    c.append(left);
    c.append(el("div", { class: "small" }, `x${count}`));
    const btn = el("button", {}, action === "ball" ? "Throw" : "Use");
    btn.disabled = count <= 0;
    btn.onclick = () => {
      if (action === "ball") throwBall();
      else if (["potion", "super-potion", "hyper-potion"].includes(key))
        usePotionKey(key);
      else useCureKey(key);
    };
    c.append(btn);
    grid.append(c);
  }
  card("poke-ball", "Poké Ball", "ball");
  card("potion", "Potion");
  card("super-potion", "Super Potion");
  card("hyper-potion", "Hyper Potion");
  card("antidote", "Antidote");
  card("parlyz-heal", "Parlyz Heal");
  card("awakening", "Awakening");
  card("burn-heal", "Burn Heal");
  card("ice-heal", "Ice Heal");
  view.append(grid);
  show("bag");
  text("Choose an item.");
}

function openBoxes() {
  if (state.busy) return;
  const box = $("#msgBox");
  let view = $("#boxView");
  if (!view) {
    view = el("div", { id: "boxView", class: "hidden" });
    box.appendChild(view);
  }
  view.innerHTML = "";
  const head = el("div", { class: "row between" });
  head.append(el("div", {}, `Box — ${state.box.length} Pokémon`));
  const back = el("button", { id: "boxBackBtn", class: "small" }, "Back");
  back.onclick = () => {
    show("swap");
  };
  head.append(back);
  view.append(head);
  const list = el("div", {
    style:
      "display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;",
  });
  state.box.forEach((m, idx) => {
    const c = el("div", { class: "card" });
    c.innerHTML = `<div style="display:flex;align-items:center;gap:8px;justify-content:space-between"><div><img src="${
      m.spriteFront
    }" width="48" height="48"/> ${cap(m.name)} Lv ${m.level}</div></div>`;
    const b = el(
      "button",
      {},
      state.party.length < 6 ? "Add to party" : "Swap with active"
    );
    b.onclick = () => {
      if (state.party.length < 6) {
        state.party.push(m);
        state.box.splice(idx, 1);
        setActive(state.party.length - 1);
      } else {
        const old = state.party[state.active];
        state.party[state.active] = m;
        state.box[idx] = old;
        setActive(state.active);
      }
      renderParty();
      openBoxes();
    };
    c.append(b);
    list.append(c);
  });
  view.append(list);
  show("box");
}

async function throwBall() {
  if (state.busy) return;
  setBusy(true);
  if ((state.items["poke-ball"] || 0) <= 0) {
    text("No Poké Balls left!");
    setBusy(false);
    return;
  }
  state.items["poke-ball"]--;
  text(`You threw a Poké Ball! (x${state.items["poke-ball"]})`);
  const canvas = document.getElementById("fxCanvas");
  const cRect = canvas.getBoundingClientRect();
  const eRect = document.querySelector(".enemy .plate").getBoundingClientRect();
  const pRect = document
    .querySelector(".player .plate")
    .getBoundingClientRect();
  const startX = 40;
  const startY = pRect.top + pRect.height * 0.1 - cRect.top;
  const targetX = eRect.left + eRect.width * 0.5 - cRect.left;
  const targetY = eRect.top + eRect.height * 0.1 - cRect.top;
  const enemyImg = document.getElementById("enemySprite");
  try {
    const handle = await fx.throwAndWobble(
      startX,
      startY,
      targetX,
      targetY,
      () => {
        enemyImg.style.opacity = "0";
      }
    );
    const success = catchSuccess(state.enemy);
    const shakes = success ? 3 : Math.floor(Math.random() * 2);
    await handle.shake(shakes);
    if (success) {
      if (!isMuted) new Audio("assets/sfx/battle/attack.wav").play(); // Placeholder catch sound
      text(`Gotcha! ${state.enemy.name} was caught!`);
      const data = await fetchPokemon(state.enemy.id);
      const species = await fetchSpecies(state.enemy.id);
      const mon = makeMon(data, state.enemy.level);
      mon.moves = await getGen1DamageMovesForPokemon(data, mon.level);
      mon.capture_rate = species.capture_rate;
      await setupGrowthAndEvo(mon, species);
      mon.sprite = mon.spriteFront;
      if (state.party.length < 6) {
        state.party.push(mon);
      } else {
        state.box.push(mon);
        text(`${cap(mon.name)} was sent to the Box!`);
      }
      maybeAwardDrops();
      await sleep(1100);
      handle.clear();
      await startEncounter();
    } else {
      handle.clear();
      captureRelease("#enemySprite");
      text(`The ${state.enemy.name} escaped!`);
      await sleep(600);
      await enemyTurn();
    }
  } catch (err) {
    console.error("Ball FX error:", err);
    enemyImg.style.opacity = "1";
    text("The ball fizzled…");
    await sleep(500);
  }
  setBusy(false);
}

(function initUI() {
  ["#catchBtn", "#potionBtn"].forEach((sel) => {
    const e = $(sel);
    if (e) e.style.display = "none";
  });
  const bag = $("#ballInfoBtn");
  if (bag) {
    bag.textContent = "BAG";
    bag.onclick = () => {
      if (state.busy) return;
      openBag();
    };
  }
  const menu = $("#menu .choices");
  if (menu && !$("#autoToggle")) {
    const lab = el("label", {
      class: "small",
      style: "display:flex; align-items:center; gap:6px;",
    });
    const cb = el("input", { type: "checkbox", id: "autoToggle" });
    cb.onchange = () => {
      state.auto = cb.checked;
      if (state.auto) maybeAuto();
    };
    lab.append(cb);
    lab.append(document.createTextNode("Auto play"));
    menu.append(lab);
  }
  const swapHead = $("#swapView .row.between");
  if (swapHead && !$("#boxOpenBtn")) {
    const b = el("button", { id: "boxOpenBtn", class: "small" }, "Boxes");
    b.onclick = () => openBoxes();
    swapHead.insertBefore(b, swapHead.lastElementChild);
  }
})();

function bestMove(attacker, defender) {
  let pick = null;
  let score = -1;
  attacker.moves.forEach((m, idx) => {
    if (m.ppLeft <= 0) return;
    const eff = typeEffect(m.type, defender.types);
    const stab = attacker.types.includes(m.type) ? 1.5 : 1;
    const ppFactor = m.pp > 0 ? m.ppLeft / m.pp : 0; // Prefer moves with more PP
    const sc =
      ((m.power || 0) * eff * stab * (m.accuracy || 100) * ppFactor) / 100;
    if (sc > score) {
      score = sc;
      pick = idx;
    }
  });
  return pick;
}

// New: Compute overall battle score for a mon vs enemy (offense + defense + HP)
function battleScore(mon, enemy) {
  // Offense: max move score weighted by PP
  let maxMoveScore = 0;
  let totalPP = 0;
  let totalPPLeft = 0;
  mon.moves.forEach((m) => {
    totalPP += m.pp || 0;
    totalPPLeft += m.ppLeft || 0;
    if (m.ppLeft <= 0) return;
    const eff = typeEffect(m.type, enemy.types);
    const stab = mon.types.includes(m.type) ? 1.5 : 1;
    const ppFactor = m.pp > 0 ? m.ppLeft / m.pp : 0;
    const mScore =
      ((m.power || 0) * eff * stab * (m.accuracy || 100) * ppFactor) / 100;
    if (mScore > maxMoveScore) maxMoveScore = mScore;
  });
  if (maxMoveScore <= 0) return 0; // No viable moves
  const ppFactorOverall = totalPP > 0 ? totalPPLeft / totalPP : 0;

  // Defense: average incoming effectiveness (lower better, so invert)
  let defScore = 0;
  let moveCount = 0;
  enemy.moves.forEach((em) => {
    if (em.ppLeft <= 0) return;
    defScore += typeEffect(em.type, mon.types);
    moveCount++;
  });
  defScore = moveCount > 0 ? defScore / moveCount : 1;
  const defFactor = 1 / defScore; // Higher if resistant

  // HP factor
  const hpFactor = mon.stats.hp / mon.stats.maxHp;

  // Level factor
  const levelFactor = enemy.level
    ? Math.max(0.5, Math.min(2, mon.level / enemy.level))
    : 1;

  // Overall: offense weighted higher, modulated by defense, HP, PP, and level
  return maxMoveScore * defFactor * hpFactor * ppFactorOverall * levelFactor;
}

// Updated bestSwitch: Returns index of best alternative if better than current
function bestSwitch(enemy, currentScore, threshold = 1.5) {
  let bestIdx = null;
  let bestScore = currentScore * threshold;
  state.party.forEach((mon, idx) => {
    if (mon.stats.hp <= 0 || idx === state.active) return; // Skip fainted or current
    const score = battleScore(mon, enemy);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  });
  return bestIdx;
}
// New: Auto switch function (simulates battle switch turn)
async function autoSwitch(toIdx) {
  if (state.busy || toIdx === state.active) return;
  setBusy(true);
  const oldName = cap(state.player.name);
  const newName = cap(state.party[toIdx].name);
  text(`Come back, ${oldName}!`);
  await sleep(800);
  setActive(toIdx);
  updateHUD(); // Assume this updates sprites/HUD
  text(`Go, ${newName}!`);
  await sleep(800);
  await enemyTurn();
  setBusy(false);
}

async function maybeAuto() {
  if (!state.auto || state.busy) return;
  await sleep(450);

  const hpF = state.player.stats.hp / state.player.stats.maxHp;
  const enemyHpF = state.enemy.stats.hp / state.enemy.stats.maxHp;

  // 1) Heal if low and we can
  if (hpF < 0.35 && hasPotion()) {
    const p = bestPotion();
    if (p) {
      await usePotionKey(p.k);
      await sleep(500);
      return;
    }
  }

  // 2) Catch logic if enemy is weak or statused
  if (
    (state.items["poke-ball"] || 0) > 0 &&
    (enemyHpF < 0.3 || ["slp", "frz", "par"].includes(state.enemy.status.cond))
  ) {
    await throwBall();
    await sleep(400);
    return;
  }

  const curScore = battleScore(state.player, state.enemy);

  // 3) If our health is low, try to preserve the mon by switching
  if (hpF < 0.3) {
    const switchIdxLow = bestSwitch(state.enemy, curScore, 1.1);
    if (switchIdxLow != null) {
      text("Auto: Preserving low HP mon…");
      await autoSwitch(switchIdxLow);
      await sleep(400);
      return;
    }
  }

  // 4) If another mon is far better suited, switch even at high HP
  const switchIdx = bestSwitch(state.enemy, curScore, 1.5);
  if (switchIdx != null) {
    text("Auto: Switching to a better matchup…");
    await autoSwitch(switchIdx);
    await sleep(400);
    return;
  }

  // 5) Attack if we have any viable move
  const moveIdx = bestMove(state.player, state.enemy);
  if (moveIdx != null) {
    await useMove(moveIdx);
    await sleep(400);
    return;
  }

  // 6) As a fallback, try switching to any slightly better option
  const backupSwitch = bestSwitch(state.enemy, curScore, 1.1);
  if (backupSwitch != null) {
    text("Auto: Switching to available option…");
    await autoSwitch(backupSwitch);
    await sleep(400);
    return;
  }

  // 7) Absolute last resort: run
  text("Auto: No viable moves, no healthy switch — running.");
  await sleep(350);
  await startEncounter();
}
$("#fightBtn").addEventListener("click", () => {
  if (state.busy) return;
  renderMoves();
  show("moves");
});
$("#ballInfoBtn").addEventListener("click", () => {
  if (state.busy) return;
  openBag();
});
$("#swapBtn").addEventListener("click", () => {
  if (state.busy) return;
  renderParty();
  show("swap");
});
$("#runBtn").addEventListener("click", async () => {
  if (state.busy) return;
  text("Got away safely!");
  await sleep(500);
  await startEncounter();
});
$("#backBtn").addEventListener("click", () => {
  if (state.busy) return;
  show("menu");
  text("What will you do?");
});
$("#swapBackBtn").addEventListener("click", () => {
  if (state.busy) return;
  show("menu");
  text("What will you do?");
});
$("#starterPick").addEventListener("click", (e) => {
  const id = e.target?.dataset?.starter;
  if (!id || state.busy) return;
  show("menu");
  chooseStarter(id);
});

// Update auto loop interval for slower ticking
function autoLoopTick() {
  if (state.auto) maybeAuto();
}
setInterval(autoLoopTick, 1000); // Increased from 700ms

initAudio();
