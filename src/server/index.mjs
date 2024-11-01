import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import createAuthRouter from './routes/auth.mjs';
import createAdminRouter from './routes/admin.js';
import createCoursesRouter from './routes/courses.js';
import createLessonsRouter from './routes/lessons.js';
import createQuizzesRouter from './routes/quizzes.js';
import createStudentRouter from './routes/student.js';
import { authenticateToken, isAdmin } from './middleware.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();
const app = express();

// Configure CORS
const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:8082',
      'http://192.168.0.42:8082',
      'http://187.67.178.233:8082',
      'https://192.168.0.42:8082',
      'https://187.67.178.233:8082'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.match(/^http:\/\/192\.168\.\d+\.\d+:8082$/)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.options('*', cors(corsOptions));

// Serve uploaded files
app.use('/uploads', express.static(join(__dirname, '../../uploads'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.mp4')) {
      res.set({
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes'
      });
    } else if (path.endsWith('.pdf')) {
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline'
      });
    } else if (path.match(/\.(jpg|jpeg|png|gif)$/i)) {
      res.set({
        'Content-Type': 'image/*',
        'Cache-Control': 'public, max-age=31536000'
      });
    }
  }
}));

// Serve static files
app.use(express.static(join(__dirname, '../../dist')));

// Auth routes (public)
const authRouter = createAuthRouter(prisma);
app.use('/api/auth', authRouter);

// Public course routes
const publicCoursesRouter = createCoursesRouter(prisma);
app.use('/api/courses/public', publicCoursesRouter);

// Protected routes
app.use('/api/*', authenticateToken);

// Admin routes
const adminRouter = createAdminRouter(prisma);
app.use('/api/admin', isAdmin, adminRouter);

// Course routes
const coursesRouter = createCoursesRouter(prisma);
app.use('/api/courses', coursesRouter);

// Lesson routes
const lessonsRouter = createLessonsRouter(prisma);
app.use('/api/disciplines', isAdmin, lessonsRouter);

// Quiz routes
const quizzesRouter = createQuizzesRouter(prisma);
app.use('/api/disciplines', isAdmin, quizzesRouter);

// Student routes
const studentRouter = createStudentRouter(prisma);
app.use('/api/student', studentRouter);

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
