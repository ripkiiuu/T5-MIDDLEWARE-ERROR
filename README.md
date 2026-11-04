# Tugas 5 - Middleware & Error Terpusat

API kantin berbasis Express 5, menggunakan router, middleware, Joi, dan penanganan error terpusat. Data disimpan sementara di memori.

## Identitas

- Nama: **Muhammad Rifqy Habibi**
- NIM: **F12D02410080** (Varian **B — Kantin**, digit terakhir 0)

## Cara Menjalankan

Gunakan Node.js 20 atau yang lebih baru. Jalankan dari akar proyek:

```sh
npm install
```

Atur API key sebelum menjalankan server. Di PowerShell:

```powershell
$env:API_KEY = 'rahasia123'
npm run dev
```

Di Command Prompt: `set API_KEY=rahasia123`, lalu `npm run dev`. Di bash: `API_KEY=rahasia123 npm run dev`. Server tersedia di `http://localhost:3000`. Samakan `@apiKey` di `requests.http` jika memakai nilai lain. Jalankan `npm test` untuk pengujian otomatis.

**Jika `API_KEY` tidak diatur:** server tetap bisa dijalankan dengan `npm run dev` dan endpoint GET tetap dapat diakses, tetapi **POST, PUT, dan DELETE selalu ditolak 401**, termasuk ketika header `x-api-key` kosong. Ini pilihan *fail closed*: tidak ada nilai kunci bawaan yang tanpa sengaja memberi izin menulis. Jangan menyimpan kunci sungguhan di repositori. File `requests.http` memakai kunci contoh untuk latihan lokal.

## Struktur Proyek

```text
.
├── index.js                         # Middleware global, router /menu, penanganan error, server
├── src/
│   ├── routes/menu.routes.js        # Peta endpoint dan middleware khusus rute
│   ├── controllers/menu.controller.js # Baca req, panggil service, kirim res
│   ├── services/menu.service.js     # Filter, detail, aturan nama unik, dan 404/409
│   ├── data/menu.data.js            # Array lima menu awal dan operasi penyimpanan
│   ├── middleware/                   # logger, cekApiKey, validasi, notFound, errorHandler
│   ├── validators/menu.validator.js # Skema Joi untuk POST dan PUT
│   └── utils/AppError.js            # Error berisi status, pesan, dan kode
├── requests.http                    # Skenario REST Client berhasil dan gagal
├── test/menu.test.js                # Pengujian HTTP otomatis
└── screenshot/                      # Bukti pengujian; diisi saat praktik
```

Alur empat lapis: **routes** memilih rute/middleware → **controllers** menangani HTTP → **services** memeriksa aturan bisnis → **data** menyimpan dan membaca array. Service dibuat `async` tanpa `req`/`res`. Data baru dan perubahan akan hilang saat server dimulai ulang.

## Endpoint

| Method | URL | Middleware | Status berhasil / gagal |
| --- | --- | --- | --- |
| GET | `/menu` | logger | 200 |
| GET | `/menu?kategori=minuman` | logger | 200, hasil terfilter |
| GET | `/menu/:id` | logger | 200 / 404 `NOT_FOUND` |
| POST | `/menu` | logger → cekApiKey → validasi | 201 / 401 / 422 / 409 |
| DELETE | `/menu/:id` | logger → cekApiKey | 204 / 401 / 404 |
| PUT **(bonus)** | `/menu/:id` | logger → cekApiKey → validasi | 200 / 401 / 422 / 404 / 409 |

Respons sukses GET daftar: `{ "data": [...], "meta": { "total": 5 } }`. Detail, POST, dan PUT: `{ "data": { ... } }`. DELETE sukses menggunakan status 204 **tanpa body**. ID di URL dikonversi dari string menjadi angka di service. Untuk PUT, kirim data menu lengkap seperti POST; `tersedia` boleh dihilangkan dan akan bernilai `true`.

Logger mencetak satu baris per request: `METHOD URL -> STATUS (n ms)`. Logger dipasang sebelum `express.json()` agar JSON yang rusak pun tercatat. `notFound` dan `errorHandler` dipasang sesudah router; `errorHandler` memiliki empat parameter.

## Aturan Validasi, Aturan Bisnis, dan Kode Error

| Field | Aturan Joi |
| --- | --- |
| `nama` | String, 3–50 karakter, wajib; spasi di awal/akhir dipangkas |
| `harga` | Bilangan bulat 1.000–100.000, wajib |
| `kategori` | Salah satu `makanan`, `minuman`, `camilan`, wajib |
| `tersedia` | Boolean, default `true` |

Validasi memakai `abortEarly: false`, sehingga semua pelanggaran digabung dalam satu pesan 422. Nama menu tidak boleh sama meskipun huruf besar/kecil berbeda: service memeriksa data yang sudah ada dan mengirim **409 `NAMA_DUPLIKAT`**. Aturan ini bukan tugas Joi karena memerlukan pembacaan data yang tersimpan. Saat PUT, nama milik item yang sedang diubah tetap diperbolehkan.

Semua kegagalan berbentuk `{ "error": { "pesan": "...", "kode": "..." } }`:

| Status | Kode | Penyebab |
| --- | --- | --- |
| 400 | `REQUEST_ERROR` | JSON permintaan rusak |
| 401 | `UNAUTHORIZED` | API key tidak ada, salah, atau belum disetel di server |
| 404 | `NOT_FOUND` | ID menu tidak ada |
| 404 | `ROUTE_NOT_FOUND` | URL atau method tidak dikenali |
| 409 | `NAMA_DUPLIKAT` | Nama menu sudah dipakai |
| 422 | `VALIDATION_ERROR` | Isi POST/PUT tidak sesuai skema |
| 500 | `INTERNAL_ERROR` | Kesalahan server tak terduga; detail hanya dicatat di terminal |

