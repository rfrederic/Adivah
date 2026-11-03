import { ApiError } from '../lib/errors.js';

/** Valide une entrée avec Zod. Les champs invalides sont renvoyés pour être traduits côté client. */
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const fields = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    if (!fields[key]) fields[key] = issue.code === 'too_small' ? 'too_short' : issue.code === 'too_big' ? 'too_long' : 'invalid';
  }
  throw new ApiError(400, 'validation', fields);
}
