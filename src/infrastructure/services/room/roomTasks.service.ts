import roomRepository from "@/infrastructure/repositories/room/room.repository.ts";
import { statusRepository } from "@/infrastructure/repositories/status/status.repository.ts";
import { StatusDto } from "@/useCases/dto/status/status.dto.ts";
import type { IStatus, ITask } from "@/domain";
import { AppStatus } from "@/presentation/middleware/globalError.middleware.ts";
import roomMemberRepository from "@/infrastructure/repositories/room/roomMember.repository.ts";
import { taskRepository } from "@/infrastructure/repositories/task/task.repository.ts";
import { TaskDto } from "@/useCases/dto/task/task.dto.ts";

// Вынес в другой сервис для того чтобы не заполнять кучей кода основной сервис для работы с комнатами
export class RoomTasksService {
  // Статусы
  async createStatus(
    roomId: string,
    name: string,
    memberId: string // ID текущего пользователя кто делает действие
  ): Promise<IStatus> {
    const room = await roomRepository.findById(roomId);
    const existingStatuses = await statusRepository.findAllStatusByRoom(roomId);

    if (existingStatuses.length >= room.maxStatuses) {
      throw AppStatus.BadRequest(`Достигнут максимальный лимит статусов (${room.maxStatuses})`);
    }

    const currentMember = await roomMemberRepository.findById(memberId);

    if (!currentMember) {
      throw new AppStatus(404, `Участник с ID: ${memberId} не найден`);
    }

    if (!currentMember.isAdmin && !currentMember.permissions.canCreateStatus) {
      throw AppStatus.Forbidden("Недостаточно прав для создания статуса");
    }

    const statusData = {
      roomId,
      name: name.trim(),
      order: existingStatuses.length, // следующий порядок
      isLocked: false,
    };

    return new StatusDto(await statusRepository.create(statusData));
  }

  async updateStatus(statusId: string, data: Partial<IStatus>) {
    await statusRepository.findById(statusId);

    const statusData = {
      ...data,
      updatedAt: new Date(),
    };

    const updatedStatus = await statusRepository.update(statusId, statusData);

    if (!updatedStatus) {
      throw AppStatus.InternalServerError("Не удалось обновить статус");
    }

    return new StatusDto(updatedStatus);
  }

  async deleteStatus(statusId: string, memberId: string) {
    await statusRepository.findById(statusId);

    const currentMember = await roomMemberRepository.findById(memberId);

    if (!currentMember) {
      throw new AppStatus(404, `Участник с ID: ${memberId} не найден`);
    }

    if (!currentMember.isAdmin && !currentMember.permissions.canDeleteStatus) {
      throw AppStatus.BadRequest("Недостаточно прав для удаления статуса");
    }

    await statusRepository.delete(statusId);
  }

  async reorderStatuses(roomId: string, orderedIds: string[], memberId: string) {
    await roomRepository.findById(roomId);

    const member = await roomMemberRepository.findById(memberId);
    if (!member?.isAdmin && !member?.permissions.canCreateStatus) {
      throw AppStatus.Forbidden("Недостаточно прав для изменения порядка статусов");
    }

    await statusRepository.reorder(roomId, orderedIds);
  }

  // Задачи
  async createTask(
    roomId: string,
    statusId: string,
    title: string,
    description: string,
    memberId: string
  ): Promise<TaskDto> {
    const room = await roomRepository.findById(roomId);
    await statusRepository.findById(statusId);

    const existingTaskInStatus = await taskRepository.findAllTasksByStatus(statusId);

    if (existingTaskInStatus.length >= room.maxTasksPerStatus) {
      throw AppStatus.BadRequest(
        `Достигнут максимальный лимит задач в статусе (${room.maxTasksPerStatus})`
      );
    }

    const currentMember = await roomMemberRepository.findById(memberId);

    if (!currentMember) {
      throw new AppStatus(404, `Участник с ID: ${memberId} не найден`);
    }

    if (!currentMember.isAdmin && !currentMember.permissions.canCreateTask) {
      throw AppStatus.BadRequest("Недостаточно прав для создания задачи");
    }

    const tasksData = {
      roomId,
      statusId,
      title,
      description,
      assigneeMemberId: null,
      order: existingTaskInStatus.length,
      createdByMemberId: memberId,
    };

    return new TaskDto(await taskRepository.create(tasksData));
  }

  async updateTask(taskId: string, data: Partial<ITask>): Promise<TaskDto> {
    await taskRepository.findTaskById(taskId);

    const tasksData = {
      ...data,
      updatedAt: new Date(),
    };

    const updatedTask = await taskRepository.update(taskId, tasksData);

    if (!updatedTask) {
      throw AppStatus.InternalServerError("Не удалось обновить задачу");
    }

    return new TaskDto(updatedTask);
  }

  async removeTask(taskId: string, memberId: string) {
    await taskRepository.findTaskById(taskId);

    const currentMember = await roomMemberRepository.findById(memberId);

    if (!currentMember) {
      throw new AppStatus(404, `Участник с ID: ${memberId} не найден`);
    }

    if (!currentMember.isAdmin && !currentMember.permissions.canDeleteTask) {
      throw AppStatus.BadRequest("Недостаточно прав для удаления задачи");
    }

    await taskRepository.delete(taskId);
  }

  async move(
      taskId: string,
      newStatusId: string,
      oldStatusId: string,
  ): Promise<void> {

    await taskRepository.move(taskId, newStatusId, oldStatusId);
  }

  async reorderTasks(statusId: string, orderedIds: string[]): Promise<void> {
    await taskRepository.reorderTasks(statusId, orderedIds);
  }

  async getTaskById(taskId: string) {
    return taskRepository.findTaskById(taskId);
  }

}

export const roomTasksService = new RoomTasksService();
