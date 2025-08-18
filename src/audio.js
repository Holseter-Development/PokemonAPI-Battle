import { fetchPokemon } from "./api.js";

export let isMuted = false;
let sfxVolume = 0.2;

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
  sound.volume = sfxVolume;
  sound.play().catch((e) => console.error("Error playing SFX:", e));
}

export function initAudio() {
  const music = document.getElementById("battleMusic");
  const muteBtn = document.getElementById("muteBtn");
  const volumeSlider = document.getElementById("volumeSlider");

  // Browsers require a user interaction to start audio.
  const startAudio = () => {
    music.play().catch((e) => console.error("Music autoplay failed:", e));
    document.body.removeEventListener("click", startAudio);
  };
  document.body.addEventListener("click", startAudio);

  const setVolume = () => {
    sfxVolume = isMuted ? 0 : parseFloat(volumeSlider.value);
    music.volume = sfxVolume;
  };

  muteBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    muteBtn.textContent = isMuted ? "Unmute" : "Mute";
    setVolume();
  });

  volumeSlider.addEventListener("input", setVolume);

  // Set initial volume
  sfxVolume = parseFloat(volumeSlider.value);
  music.volume = sfxVolume;
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
    a.volume = sfxVolume;
    await a.play();
  } catch (_) {}
}
