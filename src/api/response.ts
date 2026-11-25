import { expect, type APIResponse } from '@playwright/test';
import type { z } from 'zod';
import { errorSchema } from './schemas/common';

/**
 * Checks a response's status and content type, validates its JSON body against a
 * schema, then returns the typed body. Failures show the URL and the body, so the
 * report explains what the API actually returned.
 */
export async function expectResponse<Schema extends z.ZodTypeAny>(
  response: APIResponse,
  status: number,
  schema: Schema,
): Promise<z.infer<Schema>> {
  const text = await response.text();
  expect(response.status(), `status of ${response.url()}\n${text}`).toBe(status);
  expect(response.headers()['content-type'], `content type of ${response.url()}`).toContain('application/json');

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON from ${response.url()}, got:\n${text}`);
  }

  const result = schema.safeParse(body);
  const issues = result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join('.') || '(body)'}: ${issue.message}`);
  expect(issues, `schema of ${response.url()}`).toEqual([]);
  return result.data as z.infer<Schema>;
}

/**
 * Checks an error response: status, and a body holding exactly the expected message.
 * The error schema is strict, so this also proves no other data (e.g. a token) leaks out.
 */
export async function expectError(response: APIResponse, status: number, message: string): Promise<void> {
  const body = await expectResponse(response, status, errorSchema);
  expect(body.message, `error message of ${response.url()}`).toBe(message);
}
