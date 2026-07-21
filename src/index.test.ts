// This barrel re-exports "../core-proxy/dist/index.js", so this test can only run once
// core-proxy is built as a submodule; the import fails to resolve before that. Mirrors
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
