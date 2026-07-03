import {
  pgTable,
  pgEnum,
  pgSequence,
  serial,
  integer,
  text,
  varchar,
  numeric,
  boolean,
  date,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---- Enums ----
export const roleEnum = pgEnum("role", ["admin", "kalbadevi", "bhiwandi"]);
export const returnStatusEnum = pgEnum("return_status", ["posted", "received"]);

// Sequence that backs the human-readable LD-#### id (replaces the old "ID Tracker" sheet cell A2).
export const returnDisplaySeq = pgSequence("return_display_seq", {
  startWith: 1,
  increment: 1,
});

// ---- Users ----
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("kalbadevi"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Master data (from the old "Dropdown" sheet) ----
export const parties = pgTable("parties", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
});

export const brokers = pgTable("brokers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
});

// A party can map to many brokers (the old `brokerMappings`).
export const partyBrokers = pgTable(
  "party_brokers",
  {
    partyId: integer("party_id")
      .notNull()
      .references(() => parties.id, { onDelete: "cascade" }),
    brokerId: integer("broker_id")
      .notNull()
      .references(() => brokers.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.partyId, t.brokerId] })]
);

export const qualities = pgTable("qualities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
});

export const transports = pgTable("transports", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
});

// ---- Returns (the old "Kalbadevi Office Entry" sheet) ----
export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  displayId: varchar("display_id", { length: 20 }).notNull().unique(),
  billNo: varchar("bill_no", { length: 100 }),
  entryFor: varchar("entry_for", { length: 100 }).notNull(),
  trackingNo: varchar("tracking_no", { length: 100 }),
  dated: date("dated").notNull(),
  postedOn: date("posted_on"),
  partyId: integer("party_id")
    .notNull()
    .references(() => parties.id),
  brokerId: integer("broker_id")
    .notNull()
    .references(() => brokers.id),
  transportId: integer("transport_id").references(() => transports.id),
  totalValue: numeric("total_value", { precision: 14, scale: 2 }),
  transportValue: numeric("transport_value", { precision: 14, scale: 2 }),
  otherCharges: numeric("other_charges", { precision: 14, scale: 2 }),
  returnReason: varchar("return_reason", { length: 255 }).notNull(),
  customReason: text("custom_reason"),
  attachmentUrl: text("attachment_url"),
  status: returnStatusEnum("status").notNull().default("posted"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // Bhiwandi receiving confirmation (replaces the onEdit timestamp trigger).
  // receivedAt = the sheet's "Status Updated On"; status "posted" == "Pending".
  receivedBy: integer("received_by").references(() => users.id),
  receivedAt: timestamp("received_at", { withTimezone: true }),
  receivingNotes: text("receiving_notes"),
  // Amounts entered at the Bhiwandi office during receiving.
  // "Transport Value Entry From BALASAHEB" (sheet column N).
  bhiwandiTransportValue: numeric("bhiwandi_transport_value", { precision: 14, scale: 2 }),
  // "BHIWANDI TRANSPORT VALUE AND OTHER CHARGES" (sheet column Q).
  bhiwandiCharges: numeric("bhiwandi_charges", { precision: 14, scale: 2 }),
});

// ---- Return line items (replaces the "|"-joined quality/qty/pcs columns) ----
export const returnItems = pgTable("return_items", {
  id: serial("id").primaryKey(),
  returnId: integer("return_id")
    .notNull()
    .references(() => returns.id, { onDelete: "cascade" }),
  qualityId: integer("quality_id").references(() => qualities.id),
  // Snapshot of the quality name — resilient if master data changes, and used
  // during migration when an old value has no matching master row.
  qualityName: varchar("quality_name", { length: 255 }),
  quantity: numeric("quantity", { precision: 14, scale: 3 }),
  pieces: integer("pieces"),
});

// ---- Relations (for convenient joined queries) ----
export const partiesRelations = relations(parties, ({ many }) => ({
  partyBrokers: many(partyBrokers),
  returns: many(returns),
}));

export const brokersRelations = relations(brokers, ({ many }) => ({
  partyBrokers: many(partyBrokers),
}));

export const partyBrokersRelations = relations(partyBrokers, ({ one }) => ({
  party: one(parties, { fields: [partyBrokers.partyId], references: [parties.id] }),
  broker: one(brokers, { fields: [partyBrokers.brokerId], references: [brokers.id] }),
}));

export const returnsRelations = relations(returns, ({ one, many }) => ({
  party: one(parties, { fields: [returns.partyId], references: [parties.id] }),
  broker: one(brokers, { fields: [returns.brokerId], references: [brokers.id] }),
  transport: one(transports, { fields: [returns.transportId], references: [transports.id] }),
  createdByUser: one(users, { fields: [returns.createdBy], references: [users.id] }),
  receivedByUser: one(users, { fields: [returns.receivedBy], references: [users.id] }),
  items: many(returnItems),
}));

export const returnItemsRelations = relations(returnItems, ({ one }) => ({
  return: one(returns, { fields: [returnItems.returnId], references: [returns.id] }),
  quality: one(qualities, { fields: [returnItems.qualityId], references: [qualities.id] }),
}));

// ---- Inferred types ----
export type User = typeof users.$inferSelect;
export type Party = typeof parties.$inferSelect;
export type Broker = typeof brokers.$inferSelect;
export type Quality = typeof qualities.$inferSelect;
export type Transport = typeof transports.$inferSelect;
export type Return = typeof returns.$inferSelect;
export type ReturnItem = typeof returnItems.$inferSelect;
