import roomRepository from "@/infrastructure/repositories/room/room.repository.ts";
import { RoomDto } from "@/useCases/dto/room/room.dto";
import roomMemberRepository from "@/infrastructure/repositories/room/roomMember.repository";
import {UserDto} from "@/useCases";
import {RoomWithRelationsDto} from "@/useCases/dto/room/roomWithRelat.dto.ts";
import {AppStatus} from "@/presentation/middleware/globalError.middleware.ts";
import type {IRoom} from "@/domain";

export class RoomService {
    async createRoom(isAuth: boolean, roomName: string, userData?: UserDto): Promise<RoomDto> {
        const isTemporary = !isAuth;
        const ownerId = isAuth && userData ? userData.id : null;

        const roomData = {
            name: roomName,
            ownerId,
            isPublic: false,
            inviteCode: null,
            inviteCodeExpiresAt: null,
            isTemporary,
            maxStatuses: isTemporary ? 5 : 20,
            maxTasksPerStatus: isTemporary ? 5 : 15,
        };

        const createdRoom = await roomRepository.create(roomData);

        const memberData = {
            roomId: createdRoom.id,
            userId: ownerId,
            guestId: isAuth ? null : `guest_${crypto.randomUUID().slice(0, 8)}`,
            displayName: isAuth && userData ? userData.name : 'Создатель', // Первый мембер в комнате всегда админ
            isAdmin: true,
            isOnline: true,
        };

        await roomMemberRepository.create(memberData);

        return new RoomDto(createdRoom);
    }

    async removeRoom(roomId: string, userId: number) {
        const room = await roomRepository.findById(roomId);

        if (!room) {
            throw new AppStatus(404, `Комната с ID: ${roomId} не найдена`)
        }

        if (userId && room.ownerId !== userId) {
            throw new AppStatus(403, 'У вас нет прав на удаление этой комнаты');
        }

        await roomRepository.delete(roomId);
    }

    async joinRoom(roomId: string, inviteCode: string, userData?: UserDto){

        if (!roomId) {
            throw new AppStatus(400, 'Id комнаты обязателен');
        }

        const room = await roomRepository.findById(roomId);

        if (!room) {
            throw new AppStatus(404, `Комната с ID: ${roomId} не найдена`)
        }

        if (!room.isPublic && room.inviteCode !== inviteCode) {
            throw new AppStatus(403, `Неверный код приглашения или комната закрыта`)
        }

        if (room.inviteCodeExpiresAt && room.inviteCodeExpiresAt < new Date()) {
            throw new AppStatus(403, 'Код приглашения истёк');
        }

        const member = await roomMemberRepository.findByRoomAndUser(roomId, userData?.id);

        if (member) {
            await roomMemberRepository.updateOnlineStatus(member.id, true)
            return member
        }

        const isGuest = !userData?.id;
        const guestId = isGuest ? `guest_${crypto.randomUUID().slice(0, 8)}` : null;

        const memberData = {
            roomId,
            userId: userData ? userData.id : null,
            guestId,
            displayName: userData ? userData.name : 'Гость',
            isAdmin: true,
            isOnline: true,
        };

        await roomMemberRepository.create(memberData);
    }

    async getRoomById(roomId: string): Promise<RoomWithRelationsDto> {
        const room = await roomRepository.findById(roomId);

        if (!room) {
            throw new AppStatus(503, `Комната с ID: ${roomId} не найдена`)
        }

        return new RoomWithRelationsDto(room);
    }

    async getUserRooms(userId: number): Promise<RoomDto[]> {
        if (!userId) {
            throw new AppStatus(400, 'ID пользователя обязателен');
        }

        const rooms = await roomRepository.getUserRooms(userId);

        if (!rooms || rooms.length === 0) {
            return [];
        }

        return rooms.map(room => new RoomDto(room));
    }

    async updateRoom(roomId: string, data: Partial<IRoom>): Promise<RoomDto> {
        const room = await roomRepository.findById(roomId);

        if (!room) {
            throw new AppStatus(404, `Комната с ID: ${roomId} не найдена`);
        }

        const updatedRoom = await roomRepository.update(roomId, {
            ...data,
            updatedAt: new Date(),
        });

        if (!updatedRoom) {
            throw new Error('Не удалось обновить комнату');
        }

        return new RoomDto(updatedRoom);
    }

}

export const roomService = new RoomService();
