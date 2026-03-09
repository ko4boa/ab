"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
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

    const [reservations, setReservations] = useState<any[]>([]);

    const fetchReservations = async () => {
        let query = supabase
            .from('reservations')
            .select(`
                *,
                products (
                    name,
                    sellPrice
                )
            `);

        if (filter === 'active') {
            query = query.eq('status', 'active');
        } else {
            query = query.neq('status', 'active');
        }

        const { data, error } = await query.order('dueDate', { ascending: true });

        if (error || !data) return;

        const joined = data.map((r: any) => ({
            ...r,
            productName: r.products?.name || "Unknown Product",
            sellPrice: r.products?.sellPrice
        }));
        setReservations(joined);
    };

    useEffect(() => {
        fetchReservations();
    }, [filter]);

    const handleAction = async (res: Reservation & { sellPrice?: number }, action: 'purchased' | 'cancelled') => {
        const actionName = action === 'purchased' ? '「購入済み」' : '「キャンセル」';
        if (!confirm(`この取り置きを${actionName}に変更しますか？`)) return;

        const now = new Date().toISOString();

        try {
            // Update Reservation Status
            const { error: resError } = await supabase
                .from('reservations')
                .update({
                    status: action,
                    statusUpdatedAt: now
                })
                .eq('reservationId', res.reservationId);
            if (resError) throw resError;

            // Release Reserved Qty & Update On Hand
            const { data: currentBal, error: getBalError } = await supabase
                .from('inventoryBalances')
                .select('*')
                .eq('productId', res.productId)
                .single();
            if (getBalError || !currentBal) throw new Error("Inventory not found");

            let newReserved = (currentBal.reservedQty || 0) - res.qty;
            if (newReserved < 0) newReserved = 0;

            let newOnHand = currentBal.onHandQty;

            if (action === 'purchased') {
                // Create Sale
                const { error: saleError } = await supabase.from('sales').insert({
                    saleId: crypto.randomUUID(),
                    soldAt: now,
                    productId: res.productId,
                    qty: res.qty,
                    unitPrice: res.sellPrice || 0,
                    paymentMethod: 'other',
                    memo: `取り置き(${res.customerName})より`
                });
                if (saleError) throw saleError;

                // Reduce On Hand
                newOnHand -= res.qty;
            }

            const { error: updateError } = await supabase
                .from('inventoryBalances')
                .update({
                    reservedQty: newReserved,
                    onHandQty: newOnHand,
                    updatedAt: now
                })
                .eq('productId', res.productId);
            if (updateError) throw updateError;

            fetchReservations();
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
                        <ReservationForm onSuccess={() => { setIsOpen(false); fetchReservations(); }} />
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


