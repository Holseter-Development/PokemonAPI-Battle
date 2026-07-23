// Integration smoke test for the Expedition flow. Loads the real bundle in
// jsdom with a mocked PokéAPI (so no network), then drives: New Expedition →
// pick starter → map renders with reachable nodes → click a node → a battle
// begins. This exercises the run/controller wiring end-to-end head-lessly.

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const bundle = fs.readFileSync(path.join(root, "dist", "bundle.js"), "utf8");

const dom = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true, url: "http://localhost/" });
const { window } = dom;

// ---- canned PokéAPI ----
const MON = (id, name) => ({
  id, name,
  base_experience: 64,
  stats: [
    { stat: { name: "hp" }, base_stat: 50 },
    { stat: { name: "attack" }, base_stat: 50 },
    { stat: { name: "defense" }, base_stat: 50 },
    { stat: { name: "special-attack" }, base_stat: 50 },
    { stat: { name: "special-defense" }, base_stat: 50 },
    { stat: { name: "speed" }, base_stat: 50 },
  ],
  types: [{ type: { name: "normal" } }],
  cries: { latest: "http://x/cry.ogg" },
  sprites: {
    front_default: "f.png", back_default: "b.png",
    versions: { "generation-v": { "black-white": { animated: { front_default: "af.gif", back_default: "ab.gif" } } } },
    other: { "official-artwork": { front_default: "art.png" } },
  },
  moves: [{
    move: { name: "tackle", url: "http://x/api/v2/move/33/" },
    version_group_details: [{ version_group: { name: "red-blue" }, move_learn_method: { name: "level-up" }, level_learned_at: 1 }],
  }],
});
const MOVE = {
  name: "tackle", generation: { name: "generation-i" }, damage_class: { name: "physical" },
  power: 40, accuracy: 100, pp: 35, priority: 0, type: { name: "normal" },
  target: { name: "selected-pokemon" }, stat_changes: [], meta: { category: { name: "damage" } },
};
const SPECIES = { id: 1, capture_rate: 45, growth_rate: { url: "http://x/api/v2/growth-rate/1/" }, evolution_chain: { url: "http://x/api/v2/evolution-chain/1/" } };
const GROWTH = { levels: [{ level: 1, experience: 0 }, { level: 5, experience: 100 }, { level: 6, experience: 150 }] };
const EVO = { chain: { species: { name: "bulbasaur" }, evolves_to: [] } };

function canned(url) {
  if (url.includes("/pokemon-species/")) return SPECIES;
  if (url.includes("/growth-rate/")) return GROWTH;
  if (url.includes("/evolution-chain/")) return EVO;
  if (url.includes("/move/")) return MOVE;
  if (url.includes("/pokemon/")) {
    const m = url.match(/\/pokemon\/([^/?]+)/);
    const key = m ? m[1] : "1";
    const id = parseInt(key, 10) || 1;
    return MON(id, isNaN(parseInt(key, 10)) ? key : "mon" + id);
  }
  return {};
}

// ---- stubs ----
const ctxStub = new Proxy({}, { get: () => () => ({}) });
window.HTMLCanvasElement.prototype.getContext = () => ctxStub;
window.Element.prototype.animate = () => ({ finished: Promise.resolve(), addEventListener() {}, cancel() {} });
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
window.matchMedia = () => ({ matches: true, addEventListener() {}, addListener() {}, removeEventListener() {} }); // instant typewriter
window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
// Image stub that fires onload (so the Poké Ball throw animation resolves).
window.Image = class {
  set src(_) { setTimeout(() => { if (this.onload) this.onload(); }, 0); }
  get width() { return 1; }
  get height() { return 1; }
};
window.fetch = (url) => Promise.resolve({ ok: true, clone() { return this; }, json: async () => canned(String(url)), blob: async () => ({}) });

let uncaught = null;
window.addEventListener("error", (e) => (uncaught = e.error || e.message));
process.on("unhandledRejection", (e) => (uncaught = e && (e.stack || e.message) || e));

console.log("expedition integration smoke");
window.eval(bundle);
window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
const doc = window.document;

