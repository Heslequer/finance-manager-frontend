import { IsOptional, IsUUID } from 'class-validator';

export class UpdateExpenseCategoryDto {
  @IsUUID()
  category_id: string;

  @IsUUID()
  @IsOptional()
  subcategory_id?: string;
}
