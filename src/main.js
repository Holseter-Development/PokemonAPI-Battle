// main.js - the battle controller. Wires the pure engine (battle.js) to the DOM,
// drives animation timing, and owns high-level game flow: title screen,
// encounters, trainer battles, catching, party/box, save/load and auto-play.

import {
  fetchPokemon,
  fetchSpecies,
  fetchGrowth,
  fetchEvo,
  fetchMoveset,
  spriteSet,
} from "./api.js";
import { playSfx, playFile, initAudio, playCry } from "./audio.js";
import {
  clamp,
  typeEffect,
  calcDamage,
  useMove,
  applyEntryStatus,
  canAct,
  endOfTurn,
  applyWeatherChip,
  applyDefeatHeal,
  firstMover,
  chooseAIMove,
  bestMoveIndex,
  battleScore,
  bestSwitch,
  catchSuccess,
  switchOutHeal,
  effText,
} from "./battle.js";
import {
  TYPE_COLOR,
  STATUS_LABEL,
  STATUS_COLOR,
  GYMS,
  CHAMPION,
  STARTERS,
  STRUGGLE,
  cap,
} from "./data.js";
import {
  rivalEncounter, championTeamIds, rivalStarterFor, RIVAL_NAME,
} from "./rival.js";
import { buildRoster, validateRoster, rosterPower, snapshotMon } from "./roster.js";
import { arena, isArenaConfigured } from "./net.js";
import { randomSeedString } from "./rng.js";
import {
  NODE, createRun, availableNext, travelTo, markResolved, currentNode,
  nodeById, offerSigils, offerMutations, rollShop, rollMysteryEncounter, rollGold,
  encounterLevel, bossMemberLevel, checkWipe, withRng, eventGoldCost,
  resolveCoinflip, resolveWishingWell, resolveShrineScar, rollWildShiny,
  rollWildAlpha, alphaLevel, alphaGoldBonus, ALPHA_CATCH_MULT,
  resolveBallFountain, ambushLevel, ambushGoldBonus, tradeOfferLevel,
  SPRING_SHARE_FRACTION, BALL_FOUNTAIN_COST,
} from "./run.js";
import { encounterTableFor, pickEncounter, defaultSpeciesId, applyAlphaModifier } from "./encounters.js";
import {
  SIGILS, MUTATIONS, applyMutation, aggregateSigils, applyStartingBallBonus, emptyEffects, RARITY_COLOR,
} from "./mutations.js";
import { sampleDistinct } from "./rng.js";
import {
  GEN1_DEX_SIZE,
  BONUS_STARTERS,
  POKEDEX_MILESTONES,
  UPGRADE_CATALOG,
  UPGRADE_BRANCHES,
  defaultProgression,
  normalizeProgression,
  registerSpeciesId,
  progressionCounts,
  reconcileProgressionUnlocks,
  progressionEffects,
  upgradePurchaseState,
  purchaseUpgrade,
  recordExpeditionStart,
  recordBestDepth,
  recordRunResult,
  accumulatePlayTime,
  profileSummary,
  grantShinyCharm,
} from "./progression.js";
import {
  DEX_FILTERS,
  dexEntryState,
  dexNumber,
  dexSpriteUrl,
  filteredDexIds,
} from "./pokedex.js";
import { $, el, show, typeText, setText } from "./ui.js";

console.info("PokéBattle Arena - build v1.0");

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

// Show map-node outcome lines in the modal - which sits above the map overlay -
// with a Continue button, so results are readable at the player's own pace. The
// battle text box `say()` writes to is hidden behind the opaque map screen while
// a node resolves, so mystery / rest outcomes must surface here instead of
// flashing by invisibly. Resolves when the player dismisses it (button or Esc).
function showOutcome(lines, title = "Result") {
  const list = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
  if (!list.length) return Promise.resolve();
  return new Promise((resolve) => {
    openPanel(title, (body, close) => {
      list.forEach((line) => body.appendChild(el("p", {}, line)));
      const ok = el("button", { class: "title-btn primary" }, "Continue");
      ok.onclick = () => close();
      body.appendChild(ok);
    }, { onClose: resolve });
  });
}

// ---------------------------------------------------------------- state ----

const RUN_KEY = "pkbattle:run:v1";
const VAULT_KEY = "pkbattle:vault:v1";
const META_KEY = "pkbattle:meta:v2";
const LEGACY_META_KEY = "pkbattle:meta:v1";

const state = {
  party: [],       // === run.team while an expedition is active
  box: [],         // === run.box
  active: 0,
  player: null,
  enemy: null,
  busy: false,
  auto: false,
  started: false,
  mode: "map",     // "map" | "wild" | "trainer"
  trainer: null,   // active Elite / Champion boss
  trainerTeam: [],
  trainerIdx: 0,
  isChampion: false,
  run: null,       // the active Expedition (see run.js)
  battle: null,    // { kind, onWin, onLose, onFlee } for the current node battle
  sigilFx: emptyEffects(),
  noSwitchTurns: 0,
  endureUsed: { used: false },
  vault: [],       // persistent ascended roster (for ranked)
  meta: defaultProgression(),
  items: null,     // aliased to run.items during a run
};

function registerPokemonProgress(mon, field, announce = true) {
  // A caught shiny registers in the shiny ledger (which implies caught + seen),
  // so shiny ownership is tracked and the milestone counts stay correct.
  const shiny = field === "caught" && !!mon?.isShiny;
  const effectiveField = shiny ? "shinyCaught" : field;
  if (!mon || !registerSpeciesId(state.meta, effectiveField, mon.id)) {
    return { added: false, unlocks: [], shiny };
  }
  const unlocks = reconcileProgressionUnlocks(state.meta);
  saveMeta();
  if (announce) {
    const counts = progressionCounts(state.meta);
    const label = field === "seen" ? "Seen" : shiny ? "✦ Shiny" : "Caught";
    const count = shiny ? counts.shinyCaught : counts[field];
    floatToast(unlocks.length
      ? `Unlocked · ${unlocks.map((entry) => entry.name).join(", ")}`
      : `Pokédex · ${label} ${count}/${GEN1_DEX_SIZE} · ${mon.name}`);
  }
  return { added: true, unlocks, shiny };
}

// The Pokédex/unlock feedback lines for a capture registration (empty if the
// species was already caught). Shared so both the battle text box and the map
// outcome modal can present the same progress.
function caughtProgressLines(registration) {
  if (!registration.added) return [];
  const counts = progressionCounts(state.meta);
  const lines = [`Pokédex updated: ${counts.caught}/${GEN1_DEX_SIZE} species caught.`];
  for (const unlocked of registration.unlocks) {
    lines.push(`Permanent perk unlocked: ${unlocked.name} - ${unlocked.desc}`);
  }
  return lines;
}

async function announceCaughtProgress(registration) {
  for (const line of caughtProgressLines(registration)) await say(line);
}

function backfillOwnedPokemon(...groups) {
  let added = 0;
  for (const group of groups) {
    for (const mon of Array.isArray(group) ? group : []) {
      if (mon && registerSpeciesId(state.meta, "caught", mon.id)) added++;
    }
  }
  const unlocks = reconcileProgressionUnlocks(state.meta);
  if (added || unlocks.length) saveMeta();
  return added;
}

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

