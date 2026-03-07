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
import { ArrowLeftRight, CheckCircle, XCircle } from "lucide-react"
import { ReservationForm } from "@/components/reservations/reservation-form"
import { Reservation, Product } from "@/types/schema"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function ReservationsPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState<'active' | 'history'>('active');

    const reservations = useLiveQuery(async () => {
        let collection = db.reservations.orderBy('dueDate');
        if (filter === 'active') {
            // @ts-ignore
            collection = collection.filter(r => r.status === 'active');
        } else {
            // @ts-ignore
            collection = collection.filter(r => r.status !== 'active');
        }
        const list = await collection.toArray();

        // Join with products
        const joined = await Promise.all(list.map(async (r) => {
            const product = await db.products.get(r.productId);
            return {
                ...r,
                productName: product?.name || "Unknown Product",
                sellPrice: product?.sellPrice
            };
        }));
        return joined; // Active sorted by due date, history might need resort
    }, [filter]);

    const handleAction = async (res: Reservation & { sellPrice?: number }, action: 'purchased' | 'cancelled') => {
        const actionName = action === 'purchased' ? '「購入済み」' : '「キャンセル」';
        if (!confirm(`この取り置きを${actionName}に変更しますか？`)) return;

        const now = new Date().toISOString();

        try {
            await db.transaction('rw', db.reservations, db.sales, db.inventoryBalances, async () => {
                // Update Reservation Status
                await db.reservations.update(res.reservationId, {
                    status: action,
                    statusUpdatedAt: now
                });

                // Release Reserved Qty
                const currentBal = await db.inventoryBalances.get(res.productId);
                if (!currentBal) throw new Error("Inventory not found");

                let newReserved = (currentBal.reservedQty || 0) - res.qty;
                if (newReserved < 0) newReserved = 0;

                let newOnHand = currentBal.onHandQty;

                if (action === 'purchased') {
                    // Create Sale
                    await db.sales.add({
                        saleId: crypto.randomUUID(),
                        soldAt: now,
                        productId: res.productId,
                        qty: res.qty,
                        unitPrice: res.sellPrice || 0,
                        paymentMethod: 'other', // Default or ask user? assuming cash/other for quick flow
                        memo: `取り置き(${res.customerName})より`
                    });
                    // Reduce On Hand
                    newOnHand -= res.qty;
                }

                await db.inventoryBalances.update(res.productId, {
                    reservedQty: newReserved,
                    onHandQty: newOnHand,
                    updatedAt: now
                });
            });
        } catch (e) {
            console.error(e);
            alert("ステータス更新に失敗しました");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">取り置き管理</h1>
                    <p className="text-muted-foreground mt-1">
                        顧客ごとの取り置きリストとステータス管理。
                    </p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-gray-200">
                            <ArrowLeftRight className="mr-2 h-4 w-4" />
                            取り置き登録
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>取り置きを作成</DialogTitle>
                            <DialogDescription>
                                商品を確保します。販売可能在庫から差し引かれます。
                            </DialogDescription>
                        </DialogHeader>
                        <ReservationForm onSuccess={() => setIsOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex space-x-2 border-b">
                <button
                    onClick={() => setFilter('active')}
                    className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", filter === 'active' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
                >
                    有効 (Active)
                </button>
                <button
                    onClick={() => setFilter('history')}
                    className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", filter === 'history' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
                >
                    履歴 (History)
                </button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>期限日</TableHead>
                            <TableHead>顧客名</TableHead>
                            <TableHead>商品</TableHead>
                            <TableHead className="text-center">数量</TableHead>
                            <TableHead className="text-right">内金</TableHead>
                            <TableHead className="text-center">状態</TableHead>
                            {filter === 'active' && <TableHead className="text-right">操作</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reservations?.map((res) => (
                            <TableRow key={res.reservationId}>
                                <TableCell suppressHydrationWarning className={cn(
                                    (new Date(res.dueDate) < new Date()) && res.status === 'active' ? "text-red-500 font-bold" : ""
                                )}>
                                    {format(new Date(res.dueDate), 'yyyy-MM-dd')}
                                </TableCell>
                                <TableCell className="font-medium">{res.customerName}</TableCell>
                                <TableCell>{res.productName}</TableCell>
                                <TableCell className="text-center">{res.qty}</TableCell>
                                <TableCell className="text-right">¥{res.depositAmount.toLocaleString()}</TableCell>
                                <TableCell className="text-center capitalize">
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs",
                                        res.status === 'active' ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" :
                                            res.status === 'purchased' ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" :
                                                "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                    )}>
                                        {res.status === 'active' ? '保管中' :
                                            res.status === 'purchased' ? '購入済' :
                                                res.status === 'cancelled' ? 'キャンセル' : res.status}
                                    </span>
                                </TableCell>
                                {filter === 'active' && (
                                    <TableCell className="text-right space-x-2">
                                        <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleAction(res, 'purchased')} title="購入済にする">
                                            <CheckCircle className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleAction(res, 'cancelled')} title="キャンセルする">
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}


