import Joi from 'joi';

export const skemaMenu = Joi.object({
  nama: Joi.string().trim().min(3).max(50).required(),
  harga: Joi.number().integer().min(1000).max(100000).required(),
  kategori: Joi.string().valid('makanan', 'minuman', 'camilan').required(),
  tersedia: Joi.boolean().default(true)
});
