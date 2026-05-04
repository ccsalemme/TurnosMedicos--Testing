import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@Req() req: { user: AuthUser }) {
    return this.usersService.getMyProfile(req.user.id);
  }

  @Patch('me')
  async updateMyProfile(@Req() req: { user: AuthUser }, @Body() dto: UpdateMyProfileDto) {
    return this.usersService.updateMyProfile(req.user.id, dto);
  }
}
