import { useState } from "react";

function countFilledSlots(slots) {
  return slots.filter((slot) => slot.flavor.trim().length > 0).length;
}

function getFreezerDisplayTitle(freezer) {
  const trimmedTitle = freezer?.title?.trim();
  if (trimmedTitle) {
    return trimmedTitle;
  }

  return `Freezer ${freezer?.order ?? ""}`.trim();
}

export default function FreezerSortableList({
  freezers,
  selectedFreezerId,
  onSelect,
  onReorder,
  onCreate,
}) {
  const [draggingId, setDraggingId] = useState(null);
  const [hoverId, setHoverId] = useState(null);

  function handleDragStart(event, freezerId) {
    setDraggingId(freezerId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", freezerId);
  }

  function handleDragOver(event, freezerId) {
    event.preventDefault();
    if (freezerId !== draggingId) {
      setHoverId(freezerId);
    }
  }

  function handleDrop(event, freezerId) {
    event.preventDefault();
    const sourceId = draggingId || event.dataTransfer.getData("text/plain");
    if (sourceId && sourceId !== freezerId) {
      onReorder(sourceId, freezerId);
    }
    setDraggingId(null);
    setHoverId(null);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setHoverId(null);
  }

  return (
    <section className="mapping-card freezer-list-card">
      <header className="mapping-card-header">
        <h3>Freezers da loja</h3>
        <p>Arraste para reordenar conforme a posição real da loja.</p>
      </header>

      <div className="freezer-list">
        {freezers.map((freezer) => {
          const filledSlots = countFilledSlots(freezer.slots);
          const isActive = freezer.id === selectedFreezerId;
          const isHoverTarget = hoverId === freezer.id && draggingId !== freezer.id;

          return (
            <button
              key={freezer.id}
              type="button"
              draggable
              onDragStart={(event) => handleDragStart(event, freezer.id)}
              onDragOver={(event) => handleDragOver(event, freezer.id)}
              onDrop={(event) => handleDrop(event, freezer.id)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelect(freezer.id)}
              className={[
                "freezer-list-item",
                isActive ? "active" : "",
                isHoverTarget ? "drag-target" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="freezer-title-wrap">
                <strong>{getFreezerDisplayTitle(freezer)}</strong>
                <span>{freezer.capacity} sabores</span>
              </div>
              <small>
                {filledSlots}/{freezer.capacity} mapeados
              </small>
            </button>
          );
        })}
      </div>

      <button type="button" className="mapping-primary-button" onClick={onCreate}>
        + Novo freezer
      </button>
    </section>
  );
}
