import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class SubcategoriesCategoryIdsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  categoryIds: string[];
}
