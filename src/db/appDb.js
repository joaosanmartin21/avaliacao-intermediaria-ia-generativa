import Dexie from "dexie";

class AppDatabase extends Dexie {
  constructor() {
    // Isolated DB name avoids collisions with older local schemas/versions.
    super("loja_operacao_db_v2");

    this.version(1).stores({
      items: "++id,name,nameLower,unitPrice,createdAt,updatedAt,isActive",
      purchaseOrders: "++id,createdAt,monthRef,status,totalCost",
      purchaseOrderItems:
        "++id,orderId,itemId,itemNameSnapshot,unitPriceSnapshot,quantity,lineTotal",
      assistantConversations: "++id,createdAt,updatedAt,title",
      assistantMessages: "++id,conversationId,role,createdAt",
    });
  }
}

export const db = new AppDatabase();
