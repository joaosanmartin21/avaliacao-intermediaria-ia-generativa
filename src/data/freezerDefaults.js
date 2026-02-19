const CAPACITY_OPTIONS = [8, 12];
const TOP_LEVEL_OPTIONS = ["full", "half", "quarter", "empty"];
const BOTTOM_LEVEL_OPTIONS = ["full", "empty"];

function toNonNegativeInteger(value, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number) || number < 0) {
    return fallback;
  }
  return number;
}

export function normalizeCapacity(value) {
  const parsed = Number.parseInt(value, 10);
  return CAPACITY_OPTIONS.includes(parsed) ? parsed : 12;
}

export function normalizeTopLevel(value) {
  return TOP_LEVEL_OPTIONS.includes(value) ? value : "full";
}

export function normalizeBottomLevel(value) {
  return BOTTOM_LEVEL_OPTIONS.includes(value) ? value : "full";
}

function createSlot(position) {
  return {
    id: `slot_${position}`,
    position,
    flavor: "",
    topLevel: "full",
    bottomLevel: "full",
  };
}

function createSlots(capacity) {
  return Array.from({ length: capacity }, (_, index) => createSlot(index + 1));
}

export function adjustSlotsForCapacity(slots, capacity) {
  const normalizedCapacity = normalizeCapacity(capacity);
  const normalized = Array.isArray(slots)
    ? [...slots]
        .sort((left, right) => left.position - right.position)
        .slice(0, normalizedCapacity)
        .map((slot, index) => ({
          id: `slot_${index + 1}`,
          position: index + 1,
          flavor: typeof slot.flavor === "string" ? slot.flavor : "",
          topLevel: normalizeTopLevel(slot.topLevel),
          bottomLevel: normalizeBottomLevel(slot.bottomLevel),
        }))
    : [];

  while (normalized.length < normalizedCapacity) {
    normalized.push(createSlot(normalized.length + 1));
  }

  return normalized;
}

export function createFreezer({ id, title, capacity, order }) {
  const normalizedCapacity = normalizeCapacity(capacity);
  return {
    id:
      id ??
      `freezer_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 7)}`,
    title: typeof title === "string" ? title.trim() : "",
    capacity: normalizedCapacity,
    order: Number.isFinite(order) ? order : 1,
    slots: createSlots(normalizedCapacity),
  };
}

export function createInitialFreezers(countOf12 = 7, countOf8 = 1) {
  const safeCount12 = toNonNegativeInteger(countOf12, 7);
  const safeCount8 = toNonNegativeInteger(countOf8, 1);
  const freezers = [];

  for (let index = 0; index < safeCount12; index += 1) {
    const position = freezers.length + 1;
    freezers.push(
      createFreezer({
        id: `freezer_${position}`,
        title: index === 0 ? "Zeros" : "",
        capacity: 12,
        order: position,
      })
    );
  }

  for (let index = 0; index < safeCount8; index += 1) {
    const position = freezers.length + 1;
    freezers.push(
      createFreezer({
        id: `freezer_${position}`,
        title: index === 0 ? "A\u00e7a\u00ed" : "",
        capacity: 8,
        order: position,
      })
    );
  }

  return freezers;
}

export function createInitialMappingState(countOf12 = 7, countOf8 = 1) {
  const freezers = createInitialFreezers(countOf12, countOf8);
  return {
    setupCompleted: freezers.length > 0,
    selectedFreezerId: freezers[0]?.id ?? null,
    freezers,
  };
}

export function reorderFreezers(freezers, sourceId, targetId) {
  const list = Array.isArray(freezers) ? [...freezers] : [];
  const sourceIndex = list.findIndex((freezer) => freezer.id === sourceId);
  const targetIndex = list.findIndex((freezer) => freezer.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return list;
  }

  const [moved] = list.splice(sourceIndex, 1);
  list.splice(targetIndex, 0, moved);

  return list.map((freezer, index) => ({
    ...freezer,
    order: index + 1,
  }));
}

export function needsRestock(slot) {
  if (!slot) {
    return false;
  }

  return (
    slot.topLevel === "quarter" ||
    slot.topLevel === "empty" ||
    slot.bottomLevel === "empty"
  );
}

function getRestockReasons(slot) {
  const reasons = [];

  if (slot.topLevel === "quarter") {
    reasons.push("caixa de cima em 1/4");
  }
  if (slot.topLevel === "empty") {
    reasons.push("caixa de cima vazia");
  }
  if (slot.bottomLevel === "empty") {
    reasons.push("caixa de baixo vazia");
  }

  return reasons;
}

export function buildShoppingSummary(freezers) {
  const accumulator = new Map();
  let totalSlotsNeedingRestock = 0;

  for (const freezer of freezers ?? []) {
    for (const slot of freezer.slots ?? []) {
      if (!needsRestock(slot)) {
        continue;
      }

      totalSlotsNeedingRestock += 1;
      const flavor = typeof slot.flavor === "string" ? slot.flavor.trim() : "";
      if (!flavor) {
        continue;
      }

      const key = flavor.toLowerCase();
      const current = accumulator.get(key);
      const location = {
        freezerTitle: freezer.title,
        position: slot.position,
        topLevel: slot.topLevel,
        bottomLevel: slot.bottomLevel,
        reasons: getRestockReasons(slot),
      };

      if (!current) {
        accumulator.set(key, {
          flavor,
          count: 1,
          locations: [location],
        });
      } else {
        current.count += 1;
        current.locations.push(location);
      }
    }
  }

  const items = [...accumulator.values()].sort((left, right) =>
    left.flavor.localeCompare(right.flavor, "pt-BR", { sensitivity: "base" })
  );

  return {
    items,
    totalSlotsNeedingRestock,
    totalFlavorsToBuy: items.length,
  };
}
