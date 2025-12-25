import { IsUUID } from "class-validator";

export class CreateShopManagerDto {
    @IsUUID()
    memberId: string;

    @IsUUID()
    shopId: string;
}
