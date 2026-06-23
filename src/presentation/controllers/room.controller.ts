import type { Request, Response } from "express";
import { roomMembersService, roomService } from "@/infrastructure";
import { AppStatus } from "@/presentation/middleware/globalError.middleware.ts";
import { RoomMemberWithPermissionsDto } from "@/useCases/dto/room/roomMemberWithRelat.dto";
import { param } from "../utils/validateParam";

export class RoomController {
  async create(req: Request, res: Response) {
    const isAuth = !!req.user;
    const { name } = req.body;

    const room = await roomService.createRoom(isAuth, name, req.user);
    return res.status(201).json(room);
  }

  async update(req: Request, res: Response) {
    const roomId = param(req.params.roomId, "roomId");
    const { roomData } = req.body;
    const room = await roomService.updateRoom(roomId, roomData);
    return res.status(200).json(room);
  }

  async joinById(req: Request, res: Response): Promise<void> {
    const roomId = param(req.params.roomId, "roomId");
    const user = req.user;

    const member = await roomService.joinRoom(roomId, user);

    res.status(200).json({
      member: new RoomMemberWithPermissionsDto(member),
      message: "Успешно присоединились к комнате",
    });
  }

  async joinByCode(req: Request, res: Response): Promise<void> {
    const inviteCode = param(req.params.inviteCode, "inviteCode");
    const user = req.user;

    const member = await roomService.joinRoomByInviteCode(inviteCode, user);

    res.status(200).json({
      member: new RoomMemberWithPermissionsDto(member),
      message: "Успешно присоединились к комнате",
    });
  }

  async getRoomById(req: Request, res: Response) {
    const roomId = param(req.params.roomId, "roomId");
    const room = await roomService.getRoomById(roomId);
    return res.status(200).json(room);
  }

  async getUserRooms(req: Request, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      throw AppStatus.UnauthorizedError();
    }

    const rooms = await roomService.getUserRooms(userId);
    res.status(200).json(rooms);
  }

  async remove(req: Request, res: Response) {
    const roomId = param(req.params.roomId, "roomId");
    const { memberId } = req.body;
    await roomService.removeRoom(roomId, memberId);
    return res.status(204).send();
  }

  // Участники комнаты
  async getMembers(req: Request, res: Response) {
    const roomId = param(req.params.roomId, "roomId");
    const members = await roomMembersService.getRoomMembers(roomId);
    return res.status(200).json(members);
  }

  async removeMember(req: Request, res: Response): Promise<void> {
    const roomId = param(req.params.roomId, "roomId");
    const memberId = param(req.params.memberId, "memberId");
    const { memberId: currentMemberId } = req.body;

    await roomMembersService.removeMember(roomId, memberId, currentMemberId);

    res.status(204).send();
  }

  async leave(req: Request, res: Response) {
    const roomId = param(req.params.roomId, "roomId");
    const { memberId } = req.body;

    if (!roomId) {
      throw new AppStatus(400, "ID комнаты обязателен");
    }

    await roomMembersService.leave(roomId, memberId);

    return res.status(200).send();
  }

  async updateMemberPermissions(req: Request, res: Response) {
    const roomId = param(req.params.roomId, "roomId");
    const memberId = param(req.params.memberId, "memberId");
    const { memberId: currentMemberId } = req.body;
    const { permissions } = req.body;

    if (!roomId || !memberId) {
      throw new AppStatus(403, "ID Комнаты и ID Участника обязательны");
    }

    const member = await roomMembersService.updateMemberPermissions(
      roomId,
      memberId,
      currentMemberId,
      permissions
    );

    return res.status(200).json(member);
  }

  // Публичный доступ
  async togglePublic(req: Request, res: Response) {
    const roomId = param(req.params.roomId, "roomId");
    const { memberId } = req.body;

    const room = await roomService.togglePublic(roomId, memberId);
    res.status(200).json(room);
  }

  async resetInviteCode(req: Request, res: Response) {
    const roomId = param(req.params.roomId, "roomId");
    const userId = req.user?.id;

    const room = await roomService.resetInviteCode(roomId, userId);
    res.status(200).json(room);
  }
}

export default new RoomController();
