import * as data from '../data/menu.data.js';
import { AppError } from '../utils/AppError.js';

export async function daftarMenu({ kategori }) {
  const semua = data.semua();
  return kategori ? semua.filter(item => item.kategori === kategori) : semua;
}

export async function detailMenu(id) {
  const item = data.cariById(Number(id));
  if (!item) {
    throw new AppError(404, 'Menu tidak ditemukan', 'NOT_FOUND');
  }
  return item;
}

export async function buatMenu(input) {
  if (data.cariByNama(input.nama)) {
    throw new AppError(409, `Nama menu ${input.nama} sudah terdaftar`, 'NAMA_DUPLIKAT');
  }
  return data.simpan(input);
}

export async function ubahMenu(id, input) {
  const item = await detailMenu(id);
  const kembar = data.cariByNama(input.nama);
  if (kembar && kembar.id !== item.id) {
    throw new AppError(409, `Nama menu ${input.nama} sudah terdaftar`, 'NAMA_DUPLIKAT');
  }
  return data.ubah(item.id, input);
}

export async function hapusMenu(id) {
  const item = await detailMenu(id);
  data.hapus(item.id);
}
