import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Utensils, Plus, MapPin, User, Calendar, Trash2 } from "lucide-react";
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
import { Link } from "wouter";
import { format } from "date-fns";
import QRCode from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MealDeliveryAdmin() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<number | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deliveryToDelete, setDeliveryToDelete] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);

  const { data: deliveries, refetch } = trpc.mealDeliveries.getAll.useQuery();
  const { data: volunteers } = trpc.volunteers.getAll.useQuery();

  const createMutation = trpc.mealDeliveries.create.useMutation({
    onSuccess: () => {
      toast.success("送餐任務建立成功");
      setShowCreateForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`建立失敗：${error.message}`);
    },
  });

  const assignMutation = trpc.mealDeliveries.assignVolunteer.useMutation({
    onSuccess: () => {
      toast.success("志工指派成功");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`指派失敗：${error.message}`);
    },
  });

  const deleteMutation = trpc.mealDeliveries.delete.useMutation({
    onSuccess: () => {
      toast.success("送餐任務已刪除");
      setDeleteDialogOpen(false);
      setDeliveryToDelete(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  const batchDeleteMutation = trpc.mealDeliveries.batchDelete.useMutation({
    onSuccess: data => {
      toast.success(`已刪除 ${data.count} 筆送餐任務`);
      setBatchDeleteDialogOpen(false);
      setSelectedIds(new Set());
      refetch();
    },
    onError: (error: any) => {
      toast.error(`批次刪除失敗：${error.message}`);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const dateTimeStr = formData.get("scheduledDate") as string;
    const dateTime = new Date(dateTimeStr);
    const timeStr = `${dateTime.getHours().toString().padStart(2, "0")}:${dateTime.getMinutes().toString().padStart(2, "0")}`;

    createMutation.mutate({
      recipientName: formData.get("recipientName") as string,
      recipientPhone: formData.get("recipientPhone") as string,
      deliveryAddress: formData.get("deliveryAddress") as string,
      deliveryDate: dateTime,
      deliveryTime: timeStr,
      mealType: (formData.get("mealType") as string) || undefined,
      specialInstructions:
        (formData.get("specialInstructions") as string) || undefined,
    });
  };

  const handleAssign = (deliveryId: number, volunteerId: number) => {
    assignMutation.mutate({ deliveryId, volunteerId });
  };

  const handleDeleteClick = (deliveryId: number) => {
    setDeliveryToDelete(deliveryId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deliveryToDelete) {
      deleteMutation.mutate({ id: deliveryToDelete });
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === deliveries?.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deliveries?.map(d => d.id) || []));
    }
  };

  const handleSelectOne = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchDeleteClick = () => {
    if (selectedIds.size > 0) {
      setBatchDeleteDialogOpen(true);
    }
  };

  const handleBatchDeleteConfirm = () => {
    if (selectedIds.size > 0) {
      batchDeleteMutation.mutate({ ids: Array.from(selectedIds) });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      pending: "secondary",
      assigned: "default",
      in_progress: "default",
      completed: "outline",
      cancelled: "destructive",
    };

    const labels: Record<string, string> = {
      pending: "待指派",
      assigned: "已指派",
      in_progress: "配送中",
      completed: "已完成",
      cancelled: "已取消",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 導覽列 */}
      <nav className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/admin"
              className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
            >
              <Utensils className="h-8 w-8" />
              <span className="text-xl font-bold">送餐服務管理</span>
            </Link>

            <div className="flex items-center space-x-6">
              <Link
                href="/admin"
                className="hover:opacity-80 transition-opacity"
              >
                返回後台
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        {/* 頁首 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">送餐服務管理</h1>
            <p className="text-muted-foreground">
              管理送餐任務、指派志工、追蹤配送進度
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            建立送餐任務
          </Button>
        </div>

        {/* 建立任務表單 */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>建立新送餐任務</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipientName">收餐人姓名</Label>
                    <Input id="recipientName" name="recipientName" required />
                  </div>
                  <div>
                    <Label htmlFor="recipientPhone">收餐人電話</Label>
                    <Input
                      id="recipientPhone"
                      name="recipientPhone"
                      type="tel"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="deliveryAddress">送餐地址</Label>
                  <Input id="deliveryAddress" name="deliveryAddress" required />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduledDate">預定送餐時間</Label>
                    <Input
                      id="scheduledDate"
                      name="scheduledDate"
                      type="datetime-local"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mealType">餐點類型</Label>
                    <Input
                      id="mealType"
                      name="mealType"
                      placeholder="例如：午餐、晚餐、特殊餐"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialInstructions">特殊說明</Label>
                  <Textarea
                    id="specialInstructions"
                    name="specialInstructions"
                    placeholder="例如：無障礙需求、飲食限制等"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "建立中..." : "建立任務"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 送餐任務列表 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">送餐任務列表</h2>
            {deliveries && deliveries.length > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedIds.size === deliveries.length ? "取消全選" : "全選"}
                </Button>
                {selectedIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDeleteClick}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    刪除已選 ({selectedIds.size})
                  </Button>
                )}
              </div>
            )}
          </div>

          {!deliveries || deliveries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>目前沒有送餐任務</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {deliveries.map((delivery: any) => (
                <Card key={delivery.id} className="hover-lift">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(delivery.id)}
                          onChange={() => handleSelectOne(delivery.id)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">
                              {delivery.recipientName}
                            </h3>
                            {getStatusBadge(delivery.status)}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{delivery.deliveryAddress}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                預定時間：
                                {format(
                                  new Date(delivery.deliveryDate),
                                  "yyyy-MM-dd"
                                )}{" "}
                                {delivery.deliveryTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Utensils className="h-4 w-4" />
                              <span>餐點類型：{delivery.mealType}</span>
                            </div>
                            {delivery.volunteerId && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>
                                  配送志工：
                                  {volunteers?.find(
                                    v => v.volunteer.id === delivery.volunteerId
                                  )?.user?.name || "未知"}
                                </span>
                              </div>
                            )}
                          </div>
                          {delivery.specialInstructions && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              特殊說明：{delivery.specialInstructions}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {delivery.status === "pending" && volunteers && (
                          <Select
                            onValueChange={value =>
                              handleAssign(delivery.id, parseInt(value))
                            }
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="指派志工" />
                            </SelectTrigger>
                            <SelectContent>
                              {volunteers.map(volunteer => (
                                <SelectItem
                                  key={volunteer.volunteer.id}
                                  value={volunteer.volunteer.id.toString()}
                                >
                                  {volunteer.user?.name || "志工"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {delivery.verificationCode && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDelivery(delivery.id);
                              setShowQRCode(true);
                            }}
                          >
                            查看 QR Code
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(delivery.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Code 對話框 */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>送餐驗證 QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {selectedDelivery && deliveries && (
              <>
                <QRCode
                  value={
                    deliveries.find((d: any) => d.id === selectedDelivery)
                      ?.verificationCode || ""
                  }
                  size={256}
                />
                <p className="text-sm text-muted-foreground text-center">
                  志工送達時掃描此 QR Code 以確認送達
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  驗證碼：
                  {
                    deliveries.find((d: any) => d.id === selectedDelivery)
                      ?.verificationCode
                  }
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除送餐任務？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。刪除後，該送餐任務的所有資料將會永久刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批次刪除確認對話框 */}
      <AlertDialog
        open={batchDeleteDialogOpen}
        onOpenChange={setBatchDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              確認批次刪除 {selectedIds.size} 筆送餐任務？
            </AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。刪除後，這些送餐任務的所有資料將會永久刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDeleteConfirm}
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
