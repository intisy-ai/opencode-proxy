// The OpenCode RoutingProfile: config file, tier detection, and env-var naming
// for the opencode tier source, plus the native Anthropic-shaped 429 the proxy
// synthesizes once every model in a tier's chain is rate-limited.
// (Mirrors claude-code-proxy's anthropicProfile — OpenCode consumes it via an
// @ai-sdk/anthropic custom provider baseURL, so it expects the same Anthropic
// /v1/messages format and the same Anthropic-shaped 429 error body/headers.
// nativeRateLimit is copied verbatim from anthropicProfile: the
// reset-reconciliation-with-upstream and message/retry-after math is unchanged.)

import type { RateLimitInfo, RoutingProfile } from "../../core-proxy/dist/index.js";

async function nativeRateLimit(info: RateLimitInfo): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  const upstream = info.upstream;
  let reset = info.resetMs || 0;
  const headers: Record<string, string> = {};

  if (upstream && upstream.status === 429) {
    for (const [k, v] of upstream.headers) headers[k] = v;
    delete headers["content-encoding"];
    delete headers["content-length"];
    delete headers["x-hub-rate-limited"];
    delete headers["x-hub-retry-after-ms"];
    for (const k of ["anthropic-ratelimit-unified-5h-reset", "anthropic-ratelimit-unified-reset"]) {
      const s = parseInt(headers[k], 10);
      if (!Number.isNaN(s) && s * 1000 > reset) reset = s * 1000;
    }
  }

  // Mimic Claude Code's own rate-limit wording (absolute reset time). Claude still
  // prepends "API Error: Request rejected (429) · " for any proxied 429 — that
  // prefix is Claude's, not ours, and can't be removed while routing through the proxy.
  let when: string | null = null;
  try {
    if (reset > Date.now()) when = new Date(reset).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  } catch {}
  const message = when ? "You've hit your usage limit · resets at " + when : "You've hit your usage limit · try again later";

  headers["content-type"] = "application/json";
  // `retry-after` is owned entirely by this profile — never copied through from a raw
  // upstream 429 (see rate-limit.ts `rateLimitFinal`). Recomputed from `reset` at call
  // time so it reflects wall-clock time-to-reset, not the moment resetMs was captured.
  headers["retry-after"] = String(reset > Date.now() ? Math.round((reset - Date.now()) / 1000) : 60);
  if (!headers["anthropic-ratelimit-unified-status"]) headers["anthropic-ratelimit-unified-status"] = "rejected";
  if (!headers["anthropic-ratelimit-unified-reset"]) headers["anthropic-ratelimit-unified-reset"] = String(Math.floor((reset || Date.now()) / 1000));

  const body = JSON.stringify({ type: "error", error: { type: "rate_limit_error", message } });
  return { status: 429, headers, body };
}

const OPENCODE_PROFILE: RoutingProfile = {
  configFile: "opencode-loader.json",
  routingKey: "providerRouting",
  tierSourceProvider: "opencode",
  tierOrder: ["opus", "sonnet", "haiku", "fable"],
  tierFallback: ["opus", "sonnet", "haiku"],
  tierRegex: /^claude-([a-z]+)-\d/,
  nativeModelPattern: /^claude-/,
  envPrefix: "OPENCODE",
  defaultContext: 200000,
  defaultOutput: 64000,
  nativeRateLimit,
};

export function opencodeProfile(overrides?: Partial<RoutingProfile>): RoutingProfile {
  return { ...OPENCODE_PROFILE, ...overrides };
}
