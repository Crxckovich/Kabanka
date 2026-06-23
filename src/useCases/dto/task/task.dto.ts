import type { ITask } from "@/domain";
import { tasksSchema } from "@/infrastructure/database/schemas";

export class TaskDto implements ITask {
  id: string;
  roomId: string;
  statusId: string;
  title: string;
  description: string | null;
  assigneeMemberId: string | null;
  order: number;
  createdByMemberId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(model: typeof tasksSchema.$inferSelect) {
    this.id = model.id;
    this.roomId = model.roomId;
    this.statusId = model.statusId;
    this.title = model.title;
    this.description = model.description;
    this.assigneeMemberId = model.assigneeMemberId;
    this.order = model.order;
    this.createdByMemberId = model.createdByMemberId;
    this.createdAt = model.createdAt;
    this.updatedAt = model.updatedAt;
  }
}
