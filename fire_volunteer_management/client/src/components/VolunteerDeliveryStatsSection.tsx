import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { trpc } from "@/lib/trpc";
import {
  Users,
  CheckCircle,
  Truck,
  Package,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function VolunteerDeliveryStatsSection() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: stats, isLoading } =
    trpc.mealDeliveries.getVolunteerDeliveryStats.useQuery();

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>志工送餐績效統計</CardTitle>
          <CardDescription>載入中...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>志工送餐績效統計</CardTitle>
          <CardDescription>目前沒有志工送餐記錄</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-8">
      <Card>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <div>
                  <CardTitle>志工送餐績效統計</CardTitle>
                  <CardDescription>
                    查看每位志工的送餐任務完成情況
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto">
                {isOpen ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    收起
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    展開 ({stats.length} 位志工)
                  </>
                )}
              </Button>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stats.map(volunteer => (
                <Card
                  key={volunteer.volunteerId}
                  className="border-2 hover:border-primary/50 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {volunteer.userName || "未設定姓名"}
                        </CardTitle>
                        {volunteer.employeeId && (
                          <p className="text-xs text-muted-foreground mt-1">
                            編號：{volunteer.employeeId}
                          </p>
                        )}
                        {volunteer.department && (
                          <p className="text-xs text-muted-foreground">
                            {volunteer.department}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {volunteer.total} 筆
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>已完成</span>
                      </div>
                      <span className="font-semibold">
                        {volunteer.completed}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Truck className="h-4 w-4" />
                        <span>配送中</span>
                      </div>
                      <span className="font-semibold">
                        {volunteer.inProgress}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-orange-600">
                        <Package className="h-4 w-4" />
                        <span>待配送</span>
                      </div>
                      <span className="font-semibold">
                        {volunteer.assigned}
                      </span>
                    </div>
                    {volunteer.pending > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Package className="h-4 w-4" />
                          <span>待指派</span>
                        </div>
                        <span className="font-semibold">
                          {volunteer.pending}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>完成率</span>
                        <span className="text-primary">
                          {volunteer.total > 0
                            ? Math.round(
                                (volunteer.completed / volunteer.total) * 100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
