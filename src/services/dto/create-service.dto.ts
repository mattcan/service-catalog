import { IsNotEmpty, IsString } from 'class-validator'
import { CreateVersionDto } from '../../versions/dto/create-version.dto'

export class CreateServiceDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsNotEmpty()
  @IsString()
  description: string

  @IsNotEmpty()
  version: CreateVersionDto
}
