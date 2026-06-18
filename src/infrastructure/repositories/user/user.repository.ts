import { db, usersSchema } from "@/infrastructure";
import { eq } from "drizzle-orm";

export class UserRepository {
  async getUsers() {
    return db.select().from(usersSchema);
  }

  async findByEmail(email: string) {
    return db.query.usersSchema.findFirst({
      where: eq(usersSchema.email, email),
      with: { role: true },
    });
  }

  async findById(id: number) {
    return db.query.usersSchema.findFirst({
      where: eq(usersSchema.id, id),
      with: { role: true },
    })!;
  }

  async findByActivationLink(link: string) {
    return db.query.usersSchema.findFirst({
      where: eq(usersSchema.activationLink, link),
    });
  }

  async create(data: typeof usersSchema.$inferInsert) {
    const [user] = await db.insert(usersSchema).values(data).returning();
    return user!;
  }

  async update(id: number, data: Partial<typeof usersSchema.$inferInsert>) {
    return db.update(usersSchema).set(data).where(eq(usersSchema.id, id)).returning();
  }
}

export const userRepository = new UserRepository();
