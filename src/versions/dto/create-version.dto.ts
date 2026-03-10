import { IsNotEmpty, IsOptional } from 'class-validator'

export class CreateVersionDto {
  @IsNotEmpty()
  tag: string

  @IsOptional()
  description?: string
}
