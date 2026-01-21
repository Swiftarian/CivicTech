import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, X, Grid3x3, Play, ChevronLeft, ChevronRight, Pause } from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Gallery() {
  const { data: galleryItems, isLoading } = trpc.gallery.getPublished.useQuery();
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [viewMode, setViewMode] = useState<"grid" | "carousel">("grid");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const categories = ["全部", "活動花絮", "設施環境", "教育訓練", "志工服務", "其他"];

  const filteredItems = galleryItems?.filter(item => 
    selectedCategory === "全部" || item.category === selectedCategory
  );

  // 輪播自動播放
  useEffect(() => {
    if (viewMode === "carousel" && isAutoPlaying && filteredItems && filteredItems.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % filteredItems.length);
      }, 5000); // 5秒自動切換
      return () => clearInterval(timer);
    }
  }, [viewMode, isAutoPlaying, filteredItems, currentSlide]);

  // 鍵盤控制
  useEffect(() => {
    if (viewMode === "carousel") {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
          handlePrevSlide();
        } else if (e.key === "ArrowRight") {
          handleNextSlide();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [viewMode, filteredItems]);

  const handlePrevSlide = () => {
    if (filteredItems && filteredItems.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  const handleNextSlide = () => {
    if (filteredItems && filteredItems.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % filteredItems.length);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回首頁
          </Button>
        </Link>

        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">服務花絮</h1>
            <p className="text-muted-foreground text-lg">
              臺東災害警覺教育館活動紀錄與精彩瞬間
            </p>
          </div>

          {/* 分類篩選和視圖模式切換 */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => {
                    setSelectedCategory(category);
                    setCurrentSlide(0);
                  }}
                >
                  {category}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                onClick={() => setViewMode("grid")}
                size="sm"
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                網格模式
              </Button>
              <Button
                variant={viewMode === "carousel" ? "default" : "outline"}
                onClick={() => setViewMode("carousel")}
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                輪播模式
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-muted"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredItems && filteredItems.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className="hover-lift cursor-pointer overflow-hidden group"
                    onClick={() => setSelectedImage(item)}
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {item.category}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* 輪播模式 */
              <div className="relative w-full max-w-5xl mx-auto">
                <Card className="overflow-hidden">
                  <div className="relative aspect-video bg-black">
                    <img
                      src={filteredItems[currentSlide]?.imageUrl}
                      alt={filteredItems[currentSlide]?.title}
                      className="w-full h-full object-contain"
                    />
                    {/* 字幕 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                      <h3 className="text-2xl font-bold mb-2">{filteredItems[currentSlide]?.title}</h3>
                      {filteredItems[currentSlide]?.description && (
                        <p className="text-sm opacity-90">{filteredItems[currentSlide]?.description}</p>
                      )}
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20">
                          {filteredItems[currentSlide]?.category}
                        </span>
                      </div>
                    </div>
                    
                    {/* 左右切換按鈕 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={handlePrevSlide}
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={handleNextSlide}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                    
                    {/* 播放/暂停按鈕 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    >
                      {isAutoPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                  </div>
                  
                  {/* 輪播指示器 */}
                  <div className="flex justify-center gap-2 p-4 bg-muted/30">
                    {filteredItems.map((_, index) => (
                      <button
                        key={index}
                        className={`h-2 rounded-full transition-all ${
                          index === currentSlide
                            ? "w-8 bg-primary"
                            : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                        }`}
                        onClick={() => setCurrentSlide(index)}
                        aria-label={`切換到第 ${index + 1} 張照片`}
                      />
                    ))}
                  </div>
                </Card>
              </div>
            )
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground text-lg">
                  {selectedCategory === "全部" ? "目前沒有照片" : `目前沒有「${selectedCategory}」分類的照片`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 燈箱效果 */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.title}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className="w-full h-auto rounded-lg"
              />
              {selectedImage.description && (
                <p className="text-muted-foreground">{selectedImage.description}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
