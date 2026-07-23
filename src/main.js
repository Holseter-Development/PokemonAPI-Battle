// main.js — the battle controller. Wires the pure engine (battle.js) to the DOM,
// drives animation timing, and owns high-level game flow: title screen,
// encounters, trainer battles, catching, party/box, save/load and auto-play.

import {
  GEN1_MAX_ID,
  fetchPokemon,
  fetchSpecies,
  fetchGrowth,
  fetchEvo,
  fetchMoveset,
  spriteSet,
} from "./api.js";
import { playSfx, initAudio, playCry, isMuted } from "./audio.js";
import {
  clamp,
  typeEffect,
  calcDamage,
  useMove,
  canAct,
  endOfTurn,
  firstMover,
  chooseAIMove,
  bestMoveIndex,
  battleScore,
  bestSwitch,
  catchSuccess,
  effText,
} from "./battle.js";
import {
  TYPE_COLOR,
  STATUS_LABEL,
  STATUS_COLOR,
  TRAINERS,
  STRUGGLE,
  cap,
} from "./data.js";
import { $, el, show, typeText, setText } from "./ui.js";

console.info("PokéBattle Arena — build v1.0");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function cssNum(name, fallback) {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return isNaN(v) ? fallback : v;
}
function hpColor(f) {
  return f > 0.5 ? "var(--hp-green)" : f > 0.2 ? "var(--hp-yellow)" : "var(--hp-red)";
}
const ITEM_ICON = (name) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}.png`;

// Say a line and wait for it to finish typing (+ a short beat to read).
async function say(str, hold = 260) {
  await typeText(str);
  if (hold) await sleep(hold);
}

// ---------------------------------------------------------------- state ----

const SAVE_KEY = "pkbattle:save:v2";
const TRAINER_EVERY = 4; // wild wins between trainer challenges

const state = {
  party: [],
  box: [],
  active: 0,
  player: null,
  enemy: null,
  busy: false,
  auto: false,
  started: false,
  mode: "wild", // "wild" | "trainer"
  trainer: null,
  trainerTeam: [],
  trainerIdx: 0,
  trainersBeaten: 0,
  wins: 0,
  money: 0,
  badges: [],
  items: {
    "poke-ball": 10, "great-ball": 2, "ultra-ball": 0,
    potion: 3, "super-potion": 1, "hyper-potion": 0,
    antidote: 1, "parlyz-heal": 1, awakening: 1, "burn-heal": 1, "ice-heal": 1,
  },
};

function setBusy(v) {
  state.busy = v;
  document.querySelectorAll(".msgbox button, #menu button").forEach((b) => (b.disabled = v));
}

// ---------------------------------------------------------------- mons -----

function zeroStages() {
  return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
}
function resetStages(mon) {
  if (mon) mon.stages = zeroStages();
}
function ensureRuntime(mon) {
  if (!mon.stages) mon.stages = zeroStages();
  if (!mon.status) mon.status = { cond: "none", turns: 0, toxic: 0 };
  return mon;
}

function makeMon(data, level = 5) {
  const b = Object.fromEntries(data.stats.map((s) => [s.stat.name, s.base_stat]));
  const maxHp = Math.floor((b.hp * 2 * level) / 100 + level + 10);
  const st = (base) => Math.floor((base * 2 * level) / 100 + 5);
  const sp = spriteSet(data);
  return {
    id: data.id,
    name: cap(data.name),
    spriteFront: sp.front,
    spriteBack: sp.back,
    artwork: sp.artwork,
    sprite: sp.front,
    level,
    stats: {
      maxHp, hp: maxHp,
      atk: st(b.attack), def: st(b.defense),
      spa: st(b["special-attack"]), spd: st(b["special-defense"]), spe: st(b.speed),
    },
    base_exp: data.base_experience || 64,
    moves: [],
    capture_rate: 45,
    types: data.types.map((t) => t.type.name),
    growth: null,
    evoChainUrl: null,
    speciesId: null,
    xp: 0,
    xpNext: 10,
    stages: zeroStages(),
    status: { cond: "none", turns: 0, toxic: 0 },
  };
}

async function buildMon(idOrName, level) {
  const data = await fetchPokemon(idOrName);
  const species = await fetchSpecies(data.id);
  const mon = makeMon(data, level);
  mon.capture_rate = species.capture_rate;
  mon.moves = await fetchMoveset(data, level);
  if (!mon.moves.length) mon.moves = [{ ...STRUGGLE, name: "Tackle", key: "tackle", power: 40, pp: 35, ppLeft: 35, drain: 0 }];
  await setupGrowthAndEvo(mon, species);
  return mon;
}

function setActive(i) {
  state.active = i;
  state.player = state.party[i];
  if (state.player) {
    ensureRuntime(state.player);
    resetStages(state.player);
    state.player.sprite = state.player.spriteBack || state.player.spriteFront;
  }
  updateHUD();
}

// ---- growth / XP / evolution ----

async function setupGrowthAndEvo(mon, species) {
  mon.speciesId = species.id;
  mon.evoChainUrl = species.evolution_chain?.url || null;
  const g = species.growth_rate;
  if (g) {
    const table = await fetchGrowth(g.url);
    mon.growth = { url: g.url, table: table.levels };
    const cur = table.levels.find((x) => x.level === mon.level)?.experience ?? 0;
    const next = table.levels.find((x) => x.level === mon.level + 1)?.experience ?? cur + 10;
    mon.xp = 0;
    mon.xpNext = Math.max(1, next - cur);
  }
}

async function gainXP(mon, amount) {
  if (!mon.growth) return;
  await animateXP(mon, amount);
  mon.xp += amount;
  while (mon.xp >= mon.xpNext) {
    mon.xp -= mon.xpNext;
    await levelUp(mon);
  }
  updateHUD();
}

async function animateXP(mon, amount) {
  // Purely cosmetic sweep of the XP bar toward full before applying.
  const fill = $("#playerXpFill");
  if (!fill || mon !== state.player) return;
  const start = clamp(mon.xp / mon.xpNext, 0, 1);
  const end = clamp((mon.xp + amount) / mon.xpNext, 0, 1);
  fill.style.width = `${100 * clamp(Math.min(end, 1), 0, 1)}%`;
  await sleep(320);
}

async function levelUp(mon) {
  const oldMax = mon.stats.maxHp;
  const frac = mon.stats.hp / Math.max(1, oldMax);
  mon.level++;
  const data = await fetchPokemon(mon.id);
  const tmp = makeMon(data, mon.level);
  const stages = mon.stages, status = mon.status;
  mon.stats = tmp.stats;
  mon.stats.hp = Math.max(1, Math.floor(mon.stats.maxHp * frac));
  mon.stages = stages;
  mon.status = status;
  mon.moves = mergeMoves(mon.moves, await fetchMoveset(data, mon.level));
  if (mon.growth) {
    const levels = mon.growth.table;
    const cur = levels.find((x) => x.level === mon.level)?.experience ?? 0;
    const next = levels.find((x) => x.level === mon.level + 1)?.experience ?? cur + 50;
    mon.xpNext = Math.max(1, next - cur);
  }
  updateHUD();
  await showBanner(`${mon.name} grew to Lv ${mon.level}!`);
  playSparkle("#playerSprite");
  await maybeEvolve(mon);
  save();
}

// Keep existing moves' PP where names match; append new learnset moves.
function mergeMoves(oldMoves, freshMoves) {
  const byKey = new Map(oldMoves.map((m) => [m.key, m]));
  const result = freshMoves.map((m) => {
    const prev = byKey.get(m.key);
    return prev ? { ...m, ppLeft: Math.min(prev.ppLeft, m.pp) } : m;
  });
  return result.length ? result : oldMoves;
}

async function maybeEvolve(mon) {
  if (!mon.evoChainUrl) return;
  const chain = await fetchEvo(mon.evoChainUrl);
  const find = (node) => {
    if (node.species.name.toLowerCase() === mon.name.toLowerCase()) return node;
    for (const c of node.evolves_to) {
      const r = find(c);
      if (r) return r;
    }
    return null;
  };
  const node = find(chain.chain);
  if (!node) return;
  const candidate = node.evolves_to?.find((e) =>
    e.evolution_details?.some((d) => (d.min_level || 0) <= mon.level && d.min_level)
  );
  if (!candidate) return;

  const data = await fetchPokemon(candidate.species.name);
  const species = await fetchSpecies(data.id);
  const evolved = makeMon(data, mon.level);
  evolved.moves = mergeMoves(mon.moves, await fetchMoveset(data, mon.level));
  await setupGrowthAndEvo(evolved, species);
  evolved.stats.hp = Math.max(1, Math.floor(evolved.stats.maxHp * (mon.stats.hp / mon.stats.maxHp)));
  evolved.xp = mon.xp;
  evolved.xpNext = mon.xpNext;
  evolved.status = mon.status;
  evolved.sprite = evolved.spriteBack || evolved.spriteFront;

  const oldName = mon.name;
  const idx = state.party.indexOf(mon);
  await flashWhite("#playerSprite");
  if (idx >= 0) {
    state.party[idx] = evolved;
    if (state.active === idx) state.player = evolved;
  }
  updateHUD();
  await showBanner(`${oldName} evolved into ${evolved.name}!`, 1400);
  await playCry(evolved);
}

// ---------------------------------------------------------------- HUD ------

function renderTypes(container, types) {
  container.innerHTML = "";
  types.forEach((t) => {
    const b = el("span", { class: "type-badge" }, t.toUpperCase());
    b.style.background = TYPE_COLOR[t] || "#888";
    container.appendChild(b);
  });
}
function renderStatus(pill, status) {
  const c = status?.cond;
  if (!c || c === "none") {
    pill.classList.add("hidden");
    return;
  }
  pill.classList.remove("hidden");
  pill.textContent = STATUS_LABEL[c] || c.toUpperCase();
  pill.style.background = STATUS_COLOR[c] || "#888";
}
function renderDots(container, list) {
  // list: array of booleans, true = healthy/alive
  container.innerHTML = "";
  list.forEach((alive) => {
    const i = el("i", {});
    if (!alive) i.classList.add("fainted");
    container.appendChild(i);
  });
}

function updateHUD() {
  const ps = $("#playerSprite"), es = $("#enemySprite");

  if (state.player) {
    const p = state.player;
    $("#playerName").textContent = p.name;
    $("#playerLevel").textContent = p.level;
    renderTypes($("#playerTypes"), p.types);
    renderStatus($("#playerStatus"), p.status);
    const pf = p.stats.hp / p.stats.maxHp;
    $("#playerHpText").textContent = `${p.stats.hp}/${p.stats.maxHp}`;
    const pFill = $("#playerHpFill");
    pFill.style.width = `${100 * pf}%`;
    pFill.style.background = hpColor(pf);
    if (p.xpNext) $("#playerXpFill").style.width = `${100 * clamp(p.xp / p.xpNext, 0, 1)}%`;
    renderDots($("#playerParty"), state.party.map((m) => m.stats.hp > 0));
    const pcard = $("#playerCard");
    if (pcard) pcard.style.setProperty("--type", TYPE_COLOR[p.types[0]] || "#888");
    if (ps && ps.dataset.src !== p.sprite) {
      ps.dataset.src = p.sprite;
      ps.src = p.sprite;
    }
  }

  if (state.enemy) {
    const e = state.enemy;
    $("#enemyName").textContent = (state.mode === "trainer" ? "" : "Wild ") + e.name;
    $("#enemyLevel").textContent = e.level;
    renderTypes($("#enemyTypes"), e.types);
    renderStatus($("#enemyStatus"), e.status);
    const ef = e.stats.hp / e.stats.maxHp;
    $("#enemyHpText").textContent = `${e.stats.hp}/${e.stats.maxHp}`;
    const eFill = $("#enemyHpFill");
    eFill.style.width = `${100 * ef}%`;
    eFill.style.background = hpColor(ef);
    if (state.mode === "trainer") {
      const dots = state.trainerTeam.map((_, i) =>
        i > state.trainerIdx ? true : i === state.trainerIdx ? e.stats.hp > 0 : false
      );
      renderDots($("#enemyParty"), dots);
    } else {
      renderDots($("#enemyParty"), [e.stats.hp > 0]);
    }
    const ecard = $("#enemyCard");
    if (ecard) ecard.style.setProperty("--type", TYPE_COLOR[e.types[0]] || "#888");
    if (es && es.dataset.src !== e.sprite) {
      es.dataset.src = e.sprite;
      es.src = e.sprite;
    }
  }
  updateScore();
}

function updateScore() {
  const w = $("#winCount"), m = $("#moneyCount"), bs = $("#badgeStrip");
  if (w) w.textContent = state.wins;
  if (m) m.textContent = state.money;
  if (bs) {
    bs.innerHTML = "";
    state.badges.forEach((b) => bs.appendChild(el("span", { class: "gym-badge" }, b)));
  }
}

// ---------------------------------------------------------------- FX -------

function ensureVfx() {
  return document.getElementById("vfx");
}
function floatTextNear(sel, txt, cls = "bad") {
  const host = $(".screen"), target = $(sel);
  if (!host || !target) return;
  const r = target.getBoundingClientRect(), h = host.getBoundingClientRect();
  const d = el("div", { class: "float " + cls }, txt);
  d.style.left = `${r.left - h.left + r.width * 0.55}px`;
  d.style.top = `${r.top - h.top - 6}px`;
  host.appendChild(d);
  requestAnimationFrame(() => d.classList.add("show"));
  setTimeout(() => d.remove(), 900);
}
function spawnSparksAt(sel, type = "normal", count = 10) {
  const host = ensureVfx(), tgt = $(sel);
  if (!host || !tgt) return;
  const r = tgt.getBoundingClientRect(), h = host.getBoundingClientRect();
  const cx = r.left - h.left + r.width * 0.55, cy = r.top - h.top + r.height * 0.45;
  for (let i = 0; i < count; i++) {
    const s = el("div", { class: "spark" });
    s.style.color = TYPE_COLOR[type] || "#fff";
    const ang = Math.random() * Math.PI * 2;
    const d0 = 4 + Math.random() * 8, d1 = 26 + Math.random() * 22;
    s.style.left = cx + "px"; s.style.top = cy + "px";
    s.style.setProperty("--sx", Math.cos(ang) * d0 + "px");
    s.style.setProperty("--sy", Math.sin(ang) * d0 + "px");
    s.style.setProperty("--ex", Math.cos(ang) * d1 + "px");
    s.style.setProperty("--ey", Math.sin(ang) * d1 + "px");
    host.appendChild(s);
    setTimeout(() => s.remove(), 420);
  }
}
function showBadgeNear(sel, txt, kind = "") {
  const host = ensureVfx(), tgt = $(sel);
  if (!host || !tgt) return;
  const r = tgt.getBoundingClientRect(), h = host.getBoundingClientRect();
  const b = el("div", { class: "badge " + kind }, txt);
  b.style.left = `${r.left - h.left + r.width * 0.5}px`;
  b.style.top = `${r.top - h.top - 8}px`;
  host.appendChild(b);
  setTimeout(() => b.remove(), 900);
}
function screenShake(kind = "hit") {
  const root = $(".screen");
  if (!root) return;
  const cls = kind === "crit" ? "shake-crit" : "shake-hit";
  root.classList.add(cls);
  setTimeout(() => root.classList.remove(cls), kind === "crit" ? 400 : 160);
}
async function lunge(sel, towardRight) {
  const node = $(sel);
  if (!node) return;
  const dx = (towardRight ? 1 : -1) * 26;
  try {
    await node.animate(
      [
        { transform: "translate(0,0)" },
        { transform: `translate(${dx}px,-6px)`, offset: 0.4 },
        { transform: "translate(0,0)" },
      ],
      { duration: 240, easing: "ease-out" }
    ).finished;
  } catch (_) {}
}
function impactSprite(sel, crit, towardRight) {
  const node = $(sel);
  if (!node) return;
  const rot = (towardRight ? -1 : 1) * (crit ? 10 : 6);
  const dx = (towardRight ? 8 : -8) * (crit ? 1.5 : 1);
  node.animate(
    [
      { transform: "translate(0,0) rotate(0) scale(1)", filter: "brightness(2) saturate(0)" },
      { transform: `translate(${dx}px,-2px) rotate(${rot}deg) scale(${crit ? 1.06 : 1.02})`, filter: "brightness(1.3)", offset: 0.35 },
      { transform: "translate(0,0) rotate(0) scale(1)", filter: "none" },
    ],
    { duration: crit ? 380 : 220, easing: "cubic-bezier(.2,.8,.2,1)" }
  );
}
function playSparkle(sel) {
  spawnSparksAt(sel, "electric", 16);
}
function flashWhite(sel) {
  const node = $(sel);
  if (!node) return Promise.resolve();
  return node.animate(
    [{ filter: "brightness(1)" }, { filter: "brightness(4) saturate(0)" }, { filter: "brightness(1)" }],
    { duration: 700, iterations: 1 }
  ).finished.catch(() => {});
}
function faintOut(sel) {
  const node = $(sel);
  if (!node) return Promise.resolve();
  return node.animate(
    [
      { filter: "none", opacity: 1, transform: "translateY(0) scale(1)" },
      { filter: "brightness(2) saturate(0)", opacity: 0.9, transform: "translateY(4px) scale(.98)", offset: 0.4 },
      { filter: "brightness(2) saturate(0)", opacity: 0, transform: "translateY(16px) scale(.9)" },
    ],
    { duration: 650, easing: "ease-in" }
  ).finished.then(() => { node.style.opacity = "0"; }).catch(() => {});
}
async function fadeInSprite(sel) {
  const node = $(sel);
  if (!node) return;
  node.style.transform = "none";
  node.style.opacity = 0;
  try {
    await node.animate([{ opacity: 0, transform: "translateY(-10px) scale(.9)" }, { opacity: 1, transform: "translateY(0) scale(1)" }], { duration: 320, easing: "ease-out" }).finished;
  } catch (_) {}
  node.style.opacity = 1;
}

const bannerHold = { t: 0 };
async function showBanner(txt, ms = 1100) {
  const b = $("#banner");
  if (!b) return;
  b.textContent = txt;
  b.classList.remove("hidden");
  const token = ++bannerHold.t;
  await sleep(ms);
  if (token === bannerHold.t) b.classList.add("hidden");
}

const THEMES = ["normal","fire","water","grass","electric","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon"];
function setThemeByType(types) {
  const t = (types && types[0]) || "normal";
  const scr = $(".screen");
  if (!scr) return;
  THEMES.forEach((x) => scr.classList.remove("type-" + x));
  scr.classList.add("type-" + t);
  scr.style.setProperty("--type", TYPE_COLOR[t] || "#888");
  try { ThemeFX.set(t); } catch (_) {}
}

// ---- Poké Ball throw canvas (kept, cleaned) ----
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
  const clear = () => ctx.clearRect(0, 0, canvas.width, canvas.height);
  let ballPromise;
  async function ball() {
    if (ballPromise) return ballPromise;
    ballPromise = (async () => {
      try {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.src = ITEM_ICON("poke-ball");
        await new Promise((r) => { im.onload = r; im.onerror = r; });
        return im.width ? im : null;
      } catch (_) { return null; }
    })();
    return ballPromise;
  }
  async function throwAndWobble(sx, sy, tx, ty, onHit) {
    if (!isMuted) { try { new Audio("assets/sfx/battle/attack.wav").play(); } catch (_) {} }
    const r = 30;
    const arc = clamp(Math.hypot(tx - sx, ty - sy) * 0.25, cssNum("--ball-arc-min", 60), cssNum("--ball-arc-max", 140));
    const img = await ball();
    for (let t = 0; t <= 1.001; t += 0.02) {
      const cx = (sx + tx) / 2, cy = Math.max(30, Math.min(sy, ty) - arc);
      const x = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * tx;
      const y = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ty;
      clear(); ctx.save(); ctx.translate(x, y); ctx.rotate(t * 4);
      if (img) ctx.drawImage(img, -r, -r, r * 2, r * 2);
      ctx.restore();
      await sleep(16);
    }
    if (typeof onHit === "function") onHit();
    async function wobble() {
      for (let a = 0; a < 1; a += 0.1) {
        clear(); ctx.save(); ctx.translate(tx, ty);
        ctx.rotate(Math.sin(a * Math.PI * 2) * 0.35);
        if (img) ctx.drawImage(img, -r, -r, r * 2, r * 2);
        ctx.restore();
        await sleep(30);
      }
    }
    await wobble();
    return {
      async shake(times) { for (let i = 0; i < times; i++) { await wobble(); await sleep(160); } },
      clear,
    };
  }
  return { throwAndWobble, clear };
})();

// ---- ambient theme particles (kept, retuned) ----
const ThemeFX = (() => {
  const layer = document.getElementById("themefx");
  if (!layer) return { set: () => {} };
  let current = "";
  const intensity = 1;
  const CONFIG = {
    normal: { kind: "mote", count: 14, size: [4, 10], dur: [12, 18], blur: [0, 1] },
    fire: { kind: "ember", count: 20, size: [5, 12], dur: [10, 15], blur: [0, 1] },
    water: { kind: "bubble", count: 16, size: [6, 14], dur: [12, 18], blur: [0, 0] },
    grass: { kind: "leaf", count: 14, size: [8, 14], dur: [12, 18], blur: [0, 0] },
    electric: { kind: "spark", count: 12, size: [10, 16], dur: [8, 12], blur: [0, 0] },
    ice: { kind: "snow", count: 22, size: [4, 8], dur: [12, 20], blur: [0, 0.5] },
    fighting: { kind: "mote", count: 10, size: [4, 10], dur: [10, 16], blur: [0, 0] },
    poison: { kind: "fume", count: 12, size: [18, 28], dur: [14, 22], blur: [4, 8] },
    ground: { kind: "dust", count: 14, size: [6, 12], dur: [12, 18], blur: [1, 3] },
    flying: { kind: "feather", count: 9, size: [10, 18], dur: [16, 22], blur: [0, 0] },
    psychic: { kind: "orb", count: 9, size: [10, 16], dur: [10, 16], blur: [0, 0] },
    bug: { kind: "spore", count: 14, size: [5, 10], dur: [12, 18], blur: [0, 1] },
    rock: { kind: "grit", count: 12, size: [5, 8], dur: [10, 16], blur: [0, 0] },
    ghost: { kind: "wisp", count: 9, size: [16, 26], dur: [16, 22], blur: [4, 8] },
    dragon: { kind: "star", count: 12, size: [4, 8], dur: [16, 24], blur: [0, 0] },
  };
  const rand = (a, b) => a + Math.random() * (b - a);
  function spawn(kind, conf) {
    const p = el("div", { class: "p " + kind });
    const durNum = rand(conf.dur[0], conf.dur[1]);
    p.style.setProperty("--x", rand(5, 95).toFixed(2));
    p.style.setProperty("--size", `${Math.round(rand(conf.size[0], conf.size[1]))}px`);
    p.style.setProperty("--dur", `${durNum.toFixed(2)}s`);
    p.style.setProperty("--delay", `${(-rand(0, durNum)).toFixed(2)}s`);
    p.style.setProperty("--dx", `${(Math.random() < 0.5 ? -1 : 1) * rand(4, 26)}px`);
    p.style.setProperty("--blur", rand(conf.blur[0], conf.blur[1]).toFixed(1));
    if (kind === "orb") {
      p.style.setProperty("--r", `${Math.round(rand(50, 120))}px`);
      p.style.setProperty("--delay", `${rand(0, 6).toFixed(2)}s`);
    }
    layer.appendChild(p);
  }
  function set(type) {
    type = type || "normal";
    if (type === current) return;
    current = type;
    layer.innerHTML = "";
    const conf = CONFIG[type] || CONFIG.normal;
    const n = Math.round(conf.count * intensity);
    for (let i = 0; i < n; i++) spawn(conf.kind, conf);
  }
  set("normal");
  return { set };
})();

// ---------------------------------------------------------------- combat ---

function labelFor(mon, isEnemy) {
  return (isEnemy && state.mode !== "trainer" ? "Wild " : "") + mon.name;
}

// Resolve one combatant's move with full animation. Returns { acted, defenderFainted, result }.
async function performMove(attacker, defender, move, attackerIsPlayer) {
  const aSel = attackerIsPlayer ? "#playerSprite" : "#enemySprite";
  const dSel = attackerIsPlayer ? "#enemySprite" : "#playerSprite";
  const towardRight = attackerIsPlayer; // player is bottom-left, enemy top-right

  const act = canAct(attacker);
  if (act.message) { await say(act.message, 200); }
  if (!act.canAct) return { acted: false, defenderFainted: false };

  if (move.ppLeft <= 0) move = { ...STRUGGLE };
  else move.ppLeft = Math.max(0, move.ppLeft - 1);

  await say(`${attackerIsPlayer ? "" : (state.mode === "trainer" ? "Foe " : "The wild ")}${attacker.name} used ${move.name}!`, 120);
  renderMovesIfOpen();

  if (move.power > 0) { playSfx(move); await lunge(aSel, towardRight); }
  else { playSfx(move); }

  const res = useMove(attacker, defender, move);

  // Damage & effect visuals.
  if (res.missed) {
    await say(res.log[0] || "But it missed!");
    return { acted: true, defenderFainted: false, result: res };
  }
  if (res.immune) {
    await say(res.log[0] || `It doesn't affect ${defender.name}...`);
    return { acted: true, defenderFainted: false, result: res };
  }

  if (res.hits.length) {
    const crit = res.hits.some((h) => h.crit);
    impactSprite(dSel, crit, towardRight);
    spawnSparksAt(dSel, move.type, crit ? 16 : 10);
    if (!attackerIsPlayer) screenShake(crit ? "crit" : "hit");
    updateHUD();
    const dmgTxt = `-${res.totalDmg}`;
    floatTextNear(dSel, dmgTxt, crit ? "crit" : "bad");
    if (crit) { await say("A critical hit!"); }
    const eff = res.effMult;
    if (eff !== undefined && eff !== 1) {
      const t = effText(eff);
      if (t) { showBadgeNear(dSel, eff > 1 ? "SUPER" : "RESIST", eff > 1 ? "super" : "weak"); await say(t); }
    }
  }
  if (res.drain > 0) { updateHUD(); floatTextNear(aSel, `+${res.drain}`, "good"); }
  if (res.recoil > 0) { updateHUD(); floatTextNear(aSel, `-${res.recoil}`, "bad"); }
  if (res.healed > 0) { updateHUD(); floatTextNear(aSel, `+${res.healed}`, "good"); }

  // Follow-up log lines (status applied, stat changes, etc.).
  for (const line of res.log) {
    if (/used |missed|doesn't affect|drained|recoil|regained|Hit /.test(line)) continue;
    await say(line);
  }
  updateHUD();
  return { acted: true, defenderFainted: res.targetFainted, result: res };
}

