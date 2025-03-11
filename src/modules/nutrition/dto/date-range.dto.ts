import { IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DateRangeDto {
    @ApiProperty({
        description: 'Start date',
        type: Date,
        example: '2025-03-01'
  })
    @IsDate()
    @Type(() => Date)
    @IsNotEmpty()
    startDate: Date;

  @ApiProperty({
    description: 'End date',
    type: Date,
    example: '2025-03-07'
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endDate: Date;
}