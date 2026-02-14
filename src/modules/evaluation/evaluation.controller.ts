import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/modules/users/types/Role';
import { Public } from 'src/shared/decorators/public.decorator';

@Controller('evaluations')
@Roles(Role.ADMIN, Role.OWNER, Role.EMPLOYEE, Role.MANAGER, Role.USER)
export class EvaluationController {
    constructor(private readonly evaluationService: EvaluationService) {}

    @Post()
    create(@Body() createEvaluationDto: CreateEvaluationDto, @CurrentUser() user: JwtPayload) {
        return this.evaluationService.create(createEvaluationDto, user);
    }

    @Get()
    findAll(
        @CurrentUser() user: JwtPayload,
        @Query('shopId') shopId?: string,
        @Query('userId') userId?: string,
        @Query('rating') rating?: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
    ) {
        return this.evaluationService.findAll({
            shopId,
            userId,
            rating: rating ? parseInt(rating, 10) : undefined,
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
        }, user);
    }

    @Get('stats/:shopId')
    getShopStats(@Param('shopId') shopId: string, @CurrentUser() user: JwtPayload) {
        return this.evaluationService.getShopStats(shopId, user);
    }

    @Public()
    @Get('public')
    findPublicByShop(
        @Query('shopId') shopId: string,
        @Query('rating') rating?: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
    ) {
        return this.evaluationService.findPublicByShop({
            shopId,
            rating: rating ? parseInt(rating, 10) : undefined,
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
        });
    }

    @Public()
    @Get('public/stats/:shopId')
    getPublicShopStats(@Param('shopId') shopId: string) {
        return this.evaluationService.getPublicShopStats(shopId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
        return this.evaluationService.findOne(id, user);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateEvaluationDto: UpdateEvaluationDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.evaluationService.update(id, updateEvaluationDto, user);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
        return this.evaluationService.remove(id, user);
    }
}
