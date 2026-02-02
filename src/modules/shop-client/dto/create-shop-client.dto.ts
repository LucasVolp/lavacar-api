import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateShopClientDto {
    @IsUUID()
    @IsNotEmpty()
    shopId: string;

    @IsUUID()
    @IsNotEmpty()
    userId: string;
}