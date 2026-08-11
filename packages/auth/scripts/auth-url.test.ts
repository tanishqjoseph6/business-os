import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAuthCallbackUrl,
  getCallbackOrigin,
  sanitizeAuthNextPath,
} from "../src/site-url.ts";

test("sanitizeAuthNextPath accepts only relative app paths", () => {
  assert.equal(sanitizeAuthNextPath("/dashboard"), "/dashboard");
  assert.equal(sanitizeAuthNextPath("/crm/contacts"), "/crm/contacts");
  assert.equal(sanitizeAuthNextPath("https://evil.test"), "/dashboard");
  assert.equal(sanitizeAuthNextPath("//evil.test"), "/dashboard");
  assert.equal(sanitizeAuthNextPath(null), "/dashboard");
});

test("buildAuthCallbackUrl encodes next path", () => {
  assert.equal(
    buildAuthCallbackUrl("/dashboard", "https://vanderbase.com"),
    "https://vanderbase.com/auth/callback?next=%2Fdashboard",
  );
});

test("getCallbackOrigin uses the request host, never rewrites www↔apex", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://vanderbase.com";

  const apex = getCallbackOrigin({
    nextUrl: { origin: "https://vanderbase.com" },
    headers: {
      get(name: string) {
        if (name === "x-forwarded-host") return "vanderbase.com";
        if (name === "x-forwarded-proto") return "https";
        if (name === "host") return "vanderbase.com";
        return null;
      },
    },
  });
  assert.equal(apex, "https://vanderbase.com");

  const www = getCallbackOrigin({
    nextUrl: { origin: "https://www.vanderbase.com" },
    headers: {
      get(name: string) {
        if (name === "x-forwarded-host") return "www.vanderbase.com";
        if (name === "x-forwarded-proto") return "https";
        if (name === "host") return "www.vanderbase.com";
        return null;
      },
    },
  });
  // Must stay on www so host-only cookies match Location.
  assert.equal(www, "https://www.vanderbase.com");
});
