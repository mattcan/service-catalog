import { IsEmpty, IsOptional, IsString } from 'class-validator'

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  /** Making sure that the user does not try to update version through service endpoint **/
  // TODO custom error instructing user on correct endpoint

  @IsEmpty()
  version: any

  @IsEmpty()
  versions: any
}
