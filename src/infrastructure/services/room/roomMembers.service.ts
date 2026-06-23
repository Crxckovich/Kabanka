import roomMemberRepository from "@/infrastructure/repositories/room/roomMember.repository";
import { AppStatus } from "@/presentation/middleware/globalError.middleware.ts";
import roomRepository from "@/infrastructure/repositories/room/room.repository.ts";
import { RoomMemberWithPermissionsDto } from "@/useCases/dto/room/roomMemberWithRelat.dto.ts";
import type { IPermissions } from "@/domain/entities/room/roomMember.interface.ts";

// Вынес в другой сервис для того чтобы не заполнять кучей кода основной сервис для работы с комнатами
export class RoomMembersService {
  async getRoomMembers(roomId: string): Promise<RoomMemberWithPermissionsDto[]> {
    const members = await roomMemberRepository.getRoomMembers(roomId);

    if (!members || members.length === 0) {
      return [];
    }

    return members.map((member) => new RoomMemberWithPermissionsDto(member));
  }

  async removeMember(
    roomId: string,
    memberId: string, // кого хотим удалить
    currentMemberId: string // кто выполняет действие
  ): Promise<void> {
    await roomRepository.findById(roomId);

    const targetMember = await roomMemberRepository.findById(memberId);
    if (!targetMember || targetMember.roomId !== roomId) {
      throw AppStatus.NotFound("Участник не найден в комнате");
    }

    const currentMember = await roomMemberRepository.findById(currentMemberId);
    if (!currentMember || currentMember.roomId !== roomId) {
      throw AppStatus.NotFound("Текущий участник не найден");
    }

    if (!currentMember.isAdmin) {
      throw AppStatus.Forbidden("Только администратор комнаты может исключать участников");
    }

    if (targetMember.isAdmin) {
      throw AppStatus.Forbidden("Нельзя исключить администратора (создателя) комнаты");
    }

    if (targetMember.id === currentMember.id) {
      throw AppStatus.Forbidden("Нельзя исключить самого себя");
    }

    await roomMemberRepository.removeMember(targetMember.id);
  }

  async leave(roomId: string, memberId: string) {
    const member = await roomMemberRepository.findById(memberId);

    if (!member) {
      throw new AppStatus(404, "Участник не найден в комнате");
    }

    const isGuest = !!member.guestId;
    const isRoomAdmin = member.isAdmin;

    // Если Гость это Создатель, то полностью удаляем временную комнату
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
    currentMemberId: string, // кто выполняет действие
    permissions: Partial<IPermissions>
  ): Promise<RoomMemberWithPermissionsDto> {
    const targetMember = await roomMemberRepository.findById(memberId);

    if (!targetMember || targetMember.roomId !== roomId) {
      throw new AppStatus(404, "Участник не найден в комнате");
    }

    const currentMember = await roomMemberRepository.findById(currentMemberId);
    if (!currentMember || currentMember.roomId !== roomId) {
      throw AppStatus.NotFound("Текущий участник не найден");
    }

    if (!currentMember.isAdmin) {
      throw AppStatus.Forbidden("Только администратор комнаты может менять права участникам");
    }

    // Запрещаем снимать все права у самого себя (админа)
    if (targetMember.id === currentMember.id) {
      throw new AppStatus(403, "Нельзя изменить свои собственные права администратора");
    }

    const updatedPermissions = await roomMemberRepository.updatePermissions(
      targetMember.id,
      permissions
    );

    if (!updatedPermissions) {
      throw new Error("Не удалось обновить права участника");
    }

    return new RoomMemberWithPermissionsDto(updatedPermissions);
  }
}

export const roomMembersService = new RoomMembersService();
