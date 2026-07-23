// pokedex.js — small local Gen-1 index used by the Pokédex UI. Keeping names
// local avoids making 151 API requests merely to render the collection grid.

export const GEN1_NAMES = [
  "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard",
  "Squirtle", "Wartortle", "Blastoise", "Caterpie", "Metapod", "Butterfree",
  "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot",
  "Rattata", "Raticate", "Spearow", "Fearow", "Ekans", "Arbok", "Pikachu",
  "Raichu", "Sandshrew", "Sandslash", "Nidoran♀", "Nidorina", "Nidoqueen",
  "Nidoran♂", "Nidorino", "Nidoking", "Clefairy", "Clefable", "Vulpix",
  "Ninetales", "Jigglypuff", "Wigglytuff", "Zubat", "Golbat", "Oddish", "Gloom",
  "Vileplume", "Paras", "Parasect", "Venonat", "Venomoth", "Diglett", "Dugtrio",
  "Meowth", "Persian", "Psyduck", "Golduck", "Mankey", "Primeape", "Growlithe",
  "Arcanine", "Poliwag", "Poliwhirl", "Poliwrath", "Abra", "Kadabra", "Alakazam",
  "Machop", "Machoke", "Machamp", "Bellsprout", "Weepinbell", "Victreebel",
  "Tentacool", "Tentacruel", "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash",
  "Slowpoke", "Slowbro", "Magnemite", "Magneton", "Farfetch'd", "Doduo", "Dodrio",
  "Seel", "Dewgong", "Grimer", "Muk", "Shellder", "Cloyster", "Gastly", "Haunter",
  "Gengar", "Onix", "Drowzee", "Hypno", "Krabby", "Kingler", "Voltorb",
  "Electrode", "Exeggcute", "Exeggutor", "Cubone", "Marowak", "Hitmonlee",
  "Hitmonchan", "Lickitung", "Koffing", "Weezing", "Rhyhorn", "Rhydon", "Chansey",
  "Tangela", "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu",
  "Starmie", "Mr. Mime", "Scyther", "Jynx", "Electabuzz", "Magmar", "Pinsir",
  "Tauros", "Magikarp", "Gyarados", "Lapras", "Ditto", "Eevee", "Vaporeon",
  "Jolteon", "Flareon", "Porygon", "Omanyte", "Omastar", "Kabuto", "Kabutops",
  "Aerodactyl", "Snorlax", "Articuno", "Zapdos", "Moltres", "Dratini",
  "Dragonair", "Dragonite", "Mewtwo", "Mew",
];

export const DEX_FILTERS = ["all", "seen", "caught", "missing", "shiny"];

export function dexName(id) {
  return GEN1_NAMES[Number(id) - 1] || `Pokémon #${String(id).padStart(3, "0")}`;
}

export function dexNumber(id) {
  return `#${String(Number(id) || 0).padStart(3, "0")}`;
}

export function dexSpriteUrl(id, shiny = false) {
  const folder = shiny ? "pokemon/shiny" : "pokemon";
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/${folder}/${Number(id)}.png`;
}

export function dexEntryState(profile, id) {
  const n = Number(id);
  const seen = new Set(profile?.seen || []);
  const caught = new Set(profile?.caught || []);
  const shinyCaught = new Set(profile?.shinyCaught || []);
  return {
    id: n,
    name: dexName(n),
    seen: seen.has(n) || caught.has(n) || shinyCaught.has(n),
    caught: caught.has(n) || shinyCaught.has(n),
    shiny: shinyCaught.has(n),
  };
}

export function filteredDexIds(profile, filter = "all") {
  const selected = DEX_FILTERS.includes(filter) ? filter : "all";
  const ids = Array.from({ length: GEN1_NAMES.length }, (_, index) => index + 1);
  if (selected === "all") return ids;
  return ids.filter((id) => {
    const state = dexEntryState(profile, id);
    if (selected === "seen") return state.seen;
    if (selected === "caught") return state.caught;
    if (selected === "missing") return !state.caught;
    if (selected === "shiny") return state.shiny;
    return true;
  });
}
