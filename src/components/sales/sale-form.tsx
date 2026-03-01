"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface SaleFormProps {
    onSuccess: () => void;
}

export function SaleForm({ onSuccess }: SaleFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [productId, setProductId] = useState("");
    const [qty, setQty] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [unitPrice, setUnitPrice] = useState(0);

    const products = useLiveQuery(() => db.products.toArray()) || [];

    // Fetch current stock for validation
    const stock = useLiveQuery(async () => {
        if (!productId) return null;
        return await db.inventoryBalances.get(productId);
    }, [productId]);

    const handleProductChange = (val: string) => {
        setProductId(val);
        const prod = products.find(p => p.productId === val);
        if (prod) {
            setUnitPrice(prod.sellPrice || 0);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!productId) {
            alert("商品を選択してください");
            return;
        }

        if (stock && (stock.onHandQty - stock.reservedQty) < qty) {
            if (!confirm(`警告: 販売可能数(${stock.onHandQty - stock.reservedQty})を超えています。続行しますか？`)) {
                return;
            }
        }

        setIsLoading(true);

        try {
            const now = new Date().toISOString();
            const saleId = crypto.randomUUID();

            // Record Sale
            await db.sales.add({
                saleId,
                soldAt: now,
                productId,
                qty,
                unitPrice,
                paymentMethod: paymentMethod as any,
            });

            // Update Inventory
            const currentBal = await db.inventoryBalances.get(productId);
            if (currentBal) {
                await db.inventoryBalances.update(productId, {
                    onHandQty: currentBal.onHandQty - qty,
                    updatedAt: now
                });
            }

            onSuccess();
        } catch (error) {
            console.error("Failed to record sale", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>商品</Label>
                <Select value={productId} onValueChange={handleProductChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="商品を選択" />
                    </SelectTrigger>
                    <SelectContent>
                        {products.map(p => (
                            <SelectItem key={p.productId} value={p.productId}>
                                {p.name} ({p.brand})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {stock && (
                    <div className="text-xs text-muted-foreground text-right">
                        販売可能数: <span className="font-bold text-green-600">{stock.onHandQty - stock.reservedQty}</span> (総在庫: {stock.onHandQty})
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>数量</Label>
                    <Input
                        type="number"
                        min="1"
                        value={qty}
                        onChange={e => setQty(Number(e.target.value))}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>単価 (¥)</Label>
                    <Input
                        type="number"
                        value={unitPrice}
                        onChange={e => setUnitPrice(Number(e.target.value))}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>支払方法</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="cash">現金</SelectItem>
                        <SelectItem value="card">クレジットカード</SelectItem>
                        <SelectItem value="qr">QR決済</SelectItem>
                        <SelectItem value="bank_transfer">銀行振込</SelectItem>
                        <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    販売を確定
                </Button>
            </div>
        </form>
    )
}
