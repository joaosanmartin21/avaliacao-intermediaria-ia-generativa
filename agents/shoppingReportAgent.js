import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { getModelConfig } from "./modelConfig.js";

const DEFAULT_SYSTEM_PROMPT = `Voce e um analista de compras de sorveteria.

Tarefa:
- Gerar um relatorio de compras estruturado a partir do contexto de freezers e reposicao.
- Priorizar sabores com risco de ruptura.

Regras:
1) Nao invente dados fora do contexto recebido.
2) Se o contexto estiver incompleto, sinalize em warnings.
3) Qualquer sabor com caixa de baixo vazia deve aparecer em priorityPurchases.
4) A resposta deve ser somente JSON valido no formato:
{
  "report": {
    "overview": {
      "totalFreezers": 0,
      "mappedSlots": 0,
      "totalSlots": 0,
      "slotsNeedingRestock": 0,
      "totalFlavorsToBuy": 0
    },
    "priorityPurchases": [
      {
        "flavor": "Morango",
        "priority": "alta|media|baixa",
        "suggestedQuantity": 1,
        "reason": "texto curto"
      }
    ],
    "byFreezer": [
      {
        "freezerName": "Freezer 1",
        "order": 1,
        "slotsNeedingRestock": [
          {
            "position": 1,
            "flavor": "Morango",
            "topLevel": "full|half|quarter|empty",
            "bottomLevel": "full|empty",
            "boxesNeedingRestock": 1,
            "reasons": ["caixa de baixo vazia"]
          }
        ],
        "flavorTotals": [
          {
            "flavor": "Morango",
            "boxesNeedingRestock": 1
          }
        ],
        "totalBoxesNeedingRestock": 1
      }
    ],
    "warnings": ["aviso 1"]
  }
}`;

let cachedPrompt = null;

function toObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toInteger(value, fallback = 0) {
  const numeric = Number.parseInt(String(value), 10);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function sanitizeText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed || fallback;
}

function normalizePriority(value) {
  if (value === "alta" || value === "media" || value === "baixa") {
    return value;
  }
  return "media";
}

function priorityToScore(priority) {
  if (priority === "alta") {
    return 3;
  }
  if (priority === "media") {
    return 2;
  }
  return 1;
}

function scoreToPriority(score) {
  if (score >= 3) {
    return "alta";
  }
  if (score === 2) {
    return "media";
  }
  return "baixa";
}

function getSlotRestockReasons(slot) {
  const reasons = [];

  if (slot.topLevel === "quarter") {
    reasons.push("caixa de cima em 1/4");
  }
  if (slot.topLevel === "empty") {
    reasons.push("caixa de cima vazia");
  }
  if (slot.bottomLevel === "empty") {
    reasons.push("caixa de baixo vazia");
  }

  return reasons;
}

function estimateBoxesForSlot(slot) {
  let boxes = 0;

  if (slot.bottomLevel === "empty") {
    boxes += 1;
  }
  if (slot.topLevel === "empty" || slot.topLevel === "quarter") {
    boxes += 1;
  }

  return Math.max(1, boxes);
}

