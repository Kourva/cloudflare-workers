export default {
  async fetch(request) {
    const cf = request.cf || {};
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";

    // RTT: treat 0 or null as "unknown"
    const rawRtt = cf.clientTcpRtt ?? cf.clientQuicRtt ?? null;
    const rtt = rawRtt === null || rawRtt === 0 ? null : rawRtt;
    const connectionQuality =
      rtt === null ? "unknown" : rtt < 100 ? "excellent" : rtt < 300 ? "good" : "poor";

    // TLS details are only trustworthy when the handshake fields are populated
    const hasTlsDetails = !!(cf.tlsClientCiphersSha1 && cf.tlsClientCiphersSha1.length > 0);

    // mTLS: collapse the large tlsClientAuth object into a boolean
    const mtlsPresented = cf.tlsClientAuth?.certPresented === "1";

    // ASN heuristic (same idea as before, kept for routing convenience)
    const asOrg = (cf.asOrganization || "").toLowerCase();
    let networkHint = "unknown";
    if (asOrg.includes("vpn") || asOrg.includes("proxy") || asOrg.includes("tor")) {
      networkHint = "privacy-network";
    } else if (asOrg.includes("hosting") || asOrg.includes("cloud") || asOrg.includes("datacenter")) {
      networkHint = "datacenter";
    } else if (asOrg.includes("mobile") || asOrg.includes("lte") || asOrg.includes("5g")) {
      networkHint = "mobile";
    } else if (asOrg) {
      networkHint = "residential-or-unknown";
    }

    const info = {
      ...cf, // full Cloudflare edge object
      ip,
      userAgent: request.headers.get("User-Agent") || null,
      acceptLanguage: request.headers.get("Accept-Language") || null,

      // Derived flags
      isTorByCf: cf.country === "T1",
      connectionQuality,
      rttMs: rtt,
      hasTlsDetails,
      mtlsPresented,
      networkHint,

      // Aggregated summaries
      tlsProfile: {
        version: cf.tlsVersion || null,
        cipher: cf.tlsCipher || null,
        ciphersHash: cf.tlsClientCiphersSha1 || null,
        extensionsHash: cf.tlsClientExtensionsSha1 || null,
        hasDetails: hasTlsDetails,
      },
      protocolHint: {
        http: cf.httpProtocol || null,
        priority: cf.requestPriority || null,
        isEU: cf.isEUCountry === "1",
      },
    };

    return new Response(JSON.stringify(info, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  },
};
