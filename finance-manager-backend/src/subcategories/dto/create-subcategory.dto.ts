import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateSubcategoryDto {
    @IsUUID()
    @IsNotEmpty()
    category_id: string;

    @IsString()
    @IsNotEmpty()
    name: string;

}