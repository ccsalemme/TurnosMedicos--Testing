import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('doctor/:doctorUserId')
  async getDoctorAgenda(
    @Param('doctorUserId') doctorUserId: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.availabilityService.getDoctorAgenda(doctorUserId, from, to);
  }

  @Post('slots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR, Role.ADMIN)
  async createAvailability(@Req() req: { user: AuthUser }, @Body() dto: CreateAvailabilityDto) {
    return this.availabilityService.createAvailability(req.user, dto);
  }

  @Patch('slots/:availabilityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR, Role.ADMIN)
  async updateAvailability(
    @Req() req: { user: AuthUser },
    @Param('availabilityId') availabilityId: string,
    @Body() dto: UpdateAvailabilityDto
  ) {
    return this.availabilityService.updateAvailability(req.user, availabilityId, dto);
  }

  @Delete('slots/:availabilityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR, Role.ADMIN)
  async deleteAvailability(
    @Req() req: { user: AuthUser },
    @Param('availabilityId') availabilityId: string
  ) {
    return this.availabilityService.deleteAvailability(req.user, availabilityId);
  }

  @Post('blocks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR, Role.ADMIN)
  async createBlock(@Req() req: { user: AuthUser }, @Body() dto: CreateBlockDto) {
    return this.availabilityService.createBlock(req.user, dto);
  }

  @Delete('blocks/:blockId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR, Role.ADMIN)
  async deleteBlock(@Req() req: { user: AuthUser }, @Param('blockId') blockId: string) {
    return this.availabilityService.deleteBlock(req.user, blockId);
  }
}
