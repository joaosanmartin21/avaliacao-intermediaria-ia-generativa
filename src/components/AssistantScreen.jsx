import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import AssistantChatShell from "./AssistantChatShell";
import MonthlyCostMockCard from "./MonthlyCostMockCard";
import {
  addMessage,
  createConversation,
  listConversations,
  listMessages,
} from "../data/assistantRepository";
import { buildShoppingSummary } from "../data/freezerDefaults";
import {
  listActiveItems,
  listPurchaseOrdersByMonth,
} from "../data/inventoryRepository";
import { requestAssistantReply } from "../services/assistantApi";
import { loadFreezerMappingState } from "../utils/freezerStorage";
import { formatDateTime, getCurrentMonthRef } from "../utils/formatters";

function toMoney(value) {
  const numeric = Number.parseFloat(String(value));
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric * 100) / 100;
}

function toInteger(value) {
  const numeric = Number.parseInt(String(value), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeMonthRef(monthRef) {
  if (typeof monthRef !== "string") {
    return getCurrentMonthRef();
  }

  const trimmed = monthRef.trim();
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(trimmed)) {
    return trimmed;
  }

  return getCurrentMonthRef();
}

function buildMockAssistantReply(monthRef) {
  return [
    "Assistente local indisponivel no momento.",
    `Mes analisado: ${monthRef}.`,
    "Verifique se o Ollama esta ativo e tente novamente.",
  ].join(" ");
}

function buildOrdersSummary(orders, monthRef) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const aggregatedByItem = new Map();
  let sentOrders = 0;
  let draftOrders = 0;
  let totalLines = 0;
  let totalCost = 0;

  for (const order of safeOrders) {
    const status = typeof order?.status === "string" ? order.status : "draft";
    if (status === "sent") {
      sentOrders += 1;
    } else {
      draftOrders += 1;
    }

    totalCost += toMoney(order?.totalCost);

    for (const line of order?.lines ?? []) {
      totalLines += 1;
      const name =
        typeof line?.itemNameSnapshot === "string" && line.itemNameSnapshot.trim()
          ? line.itemNameSnapshot.trim()
          : "Item nao identificado";
      const quantity = Math.max(0, toInteger(line?.quantity));
      const lineTotal = toMoney(line?.lineTotal);
      const current = aggregatedByItem.get(name) ?? {
        name,
        quantity: 0,
        lineTotal: 0,
      };

      current.quantity += quantity;
      current.lineTotal = toMoney(current.lineTotal + lineTotal);
      aggregatedByItem.set(name, current);
    }
  }

  const topItems = [...aggregatedByItem.values()]
    .sort((left, right) => right.lineTotal - left.lineTotal)
    .slice(0, 6);

  return {
    monthRef: normalizeMonthRef(monthRef),
    totalOrders: safeOrders.length,
    sentOrders,
    draftOrders,
    totalLines,
    totalCost: toMoney(totalCost),
    topItems,
  };
}

function buildItemsSummary(items) {
  const safeItems = Array.isArray(items) ? items : [];
  const normalizedItems = safeItems
    .map((item) => ({
      name:
        typeof item?.name === "string" && item.name.trim()
          ? item.name.trim()
          : "Item nao identificado",
      unitPrice: toMoney(item?.unitPrice),
    }))
    .sort((left, right) => right.unitPrice - left.unitPrice);

  if (normalizedItems.length === 0) {
    return {
      totalItems: 0,
      averageUnitPrice: 0,
      minUnitPrice: 0,
      maxUnitPrice: 0,
      items: [],
    };
  }

  const total = normalizedItems.reduce((sum, item) => sum + item.unitPrice, 0);
  return {
    totalItems: normalizedItems.length,
    averageUnitPrice: toMoney(total / normalizedItems.length),
    minUnitPrice: normalizedItems[normalizedItems.length - 1].unitPrice,
    maxUnitPrice: normalizedItems[0].unitPrice,
    items: normalizedItems.slice(0, 15),
  };
}

function buildFreezerSummary() {
  const mappingState = loadFreezerMappingState();
  const freezers = Array.isArray(mappingState?.freezers) ? mappingState.freezers : [];
  const totalSlots = freezers.reduce((sum, freezer) => sum + toInteger(freezer?.capacity), 0);
  const mappedSlots = freezers.reduce(
    (sum, freezer) =>
      sum +
      (Array.isArray(freezer?.slots)
        ? freezer.slots.filter((slot) => typeof slot?.flavor === "string" && slot.flavor.trim())
            .length
        : 0),
    0
  );

  const shoppingSummary = buildShoppingSummary(freezers);
  const restockItems = (shoppingSummary?.items ?? []).slice(0, 10).map((item) => ({
    flavor: item.flavor,
    count: item.count,
    locations: (item.locations ?? []).slice(0, 3).map((location) => ({
      freezer: location.freezerTitle || "Sem nome",
      position: location.position,
      reasons: location.reasons,
    })),
  }));

  return {
    totalFreezers: freezers.length,
    totalSlots,
    mappedSlots,
    slotsNeedingRestock: shoppingSummary?.totalSlotsNeedingRestock ?? 0,
    totalFlavorsToBuy: shoppingSummary?.totalFlavorsToBuy ?? 0,
    restockItems,
  };
}

function buildAssistantContext({ monthRef, orders, items }) {
  return {
    generatedAt: new Date().toISOString(),
    ordersSummary: buildOrdersSummary(orders, monthRef),
    freezerSummary: buildFreezerSummary(),
    itemsSummary: buildItemsSummary(items),
  };
}

