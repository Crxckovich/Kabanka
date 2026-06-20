import { drizzle } from "drizzle-orm/postgres-js";
import { dbCredentialsString } from "../../../drizzle.config.ts";
import * as usersSchema from "./schemas/user/user.schema.ts";
import * as rolesSchema from "./schemas/user/role.schema.ts";
import * as tokenSchema from "./schemas/token/token.schema.ts";
import * as roomSchema from "./schemas/room/room.schema.ts";
import * as roomMembersSchema from "./schemas/room/roomMembers.schema.ts";
import * as roomMemberPermissionsSchema from "./schemas/room/roomPermissions.schema.ts";
import * as statusesSchema from "./schemas/status/status.schema.ts";
import * as tasksSchema from "./schemas/task/task.schema.ts";

export const db = drizzle(dbCredentialsString, {
  schema: {
    ...usersSchema,
    ...rolesSchema,
    ...tokenSchema,
    ...roomSchema,
    ...roomMembersSchema,
    ...roomMemberPermissionsSchema,
    ...statusesSchema,
    ...tasksSchema,
  },
  logger: true,
});
