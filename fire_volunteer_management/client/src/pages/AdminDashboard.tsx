import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AddVolunteerDialog } from "@/components/AddVolunteerDialog";
import { ImportVolunteersDialog } from "@/components/ImportVolunteersDialog";
import { EditVolunteerDialog } from "@/components/EditVolunteerDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  Users,
  Calendar,
  FileText,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { NotificationList } from "@/components/NotificationList";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import VolunteerDeliveryContent from "./VolunteerDeliveryContent";
import { BookingManagement } from "@/components/BookingManagement";
import { VolunteerDeliveryStatsSection } from "@/components/VolunteerDeliveryStatsSection";
import { VolunteerManagementByCategory } from "@/components/VolunteerManagementByCategory";

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<any>(null);
  const [deletingVolunteerId, setDeletingVolunteerId] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (
      !loading &&
      (!isAuthenticated ||
        (user?.role !== "admin" && user?.role !== "volunteer"))
    ) {
      toast.error("需要管理員或義工權限");
      setLocation("/");
    }
  }, [isAuthenticated, user, loading, setLocation]);

  const { data: bookings, refetch: refetchBookings } =
    trpc.bookings.getAll.useQuery();
  const { data: deliveries } = trpc.mealDeliveries.getAll.useQuery();
  const { data: volunteers, refetch: refetchVolunteers } =
    trpc.volunteers.getAll.useQuery();
  const { data: leaveRequests } = trpc.leaveRequests.getPending.useQuery();

  const deleteVolunteer = trpc.volunteers.delete.useMutation({
    onSuccess: () => {
      toast.success("志工已刪除");
      refetchVolunteers();
      setDeleteDialogOpen(false);
      setDeletingVolunteerId(null);
    },
    onError: error => {
      toast.error("刪除失敗", { description: error.message });
    },
  });

  const updateBookingStatus = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("預約狀態已更新");
      refetchBookings();
    },
    onError: error => {
      toast.error("更新失敗", { description: error.message });
    },
  });

  const approveLeaveRequest = trpc.leaveRequests.approve.useMutation({
    onSuccess: () => {
      toast.success("已核准請假/換班申請");
    },
  });

  const rejectLeaveRequest = trpc.leaveRequests.reject.useMutation({
    onSuccess: () => {
      toast.success("已拒絕請假/換班申請");
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (
    !isAuthenticated ||
    (user?.role !== "admin" && user?.role !== "volunteer")
  ) {
    return null;
  }

  const stats = {
    totalBookings: bookings?.length || 0,
    pendingBookings: bookings?.filter(b => b.status === "pending").length || 0,
    totalDeliveries: deliveries?.length || 0,
    activeDeliveries:
      deliveries?.filter(d => d.status === "in_transit").length || 0,
    totalVolunteers: volunteers?.length || 0,
    pendingLeaveRequests: leaveRequests?.length || 0,
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "badge-pending",
      confirmed: "badge-confirmed",
      cancelled: "badge-cancelled",
      completed: "badge-completed",
    };
    return statusMap[status] || "badge-status";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 頂部導覽 */}
      <nav className="bg-primary text-primary-foreground shadow-lg">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">管理員後台</h1>
            <div className="flex items-center gap-4">
              <NotificationList />
              <Link href="/admin/news">
                <Button variant="secondary" size="sm">
                  最新消息
                </Button>
              </Link>
              <Link href="/admin/gallery">
                <Button variant="secondary" size="sm">
                  服務花絮
                </Button>
              </Link>
              <span className="text-sm">歡迎，{user?.name}</span>
              <Link href="/">
                <Button variant="secondary" size="sm">
                  返回首頁
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        {/* 統計卡片 */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">總預約數</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                待確認：{stats.pendingBookings}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">送餐任務</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
              <p className="text-xs text-muted-foreground">
                進行中：{stats.activeDeliveries}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">志工人數</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVolunteers}</div>
              <p className="text-xs text-muted-foreground">
                待審核請假：{stats.pendingLeaveRequests}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 志工送餐統計（僅管理員可見） */}
        {user?.role === "admin" && <VolunteerDeliveryStatsSection />}

        {/* 主要內容區域 */}
        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bookings">預約管理</TabsTrigger>
            <TabsTrigger value="deliveries">送餐服務</TabsTrigger>
            {user?.role === "admin" && (
              <TabsTrigger value="volunteers">志工管理</TabsTrigger>
            )}
            <TabsTrigger value="leave-requests">請假審核</TabsTrigger>
            <TabsTrigger value="volunteer-delivery">志工送餐</TabsTrigger>
            {user?.role === "admin" && (
              <TabsTrigger value="home-content">首頁內容</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="bookings">
            <BookingManagement />
          </TabsContent>

          <TabsContent value="deliveries">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>送餐任務列表</CardTitle>
                    <CardDescription>管理所有送餐服務</CardDescription>
                  </div>
                  <Link href="/meal-delivery">
                    <Button>前往送餐服務管理</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          待指派任務
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {deliveries?.filter(
                            (d: any) => d.status === "pending"
                          ).length || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          配送中
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {deliveries?.filter(
                            (d: any) => d.status === "in_progress"
                          ).length || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          今日完成
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {deliveries?.filter((d: any) => {
                            if (d.status !== "completed" || !d.completedAt)
                              return false;
                            const today = new Date();
                            const completedDate = new Date(d.completedAt);
                            return (
                              completedDate.toDateString() ===
                              today.toDateString()
                            );
                          }).length || 0}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    點擊「前往送餐服務管理」按鈕以查看完整的送餐任務列表、建立新任務和指派志工。
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="volunteers">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>志工管理</CardTitle>
                    <CardDescription>
                      按分類管理導覽館志工和送餐志工
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <AddVolunteerDialog />
                    <ImportVolunteersDialog />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <VolunteerManagementByCategory
                  volunteers={volunteers || []}
                  onEdit={volunteer => {
                    setEditingVolunteer(volunteer);
                    setEditDialogOpen(true);
                  }}
                  onDelete={volunteerId => {
                    setDeletingVolunteerId(volunteerId);
                    setDeleteDialogOpen(true);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave-requests">
            <Card>
              <CardHeader>
                <CardTitle>請假/換班審核</CardTitle>
                <CardDescription>待審核的請假與換班申請</CardDescription>
              </CardHeader>
              <CardContent>
                {leaveRequests && leaveRequests.length > 0 ? (
                  <div className="space-y-4">
                    {leaveRequests.map(item => (
                      <Card key={item.request.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {item.user?.name}
                                </span>
                                <span
                                  className={`badge-status ${
                                    item.request.type === "leave"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {item.request.type === "leave"
                                    ? "請假"
                                    : "換班"}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                原因：{item.request.reason}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                申請時間：
                                {format(
                                  new Date(item.request.createdAt),
                                  "PPP HH:mm",
                                  { locale: zhTW }
                                )}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  approveLeaveRequest.mutate({
                                    id: item.request.id,
                                  })
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                核准
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  rejectLeaveRequest.mutate({
                                    id: item.request.id,
                                  })
                                }
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                拒絕
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    目前沒有待審核的申請
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="volunteer-delivery">
            <VolunteerDeliveryContent />
          </TabsContent>

          <TabsContent value="home-content">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>首頁內容管理</CardTitle>
                    <CardDescription>
                      編輯首頁的文字內容和輪播照片
                    </CardDescription>
                  </div>
                  <Link href="/admin/home-content">
                    <Button>前往首頁內容管理</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  點擊上方按鈕前往首頁內容管理頁面，編輯「關於臺東災害警覺教育館」的介紹文字和輪播照片。
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 編輯志工對話框 */}
      {editingVolunteer && (
        <EditVolunteerDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          volunteer={editingVolunteer}
          onSuccess={() => {
            refetchVolunteers();
            setEditingVolunteer(null);
          }}
        />
      )}

      {/* 刪除確認對話框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除志工</AlertDialogTitle>
            <AlertDialogDescription>
              此操作將永久刪除此志工及其相關的所有記錄（排班、打卡、請假等）。此操作無法復原，請確認是否繼續？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingVolunteerId) {
                  deleteVolunteer.mutate({ id: deletingVolunteerId });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