// A full fight round with speed-based ordering.
async function fightRound(playerMove) {
  setBusy(true);
  show("none");
  const eIdx = chooseAIMove(state.enemy, state.player);
  const enemyMove = state.enemy.moves[eIdx] || { ...STRUGGLE };

  const playerFirst = firstMover(state.player, playerMove, state.enemy, enemyMove) === "a";
  const order = playerFirst
    ? [["p", playerMove], ["e", enemyMove]]
    : [["e", enemyMove], ["p", playerMove]];

  const flinch = { p: false, e: false };
  for (const [who, move] of order) {
    if (state.player.stats.hp <= 0 || state.enemy.stats.hp <= 0) break;
    if (who === "p") {
      if (flinch.p) { await say(`${state.player.name} flinched and couldn't move!`); continue; }
      const r = await performMove(state.player, state.enemy, move, true);
      if (r.result && r.result.flinch) flinch.e = true;
      if (state.enemy.stats.hp <= 0) return onEnemyFaint();
    } else {
      if (flinch.e) { await say(`Foe ${state.enemy.name} flinched!`); continue; }
      const r = await performMove(state.enemy, state.player, move, false);
      if (r.result && r.result.flinch) flinch.p = true;
      if (state.player.stats.hp <= 0) return onPlayerFaint();
    }
  }

  if (await residualPhase()) return; // someone fainted
  await backToMenu();
}

