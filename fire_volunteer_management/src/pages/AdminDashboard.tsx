import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AddVolunteerDialog } from "@/components/AddVolunteerDialog";
import { ImportVolunteersDialog } from "@/components/ImportVolunteersDialog";
import { EditVolunteerDialog } from "@/components/EditVolunteerDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  TrendingUp
} from "lucide-react";
import { NotificationList } from "@/components/NotificationList";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<any>(null);
  const [deletingVolunteerId, setDeletingVolunteerId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
      toast.error("需要管理員權限");
      setLocation("/");
    }
  }, [isAuthenticated, user, loading, setLocation]);

  const { data: bookings, refetch: refetchBookings } = trpc.bookings.getAll.useQuery();
  const { data: cases } = trpc.cases.getAll.useQuery();
  const { data: deliveries } = trpc.mealDeliveries.getAll.useQuery();
  const { data: volunteers, refetch: refetchVolunteers } = trpc.volunteers.getAll.useQuery();
  const { data: leaveRequests } = trpc.leaveRequests.getPending.useQuery();

  const deleteVolunteer = trpc.volunteers.delete.useMutation({
    onSuccess: () => {
      toast.success("志工已刪除");
      refetchVolunteers();
      setDeleteDialogOpen(false);
      setDeletingVolunteerId(null);
    },
    onError: (error) => {
      toast.error("刪除失敗", { description: error.message });
    },
  });

  const updateBookingStatus = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("預約狀態已更新");
      refetchBookings();
    },
    onError: (error) => {
      toast.error("更新失敗", { description: error.message });
    }
  });

  const approveLeaveRequest = trpc.leaveRequests.approve.useMutation({
    onSuccess: () => {
      toast.success("已核准請假/換班申請");
    }
  });

  const rejectLeaveRequest = trpc.leaveRequests.reject.useMutation({
    onSuccess: () => {
      toast.success("已拒絕請假/換班申請");
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const stats = {
    totalBookings: bookings?.length || 0,
    pendingBookings: bookings?.filter(b => b.status === 'pending').length || 0,
    totalCases: cases?.length || 0,
    pendingCases: cases?.filter(c => c.status === 'submitted' || c.status === 'reviewing').length || 0,
    totalDeliveries: deliveries?.length || 0,
    activeDeliveries: deliveries?.filter(d => d.status === 'in_transit').length || 0,
    totalVolunteers: volunteers?.length || 0,
    pendingLeaveRequests: leaveRequests?.length || 0
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "badge-pending",
      confirmed: "badge-confirmed",
      cancelled: "badge-cancelled",
      completed: "badge-completed"
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
              <span className="text-sm">歡迎，{user?.name}</span>
              <Link href="/">
                <Button variant="secondary" size="sm">返回首頁</Button>
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
              <CardTitle className="text-sm font-medium">總案件數</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCases}</div>
              <p className="text-xs text-muted-foreground">
                待處理：{stats.pendingCases}
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

        {/* 主要內容區域 */}
        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bookings">預約管理</TabsTrigger>
            <TabsTrigger value="cases">案件管理</TabsTrigger>
            <TabsTrigger value="deliveries">送餐服務</TabsTrigger>
            <TabsTrigger value="volunteers">志工管理</TabsTrigger>
            <TabsTrigger value="leave-requests">請假審核</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>預約列表</CardTitle>
                <CardDescription>管理所有預約記錄</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>預約編號</TableHead>
                      <TableHead>類型</TableHead>
                      <TableHead>聯絡人</TableHead>
                      <TableHead>參訪日期</TableHead>
                      <TableHead>人數</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings?.slice(0, 10).map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.bookingNumber}</TableCell>
                        <TableCell>{booking.type === 'group' ? '團體' : '個人'}</TableCell>
                        <TableCell>{booking.contactName}</TableCell>
                        <TableCell>
                          {format(new Date(booking.visitDate), "PPP", { locale: zhTW })}
                        </TableCell>
                        <TableCell>{booking.numberOfPeople}</TableCell>
                        <TableCell>
                          <span className={`badge-status ${getStatusBadge(booking.status)}`}>
                            {booking.status === 'pending' ? '待確認' :
                             booking.status === 'confirmed' ? '已確認' :
                             booking.status === 'cancelled' ? '已取消' : '已完成'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {booking.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateBookingStatus.mutate({ 
                                  id: booking.id, 
                                  status: 'confirmed' 
                                })}
                              >
                                確認
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateBookingStatus.mutate({ 
                                  id: booking.id, 
                                  status: 'cancelled' 
                                })}
                              >
                                取消
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cases">
            <Card>
              <CardHeader>
                <CardTitle>案件列表</CardTitle>
                <CardDescription>管理所有案件申請</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>案件編號</TableHead>
                      <TableHead>標題</TableHead>
                      <TableHead>申請人</TableHead>
                      <TableHead>類型</TableHead>
                      <TableHead>優先級</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>提交時間</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cases?.slice(0, 10).map((caseItem) => (
                      <TableRow key={caseItem.id}>
                        <TableCell className="font-medium">{caseItem.caseNumber}</TableCell>
                        <TableCell>{caseItem.title}</TableCell>
                        <TableCell>{caseItem.applicantName}</TableCell>
                        <TableCell>{caseItem.caseType}</TableCell>
                        <TableCell>
                          <span className={`badge-status ${
                            caseItem.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            caseItem.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            caseItem.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {caseItem.priority === 'urgent' ? '緊急' :
                             caseItem.priority === 'high' ? '高' :
                             caseItem.priority === 'medium' ? '中' : '低'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`badge-status ${
                            caseItem.status === 'completed' ? 'badge-completed' :
                            caseItem.status === 'processing' ? 'bg-orange-100 text-orange-800' :
                            caseItem.status === 'reviewing' ? 'badge-pending' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {caseItem.status === 'submitted' ? '已提交' :
                             caseItem.status === 'reviewing' ? '審核中' :
                             caseItem.status === 'processing' ? '處理中' :
                             caseItem.status === 'completed' ? '已完成' : '已拒絕'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {format(new Date(caseItem.createdAt), "PPP", { locale: zhTW })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
                        <CardTitle className="text-sm font-medium text-muted-foreground">待指派任務</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {deliveries?.filter((d: any) => d.status === 'pending').length || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">配送中</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {deliveries?.filter((d: any) => d.status === 'in_progress').length || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">今日完成</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {deliveries?.filter((d: any) => {
                            if (d.status !== 'completed' || !d.completedAt) return false;
                            const today = new Date();
                            const completedDate = new Date(d.completedAt);
                            return completedDate.toDateString() === today.toDateString();
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
                    <CardTitle>志工列表</CardTitle>
                    <CardDescription>管理所有志工資料</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <AddVolunteerDialog />
                    <ImportVolunteersDialog />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      <TableHead>員工編號</TableHead>
                      <TableHead>部門</TableHead>
                      <TableHead>職位</TableHead>
                      <TableHead>服務時數</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {volunteers?.map((item) => (
                      <TableRow key={item.volunteer.id}>
                        <TableCell className="font-medium">{item.user?.name || '-'}</TableCell>
                        <TableCell>{item.volunteer.employeeId || '-'}</TableCell>
                        <TableCell>{item.volunteer.department || '-'}</TableCell>
                        <TableCell>{item.volunteer.position || '-'}</TableCell>
                        <TableCell>{item.volunteer.totalHours || 0} 小時</TableCell>
                        <TableCell>
                          <span className={`badge-status ${
                            item.volunteer.status === 'active' ? 'badge-confirmed' :
                            item.volunteer.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            'badge-pending'
                          }`}>
                            {item.volunteer.status === 'active' ? '在職' :
                             item.volunteer.status === 'inactive' ? '離職' : '請假中'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingVolunteer(item.volunteer);
                                setEditDialogOpen(true);
                              }}
                            >
                              編輯
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setDeletingVolunteerId(item.volunteer.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              刪除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                    {leaveRequests.map((item) => (
                      <Card key={item.request.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{item.user?.name}</span>
                                <span className={`badge-status ${
                                  item.request.type === 'leave' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {item.request.type === 'leave' ? '請假' : '換班'}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                原因：{item.request.reason}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                申請時間：{format(new Date(item.request.createdAt), "PPP HH:mm", { locale: zhTW })}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => approveLeaveRequest.mutate({ id: item.request.id })}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                核准
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectLeaveRequest.mutate({ id: item.request.id })}
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
                  <p className="text-muted-foreground text-center py-8">目前沒有待審核的申請</p>
                )}
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
