export function show(view) {
  $("#starterPick").classList.toggle("hidden", view !== "starter");
  $("#menu").classList.toggle("hidden", view !== "menu");
  $("#movesView").classList.toggle("hidden", view !== "moves");
  $("#swapView").classList.toggle("hidden", view !== "swap");
  const bv = $("#bagView");
  if (bv) bv.classList.toggle("hidden", view !== "bag");
  const bxv = $("#boxView");
  if (bxv) bxv.classList.toggle("hidden", view !== "box");
}

export function text(t) {
  const el = document.getElementById("textLine");
  if (el) el.textContent = t;
}