// Enemy takes a free turn after the player used a non-attacking action.
async function enemyFreeTurn() {
  const eIdx = chooseAIMove(state.enemy, state.player);
  const enemyMove = state.enemy.moves[eIdx] || { ...STRUGGLE };
  await performMove(state.enemy, state.player, enemyMove, false);
  if (state.player.stats.hp <= 0) return onPlayerFaint();
  if (await residualPhase()) return;
  await backToMenu();
}

// End-of-turn burn/poison ticks. Returns true if the battle ended/transitioned.
async function residualPhase() {
  for (const [mon, sel, isEnemy] of [
    [state.player, "#playerSprite", false],
    [state.enemy, "#enemySprite", true],
  ]) {
    if (!mon || mon.stats.hp <= 0) continue;
    const r = endOfTurn(mon);
    if (r && r.dmg) {
      updateHUD();
      floatTextNear(sel, `-${r.dmg}`, "bad");
      await say(`${mon.name} is hurt by its ${r.kind === "brn" ? "burn" : "poison"}!`);
      if (r.fainted) {
        if (isEnemy) { await onEnemyFaint(); return true; }
        await onPlayerFaint(); return true;
      }
    }
  }
  return false;
}

async function backToMenu() {
  show("menu");
  await say("What will you do?", 0);
  setBusy(false);
  maybeAuto();
}

