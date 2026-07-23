(() => {
  // src/data.js
  var VERSION_GROUPS_GEN1 = ["red-blue", "yellow"];
  var CHART = {
    normal: { rock: 0.5, ghost: 0 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: {
      fire: 0.5,
      water: 2,
      grass: 0.5,
      poison: 0.5,
      ground: 2,
      flying: 0.5,
      bug: 0.5,
      rock: 2,
      dragon: 0.5
    },
    ice: { fire: 0.5, water: 0.5, ice: 0.5, grass: 2, ground: 2, flying: 2, dragon: 2 },
    fighting: {
      normal: 2,
      ice: 2,
      rock: 2,
      poison: 0.5,
      flying: 0.5,
      psychic: 0.5,
      bug: 0.5,
      ghost: 0
    },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5 },
    ground: { fire: 2, electric: 2, poison: 2, rock: 2, bug: 0.5, flying: 0 },
    flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5 },
    bug: {
      grass: 2,
      psychic: 2,
      fire: 0.5,
      fighting: 0.5,
      poison: 0.5,
      flying: 0.5,
      ghost: 0.5
    },
    rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5 },
    ghost: { ghost: 2, normal: 0, psychic: 0 },
    dragon: { dragon: 2 }
  };
  var TYPES = Object.keys(CHART);
  var TYPE_COLOR = {
    normal: "#a8a878",
    fire: "#f0803c",
    water: "#4d90d5",
    grass: "#5fbd58",
    electric: "#f6c744",
    ice: "#74cec0",
    fighting: "#d3425f",
    poison: "#b763cf",
    ground: "#dd7748",
    flying: "#8cadf0",
    psychic: "#f65888",
    bug: "#93b900",
    rock: "#c2ae6e",
    ghost: "#6c5a94",
    dragon: "#7266d8"
  };
  var STATUS_LABEL = {
    brn: "BRN",
    par: "PAR",
    psn: "PSN",
    tox: "TOX",
    slp: "SLP",
    frz: "FRZ"
  };
  var STATUS_COLOR = {
    brn: "#f08030",
    par: "#f8d030",
    psn: "#a040a0",
    tox: "#a040a0",
    slp: "#8898a8",
    frz: "#98d8d8"
  };
  var AILMENT_MAP = {
    burn: "brn",
    paralysis: "par",
    poison: "psn",
    "bad-poison": "tox",
    sleep: "slp",
    freeze: "frz"
  };
  var STAT_KEY = {
    attack: "atk",
    defense: "def",
    "special-attack": "spa",
    "special-defense": "spd",
    "special": "spa",
    // Gen-1 lumps special together; map to spa
    speed: "spe",
    accuracy: "acc",
    evasion: "eva"
  };
  var PRIORITY_STATUS_MOVES = /* @__PURE__ */ new Set([
    "swords-dance",
    "amnesia",
    "growth",
    "sharpen",
    "meditate",
    "agility",
    "recover",
    "soft-boiled",
    "rest",
    "thunder-wave",
    "toxic",
    "sleep-powder",
    "spore",
    "stun-spore",
    "hypnosis",
    "sing",
    "lovely-kiss",
    "glare",
    "confuse-ray",
    "double-team",
    "minimize",
    "reflect",
    "light-screen",
    "leech-seed"
  ]);
  var GYMS = [
    {
      leader: "Brock",
      title: "Gym Leader",
      town: "Pewter",
      type: "rock",
      badge: "Boulder",
      sprite: "assets/sprites/gordie.png",
      team: [74, 95],
      intro: "Brock, the Rock-solid trainer, blocks your path!",
      floor: 12,
      reward: { money: 600, potions: 2 }
    },
    {
      leader: "Misty",
      title: "Gym Leader",
      town: "Cerulean",
      type: "water",
      badge: "Cascade",
      sprite: "assets/sprites/misty-lgpe.png",
      team: [120, 121],
      intro: "Misty, the Tomboyish Mermaid, dives in!",
      floor: 18,
      reward: { money: 800, superPotions: 2 }
    },
    {
      leader: "Lt. Surge",
      title: "Gym Leader",
      town: "Vermilion",
      type: "electric",
      badge: "Thunder",
      sprite: "assets/sprites/volkner.png",
      team: [100, 25, 26],
      intro: "Lt. Surge, the Lightning American, sparks up!",
      floor: 24,
      reward: { money: 1e3, balls: 4 }
    },
    {
      leader: "Erika",
      title: "Gym Leader",
      town: "Celadon",
      type: "grass",
      badge: "Rainbow",
      sprite: "assets/sprites/pokemonbreeder.png",
      team: [114, 71, 45],
      intro: "Erika, the Nature-Loving Princess, greets you.",
      floor: 29,
      reward: { money: 1200, superPotions: 3 }
    },
    {
      leader: "Koga",
      title: "Gym Leader",
      town: "Fuchsia",
      type: "poison",
      badge: "Soul",
      sprite: "assets/sprites/ninjaboy.png",
      team: [109, 89, 110],
      intro: "Koga, the Poisonous Ninja Master, appears!",
      floor: 34,
      reward: { money: 1400, hyperPotions: 1 }
    },
    {
      leader: "Sabrina",
      title: "Gym Leader",
      town: "Saffron",
      type: "psychic",
      badge: "Marsh",
      sprite: "assets/sprites/psychicf.png",
      team: [64, 122, 65],
      intro: "Sabrina, the Master of Psychic power, awaits.",
      floor: 40,
      reward: { money: 1600, ultraBalls: 2 }
    },
    {
      leader: "Blaine",
      title: "Gym Leader",
      town: "Cinnabar",
      type: "fire",
      badge: "Volcano",
      sprite: "assets/sprites/blaine.png",
      team: [58, 77, 59],
      intro: "Blaine, the Hot-Headed Quiz Master, ignites!",
      floor: 45,
      reward: { money: 1800, hyperPotions: 2 }
    },
    {
      leader: "Giovanni",
      title: "Gym Leader",
      town: "Viridian",
      type: "ground",
      badge: "Earth",
      sprite: "assets/sprites/larry.png",
      team: [111, 51, 112],
      intro: "Giovanni, the self-proclaimed strongest, sneers.",
      floor: 50,
      reward: { money: 2500, ultraBalls: 3, hyperPotions: 2 }
    }
  ];
  var CHAMPION = {
    leader: "Champion Blue",
    title: "Champion",
    town: "Indigo Plateau",
    type: "normal",
    badge: "Champion",
    sprite: "assets/sprites/trace.png",
    team: [18, 65, 112, 103, 130, 6],
    // Pidgeot, Alakazam, Rhydon, Exeggutor, Gyarados, Charizard
    intro: "Your rival stands as Champion. This is the battle you've trained for!",
    floor: 56,
    reward: { money: 5e3, ultraBalls: 5, hyperPotions: 3 }
  };
  var STARTERS = [
    { id: 1, name: "Bulbasaur", type: "grass" },
    { id: 4, name: "Charmander", type: "fire" },
    { id: 7, name: "Squirtle", type: "water" }
  ];
  var STRUGGLE = {
    name: "Struggle",
    key: "struggle",
    power: 50,
    accuracy: 100,
    type: "normal",
    damage_class: "physical",
    pp: 1,
    ppLeft: 1,
    priority: 0,
    category: "damage",
    drain: -25,
    // recoil
    healing: 0,
    minHits: 1,
    maxHits: 1,
    statChanges: [],
    statChance: 0,
    flinchChance: 0,
    ailment: "none",
    ailmentChance: 0,
    highCrit: false,
    target: "opponent"
  };
  function buildMove(md) {
    const meta = md.meta || {};
    const cat = meta.category?.name || (md.power ? "damage" : "net-good-stats");
    const dmgClass = md.damage_class?.name || "status";
    const statChanges = (md.stat_changes || []).map((s) => ({ stat: STAT_KEY[s.stat.name] || null, change: s.change })).filter((s) => s.stat);
    const tgt = md.target?.name || "selected-pokemon";
    const selfTarget = tgt === "user" || tgt === "users-field";
    return {
      name: cap(md.name.replace(/-/g, " ")),
      key: md.name,
      power: md.power || 0,
      accuracy: md.accuracy == null ? 100 : md.accuracy,
      type: md.type?.name || "normal",
      damage_class: dmgClass,
      pp: md.pp || 20,
      ppLeft: md.pp || 20,
      priority: md.priority || 0,
      category: cat,
      drain: meta.drain || 0,
      // + heals attacker, - is recoil
      healing: meta.healing || 0,
      // % of max hp healed (recover etc.)
      minHits: meta.min_hits || 1,
      maxHits: meta.max_hits || 1,
      statChanges,
      statChance: meta.stat_chance || 0,
      flinchChance: meta.flinch_chance || 0,
      ailment: meta.ailment?.name || "none",
      ailmentChance: meta.ailment_chance || 0,
      highCrit: !!(meta.crit_rate && meta.crit_rate > 0),
      selfTarget,
      isOHKO: cat === "ohko"
    };
  }
  function cap(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  // src/api.js
  var API = "https://pokeapi.co/api/v2";
  var GEN1_MAX_ID = 151;
  var MOVE_CACHE = /* @__PURE__ */ new Map();
  var GROWTH_CACHE = /* @__PURE__ */ new Map();
  var EVO_CACHE = /* @__PURE__ */ new Map();
  var JSON_TTL = 1e3 * 60 * 60 * 24 * 7;
  async function fetchCachedJSON(url) {
    try {
      const now = Date.now();
      const hit = localStorage.getItem("cache:" + url);
      if (hit) {
        const { t, v: v2 } = JSON.parse(hit);
        if (now - t < JSON_TTL)
          return v2;
      }
      const r = await fetch(url, { cache: "force-cache" });
      if (!r.ok)
        throw new Error("net");
      const v = await r.json();
      try {
        localStorage.setItem("cache:" + url, JSON.stringify({ t: now, v }));
      } catch (_) {
      }
      return v;
    } catch (e) {
      const r = await fetch(url);
      if (!r.ok)
        throw new Error("net");
      return r.json();
    }
  }
  function fetchPokemon(idOrName) {
    return fetchCachedJSON(`${API}/pokemon/${idOrName}`);
  }
  function fetchSpecies(id) {
    return fetchCachedJSON(`${API}/pokemon-species/${id}`);
  }
  function fetchGrowth(url) {
    if (!GROWTH_CACHE.has(url))
      GROWTH_CACHE.set(url, fetchCachedJSON(url));
    return GROWTH_CACHE.get(url);
  }
  function fetchEvo(url) {
    if (!EVO_CACHE.has(url))
      EVO_CACHE.set(url, fetchCachedJSON(url));
    return EVO_CACHE.get(url);
  }
  function spriteSet(data) {
    const s = data.sprites || {};
    const bw = s.versions?.["generation-v"]?.["black-white"]?.animated || {};
    const artwork = s.other?.["official-artwork"]?.front_default || null;
    const home = s.other?.home?.front_default || null;
    return {
      front: bw.front_default || s.front_default || artwork || home || "",
      back: bw.back_default || s.back_default || bw.front_default || s.front_default || "",
      artwork: artwork || s.front_default || "",
      animated: !!bw.front_default
    };
  }
  async function fetchMoveset(poke, level) {
    const seen = /* @__PURE__ */ new Set();
    const entries = [];
    for (const m of poke.moves) {
      for (const vg of m.version_group_details) {
        if (!VERSION_GROUPS_GEN1.includes(vg.version_group.name))
          continue;
        if (vg.move_learn_method?.name !== "level-up")
          continue;
        const learnLv = vg.level_learned_at ?? 0;
        if (learnLv <= level && !seen.has(m.move.url)) {
          seen.add(m.move.url);
          if (!MOVE_CACHE.has(m.move.url))
            MOVE_CACHE.set(m.move.url, fetchCachedJSON(m.move.url));
          entries.push({ url: m.move.url, level: learnLv });
        }
      }
    }
    const moveDatas = await Promise.all(entries.map((x) => MOVE_CACHE.get(x.url)));
    const gen1 = moveDatas.map((md, i) => ({ md, level: entries[i].level })).filter((x) => x.md && x.md.generation?.name === "generation-i");
    return selectMoves(gen1);
  }
  function selectMoves(gen1) {
    const damaging = [];
    const status = [];
    const nameSeen = /* @__PURE__ */ new Set();
    const sorted = gen1.slice().sort((a, b) => b.level - a.level);
    for (const { md } of sorted) {
      if (nameSeen.has(md.name))
        continue;
      nameSeen.add(md.name);
      const dmgClass = md.damage_class?.name;
      if ((dmgClass === "physical" || dmgClass === "special") && md.power) {
        damaging.push(buildMove(md));
      } else if (dmgClass === "status") {
        status.push({ move: buildMove(md), priority: PRIORITY_STATUS_MOVES.has(md.name) });
      }
    }
    damaging.sort((a, b) => b.power * b.accuracy - a.power * a.accuracy);
    status.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));
    const out = [];
    const utility = status.find((s) => s.priority) || status[0];
    const dmgSlots = utility && damaging.length >= 3 ? 3 : 4;
    for (const m of damaging.slice(0, dmgSlots))
      out.push(m);
    if (utility && out.length < 4)
      out.push(utility.move);
    for (const m of damaging.slice(dmgSlots)) {
      if (out.length >= 4)
        break;
      out.push(m);
    }
    return out.slice(0, 4);
  }

  // src/audio.js
  var isMuted = false;
  var sfxVolume = 0.2;
  var audioCtx = null;
  var masterGain = null;
  var routed = /* @__PURE__ */ new WeakSet();
  function ensureCtx() {
    if (audioCtx)
      return audioCtx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC)
        return null;
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
      } catch (_) {
      }
    }
  }
  function route(el2) {
    if (!ensureCtx() || routed.has(el2))
      return routed.has(el2);
    try {
      const src = audioCtx.createMediaElementSource(el2);
      src.connect(masterGain);
      routed.add(el2);
    } catch (_) {
    }
    return routed.has(el2);
  }
  function playEl(el2, { useGraph = true } = {}) {
    if (useGraph) {
      ensureCtx();
      if (audioCtx && audioCtx.state === "suspended")
        audioCtx.resume().catch(() => {
        });
      const isRouted = route(el2);
      el2.volume = isRouted ? 1 : sfxVolume;
    } else {
      el2.volume = sfxVolume;
    }
    el2.muted = isMuted;
    return el2.play();
  }
  function setMuted(v) {
    isMuted = !!v;
    const music = document.getElementById("battleMusic");
    if (music) {
      music.muted = isMuted;
      if (!isMuted && music.paused)
        playEl(music).catch(() => {
        });
    }
    applyGain();
  }
  function setVolume(v) {
    sfxVolume = Math.max(0, Math.min(1, isNaN(v) ? sfxVolume : v));
    const music = document.getElementById("battleMusic");
    if (music && !routed.has(music))
      music.volume = sfxVolume;
    applyGain();
  }
  var ATTACK_SFX_MAP = {
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
    fly: "FlyUp.wav",
    // Using FlyUp for the start of the move
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
    "pin-missile": "SpikeCannon.wav",
    // Using a similar sound
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
    wrap: "Wrap.wav"
  };
  var GENERIC_SFX_MAP = {
    punch: "FirePunch.wav",
    kick: "DoubleKick.wav",
    hit: "Tackle.wav",
    beam: "AuroraBeam.wav"
  };
  function playSfx(move) {
    if (isMuted)
      return;
    const moveKey = move.key;
    let sfxFile = ATTACK_SFX_MAP[moveKey];
    if (!sfxFile) {
      if (move.name.includes("Punch"))
        sfxFile = GENERIC_SFX_MAP.punch;
      else if (move.name.includes("Kick"))
        sfxFile = GENERIC_SFX_MAP.kick;
      else if (move.name.includes("Beam"))
        sfxFile = GENERIC_SFX_MAP.beam;
      else
        sfxFile = GENERIC_SFX_MAP.hit;
    }
    const sound = new Audio(`assets/sfx/attacks/${sfxFile}`);
    playEl(sound).catch(() => {
    });
  }
  function playFile(url) {
    if (isMuted)
      return;
    try {
      playEl(new Audio(url)).catch(() => {
      });
    } catch (_) {
    }
  }
  function updateMuteIcon(btn) {
    if (!btn)
      return;
    const use = btn.querySelector("use");
    if (use)
      use.setAttribute("href", isMuted ? "#i-volume-off" : "#i-volume");
    btn.setAttribute("aria-pressed", String(isMuted));
    btn.title = isMuted ? "Unmute" : "Mute";
  }
  function initAudio() {
    const music = document.getElementById("battleMusic");
    const muteBtn = document.getElementById("muteBtn");
    const volumeSlider = document.getElementById("volumeSlider");
    if (volumeSlider)
      sfxVolume = parseFloat(volumeSlider.value) || sfxVolume;
    const unlock = () => {
      ensureCtx();
      if (audioCtx && audioCtx.state === "suspended")
        audioCtx.resume().catch(() => {
        });
      if (music && !isMuted && music.paused)
        playEl(music).catch(() => {
        });
      events.forEach((ev) => document.removeEventListener(ev, unlock));
    };
    const events = ["pointerdown", "touchstart", "keydown", "click"];
    events.forEach((ev) => document.addEventListener(ev, unlock, { passive: true }));
    if (muteBtn) {
      updateMuteIcon(muteBtn);
      muteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        setMuted(!isMuted);
        updateMuteIcon(muteBtn);
      });
    }
    if (volumeSlider) {
      volumeSlider.value = String(sfxVolume);
      volumeSlider.addEventListener("input", () => {
        setVolume(parseFloat(volumeSlider.value));
        if (sfxVolume > 0 && isMuted) {
          setMuted(false);
          updateMuteIcon(muteBtn);
        }
      });
    }
    setVolume(sfxVolume);
  }
  var CRY_CACHE = /* @__PURE__ */ new Map();
  async function getCryAudio(id, hintUrl) {
    try {
      if (CRY_CACHE.has(id))
        return CRY_CACHE.get(id);
      const cache = window.isSecureContext && "caches" in window ? await caches.open("poke-cache") : null;
      const url = hintUrl || `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
      let resp = cache ? await cache.match(url) : null;
      if (!resp) {
        resp = await fetch(url, { mode: "cors" });
        if (resp.ok && cache)
          cache.put(url, resp.clone());
      }
      let audio;
      if (resp && resp.ok) {
        const blob = await resp.blob();
        audio = new Audio(URL.createObjectURL(blob));
      } else {
        audio = new Audio(url);
        audio.crossOrigin = "anonymous";
      }
      audio.volume = sfxVolume;
      CRY_CACHE.set(id, audio);
      return audio;
    } catch (e) {
      return new Audio();
    }
  }
  async function playCry(mon) {
    if (isMuted)
      return;
    try {
      const poke = await fetchPokemon(mon.id);
      const cryUrl = poke.cries && (poke.cries.latest || poke.cries.legacy) || void 0;
      const a = await getCryAudio(mon.id, cryUrl);
      a.currentTime = 0;
      await playEl(a, { useGraph: false });
    } catch (_) {
    }
  }

  // src/battle.js
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  var STAT_NAMES = {
    atk: "Attack",
    def: "Defense",
    spa: "Special Attack",
    spd: "Special Defense",
    spe: "Speed",
    acc: "accuracy",
    eva: "evasiveness"
  };
  function typeEffect(moveType, targetTypes) {
    let mult = 1;
    const row = CHART[moveType] || {};
    for (const t of targetTypes)
      mult *= row[t] ?? 1;
    return mult;
  }
  function stage(mon, key) {
    return mon.stages && mon.stages[key] || 0;
  }
  function statMult(s) {
    s = clamp(s, -6, 6);
    return s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
  }
  function accMult(s) {
    s = clamp(s, -6, 6);
    return s >= 0 ? (3 + s) / 3 : 3 / (3 - s);
  }
  function effectiveStat(mon, key) {
    const base = mon.stats[key] || 1;
    let v = base * statMult(stage(mon, key));
    if (key === "spe" && mon.status && mon.status.cond === "par")
      v *= 0.25;
    return Math.max(1, Math.floor(v));
  }
  function hasAbility(mon, tag) {
    return !!(mon.abilities && mon.abilities.includes(tag));
  }
  function rollHit(move, attacker, defender, rng = Math.random) {
    if (attacker.trueStrike)
      return true;
    if (move.accuracy == null)
      return true;
    const net = clamp(stage(attacker, "acc") - stage(defender, "eva"), -6, 6);
    const chance = move.accuracy * accMult(net);
    return rng() * 100 < chance;
  }
  function rollCrit(attacker, move, rng = Math.random, bonus = 0) {
    let base = clamp((attacker.stats.spe || attacker.stats.spd || 40) / 512, 0.02, 0.25);
    if (move.highCrit)
      base = clamp(base * 2, 0.02, 0.4);
    return rng() < clamp(base + bonus, 0, 1);
  }
  function calcDamage(attacker, defender, move, rng = Math.random, opts = {}, ctx = {}) {
    const level = attacker.level;
    const special = move.damage_class === "special";
    let atkStat = special ? effectiveStat(attacker, "spa") : effectiveStat(attacker, "atk");
    const defStat = special ? effectiveStat(defender, "spd") : effectiveStat(defender, "def");
    const statused = attacker.status && attacker.status.cond !== "none";
    const guts = hasAbility(attacker, "guts") && statused;
    if (!special && attacker.status && attacker.status.cond === "brn" && !guts) {
      atkStat = Math.max(1, Math.floor(atkStat * 0.5));
    }
    if (guts)
      atkStat = Math.floor(atkStat * 1.5);
    if (move.type === "ground" && hasAbility(defender, "levitate"))
      return { dmg: 0, eff: 0, crit: false };
    const eff = typeEffect(move.type, defender.types);
    if (eff === 0)
      return { dmg: 0, eff: 0, crit: false };
    const base = Math.floor(
      Math.floor(
        Math.floor(2 * level / 5 + 2) * move.power * (atkStat / Math.max(1, defStat)) / 50
      ) + 2
    );
    const randFactor = opts.avg ? 0.925 : 0.85 + rng() * 0.15;
    const stabMult = attacker.adaptive ? 2 : 1.5;
    const stab = attacker.types.includes(move.type) ? stabMult : 1;
    const fx2 = ctx.playerFx || {};
    const globalMult = fx2.globalDamageMult ?? 1;
    const playerMult = ctx.attackerIsPlayer ? (fx2.yourDamageMult ?? 1) * (fx2.typeMult?.[move.type] ?? 1) : 1;
    let dmg = Math.max(1, Math.floor(base * randFactor * stab * eff * globalMult * playerMult));
    const critBonus = ctx.attackerIsPlayer ? (fx2.critRampPerTurn || 0) * Math.max(0, ctx.noSwitchTurns || 0) : 0;
    const crit = opts.forceCrit || rollCrit(attacker, move, rng, critBonus);
    if (crit)
      dmg = Math.floor(dmg * 1.8);
    if (hasAbility(defender, "multiscale") && defender.stats.hp >= defender.stats.maxHp) {
      dmg = Math.max(1, Math.floor(dmg * 0.5));
    }
    if (ctx.defenderIsPlayer && fx2.sturdyAtFull && defender.stats.hp >= defender.stats.maxHp) {
      dmg = Math.min(dmg, Math.max(1, Math.floor(defender.stats.maxHp * 0.5)));
    }
    return { dmg, eff, crit };
  }
  function applyAilment(target, ailmentName, rng = Math.random, force = false) {
    const cond = AILMENT_MAP[ailmentName];
    if (!cond)
      return { applied: false };
    if (target.status && target.status.cond !== "none") {
      return { applied: false, reason: "already" };
    }
    if (cond === "brn" && target.types.includes("fire"))
      return { applied: false, reason: "immune" };
    if (cond === "frz" && target.types.includes("ice"))
      return { applied: false, reason: "immune" };
    if ((cond === "psn" || cond === "tox") && (target.types.includes("poison") || target.types.includes("steel"))) {
      return { applied: false, reason: "immune" };
    }
    target.status = { cond, turns: 0, toxic: cond === "tox" ? 1 : 0 };
    if (cond === "slp")
      target.status.turns = 1 + Math.floor(rng() * 3);
    return { applied: true, cond };
  }
  function applyEntryStatus(target, statusCode, rng = Math.random) {
    const ailment = {
      brn: "burn",
      par: "paralysis",
      psn: "poison",
      tox: "bad-poison",
      slp: "sleep",
      frz: "freeze"
    }[statusCode];
    return ailment ? applyAilment(target, ailment, rng) : { applied: false };
  }
  function canAct(mon, rng = Math.random) {
    const s = mon.status || (mon.status = { cond: "none", turns: 0, toxic: 0 });
    if (s.cond === "slp") {
      if (s.turns > 0) {
        s.turns--;
        return { canAct: false, message: `${mon.name} is fast asleep...` };
      }
      s.cond = "none";
      return { canAct: true, message: `${mon.name} woke up!` };
    }
    if (s.cond === "frz") {
      if (rng() < 0.2) {
        s.cond = "none";
        return { canAct: true, message: `${mon.name} thawed out!` };
      }
      return { canAct: false, message: `${mon.name} is frozen solid!` };
    }
    if (s.cond === "par" && rng() < 0.25) {
      return { canAct: false, message: `${mon.name} is paralyzed! It can't move!` };
    }
    return { canAct: true, message: null };
  }
  function endOfTurn(mon) {
    const s = mon.status;
    if (!s)
      return null;
    if (s.cond === "brn" || s.cond === "psn") {
      const dmg = Math.max(1, Math.floor(mon.stats.maxHp / 16));
      mon.stats.hp = clamp(mon.stats.hp - dmg, 0, mon.stats.maxHp);
      return { dmg, kind: s.cond, fainted: mon.stats.hp <= 0 };
    }
    if (s.cond === "tox") {
      const n = s.toxic || 1;
      const dmg = Math.max(1, Math.floor(mon.stats.maxHp * n / 16));
      s.toxic = n + 1;
      mon.stats.hp = clamp(mon.stats.hp - dmg, 0, mon.stats.maxHp);
      return { dmg, kind: "tox", fainted: mon.stats.hp <= 0 };
    }
    return null;
  }
  function applyWeatherChip(mon, weather) {
    const immune = weather === "hail" && mon.types.includes("ice") || weather === "sand" && mon.types.some((t) => ["rock", "ground", "steel"].includes(t));
    if (!["hail", "sand"].includes(weather) || immune || mon.stats.hp <= 0)
      return null;
    const dmg = Math.min(mon.stats.hp, Math.max(1, Math.floor(mon.stats.maxHp / 16)));
    mon.stats.hp = clamp(mon.stats.hp - dmg, 0, mon.stats.maxHp);
    return { dmg, kind: weather, fainted: mon.stats.hp <= 0 };
  }
  function applyDefeatHeal(mon, fraction) {
    if (!mon || mon.stats.hp <= 0 || !(fraction > 0))
      return 0;
    const before = mon.stats.hp;
    const heal = Math.max(1, Math.floor(mon.stats.maxHp * fraction));
    mon.stats.hp = clamp(mon.stats.hp + heal, 0, mon.stats.maxHp);
    return mon.stats.hp - before;
  }
  function useMove(attacker, defender, move, rng = Math.random, ctx = {}) {
    const res = {
      move,
      missed: false,
      immune: false,
      hits: [],
      totalDmg: 0,
      targetFainted: false,
      ailment: null,
      // { who, cond }
      statEvents: [],
      // { who, stat, change, applied }
      drain: 0,
      recoil: 0,
      healed: 0,
      endured: false,
      flinch: false,
      log: []
    };
    if (move.isOHKO) {
      if (attacker.level < defender.level || rng() >= 0.3) {
        res.missed = true;
        res.log.push("But it failed!");
        return res;
      }
      const fx2 = ctx.playerFx || {};
      let dmg = defender.stats.hp;
      if (ctx.defenderIsPlayer && fx2.sturdyAtFull && defender.stats.hp >= defender.stats.maxHp) {
        dmg = Math.min(dmg, Math.max(1, Math.floor(defender.stats.maxHp * 0.5)));
      }
      const applied = applyHitDamage(defender, dmg, ctx);
      res.hits.push({ dmg: applied.dmg, crit: false, eff: 1 });
      res.totalDmg = applied.dmg;
      res.endured = applied.endured;
      res.targetFainted = defender.stats.hp <= 0;
      if (res.targetFainted)
        res.log.push("It's a one-hit KO!");
      else if (res.endured)
        res.log.push(`${defender.name} endured the hit!`);
      else
        res.log.push(`${defender.name} stood firm!`);
      return res;
    }
    if (!rollHit(move, attacker, defender, rng)) {
      res.missed = true;
      res.log.push(`${attacker.name}'s attack missed!`);
      return res;
    }
    const isDamaging = move.power > 0 && move.category !== "net-good-stats" && move.category !== "ailment" && move.category !== "heal";
    if (isDamaging) {
      const eff = typeEffect(move.type, defender.types);
      if (eff === 0) {
        res.immune = true;
        res.log.push(`It doesn't affect ${defender.name}...`);
        return res;
      }
      let hitCount = 1;
      if (move.maxHits > 1) {
        if (move.maxHits === move.minHits)
          hitCount = move.maxHits;
        else {
          const r = rng();
          hitCount = r < 0.375 ? 2 : r < 0.75 ? 3 : r < 0.875 ? 4 : 5;
        }
      }
      for (let i = 0; i < hitCount; i++) {
        if (defender.stats.hp <= 0)
          break;
        const { dmg, crit } = calcDamage(attacker, defender, move, rng, {}, ctx);
        const applied = applyHitDamage(defender, dmg, ctx);
        res.hits.push({ dmg: applied.dmg, crit, eff });
        res.totalDmg += applied.dmg;
        if (applied.endured) {
          res.endured = true;
          res.log.push(`${defender.name} endured the hit!`);
        }
      }
      if (hitCount > 1)
        res.log.push(`Hit ${res.hits.length} time(s)!`);
      res.effMult = eff;
      if (move.drain > 0) {
        res.drain = Math.max(1, Math.floor(res.totalDmg * move.drain / 100));
        attacker.stats.hp = clamp(attacker.stats.hp + res.drain, 0, attacker.stats.maxHp);
        res.log.push(`${attacker.name} drained energy!`);
      } else if (move.drain < 0) {
        res.recoil = Math.max(1, Math.floor(res.totalDmg * -move.drain / 100));
        attacker.stats.hp = clamp(attacker.stats.hp - res.recoil, 0, attacker.stats.maxHp);
        res.log.push(`${attacker.name} is hit with recoil!`);
      } else if ((attacker.lifesteal || 0) + (ctx.attackerIsPlayer ? ctx.playerFx?.lifesteal || 0 : 0) > 0 && res.totalDmg > 0) {
        const lifesteal = (attacker.lifesteal || 0) + (ctx.attackerIsPlayer ? ctx.playerFx?.lifesteal || 0 : 0);
        const leech = Math.max(1, Math.floor(res.totalDmg * lifesteal));
        const before = attacker.stats.hp;
        attacker.stats.hp = clamp(attacker.stats.hp + leech, 0, attacker.stats.maxHp);
        res.drain = attacker.stats.hp - before;
        if (res.drain > 0)
          res.log.push(`${attacker.name} sapped health!`);
      }
      res.targetFainted = defender.stats.hp <= 0;
    }
    if (move.healing > 0 || move.key === "rest") {
      const before = attacker.stats.hp;
      if (move.key === "rest") {
        attacker.stats.hp = attacker.stats.maxHp;
        attacker.status = { cond: "slp", turns: 2, toxic: 0 };
        res.log.push(`${attacker.name} slept and became healthy!`);
      } else {
        const heal = Math.floor(attacker.stats.maxHp * move.healing / 100);
        attacker.stats.hp = clamp(attacker.stats.hp + heal, 0, attacker.stats.maxHp);
        res.log.push(`${attacker.name} regained health!`);
      }
      res.healed = attacker.stats.hp - before;
    }
    if (!res.targetFainted && move.ailment && move.ailment !== "none") {
      const guaranteed = !isDamaging;
      const roll = guaranteed || rng() * 100 < (move.ailmentChance || 0);
      if (roll) {
        const target = move.selfTarget ? attacker : defender;
        const out = applyAilment(target, move.ailment, rng);
        if (out.applied) {
          res.ailment = { who: move.selfTarget ? "self" : "target", cond: out.cond };
          res.log.push(`${target.name} was ${statusVerb(out.cond)}!`);
        } else if (guaranteed) {
          res.log.push("But it failed!");
        }
      }
    }
    if (!res.targetFainted && move.statChanges && move.statChanges.length) {
      const guaranteed = !isDamaging || move.statChance === 0;
      const roll = guaranteed || rng() * 100 < move.statChance;
      if (roll) {
        const target = move.selfTarget ? attacker : defender;
        const who = move.selfTarget ? "self" : "target";
        for (const sc of move.statChanges) {
          const applied = changeStage(target, sc.stat, sc.change);
          res.statEvents.push({ who, stat: sc.stat, change: sc.change, applied });
          if (applied) {
            res.log.push(statChangeMessage(target.name, sc.stat, sc.change));
          } else {
            res.log.push(`${target.name}'s ${STAT_NAMES[sc.stat] || sc.stat} won't go ${sc.change > 0 ? "higher" : "lower"}!`);
          }
        }
      }
    }
    if (!res.targetFainted && isDamaging && move.flinchChance > 0) {
      if (rng() * 100 < move.flinchChance)
        res.flinch = true;
    }
    return res;
  }
  function applyHitDamage(defender, damage, ctx) {
    const fx2 = ctx.playerFx || {};
    let dmg = Math.min(Math.max(0, damage), defender.stats.hp);
    let endured = false;
    const endureFlag = ctx.endureUsed;
    if (ctx.defenderIsPlayer && fx2.endureOnce && endureFlag && !endureFlag.used && dmg >= defender.stats.hp && defender.stats.hp > 0) {
      dmg = Math.max(0, defender.stats.hp - 1);
      endureFlag.used = true;
      endured = true;
    }
    defender.stats.hp = clamp(defender.stats.hp - dmg, 0, defender.stats.maxHp);
    return { dmg, endured };
  }
  function changeStage(mon, key, change) {
    if (!mon.stages)
      mon.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
    const cur = mon.stages[key] || 0;
    const next = clamp(cur + change, -6, 6);
    if (next === cur)
      return false;
    mon.stages[key] = next;
    return true;
  }
  function statChangeMessage(name, stat, change) {
    const label = STAT_NAMES[stat] || stat;
    const mag = Math.abs(change);
    const dir = change > 0 ? mag >= 2 ? "sharply rose" : "rose" : mag >= 2 ? "harshly fell" : "fell";
    return `${name}'s ${label} ${dir}!`;
  }
  function statusVerb(cond) {
    return {
      brn: "burned",
      par: "paralyzed",
      psn: "poisoned",
      tox: "badly poisoned",
      slp: "put to sleep",
      frz: "frozen solid"
    }[cond] || "afflicted";
  }
  function firstMover(a, aMove, b, bMove, rng = Math.random, ctx = {}) {
    const pa = aMove ? aMove.priority || 0 : 0;
    const pb = bMove ? bMove.priority || 0 : 0;
    if (pa !== pb)
      return pa > pb ? "a" : "b";
    const sa = effectiveStat(a, "spe");
    const sb = effectiveStat(b, "spe");
    if (sa !== sb) {
      const faster = sa > sb ? "a" : "b";
      return ctx.playerFx?.trickRoom ? faster === "a" ? "b" : "a" : faster;
    }
    return rng() < 0.5 ? "a" : "b";
  }
  function moveScore(attacker, defender, move) {
    if (move.ppLeft <= 0)
      return -1;
    const isDamaging = move.power > 0 && move.category !== "net-good-stats";
    if (isDamaging) {
      const { dmg, eff } = calcDamage(attacker, defender, move, Math.random, { avg: true });
      const frac = Math.min(1.2, dmg / Math.max(1, defender.stats.hp));
      let bonus = 0;
      if (move.ailment !== "none" && defender.status && defender.status.cond === "none") {
        bonus += 0.15 * (move.ailmentChance / 100);
      }
      return frac * (move.accuracy / 100) + bonus + eff * 1e-3;
    }
    let s = 0;
    const hpFrac = attacker.stats.hp / attacker.stats.maxHp;
    if ((move.healing > 0 || move.key === "rest") && hpFrac < 0.6)
      s += (0.6 - hpFrac) * 1.2;
    if (move.ailment !== "none" && defender.status && defender.status.cond === "none") {
      s += 0.35 * ((move.accuracy || 100) / 100);
    }
    if (move.statChanges && move.statChanges.length && move.selfTarget && hpFrac > 0.5) {
      s += 0.2;
    }
    if (move.statChanges && move.statChanges.length && !move.selfTarget)
      s += 0.15;
    return s;
  }
  function chooseAIMove(attacker, defender, rng = Math.random) {
    const usable = attacker.moves.filter((m) => m.ppLeft > 0);
    if (!usable.length)
      return -1;
    let bestIdx = -1, best = -Infinity;
    attacker.moves.forEach((m, i) => {
      if (m.ppLeft <= 0)
        return;
      let sc = moveScore(attacker, defender, m);
      sc += rng() * 0.05;
      if (sc > best) {
        best = sc;
        bestIdx = i;
      }
    });
    return bestIdx;
  }
  function bestMoveIndex(attacker, defender) {
    let pick2 = -1, score = -Infinity;
    attacker.moves.forEach((m, i) => {
      if (m.ppLeft <= 0)
        return;
      const sc = moveScore(attacker, defender, m);
      if (sc > score) {
        score = sc;
        pick2 = i;
      }
    });
    return pick2 >= 0 ? pick2 : null;
  }
  function battleScore(mon, enemy) {
    let bestOff = 0, totalPP = 0, totalLeft = 0, hasDamage = false;
    mon.moves.forEach((m) => {
      totalPP += m.pp || 0;
      totalLeft += m.ppLeft || 0;
      if (m.ppLeft <= 0 || !(m.power > 0))
        return;
      hasDamage = true;
      const eff = typeEffect(m.type, enemy.types);
      const stab = mon.types.includes(m.type) ? 1.5 : 1;
      const sc = (m.power || 0) * eff * stab * (m.accuracy || 100) / 100;
      if (sc > bestOff)
        bestOff = sc;
    });
    if (!hasDamage)
      return 0;
    const ppFactor = totalPP > 0 ? totalLeft / totalPP : 0;
    let defScore = 0, count = 0;
    enemy.moves.forEach((em) => {
      if (em.ppLeft <= 0 || !(em.power > 0))
        return;
      defScore += typeEffect(em.type, mon.types);
      count++;
    });
    defScore = count > 0 ? defScore / count : 1;
    const defFactor = 1 / Math.max(0.25, defScore);
    const hpFactor = mon.stats.hp / mon.stats.maxHp;
    const levelFactor = enemy.level ? clamp(mon.level / enemy.level, 0.5, 2) : 1;
    return bestOff * defFactor * hpFactor * (0.5 + 0.5 * ppFactor) * levelFactor;
  }
  function bestSwitch(party, activeIdx, enemy, currentScore, threshold = 1.5) {
    let bestIdx = null;
    let bestScore = currentScore * threshold;
    party.forEach((mon, idx) => {
      if (mon.stats.hp <= 0 || idx === activeIdx)
        return;
      const score = battleScore(mon, enemy);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }
  function effText(mult) {
    if (mult === 0)
      return "It doesn't affect the foe...";
    if (mult >= 2)
      return "It's super effective!";
    if (mult <= 0.5)
      return "It's not very effective...";
    return "";
  }
  function switchOutHeal(mon) {
    if (mon && mon.stats.hp > 0 && mon.abilities && mon.abilities.includes("regenerator")) {
      const before = mon.stats.hp;
      mon.stats.hp = clamp(mon.stats.hp + Math.floor(mon.stats.maxHp / 3), 0, mon.stats.maxHp);
      return mon.stats.hp - before;
    }
    return 0;
  }

  // src/roster.js
  var ROSTER_MAX = 6;
  var ROSTER_MIN = 1;
  var ARENA_LEVEL_CAP = 100;
  function snapshotMon(mon) {
    return {
      id: mon.id,
      name: mon.name,
      level: mon.level,
      types: mon.types.slice(),
      stats: {
        maxHp: mon.stats.maxHp,
        hp: mon.stats.maxHp,
        // enter the Arena at full health
        atk: mon.stats.atk,
        def: mon.stats.def,
        spa: mon.stats.spa,
        spd: mon.stats.spd,
        spe: mon.stats.spe
      },
      base_exp: mon.base_exp,
      capture_rate: mon.capture_rate,
      spriteFront: mon.spriteFront,
      spriteBack: mon.spriteBack,
      artwork: mon.artwork,
      moves: (mon.moves || []).map((m) => ({
        name: m.name,
        key: m.key,
        power: m.power,
        accuracy: m.accuracy,
        type: m.type,
        damage_class: m.damage_class,
        pp: m.pp,
        ppLeft: m.pp,
        priority: m.priority || 0,
        category: m.category,
        drain: m.drain || 0,
        healing: m.healing || 0,
        minHits: m.minHits || 1,
        maxHits: m.maxHits || 1,
        statChanges: m.statChanges || [],
        statChance: m.statChance || 0,
        flinchChance: m.flinchChance || 0,
        ailment: m.ailment || "none",
        ailmentChance: m.ailmentChance || 0,
        highCrit: !!m.highCrit,
        selfTarget: !!m.selfTarget,
        isOHKO: !!m.isOHKO
      })),
      // Battles start clean.
      stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 },
      status: { cond: "none", turns: 0, toxic: 0 }
    };
  }
  function buildRoster(party) {
    return (party || []).filter((m) => m && m.stats && m.moves && m.moves.length).slice(0, ROSTER_MAX).map(snapshotMon);
  }
  function validateRoster(roster, opts = {}) {
    const max = opts.max || ROSTER_MAX;
    const min = opts.min || ROSTER_MIN;
    const levelCap = opts.levelCap || ARENA_LEVEL_CAP;
    if (!Array.isArray(roster))
      return { ok: false, reason: "Roster must be a list." };
    if (roster.length < min)
      return { ok: false, reason: "You need at least one Pok\xE9mon." };
    if (roster.length > max)
      return { ok: false, reason: `A team can have at most ${max}.` };
    for (const mon of roster) {
      if (!mon || typeof mon.id !== "number")
        return { ok: false, reason: "Malformed Pok\xE9mon in roster." };
      if (!(mon.level >= 1 && mon.level <= levelCap))
        return { ok: false, reason: `${mon.name || "A Pok\xE9mon"} exceeds the level cap.` };
      if (!mon.stats || !(mon.stats.maxHp > 0))
        return { ok: false, reason: `${mon.name || "A Pok\xE9mon"} has invalid stats.` };
      if (mon.stats.hp !== mon.stats.maxHp)
        return { ok: false, reason: `${mon.name} must enter at full HP.` };
      if (!Array.isArray(mon.moves) || !mon.moves.length)
        return { ok: false, reason: `${mon.name} has no moves.` };
      if (!mon.moves.some((m) => m.power > 0))
        return { ok: false, reason: `${mon.name} needs at least one damaging move.` };
      if (!Array.isArray(mon.types) || !mon.types.length)
        return { ok: false, reason: `${mon.name} has no type.` };
    }
    return { ok: true, count: roster.length };
  }
  function rosterPower(roster) {
    if (!roster || !roster.length)
      return 0;
    let sum = 0;
    for (const m of roster) {
      const bst = m.stats.maxHp + m.stats.atk + m.stats.def + m.stats.spa + m.stats.spd + m.stats.spe;
      sum += m.level * 4 + bst;
    }
    return Math.round(sum / roster.length);
  }

  // src/net.js
  var LS_ENDPOINT = "pkbattle:arena-endpoint";
  function arenaEndpoint() {
    try {
      if (typeof window !== "undefined") {
        if (window.ARENA_ENDPOINT)
          return window.ARENA_ENDPOINT;
        const v = localStorage.getItem(LS_ENDPOINT);
        if (v)
          return v;
      }
    } catch (_) {
    }
    return null;
  }
  function isArenaConfigured() {
    return !!arenaEndpoint();
  }
  function makeEmitter() {
    const map = /* @__PURE__ */ new Map();
    return {
      on(ev, cb) {
        (map.get(ev) || map.set(ev, []).get(ev)).push(cb);
        return () => this.off(ev, cb);
      },
      off(ev, cb) {
        const a = map.get(ev);
        if (a)
          map.set(ev, a.filter((f) => f !== cb));
      },
      emit(ev, data) {
        (map.get(ev) || []).forEach((f) => {
          try {
            f(data);
          } catch (_) {
          }
        });
      }
    };
  }
  var ArenaClient = class {
    constructor() {
      this.status = "offline";
      this.ws = null;
      this.events = makeEmitter();
    }
    on(ev, cb) {
      return this.events.on(ev, cb);
    }
    connect() {
      const url = arenaEndpoint();
      if (!url) {
        this.status = "offline";
        return Promise.reject(new Error("Ranked Arena is not online yet."));
      }
      return new Promise((resolve, reject) => {
        try {
          this.status = "connecting";
          const ws = new WebSocket(url);
          this.ws = ws;
          ws.onopen = () => {
            this.status = "online";
            this.events.emit("open");
            resolve();
          };
          ws.onclose = () => {
            this.status = "offline";
            this.events.emit("close");
          };
          ws.onerror = (e) => {
            this.events.emit("error", e);
            reject(new Error("Connection failed."));
          };
          ws.onmessage = (m) => {
            let msg;
            try {
              msg = JSON.parse(m.data);
            } catch (_) {
              return;
            }
            if (msg && msg.t)
              this.events.emit(msg.t, msg);
          };
        } catch (e) {
          this.status = "offline";
          reject(e);
        }
      });
    }
    send(obj) {
      if (this.ws && this.ws.readyState === 1)
        this.ws.send(JSON.stringify(obj));
    }
    queueRanked(roster) {
      this.status = "queued";
      this.send({ t: "queue", roster });
    }
    sendAction(battleId, turn, action) {
      this.send({ t: "action", battleId, turn, action });
    }
    cancelQueue() {
      this.send({ t: "dequeue" });
      this.status = "online";
    }
    disconnect() {
      try {
        this.ws && this.ws.close();
      } catch (_) {
      }
      this.status = "offline";
    }
  };
  var arena = new ArenaClient();

  // src/rng.js
  function makeRng(seed) {
    let a = seed >>> 0 || 1;
    const fn = () => {
      a |= 0;
      a = a + 1831565813 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    fn.getState = () => a >>> 0;
    fn.setState = (s) => {
      a = s >>> 0 || 1;
    };
    return fn;
  }
  function hashSeed(str) {
    let h = 2166136261;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function randomSeedString() {
    const alph = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 6; i++)
      s += alph[Math.floor(Math.random() * alph.length)];
    return "R-" + s;
  }
  function randRange(rng, lo, hi) {
    return lo + Math.floor(rng() * (hi - lo + 1));
  }
  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }
  function weightedPick(rng, entries) {
    let total = 0;
    for (const e of entries)
      total += e.weight;
    let r = rng() * total;
    for (const e of entries) {
      r -= e.weight;
      if (r < 0)
        return e.item;
    }
    return entries[entries.length - 1]?.item;
  }
  function sampleDistinct(rng, pool, n, weightOf = () => 1) {
    const remaining = pool.slice();
    const out = [];
    while (out.length < n && remaining.length) {
      const entries = remaining.map((item) => ({ item, weight: Math.max(1e-4, weightOf(item)) }));
      const chosen = weightedPick(rng, entries);
      out.push(chosen);
      remaining.splice(remaining.indexOf(chosen), 1);
    }
    return out;
  }

  // src/mutations.js
  var RARITY_WEIGHT = { common: 100, uncommon: 55, rare: 22, legendary: 6 };
  var RARITY_COLOR = { common: "#b7c4d8", uncommon: "#5fd08a", rare: "#4db6ff", legendary: "#ffc23f" };
  function addType(mon, t) {
    if (!mon.types.includes(t)) {
      if (mon.types.length >= 2)
        mon.types[1] = t;
      else
        mon.types.push(t);
    }
  }
  function scaleStats(mon, factors) {
    for (const [k, f] of Object.entries(factors)) {
      if (mon.stats[k] == null)
        continue;
      mon.stats[k] = Math.max(1, Math.floor(mon.stats[k] * f));
    }
    if (factors.maxHp) {
      mon.stats.hp = Math.min(mon.stats.hp, mon.stats.maxHp);
    }
  }
  function addAbility(mon, tag) {
    if (!mon.abilities)
      mon.abilities = [];
    if (!mon.abilities.includes(tag))
      mon.abilities.push(tag);
  }
  var MUTATIONS = {
    // --- type grafts (uncommon): reshape offense (STAB) & defensive profile ---
    draconic: { name: "Draconic", rarity: "uncommon", desc: "Grafts the Dragon type.", apply: (m) => addType(m, "dragon") },
    infernal: { name: "Infernal", rarity: "uncommon", desc: "Grafts the Fire type.", apply: (m) => addType(m, "fire") },
    tidal: { name: "Tidal", rarity: "uncommon", desc: "Grafts the Water type.", apply: (m) => addType(m, "water") },
    verdant: { name: "Verdant", rarity: "uncommon", desc: "Grafts the Grass type.", apply: (m) => addType(m, "grass") },
    voltaic: { name: "Voltaic", rarity: "uncommon", desc: "Grafts the Electric type.", apply: (m) => addType(m, "electric") },
    spectral: { name: "Spectral", rarity: "uncommon", desc: "Grafts the Ghost type.", apply: (m) => addType(m, "ghost") },
    toxic: { name: "Toxic", rarity: "uncommon", desc: "Grafts the Poison type.", apply: (m) => addType(m, "poison") },
    frostbite: { name: "Frostbitten", rarity: "uncommon", desc: "Grafts the Ice type.", apply: (m) => addType(m, "ice") },
    tectonic: { name: "Tectonic", rarity: "uncommon", desc: "Grafts the Ground type.", apply: (m) => addType(m, "ground") },
    // --- stat grafts ---
    titan: { name: "Titan", rarity: "uncommon", desc: "+25% max HP, +20% Attack.", apply: (m) => scaleStats(m, { maxHp: 1.25, atk: 1.2 }) },
    bulwark: { name: "Bulwark", rarity: "uncommon", desc: "+30% Defense & Sp. Defense.", apply: (m) => scaleStats(m, { def: 1.3, spd: 1.3 }) },
    sprinter: { name: "Sprinter", rarity: "uncommon", desc: "+35% Speed.", apply: (m) => scaleStats(m, { spe: 1.35 }) },
    mystic: { name: "Mystic", rarity: "uncommon", desc: "+30% Sp. Attack.", apply: (m) => scaleStats(m, { spa: 1.3 }) },
    glasscannon: {
      name: "Glass Cannon",
      rarity: "rare",
      desc: "+40% Atk & Sp.Atk, \u221230% defenses.",
      apply: (m) => scaleStats(m, { atk: 1.4, spa: 1.4, def: 0.7, spd: 0.7 })
    },
    // --- pseudo-abilities (rare): read by the battle engine in phase 2 ---
    levitator: { name: "Levitator", rarity: "rare", desc: "Levitate: immune to Ground moves.", apply: (m) => addAbility(m, "levitate") },
    regenerator: { name: "Regenerator", rarity: "rare", desc: "Heals 1/3 HP when switched out.", apply: (m) => addAbility(m, "regenerator") },
    berserker: { name: "Berserker", rarity: "rare", desc: "Guts: +50% Attack while statused.", apply: (m) => addAbility(m, "guts") },
    multiscale: { name: "Aegis", rarity: "rare", desc: "Takes half damage while at full HP.", apply: (m) => addAbility(m, "multiscale") },
    vampiric: { name: "Vampiric", rarity: "rare", desc: "Damaging moves drain 25% of damage.", apply: (m) => {
      m.lifesteal = Math.max(m.lifesteal || 0, 0.25);
    } },
    sharpshooter: { name: "Sharpshooter", rarity: "rare", desc: "This Pok\xE9mon's moves never miss.", apply: (m) => {
      m.trueStrike = true;
    } },
    adaptive: { name: "Adaptive", rarity: "rare", desc: "STAB is doubled (2\xD7 instead of 1.5\xD7).", apply: (m) => {
      m.adaptive = true;
    } },
    // --- legendary chase ---
    primeval: {
      name: "Primeval",
      rarity: "legendary",
      desc: "+15% to every stat and Adaptive STAB.",
      apply: (m) => {
        scaleStats(m, { maxHp: 1.15, atk: 1.15, def: 1.15, spa: 1.15, spd: 1.15, spe: 1.15 });
        m.adaptive = true;
      }
    }
  };
  function applyMutation(mon, id) {
    const mut = MUTATIONS[id];
    if (!mut)
      return false;
    if (!mon.mutations)
      mon.mutations = [];
    if (mon.mutations.includes(id))
      return false;
    mut.apply(mon);
    mon.mutations.push(id);
    return true;
  }
  var SIGILS = {
    solar_core: {
      name: "Solar Core",
      rarity: "uncommon",
      desc: "Harsh sunlight: your Fire moves +30%, Water \u221230%.",
      effects: { weather: "sun", typeMult: { fire: 1.3, water: 0.7 } }
    },
    monsoon: {
      name: "Monsoon",
      rarity: "uncommon",
      desc: "Rain: your Water moves +30%, Fire \u221230%.",
      effects: { weather: "rain", typeMult: { water: 1.3, fire: 0.7 } }
    },
    permafrost: {
      name: "Permafrost",
      rarity: "uncommon",
      desc: "Hail: your Ice moves +30%.",
      effects: { weather: "hail", typeMult: { ice: 1.3 } }
    },
    sand_totem: {
      name: "Sand Totem",
      rarity: "uncommon",
      desc: "Sandstorm: your Rock & Ground moves surge.",
      effects: { weather: "sand", typeMult: { rock: 1.3, ground: 1.15 } }
    },
    toxic_spikes: {
      name: "Toxic Spikes",
      rarity: "uncommon",
      desc: "Foes are poisoned when they enter battle.",
      effects: { enemyEntryStatus: "psn" }
    },
    trick_lens: {
      name: "Trick Lens",
      rarity: "rare",
      desc: "Trick Room: slower Pok\xE9mon move first.",
      effects: { trickRoom: true }
    },
    momentum: {
      name: "Momentum Engine",
      rarity: "rare",
      desc: "+8% crit each turn you don't switch.",
      effects: { critRampPerTurn: 0.08 }
    },
    vampire_pact: {
      name: "Vampire Pact",
      rarity: "rare",
      desc: "Your moves heal 12% of the damage they deal.",
      effects: { lifesteal: 0.12 }
    },
    glass_armory: {
      name: "Glass Armory",
      rarity: "rare",
      desc: "ALL damage dealt (yours and foes') +30%.",
      effects: { globalDamageMult: 1.3 }
    },
    second_wind: {
      name: "Second Wind",
      rarity: "rare",
      desc: "Once per battle, a lethal hit leaves you at 1 HP.",
      effects: { endureOnce: true }
    },
    sturdy_banner: {
      name: "Sturdy Banner",
      rarity: "uncommon",
      desc: "At full HP, no single hit takes more than half.",
      effects: { sturdyAtFull: true }
    },
    lucky_egg: {
      name: "Lucky Egg",
      rarity: "common",
      desc: "+50% XP from battles.",
      effects: { xpMult: 1.5 }
    },
    merchants_charm: {
      name: "Merchant's Charm",
      rarity: "common",
      desc: "+50% gold from battles.",
      effects: { goldMult: 1.5 }
    },
    ball_cache: {
      name: "Ball Cache",
      rarity: "common",
      desc: "Start the run with 2 extra Pok\xE9 Balls.",
      effects: { startingBalls: 2 }
    },
    apex: {
      name: "Apex Predator",
      rarity: "legendary",
      desc: "Your damage +10%, and KOs heal 25% HP.",
      effects: { yourDamageMult: 1.1, healOnKill: 0.25 }
    }
  };
  function emptyEffects() {
    return {
      weather: null,
      typeMult: {},
      globalDamageMult: 1,
      yourDamageMult: 1,
      lifesteal: 0,
      enemyEntryStatus: null,
      trickRoom: false,
      critRampPerTurn: 0,
      xpMult: 1,
      goldMult: 1,
      startingBalls: 0,
      endureOnce: false,
      sturdyAtFull: false,
      healOnKill: 0
    };
  }
  function aggregateSigils(ids) {
    const out = emptyEffects();
    for (const id of ids || []) {
      const s = SIGILS[id];
      if (!s)
        continue;
      const e = s.effects;
      if (e.weather)
        out.weather = e.weather;
      if (e.typeMult)
        for (const [t, m] of Object.entries(e.typeMult))
          out.typeMult[t] = (out.typeMult[t] || 1) * m;
      if (e.globalDamageMult)
        out.globalDamageMult *= e.globalDamageMult;
      if (e.yourDamageMult)
        out.yourDamageMult *= e.yourDamageMult;
      if (e.lifesteal)
        out.lifesteal += e.lifesteal;
      if (e.enemyEntryStatus)
        out.enemyEntryStatus = e.enemyEntryStatus;
      if (e.trickRoom)
        out.trickRoom = true;
      if (e.critRampPerTurn)
        out.critRampPerTurn += e.critRampPerTurn;
      if (e.xpMult)
        out.xpMult *= e.xpMult;
      if (e.goldMult)
        out.goldMult *= e.goldMult;
      if (e.startingBalls)
        out.startingBalls += e.startingBalls;
      if (e.endureOnce)
        out.endureOnce = true;
      if (e.sturdyAtFull)
        out.sturdyAtFull = true;
      if (e.healOnKill)
        out.healOnKill = Math.max(out.healOnKill, e.healOnKill);
    }
    return out;
  }
  function applyStartingBallBonus(items, effects) {
    if (!items)
      return 0;
    const amount = Math.max(0, Math.floor(effects?.startingBalls || 0));
    items["poke-ball"] = (items["poke-ball"] || 0) + amount;
    return amount;
  }
  function mutationList() {
    return Object.keys(MUTATIONS).map((id) => ({ id, ...MUTATIONS[id] }));
  }
  function sigilList() {
    return Object.keys(SIGILS).map((id) => ({ id, ...SIGILS[id] }));
  }
  function rarityWeightOf(def) {
    return RARITY_WEIGHT[def.rarity] || 1;
  }

  // src/run.js
  var NODE = {
    BATTLE: "battle",
    // wild encounter (catchable)
    ELITE: "elite",
    // Gym-Leader boss
    CHAMPION: "champion",
    SHOP: "shop",
    REST: "rest",
    MYSTERY: "mystery"
  };
  var RUN_CONFIG = { regions: 3, rowsPerRegion: 7, width: 4, paths: 6 };
  function generateMap(rng, cfg = RUN_CONFIG) {
    const { regions, rowsPerRegion, width, paths } = cfg;
    const totalRows = regions * rowsPerRegion;
    const nodes = {};
    const key = (r, c) => `${r}-${c}`;
    const regionOf = (r) => Math.floor(r / rowsPerRegion);
    const isBossRow = (r) => (r + 1) % rowsPerRegion === 0;
    const ensure = (r, c) => {
      const id = key(r, c);
      if (!nodes[id])
        nodes[id] = { id, row: r, col: c, region: regionOf(r), type: null, edges: [] };
      return nodes[id];
    };
    const link = (a, b) => {
      if (!a.edges.includes(b.id))
        a.edges.push(b.id);
    };
    for (let p = 0; p < paths; p++) {
      let col = Math.floor(rng() * width);
      ensure(0, col);
      for (let r = 0; r < totalRows - 1; r++) {
        const opts = [col - 1, col, col + 1].filter((c) => c >= 0 && c < width);
        const nc = pick(rng, opts);
        link(ensure(r, col), ensure(r + 1, nc));
        col = nc;
      }
    }
    const centerCol = Math.floor(width / 2);
    for (let R = rowsPerRegion - 1; R < totalRows; R += rowsPerRegion) {
      const rowNodes = Object.values(nodes).filter((n) => n.row === R);
      const outward = /* @__PURE__ */ new Set();
      rowNodes.forEach((n) => n.edges.forEach((e) => outward.add(e)));
      rowNodes.forEach((n) => delete nodes[n.id]);
      const boss = {
        id: `${R}-boss`,
        row: R,
        col: centerCol,
        region: regionOf(R),
        type: R === totalRows - 1 ? NODE.CHAMPION : NODE.ELITE,
        edges: [...outward]
      };
      nodes[boss.id] = boss;
      Object.values(nodes).filter((n) => n.row === R - 1).forEach((n) => {
        n.edges = [boss.id];
      });
    }
    const preBoss = (r) => isBossRow(r + 1);
    const rest = Object.values(nodes).filter((n) => !n.type).sort((a, b) => a.row - b.row || a.col - b.col);
    for (const n of rest) {
      const local = n.row % rowsPerRegion;
      if (local <= 1) {
        n.type = NODE.BATTLE;
        continue;
      }
      if (preBoss(n.row)) {
        n.type = NODE.REST;
        continue;
      }
      const pool = [
        { item: NODE.BATTLE, weight: 58 },
        { item: NODE.MYSTERY, weight: 24 },
        { item: NODE.SHOP, weight: 10 },
        { item: NODE.REST, weight: 8 }
      ];
      let t = rng() * pool.reduce((s, e) => s + e.weight, 0);
      for (const e of pool) {
        t -= e.weight;
        if (t < 0) {
          n.type = e.item;
          break;
        }
      }
      if (!n.type)
        n.type = NODE.BATTLE;
    }
    for (let reg = 0; reg < regions; reg++) {
      const inReg = Object.values(nodes).filter((n) => n.region === reg && n.type !== NODE.CHAMPION && n.type !== NODE.ELITE);
      if (!inReg.some((n) => n.type === NODE.SHOP)) {
        const cand = inReg.filter((n) => n.type === NODE.BATTLE && !preBoss(n.row) && n.row % rowsPerRegion > 1);
        if (cand.length)
          pick(rng, cand).type = NODE.SHOP;
      }
    }
    const rows = [];
    for (let r = 0; r < totalRows; r++) {
      rows.push(Object.values(nodes).filter((n) => n.row === r).sort((a, b) => a.col - b.col).map((n) => n.id));
    }
    return { nodes, rows, totalRows, regions, rowsPerRegion, width };
  }
  var RUN_ID = 0;
  function createRun(seedString, opts = {}) {
    const seed = hashSeed(seedString);
    const rng = makeRng(seed);
    const cfg = { ...RUN_CONFIG, ...opts.config || {} };
    const map = generateMap(rng, cfg);
    return {
      id: ++RUN_ID,
      seed: seedString,
      seedNum: seed,
      rngState: rng.getState(),
      // continue the same stream for reward rolls
      config: cfg,
      ascension: opts.ascension || 0,
      map,
      position: null,
      // current node id; null = choosing a row-0 node
      resolved: false,
      // has the current node been completed?
      visited: [],
      // node ids, in order
      team: [],
      // filled in by the controller
      box: [],
      gold: opts.gold || 0,
      balls: opts.balls != null ? opts.balls : 3,
      sigils: [...opts.sigils || []],
      // owned sigil ids
      fragments: 0,
      // meta-currency earned this run
      over: false,
      won: false
    };
  }
  function withRng(run, fn) {
    const rng = makeRng(run.seedNum);
    rng.setState(run.rngState);
    const result = fn(rng);
    run.rngState = rng.getState();
    return result;
  }
  function nodeById(run, id) {
    return run.map.nodes[id] || null;
  }
  function currentNode(run) {
    return run.position ? nodeById(run, run.position) : null;
  }
  function availableNext(run) {
    if (run.over)
      return [];
    if (run.position == null)
      return run.map.rows[0].map((id) => run.map.nodes[id]);
    if (!run.resolved)
      return [];
    const node = nodeById(run, run.position);
    return (node.edges || []).map((id) => run.map.nodes[id]);
  }
  function travelTo(run, nodeId) {
    const options = availableNext(run);
    const target = options.find((n) => n.id === nodeId);
    if (!target)
      return null;
    if (run.position != null)
      run.visited.push(run.position);
    run.position = target.id;
    run.resolved = false;
    return target;
  }
  function markResolved(run, outcome = {}) {
    run.resolved = true;
    const node = currentNode(run);
    if (node && node.type === NODE.CHAMPION && outcome.won) {
      run.over = true;
      run.won = true;
    }
    return run;
  }
  function rollGold(run, kind) {
    return withRng(run, (rng) => {
      switch (kind) {
        case NODE.BATTLE:
          return randRange(rng, 12, 26) + run.ascension * 3;
        case NODE.ELITE:
          return randRange(rng, 55, 90) + run.ascension * 10;
        case NODE.CHAMPION:
          return 220 + run.ascension * 25;
        default:
          return 0;
      }
    });
  }
  function offerSigils(run, n = 3) {
    return withRng(run, (rng) => {
      const pool = sigilList().filter((s) => !run.sigils.includes(s.id));
      return sampleDistinct(rng, pool, Math.min(n, pool.length), rarityWeightOf);
    });
  }
  function offerMutations(run, n = 3) {
    return withRng(run, (rng) => {
      const pool = mutationList();
      return sampleDistinct(rng, pool, Math.min(n, pool.length), rarityWeightOf);
    });
  }
  function rollShop(run) {
    return withRng(run, (rng) => {
      const depth = 1 + run.visited.length / 8;
      const priceMut = (r) => Math.round(({ common: 90, uncommon: 150, rare: 260, legendary: 500 }[r] || 120) * depth);
      const muts = sampleDistinct(rng, mutationList(), 2, rarityWeightOf).map((m) => ({ kind: "mutation", id: m.id, name: m.name, rarity: m.rarity, price: priceMut(m.rarity) }));
      const items = [
        { kind: "item", id: "potion", name: "Potion", price: 60 },
        { kind: "item", id: "super-potion", name: "Super Potion", price: 140 },
        { kind: "item", id: "poke-ball", name: "Pok\xE9 Ball", price: 120 },
        { kind: "item", id: "heal", name: "Full Heal (team)", price: Math.round(180 * depth) }
      ];
      const stock = [...items, ...muts];
      if (rng() < 0.5) {
        const s = offerSigilsInline(rng, run, 1)[0];
        if (s)
          stock.push({ kind: "sigil", id: s.id, name: s.name, rarity: s.rarity, price: Math.round(320 * depth) });
      }
      return stock;
    });
  }
  function offerSigilsInline(rng, run, n) {
    const pool = sigilList().filter((s) => !run.sigils.includes(s.id));
    return sampleDistinct(rng, pool, Math.min(n, pool.length), rarityWeightOf);
  }
  var EVENTS = [
    {
      id: "wishing_well",
      title: "Wishing Well",
      weight: 10,
      desc: "A shimmering well hums with promise.",
      choices: [
        { label: "Toss in 40 gold", effect: { kind: "gamble", cost: 40, outcomes: ["gold", "mutation", "nothing"] } },
        { label: "Leave it be", effect: { kind: "none" } }
      ]
    },
    {
      id: "berry_grove",
      title: "Berry Grove",
      weight: 12,
      desc: "Wild berries grow thick here.",
      choices: [
        { label: "Rest and eat", effect: { kind: "heal", amount: "full" } }
      ]
    },
    {
      id: "abandoned_ball",
      title: "Abandoned Pok\xE9 Ball",
      weight: 10,
      desc: "A dented ball lies in the grass.",
      choices: [
        { label: "Pocket it", effect: { kind: "balls", amount: 1 } }
      ]
    },
    {
      id: "cursed_shrine",
      title: "Cursed Shrine",
      weight: 8,
      desc: "Power radiates \u2014 at a price.",
      choices: [
        { label: "Accept the gift", effect: { kind: "mutationThenScar" } },
        { label: "Back away", effect: { kind: "none" } }
      ]
    },
    {
      id: "mysterious_egg",
      title: "Mysterious Egg",
      weight: 7,
      desc: "A warm egg trembles. Something's inside\u2026",
      choices: [
        { label: "Take the egg", effect: { kind: "recruit" } }
      ]
    },
    {
      id: "move_tutor",
      title: "Move Tutor",
      weight: 8,
      desc: "An old master offers to teach a move.",
      choices: [
        { label: "Learn (100 gold)", effect: { kind: "tutor", cost: 100 } },
        { label: "Decline", effect: { kind: "none" } }
      ]
    },
    {
      id: "gambler",
      title: "The Gambler",
      weight: 8,
      desc: '"Double or nothing on that gold, kid."',
      choices: [
        { label: "Bet 60 gold", effect: { kind: "coinflip", stake: 60 } },
        { label: "Walk on", effect: { kind: "none" } }
      ]
    },
    {
      id: "sigil_altar",
      title: "Sigil Altar",
      weight: 6,
      desc: "An altar hums with run-shaping power.",
      choices: [
        { label: "Attune", effect: { kind: "sigil" } }
      ]
    }
  ];
  function rollMysteryEvent(run) {
    return withRng(run, (rng) => {
      const entries = EVENTS.map((e) => ({ item: e, weight: e.weight }));
      let t = rng() * entries.reduce((s, e) => s + e.weight, 0);
      for (const e of entries) {
        t -= e.weight;
        if (t < 0)
          return e.item;
      }
      return EVENTS[0];
    });
  }
  function encounterLevel(run) {
    const depth = run.visited?.length || 0;
    const ascension = run.ascension || 0;
    const curve = Math.min(100, 5 + Math.floor(depth * 1.35) + ascension * 6);
    const living = (run.team || []).filter((m) => m?.stats?.hp > 0 && Number.isFinite(m.level));
    if (!living.length)
      return curve;
    const strongest = Math.max(...living.map((m) => m.level));
    return Math.min(curve, strongest + 1 + ascension * 2);
  }
  function bossMemberLevel(run, memberIndex = 0, champion = false) {
    const bossStep = champion ? 2 : 1;
    return Math.min(100, encounterLevel(run) + bossStep + Math.floor(Math.max(0, memberIndex) / 2));
  }

  // src/progression.js
  var PROGRESSION_VERSION = 2;
  var GEN1_DEX_SIZE = 151;
  var DEX_FIELDS = /* @__PURE__ */ new Set(["seen", "caught", "shinyCaught"]);
  function nonNegativeInt(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }
  function cleanDexIds(value) {
    if (!Array.isArray(value))
      return [];
    return [...new Set(value.map(Number).filter((id) => Number.isInteger(id) && id >= 1 && id <= GEN1_DEX_SIZE))].sort((a, b) => a - b);
  }
  function cleanRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return {};
    return Object.fromEntries(Object.entries(value).filter(
      ([, entry]) => typeof entry === "boolean" || typeof entry === "string" || typeof entry === "number" && Number.isFinite(entry)
    ));
  }
  function defaultProgression() {
    return {
      version: PROGRESSION_VERSION,
      fragments: 0,
      expeditionsStarted: 0,
      expeditionsWon: 0,
      bestDepth: 0,
      bestWinStreak: 0,
      currentWinStreak: 0,
      playTimeMs: 0,
      seen: [],
      caught: [],
      shinyCaught: [],
      unlocks: {},
      upgrades: {}
    };
  }
  function normalizeProgression(raw) {
    const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const wins = nonNegativeInt(source.expeditionsWon);
    const currentStreak = nonNegativeInt(source.currentWinStreak);
    const shinyCaught = cleanDexIds(source.shinyCaught);
    const caught = cleanDexIds([...Array.isArray(source.caught) ? source.caught : [], ...shinyCaught]);
    const seen = cleanDexIds([...Array.isArray(source.seen) ? source.seen : [], ...caught]);
    return {
      ...source,
      version: PROGRESSION_VERSION,
      fragments: nonNegativeInt(source.fragments),
      expeditionsStarted: Math.max(nonNegativeInt(source.expeditionsStarted), wins),
      expeditionsWon: wins,
      bestDepth: nonNegativeInt(source.bestDepth),
      bestWinStreak: Math.max(nonNegativeInt(source.bestWinStreak), currentStreak),
      currentWinStreak: currentStreak,
      playTimeMs: nonNegativeInt(source.playTimeMs),
      seen,
      caught,
      shinyCaught,
      unlocks: cleanRecord(source.unlocks),
      upgrades: cleanRecord(source.upgrades)
    };
  }
  function registerSpeciesId(profile, field, value) {
    if (!profile || !DEX_FIELDS.has(field))
      return false;
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1 || id > GEN1_DEX_SIZE)
      return false;
    const add = (key) => {
      const ids = cleanDexIds(profile[key]);
      if (ids.includes(id)) {
        profile[key] = ids;
        return false;
      }
      ids.push(id);
      ids.sort((a, b) => a - b);
      profile[key] = ids;
      return true;
    };
    const added = add(field);
    if (field === "caught" || field === "shinyCaught")
      add("seen");
    if (field === "shinyCaught")
      add("caught");
    return added;
  }
  function progressionCounts(profile) {
    const normalized = normalizeProgression(profile);
    return {
      seen: normalized.seen.length,
      caught: normalized.caught.length,
      shinyCaught: normalized.shinyCaught.length
    };
  }
  function recordExpeditionStart(profile) {
    profile.expeditionsStarted = nonNegativeInt(profile.expeditionsStarted) + 1;
    return profile.expeditionsStarted;
  }
  function recordBestDepth(profile, depth) {
    profile.bestDepth = Math.max(nonNegativeInt(profile.bestDepth), nonNegativeInt(depth));
    return profile.bestDepth;
  }
  function recordRunResult(profile, won) {
    if (won) {
      profile.expeditionsWon = nonNegativeInt(profile.expeditionsWon) + 1;
      profile.currentWinStreak = nonNegativeInt(profile.currentWinStreak) + 1;
      profile.bestWinStreak = Math.max(
        nonNegativeInt(profile.bestWinStreak),
        profile.currentWinStreak
      );
      profile.expeditionsStarted = Math.max(
        nonNegativeInt(profile.expeditionsStarted),
        profile.expeditionsWon
      );
    } else {
      profile.currentWinStreak = 0;
    }
    return profile;
  }

  // src/ui.js
  var $ = (sel) => document.querySelector(sel);
  function el(tag, attrs = {}, txt = "") {
    const x = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class")
        x.className = v;
      else if (k === "html")
        x.innerHTML = v;
      else
        x.setAttribute(k, v);
    }
    if (txt)
      x.textContent = txt;
    return x;
  }
  function show(view) {
    const map = {
      menu: "#menu",
      moves: "#movesView",
      swap: "#swapView",
      bag: "#bagView",
      box: "#boxView"
    };
    for (const [name, sel] of Object.entries(map)) {
      const node = $(sel);
      if (node)
        node.classList.toggle("hidden", view !== name);
    }
  }
  var reduceMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var typeToken = 0;
  function typeText(str, opts = {}) {
    const target = document.getElementById("textContent");
    const caret = document.querySelector("#textLine .caret");
    if (!target)
      return Promise.resolve();
    const token = ++typeToken;
    const speed = opts.speed ?? 16;
    if (caret)
      caret.classList.remove("on");
    if (reduceMotion || opts.instant) {
      target.textContent = str;
      if (caret)
        caret.classList.add("on");
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      target.textContent = "";
      let i = 0;
      const step = () => {
        if (token !== typeToken)
          return resolve();
        target.textContent = str.slice(0, i);
        i++;
        if (i <= str.length)
          setTimeout(step, speed);
        else {
          if (caret)
            caret.classList.add("on");
          resolve();
        }
      };
      step();
    });
  }
  function setText(str) {
    const target = document.getElementById("textContent");
    if (target)
      target.textContent = str;
  }

  // src/main.js
  console.info("Pok\xE9Battle Arena \u2014 build v1.0");
  var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function cssNum(name, fallback) {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
    return isNaN(v) ? fallback : v;
  }
  function hpColor(f) {
    return f > 0.5 ? "var(--hp-green)" : f > 0.2 ? "var(--hp-yellow)" : "var(--hp-red)";
  }
  var ITEM_ICON = (name) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}.png`;
  async function say(str, hold = 260) {
    await typeText(str);
    if (hold)
      await sleep(hold);
  }
  var RUN_KEY = "pkbattle:run:v1";
  var VAULT_KEY = "pkbattle:vault:v1";
  var META_KEY = "pkbattle:meta:v2";
  var LEGACY_META_KEY = "pkbattle:meta:v1";
  var state = {
    party: [],
    // === run.team while an expedition is active
    box: [],
    // === run.box
    active: 0,
    player: null,
    enemy: null,
    busy: false,
    auto: false,
    started: false,
    mode: "map",
    // "map" | "wild" | "trainer"
    trainer: null,
    // active Elite / Champion boss
    trainerTeam: [],
    trainerIdx: 0,
    isChampion: false,
    run: null,
    // the active Expedition (see run.js)
    battle: null,
    // { kind, onWin, onLose, onFlee } for the current node battle
    sigilFx: emptyEffects(),
    noSwitchTurns: 0,
    endureUsed: { used: false },
    vault: [],
    // persistent ascended roster (for ranked)
    meta: defaultProgression(),
    items: null
    // aliased to run.items during a run
  };
  function registerPokemonProgress(mon, field, announce = true) {
    if (!mon || !registerSpeciesId(state.meta, field, mon.id))
      return false;
    saveMeta();
    if (announce) {
      const counts = progressionCounts(state.meta);
      const label = field === "seen" ? "Seen" : "Caught";
      floatToast(`Pok\xE9dex \xB7 ${label} ${counts[field]}/${GEN1_DEX_SIZE} \xB7 ${mon.name}`);
    }
    return true;
  }
  function backfillOwnedPokemon(...groups) {
    let added = 0;
    for (const group of groups) {
      for (const mon of Array.isArray(group) ? group : []) {
        if (mon && registerSpeciesId(state.meta, "caught", mon.id))
          added++;
      }
    }
    if (added)
      saveMeta();
    return added;
  }
  function setBusy(v) {
    state.busy = v;
    document.querySelectorAll(".msgbox button, #menu button").forEach((b) => b.disabled = v);
  }
  function zeroStages() {
    return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
  }
  function resetStages(mon) {
    if (mon)
      mon.stages = zeroStages();
  }
  function ensureRuntime(mon) {
    if (!mon.stages)
      mon.stages = zeroStages();
    if (!mon.status)
      mon.status = { cond: "none", turns: 0, toxic: 0 };
    return mon;
  }
  function makeMon(data, level = 5) {
    const b = Object.fromEntries(data.stats.map((s) => [s.stat.name, s.base_stat]));
    const maxHp = Math.floor(b.hp * 2 * level / 100 + level + 10);
    const st = (base) => Math.floor(base * 2 * level / 100 + 5);
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
        maxHp,
        hp: maxHp,
        atk: st(b.attack),
        def: st(b.defense),
        spa: st(b["special-attack"]),
        spd: st(b["special-defense"]),
        spe: st(b.speed)
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
      status: { cond: "none", turns: 0, toxic: 0 }
    };
  }
  async function buildMon(idOrName, level) {
    const data = await fetchPokemon(idOrName);
    const species = await fetchSpecies(data.id);
    const mon = makeMon(data, level);
    mon.capture_rate = species.capture_rate;
    mon.moves = await fetchMoveset(data, level);
    if (!mon.moves.length)
      mon.moves = [{ ...STRUGGLE, name: "Tackle", key: "tackle", power: 40, pp: 35, ppLeft: 35, drain: 0 }];
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
    if (!mon.growth)
      return;
    await animateXP(mon, amount);
    mon.xp += amount;
    while (mon.xp >= mon.xpNext) {
      mon.xp -= mon.xpNext;
      await levelUp(mon);
    }
    updateHUD();
  }
  async function animateXP(mon, amount) {
    const fill = $("#playerXpFill");
    if (!fill || mon !== state.player)
      return;
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
  function mergeMoves(oldMoves, freshMoves) {
    const byKey = new Map(oldMoves.map((m) => [m.key, m]));
    const result = freshMoves.map((m) => {
      const prev = byKey.get(m.key);
      return prev ? { ...m, ppLeft: Math.min(prev.ppLeft, m.pp) } : m;
    });
    return result.length ? result : oldMoves;
  }
  async function maybeEvolve(mon) {
    if (!mon.evoChainUrl)
      return;
    const chain = await fetchEvo(mon.evoChainUrl);
    const find = (node2) => {
      if (node2.species.name.toLowerCase() === mon.name.toLowerCase())
        return node2;
      for (const c of node2.evolves_to) {
        const r = find(c);
        if (r)
          return r;
      }
      return null;
    };
    const node = find(chain.chain);
    if (!node)
      return;
    const candidate = node.evolves_to?.find(
      (e) => e.evolution_details?.some((d) => (d.min_level || 0) <= mon.level && d.min_level)
    );
    if (!candidate)
      return;
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
      if (state.active === idx)
        state.player = evolved;
    }
    updateHUD();
    await showBanner(`${oldName} evolved into ${evolved.name}!`, 1400);
    await playCry(evolved);
    if (registerPokemonProgress(evolved, "caught", false)) {
      const counts = progressionCounts(state.meta);
      await say(`Pok\xE9dex updated: ${counts.caught}/${GEN1_DEX_SIZE} species caught.`);
    }
  }
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
    container.innerHTML = "";
    list.forEach((alive) => {
      const i = el("i", {});
      if (!alive)
        i.classList.add("fainted");
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
      $("#playerName").textContent = p.name;
      $("#playerLevel").textContent = p.level;
      renderTypes($("#playerTypes"), p.types);
      renderStatus($("#playerStatus"), p.status);
      const pf = p.stats.hp / p.stats.maxHp;
      $("#playerHpText").textContent = `${p.stats.hp}/${p.stats.maxHp}`;
      const pFill = $("#playerHpFill");
      pFill.style.width = `${100 * pf}%`;
      pFill.style.background = hpColor(pf);
      if (p.xpNext)
        $("#playerXpFill").style.width = `${100 * clamp(p.xp / p.xpNext, 0, 1)}%`;
      renderDots($("#playerParty"), state.party.map((m) => m.stats.hp > 0));
      const pcard = $("#playerCard");
      if (pcard)
        pcard.style.setProperty("--type", TYPE_COLOR[p.types[0]] || "#888");
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
        const dots = state.trainerTeam.map(
          (_, i) => i > state.trainerIdx ? true : i === state.trainerIdx ? e.stats.hp > 0 : false
        );
        renderDots($("#enemyParty"), dots);
      } else {
        renderDots($("#enemyParty"), [e.stats.hp > 0]);
      }
      const ecard = $("#enemyCard");
      if (ecard)
        ecard.style.setProperty("--type", TYPE_COLOR[e.types[0]] || "#888");
      if (es && es.dataset.src !== e.sprite) {
        es.dataset.src = e.sprite;
        es.src = e.sprite;
      }
    }
    updateScore();
  }
  function updateScore() {
    const w = $("#winCount"), m = $("#moneyCount"), bs = $("#badgeStrip");
    if (w)
      w.textContent = state.meta.fragments;
    if (m)
      m.textContent = state.run ? state.run.gold : 0;
    if (bs)
      bs.innerHTML = "";
    updateObjective();
  }
  function updateObjective() {
    const obj = $("#objective");
    if (!obj)
      return;
    let text;
    if (state.run && state.started) {
      const region = (currentNode(state.run)?.region ?? 0) + 1;
      text = `Expedition \xB7 Region ${region}/${state.run.config.regions} \xB7 Depth ${state.run.visited.length}`;
    } else {
      text = `Vault: ${state.vault.length} \xB7 Expeditions won: ${state.meta.expeditionsWon}`;
    }
    obj.innerHTML = `<svg class="ico"><use href="#i-medal" /></svg> <span>${text}</span>`;
  }
  function ensureVfx() {
    return document.getElementById("vfx");
  }
  function floatTextNear(sel, txt, cls = "bad") {
    const host = $(".screen"), target = $(sel);
    if (!host || !target)
      return;
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
    if (!host || !tgt)
      return;
    const r = tgt.getBoundingClientRect(), h = host.getBoundingClientRect();
    const cx = r.left - h.left + r.width * 0.55, cy = r.top - h.top + r.height * 0.45;
    for (let i = 0; i < count; i++) {
      const s = el("div", { class: "spark" });
      s.style.color = TYPE_COLOR[type] || "#fff";
      const ang = Math.random() * Math.PI * 2;
      const d0 = 4 + Math.random() * 8, d1 = 26 + Math.random() * 22;
      s.style.left = cx + "px";
      s.style.top = cy + "px";
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
    if (!host || !tgt)
      return;
    const r = tgt.getBoundingClientRect(), h = host.getBoundingClientRect();
    const b = el("div", { class: "badge " + kind }, txt);
    b.style.left = `${r.left - h.left + r.width * 0.5}px`;
    b.style.top = `${r.top - h.top - 8}px`;
    host.appendChild(b);
    setTimeout(() => b.remove(), 900);
  }
  function screenShake(kind = "hit") {
    const root = $(".screen");
    if (!root)
      return;
    const cls = kind === "crit" ? "shake-crit" : "shake-hit";
    root.classList.add(cls);
    setTimeout(() => root.classList.remove(cls), kind === "crit" ? 400 : 160);
  }
  async function lunge(sel, towardRight) {
    const node = $(sel);
    if (!node)
      return;
    const dx = (towardRight ? 1 : -1) * 26;
    try {
      await node.animate(
        [
          { transform: "translate(0,0)" },
          { transform: `translate(${dx}px,-6px)`, offset: 0.4 },
          { transform: "translate(0,0)" }
        ],
        { duration: 240, easing: "ease-out" }
      ).finished;
    } catch (_) {
    }
  }
  function impactSprite(sel, crit, towardRight) {
    const node = $(sel);
    if (!node)
      return;
    const rot = (towardRight ? -1 : 1) * (crit ? 10 : 6);
    const dx = (towardRight ? 8 : -8) * (crit ? 1.5 : 1);
    node.animate(
      [
        { transform: "translate(0,0) rotate(0) scale(1)", filter: "brightness(2) saturate(0)" },
        { transform: `translate(${dx}px,-2px) rotate(${rot}deg) scale(${crit ? 1.06 : 1.02})`, filter: "brightness(1.3)", offset: 0.35 },
        { transform: "translate(0,0) rotate(0) scale(1)", filter: "none" }
      ],
      { duration: crit ? 380 : 220, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
  }
  function playSparkle(sel) {
    spawnSparksAt(sel, "electric", 16);
  }
  function flashWhite(sel) {
    const node = $(sel);
    if (!node)
      return Promise.resolve();
    return node.animate(
      [{ filter: "brightness(1)" }, { filter: "brightness(4) saturate(0)" }, { filter: "brightness(1)" }],
      { duration: 700, iterations: 1 }
    ).finished.catch(() => {
    });
  }
  function faintOut(sel) {
    const node = $(sel);
    if (!node)
      return Promise.resolve();
    return node.animate(
      [
        { filter: "none", opacity: 1, transform: "translateY(0) scale(1)" },
        { filter: "brightness(2) saturate(0)", opacity: 0.9, transform: "translateY(4px) scale(.98)", offset: 0.4 },
        { filter: "brightness(2) saturate(0)", opacity: 0, transform: "translateY(16px) scale(.9)" }
      ],
      { duration: 650, easing: "ease-in" }
    ).finished.then(() => {
      node.style.opacity = "0";
    }).catch(() => {
    });
  }
  async function fadeInSprite(sel) {
    const node = $(sel);
    if (!node)
      return;
    node.style.transform = "none";
    node.style.opacity = 0;
    try {
      await node.animate([{ opacity: 0, transform: "translateY(-10px) scale(.9)" }, { opacity: 1, transform: "translateY(0) scale(1)" }], { duration: 320, easing: "ease-out" }).finished;
    } catch (_) {
    }
    node.style.opacity = 1;
  }
  var bannerHold = { t: 0 };
  async function showBanner(txt, ms = 1100) {
    const b = $("#banner");
    if (!b)
      return;
    b.textContent = txt;
    b.classList.remove("hidden");
    const token = ++bannerHold.t;
    await sleep(ms);
    if (token === bannerHold.t)
      b.classList.add("hidden");
  }
  function trainerSpritePath(trainer) {
    return trainer?.sprite || "assets/sprites/acetrainerf-gen4.png";
  }
  function renderTrainerBadge(trainer) {
    const badge = $("#enemyTrainerBadge");
    const img = $("#enemyTrainerMini");
    const label = $("#enemyTrainerLabel");
    if (!badge || !img || !label)
      return;
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
    if (!intro || !sprite || !trainer)
      return;
    $("#trainerIntroKicker").textContent = trainer.title || "Trainer";
    $("#trainerIntroName").textContent = trainer.leader;
    $("#trainerIntroMeta").textContent = champion ? `${trainer.town} \xB7 Final challenge` : `${trainer.town} Gym \xB7 ${trainer.badge} Badge`;
    sprite.src = trainerSpritePath(trainer);
    sprite.alt = "";
    intro.style.setProperty("--trainer-accent", TYPE_COLOR[trainer.type] || TYPE_COLOR.normal);
    intro.classList.toggle("trainer-intro-champion", champion);
    intro.classList.remove("hidden", "is-leaving");
    intro.classList.remove("is-active");
    void intro.offsetWidth;
    intro.classList.add("is-active");
    const reduceMotion2 = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    await sleep(reduceMotion2 ? 650 : 1550);
    intro.classList.add("is-leaving");
    await sleep(reduceMotion2 ? 80 : 320);
    intro.classList.add("hidden");
    intro.classList.remove("is-active", "is-leaving");
  }
  var THEMES = ["normal", "fire", "water", "grass", "electric", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon"];
  function setThemeByType(types) {
    const t = types && types[0] || "normal";
    const scr = $(".screen");
    if (!scr)
      return;
    THEMES.forEach((x) => scr.classList.remove("type-" + x));
    scr.classList.add("type-" + t);
    scr.style.setProperty("--type", TYPE_COLOR[t] || "#888");
    try {
      ThemeFX.set(t);
    } catch (_) {
    }
  }
  var fx = function() {
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
      if (ballPromise)
        return ballPromise;
      ballPromise = (async () => {
        try {
          const im = new Image();
          im.crossOrigin = "anonymous";
          im.src = ITEM_ICON("poke-ball");
          await new Promise((r) => {
            im.onload = r;
            im.onerror = r;
          });
          return im.width ? im : null;
        } catch (_) {
          return null;
        }
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
        clear();
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 4);
        if (img)
          ctx.drawImage(img, -r, -r, r * 2, r * 2);
        ctx.restore();
        await sleep(16);
      }
      if (typeof onHit === "function")
        onHit();
      async function wobble() {
        for (let a = 0; a < 1; a += 0.1) {
          clear();
          ctx.save();
          ctx.translate(tx, ty);
          ctx.rotate(Math.sin(a * Math.PI * 2) * 0.35);
          if (img)
            ctx.drawImage(img, -r, -r, r * 2, r * 2);
          ctx.restore();
          await sleep(30);
        }
      }
      await wobble();
      return {
        async shake(times) {
          for (let i = 0; i < times; i++) {
            await wobble();
            await sleep(160);
          }
        },
        clear
      };
    }
    return { throwAndWobble, clear };
  }();
  var ThemeFX = (() => {
    const layer = document.getElementById("themefx");
    if (!layer)
      return { set: () => {
      } };
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
      dragon: { kind: "star", count: 12, size: [4, 8], dur: [16, 24], blur: [0, 0] }
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
      if (type === current)
        return;
      current = type;
      layer.innerHTML = "";
      const conf = CONFIG[type] || CONFIG.normal;
      const n = Math.round(conf.count * intensity);
      for (let i = 0; i < n; i++)
        spawn(conf.kind, conf);
    }
    set("normal");
    return { set };
  })();
  function labelFor(mon, isEnemy) {
    return (isEnemy && state.mode !== "trainer" ? "Wild " : "") + mon.name;
  }
  async function performMove(attacker, defender, move, attackerIsPlayer) {
    const aSel = attackerIsPlayer ? "#playerSprite" : "#enemySprite";
    const dSel = attackerIsPlayer ? "#enemySprite" : "#playerSprite";
    const towardRight = attackerIsPlayer;
    const act = canAct(attacker);
    if (act.message) {
      await say(act.message, 200);
    }
    if (!act.canAct)
      return { acted: false, defenderFainted: false };
    if (move.ppLeft <= 0)
      move = { ...STRUGGLE };
    else
      move.ppLeft = Math.max(0, move.ppLeft - 1);
    await say(`${attackerIsPlayer ? "" : state.mode === "trainer" ? "Foe " : "The wild "}${attacker.name} used ${move.name}!`, 120);
    renderMovesIfOpen();
    if (move.power > 0) {
      playSfx(move);
      await lunge(aSel, towardRight);
    } else {
      playSfx(move);
    }
    const res = useMove(attacker, defender, move, Math.random, {
      playerFx: state.sigilFx,
      attackerIsPlayer,
      defenderIsPlayer: !attackerIsPlayer,
      noSwitchTurns: state.noSwitchTurns,
      endureUsed: state.endureUsed
    });
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
      if (!attackerIsPlayer)
        screenShake(crit ? "crit" : "hit");
      updateHUD();
      const dmgTxt = `-${res.totalDmg}`;
      floatTextNear(dSel, dmgTxt, crit ? "crit" : "bad");
      if (crit) {
        await say("A critical hit!");
      }
      const eff = res.effMult;
      if (eff !== void 0 && eff !== 1) {
        const t = effText(eff);
        if (t) {
          showBadgeNear(dSel, eff > 1 ? "SUPER" : "RESIST", eff > 1 ? "super" : "weak");
          await say(t);
        }
      }
    }
    if (res.drain > 0) {
      updateHUD();
      floatTextNear(aSel, `+${res.drain}`, "good");
    }
    if (res.recoil > 0) {
      updateHUD();
      floatTextNear(aSel, `-${res.recoil}`, "bad");
    }
    if (res.healed > 0) {
      updateHUD();
      floatTextNear(aSel, `+${res.healed}`, "good");
    }
    for (const line of res.log) {
      if (/used |missed|doesn't affect|drained|recoil|regained|Hit /.test(line))
        continue;
      await say(line);
    }
    updateHUD();
    return { acted: true, defenderFainted: res.targetFainted, result: res };
  }
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
      { playerFx: state.sigilFx }
    ) === "a";
    const order = playerFirst ? [["p", playerMove], ["e", enemyMove]] : [["e", enemyMove], ["p", playerMove]];
    const flinch = { p: false, e: false };
    for (const [who, move] of order) {
      if (state.player.stats.hp <= 0 || state.enemy.stats.hp <= 0)
        break;
      if (who === "p") {
        if (flinch.p) {
          await say(`${state.player.name} flinched and couldn't move!`);
          continue;
        }
        const r = await performMove(state.player, state.enemy, move, true);
        if (r.result && r.result.flinch)
          flinch.e = true;
        if (state.enemy.stats.hp <= 0)
          return onEnemyFaint();
      } else {
        if (flinch.e) {
          await say(`Foe ${state.enemy.name} flinched!`);
          continue;
        }
        const r = await performMove(state.enemy, state.player, move, false);
        if (r.result && r.result.flinch)
          flinch.p = true;
        if (state.player.stats.hp <= 0)
          return onPlayerFaint();
      }
    }
    if (await residualPhase())
      return;
    await backToMenu();
  }
  async function enemyFreeTurn(playerActed = true) {
    if (playerActed)
      state.noSwitchTurns++;
    const eIdx = chooseAIMove(state.enemy, state.player);
    const enemyMove = state.enemy.moves[eIdx] || { ...STRUGGLE };
    await performMove(state.enemy, state.player, enemyMove, false);
    if (state.player.stats.hp <= 0)
      return onPlayerFaint();
    if (await residualPhase())
      return;
    await backToMenu();
  }
  async function residualPhase() {
    for (const [mon, sel, isEnemy] of [
      [state.player, "#playerSprite", false],
      [state.enemy, "#enemySprite", true]
    ]) {
      if (!mon || mon.stats.hp <= 0)
        continue;
      const r = endOfTurn(mon);
      if (r && r.dmg) {
        updateHUD();
        floatTextNear(sel, `-${r.dmg}`, "bad");
        await say(`${mon.name} is hurt by its ${r.kind === "brn" ? "burn" : "poison"}!`);
        if (r.fainted) {
          if (isEnemy) {
            await onEnemyFaint();
            return true;
          }
          await onPlayerFaint();
          return true;
        }
      }
    }
    const weather = state.sigilFx.weather;
    for (const [mon, sel, isEnemy] of [
      [state.player, "#playerSprite", false],
      [state.enemy, "#enemySprite", true]
    ]) {
      if (!mon || mon.stats.hp <= 0)
        continue;
      const r = applyWeatherChip(mon, weather);
      if (r && r.dmg) {
        updateHUD();
        floatTextNear(sel, `-${r.dmg}`, "bad");
        await say(`${mon.name} is buffeted by the ${weather === "hail" ? "hail" : "sandstorm"}!`);
        if (r.fainted) {
          if (isEnemy) {
            await onEnemyFaint();
            return true;
          }
          await onPlayerFaint();
          return true;
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
  function xpFor(enemy) {
    const base = Math.max(1, Math.floor((enemy.base_exp || 64) * enemy.level / 7));
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
    await gainXP(state.player, Math.round(xpFor(state.enemy) * (state.sigilFx.xpMult || 1)));
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
    if (cb)
      await cb({ defeated: true });
    else
      goToMap();
  }
  async function onPlayerFaint() {
    await playCry(state.player);
    await faintOut("#playerSprite");
    await say(`${state.player.name} fainted!`);
    const healthyIdx = state.party.map((m, i) => ({ m, i })).filter(({ m, i }) => m.stats.hp > 0 && i !== state.active).map(({ i }) => i);
    if (healthyIdx.length) {
      if (state.auto) {
        const pick2 = bestSwitch(state.party, state.active, state.enemy, 0, 0) ?? healthyIdx[0];
        await say("Choose your next Pok\xE9mon!");
        await swapTo(pick2, true);
        return;
      }
      await say("Choose your next Pok\xE9mon!");
      renderParty(true);
      show("swap");
      setBusy(false);
      return;
    }
    await say("Your whole team has fainted...", 500);
    const cb = state.battle && state.battle.onLose;
    state.battle = null;
    if (cb)
      await cb();
    else
      await backToTitle();
  }
  function beginBattleEffects() {
    state.sigilFx = aggregateSigils(state.run ? state.run.sigils : []);
    state.noSwitchTurns = 0;
    state.endureUsed = { used: false };
  }
  function applyEnemyEntryEffect(mon) {
    return applyEntryStatus(mon, state.sigilFx.enemyEntryStatus).applied;
  }
  var OPENING_WILD_IDS = {
    grass: [60, 116],
    // Poliwag, Horsea
    fire: [10, 13],
    // Caterpie, Weedle
    water: [37]
    // Vulpix
  };
  async function makeWildMon(level, openingType = null) {
    let mon = null, poke = null;
    for (let tries = 0; tries < 12; tries++) {
      const openingPool = openingType && OPENING_WILD_IDS[openingType];
      const eid = openingPool ? openingPool[Math.floor(Math.random() * openingPool.length)] : 1 + Math.floor(Math.random() * GEN1_MAX_ID);
      if (eid >= 144 && eid <= 151)
        continue;
      poke = await fetchPokemon(eid);
      const bst = poke.stats.reduce((a, s) => a + s.base_stat, 0);
      const limit = openingPool ? 320 : 360;
      if (bst <= limit || tries > 8) {
        mon = makeMon(poke, level);
        const species = await fetchSpecies(poke.id);
        mon.capture_rate = species.capture_rate;
        break;
      }
    }
    mon.moves = await fetchMoveset(poke, mon.level);
    if (!mon.moves.length)
      mon.moves = [{ ...STRUGGLE, name: "Tackle", key: "tackle", power: 40, pp: 35, ppLeft: 35, drain: 0 }];
    return mon;
  }
  async function startBattle(spec) {
    $("#starterScreen")?.classList.add("hidden");
    $(".screen")?.classList.remove("starter-mode");
    clearEnemyPresentation();
    state.battle = spec;
    state.mode = spec.kind === "battle" ? "wild" : "trainer";
    state.isChampion = spec.kind === "champion";
    beginBattleEffects();
    hideMapScreen();
    if (!state.player || state.player.stats.hp <= 0) {
      const idx = state.party.findIndex((m) => m.stats.hp > 0);
      if (idx >= 0)
        setActive(idx);
    }
    resetStages(state.player);
    const ps = $("#playerSprite");
    if (ps) {
      ps.style.opacity = "1";
      ps.style.transform = "none";
    }
    if (spec.kind === "battle") {
      state.enemy = spec.enemy;
      state.trainer = null;
      state.trainerTeam = [];
      renderTrainerBadge(null);
      ensureRuntime(state.enemy);
      const entryStatus = applyEnemyEntryEffect(state.enemy);
      updateHUD();
      setThemeByType(state.enemy.types);
      await fadeInSprite("#enemySprite");
      await say(`A wild ${state.enemy.name} appeared!`);
      registerPokemonProgress(state.enemy, "seen");
      if (entryStatus)
        await say(`${state.enemy.name} was poisoned by Toxic Spikes!`);
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
    if (entryStatus)
      await say(`${mon.name} was poisoned by Toxic Spikes!`);
    await playCry(mon);
  }
  var DEFAULT_ITEMS = () => ({
    "poke-ball": 3,
    "great-ball": 0,
    "ultra-ball": 0,
    potion: 1,
    "super-potion": 0,
    "hyper-potion": 0,
    antidote: 0,
    "parlyz-heal": 0,
    awakening: 0,
    "burn-heal": 0,
    "ice-heal": 0
  });
  async function startExpedition(starterMon) {
    const seed = randomSeedString();
    const run = createRun(seed, { sigils: state.meta.startingSigils || [] });
    run.items = DEFAULT_ITEMS();
    const startingFx = aggregateSigils(run.sigils);
    applyStartingBallBonus(run.items, startingFx);
    run.team = [starterMon];
    run.box = [];
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
    if (!run.items)
      run.items = DEFAULT_ITEMS();
    if (!run.sigils)
      run.sigils = [];
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
    if (!run || !run.team || !run.team.length)
      return beginNewGame();
    bindRun(run);
    hideTitle();
    setActive(state.active);
    showMap();
  }
  function showMapScreen() {
    const m = $("#mapScreen");
    if (m)
      m.classList.remove("hidden");
  }
  function hideMapScreen() {
    const m = $("#mapScreen");
    if (m)
      m.classList.add("hidden");
  }
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
  function goToMap() {
    if (state.run) {
      markResolved(state.run, { won: false });
      recordBestDepth(state.meta, state.run.visited.length + 1);
      saveRun();
    }
    showMap();
  }
  var NODE_GLYPH = {
    [NODE.BATTLE]: "W",
    [NODE.ELITE]: "E",
    [NODE.SHOP]: "$",
    [NODE.REST]: "+",
    [NODE.MYSTERY]: "?",
    [NODE.CHAMPION]: "C"
  };
  var NODE_NAME = {
    [NODE.BATTLE]: "Wild",
    [NODE.ELITE]: "Elite",
    [NODE.SHOP]: "Shop",
    [NODE.REST]: "Rest",
    [NODE.MYSTERY]: "Mystery",
    [NODE.CHAMPION]: "Champion"
  };
  var NODE_COLOR = {
    [NODE.BATTLE]: "#ef626c",
    [NODE.ELITE]: "#a78bfa",
    [NODE.SHOP]: "#f5c451",
    [NODE.REST]: "#66d49a",
    [NODE.MYSTERY]: "#55c9dc",
    [NODE.CHAMPION]: "#ffd166"
  };
  var REGION_THEME = [
    { key: "verdant", name: "Viridian Wilds", note: "Tall grass, old trails, and restless Pok\xE9mon" },
    { key: "crimson", name: "Crimson Highlands", note: "A rugged climb through ember-lit ridges" },
    { key: "indigo", name: "Indigo Summit", note: "The final ascent to the Champion" }
  ];
  function renderMap() {
    const canvas = $("#mapCanvas");
    if (!canvas || !state.run)
      return;
    canvas.innerHTML = "";
    const map = state.run.map;
    const avail = new Set(availableNext(state.run).map((n) => n.id));
    const visited = new Set(state.run.visited);
    for (let region = map.regions - 1; region >= 0; region--) {
      const theme = REGION_THEME[region] || REGION_THEME[REGION_THEME.length - 1];
      const section = el("section", { class: `map-region biome-${theme.key}` });
      section.dataset.region = String(region);
      const heading = el("div", { class: "region-heading" });
      heading.innerHTML = `<span>Region ${region + 1}</span><strong>${theme.name}</strong><small>${theme.note}</small>`;
      section.appendChild(heading);
      const rows = el("div", { class: "region-rows" });
      const firstRow = region * map.rowsPerRegion;
      const lastRow = Math.min(map.totalRows - 1, firstRow + map.rowsPerRegion - 1);
      for (let r = lastRow; r >= firstRow; r--) {
        const rowEl = el("div", { class: "map-row" });
        rowEl.dataset.depth = String(r + 1);
        rowEl.style.gridTemplateColumns = `repeat(${map.width}, 1fr)`;
        const byCol = {};
        map.rows[r].forEach((id) => {
          byCol[map.nodes[id].col] = id;
        });
        for (let c = 0; c < map.width; c++) {
          const slot = el("div", { class: "map-slot" });
          const id = byCol[c];
          if (id) {
            const node = map.nodes[id];
            const name = NODE_NAME[node.type] || "Unknown";
            const btn = el("button", {
              class: "map-node type-" + node.type,
              title: `${name} \xB7 Depth ${r + 1}`,
              "aria-label": `${name}, depth ${r + 1}`
            });
            btn.dataset.id = id;
            btn.style.setProperty("--node-color", NODE_COLOR[node.type] || "#7a88a8");
            btn.appendChild(el("span", { class: "node-mark", "aria-hidden": "true" }, NODE_GLYPH[node.type] || "?"));
            btn.appendChild(el("span", { class: "node-name", "aria-hidden": "true" }, name));
            if (id === state.run.position)
              btn.classList.add("current");
            else if (visited.has(id))
              btn.classList.add("visited");
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
    if (!canvas || !state.run)
      return;
    const old = canvas.querySelector("svg.map-edges");
    if (old)
      old.remove();
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "map-edges");
    svg.setAttribute("aria-hidden", "true");
    const crect = canvas.getBoundingClientRect();
    const center = (id) => {
      const b = canvas.querySelector(`[data-id="${id}"]`);
      if (!b)
        return null;
      const r = b.getBoundingClientRect();
      return { x: r.left - crect.left + r.width / 2, y: r.top - crect.top + r.height / 2 + canvas.scrollTop };
    };
    const visited = new Set(state.run.visited);
    const available = new Set(availableNext(state.run).map((n) => n.id));
    const addRoute = (a, b, className) => {
      const path = document.createElementNS(NS, "path");
      const midY = (a.y + b.y) / 2;
      path.setAttribute("d", `M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`);
      if (className)
        path.setAttribute("class", className);
      svg.appendChild(path);
    };
    for (const node of Object.values(state.run.map.nodes)) {
      const a = center(node.id);
      if (!a)
        continue;
      for (const e of node.edges) {
        const b = center(e);
        if (!b)
          continue;
        let className = "";
        if (visited.has(node.id) && visited.has(e))
          className = "route-travelled";
        if (node.id === state.run.position && available.has(e))
          className = "route-available";
        addRoute(a, b, className);
      }
    }
    if (!state.run.position) {
      const start = { x: crect.width / 2, y: canvas.scrollHeight - 4 };
      for (const id of available) {
        const target = center(id);
        if (target)
          addRoute(start, target, "route-available route-trailhead");
      }
    }
    canvas.insertBefore(svg, canvas.firstChild);
  }
  function focusActiveRoute() {
    const scroll = $("#mapScroll");
    const canvas = $("#mapCanvas");
    if (!scroll || !canvas)
      return;
    const target = canvas.querySelector(".map-node.available") || canvas.querySelector(".map-node.current");
    if (!target)
      return;
    const targetRect = target.getBoundingClientRect();
    const scrollRect = scroll.getBoundingClientRect();
    const top = scroll.scrollTop + targetRect.top - scrollRect.top - scroll.clientHeight * 0.58;
    scroll.scrollTop = clamp(top, 0, Math.max(0, scroll.scrollHeight - scroll.clientHeight));
  }
  async function onSelectNode(node) {
    if (state.busy)
      return;
    if (!availableNext(state.run).some((n) => n.id === node.id))
      return;
    travelTo(state.run, node.id);
    const combatNode = node.type === NODE.BATTLE || node.type === NODE.ELITE || node.type === NODE.CHAMPION;
    if (!combatNode)
      hideMapScreen();
    await resolveNode(node);
  }
  function renderRunHud() {
    const hud = $("#runHud");
    if (!hud || !state.run)
      return;
    const run = state.run;
    const region = (currentNode(run)?.region ?? 0) + 1;
    const theme = REGION_THEME[region - 1] || REGION_THEME[0];
    const progress = clamp(run.visited.length / run.map.totalRows, 0, 1);
    const sig = run.sigils.map((id) => `<span class="sig-chip" style="--rar:${RARITY_COLOR[SIGILS[id].rarity]}" title="${SIGILS[id].desc}">${SIGILS[id].name}</span>`).join("");
    const team = run.team.map((m) => `<span class="team-chip ${m.stats.hp > 0 ? "" : "ko"}">${m.name}<i>${m.stats.hp}/${m.stats.maxHp}</i></span>`).join("");
    hud.innerHTML = `<div class="run-stats"><span class="run-stat" title="Run seed">Seed <b>${run.seed}</b></span><span class="run-stat">Region <b>${region}/${run.config.regions}</b></span><span class="run-stat">Depth <b>${run.visited.length}</b></span><span class="run-stat">Gold <b>${run.gold}</b></span><span class="run-stat">Balls <b>${run.items["poke-ball"] || 0}</b></span></div><div class="run-sigils">${sig || '<span class="small">No sigils yet</span>'}</div><div class="run-team">${team}</div>`;
    const title = $("#mapRegionTitle");
    const note = $("#mapRegionNote");
    const progressText = $("#mapProgressText");
    const progressFill = $("#mapProgressFill");
    if (title)
      title.textContent = theme.name;
    if (note)
      note.textContent = theme.note;
    if (progressText)
      progressText.textContent = `${run.visited.length} / ${run.map.totalRows}`;
    if (progressFill)
      progressFill.style.width = `${progress * 100}%`;
  }
  async function resolveNode(node) {
    switch (node.type) {
      case NODE.BATTLE:
        return resolveBattleNode(node);
      case NODE.ELITE:
        return resolveEliteNode(node);
      case NODE.CHAMPION:
        return resolveChampionNode(node);
      case NODE.SHOP:
        return resolveShopNode(node);
      case NODE.REST:
        return resolveRestNode(node);
      case NODE.MYSTERY:
        return resolveMysteryNode(node);
      default:
        return goToMap();
    }
  }
  async function resolveBattleNode(node) {
    setBusy(true);
    const openingType = state.run.visited.length === 0 ? state.player?.types?.[0] : null;
    const mon = await makeWildMon(encounterLevel(state.run), openingType);
    setBusy(false);
    await startBattle({
      kind: "battle",
      enemy: mon,
      onWin: (info) => afterBattleWin(info),
      onLose: () => runWipe(),
      onFlee: () => goToMap()
    });
  }
  async function afterBattleWin(info = {}) {
    if (info.caught) {
      ensureRuntime(info.caught);
      if (state.run.team.length < 6)
        state.run.team.push(info.caught);
      else {
        state.run.box.push(info.caught);
        await say(`${info.caught.name} was sent to storage.`);
      }
      if (registerPokemonProgress(info.caught, "caught", false)) {
        const counts = progressionCounts(state.meta);
        await say(`Pok\xE9dex updated: ${counts.caught}/${GEN1_DEX_SIZE} species caught.`);
      }
    }
    const gold = Math.round(rollGold(state.run, NODE.BATTLE) * (state.sigilFx.goldMult || 1));
    state.run.gold += gold;
    if (gold)
      floatToast(`+${gold} gold`);
    goToMap();
  }
  async function buildBossTeam(boss) {
    const champion = boss === CHAMPION;
    const team = [];
    for (let i = 0; i < boss.team.length; i++) {
      team.push(await buildMon(boss.team[i], bossMemberLevel(state.run, i, champion)));
    }
    return team;
  }
  async function resolveEliteNode(node) {
    setBusy(true);
    const gymIdx = state.run.gyms && state.run.gyms[node.region] != null ? state.run.gyms[node.region] : node.region % GYMS.length;
    const gym = GYMS[gymIdx];
    const team = await buildBossTeam(gym);
    setBusy(false);
    await startBattle({
      kind: "elite",
      boss: gym,
      team,
      onWin: () => afterEliteWin(gym),
      onLose: () => runWipe()
    });
  }
  async function afterEliteWin(gym) {
    const gold = Math.round(rollGold(state.run, NODE.ELITE) * (state.sigilFx.goldMult || 1));
    state.run.gold += gold;
    await say(`You defeated ${gym.leader}! +${gold} gold.`, 400);
    const sig = await offerDraft("sigil");
    if (sig) {
      if (!state.run.sigils.includes(sig.id))
        state.run.sigils.push(sig.id);
      await say(`Attuned the ${sig.name} Sigil!`);
    }
    goToMap();
  }
  async function resolveChampionNode(node) {
    setBusy(true);
    const team = await buildBossTeam(CHAMPION);
    setBusy(false);
    await startBattle({
      kind: "champion",
      boss: CHAMPION,
      team,
      onWin: () => runVictory(),
      onLose: () => runWipe()
    });
  }
  function healTeam() {
    state.run.team.forEach((m) => {
      m.stats.hp = m.stats.maxHp;
      m.status = { cond: "none", turns: 0, toxic: 0 };
      resetStages(m);
      m.moves.forEach((mv) => mv.ppLeft = mv.pp);
    });
    if (state.player)
      updateHUD();
  }
  async function resolveRestNode(node) {
    const choice = await new Promise((resolve) => {
      openPanel("Rest Site", (body, close) => {
        body.appendChild(el("p", { class: "small" }, "A safe place to recover or reshape your team."));
        const heal = el("button", { class: "title-btn primary" }, "Heal team fully");
        heal.onclick = () => {
          close();
          resolve("heal");
        };
        const mut = el("button", { class: "title-btn" }, "Graft a Mutation");
        mut.onclick = () => {
          close();
          resolve("mutate");
        };
        body.appendChild(heal);
        body.appendChild(mut);
      });
    });
    if (choice === "heal") {
      healTeam();
      await say("Your team is fully rested.");
    } else if (choice === "mutate")
      await graftMutationFlow();
    goToMap();
  }
  async function graftMutationFlow() {
    const opt = await offerDraft("mutation");
    if (!opt)
      return;
    const mon = await pickTeamMember(`Graft ${opt.name} onto\u2026`);
    if (!mon)
      return;
    applyMutation(mon, opt.id);
    if (mon === state.player)
      updateHUD();
    await say(`${mon.name} gained the ${opt.name} mutation!`);
  }
  async function resolveShopNode(node) {
    const stock = rollShop(state.run);
    await openShop(stock);
    goToMap();
  }
  function openShop(stock) {
    return new Promise((resolve) => {
      openPanel("Pok\xE9 Mart", (body, close) => {
        const render = () => {
          body.innerHTML = "";
          body.appendChild(el("div", { class: "small shop-gold" }, `Gold: ${state.run.gold}`));
          stock.forEach((it) => {
            if (it.sold)
              return;
            const row = el("div", { class: "shop-row" });
            const label = it.rarity ? `${it.name} (${it.rarity})` : it.name;
            row.appendChild(el("span", {}, `${label} \u2014 ${it.price}g`));
            const buy = el("button", { class: "use-btn" }, "Buy");
            buy.disabled = state.run.gold < it.price;
            buy.onclick = async () => {
              await buyItem(it);
              it.sold = true;
              render();
            };
            row.appendChild(buy);
            body.appendChild(row);
          });
          const leave = el("button", { class: "title-btn" }, "Leave");
          leave.onclick = () => {
            close();
            resolve();
          };
          body.appendChild(leave);
        };
        render();
      });
    });
  }
  async function buyItem(it) {
    if (state.run.gold < it.price)
      return;
    state.run.gold -= it.price;
    if (it.kind === "item") {
      if (it.id === "heal")
        healTeam();
      else
        state.run.items[it.id] = (state.run.items[it.id] || 0) + 1;
    } else if (it.kind === "mutation") {
      applyMutation(state.player, it.id);
      updateHUD();
    } else if (it.kind === "sigil") {
      if (!state.run.sigils.includes(it.id))
        state.run.sigils.push(it.id);
    }
    renderRunHud();
    saveRun();
  }
  async function resolveMysteryNode(node) {
    const ev = rollMysteryEvent(state.run);
    const choice = await new Promise((resolve) => {
      openPanel(ev.title, (body, close) => {
        body.appendChild(el("p", { class: "small" }, ev.desc));
        ev.choices.forEach((ch) => {
          const b = el("button", { class: "title-btn" }, ch.label);
          b.onclick = () => {
            close();
            resolve(ch);
          };
          body.appendChild(b);
        });
      });
    });
    await applyEventEffect(choice.effect || { kind: "none" });
    goToMap();
  }
  async function applyEventEffect(effect) {
    const run = state.run;
    switch (effect.kind) {
      case "heal":
        healTeam();
        await say("Your team recovered fully.");
        break;
      case "balls":
        run.items["poke-ball"] = (run.items["poke-ball"] || 0) + (effect.amount || 1);
        await say(`You found ${effect.amount || 1} Pok\xE9 Ball!`);
        break;
      case "gold":
        run.gold += effect.amount || 0;
        await say(`You found ${effect.amount || 0} gold!`);
        break;
      case "sigil": {
        const s = await offerDraft("sigil");
        if (s && !run.sigils.includes(s.id)) {
          run.sigils.push(s.id);
          await say(`Attuned the ${s.name} Sigil!`);
        }
        break;
      }
      case "recruit": {
        const mon = await makeWildMon(encounterLevel(run));
        if (run.team.length < 6)
          run.team.push(mon);
        else
          run.box.push(mon);
        await say(`The egg hatched into ${mon.name}!`);
        if (registerPokemonProgress(mon, "caught", false)) {
          const counts = progressionCounts(state.meta);
          await say(`Pok\xE9dex updated: ${counts.caught}/${GEN1_DEX_SIZE} species caught.`);
        }
        break;
      }
      case "tutor": {
        if (run.gold >= (effect.cost || 0)) {
          run.gold -= effect.cost || 0;
          state.player.moves.forEach((mv) => mv.ppLeft = mv.pp);
          await say("Your Pok\xE9mon's moves were honed. (PP restored)");
        } else
          await say("You can't afford it.");
        break;
      }
      case "coinflip": {
        if (run.gold >= (effect.stake || 0)) {
          if (Math.random() < 0.5) {
            run.gold += effect.stake;
            await say(`You won ${effect.stake} gold!`);
          } else {
            run.gold -= effect.stake;
            await say(`You lost ${effect.stake} gold...`);
          }
        } else
          await say("Not enough gold to bet.");
        break;
      }
      case "gamble": {
        if (run.gold >= (effect.cost || 0)) {
          run.gold -= effect.cost || 0;
          const roll = Math.random();
          if (roll < 0.4) {
            const g = 80 + Math.floor(Math.random() * 80);
            run.gold += g;
            await say(`The well rewards you with ${g} gold!`);
          } else if (roll < 0.7) {
            await graftMutationFlow();
          } else
            await say("The well stays silent...");
        } else
          await say("You can't spare the gold.");
        break;
      }
      case "mutationThenScar": {
        await graftMutationFlow();
        const victim = state.run.team[Math.floor(Math.random() * state.run.team.length)];
        const statKeys = ["atk", "def", "spa", "spd", "spe"];
        const k = statKeys[Math.floor(Math.random() * statKeys.length)];
        victim.stats[k] = Math.max(1, Math.floor(victim.stats[k] * 0.85));
        await say(`...but the shrine's curse weakened ${victim.name}.`);
        break;
      }
      default:
        break;
    }
    renderRunHud();
    saveRun();
  }
  function offerDraft(kind) {
    const options = kind === "sigil" ? offerSigils(state.run, 3) : offerMutations(state.run, 3);
    return new Promise((resolve) => {
      openPanel(kind === "sigil" ? "Choose a Sigil" : "Choose a Mutation", (body, close) => {
        const grid = el("div", { class: "draft-grid" });
        options.forEach((opt) => {
          const card = el("div", { class: "draft-card" });
          card.style.setProperty("--rar", RARITY_COLOR[opt.rarity] || "#888");
          card.innerHTML = `<div class="draft-name">${opt.name}</div><div class="draft-rar">${opt.rarity}</div><div class="draft-desc small">${opt.desc}</div>`;
          card.onclick = () => {
            close();
            resolve(opt);
          };
          grid.appendChild(card);
        });
        body.appendChild(grid);
        const skip = el("button", { class: "title-btn" }, "Skip");
        skip.onclick = () => {
          close();
          resolve(null);
        };
        body.appendChild(skip);
      });
    });
  }
  function pickTeamMember(title) {
    const team = state.run.team;
    return new Promise((resolve) => {
      openPanel(title, (body, close) => {
        team.forEach((m) => {
          const b = el("button", { class: "title-btn" }, `${m.name} \xB7 Lv ${m.level} \xB7 ${m.stats.hp}/${m.stats.maxHp} HP`);
          b.onclick = () => {
            close();
            resolve(m);
          };
          body.appendChild(b);
        });
        if (!team.length) {
          const c = el("button", { class: "title-btn" }, "OK");
          c.onclick = () => {
            close();
            resolve(null);
          };
          body.appendChild(c);
        }
      });
    });
  }
  async function runVictory() {
    markResolved(state.run, { won: true });
    recordBestDepth(state.meta, state.run.visited.length + 1);
    recordRunResult(state.meta, true);
    const frags = 60 + state.run.visited.length * 4 + state.run.ascension * 30;
    state.meta.fragments += frags;
    saveMeta();
    await flashWhite("#enemySprite");
    await new Promise((resolve) => {
      openPanel("Champion!", (body, close) => {
        body.appendChild(el("p", {}, "You conquered the Expedition and became Champion!"));
        body.appendChild(el("p", { class: "small" }, `+${frags} Fragments. Choose one Pok\xE9mon to ascend into your Vault for ranked play:`));
        state.run.team.forEach((m) => {
          const b = el("button", { class: "title-btn primary" }, `Ascend ${m.name} (Lv ${m.level})`);
          b.onclick = () => {
            ascendToVault(m);
            close();
            resolve();
          };
          body.appendChild(b);
        });
        const skip = el("button", { class: "title-btn" }, "Ascend none");
        skip.onclick = () => {
          close();
          resolve();
        };
        body.appendChild(skip);
      });
    });
    clearRun();
    await backToTitle();
  }
  async function runWipe() {
    if (state.run) {
      state.run.over = true;
      state.run.won = false;
    }
    recordRunResult(state.meta, false);
    const frags = 15 + (state.run ? state.run.visited.length : 0) * 3;
    state.meta.fragments += frags;
    saveMeta();
    await openModal({
      title: "Expedition Ended",
      bodyHTML: `<p>Your team was defeated.</p><p class="small">You reached ${state.run ? state.run.visited.length : 0} nodes and earned ${frags} Fragments toward permanent unlocks.</p>`,
      actions: [{ label: "Return to Title", primary: true, onClick: () => {
      } }],
      dismissable: false
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
    if (t)
      t.classList.remove("hidden");
    refreshTitleButtons();
    updateScore();
  }
  function refreshTitleButtons() {
    const cont = $("#continueBtn");
    if (cont)
      cont.classList.toggle("hidden", !hasRun());
  }
  function saveRun() {
    try {
      if (state.run) {
        state.run.active = state.active;
        localStorage.setItem(RUN_KEY, JSON.stringify(state.run));
      }
    } catch (_) {
    }
    saveVault();
    saveMeta();
  }
  var save = saveRun;
  function hasRun() {
    try {
      return !!localStorage.getItem(RUN_KEY);
    } catch (_) {
      return false;
    }
  }
  function loadRun() {
    try {
      const raw = localStorage.getItem(RUN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }
  function clearRun() {
    try {
      localStorage.removeItem(RUN_KEY);
    } catch (_) {
    }
    state.run = null;
    state.battle = null;
    state.started = false;
  }
  function loadVault() {
    try {
      return JSON.parse(localStorage.getItem(VAULT_KEY) || "[]");
    } catch (_) {
      return [];
    }
  }
  function saveVault() {
    try {
      localStorage.setItem(VAULT_KEY, JSON.stringify(state.vault || []));
    } catch (_) {
    }
  }
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
    const legacy = hasCurrent ? null : readStoredJSON(LEGACY_META_KEY);
    return normalizeProgression(hasCurrent ? current : legacy || {});
  }
  function saveMeta() {
    try {
      state.meta = normalizeProgression(state.meta);
      localStorage.setItem(META_KEY, JSON.stringify(state.meta));
    } catch (_) {
    }
  }
  function ascendToVault(mon) {
    state.vault.push(snapshotMon(mon));
    saveVault();
  }
  function floatToast(txt) {
    showBanner(txt, 900);
  }
  function renderMovesIfOpen() {
    if (!$("#movesView").classList.contains("hidden"))
      renderMoves();
  }
  function renderMoves() {
    const grid = $("#movesGrid");
    grid.innerHTML = "";
    state.player.moves.forEach((mv, idx) => {
      const btn = el("button", { class: "move-btn" });
      btn.style.setProperty("--mtype", TYPE_COLOR[mv.type] || "#666");
      if (mv.ppLeft <= mv.pp * 0.25)
        btn.classList.add("low-pp");
      btn.disabled = mv.ppLeft <= 0 || state.busy;
      const kind = mv.power > 0 ? `Pow ${mv.power}` : cap(mv.category.replace(/-/g, " "));
      btn.innerHTML = `<span class="mv-name">${mv.name}</span><span class="mv-meta"><span>${cap(mv.type)}</span><span>${kind}</span><span class="mv-pp">PP ${mv.ppLeft}/${mv.pp}</span></span>`;
      btn.addEventListener("click", () => onChooseMove(idx));
      grid.appendChild(btn);
    });
  }
  function onChooseMove(idx) {
    if (state.busy)
      return;
    const mv = state.player.moves[idx];
    if (!mv || mv.ppLeft <= 0)
      return;
    fightRound(mv);
  }
  function renderParty(forcedSwitch = false) {
    const list = $("#partyList");
    list.innerHTML = "";
    state.party.forEach((m, idx) => {
      const f = m.stats.hp / m.stats.maxHp;
      const item = el("div", { class: "party-item" });
      if (idx === state.active)
        item.classList.add("active-mon");
      if (m.stats.hp <= 0)
        item.classList.add("fainted");
      const main = el("div", { class: "p-main" });
      main.appendChild(el("img", { src: m.spriteFront || m.artwork, alt: m.name }));
      const info = el("div", { class: "p-info" });
      info.appendChild(el("div", { class: "p-name" }, `${idx === state.active ? "\u2605 " : ""}${m.name}`));
      info.appendChild(el("div", { class: "small" }, `Lv ${m.level} \xB7 ${m.stats.hp}/${m.stats.maxHp} HP${m.status.cond !== "none" ? " \xB7 " + (STATUS_LABEL[m.status.cond] || "") : ""}`));
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
    if (state.busy && !forced)
      return;
    if (idx === state.active)
      return;
    setBusy(true);
    const from = state.player, to = state.party[idx];
    state.noSwitchTurns = 0;
    await say(`${from.name}, come back!`);
    const regen = switchOutHeal(from);
    await faintOut("#playerSprite").catch(() => {
    });
    setActive(idx);
    if (regen > 0)
      floatToast(`${from.name} regenerated ${regen} HP`);
    await fadeInSprite("#playerSprite");
    await say(`Go, ${to.name}!`);
    await playCry(to);
    save();
    if (forced) {
      await backToMenu();
    } else {
      await enemyFreeTurn(false);
    }
  }
  function openBag() {
    if (state.busy)
      return;
    const box = $("#msgBox");
    let view = $("#bagView");
    if (!view) {
      view = el("div", { id: "bagView", class: "panel hidden" });
      box.appendChild(view);
    }
    view.innerHTML = "";
    const head = el("div", { class: "panel-head" });
    head.appendChild(el("h3", {}, "Bag"));
    const back = el("button", { class: "small ghost" }, "\u25C2 Back");
    back.onclick = async () => {
      show("menu");
      await say("What will you do?", 0);
    };
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
      btn.disabled = count <= 0 || state.busy || action === "ball" && balls;
      btn.onclick = () => {
        if (action === "ball")
          throwBall(key);
        else if (["potion", "super-potion", "hyper-potion"].includes(key))
          usePotionKey(key);
        else
          useCureKey(key);
      };
      c.appendChild(btn);
      grid.appendChild(c);
    };
    item("poke-ball", "Pok\xE9 Ball", "ball");
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
    say(balls ? "Choose an item. (You can't catch a trainer's Pok\xE9mon!)" : "Choose an item.", 0);
  }
  var POTION_HEAL = { potion: 20, "super-potion": 50, "hyper-potion": 200 };
  async function usePotionKey(key) {
    if (state.busy)
      return;
    const heal = POTION_HEAL[key];
    if (!heal || state.items[key] <= 0)
      return;
    if (state.player.stats.hp >= state.player.stats.maxHp) {
      await say("It won't have any effect...");
      return;
    }
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
  var CURE_MAP = { antidote: "psn", "parlyz-heal": "par", awakening: "slp", "burn-heal": "brn", "ice-heal": "frz" };
  async function useCureKey(key) {
    if (state.busy)
      return;
    if (state.items[key] <= 0)
      return;
    const target = CURE_MAP[key];
    const cur = state.player.status.cond;
    const matches = target === cur || key === "antidote" && cur === "tox";
    if (!matches) {
      await say("It had no effect.");
      return;
    }
    setBusy(true);
    state.items[key]--;
    state.player.status = { cond: "none", turns: 0, toxic: 0 };
    updateHUD();
    await say(`${cap(key.replace(/-/g, " "))} cured the status!`);
    save();
    await enemyFreeTurn();
  }
  async function throwBall(key = "poke-ball") {
    if (state.busy)
      return;
    if (state.mode === "trainer") {
      await say("You can't catch a boss's Pok\xE9mon!");
      return;
    }
    if ((state.items[key] || 0) <= 0) {
      await say("You're out of Pok\xE9 Balls!");
      return;
    }
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
      const handle = await fx.throwAndWobble(sx, sy, tx, ty, () => {
        enemyImg.style.opacity = "0";
      });
      const success = Math.random() < 0.92;
      await handle.shake(success ? 3 : Math.floor(Math.random() * 2) + 1);
      if (success) {
        handle.clear();
        await say(`Gotcha! ${state.enemy.name} was caught!`, 400);
        const mon = await buildMon(state.enemy.id, state.enemy.level);
        mon.stats.hp = state.enemy.stats.hp;
        mon.status = state.enemy.status;
        mon.sprite = mon.spriteFront;
        const cb = state.battle && state.battle.onWin;
        state.battle = null;
        await sleep(500);
        if (cb)
          await cb({ caught: mon });
        else
          goToMap();
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
  function openBox() {
    if (state.busy)
      return;
    const box = $("#msgBox");
    let view = $("#boxView");
    if (!view) {
      view = el("div", { id: "boxView", class: "panel hidden" });
      box.appendChild(view);
    }
    view.innerHTML = "";
    const head = el("div", { class: "panel-head" });
    head.appendChild(el("h3", {}, `PC Box \u2014 ${state.box.length}`));
    const back = el("button", { class: "small ghost" }, "\u25C2 Back");
    back.onclick = () => show("swap");
    head.appendChild(back);
    view.appendChild(head);
    const grid = el("div", { class: "box-grid" });
    if (!state.box.length)
      grid.appendChild(el("div", { class: "small" }, "The Box is empty."));
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
  function hasPotion() {
    return state.items.potion > 0 || state.items["super-potion"] > 0 || state.items["hyper-potion"] > 0;
  }
  function bestPotion() {
    const need = state.player.stats.maxHp - state.player.stats.hp;
    if (need <= 0)
      return null;
    const opts = [{ k: "potion", h: 20 }, { k: "super-potion", h: 50 }, { k: "hyper-potion", h: 200 }];
    for (const o of opts)
      if (state.items[o.k] > 0 && need <= o.h)
        return o.k;
    for (const o of opts.slice().reverse())
      if (state.items[o.k] > 0)
        return o.k;
    return null;
  }
  async function maybeAuto() {
    if (!state.auto || state.busy || !state.started || !state.battle)
      return;
    if (!state.player || !state.enemy || state.player.stats.hp <= 0)
      return;
    await sleep(420);
    if (state.busy || !state.battle || state.player.stats.hp <= 0)
      return;
    const hpF = state.player.stats.hp / state.player.stats.maxHp;
    const enemyHpF = state.enemy.stats.hp / state.enemy.stats.maxHp;
    if (hpF < 0.35 && hasPotion()) {
      const k = bestPotion();
      if (k)
        return usePotionKey(k);
    }
    if (state.mode !== "trainer" && (state.items["poke-ball"] || 0) > 0 && (enemyHpF < 0.28 || ["slp", "frz", "par"].includes(state.enemy.status.cond))) {
      return throwBall("poke-ball");
    }
    const cur = battleScore(state.player, state.enemy);
    if (hpF < 0.3) {
      const s = bestSwitch(state.party, state.active, state.enemy, cur, 1.1);
      if (s != null)
        return swapTo(s);
    }
    const better = bestSwitch(state.party, state.active, state.enemy, cur, 1.5);
    if (better != null)
      return swapTo(better);
    const idx = bestMoveIndex(state.player, state.enemy);
    if (idx != null)
      return fightRound(state.player.moves[idx]);
    if (state.mode === "trainer") {
      const m = state.player.moves[0];
      if (m)
        return fightRound(m);
    }
    await fleeBattle();
  }
  async function chooseStarter(id) {
    const screen = $("#starterScreen");
    const grid = $("#starterGrid");
    const prompt = $("#starterPrompt");
    const chosen = STARTERS.find((s) => s.id === id);
    setBusy(true);
    if (grid) {
      grid.querySelectorAll(".starter-card").forEach((card) => {
        card.disabled = true;
        card.classList.toggle("selected", Number(card.dataset.id) === id);
      });
    }
    if (prompt)
      prompt.textContent = `Preparing ${chosen?.name || "your partner"}...`;
    try {
      const mon = await buildMon(id, 5);
      mon.sprite = mon.spriteBack || mon.spriteFront;
      await playCry(mon);
      await startExpedition(mon);
      if (screen)
        screen.classList.add("hidden");
      $(".screen")?.classList.remove("starter-mode");
    } catch (error) {
      console.error("Could not prepare starter:", error);
      if (prompt)
        prompt.textContent = "That partner could not be loaded. Please try again.";
      if (grid)
        grid.querySelectorAll(".starter-card").forEach((card) => card.disabled = false);
    } finally {
      setBusy(false);
    }
  }
  function showStarterPicker() {
    const screen = $("#starterScreen");
    const grid = $("#starterGrid");
    const prompt = $("#starterPrompt");
    if (!screen || !grid)
      return;
    const details = {
      grass: { style: "Steady", note: "Recovery and clever status play" },
      fire: { style: "Bold", note: "Fast pressure and heavy damage" },
      water: { style: "Reliable", note: "Strong defenses and safe matchups" }
    };
    grid.innerHTML = "";
    STARTERS.forEach((s) => {
      const info = details[s.type];
      const b = el("button", {
        class: `starter-card starter-${s.type}`,
        "aria-label": `Choose ${s.name}, ${s.type} type`
      });
      b.dataset.id = String(s.id);
      b.style.setProperty("--starter-type", TYPE_COLOR[s.type]);
      b.innerHTML = `<span class="starter-art"><img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${s.id}.gif" data-fallback="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${s.id}.png" alt="${s.name}" /></span><span class="starter-type">${cap(s.type)} type</span><strong>${s.name}</strong><span class="starter-style">${info.style}</span><small>${info.note}</small><span class="starter-choose">Choose ${s.name}</span>`;
      const img = b.querySelector("img");
      img.onerror = () => {
        if (img.src !== img.dataset.fallback)
          img.src = img.dataset.fallback;
      };
      b.onclick = () => chooseStarter(s.id);
      grid.appendChild(b);
    });
    if (prompt)
      prompt.textContent = "Select a partner to begin";
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
      if (!img)
        continue;
      img.removeAttribute("src");
      delete img.dataset.src;
      img.style.opacity = "0";
      img.style.transform = "none";
    }
    for (const sel of ["#playerTypes", "#enemyTypes", "#playerParty", "#enemyParty"]) {
      const node = $(sel);
      if (node)
        node.innerHTML = "";
    }
    for (const sel of ["#playerName", "#enemyName", "#playerLevel", "#enemyLevel", "#playerHpText", "#enemyHpText"]) {
      const node = $(sel);
      if (node)
        node.textContent = "";
    }
    for (const sel of ["#playerHpFill", "#enemyHpFill", "#playerXpFill"]) {
      const node = $(sel);
      if (node)
        node.style.width = "0%";
    }
    for (const sel of ["#playerStatus", "#enemyStatus", "#weatherIndicator"]) {
      const node = $(sel);
      if (node)
        node.classList.add("hidden");
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
      if (node)
        node.innerHTML = "";
    }
    for (const sel of ["#enemyName", "#enemyLevel", "#enemyHpText"]) {
      const node = $(sel);
      if (node)
        node.textContent = "";
    }
    const hp = $("#enemyHpFill");
    if (hp)
      hp.style.width = "0%";
    $("#enemyStatus")?.classList.add("hidden");
  }
  async function beginNewGame() {
    clearRun();
    state.party = [];
    state.box = [];
    clearBattlePresentation();
    hideTitle();
    state.started = true;
    updateScore();
    showStarterPicker();
  }
  async function continueGame() {
    if (!hasRun())
      return beginNewGame();
    await continueExpedition();
  }
  function hideTitle() {
    const t = $("#titleScreen");
    if (t)
      t.classList.add("hidden");
  }
  function openModal({ title, bodyHTML, actions = [], dismissable = true }) {
    const modal = $("#modal");
    if (!modal)
      return Promise.resolve();
    $("#modalTitle").textContent = title || "";
    $("#modalBody").innerHTML = bodyHTML || "";
    const act = $("#modalActions");
    act.innerHTML = "";
    return new Promise((resolve) => {
      actions.forEach((a) => {
        const b = el("button", { class: "title-btn" + (a.primary ? " primary" : "") }, a.label);
        b.onclick = () => {
          if (a.onClick)
            a.onClick();
          resolve(a.value);
        };
        act.appendChild(b);
      });
      if (dismissable) {
        const c = el("button", { class: "title-btn" }, "Close");
        c.onclick = () => {
          closeModal();
          resolve(null);
        };
        act.appendChild(c);
      }
      modal.classList.remove("hidden");
    });
  }
  function closeModal() {
    const modal = $("#modal");
    if (modal)
      modal.classList.add("hidden");
  }
  function openPanel(title, build) {
    const modal = $("#modal");
    if (!modal)
      return;
    $("#modalTitle").textContent = title || "";
    const body = $("#modalBody");
    body.innerHTML = "";
    $("#modalActions").innerHTML = "";
    const close = () => modal.classList.add("hidden");
    build(body, close);
    modal.classList.remove("hidden");
  }
  function currentRoster() {
    if (state.vault && state.vault.length)
      return buildRoster(state.vault);
    return buildRoster(loadVault());
  }
  function openArena() {
    const roster = currentRoster();
    const v = validateRoster(roster);
    if (!v.ok) {
      return openModal({
        title: "Ranked Arena",
        bodyHTML: `<p>Your Vault is empty.</p><p class="small">Win an Expedition and <b>ascend</b> a Pok\xE9mon into your Vault \u2014 that's the team you bring to 1v1 ranked PvP.</p>`,
        actions: []
      });
    }
    const online = isArenaConfigured();
    const roster6 = roster.slice(0, 6);
    const list = roster6.map((m) => `<li><b>${m.name}</b> <span class="small">Lv ${m.level}</span></li>`).join("");
    openModal({
      title: "Ranked Arena",
      bodyHTML: `<p class="small">Your battle-ready team \xB7 Power ${rosterPower(roster)}</p><ul class="roster-list">${list}</ul>` + (online ? `<p class="small">Connecting to the ranked server\u2026</p>` : `<p class="arena-soon">Online ranked battles are coming soon.</p><p class="small">Your team is Arena-ready and will carry straight into 1v1 ranked play the moment servers go live.</p>`),
      actions: online ? [{ label: "Find Match", primary: true, onClick: () => beginRankedSearch(roster) }] : []
    });
  }
  async function beginRankedSearch(roster) {
    try {
      await arena.connect();
      arena.queueRanked(roster);
    } catch (e) {
      closeModal();
      openModal({
        title: "Ranked Arena",
        bodyHTML: `<p>${e.message || "Could not reach the ranked server."}</p>`,
        actions: []
      });
    }
  }
  function wireUI() {
    $("#fightBtn").addEventListener("click", () => {
      if (!state.busy) {
        renderMoves();
        show("moves");
      }
    });
    $("#ballInfoBtn").addEventListener("click", () => {
      if (!state.busy)
        openBag();
    });
    $("#swapBtn").addEventListener("click", () => {
      if (!state.busy) {
        renderParty();
        show("swap");
      }
    });
    $("#runBtn").addEventListener("click", () => {
      if (!state.busy)
        fleeBattle();
    });
    const mapBtn = $("#mapBtn");
    if (mapBtn)
      mapBtn.addEventListener("click", () => {
        if (!state.busy && state.run)
          showMap();
      });
    $("#backBtn").addEventListener("click", async () => {
      if (!state.busy) {
        show("menu");
        await say("What will you do?", 0);
      }
    });
    $("#swapBackBtn").addEventListener("click", async () => {
      if (!state.busy) {
        show("menu");
        await say("What will you do?", 0);
      }
    });
    $("#boxOpenBtn").addEventListener("click", () => openBox());
    const auto = $("#autoToggle");
    if (auto)
      auto.addEventListener("change", () => {
        state.auto = auto.checked;
        if (state.auto)
          maybeAuto();
      });
    $("#newGameBtn").addEventListener("click", () => beginNewGame());
    const cont = $("#continueBtn");
    if (cont)
      cont.addEventListener("click", () => continueGame());
    const arenaBtn = $("#arenaBtn");
    if (arenaBtn)
      arenaBtn.addEventListener("click", () => openArena());
  }
  function boot() {
    state.vault = loadVault();
    state.meta = loadMeta();
    backfillOwnedPokemon(state.vault);
    saveMeta();
    wireUI();
    initAudio();
    updateScore();
    refreshTitleButtons();
    window.addEventListener("resize", () => {
      if (state.run && state.mode === "map" && typeof requestAnimationFrame === "function") {
        requestAnimationFrame(renderMapEdges);
      }
    });
    setInterval(() => {
      if (state.auto && state.started && state.battle)
        maybeAuto();
    }, 1100);
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else
    boot();
})();
