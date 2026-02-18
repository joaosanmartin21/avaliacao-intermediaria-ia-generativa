export default function ProgressHeader({ sections, statusMap, onReset }) {
  const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0);
  const completedItems = sections.reduce(
    (acc, section) =>
      acc + section.items.filter((item) => Boolean(statusMap[item.id])).length,
    0
  );
  const percentage = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  return (
    <header className="hero-card">
      <div>
        <p className="eyebrow">Rotina diária</p>
        <h1>Checklist Operacional da Loja</h1>
        <p className="hero-copy">
          Marque cada etapa para garantir uma abertura e um fechamento sem falhas.
        </p>
      </div>

      <div className="progress-wrap">
        <div className="progress-meta">
          <span>Progresso total</span>
          <strong>
            {completedItems}/{totalItems}
          </strong>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          aria-label="Progresso geral dos checklists"
        >
          <div className="progress-fill" style={{ width: `${percentage}%` }} />
        </div>
        <div className="progress-footer">
          <span>{percentage}% concluído</span>
          <button type="button" className="ghost-button" onClick={onReset}>
            Limpar progresso do dia
          </button>
        </div>
      </div>
    </header>
  );
}
