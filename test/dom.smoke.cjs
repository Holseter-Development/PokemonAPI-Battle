// DOM smoke test: load the real index.html + built bundle inside jsdom, stub
// the browser APIs jsdom lacks, and drive the title → starter-picker flow.
// Verifies module-load, boot() wiring and menu switching don't throw — the
// integration coverage the pure engine tests can't provide.

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const bundle = fs.readFileSync(path.join(root, "dist", "bundle.js"), "utf8");

const dom = new JSDOM(html, {
  runScripts: "outside-only",
  pretendToBeVisual: true,
  url: "http://localhost/",
});
const { window } = dom;

// --- stub the APIs jsdom doesn't implement ---
const ctxStub = new Proxy({}, { get: () => () => ({}) });
window.HTMLCanvasElement.prototype.getContext = () => ctxStub;
window.Element.prototype.animate = () => ({
  finished: Promise.resolve(),
  addEventListener: () => {},
  cancel: () => {},
  onfinish: null,
});
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
if (!window.matchMedia) {
  window.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {}, removeEventListener() {} });
}
window.fetch = () => Promise.reject(new Error("network disabled in smoke test"));
window.Image = class { set src(_) {} };
window.localStorage.setItem("pkbattle:meta:v1", JSON.stringify({
  fragments: 1000,
  expeditionsWon: 2,
  startingSigils: ["ball_cache"],
}));
window.localStorage.setItem("pkbattle:vault:v1", JSON.stringify([
  { id: 25, name: "Pikachu" },
]));

let uncaught = null;
window.addEventListener("error", (e) => (uncaught = e.error || e.message));

console.log("dom smoke test");

// --- evaluate the bundle (runs top-level IIFEs + boot) ---
window.eval(bundle);
// The bundle defers boot() to DOMContentLoaded while the parser is active
// (readyState "loading"), exactly as in a real browser. Fire it now.
window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
console.log("  ✓ bundle evaluates and boots without throwing");

const doc = window.document;
const migratedMeta = JSON.parse(window.localStorage.getItem("pkbattle:meta:v2"));
assert.strictEqual(migratedMeta.version, 2, "legacy meta migrated to v2");
assert.strictEqual(migratedMeta.fragments, 1000, "legacy fragments retained");
assert.strictEqual(migratedMeta.expeditionsWon, 2, "legacy wins retained");
assert.strictEqual(migratedMeta.expeditionsStarted, 2, "legacy starts normalized against wins");
assert.deepStrictEqual(migratedMeta.startingSigils, ["ball_cache"], "unknown legacy fields retained");
assert.deepStrictEqual(migratedMeta.seen, [25], "legacy Vault species backfilled as seen");
assert.deepStrictEqual(migratedMeta.caught, [25], "legacy Vault species backfilled as caught");
assert.ok(doc.getElementById("titleScreen"), "title screen present");
assert.ok(doc.getElementById("newGameBtn"), "new game button present");
console.log("  ✓ title screen rendered");

// Title should start visible (not hidden).
assert.ok(!doc.getElementById("titleScreen").classList.contains("hidden"), "title visible at boot");

// Account-level collection and upgrade surfaces are reachable before a run.
doc.getElementById("pokedexBtn").click();
let modal = doc.getElementById("modal");
assert.ok(!modal.classList.contains("hidden") && modal.classList.contains("modal-wide"), "Pokédex opens in a wide modal");
assert.strictEqual(doc.querySelectorAll(".dex-entry").length, 151, "Pokédex renders the full Gen-1 index");
assert.match(doc.querySelector(".dex-summary").textContent, /1Caught/, "legacy Vault catch appears in summary");
assert.match(doc.querySelector(".dex-milestone").textContent, /Explorer Grant/, "next permanent perk is shown");
doc.querySelector('.dex-filter[data-filter="caught"]').click();
assert.strictEqual(doc.querySelectorAll(".dex-entry").length, 1, "caught filter narrows the index");
assert.strictEqual(doc.querySelector(".dex-entry").dataset.id, "25", "caught Pikachu is the filtered entry");
doc.querySelector(".dex-close").click();
assert.ok(modal.classList.contains("hidden"), "Pokédex closes");

doc.getElementById("upgradesBtn").click();
assert.ok(!modal.classList.contains("hidden") && modal.classList.contains("modal-wide"), "Fragment Lab opens");
assert.strictEqual(doc.querySelectorAll(".upgrade-card").length, 5, "all permanent upgrades render");
assert.match(doc.querySelector(".upgrade-balance").textContent, /1000/, "Fragment balance is visible");
const upgradeCard = (name) => [...doc.querySelectorAll(".upgrade-card")]
  .find((card) => card.querySelector("h3").textContent === name);
