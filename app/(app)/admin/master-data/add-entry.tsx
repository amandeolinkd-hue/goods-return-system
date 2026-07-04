"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { addMasterEntry } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MasterType } from "@/lib/master-data";

export function AddMasterEntry({ type, label }: { type: MasterType; label: string }) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await addMasterEntry(type, name);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.success);
        setName("");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={`Add a new ${label}…`}
        className="max-w-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <Button onClick={submit} disabled={pending || !name.trim()}>
        <Plus className="h-4 w-4" />
        {pending ? "Adding…" : "Add"}
      </Button>
    </div>
  );
}
