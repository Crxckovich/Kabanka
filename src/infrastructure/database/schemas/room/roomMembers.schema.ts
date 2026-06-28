import { pgTable, uuid, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { roomsSchema } from "./room.schema";
import { usersSchema } from "../user/user.schema";
import { roomMemberPermissionsSchema } from "./roomPermissions.schema";
import {relations} from "drizzle-orm";
import { tasksSchema } from "../task/task.schema";

/*
displayName нужен для гостей (автоматически "Guest-1", "Guest-2" и т.д. или имя, которое они вводят при входе).
Для зарегистрированных пользователей оно может позволять кастомное отображение в конкретной комнате.
 */

export const roomMembersSchema = pgTable("room_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .references(() => roomsSchema.id, { onDelete: "cascade" })
    .notNull(),
  userId: integer("user_id").references(() => usersSchema.id, { onDelete: "cascade" }),
  guestId: varchar("guest_id", { length: 50 }),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  isOnline: boolean("is_online").notNull().default(true),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const roomMembersRelations = relations(roomMembersSchema, ({ one, many }) => ({
  room: one(roomsSchema, {
    fields: [roomMembersSchema.roomId],
    references: [roomsSchema.id],
  }),
  permissions: one(roomMemberPermissionsSchema, {
    fields: [roomMembersSchema.id],
    references: [roomMemberPermissionsSchema.memberId],
  }),
  assignedTasks: many(tasksSchema, {
    relationName: 'assignee',
  }),
  createdTasks: many(tasksSchema, {
    relationName: 'creator',
  }),
}));