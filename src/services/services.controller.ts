import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import { Response } from 'express'
import { EntityNotFoundError } from 'typeorm'
import { CreateServiceDto } from './dto/create-service.dto'
import { FindServicesQueryDto } from './dto/find-services-query.dto'
import { UpdateServiceDto } from './dto/update-service.dto'
import { Service } from './entities/service.entity'
import { ServicesService } from './services.service'

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body() createServiceDto: CreateServiceDto,
    @Res() res: Response,
  ) {
    const service = new Service()
    service.name = createServiceDto.name
    service.description = createServiceDto.description
    service.versions = createServiceDto.version
      ? [createServiceDto.version as any]
      : []
    const saved = await this.servicesService.create(service)
    res.setHeader('Location', `/services/${saved.id}`)
    res.send()
  }

  @Get()
  async findAll(@Query() query: FindServicesQueryDto, @Res() res: Response) {
    let sort = {}
    if (query.sort) {
      const sortFieldAllowList = ['name', 'description']

      sort = query.sort
        .split(',')
        .map((val) => {
          let [marker, ...letters] = val.split('')
          let word: string

          if (marker !== '-' && marker !== '+') {
            word = `${marker}${letters.join('')}`
            marker = '+'
          } else {
            word = letters.join('')
          }

          return { marker, word }
        })
        .filter(({ word }) => sortFieldAllowList.includes(word))
        .reduce((acc, { marker, word }) => {
          if (marker === '-') acc[word] = 'DESC'
          else acc[word] = 'ASC'

          return acc
        }, {})
    }

    const [services, count, pagination] = await this.servicesService.findAll({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      sort,
    })

    if (pagination.page) {
      const totalPages = Math.ceil(count / pagination.pageSize)

      res.setHeader('x-page', pagination.page)
      res.setHeader('x-per-page', pagination.pageSize)
      res.setHeader('x-total', count)
      res.setHeader('x-total-pages', totalPages)

      if (pagination.page > 1) {
        res.setHeader('x-prev-page', pagination.page - 1)
      }
      if (pagination.page + 1 <= totalPages) {
        res.setHeader('x-next-page', pagination.page + 1)
      }
    }

    res.send({
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        versionCount: s.versions.length,
      })),
    })
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    let result

    try {
      result = await this.servicesService.findOne(id)
    } catch (err) {
      if (err instanceof EntityNotFoundError) {
        throw new NotFoundException('Could not find service')
      }

      throw new InternalServerErrorException('Unknown error locating service', {
        cause: err,
      })
    }

    return {
      name: result.name,
      description: result.description,
      versions: result.versions.map((v) => ({
        url: `/services/${id}/versions/${v.id}`,
        tag: v.tag,
        description: v.description,
      })),
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    const service = new Service()
    service.id = id
    if (updateServiceDto.name) service.name = updateServiceDto.name
    if (updateServiceDto.description)
      service.description = updateServiceDto.description

    const updateResult = await this.servicesService.update(id, service)
    if (updateResult.affected < 1) {
      throw new NotFoundException('Could not find service to update')
    }

    return
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    const result = await this.servicesService.remove(id)

    if (result.affected === 0) {
      throw new NotFoundException('Could not find service to delete')
    }
  }
}
