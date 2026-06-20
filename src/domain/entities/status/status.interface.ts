export interface IStatus {
    id: string;
    roomId: string;
    name: string;
    order: number;
    isLocked: boolean;
    createdAt: Date;
}