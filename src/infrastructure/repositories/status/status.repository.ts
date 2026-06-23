import { statusesSchema } from "../../database/schemas/status/status.schema.ts";
import { db } from "../../database/database.provider";
import { eq, asc, sql } from "drizzle-orm";
import type { IStatus } from "@/domain";
import { AppStatus } from "@/presentation/middleware/globalError.middleware.ts";

export class StatusRepository {
  async create(data: Omit<IStatus, "id" | "createdAt" | "updatedAt">) {
    const [status] = await db.insert(statusesSchema).values(data).returning();

    if (!status) {
      throw new AppStatus(500, "Не удалось создать статус");
    }

    return status;
  }

  async findAllStatusByRoom(roomId: string): Promise<IStatus[]> {
    return db.query.statusesSchema.findMany({
      where: eq(statusesSchema.roomId, roomId),
      orderBy: asc(statusesSchema.order),
    });
  }

  async findById(statusId: string): Promise<IStatus | undefined> {
    const status = await db.query.statusesSchema.findFirst({
      where: eq(statusesSchema.id, statusId),
    });

    if (!status) {
      throw new AppStatus(404, `Статус с ID: ${statusId} не найден`);
    }

    return status;
  }

  async update(id: string, data: Partial<IStatus>) {
    const [status] = await db
      .update(statusesSchema)
      .set(data)
      .where(eq(statusesSchema.id, id))
      .returning();
    return status;
  }

  async reorder(roomId: string, orderedIds: string[]): Promise<void> {
    if (orderedIds.length === 0) return;

    await db.transaction(async (tx) => {
      const existingStatuses = await tx
        .select({ id: statusesSchema.id })
        .from(statusesSchema)
        .where(eq(statusesSchema.roomId, roomId));

      const existingIds = new Set(existingStatuses.map((s) => s.id));

      if (orderedIds.length !== existingIds.size || orderedIds.some((id) => !existingIds.has(id))) {
        throw AppStatus.BadRequest("Некорректный порядок статусов");
      }

      const cases = orderedIds.map((id, index) => `WHEN id = '${id}' THEN ${index}`).join(" ");

      await tx.execute(sql`
                UPDATE ${statusesSchema}
                SET "order" = CASE ${sql.raw(cases)}
                ELSE "order"
                END
                WHERE ${eq(statusesSchema.roomId, roomId)}
            `);
    });
  }

  async delete(id: string) {
    return db.delete(statusesSchema).where(eq(statusesSchema.id, id));
  }
}

export const statusRepository = new StatusRepository();
