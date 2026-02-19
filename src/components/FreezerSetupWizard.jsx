import { useEffect, useState } from "react";

export default function FreezerSetupWizard({ visible, onConfirm }) {
  const [countOf12, setCountOf12] = useState(7);
  const [countOf8, setCountOf8] = useState(1);
  const total = Number(countOf12) + Number(countOf8);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setCountOf12(7);
    setCountOf8(1);
  }, [visible]);

  if (!visible) {
    return null;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (total <= 0) {
      return;
    }

    onConfirm({
      countOf12: Number.parseInt(countOf12, 10),
      countOf8: Number.parseInt(countOf8, 10),
    });
  }

  return (
    <div className="setup-overlay" role="dialog" aria-modal="true">
      <div className="setup-card">
        <h2>Configurar estrutura de freezers</h2>
        <p>
          Defina a quantidade inicial de freezers para o mapeamento visual dos
          sabores. Sugestao atual: 7 freezers de 12 e 1 freezer de 8.
        </p>

        <form onSubmit={handleSubmit} className="setup-form">
          <label>
            Freezers de 12 sabores
            <input
              type="number"
              min={0}
              max={30}
              value={countOf12}
              onChange={(event) => setCountOf12(event.target.value)}
              required
            />
          </label>

          <label>
            Freezers de 8 sabores
            <input
              type="number"
              min={0}
              max={30}
              value={countOf8}
              onChange={(event) => setCountOf8(event.target.value)}
              required
            />
          </label>

          <p className="setup-total">
            Total inicial: <strong>{total}</strong> freezers
          </p>

          <button
            type="submit"
            className="mapping-primary-button"
            disabled={total <= 0}
          >
            Criar estrutura inicial
          </button>
        </form>
      </div>
    </div>
  );
}
