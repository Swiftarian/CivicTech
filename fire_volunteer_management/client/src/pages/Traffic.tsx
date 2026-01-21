import {
  MapPin,
  Bus,
  Car,
  Train,
  Navigation,
  Clock,
  FileText,
  AlertCircle,
  Phone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function Traffic() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 導覽列 */}
      <nav className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
            >
              <MapPin className="h-8 w-8" />
              <span className="text-xl font-bold">臺東災害警覺教育館</span>
            </Link>

            <div className="flex items-center space-x-6">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                返回首頁
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 頁首 */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            交通指引與參訪資訊
          </h1>
          <p className="text-xl opacity-90">臺東災害警覺教育館完整參訪指南</p>
        </div>
      </section>

      {/* 主要內容 */}
      <section className="py-12">
        <div className="container">
          {/* 開放時間與聯絡資訊 */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* 開放時間 */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-6 w-6 text-primary" />
                  開放時間
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-primary/5 rounded-lg p-4">
                    <p className="font-semibold text-lg mb-2">週一至週五</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">上午</p>
                        <p className="font-medium">09:00 ~ 12:00</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">下午</p>
                        <p className="font-medium">14:00 ~ 17:00</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">休館日：</p>
                    <p>• 每逢週六、週日</p>
                    <p>• 國定假日</p>
                    <p>• 春節期間</p>
                    <p>• 颱風天</p>
                    <p>• 公告之必要休館日</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 聯絡資訊 */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-6 w-6 text-primary" />
                  聯絡資訊
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-semibold mb-2">
                      臺東災害警覺教育館
                    </p>
                    <div className="space-y-2 text-muted-foreground">
                      <p className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 mt-0.5 text-primary" />
                        <span>台東市更生北路616巷9號</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        <span>
                          服務電話：
                          <span className="font-semibold text-foreground">
                            (089)334547、348138
                          </span>
                        </span>
                      </p>
                      <p className="text-sm">傳真：(089)346747</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="text-muted-foreground">
                      網路預約如有任何問題，可來電洽詢
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 預約說明 */}
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                預約報名說明
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">預約方式</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>
                          本館預約採
                          <span className="font-semibold text-foreground">
                            網路線上申請
                          </span>
                          （預約服務）
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>申請後，請務必至系統確認程序是否完成</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>相關預約完成確認，以本館網頁系統公告為主</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">申請時間</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>
                          為利本館安排導覽事宜，請於
                          <span className="font-semibold text-foreground">
                            5日前
                          </span>
                          （不含週六、日及例假日）提出申請
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>申請參觀時間相同者，先提出申請之單位為優先</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">人數限制</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>
                          本館僅受理
                          <span className="font-semibold text-foreground">
                            團體預約
                          </span>
                          申請
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>
                          人數須滿
                          <span className="font-semibold text-foreground">
                            10人以上，50人以下
                          </span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>每個時段（上、下午）最多50人以下為原則</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>得依情況調整合併導覽</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 入館須知 */}
          <Card className="mb-8 border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="h-6 w-6" />
                入館須知
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1 font-bold">1.</span>
                    <span className="text-muted-foreground">
                      本館僅投保公共意外責任險，如有其他需求請自行投保。
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1 font-bold">2.</span>
                    <span className="text-muted-foreground">
                      為維護參觀品質及活動安全，請依館方人員指示進行參觀活動。
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1 font-bold">3.</span>
                    <span className="text-muted-foreground">
                      參觀人員如有破壞本館設施器材者，應負賠償責任。
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1 font-bold">4.</span>
                    <span className="text-muted-foreground">
                      館內嚴格禁止嬉鬧、奔跑、喧嘩、飲食、抽菸、嚼食檳榔、攜帶寵物（視障者攜帶之導盲犬除外）等。
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1 font-bold">5.</span>
                    <span className="text-muted-foreground">
                      十二歲以下孩童，應有家長或成人陪同入館，並隨時注意孩童安全。
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 地圖 */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                館址位置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3682.8!2d121.1444!3d22.7583!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjLCsDQ1JzI5LjkiTiAxMjHCsDA4JzM5LjgiRQ!5e0!3m2!1szh-TW!2stw!4v1234567890123!5m2!1szh-TW!2stw&q=台東市更生北路616巷9號"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="臺東災害警覺教育館地圖"
                />
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
                    <p className="text-muted-foreground">
                      館內設有免費停車場，提供汽車及機車停車位
                    </p>
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
                      <li>搭乘市區公車</li>
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
                    <p className="text-muted-foreground">
                      團體預約可提前聯繫，我們將協助安排交通事宜
                    </p>
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
        </div>
      </section>

      {/* 頁尾 */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-16">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center">
              <img
                src="/images/taitung-fire-dept-logo.png"
                alt="台東縣消防局"
                className="h-12"
              />
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-600">
                服務電話：
                <span className="font-semibold text-gray-900">
                  (089)334547、348138
                </span>
              </p>
              <p className="text-gray-500 text-sm">傳真：(089)346747</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-gray-500">
            © 2024 台東防災館綜合管理系統 All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
