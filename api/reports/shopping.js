import { normalizeRequestBody } from "../../server/lib/assistantMocks.js";
import {
  buildFallbackShoppingReport,
  runShoppingReportAssistant,
} from "../../agents/shoppingReportAgent.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({
      error: "Method not allowed.",
    });
  }

  const body = normalizeRequestBody(request.body);
  const context =
    typeof body.context === "object" && body.context !== null ? body.context : {};

  try {
    const payload = await runShoppingReportAssistant({
      context,
    });
    return response.status(200).json(payload);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("shopping_report_error", error);
    return response.status(200).json(
      buildFallbackShoppingReport({
        context,
        reason: error instanceof Error ? error.message : "Falha no relatorio de compras.",
      })
    );
  }
}
