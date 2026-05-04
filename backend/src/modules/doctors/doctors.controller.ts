import {
  Body,
  Controller,
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
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { ListDoctorsQueryDto } from './dto/list-doctors-query.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  async list(@Query() query: ListDoctorsQueryDto) {
    return this.doctorsService.list(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Req() req: { user: AuthUser }, @Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(req.user.id, dto);
  }

  @Patch(':doctorId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Req() req: { user: AuthUser },
    @Param('doctorId') doctorId: string,
    @Body() dto: UpdateDoctorDto
  ) {
    return this.doctorsService.update(req.user.id, doctorId, dto);
  }
}
