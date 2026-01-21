import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, MapPin, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * 收餐人QR Code掃描確認頁面
 * 收餐人掃描志工出示的QR Code後會導向此頁面
 * 點擊確認按鈕即完成收餐確認
 */
export default function ConfirmReceipt() {
  const params = useParams();
  const deliveryId = params.deliveryId ? parseInt(params.deliveryId) : 0;
  
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");

  const { data: delivery, isLoading } = trpc.mealDeliveries.getById.useQuery(
    { id: deliveryId },
    { enabled: deliveryId > 0 }
  );

  const confirmMutation = trpc.mealDeliveries.confirmReceipt.useMutation({
    onSuccess: () => {
      setConfirmed(true);
      setConfirming(false);
      toast.success("收餐確認成功！感謝您的配合");
    },
    onError: (error) => {
      setError(error.message);
      setConfirming(false);
      toast.error(`確認失敗：${error.message}`);
    },
  });

  // 獲取GPS位置
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("無法獲取GPS位置:", error);
          // GPS獲取失敗不影響確認流程
        }
      );
    }
  }, []);

  const handleConfirm = () => {
    // 驗證序號
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("請輸入6位數驗證序號");
      return;
    }

    if (delivery?.verificationCode !== verificationCode) {
      toast.error("驗證序號不正確，請向志工索取正確的序號");
      return;
    }

    setConfirming(true);
    setError(null);

    confirmMutation.mutate({
      deliveryId,
      verificationCode: verificationCode.trim(),
      latitude: location?.latitude,
      longitude: location?.longitude,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <p className="text-gray-600">載入中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              <CardTitle>找不到送餐記錄</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              很抱歉，系統找不到此送餐記錄。請確認QR Code是否正確或聯繫客服人員。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (delivery.status === 'delivered') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <div className="flex items-center gap-2 text-blue-600">
              <CheckCircle2 className="h-6 w-6" />
              <CardTitle>已確認收餐</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              此送餐記錄已經確認完成，無需重複確認。感謝您的配合！
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              <CardTitle>收餐確認成功！</CardTitle>
            </div>
            <CardDescription>感謝您的配合，祝您用餐愉快</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">送餐資訊</h3>
              <div className="space-y-1 text-sm text-green-800">
                <p><span className="font-medium">送餐編號：</span>{delivery.deliveryNumber}</p>
                <p><span className="font-medium">收餐人：</span>{delivery.recipientName}</p>
                <p><span className="font-medium">送餐地址：</span>{delivery.deliveryAddress}</p>
              </div>
            </div>
            {location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>已記錄GPS位置</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">確認收餐</CardTitle>
          <CardDescription className="text-center">
            請確認以下送餐資訊無誤後，點擊確認按鈕
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm text-gray-500">送餐編號</p>
              <p className="font-semibold text-lg">{delivery.deliveryNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">收餐人</p>
              <p className="font-semibold">{delivery.recipientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">聯絡電話</p>
              <p className="font-semibold">{delivery.recipientPhone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">送餐地址</p>
              <p className="font-semibold">{delivery.deliveryAddress}</p>
            </div>
            {delivery.notes && (
              <div>
                <p className="text-sm text-gray-500">備註</p>
                <p className="text-sm">{delivery.notes}</p>
              </div>
            )}
          </div>

          {/* 驗證序號輸入 */}
          <div className="space-y-2">
            <Label htmlFor="verificationCode" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              驗證序號
            </Label>
            <Input
              id="verificationCode"
              type="text"
              placeholder="請輸入6位數驗證序號"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-lg font-mono tracking-widest"
            />
            <p className="text-xs text-gray-500">
              請向送餐志工索取驗證序號，或查看簡訊通知
            </p>
          </div>

          {location && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg p-3">
              <MapPin className="h-4 w-4" />
              <span>已獲取GPS位置，將記錄送達位置</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {confirming ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                確認中...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                確認收餐
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            點擊確認按鈕即表示您已收到餐點
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
