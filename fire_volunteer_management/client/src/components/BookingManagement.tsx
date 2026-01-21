import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  Pencil,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
} from "lucide-react";

type BookingType = "individual" | "group";
type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

interface Booking {
  id: number;
  bookingNumber: string;
  type: BookingType;
  contactName: string;
  contactPhone: string;
  contactEmail?: string | null;
  organizationName?: string | null;
  numberOfPeople: number;
  visitDate: Date | string;
  visitTime: string;
  purpose?: string | null;
  specialNeeds?: string | null;
  status: BookingStatus;
  createdAt: Date | string;
}

export function BookingManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // 編輯表單狀態
  const [editForm, setEditForm] = useState({
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    numberOfPeople: 0,
    visitTime: "",
    purpose: "",
    specialNeeds: "",
    status: "pending" as BookingStatus,
    organizationName: "",
  });

  const { data: bookings, refetch } = trpc.bookings.getAll.useQuery();

  const updateBooking = trpc.bookings.update.useMutation({
    onSuccess: () => {
      toast.success("預約已更新");
      refetch();
      setEditDialogOpen(false);
      setSelectedBooking(null);
    },
    onError: error => {
      toast.error("更新失敗", { description: error.message });
    },
  });

  const deleteBooking = trpc.bookings.delete.useMutation({
    onSuccess: () => {
      toast.success("預約已刪除");
      refetch();
      setDeleteDialogOpen(false);
      setSelectedBooking(null);
    },
    onError: error => {
      toast.error("刪除失敗", { description: error.message });
    },
  });

  const updateStatus = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("狀態已更新");
      refetch();
    },
    onError: error => {
      toast.error("更新失敗", { description: error.message });
    },
  });

  // 篩選預約
  const filteredBookings =
    bookings?.filter((booking: Booking) => {
      // 類型篩選
      if (filterType !== "all" && booking.type !== filterType) return false;
      // 狀態篩選
      if (filterStatus !== "all" && booking.status !== filterStatus)
        return false;
      // 搜尋篩選
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          booking.bookingNumber.toLowerCase().includes(search) ||
          booking.contactName.toLowerCase().includes(search) ||
          booking.contactPhone.includes(search) ||
          (booking.organizationName?.toLowerCase().includes(search) ?? false)
        );
      }
      return true;
    }) || [];

  const handleEdit = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditForm({
      contactName: booking.contactName,
      contactPhone: booking.contactPhone,
      contactEmail: booking.contactEmail || "",
      numberOfPeople: booking.numberOfPeople,
      visitTime: booking.visitTime,
      purpose: booking.purpose || "",
      specialNeeds: booking.specialNeeds || "",
      status: booking.status,
      organizationName: booking.organizationName || "",
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (booking: Booking) => {
    setSelectedBooking(booking);
    setDeleteDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedBooking) return;
    updateBooking.mutate({
      id: selectedBooking.id,
      type: selectedBooking.type,
      ...editForm,
    });
  };

  const handleConfirmDelete = () => {
    if (!selectedBooking) return;
    deleteBooking.mutate({
      id: selectedBooking.id,
      type: selectedBooking.type,
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };
    const labels: Record<string, string> = {
      pending: "待確認",
      confirmed: "已確認",
      cancelled: "已取消",
      completed: "已完成",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || ""}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === "group" ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        團體
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        個人
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          預約紀錄管理
        </CardTitle>
        <CardDescription>查看、編輯、刪除所有預約紀錄</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 篩選工具列 */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋預約編號、聯絡人、電話..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部類型</SelectItem>
                <SelectItem value="individual">個人預約</SelectItem>
                <SelectItem value="group">團體預約</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="pending">待確認</SelectItem>
                <SelectItem value="confirmed">已確認</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto text-sm text-muted-foreground">
            共 {filteredBookings.length} 筆預約
          </div>
        </div>

        {/* 預約列表表格 */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>預約編號</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>聯絡人</TableHead>
                <TableHead>電話</TableHead>
                <TableHead>參訪日期</TableHead>
                <TableHead>時段</TableHead>
                <TableHead>人數</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    沒有符合條件的預約紀錄
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking: Booking) => (
                  <TableRow key={`${booking.type}-${booking.id}`}>
                    <TableCell className="font-mono text-sm">
                      {booking.bookingNumber}
                    </TableCell>
                    <TableCell>{getTypeBadge(booking.type)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.contactName}</div>
                        {booking.organizationName && (
                          <div className="text-xs text-muted-foreground">
                            {booking.organizationName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{booking.contactPhone}</TableCell>
                    <TableCell>
                      {format(new Date(booking.visitDate), "yyyy/MM/dd (E)", {
                        locale: zhTW,
                      })}
                    </TableCell>
                    <TableCell>{booking.visitTime}</TableCell>
                    <TableCell>{booking.numberOfPeople} 人</TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isAdmin && booking.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              onClick={() =>
                                updateStatus.mutate({
                                  id: booking.id,
                                  status: "confirmed",
                                  type: booking.type,
                                })
                              }
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              onClick={() =>
                                updateStatus.mutate({
                                  id: booking.id,
                                  status: "cancelled",
                                  type: booking.type,
                                })
                              }
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        {isAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              onClick={() => handleEdit(booking)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(booking)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {!isAdmin && (
                          <span className="text-xs text-muted-foreground px-2">
                            僅查看
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 編輯對話框 */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>編輯預約</DialogTitle>
              <DialogDescription>
                預約編號：{selectedBooking?.bookingNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">聯絡人姓名</Label>
                  <Input
                    id="contactName"
                    value={editForm.contactName}
                    onChange={e =>
                      setEditForm({ ...editForm, contactName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">聯絡電話</Label>
                  <Input
                    id="contactPhone"
                    value={editForm.contactPhone}
                    onChange={e =>
                      setEditForm({ ...editForm, contactPhone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={editForm.contactEmail}
                    onChange={e =>
                      setEditForm({ ...editForm, contactEmail: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfPeople">人數</Label>
                  <Input
                    id="numberOfPeople"
                    type="number"
                    value={editForm.numberOfPeople}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        numberOfPeople: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              {selectedBooking?.type === "group" && (
                <div className="space-y-2">
                  <Label htmlFor="organizationName">團體名稱</Label>
                  <Input
                    id="organizationName"
                    value={editForm.organizationName}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        organizationName: e.target.value,
                      })
                    }
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visitTime">參訪時段</Label>
                  <Select
                    value={editForm.visitTime}
                    onValueChange={value =>
                      setEditForm({ ...editForm, visitTime: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇時段" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00-10:00">09:00-10:00</SelectItem>
                      <SelectItem value="10:00-11:00">10:00-11:00</SelectItem>
                      <SelectItem value="11:00-12:00">11:00-12:00</SelectItem>
                      <SelectItem value="14:00-15:00">14:00-15:00</SelectItem>
                      <SelectItem value="15:00-16:00">15:00-16:00</SelectItem>
                      <SelectItem value="16:00-17:00">16:00-17:00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">狀態</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={value =>
                      setEditForm({
                        ...editForm,
                        status: value as BookingStatus,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇狀態" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">待確認</SelectItem>
                      <SelectItem value="confirmed">已確認</SelectItem>
                      <SelectItem value="cancelled">已取消</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">參訪目的</Label>
                <Textarea
                  id="purpose"
                  value={editForm.purpose}
                  onChange={e =>
                    setEditForm({ ...editForm, purpose: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialNeeds">特殊需求</Label>
                <Textarea
                  id="specialNeeds"
                  value={editForm.specialNeeds}
                  onChange={e =>
                    setEditForm({ ...editForm, specialNeeds: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateBooking.isPending}
              >
                {updateBooking.isPending ? "儲存中..." : "儲存變更"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 刪除確認對話框 */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確認刪除預約？</AlertDialogTitle>
              <AlertDialogDescription>
                您即將刪除預約編號{" "}
                <span className="font-mono font-bold">
                  {selectedBooking?.bookingNumber}
                </span>
                。
                <br />
                此操作無法復原，預約紀錄將永久刪除。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteBooking.isPending ? "刪除中..." : "確認刪除"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
