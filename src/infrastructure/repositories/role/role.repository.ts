import { db, rolesSchema } from "@/infrastructure";

export class RoleRepository {
  async getRoles() {
    return db.select().from(rolesSchema);
  }

  async create(data: typeof rolesSchema.$inferInsert) {
    const [role] = await db.insert(rolesSchema).values(data).returning();
    return role!;
  }
}

export const roleRepository = new RoleRepository();
