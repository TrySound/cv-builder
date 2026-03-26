import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Main members table
  await db.schema
    .createTable("members")
    .addColumn("did", "text", (col) => col.primaryKey())
    .addColumn("name", "text")
    .addColumn("email", "text")
    .addColumn("location", "text")
    .addColumn("headline", "text")
    .addColumn("summary", "text")
    .addColumn("industry", "text")
    .addColumn("linkedin", "text")
    .addColumn("github", "text")
    .addColumn("website", "text")
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("updated_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute();

  // Positions table
  await db.schema
    .createTable("member_positions")
    .addColumn("id", "integer", (col) =>
      col.notNull().primaryKey().autoIncrement(),
    )
    .addColumn("did", "text", (col) =>
      col.notNull().references("members.did").onDelete("cascade"),
    )
    .addColumn("company", "text", (col) => col.notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("location", "text")
    .addColumn("workplace_type", "text")
    .addColumn("employment_type", "text")
    .addColumn("started_at", "text")
    .addColumn("ended_at", "text")
    .addColumn("description", "text")
    .execute();

  // Education table
  await db.schema
    .createTable("member_education")
    .addColumn("id", "integer", (col) =>
      col.notNull().primaryKey().autoIncrement(),
    )
    .addColumn("did", "text", (col) =>
      col.notNull().references("members.did").onDelete("cascade"),
    )
    .addColumn("institution", "text", (col) => col.notNull())
    .addColumn("degree", "text", (col) => col.notNull())
    .addColumn("field", "text")
    .addColumn("started_at", "text")
    .addColumn("ended_at", "text")
    .addColumn("description", "text")
    .execute();

  // Projects table
  await db.schema
    .createTable("member_projects")
    .addColumn("id", "integer", (col) =>
      col.notNull().primaryKey().autoIncrement(),
    )
    .addColumn("did", "text", (col) =>
      col.notNull().references("members.did").onDelete("cascade"),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("url", "text")
    .addColumn("started_at", "text")
    .addColumn("ended_at", "text")
    .execute();

  // Skills table
  await db.schema
    .createTable("member_skills")
    .addColumn("id", "integer", (col) =>
      col.notNull().primaryKey().autoIncrement(),
    )
    .addColumn("did", "text", (col) =>
      col.notNull().references("members.did").onDelete("cascade"),
    )
    .addColumn("skill", "text", (col) => col.notNull())
    .addUniqueConstraint("member_skills_did_skill_unique", ["did", "skill"])
    .execute();

  // Languages table
  await db.schema
    .createTable("member_languages")
    .addColumn("id", "integer", (col) =>
      col.notNull().primaryKey().autoIncrement(),
    )
    .addColumn("did", "text", (col) =>
      col.notNull().references("members.did").onDelete("cascade"),
    )
    .addColumn("language", "text", (col) => col.notNull())
    .addUniqueConstraint("member_languages_did_language_unique", [
      "did",
      "language",
    ])
    .execute();

  // Preferred workplaces table
  await db.schema
    .createTable("member_preferred_workplaces")
    .addColumn("id", "integer", (col) =>
      col.notNull().primaryKey().autoIncrement(),
    )
    .addColumn("did", "text", (col) =>
      col.notNull().references("members.did").onDelete("cascade"),
    )
    .addColumn("workplace_type", "text", (col) => col.notNull())
    .addUniqueConstraint("member_workplaces_did_type_unique", [
      "did",
      "workplace_type",
    ])
    .execute();

  // Add indexes for foreign keys
  await db.schema
    .createIndex("idx_positions_did")
    .on("member_positions")
    .column("did")
    .execute();

  await db.schema
    .createIndex("idx_education_did")
    .on("member_education")
    .column("did")
    .execute();

  await db.schema
    .createIndex("idx_projects_did")
    .on("member_projects")
    .column("did")
    .execute();

  await db.schema
    .createIndex("idx_skills_did")
    .on("member_skills")
    .column("did")
    .execute();

  await db.schema
    .createIndex("idx_languages_did")
    .on("member_languages")
    .column("did")
    .execute();

  await db.schema
    .createIndex("idx_workplaces_did")
    .on("member_preferred_workplaces")
    .column("did")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("member_preferred_workplaces").execute();
  await db.schema.dropTable("member_languages").execute();
  await db.schema.dropTable("member_skills").execute();
  await db.schema.dropTable("member_projects").execute();
  await db.schema.dropTable("member_education").execute();
  await db.schema.dropTable("member_positions").execute();
  await db.schema.dropTable("members").execute();
}
