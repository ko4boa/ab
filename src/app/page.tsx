"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import {
  ArrowUpRight,
  Box,
  CreditCard,
  DollarSign,
  Plus,
  Users,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Parallel fetch for dashboard data
    const [
      { data: products },
      { data: reservations },
      { data: salesToday },
      { data: balances }
    ] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('reservations').select('*').eq('status', 'active'),
      supabase.from('sales').select('*').gte('soldAt', today),
      supabase.from('inventoryBalances').select('*, products(defaultCost)')
    ]);

    if (!products || !reservations || !salesToday || !balances) return;

    // Calculate totals
    const stockValue = balances.reduce((acc: number, b: any) => {
      return acc + (b.onHandQty * (b.products?.defaultCost || 0));
    }, 0);

    const totalSalesToday = salesToday.reduce((acc: number, s: any) => acc + (s.unitPrice || 0) * s.qty, 0);

    setStats({
      productsCount: products.length,
      activeReservations: reservations.length,
      salesTodayCount: salesToday.length,
      salesTodayAmount: totalSalesToday,
      stockValue
    });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-muted-foreground mt-1">
            お疲れ様です。本日の状況を確認しましょう。
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/inventory">
              <Box className="mr-2 h-4 w-4" />
              入荷登録
            </Link>
          </Button>
          <Button asChild className="bg-primary text-gray-200 hover:bg-primary/90">
            <Link href="/sales">
              <Plus className="mr-2 h-4 w-4" />
              販売登録
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="今日の売上"
          value={`¥${stats?.salesTodayAmount?.toLocaleString() ?? '0'}`}
          icon={DollarSign}
          trend="昨日比 +20.1% (ダミー)"
        />
        <KpiCard
          title="有効な取り置き"
          value={stats?.activeReservations?.toString() ?? '0'}
          icon={Users}
          trend="期限間近: 2件 (ダミー)"
          trendColor="text-orange-500"
        />
        <KpiCard
          title="在庫総額(概算)"
          value={`¥${stats?.stockValue?.toLocaleString() ?? '0'}`}
          icon={CreditCard}
        />
        <KpiCard
          title="在庫僅少商品"
          value="3"
          icon={AlertCircle}
          trend="確認が必要です"
          trendColor="text-red-500"
        />
      </div>

      {/* Recent Activity / Reserved Sections could go here */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">最近の販売</h3>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
            データなし
          </div>
        </div>
        <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">期限間近の取り置き</h3>
          <div className="space-y-4">
            {/* Placeholder for list */}
            <div className="text-sm text-muted-foreground text-center py-8">
              有効な取り置きはありません
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, trend, trendColor = "text-muted-foreground" }: any) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
          {title}
        </h3>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="p-6 pt-0">
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={cn("text-xs mt-1", trendColor)}>
            {trend}
          </p>
        )}
      </div>
    </div>
  )
}
