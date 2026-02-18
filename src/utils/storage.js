const STORAGE_KEY = "loja_checklists_v1";

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function loadChecklistState() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => typeof value === "boolean")
    );
  } catch {
    return {};
  }
}

export function saveChecklistState(state) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignora falhas de escrita local sem quebrar a UI.
  }
}

export function clearChecklistState() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignora falhas de limpeza local sem quebrar a UI.
  }
}
