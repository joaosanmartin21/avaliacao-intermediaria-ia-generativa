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
import { requestAssistantReply } from "../services/assistantApi";
import { formatDateTime, getCurrentMonthRef } from "../utils/formatters";

function buildMockAssistantReply(monthRef) {
  return [
    "Resposta local simulada: endpoint indisponivel no momento.",
    `Mes analisado: ${monthRef}.`,
    "Inicie o backend da API para receber resposta do endpoint publicado.",
  ].join(" ");
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
      try {
        const endpointResponse = await requestAssistantReply({
          message: content,
          monthRef,
        });
        assistantContent =
          typeof endpointResponse.reply === "string" && endpointResponse.reply.trim()
            ? endpointResponse.reply.trim()
            : buildMockAssistantReply(monthRef);
      } catch (error) {
        console.error(error);
        assistantContent = buildMockAssistantReply(monthRef);
      }

      await addMessage({
        conversationId,
        role: "assistant",
        content: assistantContent,
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="assistant-shell">
      <header className="mapping-hero">
        <p className="eyebrow">Tela 4</p>
        <h1>Assistente de Estoque (Estrutura LLM)</h1>
        <p className="hero-copy">
          Chat pronto para integrar IA generativa e relatorios de custo mensais.
        </p>
        <div className="mapping-summary">
          <span>
            Conversas: <strong>{conversations.length}</strong>
          </span>
          <span>
            Mensagens atuais: <strong>{messages.length}</strong>
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
