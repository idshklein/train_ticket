const UPSTREAM = "https://rail-api.rail.co.il/common/api/v1/TripReservation";

function extractTailFromPath(path = "") {
  return String(path)
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/rail-api\/?/, "")
    .replace(/^\/\.netlify\/functions\/rail-proxy\/?/, "")
    .replace(/^\/+/, "");
}

function buildUpstreamUrl(path = "") {
  const tail = extractTailFromPath(path);
  return tail ? `${UPSTREAM}/${tail}` : UPSTREAM;
}

function buildUpstreamHeaders(cookieHeader) {
  const headers = {
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
  };

  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }

  return headers;
}

async function handler(event) {
  const cookieHeader = event.headers?.cookie || event.headers?.Cookie;
  const url = buildUpstreamUrl(event.path || event.rawUrl || "");
  const upstreamHeaders = buildUpstreamHeaders(cookieHeader);

  const res = await fetch(url, {
    method: event.httpMethod,
    headers: upstreamHeaders,
    body: event.body || undefined,
    redirect: "follow",
  });

  const body = await res.text();
  const headers = {
    "Content-Type": res.headers.get("content-type") || "application/json",
    "Cache-Control": "no-store",
  };
  const multiValueHeaders = {};

  const setCookies = res.headers.getSetCookie?.();
  if (setCookies?.length) {
    multiValueHeaders["Set-Cookie"] = setCookies;
  } else {
    const sc = res.headers.get("set-cookie");
    if (sc) headers["Set-Cookie"] = sc;
  }

  return { statusCode: res.status, headers, multiValueHeaders, body };
}

module.exports = {
  handler,
  extractTailFromPath,
  buildUpstreamUrl,
  buildUpstreamHeaders,
};
