import cors from "cors";
import express from "express";
import {
  buildMockCostReport,
  normalizeMonthRef,
  normalizeRequestBody,
} from "./lib/assistantMocks.js";
import {
  buildFallbackAssistantPayload,
  runStockAssistant,
} from "../agents/stockAssistantAgent.js";
import {
  buildFallbackShoppingReport,
  runShoppingReportAssistant,
} from "../agents/shoppingReportAgent.js";

const app = express();
const port = Number.parseInt(process.env.PORT ?? "8787", 10);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_request, response) => {
  response.json({
    name: "avaliacao-intermediaria-endpoint",
    status: "ok",
    docs: {
      health: "/api/health",
      assistantChat: "/api/assistant/chat",
      monthlyCostReport: "/api/reports/cost",
      shoppingReport: "/api/reports/shopping",
    },
  });
});

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "assistant-endpoint",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/reports/cost", (request, response) => {
  const monthRef = normalizeMonthRef(request.body?.monthRef);
  const report = buildMockCostReport(monthRef);

  response.json({
    report,
    generatedAt: new Date().toISOString(),
  });
});

app.post("/api/reports/shopping", async (request, response) => {
  const body = normalizeRequestBody(request.body);
  const context =
    typeof body.context === "object" && body.context !== null ? body.context : {};

  try {
    const payload = await runShoppingReportAssistant({
      context,
    });
    response.json(payload);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("shopping_report_error", error);
    response.json(
      buildFallbackShoppingReport({
        context,
        reason: error instanceof Error ? error.message : "Falha no relatorio de compras.",
      })
    );
  }
});

app.post("/api/assistant/chat", async (request, response) => {
  const message = typeof request.body?.message === "string" ? request.body.message : "";
  const monthRef = normalizeMonthRef(request.body?.monthRef);
  const context =
    typeof request.body?.context === "object" && request.body.context !== null
      ? request.body.context
      : {};

  try {
    const payload = await runStockAssistant({
      message,
      monthRef,
      context,
    });

    response.json(payload);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("assistant_chat_error", error);

    response.json(
      buildFallbackAssistantPayload({
        monthRef,
        reason: error instanceof Error ? error.message : "Falha no agente local.",
      })
    );
  }
});

app.use((_request, response) => {
  response.status(404).json({
    error: "Route not found.",
  });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API online em http://localhost:${port}`);
});
