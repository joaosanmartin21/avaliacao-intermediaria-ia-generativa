import { useEffect, useState } from "react";

export default function FreezerManagerPanel({
  freezer,
  onSave,
  onDelete,
  onResetSetup,
}) {
  const [title, setTitle] = useState("");
  const [capacity, setCapacity] = useState(12);

  useEffect(() => {
    if (!freezer) {
      setTitle("");
      setCapacity(12);
      return;
    }

    setTitle(freezer.title);
    setCapacity(freezer.capacity);
  }, [freezer]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!freezer) {
      return;
    }

    onSave({
      title: title.trim() || freezer.title,
      capacity: Number(capacity),
    });
  }

  if (!freezer) {
    return (
      <section className="mapping-card freezer-manager-card">
        <header className="mapping-card-header">
          <h3>Configurar freezer</h3>
          <p>Crie um freezer para iniciar o mapeamento.</p>
        </header>
      </section>
    );
  }

  return (
    <section className="mapping-card freezer-manager-card">
      <header className="mapping-card-header">
        <h3>Detalhes do freezer</h3>
        <p>Edite o título e a quantidade de sabores deste freezer.</p>
      </header>

      <form className="freezer-manager-form" onSubmit={handleSubmit}>
        <label>
          Título
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex.: Zero lactose"
            maxLength={60}
          />
        </label>

        <label>
          Capacidade
          <select
            value={capacity}
            onChange={(event) => setCapacity(Number(event.target.value))}
          >
            <option value={12}>12 sabores</option>
            <option value={8}>8 sabores</option>
          </select>
        </label>

        <div className="freezer-manager-actions">
          <button type="submit" className="mapping-primary-button">
            Salvar freezer
          </button>
          <button
            type="button"
            className="mapping-danger-button"
            onClick={onDelete}
          >
            Excluir freezer
          </button>
        </div>
      </form>

      <button
        type="button"
        className="mapping-ghost-button"
        onClick={onResetSetup}
      >
        Reconfigurar estrutura inicial
      </button>
    </section>
  );
}
