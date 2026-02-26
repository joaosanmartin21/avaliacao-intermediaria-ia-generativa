import { useEffect, useMemo, useState } from "react";
import {
  buildShoppingSummary,
  createFreezer,
  createInitialMappingState,
  needsRestock,
  reorderFreezers,
} from "../data/freezerDefaults";
import { requestShoppingReport } from "../services/shoppingReportApi";
import {
  loadFreezerMappingState,
  saveFreezerMappingState,
} from "../utils/freezerStorage";
import { downloadShoppingReportPdf } from "../utils/shoppingReportPdf";
import FreezerGrid from "./FreezerGrid";
import FreezerSetupWizard from "./FreezerSetupWizard";
import FreezerSortableList from "./FreezerSortableList";

function countMappedSlots(slots) {
  return slots.filter((slot) => slot.flavor.trim().length > 0).length;
}

function getFreezerDisplayTitle(freezer) {
  const trimmedTitle = freezer?.title?.trim();
  if (trimmedTitle) {
    return trimmedTitle;
  }

  return `Freezer ${freezer?.order ?? ""}`.trim();
}

function getPriorityLabel(priority) {
  if (priority === "alta") {
    return "Alta";
  }
  if (priority === "baixa") {
    return "Baixa";
  }
  return "Media";
}

