import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'MatchPasswords', async: false })
export class MatchPasswordsValidator implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const object = args.object as ChangePasswordDto;
    return confirmPassword === object.newPassword;
  }

  defaultMessage() {
    return 'Password confirmation does not match new password';
  }
}

export class ChangePasswordDto {
  @IsString()
  @ApiProperty({
    description: 'Current password',
    example: 'currentPassword123',
    type: String,
  })
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @MaxLength(50, { message: 'New password must not exceed 50 characters' })
  @ApiProperty({
    description: 'New password (minimum 8 characters)',
    example: 'newpassword123',
    type: String,
  })
  newPassword: string;

  @IsString()
  @Validate(MatchPasswordsValidator)
  @ApiProperty({
    description: 'Confirm new password',
    example: 'newpassword123',
    type: String,
  })
  confirmPassword: string;
}
