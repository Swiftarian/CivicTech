import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, ArrowLeft, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BookingEntry() {
  const [, setLocation] = useLocation();

  const handleBookingTypeSelect = (type: 'individual' | 'group') => {
    if (type === 'individual') {
      setLocation('/booking/individual');
    } else {
      setLocation('/booking/group');
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

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">預約參訪</h1>
            <p className="text-muted-foreground">
              請選擇您的參訪人數類型
            </p>
          </div>

          {/* 重要提示 */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>重要提醒：</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• 本館不接待散客（5人以下）</li>
                <li>• 大團體（超過60人）需分批預約</li>
                <li>• 請至少提前3天完成預約</li>
                <li>• 最早可預約時間為兩周後</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* 選擇卡片 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* 一般民眾預約 */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => handleBookingTypeSelect('individual')}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">一般民眾</CardTitle>
                <CardDescription className="text-lg font-semibold text-primary">
                  5~19人
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>適合對象：</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>家庭參訪</li>
                    <li>小型團體</li>
                    <li>社區組織</li>
                  </ul>
                </div>
                <Button className="w-full" size="lg">
                  選擇此類型
                </Button>
              </CardContent>
            </Card>

            {/* 團體預約 */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => handleBookingTypeSelect('group')}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">團體</CardTitle>
                <CardDescription className="text-lg font-semibold text-primary">
                  20~60人
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>適合對象：</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>學校校外教學</li>
                    <li>企業參訪</li>
                    <li>機關團體</li>
                  </ul>
                </div>
                <Button className="w-full" size="lg">
                  選擇此類型
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 注意事項 */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">預約須知</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p><strong>1. 預約時間限制：</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>最早可預約時間為兩周後</li>
                <li>請至少提前3天完成預約</li>
              </ul>
              
              <p className="mt-3"><strong>2. 人數規定：</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>一般民眾：5~19人（不接待5人以下散客）</li>
                <li>團體：20~60人（超過60人請分批預約）</li>
              </ul>
              
              <p className="mt-3"><strong>3. 預約確認：</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>預約成功後將收到確認Email與預約編號</li>
                <li>參訪當天請攜帶預約編號報到</li>
              </ul>
              
              <p className="mt-3"><strong>4. 變更與取消：</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>如需變更或取消，請提前2天聯絡我們</li>
                <li>聯絡電話：089-123456</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
