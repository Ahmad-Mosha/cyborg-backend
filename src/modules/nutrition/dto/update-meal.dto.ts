import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { AddMealDto } from './add-meal.dto';

export class UpdateMealDto extends PartialType(AddMealDto) {}
