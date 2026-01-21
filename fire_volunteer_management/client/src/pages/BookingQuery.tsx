import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ArrowLeft, Search, Calendar, Users, Phone, Mail, Building, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link, useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

export default function BookingQuery() {
  const [, navigate] = useLocation();
  const [bookingNumber, setBookingNumber] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [searchBy, setSearchBy] = useState<"number" | "phone">("number");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 檢查 URL 參數中的成功訊息
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingNum = params.get('booking');
    if (bookingNum) {
      setSuccessMessage(bookingNum);
      // 8 秒後自動隱藏訊息
      setTimeout(() => setSuccessMessage(null), 8000);
      // 清除 URL 參數
      window.history.replaceState({}, '', '/booking/query');
    }
  }, []);

  const { refetch: refetchByNumber, isFetching: isFetchingByNumber } = trpc.bookings.getByNumber.useQuery(
    { bookingNumber },
    { 
      enabled: false,
      retry: false
    }
  );

  const { refetch: refetchByPhone, isFetching: isFetchingByPhone } = trpc.bookings.getByPhone.useQuery(
    { contactPhone },
    { 
      enabled: false,
      retry: false
    }
  );

  const cancelBooking = trpc.bookings.cancel.useMutation({
    onSuccess: () => {
      toast.success("預約已成功取消");
      setShowCancelDialog(false);
      // 重新查詢以更新狀態
      handleSearch();
    },
    onError: (error) => {
      toast.error("取消失敗", {
        description: error.message
      });
    }
  });

  const handleCancelBooking = () => {
    if (searchResult?.bookingNumber) {
      cancelBooking.mutate({ bookingNumber: searchResult.bookingNumber });
    }
  };

  const handleSearch = async () => {
    if (searchBy === "number") {
      if (!bookingNumber.trim()) {
        toast.error("請輸入預約編號");
        return;
      }
      const result = await refetchByNumber();
    
      if (result.data) {
        setSearchResult(result.data);
        toast.success("查詢成功");
      } else {
        setSearchResult(null);
        toast.error("查無此預約編號，請確認後重試");
      }
    } else {
      // 電話查詢
      if (!contactPhone.trim()) {
        toast.error("請輸入聯絡電話");
        return;
      }
      const result = await refetchByPhone();
    
      if (result.data) {
        setSearchResult(result.data);
        toast.success("查詢成功，顯示最近一筆預約記錄");
      } else {
        setSearchResult(null);
        toast.error("查無此電話號碼的預約記錄，請確認後重試");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: "待確認", className: "badge-pending" },
      confirmed: { label: "已確認", className: "badge-confirmed" },
      cancelled: { label: "已取消", className: "badge-cancelled" },
      completed: { label: "已完成", className: "badge-completed" }
    };
    
    const statusInfo = statusMap[status] || { label: status, className: "badge-status" };
    
    return (
      <span className={`badge-status ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === "group" ? "團體預約" : "一般民眾預約";
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

        <div className="max-w-3xl mx-auto space-y-6">
          {successMessage && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-lg font-semibold">預約成功！</AlertTitle>
              <AlertDescription className="text-base mt-2">
                您的預約編號：<span className="font-mono font-bold">{successMessage}</span>，請妥善保存以便查詢。
              </AlertDescription>
            </Alert>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">預約查詢</CardTitle>
              <CardDescription className="text-base">
                請輸入您的預約編號或聯絡電話查詢預約狀態
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 查詢方式選擇 */}
              <div className="flex gap-4 justify-center">
                <Button
                  variant={searchBy === "number" ? "default" : "outline"}
                  onClick={() => setSearchBy("number")}
                  className="flex-1 max-w-xs"
                >
                  使用預約編號查詢
                </Button>
                <Button
                  variant={searchBy === "phone" ? "default" : "outline"}
                  onClick={() => setSearchBy("phone")}
                  className="flex-1 max-w-xs"
                >
                  使用電話查詢
                </Button>
              </div>

              {/* 查詢輸入框 */}
              <div className="flex gap-4">
                <div className="flex-1">
                  {searchBy === "number" ? (
                    <>
                      <Label htmlFor="bookingNumber" className="sr-only">預約編號</Label>
                      <Input
                        id="bookingNumber"
                        placeholder="請輸入預約編號（例如：BK1234567890）"
                        value={bookingNumber}
                        onChange={(e) => setBookingNumber(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                    </>
                  ) : (
                    <>
                      <Label htmlFor="contactPhone" className="sr-only">聯絡電話</Label>
                      <Input
                        id="contactPhone"
                        placeholder="請輸入預約時留下的聯絡電話"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                    </>
                  )}
                </div>
                <Button 
                  onClick={handleSearch}
                  disabled={isFetchingByNumber || isFetchingByPhone}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {(isFetchingByNumber || isFetchingByPhone) ? "查詢中..." : "查詢"}
                </Button>
              </div>

              {/* 提示訊息 */}
              <p className="text-sm text-muted-foreground text-center">
                {searchBy === "number" 
                  ? "建議優先使用預約編號查詢，可在預約確認信中找到" 
                  : "電話查詢為備用方案，如未收到預約確認信可使用此方式"}
              </p>
            </CardContent>
          </Card>

          {searchResult && (
            <Card className="animate-fadeIn">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">預約詳情</CardTitle>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        預約編號：{searchResult.bookingNumber}
                      </span>
                      {getStatusBadge(searchResult.status)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-primary">
                      {getTypeBadge(searchResult.type)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg border-b pb-2">聯絡資訊</h4>
                    
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">聯絡人</div>
                        <div className="font-medium">{searchResult.contactName}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">聯絡電話</div>
                        <div className="font-medium">{searchResult.contactPhone}</div>
                      </div>
                    </div>

                    {searchResult.contactEmail && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="text-sm text-muted-foreground">聯絡信箱</div>
                          <div className="font-medium">{searchResult.contactEmail}</div>
                        </div>
                      </div>
                    )}

                    {searchResult.organizationName && (
                      <div className="flex items-start gap-3">
                        <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="text-sm text-muted-foreground">團體名稱</div>
                          <div className="font-medium">{searchResult.organizationName}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg border-b pb-2">參訪資訊</h4>
                    
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">參訪日期</div>
                        <div className="font-medium">
                          {format(new Date(searchResult.visitDate), "PPP", { locale: zhTW })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">參訪時段</div>
                        <div className="font-medium">{searchResult.visitTime}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">參訪人數</div>
                        <div className="font-medium">{searchResult.numberOfPeople} 人</div>
                      </div>
                    </div>
                  </div>
                </div>

                {searchResult.purpose && (
                  <div>
                    <h4 className="font-semibold mb-2">參訪目的</h4>
                    <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                      {searchResult.purpose}
                    </p>
                  </div>
                )}

                {searchResult.specialNeeds && (
                  <div>
                    <h4 className="font-semibold mb-2">特殊需求</h4>
                    <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                      {searchResult.specialNeeds}
                    </p>
                  </div>
                )}

                {searchResult.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">備註</h4>
                    <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                      {searchResult.notes}
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                    重要提醒
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                    <li>請於參訪當天準時報到，並攜帶預約編號</li>
                    <li>如需取消或變更預約，請提前聯絡我們</li>
                    <li>聯絡電話：(089) XXX-XXXX</li>
                  </ul>
                </div>

                {/* 取消預約按鈕 */}
                {searchResult.status !== 'cancelled' && searchResult.status !== 'completed' && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      variant="destructive"
                      onClick={() => setShowCancelDialog(true)}
                      disabled={cancelBooking.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      取消預約
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!searchResult && (
            <Card className="bg-muted/50">
              <CardContent className="py-12 text-center">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  請輸入預約編號進行查詢
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 取消預約確認對話框 */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認取消預約</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要取消這個預約嗎？取消後將無法復原。
              {searchResult?.contactEmail && (
                <span className="block mt-2 text-sm">
                  取消通知將發送至：{searchResult.contactEmail}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>不，保留預約</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              是，確認取消
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
