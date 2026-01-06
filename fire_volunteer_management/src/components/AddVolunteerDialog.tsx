import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function AddVolunteerDialog() {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [formData, setFormData] = useState({
    employeeId: "",
    department: "",
    position: "",
    skills: "",
    availability: "",
  });

  const utils = trpc.useUtils();
  
  // 查詢所有使用者
  const { data: users = [] } = trpc.users.getAll.useQuery();

  const createVolunteer = trpc.volunteers.create.useMutation({
    onSuccess: () => {
      toast.success("志工建立成功");
      setOpen(false);
      setSelectedUserId("");
      setFormData({
        employeeId: "",
        department: "",
        position: "",
        skills: "",
        availability: "",
      });
      utils.volunteers.getAll.invalidate();
    },
    onError: (error) => {
      toast.error("建立失敗", { description: error.message });
    },
  });

  const handleSubmit = () => {
    if (!selectedUserId) {
      toast.error("請選擇使用者");
      return;
    }

    createVolunteer.mutate({
      userId: parseInt(selectedUserId),
      employeeId: formData.employeeId || undefined,
      department: formData.department || undefined,
      position: formData.position || undefined,
      skills: formData.skills || undefined,
      availability: formData.availability || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新增志工
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>新增志工</DialogTitle>
          <DialogDescription>
            填寫志工基本資料，建立新的志工帳號。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="userId" className="text-right">
              選擇使用者 *
            </Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="請選擇使用者" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name || user.email} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employeeId" className="text-right">
              員工編號
            </Label>
            <Input
              id="employeeId"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="col-span-3"
              placeholder="例如：V001"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">
              部門
            </Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="col-span-3"
              placeholder="例如：導覽組"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="position" className="text-right">
              職位
            </Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="col-span-3"
              placeholder="例如：導覽員"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="skills" className="text-right">
              專長技能
            </Label>
            <Textarea
              id="skills"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="col-span-3"
              placeholder="例如：導覽解說、活動支援、送餐服務"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="availability" className="text-right">
              可服務時段
            </Label>
            <Textarea
              id="availability"
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              className="col-span-3"
              placeholder="例如：週一至週五 09:00-17:00"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={createVolunteer.isPending}>
            {createVolunteer.isPending ? "建立中..." : "建立"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
