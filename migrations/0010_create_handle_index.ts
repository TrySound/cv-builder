import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Create handle_index table for caching DID -> handle mappings
  await db.schema
    .createTable("handle_index")
    .addColumn("did", "text", (col) => col.primaryKey())
    .addColumn("handle", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`NOW()`),
    )
    .execute();

  // Create index for handle lookups
  await db.schema
    .createIndex("idx_handle_index_handle")
    .on("handle_index")
    .column("handle")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("idx_handle_index_handle").execute();
  await db.schema.dropTable("handle_index").execute();
}
