import { Role } from "../types/Role";

export type CreateUserInput = {
    firstName: string,
    lastName: string,
    picture?: string,
    email: string,
    password: string,
    role?: Role
};