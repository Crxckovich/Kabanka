import type { IStatus } from "../status/status.interface";
import type { ITask } from "../task/task.interface";
import type { IMemberWithPermissions } from "./roomMember.interface";

export interface IRoom {
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
}

export interface IRoomWithRelations extends IRoom {
    members: IMemberWithPermissions[];
    statuses: IStatus[];
    tasks: ITask[];
}