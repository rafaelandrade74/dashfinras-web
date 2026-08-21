export interface GetUserDto {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  telephone?: string;
  validEmail: boolean;
  validTel: boolean;
  gestorId?: string;
  gestorFirstName?: string;
  gestorLastName?: string;
}

export interface AddUserDto {
  firstName: string;
  lastName: string;
  telephone: string;
  gestorUserId?: string;
}
