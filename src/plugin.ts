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

/**
 * Redeploys the front-door adapter when this app loads its plugins.
 *
 * @remarks
 * A backstop for the install-time deploy, and idempotent like it: a home installed before that step
 * existed would otherwise never gain the adapter. A failure is swallowed, because the app must
 * still start.
 *
 * @returns nothing this host acts on.
 */
export async function activate() {
  try {
    deployFrontDoor(configDir());
  } catch {
    /* best-effort: OpenCode still starts even if the deploy fails */
  }
  return {};
}

/** The hook this app calls on load. */
export default activate;
