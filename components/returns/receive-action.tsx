"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markReceived } from "@/app/(app)/receiving/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReceiveAction({
  returnId,
  size = "sm",
}: {
  returnId: number;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const res = await markReceived(returnId, notes);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });

  if (!open) {
    return (
      <Button variant="success" size={size} onClick={() => setOpen(true)}>
        Mark received
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="sm:w-56"
      />
      <div className="flex gap-1">
        <Button variant="success" size="sm" disabled={pending} onClick={confirm}>
          {pending ? "Saving…" : "Confirm"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
