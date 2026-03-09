"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
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

interface ReservationFormProps {
    onSuccess: () => void;
}

export function ReservationForm({ onSuccess }: ReservationFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [productId, setProductId] = useState("");
    const [qty, setQty] = useState(1);
    const [customerName, setCustomerName] = useState("");
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7); // Default 7 days
        return d.toISOString().split('T')[0];
    });
    const [deposit, setDeposit] = useState(0);

    const [products, setProducts] = useState<any[]>([]);
    const [stock, setStock] = useState<any>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            const { data } = await supabase.from('products').select('*');
            if (data) setProducts(data);
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchStock = async () => {
            if (!productId) {
                setStock(null);
                return;
            }
            const { data } = await supabase
                .from('inventoryBalances')
                .select('*')
                .eq('productId', productId)
                .single();
            setStock(data);
        };
        fetchStock();
    }, [productId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!productId) {
            alert("商品を選択してください");
            return;
        }

        // Check availability
        const available = stock ? stock.onHandQty - stock.reservedQty : 0;
        if (available < qty) {
            if (!confirm(`警告: 販売可能数(${available})を超えています。それでも取り置きますか？`)) {
                return;
            }
        }

        setIsLoading(true);

        try {
            const now = new Date().toISOString();
            const reservationId = crypto.randomUUID();

            // Create Reservation
            const { error: resError } = await supabase.from('reservations').insert({
                reservationId,
                createdAt: now,
                productId,
                qty,
                customerName,
                dueDate,
                depositAmount: deposit,
                status: 'active',
                statusUpdatedAt: now
            });
            if (resError) throw resError;

            // Update Inventory (Increase Reserved Qty)
            const { data: currentBal, error: getBalError } = await supabase
                .from('inventoryBalances')
                .select('reservedQty')
                .eq('productId', productId)
                .single();

            if (getBalError) throw getBalError;

            const { error: updateError } = await supabase
                .from('inventoryBalances')
                .update({
                    reservedQty: (currentBal?.reservedQty || 0) + qty,
                    updatedAt: now
                })
                .eq('productId', productId);

            if (updateError) throw updateError;

            onSuccess();
        } catch (error) {
            console.error("Failed to create reservation", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>商品</Label>
                <Select value={productId} onValueChange={setProductId}>
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
                        引当可能: <span className="font-bold text-green-600">{stock.onHandQty - stock.reservedQty}</span>
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
                    <Label>期限日</Label>
                    <Input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>顧客名</Label>
                <Input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="山田 花子"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>内金 (¥)</Label>
                <Input
                    type="number"
                    value={deposit}
                    onChange={e => setDeposit(Number(e.target.value))}
                />
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    登録を完了
                </Button>
            </div>
        </form>
    )
}
