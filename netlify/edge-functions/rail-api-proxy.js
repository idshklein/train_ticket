const UPSTREAM = "https://rail-api.rail.co.il/common/api/v1/TripReservation";

function extractTailFromPath(pathname = "") {
  return String(pathname)
    .replace(/^\/rail-api\/?/, "")
    .replace(/^\/+/, "");
}

function buildUpstreamUrl(pathname = "") {
  const tail = extractTailFromPath(pathname);
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

export default async (request) => {
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
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("Cache-Control", "no-store");

  return new Response(responseBody, {
    status: response.status,
    headers: responseHeaders,
  });
};
