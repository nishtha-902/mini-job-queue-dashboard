import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(80)
  type!: string;
}
