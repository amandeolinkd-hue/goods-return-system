import { z } from "zod";
import { ENTRY_FOR_OPTIONS, RETURN_REASONS } from "@/lib/constants";

/** "" | null | undefined -> undefined, so optional numbers stay empty. */
const emptyToUndefined = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;

const optionalNumber = z.preprocess(emptyToUndefined, z.coerce.number().optional());
const optionalNonNegInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().nonnegative().optional()
);

export const returnItemSchema = z.object({
  qualityId: z.coerce.number().int().positive("Select a quality"),
  quantity: z.coerce.number().positive("Enter a quantity greater than 0"),
  pieces: optionalNonNegInt,
});

export const returnInputSchema = z
  .object({
    billNo: z.string().trim().optional(),
    entryFor: z.enum(ENTRY_FOR_OPTIONS),
    trackingNo: z.string().trim().optional(),
    dated: z.string().min(1, "Date is required"),
    postedOn: z.preprocess(emptyToUndefined, z.string().optional()),
    partyId: z.coerce.number().int().positive("Select a party"),
    brokerId: z.coerce.number().int().positive("Select a broker"),
    transportId: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().optional()
    ),
    totalValue: optionalNumber,
    transportValue: optionalNumber,
    otherCharges: optionalNumber,
    returnReason: z.enum(RETURN_REASONS),
    customReason: z.string().trim().optional(),
    items: z.array(returnItemSchema).min(1, "Add at least one quality line"),
  })
  .refine(
    (d) => d.returnReason !== "Other" || (d.customReason && d.customReason.length > 0),
    { message: "Please specify the reason", path: ["customReason"] }
  );

export type ReturnInput = z.infer<typeof returnInputSchema>;
export type ReturnItemInput = z.infer<typeof returnItemSchema>;
