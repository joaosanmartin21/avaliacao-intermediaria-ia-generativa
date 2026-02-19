import { useEffect, useState } from "react";
import { needsRestock } from "../data/freezerDefaults";

const TOP_LEVEL_OPTIONS = [
  { value: "full", label: "Cheio" },
  { value: "half", label: "1/2" },
  { value: "quarter", label: "1/4" },
  { value: "empty", label: "Vazio" },
];

const BOTTOM_LEVEL_OPTIONS = [
  { value: "full", label: "Cheio" },
  { value: "empty", label: "Vazio" },
];

function getFreezerDisplayTitle(freezer) {
  const trimmedTitle = freezer?.title?.trim();
  if (trimmedTitle) {
    return trimmedTitle;
  }

  return `Freezer ${freezer?.order ?? ""}`.trim();
}

function getSlotClass(slot, columns) {
  const classes = ["freezer-slot"];

  classes.push(slot.flavor.trim() ? "mapped" : "unmapped");
  classes.push(needsRestock(slot) ? "needs-restock" : "stock-ok");
  classes.push(slot.position <= columns ? "slot-row-top" : "slot-row-bottom");

  return classes.join(" ");
}

function PencilButton({ label, onClick }) {
  return (
    <button
      type="button"
      className="inline-edit-trigger"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20h4l10-10-4-4L4 16v4z" />
        <path d="M13 7l4 4" />
      </svg>
    </button>
  );
}

export default function FreezerGrid({
  freezer,
  onSaveFreezerTitle,
  onSaveSlotFlavor,
  onChangeTopLevel,
  onChangeBottomLevel,
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [editingSlotPosition, setEditingSlotPosition] = useState(null);
  const [flavorDraft, setFlavorDraft] = useState("");
  const [flavorErrorPosition, setFlavorErrorPosition] = useState(null);

  useEffect(() => {
    setTitleDraft(freezer?.title ?? "");
    setIsEditingTitle(false);
    setEditingSlotPosition(null);
    setFlavorDraft("");
    setFlavorErrorPosition(null);
  }, [freezer?.id]);

  if (!freezer) {
    return (
      <section className="mapping-card freezer-grid-card">
        <header className="mapping-card-header">
          <h3>Mapa de sabores</h3>
          <p>Selecione um freezer para visualizar as caixas.</p>
        </header>
      </section>
    );
  }

  const columns = Math.max(1, Math.floor(freezer.capacity / 2));

  function startTitleEdit() {
    setTitleDraft(freezer.title);
    setIsEditingTitle(true);
  }

  function cancelTitleEdit() {
    setTitleDraft(freezer.title);
    setIsEditingTitle(false);
  }

  function commitTitleEdit() {
    const trimmed = titleDraft.trim();
    if (trimmed !== freezer.title) {
      onSaveFreezerTitle(trimmed);
    }
    setTitleDraft(trimmed);
    setIsEditingTitle(false);
  }

  function handleTitleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitTitleEdit();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelTitleEdit();
    }
  }

  function startFlavorEdit(slot) {
    setEditingSlotPosition(slot.position);
    setFlavorDraft(slot.flavor);
    setFlavorErrorPosition(null);
  }

  function cancelFlavorEdit() {
    setEditingSlotPosition(null);
    setFlavorDraft("");
    setFlavorErrorPosition(null);
  }

  function commitFlavorEdit(slot) {
    const trimmed = flavorDraft.trim();
    if (!trimmed) {
      setFlavorErrorPosition(slot.position);
      return;
    }

    if (trimmed !== slot.flavor.trim()) {
      onSaveSlotFlavor(slot.position, trimmed);
    }

    setEditingSlotPosition(null);
    setFlavorDraft("");
    setFlavorErrorPosition(null);
  }

  function handleFlavorKeyDown(event, slot) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitFlavorEdit(slot);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelFlavorEdit();
    }
  }

  return (
    <section className="mapping-card freezer-grid-card">
      <header className="mapping-card-header">
        <div className="freezer-title-inline">
          {isEditingTitle ? (
            <input
              type="text"
              className="inline-edit-input freezer-title-input"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={commitTitleEdit}
              onKeyDown={handleTitleKeyDown}
              maxLength={60}
              autoFocus
            />
          ) : (
            <h3>{getFreezerDisplayTitle(freezer)}</h3>
          )}
          <PencilButton label="Editar nome do freezer" onClick={startTitleEdit} />
        </div>
      </header>

      <div className="freezer-grid-scroll">
        <div className="freezer-grid" style={{ "--freezer-columns": columns }}>
          {freezer.slots.map((slot) => {
            const isEditingFlavor = editingSlotPosition === slot.position;

            return (
              <article key={slot.id} className={getSlotClass(slot, columns)}>
                <div className="slot-flavor-row">
                  {isEditingFlavor ? (
                    <input
                      type="text"
                      className="inline-edit-input slot-flavor-input"
                      value={flavorDraft}
                      onChange={(event) => setFlavorDraft(event.target.value)}
                      onBlur={() => commitFlavorEdit(slot)}
                      onKeyDown={(event) => handleFlavorKeyDown(event, slot)}
                      maxLength={80}
                      autoFocus
                    />
                  ) : (
                    <span className="slot-flavor">
                      {slot.flavor.trim() ? slot.flavor : "Sabor nao definido"}
                    </span>
                  )}

                  <PencilButton
                    label="Editar sabor"
                    onClick={() =>
                      isEditingFlavor ? cancelFlavorEdit() : startFlavorEdit(slot)
                    }
                  />
                </div>

                {flavorErrorPosition === slot.position ? (
                  <span className="slot-flavor-error">Informe o sabor.</span>
                ) : null}

                <div className="slot-levels">
                  <label className="slot-level-control">
                    <span>Cima</span>
                    <select
                      className={`level-select level-${slot.topLevel}`}
                      value={slot.topLevel}
                      onChange={(event) =>
                        onChangeTopLevel(slot.position, event.target.value)
                      }
                    >
                      {TOP_LEVEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="slot-level-control">
                    <span>Baixo</span>
                    <select
                      className={`level-select level-${slot.bottomLevel}`}
                      value={slot.bottomLevel}
                      onChange={(event) =>
                        onChangeBottomLevel(slot.position, event.target.value)
                      }
                    >
                      {BOTTOM_LEVEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