// ---- faints & transitions ----

function xpFor(enemy) {
  const base = Math.max(1, Math.floor(((enemy.base_exp || 64) * enemy.level) / 7));
  return state.mode === "trainer" ? Math.floor(base * 1.5) : base;
}

async function onEnemyFaint() {
  await playCry(state.enemy);
  await faintOut("#enemySprite");
  await say(`${labelFor(state.enemy, true)} fainted!`);
  await gainXP(state.player, xpFor(state.enemy));

  if (state.mode === "trainer") {
    state.trainerIdx++;
    if (state.trainerIdx < state.trainerTeam.length) {
      await sleep(400);
      await sendTrainerMon(state.trainerIdx);
      await backToMenu();
      return;
    }
    await onTrainerDefeated();
    return;
  }

  state.wins++;
  maybeAwardDrops();
  updateScore();
  save();
  await sleep(500);
  await startEncounter();
  setBusy(false);
}

async function onPlayerFaint() {
  await playCry(state.player);
  await faintOut("#playerSprite");
  await say(`${state.player.name} fainted!`);
  const healthyIdx = state.party
    .map((m, i) => ({ m, i }))
    .filter(({ m, i }) => m.stats.hp > 0 && i !== state.active)
    .map(({ i }) => i);
  if (healthyIdx.length) {
    if (state.auto) {
      // Auto-play picks its own replacement so battles keep flowing.
      const cur = battleScore(state.player, state.enemy);
      const pick = bestSwitch(state.party, state.active, state.enemy, 0, 0) ?? healthyIdx[0];
      await say("Choose your next Pokémon!");
      await swapTo(pick, true);
      return;
    }
    await say("Choose your next Pokémon!");
    renderParty(true);
    show("swap");
    setBusy(false);
    return;
  }
  // Whiteout.
  await say("You have no Pokémon left to fight...", 400);
  await say("You scurry back to the Pokémon Center.");
  state.party.forEach((m) => {
    m.stats.hp = m.stats.maxHp;
    m.status = { cond: "none", turns: 0, toxic: 0 };
    resetStages(m);
    m.moves.forEach((mv) => (mv.ppLeft = mv.pp));
  });
  state.money = Math.max(0, Math.floor(state.money * 0.5));
  state.mode = "wild";
  state.trainer = null;
  state.wins = Math.max(0, state.wins - 1);
  setActive(0);
  save();
  await sleep(700);
  await startEncounter();
  setBusy(false);
}

