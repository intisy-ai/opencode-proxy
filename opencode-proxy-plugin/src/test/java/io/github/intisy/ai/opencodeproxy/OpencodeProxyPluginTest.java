package io.github.intisy.ai.opencodeproxy;

import io.github.intisy.ai.shared.routing.ProxyPlugin;
import io.github.intisy.ai.shared.routing.RateLimitInfo;
import io.github.intisy.ai.shared.routing.RoutingProfile;
import io.github.intisy.ai.api.seam.HttpResponse;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OpencodeProxyPluginTest {
    @Test
    void identityAndValidPassthroughProfile() {
        ProxyPlugin p = new OpencodeProxyPlugin();
        assertEquals("opencode", p.id());
        assertNotNull(p.displayName());
        RoutingProfile prof = p.profile();
        assertTrue(RoutingProfile.isValid(prof), "passthrough profile must still be a valid RoutingProfile");
        // NO tiers -> the dashboard renders no Routing UI for opencode.
        assertTrue(prof.tierOrder.isEmpty(), "opencode has no tiers");
        assertTrue(prof.tierFallback.isEmpty(), "opencode has no tier fallback");
    }

    @Test
    void nativeRateLimit_passesUpstreamThrough() {
        RoutingProfile prof = new OpencodeProxyPlugin().profile();
        HttpResponse up = new HttpResponse();
        up.status = 429;
        up.headers = new LinkedHashMap<>();
        up.headers.put("retry-after", "42");
        up.body = "{\"provider\":\"native-429\"}";
        RateLimitInfo info = new RateLimitInfo();
        info.upstream = up;
        info.resetMs = 0;

        RoutingProfile.Synth s = prof.nativeRateLimit.build(info);
        assertEquals(429, s.status);
        assertEquals("42", s.headers.get("retry-after"));   // upstream returned verbatim, not re-synthesized
        assertTrue(s.body.contains("native-429"));
    }
}
