import type { Request, Response } from "express";
import type { AuthUserDto } from "@/useCases";
import { authService, tokenService } from "@/infrastructure";
import { validationResult } from "express-validator";
import { AppStatus } from "@/presentation/middleware/globalError.middleware.ts";

class AuthController {
  signup = async (req: Request<object, object, AuthUserDto>, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors
        .array()
        .map((err) => err.msg)
        .join(", ");
      throw new AppStatus(422, `Ошибка валидации: ${errorMessages}`);
    }

    const { name, email, password } = req.body;

    const userData = await authService.signup(name, email, password);

    res.cookie("refreshToken", userData.refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    return res.status(201).json(userData);
  };

  login = async (req: Request<object, object, AuthUserDto>, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors
        .array()
        .map((err) => err.msg)
        .join(", ");
      throw new AppStatus(422, `Ошибка валидации: ${errorMessages}`);
    }

    const { email, password } = req.body;

    const userData = await authService.login(email, password);

    res.cookie("refreshToken", userData.refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    return res.status(201).json(userData);
  };

  logout = async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    await tokenService.removeToken(refreshToken);
    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "ok" });
  };

  refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    const userData = await authService.refresh(refreshToken);

    res.cookie("refreshToken", userData.refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    return res.status(201).json(userData);
  };
}

export default new AuthController();
