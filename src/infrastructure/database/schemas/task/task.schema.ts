import { pgTable, uuid, varchar, timestamp, integer, text } from "drizzle-orm/pg-core";
import { roomsSchema } from "../room/room.schema";
import { roomMembersSchema } from "../room/roomMembers.schema";
import { statusesSchema } from "../status/status.schema";
import {relations} from "drizzle-orm";

export const tasksSchema = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .references(() => roomsSchema.id, { onDelete: "cascade" })
    .notNull(),
  statusId: uuid("status_id")
    .references(() => statusesSchema.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assigneeMemberId: uuid("assignee_member_id").references(() => roomMembersSchema.id, {
    onDelete: "set null",
  }),
  order: integer("order").notNull(),
  createdByMemberId: uuid("created_by_member_id")
    .references(() => roomMembersSchema.id, { onDelete: "set null" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasksRelations = relations(tasksSchema, ({ one }) => ({
  room: one(roomsSchema, {
    fields: [tasksSchema.roomId],
    references: [roomsSchema.id],
  }),
  status: one(statusesSchema, {
    fields: [tasksSchema.statusId],
    references: [statusesSchema.id],
  }),
  assignee: one(roomMembersSchema, {
    fields: [tasksSchema.assigneeMemberId],
    references: [roomMembersSchema.id],
    relationName: 'assignee',
  }),
  creator: one(roomMembersSchema, {
    fields: [tasksSchema.createdByMemberId],
    references: [roomMembersSchema.id],
    relationName: 'creator',
  }),
}));
