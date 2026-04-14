const UPSTREAM = "https://rail-api.rail.co.il/common/api/v1/TripReservation";

exports.handler = async (event) => {
  const tail = event.path.replace(/^\/rail-api\/?/, "");
  const url = `${UPSTREAM}/${tail}`;

  const upstreamHeaders = {
    "Content-Type": "application/json",
    "Origin": "https://www.rail.co.il",
    "Referer": "https://www.rail.co.il/",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Ocp-Apim-Subscription-Key": "5e64d66cf03f4547bcac5de2de06b566",
  };

  if (event.headers.cookie) {
    upstreamHeaders["Cookie"] = event.headers.cookie;
  }

  const res = await fetch(url, {
    method: event.httpMethod,
    headers: upstreamHeaders,
    body: event.body || undefined,
  });

  const body = await res.text();
  const headers = { "Content-Type": "application/json" };
  const multiValueHeaders = {};

  const setCookies = res.headers.getSetCookie?.();
  if (setCookies?.length) {
    multiValueHeaders["Set-Cookie"] = setCookies;
  } else {
    const sc = res.headers.get("set-cookie");
    if (sc) headers["Set-Cookie"] = sc;
  }

  return { statusCode: res.status, headers, multiValueHeaders, body };
};
