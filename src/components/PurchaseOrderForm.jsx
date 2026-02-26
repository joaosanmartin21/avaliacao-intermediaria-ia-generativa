import { useMemo, useState } from "react";
import { formatCurrencyBRL } from "../utils/formatters";

function createLine() {
  return {
    id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    itemId: "",
    quantity: "1",
  };
}

export default function PurchaseOrderForm({ items, onCreateOrder, monthRef }) {
  const [lines, setLines] = useState([createLine()]);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("info");

  const itemById = useMemo(() => {
    const map = new Map();
    for (const item of items ?? []) {
      map.set(String(item.id), item);
    }
    return map;
  }, [items]);

  const previewTotal = useMemo(() => {
    return lines.reduce((sum, line) => {
      const item = itemById.get(String(line.itemId));
      const quantity = Number.parseInt(line.quantity, 10);
      if (!item || !Number.isFinite(quantity) || quantity <= 0) {
        return sum;
      }
      return sum + item.unitPrice * quantity;
    }, 0);
  }, [itemById, lines]);

  function updateLine(lineId, field, value) {
    setLines((current) =>
      current.map((line) =>
        line.id === lineId
          ? {
              ...line,
              [field]: value,
            }
          : line
      )
    );
  }

  function addLine() {
    setLines((current) => [...current, createLine()]);
  }

  function removeLine(lineId) {
    setLines((current) => {
      if (current.length === 1) {
        return current;
      }
      return current.filter((line) => line.id !== lineId);
    });
  }

  async function submitOrder(status) {
    setIsSaving(true);
    setFeedback("");

    try {
      await onCreateOrder({
        status,
        monthRef,
        lines: lines.map((line) => ({
          itemId: Number.parseInt(line.itemId, 10),
          quantity: Number.parseInt(line.quantity, 10),
        })),
      });
      setLines([createLine()]);
      setFeedbackType("success");
      setFeedback(
        status === "sent"
          ? "Pedido salvo como enviado."
          : "Pedido salvo como rascunho."
      );
    } catch (error) {
      setFeedbackType("error");
      setFeedback(error?.message || "Nao foi possivel salvar o pedido.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mapping-card inventory-card">
      <header className="mapping-card-header">
        <h3>Realizar pedido</h3>
        <p>Crie pedidos gerais da loja com os itens cadastrados no estoque.</p>
      </header>

      {items.length === 0 ? (
        <p className="inventory-empty">
          Cadastre pelo menos um item para criar pedidos.
        </p>
      ) : (
        <div className="order-form-wrap">
          {lines.map((line, index) => {
            const selectedItem = itemById.get(String(line.itemId));
            const quantity = Number.parseInt(line.quantity, 10);
            const lineTotal =
              selectedItem && Number.isFinite(quantity) && quantity > 0
                ? selectedItem.unitPrice * quantity
                : 0;

            return (
              <div key={line.id} className="order-line">
                <label>
                  Item #{index + 1}
                  <select
                    value={line.itemId}
                    onChange={(event) => updateLine(line.id, "itemId", event.target.value)}
                  >
                    <option value="">Selecione um item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Quantidade
                  <input
                    type="number"
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(line.id, "quantity", event.target.value)
                    }
                    min={1}
                    step={1}
                  />
                </label>

                <div className="order-line-total">{formatCurrencyBRL(lineTotal)}</div>

                <button
                  type="button"
                  className="mapping-danger-button"
                  onClick={() => removeLine(line.id)}
                  disabled={lines.length === 1}
                >
                  Remover
                </button>
              </div>
            );
          })}

          <button type="button" className="mapping-ghost-button" onClick={addLine}>
            + Adicionar item ao pedido
          </button>

          <p className="order-total">
            Total estimado: <strong>{formatCurrencyBRL(previewTotal)}</strong>
          </p>

          <div className="order-submit-actions">
            <button
              type="button"
              className="mapping-ghost-button"
              onClick={() => submitOrder("draft")}
              disabled={isSaving}
            >
              Salvar rascunho
            </button>
            <button
              type="button"
              className="mapping-primary-button"
              onClick={() => submitOrder("sent")}
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : "Marcar como enviado"}
            </button>
          </div>
        </div>
      )}

      {feedback ? (
        <p className={`inventory-feedback ${feedbackType}`}>{feedback}</p>
      ) : null}
    </section>
  );
}
