export interface ITask {
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
}
