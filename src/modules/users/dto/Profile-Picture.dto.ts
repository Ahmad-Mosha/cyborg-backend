import { ApiProperty } from '@nestjs/swagger';

export class ProfilePictureDto {
  @ApiProperty({
    description: "User's profile picture URL",
    example: 'https://bucket-name.s3.region.amazonaws.com/uploads/uuid.jpg',
    type: String,
  })
  url: string;

  @ApiProperty({
    description: "User's profile picture key in storage",
    example: 'uploads/uuid.jpg',
    type: String,
  })
  key: string;

  @ApiProperty({
    description: "Profile picture filename",
    example: 'uuid.jpg',
    type: String,
  })
  filename: string;

  @ApiProperty({
    description: "Profile picture size in bytes",
    example: 102400,
    type: Number,
  })
  size: number;
}