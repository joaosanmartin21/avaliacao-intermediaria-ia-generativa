import {
  buildMockCostReport,
  normalizeMonthRef,
  normalizeRequestBody,
} from "../../server/lib/assistantMocks.js";

export default function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({
      error: "Method not allowed.",
    });
  }

  const body = normalizeRequestBody(request.body);
  const monthRef = normalizeMonthRef(body.monthRef);
  const report = buildMockCostReport(monthRef);

  return response.status(200).json({
    report,
    generatedAt: new Date().toISOString(),
  });
}
