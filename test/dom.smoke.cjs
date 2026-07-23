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
assert.ok(doc.getElementById("titleScreen"), "title screen present");
assert.ok(doc.getElementById("newGameBtn"), "new game button present");
console.log("  ✓ title screen rendered");

// Title should start visible (not hidden).
assert.ok(!doc.getElementById("titleScreen").classList.contains("hidden"), "title visible at boot");

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
    const modal = doc.getElementById("modal");
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
