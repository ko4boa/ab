"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Product } from "@/types/schema"
import { Loader2 } from "lucide-react"

interface ProductFormProps {
    onSuccess: () => void;
    initialData?: Product;
}

export function ProductForm({ onSuccess, initialData }: ProductFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Product>>(initialData || {
        brand: "",
        name: "",
        category: "",
        supplierId: "DEFAULT_SUPPLIER", // Placeholder logic
        defaultCost: 0,
        sellPrice: 0,
        location: "Shed",
        isActive: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const now = new Date().toISOString();
            const productId = initialData?.productId || crypto.randomUUID();

            const productData = {
                productId: productId,
                brand: formData.brand || "",
                name: formData.name || "",
                category: formData.category || "",
                supplierId: formData.supplierId || "DEFAULT", // supplierIdの依存があるので後できちんと扱うか、とりあえずDEFAULTを許容する
                defaultCost: Number(formData.defaultCost) || 0,
                sellPrice: Number(formData.sellPrice) || 0,
                location: formData.location || "",
                memo: formData.memo || "",
                imageUrls: [],
                isActive: true,
                createdAt: initialData?.createdAt || now,
                updatedAt: now,
            };

            // supplierIdが存在しないとエラーになるため、一時的に "DEFAULT" サプライヤーを作るかSupabase側へ送信する
            // 簡略化のため、まず suppliers テーブルにダミーがない場合はエラーになるので注意。本番では選択させる。
            const { error: productError } = await supabase
                .from('products')
                .upsert(productData);

            if (productError) throw productError;

            // If new product, initialize inventory with 0
            if (!initialData) {
                const { error: invError } = await supabase
                    .from('inventoryBalances')
                    .upsert({
                        productId: productData.productId,
                        onHandQty: 0,
                        reservedQty: 0,
                        updatedAt: now
                    });
                if (invError) throw invError;
            }

            setFormData({});
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Failed to save product", error);
            alert("保存に失敗しました。ダミーサプライヤー(DEFAULT)が存在しない可能性があります。");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="brand" className="text-black">ブランド</Label>
                    <Input id="brand" name="brand" value={formData.brand || ""} onChange={handleChange} required placeholder="Nike, Apple..." className="text-black" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category" className="text-black">カテゴリ</Label>
                    <Input id="category" name="category" value={formData.category || ""} onChange={handleChange} required placeholder="スニーカー, 家電..." className="text-black" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="name" className="text-black">商品名 / 型番</Label>
                <Input id="name" name="name" value={formData.name || ""} onChange={handleChange} required placeholder="Air Force 1 '07" className="text-black" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="defaultCost" className="text-black">原価 (¥)</Label>
                    <Input id="defaultCost" name="defaultCost" type="number" value={formData.defaultCost || ""} onChange={handleChange} className="text-black" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sellPrice" className="text-black">売価 (¥)</Label>
                    <Input id="sellPrice" name="sellPrice" type="number" value={formData.sellPrice || ""} onChange={handleChange} className="text-black" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="location" className="text-black">保管場所</Label>
                <Input id="location" name="location" value={formData.location || ""} onChange={handleChange} placeholder="棚A, 倉庫..." className="text-black" />
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "更新する" : "登録する"}
                </Button>
            </div>
        </form>
    )
}
