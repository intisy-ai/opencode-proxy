package io.github.intisy.ai.opencodeproxy;

import io.github.intisy.ai.shared.routing.ProxyPlugin;
import io.github.intisy.ai.shared.routing.RateLimitInfo;
import io.github.intisy.ai.shared.routing.RoutingProfile;
import io.github.intisy.ai.api.seam.HttpResponse;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.regex.Pattern;

/**
 * The opencode ProxyPlugin: a PASSTHROUGH proxy exposing every installed provider's models to
 * opencode. No tiers (unlike claude-code-proxy), the core-proxy Router serves each requested model
 * by direct catalog match across all providers, and /v1/models aggregates the whole catalog. The
 * profile carries empty tiers + a never-match tierRegex so no tier UI is rendered, and a passthrough
 * nativeRateLimit that returns the upstream provider's own response (opencode is provider-agnostic,
 * nothing Anthropic/Claude-specific here).
 */
public final class OpencodeProxyPlugin implements ProxyPlugin {
    private static final Pattern NEVER = Pattern.compile("(?!)");

    @Override
    public String id() {
        return "opencode";
    }

    @Override
    public String displayName() {
        return "OpenCode";
    }

    @Override
    public RoutingProfile profile() {
        RoutingProfile p = new RoutingProfile();
        p.configFile = "opencode-loader.json";
        p.routingKey = "providerRouting";
        p.tierSourceProvider = "opencode";
        p.tierOrder = new ArrayList<>();      // no tiers -> no dashboard Routing UI
        p.tierFallback = new ArrayList<>();
        p.tierRegex = NEVER;                  // never matches -> resolveTiers finds nothing
        p.nativeModelPattern = null;
        p.envPrefix = "OPENCODE";
        p.defaultContext = 200000;
        p.defaultOutput = 64000;
        p.nativeRateLimit = OpencodeProxyPlugin::passthrough;
        return p;
    }

    // Passthrough: hand back the upstream provider's own rate-limit response unchanged (opencode is
    // provider-agnostic). Only when there is no upstream at all do we emit a minimal generic 429.
    private static RoutingProfile.Synth passthrough(RateLimitInfo info) {
        RoutingProfile.Synth s = new RoutingProfile.Synth();
        HttpResponse up = info != null ? info.upstream : null;
        if (up != null) {
            s.status = up.status;
            s.headers = up.headers != null ? up.headers : new LinkedHashMap<>();
            s.body = up.body != null ? up.body : "";
        } else {
            s.status = 429;
            s.headers = new LinkedHashMap<>();
            s.body = "{\"type\":\"error\",\"error\":{\"type\":\"rate_limit_error\",\"message\":\"rate limited\"}}";
        }
        return s;
    }
}
