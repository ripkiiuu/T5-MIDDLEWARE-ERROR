import express from 'express';
import * as ctrl from '../controllers/menu.controller.js';
import { cekApiKey } from '../middleware/cekApiKey.js';
import { validasi } from '../middleware/validasi.js';
import { skemaMenu } from '../validators/menu.validator.js';

const router = express.Router();

router.get('/', ctrl.daftar);
router.get('/:id', ctrl.detail);
router.post('/', cekApiKey, validasi(skemaMenu), ctrl.buat);
router.put('/:id', cekApiKey, validasi(skemaMenu), ctrl.ubah);
router.delete('/:id', cekApiKey, ctrl.hapus);

export default router;