// ---- encounters ----

function wildLevel() {
  return clamp(4 + Math.floor(state.wins / 2.5), 4, 55);
}

async function startEncounter() {
  resetStages(state.player);

  // Trainer milestone?
  if (state.mode !== "trainer" &&
      state.trainersBeaten < TRAINERS.length &&
      state.wins >= (state.trainersBeaten + 1) * TRAINER_EVERY) {
    return startTrainerBattle(TRAINERS[state.trainersBeaten]);
  }

  state.mode = "wild";
  state.trainer = null;
  state.trainerTeam = [];
  show("menu");

  const level = wildLevel();
  let mon = null, poke = null;
  for (let tries = 0; tries < 12; tries++) {
    const eid = 1 + Math.floor(Math.random() * GEN1_MAX_ID);
    if (eid >= 144 && eid <= 151) continue; // no legendaries in the wild
    poke = await fetchPokemon(eid);
    const bst = poke.stats.reduce((a, s) => a + s.base_stat, 0);
    if (bst <= 360 || tries > 8) {
      mon = makeMon(poke, level);
      const species = await fetchSpecies(poke.id);
      mon.capture_rate = species.capture_rate;
      break;
    }
  }
  mon.moves = await fetchMoveset(poke, mon.level);
  if (!mon.moves.length) mon.moves = [{ ...STRUGGLE, name: "Tackle", key: "tackle", power: 40, pp: 35, ppLeft: 35, drain: 0 }];

  state.enemy = mon;
  updateHUD();
  setThemeByType(mon.types);
  await fadeInSprite("#enemySprite");
  await say(`A wild ${mon.name} appeared!`);
  await playCry(mon);
  await backToMenu();
}

