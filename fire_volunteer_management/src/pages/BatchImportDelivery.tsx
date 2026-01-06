import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Plus, Trash2, MapPin } from "lucide-react";
import { useLocation } from "wouter";

interface DeliveryAddress {
  recipientName: string;
  deliveryAddress: string;
  recipientPhone: string;
}

export default function BatchImportDelivery() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [textInput, setTextInput] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("11:00-12:00");
  const [mealType, setMealType] = useState("午餐便當");

  const createBatchMutation = trpc.mealDeliveries.createBatch.useMutation({
    onSuccess: () => {
      toast.success("批量建立送餐任務成功！");
      setAddresses([]);
      setTextInput("");
      setLocation("/meal-delivery");
    },
    onError: (error: any) => {
      toast.error(`建立失敗：${error.message}`);
    },
  });

  const parseTextInput = () => {
    const lines = textInput.trim().split("\n");
    const parsed: DeliveryAddress[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      
      // 格式：王小明,台東市中華路一段100號,0912-345-678
      const parts = line.split(",").map(p => p.trim());
      
      if (parts.length >= 3) {
        parsed.push({
          recipientName: parts[0],
          deliveryAddress: parts[1],
          recipientPhone: parts[2],
        });
      }
    }

    if (parsed.length === 0) {
      toast.error("無法解析輸入資料，請確認格式正確");
      return;
    }

    setAddresses(parsed);
    toast.success(`成功解析 ${parsed.length} 筆送餐地址`);
  };

  const addManualAddress = () => {
    setAddresses([
      ...addresses,
      {
        recipientName: "",
        deliveryAddress: "",
        recipientPhone: "",
      },
    ]);
  };

  const updateAddress = (index: number, field: keyof DeliveryAddress, value: string) => {
    const updated = [...addresses];
    updated[index][field] = value;
    setAddresses(updated);
  };

  const removeAddress = (index: number) => {
    setAddresses(addresses.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (addresses.length === 0) {
      toast.error("請至少新增一筆送餐地址");
      return;
    }

    if (!deliveryDate) {
      toast.error("請選擇送餐日期");
      return;
    }

    // 驗證所有地址都已填寫
    const incomplete = addresses.some(
      addr => !addr.recipientName || !addr.deliveryAddress || !addr.recipientPhone
    );

    if (incomplete) {
      toast.error("請填寫所有送餐地址的完整資訊");
      return;
    }

    createBatchMutation.mutate({
      deliveries: addresses.map(addr => ({
        ...addr,
        deliveryDate: new Date(deliveryDate),
        deliveryTime,
        mealType,
      })),
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">批量建立送餐任務</h1>
        <p className="text-muted-foreground">
          快速匯入多筆送餐地址，系統將自動規劃最佳配送路線
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 左側：文字輸入 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              文字批量匯入
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>輸入送餐地址（每行一筆）</Label>
              <p className="text-xs text-muted-foreground mb-2">
                格式：姓名,地址,電話（以逗號分隔）
              </p>
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="王小明,台東市中華路一段100號,0912-345-678&#10;李小華,台東市更生路200號,0923-456-789&#10;張大同,台東市鐵花路50號,0934-567-890"
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <Button onClick={parseTextInput} className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              解析並匯入
            </Button>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">範例格式：</p>
              <pre className="text-xs bg-muted p-3 rounded">
                王小明,台東市中華路一段100號,0912-345-678{"\n"}
                李小華,台東市更生路200號,0923-456-789{"\n"}
                張大同,台東市鐵花路50號,0934-567-890
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* 右側：地址列表 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  送餐地址列表 ({addresses.length})
                </span>
                <Button size="sm" variant="outline" onClick={addManualAddress}>
                  <Plus className="mr-1 h-4 w-4" />
                  手動新增
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>尚未新增送餐地址</p>
                  <p className="text-sm">請使用左側文字匯入或手動新增</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {addresses.map((addr, index) => (
                    <Card key={index} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">#{index + 1}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAddress(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <Input
                          placeholder="收餐人姓名"
                          value={addr.recipientName}
                          onChange={(e) => updateAddress(index, "recipientName", e.target.value)}
                        />
                        <Input
                          placeholder="送餐地址"
                          value={addr.deliveryAddress}
                          onChange={(e) => updateAddress(index, "deliveryAddress", e.target.value)}
                        />
                        <Input
                          placeholder="聯絡電話"
                          value={addr.recipientPhone}
                          onChange={(e) => updateAddress(index, "recipientPhone", e.target.value)}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 送餐資訊 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">送餐資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>送餐日期</Label>
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
              <div>
                <Label>送餐時段</Label>
                <Input
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  placeholder="例如：11:00-12:00"
                />
              </div>
              <div>
                <Label>餐點類型</Label>
                <Input
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  placeholder="例如：午餐便當"
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full"
                size="lg"
                disabled={addresses.length === 0 || createBatchMutation.isPending}
              >
                {createBatchMutation.isPending ? "建立中..." : `建立 ${addresses.length} 筆送餐任務`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
