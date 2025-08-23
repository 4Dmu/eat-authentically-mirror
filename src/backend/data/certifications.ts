import { db } from "../db";

export async function listCertifications() {
  return await db.query.certifications.findMany();
}