function buildByFreezerFromContext(context) {
  const orderedFreezers = [...context.freezers].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }
    return left.title.localeCompare(right.title, "pt-BR", { sensitivity: "base" });
  });

  return orderedFreezers.map((freezer) => {
    const slotsNeedingRestock = toArray(freezer.lowStockSlots)
      .map((slotEntry) => {
        const slot = toObject(slotEntry);
        const flavor = sanitizeText(slot.flavor, "Sabor nao definido");
        const topLevel = sanitizeText(slot.topLevel, "unknown");
        const bottomLevel = sanitizeText(slot.bottomLevel, "unknown");
        const normalizedSlot = {
          position: Math.max(0, toInteger(slot.position)),
          flavor,
          topLevel,
          bottomLevel,
        };

        return {
          ...normalizedSlot,
          boxesNeedingRestock: estimateBoxesForSlot(normalizedSlot),
          reasons: getSlotRestockReasons(normalizedSlot),
        };
      })
      .sort((left, right) => left.position - right.position);

    const boxesByFlavor = new Map();
    for (const slot of slotsNeedingRestock) {
      const key = slot.flavor.toLowerCase();
      const current = boxesByFlavor.get(key);
      if (!current) {
        boxesByFlavor.set(key, {
          flavor: slot.flavor,
          boxesNeedingRestock: slot.boxesNeedingRestock,
        });
      } else {
        current.boxesNeedingRestock += slot.boxesNeedingRestock;
      }
    }

    const flavorTotals = [...boxesByFlavor.values()].sort((left, right) =>
      left.flavor.localeCompare(right.flavor, "pt-BR", { sensitivity: "base" })
    );
    const totalBoxesNeedingRestock = flavorTotals.reduce(
      (sum, item) => sum + item.boxesNeedingRestock,
      0
    );

    return {
      freezerName: sanitizeText(
        freezer.title,
        `Freezer ${Math.max(1, toInteger(freezer.order, 1))}`
      ),
      order: Math.max(1, toInteger(freezer.order, 1)),
      slotsNeedingRestock,
      flavorTotals,
      totalBoxesNeedingRestock,
    };
  });
}

function sanitizeShoppingContext(context) {
  const source = toObject(context);
  const mappingSummary = toObject(source.mappingSummary);
  const shoppingSummary = toObject(source.shoppingSummary);

  const items = toArray(shoppingSummary.items).map((entry) => {
    const item = toObject(entry);
    return {
      flavor: sanitizeText(item.flavor, "Sabor nao identificado"),
      count: Math.max(0, toInteger(item.count)),
      locations: toArray(item.locations).map((locationEntry) => {
        const location = toObject(locationEntry);
        return {
          freezerTitle: sanitizeText(location.freezerTitle, "Sem nome"),
          position: Math.max(0, toInteger(location.position)),
          topLevel: sanitizeText(location.topLevel, "unknown"),
          bottomLevel: sanitizeText(location.bottomLevel, "unknown"),
          reasons: toArray(location.reasons)
            .filter((reason) => typeof reason === "string")
            .map((reason) => reason.trim())
            .filter(Boolean),
        };
      }),
    };
  });

  const freezers = toArray(source.freezers).map((entry) => {
    const freezer = toObject(entry);
    return {
      title: sanitizeText(freezer.title, "Sem nome"),
      order: Math.max(0, toInteger(freezer.order)),
      capacity: Math.max(0, toInteger(freezer.capacity)),
      mappedSlots: Math.max(0, toInteger(freezer.mappedSlots)),
      lowStockSlots: toArray(freezer.lowStockSlots).map((slotEntry) => {
        const slot = toObject(slotEntry);
        return {
          position: Math.max(0, toInteger(slot.position)),
          flavor: sanitizeText(slot.flavor),
          topLevel: sanitizeText(slot.topLevel, "unknown"),
          bottomLevel: sanitizeText(slot.bottomLevel, "unknown"),
        };
      }),
    };
  });

  return {
    generatedAt:
      typeof source.generatedAt === "string" && source.generatedAt.trim()
        ? source.generatedAt.trim()
        : new Date().toISOString(),
    mappingSummary: {
      totalFreezers: Math.max(0, toInteger(mappingSummary.totalFreezers)),
      totalSlots: Math.max(0, toInteger(mappingSummary.totalSlots)),
      mappedSlots: Math.max(0, toInteger(mappingSummary.mappedSlots)),
    },
    shoppingSummary: {
      totalSlotsNeedingRestock: Math.max(
        0,
        toInteger(shoppingSummary.totalSlotsNeedingRestock)
      ),
      totalFlavorsToBuy: Math.max(0, toInteger(shoppingSummary.totalFlavorsToBuy)),
      items,
    },
    freezers,
  };
}

