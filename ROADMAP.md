# PokéBattle Arena — Updated Product and Implementation Roadmap

Last updated: 2026-07-24

## 1. Purpose

This roadmap turns the current game into a replayable, local-first Pokémon
roguelite with meaningful account progression.

It is written as a sequence of independently shippable chunks. A future task
can refer to a chunk by ID (for example, `P1.2`) and complete it without needing
to implement the rest of the milestone.

The primary single-player mode is the existing branching **Expedition**:

1. Choose a starter.
2. Travel through a seeded, branching map.
3. Catch and develop a team.
4. Choose between wild battles, shops, rest sites, and mystery events.
5. Defeat regional bosses and the Champion.
6. Earn permanent account progress and begin a stronger future run.

The fixed eight-Gym campaign described in the original concept is not the
current primary mode. The project has chosen the roguelite variant instead.
The eight Gym definitions remain useful as a rotating boss pool. A separate
traditional campaign can be reconsidered after the Expedition loop is mature.

## 2. Current Baseline

The following systems are already implemented and should be preserved:

- Seeded branching map generation with three regions.
- Wild, Elite, Shop, Rest, Mystery, and Champion nodes.
- Two rotating regional Gym bosses and a final Champion.
- Champion victory and whole-party wipe endings.
- Static trainer artwork with cinematic Gym/Champion entrances and persistent
  opponent badges during trainer battles.
- Catching, a six-member party, storage box, leveling, and level evolution.
- Run inventory with balls, medicine, status cures, and gold.
- Poké Mart stock with consumables, mutations, and Sigils.
- Mystery events and run reward drafts.
- Pokémon Mutations and run-wide Sigils.
- Weather-like Sigil effects and several battle-engine modifiers.
- Persistent Fragments, expedition win count, and an ascended Pokémon Vault.
- A complete Gen 1 Pokédex overlay with seen, caught, missing, and shiny filters.
- Data-driven Pokédex milestone perks, including bonus starters and run bonuses.
- A Fragment Lab with five permanent, stacking account upgrades.
- Save/continue for active Expeditions.
- Seedable RNG utilities and pure battle/run modules.
- Engine, roguelike, DOM, and Expedition smoke tests.

Important gaps in the baseline:

- The `ascension` and `startingSigils` fields are scaffolding, not a player flow.
- Account statistics exist in data but do not yet have a Trainer Profile screen.
- Active foreground playtime is not yet tracked.
- Region names and backgrounds do not affect encounters.
- Wild encounters and some mystery outcomes still use `Math.random()`.
- Shinies are not represented.
- The Champion is called the rival, but there is no recurring rival system.
- The eight Gym definitions do not form a playable eight-badge ladder.
- The Move Tutor event restores PP instead of teaching a move.
- Held items, TMs, stones, daily challenges, achievements, and challenge modes
  are not implemented.

## 3. Delivery Rules

Every chunk should follow these rules:

1. **Preserve old saves.** Persistent schema changes require normalization or
   migration with safe defaults.
2. **Keep game rules pure where practical.** New progression, encounter, item,
   and scoring rules should live outside `main.js` and be unit-testable.
3. **Use the run RNG for run-affecting rolls.** A saved seed and RNG state must
   reproduce encounters, rewards, and events.
4. **Do not require hundreds of API requests to render a screen.** Use known
   sprite URLs, cached data, and lazy loading.
5. **Ship vertical slices.** A chunk is complete only when its data, logic, UI,
   persistence, and relevant tests work together.
6. **Keep mobile behavior intact.** New screens and panels must work at the
   existing narrow viewport breakpoints.
7. **Avoid silent currencies or statistics.** If the UI shows a reward, the
   player must have a way to use or inspect it.

### Chunk sizes

- **S** — localized data or logic change with a small UI hook.
- **M** — one complete cross-cutting feature.
- **L** — engine or game-flow work that should be split further if it grows.

## 4. Milestone Order

