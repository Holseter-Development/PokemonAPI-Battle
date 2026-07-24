// ui.js - low-level DOM helpers, panel switching and the typewriter text
// renderer used by the message box.

export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => Array.from(document.querySelectorAll(sel));

export function el(tag, attrs = {}, txt = "") {
  const x = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") x.className = v;
    else if (k === "html") x.innerHTML = v;
    else x.setAttribute(k, v);
  }
  if (txt) x.textContent = txt;
  return x;
}

// Toggle which sub-panel of the message box is visible. "none" hides all.
export function show(view) {
  const map = {
    menu: "#menu", moves: "#movesView", swap: "#swapView",
    bag: "#bagView", box: "#boxView",
  };
  for (const [name, sel] of Object.entries(map)) {
    const node = $(sel);
    if (node) node.classList.toggle("hidden", view !== name);
  }
}

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let typeToken = 0;

// Typewriter render into #textContent. Returns a promise that resolves when the
// full string is shown. A newer call cancels an in-flight one instantly.
export function typeText(str, opts = {}) {
  const target = document.getElementById("textContent");
  const caret = document.querySelector("#textLine .caret");
  if (!target) return Promise.resolve();
  const token = ++typeToken;
  const speed = opts.speed ?? 16;
  if (caret) caret.classList.remove("on");
  if (reduceMotion || opts.instant) {
    target.textContent = str;
    if (caret) caret.classList.add("on");
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    target.textContent = "";
    let i = 0;
    const step = () => {
      if (token !== typeToken) return resolve(); // superseded
      target.textContent = str.slice(0, i);
      i++;
      if (i <= str.length) setTimeout(step, speed);
      else {
        if (caret) caret.classList.add("on");
        resolve();
      }
    };
    step();
  });
}

// Instant, non-blocking status text (used for HUD-adjacent quick lines).
export function setText(str) {
  const target = document.getElementById("textContent");
  if (target) target.textContent = str;
}
