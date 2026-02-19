import { useEffect, useState } from "react";

const TOP_LEVEL_OPTIONS = [
  { value: "full", label: "Cheio" },
  { value: "half", label: "1/2" },
  { value: "quarter", label: "1/4" },
  { value: "empty", label: "Vazio" },
];

const BOTTOM_LEVEL_OPTIONS = [
  { value: "full", label: "Cheia" },
  { value: "empty", label: "Vazia" },
];

export default function SlotEditorPanel({ freezer, slot, onSave, onClear }) {
  const [flavor, setFlavor] = useState("");
  const [topLevel, setTopLevel] = useState("full");
  const [bottomLevel, setBottomLevel] = useState("full");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!slot) {
      setFlavor("");
      setTopLevel("full");
      setBottomLevel("full");
      setErrorMessage("");
      return;
    }

    setFlavor(slot.flavor ?? "");
    setTopLevel(slot.topLevel ?? "full");
    setBottomLevel(slot.bottomLevel ?? "full");
    setErrorMessage("");
  }, [slot]);

  if (!freezer || !slot) {
    return (
      <section className="mapping-card slot-editor-card">
        <header className="mapping-card-header">
          <h3>Editor de caixa</h3>
          <p>Selecione um slot do freezer para preencher o sabor e os niveis.</p>
        </header>
      </section>
    );
  }

  function handleSave(event) {
    event.preventDefault();

    const trimmedFlavor = flavor.trim();
    if (!trimmedFlavor) {
      setErrorMessage("Preencha o sabor para salvar esta caixa.");
      return;
    }

    setErrorMessage("");
    onSave({
      flavor: trimmedFlavor,
      topLevel,
      bottomLevel,
    });
  }

  function handleFlavorChange(event) {
    setFlavor(event.target.value);
    if (errorMessage) {
      setErrorMessage("");
    }
  }

  return (
    <section className="mapping-card slot-editor-card">
      <header className="mapping-card-header">
        <h3>
          {freezer.title} - Caixa #{slot.position}
        </h3>
        <p>
          Preencha o sabor e os niveis da caixa de cima e da caixa de baixo
          (reposicao).
        </p>
      </header>

      <form className="slot-editor-form" onSubmit={handleSave}>
        <label>
          Sabor (obrigatorio)
          <input
            type="text"
            value={flavor}
            onChange={handleFlavorChange}
            placeholder="Ex.: Morango"
            maxLength={80}
          />
        </label>

        <label>
          Nivel da caixa de cima
          <select
            value={topLevel}
            onChange={(event) => setTopLevel(event.target.value)}
          >
            {TOP_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Caixa de baixo (reposicao)
          <select
            value={bottomLevel}
            onChange={(event) => setBottomLevel(event.target.value)}
          >
            {BOTTOM_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {errorMessage ? (
          <p className="slot-editor-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="slot-editor-actions">
          <button type="submit" className="mapping-primary-button">
            Salvar caixa
          </button>
          <button
            type="button"
            className="mapping-danger-button"
            onClick={onClear}
          >
            Limpar caixa
          </button>
        </div>
      </form>
    </section>
  );
}
