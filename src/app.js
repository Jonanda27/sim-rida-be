const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const { errorResponse } = require('./utils/response.util');

const app = express();

// Security & Parsing Middlewares
app.use(helmet());
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes prefix: /api/v1
app.use('/api/v1', routes);

// 404 Not Found Handler
app.use((req, res) => {
  return errorResponse(res, `Route ${req.method} ${req.originalUrl} tidak ditemukan pada server API.`, null, 404);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
