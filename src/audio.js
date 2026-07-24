import { fetchPokemon } from "./api.js";

// Audio is routed through a Web Audio master gain node. This is the one path
// that lets us control volume + mute on iOS Safari, which ignores script-set
// HTMLMediaElement.volume. Same-origin media (music, local SFX) is routed
// through the graph; cross-origin cries fall back to element playback.

export let isMuted = false;
let sfxVolume = 0.2;

let audioCtx = null;
let masterGain = null;
const routed = new WeakSet();

// True once the user has unlocked audio and music is meant to be playing. Lets
// us pause music in the background and resume it on return without ever
// starting it before the first gesture (which autoplay policies would block).
let musicWanted = false;

function getMusic() {
  return document.getElementById("battleMusic");
}

function ensureCtx() {
  if (audioCtx) return audioCtx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = isMuted ? 0 : sfxVolume;
    masterGain.connect(audioCtx.destination);
  } catch (_) {
    audioCtx = null;
  }
  return audioCtx;
}

function applyGain() {
  if (masterGain) {
    try {
      masterGain.gain.value = isMuted ? 0 : sfxVolume;
    } catch (_) {}
  }
}

// Route a same-origin element through the master gain, exactly once.
function route(el) {
  if (!ensureCtx() || routed.has(el)) return routed.has(el);
  try {
    const src = audioCtx.createMediaElementSource(el);
    src.connect(masterGain);
    routed.add(el);
  } catch (_) {
    /* cross-origin or already-connected — element plays on its own */
  }
  return routed.has(el);
}

// Play an element, resuming the context on the current user gesture. When the
// element is routed through the gain node its intrinsic volume is left at 1 so
// gain is the single source of truth; unrouted elements use element volume.
function playEl(el, { useGraph = true } = {}) {
  if (useGraph) {
    ensureCtx();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    const isRouted = route(el);
    el.volume = isRouted ? 1 : sfxVolume;
  } else {
    el.volume = sfxVolume;
  }
  el.muted = isMuted;
  return el.play();
}

// Music plays directly on the element (not through the Web Audio graph) so it
// starts reliably on the first gesture on iOS, where a suspended AudioContext
// would otherwise leave a routed element silent until some later sound resumed
// the context.
function startMusic() {
  const music = getMusic();
  if (!music) return;
  musicWanted = true;
  if (isMuted || document.hidden) return;
  if (music.paused) playEl(music, { useGraph: false }).catch(() => {});
}

function pauseMusic() {
  const music = getMusic();
  if (music && !music.paused) {
    try {
      music.pause();
    } catch (_) {}
  }
}

export function setMuted(v) {
  isMuted = !!v;
  const music = getMusic();
  if (music) {
    music.muted = isMuted; // honored on iOS
    if (isMuted) pauseMusic();
    else startMusic();
  }
  applyGain();
  updateMuteIcons();
}

export function setVolume(v) {
  sfxVolume = Math.max(0, Math.min(1, isNaN(v) ? sfxVolume : v));
  const music = getMusic();
  if (music && !routed.has(music)) music.volume = sfxVolume;
  applyGain();
  syncVolumeSliders();
}

