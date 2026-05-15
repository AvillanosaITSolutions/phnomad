import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VisasService } from './visas.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateVisaDto } from './dto/create-visa.dto';
import { UpdateVisaDto } from './dto/update-visa.dto';

@Controller('visas')
@UseGuards(JwtAuthGuard)
export class VisasController {
  constructor(private readonly visasService: VisasService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateVisaDto) {
    return this.visasService.create(user.sub, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.visasService.findAll(user.sub);
  }

  @Get(':id/renewal-history')
  getRenewalHistory(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.visasService.getRenewalHistory(user.sub, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateVisaDto,
  ) {
    return this.visasService.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.visasService.remove(user.sub, id);
  }
}
