import roomRepository from "@/infrastructure/repositories/room/room.repository.ts";
import { RoomDto } from "@/useCases/dto/room/room.dto";
import roomMemberRepository from "@/infrastructure/repositories/room/roomMember.repository";
import { UserDto } from "@/useCases";
import { RoomWithRelationsDto } from "@/useCases/dto/room/roomWithRelat.dto.ts";
import { AppStatus } from "@/presentation/middleware/globalError.middleware.ts";
import type { IRoom } from "@/domain";
import { RoomMemberWithPermissionsDto } from "@/useCases/dto/room/roomMemberWithRelat.dto";

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
      displayName: isAuth && userData ? userData.name : "Создатель", // Первый мембер в комнате всегда админ
      isAdmin: true,
      isOnline: true,
    };

    await roomMemberRepository.create(memberData);

    return new RoomDto(createdRoom);
  }

  async removeRoom(roomId: string, memberId: string) {
    await roomRepository.findById(roomId);

    const currentMember = await roomMemberRepository.findById(memberId);
    if (!currentMember || currentMember.roomId !== roomId) {
      throw AppStatus.NotFound("Текущий участник не найден");
    }

    if (!currentMember.isAdmin) {
      throw AppStatus.Forbidden("Только администратор комнаты может удалять комнату");
    }

    await roomRepository.delete(roomId);
  }

  async joinRoom(roomId: string, userData?: UserDto): Promise<RoomMemberWithPermissionsDto> {
    const room = await roomRepository.findById(roomId);

    if (!room.isPublic) {
      throw AppStatus.Forbidden("Комната закрыта");
    }

    if (userData) {
      let member = await roomMemberRepository.findByRoomUser(roomId, userData.id);

      if (member) {
        await roomMemberRepository.updateOnlineStatus(member.id, true);
        return member;
      }

      const memberData = {
        roomId,
        userId: userData.id,
        guestId: null,
        displayName: userData.name,
        isAdmin: false,
        isOnline: true,
      };

      member = await roomMemberRepository.create(memberData);

      if (!member) {
        throw AppStatus.InternalServerError("Не удалось получить участника");
      }

      return new RoomMemberWithPermissionsDto(member);
    }

    const guestId = `guest_${crypto.randomUUID().slice(0, 8)}`;

    const memberData = {
      roomId,
      userId: null,
      guestId,
      displayName: "Гость",
      isAdmin: false,
      isOnline: true,
    };

    const member = await roomMemberRepository.create(memberData);

    if (!member) {
      throw AppStatus.InternalServerError("Не удалось получить участника");
    }

    return new RoomMemberWithPermissionsDto(member);
  }

  async joinRoomByInviteCode(
    inviteCode: string,
    user?: UserDto
  ): Promise<RoomMemberWithPermissionsDto> {
    const room = await roomRepository.findByInviteCode(inviteCode);
    if (!room) {
      throw AppStatus.NotFound("Комната с таким кодом не найдена или закрыта");
    }

    if (!room.isPublic) {
      throw AppStatus.Forbidden("Комната закрыта");
    }

    if (room.inviteCode !== inviteCode) {
      throw AppStatus.Forbidden("Неверный код приглашения");
    }

    if (room.inviteCodeExpiresAt && room.inviteCodeExpiresAt < new Date()) {
      throw AppStatus.InviteCodeExpired();
    }

    return this.joinRoom(room.id, user);
  }

  async getRoomById(roomId: string): Promise<RoomWithRelationsDto> {
    const room = await roomRepository.findById(roomId);

    return new RoomWithRelationsDto(room);
  }

  async getUserRooms(userId: number): Promise<RoomDto[]> {
    if (!userId) {
      throw new AppStatus(400, "ID пользователя обязателен");
    }

    const rooms = await roomRepository.getUserRooms(userId);

    if (!rooms || rooms.length === 0) {
      return [];
    }

    return rooms.map((room) => new RoomDto(room));
  }

  async updateRoom(roomId: string, data: Partial<IRoom>): Promise<RoomDto> {
    await roomRepository.findById(roomId);

    const updatedRoom = await roomRepository.update(roomId, {
      ...data,
      updatedAt: new Date(),
    });

    if (!updatedRoom) {
      throw new AppStatus(500, "Не удалось обновить комнату");
    }

    return new RoomDto(updatedRoom);
  }

  async togglePublic(roomId: string, memberId: string): Promise<RoomDto> {
    const room = await roomRepository.findById(roomId);

    const currentMember = await roomMemberRepository.findById(memberId);

    if (!currentMember || currentMember.roomId !== roomId) {
      throw AppStatus.NotFound("Текущий участник не найден");
    }

    if (!currentMember.isAdmin) {
      throw AppStatus.Forbidden("Только администратор комнаты может менять права");
    }

    const isNowPublic = !room.isPublic;

    const updateData: Partial<IRoom> = {
      isPublic: isNowPublic,
    };

    if (isNowPublic) {
      updateData.inviteCode = this.generateInviteCode();
      updateData.inviteCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    } else {
      updateData.inviteCode = null;
      updateData.inviteCodeExpiresAt = null;
    }

    const updatedRoom = await roomRepository.update(roomId, updateData);

    if (!updatedRoom) {
      throw AppStatus.InternalServerError("Не удалось обновить статус комнаты");
    }

    return new RoomDto(updatedRoom);
  }

  async resetInviteCode(roomId: string, currentUserId?: number): Promise<RoomDto> {
    const room = await roomRepository.findById(roomId);

    if (!room.isPublic) {
      throw AppStatus.BadRequest("Нельзя сгенерировать код для закрытой комнаты");
    }

    if (room.ownerId !== currentUserId) {
      throw AppStatus.Forbidden("Только создатель комнаты может обновлять код");
    }

    const updateData = {
      inviteCode: this.generateInviteCode(),
      inviteCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };

    const updatedRoom = await roomRepository.update(roomId, updateData);

    if (!updatedRoom) {
      throw AppStatus.InternalServerError("Не удалось обновить комнату");
    }

    return new RoomDto(updatedRoom);
  }

  private generateInviteCode(): string {
    // 8 символов: цифры + заглавные + строчные + _
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export const roomService = new RoomService();
