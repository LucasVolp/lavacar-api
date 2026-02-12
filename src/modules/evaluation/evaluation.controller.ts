import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';

@Controller('evaluations')
export class EvaluationController {
    constructor(private readonly evaluationService: EvaluationService) {}

    @Post()
    create(@Body() createEvaluationDto: CreateEvaluationDto) {
        return this.evaluationService.create(createEvaluationDto);
    }

    @Get()
    findAll(
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
        });
    }

    @Get('stats/:shopId')
    getShopStats(@Param('shopId') shopId: string) {
        return this.evaluationService.getShopStats(shopId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.evaluationService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateEvaluationDto: UpdateEvaluationDto,
    ) {
        return this.evaluationService.update(id, updateEvaluationDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.evaluationService.remove(id);
    }
}
