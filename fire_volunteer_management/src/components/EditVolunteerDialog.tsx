import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EditVolunteerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteer: {
    id: number;
    employeeId?: string | null;
    department?: string | null;
    position?: string | null;
    skills?: string | null;
    availability?: string | null;
    status: "active" | "inactive" | "leave";
  };
  onSuccess: () => void;
}

export function EditVolunteerDialog({
  open,
  onOpenChange,
  volunteer,
  onSuccess,
}: EditVolunteerDialogProps) {
  const [formData, setFormData] = useState({
    employeeId: volunteer.employeeId || "",
    department: volunteer.department || "",
    position: volunteer.position || "",
    skills: volunteer.skills || "",
    availability: volunteer.availability || "",
    status: volunteer.status as "active" | "inactive" | "leave",
  });

  useEffect(() => {
    setFormData({
      employeeId: volunteer.employeeId || "",
      department: volunteer.department || "",
      position: volunteer.position || "",
      skills: volunteer.skills || "",
      availability: volunteer.availability || "",
      status: volunteer.status,
    });
  }, [volunteer]);

  const updateVolunteer = trpc.volunteers.update.useMutation({
    onSuccess: () => {
      toast.success("志工資料已更新");
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("更新失敗", { description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateVolunteer.mutate({
      id: volunteer.id,
      ...formData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>編輯志工資料</DialogTitle>
          <DialogDescription>
            修改志工的基本資訊和狀態
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="employeeId">員工編號</Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="例如：V001"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="department">部門</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="例如：導覽組"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="position">職位</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="例如：導覽員"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="skills">專長</Label>
              <Textarea
                id="skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="例如：防災知識、急救技能"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="availability">可服務時段</Label>
              <Textarea
                id="availability"
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                placeholder="例如：週一至週五 09:00-17:00"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">狀態</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive" | "leave") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">在職</SelectItem>
                  <SelectItem value="leave">請假中</SelectItem>
                  <SelectItem value="inactive">離職</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateVolunteer.isPending}
            >
              取消
            </Button>
            <Button type="submit" disabled={updateVolunteer.isPending}>
              {updateVolunteer.isPending ? "更新中..." : "儲存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
