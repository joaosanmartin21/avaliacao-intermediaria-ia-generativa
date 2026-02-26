function parseNumber(value, fallback, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
  const numeric = Number.parseFloat(String(value));
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  if (numeric < min) {
    return min;
  }

  if (numeric > max) {
    return max;
  }

  return numeric;
}

function parseInteger(value, fallback, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
  const numeric = Number.parseInt(String(value), 10);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  if (numeric < min) {
    return min;
  }

  if (numeric > max) {
    return max;
  }

  return numeric;
}

export function getModelConfig() {
  return {
    provider: "ollama-local",
    baseURL: process.env.OLLAMA_BASE_URL?.trim() || "http://localhost:11434/v1",
    model: process.env.OLLAMA_MODEL?.trim() || "qwen2.5:7b",
    apiKey: process.env.OLLAMA_API_KEY?.trim() || "ollama",
    temperature: parseNumber(process.env.OLLAMA_TEMPERATURE, 0.2, {
      min: 0,
      max: 1,
    }),
    topP: parseNumber(process.env.OLLAMA_TOP_P, 0.9, {
      min: 0,
      max: 1,
    }),
    maxTokens: parseInteger(process.env.OLLAMA_MAX_TOKENS, 500, {
      min: 100,
      max: 2048,
    }),
    maxToolIterations: parseInteger(process.env.ASSISTANT_MAX_TOOL_ITERATIONS, 4, {
      min: 1,
      max: 8,
    }),
  };
}
