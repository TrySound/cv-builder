import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Add handle column to profile_index for caching
  await db.schema
    .alterTable("profile_index")
    .addColumn("handle", "text")
    .execute();

  // Create index for handle lookups
  await db.schema
    .createIndex("idx_profile_index_handle")
    .on("profile_index")
    .column("handle")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("idx_profile_index_handle").execute();
  await db.schema.alterTable("profile_index").dropColumn("handle").execute();
}
