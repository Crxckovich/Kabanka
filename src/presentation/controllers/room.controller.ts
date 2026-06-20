import type { Request, Response } from "express";
import {roomMembersService, roomService} from "@/infrastructure";
import {AppStatus} from "@/presentation/middleware/globalError.middleware.ts";
import { RoomMemberWithPermissionsDto } from "@/useCases/dto/room/roomMemberWithRelat.dto";


export class RoomController {

    // Комнаты
    async create(req: Request, res: Response) {
        const isAuth = !!req.user;
        const { name } = req.body;

        const room = await roomService.createRoom(isAuth, name, req.user);
        return res.status(201).json(room);
    }

    async update(req: Request, res: Response) {
        const { roomId, roomData } = req.body;
        const room = await roomService.updateRoom(roomId, roomData);
        return res.status(200).json(room);
    }

    async join(req: Request, res: Response) {
        const { roomId, inviteCode } = req.body;
        const user = req.user;
        const member = await roomService.joinRoom(roomId, inviteCode, user);

        return res.status(200).json({
            member: new RoomMemberWithPermissionsDto(member),
            message: 'Успешно присоединились к комнате'
        });
    }

    async getRoomById(req: Request, res: Response) {
        const { roomId } = req.body;
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
        const { roomId, userId } = req.body;
        await roomService.removeRoom(roomId, userId);
        return res.status(204).send()
    }


    // Участники комнаты
    async getMembers(req: Request, res: Response) {
        const { roomId } = req.body;
        const members = await roomMembersService.getRoomMembers(roomId);
        return res.status(200).json(members)
    }

    async removeMember(req: Request, res: Response): Promise<void> {
        const { roomId, userId, guestId } = req.body;

        await roomMembersService.removeMember(roomId, userId, guestId);

        res.status(204).send();
    }

    async leave(req: Request, res: Response) {
        const { roomId } = req.body;
        const userId = req.user?.id;
        const guestId = req.body.guestId;

        if (!roomId) {
            throw new AppStatus(400, 'ID комнаты обязателен');
        }

        await roomMembersService.leave(roomId, userId, guestId);

        return res.status(200).send()
    }

    async updateMemberPermissions(req: Request, res: Response) {
        const { roomId, memberId, permissions } = req.body;
        const currentUserId = req.user?.id;

        if (!roomId || !memberId) {
            throw new AppStatus(403,'ID Комнаты и ID Участника обязательны');
        }

        const member = await roomMembersService.updateMemberPermissions(
            roomId,
            memberId,
            permissions,
            currentUserId
        );

        return res.status(200).json(member);
    }

    
    // Публичный доступ
    async togglePublic(req: Request, res: Response) {

    }

    async resetInviteCode(req: Request, res: Response) {

    }

    // async createStatus(req: Request, res: Response) {
    //
    // }
    //
    // async updateStatus(req: Request, res: Response) {
    //
    // }
    //
    // async reorderStatuses(req: Request, res: Response) {
    //
    // }
    //
    // async deleteStatus(req: Request, res: Response) {
    //
    // }

    // async createTask(req: Request, res: Response) {
    //
    // }
    //
    // async updateTask(req: Request, res: Response) {
    //
    // }
    //
    // async moveTask(req: Request, res: Response) {
    //
    // }
    //
    // async deleteTask(req: Request, res: Response) {
    //
    // }



}

export default new RoomController();
