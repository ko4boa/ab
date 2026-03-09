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
import { Loader2, Plus, Trash2 } from "lucide-react"

interface ReceiveFormProps {
    onSuccess: () => void;
}

interface LineItem {
    id: string; // temp id for UI
    productId: string;
    qty: number;
    unitCost: number;
}

export function ReceiveForm({ onSuccess }: ReceiveFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [supplierId, setSupplierId] = useState("DEFAULT"); // default supplier for now
    const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);

    const [lines, setLines] = useState<LineItem[]>([
        { id: '1', productId: '', qty: 1, unitCost: 0 }
    ]);

    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        const fetchProducts = async () => {
            const { data, error } = await supabase.from('products').select('*');
            if (data) setProducts(data);
        };
        fetchProducts();
    }, []);

    const addLine = () => {
        setLines([...lines, { id: crypto.randomUUID(), productId: '', qty: 1, unitCost: 0 }]);
    };

    const removeLine = (id: string) => {
        setLines(lines.filter(l => l.id !== id));
    };

    const updateLine = (id: string, field: keyof LineItem, value: any) => {
        setLines(lines.map(l => {
            if (l.id !== id) return l;
            const updates = { [field]: value };
            // If product changed, auto-fill cost
            if (field === 'productId') {
                const prod = products.find(p => p.productId === value);
                if (prod) {
                    // @ts-ignore
                    updates.unitCost = prod.defaultCost || 0;
                }
            }
            return { ...l, ...updates };
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoiceNumber) {
            alert("納品書番号を入力してください");
            return;
        }

        // Filter empty lines
        const validLines = lines.filter(l => l.productId && l.qty > 0);
        if (validLines.length === 0) {
            alert("少なくとも1つの商品を追加してください");
            return;
        }

        setIsLoading(true);

        try {
            const now = new Date().toISOString();
            const poId = crypto.randomUUID();

            // Create PO
            const { error: poError } = await supabase.from('purchaseOrders').insert({
                poId,
                receivedDate,
                supplierId,
                invoiceNumber,
                invoiceImageUrls: [],
                createdAt: now
            });
            if (poError) throw poError;

            // Create PO Lines & Update Inventory
            for (const line of validLines) {
                // Add Line
                const { error: lineError } = await supabase.from('purchaseOrderLines').insert({
                    poLineId: crypto.randomUUID(),
                    poId,
                    productId: line.productId,
                    qty: line.qty,
                    unitCost: line.unitCost
                });
                if (lineError) throw lineError;

                // Update Inventory Balance via RPC or multiple calls
                // For simplicity, let's fetch current then update
                const { data: currentBal, error: getBalError } = await supabase
                    .from('inventoryBalances')
                    .select('onHandQty')
                    .eq('productId', line.productId)
                    .single();

                if (getBalError) throw getBalError;

                const { error: updateError } = await supabase
                    .from('inventoryBalances')
                    .update({
                        onHandQty: (currentBal?.onHandQty || 0) + line.qty,
                        updatedAt: now
                    })
                    .eq('productId', line.productId);

                if (updateError) throw updateError;
            }

            onSuccess();
        } catch (error) {
            console.error("Failed to receive stock", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>納品書番号</Label>
                    <Input
                        value={invoiceNumber}
                        onChange={e => setInvoiceNumber(e.target.value)}
                        placeholder="INV-001"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>入荷日</Label>
                    <Input
                        type="date"
                        value={receivedDate}
                        onChange={e => setReceivedDate(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Label>入荷明細</Label>
                </div>

                {lines.map((line, index) => (
                    <div key={line.id} className="flex gap-2 items-end border-b pb-4">
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs">商品</Label>
                            <Select
                                value={line.productId}
                                onValueChange={val => updateLine(line.id, 'productId', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="選択してください" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {products.map(p => (
                                        <SelectItem key={p.productId} value={p.productId}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-20 space-y-1">
                            <Label className="text-xs">数量</Label>
                            <Input
                                type="number"
                                min="1"
                                value={line.qty}
                                onChange={e => updateLine(line.id, 'qty', Number(e.target.value))}
                            />
                        </div>
                        <div className="w-24 space-y-1">
                            <Label className="text-xs">原価 (¥)</Label>
                            <Input
                                type="number"
                                value={line.unitCost}
                                onChange={e => updateLine(line.id, 'unitCost', Number(e.target.value))}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => removeLine(line.id)}
                            disabled={lines.length === 1}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <div className="pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={addLine}>
                        <Plus className="mr-2 h-4 w-4" />
                        行を追加
                    </Button>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    入荷を確定
                </Button>
            </div>
        </form>
    )
}
