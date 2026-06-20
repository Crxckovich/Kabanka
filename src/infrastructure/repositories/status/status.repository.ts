import { statusesSchema } from "../../database/schemas/status/status.schema.ts";
import { db } from '../../database/database.provider';
import { eq, and, asc } from 'drizzle-orm';
import type { IStatus } from "@/domain";

export class StatusRepository {
    async create(data: Omit<IStatus, 'id' | 'createdAt'>) {
        const [status] = await db.insert(statusesSchema).values(data).returning();
        return status;
    }

    async findByRoom(roomId: string) {
        return db.query.statusesSchema.findMany({
            where: eq(statusesSchema.roomId, roomId),
            orderBy: asc(statusesSchema.order)
        });
    }

    async update(id: string, data: Partial<IStatus>) {
        const [status] = await db.update(statusesSchema)
            .set(data)
            .where(eq(statusesSchema.id, id))
            .returning();
        return status;
    }

    async reorder(roomId: string, orderedIds: string[]) {
        const updates = orderedIds.map((id, index) =>
            db.update(statusesSchema)
                .set({ order: index })
                .where(and(eq(statusesSchema.id, id), eq(statusesSchema.roomId, roomId)))
        );
        return Promise.all(updates);
    }

    async delete(id: string) {
        return db.delete(statusesSchema).where(eq(statusesSchema.id, id));
    }
}