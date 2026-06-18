import "express";
import { UserDto } from "@/useCases";

declare global {
  namespace Express {
    interface Request {
      user?: UserDto;
    }
  }
}
