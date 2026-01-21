import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Save, Upload, Image as ImageIcon, ArrowLeft, Home } from "lucide-react";
import { Link } from "wouter";

export default function HomeContentManagement() {
  const { data: homeContent, isLoading, refetch } = trpc.homeContent.get.useQuery();
  const updateMutation = trpc.homeContent.update.useMutation({
    onSuccess: () => {
      toast.success("首頁內容已更新");
      refetch();
    },
    onError: (error) => {
      toast.error("更新失敗", {
        description: error.message
      });
    }
  });

  const uploadImageMutation = trpc.upload.image.useMutation({
    onSuccess: (data) => {
      return data.url;
    },
    onError: (error) => {
      toast.error("圖片上傳失敗", {
        description: error.message
      });
    }
  });

  const [formData, setFormData] = useState({
    aboutTitle: "",
    aboutParagraph1: "",
    aboutParagraph2: "",
    aboutParagraph3: "",
    heroImage1: "",
    heroImage1Title: "",
    heroImage1Desc: "",
    heroImage2: "",
    heroImage2Title: "",
    heroImage2Desc: "",
    heroImage3: "",
    heroImage3Title: "",
    heroImage3Desc: "",
    heroImage4: "",
    heroImage4Title: "",
    heroImage4Desc: "",
  });

  useEffect(() => {
    if (homeContent) {
      setFormData({
        aboutTitle: homeContent.aboutTitle || "",
        aboutParagraph1: homeContent.aboutParagraph1 || "",
        aboutParagraph2: homeContent.aboutParagraph2 || "",
        aboutParagraph3: homeContent.aboutParagraph3 || "",
        heroImage1: homeContent.heroImage1 || "",
        heroImage1Title: homeContent.heroImage1Title || "",
        heroImage1Desc: homeContent.heroImage1Desc || "",
        heroImage2: homeContent.heroImage2 || "",
        heroImage2Title: homeContent.heroImage2Title || "",
        heroImage2Desc: homeContent.heroImage2Desc || "",
        heroImage3: homeContent.heroImage3 || "",
        heroImage3Title: homeContent.heroImage3Title || "",
        heroImage3Desc: homeContent.heroImage3Desc || "",
        heroImage4: homeContent.heroImage4 || "",
        heroImage4Title: homeContent.heroImage4Title || "",
        heroImage4Desc: homeContent.heroImage4Desc || "",
      });
    }
  }, [homeContent]);

  const handleImageUpload = async (file: File, imageField: string) => {
    if (!file) return;

    // 檢查檔案大小（限制 5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error("圖片檔案過大", {
        description: "請選擇小於 5MB 的圖片"
      });
      return;
    }

    // 檢查檔案類型
    if (!file.type.startsWith("image/")) {
      toast.error("檔案類型錯誤", {
        description: "請選擇圖片檔案"
      });
      return;
    }

    try {
      // 讀取檔案為 base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        const base64Content = base64Data.split(",")[1]; // 移除 data:image/xxx;base64, 前綴

        toast.loading("上傳中...", { id: "upload" });

        const result = await uploadImageMutation.mutateAsync({
          base64Data: base64Content,
          mimeType: file.type,
          originalName: file.name,
        });

        toast.dismiss("upload");
        toast.success("圖片上傳成功");

        // 更新表單資料
        setFormData(prev => ({
          ...prev,
          [imageField]: result.url
        }));
      };

      reader.readAsDataURL(file);
    } catch (error) {
      toast.dismiss("upload");
      console.error("圖片上傳失敗:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!homeContent) {
      toast.error("無法取得首頁內容");
      return;
    }

    await updateMutation.mutateAsync({
      id: homeContent.id,
      ...formData
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl">
      {/* 麵包屑導航 */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/">
          <a className="hover:text-foreground transition-colors flex items-center gap-1">
            <Home className="h-4 w-4" />
            首頁
          </a>
        </Link>
        <span>/</span>
        <Link href="/admin">
          <a className="hover:text-foreground transition-colors">
            管理後台
          </a>
        </Link>
        <span>/</span>
        <span className="text-foreground">首頁內容管理</span>
      </div>

      {/* 標題和返回按鈕 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">首頁內容管理</h1>
          <p className="text-muted-foreground">
            管理首頁的文字內容和輪播照片
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回管理後台
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 關於教育館文字 */}
        <Card>
          <CardHeader>
            <CardTitle>關於教育館介紹</CardTitle>
            <CardDescription>
              編輯「關於臺東災害警覺教育館」區塊的文字內容
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="aboutTitle">標題</Label>
              <Input
                id="aboutTitle"
                value={formData.aboutTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, aboutTitle: e.target.value }))}
                placeholder="關於臺東災害警覺教育館"
              />
            </div>

            <div>
              <Label htmlFor="aboutParagraph1">第一段</Label>
              <Textarea
                id="aboutParagraph1"
                value={formData.aboutParagraph1}
                onChange={(e) => setFormData(prev => ({ ...prev, aboutParagraph1: e.target.value }))}
                rows={3}
                placeholder="第一段介紹文字"
              />
            </div>

            <div>
              <Label htmlFor="aboutParagraph2">第二段</Label>
              <Textarea
                id="aboutParagraph2"
                value={formData.aboutParagraph2}
                onChange={(e) => setFormData(prev => ({ ...prev, aboutParagraph2: e.target.value }))}
                rows={3}
                placeholder="第二段介紹文字"
              />
            </div>

            <div>
              <Label htmlFor="aboutParagraph3">第三段</Label>
              <Textarea
                id="aboutParagraph3"
                value={formData.aboutParagraph3}
                onChange={(e) => setFormData(prev => ({ ...prev, aboutParagraph3: e.target.value }))}
                rows={3}
                placeholder="第三段介紹文字"
              />
            </div>
          </CardContent>
        </Card>

        {/* 輪播照片 1 */}
        <Card>
          <CardHeader>
            <CardTitle>輪播照片 1</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="heroImage1">照片 URL</Label>
              <div className="flex gap-2">
                <Input
                  id="heroImage1"
                  value={formData.heroImage1}
                  onChange={(e) => setFormData(prev => ({ ...prev, heroImage1: e.target.value }))}
                  placeholder="/images/gallery/facility-1.jpg"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleImageUpload(file, "heroImage1");
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  上傳
                </Button>
              </div>
              {formData.heroImage1 && (
                <div className="mt-2 relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={formData.heroImage1}
                    alt="預覽"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="heroImage1Title">標題</Label>
              <Input
                id="heroImage1Title"
                value={formData.heroImage1Title}
                onChange={(e) => setFormData(prev => ({ ...prev, heroImage1Title: e.target.value }))}
                placeholder="地震模擬區"
              />
            </div>

            <div>
              <Label htmlFor="heroImage1Desc">描述</Label>
              <Textarea
                id="heroImage1Desc"
                value={formData.heroImage1Desc}
                onChange={(e) => setFormData(prev => ({ ...prev, heroImage1Desc: e.target.value }))}
                rows={2}
                placeholder="體驗地震搖晃感受並學習避難技巧"
              />
            </div>
          </CardContent>
        </Card>

        {/* 輪播照片 2 */}
        <Card>
          <CardHeader>
            <CardTitle>輪播照片 2</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="heroImage2">照片 URL</Label>
              <div className="flex gap-2">
                <Input
                  id="heroImage2"
                  value={formData.heroImage2}
                  onChange={(e) => setFormData(prev => ({ ...prev, heroImage2: e.target.value }))}
                  placeholder="/images/gallery/facility-2.jpg"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleImageUpload(file, "heroImage2");
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  上傳
                </Button>
              </div>
              {formData.heroImage2 && (
                <div className="mt-2 relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={formData.heroImage2}
                    alt="預覽"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="heroImage2Title">標題</Label>
              <Input
                id="heroImage2Title"
                value={formData.heroImage2Title}
                onChange={(e) => setFormData(prev => ({ ...prev, heroImage2Title: e.target.value }))}
                placeholder="即時氣候監測球"
              />
            </div>

            <div>
              <Label htmlFor="heroImage2Desc">描述</Label>
              <Textarea
                id="heroImage2Desc"
                value={formData.heroImage2Desc}
                onChange={(e) => setFormData(prev => ({ ...prev, heroImage2Desc: e.target.value }))}
                rows={2}
                placeholder="了解全球氣候變遷與災害預警"
              />
            </div>
          </CardContent>
        </Card>

        {/* 輪播照片 3 */}
        <Card>
          <CardHeader>
            <CardTitle>輪播照片 3</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="heroImage3">照片 URL</Label>
              <div className="flex gap-2">
                <Input
                  id="heroImage3"
                  value={formData.heroImage3}
                  onChange={(e) => setFormData(prev => ({ ...prev, heroImage3: e.target.value }))}
                  placeholder="/images/gallery/facility-3.jpg"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleImageUpload(file, "heroImage3");
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  上傳
                </Button>
              </div>
              {formData.heroImage3 && (
                <div className="mt-2 relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={formData.heroImage3}
                    alt="預覽"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="heroImage3Title">標題</Label>
              <Input
                id="heroImage3Title"
                value={formData.heroImage3Title}
                onChange={(e) => setFormData(prev => ({ ...prev, heroImage3Title: e.target.value }))}
                placeholder="消防救災體驗區"
              />
            </div>

            <div>
              <Label htmlFor="heroImage3Desc">描述</Label>
              <Textarea
                id="heroImage3Desc"
                value={formData.heroImage3Desc}
                onChange={(e) => setFormData(prev => ({ ...prev, heroImage3Desc: e.target.value }))}
                rows={2}
                placeholder="親自體驗消防員救災情境與裝備"
              />
            </div>
          </CardContent>
        </Card>

        {/* 輪播照片 4 */}
        <Card>
          <CardHeader>
            <CardTitle>輪播照片 4</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="heroImage4">照片 URL</Label>
              <div className="flex gap-2">
                <Input
                  id="heroImage4"
                  value={formData.heroImage4}
                  onChange={(e) => setFormData(prev => ({ ...prev, heroImage4: e.target.value }))}
                  placeholder="/images/gallery/facility-4.jpg"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleImageUpload(file, "heroImage4");
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  上傳
                </Button>
              </div>
              {formData.heroImage4 && (
                <div className="mt-2 relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={formData.heroImage4}
                    alt="預覽"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="heroImage4Title">標題</Label>
              <Input
                id="heroImage4Title"
                value={formData.heroImage4Title}
                onChange={(e) => setFormData(prev => ({ ...prev, heroImage4Title: e.target.value }))}
                placeholder="煙霧迷宮逃生體驗"
              />
            </div>

            <div>
              <Label htmlFor="heroImage4Desc">描述</Label>
              <Textarea
                id="heroImage4Desc"
                value={formData.heroImage4Desc}
                onChange={(e) => setFormData(prev => ({ ...prev, heroImage4Desc: e.target.value }))}
                rows={2}
                placeholder="讓參訪者能夠身歷其境地學習防災知識"
              />
            </div>
          </CardContent>
        </Card>

        {/* 儲存按鈕 */}
        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="min-w-32"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                儲存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                儲存變更
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
