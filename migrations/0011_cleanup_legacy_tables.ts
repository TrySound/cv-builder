import { type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Drop recommendations table (from 0003_community.ts)
  // Indexes: idx_recommendations_subject, idx_recommendations_author, idx_recommendations_invitation
  await db.schema.dropIndex("idx_recommendations_invitation").ifExists().execute();
  await db.schema.dropIndex("idx_recommendations_author").ifExists().execute();
  await db.schema.dropIndex("idx_recommendations_subject").ifExists().execute();
  await db.schema.dropTable("recommendations").ifExists().execute();

  // Drop profile_index table (from 0009_profile_tables.ts)
  // Index: idx_profile_index_did
  await db.schema.dropIndex("idx_profile_index_did").ifExists().execute();
  await db.schema.dropTable("profile_index").ifExists().execute();

  // Drop recommendation_index table (from 0007_recommendation_index.ts)
  // Indexes: idx_recommendation_index_author_did, idx_recommendation_index_subject_did
  await db.schema.dropIndex("idx_recommendation_index_subject_did").ifExists().execute();
  await db.schema.dropIndex("idx_recommendation_index_author_did").ifExists().execute();
  await db.schema.dropTable("recommendation_index").ifExists().execute();

  // Drop jetstream_cursor table (from 0008_jetstream_cursors.ts)
  await db.schema.dropTable("jetstream_cursor").ifExists().execute();

  // Drop handle_index table (from 0010_create_handle_index.ts)
  // Index: idx_handle_index_handle
  await db.schema.dropIndex("idx_handle_index_handle").ifExists().execute();
  await db.schema.dropTable("handle_index").ifExists().execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Note: Restoration of tables is not supported in this migration
  // as the data would be lost. If needed, restore from backup.
  console.log("Down migration not supported - tables were permanently dropped");
}
