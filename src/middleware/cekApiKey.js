import { AppError } from '../utils/AppError.js';

export function cekApiKey(req, res, next) {
  const kunci = process.env.API_KEY;

  // Tanpa API_KEY server tetap melayani GET, tetapi tidak ada penulisan yang diizinkan.
  if (!kunci || req.get('x-api-key') !== kunci) {
    return next(new AppError(401, 'API key tidak valid', 'UNAUTHORIZED'));
  }

  next();
}
