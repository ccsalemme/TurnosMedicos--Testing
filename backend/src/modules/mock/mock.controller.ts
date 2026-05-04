import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req
} from '@nestjs/common';
import { Request } from 'express';
import { AppointmentStatus } from 'src/common/enums/appointment-status.enum';
import { Role } from 'src/common/enums/role.enum';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { MockDataService } from './mock-data.service';

@Controller()
export class MockController {
  constructor(private readonly mockData: MockDataService) {}

  @Post('auth/register')
  registerPatient(@Body() dto: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    document: string;
    birthDate: string;
    phone: string;
  }) {
    return this.mockData.registerPatient(dto);
  }

  @Post('auth/login')
  login(@Body() dto: { email: string; password: string }) {
    return this.mockData.login(dto);
  }

  @Get('auth/me')
  me(@Req() req: Request) {
    const user = this.requireAuth(req);
    return this.mockData.me(user.id);
  }

  @Get('users/me')
  myProfile(@Req() req: Request) {
    const user = this.requireAuth(req);
    return this.mockData.getMyProfile(user.id);
  }

  @Patch('users/me')
  updateMyProfile(
    @Req() req: Request,
    @Body() dto: { firstName?: string; lastName?: string; phone?: string; birthDate?: string }
  ) {
    const user = this.requireAuth(req);
    return this.mockData.updateMyProfile(user.id, dto);
  }

  @Get('specialties')
  listSpecialties() {
    return this.mockData.listSpecialties(true);
  }

  @Get('specialties/admin/all')
  listAllSpecialties(@Req() req: Request) {
    const user = this.requireAuth(req, [Role.ADMIN]);
    return this.mockData.listSpecialties(false);
  }

  @Post('specialties')
  createSpecialty(
    @Req() req: Request,
    @Body() dto: { name: string; description?: string; durationMinutes: number; isActive?: boolean }
  ) {
    const user = this.requireAuth(req, [Role.ADMIN]);
    return this.mockData.createSpecialty(user, dto);
  }

  @Patch('specialties/:id')
  updateSpecialty(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string; durationMinutes?: number; isActive?: boolean }
  ) {
    const user = this.requireAuth(req, [Role.ADMIN]);
    return this.mockData.updateSpecialty(user, id, dto);
  }

  @Get('doctors')
  listDoctors(@Query('specialtyId') specialtyId?: string, @Query('siteId') siteId?: string) {
    return this.mockData.listDoctors({ specialtyId, siteId });
  }

  @Post('doctors')
  createDoctor(
    @Req() req: Request,
    @Body() dto: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      licenseNumber: string;
      phone: string;
      siteId?: string;
      specialtyIds: string[];
      bio?: string;
    }
  ) {
    const user = this.requireAuth(req, [Role.ADMIN]);
    return this.mockData.createDoctor(user, dto);
  }

  @Patch('doctors/:doctorId')
  updateDoctor(
    @Req() req: Request,
    @Param('doctorId') doctorId: string,
    @Body() dto: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      siteId?: string;
      specialtyIds?: string[];
      bio?: string;
      isActive?: boolean;
    }
  ) {
    const user = this.requireAuth(req, [Role.ADMIN]);
    return this.mockData.updateDoctor(user, doctorId, dto);
  }

  @Get('availability/doctor/:doctorUserId')
  getDoctorAgenda(
    @Param('doctorUserId') doctorUserId: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.mockData.getDoctorAgenda(doctorUserId, from, to);
  }

  @Post('availability/slots')
  createAvailability(
    @Req() req: Request,
    @Body() dto: { doctorUserId?: string; weekday: number; startTime: string; endTime: string; isActive?: boolean }
  ) {
    const user = this.requireAuth(req, [Role.DOCTOR, Role.ADMIN]);
    return this.mockData.createAvailability(user, dto);
  }

  @Patch('availability/slots/:availabilityId')
  updateAvailability(
    @Req() req: Request,
    @Param('availabilityId') availabilityId: string,
    @Body() dto: { weekday?: number; startTime?: string; endTime?: string; isActive?: boolean }
  ) {
    const user = this.requireAuth(req, [Role.DOCTOR, Role.ADMIN]);
    return this.mockData.updateAvailability(user, availabilityId, dto);
  }

  @Delete('availability/slots/:availabilityId')
  deleteAvailability(@Req() req: Request, @Param('availabilityId') availabilityId: string) {
    const user = this.requireAuth(req, [Role.DOCTOR, Role.ADMIN]);
    return this.mockData.deleteAvailability(user, availabilityId);
  }

  @Post('availability/blocks')
  createBlock(
    @Req() req: Request,
    @Body() dto: { doctorUserId?: string; startAt: string; endAt: string; reason?: string }
  ) {
    const user = this.requireAuth(req, [Role.DOCTOR, Role.ADMIN]);
    return this.mockData.createBlock(user, dto);
  }

  @Delete('availability/blocks/:blockId')
  deleteBlock(@Req() req: Request, @Param('blockId') blockId: string) {
    const user = this.requireAuth(req, [Role.DOCTOR, Role.ADMIN]);
    return this.mockData.deleteBlock(user, blockId);
  }

  @Post('appointments/reserve')
  reserveAppointment(
    @Req() req: Request,
    @Body() dto: { doctorId: string; specialtyId: string; siteId: string; startAt: string; notes?: string }
  ) {
    const user = this.requireAuth(req, [Role.PATIENT]);
    return this.mockData.reserveAppointment(user, dto);
  }

  @Get('appointments/my')
  myAppointments(
    @Req() req: Request,
    @Query('status') status?: AppointmentStatus,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const user = this.requireAuth(req, [Role.PATIENT, Role.DOCTOR, Role.ADMIN]);
    return this.mockData.getMyAppointments(user, { status, from, to });
  }

  @Get('appointments/admin/board')
  adminBoard(
    @Req() req: Request,
    @Query('status') status?: AppointmentStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string
  ) {
    const user = this.requireAuth(req, [Role.ADMIN]);
    return this.mockData.getOperationalBoard(user, { status, from, to, doctorId, patientId });
  }

  @Patch('appointments/:appointmentId/cancel')
  cancelAppointment(
    @Req() req: Request,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: { reason?: string }
  ) {
    const user = this.requireAuth(req, [Role.PATIENT, Role.ADMIN]);
    return this.mockData.cancelAppointment(user, appointmentId, dto);
  }

  @Patch('appointments/:appointmentId/reschedule')
  rescheduleAppointment(
    @Req() req: Request,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: { newStartAt: string }
  ) {
    const user = this.requireAuth(req, [Role.PATIENT, Role.ADMIN]);
    return this.mockData.rescheduleAppointment(user, appointmentId, dto);
  }

  @Patch('appointments/:appointmentId/confirm')
  confirmAppointment(@Req() req: Request, @Param('appointmentId') appointmentId: string) {
    const user = this.requireAuth(req, [Role.DOCTOR, Role.ADMIN]);
    return this.mockData.confirmAppointment(user, appointmentId);
  }

  @Patch('appointments/:appointmentId/complete')
  completeAppointment(@Req() req: Request, @Param('appointmentId') appointmentId: string) {
    const user = this.requireAuth(req, [Role.DOCTOR, Role.ADMIN]);
    return this.mockData.completeAppointment(user, appointmentId);
  }

  @Patch('appointments/:appointmentId/no-show')
  noShowAppointment(@Req() req: Request, @Param('appointmentId') appointmentId: string) {
    const user = this.requireAuth(req, [Role.DOCTOR, Role.ADMIN]);
    return this.mockData.noShowAppointment(user, appointmentId);
  }

  @Get('admin/users')
  adminUsers(@Req() req: Request, @Query('role') role?: Role) {
    const user = this.requireAuth(req, [Role.ADMIN]);
    return this.mockData.adminUsers(user, role);
  }

  @Patch('admin/users/:userId/role')
  adminUpdateUserRole(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Body() dto: { role: Role; isActive?: boolean }
  ) {
    const user = this.requireAuth(req, [Role.ADMIN]);
    return this.mockData.adminUpdateUserRole(user, userId, dto);
  }

  @Get('admin/sites')
  adminSites(@Req() req: Request) {
    const user = this.requireAuth(req, [Role.ADMIN]);
    return this.mockData.adminSites(user);
  }

  @Post('admin/sites')
  adminCreateSite(
    @Req() req: Request,
    @Body() dto: { name: string; address: string; isActive?: boolean }
  ) {
    const user = this.requireAuth(req, [Role.ADMIN]);
    return this.mockData.adminCreateSite(user, dto);
  }

  @Patch('admin/sites/:siteId')
  adminUpdateSite(
    @Req() req: Request,
    @Param('siteId') siteId: string,
    @Body() dto: { name?: string; address?: string; isActive?: boolean }
  ) {
    const user = this.requireAuth(req, [Role.ADMIN]);
    return this.mockData.adminUpdateSite(user, siteId, dto);
  }

  @Get('admin/settings')
  adminSettings(@Req() req: Request) {
    const user = this.requireAuth(req, [Role.ADMIN]);
    return this.mockData.adminSettings(user);
  }

  @Put('admin/settings/:key')
  adminUpdateSetting(@Req() req: Request, @Param('key') key: string, @Body() dto: { value: string }) {
    const user = this.requireAuth(req, [Role.ADMIN]);
    return this.mockData.adminUpdateSetting(user, key, dto.value);
  }

  @Get('admin/dashboard')
  adminDashboard(@Req() req: Request) {
    const user = this.requireAuth(req, [Role.ADMIN]);
    return this.mockData.adminDashboard(user);
  }

  @Get('audit')
  auditLogs(
    @Req() req: Request,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('actorId') actorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const user = this.requireAuth(req, [Role.ADMIN]);
    return this.mockData.auditLogs(user, { action, entity, actorId, from, to });
  }

  private requireAuth(req: Request, roles?: Role[]): AuthUser {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const user = this.mockData.getAuthUserFromToken(token);

    if (roles) {
      this.mockData.ensureRole(user, roles);
    }

    return user;
  }
}
