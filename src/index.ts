export * from "@intisy-ai/core-proxy";
export { opencodeProfile } from "./profiles/opencode.js";
export { serveDirect } from "./serve-direct.js";
export { appFrontDoor } from "./frontdoor.js";
export { frontDoorDeployPath, deployFrontDoor } from "./deploy.js";
export { activate } from "./plugin.js";
export { default } from "./plugin.js";

import { opencodeProfile } from "./profiles/opencode.js";
import type { RoutingProfile } from "@intisy-ai/core-proxy";

/** What a host needs to offer this app as a proxy target: who it is, and how to point it here. */
export const proxyDef: {
  /** Which app this proxy serves. */
  app: "opencode";
  /** What a surface calls it. */
  label: string;
  /** What an operator must do to point that app here. */
  setup: string;
  /** The routing profile it serves the app with. */
  profile: () => RoutingProfile;
} = {
  app: "opencode",
  label: "OpenCode",
  setup: "Point your OpenCode provider's baseURL at the local API base URL. The OpenCode loader configures this for you.",
  profile: opencodeProfile,
};
