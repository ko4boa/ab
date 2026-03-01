import { db } from "@/lib/db";
import { Product, Supplier, InventoryBalance, PurchaseOrder, PurchaseOrderLine, Sale, Reservation, StockCount, StockCountLine } from "@/types/schema";

export type BackupData = {
    version: number;
    timestamp: string;
    data: {
        suppliers: Supplier[];
        products: Product[];
        inventoryBalances: InventoryBalance[];
        purchaseOrders: PurchaseOrder[];
        purchaseOrderLines: PurchaseOrderLine[];
        sales: Sale[];
        reservations: Reservation[];
        stockCounts: StockCount[];
        stockCountLines: StockCountLine[];
    };
};

/**
 * Export all data from the database to a JSON object
 */
export async function exportData(): Promise<BackupData> {
    try {
        const [
            suppliers,
            products,
            inventoryBalances,
            purchaseOrders,
            purchaseOrderLines,
            sales,
            reservations,
            stockCounts,
            stockCountLines
        ] = await Promise.all([
            db.suppliers.toArray(),
            db.products.toArray(),
            db.inventoryBalances.toArray(),
            db.purchaseOrders.toArray(),
            db.purchaseOrderLines.toArray(),
            db.sales.toArray(),
            db.reservations.toArray(),
            db.stockCounts.toArray(),
            db.stockCountLines.toArray(),
        ]);

        return {
            version: 1,
            timestamp: new Date().toISOString(),
            data: {
                suppliers,
                products,
                inventoryBalances,
                purchaseOrders,
                purchaseOrderLines,
                sales,
                reservations,
                stockCounts,
                stockCountLines
            }
        };
    } catch (error) {
        console.error("Export failed:", error);
        throw new Error("データの書き出しに失敗しました");
    }
}

/**
 * Import data from a JSON object into the database
 * @param backupData The parsed JSON data
 * @param clearBeforeImport If true, clears all existing data before importing
 */
export async function importData(backupData: BackupData, clearBeforeImport: boolean = false): Promise<void> {
    if (!backupData || !backupData.data || backupData.version !== 1) {
        throw new Error("無効なバックアップファイルです");
    }

    const { data } = backupData;

    try {
        await db.transaction('rw', [
            db.suppliers,
            db.products,
            db.inventoryBalances,
            db.purchaseOrders,
            db.purchaseOrderLines,
            db.sales,
            db.reservations,
            db.stockCounts,
            db.stockCountLines
        ], async () => {
            if (clearBeforeImport) {
                await Promise.all([
                    db.suppliers.clear(),
                    db.products.clear(),
                    db.inventoryBalances.clear(),
                    db.purchaseOrders.clear(),
                    db.purchaseOrderLines.clear(),
                    db.sales.clear(),
                    db.reservations.clear(),
                    db.stockCounts.clear(),
                    db.stockCountLines.clear(),
                ]);
            }

            await Promise.all([
                db.suppliers.bulkPut(data.suppliers || []),
                db.products.bulkPut(data.products || []),
                db.inventoryBalances.bulkPut(data.inventoryBalances || []),
                db.purchaseOrders.bulkPut(data.purchaseOrders || []),
                db.purchaseOrderLines.bulkPut(data.purchaseOrderLines || []),
                db.sales.bulkPut(data.sales || []),
                db.reservations.bulkPut(data.reservations || []),
                db.stockCounts.bulkPut(data.stockCounts || []),
                db.stockCountLines.bulkPut(data.stockCountLines || []),
            ]);
        });
    } catch (error) {
        console.error("Import failed:", error);
        throw new Error("データの読み込みに失敗しました");
    }
}
