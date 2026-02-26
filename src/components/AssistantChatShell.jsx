import { useState } from "react";
import { formatDateTime } from "../utils/formatters";

function formatUsedTools(message) {
  const usedTools = Array.isArray(message?.metadata?.usedTools)
    ? message.metadata.usedTools.filter((toolName) => typeof toolName === "string" && toolName.trim())
    : [];

  if (usedTools.length === 0) {
    return "";
  }

  return `Tools: ${usedTools.join(", ")}`;
}

export default function AssistantChatShell({
  messages,
  onSendMessage,
  isSending,
  hasConversation,
}) {
  const [draft, setDraft] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    const trimmed = draft.trim();
    if (!trimmed) {
      setErrorMessage("Digite uma mensagem para continuar.");
      return;
    }

    try {
      await onSendMessage(trimmed);
      setDraft("");
    } catch (error) {
      setErrorMessage(error?.message || "Não foi possível enviar a mensagem.");
    }
  }

  return (
    <section className="mapping-card assistant-chat-card">
      <header className="mapping-card-header">
        <h3>Assistente de estoque</h3>
        <p>
          IA local via Ollama com respostas estruturadas e histórico persistido
          no navegador.
        </p>
      </header>

      <div className="assistant-thread">
        {messages.length === 0 ? (
          <p className="assistant-empty-thread">
            {hasConversation
              ? "Envie uma mensagem para iniciar esta conversa."
              : "Crie uma conversa para começar o chat."}
          </p>
        ) : (
          messages.map((message) => {
            const toolsLabel =
              message.role === "assistant" ? formatUsedTools(message) : "";

            return (
              <article key={message.id} className={`assistant-message ${message.role}`}>
                <p>{message.content}</p>
                {toolsLabel ? (
                  <span className="assistant-tools-hint">{toolsLabel}</span>
                ) : null}
                <small>{formatDateTime(message.createdAt)}</small>
              </article>
            );
          })
        )}
      </div>

      <form className="assistant-input-wrap" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ex.: Qual meu custo estimado deste mês e o que priorizar na compra?"
          disabled={isSending}
        />
        <button type="submit" className="mapping-primary-button" disabled={isSending}>
          {isSending ? "Enviando..." : "Enviar"}
        </button>
      </form>

      {errorMessage ? (
        <p className="inventory-feedback error">{errorMessage}</p>
      ) : null}
    </section>
  );
}
