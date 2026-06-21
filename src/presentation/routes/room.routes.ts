import {Router} from "express";
import {authMiddleware} from "@/presentation/middleware/auth.middleware.ts";
import {asyncMiddleware} from "@/presentation/middleware/async.middleware.ts";
import roomController from "../controllers/room.controller";

export const roomRouter = Router();

// Комнаты
roomRouter.post("/", authMiddleware, asyncMiddleware(roomController.create));                   // Создать комнату постоянная/гостевая

roomRouter.get("/", authMiddleware, asyncMiddleware(roomController.getUserRooms));             // Получить комнаты авторизованного пользователя
roomRouter.get("/:roomId", authMiddleware, asyncMiddleware(roomController.getRoomById));             // Получить комнату + статусы + задачи
roomRouter.patch("/:roomId", authMiddleware, asyncMiddleware(roomController.update));           // Обновить название, настройки и т.д.
roomRouter.delete("/:roomId", authMiddleware, asyncMiddleware(roomController.remove));          // Удалить комнату

// Присоединение
roomRouter.post("/join/:invite-code", asyncMiddleware(roomController.joinByCode));                                 // Присоединиться по invite коду
roomRouter.post("/:roomId/join", asyncMiddleware(roomController.joinById));                                 // Присоединиться по ID

// Участники комнаты
roomRouter.get("/:roomId/members", authMiddleware, asyncMiddleware(roomController.getMembers));
roomRouter.delete("/:roomId/members/:memberId", authMiddleware, asyncMiddleware(roomController.removeMember)); // Кикнуть из комнаты
roomRouter.post("/:roomId/leave", authMiddleware, asyncMiddleware(roomController.leave));       // Выйти из комнаты

// Права участника
roomRouter.patch("/:roomId/members/:memberId/permissions", authMiddleware, asyncMiddleware(roomController.updateMemberPermissions));

// Публичный доступ
roomRouter.patch("/:roomId/public", authMiddleware, asyncMiddleware(roomController.togglePublic));     // Вкл/выкл публичный доступ
roomRouter.post("/:roomId/invite-code", authMiddleware, asyncMiddleware(roomController.resetInviteCode)); // Сброс кода

// Статусы (колонки)
// roomRouter.post("/:roomId/statuses", authMiddleware, asyncMiddleware(roomController.createStatus));
// roomRouter.patch("/:roomId/statuses/:statusId", authMiddleware, asyncMiddleware(roomController.updateStatus));
// roomRouter.put("/:roomId/statuses/order", authMiddleware, asyncMiddleware(roomController.reorderStatuses)); // Перестановка статусов
// roomRouter.delete("/:roomId/statuses/:statusId", authMiddleware, asyncMiddleware(roomController.deleteStatus));
//
// // Задачи
// roomRouter.post("/:roomId/tasks", authMiddleware, asyncMiddleware(roomController.createTask));
// roomRouter.patch("/:roomId/tasks/:taskId", authMiddleware, asyncMiddleware(roomController.updateTask));
// roomRouter.patch("/:roomId/tasks/:taskId/position", authMiddleware, asyncMiddleware(roomController.moveTask)); // drag & drop + reorder
// roomRouter.delete("/:roomId/tasks/:taskId", authMiddleware, asyncMiddleware(roomController.deleteTask));