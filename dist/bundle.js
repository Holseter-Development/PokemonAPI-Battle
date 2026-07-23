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
  function rollHit(move, attacker, defender, rng = Math.random) {
    if (move.accuracy == null)
      return true;
    const net = clamp(stage(attacker, "acc") - stage(defender, "eva"), -6, 6);
    const chance = move.accuracy * accMult(net);
    return rng() * 100 < chance;
  }
  function rollCrit(attacker, move, rng = Math.random) {
    let base = clamp((attacker.stats.spe || attacker.stats.spd || 40) / 512, 0.02, 0.25);
    if (move.highCrit)
      base = clamp(base * 2, 0.02, 0.4);
    return rng() < base;
  }
  function calcDamage(attacker, defender, move, rng = Math.random, opts = {}) {
    const level = attacker.level;
    const special = move.damage_class === "special";
    let atkStat = special ? effectiveStat(attacker, "spa") : effectiveStat(attacker, "atk");
    const defStat = special ? effectiveStat(defender, "spd") : effectiveStat(defender, "def");
    if (!special && attacker.status && attacker.status.cond === "brn") {
      atkStat = Math.max(1, Math.floor(atkStat * 0.5));
    }
    const eff = typeEffect(move.type, defender.types);
    if (eff === 0)
      return { dmg: 0, eff: 0, crit: false };
    const base = Math.floor(
      Math.floor(
        Math.floor(2 * level / 5 + 2) * move.power * (atkStat / Math.max(1, defStat)) / 50
      ) + 2
    );
    const randFactor = opts.avg ? 0.925 : 0.85 + rng() * 0.15;
    const stab = attacker.types.includes(move.type) ? 1.5 : 1;
    let dmg = Math.max(1, Math.floor(base * randFactor * stab * eff));
    const crit = opts.forceCrit || rollCrit(attacker, move, rng);
    if (crit)
      dmg = Math.floor(dmg * 1.8);
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
  function useMove(attacker, defender, move, rng = Math.random) {
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
      flinch: false,
      log: []
    };
    if (move.isOHKO) {
      if (attacker.level < defender.level || rng() >= 0.3) {
        res.missed = true;
        res.log.push("But it failed!");
        return res;
      }
      const dmg = defender.stats.hp;
      defender.stats.hp = 0;
      res.hits.push({ dmg, crit: false, eff: 1 });
      res.totalDmg = dmg;
      res.targetFainted = true;
      res.log.push("It's a one-hit KO!");
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
        const { dmg, crit } = calcDamage(attacker, defender, move, rng);
        defender.stats.hp = clamp(defender.stats.hp - dmg, 0, defender.stats.maxHp);
        res.hits.push({ dmg, crit, eff });
        res.totalDmg += dmg;
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
  function firstMover(a, aMove, b, bMove, rng = Math.random) {
    const pa = aMove ? aMove.priority || 0 : 0;
    const pb = bMove ? bMove.priority || 0 : 0;
    if (pa !== pb)
      return pa > pb ? "a" : "b";
    const sa = effectiveStat(a, "spe");
    const sb = effectiveStat(b, "spe");
    if (sa !== sb)
      return sa > sb ? "a" : "b";
    return rng() < 0.5 ? "a" : "b";
  }
  function catchSuccess(mon, ballBonus = 1, rng = Math.random) {
    const maxHP = mon.stats.maxHp, curHP = mon.stats.hp, rate = mon.capture_rate || 45;
    let a = (3 * maxHP - 2 * curHP) * rate / (3 * maxHP) * ballBonus;
    const s = mon.status ? mon.status.cond : "none";
    if (s === "slp" || s === "frz")
      a *= 2;
    else if (s === "par" || s === "psn" || s === "brn" || s === "tox")
      a *= 1.5;
    return rng() < a / 256;
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
    let pick = -1, score = -Infinity;
    attacker.moves.forEach((m, i) => {
      if (m.ppLeft <= 0)
        return;
      const sc = moveScore(attacker, defender, m);
      if (sc > score) {
        score = sc;
        pick = i;
      }
    });
    return pick >= 0 ? pick : null;
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
  var SAVE_KEY = "pkbattle:save:v2";
  var GYM_EVERY = 3;
  var state = {
    party: [],
    box: [],
    active: 0,
    player: null,
    enemy: null,
    busy: false,
    auto: false,
    started: false,
    mode: "wild",
    // "wild" | "trainer"
    trainer: null,
    // active Gym / Champion object
    trainerTeam: [],
    trainerIdx: 0,
    isChampion: false,
    gymsBeaten: 0,
    championBeaten: false,
    championsCleared: 0,
    ngPlus: 0,
    wins: 0,
    money: 0,
    badges: [],
    items: {
      "poke-ball": 10,
      "great-ball": 2,
      "ultra-ball": 0,
      potion: 3,
      "super-potion": 1,
      "hyper-potion": 0,
      antidote: 1,
      "parlyz-heal": 1,
      awakening: 1,
      "burn-heal": 1,
      "ice-heal": 1
    }
  };
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
      w.textContent = state.wins;
    if (m)
      m.textContent = state.money;
    if (bs) {
      bs.innerHTML = "";
      state.badges.forEach((b) => bs.appendChild(el("span", { class: "gym-badge" }, b)));
    }
    updateObjective();
  }
  function updateObjective() {
    const obj = $("#objective");
    if (!obj)
      return;
    let text;
    if (state.gymsBeaten < GYMS.length) {
      const next = GYMS[state.gymsBeaten];
      text = `Badges ${state.badges.length}/${GYMS.length} \xB7 Next: ${next.town} Gym (${cap(next.type)})`;
    } else if (!state.championBeaten) {
      text = `All ${GYMS.length} badges! \xB7 Challenge the Champion`;
    } else {
      text = `Champion \xB7 New Game+ ${state.ngPlus}`;
    }
    const ng = state.ngPlus > 0 && state.gymsBeaten < GYMS.length ? ` \xB7 NG+${state.ngPlus}` : "";
    obj.innerHTML = `<svg class="ico"><use href="#i-medal" /></svg> <span>${text}${ng}</span>`;
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
    const res = useMove(attacker, defender, move);
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
    const eIdx = chooseAIMove(state.enemy, state.player);
    const enemyMove = state.enemy.moves[eIdx] || { ...STRUGGLE };
    const playerFirst = firstMover(state.player, playerMove, state.enemy, enemyMove) === "a";
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
  async function enemyFreeTurn() {
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
    await gainXP(state.player, xpFor(state.enemy));
    if (state.mode === "trainer") {
      state.trainerIdx++;
      if (state.trainerIdx < state.trainerTeam.length) {
        await sleep(400);
        await sendTrainerMon(state.trainerIdx);
        await backToMenu();
        return;
      }
      await onTrainerDefeated();
      return;
    }
    state.wins++;
    maybeAwardDrops();
    updateScore();
    save();
    await sleep(500);
    await startEncounter();
    setBusy(false);
  }
  async function onPlayerFaint() {
    await playCry(state.player);
    await faintOut("#playerSprite");
    await say(`${state.player.name} fainted!`);
    const healthyIdx = state.party.map((m, i) => ({ m, i })).filter(({ m, i }) => m.stats.hp > 0 && i !== state.active).map(({ i }) => i);
    if (healthyIdx.length) {
      if (state.auto) {
        const cur = battleScore(state.player, state.enemy);
        const pick = bestSwitch(state.party, state.active, state.enemy, 0, 0) ?? healthyIdx[0];
        await say("Choose your next Pok\xE9mon!");
        await swapTo(pick, true);
        return;
      }
      await say("Choose your next Pok\xE9mon!");
      renderParty(true);
      show("swap");
      setBusy(false);
      return;
    }
    await say("You have no Pok\xE9mon left to fight...", 400);
    await say("You scurry back to the Pok\xE9mon Center.");
    state.party.forEach((m) => {
      m.stats.hp = m.stats.maxHp;
      m.status = { cond: "none", turns: 0, toxic: 0 };
      resetStages(m);
      m.moves.forEach((mv) => mv.ppLeft = mv.pp);
    });
    state.money = Math.max(0, Math.floor(state.money * 0.5));
    state.mode = "wild";
    state.trainer = null;
    state.wins = Math.max(0, state.wins - 1);
    setActive(0);
    save();
    await sleep(700);
    await startEncounter();
    setBusy(false);
  }
  function wildLevel() {
    return clamp(4 + Math.floor(state.wins / 2.5), 4, 55);
  }
  async function startEncounter() {
    resetStages(state.player);
    const ps = $("#playerSprite");
    if (ps) {
      ps.style.opacity = "1";
      ps.style.transform = "none";
    }
    if (state.mode !== "trainer") {
      const g = state.gymsBeaten;
      if (g < GYMS.length && state.wins >= (g + 1) * GYM_EVERY) {
        return startGymBattle(GYMS[g], false);
      }
      if (g >= GYMS.length && !state.championBeaten && state.wins >= (GYMS.length + 1) * GYM_EVERY) {
        return startGymBattle(CHAMPION, true);
      }
    }
    state.mode = "wild";
    state.trainer = null;
    state.trainerTeam = [];
    show("menu");
    const level = wildLevel();
    let mon = null, poke = null;
    for (let tries = 0; tries < 12; tries++) {
      const eid = 1 + Math.floor(Math.random() * GEN1_MAX_ID);
      if (eid >= 144 && eid <= 151)
        continue;
      poke = await fetchPokemon(eid);
      const bst = poke.stats.reduce((a, s) => a + s.base_stat, 0);
      if (bst <= 360 || tries > 8) {
        mon = makeMon(poke, level);
        const species = await fetchSpecies(poke.id);
        mon.capture_rate = species.capture_rate;
        break;
      }
    }
    mon.moves = await fetchMoveset(poke, mon.level);
    if (!mon.moves.length)
      mon.moves = [{ ...STRUGGLE, name: "Tackle", key: "tackle", power: 40, pp: 35, ppLeft: 35, drain: 0 }];
    state.enemy = mon;
    updateHUD();
    setThemeByType(mon.types);
    await fadeInSprite("#enemySprite");
    await say(`A wild ${mon.name} appeared!`);
    await playCry(mon);
    await backToMenu();
  }
  async function startGymBattle(gym, isChampion) {
    state.mode = "trainer";
    state.trainer = gym;
    state.isChampion = isChampion;
    state.trainerIdx = 0;
    setBusy(true);
    show("none");
    const anchor = Math.max(wildLevel(), gym.floor) + state.ngPlus * 10;
    state.trainerTeam = [];
    for (let i = 0; i < gym.team.length; i++) {
      const lvl = clamp(anchor + i, 4, 100);
      const mon = await buildMon(gym.team[i], lvl);
      state.trainerTeam.push(mon);
    }
    await showBanner(`${gym.title} ${gym.leader}`, 1400);
    await say(gym.intro, 500);
    await sendTrainerMon(0);
    await backToMenu();
  }
  async function sendTrainerMon(idx) {
    const mon = state.trainerTeam[idx];
    ensureRuntime(mon);
    state.enemy = mon;
    updateHUD();
    setThemeByType(mon.types);
    await fadeInSprite("#enemySprite");
    await say(`${state.trainer.leader} sent out ${mon.name}!`);
    await playCry(mon);
  }
  function grantRewards(r) {
    if (!r)
      return;
    if (r.money)
      state.money += r.money;
    if (r.balls)
      state.items["poke-ball"] += r.balls;
    if (r.potions)
      state.items["potion"] += r.potions;
    if (r.superPotions)
      state.items["super-potion"] += r.superPotions;
    if (r.hyperPotions)
      state.items["hyper-potion"] += r.hyperPotions;
    if (r.ultraBalls)
      state.items["ultra-ball"] += r.ultraBalls;
  }
  async function onTrainerDefeated() {
    const g = state.trainer;
    const champ = state.isChampion;
    await say(`You defeated ${g.leader}!`, 400);
    grantRewards(g.reward);
    if (g.reward?.money)
      await say(`You received \u20BD${g.reward.money} prize money!`);
    if (g.badge && !state.badges.includes(g.badge)) {
      state.badges.push(g.badge);
      if (!champ)
        await showBanner(`You earned the ${g.badge} Badge!`, 1500);
    }
    state.wins++;
    state.mode = "wild";
    state.trainer = null;
    state.trainerTeam = [];
    state.isChampion = false;
    if (champ) {
      await onChampionDefeated();
      return;
    }
    state.gymsBeaten++;
    updateScore();
    save();
    await sleep(400);
    await startEncounter();
    setBusy(false);
  }
  async function onChampionDefeated() {
    state.championBeaten = true;
    state.championsCleared++;
    updateScore();
    save();
    await flashWhite("#enemySprite");
    await openModal({
      title: "Champion!",
      bodyHTML: `<p>You stormed the Indigo Plateau and became the <b>Champion</b>!</p><p class="small">Hall of Fame entries: <b>${state.championsCleared}</b> \xB7 New Game+ ${state.ngPlus + 1} unlocks tougher Gyms and higher-level foes. Your team, items and money carry over.</p>`,
      actions: [
        { label: "Enter New Game+", primary: true, onClick: () => startNewGamePlus() }
      ],
      dismissable: false
    });
  }
  async function startNewGamePlus() {
    closeModal();
    state.ngPlus++;
    state.gymsBeaten = 0;
    state.championBeaten = false;
    state.badges = [];
    state.party.forEach((m) => {
      m.stats.hp = m.stats.maxHp;
      m.status = { cond: "none", turns: 0, toxic: 0 };
      resetStages(m);
      m.moves.forEach((mv) => mv.ppLeft = mv.pp);
    });
    setActive(0);
    updateScore();
    save();
    await say(`New Game+ ${state.ngPlus} begins! The Gyms await, stronger than ever.`, 600);
    await startEncounter();
    setBusy(false);
  }
  function maybeAwardDrops() {
    if (Math.random() < 0.22) {
      const g = Math.random() < 0.5 ? 1 : 2;
      state.items["poke-ball"] += g;
      floatToast(`Found ${g} Pok\xE9 Ball${g > 1 ? "s" : ""}!`);
    }
    if (Math.random() < 0.12) {
      const r = Math.random();
      const key = r < 0.6 ? "potion" : r < 0.9 ? "super-potion" : "hyper-potion";
      state.items[key]++;
    }
    if (Math.random() < 0.1)
      state.money += 20 + Math.floor(Math.random() * 40);
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
    await say(`${from.name}, come back!`);
    await faintOut("#playerSprite").catch(() => {
    });
    setActive(idx);
    await fadeInSprite("#playerSprite");
    await say(`Go, ${to.name}!`);
    await playCry(to);
    save();
    if (forced) {
      await backToMenu();
    } else {
      await enemyFreeTurn();
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
  var BALL_BONUS = { "poke-ball": 1, "great-ball": 1.5, "ultra-ball": 2 };
  async function throwBall(key = "poke-ball") {
    if (state.busy)
      return;
    if (state.mode === "trainer") {
      await say("You can't catch a trainer's Pok\xE9mon!");
      return;
    }
    if ((state.items[key] || 0) <= 0) {
      await say("None left!");
      return;
    }
    setBusy(true);
    show("none");
    state.items[key]--;
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
      const success = catchSuccess(state.enemy, BALL_BONUS[key] || 1);
      await handle.shake(success ? 3 : Math.floor(Math.random() * 2) + 1);
      if (success) {
        handle.clear();
        await say(`Gotcha! ${state.enemy.name} was caught!`, 400);
        const mon = await buildMon(state.enemy.id, state.enemy.level);
        mon.stats.hp = state.enemy.stats.hp;
        mon.status = state.enemy.status;
        mon.sprite = mon.spriteFront;
        if (state.party.length < 6)
          state.party.push(mon);
        else {
          state.box.push(mon);
          await say(`${mon.name} was sent to the PC Box!`);
        }
        maybeAwardDrops();
        state.wins++;
        updateScore();
        save();
        await sleep(700);
        await startEncounter();
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
    if (!state.auto || state.busy || !state.started)
      return;
    if (!state.player || !state.enemy || state.player.stats.hp <= 0)
      return;
    await sleep(420);
    if (state.busy || state.player.stats.hp <= 0)
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
    await say("Got away safely!");
    await sleep(300);
    await startEncounter();
  }
  function save() {
    try {
      const data = {
        party: state.party,
        box: state.box,
        active: state.active,
        items: state.items,
        money: state.money,
        wins: state.wins,
        badges: state.badges,
        gymsBeaten: state.gymsBeaten,
        championBeaten: state.championBeaten,
        championsCleared: state.championsCleared,
        ngPlus: state.ngPlus,
        v: 3
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (_) {
    }
  }
  function hasSave() {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch (_) {
      return false;
    }
  }
  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw)
        return false;
      const d = JSON.parse(raw);
      if (!d.party || !d.party.length)
        return false;
      state.party = d.party.map(ensureRuntime);
      state.box = (d.box || []).map(ensureRuntime);
      state.active = clamp(d.active || 0, 0, state.party.length - 1);
      state.items = Object.assign(state.items, d.items || {});
      state.money = d.money || 0;
      state.wins = d.wins || 0;
      state.badges = d.badges || [];
      state.gymsBeaten = d.gymsBeaten ?? d.trainersBeaten ?? 0;
      state.championBeaten = !!d.championBeaten;
      state.championsCleared = d.championsCleared || 0;
      state.ngPlus = d.ngPlus || 0;
      return true;
    } catch (_) {
      return false;
    }
  }
  async function chooseStarter(id) {
    setBusy(true);
    const mon = await buildMon(id, 5);
    mon.sprite = mon.spriteBack || mon.spriteFront;
    state.party = [mon];
    state.box = [];
    state.wins = 0;
    state.money = 500;
    state.badges = [];
    state.gymsBeaten = 0;
    state.championBeaten = false;
    state.championsCleared = 0;
    state.ngPlus = 0;
    state.mode = "wild";
    setActive(0);
    await fadeInSprite("#playerSprite");
    await say(`You chose ${mon.name}! Your journey begins.`, 500);
    await playCry(mon);
    save();
    await startEncounter();
    setBusy(false);
  }
  function showStarterPicker() {
    const box = $("#msgBox");
    let view = $("#starterView");
    if (!view) {
      view = el("div", { id: "starterView", class: "panel" });
      box.appendChild(view);
    }
    view.innerHTML = "";
    view.appendChild(el("div", { class: "panel-head" }, ""));
    view.firstChild.appendChild(el("h3", {}, "Choose your partner"));
    const grid = el("div", { class: "moves-grid" });
    STARTERS.forEach((s) => {
      const b = el("button", { class: "move-btn" });
      b.style.setProperty("--mtype", TYPE_COLOR[s.type]);
      b.innerHTML = `<span class="mv-name">${s.name}</span><span class="mv-meta"><span>${cap(s.type)} type</span></span>`;
      b.onclick = () => {
        view.remove();
        chooseStarter(s.id);
      };
      grid.appendChild(b);
    });
    view.appendChild(grid);
    ["#menu", "#movesView", "#swapView"].forEach((sel) => $(sel) && $(sel).classList.add("hidden"));
  }
  async function beginNewGame() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (_) {
    }
    state.party = [];
    state.box = [];
    state.wins = 0;
    state.badges = [];
    state.gymsBeaten = 0;
    state.championBeaten = false;
    state.championsCleared = 0;
    state.ngPlus = 0;
    state.money = 0;
    state.mode = "wild";
    hideTitle();
    state.started = true;
    updateScore();
    await say("Welcome! Choose your starter to begin.", 200);
    showStarterPicker();
  }
  async function continueGame() {
    if (!loadSave())
      return beginNewGame();
    hideTitle();
    state.started = true;
    setActive(state.active);
    updateScore();
    await startEncounter();
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
  function currentRoster() {
    const party = state.party && state.party.length ? state.party : savedParty();
    return buildRoster(party);
  }
  function savedParty() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw)
        return [];
      const d = JSON.parse(raw);
      return (d.party || []).map(ensureRuntime);
    } catch (_) {
      return [];
    }
  }
  function openArena() {
    const roster = currentRoster();
    const v = validateRoster(roster);
    if (!v.ok) {
      return openModal({
        title: "Ranked Arena",
        bodyHTML: `<p>${v.reason}</p><p class="small">Grind, catch and level a team in singleplayer, then bring it here for ranked PvP.</p>`,
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
    $("#runBtn").addEventListener("click", async () => {
      if (state.busy)
        return;
      if (state.mode === "trainer") {
        await say("You can't run from a trainer battle!");
        return;
      }
      setBusy(true);
      await say("Got away safely!");
      await sleep(300);
      await startEncounter();
      setBusy(false);
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
    wireUI();
    initAudio();
    updateScore();
    if (hasSave()) {
      const cont = $("#continueBtn");
      if (cont)
        cont.classList.remove("hidden");
    }
    setInterval(() => {
      if (state.auto && state.started)
        maybeAuto();
    }, 1100);
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else
    boot();
})();
