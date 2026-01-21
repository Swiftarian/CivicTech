import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  AlertCircle,
} from "lucide-react";

export default function VolunteerPerformanceDashboard() {
  const { data: performanceData, isLoading } = trpc.volunteers.getAllPerformance.useQuery();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  if (!performanceData || performanceData.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">尚無志工績效數據</p>
            <p className="text-sm text-muted-foreground mt-2">請先建立志工和送餐任務</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 計算總體統計
  const totalVolunteers = performanceData.length;
  const totalDeliveries = performanceData.reduce((sum, v) => sum + (v.totalDeliveries || 0), 0);
  const avgDeliveryTime = Math.round(
    performanceData.reduce((sum, v) => sum + (v.avgDeliveryTime || 0), 0) / totalVolunteers
  );
  const avgOnTimeRate = Math.round(
    performanceData.reduce((sum, v) => sum + (v.onTimeRate || 0), 0) / totalVolunteers
  );

  // 準備圖表數據
  const topPerformers = [...performanceData]
    .sort((a, b) => (b.totalDeliveries || 0) - (a.totalDeliveries || 0))
    .slice(0, 10)
    .map((v) => ({
      name: v.name || `志工${v.id}`,
      送餐次數: v.totalDeliveries || 0,
      準時率: v.onTimeRate || 0,
    }));

  const deliveryTimeData = [...performanceData]
    .sort((a, b) => (a.avgDeliveryTime || 0) - (b.avgDeliveryTime || 0))
    .slice(0, 10)
    .map((v) => ({
      name: v.name || `志工${v.id}`,
      平均配送時間: v.avgDeliveryTime || 0,
    }));

  // 準時率分布數據
  const onTimeRateDistribution = [
    {
      name: "90%以上",
      value: performanceData.filter((v) => (v.onTimeRate || 0) >= 90).length,
      color: "#22c55e",
    },
    {
      name: "70-90%",
      value: performanceData.filter((v) => (v.onTimeRate || 0) >= 70 && (v.onTimeRate || 0) < 90).length,
      color: "#eab308",
    },
    {
      name: "50-70%",
      value: performanceData.filter((v) => (v.onTimeRate || 0) >= 50 && (v.onTimeRate || 0) < 70).length,
      color: "#f97316",
    },
    {
      name: "50%以下",
      value: performanceData.filter((v) => (v.onTimeRate || 0) < 50).length,
      color: "#ef4444",
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* 標題 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">志工配送績效分析</h1>
        <p className="text-muted-foreground">
          追蹤志工送餐表現，優化配送效率
        </p>
      </div>

      {/* 總體統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">志工總數</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVolunteers}</div>
            <p className="text-xs text-muted-foreground">活躍送餐志工</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總送餐次數</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeliveries}</div>
            <p className="text-xs text-muted-foreground">累計配送任務</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均配送時間</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDeliveryTime} 分鐘</div>
            <p className="text-xs text-muted-foreground">從出發到送達</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均準時率</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOnTimeRate}%</div>
            <p className="text-xs text-muted-foreground">準時送達比例</p>
          </CardContent>
        </Card>
      </div>

      {/* 圖表區域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 送餐次數排行榜 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              送餐次數排行榜 (Top 10)
            </CardTitle>
            <CardDescription>志工送餐任務完成數量</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPerformers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="送餐次數" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 準時率排行榜 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              準時率表現 (Top 10)
            </CardTitle>
            <CardDescription>志工準時送達比例</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPerformers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="準時率" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 平均配送時間 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              平均配送時間 (Top 10)
            </CardTitle>
            <CardDescription>志工平均配送效率（分鐘）</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={deliveryTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="平均配送時間" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 準時率分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              準時率分布
            </CardTitle>
            <CardDescription>志工準時率區間分布</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={onTimeRateDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}人`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {onTimeRateDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 詳細志工列表 */}
      <Card>
        <CardHeader>
          <CardTitle>志工績效詳細列表</CardTitle>
          <CardDescription>所有志工的完整績效數據</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">志工姓名</th>
                  <th className="text-right p-2">送餐次數</th>
                  <th className="text-right p-2">完成次數</th>
                  <th className="text-right p-2">平均配送時間</th>
                  <th className="text-right p-2">準時率</th>
                  <th className="text-center p-2">狀態</th>
                </tr>
              </thead>
              <tbody>
                {[...performanceData]
                  .sort((a, b) => (b.totalDeliveries || 0) - (a.totalDeliveries || 0))
                  .map((volunteer) => (
                    <tr key={volunteer.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{volunteer.name || `志工${volunteer.id}`}</td>
                      <td className="text-right p-2">{volunteer.totalDeliveries || 0}</td>
                      <td className="text-right p-2">{volunteer.completedDeliveries || 0}</td>
                      <td className="text-right p-2">{volunteer.avgDeliveryTime || 0} 分鐘</td>
                      <td className="text-right p-2">{volunteer.onTimeRate || 0}%</td>
                      <td className="text-center p-2">
                        {(volunteer.onTimeRate || 0) >= 90 ? (
                          <Badge variant="default" className="bg-green-500">優秀</Badge>
                        ) : (volunteer.onTimeRate || 0) >= 70 ? (
                          <Badge variant="default" className="bg-yellow-500">良好</Badge>
                        ) : (volunteer.onTimeRate || 0) >= 50 ? (
                          <Badge variant="default" className="bg-orange-500">普通</Badge>
                        ) : (
                          <Badge variant="destructive">需改進</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
