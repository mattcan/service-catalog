import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Service } from './entities/service.entity'
import { Version } from './entities/version.entity'
import { ServicesController } from './services.controller'
import { ServicesService } from './services.service'

@Module({
  imports: [TypeOrmModule.forFeature([Service, Version])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [TypeOrmModule, ServicesService],
})
export class ServicesModule {}
