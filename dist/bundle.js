(() => {
  // src/api.js
  var API = "https://pokeapi.co/api/v2";
  var GEN1_MAX_ID = 151;
  var VERSION_GROUPS_GEN1 = ["red-blue", "yellow"];
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
      localStorage.setItem("cache:" + url, JSON.stringify({ t: now, v }));
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

  // src/audio.js
  var isMuted = false;
  var sfxVolume = 0.2;
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
    sound.volume = sfxVolume;
    sound.play().catch((e) => console.error("Error playing SFX:", e));
  }
  function initAudio() {
    const music = document.getElementById("battleMusic");
    const muteBtn = document.getElementById("muteBtn");
    const volumeSlider = document.getElementById("volumeSlider");
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
    sfxVolume = parseFloat(volumeSlider.value);
    music.volume = sfxVolume;
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
      a.volume = sfxVolume;
      await a.play();
    } catch (_) {
    }
  }

  // src/battle.js
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  var CHART = {
    normal: { rock: 0.5, ghost: 0 },
    fire: {
      fire: 0.5,
      water: 0.5,
      grass: 2,
      ice: 2,
      bug: 2,
      rock: 0.5,
      dragon: 0.5
    },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: {
      water: 2,
      electric: 0.5,
      grass: 0.5,
      ground: 0,
      flying: 2,
      dragon: 0.5
    },
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
    ice: {
      fire: 0.5,
      water: 0.5,
      ice: 0.5,
      grass: 2,
      ground: 2,
      flying: 2,
      dragon: 2
    },
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
  function typeEffect(moveType, targetTypes) {
    let mult = 1;
    const row = CHART[moveType] || {};
    for (const t of targetTypes) {
      mult *= row[t] ?? 1;
    }
    return mult;
  }
  function rollHit(acc) {
    const a = acc ?? 100;
    return Math.random() * 100 < a;
  }
  function rollCrit(attacker, move) {
    let base = clamp(attacker.stats.spd / 512, 0.02, 0.25);
    if (move.highCrit)
      base = clamp(base * 2, 0.02, 0.33);
    return Math.random() < base;
  }
  function calcDamage(attacker, defender, move) {
    const level = attacker.level;
    let atkStat = move.damage_class === "special" ? attacker.stats.spa : attacker.stats.atk;
    const defStat = move.damage_class === "special" ? defender.stats.spd : defender.stats.def;
    if (move.damage_class !== "special" && attacker.status.cond === "brn") {
      atkStat = Math.max(1, Math.floor(atkStat * 0.5));
    }
    const eff = typeEffect(move.type, defender.types);
    const base = Math.floor(
      Math.floor(
        Math.floor(2 * level / 5 + 2) * move.power * (atkStat / Math.max(1, defStat)) / 50
      ) + 2
    );
    const rand = 0.85 + Math.random() * 0.15;
    const stab = attacker.types.includes(move.type) ? 1.2 : 1;
    let dmg = Math.max(1, Math.floor(base * rand * stab * eff));
    const crit = rollCrit(attacker, move);
    if (crit)
      dmg = Math.floor(dmg * 2);
    return { dmg, eff, crit };
  }
  function catchSuccess(mon) {
    const maxHP = mon.stats.maxHp, curHP = mon.stats.hp, rate = mon.capture_rate || 45;
    let a = (3 * maxHP - 2 * curHP) * rate / (3 * maxHP);
    const s = mon.status.cond;
    if (s === "slp" || s === "frz")
      a *= 2;
    else if (s === "par" || s === "psn" || s === "brn")
      a *= 1.5;
    const chance = a / 256;
    return Math.random() < chance;
  }

  // src/ui.js
  function show(view) {
    $("#starterPick").classList.toggle("hidden", view !== "starter");
    $("#menu").classList.toggle("hidden", view !== "menu");
    $("#movesView").classList.toggle("hidden", view !== "moves");
    $("#swapView").classList.toggle("hidden", view !== "swap");
    const bv = $("#bagView");
    if (bv)
      bv.classList.toggle("hidden", view !== "bag");
    const bxv = $("#boxView");
    if (bxv)
      bxv.classList.toggle("hidden", view !== "box");
  }
  function text(t) {
    const el2 = document.getElementById("textLine");
    if (el2)
      el2.textContent = t;
  }

  // src/main.js
  console.info("Gen1 Battle build v0.8");
  var TRIMMED_SPRITE_CACHE = /* @__PURE__ */ new Map();
  var wins = 0;
  async function getTrimmedSprite(url) {
    if (!url)
      return "";
    if (TRIMMED_SPRITE_CACHE.has(url)) {
      return TRIMMED_SPRITE_CACHE.get(url);
    }
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        let lastY = canvas.height - 1;
        let foundPixelInImage = false;
        for (let y = canvas.height - 1; y >= 0; y--) {
          const pixelData = ctx.getImageData(0, y, canvas.width, 1).data;
          for (let i = 3; i < pixelData.length; i += 4) {
            if (pixelData[i] > 0) {
              lastY = y;
              foundPixelInImage = true;
              break;
            }
          }
          if (foundPixelInImage)
            break;
        }
        const newHeight = lastY + 1;
        const trimmedCanvas = document.createElement("canvas");
        trimmedCanvas.width = canvas.width;
        trimmedCanvas.height = newHeight;
        const trimmedCtx = trimmedCanvas.getContext("2d");
        trimmedCtx.drawImage(canvas, 0, 0);
        resolve(trimmedCanvas.toDataURL());
      };
      img.onerror = () => resolve(url);
      img.src = proxyUrl;
    });
    TRIMMED_SPRITE_CACHE.set(url, promise);
    return promise;
  }
  var THEMES = [
    "normal",
    "fire",
    "water",
    "grass",
    "electric",
    "ice",
    "fighting",
    "poison",
    "ground",
    "flying",
    "psychic",
    "bug",
    "rock",
    "ghost",
    "dragon"
  ];
  function setThemeByType(types) {
    const t = types && types[0] || "normal";
    const el2 = document.querySelector(".screen");
    if (!el2)
      return;
    THEMES.forEach((x) => el2.classList.remove("type-" + x));
    el2.classList.add("type-" + t);
    try {
      ThemeFX.set(t);
    } catch (e) {
      console.error("ThemeFX failed to set:", e);
    }
  }
  var $2 = (sel) => document.querySelector(sel);
  var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function clamp2(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function hpColor(frac) {
    return frac > 0.5 ? "var(--hp-green)" : frac > 0.2 ? "var(--hp-yellow)" : "var(--hp-red)";
  }
  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function el(tag, attrs = {}, text2 = "") {
    const x = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs))
      x.setAttribute(k, v);
    if (text2)
      x.textContent = text2;
    return x;
  }
  function cssNum(varName, fallback) {
    const v = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(varName)
    );
    return isNaN(v) ? fallback : v;
  }
  var state = {
    party: [],
    active: 0,
    player: null,
    enemy: null,
    turn: "player",
    busy: false,
    items: {
      "poke-ball": 10,
      potion: 2,
      "super-potion": 0,
      "hyper-potion": 0,
      antidote: 0,
      "parlyz-heal": 0,
      awakening: 0,
      "burn-heal": 0,
      "ice-heal": 0
    },
    box: [],
    auto: false
  };
  function setBusy(v) {
    state.busy = v;
    document.querySelectorAll("button").forEach((b) => b.disabled = v);
  }
  var ITEM_ICON = (name) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}.png`;
  function makeMon(data, level = 5) {
    const stats = Object.fromEntries(
      data.stats.map((s) => [s.stat.name, s.base_stat])
    );
    const maxHp = Math.floor(stats.hp * 2 * level / 100 + level + 10);
    const atk = Math.floor(stats.attack * 2 * level / 100 + 5);
    const def = Math.floor(stats.defense * 2 * level / 100 + 5);
    const spa = Math.floor(stats["special-attack"] * 2 * level / 100 + 5);
    const spd = Math.floor(stats["special-defense"] * 2 * level / 100 + 5);
    return {
      id: data.id,
      name: cap(data.name),
      spriteFront: data.sprites.front_default,
      spriteBack: data.sprites.back_default,
      sprite: data.sprites.front_default,
      level,
      stats: { maxHp, hp: maxHp, atk, def, spa, spd },
      base_exp: data.base_experience || 64,
      moves: [],
      capture_rate: 45,
      types: data.types.map((t) => t.type.name),
      growth: null,
      evoChainUrl: null,
      speciesId: null,
      xp: 0,
      xpNext: 10,
      status: { cond: "none", turns: 0, toxic: false }
    };
  }
  function setActive(i) {
    state.active = i;
    state.player = state.party[i];
    if (state.player)
      state.player.sprite = state.player.spriteBack || state.player.spriteFront;
    updateHUD();
    playCry(state.player);
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
    mon.xp += amount;
    while (mon.xp >= mon.xpNext) {
      mon.xp -= mon.xpNext;
      await levelUp(mon);
    }
    updateHUD();
  }
  async function levelUp(mon) {
    const oldMax = mon.stats.maxHp;
    const frac = mon.stats.hp / Math.max(1, oldMax);
    mon.level++;
    const data = await fetchPokemon(mon.id);
    const tmp = makeMon(data, mon.level);
    mon.stats = tmp.stats;
    mon.stats.hp = Math.max(1, Math.floor(mon.stats.maxHp * frac));
    mon.moves = await getGen1DamageMovesForPokemon(data, mon.level);
    if (mon.growth) {
      const levels = mon.growth.table;
      const cur = levels.find((x) => x.level === mon.level)?.experience ?? 0;
      const next = levels.find((x) => x.level === mon.level + 1)?.experience ?? cur + 50;
      mon.xpNext = Math.max(1, next - cur);
    }
    await maybeEvolve(mon);
  }
  async function maybeEvolve(mon) {
    if (!mon.evoChainUrl)
      return;
    const chain = await fetchEvo(mon.evoChainUrl);
    function findNode(node2) {
      if (node2.species.name.toLowerCase() === mon.name.toLowerCase())
        return node2;
      for (const c of node2.evolves_to) {
        const r = findNode(c);
        if (r)
          return r;
      }
      return null;
    }
    const node = findNode(chain.chain);
    if (!node)
      return;
    const candidate = node.evolves_to?.find(
      (e) => e.evolution_details?.some((d) => (d.min_level || 0) <= mon.level)
    );
    if (!candidate)
      return;
    const nextName = candidate.species.name;
    const data = await fetchPokemon(nextName);
    const species = await fetchSpecies(data.id);
    const evolved = makeMon(data, mon.level);
    evolved.moves = await getGen1DamageMovesForPokemon(data, mon.level);
    await setupGrowthAndEvo(evolved, species);
    const frac = mon.stats.hp / mon.stats.maxHp;
    evolved.stats.hp = Math.max(1, Math.floor(evolved.stats.maxHp * frac));
    evolved.xp = mon.xp;
    evolved.xpNext = mon.xpNext;
    evolved.sprite = evolved.spriteBack || evolved.spriteFront;
    const idx = state.party.indexOf(mon);
    if (idx >= 0) {
      state.party[idx] = evolved;
      if (state.active === idx)
        state.player = evolved;
    }
    text(`${cap(mon.name)} evolved into ${cap(evolved.name)}!`);
    updateHUD();
  }
  async function getGen1DamageMovesForPokemon(poke, level) {
    const seen = /* @__PURE__ */ new Set();
    const entries = [];
    for (const m of poke.moves) {
      for (const vg of m.version_group_details) {
        if (!VERSION_GROUPS_GEN1.includes(vg.version_group.name))
          continue;
        if (vg.move_learn_method?.name !== "level-up")
          continue;
        const learnLv = vg.level_learned_at ?? 0;
        if (learnLv <= level) {
          if (!seen.has(m.move.url)) {
            seen.add(m.move.url);
            if (!MOVE_CACHE.has(m.move.url))
              MOVE_CACHE.set(m.move.url, fetchCachedJSON(m.move.url));
            entries.push({ url: m.move.url, level: learnLv });
          }
        }
      }
    }
    const moveDatas = await Promise.all(
      entries.map((x) => MOVE_CACHE.get(x.url))
    );
    const merged = moveDatas.map((md, i) => ({ md, level: entries[i].level }));
    const usable = merged.filter(
      (x) => x.md.generation?.name === "generation-i" && (x.md.damage_class?.name === "physical" || x.md.damage_class?.name === "special") && x.md.power
    ).sort((a, b) => a.level - b.level);
    const uniqueByName = [];
    const nameSeen = /* @__PURE__ */ new Set();
    for (const x of usable) {
      const name = x.md.name;
      if (!nameSeen.has(name)) {
        nameSeen.add(name);
        uniqueByName.push(x);
      }
      if (uniqueByName.length >= 4)
        break;
    }
    return uniqueByName.map(({ md }) => ({
      name: cap(md.name.replace(/-/g, " ")),
      key: md.name,
      power: md.power || 40,
      accuracy: md.accuracy || 100,
      type: md.type?.name || "normal",
      damage_class: md.damage_class?.name || "physical",
      pp: md.pp || 20,
      ppLeft: md.pp || 20,
      highCrit: !!(md.meta && md.meta.crit_rate && md.meta.crit_rate > 0),
      ailment: md.meta?.ailment?.name || "none",
      ailment_chance: md.meta?.ailment_chance || 0
    }));
  }
  async function updateHUD() {
    const playerSprite = $2("#playerSprite");
    const enemySprite = $2("#enemySprite");
    if (state.player) {
      $2("#playerName").textContent = state.player.name;
      $2("#playerLevel").textContent = state.player.level;
      const pf = state.player.stats.hp / state.player.stats.maxHp;
      $2(
        "#playerHpText"
      ).textContent = `${state.player.stats.hp}/${state.player.stats.maxHp}`;
      const pFill = $2("#playerHpFill");
      pFill.style.width = `${100 * pf}%`;
      pFill.style.background = hpColor(pf);
      try {
        if (playerSprite.dataset.originalSrc !== state.player.sprite) {
          playerSprite.dataset.originalSrc = state.player.sprite;
          const trimmedSrc = await getTrimmedSprite(state.player.sprite);
          playerSprite.src = trimmedSrc;
        }
      } catch (error) {
        console.error("Failed to trim player sprite, using original:", error);
        playerSprite.src = state.player.sprite;
      }
      if (state.player.xpNext) {
        const xf = clamp2(state.player.xp / state.player.xpNext, 0, 1);
        $2("#playerXpFill").style.width = `${100 * xf}%`;
      }
    }
    if (state.enemy) {
      $2("#enemyName").textContent = state.enemy.name;
      $2("#enemyLevel").textContent = state.enemy.level;
      const ef = state.enemy.stats.hp / state.enemy.stats.maxHp;
      $2(
        "#enemyHpText"
      ).textContent = `${state.enemy.stats.hp}/${state.enemy.stats.maxHp}`;
      const eFill = $2("#enemyHpFill");
      eFill.style.width = `${100 * ef}%`;
      eFill.style.background = hpColor(ef);
      try {
        if (enemySprite.dataset.originalSrc !== state.enemy.sprite) {
          enemySprite.dataset.originalSrc = state.enemy.sprite;
          const trimmedSrc = await getTrimmedSprite(state.enemy.sprite);
          enemySprite.src = trimmedSrc;
        }
      } catch (error) {
        console.error("Failed to trim enemy sprite, using original:", error);
        enemySprite.src = state.enemy.sprite;
      }
    }
  }
  function floatTextNear(targetSelector, txt, good = false) {
    const host = document.querySelector(".screen");
    const target = document.querySelector(targetSelector);
    if (!target)
      return;
    const rect = target.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    const x = rect.left - hostRect.left + rect.width * 0.6;
    const y = rect.top - hostRect.top - 10;
    const d = el("div", { class: "float " + (good ? "good" : "bad") }, txt);
    d.style.left = `${x}px`;
    d.style.top = `${y}px`;
    host.appendChild(d);
    requestAnimationFrame(() => d.classList.add("show"));
    setTimeout(() => d.remove(), 900);
  }
  function screenShake(kind = "hit") {
    const root = document.querySelector(".screen");
    if (!root)
      return;
    const cls = kind === "crit" ? "shake-crit" : "shake-hit";
    root.classList.add(cls);
    setTimeout(() => root.classList.remove(cls), kind === "crit" ? 380 : 160);
  }
  function ensureVfx() {
    let host = document.getElementById("vfx");
    if (!host) {
      const s = document.querySelector(".screen");
      host = document.createElement("div");
      host.id = "vfx";
      host.className = "vfx";
      s && s.prepend(host);
    }
    return host;
  }
  var TYPE_COLOR = {
    normal: "#cfd8e3",
    fire: "#ff8a6b",
    water: "#7ecbff",
    grass: "#9fd99c",
    electric: "#ffe66d",
    ice: "#c7f9ff",
    fighting: "#ff9b85",
    poison: "#e0b3ff",
    ground: "#ffd39b",
    flying: "#d0e6ff",
    psychic: "#ff9aff",
    bug: "#d8f88a",
    rock: "#e8d8b5",
    ghost: "#d5c8ff",
    dragon: "#c0ccff"
  };
  function spawnSparksAt(selector, type = "normal", count = 10) {
    const host = ensureVfx();
    const tgt = document.querySelector(selector);
    if (!host || !tgt)
      return;
    const r = tgt.getBoundingClientRect();
    const h = host.getBoundingClientRect();
    const cx = r.left - h.left + r.width * 0.6;
    const cy = r.top - h.top + r.height * 0.45;
    for (let i = 0; i < count; i++) {
      const el2 = document.createElement("div");
      el2.className = "spark";
      el2.style.color = TYPE_COLOR[type] || TYPE_COLOR.normal;
      const ang = Math.random() * Math.PI * 2;
      const d0 = 4 + Math.random() * 8;
      const d1 = 24 + Math.random() * 20;
      el2.style.left = cx + "px";
      el2.style.top = cy + "px";
      el2.style.setProperty("--sx", Math.cos(ang) * d0 + "px");
      el2.style.setProperty("--sy", Math.sin(ang) * d0 + "px");
      el2.style.setProperty("--ex", Math.cos(ang) * d1 + "px");
      el2.style.setProperty("--ey", Math.sin(ang) * d1 + "px");
      host.appendChild(el2);
      setTimeout(() => el2.remove(), 420);
    }
  }
  function showBadgeNear(selector, text2) {
    const host = ensureVfx();
    const tgt = document.querySelector(selector);
    if (!host || !tgt)
      return;
    const r = tgt.getBoundingClientRect();
    const h = host.getBoundingClientRect();
    const x = r.left - h.left + r.width * 0.5;
    const y = r.top - h.top - 10;
    const el2 = document.createElement("div");
    el2.className = "badge";
    el2.textContent = text2;
    el2.style.left = x + "px";
    el2.style.top = y + "px";
    host.appendChild(el2);
    setTimeout(() => el2.remove(), 900);
  }
  function impactSprite(selector, crit = false, towardRight = true) {
    const el2 = document.querySelector(selector);
    if (!el2)
      return;
    const rot = (towardRight ? -1 : 1) * (crit ? 10 : 6);
    const dx = (towardRight ? 8 : -8) * (crit ? 1.5 : 1);
    const dur = crit ? 380 : 220;
    el2.animate(
      [
        {
          transform: "translate(0,0) rotate(0deg) scale(1)",
          filter: "brightness(2) saturate(0)"
        },
        {
          transform: `translate(${dx}px,-2px) rotate(${rot}deg) scale(${crit ? 1.06 : 1.02})`,
          filter: "brightness(1.3)",
          offset: 0.35
        },
        { transform: "translate(0,0) rotate(0deg) scale(1)", filter: "none" }
      ],
      { duration: dur, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
  }
  function faintOut(selector) {
    if (selector === "#enemySprite") {
      (window.state || (window.state = {})).enemyHidden = true;
    }
    const el2 = document.querySelector(selector);
    if (!el2)
      return Promise.resolve();
    return el2.animate(
      [
        { filter: "none", opacity: 1, transform: "translateY(0) scale(1)" },
        {
          filter: "brightness(2) saturate(0)",
          opacity: 0.9,
          transform: "translateY(2px) scale(.98)",
          offset: 0.4
        },
        {
          filter: "brightness(2) saturate(0)",
          opacity: 0,
          transform: "translateY(10px) scale(.94)"
        }
      ],
      { duration: 650, easing: "ease-in" }
    ).finished.then(() => {
      el2.style.opacity = "0";
    });
  }
  function captureRelease(selector) {
    const el2 = document.querySelector(selector);
    if (!el2)
      return;
    const dx = parseFloat(el2.dataset.capdx || "0"), dy = parseFloat(el2.dataset.capdy || "0");
    el2.style.opacity = "1";
    (window.state || (window.state = {})).enemyHidden = false;
    el2.animate(
      [
        {
          opacity: 1,
          transform: `translate(${dx}px,${dy}px) scale(0)`,
          filter: "brightness(2) saturate(0)"
        },
        {
          opacity: 1,
          transform: "translate(0,0) scale(1.02)",
          filter: "brightness(1.3)",
          offset: 0.6
        },
        { opacity: 1, transform: "translate(0,0) scale(1)", filter: "none" }
      ],
      { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
  }
  function canAct(mon) {
    const s = mon.status;
    if (s.cond === "slp") {
      if (s.turns > 0) {
        s.turns--;
        text(`${mon.name} is fast asleep...`);
        return false;
      }
      s.cond = "none";
      text(`${mon.name} woke up!`);
    }
    if (s.cond === "frz") {
      if (Math.random() < 0.2) {
        s.cond = "none";
        text(`${mon.name} thawed out!`);
      } else {
        text(`${mon.name} is frozen solid!`);
        return false;
      }
    }
    if (s.cond === "par" && Math.random() < 0.25) {
      text(`${mon.name} is paralyzed! It can't move!`);
      return false;
    }
    return true;
  }
  function endOfTurn(mon) {
    const s = mon.status;
    if (s.cond === "brn" || s.cond === "psn") {
      const dmg = Math.max(1, Math.floor(mon.stats.maxHp / 16));
      mon.stats.hp = clamp2(mon.stats.hp - dmg, 0, mon.stats.maxHp);
      updateHUD();
      floatTextNear(
        mon === state.player ? "#playerSprite" : "#enemySprite",
        `-${dmg}`,
        false
      );
      if (mon.stats.hp <= 0) {
        text(`${mon.name} fainted from ${s.cond === "brn" ? "burn" : "poison"}!`);
      }
    }
  }
  function applyAilment(target, ail) {
    if (!ail || ail === "none")
      return;
    const s = target.status;
    if (s.cond !== "none")
      return;
    const map = {
      burn: "brn",
      paralysis: "par",
      poison: "psn",
      sleep: "slp",
      freeze: "frz"
    };
    const c = map[ail];
    if (!c)
      return;
    s.cond = c;
    s.turns = c === "slp" ? 2 + Math.floor(Math.random() * 3) : 0;
    text(
      `${target.name} is ${c === "par" ? "paralyzed" : c === "psn" ? "poisoned" : c === "brn" ? "burned" : c === "frz" ? "frozen" : "asleep"}!`
    );
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
    function clear() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    let ballImagePromise;
    async function getBallImage() {
      if (ballImagePromise)
        return ballImagePromise;
      ballImagePromise = (async () => {
        const url = ITEM_ICON("poke-ball");
        try {
          let blobUrl = null;
          if (window.isSecureContext && "caches" in window) {
            const cache = await caches.open("poke-cache");
            let resp = await cache.match(url);
            if (!resp) {
              resp = await fetch(url, { mode: "cors" });
              if (resp.ok)
                cache.put(url, resp.clone());
            }
            if (resp && resp.ok) {
              const blob = await resp.blob();
              blobUrl = URL.createObjectURL(blob);
            }
          }
          const im = new Image();
          im.crossOrigin = "anonymous";
          im.src = blobUrl || url;
          await new Promise((r) => {
            im.onload = r;
            im.onerror = r;
          });
          return im.width ? im : null;
        } catch (e) {
          return null;
        }
      })();
      return ballImagePromise;
    }
    async function throwAndWobble(startX, startY, targetX, targetY, onHit) {
      if (!isMuted)
        new Audio("assets/sfx/battle/attack.wav").play();
      const r = 32;
      const arcMin = cssNum("--ball-arc-min", 60), arcMax = cssNum("--ball-arc-max", 140);
      const dx = targetX - startX, dy = targetY - startY;
      const dist = Math.hypot(dx, dy);
      const arc = clamp2(dist * 0.25, arcMin, arcMax);
      const img = await getBallImage();
      for (let t = 0; t <= 1.001; t += 0.02) {
        const ctrlX = (startX + targetX) / 2;
        const ctrlY = Math.max(30, Math.min(startY, targetY) - arc);
        const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ctrlX + t * t * targetX;
        const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * ctrlY + t * t * targetY;
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
      async function wobbleOnce() {
        for (let a = 0; a < 1; a += 0.1) {
          clear();
          ctx.save();
          ctx.translate(targetX, targetY);
          ctx.rotate(Math.sin(a * Math.PI * 2) * 0.35);
          if (img)
            ctx.drawImage(img, -r, -r, r * 2, r * 2);
          ctx.restore();
          await sleep(30);
        }
      }
      await wobbleOnce();
      return {
        async shake(times) {
          for (let i = 0; i < times; i++) {
            await wobbleOnce();
            await sleep(160);
          }
        },
        clear
      };
    }
    return { throwAndWobble, clear };
  }();
  var ThemeFX = (() => {
    const host = document.querySelector(".screen");
    if (!host)
      return { set: () => {
      } };
    const layer = document.createElement("div");
    layer.className = "themefx";
    host.prepend(layer);
    let current = "", intensity = 1;
    const CONFIG = {
      normal: {
        kind: "mote",
        count: 14,
        size: [4, 10],
        dur: [12, 18],
        blur: [0, 1]
      },
      fire: {
        kind: "ember",
        count: 18,
        size: [5, 12],
        dur: [10, 15],
        blur: [0, 1]
      },
      water: {
        kind: "bubble",
        count: 14,
        size: [6, 14],
        dur: [12, 18],
        blur: [0, 0]
      },
      grass: {
        kind: "leaf",
        count: 12,
        size: [8, 14],
        dur: [12, 18],
        blur: [0, 0]
      },
      electric: {
        kind: "spark",
        count: 10,
        size: [10, 16],
        dur: [8, 12],
        blur: [0, 0]
      },
      ice: {
        kind: "snow",
        count: 20,
        size: [4, 8],
        dur: [12, 20],
        blur: [0, 0.5]
      },
      fighting: {
        kind: "mote",
        count: 10,
        size: [4, 10],
        dur: [10, 16],
        blur: [0, 0]
      },
      poison: {
        kind: "fume",
        count: 12,
        size: [18, 28],
        dur: [14, 22],
        blur: [4, 8]
      },
      ground: {
        kind: "dust",
        count: 14,
        size: [6, 12],
        dur: [12, 18],
        blur: [1, 3]
      },
      flying: {
        kind: "feather",
        count: 8,
        size: [10, 18],
        dur: [16, 22],
        blur: [0, 0]
      },
      psychic: {
        kind: "orb",
        count: 8,
        size: [10, 16],
        dur: [10, 16],
        blur: [0, 0]
      },
      bug: {
        kind: "spore",
        count: 14,
        size: [5, 10],
        dur: [12, 18],
        blur: [0, 1]
      },
      rock: {
        kind: "grit",
        count: 12,
        size: [5, 8],
        dur: [10, 16],
        blur: [0, 0]
      },
      ghost: {
        kind: "wisp",
        count: 8,
        size: [16, 26],
        dur: [16, 22],
        blur: [4, 8]
      },
      dragon: {
        kind: "star",
        count: 10,
        size: [4, 8],
        dur: [16, 24],
        blur: [0, 0]
      }
    };
    function rand(a, b) {
      return a + Math.random() * (b - a);
    }
    function clear() {
      layer.innerHTML = "";
    }
    function spawn(kind, conf) {
      const el2 = document.createElement("div");
      el2.className = "p " + kind;
      const x = rand(5, 95).toFixed(2);
      const size = Math.round(rand(conf.size[0], conf.size[1]));
      const durNum = rand(conf.dur[0], conf.dur[1]);
      const dur = durNum.toFixed(2);
      const delay = (-rand(0, durNum)).toFixed(2);
      const dx = (Math.random() < 0.5 ? -1 : 1) * rand(4, 26);
      const blur = rand(conf.blur[0], conf.blur[1]).toFixed(1);
      el2.style.setProperty("--x", x);
      el2.style.setProperty("--size", `${size}px`);
      el2.style.setProperty("--dur", `${dur}s`);
      el2.style.setProperty("--delay", `${delay}s`);
      el2.style.setProperty("--dx", `${dx}px`);
      el2.style.setProperty("--blur", blur);
      if (kind === "orb") {
        el2.style.setProperty("--r", `${Math.round(rand(50, 120))}px`);
        el2.style.setProperty("--delay", `${rand(0, 6).toFixed(2)}s`);
      }
      layer.appendChild(el2);
    }
    function set(type) {
      if (!type)
        type = "normal";
      if (type === current)
        return;
      current = type;
      clear();
      const conf = CONFIG[type] || CONFIG.normal;
      const n = Math.round(conf.count * intensity);
      for (let i = 0; i < n; i++)
        spawn(conf.kind, conf);
    }
    function setIntensity(value = 1) {
      intensity = Math.max(0.25, Math.min(2, value));
      set(current);
    }
    set("normal");
    function burst(kind = CONFIG[current]?.kind || "mote", count = 8) {
      const temp = { size: [10, 16], dur: [4, 7], blur: [0, 1] };
      for (let i = 0; i < count; i++)
        spawn(kind, temp);
    }
    return { set, burst, setIntensity };
  })();
  function maybeAwardDrops() {
    if (Math.random() < 0.2) {
      const gained = Math.random() < 0.5 ? 1 : 2;
      state.items["poke-ball"] += gained;
      text(`You found ${gained} Pok\xE9 Ball${gained > 1 ? "s" : ""}!`);
    }
    if (Math.random() < 0.15) {
      const r = Math.random();
      const key = r < 0.6 ? "potion" : r < 0.9 ? "super-potion" : "hyper-potion";
      state.items[key]++;
      text(`You obtained a ${cap(key.replace(/-/g, " "))}!`);
    }
    if (Math.random() < 0.1) {
      const cures = [
        "antidote",
        "parlyz-heal",
        "awakening",
        "burn-heal",
        "ice-heal"
      ];
      const key = cures[Math.floor(Math.random() * cures.length)];
      state.items[key]++;
      text(`You found a ${cap(key.replace(/-/g, " "))}!`);
    }
  }
  async function startEncounter() {
    show("menu");
    let poke, mon, species;
    for (let tries = 0; tries < 10; tries++) {
      const enemyLevel = clamp2(3 + Math.floor(wins / 3), 3, 12);
      const eid = 1 + Math.floor(Math.random() * GEN1_MAX_ID);
      if (eid >= 144 && eid <= 151)
        continue;
      poke = await fetchPokemon(eid);
      const bst = poke.stats.reduce((a, s) => a + s.base_stat, 0);
      if (bst <= 330) {
        mon = makeMon(poke, enemyLevel);
        species = await fetchSpecies(eid);
        mon.capture_rate = species.capture_rate;
        break;
      }
    }
    if (!mon) {
      const enemyLevel = clamp2(3 + Math.floor(wins / 3), 3, 12);
      mon = makeMon(poke, enemyLevel);
      const sp = await fetchSpecies(poke.id);
      mon.capture_rate = sp.capture_rate;
    }
    mon.moves = await getGen1DamageMovesForPokemon(poke, mon.level);
    if (mon.moves.length === 0) {
      mon.moves = [
        {
          name: "Tackle",
          key: "tackle",
          power: 40,
          accuracy: 95,
          type: "normal",
          damage_class: "physical",
          pp: 35,
          ppLeft: 35
        }
      ];
    }
    state.enemy = mon;
    await updateHUD();
    const es = $2("#enemySprite");
    if (es) {
      es.style.transform = "none";
      delete es.dataset.capdx;
      delete es.dataset.capdy;
      es.style.opacity = 0;
      es.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 250,
        easing: "ease-in"
      }).onfinish = () => {
        es.style.opacity = 1;
      };
    }
    setThemeByType(mon.types);
    text("A wild Pok\xE9mon appeared!");
    await playCry(mon);
    maybeAuto();
  }
  async function chooseStarter(id) {
    const poke = await fetchPokemon(id);
    const mon = makeMon(poke, 5);
    const species = await fetchSpecies(id);
    mon.capture_rate = species.capture_rate;
    mon.moves = await getGen1DamageMovesForPokemon(poke, mon.level);
    if (mon.moves.length === 0) {
      mon.moves = [
        {
          name: "Tackle",
          key: "tackle",
          power: 40,
          accuracy: 95,
          type: "normal",
          damage_class: "physical",
          pp: 35,
          ppLeft: 35
        }
      ];
    }
    await setupGrowthAndEvo(mon, species);
    mon.sprite = mon.spriteBack || mon.spriteFront;
    state.party = [mon];
    setActive(0);
    await startEncounter();
  }
  function renderMoves() {
    const grid = $2("#movesGrid");
    grid.innerHTML = "";
    state.player.moves.forEach((mv, idx) => {
      const disabled = mv.ppLeft <= 0;
      const btn = document.createElement("button");
      btn.className = "move-btn";
      btn.disabled = disabled;
      btn.innerHTML = `<span>${mv.name}</span><span class="small">${cap(
        mv.type
      )} \u2022 Pow ${mv.power} \u2022 PP ${mv.ppLeft}/${mv.pp}</span>`;
      btn.addEventListener("click", () => useMove(idx));
      grid.appendChild(btn);
    });
  }
  function renderParty() {
    const list = $2("#partyList");
    list.innerHTML = "";
    state.party.forEach((m, idx) => {
      const f = m.stats.hp / m.stats.maxHp;
      const pct = Math.round(100 * f);
      const item = el("div", { class: "party-item" });
      item.innerHTML = `<div>${idx === state.active ? "\u2605 " : ""}${cap(
        m.name
      )} Lv ${m.level} \u2014 HP ${m.stats.hp}/${m.stats.maxHp}</div><div style="width:120px" class="hpbar"><div style="width:${pct}%; height:8px; background:${hpColor(
        f
      )}"></div></div>`;
      const b = el("button", {}, "Switch");
      b.disabled = idx === state.active || m.stats.hp <= 0;
      b.addEventListener("click", () => swapTo(idx));
      item.appendChild(b);
      list.appendChild(item);
    });
  }
  async function swapTo(idx) {
    if (state.busy)
      return;
    setBusy(true);
    if (idx === state.active) {
      setBusy(false);
      return;
    }
    const from = state.player;
    const to = state.party[idx];
    text(`${cap(from.name)}, come back! Go, ${cap(to.name)}!`);
    await sleep(500);
    setActive(idx);
    await sleep(400);
    await enemyTurn();
    show("menu");
    setBusy(false);
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
  async function useMove(i) {
    if (state.busy)
      return;
    setBusy(true);
    const actor = state.player;
    if (!canAct(actor)) {
      await sleep(600);
      await enemyTurn();
      setBusy(false);
      return;
    }
    const mv = actor.moves[i];
    if (mv.ppLeft <= 0) {
      text("No PP left for that move!");
      setBusy(false);
      return;
    }
    show("menu");
    text(`${actor.name} used ${mv.name}!`);
    await sleep(250);
    mv.ppLeft = Math.max(0, mv.ppLeft - 1);
    renderMoves();
    if (!rollHit(mv.accuracy)) {
      text("But it missed!");
      await sleep(400);
      await enemyTurn();
      setBusy(false);
      return;
    }
    playSfx(mv);
    const { dmg, eff, crit } = calcDamage(actor, state.enemy, mv);
    impactSprite("#enemySprite", crit, true);
    spawnSparksAt("#enemySprite", mv.type, crit ? 14 : 10);
    state.enemy.stats.hp = clamp2(
      state.enemy.stats.hp - dmg,
      0,
      state.enemy.stats.maxHp
    );
    updateHUD();
    let msg = `-${dmg}`;
    if (crit)
      msg += "!";
    floatTextNear("#enemySprite", msg, false);
    if (eff !== 1) {
      text(effText(eff));
      showBadgeNear("#enemySprite", eff > 1 ? "SUPER!" : eff < 1 ? "WEAK" : "");
      await sleep(350);
    }
    if (mv.ailment && mv.ailment !== "none" && Math.random() * 100 < (mv.ailment_chance || 0))
      applyAilment(state.enemy, mv.ailment);
    await sleep(300);
    if (state.enemy.stats.hp <= 0) {
      await playCry(state.enemy);
      await faintOut("#enemySprite");
      text(`The wild ${state.enemy.name} fainted!`);
      const xpGain = Math.max(
        1,
        Math.floor((state.enemy.base_exp || 64) * state.enemy.level / 7)
      );
      await gainXP(actor, xpGain);
      maybeAwardDrops();
      wins++;
      await sleep(800);
      await startEncounter();
      setBusy(false);
      return;
    }
    endOfTurn(state.enemy);
    if (state.enemy.stats.hp <= 0) {
      await playCry(state.enemy);
      text(`The wild ${state.enemy.name} fainted!`);
      const xpGain = Math.max(
        1,
        Math.floor((state.enemy.base_exp || 64) * state.enemy.level / 7)
      );
      await gainXP(actor, xpGain);
      maybeAwardDrops();
      wins++;
      await sleep(800);
      await startEncounter();
      setBusy(false);
      return;
    }
    await enemyTurn();
    setBusy(false);
  }
  async function enemyTurn() {
    const actor = state.enemy;
    if (!canAct(actor)) {
      await sleep(500);
      endOfTurn(state.player);
      if (state.player.stats.hp <= 0) {
        await playCry(state.player);
        await faintOut("#playerSprite");
        text(
          `${state.player.name} fainted... Sending you to the Pok\xE9mon Center.`
        );
        await sleep(900);
        state.player.stats.hp = state.player.stats.maxHp;
        wins = Math.max(0, wins - 1);
        await startEncounter();
      } else {
        text("What will you do?");
        maybeAuto();
      }
      return;
    }
    const mv = actor.moves[Math.floor(Math.random() * actor.moves.length)];
    text(`Enemy ${actor.name} used ${mv.name}!`);
    await sleep(250);
    if (!rollHit(mv.accuracy)) {
      text("It missed!");
      await sleep(300);
      endOfTurn(state.player);
      if (state.player.stats.hp <= 0) {
        await playCry(state.player);
        text(`${state.player.name} fainted...`);
        await sleep(900);
        state.player.stats.hp = state.player.stats.maxHp;
        wins = Math.max(0, wins - 1);
        await startEncounter();
      } else {
        text("What will you do?");
        maybeAuto();
      }
      return;
    }
    playSfx(mv);
    const { dmg, eff, crit } = calcDamage(actor, state.player, mv);
    impactSprite("#playerSprite", crit, false);
    spawnSparksAt("#playerSprite", mv.type, crit ? 14 : 10);
    screenShake(crit ? "crit" : "hit");
    state.player.stats.hp = clamp2(
      state.player.stats.hp - dmg,
      0,
      state.player.stats.maxHp
    );
    updateHUD();
    let msg = `-${dmg}`;
    if (crit)
      msg += "!";
    floatTextNear("#playerSprite", msg, true);
    if (eff !== 1) {
      text(effText(eff));
      await sleep(350);
    }
    if (mv.ailment && mv.ailment !== "none" && Math.random() * 100 < (mv.ailment_chance || 0))
      applyAilment(state.player, mv.ailment);
    await sleep(300);
    if (state.player.stats.hp <= 0) {
      await playCry(state.player);
      text(`${state.player.name} fainted... Sending you to the Pok\xE9mon Center.`);
      await sleep(900);
      state.player.stats.hp = state.player.stats.maxHp;
      wins = Math.max(0, wins - 1);
      await startEncounter();
      return;
    }
    endOfTurn(state.player);
    if (state.player.stats.hp <= 0) {
      await playCry(state.player);
      text(`${state.player.name} fainted... Sending you to the Pok\xE9mon Center.`);
      await sleep(900);
      state.player.stats.hp = state.player.stats.maxHp;
      wins = Math.max(0, wins - 1);
      await startEncounter();
      return;
    }
    text("What will you do?");
    maybeAuto();
  }
  function hasPotion() {
    return state.items["potion"] > 0 || state.items["super-potion"] > 0 || state.items["hyper-potion"] > 0;
  }
  function bestPotion() {
    const need = state.player.stats.maxHp - state.player.stats.hp;
    if (need <= 0)
      return null;
    const opts = [
      { k: "potion", heal: 20 },
      { k: "super-potion", heal: 50 },
      { k: "hyper-potion", heal: 200 }
    ];
    for (const o of opts) {
      if (state.items[o.k] > 0 && need <= o.heal)
        return o;
    }
    for (const o of opts.slice().reverse()) {
      if (state.items[o.k] > 0)
        return o;
    }
    return null;
  }
  async function usePotionKey(key) {
    if (state.busy)
      return;
    const map = { potion: 20, "super-potion": 50, "hyper-potion": 200 };
    const heal = map[key];
    if (!heal || state.items[key] <= 0) {
      text("No such potion.");
      await sleep(500);
      await enemyTurn();
      return;
    }
    if (state.player.stats.hp >= state.player.stats.maxHp) {
      text("It won't have any effect...");
      await sleep(500);
      await enemyTurn();
      return;
    }
    const got = Math.min(heal, state.player.stats.maxHp - state.player.stats.hp);
    state.player.stats.hp += got;
    state.items[key]--;
    updateHUD();
    text(`You used a ${cap(key.replace(/-/g, " "))}! Restored ${got} HP.`);
    floatTextNear("#playerSprite", `+${got}`, true);
    await sleep(500);
    await enemyTurn();
  }
  function canCure(key) {
    const s = state.player.status.cond;
    if (!s || s === "none")
      return false;
    const map = {
      antidote: "psn",
      "parlyz-heal": "par",
      awakening: "slp",
      "burn-heal": "brn",
      "ice-heal": "frz"
    };
    return map[key] === s;
  }
  async function useCureKey(key) {
    if (state.items[key] <= 0) {
      text("None left.");
      await sleep(500);
      await enemyTurn();
      return;
    }
    if (!canCure(key)) {
      text("It had no effect.");
      await sleep(500);
      await enemyTurn();
      return;
    }
    state.items[key]--;
    state.player.status = { cond: "none", turns: 0, toxic: false };
    text(`${cap(key.replace(/-/g, " "))} cured the status!`);
    await sleep(400);
    await enemyTurn();
  }
  function openBag() {
    if (state.busy)
      return;
    const box = $2("#msgBox");
    let view = $2("#bagView");
    if (!view) {
      view = el("div", { id: "bagView", class: "hidden" });
      box.appendChild(view);
    }
    view.innerHTML = "";
    const head = el("div", { class: "row between" });
    head.append(el("div", {}, "Bag"));
    const back = el("button", { id: "bagBackBtn", class: "small" }, "Back");
    back.onclick = () => {
      show("menu");
      text("What will you do?");
    };
    head.append(back);
    view.append(head);
    const grid = el("div", {
      id: "bagGrid",
      style: "display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;"
    });
    function card(key, label, action) {
      const count = state.items[key] || 0;
      const c = el("div", {
        class: "card",
        style: "display:flex;align-items:center;gap:10px;justify-content:space-between;"
      });
      const left = el("div", {});
      const img = el("img", {
        src: ITEM_ICON(key),
        width: 32,
        height: 32,
        alt: key
      });
      left.append(img);
      left.append(el("div", { class: "small" }, `${label}`));
      c.append(left);
      c.append(el("div", { class: "small" }, `x${count}`));
      const btn = el("button", {}, action === "ball" ? "Throw" : "Use");
      btn.disabled = count <= 0;
      btn.onclick = () => {
        if (action === "ball")
          throwBall();
        else if (["potion", "super-potion", "hyper-potion"].includes(key))
          usePotionKey(key);
        else
          useCureKey(key);
      };
      c.append(btn);
      grid.append(c);
    }
    card("poke-ball", "Pok\xE9 Ball", "ball");
    card("potion", "Potion");
    card("super-potion", "Super Potion");
    card("hyper-potion", "Hyper Potion");
    card("antidote", "Antidote");
    card("parlyz-heal", "Parlyz Heal");
    card("awakening", "Awakening");
    card("burn-heal", "Burn Heal");
    card("ice-heal", "Ice Heal");
    view.append(grid);
    show("bag");
    text("Choose an item.");
  }
  function openBoxes() {
    if (state.busy)
      return;
    const box = $2("#msgBox");
    let view = $2("#boxView");
    if (!view) {
      view = el("div", { id: "boxView", class: "hidden" });
      box.appendChild(view);
    }
    view.innerHTML = "";
    const head = el("div", { class: "row between" });
    head.append(el("div", {}, `Box \u2014 ${state.box.length} Pok\xE9mon`));
    const back = el("button", { id: "boxBackBtn", class: "small" }, "Back");
    back.onclick = () => {
      show("swap");
    };
    head.append(back);
    view.append(head);
    const list = el("div", {
      style: "display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;"
    });
    state.box.forEach((m, idx) => {
      const c = el("div", { class: "card" });
      c.innerHTML = `<div style="display:flex;align-items:center;gap:8px;justify-content:space-between"><div><img src="${m.spriteFront}" width="48" height="48"/> ${cap(m.name)} Lv ${m.level}</div></div>`;
      const b = el(
        "button",
        {},
        state.party.length < 6 ? "Add to party" : "Swap with active"
      );
      b.onclick = () => {
        if (state.party.length < 6) {
          state.party.push(m);
          state.box.splice(idx, 1);
          setActive(state.party.length - 1);
        } else {
          const old = state.party[state.active];
          state.party[state.active] = m;
          state.box[idx] = old;
          setActive(state.active);
        }
        renderParty();
        openBoxes();
      };
      c.append(b);
      list.append(c);
    });
    view.append(list);
    show("box");
  }
  async function throwBall() {
    if (state.busy)
      return;
    setBusy(true);
    if ((state.items["poke-ball"] || 0) <= 0) {
      text("No Pok\xE9 Balls left!");
      setBusy(false);
      return;
    }
    state.items["poke-ball"]--;
    text(`You threw a Pok\xE9 Ball! (x${state.items["poke-ball"]})`);
    const canvas = document.getElementById("fxCanvas");
    const cRect = canvas.getBoundingClientRect();
    const eRect = document.querySelector(".enemy .plate").getBoundingClientRect();
    const pRect = document.querySelector(".player .plate").getBoundingClientRect();
    const startX = 40;
    const startY = pRect.top + pRect.height * 0.1 - cRect.top;
    const targetX = eRect.left + eRect.width * 0.5 - cRect.left;
    const targetY = eRect.top + eRect.height * 0.1 - cRect.top;
    const enemyImg = document.getElementById("enemySprite");
    try {
      const handle = await fx.throwAndWobble(
        startX,
        startY,
        targetX,
        targetY,
        () => {
          enemyImg.style.opacity = "0";
        }
      );
      const success = catchSuccess(state.enemy);
      const shakes = success ? 3 : Math.floor(Math.random() * 2);
      await handle.shake(shakes);
      if (success) {
        if (!isMuted)
          new Audio("assets/sfx/battle/attack.wav").play();
        text(`Gotcha! ${state.enemy.name} was caught!`);
        const data = await fetchPokemon(state.enemy.id);
        const species = await fetchSpecies(state.enemy.id);
        const mon = makeMon(data, state.enemy.level);
        mon.moves = await getGen1DamageMovesForPokemon(data, mon.level);
        mon.capture_rate = species.capture_rate;
        await setupGrowthAndEvo(mon, species);
        mon.sprite = mon.spriteFront;
        if (state.party.length < 6) {
          state.party.push(mon);
        } else {
          state.box.push(mon);
          text(`${cap(mon.name)} was sent to the Box!`);
        }
        maybeAwardDrops();
        await sleep(1100);
        handle.clear();
        await startEncounter();
      } else {
        handle.clear();
        captureRelease("#enemySprite");
        text(`The ${state.enemy.name} escaped!`);
        await sleep(600);
        await enemyTurn();
      }
    } catch (err) {
      console.error("Ball FX error:", err);
      enemyImg.style.opacity = "1";
      text("The ball fizzled\u2026");
      await sleep(500);
    }
    setBusy(false);
  }
  (function initUI() {
    ["#catchBtn", "#potionBtn"].forEach((sel) => {
      const e = $2(sel);
      if (e)
        e.style.display = "none";
    });
    const bag = $2("#ballInfoBtn");
    if (bag) {
      bag.textContent = "BAG";
      bag.onclick = () => {
        if (state.busy)
          return;
        openBag();
      };
    }
    const menu = $2("#menu .choices");
    if (menu && !$2("#autoToggle")) {
      const lab = el("label", {
        class: "small",
        style: "display:flex; align-items:center; gap:6px;"
      });
      const cb = el("input", { type: "checkbox", id: "autoToggle" });
      cb.onchange = () => {
        state.auto = cb.checked;
        if (state.auto)
          maybeAuto();
      };
      lab.append(cb);
      lab.append(document.createTextNode("Auto play"));
      menu.append(lab);
    }
    const swapHead = $2("#swapView .row.between");
    if (swapHead && !$2("#boxOpenBtn")) {
      const b = el("button", { id: "boxOpenBtn", class: "small" }, "Boxes");
      b.onclick = () => openBoxes();
      swapHead.insertBefore(b, swapHead.lastElementChild);
    }
  })();
  function bestMove(attacker, defender) {
    let pick = null;
    let score = -1;
    attacker.moves.forEach((m, idx) => {
      if (m.ppLeft <= 0)
        return;
      const eff = typeEffect(m.type, defender.types);
      const stab = attacker.types.includes(m.type) ? 1.5 : 1;
      const ppFactor = m.pp > 0 ? m.ppLeft / m.pp : 0;
      const sc = (m.power || 0) * eff * stab * (m.accuracy || 100) * ppFactor / 100;
      if (sc > score) {
        score = sc;
        pick = idx;
      }
    });
    return pick;
  }
  function battleScore(mon, enemy) {
    let maxMoveScore = 0;
    let totalPP = 0;
    let totalPPLeft = 0;
    mon.moves.forEach((m) => {
      totalPP += m.pp || 0;
      totalPPLeft += m.ppLeft || 0;
      if (m.ppLeft <= 0)
        return;
      const eff = typeEffect(m.type, enemy.types);
      const stab = mon.types.includes(m.type) ? 1.5 : 1;
      const ppFactor = m.pp > 0 ? m.ppLeft / m.pp : 0;
      const mScore = (m.power || 0) * eff * stab * (m.accuracy || 100) * ppFactor / 100;
      if (mScore > maxMoveScore)
        maxMoveScore = mScore;
    });
    if (maxMoveScore <= 0)
      return 0;
    const ppFactorOverall = totalPP > 0 ? totalPPLeft / totalPP : 0;
    let defScore = 0;
    let moveCount = 0;
    enemy.moves.forEach((em) => {
      if (em.ppLeft <= 0)
        return;
      defScore += typeEffect(em.type, mon.types);
      moveCount++;
    });
    defScore = moveCount > 0 ? defScore / moveCount : 1;
    const defFactor = 1 / defScore;
    const hpFactor = mon.stats.hp / mon.stats.maxHp;
    const levelFactor = enemy.level ? Math.max(0.5, Math.min(2, mon.level / enemy.level)) : 1;
    return maxMoveScore * defFactor * hpFactor * ppFactorOverall * levelFactor;
  }
  function bestSwitch(enemy, currentScore, threshold = 1.5) {
    let bestIdx = null;
    let bestScore = currentScore * threshold;
    state.party.forEach((mon, idx) => {
      if (mon.stats.hp <= 0 || idx === state.active)
        return;
      const score = battleScore(mon, enemy);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }
  async function autoSwitch(toIdx) {
    if (state.busy || toIdx === state.active)
      return;
    setBusy(true);
    const oldName = cap(state.player.name);
    const newName = cap(state.party[toIdx].name);
    text(`Come back, ${oldName}!`);
    await sleep(800);
    setActive(toIdx);
    updateHUD();
    text(`Go, ${newName}!`);
    await sleep(800);
    await enemyTurn();
    setBusy(false);
  }
  async function maybeAuto() {
    if (!state.auto || state.busy)
      return;
    await sleep(450);
    const hpF = state.player.stats.hp / state.player.stats.maxHp;
    const enemyHpF = state.enemy.stats.hp / state.enemy.stats.maxHp;
    if (hpF < 0.35 && hasPotion()) {
      const p = bestPotion();
      if (p) {
        await usePotionKey(p.k);
        await sleep(500);
        return;
      }
    }
    if ((state.items["poke-ball"] || 0) > 0 && (enemyHpF < 0.3 || ["slp", "frz", "par"].includes(state.enemy.status.cond))) {
      await throwBall();
      await sleep(400);
      return;
    }
    const curScore = battleScore(state.player, state.enemy);
    if (hpF < 0.3) {
      const switchIdxLow = bestSwitch(state.enemy, curScore, 1.1);
      if (switchIdxLow != null) {
        text("Auto: Preserving low HP mon\u2026");
        await autoSwitch(switchIdxLow);
        await sleep(400);
        return;
      }
    }
    const switchIdx = bestSwitch(state.enemy, curScore, 1.5);
    if (switchIdx != null) {
      text("Auto: Switching to a better matchup\u2026");
      await autoSwitch(switchIdx);
      await sleep(400);
      return;
    }
    const moveIdx = bestMove(state.player, state.enemy);
    if (moveIdx != null) {
      await useMove(moveIdx);
      await sleep(400);
      return;
    }
    const backupSwitch = bestSwitch(state.enemy, curScore, 1.1);
    if (backupSwitch != null) {
      text("Auto: Switching to available option\u2026");
      await autoSwitch(backupSwitch);
      await sleep(400);
      return;
    }
    text("Auto: No viable moves, no healthy switch \u2014 running.");
    await sleep(350);
    await startEncounter();
  }
  $2("#fightBtn").addEventListener("click", () => {
    if (state.busy)
      return;
    renderMoves();
    show("moves");
  });
  $2("#ballInfoBtn").addEventListener("click", () => {
    if (state.busy)
      return;
    openBag();
  });
  $2("#swapBtn").addEventListener("click", () => {
    if (state.busy)
      return;
    renderParty();
    show("swap");
  });
  $2("#runBtn").addEventListener("click", async () => {
    if (state.busy)
      return;
    text("Got away safely!");
    await sleep(500);
    await startEncounter();
  });
  $2("#backBtn").addEventListener("click", () => {
    if (state.busy)
      return;
    show("menu");
    text("What will you do?");
  });
  $2("#swapBackBtn").addEventListener("click", () => {
    if (state.busy)
      return;
    show("menu");
    text("What will you do?");
  });
  $2("#starterPick").addEventListener("click", (e) => {
    const id = e.target?.dataset?.starter;
    if (!id || state.busy)
      return;
    show("menu");
    chooseStarter(id);
  });
  function autoLoopTick() {
    if (state.auto)
      maybeAuto();
  }
  setInterval(autoLoopTick, 1e3);
  initAudio();
})();
