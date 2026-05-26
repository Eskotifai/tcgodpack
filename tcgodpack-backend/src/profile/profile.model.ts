export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

export class Profile {
  constructor(
    // public username: string,
    public email: string,
    public password: string,
    public name: string,
    public role: UserRole,
    public purchasedProducts: string[] = [],
  ) {}
}
