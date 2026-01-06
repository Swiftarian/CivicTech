import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapView } from "@/components/Map";
import { toast } from "sonner";
import {
  Navigation,
  MapPin,
  Clock,
  Phone,
  PlayCircle,
  StopCircle,
  CheckCircle,
  AlertCircle,
  QrCode,
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function VolunteerDelivery() {
  const { user } = useAuth();
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showQRCodeDialog, setShowQRCodeDialog] = useState(false);
  const [qrCodeData, setQRCodeData] = useState<{ qrCodeDataUrl: string; confirmUrl: string } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [currentMarker, setCurrentMarker] = useState<google.maps.Marker | null>(null);
  const trackingIntervalRef = useRef<number | null>(null);

  const { data: deliveries, refetch } = trpc.mealDeliveries.getAll.useQuery();
  
  const handleShowQRCode = async () => {
    if (!selectedDeliveryId) return;
    try {
      const utils = trpc.useUtils();
      const data = await utils.mealDeliveries.getQRCode.fetch({ deliveryId: selectedDeliveryId });
      setQRCodeData(data);
      setShowQRCodeDialog(true);
    } catch (error) {
      toast.error("無法生成QR Code");
    }
  };
  const addTrackingMutation = trpc.mealDeliveries.addTracking.useMutation();
  const startMutation = trpc.mealDeliveries.start.useMutation({
    onSuccess: () => {
      toast.success("已開始配送");
      refetch();
    },
  });

  const completeMutation = trpc.mealDeliveries.complete.useMutation({
    onSuccess: () => {
      toast.success("送餐任務已完成！");
      refetch();
    },
  });

  // 志工的任務（已指派給該志工的任務）
  const myDeliveries = deliveries?.filter(d => {
    // 這裡需要根據實際的志工ID匹配邏輯
    // 假設志工表中有userId欄位關聯到user.id
    return d.status === "assigned" || d.status === "in_transit";
  }) || [];

  const selectedDelivery = deliveries?.find(d => d.id === selectedDeliveryId);

  // GPS追蹤功能
  const startTracking = () => {
    if (!selectedDeliveryId) {
      toast.error("請先選擇送餐任務");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("您的瀏覽器不支援GPS定位功能");
      return;
    }

    // 更新任務狀態為配送中
    startMutation.mutate({
      deliveryId: selectedDeliveryId,
    });

    setIsTracking(true);
    toast.success("開始追蹤GPS位置");

    // 立即獲取一次位置
    uploadCurrentPosition();

    // 每30秒自動上傳一次位置
    trackingIntervalRef.current = window.setInterval(() => {
      uploadCurrentPosition();
    }, 30000);
  };

  const stopTracking = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    setIsTracking(false);
    toast.info("已停止GPS追蹤");
  };

  const uploadCurrentPosition = () => {
    if (!selectedDeliveryId) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, speed, accuracy } = position.coords;
        
        addTrackingMutation.mutate({
          deliveryId: selectedDeliveryId,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          speed: speed ? (speed * 3.6).toFixed(1) : undefined, // 轉換為 km/h
          accuracy: accuracy ? accuracy.toFixed(1) : undefined,
        });

        // 更新地圖上的當前位置標記
        if (map) {
          const pos = { lat: latitude, lng: longitude };
          
          if (currentMarker) {
            currentMarker.setPosition(pos);
          } else {
            const marker = new google.maps.Marker({
              position: pos,
              map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#3b82f6",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              },
              title: "我的位置",
            });
            setCurrentMarker(marker);
          }
          
          map.setCenter(pos);
        }

        console.log("GPS位置已上傳", { latitude, longitude, speed, accuracy });
      },
      (error) => {
        console.error("GPS定位失敗", error);
        toast.error("GPS定位失敗，請確認已開啟定位權限");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const completeDelivery = () => {
    if (!selectedDeliveryId) return;

    stopTracking();
    completeMutation.mutate({
      deliveryId: selectedDeliveryId,
    });
    setShowCompleteDialog(false);
    setSelectedDeliveryId(null);
  };

  // 清理定時器
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  const handleMapReady = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    // 設定初始中心點（台東防災館）
    mapInstance.setCenter({ lat: 22.7539, lng: 121.1451 });
    mapInstance.setZoom(14);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      assigned: { label: "待開始", variant: "secondary" },
      in_transit: { label: "配送中", variant: "default" },
      delivered: { label: "已送達", variant: "outline" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">我的送餐任務</h1>
        <p className="text-muted-foreground">開始配送並自動追蹤GPS位置</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左側：任務列表 */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">待配送任務</CardTitle>
            </CardHeader>
            <CardContent>
              {myDeliveries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Navigation className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>目前沒有待配送的任務</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myDeliveries.map(delivery => {
                    const isSelected = selectedDeliveryId === delivery.id;
                    
                    return (
                      <Card
                        key={delivery.id}
                        className={`cursor-pointer transition-all ${
                          isSelected ? "ring-2 ring-primary" : "hover:shadow-md"
                        }`}
                        onClick={() => setSelectedDeliveryId(delivery.id)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold">{delivery.recipientName}</h3>
                            {getStatusBadge(delivery.status)}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="line-clamp-2">{delivery.deliveryAddress}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span>{delivery.recipientPhone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(new Date(delivery.deliveryDate), "MM/dd")} {delivery.deliveryTime}
                              </span>
                            </div>
                          </div>
                          {delivery.specialInstructions && (
                            <div className="mt-2 p-2 bg-muted rounded text-xs">
                              <AlertCircle className="h-3 w-3 inline mr-1" />
                              {delivery.specialInstructions}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 控制面板 */}
          {selectedDelivery && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">配送控制</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isTracking ? (
                  <Button
                    onClick={startTracking}
                    className="w-full"
                    size="lg"
                    disabled={selectedDelivery.status === "delivered"}
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    開始配送
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={stopTracking}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <StopCircle className="mr-2 h-5 w-5" />
                      暫停追蹤
                    </Button>
                    <Button
                      onClick={() => setShowCompleteDialog(true)}
                      variant="default"
                      className="w-full"
                      size="lg"
                    >
                      <CheckCircle className="mr-2 h-5 w-5" />
                      完成送餐
                    </Button>
                  </>
                )}
                <Button
                  onClick={handleShowQRCode}
                  variant="outline"
                  className="w-full"
                  size="lg"
                  disabled={selectedDelivery.status === "delivered"}
                >
                  <QrCode className="mr-2 h-5 w-5" />
                  顯示收餐QR Code
                </Button>

                {isTracking && (
                  <div className="pt-3 border-t text-sm space-y-1">
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
                      <span>GPS追蹤中...</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      系統每30秒自動上傳您的位置
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右側：地圖 */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              <MapView onMapReady={handleMapReady} />
            </CardContent>
          </Card>
          
          {!selectedDeliveryId && (
            <div className="mt-4 text-center text-muted-foreground">
              <p>請從左側選擇一個送餐任務</p>
            </div>
          )}
        </div>
      </div>

      {/* 完成送餐確認對話框 */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認完成送餐</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>確定要標記此送餐任務為已完成嗎？</p>
            {selectedDelivery && (
              <div className="mt-4 p-4 bg-muted rounded">
                <p className="font-semibold">{selectedDelivery.recipientName}</p>
                <p className="text-sm text-muted-foreground">{selectedDelivery.deliveryAddress}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              取消
            </Button>
            <Button onClick={completeDelivery}>
              確認完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code顯示對話框 */}
      <Dialog open={showQRCodeDialog} onOpenChange={setShowQRCodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>收餐QR Code</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {qrCodeData ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img 
                    src={qrCodeData.qrCodeDataUrl} 
                    alt="QR Code" 
                    className="w-64 h-64"
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    請將此QR Code顯示給收餐人掃描
                  </p>
                  <p className="text-xs text-muted-foreground">
                    收餐人掃描後即可確認收餐
                  </p>
                </div>
                {/* 驗證序號顯示 */}
                {selectedDelivery?.verificationCode && (
                  <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                    <p className="text-sm font-semibold text-yellow-900 mb-2 text-center">
                      驗證序號（請告知收餐人）
                    </p>
                    <p className="text-3xl font-bold text-yellow-900 text-center tracking-wider">
                      {selectedDelivery.verificationCode}
                    </p>
                    <p className="text-xs text-yellow-700 mt-2 text-center">
                      收餐人需在確認頁面輸入此序號完成簽收
                    </p>
                  </div>
                )}
                {selectedDelivery && (
                  <div className="p-3 bg-muted rounded text-sm">
                    <p className="font-semibold">{selectedDelivery.recipientName}</p>
                    <p className="text-muted-foreground">{selectedDelivery.deliveryAddress}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">載入中...</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQRCodeDialog(false)} className="w-full">
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
