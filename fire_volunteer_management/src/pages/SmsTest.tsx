import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { MessageSquare, Send, CheckCircle, XCircle, Info } from "lucide-react";

export default function SmsTest() {
  const { user, loading } = useAuth();
  const [recipientPhone, setRecipientPhone] = useState("0912-345-678");
  const [recipientName, setRecipientName] = useState("測試收餐人");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    verificationCode: string;
    deliveryNumber: string;
    smsContent: string;
    message: string;
  } | null>(null);

  const testSmsMutation = trpc.smsTest.testDeliveryNotification.useMutation({
    onSuccess: (data) => {
      setTestResult(data);
      if (data.success) {
        toast.success("SMS測試發送成功！");
      } else {
        toast.error("SMS測試發送失敗");
      }
    },
    onError: (error) => {
      toast.error(`測試失敗：${error.message}`);
    },
  });

  const handleTestSms = () => {
    if (!recipientPhone || !recipientName) {
      toast.error("請填寫完整的測試資訊");
      return;
    }

    testSmsMutation.mutate({
      recipientPhone,
      recipientName,
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>載入中...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>您沒有權限訪問此頁面</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">SMS簡訊測試</h1>
        <p className="text-muted-foreground">
          測試送餐服務SMS通知功能（目前為模擬模式）
        </p>
      </div>

      <div className="grid gap-6">
        {/* 測試說明 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>測試說明：</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• 目前SMS功能為模擬模式，實際不會發送簡訊</li>
              <li>• SMS內容會顯示在下方預覽區域和伺服器console</li>
              <li>• 整合真實SMS服務（如Twilio）後即可實際發送</li>
              <li>• 驗證序號為6位數字，用於收餐人簽收驗證</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* 測試表單 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              發送測試SMS
            </CardTitle>
            <CardDescription>
              填寫測試資訊並發送SMS通知
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName">收餐人姓名</Label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="例如：王小明"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientPhone">收餐人手機號碼</Label>
              <Input
                id="recipientPhone"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="例如：0912-345-678"
              />
            </div>

            <Button
              onClick={handleTestSms}
              disabled={testSmsMutation.isPending}
              className="w-full"
              size="lg"
            >
              <Send className="mr-2 h-4 w-4" />
              {testSmsMutation.isPending ? "發送中..." : "發送測試SMS"}
            </Button>
          </CardContent>
        </Card>

        {/* 測試結果 */}
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                測試結果
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className={testResult.success ? "border-green-600" : "border-red-600"}>
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>

              {testResult.success && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">送餐編號</p>
                      <p className="font-mono font-semibold">{testResult.deliveryNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">驗證序號</p>
                      <p className="font-mono font-semibold text-lg text-yellow-700">
                        {testResult.verificationCode}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>SMS內容預覽</Label>
                    <div className="p-4 bg-muted rounded-lg border">
                      <pre className="text-sm whitespace-pre-wrap font-sans">
                        {testResult.smsContent}
                      </pre>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>模擬模式說明：</strong>
                      <br />
                      實際整合SMS服務後，收餐人將收到包含驗證序號和確認連結的簡訊。
                      收餐人點擊連結後，需要輸入驗證序號才能完成簽收。
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* 整合說明 */}
        <Card>
          <CardHeader>
            <CardTitle>整合真實SMS服務</CardTitle>
            <CardDescription>
              如何將模擬模式改為真實SMS發送
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-2">步驟1：選擇SMS服務提供商</p>
              <p className="text-muted-foreground">
                推薦使用 Twilio、AWS SNS 或其他SMS服務提供商
              </p>
            </div>

            <div>
              <p className="font-semibold mb-2">步驟2：設定環境變數</p>
              <p className="text-muted-foreground mb-1">
                在環境變數中設定SMS服務憑證：
              </p>
              <div className="p-3 bg-muted rounded font-mono text-xs">
                SMS_ACCOUNT_SID=your_account_sid
                <br />
                SMS_AUTH_TOKEN=your_auth_token
                <br />
                SMS_FROM_NUMBER=+886912345678
              </div>
            </div>

            <div>
              <p className="font-semibold mb-2">步驟3：修改程式碼</p>
              <p className="text-muted-foreground">
                在 <code className="px-1 py-0.5 bg-muted rounded">server/smsService.ts</code> 中將模擬發送改為真實API呼叫
              </p>
            </div>

            <div>
              <p className="font-semibold mb-2">步驟4：測試驗證</p>
              <p className="text-muted-foreground">
                使用本頁面測試真實SMS發送，確認收餐人能收到簡訊
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
