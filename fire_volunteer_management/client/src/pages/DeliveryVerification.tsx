import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  Camera,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  Navigation,
} from "lucide-react";
import { useLocation } from "wouter";

export default function DeliveryVerification() {
  const [, params] = useRoute("/delivery-verification/:deliveryId");
  const deliveryId = params?.deliveryId ? parseInt(params.deliveryId) : null;
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<"confirm" | "report">("confirm");
  const [photo, setPhoto] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 服務回報表單狀態
  const [recipientStatus, setRecipientStatus] = useState<
    "normal" | "needs_follow_up" | "emergency"
  >("normal");
  const [mealStatus, setMealStatus] = useState<
    "delivered" | "left_at_door" | "not_home" | "refused"
  >("delivered");
  const [notes, setNotes] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: delivery } = trpc.mealDeliveries.getById.useQuery(
    { id: deliveryId! },
    { enabled: !!deliveryId }
  );

  const completeMutation = trpc.mealDeliveries.complete.useMutation({
    onSuccess: () => {
      toast.success("送餐任務已完成！");
      setLocation("/volunteer-delivery");
    },
    onError: (error: any) => {
      toast.error(`完成失敗：${error.message}`);
      setIsSubmitting(false);
    },
  });

  // 獲取當前GPS位置
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        error => {
          console.error("GPS定位失敗", error);
          toast.error("無法獲取GPS位置，請確認已開啟定位權限");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  }, []);

  // 開啟相機拍照
  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error("無法開啟相機", error);
      toast.error("無法開啟相機，請確認已授予相機權限");
      setIsCapturing(false);
    }
  };

  // 拍照
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        const imageData = canvasRef.current.toDataURL("image/jpeg");
        setPhoto(imageData);

        // 停止相機
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setIsCapturing(false);
      }
    }
  };

  // 從檔案選擇照片
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 確認送達
  const handleConfirmDelivery = () => {
    if (!currentPosition) {
      toast.error("無法獲取GPS位置，請稍後再試");
      return;
    }
    setStep("report");
  };

  // 提交服務回報
  const handleSubmitReport = () => {
    if (!currentPosition) {
      toast.error("無法獲取GPS位置");
      return;
    }

    setIsSubmitting(true);
    completeMutation.mutate({
      deliveryId: deliveryId!,
      latitude: currentPosition.lat.toString(),
      longitude: currentPosition.lng.toString(),
      photo: photo || undefined,
      recipientStatus,
      mealStatus,
      notes: notes || undefined,
    });
  };

  if (!delivery) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>載入中...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">送餐服務確認</h1>
        <p className="text-muted-foreground">
          {step === "confirm" ? "確認送達並記錄位置" : "填寫服務回報"}
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* 送餐資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>送餐資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">收餐人：</span>
              <span className="font-semibold">{delivery.recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">電話：</span>
              <span>{delivery.recipientPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">地址：</span>
              <span className="text-right">{delivery.deliveryAddress}</span>
            </div>
          </CardContent>
        </Card>

        {step === "confirm" && (
          <>
            {/* GPS 位置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  GPS 位置
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentPosition ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>已獲取GPS位置</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      緯度：{currentPosition.lat.toFixed(6)}
                      <br />
                      經度：{currentPosition.lng.toFixed(6)}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-5 w-5" />
                    <span>正在獲取GPS位置...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 拍照（可選） */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  送達照片（選填）
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!photo && !isCapturing && (
                  <div className="space-y-2">
                    <Button onClick={startCamera} className="w-full">
                      <Camera className="h-4 w-4 mr-2" />
                      開啟相機拍照
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      選擇檔案
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                )}

                {isCapturing && (
                  <div className="space-y-2">
                    <video
                      ref={videoRef}
                      className="w-full rounded-lg"
                      autoPlay
                      playsInline
                    />
                    <Button onClick={capturePhoto} className="w-full">
                      拍攝
                    </Button>
                  </div>
                )}

                {photo && (
                  <div className="space-y-2">
                    <img
                      src={photo}
                      alt="送達照片"
                      className="w-full rounded-lg"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setPhoto(null)}
                      className="w-full"
                    >
                      重新拍攝
                    </Button>
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </CardContent>
            </Card>

            {/* 確認送達按鈕 */}
            <Button
              onClick={handleConfirmDelivery}
              disabled={!currentPosition}
              className="w-full"
              size="lg"
            >
              <Navigation className="h-5 w-5 mr-2" />
              確認送達
            </Button>
          </>
        )}

        {step === "report" && (
          <>
            {/* 服務回報表單 */}
            <Card>
              <CardHeader>
                <CardTitle>服務回報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 收餐者狀況 */}
                <div className="space-y-3">
                  <Label>收餐者狀況</Label>
                  <RadioGroup
                    value={recipientStatus}
                    onValueChange={(value: any) => setRecipientStatus(value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="normal" id="normal" />
                      <Label htmlFor="normal" className="cursor-pointer">
                        狀況正常
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="needs_follow_up"
                        id="needs_follow_up"
                      />
                      <Label
                        htmlFor="needs_follow_up"
                        className="cursor-pointer"
                      >
                        需後續關懷
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="emergency" id="emergency" />
                      <Label htmlFor="emergency" className="cursor-pointer">
                        緊急狀況
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* 餐點狀態 */}
                <div className="space-y-3">
                  <Label>餐點狀態</Label>
                  <RadioGroup
                    value={mealStatus}
                    onValueChange={(value: any) => setMealStatus(value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delivered" id="delivered" />
                      <Label htmlFor="delivered" className="cursor-pointer">
                        親手交遞
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="left_at_door"
                        id="left_at_door"
                      />
                      <Label htmlFor="left_at_door" className="cursor-pointer">
                        置於門口
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="not_home" id="not_home" />
                      <Label htmlFor="not_home" className="cursor-pointer">
                        無人在家
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="refused" id="refused" />
                      <Label htmlFor="refused" className="cursor-pointer">
                        拒收
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* 備註 */}
                <div className="space-y-2">
                  <Label htmlFor="notes">備註（選填）</Label>
                  <Textarea
                    id="notes"
                    placeholder="請填寫其他需要記錄的資訊..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 提交按鈕 */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setStep("confirm")}
                className="flex-1"
                disabled={isSubmitting}
              >
                返回
              </Button>
              <Button
                onClick={handleSubmitReport}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    完成送餐
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
