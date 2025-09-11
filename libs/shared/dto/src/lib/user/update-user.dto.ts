import { IsString, MinLength, MaxLength, IsOptional, IsArray, IsUUID, IsUrl, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  firstName?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  lastName?: string;

  @IsUrl()
  @IsOptional()
  avatar?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  roleIds?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  groupIds?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateUserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  roles: Array<{
    id: string;
    name: string;
  }>;
  groups: Array<{
    id: string;
    name: string;
  }>;
  updatedAt: Date;
}
