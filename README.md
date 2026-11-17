<h3 align="center">Cloudflare Workers ● Edge functions ● Zero servers ● Free-tier friendly</h3>

---

### ＃ Workers

▎<b>１ TBA ⎋﹕</b> key-gated proxy to the Telegram Bot API<br>
▎<b>２ CAPTCHA ⎋﹕</b> self-hosted SVG CAPTCHA with HMAC-signed expiring tokens<br>
▎<b>３ GEO ⎋﹕</b> request intelligence endpoint — full `request.cf` + derived fields<br>
▎<b>４ WS ⎋﹕</b> WebSocket hub with rooms + SQLite-backed chat persistence<br>
▎<b>５ AGGREGATOR ⎋﹕</b> concurrent JSON fan-out — fetch up to 10 APIs at once<br>
▎<b>６ CORS ⎋﹕</b> minimal CORS-anywhere proxy with preflight handling<br>

<br>

### ＃ Deploy with Cloudflare AI

> [!TIP]
> Paste this into the Cloudflare AI agent and it builds and deploys all six Workers directly to your account, prompts you for the three secrets, wires up the Durable Object for `ws`, and hands back live URLs with test commands.
>
> ```
> Deploy the Cloudflare Workers collection from https://github.com/Kourva/cloudflare-workers to my account.
>
> For each of the 6 Workers (tba, captcha, geo, ws, aggregator, cors):
> - Create the Worker script from the repo source
> - Set up the required wrangler.toml (compatibility date, bindings, migrations)
> - For ws: create the Durable Object binding (MY_DO, class ws) and migration
> - Ask me for each required secret value (PROXY_KEY, CAPTCHA_SECRET, ROOM_KEY) and set them
> - Deploy each Worker
>
> After deploying, give me the URL for each Worker and a quick test curl command.
> ```

<br>

### ＃ TBA

▎<b>Secrets</b> ⌱ `PROXY_KEY`<br>
▎<b>Endpoints</b> ⌱ `GET /` → health check · `ANY /<path>?key=<PROXY_KEY>` → forwarded to `api.telegram.org`<br>

```bash
cd tba && npx wrangler secret put PROXY_KEY && npx wrangler deploy
curl "https://tba.<sub>.workers.dev/bot<TOKEN>/getMe?key=<PROXY_KEY>"
```

<br>

### ＃ CAPTCHA

▎<b>Secrets</b> ⌱ `CAPTCHA_SECRET`<br>
▎<b>Endpoints</b> ⌱ `GET /captcha?type=&theme=&len=&…` → `{ token, type, theme, svg }` · `POST /verify` `{ token, answer }` → `{ ok, type, theme }`<br>
▎<b>Types</b> ⌱ `chars` (default) · `math` · `sequence`<br>

```bash
cd captcha && npx wrangler secret put CAPTCHA_SECRET && npx wrangler deploy
curl "https://captcha.<sub>.workers.dev/captcha?type=math" | jq
curl -X POST https://captcha.<sub>.workers.dev/verify -H 'content-type: application/json' -d '{"token":"...","answer":"10"}'
```

<br>

### ＃ GEO

▎<b>Secrets</b> ⌱ none<br>
▎<b>Endpoints</b> ⌱ `GET /` → full `request.cf` + `ip`, `connectionQuality`, `rttMs`, `networkHint`, `isTorByCf`, `mtlsPresented`, `tlsProfile`, `protocolHint`<br>

```bash
cd geo && npx wrangler deploy
curl "https://geo.<sub>.workers.dev/" | jq
```

<br>

### ＃ WS

▎<b>Secrets</b> ⌱ `ROOM_KEY`<br>
▎<b>Bindings</b> ⌱ `MY_DO` (Durable Object, class `ws`)<br>
▎<b>Endpoints</b> ⌱ `wss://<host>/<room>/<action>` → WebSocket · `GET /<room>/clear` → wipe room storage<br>

```bash
cd ws && npx wrangler secret put ROOM_KEY && npx wrangler deploy
# browser
const ws = new WebSocket("wss://ws.<sub>.workers.dev/myroom/chat", "<ROOM_KEY>")
ws.send("hello room")
```

<br>

### ＃ AGGREGATOR

▎<b>Secrets</b> ⌱ none<br>
▎<b>Endpoints</b> ⌱ `GET /?key1=url1&key2=url2…` → merged JSON (max 10 pairs)<br>

```bash
cd aggregator && npx wrangler deploy
curl "https://aggregator.<sub>.workers.dev/?ipinfo=https://ipinfo.io/json&github=https://api.github.com/zen" | jq
```

<br>

### ＃ CORS

▎<b>Secrets</b> ⌱ none<br>
▎<b>Endpoints</b> ⌱ `ANY /?target=<url>` → proxied response with CORS headers · `OPTIONS /?target=<url>` → preflight<br>

```bash
cd cors && npx wrangler deploy
curl "https://cors.<sub>.workers.dev/?target=https://api.example.com/data"
```

<br>

### ＃ License

MIT ● use these however you like.
