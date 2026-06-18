import type { ERole } from "@/domain/enums/role.enum.ts";

export interface IRole {
  id: number;
  type: ERole;
}