// Maps API move names (e.g., "hydro-pump") to your sound file names.
const ATTACK_SFX_MAP = {
  absorb: "Absorb.wav",
  acid: "Acid.wav",
  "acid-armor": "AcidArmor.wav",
  agility: "Agility.wav",
  amnesia: "Amnesia.wav",
  "aurora-beam": "AuroraBeam.wav",
  barrage: "Barrage.wav",
  barrier: "Barrier.wav",
  bide: "Bide.wav",
  bind: "Bind.wav",
  bite: "Bite.wav",
  blizzard: "Blizzard.wav",
  "body-slam": "BodySlam.wav",
  "bone-club": "BoneClub.wav",
  bonemerang: "Bonemerang.wav",
  bubble: "Bubble.wav",
  "bubble-beam": "Bubblebeam.wav",
  clamp: "Clamp.wav",
  "comet-punch": "CometPunch.wav",
  "confuse-ray": "ConfuseRay.wav",
  confusion: "Confusion.wav",
  constrict: "Constrict.wav",
  conversion: "Conversion.wav",
  counter: "Counter.wav",
  crabhammer: "Crabhammer.wav",
  cut: "Cut.wav",
  "defense-curl": "DefenseCurl.wav",
  dig: "Dig.wav",
  disable: "Disable.wav",
  "dizzy-punch": "DizzyPunch.wav",
  "double-edge": "DoubleEdge.wav",
  "double-kick": "DoubleKick.wav",
  "double-slap": "DoubleSlap.wav",
  "double-team": "DoubleTeam.wav",
  "dragon-rage": "DragonRage.wav",
  "dream-eater": "DreamEater.wav",
  "drill-peck": "DrillPeck.wav",
  earthquake: "Earthquake.wav",
  "egg-bomb": "EggBomb.wav",
  ember: "Ember.wav",
  explosion: "Explosion.wav",
  "fire-blast": "FireBlast.wav",
  "fire-punch": "FirePunch.wav",
  "fire-spin": "FireSpin.wav",
  fissure: "Fissure.wav",
  flamethrower: "Flamethrower.wav",
  flash: "Flash.wav",
  fly: "FlyUp.wav", // Using FlyUp for the start of the move
  "focus-energy": "FocusEnergy.wav",
  "fury-attack": "FuryAttack.wav",
  "fury-swipes": "FurySwipes.wav",
  glare: "Glare.wav",
  growth: "Growth.wav",
  guillotine: "Guillotine.wav",
  gust: "Gust.wav",
  harden: "Harden.wav",
  haze: "Haze.wav",
  headbutt: "Headbutt.wav",
  "high-jump-kick": "HighJumpKick.wav",
  "horn-attack": "HornAttack.wav",
  "horn-drill": "HornDrill.wav",
  "hydro-pump": "HydroPump.wav",
  "hyper-beam": "HyperBeam.wav",
  "hyper-fang": "HyperFang.wav",
  hypnosis: "Hypnosis.wav",
  "ice-beam": "IceBeam.wav",
  "ice-punch": "IcePunch.wav",
  "jump-kick": "JumpKick.wav",
  "karate-chop": "KarateChop.wav",
  kinesis: "Kinesis.wav",
  "leech-life": "LeechLife.wav",
  "leech-seed": "LeechSeed.wav",
  leer: "Leer.wav",
  lick: "Lick.wav",
  "light-screen": "LightScreen.wav",
  "lovely-kiss": "LovelyKiss.wav",
  "low-kick": "LowKick.wav",
  meditate: "Meditate.wav",
  "mega-drain": "MegaDrain.wav",
  "mega-kick": "MegaKick.wav",
  "mega-punch": "MegaPunch.wav",
  metronome: "Metronome.wav",
  mimic: "Mimic1.wav",
  minimize: "Minimize.wav",
  mist: "Mist.wav",
  "night-shade": "NightShade.wav",
  "pay-day": "Payday.wav",
  peck: "Peck.wav",
  "petal-dance": "PetalDance.wav",
  "pin-missile": "SpikeCannon.wav", // Using a similar sound
  "poison-gas": "PoisonGas.wav",
  "poison-powder": "PoisonPowder.wav",
  "poison-sting": "PoisonSting.wav",
  pound: "Pound.wav",
  psybeam: "Psybeam.wav",
  psychic: "Psychic.wav",
  psywave: "Psywave.wav",
  "quick-attack": "QuickAttack.wav",
  rage: "Rage.wav",
  "razor-leaf": "RazorLeaf.wav",
  "razor-wind": "RazorWind.wav",
  recover: "Recover.wav",
  reflect: "Reflect.wav",
  rest: "Rest.wav",
  "rock-slide": "RockSlide.wav",
  "rock-throw": "RockThrow.wav",
  "rolling-kick": "RollingKick.wav",
  "sand-attack": "SandAttack.wav",
  scratch: "Scratch.wav",
  screech: "Screech.wav",
  "seismic-toss": "SeismicToss.wav",
  "self-destruct": "SelfDestruct.wav",
  sharpen: "Sharpen.wav",
  sing: "Sing.wav",
  "skull-bash": "SkullBash.wav",
  "sky-attack": "SkyAttack.wav",
  slam: "Slam.wav",
  slash: "Slash.wav",
  "sleep-powder": "SleepPowder.wav",
  sludge: "Sludge.wav",
  smog: "Smog.wav",
  smokescreen: "SmokeScreen.wav",
  "soft-boiled": "Softboiled.wav",
  "solar-beam": "SolarBeam.wav",
  "sonic-boom": "Sonicboom.wav",
  "spike-cannon": "SpikeCannon.wav",
  splash: "Splash.wav",
  spore: "Spore.wav",
  stomp: "Stomp.wav",
  strength: "Strength.wav",
  "string-shot": "StringShot.wav",
  struggle: "Struggle.wav",
  "stun-spore": "StunSpore.wav",
  submission: "Submission.wav",
  substitute: "Substitute.wav",
  "super-fang": "SuperFang.wav",
  supersonic: "Supersonic.wav",
  surf: "Surf.wav",
  swift: "Swift.wav",
  "swords-dance": "SwordsDance.wav",
  tackle: "Tackle.wav",
  "tail-whip": "TailWhip.wav",
  "take-down": "TakeDown.wav",
  teleport: "Teleport.wav",
  thrash: "Thrash.wav",
  thunder: "Thunder.wav",
  thunderbolt: "Thunderbolt.wav",
  "thunder-punch": "ThunderPunch.wav",
  "thunder-shock": "ThunderShock.wav",
  "thunder-wave": "ThunderWave.wav",
  toxic: "Toxic.wav",
  transform: "Transform.wav",
  "tri-attack": "TriAttack.wav",
  "twin-needle": "TwinNeedle.wav",
  "vice-grip": "ViceGrip.wav",
  "vine-whip": "VineWhip.wav",
  waterfall: "Waterfall.wav",
  "water-gun": "WaterGun.wav",
  whirlwind: "Whirlwind.wav",
  "wing-attack": "WingAttack.wav",
  withdraw: "Withdraw.wav",
  wrap: "Wrap.wav",
};

