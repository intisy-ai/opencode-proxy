import { describe, it, expect } from "vitest";
import { mkdtempSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { frontDoorDeployPath, deployFrontDoor } from "../deploy.js";

describe("front-door deploy", () => {
  it("computes the generic deploy path (no app name)", () => {
    expect(frontDoorDeployPath("/home/.config/opencode")).toBe(join("/home/.config/opencode", "frontdoor", "app-frontdoor.mjs"));
  });
  it("copies the built adapter to the generic path idempotently", () => {
    const home = mkdtempSync(join(tmpdir(), "fd-"));
    // simulate a built dist/frontdoor.mjs next to the module
    deployFrontDoor(home);
    expect(existsSync(frontDoorDeployPath(home))).toBe(true);
    deployFrontDoor(home); // idempotent, no throw
    expect(existsSync(frontDoorDeployPath(home))).toBe(true);
  });
});
