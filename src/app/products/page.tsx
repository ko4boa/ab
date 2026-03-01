"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { Plus, Search, Tag } from "lucide-react"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ProductForm } from "@/components/products/product-form"

export default function ProductsPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const products = useLiveQuery(async () => {
        const allProducts = await db.products.toArray();
        // Join with inventory for display
        const result = await Promise.all(allProducts.map(async p => {
            const bal = await db.inventoryBalances.get(p.productId);
            return { ...p, stock: bal?.onHandQty || 0 };
        }));

        if (!searchTerm) return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

        const lower = searchTerm.toLowerCase();
        return result.filter(p =>
            p.name.toLowerCase().includes(lower) ||
            p.brand.toLowerCase().includes(lower) ||
            p.category.toLowerCase().includes(lower)
        );
    }, [searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">商品管理</h1>
                    <p className="text-muted-foreground mt-1">
                        取扱商品のマスタ管理を行います。
                    </p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            商品登録
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-black">商品を登録</DialogTitle>
                            <DialogDescription className="text-black">
                                新しい商品の情報を入力してください。
                            </DialogDescription>
                        </DialogHeader>
                        <ProductForm onSuccess={() => setIsOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="商品名、ブランド、カテゴリで検索..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products?.map((product) => (
                    <div key={product.productId} className="flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{product.brand}</span>
                                    <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
                                </div>
                                <div className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                                    {product.category}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                <div>
                                    <p className="text-muted-foreground">売価</p>
                                    <p className="font-semibold">¥{product.sellPrice?.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">現在庫</p>
                                    <p className="font-semibold">{product.stock}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {products?.length === 0 && (
                    <div className="col-span-full text-center py-12 border-2 border-dashed rounded-xl">
                        <Tag className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">商品が見つかりません</h3>
                        <p className="text-muted-foreground">右上のボタンから最初の商品を登録してください。</p>
                    </div>
                )}
            </div>
        </div>
    )
}