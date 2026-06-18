import type { Request, Response } from "express";
import { userService } from "@/infrastructure";
import { AppStatus } from "@/presentation/middleware/globalError.middleware.ts";
import { CLIENT_URL } from "@/config/api.config.ts";

class UserController {
  async getUsers(req: Request, res: Response) {
    const users = await userService.getUsers();
    res.json(users);
  }

  async activate(req: Request, res: Response) {
    const activationLink = req.params.link;

    if (!activationLink) {
      throw new AppStatus(400, "Ссылка активации некорректна");
    }

    await userService.activate(String(activationLink));
    return res.redirect(CLIENT_URL);
  }
}

export default new UserController();
