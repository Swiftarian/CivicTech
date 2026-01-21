import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, Eye, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import DashboardLayout from "@/components/DashboardLayout";
import { ImageUploader } from "@/components/ImageUploader";

type NewsFormData = {
  title: string;
  content: string;
  summary: string;
  coverImage: string;
  category: "防災宣導" | "活動公告" | "新聞稿" | "其他";
  isPublished: boolean;
};

export default function NewsManagement() {
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<any>(null);
  const [formData, setFormData] = useState<NewsFormData>({
    title: "",
    content: "",
    summary: "",
    coverImage: "",
    category: "其他",
    isPublished: false,
  });

  const utils = trpc.useUtils();
  const { data: newsList, isLoading } = trpc.news.getAll.useQuery();

  const createMutation = trpc.news.create.useMutation({
    onSuccess: () => {
      toast.success("最新消息已新增");
      utils.news.getAll.invalidate();
      utils.news.getPublished.invalidate();
      closeDialog();
    },
    onError: error => {
      toast.error("新增失敗：" + error.message);
    },
  });

  const updateMutation = trpc.news.update.useMutation({
    onSuccess: () => {
      toast.success("最新消息已更新");
      utils.news.getAll.invalidate();
      utils.news.getPublished.invalidate();
      closeDialog();
    },
    onError: error => {
      toast.error("更新失敗：" + error.message);
    },
  });

  const deleteMutation = trpc.news.delete.useMutation({
    onSuccess: () => {
      toast.success("最新消息已刪除");
      utils.news.getAll.invalidate();
      utils.news.getPublished.invalidate();
    },
    onError: error => {
      toast.error("刪除失敗：" + error.message);
    },
  });

  const openCreateDialog = () => {
    setEditingNews(null);
    setFormData({
      title: "",
      content: "",
      summary: "",
      coverImage: "",
      category: "其他",
      isPublished: false,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (news: any) => {
    setEditingNews(news);
    setFormData({
      title: news.title,
      content: news.content,
      summary: news.summary || "",
      coverImage: news.coverImage || "",
      category: news.category,
      isPublished: news.isPublished,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingNews(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("請填寫標題和內容");
      return;
    }

    if (editingNews) {
      updateMutation.mutate({
        id: editingNews.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("確定要刪除這則消息嗎？")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation("/admin")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">最新消息管理</h1>
              <p className="text-muted-foreground mt-2">
                管理防災宣導、活動公告與新聞稿
              </p>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            新增消息
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : newsList && newsList.length > 0 ? (
          <div className="grid gap-4">
            {newsList.map(news => (
              <Card key={news.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            news.category === "防災宣導"
                              ? "bg-red-100 text-red-800"
                              : news.category === "活動公告"
                                ? "bg-blue-100 text-blue-800"
                                : news.category === "新聞稿"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {news.category}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            news.isPublished
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {news.isPublished ? "已發布" : "草稿"}
                        </span>
                        {news.publishedAt && (
                          <span className="text-sm text-muted-foreground">
                            {format(
                              new Date(news.publishedAt),
                              "yyyy/MM/dd HH:mm",
                              { locale: zhTW }
                            )}
                          </span>
                        )}
                      </div>
                      <CardTitle>{news.title}</CardTitle>
                      {news.summary && (
                        <CardDescription className="mt-2">
                          {news.summary}
                        </CardDescription>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {news.viewCount || 0} 次瀏覽
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(news)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(news.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">尚未新增任何消息</p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                新增第一則消息
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 新增/編輯對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNews ? "編輯消息" : "新增消息"}</DialogTitle>
            <DialogDescription>
              {editingNews ? "修改消息內容" : "新增一則最新消息"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">標題 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="輸入消息標題"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">分類 *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="防災宣導">防災宣導</SelectItem>
                  <SelectItem value="活動公告">活動公告</SelectItem>
                  <SelectItem value="新聞稿">新聞稿</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="summary">摘要</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={e =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                placeholder="簡短摘要（選填）"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="content">內容 *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={e =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="輸入消息內容"
                rows={8}
                required
              />
            </div>

            <div>
              <ImageUploader
                label="封面圖片"
                description="支援 JPG、PNG、GIF、WebP 格式，檔案大小不超過 5MB"
                currentImageUrl={formData.coverImage}
                onUploadSuccess={url =>
                  setFormData({ ...formData, coverImage: url })
                }
              />
              <div className="mt-2">
                <Label htmlFor="coverImageUrl">
                  或手動輸入圖片網址（選填）
                </Label>
                <Input
                  id="coverImageUrl"
                  value={formData.coverImage}
                  onChange={e =>
                    setFormData({ ...formData, coverImage: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={checked =>
                  setFormData({ ...formData, isPublished: checked })
                }
              />
              <Label htmlFor="isPublished">立即發布</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                取消
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "處理中..."
                  : editingNews
                    ? "更新"
                    : "新增"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
