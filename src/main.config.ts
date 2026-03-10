import { INestApplication, ValidationPipe } from '@nestjs/common'

export function mainConfig(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      // Feels a bit more like fastify.schema
      whitelist: true,

      // Get typed input to handler
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
}
