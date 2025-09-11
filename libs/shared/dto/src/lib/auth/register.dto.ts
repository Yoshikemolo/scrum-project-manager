import { IsEmail, IsString, MinLength, MaxLength, IsBoolean, Matches } from 'class-validator';
import { IsStrongPassword } from '@scrum-pm/shared/utils';

export class RegisterDto {
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

  @IsBoolean()
  acceptTerms: boolean;
}

export class RegisterResponseDto {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  verificationRequired: boolean;
}

export class VerifyEmailDto {
  @IsString()
  token: string;
}

export class VerifyEmailResponseDto {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}
