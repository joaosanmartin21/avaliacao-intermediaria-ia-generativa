import { useState } from "react";
import { formatDateTime } from "../utils/formatters";

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
      setErrorMessage(error?.message || "Nao foi possivel enviar a mensagem.");
    }
  }

  return (
    <section className="mapping-card assistant-chat-card">
      <header className="mapping-card-header">
        <h3>Assistente de estoque</h3>
        <p>
          Estrutura pronta para LLM. Nesta fase, as respostas sao simuladas e
          persistidas localmente.
        </p>
      </header>

      <div className="assistant-thread">
        {messages.length === 0 ? (
          <p className="assistant-empty-thread">
            {hasConversation
              ? "Envie uma mensagem para iniciar esta conversa."
              : "Crie uma conversa para comecar o chat."}
          </p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className={`assistant-message ${message.role}`}>
              <p>{message.content}</p>
              <small>{formatDateTime(message.createdAt)}</small>
            </article>
          ))
        )}
      </div>

      <form className="assistant-input-wrap" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ex.: Me mostre o custo estimado deste mes."
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