| Milestone | Goal | Exit condition |
| --- | --- | --- |
| P1 — Persistent Purpose | Every run advances a visible account goal | Pokédex, profile, perks, and Fragment spending work |
| P2 — Places and Surprise | Regions materially change encounters | Seeded biome tables, shinies, Alpha battles, and rival work |
| P3 — Team-Building Depth | Pokémon have deliberate builds | Held items, TMs, relearning, and stones work |
| P4 — Replay and Challenge | Finished players have reasons to return | Results, daily runs, achievements, modes, and New Game+ work |
| P5 — Advanced Encounters | Expand beyond one-versus-one battles | Horde and double-battle engine paths are stable |

---

# P1 — Persistent Purpose

This is the next milestone. It completes the missing persistent portion of the
original Phase 1 before more combat features are added.

## P1.1 — Versioned progression model

**Size:** S  
**Dependencies:** none  
**Primary files:** new `src/progression.js`, `src/main.js`, new tests

Create a normalized account-level model instead of growing ad hoc properties in
`main.js`.

### Data model

```js
{
  version: 2,
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
}
```

Store ID collections as sorted unique arrays in localStorage. Convert to `Set`
only while operating on them in memory.

### Work

- Add `defaultProgression()` and `normalizeProgression(raw)`.
- Migrate the existing `pkbattle:meta:v1` data without losing Fragments or wins.
- Keep unknown future fields when safe.
- Record an Expedition start once, not once per continue.
- Update best depth when a node resolves and streaks when a run ends.
- Add pure helpers for unique ID registration and derived completion counts.

### Done when

- A fresh profile receives all defaults.
- An old `{ fragments, expeditionsWon }` save loads correctly.
- Invalid or duplicated Pokédex IDs are removed.
- IDs outside Gen 1's `1–151` range are ignored.
- Unit tests cover fresh, legacy, malformed, and round-trip data.

## P1.2 — Seen and caught tracking

**Size:** S  
**Dependencies:** P1.1  
**Primary files:** `src/progression.js`, `src/main.js`

### Rules

- Register a Pokémon as **seen** when it is first sent into battle.
- This includes wild Pokémon, Gym teams, the rival, and the Champion.
- Register a Pokémon as **caught** when it becomes player-owned.
- A chosen starter and event-granted Pokémon count as caught.
- Caught always implies seen.
- Evolution registers the evolved species as both seen and caught.
- Loading an old party, box, or Vault should backfill caught entries once.

### Feedback

- The first sighting may show a small `Registered in Pokédex` toast.
- The first capture should show the updated caught total.
- Duplicate sightings should not produce repeated feedback.

### Done when

- Seen/caught progress survives a lost run, a won run, and a page reload.
- Catching or evolving the same species twice does not inflate totals.
- Boss Pokémon register as seen without becoming caught.
- Integration tests cover starter selection, wild sighting, capture, and
  evolution registration.

## P1.3 — Pokédex screen

**Size:** M  
**Dependencies:** P1.2  
**Primary files:** `index.html`, `style.css`, `src/main.js`

Add a title-screen entry and reusable overlay for the Gen 1 Pokédex.

### Minimum UI

- Summary: `Seen X / 151`, `Caught Y / 151`, and shiny count.
- A 151-entry grid ordered by National Dex number.
- States:
  - Unseen: number and silhouette/placeholder.
  - Seen: name and desaturated sprite.
  - Caught: full-color sprite and caught marker.
  - Shiny caught: sparkle marker and shiny sprite where available.
- Filters for All, Seen, Caught, Missing, and Shiny.
- A detail panel containing name, number, types, first-caught status, and sprite.

### Performance constraints

- Do not fetch all 151 Pokémon records on open.
- Use predictable PokeAPI sprite URLs for grid thumbnails.
- Fetch details lazily only when a registered entry is selected.
- Use existing cache behavior for fetched details.

### Done when

- The screen works before, during, and after an Expedition.
- Keyboard focus is contained and returned correctly.
- The grid remains usable on mobile.
- DOM smoke tests cover opening, filtering, and closing.

## P1.4 — Pokédex milestone perks

**Size:** M  
**Dependencies:** P1.2  
**Primary files:** `src/progression.js`, `src/run.js`, `src/main.js`

Add automatic rewards so Pokédex progress affects later runs.

### Initial reward table

These values are a starting balance and should remain data-driven:

