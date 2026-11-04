import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { errorHandler } from '../src/middleware/errorHandler.js';

async function jalankanServer(apiKey) {
  const env = { ...process.env, PORT: '0' };
  if (apiKey === undefined) delete env.API_KEY;
  else env.API_KEY = apiKey;

  const server = spawn(process.execPath, ['index.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  const port = await new Promise((resolve, reject) => {
    const batas = setTimeout(() => reject(new Error('Server tidak menyala tepat waktu')), 10000);
    let keluaran = '';
    server.stdout.on('data', chunk => {
      keluaran += chunk.toString();
      const cocok = keluaran.match(/Server jalan di http:\/\/localhost:(\d+)/);
      if (cocok) {
        clearTimeout(batas);
        resolve(Number(cocok[1]));
      }
    });
    server.once('error', err => {
      clearTimeout(batas);
      reject(err);
    });
    server.once('exit', code => {
      clearTimeout(batas);
      reject(new Error(`Server berhenti sebelum siap (kode ${code})`));
    });
  });

  return { server, baseUrl: `http://localhost:${port}` };
}

async function minta(baseUrl, method, path, body, pakaiKunci = false) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (pakaiKunci) headers['x-api-key'] = 'rahasia123';

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const teks = await response.text();
  return { status: response.status, body: teks ? JSON.parse(teks) : null };
}

test('API Kantin: rute, middleware, validasi, aturan bisnis, dan error', async () => {
  const { server, baseUrl } = await jalankanServer('rahasia123');
  try {
    const daftar = await minta(baseUrl, 'GET', '/menu');
    assert.equal(daftar.status, 200);
    assert.equal(daftar.body.meta.total, 5);

    const filter = await minta(baseUrl, 'GET', '/menu?kategori=minuman');
    assert.equal(filter.status, 200);
    assert.equal(filter.body.meta.total, 2);
    assert.ok(filter.body.data.every(item => item.kategori === 'minuman'));

    const detail = await minta(baseUrl, 'GET', '/menu/1');
    assert.equal(detail.status, 200);
    assert.equal(detail.body.data.nama, 'Nasi Goreng Kampung');

    const tidakAda = await minta(baseUrl, 'GET', '/menu/999');
    assert.equal(tidakAda.status, 404);
    assert.equal(tidakAda.body.error.kode, 'NOT_FOUND');

    const ruteSalah = await minta(baseUrl, 'GET', '/tidak-ada');
    assert.equal(ruteSalah.status, 404);
    assert.equal(ruteSalah.body.error.kode, 'ROUTE_NOT_FOUND');

    const tanpaKunci = await minta(baseUrl, 'POST', '/menu', { nama: 'X' });
    assert.equal(tanpaKunci.status, 401);
    assert.equal(tanpaKunci.body.error.kode, 'UNAUTHORIZED');

    const tidakValid = await minta(baseUrl, 'POST', '/menu', {
      nama: 'X', harga: 10, kategori: 'lainnya'
    }, true);
    assert.equal(tidakValid.status, 422);
    assert.equal(tidakValid.body.error.kode, 'VALIDATION_ERROR');
    assert.equal(tidakValid.body.error.pesan.split('; ').length, 3);

    const kembar = await minta(baseUrl, 'POST', '/menu', {
      nama: 'nAsI gOrEnG kAmPuNg', harga: 18000, kategori: 'makanan'
    }, true);
    assert.equal(kembar.status, 409);
    assert.equal(kembar.body.error.kode, 'NAMA_DUPLIKAT');

    const dibuat = await minta(baseUrl, 'POST', '/menu', {
      nama: 'Soto Ayam', harga: 15000, kategori: 'makanan'
    }, true);
    assert.equal(dibuat.status, 201);
    assert.equal(dibuat.body.data.id, 6);
    assert.equal(dibuat.body.data.tersedia, true);

    const diubah = await minta(baseUrl, 'PUT', '/menu/3', {
      nama: 'Es Teh Lemon', harga: 7000, kategori: 'minuman'
    }, true);
    assert.equal(diubah.status, 200);
    assert.equal(diubah.body.data.nama, 'Es Teh Lemon');
    assert.equal(diubah.body.data.tersedia, true);

    const putTidakAda = await minta(baseUrl, 'PUT', '/menu/999', {
      nama: 'Es Jeruk', harga: 6000, kategori: 'minuman'
    }, true);
    assert.equal(putTidakAda.status, 404);
    assert.equal(putTidakAda.body.error.kode, 'NOT_FOUND');

    const putKembar = await minta(baseUrl, 'PUT', '/menu/2', {
      nama: 'NASI GORENG KAMPUNG', harga: 16000, kategori: 'makanan'
    }, true);
    assert.equal(putKembar.status, 409);

    const putTidakValid = await minta(baseUrl, 'PUT', '/menu/2', {
      nama: 'X', harga: 100, kategori: 'minuman'
    }, true);
    assert.equal(putTidakValid.status, 422);

    const putTanpaKunci = await minta(baseUrl, 'PUT', '/menu/2', {
      nama: 'Mie Ayam', harga: 16000, kategori: 'makanan'
    });
    assert.equal(putTanpaKunci.status, 401);

    const hapusTanpaKunci = await minta(baseUrl, 'DELETE', '/menu/5');
    assert.equal(hapusTanpaKunci.status, 401);

    const dihapus = await minta(baseUrl, 'DELETE', '/menu/5', undefined, true);
    assert.equal(dihapus.status, 204);
    assert.equal(dihapus.body, null);

    const hapusTidakAda = await minta(baseUrl, 'DELETE', '/menu/999', undefined, true);
    assert.equal(hapusTidakAda.status, 404);
    assert.equal(hapusTidakAda.body.error.kode, 'NOT_FOUND');

    const jsonRusak = await fetch(`${baseUrl}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'rahasia123' },
      body: '{ngawur'
    });
    assert.equal(jsonRusak.status, 400);
    assert.equal((await jsonRusak.json()).error.kode, 'REQUEST_ERROR');
  } finally {
    server.kill();
  }
});

test('tanpa API_KEY, GET berjalan tetapi perubahan data ditolak', async () => {
  const { server, baseUrl } = await jalankanServer(undefined);
  try {
    assert.equal((await minta(baseUrl, 'GET', '/menu')).status, 200);
    assert.equal((await minta(baseUrl, 'POST', '/menu', {
      nama: 'Soto Ayam', harga: 15000, kategori: 'makanan'
    }, true)).status, 401);
  } finally {
    server.kill();
  }
});

test('error 500 tidak membocorkan detail ke klien, tetapi dicatat di terminal', () => {
  const error = new TypeError('menu.dorong is not a function');
  const response = {
    status(kode) {
      this.statusCode = kode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  const logAsli = console.error;
  let tercatat;
  console.error = err => { tercatat = err; };
  try {
    errorHandler(error, {}, response, () => {});
  } finally {
    console.error = logAsli;
  }

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, {
    error: { pesan: 'Terjadi kesalahan pada server', kode: 'INTERNAL_ERROR' }
  });
  assert.equal(tercatat, error);
});
