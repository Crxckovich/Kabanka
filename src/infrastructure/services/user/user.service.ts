import { userRepository } from "../../repositories/user/user.repository.ts";
import { UserDto } from "@/useCases";
import { AppStatus } from "@/presentation/middleware/globalError.middleware.ts";
import { tokenService } from "@/infrastructure";

export class UserService {
  async getUsers() {
    const users = await userRepository.getUsers();
    return users.map((user) => new UserDto(user));
  }

  async getUserById(id: number) {
    const candidate = await userRepository.findById(id);

    if (!candidate) {
      throw new AppStatus(509, `Пользователь c id: ${id} не существует`);
    }

    return candidate;
  }

  getUserFromToken = async (authHeader?: string) => {
    if (!authHeader) {
      throw AppStatus.UnauthorizedError();
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new AppStatus(403, "Неверный формат токена");
    }

    const token = authHeader.substring(7);

    const userData = await tokenService.validateAccessToken(token);

    if (!userData) {
      throw AppStatus.UnauthorizedError();
    }

    return userData;
  };

  async ensureUserNotExists(email: string): Promise<void> {
    const candidate = await userRepository.findByEmail(email);

    if (candidate) {
      throw new AppStatus(409, `Пользователь с email ${email} уже существует`);
    }
  }

  async ensureUserExists(email: string) {
    const candidate = await userRepository.findByEmail(email);

    if (!candidate) {
      throw new AppStatus(509, `Пользователь с email ${email} не существует`);
    }

    return candidate;
  }

  async activate(activationLink: string) {
    const user = await userRepository.findByActivationLink(activationLink);

    if (!user) {
      throw new AppStatus(400, "Некорректная ссылка активации");
    }

    await userRepository.update(user.id, { isActivated: true });
  }
}

export const userService = new UserService();
