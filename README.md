<img width="1700" height="460" alt="cloudflare-workers-banner" src="https://github.com/user-attachments/assets/e90098fd-cf51-4ef0-9b62-144365077df3" />

<h3 align="center">Cloudflare Workers ● Edge functions ● Zero servers ● Free-tier friendly</h3>

<p align="center">
    <a href="https://workers.cloudflare.com/">
      <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare Workers" />
    </a>​ ​
    <a href="https://developers.cloudflare.com/workers/">
      <img src="https://img.shields.io/badge/runtime-edge%20global%20network-F38020?logo=cloudflare&logoColor=white" alt="Edge Runtime" />
    </a>​ ​
    <a href="#">
      <img src="https://img.shields.io/badge/workers-6-F38020?logo=cloudflare&logoColor=white" alt="6 Workers" />
    </a>​ ​
    <a href="#">
      <img src="https://img.shields.io/badge/license-MIT-F38020" alt="MIT License" />
    </a>
</p>

---

### ＃ About This Repo
▎∅ **Edge-native** ⌱ every Worker runs on Cloudflare's global network — no servers, no cold starts<br>
▎∅ **Single-file** ⌱ each Worker is one `worker.js` ES module — drop in and deploy<br>
▎∅ **Secrets-safe** ⌱ tokens and keys live in `wrangler` secrets, never in source<br>
▎∅ **Free-tier friendly** ⌱ lightweight, low-request Workers that fit the free plan<br>
▎∅ **Production-minded** ⌱ constant-time HMAC, hibernation API, concurrent fan-out<br>
▎∅ **Self-contained** ⌱ zero external dependencies, no build step, no npm install<br>
A curated collection of small, focused Cloudflare Workers that each do one thing well.<br>

<br>

### ＃ Workers at a Glance
<table width="100%">
  <tr>
    <td><b>▎TBA</b></td>
    <td>Telegram Bot API proxy</td>
    <td>key-gated, strips the key before forwarding to <code>api.telegram.org</code></td>
    <td><code>PROXY_KEY</code></td>
  </tr>
  <tr>
    <td><b>▎CAPTCHA</b></td>
    <td>Self-hosted SVG CAPTCHA</td>
    <td>HMAC-signed expiring tokens, 3 challenge types, theme auto-detection, ~25 query params</td>
    <td><code>CAPTCHA_SECRET</code></td>
  </tr>
  <tr>
    <td><b>▎GEO</b></td>
    <td>Request intelligence endpoint</td>
    <td>full <code>request.cf</code> + derived: connection quality, network hint, Tor/mTLS/TLS profile</td>
    <td>—</td>
  </tr>
  <tr>
    <td><b>▎WS</b></td>
    <td>WebSocket hub + chat persistence</td>
    <td>Durable Object with SQLite + Hibernation API, rooms, 24h message retention</td>
    <td><code>MY_DO</code> · <code>ROOM_KEY</code></td>
  </tr>
  <tr>
    <td><b>▎AGGREGATOR</b></td>
    <td>Concurrent JSON fan-out</td>
    <td>fetch up to 10 <code>key=url</code> pairs in parallel, merge into one JSON response</td>
    <td>—</td>
  </tr>
  <tr>
    <td><b>▎CORS</b></td>
    <td>Minimal CORS-anywhere proxy</td>
    <td>handles <code>OPTIONS</code> preflight, echoes request headers, adds permissive CORS</td>
    <td>—</td>
  </tr>
</table>

<br>

### ＃ Tech Stack
<table width="100%">
  <tr>
    <td><img width="30" src="https://raw.githubusercontent.com/Kourva/AwesomeBadges/main/Badges/frameworks/cloudflare-workers.png" title="Cloudflare Workers" /></td>
    <td><b>▎WORKERS …</b> serverless edge functions, global low-latency runtime</td>
  </tr>
  <tr>
    <td><img width="30" src="https://raw.githubusercontent.com/Kourva/AwesomeBadges/main/Badges/frameworks/cloudflare-do.png" title="Durable Objects" /></td>
    <td><b>▎DURABLE OBJECTS …</b> stateful WebSocket hub with SQLite storage + Hibernation API</td>
  </tr>
  <tr>
    <td><img width="30" src="https://raw.githubusercontent.com/Kourva/AwesomeBadges/main/Badges/languages/javascript.png" title="JavaScript" /></td>
    <td><b>▎JAVASCRIPT …</b> ES modules, zero dependencies, zero build step</td>
  </tr>
  <tr>
    <td><img width="30" src="https://raw.githubusercontent.com/Kourva/AwesomeBadges/main/Badges/frameworks/wrangler.png" title="Wrangler" /></td>
    <td><b>▎WRANGLER …</b> deploy, manage secrets, configure bindings</td>
  </tr>
  <tr>
    <td><img width="30" src="https://raw.githubusercontent.com/Kourva/AwesomeBadges/main/Badges/frameworks/webcrypto.png" title="WebCrypto" /></td>
    <td><b>▎WEBCRYPTO …</b> HMAC-SHA256 token signing and constant-time verification</td>
  </tr>
