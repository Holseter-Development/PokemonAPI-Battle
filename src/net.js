// net.js - the client boundary for online play. This is the seam the future
// authoritative Railway server plugs into. It is intentionally thin and
// side-effect free on import: with no endpoint configured it reports "offline"
// so the Arena UI can render a "coming soon" state today, and light up the
// moment ARENA_ENDPOINT is set - no other code needs to change.
//
// Protocol (planned, server-authoritative):
//   client → server : { t:"queue", roster }              // enter ranked queue
//   server → client : { t:"matched", battleId, opponent, seed, you:0|1 }
//   client → server : { t:"action", battleId, turn, action }   // move/switch/item
//   server → client : { t:"state", battleId, turn, events, rngCursor }
//   server → client : { t:"result", battleId, winner, elo:{before,after,delta} }
// The server owns the RNG seed and re-simulates every turn with the shared
// pure engine, so clients cannot forge damage or dodge outcomes.

const LS_ENDPOINT = "pkbattle:arena-endpoint";

export function arenaEndpoint() {
  try {
    if (typeof window !== "undefined") {
      if (window.ARENA_ENDPOINT) return window.ARENA_ENDPOINT;
      const v = localStorage.getItem(LS_ENDPOINT);
      if (v) return v;
    }
  } catch (_) {}
  return null;
}

export function isArenaConfigured() {
  return !!arenaEndpoint();
}

function makeEmitter() {
  const map = new Map();
  return {
    on(ev, cb) { (map.get(ev) || map.set(ev, []).get(ev)).push(cb); return () => this.off(ev, cb); },
    off(ev, cb) { const a = map.get(ev); if (a) map.set(ev, a.filter((f) => f !== cb)); },
    emit(ev, data) { (map.get(ev) || []).forEach((f) => { try { f(data); } catch (_) {} }); },
  };
}

// A single ranked session. Wraps a WebSocket when an endpoint exists.
export class ArenaClient {
  constructor() {
    this.status = "offline"; // offline | connecting | online | queued | in-battle
    this.ws = null;
    this.events = makeEmitter();
  }
  on(ev, cb) { return this.events.on(ev, cb); }

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
        ws.onopen = () => { this.status = "online"; this.events.emit("open"); resolve(); };
        ws.onclose = () => { this.status = "offline"; this.events.emit("close"); };
        ws.onerror = (e) => { this.events.emit("error", e); reject(new Error("Connection failed.")); };
        ws.onmessage = (m) => {
          let msg; try { msg = JSON.parse(m.data); } catch (_) { return; }
          if (msg && msg.t) this.events.emit(msg.t, msg);
        };
      } catch (e) { this.status = "offline"; reject(e); }
    });
  }

  send(obj) {
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj));
  }
  queueRanked(roster) { this.status = "queued"; this.send({ t: "queue", roster }); }
  sendAction(battleId, turn, action) { this.send({ t: "action", battleId, turn, action }); }
  cancelQueue() { this.send({ t: "dequeue" }); this.status = "online"; }
  disconnect() { try { this.ws && this.ws.close(); } catch (_) {} this.status = "offline"; }
}

// Shared instance for the app.
export const arena = new ArenaClient();