| Requirement | Reward |
| --- | --- |
| See 25 | Explorer Grant: start with 40 gold |
| Catch 10 | Ball Belt: start with 1 extra Poké Ball |
| Catch 25 | Unlock Pikachu as a starter |
| Catch 50 | Catching Insight: 5% catch-chance multiplier |
| Catch 75 | Unlock Eevee as a starter |
| Catch 100 | Merchant License: 10% more battle gold |
| Catch 151 | Master Researcher badge and upgraded Shiny Charm |

### Rules

- Unlocks are permanent and idempotent.
- Newly earned rewards receive a one-time modal or toast.
- Derived perks are calculated by a pure `progressionEffects(profile)` helper.
- The run snapshots starting perks so mid-run unlocks cannot unpredictably
  alter an active run.
- Catch multipliers must remain capped below guaranteed capture unless another
  explicit effect guarantees it.

### Done when

- Each threshold unlocks exactly once.
- Pikachu and Eevee appear only after their requirements are met.
- Starting money, balls, catch bonus, and gold bonus affect real gameplay.
- Tests cover the value immediately below, at, and above every threshold.

## P1.5 — Fragment upgrade shop

**Size:** M  
**Dependencies:** P1.1  
**Primary files:** `src/progression.js`, `index.html`, `style.css`, `src/main.js`

Give the existing Fragment currency a permanent use.

### First upgrade set

| Upgrade | Cost | Effect |
| --- | ---: | --- |
| Field Kit I | 75 | Start each run with 1 extra Potion |
| Ball Satchel I | 100 | Start each run with 1 extra Poké Ball |
| Travel Fund I | 150 | Start each run with 50 extra gold |
| Field Kit II | 225 | Upgrade the extra Potion to a Super Potion |
| Ball Satchel II | 300 | Start with a second extra Poké Ball |

Level II requires Level I. Costs and effects must be declared in data rather
than embedded in button handlers.

### Rules

- Purchases require confirmation.
- Fragments cannot go negative.
- Purchased upgrades are permanent.
- Pokédex perks and purchased upgrades stack through one normalized effects
  object.
- The UI previews the exact resulting run bonus.

### Done when

- A player can earn, inspect, spend, and benefit from Fragments.
- Reloading preserves purchases and balances.
- Failed or repeated purchases do not deduct currency.
- Unit and DOM tests cover locked, affordable, purchased, and maxed states.

## P1.6 — Trainer profile and run history summary

**Size:** M  
**Dependencies:** P1.1  
**Primary files:** `index.html`, `style.css`, `src/main.js`

Add a home for account identity and progress.

### Display

- Expeditions started and won.
- Win rate.
- Current and best win streak.
- Best depth.
- Total playtime.
- Pokédex completion.
- Shiny catches.
- Vault size.
- Purchased upgrades and major achievements.

### Playtime rules

- Count active foreground play only.
- Flush accumulated time on visibility change and before unload when possible.
- Do not increment while the title page sits hidden in a background tab.

### Done when

- Statistics update after both victory and defeat.
- Playtime does not jump after a long suspended/background period.
- Legacy saves show sensible zero/default values.

### P1 milestone exit gate

- The player can explain what persists after a run.
- Pokédex progress has visible rewards.
- Fragments have a spending path.
- Old saves still work.
- All existing tests plus the new progression tests pass.

---

# P2 — Places and Surprise

This milestone makes the map mechanically meaningful instead of primarily
visual.

## P2.1 — Encounter catalog and biome tables

**Size:** M  
**Dependencies:** P1 complete  
**Primary files:** new `src/encounters.js`, `src/run.js`, tests

Create pure, data-driven encounter tables.

### Initial biomes

| Region | Theme | Common examples | Rare examples |
| --- | --- | --- | --- |
| 1 | Viridian Wilds | Caterpie, Weedle, Pidgey, Rattata, Nidoran | Pikachu, Bulbasaur |
| 2 | Crimson Highlands | Geodude, Machop, Growlithe, Ponyta, Cubone | Onix, Charmander |
| 3 | Indigo Summit | Gastly, Magnemite, Rhyhorn, Seel, Dratini | Lapras, Eevee |

Tables should use Pokémon IDs, weights, minimum depth, maximum depth, and tags.
Final contents can be tuned without changing picker logic.

### Work

