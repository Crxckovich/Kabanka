import { roomsSchema } from "@/infrastructure/database/schemas/room/room.schema";
import { db } from "../../database/database.provider";
import { eq, and, desc, asc } from "drizzle-orm";
import { statusesSchema } from "@/infrastructure/database/schemas/status/status.schema";
import type { IRoom, IRoomWithRelations } from "@/domain";
import { AppStatus } from "@/presentation/middleware/globalError.middleware.ts";

export class RoomRepository {
  async create(
    data: Omit<IRoom, "id" | "inviteCode" | "inviteCodeExpiresAt" | "createdAt" | "updatedAt">
  ) {
    const [room] = await db.insert(roomsSchema).values(data).returning();

    if (!room) {
      throw new AppStatus(500, "Не удалось создать комнату");
    }

    return room;
  }

  async findById(id: string): Promise<IRoomWithRelations> {
    const room = await db.query.roomsSchema.findFirst({
      where: eq(roomsSchema.id, id),
      with: {
        members: {
          with: {
            permissions: true,
          },
        },
        statuses: {
          orderBy: asc(statusesSchema.order)
        },
        tasks: true,
      },
    });

    if (!room) {
      throw new AppStatus(404, `Комната с ID: ${id} не найдена`);
    }

    return room;
  }

  async findByInviteCode(code: string) {
    return db.query.roomsSchema.findFirst({
      where: and(eq(roomsSchema.inviteCode, code), eq(roomsSchema.isPublic, true)),
      with: { members: true },
    });
  }

  async update(id: string, data: Partial<IRoom>) {
    const [room] = await db
      .update(roomsSchema)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(roomsSchema.id, id))
      .returning();
    return room;
  }

  async delete(id: string) {
    return db.delete(roomsSchema).where(eq(roomsSchema.id, id));
  }

  async getUserRooms(userId: number) {
    return db.query.roomsSchema.findMany({
      where: and(eq(roomsSchema.ownerId, userId)),
      orderBy: desc(roomsSchema.createdAt),
      with: { members: true },
    });
  }
}

export default new RoomRepository();
