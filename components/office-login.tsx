"use client";

import { useState, useTransition } from "react";
import { Building2, PackageCheck, ArrowRight, Loader2 } from "lucide-react";
import { signInAs } from "@/app/login/actions";

type Office = "head" | "bhiwandi";

const CARDS: {
  office: Office;
  title: string;
  desc: string;
  icon: typeof Building2;
  c1: string;
  c2: string;
}[] = [
  {
    office: "head",
    title: "Head Office",
    desc: "Create & manage returns, reports and master data",
    icon: Building2,
    c1: "#4f46e5",
    c2: "#7c3aed",
  },
  {
    office: "bhiwandi",
    title: "Bhiwandi Office",
    desc: "Receive incoming goods and confirm charges",
    icon: PackageCheck,
    c1: "#0d9488",
    c2: "#10b981",
  },
];

export function OfficeLogin() {
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState<Office | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = (office: Office) => {
    setActive(office);
    setError(null);
    startTransition(async () => {
      const res = await signInAs(office);
      if (res?.error) {
        setError(res.error);
        setActive(null);
      }
    });
  };

  return (
    <div className="space-y-3">
      {CARDS.map(({ office, title, desc, icon: Icon, c1, c2 }) => {
        const busy = pending && active === office;
        return (
          <button
            key={office}
            type="button"
            onClick={() => choose(office)}
            disabled={pending}
            style={{ ["--c1"]: c1, ["--c2"]: c2 } as React.CSSProperties}
            className="office-btn flex w-full items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3.5 text-left shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            <span className="office-tile flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-[22px] w-[22px]" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-foreground">{title}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{desc}</span>
            </span>
            <ArrowRight className="office-arrow h-5 w-5 shrink-0 text-muted-foreground" />
          </button>
        );
      })}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="pt-1 text-center text-xs text-muted-foreground">
        Choose your office to continue.
      </p>
    </div>
  );
}