- Add `encounterTableFor(node, run)` and `pickEncounter(rng, table)`.
- Add table validation for valid IDs, positive weights, and reachable entries.
- Pass the selected node/region into wild generation.
- Keep the opening encounter matchup assistance as a documented first-node
  override, not an unrelated global random rule.
- Remove the global `1–151` wild picker after tables cover every route.

### Done when

- Two different regions produce measurably different encounter pools.
- The same seed and path produce the same species.
- Every route has at least one encounter valid at its depth.
- Legendary IDs remain excluded unless explicitly listed as special encounters.

**Status:** Complete. `src/encounters.js` holds three region-keyed biome tables
(Viridian Wilds, Crimson Highlands, Indigo Summit) with weighted, depth-gated
entries; `encounterTableFor(node, run)` and `pickEncounter(rng, table, depth)`
draw wild species through the run RNG, replacing the global 1–151 roll. The
first battle keeps a documented starter-matchup override. `validateBiomes()`
and `test/encounters.test.js` cover id/weight/legendary validity, per-region
pool separation, depth gating, and seeded reproducibility.

## P2.2 — Deterministic controller rolls

**Size:** M  
**Dependencies:** P2.1  
**Primary files:** `src/run.js`, `src/main.js`, tests

Move all run-affecting randomness onto `withRng`.

### Replace `Math.random()` for

- Wild species and rarity.
- Mystery coin flips.
- Wishing Well outcomes and gold.
- Shrine victim/stat selection.
- Event recruitment.
- Boss selection and rival team variation.
- Shiny and Alpha rolls.

Battle accuracy, damage, critical hits, status rolls, and AI ties can remain on a
separate battle stream until Daily Challenges require complete replayability.

### Done when

- Identical run state plus identical choice produces the same outcome.
- Save/continue does not reroll a pending deterministic choice.
- Tests exercise every mystery outcome through controlled RNG.
- No run-resolution branch in `main.js` uses `Math.random()`.

**Status:** Complete. The remaining run-affecting rolls now draw from the run RNG
through three pure resolvers in `src/run.js` — `resolveCoinflip` (the Gambler),
`resolveWishingWell` (gold/mutation/nothing + gold amount), and
`resolveShrineScar` (victim + stat). `applyEventEffect` consumes them, so a seed
plus path reproduces every Mystery outcome and a save/continue mid-node no longer
rerolls a pending result. Wild species, boss selection, event recruitment, and
reward drafts were already deterministic; battle accuracy/damage/crit and the
catch shake stay on the separate battle stream per the note above. New
`rogue.test.js` cases cover determinism, reachable outcomes, value ranges, and
the reload-does-not-reroll guarantee.

This chunk also fixed a Mystery-readability bug: node outcomes were narrated
through the battle text box (`say()`), which sits at `z-index: 5` behind the
opaque map overlay (`z-index: 20`) — so results were rendered completely hidden
and appeared to "end instantly." Mystery, Rest, and Wishing-Well/Shrine outcomes
now surface in the modal (`showOutcome`) with a **Continue** button the player
dismisses at their own pace.

## P2.3 — Shinies

**Size:** S/M  
**Dependencies:** P2.2, P1.2  
**Primary files:** `src/api.js`, `src/progression.js`, `src/roster.js`,
`src/main.js`

### Rules

- Base wild shiny chance: `1 / 512` for the shorter roguelite format.
- Champion reward unlocks a Shiny Charm: `1 / 256`.
- Catching all 151 upgrades it to `1 / 128`.
- Boss teams are not shiny unless a specific authored encounter says so.
- `isShiny` is stored on the Pokémon and survives party, box, evolution, Vault,
  save/load, and roster snapshots.

### UI

- Use PokeAPI shiny front/back sprites with normal-sprite fallback.
- Add a sparkle entrance effect and shiny battle label.
- Record shiny species in `shinyCaught`.
- Show shiny state in party, box, Vault, results, and Pokédex.

### Done when

- Forced test rolls reliably produce normal and shiny encounters.
- Shiny identity survives evolution and reload.
- Missing shiny sprite data falls back safely.

## P2.4 — Alpha encounters

**Size:** M  
**Dependencies:** P2.1, P2.2  
**Primary files:** `src/encounters.js`, `src/run.js`, `src/main.js`

