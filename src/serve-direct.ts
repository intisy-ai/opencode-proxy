// The in-process (no-daemon) transport of this app front-door: run the shared engine's serveIr over
// this app's profile + translator against a provider's injected handleIr. Same profile the daemon
// uses, so the two transports encode identically.

import { serveIr, type ServeIrOptions } from "@intisy-ai/core-proxy";
import { opencodeProfile } from "./profiles/opencode.js";

/**
 * Answers one request in-process, with no proxy daemon in between.
 *
 * @param request the app's own wire request.
 * @param handleIr the provider that answers it, in canonical IR.
 * @param ctx what that provider is given alongside the request.
 * @returns the app's own wire response.
 */
export function serveDirect(request: Request, handleIr: ServeIrOptions["handleIr"], ctx: ServeIrOptions["ctx"]): Promise<Response> {
  return serveIr(request, { profile: opencodeProfile(), handleIr, ctx });
}
