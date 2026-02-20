import cors from "cors";
import express from "express";
import {
  buildAssistantReply,
  buildMockCostReport,
  normalizeMonthRef,
} from "./lib/assistantMocks.js";

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

app.post("/api/assistant/chat", (request, response) => {
  const message = typeof request.body?.message === "string" ? request.body.message : "";
  const monthRef = normalizeMonthRef(request.body?.monthRef);

  const payload = buildAssistantReply({ message, monthRef });
  response.json({
    ...payload,
    provider: "mock-endpoint",
    generatedAt: new Date().toISOString(),
  });
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
