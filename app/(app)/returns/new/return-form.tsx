"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AsyncCombobox } from "@/components/ui/async-combobox";
import { returnInputSchema, type ReturnInput } from "@/lib/validation";
import type { ReturnFormResult } from "@/lib/return-form";
import { ENTRY_FOR_OPTIONS, RETURN_REASONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ReturnInitialLabels = {
  party?: string;
  broker?: string;
  transport?: string;
  items?: (string | undefined)[];
};

export type FormValues = {
  billNo: string;
  entryFor: string;
  trackingNo: string;
  dated: string;
  postedOn: string;
  partyId: string;
  brokerId: string;
  transportId: string;
  totalValue: string;
  transportValue: string;
  otherCharges: string;
  returnReason: string;
  customReason: string;
  items: { qualityId: string; quantity: string; pieces: string }[];
};

const emptyItem = { qualityId: "", quantity: "", pieces: "" };

const blankValues: FormValues = {
  billNo: "",
  entryFor: "",
  trackingNo: "",
  dated: "",
  postedOn: "",
  partyId: "",
  brokerId: "",
  transportId: "",
  totalValue: "",
  transportValue: "",
  otherCharges: "",
  returnReason: "",
  customReason: "",
  items: [{ ...emptyItem }],
};

type Props = {
  action: (formData: FormData) => Promise<ReturnFormResult>;
  mode?: "create" | "edit";
  initial?: FormValues;
  initialLabels?: ReturnInitialLabels;
  returnId?: number;
  existingAttachmentUrl?: string | null;
  submitLabel?: string;
};

export function ReturnForm({
  action,
  mode = "create",
  initial,
  initialLabels,
  returnId,
  existingAttachmentUrl,
  submitLabel,
}: Props) {
  const router = useRouter();
  const [result, setResult] = useState<ReturnFormResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(returnInputSchema as any),
    defaultValues: initial ?? blankValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const selectedParty = watch("partyId");
  const returnReason = watch("returnReason");

  const onValid = (values: ReturnInput) => {
    const fd = new FormData();
    if (mode === "edit" && returnId) fd.set("returnId", String(returnId));
    fd.set("billNo", values.billNo ?? "");
    fd.set("entryFor", values.entryFor);
    fd.set("trackingNo", values.trackingNo ?? "");
    fd.set("dated", values.dated);
    fd.set("postedOn", values.postedOn ?? "");
    fd.set("partyId", String(values.partyId));
    fd.set("brokerId", String(values.brokerId));
    if (values.transportId) fd.set("transportId", String(values.transportId));
    if (values.totalValue !== undefined) fd.set("totalValue", String(values.totalValue));
    if (values.transportValue !== undefined) fd.set("transportValue", String(values.transportValue));
    if (values.otherCharges !== undefined) fd.set("otherCharges", String(values.otherCharges));
    fd.set("returnReason", values.returnReason);
    fd.set("customReason", values.customReason ?? "");
    fd.set("items", JSON.stringify(values.items));

    const file = fileRef.current?.files?.[0];
    if (file) fd.set("attachment", file);

    startTransition(async () => {
      const res = await action(fd);
      setResult(res);
      if (res.error) {
        toast.error(res.error);
      } else if (mode === "edit" && returnId) {
        toast.success("Changes saved");
        router.push(`/returns/${returnId}`);
        router.refresh();
      } else {
        toast.success(`Return ${res.displayId} saved`);
        reset(blankValues);
        if (fileRef.current) fileRef.current.value = "";
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  const err = (msg?: string) =>
    msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null;

  return (
    <form onSubmit={handleSubmit((v) => onValid(v as unknown as ReturnInput))} className="space-y-6">
      {result?.displayId && mode === "create" && (
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Return <strong>{result.displayId}</strong> saved successfully.
        </div>
      )}
      {result?.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {result.error}
        </div>
      )}

      {/* Basic details */}
      <Card>
        <CardHeader>
          <CardTitle>Basic details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="billNo">Bill No (if any)</Label>
            <Input id="billNo" {...register("billNo")} />
          </div>
          <div>
            <Label htmlFor="entryFor" required>
              Entry For
            </Label>
            <Select id="entryFor" {...register("entryFor")}>
              <option value="" disabled>
                Select an option
              </option>
              {ENTRY_FOR_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
            {err(errors.entryFor?.message)}
          </div>
          <div>
            <Label htmlFor="trackingNo">LR No (if any)</Label>
            <Input id="trackingNo" {...register("trackingNo")} />
          </div>
          <div>
            <Label htmlFor="dated" required>
              Date
            </Label>
            <Input id="dated" type="date" {...register("dated")} />
            {err(errors.dated?.message)}
          </div>
          <div>
            <Label htmlFor="postedOn">Posted to Bhiwandi Office On</Label>
            <Input id="postedOn" type="date" {...register("postedOn")} />
          </div>
          <div>
            <Label htmlFor="attachment">
              Attachment {mode === "edit" ? "(replace)" : "(if any)"}
            </Label>
            <Input id="attachment" type="file" ref={fileRef} />
            {existingAttachmentUrl && (
              <a
                href={existingAttachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-primary hover:underline"
              >
                View current attachment
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Party & broker */}
      <Card>
        <CardHeader>
          <CardTitle>Party details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="partyId" required>
              Party Name
            </Label>
            <Controller
              control={control}
              name="partyId"
              render={({ field }) => (
                <AsyncCombobox
                  type="party"
                  id="partyId"
                  value={field.value}
                  initialLabel={initialLabels?.party}
                  onChange={(v) => {
                    field.onChange(v);
                    setValue("brokerId", "");
                  }}
                  placeholder="Search party…"
                />
              )}
            />
            {err(errors.partyId?.message)}
          </div>
          <div>
            <Label htmlFor="brokerId" required>
              Broker Name
            </Label>
            <Controller
              control={control}
              name="brokerId"
              render={({ field }) => (
                <AsyncCombobox
                  type="broker"
                  id="brokerId"
                  value={field.value}
                  initialLabel={initialLabels?.broker}
                  params={selectedParty ? { partyId: selectedParty } : undefined}
                  disabled={!selectedParty}
                  onChange={(v) => field.onChange(v)}
                  placeholder={selectedParty ? "Select broker…" : "Select a party first"}
                />
              )}
            />
            {err(errors.brokerId?.message)}
          </div>
        </CardContent>
      </Card>

      {/* Quality lines */}
      <Card>
        <CardHeader>
          <CardTitle>Quality details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
            <div className="col-span-5">Quality</div>
            <div className="col-span-3">Quantity (Mtr)</div>
            <div className="col-span-2">Pcs</div>
            <div className="col-span-2" />
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-12 sm:col-span-5">
                <Controller
                  control={control}
                  name={`items.${index}.qualityId` as const}
                  render={({ field }) => (
                    <AsyncCombobox
                      type="quality"
                      value={field.value}
                      initialLabel={initialLabels?.items?.[index]}
                      onChange={(v) => field.onChange(v)}
                      placeholder="Search quality…"
                    />
                  )}
                />
                {err(errors.items?.[index]?.qualityId?.message)}
              </div>
              <div className="col-span-6 sm:col-span-3">
                <Input
                  type="number"
                  step="any"
                  placeholder="Qty"
                  {...register(`items.${index}.quantity` as const)}
                />
                {err(errors.items?.[index]?.quantity?.message)}
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input type="number" placeholder="Pcs" {...register(`items.${index}.pieces` as const)} />
              </div>
              <div className="col-span-2 flex gap-1">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length === 1}
                  aria-label="Remove line"
                >
                  −
                </Button>
              </div>
            </div>
          ))}
          {typeof errors.items?.message === "string" && err(errors.items.message)}
          <Button type="button" variant="secondary" size="sm" onClick={() => append({ ...emptyItem })}>
            + Add quality line
          </Button>
        </CardContent>
      </Card>

      {/* Transport & amounts */}
      <Card>
        <CardHeader>
          <CardTitle>Transport & amounts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="transportId">Transport Name</Label>
            <Controller
              control={control}
              name="transportId"
              render={({ field }) => (
                <AsyncCombobox
                  type="transport"
                  id="transportId"
                  value={field.value}
                  initialLabel={initialLabels?.transport}
                  onChange={(v) => field.onChange(v)}
                  allowClear
                  placeholder="Search transport… (optional)"
                />
              )}
            />
          </div>
          <div>
            <Label htmlFor="totalValue">Total Billing Amount</Label>
            <Input id="totalValue" type="number" step="any" {...register("totalValue")} />
          </div>
          <div>
            <Label htmlFor="transportValue">Transport (LR) Amount</Label>
            <Input id="transportValue" type="number" step="any" {...register("transportValue")} />
          </div>
          <div>
            <Label htmlFor="otherCharges">Other Charges (if any)</Label>
            <Input id="otherCharges" type="number" step="any" {...register("otherCharges")} />
          </div>
          <div>
            <Label htmlFor="returnReason" required>
              Reason of Return
            </Label>
            <Select id="returnReason" {...register("returnReason")}>
              <option value="" disabled>
                Select a reason
              </option>
              {RETURN_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
            {err(errors.returnReason?.message)}
            {returnReason === "Other" && (
              <div className="mt-2">
                <Input placeholder="Please specify…" {...register("customReason")} />
                {err(errors.customReason?.message)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 flex items-center gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-[var(--shadow-md)] backdrop-blur">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel ?? "Submit return"}
        </Button>
        {mode === "edit" && returnId && (
          <Button type="button" variant="outline" onClick={() => router.push(`/returns/${returnId}`)}>
            Cancel
          </Button>
        )}
        {mode === "create" && (
          <span className="hidden text-sm text-muted-foreground sm:inline">
            A unique LD-#### id is assigned automatically.
          </span>
        )}
      </div>
    </form>
  );
}
