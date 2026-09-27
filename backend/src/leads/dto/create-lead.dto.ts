import { IsEmail, IsEnum, IsNotEmpty, IsString } from "class-validator";
import { LeadStatus } from "../enums/lead-status-enum";
import { Transform } from "class-transformer";

export class CreateLeadDto {
    @Transform(({ value }) => value?.trim())
    @IsNotEmpty()
    @IsString()
    name: string;

    @Transform(({ value }) => value?.trim())
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @Transform(({ value }) => value?.trim())
    @IsNotEmpty()
    @IsString()
    phone: string;

    @IsNotEmpty()
    @IsEnum(LeadStatus)
    status: LeadStatus;
}
