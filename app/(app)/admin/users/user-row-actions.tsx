"use client";

import { useTransition } from "react";
import { setUserActive, setUserRole } from "./actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/roles";

export function UserRowActions({
  userId,
  role,
  active,
  isSelf,
}: {
  userId: number;
  role: Role;
  active: boolean;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

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
    </div>
  );
}
