import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ArrowLeft, Search, Calendar, Users, Phone, Mail, Building } from "lucide-react";
import { Link } from "wouter";

export default function BookingQuery() {
  const [bookingNumber, setBookingNumber] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);

  const { refetch, isFetching } = trpc.bookings.getByNumber.useQuery(
    { bookingNumber },
    { 
      enabled: false,
      retry: false
    }
  );

  const handleSearch = async () => {
    if (!bookingNumber.trim()) {
      toast.error("請輸入預約編號");
      return;
    }

    const result = await refetch();
    
    if (result.data) {
      setSearchResult(result.data);
      toast.success("查詢成功");
    } else {
      setSearchResult(null);
      toast.error("查無此預約編號，請確認後重試");
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
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">預約查詢</CardTitle>
              <CardDescription className="text-base">
                請輸入您的預約編號查詢預約狀態
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="bookingNumber" className="sr-only">預約編號</Label>
                  <Input
                    id="bookingNumber"
                    placeholder="請輸入預約編號（例如：BK1234567890）"
                    value={bookingNumber}
                    onChange={(e) => setBookingNumber(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  disabled={isFetching}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isFetching ? "查詢中..." : "查詢"}
                </Button>
              </div>
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
    </div>
  );
}
