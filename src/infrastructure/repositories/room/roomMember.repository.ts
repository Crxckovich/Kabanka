import { roomMembersSchema } from "../../database/schemas/room/roomMembers.schema.ts";
import { db } from '../../database/database.provider';
import {eq, and, asc} from 'drizzle-orm';
import { roomMemberPermissionsSchema } from "../../database/schemas/room/roomPermissions.schema.ts";
import type {IMemberWithPermissions, IRoomMember} from "@/domain";

export class RoomMemberRepository {
    async create(data: Omit<IRoomMember, 'id' | 'joinedAt' | 'lastSeenAt'>) {
        const [member] = await db.insert(roomMembersSchema).values(data).returning();

        if (!member) {
            return member;
        }

        await this.createDefaultPermissions(member.id);
        return member;
    }

    private async createDefaultPermissions(memberId: string) {
        await db.insert(roomMemberPermissionsSchema).values({
            memberId,
            canCreateStatus: false,
            canCreateTask: false,
            canMoveTask: false,
            canDeleteTask: false,
            canManageUsers: false
        });
    }

    async findByRoomAnyUser(roomId: string, userId?: number, guestId?: string) {
        return db.query.roomMembersSchema.findFirst({
            where: and(
                eq(roomMembersSchema.roomId, roomId),
                userId ? eq(roomMembersSchema.userId, userId) : undefined,
                guestId ? eq(roomMembersSchema.guestId, guestId) : undefined
            ),
            with: { permissions: true }
        }) as Promise<IMemberWithPermissions | undefined>;
    }

    async findByRoomUser(roomId: string, userId: number) {
        return db.query.roomMembersSchema.findFirst({
            where: and(
                eq(roomMembersSchema.roomId, roomId),
                eq(roomMembersSchema.userId, userId),
            ),
            with: { permissions: true }
        }) as Promise<IMemberWithPermissions | undefined>;
    }

    async findByRoomGuest(roomId: string, guestId: string) {
        return db.query.roomMembersSchema.findFirst({
            where: and(
                eq(roomMembersSchema.roomId, roomId),
                eq(roomMembersSchema.guestId, guestId),
            ),
            with: { permissions: true }
        }) as Promise<IMemberWithPermissions | undefined>;
    }

    async findById(memberId: string) {
        return db.query.roomMembersSchema.findFirst({
            where: eq(roomMembersSchema.id, memberId),
            with: {
                permissions: true
            }
        }) as Promise<IMemberWithPermissions | undefined>;
    }

    async findRoomAdmin(roomId: string) {
        return db.query.roomMembersSchema.findFirst({
            where: and(
                eq(roomMembersSchema.roomId, roomId),
                eq(roomMembersSchema.isAdmin, true)
            ),
            with: {
                permissions: true
            }
        }) as Promise<IMemberWithPermissions | undefined>;
    }

    async getRoomMembers(roomId: string) {
        return db.query.roomMembersSchema.findMany({
            where: eq(roomMembersSchema.roomId, roomId),
            with: { permissions: true },
            orderBy: asc(roomMembersSchema.joinedAt)
        });
    }

    async updateOnlineStatus(memberId: string, isOnline: boolean) {
        return db.update(roomMembersSchema)
            .set({ isOnline, lastSeenAt: new Date() })
            .where(eq(roomMembersSchema.id, memberId));
    }

    async removeMember(memberId: string) {
        return db.delete(roomMembersSchema).where(eq(roomMembersSchema.id, memberId));
    }

    async updatePermissions(memberId: string, permissions: Partial<{
        canCreateStatus: boolean;
        canCreateTask: boolean;
        canMoveTask: boolean;
        canDeleteTask: boolean;
        canManageUsers: boolean;
    }>) {
        return db.update(roomMemberPermissionsSchema)
            .set(permissions)
            .where(eq(roomMemberPermissionsSchema.memberId, memberId));
    }
}

export default new RoomMemberRepository();