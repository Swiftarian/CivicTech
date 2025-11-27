import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, Download } from "lucide-react";
import { ImportResultDialog } from "@/components/ImportResultDialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ImportVolunteersDialogProps {
  onSuccess?: () => void;
}

export function ImportVolunteersDialog({ onSuccess }: ImportVolunteersDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  const importMutation = trpc.volunteers.importFromExcel.useMutation({
    onSuccess: (result) => {
      // 顯示簡單提示
      toast.success(
        `成功匯入 ${result.success} 位志工${result.failed > 0 ? `，失敗 ${result.failed} 位` : ""}`
      );
      
      // 儲存結果並顯示詳細對話框
      setImportResult(result);
      setShowResult(true);
      
      // 關閉上傳對話框
      setOpen(false);
      setFile(null);
      
      // 通知父組件更新
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`匯入失敗：${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 檢查檔案類型
      if (
        !selectedFile.name.endsWith(".xlsx") &&
        !selectedFile.name.endsWith(".xls")
      ) {
        toast.error("請選擇Excel檔案（.xlsx 或 .xls）");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("請選擇檔案");
      return;
    }

    setUploading(true);

    try {
      // 讀取Excel檔案
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // 轉換資料格式
      const volunteers = jsonData.map((row: any) => ({
        userId: Number(row["使用者ID"] || row["userId"]),
        employeeId: row["員工編號"] || row["employeeId"] || undefined,
        department: row["部門"] || row["department"] || undefined,
        position: row["職位"] || row["position"] || undefined,
        skills: row["專長技能"] || row["skills"] || undefined,
        availability: row["可服務時段"] || row["availability"] || undefined,
      }));

      // 驗證資料
      if (volunteers.length === 0) {
        toast.error("Excel檔案中沒有資料");
        setUploading(false);
        return;
      }

      // 檢查必填欄位
      const invalidRows = volunteers.filter((v) => !v.userId || isNaN(v.userId));
      if (invalidRows.length > 0) {
        toast.error("部分資料缺少使用者ID或格式錯誤");
        setUploading(false);
        return;
      }

      // 呼叫API匯入
      await importMutation.mutateAsync({ volunteers });
    } catch (error) {
      toast.error(`讀取檔案失敗：${error instanceof Error ? error.message : "未知錯誤"}`);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // 建立範本資料
    const templateData = [
      {
        "使用者ID": 2,
        "員工編號": "V001",
        "部門": "導覽組",
        "職位": "導覽員",
        "專長技能": "防災知識、導覽解說",
        "可服務時段": "週一至週五 09:00-17:00",
      },
      {
        "使用者ID": 3,
        "員工編號": "V002",
        "部門": "送餐組",
        "職位": "送餐員",
        "專長技能": "駕駛、路線規劃",
        "可服務時段": "週一至週五 11:00-14:00",
      },
    ];

    // 建立工作簿
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "志工資料");

    // 下載檔案
    XLSX.writeFile(workbook, "志工資料範本.xlsx");
    toast.success("範本檔案已下載");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            匯入Excel
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>批次匯入志工資料</DialogTitle>
            <DialogDescription>
              上傳Excel檔案批次新增志工資料。請先下載範本檔案，填寫資料後再上傳。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 下載範本 */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">Excel範本檔案</p>
                  <p className="text-sm text-muted-foreground">
                    下載範本並填寫志工資料
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                下載範本
              </Button>
            </div>

            {/* 上傳檔案 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">選擇Excel檔案</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  已選擇：{file.name}
                </p>
              )}
            </div>

            {/* 說明 */}
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-2">注意事項：</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>使用者ID必須存在於系統中</li>
                <li>請勿修改範本的欄位名稱</li>
                <li>資料從第二行開始填寫</li>
                <li>支援 .xlsx 和 .xls 格式</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? "上傳中..." : "開始匯入"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 匯入結果預覽對話框 */}
      <ImportResultDialog
        open={showResult}
        onOpenChange={setShowResult}
        result={importResult}
      />
    </>
  );
}
