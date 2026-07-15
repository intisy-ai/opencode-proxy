// NOTE: this barrel re-exports "../core-proxy/dist/index.js" (src/index.ts), so
// this test can only run once the controller adds the core-proxy submodule and
// builds it (Task F) — the import itself fails to resolve before that. Mirrors
// claude-code-proxy's own index.test.ts, which has the identical dependency.
import { expect, it } from "vitest";
import { createProxyServer, makeDynamicResolver, resolveModelMap, opencodeProfile, isValidProfile } from "./index.js";

it("barrel: re-exports both the core-proxy engine and the opencode profile", () => {
  expect(typeof createProxyServer).toBe("function");
  expect(typeof makeDynamicResolver).toBe("function");
  expect(typeof resolveModelMap).toBe("function");
  expect(typeof opencodeProfile).toBe("function");
  expect(isValidProfile(opencodeProfile())).toBe(true);
});
