import express from 'express';
import menuRoutes from './src/routes/menu.routes.js';
import { logger } from './src/middleware/logger.js';
import { notFound } from './src/middleware/notFound.js';
import { errorHandler } from './src/middleware/errorHandler.js';

const app = express();

// Logger lebih dulu agar JSON yang tidak valid pun tetap tercatat.
app.use(logger);
app.use(express.json());
app.use('/menu', menuRoutes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;
const server = app.listen(PORT, (err) => {
  if (err) {
    console.error('Gagal menjalankan server:', err);
    process.exit(1);
  }
  console.log(`Server jalan di http://localhost:${server.address().port}`);
});
