import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersSchema } from "./user.schema.ts";

export const rolesSchema = pgTable("roles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  value: varchar("value", { length: 255 }).notNull().unique().default("USER"),
});

export const rolesRelations = relations(rolesSchema, ({ many }) => ({
  users: many(usersSchema),
}));
