function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  get databaseUrl(): string { return required('DATABASE_URL'); },
  get jwtAccessSecret(): string { return required('JWT_ACCESS_SECRET'); },
  get jwtRefreshSecret(): string { return required('JWT_REFRESH_SECRET'); },
  get port(): number { return Number(process.env.PORT ?? 3000); },
};
