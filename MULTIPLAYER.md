# PokéBattle Arena — Multiplayer Plan (1v1 Ranked)

This document is the roadmap for turning the singleplayer game into an online
**1v1 ranked Arena**, hosted on Railway. Singleplayer is where you grind, catch
and level a team; the Arena is where those teams fight other players for rank.

The client is already built **toward** this: the battle engine is pure and
deterministic (seeded RNG), the team is exported as a portable **roster**
(`src/roster.js`), and all networking is funnelled through one seam
(`src/net.js`). Nothing else in the client needs to change to go online.

---

## 1. Guiding principle: server-authoritative

For anything "ranked", the **server must be the source of truth**. Browsers are
untrusted — a trust-the-client model would let anyone edit damage, dodge, or
inject a level-100 Mewtwo. Because our engine (`src/battle.js`) is a pure
function of `(state, action, rng)`, the server can run the **exact same engine
code** and re-simulate every turn. Clients send *intents* ("use move 2"); the
server owns the RNG seed and computes outcomes. This is the single most
important architectural decision and everything below follows from it.

> Practical consequence: `src/battle.js`, `src/data.js` and `src/roster.js` must
> stay dependency-free and DOM-free so they can be imported by the Node server
> unchanged. They already are. The server is a Node app that `import`s them.

---

## 2. Topology

```
 ┌────────────┐    WSS     ┌─────────────────────────────┐
 │  Browser A │◀──────────▶│  Railway service (Node/ws)  │
 └────────────┘            │                             │
 ┌────────────┐    WSS     │  • Auth (JWT)               │     ┌────────────┐
 │  Browser B │◀──────────▶│  • Matchmaker (Elo queue)   │◀───▶│ Postgres   │
 └────────────┘            │  • Authoritative battle sim │     │ (Railway)  │
                           │    (imports src/battle.js)  │     └────────────┘
                           │  • Elo + match history      │
                           └─────────────────────────────┘
```

- **Transport:** WebSocket (`wss://`). Turn-based, so latency is a non-issue; no
  need for WebRTC/rollback. A single Railway service handles everything to start.
- **State:** in-memory per live battle (fast); **Postgres** (Railway plugin) for
  accounts, rosters, Elo and match history — the durable meta.
- **Scale later:** battles are sticky to one process. If one dyno isn't enough,
  add Redis pub/sub for matchmaking across instances. Not needed at launch.

---

## 3. Protocol (already stubbed in `src/net.js`)

```
client → server : { t:"auth",  token }
client → server : { t:"queue", roster }                 // validated server-side
server → client : { t:"matched", battleId, opponent, seed, you:0|1 }
client → server : { t:"action", battleId, turn, action } // {kind:'move',index} | {kind:'switch',index} | {kind:'item',key}
server → client : { t:"state",  battleId, turn, events } // authoritative event log to animate
server → client : { t:"result", battleId, winner, elo:{before,after,delta} }
```

- Both clients submit their action for a turn; the server resolves **turn order
  by speed/priority** (already implemented in `firstMover`), applies both, and
  broadcasts the `events` log. The client's existing `performMove`/animation
  code renders that log — the same code path used in singleplayer.
- A per-turn **timer** (e.g. 30s) auto-picks a move on timeout so idle players
  can't stall a ranked match.
- **Reconnect:** `battleId` + JWT lets a dropped client rejoin the in-memory
  battle; a grace window then awards the win on abandonment.

---

## 4. Anti-cheat / fair teams

- Server **re-derives stats** from base stats + level (never trusts client
  stat numbers), and re-runs `validateRoster()` (shared code) to reject
  malformed or over-cap teams.
- Optional **level cap / clause set** per ranked format (e.g. "Lv 50 flat",
  "no duplicates", "no legendaries"). `validateRoster(roster, opts)` already
  takes an options bag for exactly this.
- RNG seed is server-generated and never revealed ahead of a turn, so outcomes
  can't be pre-computed by a client.

---

## 5. Ranking

- **Elo** (or Glicko-2) per account, stored in Postgres. Start everyone at 1000.
- `rosterPower()` (in `roster.js`) gives a rough team rating usable as a
  secondary matchmaking hint so brand-new teams aren't fed to veterans.
- Leaderboard = a Postgres query; expose a read-only endpoint the title screen
  can show.

---

## 6. How the client turns online

The client already gates on a single flag. To go live:

1. Deploy the server to Railway (below) and note its public URL.
2. Set the endpoint — either build-time (`window.ARENA_ENDPOINT = "wss://…"`) or
   at runtime: `localStorage.setItem("pkbattle:arena-endpoint", "wss://…")`.
3. `isArenaConfigured()` flips to true → the "Ranked Arena" screen shows **Find
   Match** instead of "coming soon", and `ArenaClient` connects. No other client
   change required.

---

## 7. Railway deployment sketch

```
/server
  package.json         # "type":"module", deps: ws, pg, jsonwebtoken
  index.js             # ws server; imports ../src/battle.js, ../src/data.js, ../src/roster.js
  matchmaker.js        # Elo queue
  battleRoom.js        # authoritative sim per battle (turn buffering + timer)
  db.js                # Postgres (Railway DATABASE_URL)
```

- Railway service = the Node `/server` app; add the **Postgres** plugin
  (`DATABASE_URL` is injected). `PORT` is provided by Railway; bind the ws
  server to it. Health check on `/`.
- Reuse the game code by importing the existing `src/*` modules directly (keep
  them ESM + dependency-free — already the case), so singleplayer and the
  authoritative server can never diverge on rules.

---

## 8. Build phases

| Phase | Deliverable |
|------|-------------|
| **0 (done)** | Deterministic engine, portable roster, `net.js` seam, Arena entry UI. |
| **1** | Railway Node/ws server: auth, queue, **one authoritative battle** end-to-end (no Elo). Two browsers can fight. |
| **2** | Elo + match history in Postgres; leaderboard; per-turn timer + reconnect. |
| **3** | Ranked formats/clauses, seasons, spectate, replays (store the event log). |

Phase 1 is the meaningful milestone: two real players in a live, cheat-proof
1v1. Everything needed on the client for it already exists.