Implement Alpha battles before hordes or doubles because they fit the existing
one-versus-one engine.

### Rules

- A small seeded chance converts a normal battle node into an Alpha encounter.
- Alpha Pokémon are 2 levels above the route target, capped at level 100.
- They receive one visible temporary battle modifier, not hidden stat cheating.
- They have a lower catch rate while the modifier is active.
- Defeating or catching one grants bonus gold and a guaranteed mutation choice.

### Done when

- The map or pre-battle banner clearly signals an Alpha.
- Alpha reward triggers once whether defeated or caught.
- Fleeing grants no reward.
- Tests cover level cap, rewards, capture modifier, and save behavior.

## P2.5 — Recurring rival

**Size:** L  
**Dependencies:** P2.1, P2.2  
**Primary files:** new rival data module, `src/run.js`, `src/main.js`

### Rival identity

- The rival chooses the starter strong against the player's starter.
- The rival appears at three authored depths.
- Their starter evolves when the depth/level makes that appropriate.
- Their team mirrors broad player strengths without copying exact mutations.
- The final Champion team includes the rival starter and reflects prior
  encounters.

### Map integration

- Add a `RIVAL` node type or authored mandatory rival checkpoints.
- Do not silently replace a Rest immediately before a regional boss.
- Rival victories give a signature reward; losses end the run normally.

### Done when

- All three player starter choices produce the correct rival starter.
- Rival state survives save/continue.
- Teams scale without exceeding the existing boss-level safety bounds.
- Champion dialogue and roster reflect the recurring rival.

## P2.6 — Mystery event expansion

**Size:** S  
**Dependencies:** P2.2  
**Primary files:** `src/run.js`, `src/main.js`

Add at least four events using existing systems:

- NPC trade with accept/decline comparison.
- Healing spring with heal-one/heal-all tradeoff.
- Ball fountain with a risk/reward roll.
- Ambush leading to a boosted wild battle.

Fix the existing Move Tutor description until the real relearning system ships:
rename it to **Move Restorer** or make its copy accurately describe PP recovery.

### P2 milestone exit gate

- Region choice predicts encounter types.
- Seeds reproduce species, events, shinies, and special encounters.
- Shinies and Alpha encounters create visible rare moments.
- The rival provides recurring narrative stakes.

---

# P3 — Team-Building Depth

## P3.0 — Preserve Pokémon identity through growth

**Size:** M  
**Dependencies:** P2 complete  
**Primary files:** `src/main.js`, `src/roster.js`, tests

Before adding more Pokémon properties, make leveling and evolution preserve:

- Shiny identity.
- Mutations and pseudo-abilities.
- Held item.
- Nature/training fields if later introduced.
- Capture metadata.
- Custom moves and current PP.

Recalculate mutation-based stat modifications after a level-up instead of losing
or double-applying them. Prefer storing base identity plus modifiers over
destructively multiplying stats.

### Done when

- A mutated Pokémon can level and evolve without losing its build.
- Repeated save/load/level cycles do not compound stat multipliers.
- Snapshot/Vault serialization preserves supported identity fields.

## P3.1 — Held-item data model and equipment UI

**Size:** M  
**Dependencies:** P3.0  
**Primary files:** new `src/items.js`, `src/battle.js`, `src/main.js`, tests

### Model

- One held item per Pokémon: `heldItemId` or `null`.
- Run inventory owns unequipped held items.
- Equipping, swapping, and removing items is free outside battle.
- Battle item effects are derived through a pure normalized effect helper.

### Initial catalog

- Leftovers: heal `1/16` max HP at end of turn.
- Charcoal/Mystic Water/Miracle Seed: `+20%` matching-type damage.
- Focus Band: small chance to survive a lethal hit at 1 HP.
- Quick Claw: small chance to move first within the same priority bracket.

### Done when

- Equipment survives save/load and evolution.
- End-of-turn and damage hooks compose with Sigils.
- Competing lethal-survival effects have an explicit order and cannot trigger
  twice incorrectly.
- Enemy-held items can be authored for bosses.

## P3.2 — Held-item acquisition and shop integration

