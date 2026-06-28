import { tasksSchema } from "../../database/schemas/task/task.schema.ts";
import { db } from "../../database/database.provider";
import { eq, asc, sql } from "drizzle-orm";
import type { ITask } from "@/domain";
import { AppStatus } from "@/presentation/middleware/globalError.middleware.ts";

export class TaskRepository {
  async create(data: Omit<ITask, "id" | "createdAt" | "updatedAt">) {
    const [task] = await db.insert(tasksSchema).values(data).returning();

    if (!task) {
      throw new AppStatus(500, "Не удалось создать задачу");
    }

    return task;
  }

  async findAllTasksByStatus(statusId: string): Promise<ITask[]> {
    return db.query.tasksSchema.findMany({
      where: eq(tasksSchema.statusId, statusId),
      orderBy: asc(tasksSchema.order),
    });
  }

  async findTaskById(taskId: string): Promise<ITask | undefined> {
    const task = db.query.tasksSchema.findFirst({
      where: eq(tasksSchema.id, taskId),
      orderBy: asc(tasksSchema.order),
    });

    if (!task) {
      throw new AppStatus(404, `Задача с ID: ${taskId} не найдена`);
    }

    return task;
  }

  async findByAllTasksByRoom(roomId: string): Promise<ITask[]> {
    return db.query.tasksSchema.findMany({
      where: eq(tasksSchema.roomId, roomId),
      orderBy: asc(tasksSchema.order),
    });
  }

  async update(taskId: string, data: Partial<ITask>) {
    const [task] = await db
      .update(tasksSchema)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasksSchema.id, taskId))
      .returning();
    return task;
  }

  async move(
      taskId: string,
      newStatusId: string,
      oldStatusId: string
  ): Promise<void> {
    if (newStatusId === oldStatusId) {
      throw new AppStatus(400, "Для reorder внутри статуса используйте reorderTasks");
    }

    await db.transaction(async (tx) => {
      const [task] = await tx
          .select({ statusId: tasksSchema.statusId })
          .from(tasksSchema)
          .where(eq(tasksSchema.id, taskId))
          .limit(1);

      if (!task || task.statusId !== oldStatusId) {
        throw new AppStatus(404, "Задача не найдена или уже перемещена");
      }

      await tx
          .update(tasksSchema)
          .set({
            statusId: newStatusId,
            updatedAt: sql`NOW()`
          })
          .where(eq(tasksSchema.id, taskId));
    });
  }

  async reorderTasks(statusId: string, orderedIds: string[]): Promise<void> {
    if (orderedIds.length === 0) return;

    await db.transaction(async (tx) => {
      const existingTasks = await tx
          .select({ id: tasksSchema.id })
          .from(tasksSchema)
          .where(eq(tasksSchema.statusId, statusId));

      const existingIds = new Set(existingTasks.map((t) => t.id));

      if (orderedIds.length !== existingIds.size || orderedIds.some((id) => !existingIds.has(id))) {
        throw new AppStatus(400, "Некорректный порядок задач");
      }

      const cases = orderedIds.map((id, index) => `WHEN id = '${id}' THEN ${index}`).join(" ");

      await tx.execute(sql`
      UPDATE ${tasksSchema}
      SET "order" = CASE ${sql.raw(cases)} ELSE "order" END,
          "updated_at" = NOW()
      WHERE ${eq(tasksSchema.statusId, statusId)}
    `);
    });
  }

  async delete(taskId: string) {
    return db.delete(tasksSchema).where(eq(tasksSchema.id, taskId));
  }
}

export const taskRepository = new TaskRepository();
