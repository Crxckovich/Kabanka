import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from "@/config";
import { AppStatus } from "@/presentation/middleware/globalError.middleware.ts";
import jwt from "jsonwebtoken";
import { UserDto } from "@/useCases";
import { tokenRepository } from "../../repositories/token/token.repository.ts";

export class TokenService {
  generateTokens = (payload: UserDto) => {
    if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
      throw AppStatus.UndefinedKey();
    }

    const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: "30m" });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "30d" });

    return {
      accessToken,
      refreshToken,
    };
  };

  saveToken = async (userId: number, refreshToken: string) => {
    /*
                Работает по принципу 1 аккаунт - Одно устройство. Если вдруг пользователь решит зайти в аккаунт на другом
                Устройстве, на первоначальном устройстве выйдет из аккаунта по той причине что ТОКЕН ПЕРЕЗАПИШЕТСЯ
                */
    await tokenRepository.upsertToken(userId, refreshToken);
  };

  removeToken = async (refreshToken: string) => {
    return await tokenRepository.removeToken(refreshToken);
  };

  findRefToken = async (refreshToken: string) => {
    const refToken = await tokenRepository.getTokenByRef(refreshToken);

    if (!refToken) {
      throw AppStatus.UnauthorizedError();
    }

    return refToken;
  };

  validateAccessToken = async (accessToken: string) => {
    if (!JWT_ACCESS_SECRET) {
      throw AppStatus.UndefinedKey();
    }

    try {
      return jwt.verify(accessToken, JWT_ACCESS_SECRET) as UserDto;
    } catch {
      return null;
    }
  };

  validateRefreshToken = async (refreshToken: string) => {
    if (!JWT_REFRESH_SECRET) {
      throw AppStatus.UndefinedKey();
    }

    try {
      return jwt.verify(refreshToken, JWT_REFRESH_SECRET) as UserDto;
    } catch {
      return null;
    }
  };
}

export const tokenService = new TokenService();
