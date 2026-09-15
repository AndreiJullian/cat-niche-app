const CAT_API = "https://api.thecatapi.com/v1";

export default async (req) => {
  const apiKey = process.env.CAT_API_KEY;

  if (!apiKey) {
    return json({
      error: "CAT_API_KEY is not configured. Add your The Cat API key in Netlify environment variables."
    }, 500);
  }

  const url = new URL(req.url);
  const route = url.pathname.split("/").pop();
  const params = new URLSearchParams(url.search);

  let target;

  try {
    if (route === "breeds") {
      target = `${CAT_API}/breeds`;
    } else if (route === "images") {
      const breedId = params.get("breed_id");
      const limit = Math.min(Number(params.get("limit") || 3), 5);
      target = new URL(`${CAT_API}/images/search`);
      target.searchParams.set("limit", String(limit));
      target.searchParams.set("has_breeds", "true");
      target.searchParams.set("size", "med");
      if (breedId) target.searchParams.set("breed_ids", breedId);
      target = target.toString();
    } else if (route === "random") {
      const limit = Math.min(Number(params.get("limit") || 3), 5);
      target = `${CAT_API}/images/search?limit=${limit}&has_breeds=true&size=med&order=RANDOM`;
    } else {
      return json({ error: "Unknown API route." }, 404);
    }

    const response = await fetch(target, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Accept": "application/json"
      }
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || "The Cat API returned an invalid response." };
    }

    if (!response.ok) {
      return json({
        error: data?.message || data?.error || `The Cat API returned HTTP ${response.status}.`
      }, response.status);
    }

    return json(data, 200);
  } catch (error) {
    console.error("Cat API error:", error);
    return json({ error: "Unable to reach The Cat API right now." }, 502);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
