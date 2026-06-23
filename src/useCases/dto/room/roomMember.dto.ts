import type { IRoomMember } from "@/domain";
import { roomMembersSchema } from "@/infrastructure/database/schemas";

export class RoomMemberDto implements IRoomMember {
  id: string;
  roomId: string;
  userId: number | null;
  guestId: string | null;
  displayName: string;
  isAdmin: boolean;
  isOnline: boolean;
  lastSeenAt: Date;
  joinedAt: Date;

  constructor(model: typeof roomMembersSchema.$inferSelect) {
    this.id = model.id;
    this.roomId = model.roomId;
    this.userId = model.userId;
    this.guestId = model.guestId;
    this.displayName = model.displayName;
    this.isAdmin = model.isAdmin;
    this.isOnline = model.isOnline;
    this.lastSeenAt = model.lastSeenAt;
    this.joinedAt = model.joinedAt;
  }
}
