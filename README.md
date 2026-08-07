# opencode-proxy

The OpenCode proxy layer on top of the generic `core-proxy` engine.
It provides `opencodeProfile` (the config filename, tier order/fallback,
tier regex, env-var prefix, default context/output limits, and the native
Anthropic-shaped 429 response that the engine needs) to route requests for
OpenCode. OpenCode consumes it by pointing an `@ai-sdk/anthropic` custom
provider's `baseURL` at the proxy, so it talks the Anthropic `/v1/messages`
format and expects the Anthropic-shaped error body on rate limit, the same
contract `claude-code-proxy` already serves for Claude Code.

This is a **library repo consumed as a git submodule and compiled from
source** (the same treatment as `core` / `core-auth` / `core-loader` /
`core-proxy` / `claude-code-proxy`). A first version exists on npm as
`@intisy-ai/opencode-proxy`, but this repo's release workflow ships only the
JVM ProxyPlugin jar, so that package is not yet part of the release path.

This project carries **no generic engine code**; the routing engine
(`:34567` daemon, tier→provider chains, rate-limit fallback, model rewrite,
the node↔web request adapter) lives entirely in `core-proxy`, nested here as
a submodule. `opencode-proxy` only supplies the OpenCode-specific profile
that parameterizes that engine.

## Structure

- `core-proxy/`: the generic routing engine, nested as a git submodule
  (compiled separately into `core-proxy/dist`, excluded from this project's
  own `tsconfig.json`).
- `src/profiles/opencode.ts`: `opencodeProfile()`, the OpenCode
  `RoutingProfile` (config file, tier order/fallback, tier regex, env
  prefix, default context/output, `nativeRateLimit`).
- `src/index.ts`: the public barrel, re-exports the entire `core-proxy` API
  plus `opencodeProfile`, so consumers import everything from one place.
- `dist/`: compiled output (gitignored, never committed).

## Usage

```ts
import { createProxyServer, makeDynamicResolver, opencodeProfile } from "./opencode-proxy/dist/index.js";

const profile = opencodeProfile();
const resolveHandler = makeDynamicResolver(() =>
  listProviders().map((p) => ({ provider: p.provider, handlerPath: p.handlerPath }))
);
const server = createProxyServer({ configDir, profile, port: 34567, resolveHandler });
await server.listen();
```

## Consuming it from OpenCode

Once the proxy is running (dashboard-installed sidecar, listening on
`:34567`), OpenCode points a custom provider at it via an `@ai-sdk/anthropic`
`baseURL` override in its config, the same pattern already used by any
provider driver that sets `opencodeNpm: "@ai-sdk/anthropic"`:

```json
{
  "provider": {
    "opencode-proxy": {
      "npm": "@ai-sdk/anthropic",
      "options": { "baseURL": "http://127.0.0.1:34567" },
      "models": {
        "claude-opus-4": {},
        "claude-sonnet-4": {},
        "claude-haiku-4": {}
      }
    }
  }
}
```

Requests then flow: OpenCode → `@ai-sdk/anthropic` (Anthropic `/v1/messages`
wire format) → this proxy on `:34567` → `core-proxy`'s tier engine (tier
detection via `tierRegex`/`tierOrder`, rate-limit fallback across the tier's
provider chain, and, once every model in the chain is exhausted, the
Anthropic-shaped native 429 from `opencodeProfile`'s `nativeRateLimit`) → the
underlying provider(s).

## Testing

`npm run build && npx vitest run` builds the nested `core-proxy` engine
first, then this project's own `src`, then runs the `opencodeProfile` tests
plus a barrel smoke test asserting the re-exported surface.

## License

MIT
