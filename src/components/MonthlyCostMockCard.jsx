import { useMemo } from "react";
import { formatCurrencyBRL, formatMonthRef } from "../utils/formatters";

function toMoney(value) {
  const numeric = Number.parseFloat(String(value));
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric * 100) / 100;
}

function buildRealMonthlyReport(orders) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const itemTotals = new Map();
  let estimatedCost = 0;
  let operationalCost = 0;
  let sentOrders = 0;
  let draftOrders = 0;

  for (const order of safeOrders) {
    const orderTotal = toMoney(order?.totalCost);
    estimatedCost = toMoney(estimatedCost + orderTotal);

    if (order?.status === "sent") {
      sentOrders += 1;
      operationalCost = toMoney(operationalCost + orderTotal);
    } else {
      draftOrders += 1;
    }

    for (const line of order?.lines ?? []) {
      const name =
        typeof line?.itemNameSnapshot === "string" && line.itemNameSnapshot.trim()
          ? line.itemNameSnapshot.trim()
          : "Item não identificado";
      const lineTotal = toMoney(line?.lineTotal);
      const current = itemTotals.get(name) ?? 0;
      itemTotals.set(name, toMoney(current + lineTotal));
    }
  }

  const topItem = [...itemTotals.entries()]
    .sort((left, right) => right[1] - left[1])
    .at(0);

  const alerts = [];
  if (safeOrders.length === 0) {
    alerts.push("Nenhum pedido registrado neste período.");
  }
  if (draftOrders > 0) {
    alerts.push(`${draftOrders} pedido(s) em rascunho aguardando envio.`);
  }
  if (estimatedCost > 0 && operationalCost === 0) {
    alerts.push("Sem pedidos enviados no período.");
  }
  if (topItem) {
    alerts.push(`Maior impacto no mês: ${topItem[0]} (${formatCurrencyBRL(topItem[1])}).`);
  }
  if (alerts.length === 0) {
    alerts.push("Sem alertas operacionais para este período.");
  }

  return {
    estimatedCost,
    operationalCost,
    totalOrders: safeOrders.length,
    sentOrders,
    draftOrders,
    alerts,
  };
}

export default function MonthlyCostMockCard({ monthRef, onChangeMonth, orders }) {
  const report = useMemo(() => buildRealMonthlyReport(orders), [orders]);

  return (
    <section className="mapping-card assistant-card">
      <header className="mapping-card-header">
        <h3>Painel mensal (dados reais)</h3>
        <p>Indicadores consolidados a partir dos pedidos do mês selecionado.</p>
      </header>

      <label className="inventory-month-filter">
        Mês de referência
        <input
          type="month"
          value={monthRef}
          onChange={(event) => onChangeMonth(event.target.value)}
        />
      </label>

      <div className="mock-metrics-grid">
        <article className="mock-metric">
          <span>Custo estimado</span>
          <strong>{formatCurrencyBRL(report.estimatedCost)}</strong>
        </article>
        <article className="mock-metric">
          <span>Custo operacional (enviados)</span>
          <strong>{formatCurrencyBRL(report.operationalCost)}</strong>
        </article>
      </div>

      <p className="mock-month-label">Período: {formatMonthRef(monthRef)}</p>
      <p className="mock-month-label">
        Pedidos: {report.totalOrders} total | {report.sentOrders} enviados |{" "}
        {report.draftOrders} rascunho
      </p>

      <ul className="mock-alert-list">
        {report.alerts.map((alert) => (
          <li key={alert}>{alert}</li>
        ))}
      </ul>
    </section>
  );
}
