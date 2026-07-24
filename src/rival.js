// rival.js - the recurring rival (P2.5). Pure and deterministic: given the
// player's starter and a checkpoint index it produces the rival's identity and
// team, so a seed + path reproduces every rival encounter and the Champion team
// reflects the rival's grown starter. No DOM, no network, no battle logic - the
// controller turns these descriptors into real Pokémon and battles.

export const RIVAL_NAME = "Blue";
export const RIVAL_TITLE = "Rival";
export const RIVAL_SPRITE = "assets/sprites/silver.png";

// Evolution lines for the three possible rival starters (fire / water / grass).
const STARTER_LINES = {
  4: [4, 5, 6], // Charmander → Charmeleon → Charizard
  7: [7, 8, 9], // Squirtle → Wartortle → Blastoise
  1: [1, 2, 3], // Bulbasaur → Ivysaur → Venusaur
};

// The rival always chooses the starter that beats the player's. Bulbasaur(grass)
// loses to fire, Charmander(fire) to water, Squirtle(water) to grass. The bonus
// starters (Pikachu/Eevee) map to a sensible strong counter-pick so all five
// player starters resolve to a real rival starter line.
const COUNTER = {
  1: 4,   // player grass  → rival fire
  4: 7,   // player fire   → rival water
  7: 1,   // player water  → rival grass
  25: 1,  // player Pikachu (electric) → rival grass (grass resists electric)
  133: 7, // player Eevee (normal)     → rival water
};

// Base type of the rival's chosen starter line, keyed by the base species id.
export const RIVAL_STARTER_TYPE = { 4: "fire", 7: "water", 1: "grass" };

const STARTER_FINALS = [3, 6, 9];

export function rivalStarterFor(playerStarterId) {
  return COUNTER[Number(playerStarterId)] || 4;
}

export function rivalStarterType(playerStarterId) {
  return RIVAL_STARTER_TYPE[rivalStarterFor(playerStarterId)] || "fire";
}

// Species id of the rival starter at an evolution stage (0..2), clamped so a
// bad/out-of-range stage is safe.
export function rivalStarterAtStage(starterBaseId, stage) {
  const line = STARTER_LINES[Number(starterBaseId)] || STARTER_LINES[4];
  const s = Math.max(0, Math.min(line.length - 1, Math.floor(Number(stage) || 0)));
  return line[s];
}

// Three authored rival checkpoints, one per region. Each names the starter's
// evolution stage and a filler roster of non-legendary Kanto staples that grows
// with depth. The filler broadly mirrors a well-rounded team without copying the
// player's exact mutations.
export const RIVAL_CHECKPOINTS = [
  { stage: 0, filler: [16] },         // region 1: starter + Pidgey
  { stage: 1, filler: [17, 19] },     // region 2: evolved starter + Pidgeotto, Rattata
  { stage: 2, filler: [18, 20, 58] }, // region 3: final starter + Pidgeot, Raticate, Growlithe
];

export function rivalCheckpointCount() {
  return RIVAL_CHECKPOINTS.length;
}

// Species ids for the rival's team at a checkpoint. The starter (at the
// checkpoint's stage) leads; the authored filler follows. Deterministic and
// RNG-free, so a save/continue rebuilds the identical team.
export function rivalTeamIds(playerStarterId, checkpointIndex) {
  const idx = Math.max(0, Math.min(RIVAL_CHECKPOINTS.length - 1, Math.floor(Number(checkpointIndex) || 0)));
  const cp = RIVAL_CHECKPOINTS[idx];
  const starter = rivalStarterAtStage(rivalStarterFor(playerStarterId), cp.stage);
  return [starter, ...cp.filler];
}

// The rival's Champion team: replace the fixed starter-final slot in the base
// Champion roster with the rival's own fully-evolved starter, so the Champion
// always fields the line they picked to counter the player.
export function championTeamIds(baseTeam, playerStarterId) {
  const finalStarter = rivalStarterAtStage(rivalStarterFor(playerStarterId), 2);
  const team = [...(baseTeam || [])];
  if (team.includes(finalStarter)) return team; // already fielded; nothing to swap
  const slot = team.findIndex((id) => STARTER_FINALS.includes(id));
  if (slot >= 0) team[slot] = finalStarter;
  else if (team.length) team[team.length - 1] = finalStarter;
  return team;
}

const INTROS = [
  "Blue smirks. \"Heh, still playing catch-up? Let's see what you've really got!\"",
  "Blue is back. \"You've gotten stronger - but so have I. Come on!\"",
  "Blue blocks the summit path. \"This ends here. I'm going to be Champion, not you!\"",
];

export function rivalIntro(checkpointIndex) {
  const i = Math.max(0, Math.min(INTROS.length - 1, Math.floor(Number(checkpointIndex) || 0)));
  return INTROS[i];
}

// Build the rival "boss" descriptor the controller feeds into startBattle. Shape
// mirrors GYMS/CHAMPION (leader/title/type/sprite/team/intro) so the existing
// trainer-battle path renders it with no special-casing.
export function rivalEncounter(playerStarterId, checkpointIndex) {
  return {
    leader: RIVAL_NAME,
    title: RIVAL_TITLE,
    type: rivalStarterType(playerStarterId),
    sprite: RIVAL_SPRITE,
    team: rivalTeamIds(playerStarterId, checkpointIndex),
    checkpoint: checkpointIndex,
    intro: rivalIntro(checkpointIndex),
    meta: "Your rival blocks the path!",
  };
}
