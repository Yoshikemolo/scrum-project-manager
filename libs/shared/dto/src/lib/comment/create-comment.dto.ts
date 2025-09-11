import { IsString, IsUUID, IsOptional, IsArray, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MaxLength(2000)
  content: string;

  @IsUUID()
  taskId: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  mentions?: string[];
}

export class CreateCommentResponseDto {
  id: string;
  content: string;
  author: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  task: {
    id: string;
    key: string;
    title: string;
  };
  parent?: {
    id: string;
    content: string;
  };
  mentions: string[];
  createdAt: Date;
}
