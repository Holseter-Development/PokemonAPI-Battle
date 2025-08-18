function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export const CHART = {
  normal: { rock: 0.5, ghost: 0 },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
  },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
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
    dragon: 0.5,
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    ice: 0.5,
    grass: 2,
    ground: 2,
    flying: 2,
    dragon: 2,
  },
  fighting: {
    normal: 2,
    ice: 2,
    rock: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    ghost: 0,
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
    ghost: 0.5,
  },
  rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5 },
  ghost: { ghost: 2, normal: 0, psychic: 0 },
  dragon: { dragon: 2 },
};

export function typeEffect(moveType, targetTypes) {
  let mult = 1;
  const row = CHART[moveType] || {};
  for (const t of targetTypes) {
    mult *= row[t] ?? 1;
  }
  return mult;
}

export function rollHit(acc) {
  const a = acc ?? 100;
  return Math.random() * 100 < a;
}

export function rollCrit(attacker, move) {
  let base = clamp(attacker.stats.spd / 512, 0.02, 0.25);
  if (move.highCrit) base = clamp(base * 2, 0.02, 0.33);
  return Math.random() < base;
}

export function calcDamage(attacker, defender, move) {
  const level = attacker.level;
  let atkStat =
    move.damage_class === "special" ? attacker.stats.spa : attacker.stats.atk;
  const defStat =
    move.damage_class === "special" ? defender.stats.spd : defender.stats.def;
  if (move.damage_class !== "special" && attacker.status.cond === "brn") {
    atkStat = Math.max(1, Math.floor(atkStat * 0.5));
  }
  const eff = typeEffect(move.type, defender.types);
  const base = Math.floor(
    Math.floor(
      (Math.floor((2 * level) / 5 + 2) *
        move.power *
        (atkStat / Math.max(1, defStat))) /
        50
    ) + 2
  );
  const rand = 0.85 + Math.random() * 0.15;
  const stab = attacker.types.includes(move.type) ? 1.2 : 1.0;
  let dmg = Math.max(1, Math.floor(base * rand * stab * eff));
  const crit = rollCrit(attacker, move);
  if (crit) dmg = Math.floor(dmg * 2);
  return { dmg, eff, crit };
}

export function catchSuccess(mon) {
  const maxHP = mon.stats.maxHp,
    curHP = mon.stats.hp,
    rate = mon.capture_rate || 45;
  let a = ((3 * maxHP - 2 * curHP) * rate) / (3 * maxHP);
  const s = mon.status.cond;
  if (s === "slp" || s === "frz") a *= 2.0;
  else if (s === "par" || s === "psn" || s === "brn") a *= 1.5;
  const chance = a / 256;
  return Math.random() < chance;
}
