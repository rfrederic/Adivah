import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../lib/errors.js';

export function apiNotFound(_req, _res, next) {
  next(new ApiError(404, 'not_found'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, fields: err.fields } });
  }
  if (err instanceof multer.MulterError) {
    const code = err.code === 'LIMIT_FILE_SIZE' ? 'file_too_large' : 'upload_failed';
    return res.status(400).json({ error: { code } });
  }
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(400).json({ error: { code: 'bad_request' } });
  }
  if (err.code === 11000) return res.status(409).json({ error: { code: 'conflict' } });
  if (!env.isTest) console.error(err);
  // Aucun détail interne n'est renvoyé au navigateur.
  return res.status(500).json({ error: { code: 'server_error' } });
}
