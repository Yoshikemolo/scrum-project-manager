import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { IsStrongPassword } from '@scrum-pm/shared/utils';

export class RequestPasswordResetDto {
  @IsEmail()
  email: string;
}

export class RequestPasswordResetResponseDto {
  success: boolean;
  message: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @IsStrongPassword()
  newPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  confirmPassword: string;
}

export class ResetPasswordResponseDto {
  success: boolean;
  message: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @IsStrongPassword()
  newPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  confirmPassword: string;
}

export class ChangePasswordResponseDto {
  success: boolean;
  message: string;
}
