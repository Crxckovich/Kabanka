import type {NextFunction, Request, Response} from "express";
import {AppStatus} from "./globalError.middleware.ts";
import {userService} from "@/infrastructure";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === "OPTIONS") return next();

    try {
        req.user = await userService.getUserFromToken(req.headers.authorization);
        next();
    } catch {
        return next(AppStatus.UnauthorizedError());
    }
};
