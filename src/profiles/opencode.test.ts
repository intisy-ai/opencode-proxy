import { expect, it } from "vitest";
import { opencodeProfile } from "./opencode.js";
import { isValidProfile } from "../../core-proxy/dist/index.js";

it("opencodeProfile: passes isValidProfile", () => {
  expect(isValidProfile(opencodeProfile())).toBe(true);
});

it("opencodeProfile: returns the expected configFile/tierOrder/envPrefix/tierRegex", () => {
  const profile = opencodeProfile();
  expect(profile.configFile).toBe("opencode-loader.json");
  expect(profile.routingKey).toBe("providerRouting");
  expect(profile.tierSourceProvider).toBe("opencode");
  expect(profile.tierOrder).toEqual(["opus", "sonnet", "haiku", "fable"]);
  expect(profile.tierFallback).toEqual(["opus", "sonnet", "haiku"]);
  expect(profile.envPrefix).toBe("OPENCODE");
  expect(profile.defaultContext).toBe(200000);
  expect(profile.defaultOutput).toBe(64000);
  expect(profile.tierRegex.test("claude-sonnet-4")).toBe(true);
  expect(profile.nativeModelPattern.test("claude-opus-4")).toBe(true);
});

it("opencodeProfile: nativeRateLimit produces a native rate_limit_error body with a retry-after header owned by the profile", async () => {
  const profile = opencodeProfile();
  const resetMs = Date.now() + 5000;
  const built = await profile.nativeRateLimit({ resetMs, upstream: null });

  expect(built.status).toBe(429);
  expect(built.headers["content-type"]).toBe("application/json");
  expect(built.body).toContain("rate_limit_error");

  const parsed = JSON.parse(built.body);
  expect(parsed.type).toBe("error");
  expect(parsed.error.type).toBe("rate_limit_error");

  // 5000ms -> ~5s; allow slack for wall-clock drift between resetMs capture and the call.
  const retryAfter = parseInt(built.headers["retry-after"], 10);
  expect(retryAfter).toBeGreaterThanOrEqual(4);
  expect(retryAfter).toBeLessThanOrEqual(5);
});

it("opencodeProfile: overrides are spread on top of the defaults", () => {
  const profile = opencodeProfile({ configFile: "custom.json" });
  expect(profile.configFile).toBe("custom.json");
  expect(profile.envPrefix).toBe("OPENCODE");
});
