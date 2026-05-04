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
import { AppointmentsService } from './appointments.service';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments-query.dto';
import { ReserveAppointmentDto } from './dto/reserve-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('reserve')
  @Roles(Role.PATIENT)
  async reserve(@Req() req: { user: AuthUser }, @Body() dto: ReserveAppointmentDto) {
    return this.appointmentsService.reserve(req.user, dto);
  }

  @Get('my')
  async myAppointments(@Req() req: { user: AuthUser }, @Query() query: ListAppointmentsQueryDto) {
    return this.appointmentsService.getMyAppointments(req.user, query);
  }

  @Get('admin/board')
  @Roles(Role.ADMIN)
  async board(@Query() query: ListAppointmentsQueryDto) {
    return this.appointmentsService.getOperationalBoard(query);
  }

  @Patch(':appointmentId/cancel')
  @Roles(Role.PATIENT, Role.ADMIN)
  async cancel(
    @Req() req: { user: AuthUser },
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CancelAppointmentDto
  ) {
    return this.appointmentsService.cancel(req.user, appointmentId, dto);
  }

  @Patch(':appointmentId/reschedule')
  @Roles(Role.PATIENT, Role.ADMIN)
  async reschedule(
    @Req() req: { user: AuthUser },
    @Param('appointmentId') appointmentId: string,
    @Body() dto: RescheduleAppointmentDto
  ) {
    return this.appointmentsService.reschedule(req.user, appointmentId, dto);
  }

  @Patch(':appointmentId/confirm')
  @Roles(Role.DOCTOR, Role.ADMIN)
  async confirm(@Req() req: { user: AuthUser }, @Param('appointmentId') appointmentId: string) {
    return this.appointmentsService.markConfirmed(req.user, appointmentId);
  }

  @Patch(':appointmentId/complete')
  @Roles(Role.DOCTOR, Role.ADMIN)
  async complete(@Req() req: { user: AuthUser }, @Param('appointmentId') appointmentId: string) {
    return this.appointmentsService.markCompleted(req.user, appointmentId);
  }

  @Patch(':appointmentId/no-show')
  @Roles(Role.DOCTOR, Role.ADMIN)
  async noShow(@Req() req: { user: AuthUser }, @Param('appointmentId') appointmentId: string) {
    return this.appointmentsService.markNoShow(req.user, appointmentId);
  }
}
