import { Role } from "../types/Role";

export type CreateUserInput = {
    firstName: string,
    lastName?: string,
    picture?: string,
    email?: string,
    cpf?: string,
    password?: string,
    phone: string,
    role?: Role,
    isGuest?: boolean,
};