</table>

<br>

### ＃ TBA — Telegram Bot API Proxy

A thin, key-gated proxy in front of `api.telegram.org`. You call your Worker with the same path you'd send to Telegram, plus a `?key=` query param; the Worker checks the key, strips it, and forwards the request. This lets you call the Telegram Bot API from the browser without exposing your bot token in client-side code — the token stays server-side, and the `PROXY_KEY` gates who can use the proxy.

▎<b>Endpoints</b><br>
▎<code>GET /</code> ⌱ health check, returns <code>OK</code><br>
▎<code>ANY /&lt;path&gt;?key=&lt;PROXY_KEY&gt;</code> ⌱ forwarded to <code>https://api.telegram.org&lt;path&gt;</code><br>

▎<b>Setup</b><br>
```bash
cd tba
npx wrangler secret put PROXY_KEY    # any random string you'll also send as ?key=
npx wrangler deploy
```

▎<b>Example</b><br>
```bash
curl "https://tba.<your-subdomain>.workers.dev/bot<TOKEN>/getMe?key=<PROXY_KEY>"
```

<br>

### ＃ CAPTCHA — Self-hosted SVG CAPTCHA

Generates SVG CAPTCHA images and issues HMAC-signed, expiring tokens that you verify on the server. No external services, no reCAPTCHA, no tracking — just crypto and SVG. Three challenge types:

▎<b>Challenge types</b><br>
▎∅ <code>chars</code> (default) ⌱ a distorted alphanumeric string rendered as SVG<br>
▎∅ <code>math</code> ⌱ a simple arithmetic problem (<code>7 + 3 = ?</code>)<br>
▎∅ <code>sequence</code> ⌱ a number sequence with a missing term (<code>2, 5, 8, 11, ?</code>)<br>

The SVG is highly customizable via query parameters: size, colors, fonts, noise lines, dot grids, scatter dots, wavy lines, cross-hatch, character jitter and rotation. Theme (<code>light</code>/<code>dark</code>) is auto-detected from the client's timezone, or overridden with <code>?theme=</code>.

▎<b>Endpoints</b><br>
▎<code>GET /captcha?type=&theme=&len=&expmnt=&…</code> ⌱ returns <code>{ token, type, theme, svg }</code><br>
▎<code>POST /verify</code> with <code>{ token, answer }</code> ⌱ returns <code>{ ok, type, theme }</code><br>

Tokens are <code>base64url(payload).hmacSignature</code>, where the payload is <code>answer|expiry|type|theme</code>. Signatures are checked with a constant-time comparison, and tokens expire (1–10 minutes, default 1).

