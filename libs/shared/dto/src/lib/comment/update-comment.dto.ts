import { IsString, IsOptional, IsArray, IsUUID, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @MaxLength(2000)
  content: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  mentions?: string[];
}

export class UpdateCommentResponseDto {
  id: string;
  content: string;
  edited: boolean;
  editedAt: Date;
  editedBy: string;
  mentions: string[];
  updatedAt: Date;
}

export class AddReactionDto {
  @IsString()
  emoji: string;
}

export class RemoveReactionDto {
  @IsString()
  emoji: string;
}

export class CommentReactionResponseDto {
  userId: string;
  emoji: string;
  timestamp: Date;
}
