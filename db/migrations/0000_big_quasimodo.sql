CREATE TYPE "public"."return_status" AS ENUM('posted', 'received');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'kalbadevi', 'bhiwandi');--> statement-breakpoint
CREATE SEQUENCE "public"."return_display_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "brokers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	CONSTRAINT "brokers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	CONSTRAINT "parties_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "party_brokers" (
	"party_id" integer NOT NULL,
	"broker_id" integer NOT NULL,
	CONSTRAINT "party_brokers_party_id_broker_id_pk" PRIMARY KEY("party_id","broker_id")
);
--> statement-breakpoint
CREATE TABLE "qualities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	CONSTRAINT "qualities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "return_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"return_id" integer NOT NULL,
	"quality_id" integer,
	"quality_name" varchar(255),
	"quantity" numeric(14, 3),
	"pieces" integer
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"display_id" varchar(20) NOT NULL,
	"bill_no" varchar(100),
	"entry_for" varchar(100) NOT NULL,
	"tracking_no" varchar(100),
	"dated" date NOT NULL,
	"posted_on" date,
	"party_id" integer NOT NULL,
	"broker_id" integer NOT NULL,
	"transport_id" integer,
	"total_value" numeric(14, 2),
	"transport_value" numeric(14, 2),
	"other_charges" numeric(14, 2),
	"return_reason" varchar(255) NOT NULL,
	"custom_reason" text,
	"attachment_url" text,
	"status" "return_status" DEFAULT 'posted' NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"received_by" integer,
	"received_at" timestamp with time zone,
	"receiving_notes" text,
	CONSTRAINT "returns_display_id_unique" UNIQUE("display_id")
);
--> statement-breakpoint
CREATE TABLE "transports" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	CONSTRAINT "transports_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'kalbadevi' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "party_brokers" ADD CONSTRAINT "party_brokers_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_brokers" ADD CONSTRAINT "party_brokers_broker_id_brokers_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_id_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."returns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_quality_id_qualities_id_fk" FOREIGN KEY ("quality_id") REFERENCES "public"."qualities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_broker_id_brokers_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_transport_id_transports_id_fk" FOREIGN KEY ("transport_id") REFERENCES "public"."transports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;