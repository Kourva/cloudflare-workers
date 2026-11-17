export default {
  async fetch(request) {
    const url = new URL(request.url);
    const entries = [...url.searchParams.entries()];

    // Limit count (max 10)
    if (entries.length === 0 || entries.length > 10) {
      return new Response(
        JSON.stringify({ error: "Provide 1-10 key=url pairs" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Concurrently fetch all target URLs
    const results = await Promise.all(
      entries.map(async ([key, targetUrl]) => {
        try {
          const res = await fetch(targetUrl);
          const data = await res.json();
          return [key, data];
        } catch (err) {
          return [key, { error: err.message, url: targetUrl }];
        }
      })
    );

    // Assemble into object
    const output = Object.fromEntries(results);

    return new Response(JSON.stringify(output), {
      headers: { "content-type": "application/json;charset=UTF-8" },
    });
  },
};
