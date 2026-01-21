import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

interface VolunteerManagementByCategoryProps {
  volunteers: any[];
  onEdit: (volunteer: any) => void;
  onDelete: (volunteerId: number) => void;
}

export function VolunteerManagementByCategory({
  volunteers,
  onEdit,
  onDelete,
}: VolunteerManagementByCategoryProps) {
  const [guideVolunteersOpen, setGuideVolunteersOpen] = useState(true);
  const [deliveryVolunteersOpen, setDeliveryVolunteersOpen] = useState(true);

  // 按分類分組志工
  const guideVolunteers = volunteers.filter(
    v => v.volunteer.category === "導覽館志工"
  );
  const deliveryVolunteers = volunteers.filter(
    v => v.volunteer.category === "送餐志工"
  );

  const renderVolunteerTable = (volunteerList: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>姓名</TableHead>
          <TableHead>員工編號</TableHead>
          <TableHead>部門</TableHead>
          <TableHead>職位</TableHead>
          <TableHead>服務時數</TableHead>
          <TableHead>狀態</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {volunteerList.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="text-center text-muted-foreground"
            >
              目前沒有此分類的志工
            </TableCell>
          </TableRow>
        ) : (
          volunteerList.map(item => (
            <TableRow key={item.volunteer.id}>
              <TableCell className="font-medium">
                {item.user?.name || "-"}
              </TableCell>
              <TableCell>{item.volunteer.employeeId || "-"}</TableCell>
              <TableCell>{item.volunteer.department || "-"}</TableCell>
              <TableCell>{item.volunteer.position || "-"}</TableCell>
              <TableCell>{item.volunteer.totalHours || 0} 小時</TableCell>
              <TableCell>
                <span
                  className={`badge-status ${
                    item.volunteer.status === "active"
                      ? "badge-confirmed"
                      : item.volunteer.status === "inactive"
                        ? "bg-gray-100 text-gray-800"
                        : "badge-pending"
                  }`}
                >
                  {item.volunteer.status === "active"
                    ? "在職"
                    : item.volunteer.status === "inactive"
                      ? "離職"
                      : "請假中"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(item.volunteer)}
                  >
                    編輯
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(item.volunteer.id)}
                  >
                    刪除
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-4">
      {/* 導覽館志工 */}
      <Collapsible
        open={guideVolunteersOpen}
        onOpenChange={setGuideVolunteersOpen}
      >
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    導覽館志工
                    <span className="text-sm font-normal text-muted-foreground">
                      ({guideVolunteers.length} 人)
                    </span>
                  </CardTitle>
                  <CardDescription>負責館內導覽和參訪接待</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  {guideVolunteersOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>{renderVolunteerTable(guideVolunteers)}</CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 送餐志工 */}
      <Collapsible
        open={deliveryVolunteersOpen}
        onOpenChange={setDeliveryVolunteersOpen}
      >
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    送餐志工
                    <span className="text-sm font-normal text-muted-foreground">
                      ({deliveryVolunteers.length} 人)
                    </span>
                  </CardTitle>
                  <CardDescription>負責送餐服務和配送任務</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  {deliveryVolunteersOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {renderVolunteerTable(deliveryVolunteers)}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
