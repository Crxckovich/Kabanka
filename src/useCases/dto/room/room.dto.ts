import type { IRoom } from "@/domain";
import type { roomsSchema } from "@/infrastructure/database/schemas";

export class RoomDto implements IRoom {
  id: string;
  name: string;
  ownerId: number | null;
  isPublic: boolean;
  inviteCode: string | null;
  inviteCodeExpiresAt: Date | null;
  isTemporary: boolean;
  maxStatuses: number;
  maxTasksPerStatus: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(model: typeof roomsSchema.$inferSelect) {
    this.id = model.id;
    this.name = model.name;
    this.ownerId = model.ownerId;
    this.isPublic = model.isPublic;
    this.inviteCode = model.inviteCode;
    this.inviteCodeExpiresAt = model.inviteCodeExpiresAt;
    this.isTemporary = model.isTemporary;
    this.maxStatuses = model.maxStatuses;
    this.maxTasksPerStatus = model.maxTasksPerStatus;
    this.createdAt = model.createdAt;
    this.updatedAt = model.updatedAt;
  }
}
