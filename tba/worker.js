export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "") {
      return new Response("OK", { status: 200 });
    }

    if (url.searchParams.get("key") !== env.PROXY_KEY) {
      return new Response("Forbidden", { status: 403 });
    }

    // Remove the key before forwarding
    url.searchParams.delete("key");

    return fetch(`https://api.telegram.org${url.pathname}${url.search}`, request);
  },
};
