import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/Map";
import { MapPin, Navigation, Clock, User, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function DeliveryTracking() {
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 查詢進行中的送餐任務
  const { data: deliveries, refetch: refetchDeliveries } = trpc.mealDeliveries.getAll.useQuery(undefined, {
    refetchInterval: autoRefresh ? 10000 : false, // 每10秒自動刷新
  });

  // 查詢選中任務的路徑追蹤資料
  const { data: trackingData, refetch: refetchTracking } = trpc.mealDeliveries.getTracking.useQuery(
    { deliveryId: selectedDeliveryId! },
    { enabled: !!selectedDeliveryId, refetchInterval: autoRefresh ? 5000 : false }
  );

  const { data: volunteers } = trpc.volunteers.getAll.useQuery();

  // 當選擇任務或追蹤資料更新時，更新地圖
  useEffect(() => {
    if (!map || !trackingData || trackingData.length === 0) return;

    // 清除舊的標記和路徑
    markers.forEach(marker => marker.setMap(null));
    if (polyline) polyline.setMap(null);

    // 建立路徑點
    const path = trackingData.map(point => ({
      lat: parseFloat(point.latitude),
      lng: parseFloat(point.longitude),
    }));

    // 繪製路徑線
    const newPolyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#16a34a",
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map,
    });
    setPolyline(newPolyline);

    // 建立標記
    const newMarkers: google.maps.Marker[] = [];

    // 起點標記（綠色）
    if (path.length > 0) {
      const startMarker = new google.maps.Marker({
        position: path[0],
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#16a34a",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        title: "起點",
      });
      newMarkers.push(startMarker);
    }

    // 當前位置標記（藍色，較大）
    if (path.length > 0) {
      const currentMarker = new google.maps.Marker({
        position: path[path.length - 1],
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        title: "當前位置",
        animation: google.maps.Animation.BOUNCE,
      });
      newMarkers.push(currentMarker);

      // 顯示最新位置的資訊視窗
      const latestPoint = trackingData[trackingData.length - 1];
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">當前位置</h3>
            <p style="margin: 2px 0; font-size: 12px;">時間：${format(new Date(latestPoint.timestamp), "HH:mm:ss")}</p>
            ${latestPoint.speed ? `<p style="margin: 2px 0; font-size: 12px;">速度：${latestPoint.speed} km/h</p>` : ""}
            ${latestPoint.accuracy ? `<p style="margin: 2px 0; font-size: 12px;">精確度：${latestPoint.accuracy} m</p>` : ""}
          </div>
        `,
      });
      infoWindow.open(map, currentMarker);
    }

    setMarkers(newMarkers);

    // 調整地圖視野以顯示完整路徑
    if (path.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      map.fitBounds(bounds);
    }
  }, [map, trackingData]);

  const handleMapReady = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    // 設定初始中心點（台東防災館）
    mapInstance.setCenter({ lat: 22.7539, lng: 121.1451 });
    mapInstance.setZoom(13);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "待指派", variant: "secondary" },
      assigned: { label: "已指派", variant: "default" },
      in_transit: { label: "配送中", variant: "default" },
      delivered: { label: "已送達", variant: "outline" },
      cancelled: { label: "已取消", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const activeDeliveries = deliveries?.filter(d => 
    d.status === "in_transit" || d.status === "assigned"
  ) || [];

  const selectedDelivery = deliveries?.find(d => d.id === selectedDeliveryId);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">送餐路徑追蹤</h1>
        <p className="text-muted-foreground">即時追蹤志工送餐位置與歷史路徑</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左側：任務列表 */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">進行中的任務</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    refetchDeliveries();
                    if (selectedDeliveryId) refetchTracking();
                    toast.success("已刷新資料");
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeDeliveries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Navigation className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>目前沒有進行中的送餐任務</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeDeliveries.map(delivery => {
                    const volunteer = volunteers?.find(v => v.volunteer.id === delivery.volunteerId);
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
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{delivery.deliveryAddress}</span>
                            </div>
                            {volunteer && (
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                <span>{volunteer.user?.name || "志工"}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(new Date(delivery.deliveryDate), "MM/dd")} {delivery.deliveryTime}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded"
                  />
                  <span>自動刷新</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* 追蹤資訊 */}
          {selectedDelivery && trackingData && trackingData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">追蹤資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">總追蹤點數：</span>
                  <span className="font-semibold">{trackingData.length} 個</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最後更新：</span>
                  <span className="font-semibold">
                    {format(new Date(trackingData[trackingData.length - 1].timestamp), "HH:mm:ss")}
                  </span>
                </div>
                {trackingData[trackingData.length - 1].speed && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">當前速度：</span>
                    <span className="font-semibold">{trackingData[trackingData.length - 1].speed} km/h</span>
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
              <p>請從左側選擇一個送餐任務以查看路徑追蹤</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