function extractJsonCandidate(rawText) {
  if (typeof rawText !== "string") {
    return null;
  }

  const trimmed = rawText.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // Continues with snippet attempt.
    }
  }

  const startIndex = trimmed.indexOf("{");
  const endIndex = trimmed.lastIndexOf("}");
  if (startIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  try {
    return JSON.parse(trimmed.slice(startIndex, endIndex + 1));
  } catch {
    return null;
  }
}

function computePriority(count) {
  if (count >= 3) {
    return "alta";
  }
  if (count === 2) {
    return "media";
  }
  return "baixa";
}

function buildFallbackReport(context, reason = "") {
  const items = [...context.shoppingSummary.items].sort((left, right) => right.count - left.count);
  const byFreezer = buildByFreezerFromContext(context);
  const priorityPurchases = items.slice(0, 10).map((item) => ({
    flavor: item.flavor,
    priority: computePriority(item.count),
    suggestedQuantity: Math.max(1, item.count),
    reason:
      item.locations.length > 0
        ? `Reposicao em ${item.locations.length} caixa(s) com nivel baixo.`
        : "Reposicao sugerida por falta de mapeamento detalhado.",
  }));

  const warnings = [];
  if (context.mappingSummary.mappedSlots === 0) {
    warnings.push("Nenhuma caixa foi mapeada. O relatorio tem baixa confiabilidade.");
  } else if (context.mappingSummary.mappedSlots < context.mappingSummary.totalSlots) {
    warnings.push("Parte das caixas ainda nao foi mapeada. Revise o mapeamento para melhorar o relatorio.");
  }
  if (!priorityPurchases.length) {
    warnings.push("Nenhum sabor com reposicao detectada no contexto atual.");
  }
  if (reason) {
    warnings.push(`Fallback aplicado: ${reason}`);
  }

  return {
    report: {
      overview: {
        totalFreezers: context.mappingSummary.totalFreezers,
        mappedSlots: context.mappingSummary.mappedSlots,
        totalSlots: context.mappingSummary.totalSlots,
        slotsNeedingRestock: context.shoppingSummary.totalSlotsNeedingRestock,
        totalFlavorsToBuy: context.shoppingSummary.totalFlavorsToBuy,
      },
      priorityPurchases,
      byFreezer,
      warnings,
    },
    provider: "ollama-fallback",
    model: "unavailable",
    generatedAt: new Date().toISOString(),
  };
}

