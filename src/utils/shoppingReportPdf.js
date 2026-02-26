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
    return "relatorio-compras.pdf";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `relatorio-compras-${year}${month}${day}-${hour}${minute}.pdf`;
}

function buildAlphabeticalFlavorSummary(byFreezer) {
  const accumulator = new Map();

  for (const freezer of toArray(byFreezer)) {
    for (const item of toArray(freezer?.flavorTotals)) {
      const flavor = sanitizeText(item?.flavor);
      if (!flavor) {
        continue;
      }

      const key = flavor.toLocaleLowerCase("pt-BR");
      const boxes = Math.max(1, Number.parseInt(item?.boxesNeedingRestock, 10) || 1);
      const current = accumulator.get(key);

      if (!current) {
        accumulator.set(key, {
          flavor,
          boxes,
        });
      } else {
        current.boxes += boxes;
      }
    }
  }

  return [...accumulator.values()].sort((left, right) =>
    left.flavor.localeCompare(right.flavor, "pt-BR", {
      sensitivity: "base",
    })
  );
}

export function downloadShoppingReportPdf({ report, meta }) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  function ensureSpace(minHeight = 16) {
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

  const byFreezer = toArray(report?.byFreezer).sort((left, right) => {
    const leftOrder = Number.parseInt(left?.order, 10) || 0;
    const rightOrder = Number.parseInt(right?.order, 10) || 0;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return sanitizeText(left?.freezerName).localeCompare(
      sanitizeText(right?.freezerName),
      "pt-BR",
      {
        sensitivity: "base",
      }
    );
  });
  const alphabeticalFlavors = buildAlphabeticalFlavorSummary(byFreezer);

  writeText("Relatório de Compras", { fontSize: 18, bold: true });
  writeText(`Gerado em: ${formatDate(meta?.generatedAt)}`, { fontSize: 10 });
  addSpacer(10);

  if (byFreezer.length === 0) {
    writeText("Nenhum slot com reposicao no momento.", { fontSize: 11 });
    doc.save(buildFilename(meta?.generatedAt));
    return;
  }

  for (const freezer of byFreezer) {
    const freezerName = sanitizeText(freezer?.freezerName, "Freezer sem nome");
    const freezerOrder = Number.parseInt(freezer?.order, 10);
    const freezerLabel = Number.isFinite(freezerOrder)
      ? `${freezerOrder}. ${freezerName}`
      : freezerName;

    const slots = toArray(freezer?.slotsNeedingRestock).sort(
      (left, right) =>
        (Number.parseInt(left?.position, 10) || 0) -
        (Number.parseInt(right?.position, 10) || 0)
    );
    const flavorTotals = toArray(freezer?.flavorTotals).sort((left, right) =>
      sanitizeText(left?.flavor).localeCompare(sanitizeText(right?.flavor), "pt-BR", {
        sensitivity: "base",
      })
    );

    addSpacer(6);
    writeText(`Freezer ${freezerLabel}`, { fontSize: 12, bold: true });

    if (slots.length === 0) {
      writeText("Sem reposicao neste freezer.", { fontSize: 10, indent: 12 });
      continue;
    }

    for (const slot of slots) {
      const position = Number.parseInt(slot?.position, 10) || 0;
      const flavor = sanitizeText(slot?.flavor, "Sabor nao definido");
      const boxes = Math.max(1, Number.parseInt(slot?.boxesNeedingRestock, 10) || 1);

      writeText(
        `Slot ${String(position).padStart(2, "0")} - ${flavor} - ${boxes} caixa(s) para repor`,
        { fontSize: 10, indent: 12 }
      );
    }

    addSpacer(3);
    writeText("Total por sabor:", { fontSize: 10, bold: true, indent: 12 });
    for (const item of flavorTotals) {
      const flavor = sanitizeText(item?.flavor, "Sabor nao definido");
      const boxes = Math.max(1, Number.parseInt(item?.boxesNeedingRestock, 10) || 1);
      writeText(`${flavor}: ${boxes} caixa(s)`, { fontSize: 9, indent: 20 });
    }
  }

  doc.addPage();
  cursorY = margin;

  writeText("Resumo de Compras", { fontSize: 16, bold: true });
  writeText("Lista total de caixas para reposição.", {
    fontSize: 10,
  });
  addSpacer(10);

  if (alphabeticalFlavors.length === 0) {
    writeText("Nenhum sabor com reposicao no momento.", { fontSize: 11 });
  } else {
    for (const item of alphabeticalFlavors) {
      writeText(`${item.flavor}: ${item.boxes} caixa(s)`, {
        fontSize: 10,
      });
    }
  }

  doc.save(buildFilename(meta?.generatedAt));
}
