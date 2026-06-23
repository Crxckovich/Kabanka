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

  // === 4xx ошибки (Client Error) ===

  static BadRequest(message = "Неверный запрос") {
    return new AppStatus(400, message);
  }

  static UnauthorizedError(message = "Пользователь не авторизован") {
    return new AppStatus(401, message);
  }

  static Forbidden(message = "Доступ запрещён") {
    return new AppStatus(403, message);
  }

  static NotFound(message = "Ресурс не найден") {
    return new AppStatus(404, message);
  }

  static Conflict(message = "Конфликт данных") {
    return new AppStatus(409, message);
  }

  // === 5xx ошибки (Server Error) ===

  static InternalServerError(message = "Внутренняя ошибка сервера") {
    return new AppStatus(500, message);
  }

  static UndefinedKey() {
    return new AppStatus(500, "Не задан ключ");
  }

  // Удобные методы с шаблонами

  static RoomNotFound(roomId: string) {
    return new AppStatus(404, `Комната с ID: ${roomId} не найдена`);
  }

  static MemberNotFound() {
    return new AppStatus(404, "Участник не найден в комнате");
  }

  static InviteCodeExpired() {
    return new AppStatus(403, "Код приглашения истёк");
  }

  static NoPermission() {
    return new AppStatus(403, "Недостаточно прав для выполнения действия");
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
