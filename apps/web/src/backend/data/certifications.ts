import { db } from "@ea/db";

export async function listCertifications() {
  return await db.query.certifications.findMany();
}
