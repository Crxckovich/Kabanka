import { usersSchema } from "@/infrastructure";

export class UserDto {
  id: number;
  name: string;
  email: string;
  isActivated: boolean;
  roleId: number;

  constructor(model: typeof usersSchema.$inferSelect) {
    this.id = model.id;
    this.name = model.name;
    this.email = model.email;
    this.isActivated = model.isActivated;
    this.roleId = model.role_id;
  }
}
