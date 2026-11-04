const menu = [
  { id: 1, nama: 'Nasi Goreng Kampung', harga: 18000, kategori: 'makanan', tersedia: true },
  { id: 2, nama: 'Mie Ayam Bakso', harga: 16000, kategori: 'makanan', tersedia: true },
  { id: 3, nama: 'Es Teh Manis', harga: 5000, kategori: 'minuman', tersedia: true },
  { id: 4, nama: 'Jus Alpukat', harga: 12000, kategori: 'minuman', tersedia: false },
  { id: 5, nama: 'Pisang Goreng', harga: 8000, kategori: 'camilan', tersedia: true }
];

let idBerikutnya = 6;

export function semua() {
  return menu;
}

export function cariById(id) {
  return menu.find(item => item.id === id);
}

export function cariByNama(nama) {
  return menu.find(item => item.nama.toLowerCase() === nama.toLowerCase());
}

export function simpan(input) {
  const baru = { id: idBerikutnya++, ...input };
  menu.push(baru);
  return baru;
}

export function ubah(id, input) {
  const index = menu.findIndex(item => item.id === id);
  menu[index] = { id, ...input };
  return menu[index];
}

export function hapus(id) {
  const index = menu.findIndex(item => item.id === id);
  menu.splice(index, 1);
}