function makeMon(data, level = 5, opts = {}) {
  const b = Object.fromEntries(data.stats.map((s) => [s.stat.name, s.base_stat]));
  const maxHp = Math.floor((b.hp * 2 * level) / 100 + level + 10);
  const st = (base) => Math.floor((base * 2 * level) / 100 + 5);
  const shiny = !!opts.shiny;
  const sp = spriteSet(data, shiny);
  return {
    id: data.id,
    name: cap(data.name),
    isShiny: shiny,
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

async function buildMon(idOrName, level, opts = {}) {
  const data = await fetchPokemon(idOrName);
  const species = await fetchSpecies(data.id);
  const mon = makeMon(data, level, opts);
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

// Fraction of the active Pokémon's XP awarded to the rest of the party. Without
// this, only the mon that lands the KO ever levels, so a full team reaches an
// Elite (2-3 mons at your best level) with one strong Pokémon and a handful of
// stragglers that get one-shot. A high share keeps the roster clustered near
// your strongest so more of the team can actually trade with a boss. Because the
// encounter/boss curve keys off the *strongest* member (unchanged by sharing),
// raising the floor makes the team cohesive without inflating difficulty.
const SHARED_XP_FRACTION = 0.7;

// Level the non-active party up quietly (no banners, sparkles, or sprite
// animation - those belong to the active Pokémon on screen).
async function gainSharedXP(mon, amount) {
  if (!mon || !mon.growth || mon.stats.hp <= 0 || amount <= 0) return;
  mon.xp += amount;
  while (mon.xp >= mon.xpNext) {
    mon.xp -= mon.xpNext;
    await levelUp(mon, { silent: true });
  }
}

async function grantPartyXP(amount) {
  await gainXP(state.player, amount);
  const share = Math.max(1, Math.round(amount * SHARED_XP_FRACTION));
  for (const mon of state.party) {
    if (mon === state.player || mon.stats.hp <= 0) continue;
    await gainSharedXP(mon, share);
  }
  save();
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

async function levelUp(mon, opts = {}) {
  const silent = !!opts.silent;
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
  if (!silent) {
    await showBanner(`${mon.name} grew to Lv ${mon.level}!`);
    playSparkle("#playerSprite");
  }
  await maybeEvolve(mon, opts);
  if (!silent) save();
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

async function maybeEvolve(mon, opts = {}) {
  const silent = !!opts.silent;
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
  const evolved = makeMon(data, mon.level, { shiny: mon.isShiny });
  evolved.moves = mergeMoves(mon.moves, await fetchMoveset(data, mon.level));
  await setupGrowthAndEvo(evolved, species);
  evolved.stats.hp = Math.max(1, Math.floor(evolved.stats.maxHp * (mon.stats.hp / mon.stats.maxHp)));
  evolved.xp = mon.xp;
  evolved.xpNext = mon.xpNext;
  evolved.status = mon.status;
  evolved.sprite = evolved.spriteBack || evolved.spriteFront;

  const oldName = mon.name;
  const idx = state.party.indexOf(mon);
  // A reserve Pokémon can evolve from shared XP mid-battle; do it quietly and
  // never touch the on-screen active sprite (flashWhite/banner/cry are the
  // active mon's spotlight).
  const showcase = !silent && idx === state.active;
  if (showcase) await flashWhite("#playerSprite");
  if (idx >= 0) {
    state.party[idx] = evolved;
    if (state.active === idx) state.player = evolved;
  }
  updateHUD();
  const registration = registerPokemonProgress(evolved, "caught", false);
  if (showcase) {
    await showBanner(`${oldName} evolved into ${evolved.name}!`, 1400);
    await playCry(evolved);
    await announceCaughtProgress(registration);
  }
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
  const weather = $("#weatherIndicator");
  const weatherName = state.battle && state.sigilFx.weather;
  if (weather) {
    const labels = { sun: "Harsh Sunlight", rain: "Rain", hail: "Hail", sand: "Sandstorm" };
    weather.textContent = labels[weatherName] || "";
    weather.className = weatherName ? `weather-indicator weather-${weatherName}` : "weather-indicator hidden";
  }

  if (state.player) {
    const p = state.player;
    $("#playerName").textContent = shinyMark(p) + p.name;
    $("#playerCard")?.classList.toggle("is-shiny", !!p.isShiny);
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
    $("#enemyName").textContent = (state.mode === "trainer" ? "" : "Wild ") + alphaMark(e) + shinyMark(e) + e.name;
    $("#enemyCard")?.classList.toggle("is-shiny", !!e.isShiny);
    $("#enemyCard")?.classList.toggle("is-alpha", !!e.alpha);
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
  if (w) w.textContent = state.meta.fragments; // Fragments (meta-currency)
  if (m) m.textContent = state.run ? state.run.gold : 0; // run gold
  if (bs) bs.innerHTML = "";
  const counts = progressionCounts(state.meta);
  const dexBtn = $("#pokedexBtn");
  const dexQuick = $("#dexQuickCount");
  const upgradesBtn = $("#upgradesBtn");
  if (dexBtn) dexBtn.textContent = `Pokédex · ${counts.caught}/${GEN1_DEX_SIZE}`;
  if (dexQuick) dexQuick.textContent = counts.caught;
  if (upgradesBtn) upgradesBtn.textContent = `Fragment Lab · ${state.meta.fragments}`;
  updateObjective();
}

// The Expedition's north star, shown in the top bar so there's always a goal.
function updateObjective() {
  const obj = $("#objective");
  if (!obj) return;
  let text;
  if (state.run && state.started) {
    const region = (currentNode(state.run)?.region ?? 0) + 1;
    text = `Expedition · Region ${region}/${state.run.config.regions} · Depth ${state.run.visited.length}`;
  } else {
    text = `Vault: ${state.vault.length} · Expeditions won: ${state.meta.expeditionsWon}`;
  }
  obj.innerHTML = `<svg class="ico"><use href="#i-medal" /></svg> <span>${text}</span>`;
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
    // Animate `filter` on entry, not just opacity/transform. The sprites are
    // animated GIFs sitting on a filtered compositor layer; without a filter
    // keyframe on send-out the browser never repaints that layer, leaving the
    // Pokémon a blank white silhouette until the first hit (impactSprite) forces
    // a repaint. The brightness sweep both fixes the paint and reads as a
    // materialize flash.
    await node.animate([
      { opacity: 0, transform: "translateY(-10px) scale(.9)", filter: "brightness(1.8) saturate(.4)" },
      { opacity: 1, transform: "translateY(0) scale(1)", filter: "none" },
    ], { duration: 320, easing: "ease-out" }).finished;
  } catch (_) {}
  node.style.opacity = 1;
}

// A brief sparkle burst over a sprite, used for a shiny Pokémon's entrance.
// Cosmetic only, so it draws on Math.random and no-ops safely head-less (no
// layout box) - the shiny label/registration still fire regardless.
async function shinySparkle(sel) {
  const node = $(sel);
  const layer = $("#vfx");
  if (!node || !layer) return;
  const nRect = node.getBoundingClientRect();
  const lRect = layer.getBoundingClientRect();
  if (!nRect.width || !lRect.width) return;
  await flashWhite(sel);
  for (let i = 0; i < 14; i++) {
    const s = el("div", { class: "shiny-spark" });
    s.style.left = `${nRect.left - lRect.left + Math.random() * nRect.width}px`;
    s.style.top = `${nRect.top - lRect.top + Math.random() * nRect.height * 0.9}px`;
    s.style.setProperty("--sz", `${6 + Math.round(Math.random() * 10)}px`);
    s.style.setProperty("--dly", `${Math.round(Math.random() * 340)}ms`);
    layer.appendChild(s);
    setTimeout(() => s.remove(), 1100);
  }
  await sleep(620);
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

function trainerSpritePath(trainer) {
  return trainer?.sprite || "assets/sprites/acetrainerf-gen4.png";
}

function renderTrainerBadge(trainer) {
  const badge = $("#enemyTrainerBadge");
  const img = $("#enemyTrainerMini");
  const label = $("#enemyTrainerLabel");
  if (!badge || !img || !label) return;
  if (!trainer) {
    badge.classList.add("hidden");
    img.removeAttribute("src");
    img.alt = "";
    label.textContent = "";
    return;
  }
  img.src = trainerSpritePath(trainer);
  img.alt = "";
  label.textContent = trainer.leader;
  badge.title = `${trainer.title} ${trainer.leader}`;
  badge.classList.remove("hidden");
}

async function showTrainerEntrance(trainer, champion = false) {
  const intro = $("#trainerIntro");
  const sprite = $("#trainerIntroSprite");
  if (!intro || !sprite || !trainer) return;

  $("#trainerIntroKicker").textContent = trainer.title || "Trainer";
  $("#trainerIntroName").textContent = trainer.leader;
  $("#trainerIntroMeta").textContent = trainer.meta
    ? trainer.meta
    : champion
      ? `${trainer.town} · Final challenge`
      : `${trainer.town} Gym · ${trainer.badge} Badge`;
  sprite.src = trainerSpritePath(trainer);
  sprite.alt = "";
  intro.style.setProperty("--trainer-accent", TYPE_COLOR[trainer.type] || TYPE_COLOR.normal);
  intro.classList.toggle("trainer-intro-champion", champion);
  intro.classList.remove("hidden", "is-leaving");

  // Restart the entrance choreography if a test or future mode reuses the same
  // trainer without replacing the DOM node.
  intro.classList.remove("is-active");
  void intro.offsetWidth;
  intro.classList.add("is-active");

  const reduceMotion = typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  await sleep(reduceMotion ? 650 : 1550);
  intro.classList.add("is-leaving");
  await sleep(reduceMotion ? 80 : 320);
  intro.classList.add("hidden");
  intro.classList.remove("is-active", "is-leaving");
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
    playFile("assets/sfx/battle/attack.wav");
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

// A leading sparkle marks a shiny in name labels (HUD, party, box, results).
const shinyMark = (mon) => (mon && mon.isShiny ? "✦ " : "");
// A leading crossed-swords glyph marks an Alpha wild Pokémon in battle labels.
const alphaMark = (mon) => (mon && mon.alpha ? "⚔ " : "");

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

  const res = useMove(attacker, defender, move, Math.random, {
    playerFx: state.sigilFx,
    attackerIsPlayer,
    defenderIsPlayer: !attackerIsPlayer,
    noSwitchTurns: state.noSwitchTurns,
    endureUsed: state.endureUsed,
  });

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
  state.noSwitchTurns++;
  const eIdx = chooseAIMove(state.enemy, state.player);
  const enemyMove = state.enemy.moves[eIdx] || { ...STRUGGLE };

  const playerFirst = firstMover(
    state.player,
    playerMove,
    state.enemy,
    enemyMove,
    Math.random,
    { playerFx: state.sigilFx },
  ) === "a";
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
async function enemyFreeTurn(playerActed = true) {
  if (playerActed) state.noSwitchTurns++;
  const eIdx = chooseAIMove(state.enemy, state.player);
  const enemyMove = state.enemy.moves[eIdx] || { ...STRUGGLE };
  await performMove(state.enemy, state.player, enemyMove, false);
  if (state.player.stats.hp <= 0) return onPlayerFaint();
  if (await residualPhase()) return;
  await backToMenu();
}

// End-of-turn status and weather ticks. Returns true if the battle transitioned.
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
  const weather = state.sigilFx.weather;
  for (const [mon, sel, isEnemy] of [
    [state.player, "#playerSprite", false],
    [state.enemy, "#enemySprite", true],
  ]) {
    if (!mon || mon.stats.hp <= 0) continue;
    const r = applyWeatherChip(mon, weather);
    if (r && r.dmg) {
      updateHUD();
      floatTextNear(sel, `-${r.dmg}`, "bad");
      await say(`${mon.name} is buffeted by the ${weather === "hail" ? "hail" : "sandstorm"}!`);
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

// ---- faints & battle completion ----

function xpFor(enemy) {
  const base = Math.max(1, Math.floor(((enemy.base_exp || 64) * enemy.level) / 7));
  return state.mode === "trainer" ? Math.floor(base * 1.5) : base;
}

async function onEnemyFaint() {
  await playCry(state.enemy);
  await faintOut("#enemySprite");
  await say(`${labelFor(state.enemy, true)} fainted!`);
  if (state.player.stats.hp > 0 && state.sigilFx.healOnKill > 0) {
    const gained = applyDefeatHeal(state.player, state.sigilFx.healOnKill);
    if (gained > 0) {
      updateHUD();
      floatTextNear("#playerSprite", `+${gained}`, "good");
      await say(`${state.player.name} fed on the victory!`);
    }
  }
  await grantPartyXP(Math.round(
    xpFor(state.enemy) *
    (state.sigilFx.xpMult || 1) *
    (state.run?.progressionFx?.xpMult || 1)
  ));

  if (state.mode === "trainer") {
    state.trainerIdx++;
    if (state.trainerIdx < state.trainerTeam.length) {
      await sleep(400);
      await sendTrainerMon(state.trainerIdx);
      await backToMenu();
      return;
    }
  }
  const cb = state.battle && state.battle.onWin;
  state.battle = null;
  if (cb) await cb({ defeated: true });
  else goToMap();
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
  // Whole team down → the Expedition ends.
  await say("Your whole team has fainted...", 500);
  const cb = state.battle && state.battle.onLose;
  state.battle = null;
  if (cb) await cb();
  else await backToTitle();
}

// ---- battle setup (shared by every battle node) ----

// Recompute the aggregated sigil effects for the coming battle.
function beginBattleEffects() {
  state.sigilFx = aggregateSigils(state.run ? state.run.sigils : []);
  state.noSwitchTurns = 0;
  state.endureUsed = { used: false };
}

function applyEnemyEntryEffect(mon) {
  return applyEntryStatus(mon, state.sigilFx.enemyEntryStatus).applied;
}

// Documented first-encounter matchup assist: the very first wild Pokémon of a
// run is drawn from a gentle counter to the player's starter type, so a new run
// opens on a fair footing rather than a random 1–151 roll. Every other battle
// uses the node's biome table (see pickWildSpecies).
const OPENING_WILD_IDS = {
  grass: [60, 116], // Poliwag, Horsea
  fire: [10, 13],   // Caterpie, Weedle
  water: [37],      // Vulpix
};

// Seeded wild species for a battle node. Uses the run RNG so a seed + path
// reproduces the encounter. The opening override applies only to the run's
// first battle; afterwards the species is drawn from the node's biome table.
function pickWildSpecies(run, node) {
  const starterType = run.visited.length === 0 ? state.player?.types?.[0] : null;
  const openingPool = starterType && OPENING_WILD_IDS[starterType];
  return withRng(run, (rng) => {
    if (openingPool && openingPool.length) return openingPool[Math.floor(rng() * openingPool.length)];
    return pickEncounter(rng, encounterTableFor(node, run), run.visited.length).id;
  });
}

// Build a level-appropriate wild Pokémon from an explicit biome species id.
async function makeWildMon(level, speciesId, opts = {}) {
  const id = Number.isInteger(speciesId) ? speciesId : defaultSpeciesId();
  const poke = await fetchPokemon(id);
  const mon = makeMon(poke, level, opts);
  const species = await fetchSpecies(poke.id);
  mon.capture_rate = species.capture_rate;
  mon.moves = await fetchMoveset(poke, mon.level);
  if (!mon.moves.length) mon.moves = [{ ...STRUGGLE, name: "Tackle", key: "tackle", power: 40, pp: 35, ppLeft: 35, drain: 0 }];
  return mon;
}

// Roll shininess for a fresh wild spawn on the run RNG, using the odds
// snapshotted onto the run at start (base 1/512, Shiny Charm 1/256, full dex
// 1/128). Boss/trainer teams never call this, so they are never shiny.
function rollRunShiny() {
  if (!state.run) return false;
  return rollWildShiny(state.run, state.run.progressionFx?.shinyOneIn);
}

// spec: { kind:'battle', enemy } | { kind:'elite'|'champion', boss, team }
//       + onWin(info), onLose(), onFlee()
async function startBattle(spec) {
  $("#starterScreen")?.classList.add("hidden");
  $(".screen")?.classList.remove("starter-mode");
  clearEnemyPresentation();
  state.battle = spec;
  state.mode = spec.kind === "battle" ? "wild" : "trainer";
  state.isChampion = spec.kind === "champion";
  beginBattleEffects();
  hideMapScreen();
  // Never lead with a fainted Pokémon (e.g. after resuming a saved run).
  if (!state.player || state.player.stats.hp <= 0) {
    const idx = state.party.findIndex((m) => m.stats.hp > 0);
    if (idx >= 0) setActive(idx);
  }
  resetStages(state.player);
  // Keep the player sprite hidden through the opponent's entrance; it gets a
  // proper send-out (fadeInSprite) once the foe is on-screen. A static
  // opacity:1 here never triggers a filter repaint, so the GIF would show white.
  const ps = $("#playerSprite");
  if (ps) { ps.style.opacity = "0"; ps.style.transform = "none"; }

  if (spec.kind === "battle") {
    state.enemy = spec.enemy;
    state.trainer = null; state.trainerTeam = [];
    renderTrainerBadge(null);
    ensureRuntime(state.enemy);
    const entryStatus = applyEnemyEntryEffect(state.enemy);
    updateHUD();
    setThemeByType(state.enemy.types);
    await fadeInSprite("#enemySprite");
    if (state.enemy.isShiny) {
      await shinySparkle("#enemySprite");
      await say(`✦ A shiny wild ${state.enemy.name} appeared!`);
    } else {
      await say(`A wild ${state.enemy.name} appeared!`);
    }
    // Pre-battle Alpha signal: a banner plus a line naming the visible aura, so
    // the player knows this foe is stronger and harder to catch before acting.
    if (state.enemy.alpha) {
      await showBanner(`⚔ Alpha ${state.enemy.name}!`, 1300);
      await say(`It's an Alpha - ${state.enemy.alpha.name} aura (${state.enemy.alpha.desc}). It won't be caught easily!`);
    } else if (state.enemy.ambush) {
      // Ambush (P2.6): a boosted wild foe fighting above the route level.
      await showBanner(`Ambush! ${state.enemy.name}!`, 1300);
      await say(`It ambushed you - stronger than the usual wild ${state.enemy.name}. Fend it off for bonus gold!`);
    }
    registerPokemonProgress(state.enemy, "seen");
    if (entryStatus) await say(`${state.enemy.name} was poisoned by Toxic Spikes!`);
    await playCry(state.enemy);
  } else {
    state.trainer = spec.boss;
    state.trainerTeam = spec.team;
    state.trainerIdx = 0;
    setThemeByType([spec.boss.type]);
    renderTrainerBadge(spec.boss);
    await showTrainerEntrance(spec.boss, spec.kind === "champion");
    await say(spec.boss.intro, 400);
    await sendTrainerMon(0);
  }
  // Send out the player's lead now that the opponent is on-screen. This also
  // gives the player sprite its filter repaint so it renders instead of showing
  // as a white silhouette.
  await fadeInSprite("#playerSprite");
  await backToMenu();
}

async function sendTrainerMon(idx) {
  const mon = state.trainerTeam[idx];
  ensureRuntime(mon);
  state.enemy = mon;
  const entryStatus = applyEnemyEntryEffect(mon);
  updateHUD();
  setThemeByType(mon.types);
  await fadeInSprite("#enemySprite");
  await say(`${state.trainer.leader} sent out ${mon.name}!`);
  registerPokemonProgress(mon, "seen");
  if (entryStatus) await say(`${mon.name} was poisoned by Toxic Spikes!`);
  await playCry(mon);
}

// ---- Expedition lifecycle ----

const DEFAULT_ITEMS = () => ({
  "poke-ball": 3, "great-ball": 0, "ultra-ball": 0,
  potion: 1, "super-potion": 0, "hyper-potion": 0,
  antidote: 0, "parlyz-heal": 0, awakening: 0, "burn-heal": 0, "ice-heal": 0,
});

async function startExpedition(starterMon) {
  const seed = randomSeedString();
  const profileFx = progressionEffects(state.meta);
  const run = createRun(seed, {
    sigils: state.meta.startingSigils || [],
    gold: profileFx.startingGold,
  });
  run.progressionFx = profileFx;
  run.items = DEFAULT_ITEMS();
  run.items["poke-ball"] += profileFx.startingBalls;
  run.items["great-ball"] += profileFx.startingGreatBalls || 0;
  run.items.potion += profileFx.startingPotions;
  run.items["super-potion"] += profileFx.startingSuperPotions;
  run.items["hyper-potion"] += profileFx.startingHyperPotions || 0;
  const startingFx = aggregateSigils(run.sigils);
  applyStartingBallBonus(run.items, startingFx);
  run.team = [starterMon];
  run.box = [];
  // Lock in the rival's counter-starter from the player's pick (P2.5). Stored on
  // the run so every rival checkpoint and the Champion rebuild the same identity.
  run.playerStarterId = starterMon.id;
  run.rivalStarterId = rivalStarterFor(starterMon.id);
  run.gyms = withRng(run, (rng) => sampleDistinct(rng, GYMS.map((_, i) => i), run.config.regions, () => 1));
  state.run = run;
  state.party = run.team;
  state.box = run.box;
  state.items = run.items;
  state.active = 0;
  state.player = run.team[0];
  state.started = true;
  state.battle = null;
  recordExpeditionStart(state.meta);
  saveRun();
  await say("Your Expedition begins! Chart a path to the Champion.", 400);
  showMap();
  registerPokemonProgress(starterMon, "caught");
}

function bindRun(run) {
  run.team = (run.team || []).map(ensureRuntime);
  run.box = (run.box || []).map(ensureRuntime);
  backfillOwnedPokemon(run.team, run.box);
  if (!run.items) run.items = DEFAULT_ITEMS();
  if (!run.sigils) run.sigils = [];
  if (!run.progressionFx) run.progressionFx = progressionEffects(defaultProgression());
  // Backfill the rival starter for runs saved before P2.5 (best effort from the
  // lead Pokémon). New maps carry RIVAL checkpoints; older saves simply lack them.
  if (run.rivalStarterId == null) {
    run.playerStarterId = run.playerStarterId ?? run.team[0]?.id ?? null;
    run.rivalStarterId = rivalStarterFor(run.playerStarterId);
  }
  state.run = run;
  state.party = run.team;
  state.box = run.box;
  state.items = run.items;
  state.active = clamp(run.active || 0, 0, run.team.length - 1);
  state.player = run.team[state.active];
  state.started = true;
  state.battle = null;
}

async function continueExpedition() {
  const run = loadRun();
  if (!run || !run.team || !run.team.length) return beginNewGame();
  bindRun(run);
  hideTitle();
  setActive(state.active);
  showMap();
}

// ---- the map screen ----

function showMapScreen() { const m = $("#mapScreen"); if (m) m.classList.remove("hidden"); }
function hideMapScreen() { const m = $("#mapScreen"); if (m) m.classList.add("hidden"); }

function showMap() {
  $("#starterScreen")?.classList.add("hidden");
  $(".screen")?.classList.remove("starter-mode");
  state.mode = "map";
  state.battle = null;
  setBusy(false);
  renderRunHud();
  renderMap();
  updateScore();
  showMapScreen();
}

// Advance to the map after a node resolves (and mark the node done).
function goToMap() {
  if (state.run) {
    markResolved(state.run, { won: false });
    recordBestDepth(state.meta, state.run.visited.length + 1);
    saveRun();
  }
  showMap();
}

const NODE_GLYPH = {
  [NODE.BATTLE]: "W", [NODE.ELITE]: "E", [NODE.SHOP]: "$",
  [NODE.REST]: "+", [NODE.MYSTERY]: "?", [NODE.RIVAL]: "★", [NODE.CHAMPION]: "C",
};
const NODE_NAME = {
  [NODE.BATTLE]: "Wild", [NODE.ELITE]: "Elite", [NODE.SHOP]: "Shop",
  [NODE.REST]: "Rest", [NODE.MYSTERY]: "Mystery", [NODE.RIVAL]: "Rival", [NODE.CHAMPION]: "Champion",
};
const NODE_COLOR = {
  [NODE.BATTLE]: "#ef626c", [NODE.ELITE]: "#a78bfa", [NODE.SHOP]: "#f5c451",
  [NODE.REST]: "#66d49a", [NODE.MYSTERY]: "#55c9dc", [NODE.RIVAL]: "#ff8a5c", [NODE.CHAMPION]: "#ffd166",
};
const REGION_THEME = [
  { key: "verdant", name: "Viridian Wilds", note: "Tall grass, old trails, and restless Pokémon" },
  { key: "crimson", name: "Crimson Highlands", note: "A rugged climb through ember-lit ridges" },
  { key: "indigo", name: "Indigo Summit", note: "The final ascent to the Champion" },
];

function renderMap() {
  const canvas = $("#mapCanvas");
  if (!canvas || !state.run) return;
  canvas.innerHTML = "";
  const map = state.run.map;
  const avail = new Set(availableNext(state.run).map((n) => n.id));
  const visited = new Set(state.run.visited);
  for (let region = map.regions - 1; region >= 0; region--) {
    const theme = REGION_THEME[region] || REGION_THEME[REGION_THEME.length - 1];
    const section = el("section", { class: `map-region biome-${theme.key}` });
    section.dataset.region = String(region);
    const heading = el("div", { class: "region-heading" });
    heading.innerHTML =
      `<span>Region ${region + 1}</span>` +
      `<strong>${theme.name}</strong>` +
      `<small>${theme.note}</small>`;
    section.appendChild(heading);
    const rows = el("div", { class: "region-rows" });
    const firstRow = region * map.rowsPerRegion;
    const lastRow = Math.min(map.totalRows - 1, firstRow + map.rowsPerRegion - 1);
    for (let r = lastRow; r >= firstRow; r--) {
      const rowEl = el("div", { class: "map-row" });
      rowEl.dataset.depth = String(r + 1);
      rowEl.style.gridTemplateColumns = `repeat(${map.width}, 1fr)`;
      const byCol = {};
      map.rows[r].forEach((id) => { byCol[map.nodes[id].col] = id; });
      for (let c = 0; c < map.width; c++) {
        const slot = el("div", { class: "map-slot" });
        const id = byCol[c];
        if (id) {
          const node = map.nodes[id];
          const name = NODE_NAME[node.type] || "Unknown";
          const btn = el("button", {
            class: "map-node type-" + node.type,
            title: `${name} · Depth ${r + 1}`,
            "aria-label": `${name}, depth ${r + 1}`,
          });
          btn.dataset.id = id;
          btn.style.setProperty("--node-color", NODE_COLOR[node.type] || "#7a88a8");
          btn.appendChild(el("span", { class: "node-mark", "aria-hidden": "true" }, NODE_GLYPH[node.type] || "?"));
          btn.appendChild(el("span", { class: "node-name", "aria-hidden": "true" }, name));
          if (id === state.run.position) btn.classList.add("current");
          else if (visited.has(id)) btn.classList.add("visited");
          if (avail.has(id)) {
            btn.classList.add("available");
            btn.setAttribute("aria-label", `${name}, depth ${r + 1}, available`);
            btn.onclick = () => onSelectNode(node);
          } else if (id !== state.run.position) {
            btn.disabled = true;
          }
          slot.appendChild(btn);
        }
        rowEl.appendChild(slot);
      }
      rows.appendChild(rowEl);
    }
    section.appendChild(rows);
    canvas.appendChild(section);
  }
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      renderMapEdges();
      focusActiveRoute();
    });
  }
}

function renderMapEdges() {
  const canvas = $("#mapCanvas");
  if (!canvas || !state.run) return;
  const old = canvas.querySelector("svg.map-edges");
  if (old) old.remove();
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "map-edges");
  svg.setAttribute("aria-hidden", "true");
  const crect = canvas.getBoundingClientRect();
  const center = (id) => {
    const b = canvas.querySelector(`[data-id="${id}"]`);
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left - crect.left + r.width / 2, y: r.top - crect.top + r.height / 2 + canvas.scrollTop };
  };
  const visited = new Set(state.run.visited);
  const available = new Set(availableNext(state.run).map((n) => n.id));
  const addRoute = (a, b, className) => {
    const path = document.createElementNS(NS, "path");
    const midY = (a.y + b.y) / 2;
    path.setAttribute("d", `M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`);
    if (className) path.setAttribute("class", className);
    svg.appendChild(path);
  };
  for (const node of Object.values(state.run.map.nodes)) {
    const a = center(node.id);
    if (!a) continue;
    for (const e of node.edges) {
      const b = center(e);
      if (!b) continue;
      let className = "";
      if (visited.has(node.id) && visited.has(e)) className = "route-travelled";
      if (node.id === state.run.position && available.has(e)) className = "route-available";
      addRoute(a, b, className);
    }
  }
  if (!state.run.position) {
    const start = { x: crect.width / 2, y: canvas.scrollHeight - 4 };
    for (const id of available) {
      const target = center(id);
      if (target) addRoute(start, target, "route-available route-trailhead");
    }
  }
  canvas.insertBefore(svg, canvas.firstChild);
}

function focusActiveRoute() {
  const scroll = $("#mapScroll");
  const canvas = $("#mapCanvas");
  if (!scroll || !canvas) return;
  const target = canvas.querySelector(".map-node.available") || canvas.querySelector(".map-node.current");
  if (!target) return;
  const targetRect = target.getBoundingClientRect();
  const scrollRect = scroll.getBoundingClientRect();
  const top = scroll.scrollTop + targetRect.top - scrollRect.top - scroll.clientHeight * 0.58;
  scroll.scrollTop = clamp(top, 0, Math.max(0, scroll.scrollHeight - scroll.clientHeight));
}

async function onSelectNode(node) {
  if (state.busy) return;
  if (!availableNext(state.run).some((n) => n.id === node.id)) return;
  travelTo(state.run, node.id);
  // Deliberately not saved until the node resolves (goToMap): quitting mid-node
  // then continues from the last *completed* node instead of soft-locking on an
  // unresolved position.
  const combatNode = node.type === NODE.BATTLE || node.type === NODE.ELITE ||
    node.type === NODE.RIVAL || node.type === NODE.CHAMPION;
  if (!combatNode) hideMapScreen();
  await resolveNode(node);
}

function renderRunHud() {
  const hud = $("#runHud");
  if (!hud || !state.run) return;
  const run = state.run;
  const region = (currentNode(run)?.region ?? 0) + 1;
  const theme = REGION_THEME[region - 1] || REGION_THEME[0];
  const progress = clamp(run.visited.length / run.map.totalRows, 0, 1);
  const sig = run.sigils
    .map((id) => `<span class="sig-chip" style="--rar:${RARITY_COLOR[SIGILS[id].rarity]}" title="${SIGILS[id].desc}">${SIGILS[id].name}</span>`)
    .join("");
  const team = run.team
    .map((m) => `<span class="team-chip ${m.stats.hp > 0 ? "" : "ko"}">${m.name}<i>${m.stats.hp}/${m.stats.maxHp}</i></span>`)
    .join("");
  hud.innerHTML =
    `<div class="run-stats">` +
    `<span class="run-stat" title="Run seed">Seed <b>${run.seed}</b></span>` +
    `<span class="run-stat">Region <b>${region}/${run.config.regions}</b></span>` +
    `<span class="run-stat">Depth <b>${run.visited.length}</b></span>` +
    `<span class="run-stat">Gold <b>${run.gold}</b></span>` +
    `<span class="run-stat">Balls <b>${run.items["poke-ball"] || 0}</b></span>` +
    `</div>` +
    `<div class="run-sigils">${sig || '<span class="small">No sigils yet</span>'}</div>` +
    `<div class="run-team">${team}</div>`;
  const title = $("#mapRegionTitle");
  const note = $("#mapRegionNote");
  const progressText = $("#mapProgressText");
  const progressFill = $("#mapProgressFill");
  if (title) title.textContent = theme.name;
  if (note) note.textContent = theme.note;
  if (progressText) progressText.textContent = `${run.visited.length} / ${run.map.totalRows}`;
  if (progressFill) progressFill.style.width = `${progress * 100}%`;
}

// ---- node resolvers ----

async function resolveNode(node) {
  switch (node.type) {
    case NODE.BATTLE: return resolveBattleNode(node);
    case NODE.ELITE: return resolveEliteNode(node);
    case NODE.RIVAL: return resolveRivalNode(node);
    case NODE.CHAMPION: return resolveChampionNode(node);
    case NODE.SHOP: return resolveShopNode(node);
    case NODE.REST: return resolveRestNode(node);
    case NODE.MYSTERY: return resolveMysteryNode(node);
    default: return goToMap();
  }
}

async function resolveBattleNode(node) {
  setBusy(true);
  const speciesId = pickWildSpecies(state.run, node);
  const shiny = rollRunShiny();
  // A small seeded chance upgrades this into an Alpha: two levels above the route
  // target with one visible aura buff (see rollWildAlpha / applyAlphaModifier).
  // Never on the run's opening encounter, which is authored as a fair starter
  // matchup (see pickWildSpecies) - Alphas begin from the second battle onward.
  const alpha = state.run.visited.length > 0 ? rollWildAlpha(state.run) : null;
  const baseLevel = encounterLevel(state.run);
  const mon = await makeWildMon(alpha ? alphaLevel(baseLevel) : baseLevel, speciesId, { shiny });
  if (alpha) applyAlphaModifier(mon, alpha);
  setBusy(false);
  await startBattle({
    kind: "battle", enemy: mon,
    onWin: (info) => afterBattleWin(info),
    onLose: () => runWipe(),
    onFlee: () => goToMap(),
  });
}

async function afterBattleWin(info = {}) {
  // Capture the Alpha aura before the caught mon (a fresh, un-boosted build)
  // replaces state.enemy in the reward flow. Triggers once whether the Alpha was
  // defeated or caught; fleeing skips afterBattleWin entirely, so it earns nothing.
  const alpha = state.enemy?.alpha || null;
  if (info.caught) {
    ensureRuntime(info.caught);
    if (state.run.team.length < 6) state.run.team.push(info.caught);
    else { state.run.box.push(info.caught); await say(`${info.caught.name} was sent to storage.`); }
    await announceCaughtProgress(registerPokemonProgress(info.caught, "caught", false));
  }
  const gold = Math.round(
    rollGold(state.run, NODE.BATTLE) *
    (state.sigilFx.goldMult || 1) *
    (state.run.progressionFx?.goldMult || 1)
  );
  state.run.gold += gold;
  if (gold) floatToast(`+${gold} gold`);
  if (alpha) await grantAlphaReward(alpha);
  goToMap();
}

// The one-time Alpha payout: bonus gold plus a guaranteed mutation choice. Runs
// on the still-visible battle screen, so it uses say() + the mutation panels.
async function grantAlphaReward(alpha) {
  const run = state.run;
  const bonus = Math.round(alphaGoldBonus(run) * (run.progressionFx?.alphaGoldMult || 1));
  run.gold += bonus;
  renderRunHud();
  await say(`Alpha bonus! The ${alpha.name} aura fades - +${bonus} gold and a mutation.`, 400);
  const line = await graftMutationFlow();
  await say(line || "You passed on the Alpha's mutation.");
  saveRun();
}

async function buildBossTeam(boss) {
  const champion = boss === CHAMPION || boss.title === "Champion";
  const team = [];
  for (let i = 0; i < boss.team.length; i++) {
    team.push(await buildMon(boss.team[i], bossMemberLevel(state.run, i, champion)));
  }
  return team;
}

async function resolveEliteNode(node) {
  setBusy(true);
  const gymIdx = state.run.gyms && state.run.gyms[node.region] != null
    ? state.run.gyms[node.region] : node.region % GYMS.length;
  const gym = GYMS[gymIdx];
  const team = await buildBossTeam(gym);
  setBusy(false);
  await startBattle({
    kind: "elite", boss: gym, team,
    onWin: () => afterEliteWin(gym),
    onLose: () => runWipe(),
  });
}

async function afterEliteWin(gym) {
  const gold = Math.round(
    rollGold(state.run, NODE.ELITE) *
    (state.sigilFx.goldMult || 1) *
    (state.run.progressionFx?.goldMult || 1)
  );
  state.run.gold += gold;
  await say(`You defeated ${gym.leader}! +${gold} gold.`, 400);
  const sig = await offerDraft("sigil");
  if (sig) { if (!state.run.sigils.includes(sig.id)) state.run.sigils.push(sig.id); await say(`Attuned the ${sig.name} Sigil!`); }
  goToMap();
}

// The recurring rival (P2.5). A mandatory checkpoint per region: the rival wields
// the starter that counters the player's, evolved to match the depth, plus a
// growing filler team. Deterministic from run.rivalStarterId + the node's
// checkpoint index, so a save/continue rebuilds the identical encounter. Fights
// at parity like an Elite; a win pays a signature reward, a loss ends the run.
async function resolveRivalNode(node) {
  setBusy(true);
  const rival = rivalEncounter(state.run.rivalStarterId, node.rivalCheckpoint || 0);
  const team = await buildBossTeam(rival);
  setBusy(false);
  await startBattle({
    kind: "rival", boss: rival, team,
    onWin: () => afterRivalWin(rival),
    onLose: () => runWipe(),
  });
}

async function afterRivalWin(rival) {
  const gold = Math.round(
    rollGold(state.run, NODE.ELITE) *
    (state.sigilFx.goldMult || 1) *
    (state.run.progressionFx?.goldMult || 1)
  );
  state.run.gold += gold;
  // Signature reward: bonus gold, a spare Great Ball, and a guaranteed mutation.
  state.run.items["great-ball"] = (state.run.items["great-ball"] || 0) + 1;
  await say(`You beat your rival ${RIVAL_NAME}! +${gold} gold and a Great Ball.`, 400);
  const line = await graftMutationFlow();
  await say(line || `${RIVAL_NAME} storms off, vowing to get even.`);
  goToMap();
}

async function resolveChampionNode(node) {
  setBusy(true);
  // The Champion is the grown-up rival: field their own starter line (P2.5).
  const champ = { ...CHAMPION, team: championTeamIds(CHAMPION.team, state.run.rivalStarterId) };
  const team = await buildBossTeam(champ);
  setBusy(false);
  await startBattle({
    kind: "champion", boss: champ, team,
    onWin: () => runVictory(),
    onLose: () => runWipe(),
  });
}

// ---- utility nodes ----

function healTeam() {
  state.run.team.forEach((m) => {
    m.stats.hp = m.stats.maxHp;
    m.status = { cond: "none", turns: 0, toxic: 0 };
    resetStages(m);
    m.moves.forEach((mv) => (mv.ppLeft = mv.pp));
  });
  if (state.player) updateHUD();
}

async function resolveRestNode(node) {
  const choice = await new Promise((resolve) => {
    openPanel("Rest Site", (body, close) => {
      body.appendChild(el("p", { class: "small" }, "A safe place to recover or reshape your team."));
      const heal = el("button", { class: "title-btn primary" }, "Heal team fully");
      heal.onclick = () => { close(); resolve("heal"); };
      const mut = el("button", { class: "title-btn" }, "Graft a Mutation");
      mut.onclick = () => { close(); resolve("mutate"); };
      body.appendChild(heal); body.appendChild(mut);
    });
  });
  const lines = [];
  if (choice === "heal") { healTeam(); lines.push("Your team is fully rested."); }
  else if (choice === "mutate") { const m = await graftMutationFlow(); if (m) lines.push(m); }
  await showOutcome(lines, "Rest Site");
  goToMap();
}

// Runs the mutation draft + target picker. Returns the outcome line (for the
// caller to surface), or null if the player skipped either step.
async function graftMutationFlow() {
  const opt = await offerDraft("mutation");
  if (!opt) return null;
  const mon = await pickTeamMember(`Graft ${opt.name} onto…`);
  if (!mon) return null;
  applyMutation(mon, opt.id);
  if (mon === state.player) updateHUD();
  return `${mon.name} gained the ${opt.name} mutation!`;
}

async function resolveShopNode(node) {
  const stock = rollShop(state.run);
  // Haggler's Tongue (Fragment Lab) shaves a flat fraction off every sticker
  // price. Applied once here so the shop UI and the charge stay in lockstep.
  const discount = state.run.progressionFx?.shopDiscount || 0;
  if (discount > 0) {
    for (const it of stock) it.price = Math.max(1, Math.round(it.price * (1 - discount)));
  }
  await openShop(stock);
  goToMap();
}

function openShop(stock) {
  return new Promise((resolve) => {
    openPanel("Poké Mart", (body, close) => {
      const render = () => {
        body.innerHTML = "";
        body.appendChild(el("div", { class: "small shop-gold" }, `Gold: ${state.run.gold}`));
        stock.forEach((it) => {
          if (it.sold) return;
          const row = el("div", { class: "shop-row" });
          const label = it.rarity ? `${it.name} (${it.rarity})` : it.name;
          row.appendChild(el("span", {}, `${label} - ${it.price}g`));
          const buy = el("button", { class: "use-btn" }, "Buy");
          buy.disabled = state.run.gold < it.price;
          buy.onclick = async () => { await buyItem(it); it.sold = true; render(); };
          row.appendChild(buy);
          body.appendChild(row);
        });
        const leave = el("button", { class: "title-btn" }, "Leave");
        leave.onclick = () => { close(); resolve(); };
        body.appendChild(leave);
      };
      render();
    });
  });
}

async function buyItem(it) {
  if (state.run.gold < it.price) return;
  state.run.gold -= it.price;
  if (it.kind === "item") {
    if (it.id === "heal") healTeam();
    else state.run.items[it.id] = (state.run.items[it.id] || 0) + 1;
  } else if (it.kind === "mutation") {
    // Applied to the active Pokémon (avoids a nested picker over the shop).
    applyMutation(state.player, it.id);
    updateHUD();
  } else if (it.kind === "sigil") {
    if (!state.run.sigils.includes(it.id)) state.run.sigils.push(it.id);
  }
  renderRunHud();
  saveRun();
}

async function resolveMysteryNode(node) {
  const encounter = rollMysteryEncounter(state.run);
  if (encounter.kind === "trainer") {
    await resolveMysteryTrainer(node, encounter);
    return;
  }
  const ev = encounter.event;
  const choice = await new Promise((resolve) => {
    openPanel(ev.title, (body, close) => {
      body.appendChild(el("p", { class: "small" }, ev.desc));
      ev.choices.forEach((ch) => {
        const baseEffect = ch.effect || { kind: "none" };
        const nominal = paidChoiceAmount(baseEffect);
        let effect = baseEffect;
        let label = ch.label;
        let disabled = false;
        // Paid choices charge an affordable, depth-scaled amount (never more
        // than the player's gold) and show that live amount on the button.
        if (nominal != null) {
          const amount = eventGoldCost(state.run, nominal);
          if (amount <= 0) {
            disabled = true; // flat broke - nothing to spend
          } else {
            effect = { ...baseEffect };
            if (baseEffect.cost != null) effect.cost = amount;
            if (baseEffect.stake != null) effect.stake = amount;
            label = paidChoiceLabel(baseEffect, amount) || ch.label;
          }
        }
        const b = el("button", { class: "title-btn" }, label);
        if (disabled) { b.disabled = true; b.title = "Not enough gold"; }
        else b.onclick = () => { close(); resolve({ effect }); };
        body.appendChild(b);
      });
    });
  });
  const effect = choice.effect || { kind: "none" };
  // The ambush hands the flow to a boosted wild battle (its own win/lose paths
  // return to the map), so it bypasses the outcome modal + goToMap below.
  if (effect.kind === "ambush") { await resolveAmbush(node); return; }
  const lines = await applyEventEffect(effect);
  await showOutcome(lines, ev.title);
  goToMap();
}

// Ambush (P2.6): a boosted wild battle drawn from the node's biome table. Fights
// a few levels above the route target and pays bonus gold on a win. Species and
// shininess roll on the run RNG (like a normal battle node) so a seed + path
// reproduces the encounter; it stays fully catchable at ordinary odds.
async function resolveAmbush(node) {
  setBusy(true);
  const speciesId = pickWildSpecies(state.run, node);
  const shiny = rollRunShiny();
  const mon = await makeWildMon(ambushLevel(encounterLevel(state.run)), speciesId, { shiny });
  mon.ambush = true;
  setBusy(false);
  await startBattle({
    kind: "battle", enemy: mon,
    onWin: (info) => afterAmbushWin(info),
    onLose: () => runWipe(),
    onFlee: () => goToMap(),
  });
}

async function afterAmbushWin(info = {}) {
  if (info.caught) {
    ensureRuntime(info.caught);
    if (state.run.team.length < 6) state.run.team.push(info.caught);
    else { state.run.box.push(info.caught); await say(`${info.caught.name} was sent to storage.`); }
    await announceCaughtProgress(registerPokemonProgress(info.caught, "caught", false));
  }
  const gold = Math.round(
    (rollGold(state.run, NODE.BATTLE) + ambushGoldBonus(state.run)) *
    (state.sigilFx.goldMult || 1) *
    (state.run.progressionFx?.goldMult || 1)
  );
  state.run.gold += gold;
  if (gold) floatToast(`+${gold} gold`);
  await say(`You fended off the ambush!${gold ? ` +${gold} gold.` : ""}`, 400);
  goToMap();
}

// The gold a Mystery choice asks for, or null if the choice is free.
function paidChoiceAmount(effect) {
  if (!effect) return null;
  if (effect.kind === "gamble" || effect.kind === "tutor") return effect.cost != null ? effect.cost : null;
  if (effect.kind === "coinflip") return effect.stake != null ? effect.stake : null;
  return null;
}

// Rebuild a paid choice's label around the live (affordable) amount.
function paidChoiceLabel(effect, amount) {
  switch (effect.kind) {
    case "tutor": return `Restore PP (${amount} gold)`;
    case "coinflip": return `Bet ${amount} gold`;
    case "gamble": return `Toss in ${amount} gold`;
    default: return null;
  }
}

// Build a wandering trainer's team at the route's fair encounter level so the
// ambush is a step up from a lone wild Pokémon without reaching boss scaling.
async function buildTrainerTeam(trainer) {
  const level = encounterLevel(state.run);
  const team = [];
  for (const id of trainer.team) team.push(await buildMon(id, level));
  return team;
}

async function resolveMysteryTrainer(node, encounter) {
  setBusy(true);
  const team = await buildTrainerTeam(encounter.trainer);
  setBusy(false);
  await startBattle({
    kind: "trainer", boss: encounter.trainer, team,
    onWin: () => afterMysteryTrainerWin(encounter),
    onLose: () => runWipe(),
  });
}

async function afterMysteryTrainerWin(encounter) {
  const gold = Math.round(
    rollGold(state.run, NODE.BATTLE) *
    (state.sigilFx.goldMult || 1) *
    (state.run.progressionFx?.goldMult || 1)
  );
  state.run.gold += gold;
  await say(`You beat the ${encounter.trainer.leader}!${gold ? ` +${gold} gold.` : ""}`, 400);
  await grantTrainerReward(encounter.reward);
  goToMap();
}

// Hand over the pre-rolled random reward for beating a wandering trainer.
async function grantTrainerReward(reward) {
  const run = state.run;
  if (!reward) return;
  switch (reward.kind) {
    case "gold":
      run.gold += reward.amount || 0;
      await say(`The trainer handed you ${reward.label || `${reward.amount || 0} gold`}!`);
      break;
    case "item": {
      const amount = reward.amount || 1;
      run.items[reward.id] = (run.items[reward.id] || 0) + amount;
      await say(`The trainer gave you ${reward.label || "an item"}!`);
      break;
    }
    case "egg": {
      const speciesId = withRng(run, (rng) => pickEncounter(rng, encounterTableFor(currentNode(run), run), run.visited.length).id);
      const mon = await makeWildMon(encounterLevel(run), speciesId, { shiny: rollRunShiny() });
      if (run.team.length < 6) run.team.push(mon);
      else run.box.push(mon);
      await say(`The trainer gave you ${reward.label || "an Egg"} - it hatched into ${mon.name}!`);
      await announceCaughtProgress(registerPokemonProgress(mon, "caught", false));
      break;
    }
    default:
      break;
  }
  renderRunHud();
  saveRun();
}

// Apply a Mystery choice's effect and return the outcome lines to show. All
// run-affecting rolls go through the run RNG (P2.2) so a seed + path reproduces
// the result and a save/continue mid-node never rerolls it.
async function applyEventEffect(effect) {
  const run = state.run;
  const msgs = [];
  switch (effect.kind) {
    case "heal": healTeam(); msgs.push("Your team recovered fully."); break;
    case "balls": run.items["poke-ball"] = (run.items["poke-ball"] || 0) + (effect.amount || 1); msgs.push(`You found ${effect.amount || 1} Poké Ball!`); break;
    case "gold": run.gold += effect.amount || 0; msgs.push(`You found ${effect.amount || 0} gold!`); break;
    case "sigil": { const s = await offerDraft("sigil"); if (s && !run.sigils.includes(s.id)) { run.sigils.push(s.id); msgs.push(`Attuned the ${s.name} Sigil!`); } break; }
    case "recruit": {
      const speciesId = withRng(run, (rng) => pickEncounter(rng, encounterTableFor(currentNode(run), run), run.visited.length).id);
      const mon = await makeWildMon(encounterLevel(run), speciesId, { shiny: rollRunShiny() });
      if (run.team.length < 6) run.team.push(mon); else run.box.push(mon);
      msgs.push(mon.isShiny ? `The egg hatched into a shiny ${mon.name}!` : `The egg hatched into ${mon.name}!`);
      msgs.push(...caughtProgressLines(registerPokemonProgress(mon, "caught", false)));
      break;
    }
    case "tutor": {
      // Move Restorer (P2.6): recovers the lead Pokémon's move PP - it does not
      // teach a move. Copy matches the behaviour until the real relearner (P3.4).
      if (run.gold >= (effect.cost || 0)) { run.gold -= effect.cost || 0; state.player.moves.forEach((mv) => (mv.ppLeft = mv.pp)); msgs.push(`${state.player.name}'s move PP was fully restored.`); }
      else msgs.push("You can't afford it.");
      break;
    }
    case "healOne": {
      // Full soak for a single chosen member (HP + status), the tradeoff against
      // the shared partial heal below.
      const mon = await pickTeamMember("Soak which Pokémon fully?");
      if (mon) {
        mon.stats.hp = mon.stats.maxHp;
        mon.status = { cond: "none", turns: 0, toxic: 0 };
        resetStages(mon);
        mon.moves.forEach((mv) => (mv.ppLeft = mv.pp));
        if (mon === state.player) updateHUD();
        msgs.push(`${mon.name} soaked in the spring and recovered completely.`);
      } else msgs.push("You left the spring untouched.");
      break;
    }
    case "healShare": {
      // Splash the whole team for a fraction of max HP (and clear status).
      let healed = 0;
      run.team.forEach((m) => {
        if (!m?.stats) return;
        const before = m.stats.hp;
        m.stats.hp = Math.min(m.stats.maxHp, m.stats.hp + Math.ceil(m.stats.maxHp * SPRING_SHARE_FRACTION));
        m.status = { cond: "none", turns: 0, toxic: 0 };
        if (m.stats.hp > before) healed++;
      });
      if (state.player) updateHUD();
      msgs.push(`The spring's water reached the whole team (${Math.round(SPRING_SHARE_FRACTION * 100)}% HP and status cured).`);
      if (!healed) msgs.push("Everyone was already at full health.");
      break;
    }
    case "ballFountain": {
      // Risk/reward: spend one Poké Ball for a seeded roll.
      if ((run.items["poke-ball"] || 0) < BALL_FOUNTAIN_COST) { msgs.push("You have no Poké Ball to toss in."); break; }
      run.items["poke-ball"] -= BALL_FOUNTAIN_COST;
      const result = resolveBallFountain(run);
      run.items["poke-ball"] = (run.items["poke-ball"] || 0) + (result.poke || 0);
      run.items["great-ball"] = (run.items["great-ball"] || 0) + (result.great || 0);
      if (result.outcome === "jackpot") msgs.push(`Jackpot! The fountain returned ${result.poke} Poké Balls and a Great Ball.`);
      else if (result.outcome === "minor") msgs.push(`The fountain bubbled up ${result.poke} Poké Balls - a small profit.`);
      else msgs.push("The fountain swallowed your Poké Ball and gave nothing back.");
      break;
    }
    case "trade": {
      msgs.push(...(await tradeFlow()));
      break;
    }
    case "coinflip": {
      if (run.gold >= (effect.stake || 0)) {
        const { won, delta } = resolveCoinflip(run, effect.stake);
        run.gold += delta;
        msgs.push(won ? `You won ${effect.stake} gold!` : `You lost ${effect.stake} gold...`);
      } else msgs.push("Not enough gold to bet.");
      break;
    }
    case "gamble": {
      if (run.gold >= (effect.cost || 0)) {
        run.gold -= effect.cost || 0;
        const result = resolveWishingWell(run);
        if (result.outcome === "gold") { run.gold += result.gold; msgs.push(`The well rewards you with ${result.gold} gold!`); }
        else if (result.outcome === "mutation") { const m = await graftMutationFlow(); msgs.push(m || "The well's gift slips through your fingers."); }
        else msgs.push("The well stays silent...");
      } else msgs.push("You can't spare the gold.");
      break;
    }
    case "mutationThenScar": {
      const m = await graftMutationFlow();
      if (m) msgs.push(m);
      const { victimIndex, stat } = resolveShrineScar(run);
      const victim = run.team[victimIndex];
      if (victim) {
        victim.stats[stat] = Math.max(1, Math.floor(victim.stats[stat] * 0.85));
        if (victim === state.player) updateHUD();
        msgs.push(`...but the shrine's curse weakened ${victim.name}.`);
      }
      break;
    }
    default: break;
  }
  renderRunHud();
  saveRun();
  return msgs;
}

// Sum of a Pokémon's six live battle stats - a rough power yardstick for the
// trade comparison panel (maxHp stands in for HP).
function statTotal(mon) {
  const s = mon?.stats || {};
  return (s.maxHp || 0) + (s.atk || 0) + (s.def || 0) + (s.spa || 0) + (s.spd || 0) + (s.spe || 0);
}

// NPC trade (P2.6): give one team member, receive the collector's Pokémon. The
// offered species is drawn from the node's biome table on the run RNG (so a
// seed + path reproduces the offer) at a few levels above the route target,
// making a straight swap tempting. A side-by-side stat-total comparison
// precedes an explicit accept/decline; backing out at any step costs nothing.
async function tradeFlow() {
  const run = state.run;
  if (!run.team.length) return ["There was no one to trade."];
  const give = await pickTeamMember("Offer which Pokémon?");
  if (!give) return ["You declined the trade."];
  setBusy(true);
  const speciesId = withRng(run, (rng) => pickEncounter(rng, encounterTableFor(currentNode(run), run), run.visited.length).id);
  const offered = await buildMon(speciesId, tradeOfferLevel(run), { shiny: rollRunShiny() });
  setBusy(false);
  const accept = await confirmTrade(give, offered);
  if (!accept) return [`You kept ${give.name}.`];
  const idx = run.team.indexOf(give);
  if (idx >= 0) run.team.splice(idx, 1, offered); else run.team.push(offered);
  ensureRuntime(offered);
  // Keep the active lead valid if the traded-away Pokémon was the current lead.
  if (give === state.player) { state.active = clamp(idx >= 0 ? idx : 0, 0, run.team.length - 1); setActive(state.active); }
  const lines = [offered.isShiny ? `You traded ${give.name} for a shiny ${offered.name}!` : `You traded ${give.name} for ${offered.name}!`];
  lines.push(...caughtProgressLines(registerPokemonProgress(offered, "caught", false)));
  return lines;
}

// Accept/decline panel comparing the Pokémon offered up against the one received,
// with stat totals so the swap is an informed choice. Resolves true to accept.
function confirmTrade(give, offered) {
  return new Promise((resolve) => {
    openPanel("Trade Offer", (body, close) => {
      const giveT = statTotal(give), offT = statTotal(offered);
      const diff = offT - giveT;
      const row = (label, mon, total) => el("div", { class: "small" },
        `${label}: ${shinyMark(mon)}${mon.name} · Lv ${mon.level} · ${(mon.types || []).join("/")} · stat total ${total}`);
      body.appendChild(row("You give", give, giveT));
      body.appendChild(row("You get", offered, offT));
      body.appendChild(el("p", { class: "small" },
        diff === 0 ? "An even swap on paper." : diff > 0 ? `The offer is +${diff} stat total stronger.` : `The offer is ${diff} stat total weaker.`));
      const yes = el("button", { class: "title-btn primary" }, "Accept the trade");
      yes.onclick = () => { close(); resolve(true); };
      const no = el("button", { class: "title-btn" }, "Keep my Pokémon");
      no.onclick = () => { close(); resolve(false); };
      body.appendChild(yes); body.appendChild(no);
    });
  });
}

// ---- reward drafts ----

// Present three rarity-weighted options; resolves to the chosen def or null.
function offerDraft(kind) {
  const options = kind === "sigil" ? offerSigils(state.run, 3) : offerMutations(state.run, 3);
  return new Promise((resolve) => {
    openPanel(kind === "sigil" ? "Choose a Sigil" : "Choose a Mutation", (body, close) => {
      const grid = el("div", { class: "draft-grid" });
      options.forEach((opt) => {
        const card = el("div", { class: "draft-card" });
        card.style.setProperty("--rar", RARITY_COLOR[opt.rarity] || "#888");
        card.innerHTML =
          `<div class="draft-name">${opt.name}</div>` +
          `<div class="draft-rar">${opt.rarity}</div>` +
          `<div class="draft-desc small">${opt.desc}</div>`;
        card.onclick = () => { close(); resolve(opt); };
        grid.appendChild(card);
      });
      body.appendChild(grid);
      const skip = el("button", { class: "title-btn" }, "Skip");
      skip.onclick = () => { close(); resolve(null); };
      body.appendChild(skip);
    });
  });
}

function pickTeamMember(title) {
  const team = state.run.team;
  return new Promise((resolve) => {
    openPanel(title, (body, close) => {
      team.forEach((m) => {
        const b = el("button", { class: "title-btn" }, `${m.name} · Lv ${m.level} · ${m.stats.hp}/${m.stats.maxHp} HP`);
        b.onclick = () => { close(); resolve(m); };
        body.appendChild(b);
      });
      if (!team.length) { const c = el("button", { class: "title-btn" }, "OK"); c.onclick = () => { close(); resolve(null); }; body.appendChild(c); }
    });
  });
}

// ---- run end ----

async function runVictory() {
  markResolved(state.run, { won: true });
  recordBestDepth(state.meta, state.run.visited.length + 1);
  recordRunResult(state.meta, true);
  const frags = 60 + state.run.visited.length * 4 + state.run.ascension * 30;
  state.meta.fragments += frags;
  // First Champion win earns the Shiny Charm, improving future wild shiny odds.
  const earnedShinyCharm = grantShinyCharm(state.meta);
  saveMeta();
  await flashWhite("#enemySprite");
  await new Promise((resolve) => {
    openPanel("Champion!", (body, close) => {
      body.appendChild(el("p", {}, "You conquered the Expedition and became Champion!"));
      body.appendChild(el("p", { class: "small" }, `+${frags} Fragments. Choose one Pokémon to ascend into your Vault for ranked play:`));
      if (earnedShinyCharm) body.appendChild(el("p", { class: "small" }, "✦ You earned the Shiny Charm - shiny Pokémon now appear more often on future Expeditions."));
      state.run.team.forEach((m) => {
        const b = el("button", { class: "title-btn primary" }, `Ascend ${shinyMark(m)}${m.name} (Lv ${m.level})`);
        b.onclick = () => { ascendToVault(m); close(); resolve(); };
        body.appendChild(b);
      });
      const skip = el("button", { class: "title-btn" }, "Ascend none");
      skip.onclick = () => { close(); resolve(); };
      body.appendChild(skip);
    });
  });
  clearRun();
  await backToTitle();
}

async function runWipe() {
  if (state.run) { state.run.over = true; state.run.won = false; }
  recordRunResult(state.meta, false);
  const frags = 15 + (state.run ? state.run.visited.length : 0) * 3;
  state.meta.fragments += frags;
  saveMeta();
  await openModal({
    title: "Expedition Ended",
    bodyHTML: `<p>Your team was defeated.</p><p class="small">You reached ${state.run ? state.run.visited.length : 0} nodes and earned ${frags} Fragments toward permanent unlocks.</p>`,
    actions: [{ label: "Return to Title", primary: true, onClick: () => {} }],
    dismissable: false,
  });
  clearRun();
  await backToTitle();
}

async function backToTitle() {
  state.started = false;
  state.mode = "map";
  state.battle = null;
  $("#starterScreen")?.classList.add("hidden");
  $(".screen")?.classList.remove("starter-mode");
  hideMapScreen();
  closeModal();
  const t = $("#titleScreen");
  if (t) t.classList.remove("hidden");
  refreshTitleButtons();
  updateScore();
}

function refreshTitleButtons() {
  const cont = $("#continueBtn");
  if (cont) cont.classList.toggle("hidden", !hasRun());
}

// ---- persistence: run / vault / meta ----

function saveRun() {
  try {
    if (state.run) {
      state.run.active = state.active;
      localStorage.setItem(RUN_KEY, JSON.stringify(state.run));
    }
  } catch (_) {}
  saveVault();
  saveMeta();
}
const save = saveRun; // legacy call sites
function hasRun() { try { return !!localStorage.getItem(RUN_KEY); } catch (_) { return false; } }
function loadRun() { try { const raw = localStorage.getItem(RUN_KEY); return raw ? JSON.parse(raw) : null; } catch (_) { return null; } }
function clearRun() { try { localStorage.removeItem(RUN_KEY); } catch (_) {} state.run = null; state.battle = null; state.started = false; }
function loadVault() { try { return JSON.parse(localStorage.getItem(VAULT_KEY) || "[]"); } catch (_) { return []; } }
function saveVault() { try { localStorage.setItem(VAULT_KEY, JSON.stringify(state.vault || [])); } catch (_) {} }
function readStoredJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}
function loadMeta() {
  const current = readStoredJSON(META_KEY);
  const hasCurrent = current && typeof current === "object" && !Array.isArray(current);
  const legacy = hasCurrent
    ? null
    : readStoredJSON(LEGACY_META_KEY);
  return normalizeProgression(hasCurrent ? current : (legacy || {}));
}
function saveMeta() {
  try {
    state.meta = normalizeProgression(state.meta);
    localStorage.setItem(META_KEY, JSON.stringify(state.meta));
  } catch (_) {}
}
// ---- active-foreground playtime clock ----
// We only accumulate while the page is visible. Each flush adds the real gap
// since the last mark, but accumulatePlayTime caps a single slice so a tab that
// was suspended/throttled in the background can't inject phantom hours.
let playTimeMark = null;
function isPageVisible() {
  return typeof document === "undefined" || document.visibilityState !== "hidden";
}
function startPlayTimeClock() {
  playTimeMark = isPageVisible() ? Date.now() : null;
}
function flushPlayTime() {
  if (playTimeMark == null) return;
  const now = Date.now();
  const elapsed = now - playTimeMark;
  playTimeMark = now;
  if (elapsed <= 0) return;
  accumulatePlayTime(state.meta, elapsed);
  saveMeta();
}
function handleVisibilityChange() {
  if (isPageVisible()) {
    // Returning to the foreground: start a fresh slice; hidden time is dropped.
    playTimeMark = Date.now();
  } else {
    // Leaving the foreground: bank what we have, then stop the clock.
    flushPlayTime();
    playTimeMark = null;
  }
}

function ascendToVault(mon) { state.vault.push(snapshotMon(mon)); saveVault(); }

function floatToast(txt) {
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
    const pImg = el("img", { src: m.spriteFront || m.artwork, alt: m.name });
    if (m.isShiny) pImg.classList.add("shiny-sprite");
    main.appendChild(pImg);
    const info = el("div", { class: "p-info" });
    info.appendChild(el("div", { class: `p-name${m.isShiny ? " shiny" : ""}` }, `${idx === state.active ? "★ " : ""}${shinyMark(m)}${m.name}`));
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
  state.noSwitchTurns = 0;
  // A fainted Pokémon has already been recalled and hidden by onPlayerFaint's
  // faintOut. Replaying the "come back!" recall here would flash the fainted
  // sprite back to full opacity (faintOut starts at opacity 1) before fading it
  // out a second time - the "reappear into a ball, then vanish" glitch. Only
  // recall a Pokémon that is still conscious.
  let regen = 0;
  if (from.stats.hp > 0) {
    await say(`${from.name}, come back!`);
    regen = switchOutHeal(from); // Regenerator mutation
    await faintOut("#playerSprite").catch(() => {});
  }
  setActive(idx);
  if (regen > 0) floatToast(`${from.name} regenerated ${regen} HP`);
  await fadeInSprite("#playerSprite");
  await say(`Go, ${to.name}!`);
  await playCry(to);
  save();
  if (forced) {
    // Fainted-switch: enemy already had its turn this round.
    await backToMenu();
  } else {
    await enemyFreeTurn(false);
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

// Roguelike catching: balls are a scarce resource, but a throw almost always
// works - the decision is *whether to spend the ball*, not a dice roll. A catch
// resolves the battle node as a win (you can't catch a fainted foe, so the risk
// lives in not over-hitting).
async function throwBall(key = "poke-ball") {
  if (state.busy) return;
  if (state.mode === "trainer") { await say("You can't catch a boss's Pokémon!"); return; }
  if ((state.items[key] || 0) <= 0) { await say("You're out of Poké Balls!"); return; }
  setBusy(true);
  show("none");
  state.items[key]--;
  renderRunHud();
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
    // Alphas are harder to catch while their aura is active (P2.4).
    const alphaMult = state.enemy?.alpha ? ALPHA_CATCH_MULT : 1;
    const catchChance = Math.min(0.99, 0.92 * (state.run?.progressionFx?.catchChanceMult || 1) * alphaMult);
    const success = Math.random() < catchChance; // near-guaranteed (reduced for Alphas)
    await handle.shake(success ? 3 : Math.floor(Math.random() * 2) + 1);
    if (success) {
      handle.clear();
      await say(`Gotcha! ${state.enemy.name} was caught!`, 400);
      const mon = await buildMon(state.enemy.id, state.enemy.level, { shiny: state.enemy.isShiny });
      mon.stats.hp = state.enemy.stats.hp;
      mon.status = state.enemy.status;
      mon.sprite = mon.spriteFront;
      const cb = state.battle && state.battle.onWin;
      state.battle = null;
      await sleep(500);
      if (cb) await cb({ caught: mon });
      else goToMap();
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
  head.appendChild(el("h3", {}, `PC Box - ${state.box.length}`));
  const back = el("button", { class: "small ghost" }, "◂ Back");
  back.onclick = () => show("swap");
  head.appendChild(back);
  view.appendChild(head);
  const grid = el("div", { class: "box-grid" });
  if (!state.box.length) grid.appendChild(el("div", { class: "small" }, "The Box is empty."));
  state.box.forEach((m, idx) => {
    const c = el("div", { class: "box-item" });
    const main = el("div", { class: "p-main" });
    const bImg = el("img", { src: m.spriteFront || m.artwork, alt: m.name });
    if (m.isShiny) bImg.classList.add("shiny-sprite");
    main.appendChild(bImg);
    main.appendChild(el("div", { class: "p-info" }, ""));
    main.lastChild.appendChild(el("div", { class: `p-name${m.isShiny ? " shiny" : ""}` }, `${shinyMark(m)}${m.name}`));
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
  if (!state.auto || state.busy || !state.started || !state.battle) return;
  if (!state.player || !state.enemy || state.player.stats.hp <= 0) return;
  await sleep(420);
  if (state.busy || !state.battle || state.player.stats.hp <= 0) return;
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
  await fleeBattle();
}

// ---------------------------------------------------------------- flow -----

async function chooseStarter(id) {
  const screen = $("#starterScreen");
  const grid = $("#starterGrid");
  const prompt = $("#starterPrompt");
  const allStarters = [...STARTERS, ...BONUS_STARTERS];
  const allowed = new Set([...STARTERS.map((s) => s.id), ...progressionEffects(state.meta).starterIds]);
  const chosen = allStarters.find((s) => s.id === id && allowed.has(s.id));
  if (!chosen) return;
  setBusy(true);
  if (grid) {
    grid.querySelectorAll(".starter-card").forEach((card) => {
      card.disabled = true;
      card.classList.toggle("selected", Number(card.dataset.id) === id);
    });
  }
  if (prompt) prompt.textContent = `Preparing ${chosen?.name || "your partner"}...`;
  try {
    const mon = await buildMon(id, 5);
    mon.sprite = mon.spriteBack || mon.spriteFront;
    await playCry(mon);
    await startExpedition(mon);
    if (screen) screen.classList.add("hidden");
    $(".screen")?.classList.remove("starter-mode");
  } catch (error) {
    console.error("Could not prepare starter:", error);
    if (prompt) prompt.textContent = "That partner could not be loaded. Please try again.";
    if (grid) grid.querySelectorAll(".starter-card").forEach((card) => (card.disabled = false));
  } finally {
    setBusy(false);
  }
}

function showStarterPicker() {
  const screen = $("#starterScreen");
  const grid = $("#starterGrid");
  const prompt = $("#starterPrompt");
  if (!screen || !grid) return;
  const details = {
    grass: { style: "Steady", note: "Recovery and clever status play" },
    fire: { style: "Bold", note: "Fast pressure and heavy damage" },
    water: { style: "Reliable", note: "Strong defenses and safe matchups" },
    electric: { style: "Quick", note: "Fast pressure and precise attacks" },
    normal: { style: "Adaptable", note: "Flexible growth and broad potential" },
  };
  grid.innerHTML = "";
  const unlockedIds = new Set(progressionEffects(state.meta).starterIds);
  const starterChoices = [...STARTERS, ...BONUS_STARTERS.filter((s) => unlockedIds.has(s.id))];
  grid.classList.toggle("starter-grid-expanded", starterChoices.length > 3);
  starterChoices.forEach((s) => {
    const info = details[s.type];
    const b = el("button", {
      class: `starter-card starter-${s.type}`,
      "aria-label": `Choose ${s.name}, ${s.type} type`,
    });
    b.dataset.id = String(s.id);
    b.style.setProperty("--starter-type", TYPE_COLOR[s.type]);
    b.innerHTML =
      `<span class="starter-art">` +
      `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${s.id}.gif" ` +
      `data-fallback="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${s.id}.png" alt="${s.name}" />` +
      `</span>` +
      `<span class="starter-type">${cap(s.type)} type</span>` +
      `<strong>${s.name}</strong>` +
      `<span class="starter-style">${info.style}</span>` +
      `<small>${info.note}</small>` +
      `<span class="starter-choose">Choose ${s.name}</span>`;
    const img = b.querySelector("img");
    img.onerror = () => {
      if (img.src !== img.dataset.fallback) img.src = img.dataset.fallback;
    };
    b.onclick = () => chooseStarter(s.id);
    grid.appendChild(b);
  });
  if (prompt) prompt.textContent = "Select a partner to begin";
  hideMapScreen();
  show("none");
  $(".screen")?.classList.add("starter-mode");
  screen.classList.remove("hidden");
}

function clearBattlePresentation() {
  state.player = null;
  state.enemy = null;
  state.trainer = null;
  state.trainerTeam = [];
  state.trainerIdx = 0;
  for (const sel of ["#playerSprite", "#enemySprite"]) {
    const img = $(sel);
    if (!img) continue;
    img.removeAttribute("src");
    delete img.dataset.src;
    img.style.opacity = "0";
    img.style.transform = "none";
  }
  for (const sel of ["#playerTypes", "#enemyTypes", "#playerParty", "#enemyParty"]) {
    const node = $(sel);
    if (node) node.innerHTML = "";
  }
  for (const sel of ["#playerName", "#enemyName", "#playerLevel", "#enemyLevel", "#playerHpText", "#enemyHpText"]) {
    const node = $(sel);
    if (node) node.textContent = "";
  }
  for (const sel of ["#playerHpFill", "#enemyHpFill", "#playerXpFill"]) {
    const node = $(sel);
    if (node) node.style.width = "0%";
  }
  for (const sel of ["#playerStatus", "#enemyStatus", "#weatherIndicator"]) {
    const node = $(sel);
    if (node) node.classList.add("hidden");
  }
  renderTrainerBadge(null);
  $("#trainerIntro")?.classList.add("hidden");
  setText("");
  setThemeByType(["normal"]);
}

function clearEnemyPresentation() {
  state.enemy = null;
  renderTrainerBadge(null);
  $("#trainerIntro")?.classList.add("hidden");
  const sprite = $("#enemySprite");
  if (sprite) {
    sprite.style.opacity = "0";
    sprite.style.transform = "none";
    sprite.removeAttribute("src");
    delete sprite.dataset.src;
  }
  for (const sel of ["#enemyTypes", "#enemyParty"]) {
    const node = $(sel);
    if (node) node.innerHTML = "";
  }
  for (const sel of ["#enemyName", "#enemyLevel", "#enemyHpText"]) {
    const node = $(sel);
    if (node) node.textContent = "";
  }
  const hp = $("#enemyHpFill");
  if (hp) hp.style.width = "0%";
  $("#enemyStatus")?.classList.add("hidden");
}

async function beginNewGame() {
  clearRun();
  state.party = []; state.box = [];
  clearBattlePresentation();
  hideTitle();
  state.started = true;
  updateScore();
  showStarterPicker();
}

async function continueGame() {
  if (!hasRun()) return beginNewGame();
  await continueExpedition();
}

function hideTitle() {
  const t = $("#titleScreen");
  if (t) t.classList.add("hidden");
}

// ---------------------------------------------------------- Pokédex / Lab ----

let dexDetailToken = 0;

function openPokedex() {
  const counts = progressionCounts(state.meta);
  openPanel("Pokédex", (body, close) => {
    const shell = el("div", { class: "dex-shell" });
    const summary = el("div", { class: "dex-summary" });
    summary.innerHTML =
      `<span><b>${counts.seen}</b><small>Seen</small></span>` +
      `<span><b>${counts.caught}</b><small>Caught</small></span>` +
      `<span><b>${counts.shinyCaught}</b><small>Shiny</small></span>` +
      `<span><b>${GEN1_DEX_SIZE - counts.caught}</b><small>Missing</small></span>`;
    const nextMilestone = POKEDEX_MILESTONES.find((milestone) =>
      counts[milestone.field] < milestone.threshold
    );
    const milestone = el("div", { class: "dex-milestone" });
    if (nextMilestone) {
      const current = counts[nextMilestone.field];
      milestone.innerHTML =
        `<span><small>Next permanent perk</small><b>${nextMilestone.name}</b></span>` +
        `<span class="dex-milestone-copy">${nextMilestone.desc}</span>` +
        `<strong>${current} / ${nextMilestone.threshold} ${nextMilestone.field}</strong>`;
    } else {
      milestone.innerHTML =
        `<span><small>Research complete</small><b>Master Researcher</b></span>` +
        `<span class="dex-milestone-copy">Every Generation I species has been registered.</span>` +
        `<strong>${GEN1_DEX_SIZE} / ${GEN1_DEX_SIZE}</strong>`;
    }

    const filters = el("div", { class: "dex-filters", role: "group", "aria-label": "Pokédex filters" });
    const content = el("div", { class: "dex-content" });
    const grid = el("div", { class: "dex-grid", role: "list", "aria-label": "Generation I Pokédex" });
    const detail = el("aside", { class: "dex-detail", "aria-live": "polite" });
    let filter = "all";
    let selectedId = state.meta.caught[0] || state.meta.seen[0] || 1;

    const renderDetail = async (id) => {
      selectedId = id;
      const entry = dexEntryState(state.meta, id);
      const token = ++dexDetailToken;
      detail.innerHTML = "";
      const art = el("div", { class: `dex-detail-art ${entry.seen ? "" : "unknown"}` });
      if (entry.seen) {
        const img = el("img", {
          src: dexSpriteUrl(id, entry.shiny),
          alt: entry.name,
        });
        art.appendChild(img);
      } else {
        art.appendChild(el("span", { "aria-hidden": "true" }, "?"));
      }
      detail.appendChild(art);
      detail.appendChild(el("span", { class: "dex-detail-number" }, dexNumber(id)));
      detail.appendChild(el("h3", {}, entry.seen ? entry.name : "Undiscovered"));
      const status = entry.caught ? (entry.shiny ? "Shiny caught" : "Caught") : entry.seen ? "Seen only" : "Not yet seen";
      detail.appendChild(el("p", { class: `dex-detail-status ${entry.caught ? "caught" : ""}` }, status));
      const types = el("div", { class: "dex-detail-types" });
      detail.appendChild(types);
      const note = el("p", { class: "small dex-detail-note" }, entry.seen ? "Loading species data…" : "Encounter this Pokémon to reveal its record.");
      detail.appendChild(note);

      grid.querySelectorAll(".dex-entry").forEach((button) => {
        button.classList.toggle("selected", Number(button.dataset.id) === id);
      });
      if (!entry.seen) return;
      try {
        const data = await fetchPokemon(id);
        if (token !== dexDetailToken || $("#modal")?.classList.contains("hidden")) return;
        renderTypes(types, data.types.map((item) => item.type.name));
        note.textContent = entry.caught
          ? "Registered to your permanent collection."
          : "Seen in battle. Catch it to complete this entry.";
      } catch (_) {
        if (token === dexDetailToken) note.textContent = "Species details are unavailable offline.";
      }
    };

    const renderGrid = () => {
      grid.innerHTML = "";
      const ids = filteredDexIds(state.meta, filter);
      if (!ids.length) {
        grid.appendChild(el("p", { class: "dex-empty small" }, "No entries match this filter yet."));
        return;
      }
      for (const id of ids) {
        const entry = dexEntryState(state.meta, id);
        const button = el("button", {
          class: `dex-entry ${entry.caught ? "caught" : entry.seen ? "seen" : "unseen"} ${entry.shiny ? "shiny" : ""}`,
          role: "listitem",
          "aria-label": `${dexNumber(id)} ${entry.seen ? entry.name : "undiscovered"}${entry.caught ? ", caught" : ""}`,
        });
        button.dataset.id = String(id);
        button.appendChild(el("span", { class: "dex-entry-number" }, dexNumber(id)));
        if (entry.seen) {
          const img = el("img", {
            src: dexSpriteUrl(id, entry.shiny),
            alt: "",
            loading: "lazy",
          });
          button.appendChild(img);
        } else {
          button.appendChild(el("span", { class: "dex-entry-unknown", "aria-hidden": "true" }, "?"));
        }
        button.appendChild(el("span", { class: "dex-entry-name" }, entry.seen ? entry.name : "????"));
        if (entry.caught) button.appendChild(el("i", { class: "dex-caught-mark", "aria-hidden": "true" }));
        button.onclick = () => renderDetail(id);
        grid.appendChild(button);
      }
      if (!ids.includes(selectedId)) selectedId = ids[0];
      renderDetail(selectedId);
    };

    for (const value of DEX_FILTERS) {
      const button = el("button", {
        class: "dex-filter",
        "data-filter": value,
        "aria-pressed": value === filter ? "true" : "false",
      }, cap(value));
      button.onclick = () => {
        filter = value;
        filters.querySelectorAll(".dex-filter").forEach((item) =>
          item.setAttribute("aria-pressed", String(item === button))
        );
        renderGrid();
      };
      filters.appendChild(button);
    }

    content.append(grid, detail);
    shell.append(summary, milestone, filters, content);
    const closeButton = el("button", { class: "title-btn dex-close" }, "Close Pokédex");
    closeButton.onclick = close;
    shell.appendChild(closeButton);
    body.appendChild(shell);
    renderGrid();
    const focusFirstFilter = () => filters.querySelector(".dex-filter")?.focus();
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(focusFirstFilter);
    else focusFirstFilter();
  }, { wide: true });
}

function describeProgressionEffects(effects) {
  const parts = [];
  if (effects.startingGold) parts.push(`+${effects.startingGold} starting gold`);
  if (effects.startingBalls) parts.push(`+${effects.startingBalls} Poké Ball${effects.startingBalls === 1 ? "" : "s"}`);
  if (effects.startingGreatBalls) parts.push(`+${effects.startingGreatBalls} Great Ball${effects.startingGreatBalls === 1 ? "" : "s"}`);
  if (effects.startingPotions) parts.push(`+${effects.startingPotions} Potion`);
  if (effects.startingSuperPotions) parts.push(`+${effects.startingSuperPotions} Super Potion`);
  if (effects.startingHyperPotions) parts.push(`+${effects.startingHyperPotions} Hyper Potion`);
  if (effects.catchChanceMult > 1) parts.push(`+${Math.round((effects.catchChanceMult - 1) * 100)}% catch chance`);
  if (effects.goldMult > 1) parts.push(`+${Math.round((effects.goldMult - 1) * 100)}% battle gold`);
  if (effects.xpMult > 1) parts.push(`+${Math.round((effects.xpMult - 1) * 100)}% XP`);
  if (effects.alphaGoldMult > 1) parts.push(`+${Math.round((effects.alphaGoldMult - 1) * 100)}% Alpha bounty`);
  if (effects.shopDiscount > 0) parts.push(`-${Math.round(effects.shopDiscount * 100)}% shop prices`);
  if (effects.shinyCharm || effects.masterResearcher || effects.shinyOneIn < 512) {
    parts.push(`1/${effects.shinyOneIn} wild shiny`);
  }
  return parts.length ? parts.join(" · ") : "No permanent run bonuses yet";
}

// The Trainer Profile: a read-only home for account identity and progress.
function openProfile() {
  flushPlayTime();
  const summary = profileSummary(state.meta, state.vault ? state.vault.length : 0);
  openPanel("Trainer Profile", (body, close) => {
    const shell = el("div", { class: "profile-shell" });

    const statCard = (label, value, sub) => {
      const card = el("div", { class: "profile-stat" });
      card.appendChild(el("b", {}, String(value)));
      card.appendChild(el("small", {}, label));
      if (sub) card.appendChild(el("span", { class: "profile-stat-sub" }, sub));
      return card;
    };

    const stats = el("div", { class: "profile-stats" });
    stats.append(
      statCard("Won / Started", `${summary.expeditionsWon} / ${summary.expeditionsStarted}`, `${summary.winRatePct}% win rate`),
      statCard("Win Streak", summary.currentWinStreak, `Best ${summary.bestWinStreak}`),
      statCard("Best Depth", summary.bestDepth, "nodes cleared"),
      statCard("Playtime", summary.playTime, "active foreground"),
      statCard("Pokédex", `${summary.caught} / ${summary.dexTotal}`, `${summary.seen} seen`),
      statCard("Shinies", summary.shinyCaught, "caught"),
      statCard("Vault", summary.vaultSize, "ascended"),
    );
    if (summary.masterResearcher) {
      stats.appendChild(statCard("Badge", "★", "Master Researcher"));
    }
    shell.appendChild(stats);

    const badges = [
      ...(summary.expeditionsWon > 0 ? [{ name: "Champion", desc: "Toppled the Champion." }] : []),
      ...summary.milestoneUnlocks.map((milestone) => ({ name: milestone.name, desc: milestone.desc })),
    ];
    const achieveSection = el("section", { class: "profile-section" });
    achieveSection.appendChild(el("h3", {}, "Achievements"));
    if (badges.length) {
      const list = el("div", { class: "profile-badges" });
      for (const badge of badges) {
        const chip = el("div", { class: "profile-badge", title: badge.desc });
        chip.appendChild(el("b", {}, badge.name));
        chip.appendChild(el("span", {}, badge.desc));
        list.appendChild(chip);
      }
      achieveSection.appendChild(list);
    } else {
      achieveSection.appendChild(el("p", { class: "small profile-empty" }, "Win Expeditions and fill the Pokédex to earn badges."));
    }
    shell.appendChild(achieveSection);

    const upgradeSection = el("section", { class: "profile-section" });
    upgradeSection.appendChild(el("h3", {}, "Purchased upgrades"));
    if (summary.purchasedUpgrades.length) {
      const list = el("ul", { class: "profile-upgrades" });
      for (const upgrade of summary.purchasedUpgrades) {
        const item = el("li", {});
        item.appendChild(el("b", {}, upgrade.name));
        item.appendChild(el("span", {}, upgrade.desc));
        list.appendChild(item);
      }
      upgradeSection.appendChild(list);
    } else {
      upgradeSection.appendChild(el("p", { class: "small profile-empty" }, "Spend Fragments in the Fragment Lab for permanent run bonuses."));
    }
    shell.appendChild(upgradeSection);

    const closeButton = el("button", { class: "title-btn profile-close" }, "Close Profile");
    closeButton.onclick = close;
    shell.appendChild(closeButton);
    body.appendChild(shell);
  }, { wide: true });
}

function openUpgradeLab() {
  openPanel("Fragment Lab", (body, close) => {
    let confirming = null;
    let notice = "";
    const shell = el("div", { class: "upgrade-shell" });

    // Build one skill-node card. `status` is the pure purchase verdict; the card
    // reflects owned / available / unaffordable / prerequisite-locked states and
    // routes confirmed purchases back through the pure purchaseUpgrade helper.
    const buildNode = (upgrade, branchColor) => {
      const status = upgradePurchaseState(state.meta, upgrade.id);
      const owned = status.reason === "owned";
      const locked = status.reason === "requires";
      const card = el("article", {
        class: `upgrade-card skill-node tier-${upgrade.tier || 1}` +
          (owned ? " owned" : "") + (locked ? " locked" : "") +
          (confirming === upgrade.id ? " confirming" : ""),
      });
      card.style.setProperty("--branch-color", branchColor);
      card.dataset.id = upgrade.id;
      if (upgrade.tier > 1) card.appendChild(el("span", { class: "skill-link", "aria-hidden": "true" }));

      const copy = el("div", { class: "upgrade-copy" });
      const title = el("h3", {});
      title.appendChild(el("span", { class: "skill-tier-badge", "aria-hidden": "true" }, `T${upgrade.tier || 1}`));
      title.appendChild(document.createTextNode(upgrade.name));
      copy.appendChild(title);
      copy.appendChild(el("p", {}, upgrade.desc));
      if (locked) {
        const prerequisite = UPGRADE_CATALOG.find((item) => item.id === upgrade.requires);
        copy.appendChild(el("small", {}, `Requires ${prerequisite?.name || "the previous node"}`));
      }

      const action = el("button", { class: "use-btn upgrade-buy" });
      if (owned) {
        action.textContent = "Owned";
        action.disabled = true;
      } else if (locked) {
        action.textContent = "Locked";
        action.disabled = true;
      } else if (status.reason === "funds") {
        action.textContent = `${upgrade.cost} ◈`;
        action.disabled = true;
        action.classList.add("cant-afford");
      } else {
        action.textContent = confirming === upgrade.id ? `Confirm · ${upgrade.cost} ◈` : `Buy · ${upgrade.cost} ◈`;
        action.onclick = () => {
          if (confirming !== upgrade.id) {
            confirming = upgrade.id;
            notice = `Confirm purchase of ${upgrade.name} for ${upgrade.cost} Fragments.`;
            render();
            return;
          }
          const result = purchaseUpgrade(state.meta, upgrade.id);
          confirming = null;
          notice = result.ok ? `${upgrade.name} unlocked permanently.` : "Purchase could not be completed.";
          if (result.ok) { saveMeta(); updateScore(); }
          render();
        };
      }
      card.append(copy, action);
      return card;
    };

    const render = () => {
      shell.innerHTML = "";
      const head = el("div", { class: "upgrade-head" });
      const owned = UPGRADE_CATALOG.filter((u) => state.meta.upgrades?.[u.id]).length;
      head.innerHTML =
        `<span class="upgrade-balance"><b>${state.meta.fragments}</b> Fragments</span>` +
        `<span class="upgrade-progress">${owned} / ${UPGRADE_CATALOG.length} nodes unlocked</span>` +
        `<p>${describeProgressionEffects(progressionEffects(state.meta))}</p>`;
      shell.appendChild(head);
      if (notice) shell.appendChild(el("p", { class: "upgrade-notice", role: "status" }, notice));

      const tree = el("div", { class: "skill-tree" });
      for (const branch of UPGRADE_BRANCHES) {
        const nodes = UPGRADE_CATALOG
          .filter((u) => u.branch === branch.id)
          .sort((a, b) => (a.tier || 1) - (b.tier || 1) || a.cost - b.cost);
        const branchOwned = nodes.filter((u) => state.meta.upgrades?.[u.id]).length;
        const col = el("section", { class: `skill-branch branch-${branch.id}` });
        col.style.setProperty("--branch-color", branch.color);
        const heading = el("div", { class: "skill-branch-head" });
        heading.innerHTML =
          `<span class="skill-branch-icon" aria-hidden="true">${branch.icon}</span>` +
          `<strong>${branch.name}</strong>` +
          `<small>${branch.blurb}</small>` +
          `<span class="skill-branch-count">${branchOwned}/${nodes.length}</span>`;
        col.appendChild(heading);
        const track = el("div", { class: "skill-track" });
        for (const upgrade of nodes) track.appendChild(buildNode(upgrade, branch.color));
        col.appendChild(track);
        tree.appendChild(col);
      }
      shell.appendChild(tree);

      const closeButton = el("button", { class: "title-btn upgrade-close" }, "Close Lab");
      closeButton.onclick = close;
      shell.appendChild(closeButton);
    };

    render();
    body.appendChild(shell);
  }, { wide: true });
}

// ---------------------------------------------------------------- modal ----

function openModal({ title, bodyHTML, actions = [], dismissable = true }) {
  const modal = $("#modal");
  if (!modal) return Promise.resolve();
  modal.classList.remove("modal-wide");
  modal.onkeydown = null;
  $("#modalTitle").textContent = title || "";
  $("#modalBody").innerHTML = bodyHTML || "";
  const act = $("#modalActions");
  act.innerHTML = "";
  return new Promise((resolve) => {
    actions.forEach((a) => {
      const b = el("button", { class: "title-btn" + (a.primary ? " primary" : "") }, a.label);
      b.onclick = () => { if (a.onClick) a.onClick(); resolve(a.value); };
      act.appendChild(b);
    });
    if (dismissable) {
      const c = el("button", { class: "title-btn" }, "Close");
      c.onclick = () => { closeModal(); resolve(null); };
      act.appendChild(c);
    }
    modal.classList.remove("hidden");
  });
}
function closeModal() {
  const modal = $("#modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("modal-wide");
    modal.onkeydown = null;
  }
}

// A modal whose body you build imperatively (with live listeners). Reuses the
// single #modal container - callers are sequential (await), so no nesting.
function openPanel(title, build, options = {}) {
  const modal = $("#modal");
  if (!modal) return;
  const returnFocus = document.activeElement;
  modal.classList.toggle("modal-wide", !!options.wide);
  $("#modalTitle").textContent = title || "";
  const body = $("#modalBody");
  body.innerHTML = "";
  $("#modalActions").innerHTML = "";
  const close = () => {
    modal.classList.add("hidden");
    modal.classList.remove("modal-wide");
    modal.onkeydown = null;
    if (returnFocus && typeof returnFocus.focus === "function") returnFocus.focus();
    if (typeof options.onClose === "function") options.onClose();
  };
  modal.onkeydown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...modal.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex='-1'])")];
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  build(body, close);
  modal.classList.remove("hidden");
}

// ---------------------------------------------------------------- arena ----

// The persistent Vault (ascended Pokémon) is what ranked play draws from.
function currentRoster() {
  if (state.vault && state.vault.length) return buildRoster(state.vault);
  return buildRoster(loadVault());
}

// The Ranked Arena entry point. Today it validates your team and shows a
// "coming soon" state; when ARENA_ENDPOINT is configured it will connect to the
// authoritative server and enter the ranked queue (see net.js / the MP plan).
function openArena() {
  const roster = currentRoster();
  const v = validateRoster(roster);
  if (!v.ok) {
    return openModal({
      title: "Ranked Arena",
      bodyHTML: `<p>Your Vault is empty.</p><p class="small">Win an Expedition and <b>ascend</b> a Pokémon into your Vault - that's the team you bring to 1v1 ranked PvP.</p>`,
      actions: [],
    });
  }
  const online = isArenaConfigured();
  const roster6 = roster.slice(0, 6);
  const list = roster6
    .map((m) => `<li><b>${m.isShiny ? "✦ " : ""}${m.name}</b> <span class="small">Lv ${m.level}</span></li>`)
    .join("");
  openModal({
    title: "Ranked Arena",
    bodyHTML:
      `<p class="small">Your battle-ready team · Power ${rosterPower(roster)}</p>` +
      `<ul class="roster-list">${list}</ul>` +
      (online
        ? `<p class="small">Connecting to the ranked server…</p>`
        : `<p class="arena-soon">Online ranked battles are coming soon.</p>` +
          `<p class="small">Your team is Arena-ready and will carry straight into 1v1 ranked play the moment servers go live.</p>`),
    actions: online
      ? [{ label: "Find Match", primary: true, onClick: () => beginRankedSearch(roster) }]
      : [],
  });
}

async function beginRankedSearch(roster) {
  // Placeholder wiring against the net boundary - no-op until the server exists.
  try {
    await arena.connect();
    arena.queueRanked(roster);
  } catch (e) {
    closeModal();
    openModal({
      title: "Ranked Arena",
      bodyHTML: `<p>${e.message || "Could not reach the ranked server."}</p>`,
      actions: [],
    });
  }
}

// ---------------------------------------------------------------- init -----

function wireUI() {
  $("#fightBtn").addEventListener("click", () => { if (!state.busy) { renderMoves(); show("moves"); } });
  $("#ballInfoBtn").addEventListener("click", () => { if (!state.busy) openBag(); });
  $("#swapBtn").addEventListener("click", () => { if (!state.busy) { renderParty(); show("swap"); } });
  $("#runBtn").addEventListener("click", () => { if (!state.busy) fleeBattle(); });
  const mapBtn = $("#mapBtn");
  if (mapBtn) mapBtn.addEventListener("click", () => { if (!state.busy && state.run) showMap(); });
  $("#backBtn").addEventListener("click", async () => { if (!state.busy) { show("menu"); await say("What will you do?", 0); } });
  $("#swapBackBtn").addEventListener("click", async () => { if (!state.busy) { show("menu"); await say("What will you do?", 0); } });
  $("#boxOpenBtn").addEventListener("click", () => openBox());
  const auto = $("#autoToggle");
  if (auto) auto.addEventListener("change", () => { state.auto = auto.checked; if (state.auto) maybeAuto(); });

  $("#newGameBtn").addEventListener("click", () => beginNewGame());
  const cont = $("#continueBtn");
  if (cont) cont.addEventListener("click", () => continueGame());
  $("#profileBtn")?.addEventListener("click", () => openProfile());
  $("#pokedexBtn")?.addEventListener("click", () => openPokedex());
  $("#pokedexQuickBtn")?.addEventListener("click", () => openPokedex());
  $("#upgradesBtn")?.addEventListener("click", () => openUpgradeLab());
  const arenaBtn = $("#arenaBtn");
  if (arenaBtn) arenaBtn.addEventListener("click", () => openArena());
}

function boot() {
  state.vault = loadVault();
  state.meta = loadMeta();
  backfillOwnedPokemon(state.vault);
  saveMeta(); // materialize a normalized v2 profile after loading legacy data
  wireUI();
  initAudio();
  updateScore();
  refreshTitleButtons();
  window.addEventListener("resize", () => {
    if (state.run && state.mode === "map" && typeof requestAnimationFrame === "function") {
      requestAnimationFrame(renderMapEdges);
    }
  });
  // Active-foreground playtime: start the clock, bank it periodically, and flush
  // on tab hide / navigation so a lost tab doesn't lose the current slice.
  startPlayTimeClock();
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", flushPlayTime);
  window.addEventListener("beforeunload", flushPlayTime);
  setInterval(flushPlayTime, 30000);
  // Auto-play ticker: only acts during an active battle.
  setInterval(() => { if (state.auto && state.started && state.battle) maybeAuto(); }, 1100);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
