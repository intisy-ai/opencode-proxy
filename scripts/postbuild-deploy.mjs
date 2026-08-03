// Install-time deploy: when HUB_CONFIG_DIR is known (a loader-driven install or an explicit
// `npm run build` for a given app home), land the built front-door adapter at the generic
// path right after the build finishes, so it exists before OpenCode starts loading plugins.
// A no-op when HUB_CONFIG_DIR is unset (e.g. plain library builds, CI) so the build never fails.
import { deployFrontDoor } from "../dist/deploy.js";

const configDir = process.env.HUB_CONFIG_DIR;
if (configDir) {
  const dest = deployFrontDoor(configDir);
  console.log("[opencode-proxy] deployed front-door adapter to " + dest);
} else {
  console.log("[opencode-proxy] HUB_CONFIG_DIR not set, skipping install-time front-door deploy");
}
