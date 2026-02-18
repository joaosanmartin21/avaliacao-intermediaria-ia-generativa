import { useEffect, useMemo, useState } from "react";
import ChecklistSection from "./components/ChecklistSection";
import ProgressHeader from "./components/ProgressHeader";
import SuccessOverlay from "./components/SuccessOverlay";
import { checklistSections } from "./data/checklists";
import { clearChecklistState, loadChecklistState, saveChecklistState } from "./utils/storage";

export default function App() {
  const [statusMap, setStatusMap] = useState(() => loadChecklistState());

  const allItemIds = useMemo(
    () =>
      checklistSections.flatMap((section) =>
        section.items.map((item) => item.id)
      ),
    []
  );

  useEffect(() => {
    saveChecklistState(statusMap);
  }, [statusMap]);

  const finishedDay =
    allItemIds.length > 0 && allItemIds.every((itemId) => Boolean(statusMap[itemId]));

  function handleToggle(itemId) {
    setStatusMap((current) => ({
      ...current,
      [itemId]: !current[itemId],
    }));
  }

  function handleReset() {
    setStatusMap({});
    clearChecklistState();
  }

  return (
    <>
      <header className="top-nav">
        <div className="top-nav-inner">
          <a className="brand" href="#" aria-label="Página inicial 60 Sabores">
            <img
              className="brand-logo"
              src="/logo-60-sabores.jpeg"
              alt="Logo 60 Sabores"
            />
          </a>

          <nav className="top-menu" aria-label="Menu superior">
            <button type="button" className="menu-item active" aria-current="page">
              Checklist
            </button>
            <button
              type="button"
              className="menu-item disabled"
              aria-disabled="true"
              disabled
              title="Em breve"
            >
              Tela 2
            </button>
            <button
              type="button"
              className="menu-item disabled"
              aria-disabled="true"
              disabled
              title="Em breve"
            >
              Tela 3
            </button>
          </nav>
        </div>
      </header>

      <div className="app-shell">
        <ProgressHeader
          sections={checklistSections}
          statusMap={statusMap}
          onReset={handleReset}
        />

        <main className="section-grid">
          {checklistSections.map((section) => (
            <ChecklistSection
              key={section.id}
              section={section}
              statusMap={statusMap}
              onToggle={handleToggle}
            />
          ))}
        </main>
      </div>

      <SuccessOverlay visible={finishedDay} />
    </>
  );
}
