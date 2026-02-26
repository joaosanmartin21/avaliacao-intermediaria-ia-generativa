import { db } from "../db/appDb";

const VALID_ORDER_STATUSES = new Set(["draft", "sent"]);

function normalizeItemName(name) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed.length < 2) {
    throw new Error("Informe um nome com pelo menos 2 caracteres.");
  }
  return trimmed;
}

function normalizePrice(value) {
  const numeric =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value).replace(",", "."));

  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error("Informe um preço válido maior ou igual a zero.");
  }

  return Math.round(numeric * 100) / 100;
}

function normalizeQuantity(value) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return numeric;
}

function getNowIso() {
  return new Date().toISOString();
}

function getMonthRefFromDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function normalizeMonthRef(monthRef) {
  if (typeof monthRef !== "string") {
    return getMonthRefFromDate();
  }

  const trimmed = monthRef.trim();
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(trimmed)
    ? trimmed
    : getMonthRefFromDate();
}

async function ensureUniqueName(nameLower, ignoreId = null) {
  const existing = await db.items.where("nameLower").equals(nameLower).first();
  if (existing && existing.isActive && existing.id !== ignoreId) {
    throw new Error("Já existe um item ativo com esse nome.");
  }
}

export async function createItem({ name, unitPrice }) {
  const normalizedName = normalizeItemName(name);
  const normalizedPrice = normalizePrice(unitPrice);
  const nameLower = normalizedName.toLocaleLowerCase("pt-BR");

  await ensureUniqueName(nameLower);

  const now = getNowIso();
  return db.items.add({
    name: normalizedName,
    nameLower,
    unitPrice: normalizedPrice,
    createdAt: now,
    updatedAt: now,
    isActive: true,
  });
}

export async function updateItem(itemId, { name, unitPrice }) {
  if (!Number.isFinite(itemId)) {
    throw new Error("Item inválido.");
  }

  const normalizedName = normalizeItemName(name);
  const normalizedPrice = normalizePrice(unitPrice);
  const nameLower = normalizedName.toLocaleLowerCase("pt-BR");

  await ensureUniqueName(nameLower, itemId);

  const updatedCount = await db.items.update(itemId, {
    name: normalizedName,
    nameLower,
    unitPrice: normalizedPrice,
    updatedAt: getNowIso(),
  });

  if (!updatedCount) {
    throw new Error("Não foi possível atualizar este item.");
  }
}

export async function deleteItem(itemId) {
  if (!Number.isFinite(itemId)) {
    throw new Error("Item inválido.");
  }

  const updatedCount = await db.items.update(itemId, {
    isActive: false,
    updatedAt: getNowIso(),
  });

  if (!updatedCount) {
    throw new Error("Não foi possível excluir este item.");
  }
}

export async function listActiveItems() {
  const items = await db.items.toArray();
  const activeOnly = items.filter((item) => item.isActive !== false);
  return activeOnly.sort((left, right) =>
    left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" })
  );
}

function normalizeOrderStatus(status) {
  return VALID_ORDER_STATUSES.has(status) ? status : "draft";
}

function normalizeOrderLines(lines) {
  if (!Array.isArray(lines)) {
    return [];
  }

  const grouped = new Map();

  for (const line of lines) {
    const itemId = Number.parseInt(line?.itemId, 10);
    const quantity = normalizeQuantity(line?.quantity);
    if (!Number.isFinite(itemId) || !quantity) {
      continue;
    }

    const current = grouped.get(itemId) ?? 0;
    grouped.set(itemId, current + quantity);
  }

  return [...grouped.entries()].map(([itemId, quantity]) => ({
    itemId,
    quantity,
  }));
}

export async function createPurchaseOrder({ lines, status, monthRef }) {
  const normalizedLines = normalizeOrderLines(lines);

  if (normalizedLines.length === 0) {
    throw new Error("Adicione pelo menos um item válido no pedido.");
  }

  const itemIds = normalizedLines.map((line) => line.itemId);
  const fetchedItems = await db.items.bulkGet(itemIds);
  const itemById = new Map();

  fetchedItems.forEach((item) => {
    if (item && item.isActive) {
      itemById.set(item.id, item);
    }
  });

  const orderLines = normalizedLines.map((line) => {
    const item = itemById.get(line.itemId);
    if (!item) {
      throw new Error("Um ou mais itens não estão mais ativos.");
    }

    const lineTotal = Math.round(item.unitPrice * line.quantity * 100) / 100;
    return {
      itemId: item.id,
      itemNameSnapshot: item.name,
      unitPriceSnapshot: item.unitPrice,
      quantity: line.quantity,
      lineTotal,
    };
  });

  const totalCost =
    Math.round(
      orderLines.reduce((sum, line) => sum + line.lineTotal, 0) * 100
    ) / 100;

  const now = getNowIso();
  const normalizedMonthRef = normalizeMonthRef(monthRef);
  const normalizedStatus = normalizeOrderStatus(status);

  let orderId = null;

  await db.transaction("rw", db.purchaseOrders, db.purchaseOrderItems, async () => {
    orderId = await db.purchaseOrders.add({
      createdAt: now,
      monthRef: normalizedMonthRef,
      status: normalizedStatus,
      totalCost,
    });

    await db.purchaseOrderItems.bulkAdd(
      orderLines.map((line) => ({
        orderId,
        itemId: line.itemId,
        itemNameSnapshot: line.itemNameSnapshot,
        unitPriceSnapshot: line.unitPriceSnapshot,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      }))
    );
  });

  return orderId;
}

export async function updatePurchaseOrderStatus(orderId, status) {
  if (!Number.isFinite(orderId)) {
    throw new Error("Pedido inválido.");
  }

  if (!VALID_ORDER_STATUSES.has(status)) {
    throw new Error("Status de pedido inválido.");
  }

  const updatedCount = await db.purchaseOrders.update(orderId, {
    status,
  });

  if (!updatedCount) {
    throw new Error("Não foi possível atualizar o status do pedido.");
  }
}

export async function listPurchaseOrdersByMonth(monthRef = null) {
  const orders = monthRef
    ? await db.purchaseOrders.where("monthRef").equals(monthRef).toArray()
    : await db.purchaseOrders.toArray();

  if (orders.length === 0) {
    return [];
  }

  const sortedOrders = [...orders].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt)
  );

  const orderIds = sortedOrders.map((order) => order.id);
  const lines = await db.purchaseOrderItems.where("orderId").anyOf(orderIds).toArray();

  const linesByOrderId = new Map();
  for (const line of lines) {
    const current = linesByOrderId.get(line.orderId) ?? [];
    current.push(line);
    linesByOrderId.set(line.orderId, current);
  }

  return sortedOrders.map((order) => ({
    ...order,
    lines: (linesByOrderId.get(order.id) ?? []).sort(
      (left, right) => left.itemNameSnapshot.localeCompare(right.itemNameSnapshot)
    ),
  }));
}

export async function getPurchaseOrderWithLines(orderId) {
  const order = await db.purchaseOrders.get(orderId);
  if (!order) {
    return null;
  }

  const lines = await db.purchaseOrderItems.where("orderId").equals(orderId).toArray();

  return {
    ...order,
    lines,
  };
}

export { getMonthRefFromDate };
