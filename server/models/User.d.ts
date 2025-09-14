export interface DbUser {
  id: number;
  username: string;
  password: string;
  tier: string;
}

export function createUser(
  username: string,
  password: string,
  tier?: string,
): Promise<Omit<DbUser, 'password'>>;

export function findByUsername(username: string): Promise<DbUser | undefined>;
