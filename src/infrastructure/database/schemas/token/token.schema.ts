import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { usersSchema } from "../user/user.schema.ts";

export const tokenSchema = pgTable("token", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId")
    .references(() => usersSchema.id)
    .unique(),
  refreshToken: varchar("refreshToken").notNull(),
});
