import { drizzle } from "drizzle-orm/postgres-js";
import { dbCredentialsString } from "../../../drizzle.config.ts";
import * as usersSchema from "./schemas/user/user.schema.ts";
import * as rolesSchema from "./schemas/user/role.schema.ts";
import * as tokenSchema from "./schemas/token/token.schema.ts";

export const db = drizzle(dbCredentialsString, {
  schema: {
    ...usersSchema,
    ...rolesSchema,
    ...tokenSchema,
  },
  logger: true,
});
