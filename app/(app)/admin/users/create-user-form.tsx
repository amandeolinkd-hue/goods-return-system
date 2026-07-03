"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUser, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ROLES, ROLE_LABELS } from "@/lib/roles";

export function CreateUserForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createUser, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="name" required>
          Name
        </Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="email" required>
          Email
        </Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="password" required>
          Temporary password
        </Label>
        <Input id="password" name="password" type="text" minLength={6} required />
      </div>
      <div>
        <Label htmlFor="role" required>
          Role
        </Label>
        <Select id="role" name="role" defaultValue="kalbadevi" required>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </div>

      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create user"}
        </Button>
        {state.error && <span className="text-sm text-destructive">{state.error}</span>}
        {state.success && <span className="text-sm text-success">{state.success}</span>}
      </div>
    </form>
  );
}
