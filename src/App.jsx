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
