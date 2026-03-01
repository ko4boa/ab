"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { exportData, importData } from "@/lib/backup";
import { Loader2, Download, Upload, RefreshCw, Construction } from "lucide-react";

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);

    const handleExport = async () => {
        setIsLoading(true);
        try {
            const data = await exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const date = new Date().toISOString().split('T')[0];
            a.download = `inventory_backup_${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert("エクスポートに失敗しました。");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        if (!importFile) return;

        if (!confirm("現在のデータを上書きして、バックアップファイルの内容を復元しますか？\n(この操作は取り消せません)")) {
            return;
        }

        setIsLoading(true);
        try {
            const text = await importFile.text();
            const json = JSON.parse(text);
            await importData(json, true); // true = clear existing data
            alert("データの復元が完了しました。");
            window.location.reload();
        } catch (error) {
            alert("インポートに失敗しました。ファイルが正しいか確認してください。");
            console.error(error);
        } finally {
            setIsLoading(false);
            setImportFile(null);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">設定</h1>
                <p className="text-muted-foreground mt-1">
                    アプリケーションの設定とデータ管理を行います。
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>データのバックアップと復元</CardTitle>
                        <CardDescription>
                            データをJSONファイルとして書き出し、別の端末で読み込むことができます。
                            <br />
                            iCloud Driveなどに保存することで、複数端末でのデータ移行に使えます。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium">データの書き出し (エクスポート)</h3>
                            <p className="text-sm text-muted-foreground">
                                現在のすべてのデータをファイル(JSON形式)に保存します。
                            </p>
                            <Button onClick={handleExport} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                バックアップファイルをダウンロード
                            </Button>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <h3 className="text-lg font-medium">データの読み込み (インポート)</h3>
                            <p className="text-sm text-muted-foreground">
                                バックアップファイルからデータを復元します。
                                <br />
                                <span className="text-red-500 font-bold">注意: 現在のデータはすべて消去され、ファイルの内容で上書きされます。</span>
                            </p>
                            <div className="flex w-full max-w-sm items-center space-x-2">
                                <Input
                                    type="file"
                                    accept=".json"
                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                />
                                <Button onClick={handleImport} disabled={!importFile || isLoading} variant="secondary">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    復元を実行
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="opacity-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Construction className="h-5 w-5" />
                            その他の設定
                        </CardTitle>
                        <CardDescription>
                            将来的にここに消費税率の設定や、店舗情報の設定を追加予定です。
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">現在利用可能な設定はありません。</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
