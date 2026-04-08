import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("member_profiles")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("did", "text", (col) =>
      col.notNull().references("members.did").onDelete("cascade"),
    )
    .addColumn("url", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex("idx_member_profiles_did")
    .on("member_profiles")
    .column("did")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("idx_member_profiles_did").execute();
  await db.schema.dropTable("member_profiles").execute();
}
