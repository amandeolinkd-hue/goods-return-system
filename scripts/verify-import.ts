import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const { db } = await import("../db/index");
  const { sql } = await import("drizzle-orm");

  const counts = await db.execute(sql`
    select
      (select count(*) from returns) as returns,
      (select count(*) from returns where status = 'received') as received,
      (select count(*) from returns where status = 'posted') as pending,
      (select count(*) from return_items) as items,
      (select count(*) from parties) as parties,
      (select count(*) from brokers) as brokers,
      (select count(*) from qualities) as qualities,
      (select count(*) from transports) as transports,
      (select count(*) from party_brokers) as party_brokers
  `);
  console.log("COUNTS:", counts.rows[0]);

  // A received return with Bhiwandi amounts
  const withCharges = await db.execute(sql`
    select display_id, status, received_at, bhiwandi_transport_value, bhiwandi_charges
    from returns
    where bhiwandi_charges is not null and bhiwandi_charges <> '0'
    order by id limit 3
  `);
  console.log("\nRECEIVED w/ Bhiwandi charges:", withCharges.rows);

  // Multi-fabric split check
  const multi = await db.execute(sql`
    select r.display_id, count(ri.id) as lines,
      string_agg(ri.quality_name || ' x' || ri.quantity, ' | ') as items
    from returns r join return_items ri on ri.return_id = r.id
    group by r.display_id having count(ri.id) > 1
    order by count(ri.id) desc limit 3
  `);
  console.log("\nMULTI-LINE returns:", multi.rows);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
