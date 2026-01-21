import { makeRequest } from "./_core/map";

interface DeliveryPoint {
  id: number;
  address: string;
  recipientName: string;
}

interface OptimizedRoute {
  orderedPoints: DeliveryPoint[];
  totalDistance: number; // 公尺
  totalDuration: number; // 秒
  polyline: string; // 路徑編碼字串
}

/**
 * 使用Google Maps Directions API優化送餐路線
 * @param startPoint 起點地址（例如：台東防災館）
 * @param deliveryPoints 送餐點列表
 * @returns 優化後的路線資訊
 */
export async function optimizeDeliveryRoute(
  startPoint: string,
  deliveryPoints: DeliveryPoint[]
): Promise<OptimizedRoute> {
  if (deliveryPoints.length === 0) {
    throw new Error("送餐點列表不能為空");
  }

  // 如果只有一個點，直接返回
  if (deliveryPoints.length === 1) {
    const response: any = await makeRequest("/maps/api/directions/json", {
      origin: startPoint,
      destination: deliveryPoints[0].address,
      mode: "driving",
      language: "zh-TW",
    });

    if (response.status !== "OK" || !response.routes || response.routes.length === 0) {
      throw new Error("無法計算路線");
    }

    const route = response.routes[0];
    const leg = route.legs[0];

    return {
      orderedPoints: deliveryPoints,
      totalDistance: leg.distance.value,
      totalDuration: leg.duration.value,
      polyline: route.overview_polyline.points,
    };
  }

  // 多個點：使用waypoints並啟用optimize:true
  const waypoints = deliveryPoints.map(p => p.address);
  
  const response: any = await makeRequest("/maps/api/directions/json", {
    origin: startPoint,
    destination: startPoint, // 返回起點
    waypoints: `optimize:true|${waypoints.join("|")}`,
    mode: "driving",
    language: "zh-TW",
  });

  if (response.status !== "OK" || !response.routes || response.routes.length === 0) {
    throw new Error(`路線優化失敗：${response.status}`);
  }

  const route = response.routes[0];
  
  // waypoint_order 包含優化後的順序
  const optimizedOrder = route.waypoint_order || [];
  
  // 根據優化順序重新排列送餐點
  const orderedPoints = optimizedOrder.map((index: number) => deliveryPoints[index]);

  // 計算總距離和時間
  let totalDistance = 0;
  let totalDuration = 0;

  for (const leg of route.legs) {
    totalDistance += leg.distance.value;
    totalDuration += leg.duration.value;
  }

  return {
    orderedPoints,
    totalDistance,
    totalDuration,
    polyline: route.overview_polyline.points,
  };
}

/**
 * 批量優化多條路線（為多位志工規劃路線）
 * @param startPoint 起點地址
 * @param allDeliveryPoints 所有送餐點
 * @param pointsPerRoute 每條路線的點數（預設7）
 * @returns 多條優化後的路線
 */
export async function optimizeMultipleRoutes(
  startPoint: string,
  allDeliveryPoints: DeliveryPoint[],
  pointsPerRoute: number = 7
): Promise<OptimizedRoute[]> {
  const routes: OptimizedRoute[] = [];
  
  // 將送餐點分組
  for (let i = 0; i < allDeliveryPoints.length; i += pointsPerRoute) {
    const batch = allDeliveryPoints.slice(i, i + pointsPerRoute);
    
    try {
      const optimizedRoute = await optimizeDeliveryRoute(startPoint, batch);
      routes.push(optimizedRoute);
    } catch (error) {
      console.error(`路線 ${i / pointsPerRoute + 1} 優化失敗:`, error);
      // 失敗時使用原始順序
      routes.push({
        orderedPoints: batch,
        totalDistance: 0,
        totalDuration: 0,
        polyline: "",
      });
    }
    
    // 避免API速率限制，每次請求間隔200ms
    if (i + pointsPerRoute < allDeliveryPoints.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return routes;
}

/**
 * 格式化距離（公尺轉公里）
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} 公尺`;
  }
  return `${(meters / 1000).toFixed(1)} 公里`;
}

/**
 * 格式化時間（秒轉分鐘）
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} 分鐘`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} 小時 ${remainingMinutes} 分鐘`;
}
