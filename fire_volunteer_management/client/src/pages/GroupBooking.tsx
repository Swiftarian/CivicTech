import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function GroupBooking() {
  const [, setLocation] = useLocation();
  const [date, setDate] = useState<Date>();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    organizationName: "",
    adultCount: "",
    childCount: "",
    visitTime: "",
    arrivalTime: "",
    notes: "",
  });

  // 查詢當月的團體預約（只查groupBookings表）
  const { data: monthBookings } = trpc.bookings.getGroupByMonth.useQuery({
    year: currentMonth.getFullYear(),
    month: currentMonth.getMonth() + 1,
  });

  // 查詢選擇日期的可用時段（傳遞type參數以查詢團體預約表）
  const { data: timeSlotData } = trpc.bookings.getAvailableTimeSlots.useQuery(
    { date: date!, type: "group" },
    { enabled: !!date }
  );

  // 計算每日是否已滿額
  const getDateStatus = (checkDate: Date) => {
    if (!monthBookings) {
      return { isFull: false, bookedCount: 0, status: "available" as const };
    }

    // 使用 UTC 日期字串進行比較，避免時區轉換導致的日期偏移
    const dateStr = format(checkDate, "yyyy-MM-dd");
    const dayBookings = monthBookings.filter(b => {
      // 將 timestamp 轉換為 Date 物件，然後使用 UTC 方法取得年月日
      const bookingDate = new Date(b.visitDate);
      // 使用 UTC 方法取得年月日，避免時區轉換
      const year = bookingDate.getUTCFullYear();
      const month = String(bookingDate.getUTCMonth() + 1).padStart(2, "0");
      const day = String(bookingDate.getUTCDate()).padStart(2, "0");
      const bookingDateStr = `${year}-${month}-${day}`;
      return bookingDateStr === dateStr && b.status !== "cancelled";
    });

    // 使用Set去除重複時段，只計算唯一的已預約時段
    const bookedTimeSlotsSet = new Set(dayBookings.map(b => b.visitTime));
    const allTimeSlots = [
      "09:00-10:00",
      "10:00-11:00",
      "11:00-12:00",
      "14:00-15:00",
      "15:00-16:00",
      "16:00-17:00",
    ];

    const bookedCount = bookedTimeSlotsSet.size;
    // 只有當所有時段都被預約時才視為已滿額
    const isFull = bookedCount === allTimeSlots.length;

    // 決定顏色狀態
    let status: "available" | "partial" | "warning" | "full";
    if (bookedCount === 0) {
      status = "available"; // 綠色：所有時段可預約
    } else if (bookedCount <= 3) {
      status = "partial"; // 黃色：部分時段已預約（1-3個）
    } else if (bookedCount < allTimeSlots.length) {
      status = "warning"; // 橘色：即將額滿（4-5個）
    } else {
      status = "full"; // 紅色：所有時段已滿
    }

    return {
      isFull,
      bookedCount,
      status,
    };
  };

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: data => {
      setSuccessMessage(data.bookingNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success("預約成功！", {
        description: `您的預約編號：${data.bookingNumber}，請妥善保存以便查詢。`,
        duration: 8000,
        className: "text-lg",
      });
      // 重置表單
      setFormData({
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        organizationName: "",
        adultCount: "",
        childCount: "",
        visitTime: "",
        arrivalTime: "",
        notes: "",
      });
      setDate(undefined);

      // 3秒後跳轉到查詢頁面
      setTimeout(() => {
        setLocation(`/booking/query?booking=${data.bookingNumber}`);
      }, 3000);
    },
    onError: error => {
      toast.error("預約失敗", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error("請選擇參訪日期");
      return;
    }

    if (!formData.contactEmail || !formData.contactEmail.trim()) {
      toast.error("請輸入聯絡信箱");
      return;
    }

    // 驗證Email格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      toast.error("請輸入有效的Email地址");
      return;
    }

    const adultCount = parseInt(formData.adultCount);
    const childCount = parseInt(formData.childCount);
    const numberOfPeople = adultCount + childCount;

    if (numberOfPeople < 20 || numberOfPeople > 60) {
      toast.error("團體預約人數需在20-60人之間");
      return;
    }

    // 標準化日期為當天的 UTC 00:00:00，避免時區轉換問題
    const normalizedDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
    );

    createBooking.mutate({
      type: "group",
      contactName: formData.contactName,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      organizationName: formData.organizationName || undefined,
      numberOfPeople,
      adultCount,
      childCount,
      visitDate: normalizedDate,
      visitTime: formData.visitTime,
      arrivalTime: formData.arrivalTime || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">團體預約</CardTitle>
            <CardDescription className="text-base">
              適合20-50人的團體參訪，請填寫以下資訊完成預約
            </CardDescription>
          </CardHeader>
          <CardContent>
            {successMessage && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800 text-lg font-semibold">
                  預約成功！
                </AlertTitle>
                <AlertDescription className="text-green-700 text-base mt-2">
                  <p className="font-medium">
                    您的預約編號：
                    <span className="text-lg font-bold">{successMessage}</span>
                  </p>
                  <p className="mt-1">
                    請妥善保存以便查詢。我們已將確認信寄至您的信箱。
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        setLocation(`/booking/query?booking=${successMessage}`)
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      查詢預約
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSuccessMessage(null)}
                      className="border-green-600 text-green-700 hover:bg-green-50"
                    >
                      繼續預約
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactName">聯絡人姓名 *</Label>
                  <Input
                    id="contactName"
                    required
                    value={formData.contactName}
                    onChange={e =>
                      handleInputChange("contactName", e.target.value)
                    }
                    placeholder="請輸入聯絡人姓名"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">聯絡電話 *</Label>
                  <Input
                    id="contactPhone"
                    required
                    type="tel"
                    value={formData.contactPhone}
                    onChange={e =>
                      handleInputChange("contactPhone", e.target.value)
                    }
                    placeholder="請輸入聯絡電話"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">聯絡信箱 *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={e =>
                      handleInputChange("contactEmail", e.target.value)
                    }
                    placeholder="請輸入聯絡信箱"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationName">團體名稱 *</Label>
                  <Input
                    id="organizationName"
                    required
                    value={formData.organizationName}
                    onChange={e =>
                      handleInputChange("organizationName", e.target.value)
                    }
                    placeholder="例如：XX國小、XX公司"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adultCount">成人人數 *</Label>
                  <Input
                    id="adultCount"
                    required
                    type="number"
                    min="0"
                    value={formData.adultCount}
                    onChange={e =>
                      handleInputChange("adultCount", e.target.value)
                    }
                    placeholder="成人人數"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="childCount">兒童人數 *</Label>
                  <Input
                    id="childCount"
                    required
                    type="number"
                    min="0"
                    value={formData.childCount}
                    onChange={e =>
                      handleInputChange("childCount", e.target.value)
                    }
                    placeholder="兒童人數"
                  />
                  <p className="text-sm text-muted-foreground">
                    總人數需在20-60人之間
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>參訪日期 *</Label>
                  <div className="flex justify-center p-4 border rounded-lg bg-card">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      month={currentMonth}
                      onMonthChange={setCurrentMonth}
                      disabled={checkDate => {
                        // 禁用過去的日期
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (checkDate < today) return true;

                        // 禁用已滿額的日期
                        const status = getDateStatus(checkDate);
                        return status.isFull;
                      }}
                      locale={zhTW}
                      className="rounded-md"
                    />
                  </div>
                  {date && (
                    <p className="text-sm text-center text-muted-foreground">
                      已選擇：{format(date, "PPP", { locale: zhTW })}
                    </p>
                  )}

                  {/* 預約狀態說明 */}
                  <div className="mt-4 p-3 border rounded-lg bg-muted/30">
                    <h4 className="text-sm font-semibold mb-2">本月預約狀態</h4>
                    <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                      {(() => {
                        const year = currentMonth.getFullYear();
                        const month = currentMonth.getMonth();
                        const daysInMonth = new Date(
                          year,
                          month + 1,
                          0
                        ).getDate();
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const statusList = [];
                        for (let day = 1; day <= daysInMonth; day++) {
                          const checkDate = new Date(year, month, day);
                          if (checkDate < today) continue; // 跳過過去的日期

                          const status = getDateStatus(checkDate);
                          if (
                            status.bookedCount > 0 ||
                            status.status === "full"
                          ) {
                            statusList.push({
                              date: checkDate,
                              ...status,
                            });
                          }
                        }

                        if (statusList.length === 0) {
                          return (
                            <p className="text-muted-foreground">
                              本月尚無預約，所有日期均可預約
                            </p>
                          );
                        }

                        return statusList.map(
                          ({
                            date: statusDate,
                            status: dateStatus,
                            bookedCount,
                          }) => {
                            const dateStr = format(statusDate, "M月d日 (EEE)", {
                              locale: zhTW,
                            });
                            const statusText =
                              dateStatus === "full"
                                ? "已滿額"
                                : dateStatus === "warning"
                                  ? `即將額滿！剩餘 ${6 - bookedCount} 個時段`
                                  : `已預約 ${bookedCount}/6 個時段`;
                            const statusColor =
                              dateStatus === "full"
                                ? "text-red-600 font-semibold"
                                : dateStatus === "warning"
                                  ? "text-orange-600 font-semibold"
                                  : dateStatus === "partial"
                                    ? "text-yellow-700 font-medium"
                                    : "text-green-600";

                            return (
                              <div
                                key={statusDate.toISOString()}
                                className="flex justify-between items-center"
                              >
                                <span>{dateStr}</span>
                                <span className={statusColor}>
                                  {statusText}
                                </span>
                              </div>
                            );
                          }
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="visitTime">參訪時段 *</Label>
                  <Select
                    required
                    value={formData.visitTime}
                    onValueChange={value =>
                      handleInputChange("visitTime", value)
                    }
                    disabled={!date}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={date ? "請選擇參訪時段" : "請先選擇日期"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlotData?.allTimeSlots.map(slot => {
                        const isBooked =
                          timeSlotData.bookedTimeSlots.includes(slot);
                        return (
                          <SelectItem
                            key={slot}
                            value={slot}
                            disabled={isBooked}
                          >
                            {slot} {isBooked && "(已預約)"}
                          </SelectItem>
                        );
                      })}
                      {!timeSlotData && date && (
                        <SelectItem value="loading" disabled>
                          載入中...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {timeSlotData &&
                    timeSlotData.availableTimeSlots.length === 0 && (
                      <p className="text-sm text-destructive">
                        該日所有時段已滿，請選擇其他日期
                      </p>
                    )}
                  {timeSlotData &&
                    timeSlotData.availableTimeSlots.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        還有 {timeSlotData.availableTimeSlots.length} 個時段可選
                      </p>
                    )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">備註</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={e => handleInputChange("notes", e.target.value)}
                    placeholder="例如：無障礙設施需求、特殊飲食、參訪目的等"
                    rows={3}
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">注意事項：</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>團體預約人數需在20-50人之間</li>
                  <li>請至少提前3天完成預約</li>
                  <li>預約成功後將收到確認通知與預約編號</li>
                  <li>如需取消或變更，請提前2天聯絡我們</li>
                  <li>參訪當天請準時報到，並攜帶預約編號</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createBooking.isPending}
                >
                  {createBooking.isPending ? "預約中..." : "確認預約"}
                </Button>
                <Link href="/">
                  <Button type="button" variant="outline">
                    取消
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
