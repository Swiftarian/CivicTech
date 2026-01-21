import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Package } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";

/**
 * 收餐確認頁面（簡化版）
 * 供LINE Rich Menu使用，收餐人只需輸入驗證碼即可確認收餐
 */
export default function MealConfirm() {
  const [verificationCode, setVerificationCode] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<any>(null);

  // 確認收餐（只需驗證碼）
  const confirmMutation = trpc.mealDeliveries.confirmReceiptByCode.useMutation({
    onSuccess: (data) => {
      setIsSuccess(true);
      setDeliveryInfo(data);
      toast.success("收餐確認成功！");
    },
    onError: (error) => {
      toast.error(`確認失敗：${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      toast.error("請輸入驗證碼");
      return;
    }

    if (verificationCode.trim().length !== 6) {
      toast.error("驗證碼必須是6位英數字");
      return;
    }

    // 只用驗證碼確認收餐
    confirmMutation.mutate({
      verificationCode: verificationCode.trim().toUpperCase(),
    });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-600">收餐確認成功！</CardTitle>
            <CardDescription>
              感謝您的配合，祝您用餐愉快
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {deliveryInfo && (
              <Alert>
                <AlertDescription className="space-y-1">
                  <p><strong>送餐編號：</strong>{deliveryInfo.deliveryNumber}</p>
                  <p><strong>送餐志工：</strong>{deliveryInfo.volunteerName}</p>
                  <p><strong>確認時間：</strong>{new Date().toLocaleString('zh-TW')}</p>
                </AlertDescription>
              </Alert>
            )}
            <Alert>
              <AlertDescription>
                您的收餐記錄已成功登記，送餐志工已收到通知。
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={() => {
                setIsSuccess(false);
                setVerificationCode("");
                setDeliveryInfo(null);
              }}
              className="w-full"
            >
              返回
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {APP_LOGO ? (
              <img src={APP_LOGO} alt={APP_TITLE} className="w-16 h-16" />
            ) : (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="w-10 h-10 text-green-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">收餐確認</CardTitle>
          <CardDescription>
            請輸入送餐志工提供的驗證碼
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="verificationCode" className="text-lg">驗證碼</Label>
              <Input
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                placeholder="請輸入6位驗證碼"
                maxLength={6}
                required
                className="text-2xl text-center font-mono tracking-widest h-14"
                autoFocus
              />
              <p className="text-sm text-muted-foreground text-center">
                驗證碼為6位英數字（例如：ABC123）
              </p>
            </div>

            <Alert>
              <AlertDescription>
                💡 <strong>如何取得驗證碼？</strong>
                <br />
                • 送餐志工會在送達時告知您驗證碼
                <br />
                • 或您可以在LINE通知訊息中找到驗證碼
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending && (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              )}
              確認收餐
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              如有任何問題，請聯絡送餐志工或客服人員
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
