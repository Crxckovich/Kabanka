import {db, mailService, rolesSchema, tokenService, userService} from "@/infrastructure";
import {eq} from "drizzle-orm";
import {AppStatus} from "@/presentation/middleware/globalError.middleware.ts";
import {randomUUIDv7} from "bun";
import {UserDto} from "@/useCases";
import {userRepository} from "../../repositories/user/user.repository.ts";

export class AuthService {
    signup = async (name: string, email: string, password: string) => {
        await userService.ensureUserNotExists(email);

        const hashPassword = await Bun.password.hash(password);
        const activationLink = randomUUIDv7();

        const userRole = await db.query.rolesSchema.findFirst({
            where: eq(rolesSchema.value, "USER"),
        });

        if (!userRole) {
            throw new AppStatus(500, "Роль USER не найдена. Проверьте начальные данные.");
        }

        const newUser = await userRepository.create({
            name,
            email,
            password: hashPassword,
            activationLink,
            role_id: userRole.id,
        });

        // Можно сделать отдельным эндпоинтом
        await mailService.sendActivationMail(email, activationLink);

        const userDto = new UserDto(newUser);
        const tokens = tokenService.generateTokens({...userDto});

        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {...tokens, user: userDto};
    };

    login = async (email: string, password: string) => {
        const candidate = await userService.ensureUserExists(email);

        const validPassword = await Bun.password.verify(password, candidate.password);
        if (!validPassword) {
            throw new AppStatus(401, `Введен не верный пароль.`);
        }

        const userDto = new UserDto(candidate);
        const tokens = tokenService.generateTokens({...userDto});

        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {...tokens, user: userDto};
    };

    refresh = async (refreshToken: string) => {
        if (!refreshToken) {
            throw AppStatus.UnauthorizedError();
        }

        const userData = await tokenService.validateRefreshToken(refreshToken);
        await tokenService.findRefToken(refreshToken);

        if (!userData) {
            throw AppStatus.UnauthorizedError();
        }

        const candidate = await userService.getUserById(userData.id);

        const userDto = new UserDto(candidate);
        const tokens = tokenService.generateTokens({...userDto});

        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {...tokens, user: userDto};
    };
}

export const authService = new AuthService();
