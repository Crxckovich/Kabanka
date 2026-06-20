import type { IMemberWithPermissions } from "@/domain";

export class RoomMemberWithPermissionsDto implements IMemberWithPermissions {
    id: string;
    roomId: string;
    userId: number | null;
    guestId: string | null;
    displayName: string;
    isAdmin: boolean;
    isOnline: boolean;
    lastSeenAt: Date;
    joinedAt: Date;
    permissions: {
        canCreateStatus: boolean;
        canCreateTask: boolean;
        canMoveTask: boolean;
        canDeleteTask: boolean;
        canManageUsers: boolean;
    };

    constructor(model: any) {
        this.id = model.id;
        this.roomId = model.roomId;
        this.userId = model.userId;
        this.guestId = model.guestId;
        this.displayName = model.displayName;
        this.isAdmin = model.isAdmin;
        this.isOnline = model.isOnline;
        this.lastSeenAt = model.lastSeenAt;
        this.joinedAt = model.joinedAt;
        this.permissions = model.permissions || {
            canCreateStatus: false,
            canCreateTask: false,
            canMoveTask: false,
            canDeleteTask: false,
            canManageUsers: false
        };
    }
}