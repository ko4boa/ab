"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Box, RefreshCw } from "lucide-react"
import { ReceiveForm } from "@/components/inventory/receive-form"

export default function InventoryPage() {
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);

    const inventory = useLiveQuery(async () => {
        const balances = await db.inventoryBalances.toArray();
        // Join with products
        const joined = await Promise.all(balances.map(async (b) => {
            const product = await db.products.get(b.productId);
            return {
                ...b,
                productName: product?.name || "Unknown Product",
                brand: product?.brand || "-",
                category: product?.category || "-",
                sellPrice: product?.sellPrice
            };
        }));
        return joined.sort((a, b) => a.productName.localeCompare(b.productName));
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">在庫管理</h1>
                    <p className="text-muted-foreground mt-1">
                        現在の在庫状況と取り置き状況を確認できます。
                    </p>
                </div>
                <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-gray-200">
                            <Box className="mr-2 h-4 w-4" />
                            入荷登録
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>商品の入荷</DialogTitle>
                            <DialogDescription>
                                納品書を元に入荷情報を入力してください。
                            </DialogDescription>
                        </DialogHeader>
                        <ReceiveForm onSuccess={() => setIsReceiveOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>商品名</TableHead>
                            <TableHead>カテゴリ</TableHead>
                            <TableHead className="text-right">売価</TableHead>
                            <TableHead className="text-center">実在庫</TableHead>
                            <TableHead className="text-center">取置</TableHead>
                            <TableHead className="text-center font-bold">販売可能</TableHead>
                            <TableHead className="text-right">在庫評価額</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inventory?.map((item) => {
                            const available = item.onHandQty - item.reservedQty;
                            return (
                                <TableRow key={item.productId}>
                                    <TableCell>
                                        <div className="font-medium">{item.productName}</div>
                                        <div className="text-xs text-muted-foreground">{item.brand}</div>
                                    </TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell className="text-right">¥{item.sellPrice?.toLocaleString()}</TableCell>
                                    <TableCell className="text-center font-mono">{item.onHandQty}</TableCell>
                                    <TableCell className="text-center font-mono text-orange-500">{item.reservedQty > 0 ? item.reservedQty : '-'}</TableCell>
                                    <TableCell className="text-center font-mono font-bold text-green-600">{available}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        ¥{((item.sellPrice || 0) * available).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {inventory?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    在庫データがありません。
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
