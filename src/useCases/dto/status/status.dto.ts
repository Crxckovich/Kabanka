import type { IStatus } from "@/domain";
import { statusesSchema } from "@/infrastructure/database/schemas";

export class StatusDto implements IStatus {
  id: string;
  roomId: string;
  name: string;
  order: number;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(model: typeof statusesSchema.$inferSelect) {
    this.id = model.id;
    this.roomId = model.roomId;
    this.name = model.name;
    this.order = model.order;
    this.isLocked = model.isLocked;
    this.createdAt = model.createdAt;
    this.updatedAt = model.createdAt;
  }
}
