import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Version } from '../services/entities/version.entity'

@Injectable()
export class VersionsService {
  constructor(
    @InjectRepository(Version) private versionRepo: Repository<Version>,
  ) {}

  create(version: Version): Promise<Version> {
    return this.versionRepo.save(version)
  }

  findAll(serviceId: number) {
    return this.versionRepo.findBy({ service: { id: serviceId } })
  }

  findOne(versionId: number, serviceId: number) {
    return this.versionRepo.findOneByOrFail({
      id: versionId,
      service: { id: serviceId },
    })
  }

  remove(versionId: number, serviceId: number) {
    return this.versionRepo.softDelete({
      id: versionId,
      service: { id: serviceId },
    })
  }
}
