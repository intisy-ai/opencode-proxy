import { frontDoor, FRONT_DOOR } from "@intisy-ai/basekit/proxy";
import type { Plugin, PluginContext } from "@intisy-ai/api";
import { opencodeProfile } from "./profiles/opencode.js";

/**
 * What an in-process host loads: this app's wire format, as the `front-door` capability.
 *
 * @remarks
 * A separate module from `plugin.ts`, whose default export is this app's own activate hook.
 */
const plugin: Plugin = {
  /** Hands the host this app's front door, under the capability id the engine mints for it. */
  activate(context: PluginContext) {
    context.provide(FRONT_DOOR, frontDoor(opencodeProfile()));
  },
  /** Nothing to tear down: the capability holds no resource of its own. */
  deactivate() {},
};

/** The capability this repo contributes. */
export default plugin;
