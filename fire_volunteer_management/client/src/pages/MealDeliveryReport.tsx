import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Download, FileText, Loader2, Calendar } from "lucide-react";

export default function MealDeliveryReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const exportReportQuery = trpc.mealDeliveries.exportReport.useQuery(
    {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
    {
      enabled: false, // 手動觸發
    }
  );

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error("請選擇開始和結束日期");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("開始日期不能晚於結束日期");
      return;
    }

    setIsExporting(true);

    try {
      const result = await exportReportQuery.refetch();

      if (result.data?.success && result.data.data) {
        // 轉換為 CSV 格式
        const csvContent = convertToCSV(result.data.data);

        // 建立下載連結
        const blob = new Blob(["\uFEFF" + csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `送餐服務報表_${startDate}_${endDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`已匯出 ${result.data.count} 筆送餐記錄`);
      } else {
        toast.error("匯出失敗，請稍後再試");
      }
    } catch (error: any) {
      console.error("匯出錯誤", error);
      toast.error(`匯出失敗：${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return "";

    // 取得標題
    const headers = Object.keys(data[0]);
    const headerRow = headers.join(",");

    // 轉換資料行
    const dataRows = data.map(row => {
      return headers
        .map(header => {
          const value = row[header];
          // 處理包含逗號或換行的欄位，用雙引號包起來
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes("\n") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",");
    });

    return [headerRow, ...dataRows].join("\n");
  };

  // 設定預設日期範圍（本月）
  const setThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);
  };

  // 設定上個月
  const setLastMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);

    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">送餐服務報表</h1>
        <p className="text-muted-foreground">
          匯出指定時間範圍內的送餐記錄，供衛福部查核使用
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              匯出設定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 快速選擇 */}
            <div className="space-y-2">
              <Label>快速選擇</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={setThisMonth}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  本月
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={setLastMonth}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  上個月
                </Button>
              </div>
            </div>

            {/* 日期範圍選擇 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">開始日期</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">結束日期</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* 報表說明 */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-sm">報表內容包含：</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 送餐編號、日期、時段</li>
                <li>• 收餐人姓名、電話、地址</li>
                <li>• 志工姓名、送達時間</li>
                <li>• GPS 定位資訊（緯度、經度）</li>
                <li>• 收餐者狀況、餐點狀態</li>
                <li>• 志工備註</li>
              </ul>
            </div>

            {/* 匯出按鈕 */}
            <Button
              onClick={handleExport}
              disabled={isExporting || !startDate || !endDate}
              className="w-full"
              size="lg"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  匯出中...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  匯出 CSV 報表
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              匯出的 CSV 檔案可使用 Excel 或 Google Sheets 開啟
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
