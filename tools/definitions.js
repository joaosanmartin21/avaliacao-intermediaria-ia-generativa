export const TOOL_NAMES = {
  GET_MONTHLY_ORDERS_SUMMARY: "get_monthly_orders_summary",
  GET_RESTOCK_SUMMARY: "get_restock_summary",
  GET_ITEMS_CATALOG: "get_items_catalog",
  ESTIMATE_MONTHLY_COST: "estimate_monthly_cost",
};

const monthRefSchema = {
  type: "string",
  description: "Mes de referencia no formato YYYY-MM.",
  pattern: "^\\d{4}-(0[1-9]|1[0-2])$",
};

export const assistantTools = [
  {
    type: "function",
    function: {
      name: TOOL_NAMES.GET_MONTHLY_ORDERS_SUMMARY,
      description:
        "Retorna um resumo dos pedidos do mes selecionado com totais, status e itens mais relevantes.",
      parameters: {
        type: "object",
        properties: {
          monthRef: monthRefSchema,
        },
        required: ["monthRef"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: TOOL_NAMES.GET_RESTOCK_SUMMARY,
      description:
        "Retorna o resumo de reposicao dos freezers com sabores que precisam compra.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: TOOL_NAMES.GET_ITEMS_CATALOG,
      description:
        "Retorna o catálogo de itens ativos com preço unitário para apoiar recomendações.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "Quantidade maxima de itens retornados (1 a 30).",
            minimum: 1,
            maximum: 30,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: TOOL_NAMES.ESTIMATE_MONTHLY_COST,
      description:
        "Estima custo mensal com base em pedidos e preço médio dos itens.",
      parameters: {
        type: "object",
        properties: {
          monthRef: monthRefSchema,
        },
        required: ["monthRef"],
        additionalProperties: false,
      },
    },
  },
];
