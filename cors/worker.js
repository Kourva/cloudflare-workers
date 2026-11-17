export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("target");

    // No target parameter: return usage instructions
    if (!targetUrl) {
      return new Response("Usage: /?target=https://api.example.com/data", { status: 400 });
    }

    // Handle OPTIONS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Forward the request to the target URL
    const modifiedRequest = new Request(targetUrl, request);
    let response = await fetch(modifiedRequest);

    // Recreate the response and add CORS headers
    response = new Response(response.body, response);
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Vary", "Origin");

    return response;
  },
};
