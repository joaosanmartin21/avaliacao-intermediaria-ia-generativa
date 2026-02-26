import { needsRestock } from "../data/freezerDefaults.js";

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function sanitizeFlavor(flavor) {
  if (typeof flavor !== "string") {
    return "Sabor não definido";
  }

  const trimmed = flavor.trim();
  return trimmed || "Sabor não definido";
}

function getFreezerDisplayTitle(freezer) {
  const title = typeof freezer?.title === "string" ? freezer.title.trim() : "";
  if (title) {
    return title;
  }

  const order = Number.parseInt(freezer?.order, 10);
  return `Freezer ${Number.isFinite(order) && order > 0 ? order : "sem ordem"}`;
}

function estimateBoxesNeedingRestock(slot) {
  let boxes = 0;

  if (slot?.bottomLevel === "empty") {
    boxes += 1;
  }
  if (slot?.topLevel === "quarter" || slot?.topLevel === "empty") {
    boxes += 1;
  }

  return Math.max(1, boxes);
}

function mapSlotToLine(slot) {
  return {
    position: Number.parseInt(slot?.position, 10) || 0,
    flavor: sanitizeFlavor(slot?.flavor),
    boxesNeedingRestock: estimateBoxesNeedingRestock(slot),
    topLevel: typeof slot?.topLevel === "string" ? slot.topLevel : "unknown",
    bottomLevel: typeof slot?.bottomLevel === "string" ? slot.bottomLevel : "unknown",
  };
}

function buildFreezerEntry(freezer) {
  const slots = toArray(freezer?.slots);
  const slotsNeedingRestock = slots
    .filter((slot) => needsRestock(slot))
    .map(mapSlotToLine)
    .sort((left, right) => left.position - right.position);

  const flavorMap = new Map();
  for (const slot of slotsNeedingRestock) {
    const key = slot.flavor.toLowerCase();
    const current = flavorMap.get(key);

    if (!current) {
      flavorMap.set(key, {
        flavor: slot.flavor,
        boxesNeedingRestock: slot.boxesNeedingRestock,
      });
      continue;
    }

    current.boxesNeedingRestock += slot.boxesNeedingRestock;
  }

  const flavorTotals = [...flavorMap.values()].sort((left, right) =>
    left.flavor.localeCompare(right.flavor, "pt-BR", { sensitivity: "base" })
  );
  const totalBoxesNeedingRestock = flavorTotals.reduce(
    (sum, item) => sum + item.boxesNeedingRestock,
    0
  );

  return {
    freezerName: getFreezerDisplayTitle(freezer),
    order: Number.parseInt(freezer?.order, 10) || 0,
    slotsNeedingRestock,
    flavorTotals,
    totalBoxesNeedingRestock,
  };
}

function buildPriorityPurchases(byFreezer) {
  const flavors = new Map();

  for (const freezer of byFreezer) {
    for (const item of freezer.flavorTotals) {
      const key = item.flavor.toLowerCase();
      const current = flavors.get(key);

      if (!current) {
        flavors.set(key, {
          flavor: item.flavor,
          boxes: item.boxesNeedingRestock,
        });
      } else {
        current.boxes += item.boxesNeedingRestock;
      }
    }
  }

  return [...flavors.values()]
    .sort((left, right) => right.boxes - left.boxes)
    .map((item) => {
      let priority = "baixa";
      if (item.boxes >= 3) {
        priority = "alta";
      } else if (item.boxes === 2) {
        priority = "media";
      }

      return {
        flavor: item.flavor,
        priority,
        suggestedQuantity: item.boxes,
        reason: `Total estimado de ${item.boxes} caixa(s) para reposição.`,
      };
    });
}

export function buildDeterministicShoppingReport(freezers) {
  const normalizedFreezers = toArray(freezers);
  const byFreezer = normalizedFreezers
    .map(buildFreezerEntry)
    .filter((freezer) => freezer.slotsNeedingRestock.length > 0)
    .sort((left, right) => left.order - right.order);

  const totalSlots = normalizedFreezers.reduce(
    (sum, freezer) => sum + (Number.parseInt(freezer?.capacity, 10) || 0),
    0
  );
  const mappedSlots = normalizedFreezers.reduce((sum, freezer) => {
    const slots = toArray(freezer?.slots);
    return (
      sum +
      slots.filter((slot) => typeof slot?.flavor === "string" && slot.flavor.trim()).length
    );
  }, 0);

  const slotsNeedingRestock = byFreezer.reduce(
    (sum, freezer) => sum + freezer.slotsNeedingRestock.length,
    0
  );
  const priorityPurchases = buildPriorityPurchases(byFreezer);

  return {
    overview: {
      totalFreezers: normalizedFreezers.length,
      mappedSlots,
      totalSlots,
      slotsNeedingRestock,
      totalFlavorsToBuy: priorityPurchases.length,
    },
    priorityPurchases,
    byFreezer,
    warnings: [],
  };
}
