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
        memberId: string,
        currentUserId?: number,     // для HTTP (авторизованный)
        currentGuestId?: string     // для WebSocket / гостей
    ): Promise<void> {
        const room = await roomRepository.findById(roomId);

        if (!room) {
            throw new AppStatus(404, `Комната с ID: ${roomId} не найдена`)
        }

        const targetMember = await roomMemberRepository.findById(memberId);
        if (!targetMember || targetMember.roomId !== roomId) {
            throw AppStatus.NotFound('Участник не найден в комнате');
        }

        // Получаем текущего админа комнаты
        const roomAdmin = await roomMemberRepository.findRoomAdmin(roomId);
        if (!roomAdmin) {
            throw AppStatus.InternalServerError('Админ комнаты не найден');
        }

        // Проверяем, является ли текущий пользователь/гость админом
        const isCurrentUserAdmin =
            (currentUserId && roomAdmin.userId === currentUserId) ||
            (currentGuestId && roomAdmin.guestId === currentGuestId) ||
            roomAdmin.id === memberId; // если пытается себя кикнуть — запрещаем ниже

        if (!isCurrentUserAdmin) {
            throw AppStatus.Forbidden('Только администратор комнаты может исключать участников');
        }

        // Запреты
        if (targetMember.isAdmin) {
            throw AppStatus.Forbidden('Нельзя исключить администратора (создателя) комнаты');
        }

        if (targetMember.id === roomAdmin.id) {
            throw AppStatus.Forbidden('Нельзя исключить самого себя');
        }

        await roomMemberRepository.removeMember(targetMember.id);
    }

    async leave(roomId: string, userId?: number, guestId?: string) {
        const member = await roomMemberRepository.findByRoomAnyUser(
            roomId,
            userId,
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
            await roomMemberRepository.removeMember(member.id);
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
    ): Promise<RoomMemberWithPermissionsDto> {
        const targetMember = await roomMemberRepository.findById(memberId);

        if (!targetMember || targetMember.roomId !== roomId) {
            throw new AppStatus(404, 'Участник не найден в комнате');
        }

        const roomAdmin = await roomMemberRepository.findRoomAdmin(roomId);

        if (!roomAdmin) {
            throw new AppStatus(403, 'Админ не найден');
        }

        // Запрещаем снимать все права у самого себя (админа)
        if (targetMember.id === roomAdmin.id) {
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
