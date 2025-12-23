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
    findAll(@Query('shopId') shopId?: string) {
        return this.evaluationService.findAll(shopId);
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
        @Body('userId') userId?: string,
    ) {
        return this.evaluationService.update(id, updateEvaluationDto, userId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Body('userId') userId?: string) {
        return this.evaluationService.remove(id, userId);
    }
}
