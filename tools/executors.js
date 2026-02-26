import { TOOL_NAMES } from "./definitions.js";

function toObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toMonthRef(value, fallback = null) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(trimmed) ? trimmed : fallback;
}

function toNumber(value, fallback = 0) {
  const numeric = Number.parseFloat(String(value));
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toMoney(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

function toInteger(value, fallback = 0) {
  const numeric = Number.parseInt(String(value), 10);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeStringList(list, fallback = []) {
  const values = toArray(list)
    .filter((entry) => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return values.length > 0 ? values : fallback;
}

function normalizeOrdersSummary(input, fallbackMonthRef) {
  const source = toObject(input);
  const monthRef = toMonthRef(source.monthRef, fallbackMonthRef);
  const topItems = toArray(source.topItems).map((entry) => {
    const item = toObject(entry);
    return {
      name: typeof item.name === "string" ? item.name.trim() : "Item nao identificado",
      quantity: Math.max(0, toInteger(item.quantity)),
      lineTotal: toMoney(item.lineTotal),
    };
  });

  return {
    monthRef,
    totalOrders: Math.max(0, toInteger(source.totalOrders)),
    sentOrders: Math.max(0, toInteger(source.sentOrders)),
    draftOrders: Math.max(0, toInteger(source.draftOrders)),
    totalLines: Math.max(0, toInteger(source.totalLines)),
    totalCost: toMoney(source.totalCost),
    topItems,
  };
}

function normalizeFreezerSummary(input) {
  const source = toObject(input);
  const restockItems = toArray(source.restockItems).map((entry) => {
    const item = toObject(entry);
    return {
      flavor: typeof item.flavor === "string" ? item.flavor.trim() : "Sem sabor definido",
      count: Math.max(0, toInteger(item.count)),
      locations: toArray(item.locations).map((locationEntry) => {
        const location = toObject(locationEntry);
        return {
          freezer: typeof location.freezer === "string" ? location.freezer.trim() : "Sem nome",
          position: Math.max(0, toInteger(location.position)),
          reasons: normalizeStringList(location.reasons),
        };
      }),
    };
  });

  return {
    totalFreezers: Math.max(0, toInteger(source.totalFreezers)),
    totalSlots: Math.max(0, toInteger(source.totalSlots)),
    mappedSlots: Math.max(0, toInteger(source.mappedSlots)),
    slotsNeedingRestock: Math.max(0, toInteger(source.slotsNeedingRestock)),
    totalFlavorsToBuy: Math.max(0, toInteger(source.totalFlavorsToBuy)),
    restockItems,
  };
}

function normalizeItemsSummary(input) {
  const source = toObject(input);
  const items = toArray(source.items).map((entry) => {
    const item = toObject(entry);
    return {
      name: typeof item.name === "string" ? item.name.trim() : "Item nao identificado",
      unitPrice: toMoney(item.unitPrice),
    };
  });

  return {
    totalItems: Math.max(0, toInteger(source.totalItems)),
    averageUnitPrice: toMoney(source.averageUnitPrice),
    minUnitPrice: toMoney(source.minUnitPrice),
    maxUnitPrice: toMoney(source.maxUnitPrice),
    items,
  };
}

export function normalizeRuntimeContext(context, fallbackMonthRef) {
  const source = toObject(context);
  const generatedAt =
    typeof source.generatedAt === "string" && source.generatedAt.trim()
      ? source.generatedAt.trim()
      : new Date().toISOString();

  return {
    generatedAt,
    ordersSummary: normalizeOrdersSummary(source.ordersSummary, fallbackMonthRef),
    freezerSummary: normalizeFreezerSummary(source.freezerSummary),
    itemsSummary: normalizeItemsSummary(source.itemsSummary),
  };
}

function parseToolArguments(argumentsText) {
  if (typeof argumentsText === "object" && argumentsText !== null) {
    return argumentsText;
  }

  if (typeof argumentsText !== "string" || !argumentsText.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(argumentsText);
    return toObject(parsed);
  } catch {
    return {};
  }
}

function getMonthlyOrdersSummary(runtimeContext, args) {
  const requestedMonthRef = toMonthRef(args.monthRef, runtimeContext.ordersSummary.monthRef);
  const monthRef = requestedMonthRef || runtimeContext.ordersSummary.monthRef;

  return {
    monthRef,
    ...runtimeContext.ordersSummary,
    contextGeneratedAt: runtimeContext.generatedAt,
  };
}

function getRestockSummary(runtimeContext) {
  return {
    ...runtimeContext.freezerSummary,
    contextGeneratedAt: runtimeContext.generatedAt,
  };
}

function getItemsCatalog(runtimeContext, args) {
  const safeLimit = Math.max(1, Math.min(30, toInteger(args.limit, 12)));

  return {
    totalItems: runtimeContext.itemsSummary.totalItems,
    averageUnitPrice: runtimeContext.itemsSummary.averageUnitPrice,
    minUnitPrice: runtimeContext.itemsSummary.minUnitPrice,
    maxUnitPrice: runtimeContext.itemsSummary.maxUnitPrice,
    items: runtimeContext.itemsSummary.items.slice(0, safeLimit),
    contextGeneratedAt: runtimeContext.generatedAt,
  };
}

function estimateMonthlyCost(runtimeContext, args) {
  const monthRef = toMonthRef(args.monthRef, runtimeContext.ordersSummary.monthRef);
  const ordersTotal = toMoney(runtimeContext.ordersSummary.totalCost);
  const restockPressure = Math.max(0, toInteger(runtimeContext.freezerSummary.slotsNeedingRestock));
  const avgItemPrice = toMoney(runtimeContext.itemsSummary.averageUnitPrice);

  const estimatedIngredientsCost =
    ordersTotal > 0
      ? ordersTotal
      : Math.max(1200, toMoney(avgItemPrice * Math.max(4, restockPressure) * 1.7));
  const estimatedOperationalCost = Math.max(900, toMoney(estimatedIngredientsCost * 0.35));
  const estimatedTotalCost = toMoney(estimatedIngredientsCost + estimatedOperationalCost);

  return {
    monthRef,
    estimatedIngredientsCost,
    estimatedOperationalCost,
    estimatedTotalCost,
    assumptions: [
      "Estimativa calculada a partir de resumo de pedidos e pressao de reposicao.",
      "Use os valores como apoio operacional, nao como fechamento contabil oficial.",
    ],
    contextGeneratedAt: runtimeContext.generatedAt,
  };
}

function executeToolByName(name, runtimeContext, args) {
  switch (name) {
    case TOOL_NAMES.GET_MONTHLY_ORDERS_SUMMARY:
      return getMonthlyOrdersSummary(runtimeContext, args);
    case TOOL_NAMES.GET_RESTOCK_SUMMARY:
      return getRestockSummary(runtimeContext);
    case TOOL_NAMES.GET_ITEMS_CATALOG:
      return getItemsCatalog(runtimeContext, args);
    case TOOL_NAMES.ESTIMATE_MONTHLY_COST:
      return estimateMonthlyCost(runtimeContext, args);
    default:
      throw new Error(`Tool "${name}" nao reconhecida.`);
  }
}

export async function executeToolCall({ name, argumentsText, runtimeContext }) {
  try {
    const args = parseToolArguments(argumentsText);
    const data = executeToolByName(name, runtimeContext, args);
    return {
      ok: true,
      name,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      name,
      error: error instanceof Error ? error.message : "Falha ao executar ferramenta.",
    };
  }
}
