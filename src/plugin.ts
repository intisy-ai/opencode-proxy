// OpenCode plugin entry: on load, (re)deploy the front-door adapter to the generic home path so
// core-auth (in each provider) resolves it. Backstop for the install-time deploy
// (scripts/postbuild-deploy.mjs); both are idempotent. Self-contained (no core-* submodule) since
// opencode-proxy nests none.
import { homedir } from "os";
import { join } from "path";
import { deployFrontDoor } from "./deploy.js";

function configDir(): string {
  return process.env.HUB_CONFIG_DIR ?? join(homedir(), ".config", "opencode");
}

export async function activate() {
  try {
    deployFrontDoor(configDir());
  } catch {
    /* best-effort: OpenCode still starts even if the deploy fails */
  }
  return {};
}

export default activate;
