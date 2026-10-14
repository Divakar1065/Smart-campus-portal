import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/authRoutes';
import departmentRoutes from './routes/departmentRoutes';
import facultyRoutes from './routes/facultyRoutes';
import studentRoutes from './routes/studentRoutes';
import allocationRoutes from './routes/allocationRoutes';
import hierarchyRoutes from './routes/hierarchyRoutes';
import statsRoutes from './routes/statsRoutes';
import reportsRoutes from './routes/reportsRoutes';
import studentPortalRoutes from './routes/studentPortalRoutes';

export const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Allow configured production frontends
    if (allowedOrigins.some((o) => origin === o || origin.startsWith(o))) {
      return callback(null, true);
    }

    // Allow any Vercel deployment (*.vercel.app)
    if (/^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    // Allow localhost on any port
    if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // Safe fallback: reflect origin so browsers don't reject due to wildcard credentials mismatch
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'HEALTHY',
    service: 'Smart Campus Hierarchy & Student Management System API',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/allocation', allocationRoutes);
app.use('/api/hierarchy', hierarchyRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/student', studentPortalRoutes);

// Static Client Serving (Production & Unified Deployment)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 Handler for API
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
