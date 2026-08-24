import { expect, it } from "vitest";
import { opencodeProfile } from "./opencode.js";
import { isValidProfile } from "@intisy-ai/core-proxy";

it("opencodeProfile: passes isValidProfile", () => {
  expect(isValidProfile(opencodeProfile())).toBe(true);
});

it("opencodeProfile: returns the expected configFile/envPrefix, with empty tiers and a never-matching tierRegex", () => {
  const profile = opencodeProfile();
  expect(profile.configFile).toBe("opencode-loader.json");
  expect(profile.routingKey).toBe("providerRouting");
  expect(profile.tierSourceProvider).toBe("opencode");
  expect(profile.tierOrder).toEqual([]);
  expect(profile.tierFallback).toEqual([]);
  expect(profile.envPrefix).toBe("OPENCODE");
  expect(profile.defaultContext).toBe(200000);
  expect(profile.defaultOutput).toBe(64000);
  expect(profile.tierRegex.test("claude-sonnet-4")).toBe(false);
  expect(profile.tierRegex.test("anything")).toBe(false);
  expect(profile.nativeModelPattern?.test("claude-opus-4")).toBe(false);
});

it("opencodeProfile: nativeRateLimit passes the upstream provider's 429 through verbatim", async () => {
  const profile = opencodeProfile();
  const upstream = new Response(JSON.stringify({ error: "upstream says no" }), {
    status: 429,
    headers: { "retry-after": "17", "x-upstream-marker": "openai" },
  });

  const built = await profile.nativeRateLimit({ resetMs: Date.now() + 5000, upstream });

  expect(built.status).toBe(429);
  expect(built.headers["retry-after"]).toBe("17");
  expect(built.headers["x-upstream-marker"]).toBe("openai");
  expect(built.body).toBe(JSON.stringify({ error: "upstream says no" }));
});

it("opencodeProfile: nativeRateLimit falls back to a generic rate_limit_error body when there is no upstream response", async () => {
  const profile = opencodeProfile();
  const built = await profile.nativeRateLimit({ resetMs: Date.now() + 5000, upstream: null });

  expect(built.status).toBe(429);
  expect(built.headers["content-type"]).toBe("application/json");
  const parsed = JSON.parse(built.body);
  expect(parsed.type).toBe("error");
  expect(parsed.error.type).toBe("rate_limit_error");
});

it("opencodeProfile: overrides are spread on top of the defaults", () => {
  const profile = opencodeProfile({ envPrefix: "X" });
  expect(profile.envPrefix).toBe("X");
  expect(profile.configFile).toBe("opencode-loader.json");
});
