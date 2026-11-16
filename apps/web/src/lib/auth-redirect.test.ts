import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  loginHref,
  parseAuthIntent,
  postAuthDestination,
  readAuthReturn,
  registerHref,
  safeNextPath,
  takeIntentFromUrl,
} from "./auth-redirect.ts";

describe("safeNextPath", () => {
  it("accepts same-origin relative paths, keeping query and hash", () => {
    assert.equal(safeNextPath("/listings/abc"), "/listings/abc");
    assert.equal(safeNextPath("/listings?city=Pune#top"), "/listings?city=Pune#top");
  });

  it("rejects absolute, protocol-relative and scheme URLs", () => {
    for (const bad of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "javascript:alert(1)",
      "evil.example",
      "",
    ]) {
      assert.equal(safeNextPath(bad), null, bad);
    }
  });

  it("rejects control characters and backslashes", () => {
    assert.equal(safeNextPath("/\t/evil.example"), null);
    assert.equal(safeNextPath("/a\\b"), null);
    assert.equal(safeNextPath("/a\nb"), null);
  });

  it("rejects oversized values and non-strings", () => {
    assert.equal(safeNextPath("/" + "a".repeat(2048)), null);
    assert.equal(safeNextPath(null), null);
    assert.equal(safeNextPath(undefined), null);
  });

  it("refuses to bounce back to the auth pages", () => {
    assert.equal(safeNextPath("/login"), null);
    assert.equal(safeNextPath("/register?next=/x"), null);
  });
});

describe("intents", () => {
  it("only honours allowlisted intents", () => {
    assert.equal(parseAuthIntent("save"), "save");
    assert.equal(parseAuthIntent("contact"), "contact");
    assert.equal(parseAuthIntent("delete-everything"), null);
    assert.equal(parseAuthIntent(null), null);
  });

  it("builds login and register links with next and intent", () => {
    assert.equal(loginHref("/listings/a", "save"), "/login?next=%2Flistings%2Fa&intent=save");
    assert.equal(registerHref("/listings/a"), "/register?next=%2Flistings%2Fa");
  });

  it("drops an unsafe next (and its intent) from built links", () => {
    assert.equal(loginHref("https://evil.example", "save"), "/login");
  });

  it("ignores an intent that has no safe next", () => {
    assert.deepEqual(readAuthReturn("?intent=save"), { next: null, intent: null });
    assert.deepEqual(readAuthReturn("?next=%2Fa&intent=save"), { next: "/a", intent: "save" });
    assert.deepEqual(readAuthReturn("?next=%2F%2Fevil.example"), { next: null, intent: null });
  });
});

describe("postAuthDestination", () => {
  it("falls back when next is unsafe or missing", () => {
    assert.equal(postAuthDestination(null, null, "/account"), "/account");
    assert.equal(postAuthDestination("//evil.example", "save", "/account"), "/account");
  });

  it("appends the intent, replacing an existing one", () => {
    assert.equal(postAuthDestination("/listings/a", "save", "/account"), "/listings/a?intent=save");
    assert.equal(
      postAuthDestination("/listings/a?intent=contact", "save", "/account"),
      "/listings/a?intent=save",
    );
    assert.equal(postAuthDestination("/listings/a", null, "/account"), "/listings/a");
  });
});

describe("takeIntentFromUrl", () => {
  it("strips the intent so it can't re-run on refresh", () => {
    assert.deepEqual(takeIntentFromUrl("/listings/a", "?intent=save&x=1", "#h"), {
      intent: "save",
      cleanUrl: "/listings/a?x=1#h",
    });
  });

  it("strips an unknown intent but reports none", () => {
    assert.deepEqual(takeIntentFromUrl("/listings/a", "?intent=nope"), {
      intent: null,
      cleanUrl: "/listings/a",
    });
  });

  it("does nothing when there is no intent", () => {
    assert.deepEqual(takeIntentFromUrl("/listings/a", "?x=1"), { intent: null, cleanUrl: null });
  });
});
