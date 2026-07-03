"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, X } from "lucide-react";
import { markReceived } from "@/app/(app)/receiving/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReceiveAction({
  returnId,
  displayId,
  size = "sm",
}: {
  returnId: number;
  displayId?: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [transport, setTransport] = useState("");
  const [charges, setCharges] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      setError(null);
      const res = await markReceived(returnId, {
        bhiwandiTransportValue: transport,
        bhiwandiCharges: charges,
        notes,
      });
      if (res.error) setError(res.error);
      else {
        setOpen(false);
        router.refresh();
      }
    });

  return (
    <>
      <Button variant="success" size={size} onClick={() => setOpen(true)}>
        <PackageCheck className="h-4 w-4" />
        Mark received
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !pending && setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-pop)] animate-fade-in">
            <button
              onClick={() => !pending && setOpen(false)}
              className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-semibold tracking-tight">Confirm receipt</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mark {displayId ? <strong>{displayId}</strong> : "this return"} as received at Bhiwandi.
              Amounts are optional.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <Label htmlFor="rc-transport">Transport value (Balasaheb)</Label>
                <Input
                  id="rc-transport"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={transport}
                  onChange={(e) => setTransport(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="rc-charges">Bhiwandi transport &amp; other charges</Label>
                <Input
                  id="rc-charges"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={charges}
                  onChange={(e) => setCharges(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="rc-notes">Notes (optional)</Label>
                <Textarea
                  id="rc-notes"
                  rows={2}
                  placeholder="Anything to record about this receipt…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button variant="success" onClick={confirm} disabled={pending}>
                {pending ? "Saving…" : "Confirm receipt"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
