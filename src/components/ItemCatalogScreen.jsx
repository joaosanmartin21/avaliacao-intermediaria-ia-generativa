import { useLiveQuery } from "dexie-react-hooks";
import InventoryItemForm from "./InventoryItemForm";
import InventoryItemList from "./InventoryItemList";
import {
  createItem,
  deleteItem,
  listActiveItems,
  updateItem,
} from "../data/inventoryRepository";

export default function ItemCatalogScreen() {
  const items = useLiveQuery(
    async () => {
      try {
        return await listActiveItems();
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    [],
    []
  );

  return (
    <section className="inventory-shell">
      <header className="mapping-hero">
        <p className="eyebrow">Estoque</p>
        <h1>Cadastro de Itens</h1>
        <p className="hero-copy">
          Cadastre e atualize os itens da loja com nome e preco unitario.
        </p>
        <div className="mapping-summary">
          <span>
            Itens ativos: <strong>{items.length}</strong>
          </span>
        </div>
      </header>

      <div className="inventory-layout">
        <aside className="inventory-sidebar">
          <InventoryItemForm onCreateItem={createItem} />
        </aside>

        <section className="inventory-main">
          <InventoryItemList
            items={items}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
          />
        </section>
      </div>
    </section>
  );
}
