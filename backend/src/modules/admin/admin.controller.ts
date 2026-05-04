import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AdminService } from './admin.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async users(@Query('role') role?: Role) {
    return this.adminService.listUsers(role);
  }

  @Patch('users/:userId/role')
  async updateUserRole(
    @Req() req: { user: AuthUser },
    @Param('userId') userId: string,
    @Body() dto: UpdateUserRoleDto
  ) {
    return this.adminService.updateUserRole(req.user.id, userId, dto);
  }

  @Get('sites')
  async listSites() {
    return this.adminService.listSites();
  }

  @Post('sites')
  async createSite(@Req() req: { user: AuthUser }, @Body() dto: CreateSiteDto) {
    return this.adminService.createSite(req.user.id, dto);
  }

  @Patch('sites/:siteId')
  async updateSite(
    @Req() req: { user: AuthUser },
    @Param('siteId') siteId: string,
    @Body() dto: UpdateSiteDto
  ) {
    return this.adminService.updateSite(req.user.id, siteId, dto);
  }

  @Get('settings')
  async settings() {
    return this.adminService.getSettings();
  }

  @Put('settings/:key')
  async updateSetting(
    @Req() req: { user: AuthUser },
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto
  ) {
    return this.adminService.updateSetting(req.user.id, key, dto);
  }

  @Get('dashboard')
  async dashboard() {
    return this.adminService.getDashboard();
  }
}
