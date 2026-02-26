import { getCurrentMonthRef } from "./formatters";

const MONTHS_BY_NAME = new Map([
  ["janeiro", 1],
  ["fevereiro", 2],
  ["marco", 3],
  ["abril", 4],
  ["maio", 5],
  ["junho", 6],
  ["julho", 7],
  ["agosto", 8],
  ["setembro", 9],
  ["outubro", 10],
  ["novembro", 11],
  ["dezembro", 12],
]);

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function sanitizeMonthRef(monthRef) {
  if (typeof monthRef !== "string") {
    return getCurrentMonthRef();
  }

  const trimmed = monthRef.trim();
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(trimmed) ? trimmed : getCurrentMonthRef();
}

function toMonthRef(year, month) {
  const safeYear = Number.parseInt(String(year), 10);
  const safeMonth = Number.parseInt(String(month), 10);
  if (!Number.isFinite(safeYear) || !Number.isFinite(safeMonth)) {
    return null;
  }
  if (safeMonth < 1 || safeMonth > 12) {
    return null;
  }

  return `${safeYear}-${String(safeMonth).padStart(2, "0")}`;
}

function shiftMonthRef(monthRef, offset) {
  const [yearText, monthText] = sanitizeMonthRef(monthRef).split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const date = new Date(year, month - 1 + offset, 1);
  return getCurrentMonthRef(date);
}

export function extractMonthRefFromMessage(message, fallbackMonthRef = getCurrentMonthRef()) {
  const fallback = sanitizeMonthRef(fallbackMonthRef);
  const normalized = normalizeText(message);
  if (!normalized) {
    return fallback;
  }

  if (/\b(mes atual|este mes|nesse mes|neste mes)\b/.test(normalized)) {
    return shiftMonthRef(fallback, 0);
  }
  if (/\b(mes passado|mes anterior)\b/.test(normalized)) {
    return shiftMonthRef(fallback, -1);
  }
  if (/\b(proximo mes|mes que vem)\b/.test(normalized)) {
    return shiftMonthRef(fallback, 1);
  }

  const isoMatch = normalized.match(/\b((?:19|20)\d{2})-(0[1-9]|1[0-2])\b/);
  if (isoMatch) {
    const resolved = toMonthRef(isoMatch[1], isoMatch[2]);
    if (resolved) {
      return resolved;
    }
  }

  const slashMatch = normalized.match(/\b(0?[1-9]|1[0-2])\/((?:19|20)\d{2})\b/);
  if (slashMatch) {
    const resolved = toMonthRef(slashMatch[2], slashMatch[1]);
    if (resolved) {
      return resolved;
    }
  }

  const monthNameMatch = normalized.match(
    /\b(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de)?\s+((?:19|20)\d{2})\b/
  );
  if (monthNameMatch) {
    const month = MONTHS_BY_NAME.get(monthNameMatch[1]);
    const resolved = toMonthRef(monthNameMatch[2], month);
    if (resolved) {
      return resolved;
    }
  }

  return fallback;
}
