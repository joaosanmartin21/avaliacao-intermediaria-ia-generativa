import { useState } from "react";

export default function InventoryItemForm({ onCreateItem }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("info");

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback("");

    try {
      await onCreateItem({
        name,
        unitPrice: price,
      });
      setName("");
      setPrice("");
      setFeedbackType("success");
      setFeedback("Item cadastrado com sucesso.");
    } catch (error) {
      setFeedbackType("error");
      setFeedback(error?.message || "Nao foi possivel cadastrar o item.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mapping-card inventory-card">
      <header className="mapping-card-header">
        <h3>Cadastrar item</h3>
        <p>Adicione itens gerais de estoque com nome e preco unitario.</p>
      </header>

      <form className="inventory-form" onSubmit={handleSubmit}>
        <label>
          Nome do item
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            placeholder="Ex.: Copo descartavel 300ml"
            required
          />
        </label>

        <label>
          Preco unitario (R$)
          <input
            type="number"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            min={0}
            step="0.01"
            placeholder="0,00"
            required
          />
        </label>

        <button type="submit" className="mapping-primary-button" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar item"}
        </button>
      </form>

      {feedback ? (
        <p className={`inventory-feedback ${feedbackType}`}>{feedback}</p>
      ) : null}
    </section>
  );
}
