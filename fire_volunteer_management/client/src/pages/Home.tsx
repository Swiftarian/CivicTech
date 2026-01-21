import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";
import { 
  Users, 
  User, 
  MapPin, 
  Search, 
  Calendar,
  Shield,
  Heart,
  Truck,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { Facebook, Instagram } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

// 台東文化背景圖片
const heroBackground = "/images/taitung-culture.jpg";

// 服務花絮輪播組件
interface GalleryItem {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string;
}

function GalleryCarousel({ items }: { items: GalleryItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // 自動播放
  useEffect(() => {
    if (!isPlaying || items.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000); // 5秒切換
    return () => clearInterval(timer);
  }, [isPlaying, items.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(false);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setIsPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setIsPlaying(false);
  };

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <div className="relative">
      {/* 主要輪播區域 - 與最新消息一樣的大小 */}
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        <img
          src={currentItem.imageUrl}
          alt={currentItem.title}
          className="w-full h-full object-cover"
        />
        
        {/* 字幕區域 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6">
          <h3 className="text-white text-xl md:text-2xl font-bold mb-2">
            {currentItem.title}
          </h3>
          {currentItem.description && (
            <p className="text-white/90 text-sm md:text-base line-clamp-2">
              {currentItem.description}
            </p>
          )}
        </div>

        {/* 左右切換按鈕 */}
        <button
          onClick={goToPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all hover:scale-110"
          aria-label="上一張"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all hover:scale-110"
          aria-label="下一張"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* 播放/暫停按鈕 */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all hover:scale-110"
          aria-label={isPlaying ? "暫停" : "播放"}
        >
          {isPlaying ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* 輪播指示器 */}
      <div className="flex justify-center gap-2 mt-4">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? "w-8 bg-primary"
                : "w-2 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`切換到第 ${index + 1} 張`}
          />
        ))}
      </div>
    </div>
  );
}

