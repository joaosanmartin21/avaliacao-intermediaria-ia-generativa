import { formatCurrencyBRL, formatDateTime } from "../utils/formatters";

function getStatusLabel(status) {
  if (status === "sent") {
    return "Enviado";
  }
  return "Rascunho";
}

export default function PurchaseOrderHistory({ orders, onMarkAsSent }) {
  return (
    <section className="mapping-card inventory-card">
      <header className="mapping-card-header">
        <h3>Histórico de pedidos</h3>
        <p>Pedidos registrados para acompanhamento e controle futuro de custos.</p>
      </header>

      {orders.length === 0 ? (
        <p className="inventory-empty">Nenhum pedido encontrado neste período.</p>
      ) : (
        <div className="order-history-list">
          {orders.map((order) => (
            <article key={order.id} className="order-history-item">
              <header className="order-history-header">
                <div>
                  <strong>Pedido #{order.id}</strong>
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
                <div className="order-history-meta">
                  <span className={`order-status ${order.status}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  <strong>{formatCurrencyBRL(order.totalCost)}</strong>
                </div>
              </header>

              <ul className="order-history-lines">
                {order.lines.map((line) => (
                  <li key={line.id}>
                    <span>{line.itemNameSnapshot}</span>
                    <span>
                      {line.quantity} x {formatCurrencyBRL(line.unitPriceSnapshot)}
                    </span>
                    <strong>{formatCurrencyBRL(line.lineTotal)}</strong>
                  </li>
                ))}
              </ul>

              {order.status === "draft" ? (
                <button
                  type="button"
                  className="mapping-primary-button"
                  onClick={() => onMarkAsSent(order.id)}
                >
                  Marcar como enviado
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
