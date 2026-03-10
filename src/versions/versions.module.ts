import { Module } from '@nestjs/common'
import { ServicesModule } from '../services/services.module'
import { VersionsController } from './versions.controller'
import { VersionsService } from './versions.service'

@Module({
  imports: [ServicesModule],
  providers: [VersionsService],
  controllers: [VersionsController],
})
export class VersionsModule {}
