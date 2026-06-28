import type { NextFunction, Request, Response } from "express";
import { AppStatus } from "./globalError.middleware.ts";
import { userService } from "@/infrastructure";

export const authMiddleware = (required = true) => async(req: Request, res: Response, next: NextFunction) => {
  try {
    req.user = await userService.getUserFromToken(req.headers.authorization);
    next();
  } catch (e) {
    if (required) {
      return next(AppStatus.UnauthorizedError());
    }
    req.user = undefined;
    next();
  }
};

export const requiredAuth = authMiddleware(true);
export const optionalAuth = authMiddleware(false);