export default function FreezerMappingScreen() {
  const [mappingState, setMappingState] = useState(() => loadFreezerMappingState());
  const [showSetupWizard, setShowSetupWizard] = useState(() => {
    const loaded = loadFreezerMappingState();
    return !loaded.setupCompleted || loaded.freezers.length === 0;
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [shoppingReport, setShoppingReport] = useState(null);
  const [shoppingReportMeta, setShoppingReportMeta] = useState(null);
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    saveFreezerMappingState(mappingState);
  }, [mappingState]);

  useEffect(() => {
    if (!mappingState.setupCompleted || mappingState.freezers.length === 0) {
      setShowSetupWizard(true);
    }
  }, [mappingState.setupCompleted, mappingState.freezers.length]);

  const selectedFreezer = useMemo(() => {
    return (
      mappingState.freezers.find(
        (freezer) => freezer.id === mappingState.selectedFreezerId
      ) ?? mappingState.freezers[0] ?? null
    );
  }, [mappingState.freezers, mappingState.selectedFreezerId]);

  const mappingSummary = useMemo(() => {
    const totalSlots = mappingState.freezers.reduce(
      (sum, freezer) => sum + freezer.capacity,
      0
    );
    const mappedSlots = mappingState.freezers.reduce(
      (sum, freezer) => sum + countMappedSlots(freezer.slots),
      0
    );

    return {
      totalSlots,
      mappedSlots,
      totalFreezers: mappingState.freezers.length,
    };
  }, [mappingState.freezers]);

  const shoppingSummary = useMemo(() => {
    return buildShoppingSummary(mappingState.freezers);
  }, [mappingState.freezers]);

  const shoppingReportContext = useMemo(() => {
    const freezers = mappingState.freezers.map((freezer) => {
      const displayTitle = getFreezerDisplayTitle(freezer);
      const slots = Array.isArray(freezer.slots) ? freezer.slots : [];

      return {
        title: displayTitle,
        order: freezer.order,
        capacity: freezer.capacity,
        mappedSlots: countMappedSlots(slots),
        lowStockSlots: slots
          .filter((slot) => needsRestock(slot))
          .map((slot) => ({
            position: slot.position,
            flavor: slot.flavor,
            topLevel: slot.topLevel,
            bottomLevel: slot.bottomLevel,
          })),
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      mappingSummary,
      shoppingSummary,
      freezers,
    };
  }, [mappingState.freezers, mappingSummary, shoppingSummary]);

  function handleSetupConfirm({ countOf12, countOf8 }) {
    const initialState = createInitialMappingState(countOf12, countOf8);
    setMappingState(initialState);
    setShowSetupWizard(false);
  }

  function handleSelectFreezer(freezerId) {
    setMappingState((current) => ({
      ...current,
      selectedFreezerId: freezerId,
    }));
  }

  function handleReorder(sourceId, targetId) {
    setMappingState((current) => ({
      ...current,
      freezers: reorderFreezers(current.freezers, sourceId, targetId),
    }));
  }

  function handleCreateFreezer() {
    setMappingState((current) => {
      const nextOrder = current.freezers.length + 1;
      const created = createFreezer({
        title: "",
        capacity: 12,
        order: nextOrder,
      });
      return {
        ...current,
        setupCompleted: true,
        selectedFreezerId: created.id,
        freezers: [...current.freezers, created],
      };
    });
  }

  function handleDeleteFreezer() {
    if (!selectedFreezer) {
      return;
    }

    const confirmed = window.confirm(
      `Deseja excluir o freezer "${getFreezerDisplayTitle(selectedFreezer)}"?`
    );
    if (!confirmed) {
      return;
    }

    setMappingState((current) => {
      const nextFreezers = current.freezers.filter(
        (freezer) => freezer.id !== selectedFreezer.id
      );

      return {
        ...current,
        setupCompleted: nextFreezers.length > 0,
        selectedFreezerId: nextFreezers[0]?.id ?? null,
        freezers: nextFreezers.map((freezer, index) => ({
          ...freezer,
          order: index + 1,
        })),
      };
    });
  }

  function handleResetSetup() {
    const confirmed = window.confirm(
      "Deseja abrir novamente o assistente e reconfigurar os freezers?"
    );
    if (!confirmed) {
      return;
    }
    setShowSetupWizard(true);
  }

  function handleSaveFreezerTitle(title) {
    if (!selectedFreezer) {
      return;
    }

    const trimmed = title.trim();

    setMappingState((current) => ({
      ...current,
      freezers: current.freezers.map((freezer) =>
        freezer.id === selectedFreezer.id
          ? {
              ...freezer,
              title: trimmed,
            }
          : freezer
      ),
    }));
  }

  function handleSaveSlotFlavor(position, flavor) {
    if (!selectedFreezer) {
      return;
    }

    setMappingState((current) => ({
      ...current,
      freezers: current.freezers.map((freezer) => {
        if (freezer.id !== selectedFreezer.id) {
          return freezer;
        }

        return {
          ...freezer,
          slots: freezer.slots.map((slot) =>
            slot.position === position
              ? {
                  ...slot,
                  flavor,
                }
              : slot
          ),
        };
      }),
    }));
  }

  function handleChangeTopLevel(position, topLevel) {
    if (!selectedFreezer) {
      return;
    }

    setMappingState((current) => ({
      ...current,
      freezers: current.freezers.map((freezer) => {
        if (freezer.id !== selectedFreezer.id) {
          return freezer;
        }

        return {
          ...freezer,
          slots: freezer.slots.map((slot) =>
            slot.position === position
              ? {
                  ...slot,
                  topLevel,
                }
              : slot
          ),
        };
      }),
    }));
  }

  function handleChangeBottomLevel(position, bottomLevel) {
    if (!selectedFreezer) {
      return;
    }

    setMappingState((current) => ({
      ...current,
      freezers: current.freezers.map((freezer) => {
        if (freezer.id !== selectedFreezer.id) {
          return freezer;
        }

        return {
          ...freezer,
          slots: freezer.slots.map((slot) =>
            slot.position === position
              ? {
                  ...slot,
                  bottomLevel,
                }
              : slot
          ),
        };
      }),
    }));
  }

  async function handleGenerateShoppingReport() {
    setIsGeneratingReport(true);
    setReportError("");

    try {
      const payload = await requestShoppingReport({
        context: shoppingReportContext,
      });

      const report =
        typeof payload?.report === "object" &&
        payload.report !== null &&
        !Array.isArray(payload.report)
          ? payload.report
          : null;

      if (!report) {
        throw new Error("Resposta de relatorio invalida.");
      }

      setShoppingReport(report);
      const reportMeta = {
        provider:
          typeof payload.provider === "string" && payload.provider.trim()
            ? payload.provider.trim()
            : "desconhecido",
        model:
          typeof payload.model === "string" && payload.model.trim()
            ? payload.model.trim()
            : "desconhecido",
        generatedAt:
          typeof payload.generatedAt === "string" && payload.generatedAt.trim()
            ? payload.generatedAt.trim()
            : new Date().toISOString(),
      };
      setShoppingReportMeta(reportMeta);
      downloadShoppingReportPdf({
        report,
        meta: reportMeta,
      });
    } catch (error) {
      setReportError(
        error?.message || "Nao foi possivel gerar o relatorio com IA."
      );
    } finally {
      setIsGeneratingReport(false);
    }
  }

  return (
    <>
      <section className="mapping-shell">
        <header className="mapping-hero">
          <p className="eyebrow">Tela 2</p>
          <h1>Relatório de Compras de Sorvetes</h1>
          <p className="hero-copy">
            Organize os freezers e niveis de estoque para gerar relatorio inteligente
            de compras com IA.
          </p>
          <div className="mapping-summary">
            <span>
              Freezers cadastrados: <strong>{mappingState.freezers.length}</strong>
            </span>
            <span>
              Caixas mapeadas:{" "}
              <strong>
                {mappingSummary.mappedSlots}/{mappingSummary.totalSlots}
              </strong>
            </span>
          </div>
        </header>

        <div className="mapping-layout">
          <aside className="mapping-sidebar">
            <FreezerSortableList
              freezers={mappingState.freezers}
              selectedFreezerId={selectedFreezer?.id ?? null}
              onSelect={handleSelectFreezer}
              onReorder={handleReorder}
              onCreate={handleCreateFreezer}
            />

            <section className="mapping-card freezer-actions-card">
              <header className="mapping-card-header">
                <h3>Acoes Rapidas</h3>
                <p>Gerencie o freezer selecionado sem abrir painel extra.</p>
              </header>
              <div className="freezer-manager-actions">
                <button
                  type="button"
                  className="mapping-danger-button"
                  onClick={handleDeleteFreezer}
                  disabled={!selectedFreezer}
                >
                  Excluir freezer selecionado
                </button>
                <button
                  type="button"
                  className="mapping-ghost-button"
                  onClick={handleResetSetup}
                >
                  Reconfigurar estrutura inicial
                </button>
              </div>
            </section>
          </aside>

          <section className="mapping-main">
            <FreezerGrid
              freezer={selectedFreezer}
              onSaveFreezerTitle={handleSaveFreezerTitle}
              onSaveSlotFlavor={handleSaveSlotFlavor}
              onChangeTopLevel={handleChangeTopLevel}
              onChangeBottomLevel={handleChangeBottomLevel}
            />

            <section className="mapping-card shopping-summary-card">
              <header className="mapping-card-header">
                <h3>Relatório de Compras</h3>
                <p>Gere um relatorio estruturado com prioridades de compra por sabor.</p>
              </header>

              <button
                type="button"
                className="mapping-primary-button report-action-button"
                onClick={handleGenerateShoppingReport}
                disabled={isGeneratingReport || mappingState.freezers.length === 0}
              >
                {isGeneratingReport
                  ? "Gerando relatorio com IA..."
                  : "Gerar Relatorio e Baixar PDF"}
              </button>

              {reportError ? (
                <p className="inventory-feedback error">{reportError}</p>
              ) : null}

              {shoppingReportMeta ? (
                <p className="shopping-report-meta">
                  Fonte: <strong>{shoppingReportMeta.provider}</strong> | Modelo:{" "}
                  <strong>{shoppingReportMeta.model}</strong>
                </p>
              ) : null}

              {shoppingReport ? (
                <>
                  <div className="shopping-overview-grid">
                    <article className="shopping-overview-item">
                      <span>Slots mapeados</span>
                      <strong>
                        {shoppingReport.overview?.mappedSlots ?? 0}/
                        {shoppingReport.overview?.totalSlots ?? 0}
                      </strong>
                    </article>
                    <article className="shopping-overview-item">
                      <span>Sabores para compra</span>
                      <strong>{shoppingReport.overview?.totalFlavorsToBuy ?? 0}</strong>
                    </article>
                    <article className="shopping-overview-item">
                      <span>Slots com reposicao</span>
                      <strong>
                        {shoppingReport.overview?.slotsNeedingRestock ?? 0}
                      </strong>
                    </article>
                  </div>

                  <h4 className="shopping-section-title">Prioridades de compra</h4>
                  <ul className="shopping-list">
                    {(shoppingReport.priorityPurchases ?? []).map((item, index) => (
                      <li key={`${item.flavor}_${index}`} className="shopping-item">
                        <div className="shopping-item-head">
                          <strong>{item.flavor}</strong>
                          <span
                            className={`shopping-priority-chip ${item.priority || "media"}`}
                          >
                            {getPriorityLabel(item.priority)}
                          </span>
                        </div>
                        <span className="shopping-qty-label">
                          Quantidade sugerida: <strong>{item.suggestedQuantity ?? 1}</strong>
                        </span>
                        <p className="shopping-reason">{item.reason}</p>
                      </li>
                    ))}
                  </ul>

                  {(shoppingReport.warnings ?? []).length > 0 ? (
                    <>
                      <h4 className="shopping-section-title">Alertas</h4>
                      <ul className="shopping-locations shopping-warning-list">
                        {shoppingReport.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </>
              ) : (
                <p className="shopping-empty">
                  Clique no botao para gerar o relatorio de compras com IA.
                </p>
              )}
            </section>
          </section>
        </div>
      </section>

      <FreezerSetupWizard
        visible={showSetupWizard}
        onConfirm={handleSetupConfirm}
      />
    </>
  );
}

