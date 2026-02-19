import { useEffect, useMemo, useState } from "react";
import AssistantScreen from "./components/AssistantScreen";
import ChecklistSection from "./components/ChecklistSection";
import FreezerMappingScreen from "./components/FreezerMappingScreen";
import ItemCatalogScreen from "./components/ItemCatalogScreen";
import PurchaseOrdersScreen from "./components/PurchaseOrdersScreen";
import ProgressHeader from "./components/ProgressHeader";
import SuccessOverlay from "./components/SuccessOverlay";
import { checklistSections } from "./data/checklists";
import {
  clearChecklistState,
  loadChecklistState,
  saveChecklistState,
} from "./utils/storage";

export default function App() {
  const [statusMap, setStatusMap] = useState(() => loadChecklistState());
  const [activeView, setActiveView] = useState("checklist");

  const allItemIds = useMemo(
    () => checklistSections.flatMap((section) => section.items.map((item) => item.id)),
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

  function renderCurrentView() {
    if (activeView === "checklist") {
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

          <SuccessOverlay visible={finishedDay} onConfirm={handleReset} />
        </>
      );
    }

    return (
      <div className="app-shell app-shell-mapping">
        {activeView === "mapping" ? <FreezerMappingScreen /> : null}
        {activeView === "items" ? <ItemCatalogScreen /> : null}
        {activeView === "orders" ? <PurchaseOrdersScreen /> : null}
        {activeView === "assistant" ? <AssistantScreen /> : null}
      </div>
    );
  }

  return (
    <>
      <header className="top-nav">
        <div className="top-nav-inner">
          <a className="brand" href="#" aria-label="Pagina inicial 60 Sabores">
            <img className="brand-logo" src="/logo-60-sabores.jpeg" alt="Logo 60 Sabores" />
          </a>

          <nav className="top-menu" aria-label="Menu superior">
            <button
              type="button"
              className={`menu-item ${activeView === "checklist" ? "active" : ""}`}
              aria-current={activeView === "checklist" ? "page" : undefined}
              onClick={() => setActiveView("checklist")}
            >
              Checklist
            </button>
            <button
              type="button"
              className={`menu-item ${activeView === "mapping" ? "active" : ""}`}
              aria-current={activeView === "mapping" ? "page" : undefined}
              onClick={() => setActiveView("mapping")}
            >
              Mapeamento
            </button>
            <button
              type="button"
              className={`menu-item ${activeView === "items" ? "active" : ""}`}
              aria-current={activeView === "items" ? "page" : undefined}
              onClick={() => setActiveView("items")}
            >
              Itens
            </button>
            <button
              type="button"
              className={`menu-item ${activeView === "orders" ? "active" : ""}`}
              aria-current={activeView === "orders" ? "page" : undefined}
              onClick={() => setActiveView("orders")}
            >
              Pedidos
            </button>
            <button
              type="button"
              className={`menu-item ${activeView === "assistant" ? "active" : ""}`}
              aria-current={activeView === "assistant" ? "page" : undefined}
              onClick={() => setActiveView("assistant")}
            >
              Assistente
            </button>
          </nav>
        </div>
      </header>

      {renderCurrentView()}
    </>
  );
}
