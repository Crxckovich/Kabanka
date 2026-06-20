export interface IRoomMember {
    id: string;
    roomId: string;
    userId: number | null;
    guestId: string | null;
    displayName: string;
    isAdmin: boolean;
    isOnline: boolean;
    lastSeenAt: Date;
    joinedAt: Date;
}

export interface IMemberWithPermissions extends IRoomMember {
    permissions: {
        canCreateStatus: boolean;
        canCreateTask: boolean;
        canMoveTask: boolean;
        canDeleteTask: boolean;
        canManageUsers: boolean;
    };
}