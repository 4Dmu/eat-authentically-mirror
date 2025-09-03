import { db } from "@/backend/db";
import { sql } from "drizzle-orm";

const isDryRun = process.argv.includes("--dry-run");

function sanitizeName(name: string) {
  if (typeof name !== "string") return name;

  // Normalize & strip diacritics (accents)
  let s = name.normalize("NFKD").replace(/\p{M}+/gu, "");

  // Common typography -> ASCII
  s = s
    .replace(/\u2018|\u2019|\u02BC/g, "'") // ‘ ’ → '
    .replace(/\u201C|\u201D/g, '"') // “ ” → "
    .replace(/\u2013|\u2014/g, "-") // – — → -
    .replace(/\u2026/g, "...") // … → ...
    .replace(/\u00A0/g, " "); // NBSP → space

  // Remove control chars (except \n\t if you want to keep them)
  s = s.replace(/[\u0000-\u001F\u007F]/g, " ");

  // Collapse whitespace, trim
  s = s.replace(/\s+/g, " ").trim();

  // Finally, strip any remaining non-ASCII as a last resort
  s = s.replace(/[^\x20-\x7E]/g, "");

  return s;
}

// --- 3) Main ---------------------------------------------------------------
async function main() {
  // Find names with non-ASCII chars (outside 0x20–0x7E)
  const res = await db.run(
    sql`SELECT id, name FROM producers WHERE name GLOB '*[^ -~]*'`,
  );

  if (res.rows.length === 0) {
    console.log("No producer names with non-ASCII characters found. ✅");
    process.exit(0);
  }

  console.log(`Found ${res.rows.length} producers to review.`);

  // Use a transaction for safety
  await db.transaction(async (tx) => {
    for (const row of res.rows) {
      const id = row.id;
      const oldName = row.name?.toString() ?? "";
      const newName = sanitizeName(oldName);

      if (!newName || newName === oldName) {
        console.log(`Skip id=${id} (no change) :: "${oldName}"`);
        continue;
      }

      if (isDryRun) {
        console.log(
          `DRY RUN  id=${id}\n  OLD: ${oldName}\n  NEW: ${newName}\n`,
        );
      } else {
        await tx.run(
          sql`UPDATE producers SET name = ${newName} WHERE id = ${id}`,
        );
        console.log(`Updated id=${id}\n  OLD: ${oldName}\n  NEW: ${newName}\n`);
      }
    }
  });

  if (isDryRun) {
    console.log("Dry run complete. No changes were written.");
  } else {
    console.log("All applicable names updated. ✅");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
