const UPSTREAM = "https://rail-api.rail.co.il/common/api/v1/TripReservation";
const ALLOWED_ORIGIN = "https://teal-custard-16f3ac.netlify.app";

function buildUpstreamUrl(pathname = "") {
  const tail = String(pathname).replace(/^\/+/, "");
  return tail ? `${UPSTREAM}/${tail}` : UPSTREAM;
}

function buildUpstreamHeaders(cookieHeader) {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
    "Origin": "https://www.rail.co.il",
    "Referer": "https://www.rail.co.il/",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Sec-Fetch-Site": "same-site",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    "Ocp-Apim-Subscription-Key": "5e64d66cf03f4547bcac5de2de06b566",
  });

  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  return headers;
}

function corsHeaders(origin) {
  const allowed = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);
    const upstreamUrl = buildUpstreamUrl(url.pathname);
    const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();

    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers: buildUpstreamHeaders(request.headers.get("cookie")),
      body,
      redirect: "follow",
    });

    const responseBody = await response.text();
    const responseHeaders = new Headers(corsHeaders(origin));
    responseHeaders.set("Cache-Control", "no-store");
    responseHeaders.set("Content-Type", response.headers.get("content-type") || "application/json");

    const setCookies = response.headers.getAll?.("set-cookie") ?? [];
    for (const cookie of setCookies) {
      responseHeaders.append("Set-Cookie", cookie);
    }

    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  },
};
