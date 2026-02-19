const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

export function formatCurrencyBRL(value) {
  const normalized = Number.isFinite(value) ? value : 0;
  return currencyFormatter.format(normalized);
}

export function formatDateTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return "-";
  }
  return dateTimeFormatter.format(date);
}

export function getCurrentMonthRef(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatMonthRef(monthRef) {
  if (typeof monthRef !== "string" || !/^\d{4}-\d{2}$/.test(monthRef)) {
    return monthRef || "-";
  }

  const [year, month] = monthRef.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) {
    return monthRef;
  }
  return monthFormatter.format(date);
}
