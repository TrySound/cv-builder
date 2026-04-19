import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Create profile_index table for public profile data synced from atproto
  await db.schema
    .createTable("profile_index")
    .addColumn("did", "text", (col) => col.primaryKey())
    .addColumn("name", "text")
    .addColumn("title", "text")
    .addColumn("country_code", "text")
    .addColumn("introduction", "text")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`NOW()`),
    )
    .execute();

  await db.schema
    .createIndex("idx_profile_index_did")
    .on("profile_index")
    .column("did")
    .execute();

  // Create profile_private table for private user data
  await db.schema
    .createTable("profile_private")
    .addColumn("did", "text", (col) => col.primaryKey())
    .addColumn("email", "text")
    .addColumn("status", "text", (col) =>
      col
        .notNull()
        .defaultTo("open_to_connect")
        .check(sql`status IN ('open_to_work', 'open_to_connect', 'hidden')`),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`NOW()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`NOW()`),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("profile_private").execute();
  await db.schema.dropIndex("idx_profile_index_did").execute();
  await db.schema.dropTable("profile_index").execute();
}