assert.strictEqual(upgradeCard("Field Kit II").querySelector(".upgrade-buy").textContent, "Locked", "Level II starts prerequisite-locked");
const buyUpgrade = (name) => {
  let button = upgradeCard(name).querySelector(".upgrade-buy");
  assert.ok(!button.disabled, name + " is affordable");
  button.click();
  button = upgradeCard(name).querySelector(".upgrade-buy");
  assert.match(button.textContent, /Confirm/, name + " requires confirmation");
  button.click();
  assert.strictEqual(upgradeCard(name).querySelector(".upgrade-buy").textContent, "Owned", name + " becomes permanent");
};
["Field Kit I", "Ball Satchel I", "Travel Fund I", "Field Kit II", "Ball Satchel II"].forEach(buyUpgrade);
assert.match(doc.querySelector(".upgrade-balance").textContent, /150/, "exact purchase costs are deducted");
assert.strictEqual(doc.querySelectorAll(".upgrade-card.owned").length, 5, "maxed Lab shows every upgrade as owned");
const purchasedMeta = JSON.parse(window.localStorage.getItem("pkbattle:meta:v2"));
assert.strictEqual(Object.values(purchasedMeta.upgrades).filter(Boolean).length, 5, "purchases persist immediately");
doc.querySelector(".upgrade-close").click();
console.log("  ✓ Pokédex filters and Fragment Lab render from migrated progression");

// Trainer Profile summarizes account identity and reflects earned upgrades.
doc.getElementById("profileBtn").click();
assert.ok(!modal.classList.contains("hidden") && modal.classList.contains("modal-wide"), "Trainer Profile opens in a wide modal");
const profileStats = [...doc.querySelectorAll(".profile-stat")].map((card) => card.textContent);
assert.ok(profileStats.some((text) => /2 \/ 2/.test(text)), "won/started reflects legacy wins");
assert.ok(profileStats.some((text) => /100%/.test(text)), "win rate derives from legacy record");
assert.ok(profileStats.some((text) => /Playtime/.test(text)), "playtime stat is present");
assert.ok(profileStats.some((text) => /1 \/ 151/.test(text)), "Pokédex completion reflects backfilled catch");
assert.strictEqual(doc.querySelectorAll(".profile-upgrades li").length, 5, "purchased upgrades are listed");
assert.ok(/Champion/.test(doc.querySelector(".profile-badges").textContent), "Champion badge shows for a prior win");
doc.querySelector(".profile-close").click();
assert.ok(modal.classList.contains("hidden"), "Trainer Profile closes");
console.log("  ✓ Trainer Profile renders account statistics and rewards");

// --- click "New Adventure" and let the async flow settle ---
const staleEnemy = doc.getElementById("enemySprite");
staleEnemy.setAttribute("src", "old-battle.png");
staleEnemy.dataset.src = "old-battle.png";
doc.getElementById("newGameBtn").click();

setTimeout(() => {
  try {
    assert.ok(doc.getElementById("titleScreen").classList.contains("hidden"), "title hidden after new game");
    const starter = doc.getElementById("starterScreen");
    assert.ok(starter && !starter.classList.contains("hidden"), "standalone starter screen shown");
    const btns = starter.querySelectorAll("button.starter-card");
    assert.strictEqual(btns.length, 3, "three starter buttons");
    btns.forEach((btn) => {
      const sprite = btn.querySelector(".starter-art img");
      assert.ok(sprite && /animated/.test(sprite.getAttribute("src")), "starter uses animated front sprite");
      assert.ok(btn.querySelector(".starter-type"), "starter type is visible");
    });
    assert.ok(doc.querySelector(".screen").classList.contains("starter-mode"), "starter uses its own presentation");
    assert.ok(!staleEnemy.hasAttribute("src"), "old battle sprite cleared on restart");
    assert.strictEqual(staleEnemy.style.opacity, "0", "old battle sprite stays hidden");
    console.log("  ✓ new expedition reveals 3-starter picker");

    // Expedition map overlay exists and starts hidden.
    const map = doc.getElementById("mapScreen");
    assert.ok(map && doc.getElementById("mapCanvas") && doc.getElementById("runHud"), "map screen present");
    assert.ok(doc.getElementById("trainerIntro") && doc.getElementById("enemyTrainerBadge"), "trainer presentation shell present");
    assert.ok(doc.getElementById("mapScroll") && doc.querySelector(".map-route-bar"), "overworld route shell present");
    assert.ok(doc.querySelector(".map-compass") && doc.querySelectorAll(".legend-node").length === 6, "map landmarks present");
    assert.ok(map.classList.contains("hidden"), "map hidden pre-run");
    console.log("  ✓ expedition map overlay present");

    // Menu command buttons are wired and use SVG icons (no emoji).
    ["fightBtn", "ballInfoBtn", "swapBtn", "runBtn"].forEach((id) => {
      const btn = doc.getElementById(id);
      assert.ok(btn, id + " present");
      assert.ok(btn.querySelector("svg use"), id + " uses an SVG icon");
    });
    console.log("  ✓ battle menu commands present with SVG icons");

    // Ranked Arena entry opens a modal (offline placeholder) without a team.
    const arenaBtn = doc.getElementById("arenaBtn");
    assert.ok(arenaBtn, "arena button present");
    arenaBtn.click();
    modal = doc.getElementById("modal");
    assert.ok(modal && !modal.classList.contains("hidden"), "arena modal opens");
    assert.ok(/Arena/i.test(doc.getElementById("modalTitle").textContent), "arena modal titled");
    console.log("  ✓ ranked arena entry opens");

    assert.strictEqual(uncaught, null, "no uncaught window error: " + uncaught);
    console.log("\ndom smoke passed");
    process.exit(0);
  } catch (e) {
    console.error("  ✗ " + e.message);
    process.exit(1);
  }
}, 1400);