function normalizeReportPayload(rawPayload, context) {
  const root = toObject(rawPayload);
  const report = toObject(root.report);
  const overview = toObject(report.overview);

  const priorityPurchases = toArray(report.priorityPurchases).map((entry) => {
    const item = toObject(entry);
    const countFromContext =
      context.shoppingSummary.items.find(
        (contextItem) =>
          contextItem.flavor.toLowerCase() === sanitizeText(item.flavor).toLowerCase()
      )?.count ?? 1;

    return {
      flavor: sanitizeText(item.flavor, "Sabor nao identificado"),
      priority: normalizePriority(item.priority),
      suggestedQuantity: Math.max(1, toInteger(item.suggestedQuantity, Math.max(1, countFromContext))),
      reason: sanitizeText(item.reason, "Prioridade definida pela recorrencia de reposicao."),
    };
  });

  const warnings = toArray(report.warnings)
    .filter((entry) => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 6);

  // Regra mandatória: qualquer sabor com caixa de baixo vazia precisa entrar no relatório.
  const mandatoryBottomEmptyItems = context.shoppingSummary.items.filter((contextItem) =>
    contextItem.locations.some((location) => location.bottomLevel === "empty")
  );

  for (const mandatoryItem of mandatoryBottomEmptyItems) {
    const index = priorityPurchases.findIndex(
      (entry) =>
        entry.flavor.toLowerCase() === mandatoryItem.flavor.toLowerCase()
    );

    if (index === -1) {
      priorityPurchases.push({
        flavor: mandatoryItem.flavor,
        priority: "alta",
        suggestedQuantity: Math.max(1, mandatoryItem.count),
        reason: "Incluido automaticamente: caixa de baixo vazia detectada.",
      });
      continue;
    }

    const current = priorityPurchases[index];
    const boostedPriority = scoreToPriority(
      Math.max(priorityToScore(current.priority), priorityToScore("alta"))
    );
    const hasBottomEmptyReason =
      typeof current.reason === "string" &&
      current.reason.toLowerCase().includes("baixo");

    priorityPurchases[index] = {
      ...current,
      priority: boostedPriority,
      suggestedQuantity: Math.max(
        1,
        toInteger(current.suggestedQuantity, 1),
        mandatoryItem.count
      ),
      reason: hasBottomEmptyReason
        ? current.reason
        : `${current.reason} Caixa de baixo vazia detectada.`,
    };
  }

  const byFreezer = buildByFreezerFromContext(context);

  return {
    report: {
      overview: {
        totalFreezers: Math.max(
          0,
          toInteger(overview.totalFreezers, context.mappingSummary.totalFreezers)
        ),
        mappedSlots: Math.max(
          0,
          toInteger(overview.mappedSlots, context.mappingSummary.mappedSlots)
        ),
        totalSlots: Math.max(0, toInteger(overview.totalSlots, context.mappingSummary.totalSlots)),
        slotsNeedingRestock: Math.max(
          0,
          toInteger(
            overview.slotsNeedingRestock,
            context.shoppingSummary.totalSlotsNeedingRestock
          )
        ),
        totalFlavorsToBuy: Math.max(
          0,
          toInteger(overview.totalFlavorsToBuy, context.shoppingSummary.totalFlavorsToBuy)
        ),
      },
      priorityPurchases,
      byFreezer,
      warnings,
    },
  };
}

function getMessageText(message) {
  if (typeof message?.content === "string") {
    return message.content;
  }

  if (Array.isArray(message?.content)) {
    return message.content
      .map((entry) => (entry?.type === "text" ? entry.text : ""))
      .join("")
      .trim();
  }

  return "";
}

async function loadPrompt() {
  if (cachedPrompt) {
    return cachedPrompt;
  }

  const promptPath = path.resolve(process.cwd(), "prompts", "shopping_report_prompt.txt");
  try {
    const fileContent = await fs.readFile(promptPath, "utf8");
    const trimmed = fileContent.trim();
    cachedPrompt = trimmed || DEFAULT_SYSTEM_PROMPT;
  } catch {
    cachedPrompt = DEFAULT_SYSTEM_PROMPT;
  }

  return cachedPrompt;
}

export async function runShoppingReportAssistant({ context }) {
  const normalizedContext = sanitizeShoppingContext(context);
  const config = getModelConfig();
  const systemPrompt = await loadPrompt();

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  const completion = await client.chat.completions.create({
    model: config.model,
    temperature: 0.15,
    top_p: config.topP,
    max_tokens: Math.max(450, config.maxTokens),
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Contexto para relatorio de compras:\n${JSON.stringify(normalizedContext)}`,
      },
    ],
  });

  const rawContent = getMessageText(completion?.choices?.[0]?.message);
  const parsed = extractJsonCandidate(rawContent);

  if (!parsed) {
    throw new Error("Modelo nao retornou JSON valido para relatorio de compras.");
  }

  const normalized = normalizeReportPayload(parsed, normalizedContext);

  return {
    ...normalized,
    provider: config.provider,
    model: config.model,
    generatedAt: new Date().toISOString(),
  };
}

export function buildFallbackShoppingReport({ context, reason }) {
  const normalizedContext = sanitizeShoppingContext(context);
  return buildFallbackReport(normalizedContext, reason);
}
