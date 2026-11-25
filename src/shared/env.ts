import { existsSync } from 'node:fs';

/**
 * Environment-specific settings (URLs of hosted systems, credentials) are never kept
 * in the repository. Locally they come from an untracked `.env` file; in CI, from
 * the pipeline's variables/secrets. `.env.example` lists the names.
 */
export function loadEnvFile(path = '.env'): void {
  if (existsSync(path)) process.loadEnvFile(path);
}

/** Value of a variable that must be set; fails fast with a hint instead of running against nothing. */
export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Environment variable ${name} is not set. Add it to .env (see .env.example) or to the CI variables.`,
    );
  }
  return value;
}

/**
 * Value of a variable, or a local-development default (e.g. a localhost URL) when it
 * isn't set. On CI the variable is required: nothing listens on localhost there, so a
 * missing value should fail clearly rather than as connection errors.
 */
export function envOrLocalDefault(name: string, localDefault: string): string {
  if (process.env.CI) return requireEnv(name);
  return process.env[name]?.trim() || localDefault;
}
