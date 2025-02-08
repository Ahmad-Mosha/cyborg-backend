import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({
    description: 'The content of the message to send',
    example: 'Help me create a workout plan',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
