export default function ChecklistSection({ section, statusMap, onToggle }) {
  const completed = section.items.filter((item) => Boolean(statusMap[item.id])).length;
  const total = section.items.length;
  const done = completed === total;

  return (
    <section className={`checklist-card ${done ? "is-done" : ""}`} aria-labelledby={section.id}>
      <header className="checklist-header">
        <h2 id={section.id}>{section.title}</h2>
        <span className="chip">
          {completed}/{total}
        </span>
      </header>

      <ul className="checklist-items">
        {section.items.map((item) => {
          const checked = Boolean(statusMap[item.id]);
          const inputId = `${section.id}-${item.id}`;

          return (
            <li key={item.id} className={checked ? "checked" : ""}>
              <label htmlFor={inputId} className="check-row">
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item.id)}
                />
                <span className="checkbox-ui" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M20 6L9 17L4 12" />
                  </svg>
                </span>
                <span className="item-text">{item.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
