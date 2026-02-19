import { useEffect, useMemo, useState } from "react";
import {
  createFreezer,
  createInitialMappingState,
  reorderFreezers,
} from "../data/freezerDefaults";
import {
  loadFreezerMappingState,
  saveFreezerMappingState,
} from "../utils/freezerStorage";
import FreezerGrid from "./FreezerGrid";
import FreezerSetupWizard from "./FreezerSetupWizard";
import FreezerSortableList from "./FreezerSortableList";
import ImageUploadCard from "./ImageUploadCard";

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

export default function FreezerMappingScreen() {
  const [mappingState, setMappingState] = useState(() => loadFreezerMappingState());
  const [showSetupWizard, setShowSetupWizard] = useState(() => {
    const loaded = loadFreezerMappingState();
    return !loaded.setupCompleted || loaded.freezers.length === 0;
  });
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  useEffect(() => {
    saveFreezerMappingState(mappingState);
  }, [mappingState]);

  useEffect(() => {
    if (!mappingState.setupCompleted || mappingState.freezers.length === 0) {
      setShowSetupWizard(true);
    }
  }, [mappingState.setupCompleted, mappingState.freezers.length]);

  useEffect(
    () => () => {
      if (imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    },
    [imagePreviewUrl]
  );

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
    return { totalSlots, mappedSlots };
  }, [mappingState.freezers]);

  function handleSetupConfirm({ countOf12, countOf8 }) {
    const initialState = createInitialMappingState(countOf12, countOf8);
    setMappingState(initialState);
    setShowSetupWizard(false);
    setImagePreviewUrl("");
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

  function handleUploadImage(file) {
    if (!file) {
      setImagePreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(objectUrl);
  }

  function handleClearImage() {
    if (imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl("");
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

  return (
    <>
      <section className="mapping-shell">
        <header className="mapping-hero">
          <p className="eyebrow">Tela 2</p>
          <h1>Relatório de Compras de Sorvetes</h1>
          <p className="hero-copy">
            Organize os freezers e níveis de estoque para gerar, em breve, o
            relatório inteligente de compras com IA.
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
            <ImageUploadCard
              imagePreviewUrl={imagePreviewUrl}
              onUpload={handleUploadImage}
              onClear={handleClearImage}
            />

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
                <p>
                  Em breve este botao ira chamar o backend com IA para gerar o
                  relatório inteligente de compras.
                </p>
              </header>

              <button
                type="button"
                className="mapping-primary-button report-action-button"
              >
                Gerar Relatório de Compras
              </button>
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