▎<b>Query parameters</b><br>
<table width="100%">
  <tr><td><b>Param</b></td><td><b>Default</b></td><td><b>Description</b></td></tr>
  <tr><td><code>type</code></td><td><code>chars</code></td><td>Challenge type: <code>chars</code>, <code>math</code>, <code>sequence</code></td></tr>
  <tr><td><code>theme</code></td><td>auto</td><td>Override theme: <code>light</code> or <code>dark</code></td></tr>
  <tr><td><code>len</code></td><td><code>5</code></td><td>Character count for <code>chars</code> type (3–10)</td></tr>
  <tr><td><code>expmnt</code></td><td><code>1</code></td><td>Token expiry in minutes (1–10)</td></tr>
  <tr><td><code>w</code> / <code>h</code></td><td>auto / <code>70</code></td><td>SVG width / height</td></tr>
  <tr><td><code>bg</code> / <code>fg</code></td><td>theme</td><td>Background / foreground color</td></tr>
  <tr><td><code>fs</code></td><td><code>26</code></td><td>Font size</td></tr>
  <tr><td><code>ff</code></td><td><code>monospace</code></td><td>Font family</td></tr>
  <tr><td><code>lc</code> / <code>lo</code></td><td><code>3</code> / <code>0.2</code></td><td>Noise line count / opacity</td></tr>
  <tr><td><code>ac</code></td><td><code>2</code></td><td>Arc count</td></tr>
  <tr><td><code>dg</code> / <code>dgs</code> / <code>dgr</code> / <code>dgo</code></td><td>off / <code>12</code> / <code>1</code> / <code>0.15</code></td><td>Dot grid: enable / step / radius / opacity</td></tr>
  <tr><td><code>sd</code> / <code>sr</code> / <code>so</code></td><td><code>0</code> / <code>1.5</code> / <code>0.2</code></td><td>Scatter dots: count / radius / opacity</td></tr>
  <tr><td><code>wl</code> / <code>wo</code></td><td><code>0</code> / <code>0.15</code></td><td>Wavy lines: count / opacity</td></tr>
  <tr><td><code>hl</code> / <code>ho</code></td><td><code>0</code> / <code>0.12</code></td><td>Cross-hatch: count / opacity</td></tr>
  <tr><td><code>cn</code></td><td><code>0</code></td><td>Character-adjacent noise dots</td></tr>
  <tr><td><code>cs</code> / <code>jy</code> / <code>rm</code> / <code>pl</code></td><td><code>30</code> / <code>3</code> / <code>8</code> / <code>30</code></td><td>Char spacing / Y jitter / max rotation / left padding</td></tr>
</table>

▎<b>Setup</b><br>
```bash
cd captcha
npx wrangler secret put CAPTCHA_SECRET    # a random secret used for HMAC signing
npx wrangler deploy
```

▎<b>Example flow</b><br>
```bash
# 1. Get a challenge
curl "https://captcha.<your-subdomain>.workers.dev/captcha?type=math" | jq
# -> { "token": "...", "type": "math", "theme": "dark", "svg": "<svg>...</svg>" }

# 2. Verify the answer
curl -X POST https://captcha.<your-subdomain>.workers.dev/verify \
  -H 'content-type: application/json' \
  -d '{"token":"...","answer":"10"}'
# -> { "ok": true, "type": "math", "theme": "dark" }
```

<br>

### ＃ GEO — Request Intelligence Endpoint

Returns a detailed JSON snapshot of the incoming request, built from Cloudflare's <code>request.cf</code> object plus a few derived fields. Useful for debugging, IP/geo lookups, bot/VPN heuristics, and seeing exactly what the Cloudflare edge knows about a client.

▎<b>Derived fields</b><br>
▎∅ <code>ip</code> ⌱ client IP from <code>CF-Connecting-IP</code><br>
▎∅ <code>connectionQuality</code> ⌱ <code>excellent</code> / <code>good</code> / <code>poor</code> / <code>unknown</code>, derived from TCP/QUIC RTT<br>
▎∅ <code>rttMs</code> ⌱ raw round-trip time<br>
▎∅ <code>networkHint</code> ⌱ <code>privacy-network</code> / <code>datacenter</code> / <code>mobile</code> / <code>residential-or-unknown</code>, inferred from ASN org<br>
▎∅ <code>isTorByCf</code> ⌱ true when Cloudflare reports the Tor (<code>T1</code>) country code<br>
▎∅ <code>hasTlsDetails</code> / <code>mtlsPresented</code> ⌱ TLS handshake and client-cert (mTLS) flags<br>
▎∅ <code>tlsProfile</code> ⌱ TLS version, cipher, ciphers/extensions hashes<br>
▎∅ <code>protocolHint</code> ⌱ HTTP protocol, request priority, EU country flag<br>

▎<b>Setup</b><br>
No secrets, no bindings — deploy and call it.

```bash
cd geo
npx wrangler deploy
```

▎<b>Example</b><br>
```bash
curl "https://geo.<your-subdomain>.workers.dev/" | jq
```

<br>

### ＃ WS — WebSocket Testing Hub

A multi-room WebSocket server backed by a single Durable Object. Rooms are addressed by the first path segment; an optional second segment is the "action" (e.g. <code>chat</code>). Auth is via an <code>x-key</code> header, with a <code>Sec-WebSocket-Protocol</code> fallback so browsers can authenticate from client-side JS.

The <code>chat</code> action persists messages to a SQLite table inside the Durable Object (via <code>state.storage.sql</code>), with a 24-hour retention window. Uses the Hibernation API (<code>acceptWebSocket</code> / <code>webSocketMessage</code>) so idle connections don't consume CPU.

