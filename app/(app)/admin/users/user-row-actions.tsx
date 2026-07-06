"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { setUserActive, setUserRole, deleteUser } from "./actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/roles";

export function UserRowActions({
  userId,
  name,
  role,
  active,
  isSelf,
}: {
  userId: number;
  name: string;
  role: Role;
  active: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteUser(userId);
      if (res.error) toast.error(res.error);
      else {
        toast.success(`Deleted "${name}"`);
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Select
        className="h-8 w-auto text-xs"
        value={role}
        disabled={pending || isSelf}
        onChange={(e) => {
          const next = e.target.value as Role;
          startTransition(() => setUserRole(userId, next));
        }}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </Select>

      <Button
        variant={active ? "outline" : "success"}
        size="sm"
        disabled={pending || isSelf}
        onClick={() => startTransition(() => setUserActive(userId, !active))}
      >
        {active ? "Deactivate" : "Activate"}
      </Button>

      <Button
        variant="destructive"
        size="icon"
        disabled={pending || isSelf}
        onClick={remove}
        aria-label="Delete user"
        title={isSelf ? "You cannot delete yourself" : "Delete user"}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
