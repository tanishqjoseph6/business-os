import assert from "node:assert/strict";
import test from "node:test";
import {
  PRODUCTION_CANONICAL_ORIGIN,
  buildAuthCallbackUrl,
  canonicalizeSiteOrigin,
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

test("buildAuthCallbackUrl encodes next path and canonicalizes apex → www", () => {
  assert.equal(
    buildAuthCallbackUrl("/dashboard", "https://www.vanderbase.com"),
    "https://www.vanderbase.com/auth/callback?next=%2Fdashboard",
  );
  assert.equal(
    buildAuthCallbackUrl("/dashboard", "https://vanderbase.com"),
    "https://www.vanderbase.com/auth/callback?next=%2Fdashboard",
  );
});

test("canonicalizeSiteOrigin maps apex to www", () => {
  assert.equal(
    canonicalizeSiteOrigin("https://vanderbase.com"),
    PRODUCTION_CANONICAL_ORIGIN,
  );
  assert.equal(
    canonicalizeSiteOrigin("https://www.vanderbase.com/"),
    PRODUCTION_CANONICAL_ORIGIN,
  );
});

test("getCallbackOrigin prefers request host and canonicalizes apex → www", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://www.vanderbase.com";

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
  // Apex is never the app host in production (Vercel 308 → www).
  assert.equal(apex, PRODUCTION_CANONICAL_ORIGIN);

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
  assert.equal(www, PRODUCTION_CANONICAL_ORIGIN);
});
