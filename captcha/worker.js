function b64url(data) {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return b64url(String.fromCharCode(...new Uint8Array(sig)));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function numParam(url, name) {
  const v = url.searchParams.get(name);
  return v === null ? undefined : Number(v);
}

function pickTheme(cf, override) {
  if (override === "light" || override === "dark") return override;
  const hour = parseInt(
    new Date().toLocaleString("en-US", {
      timeZone: cf.timezone || "UTC",
      hour: "numeric",
      hour12: false,
    })
  );
  return hour >= 20 || hour <= 6 ? "dark" : "light";
}

function generateChallenge(type, len) {

  if (type === "sequence") {
    const start = Math.floor(Math.random() * 5) + 1;
    const step = Math.floor(Math.random() * 4) + 1;
    const seq = [start, start + step, start + 2 * step, start + 3 * step];
    const answer = start + 4 * step;
    return { question: `${seq.join(", ")}, ?`, answer: String(answer), type };
  }

  // math
  if (type === "math") {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const op = Math.random() < 0.5 ? "+" : "-";
    const answer = op === "+" ? a + b : a - b;
    return { question: `${a} ${op} ${b} = ?`, answer: String(answer), type: "math" };
  }

  // deafult: chars
  const count = Math.min(Math.max(len || 5, 3), 10);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let answer = "";
    for (let i = 0; i < count; i++) {
      answer += chars[Math.floor(Math.random() * chars.length)];
    }
    return { question: answer, answer, type };
}

function captchaSvg(text, theme, options = {}) {
  const {
    width = Math.max(200, 40 + text.length * 30),
    height = 70,
    bg = theme === "dark" ? "#1a1a2e" : "#f0f0f0",
    fg = theme === "dark" ? "#eeeeee" : "#111111",
    fontSize = 26,
    fontFamily = "monospace",
    // straight lines
    lineCount = 3,
    lineOpacity = 0.2,
    // arcs
    arcCount = 2,
    // dot grid
    dotGrid = false,
    dotGridStep = 12,
    dotGridRadius = 1,
    dotGridOpacity = 0.15,
    // random scatter dots
    scatterDots = 0,
    scatterRadius = 1.5,
    scatterOpacity = 0.2,
    // wavy lines
    wavyLines = 0,
    wavyOpacity = 0.15,
    // cross-hatch
    hatchLines = 0,
    hatchOpacity = 0.12,
    // character-adjacent noise
    charNoise = 0,
    // character layout
    charSpacing = 30,
    jitterY = 3,
    rotateMax = 8,
    paddingLeft = 30,
  } = options;

  const parts = [];

  // background
  parts.push(`<rect width="${width}" height="${height}" fill="${bg}"/>`);

  // dot grid
  if (dotGrid) {
    for (let x = dotGridStep / 2; x < width; x += dotGridStep) {
      for (let y = dotGridStep / 2; y < height; y += dotGridStep) {
        parts.push(
          `<circle cx="${x}" cy="${y}" r="${dotGridRadius}" fill="${fg}" opacity="${dotGridOpacity}"/>`
        );
      }
    }
  }

  // random scatter dots
  for (let i = 0; i < scatterDots; i++) {
    parts.push(
      `<circle cx="${Math.random() * width}" cy="${Math.random() * height}" r="${scatterRadius}" fill="${fg}" opacity="${scatterOpacity}"/>`
    );
  }

  // straight noise lines
  for (let i = 0; i < lineCount; i++) {
    parts.push(
      `<line x1="${Math.random() * width}" y1="${Math.random() * height}" x2="${Math.random() * width}" y2="${Math.random() * height}" stroke="${fg}" stroke-width="1" opacity="${lineOpacity}"/>`
    );
  }

  // arcs
  for (let i = 0; i < arcCount; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    parts.push(
      `<path d="M ${cx} ${cy} q ${Math.random() * 30} ${Math.random() * 30} ${Math.random() * 40} ${Math.random() * 20}" stroke="${fg}" fill="none" opacity="0.15"/>`
    );
  }

  // wavy lines
  for (let i = 0; i < wavyLines; i++) {
    const y0 = Math.random() * height;
    const amp = 4 + Math.random() * 6;
    const period = 30 + Math.random() * 40;
    let d = `M 0 ${y0}`;
    for (let x = 0; x < width; x += 6) {
      const y = y0 + Math.sin((x / period) * Math.PI * 2) * amp;
      d += ` L ${x} ${y}`;
    }
    parts.push(`<path d="${d}" stroke="${fg}" fill="none" opacity="${wavyOpacity}"/>`);
  }

  // cross-hatch
  for (let i = 0; i < hatchLines; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const len = 4 + Math.random() * 8;
    parts.push(
      `<line x1="${x}" y1="${y}" x2="${x + len}" y2="${y + len}" stroke="${fg}" stroke-width="1" opacity="${hatchOpacity}"/>`
    );
  }

  // characters + adjacent noise
  text.split("").forEach((ch, i) => {
    const x = paddingLeft + i * charSpacing;
    const y = height / 2 + fontSize / 3 + (Math.random() * jitterY * 2 - jitterY);
    const rotate = (Math.random() * rotateMax * 2 - rotateMax).toFixed(1);

    // small noise around this character
    for (let n = 0; n < charNoise; n++) {
      const nx = x + (Math.random() * 16 - 8);
      const ny = y + (Math.random() * 16 - 8);
      parts.push(
        `<circle cx="${nx}" cy="${ny}" r="${1 + Math.random()}" fill="${fg}" opacity="0.3"/>`
      );
    }

    parts.push(
      `<text x="${x}" y="${y}" font-size="${fontSize}" fill="${fg}" font-family="${fontFamily}" transform="rotate(${rotate} ${x} ${y})">${ch}</text>`
    );
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${parts.join("")}
  </svg>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const secret = env.CAPTCHA_SECRET;
    const cf = request.cf || {};

    if (!secret) {
      return new Response("Server misconfigured: CAPTCHA_SECRET is missing", { status: 500 });
    }

    if (url.pathname === "/captcha") {
      const type = url.searchParams.get("type") || "chars";
      const themeOverride = url.searchParams.get("theme");
      const theme = pickTheme(cf, themeOverride);
      const len = numParam(url, "len") || 5;

      const opts = {
        width: numParam(url, "w"),
        height: numParam(url, "h"),
        bg: url.searchParams.get("bg") || undefined,
        fg: url.searchParams.get("fg") || undefined,
        fontSize: numParam(url, "fs"),
        fontFamily: url.searchParams.get("ff") || undefined,
        lineCount: numParam(url, "lc"),
        lineOpacity: numParam(url, "lo"),
        arcCount: numParam(url, "ac"),
        charSpacing: numParam(url, "cs"),
        jitterY: numParam(url, "jy"),
        rotateMax: numParam(url, "rm"),
        paddingLeft: numParam(url, "pl"),
        dotGrid: url.searchParams.get("dg") === "1",
        dotGridStep: numParam(url, "dgs"),
        dotGridRadius: numParam(url, "dgr"),
        dotGridOpacity: numParam(url, "dgo"),
        scatterDots: numParam(url, "sd"),
        scatterRadius: numParam(url, "sr"),
        scatterOpacity: numParam(url, "so"),
        wavyLines: numParam(url, "wl"),
        wavyOpacity: numParam(url, "wo"),
        hatchLines: numParam(url, "hl"),
        hatchOpacity: numParam(url, "ho"),
        charNoise: numParam(url, "cn"),
      };
      Object.keys(opts).forEach((k) => opts[k] === undefined && delete opts[k]);

      const { question, answer, type: actualType } = generateChallenge(type, len);
      // Client can request a custom expiry in minutes, clamped to 1–10
      const rawExp = numParam(url, "expmnt");
      const safeExp = Number.isFinite(rawExp) ? rawExp : 1;
      const minutes = Math.min(Math.max(safeExp, 1), 10);
      const exp = Date.now() + minutes * 60 * 1000;

      const payload = `${answer}|${exp}|${actualType}|${theme}`;
      const sig = await sign(payload, secret);
      const token = `${b64url(payload)}.${sig}`;

      const svg = captchaSvg(question, theme, opts);

      return new Response(
        JSON.stringify({
          token,
          type: actualType,
          theme,
          svg,
        }),
        {
          headers: { "content-type": "application/json; charset=utf-8" },
        }
      );
    }

    if (url.pathname === "/verify" && request.method === "POST") {
      const body = await request.json();
      const { token, answer } = body;

      if (!token || answer === undefined) {
        return new Response(
          JSON.stringify({ ok: false, error: "missing token or answer" }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      const [payloadB64, sig] = token.split(".");
      if (!payloadB64 || !sig) {
        return new Response(
          JSON.stringify({ ok: false, error: "malformed token" }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      const payload = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
      const expectedSig = await sign(payload, secret);

      if (!safeEqual(sig, expectedSig)) {
        return new Response(
          JSON.stringify({ ok: false, error: "invalid signature" }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }

      const [expectedAnswer, expStr, type, theme] = payload.split("|");
      if (Date.now() > parseInt(expStr, 10)) {
        return new Response(
          JSON.stringify({ ok: false, error: "token expired" }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }

      const normalizedAnswer = type === "chars" ? String(answer).toUpperCase() : String(answer);
      const normalizedExpected = type === "chars" ? expectedAnswer.toUpperCase() : expectedAnswer;
      const ok = normalizedAnswer === normalizedExpected;
      return new Response(JSON.stringify({ ok, type, theme }), {
        headers: { "content-type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
