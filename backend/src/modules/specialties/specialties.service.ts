import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { sanitizePayload } from 'src/common/utils/sanitize.util';
import { AuditService } from '../audit/audit.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';

@Injectable()
export class SpecialtiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async list() {
    return this.prisma.specialty.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  async listAll() {
    return this.prisma.specialty.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async create(actorId: string, input: CreateSpecialtyDto) {
    const dto = sanitizePayload(input);

    const exists = await this.prisma.specialty.findUnique({
      where: { name: dto.name }
    });

    if (exists) {
      throw new BadRequestException('La especialidad ya existe');
    }

    const specialty = await this.prisma.specialty.create({
      data: {
        name: dto.name,
        description: dto.description,
        durationMinutes: dto.durationMinutes,
        isActive: dto.isActive ?? true
      }
    });

    await this.auditService.record({
      actorId,
      action: 'SPECIALTY_CREATE',
      entity: 'SPECIALTY',
      entityId: specialty.id,
      metadata: { name: specialty.name }
    });

    return specialty;
  }

  async update(actorId: string, id: string, input: UpdateSpecialtyDto) {
    const dto = sanitizePayload(input);

    const specialty = await this.prisma.specialty.findUnique({ where: { id } });
    if (!specialty) {
      throw new NotFoundException('Especialidad no encontrada');
    }

    const updated = await this.prisma.specialty.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        durationMinutes: dto.durationMinutes,
        isActive: dto.isActive
      }
    });

    await this.auditService.record({
      actorId,
      action: 'SPECIALTY_UPDATE',
      entity: 'SPECIALTY',
      entityId: id,
      metadata: { updatedFields: Object.keys(dto) }
    });

    return updated;
  }
}