async function startTrainerBattle(trainer) {
  state.mode = "trainer";
  state.trainer = trainer;
  state.trainerIdx = 0;
  setBusy(true);
  show("none");
  const base = wildLevel();
  state.trainerTeam = [];
  for (let i = 0; i < trainer.team.length; i++) {
    const lvl = clamp(base + 1 + i, 4, 60);
    const mon = await buildMon(trainer.team[i], lvl);
    state.trainerTeam.push(mon);
  }
  await say(trainer.intro, 500);
  await sendTrainerMon(0);
  await backToMenu();
}

async function sendTrainerMon(idx) {
  const mon = state.trainerTeam[idx];
  ensureRuntime(mon);
  state.enemy = mon;
  updateHUD();
  setThemeByType(mon.types);
  await fadeInSprite("#enemySprite");
  await say(`${state.trainer.title} sent out ${mon.name}!`);
  await playCry(mon);
}

async function onTrainerDefeated() {
  const t = state.trainer;
  await say(`You defeated ${t.name}!`, 500);
  const r = t.reward || {};
  if (r.money) { state.money += r.money; await say(`You got ₽${r.money} for winning!`); }
  if (r.balls) state.items["poke-ball"] += r.balls;
  if (r.potions) state.items["potion"] += r.potions;
  if (r.hyperPotions) state.items["hyper-potion"] += r.hyperPotions;
  if (t.badge && !state.badges.includes(t.badge)) {
    state.badges.push(t.badge);
    await showBanner(`You earned the ${t.badge} Badge!`, 1500);
  }
  state.trainersBeaten++;
  state.wins++;
  state.mode = "wild";
  state.trainer = null;
  state.trainerTeam = [];
  updateScore();
  save();
  await sleep(500);
  await startEncounter();
  setBusy(false);
}

function maybeAwardDrops() {
  if (Math.random() < 0.22) {
    const g = Math.random() < 0.5 ? 1 : 2;
    state.items["poke-ball"] += g;
    floatToast(`Found ${g} Poké Ball${g > 1 ? "s" : ""}!`);
  }
  if (Math.random() < 0.12) {
    const r = Math.random();
    const key = r < 0.6 ? "potion" : r < 0.9 ? "super-potion" : "hyper-potion";
    state.items[key]++;
  }
  if (Math.random() < 0.1) state.money += 20 + Math.floor(Math.random() * 40);
}
function floatToast(txt) {
  // Non-blocking little note in the banner slot.
  showBanner(txt, 900);
}

// ---------------------------------------------------------------- menus ----

function renderMovesIfOpen() {
  if (!$("#movesView").classList.contains("hidden")) renderMoves();
}
function renderMoves() {
  const grid = $("#movesGrid");
  grid.innerHTML = "";
  state.player.moves.forEach((mv, idx) => {
    const btn = el("button", { class: "move-btn" });
    btn.style.setProperty("--mtype", TYPE_COLOR[mv.type] || "#666");
    if (mv.ppLeft <= mv.pp * 0.25) btn.classList.add("low-pp");
    btn.disabled = mv.ppLeft <= 0 || state.busy;
    const kind = mv.power > 0 ? `Pow ${mv.power}` : cap(mv.category.replace(/-/g, " "));
    btn.innerHTML =
      `<span class="mv-name">${mv.name}</span>` +
      `<span class="mv-meta"><span>${cap(mv.type)}</span><span>${kind}</span>` +
      `<span class="mv-pp">PP ${mv.ppLeft}/${mv.pp}</span></span>`;
    btn.addEventListener("click", () => onChooseMove(idx));
    grid.appendChild(btn);
  });
}
function onChooseMove(idx) {
  if (state.busy) return;
  const mv = state.player.moves[idx];
  if (!mv || mv.ppLeft <= 0) return;
  fightRound(mv);
}

function renderParty(forcedSwitch = false) {
  const list = $("#partyList");
  list.innerHTML = "";
  state.party.forEach((m, idx) => {
    const f = m.stats.hp / m.stats.maxHp;
    const item = el("div", { class: "party-item" });
    if (idx === state.active) item.classList.add("active-mon");
    if (m.stats.hp <= 0) item.classList.add("fainted");
    const main = el("div", { class: "p-main" });
    main.appendChild(el("img", { src: m.spriteFront || m.artwork, alt: m.name }));
    const info = el("div", { class: "p-info" });
    info.appendChild(el("div", { class: "p-name" }, `${idx === state.active ? "★ " : ""}${m.name}`));
    info.appendChild(el("div", { class: "small" }, `Lv ${m.level} · ${m.stats.hp}/${m.stats.maxHp} HP${m.status.cond !== "none" ? " · " + (STATUS_LABEL[m.status.cond] || "") : ""}`));
    const mini = el("div", { class: "mini-hp" });
    const miniFill = el("i", {});
    miniFill.style.width = `${100 * f}%`;
    miniFill.style.background = hpColor(f);
    mini.appendChild(miniFill);
    info.appendChild(mini);
    main.appendChild(info);
    item.appendChild(main);
    const btn = el("button", { class: "use-btn" }, idx === state.active ? "Active" : "Switch");
    btn.disabled = idx === state.active || m.stats.hp <= 0 || state.busy;
    btn.addEventListener("click", () => swapTo(idx, forcedSwitch));
    item.appendChild(btn);
    list.appendChild(item);
  });
}

async function swapTo(idx, forced = false) {
  if (state.busy && !forced) return;
  if (idx === state.active) return;
  setBusy(true);
  const from = state.player, to = state.party[idx];
  await say(`${from.name}, come back!`);
  await faintOut("#playerSprite").catch(() => {});
  setActive(idx);
  await fadeInSprite("#playerSprite");
  await say(`Go, ${to.name}!`);
  await playCry(to);
  save();
  if (forced) {
    // Fainted-switch: enemy already had its turn this round.
    await backToMenu();
  } else {
    await enemyFreeTurn();
  }
}

// ---- bag ----

