import { MapPin, Bus, Car, Train, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function Traffic() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 導覽列 */}
      <nav className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
              <MapPin className="h-8 w-8" />
              <span className="text-xl font-bold">台東防災館</span>
            </Link>
            
            <div className="flex items-center space-x-6">
              <Link href="/" className="hover:opacity-80 transition-opacity">返回首頁</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 頁首 */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">交通指引</h1>
          <p className="text-xl opacity-90">如何前往台東防災館</p>
        </div>
      </section>

      {/* 地址資訊 */}
      <section className="py-12">
        <div className="container">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                館址資訊
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-semibold mb-2">台東縣消防局防災教育館</p>
                  <p className="text-muted-foreground">地址：台東市更生北路616巷9號</p>
                  <p className="text-muted-foreground">電話：(089) XXX-XXXX</p>
                </div>
                <div className="aspect-video w-full rounded-lg overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3682.8!2d121.1444!3d22.7583!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjLCsDQ1JzI5LjkiTiAxMjHCsDA4JzM5LjgiRQ!5e0!3m2!1szh-TW!2stw!4v1234567890123!5m2!1szh-TW!2stw&q=台東市更生北路616巷9號"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="台東防災館地圖"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 交通方式 */}
          <h2 className="text-3xl font-bold mb-6 text-center">交通方式</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* 自行開車 */}
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-6 w-6 text-primary" />
                  自行開車
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">從台東市區</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>沿中華路往北行駛</li>
                      <li>轉入更生北路</li>
                      <li>於616巷左轉，直行即可抵達9號</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">從花蓮方向</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>行駛台11線或台9線南下</li>
                      <li>進入台東市區後轉中華路</li>
                      <li>依指標前往防災館</li>
                    </ul>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="font-semibold">停車資訊</p>
                    <p className="text-muted-foreground">館內設有免費停車場，提供汽車及機車停車位</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 大眾運輸 */}
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-6 w-6 text-primary" />
                  大眾運輸
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">公車路線</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>搭乘市區公車 XX 路</li>
                      <li>於「防災館」站下車</li>
                      <li>步行約 3 分鐘即可抵達</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">台鐵轉乘</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>於台東火車站下車</li>
                      <li>轉乘計程車約 10 分鐘</li>
                      <li>或步行約 20 分鐘</li>
                    </ul>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="font-semibold">建議事項</p>
                    <p className="text-muted-foreground">團體預約可提前聯繫，我們將協助安排交通事宜</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 其他交通資訊 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* 火車資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Train className="h-6 w-6 text-primary" />
                  火車資訊
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    搭乘台鐵至台東站，可選擇：
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>自強號：約 4-5 小時（從台北出發）</li>
                    <li>莒光號：約 5-6 小時（從台北出發）</li>
                    <li>普悠瑪號：約 3.5 小時（從台北出發）</li>
                  </ul>
                  <p className="text-sm text-muted-foreground pt-2">
                    建議提前訂票，尤其是假日及連續假期
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 導航建議 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-6 w-6 text-primary" />
                  導航建議
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold mb-2">Google Maps 導航</p>
                    <p className="text-muted-foreground text-sm">
                      搜尋「台東市更生北路616巷9號」即可開始導航
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">GPS 座標</p>
                    <p className="text-muted-foreground text-sm font-mono">
                      22.7583° N, 121.1444° E
                    </p>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      如有任何交通問題，歡迎來電洽詢
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 注意事項 */}
          <Card className="mt-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>參訪注意事項</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>團體預約請提前 7 天申請，以便安排導覽人員及停車位</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>館內禁止飲食、吸菸，請配合館內規定</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>如遇颱風、豪雨等天災，館方將視情況調整開放時間</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>建議穿著輕便服裝及運動鞋，方便參與體驗活動</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 頁尾 */}
      <footer className="bg-primary text-primary-foreground py-12 mt-16">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">台東防災館綜合管理系統</h3>
              <p className="opacity-80">推廣防災教育，守護家園安全</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">聯絡資訊</h4>
              <p className="opacity-80 text-sm">地址：台東市更生北路616巷9號</p>
              <p className="opacity-80 text-sm">電話：(089) XXX-XXXX</p>
              <p className="opacity-80 text-sm">Email: info@taitung-disaster.gov.tw</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">開放時間</h4>
              <p className="opacity-80 text-sm">週二至週日：09:00 - 17:00</p>
              <p className="opacity-80 text-sm">週一及國定假日休館</p>
              <p className="opacity-80 text-sm">最後入館時間：16:30</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-primary-foreground/20 text-center text-sm opacity-80">
            © 2024 台東防災館綜合管理系統 All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
