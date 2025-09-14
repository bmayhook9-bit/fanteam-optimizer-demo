declare const _default: {
  createUser(
    username: string,
    password: string,
    tier?: string,
  ): Promise<{ id: number; username: string; tier: string }>;
  findByUsername(
    username: string,
  ): Promise<
    | { id: number; username: string; password: string; tier?: string }
    | undefined
  >;
  close(): Promise<void>;
};
export default _default;
