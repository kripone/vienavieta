import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Gaida, līdz datubāze pieņem savienojumus (piem. tā tikko pārstartēta vai maina plānu).
 * Līdz ~2 minūtēm; pēc tam kļūda tiek izmesta tālāk.
 */
async function waitForDb(pool: Pool, attempts = 12) {
  for (let i = 1; ; i++) {
    try {
      await pool.query("select 1");
      return;
    } catch (err) {
      if (i >= attempts) throw err;
      console.log(`Datubāze vēl nav pieejama (${i}/${attempts}), mēģinu vēlreiz pēc 10 s…`);
      await sleep(10_000);
    }
  }
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await waitForDb(pool);
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  await pool.end();
  console.log("Migrācijas pielietotas.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
