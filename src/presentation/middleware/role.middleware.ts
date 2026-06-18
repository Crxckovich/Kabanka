import type { NextFunction, Request, Response } from "express";
import { AppStatus } from "./globalError.middleware.ts";
import { userService } from "@/infrastructure";

export const roleMiddleware =
  (roles: number[]) => async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === "OPTIONS") return next();

    try {
      if (!req.user) {
        req.user = await userService.getUserFromToken(req.headers.authorization);
      }

      if (!roles.includes(req.user.roleId)) {
        return next(new AppStatus(403, "У вас нет доступа"));
      }

      next();
    } catch {
      return next(AppStatus.UnauthorizedError());
    }
  };
