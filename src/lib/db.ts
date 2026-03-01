import Dexie, { type EntityTable } from 'dexie';
import {
    Product,
    Supplier,
    InventoryBalance,
    PurchaseOrder,
    PurchaseOrderLine,
    Sale,
    Reservation,
    StockCount,
    StockCountLine
} from '@/types/schema';

const db = new Dexie('InventoryLiteDB') as Dexie & {
    suppliers: EntityTable<Supplier, 'supplierId'>;
    products: EntityTable<Product, 'productId'>;
    inventoryBalances: EntityTable<InventoryBalance, 'productId'>;
    purchaseOrders: EntityTable<PurchaseOrder, 'poId'>;
    purchaseOrderLines: EntityTable<PurchaseOrderLine, 'poLineId'>;
    sales: EntityTable<Sale, 'saleId'>;
    reservations: EntityTable<Reservation, 'reservationId'>;
    stockCounts: EntityTable<StockCount, 'countId'>;
    stockCountLines: EntityTable<StockCountLine, 'countLineId'>;
};

// Schema definition (indexes)
db.version(1).stores({
    suppliers: 'supplierId, name',
    products: 'productId, brand, category, supplierId, name',
    inventoryBalances: 'productId',
    purchaseOrders: 'poId, receivedDate, supplierId, invoiceNumber',
    purchaseOrderLines: 'poLineId, poId, productId',
    sales: 'saleId, soldAt, productId, paymentMethod',
    reservations: 'reservationId, dueDate, status, productId',
    stockCounts: 'countId, countedAt, location',
    stockCountLines: 'countLineId, countId, productId'
});

export { db };
