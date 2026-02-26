import { jsPDF } from "jspdf";

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function sanitizeText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed || fallback;
}

function formatLevel(level) {
  if (level === "full") {
    return "Cheio";
  }
  if (level === "half") {
    return "1/2";
  }
  if (level === "quarter") {
    return "1/4";
  }
  if (level === "empty") {
    return "Vazio";
  }
  return "Nao informado";
}

function formatDate(dateText) {
  const parsed = new Date(dateText);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString("pt-BR");
  }
  return "Data nao informada";
}

function buildFilename(generatedAt) {
  const date = new Date(generatedAt);
  if (Number.isNaN(date.getTime())) {
    return "relatorio-compras-ia.pdf";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `relatorio-compras-${year}${month}${day}-${hour}${minute}.pdf`;
}

export function downloadShoppingReportPdf({ report, meta }) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  function ensureSpace(minHeight = 18) {
    if (cursorY + minHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
  }

  function writeText(text, { fontSize = 10, bold = false, indent = 0 } = {}) {
    const safeText = sanitizeText(text);
    if (!safeText) {
      return;
    }

    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(safeText, contentWidth - indent);
    const lineHeight = Math.max(12, Math.round(fontSize * 1.35));

    ensureSpace(lines.length * lineHeight + 4);
    for (const line of lines) {
      doc.text(line, margin + indent, cursorY);
      cursorY += lineHeight;
    }
  }

  function addSpacer(height = 8) {
    cursorY += height;
  }

  const overview = report?.overview ?? {};
  const byFreezer = toArray(report?.byFreezer).sort((left, right) => {
    const leftOrder = Number.parseInt(left?.order, 10);
    const rightOrder = Number.parseInt(right?.order, 10);
    if (Number.isFinite(leftOrder) && Number.isFinite(rightOrder) && leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return sanitizeText(left?.freezerName).localeCompare(
      sanitizeText(right?.freezerName),
      "pt-BR",
      { sensitivity: "base" }
    );
  });

  writeText("Relatorio de Compras por Freezer", { fontSize: 18, bold: true });
  writeText(`Gerado em: ${formatDate(meta?.generatedAt)}`, { fontSize: 10 });
  writeText(
    `Fonte: ${sanitizeText(meta?.provider, "desconhecido")} | Modelo: ${sanitizeText(meta?.model, "desconhecido")}`,
    { fontSize: 10 }
  );
  addSpacer(6);

  writeText("Resumo geral", { fontSize: 12, bold: true });
  writeText(
    `Freezers: ${overview.totalFreezers ?? 0} | Slots mapeados: ${overview.mappedSlots ?? 0}/${overview.totalSlots ?? 0}`,
    { fontSize: 10 }
  );
  writeText(
    `Slots com reposicao: ${overview.slotsNeedingRestock ?? 0} | Sabores para compra: ${overview.totalFlavorsToBuy ?? 0}`,
    { fontSize: 10 }
  );
  addSpacer(6);

  writeText("Listagem por freezer", { fontSize: 12, bold: true });
  addSpacer(2);

  if (byFreezer.length === 0) {
    writeText("Nenhum freezer com dados de reposicao no relatorio.", { fontSize: 10 });
  }

  for (const freezer of byFreezer) {
    const freezerName = sanitizeText(freezer?.freezerName, "Freezer sem nome");
    const freezerOrder = Number.parseInt(freezer?.order, 10);
    const freezerLabel = Number.isFinite(freezerOrder)
      ? `${freezerOrder}. ${freezerName}`
      : freezerName;
    const slotsNeedingRestock = toArray(freezer?.slotsNeedingRestock).sort(
      (left, right) =>
        (Number.parseInt(left?.position, 10) || 0) -
        (Number.parseInt(right?.position, 10) || 0)
    );
    const flavorTotals = toArray(freezer?.flavorTotals).sort((left, right) =>
      sanitizeText(left?.flavor).localeCompare(sanitizeText(right?.flavor), "pt-BR", {
        sensitivity: "base",
      })
    );

    addSpacer(8);
    writeText(`Freezer ${freezerLabel}`, { fontSize: 11, bold: true });

    if (slotsNeedingRestock.length === 0) {
      writeText("Sem sabores para reposicao neste freezer.", {
        fontSize: 10,
        indent: 10,
      });
      continue;
    }

    writeText("Sabores por slot (ordem):", { fontSize: 10, bold: true, indent: 10 });
    for (const slot of slotsNeedingRestock) {
      const slotPosition = Number.parseInt(slot?.position, 10) || 0;
      const flavor = sanitizeText(slot?.flavor, "Sabor nao definido");
      const topLevel = formatLevel(slot?.topLevel);
      const bottomLevel = formatLevel(slot?.bottomLevel);
      const boxes = Math.max(1, Number.parseInt(slot?.boxesNeedingRestock, 10) || 1);
      writeText(
        `Slot ${String(slotPosition).padStart(2, "0")} - ${flavor} | Cima: ${topLevel} | Baixo: ${bottomLevel} | Reposicao: ${boxes} caixa(s)`,
        { fontSize: 9, indent: 18 }
      );

      const reasons = toArray(slot?.reasons)
        .filter((reason) => typeof reason === "string")
        .map((reason) => reason.trim())
        .filter(Boolean);
      if (reasons.length > 0) {
        writeText(`Motivo: ${reasons.join(", ")}`, {
          fontSize: 8,
          indent: 30,
        });
      }
    }

    addSpacer(4);
    writeText("Total por sabor:", { fontSize: 10, bold: true, indent: 10 });
    for (const flavorTotal of flavorTotals) {
      const flavor = sanitizeText(flavorTotal?.flavor, "Sabor nao definido");
      const boxes = Math.max(1, Number.parseInt(flavorTotal?.boxesNeedingRestock, 10) || 1);
      writeText(`${flavor}: ${boxes} caixa(s)`, { fontSize: 9, indent: 18 });
    }

    writeText(
      `Total de caixas para reposicao neste freezer: ${Math.max(
        0,
        Number.parseInt(freezer?.totalBoxesNeedingRestock, 10) || 0
      )}`,
      { fontSize: 9, bold: true, indent: 10 }
    );
  }

  const warnings = toArray(report?.warnings)
    .filter((warning) => typeof warning === "string")
    .map((warning) => warning.trim())
    .filter(Boolean);
  if (warnings.length > 0) {
    addSpacer(8);
    writeText("Alertas:", { fontSize: 11, bold: true });
    for (const warning of warnings) {
      writeText(`- ${warning}`, { fontSize: 9, indent: 10 });
    }
  }

  doc.save(buildFilename(meta?.generatedAt));
}
