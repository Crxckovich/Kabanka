import { validationResult } from "express-validator";
import type { NextFunction, Request, Response } from "express";
import { AppStatus } from "./globalError.middleware";

export const validateMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => err.msg)
      .join(", ");
    return next(new AppStatus(422, `Ошибка валидации: ${errorMessages}`));
  }

  next();
};
