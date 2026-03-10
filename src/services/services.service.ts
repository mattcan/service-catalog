import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { FindManyOptions, Repository } from 'typeorm'
import { ILike } from 'typeorm'
import { Service } from './entities/service.entity'
import { Version } from './entities/version.entity'

type FindOptions = Record<string, any>

interface Pagination {
  page: number
  pageSize: number
}

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
  ) {}

  create(service: Service): Promise<Service> {
    return this.serviceRepo.save(service)
  }

  async findAll(
    opts: FindOptions,
  ): Promise<[Array<Service>, number, Pagination]> {
    const queryOpt: FindManyOptions<Service> = {
      relations: { versions: true },
    }

    const { pageSize, page, search, sort } = {
      pageSize: 10,
      page: 0,
      search: '',
      sort: null,
      ...opts,
    }

    if (page) {
      queryOpt.skip = (page - 1) * pageSize
      queryOpt.take = pageSize
    }

    if (search) {
      queryOpt.where = [
        { name: ILike(`%${search}%`) },
        { description: ILike(`%${search}%`) },
      ]
    }

    if (sort) {
      queryOpt.order = { ...sort }
    }

    const results = await this.serviceRepo.findAndCount(queryOpt)

    return [...results, { page, pageSize }]
  }

  findOne(id: number): Promise<Service> {
    return this.serviceRepo.findOneOrFail({
      where: { id },
      relations: { versions: true },
    })
  }

  async update(id: number, service: Service) {
    return this.serviceRepo.update(id, service)
  }

  remove(id: number) {
    return this.serviceRepo.softDelete(id)
  }
}
