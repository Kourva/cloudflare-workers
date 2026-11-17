export { ws };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const room = parts[0] ?? "default";
    const action = parts[1] ?? "default";

    // Auth: x-key header first, then Sec-WebSocket-Protocol fallback
    const headerKey = request.headers.get("x-key");
    const protoKey = request.headers.get("Sec-WebSocket-Protocol");
    const providedKey = headerKey || protoKey;

    if (!env.ROOM_KEY || providedKey !== env.ROOM_KEY) {
      return new Response("Forbidden", { status: 403 });
    }

    const id = env.MY_DO.idFromName(room);
    const stub = env.MY_DO.get(id);

    // "clear" action: HTTP request, wipe storage
    if (action === "clear") {
      return stub.fetch("https://do/clear");
    }

    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    return stub.fetch(`https://do/ws/${encodeURIComponent(action)}`, request);
  },
};

class ws {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sockets = new Map();
  }

  _getSet(action) {
    let set = this.sockets.get(action);
    if (!set) {
      set = new Set();
      this.sockets.set(action, set);
    }
    return set;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/clear") {
      await this.state.storage.deleteAll();
      return new Response("cleared", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    if (url.pathname.startsWith("/ws/")) {
      const action = decodeURIComponent(url.pathname.slice(4));

      if (action === "chat") {
        await this._initChat();
      }

      const pair = new WebSocketPair();
      const server = pair[1];

      this.state.acceptWebSocket(server);
      server.serializeAttachment({ action });

      const set = this._getSet(action);
      set.add(server);

      const requestedProtocol = request.headers.get("Sec-WebSocket-Protocol");
      const headers = {};
      if (requestedProtocol) {
        headers["Sec-WebSocket-Protocol"] = requestedProtocol;
      }

      return new Response(null, { status: 101, webSocket: pair[0], headers });
    }

    return new Response("Not found", { status: 404 });
  }

  async _initChat() {
    this.state.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS messages (room TEXT, action TEXT, content TEXT, created_at INTEGER)"
    );
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    this.state.storage.sql.exec("DELETE FROM messages WHERE created_at < ?", cutoff);
  }

  async _logChat(room, action, content) {
    this.state.storage.sql.exec(
      "INSERT INTO messages (room, action, content, created_at) VALUES (?, ?, ?, ?)",
      room, action, content, Date.now()
    );
  }

  async webSocketMessage(ws, message) {
    const attachment = ws.deserializeAttachment();
    const action = attachment?.action ?? "default";
    const room = this.state.id.name ?? "default";

    if (action === "chat") {
      const content = typeof message === "string" ? message : "[binary]";
      await this._logChat(room, action, content);
    }

    const set = this.sockets.get(action);
    if (!set) return;

    for (const peer of set) {
      if (peer === ws) continue;
      if (peer.readyState !== 1) continue;
      peer.send(message);
    }
  }

  webSocketClose(ws) {
    const attachment = ws.deserializeAttachment();
    const action = attachment?.action ?? "default";
    const set = this.sockets.get(action);
    if (set) {
      set.delete(ws);
      if (set.size === 0) this.sockets.delete(action);
    }
  }

  webSocketError(ws, error) {
    const attachment = ws.deserializeAttachment();
    const action = attachment?.action ?? "default";
    const set = this.sockets.get(action);
    if (set) {
      set.delete(ws);
      if (set.size === 0) this.sockets.delete(action);
    }
  }
}
