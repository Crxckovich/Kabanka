import { roomMembersSchema } from "../../database/schemas/room/roomMembers.schema.ts";
import { db } from "../../database/database.provider";
import { and, asc, eq } from "drizzle-orm";
import { roomMemberPermissionsSchema } from "../../database/schemas/room/roomPermissions.schema.ts";
import type { IMemberWithPermissions, IRoomMember } from "@/domain";
import type { IPermissions } from "@/domain/entities/room/roomMember.interface.ts";
import { AppStatus } from "@/presentation/middleware/globalError.middleware.ts";

export class RoomMemberRepository {
  async create(data: Omit<IRoomMember, "id" | "joinedAt" | "lastSeenAt">) {
    const [member] = await db.insert(roomMembersSchema).values(data).returning();

    if (!member) {
      throw AppStatus.InternalServerError("Не удалось создать участника");
    }

    return this.findById(member.id);
  }

  private async createDefaultPermissions(memberId: string) {
    await db.insert(roomMemberPermissionsSchema).values({
      memberId,
      canCreateStatus: false,
      canCreateTask: false,
      canMoveTask: false,
      canDeleteTask: false,
      canDeleteStatus: false,
      canManageUsers: false,
    });
  }

  async findByRoomAnyUser(
    roomId: string,
    userId?: number,
    guestId?: string
  ): Promise<IMemberWithPermissions | undefined> {
    return db.query.roomMembersSchema.findFirst({
      where: and(
        eq(roomMembersSchema.roomId, roomId),
        userId ? eq(roomMembersSchema.userId, userId) : undefined,
        guestId ? eq(roomMembersSchema.guestId, guestId) : undefined
      ),
      with: { permissions: true },
    });
  }

  async findByRoomUser(
    roomId: string,
    userId: number
  ): Promise<IMemberWithPermissions | undefined> {
    return db.query.roomMembersSchema.findFirst({
      where: and(eq(roomMembersSchema.roomId, roomId), eq(roomMembersSchema.userId, userId)),
      with: { permissions: true },
    });
  }

  async findByRoomGuest(
    roomId: string,
    guestId: string
  ): Promise<IMemberWithPermissions | undefined> {
    return db.query.roomMembersSchema.findFirst({
      where: and(eq(roomMembersSchema.roomId, roomId), eq(roomMembersSchema.guestId, guestId)),
      with: { permissions: true },
    });
  }

  async findById(memberId: string): Promise<IMemberWithPermissions | undefined> {
    return db.query.roomMembersSchema.findFirst({
      where: eq(roomMembersSchema.id, memberId),
      with: {
        permissions: true,
      },
    });
  }

  async findRoomAdmin(roomId: string): Promise<IMemberWithPermissions | undefined> {
    return db.query.roomMembersSchema.findFirst({
      where: and(eq(roomMembersSchema.roomId, roomId), eq(roomMembersSchema.isAdmin, true)),
      with: {
        permissions: true,
      },
    });
  }

  async getRoomMembers(roomId: string) {
    return db.query.roomMembersSchema.findMany({
      where: eq(roomMembersSchema.roomId, roomId),
      with: { permissions: true },
      orderBy: asc(roomMembersSchema.joinedAt),
    });
  }

  async updateOnlineStatus(memberId: string, isOnline: boolean) {
    return db
      .update(roomMembersSchema)
      .set({ isOnline, lastSeenAt: new Date() })
      .where(eq(roomMembersSchema.id, memberId));
  }

  async removeMember(memberId: string) {
    return db.delete(roomMembersSchema).where(eq(roomMembersSchema.id, memberId));
  }

  async updatePermissions(
    memberId: string,
    permissions: Partial<IPermissions>
  ): Promise<IMemberWithPermissions | undefined> {
    await db
      .update(roomMemberPermissionsSchema)
      .set(permissions)
      .where(eq(roomMemberPermissionsSchema.memberId, memberId));

    return await this.findById(memberId);
  }
}

export default new RoomMemberRepository();
