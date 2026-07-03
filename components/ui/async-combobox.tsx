"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDown, Check, Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { id: number; name: string };

/**
 * Combobox whose options come from /api/master (server-side search).
 * Keeps pages light — nothing is preloaded; results stream in as you type.
 */
export function AsyncCombobox({
  type,
  value,
  initialLabel,
  onChange,
  params,
  placeholder = "Search…",
  disabled,
  allowClear,
  id,
}: {
  type: "party" | "broker" | "quality" | "transport";
  value: string;
  initialLabel?: string;
  onChange: (id: string, name: string) => void;
  params?: Record<string, string>;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState(initialLabel ?? "");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const paramsKey = useMemo(() => JSON.stringify(params ?? {}), [params]);

  // If the value is cleared externally (e.g. broker reset on party change), drop the label.
  useEffect(() => {
    if (!value) setLabel("");
  }, [value]);

  // Debounced fetch while open.
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const sp = new URLSearchParams({ type, q: query, ...(params ?? {}) });
        const res = await fetch(`/api/master?${sp.toString()}`);
        const data = await res.json();
        if (active) setOptions(data.options ?? []);
      } catch {
        if (active) setOptions([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 180);
    return () => {
      active = false;
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query, type, paramsKey]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery("");
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-sm shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !label && "text-muted-foreground"
        )}
      >
        <span className="truncate">{label || placeholder}</span>
        <span className="flex items-center gap-1">
          {allowClear && label && !disabled && (
            <X
              className="h-3.5 w-3.5 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onChange("", "");
                setLabel("");
              }}
            />
          )}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </span>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-pop)] animate-fade-in">
          <div className="flex items-center gap-2 border-b border-border px-3">
            {loading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search…"
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {!loading && options.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                {query ? "No matches" : "Type to search…"}
              </li>
            )}
            {options.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(String(o.id), o.name);
                    setLabel(o.name);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
                    String(o.id) === value && "bg-accent text-accent-foreground"
                  )}
                >
                  <span className="truncate">{o.name}</span>
                  {String(o.id) === value && <Check className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
