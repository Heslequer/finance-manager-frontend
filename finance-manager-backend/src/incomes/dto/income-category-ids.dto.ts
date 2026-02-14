import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class IncomeCategoryIdsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  categoryIds: string[];
}
