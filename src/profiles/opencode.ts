// The OpenCode RoutingProfile: a pure passthrough. OpenCode exposes every
// upstream provider's models directly (no Claude-style tiers) and routes by
// exact model-id match, so this profile carries an empty tier chain and a
// never-matching tierRegex (no Routing UI). nativeRateLimit forwards the
// upstream provider's own 429 response verbatim, it never synthesizes an
// Anthropic-shaped rate-limit body, because opencode has nothing to do with
// Claude/Anthropic.

import type { RateLimitInfo, RoutingProfile } from "@intisy-ai/core-proxy";
import { anthropicTranslator } from "@intisy-ai/anthropic-translator";

async function nativeRateLimit(info: RateLimitInfo): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  const upstream = info.upstream;
  if (upstream) {
    const headers: Record<string, string> = {};
    for (const [k, v] of upstream.headers) headers[k] = v;
    return { status: upstream.status, headers, body: await upstream.text() };
  }

  // No upstream response to pass through (every model in the chain failed before
  // reaching a provider), fall back to a minimal generic 429.
  return {
    status: 429,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "error", error: { type: "rate_limit_error", message: "rate limited" } }),
  };
}

const OPENCODE_PROFILE: RoutingProfile = {
  configFile: "opencode-loader.json",
  routingKey: "providerRouting",
  tierSourceProvider: "opencode",
  tierOrder: [],
  tierFallback: [],
  tierRegex: /(?!)/,
  nativeModelPattern: /(?!)/,
  envPrefix: "OPENCODE",
  defaultContext: 200000,
  defaultOutput: 64000,
  nativeRateLimit,
  // OpenCode speaks Anthropic wire too, so the IR front-door uses anthropic-translator's
  // AnthropicTranslator for this profile (server.ts's route() decodes/encodes through it).
  translator: anthropicTranslator,
};

/**
 * This app's routing profile: its tiers, its model patterns, and its rate-limit shape.
 *
 * @param overrides what a caller wants to differ, for a test or a variant deployment.
 * @returns the profile the engine routes with.
 */
export function opencodeProfile(overrides?: Partial<RoutingProfile>): RoutingProfile {
  return { ...OPENCODE_PROFILE, ...overrides };
}