const waitFor = (cond, ms = 9000) => new Promise((resolve, reject) => {
  const t0 = Date.now();
  const tick = () => {
    let ok = false;
    try { ok = cond(); } catch (_) { ok = false; }
    if (ok) return resolve();
    if (Date.now() - t0 > ms) return reject(new Error("timeout waiting for condition"));
    setTimeout(tick, 40);
  };
  tick();
});

(async () => {
  try {
    doc.getElementById("newGameBtn").click();
    await waitFor(() => doc.getElementById("starterView") && doc.querySelectorAll("#starterView button.move-btn").length === 3);
    console.log("  ✓ starter picker shown");

    // Pick the first starter → builds the mon (mocked API) → starts the Expedition.
    doc.querySelector("#starterView button.move-btn").click();
    await waitFor(() => {
      const map = doc.getElementById("mapScreen");
      return map && !map.classList.contains("hidden") && doc.querySelectorAll("#mapCanvas .map-node").length > 0;
    });
    console.log("  ✓ expedition started, map rendered");

    const avail = doc.querySelectorAll("#mapCanvas .map-node.available");
    assert.ok(avail.length >= 1, "at least one reachable node");
    assert.strictEqual(doc.querySelectorAll("#mapCanvas .map-region").length, 3, "three themed overworld regions");
    assert.ok(doc.querySelector(".biome-verdant") && doc.querySelector(".biome-crimson") && doc.querySelector(".biome-indigo"), "all biome themes rendered");
    assert.ok(avail[0].querySelector(".node-mark") && avail[0].querySelector(".node-name"), "landmark node is structured");
    await waitFor(() => doc.querySelectorAll("#mapCanvas .map-edges path").length > 0);
    assert.ok(/Wilds/.test(doc.getElementById("mapRegionTitle").textContent), "current region named");
    // Run HUD populated.
    assert.ok(/Region/.test(doc.getElementById("runHud").textContent), "run HUD shows region");
    console.log("  ✓ reachable nodes + run HUD (" + avail.length + " available)");

    // Resume this persisted run with combat Sigils to exercise the complete
    // run -> aggregateSigils -> controller battle-context path.
    const stored = JSON.parse(window.localStorage.getItem("pkbattle:run:v1"));
    stored.sigils = ["permafrost", "toxic_spikes"];
    window.localStorage.setItem("pkbattle:run:v1", JSON.stringify(stored));
    doc.getElementById("continueBtn").click();

    // Travel to the first available node → a battle (or node) should resolve,
    // hiding the map. (Row-0 nodes are always Wild battles.)
    doc.querySelector("#mapCanvas .map-node.available").click();
    await waitFor(() => doc.getElementById("mapScreen").classList.contains("hidden"));
    console.log("  ✓ selecting a node leaves the map");

    // A wild battle should spin up: enemy name populated, menu reachable.
    await waitFor(() => (doc.getElementById("enemyName").textContent || "").length > 1);
    console.log("  ✓ wild battle started (" + doc.getElementById("enemyName").textContent + ")");

    // Enable auto-play and let it fight the battle to a finish, which must
    // return control to the map (exercises onEnemyFaint → afterBattleWin →
    // goToMap, the core resolution loop).
    assert.strictEqual(doc.getElementById("weatherIndicator").textContent, "Hail", "active weather shown");
    assert.ok(!doc.getElementById("weatherIndicator").classList.contains("hidden"), "weather indicator visible");
    assert.strictEqual(doc.getElementById("enemyStatus").textContent, "PSN", "Toxic Spikes applied on entry");
    console.log("  sigils reached battle context + HUD");

    const auto = doc.getElementById("autoToggle");
    auto.checked = true;
    auto.dispatchEvent(new window.Event("change"));
    await waitFor(() => !doc.getElementById("mapScreen").classList.contains("hidden"), 25000);
    console.log("  ✓ auto-played the battle back to the map");

    assert.ok(!uncaught, "no uncaught error: " + uncaught);
    console.log("\nexpedition integration smoke passed");
    process.exit(0);
  } catch (e) {
    console.error("  ✗ " + (e && e.message));
    if (uncaught) console.error("  uncaught: " + uncaught);
    process.exit(1);
  }
})();
