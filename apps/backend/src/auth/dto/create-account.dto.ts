export class CreateAccountDto {
  username!: string;
  email!: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  password!: string;
}
