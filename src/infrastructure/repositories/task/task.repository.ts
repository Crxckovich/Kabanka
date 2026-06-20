import { tasksSchema } from "../../database/schemas/task/task.schema.ts";
import { db } from '../../database/database.provider';
import { eq, asc } from 'drizzle-orm';
import type { ITask } from "@/domain";

export class TaskRepository {
    async create(data: Omit<ITask, 'id' | 'createdAt' | 'updatedAt'>) {
        const [task] = await db.insert(tasksSchema).values(data).returning();
        return task;
    }

    async findByRoom(roomId: string) {
        return db.query.tasksSchema.findMany({
            where: eq(tasksSchema.roomId, roomId),
            orderBy: asc(tasksSchema.order)
        });
    }

    async update(id: string, data: Partial<ITask>) {
        const [task] = await db.update(tasksSchema)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(tasksSchema.id, id))
            .returning();
        return task;
    }

    async move(taskId: string, statusId: string, newOrder: number) {
        return db.update(tasksSchema)
            .set({ statusId, order: newOrder, updatedAt: new Date() })
            .where(eq(tasksSchema.id, taskId));
    }

    async delete(id: string) {
        return db.delete(tasksSchema).where(eq(tasksSchema.id, id));
    }
}