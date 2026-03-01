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
import { Plus, ShoppingCart } from "lucide-react"
import { SaleForm } from "@/components/sales/sale-form"
import { format } from "date-fns"

export default function SalesPage() {
    const [isOpen, setIsOpen] = useState(false);

    const sales = useLiveQuery(async () => {
        const allSales = await db.sales.orderBy('soldAt').reverse().toArray();
        // Join with products
        const joined = await Promise.all(allSales.map(async (s) => {
            const product = await db.products.get(s.productId);
            return {
                ...s,
                productName: product?.name || "Unknown Product",
            };
        }));
        return joined;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">販売記録</h1>
                    <p className="text-muted-foreground mt-1">
                        販売履歴の確認と新規販売の記録。
                    </p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            販売登録
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>販売を記録</DialogTitle>
                            <DialogDescription>
                                商品を販売し、在庫から減算します。
                            </DialogDescription>
                        </DialogHeader>
                        <SaleForm onSuccess={() => setIsOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>日時</TableHead>
                            <TableHead>商品</TableHead>
                            <TableHead className="text-center">数量</TableHead>
                            <TableHead className="text-right">単価</TableHead>
                            <TableHead className="text-right">合計</TableHead>
                            <TableHead>支払方法</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sales?.map((sale) => (
                            <TableRow key={sale.saleId}>
                                <TableCell suppressHydrationWarning>
                                    {format(new Date(sale.soldAt), 'yyyy-MM-dd HH:mm')}
                                </TableCell>
                                <TableCell className="font-medium">{sale.productName}</TableCell>
                                <TableCell className="text-center">{sale.qty}</TableCell>
                                <TableCell className="text-right">¥{sale.unitPrice?.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-bold">¥{((sale.unitPrice || 0) * sale.qty).toLocaleString()}</TableCell>
                                <TableCell className="capitalize text-muted-foreground">
                                    {sale.paymentMethod === 'cash' ? '現金' :
                                        sale.paymentMethod === 'card' ? 'カード' :
                                            sale.paymentMethod === 'qr' ? 'QR決済' :
                                                sale.paymentMethod === 'bank_transfer' ? '銀行振込' : 'その他'}
                                </TableCell>
                            </TableRow>
                        ))}
                        {sales?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <ShoppingCart className="h-8 w-8 mb-2 opacity-20" />
                                        販売データがありません。
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