function normalizeUsedTools(value) {
  return (Array.isArray(value) ? value : [])
    .filter((entry) => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeConfidence(value) {
  const numeric = Number.parseFloat(String(value));
  if (!Number.isFinite(numeric)) {
    return 0.3;
  }
  if (numeric < 0) {
    return 0;
  }
  if (numeric > 1) {
    return 1;
  }
  return numeric;
}

function buildAssistantMetadata(endpointResponse, monthRef) {
  const structured =
    typeof endpointResponse?.structured === "object" &&
    endpointResponse.structured !== null &&
    !Array.isArray(endpointResponse.structured)
      ? endpointResponse.structured
      : {};

  return {
    intent:
      typeof structured.intent === "string" && structured.intent.trim()
        ? structured.intent.trim()
        : "other",
    monthRef: normalizeMonthRef(structured.monthRef ?? monthRef),
    usedTools: normalizeUsedTools(structured.usedTools),
    confidence: normalizeConfidence(structured.confidence),
    provider:
      typeof endpointResponse?.provider === "string" && endpointResponse.provider.trim()
        ? endpointResponse.provider.trim()
        : "ollama-fallback",
    model:
      typeof endpointResponse?.model === "string" && endpointResponse.model.trim()
        ? endpointResponse.model.trim()
        : "unavailable",
    generatedAt:
      typeof endpointResponse?.generatedAt === "string" && endpointResponse.generatedAt.trim()
        ? endpointResponse.generatedAt.trim()
        : new Date().toISOString(),
  };
}

export default function AssistantScreen() {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [monthRef, setMonthRef] = useState(getCurrentMonthRef());
  const [isSending, setIsSending] = useState(false);

  const conversations = useLiveQuery(
    async () => {
      try {
        return await listConversations();
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    [],
    []
  );
  const messages = useLiveQuery(
    async () => {
      try {
        return Number.isFinite(selectedConversationId)
          ? await listMessages(selectedConversationId)
          : [];
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    [selectedConversationId],
    []
  );
  const monthlyOrders = useLiveQuery(
    async () => {
      try {
        return await listPurchaseOrdersByMonth(monthRef);
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    [monthRef],
    []
  );
  const items = useLiveQuery(
    async () => {
      try {
        return await listActiveItems();
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    [],
    []
  );

  useEffect(() => {
    if (conversations.length === 0) {
      setSelectedConversationId(null);
      return;
    }

    const hasSelected = conversations.some(
      (conversation) => conversation.id === selectedConversationId
    );

    if (!hasSelected) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  async function handleCreateConversation() {
    const conversationId = await createConversation();
    setSelectedConversationId(conversationId);
  }

  async function handleSendMessage(content) {
    setIsSending(true);

    try {
      let conversationId = selectedConversationId;
      if (!Number.isFinite(conversationId)) {
        conversationId = await createConversation();
        setSelectedConversationId(conversationId);
      }

      await addMessage({
        conversationId,
        role: "user",
        content,
      });

      let assistantContent = "";
      let assistantMetadata = null;

      try {
        const context = buildAssistantContext({
          monthRef,
          orders: monthlyOrders,
          items,
        });
        const endpointResponse = await requestAssistantReply({
          message: content,
          monthRef,
          context,
        });

        assistantContent =
          typeof endpointResponse.reply === "string" && endpointResponse.reply.trim()
            ? endpointResponse.reply.trim()
            : buildMockAssistantReply(monthRef);
        assistantMetadata = buildAssistantMetadata(endpointResponse, monthRef);
      } catch (error) {
        console.error(error);
        assistantContent = buildMockAssistantReply(monthRef);
        assistantMetadata = buildAssistantMetadata(null, monthRef);
      }

      await addMessage({
        conversationId,
        role: "assistant",
        content: assistantContent,
        metadata: assistantMetadata,
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="assistant-shell">
      <header className="mapping-hero">
        <p className="eyebrow">Tela 4</p>
        <h1>Assistente de Estoque com IA Local (Ollama)</h1>
        <p className="hero-copy">
          Chat operacional com modelo local, tools de negocio e resposta estruturada
          para apoio a custo e reposicao.
        </p>
        <div className="mapping-summary">
          <span>
            Conversas: <strong>{conversations.length}</strong>
          </span>
          <span>
            Pedidos no mes: <strong>{monthlyOrders.length}</strong>
          </span>
          <span>
            Itens ativos: <strong>{items.length}</strong>
          </span>
        </div>
      </header>

      <div className="assistant-layout">
        <aside className="mapping-card assistant-sidebar">
          <header className="mapping-card-header">
            <h3>Conversas</h3>
            <p>Selecione uma conversa ou inicie uma nova.</p>
          </header>

          <button
            type="button"
            className="mapping-primary-button"
            onClick={handleCreateConversation}
          >
            + Nova conversa
          </button>

          <div className="assistant-conversation-list">
            {conversations.length === 0 ? (
              <p className="inventory-empty">Nenhuma conversa criada.</p>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  className={`assistant-conversation-item ${
                    conversation.id === selectedConversationId ? "active" : ""
                  }`}
                  onClick={() => setSelectedConversationId(conversation.id)}
                >
                  <strong>{conversation.title}</strong>
                  <small>{formatDateTime(conversation.updatedAt)}</small>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="assistant-main">
          <MonthlyCostMockCard monthRef={monthRef} onChangeMonth={setMonthRef} />
          <AssistantChatShell
            messages={messages}
            onSendMessage={handleSendMessage}
            isSending={isSending}
            hasConversation={Number.isFinite(selectedConversationId)}
          />
        </section>
      </div>
    </section>
  );
}