// Generic sounds for moves that don't have a specific file.
const GENERIC_SFX_MAP = {
  punch: "FirePunch.wav",
  kick: "DoubleKick.wav",
  hit: "Tackle.wav",
  beam: "AuroraBeam.wav",
};

export function playSfx(move) {
  if (isMuted) return;

  const moveKey = move.key;
  let sfxFile = ATTACK_SFX_MAP[moveKey];

  // If no specific sound, try to find a generic one
  if (!sfxFile) {
    if (move.name.includes("Punch")) sfxFile = GENERIC_SFX_MAP.punch;
    else if (move.name.includes("Kick")) sfxFile = GENERIC_SFX_MAP.kick;
    else if (move.name.includes("Beam")) sfxFile = GENERIC_SFX_MAP.beam;
    else sfxFile = GENERIC_SFX_MAP.hit; // Default fallback
  }

  const sound = new Audio(`assets/sfx/attacks/${sfxFile}`);
  playEl(sound).catch(() => {});
}

// Play a one-off sound file (same-origin) through the gain graph.
export function playFile(url) {
  if (isMuted) return;
  try {
    playEl(new Audio(url)).catch(() => {});
  } catch (_) {}
}

// The same controls live in two places (the top bar and the main-menu title
// screen), so mute/volume state is mirrored across every matching control.
function updateMuteIcons() {
  document.querySelectorAll("[data-mute-btn]").forEach((btn) => {
    const use = btn.querySelector("use");
    if (use) use.setAttribute("href", isMuted ? "#i-volume-off" : "#i-volume");
    btn.setAttribute("aria-pressed", String(isMuted));
    btn.title = isMuted ? "Unmute" : "Mute";
  });
}

function syncVolumeSliders() {
  document.querySelectorAll("[data-volume-slider]").forEach((slider) => {
    if (document.activeElement !== slider) slider.value = String(sfxVolume);
  });
}

export function initAudio() {
  const muteButtons = Array.from(document.querySelectorAll("[data-mute-btn]"));
  const volumeSliders = Array.from(document.querySelectorAll("[data-volume-slider]"));

  const firstSlider = volumeSliders[0];
  if (firstSlider) sfxVolume = parseFloat(firstSlider.value) || sfxVolume;

  // Unlock + start the music on the first real user gesture (required by
  // autoplay policies, and to create/resume the AudioContext on iOS).
  const unlock = () => {
    ensureCtx();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    startMusic();
    events.forEach((ev) => document.removeEventListener(ev, unlock));
  };
  const events = ["pointerdown", "touchstart", "keydown", "click"];
  events.forEach((ev) => document.addEventListener(ev, unlock, { passive: true }));

  muteButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      setMuted(!isMuted);
    });
  });
  updateMuteIcons();

  volumeSliders.forEach((slider) => {
    slider.value = String(sfxVolume);
    slider.addEventListener("input", () => {
      setVolume(parseFloat(slider.value));
      if (sfxVolume > 0 && isMuted) setMuted(false);
    });
  });

  // Never let the music keep playing in the background. When the tab is hidden,
  // the phone is locked, or the page is being closed/navigated away, pause it
  // (this is what stops iOS from continuing playback on the lock screen) and
  // suspend the audio graph. Resume both when the page returns to the foreground.
  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      pauseMusic();
      if (audioCtx && audioCtx.state === "running") audioCtx.suspend().catch(() => {});
    } else {
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      if (musicWanted && !isMuted) startMusic();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", pauseMusic);
  window.addEventListener("freeze", pauseMusic);

  // Prime element state.
  setVolume(sfxVolume);
}
// --- END AUDIO SYSTEM ---
const CRY_CACHE = new Map();

export async function getCryAudio(id, hintUrl) {
  try {
    if (CRY_CACHE.has(id)) return CRY_CACHE.get(id);
    const cache =
      window.isSecureContext && "caches" in window
        ? await caches.open("poke-cache")
        : null;
    const url =
      hintUrl ||
      `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
    let resp = cache ? await cache.match(url) : null;
    if (!resp) {
      resp = await fetch(url, { mode: "cors" });
      if (resp.ok && cache) cache.put(url, resp.clone());
    }
    let audio;
    if (resp && resp.ok) {
      const blob = await resp.blob();
      audio = new Audio(URL.createObjectURL(blob));
    } else {
      audio = new Audio(url);
      audio.crossOrigin = "anonymous";
    }
    audio.volume = sfxVolume; // Use global volume
    CRY_CACHE.set(id, audio);
    return audio;
  } catch (e) {
    return new Audio();
  }
}
export async function playCry(mon) {
  if (isMuted) return;
  try {
    const poke = await fetchPokemon(mon.id);
    const cryUrl =
      (poke.cries && (poke.cries.latest || poke.cries.legacy)) || undefined;
    const a = await getCryAudio(mon.id, cryUrl);
    a.currentTime = 0;
    // Cries may be cross-origin (tainted for Web Audio), so play them on the
    // element directly rather than through the gain graph.
    await playEl(a, { useGraph: false });
  } catch (_) {}
}
