import { pgTable, uuid, boolean } from "drizzle-orm/pg-core";
import { roomMembersSchema } from "./roomMembers.schema";

export const roomMemberPermissionsSchema = pgTable("room_member_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id")
    .references(() => roomMembersSchema.id, { onDelete: "cascade" })
    .notNull(),
  canCreateStatus: boolean("can_create_status").notNull().default(false),
  canCreateTask: boolean("can_create_task").notNull().default(false),
  canMoveTask: boolean("can_move_task").notNull().default(false),
  canDeleteTask: boolean("can_delete_task").notNull().default(false),
  canDeleteStatus: boolean("can_delete_task").notNull().default(false),
  canManageUsers: boolean("can_manage_users").notNull().default(false),
});
