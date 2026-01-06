import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
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
  ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";

const banners = [
  {
    image: "/images/banner1.jpg",
    title: "歡迎來到台東防災館",
    description: "學習防災知識，保護您與家人的安全"
  },
  {
    image: "/images/banner2.jpg",
    title: "互動式防災體驗",
    description: "透過實際操作，提升防災應變能力"
  },
  {
    image: "/images/banner3.jpg",
    title: "專業導覽服務",
    description: "由專業人員帶領，深入了解各項防災知識"
  }
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 導覽列 */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
              <Shield className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">{APP_TITLE}</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6 text-gray-700">
              <Link href="/" className="hover:text-green-600 transition-colors">首頁</Link>
              <Link href="/booking/group" className="hover:text-green-600 transition-colors">團體預約</Link>
              <Link href="/booking/individual" className="hover:text-green-600 transition-colors">一般民眾預約</Link>
              <Link href="/traffic" className="hover:text-green-600 transition-colors">交通指引</Link>
              <Link href="/booking/query" className="hover:text-green-600 transition-colors">預約查詢</Link>
              <Link href="/case/query" className="hover:text-green-600 transition-colors">案件查詢</Link>
              
              {isAuthenticated ? (
                <>
                  {user?.role === 'admin' && (
                    <Link href="/admin" className="hover:text-green-600 transition-colors">管理後台</Link>
                  )}
                  {user?.role === 'volunteer' && (
                    <Link href="/volunteer" className="hover:text-green-600 transition-colors">志工專區</Link>
                  )}
                  <span className="text-sm text-gray-900">歡迎，{user?.name}</span>
                </>
              ) : (
                <a href={getLoginUrl()}>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm">登入</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主視覺輪播 */}
      <div className="relative h-[600px] overflow-hidden bg-white">
        {banners.map((banner, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="container h-full flex items-center">
              <div className="grid md:grid-cols-2 gap-12 items-center w-full">
                <div className="space-y-8 text-left">
                  <h1 className="text-6xl md:text-7xl font-black text-gray-900 leading-tight">
                    {banner.title}
                  </h1>
                  <p className="text-2xl text-gray-500 leading-relaxed font-light">
                    {banner.description}
                  </p>
                  <div className="flex gap-4 pt-6">
                    <Link href="/booking/group">
                      <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white shadow-lg px-8 py-6 text-lg">
                        立即預約
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="hidden md:flex justify-center items-center">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-auto rounded-lg shadow-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <button
          onClick={prevSlide}
          className="absolute left-8 top-1/2 -translate-y-1/2 bg-gray-900/5 hover:bg-gray-900/10 p-3 rounded-full transition-all"
        >
          <ChevronLeft className="h-6 w-6 text-gray-900" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-8 top-1/2 -translate-y-1/2 bg-gray-900/5 hover:bg-gray-900/10 p-3 rounded-full transition-all"
        >
          <ChevronRight className="h-6 w-6 text-gray-900" />
        </button>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentSlide ? 'bg-gray-900 w-8' : 'bg-gray-300 w-1.5'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 快速預約區塊 */}
      <section className="section-padding bg-gradient-to-b from-background to-muted/30">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">快速預約</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link href="/booking/group">
              <Card className="hover-lift cursor-pointer border-2 hover:border-primary transition-all">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">團體預約</CardTitle>
                  <CardDescription className="text-base">
                    適合學校、機關、社團等團體參訪
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-4">20人以上團體優先</p>
                  <Button className="w-full">立即預約</Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/booking/individual">
              <Card className="hover-lift cursor-pointer border-2 hover:border-primary transition-all">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">一般民眾預約</CardTitle>
                  <CardDescription className="text-base">
                    個人或家庭參訪歡迎預約
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-4">1-19人彈性預約</p>
                  <Button className="w-full">立即預約</Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* 服務項目 */}
      <section className="section-padding">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">服務項目</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover-lift">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>導覽預約</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  提供團體與個人導覽預約服務，專業志工帶領參觀
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>案件查詢</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  消防局相關案件申請與進度查詢，即時掌握處理狀況
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <Truck className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle>送餐服務</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  志工送餐服務，提供路徑追蹤與QR Code驗證機制
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 關於我們 */}
      <section className="section-padding bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="/images/about.jpg"
                alt="關於台東防災館"
                className="rounded-xl shadow-2xl w-full"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">關於台東防災館</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  台東防災館致力於推廣防災教育，透過互動式體驗設施，讓民眾在實際操作中學習各項防災知識與技能。
                </p>
                <p>
                  我們提供專業的導覽服務，由經驗豐富的志工帶領參觀，深入淺出地介紹地震、火災、颱風等各類災害的預防與應變措施。
                </p>
                <p>
                  館內設有多項互動體驗設施，包括地震體驗平台、煙霧逃生體驗、消防設備操作等，讓參訪者能夠身歷其境地學習防災知識。
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 參訪流程 */}
      <section className="section-padding">
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
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center text-gray-900">
                <Shield className="h-6 w-6 mr-2 text-green-600" />
                {APP_TITLE}
              </h3>
              <p className="text-gray-600">
                推廣防災教育，守護家園安全
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">聯絡資訊</h3>
              <div className="space-y-2 text-gray-600">
                <p>地址：台東市更生北路616巷9號</p>
                <p>電話：(089) XXX-XXXX</p>
                <p>Email: info@taitung-disaster.gov.tw</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">開放時間</h3>
              <div className="space-y-2 text-gray-600">
                <p>週二至週日：09:00 - 17:00</p>
                <p>週一及國定假日休館</p>
                <p>最後入館時間：16:30</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2024 {APP_TITLE}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
