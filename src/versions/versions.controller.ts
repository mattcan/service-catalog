import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Res,
} from '@nestjs/common'
import { Response } from 'express'
import { EntityNotFoundError } from 'typeorm'
import { Service } from '../services/entities/service.entity'
import { Version } from '../services/entities/version.entity'
import { ServicesService } from '../services/services.service'
import { CreateVersionDto } from './dto/create-version.dto'
import { VersionsService } from './versions.service'

@Controller('services/:serviceId/versions')
export class VersionsController {
  constructor(
    private readonly versionsService: VersionsService,
    private readonly servicesService: ServicesService,
  ) {}

  @Get()
  async findAll(@Param('serviceId') serviceId: number) {
    const versions = await this.versionsService.findAll(serviceId)
    return {
      versions: versions.map((v) => ({
        id: v.id,
        tag: v.tag,
        description: v.description,
      })),
    }
  }

  @Get(':id')
  async findOne(
    @Param('serviceId') serviceId: number,
    @Param('id') versionId: number,
  ) {
    let result

    try {
      result = await this.versionsService.findOne(versionId, serviceId)
    } catch (err) {
      if (err instanceof EntityNotFoundError) {
        throw new NotFoundException('Could not find version')
      }

      throw new InternalServerErrorException('Unknown error locating version', {
        cause: err,
      })
    }

    return {
      id: result.id,
      tag: result.tag,
      description: result.description,
    }
  }

  @Post()
  @HttpCode(201)
  async create(
    @Param('serviceId') serviceId: number,
    @Body() createDto: CreateVersionDto,
    @Res() res: Response,
  ) {
    let service: Service
    try {
      service = await this.servicesService.findOne(serviceId)
    } catch (err) {
      if (err instanceof EntityNotFoundError) {
        throw new NotFoundException('Could not find service')
      }

      throw new InternalServerErrorException('Could not find service', {
        cause: err,
      })
    }

    const version = new Version()
    version.tag = createDto.tag
    version.description = createDto.description
    version.service = service

    try {
      const saved = await this.versionsService.create(version)
      res.setHeader('Location', `/services/${serviceId}/versions/${saved.id}`)
      res.send()
    } catch (err) {
      throw new InternalServerErrorException('Could not save version', {
        cause: err,
      })
    }
  }

  @Delete(':id')
  async remove(
    @Param('serviceId') serviceId: number,
    @Param('id') versionId: number,
  ) {
    const result = await this.versionsService.remove(versionId, serviceId)

    if (result.affected === 0) {
      throw new NotFoundException('Could not find version to delete')
    }
  }
}
