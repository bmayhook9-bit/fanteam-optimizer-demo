export interface DbUser {
  id: number;
  username: string;
  password: string;
  tier: string;
}

declare const User: {
  createUser(
    username: string,
    password: string,
    tier: string,
  ): Promise<Omit<DbUser, 'password'>>;
  findByUsername(username: string): Promise<DbUser | undefined>;
};

export default User;
