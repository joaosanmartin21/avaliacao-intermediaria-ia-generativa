import {
  normalizeMonthRef,
  normalizeRequestBody,
} from "../../server/lib/assistantMocks.js";
import {
  buildFallbackAssistantPayload,
  runStockAssistant,
} from "../../agents/stockAssistantAgent.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({
      error: "Method not allowed.",
    });
  }

  const body = normalizeRequestBody(request.body);
  const message = typeof body.message === "string" ? body.message : "";
  const monthRef = normalizeMonthRef(body.monthRef);
  const context =
    typeof body.context === "object" && body.context !== null ? body.context : {};

  try {
    const payload = await runStockAssistant({
      message,
      monthRef,
      context,
    });

    return response.status(200).json(payload);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("assistant_chat_error", error);

    return response.status(200).json(
      buildFallbackAssistantPayload({
        monthRef,
        reason: error instanceof Error ? error.message : "Falha no agente local.",
      })
    );
  }
}
