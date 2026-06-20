import { roomService } from '@/infrastructure/services/room/room.service';
import type { ServerWebSocket } from 'bun';
import {userService} from "@/infrastructure";
import type { UserDto } from "@/useCases";
import {AppStatus} from "@/presentation/middleware/globalError.middleware.ts";
import type { WsData } from "../websocket.server";


export class RoomWsHandler {
    private rooms = new Map<string, Set<ServerWebSocket<WsData>>>();

    async onConnect(ws: ServerWebSocket<WsData>) {
        console.log('Client connected');
        ws.send(JSON.stringify({ type: 'connected' }));
    }

    async onMessage(ws: ServerWebSocket<WsData>, message: string | Buffer) {
        try {
            const data = JSON.parse(message.toString());

            switch (data.type) {
                case 'join-room':
                    await this.joinRoom(ws, data.roomId, data.inviteCode, data.token);
                    break;

                case 'create-task':
                    // TODO: реализовать позже
                    break;

                default:
                    ws.send(JSON.stringify({ type: 'error', message: 'Unknown action' }));
            }
        } catch (error) {
            console.error(error);
            ws.send(JSON.stringify({
                type: 'error',
                message: (error as Error).message
            }));
        }
    }

    /**
     * Подключение пользователя/гостя к комнате
     */
    async joinRoom(
        ws: ServerWebSocket<WsData>,
        roomId: string,
        inviteCode: string,
        token?: string
    ) {
        let user: UserDto | undefined;

        if (token) {
            try {
                user = await userService.getUserFromToken(token)
            } catch (e) {
                throw new AppStatus(404, "Пользователь не найден")
            }
        }

        const member = await roomService.joinRoom(roomId, inviteCode, user);

        ws.data.roomId = roomId;
        ws.data.user = user;
        ws.data.isGuest = !user;
        ws.data.guestId = member && member.guestId ? member.guestId : null;

        // Добавляем в комнату
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId)!.add(ws);

        // Уведомляем всех участников комнаты
        this.broadcastToRoom(roomId, {
            type: 'user-joined',
            payload: { member }
        });

        // Отправляем текущему клиенту полное состояние комнаты
        const roomData = await roomService.getRoomById(roomId);
        ws.send(JSON.stringify({
            type: 'room-joined',
            payload: roomData
        }));
    }

    onClose(ws: ServerWebSocket<WsData>) {
        const roomId = ws.data.roomId;
        if (!roomId || !this.rooms.has(roomId)) return;

        this.rooms.get(roomId)!.delete(ws);

        if (this.rooms.get(roomId)!.size === 0) {
            this.rooms.delete(roomId);
        } else {
            this.broadcastToRoom(roomId, {
                type: 'user-left',
                payload: {
                    memberId: ws.data.user?.id || ws.data.guestId
                }
            });
        }
    }

    private broadcastToRoom(roomId: string, payload: any) {
        const clients = this.rooms.get(roomId);
        if (!clients) return;

        const msg = JSON.stringify(payload);
        clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(msg);
            }
        });
    }
}

export const roomWsHandler = new RoomWsHandler();