import { seedDatabase } from "../lib/db/seed";

async function main() {
  const result = await seedDatabase();
  console.log(
    `Done: ${result.plants} plants, ${result.relationships} relationships.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
