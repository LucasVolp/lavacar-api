import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class DeleteUserRepository {
    constructor(private readonly prisma: PrismaService){}

    async delete(id: string){
        const user = await this.prisma.user.delete({
            where: {id}
        });
        return user;
    }
}