**Size:** S/M  
**Dependencies:** P3.1  
**Primary files:** `src/run.js`, `src/main.js`

- Add held items to depth-appropriate shop pools.
- Add rare held-item mystery rewards.
- Show owned/equipped state before buying.
- Prevent accidental loss when replacing an equipped item.

### Done when

- Money creates a real choice between healing, catching, and build power.
- Purchased items enter inventory once and can be moved between party members.

## P3.3 — TM inventory and move teaching

**Size:** L  
**Dependencies:** P3.0  
**Primary files:** new `src/moves.js`, `src/api.js`, `src/run.js`, `src/main.js`

### Rules

- TMs are run inventory items.
- Teaching requires choosing a Pokémon and, at four moves, a move to replace.
- Compatibility comes from PokeAPI machine/version data or a validated local
  Gen 1 compatibility table.
- Canceling at either picker consumes nothing.
- A learned TM move persists through level-up and evolution.

### First TM set

Use a deliberately small useful pool such as Thunderbolt, Ice Beam,
Flamethrower, Psychic, Dig, Rest, and Reflect.

### Done when

- Compatibility is explained before selection.
- Move replacement preserves valid PP rules.
- Shops can roll TMs by region/depth.
- Tests cover compatible, incompatible, cancel, and replace flows.

## P3.4 — Real Move Relearner

**Size:** M  
**Dependencies:** P3.3  
**Primary files:** `src/api.js`, `src/main.js`

- Replace the placeholder tutor with a real move list.
- Offer previously available level-up moves for the species and current level.
- Charge gold only after a completed replacement.
- Restore forgotten level-up moves, not arbitrary incompatible moves.

### Done when

- The event description matches the behavior.
- Relearning and canceling are tested.

## P3.5 — Evolution stones

**Size:** M  
**Dependencies:** P3.0  
**Primary files:** new evolution helpers, `src/run.js`, `src/main.js`

### First stones

- Fire, Water, Thunder, Leaf, and Moon Stone.
- Sell stones in region/depth-appropriate shops.
- Show compatible party members before purchase/use.
- Require explicit confirmation before evolution.

### Done when

- Eevee, Vulpix, Growlithe, Pikachu, and other Gen 1 stone evolutions use the
  correct stone.
- Incompatible use consumes nothing.
- Evolution preserves the complete Pokémon build.

## P3.6 — Light stat identity

**Size:** M  
**Dependencies:** P3.0  
**Decision required:** nature system or training system

Preferred first implementation: a simple visible nature system.

- Assign one seeded nature at acquisition.
- Use a small understandable set rather than all canonical natures initially.
- Apply one `+10%` and one `-10%` non-HP stat modifier.
- Show the effect on the Pokémon summary.
- Never reroll nature through storage, evolution, or reload.

Do not add EV grinding in the same chunk.

### P3 milestone exit gate

- Two members of the same species can have meaningfully different builds.
- Money and route rewards support deliberate build choices.
- Growth never destroys custom build state.

---

# P4 — Replay and Challenge

## P4.1 — Run telemetry and results screen

**Size:** M  
**Dependencies:** P1.1  
**Primary files:** new `src/results.js`, `src/battle.js`, `src/main.js`

Track:

- Turns taken.
- Damage dealt and received per team member.
- KOs and switches.
- Captures and failed balls.
- Gold earned/spent.
- Nodes cleared.
- Highest single hit.
- MVP using a documented scoring formula.

Show results after victory and defeat before returning to the title.

### Done when

- Results are based on recorded actions, not reconstructed guesses.
- The screen handles short wipes and full Champion clears.
- Summary statistics can feed achievements and leaderboards later.

## P4.2 — Local records and leaderboard

**Size:** S/M  
**Dependencies:** P4.1  
**Primary files:** `src/progression.js`, `src/main.js`

- Persist the best runs locally.
- Rank by a stable score formula using victory, depth, remaining team health,
  captures, difficulty, and turns.
- Keep a bounded history, such as the best 20 runs.
- Store seed, date, mode, score, result, starter, and MVP.

### Done when

- Sorting has deterministic tie breakers.
- Old history entries normalize safely after schema changes.

## P4.3 — Daily seeded challenge

