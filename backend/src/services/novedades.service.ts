import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Novedad } from '../entities/novedad.entity';

@Injectable()
export class NovedadesService {
  constructor(
    @InjectRepository(Novedad)
    private novedadesRepository: Repository<Novedad>
  ) {}

  async findLastRemision(): Promise<Novedad | null> {
    return await this.novedadesRepository
      .createQueryBuilder('novedad')
      .select('novedad.numero_remision')
      .orderBy('novedad.id', 'DESC')
      .getOne();
  }
} 