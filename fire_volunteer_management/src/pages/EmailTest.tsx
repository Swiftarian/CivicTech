import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Mail, Send, History, CheckCircle2, XCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function EmailTest() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // 預約確認Email測試
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [confirmationName, setConfirmationName] = useState("");
  const [confirmationType, setConfirmationType] = useState<"public" | "group">("public");
  const [confirmationOrg, setConfirmationOrg] = useState("");

  // 預約提醒Email測試
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderName, setReminderName] = useState("");
  const [reminderType, setReminderType] = useState<"public" | "group">("public");
  const [reminderOrg, setReminderOrg] = useState("");

  // 查詢Email歷史記錄
  const { data: emailLogs, refetch: refetchLogs } = trpc.emailLogs.list.useQuery({
    limit: 20,
  });

  const { data: emailStats } = trpc.emailLogs.stats.useQuery();

  const testConfirmationMutation = trpc.emailTest.testBookingConfirmation.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message, {
          description: `測試案件編號：${data.bookingNumber}`,
        });
        refetchLogs(); // 重新載入歷史記錄
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error("發送失敗", {
        description: error.message,
      });
    },
  });

  const testReminderMutation = trpc.emailTest.testBookingReminder.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message, {
          description: `測試案件編號：${data.bookingNumber}`,
        });
        refetchLogs(); // 重新載入歷史記錄
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error("發送失敗", {
        description: error.message,
      });
    },
  });

  const handleTestConfirmation = () => {
    if (!confirmationEmail || !confirmationName) {
      toast.error("請填寫完整資訊");
      return;
    }

    if (confirmationType === "group" && !confirmationOrg) {
      toast.error("團體預約請填寫單位名稱");
      return;
    }

    testConfirmationMutation.mutate({
      recipientEmail: confirmationEmail,
      recipientName: confirmationName,
      bookingType: confirmationType,
      organizationName: confirmationType === "group" ? confirmationOrg : undefined,
    });
  };

  const handleTestReminder = () => {
    if (!reminderEmail || !reminderName) {
      toast.error("請填寫完整資訊");
      return;
    }

    if (reminderType === "group" && !reminderOrg) {
      toast.error("團體預約請填寫單位名稱");
      return;
    }

    testReminderMutation.mutate({
      recipientEmail: reminderEmail,
      recipientName: reminderName,
      bookingType: reminderType,
      organizationName: reminderType === "group" ? reminderOrg : undefined,
    });
  };

  // 檢查權限
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>權限不足</CardTitle>
            <CardDescription>此頁面僅限管理員使用</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")}>返回首頁</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4">
      <div className="container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email通知測試</h1>
          <p className="text-gray-600">測試預約確認和提醒Email功能</p>
        </div>

        <div className="grid gap-6">
          {/* 預約確認Email測試 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-600" />
                <CardTitle>預約確認Email測試</CardTitle>
              </div>
              <CardDescription>
                測試預約成功後立即發送的確認Email（模擬7天後的預約）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirmation-email">收件人Email</Label>
                <Input
                  id="confirmation-email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={confirmationEmail}
                  onChange={(e) => setConfirmationEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmation-name">收件人姓名</Label>
                <Input
                  id="confirmation-name"
                  placeholder="張三"
                  value={confirmationName}
                  onChange={(e) => setConfirmationName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>預約類型</Label>
                <RadioGroup
                  value={confirmationType}
                  onValueChange={(value) => setConfirmationType(value as "public" | "group")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="confirmation-public" />
                    <Label htmlFor="confirmation-public" className="font-normal cursor-pointer">
                      民眾預約（1-19人）
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="group" id="confirmation-group" />
                    <Label htmlFor="confirmation-group" className="font-normal cursor-pointer">
                      團體預約（20人以上）
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {confirmationType === "group" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmation-org">單位名稱</Label>
                  <Input
                    id="confirmation-org"
                    placeholder="台東國小"
                    value={confirmationOrg}
                    onChange={(e) => setConfirmationOrg(e.target.value)}
                  />
                </div>
              )}

              <Button
                onClick={handleTestConfirmation}
                disabled={testConfirmationMutation.isPending}
                className="w-full"
              >
                {testConfirmationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    發送中...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    發送測試Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 預約提醒Email測試 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-amber-600" />
                <CardTitle>預約提醒Email測試</CardTitle>
              </div>
              <CardDescription>
                測試參訪日前3天自動發送的提醒Email（模擬3天後的預約）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reminder-email">收件人Email</Label>
                <Input
                  id="reminder-email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={reminderEmail}
                  onChange={(e) => setReminderEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-name">收件人姓名</Label>
                <Input
                  id="reminder-name"
                  placeholder="李四"
                  value={reminderName}
                  onChange={(e) => setReminderName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>預約類型</Label>
                <RadioGroup
                  value={reminderType}
                  onValueChange={(value) => setReminderType(value as "public" | "group")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="reminder-public" />
                    <Label htmlFor="reminder-public" className="font-normal cursor-pointer">
                      民眾預約（1-19人）
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="group" id="reminder-group" />
                    <Label htmlFor="reminder-group" className="font-normal cursor-pointer">
                      團體預約（20人以上）
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {reminderType === "group" && (
                <div className="space-y-2">
                  <Label htmlFor="reminder-org">單位名稱</Label>
                  <Input
                    id="reminder-org"
                    placeholder="台東國中"
                    value={reminderOrg}
                    onChange={(e) => setReminderOrg(e.target.value)}
                  />
                </div>
              )}

              <Button
                onClick={handleTestReminder}
                disabled={testReminderMutation.isPending}
                className="w-full"
                variant="outline"
              >
                {testReminderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    發送中...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    發送測試Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Email發送歷史記錄 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-gray-600" />
                <CardTitle>Email發送歷史記錄</CardTitle>
              </div>
              <CardDescription>
                最近20筆Email發送記錄
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailStats && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">總發送數</p>
                    <p className="text-2xl font-bold text-gray-900">{emailStats.total}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">成功</p>
                    <p className="text-2xl font-bold text-green-700">{emailStats.success}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600">失敗</p>
                    <p className="text-2xl font-bold text-red-700">{emailStats.failed}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">測試Email</p>
                    <p className="text-2xl font-bold text-blue-700">{emailStats.testEmails}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {emailLogs && emailLogs.length > 0 ? (
                  emailLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {log.status === 'success' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="font-medium">{log.subject}</span>
                            {log.isTest && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                測試
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-0.5">
                            <p>收件人：{log.recipientEmail} {log.recipientName && `(${log.recipientName})`}</p>
                            <p>類型：{log.emailType}</p>
                            <p>時間：{new Date(log.sentAt).toLocaleString('zh-TW')}</p>
                            {log.errorMessage && (
                              <p className="text-red-600">錯誤：{log.errorMessage}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    尚無Email發送記錄
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 說明區塊 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">測試說明</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 space-y-2">
              <p><strong>目前狀態：</strong>系統使用 console.log 模擬Email發送</p>
              <p><strong>如何查看：</strong>點擊「發送測試Email」後，請查看瀏覽器開發者工具的Console（按F12），Email內容會顯示在日誌中</p>
              <p><strong>實際部署：</strong>整合真實Email服務（Gmail SMTP、SendGrid、AWS SES）後，Email會實際發送到收件人信箱</p>
              <p><strong>注意事項：</strong>測試Email的案件編號會以「TEST」開頭，方便識別</p>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setLocation("/")} className="flex-1">
              返回首頁
            </Button>
            <Button variant="outline" onClick={() => setLocation("/admin/bookings")} className="flex-1">
              前往預約管理
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