**Size:** L  
**Dependencies:** P2.2, P4.1, P4.2  
**Primary files:** `src/rng.js`, `src/run.js`, `src/main.js`

### Rules

- Derive one seed from the UTC calendar date.
- Lock starting choices and map generation for that day.
- Use a separate save slot from normal Expeditions.
- Allow repeated practice attempts but distinguish the first scored attempt.
- Record the best local score and first-attempt score.
- Display yesterday/today records locally.

For full comparability, migrate battle rolls to a deterministic battle RNG
stream in this chunk.

### Done when

- Two clean profiles on the same date receive identical offered choices,
  encounters, events, and battle rolls.
- Changing the local timezone does not change the UTC daily seed.
- Normal Expedition save data is untouched.

## P4.4 — Achievements

**Size:** M  
**Dependencies:** P1.1, P4.1  
**Primary files:** new `src/achievements.js`, UI

Start with event-driven achievements:

- First Capture.
- First Shiny.
- Full Team.
- Champion.
- No Items Used.
- One-Pokémon Clear.
- Type Specialist.
- Pokédex completion tiers.
- High-difficulty clear.

### Rules

- Achievement evaluation is pure and idempotent.
- Hidden achievements are marked as hidden until earned.
- Rewards, if any, are cosmetic or declared progression rewards.

## P4.5 — Nuzlocke modifier

**Size:** M/L  
**Dependencies:** P2.1, P4.1

### Rules

- Optional at run creation.
- One successful catch opportunity per authored route/biome segment.
- A fainted Pokémon becomes unusable for the rest of the run.
- Starter loss follows the same rule.
- UI clearly marks exhausted catch areas and lost Pokémon.
- Mode grants a score/Fragment multiplier.

Do not permanently delete account/Vault data.

## P4.6 — Safari Expedition

**Size:** M  
**Dependencies:** P2.1, P2.3

- Separate short catch-only mode.
- Fixed limited Safari Balls.
- Bait/Rock/Ball/Run choices.
- Biome-specific rare tables.
- Caught Pokémon update the account Pokédex but do not enter a normal
  Expedition party.

## P4.7 — New Game+ / Ascension

**Size:** M  
**Dependencies:** P2 complete, P4.1  
**Primary files:** `src/run.js`, `src/progression.js`, `src/main.js`

Turn the existing `ascension` field into a real flow.

### Rules

- First Champion victory unlocks Ascension 1 and the Shiny Charm.
- Clearing the highest available Ascension unlocks the next level.
- The player chooses any unlocked difficulty when starting.
- Ascension increases enemy levels within the existing fairness cap, improves
  rare encounter weights, increases Fragment rewards, and strengthens bosses.
- Show all modifiers before confirmation.
- Never force the player into the highest unlocked difficulty.

### Done when

- Ascension unlock/selection persists.
- Difficulty affects encounters and rewards through tested formulas.
- A normal difficulty run remains available.

### P4 milestone exit gate

- Every run ends with satisfying feedback.
- Daily, challenge, and Ascension paths coexist without corrupting saves.
- Local records and achievements create long-term goals.

---

# P5 — Advanced Encounters

These are intentionally late because the current controller and UI assume one
active Pokémon per side.

## P5.1 — Multi-target battle model

**Size:** L  
**Dependencies:** P3 complete

- Define battle sides with multiple active slots.
- Add target selection and spread-move metadata.
- Generalize speed order, switching, faint replacement, residual effects, and
  victory checks.
- Preserve the existing one-versus-one API through adapters where practical.

This chunk is engine-only and must have extensive simulations before UI work.

## P5.2 — Horde battles

**Size:** L  
**Dependencies:** P5.1

- Player active Pokémon versus three weaker wild enemies.
- Catching is available only when one wild target remains, unless a special
  rule says otherwise.
- Grant a clear risk/reward bonus.
- Ensure turn length and message pacing stay tolerable.

## P5.3 — Double battles

**Size:** L  
**Dependencies:** P5.1

- Two active party members versus two opponents.
- Explicit move targeting.
- Spread moves and ally-safe/ally-hit rules.
- Replacement selection when one active member faints.
- Author at least one rival or boss double battle.

### P5 milestone exit gate

