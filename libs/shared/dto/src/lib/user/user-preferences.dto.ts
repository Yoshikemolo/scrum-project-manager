import { IsString, IsBoolean, IsOptional, IsIn, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class NotificationPreferencesDto {
  @IsBoolean()
  @IsOptional()
  email?: boolean;

  @IsBoolean()
  @IsOptional()
  push?: boolean;

  @IsBoolean()
  @IsOptional()
  inApp?: boolean;

  @IsBoolean()
  @IsOptional()
  dailyDigest?: boolean;

  @IsBoolean()
  @IsOptional()
  weeklyReport?: boolean;

  @IsBoolean()
  @IsOptional()
  taskAssigned?: boolean;

  @IsBoolean()
  @IsOptional()
  taskCompleted?: boolean;

  @IsBoolean()
  @IsOptional()
  commentMention?: boolean;

  @IsBoolean()
  @IsOptional()
  projectUpdate?: boolean;
}

class DisplaySettingsDto {
  @IsBoolean()
  @IsOptional()
  compactView?: boolean;

  @IsBoolean()
  @IsOptional()
  showAvatars?: boolean;

  @IsBoolean()
  @IsOptional()
  animationsEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  sidebarCollapsed?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  kanbanColumns?: string[];
}

export class UpdateUserPreferencesDto {
  @IsIn(['light', 'dark', 'auto'])
  @IsOptional()
  theme?: 'light' | 'dark' | 'auto';

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @ValidateNested()
  @Type(() => NotificationPreferencesDto)
  @IsOptional()
  notifications?: NotificationPreferencesDto;

  @ValidateNested()
  @Type(() => DisplaySettingsDto)
  @IsOptional()
  displaySettings?: DisplaySettingsDto;
}

export class UserPreferencesResponseDto {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationPreferencesDto;
  displaySettings: DisplaySettingsDto;
}
