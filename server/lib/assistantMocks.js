export function normalizeMonthRef(monthRef) {
  if (typeof monthRef !== "string") {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  const trimmed = monthRef.trim();
  return /^\d{4}-\d{2}$/.test(trimmed) ? trimmed : normalizeMonthRef();
}

export function buildMockCostReport(monthRef) {
  const normalizedMonth = normalizeMonthRef(monthRef);
  const [yearText = "2026", monthText = "01"] = normalizedMonth.split("-");
  const year = Number.parseInt(yearText, 10) || 2026;
  const month = Number.parseInt(monthText, 10) || 1;

  const seed = year * 53 + month * 19;
  const ingredients = 2500 + (seed % 3500);
  const supplies = 800 + (seed % 1700);
  const estimatedTotal = ingredients + supplies;

  return {
    monthRef: normalizedMonth,
    ingredientsCost: Number((ingredients / 1).toFixed(2)),
    suppliesCost: Number((supplies / 1).toFixed(2)),
    estimatedTotalCost: Number((estimatedTotal / 1).toFixed(2)),
  };
}

export function buildAssistantReply({ message, monthRef }) {
  const report = buildMockCostReport(monthRef);
  const safeMessage = typeof message === "string" ? message.trim() : "";

  const reply = [
    "Endpoint funcional ativo.",
    `Consulta recebida: "${safeMessage || "sem texto"}".`,
    `Mes: ${report.monthRef}.`,
    `Custo estimado: R$ ${report.estimatedTotalCost.toFixed(2)}.`,
    "Integracao com LLM real pode substituir esta resposta posteriormente.",
  ].join(" ");

  return {
    reply,
    report,
  };
}

export function normalizeRequestBody(body) {
  if (body && typeof body === "object") {
    return body;
  }

  if (typeof body === "string" && body.trim()) {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  return {};
}
