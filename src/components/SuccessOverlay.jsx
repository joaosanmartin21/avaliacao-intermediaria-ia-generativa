export default function SuccessOverlay({ visible, onConfirm }) {
  if (!visible) {
    return null;
  }

  return (
    <div className="success-overlay" role="status" aria-live="assertive">
      <div className="success-card">
        <div className="success-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M20 6L9 17L4 12" />
          </svg>
        </div>
        <h2>Dia encerrado com sucesso!</h2>
        <p>Todas as rotinas operacionais foram concluidas.</p>
        <button type="button" className="success-action" onClick={onConfirm}>
          OK
        </button>
      </div>
    </div>
  );
}
