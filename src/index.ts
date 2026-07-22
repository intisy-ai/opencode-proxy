export * from "../core-proxy/dist/index.js";
export { opencodeProfile } from "./profiles/opencode.js";

import { opencodeProfile } from "./profiles/opencode.js";
import type { RoutingProfile } from "../core-proxy/dist/index.js";

export const proxyDef: { app: "opencode"; label: string; profile: () => RoutingProfile } = {
  app: "opencode",
  label: "OpenCode",
  profile: opencodeProfile,
};
