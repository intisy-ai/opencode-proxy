// Proves the IR front-door is active on the real opencodeProfile (not a hand-rolled stand-in):
// opencodeProfile() carries anthropic-translator's real AnthropicTranslator (OpenCode speaks
// Anthropic wire), so an inbound request decodes to IR, routes on IrRequest.model, reaches a
// handleIr-capable handler, and the IrResponse is encoded back to Anthropic wire by
// createProxyServer (basekit/proxy).
import { afterEach, beforeEach, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createProxyServer } from "@intisy-ai/basekit/proxy";
import { opencodeProfile } from "./profiles/opencode.js";
import { anthropicTranslator } from "@intisy-ai/anthropic-translator";
import type { IrRequest, IrResponse } from "@intisy-ai/basekit/ir";

let dir: string, srv: any;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ocp-srv-ir-"));
  mkdirSync(join(dir, "config"), { recursive: true });
});
afterEach(async () => { if (srv) await srv.close(); rmSync(dir, { recursive: true, force: true }); });

it("opencodeProfile() has a translator wired, activating the IR front-door", () => {
  expect(opencodeProfile().translator).toBe(anthropicTranslator);
});

it("decodes inbound wire -> IR -> handleIr -> encodes IR back to wire", async () => {
  writeFileSync(
    join(dir, "config", "opencode-loader.json"),
    JSON.stringify({ modelMap: { default: [{ provider: "ok", model: "some-model" }] } }),
  );
  const handlers: any = {
    ok: {
      handle: async () => { throw new Error("legacy handle() must not be called when the IR path is active"); },
      handleIr: async (ir: IrRequest, ctx: any): Promise<IrResponse> => ({
        id: "msg_ir",
        model: ctx.model,
        content: [{ kind: "text", text: "ir front-door: " + ((ir.messages[0]?.content[0] as any)?.text ?? "") }],
        stopReason: "end_turn",
        usage: { inputTokens: 4, outputTokens: 4 },
      }),
    },
  };

  srv = createProxyServer({ configDir: dir, profile: opencodeProfile(), port: 0, resolveHandler: async (n: string) => handlers[n] ?? null });
  const port = await srv.listen();

  const r = await fetch(`http://127.0.0.1:${port}/v1/messages`, {
    method: "POST",
    body: JSON.stringify({ model: "some-model", max_tokens: 100, messages: [{ role: "user", content: "hello" }], stream: false }),
  });
  expect(r.status).toBe(200);
  const decoded = await anthropicTranslator.decodeResponse(await r.text());
  expect(decoded.stopReason).toBe("end_turn");
  expect(decoded.content[0]).toMatchObject({ kind: "text", text: "ir front-door: hello" });
});
