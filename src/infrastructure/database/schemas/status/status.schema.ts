import { pgTable, uuid, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { roomsSchema } from "../room/room.schema";
import {relations} from "drizzle-orm";
import {tasksSchema} from "@/infrastructure/database/schemas";

export const statusesSchema = pgTable("statuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .references(() => roomsSchema.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  order: integer("order").notNull(),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const statusesRelations = relations(statusesSchema, ({ one, many }) => ({
  room: one(roomsSchema, {
    fields: [statusesSchema.roomId],
    references: [roomsSchema.id],
  }),
  tasks: many(tasksSchema),
}));