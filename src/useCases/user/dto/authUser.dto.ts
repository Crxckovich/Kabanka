import { usersSchema } from "@/infrastructure";

export class AuthUserDto {
  name: string;
  email: string;
  password: string;

  constructor(model: typeof usersSchema.$inferSelect) {
    this.name = model.name;
    this.email = model.email;
    this.password = model.password;
  }
}
