import {
  buildAssistantReply,
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
  const message = typeof body.message === "string" ? body.message : "";
  const monthRef = normalizeMonthRef(body.monthRef);

  const payload = buildAssistantReply({ message, monthRef });
  return response.status(200).json({
    ...payload,
    provider: "mock-endpoint",
    generatedAt: new Date().toISOString(),
  });
}
