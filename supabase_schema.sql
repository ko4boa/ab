-- Suppliers
CREATE TABLE "suppliers" (
    "supplierId" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactMemo" TEXT,
    "paymentTermsMemo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- Products
CREATE TABLE "products" (
    "productId" TEXT PRIMARY KEY,
    "brand" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL REFERENCES "suppliers"("supplierId"),
    "defaultCost" NUMERIC,
    "listPrice" NUMERIC,
    "sellPrice" NUMERIC,
    "imageUrls" JSONB NOT NULL DEFAULT '[]',
    "location" TEXT,
    "memo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Inventory Balances
CREATE TABLE "inventoryBalances" (
    "productId" TEXT PRIMARY KEY REFERENCES "products"("productId"),
    "onHandQty" INTEGER NOT NULL DEFAULT 0,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,
    "lastCountedAt" TIMESTAMP WITH TIME ZONE,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Purchase Orders
CREATE TABLE "purchaseOrders" (
    "poId" TEXT PRIMARY KEY,
    "receivedDate" DATE NOT NULL,
    "supplierId" TEXT NOT NULL REFERENCES "suppliers"("supplierId"),
    "invoiceNumber" TEXT NOT NULL,
    "invoiceImageUrls" JSONB NOT NULL DEFAULT '[]',
    "memo" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Purchase Order Lines
CREATE TABLE "purchaseOrderLines" (
    "poLineId" TEXT PRIMARY KEY,
    "poId" TEXT NOT NULL REFERENCES "purchaseOrders"("poId") ON DELETE CASCADE,
    "productId" TEXT NOT NULL REFERENCES "products"("productId"),
    "qty" INTEGER NOT NULL,
    "unitCost" NUMERIC
);

-- Sales
CREATE TABLE "sales" (
    "saleId" TEXT PRIMARY KEY,
    "soldAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "productId" TEXT NOT NULL REFERENCES "products"("productId"),
    "qty" INTEGER NOT NULL,
    "unitPrice" NUMERIC,
    "paymentMethod" TEXT,
    "memo" TEXT
);

-- Reservations
CREATE TABLE "reservations" (
    "reservationId" TEXT PRIMARY KEY,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "productId" TEXT NOT NULL REFERENCES "products"("productId"),
    "qty" INTEGER NOT NULL,
    "customerName" TEXT,
    "dueDate" DATE NOT NULL,
    "depositAmount" NUMERIC NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "contactMemo" TEXT,
    "statusUpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Stock Counts
CREATE TABLE "stockCounts" (
    "countId" TEXT PRIMARY KEY,
    "countedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "location" TEXT,
    "memo" TEXT
);

-- Stock Count Lines
CREATE TABLE "stockCountLines" (
    "countLineId" TEXT PRIMARY KEY,
    "countId" TEXT NOT NULL REFERENCES "stockCounts"("countId") ON DELETE CASCADE,
    "productId" TEXT NOT NULL REFERENCES "products"("productId"),
    "countedQty" INTEGER NOT NULL
);
