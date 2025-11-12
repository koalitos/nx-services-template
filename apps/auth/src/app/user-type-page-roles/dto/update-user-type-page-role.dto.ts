import { PartialType } from '@nestjs/swagger';
import { CreateUserTypePageRoleDto } from './create-user-type-page-role.dto';

export class UpdateUserTypePageRoleDto extends PartialType(CreateUserTypePageRoleDto) {}
