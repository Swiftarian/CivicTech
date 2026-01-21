import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, QrCode, Link as LinkIcon, Unlink, Loader2 } from "lucide-react";

export default function RecipientManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isBindDialogOpen, setIsBindDialogOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<number | null>(null);
  const [lineUserId, setLineUserId] = useState("");

  // 查詢收餐人列表
  const { data: recipients, isLoading, refetch } = trpc.recipients.getAll.useQuery();

  // 查詢LINE機器人資訊
  const { data: lineBotInfo } = trpc.recipients.getLineBotInfo.useQuery();

  // 建立收餐人
  const createMutation = trpc.recipients.create.useMutation({
    onSuccess: () => {
      toast.success("收餐人建立成功");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`建立失敗：${error.message}`);
    },
  });

  // 綁定LINE
  const bindLineMutation = trpc.recipients.bindLine.useMutation({
    onSuccess: (data) => {
      toast.success(`LINE綁定成功：${data.displayName}`);
      setIsBindDialogOpen(false);
      setLineUserId("");
      refetch();
    },
    onError: (error) => {
      toast.error(`綁定失敗：${error.message}`);
    },
  });

  // 解除LINE綁定
  const unbindLineMutation = trpc.recipients.unbindLine.useMutation({
    onSuccess: () => {
      toast.success("LINE綁定已解除");
      refetch();
    },
    onError: (error) => {
      toast.error(`解除綁定失敗：${error.message}`);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const handleBindLine = () => {
    if (!selectedRecipient || !lineUserId.trim()) {
      toast.error("請輸入LINE User ID");
      return;
    }
    bindLineMutation.mutate({
      recipientId: selectedRecipient,
      lineUserId: lineUserId.trim(),
    });
  };

  const handleUnbindLine = (recipientId: number) => {
    if (confirm("確定要解除LINE綁定嗎？")) {
      unbindLineMutation.mutate({ recipientId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">收餐人管理</h1>
          <p className="text-muted-foreground mt-2">
            管理送餐服務的收餐人資訊和LINE通知綁定
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsQrDialogOpen(true)}>
            <QrCode className="w-4 h-4 mr-2" />
            LINE機器人QR Code
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新增收餐人
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>收餐人列表</CardTitle>
          <CardDescription>
            共 {recipients?.length || 0} 位收餐人
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>電話</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>LINE狀態</TableHead>
                <TableHead>通知方式</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    尚無收餐人資料
                  </TableCell>
                </TableRow>
              ) : (
                recipients?.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell className="font-medium">{recipient.name}</TableCell>
                    <TableCell>{recipient.phone}</TableCell>
                    <TableCell className="max-w-xs truncate">{recipient.address || "-"}</TableCell>
                    <TableCell>
                      {recipient.lineUserId ? (
                        <Badge variant="default">
                          已綁定：{recipient.lineDisplayName}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">未綁定</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {recipient.preferredNotificationMethod === "line" ? "LINE" : "SMS"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {recipient.lineUserId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnbindLine(recipient.id)}
                          >
                            <Unlink className="w-4 h-4 mr-1" />
                            解除綁定
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRecipient(recipient.id);
                              setIsBindDialogOpen(true);
                            }}
                          >
                            <LinkIcon className="w-4 h-4 mr-1" />
                            綁定LINE
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增收餐人對話框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增收餐人</DialogTitle>
            <DialogDescription>
              填寫收餐人的基本資訊
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">姓名 *</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="phone">電話 *</Label>
                <Input id="phone" name="phone" type="tel" required />
              </div>
              <div>
                <Label htmlFor="address">地址</Label>
                <Input id="address" name="address" />
              </div>
              <div>
                <Label htmlFor="notes">備註</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                建立
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* LINE機器人QR Code對話框 */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>LINE機器人QR Code</DialogTitle>
            <DialogDescription>
              請收餐人掃描此QR Code加入LINE好友
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {lineBotInfo && (
              <>
                <div className="bg-white p-4 rounded-lg border">
                  <img
                    src={`https://qr-official.line.me/gs/M_${lineBotInfo.basicId.replace("@", "")}_GW.png`}
                    alt="LINE Bot QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-medium">LINE ID: {lineBotInfo.basicId}</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(lineBotInfo.addFriendUrl, "_blank");
                    }}
                  >
                    開啟LINE加入好友
                  </Button>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsQrDialogOpen(false)}>關閉</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 綁定LINE對話框 */}
      <Dialog open={isBindDialogOpen} onOpenChange={setIsBindDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>綁定LINE帳號</DialogTitle>
            <DialogDescription>
              請先確認收餐人已加入LINE機器人好友，然後輸入LINE User ID進行綁定
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lineUserId">LINE User ID</Label>
              <Input
                id="lineUserId"
                value={lineUserId}
                onChange={(e) => setLineUserId(e.target.value)}
                placeholder="例如：U1234567890abcdef..."
              />
              <p className="text-sm text-muted-foreground mt-2">
                LINE User ID可以從LINE Developers Console的webhook日誌中取得
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBindDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleBindLine} disabled={bindLineMutation.isPending}>
              {bindLineMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              綁定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