▎<b>Endpoints</b><br>
▎<code>wss://&lt;host&gt;/&lt;room&gt;/&lt;action&gt;</code> ⌱ upgrade to a WebSocket in that room/action<br>
▎<code>https://&lt;host&gt;/&lt;room&gt;/clear</code> ⌱ HTTP request that wipes the room's storage<br>

▎<b>Setup</b><br>
```bash
cd ws
npx wrangler secret put ROOM_KEY    # shared key clients must send as x-key / Sec-WebSocket-Protocol
npx wrangler deploy
```

<code>wrangler.toml</code> needs a Durable Object binding (already included):

```toml
[[durable_objects.bindings]]
name = "MY_DO"
class_name = "ws"

[[migrations]]
tag = "v1"
new_classes = ["ws"]
```

▎<b>Example</b><br>
```js
// Browser
const ws = new WebSocket(
  "wss://ws.<your-subdomain>.workers.dev/myroom/chat",
  "<ROOM_KEY>"   // sent as Sec-WebSocket-Protocol
);
ws.onmessage = (e) => console.log(e.data);
ws.send("hello room");
```

<br>

### ＃ AGGREGATOR — Concurrent JSON Fan-out

Pass up to 10 <code>key=url</code> pairs as query parameters; the Worker fetches all of them concurrently with <code>Promise.all</code> and returns a single JSON object keyed by your labels. Each value is the parsed JSON from that endpoint, or an <code>{ error, url }</code> object if the fetch failed. Great for merging multiple microservice/API calls into one round-trip for a client.

▎<b>Setup</b><br>
No secrets, no bindings — deploy and call.

```bash
cd aggregator
npx wrangler deploy
```

▎<b>Example</b><br>
```bash
curl "https://aggregator.<your-subdomain>.workers.dev/?ipinfo=https://ipinfo.io/json&github=https://api.github.com/zen" | jq
# -> { "ipinfo": { ... }, "github": "..." }
```

<br>

### ＃ CORS — Minimal CORS-anywhere Proxy

A tiny proxy that forwards a request to a target URL and adds permissive CORS headers so browser-based apps can hit APIs that don't send CORS headers themselves. Handles <code>OPTIONS</code> preflight requests and echoes back any requested <code>Access-Control-Request-Headers</code>.

▎<b>Endpoints</b><br>
▎<code>ANY /?target=&lt;url&gt;</code> ⌱ forwarded request with <code>Access-Control-Allow-Origin: *</code><br>
▎<code>OPTIONS /?target=&lt;url&gt;</code> ⌱ preflight response with allowed methods/headers and a 24h max-age<br>

▎<b>Setup</b><br>
No secrets, no bindings — deploy and call.

```bash
cd cors
npx wrangler deploy
```

▎<b>Example</b><br>
```bash
curl "https://cors.<your-subdomain>.workers.dev/?target=https://api.example.com/data"
```

<br>

### ＃ Deploying

Each Worker is a single <code>worker.js</code> ES module. To deploy one:

```bash
cd <worker-folder>
npx wrangler deploy
```

Add any required secrets (listed per Worker above) with:

```bash
npx wrangler secret put <SECRET_NAME>
```

For the <code>ws</code> Worker, the Durable Object binding and migration are already in its <code>wrangler.toml</code>.

<br>

### ＃ Notes

▎∅ All Workers use the modern ES module format (<code>export default { fetch }</code>)<br>
▎∅ Secrets are referenced as <code>env.&lt;NAME&gt;</code> inside the Worker and never appear in source<br>
▎∅ The <code>captcha</code> and <code>ws</code> Workers store/return data; the rest are stateless<br>
▎∅ Free-tier friendly: these are lightweight, low-request Workers — watch your usage if you put <code>aggregator</code> or <code>cors</code> in front of high-traffic endpoints<br>

<br>

### ＃ License

MIT — use these however you like.

<br>

### ＃ Contact

Best way to reach me. Email and Telegram.<br>
〓 **Portfolio ━** [**kourva.github.io**](https://kourva.github.io/)<br>
〓 **GitHub ━** [**github.com/Kourva**](https://github.com/Kourva)<br>
〓 **Email ━** [**realkourva@proton.me**](mailto:realkourva@proton.me)<br>
〓 **Telegram ━** [**@k0urv4**](https://t.me/k0urv4)<br>
〓 **Instagram ━** [**@k0urv4**](https://instagram.com/k0urv4)<br>
