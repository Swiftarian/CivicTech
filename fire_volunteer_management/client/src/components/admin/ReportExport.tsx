import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FileDown, Download } from "lucide-react";
import { format } from "date-fns";

export default function ReportExport() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<"csv" | "excel">("excel");
  const [isExporting, setIsExporting] = useState(false);

  const exportMutation = trpc.mealDeliveries.exportReport.useQuery(
    {
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(),
      format: exportFormat,
    },
    {
      enabled: false, // 手動觸發
    }
  );

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error("請選擇開始日期和結束日期");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("開始日期不能晚於結束日期");
      return;
    }

    setIsExporting(true);

    try {
      const result = await exportMutation.refetch();

      if (result.data?.success) {
        const { content, filename, format: fileFormat, count } = result.data;

        if (count === 0) {
          toast.warning("查詢時間範圍內沒有送餐記錄");
          setIsExporting(false);
          return;
        }

        // 下載檔案
        let blob: Blob;
        if (fileFormat === "csv") {
          blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
        } else {
          // Excel (base64)
          const binaryString = atob(content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blob = new Blob([bytes], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`報表匯出成功！共 ${count} 筆資料`);
      } else {
        toast.error("報表匯出失敗");
      }
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(`匯出失敗：${error.message || "未知錯誤"}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="h-5 w-5" />
          衛福部查核報表匯出
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          匯出指定時間範圍內的送餐服務記錄（包含所有狀態），供衛福部查核使用。
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">開始日期</Label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">結束日期</Label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="format">匯出格式</Label>
          <Select
            value={exportFormat}
            onValueChange={(value: "csv" | "excel") => setExportFormat(value)}
          >
            <SelectTrigger id="format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excel">Excel (.xlsx)</SelectItem>
              <SelectItem value="csv">CSV (.csv)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleExport}
            disabled={isExporting || !startDate || !endDate}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "匯出中..." : "匯出報表"}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p className="font-semibold">報表欄位說明：</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>事故編號、送餐日期、送餐時段</li>
            <li>服務人員（志工）、服務對象、聯絡電話</li>
            <li>送餐地址、餐點類型、特殊說明</li>
            <li>任務狀態、開始送餐時間、送達時間</li>
            <li>GPS 定位（緯度、經度）、送達照片網址</li>
            <li>收餐人狀況、送餐狀況、志工備註、任務備註</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
