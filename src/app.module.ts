import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { Service } from './services/entities/service.entity'
import { Version } from './services/entities/version.entity'
import { ServicesModule } from './services/services.module'
import { VersionsModule } from './versions/versions.module'

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: parseInt(configService.get<string>('DATABASE_PORT')),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        entities: [Service, Version],
        synchronize: true,
      }),
    }),
    ServicesModule,
    VersionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
