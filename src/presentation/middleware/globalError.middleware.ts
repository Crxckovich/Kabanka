import type { NextFunction, Request, Response } from "express";

export class AppStatus extends Error {
  statusCode: number;
  status: string;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
    Error.captureStackTrace(this, this.constructor);
  }

  static UnauthorizedError() {
    return new AppStatus(401, "Пользователь не авторизован");
  }

  static UndefinedKey() {
    return new AppStatus(500, "Не задан ключ");
  }
}

export const errorMiddleware = (
  err: AppStatus,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;

  console.error(`[${statusCode}] ${req.method} ${req.url}:`, err.message);

  res.status(statusCode).json({
    status: err.status || "error",
    message: err.message || "Внутренняя ошибка сервера",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};
