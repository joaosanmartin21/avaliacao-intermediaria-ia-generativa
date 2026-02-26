import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import PurchaseOrderForm from "./PurchaseOrderForm";
import PurchaseOrderHistory from "./PurchaseOrderHistory";
import {
  createPurchaseOrder,
  listActiveItems,
  listPurchaseOrdersByMonth,
  updatePurchaseOrderStatus,
} from "../data/inventoryRepository";
import { formatMonthRef, getCurrentMonthRef } from "../utils/formatters";

export default function PurchaseOrdersScreen() {
  const [monthRef, setMonthRef] = useState(getCurrentMonthRef());
  const [historyFeedback, setHistoryFeedback] = useState("");
  const [historyFeedbackType, setHistoryFeedbackType] = useState("info");

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

  const orders = useLiveQuery(
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

  async function handleUpdateStatusToSent(orderId) {
    try {
      await updatePurchaseOrderStatus(orderId, "sent");
      setHistoryFeedbackType("success");
      setHistoryFeedback("Pedido atualizado para enviado.");
    } catch (error) {
      setHistoryFeedbackType("error");
      setHistoryFeedback(error?.message || "Não foi possível atualizar o pedido.");
    }
  }

  return (
    <section className="inventory-shell">
      <header className="mapping-hero">
        <p className="eyebrow">Estoque</p>
        <h1>Pedidos do Mês</h1>
        <p className="hero-copy">
          Selecione o mês, monte o pedido com os itens cadastrados e acompanhe o
          histórico realizado.
        </p>
        <div className="mapping-summary">
          <span>
            Mês selecionado: <strong>{formatMonthRef(monthRef)}</strong>
          </span>
          <span>
            Pedidos no mês: <strong>{orders.length}</strong>
          </span>
        </div>
      </header>

      <section className="inventory-main inventory-main-single">
        <section className="mapping-card inventory-card">
          <header className="mapping-card-header">
            <h3>Mês de referência</h3>
            <p>Escolha o mês para registrar e consultar os pedidos.</p>
          </header>

          <label className="inventory-month-filter">
            Mês
            <input
              type="month"
              value={monthRef}
              onChange={(event) => setMonthRef(event.target.value)}
            />
          </label>

          {historyFeedback ? (
            <p className={`inventory-feedback ${historyFeedbackType}`}>
              {historyFeedback}
            </p>
          ) : null}
        </section>

        <PurchaseOrderForm
          items={items}
          onCreateOrder={createPurchaseOrder}
          monthRef={monthRef}
        />

        <PurchaseOrderHistory
          orders={orders}
          onMarkAsSent={handleUpdateStatusToSent}
        />
      </section>
    </section>
  );
}
