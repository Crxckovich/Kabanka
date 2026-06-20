import type {IMemberWithPermissions, IRoomWithRelations, IStatus, ITask} from "@/domain";
import { RoomMemberWithPermissionsDto } from "./roomMemberWithRelat.dto";
import { StatusDto } from "../status/status.dto";
import {TaskDto} from "@/useCases/dto/task/task.dto.ts";

export class RoomWithRelationsDto implements IRoomWithRelations {
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
    members: IMemberWithPermissions[];
    statuses: IStatus[];
    tasks: ITask[];

    constructor(model: any) {
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
        this.members = model.members?.map((m: any) => new RoomMemberWithPermissionsDto(m)) || [];
        this.statuses = model.statuses?.map((s: any) => new StatusDto(s)) || [];
        this.tasks = model.tasks?.map((t: any) => new TaskDto(t)) || [];
    }
}