function openBag() {
  if (state.busy) return;
  const box = $("#msgBox");
  let view = $("#bagView");
  if (!view) { view = el("div", { id: "bagView", class: "panel hidden" }); box.appendChild(view); }
  view.innerHTML = "";
  const head = el("div", { class: "panel-head" });
  head.appendChild(el("h3", {}, "Bag"));
  const back = el("button", { class: "small ghost" }, "◂ Back");
  back.onclick = async () => { show("menu"); await say("What will you do?", 0); };
  head.appendChild(back);
  view.appendChild(head);
  const grid = el("div", { class: "bag-grid" });
  const balls = state.mode === "trainer";
  const item = (key, label, action) => {
    const count = state.items[key] || 0;
    const c = el("div", { class: "bag-item" });
    const top = el("div", { class: "bag-top" });
    top.appendChild(el("img", { src: ITEM_ICON(key), alt: key }));
    top.appendChild(el("div", { class: "small" }, label));
    c.appendChild(top);
    c.appendChild(el("div", { class: "bag-count" }, `x${count}`));
    const btn = el("button", { class: "use-btn" }, action === "ball" ? "Throw" : "Use");
    btn.disabled = count <= 0 || state.busy || (action === "ball" && balls);
    btn.onclick = () => {
      if (action === "ball") throwBall(key);
      else if (["potion", "super-potion", "hyper-potion"].includes(key)) usePotionKey(key);
      else useCureKey(key);
    };
    c.appendChild(btn);
    grid.appendChild(c);
  };
  item("poke-ball", "Poké Ball", "ball");
  item("great-ball", "Great Ball", "ball");
  item("ultra-ball", "Ultra Ball", "ball");
  item("potion", "Potion");
  item("super-potion", "Super Potion");
  item("hyper-potion", "Hyper Potion");
  item("antidote", "Antidote");
  item("parlyz-heal", "Parlyz Heal");
  item("awakening", "Awakening");
  item("burn-heal", "Burn Heal");
  item("ice-heal", "Ice Heal");
  view.appendChild(grid);
  show("bag");
  say(balls ? "Choose an item. (You can't catch a trainer's Pokémon!)" : "Choose an item.", 0);
}

const POTION_HEAL = { potion: 20, "super-potion": 50, "hyper-potion": 200 };
async function usePotionKey(key) {
  if (state.busy) return;
  const heal = POTION_HEAL[key];
  if (!heal || state.items[key] <= 0) return;
  if (state.player.stats.hp >= state.player.stats.maxHp) { await say("It won't have any effect..."); return; }
  setBusy(true);
  const got = Math.min(heal, state.player.stats.maxHp - state.player.stats.hp);
  state.player.stats.hp += got;
  state.items[key]--;
  updateHUD();
  floatTextNear("#playerSprite", `+${got}`, "good");
  await say(`Used ${cap(key.replace(/-/g, " "))}! Restored ${got} HP.`);
  save();
  await enemyFreeTurn();
}

const CURE_MAP = { antidote: "psn", "parlyz-heal": "par", awakening: "slp", "burn-heal": "brn", "ice-heal": "frz" };
async function useCureKey(key) {
  if (state.busy) return;
  if (state.items[key] <= 0) return;
  const target = CURE_MAP[key];
  const cur = state.player.status.cond;
  const matches = target === cur || (key === "antidote" && cur === "tox");
  if (!matches) { await say("It had no effect."); return; }
  setBusy(true);
  state.items[key]--;
  state.player.status = { cond: "none", turns: 0, toxic: 0 };
  updateHUD();
  await say(`${cap(key.replace(/-/g, " "))} cured the status!`);
  save();
  await enemyFreeTurn();
}

const BALL_BONUS = { "poke-ball": 1, "great-ball": 1.5, "ultra-ball": 2 };
async function throwBall(key = "poke-ball") {
  if (state.busy) return;
  if (state.mode === "trainer") { await say("You can't catch a trainer's Pokémon!"); return; }
  if ((state.items[key] || 0) <= 0) { await say("None left!"); return; }
  setBusy(true);
  show("none");
  state.items[key]--;
  await say(`You threw a ${cap(key.replace(/-/g, " "))}!`, 120);

  const canvas = $("#fxCanvas");
  const cRect = canvas.getBoundingClientRect();
  const eRect = $(".enemy .plate").getBoundingClientRect();
  const pRect = $(".player .plate").getBoundingClientRect();
  const sx = 40, sy = pRect.top + pRect.height * 0.1 - cRect.top;
  const tx = eRect.left + eRect.width * 0.5 - cRect.left, ty = eRect.top + eRect.height * 0.1 - cRect.top;
  const enemyImg = $("#enemySprite");
  try {
    const handle = await fx.throwAndWobble(sx, sy, tx, ty, () => { enemyImg.style.opacity = "0"; });
    const success = catchSuccess(state.enemy, BALL_BONUS[key] || 1);
    await handle.shake(success ? 3 : Math.floor(Math.random() * 2) + 1);
    if (success) {
      handle.clear();
      await say(`Gotcha! ${state.enemy.name} was caught!`, 400);
      const mon = await buildMon(state.enemy.id, state.enemy.level);
      mon.stats.hp = state.enemy.stats.hp;
      mon.status = state.enemy.status;
      mon.sprite = mon.spriteFront;
      if (state.party.length < 6) state.party.push(mon);
      else { state.box.push(mon); await say(`${mon.name} was sent to the PC Box!`); }
      maybeAwardDrops();
      state.wins++;
      updateScore();
      save();
      await sleep(700);
      await startEncounter();
      setBusy(false);
    } else {
      handle.clear();
      enemyImg.style.opacity = "1";
      await fadeInSprite("#enemySprite");
      await say(`Oh no! ${state.enemy.name} broke free!`);
      await enemyFreeTurn();
    }
  } catch (err) {
    console.error("Ball FX error:", err);
    enemyImg.style.opacity = "1";
    await say("The ball fizzled...");
    setBusy(false);
  }
}

// ---------------------------------------------------------------- box ------

function openBox() {
  if (state.busy) return;
  const box = $("#msgBox");
  let view = $("#boxView");
  if (!view) { view = el("div", { id: "boxView", class: "panel hidden" }); box.appendChild(view); }
  view.innerHTML = "";
  const head = el("div", { class: "panel-head" });
  head.appendChild(el("h3", {}, `PC Box — ${state.box.length}`));
  const back = el("button", { class: "small ghost" }, "◂ Back");
  back.onclick = () => show("swap");
  head.appendChild(back);
  view.appendChild(head);
  const grid = el("div", { class: "box-grid" });
  if (!state.box.length) grid.appendChild(el("div", { class: "small" }, "The Box is empty."));
  state.box.forEach((m, idx) => {
    const c = el("div", { class: "box-item" });
    const main = el("div", { class: "p-main" });
    main.appendChild(el("img", { src: m.spriteFront || m.artwork, alt: m.name }));
    main.appendChild(el("div", { class: "p-info" }, ""));
    main.lastChild.appendChild(el("div", { class: "p-name" }, m.name));
    main.lastChild.appendChild(el("div", { class: "small" }, `Lv ${m.level}`));
    c.appendChild(main);
    const b = el("button", { class: "use-btn" }, state.party.length < 6 ? "Withdraw" : "Swap");
    b.onclick = () => {
      if (state.party.length < 6) {
        state.party.push(m);
        state.box.splice(idx, 1);
      } else {
        const old = state.party[state.active];
        state.party[state.active] = m;
        state.box[idx] = old;
        setActive(state.active);
      }
      save();
      renderParty();
      openBox();
    };
    c.appendChild(b);
    grid.appendChild(c);
  });
  view.appendChild(grid);
  show("box");
}

// ---------------------------------------------------------------- auto -----

