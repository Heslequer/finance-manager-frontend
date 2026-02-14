import { IsOptional, IsUUID } from 'class-validator';

export class UpdateIncomeCategoryDto {
  @IsUUID()
  category_id: string;

  @IsUUID()
  @IsOptional()
  subcategory_id?: string;
}
