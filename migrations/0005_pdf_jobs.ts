import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("pdf_jobs")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("status", "text", (col) => col.notNull())
    .addColumn("result", "jsonb")
    .addColumn("error", "text")
    .addColumn("retry_count", "integer", (col) => col.defaultTo(0))
    .addColumn("created_at", "timestamptz", (col) => col.defaultTo(sql`NOW()`))
    .addColumn("updated_at", "timestamptz", (col) => col.defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createIndex("idx_pdf_jobs_status")
    .on("pdf_jobs")
    .column("status")
    .execute();

  await db.schema
    .createIndex("idx_pdf_jobs_created_at")
    .on("pdf_jobs")
    .column("created_at")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("pdf_jobs").execute();
}
