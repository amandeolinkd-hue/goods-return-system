"use client";

import { useState, useTransition } from "react";
import { Building2, PackageCheck, ArrowRight, Loader2 } from "lucide-react";
import { signInAs } from "@/app/login/actions";

type Office = "head" | "bhiwandi";

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

  const cards: { office: Office; title: string; desc: string; icon: typeof Building2 }[] = [
    { office: "head", title: "Head Office", desc: "Create & manage returns, reports and master data", icon: Building2 },
    { office: "bhiwandi", title: "Bhiwandi Office", desc: "Receive incoming goods and confirm charges", icon: PackageCheck },
  ];

  return (
    <div className="space-y-3">
      {cards.map(({ office, title, desc, icon: Icon }) => {
        const isBusy = pending && active === office;
        return (
          <button
            key={office}
            type="button"
            onClick={() => choose(office)}
            disabled={pending}
            className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
              {isBusy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Icon className="h-6 w-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold">{title}</div>
              <div className="text-sm text-muted-foreground">{desc}</div>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
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
