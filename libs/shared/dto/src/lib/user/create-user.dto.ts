import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsArray, IsUUID } from 'class-validator';
import { IsStrongPassword } from '@scrum-pm/shared/utils';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @IsStrongPassword()
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  roleIds?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  groupIds?: string[];
}

export class CreateUserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
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
  createdAt: Date;
}
