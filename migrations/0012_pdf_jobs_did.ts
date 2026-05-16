import { type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Add did column to pdf_jobs to track which user owns the job
  await db.schema
    .alterTable("pdf_jobs")
    .addColumn("did", "text")
    .execute();

  // Create index for did lookups
  await db.schema
    .createIndex("idx_pdf_jobs_did")
    .on("pdf_jobs")
    .column("did")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("idx_pdf_jobs_did").execute();
  await db.schema.alterTable("pdf_jobs").dropColumn("did").execute();
}
