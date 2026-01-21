import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, Upload, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { ImageUploader } from "@/components/ImageUploader";

type GalleryFormData = {
  title: string;
  description: string;
  imageUrl: string;
  category: "活動花絮" | "設施環境" | "教育訓練" | "志工服務" | "其他";
  isPublished: boolean;
  displayOrder: number;
};

export default function GalleryManagement() {
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [formData, setFormData] = useState<GalleryFormData>({
    title: "",
    description: "",
    imageUrl: "",
    category: "其他",
    isPublished: true,
    displayOrder: 0,
  });

  const utils = trpc.useUtils();
  const { data: galleryItems, isLoading } = trpc.gallery.getAll.useQuery();

  const createMutation = trpc.gallery.create.useMutation({
    onSuccess: () => {
      toast.success("照片已新增");
      utils.gallery.getAll.invalidate();
      utils.gallery.getPublished.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error("新增失敗：" + error.message);
    },
  });

  const updateMutation = trpc.gallery.update.useMutation({
    onSuccess: () => {
      toast.success("照片已更新");
      utils.gallery.getAll.invalidate();
      utils.gallery.getPublished.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error("更新失敗：" + error.message);
    },
  });

  const deleteMutation = trpc.gallery.delete.useMutation({
    onSuccess: () => {
      toast.success("照片已刪除");
      utils.gallery.getAll.invalidate();
      utils.gallery.getPublished.invalidate();
    },
    onError: (error) => {
      toast.error("刪除失敗：" + error.message);
    },
  });

  const batchDeleteMutation = trpc.gallery.batchDelete.useMutation({
    onSuccess: () => {
      toast.success(`已刪除 ${selectedItems.length} 張照片`);
      utils.gallery.getAll.invalidate();
      utils.gallery.getPublished.invalidate();
      setSelectedItems([]);
    },
    onError: (error) => {
      toast.error("批次刪除失敗：" + error.message);
    },
  });

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      category: "其他",
      isPublished: true,
      displayOrder: 0,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      imageUrl: item.imageUrl,
      category: item.category,
      isPublished: item.isPublished,
      displayOrder: item.displayOrder || 0,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.imageUrl.trim()) {
      toast.error("請填寫標題和圖片網址");
      return;
    }

    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("確定要刪除這張照片嗎？")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleBatchDelete = () => {
    if (selectedItems.length === 0) {
      toast.error("請先選擇要刪除的照片");
      return;
    }
    
    if (confirm(`確定要刪除選中的 ${selectedItems.length} 張照片嗎？`)) {
      batchDeleteMutation.mutate({ ids: selectedItems });
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === galleryItems?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(galleryItems?.map(item => item.id) || []);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => setLocation("/admin")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">服務花絮照片牆</h1>
              <p className="text-muted-foreground mt-2">管理活動照片與設施環境圖片</p>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedItems.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleBatchDelete}
                disabled={batchDeleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                刪除選中 ({selectedItems.length})
              </Button>
            )}
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              新增照片
            </Button>
          </div>
        </div>

        {galleryItems && galleryItems.length > 0 && (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <Checkbox
              checked={selectedItems.length === galleryItems.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              全選 ({selectedItems.length}/{galleryItems.length})
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : galleryItems && galleryItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryItems.map((item) => (
              <Card key={item.id} className="overflow-hidden group relative">
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => toggleSelectItem(item.id)}
                    className="bg-white"
                  />
                </div>
                <div className="aspect-video overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {item.category}
                    </span>
                    {!item.isPublished && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        未發布
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-1 mb-2">{item.title}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      編輯
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">尚未新增任何照片</p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                新增第一張照片
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 新增/編輯對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "編輯照片" : "新增照片"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "修改照片資訊" : "新增一張照片到服務花絮"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <ImageUploader
                label="照片上傳"
                description="支援 JPG、PNG、GIF、WebP 格式，檔案大小不超過 5MB"
                currentImageUrl={formData.imageUrl}
                onUploadSuccess={(url) => setFormData({ ...formData, imageUrl: url })}
              />
              <div className="mt-2">
                <Label htmlFor="imageUrlInput">或手動輸入圖片網址（選填）</Label>
                <Input
                  id="imageUrlInput"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="title">標題 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="輸入照片標題"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">分類 *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="活動花絮">活動花絮</SelectItem>
                  <SelectItem value="設施環境">設施環境</SelectItem>
                  <SelectItem value="教育訓練">教育訓練</SelectItem>
                  <SelectItem value="志工服務">志工服務</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="照片描述（選填）"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="displayOrder">顯示順序</Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                數字越大越靠前顯示
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
              />
              <Label htmlFor="isPublished">發布到前台</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "處理中..." : editingItem ? "更新" : "新增"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