- One-versus-one behavior remains regression-tested.
- Horde and double battles terminate reliably in simulations.
- Mobile target selection remains readable.

---

# 5. Deferred or Separate Tracks

## Traditional eight-Gym campaign

The current Expedition uses the Gym roster as rotating bosses. A literal
eight-Gym → Elite Four → Champion campaign would be a separate mode with a much
longer progression curve. Do not mix it into the three-region Expedition
without an explicit product decision.

If approved later, split it into:

1. Fixed Kanto route data and badge state.
2. Eight ordered Gym checkpoints.
3. Four Elite Four teams and gauntlet rules.
4. Campaign-specific level/economy pacing.
5. Campaign win screen and New Game+.

## Online ranked Arena

The Vault and multiplayer documentation already establish a separate online
track. Single-player roadmap work must keep roster snapshots compatible, but
network deployment, authentication, matchmaking, Elo, and server persistence
are not prerequisites for P1–P4.

## Time of day and environmental weather

Environmental weather needs an explicit precedence rule with Sigil-locked
weather. Add it only after biome tables are stable. Time of day should use a
player-selectable or seeded run clock so changing the device clock cannot be
used to reroll encounters freely.

## Game Corner wagering

The existing mystery-event wager is enough until the core economy is tuned. A
larger Game Corner should not ship before Fragment upgrades and held-item/TM
shops prove that money has meaningful competing uses.

---

# 6. Recommended Immediate Work Queue

Implement in this order:

1. `P1.1` — Versioned progression model. **Complete**
2. `P1.2` — Seen and caught tracking. **Complete**
3. `P1.3` — Pokédex screen. **Complete**
4. `P1.4` — Pokédex milestone perks. **Complete**
5. `P1.5` — Fragment upgrade shop. **Complete**
6. `P1.6` — Trainer profile. **Complete**
7. `P2.1` — Biome encounter catalog. **Complete**
8. `P2.2` — Deterministic controller rolls. **Complete**
9. `P2.3` — Shinies. **Next**
10. `P2.4` — Alpha encounters.
11. `P2.5` — Recurring rival.
12. `P2.6` — Mystery event expansion.

After P2, reassess run length, difficulty, money pressure, catch rate, and API
load behavior before committing to P3 balance values.

# 7. Definition of Done for Every Chunk

A roadmap chunk is complete only when:

- Its acceptance criteria are satisfied.
- Relevant unit tests exist for pure rules.
- Relevant DOM/integration smoke coverage exists for user flows.
- `npm test` passes.
- `npm run build` passes.
- Existing save data has a migration/default path.
- Keyboard and mobile interaction have been checked for new UI.
- No newly introduced player-facing reward is inert.
- Comments and UI copy describe the behavior that actually ships.
- The roadmap checkbox/status is updated in the same change.

# 8. Roadmap Status Log

Update this section as chunks ship.

| Chunk | Status | Notes |
| --- | --- | --- |
| P1.1 | Complete | v2 profile, legacy migration, run statistics, and tests shipped 2026-07-24 |
| P1.2 | Complete | Battle sightings, ownership paths, evolution, and legacy backfill shipped 2026-07-24 |
| P1.3 | Complete | 151-entry responsive Pokédex, filters, lazy details, and focus handling shipped 2026-07-24 |
| P1.4 | Complete | Seven automatic milestones, bonus starters, and snapshotted run effects shipped 2026-07-24 |
| P1.5 | Complete | Confirmed Fragment purchases, five permanent upgrades, and combined effect previews shipped 2026-07-24 |
| P1.6 | Complete | Trainer Profile screen, run history summary, and capped active-foreground playtime shipped 2026-07-24 |
| P2.1 | Complete | Three region biome tables, seeded depth-gated wild picker, and encounter tests shipped 2026-07-24 |
| P2.2 | Complete | Seeded coinflip/well/shrine resolvers, readable Mystery outcome modal, and reroll-guard tests shipped 2026-07-24 |
| P2.3 | Next | Shinies |
| P2.4–P2.6 | Backlog | Places and surprise |
| P3.0–P3.6 | Backlog | Team-building depth |
| P4.1–P4.7 | Backlog | Replay and challenge |
| P5.1–P5.3 | Deferred | Multi-target battle formats |
