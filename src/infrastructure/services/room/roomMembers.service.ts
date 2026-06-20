import roomMemberRepository from "@/infrastructure/repositories/room/roomMember.repository";
import {RoomMemberDto} from "@/useCases/dto/room/roomMember.dto.ts";
import {AppStatus} from "@/presentation/middleware/globalError.middleware.ts";
import roomRepository from "@/infrastructure/repositories/room/room.repository.ts";
import {RoomMemberWithPermissionsDto} from "@/useCases/dto/room/roomMemberWithRelat.dto.ts";

// Вынес в другой сервис для того чтобы не заполнять кучей кода основной сервис для работы с комнатами
export class RoomMembersService {
    async getRoomMembers(roomId: string): Promise<RoomMemberDto[]> {
        const members = await roomMemberRepository.getRoomMembers(roomId)

        if (!members || members.length === 0) {
            return []
        }

        return members.map(member => new RoomMemberDto(member));
    }

    async removeMember(
        roomId: string,
        userId?: number,
        guestId?: string
    ): Promise<void> {
        if (!roomId) {
            throw new AppStatus(400, 'ID комнаты обязателен');
        }

        const member = await roomMemberRepository.findByRoomAndUser(
            roomId,
            userId ? userId : undefined,
            guestId
        );

        if (!member) {
            throw new AppStatus(404, 'Участник не найден в комнате');
        }

        // Запрещаем удалять создателя комнаты
        if (member.isAdmin) {
            throw new AppStatus(403, 'Нельзя удалить создателя комнаты');
        }

        await roomMemberRepository.remove(member.id);
    }

    async leave(roomId: string, userId?: number, guestId?: string) {
        const member = await roomMemberRepository.findByRoomAndUser(
            roomId,
            userId ? userId : undefined,
            guestId
        );

        if (!member) {
            throw new AppStatus(404, 'Участник не найден в комнате');
        }

        const isGuest = !!member.guestId;
        const isRoomAdmin = member.isAdmin;

        // Если Гость + Создатель, то полностью удаляем временную комнату
        if (isGuest && isRoomAdmin) {
            // Удаляем всю комнату (каскадное удаление всех участников, статусов и задач)
            await roomRepository.delete(roomId);
            return;
        }

        // Если Обычный гость, то полностью удаляем из комнаты
        if (isGuest) {
            await roomMemberRepository.remove(member.id);
            return;
        }

        // Зарегистрированного пользователя не удаляем, просто делаем offline
        await roomMemberRepository.updateOnlineStatus(member.id, false);
    }

    async updateMemberPermissions(
        roomId: string,
        memberId: string,
        permissions: Partial<{
            canCreateStatus: boolean;
            canCreateTask: boolean;
            canMoveTask: boolean;
            canDeleteTask: boolean;
            canManageUsers: boolean;
        }>,
        currentUserId?: number              // ID Админа
    ): Promise<RoomMemberWithPermissionsDto> {
        const targetMember = await roomMemberRepository.findById(memberId);

        if (!targetMember || targetMember.roomId !== roomId) {
            throw new AppStatus(404, 'Участник не найден в комнате');
        }

        const currentMember = await roomMemberRepository.findByRoomAndUser(
            roomId,
            currentUserId ? currentUserId : undefined
        );

        if (!currentMember?.isAdmin) {
            throw new AppStatus(403, 'Только администратор комнаты может изменять права');
        }

        // Запрещаем снимать все права у самого себя (админа)
        if (targetMember.id === currentMember.id) {
            throw new AppStatus(403, 'Нельзя изменить свои собственные права администратора');
        }

        const updatedPermissions = await roomMemberRepository.updatePermissions(
            targetMember.id,
            permissions
        );

        if (!updatedPermissions) {
            throw new Error('Не удалось обновить права участника');
        }

        return new RoomMemberWithPermissionsDto(updatedPermissions);
    }

}

export const roomMembersService = new RoomMembersService();
