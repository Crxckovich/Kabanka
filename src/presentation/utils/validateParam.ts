import { AppStatus } from "../middleware/globalError.middleware";

export const param = (value: unknown, name: string = 'Параметр'): string => {
    if (!value) {
        throw AppStatus.BadRequest(`${name} обязателен`);
    }
    if (typeof value !== 'string') {
        throw AppStatus.BadRequest(`${name} должен быть строкой`);
    }
    if (Array.isArray(value) || value.includes(',')) {
        throw AppStatus.BadRequest(`${name} не может быть массивом`);
    }

    const trimmed = value.trim();
    if (!trimmed) {
        throw AppStatus.BadRequest(`${name} не может быть пустым`);
    }

    return trimmed;
};