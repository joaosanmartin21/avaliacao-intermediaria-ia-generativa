import { useMemo, useState } from "react";
import { formatCurrencyBRL } from "../utils/formatters";

export default function InventoryItemList({ items, onUpdateItem, onDeleteItem }) {
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [draftPrice, setDraftPrice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("info");

  const sortedItems = useMemo(
    () =>
      [...(items ?? [])].sort((left, right) =>
        left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" })
      ),
    [items]
  );

  function startEdit(item) {
    setEditingId(item.id);
    setDraftName(item.name);
    setDraftPrice(String(item.unitPrice ?? ""));
    setFeedback("");
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftName("");
    setDraftPrice("");
  }

  async function saveEdit(itemId) {
    setIsSaving(true);
    setFeedback("");

    try {
      await onUpdateItem(itemId, {
        name: draftName,
        unitPrice: draftPrice,
      });
      setFeedbackType("success");
      setFeedback("Item atualizado com sucesso.");
      cancelEdit();
    } catch (error) {
      setFeedbackType("error");
      setFeedback(error?.message || "Não foi possível atualizar o item.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Deseja excluir o item "${item.name}"? Ele deixará de aparecer em novos pedidos.`
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setFeedback("");

    try {
      await onDeleteItem(item.id);
      if (editingId === item.id) {
        cancelEdit();
      }
      setFeedbackType("success");
      setFeedback("Item excluído com sucesso.");
    } catch (error) {
      setFeedbackType("error");
      setFeedback(error?.message || "Não foi possível excluir o item.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="mapping-card inventory-card">
      <header className="mapping-card-header">
        <h3>Lista de itens cadastrados</h3>
        <p>Edite nome e preço diretamente para manter o estoque atualizado.</p>
      </header>

      {sortedItems.length === 0 ? (
        <p className="inventory-empty">Nenhum item cadastrado ainda.</p>
      ) : (
        <div className="inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Preço</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => {
                const isEditing = editingId === item.id;

                return (
                  <tr key={item.id}>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={draftName}
                          onChange={(event) => setDraftName(event.target.value)}
                          maxLength={80}
                        />
                      ) : (
                        item.name
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          value={draftPrice}
                          onChange={(event) => setDraftPrice(event.target.value)}
                          min={0}
                          step="0.01"
                        />
                      ) : (
                        formatCurrencyBRL(item.unitPrice)
                      )}
                    </td>
                    <td className="inventory-actions-cell">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className="mapping-primary-button"
                            onClick={() => saveEdit(item.id)}
                            disabled={isSaving || isDeleting}
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            className="mapping-ghost-button"
                            onClick={cancelEdit}
                            disabled={isSaving || isDeleting}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="mapping-ghost-button"
                            onClick={() => startEdit(item)}
                            disabled={isDeleting}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="mapping-danger-button"
                            onClick={() => handleDelete(item)}
                            disabled={isDeleting}
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {feedback ? (
        <p className={`inventory-feedback ${feedbackType}`}>{feedback}</p>
      ) : null}
    </section>
  );
}
