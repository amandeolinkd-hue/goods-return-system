"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { changeOwnPassword, type ChangePwState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<ChangePwState, FormData>(changeOwnPassword, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      formRef.current?.reset();
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4 max-w-sm">
      <div>
        <Label htmlFor="current" required>
          Current password
        </Label>
        <Input id="current" name="current" type={show ? "text" : "password"} autoComplete="current-password" required />
      </div>
      <div>
        <Label htmlFor="next" required>
          New password
        </Label>
        <div className="relative">
          <Input
            id="next"
            name="next"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            minLength={6}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label={show ? "Hide passwords" : "Show passwords"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">At least 6 characters.</p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