## Pengujian

1. Jalankan server, lalu buka `requests.http` di VS Code dengan ekstensi **REST Client** (`humao.rest-client`). Klik **Send Request** pada setiap blok. File ini memuat GET daftar/filter/detail, 404 data/rute, POST 201/401/422/409, DELETE 204/404, dan bonus PUT berhasil/gagal. Jalankan blok DELETE `/menu/5` sekali saja per server dimulai; jika diulang, hasilnya 404.
2. `npm test` menguji endpoint secara otomatis, termasuk perbedaan huruf pada nama duplikat, beberapa kesalahan Joi sekaligus, default `tersedia`, PUT, DELETE tanpa body, dan server tanpa `API_KEY`.
3. Untuk **bukti error 500**, ubah sementara `menu.push(baru)` menjadi `menu.dorong(baru)` di `src/data/menu.data.js`. Kirim blok terakhir di `requests.http` (POST `Lontong Sayur` dengan key yang benar). Ambil screenshot respons klien **500**, pesan umum `Terjadi kesalahan pada server`, serta terminal server yang menampilkan jejak error. **Kembalikan `menu.push(baru)` sebelum commit**, kemudian jalankan `npm test` lagi. Jangan commit kode yang sengaja dirusak.

Screenshot hasil pengujian tersimpan di `screenshot/`:

| Bukti | Keterangan |
| --- | --- |
| [Logger](screenshot/logger.png) | Terminal mencatat satu baris per request dengan status 404, 401, 422, 201, dan 204. |
| [GET 404](screenshot/get-404.png) | GET dengan ID menu yang tidak ada menghasilkan 404 `NOT_FOUND`. |
| [Rute 404](screenshot/route-404.png) | GET ke URL tak dikenal menghasilkan 404 `ROUTE_NOT_FOUND`. |
| [POST 401](screenshot/post-401.png) | POST tanpa API key ditolak dengan 401 `UNAUTHORIZED`. |
| [POST 422](screenshot/post-422.png) | POST dengan tiga field salah ditolak dengan 422 `VALIDATION_ERROR` dan menampilkan semua kesalahannya. |
| [POST 409](screenshot/post-409.png) | Nama menu yang sudah ada, meskipun kapitalisasinya berbeda, ditolak dengan 409 `NAMA_DUPLIKAT`. |
| [POST 201](screenshot/post-201.png) | POST valid menambahkan menu baru dengan status 201 dan nilai bawaan `tersedia: true`. |
| [DELETE 204](screenshot/delete-204.png) | DELETE berhasil menghasilkan status 204 tanpa isi respons. |
| [PUT 200](screenshot/put-200.png) | Bonus PUT mengubah data menu dan menghasilkan status 200. |
| [Error 500 di klien](screenshot/error-500-client.png) | Saat lapis data sengaja dibuat salah, klien hanya menerima pesan umum dan kode `INTERNAL_ERROR`. |
| [Error 500 di terminal](screenshot/error-500-terminal.png) | Jejak lengkap `TypeError` terlihat di terminal, bukan di respons klien. Kode sudah dikembalikan ke `menu.push(baru)`. |
| [File requests.http](screenshot/requests-http.png) | Koleksi permintaan REST Client memuat skenario berhasil dan gagal di VS Code. |

## Deklarasi Penggunaan AI

| Bagian | Alat AI | Dipakai untuk apa | Cara saya memeriksa hasilnya |
| --- | --- | --- | --- |
| Struktur proyek dan endpoint | OpenCode (AI) | Menyusun implementasi Varian B empat lapis, GET/POST/DELETE dan bonus PUT | Meninjau file, menjalankan `npm test`, dan menguji blok `requests.http` di REST Client |
| Middleware dan error terpusat | OpenCode (AI) | Menulis logger, cekApiKey, validasi, AppError, notFound, errorHandler | Memeriksa respons 401, 404, 422, 500 dan logger pada screenshot serta menjalankan tes otomatis |
| Skema Joi dan aturan 409 | OpenCode (AI) | Membuat aturan field dan pengecekan nama duplikat di service | Menguji input tidak valid sekaligus dan nama yang beda kapitalisasi |
| Dokumentasi dan pengujian | OpenCode (AI) | Menyusun README, `requests.http`, dan tes otomatis | Memeriksa kesesuaian dengan laman tugas dan materi, menjalankan `npm test` |

Contoh prompt yang dipakai: **“apakah kmu bisa melihat isi web ini? tolong cek semuanya karena ada tugasku juga disini ... ini adalah materi materinya yg akan kita jadikan panduan untuk mengerjakan tugas web ku”** (disertai tautan tugas dan materi); kemudian saya memberikan NIM **F12D02410080** untuk menentukan varian.

**Pernyataan:** Saya menggunakan AI pada bagian yang tertulis di tabel. Saya tetap harus memeriksa sendiri hasil pengujian REST Client, mengambil screenshot asli, dan memahami kode sebelum mengumpulkan tugas.

## Kesimpulan & Kendala

Sebelum error terpusat, masing-masing rute dapat mengembalikan bentuk kesalahan yang berbeda. Sekarang setiap kegagalan diteruskan ke satu `errorHandler`, sehingga formatnya seragam dan detail error 500 tidak bocor ke klien. Kesulitan utama adalah memastikan urutan middleware: API key diperiksa sebelum Joi; logger sebelum rute; `notFound` dan `errorHandler` setelah seluruh rute. Masalah lain adalah `req.params.id` berbentuk string, sehingga perlu diubah ke angka sebelum mencari data.
