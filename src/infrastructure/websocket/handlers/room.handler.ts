import { roomService } from "@/infrastructure/services/room/room.service";
import type { ServerWebSocket } from "bun";
import type { RoomMemberWithPermissionsDto } from "@/useCases/dto/room/roomMemberWithRelat.dto";
import { roomMembersService, userService } from "@/infrastructure";
import { UserDto } from "@/useCases";
import { roomTasksService } from "@/infrastructure/services/room/roomTasks.service.ts";

export type WsData = {
  token?: string;
  inviteCode?: string;
  user?: UserDto;
  roomId?: string;
  memberId?: string;
  isGuest?: boolean;
  guestId?: string | null;
};

export class RoomWsHandler {
  private rooms = new Map<string, Set<ServerWebSocket<WsData>>>();

  async onConnect(ws: ServerWebSocket<WsData>) {
    console.log("Успешно подключено");
    ws.send(JSON.stringify({ type: "connected" }));
  }

  async onMessage(ws: ServerWebSocket<WsData>, message: string | Buffer) {
    try {
      const data = JSON.parse(message.toString());
      const currentMemberId = ws.data.memberId;

      if (!currentMemberId) {
        throw new Error("Не авторизован в комнате (memberId отсутствует)");
      }

      switch (data.type) {
        case "join-room": {
          if (data.roomId) {
            await this.joinByRoomId(ws, data.roomId, data.token);
          } else if (data.inviteCode) {
            await this.joinByInviteCode(ws, data.inviteCode, data.token);
          }
          break;
        }

        // === Комната ===
        case "update-room": {
          const updatedRoom = await roomService.updateRoom(data.roomId, data.payload);
          this.broadcastToRoom(data.roomId, { type: "room-updated", payload: updatedRoom });
          break;
        }

        case "delete-room": {
          await roomService.removeRoom(data.roomId, currentMemberId);
          this.broadcastToRoom(data.roomId, { type: "room-deleted" });
          break;
        }

        case "toggle-public": {
          const toggledRoom = await roomService.togglePublic(data.roomId, currentMemberId);
          this.broadcastToRoom(data.roomId, { type: "public-toggled", payload: toggledRoom });
          break;
        }

        // === Участники ===
        case "leave": {
          await roomMembersService.leave(data.roomId, currentMemberId);
          this.broadcastToRoom(data.roomId, {
            type: "user-left",
            payload: { memberId: currentMemberId },
          });
          break;
        }

        case "remove-member": {
          await roomMembersService.removeMember(data.roomId, data.memberId, currentMemberId);
          this.broadcastToRoom(data.roomId, {
            type: "member-removed",
            payload: { memberId: data.memberId },
          });
          break;
        }

        case "update-permissions": {
          await roomMembersService.updateMemberPermissions(
            data.roomId,
            data.memberId,
            currentMemberId,
            data.permissions
          );
          this.broadcastToRoom(data.roomId, {
            type: "permissions-updated",
            payload: { memberId: data.memberId, permissions: data.permissions },
          });
          break;
        }

        // === Статусы ===
        case "create-status": {
          const newStatus = await roomTasksService.createStatus(
            data.roomId,
            data.name,
            currentMemberId
          );
          this.broadcastToRoom(data.roomId, { type: "status-created", payload: newStatus });
          break;
        }

        case "update-status": {
          const updatedStatus = await roomTasksService.updateStatus(data.statusId, data.payload);
          this.broadcastToRoom(data.roomId, { type: "status-updated", payload: updatedStatus });
          break;
        }

        // TODO: Права доступа к удалению статуса И задачам (обновление)
        case "delete-status": {
          await roomTasksService.deleteStatus(data.statusId, currentMemberId);
          this.broadcastToRoom(data.roomId, {
            type: "status-deleted",
            payload: { statusId: data.statusId },
          });
          break;
        }

        case "reorder-statuses": {
          await roomTasksService.reorderStatuses(data.roomId, data.orderedIds, currentMemberId);
          this.broadcastToRoom(data.roomId, {
            type: "statuses-reordered",
            payload: { orderedIds: data.orderedIds },
          });
          break;
        }

        // === Задачи ===
        case "create-task": {
          const newTask = await roomTasksService.createTask(
            data.roomId,
            data.statusId,
            data.title,
            data.description,
            currentMemberId
          );
          this.broadcastToRoom(data.roomId, { type: "task-created", payload: newTask });
          break;
        }

        case "update-task": {
          const updatedTask = await roomTasksService.updateTask(data.taskId, data.payload);
          this.broadcastToRoom(data.roomId, { type: "task-updated", payload: updatedTask });
          break;
        }

        case "delete-task": {
          await roomTasksService.removeTask(data.taskId, currentMemberId);
          this.broadcastToRoom(data.roomId, {
            type: "task-deleted",
            payload: { taskId: data.taskId },
          });
          break;
        }

        case "reorder-tasks": {
          await roomTasksService.reorderTasks(data.statusId, data.orderedIds, currentMemberId);
          this.broadcastToRoom(data.roomId, {
            type: "tasks-reordered",
            payload: { statusId: data.statusId, orderedIds: data.orderedIds },
          });
          break;
        }

        default:
          ws.send(JSON.stringify({ type: "error", message: "Unknown action" }));
      }
    } catch (error) {
      console.error(error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: (error as Error).message,
        })
      );
    }
  }

  /**
   * Присоединение по roomId (авторизованные пользователи из списка комнат)
   */
  private async joinByRoomId(ws: ServerWebSocket<WsData>, roomId: string, token?: string) {
    let user: UserDto | undefined;
    if (token) {
      try {
        user = await userService.getUserFromToken(token);
      } catch {
        // Если токен невалидный, то продолжаем как гость
      }
    }

    const member = await roomService.joinRoom(roomId, user);

    this.setupWsData(ws, roomId, member, user);

    await this.afterJoin(ws, roomId, member);
  }

  /**
   * Присоединение по inviteCode
   */
  private async joinByInviteCode(ws: ServerWebSocket<WsData>, inviteCode: string, token?: string) {
    let user: UserDto | undefined;
    if (token) {
      try {
        user = await userService.getUserFromToken(token);
      } catch {
        // Что то прокинуть
      }
    }

    const member = await roomService.joinRoomByInviteCode(inviteCode, user);

    this.setupWsData(ws, member.roomId, member, user);

    await this.afterJoin(ws, member.roomId, member);
  }

  private setupWsData(
    ws: ServerWebSocket<WsData>,
    roomId: string,
    member: RoomMemberWithPermissionsDto,
    user?: UserDto
  ) {
    ws.data.roomId = roomId;
    ws.data.user = user;
    ws.data.isGuest = !user;
    ws.data.guestId = member.guestId || null;
    ws.data.memberId = member.id;
  }

  private async afterJoin(
    ws: ServerWebSocket<WsData>,
    roomId: string,
    member: RoomMemberWithPermissionsDto
  ) {
    // Добавляем в комнату
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(ws);

    // Уведомляем всех
    this.broadcastToRoom(roomId, {
      type: "user-joined",
      payload: { member },
    });

    // Отправляем полное состояние текущему клиенту
    const roomData = await roomService.getRoomById(roomId);
    ws.send(
      JSON.stringify({
        type: "room-joined",
        payload: roomData,
      })
    );
  }

  onClose(ws: ServerWebSocket<WsData>) {
    const roomId = ws.data.roomId;
    if (!roomId || !this.rooms.has(roomId)) return;

    this.rooms.get(roomId)!.delete(ws);

    if (this.rooms.get(roomId)!.size === 0) {
      this.rooms.delete(roomId);
    } else {
      this.broadcastToRoom(roomId, {
        type: "user-left",
        payload: { memberId: ws.data.memberId || ws.data.guestId },
      });
    }
  }

  private broadcastToRoom(roomId: string, payload: object) {
    const clients = this.rooms.get(roomId);
    if (!clients) return;

    const msg = JSON.stringify(payload);
    clients.forEach((client) => {
      if (client.readyState === 1) client.send(msg);
    });
  }
}

export const roomWsHandler = new RoomWsHandler();
