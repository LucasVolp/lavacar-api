import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "prisma/generated";
import { ROLES_KEY } from "src/decorators/roles.decorator";
import { IS_PUBLIC_KEY } from "src/shared/decorators/public.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector){}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user || !user.role) {
            return false;
        }

        const userRole = user.role as Role;
        if (!Object.values(Role).includes(userRole)) {
            return false;
        }

        return requiredRoles.includes(userRole);
    }
}
