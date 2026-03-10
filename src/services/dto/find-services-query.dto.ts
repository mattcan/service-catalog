import { IsInt, IsOptional, IsString } from 'class-validator'

export class FindServicesQueryDto {
  // Plain text, fuzzy match on name/description
  @IsString()
  @IsOptional()
  search?: string

  @IsInt()
  @IsOptional()
  page?: number

  @IsInt()
  @IsOptional()
  pageSize?: number

  // +name,-description
  @IsString()
  @IsOptional()
  sort?: string
}
