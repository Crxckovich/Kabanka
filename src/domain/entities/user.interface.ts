import type { IRole } from "./role.interface";

export interface IUser {
  username: string;
  password: string;
  roles: IRole[];
}
