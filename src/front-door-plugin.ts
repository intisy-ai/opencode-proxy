import { frontDoor } from "@intisy-ai/core-proxy";
import { opencodeProfile } from "./profiles/opencode.js";

/**
 * What an in-process host loads: this app's wire format, as the `front-door` capability.
 *
 * @remarks
 * A separate module from `plugin.ts`, whose default export is this app's own activate hook. Typed
 * structurally rather than as the api's `Plugin` type, because this repo carries no `core` submodule
 * and so cannot resolve the api package through the nested `core/api` route every plugin repo uses.
 * A host duck-types `activate` and `deactivate`, and `frontDoor()` already returns the capability
 * shape the api declares.
 */
const plugin = {
  activate(context: { provide: (id: string, implementation: unknown) => void }) {
    context.provide("front-door", frontDoor(opencodeProfile()));
  },
  deactivate() {},
};

/** The capability this repo contributes, in the shape an in-process host duck-types. */
export default plugin;
