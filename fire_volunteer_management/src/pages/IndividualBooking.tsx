import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function IndividualBooking() {
  const [, setLocation] = useLocation();
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    numberOfPeople: "",
    visitTime: "",
    purpose: "",
    specialNeeds: ""
  });

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      toast.success("預約成功！", {
        description: `您的預約編號：${data.bookingNumber}，請妥善保存以便查詢。`
      });
      setFormData({
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        numberOfPeople: "",
        visitTime: "",
        purpose: "",
        specialNeeds: ""
      });
      setDate(undefined);
      
      setTimeout(() => {
        setLocation("/booking/query");
      }, 3000);
    },
    onError: (error) => {
      toast.error("預約失敗", {
        description: error.message
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast.error("請選擇參訪日期");
      return;
    }

    const numberOfPeople = parseInt(formData.numberOfPeople);
    if (numberOfPeople < 1 || numberOfPeople > 19) {
      toast.error("一般民眾預約人數需在1-19人之間");
      return;
    }

    createBooking.mutate({
      type: "individual",
      contactName: formData.contactName,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail || undefined,
      numberOfPeople,
      visitDate: date,
      visitTime: formData.visitTime,
      purpose: formData.purpose || undefined,
      specialNeeds: formData.specialNeeds || undefined
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
            <CardTitle className="text-3xl">一般民眾預約</CardTitle>
            <CardDescription className="text-base">
              適合1-19人的個人或家庭參訪，請填寫以下資訊完成預約
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactName">聯絡人姓名 *</Label>
                  <Input
                    id="contactName"
                    required
                    value={formData.contactName}
                    onChange={(e) => handleInputChange("contactName", e.target.value)}
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
                    onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                    placeholder="請輸入聯絡電話"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">聯絡信箱</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    placeholder="請輸入聯絡信箱"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfPeople">參訪人數 *</Label>
                  <Input
                    id="numberOfPeople"
                    required
                    type="number"
                    min="1"
                    max="19"
                    value={formData.numberOfPeople}
                    onChange={(e) => handleInputChange("numberOfPeople", e.target.value)}
                    placeholder="1-19人"
                  />
                  <p className="text-sm text-muted-foreground">一般民眾預約人數需在1-19人之間</p>
                </div>

                <div className="space-y-2">
                  <Label>參訪日期 *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: zhTW }) : "選擇日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) => date < new Date()}
                        locale={zhTW}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitTime">參訪時段 *</Label>
                  <Select
                    required
                    value={formData.visitTime}
                    onValueChange={(value) => handleInputChange("visitTime", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="請選擇參訪時段" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00-10:00">09:00-10:00</SelectItem>
                      <SelectItem value="10:00-11:00">10:00-11:00</SelectItem>
                      <SelectItem value="11:00-12:00">11:00-12:00</SelectItem>
                      <SelectItem value="14:00-15:00">14:00-15:00</SelectItem>
                      <SelectItem value="15:00-16:00">15:00-16:00</SelectItem>
                      <SelectItem value="16:00-17:00">16:00-17:00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="purpose">參訪目的</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => handleInputChange("purpose", e.target.value)}
                    placeholder="例如：家庭教育、個人學習等"
                    rows={3}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="specialNeeds">特殊需求</Label>
                  <Textarea
                    id="specialNeeds"
                    value={formData.specialNeeds}
                    onChange={(e) => handleInputChange("specialNeeds", e.target.value)}
                    placeholder="例如：無障礙設施需求、嬰兒車等"
                    rows={3}
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">注意事項：</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>一般民眾預約人數需在1-19人之間</li>
                  <li>建議提前1天完成預約</li>
                  <li>預約成功後將收到確認通知與預約編號</li>
                  <li>如需取消或變更，請提前1天聯絡我們</li>
                  <li>參訪當天請準時報到，並攜帶預約編號</li>
                  <li>館內禁止飲食、吸煙，請配合工作人員指示</li>
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
