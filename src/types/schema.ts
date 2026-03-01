export type Supplier = {
    supplierId: string;
    name: string;
    contactMemo?: string;
    paymentTermsMemo?: string;
    isActive: boolean;
};

export type Product = {
    productId: string;
    brand: string;
    name: string;
    category: string;
    supplierId: string;
    defaultCost?: number;
    listPrice?: number;
    sellPrice?: number;
    imageUrls: string[];
    location?: string;
    memo?: string;
    isActive: boolean;
    createdAt: string; // ISO Date
    updatedAt: string; // ISO Date
};

export type InventoryBalance = {
    productId: string;
    onHandQty: number;   // 実在庫
    reservedQty: number; // 取り置き引当数
    // availableQty is computed: onHandQty - reservedQty
    lastCountedAt?: string;
    updatedAt: string;
};

export type PurchaseOrder = {
    poId: string;
    receivedDate: string; // YYYY-MM-DD
    supplierId: string;
    invoiceNumber: string;
    invoiceImageUrls: string[];
    memo?: string;
    createdAt: string;
};

export type PurchaseOrderLine = {
    poLineId: string;
    poId: string;
    productId: string;
    qty: number;
    unitCost?: number;
    // lineTotal is computed
};

export type Sale = {
    saleId: string;
    soldAt: string; // ISO Date
    productId: string;
    qty: number;
    unitPrice?: number;
    paymentMethod?: 'cash' | 'bank_transfer' | 'card' | 'qr' | 'other';
    memo?: string;
};

export type ReservationStatus = 'active' | 'purchased' | 'expired' | 'cancelled';

export type Reservation = {
    reservationId: string;
    createdAt: string; // ISO Date
    productId: string;
    qty: number;
    customerName?: string;
    dueDate: string; // YYYY-MM-DD
    depositAmount: number;
    status: ReservationStatus;
    contactMemo?: string;
    statusUpdatedAt: string;
};

export type StockCount = {
    countId: string;
    countedAt: string;
    location?: string;
    memo?: string;
};

export type StockCountLine = {
    countLineId: string;
    countId: string;
    productId: string;
    countedQty: number;
};
