import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  successDetails?: Array<{
    userId: number;
    employeeId?: string;
    name?: string;
    email?: string;
  }>;
}

interface ImportResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ImportResult | null;
}

export function ImportResultDialog({ open, onOpenChange, result }: ImportResultDialogProps) {
  if (!result) return null;

  const hasSuccess = result.success > 0;
  const hasFailures = result.failed > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasFailures ? (
              <AlertCircle className="h-5 w-5 text-orange-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            匯入結果
          </DialogTitle>
          <DialogDescription>
            共處理 {result.success + result.failed} 筆資料
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-6">
            {/* 統計摘要 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-green-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">成功匯入</span>
                </div>
                <div className="text-3xl font-bold text-green-700">{result.success}</div>
                <p className="text-sm text-green-600 mt-1">筆志工資料</p>
              </div>

              <div className="rounded-lg border bg-red-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-900">匯入失敗</span>
                </div>
                <div className="text-3xl font-bold text-red-700">{result.failed}</div>
                <p className="text-sm text-red-600 mt-1">筆資料</p>
              </div>
            </div>

            {/* 成功匯入的詳細資訊 */}
            {hasSuccess && result.successDetails && result.successDetails.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-green-900 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  成功匯入的志工
                </h3>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>員工編號</TableHead>
                        <TableHead>姓名</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.successDetails.map((volunteer, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {volunteer.employeeId || '-'}
                          </TableCell>
                          <TableCell>{volunteer.name || '-'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {volunteer.email || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* 失敗的詳細資訊 */}
            {hasFailures && result.errors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-red-900 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  失敗原因
                </h3>
                <div className="rounded-lg border bg-red-50 p-4 space-y-2">
                  {result.errors.map((error, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-red-800">{error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 提示訊息 */}
            {hasSuccess && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm text-blue-800">
                  ✓ 成功匯入的志工已自動設定為「志工」角色，可在志工列表中查看。
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>關閉</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
