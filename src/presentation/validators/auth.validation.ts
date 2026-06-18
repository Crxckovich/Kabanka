import { check, type ValidationChain } from "express-validator";

export const signupValidation: ValidationChain[] = [
  check("name", "Имя пользователя не может быть пустым!").notEmpty(),
  check("email", "Некорректный email адрес").isEmail(),
  check("password", "Пароль должен быть больше 4-х символов").isLength({ min: 4 }),
];

export const loginValidation: ValidationChain[] = [
  check("email", "Некорректный email адрес").isEmail(),
  check("password", "Пароль должен быть больше 4-х символов").isLength({ min: 4 }),
];
