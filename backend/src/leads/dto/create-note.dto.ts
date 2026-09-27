import { Transform } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateNoteDto {

    @Transform(({ value }) => value?.trim())
    @IsNotEmpty()
    @IsString()
    content: string;
}