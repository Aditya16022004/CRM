/**
 * Express Server Entry Point
 * Enterprise IT Proposal & Inventory Management System
 */

import express from 'express';
import http from 'http';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { auditMiddleware } from './middleware/audit.js';
import { runMigrations, verifyDbConnection } from './db.js';
import { AuthService } from './services/authService.js';
import { initWebSocket } from './realtime/websocket.js';

// Load environment variables from backend/.env regardless of cwd
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// ============ CORS Configuration ============
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow tools like curl/postman
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ============ Security Middleware ============
app.use(helmet());

// Rate limiting (skip OPTIONS so preflight always passes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => req.method === 'OPTIONS',
});
app.use('/api/', limiter);

// ============ Body Parsing ============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============ Audit Middleware ============
app.use(auditMiddleware);

// ============ Health Check ============
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============ API Routes ============
app.use('/api', routes);

// ============ Error Handler ============
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error:', err);

    res.status(500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    });
  }
);

// ============ 404 Handler ============
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
  });
});

// ============ Start Server ============
async function startServer() {
  const dbStatus = await verifyDbConnection();
  if (!dbStatus.ok) {
    console.error('Failed to connect to database. Check DATABASE_URL and database availability.');
    process.exit(1);
  }

  await runMigrations();
  await AuthService.ensureSuperAdmin();

  initWebSocket(server);

  server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║  IT Proposal Management System - Backend API              ║
║  Version: 1.0.0                                           ║
║  Port: ${PORT}                                            ║
║  Environment: ${process.env.NODE_ENV || 'development'}    ║
║  Time: ${new Date().toISOString()}                        ║
╚═══════════════════════════════════════════════════════════╝
  `);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
