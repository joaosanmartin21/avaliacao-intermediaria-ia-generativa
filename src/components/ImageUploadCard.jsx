export default function ImageUploadCard({ imagePreviewUrl, onUpload, onClear }) {
  function handleInputChange(event) {
    const file = event.target.files?.[0];
    onUpload(file ?? null);
  }

  return (
    <section className="mapping-card upload-card">
      <header className="mapping-card-header">
        <h3>Foto do freezer</h3>
        <p>
          Envie a imagem da frente do freezer para facilitar o mapeamento manual
          dos sabores.
        </p>
      </header>

      <label className="upload-dropzone" htmlFor="freezer-image-upload">
        <input
          id="freezer-image-upload"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleInputChange}
        />
        {imagePreviewUrl ? (
          <img src={imagePreviewUrl} alt="Preview do freezer enviado" />
        ) : (
          <div className="upload-placeholder">
            <strong>Clique para enviar uma imagem</strong>
            <span>Formatos: JPG, PNG ou WEBP</span>
          </div>
        )}
      </label>

      <div className="upload-actions">
        <label className="inline-upload-button" htmlFor="freezer-image-upload">
          Trocar imagem
        </label>
        <button
          type="button"
          className="inline-danger-button"
          onClick={onClear}
          disabled={!imagePreviewUrl}
        >
          Limpar
        </button>
      </div>
    </section>
  );
}
