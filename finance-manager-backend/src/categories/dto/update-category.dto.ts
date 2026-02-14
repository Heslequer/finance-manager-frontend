import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum CategoryType {
    expense = 'expense',
    income = 'income',
}

export class UpdateCategoryDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    color_hex: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(CategoryType)
    type: CategoryType;
}