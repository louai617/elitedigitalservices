// One-off: load the website's existing portfolio (prisma/portfolio-seed.json,
// exported from lib/projects-data.js) into the CRM. Skips slugs that already
// exist, so it is safe to run again.
//
//   node scripts/import-portfolio.mjs
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const db = new PrismaClient();
const items = JSON.parse(readFileSync(new URL("../prisma/portfolio-seed.json", import.meta.url), "utf8"));
let added = 0;
try {
  for (const item of items) {
    if (await db.portfolioItem.findUnique({ where: { slug: item.slug } })) continue;
    await db.portfolioItem.create({ data: { ...item, videoGroups: item.videoGroups ?? undefined, highlights: item.highlights ?? undefined } });
    added++;
  }
  const hidden = await db.portfolioItem.count({ where: { published: false } });
  console.log(`✓ portfolio: ${added} imported, ${await db.portfolioItem.count()} total (${hidden} hidden)`);
} finally {
  await db.$disconnect();
}
