import { formatCurrencyBRL, formatMonthRef } from "../utils/formatters";

function generateMockReport(monthRef) {
  const [yearText = "2026", monthText = "01"] = (monthRef || "").split("-");
  const year = Number.parseInt(yearText, 10) || 2026;
  const month = Number.parseInt(monthText, 10) || 1;

  const seed = year * 31 + month * 17;
  const estimatedCost = 1800 + (seed % 2200);
  const operationalCost = 900 + (seed % 1300);
  const alerts = [
    "Reforcar compra de embalagens e complementos.",
    "Reavaliar precos de itens com maior oscilacao.",
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
        <h3>Relatorio mensal (mock)</h3>
        <p>
          Dados ficticios para validar a estrutura da Tela 4 antes da integracao
          com IA.
        </p>
      </header>

      <label className="inventory-month-filter">
        Mes de referencia
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

      <p className="mock-month-label">Periodo: {formatMonthRef(monthRef)}</p>

      <ul className="mock-alert-list">
        {report.alerts.map((alert) => (
          <li key={alert}>{alert}</li>
        ))}
      </ul>
    </section>
  );
}
