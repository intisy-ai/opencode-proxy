// The in-process (no-daemon) transport of this app front-door: run the shared engine's serveIr over
// this app's profile + translator against a provider's injected handleIr. Same profile the daemon
// uses, so the two transports encode identically.

import { serveIr, type ServeIrOptions } from "../core-proxy/dist/index.js";
import { opencodeProfile } from "./profiles/opencode.js";

export function serveDirect(request: Request, handleIr: ServeIrOptions["handleIr"], ctx: ServeIrOptions["ctx"]): Promise<Response> {
  return serveIr(request, { profile: opencodeProfile(), handleIr, ctx });
}
