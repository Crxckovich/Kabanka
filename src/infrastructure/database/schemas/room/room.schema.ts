import { pgTable, uuid, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { usersSchema } from "@/infrastructure";

export const roomsSchema = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: integer("owner_id").references(() => usersSchema.id, { onDelete: "set null" }),
  isPublic: boolean("is_public").notNull().default(false),
  inviteCode: varchar("invite_code", { length: 10 }).unique(),
  inviteCodeExpiresAt: timestamp("invite_code_expires_at", { withTimezone: true }),
  isTemporary: boolean("is_temporary").notNull().default(true),
  maxStatuses: integer("max_statuses").notNull().default(5),
  maxTasksPerStatus: integer("max_tasks_per_status").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