// 防災館設施輪播圖片
const galleryImages = [
  { src: "/images/gallery/building-exterior.jpg", title: "臺東災害警覺教育館外觀", desc: "現代化的防災教育場館" },
  { src: "/images/gallery/earthquake-simulation.jpg", title: "地震模擬區", desc: "體驗地震並學習避難技巧" },
  { src: "/images/gallery/climate-globe.jpg", title: "即時氣候投影球", desc: "了解全球氣候變化" },
  { src: "/images/gallery/fire-rescue-experience.jpg", title: "消防救災體驗區", desc: "模擬消防救災情境" }
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // 獲取首頁內容
  const { data: homeContent } = trpc.homeContent.get.useQuery();
  
  // 獲取最新消息（前3則）
  const { data: latestNews } = trpc.news.getPublished.useQuery({ limit: 3 });
  
  // 獲取服務花絮（前6張）
  const { data: latestGallery } = trpc.gallery.getPublished.useQuery({ limit: 6 });
  // 輪播用數據，只取前3張與最新消息數量一致
  const carouselGallery = latestGallery?.slice(0, 3);
  
  // 從資料庫組合輪播圖片
  const galleryImagesFromDB = homeContent ? [
    { src: homeContent.heroImage1 || "/images/gallery/building-exterior.jpg", title: homeContent.heroImage1Title || "臺東災害警覺教育館外觀", desc: homeContent.heroImage1Desc || "現代化的防災教育場館" },
    { src: homeContent.heroImage2 || "/images/gallery/earthquake-simulation.jpg", title: homeContent.heroImage2Title || "地震模擬區", desc: homeContent.heroImage2Desc || "體驗地震並學習避難技巧" },
    { src: homeContent.heroImage3 || "/images/gallery/climate-globe.jpg", title: homeContent.heroImage3Title || "即時氣候投影球", desc: homeContent.heroImage3Desc || "了解全球氣候變化" },
    { src: homeContent.heroImage4 || "/images/gallery/fire-rescue-experience.jpg", title: homeContent.heroImage4Title || "消防救災體驗區", desc: homeContent.heroImage4Desc || "模擬消防救災情境" }
  ] : galleryImages;
  
  // 自動輪播
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % galleryImages.length);
    }, 4000); // 每4秒切換
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % galleryImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* 導覽列 */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
              <img 
                src="/images/taitung-fire-dept-logo.png" 
                alt="台東縣消防局" 
                className="h-10 w-auto"
              />
            </Link>
            
            {/* 桌面版導航 */}
            <div className="hidden md:flex items-center space-x-6 text-gray-700">
              <Link href="/" className="hover:text-green-600 transition-colors">首頁</Link>
              <Link href="/booking" className="hover:text-green-600 transition-colors">預約參訪</Link>
              <Link href="/traffic" className="hover:text-green-600 transition-colors">交通指引</Link>
              <Link href="/booking/query" className="hover:text-green-600 transition-colors">預約查詢</Link>
              <Link href="/news" className="hover:text-green-600 transition-colors">最新消息</Link>
              <Link href="/gallery" className="hover:text-green-600 transition-colors">服務花絮</Link>
              
              {isAuthenticated ? (
                <>
                  {user?.role === 'admin' && (
                    <Link href="/admin" className="hover:text-green-600 transition-colors">管理後台</Link>
                  )}
                  <span className="text-sm text-gray-900">歡迎，{user?.name || user?.email}</span>
                  <Button 
                    onClick={() => logoutMutation.mutate()} 
                    variant="outline" 
                    size="sm"
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? "登出中..." : "登出"}
                  </Button>
                </>
              ) : (
                <a href={getLoginUrl()}>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm">登入</Button>
                </a>
              )}
            </div>

            {/* 手機版漢堡選單按鈕 */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="選單"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* 手機版導航選單 */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="container py-4 space-y-3">
            <Link 
              href="/" 
              className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              首頁
            </Link>
            <Link 
              href="/booking" 
              className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              預約參訪
            </Link>
            <Link 
              href="/traffic" 
              className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              交通指引
            </Link>
            <Link 
              href="/booking/query" 
              className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              預約查詢
            </Link>
            <Link 
              href="/news" 
              className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              最新消息
            </Link>
            <Link 
              href="/gallery" 
              className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              服務花絮
            </Link>
            
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link 
                    href="/admin" 
                    className="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    管理後台
                  </Link>
                )}
                <div className="px-4 py-2 text-sm text-gray-600">
                  歡迎，{user?.name || user?.email}
                </div>
                <div className="px-4">
                  <Button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logoutMutation.mutate();
                    }} 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? "登出中..." : "登出"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="px-4">
                <a href={getLoginUrl()} className="block">
                  <Button className="bg-green-600 hover:bg-green-700 text-white w-full" size="sm">
                    登入
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 主視覺 - 台東文化全幅背景 */}
      <div 
        className="relative h-[500px] md:h-[600px] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        {/* 半透明遮罩層 */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
        
        {/* 內容 */}
        <div className="relative container h-full flex items-center">
          <div className="max-w-2xl space-y-6 text-white">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight drop-shadow-lg">
              歡迎來到
              <br />
              <span className="text-green-400">臺東災害警覺教育館</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 leading-relaxed drop-shadow">
              化平凡為精彩，綿放台東藍
              <br />
              學習防災知識，保護您與家人的安全
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/booking">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white shadow-lg px-8 py-6 text-lg">
                  立即預約參訪
                </Button>
              </Link>
              <Link href="/traffic">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 shadow-lg px-8 py-6 text-lg">
                  交通指引
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 服務項目 */}
      <section className="section-padding">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">服務項目</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link href="/booking">
              <Card className="hover-lift cursor-pointer h-full transition-all hover:shadow-xl">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-32 h-24 flex items-center justify-center overflow-hidden rounded-lg">
                    <img 
                      src="/images/icons/tour-guide.jpg" 
                      alt="導覽預約" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle>導覽預約</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    提供團體與個人導覽預約服務，專業志工帶領參觀，深入淺出介紹防災知識與技能
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Card className="hover-lift h-full">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-32 h-24 flex items-center justify-center overflow-hidden rounded-lg">
                  <img 
                    src="/images/icons/meal-delivery.jpg" 
                    alt="送餐服務" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardTitle>送餐服務</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  志工送餐服務，提供路徑追蹤與QR Code驗證機制，確保送餐安全與效率
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 關於我們 - 設施輪播 */}
      <section className="section-padding bg-muted/30">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{homeContent?.aboutTitle || "關於臺東災害警覺教育館"}</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* 輪播圖片區 */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-xl shadow-2xl aspect-[4/3]">
                {galleryImagesFromDB.map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      index === currentSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img
                      src={image.src}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    {/* 圖片標題覆蓋層 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <h3 className="text-white font-bold text-lg">{image.title}</h3>
                      <p className="text-white/80 text-sm">{image.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 左右切換按鈕 */}
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                aria-label="上一張"
              >
                <ChevronLeft className="h-6 w-6 text-gray-800" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                aria-label="下一張"
              >
                <ChevronRight className="h-6 w-6 text-gray-800" />
              </button>
              
              {/* 指示點 */}
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex space-x-2">
                {galleryImagesFromDB.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentSlide 
                        ? 'bg-white scale-110' 
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                    aria-label={`切換到第 ${index + 1} 張圖片`}
                  />
                ))}
              </div>
            </div>
            
            {/* 文字說明區 */}
            <div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  {homeContent?.aboutParagraph1 || "臺東災害警覺教育館致力於推廣防災教育，透過互動式體驗設施，讓民眾在實際操作中學習各項防災知識與技能。"}
                </p>
                <p>
                  {homeContent?.aboutParagraph2 || "我們提供專業的導覽服務，由經驗豐富的志工帶領參觀，深入淺出地介紹地震、火災、颱風等各類災害的預防與應變措施。"}
                </p>
                <p>
                  {homeContent?.aboutParagraph3 || "館內設有多項互動體驗設施，包括地震體驗平台、煙霧逃生體驗、消防設備操作等，讓參訪者能夠身歷其境地學習防災知識。"}
                </p>
              </div>
              
              {/* 設施快速瀏覽 */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                {galleryImagesFromDB.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`p-3 rounded-lg text-left transition-all ${
                      index === currentSlide 
                        ? 'bg-primary/10 border-2 border-primary' 
                        : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                    }`}
                  >
                    <p className="font-medium text-sm">{image.title}</p>
                    <p className="text-xs text-muted-foreground">{image.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 最新消息預覽 */}
      <section className="section-padding bg-gradient-to-b from-background to-muted/30">
        <div className="container">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">最新消息</h2>
            <Link href="/news">
              <Button variant="outline">查看更多</Button>
            </Link>
          </div>
          
          {latestNews && latestNews.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {latestNews.map((news) => (
                <Link key={news.id} href={`/news/${news.id}`}>
                  <Card className="hover-lift cursor-pointer h-full">
                    {news.coverImage && news.coverImage.trim() !== '' && (
                      <div className="aspect-video overflow-hidden bg-muted">
                        <img
                          src={news.coverImage}
                          alt={news.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.style.display = 'none';
                            }
                          }}
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {news.publishedAt && format(new Date(news.publishedAt), "yyyy/MM/dd", { locale: zhTW })}
                      </div>
                      <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
                        {news.title}
                      </CardTitle>
                    </CardHeader>
                    {news.summary && (
                      <CardContent>
                        <CardDescription className="line-clamp-3">
                          {news.summary}
                        </CardDescription>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">目前沒有最新消息</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* 服務花絮預覽 */}
      <section className="section-padding">
        <div className="container">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">服務花絮</h2>
            <Link href="/gallery">
              <Button variant="outline">查看更多</Button>
            </Link>
          </div>
          
          {carouselGallery && carouselGallery.length > 0 ? (
            <GalleryCarousel items={carouselGallery} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">目前沒有服務花絮照片</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* 參訪流程 */}
      <section className="section-padding bg-muted/30">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">參訪流程</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "線上預約", desc: "選擇參訪日期與時段" },
              { step: "2", title: "預約確認", desc: "收到確認通知與預約編號" },
              { step: "3", title: "準時報到", desc: "攜帶預約編號至櫃檯報到" },
              { step: "4", title: "開始參訪", desc: "由志工帶領進行導覽" }
            ].map((item, index) => (
              <div key={index} className="relative">
                <Card className="hover-lift text-center pt-8">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                    {item.step}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 頁尾 */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
        <div className="container section-padding-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo和名稱 */}
            <div className="flex items-center">
              <img 
                src="/images/taitung-fire-dept-logo.png" 
                alt="台東縣消防局" 
                className="h-12 mr-3" 
              />
            </div>
            
            {/* 聯絡資訊和社群連結 */}
            <div className="text-center md:text-right space-y-2">
              <p className="text-gray-600">服務電話：<span className="font-semibold text-gray-900">(089)334547、348138</span></p>
              <p className="text-gray-500 text-sm">傳真：(089)346747</p>
              
              {/* 社群連結 */}
              <div className="flex items-center justify-center md:justify-end gap-3 mt-3">
                <span className="text-gray-600 text-sm">追蹤我們：</span>
                <a 
                  href="https://www.facebook.com/ttfd119/?locale=zh_TW" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a 
                  href="https://www.instagram.com/ttfd119/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-6 pt-6 text-center text-gray-500">
            <p>&copy; 2024 {APP_TITLE}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
