import { roomService } from "@/infrastructure/services/room/room.service";
import type { ServerWebSocket } from "bun";
import type { RoomMemberWithPermissionsDto } from "@/useCases/dto/room/roomMemberWithRelat.dto";
import {roomMembersService, userService } from "@/infrastructure";
import { UserDto } from "@/useCases";
import { roomTasksService } from "@/infrastructure/services/room/roomTasks.service.ts";
import {AppStatus} from "@/presentation/middleware/globalError.middleware.ts";

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
    ws.send(JSON.stringify({ type: "connected" }));
  }

  async onMessage(ws: ServerWebSocket<WsData>, message: string | Buffer) {
    try {
      const data = JSON.parse(message.toString());
      const {token, roomId} = ws.data

      if (data.type === 'join-room') {
        if (data.roomId) {
          await this.joinByRoomId(ws, data.roomId, token);
        } else if (data.inviteCode) {
          await this.joinByInviteCode(ws, data.inviteCode, token);
        }
        return;
      }

      if (!roomId) {
        throw new Error("roomId отсутствует");
      }

      const currentMemberId = ws.data.memberId;

      if (!currentMemberId) {
        throw new Error("Не авторизован в комнате (memberId отсутствует)");
      }

      switch (data.type) {
        // === Комната ===
        case "update-room": {
          const updatedRoom = await roomService.updateRoom(roomId, data.payload);
          this.broadcastToRoom(roomId, { type: "room-updated", payload: updatedRoom });
          break;
        }

        case "delete-room": {

          if (data.roomId && data.userId) {
            await roomService.removeRoom(data.roomId, currentMemberId);
            this.broadcastToRoom(data.roomId, { type: "room-deleted" });
            break;
          }

          await roomService.removeRoom(roomId, currentMemberId);
          this.broadcastToRoom(roomId, { type: "room-deleted" });
          break;
        }

        case "toggle-public": {
          const toggledRoom = await roomService.togglePublic(data.roomId, currentMemberId);
          this.broadcastToRoom(roomId, { type: "public-toggled", payload: toggledRoom });
          break;
        }

        // === Участники ===
        case "leave": {
          await roomMembersService.leaveByClosing(roomId, currentMemberId);
          this.broadcastToRoom(roomId, {
            type: "user-left",
            payload: { memberId: currentMemberId },
          });
          break;
        }

        case "leave-by-button": {
          await roomMembersService.leaveByButton(data.roomId, data.userId);
          this.broadcastToRoom(data.roomId, {
            type: "user-left",
            payload: { memberId: currentMemberId },
          });
          break;
        }

        case "remove-member": {
          await roomMembersService.removeMember(roomId, data.memberId, currentMemberId);
          this.broadcastToRoom(roomId, {
            type: "member-removed",
            payload: { memberId: data.memberId },
          });
          break;
        }

        case "update-permissions": {
         const roomMember = await roomMembersService.updateMemberPermissions(
            roomId,
            data.payload.memberId,
            currentMemberId,
            data.payload.permissions
          );
          this.broadcastToRoom(roomId, {
            type: "permissions-updated",
            payload: { memberId: roomMember.id, permissions: roomMember.permissions },
          });
          break;
        }

        // === Статусы ===
        case "create-status": {
          const newStatus = await roomTasksService.createStatus(
            roomId,
            data.name,
            currentMemberId
          );
          this.broadcastToRoom(roomId, { type: "status-created", payload: newStatus });
          break;
        }

        case "delete-status": {
          await roomTasksService.deleteStatus(data.statusId, currentMemberId);
          this.broadcastToRoom(roomId, { type: "status-deleted", payload: { statusId: data.statusId }});
          break;
        }

        case "update-status": {
          const updatedStatus = await roomTasksService.updateStatus(data.statusId, data.payload);
          this.broadcastToRoom(roomId, { type: "status-updated", payload: updatedStatus });
          break;
        }

        case "reorder-statuses": {
          await roomTasksService.reorderStatuses(roomId, data.orderedIds, currentMemberId);
          this.broadcastToRoom(roomId, {
            type: "statuses-reordered",
            payload: { orderedIds: data.orderedIds },
          });
          break;
        }

        // === Задачи ===
        case "create-task": {
          const newTask = await roomTasksService.createTask(
            roomId,
            data.payload.statusId,
            data.payload.title,
            data.payload.description,
            currentMemberId
          );
          this.broadcastToRoom(roomId, { type: "task-created", payload: newTask });
          break;
        }

        case "update-task": {
          const updatedTask = await roomTasksService.updateTask(data.taskId, data.payload);
          this.broadcastToRoom(roomId, { type: "task-updated", payload: updatedTask });
          break;
        }

        case "delete-task": {
          await roomTasksService.removeTask(data.taskId, currentMemberId);
          this.broadcastToRoom(roomId, {
            type: "task-deleted",
            payload: { taskId: data.taskId },
          });
          break;
        }

        case "move-task": {
          const { taskId, newStatusId, oldStatusId, orderedOld, orderedNew } = data.payload || {};

          if (!taskId || !newStatusId || !oldStatusId) {
            throw new AppStatus(400, "taskId, newStatusId, oldStatusId обязательны");
          }

          await roomTasksService.move(taskId, newStatusId, oldStatusId);

          if (orderedOld?.length) {
            await roomTasksService.reorderTasks(oldStatusId, orderedOld);
          }
          if (orderedNew?.length) {
            await roomTasksService.reorderTasks(newStatusId, orderedNew);
          }

          const updatedTask = await roomTasksService.getTaskById(taskId);

          this.broadcastToRoom(roomId, {
            type: "task-moved",
            payload: {
              task: updatedTask,
              oldStatusId,
              newStatusId,
              orderedOld,
              orderedNew
            }
          });
          break;
        }

        case "reorder-tasks": {
          const { statusId, orderedIds } = data.payload || {}

          if (!statusId || !orderedIds) {
            throw new AppStatus(400, "statusId и orderedIds обязательны")
          }

          await roomTasksService.reorderTasks(statusId, orderedIds)

          this.broadcastToRoom(roomId, {
            type: "tasks-reordered",
            payload: { statusId, orderedIds },
          })
          break;
        }

        // case "reorder-tasks": {
        //   await roomTasksService.reorderTasks(data.statusId, data.orderedIds, currentMemberId);
        //   this.broadcastToRoom(roomId, {
        //     type: "tasks-reordered",
        //     payload: { statusId: data.statusId, orderedIds: data.orderedIds },
        //   });
        //   break;
        // }

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
    const {guestId} = ws.data

    if (token) {
      try {
        user = await userService.getUserFromToken(`Bearer ${token}`);
      } catch {
        // Если токен невалидный, то продолжаем как гость
      }
    }

    const member = await roomService.joinRoom(roomId, user, guestId);

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
    const memberId = ws.data.memberId;

    if (!roomId || !memberId) return;

    console.log(`User left room ${roomId}, memberId: ${memberId}`);

    try {
      roomMembersService.leaveByClosing(roomId, memberId);

      this.broadcastToRoom(roomId, {
        type: "user-left",
        payload: { memberId },
      });
    } catch (error) {
      console.error("Error on user leave:", error);
    }

    // Удаляем из комнаты
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId)!.delete(ws);

      if (this.rooms.get(roomId)!.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  private broadcastToRoom(roomId: string, payload: object) {

    if (!roomId) {
      throw new AppStatus(500, "Не передан roomId")
    };

    const clients = this.rooms.get(roomId);
    if (!clients) {
      throw new AppStatus(500, "Нет клиентов")
    };

    const msg = JSON.stringify(payload);
    clients.forEach((client) => {
      if (client.readyState === 1) client.send(msg);
    });
  }
}

export const roomWsHandler = new RoomWsHandler();