function hasPotion() {
  return state.items.potion > 0 || state.items["super-potion"] > 0 || state.items["hyper-potion"] > 0;
}
function bestPotion() {
  const need = state.player.stats.maxHp - state.player.stats.hp;
  if (need <= 0) return null;
  const opts = [{ k: "potion", h: 20 }, { k: "super-potion", h: 50 }, { k: "hyper-potion", h: 200 }];
  for (const o of opts) if (state.items[o.k] > 0 && need <= o.h) return o.k;
  for (const o of opts.slice().reverse()) if (state.items[o.k] > 0) return o.k;
  return null;
}

async function maybeAuto() {
  if (!state.auto || state.busy || !state.started) return;
  if (!state.player || !state.enemy || state.player.stats.hp <= 0) return;
  await sleep(420);
  if (state.busy || state.player.stats.hp <= 0) return;
  const hpF = state.player.stats.hp / state.player.stats.maxHp;
  const enemyHpF = state.enemy.stats.hp / state.enemy.stats.maxHp;

  if (hpF < 0.35 && hasPotion()) { const k = bestPotion(); if (k) return usePotionKey(k); }

  if (state.mode !== "trainer" && (state.items["poke-ball"] || 0) > 0 &&
      (enemyHpF < 0.28 || ["slp", "frz", "par"].includes(state.enemy.status.cond))) {
    return throwBall("poke-ball");
  }

  const cur = battleScore(state.player, state.enemy);
  if (hpF < 0.3) {
    const s = bestSwitch(state.party, state.active, state.enemy, cur, 1.1);
    if (s != null) return swapTo(s);
  }
  const better = bestSwitch(state.party, state.active, state.enemy, cur, 1.5);
  if (better != null) return swapTo(better);

  const idx = bestMoveIndex(state.player, state.enemy);
  if (idx != null) return fightRound(state.player.moves[idx]);

  if (state.mode === "trainer") { const m = state.player.moves[0]; if (m) return fightRound(m); }
  await say("Got away safely!");
  await sleep(300);
  await startEncounter();
}

// ---------------------------------------------------------------- save -----

function save() {
  try {
    const data = {
      party: state.party, box: state.box, active: state.active,
      items: state.items, money: state.money, wins: state.wins,
      badges: state.badges, trainersBeaten: state.trainersBeaten, v: 2,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (_) {}
}
function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (_) { return false; }
}
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d.party || !d.party.length) return false;
    state.party = d.party.map(ensureRuntime);
    state.box = (d.box || []).map(ensureRuntime);
    state.active = clamp(d.active || 0, 0, state.party.length - 1);
    state.items = Object.assign(state.items, d.items || {});
    state.money = d.money || 0;
    state.wins = d.wins || 0;
    state.badges = d.badges || [];
    state.trainersBeaten = d.trainersBeaten || 0;
    return true;
  } catch (_) { return false; }
}

// ---------------------------------------------------------------- flow -----

async function chooseStarter(id) {
  setBusy(true);
  const mon = await buildMon(id, 5);
  mon.sprite = mon.spriteBack || mon.spriteFront;
  state.party = [mon];
  state.box = [];
  state.wins = 0;
  state.money = 500;
  state.badges = [];
  state.trainersBeaten = 0;
  state.mode = "wild";
  setActive(0);
  await fadeInSprite("#playerSprite");
  await say(`You chose ${mon.name}! Your journey begins.`, 500);
  await playCry(mon);
  save();
  await startEncounter();
  setBusy(false);
}

function showStarterPicker() {
  const box = $("#msgBox");
  let view = $("#starterView");
  if (!view) {
    view = el("div", { id: "starterView", class: "panel" });
    box.appendChild(view);
  }
  view.innerHTML = "";
  view.appendChild(el("div", { class: "panel-head" }, ""));
  view.firstChild.appendChild(el("h3", {}, "Choose your partner"));
  const grid = el("div", { class: "moves-grid" });
  const starters = [
    { id: 1, name: "Bulbasaur", type: "grass" },
    { id: 4, name: "Charmander", type: "fire" },
    { id: 7, name: "Squirtle", type: "water" },
  ];
  starters.forEach((s) => {
    const b = el("button", { class: "move-btn" });
    b.style.setProperty("--mtype", TYPE_COLOR[s.type]);
    b.innerHTML = `<span class="mv-name">${s.name}</span><span class="mv-meta"><span>${cap(s.type)} type</span></span>`;
    b.onclick = () => { view.remove(); chooseStarter(s.id); };
    grid.appendChild(b);
  });
  view.appendChild(grid);
  ["#menu", "#movesView", "#swapView"].forEach((sel) => $(sel) && $(sel).classList.add("hidden"));
}

async function beginNewGame() {
  try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
  state.party = []; state.box = []; state.wins = 0; state.badges = [];
  state.trainersBeaten = 0; state.money = 0; state.mode = "wild";
  hideTitle();
  state.started = true;
  updateScore();
  await say("Welcome! Choose your starter to begin.", 200);
  showStarterPicker();
}

async function continueGame() {
  if (!loadSave()) return beginNewGame();
  hideTitle();
  state.started = true;
  setActive(state.active);
  updateScore();
  await startEncounter();
}

function hideTitle() {
  const t = $("#titleScreen");
  if (t) t.classList.add("hidden");
}

// ---------------------------------------------------------------- init -----

function wireUI() {
  $("#fightBtn").addEventListener("click", () => { if (!state.busy) { renderMoves(); show("moves"); } });
  $("#ballInfoBtn").addEventListener("click", () => { if (!state.busy) openBag(); });
  $("#swapBtn").addEventListener("click", () => { if (!state.busy) { renderParty(); show("swap"); } });
  $("#runBtn").addEventListener("click", async () => {
    if (state.busy) return;
    if (state.mode === "trainer") { await say("You can't run from a trainer battle!"); return; }
    setBusy(true);
    await say("Got away safely!");
    await sleep(300);
    await startEncounter();
    setBusy(false);
  });
  $("#backBtn").addEventListener("click", async () => { if (!state.busy) { show("menu"); await say("What will you do?", 0); } });
  $("#swapBackBtn").addEventListener("click", async () => { if (!state.busy) { show("menu"); await say("What will you do?", 0); } });
  $("#boxOpenBtn").addEventListener("click", () => openBox());
  const auto = $("#autoToggle");
  if (auto) auto.addEventListener("change", () => { state.auto = auto.checked; if (state.auto) maybeAuto(); });

  $("#newGameBtn").addEventListener("click", () => beginNewGame());
  const cont = $("#continueBtn");
  if (cont) cont.addEventListener("click", () => continueGame());
}

function boot() {
  wireUI();
  initAudio();
  updateScore();
  if (hasSave()) {
    const cont = $("#continueBtn");
    if (cont) cont.classList.remove("hidden");
  }
  // Auto-play ticker for continuous battling.
  setInterval(() => { if (state.auto && state.started) maybeAuto(); }, 1100);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
