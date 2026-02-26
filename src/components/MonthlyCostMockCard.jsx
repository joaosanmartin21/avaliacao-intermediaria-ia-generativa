import { formatCurrencyBRL, formatMonthRef } from "../utils/formatters";

function generateMockReport(monthRef) {
  const [yearText = "2026", monthText = "01"] = (monthRef || "").split("-");
  const year = Number.parseInt(yearText, 10) || 2026;
  const month = Number.parseInt(monthText, 10) || 1;

  const seed = year * 31 + month * 17;
  const estimatedCost = 1800 + (seed % 2200);
  const operationalCost = 900 + (seed % 1300);
  const alerts = [
    "Reforçar compra de embalagens e complementos.",
    "Reavaliar preços de itens com maior oscilação.",
    "Comparar custo por fornecedor antes do fechamento do pedido.",
  ];

  return {
    estimatedCost,
    operationalCost,
    alerts,
  };
}

export default function MonthlyCostMockCard({ monthRef, onChangeMonth }) {
  const report = generateMockReport(monthRef);

  return (
    <section className="mapping-card assistant-card">
      <header className="mapping-card-header">
        <h3>Painel mensal (estimativa local)</h3>
        <p>
          Indicadores determinísticos para apoiar o chat com IA local e comparar
          tendência de custos por mês.
        </p>
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
          <span>Custo operacional</span>
          <strong>{formatCurrencyBRL(report.operationalCost)}</strong>
        </article>
      </div>

      <p className="mock-month-label">Período: {formatMonthRef(monthRef)}</p>

      <ul className="mock-alert-list">
        {report.alerts.map((alert) => (
          <li key={alert}>{alert}</li>
        ))}
      </ul>
    </section>
  );
}
