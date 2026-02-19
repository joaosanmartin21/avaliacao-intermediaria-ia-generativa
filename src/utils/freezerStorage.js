import {
  adjustSlotsForCapacity,
  createInitialMappingState,
  normalizeBottomLevel,
  normalizeCapacity,
  normalizeTopLevel,
} from "../data/freezerDefaults";

const STORAGE_KEY = "loja_freezer_mapping_v2";

function fallbackState() {
  return {
    setupCompleted: false,
    selectedFreezerId: null,
    freezers: [],
  };
}

function sanitizeFreezers(freezers) {
  if (!Array.isArray(freezers)) {
    return [];
  }

  return freezers
    .filter((freezer) => typeof freezer === "object" && freezer !== null)
    .map((freezer, index) => {
      const capacity = normalizeCapacity(freezer.capacity);
      const normalizedSlots = adjustSlotsForCapacity(freezer.slots, capacity).map(
        (slot) => ({
          ...slot,
          topLevel: normalizeTopLevel(slot.topLevel),
          bottomLevel: normalizeBottomLevel(slot.bottomLevel),
        })
      );

      return {
        id: typeof freezer.id === "string" ? freezer.id : `freezer_${index + 1}`,
        title: typeof freezer.title === "string" ? freezer.title.trim() : "",
        capacity,
        order: Number.isFinite(freezer.order) ? freezer.order : index + 1,
        slots: normalizedSlots,
      };
    })
    .sort((left, right) => left.order - right.order)
    .map((freezer, index) => ({
      ...freezer,
      order: index + 1,
    }));
}

export function loadFreezerMappingState() {
  if (typeof window === "undefined") {
    return fallbackState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallbackState();
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return fallbackState();
    }

    const freezers = sanitizeFreezers(parsed.freezers);
    const selectedFreezerId = freezers.some(
      (freezer) => freezer.id === parsed.selectedFreezerId
    )
      ? parsed.selectedFreezerId
      : freezers[0]?.id ?? null;

    return {
      setupCompleted:
        typeof parsed.setupCompleted === "boolean"
          ? parsed.setupCompleted
          : freezers.length > 0,
      selectedFreezerId,
      freezers,
    };
  } catch {
    return fallbackState();
  }
}

export function saveFreezerMappingState(state) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Keep UI functional even when localStorage write fails.
  }
}

export function clearFreezerMappingState() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Keep UI functional even when localStorage removal fails.
  }
}

export function createDefaultFreezerState() {
  return createInitialMappingState(7, 1);
}
