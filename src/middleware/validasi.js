import { AppError } from '../utils/AppError.js';

export const validasi = (skema) => (req, res, next) => {
  const { error, value } = skema.validate(req.body ?? {}, { abortEarly: false });

  if (error) {
    const pesan = error.details.map(detail => detail.message).join('; ');
    return next(new AppError(422, pesan, 'VALIDATION_ERROR'));
  }

  req.body = value;
  next();
};
