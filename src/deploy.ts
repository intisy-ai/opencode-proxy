// Deploys the built front-door adapter to a generic, app-agnostic home path that
// core-auth (in each provider) resolves at runtime as the injected AppFrontDoor.
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

/**
 * Where the front-door adapter lands in one home.
 *
 * @remarks
 * A generic path rather than one naming this app, because what resolves it at run time is
 * `core-auth` inside each provider, which may name no app.
 *
 * @param configDir the home to deploy into.
 * @returns the absolute path of the deployed adapter.
 */
export function frontDoorDeployPath(configDir: string): string {
  return join(configDir, "frontdoor", "app-frontdoor.mjs");
}

// dist/frontdoor.mjs sits beside this module once compiled (dist/deploy.js); when
// running from source under vitest it lives one level up, in the sibling dist/.
function builtFrontDoorSource(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [join(here, "frontdoor.mjs"), join(here, "..", "dist", "frontdoor.mjs")];
  return candidates.find((path) => existsSync(path)) ?? candidates[0];
}

/**
 * Copies the built adapter to that path, creating the directory if it is not there.
 *
 * @param configDir the home to deploy into.
 * @returns where it landed.
 */
export function deployFrontDoor(configDir: string): string {
  const dest = frontDoorDeployPath(configDir);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(builtFrontDoorSource(), dest);
  return dest;
}
